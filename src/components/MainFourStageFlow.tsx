import React, { useState, useMemo, useRef } from 'react';
import {
  Radio,
  Activity,
  AlertTriangle,
  FileText,
  Compass,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Filter,
  RefreshCw,
  Clock,
  Building2,
  ExternalLink,
  Search,
  CheckCircle2,
  Sliders,
  Download,
  Share2,
  Copy,
  Receipt,
  Ship,
  Vault,
  Tag,
  Percent,
  HardHat,
  Landmark,
  Coins,
  DollarSign,
  ArrowRight,
  MessageSquare,
  Eye,
  FileSpreadsheet,
  BrainCircuit,
  Trash2,
} from 'lucide-react';
import {
  ScrapedNewsItem,
  TimeRange,
  SectorType,
  BuzzKeyword,
  ScrapeResponse,
  ViewDensityMode,
  formatNewsTimeDisplay,
} from '../types';
import { useTheme } from '../lib/theme';
import { calculateNormalizedSentiment } from '../lib/sentimentNormalization';
import { SentimentDistributionGauge100 } from './SentimentDistributionGauge100';
import { FiscalPillarsCardGrid } from './FiscalPillarsCardGrid';
import { MarketPulseWidget } from './MarketPulseWidget';
import { AnalyticsCharts } from './AnalyticsCharts';
import { TrendingBuzzWidget } from './TrendingBuzzWidget';
import { MediaGapRadarHub } from './MediaGapRadarHub';
import { ExecutiveImpactSnapshotBanner } from './ExecutiveImpactSnapshotBanner';
import { SopLifecycleStagePipeline, SopLifecycleLevel } from './SopLifecycleStagePipeline';
import { calculateRiskScore, isRiskArticle } from '../lib/newsClassification';

interface MainFourStageFlowProps {
  data: ScrapeResponse | null;
  timeRange: TimeRange;
  onTimeRangeChange?: (tr: TimeRange) => void;
  sector?: SectorType;
  onSelectSector?: (s: SectorType) => void;
  enrichedTrendingKeywords: BuzzKeyword[];
  onSelectArticle: (article: ScrapedNewsItem) => void;
  onDraftStatement: (article: ScrapedNewsItem) => void;
  onOpenGmailAlertModal?: (article: ScrapedNewsItem) => void;
  onOpenVideoModal?: (article?: ScrapedNewsItem) => void;
  onOpenKeywordWeightModal?: () => void;
  onOpenOfficialPortalsModal?: () => void;
  onNavigateTab: (tab: any) => void;
  handleSearch: (kw: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  densityMode?: ViewDensityMode;
  onDensityModeChange?: (mode: ViewDensityMode) => void;
  showHighConfidenceOnly?: boolean;
  onToggleHighConfidenceOnly?: (active: boolean) => void;
  onOpenAiFeedbackModal?: (article: ScrapedNewsItem) => void;
  onOpenAiRulesModal?: () => void;
  onOpenWarningPipeline?: (article: ScrapedNewsItem) => void;
  onOpenAlertTriggerModal?: () => void;
  onOpenBatchAlertDrawer?: () => void;
  activeTriggersCount?: number;
  activeAlertsCount?: number;
}

export type StageId = 'stage1_scan_sentiment' | 'stage2_negative_deepdive' | 'stage3_session_report' | 'stage4_media_gaps';

export const MainFourStageFlow: React.FC<MainFourStageFlowProps> = ({
  data,
  timeRange,
  onTimeRangeChange,
  sector = 'all',
  onSelectSector,
  enrichedTrendingKeywords,
  onSelectArticle,
  onDraftStatement,
  onOpenGmailAlertModal,
  onOpenVideoModal,
  onOpenKeywordWeightModal,
  onOpenOfficialPortalsModal,
  onNavigateTab,
  handleSearch,
  isLoading = false,
  onRefresh,
  densityMode = 'executive',
  onDensityModeChange,
  showHighConfidenceOnly = false,
  onToggleHighConfidenceOnly,
  onOpenAiFeedbackModal,
  onOpenAiRulesModal,
  onOpenWarningPipeline,
  onOpenAlertTriggerModal,
  onOpenBatchAlertDrawer,
  activeTriggersCount = 0,
  activeAlertsCount = 0,
}) => {
  const { isDark } = useTheme();

  // Active Stage Filter / Tab - Default to stage1 to avoid endless scrolling
  const [activeStageTab, setActiveStageTab] = useState<'all' | StageId>('stage1_scan_sentiment');
  const [selectedSentimentFilter, setSelectedSentimentFilter] = useState<'all' | 'bullish' | 'neutral' | 'bearish'>('all');
  const [negativeSubFilter, setNegativeSubFilter] = useState<'all' | 'emergency' | 'high_risk' | 'policy_feedback' | 'tax_customs' | 'stocks_market'>('all');
  const [negativeSearchQuery, setNegativeSearchQuery] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [selectedSopLevel, setSelectedSopLevel] = useState<SopLifecycleLevel>('ALL');

  // Section Refs for Smooth Scrolling
  const stage1Ref = useRef<HTMLDivElement>(null);
  const stage2Ref = useRef<HTMLDivElement>(null);
  const stage3Ref = useRef<HTMLDivElement>(null);
  const stage4Ref = useRef<HTMLDivElement>(null);

  const scrollToStage = (stage: StageId) => {
    setActiveStageTab(stage);
    let targetRef: React.RefObject<HTMLDivElement> | null = null;
    if (stage === 'stage1_scan_sentiment') targetRef = stage1Ref;
    else if (stage === 'stage2_negative_deepdive') targetRef = stage2Ref;
    else if (stage === 'stage3_session_report') targetRef = stage3Ref;
    else if (stage === 'stage4_media_gaps') targetRef = stage4Ref;

    if (targetRef && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const newsItems = useMemo(() => data?.news || [], [data]);

  // Normalized Sentiment Calculation (Guaranteed 100% Math)
  const normalizedSentiment = useMemo(() => {
    return calculateNormalizedSentiment(newsItems);
  }, [newsItems]);

  // Negative / Crisis / Risk Articles for Stage 2
  const negativeArticles = useMemo(() => {
    return newsItems.filter((item) => {
      const isBearish = item.sentiment === 'bearish';
      const risk = calculateRiskScore(item);
      const isEmerg = Boolean(item.isEmergency);
      return isBearish || risk.isRisk || isEmerg;
    });
  }, [newsItems]);

  // Filtered Negative Articles
  const filteredNegativeArticles = useMemo(() => {
    return negativeArticles.filter((item) => {
      // Sub filter
      if (negativeSubFilter === 'emergency' && !item.isEmergency) return false;
      if (negativeSubFilter === 'high_risk') {
        const risk = calculateRiskScore(item);
        if (risk.confidenceLevel !== 'HIGH' && !item.isEmergency) return false;
      }
      if (negativeSubFilter === 'policy_feedback' && item.sector !== 'tax' && item.sector !== 'treasury_budget') {
        if (!item.title.toLowerCase().includes('chính sách') && !item.title.toLowerCase().includes('kiến nghị') && !item.title.toLowerCase().includes('vướng')) {
          return false;
        }
      }
      if (negativeSubFilter === 'tax_customs' && item.sector !== 'tax' && item.sector !== 'customs') return false;
      if (negativeSubFilter === 'stocks_market' && item.sector !== 'stocks' && item.sector !== 'bonds') return false;

      // Query filter
      if (negativeSearchQuery.trim()) {
        const q = negativeSearchQuery.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchSummary = (item.summary || item.snippet || '').toLowerCase().includes(q);
        const matchSource = (item.source || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSummary && !matchSource) return false;
      }

      return true;
    });
  }, [negativeArticles, negativeSubFilter, negativeSearchQuery]);

  // Copy Executive Summary text
  const handleCopySummary = () => {
    const text = `[BÁO CÁO GIAO BAN BỘ TÀI CHÍNH - PHIÊN QUÉT ${data?.vnEndTimeStr || 'HÔM NAY'}]
- Tổng số tin bài đã quét: ${normalizedSentiment.total} bài trên 30 nguồn báo chí trọng điểm
- Cơ cấu sắc thái (Chuẩn 100%): Tích cực ${normalizedSentiment.bullishPct}% | Trung tính ${normalizedSentiment.neutralPct}% | Tiêu cực ${normalizedSentiment.bearishPct}%
- Chỉ số sức khỏe truyền thông: ${normalizedSentiment.sentimentScore}/100 (${normalizedSentiment.marketMood})
- Số vụ việc cảnh báo/tiêu cực cần lưu ý: ${negativeArticles.length} bài
- Chỉ đạo trọng tâm: ${data?.executiveSummaryReport?.overallStrategicAdvice || 'Chủ động phối hợp cơ quan báo chí minh bạch thông tin chính sách.'}`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ========================================================================= */}
      {/* COMPACT EXECUTIVE STAGE NAVIGATION TABS (CLEAN & NON-LENGTHY)             */}
      {/* ========================================================================= */}
      <div
        className="sticky top-16 z-30 p-2 rounded-2xl border-2 border-slate-300 bg-white backdrop-blur-md transition-all shadow-md"
      >
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
          {/* Stage 1 Tab */}
          <button
            onClick={() => scrollToStage('stage1_scan_sentiment')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer border ${
              activeStageTab === 'stage1_scan_sentiment'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-900 flex items-center justify-center font-black text-xs border border-slate-300">
              1
            </span>
            <span className="text-sm font-extrabold">1. Sắc Thái & Toàn Cảnh</span>
            <span className={`text-xs px-2 py-0.5 rounded font-mono font-black ${
              activeStageTab === 'stage1_scan_sentiment' ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-900 border border-slate-300'
            }`}>
              {normalizedSentiment.bullishPct}% / {normalizedSentiment.neutralPct}% / {normalizedSentiment.bearishPct}%
            </span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />

          {/* Stage 2 Tab */}
          <button
            onClick={() => scrollToStage('stage2_negative_deepdive')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer border ${
              activeStageTab === 'stage2_negative_deepdive'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-900 flex items-center justify-center font-black text-xs border border-slate-300">
              2
            </span>
            <span className="text-sm font-extrabold">2. Điểm Nóng & Rủi Ro</span>
            <span className={`text-xs px-2 py-0.5 rounded font-mono font-black ${
              activeStageTab === 'stage2_negative_deepdive' ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-900 border border-slate-300'
            }`}>
              {negativeArticles.length} vụ việc
            </span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />

          {/* Stage 3 Tab */}
          <button
            onClick={() => scrollToStage('stage3_session_report')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer border ${
              activeStageTab === 'stage3_session_report'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-900 flex items-center justify-center font-black text-xs border border-slate-300">
              3
            </span>
            <span className="text-sm font-extrabold">3. Báo Cáo Giao Ban</span>
            <Sparkles className="w-4 h-4" />
          </button>

          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />

          {/* Stage 4 Tab */}
          <button
            onClick={() => scrollToStage('stage4_media_gaps')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer border ${
              activeStageTab === 'stage4_media_gaps'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-900 flex items-center justify-center font-black text-xs border border-slate-300">
              4
            </span>
            <span className="text-sm font-extrabold">4. Khoảng Trống Tin</span>
            <Compass className="w-4 h-4" />
          </button>

          {/* AI Rules Modal Button */}
          {onOpenAiRulesModal && (
            <button
              onClick={onOpenAiRulesModal}
              title="Quản lý bộ quy tắc lọc AI loại trừ"
              className="px-3 py-2 rounded-xl text-xs font-black border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-900 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-slate-800" />
              <span>Quy Tắc AI</span>
            </button>
          )}

          {/* View All Stages Toggle */}
          <button
            onClick={() => setActiveStageTab('all')}
            className={`ml-auto px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 cursor-pointer ${
              activeStageTab === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'

                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {activeStageTab === 'all' ? '✓ Đang xem 4 khối' : 'Xem toàn bộ 4 khối'}
          </button>
        </div>
      </div>

      {/* Executive Impact Snapshot Banner for High Impact / Tin Nóng */}
      <ExecutiveImpactSnapshotBanner
        news={newsItems}
        onSelectArticle={onSelectArticle}
        onDraftStatement={onDraftStatement}
        onOpenWarningPipeline={onOpenWarningPipeline}
      />

      {/* ========================================================================= */}
      {/* KHỐI 1: QUÉT TIN VÀ RA KẾT QUẢ SẮC THÁI TIN TỨC (100% SENTIMENT)           */}
      {/* ========================================================================= */}
      {(activeStageTab === 'all' || activeStageTab === 'stage1_scan_sentiment') && (
        <section
          ref={stage1Ref}
          id="stage1_scan_sentiment"
          className="space-y-3.5 scroll-mt-32"
        >
          {/* Stage 1 Compact Header Row */}
          <div
            className={`px-3.5 py-2.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-slate-200/90 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Toàn Cảnh Sắc Thái Báo Chí & Dòng Tin 30 Nguồn
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Cập nhật: <strong className="text-slate-600 dark:text-slate-300 font-mono">{data?.vnEndTimeStr || 'Mới nhất'}</strong> • 30 nguồn báo chí trọng điểm & Cổng TTĐT
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 self-start sm:self-center">
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-xs hover:brightness-110 active:scale-98 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Đang quét...' : 'Quét Tin'}</span>
              </button>

              <button
                onClick={onOpenOfficialPortalsModal}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>8 Cổng TTĐT</span>
              </button>
            </div>
          </div>

          {/* Market Pulse Widget: ĐƯỢC ĐẶT LÊN ĐẦU VÀ NỔI BẬT NHẤT TRONG TỔNG QUAN CMS */}
          <div className="w-full">
            <MarketPulseWidget
              sentiment={{
                bullishPercentage: normalizedSentiment.bullishPct,
                bearishPercentage: normalizedSentiment.bearishPct,
                neutralPercentage: normalizedSentiment.neutralPct,
                totalArticles: normalizedSentiment.total,
                overallMood: normalizedSentiment.marketMood,
                moodScore: normalizedSentiment.sentimentScore,
                keyDriver: normalizedSentiment.marketMood,
              }}
              urgentAlerts={data?.urgentAlerts || []}
              articles={newsItems}
              negativeClusters={data?.sentimentOverview?.negativeClusters}
              communicationGaps={data?.sentimentOverview?.communicationGaps}
              onSelectArticle={onSelectArticle}
              onDraftStatementForCluster={(cluster) => {
                if (cluster.articles && cluster.articles.length > 0) {
                  onDraftStatement(cluster.articles[0]);
                }
              }}
            />
          </div>

          {/* 100% Guaranteed Sentiment Distribution Gauge Component */}
          <SentimentDistributionGauge100
            sentimentData={normalizedSentiment}
            selectedSentiment={selectedSentimentFilter}
            onFilterSentiment={(s) => {
              setSelectedSentimentFilter(s);
              if (s === 'bearish') {
                scrollToStage('stage2_negative_deepdive');
              }
            }}
          />

          {/* 5 Trụ Cột Tài Chính Chiến Lược BTC Grid */}
          <FiscalPillarsCardGrid
            newsItems={newsItems}
            sectorStats={data?.sectorStats || []}
            onSelectPillarSectors={(sectors) => {
              if (sectors.length > 0 && onSelectSector) {
                onSelectSector(sectors[0] as SectorType);
              }
            }}
            onNavigateTab={onNavigateTab}
          />

          {/* Real-time Charts: Full-width 2-column balanced layout */}
          <div className="w-full">
            <AnalyticsCharts
              timelineData={data?.timelineData || []}
              sectorStats={data?.sectorStats || []}
            />
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* KHỐI 2: BÓC TÁCH TIN TIÊU CỰC (CRISIS & RISK INTELLIGENCE DEEP-DIVE)       */}
      {/* ========================================================================= */}
      {(activeStageTab === 'all' || activeStageTab === 'stage2_negative_deepdive') && (
        <section
          ref={stage2Ref}
          id="stage2_negative_deepdive"
          className="space-y-4 scroll-mt-32 pt-2"
        >
          {/* Integrated 4-Level SOP Lifecycle Stage Pipeline */}
          <SopLifecycleStagePipeline
            articles={newsItems}
            selectedLevel={selectedSopLevel}
            onSelectLevel={setSelectedSopLevel}
            onSelectArticle={onSelectArticle}
            onOpenWarningPipeline={onOpenWarningPipeline}
            onDraftStatement={onDraftStatement}
            onOpenGmailAlertModal={onOpenGmailAlertModal}
            onOpenAlertTriggerModal={onOpenAlertTriggerModal}
            onOpenBatchAlertDrawer={onOpenBatchAlertDrawer}
            activeTriggersCount={activeTriggersCount}
            activeAlertsCount={activeAlertsCount}
            isDark={isDark}
          />

          {/* Stage 2 Compact Header Row */}
          <div
            className={`px-3.5 py-2.5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-2.5 ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-slate-200/90 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Bóc Tách Tin Tiêu Cực & Điểm Nóng</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                    {negativeArticles.length} vụ việc
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Phân tích rủi ro & chuẩn bị thông cáo phản hồi báo chí
                </p>
              </div>
            </div>

            {/* Sub Filter Quick Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setNegativeSubFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  negativeSubFilter === 'all'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Tất cả ({negativeArticles.length})
              </button>
              <button
                onClick={() => setNegativeSubFilter('emergency')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  negativeSubFilter === 'emergency'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Zap className="w-3 h-3 text-rose-400" />
                🚨 Khẩn cấp
              </button>
              <button
                onClick={() => setNegativeSubFilter('high_risk')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  negativeSubFilter === 'high_risk'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ⚠️ Cảnh báo cao
              </button>
              <button
                onClick={() => setNegativeSubFilter('tax_customs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  negativeSubFilter === 'tax_customs'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Thuế & Hải quan
              </button>
            </div>
          </div>

          {/* Negative Articles List & Deep-Dive Cards */}
          {filteredNegativeArticles.length === 0 ? (
            <div
              className={`p-8 rounded-2xl border text-center ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Không phát hiện vụ việc tiêu cực nghiêm trọng
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Tất cả tin tức thuộc bộ lọc hiện tại đều nằm trong ngưỡng an toàn hoặc không có bài viết tiêu cực phát sinh trong phiên quét này.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNegativeArticles.map((art, idx) => {
                const risk = calculateRiskScore(art);
                return (
                  <div
                    key={art.id || idx}
                    id={`negative-card-${art.id || idx}`}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      art.isEmergency
                        ? 'bg-rose-500/5 border-rose-500/40 shadow-sm'
                        : isDark
                        ? 'bg-slate-900/90 border-slate-800 hover:border-rose-500/40'
                        : 'bg-white border-slate-200/90 hover:border-rose-300 shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 font-mono">
                            {art.source}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {formatNewsTimeDisplay(art) || 'Vừa quét'}
                          </span>
                          {(art.handlingStatus === 'IN_PROGRESS' || art.handlingActionLabel) && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-600 text-white border border-blue-700 flex items-center gap-1 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-200 animate-pulse" />
                              <span>🔵 Đang xử lý {art.handlingActionLabel ? `• ${art.handlingActionLabel}` : ''}</span>
                            </span>
                          )}
                        </div>

                        {art.isEmergency ? (
                          <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-black text-[10px] animate-pulse uppercase tracking-wider flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Khẩn cấp
                          </span>
                        ) : risk.isRisk ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                            ⚠️ Rủi ro ({risk.confidenceScore}%)
                          </span>
                        ) : null}
                      </div>

                      {/* Title */}
                      <h4
                        onClick={() => onSelectArticle(art)}
                        className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition line-clamp-2 mb-2"
                      >
                        {art.title}
                      </h4>

                      {/* 3-Point Decomposition Box */}
                      <div
                        className={`p-3 rounded-xl border text-xs space-y-1.5 mb-3 ${
                          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-1.5">
                          <span className="text-rose-500 font-bold shrink-0">•</span>
                          <span className="text-slate-600 dark:text-slate-300">
                            <strong className="text-slate-800 dark:text-slate-200">Bản chất sự việc:</strong>{' '}
                            {art.summary || art.snippet || 'Đang cập nhật diễn biến chi tiết sự việc.'}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold shrink-0">•</span>
                          <span className="text-slate-600 dark:text-slate-300">
                            <strong className="text-slate-800 dark:text-slate-200">Tác động chính sách:</strong>{' '}
                            {art.keyPoints?.[0] || 'Cần theo dõi phản ứng của dư luận và thị trường liên quan.'}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-indigo-500 font-bold shrink-0">•</span>
                          <span className="text-slate-600 dark:text-slate-300">
                            <strong className="text-slate-800 dark:text-slate-200">Khuyến nghị tham mưu:</strong>{' '}
                            {(art as any).leadershipRecommendation || (art as any).recommendation || (art as any).actionProposal?.directiveAction || 'Chủ động nắm bắt thông tin và sẵn sàng phương án phản hồi báo chí.'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Response Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onDraftStatement(art)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Soạn Thông Cáo</span>
                        </button>

                        {onOpenAiFeedbackModal && (
                          <button
                            type="button"
                            onClick={() => onOpenAiFeedbackModal(art)}
                            title="Loại bỏ bài viết này và đào tạo AI loại trừ để lần sau không quét dính"
                            className="px-2 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span className="hidden sm:inline">Loại bỏ & Ghi chú AI</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto">
                        {onOpenGmailAlertModal && (
                          <button
                            onClick={() => onOpenGmailAlertModal(art)}
                            title="Gửi báo cáo cảnh báo khẩn cấp"
                            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-500 hover:border-rose-400 transition cursor-pointer"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onSelectArticle(art)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          Mổ xẻ chi tiết &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* KHỐI 3: BÁO CÁO TỔNG QUÁT PHIÊN QUÉT (EXECUTIVE SESSION BRIEFING)          */}
      {/* ========================================================================= */}
      {(activeStageTab === 'all' || activeStageTab === 'stage3_session_report') && (
        <section
          ref={stage3Ref}
          id="stage3_session_report"
          className="space-y-4 scroll-mt-32 pt-2"
        >
          {/* Stage 3 Compact Header Row */}
          <div
            className={`px-3.5 py-2.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-slate-200/90 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Báo Cáo Tổng Hợp Phiên & Tham Mưu Lãnh Đạo
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Số liệu giao ban Bộ Tài chính ({data?.vnEndTimeStr || 'Hôm nay'})
                </p>
              </div>
            </div>

            {/* Quick Export / Copy Briefing Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  copiedSummary
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {copiedSummary ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSummary ? 'Đã chép!' : 'Sao Chép'}</span>
              </button>

              <button
                onClick={() => onNavigateTab('table')}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Xem Kho Tin ({newsItems.length})</span>
              </button>
            </div>
          </div>

          {/* Executive Synthesis Summary Card */}
          <div
            className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Tóm Tắt Bối Cảnh Phiên Quét ({data?.vnEndTimeStr || 'Hôm nay'})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div
                className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  1. Khối lượng & Tỷ trọng
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Đã rà quét <strong>{normalizedSentiment.total}</strong> bài báo. Tỷ lệ sắc thái đạt{' '}
                  <strong className="text-emerald-600">{normalizedSentiment.bullishPct}% Tích cực</strong>,{' '}
                  <strong className="text-amber-600">{normalizedSentiment.neutralPct}% Trung tính</strong>,{' '}
                  <strong className="text-rose-600">{normalizedSentiment.bearishPct}% Tiêu cực</strong> (Tổng = 100%).
                </p>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  2. Điểm nóng & Rủi ro
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Ghi nhận <strong>{negativeArticles.length}</strong> vụ việc thuộc nhóm tiêu cực/cảnh báo. Trọng tâm tập trung vào giải ngân đầu tư công, xử lý gian lận thuế và biến động thị trường tài chính.
                </p>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  3. Định hướng tham mưu
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {data?.executiveSummaryReport?.overallStrategicAdvice ||
                    'Duy trì nhịp độ tuyên truyền, hướng dẫn thực thi các thông tư, nghị định mới ban hành và chủ động tháo gỡ khó khăn cho DN.'}
                </p>
              </div>
            </div>

            {/* Trending Buzz Keywords Widget */}
            <div className="pt-2">
              <TrendingBuzzWidget
                keywords={enrichedTrendingKeywords}
                newsItems={newsItems}
                isLoading={isLoading}
                onRefresh={onRefresh}
                lastUpdated={data?.vnEndTimeStr || data?.timeBounds?.vnEndTimeStr}
                onSelectKeyword={(kw) => {
                  handleSearch(kw);
                  onNavigateTab('table');
                }}
                sourceStats={data?.sourceStats || []}
                onOpenKeywordWeightModal={onOpenKeywordWeightModal}
              />
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* KHỐI 4: KHOẢNG TRỐNG THÔNG TIN (MEDIA GAPS RADAR & PROACTIVE PR)           */}
      {/* ========================================================================= */}
      {(activeStageTab === 'all' || activeStageTab === 'stage4_media_gaps') && (
        <section
          ref={stage4Ref}
          id="stage4_media_gaps"
          className="space-y-4 scroll-mt-32 pt-2"
        >
          {/* Stage 4 Compact Header Row */}
          <div
            className={`px-3.5 py-2.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-slate-200/90 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Radar Khoảng Trống Thông Tin & Truyền Thông Chủ Động
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Nhận diện chính sách thiếu thông điệp để chủ động tăng cường bài viết đón đầu
                </p>
              </div>
            </div>
          </div>

          {/* Media Gap Radar Hub Component */}
          <MediaGapRadarHub
            newsItems={newsItems}
            onSelectArticle={onSelectArticle}
            onDraftStatement={onDraftStatement}
          />
        </section>
      )}
    </div>
  );
};
