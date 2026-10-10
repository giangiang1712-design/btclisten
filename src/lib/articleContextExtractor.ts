export interface ExtractedArticleContext {
  milestones: string[];
  metrics: string[];
  rawSummary: string;
}

/**
 * Automatically extracts key milestones/timestamps and critical financial metrics
 * from news article title, summary, or snippet content.
 */
export function extractArticleMilestonesAndMetrics(article: {
  title?: string;
  summary?: string;
  content?: string;
  snippet?: string;
  publishedAt?: string;
  publishedTimeStr?: string;
  source?: string;
} | null | undefined): ExtractedArticleContext {
  if (!article) {
    return { milestones: [], metrics: [], rawSummary: '' };
  }

  const fullText = [
    article.title || '',
    article.summary || article.snippet || '',
    article.content || ''
  ].join(' ');

  if (!fullText.trim()) {
    return { milestones: [], metrics: [], rawSummary: '' };
  }

  // --- 1. Extract Timestamps & Milestones ---
  const milestoneSet = new Set<string>();

  // Dates: DD/MM/YYYY or DD/MM/YY
  const dateRegex = /\b\d{1,2}[\/\.-]\d{1,2}(?:[\/\.-]\d{2,4})?\b/g;
  const dateMatches = fullText.match(dateRegex);
  if (dateMatches) {
    dateMatches.forEach(d => milestoneSet.add(d));
  }

  // Quarters and years: Quý 1/2026, Quý I, năm 2026, tháng 9/2026
  const quarterYearRegex = /\b(?:quý|Quý)\s+[I|II|III|IV|1|2|3|4](?:\/(?:20\d{2}|\d{2}))?\b|\bnăm\s+20\d{2}\b|\btháng\s+\d{1,2}(?:\/20\d{2})?\b/gi;
  const quarterMatches = fullText.match(quarterYearRegex);
  if (quarterMatches) {
    quarterMatches.forEach(q => milestoneSet.add(q));
  }

  // Specific time markers or deadlines: e.g., "trước ngày 15/3", "hạn chót ngày 30/6", "14h00"
  const deadlineRegex = /\b(?:trước|từ|đến|hạn chót|kỳ hạn|thời hạn|mốc)\s+[\w\/\.\-]+(?:\s+năm\s+\d{4})?\b/gi;
  const deadlineMatches = fullText.match(deadlineRegex);
  if (deadlineMatches) {
    deadlineMatches.forEach(m => {
      const clean = m.trim();
      if (clean.length > 5 && clean.length < 35 && /\d/.test(clean)) {
        milestoneSet.add(clean);
      }
    });
  }

  if (article.publishedTimeStr) {
    milestoneSet.add(`Ngày phát hành: ${article.publishedTimeStr}`);
  }

  // --- 2. Extract Numbers & Financial Metrics ---
  const metricSet = new Set<string>();

  // Currency & Amounts: e.g. "50.000 tỷ đồng", "12,5%", "3,8% GDP", "82.500 VND/USD", "1.250 điểm", "500 triệu USD"
  const currencyAmountRegex = /\b\d+(?:[\.,]\d+)?\s*(?:tỷ đồng|tỷ USD|tỷ|triệu USD|triệu|ngàn tỷ|VND\/USD|VND|USD|EUR|cổ phiếu|điểm|điểm phần trăm|% GDP|%)\b/gi;
  const currencyMatches = fullText.match(currencyAmountRegex);
  if (currencyMatches) {
    currencyMatches.forEach(m => metricSet.add(m.trim()));
  }

  // Standalone percentages with sign: e.g., +2.5%, -1.8%
  const percentRegex = /\b[+-]?\d+(?:[\.,]\d+)?\s*%\b/g;
  const percentMatches = fullText.match(percentRegex);
  if (percentMatches) {
    percentMatches.forEach(p => metricSet.add(p.trim()));
  }

  // Numeric targets with context: e.g. "bội chi 3.8%", "tăng trưởng 6.5%"
  const targetRegex = /\b(?:bội chi|tăng trưởng|thâm hụt|doanh thu|lợi nhuận|trần|mục tiêu|lãi suất|tỷ giá|chỉ số|quy mô|tổng vốn|vốn điều lệ|hoàn thuế)\s+[^\.\,\;]{1,30}/gi;
  const targetMatches = fullText.match(targetRegex);
  if (targetMatches) {
    targetMatches.forEach(t => {
      const clean = t.trim();
      if (clean.length < 40 && /\d/.test(clean)) {
        metricSet.add(clean);
      }
    });
  }

  return {
    milestones: Array.from(milestoneSet).slice(0, 10),
    metrics: Array.from(metricSet).slice(0, 12),
    rawSummary: (article.summary || article.snippet || '').slice(0, 400)
  };
}
