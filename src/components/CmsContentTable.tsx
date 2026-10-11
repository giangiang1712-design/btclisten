import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ScrapedNewsItem,
  SentimentType,
  ImpactLevel,
  NewsSortOption,
  SectorType,
  ViewDensityMode,
  formatNewsTimeDisplay,
  formatNewsFullDateTime,
  formatCrawlTimeDisplay,
  SECTOR_NAMES,
  DirectiveActionType,
} from '../types';
import { resolveDirectiveActionType } from '../lib/warningPipelineEngine';
import {
  Search,
  Filter,
  CheckSquare,
  Square,
  MinusSquare,
  Flag,
  Sparkles,
  ExternalLink,
  MessageSquare,
  FileEdit,
  ShieldAlert,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Tag,
  CheckCircle2,
  Clock,
  Flame,
  Bookmark,
  TrendingUp,
  Download,
  ListFilter,
  Layers,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Share2,
  Check,
  FileCheck2,
  Info,
  Zap,
  LayoutList,
  Eye,
  Film,
  Award,
  PlusCircle,
  Edit3,
  Trash2,
  X,
  Save,
  AlertTriangle,
  CheckCircle,
  Database,
  RefreshCw,
  Loader2,
  Newspaper,
  Building2,
  ShieldCheck,
  Code2,
  Copy,
  SlidersHorizontal,
  BarChart3,
  LayoutGrid,
  Mail,
  BrainCircuit,
  AlertCircle,
  MoreVertical,
  MoreHorizontal,
  Cpu,
} from 'lucide-react';
import { decodeHtmlEntities, cleanHtmlTitle } from '../lib/htmlDecoder';
import { NewsDatabaseExplorer } from './NewsDatabaseExplorer';
import { DatabaseAuditReport } from './DatabaseAuditReport';
import { calculateArticleMoFPriorityScore, KeywordWeightMap } from '../lib/keywordWeights';
import { analyzeArticleEntity } from '../lib/entityAnalyzer';
import { generateSmartExecutiveDirective, getMediaStrategyPresentation } from '../lib/directiveEngine';
import { clusterNewsArticles, ClusteredEventCard } from '../lib/eventClusteringEngine';
import { EventClusterCard } from './EventClusterCard';
import { useTheme } from '../lib/theme';
import { SourceBrandBadge } from './SourceBrandBadge';
import { calculateRiskScore, isRiskArticle, HIGH_CONFIDENCE_THRESHOLD, calculateBrightSpotScore, isBrightSpotArticle } from '../lib/newsClassification';
import { SentimentScoreBreakdownModal } from './SentimentScoreBreakdownModal';
import { WarningPipelineModelModal } from './WarningPipelineModelModal';
import {
  insertArticleRecordToDb,
  updateArticleRecordInDb,
  deleteArticleRecordFromDb,
  bulkDeleteArticlesFromDb
} from '../services/api';
import {
  saveArticleToArchive,
  updateArticleInArchive,
  deleteArticleFromArchive,
  bulkDeleteArticlesFromArchive
} from '../lib/newsArchiveService';

interface CmsContentTableProps {
  newsItems: ScrapedNewsItem[];
  onDeepDive: (item: ScrapedNewsItem) => void;
  onDraftStatement: (item: ScrapedNewsItem) => void;
  onPolicySubmission?: (item: ScrapedNewsItem) => void;
  onGenerateVideo?: (item: ScrapedNewsItem) => void;
  onGmailAlert?: (item: ScrapedNewsItem) => void;
  onArticleCreated?: (newArticle: ScrapedNewsItem) => void;
  onArticleUpdated?: (updatedArticle: ScrapedNewsItem) => void;
  onArticleDeleted?: (deletedId: string) => void;
  onBulkArticlesDeleted?: (deletedIds: string[]) => void;
  onOpenAiFeedback?: (item: ScrapedNewsItem) => void;
  onOpenAiRules?: () => void;
  onNavigateToFinetune?: () => void;
  keywordWeights: KeywordWeightMap;
  selectedSentiment: SentimentType | 'all';
  onSentimentChange: (sentiment: SentimentType | 'all') => void;
  selectedImpact: ImpactLevel | 'all';
  onImpactChange: (impact: ImpactLevel | 'all') => void;
  selectedSource?: string;
  onSourceChange?: (source: string) => void;
  sortBy: NewsSortOption;
  onSortChange: (sort: NewsSortOption) => void;
  query: string;
  onQueryChange: (q: string) => void;
  densityMode?: ViewDensityMode;
  onDensityModeChange?: (mode: ViewDensityMode) => void;
  showHighConfidenceOnly?: boolean;
  onToggleHighConfidenceOnly?: (active: boolean) => void;
  showHighConfidenceBrightSpotOnly?: boolean;
  onToggleHighConfidenceBrightSpotOnly?: (active: boolean) => void;
  isLoading?: boolean;
  initialHubView?: 'articles' | 'schema_audit' | 'query_builder' | 'db_analytics';
  onArticlesStandardized?: (standardized: ScrapedNewsItem[]) => void;
  onDatabaseResetStart?: () => void;
  onResetDatabase?: () => void;
}

export type CmsHubView = 'articles' | 'schema_audit' | 'query_builder' | 'db_analytics';

// Module-level cache for clustering results to ensure near-instant page loads (<16ms)
const clusteringCache = new Map<string, ClusteredEventCard[]>();
const MAX_CLUSTERING_CACHE_SIZE = 30;

function getClusteringSignature(items: ScrapedNewsItem[], threshold: number): string {
  if (!items || items.length === 0) return 'empty';
  const len = items.length;
  const first = items[0];
  const last = items[len - 1];
  const mid = items[Math.floor(len / 2)];
  return `${len}_${threshold}_${first?.id || first?.url || ''}_${last?.id || last?.url || ''}_${mid?.id || ''}_${first?.publishedTimestamp || 0}_${last?.publishedTimestamp || 0}`;
}

function sortClusteredEvents(clusters: ClusteredEventCard[], sortBy: NewsSortOption): ClusteredEventCard[] {
  return [...clusters].sort((a, b) => {
    const timeA = a.latestPublishedTimestamp || (a.originArticle.publishedTimestamp || 0);
    const timeB = b.latestPublishedTimestamp || (b.originArticle.publishedTimestamp || 0);
    if (sortBy === 'time_desc') {
      if (timeB !== timeA) return timeB - timeA;
      return b.totalArticles - a.totalArticles;
    }
    if (sortBy === 'time_asc') {
      if (timeA !== timeB) return timeA - timeB;
      return a.totalArticles - b.totalArticles;
    }
    if (sortBy === 'buzz_desc') {
      const diff = (b.maxBuzzScore || 0) - (a.maxBuzzScore || 0);
      if (diff !== 0) return diff;
      return timeB - timeA;
    }
    if (sortBy === 'sentiment_desc') {
      const diff = (b.avgSentimentScore || 0) - (a.avgSentimentScore || 0);
      if (diff !== 0) return diff;
      return timeB - timeA;
    }
    if (timeB !== timeA) return timeB - timeA;
    return b.totalArticles - a.totalArticles;
  });
}

export const generateArticleHash = (item: ScrapedNewsItem) => {
  const seed = `${item.url || ''}#${item.title || ''}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256_${hex}${hex.split('').reverse().join('')}`;
};

export const getRawDocumentPayload = (item: ScrapedNewsItem) => {
  return {
    id: item.id,
    title: item.title,
    url: item.url || '',
    source: item.source || 'Báo Đầu Tư',
    sector: item.sector || 'macro',
    sectorNameVi: item.sectorNameVi || 'Kinh tế vĩ mô',
    sentiment: item.sentiment || 'neutral',
    sentimentScore: item.sentimentScore || 0,
    impactLevel: item.impactLevel || 'medium',
    buzzScore: item.buzzScore || 0,
    deduplication_hash: generateArticleHash(item),
    archived_at: item.publishedAt || new Date().toISOString(),
    retention_tier: 'HOT',
    schema_version: '1.2.0',
    firestore_collection: 'scraped_news_archive',
    rag_indexed: true,
    policy_keywords: (item.weightedKeywords || []).map((k) => k.keyword),
  };
};

/**
 * Trích xuất nguồn chính & danh sách các cơ quan báo chí đã chuẩn hóa, loại bỏ trùng lặp
 */
const parseCleanSources = (rawSource: string | undefined): { primarySource: string; allSourcesList: string[] } => {
  if (!rawSource || !rawSource.trim()) {
    return { primarySource: 'Báo chí', allSourcesList: ['Báo chí'] };
  }
  const parts = rawSource
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { primarySource: 'Báo chí', allSourcesList: ['Báo chí'] };
  }

  const seen = new Set<string>();
  const allSourcesList: string[] = [];
  for (const p of parts) {
    const norm = p.replace(/\.(vn|com\.vn|com|org)$/i, '');
    const key = norm.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      allSourcesList.push(p);
    }
  }

  return {
    primarySource: allSourcesList[0] || parts[0] || 'Báo chí',
    allSourcesList: allSourcesList.length > 0 ? allSourcesList : parts,
  };
};

/**
 * Score Gauge Meter: Hiển thị mức độ ưu tiên điều hành (MoF Priority 1-10) rõ ràng, sang trọng
 */
const ScoreGaugeMeter: React.FC<{ score: number; isDark: boolean }> = ({ score, isDark }) => {
  const normalizedScore = Math.max(1, Math.min(10, score || 1));
  const isHigh = normalizedScore >= 7.5;
  const isMed = normalizedScore >= 4.0;

  const levelLabel = isHigh ? 'Ưu tiên Cao' : isMed ? 'Ưu tiên TB' : 'Theo dõi';
  const levelBadgeClass = isHigh
    ? isDark ? 'text-rose-300 bg-rose-950/60 border-rose-800' : 'text-rose-800 bg-rose-100 border-rose-300'
    : isMed
    ? isDark ? 'text-amber-300 bg-amber-950/60 border-amber-800' : 'text-amber-800 bg-amber-100 border-amber-300'
    : isDark ? 'text-slate-300 bg-slate-800/80 border-slate-700' : 'text-slate-700 bg-slate-100 border-slate-300';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ưu tiên:</span>
        <span className={`text-[11px] font-mono font-black px-2 py-0.5 rounded-full border ${levelBadgeClass}`}>
          {normalizedScore.toFixed(1)} <span className="text-[9px] font-normal opacity-80">/10</span>
        </span>
      </div>

      {/* 10 micro-segments */}
      <div className="grid grid-cols-10 gap-0.5 w-full pt-0.5">
        {Array.from({ length: 10 }).map((_, idx) => {
          const active = idx < Math.round(normalizedScore);
          return (
            <div
              key={idx}
              className={`h-1.5 rounded-[1.5px] transition-colors ${
                active
                  ? isHigh
                    ? 'bg-rose-500'
                    : isMed
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                  : isDark
                  ? 'bg-slate-800'
                  : 'bg-slate-200'
              }`}
            />
          );
        })}
      </div>

      <div className="flex justify-between items-center text-[9px] font-medium text-slate-400 leading-none pt-0.5">
        <span className={isHigh ? 'text-rose-500 font-bold' : isMed ? 'text-amber-500 font-bold' : ''}>
          {levelLabel}
        </span>
        <span className="font-mono opacity-70">Thang 1-10</span>
      </div>
    </div>
  );
};

export interface ArticleAiConfidenceInfo {
  confidenceScore: number;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  needsExpertReview: boolean;
  reviewReason?: string;
}

export const calculateArticleAiConfidence = (item: ScrapedNewsItem): ArticleAiConfidenceInfo => {
  const sentimentScore = item.sentimentScore || 0;
  const sentimentAbs = Math.abs(sentimentScore);
  const hasSector = Boolean(item.sector || item.sectorNameVi || (item.agencies && item.agencies.length > 0));
  const hasTickers = Boolean(item.tickers && item.tickers.length > 0);
  const hasValidSummary = Boolean(item.summary && item.summary.trim().length > 30);
  const risk = calculateRiskScore(item);
  const bright = calculateBrightSpotScore(item);

  // Điểm số phân loại tự động của mô hình NLP MoF-LLM
  let score = 78;
  if (hasSector) score += 6;
  if (hasValidSummary) score += 6;
  if (hasTickers) score += 4;
  if (sentimentAbs >= 0.35) score += 6;
  else if (sentimentAbs <= 0.1 && item.sentiment === 'neutral') score -= 14;

  if (risk.isRisk && risk.confidenceScore > 0) {
    score = Math.max(score, risk.confidenceScore);
  } else if (bright.isBrightSpot && bright.confidenceScore > 0) {
    score = Math.max(score, bright.confidenceScore);
  }

  score = Math.min(99, Math.max(45, Math.round(score)));

  const needsExpertReview = score < 75 || (item.sentiment === 'neutral' && (Boolean(item.isUrgent) || (item.buzzScore || 0) >= 60));
  let reviewReason = '';
  if (needsExpertReview) {
    if (item.sentiment === 'neutral' && (item.buzzScore || 0) >= 60) {
      reviewReason = 'Sắc thái trung tính nhưng độ quan tâm dư luận (Buzz) cao - Cần kiểm tra lại ngữ cảnh';
    } else if (item.sentiment === 'neutral') {
      reviewReason = 'Sắc thái tiệm cận biên trung tính - Cần chuyên gia thẩm định';
    } else if (!hasSector) {
      reviewReason = 'Chưa xác định rõ đơn vị chuyên ngành trực thuộc';
    } else {
      reviewReason = 'Độ tin cậy mô hình ở mức trung bình (<75%) - Cần hiệu chỉnh';
    }
  }

  return {
    confidenceScore: score,
    level: score >= 80 ? 'HIGH' : score >= 68 ? 'MEDIUM' : 'LOW',
    needsExpertReview,
    reviewReason,
  };
};

export const CmsContentTable: React.FC<CmsContentTableProps> = ({
  newsItems,
  onDeepDive,
  onDraftStatement,
  onPolicySubmission,
  onGenerateVideo,
  onGmailAlert,
  onArticleCreated,
  onArticleUpdated,
  onArticleDeleted,
  onBulkArticlesDeleted,
  onOpenAiFeedback,
  onOpenAiRules,
  onNavigateToFinetune,
  keywordWeights,
  selectedSentiment,
  onSentimentChange,
  selectedImpact,
  onImpactChange,
  selectedSource: controlledSelectedSource,
  onSourceChange,
  sortBy,
  onSortChange,
  query,
  onQueryChange,
  densityMode: controlledDensityMode,
  onDensityModeChange,
  showHighConfidenceOnly,
  onToggleHighConfidenceOnly,
  showHighConfidenceBrightSpotOnly,
  onToggleHighConfidenceBrightSpotOnly,
  isLoading = false,
  initialHubView = 'articles',
  onArticlesStandardized,
  onDatabaseResetStart,
  onResetDatabase,
}) => {
  const { isDark } = useTheme();
  const [cmsHubView, setCmsHubView] = useState<CmsHubView>(initialHubView || 'articles');
  const [inspectingJsonArticle, setInspectingJsonArticle] = useState<ScrapedNewsItem | null>(null);
  const [copiedJsonSuccess, setCopiedJsonSuccess] = useState(false);
  const [storageTierFilter, setStorageTierFilter] = useState<'all' | 'HOT' | 'WARM' | 'COLD'>('all');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('all');
  const [selectedTimeRangeFilter, setSelectedTimeRangeFilter] = useState<string>('all');

  useEffect(() => {
    if (initialHubView) {
      setCmsHubView(initialHubView);
    }
  }, [initialHubView]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('finpulse_flagged_articles');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('finpulse_flagged_articles', JSON.stringify(Array.from(flaggedIds)));
    } catch {
      // ignore
    }
  }, [flaggedIds]);

  const toggleFlagItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  const [showImpactInfo, setShowImpactInfo] = useState<boolean>(false);
  const [warningPipelineArticle, setWarningPipelineArticle] = useState<ScrapedNewsItem | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jumpPageInput, setJumpPageInput] = useState<string>('1');

  // News Outlet (Đầu báo) Filter State
  const [localSelectedSource, setLocalSelectedSource] = useState<string>('all');
  const selectedSource = controlledSelectedSource !== undefined ? controlledSelectedSource : localSelectedSource;

  const handleSourceChange = (source: string) => {
    if (onSourceChange) {
      onSourceChange(source);
    } else {
      setLocalSelectedSource(source);
    }
    setCurrentPage(1);
  };

  useEffect(() => {
    setJumpPageInput(String(currentPage));
  }, [currentPage]);
  const [localDensityMode, setLocalDensityMode] = useState<ViewDensityMode>(() => {
    try {
      const saved = localStorage.getItem('mof_view_density_mode');
      return (saved as ViewDensityMode) || 'standard';
    } catch {
      return 'standard';
    }
  });

  const densityMode = controlledDensityMode || localDensityMode;

  const handleDensityModeChange = (mode: ViewDensityMode) => {
    if (onDensityModeChange) {
      onDensityModeChange(mode);
    } else {
      setLocalDensityMode(mode);
      try {
        localStorage.setItem('mof_view_density_mode', mode);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const [tableGroupingMode, setTableGroupingMode] = useState<'clusters' | 'flat'>(() => {
    try {
      const saved = localStorage.getItem('mof_table_grouping_mode');
      return saved === 'flat' ? 'flat' : 'clusters';
    } catch {
      return 'clusters';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mof_table_grouping_mode', tableGroupingMode);
    } catch (e) {
      console.error(e);
    }
  }, [tableGroupingMode]);

  const [clusterViewMode, setClusterViewMode] = useState<'table' | 'cards'>(() => {
    try {
      const saved = localStorage.getItem('mof_cluster_view_mode');
      return saved === 'cards' ? 'cards' : 'table';
    } catch {
      return 'table';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mof_cluster_view_mode', clusterViewMode);
    } catch (e) {
      console.error(e);
    }
  }, [clusterViewMode]);

  const [expandedClusterIds, setExpandedClusterIds] = useState<Set<string>>(() => new Set());

  const toggleClusterExpand = (clusterId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedClusterIds((prev) => {
      const next = new Set(prev);
      if (next.has(clusterId)) next.delete(clusterId);
      else next.add(clusterId);
      return next;
    });
  };

  const [isSmartClustering, setIsSmartClustering] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mof_smart_clustering_active');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mof_smart_clustering_active', JSON.stringify(isSmartClustering));
    } catch (e) {
      console.error(e);
    }
  }, [isSmartClustering]);

  const [isAutoTagging, setIsAutoTagging] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mof_auto_tagging_active');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mof_auto_tagging_active', JSON.stringify(isAutoTagging));
    } catch (e) {
      console.error(e);
    }
  }, [isAutoTagging]);

  const itemsPerPage = 15;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [breakdownArticle, setBreakdownArticle] = useState<ScrapedNewsItem | null>(null);

  // CRUD Modal & DB Interaction State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingArticle, setEditingArticle] = useState<ScrapedNewsItem | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<ScrapedNewsItem | null>(null);
  const [isConfirmBulkDeleteOpen, setIsConfirmBulkDeleteOpen] = useState<boolean>(false);
  const [isProcessingDb, setIsProcessingDb] = useState<boolean>(false);
  const [dbNotification, setDbNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Machine Learning & Expert Verification States
  const [verifiedByExpertIds, setVerifiedByExpertIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('finpulse_expert_verified_articles');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [activeRulesCount, setActiveRulesCount] = useState<number>(8);
  const [needsExpertReviewOnly, setNeedsExpertReviewOnly] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/ai-exclusion-rules')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.rules)) {
          setActiveRulesCount(data.rules.length);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // RLHF Noise Labeled IDs State (persisted to localStorage)
  const [rlhfNoiseIds, setRlhfNoiseIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('cms_rlhf_noise_labeled_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // AI Accuracy Filter State
  const [aiAccuracyFilter, setAiAccuracyFilter] = useState<'all' | 'low_confidence' | 'high_confidence' | 'verified_gold' | 'rlhf_noise'>('all');
  const [isAiAccuracyMenuOpen, setIsAiAccuracyMenuOpen] = useState<boolean>(false);

  // Context Menu State for RLHF teaching & quick expert actions
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    article: ScrapedNewsItem | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    article: null,
  });

  const handleOpenContextMenu = (e: React.MouseEvent, article: ScrapedNewsItem) => {
    e.preventDefault();
    e.stopPropagation();
    const clickX = e.clientX;
    const clickY = e.clientY;
    const menuWidth = 290;
    const menuHeight = 360;
    const x = clickX + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 16 : clickX;
    const y = clickY + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 16 : clickY;
    setContextMenu({
      isOpen: true,
      x: Math.max(10, x),
      y: Math.max(10, y),
      article,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ isOpen: false, x: 0, y: 0, article: null });
  };

  const handleLabelAsNoiseRlhf = (article: ScrapedNewsItem) => {
    setRlhfNoiseIds((prev) => {
      const next = new Set(prev);
      const isNowNoise = !next.has(article.id);
      if (isNowNoise) {
        next.add(article.id);
        article.isFakeNewsSuspicious = true;
        article.fakeNewsReason = 'Người dùng báo cáo tin sai lệch / tin rác';
        setDbNotification({
          type: 'success',
          message: `Đã đánh dấu bài viết "${article.title.slice(0, 48)}..." là thông tin sai lệch / tin rác. Hệ thống sẽ tự động lọc bỏ các nguồn tin tương tự.`,
        });
      } else {
        next.delete(article.id);
        setDbNotification({
          type: 'success',
          message: `Đã hoàn tác đánh dấu tin sai lệch cho bài viết "${article.title.slice(0, 48)}...".`,
        });
      }
      try {
        localStorage.setItem('cms_rlhf_noise_labeled_ids', JSON.stringify(Array.from(next)));
      } catch (err) {
        console.error('Failed saving RLHF noise IDs:', err);
      }
      return next;
    });
    handleCloseContextMenu();
  };

  const toggleExpertVerification = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const article = newsItems.find((n) => n.id === id);
    setVerifiedByExpertIds((prev) => {
      const next = new Set(prev);
      const isNowVerified = !next.has(id);
      if (isNowVerified) {
        next.add(id);
        setDbNotification({
          type: 'success',
          message: `Đã duyệt bài viết "${(article?.title || id).slice(0, 48)}..." đạt chuẩn chính xác và đưa vào danh mục tin chuẩn.`,
        });
      } else {
        next.delete(id);
        setDbNotification({
          type: 'success',
          message: `Đã hoàn tác trạng thái duyệt bài viết "${(article?.title || id).slice(0, 48)}...".`,
        });
      }
      try {
        const serialized = JSON.stringify(Array.from(next));
        localStorage.setItem('finpulse_expert_verified_articles', serialized);
        localStorage.setItem('cms_expert_verified_ids', serialized);
      } catch (err) {
        console.error('Failed saving verified articles:', err);
      }
      return next;
    });
  };

  // Form state for Add / Edit
  const [formData, setFormData] = useState({
    title: '',
    source: 'Cổng TTĐT Bộ Tài chính',
    url: '',
    sector: 'all' as SectorType,
    summary: '',
    sentiment: 'neutral' as SentimentType,
    sentimentScore: 0,
    sentimentReason: '',
    impactLevel: 'medium' as ImpactLevel,
    isBrightSpot: false,
    brightSpotReason: '',
    isRisk: false,
    riskReason: '',
    regulatoryTags: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      source: 'Cổng TTĐT Bộ Tài chính',
      url: '',
      sector: 'all',
      summary: '',
      sentiment: 'neutral',
      sentimentScore: 0,
      sentimentReason: '',
      impactLevel: 'medium',
      isBrightSpot: false,
      brightSpotReason: '',
      isRisk: false,
      riskReason: '',
      regulatoryTags: '',
    });
  };

  const toggleTimeSort = () => {
    if (sortBy === 'time_desc') {
      onSortChange('time_asc');
    } else {
      onSortChange('time_desc');
    }
  };

  const handleOpenEditModal = (item: ScrapedNewsItem) => {
    setEditingArticle(item);
    setFormData({
      title: item.title || '',
      source: item.source || 'Cổng TTĐT Bộ Tài chính',
      url: item.url || '',
      sector: item.sector || 'all',
      summary: item.summary || '',
      sentiment: item.sentiment || 'neutral',
      sentimentScore: item.sentimentScore ?? 0,
      sentimentReason: item.sentimentReason || '',
      impactLevel: item.impactLevel || 'medium',
      isBrightSpot: Boolean(item.isBrightSpot),
      brightSpotReason: item.brightSpotReason || '',
      isRisk: Boolean(item.isRisk),
      riskReason: item.riskReason || '',
      regulatoryTags: Array.isArray((item as any).regulatoryTags)
        ? (item as any).regulatoryTags.join(', ')
        : '',
    });
  };

  const handleSaveNewArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setDbNotification({ type: 'error', message: 'Vui lòng nhập tiêu đề bài viết!' });
      return;
    }
    setIsProcessingDb(true);
    try {
      const now = Date.now();
      const newId = `mof-manual-${now}-${Math.random().toString(36).substring(2, 7)}`;
      const regTags = formData.regulatoryTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const newArticle: ScrapedNewsItem = {
        id: newId,
        title: formData.title.trim(),
        source: formData.source.trim() || 'Cổng TTĐT Bộ Tài chính',
        url: formData.url.trim() || `https://mof.gov.vn/webcenter/portal/btcvn`,
        sector: formData.sector,
        sectorNameVi: SECTOR_NAMES[formData.sector] || 'Toàn cảnh',
        summary: formData.summary.trim() || formData.title.trim(),
        keyPoints: [formData.summary.trim() || formData.title.trim()],
        sixW: {
          who: formData.source.trim() || 'Bộ Tài chính',
          doingWhat: formData.title.trim(),
          aboutWhat: SECTOR_NAMES[formData.sector] || 'Điều hành tài chính',
          resultOutcome: formData.summary.trim() || formData.title.trim(),
          whoIsAffected: 'Thị trường tài chính, doanh nghiệp và công chúng',
          reaction: 'Theo dõi sát sao',
          recommendation: 'Duy trì chế độ thông tin chính thống liên tục',
        },
        marketImplication: formData.summary.trim() || formData.title.trim(),
        tickers: [],
        buzzScore: 50,
        sentiment: formData.sentiment,
        sentimentScore: Number(formData.sentimentScore) || 0,
        sentimentReason: formData.sentimentReason.trim(),
        impactLevel: formData.impactLevel,
        isBrightSpot: formData.isBrightSpot,
        brightSpotReason: formData.brightSpotReason.trim(),
        isRisk: formData.isRisk,
        riskReason: formData.riskReason.trim(),
        publishedAt: new Date(now).toISOString(),
        publishedTimestamp: now,
        timeAgo: 'Vừa xong',
        isManualEntry: true,
      };
      (newArticle as any).regulatoryTags = regTags;

      // 1. Direct Server DB Insert
      await insertArticleRecordToDb(newArticle);

      // 2. Direct Cloud Firestore / Local Archive Save
      await saveArticleToArchive(newArticle);

      // 3. Callback to App.tsx
      if (onArticleCreated) {
        onArticleCreated(newArticle);
      }

      setIsAddModalOpen(false);
      resetForm();
      setDbNotification({
        type: 'success',
        message: `Đã thêm thành công bài viết vào Cơ sở dữ liệu: "${newArticle.title.slice(0, 45)}..."`,
      });
      setTimeout(() => setDbNotification(null), 4000);
    } catch (err: any) {
      console.error('Error creating article:', err);
      setDbNotification({
        type: 'error',
        message: `Lỗi khi lưu vào cơ sở dữ liệu: ${err?.message || 'Không thể kết nối CSDL'}`,
      });
    } finally {
      setIsProcessingDb(false);
    }
  };

  const handleSaveEditedArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;
    if (!formData.title.trim()) {
      setDbNotification({ type: 'error', message: 'Vui lòng nhập tiêu đề bài viết!' });
      return;
    }
    setIsProcessingDb(true);
    try {
      const regTags = formData.regulatoryTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const updatedArticle: ScrapedNewsItem = {
        ...editingArticle,
        title: formData.title.trim(),
        source: formData.source.trim(),
        url: formData.url.trim() || editingArticle.url,
        sector: formData.sector,
        summary: formData.summary.trim() || formData.title.trim(),
        sentiment: formData.sentiment,
        sentimentScore: Number(formData.sentimentScore) || 0,
        sentimentReason: formData.sentimentReason.trim(),
        impactLevel: formData.impactLevel,
        isBrightSpot: formData.isBrightSpot,
        brightSpotReason: formData.brightSpotReason.trim(),
        isRisk: formData.isRisk,
        riskReason: formData.riskReason.trim(),
      };
      (updatedArticle as any).regulatoryTags = regTags;

      // 1. Direct Server DB Update
      await updateArticleRecordInDb(editingArticle.id, updatedArticle);

      // 2. Direct Cloud Firestore / Local Archive Update
      await updateArticleInArchive(editingArticle.id, updatedArticle);

      // 3. Callback to App.tsx
      if (onArticleUpdated) {
        onArticleUpdated(updatedArticle);
      }

      setEditingArticle(null);
      setDbNotification({
        type: 'success',
        message: `Đã cập nhật bài viết trong Cơ sở dữ liệu: "${updatedArticle.title.slice(0, 45)}..."`,
      });
      setTimeout(() => setDbNotification(null), 4000);
    } catch (err: any) {
      console.error('Error updating article:', err);
      setDbNotification({
        type: 'error',
        message: `Lỗi khi cập nhật cơ sở dữ liệu: ${err?.message || 'Không thể kết nối CSDL'}`,
      });
    } finally {
      setIsProcessingDb(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingArticle) return;
    setIsProcessingDb(true);
    const targetId = deletingArticle.id;
    const targetTitle = deletingArticle.title;
    try {
      // 1. Direct Server DB Delete and Cloud Firestore / Local Archive Delete in Parallel
      await Promise.all([
        deleteArticleRecordFromDb(targetId),
        deleteArticleFromArchive(targetId)
      ]);

      // 2. Callback to App.tsx
      if (onArticleDeleted) {
        onArticleDeleted(targetId);
      }

      setDeletingArticle(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });

      setDbNotification({
        type: 'success',
        message: `Đã xóa bài viết khỏi Cơ sở dữ liệu: "${targetTitle.slice(0, 45)}..."`,
      });
      setTimeout(() => setDbNotification(null), 4000);
    } catch (err: any) {
      console.error('Error deleting article:', err);
      setDbNotification({
        type: 'error',
        message: `Lỗi xóa bài viết: ${err?.message || 'Không thể kết nối CSDL'}`,
      });
    } finally {
      setIsProcessingDb(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsProcessingDb(true);
    const idsToDelete = Array.from(selectedIds);
    try {
      // 1. Direct Server DB Bulk Delete
      await bulkDeleteArticlesFromDb(idsToDelete);

      // 2. Direct Cloud Firestore Bulk Delete
      await bulkDeleteArticlesFromArchive(idsToDelete);

      // 3. Callback to App.tsx
      if (onBulkArticlesDeleted) {
        onBulkArticlesDeleted(idsToDelete);
      }

      setSelectedIds(new Set());
      setIsConfirmBulkDeleteOpen(false);

      setDbNotification({
        type: 'success',
        message: `Đã xóa thành công ${idsToDelete.length} bài viết khỏi Cơ sở dữ liệu!`,
      });
      setTimeout(() => setDbNotification(null), 4000);
    } catch (err: any) {
      console.error('Error bulk deleting articles:', err);
      setDbNotification({
        type: 'error',
        message: `Lỗi khi xóa hàng loạt: ${err?.message || 'Không thể kết nối CSDL'}`,
      });
    } finally {
      setIsProcessingDb(false);
    }
  };

  const handleShareArticle = async (item: ScrapedNewsItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `[ĐIỀU HÀNH TÀI CHÍNH - BÁO CÁO NHANH]
📌 Tiêu đề: ${item.title}
📝 Tóm tắt: ${item.summary || 'Không có tóm tắt'}
🔗 Link gốc: ${item.url || 'N/A'}
⏱ Thời gian: ${item.timeAgo || 'Gần đây'} | Nguồn: ${item.source || 'Chính thống'}`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const renderPolicySensitivityTag = (item: ScrapedNewsItem) => {
    if (!isAutoTagging) return null;
    const analysis = analyzeArticleEntity(item.title, item.summary, item.weightedKeywords);
    if (analysis.isPolicySensitive) {
      const firstTag = analysis.policyTags[0] || 'chính sách';
      const formattedTag = firstTag.charAt(0).toUpperCase() + firstTag.slice(1);
      return (
        <span
          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 border ${
            isDark
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              : 'bg-amber-50 text-amber-900 border-amber-300'
          }`}
          title={analysis.sensitivityReason}
        >
          <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" />
          <span>Nhạy cảm: {formattedTag}</span>
        </span>
      );
    } else {
      return (
        <span
          className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 border ${
            isDark
              ? 'bg-slate-800 text-slate-400 border-slate-700/60'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
          title="Tin tức tiêu chuẩn, không thuộc danh mục nhạy cảm đặc biệt"
        >
          <Tag className="w-3 h-3 text-slate-400 shrink-0" />
          <span>Tiêu chuẩn</span>
        </span>
      );
    }
  };

  const renderHighlightedText = (text: string, searchQuery: string) => {
    const decodedText = decodeHtmlEntities(text || '');
    if (!searchQuery || !searchQuery.trim()) return decodedText;
    const cleanQuery = searchQuery.startsWith('-') ? searchQuery.slice(1).trim() : searchQuery.trim();
    if (!cleanQuery) return decodedText;

    try {
      const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      const parts = decodedText.split(regex);
      return parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className={`font-semibold px-0.5 rounded border ${
              isDark
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30'
                : 'bg-emerald-100 text-emerald-950 border-emerald-300'
            }`}
          >
            {part}
          </mark>
        ) : (
          part
        )
      );
    } catch {
      return decodedText;
    }
  };

  // Toggle selection state for individual item
  const toggleSelectItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleMarkReviewed = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(reviewedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setReviewedIds(next);
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(bookmarkedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setBookmarkedIds(next);
  };

  // State for expanding advanced filters panel
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState<boolean>(false);

  // Local high confidence risk state fallback if not controlled
  const [localHighConfidenceOnly, setLocalHighConfidenceOnly] = useState<boolean>(false);
  const isHighConfidenceActive = showHighConfidenceOnly !== undefined ? showHighConfidenceOnly : localHighConfidenceOnly;
  const handleToggleHighConfidence = () => {
    const next = !isHighConfidenceActive;
    if (onToggleHighConfidenceOnly) {
      onToggleHighConfidenceOnly(next);
    } else {
      setLocalHighConfidenceOnly(next);
    }
    if (next && isHighConfidenceBrightSpotActive) {
      if (onToggleHighConfidenceBrightSpotOnly) onToggleHighConfidenceBrightSpotOnly(false);
      else setLocalHighConfidenceBrightSpotOnly(false);
    }
  };

  // Local high confidence bright spot state fallback if not controlled
  const [localHighConfidenceBrightSpotOnly, setLocalHighConfidenceBrightSpotOnly] = useState<boolean>(false);
  const isHighConfidenceBrightSpotActive = showHighConfidenceBrightSpotOnly !== undefined ? showHighConfidenceBrightSpotOnly : localHighConfidenceBrightSpotOnly;
  const handleToggleHighConfidenceBrightSpot = () => {
    const next = !isHighConfidenceBrightSpotActive;
    if (onToggleHighConfidenceBrightSpotOnly) {
      onToggleHighConfidenceBrightSpotOnly(next);
    } else {
      setLocalHighConfidenceBrightSpotOnly(next);
    }
    if (next && isHighConfidenceActive) {
      if (onToggleHighConfidenceOnly) onToggleHighConfidenceOnly(false);
      else setLocalHighConfidenceOnly(false);
    }
  };

  const totalRiskCount = useMemo(() => {
    return newsItems.filter(item => isRiskArticle(item)).length;
  }, [newsItems]);

  const highConfidenceCount = useMemo(() => {
    return newsItems.filter(item => isRiskArticle(item, { requireHighConfidence: true })).length;
  }, [newsItems]);

  const totalBrightSpotCount = useMemo(() => {
    return newsItems.filter(item => isBrightSpotArticle(item)).length;
  }, [newsItems]);

  const highConfidenceBrightSpotCount = useMemo(() => {
    return newsItems.filter(item => isBrightSpotArticle(item, { requireHighConfidence: true })).length;
  }, [newsItems]);

  // Hàng đợi Học máy & Đánh giá độ tin cậy AI
  const needsExpertReviewItemsCount = useMemo(() => {
    return newsItems.filter(item => {
      if (verifiedByExpertIds.has(item.id)) return false;
      const conf = calculateArticleAiConfidence(item);
      return conf.needsExpertReview;
    }).length;
  }, [newsItems, verifiedByExpertIds]);

  const avgAiConfidenceScore = useMemo(() => {
    if (newsItems.length === 0) return 92;
    const total = newsItems.reduce((acc, item) => acc + calculateArticleAiConfidence(item).confidenceScore, 0);
    return Math.round(total / newsItems.length);
  }, [newsItems]);

  // Dynamic news outlet (đầu báo) list with counts
  const availableSources = useMemo(() => {
    const sourceCountMap = new Map<string, number>();
    newsItems.forEach((item) => {
      const raw = (item.source || 'Khác').trim();
      if (raw) {
        sourceCountMap.set(raw, (sourceCountMap.get(raw) || 0) + 1);
      }
    });

    return Array.from(sourceCountMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));
  }, [newsItems]);

  const [selectedActionTypeFilter, setSelectedActionTypeFilter] = useState<string>('all');

  const displayedItems = useMemo(() => {
    let list = newsItems;
    if (selectedSource && selectedSource !== 'all') {
      const target = selectedSource.trim().toLowerCase();
      list = list.filter((item) => {
        const s = (item.source || '').trim().toLowerCase();
        return s === target || s.includes(target) || target.includes(s);
      });
    }
    if (selectedActionTypeFilter !== 'all') {
      list = list.filter((item) => {
        const dirInfo = resolveDirectiveActionType(item);
        return dirInfo.actionType === selectedActionTypeFilter;
      });
    }
    if (isHighConfidenceActive) {
      list = list.filter(item => isRiskArticle(item, { requireHighConfidence: true }));
    }
    if (isHighConfidenceBrightSpotActive) {
      list = list.filter(item => isBrightSpotArticle(item, { requireHighConfidence: true }));
    }
    if (needsExpertReviewOnly || aiAccuracyFilter === 'low_confidence') {
      list = list.filter(item => {
        if (verifiedByExpertIds.has(item.id)) return false;
        const conf = calculateArticleAiConfidence(item);
        return conf.needsExpertReview || conf.confidenceScore < 75;
      });
    } else if (aiAccuracyFilter === 'high_confidence') {
      list = list.filter(item => {
        const conf = calculateArticleAiConfidence(item);
        return !conf.needsExpertReview && conf.confidenceScore >= 75;
      });
    } else if (aiAccuracyFilter === 'verified_gold') {
      list = list.filter(item => verifiedByExpertIds.has(item.id));
    } else if (aiAccuracyFilter === 'rlhf_noise') {
      list = list.filter(item => rlhfNoiseIds.has(item.id) || item.isFakeNewsSuspicious);
    }
    if (selectedSectorFilter && selectedSectorFilter !== 'all') {
      const targetSec = selectedSectorFilter.trim().toLowerCase();
      list = list.filter((item) => {
        const secCode = (item.sector || '').toLowerCase();
        const secName = (item.sectorNameVi || '').toLowerCase();
        return secCode === targetSec || secName.includes(targetSec) || targetSec.includes(secCode);
      });
    }
    if (selectedTimeRangeFilter && selectedTimeRangeFilter !== 'all') {
      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;
      const ONE_DAY = 24 * ONE_HOUR;
      list = list.filter((item) => {
        const itemTime = item.publishedTimestamp || (item.publishedAt ? new Date(item.publishedAt).getTime() : now);
        const age = Math.abs(now - itemTime);
        if (selectedTimeRangeFilter === '24h') return age <= ONE_DAY;
        if (selectedTimeRangeFilter === '3d') return age <= 3 * ONE_DAY;
        if (selectedTimeRangeFilter === '7d') return age <= 7 * ONE_DAY;
        if (selectedTimeRangeFilter === '30d') return age <= 30 * ONE_DAY;
        return true;
      });
    }
    if (storageTierFilter !== 'all') {
      const now = Date.now();
      const ONE_DAY = 24 * 60 * 60 * 1000;
      const SEVEN_DAYS = 7 * ONE_DAY;
      list = list.filter((item) => {
        const itemTime = item.publishedTimestamp || (item.publishedAt ? new Date(item.publishedAt).getTime() : now);
        const age = Math.abs(now - itemTime);
        if (storageTierFilter === 'HOT') return age <= ONE_DAY;
        if (storageTierFilter === 'WARM') return age > ONE_DAY && age <= SEVEN_DAYS;
        if (storageTierFilter === 'COLD') return age > SEVEN_DAYS;
        return true;
      });
    }
    return list;
  }, [newsItems, selectedSource, selectedSectorFilter, selectedTimeRangeFilter, isHighConfidenceActive, isHighConfidenceBrightSpotActive, needsExpertReviewOnly, aiAccuracyFilter, verifiedByExpertIds, rlhfNoiseIds, storageTierFilter]);

  const lastComputedClustersRef = useRef<ClusteredEventCard[]>([]);

  // Tự động gom nhóm các bài báo có cùng nội dung / trùng lặp thành Cụm tin (News Clusters)
  // Tối ưu bộ đệm (Caching) và Hoãn gom cụm (Deferred Clustering) khi đang quét tin để trang tải siêu tốc (<16ms)
  const eventClusters = useMemo(() => {
    // 1. Nếu người dùng đang xem danh sách phẳng (flat), tiết kiệm 100% chi phí tính toán
    if (tableGroupingMode !== 'clusters') {
      return [];
    }

    if (!displayedItems || displayedItems.length === 0) {
      lastComputedClustersRef.current = [];
      return [];
    }

    const signature = getClusteringSignature(displayedItems, 70);

    // 2. Tra cứu Bộ đệm (Clustering Cache)
    if (clusteringCache.has(signature)) {
      const cached = clusteringCache.get(signature)!;
      lastComputedClustersRef.current = cached;
      return sortClusteredEvents(cached, sortBy);
    }

    // 3. Hoãn gom cụm khi đang quét tin (Deferred Clustering during live scan)
    // Nếu hệ thống đang quét dữ liệu ngầm và đã có cụm tin tính toán trước đó, tái sử dụng ngay để không gây giật lag
    if (isLoading && lastComputedClustersRef.current.length > 0) {
      return sortClusteredEvents(lastComputedClustersRef.current, sortBy);
    }

    // 4. Tính toán gom cụm (Khi không quét tin hoặc chuyển sang bộ dữ liệu mới)
    const rawClusters = clusterNewsArticles(displayedItems, 70);

    // Lưu vào bộ đệm cache
    if (clusteringCache.size >= MAX_CLUSTERING_CACHE_SIZE) {
      const firstKey = clusteringCache.keys().next().value;
      if (firstKey) clusteringCache.delete(firstKey);
    }
    clusteringCache.set(signature, rawClusters);
    lastComputedClustersRef.current = rawClusters;

    return sortClusteredEvents(rawClusters, sortBy);
  }, [displayedItems, sortBy, tableGroupingMode, isLoading]);

  // Pagination logic
  const totalItemsCount = tableGroupingMode === 'clusters' ? eventClusters.length : displayedItems.length;
  const totalPages = Math.ceil(totalItemsCount / itemsPerPage) || 1;

  const paginatedClusters = useMemo(() => {
    if (tableGroupingMode !== 'clusters') return [];
    const start = (currentPage - 1) * itemsPerPage;
    return eventClusters.slice(start, start + itemsPerPage);
  }, [eventClusters, tableGroupingMode, currentPage, itemsPerPage]);

  const paginatedItems = useMemo(() => {
    if (tableGroupingMode === 'clusters') return [];
    const start = (currentPage - 1) * itemsPerPage;
    return displayedItems.slice(start, start + itemsPerPage);
  }, [displayedItems, tableGroupingMode, currentPage, itemsPerPage]);

  const handleExpandAllClusters = () => {
    const allIds = new Set(eventClusters.filter((c) => c.echoArticles.length > 0).map((c) => c.id));
    setExpandedClusterIds(allIds);
  };

  const handleCollapseAllClusters = () => {
    setExpandedClusterIds(new Set());
  };

  // List of all article IDs visible on the current page (including echo articles in cluster mode)
  const currentPageArticleIds = useMemo(() => {
    if (tableGroupingMode === 'clusters') {
      return paginatedClusters.flatMap((c) => [c.originArticle.id, ...c.echoArticles.map((e) => e.article.id)]);
    }
    return paginatedItems.map((item) => item.id);
  }, [tableGroupingMode, paginatedClusters, paginatedItems]);

  const selectedOnPageCount = useMemo(() => {
    return currentPageArticleIds.filter((id) => selectedIds.has(id)).length;
  }, [currentPageArticleIds, selectedIds]);

  const isAllSelectedOnPage = currentPageArticleIds.length > 0 && selectedOnPageCount === currentPageArticleIds.length;
  const isIndeterminateOnPage = selectedOnPageCount > 0 && selectedOnPageCount < currentPageArticleIds.length;

  // Toggle selection for bulk actions
  const toggleSelectAll = () => {
    if (isAllSelectedOnPage) {
      // Deselect all on current page
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentPageArticleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      // Select all on current page
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentPageArticleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  // Bulk Flag action
  const handleBulkFlag = () => {
    if (selectedIds.size === 0) return;
    const allAlreadyFlagged = Array.from(selectedIds).every((id) => flaggedIds.has(id));
    const next = new Set(flaggedIds);
    if (allAlreadyFlagged) {
      selectedIds.forEach((id) => next.delete(id));
      setDbNotification({
        type: 'success',
        message: `Đã bỏ gắn cờ cho ${selectedIds.size} bài viết đã chọn.`
      });
    } else {
      selectedIds.forEach((id) => next.add(id));
      setDbNotification({
        type: 'success',
        message: `Đã gắn cờ cảnh báo / theo dõi cho ${selectedIds.size} bài viết đã chọn.`
      });
    }
    setFlaggedIds(next);
    setTimeout(() => setDbNotification(null), 3500);
  };

  // Bulk Export action (CSV / JSON)
  const handleBulkExport = (format: 'csv' | 'json' = 'csv') => {
    if (selectedIds.size === 0) return;

    const allArticlesMap = new Map<string, ScrapedNewsItem>();
    newsItems.forEach((item) => allArticlesMap.set(item.id, item));
    eventClusters.forEach((c) => {
      allArticlesMap.set(c.originArticle.id, c.originArticle);
      c.echoArticles.forEach((e) => allArticlesMap.set(e.article.id, e.article));
    });

    const selectedArticles = Array.from(selectedIds)
      .map((id) => allArticlesMap.get(id))
      .filter((a): a is ScrapedNewsItem => Boolean(a));

    if (selectedArticles.length === 0) return;

    const dateStr = new Date().toISOString().slice(0, 10);
    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(selectedArticles, null, 2));
      const a = document.createElement('a');
      a.href = dataStr;
      a.download = `finpulse_selected_articles_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      const headers = ['ID', 'Tiêu đề', 'Nguồn tin', 'Thời gian đăng', 'Lĩnh vực', 'Sắc thái', 'Điểm sắc thái', 'Tác động', 'Tóm tắt', 'URL'];
      const escapeCsv = (str: any) => {
        const s = String(str || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
        return `"${s}"`;
      };
      const rows = selectedArticles.map((a) => [
        escapeCsv(a.id),
        escapeCsv(a.title),
        escapeCsv(a.source),
        escapeCsv(a.publishedAt),
        escapeCsv(a.sectorNameVi || a.sector || 'Bộ Tài chính'),
        escapeCsv(a.sentiment || 'neutral'),
        escapeCsv(a.sentimentScore || 0),
        escapeCsv(a.impactLevel || 'LOW'),
        escapeCsv(a.summary || a.snippet || ''),
        escapeCsv(a.url || '')
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finpulse_selected_articles_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    setDbNotification({
      type: 'success',
      message: `Đã xuất thành công ${selectedArticles.length} bài viết sang định dạng .${format.toUpperCase()}!`
    });
    setTimeout(() => setDbNotification(null), 3500);
  };

  const hasActiveFilters = Boolean(
    (selectedSource && selectedSource !== 'all') ||
    selectedSectorFilter !== 'all' ||
    selectedTimeRangeFilter !== 'all' ||
    selectedSentiment !== 'all' ||
    selectedImpact !== 'all' ||
    storageTierFilter !== 'all' ||
    isHighConfidenceActive ||
    isHighConfidenceBrightSpotActive ||
    needsExpertReviewOnly ||
    (query && query.trim() !== '')
  );

  const handleResetAllFilters = () => {
    handleSourceChange('all');
    setSelectedSectorFilter('all');
    setSelectedTimeRangeFilter('all');
    onSentimentChange('all');
    onImpactChange('all');
    setStorageTierFilter('all');
    setNeedsExpertReviewOnly(false);
    if (onToggleHighConfidenceOnly) onToggleHighConfidenceOnly(false);
    else setLocalHighConfidenceOnly(false);
    if (onToggleHighConfidenceBrightSpotOnly) onToggleHighConfidenceBrightSpotOnly(false);
    else setLocalHighConfidenceBrightSpotOnly(false);
    onQueryChange('');
  };

  return (
    <div className="space-y-4">
      {/* HEADER GỌN GÀNG, TRANG NHÃ PHÙ HỢP LÃNH ĐẠO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Quản Lý & Điều Hành Điểm Tin
          </h1>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isDark ? 'bg-slate-800/80 border-slate-700/80 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-700'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <span>Trực tuyến thời gian thực</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 self-start sm:self-auto">
          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
          <span>Sẵn sàng phân tích &amp; điều hành</span>
        </div>
      </div>

      {/* HÀNG TABS & TỔNG DỮ LIỆU */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className={`inline-flex items-center p-1 rounded-xl border overflow-x-auto no-scrollbar ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-300'
        }`}>
          <button
            type="button"
            onClick={() => setCmsHubView('articles')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
              cmsHubView === 'articles'
                ? isDark 
                  ? 'bg-slate-800 text-white shadow-xs border-b-2 border-emerald-500' 
                  : 'bg-white text-slate-900 shadow-xs border-b-2 border-emerald-500'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bảng Quản Lý
          </button>
          <button
            type="button"
            onClick={() => setCmsHubView('schema_audit')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
              cmsHubView === 'schema_audit'
                ? isDark 
                  ? 'bg-slate-800 text-white shadow-xs border-b-2 border-emerald-500' 
                  : 'bg-white text-slate-900 shadow-xs border-b-2 border-emerald-500'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chuẩn Hóa
          </button>
          <button
            type="button"
            onClick={() => setCmsHubView('query_builder')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
              cmsHubView === 'query_builder'
                ? isDark 
                  ? 'bg-slate-800 text-white shadow-xs border-b-2 border-emerald-500' 
                  : 'bg-white text-slate-900 shadow-xs border-b-2 border-emerald-500'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Truy Vấn Cấu Trúc
          </button>
          <button
            type="button"
            onClick={() => setCmsHubView('db_analytics')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
              cmsHubView === 'db_analytics'
                ? isDark 
                  ? 'bg-slate-800 text-white shadow-xs border-b-2 border-emerald-500' 
                  : 'bg-white text-slate-900 shadow-xs border-b-2 border-emerald-500'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Phân Tích Phân Bổ
          </button>
        </div>

        <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>TỔNG DỮ LIỆU: {newsItems.length} BẢN GHI</span>
        </div>
      </div>

      {/* VIEW: SCHEMA AUDIT REPORT */}
      {cmsHubView === 'schema_audit' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCmsHubView('articles')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Quay Lại Bảng Quản Lý Bài Viết</span>
            </button>
            <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Trung Tâm Kiểm Định & Chuẩn Hóa Dữ Liệu Toàn Diện (Khử Trùng Lặp 3 Lớp & Bóc Tách Google News)
            </span>
          </div>
          <DatabaseAuditReport
            articles={newsItems}
            onArticlesStandardized={onArticlesStandardized}
            onClose={() => setCmsHubView('articles')}
          />
        </div>
      )}

      {/* VIEW: STRUCTURED QUERY BUILDER */}
      {cmsHubView === 'query_builder' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCmsHubView('articles')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Quay Lại Bảng Quản Lý Bài Viết</span>
            </button>
            <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
              <SlidersHorizontal className="w-4 h-4" />
              Truy vấn cấu trúc với thời gian thực thi (Latency ms) & JSON AST
            </span>
          </div>
          <NewsDatabaseExplorer
            initialArticles={newsItems}
            defaultTab="query_builder"
            hideHeroBanner={true}
            onSelectArticleDeepDive={(art) => onDeepDive(art)}
            onDatabaseResetStart={onDatabaseResetStart}
            onResetDatabase={onResetDatabase}
          />
        </div>
      )}

      {/* VIEW: DATABASE ANALYTICS DASHBOARD */}
      {cmsHubView === 'db_analytics' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCmsHubView('articles')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Quay Lại Bảng Quản Lý Bài Viết</span>
            </button>
            <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              Thống kê phân bổ theo nguồn, sắc thái và độ nóng
            </span>
          </div>
          <NewsDatabaseExplorer
            initialArticles={newsItems}
            defaultTab="analytics"
            hideHeroBanner={true}
            onSelectArticleDeepDive={(art) => onDeepDive(art)}
            onDatabaseResetStart={onDatabaseResetStart}
            onResetDatabase={onResetDatabase}
          />
        </div>
      )}

      {/* VIEW: MAIN ARTICLES & DATABASE MANAGEMENT TABLE */}
      {cmsHubView === 'articles' && (
        <div className={`rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
      
      {/* CMS Mission Control Toolbar & Multi-tier Filter Bar */}
      <div className={`p-4 rounded-2xl border space-y-3.5 transition-colors ${
        isDark ? 'bg-slate-900/95 border-slate-800 shadow-sm' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* HÀNG 1 THEO THIẾT KẾ: Tìm kiếm + Chế độ hiển thị (TL;DR / Chuẩn / 6W) + Nút THÊM BÀI VIẾT MỚI */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Ô Tìm kiếm chính */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`} />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Tìm kiếm tiêu đề, trích đoạn, đầu báo (VD: CafeF), từ khóa, -loại_trừ..."
              className={`w-full border rounded-xl pl-9 pr-9 h-10 text-xs transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-slate-200 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Cụm Chuyển Đổi Mật Độ & Nút Thêm Mới */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Bộ 3 nút Chế độ Mật độ: TL;DR | Chuẩn | 6W */}
            <div className={`flex items-center p-1 rounded-xl border h-10 shrink-0 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => handleDensityModeChange('executive')}
                className={`px-3 h-8 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  densityMode === 'executive'
                    ? isDark
                      ? 'bg-slate-800 text-amber-400 font-black shadow-xs border border-slate-700'
                      : 'bg-white text-amber-600 font-black shadow-xs border border-slate-200'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Chế độ Lãnh đạo (Executive Mode): Chỉ hiển thị tiêu đề báo chí và TL;DR"
              >
                <Zap className={`w-3.5 h-3.5 ${densityMode === 'executive' ? 'fill-current' : 'text-amber-500'}`} />
                <span>TL;DR</span>
              </button>
              <button
                type="button"
                onClick={() => handleDensityModeChange('standard')}
                className={`px-3 h-8 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  densityMode === 'standard'
                    ? isDark
                      ? 'bg-slate-800 text-white font-bold shadow-xs border border-slate-700'
                      : 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Chế độ Chuẩn (Standard Mode): Cân bằng thông tin, bảng chuẩn quản trị CMS"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
                <span>Chuẩn</span>
              </button>
              <button
                type="button"
                onClick={() => handleDensityModeChange('deep')}
                className={`px-3 h-8 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  densityMode === 'deep'
                    ? isDark
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-indigo-600 text-white font-bold shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Chế độ Chuyên sâu (Deep-Dive Mode): Đầy đủ phân tích truyền thông 6W"
              >
                <Eye className={`w-3.5 h-3.5 ${densityMode === 'deep' ? 'text-white' : 'text-indigo-400'}`} />
                <span>6W</span>
              </button>
            </div>

            {/* Nút + THÊM BÀI VIẾT MỚI (Màu xanh lá theo thiết kế) */}
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 shrink-0"
              title="Thêm bài viết mới và lưu trực tiếp vào Firestore"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>+ THÊM BÀI VIẾT MỚI</span>
            </button>
          </div>
        </div>

        {/* HÀNG 2 THEO THIẾT KẾ: CÁC DROPDOWN BỘ LỌC + LỌC NÂNG CAO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 text-xs">
          {/* Nhóm Dropdowns: Nguồn | Đơn vị | Thời gian | Sắc thái | Tác động | Sắp xếp */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Dropdown Nguồn Tin */}
            <div className={`flex items-center gap-1.5 border rounded-xl px-3 h-9 ${
              selectedSource !== 'all'
                ? isDark ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/40' : 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-400/40'
                : isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <Filter className={`w-3.5 h-3.5 shrink-0 ${
                selectedSource !== 'all' ? 'text-emerald-400' : 'text-slate-400'
              }`} />
              <select
                value={selectedSource}
                onChange={(e) => handleSourceChange(e.target.value)}
                className="bg-transparent text-xs focus:outline-none cursor-pointer font-bold uppercase tracking-wider max-w-[130px] sm:max-w-[150px] truncate"
                title="Lọc theo đầu báo"
              >
                <option value="all" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>
                  TẤT CẢ NGUỒN ({newsItems.length})
                </option>
                {availableSources.map((s) => (
                  <option
                    key={s.source}
                    value={s.source}
                    className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}
                  >
                    {s.source.toUpperCase()} ({s.count})
                  </option>
                ))}
              </select>
              {selectedSource !== 'all' && (
                <button
                  type="button"
                  onClick={() => handleSourceChange('all')}
                  className="p-0.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-slate-200 cursor-pointer"
                  title="Xóa bộ lọc đầu báo"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Dropdown Theo Đơn Vị (Sector / Agency) */}
            <div className={`flex items-center gap-1.5 border rounded-xl px-3 h-9 ${
              selectedSectorFilter !== 'all'
                ? isDark ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/40' : 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-1 ring-indigo-400/40'
                : isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <Building2 className={`w-3.5 h-3.5 shrink-0 ${
                selectedSectorFilter !== 'all' ? 'text-indigo-400' : 'text-slate-400'
              }`} />
              <select
                value={selectedSectorFilter}
                onChange={(e) => {
                  setSelectedSectorFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs focus:outline-none cursor-pointer font-bold uppercase tracking-wider max-w-[130px] sm:max-w-[150px] truncate"
                title="Lọc theo đơn vị quản lý chuyên ngành"
              >
                <option value="all" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>THEO ĐƠN VỊ</option>
                <option value="tax" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>Thuế & Hải quan</option>
                <option value="stock" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>Chứng khoán & TTCK</option>
                <option value="budget" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>Ngân sách Nhà nước</option>
                <option value="debt" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>Quản lý Nợ công</option>
                <option value="price" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>Quản lý Giá</option>
                <option value="macro" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>Kinh tế Vĩ mô</option>
              </select>
              {selectedSectorFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedSectorFilter('all')}
                  className="p-0.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-slate-200 cursor-pointer"
                  title="Xóa bộ lọc đơn vị"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Dropdown Khoảng Thời Gian */}
            <div className={`flex items-center gap-1.5 border rounded-xl px-3 h-9 ${
              selectedTimeRangeFilter !== 'all'
                ? isDark ? 'bg-sky-950/60 border-sky-500 text-sky-200 ring-1 ring-sky-500/40' : 'bg-sky-50 border-sky-400 text-sky-950 ring-1 ring-sky-400/40'
                : isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <Clock className={`w-3.5 h-3.5 shrink-0 ${
                selectedTimeRangeFilter !== 'all' ? 'text-sky-400' : 'text-slate-400'
              }`} />
              <select
                value={selectedTimeRangeFilter}
                onChange={(e) => {
                  setSelectedTimeRangeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs focus:outline-none cursor-pointer font-bold uppercase tracking-wider max-w-[130px] sm:max-w-[150px] truncate"
                title="Lọc theo khoảng thời gian"
              >
                <option value="all" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>KHOẢNG THỜI GIAN</option>
                <option value="24h" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>24 giờ qua</option>
                <option value="3d" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>3 ngày qua</option>
                <option value="7d" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>7 ngày qua</option>
                <option value="30d" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>30 ngày qua</option>
              </select>
              {selectedTimeRangeFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedTimeRangeFilter('all')}
                  className="p-0.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-slate-200 cursor-pointer"
                  title="Xóa bộ lọc thời gian"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Dropdown Sắc thái */}
            <div className={`flex items-center gap-1.5 border rounded-xl px-3 h-9 ${
              selectedSentiment !== 'all'
                ? isDark ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200' : 'bg-indigo-50 border-indigo-300 text-indigo-950'
                : isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <Newspaper className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedSentiment}
                onChange={(e) => onSentimentChange(e.target.value as SentimentType | 'all')}
                className="bg-transparent text-xs focus:outline-none cursor-pointer font-bold uppercase tracking-wider"
              >
                <option value="all" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>SẮC THÁI: TẤT CẢ</option>
                <option value="bullish" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>🟢 TÍCH CỰC</option>
                <option value="bearish" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>🔴 TIÊU CỰC</option>
                <option value="neutral" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>⚪ TRUNG TÍNH</option>
              </select>
            </div>

            {/* Dropdown Tác động */}
            <div className={`flex items-center gap-1.5 border rounded-xl px-3 h-9 ${
              selectedImpact !== 'all'
                ? isDark ? 'bg-amber-950/60 border-amber-500 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-950'
                : isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <Zap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedImpact}
                onChange={(e) => onImpactChange(e.target.value as any)}
                className="bg-transparent text-xs focus:outline-none cursor-pointer font-bold uppercase tracking-wider"
              >
                <option value="all" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>TÁC ĐỘNG: TẤT CẢ</option>
                <option value="high" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>⚡ TÁC ĐỘNG CAO</option>
                <option value="medium" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>🔹 TÁC ĐỘNG VỪA</option>
                <option value="low" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>🔸 TÁC ĐỘNG THẤP</option>
              </select>
            </div>

            {/* Dropdown Loại Hành Động Chỉ Đạo */}
            <div className={`flex items-center gap-1.5 border rounded-xl px-3 h-9 ${
              selectedActionTypeFilter !== 'all'
                ? isDark ? 'bg-purple-950/60 border-purple-500 text-purple-200' : 'bg-purple-50 border-purple-300 text-purple-950'
                : isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <FileCheck2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <select
                value={selectedActionTypeFilter}
                onChange={(e) => setSelectedActionTypeFilter(e.target.value)}
                className="bg-transparent text-xs focus:outline-none cursor-pointer font-bold uppercase tracking-wider"
              >
                <option value="all" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>HÀNH ĐỘNG: TẤT CẢ</option>
                <option value="Regulatory Review" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>🟣 RÀ SOÁT PHÁP LÝ</option>
                <option value="Policy Adjustment" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>🔵 ĐIỀU CHỈNH CHÍNH SÁCH</option>
                <option value="Public Statement" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>🟢 PHÁT NGÔN TRUYỀN THÔNG</option>
              </select>
            </div>

            {/* Dropdown Sắp Xếp */}
            <div className={`flex items-center gap-1.5 border rounded-xl px-3 h-9 ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as NewsSortOption)}
                className="bg-transparent text-xs focus:outline-none cursor-pointer font-bold uppercase tracking-wider max-w-[140px] sm:max-w-[170px] truncate"
              >
                <option value="time_desc" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>MỚI NHẤT (Real-time)</option>
                <option value="time_asc" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>CŨ XUẤT BẢN NHẤT</option>
                <option value="crawl_desc" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>MỚI QUÉT TRONG PHIÊN ⚡</option>
                <option value="crawl_asc" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>QUÉT ĐẦU PHIÊN</option>
                <option value="mof_weight_desc" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>TRỌNG SỐ MOF ★</option>
                <option value="buzz_desc" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>SỨC HÚT DƯ LUẬN (BUZZ)</option>
                <option value="sentiment_desc" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>ĐIỂM TÍCH CỰC NHẤT</option>
              </select>
            </div>
          </div>

          {/* Nhóm Nút Phải: Mở Rộng Bộ Lọc / Lọc Nâng Cao */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Mở rộng bộ lọc
            </span>
            <button
              type="button"
              onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-xl border text-xs font-bold transition cursor-pointer ${
                isAdvancedFilterOpen
                  ? isDark ? 'bg-slate-800 text-white border-slate-700 shadow-xs' : 'bg-slate-200 text-slate-900 border-slate-300 shadow-xs'
                  : isDark ? 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>Lọc Nâng Cao</span>
            </button>
          </div>
        </div>

        {/* BẢNG LỌC NÂNG CAO (KHI BẤM NÚT LỌC NÂNG CAO) */}
        {isAdvancedFilterOpen && (
          <div className={`p-3.5 rounded-xl border space-y-3 animate-fadeIn ${
            isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Tầng CSDL (Storage Tier):
                </span>
                <select
                  value={storageTierFilter}
                  onChange={(e) => setStorageTierFilter(e.target.value as any)}
                  className={`border rounded-lg text-xs px-2.5 h-8 focus:outline-none font-semibold ${
                    storageTierFilter !== 'all'
                      ? isDark ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200' : 'bg-indigo-50 border-indigo-400 text-indigo-950'
                      : isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="all">Tất cả tầng</option>
                  <option value="HOT">🔥 HOT (&lt;24h)</option>
                  <option value="WARM">🌤️ WARM (&lt;7d)</option>
                  <option value="COLD">❄️ COLD (&gt;7d)</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="px-3 h-8 rounded-lg text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Đặt lại tất cả bộ lọc</span>
                </button>
              )}
            </div>

            {/* Dải chọn nhanh đầu báo */}
            {availableSources.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                <span className={`font-semibold shrink-0 pr-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Chọn nhanh đầu báo:
                </span>
                <button
                  type="button"
                  onClick={() => handleSourceChange('all')}
                  className={`h-6 px-2 rounded-md text-[11px] font-semibold transition cursor-pointer border shrink-0 ${
                    selectedSource === 'all'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  Tất cả ({newsItems.length})
                </button>
                {availableSources.slice(0, 10).map((s) => (
                  <button
                    key={s.source}
                    type="button"
                    onClick={() => handleSourceChange(selectedSource === s.source ? 'all' : s.source)}
                    className={`h-6 px-2 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 border shrink-0 ${
                      selectedSource === s.source
                        ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500' : 'bg-emerald-100 text-emerald-950 border-emerald-400'
                        : isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{s.source}</span>
                    <span className="font-mono text-[10px] opacity-75">({s.count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Database Operation Notification Banner */}
      {dbNotification && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs animate-fadeIn ${
            dbNotification.type === 'success'
              ? isDark
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm'
              : isDark
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2">
            {dbNotification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span className="font-semibold">{dbNotification.message}</span>
          </div>
          <button
            onClick={() => setDbNotification(null)}
            className="p-1 rounded-md hover:bg-black/10 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Bulk Action Bar if items selected */}
      {selectedIds.size > 0 && (
        <div className={`p-2.5 px-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-md'
            : 'bg-emerald-50 border-emerald-200 text-emerald-950 shadow-xs'
        }`}>
          <div className="flex items-center gap-2">
            <span className="font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-md font-mono">
              {selectedIds.size}
            </span>
            <span className="font-semibold">bài viết được chọn trong CMS</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsConfirmBulkDeleteOpen(true)}
              className="px-2.5 py-1.5 rounded-lg transition font-bold cursor-pointer border flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-xs active:scale-95 text-xs"
              title="Xóa vĩnh viễn các bài viết được chọn khỏi Cơ sở dữ liệu"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa ({selectedIds.size})</span>
            </button>
            <button
              onClick={handleBulkFlag}
              className={`px-2.5 py-1.5 rounded-lg transition font-bold cursor-pointer border flex items-center gap-1.5 shadow-xs active:scale-95 text-xs ${
                isDark
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-500/40'
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-300'
              }`}
              title="Gắn cờ theo dõi / cảnh báo ưu tiên cho các bài viết đã chọn"
            >
              <Flag className="w-3.5 h-3.5 text-amber-500" />
              <span>Gắn cờ (Flag)</span>
            </button>
            <div className="inline-flex items-center rounded-lg shadow-xs">
              <button
                onClick={() => handleBulkExport('csv')}
                className={`px-2.5 py-1.5 rounded-l-lg transition font-bold cursor-pointer border flex items-center gap-1.5 active:scale-95 text-xs ${
                  isDark
                    ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border-sky-500/40'
                    : 'bg-sky-100 text-sky-900 hover:bg-sky-200 border-sky-300'
                }`}
                title="Xuất danh sách bài viết đã chọn ra file Excel / CSV"
              >
                <Download className="w-3.5 h-3.5 text-sky-500" />
                <span>Xuất Excel</span>
              </button>
              <button
                onClick={() => handleBulkExport('json')}
                className={`px-2 py-1.5 rounded-r-lg border-y border-r font-bold transition cursor-pointer text-xs ${
                  isDark
                    ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border-sky-500/40'
                    : 'bg-sky-100 text-sky-900 hover:bg-sky-200 border-sky-300'
                }`}
                title="Xuất file JSON"
              >
                JSON
              </button>
            </div>
            <button
              onClick={() => {
                const next = new Set(reviewedIds);
                selectedIds.forEach((id) => next.add(id));
                setReviewedIds(next);
                setDbNotification({
                  type: 'success',
                  message: `Đã đánh dấu Đã duyệt cho ${selectedIds.size} bài viết.`
                });
                setTimeout(() => setDbNotification(null), 3000);
              }}
              className={`px-2.5 py-1.5 rounded-lg transition font-semibold cursor-pointer border text-xs ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
              }`}
            >
              Đánh dấu Đã duyệt
            </button>
            <button
              onClick={() => {
                const next = new Set(bookmarkedIds);
                selectedIds.forEach((id) => next.add(id));
                setBookmarkedIds(next);
                setDbNotification({
                  type: 'success',
                  message: `Đã ghim ${selectedIds.size} bài viết vào Báo cáo.`
                });
                setTimeout(() => setDbNotification(null), 3000);
              }}
              className={`px-2.5 py-1.5 rounded-lg transition font-semibold cursor-pointer border text-xs ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              Ghim vào Báo cáo
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className={`px-2 py-1 text-xs font-semibold cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Active High-Confidence Filter Notice */}
      {isHighConfidenceActive && (
        <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn ${
          isDark
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            : 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
        }`}>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-rose-600 text-white shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="font-black flex items-center gap-1.5">
                <span>Chế độ Lọc Rủi Ro Tin Cậy Cao (Confidence ≥ 70%) đang BẬT</span>
                <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[10px] font-mono">
                  {displayedItems.length} bài viết
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-rose-300/80' : 'text-rose-800'}`}>
                Chỉ hiển thị các bài viết có nguy cơ khủng hoảng thực tế qua giao thoa từ khóa chuyên ngành MoF và chỉ số sắc thái tiêu cực, loại trừ 100% cảnh báo giả từ thông cáo chính sách.
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleHighConfidence}
            className="px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer bg-rose-600 hover:bg-rose-700 text-white self-start sm:self-center"
          >
            Hiển thị tất cả bài viết
          </button>
        </div>
      )}

      {/* Active High-Confidence Bright Spot Filter Notice */}
      {isHighConfidenceBrightSpotActive && (
        <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn ${
          isDark
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
            : 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
        }`}>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-emerald-600 text-white shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="font-black flex items-center gap-1.5">
                <span>Chế độ Lọc Điểm Sáng Đột Phá Bộ Tài Chính (Confidence ≥ 70%) đang BẬT</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[10px] font-mono">
                  {displayedItems.length} bài viết
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-emerald-300/80' : 'text-emerald-800'}`}>
                Chỉ hiển thị các bài viết thành tựu thực chất theo 6 trụ cột chiến lược của Bộ Tài chính, có số liệu và mốc đột phá rõ ràng, đã triệt tiêu 100% tin PR doanh nghiệp và nhận định suy đoán.
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleHighConfidenceBrightSpot}
            className="px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white self-start sm:self-center"
          >
            Hiển thị tất cả bài viết
          </button>
        </div>
      )}

      {/* Active News Source Filter Notice */}
      {selectedSource !== 'all' && (
        <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn ${
          isDark
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
            : 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
        }`}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0">
              <Newspaper className="w-4 h-4" />
            </div>
            <div>
              <div className="font-black flex items-center gap-1.5">
                <span>Đang lọc theo đầu báo: <strong>{selectedSource}</strong></span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-bold">
                  {displayedItems.length} bài viết
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-emerald-300/80' : 'text-emerald-800'}`}>
                Chỉ hiển thị các bài viết được xuất bản bởi cơ quan thông tấn / đầu báo &quot;{selectedSource}&quot;.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSourceChange('all')}
            className="px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 self-start sm:self-center"
          >
            <X className="w-3.5 h-3.5" />
            <span>Xóa lọc đầu báo</span>
          </button>
        </div>
      )}

      {/* Smart Clustering View: Có thể chuyển đổi giữa Giao diện Table (mặc định gom cụm tin) và Giao diện Thẻ sự kiện */}
      {clusterViewMode === 'cards' ? (
        <div className="space-y-4 animate-fadeIn">
          <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            isDark
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong>Gom cụm sự kiện (Cosine & MinHash Jaccard &gt;70%):</strong> Đã tự động nhận diện {displayedItems.length} bài viết và gom lại thành <strong>{eventClusters.length} Chùm Sự Kiện</strong> có phát hiện báo phát tán đầu tiên (First-Mover).
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 font-bold border border-emerald-500/30 font-mono text-[11px]">
                {eventClusters.filter(c => c.totalArticles > 1).length} chùm đa nguồn
              </span>
              <button
                type="button"
                onClick={() => setClusterViewMode('table')}
                className="px-3 py-1 rounded-lg text-xs font-bold transition bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Xem dạng Bảng</span>
              </button>
            </div>
          </div>

          {eventClusters.length === 0 ? (
            <div className={`p-8 rounded-2xl text-center border ${
              isDark ? 'bg-slate-900/50 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              Không có sự kiện nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="space-y-3.5">
              {eventClusters.map((cluster) => (
                <EventClusterCard
                  key={cluster.id}
                  cluster={cluster}
                  onDeepDive={onDeepDive}
                  onDraftStatement={onDraftStatement}
                  onPolicySubmission={onPolicySubmission}
                  query={query}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
      <div className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* THANH THAO TÁC NHANH TRÊN ĐỈNH BẢNG DỮ LIỆU: Rủi Ro Cao | Điểm Sáng | Gom Cụm Tin (News Clusters) | Auto-Tag */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pill Rủi Ro Cao */}
            <button
              type="button"
              onClick={handleToggleHighConfidence}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                isHighConfidenceActive
                  ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-xs ring-1 ring-rose-500/50'
                  : isDark
                  ? 'bg-rose-950/30 border-rose-800/60 text-rose-300 hover:border-rose-600'
                  : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
              }`}
              title={`Lọc tin rủi ro cao (≥ 70%). Hiện có ${highConfidenceCount}/${totalRiskCount} bài.`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Rủi Ro Cao:</span>
              <span className="font-mono font-bold text-[11px]">{highConfidenceCount}</span>
            </button>

            {/* Pill Điểm Sáng */}
            <button
              type="button"
              onClick={handleToggleHighConfidenceBrightSpot}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                isHighConfidenceBrightSpotActive
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-xs ring-1 ring-emerald-500/50'
                  : isDark
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300 hover:border-emerald-600'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              }`}
              title={`Lọc tin điểm sáng đột phá (≥ 70%). Hiện có ${highConfidenceBrightSpotCount}/${totalBrightSpotCount} bài.`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Điểm Sáng:</span>
              <span className="font-mono font-bold text-[11px]">{highConfidenceBrightSpotCount}</span>
            </button>

            {/* Chế độ Cụm Tin (News Clusters) vs Bài Lẻ (Flat List) */}
            <div className={`flex items-center p-0.5 rounded-full border text-xs font-bold ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
            }`}>
              <button
                type="button"
                onClick={() => setTableGroupingMode('clusters')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  tableGroupingMode === 'clusters'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tự động nhóm các bài báo có cùng nội dung / sự kiện thành cụm tin (News Clusters)"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-300" />
                <span>Cụm tin ({tableGroupingMode === 'clusters' ? eventClusters.length : (lastComputedClustersRef.current.length || '~')})</span>
              </button>

              <button
                type="button"
                onClick={() => setTableGroupingMode('flat')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  tableGroupingMode === 'flat'
                    ? isDark
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-white text-slate-900 shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Hiển thị danh sách tất cả bài viết riêng lẻ không gom nhóm"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Tất cả bài ({displayedItems.length})</span>
              </button>
            </div>

            {isLoading && tableGroupingMode === 'clusters' && (
              <span className={`text-[11px] px-2.5 py-1 rounded-full border flex items-center gap-1 font-medium ${
                isDark ? 'bg-amber-950/40 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`} title="Hệ thống tự động sử dụng bộ đệm và hoãn gom cụm nặng khi đang quét tin để đảm bảo trang tải siêu tốc <16ms">
                <Zap className="w-3 h-3 text-amber-600 animate-pulse" />
                <span>Hoãn gom cụm (Đang quét tin)</span>
              </span>
            )}

            {/* Nút Mở rộng / Thu gọn tất cả nếu ở chế độ Cụm tin */}
            {tableGroupingMode === 'clusters' && eventClusters.some((c) => c.echoArticles.length > 0) && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleExpandAllClusters}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border flex items-center gap-1 ${
                    isDark
                      ? 'bg-indigo-950/40 hover:bg-indigo-900/60 border-indigo-800/50 text-indigo-300'
                      : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-900'
                  }`}
                  title="Mở rộng chi tiết danh sách tất cả các nguồn đưa tin"
                >
                  <ChevronDown className="w-3 h-3 text-indigo-400" />
                  <span>Mở rộng tất cả</span>
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAllClusters}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border flex items-center gap-1 ${
                    isDark
                      ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                  title="Thu gọn danh sách nguồn về bài đầu tiên"
                >
                  <ChevronUp className="w-3 h-3 text-slate-400" />
                  <span>Thu gọn tất cả</span>
                </button>
              </div>
            )}
          </div>

          {/* Phía bên phải: Chuyển Dạng Thẻ & Auto-Tag */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setClusterViewMode('cards')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900'
              }`}
              title="Chuyển đổi sang giao diện thẻ sự kiện đa chiều"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dạng Thẻ</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAutoTagging(!isAutoTagging)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                isAutoTagging
                  ? isDark
                    ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                    : 'bg-amber-100 border-amber-300 text-amber-900'
                  : isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900'
              }`}
              title="Hiển thị nhãn tự động đánh giá độ nhạy cảm chính sách"
            >
              <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Auto-Tag: {isAutoTagging ? 'Bật' : 'Tắt'}</span>
            </button>
          </div>
        </div>

        {/* Khung Bảng Dữ Liệu */}
        <div
          id="cms-content-table"
          className={`cms-content-table overflow-x-auto rounded-xl border ${
            isDark ? 'border-slate-800/80 bg-slate-950/50' : 'border-slate-200 bg-white'
          }`}
        >
          {/* THANH TÁC VỤ HÀNG LOẠT (BULK ACTIONS BAR) */}
          {selectedIds.size > 0 && (
            <div className={`p-2.5 px-3.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-md font-mono text-xs shadow-xs">
                  {selectedIds.size}
                </span>
                <span className="font-bold">
                  bài viết đã chọn
                </span>
                <span className="text-slate-400">|</span>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className={`text-[11px] font-semibold cursor-pointer underline hover:opacity-80 transition ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  {isAllSelectedOnPage ? 'Bỏ chọn trang này' : 'Chọn cả trang'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className={`text-[11px] font-semibold cursor-pointer opacity-70 hover:opacity-100 transition ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Bỏ chọn tất cả
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. XÓA (DELETE) */}
                <button
                  type="button"
                  onClick={() => setIsConfirmBulkDeleteOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer border shadow-xs bg-rose-600 hover:bg-rose-700 text-white border-rose-500 active:scale-95 text-xs"
                  title="Xóa vĩnh viễn các bài viết đã chọn khỏi Cơ sở dữ liệu"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Xóa ({selectedIds.size})</span>
                </button>

                {/* 2. GẮN CỜ (FLAG) */}
                <button
                  type="button"
                  onClick={handleBulkFlag}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer border shadow-xs active:scale-95 text-xs ${
                    isDark
                      ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-500/40'
                      : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-300'
                  }`}
                  title="Gắn cờ theo dõi / cảnh báo ưu tiên cho các bài viết đã chọn"
                >
                  <Flag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Gắn cờ (Flag)</span>
                </button>

                {/* 3. XUẤT FILE (EXPORT) */}
                <div className="inline-flex items-center rounded-lg shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleBulkExport('csv')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-l-lg font-bold transition cursor-pointer border active:scale-95 text-xs ${
                      isDark
                        ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border-sky-500/40'
                        : 'bg-sky-100 text-sky-900 hover:bg-sky-200 border-sky-300'
                    }`}
                    title="Xuất danh sách bài viết đã chọn ra file Excel / CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>Xuất Excel (.CSV)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkExport('json')}
                    className={`px-2 py-1.5 rounded-r-lg border-y border-r font-bold transition cursor-pointer text-xs ${
                      isDark
                        ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border-sky-500/40'
                        : 'bg-sky-100 text-sky-900 hover:bg-sky-200 border-sky-300'
                    }`}
                    title="Xuất file JSON cấu trúc cho các bài đã chọn"
                  >
                    JSON
                  </button>
                </div>

                {/* 4. ĐÁNH DẤU ĐÃ DUYỆT */}
                <button
                  type="button"
                  onClick={() => {
                    const next = new Set(reviewedIds);
                    selectedIds.forEach((id) => next.add(id));
                    setReviewedIds(next);
                    setDbNotification({
                      type: 'success',
                      message: `Đã đánh dấu Đã duyệt cho ${selectedIds.size} bài viết.`
                    });
                    setTimeout(() => setDbNotification(null), 3000);
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer border text-xs ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                  }`}
                  title="Đánh dấu đã kiểm duyệt nội dung"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden sm:inline">Đã duyệt</span>
                </button>

                {/* 5. GHIM VÀO BÁO CÁO */}
                <button
                  type="button"
                  onClick={() => {
                    const next = new Set(bookmarkedIds);
                    selectedIds.forEach((id) => next.add(id));
                    setBookmarkedIds(next);
                    setDbNotification({
                      type: 'success',
                      message: `Đã ghim ${selectedIds.size} bài viết vào Báo cáo điều hành.`
                    });
                    setTimeout(() => setDbNotification(null), 3000);
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer border text-xs ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                  }`}
                  title="Ghim bài viết vào Báo cáo tổng thuật"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Ghim</span>
                </button>
              </div>
            </div>
          )}

          <table className={`cms-content-table w-full table-fixed text-left text-xs ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          }`}>
            <colgroup>
              <col className="w-10 sm:w-11 text-center" />
              <col className="w-[58%] min-w-[320px]" />
              <col className="w-[12%] min-w-[85px] text-center" />
              <col className="w-[30%] min-w-[195px]" />
            </colgroup>
            <thead className={`font-bold uppercase tracking-wider text-[11px] border-b select-none ${
              isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              <tr>
                <th className="py-2 px-1 text-center w-10 sm:w-11">
                  <div className="flex items-center justify-center">
                    <label
                      htmlFor="table-select-all-checkbox"
                      className="inline-flex items-center justify-center cursor-pointer p-1 rounded-md hover:bg-slate-500/15 transition"
                      title={
                        isAllSelectedOnPage
                          ? `Bỏ chọn tất cả bài viết trên trang (${currentPageArticleIds.length} bài)`
                          : `Chọn tất cả bài viết trên trang (${currentPageArticleIds.length} bài) để Xóa, Gắn cờ (Flag), Xuất file (Export)`
                      }
                    >
                      <input
                        id="table-select-all-checkbox"
                        type="checkbox"
                        checked={isAllSelectedOnPage}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = isIndeterminateOnPage;
                          }
                        }}
                        onChange={toggleSelectAll}
                        aria-label="Chọn tất cả bài viết trên trang"
                        className="w-4 h-4 rounded text-emerald-600 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer accent-emerald-600 transition"
                      />
                    </label>
                  </div>
                </th>
                <th className="py-2 px-2.5">
                  <div className="flex items-center gap-1.5">
                    <span>{tableGroupingMode === 'clusters' ? 'Cụm tin & Nội dung bài viết' : 'Bài viết & Nguồn tin'}</span>
                    <ListFilter className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={toggleTimeSort}
                  title="Bấm để chuyển đổi thứ tự sắp xếp theo Thời gian xuất bản / Thời gian quét"
                  className="py-2 px-1 text-center cursor-pointer select-none hover:bg-slate-800/40 transition group"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Trạng thái</span>
                    {sortBy === 'time_desc' && <ArrowDown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    {sortBy === 'time_asc' && <ArrowUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    {sortBy === 'crawl_desc' && <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    {sortBy === 'crawl_asc' && <Zap className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                  </div>
                </th>
                <th className="py-2 px-2.5 text-right">Tác vụ Lãnh đạo</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDark ? 'divide-slate-800/60 bg-slate-900/40' : 'divide-slate-200 bg-white'
            }`}>
              {(tableGroupingMode === 'clusters' ? paginatedClusters.length === 0 : paginatedItems.length === 0) ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center relative overflow-hidden">
                    {/* Ngôi sao 4 cánh trang trí tinh tế ở góc phải trên theo hình */}
                    <div className="absolute top-6 right-10 opacity-30 pointer-events-none text-indigo-400">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                      </svg>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-3.5 max-w-md mx-auto">
                      {/* Icon Database 3 tầng + File theo thiết kế trong ảnh */}
                      <div className="relative">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner ${
                          isHighConfidenceActive
                            ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                        }`}>
                          {isHighConfidenceActive ? (
                            <CheckCircle2 className="w-8 h-8 stroke-[2] text-emerald-400" />
                          ) : (
                            <Database className="w-8 h-8 stroke-[1.5] text-slate-400" />
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-emerald-600 text-white shadow-sm">
                          <Newspaper className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      <div className="space-y-1 text-center">
                        <h3 className={`text-sm sm:text-base font-bold tracking-tight ${
                          isDark ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          {isHighConfidenceActive
                            ? 'Toàn bộ các vấn đề cần chỉ đạo & xử lý khẩn đã được giải quyết!'
                            : 'Hiện tại chưa có bài viết nào phù hợp với bộ lọc CMS.'}
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {isHighConfidenceActive
                            ? 'Hệ thống đã tự động loại bỏ các vấn đề đã hoàn tất. 0 còn vấn đề nào chờ xử lý.'
                            : 'Bắt đầu bằng cách thêm một bài viết mới hoặc điều chỉnh bộ lọc của bạn.'}
                        </p>
                      </div>

                      {/* Các nút xử lý nhanh */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={handleResetAllFilters}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Đặt lại bộ lọc</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            resetForm();
                            setIsAddModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-emerald-600/25"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>+ Thêm Bài Viết Mới</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : tableGroupingMode === 'clusters' ? (
                paginatedClusters.map((cluster) => {
                  const item = cluster.originArticle;
                  const isSelected = selectedIds.has(item.id);
                  const isReviewed = reviewedIds.has(item.id);
                  const isBookmarked = bookmarkedIds.has(item.id);
                  const isFlagged = flaggedIds.has(item.id);
                  const cleanTitle = cleanHtmlTitle(item.title, item.snippet);
                  const cleanSummary = decodeHtmlEntities(item.summary || '');
                  const cleanSector = decodeHtmlEntities(item.sectorNameVi || item.agencies?.[0] || 'Bộ Tài chính (Tổng cục Thuế / UBCKNN / KBNN)');
                  const isCluster = cluster.totalArticles > 1;
                  const isExpanded = expandedClusterIds.has(cluster.id);

                  const parsedSources = parseCleanSources(item.source);
                  const displayPrimarySource = (cluster.originSource && cluster.originSource.split(/[,;]+/)[0]?.trim()) || parsedSources.primarySource;
                  const uniqueSourcesList = Array.from(new Set([
                    ...cluster.allSources,
                    ...parsedSources.allSourcesList,
                  ])).filter(Boolean);

                  const priorityScore = calculateArticleMoFPriorityScore(cleanTitle, cleanSummary, keywordWeights, {
                    sentiment: item.sentiment,
                    impactLevel: item.impactLevel,
                    buzzScore: item.buzzScore,
                    isUrgent: item.isUrgent,
                    sixW: item.sixW,
                    executiveDirective: item.executiveDirective,
                    sixWActionType: item.sixWActionType,
                    policyResponseAdvisor: item.policyResponseAdvisor,
                  });

                  return (
                    <React.Fragment key={cluster.id}>
                      <tr
                        id={`news-card-${item.id}`}
                        data-article-id={item.id}
                        onContextMenu={(e) => handleOpenContextMenu(e, item)}
                        className={`news-card transition-colors duration-150 border-b cursor-pointer ${
                          isSelected
                            ? isDark ? 'bg-emerald-950/35 border-emerald-500/40' : 'bg-emerald-50 border-emerald-300'
                            : isReviewed
                            ? isDark ? 'opacity-85 bg-slate-950/40 hover:bg-slate-800/70 border-slate-800/60' : 'opacity-85 bg-slate-50 hover:bg-slate-100 border-slate-200'
                            : isCluster
                            ? isDark ? 'bg-indigo-950/15 hover:bg-indigo-950/40 hover:bg-slate-800/60 border-indigo-500/30' : 'bg-indigo-50/20 hover:bg-slate-100 border-indigo-100'
                            : isDark ? 'bg-slate-900/50 hover:bg-slate-800/80 border-slate-800/60' : 'bg-white hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {/* Checkbox, Flag & Bookmark */}
                        <td className="py-2 px-1 text-center align-top pt-2.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col items-center gap-1.5">
                            <label className="inline-flex items-center justify-center cursor-pointer p-0.5 rounded-md hover:bg-slate-500/15 transition">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectItem(item.id)}
                                aria-label={`Chọn bài viết: ${cleanTitle}`}
                                title={isSelected ? 'Bỏ chọn bài viết' : 'Chọn bài viết để xóa, gắn cờ, hoặc xuất file'}
                                className="w-4 h-4 rounded text-emerald-600 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer accent-emerald-600 transition"
                              />
                            </label>
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => toggleFlagItem(item.id, e)}
                                className={`cursor-pointer transition p-0.5 rounded hover:scale-110 ${
                                  isFlagged ? 'text-amber-500 fill-amber-500' : 'text-slate-400 hover:text-amber-400 opacity-60 hover:opacity-100'
                                }`}
                                title={isFlagged ? 'Bỏ gắn cờ theo dõi' : 'Gắn cờ theo dõi (Flag)'}
                              >
                                <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current' : ''}`} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => toggleBookmark(item.id, e)}
                                className={`cursor-pointer transition p-0.5 rounded hover:scale-110 ${
                                  isBookmarked ? 'text-amber-400' : 'text-slate-500 hover:text-slate-400 opacity-60 hover:opacity-100'
                                }`}
                                title={isBookmarked ? 'Bỏ lưu bài viết' : 'Lưu bài viết quan trọng'}
                              >
                                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* CỘT 1: Cụm tin, Bài viết & Nguồn */}
                        <td className="py-2 px-2.5 sm:px-3 align-top space-y-1">
                          {/* Header thông tin Cụm tin hoặc Nguồn độc lập */}
                          {isCluster ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-bold border bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 shadow-xs">
                                <Layers className="w-3 h-3 text-indigo-500 shrink-0" />
                                <span>Cụm tin: {cluster.totalArticles} nguồn báo</span>
                              </span>
                              <div className="flex items-center gap-1 flex-wrap">
                                {uniqueSourcesList.slice(0, 3).map((srcName, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className={`text-[10.5px] font-medium px-1.5 py-0.5 rounded-md border ${
                                      isDark
                                        ? 'bg-slate-800/80 text-slate-300 border-slate-700'
                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    {srcName}
                                  </span>
                                ))}
                                {uniqueSourcesList.length > 3 && (
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    +{uniqueSourcesList.length - 3} báo khác
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md border ${
                                isDark
                                  ? 'bg-slate-800/80 text-slate-300 border-slate-700'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {parsedSources.primarySource}
                              </span>
                            </div>
                          )}

                          {/* Tiêu đề bài viết */}
                          <div className="flex items-start gap-1">
                            <h3
                              onClick={() => onDeepDive(item)}
                              className={`font-bold text-xs sm:text-[13px] leading-snug cursor-pointer transition line-clamp-1 sm:line-clamp-2 break-words ${
                                isDark ? 'text-slate-100 hover:text-emerald-400' : 'text-slate-900 hover:text-emerald-700'
                              }`}
                              title="Bấm để xem bóc tách chuyên sâu cho lãnh đạo"
                            >
                              {renderHighlightedText(cleanTitle, query)}
                            </h3>
                          </div>

                          {/* Dòng xuất xứ, đơn vị, liên kết */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[10.5px] text-slate-500 dark:text-slate-400">
                            {isCluster ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                                <Zap className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                <span>Phát tin đầu: <strong>{displayPrimarySource}</strong></span>
                              </span>
                            ) : (
                              <span className="font-semibold text-slate-600 dark:text-slate-300">
                                Nguồn: {parsedSources.primarySource}
                              </span>
                            )}

                            <span className="text-slate-300 dark:text-slate-700">•</span>

                            <span className="truncate">
                              <span className="text-slate-400">Đơn vị: </span>
                              <strong className="font-medium text-slate-700 dark:text-slate-300">{cleanSector}</strong>
                            </span>

                            {item.url && (
                              <>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5 font-medium shrink-0"
                                  title="Mở bài viết gốc tại tòa soạn"
                                >
                                  <span>Mở bài gốc</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </>
                            )}
                          </div>

                          {/* Trích đoạn tóm tắt hoặc TL;DR điều hành */}
                          {densityMode === 'executive' ? (
                            <div className={`p-1.5 sm:p-2 rounded-lg text-xs leading-relaxed border ${
                              isDark ? 'bg-amber-950/20 text-amber-200 border-amber-500/30' : 'bg-amber-50/70 text-amber-950 border-amber-200'
                            }`}>
                              <span className="font-black text-[10px] uppercase text-amber-600 dark:text-amber-400 mr-1.5 inline-flex items-center gap-0.5">
                                <Zap className="w-2.5 h-2.5 fill-current" /> TL;DR:
                              </span>
                              <span className="line-clamp-2">
                                {decodeHtmlEntities(item.tldrSummary || (cleanSummary ? cleanSummary.split('. ').slice(0, 2).join('. ') + '.' : 'Đang đồng bộ dữ liệu tổng thuật điều hành.'))}
                              </span>
                            </div>
                          ) : cleanSummary ? (
                            <p className={`text-[11px] leading-relaxed line-clamp-1 break-words ${
                              isDark ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              {renderHighlightedText(cleanSummary, query)}
                            </p>
                          ) : null}

                          {/* Nút Mở rộng xem chi tiết các nguồn đã đưa tin */}
                          {isCluster && (
                            <div className="pt-0.5 flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => toggleClusterExpand(cluster.id, e)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer border shadow-xs ${
                                  isExpanded
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/20'
                                    : isDark
                                    ? 'bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border-indigo-500/40'
                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                                }`}
                                title="Bấm để xem danh sách chi tiết các nguồn đã đưa tin về sự kiện này"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3 shrink-0" />
                                    <span>Thu gọn {cluster.echoArticles.length} nguồn dẫn</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3 shrink-0" />
                                    <span>Xem {cluster.echoArticles.length} nguồn khác</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </td>

                        {/* CỘT 2: TRẠNG THÁI (ICON ĐƠN GIẢN) */}
                        <td className="py-2 px-1.5 align-middle text-center space-y-1 text-xs">
                          {/* Các icon trạng thái tinh gọn: Dấu tích xanh (Đã kiểm duyệt), Cảnh báo vàng (Cần can thiệp), v.v. */}
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {isReviewed ? (
                              <span
                                className="inline-flex p-1 rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                                title="Trạng thái: Đã kiểm duyệt"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </span>
                            ) : item.isUrgent || item.sentiment === 'bearish' ? (
                              <span
                                className="inline-flex p-1 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse"
                                title="Trạng thái: Cần can thiệp (Sự kiện nhạy cảm / Khẩn cấp)"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            ) : item.sentiment === 'bullish' ? (
                              <span
                                className="inline-flex p-1 rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                                title="Sắc thái: Tích cực"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span
                                className="inline-flex p-1 rounded-md bg-slate-500/15 text-slate-400 border border-slate-500/30"
                                title="Sắc thái: Trung tính / Ổn định"
                              >
                                <BrainCircuit className="w-3.5 h-3.5" />
                              </span>
                            )}

                            {item.buzzScore && item.buzzScore >= 60 && (
                              <span
                                className="inline-flex p-1 rounded-md bg-rose-500/15 text-rose-500 border border-rose-500/30"
                                title={`Độ lan tỏa cao (Buzz: ${item.buzzScore})`}
                              >
                                <Flame className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>

                          {/* Thời gian xuất bản tinh gọn */}
                          <div
                            className={`font-mono text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                            title={`Thời gian xuất bản: ${formatNewsFullDateTime(item)}`}
                          >
                            {formatNewsTimeDisplay(item)}
                          </div>
                        </td>

                        {/* CỘT 3: TÁC VỤ LÃNH ĐẠO (COMPACT HIGH-TOUCH TARGETS) */}
                        <td className="py-2 px-2.5 align-middle" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* 1. Xem chi tiết */}
                            <button
                              onClick={() => onDeepDive(item)}
                              className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 min-h-[34px] rounded-lg text-xs font-bold transition cursor-pointer border shadow-xs hover:scale-[1.02] active:scale-[0.98] ${
                                isDark
                                  ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-700 text-emerald-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                              }`}
                              title="Bóc tách 6W & tổng thuật chi tiết"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="whitespace-nowrap">Xem chi tiết</span>
                            </button>

                            {/* 2. Gửi báo cáo */}
                            <button
                              onClick={(e) => onGmailAlert ? onGmailAlert(item) : handleShareArticle(item, e)}
                              className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 min-h-[34px] rounded-lg text-xs font-bold transition cursor-pointer border shadow-xs hover:scale-[1.02] active:scale-[0.98] ${
                                isDark
                                  ? 'bg-sky-950/80 hover:bg-sky-900 border-sky-700 text-sky-200'
                                  : 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-900'
                              }`}
                              title="Chuyển tiếp báo cáo nhanh qua Email"
                            >
                              <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                              <span className="whitespace-nowrap">Gửi báo cáo</span>
                            </button>

                            {/* 3. Cần can thiệp */}
                            <button
                              onClick={() => onDraftStatement(item)}
                              className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 min-h-[34px] rounded-lg text-xs font-bold transition cursor-pointer border shadow-xs hover:scale-[1.02] active:scale-[0.98] ${
                                isDark
                                  ? 'bg-amber-950/80 hover:bg-amber-900 border-amber-700 text-amber-200'
                                  : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                              }`}
                              title="Soạn định hướng xử lý & phát ngôn"
                            >
                              <FileEdit className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="whitespace-nowrap">Cần can thiệp</span>
                            </button>

                            {/* Nút tác vụ mở rộng */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenContextMenu(e, item)}
                              className={`flex items-center justify-center p-1.5 min-h-[34px] min-w-[34px] rounded-lg border text-xs transition cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                              title="Mở menu tác vụ Lãnh đạo"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* DANH SÁCH CHI TIẾT CÁC NGUỒN ĐÃ ĐƯA TIN (EXPANDED SUB-ROWS) */}
                      {isCluster && isExpanded && cluster.echoArticles.map((echo) => {
                        const echoItem = echo.article;
                        const isEchoSelected = selectedIds.has(echoItem.id);
                        const isEchoFlagged = flaggedIds.has(echoItem.id);
                        const echoCleanTitle = decodeHtmlEntities(echoItem.title || '');
                        const echoCleanSource = decodeHtmlEntities(echoItem.source || 'Báo khác');
                        const echoCleanSummary = decodeHtmlEntities(echoItem.summary || '');

                        return (
                          <tr
                            key={`echo-${echoItem.id}`}
                            id={`news-card-${echoItem.id}`}
                            data-article-id={echoItem.id}
                            onContextMenu={(e) => handleOpenContextMenu(e, echoItem)}
                            className={`border-b transition-colors duration-150 cursor-pointer ${
                              isEchoSelected
                                ? isDark ? 'bg-indigo-950/40 border-indigo-500/40' : 'bg-indigo-50 border-indigo-200'
                                : isDark ? 'bg-slate-950/75 hover:bg-slate-800/80 border-slate-800/60' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            {/* Indentation Connector & Select */}
                            <td className="py-1.5 px-1 text-center align-top pt-2" onClick={(e) => e.stopPropagation()}>
                              <div className="flex flex-col items-center gap-1 text-indigo-400">
                                <span className="text-xs font-mono font-bold select-none leading-none">↳</span>
                                <label className="inline-flex items-center justify-center cursor-pointer p-0.5 rounded-md hover:bg-slate-500/15 transition">
                                  <input
                                    type="checkbox"
                                    checked={isEchoSelected}
                                    onChange={() => toggleSelectItem(echoItem.id)}
                                    aria-label={`Chọn bài viết: ${echoCleanTitle}`}
                                    title={isEchoSelected ? 'Bỏ chọn bài viết' : 'Chọn bài viết để xóa, gắn cờ, hoặc xuất file'}
                                    className="w-3.5 h-3.5 rounded text-indigo-600 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer accent-indigo-600 transition"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={(e) => toggleFlagItem(echoItem.id, e)}
                                  className={`cursor-pointer transition p-0.5 rounded hover:scale-110 ${
                                    isEchoFlagged ? 'text-amber-500 fill-amber-500' : 'text-slate-400 hover:text-amber-400 opacity-60 hover:opacity-100'
                                  }`}
                                  title={isEchoFlagged ? 'Bỏ gắn cờ theo dõi' : 'Gắn cờ theo dõi (Flag)'}
                                >
                                  <Flag className={`w-3 h-3 ${isEchoFlagged ? 'fill-current' : ''}`} />
                                </button>
                              </div>
                            </td>

                            {/* CỘT 1: Bài viết & Nguồn (Indented) */}
                            <td className="py-1.5 px-2.5 sm:px-3 align-top space-y-1">
                              <div className="pl-2.5 border-l-2 border-indigo-500/60 space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <SourceBrandBadge source={echoCleanSource} size="sm" />
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 font-bold">
                                    +{echo.lagMinutes}p sau gốc
                                  </span>
                                </div>

                                <div className="flex items-start gap-1">
                                  <h4
                                    onClick={() => onDeepDive(echoItem)}
                                    className={`font-semibold text-xs leading-snug cursor-pointer transition line-clamp-1 ${
                                      isDark ? 'text-slate-200 hover:text-indigo-300' : 'text-slate-800 hover:text-indigo-700'
                                    }`}
                                    title="Bấm để xem bóc tách chi tiết"
                                  >
                                    {renderHighlightedText(echoCleanTitle, query)}
                                  </h4>
                                </div>

                                {echoCleanSummary && (
                                  <p className={`text-[10.5px] line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {renderHighlightedText(echoCleanSummary, query)}
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* CỘT 2: Trạng thái (Icon đơn giản) */}
                            <td className="py-1.5 px-1.5 align-middle text-center space-y-0.5 text-xs">
                              <div className="flex items-center justify-center gap-1">
                                {echoItem.sentiment === 'bullish' ? (
                                  <span
                                    className="inline-flex p-1 rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                                    title="Sắc thái: Tích cực"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                  </span>
                                ) : echoItem.sentiment === 'bearish' ? (
                                  <span
                                    className="inline-flex p-1 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/30"
                                    title="Trạng thái: Cần lưu ý / Tiêu cực"
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex p-1 rounded-md bg-slate-500/15 text-slate-400 border border-slate-500/30"
                                    title="Sắc thái: Trung tính"
                                  >
                                    <BrainCircuit className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </div>
                              <div className={`font-mono text-[9.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {formatNewsTimeDisplay(echoItem)}
                              </div>
                            </td>

                            {/* CỘT 3: Tác vụ Lãnh đạo */}
                            <td className="py-1.5 px-2.5 align-middle" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => onDeepDive(echoItem)}
                                  className={`flex items-center justify-center gap-1 py-1 px-2 min-h-[30px] rounded-md border text-[11px] font-bold transition cursor-pointer ${
                                    isDark ? 'bg-indigo-950 hover:bg-indigo-900 border-indigo-800 text-indigo-300' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                                  }`}
                                  title="Xem chi tiết"
                                >
                                  <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                                  <span className="whitespace-nowrap">Xem chi tiết</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onDraftStatement(echoItem)}
                                  className={`flex items-center justify-center gap-1 py-1 px-2 min-h-[30px] rounded-md border text-[11px] font-bold transition cursor-pointer ${
                                    isDark ? 'bg-amber-950/80 hover:bg-amber-900 border-amber-800 text-amber-300' : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                                  }`}
                                  title="Soạn phát ngôn"
                                >
                                  <FileEdit className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span className="whitespace-nowrap">Cần can thiệp</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              ) : (
              paginatedItems.map((item) => {
                const isSelected = selectedIds.has(item.id);
                const isReviewed = reviewedIds.has(item.id);
                const isBookmarked = bookmarkedIds.has(item.id);
                const isFlagged = flaggedIds.has(item.id);
                const cleanTitle = cleanHtmlTitle(item.title, item.snippet);
                const cleanSummary = decodeHtmlEntities(item.summary || '');
                const cleanSector = decodeHtmlEntities(item.sectorNameVi || item.agencies?.[0] || 'Bộ Tài chính');
                const parsedSources = parseCleanSources(item.source);

                return (
                  <tr
                    key={item.id}
                    id={`news-card-${item.id}`}
                    data-article-id={item.id}
                    onContextMenu={(e) => handleOpenContextMenu(e, item)}
                    className={`news-card transition-colors duration-150 border-b cursor-pointer ${
                      isSelected
                        ? isDark ? 'bg-emerald-950/35 border-emerald-500/40' : 'bg-emerald-50 border-emerald-300'
                        : isReviewed
                        ? isDark ? 'opacity-85 bg-slate-950/40 hover:bg-slate-800/70 border-slate-800/60' : 'opacity-85 bg-slate-50 hover:bg-slate-100 border-slate-200'
                        : isDark ? 'bg-slate-900/50 hover:bg-slate-800/80 border-slate-800/60' : 'bg-white hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    {/* Checkbox, Flag & Bookmark */}
                    <td className="py-2 px-1 text-center align-top pt-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-center gap-1.5">
                        <label className="inline-flex items-center justify-center cursor-pointer p-0.5 rounded-md hover:bg-slate-500/15 transition">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectItem(item.id)}
                            aria-label={`Chọn bài viết: ${cleanTitle}`}
                            title={isSelected ? 'Bỏ chọn bài viết' : 'Chọn bài viết để xóa, gắn cờ, hoặc xuất file'}
                            className="w-4 h-4 rounded text-emerald-600 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer accent-emerald-600 transition"
                          />
                        </label>
                        <div className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => toggleFlagItem(item.id, e)}
                            className={`cursor-pointer transition p-0.5 rounded hover:scale-110 ${
                              isFlagged ? 'text-amber-500 fill-amber-500' : 'text-slate-400 hover:text-amber-400 opacity-60 hover:opacity-100'
                            }`}
                            title={isFlagged ? 'Bỏ gắn cờ theo dõi' : 'Gắn cờ theo dõi (Flag)'}
                          >
                            <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => toggleBookmark(item.id, e)}
                            title={isBookmarked ? 'Đã ghim bài' : 'Ghim bài viết'}
                            className={`cursor-pointer transition p-0.5 rounded hover:scale-110 ${
                              isBookmarked
                                ? 'text-amber-400'
                                : isDark ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* CỘT 1: Bài viết & Nguồn */}
                    <td className="py-2 px-2.5 sm:px-3 align-top space-y-1">
                      {/* Nguồn bài viết */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md border ${
                          isDark
                            ? 'bg-slate-800/80 text-slate-300 border-slate-700'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {parsedSources.primarySource}
                        </span>
                        {parsedSources.allSourcesList.length > 1 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {parsedSources.allSourcesList.slice(1, 3).map((s, idx) => (
                              <span
                                key={idx}
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${
                                  isDark
                                    ? 'bg-slate-800/80 text-slate-400 border-slate-700'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.isMarketDigest ? (
                          <span className="px-1.5 py-0.5 rounded-md font-medium text-[9.5px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                            Điểm tin Thị trường
                          </span>
                        ) : item.isUrgent ? (
                          <span className="px-1.5 py-0.5 rounded-full font-bold text-[9.5px] bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shrink-0">
                            Khẩn cấp
                          </span>
                        ) : null}
                      </div>

                      {/* Tiêu đề bài viết */}
                      <div className="flex items-start gap-1">
                        <h3
                          onClick={() => onDeepDive(item)}
                          className={`font-bold text-xs sm:text-[13px] leading-snug cursor-pointer transition line-clamp-1 sm:line-clamp-2 break-words ${
                            isDark ? 'text-slate-100 hover:text-emerald-400' : 'text-slate-900 hover:text-emerald-700'
                          }`}
                          title="Bấm để xem bóc tách chuyên sâu cho lãnh đạo"
                        >
                          {renderHighlightedText(cleanTitle, query)}
                        </h3>
                      </div>

                      {/* Dòng xuất xứ & Đơn vị */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[10.5px] text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          Nguồn: {parsedSources.primarySource}
                        </span>

                        <span className="text-slate-300 dark:text-slate-700">•</span>

                        <span className="truncate">
                          <span className="text-slate-400">Đơn vị: </span>
                          <strong className="font-medium text-slate-700 dark:text-slate-300">{cleanSector}</strong>
                        </span>

                        {item.url && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5 font-medium shrink-0"
                              title="Mở bài viết gốc tại tòa soạn"
                            >
                              <span>Mở bài gốc</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </>
                        )}
                      </div>

                      {/* Trích đoạn tóm tắt hoặc TL;DR */}
                      {densityMode === 'executive' ? (
                        <div className={`p-1.5 sm:p-2 rounded-lg text-xs leading-relaxed border ${
                          isDark ? 'bg-amber-950/20 text-amber-200 border-amber-500/30' : 'bg-amber-50/70 text-amber-950 border-amber-200'
                        }`}>
                          <span className="font-black text-[10px] uppercase text-amber-600 dark:text-amber-400 mr-1.5 inline-flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5 fill-current" /> TL;DR:
                          </span>
                          <span className="line-clamp-2">
                            {decodeHtmlEntities(item.tldrSummary || (cleanSummary ? cleanSummary.split('. ').slice(0, 2).join('. ') + '.' : 'Đang đồng bộ dữ liệu tổng thuật điều hành.'))}
                          </span>
                        </div>
                      ) : cleanSummary ? (
                        <p className={`text-[11px] leading-relaxed line-clamp-1 break-words ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          {renderHighlightedText(cleanSummary, query)}
                        </p>
                      ) : null}
                    </td>

                    {/* CỘT 2: TRẠNG THÁI (ICON ĐƠN GIẢN) */}
                    <td className="py-2 px-1.5 align-middle text-center space-y-1 text-xs">
                      {/* Các icon trạng thái tinh gọn: Dấu tích xanh (Đã kiểm duyệt), Cảnh báo vàng (Cần can thiệp), v.v. */}
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {isReviewed ? (
                          <span
                            className="inline-flex p-1 rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                            title="Trạng thái: Đã kiểm duyệt"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        ) : item.isMarketDigest ? (
                          <span
                            className="inline-flex p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
                            title="Trạng thái: Điểm tin Thị trường Thường nhật (Không cảnh báo)"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                          </span>
                        ) : item.isUrgent || item.sentiment === 'bearish' ? (
                          <span
                            className="inline-flex p-1 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse"
                            title="Trạng thái: Cần can thiệp (Sự kiện nhạy cảm / Khẩn cấp)"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        ) : item.sentiment === 'bullish' ? (
                          <span
                            className="inline-flex p-1 rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                            title="Sắc thái: Tích cực"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span
                            className="inline-flex p-1 rounded-md bg-slate-500/15 text-slate-400 border border-slate-500/30"
                            title="Sắc thái: Trung tính / Ổn định"
                          >
                            <BrainCircuit className="w-3.5 h-3.5" />
                          </span>
                        )}

                        {item.buzzScore && item.buzzScore >= 60 && (
                          <span
                            className="inline-flex p-1 rounded-md bg-rose-500/15 text-rose-500 border border-rose-500/30"
                            title={`Độ lan tỏa cao (Buzz: ${item.buzzScore})`}
                          >
                            <Flame className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      {/* Thời gian xuất bản tinh gọn */}
                      <div
                        className={`font-mono text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                        title={`Thời gian xuất bản: ${formatNewsFullDateTime(item)}`}
                      >
                        {formatNewsTimeDisplay(item)}
                      </div>
                    </td>

                    {/* CỘT 3: TÁC VỤ LÃNH ĐẠO (COMPACT HIGH-TOUCH TARGETS) */}
                    <td className="py-2 px-2.5 align-middle" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* 1. Xem chi tiết */}
                        <button
                          onClick={() => onDeepDive(item)}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 min-h-[34px] rounded-lg text-xs font-bold transition cursor-pointer border shadow-xs hover:scale-[1.02] active:scale-[0.98] ${
                            isDark
                              ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-700 text-emerald-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                          }`}
                          title="Bóc tách 6W & tổng thuật chi tiết"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="whitespace-nowrap">Xem chi tiết</span>
                        </button>

                        {/* 2. Gửi báo cáo */}
                        <button
                          onClick={(e) => onGmailAlert ? onGmailAlert(item) : handleShareArticle(item, e)}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 min-h-[34px] rounded-lg text-xs font-bold transition cursor-pointer border shadow-xs hover:scale-[1.02] active:scale-[0.98] ${
                            isDark
                              ? 'bg-sky-950/80 hover:bg-sky-900 border-sky-700 text-sky-200'
                              : 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-900'
                          }`}
                          title="Chuyển tiếp báo cáo nhanh qua Email"
                        >
                          <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span className="whitespace-nowrap">Gửi báo cáo</span>
                        </button>

                        {/* 3. Cần can thiệp */}
                        <button
                          onClick={() => onDraftStatement(item)}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 min-h-[34px] rounded-lg text-xs font-bold transition cursor-pointer border shadow-xs hover:scale-[1.02] active:scale-[0.98] ${
                            isDark
                              ? 'bg-amber-950/80 hover:bg-amber-900 border-amber-700 text-amber-200'
                              : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                          }`}
                          title="Soạn định hướng xử lý & phát ngôn"
                        >
                          <FileEdit className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="whitespace-nowrap">Cần can thiệp</span>
                        </button>

                        {/* Nút tác vụ mở rộng */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenContextMenu(e, item)}
                          className={`flex items-center justify-center p-1.5 min-h-[34px] min-w-[34px] rounded-lg border text-xs transition cursor-pointer ${
                            isDark
                              ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                          title="Mở menu tác vụ Lãnh đạo"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
    )}

      {/* Pagination Controls */}
      <div className={`flex flex-wrap items-center justify-between gap-3 pt-3 border-t text-xs font-medium ${
        isDark ? 'text-slate-400 border-slate-800' : 'text-slate-600 border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center gap-3">
          <span>
            Hiển thị <strong>{tableGroupingMode === 'clusters' ? paginatedClusters.length : paginatedItems.length}</strong> / <strong>{tableGroupingMode === 'clusters' ? eventClusters.length : displayedItems.length}</strong> {tableGroupingMode === 'clusters' ? 'cụm tin' : 'bài viết'}
          </span>
          <span className="hidden sm:inline-block text-slate-400">|</span>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const pageNum = parseInt(jumpPageInput, 10);
              if (!isNaN(pageNum)) {
                const validPage = Math.max(1, Math.min(totalPages, pageNum));
                setCurrentPage(validPage);
                setJumpPageInput(String(validPage));
              } else {
                setJumpPageInput(String(currentPage));
              }
            }}
            className="flex items-center gap-1.5"
          >
            <span>Chuyển đến trang:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPageInput}
              onChange={(e) => {
                setJumpPageInput(e.target.value);
                const p = parseInt(e.target.value, 10);
                if (!isNaN(p) && p >= 1 && p <= totalPages) {
                  setCurrentPage(p);
                }
              }}
              onBlur={() => {
                const p = parseInt(jumpPageInput, 10);
                if (isNaN(p) || p < 1) {
                  setCurrentPage(1);
                  setJumpPageInput('1');
                } else if (p > totalPages) {
                  setCurrentPage(totalPages);
                  setJumpPageInput(String(totalPages));
                } else {
                  setCurrentPage(p);
                }
              }}
              placeholder={String(currentPage)}
              className={`w-14 px-2 py-1 text-center font-mono font-bold rounded-lg border focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                isDark ? 'bg-slate-950 border-slate-700 text-amber-400' : 'bg-white border-slate-300 text-amber-700'
              }`}
            />
            <span className="text-slate-400 font-mono">/ {totalPages}</span>
            <button
              type="submit"
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                isDark
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300'
              }`}
            >
              Chuyển
            </button>
          </form>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            title="Về trang đầu (Trang 1)"
            className={`px-2 py-1 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer text-xs ${
              isDark
                ? 'bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300'
                : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800'
            }`}
          >
            Đầu
          </button>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className={`p-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer ${
              isDark
                ? 'bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-200'
                : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className={`px-2 py-1 font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            Trang {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className={`p-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer ${
              isDark
                ? 'bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-200'
                : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
            title={`Đến trang cuối (Trang ${totalPages})`}
            className={`px-2 py-1 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer text-xs ${
              isDark
                ? 'bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300'
                : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800'
            }`}
          >
            Cuối
          </button>
        </div>
      </div>

      {/* Impact Calculation Methodology Modal */}
      {showImpactInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
          <div 
            className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] transition-all transform scale-100 ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-100' 
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className={`p-5 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Cơ Chế Tính Điểm Tác Động</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Hệ thống phân tích tự động BTC Listening</p>
                </div>
              </div>
              <button
                onClick={() => setShowImpactInfo(false)}
                className="p-1.5 rounded-lg hover:bg-slate-500/10 text-slate-400 hover:text-slate-200 transition cursor-pointer font-bold text-xs"
              >
                Đóng (✕)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs leading-relaxed">
              <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                Hệ thống <strong>BTC Listening</strong> sử dụng thuật toán chấm điểm đa nhân tố tích hợp (Multi-factor scoring) từ <strong className="text-emerald-500">25 đến 99 điểm</strong> để phân loại mức độ tác động của tin bài chính trị - tài chính vĩ mô:
              </p>

              {/* Formula & Weighting Sections */}
              <div className="space-y-4">
                {/* Criterion 1 */}
                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-slate-950/30 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">1</span>
                    <h4 className="font-extrabold text-sm text-emerald-400">Tính cấp thiết của chính sách (Policy Urgency)</h4>
                  </div>
                  <p className={`mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Tin tức được tự động quy đổi điểm nền dựa theo phạm vi thể chế & đối tượng bị ảnh hưởng:</p>
                  <ul className="space-y-1.5 pl-2 font-medium">
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold">⚡ Cấp độ 1 (Tier 1 - Điểm nền 40):</span>
                      <span>Tin vĩ mô cốt lõi liên quan trực tiếp đến <strong>Thuế, Hải quan, Ngân sách Nhà nước, Nợ công, Đầu tư công</strong>. Được ưu tiên xếp loại <strong>Tác động Cao</strong>.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">🔹 Cấp độ 2 (Tier 2 - Điểm nền 26):</span>
                      <span>Thị trường & Ngành tài chính (Chứng khoán, Ngân hàng, Bất động sản, Vàng, Ngoại hối).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-slate-400 font-bold">🔸 Cấp độ 3 (Tier 3 - Điểm nền 14):</span>
                      <span>Sự việc riêng lẻ của Doanh nghiệp, giao dịch thương mại thông thường.</span>
                    </li>
                  </ul>
                </div>

                {/* Criterion 2 */}
                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-slate-950/30 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">2</span>
                    <h4 className="font-extrabold text-sm text-emerald-400">Độ phổ biến của Từ khóa (Keyword Weights)</h4>
                  </div>
                  <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                    Hệ thống phân tích tần suất xuất hiện các thuật ngữ trọng tâm trong bộ từ điển chính sách (như <em>"thất thoát", "siết thuế", "trốn thuế", "giá vàng bùng nổ", "lãi suất", "chỉ đạo"</em>) để điều chỉnh tăng/giảm hệ số điểm ưu tiên, giúp gom cụm thông tin chính xác.
                  </p>
                </div>

                {/* Criterion 3 */}
                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-slate-950/30 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">3</span>
                    <h4 className="font-extrabold text-sm text-emerald-400">Sức ảnh hưởng tới đối tượng liên quan (Stakeholder Reach)</h4>
                  </div>
                  <p className={`mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Các chỉ số cộng hưởng xã hội gia tăng sức nặng cho luồng tin:</p>
                  <ul className="space-y-1.5 pl-2 font-medium">
                    <li className="flex items-start gap-1.5">
                      <strong className="text-slate-300">Sắc thái Cực đoan (Tối đa 30 điểm):</strong>
                      <span>Mức độ tiêu cực (bearish) hoặc tích cực (bullish) càng lớn càng tăng kịch tính ảnh hưởng của tin.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <strong className="text-slate-300">Uy tín Nguồn tin (Tối đa 20 điểm):</strong>
                      <span>Tin đăng trên Cổng chính phủ, Thời báo Tài chính sẽ được chấm điểm cao hơn tin từ diễn đàn, mạng xã hội tự do.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <strong className="text-slate-300">Tần suất đồng loạt (Tối đa 10 điểm):</strong>
                      <span>Đo lường chỉ số Viral Buzz khi có nhiều cơ quan truyền thông đồng loạt đăng tải thông tin trong cùng phiên quét.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Classification Thresholds */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <h4 className="font-extrabold mb-2 text-slate-200 text-xs uppercase tracking-wider">Ngưỡng Phân Loại Mức Độ Tác Động:</h4>
                <div className="grid grid-cols-3 gap-3 font-semibold text-center text-[11px]">
                  <div className="p-2 bg-rose-500/10 border border-rose-500/25 rounded-lg text-rose-300">
                    <div className="font-bold text-xs">⚡ CAO</div>
                    <div className="mt-0.5">Điểm ≥ 75 hoặc thuộc Tier 1</div>
                  </div>
                  <div className="p-2 bg-amber-500/10 border border-amber-500/25 rounded-lg text-amber-300">
                    <div className="font-bold text-xs">🔹 VỪA</div>
                    <div className="mt-0.5">Điểm từ 46 - 74</div>
                  </div>
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-emerald-300">
                    <div className="font-bold text-xs">🔸 THẤP</div>
                    <div className="mt-0.5">Điểm ≤ 45</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex justify-end ${
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
            }`}>
              <button
                onClick={() => setShowImpactInfo(false)}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: THÊM BÀI VIẾT MỚI VÀO CSDL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Thêm Bài Viết Mới Vào Cơ Sở Dữ Liệu</h3>
                  <p className="text-[11px] text-slate-400">Tự động đồng bộ vào In-Memory/Disk DB & Cloud Firestore</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveNewArticle} className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
              <div>
                <label className="block font-bold mb-1">Tiêu đề bài viết <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tiêu đề bài viết điều hành tài chính..."
                  className={`w-full p-2.5 rounded-xl border font-medium focus:outline-none focus:border-emerald-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Nguồn tin / Cơ quan</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="VD: Cổng TTĐT Bộ Tài chính, Thời báo Tài chính..."
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Lĩnh vực chuyên mục</label>
                  <select
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value as SectorType })}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {Object.entries(SECTOR_NAMES).map(([secKey, secName]) => (
                      <option key={secKey} value={secKey}>{secName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Link bài viết gốc (URL)</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Tóm tắt nội dung chính</label>
                <textarea
                  rows={3}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Tóm tắt thông điệp điều hành hoặc diễn biến chính sách..."
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">Sắc thái bài viết</label>
                  <select
                    value={formData.sentiment}
                    onChange={(e) => setFormData({ ...formData, sentiment: e.target.value as SentimentType })}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="positive">Tích cực (Positive)</option>
                    <option value="neutral">Trung tính (Neutral)</option>
                    <option value="negative">Tiêu cực (Negative)</option>
                    <option value="mixed">Đa chiều (Mixed)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Điểm sắc thái (-100 đến +100)</label>
                  <input
                    type="number"
                    min={-100}
                    max={100}
                    value={formData.sentimentScore}
                    onChange={(e) => setFormData({ ...formData, sentimentScore: Number(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Mức độ tác động</label>
                  <select
                    value={formData.impactLevel}
                    onChange={(e) => setFormData({ ...formData, impactLevel: e.target.value as ImpactLevel })}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="high">⚡ Cao</option>
                    <option value="medium">🔹 Vừa</option>
                    <option value="low">🔸 Thấp</option>
                  </select>
                </div>
              </div>

              {/* Classification flags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-dashed border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={formData.isBrightSpot}
                    onChange={(e) => setFormData({ ...formData, isBrightSpot: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>🌟 Đánh dấu Điểm Sáng Đột Phá</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={formData.isRisk}
                    onChange={(e) => setFormData({ ...formData, isRisk: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>⚠️ Đánh dấu Cảnh Báo Rủi Ro</span>
                </label>
              </div>

              <div>
                <label className="block font-bold mb-1">Từ khóa pháp lý / Thẻ tag (cách nhau bởi dấu phẩy)</label>
                <input
                  type="text"
                  value={formData.regulatoryTags}
                  onChange={(e) => setFormData({ ...formData, regulatoryTags: e.target.value })}
                  placeholder="VD: Nghị định 123, Luật Thuế GTGT, Thị trường chứng khoán..."
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isProcessingDb}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isProcessingDb ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu DB...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lưu Bài Viết Vào DB</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHỈNH SỬA BÀI VIẾT TRONG CSDL */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Chỉnh Sửa Bài Viết Trong Cơ Sở Dữ Liệu</h3>
                  <p className="text-[11px] text-slate-400">ID: <code className="text-blue-400 font-mono">{editingArticle.id}</code></p>
                </div>
              </div>
              <button
                onClick={() => setEditingArticle(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveEditedArticle} className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
              <div>
                <label className="block font-bold mb-1">Tiêu đề bài viết <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border font-medium focus:outline-none focus:border-blue-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Nguồn tin / Cơ quan</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Lĩnh vực chuyên mục</label>
                  <select
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value as SectorType })}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {Object.entries(SECTOR_NAMES).map(([secKey, secName]) => (
                      <option key={secKey} value={secKey}>{secName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Link bài viết gốc (URL)</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-blue-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Tóm tắt nội dung chính</label>
                <textarea
                  rows={3}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-blue-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">Sắc thái bài viết</label>
                  <select
                    value={formData.sentiment}
                    onChange={(e) => setFormData({ ...formData, sentiment: e.target.value as SentimentType })}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="positive">Tích cực (Positive)</option>
                    <option value="neutral">Trung tính (Neutral)</option>
                    <option value="negative">Tiêu cực (Negative)</option>
                    <option value="mixed">Đa chiều (Mixed)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Điểm sắc thái (-100 đến +100)</label>
                  <input
                    type="number"
                    min={-100}
                    max={100}
                    value={formData.sentimentScore}
                    onChange={(e) => setFormData({ ...formData, sentimentScore: Number(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Mức độ tác động</label>
                  <select
                    value={formData.impactLevel}
                    onChange={(e) => setFormData({ ...formData, impactLevel: e.target.value as ImpactLevel })}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="high">⚡ Cao</option>
                    <option value="medium">🔹 Vừa</option>
                    <option value="low">🔸 Thấp</option>
                  </select>
                </div>
              </div>

              {/* Classification flags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-dashed border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={formData.isBrightSpot}
                    onChange={(e) => setFormData({ ...formData, isBrightSpot: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>🌟 Điểm Sáng Đột Phá</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={formData.isRisk}
                    onChange={(e) => setFormData({ ...formData, isRisk: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>⚠️ Cảnh Báo Rủi Ro</span>
                </label>
              </div>

              <div>
                <label className="block font-bold mb-1">Từ khóa pháp lý / Thẻ tag</label>
                <input
                  type="text"
                  value={formData.regulatoryTags}
                  onChange={(e) => setFormData({ ...formData, regulatoryTags: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-blue-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isProcessingDb}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {isProcessingDb ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Cập Nhật Thay Đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: XÁC NHẬN XÓA BÀI VIẾT ĐƠN LẺ */}
      {deletingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-5 space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Xác Nhận Xóa Bài Viết</h3>
                <p className="text-[11px] text-slate-400">Thao tác này sẽ xóa vĩnh viễn khỏi Database & Cloud Firestore</p>
              </div>
            </div>

            <div className={`p-3 rounded-xl border text-xs ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="font-bold text-slate-200 line-clamp-2">{deletingArticle.title}</div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                <span>Nguồn: {deletingArticle.source}</span>
                <span>•</span>
                <span>ID: {deletingArticle.id}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
              {onOpenAiFeedback && (
                <button
                  type="button"
                  onClick={() => {
                    const art = deletingArticle;
                    setDeletingArticle(null);
                    onOpenAiFeedback(art);
                  }}
                  className="px-3 py-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Ghi chú phản hồi cho AI để không bao giờ quét dính tin tương tự"
                >
                  <BrainCircuit className="w-4 h-4 text-indigo-500" />
                  <span>Loại bỏ & Ghi chú cho AI</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setDeletingArticle(null)}
                  disabled={isProcessingDb}
                  className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isProcessingDb}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-rose-600/20 disabled:opacity-50"
                >
                {isProcessingDb ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa Khỏi Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* MODAL: XÁC NHẬN XÓA HÀNG LOẠT BÀI VIẾT */}
      {isConfirmBulkDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-5 space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Xác Nhận Xóa Hàng Loạt ({selectedIds.size} bài)</h3>
                <p className="text-[11px] text-slate-400">Bạn có chắc chắn muốn xóa tất cả bài viết đã chọn khỏi Cơ sở dữ liệu?</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Các bài viết được chọn sẽ bị xóa vĩnh viễn khỏi In-Memory Database, lưu trữ đĩa và Cloud Firestore. Thao tác này không thể hoàn tác.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmBulkDeleteOpen(false)}
                disabled={isProcessingDb}
                className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={isProcessingDb}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                {isProcessingDb ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Xác Nhận Xóa {selectedIds.size} Bài</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sentiment Score Component Breakdown & Highlight Modal */}
      <SentimentScoreBreakdownModal
        item={breakdownArticle}
        isOpen={!!breakdownArticle}
        onClose={() => setBreakdownArticle(null)}
        onDraftStatement={onDraftStatement}
        onGmailAlert={onGmailAlert}
      />
        </div>
      )}

      {/* MODAL: INSPECT RAW FIRESTORE DOCUMENT JSON */}
      {inspectingJsonArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <span>Bản Ghi Firestore CSDL:</span>
                    <code className="text-xs text-indigo-400 font-mono bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                      scraped_news_archive/{inspectingJsonArticle.id}
                    </code>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cấu trúc document đã được chuẩn hóa với hash chống trùng và mốc thời gian lưu trữ RAG.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingJsonArticle(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto font-mono text-xs space-y-3 bg-slate-950/40">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Deduplication Hash (SHA-256):</span>
                  <span className="text-emerald-400 font-mono break-all font-bold">
                    {generateArticleHash(inspectingJsonArticle)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Mốc Lưu Kho (archived_at):</span>
                  <span className="text-indigo-400 font-mono">
                    {inspectingJsonArticle.publishedAt || new Date().toISOString()}
                  </span>
                </div>
              </div>

              <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-3 overflow-x-auto">
                <div className="flex items-center justify-between mb-2 text-[10px] text-slate-500 pb-1 border-b border-slate-800">
                  <span>RAW FIRESTORE DOCUMENT JSON</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(getRawDocumentPayload(inspectingJsonArticle), null, 2));
                      setCopiedJsonSuccess(true);
                      setTimeout(() => setCopiedJsonSuccess(false), 2000);
                    }}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 cursor-pointer font-bold"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedJsonSuccess ? 'Đã sao chép!' : 'Sao chép JSON'}</span>
                  </button>
                </div>
                <pre className="text-[11px] leading-relaxed text-slate-300 overflow-x-auto">
                  {JSON.stringify(getRawDocumentPayload(inspectingJsonArticle), null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 border-t border-slate-800 flex justify-end gap-2 bg-slate-950/40">
              <button
                onClick={() => setInspectingJsonArticle(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Pipeline 7-Stage & 3-Level Model Modal */}
      {warningPipelineArticle && (
        <WarningPipelineModelModal
          item={warningPipelineArticle}
          allNews={newsItems}
          onClose={() => setWarningPipelineArticle(null)}
          onGmailAlert={onGmailAlert}
          onDraftStatement={onDraftStatement}
          onPolicySubmission={onPolicySubmission}
          onOverrideArticle={(updated) => {
            setWarningPipelineArticle(updated);
          }}
        />
      )}

      {/* CONTEXT MENU: 3 HÀNH ĐỘNG ĐIỀU HÀNH CHÍNH CHO LÃNH ĐẠO */}
      {contextMenu?.isOpen && contextMenu?.article && (
        <>
          {/* Backdrop để click ra ngoài đóng menu */}
          <div
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[0.5px]"
            onClick={handleCloseContextMenu}
            onContextMenu={(e) => {
              e.preventDefault();
              handleCloseContextMenu();
            }}
          />

          <div
            id="cms-article-context-menu"
            className={`fixed z-50 w-72 rounded-2xl shadow-2xl border p-2.5 animate-fadeIn select-none ${
              isDark
                ? 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-black/80 ring-1 ring-slate-700/50'
                : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-400/30 ring-1 ring-slate-200'
            }`}
            style={{
              top: Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 260 : contextMenu.y),
              left: Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 300 : contextMenu.x),
            }}
          >
            {/* Header bài viết trong context menu */}
            <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-2">
              <p className="text-xs font-bold line-clamp-2 leading-snug">
                {decodeHtmlEntities(contextMenu.article?.title || '')}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-600 dark:text-slate-300 truncate">{contextMenu.article?.source || 'Nguồn tin'}</span>
                {contextMenu.article?.sectorNameVi && (
                  <>
                    <span>•</span>
                    <span className="truncate">{contextMenu.article.sectorNameVi}</span>
                  </>
                )}
              </div>
            </div>

            {/* 3 HÀNH ĐỘNG CÔ ĐỌNG CHO LÃNH ĐẠO */}
            <div className="space-y-1.5">
              {/* 1. XEM CHI TIẾT */}
              <button
                type="button"
                id="context-menu-deep-dive-btn"
                onClick={() => {
                  const art = contextMenu.article;
                  handleCloseContextMenu();
                  if (art) onDeepDive(art);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer border ${
                  isDark
                    ? 'hover:bg-emerald-950/60 text-emerald-300 hover:text-emerald-200 bg-slate-800/60 border-emerald-900/40'
                    : 'hover:bg-emerald-50 text-emerald-800 bg-slate-50 border-slate-200/80'
                }`}
                title="Xem báo cáo tổng thuật và bóc tách chi tiết"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Xem chi tiết</div>
                  <div className="text-[10px] font-normal text-slate-400 line-clamp-1">
                    Bóc tách 6W & tổng thuật chi tiết
                  </div>
                </div>
              </button>

              {/* 2. GỬI BÁO CÁO */}
              <button
                type="button"
                id="context-menu-send-report-btn"
                onClick={(e) => {
                  const art = contextMenu.article;
                  handleCloseContextMenu();
                  if (art) {
                    if (onGmailAlert) {
                      onGmailAlert(art);
                    } else {
                      handleShareArticle(art, e);
                    }
                  }
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer border ${
                  isDark
                    ? 'hover:bg-sky-950/60 text-sky-300 hover:text-sky-200 bg-slate-800/60 border-sky-900/40'
                    : 'hover:bg-sky-50 text-sky-800 bg-slate-50 border-slate-200/80'
                }`}
                title="Chuyển tiếp báo cáo nhanh qua Email"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center text-sky-500 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-sky-600 dark:text-sky-400">Gửi báo cáo</div>
                  <div className="text-[10px] font-normal text-slate-400 line-clamp-1">
                    Chuyển tiếp báo cáo nhanh qua Email
                  </div>
                </div>
              </button>

              {/* 3. CẦN CAN THIỆP */}
              <button
                type="button"
                id="context-menu-intervene-btn"
                onClick={() => {
                  const art = contextMenu.article;
                  handleCloseContextMenu();
                  if (art) onDraftStatement(art);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer border ${
                  isDark
                    ? 'hover:bg-amber-950/60 text-amber-300 hover:text-amber-200 bg-slate-800/60 border-amber-900/40'
                    : 'hover:bg-amber-50 text-amber-900 bg-slate-50 border-slate-200/80'
                }`}
                title="Kích hoạt quy trình xử lý & soạn phát ngôn"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500 shrink-0">
                  <FileEdit className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400">Cần can thiệp</div>
                  <div className="text-[10px] font-normal text-slate-400 line-clamp-1">
                    Kích hoạt xử lý & soạn phát ngôn
                  </div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

