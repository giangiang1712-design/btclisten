import React, { useState, useMemo, useEffect } from 'react';
import {
  ActiveAlertNotification,
  WarningAlertLevelType,
  ScrapedNewsItem,
  formatNewsFullDateTime,
} from '../types';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { decodeHtmlEntities } from '../lib/htmlDecoder';
import { classifyArticleUrgency } from '../lib/warningPipelineEngine';
import {
  X,
  AlertOctagon,
  Zap,
  AlertTriangle,
  Activity,
  ClipboardList,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Search,
  CheckCircle2,
  FileEdit,
  Mail,
  Sliders,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  Building2,
  Filter,
  CheckCheck,
  RefreshCw,
} from 'lucide-react';

interface BatchAlertSummaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: ActiveAlertNotification[];
  timeRange?: string;
  onSelectAlertArticle?: (articleId: string) => void;
  onOpenDeepDive?: (article: ScrapedNewsItem) => void;
  onOpenDraftStatement?: (article: ScrapedNewsItem) => void;
  onOpenGmailAlert?: (article: ScrapedNewsItem) => void;
  onOpenExecutiveModal?: (alert: ActiveAlertNotification) => void;
  onOpenTriggerConfig?: () => void;
  onClearAlert?: (alertId: string) => void;
  onClearAllAlerts?: () => void;
}

const ITEMS_PER_PAGE = 6;

export const BatchAlertSummaryDrawer: React.FC<BatchAlertSummaryDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  timeRange = '24h',
  onSelectAlertArticle,
  onOpenDeepDive,
  onOpenDraftStatement,
  onOpenGmailAlert,
  onOpenExecutiveModal,
  onOpenTriggerConfig,
  onClearAlert,
  onClearAllAlerts,
}) => {
  const { isDark } = useTheme();
  const { isVietnamese } = useI18n();
  const [selectedLevelTab, setSelectedLevelTab] = useState<'ALL' | WarningAlertLevelType>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // State lưu trữ kết quả phân tích AI Gemini chuyên sâu đa chiều cho từng bài viết
  interface WarningAiAnalysisData {
    articleId?: string;
    issueConcern: string;
    clarificationNeeded: string;
    gapDetails: string;
    recommendedClosureAction: string;
    actionOwnerUnit: string;
    targetedFormats: string[];
    source: string;
    analyzedAt: string;
  }

  const [aiAnalysisMap, setAiAnalysisMap] = useState<Record<string, WarningAiAnalysisData>>({});
  const [loadingAiMap, setLoadingAiMap] = useState<Record<string, boolean>>({});

  const handleRunAiAnalysis = async (alert: ActiveAlertNotification, forceRefresh = false) => {
    const article = alert.article;
    const articleId = article?.id || alert.id;
    if (!forceRefresh && aiAnalysisMap[articleId]) return;

    setLoadingAiMap((prev) => ({ ...prev, [articleId]: true }));
    try {
      const res = await fetch('/api/warning-summary/deep-ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          title: article?.title || alert.triggerName || '',
          summary: article?.summary || (alert as any).triggerMessage || '',
          content: article?.snippet || article?.summary || '',
          source: article?.source || '',
          category: article?.sectorNameVi || article?.sector || '',
          triggerRule: alert.triggerName || '',
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json?.data) {
          setAiAnalysisMap((prev) => ({ ...prev, [articleId]: json.data }));
        }
      }
    } catch (err) {
      console.warn('Lỗi phân tích AI cảnh báo:', err);
    } finally {
      setLoadingAiMap((prev) => ({ ...prev, [articleId]: false }));
    }
  };

  // Helper hàm chuẩn hóa cấp độ cảnh báo theo đúng 4 mốc ngưỡng cứng:
  // < 20đ: STANDARD (không cảnh báo)
  // 20–39đ: DISTANT (Cấp 1: Cảnh báo xa / Dự báo xa)
  // 40–59đ: EARLY (Cấp 2: Cảnh báo sớm / Cần lưu tâm)
  // 60–74đ: RAPID (Cấp 3: Cảnh báo nhanh / Đáng chú ý)
  // 75–100đ: EMERGENCY (Cấp 4: Khẩn cấp / Cấp bách)
  const getStrictAlertLevel = (alert: ActiveAlertNotification): WarningAlertLevelType => {
    const article = alert.article;
    const score = Number(
      article?.warningPipeline?.level2Risk?.riskScore ??
      article?.riskScore ??
      article?.warningPipeline?.formulaMetrics?.rawRiskScore ??
      0
    );

    if (score >= 75 || article?.isEmergency) return 'EMERGENCY';
    if (score >= 60) return 'RAPID';
    if (score >= 40) return 'EARLY';
    if (score >= 20) return 'DISTANT';
    return 'STANDARD';
  };

  // Statistics calculation across all alerts in current scan batch
  const stats = useMemo(() => {
    let emergency = 0;
    let rapid = 0;
    let early = 0;
    let distant = 0;
    let standard = 0;

    alerts.forEach((a) => {
      const lvl = getStrictAlertLevel(a);
      if (lvl === 'EMERGENCY') emergency++;
      else if (lvl === 'RAPID') rapid++;
      else if (lvl === 'EARLY') early++;
      else if (lvl === 'DISTANT') distant++;
      else standard++;
    });

    return {
      total: emergency + rapid + early + distant,
      emergency,
      rapid,
      early,
      distant,
      standard,
    };
  }, [alerts]);

  // Filtered and searched alerts list
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const lvl = getStrictAlertLevel(alert);
      // Loại bỏ hoàn toàn các tin tức < 20 điểm khỏi ngăn kéo cảnh báo rủi ro
      if (lvl === 'STANDARD') return false;

      if (selectedLevelTab !== 'ALL') {
        if (selectedLevelTab === 'EARLY' && (lvl !== 'EARLY' && lvl !== 'DISTANT')) return false;
        if (selectedLevelTab !== 'EARLY' && lvl !== selectedLevelTab) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const title = (alert.article?.title || '').toLowerCase();
        const source = (alert.article?.source || '').toLowerCase();
        const trigger = (alert.triggerName || '').toLowerCase();
        const kws = (alert.matchedKeywords || []).join(' ').toLowerCase();
        return title.includes(q) || source.includes(q) || trigger.includes(q) || kws.includes(q);
      }
      return true;
    });
  }, [alerts, selectedLevelTab, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedAlerts = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredAlerts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAlerts, safeCurrentPage]);

  // Tự động phân tích AI Gemini cho các tin cảnh báo đang hiển thị trên trang hiện tại
  useEffect(() => {
    if (isOpen && paginatedAlerts.length > 0) {
      paginatedAlerts.forEach((alert) => {
        const id = alert.article?.id || alert.id;
        if (!aiAnalysisMap[id] && !loadingAiMap[id]) {
          handleRunAiAnalysis(alert, false);
        }
      });
    }
  }, [isOpen, paginatedAlerts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div
        className={`relative w-full max-w-2xl lg:max-w-3xl h-full flex flex-col shadow-2xl border-l z-10 transition-transform duration-300 animate-in slide-in-from-right ${
          isDark
            ? 'bg-slate-900/98 text-slate-100 border-slate-800'
            : 'bg-white text-slate-900 border-slate-200'
        }`}
      >
        {/* Header Bar */}
        <div
          className={`px-6 py-4 border-b shrink-0 flex items-center justify-between gap-4 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/90 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{isVietnamese ? 'Bảng Tổng Hợp Cảnh Báo Đợt Quét' : 'Batch Scan Alert Drawer'}</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {timeRange.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {stats.total} {isVietnamese ? 'cảnh báo phát hiện' : 'alerts found'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isVietnamese
                  ? 'Gom toàn bộ các rủi ro thể chế và đột biến thông tin phát hiện trong chu kỳ quét vào một giao diện tập trung'
                  : 'Consolidated overview of all risk triggers and anomaly alerts in the current scan cycle'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenTriggerConfig && (
              <button
                onClick={onOpenTriggerConfig}
                title={isVietnamese ? 'Cấu hình quy tắc & ngưỡng' : 'Configure alert rules'}
                className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
                }`}
              >
                <Sliders className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">{isVietnamese ? 'Cấu hình' : 'Rules'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border-slate-300 shadow-xs'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Level Stats Bar & Tab Filter */}
        <div
          className={`px-6 py-3 border-b shrink-0 flex flex-col gap-3 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {/* Quick Level Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => {
                setSelectedLevelTab('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                selectedLevelTab === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : isDark
                  ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <span>{isVietnamese ? 'Tất cả' : 'All'}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedLevelTab === 'ALL' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedLevelTab('EMERGENCY');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                selectedLevelTab === 'EMERGENCY'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/30'
                  : isDark
                  ? 'bg-rose-950/30 text-rose-300 border-rose-900/40 hover:bg-rose-900/40'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>{isVietnamese ? 'Cấp bách' : 'Emergency'}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedLevelTab === 'EMERGENCY' ? 'bg-white/25 text-white' : 'bg-rose-200 dark:bg-rose-900'
                }`}
              >
                {stats.emergency}
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedLevelTab('RAPID');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                selectedLevelTab === 'RAPID'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/30'
                  : isDark
                  ? 'bg-amber-950/30 text-amber-300 border-amber-900/40 hover:bg-amber-900/40'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isVietnamese ? 'Đáng chú ý' : 'Notable'}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedLevelTab === 'RAPID' ? 'bg-white/25 text-white' : 'bg-amber-200 dark:bg-amber-900'
                }`}
              >
                {stats.rapid}
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedLevelTab('EARLY');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                selectedLevelTab === 'EARLY' || selectedLevelTab === 'DISTANT'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : isDark
                  ? 'bg-amber-950/30 text-amber-300 border-amber-900/40 hover:bg-amber-900/40'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isVietnamese ? '⏳ Cần lưu tâm & Dự báo sớm' : 'Early Warning & Horizon'}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedLevelTab === 'EARLY' || selectedLevelTab === 'DISTANT' ? 'bg-white/25 text-white' : 'bg-amber-200 dark:bg-amber-900'
                }`}
              >
                {stats.early + stats.distant}
              </span>
            </button>
          </div>

          {/* Search bar within Drawer */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={
                  isVietnamese
                    ? 'Tìm kiếm tiêu đề bài viết, từ khóa kích hoạt, nguồn báo...'
                    : 'Search alert title, trigger keywords, source...'
                }
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border transition outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-blue-500'
                    : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>

            {onClearAllAlerts && alerts.length > 0 && (
              <button
                onClick={onClearAllAlerts}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isVietnamese ? 'Duyệt toàn bộ' : 'Clear all'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Alerts Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredAlerts.length === 0 ? (
            <div
              className={`p-12 rounded-3xl border text-center space-y-3 ${
                isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {searchQuery
                  ? isVietnamese
                    ? 'Không tìm thấy cảnh báo nào khớp với từ khóa'
                    : 'No alerts match the search query'
                  : isVietnamese
                  ? 'Không có cảnh báo nào trong phân loại này'
                  : 'No alerts found for the selected filter'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {isVietnamese
                  ? 'Các chỉ số rủi ro chính sách và sắc thái truyền thông duy trì trong ngưỡng an toàn.'
                  : 'All policy indicators and sentiment metrics remain within safe operating thresholds.'}
              </p>
            </div>
          ) : (
            paginatedAlerts.map((alert, index) => {
              const { article, triggerName, matchedKeywords, alertLevel, triggeredAt } = alert;
              let rawTitle = decodeHtmlEntities(article?.title || 'Cảnh báo rủi ro');
              if (rawTitle.includes('<img')) {
                const m = rawTitle.match(/alt=["']([^"']+)["']/i);
                if (m && m[1] && !m[1].includes('Ảnh có sử dụng')) {
                  rawTitle = m[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
                } else {
                  rawTitle = article?.snippet?.substring(0, 100) || 'Tin tức nghiệp vụ Bộ Tài chính';
                }
              }
              const cleanTitle = rawTitle.replace(/<[^>]+>/g, '').trim();
              const realPublishedTime =
                triggeredAt || (article ? formatNewsFullDateTime(article) : 'Vừa xong');
              const source = article?.source || 'Báo chí tài chính';
              const riskScore = Number(
                article?.warningPipeline?.level2Risk?.riskScore ??
                article?.riskScore ??
                article?.warningPipeline?.formulaMetrics?.rawRiskScore ??
                0
              );
              const classification = article ? classifyArticleUrgency(article) : null;

              const strictLevel = getStrictAlertLevel(alert);
              const isEmergencyLevel = strictLevel === 'EMERGENCY';
              const isRapidLevel = strictLevel === 'RAPID';
              const isEarlyLevel = strictLevel === 'EARLY';
              const isDistantLevel = strictLevel === 'DISTANT';

              // Visual styling by level
              const cardBorderClass = isEmergencyLevel
                ? isDark
                  ? 'border-rose-500/50 bg-slate-950/80 shadow-rose-950/40 ring-1 ring-rose-500/30'
                  : 'border-rose-300 bg-rose-50/40 shadow-rose-100 ring-1 ring-rose-400/30'
                : isRapidLevel
                ? isDark
                  ? 'border-amber-500/40 bg-slate-950/80 shadow-amber-950/30'
                  : 'border-amber-300 bg-amber-50/40 shadow-amber-100'
                : isEarlyLevel
                ? isDark
                  ? 'border-orange-500/40 bg-slate-950/80'
                  : 'border-orange-300 bg-orange-50/30'
                : isDark
                ? 'border-slate-800 bg-slate-950/60'
                : 'border-slate-200 bg-white';

              const levelBadge = isEmergencyLevel
                ? { label: '🚨 CẤP BÁCH', style: 'bg-rose-600 text-white font-black' }
                : isRapidLevel
                ? { label: '⚡ ĐÁNG CHÚ Ý', style: 'bg-amber-500 text-white font-black' }
                : isEarlyLevel || isDistantLevel
                ? { label: '⏳ CẦN LƯU TÂM & DỰ BÁO SỚM', style: 'bg-amber-600 text-white font-bold' }
                : { label: '📋 THƯỜNG QUY', style: 'bg-slate-600 text-white font-bold' };

              return (
                <div
                  key={alert.id || index}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 space-y-3.5 shadow-sm hover:shadow-md ${cardBorderClass}`}
                >
                  {/* Top Meta Bar */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${levelBadge.style}`}
                      >
                        {levelBadge.label}
                      </span>

                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{source}</span>
                      </span>

                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{realPublishedTime}</span>
                      </div>
                    </div>

                    {/* Risk Score Pill */}
                    <div className="flex items-center gap-2">
                      {riskScore > 0 && (
                        <div
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-black flex items-center gap-1 ${
                            riskScore >= 75
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              : riskScore >= 50
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          <span>Risk:</span>
                          <strong>{riskScore}</strong>
                          <span className="text-[9px] opacity-70">/100</span>
                        </div>
                      )}

                      {onClearAlert && (
                        <button
                          onClick={() => onClearAlert(alert.id)}
                          title={isVietnamese ? 'Bỏ qua cảnh báo này' : 'Dismiss this alert'}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Trigger Rule Name Banner */}
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{triggerName || 'Quy tắc cảnh báo sớm tự động'}</span>
                  </div>

                  {/* Title & Article Link */}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {cleanTitle}
                    </h3>

                    {article?.summary && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
                        {decodeHtmlEntities(article.summary)}
                      </p>
                    )}
                  </div>

                  {/* BẢNG TỔNG HỢP CẢNH BÁO ĐỢT QUÉT: TÍCH HỢP AI GEMINI CHUYÊN SÂU 3 THÀNH PHẦN */}
                  {(() => {
                    const articleId = article?.id || alert.id;
                    const aiData = aiAnalysisMap[articleId];
                    const isLoadingAi = loadingAiMap[articleId] || false;

                    return (
                      <div className="space-y-2.5 pt-1">
                        {/* Thanh trạng thái AI Gemini & Nút làm mới phân tích */}
                        <div className="flex items-center justify-between gap-2 px-1 pt-1 flex-wrap">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                            <span>
                              {isLoadingAi
                                ? 'AI đang suy luận...'
                                : 'Tham khảo AI'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRunAiAnalysis(alert, true)}
                            disabled={isLoadingAi}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 disabled:opacity-50"
                            title="Tham khảo AI phân tích lại"
                          >
                            <RefreshCw className={`w-3 h-3 ${isLoadingAi ? 'animate-spin' : ''}`} />
                            <span>{isLoadingAi ? 'Đang phân tích...' : 'Làm mới bằng AI'}</span>
                          </button>
                        </div>

                        {/* Khối 1: Vấn Đề Dư Luận, Người Dân, Doanh Nghiệp Quan Tâm / Than Phiền */}
                        <div className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                          isDark 
                            ? 'bg-rose-950/20 border-rose-900/40 text-rose-200' 
                            : 'bg-rose-50 border-rose-200 text-rose-950'
                        }`}>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 font-black text-xs text-rose-700 dark:text-rose-400">
                              <span>📌 1. Vấn đề dư luận, người dân, DN quan tâm / than phiền:</span>
                            </div>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300">
                              {isLoadingAi ? 'Đang cập nhật...' : 'Bóc tách thực tế'}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-medium leading-relaxed pl-5 text-slate-800 dark:text-slate-200 whitespace-pre-line">
                            {aiData?.issueConcern || article?.informationVacuum?.issueConcern || 'Dư luận và cộng đồng doanh nghiệp đang bày tỏ quan ngại sâu sắc về tính khả thi khi áp dụng chính sách, nguy cơ phát sinh thêm thủ tục, chi phí tuân thủ và tác động trực tiếp đến quyền lợi người nộp thuế.'}
                          </p>
                        </div>

                        {/* Khối 2: Cảnh Báo Cần Làm Rõ & Khoảng Trống Thông Tin */}
                        <div className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                          isDark 
                            ? 'bg-amber-950/20 border-amber-900/40 text-amber-200' 
                            : 'bg-amber-50 border-amber-200 text-amber-950'
                        }`}>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 font-black text-xs text-amber-800 dark:text-amber-400">
                              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                              <span>⚠️ 2. Cảnh báo: Cần làm rõ & Khoảng trống thông tin:</span>
                            </div>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300">
                              {isLoadingAi ? 'Đang quét...' : 'Nhận diện điểm nghẽn'}
                            </span>
                          </div>
                          <div className="pl-5 space-y-1">
                            <p className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-300">
                              {aiData?.clarificationNeeded || article?.informationVacuum?.clarificationNeeded || 'Cần xác thực tính minh bạch và căn cứ pháp lý của nội dung phản ánh.'}
                            </p>
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                              {aiData?.gapDetails || article?.informationVacuum?.gapDetails || alert.informationGap || 'Chính sách hiện hành chưa có văn bản hướng dẫn chi tiết hoặc số liệu thống kê công khai, tạo khoảng trống khiến dư luận dễ suy diễn và lan truyền thông tin chưa chính xác.'}
                            </p>
                          </div>
                        </div>

                        {/* Khối 3: Đề Xuất Giải Quyết Để Lấp Khoảng Trống Thông Tin */}
                        <div className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                          isDark 
                            ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200' 
                            : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        }`}>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 font-black text-xs text-emerald-800 dark:text-emerald-400">
                              <Zap className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              <span>💡 3. Đề xuất giải quyết để lấp khoảng trống thông tin:</span>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-600/15 text-emerald-900 dark:text-emerald-200 border border-emerald-500/20">
                              Đơn vị chủ trì: {aiData?.actionOwnerUnit || article?.informationVacuum?.actionOwnerUnit || alert.responsibleUnit || 'Vụ Chính sách Thuế & Đơn vị phụ trách'}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-medium leading-relaxed pl-5 text-slate-800 dark:text-slate-200 whitespace-pre-line">
                            {aiData?.recommendedClosureAction || article?.informationVacuum?.recommendedClosureAction || alert.actionRequired || article?.warningPipeline?.level3Action.actionPlaybook?.[0]?.actions?.[0] || 'Chủ động ban hành văn bản giải thích nghiệp vụ chính thức; phát hành thông cáo báo chí định hướng thông tin và tổ chức chuyên mục hỏi đáp tháo gỡ vướng mắc cho người dân, doanh nghiệp.'}
                          </p>

                          {/* Các hình thức truyền thông cụ thể */}
                          {((aiData?.targetedFormats && aiData.targetedFormats.length > 0) || (article?.informationVacuum?.targetedFormats && article.informationVacuum.targetedFormats.length > 0)) && (
                            <div className="pl-5 pt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Hình thức đề xuất:</span>
                              {(aiData?.targetedFormats || article?.informationVacuum?.targetedFormats || []).map((fmt, fIdx) => (
                                <span
                                  key={fIdx}
                                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-600/10 text-emerald-800 dark:text-emerald-300 border border-emerald-600/20"
                                >
                                  {fmt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Matched Keywords Tags */}
                  {matchedKeywords && matchedKeywords.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Dấu hiệu:</span>
                      {matchedKeywords.slice(0, 5).map((kw, kwIdx) => (
                        <span
                          key={kwIdx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick Tactical Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {article && onOpenDeepDive && (
                        <button
                          onClick={() => {
                            onOpenDeepDive(article);
                            onClose();
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            isDark
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          }`}
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />
                          <span>{isVietnamese ? 'Phân tích sâu' : 'Deep Dive'}</span>
                        </button>
                      )}

                      {article && onOpenDraftStatement && (
                        <button
                          onClick={() => {
                            onOpenDraftStatement(article);
                            onClose();
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            isDark
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          }`}
                        >
                          <FileEdit className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{isVietnamese ? 'Soạn chỉ đạo' : 'Draft'}</span>
                        </button>
                      )}

                      {article && onOpenGmailAlert && (
                        <button
                          onClick={() => {
                            onOpenGmailAlert(article);
                            onClose();
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            isDark
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          }`}
                        >
                          <Mail className="w-3.5 h-3.5 text-rose-500" />
                          <span>{isVietnamese ? 'Gửi Gmail' : 'Gmail'}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {article?.id && onSelectAlertArticle && (
                        <button
                          onClick={() => {
                            onSelectAlertArticle(article.id);
                            onClose();
                          }}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isVietnamese ? 'Xem bài trên bảng tin' : 'Jump to card'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {article?.url && (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                          title={isVietnamese ? 'Mở bài viết gốc' : 'Open original article'}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination & Footer Actions */}
        {totalPages > 1 && (
          <div
            className={`px-6 py-3 border-t shrink-0 flex items-center justify-between gap-3 ${
              isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {isVietnamese ? 'Trang' : 'Page'} <strong>{safeCurrentPage}</strong> / {totalPages} (
              {filteredAlerts.length} {isVietnamese ? 'cảnh báo' : 'alerts'})
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
                  if (
                    pg === 1 ||
                    pg === totalPages ||
                    (pg >= safeCurrentPage - 1 && pg <= safeCurrentPage + 1)
                  ) {
                    return (
                      <button
                        key={pg}
                        onClick={() => setCurrentPage(pg)}
                        className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                          safeCurrentPage === pg
                            ? 'bg-blue-600 text-white'
                            : isDark
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {pg}
                      </button>
                    );
                  }
                  if (pg === safeCurrentPage - 2 || pg === safeCurrentPage + 2) {
                    return (
                      <span key={pg} className="px-1 text-xs text-slate-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
