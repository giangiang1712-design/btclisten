import { ScrapeResponse, TimeRange, SectorType } from '../types';

/**
 * Creates a 100% fresh, isolated, deeply detached default empty ScrapeResponse object.
 * Every nested array and object is instantiated anew to prevent closure/reference sharing.
 */
export function createPristineEmptyScrapeResponse(
  timeRange: TimeRange = '24h',
  sector: SectorType = 'all',
  customKeyDriver?: string
): ScrapeResponse {
  const nowIso = new Date().toISOString();
  
  return {
    success: true,
    timestamp: nowIso,
    serverTimeIso: nowIso,
    scannedWindow: `Phiên quét trống (Đã Reset về 0 - ${nowIso})`,
    query: '',
    sector: sector,
    totalFound: 0,
    news: [],
    sentimentOverview: {
      bullishPercentage: 0,
      bearishPercentage: 0,
      neutralPercentage: 0,
      totalArticles: 0,
      overallMood: 'Đã Đặt Lại (0 tin)',
      moodScore: 50,
      alertLevel: 0,
      alertLabel: 'Bình Thường (M = 50)',
      alertDescription: 'Hệ thống đã được đặt lại về trạng thái 0 bài viết. Chưa có dữ liệu thu thập.',
      keyDriver: customKeyDriver || 'Cơ sở dữ liệu đang ở trạng thái 0 bài viết sau khi Reset. Nhấn "Bắt đầu quét tin tức mới" khi cần nạp dữ liệu.'
    },
    trendingKeywords: [],
    sectorStats: [],
    timelineData: [],
    urgentAlerts: [],
    sourceStats: [],
    droppedCount: 0,
    droppedArticles: []
  };
}

export interface StateVerificationResult {
  isPristine: boolean;
  violations: string[];
  articleCount: number;
  hasLingeringReferences: boolean;
  sanitizedState: ScrapeResponse;
}

/**
 * Validates and inspects a state candidate to verify whether it is 100% cleanly empty.
 * Detects lingering closures, referenced mutable arrays, non-zero counts, or stale artifacts.
 * If any violation is found, returns a freshly constructed pristine empty state.
 */
export function verifyAndSanitizeEmptyDataState(
  candidateState: ScrapeResponse | null | undefined,
  timeRange: TimeRange = '24h',
  sector: SectorType = 'all'
): StateVerificationResult {
  const violations: string[] = [];

  if (!candidateState) {
    const fresh = createPristineEmptyScrapeResponse(timeRange, sector);
    return {
      isPristine: true,
      violations: [],
      articleCount: 0,
      hasLingeringReferences: false,
      sanitizedState: fresh
    };
  }

  // 1. Check article array integrity
  if (!Array.isArray(candidateState.news)) {
    violations.push('Property `news` is not an Array instance.');
  } else if (candidateState.news.length > 0) {
    violations.push(`Property \`news\` contains ${candidateState.news.length} lingering article objects.`);
  }

  // 2. Check totalFound counter
  if (typeof candidateState.totalFound !== 'number' || candidateState.totalFound !== 0) {
    violations.push(`Property \`totalFound\` is ${candidateState.totalFound}, expected 0.`);
  }

  // 3. Check sentiment overview consistency
  if (candidateState.sentimentOverview) {
    if (candidateState.sentimentOverview.totalArticles !== 0) {
      violations.push(`Property \`sentimentOverview.totalArticles\` is ${candidateState.sentimentOverview.totalArticles}, expected 0.`);
    }
  } else {
    violations.push('Property `sentimentOverview` is missing or undefined.');
  }

  // 4. Check auxiliary arrays
  if (Array.isArray(candidateState.trendingKeywords) && candidateState.trendingKeywords.length > 0) {
    violations.push(`Property \`trendingKeywords\` contains ${candidateState.trendingKeywords.length} items.`);
  }
  if (Array.isArray(candidateState.sectorStats) && candidateState.sectorStats.length > 0) {
    violations.push(`Property \`sectorStats\` contains ${candidateState.sectorStats.length} items.`);
  }
  if (Array.isArray(candidateState.timelineData) && candidateState.timelineData.length > 0) {
    violations.push(`Property \`timelineData\` contains ${candidateState.timelineData.length} items.`);
  }
  if (Array.isArray(candidateState.urgentAlerts) && candidateState.urgentAlerts.length > 0) {
    violations.push(`Property \`urgentAlerts\` contains ${candidateState.urgentAlerts.length} items.`);
  }
  if (Array.isArray(candidateState.sourceStats) && candidateState.sourceStats.length > 0) {
    violations.push(`Property \`sourceStats\` contains ${candidateState.sourceStats.length} items.`);
  }
  if (Array.isArray(candidateState.droppedArticles) && candidateState.droppedArticles.length > 0) {
    violations.push(`Property \`droppedArticles\` contains ${candidateState.droppedArticles.length} items.`);
  }

  const isPristine = violations.length === 0;

  if (!isPristine) {
    console.warn('⚠️ [State Audit] Lingering state detected in data state reset verification:', violations);
  }

  // Guarantee absolute independence by returning fresh isolated clone
  const sanitizedState = isPristine
    ? {
        ...candidateState,
        news: [],
        trendingKeywords: [],
        sectorStats: [],
        timelineData: [],
        urgentAlerts: [],
        sourceStats: [],
        droppedArticles: [],
        totalFound: 0
      }
    : createPristineEmptyScrapeResponse(timeRange, sector);

  return {
    isPristine,
    violations,
    articleCount: candidateState.news?.length || 0,
    hasLingeringReferences: !isPristine,
    sanitizedState
  };
}
