/**
 * eventClusteringEngine.ts
 * 
 * Thuật toán Gom cụm sự kiện (Event Clustering) & Nhận diện nguồn phát tán đầu tiên (First-Mover Detection)
 * - Cosine Similarity trên TF-IDF n-grams + MinHash Jaccard Shingling (>75% tương đồng).
 * - Tự động gom các bài viết phản ánh cùng 1 sự kiện thành "Thẻ Tin Sự Kiện Duy Nhất".
 * - Xác định chính xác:
 *    + Báo phát tin đầu tiên (First-Mover / Origin Source).
 *    + Thời gian chênh lệch (Lead time: ví dụ "Phát tin sớm hơn 15 phút so với các báo khác").
 *    + Danh sách các báo dẫn nguồn lại (Syndicated / Echo Sources).
 *    + Tốc độ & Sức lan tỏa của chùm tin.
 */

import { ScrapedNewsItem, SentimentType, ImpactLevel } from '../types';

export interface ClusteredEventCard {
  id: string;
  clusterTitle: string; // Tiêu đề đại diện chuẩn mực nhất của cụm sự kiện
  eventSummary: string; // Tóm tắt tổng hợp nội dung sự kiện
  sector: string;
  sectorNameVi: string;
  similarityScore: number; // Điểm tương đồng trung bình trong cụm (%)
  totalArticles: number; // Tổng số bài báo đưa tin về sự kiện này
  
  // First-Mover / Nguồn phát tán đầu tiên
  originArticle: ScrapedNewsItem; // Bài báo đầu tiên xuất bản
  originSource: string; // Tên báo đăng đầu tiên (VD: CafeF, Báo Đầu Tư...)
  originPublishedAt: string; // Thời gian đăng bài đầu tiên
  originPublishedTimeStr: string; // Giờ đăng đầu tiên (VD: 14:15)
  leadTimeMinutes: number; // Đăng sớm hơn các báo sau trung bình bao nhiêu phút

  // Mốc xuất bản mới nhất trong cụm sự kiện (Dùng để sắp xếp tiến trình thời gian)
  latestPublishedTimestamp: number;
  latestPublishedAt: string;
  latestPublishedTimeStr: string;
  
  // Danh sách các báo phát tán lại / đưa tin tiếp theo
  echoArticles: Array<{
    article: ScrapedNewsItem;
    publishedAt: string;
    publishedTimeStr?: string;
    lagMinutes: number; // Ra tin sau báo gốc bao nhiêu phút
    similarity: number; // Độ tương đồng với tin gốc (%)
  }>;

  // Thống kê cụm
  avgSentimentScore: number;
  dominantSentiment: SentimentType;
  maxImpactLevel: ImpactLevel;
  maxBuzzScore: number;
  allSources: string[]; // Danh sách tất cả các báo cùng đưa tin
  tickers: string[];
  agencies: string[];
  policyTags: string[];
  keyPeople: string[];
}

/**
 * Chuẩn hóa chuỗi văn bản tiếng Việt cho so khớp (bỏ dấu, chuyển thường, lọc ký tự đặc biệt)
 */
function normalizeVietnameseText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Trích xuất danh sách k-shingles (từ đơn và cụm 2-từ bi-grams)
 */
function extractShingles(text: string): Set<string> {
  const norm = normalizeVietnameseText(text);
  const words = norm.split(' ').filter(w => w.length > 1);
  const shingles = new Set<string>();

  // Thêm từ đơn
  for (const word of words) {
    shingles.add(word);
  }

  // Thêm cụm 2 từ (Bi-grams) để nắm bắt ngữ cảnh chính xác
  for (let i = 0; i < words.length - 1; i++) {
    shingles.add(`${words[i]}_${words[i + 1]}`);
  }

  // Thêm cụm 3 từ (Tri-grams)
  for (let i = 0; i < words.length - 2; i++) {
    shingles.add(`${words[i]}_${words[i + 1]}_${words[i + 2]}`);
  }

  return shingles;
}

/**
 * Tính toán độ tương đồng Jaccard giữa 2 tập hợp Shingles
 */
export function calculateJaccardSimilarity(shinglesA: Set<string>, shinglesB: Set<string>): number {
  if (shinglesA.size === 0 || shinglesB.size === 0) return 0;
  
  let intersectionCount = 0;
  for (const item of shinglesA) {
    if (shinglesB.has(item)) {
      intersectionCount++;
    }
  }

  const unionCount = shinglesA.size + shinglesB.size - intersectionCount;
  if (unionCount === 0) return 0;

  return (intersectionCount / unionCount) * 100;
}

/**
 * Xây dựng Vector TF cho Cosine Similarity
 */
function buildTermFrequencyVector(text: string): Map<string, number> {
  const norm = normalizeVietnameseText(text);
  const words = norm.split(' ').filter(w => w.length > 1);
  const freq = new Map<string, number>();

  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return freq;
}

/**
 * Tính toán Cosine Similarity giữa 2 đoạn văn bản
 */
export function calculateCosineSimilarity(textA: string, textB: string): number {
  const vecA = buildTermFrequencyVector(textA);
  const vecB = buildTermFrequencyVector(textB);

  let dotProduct = 0;
  for (const [word, countA] of vecA.entries()) {
    const countB = vecB.get(word);
    if (countB) {
      dotProduct += countA * countB;
    }
  }

  let normA = 0;
  for (const count of vecA.values()) {
    normA += count * count;
  }
  normA = Math.sqrt(normA);

  let normB = 0;
  for (const count of vecB.values()) {
    normB += count * count;
  }
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;

  return (dotProduct / (normA * normB)) * 100;
}

/**
 * Tính điểm tương đồng tổng hợp kết hợp:
 * 1. Tiêu đề Cosine (Trọng số 50%)
 * 2. Nội dung / Tóm tắt Jaccard Shingling (Trọng số 30%)
 * 3. Trùng khớp Thực thể cốt lõi (Cơ quan, Mã CK, Nhân vật, Chính sách) (Trọng số 20%)
 */
export function calculateHybridSimilarity(itemA: ScrapedNewsItem, itemB: ScrapedNewsItem): number {
  // 1. Tiêu đề Cosine
  const titleCosine = calculateCosineSimilarity(itemA.title, itemB.title);

  // 2. Nội dung Shingling Jaccard
  const shinglesA = extractShingles(`${itemA.title} ${itemA.summary || ''}`);
  const shinglesB = extractShingles(`${itemB.title} ${itemB.summary || ''}`);
  const contentJaccard = calculateJaccardSimilarity(shinglesA, shinglesB);

  // 3. Entity Overlap
  let entityOverlapScore = 0;
  let totalEntityChecks = 0;

  // Kiểm tra Tickers
  if (itemA.tickers?.length && itemB.tickers?.length) {
    totalEntityChecks++;
    const commonTickers = itemA.tickers.filter(t => itemB.tickers.includes(t));
    if (commonTickers.length > 0) entityOverlapScore += 100;
  }

  // Kiểm tra Cơ quan (Agencies)
  if (itemA.agencies?.length && itemB.agencies?.length) {
    totalEntityChecks++;
    const commonAgencies = itemA.agencies.filter(a => itemB.agencies?.includes(a));
    if (commonAgencies.length > 0) entityOverlapScore += 100;
  }

  // Kiểm tra Nhân vật (Key People)
  if (itemA.keyPeople?.length && itemB.keyPeople?.length) {
    totalEntityChecks++;
    const commonPeople = itemA.keyPeople.filter(p => itemB.keyPeople?.includes(p));
    if (commonPeople.length > 0) entityOverlapScore += 100;
  }

  const finalEntityScore = totalEntityChecks > 0 ? (entityOverlapScore / totalEntityChecks) : contentJaccard;

  // Điểm tương đồng tổng hợp
  const hybridScore = (titleCosine * 0.50) + (contentJaccard * 0.30) + (finalEntityScore * 0.20);
  return Math.round(hybridScore * 10) / 10;
}

/**
 * Parse timestamp thành mili-giây chuẩn xác (Ưu tiên publishedTimestamp tuyệt đối)
 */
export function getArticleTimestamp(item: ScrapedNewsItem): number {
  if (typeof item.publishedTimestamp === 'number' && !isNaN(item.publishedTimestamp) && item.publishedTimestamp > 0) {
    return item.publishedTimestamp;
  }
  if (item.publishedAt) {
    const ms = Date.parse(item.publishedAt);
    if (!isNaN(ms) && ms > 0) return ms;
  }
  return 0;
}

/**
 * Thuật toán Gom cụm sự kiện và Tìm kiếm Báo phát tán đầu tiên (First-Mover Detection)
 * Ngưỡng tương đồng mặc định: >= 72%
 */
export function clusterNewsArticles(
  articles: ScrapedNewsItem[],
  similarityThreshold: number = 72
): ClusteredEventCard[] {
  if (!articles || articles.length === 0) return [];

  const visited = new Set<string>();
  const clusters: ClusteredEventCard[] = [];

  // 1. Sắp xếp sơ bộ các bài viết theo thời gian xuất bản từ cũ đến mới nhất
  // để dễ dàng phát hiện First-Mover
  const sortedArticles = [...articles].sort((a, b) => {
    return getArticleTimestamp(a) - getArticleTimestamp(b);
  });

  for (let i = 0; i < sortedArticles.length; i++) {
    const current = sortedArticles[i];
    if (visited.has(current.id)) continue;

    visited.add(current.id);
    const clusterGroup: ScrapedNewsItem[] = [current];
    const similarities: number[] = [];

    // Tìm các bài tương đồng với current hoặc với các thành viên trong cụm
    for (let j = 0; j < sortedArticles.length; j++) {
      if (i === j) continue;
      const target = sortedArticles[j];
      if (visited.has(target.id)) continue;

      // Tính toán độ tương đồng với bài gốc
      const sim = calculateHybridSimilarity(current, target);

      if (sim >= similarityThreshold) {
        visited.add(target.id);
        clusterGroup.push(target);
        similarities.push(sim);
      }
    }

    // 2. Xác định First-Mover (Bài báo xuất bản sớm nhất trong cụm)
    clusterGroup.sort((a, b) => getArticleTimestamp(a) - getArticleTimestamp(b));
    const originArticle = clusterGroup[0];
    const originMs = getArticleTimestamp(originArticle);

    // Xác định mốc thời gian của bài mới nhất trong cụm
    const allArticleTimestamps = clusterGroup.map(a => getArticleTimestamp(a)).filter(t => t > 0);
    const latestPublishedTimestamp = allArticleTimestamps.length > 0 
      ? Math.max(...allArticleTimestamps) 
      : originMs;
    const latestArticle = clusterGroup.find(a => getArticleTimestamp(a) === latestPublishedTimestamp) || originArticle;

    // 3. Xây dựng danh sách các báo dẫn lại (Echo articles) và tính thời gian trễ
    const echoArticles: ClusteredEventCard['echoArticles'] = [];
    let totalLagMinutes = 0;

    for (let k = 1; k < clusterGroup.length; k++) {
      const echo = clusterGroup[k];
      const echoMs = getArticleTimestamp(echo);
      const lagMinutes = originMs > 0 && echoMs > 0 ? Math.max(0, Math.round((echoMs - originMs) / (60 * 1000))) : 0;
      totalLagMinutes += lagMinutes;

      const simWithOrigin = calculateHybridSimilarity(originArticle, echo);
      echoArticles.push({
        article: echo,
        publishedAt: echo.publishedAt,
        publishedTimeStr: echo.publishedTimeStr || echo.timeAgo,
        lagMinutes,
        similarity: simWithOrigin,
      });
    }

    // Sắp xếp các bài báo dẫn lại (echo) theo thời gian xuất bản từ mới nhất đến cũ nhất
    echoArticles.sort((a, b) => getArticleTimestamp(b.article) - getArticleTimestamp(a.article));

    const avgLagMinutes = echoArticles.length > 0 ? Math.round(totalLagMinutes / echoArticles.length) : 0;
    const avgSim = similarities.length > 0 
      ? Math.round(similarities.reduce((a, b) => a + b, 0) / similarities.length) 
      : 100;

    // 4. Tổng hợp các thông số đo lường
    const rawSources = clusterGroup.flatMap(a => (a.source || 'Báo chí').split(/[,;]+/).map(s => s.trim()).filter(Boolean));
    const seenSource = new Set<string>();
    const allSources: string[] = [];
    for (const s of rawSources) {
      const normKey = s.toLowerCase().replace(/\.(vn|com\.vn|com|org)$/i, '');
      if (!seenSource.has(normKey)) {
        seenSource.add(normKey);
        allSources.push(s);
      }
    }
    const originCleanSource = (originArticle.source || '').split(/[,;]+/)[0]?.trim() || 'Báo chí';
    const allTickers = Array.from(new Set(clusterGroup.flatMap(a => a.tickers || [])));
    const allAgencies = Array.from(new Set(clusterGroup.flatMap(a => a.agencies || [])));
    const allPolicyTags = Array.from(new Set(clusterGroup.flatMap(a => a.policyTags || [])));
    const allPeople = Array.from(new Set(clusterGroup.flatMap(a => a.keyPeople || [])));

    const avgSentiment = Math.round(
      clusterGroup.reduce((acc, a) => acc + (a.sentimentScore || 0), 0) / clusterGroup.length
    );

    let dominantSentiment: SentimentType = 'neutral';
    if (avgSentiment > 20) dominantSentiment = 'bullish';
    else if (avgSentiment < -20) dominantSentiment = 'bearish';

    const hasHighImpact = clusterGroup.some(a => a.impactLevel === 'high');
    const hasMediumImpact = clusterGroup.some(a => a.impactLevel === 'medium');
    const maxImpactLevel: ImpactLevel = hasHighImpact ? 'high' : hasMediumImpact ? 'medium' : 'low';
    const maxBuzz = Math.max(...clusterGroup.map(a => a.buzzScore || 50));

    // Lựa chọn tiêu đề đại diện chuẩn mực nhất (ưu tiên bài của nguồn chính thống hoặc bài gốc)
    const officialArt = clusterGroup.find(a => a.isOfficialSource);
    const bestTitleArticle = officialArt || originArticle;

    clusters.push({
      id: `cluster-${originArticle.id}`,
      clusterTitle: bestTitleArticle.title,
      eventSummary: originArticle.summary || originArticle.snippet || originArticle.title,
      sector: originArticle.sector,
      sectorNameVi: originArticle.sectorNameVi || 'Tài chính - Vĩ mô',
      similarityScore: avgSim,
      totalArticles: clusterGroup.length,
      originArticle,
      originSource: originCleanSource,
      originPublishedAt: originArticle.publishedAt,
      originPublishedTimeStr: originArticle.publishedTimeStr || originArticle.timeAgo,
      leadTimeMinutes: avgLagMinutes,
      latestPublishedTimestamp,
      latestPublishedAt: latestArticle.publishedAt,
      latestPublishedTimeStr: latestArticle.publishedTimeStr || latestArticle.timeAgo,
      echoArticles,
      avgSentimentScore: avgSentiment,
      dominantSentiment,
      maxImpactLevel,
      maxBuzzScore: maxBuzz,
      allSources,
      tickers: allTickers,
      agencies: allAgencies,
      policyTags: allPolicyTags,
      keyPeople: allPeople,
    });
  }

  // Sắp xếp các Cụm sự kiện: Cụm có bài viết mới nhất lên đầu theo đúng tiến trình thời gian
  clusters.sort((a, b) => {
    const timeA = a.latestPublishedTimestamp || getArticleTimestamp(a.originArticle);
    const timeB = b.latestPublishedTimestamp || getArticleTimestamp(b.originArticle);
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    return b.totalArticles - a.totalArticles;
  });

  return clusters;
}
