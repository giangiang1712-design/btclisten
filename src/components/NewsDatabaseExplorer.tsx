import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Search,
  Filter,
  Calendar,
  Layers,
  TrendingUp,
  TrendingDown,
  Clock,
  ExternalLink,
  Download,
  PlusCircle,
  Trash2,
  Copy,
  CheckCircle2,
  BarChart3,
  PieChart,
  FileText,
  Code2,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Building2,
  AlertCircle,
  AlertTriangle,
  Tag,
  Share2,
  X,
  Play,
  ArrowUpDown,
} from 'lucide-react';
import {
  NewsArticleRecord,
  NewsDbQueryCriteria,
  NewsDbQueryResult,
  NewsDbAnalyticsResult,
  ScrapedNewsItem,
  SectorType,
  SECTOR_NAMES,
} from '../types';
import { NewsDatabaseEngine, globalNewsDatabase } from '../lib/newsDatabase';
import { queryNewsDatabase, fetchNewsDatabaseAnalytics, insertArticleRecordToDb, deleteArticleRecordFromDb } from '../services/api';
import { queryArchivedNews, ArchivedNewsArticle, clearNewsArchiveFromCloud, deleteArticleFromArchive } from '../lib/newsArchiveService';
import { resetCollectionInCloud } from '../lib/firebase';
import { DatabaseAuditReport } from './DatabaseAuditReport';

interface NewsDatabaseExplorerProps {
  initialArticles?: ScrapedNewsItem[];
  onSelectArticleDeepDive?: (article: any) => void;
  onDatabaseResetStart?: () => void;
  onResetDatabase?: () => void;
  defaultTab?: 'analytics' | 'records' | 'query_builder' | 'playground' | 'insert' | 'schema_audit';
  hideHeroBanner?: boolean;
}

export const NewsDatabaseExplorer: React.FC<NewsDatabaseExplorerProps> = ({
  initialArticles = [],
  onSelectArticleDeepDive,
  onDatabaseResetStart,
  onResetDatabase,
  defaultTab = 'analytics',
  hideHeroBanner = false,
}) => {
  // Database instance reference
  const [dbEngine] = useState<NewsDatabaseEngine>(() => {
    const engine = new NewsDatabaseEngine();
    if (initialArticles && initialArticles.length > 0) {
      engine.insertBatch(initialArticles);
    }
    return engine;
  });

  // Active view tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'records' | 'query_builder' | 'playground' | 'insert' | 'schema_audit'>(defaultTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Structured Query Builder State
  const [qbMinSentimentScore, setQbMinSentimentScore] = useState<number>(-100);
  const [qbMaxSentimentScore, setQbMaxSentimentScore] = useState<number>(100);
  const [qbStartDate, setQbStartDate] = useState<string>('');
  const [qbEndDate, setQbEndDate] = useState<string>('');
  const [qbTimePreset, setQbTimePreset] = useState<string>('all');
  const [qbSelectedSectors, setQbSelectedSectors] = useState<string[]>([]);
  const [qbSmartCategory, setQbSmartCategory] = useState<'all' | 'chinh_sach' | 'dan_doanh_nghiep' | 'thi_truong'>('all');
  const [qbIsBrightSpotOnly, setQbIsBrightSpotOnly] = useState<boolean>(false);
  const [qbMinBrightSpotScore, setQbMinBrightSpotScore] = useState<number>(0);
  const [qbIsRiskOnly, setQbIsRiskOnly] = useState<boolean>(false);
  const [qbMinRiskScore, setQbMinRiskScore] = useState<number>(0);
  const [qbSearchQuery, setQbSearchQuery] = useState<string>('');

  // Structured Query Builder Results
  const [qbResults, setQbResults] = useState<ArchivedNewsArticle[]>([]);
  const [qbIsExecuting, setQbIsExecuting] = useState<boolean>(false);
  const [qbExecutionMs, setQbExecutionMs] = useState<number>(0);
  const [qbInspectedDoc, setQbInspectedDoc] = useState<ArchivedNewsArticle | null>(null);
  const [qbViewFormat, setQbViewFormat] = useState<'table' | 'json_ast'>('table');

  // Query Criteria State
  const [keyword, setKeyword] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [timePreset, setTimePreset] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
  const [selectedImpact, setSelectedImpact] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'publishedAt' | 'sentimentScore' | 'buzzScore' | 'impactScore' | 'title'>('publishedAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpPageInput, setJumpPageInput] = useState('1');
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    setJumpPageInput(String(currentPage));
  }, [currentPage]);

  // Results State
  const [queryResult, setQueryResult] = useState<NewsDbQueryResult>({
    articles: [],
    totalCount: 0,
    page: 1,
    pageSize: 15,
    totalPages: 1,
    executionTimeMs: 0,
    appliedCriteria: {},
    hasMore: false,
  });

  const [analyticsResult, setAnalyticsResult] = useState<NewsDbAnalyticsResult | null>(null);
  const [distinctSources, setDistinctSources] = useState<Array<{ source: string; count: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearingDb, setIsClearingDb] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [clearSuccessBanner, setClearSuccessBanner] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Selected article for preview modal
  const [previewArticle, setPreviewArticle] = useState<NewsArticleRecord | null>(null);

  // Playground state
  const [playgroundFunc, setPlaygroundFunc] = useState<'getArticlesByKeyword' | 'getArticlesByTimeRange' | 'getArticlesBySource' | 'analyzeNewsData'>('getArticlesByKeyword');
  const [playgroundKeyword, setPlaygroundKeyword] = useState('Trái phiếu');
  const [playgroundSource, setPlaygroundSource] = useState('Báo Đầu Tư');
  const [playgroundTimePreset, setPlaygroundTimePreset] = useState('24h');
  const [playgroundResultJson, setPlaygroundResultJson] = useState<string>('');
  const [playgroundExecutionMs, setPlaygroundExecutionMs] = useState<number>(0);

  // Insert form state
  const [insertForm, setInsertForm] = useState({
    title: '',
    content: '',
    source: 'Báo Đầu Tư',
    url: '',
    sector: 'macro',
    sentiment: 'bullish' as 'bullish' | 'bearish' | 'neutral',
    sentimentScore: 75,
    impactLevel: 'medium' as 'high' | 'medium' | 'low',
    publishedAt: new Date().toISOString().slice(0, 16),
  });
  const [insertSuccessMsg, setInsertSuccessMsg] = useState<string | null>(null);

  // Sync initial articles when prop updates
  useEffect(() => {
    if (initialArticles && initialArticles.length > 0) {
      dbEngine.clear();
      dbEngine.insertBatch(initialArticles);
      refreshDatabase();
    } else {
      dbEngine.clear();
      refreshDatabase();
    }
  }, [initialArticles]);

  // Execute Query Function
  const executeQuery = () => {
    setIsLoading(true);
    try {
      const criteria: NewsDbQueryCriteria = {
        keyword: keyword.trim() || undefined,
        sources: selectedSource !== 'all' ? [selectedSource] : undefined,
        sectors: selectedSector !== 'all' ? [selectedSector] : undefined,
        sentiments: selectedSentiment !== 'all' ? [selectedSentiment as any] : undefined,
        impactLevels: selectedImpact !== 'all' ? [selectedImpact as any] : undefined,
        timeFilter: {
          preset: timePreset as any,
        },
        sortBy,
        sortOrder,
        page: currentPage,
        pageSize,
      };

      // Local high-speed in-memory engine query
      const result = dbEngine.query(criteria);
      setQueryResult(result);

      // Distinct sources
      const sources = dbEngine.getDistinctSources();
      setDistinctSources(sources);

      // Multi-dimensional Analytics
      const analytics = dbEngine.analyzeNewsData(criteria);
      setAnalyticsResult(analytics);
    } catch (err) {
      console.error('Error executing query:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeQuery();
  }, [
    keyword,
    selectedSource,
    timePreset,
    selectedSector,
    selectedSentiment,
    selectedImpact,
    sortBy,
    sortOrder,
    currentPage,
    pageSize,
  ]);

  const refreshDatabase = () => {
    executeQuery();
  };

  const handleResetFilters = () => {
    setKeyword('');
    setSelectedSource('all');
    setTimePreset('all');
    setSelectedSector('all');
    setSelectedSentiment('all');
    setSelectedImpact('all');
    setSortBy('publishedAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleDeleteArticle = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi tin tức này khỏi cơ sở dữ liệu?')) {
      dbEngine.delete(id);
      globalNewsDatabase.delete(id);
      try {
        await Promise.all([
          deleteArticleRecordFromDb(id).catch(e => console.warn('Server delete error:', e)),
          deleteArticleFromArchive(id).catch(e => console.warn('Archive delete error:', e))
        ]);
      } catch (err) {
        console.warn('Error during article deletion:', err);
      }
      executeQuery();
    }
  };

  const handleCopyJson = (record: NewsArticleRecord) => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopiedId(record.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    const jsonStr = dbEngine.exportToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finpulse_news_database_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const csvStr = dbEngine.exportToCsv();
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finpulse_news_database_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmClearDatabase = async () => {
    setIsClearingDb(true);
    if (onDatabaseResetStart) {
      onDatabaseResetStart();
    }
    try {
      // 1. Wipe client in-memory engines immediately
      dbEngine.clear();
      globalNewsDatabase.clear();

      // 2. Set persistent 0-state flag and purge local storage caches
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('finpulse_is_database_reset_cleared', 'true');
          window.sessionStorage.removeItem('mof_scrape_data_cache');
          window.sessionStorage.clear();
          window.localStorage.removeItem('finpulse_scraped_news_archive');
          window.localStorage.removeItem('finpulse_scrape_sessions_history');
          window.localStorage.removeItem('finpulse_violation_dossiers');
        } catch (_) {}
      }

      // 3. Parallel complete server DB wipe and Cloud Firestore collections wipe
      const [serverResult, c1, c2, c3, c4] = await Promise.all([
        fetch('/api/db/clear', { method: 'POST' })
          .then(r => r.ok ? r.json() : { deletedCount: 0 })
          .catch(e => {
            console.warn('Could not call /api/db/clear:', e);
            return { deletedCount: 0 };
          }),
        resetCollectionInCloud('scraped_news_archive').catch(() => 0),
        resetCollectionInCloud('news_scrape_sessions').catch(() => 0),
        resetCollectionInCloud('scraped_news').catch(() => 0),
        resetCollectionInCloud('violation_dossiers').catch(() => 0)
      ]);

      const totalDeletedCount = (serverResult?.deletedCount || 0) + (c1 || 0) + (c2 || 0) + (c3 || 0) + (c4 || 0);
      console.log(`✅ [NewsDatabaseExplorer] Successfully cleared database: ${totalDeletedCount} records purged.`);

      // 4. Refresh internal queries and notify parent
      refreshDatabase();
      if (onResetDatabase) {
        onResetDatabase();
      }

      setClearSuccessBanner(`Đã xóa sạch toàn bộ cơ sở dữ liệu bài viết (${totalDeletedCount} bản ghi) về trạng thái 0 an toàn.`);
      setTimeout(() => {
        setClearSuccessBanner(null);
      }, 5000);
    } catch (err) {
      console.error('Error clearing database:', err);
      // Fallback state refresh even on network failure
      dbEngine.clear();
      globalNewsDatabase.clear();
      refreshDatabase();
      if (onResetDatabase) {
        onResetDatabase();
      }
    } finally {
      setIsClearingDb(false);
      setShowClearConfirmModal(false);
    }
  };

  // Execute Structured Query Builder
  const executeStructuredQuery = async () => {
    setQbIsExecuting(true);
    const t0 = performance.now();
    try {
      let startDateMs: number | undefined = undefined;
      let endDateMs: number | undefined = undefined;

      if (qbTimePreset !== 'custom' && qbTimePreset !== 'all') {
        const now = Date.now();
        switch (qbTimePreset) {
          case '24h': startDateMs = now - 24 * 3600 * 1000; break;
          case '7d': startDateMs = now - 7 * 24 * 3600 * 1000; break;
          case '30d': startDateMs = now - 30 * 24 * 3600 * 1000; break;
        }
      } else {
        if (qbStartDate) {
          const parsed = Date.parse(qbStartDate);
          if (!isNaN(parsed)) startDateMs = parsed;
        }
        if (qbEndDate) {
          const parsed = Date.parse(qbEndDate);
          if (!isNaN(parsed)) endDateMs = parsed + 86399000;
        }
      }

      const archiveCriteria = {
        sectors: qbSelectedSectors.length > 0 ? qbSelectedSectors : undefined,
        minSentimentScore: qbMinSentimentScore > -100 ? qbMinSentimentScore : undefined,
        maxSentimentScore: qbMaxSentimentScore < 100 ? qbMaxSentimentScore : undefined,
        startDateMs,
        endDateMs,
        smartCategory: qbSmartCategory,
        isBrightSpotOnly: qbIsBrightSpotOnly,
        minBrightSpotScore: qbMinBrightSpotScore > 0 ? qbMinBrightSpotScore : undefined,
        isRiskOnly: qbIsRiskOnly,
        minRiskScore: qbMinRiskScore > 0 ? qbMinRiskScore : undefined,
        searchQuery: qbSearchQuery.trim() || undefined,
        limit: 150
      };

      const articles = await queryArchivedNews(archiveCriteria);
      setQbResults(articles);
    } catch (err) {
      console.error('Failed to execute structured query:', err);
    } finally {
      const elapsed = Math.round((performance.now() - t0) * 100) / 100;
      setQbExecutionMs(elapsed);
      setQbIsExecuting(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'query_builder' && qbResults.length === 0 && !qbIsExecuting) {
      executeStructuredQuery();
    }
  }, [activeTab]);

  const toggleSector = (sectorKey: string) => {
    setQbSelectedSectors(prev =>
      prev.includes(sectorKey) ? prev.filter(s => s !== sectorKey) : [...prev, sectorKey]
    );
  };

  const handleSelectPresetSectors = (type: 'all' | 'none' | 'mof_core' | 'markets') => {
    if (type === 'all') {
      setQbSelectedSectors(Object.keys(SECTOR_NAMES));
    } else if (type === 'none') {
      setQbSelectedSectors([]);
    } else if (type === 'mof_core') {
      setQbSelectedSectors(['tax', 'customs', 'treasury', 'macro', 'price_management', 'public_debt', 'public_investment']);
    } else if (type === 'markets') {
      setQbSelectedSectors(['stocks', 'bonds', 'banking', 'realestate', 'insurance', 'gold']);
    }
  };

  const generatedQueryAst = useMemo(() => {
    let startDateMs: number | null = null;
    let endDateMs: number | null = null;

    if (qbTimePreset !== 'custom' && qbTimePreset !== 'all') {
      const now = Date.now();
      if (qbTimePreset === '24h') startDateMs = now - 24 * 3600 * 1000;
      else if (qbTimePreset === '7d') startDateMs = now - 7 * 24 * 3600 * 1000;
      else if (qbTimePreset === '30d') startDateMs = now - 30 * 24 * 3600 * 1000;
    } else {
      if (qbStartDate) startDateMs = Date.parse(qbStartDate) || null;
      if (qbEndDate) endDateMs = (Date.parse(qbEndDate) || null) ? (Date.parse(qbEndDate) + 86399000) : null;
    }

    const whereConditions: string[] = [];
    if (qbMinSentimentScore > -100 || qbMaxSentimentScore < 100) {
      whereConditions.push(`sentimentScore BETWEEN ${qbMinSentimentScore} AND ${qbMaxSentimentScore}`);
    }
    if (qbSelectedSectors.length > 0) {
      whereConditions.push(`sector IN (${qbSelectedSectors.map(s => `'${s}'`).join(', ')})`);
    }
    if (startDateMs) {
      whereConditions.push(`publishedTimestamp >= ${startDateMs} /* ${new Date(startDateMs).toLocaleDateString('vi-VN')} */`);
    }
    if (endDateMs) {
      whereConditions.push(`publishedTimestamp <= ${endDateMs} /* ${new Date(endDateMs).toLocaleDateString('vi-VN')} */`);
    }
    if (qbSmartCategory !== 'all') {
      whereConditions.push(`smartCategory = '${qbSmartCategory}'`);
    }
    if (qbIsBrightSpotOnly) {
      whereConditions.push(`isBrightSpot = true`);
    }
    if (qbMinBrightSpotScore > 0) {
      whereConditions.push(`brightSpotScore >= ${qbMinBrightSpotScore}`);
    }
    if (qbIsRiskOnly) {
      whereConditions.push(`isRisk = true`);
    }
    if (qbMinRiskScore > 0) {
      whereConditions.push(`riskScore >= ${qbMinRiskScore}`);
    }
    if (qbSearchQuery.trim()) {
      whereConditions.push(`(title LIKE '%${qbSearchQuery.trim()}%' OR summary LIKE '%${qbSearchQuery.trim()}%')`);
    }

    const sqlStr = `SELECT id, title, source, sector, sentiment, sentimentScore,\n       publishedAt, isBrightSpot, brightSpotScore, isRisk, riskScore\nFROM scraped_news_archive\n${whereConditions.length > 0 ? 'WHERE ' + whereConditions.join('\n  AND ') + '\n' : ''}ORDER BY publishedTimestamp DESC\nLIMIT 150;`;

    const jsonAst = {
      targetCollection: 'scraped_news_archive',
      schemaVersion: 1,
      filters: {
        sentimentRange: { min: qbMinSentimentScore, max: qbMaxSentimentScore },
        dateWindow: { startDate: qbStartDate || null, endDate: qbEndDate || null, preset: qbTimePreset, startDateMs, endDateMs },
        sectors: qbSelectedSectors.length > 0 ? qbSelectedSectors : 'ALL_18_SECTORS',
        smartCategory: qbSmartCategory,
        brightSpot: { required: qbIsBrightSpotOnly, minScore: qbMinBrightSpotScore },
        risk: { required: qbIsRiskOnly, minScore: qbMinRiskScore },
        searchQuery: qbSearchQuery.trim() || null
      },
      orderBy: [{ field: 'publishedTimestamp', direction: 'desc' }],
      limit: 150
    };

    return { sqlStr, jsonAst };
  }, [
    qbMinSentimentScore,
    qbMaxSentimentScore,
    qbStartDate,
    qbEndDate,
    qbTimePreset,
    qbSelectedSectors,
    qbSmartCategory,
    qbIsBrightSpotOnly,
    qbMinBrightSpotScore,
    qbIsRiskOnly,
    qbMinRiskScore,
    qbSearchQuery
  ]);

  // Run Function in Playground
  const runPlaygroundFunction = () => {
    const t0 = performance.now();
    let result: any = null;

    if (playgroundFunc === 'getArticlesByKeyword') {
      result = dbEngine.getArticlesByKeyword(playgroundKeyword, { pageSize: 5 });
    } else if (playgroundFunc === 'getArticlesByTimeRange') {
      const now = Date.now();
      const hours = playgroundTimePreset === '4h' ? 4 : playgroundTimePreset === '24h' ? 24 : 7 * 24;
      result = dbEngine.getArticlesByTimeRange(now - hours * 3600 * 1000, now, { pageSize: 5 });
    } else if (playgroundFunc === 'getArticlesBySource') {
      result = dbEngine.getArticlesBySource(playgroundSource, { pageSize: 5 });
    } else if (playgroundFunc === 'analyzeNewsData') {
      result = dbEngine.analyzeNewsData();
    }

    const elapsed = Math.round((performance.now() - t0) * 100) / 100;
    setPlaygroundExecutionMs(elapsed);
    setPlaygroundResultJson(JSON.stringify(result, null, 2));
  };

  // Handle Form Insertion
  const handleInsertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insertForm.title.trim()) return;

    const pubMs = Date.parse(insertForm.publishedAt) || Date.now();

    const newRecord: Partial<NewsArticleRecord> = {
      title: insertForm.title,
      content: insertForm.content || insertForm.title,
      summary: insertForm.content.slice(0, 200) || insertForm.title,
      source: insertForm.source,
      url: insertForm.url || `https://www.google.com/search?q=${encodeURIComponent(insertForm.title)}`,
      sector: insertForm.sector,
      sentiment: insertForm.sentiment,
      sentimentScore: Number(insertForm.sentimentScore),
      impactLevel: insertForm.impactLevel,
      publishedAt: new Date(pubMs).toISOString(),
      publishedTimestamp: pubMs,
      publishedTimeStr: new Date(pubMs).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    const inserted = dbEngine.insert(newRecord);
    insertArticleRecordToDb(inserted).catch(() => {});

    setInsertSuccessMsg(`Đã thêm thành công bản ghi: "${inserted.title.slice(0, 40)}..." (ID: ${inserted.id})`);
    setTimeout(() => setInsertSuccessMsg(null), 4000);

    setInsertForm({
      title: '',
      content: '',
      source: 'Báo Đầu Tư',
      url: '',
      sector: 'macro',
      sentiment: 'bullish',
      sentimentScore: 75,
      impactLevel: 'medium',
      publishedAt: new Date().toISOString().slice(0, 16),
    });

    executeQuery();
  };

  const totalDbCount = dbEngine.count();

  return (
    <div id="news-database-explorer-root" className="space-y-6">
      {/* Success Notification Banner */}
      {clearSuccessBanner && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span className="flex-1 font-medium">{clearSuccessBanner}</span>
          <button
            onClick={() => setClearSuccessBanner(null)}
            className="p-1 hover:bg-emerald-500/20 rounded-lg text-emerald-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      {!hideHeroBanner && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-100">Cơ Sở Dữ Liệu Tin Tức Quét (Financial News DB)</h2>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live In-Memory + Disk Sync
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Lưu trữ đầy đủ các trường: Tiêu đề, Nội dung, URL, Thời gian đăng, Nguồn tin. Tích hợp sẵn bộ hàm truy vấn và phân tích đa chiều.
                </p>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Xuất cơ sở dữ liệu định dạng JSON"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                Xuất JSON
              </button>
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Xuất cơ sở dữ liệu định dạng CSV"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                Xuất CSV
              </button>
              <button
                onClick={refreshDatabase}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
              <button
                onClick={() => setShowClearConfirmModal(true)}
                disabled={isClearingDb}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-600/20 hover:bg-red-600/30 disabled:opacity-50 text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg transition-colors cursor-pointer"
                title="Xóa toàn bộ bài viết trong cơ sở dữ liệu về 0"
              >
                {isClearingDb ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    Xóa Sạch DB
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Status Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800 text-xs">
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
              <span className="text-slate-400 block mb-0.5">Tổng số bản ghi DB</span>
              <span className="text-lg font-bold text-amber-400">{totalDbCount}</span>
              <span className="text-slate-500 text-[11px] block mt-0.5">Bài viết đã cào & làm giàu</span>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
              <span className="text-slate-400 block mb-0.5">Nguồn tin tức độc lập</span>
              <span className="text-lg font-bold text-blue-400">{distinctSources.length}</span>
              <span className="text-slate-500 text-[11px] block mt-0.5">Đầu báo & Cổng TT chính thức</span>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
              <span className="text-slate-400 block mb-0.5">Khớp bộ lọc hiện tại</span>
              <span className="text-lg font-bold text-emerald-400">{queryResult.totalCount}</span>
              <span className="text-slate-500 text-[11px] block mt-0.5">Bản ghi thỏa mãn tiêu chí</span>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
              <span className="text-slate-400 block mb-0.5">Tốc độ truy vấn (Latency)</span>
              <span className="text-lg font-bold text-purple-400">{queryResult.executionTimeMs} ms</span>
              <span className="text-slate-500 text-[11px] block mt-0.5">Inverted Index Memory Engine</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation View Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'analytics'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 dark:border-amber-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Dashboard Phân Tích Dữ Liệu
        </button>

        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'records'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 dark:border-amber-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Bảng Dữ Liệu Bản Ghi ({queryResult.totalCount})
        </button>

        <button
          onClick={() => setActiveTab('query_builder')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'query_builder'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 dark:border-amber-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-500" />
          Structured Query Builder (Trình Dựng Truy Vấn Cấu Trúc DB)
        </button>

        <button
          onClick={() => setActiveTab('playground')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'playground'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 dark:border-amber-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Trình Thử Nghiệm Hàm Truy Vấn
        </button>

        <button
          onClick={() => setActiveTab('insert')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'insert'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 dark:border-amber-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Thêm Bản Ghi Mới
        </button>

        <button
          onClick={() => setActiveTab('schema_audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'schema_audit'
              ? 'border-indigo-500 text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          Chuẩn Hóa & Chất Lượng Dữ Liệu
        </button>
      </div>

      {/* Multi-Criteria Filter Bar (Applicable for Analytics & Records tabs) */}
      {(activeTab === 'analytics' || activeTab === 'records') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <SlidersHorizontal className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Bộ Lọc Truy Vấn Đa Tiêu Chí (Multi-Criteria Query Console)</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
            >
              Đặt lại bộ lọc
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Keyword Filter */}
            <div className="relative">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Từ khóa (Keyword)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Tìm theo tiêu đề, nội dung, thực thể..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                {keyword && (
                  <button
                    onClick={() => setKeyword('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Source Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Nguồn tin (Source)
              </label>
              <select
                value={selectedSource}
                onChange={(e) => {
                  setSelectedSource(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="all">Tất cả nguồn ({totalDbCount})</option>
                {distinctSources.map((item) => (
                  <option key={item.source} value={item.source}>
                    {item.source} ({item.count})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Time Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Khoảng thời gian (Time Range)
              </label>
              <select
                value={timePreset}
                onChange={(e) => {
                  setTimePreset(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="all">Toàn bộ dữ liệu</option>
                <option value="1h">1 giờ qua</option>
                <option value="4h">4 giờ qua</option>
                <option value="8h">8 giờ qua</option>
                <option value="24h">24 giờ qua</option>
                <option value="7d">7 ngày qua</option>
                <option value="30d">30 ngày qua</option>
              </select>
            </div>

            {/* 4. Sector Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Lĩnh vực (Sector)
              </label>
              <select
                value={selectedSector}
                onChange={(e) => {
                  setSelectedSector(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="all">Tất cả lĩnh vực (18 Quản lý ngành)</option>
                {Object.entries(SECTOR_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Secondary Filter Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Sắc thái:</span>
                <select
                  value={selectedSentiment}
                  onChange={(e) => {
                    setSelectedSentiment(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="py-1 px-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                >
                  <option value="all">Tất cả</option>
                  <option value="bullish">Tích cực (Bullish)</option>
                  <option value="bearish">Tiêu cực (Bearish)</option>
                  <option value="neutral">Trung tính (Neutral)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Mức tác động:</span>
                <select
                  value={selectedImpact}
                  onChange={(e) => {
                    setSelectedImpact(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="py-1 px-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                >
                  <option value="all">Tất cả</option>
                  <option value="high">Cao (High)</option>
                  <option value="medium">Trung bình (Medium)</option>
                  <option value="low">Thấp (Low)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">Hiển thị/trang:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="py-1 px-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
              >
                <option value={15}>15 tin</option>
                <option value={50}>50 tin</option>
                <option value={100}>100 tin</option>
                <option value={250}>250 tin</option>
                <option value={500}>500 tin</option>
                <option value={1000}>1.000 tin</option>
                <option value={3000}>3.000 tin (Tối đa)</option>
              </select>

              <span className="text-slate-500 ml-1">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-1 px-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
              >
                <option value="publishedAt">Thời gian đăng</option>
                <option value="sentimentScore">Điểm sắc thái</option>
                <option value="impactScore">Điểm tác động</option>
                <option value="buzzScore">Điểm lan tỏa</option>
                <option value="title">Tiêu đề (A-Z)</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700 rounded"
                title={`Thứ tự: ${sortOrder === 'desc' ? 'Giảm dần' : 'Tăng dần'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: ANALYTICS & INTELLIGENCE DASHBOARD */}
      {/* ===================================================================== */}
      {activeTab === 'analytics' && analyticsResult && (
        <div className="space-y-6">
          {/* Executive Insights Banner */}
          {analyticsResult.executiveInsights.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-300 mb-2">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Nhận Định & Khuyến Nghị Tham Mưu Từ Dữ Liệu Quét</span>
              </div>
              <ul className="space-y-1.5 text-xs text-amber-900 dark:text-amber-200/90 list-disc list-inside">
                {analyticsResult.executiveInsights.map((insight, i) => (
                  <li key={i}>{insight}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Grid of Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Source Breakdown Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  Phân Bố Nguồn Tin Tức (Sources)
                </h3>
                <span className="text-xs text-slate-400">{analyticsResult.uniqueSourcesCount} nguồn</span>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {analyticsResult.sourceDistribution.slice(0, 8).map((src) => (
                  <div key={src.source} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[170px]">
                        {src.source}
                      </span>
                      <span className="text-slate-500 font-semibold">
                        {src.count} bài ({src.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, src.percentage * 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Sentiment Mood Breakdown */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-emerald-500" />
                  Sắc Thái Cảm Xúc (Sentiment)
                </h3>
                <span className="text-xs font-bold text-amber-500">
                  Mood: {analyticsResult.sentimentBreakdown.marketMoodScore}/100
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-2">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-2.5">
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold block">Tích Cực</span>
                  <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                    {analyticsResult.sentimentBreakdown.bullishPercentage}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">{analyticsResult.sentimentBreakdown.bullish} bài</span>
                </div>

                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-lg p-2.5">
                  <span className="text-rose-600 dark:text-rose-400 text-xs font-bold block">Tiêu Cực</span>
                  <span className="text-lg font-extrabold text-rose-700 dark:text-rose-300">
                    {analyticsResult.sentimentBreakdown.bearishPercentage}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">{analyticsResult.sentimentBreakdown.bearish} bài</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5">
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-bold block">Trung Tính</span>
                  <span className="text-lg font-extrabold text-slate-700 dark:text-slate-300">
                    {analyticsResult.sentimentBreakdown.neutralPercentage}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">{analyticsResult.sentimentBreakdown.neutral} bài</span>
                </div>
              </div>

              <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Tác động cao (High Impact):</span>
                  <span className="font-semibold text-rose-500">{analyticsResult.impactBreakdown.high} bài</span>
                </div>
                <div className="flex justify-between">
                  <span>Tác động trung bình:</span>
                  <span className="font-semibold text-amber-500">{analyticsResult.impactBreakdown.medium} bài</span>
                </div>
              </div>
            </div>

            {/* 3. Hot Entities & Keywords */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-purple-500" />
                  Top Từ Khóa & Cơ Quan Quản Lý
                </h3>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 block">Từ khóa trọng tâm:</span>
                <div className="flex flex-wrap gap-1.5">
                  {analyticsResult.topKeywords.map((kw) => (
                    <button
                      key={kw.keyword}
                      onClick={() => {
                        setKeyword(kw.keyword);
                        setActiveTab('records');
                      }}
                      className="px-2 py-0.5 text-xs bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 rounded-full hover:bg-purple-100 transition-colors"
                    >
                      {kw.keyword} ({kw.count})
                    </button>
                  ))}
                </div>

                <span className="text-[11px] font-semibold text-slate-500 block pt-2">Cơ quan liên quan:</span>
                <div className="flex flex-wrap gap-1.5">
                  {analyticsResult.topEntities.agencies.slice(0, 5).map((ag) => (
                    <span
                      key={ag.name}
                      className="px-2 py-0.5 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700"
                    >
                      {ag.name} ({ag.count})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Bar Distribution */}
          {analyticsResult.timelineDistribution.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                Dòng Thời Gian Xuất Bản & Mật Độ Tin Tức
              </h3>

              <div className="grid grid-cols-6 gap-2">
                {analyticsResult.timelineDistribution.map((point) => (
                  <div key={point.timestamp} className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">{point.timeLabel}</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 block my-1">
                      {point.totalCount}
                    </span>
                    <div className="flex justify-center gap-1 text-[10px]">
                      <span className="text-emerald-500 font-semibold">{point.bullishCount}▲</span>
                      <span className="text-rose-500 font-semibold">{point.bearishCount}▼</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: ARTICLES DATA RECORDS TABLE & CARDS */}
      {/* ===================================================================== */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Hiển thị {queryResult.articles.length} / {queryResult.totalCount} bản ghi (Trang {queryResult.page}/{queryResult.totalPages})
              </span>
              <span className="text-slate-500">
                Thời gian thực thi truy vấn: {queryResult.executionTimeMs}ms
              </span>
            </div>

            {queryResult.articles.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                <p className="font-semibold">Không tìm thấy bài viết nào khớp với tiêu chí tìm kiếm.</p>
                <button
                  onClick={handleResetFilters}
                  className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline"
                >
                  Xóa bộ lọc để xem toàn bộ dữ liệu
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {queryResult.articles.map((article) => (
                  <div
                    key={article.id}
                    className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {article.source}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {article.publishedTimeStr || article.timeAgo} ({new Date(article.publishedTimestamp).toLocaleDateString('vi-VN')})
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                              article.sentiment === 'bullish'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                                : article.sentiment === 'bearish'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {article.sentiment === 'bullish' ? 'Tích cực' : article.sentiment === 'bearish' ? 'Tiêu cực' : 'Trung tính'} ({article.sentimentScore || 70}đ)
                          </span>
                          {article.impactLevel === 'high' && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-500 text-white">
                              Tác động cao
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {article.id.slice(0, 14)}...
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          {article.title}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {article.summary || article.content || article.snippet}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 pt-1">
                        <button
                          onClick={() => setPreviewArticle(article)}
                          className="px-2.5 py-1 text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                          Chi tiết
                        </button>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Mở đường link bài viết gốc"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleCopyJson(article)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Sao chép JSON bản ghi"
                        >
                          {copiedId === article.id ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Xóa bản ghi khỏi DB"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {queryResult.totalPages > 1 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const pageNum = parseInt(jumpPageInput, 10);
                    if (!isNaN(pageNum)) {
                      const validPage = Math.max(1, Math.min(queryResult.totalPages, pageNum));
                      setCurrentPage(validPage);
                      setJumpPageInput(String(validPage));
                    } else {
                      setJumpPageInput(String(currentPage));
                    }
                  }}
                  className="flex items-center gap-1.5"
                >
                  <span className="text-slate-600 dark:text-slate-400">Chuyển đến trang:</span>
                  <input
                    type="number"
                    min={1}
                    max={queryResult.totalPages}
                    value={jumpPageInput}
                    onChange={(e) => {
                      setJumpPageInput(e.target.value);
                      const p = parseInt(e.target.value, 10);
                      if (!isNaN(p) && p >= 1 && p <= queryResult.totalPages) {
                        setCurrentPage(p);
                      }
                    }}
                    onBlur={() => {
                      const p = parseInt(jumpPageInput, 10);
                      if (isNaN(p) || p < 1) {
                        setCurrentPage(1);
                        setJumpPageInput('1');
                      } else if (p > queryResult.totalPages) {
                        setCurrentPage(queryResult.totalPages);
                        setJumpPageInput(String(queryResult.totalPages));
                      } else {
                        setCurrentPage(p);
                      }
                    }}
                    placeholder={String(currentPage)}
                    className="w-14 px-2 py-1 text-center font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-slate-400 font-mono">/ {queryResult.totalPages}</span>
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded-lg font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition cursor-pointer"
                  >
                    Chuyển
                  </button>
                </form>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(1)}
                    title="Về trang đầu"
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Đầu
                  </button>
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Trang trước
                  </button>

                  <span className="px-2 font-mono font-bold text-slate-700 dark:text-slate-300">
                    Trang {currentPage} / {queryResult.totalPages}
                  </span>

                  <button
                    disabled={currentPage >= queryResult.totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(queryResult.totalPages, p + 1))}
                    className="px-3 py-1.5 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Trang tiếp
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={currentPage >= queryResult.totalPages}
                    onClick={() => setCurrentPage(queryResult.totalPages)}
                    title={`Đến trang cuối (${queryResult.totalPages})`}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Cuối
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: STRUCTURED QUERY BUILDER (QUERY CONSOLE FOR STORED NEWS) */}
      {/* ===================================================================== */}
      {activeTab === 'query_builder' && (
        <div className="space-y-6">
          {/* Top Banner & Control Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
                  <SlidersHorizontal className="w-5 h-5" />
                  <span>Trình Dựng Truy Vấn Cấu Trúc Tin Tức (Structured Query Builder)</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Xây dựng bộ lọc đa tiêu chí cho cơ sở dữ liệu tin tức đã quét (`scraped_news_archive`). Tìm kiếm theo dải sắc thái, cửa sổ thời gian, lĩnh vực quản lý MoF, và phân loại điểm sáng/rủi ro.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={executeStructuredQuery}
                  disabled={qbIsExecuting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  <Play className={`w-4 h-4 ${qbIsExecuting ? 'animate-spin' : ''}`} />
                  {qbIsExecuting ? 'Đang truy vấn...' : 'Thực Thi Truy Vấn Cấu Trúc'}
                </button>
              </div>
            </div>

            {/* Filter Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
              {/* Card 1: Sentiment Score Range */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Dải Điểm Sắc Thái Sentiment (-100 đến +100)
                  </label>
                  <span className="text-xs text-amber-400 font-mono font-bold">
                    [{qbMinSentimentScore} : {qbMaxSentimentScore}]
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Thấp nhất (Min):</span>
                    <input
                      type="number"
                      min={-100}
                      max={qbMaxSentimentScore}
                      value={qbMinSentimentScore}
                      onChange={(e) => setQbMinSentimentScore(Number(e.target.value))}
                      className="w-full py-1.5 px-2 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Cao nhất (Max):</span>
                    <input
                      type="number"
                      min={qbMinSentimentScore}
                      max={100}
                      value={qbMaxSentimentScore}
                      onChange={(e) => setQbMaxSentimentScore(Number(e.target.value))}
                      className="w-full py-1.5 px-2 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Sentiment Preset Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    onClick={() => { setQbMinSentimentScore(-100); setQbMaxSentimentScore(100); }}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded"
                  >
                    Tất cả (-100..100)
                  </button>
                  <button
                    onClick={() => { setQbMinSentimentScore(-100); setQbMaxSentimentScore(-30); }}
                    className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] rounded border border-rose-500/30"
                  >
                    Rủi ro (-100..-30)
                  </button>
                  <button
                    onClick={() => { setQbMinSentimentScore(-29); setQbMaxSentimentScore(29); }}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded"
                  >
                    Trung tính (-29..29)
                  </button>
                  <button
                    onClick={() => { setQbMinSentimentScore(30); setQbMaxSentimentScore(100); }}
                    className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] rounded border border-emerald-500/30"
                  >
                    Tích cực (+30..100)
                  </button>
                </div>
              </div>

              {/* Card 2: Date Window */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    Cửa Sổ Thời Gian (Date Window)
                  </label>
                  <span className="text-xs text-blue-400 font-mono">
                    {qbTimePreset.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Mốc thời gian mẫu:</span>
                    <select
                      value={qbTimePreset}
                      onChange={(e) => setQbTimePreset(e.target.value)}
                      className="w-full py-1.5 px-2 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="all">Tất cả thời gian</option>
                      <option value="24h">24 giờ qua</option>
                      <option value="7d">7 ngày qua</option>
                      <option value="30d">30 ngày qua</option>
                      <option value="custom">Tùy chỉnh khoảng ngày</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Danh mục thông minh:</span>
                    <select
                      value={qbSmartCategory}
                      onChange={(e) => setQbSmartCategory(e.target.value as any)}
                      className="w-full py-1.5 px-2 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="all">Tất cả danh mục</option>
                      <option value="chinh_sach">Chính sách & Pháp quy</option>
                      <option value="dan_doanh_nghiep">Dân số & Doanh nghiệp</option>
                      <option value="thi_truong">Thị trường Tài chính</option>
                    </select>
                  </div>
                </div>

                {/* Custom Date Pickers */}
                {qbTimePreset === 'custom' && (
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800">
                    <div>
                      <span className="text-slate-400 block mb-1">Từ ngày:</span>
                      <input
                        type="date"
                        value={qbStartDate}
                        onChange={(e) => setQbStartDate(e.target.value)}
                        className="w-full py-1 px-2 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Đến ngày:</span>
                      <input
                        type="date"
                        value={qbEndDate}
                        onChange={(e) => setQbEndDate(e.target.value)}
                        className="w-full py-1 px-2 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Card 3: Bright Spot & Risk Thresholds + Search */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 space-y-3">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Điểm Sáng, Rủi Ro & Từ Khóa Cụ Thể
                </label>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={qbIsBrightSpotOnly}
                        onChange={(e) => setQbIsBrightSpotOnly(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Chỉ bài viết Điểm Sáng</span>
                    </label>
                    {qbIsBrightSpotOnly && (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 text-[11px]">Min Score:</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={qbMinBrightSpotScore}
                          onChange={(e) => setQbMinBrightSpotScore(Number(e.target.value))}
                          className="w-12 py-0.5 px-1 bg-slate-800 border border-slate-700 text-amber-400 text-[11px] rounded text-center"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={qbIsRiskOnly}
                        onChange={(e) => setQbIsRiskOnly(e.target.checked)}
                        className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                      />
                      <span>Chỉ bài viết Cảnh Báo Rủi Ro</span>
                    </label>
                    {qbIsRiskOnly && (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 text-[11px]">Min Score:</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={qbMinRiskScore}
                          onChange={(e) => setQbMinRiskScore(Number(e.target.value))}
                          className="w-12 py-0.5 px-1 bg-slate-800 border border-slate-700 text-rose-400 text-[11px] rounded text-center"
                        />
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={qbSearchQuery}
                      onChange={(e) => setQbSearchQuery(e.target.value)}
                      placeholder="Từ khóa, mã cổ phiếu, từ ngữ pháp quy..."
                      className="w-full py-1.5 px-3 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sector Pills Selection Section */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Chọn Cụ thể Lĩnh Vực ({qbSelectedSectors.length} / {Object.keys(SECTOR_NAMES).length} đã chọn)</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    onClick={() => handleSelectPresetSectors('all')}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                  >
                    Chọn tất cả
                  </button>
                  <button
                    onClick={() => handleSelectPresetSectors('mof_core')}
                    className="px-2 py-0.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded border border-amber-500/30"
                  >
                    Cụm Thuế/Hải Quan/Kho Bạc
                  </button>
                  <button
                    onClick={() => handleSelectPresetSectors('markets')}
                    className="px-2 py-0.5 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded border border-blue-500/30"
                  >
                    Cụm Thị Trường
                  </button>
                  <button
                    onClick={() => handleSelectPresetSectors('none')}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {Object.entries(SECTOR_NAMES).map(([key, name]) => {
                  const isSelected = qbSelectedSectors.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleSector(key)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Result Tabs & AST Preview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQbViewFormat('table')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    qbViewFormat === 'table'
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                  }`}
                >
                  Kết Quả Lọc ({qbResults.length} bản ghi)
                </button>
                <button
                  onClick={() => setQbViewFormat('json_ast')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    qbViewFormat === 'json_ast'
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                  }`}
                >
                  Trình Xem SQL & AST Query Object
                </button>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-3 font-mono">
                <span>Khớp: <strong className="text-amber-500">{qbResults.length}</strong> bài</span>
                <span>Thời gian: <strong className="text-emerald-500">{qbExecutionMs} ms</strong></span>
              </div>
            </div>

            {/* FORMAT 1: DATA TABLE */}
            {qbViewFormat === 'table' && (
              <div>
                {qbResults.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                    <Search className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">Không tìm thấy bản ghi thỏa mãn tiêu chí bộ lọc cấu trúc.</p>
                    <p className="text-[11px] text-slate-400">Hãy điều chỉnh dải điểm sắc thái, mở rộng thời gian hoặc chọn thêm lĩnh vực.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                          <th className="p-3">Bài viết & Nguồn</th>
                          <th className="p-3">Lĩnh vực</th>
                          <th className="p-3">Sắc thái (Score)</th>
                          <th className="p-3">Đặc trưng</th>
                          <th className="p-3">Thời gian đăng</th>
                          <th className="p-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {qbResults.map((art) => (
                          <tr key={art.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 max-w-sm">
                              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                                {art.source}
                              </span>
                              <span className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                                {art.title}
                              </span>
                            </td>

                            <td className="p-3">
                              <span className="px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                                {art.sectorNameVi || art.sector}
                              </span>
                            </td>

                            <td className="p-3 font-mono">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                                  art.sentiment === 'bullish'
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                    : art.sentiment === 'bearish'
                                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                    : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                }`}>
                                  {art.sentimentScore > 0 ? `+${art.sentimentScore}` : art.sentimentScore}đ
                                </span>
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {art.isBrightSpot && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                                    Điểm sáng ({art.brightSpotScore || 0})
                                  </span>
                                )}
                                {art.isRisk && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">
                                    Rủi ro ({art.riskScore || 0})
                                  </span>
                                )}
                                {!art.isBrightSpot && !art.isRisk && (
                                  <span className="text-slate-400 text-[11px]">-</span>
                                )}
                              </div>
                            </td>

                            <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px]">
                              {new Date(art.publishedTimestamp || art.scrapedAt).toLocaleDateString('vi-VN')}
                            </td>

                            <td className="p-3 text-right">
                              <button
                                onClick={() => setQbInspectedDoc(art)}
                                className="px-2.5 py-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-slate-950 font-bold text-[11px] rounded transition-all border border-amber-500/20"
                              >
                                Chi tiết JSON
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* FORMAT 2: SQL & JSON AST INSPECTOR */}
            {qbViewFormat === 'json_ast' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* SQL Equivalent Query */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    Truy Vấn Tương Đương ANSI SQL:
                  </span>
                  <pre className="p-4 bg-slate-950 text-amber-400 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                    {generatedQueryAst.sqlStr}
                  </pre>
                </div>

                {/* Structured JSON Query Criteria AST */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    Structured Query Criteria Object (Firestore Schema AST):
                  </span>
                  <pre className="p-4 bg-slate-950 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed max-h-80">
                    {JSON.stringify(generatedQueryAst.jsonAst, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Modal for Inspecting Single Raw Document JSON */}
          {qbInspectedDoc && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-amber-400 font-mono text-xs font-bold block">
                      scraped_news_archive / {qbInspectedDoc.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-100 truncate max-w-md">
                      {qbInspectedDoc.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setQbInspectedDoc(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-2">
                    Raw Document Payload Schema (Firestore Record):
                  </span>
                  <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed max-h-96">
                    {JSON.stringify(qbInspectedDoc, null, 2)}
                  </pre>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(qbInspectedDoc, null, 2));
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Sao Chép Document JSON
                  </button>

                  <button
                    onClick={() => setQbInspectedDoc(null)}
                    className="px-4 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: QUERY FUNCTIONS PLAYGROUND & CODE STUDIO */}
      {/* ===================================================================== */}
      {activeTab === 'playground' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Trình Thử Nghiệm Hàm Truy Vấn Cơ Sở Dữ Liệu (Query Functions Studio)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kiểm thử trực quan các hàm truy vấn theo từ khóa, thời gian, nguồn tin và phân tích dữ liệu được xây dựng sẵn trong lớp ArticleDatabaseManager.
              </p>
            </div>

            {/* Function Selector */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
              <button
                onClick={() => setPlaygroundFunc('getArticlesByKeyword')}
                className={`p-3 text-left rounded-xl border text-xs transition-all ${
                  playgroundFunc === 'getArticlesByKeyword'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="font-mono block text-amber-600 dark:text-amber-400 mb-0.5">1. getArticlesByKeyword()</span>
                <span>Truy vấn theo từ khóa</span>
              </button>

              <button
                onClick={() => setPlaygroundFunc('getArticlesByTimeRange')}
                className={`p-3 text-left rounded-xl border text-xs transition-all ${
                  playgroundFunc === 'getArticlesByTimeRange'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="font-mono block text-amber-600 dark:text-amber-400 mb-0.5">2. getArticlesByTimeRange()</span>
                <span>Truy vấn theo thời gian</span>
              </button>

              <button
                onClick={() => setPlaygroundFunc('getArticlesBySource')}
                className={`p-3 text-left rounded-xl border text-xs transition-all ${
                  playgroundFunc === 'getArticlesBySource'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="font-mono block text-amber-600 dark:text-amber-400 mb-0.5">3. getArticlesBySource()</span>
                <span>Truy vấn theo nguồn tin</span>
              </button>

              <button
                onClick={() => setPlaygroundFunc('analyzeNewsData')}
                className={`p-3 text-left rounded-xl border text-xs transition-all ${
                  playgroundFunc === 'analyzeNewsData'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="font-mono block text-amber-600 dark:text-amber-400 mb-0.5">4. analyzeNewsData()</span>
                <span>Phân tích dữ liệu & insights</span>
              </button>
            </div>

            {/* Parameter Inputs based on selected function */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              {playgroundFunc === 'getArticlesByKeyword' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tham số: keyword (chuỗi từ khóa tìm kiếm)
                  </label>
                  <input
                    type="text"
                    value={playgroundKeyword}
                    onChange={(e) => setPlaygroundKeyword(e.target.value)}
                    placeholder="Ví dụ: Trái phiếu, Nâng hạng TTCK, Thuế, Lãi suất..."
                    className="w-full py-2 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}

              {playgroundFunc === 'getArticlesByTimeRange' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tham số: Khoảng thời gian (Time Range Preset)
                  </label>
                  <select
                    value={playgroundTimePreset}
                    onChange={(e) => setPlaygroundTimePreset(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="4h">4 giờ qua (4 hours ago to now)</option>
                    <option value="24h">24 giờ qua (24 hours ago to now)</option>
                    <option value="7d">7 ngày qua (7 days ago to now)</option>
                  </select>
                </div>
              )}

              {playgroundFunc === 'getArticlesBySource' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tham số: source (tên nguồn tin tức)
                  </label>
                  <select
                    value={playgroundSource}
                    onChange={(e) => setPlaygroundSource(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    {distinctSources.map((s) => (
                      <option key={s.source} value={s.source}>
                        {s.source} ({s.count} bài)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {playgroundFunc === 'analyzeNewsData' && (
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Hàm này sẽ thực hiện phân tích đa chiều trên toàn bộ cơ sở dữ liệu: tổng hợp nguồn, dòng thời gian, phân tích sắc thái cảm xúc, top từ khóa và khuyến nghị tham mưu.
                </div>
              )}

              <button
                onClick={runPlaygroundFunction}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-colors shadow"
              >
                <Play className="w-3.5 h-3.5" />
                Thực Thi Hàm (Execute Function)
              </button>
            </div>

            {/* Execution Result Viewer */}
            {playgroundResultJson && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Kết quả trả về (JSON Response) — Thời gian thực thi: <span className="text-amber-500 font-bold">{playgroundExecutionMs} ms</span>
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(playgroundResultJson)}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
                  >
                    Sao chép JSON
                  </button>
                </div>

                <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96 border border-slate-800">
                  {playgroundResultJson}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: INSERT NEW RECORD FORM */}
      {/* ===================================================================== */}
      {activeTab === 'insert' && (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Thêm Bản Ghi Tin Tức Mới Vào Cơ Sở Dữ Liệu
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Lưu trữ bài viết tin tức với đầy đủ các trường: tiêu đề, nội dung, URL, thời gian đăng, nguồn tin và các chỉ số làm giàu.
              </p>
            </div>

            {insertSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium">
                {insertSuccessMsg}
              </div>
            )}

            <form onSubmit={handleInsertSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề bài viết (Title) *
                </label>
                <input
                  type="text"
                  required
                  value={insertForm.title}
                  onChange={(e) => setInsertForm({ ...insertForm, title: e.target.value })}
                  placeholder="Nhập tiêu đề tin tức tài chính..."
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung chi tiết bài viết (Content)
                </label>
                <textarea
                  rows={4}
                  value={insertForm.content}
                  onChange={(e) => setInsertForm({ ...insertForm, content: e.target.value })}
                  placeholder="Nhập nội dung đầy đủ hoặc đoạn tóm tắt bài viết..."
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nguồn tin (Source) *
                  </label>
                  <input
                    type="text"
                    required
                    value={insertForm.source}
                    onChange={(e) => setInsertForm({ ...insertForm, source: e.target.value })}
                    placeholder="Ví dụ: Báo Đầu Tư, CafeF, Tổng cục Thuế..."
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Đường dẫn URL gốc (URL)
                  </label>
                  <input
                    type="url"
                    value={insertForm.url}
                    onChange={(e) => setInsertForm({ ...insertForm, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Thời gian đăng (Published Date/Time)
                  </label>
                  <input
                    type="datetime-local"
                    value={insertForm.publishedAt}
                    onChange={(e) => setInsertForm({ ...insertForm, publishedAt: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sắc thái cảm xúc (Sentiment)
                  </label>
                  <select
                    value={insertForm.sentiment}
                    onChange={(e) => setInsertForm({ ...insertForm, sentiment: e.target.value as any })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="bullish">Tích cực (Bullish)</option>
                    <option value="bearish">Tiêu cực (Bearish)</option>
                    <option value="neutral">Trung tính (Neutral)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lĩnh vực (Sector)
                  </label>
                  <select
                    value={insertForm.sector}
                    onChange={(e) => setInsertForm({ ...insertForm, sector: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    {Object.entries(SECTOR_NAMES).map(([key, name]) => (
                      <option key={key} value={key}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-colors shadow"
                >
                  Lưu Vào Cơ Sở Dữ Liệu (Insert Record)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Database Schema & AI RAG Audit Report Tab */}
      {activeTab === 'schema_audit' && (
        <DatabaseAuditReport
          articles={queryResult.articles}
          onRunOptimization={executeQuery}
        />
      )}

      {/* Single Article Detailed Preview Modal */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  {previewArticle.source}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {previewArticle.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewArticle(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <div>
                <span className="text-slate-400 block">Thời gian đăng:</span>
                <span className="font-semibold">{new Date(previewArticle.publishedTimestamp).toLocaleString('vi-VN')}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Sắc thái:</span>
                <span className="font-semibold capitalize">{previewArticle.sentiment} ({previewArticle.sentimentScore}đ)</span>
              </div>
              <div>
                <span className="text-slate-400 block">Lĩnh vực:</span>
                <span className="font-semibold">{previewArticle.sectorNameVi || previewArticle.sector}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Mức tác động:</span>
                <span className="font-semibold capitalize">{previewArticle.impactLevel}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Nội dung bài viết:</span>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {previewArticle.content || previewArticle.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <a
                href={previewArticle.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                Mở bài viết gốc <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setPreviewArticle(null)}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Database Clear */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Xác nhận xóa sạch cơ sở dữ liệu?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Thao tác này sẽ xóa <strong className="text-red-500">toàn bộ {totalDbCount} bản ghi bài viết</strong> khỏi bộ nhớ đệm trình duyệt, máy chủ Node.js và Google Cloud Firestore. Trạng thái cơ sở dữ liệu sẽ được đưa về <strong className="text-slate-900 dark:text-slate-100">0 bản ghi</strong> an toàn.
                </p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-600 dark:text-amber-400 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Chế độ 0-State được kích hoạt:
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/80 leading-normal">
                Hệ thống sẽ không tự động quét lại bài viết cho đến khi bạn chủ động bấm nút "Quét Ngay" hoặc phím tắt Alt+R.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                disabled={isClearingDb}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmClearDatabase}
                disabled={isClearingDb}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                {isClearingDb ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Đang xóa sạch...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Xác nhận Xóa Sạch DB
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
