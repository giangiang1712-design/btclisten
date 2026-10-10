import {
  NewsArticleRecord,
  NewsDbQueryCriteria,
  NewsDbQueryResult,
  NewsDbAnalyticsResult,
  NewsDbSourceStat,
  NewsDbTimelinePoint,
  NewsDbSectorStat,
  ScrapedNewsItem,
  SECTOR_NAMES,
} from '../types';

/**
 * Remove Vietnamese accents for high-precision, accent-insensitive search
 */
export function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Normalize and ensure an article conforms strictly to the NewsArticleRecord schema
 */
export function normalizeToNewsArticleRecord(raw: any): NewsArticleRecord {
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();

  let pubTimestamp = nowMs;
  let pubIso = nowIso;

  if (raw.publishedTimestamp && typeof raw.publishedTimestamp === 'number' && !isNaN(raw.publishedTimestamp)) {
    pubTimestamp = raw.publishedTimestamp;
    pubIso = new Date(pubTimestamp).toISOString();
  } else if (raw.publishedAt) {
    const parsed = Date.parse(raw.publishedAt);
    if (!isNaN(parsed) && parsed > 0) {
      pubTimestamp = parsed;
      pubIso = new Date(parsed).toISOString();
    }
  }

  const title = (raw.title || 'Tin tức tài chính').trim();
  const summary = (raw.summary || raw.snippet || raw.content || '').trim();
  const content = (raw.content || raw.summary || raw.snippet || title).trim();
  const source = (raw.source || raw.sourceName || 'Tin tức Tài chính').trim();
  const url = (raw.url || raw.link || '').trim() || `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + source)}`;
  
  const id = raw.id || `news-${source.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

  return {
    id,
    title,
    content,
    summary,
    snippet: summary.substring(0, 180),
    url,
    publishedAt: pubIso,
    publishedTimestamp: pubTimestamp,
    publishedTimeStr: raw.publishedTimeStr || new Date(pubTimestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    timeAgo: raw.timeAgo || 'Vừa đăng',
    source,
    sourceNormalized: removeVietnameseAccents(source),
    sector: raw.sector || 'macro',
    sectorNameVi: raw.sectorNameVi || SECTOR_NAMES[raw.sector || 'macro'] || 'Kinh tế vĩ mô',
    sentiment: raw.sentiment || 'neutral',
    sentimentScore: typeof raw.sentimentScore === 'number' ? raw.sentimentScore : 70,
    sentimentReason: raw.sentimentReason || 'Phản ánh diễn biến thị trường',
    impactLevel: raw.impactLevel || 'medium',
    impactScore: typeof raw.impactScore === 'number' ? raw.impactScore : 65,
    buzzScore: typeof raw.buzzScore === 'number' ? raw.buzzScore : 75,
    keyPoints: Array.isArray(raw.keyPoints) ? raw.keyPoints : [],
    keyPeople: Array.isArray(raw.keyPeople) ? raw.keyPeople : [],
    agencies: Array.isArray(raw.agencies) ? raw.agencies : [],
    tickers: Array.isArray(raw.tickers) ? raw.tickers : [],
    policyTags: Array.isArray(raw.policyTags) ? raw.policyTags : [],
    sixW: raw.sixW,
    executiveDirective: raw.executiveDirective,
    authorityLevel: raw.authorityLevel || (raw.isOfficialSource ? 'official' : 'top_tier'),
    isOfficialSource: Boolean(raw.isOfficialSource),
    isEmergency: Boolean(raw.isEmergency),
    crawledAt: raw.crawledAt || nowIso,
    crawledTimestamp: raw.crawledTimestamp || nowMs,
    scrapedDateFormatted: raw.scrapedDateFormatted || new Date(raw.crawledTimestamp || nowMs).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false }),
    scrapedDate: raw.scrapedDate || new Date(raw.crawledTimestamp || nowMs).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }),
    scrapedYear: raw.scrapedYear || new Date(raw.crawledTimestamp || nowMs).getFullYear(),
    scrapedMonth: raw.scrapedMonth || (new Date(raw.crawledTimestamp || nowMs).getMonth() + 1),
    scrapedDay: raw.scrapedDay || new Date(raw.crawledTimestamp || nowMs).getDate(),
    scrapedHour: raw.scrapedHour || new Date(raw.crawledTimestamp || nowMs).getHours(),
    linkAuditStatus: raw.linkAuditStatus || 'ok',
    imageUrl: raw.imageUrl || '',
    author: raw.author || '',
    commentCount: typeof raw.commentCount === 'number' ? raw.commentCount : 0,
    syndicationCount: typeof raw.syndicationCount === 'number' ? raw.syndicationCount : 1,
    wordCount: typeof raw.wordCount === 'number' ? raw.wordCount : (summary ? summary.split(/\s+/).length : 0),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
  };
}

/**
 * In-Memory High-Performance News Database Engine with Inverted Indexing & Multi-Criteria Query Support
 */
export class NewsDatabaseEngine {
  private records = new Map<string, NewsArticleRecord>();
  private invertedIndex = new Map<string, Set<string>>(); // token -> articleIds
  private sourceIndex = new Map<string, Set<string>>(); // source -> articleIds
  private sectorIndex = new Map<string, Set<string>>(); // sector -> articleIds
  private sentimentIndex = new Map<string, Set<string>>(); // sentiment -> articleIds

  constructor(initialRecords: any[] = []) {
    if (initialRecords && initialRecords.length > 0) {
      this.insertBatch(initialRecords);
    }
  }

  /**
   * Tokenize text into search tokens
   */
  private tokenizeText(text: string): string[] {
    const clean = removeVietnameseAccents(text)
      .replace(/[^\w\s\d]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return clean.split(' ').filter((w) => w.length >= 2);
  }

  /**
   * Index a record across inverted index tables
   */
  private indexRecord(record: NewsArticleRecord) {
    const id = record.id;

    // 1. Source index
    const normSource = removeVietnameseAccents(record.source);
    if (!this.sourceIndex.has(normSource)) this.sourceIndex.set(normSource, new Set());
    this.sourceIndex.get(normSource)!.add(id);

    // 2. Sector index
    if (record.sector) {
      const sec = record.sector.toLowerCase();
      if (!this.sectorIndex.has(sec)) this.sectorIndex.set(sec, new Set());
      this.sectorIndex.get(sec)!.add(id);
    }

    // 3. Sentiment index
    if (record.sentiment) {
      const sent = record.sentiment.toLowerCase();
      if (!this.sentimentIndex.has(sent)) this.sentimentIndex.set(sent, new Set());
      this.sentimentIndex.get(sent)!.add(id);
    }

    // 4. Inverted Full-Text Index
    const searchableCorpus = `${record.title} ${record.summary || ''} ${record.content} ${(record.keyPeople || []).join(' ')} ${(record.agencies || []).join(' ')} ${(record.tickers || []).join(' ')} ${(record.policyTags || []).join(' ')}`;
    const tokens = this.tokenizeText(searchableCorpus);

    tokens.forEach((token) => {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Set());
      }
      this.invertedIndex.get(token)!.add(id);
    });
  }

  /**
   * Remove a record from index tables
   */
  private unindexRecord(id: string) {
    const record = this.records.get(id);
    if (!record) return;

    // Remove from source index
    const normSource = removeVietnameseAccents(record.source);
    this.sourceIndex.get(normSource)?.delete(id);

    // Remove from sector index
    if (record.sector) this.sectorIndex.get(record.sector.toLowerCase())?.delete(id);

    // Remove from sentiment index
    if (record.sentiment) this.sentimentIndex.get(record.sentiment.toLowerCase())?.delete(id);

    // Remove from inverted index
    const searchableCorpus = `${record.title} ${record.summary || ''} ${record.content}`;
    const tokens = this.tokenizeText(searchableCorpus);
    tokens.forEach((token) => {
      this.invertedIndex.get(token)?.delete(id);
    });
  }

  /**
   * Insert or update a single article record
   */
  public insert(rawArticle: any): NewsArticleRecord {
    const record = normalizeToNewsArticleRecord(rawArticle);
    if (this.records.has(record.id)) {
      this.unindexRecord(record.id);
    }
    this.records.set(record.id, record);
    this.indexRecord(record);
    return record;
  }

  /**
   * Batch insert articles
   */
  public insertBatch(rawArticles: any[]): NewsArticleRecord[] {
    const results: NewsArticleRecord[] = [];
    rawArticles.forEach((raw) => {
      const rec = this.insert(raw);
      results.push(rec);
    });
    return results;
  }

  /**
   * Get article by unique ID
   */
  public getById(id: string): NewsArticleRecord | undefined {
    return this.records.get(id);
  }

  /**
   * Delete an article by ID
   */
  public delete(id: string): boolean {
    if (!this.records.has(id)) return false;
    this.unindexRecord(id);
    this.records.delete(id);
    return true;
  }

  /**
   * Update fields of an existing article
   */
  public update(id: string, updates: Partial<NewsArticleRecord>): NewsArticleRecord | undefined {
    const existing = this.records.get(id);
    if (!existing) return undefined;

    const merged = {
      ...existing,
      ...updates,
      id, // Preserve ID
    };

    return this.insert(merged);
  }

  /**
   * Get all article records
   */
  public getAll(): NewsArticleRecord[] {
    return Array.from(this.records.values());
  }

  /**
   * Get total article count
   */
  public count(): number {
    return this.records.size;
  }

  /**
   * Clear database
   */
  public clear(): void {
    this.records.clear();
    this.invertedIndex.clear();
    this.sourceIndex.clear();
    this.sectorIndex.clear();
    this.sentimentIndex.clear();
  }

  /**
   * Get distinct sources with their article counts
   */
  public getDistinctSources(): Array<{ source: string; count: number }> {
    const counts = new Map<string, number>();
    this.records.forEach((art) => {
      const src = art.source || 'Khác';
      counts.set(src, (counts.get(src) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  }

  // ==========================================================================
  // QUERY FUNCTIONS (Hàm Truy Vấn Dữ Liệu)
  // ==========================================================================

  /**
   * 1. Query by Keyword (Truy vấn theo từ khóa)
   */
  public getArticlesByKeyword(keyword: string, options: Omit<NewsDbQueryCriteria, 'keyword'> = {}): NewsDbQueryResult {
    return this.query({
      ...options,
      keyword,
    });
  }

  /**
   * 2. Query by Time Range (Truy vấn theo khoảng thời gian)
   */
  public getArticlesByTimeRange(
    startTime: number | string | Date,
    endTime: number | string | Date,
    options: Omit<NewsDbQueryCriteria, 'timeFilter'> = {}
  ): NewsDbQueryResult {
    return this.query({
      ...options,
      timeFilter: {
        startTime,
        endTime,
      },
    });
  }

  /**
   * 3. Query by Source (Truy vấn theo nguồn tin tức)
   */
  public getArticlesBySource(
    sourceOrSources: string | string[],
    options: Omit<NewsDbQueryCriteria, 'sources'> = {}
  ): NewsDbQueryResult {
    const sources = Array.isArray(sourceOrSources) ? sourceOrSources : [sourceOrSources];
    return this.query({
      ...options,
      sources,
    });
  }

  /**
   * 4. Query by Sector (Truy vấn theo lĩnh vực)
   */
  public getArticlesBySector(
    sectorOrSectors: string | string[],
    options: Omit<NewsDbQueryCriteria, 'sectors'> = {}
  ): NewsDbQueryResult {
    const sectors = Array.isArray(sectorOrSectors) ? sectorOrSectors : [sectorOrSectors];
    return this.query({
      ...options,
      sectors,
    });
  }

  /**
   * 5. Query by Sentiment (Truy vấn theo sắc thái cảm xúc)
   */
  public getArticlesBySentiment(
    sentiment: 'bullish' | 'bearish' | 'neutral' | ('bullish' | 'bearish' | 'neutral')[],
    options: Omit<NewsDbQueryCriteria, 'sentiments'> = {}
  ): NewsDbQueryResult {
    const sentiments = Array.isArray(sentiment) ? sentiment : [sentiment];
    return this.query({
      ...options,
      sentiments,
    });
  }

  /**
   * MASTER MULTI-CRITERIA QUERY FUNCTION (Hàm truy vấn đa tiêu chí)
   */
  public query(criteria: NewsDbQueryCriteria = {}): NewsDbQueryResult {
    const startTimeBench = performance.now();
    let candidates: NewsArticleRecord[] = Array.from(this.records.values());

    // 1. Filter by Keyword
    if (criteria.keyword && criteria.keyword.trim()) {
      const rawKw = criteria.keyword.trim();
      const normKw = removeVietnameseAccents(rawKw);
      const queryTokens = this.tokenizeText(normKw);

      if (queryTokens.length > 0) {
        candidates = candidates.filter((art) => {
          const normTitle = removeVietnameseAccents(art.title);
          const normSummary = removeVietnameseAccents(art.summary || '');
          const normContent = removeVietnameseAccents(art.content);
          const normEntities = removeVietnameseAccents(
            [...(art.keyPeople || []), ...(art.agencies || []), ...(art.tickers || []), ...(art.policyTags || [])].join(' ')
          );

          const fullCorpus = `${normTitle} ${normSummary} ${normContent} ${normEntities}`;

          // Substring match
          if (fullCorpus.includes(normKw)) return true;

          // All tokens match
          return queryTokens.every((token) => fullCorpus.includes(token));
        });
      }
    }

    // 2. Filter by Sources
    if (criteria.sources && criteria.sources.length > 0) {
      const allowedSources = new Set(criteria.sources.map((s) => removeVietnameseAccents(s)));
      candidates = candidates.filter((art) => {
        const artSourceNorm = removeVietnameseAccents(art.source);
        return allowedSources.has(artSourceNorm) || criteria.sources!.some((s) => art.source.toLowerCase().includes(s.toLowerCase()));
      });
    }

    // 3. Filter by Time Range
    if (criteria.timeFilter) {
      let minMs = -Infinity;
      let maxMs = Infinity;

      if (criteria.timeFilter.preset && criteria.timeFilter.preset !== 'custom' && criteria.timeFilter.preset !== 'all') {
        const now = Date.now();
        switch (criteria.timeFilter.preset) {
          case '1h': minMs = now - 1 * 3600 * 1000; break;
          case '2h': minMs = now - 2 * 3600 * 1000; break;
          case '4h': minMs = now - 4 * 3600 * 1000; break;
          case '8h': minMs = now - 8 * 3600 * 1000; break;
          case '24h': minMs = now - 24 * 3600 * 1000; break;
          case '7d': minMs = now - 7 * 24 * 3600 * 1000; break;
          case '30d': minMs = now - 30 * 24 * 3600 * 1000; break;
        }
      } else {
        if (criteria.timeFilter.startTime) {
          const parsed = typeof criteria.timeFilter.startTime === 'number'
            ? criteria.timeFilter.startTime
            : Date.parse(String(criteria.timeFilter.startTime));
          if (!isNaN(parsed)) minMs = parsed;
        }
        if (criteria.timeFilter.endTime) {
          const parsed = typeof criteria.timeFilter.endTime === 'number'
            ? criteria.timeFilter.endTime
            : Date.parse(String(criteria.timeFilter.endTime));
          if (!isNaN(parsed)) maxMs = parsed;
        }
      }

      candidates = candidates.filter((art) => {
        const t = art.publishedTimestamp;
        return t >= minMs && t <= maxMs;
      });
    }

    // 4. Filter by Sectors
    if (criteria.sectors && criteria.sectors.length > 0 && !criteria.sectors.includes('all')) {
      const allowedSectors = new Set(criteria.sectors.map((s) => s.toLowerCase()));
      candidates = candidates.filter((art) => art.sector && allowedSectors.has(art.sector.toLowerCase()));
    }

    // 5. Filter by Sentiments
    if (criteria.sentiments && criteria.sentiments.length > 0) {
      const allowedSentiments = new Set(criteria.sentiments.map((s) => s.toLowerCase()));
      candidates = candidates.filter((art) => art.sentiment && allowedSentiments.has(art.sentiment.toLowerCase()));
    }

    // 6. Filter by Impact Levels
    if (criteria.impactLevels && criteria.impactLevels.length > 0) {
      const allowedImpacts = new Set(criteria.impactLevels.map((i) => i.toLowerCase()));
      candidates = candidates.filter((art) => art.impactLevel && allowedImpacts.has(art.impactLevel.toLowerCase()));
    }

    // 7. Filter by Score Bounds
    if (typeof criteria.minSentimentScore === 'number') {
      candidates = candidates.filter((art) => (art.sentimentScore || 0) >= criteria.minSentimentScore!);
    }
    if (typeof criteria.maxSentimentScore === 'number') {
      candidates = candidates.filter((art) => (art.sentimentScore || 0) <= criteria.maxSentimentScore!);
    }
    if (typeof criteria.minBuzzScore === 'number') {
      candidates = candidates.filter((art) => (art.buzzScore || 0) >= criteria.minBuzzScore!);
    }
    if (criteria.isOfficialOnly) {
      candidates = candidates.filter((art) => art.isOfficialSource === true || art.authorityLevel === 'official');
    }

    // 8. Sorting
    const sortBy = criteria.sortBy || 'publishedAt';
    const sortOrder = criteria.sortOrder || 'desc';
    const orderFactor = sortOrder === 'asc' ? 1 : -1;

    candidates.sort((a, b) => {
      if (sortBy === 'publishedAt') {
        return (a.publishedTimestamp - b.publishedTimestamp) * orderFactor;
      }
      if (sortBy === 'sentimentScore') {
        return ((a.sentimentScore || 0) - (b.sentimentScore || 0)) * orderFactor;
      }
      if (sortBy === 'buzzScore') {
        return ((a.buzzScore || 0) - (b.buzzScore || 0)) * orderFactor;
      }
      if (sortBy === 'impactScore') {
        return ((a.impactScore || 0) - (b.impactScore || 0)) * orderFactor;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title, 'vi') * orderFactor;
      }
      return (a.publishedTimestamp - b.publishedTimestamp) * orderFactor;
    });

    const totalCount = candidates.length;
    const pageSize = criteria.pageSize || criteria.limit || 25;
    const page = criteria.page || 1;
    const offset = criteria.offset !== undefined ? criteria.offset : (page - 1) * pageSize;
    const paginatedArticles = candidates.slice(offset, offset + pageSize);
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    const executionTimeMs = Math.round((performance.now() - startTimeBench) * 100) / 100;

    return {
      articles: paginatedArticles,
      totalCount,
      page,
      pageSize,
      totalPages,
      executionTimeMs,
      appliedCriteria: criteria,
      hasMore: offset + pageSize < totalCount,
    };
  }

  // ==========================================================================
  // ANALYTICS & INSIGHTS FUNCTIONS (Hàm Phân Tích Dữ Liệu)
  // ==========================================================================

  /**
   * Deep Multi-Dimensional Statistical and Sentiment Analysis on Dataset
   */
  public analyzeNewsData(
    articlesOrCriteria?: NewsArticleRecord[] | NewsDbQueryCriteria
  ): NewsDbAnalyticsResult {
    const startTimeBench = performance.now();

    let articlesToAnalyze: NewsArticleRecord[];
    if (Array.isArray(articlesOrCriteria)) {
      articlesToAnalyze = articlesOrCriteria;
    } else if (articlesOrCriteria) {
      // Query first with unlimited size
      const queryRes = this.query({ ...articlesOrCriteria, limit: 10000, pageSize: 10000 });
      articlesToAnalyze = queryRes.articles;
    } else {
      articlesToAnalyze = Array.from(this.records.values());
    }

    const totalArticles = articlesToAnalyze.length;

    // 1. Source Breakdown
    const sourceMap = new Map<string, {
      count: number;
      totalSentiment: number;
      bullish: number;
      bearish: number;
      neutral: number;
      official: number;
    }>();

    articlesToAnalyze.forEach((art) => {
      const src = art.source || 'Khác';
      const existing = sourceMap.get(src) || {
        count: 0,
        totalSentiment: 0,
        bullish: 0,
        bearish: 0,
        neutral: 0,
        official: 0,
      };

      existing.count += 1;
      existing.totalSentiment += (art.sentimentScore || 70);
      if (art.sentiment === 'bullish') existing.bullish += 1;
      else if (art.sentiment === 'bearish') existing.bearish += 1;
      else existing.neutral += 1;

      if (art.isOfficialSource) existing.official += 1;

      sourceMap.set(src, existing);
    });

    const sourceDistribution: NewsDbSourceStat[] = Array.from(sourceMap.entries())
      .map(([source, stats]) => ({
        source,
        count: stats.count,
        percentage: totalArticles > 0 ? Math.round((stats.count / totalArticles) * 1000) / 10 : 0,
        avgSentimentScore: stats.count > 0 ? Math.round(stats.totalSentiment / stats.count) : 0,
        bullishCount: stats.bullish,
        bearishCount: stats.bearish,
        neutralCount: stats.neutral,
        officialCount: stats.official,
      }))
      .sort((a, b) => b.count - a.count);

    // 2. Timeline Distribution (Adaptive Bucketing)
    let timelineDistribution: NewsDbTimelinePoint[] = [];
    if (totalArticles > 0) {
      const sortedByTime = [...articlesToAnalyze].sort((a, b) => a.publishedTimestamp - b.publishedTimestamp);
      const minTime = sortedByTime[0].publishedTimestamp;
      const maxTime = sortedByTime[sortedByTime.length - 1].publishedTimestamp;
      const spanMs = Math.max(3600 * 1000, maxTime - minTime);

      const bucketCount = spanMs > 48 * 3600 * 1000 ? 7 : spanMs > 12 * 3600 * 1000 ? 6 : 6;
      const bucketSizeMs = Math.ceil(spanMs / bucketCount);

      const buckets: NewsDbTimelinePoint[] = [];
      for (let i = 0; i < bucketCount; i++) {
        const bStart = minTime + i * bucketSizeMs;
        const bEnd = bStart + bucketSizeMs;
        const dateObj = new Date(bStart);
        const timeLabel = spanMs > 24 * 3600 * 1000
          ? `${dateObj.getDate()}/${dateObj.getMonth() + 1}`
          : `${String(dateObj.getHours()).padStart(2, '0')}:00`;

        buckets.push({
          timeLabel,
          timestamp: bStart,
          totalCount: 0,
          bullishCount: 0,
          bearishCount: 0,
          neutralCount: 0,
        });
      }

      articlesToAnalyze.forEach((art) => {
        const t = art.publishedTimestamp;
        let bucketIdx = Math.floor((t - minTime) / bucketSizeMs);
        if (bucketIdx < 0) bucketIdx = 0;
        if (bucketIdx >= bucketCount) bucketIdx = bucketCount - 1;

        buckets[bucketIdx].totalCount += 1;
        if (art.sentiment === 'bullish') buckets[bucketIdx].bullishCount += 1;
        else if (art.sentiment === 'bearish') buckets[bucketIdx].bearishCount += 1;
        else buckets[bucketIdx].neutralCount += 1;
      });

      timelineDistribution = buckets;
    }

    // 3. Sentiment Breakdown & Market Mood Score
    let bullishCount = 0;
    let bearishCount = 0;
    let neutralCount = 0;
    let totalScore = 0;

    articlesToAnalyze.forEach((art) => {
      if (art.sentiment === 'bullish') bullishCount++;
      else if (art.sentiment === 'bearish') bearishCount++;
      else neutralCount++;
      totalScore += (art.sentimentScore || 70);
    });

    const bullishPercentage = totalArticles > 0 ? Math.round((bullishCount / totalArticles) * 100) : 0;
    const bearishPercentage = totalArticles > 0 ? Math.round((bearishCount / totalArticles) * 100) : 0;
    const neutralPercentage = totalArticles > 0 ? Math.max(0, 100 - bullishPercentage - bearishPercentage) : 0;

    let overallMood: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (bullishPercentage > bearishPercentage + 15) overallMood = 'bullish';
    else if (bearishPercentage > bullishPercentage + 10) overallMood = 'bearish';

    const marketMoodScore = totalArticles > 0 ? Math.round(totalScore / totalArticles) : 70;

    // 4. Sector Breakdown
    const sectorMap = new Map<string, { count: number; totalSentiment: number; highImpact: number }>();
    articlesToAnalyze.forEach((art) => {
      const sec = art.sector || 'macro';
      const item = sectorMap.get(sec) || { count: 0, totalSentiment: 0, highImpact: 0 };
      item.count += 1;
      item.totalSentiment += (art.sentimentScore || 70);
      if (art.impactLevel === 'high') item.highImpact += 1;
      sectorMap.set(sec, item);
    });

    const sectorBreakdown: NewsDbSectorStat[] = Array.from(sectorMap.entries())
      .map(([sec, stats]) => ({
        sector: sec,
        sectorNameVi: SECTOR_NAMES[sec] || sec,
        count: stats.count,
        percentage: totalArticles > 0 ? Math.round((stats.count / totalArticles) * 1000) / 10 : 0,
        avgSentimentScore: stats.count > 0 ? Math.round(stats.totalSentiment / stats.count) : 70,
        highImpactCount: stats.highImpact,
      }))
      .sort((a, b) => b.count - a.count);

    // 5. Impact Breakdown
    let highImpact = 0;
    let mediumImpact = 0;
    let lowImpact = 0;
    articlesToAnalyze.forEach((art) => {
      if (art.impactLevel === 'high') highImpact++;
      else if (art.impactLevel === 'low') lowImpact++;
      else mediumImpact++;
    });

    // 6. Keywords & Named Entity Intelligence
    const kwMap = new Map<string, { count: number; weight: number }>();
    const agencyMap = new Map<string, number>();
    const peopleMap = new Map<string, number>();
    const tickerMap = new Map<string, number>();
    const policyMap = new Map<string, number>();

    const FINANCIAL_HOT_KEYWORDS = [
      { kw: 'Trái phiếu', weight: 4.8 },
      { kw: 'Thuế GTGT / Hóa đơn', weight: 4.9 },
      { kw: 'Nâng hạng TTCK', weight: 5.0 },
      { kw: 'Đầu tư công', weight: 4.5 },
      { kw: 'FDI', weight: 4.2 },
      { kw: 'Tỷ giá USD', weight: 4.4 },
      { kw: 'Lãi suất', weight: 4.6 },
      { kw: 'SCIC', weight: 4.1 },
      { kw: 'Kho bạc Nhà nước', weight: 4.7 },
      { kw: 'Hải quan số', weight: 4.3 },
      { kw: 'Non-prefunding', weight: 4.9 },
      { kw: 'Giá vàng SJC', weight: 4.0 },
      { kw: 'Thanh tra tài chính', weight: 4.8 },
    ];

    articlesToAnalyze.forEach((art) => {
      const full = `${art.title} ${art.summary || ''} ${art.content}`.toLowerCase();

      // Track hot keywords
      FINANCIAL_HOT_KEYWORDS.forEach((item) => {
        if (full.includes(item.kw.toLowerCase())) {
          const cur = kwMap.get(item.kw) || { count: 0, weight: item.weight };
          cur.count++;
          kwMap.set(item.kw, cur);
        }
      });

      // Track agencies
      (art.agencies || []).forEach((ag) => {
        agencyMap.set(ag, (agencyMap.get(ag) || 0) + 1);
      });

      // Track people
      (art.keyPeople || []).forEach((p) => {
        peopleMap.set(p, (peopleMap.get(p) || 0) + 1);
      });

      // Track tickers
      (art.tickers || []).forEach((tk) => {
        tickerMap.set(tk, (tickerMap.get(tk) || 0) + 1);
      });

      // Track policies
      (art.policyTags || []).forEach((pol) => {
        policyMap.set(pol, (policyMap.get(pol) || 0) + 1);
      });
    });

    const topKeywords = Array.from(kwMap.entries())
      .map(([keyword, val]) => ({ keyword, count: val.count, weight: val.weight }))
      .sort((a, b) => b.count * b.weight - a.count * a.weight)
      .slice(0, 10);

    const topEntities = {
      agencies: Array.from(agencyMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8),
      people: Array.from(peopleMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8),
      tickers: Array.from(tickerMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8),
      policies: Array.from(policyMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8),
    };

    // 7. Executive Strategic Insights
    const executiveInsights: string[] = [];
    if (totalArticles > 0) {
      if (bullishPercentage > 60) {
        executiveInsights.push(`Dư luận truyền thông ghi nhận trạng thái lạc quan áp đảo (${bullishPercentage}% tin tích cực), tập trung vào tiến độ giải ngân đầu tư công và chính sách nâng hạng TTCK.`);
      } else if (bearishPercentage > 35) {
        executiveInsights.push(`Gia tăng áp lực rủi ro truyền thông (${bearishPercentage}% tin tiêu cực), đặc biệt ở các nhóm vấn đề đáo hạn trái phiếu và biến động tỷ giá; khuyến nghị chủ động tham mưu định hướng.`);
      } else {
        executiveInsights.push(`Dòng tin tức tài chính diễn biến ổn định, cân bằng giữa các thông tin hỗ trợ phục hồi và các lưu ý quản trị rủi ro vĩ mô.`);
      }

      if (sourceDistribution.length > 0) {
        const topSource = sourceDistribution[0];
        executiveInsights.push(`Nguồn báo chí phát sinh nhiều tin nhất: ${topSource.source} (${topSource.count} bài viết, chiếm ${topSource.percentage}% tổng lượng tin cào).`);
      }

      if (sectorBreakdown.length > 0) {
        const topSector = sectorBreakdown[0];
        executiveInsights.push(`Lĩnh vực thu hút sự chú ý nhiều nhất: ${topSector.sectorNameVi} (${topSector.count} bài, ${topSector.highImpactCount} bài tác động cao).`);
      }
    }

    const executionTimeMs = Math.round((performance.now() - startTimeBench) * 100) / 100;

    let minTimestamp = Infinity;
    let maxTimestamp = -Infinity;
    if (articlesToAnalyze.length > 0) {
      for (const a of articlesToAnalyze) {
        if (typeof a.publishedTimestamp === 'number' && !isNaN(a.publishedTimestamp)) {
          if (a.publishedTimestamp < minTimestamp) minTimestamp = a.publishedTimestamp;
          if (a.publishedTimestamp > maxTimestamp) maxTimestamp = a.publishedTimestamp;
        }
      }
    }

    const earliest = isFinite(minTimestamp) ? new Date(minTimestamp).toISOString() : new Date().toISOString();
    const latest = isFinite(maxTimestamp) ? new Date(maxTimestamp).toISOString() : new Date().toISOString();

    const durationHours = Math.round((Date.parse(latest) - Date.parse(earliest)) / (3600 * 1000) * 10) / 10;

    return {
      totalArticles,
      uniqueSourcesCount: sourceDistribution.length,
      timeSpan: {
        earliest,
        latest,
        durationHours: Math.max(1, durationHours),
      },
      sourceDistribution,
      timelineDistribution,
      sentimentBreakdown: {
        bullish: bullishCount,
        bearish: bearishCount,
        neutral: neutralCount,
        bullishPercentage,
        bearishPercentage,
        neutralPercentage,
        overallMood,
        marketMoodScore,
      },
      sectorBreakdown,
      impactBreakdown: {
        high: highImpact,
        medium: mediumImpact,
        low: lowImpact,
      },
      topKeywords,
      topEntities,
      executiveInsights,
      executionTimeMs,
    };
  }

  // ==========================================================================
  // EXPORT / IMPORT UTILITIES
  // ==========================================================================

  public exportToJson(): string {
    return JSON.stringify(Array.from(this.records.values()), null, 2);
  }

  public exportToCsv(): string {
    const articles = Array.from(this.records.values());
    const headers = ['ID', 'Tiêu đề', 'Nội dung tóm tắt', 'Nguồn tin', 'Thời gian đăng', 'Lĩnh vực', 'Sắc thái', 'Điểm sắc thái', 'Tác động', 'URL'];
    
    const escapeCsv = (str: any) => {
      const s = String(str || '').replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = articles.map((a) => [
      escapeCsv(a.id),
      escapeCsv(a.title),
      escapeCsv(a.summary || a.snippet || a.content),
      escapeCsv(a.source),
      escapeCsv(a.publishedAt),
      escapeCsv(a.sectorNameVi || a.sector),
      escapeCsv(a.sentiment),
      escapeCsv(a.sentimentScore),
      escapeCsv(a.impactLevel),
      escapeCsv(a.url),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public importFromJson(jsonStr: string): number {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        this.insertBatch(parsed);
        return parsed.length;
      }
      return 0;
    } catch {
      return 0;
    }
  }
}

// Global Singleton Instance for client-side state
export const globalNewsDatabase = new NewsDatabaseEngine();
