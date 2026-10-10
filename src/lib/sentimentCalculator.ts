import { ScrapedNewsItem } from '../types';

export interface SentimentShiftBreakdown {
  baselineScore: number;
  finalScore: number;
  totalDeduction: number;
  totalBonus: number;
  level1and2: {
    count: number;
    deductionPoints: number;
  };
  level3: {
    count: number;
    deductionPoints: number;
  };
  level4: {
    count: number;
    deductionPoints: number;
  };
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  totalEvaluated: number;
  positivePercentage: number;
  neutralPercentage: number;
  negativePercentage: number;
  deductedArticles: Array<{
    id: string;
    title: string;
    sopLevel: number;
    sopLevelName: string;
    deduction: number;
    reason: string;
  }>;
}

/**
 * Calculates Sentiment Shift according to SOP Level rules:
 * - Baseline: 100 points
 * - SOP Level 1 & 2 (Cảnh báo sớm / Cần lưu tâm): -2 to -3 points per article
 * - SOP Level 3 (Cảnh báo nhanh): -8 to -12 points per article
 * - SOP Level 4 (Khẩn cấp): -25 to -40 points per article
 * - Directly deducted: finalScore = Math.max(0, 100 - totalDeduction)
 * - Ratios: Positive %, Neutral %, Negative % (including all SOP deducted articles)
 */
export function calculateSopSentimentShift(articles: ScrapedNewsItem[]): SentimentShiftBreakdown {
  const baselineScore = 100;
  let totalDeduction = 0;
  const totalBonus = 0; // Strict deduction without bonus buffer

  const level1and2 = { count: 0, deductionPoints: 0 };
  const level3 = { count: 0, deductionPoints: 0 };
  const level4 = { count: 0, deductionPoints: 0 };
  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;

  const deductedArticles: SentimentShiftBreakdown['deductedArticles'] = [];

  if (!articles || articles.length === 0) {
    return {
      baselineScore,
      finalScore: 100,
      totalDeduction: 0,
      totalBonus: 0,
      level1and2,
      level3,
      level4,
      positiveCount: 0,
      neutralCount: 0,
      negativeCount: 0,
      totalEvaluated: 0,
      positivePercentage: 0,
      neutralPercentage: 100,
      negativePercentage: 0,
      deductedArticles: [],
    };
  }

  articles.forEach((item) => {
    // Ignore market digests from SOP penalty calculation if they are purely routine
    if (item.isMarketDigest) {
      neutralCount += 1;
      return;
    }

    const alertLevel = item.warningPipeline?.level3Action?.alertLevel;
    const isEmergency = Boolean(item.isEmergency) || alertLevel === 'EMERGENCY' || (item.impactLevel === 'high' && item.sentiment === 'bearish' && (item.buzzScore || 0) >= 80);
    const isRapid = alertLevel === 'RAPID' || (item.impactLevel === 'high' && item.sentiment === 'bearish' && (item.buzzScore || 0) >= 60);
    const isEarlyOrAttention =
      alertLevel === 'EARLY' ||
      alertLevel === 'DISTANT' ||
      Boolean(item.informationVacuum?.hasGap && item.informationVacuum?.isAlertWarranted) ||
      ((item.riskScore || 0) >= 40 && (item.riskScore || 0) < 60) ||
      (item.sentiment === 'bearish' && !isEmergency && !isRapid);

    if (isEmergency) {
      // SOP Level 4: Khẩn cấp (-25 to -40 pts)
      const isCritical = (item.impactLevel === 'high' && (item.buzzScore || 0) >= 75) || Boolean(item.isEmergency);
      const points = isCritical ? 40 : 25;

      level4.count += 1;
      level4.deductionPoints += points;
      totalDeduction += points;
      negativeCount += 1;

      deductedArticles.push({
        id: item.id || `l4-${deductedArticles.length}`,
        title: item.title,
        sopLevel: 4,
        sopLevelName: 'Cấp 4: Khẩn cấp',
        deduction: points,
        reason: isCritical
          ? 'Trừ 40 điểm (Sự việc khẩn cấp mức độ đặc biệt nghiêm trọng)'
          : 'Trừ 25 điểm (Sự việc khẩn cấp cần chỉ đạo xử lý)',
      });
    } else if (isRapid) {
      // SOP Level 3: Cảnh báo nhanh (-8 to -12 pts)
      const isHighRapid = item.impactLevel === 'high' || (item.buzzScore || 0) >= 70;
      const points = isHighRapid ? 12 : 8;

      level3.count += 1;
      level3.deductionPoints += points;
      totalDeduction += points;
      negativeCount += 1;

      deductedArticles.push({
        id: item.id || `l3-${deductedArticles.length}`,
        title: item.title,
        sopLevel: 3,
        sopLevelName: 'Cấp 3: Cảnh báo nhanh',
        deduction: points,
        reason: isHighRapid
          ? 'Trừ 12 điểm (Cảnh báo nhanh có tác động cao)'
          : 'Trừ 8 điểm (Cảnh báo nhanh tiêu chuẩn)',
      });
    } else if (isEarlyOrAttention) {
      // SOP Level 1 & 2: Cảnh báo sớm & Cần lưu tâm (-2 to -3 pts)
      const isHigherEarly = (item.buzzScore || 0) >= 60 || item.impactLevel === 'high';
      const points = isHigherEarly ? 3 : 2;

      level1and2.count += 1;
      level1and2.deductionPoints += points;
      totalDeduction += points;
      negativeCount += 1;

      deductedArticles.push({
        id: item.id || `l12-${deductedArticles.length}`,
        title: item.title,
        sopLevel: 2,
        sopLevelName: 'Cấp 1 & 2: Cảnh báo sớm / Lưu tâm',
        deduction: points,
        reason: isHigherEarly
          ? 'Trừ 3 điểm (Tín hiệu cảnh báo sớm mức độ cao)'
          : 'Trừ 2 điểm (Tín hiệu cảnh báo sớm tiêu chuẩn)',
      });
    } else if (item.sentiment === 'bullish') {
      positiveCount += 1;
    } else if (item.sentiment === 'bearish') {
      // Negative sentiment article without specific SOP penalty
      negativeCount += 1;
    } else {
      neutralCount += 1;
    }
  });

  // Calculate direct deduction: 100 - totalDeduction, clamped to 0..100
  const finalScore = Math.max(0, Math.min(100, baselineScore - totalDeduction));

  const totalEvaluated = articles.length;
  let positivePercentage = 0;
  let negativePercentage = 0;
  let neutralPercentage = 0;

  if (totalEvaluated > 0) {
    positivePercentage = Math.round((positiveCount / totalEvaluated) * 100);
    negativePercentage = Math.round((negativeCount / totalEvaluated) * 100);
    neutralPercentage = Math.max(0, 100 - positivePercentage - negativePercentage);
  }

  return {
    baselineScore,
    finalScore,
    totalDeduction,
    totalBonus,
    level1and2,
    level3,
    level4,
    positiveCount,
    neutralCount,
    negativeCount,
    totalEvaluated,
    positivePercentage,
    neutralPercentage,
    negativePercentage,
    deductedArticles,
  };
}

/**
 * Danh mục từ khóa sai phạm chính sách tài chính nghiêm trọng cho SOP Cấp 4 (Khẩn cấp / Báo động đỏ)
 */
export const FINANCIAL_POLICY_VIOLATION_KEYWORDS: string[] = [
  // Khởi tố & Trách nhiệm hình sự tài chính
  'khởi tố',
  'bắt tạm giam',
  'bắt giữ',
  'điều tra sai phạm',
  'tham ô',
  'chiếm đoạt tài sản',
  'lừa đảo chiếm đoạt',
  'cố ý làm trái',
  'chuyển cơ quan điều tra',
  'kết luận thanh tra sai phạm',

  // Thị trường chứng khoán & Tài chính doanh nghiệp
  'thao túng thị trường chứng khoán',
  'thao túng giá cổ phiếu',
  'đình chỉ giao dịch',
  'hủy niêm yết bắt buộc',
  'gian lận phát hành',
  'sai phạm báo cáo tài chính nghiêm trọng',
  'che giấu thông tin tài chính',

  // Trái phiếu & Ngân hàng - Thanh khoản
  'vỡ nợ trái phiếu',
  'chậm trả gốc lãi nghiêm trọng',
  'khủng hoảng thanh khoản',
  'mất khả năng chi trả',
  'rút tiền hàng loạt',
  'kiểm soát đặc biệt',
  'đóng băng tài khoản',
  'phong tỏa tài sản',

  // Thuế & Hải quan - Ngân sách
  'trốn thuế quy mô lớn',
  'gian lận hoàn thuế',
  'hóa đơn giả nghìn tỷ',
  'buôn lậu có tổ chức',
  'thất thoát ngân sách',
  'thất thoát tài sản công nghiêm trọng',
  'thất thoát hàng nghìn tỷ',
  'sai phạm đấu thầu nghiêm trọng',
  'thông thầu',
];

/**
 * Kiểm tra xem một bài báo có chứa từ khóa sai phạm chính sách tài chính nghiêm trọng hay không
 */
export function hasCriticalFinancialViolationKeywords(item: ScrapedNewsItem): boolean {
  if (!item) return false;
  const fullText = [
    item.title || '',
    item.summary || '',
    item.riskReason || '',
    ...(item.regulatoryTags || []),
    ...(item.categoryLabels || []),
    item.executiveDirective?.mediaStrategy?.title || '',
    item.executiveDirective?.mediaStrategy?.tacticalRecommendation || '',
    item.warningPipeline?.executiveBrief || '',
  ]
    .join(' ')
    .toLowerCase();

  return FINANCIAL_POLICY_VIOLATION_KEYWORDS.some((kw) => fullText.includes(kw.toLowerCase()));
}

import { extractQuantitativeBreakdown } from '../components/QuantitativeFormulaBreakdown';
import { Decree376ClassificationEngine } from './decree376ClassificationEngine';

/**
 * Tự động đánh giá và gán nhãn SOP Cấp 4 cho bài báo dựa trên:
 * 1. Chuẩn hóa Nghị định số 376/2026/NĐ-CP (Cẩm nang 100 tình huống)
 * 2. Từ khóa vi phạm chính sách tài chính nghiêm trọng
 * 3. Kết hợp với điểm rủi ro cao (riskScore >= 75 hoặc impactLevel === 'high' hoặc isEmergency hoặc alertLevel === 'EMERGENCY')
 * Tuyệt đối loại bỏ các sự việc không nằm trong khung SOP khi hiển thị mục Sự việc khẩn.
 */
export function evaluateAndTagSopLevel4(item: ScrapedNewsItem): {
  isSopLevel4: boolean;
  tag: string;
  matchedKeywords: string[];
  reason: string;
} {
  if (!item || item.isMarketDigest) {
    return { isSopLevel4: false, tag: '', matchedKeywords: [], reason: '' };
  }

  // Đối soát chuẩn mực theo Nghị định 376/2026/NĐ-CP
  const d376 = Decree376ClassificationEngine.classify(item);
  if (d376.isExcluded || d376.tier === 0) {
    return { isSopLevel4: false, tag: '', matchedKeywords: [], reason: 'Thuộc diện Mức 0 loại trừ theo Nghị định 376' };
  }

  if (d376.tier === 3 || d376.sopLevel === 4) {
    return {
      isSopLevel4: true,
      tag: 'SOP Cấp 4: Khẩn cấp (Nghị định 376)',
      matchedKeywords: d376.matchedScenario?.matchingKeywords || ['Sự cố khẩn cấp NĐ 376'],
      reason: d376.matchedScenario
        ? `Tình huống chuẩn ${d376.matchedScenario.scenarioCode}: ${d376.matchedScenario.title}`
        : (d376.classificationReason || `Sự cố tài chính khẩn cấp theo Nghị định 376 (${d376.calibratedScores.riskScore}đ)`),
    };
  }

  const alertLevel = item.warningPipeline?.level3Action?.alertLevel;
  const riskScore = Number(
    item.warningPipeline?.level2Risk?.riskScore ??
    item.riskScore ??
    item.warningPipeline?.formulaMetrics?.rawRiskScore ??
    0
  );

  // Chỉ quét từ khóa vi phạm trên tiêu đề và tóm tắt chính của bài viết để tránh dính từ khóa từ chân trang/bài lân cận
  const primaryText = `${item.title || ''} ${item.summary || item.snippet || ''}`.toLowerCase();

  const matchedKeywords = FINANCIAL_POLICY_VIOLATION_KEYWORDS.filter((kw) =>
    primaryText.includes(kw.toLowerCase())
  );

  const hasKeywords = matchedKeywords.length > 0;
  const isHighRiskScore = riskScore >= 75;
  const isEmergencyFlag = Boolean(item.isEmergency) || alertLevel === 'EMERGENCY';
  const isHighImpactBearish = item.impactLevel === 'high' && item.sentiment === 'bearish' && (item.buzzScore || 0) >= 80;

  // Loại trừ tin tái cơ cấu EVN / Truyền tải điện không có án hình sự khởi tố bị can
  if (primaryText.includes('truyền tải điện') || primaryText.includes('tách khỏi evn') || primaryText.includes('tái cơ cấu evn')) {
    if (!primaryText.includes('khởi tố vụ án') && !primaryText.includes('khởi tố bị can') && !primaryText.includes('bắt tạm giam')) {
      return { isSopLevel4: false, tag: '', matchedKeywords: [], reason: '' };
    }
  }

  // Tiêu chí kết hợp chặt chẽ theo chỉ đạo Lãnh đạo:
  const isSopLevel4 = (hasKeywords && (isHighRiskScore || item.impactLevel === 'high' || isEmergencyFlag || isHighImpactBearish)) ||
                      (isEmergencyFlag && (isHighRiskScore || hasKeywords));

  if (isSopLevel4) {
    return {
      isSopLevel4: true,
      tag: 'SOP Cấp 4: Khẩn cấp',
      matchedKeywords,
      reason: hasKeywords
        ? `Vi phạm chính sách tài chính nghiêm trọng (${matchedKeywords.slice(0, 2).join(', ')}) kết hợp điểm rủi ro cao (${riskScore}đ)`
        : `Sự cố tài chính khẩn cấp đặc biệt nghiêm trọng (${riskScore}đ)`,
    };
  }

  return { isSopLevel4: false, tag: '', matchedKeywords: [], reason: '' };
}

/**
 * Kiểm tra xem một bài báo có thuộc diện Sự việc Khẩn cấp (SOP Cấp 4) hay không.
 * Bổ sung kiểm tra danh sách Active Alerts (Nút Cảnh báo 4) nếu được cung cấp.
 */
export function isSopLevel4Article(item: ScrapedNewsItem, activeAlertIds?: Set<string> | string[]): boolean {
  if (!item || item.isMarketDigest) return false;

  const evalResult = evaluateAndTagSopLevel4(item);
  if (!evalResult.isSopLevel4) return false;

  // Bắt buộc thuộc danh sách Cảnh Báo (Active Alerts) nếu có lọc
  if (activeAlertIds) {
    const alertSet = activeAlertIds instanceof Set ? activeAlertIds : new Set(activeAlertIds);
    if (alertSet.size > 0 && !alertSet.has(item.id)) {
      return false;
    }
  }

  return true;
}

/**
 * Kiểm tra xem một bài báo có thuộc Cấp 2: Cảnh báo sớm (Early Warning: 40–59 điểm) hay không.
 * Đồng bộ hóa nhất quán 100% với SopLifecycleStagePipeline và công thức Risk Score.
 */
export function isEarlyWarningArticle(item: ScrapedNewsItem): boolean {
  if (!item || item.isMarketDigest) return false;
  const d376 = Decree376ClassificationEngine.classify(item);
  if (d376.isExcluded || d376.tier === 0) return false;
  const breakdown = extractQuantitativeBreakdown(item);
  if (breakdown.level === 'EARLY') return true;
  return !d376.isExcluded && d376.tier === 2 && d376.calibratedScores.riskScore < 60 && breakdown.riskScore >= 40;
}

/**
 * Kiểm tra xem một bài báo có thuộc Cấp 1: Cảnh báo xa — Early Horizon (20–39 điểm) hay không.
 * Đồng bộ hóa nhất quán 100% với SopLifecycleStagePipeline và thẻ KPI Cảnh báo xa.
 */
export function isDistantWarningArticle(item: ScrapedNewsItem): boolean {
  if (!item || item.isMarketDigest) return false;
  const d376 = Decree376ClassificationEngine.classify(item);
  if (d376.isExcluded || d376.tier === 0) return false;
  const breakdown = extractQuantitativeBreakdown(item);
  if (breakdown.level === 'DISTANT') return true;
  return !d376.isExcluded && d376.tier === 1 && d376.calibratedScores.riskScore >= 20 && breakdown.riskScore >= 20;
}

