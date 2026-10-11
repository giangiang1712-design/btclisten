import { ScrapedNewsItem } from '../types';

export interface SentimentSlaInfo {
  tier: 'EMERGENCY_2H' | 'HIGH_ALERT_6H' | 'RAPID_12H' | 'SAME_DAY' | 'BALANCED' | 'POSITIVE';
  label: string;
  slaText: string;
  badgeText: string;
  color: string;
  badgeClass: string;
  description: string;
}

/**
 * Phân cấp chỉ số sắc thái dư luận theo đúng chỉ đạo Lãnh đạo:
 * - Trên 90 (> 90): Mức tích cực
 * - Từ 85 - 90: Mức cân bằng
 * - Từ 75 - 85: Xử lý trong ngày
 * - Dưới 75 (60 - <75): Xử lý trong 12h
 * - Dưới 60 (50 - <60): Xử lý trong 6h
 * - Dưới 50 (< 50): Xử lý trong 2h (Khẩn cấp tối cao)
 */
export function getSentimentSlaInfo(score: number): SentimentSlaInfo {
  if (score > 90) {
    return {
      tier: 'POSITIVE',
      label: 'Mức tích cực',
      slaText: 'Theo dõi thường quy',
      badgeText: 'Mức tích cực (>90đ)',
      color: '#10b981',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      description: 'Dư luận lan tỏa tích cực, đồng thuận cao với các chính sách tài khóa của Bộ Tài chính.'
    };
  }
  if (score >= 85) {
    return {
      tier: 'BALANCED',
      label: 'Mức cân bằng',
      slaText: 'Theo dõi thường quy',
      badgeText: 'Mức cân bằng (85-90đ)',
      color: '#3b82f6',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      description: 'Dư luận ở trạng thái cân bằng, ổn định, tâm lý thị trường trung tính tích cực.'
    };
  }
  if (score >= 75) {
    return {
      tier: 'SAME_DAY',
      label: 'Xử lý trong ngày',
      slaText: 'Xử lý trong ngày',
      badgeText: 'Xử lý trong ngày (75-85đ)',
      color: '#f59e0b',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      description: 'Cần lưu tâm theo dõi, rà soát và có giải pháp truyền thông/chỉ đạo ngay trong ngày.'
    };
  }
  if (score >= 60) {
    return {
      tier: 'RAPID_12H',
      label: 'Xử lý trong 12h',
      slaText: 'Xử lý trong 12h',
      badgeText: '⚡ Xử lý trong 12h (60-75đ)',
      color: '#f97316',
      badgeClass: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
      description: 'Điểm dưới 75: Liệt ngay vào diện xử lý trong 12h, giao đơn vị chuyên môn phản hồi giải đáp.'
    };
  }
  if (score >= 50) {
    return {
      tier: 'HIGH_ALERT_6H',
      label: 'Xử lý trong 6h',
      slaText: 'Xử lý trong 6h',
      badgeText: '🚨 Xử lý trong 6h (50-60đ)',
      color: '#ea580c',
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      description: 'Điểm dưới 60: Liệt ngay vào diện xử lý trong 6h, áp lực dư luận tăng cao, cần chỉ đạo khẩn.'
    };
  }
  // Under 50 (< 50)
  return {
    tier: 'EMERGENCY_2H',
    label: 'Xử lý trong 2h',
    slaText: 'Hỏa tốc trong 2h',
    badgeText: '🔥 Xử lý trong 2h (<50đ)',
    color: '#dc2626',
    badgeClass: 'bg-rose-700 text-white border-rose-800 shadow-md font-black',
    description: 'Điểm dưới 50: Liệt ngay vào diện xử lý trong 2h, sự cố đặc biệt khẩn cấp cần báo cáo Lãnh đạo Bộ ngay.'
  };
}

export interface NormalizedSentimentResult {
  total: number;
  bullish: number;
  neutral: number;
  bearish: number;
  bullishPct: number;
  neutralPct: number;
  bearishPct: number;
  sum: number; // Always 100 when total > 0, or 0 when total === 0
  sentimentScore: number; // 0 - 100
  marketMood: string;
  moodColor: string;
  alertLevel: number; // 0: Positive, 1: Balanced, 2: Same-day, 3: 12h, 4: 6h, 5: 2h
  slaText?: string;
  slaTier?: string;
  ratio: string;
  formulaDisplay: string;
}

/**
 * Calculates mathematically normalized sentiment percentages guaranteeing:
 * positivePct + neutralPct + negativePct === 100%
 * using the Hare-Niemeyer / Largest Remainder algorithm.
 */
export function calculateNormalizedSentiment(
  items: ScrapedNewsItem[] | { bullish: number; neutral: number; bearish: number }
): NormalizedSentimentResult {
  let bullish = 0;
  let neutral = 0;
  let bearish = 0;
  let total = 0;
  let itemsArray: ScrapedNewsItem[] = [];

  if (Array.isArray(items)) {
    itemsArray = items;
    total = items.length;
    bullish = items.filter((i) => i.sentiment === 'bullish').length;
    bearish = items.filter((i) => i.sentiment === 'bearish').length;
    neutral = items.filter((i) => i.sentiment === 'neutral' || !i.sentiment).length;
  } else {
    bullish = items.bullish || 0;
    neutral = items.neutral || 0;
    bearish = items.bearish || 0;
    total = bullish + neutral + bearish;
  }

  if (total === 0) {
    return {
      total: 0,
      bullish: 0,
      neutral: 0,
      bearish: 0,
      bullishPct: 0,
      neutralPct: 0,
      bearishPct: 0,
      sum: 0,
      sentimentScore: 50,
      marketMood: 'Chưa có dữ liệu',
      moodColor: '#94a3b8',
      alertLevel: 0,
      ratio: '1.0',
      formulaDisplay: 'Tích cực: 0% + Trung tính: 0% + Tiêu cực: 0% = 0%',
    };
  }

  // Exact raw percentages
  const rawBullish = (bullish / total) * 100;
  const rawNeutral = (neutral / total) * 100;
  const rawBearish = (bearish / total) * 100;

  // Floor
  let bPct = Math.floor(rawBullish);
  let nPct = Math.floor(rawNeutral);
  let rPct = Math.floor(rawBearish);

  // Largest remainder distribution
  let remainder = 100 - (bPct + nPct + rPct);
  const diffs = [
    { type: 'bullish', diff: rawBullish - bPct },
    { type: 'neutral', diff: rawNeutral - nPct },
    { type: 'bearish', diff: rawBearish - rPct },
  ].sort((a, b) => b.diff - a.diff);

  for (let i = 0; i < remainder; i++) {
    const target = diffs[i % diffs.length].type;
    if (target === 'bullish') bPct++;
    else if (target === 'neutral') nPct++;
    else if (target === 'bearish') rPct++;
  }

  // Calculate Weighted Sentiment Score (0 to 100)
  let sentimentScore = 80;
  if (itemsArray.length > 0) {
    let totalWeighted = 0;
    let totalWeight = 0;
    itemsArray.forEach((art) => {
      let p = 82;
      if (art.sentiment === 'bullish') {
        p = Math.min(100, Math.max(88, 90 + (art.sentimentScore ? Math.min(10, Math.max(0, art.sentimentScore) / 10) : 4)));
      } else if (art.sentiment === 'bearish') {
        p = Math.max(10, Math.min(50, 38 - (art.sentimentScore ? Math.min(28, Math.abs(art.sentimentScore) / 3) : 10)));
        if (art.isEmergency) p = Math.max(5, p - 10);
      } else {
        const bonus = art.sentimentScore ? Math.min(4, Math.max(-2, Math.round(art.sentimentScore / 25))) : 1;
        p = Math.min(86, Math.max(80, 82 + bonus));
      }
      const w = (art.authorityWeight || 1.0) * (art.isEmergency ? 2.5 : 1.0);
      totalWeighted += p * w;
      totalWeight += w;
    });
    sentimentScore = totalWeight > 0 ? Math.min(100, Math.max(0, Math.round(totalWeighted / totalWeight))) : 80;
  } else {
    // Formula based score when only counts available
    sentimentScore = Math.min(100, Math.max(0, Math.round(bPct * 0.95 + nPct * 0.82 + rPct * 0.25)));
  }

  // Determine Alert Level & Mood according to Leadership direct thresholds:
  const slaInfo = getSentimentSlaInfo(sentimentScore);
  const marketMood = slaInfo.badgeText;
  const moodColor = slaInfo.color;
  const alertLevel =
    slaInfo.tier === 'EMERGENCY_2H' ? 5 :
    slaInfo.tier === 'HIGH_ALERT_6H' ? 4 :
    slaInfo.tier === 'RAPID_12H' ? 3 :
    slaInfo.tier === 'SAME_DAY' ? 2 :
    slaInfo.tier === 'BALANCED' ? 1 : 0;

  const ratio = bearish > 0 ? (bullish / bearish).toFixed(2) : bullish > 0 ? '5.0' : '1.0';
  const formulaDisplay = `Tích cực (${bPct}%) + Trung tính (${nPct}%) + Tiêu cực (${rPct}%) = 100%`;

  return {
    total,
    bullish,
    neutral,
    bearish,
    bullishPct: bPct,
    neutralPct: nPct,
    bearishPct: rPct,
    sum: bPct + nPct + rPct,
    sentimentScore,
    marketMood,
    moodColor,
    alertLevel,
    ratio,
    formulaDisplay,
  };
}
