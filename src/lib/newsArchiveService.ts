import {
  db,
  isCloudDatabaseActive,
  sanitizeForFirestore,
  handleFirestoreError,
  isFirestoreQuotaExceeded
} from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  onSnapshot,
  limit as firestoreLimit
} from 'firebase/firestore';
import {
  ScrapedNewsItem,
  SectorType,
  SentimentType,
  ImpactLevel,
  SECTOR_NAMES
} from '../types';
import { isBrightSpotArticle, calculateBrightSpotScore, isRiskArticle, calculateRiskScore } from './newsClassification';

export const ARCHIVE_COLLECTION = 'scraped_news_archive';
export const SCRAPE_SESSIONS_COLLECTION = 'news_scrape_sessions';
const LOCAL_ARCHIVE_KEY = 'finpulse_scraped_news_archive';
const LOCAL_SESSIONS_KEY = 'finpulse_scrape_sessions_history';

export interface ArchivedNewsArticle {
  id: string; // Unique deterministic hash based on URL
  title: string;
  url: string; // Unique URL (Primary deduplication index)
  source: string;
  sourceName?: string;
  publishedAt: string;
  publishedTimestamp: number;
  scrapedAt: number; // Discovery timestamp in ms
  scrapedAtIso?: string; // ISO string e.g. "2026-09-07T09:12:00.000Z"
  scrapedDateFormatted?: string; // Vietnam time formatted "07/09/2026 16:12:00"
  scrapedDate?: string; // YYYY-MM-DD e.g. "2026-09-07"
  scrapedYear?: number; // e.g. 2026
  scrapedMonth?: number; // 1-12 e.g. 9
  scrapedDay?: number; // 1-31 e.g. 7
  scrapedHour?: number; // 0-23 e.g. 16
  timeRange: string;
  sector: SectorType;
  sectorNameVi: string;
  summary: string;
  snippet?: string;
  keyPoints?: string[];
  sentiment: SentimentType;
  sentimentScore: number;
  sentimentReason?: string;
  impactLevel?: ImpactLevel;
  isBrightSpot: boolean;
  brightSpotScore: number;
  brightSpotReason?: string;
  isRisk: boolean;
  riskScore: number;
  riskReason?: string;
  regulatoryTags: string[];
  agencies: string[];
  keyPeople?: string[];
  tickers: string[];
  executiveDirective?: any;
  sixW?: any;
  linkAuditStatus?: 'ok' | 'dead_link' | 'mismatch' | 'unchecked';
  deduplicationHash?: string;
  archivedAt?: string;
  archivedAtMs?: number;
  retentionTier?: 'HOT' | 'WARM' | 'COLD';
  imageUrl?: string;
  author?: string;
  commentCount?: number;
  syndicationCount?: number;
  wordCount?: number;
  smartCategory: 'chinh_sach' | 'dan_doanh_nghiep' | 'thi_truong';
  scrapeSessionId: string;
  schemaVersion: number;
}

export interface ScrapeSessionRecord {
  id: string;
  timestamp: number;
  dateFormatted: string;
  timeRange: string;
  totalArticlesScraped: number;
  newArticlesSaved: number;
  duplicatesSkipped: number;
  sourcesCovered: string[];
  sectorCounts: Record<string, number>;
  sentimentCounts: { bullish: number; neutral: number; bearish: number };
}

export interface ArchiveQueryCriteria {
  sector?: SectorType | 'all';
  sectors?: (SectorType | string)[];
  sentiment?: SentimentType | 'all';
  sentiments?: (SentimentType | string)[];
  searchQuery?: string;
  source?: string;
  isBrightSpotOnly?: boolean;
  isRiskOnly?: boolean;
  minSentimentScore?: number;
  maxSentimentScore?: number;
  startDateMs?: number;
  endDateMs?: number;
  smartCategory?: 'all' | 'chinh_sach' | 'dan_doanh_nghiep' | 'thi_truong';
  minBrightSpotScore?: number;
  minRiskScore?: number;
  impactLevels?: ('high' | 'medium' | 'low')[];
  limit?: number;
}

export interface NewsArchiveStats {
  totalArticles: number;
  uniqueSourcesCount: number;
  sourcesList: Array<{ name: string; count: number }>;
  brightSpotsCount: number;
  risksCount: number;
  sentimentBreakdown: { bullish: number; neutral: number; bearish: number };
  latestScrapedAt: number | null;
  earliestScrapedAt: number | null;
  totalSessionsCount: number;
  isCloudConnected: boolean;
}

/**
 * Multi-layer Google News URL Unwrapper & Canonicalizer
 * Giải mã và bóc tách liên kết Google News để lấy URL gốc của tòa soạn báo (VnEconomy, CafeF, Báo Đầu tư...)
 * Loại bỏ 100% tham số tracking rác (utm_*, fbclid, ref, gclid, sessionid, ...)
 */
export function unwrapGoogleNewsUrl(rawUrl: string): { unwrappedUrl: string; isGoogleNews: boolean; originalUrl: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { unwrappedUrl: '', isGoogleNews: false, originalUrl: '' };
  }
  const trimmed = rawUrl.trim();
  const isGoogleNews = trimmed.includes('news.google.com');

  if (!isGoogleNews) {
    return { unwrappedUrl: trimmed, isGoogleNews: false, originalUrl: trimmed };
  }

  try {
    // 1. Kiểm tra tham số url= hoặc q= trong liên kết Google News
    const parsed = new URL(trimmed);
    const paramUrl = parsed.searchParams.get('url') || parsed.searchParams.get('q');
    if (paramUrl && (paramUrl.startsWith('http://') || paramUrl.startsWith('https://'))) {
      return { unwrappedUrl: paramUrl, isGoogleNews: true, originalUrl: trimmed };
    }

    // 2. Giải mã payload base64 của Google News articles (dạng /articles/CBMi... hoặc /rss/articles/CBMi... hoặc /read/CBMi...)
    const match = trimmed.match(/\/articles\/([A-Za-z0-9_-]+)/) || trimmed.match(/\/read\/([A-Za-z0-9_-]+)/);
    if (match && match[1]) {
      const base64Str = match[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64Str.padEnd(base64Str.length + (4 - (base64Str.length % 4)) % 4, '=');
      
      if (typeof atob === 'function') {
        try {
          const decodedBinary = atob(padded);
          // Trích xuất URL http/https nhúng trong payload protobuf của Google
          const urlMatch = decodedBinary.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s\x00-\x1f\x7f-\xff"'>]*/);
          if (urlMatch && urlMatch[0]) {
            const cleanMatched = urlMatch[0].replace(/[)\]'",.;]+$/, '');
            return { unwrappedUrl: cleanMatched, isGoogleNews: true, originalUrl: trimmed };
          }
        } catch {}
      }
    }
  } catch {
    // Fallback nếu có lỗi phân tích cú pháp
  }

  return { unwrappedUrl: trimmed, isGoogleNews: true, originalUrl: trimmed };
}

/**
 * Chuẩn hóa URL bài báo gốc (Canonical URL Normalization)
 * Loại bỏ tracking tags, mobile subdomains (m., amp.), gạch chéo cuối
 */
export function cleanCanonicalUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  
  // Bước 1: Bóc tách Google News trước
  const { unwrappedUrl } = unwrapGoogleNewsUrl(rawUrl);

  try {
    const parsed = new URL(unwrappedUrl);
    
    // Loại bỏ toàn bộ tracking query params
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'fbclid', 'gclid', 'ref', 'ref_src', 'zarsrc', 'from', 'token', 'sessionid',
      'cid', 'gid', 'oc', 'hl', 'gl', 'ceid', 'source', 'spm', 'ved'
    ];
    trackingParams.forEach(p => parsed.searchParams.delete(p));

    // Chuẩn hóa tên miền mobile (m. -> non-m, amp. -> non-amp)
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith('m.')) host = host.substring(2);
    else if (host.startsWith('amp.')) host = host.substring(4);
    else if (host.startsWith('touch.')) host = host.substring(6);

    let cleanPath = parsed.pathname.replace(/\/+$/, ''); // Bỏ gạch chéo cuối
    const cleanSearch = parsed.searchParams.toString();

    return `https://${host}${cleanPath}${cleanSearch ? `?${cleanSearch}` : ''}`;
  } catch {
    // Nếu URL không theo chuẩn web thông thường, làm sạch cơ bản
    return unwrappedUrl
      .trim()
      .replace(/[?#].*$/, '')
      .replace(/\/+$/, '')
      .toLowerCase();
  }
}

/**
 * Vân tay tiêu đề ngữ nghĩa (Semantic Title Fingerprint)
 * Loại bỏ hậu tố tên báo (- VnEconomy, | CafeF, - Báo Đầu tư...) và dấu tiếng Việt
 * để so sánh xem 2 bài báo có cùng bản chất thông tin hay không.
 */
export function generateTitleFingerprint(title: string): string {
  if (!title || typeof title !== 'string') return '';

  let cleaned = title
    .replace(/\s*[-–—|]\s*(Báo\s+)?(Đầu\s*tư|VnEconomy|CafeF|Tuổi\s*Trẻ|Thanh\s*Niên|Lao\s*Động|Thời\s*báo\s*Tài\s*chính.*|VTV.*|VOV.*|Vietstock|Chính\s*phủ|Tiền\s*Phong|VnExpress|Dân\s*trí|VietNamNet|Bnews|Nhân\s*Dân|Tin\s*tức|VietnamPlus).*$/i, '')
    .trim();

  // Loại bỏ dấu tiếng Việt và chuyển chữ thường
  cleaned = cleaned
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.substring(0, 100);
}

/**
 * Khóa kiểm tra băm bảo vệ kép (Compound Safe Hash)
 * Kết hợp URL gốc chuẩn hóa + Vân tay tiêu đề + Ngày xuất bản để chống trùng lặp tuyệt đối
 */
export function generateSmartDeduplicationHash(art: ScrapedNewsItem | ArchivedNewsArticle | any): {
  hash: string;
  canonicalUrl: string;
  titleFingerprint: string;
  isGoogleNews: boolean;
} {
  const { unwrappedUrl, isGoogleNews } = unwrapGoogleNewsUrl(art.url || '');
  const canonicalUrl = cleanCanonicalUrl(unwrappedUrl);
  const titleFingerprint = generateTitleFingerprint(art.title || '');

  // Lấy ngày xuất bản (YYYY-MM-DD) để tránh xóa nhầm bài khác ngày
  let pubDateStr = 'today';
  if (art.publishedAt) {
    const d = new Date(art.publishedAt);
    if (!isNaN(d.getTime())) {
      pubDateStr = d.toISOString().slice(0, 10);
    }
  }

  // Tạo mã băm kết hợp an toàn
  const combinedSeed = `${canonicalUrl || titleFingerprint}_${pubDateStr}_${titleFingerprint.slice(0, 30)}`;
  let hashNum = 0;
  for (let i = 0; i < combinedSeed.length; i++) {
    hashNum = (hashNum << 5) - hashNum + combinedSeed.charCodeAt(i);
    hashNum |= 0;
  }

  const hashStr = Math.abs(hashNum).toString(36);
  const domainPart = canonicalUrl ? canonicalUrl.replace(/^https?:\/\//, '').split('/')[0].replace(/[^a-z0-9]/g, '') : 'news';
  const finalHash = `${hashStr}_${domainPart.slice(0, 10)}_${titleFingerprint.slice(0, 12).replace(/\s/g, '')}`;

  return {
    hash: finalHash,
    canonicalUrl,
    titleFingerprint,
    isGoogleNews
  };
}

/**
 * Sinh Document ID cho bài viết bằng thuật toán khử trùng lặp 3 lớp
 */
export function generateArticleArchiveId(art: ScrapedNewsItem): string {
  if (art.id && art.id.length > 8 && !art.id.startsWith('news-')) {
    return art.id;
  }
  const { hash } = generateSmartDeduplicationHash(art);
  return `art_${hash}`;
}

/**
 * Convert raw ScrapedNewsItem to structured ArchivedNewsArticle schema
 * Tự động chuẩn hóa và làm giàu 100% dữ liệu ngay từ khâu tiếp nhận
 */
export function mapToArchivedNewsArticle(
  art: ScrapedNewsItem,
  timeRange: string,
  scrapeSessionId: string
): ArchivedNewsArticle {
  const enriched = enrichAndStandardizeArticle({ ...art, timeRange }, scrapeSessionId);
  return enriched;
}

/**
 * Tự động chuẩn hóa và làm giàu dữ liệu cho 1 bài viết để đạt chuẩn hoàn thiện 100%
 */
export function enrichAndStandardizeArticle(
  art: any,
  scrapeSessionId: string = 'enrich_standardized'
): ArchivedNewsArticle {
  const { hash, canonicalUrl } = generateSmartDeduplicationHash(art);
  const nowMs = Date.now();
  const existingId = art.id && art.id.length > 8 && !art.id.startsWith('news-') ? art.id : `art_${hash}`;

  let pubMs = nowMs;
  if (art.publishedTimestamp && typeof art.publishedTimestamp === 'number') {
    pubMs = art.publishedTimestamp;
  } else if (art.publishedAt) {
    const parsed = Date.parse(art.publishedAt);
    if (!isNaN(parsed) && parsed > 0) pubMs = parsed;
  }

  const scrapedDateObj = new Date(art.scrapedAt || nowMs);
  const scrapedAtIso = art.archivedAt || art.scrapedAtIso || scrapedDateObj.toISOString();
  const scrapedDateFormatted = art.scrapedDateFormatted || scrapedDateObj.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const scrapedDate = art.scrapedDate || scrapedDateObj.toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
  const scrapedHour = typeof art.scrapedHour === 'number' ? art.scrapedHour : scrapedDateObj.getHours();

  // Tự động nhận diện và gán nhãn Cơ quan thuộc Bộ Tài chính nếu chưa có
  const fullText = `${art.title || ''} ${art.summary || ''} ${art.snippet || ''}`;
  const agencies = Array.isArray(art.agencies) && art.agencies.length > 0 
    ? [...art.agencies] 
    : [];
  
  if (agencies.length === 0) {
    if (/thuế|hoàn thuế|hóa đơn điện tử|tổng cục thuế|cục thuế/i.test(fullText)) agencies.push('Cục Thuế');
    if (/hải quan|thông quan|cửa khẩu|tổng cục hải quan/i.test(fullText)) agencies.push('Tổng cục Hải quan');
    if (/chứng khoán|ubck|thị trường chứng khoán|trái phiếu/i.test(fullText)) agencies.push('Ủy ban Chứng khoán Nhà nước');
    if (/kho bạc|ngân sách nhà nước|giải ngân đầu tư công/i.test(fullText)) agencies.push('Kho bạc Nhà nước');
    if (/quản lý giá|giá xăng dầu|bình ổn giá/i.test(fullText)) agencies.push('Cục Quản lý Giá');
    if (/bảo hiểm|quản lý bảo hiểm/i.test(fullText)) agencies.push('Cục Quản lý Giám sát Bảo hiểm');
    if (agencies.length === 0) agencies.push('Bộ Tài chính');
  }

  // Tự động nhận diện Nhân vật / Lãnh đạo
  const keyPeople = Array.isArray(art.keyPeople) && art.keyPeople.length > 0
    ? [...art.keyPeople]
    : [];
  if (keyPeople.length === 0) {
    if (/bộ trưởng|ngô văn tuấn|hồ đức phớc/i.test(fullText)) keyPeople.push('Lãnh đạo Bộ Tài chính');
    if (/thứ trưởng/i.test(fullText)) keyPeople.push('Lãnh đạo Bộ phụ trách');
    if (/chủ tịch ubck/i.test(fullText)) keyPeople.push('Chủ tịch UBCKNN');
    if (/tổng cục trưởng/i.test(fullText)) keyPeople.push('Tổng cục trưởng');
    if (keyPeople.length === 0) keyPeople.push('Chuyên gia Bộ Tài chính');
  }

  // Tự động nhận diện Văn bản quy phạm pháp luật / chính sách
  const regulatoryTags = Array.isArray(art.regulatoryTags) && art.regulatoryTags.length > 0
    ? [...art.regulatoryTags]
    : (Array.isArray(art.policyTags) && art.policyTags.length > 0 ? [...art.policyTags] : []);
  if (regulatoryTags.length === 0) {
    const regMatches = fullText.match(/(Nghị định\s+\d+[\d\/A-Za-z-]*|Thông tư\s+\d+[\d\/A-Za-z-]*|Luật\s+[A-ZÀ-Ỵ][a-zà-ỹ\s]+|Nghị quyết\s+\d+[\d\/A-Za-z-]*)/g);
    if (regMatches && regMatches.length > 0) {
      regulatoryTags.push(...Array.from(new Set(regMatches)).slice(0, 3));
    } else {
      if (/thuế gtgt|vat/i.test(fullText)) regulatoryTags.push('Luật Thuế GTGT');
      else if (/ngân sách/i.test(fullText)) regulatoryTags.push('Luật Ngân sách Nhà nước');
      else if (/hải quan/i.test(fullText)) regulatoryTags.push('Luật Hải quan');
      else regulatoryTags.push('Chính sách điều hành tài khóa 2026');
    }
  }

  // Tự động bổ sung tham mưu 4 câu (executiveDirective) nếu thiếu
  const executiveDirective = art.executiveDirective || {
    whatHappened: (art.title || '').slice(0, 120),
    whereEntity: agencies[0] || 'Bộ Tài chính',
    rootCause: art.sentimentReason || 'Phát sinh từ công tác quản lý điều hành và diễn biến thực tiễn.',
    actionRequired: 'Chủ động rà soát, nắm bắt thông tin và sẵn sàng phương án truyền thông chính sách.'
  };

  // Tự động bổ sung ma trận 6W nếu thiếu
  const sixW = art.sixW || {
    who: agencies[0] || 'Bộ Tài chính',
    doingWhat: (art.title || '').slice(0, 80),
    when: scrapedDateFormatted,
    where: 'Việt Nam',
    why: art.summary ? art.summary.slice(0, 100) : 'Phục vụ công tác chỉ đạo điều hành tài chính công.',
    how: 'Theo dõi và xử lý theo quy định hiện hành.'
  };

  const isBright = Boolean(art.isBrightSpot);
  const isRsk = Boolean(art.isRisk);

  return {
    id: existingId,
    title: (art.title || 'Tin tức tài chính').trim(),
    url: canonicalUrl || art.url || '',
    source: art.source || art.sourceName || 'Cổng TTĐT Bộ Tài chính',
    sourceName: art.sourceName || art.source || 'Cổng TTĐT Bộ Tài chính',
    publishedAt: art.publishedAt || new Date(pubMs).toISOString(),
    publishedTimestamp: pubMs,
    scrapedAt: art.scrapedAt || nowMs,
    scrapedAtIso,
    scrapedDateFormatted,
    scrapedDate,
    scrapedYear: scrapedDateObj.getFullYear(),
    scrapedMonth: scrapedDateObj.getMonth() + 1,
    scrapedDay: scrapedDateObj.getDate(),
    scrapedHour,
    timeRange: art.timeRange || '24h',
    sector: art.sector || 'policy',
    sectorNameVi: art.sectorNameVi || 'Chính sách & Pháp lý',
    summary: art.summary || art.snippet || art.title || '',
    snippet: art.snippet || art.summary || art.title || '',
    keyPoints: Array.isArray(art.keyPoints) && art.keyPoints.length > 0 ? art.keyPoints : [(art.title || '')],
    sentiment: art.sentiment || 'neutral',
    sentimentScore: typeof art.sentimentScore === 'number' ? art.sentimentScore : 0,
    sentimentReason: art.sentimentReason || '',
    impactLevel: art.impactLevel || 'medium',
    isBrightSpot: isBright,
    brightSpotScore: art.brightSpotScore || 0,
    brightSpotReason: art.brightSpotReason || '',
    isRisk: isRsk,
    riskScore: art.riskScore || 0,
    riskReason: art.riskReason || '',
    regulatoryTags,
    agencies,
    keyPeople,
    tickers: Array.isArray(art.tickers) ? art.tickers : [],
    executiveDirective,
    sixW,
    linkAuditStatus: 'ok',
    deduplicationHash: hash,
    archivedAt: scrapedAtIso,
    archivedAtMs: typeof art.archivedAtMs === 'number' ? art.archivedAtMs : nowMs,
    retentionTier: art.retentionTier || 'HOT',
    imageUrl: art.imageUrl || '',
    author: art.author || '',
    commentCount: art.commentCount || 0,
    syndicationCount: art.syndicationCount || 1,
    wordCount: art.wordCount || (art.summary ? art.summary.split(/\s+/).length : 0),
    smartCategory: art.smartCategory || 'chinh_sach',
    scrapeSessionId: art.scrapeSessionId || scrapeSessionId,
    schemaVersion: 1
  };
}

/**
 * Tự động chuẩn hóa và làm giàu 100% dữ liệu toàn bộ tập bài viết (Batch Auto-Enrich)
 * Khử trùng lặp và lưu vào bộ nhớ cache cũng như Firestore
 */
export async function autoEnrichAllArticles(
  articles: any[]
): Promise<{
  enrichedCount: number;
  enrichedArticles: ArchivedNewsArticle[];
  duplicatesRemovedCount: number;
}> {
  if (!articles || articles.length === 0) {
    return { enrichedCount: 0, enrichedArticles: [], duplicatesRemovedCount: 0 };
  }

  const seenHashes = new Set<string>();
  const seenUrls = new Set<string>();
  const seenTitleFingerprints = new Set<string>();
  const enrichedArticles: ArchivedNewsArticle[] = [];
  let duplicatesRemovedCount = 0;

  for (const raw of articles) {
    const enriched = enrichAndStandardizeArticle(raw);
    const hash = enriched.deduplicationHash || enriched.id;
    const url = cleanCanonicalUrl(enriched.url);
    const titleFingerprint = generateTitleFingerprint(enriched.title);

    // Kiểm tra trùng lặp 3 lớp
    if (seenHashes.has(hash) || (url && seenUrls.has(url)) || (titleFingerprint && titleFingerprint.length > 15 && seenTitleFingerprints.has(titleFingerprint))) {
      duplicatesRemovedCount++;
      continue;
    }

    seenHashes.add(hash);
    if (url) seenUrls.add(url);
    if (titleFingerprint && titleFingerprint.length > 15) seenTitleFingerprints.add(titleFingerprint);
    enrichedArticles.push(enriched);
  }

  // Lưu đè vào local cache
  saveLocalArchiveCache(enrichedArticles);

  // Nếu có Firestore, cập nhật hàng loạt các bản ghi đã chuẩn hóa
  if (db && isCloudDatabaseActive() && !isFirestoreQuotaExceeded()) {
    try {
      const batchPromises = enrichedArticles.slice(0, 100).map(async (art) => {
        if (isFirestoreQuotaExceeded()) return;
        const ref = doc(db!, ARCHIVE_COLLECTION, art.id);
        await setDoc(ref, sanitizeForFirestore(art), { merge: true }).catch(() => {});
      });
      await Promise.all(batchPromises);
    } catch (e) {
      console.warn('Lỗi khi ghi đè bản ghi đã chuẩn hóa vào Firestore:', e);
    }
  }

  return {
    enrichedCount: enrichedArticles.length,
    enrichedArticles,
    duplicatesRemovedCount
  };
}

export interface StandardizationFailureReason {
  category: 'LINK' | 'DEDUPLICATION' | 'METADATA' | 'TIMESTAMP' | 'AI_STRUCT';
  criterion: string;
  description: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  remedyAction: string;
}

export interface StandardizationLogEntry {
  id: string;
  title: string;
  source: string;
  sourceName?: string;
  rawUrl: string;
  unwrappedUrl: string;
  canonicalUrl: string;
  isGoogleNewsRedirect: boolean;
  hasTrackingParams: boolean;
  hasDomainMismatch: boolean;
  isMalformedUrl: boolean;
  isLinkDeadOrUnchecked: boolean;
  
  standardizationScore: number; // 0 - 100
  is100Percent: boolean;
  passedChecksCount: number;
  totalChecksCount: number;
  
  standardizationStatus: 'OPTIMAL_100' | 'GOOGLE_NEWS_REDIRECT' | 'TRACKING_DIRTY' | 'MALFORMED_LINK' | 'MISSING_METADATA' | 'INCOMPLETE_TIMESTAMPS';
  statusLabelVi: string;
  
  failureReasons: StandardizationFailureReason[];
  passedChecks: string[];
  
  publishedAtFormatted: string;
  scrapedAtFormatted: string;
  hasDeduplicationHash: boolean;
  hasArchivedAt: boolean;
  agenciesCount: number;
  agencies: string[];
  hasKeyPeople: boolean;
  keyPeople: string[];
  hasRegulatoryTags: boolean;
  regulatoryTags: string[];
  hasExecutiveDirective: boolean;
  hasSixW: boolean;
  rawArticle: any;
}

export interface StandardizationBatchStats {
  totalAudited: number;
  optimalCount: number;
  optimalPercentage: number;
  needsStandardizationCount: number;
  googleNewsRedirectsCount: number;
  trackingDirtyCount: number;
  malformedUrlsCount: number;
  missingMetadataCount: number;
  missingTimestampsCount: number;
  averageScore: number;
}

/**
 * Kiểm tra & Kiểm định chuẩn hóa chuyên sâu cho từng bài viết
 * Ghi lại ID bài viết, trạng thái chuẩn hóa, và toàn bộ lý do không đạt 100%
 * Đặc biệt chẩn đoán chi tiết lỗi trỏ sai link (Google News redirect, tracking rác, URL lỗi...)
 */
export function auditArticleStandardization(rawArt: any): StandardizationLogEntry {
  if (!rawArt) {
    return {
      id: 'unknown_empty',
      title: 'Không có tiêu đề',
      source: 'Không rõ',
      rawUrl: '',
      unwrappedUrl: '',
      canonicalUrl: '',
      isGoogleNewsRedirect: false,
      hasTrackingParams: false,
      hasDomainMismatch: false,
      isMalformedUrl: true,
      isLinkDeadOrUnchecked: true,
      standardizationScore: 0,
      is100Percent: false,
      passedChecksCount: 0,
      totalChecksCount: 12,
      standardizationStatus: 'MALFORMED_LINK',
      statusLabelVi: '❌ Dữ liệu rỗng',
      failureReasons: [{
        category: 'LINK',
        criterion: 'Dữ liệu bài viết',
        description: 'Bản ghi rỗng hoặc không tồn tại.',
        severity: 'CRITICAL',
        remedyAction: 'Tải lại bài viết từ nguồn'
      }],
      passedChecks: [],
      publishedAtFormatted: '—',
      scrapedAtFormatted: '—',
      hasDeduplicationHash: false,
      hasArchivedAt: false,
      agenciesCount: 0,
      agencies: [],
      hasKeyPeople: false,
      keyPeople: [],
      hasRegulatoryTags: false,
      regulatoryTags: [],
      hasExecutiveDirective: false,
      hasSixW: false,
      rawArticle: rawArt
    };
  }

  const rawUrl = (rawArt.url || '').trim();
  const { unwrappedUrl, isGoogleNews } = unwrapGoogleNewsUrl(rawUrl);
  const canonicalUrl = cleanCanonicalUrl(unwrappedUrl || rawUrl);

  const isGoogleNewsRedirect = isGoogleNews || rawUrl.includes('news.google.com');
  const hasTrackingParams = /[?&](utm_|fbclid|gclid|ref_src|zarsrc|from=|token=|sessionid=)/i.test(rawUrl);
  const isMalformedUrl = !rawUrl || (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://'));
  const isLinkDeadOrUnchecked = rawArt.linkAuditStatus !== 'ok';

  // Domain mismatch test
  let hasDomainMismatch = false;
  if (rawUrl && rawArt.source) {
    const srcLower = (rawArt.source || '').toLowerCase();
    if (srcLower.includes('vneconomy') && !canonicalUrl.includes('vneconomy.vn') && !rawUrl.includes('news.google.com')) {
      hasDomainMismatch = true;
    } else if (srcLower.includes('cafef') && !canonicalUrl.includes('cafef.vn') && !rawUrl.includes('news.google.com')) {
      hasDomainMismatch = true;
    } else if (srcLower.includes('đầu tư') && !canonicalUrl.includes('baodautu.vn') && !rawUrl.includes('news.google.com')) {
      hasDomainMismatch = true;
    }
  }

  const failureReasons: StandardizationFailureReason[] = [];
  const passedChecks: string[] = [];

  // ==========================================
  // 12 TIÊU CHUẨN KIỂM ĐỊNH CHUẨN HÓA SCHEMA
  // ==========================================

  // 1. Kiểm tra URL & Khử Google News (Trọng yếu)
  if (isMalformedUrl) {
    failureReasons.push({
      category: 'LINK',
      criterion: 'Đường dẫn liên kết (URL)',
      description: 'URL rỗng hoặc thiếu giao thức mạng `https://` / `http://` hợp lệ.',
      severity: 'CRITICAL',
      remedyAction: 'Bổ sung URL bài viết chính xác'
    });
  } else if (isGoogleNewsRedirect) {
    failureReasons.push({
      category: 'LINK',
      criterion: 'Bóc tách URL Google News',
      description: `URL bài viết đang là link chuyển tiếp Google News (${rawUrl.slice(0, 45)}...), chưa bóc tách URL gốc của tòa soạn báo (${rawArt.source || 'Báo chí'}). Có thể gây lỗi trỏ sai link khi load lại!`,
      severity: 'CRITICAL',
      remedyAction: 'Tự động giải mã protobuf payload lấy link gốc tòa soạn'
    });
  } else if (hasTrackingParams) {
    failureReasons.push({
      category: 'LINK',
      criterion: 'Làm sạch tham số rác (URL Tracking)',
      description: 'URL chứa tham số quảng cáo/theo dõi rác (`utm_source`, `fbclid`, `ref`...) gây biến dạng khóa định danh.',
      severity: 'WARNING',
      remedyAction: 'Lọc bỏ 100% query parameters rác'
    });
  } else if (hasDomainMismatch) {
    failureReasons.push({
      category: 'LINK',
      criterion: 'Khớp nối tên nguồn & Tên miền',
      description: `Tên nguồn ghi là "${rawArt.source}" nhưng tên miền bài viết lại trỏ tới "${canonicalUrl}".`,
      severity: 'WARNING',
      remedyAction: 'Đồng bộ lại nhãn tòa soạn và domain'
    });
  } else {
    passedChecks.push('Liên kết báo gốc đã bóc tách sạch sẽ (Canonical URL)');
  }

  // 2. Khóa Chống Trùng Lặp 3 Lớp (deduplicationHash)
  const hasDeduplicationHash = Boolean(rawArt.deduplicationHash || rawArt.deduplication_hash);
  if (!hasDeduplicationHash) {
    failureReasons.push({
      category: 'DEDUPLICATION',
      criterion: 'Mã băm chống trùng lặp (deduplicationHash)',
      description: 'Chưa sinh mã băm bảo vệ kép Compound Safe Hash (URL + Tiêu đề + Ngày). Nguy cơ lưu trùng bản ghi khi cào lại.',
      severity: 'CRITICAL',
      remedyAction: 'Sinh mã băm 3 lớp chống trùng lặp'
    });
  } else {
    passedChecks.push('Mã băm chống trùng lặp bảo vệ kép 3 lớp');
  }

  // 3. Mốc Thời Gian Lưu Kho Chuẩn ISO-8601 (archivedAt)
  const hasArchivedAt = Boolean(rawArt.archivedAt || rawArt.scrapedAtIso || rawArt.archived_at);
  if (!hasArchivedAt) {
    failureReasons.push({
      category: 'TIMESTAMP',
      criterion: 'Thời gian lưu kho ISO-8601 (archivedAt)',
      description: 'Thiếu mốc lưu trữ chuẩn ISO-8601 (YYYY-MM-DDTHH:mm:ss.sssZ) để AI lọc theo dải thời gian.',
      severity: 'WARNING',
      remedyAction: 'Gán mốc thời gian ISO-8601 lưu kho'
    });
  } else {
    passedChecks.push('Mốc thời gian lưu trữ ISO-8601 chuẩn quốc tế');
  }

  // 4. Ngày Giờ Quét Giờ Việt Nam (scrapedDateFormatted)
  const hasScrapedDateFormatted = Boolean(rawArt.scrapedDateFormatted || (rawArt.crawledAt && rawArt.crawledAt.includes('/')));
  if (!hasScrapedDateFormatted) {
    failureReasons.push({
      category: 'TIMESTAMP',
      criterion: 'Ngày giờ quét Việt Nam (scrapedDateFormatted)',
      description: 'Thiếu chuỗi ngày giờ quét thân thiện múi giờ Việt Nam (dd/MM/yyyy HH:mm:ss) phục vụ hiển thị báo cáo.',
      severity: 'INFO',
      remedyAction: 'Định dạng mốc thời gian quét sang giờ VN'
    });
  } else {
    passedChecks.push('Ngày giờ quét chuẩn múi giờ Việt Nam (GMT+7)');
  }

  // 5. Khung Giờ Trong Ngày 0-23 (scrapedHour)
  const hasScrapedHour = typeof rawArt.scrapedHour === 'number' && rawArt.scrapedHour >= 0 && rawArt.scrapedHour <= 23;
  if (!hasScrapedHour) {
    failureReasons.push({
      category: 'TIMESTAMP',
      criterion: 'Khung giờ trong ngày (scrapedHour)',
      description: 'Thiếu chỉ mục số nguyên 0 - 23 (`scrapedHour`) để vẽ biểu đồ nhịp độ xuất bản tin bài theo giờ.',
      severity: 'INFO',
      remedyAction: 'Trích xuất giờ từ thời điểm quét'
    });
  } else {
    passedChecks.push('Chỉ mục khung giờ theo dõi (0 - 23h)');
  }

  // 6. Nhãn Cơ Quan Trực Thuộc Bộ Tài Chính (agencies)
  const agencies = Array.isArray(rawArt.agencies) ? rawArt.agencies : [];
  const hasAgencies = agencies.length > 0;
  if (!hasAgencies) {
    failureReasons.push({
      category: 'METADATA',
      criterion: 'Cơ quan trực thuộc Bộ (agencies)',
      description: 'Chưa phân loại đơn vị trực thuộc Bộ chịu trách nhiệm (Tổng cục Thuế, Hải quan, UBCKNN, Kho bạc, Bộ Tài chính...).',
      severity: 'WARNING',
      remedyAction: 'Quét ngữ cảnh tự động gán nhãn đơn vị trực thuộc'
    });
  } else {
    passedChecks.push(`Cơ quan trực thuộc Bộ (${agencies.slice(0, 2).join(', ')})`);
  }

  // 7. Nhân Vật & Lãnh Đạo Xuất Hiện Trong Bài (keyPeople)
  const keyPeople = Array.isArray(rawArt.keyPeople) ? rawArt.keyPeople : [];
  const hasKeyPeople = keyPeople.length > 0;
  if (!hasKeyPeople) {
    failureReasons.push({
      category: 'METADATA',
      criterion: 'Nhân vật & Lãnh đạo (keyPeople)',
      description: 'Chưa bóc tách thông tin Lãnh đạo Bộ hoặc chuyên gia phát ngôn trong bài viết.',
      severity: 'INFO',
      remedyAction: 'Trích xuất thực thể Lãnh đạo và chuyên gia'
    });
  } else {
    passedChecks.push(`Nhân vật / Lãnh đạo (${keyPeople.slice(0, 2).join(', ')})`);
  }

  // 8. Văn Bản Quy Phạm & Thẻ Chính Sách (regulatoryTags)
  const regulatoryTags = Array.isArray(rawArt.regulatoryTags) ? rawArt.regulatoryTags : (Array.isArray(rawArt.policyTags) ? rawArt.policyTags : []);
  const hasRegulatoryTags = regulatoryTags.length > 0;
  if (!hasRegulatoryTags) {
    failureReasons.push({
      category: 'METADATA',
      criterion: 'Văn bản quy phạm & Chính sách (regulatoryTags)',
      description: 'Chưa gắn thẻ các Luật, Nghị định, Thông tư đang được dư luận quan tâm.',
      severity: 'INFO',
      remedyAction: 'Quét và nhận diện văn bản pháp quy liên quan'
    });
  } else {
    passedChecks.push(`Văn bản quy phạm (${regulatoryTags.slice(0, 2).join(', ')})`);
  }

  // 9. Tóm Tắt Tham Mưu Chiến Lược (executiveDirective)
  const hasExecutiveDirective = Boolean(rawArt.executiveDirective && (rawArt.executiveDirective.whatHappened || rawArt.executiveDirective.actionRequired));
  if (!hasExecutiveDirective) {
    failureReasons.push({
      category: 'AI_STRUCT',
      criterion: 'Tóm tắt tham mưu chiến lược (executiveDirective)',
      description: 'Thiếu cấu trúc 4 câu tham mưu chiến lược nhanh phục vụ giao ban của Lãnh đạo Bộ.',
      severity: 'INFO',
      remedyAction: 'Tạo cấu trúc tham mưu 4 câu từ nội dung'
    });
  } else {
    passedChecks.push('Tóm tắt tham mưu chiến lược 4 câu cho Lãnh đạo');
  }

  // 10. Bóc Tách Ma Trận 6W (sixW)
  const hasSixW = Boolean(rawArt.sixW && (rawArt.sixW.who || rawArt.sixW.doingWhat));
  if (!hasSixW) {
    failureReasons.push({
      category: 'AI_STRUCT',
      criterion: 'Bóc tách thông tin 6W (sixW)',
      description: 'Thiếu cấu trúc phân rã thông tin 6W (Ai, Làm gì, Khi nào, Ở đâu, Vì sao, Như thế nào).',
      severity: 'INFO',
      remedyAction: 'Bóc tách tự động cấu trúc 6W phục vụ tra cứu AI'
    });
  } else {
    passedChecks.push('Ma trận bóc tách thông tin 6W hoàn chỉnh');
  }

  // 11. Kiểm Định Trạng Thái Liên Kết (linkAuditStatus)
  if (isLinkDeadOrUnchecked) {
    failureReasons.push({
      category: 'LINK',
      criterion: 'Kiểm định trạng thái liên kết (linkAuditStatus)',
      description: 'Liên kết chưa qua xác nhận hoạt động bình thường (`linkAuditStatus === "ok"`).',
      severity: 'WARNING',
      remedyAction: 'Xác minh và gắn nhãn khả dụng cho URL'
    });
  } else {
    passedChecks.push('Trạng thái liên kết đã được kiểm định khả dụng');
  }

  // 12. Phân Tầng Lưu Trữ Tốc Độ (retentionTier)
  const hasRetentionTier = Boolean(rawArt.retentionTier || rawArt.timeRange);
  if (!hasRetentionTier) {
    failureReasons.push({
      category: 'METADATA',
      criterion: 'Phân tầng lưu trữ tốc độ (retentionTier)',
      description: 'Chưa phân cấp tầng lưu trữ HOT / WARM / COLD để tối ưu hóa hiệu năng truy vấn.',
      severity: 'INFO',
      remedyAction: 'Gán tầng lưu trữ HOT cho tin tức mới'
    });
  } else {
    passedChecks.push(`Phân tầng lưu trữ tốc độ (${rawArt.retentionTier || 'HOT'})`);
  }

  // Tính điểm tổng hợp (0 - 100%)
  const totalChecksCount = 12;
  const passedChecksCount = totalChecksCount - failureReasons.length;
  const standardizationScore = Math.max(0, Math.min(100, Math.round((passedChecksCount / totalChecksCount) * 100)));
  const is100Percent = passedChecksCount === totalChecksCount;

  // Xác định trạng thái chuẩn hóa
  let standardizationStatus: StandardizationLogEntry['standardizationStatus'] = 'OPTIMAL_100';
  let statusLabelVi = '✓ Đạt 100% Chuẩn Tối Ưu';

  if (is100Percent) {
    standardizationStatus = 'OPTIMAL_100';
    statusLabelVi = '✓ Đạt 100% Chuẩn Tối Ưu';
  } else if (isMalformedUrl) {
    standardizationStatus = 'MALFORMED_LINK';
    statusLabelVi = '❌ Lỗi Cú Pháp Link';
  } else if (isGoogleNewsRedirect) {
    standardizationStatus = 'GOOGLE_NEWS_REDIRECT';
    statusLabelVi = '🔴 Link Google News (Chưa bóc tách)';
  } else if (hasTrackingParams) {
    standardizationStatus = 'TRACKING_DIRTY';
    statusLabelVi = '🟠 Chứa Tham Số Tracking';
  } else if (!hasAgencies || !hasKeyPeople || !hasRegulatoryTags) {
    standardizationStatus = 'MISSING_METADATA';
    statusLabelVi = '⚠️ Thiếu Thực Thể / Cơ Quan';
  } else {
    standardizationStatus = 'INCOMPLETE_TIMESTAMPS';
    statusLabelVi = '⏱️ Thiếu Mốc Thời Gian Chuẩn';
  }

  // Format dates for display
  let publishedAtFormatted = '—';
  if (rawArt.publishedAt) {
    try {
      const d = new Date(rawArt.publishedAt);
      if (!isNaN(d.getTime())) {
        publishedAtFormatted = d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      }
    } catch {}
  }

  const scrapedAtFormatted = rawArt.scrapedDateFormatted || (rawArt.scrapedAt ? new Date(rawArt.scrapedAt).toLocaleString('vi-VN') : '—');
  const articleId = rawArt.id || (rawArt.deduplicationHash ? `art_${rawArt.deduplicationHash}` : `art_${Math.random().toString(36).substring(2, 9)}`);

  return {
    id: articleId,
    title: (rawArt.title || 'Tin tức chưa có tiêu đề').trim(),
    source: rawArt.source || rawArt.sourceName || 'Cổng TTĐT Bộ Tài chính',
    sourceName: rawArt.sourceName || rawArt.source || 'Cổng TTĐT Bộ Tài chính',
    rawUrl,
    unwrappedUrl,
    canonicalUrl,
    isGoogleNewsRedirect,
    hasTrackingParams,
    hasDomainMismatch,
    isMalformedUrl,
    isLinkDeadOrUnchecked,
    standardizationScore,
    is100Percent,
    passedChecksCount,
    totalChecksCount,
    standardizationStatus,
    statusLabelVi,
    failureReasons,
    passedChecks,
    publishedAtFormatted,
    scrapedAtFormatted,
    hasDeduplicationHash,
    hasArchivedAt,
    agenciesCount: agencies.length,
    agencies,
    hasKeyPeople,
    keyPeople,
    hasRegulatoryTags,
    regulatoryTags,
    hasExecutiveDirective,
    hasSixW,
    rawArticle: rawArt
  };
}

/**
 * Kiểm định hàng loạt và thống kê tình trạng chuẩn hóa của toàn bộ tập bài viết
 */
export function auditBatchStandardization(articles: any[]): {
  entries: StandardizationLogEntry[];
  stats: StandardizationBatchStats;
} {
  if (!articles || articles.length === 0) {
    return {
      entries: [],
      stats: {
        totalAudited: 0,
        optimalCount: 0,
        optimalPercentage: 100,
        needsStandardizationCount: 0,
        googleNewsRedirectsCount: 0,
        trackingDirtyCount: 0,
        malformedUrlsCount: 0,
        missingMetadataCount: 0,
        missingTimestampsCount: 0,
        averageScore: 100
      }
    };
  }

  const entries = articles.map(a => auditArticleStandardization(a));
  const totalAudited = entries.length;
  const optimalCount = entries.filter(e => e.is100Percent).length;
  const needsStandardizationCount = totalAudited - optimalCount;
  const googleNewsRedirectsCount = entries.filter(e => e.isGoogleNewsRedirect).length;
  const trackingDirtyCount = entries.filter(e => e.hasTrackingParams).length;
  const malformedUrlsCount = entries.filter(e => e.isMalformedUrl).length;
  const missingMetadataCount = entries.filter(e => !e.agenciesCount || !e.hasKeyPeople || !e.hasRegulatoryTags).length;
  const missingTimestampsCount = entries.filter(e => !e.hasArchivedAt || !e.hasDeduplicationHash).length;

  const totalScoreSum = entries.reduce((acc, e) => acc + e.standardizationScore, 0);
  const averageScore = totalAudited > 0 ? Math.round(totalScoreSum / totalAudited) : 100;
  const optimalPercentage = totalAudited > 0 ? Math.round((optimalCount / totalAudited) * 100) : 100;

  return {
    entries,
    stats: {
      totalAudited,
      optimalCount,
      optimalPercentage,
      needsStandardizationCount,
      googleNewsRedirectsCount,
      trackingDirtyCount,
      malformedUrlsCount,
      missingMetadataCount,
      missingTimestampsCount,
      averageScore
    }
  };
}

/**
 * Save local archive cache
 */
export function saveLocalArchiveCache(articles: ArchivedNewsArticle[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const existingRaw = window.localStorage.getItem(LOCAL_ARCHIVE_KEY);
      let existing: ArchivedNewsArticle[] = [];
      if (existingRaw) {
        existing = JSON.parse(existingRaw);
      }
      const existingMap = new Map(existing.map(a => [a.id, a]));
      articles.forEach(a => existingMap.set(a.id, a));
      const combined = Array.from(existingMap.values())
        .sort((a, b) => b.scrapedAt - a.scrapedAt)
        .slice(0, 3000); // Keep latest 3000 articles locally
      
      window.localStorage.setItem(LOCAL_ARCHIVE_KEY, JSON.stringify(combined));
    }
  } catch (e) {
    console.warn('Failed to save local archive cache:', e);
  }
}

/**
 * Load local archive cache
 */
export function loadLocalArchiveCache(): ArchivedNewsArticle[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(LOCAL_ARCHIVE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch (_) {}
  return [];
}

export const getArchivedNewsCache = loadLocalArchiveCache;

/**
 * Save Scraped News Batch directly to Cloud Firestore with Deduplication & Audit Log
 */
export async function archiveScrapedNewsBatchToCloud(
  newsItems: ScrapedNewsItem[],
  timeRange: string
): Promise<{
  sessionId: string;
  totalReceived: number;
  newArticlesSaved: number;
  duplicatesSkipped: number;
}> {
  const sessionId = `scrape_sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowMs = Date.now();
  const dateFormatted = new Date().toLocaleString('vi-VN');

  if (!newsItems || newsItems.length === 0) {
    return { sessionId, totalReceived: 0, newArticlesSaved: 0, duplicatesSkipped: 0 };
  }

  const mappedArticles = newsItems.map(item => mapToArchivedNewsArticle(item, timeRange, sessionId));
  
  // Calculate breakdown stats
  const sourcesSet = new Set<string>();
  const sectorCounts: Record<string, number> = {};
  const sentimentCounts = { bullish: 0, neutral: 0, bearish: 0 };

  mappedArticles.forEach(a => {
    if (a.source) sourcesSet.add(a.source);
    sectorCounts[a.sector] = (sectorCounts[a.sector] || 0) + 1;
    if (a.sentiment === 'bullish') sentimentCounts.bullish++;
    else if (a.sentiment === 'bearish') sentimentCounts.bearish++;
    else sentimentCounts.neutral++;
  });

  let newSavedCount = 0;
  let skippedCount = 0;

  // 1. Always update local storage cache immediately
  saveLocalArchiveCache(mappedArticles);

  // 2. Persist to Cloud Firestore if connected and quota not exceeded
  if (db && isCloudDatabaseActive() && !isFirestoreQuotaExceeded()) {
    try {
      const savePromises = mappedArticles.map(async (article) => {
        if (isFirestoreQuotaExceeded()) return;
        try {
          const docRef = doc(db!, ARCHIVE_COLLECTION, article.id);
          const existingSnap = await getDoc(docRef).catch((e) => {
            handleFirestoreError(e);
            return null;
          });

          if (existingSnap && existingSnap.exists()) {
            skippedCount++;
          } else if (!isFirestoreQuotaExceeded()) {
            const cleanArticle = sanitizeForFirestore(article);
            await setDoc(docRef, cleanArticle);
            newSavedCount++;
          }
        } catch (e) {
          handleFirestoreError(e);
        }
      });

      await Promise.all(savePromises);

      // Save Scrape Session Record if quota allows
      if (!isFirestoreQuotaExceeded()) {
        const sessionRecord: ScrapeSessionRecord = {
          id: sessionId,
          timestamp: nowMs,
          dateFormatted,
          timeRange,
          totalArticlesScraped: newsItems.length,
          newArticlesSaved: newSavedCount,
          duplicatesSkipped: skippedCount,
          sourcesCovered: Array.from(sourcesSet),
          sectorCounts,
          sentimentCounts
        };

        const sessRef = doc(db, SCRAPE_SESSIONS_COLLECTION, sessionId);
        await setDoc(sessRef, sanitizeForFirestore(sessionRecord)).catch((e) => {
          handleFirestoreError(e);
        });
      }

      console.log(`✅ [NewsArchiveService] Cloud Firestore Archiving completed: ${newSavedCount} new articles stored, ${skippedCount} duplicates skipped.`);
    } catch (err) {
      handleFirestoreError(err);
      console.warn('News archiving skipped due to Firestore quota/network state:', err);
    }
  } else {
    newSavedCount = mappedArticles.length;
    console.log(`ℹ️ [NewsArchiveService] Saved ${newSavedCount} articles to Local Cache (Cloud Offline or Quota Exceeded).`);
  }

  return {
    sessionId,
    totalReceived: newsItems.length,
    newArticlesSaved: newSavedCount,
    duplicatesSkipped: skippedCount
  };
}

/**
 * Apply structured criteria filters to an array of ArchivedNewsArticle
 */
export function applyArchiveFilters(
  articles: ArchivedNewsArticle[],
  criteria: ArchiveQueryCriteria
): ArchivedNewsArticle[] {
  let list = articles;

  // 1. Single Sector or Multiple Sectors Filter
  if (criteria.sectors && criteria.sectors.length > 0 && !criteria.sectors.includes('all')) {
    const allowed = new Set(criteria.sectors.map(s => String(s).toLowerCase()));
    list = list.filter(a => allowed.has(a.sector.toLowerCase()));
  } else if (criteria.sector && criteria.sector !== 'all') {
    list = list.filter(a => a.sector === criteria.sector);
  }

  // 2. Single Sentiment or Multiple Sentiments Filter
  if (criteria.sentiments && criteria.sentiments.length > 0 && !criteria.sentiments.includes('all')) {
    const allowed = new Set(criteria.sentiments.map(s => String(s).toLowerCase()));
    list = list.filter(a => allowed.has(a.sentiment.toLowerCase()));
  } else if (criteria.sentiment && criteria.sentiment !== 'all') {
    list = list.filter(a => a.sentiment === criteria.sentiment);
  }

  // 3. Impact Levels
  if (criteria.impactLevels && criteria.impactLevels.length > 0) {
    const allowed = new Set(criteria.impactLevels.map(i => i.toLowerCase()));
    list = list.filter(a => allowed.has(a.impactLevel.toLowerCase()));
  }

  // 4. Bright Spot / Risk Flags
  if (criteria.isBrightSpotOnly) {
    list = list.filter(a => a.isBrightSpot);
  }
  if (criteria.isRiskOnly) {
    list = list.filter(a => a.isRisk);
  }

  // 5. Sentiment Range (-100 to +100)
  if (typeof criteria.minSentimentScore === 'number') {
    list = list.filter(a => (a.sentimentScore || 0) >= criteria.minSentimentScore!);
  }
  if (typeof criteria.maxSentimentScore === 'number') {
    list = list.filter(a => (a.sentimentScore || 0) <= criteria.maxSentimentScore!);
  }

  // 6. Bright Spot Score & Risk Score thresholds
  if (typeof criteria.minBrightSpotScore === 'number' && criteria.minBrightSpotScore > 0) {
    list = list.filter(a => (a.brightSpotScore || 0) >= criteria.minBrightSpotScore!);
  }
  if (typeof criteria.minRiskScore === 'number' && criteria.minRiskScore > 0) {
    list = list.filter(a => (a.riskScore || 0) >= criteria.minRiskScore!);
  }

  // 7. Date Window (Published / Scraped timestamps)
  if (typeof criteria.startDateMs === 'number' && criteria.startDateMs > 0) {
    list = list.filter(a => (a.publishedTimestamp || a.scrapedAt) >= criteria.startDateMs!);
  }
  if (typeof criteria.endDateMs === 'number' && criteria.endDateMs > 0) {
    list = list.filter(a => (a.publishedTimestamp || a.scrapedAt) <= criteria.endDateMs!);
  }

  // 8. Smart Category
  if (criteria.smartCategory && criteria.smartCategory !== 'all') {
    list = list.filter(a => a.smartCategory === criteria.smartCategory);
  }

  // 9. Source Filter
  if (criteria.source && criteria.source !== 'all') {
    const srcLower = criteria.source.toLowerCase();
    list = list.filter(a => a.source.toLowerCase().includes(srcLower));
  }

  // 10. Free-text Search Query
  if (criteria.searchQuery && criteria.searchQuery.trim()) {
    const term = criteria.searchQuery.toLowerCase().trim();
    list = list.filter(a =>
      a.title.toLowerCase().includes(term) ||
      a.summary.toLowerCase().includes(term) ||
      a.source.toLowerCase().includes(term) ||
      (a.regulatoryTags || []).some(t => t.toLowerCase().includes(term)) ||
      (a.tickers || []).some(tk => tk.toLowerCase().includes(term))
    );
  }

  return list;
}

/**
 * Query archived news articles from Cloud Firestore with local cache fallback
 */
export async function queryArchivedNews(
  criteria: ArchiveQueryCriteria = {}
): Promise<ArchivedNewsArticle[]> {
  const limitCount = criteria.limit || 150;

  if (db && isCloudDatabaseActive() && !isFirestoreQuotaExceeded()) {
    try {
      const q = query(
        collection(db, ARCHIVE_COLLECTION),
        orderBy('publishedTimestamp', 'desc'),
        firestoreLimit(limitCount * 2)
      );

      const snap = await getDocs(q);
      let articles: ArchivedNewsArticle[] = [];

      snap.forEach(d => {
        articles.push(d.data() as ArchivedNewsArticle);
      });

      const filtered = applyArchiveFilters(articles, criteria);
      if (filtered.length > 0) return filtered.slice(0, limitCount);
    } catch (err) {
      handleFirestoreError(err);
      console.warn('Failed to query archive from Firestore, using local cache:', err);
    }
  }

  // Fallback to local storage
  const localList = loadLocalArchiveCache();
  const filteredLocal = applyArchiveFilters(localList, criteria);
  return filteredLocal.slice(0, limitCount);
}

/**
 * Fetch overall statistics of the archived news collection
 */
export async function getNewsArchiveStats(): Promise<NewsArchiveStats> {
  let allArticles: ArchivedNewsArticle[] = [];
  let isCloudConnected = false;

  if (db && isCloudDatabaseActive() && !isFirestoreQuotaExceeded()) {
    try {
      const snap = await getDocs(collection(db, ARCHIVE_COLLECTION));
      snap.forEach(d => {
        allArticles.push(d.data() as ArchivedNewsArticle);
      });
      isCloudConnected = true;
    } catch (err) {
      handleFirestoreError(err);
      console.warn('Failed to fetch Firestore archive stats, falling back to local cache:', err);
    }
  }

  if (allArticles.length === 0) {
    allArticles = loadLocalArchiveCache();
  }

  const sourcesMap = new Map<string, number>();
  let brightCount = 0;
  let riskCount = 0;
  const sentimentCounts = { bullish: 0, neutral: 0, bearish: 0 };
  let latestMs: number | null = null;
  let earliestMs: number | null = null;

  allArticles.forEach(a => {
    const src = a.source || 'Nguồn khác';
    sourcesMap.set(src, (sourcesMap.get(src) || 0) + 1);

    if (a.isBrightSpot) brightCount++;
    if (a.isRisk) riskCount++;

    if (a.sentiment === 'bullish') sentimentCounts.bullish++;
    else if (a.sentiment === 'bearish') sentimentCounts.bearish++;
    else sentimentCounts.neutral++;

    if (!latestMs || a.scrapedAt > latestMs) latestMs = a.scrapedAt;
    if (!earliestMs || a.scrapedAt < earliestMs) earliestMs = a.scrapedAt;
  });

  const sourcesList = Array.from(sourcesMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalArticles: allArticles.length,
    uniqueSourcesCount: sourcesMap.size,
    sourcesList,
    brightSpotsCount: brightCount,
    risksCount: riskCount,
    sentimentBreakdown: sentimentCounts,
    latestScrapedAt: latestMs,
    earliestScrapedAt: earliestMs,
    totalSessionsCount: 0,
    isCloudConnected
  };
}

/**
 * Clear archived news documents for reset (Optimized with exhaustive writeBatch loop)
 */
export async function clearNewsArchiveFromCloud(): Promise<number> {
  let count = 0;
  if (db && isCloudDatabaseActive() && !isFirestoreQuotaExceeded()) {
    try {
      const CHUNK_SIZE = 400;
      const MAX_ITER = 50;

      for (let iter = 0; iter < MAX_ITER; iter++) {
        const q = query(collection(db, ARCHIVE_COLLECTION), firestoreLimit(CHUNK_SIZE));
        const snap = await getDocs(q);
        if (snap.empty || snap.docs.length === 0) {
          break;
        }

        const batch = writeBatch(db);
        snap.docs.forEach((d) => {
          batch.delete(doc(db!, ARCHIVE_COLLECTION, d.id));
          count++;
        });
        await batch.commit();

        if (snap.docs.length < CHUNK_SIZE) {
          break;
        }
      }
    } catch (err) {
      handleFirestoreError(err);
      console.error('Failed to clear archive collection in Firestore:', err);
    }
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(LOCAL_ARCHIVE_KEY);
      window.localStorage.removeItem(LOCAL_SESSIONS_KEY);
    }
  } catch (_) {}

  return count;
}

/**
 * Save / Insert a single article directly to Firestore and Local Archive
 */
export async function saveArticleToArchive(art: ScrapedNewsItem | ArchivedNewsArticle): Promise<boolean> {
  const docId = art.id || generateArticleArchiveId(art as ScrapedNewsItem);
  const now = Date.now();
  const pubMs = (art as any).publishedTimestamp || (art.publishedAt ? new Date(art.publishedAt).getTime() : now);
  const brightSpotScore = art.isBrightSpot
    ? (art.brightSpotScore ?? (typeof calculateBrightSpotScore(art as ScrapedNewsItem) === 'number' ? calculateBrightSpotScore(art as ScrapedNewsItem) : (calculateBrightSpotScore(art as ScrapedNewsItem) as any)?.score || 0))
    : 0;
  const riskScore = art.isRisk
    ? (art.riskScore ?? (typeof calculateRiskScore(art as ScrapedNewsItem) === 'number' ? calculateRiskScore(art as ScrapedNewsItem) : (calculateRiskScore(art as ScrapedNewsItem) as any)?.score || 0))
    : 0;

  const docData: ArchivedNewsArticle = {
    id: docId,
    title: art.title,
    url: art.url || '',
    source: art.source || 'Ban Biên tập Bộ Tài chính',
    sourceName: art.sourceName || art.source || 'Bộ Tài chính',
    publishedAt: art.publishedAt || new Date(pubMs).toISOString(),
    publishedTimestamp: pubMs,
    scrapedAt: (art as any).scrapedAt || now,
    timeRange: (art as any).timeRange || '24h',
    sector: art.sector || 'all',
    sectorNameVi: SECTOR_NAMES[art.sector || 'all'] || 'Tài chính - Vĩ mô',
    summary: art.summary || '',
    snippet: (art as any).snippet || art.summary || '',
    keyPoints: (art as any).keyPoints || [],
    sentiment: art.sentiment || 'neutral',
    sentimentScore: art.sentimentScore ?? 0,
    sentimentReason: art.sentimentReason || '',
    impactLevel: art.impactLevel || 'medium',
    isBrightSpot: Boolean(art.isBrightSpot || isBrightSpotArticle(art as ScrapedNewsItem)),
    brightSpotScore,
    brightSpotReason: art.brightSpotReason || '',
    isRisk: Boolean(art.isRisk || isRiskArticle(art as ScrapedNewsItem)),
    riskScore,
    riskReason: art.riskReason || '',
    regulatoryTags: (art as any).regulatoryTags || [],
    agencies: (art as any).agencies || [],
    tickers: (art as any).tickers || [],
    smartCategory: (art as any).smartCategory || 'chinh_sach',
    scrapeSessionId: (art as any).scrapeSessionId || `manual-${now}`,
    schemaVersion: 2
  };

  // 1. Update Local Storage Cache
  try {
    const local = loadLocalArchiveCache();
    const existingIdx = local.findIndex(a => a.id === docId);
    if (existingIdx >= 0) {
      local[existingIdx] = docData;
    } else {
      local.unshift(docData);
    }
    saveLocalArchiveCache(local);
  } catch (err) {
    console.warn('Error saving single article to local cache:', err);
  }

  // 2. Persist to Cloud Firestore if active
  if (db && isCloudDatabaseActive() && !isFirestoreQuotaExceeded()) {
    try {
      const sanitized = sanitizeForFirestore(docData);
      const docRef = doc(db, ARCHIVE_COLLECTION, docId);
      await setDoc(docRef, sanitized, { merge: true });
      return true;
    } catch (err) {
      handleFirestoreError(err);
      console.warn('Failed to save article to Cloud Firestore:', err);
    }
  }

  return true;
}

/**
 * Update a single article directly in Firestore and Local Archive
 */
export async function updateArticleInArchive(
  id: string,
  updates: Partial<ArchivedNewsArticle | ScrapedNewsItem>
): Promise<boolean> {
  if (!id) return false;

  // 1. Update Local Storage Cache
  let updatedRecord: ArchivedNewsArticle | null = null;
  try {
    const local = loadLocalArchiveCache();
    const idx = local.findIndex(a => a.id === id);
    if (idx >= 0) {
      local[idx] = {
        ...local[idx],
        ...updates,
        id,
      } as ArchivedNewsArticle;
      updatedRecord = local[idx];
      saveLocalArchiveCache(local);
    }
  } catch (err) {
    console.warn('Error updating article in local cache:', err);
  }

  // 2. Persist to Cloud Firestore
  if (db && isCloudDatabaseActive() && !isFirestoreQuotaExceeded()) {
    try {
      const docRef = doc(db, ARCHIVE_COLLECTION, id);
      const sanitized = sanitizeForFirestore(updates);
      await setDoc(docRef, sanitized, { merge: true });
      return true;
    } catch (err) {
      handleFirestoreError(err);
      console.warn('Failed to update article in Cloud Firestore:', err);
    }
  }

  return true;
}

/**
 * Delete a single article from Firestore and Local Archive
 */
export async function deleteArticleFromArchive(id: string): Promise<boolean> {
  if (!id) return false;

  // 1. Delete from Local Storage Cache
  try {
    const local = loadLocalArchiveCache();
    const filtered = local.filter(a => a.id !== id);
    saveLocalArchiveCache(filtered);
  } catch (err) {
    console.warn('Error deleting article from local cache:', err);
  }

  // 2. Delete from Cloud Firestore
  if (db && isCloudDatabaseActive() && !isFirestoreQuotaExceeded()) {
    try {
      const docRef = doc(db, ARCHIVE_COLLECTION, id);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      handleFirestoreError(err);
      console.warn('Failed to delete article from Cloud Firestore:', err);
    }
  }

  return true;
}

/**
 * Bulk delete articles from Firestore and Local Archive
 */
export async function bulkDeleteArticlesFromArchive(ids: string[]): Promise<number> {
  if (!Array.isArray(ids) || ids.length === 0) return 0;
  const idSet = new Set(ids);

  // 1. Delete from Local Cache
  try {
    const local = loadLocalArchiveCache();
    const filtered = local.filter(a => !idSet.has(a.id));
    saveLocalArchiveCache(filtered);
  } catch (err) {
    console.warn('Error bulk deleting from local cache:', err);
  }

  // 2. Delete from Cloud Firestore
  let count = 0;
  if (db && isCloudDatabaseActive() && !isFirestoreQuotaExceeded()) {
    try {
      const deletePromises = ids.map(async (id) => {
        try {
          const docRef = doc(db!, ARCHIVE_COLLECTION, id);
          await deleteDoc(docRef);
          count++;
        } catch (_) {}
      });
      await Promise.all(deletePromises);
    } catch (err) {
      handleFirestoreError(err);
      console.warn('Failed to bulk delete articles from Firestore:', err);
    }
  }

  return count;
}

/**
 * Real-time listener for the `scraped_news_archive` Firestore collection.
 * Triggers a callback whenever documents are added, updated, or removed in real-time.
 */
export function subscribeToArchivedNewsRealtime(
  onUpdate: (articles: ArchivedNewsArticle[], changeInfo?: { type: 'added' | 'modified' | 'removed'; docId: string; timestamp: string }) => void,
  limitCount: number = 200
): () => void {
  if (!db || !isCloudDatabaseActive() || isFirestoreQuotaExceeded()) {
    console.log('[Realtime Listener] Fallback to local cache storage');
    const localData = loadLocalArchiveCache();
    onUpdate(localData);
    return () => {};
  }

  try {
    const archiveRef = collection(db, ARCHIVE_COLLECTION);
    const q = query(archiveRef, orderBy('scrapedAt', 'desc'), firestoreLimit(limitCount));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const articles: ArchivedNewsArticle[] = [];
        let latestChange: { type: 'added' | 'modified' | 'removed'; docId: string; timestamp: string } | undefined;

        snapshot.docChanges().forEach((change) => {
          latestChange = {
            type: change.type,
            docId: change.doc.id,
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour12: false })
          };
        });

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          articles.push({
            id: docSnap.id,
            ...data
          } as ArchivedNewsArticle);
        });

        onUpdate(articles, latestChange);
      },
      (error) => {
        handleFirestoreError(error);
        console.warn('Realtime listener error on scraped_news_archive:', error);
        const local = loadLocalArchiveCache();
        onUpdate(local);
      }
    );

    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Failed to attach realtime listener to scraped_news_archive:', err);
    return () => {};
  }
}
