import { ScrapedNewsItem, WarningAlertLevelType } from '../types';
import { parseStrictArticleTimestamp } from '../services/api';

export type AuditFlagType = 'LEVEL_DISCREPANCY' | 'FILL_DATA' | 'BOTH';

export interface WarningAuditEntry {
  id: string;
  articleId: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  publishedTimestamp?: number;
  sentiment: string;
  sentimentScore: number;
  riskScore: number;
  formulaMetrics?: {
    S: number;
    D: number;
    V: number;
    I: number;
  };
  assignedAlertLevel: WarningAlertLevelType;
  expectedAlertLevel: WarningAlertLevelType;
  flagType: AuditFlagType;
  flagReason: string;
  isFillData: boolean;
  fillDataReason?: string;
  auditStatus: 'PENDING' | 'APPROVED' | 'OVERRIDDEN' | 'DISMISSED';
  overriddenLevel?: WarningAlertLevelType;
  overriddenRiskScore?: number;
  humanNote?: string;
  auditedAt: string;
  humanActionAt?: string;
  originalArticle: ScrapedNewsItem;
}

export interface RiskThresholdBucket {
  id: string;
  name: string;
  shortName: string;
  rangeLabel: string;
  min: number;
  max: number;
  color: string;
  totalCount: number;
  realCount: number;
  fillCount: number;
  realPct: number;
  fillPct: number;
  actionSop: string;
}

export interface RiskThresholdHistoricalStats {
  totalAnalyzed: number;
  realTotal: number;
  fillTotal: number;
  flaggedCount: number;
  levelDiscrepancyCount: number;
  fillDataCount: number;
  buckets: {
    safe: RiskThresholdBucket;
    distant: RiskThresholdBucket;
    early: RiskThresholdBucket;
    rapid: RiskThresholdBucket;
    emergency: RiskThresholdBucket;
  };
  calibrationInsight: {
    summary: string;
    falsePositiveRatio: number; // %
    recommendation: string;
    optimalEarlyWarningThreshold: number; // e.g. 40
  };
}

const STORAGE_KEY_HUMAN_ACTIONS = 'finpulse_warning_audit_actions_v1';

/**
 * Checks if an article has indicators of being artificial, synthetic, auto-filled or placeholder data.
 */
export function isArticleFillOrSynthetic(item: ScrapedNewsItem): { isFill: boolean; reason?: string } {
  if (!item) return { isFill: false };

  // 1. Explicit simulation flag
  if ((item as any).isSimulated || (item as any).isSynthetic) {
    return { isFill: true, reason: 'Gắn cờ giả lập/thử nghiệm (isSimulated/isSynthetic = true)' };
  }

  const id = (item.id || '').toLowerCase();
  const title = (item.title || '').trim().toLowerCase();
  const source = (item.source || '').trim().toLowerCase();
  const url = (item.url || '').trim().toLowerCase();

  // 2. Mock IDs
  if (id.startsWith('mock-') || id.startsWith('sim-') || id.startsWith('fill-') || id.startsWith('test-') || id.includes('placeholder')) {
    return { isFill: true, reason: `Định danh mang tiền tố dữ liệu mẫu (${item.id})` };
  }

  // 3. Source indicators
  if (source === 'mock data' || source === 'demo source' || source === 'hệ thống giả lập' || source === 'ai synthetic') {
    return { isFill: true, reason: `Nguồn phát hành là nguồn mẫu giả lập (${item.source})` };
  }

  // 4. URL indicators
  if (!url || url.includes('example.com') || url.includes('placeholder') || url === '#' || url.startsWith('javascript:')) {
    return { isFill: true, reason: 'Đường dẫn bài viết dạng placeholder/không có liên kết nguồn thực tế' };
  }

  // 5. Dropped status
  if (item.scrapeIntegrityStatus && item.scrapeIntegrityStatus.includes('Dropped')) {
    return { isFill: true, reason: `Bài viết đã bị gắn cờ loại bỏ (${item.scrapeIntegrityStatus})` };
  }

  // 6. Generic repetitive placeholder title
  if (title === 'tin tức tài chính' || title === 'tiêu đề bài viết' || title === 'bài viết mẫu' || title.length < 5) {
    return { isFill: true, reason: 'Tiêu đề bài viết mang tính lấp đầy placeholder' };
  }

  return { isFill: false };
}

/**
 * Derives the strict standard alert level from a numerical riskScore [0, 100].
 */
export function getStrictAlertLevelFromScore(score: number): WarningAlertLevelType {
  if (score >= 75) return 'EMERGENCY'; // Cấp 4: Cảnh Báo Khẩn Cấp (75–100đ)
  if (score >= 60) return 'RAPID';     // Cấp 3: Cảnh Báo Nhanh (60–74đ)
  if (score >= 40) return 'EARLY';     // Cấp 2: Cảnh Báo Sớm (40–59đ)
  if (score >= 20) return 'DISTANT';   // Cấp 1: Cảnh Báo Xa (20–39đ)
  return 'STANDARD';                   // Giám sát thường quy (<20đ)
}

/**
 * Load human actions from localStorage.
 */
export function loadStoredHumanAuditActions(): Record<string, {
  status: 'PENDING' | 'APPROVED' | 'OVERRIDDEN' | 'DISMISSED';
  overriddenLevel?: WarningAlertLevelType;
  overriddenRiskScore?: number;
  note?: string;
  actionAt: string;
}> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HUMAN_ACTIONS);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Save human action to localStorage.
 */
export function saveHumanAuditAction(
  articleId: string,
  action: {
    status: 'APPROVED' | 'OVERRIDDEN' | 'DISMISSED';
    overriddenLevel?: WarningAlertLevelType;
    overriddenRiskScore?: number;
    note?: string;
  }
) {
  if (typeof window === 'undefined') return;
  try {
    const current = loadStoredHumanAuditActions();
    current[articleId] = {
      ...action,
      actionAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_HUMAN_ACTIONS, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('finpulse-audit-actions-updated', { detail: { articleId, action } }));
  } catch (err) {
    console.error('[Warning Audit Service] Failed to save human action:', err);
  }
}

/**
 * Clears all human actions for a specific article.
 */
export function resetHumanAuditAction(articleId: string) {
  if (typeof window === 'undefined') return;
  try {
    const current = loadStoredHumanAuditActions();
    delete current[articleId];
    localStorage.setItem(STORAGE_KEY_HUMAN_ACTIONS, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('finpulse-audit-actions-updated', { detail: { articleId } }));
  } catch (err) {
    console.error('[Warning Audit Service] Failed to reset human action:', err);
  }
}

/**
 * Scans articles from the last 7 days and detects:
 * 1. "Sai lệch mức độ" (Level Discrepancy)
 * 2. "Dữ liệu lấp đầy" (Synthetic / Auto-fill placeholder)
 */
export function auditArticlesForWarningDiscrepancies(
  newsList: ScrapedNewsItem[],
  daysLookback: number = 7
): {
  entries: WarningAuditEntry[];
  totalScanned: number;
  levelDiscrepancyCount: number;
  fillDataCount: number;
} {
  if (!Array.isArray(newsList) || newsList.length === 0) {
    return {
      entries: [],
      totalScanned: 0,
      levelDiscrepancyCount: 0,
      fillDataCount: 0
    };
  }

  const nowMs = Date.now();
  const maxAgeMs = daysLookback * 24 * 3600 * 1000;
  const humanActions = loadStoredHumanAuditActions();

  const entries: WarningAuditEntry[] = [];
  let levelDiscrepancyCount = 0;
  let fillDataCount = 0;

  newsList.forEach((item, index) => {
    if (!item) return;

    // Filter for articles within the last 7 days
    const pubMs = parseStrictArticleTimestamp(item, nowMs) || item.publishedTimestamp;
    if (pubMs && nowMs - pubMs > maxAgeMs) {
      // Older than 7 days, skip
      return;
    }

    const assignedLevel: WarningAlertLevelType =
      item.warningPipeline?.level3Action?.alertLevel ||
      (item as any).alertLevel ||
      'STANDARD';

    const riskScore = Number(
      item.warningPipeline?.level2Risk?.riskScore ??
      item.riskScore ??
      0
    );

    const expectedLevel = getStrictAlertLevelFromScore(riskScore);
    const fillCheck = isArticleFillOrSynthetic(item);

    let isLevelDiscrepancy = false;
    const discrepancyReasons: string[] = [];

    // Check 1: Score < 40 but assigned to EARLY (Cần lưu tâm)
    if (assignedLevel === 'EARLY' && riskScore < 40) {
      isLevelDiscrepancy = true;
      discrepancyReasons.push(`Điểm Risk (${riskScore}đ < 40đ) nhưng bị xếp vào "Cần lưu tâm (EARLY)" — Sai lệch ngưỡng phòng ngừa Cấp 2.`);
    }

    // Check 2: Score < 20 but assigned to any active warning level (DISTANT, EARLY, RAPID, EMERGENCY)
    if (assignedLevel !== 'STANDARD' && assignedLevel !== 'MARKET_DIGEST' && riskScore < 20) {
      isLevelDiscrepancy = true;
      discrepancyReasons.push(`Điểm Risk (${riskScore}đ < 20đ) nhưng phát cảnh báo (${assignedLevel}) — Báo động giả mức thường quy.`);
    }

    // Check 3: Score >= 75 but not EMERGENCY
    if (riskScore >= 75 && assignedLevel !== 'EMERGENCY' && assignedLevel !== 'MARKET_DIGEST') {
      isLevelDiscrepancy = true;
      discrepancyReasons.push(`Điểm Risk (${riskScore}đ ≥ 75đ) nhưng chỉ gán mức ${assignedLevel} — Bỏ lọt cảnh báo khẩn cấp Cấp 4.`);
    }

    // Check 4: Score in [60, 75) but not RAPID
    if (riskScore >= 60 && riskScore < 75 && assignedLevel !== 'RAPID' && assignedLevel !== 'MARKET_DIGEST') {
      isLevelDiscrepancy = true;
      discrepancyReasons.push(`Điểm Risk (${riskScore}đ thuộc [60–74đ]) nhưng gán mức ${assignedLevel} — Sai lệch Cảnh báo nhanh Cấp 3.`);
    }

    // Check 5: Score in [20, 40) but assigned above DISTANT
    if (riskScore >= 20 && riskScore < 40 && (assignedLevel === 'RAPID' || assignedLevel === 'EMERGENCY')) {
      isLevelDiscrepancy = true;
      discrepancyReasons.push(`Điểm Risk (${riskScore}đ thuộc [20–39đ]) nhưng bị nhảy cóc lên mức ${assignedLevel}.`);
    }

    // Check 6: Sentiment Polar Discrepancy
    const sentiment = item.sentiment;
    const sentimentScore = item.sentimentScore || 0;
    const hasDivergence = Boolean(item.warningPipeline?.narrativeDivergence?.detected);

    if ((sentiment === 'bullish' || sentimentScore >= 60) && riskScore >= 60 && !hasDivergence) {
      isLevelDiscrepancy = true;
      discrepancyReasons.push(`Sắc thái Tích cực (${sentimentScore}đ) nhưng Điểm Risk cao (${riskScore}đ) không có giải trình độ vênh.`);
    }

    if ((sentiment === 'bearish' || sentimentScore <= -40) && riskScore < 20 && !item.isMarketDigest) {
      isLevelDiscrepancy = true;
      discrepancyReasons.push(`Sắc thái Tiêu cực (${sentimentScore}đ) nhưng Điểm Risk lại < 20đ (${riskScore}đ) — Nghi ngờ bỏ lọt rủi ro.`);
    }

    const hasFlag = isLevelDiscrepancy || fillCheck.isFill;

    if (hasFlag) {
      let flagType: AuditFlagType = 'LEVEL_DISCREPANCY';
      if (isLevelDiscrepancy && fillCheck.isFill) {
        flagType = 'BOTH';
        levelDiscrepancyCount++;
        fillDataCount++;
      } else if (isLevelDiscrepancy) {
        flagType = 'LEVEL_DISCREPANCY';
        levelDiscrepancyCount++;
      } else {
        flagType = 'FILL_DATA';
        fillDataCount++;
      }

      const flagReason = [
        ...discrepancyReasons,
        fillCheck.isFill ? fillCheck.reason : ''
      ].filter(Boolean).join(' • ');

      const savedAction = humanActions[item.id];

      entries.push({
        id: `audit-${item.id || index}-${Date.now()}`,
        articleId: item.id || `art-${index}`,
        title: item.title || 'Không có tiêu đề',
        source: item.source || item.sourceName || 'Chưa rõ nguồn',
        url: item.url || '',
        publishedAt: item.publishedAt || item.publishedTimeStr || item.timeAgo || 'Vừa xong',
        publishedTimestamp: pubMs,
        sentiment: item.sentiment || 'neutral',
        sentimentScore: item.sentimentScore || 0,
        riskScore,
        formulaMetrics: item.warningPipeline?.formulaMetrics
          ? {
              S: item.warningPipeline.formulaMetrics.S,
              D: item.warningPipeline.formulaMetrics.D,
              V: item.warningPipeline.formulaMetrics.V,
              I: item.warningPipeline.formulaMetrics.I,
            }
          : undefined,
        assignedAlertLevel: savedAction?.overriddenLevel || assignedLevel,
        expectedAlertLevel: expectedLevel,
        flagType,
        flagReason,
        isFillData: fillCheck.isFill,
        fillDataReason: fillCheck.reason,
        auditStatus: savedAction?.status || 'PENDING',
        overriddenLevel: savedAction?.overriddenLevel,
        overriddenRiskScore: savedAction?.overriddenRiskScore,
        humanNote: savedAction?.note,
        auditedAt: new Date().toISOString(),
        humanActionAt: savedAction?.actionAt,
        originalArticle: item
      });
    }
  });

  return {
    entries,
    totalScanned: newsList.length,
    levelDiscrepancyCount,
    fillDataCount
  };
}

/**
 * Computes historical distribution of articles across the 4 warning thresholds:
 * 20 (Cấp 1), 40 (Cấp 2), 60 (Cấp 3), 75 (Cấp 4), plus Safe (<20).
 * Compares real scraped articles vs synthetic/fill articles to help tune hard thresholds.
 */
export function computeRiskThresholdHistoricalStats(newsList: ScrapedNewsItem[]): RiskThresholdHistoricalStats {
  const buckets: RiskThresholdHistoricalStats['buckets'] = {
    safe: {
      id: 'safe',
      name: 'Giám Sát Thường Quy (Safe / Routine)',
      shortName: 'Tiêu chuẩn (<20đ)',
      rangeLabel: '0 – 19 điểm',
      min: 0,
      max: 19.99,
      color: '#64748b', // slate
      totalCount: 0,
      realCount: 0,
      fillCount: 0,
      realPct: 0,
      fillPct: 0,
      actionSop: 'Lưu trữ theo dõi thường quy; không kích hoạt chuông báo hay điều động lực lượng.'
    },
    distant: {
      id: 'distant',
      name: 'Cấp 1: Cảnh Báo Xa (Early Horizon)',
      shortName: 'Cấp 1: Xa (20–39đ)',
      rangeLabel: '20 – 39 điểm',
      min: 20,
      max: 39.99,
      color: '#6366f1', // indigo
      totalCount: 0,
      realCount: 0,
      fillCount: 0,
      realPct: 0,
      fillPct: 0,
      actionSop: 'Đưa vào danh mục theo dõi tự động (3–7 ngày), soạn thảo bộ Hỏi - Đáp nội bộ (Internal Q&A); không phát ngôn sớm.'
    },
    early: {
      id: 'early',
      name: 'Cấp 2: Cảnh Báo Sớm / Cần Lưu Tâm (Early Warning)',
      shortName: 'Cấp 2: Sớm (40–59đ)',
      rangeLabel: '40 – 59 điểm',
      min: 40,
      max: 59.99,
      color: '#f59e0b', // amber
      totalCount: 0,
      realCount: 0,
      fillCount: 0,
      realPct: 0,
      fillPct: 0,
      actionSop: 'Phòng ngừa trọng tâm: Làm việc ngay với Cục/Vụ chuyên môn, hoàn thiện ngân hàng Q&A giải thích rõ vướng mắc, giám sát 24h.'
    },
    rapid: {
      id: 'rapid',
      name: 'Cấp 3: Cảnh Báo Nhanh / Nguy Cơ Cao (Rapid Alert)',
      shortName: 'Cấp 3: Nhanh (60–74đ)',
      rangeLabel: '60 – 74 điểm',
      min: 60,
      max: 74.99,
      color: '#ea580c', // orange
      totalCount: 0,
      realCount: 0,
      fillCount: 0,
      realPct: 0,
      fillPct: 0,
      actionSop: 'Báo cáo khẩn Lãnh đạo Bộ; phân công đầu mối phát ngôn trong ngày; phối hợp cơ quan báo chí chủ lực giải trình số liệu.'
    },
    emergency: {
      id: 'emergency',
      name: 'Cấp 4: Cảnh Báo Khẩn Cấp / Nguy Cấp (Emergency Alert)',
      shortName: 'Cấp 4: Khẩn cấp (75–100đ)',
      rangeLabel: '75 – 100 điểm',
      min: 75,
      max: 100,
      color: '#e11d48', // rose
      totalCount: 0,
      realCount: 0,
      fillCount: 0,
      realPct: 0,
      fillPct: 0,
      actionSop: 'Kích hoạt ngay Tổ phản ứng nhanh khủng hoảng truyền thông; họp báo hoặc phát thông cáo báo chí chính thức trong 2–4 giờ.'
    }
  };

  let realTotal = 0;
  let fillTotal = 0;

  if (Array.isArray(newsList) && newsList.length > 0) {
    newsList.forEach((item) => {
      if (!item) return;
      const isFill = isArticleFillOrSynthetic(item).isFill;
      const score = Number(
        item.warningPipeline?.level2Risk?.riskScore ??
        item.riskScore ??
        0
      );

      if (isFill) fillTotal++;
      else realTotal++;

      if (score >= 75) {
        buckets.emergency.totalCount++;
        if (isFill) buckets.emergency.fillCount++;
        else buckets.emergency.realCount++;
      } else if (score >= 60) {
        buckets.rapid.totalCount++;
        if (isFill) buckets.rapid.fillCount++;
        else buckets.rapid.realCount++;
      } else if (score >= 40) {
        buckets.early.totalCount++;
        if (isFill) buckets.early.fillCount++;
        else buckets.early.realCount++;
      } else if (score >= 20) {
        buckets.distant.totalCount++;
        if (isFill) buckets.distant.fillCount++;
        else buckets.distant.realCount++;
      } else {
        buckets.safe.totalCount++;
        if (isFill) buckets.safe.fillCount++;
        else buckets.safe.realCount++;
      }
    });
  }

  // Calculate percentages
  Object.values(buckets).forEach((b) => {
    b.realPct = realTotal > 0 ? Number(((b.realCount / realTotal) * 100).toFixed(1)) : 0;
    b.fillPct = fillTotal > 0 ? Number(((b.fillCount / fillTotal) * 100).toFixed(1)) : 0;
  });

  const totalAnalyzed = realTotal + fillTotal;
  const falsePositiveRatio = totalAnalyzed > 0 ? Number(((fillTotal / totalAnalyzed) * 100).toFixed(1)) : 0;

  // Generate analytical calibration recommendation
  let recommendation = '';
  if (buckets.early.fillPct > 25) {
    recommendation = `Phát hiện ${buckets.early.fillCount} bài viết giả/lấp đầy rơi vào ngưỡng Cấp 2 (40–59đ). Khuyến nghị giữ vững ngưỡng cứng 40đ để chặn đứng các tin lấp đầy không làm nhiễu danh sách "Cần lưu tâm".`;
  } else if (buckets.distant.realPct > 40) {
    recommendation = `Đa số bài viết thực tế (${buckets.distant.realPct}%) tập trung ở ngưỡng Cấp 1 (20–39đ), phản ánh đúng các tín hiệu yếu ban đầu cần theo dõi mà chưa cần phát động ứng phó.`;
  } else {
    recommendation = `Các mốc ngưỡng cứng (20đ - Cảnh báo xa, 40đ - Cảnh báo sớm, 60đ - Cảnh báo nhanh, 75đ - Khẩn cấp) đang phân tầng tối ưu giữa tin thật và dữ liệu lấp đầy.`;
  }

  return {
    totalAnalyzed,
    realTotal,
    fillTotal,
    flaggedCount: fillTotal,
    levelDiscrepancyCount: 0,
    fillDataCount: fillTotal,
    buckets,
    calibrationInsight: {
      summary: `Phân tích ${totalAnalyzed} bài viết: ${realTotal} tin bài thực tế (${totalAnalyzed > 0 ? ((realTotal / totalAnalyzed) * 100).toFixed(1) : 0}%) vs ${fillTotal} tin giả/lấp đầy (${falsePositiveRatio}%).`,
      falsePositiveRatio,
      recommendation,
      optimalEarlyWarningThreshold: 40
    }
  };
}
