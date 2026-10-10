import { ScrapedNewsItem, TimeRange } from '../types';
import { parseStrictArticleTimestamp } from '../services/api';

export interface UtcVsVietnamComparison {
  articleId?: string;
  title: string;
  source: string;
  url?: string;
  
  // Raw inputs
  rawPublishedAt?: string;
  rawPublishedTimeStr?: string;
  rawPublishedTimestamp?: number;
  rawTimeAgo?: string;

  // Parsed UTC representation
  parsedUtcMs: number | null;
  parsedUtcIso: string | null;
  parsedUtcFormatted: string | null;

  // Calculated Vietnam (UTC+7) representation
  calculatedVietnamMs: number | null;
  calculatedVietnamIso: string | null;
  calculatedVietnamFormatted: string | null;

  // Window references
  currentVietnamTimeIso: string;
  currentVietnamTimeFormatted: string;
  windowStartVietnamIso: string;
  windowStartVietnamFormatted: string;
  windowEndVietnamIso: string;
  windowEndVietnamFormatted: string;
  
  // Metrics & Diagnosis
  ageHoursFromCurrentVn: number | null;
  deltaMinsWithTimestampField: number | null;
  isWithin24hWindow: boolean;
  isIncorrectlyIncluded: boolean;
  verdict: 'VALID_IN_WINDOW' | 'STALE_PRIOR_DAY' | 'FUTURE_INACCURATE' | 'TIMEZONE_OFFSET_MISMATCH' | 'UNPARSEABLE';
  diagnosticExplanation: string;
}

export interface WindowAuditDiagnosisReport {
  totalAnalyzed: number;
  validInWindowCount: number;
  incorrectlyIncludedCount: number;
  stalePriorDayCount: number;
  timezoneOffsetMismatchCount: number;
  unparseableCount: number;
  windowInfo: {
    timeRange: TimeRange;
    windowMinutes: number;
    currentVietnamTime: string;
    windowStartVietnam: string;
    windowEndVietnam: string;
    windowStartUtcMs: number;
    windowEndUtcMs: number;
  };
  incorrectArticles: UtcVsVietnamComparison[];
  allComparisons: UtcVsVietnamComparison[];
}

/**
 * Formats a millisecond timestamp to a strict UTC string: HH:mm:ss DD/MM/YYYY (UTC)
 */
export function formatUtcDateTime(utcMs: number | null | undefined): string | null {
  if (typeof utcMs !== 'number' || isNaN(utcMs) || utcMs <= 0) return null;
  try {
    const d = new Date(utcMs);
    const pad = (n: number) => String(n).padStart(2, '0');
    const hh = pad(d.getUTCHours());
    const mm = pad(d.getUTCMinutes());
    const ss = pad(d.getUTCSeconds());
    const dd = pad(d.getUTCDate());
    const mon = pad(d.getUTCMonth() + 1);
    const yyyy = d.getUTCFullYear();
    return `${hh}:${mm}:${ss} ${dd}/${mon}/${yyyy} (UTC)`;
  } catch {
    return null;
  }
}

/**
 * Formats a millisecond timestamp to a strict Vietnam Time (UTC+7) string: HH:mm:ss DD/MM/YYYY (UTC+7)
 */
export function formatVietnamDateTime(utcMs: number | null | undefined): string | null {
  if (typeof utcMs !== 'number' || isNaN(utcMs) || utcMs <= 0) return null;
  try {
    const vnDate = new Date(utcMs + 7 * 3600 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const hh = pad(vnDate.getUTCHours());
    const mm = pad(vnDate.getUTCMinutes());
    const ss = pad(vnDate.getUTCSeconds());
    const dd = pad(vnDate.getUTCDate());
    const mon = pad(vnDate.getUTCMonth() + 1);
    const yyyy = vnDate.getUTCFullYear();
    return `${hh}:${mm}:${ss} ${dd}/${mon}/${yyyy} (UTC+7)`;
  } catch {
    return null;
  }
}

/**
 * Formats a millisecond timestamp to an ISO string with explicit +07:00 Vietnam timezone offset
 */
export function formatVietnamIsoString(utcMs: number | null | undefined): string | null {
  if (typeof utcMs !== 'number' || isNaN(utcMs) || utcMs <= 0) return null;
  try {
    const vnDate = new Date(utcMs + 7 * 3600 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = vnDate.getUTCFullYear();
    const mm = pad(vnDate.getUTCMonth() + 1);
    const dd = pad(vnDate.getUTCDate());
    const hh = pad(vnDate.getUTCHours());
    const min = pad(vnDate.getUTCMinutes());
    const ss = pad(vnDate.getUTCSeconds());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+07:00`;
  } catch {
    return null;
  }
}

/**
 * Calculates current Vietnam (UTC+7) time and computes exact startTimeMs / endTimeMs by subtracting
 * the requested window (e.g. 24h = 1440m) from current Vietnam time.
 */
export function getVietnamCurrentTimeAndWindow(
  timeRange: TimeRange = '24h',
  customEndMs?: number
): {
  nowVnMs: number;
  nowVnIso: string;
  nowVnFormatted: string;
  startTimeMs: number;
  endTimeMs: number;
  startVnIso: string;
  endVnIso: string;
  startVnFormatted: string;
  endVnFormatted: string;
  startUtcIso: string;
  endUtcIso: string;
  windowMinutes: number;
} {
  const endMs = typeof customEndMs === 'number' && !isNaN(customEndMs) && customEndMs > 0
    ? customEndMs
    : Date.now();

  const windowMinutes =
    timeRange === '24h'
      ? 1440
      : timeRange === '8h'
      ? 480
      : timeRange === '4h'
      ? 240
      : timeRange === '2h'
      ? 120
      : 60;

  // Subtracting the window from the current Vietnam time anchor
  const startMs = endMs - windowMinutes * 60 * 1000;

  const nowVnIso = formatVietnamIsoString(endMs)!;
  const nowVnFormatted = formatVietnamDateTime(endMs)!;
  const startVnIso = formatVietnamIsoString(startMs)!;
  const endVnIso = formatVietnamIsoString(endMs)!;
  const startVnFormatted = formatVietnamDateTime(startMs)!;
  const endVnFormatted = formatVietnamDateTime(endMs)!;
  const startUtcIso = new Date(startMs).toISOString();
  const endUtcIso = new Date(endMs).toISOString();

  return {
    nowVnMs: endMs,
    nowVnIso,
    nowVnFormatted,
    startTimeMs: startMs,
    endTimeMs: endMs,
    startVnIso,
    endVnIso,
    startVnFormatted,
    endVnFormatted,
    startUtcIso,
    endUtcIso,
    windowMinutes,
  };
}

/**
 * Analyzes and compares the Raw UTC timestamp vs calculated Vietnam (UTC+7) timestamp
 * for a single article within a specified time window.
 */
export function compareArticleUtcVsVietnamTimestamp(
  article: Partial<ScrapedNewsItem>,
  options: {
    timeRange?: TimeRange;
    referenceNowMs?: number;
    customStartTimeMs?: number;
    customEndTimeMs?: number;
  } = {}
): UtcVsVietnamComparison {
  const { timeRange = '24h', referenceNowMs = Date.now(), customStartTimeMs, customEndTimeMs } = options;
  const windowInfo = getVietnamCurrentTimeAndWindow(timeRange, customEndTimeMs || referenceNowMs);

  const effectiveStartMs = customStartTimeMs || windowInfo.startTimeMs;
  const effectiveEndMs = customEndTimeMs || windowInfo.endTimeMs;
  const toleranceMs = 3 * 60 * 1000; // 3 mins clock skew tolerance

  const rawPubAt = article.publishedAt;
  const rawPubTimeStr = article.publishedTimeStr;
  const rawPubTimestamp = article.publishedTimestamp;
  const rawTimeAgo = article.timeAgo;

  const parsedUtcMs = parseStrictArticleTimestamp(article, referenceNowMs);

  let parsedUtcIso: string | null = null;
  let parsedUtcFormatted: string | null = null;
  let calculatedVietnamIso: string | null = null;
  let calculatedVietnamFormatted: string | null = null;
  let ageHoursFromCurrentVn: number | null = null;
  let deltaMinsWithTimestampField: number | null = null;

  let isWithin24hWindow = false;
  let isIncorrectlyIncluded = false;
  let verdict: UtcVsVietnamComparison['verdict'] = 'UNPARSEABLE';
  let diagnosticExplanation = '';

  if (parsedUtcMs === null || isNaN(parsedUtcMs) || parsedUtcMs <= 0) {
    verdict = 'UNPARSEABLE';
    isIncorrectlyIncluded = true;
    diagnosticExplanation = `Không thể phân giải thời gian từ chuỗi thô: "${rawPubAt || rawPubTimeStr || rawTimeAgo || 'trống'}".`;
  } else {
    parsedUtcIso = new Date(parsedUtcMs).toISOString();
    parsedUtcFormatted = formatUtcDateTime(parsedUtcMs);
    calculatedVietnamIso = formatVietnamIsoString(parsedUtcMs);
    calculatedVietnamFormatted = formatVietnamDateTime(parsedUtcMs);

    ageHoursFromCurrentVn = Math.round(((referenceNowMs - parsedUtcMs) / (3600 * 1000)) * 100) / 100;

    // Check discrepancy with raw publishedTimestamp field if present
    if (typeof rawPubTimestamp === 'number' && !isNaN(rawPubTimestamp) && rawPubTimestamp > 0) {
      const diffMs = Math.abs(parsedUtcMs - rawPubTimestamp);
      deltaMinsWithTimestampField = Math.round(diffMs / 60000);
    }

    const minAllowedMs = effectiveStartMs - toleranceMs;
    const maxAllowedMs = effectiveEndMs + toleranceMs;

    if (parsedUtcMs < minAllowedMs) {
      isWithin24hWindow = false;
      isIncorrectlyIncluded = true;
      verdict = 'STALE_PRIOR_DAY';
      const staleHours = Math.round(((effectiveStartMs - parsedUtcMs) / (3600 * 1000)) * 10) / 10;
      diagnosticExplanation = `Bài viết thuộc ngày trước (${calculatedVietnamFormatted}), cũ hơn mốc bắt đầu cửa sổ quét (${windowInfo.startVnFormatted}) khoảng ${staleHours} giờ.`;
    } else if (parsedUtcMs > maxAllowedMs) {
      isWithin24hWindow = false;
      isIncorrectlyIncluded = true;
      verdict = 'FUTURE_INACCURATE';
      const futureHours = Math.round(((parsedUtcMs - effectiveEndMs) / (3600 * 1000)) * 10) / 10;
      diagnosticExplanation = `Bài viết có thời gian tương lai bất thường (${calculatedVietnamFormatted}), vượt trước hiện tại (${windowInfo.nowVnFormatted}) ${futureHours} giờ.`;
    } else {
      isWithin24hWindow = true;

      // Check for timezone offset corruption
      if (deltaMinsWithTimestampField !== null && deltaMinsWithTimestampField > 15) {
        const diffHours = Math.round((deltaMinsWithTimestampField / 60) * 10) / 10;
        if (Math.abs(diffHours - 7) <= 0.2 || Math.abs(diffHours - 14) <= 0.2) {
          verdict = 'TIMEZONE_OFFSET_MISMATCH';
          diagnosticExplanation = `Bài nằm trong khung 24h nhưng có độ lệch múi giờ UTC+7 giữa chuỗi văn bản "${rawPubAt}" (${calculatedVietnamFormatted}) và trường số publishedTimestamp (${formatVietnamDateTime(rawPubTimestamp)}). Lệch ~${diffHours}h.`;
        } else {
          verdict = 'VALID_IN_WINDOW';
          diagnosticExplanation = `Bài viết hợp lệ trong khung 24h (${calculatedVietnamFormatted}). Có độ lệch ${deltaMinsWithTimestampField} phút so với trường số.`;
        }
      } else {
        verdict = 'VALID_IN_WINDOW';
        diagnosticExplanation = `Bài viết hợp lệ trong khung 24h: Giờ UTC: ${parsedUtcFormatted} -> Giờ VN (UTC+7): ${calculatedVietnamFormatted}.`;
      }
    }
  }

  return {
    articleId: article.id,
    title: article.title || 'Không có tiêu đề',
    source: article.source || (article as any).outlet || 'Không rõ nguồn',
    url: article.url,
    rawPublishedAt: rawPubAt,
    rawPublishedTimeStr: rawPubTimeStr,
    rawPublishedTimestamp: rawPubTimestamp,
    rawTimeAgo,
    parsedUtcMs,
    parsedUtcIso,
    parsedUtcFormatted,
    calculatedVietnamMs: parsedUtcMs,
    calculatedVietnamIso,
    calculatedVietnamFormatted,
    currentVietnamTimeIso: windowInfo.nowVnIso,
    currentVietnamTimeFormatted: windowInfo.nowVnFormatted,
    windowStartVietnamIso: windowInfo.startVnIso,
    windowStartVietnamFormatted: windowInfo.startVnFormatted,
    windowEndVietnamIso: windowInfo.endVnIso,
    windowEndVietnamFormatted: windowInfo.endVnFormatted,
    ageHoursFromCurrentVn,
    deltaMinsWithTimestampField,
    isWithin24hWindow,
    isIncorrectlyIncluded,
    verdict,
    diagnosticExplanation,
  };
}

/**
 * Audits a batch of articles against the 24h window (or custom window).
 * Filters and outputs comparative diagnostics for articles incorrectly included from prior days (like 7/9)
 * or with timezone offset errors.
 */
export function auditIncorrectArticlesIn24hWindow(
  articles: Partial<ScrapedNewsItem>[],
  options: {
    timeRange?: TimeRange;
    referenceNowMs?: number;
    customStartTimeMs?: number;
    customEndTimeMs?: number;
    logToConsole?: boolean;
  } = {}
): WindowAuditDiagnosisReport {
  const { timeRange = '24h', referenceNowMs = Date.now(), logToConsole = true } = options;
  const windowInfo = getVietnamCurrentTimeAndWindow(timeRange, options.customEndTimeMs || referenceNowMs);

  const allComparisons: UtcVsVietnamComparison[] = [];
  const incorrectArticles: UtcVsVietnamComparison[] = [];

  let validInWindowCount = 0;
  let stalePriorDayCount = 0;
  let timezoneOffsetMismatchCount = 0;
  let unparseableCount = 0;

  for (const article of articles) {
    if (!article) continue;
    const comparison = compareArticleUtcVsVietnamTimestamp(article, options);
    allComparisons.push(comparison);

    if (comparison.isWithin24hWindow && comparison.verdict === 'VALID_IN_WINDOW') {
      validInWindowCount++;
    } else {
      incorrectArticles.push(comparison);
      if (comparison.verdict === 'STALE_PRIOR_DAY') stalePriorDayCount++;
      else if (comparison.verdict === 'TIMEZONE_OFFSET_MISMATCH') timezoneOffsetMismatchCount++;
      else if (comparison.verdict === 'UNPARSEABLE') unparseableCount++;
    }
  }

  if (logToConsole && incorrectArticles.length > 0) {
    console.group(
      `🔍 [Timestamp Audit] Detected ${incorrectArticles.length} articles incorrectly included/anomalous outside ${timeRange} Vietnam window (${windowInfo.startVnFormatted} ➔ ${windowInfo.endVnFormatted})`
    );
    console.table(
      incorrectArticles.map((item) => ({
        Nguồn: item.source,
        TiêuĐề: item.title.slice(0, 40) + (item.title.length > 40 ? '...' : ''),
        ChuỗiGốc_publishedAt: item.rawPublishedAt || '(empty)',
        Giờ_UTC_Parsed: item.parsedUtcFormatted || 'N/A',
        Giờ_VN_UTC7_Calculated: item.calculatedVietnamFormatted || 'N/A',
        Tuổi_Hours: item.ageHoursFromCurrentVn,
        PhánQuyết: item.verdict,
        GiảiThích: item.diagnosticExplanation,
      }))
    );
    console.groupEnd();
  } else if (logToConsole) {
    console.log(
      `✅ [Timestamp Audit] All ${articles.length} articles are strictly valid within ${timeRange} Vietnam window (${windowInfo.startVnFormatted} ➔ ${windowInfo.endVnFormatted}).`
    );
  }

  return {
    totalAnalyzed: articles.length,
    validInWindowCount,
    incorrectlyIncludedCount: incorrectArticles.length,
    stalePriorDayCount,
    timezoneOffsetMismatchCount,
    unparseableCount,
    windowInfo: {
      timeRange,
      windowMinutes: windowInfo.windowMinutes,
      currentVietnamTime: windowInfo.nowVnFormatted,
      windowStartVietnam: windowInfo.startVnFormatted,
      windowEndVietnam: windowInfo.endVnFormatted,
      windowStartUtcMs: windowInfo.startTimeMs,
      windowEndUtcMs: windowInfo.endTimeMs,
    },
    incorrectArticles,
    allComparisons,
  };
}
