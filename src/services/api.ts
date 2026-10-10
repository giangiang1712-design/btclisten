import { ScrapeResponse, SectorType, TimeRange, DeepDiveAnalysis, LeadershipDraftStatement, PolicyAdvisorySubmission, ScrapedNewsItem, MediaStrategyType, UrgentAlert, LeadershipLevel, SummaryLengthMode, TailoredReSummary } from '../types';
import { getApiKeyHeaders } from '../lib/apiKeyManager';
import { classifyMinistryAlert } from '../lib/newsClassification';
import {
  formatUtcDateTime,
  formatVietnamDateTime,
  formatVietnamIsoString,
  getVietnamCurrentTimeAndWindow,
  compareArticleUtcVsVietnamTimestamp,
  auditIncorrectArticlesIn24hWindow,
  UtcVsVietnamComparison,
  WindowAuditDiagnosisReport,
} from '../lib/timestampDebugger';

export {
  formatUtcDateTime,
  formatVietnamDateTime,
  formatVietnamIsoString,
  getVietnamCurrentTimeAndWindow,
  compareArticleUtcVsVietnamTimestamp,
  auditIncorrectArticlesIn24hWindow,
};
export type { UtcVsVietnamComparison, WindowAuditDiagnosisReport };

/**
 * Calculates the exact scan window boundaries by subtracting the duration (e.g. 24h = 1440m)
 * directly from current Vietnam Time (UTC+7).
 */
export function calculateVietnamTimeWindow(
  timeRange: TimeRange = '24h',
  referenceEndMs?: number
) {
  return getVietnamCurrentTimeAndWindow(timeRange, referenceEndMs);
}

export interface EmailDigestResult {
  subject: string;
  emailBodyText: string;
  keyDirectivesCount?: number;
  topHighlightsCount?: number;
}

export interface FetchNewsOptions {
  enableBatching?: boolean;
  fetchAll?: boolean;
  maxTimeoutMs?: number;
  concurrencyLimit?: number;
  batchSectors?: SectorType[];
}

// 23 Management Field Sector Clusters for Parallel Request Batching (Including 5 Decree 376 Mandates)
const MANAGEMENT_18_FIELD_CLUSTERS: SectorType[] = [
  'all',
  'tax',
  'customs',
  'treasury_budget',
  'bonds',
  'stocks',
  'price_management',
  'insurance',
  'public_investment',
  'state_economy',
  'public_debt',
  'inspection_audit',
  'bidding_procurement',
  'foreign_investment_fdi',
  'statistics_macro',
  'social_security',
  'socioeconomic_planning',
  'banking_credit',
  'realestate',
  'fdi',
  'fintech_digital',
  'macro',
];

/**
 * Strict Article Timestamp Parser with Timezone Alignment:
 * Evaluates publishedTimestamp, publishedAt, timeAgo, and explicit date patterns.
 * Handles UTC offsets, Vietnam ICT (UTC+7) local time strings, relative times,
 * and compensates for scrapers/RSS feeds that output local ICT time labeled as UTC Z.
 */
export function parseStrictArticleTimestamp(
  article: Partial<ScrapedNewsItem> | null | undefined,
  nowMs: number = Date.now()
): number | null {
  if (!article) return null;

  // Helper to parse any raw date/time string with full Vietnamese & ISO support
  const parseRawDateString = (rawStr: string): number | null => {
    if (!rawStr) return null;
    const str = rawStr.trim();
    if (!str) return null;

    // Relative strings
    const lowerStr = str.toLowerCase();
    if (lowerStr === 'vừa xong' || lowerStr === 'vừa đăng' || lowerStr === 'mới đăng' || lowerStr === 'just now') {
      return nowMs - 2 * 60 * 1000;
    }
    const minMatch = lowerStr.match(/(\d+)\s*(?:phút|phut|p|mins?|minutes?)(?:\s*trước|\s*ago)?/i);
    if (minMatch) {
      const m = parseInt(minMatch[1], 10);
      if (!isNaN(m)) return nowMs - m * 60 * 1000;
    }
    const hourMatch = lowerStr.match(/(\d+)\s*(?:giờ|gio|g|h|hours?|hrs?)(?:\s*trước|\s*ago)?/i);
    if (hourMatch) {
      const h = parseInt(hourMatch[1], 10);
      if (!isNaN(h)) return nowMs - h * 3600 * 1000;
    }
    const dayMatch = lowerStr.match(/(\d+)\s*(?:ngày|ngay|d|days?)(?:\s*trước|\s*ago)?/i);
    if (dayMatch) {
      const d = parseInt(dayMatch[1], 10);
      if (!isNaN(d)) return nowMs - d * 86400 * 1000;
    }
    if (/hôm qua|yesterday/i.test(lowerStr)) {
      return nowMs - 24 * 3600 * 1000;
    }

    // ISO 8601 standard format: YYYY-MM-DD[T| ]HH:mm:ss or YYYY/MM/DD
    const isoMatch = str.match(/^(\d{4})[/-](\d{2})[/-](\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:(Z)|([+-]\d{2}):?(\d{2}))?)?/i);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      const hours = isoMatch[4] ? parseInt(isoMatch[4], 10) : 0;
      const minutes = isoMatch[5] ? parseInt(isoMatch[5], 10) : 0;
      const seconds = isoMatch[6] ? parseInt(isoMatch[6], 10) : 0;
      const isUtcZ = Boolean(isoMatch[7]);
      const tzSign = isoMatch[8] ? isoMatch[8][0] : null;
      const tzHours = isoMatch[8] ? parseInt(isoMatch[8].slice(1), 10) : 0;
      const tzMins = isoMatch[9] ? parseInt(isoMatch[9], 10) : 0;

      let utcHours = hours;
      let utcMinutes = minutes;
      if (isUtcZ) {
        // already UTC
      } else if (tzSign) {
        const offsetMins = (tzSign === '+' ? 1 : -1) * (tzHours * 60 + tzMins);
        utcMinutes -= offsetMins;
      } else {
        utcHours -= 7; // ICT default
      }
      const utcMs = Date.UTC(year, month, day, utcHours, utcMinutes, seconds);
      if (!isNaN(utcMs)) return utcMs;
    }

    // Vietnamese Explicit Formats with pipe (|), tabs, spaces
    const cleanStr = str
      .replace(/[|\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/(?:vào\s+lúc|thứ\s+[a-z0-9]+,?\s*)/gi, '')
      .trim();

    // Time first: HH:mm[:ss] DD/MM/YYYY
    const pTimeFirst = /(?:lúc\s+)?(\d{1,2})[h:](\d{2})(?::(\d{2}))?[,\s\-T@/|]+(?:ngày\s+)?(\d{1,2})[/.–-](\d{1,2})[/.–-](\d{4})/i;
    const mTimeFirst = cleanStr.match(pTimeFirst);
    if (mTimeFirst) {
      const hours = parseInt(mTimeFirst[1], 10);
      const minutes = parseInt(mTimeFirst[2], 10);
      const seconds = mTimeFirst[3] ? parseInt(mTimeFirst[3], 10) : 0;
      const day = parseInt(mTimeFirst[4], 10);
      const month = parseInt(mTimeFirst[5], 10) - 1;
      const year = parseInt(mTimeFirst[6], 10);
      if (month >= 0 && month < 12 && day > 0 && day <= 31 && year >= 2020 && year <= 2035) {
        return Date.UTC(year, month, day, hours - 7, minutes, seconds);
      }
    }

    // Date first: DD/MM/YYYY [HH:mm[:ss]]
    const pDateFirst = /(?:ngày\s+)?(\d{1,2})[/.–-](\d{1,2})[/.–-](\d{4})(?:[,\s\-T@/|]+(?:lúc\s+)?(\d{1,2})[h:](\d{2})(?::(\d{2}))?)?/i;
    const mDateFirst = cleanStr.match(pDateFirst);
    if (mDateFirst) {
      const day = parseInt(mDateFirst[1], 10);
      const month = parseInt(mDateFirst[2], 10) - 1;
      const year = parseInt(mDateFirst[3], 10);
      let hours = mDateFirst[4] !== undefined ? parseInt(mDateFirst[4], 10) : 0;
      const minutes = mDateFirst[5] !== undefined ? parseInt(mDateFirst[5], 10) : 0;
      const seconds = mDateFirst[6] !== undefined ? parseInt(mDateFirst[6], 10) : 0;
      if (month >= 0 && month < 12 && day > 0 && day <= 31 && year >= 2020 && year <= 2035) {
        return Date.UTC(year, month, day, hours - 7, minutes, seconds);
      }
    }

    // Standard JavaScript Date.parse fallback
    let cleanDateStr = str
      .replace(/GMT\+07:00/i, '+0700')
      .replace(/GMT\+7/i, '+0700')
      .replace(/UTC\+7/i, '+0700')
      .replace(/ICT/i, '+0700');
    const parsed = Date.parse(cleanDateStr);
    if (!isNaN(parsed) && parsed > 0) {
      if (parsed > nowMs + 3 * 60 * 1000 && parsed <= nowMs + 8.5 * 3600 * 1000) {
        return parsed - 7 * 3600 * 1000;
      }
      return parsed;
    }

    return null;
  };

  // 1. Authoritative: Parse publishedAt or publishedTimeStr explicitly if present
  if (article.publishedAt) {
    const pubAtMs = parseRawDateString(article.publishedAt);
    if (pubAtMs) return pubAtMs;
  }
  if (article.publishedTimeStr) {
    const pubStrMs = parseRawDateString(article.publishedTimeStr);
    if (pubStrMs) return pubStrMs;
  }

  // 2. Explicit numeric timestamp provided directly by scraper/backend
  if (typeof article.publishedTimestamp === 'number' && !isNaN(article.publishedTimestamp) && article.publishedTimestamp > 0) {
    let ts = article.publishedTimestamp;
    // Compensation for publisher/RSS local time offset mislabeling (e.g. UTC+7 local time labeled as UTC Z)
    if (ts > nowMs + 3 * 60 * 1000 && ts <= nowMs + 8.5 * 3600 * 1000) {
      ts -= 7 * 3600 * 1000;
    }
    return ts;
  }

  // 3. Fallback to timeAgo parsing if publishedAt was missing or unparseable
  if (article.timeAgo && typeof article.timeAgo === 'string') {
    const agoMs = parseRawDateString(article.timeAgo);
    if (agoMs) return agoMs;
  }

  return null;
}

function filterNewsByTimeBounds(
  data: ScrapeResponse,
  timeRange: TimeRange,
  timeBounds?: { startTimeMs?: number; endTimeMs?: number; startTimeIso?: string; endTimeIso?: string }
): ScrapeResponse {
  if (!data || !Array.isArray(data.news)) return data;

  const windowInfo = getVietnamCurrentTimeAndWindow(timeRange, timeBounds?.endTimeMs);
  const effectiveEndMs = timeBounds?.endTimeMs || windowInfo.endTimeMs;
  const effectiveStartMs = timeBounds?.startTimeMs || windowInfo.startTimeMs;

  // Strict tolerance: 3 minutes clock skew grace buffer
  const toleranceMs = 3 * 60 * 1000;
  const minAllowedMs = effectiveStartMs - toleranceMs;
  const maxAllowedMs = effectiveEndMs + toleranceMs;

  const validArticles: ScrapedNewsItem[] = [];
  const droppedArticles: ScrapedNewsItem[] = [];

  data.news.forEach((article) => {
    if (!article) return;
    const pubMs = parseStrictArticleTimestamp(article, effectiveEndMs);

    let isStaleOrInvalid = false;
    let dropReason = '';

    if (!pubMs) {
      isStaleOrInvalid = true;
      dropReason = 'Dropped: Stale Data (Missing or unparseable publishedAt field)';
    } else if (pubMs < minAllowedMs) {
      isStaleOrInvalid = true;
      const staleMins = Math.round((effectiveStartMs - pubMs) / 60000);
      const staleHours = Math.round((staleMins / 60) * 10) / 10;
      const pubVnFormatted = formatVietnamDateTime(pubMs) || 'N/A';
      dropReason = `Dropped: Stale Data (${pubVnFormatted} is ${staleHours}h older than ${timeRange} window start: ${windowInfo.startVnFormatted})`;
    } else if (pubMs > maxAllowedMs) {
      isStaleOrInvalid = true;
      const futureMins = Math.round((pubMs - effectiveEndMs) / 60000);
      const futureHours = Math.round((futureMins / 60) * 10) / 10;
      const pubVnFormatted = formatVietnamDateTime(pubMs) || 'N/A';
      dropReason = `Dropped: Stale Data (${pubVnFormatted} is ${futureHours}h in future beyond window end: ${windowInfo.endVnFormatted})`;
    }

    if (isStaleOrInvalid) {
      droppedArticles.push({
        ...article,
        scrapeIntegrityStatus: 'Dropped: Stale Data',
        dropReason: dropReason || 'Dropped: Stale Data',
      });
    } else {
      validArticles.push({
        ...article,
        scrapeIntegrityStatus: 'Passed',
        publishedTimestamp: pubMs,
      });
    }
  });

  return {
    ...data,
    news: validArticles,
    totalFound: validArticles.length,
    droppedCount: droppedArticles.length,
    droppedArticles: droppedArticles,
  };
}

function mergeAndDeduplicateNewsResults(responses: ScrapeResponse[]): ScrapeResponse {
  if (responses.length === 0) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      sector: 'all',
      scannedWindow: '',
      totalFound: 0,
      news: [],
      sentimentOverview: {
        bullishPercentage: 50,
        bearishPercentage: 0,
        neutralPercentage: 50,
        totalArticles: 0,
        overallMood: 'Ổn Định / An Toàn',
        moodScore: 82,
        keyDriver: 'Chưa có thông tin dữ liệu mới',
      },
      trendingKeywords: [],
      sectorStats: [],
      timelineData: [],
      urgentAlerts: [],
      sourceStats: [],
    };
  }

  const primary = responses[0];
  const articleMap = new Map<string, any>();

  for (const resp of responses) {
    if (resp && Array.isArray(resp.news)) {
      for (const art of resp.news) {
        if (!art) continue;
        const key = art.id || (art.url ? art.url.trim().toLowerCase() : art.title.trim().toLowerCase());
        if (!articleMap.has(key)) {
          articleMap.set(key, { ...art });
        } else {
          const existing = articleMap.get(key);
          if (!existing.sixW && art.sixW) existing.sixW = art.sixW;
          if (!existing.executiveDirective && art.executiveDirective) existing.executiveDirective = art.executiveDirective;
          if (art.sectors && Array.isArray(art.sectors)) {
            const mergedSectors = Array.from(new Set([...(existing.sectors || []), ...art.sectors]));
            existing.sectors = mergedSectors;
          }
        }
      }
    }
  }

  const mergedArticles = Array.from(articleMap.values());

  let bullishCount = 0;
  let bearishCount = 0;
  let neutralCount = 0;

  mergedArticles.forEach((a) => {
    if (a.sentiment === 'bullish') bullishCount++;
    else if (a.sentiment === 'bearish') bearishCount++;
    else neutralCount++;
  });

  const total = mergedArticles.length || 1;
  const bullishPct = Math.round((bullishCount / total) * 100);
  const bearishPct = Math.round((bearishCount / total) * 100);
  const neutralPct = Math.max(0, 100 - bullishPct - bearishPct);

  // =========================================================================
  // CÔNG THỨC TỔNG QUÁT TÂM LÝ THỊ TRƯỜNG & SẮC THÁI TIN TỨC:
  // M = X + Y * A - Z * B
  // Trong đó:
  // - X: Tỷ lệ % tin trung tính (Neutral %) - Vùng đệm ổn định thông tin định kỳ
  // - Y: Tỷ lệ % tin tích cực (Bullish %)
  // - Z: Tỷ lệ % tin tiêu cực (Bearish %)
  // - A: Hệ số củng cố của luồng tin tích cực (Positive Weight, chuẩn 1.05)
  // - B: Hệ số phạt / tổn thất tâm lý của tin tiêu cực (Negative Risk Weight, chuẩn 1.65 theo Prospect Theory)
  //
  // 6 Mốc phân loại cảnh báo:
  // 1. M >= 85: Tốt
  // 2. 79 <= M < 85: Cảnh báo Mức 1 (Lưu ý theo dõi)
  // 3. 75 <= M < 79: Cảnh báo Mức 2 (Thận trọng)
  // 4. 70 <= M < 75: Cảnh báo Mức 3 (Áp lực cao)
  // 5. 60 <= M < 70: Cảnh báo Mức 4 (Nguy cơ cao)
  // 6. M < 60: Cảnh báo Mức Khẩn Cấp (Báo động đỏ)
  // =========================================================================
  const bullishArticles = mergedArticles.filter(a => a.sentiment === 'bullish');
  const bearishArticles = mergedArticles.filter(a => a.sentiment === 'bearish');

  let coefA = 1.05;
  let coefB = 1.65;

  if (bullishArticles.length > 0) {
    const avgBullishScore = bullishArticles.reduce(
      (acc, a) => acc + (typeof a.sentimentScore === 'number' ? Math.max(0, a.sentimentScore) : 70),
      0
    ) / bullishArticles.length;
    coefA = Number((1.0 + (avgBullishScore / 100) * 0.1).toFixed(2));
  }

  if (bearishArticles.length > 0) {
    const avgBearishSeverity = bearishArticles.reduce(
      (acc, a) => acc + (typeof a.sentimentScore === 'number' ? Math.abs(Math.min(0, a.sentimentScore)) : 60),
      0
    ) / bearishArticles.length;
    const emergencyBoost = bearishArticles.some(a => a.isEmergency) ? 0.2 : 0;
    coefB = Number((1.5 + (avgBearishSeverity / 100) * 0.25 + emergencyBoost).toFixed(2));
  }

  // Tính điểm tổng quát M theo đúng công thức: M = X + Y*A - Z*B
  const rawM = neutralPct + (bullishPct * coefA) - (bearishPct * coefB);
  let moodScore = Math.min(100, Math.max(0, Math.round(rawM)));

  let alertLevel: 0 | 1 | 2 | 3 | 4 | 5 = 0;
  let alertLabel = 'Tốt (M ≥ 85)';
  let alertDescription = 'Chỉ số tâm lý thị trường đạt mức Tốt (≥ 85đ). Luồng thông tin tích cực và trung tính chiếm ưu thế tuyệt đối, thị trường tài chính bình ổn, niềm tin nhà đầu tư vững vàng.';
  let overallMood: 'Rất Lạc Quan' | 'Lạc Quan' | 'Trung Lập' | 'Thận Trọng' | 'Tiêu Cực' | string = 'Tốt / Ổn Định';
  let crisisProtocolRecommended = false;

  if (moodScore >= 85) {
    alertLevel = 0;
    alertLabel = 'Tốt (M ≥ 85)';
    alertDescription = 'Chỉ số tâm lý thị trường đạt mức Tốt (≥ 85đ). Luồng thông tin tích cực và trung tính chiếm ưu thế tuyệt đối, thị trường tài chính bình ổn, niềm tin nhà đầu tư vững vàng.';
    overallMood = moodScore >= 92 ? 'Rất Lạc Quan' : 'Tốt / Ổn Định';
  } else if (moodScore >= 79) {
    alertLevel = 1;
    alertLabel = 'Cảnh báo Mức 1 (79 ≤ M < 85)';
    alertDescription = 'Chỉ số tâm lý thị trường ở mức 79 - 84. Xuất hiện một số phản ánh trái chiều, cần lưu ý theo dõi luồng thông tin mới.';
    overallMood = 'Cảnh báo Mức 1 (Theo Dõi)';
  } else if (moodScore >= 75) {
    alertLevel = 2;
    alertLabel = 'Cảnh báo Mức 2 (75 ≤ M < 79)';
    alertDescription = 'Chỉ số tâm lý thị trường ở mức 75 - 78. Gia tăng thông tin thận trọng hoặc áp lực trái chiều, cần theo dõi sát và chuẩn bị phương án tham mưu.';
    overallMood = 'Cảnh báo Mức 2 (Thận Trọng)';
  } else if (moodScore >= 70) {
    alertLevel = 3;
    alertLabel = 'Cảnh báo Mức 3 (70 ≤ M < 75)';
    alertDescription = 'Chỉ số tâm lý thị trường ở mức 70 - 74. Tỷ lệ tin tức tiêu cực gia tăng rõ rệt, áp lực dư luận lan rộng, cần chủ động triển khai phương án thông tin chỉ đạo.';
    overallMood = 'Cảnh báo Mức 3 (Áp Lực Cao)';
  } else if (moodScore >= 60) {
    alertLevel = 4;
    alertLabel = 'Cảnh báo Mức 4 (60 ≤ M < 70)';
    alertDescription = 'Chỉ số tâm lý thị trường ở mức 60 - 69. Tần suất tin tiêu cực dày đặc, nguy cơ lan truyền tâm lý lo ngại trên diện rộng, các đơn vị cần chủ động phản hồi.';
    overallMood = 'Cảnh báo Mức 4 (Nguy Cơ Cao)';
  } else {
    alertLevel = 5;
    alertLabel = '🚨 Cảnh báo Khẩn Cấp (M < 60)';
    alertDescription = 'Chỉ số tâm lý thị trường dưới 60 điểm. Báo động đỏ — Kích hoạt ngay phương án xử lý khủng hoảng truyền thông khẩn cấp!';
    overallMood = 'Báo Động Đỏ - Khẩn Cấp';
    crisisProtocolRecommended = true;
  }

  const formulaComponents = {
    X: neutralPct,
    Y: bullishPct,
    Z: bearishPct,
    A: coefA,
    B: coefB,
    M: moodScore,
    status: (moodScore >= 85
      ? 'good'
      : moodScore >= 79
      ? 'warn1'
      : moodScore >= 75
      ? 'warn2'
      : moodScore >= 70
      ? 'warn3'
      : moodScore >= 60
      ? 'warn4'
      : 'emergency') as 'good' | 'warn1' | 'warn2' | 'warn3' | 'warn4' | 'emergency',
  };

  // Đánh giá và tổng hợp cảnh báo khẩn cấp chuẩn xác theo định hướng Lãnh đạo Bộ:
  // LOẠI BỎ các biến động thị trường khách quan (VN-Index, giá vàng, tỷ giá, chu kỳ mua bán) khỏi diện khẩn cấp.
  // CHỈ ĐƯA VÀO CẢNH BÁO KHẨN CẤP khi rơi vào 4 nhóm vấn đề trực tiếp của Bộ:
  // 1. Chỉ trích, lên án Bộ & đơn vị trực thuộc (CRITIQUE)
  // 2. Kêu ca, bức xúc về thủ tục hành chính, chính sách bất cập, chậm hoàn thuế (PROCEDURE_COMPLAINT)
  // 3. Kiến nghị, đề xuất, kêu cứu khó khăn của DN & nhà đầu tư gửi Bộ (PETITION_DIFFICULTY)
  // 4. Vụ việc nghiêm trọng ảnh hưởng vai trò, trách nhiệm của Bộ (ACCOUNTABILITY_IMPACT)
  const assessedCandidates = mergedArticles
    .map((article) => {
      const assessment = classifyMinistryAlert(article);
      return { article, assessment };
    })
    .filter((item) => item.assessment.isUrgent && !item.assessment.isObjectiveMarket && !item.assessment.isPostIncident);

  // Sắp xếp theo thứ tự ưu tiên tính cấp thiết chính trị & pháp lý:
  const categoryPriority: Record<string, number> = {
    CRITIQUE: 1,
    ACCOUNTABILITY_IMPACT: 2,
    PROCEDURE_COMPLAINT: 3,
    PETITION_DIFFICULTY: 4,
    MARKET_OBJECTIVE: 99,
  };

  assessedCandidates.sort((a, b) => {
    const prioA = categoryPriority[a.assessment.category] || 10;
    const prioB = categoryPriority[b.assessment.category] || 10;
    if (prioA !== prioB) return prioA - prioB;
    return new Date(b.article.publishedAt).getTime() - new Date(a.article.publishedAt).getTime();
  });

  const mergedUrgentAlerts: UrgentAlert[] = assessedCandidates.slice(0, 5).map(({ article: a, assessment }) => ({
    id: a.id,
    title: a.title,
    timeAgo: a.timeAgo || 'Vừa cập nhật',
    sector: (a.sector as SectorType) || 'policy',
    impact: 'high',
    summary: a.summary || a.snippet || a.title,
    tickers: Array.isArray(a.tickers) ? a.tickers : [],
    isEmergency: true,
    alertCategory: assessment.category,
    categoryLabelVi: assessment.categoryLabelVi,
    urgencyReason: assessment.urgencyReason,
    isObjectiveMarket: false,
  }));

  // Lọc cả primary.urgentAlerts nếu có để không để lọt tin thị trường khách quan vào
  let finalUrgentAlerts = mergedUrgentAlerts;
  if (finalUrgentAlerts.length === 0 && primary.urgentAlerts && primary.urgentAlerts.length > 0) {
    finalUrgentAlerts = primary.urgentAlerts
      .map((ua) => {
        const assess = classifyMinistryAlert({
          title: ua.title,
          summary: ua.summary,
          snippet: ua.summary,
        } as any);
        return { ua, assess };
      })
      .filter(({ assess }) => assess.isUrgent && !assess.isObjectiveMarket && !assess.isPostIncident)
      .map(({ ua, assess }) => ({
        ...ua,
        isEmergency: true,
        alertCategory: assess.category,
        categoryLabelVi: assess.categoryLabelVi,
        urgencyReason: assess.urgencyReason,
        isObjectiveMarket: false,
      }));
  }

  // Synthesize dynamic keyDriver
  let dynamicDriver = primary.sentimentOverview?.keyDriver;
  if (!dynamicDriver || dynamicDriver.includes('Cập nhật từ các cụm quản lý') || dynamicDriver.length < 15) {
    const leadArticle = mergedArticles[0];
    if (leadArticle) {
      dynamicDriver = `${leadArticle.title.slice(0, 95)} (Trọng tâm chỉ đạo Bộ Tài chính)`;
    } else {
      dynamicDriver = 'Theo dõi sát diễn biến điều hành chính sách tài khóa, thuế, hải quan và thị trường tài chính';
    }
  }

  return {
    ...primary,
    news: mergedArticles,
    totalFound: mergedArticles.length,
    urgentAlerts: finalUrgentAlerts,
    sentimentOverview: {
      ...(primary.sentimentOverview || {}),
      bullishPercentage: bullishPct,
      bearishPercentage: bearishPct,
      neutralPercentage: neutralPct,
      totalArticles: mergedArticles.length,
      overallMood,
      moodScore,
      alertLevel,
      alertLabel,
      alertDescription,
      crisisProtocolRecommended,
      formulaComponents,
      keyDriver: dynamicDriver,
    },
  };
}

async function getDatabaseBackedScrapeResponse(
  sector: SectorType = 'all',
  timeRange: TimeRange = '24h',
  label: string = 'Bộ Tài chính & Thị trường'
): Promise<ScrapeResponse> {
  try {
    const dbRes = await queryNewsDatabase({
      limit: 10000,
      sector: sector !== 'all' ? sector : undefined,
    });
    const realArticles: ScrapedNewsItem[] = dbRes?.articles && Array.isArray(dbRes.articles) ? dbRes.articles : [];

    if (realArticles.length > 0) {
      const bullish = realArticles.filter(a => a.sentiment === 'bullish').length;
      const bearish = realArticles.filter(a => a.sentiment === 'bearish').length;
      const neutral = Math.max(0, realArticles.length - bullish - bearish);
      const bullishPct = Math.round((bullish / realArticles.length) * 100);
      const bearishPct = Math.round((bearish / realArticles.length) * 100);
      const neutralPct = Math.max(0, 100 - bullishPct - bearishPct);

      const coefA = 1.05;
      const coefB = 1.65;
      const rawM = neutralPct + (bullishPct * coefA) - (bearishPct * coefB);
      const calculatedScore = Math.min(100, Math.max(0, Math.round(rawM)));

      let alertLevel: 0 | 1 | 2 | 3 | 4 | 5 = 0;
      let alertLabel = 'Tốt (M ≥ 85)';
      let alertDescription = 'Chỉ số tâm lý thị trường đạt mức Tốt (≥ 85đ). Luồng thông tin tích cực và trung tính chiếm ưu thế tuyệt đối, thị trường tài chính bình ổn, niềm tin nhà đầu tư vững vàng.';
      let overallMood = 'Tốt / Ổn Định';
      let crisisProtocolRecommended = false;

      if (calculatedScore >= 85) {
        alertLevel = 0;
        alertLabel = 'Tốt (M ≥ 85)';
        alertDescription = 'Chỉ số tâm lý thị trường đạt mức Tốt (≥ 85đ). Luồng thông tin tích cực và trung tính chiếm ưu thế tuyệt đối, thị trường tài chính bình ổn, niềm tin nhà đầu tư vững vàng.';
        overallMood = calculatedScore >= 92 ? 'Rất Lạc Quan' : 'Tốt / Ổn Định';
      } else if (calculatedScore >= 79) {
        alertLevel = 1;
        alertLabel = 'Cảnh báo Mức 1 (79 ≤ M < 85)';
        alertDescription = 'Chỉ số tâm lý thị trường ở mức 79 - 84. Xuất hiện một số phản ánh trái chiều, cần lưu ý theo dõi luồng thông tin mới.';
        overallMood = 'Cảnh báo Mức 1 (Theo Dõi)';
      } else if (calculatedScore >= 75) {
        alertLevel = 2;
        alertLabel = 'Cảnh báo Mức 2 (75 ≤ M < 79)';
        alertDescription = 'Chỉ số tâm lý thị trường ở mức 75 - 78. Gia tăng thông tin thận trọng hoặc áp lực trái chiều, cần theo dõi sát và chuẩn bị phương án tham mưu.';
        overallMood = 'Cảnh báo Mức 2 (Thận Trọng)';
      } else if (calculatedScore >= 70) {
        alertLevel = 3;
        alertLabel = 'Cảnh báo Mức 3 (70 ≤ M < 75)';
        alertDescription = 'Chỉ số tâm lý thị trường ở mức 70 - 74. Tỷ lệ tin tức tiêu cực gia tăng rõ rệt, áp lực dư luận lan rộng, cần chủ động phương án điều hành & truyền thông.';
        overallMood = 'Cảnh báo Mức 3 (Áp Lực Cao)';
      } else if (calculatedScore >= 60) {
        alertLevel = 4;
        alertLabel = 'Cảnh báo Mức 4 (60 ≤ M < 70)';
        alertDescription = 'Chỉ số tâm lý thị trường ở mức 60 - 69. Tần suất tin tiêu cực dày đặc, nguy cơ lan truyền tâm lý lo ngại trên diện rộng, các đơn vị cần chủ động phản hồi.';
        overallMood = 'Cảnh báo Mức 4 (Nguy Cơ Cao)';
      } else {
        alertLevel = 5;
        alertLabel = '🚨 Cảnh báo Khẩn Cấp (M < 60)';
        alertDescription = 'Chỉ số tâm lý thị trường dưới 60 điểm. Báo động đỏ — Kích hoạt ngay phương án xử lý khủng hoảng truyền thông khẩn cấp!';
        overallMood = 'Báo Động Đỏ - Khẩn Cấp';
        crisisProtocolRecommended = true;
      }

      return {
        success: true,
        timestamp: new Date().toISOString(),
        sector,
        scannedWindow: timeRange,
        totalFound: realArticles.length,
        news: realArticles,
        droppedCount: 0,
        droppedArticles: [],
        sentimentOverview: {
          bullishPercentage: bullishPct,
          bearishPercentage: bearishPct,
          neutralPercentage: neutralPct,
          totalArticles: realArticles.length,
          overallMood,
          moodScore: calculatedScore,
          alertLevel,
          alertLabel,
          alertDescription,
          crisisProtocolRecommended,
          formulaComponents: {
            X: neutralPct,
            Y: bullishPct,
            Z: bearishPct,
            A: coefA,
            B: coefB,
            M: calculatedScore,
            status: calculatedScore >= 85 ? 'good' : calculatedScore >= 79 ? 'warn1' : calculatedScore >= 75 ? 'warn2' : calculatedScore >= 70 ? 'warn3' : calculatedScore >= 60 ? 'warn4' : 'emergency',
          },
          keyDriver: `Dữ liệu tin tức thực tế từ cơ sở dữ liệu lưu trữ đã xác thực (${label})`,
        },
        trendingKeywords: [],
        sectorStats: [],
        timelineData: [],
        urgentAlerts: [],
        sourceStats: [],
      };
    }
  } catch (err) {
    console.warn('[DB Query Fallback Error]', err);
  }

  // Pure zero-mock state: no artificial fallback articles
  return {
    success: true,
    timestamp: new Date().toISOString(),
    sector,
    scannedWindow: timeRange,
    totalFound: 0,
    news: [],
    droppedCount: 0,
    droppedArticles: [],
    sentimentOverview: {
      bullishPercentage: 0,
      bearishPercentage: 0,
      neutralPercentage: 0,
      totalArticles: 0,
      overallMood: 'Tốt / Ổn Định (Đang kết nối)',
      moodScore: 85,
      alertLevel: 0,
      alertLabel: 'Tốt (M ≥ 85)',
      alertDescription: 'Chỉ số tâm lý thị trường đạt mức Tốt (≥ 85đ). Luồng thông tin tích cực và trung tính chiếm ưu thế tuyệt đối, thị trường tài chính bình ổn, niềm tin nhà đầu tư vững vàng.',
      keyDriver: 'Hệ thống đang kết nối trực tiếp đến các cổng thông tin điện tử của Bộ Tài chính.',
      formulaComponents: {
        X: 100,
        Y: 0,
        Z: 0,
        A: 1.05,
        B: 1.65,
        M: 85,
        status: 'good',
      },
    },
    trendingKeywords: [],
    sectorStats: [],
    timelineData: [],
    urgentAlerts: [],
    sourceStats: [],
  };
}

async function fetchSingleFinancialNewsRequest(
  timeRange: TimeRange = '24h',
  sector: SectorType = 'all',
  query: string = '',
  forceRefresh: boolean = false,
  signal?: AbortSignal,
  retryCount: number = 0,
  timeBounds?: { startTimeMs?: number; endTimeMs?: number; startTimeIso?: string; endTimeIso?: string },
  options?: FetchNewsOptions
): Promise<ScrapeResponse> {
  const reqStart = performance.now();
  const windowInfo = getVietnamCurrentTimeAndWindow(timeRange, timeBounds?.endTimeMs);
  const resolvedBounds = {
    startTimeMs: timeBounds?.startTimeMs || windowInfo.startTimeMs,
    endTimeMs: timeBounds?.endTimeMs || windowInfo.endTimeMs,
    startTimeIso: timeBounds?.startTimeIso || windowInfo.startUtcIso,
    endTimeIso: timeBounds?.endTimeIso || windowInfo.endUtcIso,
  };

  try {
    const res = await fetch('/api/scrape/financial-news', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getApiKeyHeaders(),
      },
      body: JSON.stringify({
        timeRange,
        sector,
        query,
        forceRefresh,
        fetchAll: Boolean(options?.fetchAll),
        startTimeMs: resolvedBounds.startTimeMs,
        endTimeMs: resolvedBounds.endTimeMs,
        startTimeIso: resolvedBounds.startTimeIso,
        endTimeIso: resolvedBounds.endTimeIso,
      }),
      signal,
    });

    const latencyMs = Math.round(performance.now() - reqStart);

    if (!res.ok) {
      console.warn(`⚠️ [API Request Latency] Sector "${sector}" HTTP ${res.status} in ${latencyMs}ms`);
      if (res.status >= 500 && retryCount < 1 && !signal?.aborted) {
        await new Promise((r) => setTimeout(r, 400));
        return fetchSingleFinancialNewsRequest(timeRange, sector, query, forceRefresh, signal, retryCount + 1, resolvedBounds);
      }
      return await getDatabaseBackedScrapeResponse(sector, timeRange);
    }

    const data: ScrapeResponse = await res.json();
    const result = filterNewsByTimeBounds(data, timeRange, resolvedBounds);

    if (latencyMs > 3500) {
      console.warn(`🚨 [SLA EXCEEDED] Sector "${sector}" API request took ${latencyMs}ms (>3.5s SLA target) | Articles: ${result.news?.length || 0}`);
    } else {
      console.log(`⏱️ [API Request Latency] Sector "${sector.padEnd(16)}" | Latency: ${String(latencyMs).padStart(4)}ms | Articles: ${result.news?.length || 0}`);
    }

    return result;
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - reqStart);
    if (err.name === 'AbortError' || signal?.aborted) {
      console.warn(`🚨 [SLA TIMEOUT / ABORT] Sector "${sector}" aborted after ${latencyMs}ms`);
      throw err;
    }
    if ((err.message === 'Load failed' || err.message === 'Failed to fetch' || err?.message?.includes('pattern') || err instanceof TypeError) && retryCount < 1) {
      await new Promise((r) => setTimeout(r, 400));
      return fetchSingleFinancialNewsRequest(timeRange, sector, query, forceRefresh, signal, retryCount + 1, resolvedBounds);
    }
    console.warn(`⚠️ [API Request Error] Sector "${sector}" failed after ${latencyMs}ms:`, err?.message || err);
    return await getDatabaseBackedScrapeResponse(sector, timeRange);
  }
}

// Dedicated Real API fetcher for Official Ministry of Finance News
export async function fetchOfficialMofNews(
  timeRange: TimeRange = '24h',
  sector: SectorType = 'all',
  query: string = '',
  forceRefresh: boolean = false,
  signal?: AbortSignal,
  retryCount: number = 0,
  timeBounds?: { startTimeMs?: number; endTimeMs?: number; startTimeIso?: string; endTimeIso?: string }
): Promise<ScrapeResponse> {
  const reqStart = performance.now();
  const windowInfo = getVietnamCurrentTimeAndWindow(timeRange, timeBounds?.endTimeMs);
  const resolvedBounds = {
    startTimeMs: timeBounds?.startTimeMs || windowInfo.startTimeMs,
    endTimeMs: timeBounds?.endTimeMs || windowInfo.endTimeMs,
    startTimeIso: timeBounds?.startTimeIso || windowInfo.startUtcIso,
    endTimeIso: timeBounds?.endTimeIso || windowInfo.endUtcIso,
  };

  try {
    const res = await fetch('/api/scrape/official-mof-news', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getApiKeyHeaders(),
      },
      body: JSON.stringify({
        timeRange,
        sector,
        query,
        forceRefresh,
        startTimeMs: resolvedBounds.startTimeMs,
        endTimeMs: resolvedBounds.endTimeMs,
        startTimeIso: resolvedBounds.startTimeIso,
        endTimeIso: resolvedBounds.endTimeIso,
        officialOnly: true,
      }),
      signal,
    });

    const latencyMs = Math.round(performance.now() - reqStart);

    if (!res.ok) {
      console.warn(`⚠️ [Official MoF Scrape HTTP ${res.status}] in ${latencyMs}ms`);
      if (res.status >= 500 && retryCount < 1 && !signal?.aborted) {
        await new Promise((r) => setTimeout(r, 400));
        return fetchOfficialMofNews(timeRange, sector, query, forceRefresh, signal, retryCount + 1, resolvedBounds);
      }
      return await getDatabaseBackedScrapeResponse(sector, timeRange, 'Cổng TTĐT Bộ Tài chính');
    }

    const data: ScrapeResponse = await res.json();
    console.log(`🏛️ [Official MoF Scrape] Latency: ${latencyMs}ms | Articles: ${data.news?.length || 0}`);
    return filterNewsByTimeBounds(data, timeRange, resolvedBounds);
  } catch (err: any) {
    if (err.name === 'AbortError' || signal?.aborted) throw err;
    console.warn('⚠️ [Official MoF Scrape Error]:', err?.message || err);
    return await getDatabaseBackedScrapeResponse(sector, timeRange, 'Cổng TTĐT Bộ Tài chính');
  }
}

// Live Connectivity and Latency Status for Official Portals
export async function fetchOfficialMofPortalsStatus(): Promise<{
  success: boolean;
  timestamp: string;
  portals: Array<{
    id: string;
    name: string;
    url: string;
    domain: string;
    agency: string;
    status: 'online' | 'slow' | 'offline';
    statusCode?: number;
    latencyMs: number;
    lastChecked: string;
  }>;
  allHealthy: boolean;
}> {
  try {
    const res = await fetch('/api/official-portals/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    console.warn('⚠️ [Official Portals Status Error]:', err?.message || err);
    return {
      success: false,
      timestamp: new Date().toISOString(),
      portals: [],
      allHealthy: true,
    };
  }
}

/**
 * Controlled Concurrency Batch Scraper Engine:
 * Executes batch queries across prioritized sector clusters with controlled concurrency (e.g. 3-4 parallel workers)
 * and an absolute SLA budget (default 3300ms, strictly <= 3500ms).
 */
export async function fetchFinancialNewsInBatches(
  timeRange: TimeRange = '24h',
  primarySector: SectorType = 'all',
  query: string = '',
  forceRefresh: boolean = false,
  signal?: AbortSignal,
  timeBounds?: { startTimeMs?: number; endTimeMs?: number; startTimeIso?: string; endTimeIso?: string },
  options?: FetchNewsOptions
): Promise<ScrapeResponse> {
  const batchStart = performance.now();
  const maxTimeoutMs = options?.maxTimeoutMs || 3300;
  const concurrencyLimit = Math.max(1, Math.min(options?.concurrencyLimit || 4, 8));

  // Determine clusters to scrape based on options or default prioritized groups
  let targetSectors: SectorType[] = options?.batchSectors && options.batchSectors.length > 0
    ? options.batchSectors
    : (primarySector === 'all'
      ? ['all', 'tax', 'stocks', 'bonds', 'customs', 'treasury_budget', 'macro', 'price_management']
      : [primarySector]);

  // Ensure primarySector is first in queue
  if (!targetSectors.includes(primarySector)) {
    targetSectors.unshift(primarySector);
  }

  console.log(`🚀 [Batch Scraper Engine] Initiating ${targetSectors.length} sector clusters with concurrency ${concurrencyLimit} (SLA budget: ${maxTimeoutMs}ms)`);

  const collectedResponses: ScrapeResponse[] = [];
  let isBudgetExceeded = false;

  // Controlled concurrency queue runner
  const queue = [...targetSectors];
  let activeWorkers = 0;
  let queueIndex = 0;

  // SLA Timeout Abort Signal
  const slaController = new AbortController();
  const onParentAbort = () => slaController.abort();
  if (signal) {
    if (signal.aborted) slaController.abort();
    else signal.addEventListener('abort', onParentAbort);
  }

  const timeoutTimer = setTimeout(() => {
    isBudgetExceeded = true;
    slaController.abort();
    console.warn(`⏰ [Batch Scraper Engine] SLA budget (${maxTimeoutMs}ms) reached. Aborting in-flight workers and compiling gathered responses.`);
  }, maxTimeoutMs);

  try {
    await new Promise<void>((resolve) => {
      if (queue.length === 0) {
        resolve();
        return;
      }

      const next = () => {
        if (isBudgetExceeded || slaController.signal.aborted || (queueIndex >= queue.length && activeWorkers === 0)) {
          resolve();
          return;
        }

        while (activeWorkers < concurrencyLimit && queueIndex < queue.length && !isBudgetExceeded && !slaController.signal.aborted) {
          const currentSector = queue[queueIndex++];
          activeWorkers++;

          fetchSingleFinancialNewsRequest(
            timeRange,
            currentSector,
            query,
            forceRefresh,
            slaController.signal,
            0,
            timeBounds
          )
            .then((resp) => {
              if (resp && resp.news && resp.news.length > 0) {
                collectedResponses.push(resp);
              } else if (resp && resp.success) {
                collectedResponses.push(resp);
              }
            })
            .catch((err) => {
              if (err.name !== 'AbortError') {
                console.warn(`⚠️ [Batch Worker] Sector "${currentSector}" error:`, err?.message || err);
              }
            })
            .finally(() => {
              activeWorkers--;
              next();
            });
        }
      };

      next();
    });
  } finally {
    clearTimeout(timeoutTimer);
    if (signal) {
      signal.removeEventListener('abort', onParentAbort);
    }
  }

  const totalElapsedMs = Math.round(performance.now() - batchStart);

  if (collectedResponses.length === 0) {
    console.log(`⚠️ [Batch Scraper Engine] No external responses within SLA (${totalElapsedMs}ms), falling back to database-backed response.`);
    return await getDatabaseBackedScrapeResponse(primarySector, timeRange);
  }

  const merged = mergeAndDeduplicateNewsResults(collectedResponses);
  const slaStatus = totalElapsedMs <= 3500 ? '✅ SLA PASSED' : '⚠️ SLA EXCEEDED';
  console.log(`🏁 [Batch Scraper Engine] Completed ${collectedResponses.length}/${targetSectors.length} sector batches in ${totalElapsedMs}ms | Articles: ${merged.news?.length || 0} | ${slaStatus}`);

  return merged;
}

export async function fetchFinancialNews(
  timeRange: TimeRange = '24h',
  sector: SectorType = 'all',
  query: string = '',
  forceRefresh: boolean = false,
  signal?: AbortSignal,
  retryCount: number = 0,
  timeBounds?: { startTimeMs?: number; endTimeMs?: number; startTimeIso?: string; endTimeIso?: string },
  options?: FetchNewsOptions
): Promise<ScrapeResponse> {
  // If fetchAll mode is requested, force a single, large-windowed API request for the 24h duration,
  // rather than multiple sequential paged requests, preventing the 'filling in' effect.
  if (options?.fetchAll) {
    return fetchSingleFinancialNewsRequest(timeRange, sector, query, forceRefresh, signal, retryCount, timeBounds, options);
  }

  // If batching is explicitly requested without fetchAll, use controlled concurrency batch runner
  if (options?.enableBatching) {
    return fetchFinancialNewsInBatches(
      timeRange,
      sector,
      query,
      forceRefresh,
      signal,
      timeBounds,
      options
    );
  }

  return fetchSingleFinancialNewsRequest(timeRange, sector, query, forceRefresh, signal, retryCount, timeBounds, options);
}

export async function fetchDeepDiveAnalysis(params: {
  title: string;
  summary: string;
  sector: string;
  tickers?: string[];
}): Promise<DeepDiveAnalysis> {
  const res = await fetch('/api/social-listening/deep-dive', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getApiKeyHeaders(),
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error('Không thể tải phân tích chuyên sâu.');
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Lỗi phân tích');
  }

  return data.data;
}

export async function fetchLeadershipDraftStatement(params: {
  title: string;
  summary: string;
  sector: string;
  strategyType: MediaStrategyType | string;
  agency?: string;
  whatHappened?: string;
  rootCause?: string;
}): Promise<LeadershipDraftStatement> {
  const res = await fetch('/api/social-listening/draft-statement', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getApiKeyHeaders(),
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error('Không thể tạo bản dự thảo phát ngôn cho Lãnh đạo.');
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Lỗi tạo dự thảo');
  }

  return data.data;
}

export async function fetchPolicyAdvisorySubmission(params: {
  title: string;
  summary: string;
  sector: string;
  agency?: string;
  whatHappened?: string;
  rootCause?: string;
}): Promise<PolicyAdvisorySubmission> {
  const res = await fetch('/api/social-listening/policy-submission', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getApiKeyHeaders(),
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error('Không thể lập Báo cáo Tham mưu Tờ trình Lãnh đạo.');
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Lỗi lập báo cáo tham mưu');
  }

  return data.data;
}

export async function fetchEmailDigest(params: {
  news: ScrapedNewsItem[];
  timeRange: TimeRange | string;
  sector: SectorType | string;
  sentimentOverview?: any;
  trendingKeywords?: any[];
}): Promise<EmailDigestResult> {
  const res = await fetch('/api/social-listening/email-digest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getApiKeyHeaders(),
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error('Không thể tạo Báo cáo Email Digest.');
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Lỗi khởi tạo Email Digest');
  }

  return data.data;
}

export async function fetchArticleTldrSummary(params: {
  title: string;
  summary?: string;
  keyPoints?: string[];
  sector?: string;
  source?: string;
}): Promise<{ tldrSummary: string; keyImpact?: string }> {
  const res = await fetch('/api/social-listening/tldr-summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getApiKeyHeaders(),
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error('Không thể tạo tóm tắt TL;DR.');
  }

  const data = await res.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || 'Lỗi khởi tạo tóm tắt TL;DR');
  }

  return data.data;
}

export async function fetchAppMetadata(): Promise<{ version: string; updatedAt: string }> {
  try {
    const res = await fetch('/api/app-metadata');
    if (!res.ok) {
      return { version: 'v1.1', updatedAt: '' };
    }
    return await res.json();
  } catch {
    return { version: 'v1.1', updatedAt: '' };
  }
}

// ============================================================================
// NEWS DATABASE CLIENT API
// ============================================================================

export async function queryNewsDatabase(criteria: any = {}): Promise<any> {
  const res = await fetch('/api/db/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(criteria),
  });
  if (!res.ok) {
    throw new Error('Lỗi truy vấn cơ sở dữ liệu tin tức');
  }
  return await res.json();
}

export async function fetchNewsDatabaseAnalytics(criteria: any = {}): Promise<any> {
  const res = await fetch('/api/db/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(criteria),
  });
  if (!res.ok) {
    throw new Error('Lỗi phân tích dữ liệu tin tức');
  }
  const data = await res.json();
  return data.data;
}

export async function fetchNewsDatabaseStats(): Promise<any> {
  const res = await fetch('/api/db/stats');
  if (!res.ok) {
    throw new Error('Lỗi lấy thống kê cơ sở dữ liệu');
  }
  const data = await res.json();
  return data.data;
}

export async function fetchNewsDatabaseSources(): Promise<any> {
  const res = await fetch('/api/db/sources');
  if (!res.ok) {
    throw new Error('Lỗi lấy danh sách nguồn tin');
  }
  return await res.json();
}

export async function fetchArticleRecordById(id: string): Promise<any> {
  const res = await fetch(`/api/db/article/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error('Không thể tìm thấy bài viết');
  }
  const data = await res.json();
  return data.data;
}

export async function insertArticleRecordToDb(article: any): Promise<any> {
  const res = await fetch('/api/db/article', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(article),
  });
  if (!res.ok) {
    throw new Error('Lỗi thêm bài viết vào cơ sở dữ liệu');
  }
  return await res.json();
}

export async function updateArticleRecordInDb(id: string, updates: any): Promise<any> {
  const res = await fetch(`/api/db/article/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    throw new Error('Lỗi cập nhật bài viết trong cơ sở dữ liệu');
  }
  return await res.json();
}

export async function deleteArticleRecordFromDb(id: string): Promise<any> {
  const res = await fetch(`/api/db/article/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Lỗi xóa bài viết khỏi cơ sở dữ liệu');
  }
  return await res.json();
}

export async function bulkDeleteArticlesFromDb(ids: string[]): Promise<any> {
  const res = await fetch('/api/db/article/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    throw new Error('Lỗi xóa danh sách bài viết khỏi cơ sở dữ liệu');
  }
  return await res.json();
}

export async function fetchTopicTrendInsight(params: {
  topicName: string;
  category?: string;
  currentCount?: number;
  deltaPercent?: number;
  velocityPerHour?: string;
  trendStatus?: string;
  sentimentBreakdown?: { bullish: number; bearish: number; neutral: number };
  timeInterval?: string;
  description?: string;
  matchedArticles?: Array<{ title: string; summary?: string; snippet?: string; source?: string }>;
}): Promise<{ topicName: string; executiveInsight: string }> {
  const res = await fetch('/api/social-listening/topic-trend-insight', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getApiKeyHeaders(),
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error('Không thể khởi tạo phân tích xu hướng chủ đề AI.');
  }

  const data = await res.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || 'Lỗi xử lý phản hồi từ Gemini API.');
  }

  return data.data;
}

export async function fetchExecutiveSummaryBullets(params: {
  title: string;
  summary?: string;
  sector?: string;
  source?: string;
  keyPoints?: string[];
}): Promise<{ title: string; bullets: string[] }> {
  const res = await fetch('/api/social-listening/executive-summary-bullets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getApiKeyHeaders(),
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error('Không thể khởi tạo tóm tắt điều hành 3 ý AI.');
  }

  const data = await res.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || 'Lỗi xử lý tóm tắt từ Gemini API.');
  }

  return data.data;
}

export async function fetchTailoredReSummary(params: {
  title: string;
  summary?: string;
  sector?: string;
  source?: string;
  keyPoints?: string[];
  audienceLevel: LeadershipLevel;
  lengthMode?: SummaryLengthMode;
}): Promise<TailoredReSummary> {
  const res = await fetch('/api/social-listening/re-summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getApiKeyHeaders(),
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error('Không thể khởi tạo tóm tắt lại theo cấp bậc lãnh đạo.');
  }

  const data = await res.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || 'Lỗi xử lý phản hồi từ Gemini API.');
  }

  return data.data;
}

// ============================================================================
// 30 CORE SOURCES MANAGEMENT & QUEUE CONTROLS
// ============================================================================

export interface ManagedSourceItem {
  id: string;
  name: string;
  shortName: string;
  domain: string;
  tier: 'tier1' | 'tier2' | 'tier3';
  tierLabel: string;
  category: string;
  categoryLabelVi: string;
  trafficPriority: 'high' | 'medium' | 'standard';
  trafficRank: number;
  authorityWeight: number;
  description: string;
  enabled: boolean;
  sessionStatus: 'scanned' | 'scanning' | 'pending' | 'disabled';
  articlesFound: number;
  lastScannedAt: string;
  latencyMs: number;
}

export interface SourcesManagementResponse {
  success: boolean;
  totalSources: number;
  enabledCount: number;
  disabledCount: number;
  scannedCount: number;
  pendingCount: number;
  scanningCount: number;
  isScanning: boolean;
  categories: Array<{
    id: string;
    nameVi: string;
    total: number;
    enabled: number;
  }>;
  sources: ManagedSourceItem[];
}

export async function fetchSourcesManagement(): Promise<SourcesManagementResponse> {
  const res = await fetch('/api/sources/management');
  if (!res.ok) {
    throw new Error('Không thể tải cấu hình 30 nguồn báo');
  }
  return res.json();
}

export async function toggleSourceStatus(payload: {
  action: 'single' | 'category' | 'all' | 'batch';
  sourceId?: string;
  category?: string;
  enabled?: boolean;
  enabledSourceIds?: string[];
}): Promise<{ success: boolean; enabledCount: number; disabledCount: number }> {
  const res = await fetch('/api/sources/toggle', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Không thể cập nhật cấu hình nguồn báo');
  }
  return res.json();
}

export async function addCustomSource(sourceData: {
  name: string;
  shortName?: string;
  domain: string;
  tier?: 'tier1' | 'tier2' | 'tier3';
  tierLabel?: string;
  category?: string;
  categoryLabelVi?: string;
  trafficPriority?: 'high' | 'medium' | 'standard';
  authorityWeight?: number;
  description?: string;
  rssUrl?: string;
  categoryUrls?: string[];
}): Promise<{ success: boolean; message: string; source: ManagedSourceItem; totalSources: number }> {
  const res = await fetch('/api/sources/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sourceData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Không thể thêm đầu báo mới vào kho');
  }
  return res.json();
}

export async function deleteSource(sourceId: string): Promise<{ success: boolean; message: string; sourceId: string; totalSources: number }> {
  const res = await fetch('/api/sources/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Không thể gỡ bỏ đầu báo khỏi kho');
  }
  return res.json();
}

export async function resetSourcesToDefault(): Promise<{ success: boolean; message: string; totalSources: number }> {
  const res = await fetch('/api/sources/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Không thể khôi phục danh mục nguồn báo');
  }
  return res.json();
}




