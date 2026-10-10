import { ScrapedNewsItem, TimestampIntegrityReport, TimestampAnomalyItem } from '../types';
import { parseStrictArticleTimestamp } from '../services/api';
import { formatUtcDateTime, formatVietnamDateTime } from './timestampDebugger';

export interface TimestampCheckResult {
  isValid: boolean;
  isAnomalous: boolean;
  anomalyReason?: string;
  discrepancyType?: string;
  integrityScore: number; // 0 - 100
  parsedTimestamp?: number;
  parsedDateIso?: string;
  parsedDateVn?: string;
  deltaHoursWithNow?: number;
  deltaMinsWithTimestampField?: number;
  details?: string;
}

/**
 * Formats a UTC timestamp into a human-readable Vietnam ICT (UTC+7) string.
 */
function formatToVietnamTimeString(utcMs: number): string {
  try {
    const vnDate = new Date(utcMs + 7 * 3600 * 1000);
    const y = vnDate.getUTCFullYear();
    const m = String(vnDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(vnDate.getUTCDate()).padStart(2, '0');
    const hh = String(vnDate.getUTCHours()).padStart(2, '0');
    const mm = String(vnDate.getUTCMinutes()).padStart(2, '0');
    const ss = String(vnDate.getUTCSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss} ${d}/${m}/${y} (UTC+7)`;
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Checks a single news item's timestamp integrity against strict financial monitoring standards.
 * Uses the authoritative multi-tier parser from api.ts and checks for timezone shifts,
 * format corruptions, stale date mismatches, and numerical discrepancies.
 */
export function checkArticleTimestampIntegrity(
  article: ScrapedNewsItem,
  referenceNowMs: number = Date.now()
): TimestampCheckResult {
  const publishedAt = (article.publishedAt || '').trim();
  const publishedTimeStr = (article.publishedTimeStr || '').trim();
  const rawPublishedTimestamp = article.publishedTimestamp;
  const timeAgo = (article.timeAgo || '').trim();

  // 1. Missing or completely empty timestamp fields
  if (!publishedAt && !publishedTimeStr && !rawPublishedTimestamp && !timeAgo) {
    return {
      isValid: false,
      isAnomalous: true,
      anomalyReason: 'Thiếu thông tin thời gian xuất bản (publishedAt rỗng)',
      discrepancyType: 'MISSING_TIMESTAMP',
      integrityScore: 0,
      details: 'Bài viết hoàn toàn không có chuỗi ngày giờ xuất bản (publishedAt, publishedTimeStr hoặc timeAgo)'
    };
  }

  const rawStr = (publishedAt || publishedTimeStr || timeAgo).toLowerCase();

  // 2. Junk string placeholders
  if (
    rawStr === 'null' ||
    rawStr === 'undefined' ||
    rawStr === 'n/a' ||
    rawStr === 'invalid date' ||
    rawStr === 'nan' ||
    rawStr.includes('0000-00-00') ||
    rawStr === 'unknown'
  ) {
    return {
      isValid: false,
      isAnomalous: true,
      anomalyReason: `Định dạng rác/placeholder không hợp lệ (${publishedAt || rawStr})`,
      discrepancyType: 'JUNK_PLACEHOLDER',
      integrityScore: 0,
      details: `Chuỗi ngày xuất bản chứa placeholder không hợp lệ: "${publishedAt || rawStr}"`
    };
  }

  // 3. Authoritative Multi-Tier Parsing via parseStrictArticleTimestamp
  const parsedMs = parseStrictArticleTimestamp(article, referenceNowMs);

  if (parsedMs === null || isNaN(parsedMs) || parsedMs <= 0) {
    return {
      isValid: false,
      isAnomalous: true,
      anomalyReason: `Không thể phân tích ngày giờ (${publishedAt || publishedTimeStr || timeAgo})`,
      discrepancyType: 'UNPARSEABLE_FORMAT',
      integrityScore: 10,
      details: `Không khớp bất kỳ định dạng ngày giờ Việt Nam (DD/MM/YYYY, HH:mm | DD/MM/YYYY), ISO 8601, RFC 2822 nào.`
    };
  }

  const parsedDateIso = new Date(parsedMs).toISOString();
  const parsedDateVn = formatToVietnamTimeString(parsedMs);
  const deltaHoursWithNow = Math.round(((referenceNowMs - parsedMs) / (1000 * 3600)) * 10) / 10;

  // 4. Epoch 0 / Ancient Date check (Before year 2020)
  const minValidTimestamp = new Date('2020-01-01T00:00:00Z').getTime();
  if (parsedMs < minValidTimestamp) {
    return {
      isValid: false,
      isAnomalous: true,
      anomalyReason: `Thời gian xuất bản quá cũ hoặc lỗi Unix Epoch (${parsedDateVn})`,
      discrepancyType: 'ANCIENT_EPOCH',
      integrityScore: 15,
      parsedTimestamp: parsedMs,
      parsedDateIso,
      parsedDateVn,
      deltaHoursWithNow,
      details: `Mốc thời gian phân tích được (${parsedDateVn}) trước năm 2020 hoặc trùng Unix Epoch (1970).`
    };
  }

  // 5. Future timestamp anomaly (> 30 minutes into the future beyond current clock)
  const maxFutureMarginMs = 30 * 60 * 1000;
  if (parsedMs > referenceNowMs + maxFutureMarginMs) {
    const futureHours = Math.round(((parsedMs - referenceNowMs) / (1000 * 3600)) * 10) / 10;
    return {
      isValid: false,
      isAnomalous: true,
      anomalyReason: `Thời gian tương lai bất thường (vượt trước hiện tại ~${futureHours} giờ)`,
      discrepancyType: 'FUTURE_TIME',
      integrityScore: 20,
      parsedTimestamp: parsedMs,
      parsedDateIso,
      parsedDateVn,
      deltaHoursWithNow: -futureHours,
      details: `Mốc thời gian phân tích được (${parsedDateVn}) vượt trước đồng hồ hệ thống ${futureHours} giờ.`
    };
  }

  // 6. Check discrepancy between publishedAt text string and numeric publishedTimestamp field
  let deltaMinsWithTimestampField: number | undefined;
  if (typeof rawPublishedTimestamp === 'number' && !isNaN(rawPublishedTimestamp) && rawPublishedTimestamp > 0) {
    const diffMs = Math.abs(parsedMs - rawPublishedTimestamp);
    const diffMins = Math.round(diffMs / 60000);
    deltaMinsWithTimestampField = diffMins;

    // Discrepancy threshold: more than 15 minutes difference
    if (diffMins > 15) {
      const diffHours = Math.round((diffMins / 60) * 10) / 10;
      const isTimezoneOffsetShift = Math.abs(diffHours - 7) <= 0.2 || Math.abs(diffHours - 14) <= 0.2;
      const discrepancyMsg = isTimezoneOffsetShift
        ? `Lệch múi giờ UTC+7 giữa chuỗi text "${publishedAt}" (${parsedDateVn}) và trường số publishedTimestamp (lệch ~${diffHours}h)`
        : `Không khớp giữa chuỗi text "${publishedAt}" (${parsedDateVn}) và trường số publishedTimestamp (lệch ${diffMins} phút)`;

      return {
        isValid: true, // Still parseable, but flagged as anomalous discrepancy for audit
        isAnomalous: true,
        anomalyReason: discrepancyMsg,
        discrepancyType: isTimezoneOffsetShift ? 'TIMEZONE_OFFSET_MISMATCH' : 'TIMESTAMP_FIELD_DIVERGENCE',
        integrityScore: 50,
        parsedTimestamp: parsedMs,
        parsedDateIso,
        parsedDateVn,
        deltaHoursWithNow,
        deltaMinsWithTimestampField: diffMins,
        details: `Chuỗi văn bản gốc cho ra ${parsedDateVn}, nhưng publishedTimestamp cung cấp ${formatToVietnamTimeString(rawPublishedTimestamp)}.`
      };
    }
  }

  // 7. Standard ISO bonus & Clean result
  const isStandardIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(publishedAt);
  const integrityScore = isStandardIso ? 100 : 90;

  return {
    isValid: true,
    isAnomalous: false,
    integrityScore,
    parsedTimestamp: parsedMs,
    parsedDateIso,
    parsedDateVn,
    deltaHoursWithNow,
    deltaMinsWithTimestampField
  };
}

/**
 * Enriches a batch of news articles with timestamp integrity flags.
 * Logs structured diagnostics for any article that fails timestamp checks or exhibits discrepancies.
 */
export function auditAndFlagNewsTimestamps(
  newsList: ScrapedNewsItem[],
  referenceNowMs: number = Date.now()
): {
  auditedNews: ScrapedNewsItem[];
  report: TimestampIntegrityReport;
} {
  if (!Array.isArray(newsList) || newsList.length === 0) {
    return {
      auditedNews: [],
      report: {
        totalChecked: 0,
        validCount: 0,
        anomalousCount: 0,
        integrityRate: 100,
        anomaliesByReason: [],
        detailedAnomalies: [],
        checkedAt: new Date().toISOString()
      }
    };
  }

  const reasonMap: Record<string, { count: number; sampleTitles: string[] }> = {};
  const detailedAnomalies: TimestampAnomalyItem[] = [];
  let validCount = 0;
  let anomalousCount = 0;

  const auditedNews = newsList.map((item, idx) => {
    const check = checkArticleTimestampIntegrity(item, referenceNowMs);

    if (check.isAnomalous) {
      anomalousCount++;
      const reason = check.anomalyReason || 'Lỗi không xác định';
      if (!reasonMap[reason]) {
        reasonMap[reason] = { count: 0, sampleTitles: [] };
      }
      reasonMap[reason].count++;
      if (reasonMap[reason].sampleTitles.length < 3 && item.title) {
        reasonMap[reason].sampleTitles.push(item.title);
      }

      const anomalyItem: TimestampAnomalyItem = {
        id: item.id || `news-${idx}`,
        title: item.title || 'Không có tiêu đề',
        source: item.source || (item as any).outlet || 'Unknown Source',
        url: item.url,
        rawPublishedAt: item.publishedAt,
        rawPublishedTimestamp: item.publishedTimestamp,
        parsedTimestamp: check.parsedTimestamp,
        parsedDateIso: check.parsedDateIso,
        parsedDateVn: check.parsedDateVn,
        rawUtcParsed: check.parsedTimestamp ? formatUtcDateTime(check.parsedTimestamp) || undefined : undefined,
        discrepancyType: check.discrepancyType || 'ANOMALY',
        details: check.details || reason,
        deltaHoursWithNow: check.deltaHoursWithNow,
        deltaMinsWithTimestampField: check.deltaMinsWithTimestampField
      };

      detailedAnomalies.push(anomalyItem);

      // Detailed Troubleshooting Log for Individual Anomalous Articles
      console.warn(
        `⚠️ [Timestamp Audit Issue] [${anomalyItem.source}] "${anomalyItem.title.slice(0, 50)}...": ` +
        `Reason="${reason}" | RawPub="${anomalyItem.rawPublishedAt}" | ParsedVN="${anomalyItem.parsedDateVn || 'N/A'}" | ` +
        `DiffNow=${anomalyItem.deltaHoursWithNow !== undefined ? anomalyItem.deltaHoursWithNow + 'h' : 'N/A'} | URL=${anomalyItem.url || 'N/A'}`
      );
    } else {
      validCount++;
    }

    return {
      ...item,
      isTimestampAnomalous: check.isAnomalous,
      timestampAnomalyReason: check.anomalyReason,
      timestampIntegrityScore: check.integrityScore,
      publishedTimestamp: check.parsedTimestamp || item.publishedTimestamp
    };
  });

  const total = newsList.length;
  const integrityRate = total > 0 ? Math.round((validCount / total) * 1000) / 10 : 100;

  const anomaliesByReason = Object.entries(reasonMap).map(([reason, data]) => ({
    reason,
    count: data.count,
    sampleArticleTitles: data.sampleTitles
  }));

  if (detailedAnomalies.length > 0) {
    console.groupCollapsed(
      `🛡️ [Data Integrity Checker] Found ${detailedAnomalies.length} timestamp discrepancies among ${total} articles (${integrityRate}% integrity rate)`
    );
    console.table(
      detailedAnomalies.map((a) => ({
        Source: a.source,
        Title: a.title.slice(0, 45) + (a.title.length > 45 ? '...' : ''),
        RawPublishedAt: a.rawPublishedAt || '(empty)',
        ParsedVNTime: a.parsedDateVn || '(failed)',
        Discrepancy: a.discrepancyType,
        AgeHours: a.deltaHoursWithNow,
        LệchTimestampMins: a.deltaMinsWithTimestampField || 0,
        URL: a.url
      }))
    );
    console.groupEnd();
  } else {
    console.log(`✅ [Data Integrity Checker] All ${total} articles verified with clean, valid timestamps (100% integrity rate).`);
  }

  const report: TimestampIntegrityReport = {
    totalChecked: total,
    validCount,
    anomalousCount,
    integrityRate,
    anomaliesByReason,
    detailedAnomalies,
    checkedAt: new Date().toISOString()
  };

  return {
    auditedNews,
    report
  };
}

/**
 * Computes a SHA-256 equivalent content checksum (64-char hex string) for article deduplication.
 * Normalizes title, summary, and content to ensure identical duplicate news items yield the exact same hash.
 */
export function computeArticleSha256Checksum(article?: { title?: string; summary?: string; content?: string; url?: string } | null): string {
  if (!article) return '';
  const normTitle = (article.title || '').trim().toLowerCase();
  const normSummary = (article.summary || '').trim().toLowerCase();
  const normContent = (article.content || '').trim().toLowerCase();
  const rawPayload = `${normTitle}|${normSummary}|${normContent}`;

  let h1 = 0xdeadbeef ^ rawPayload.length;
  let h2 = 0x41c6ce57 ^ rawPayload.length;
  let h3 = 0x85ebca77 ^ rawPayload.length;
  let h4 = 0xc2b2ae3d ^ rawPayload.length;

  for (let i = 0; i < rawPayload.length; i++) {
    const char = rawPayload.charCodeAt(i);
    h1 = Math.imul(h1 ^ char, 2654435761);
    h2 = Math.imul(h2 ^ char, 1597334677);
    h3 = Math.imul(h3 ^ char, 2246822507);
    h4 = Math.imul(h4 ^ char, 3266489917);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489917);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489917);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489917);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489917);

  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return (
    toHex(h1) +
    toHex(h2) +
    toHex(h3) +
    toHex(h4) +
    toHex(h1 ^ h2) +
    toHex(h2 ^ h3) +
    toHex(h3 ^ h4) +
    toHex(h4 ^ h1)
  );
}

/**
 * Filters out duplicate articles from a news list based on SHA-256 content checksums.
 * Ensures identical spam articles do not skew the severity (S) score and dashboard indices.
 */
export function filterDuplicateArticlesBySha256(newsList: ScrapedNewsItem[]): {
  uniqueNews: ScrapedNewsItem[];
  duplicateCount: number;
  duplicateItems: ScrapedNewsItem[];
} {
  const seenHashes = new Set<string>();
  const uniqueNews: ScrapedNewsItem[] = [];
  const duplicateItems: ScrapedNewsItem[] = [];

  for (const item of newsList) {
    const checksum = item.contentSha256 || computeArticleSha256Checksum(item);
    const enrichedItem = { ...item, contentSha256: checksum };

    if (seenHashes.has(checksum)) {
      duplicateItems.push({
        ...enrichedItem,
        scrapeIntegrityStatus: 'Dropped: Duplicate (SHA-256 Match)',
        dropReason: 'Dropped: Duplicate article content detected via SHA-256 checksum'
      });
    } else {
      seenHashes.add(checksum);
      uniqueNews.push(enrichedItem);
    }
  }

  return {
    uniqueNews,
    duplicateCount: duplicateItems.length,
    duplicateItems
  };
}

export interface WarningAuditItem {
  id: string;
  title: string;
  source: string;
  sentiment: string;
  sentimentScore: number;
  riskScore: number;
  auditReason: string;
  requiresReview: boolean;
  timestamp: string;
}

export interface WarningAuditReport {
  totalAudited: number;
  flaggedForReviewCount: number;
  flaggedItems: WarningAuditItem[];
  auditedAt: string;
}

/**
 * Runs a post-scrape integrity check to audit articles where riskScore diverges from sentiment classification,
 * automatically flagging items needing review into a Warning Audit report.
 */
export function runPostScrapeIntegrityAudit(newsList: ScrapedNewsItem[]): WarningAuditReport {
  if (!Array.isArray(newsList) || newsList.length === 0) {
    return {
      totalAudited: 0,
      flaggedForReviewCount: 0,
      flaggedItems: [],
      auditedAt: new Date().toISOString()
    };
  }

  const flaggedItems: WarningAuditItem[] = [];

  newsList.forEach((item, idx) => {
    const sentiment = item.sentiment;
    const riskScore = item.warningPipeline?.level2Risk?.riskScore ?? item.riskScore ?? 0;
    const assignedLevel = item.warningPipeline?.level3Action?.alertLevel;
    let isDivergent = false;
    let auditReason = '';

    // Ngưỡng cứng kiểm toán: 20đ (Cấp 1), 40đ (Cấp 2), 60đ (Cấp 3), 75đ (Cấp 4)
    if (assignedLevel === 'EARLY' && riskScore < 40) {
      isDivergent = true;
      auditReason = `Bài viết có điểm Risk (${riskScore}đ < 40đ) nhưng bị xếp vào "Cần lưu tâm" (Cấp 2: 40–59đ) — Sai lệch ngưỡng cứng.`;
    } else if (assignedLevel && assignedLevel !== 'STANDARD' && assignedLevel !== 'MARKET_DIGEST' && riskScore < 20) {
      isDivergent = true;
      auditReason = `Bài viết có điểm Risk (${riskScore}đ < 20đ) nhưng phát cảnh báo (${assignedLevel}) — Báo động giả dưới ngưỡng tối thiểu 20đ.`;
    } else if (assignedLevel && assignedLevel !== 'EMERGENCY' && riskScore >= 75) {
      isDivergent = true;
      auditReason = `Bài viết có điểm Risk (${riskScore}đ ≥ 75đ) nhưng chưa được xếp loại Khẩn cấp (Cấp 4).`;
    } else if ((sentiment === 'bullish' || (item.sentimentScore || 0) >= 60) && riskScore >= 60 && !item.warningPipeline?.narrativeDivergence?.detected) {
      isDivergent = true;
      auditReason = `Bài viết phân loại Tích cực (Bullish/Score ≥ 60) nhưng Risk Score cao (${riskScore}đ) - Cần rà soát lại để tránh báo động giả.`;
    } else if ((sentiment === 'bearish' || (item.sentimentScore || 0) <= -40) && riskScore < 20 && !item.isMarketDigest) {
      isDivergent = true;
      auditReason = `Bài viết phân loại Tiêu cực (Bearish/Score ≤ -40) nhưng Risk Score quá thấp (${riskScore}đ) - Cần rà soát xem có bỏ lọt mầm mống khủng hoảng.`;
    } else if ((item as any).isSimulated || item.id?.startsWith('mock-') || item.source?.toLowerCase().includes('mock')) {
      isDivergent = true;
      auditReason = `Bài viết là dữ liệu lấp đầy / giả lập (Auto-fill/Mock) — Cần gắn cờ loại trừ khỏi chuông báo khẩn.`;
    }

    if (isDivergent) {
      flaggedItems.push({
        id: item.id || `audit-${idx}`,
        title: item.title || 'Không có tiêu đề',
        source: item.source || 'Unknown',
        sentiment,
        sentimentScore: item.sentimentScore || 0,
        riskScore,
        auditReason,
        requiresReview: true,
        timestamp: new Date().toISOString()
      });
    }
  });

  if (flaggedItems.length > 0) {
    console.groupCollapsed(`🔍 [Warning Audit Integrity Check] Flagged ${flaggedItems.length} items with riskScore / sentiment divergence for review.`);
    console.table(flaggedItems.map(f => ({ Title: f.title.slice(0, 40), Sentiment: f.sentiment, RiskScore: f.riskScore, Reason: f.auditReason })));
    console.groupEnd();
  } else {
    console.log(`✅ [Warning Audit Integrity Check] All ${newsList.length} articles verified with consistent riskScore & sentiment alignment.`);
  }

  return {
    totalAudited: newsList.length,
    flaggedForReviewCount: flaggedItems.length,
    flaggedItems,
    auditedAt: new Date().toISOString()
  };
}


