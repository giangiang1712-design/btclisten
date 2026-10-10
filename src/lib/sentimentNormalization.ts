import { ScrapedNewsItem } from '../types';

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
  alertLevel: number; // 0: Normal, 1: Level 1, 2: Level 2, 3: Level 3, 4: Level 4
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

  // Determine Alert Level & Mood
  let marketMood = 'Bình ổn & Tích cực (≥ 78)';
  let moodColor = '#10b981';
  let alertLevel = 0;

  if (sentimentScore >= 78) {
    marketMood = 'Bình ổn & Tích cực (≥ 78)';
    moodColor = '#10b981';
    alertLevel = 0;
  } else if (sentimentScore >= 70) {
    marketMood = 'Cảnh báo Mức 1 (70-77 - Cần theo dõi)';
    moodColor = '#3b82f6';
    alertLevel = 1;
  } else if (sentimentScore >= 58) {
    marketMood = 'Cảnh báo Mức 2 (58-69 - Thận trọng)';
    moodColor = '#f59e0b';
    alertLevel = 2;
  } else if (sentimentScore >= 46) {
    marketMood = 'Cảnh báo Mức 3 (46-57 - Áp lực cao)';
    moodColor = '#f97316';
    alertLevel = 3;
  } else {
    marketMood = '🚨 Cảnh báo Mức 4 (<46 - Khủng hoảng)';
    moodColor = '#ef4444';
    alertLevel = 4;
  }

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
