import React, { useState, useMemo } from 'react';
import {
  Zap,
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  X,
  Clock,
  Building2,
  FileText,
  ExternalLink,
  Search,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Send,
  Mail,
  Scale,
  CheckSquare,
  Square,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Activity,
  Compass,
} from 'lucide-react';
import { ScrapedNewsItem, formatNewsFullDateTime } from '../types';
import { decodeHtmlEntities } from '../lib/htmlDecoder';
import { extractQuantitativeBreakdown } from './QuantitativeFormulaBreakdown';
import { classifyArticleUrgency } from '../lib/warningPipelineEngine';
import { evaluateAndTagSopLevel4, isEarlyWarningArticle, isDistantWarningArticle } from '../lib/sentimentCalculator';
import { Decree376ClassificationEngine } from '../lib/decree376ClassificationEngine';
import { ExecutiveDirectiveDetailModal } from './ExecutiveDirectiveDetailModal';

export type InterventionWarningLevel = 'EMERGENCY' | 'RAPID' | 'EARLY' | 'DISTANT' | 'GAP';

interface InterventionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: ScrapedNewsItem[];
  handledArticleIds: Set<string>;
  onToggleHandled: (articleId: string) => void;
  onSelectArticle: (article: ScrapedNewsItem) => void;
  onDraftStatement?: (article: ScrapedNewsItem) => void;
  onOpenGmailAlertModal?: (article: ScrapedNewsItem) => void;
  onOpenWarningPipeline?: (article: ScrapedNewsItem) => void;
  isDark?: boolean;
}

export const InterventionManagementModal: React.FC<InterventionManagementModalProps> = ({
  isOpen,
  onClose,
  articles,
  handledArticleIds,
  onToggleHandled,
  onSelectArticle,
  onDraftStatement,
  onOpenGmailAlertModal,
  onOpenWarningPipeline,
  isDark = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'active' | 'handled'>('active');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [detailModalArticle, setDetailModalArticle] = useState<ScrapedNewsItem | null>(null);

  // Classify each article's intervention profile strictly according to SOP 4-Level and Decree 376
  const enrichedArticles = useMemo(() => {
    return articles.map((item) => {
      const breakdown = extractQuantitativeBreakdown(item);
      const classification = classifyArticleUrgency(item);
      const sopL4Eval = evaluateAndTagSopLevel4(item);
      const isHandled = handledArticleIds.has(item.id);
      const d376 = Decree376ClassificationEngine.classify(item);
      const isEarly = isEarlyWarningArticle(item);
      const isDistant = isDistantWarningArticle(item);

      // Determine actionable warning level:
      // EMERGENCY (Cấp 4: 80–100đ, SOP 2-4h, D376 Mức 3)
      // RAPID (Cấp 3: 60–79đ, Cảnh báo trực tiếp 12h, D376 Mức 2)
      // EARLY (Cấp 2: 40–59đ, Cảnh báo sớm 24h, D376 Mức 2)
      // DISTANT (Cấp 1: 20–39đ, Cảnh báo xa 48-72h, D376 Mức 1)
      // GAP (Khoảng trống thông tin cần làm rõ)
      let warningLevel: InterventionWarningLevel = 'EARLY';

      if (
        sopL4Eval.isSopLevel4 ||
        item.isEmergency ||
        breakdown.level === 'EMERGENCY' ||
        d376.tier === 3 ||
        item.decree376Tier === 3 ||
        breakdown.riskScore >= 80
      ) {
        warningLevel = 'EMERGENCY';
      } else if (
        breakdown.level === 'RAPID' ||
        item.warningPipeline?.level3Action?.alertLevel === 'RAPID' ||
        (item.isUrgent && breakdown.riskScore >= 60) ||
        breakdown.riskScore >= 60
      ) {
        warningLevel = 'RAPID';
      } else if (
        breakdown.level === 'EARLY' ||
        item.warningPipeline?.level3Action?.alertLevel === 'EARLY' ||
        d376.tier === 2 ||
        item.decree376Tier === 2 ||
        isEarly ||
        breakdown.riskScore >= 40
      ) {
        warningLevel = 'EARLY';
      } else if (
        breakdown.level === 'DISTANT' ||
        item.warningPipeline?.level3Action?.alertLevel === 'DISTANT' ||
        isDistant ||
        d376.tier === 1 ||
        item.decree376Tier === 1 ||
        breakdown.riskScore >= 20
      ) {
        warningLevel = 'DISTANT';
      } else if (
        item.informationVacuum?.isAlertWarranted ||
        (item.informationVacuum?.hasGap &&
          item.informationVacuum?.gapLevel !== 'NO_GAP' &&
          item.informationVacuum?.gapLevel !== 'MARKET_DIGEST')
      ) {
        warningLevel = 'GAP';
      } else {
        // Fallback
        if (breakdown.riskScore >= 80) warningLevel = 'EMERGENCY';
        else if (breakdown.riskScore >= 60) warningLevel = 'RAPID';
        else if (breakdown.riskScore >= 40) warningLevel = 'EARLY';
        else warningLevel = 'DISTANT';
      }

      return {
        article: item,
        breakdown,
        classification,
        sopL4Eval,
        d376,
        isHandled,
        warningLevel,
      };
    });
  }, [articles, handledArticleIds]);

  // Split into active and handled
  const activeItems = useMemo(() => enrichedArticles.filter((x) => !x.isHandled), [enrichedArticles]);
  const handledItems = useMemo(() => enrichedArticles.filter((x) => x.isHandled), [enrichedArticles]);

  // Filter based on activeTab, levelFilter, searchQuery
  const displayedItems = useMemo(() => {
    const sourceList = activeTab === 'active' ? activeItems : handledItems;
    return sourceList.filter((entry) => {
      if (selectedLevelFilter !== 'ALL') {
        if (selectedLevelFilter === 'MONITORING') {
          if (entry.warningLevel !== 'EARLY' && entry.warningLevel !== 'DISTANT') return false;
        } else if (entry.warningLevel !== selectedLevelFilter) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const title = (entry.article.title || '').toLowerCase();
        const agency = (entry.article.agencies?.[0] || entry.article.source || '').toLowerCase();
        const summary = (entry.article.summary || '').toLowerCase();
        if (!title.includes(q) && !agency.includes(q) && !summary.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [activeTab, activeItems, handledItems, selectedLevelFilter, searchQuery]);

  // Statistics summary synchronized with all warning levels
  const stats = useMemo(() => {
    const total = enrichedArticles.length;
    const active = activeItems.length;
    const handled = handledItems.length;
    const emergencyCount = activeItems.filter((x) => x.warningLevel === 'EMERGENCY').length;
    const rapidCount = activeItems.filter((x) => x.warningLevel === 'RAPID').length;
    const earlyCount = activeItems.filter((x) => x.warningLevel === 'EARLY').length;
    const distantCount = activeItems.filter((x) => x.warningLevel === 'DISTANT').length;
    const gapCount = activeItems.filter((x) => x.warningLevel === 'GAP').length;
    return { total, active, handled, emergencyCount, rapidCount, earlyCount, distantCount, gapCount };
  }, [enrichedArticles, activeItems, handledItems]);

  const handleMarkAllActiveAsHandled = () => {
    activeItems.forEach((x) => {
      if (!handledArticleIds.has(x.article.id)) {
        onToggleHandled(x.article.id);
      }
    });
  };

  const handleRestoreAllHandled = () => {
    handledItems.forEach((x) => {
      if (handledArticleIds.has(x.article.id)) {
        onToggleHandled(x.article.id);
      }
    });
  };

  if (!isOpen) return null;

  const getLevelBadge = (level: InterventionWarningLevel) => {
    switch (level) {
      case 'EMERGENCY':
        return {
          label: '🚨 Cấp 4: Khẩn cấp (SOP 2-4h)',
          style: 'bg-rose-950 text-rose-200 border-rose-800 font-black',
          timing: 'Khung giờ vàng: 2 – 4 giờ',
          badgeColor: 'text-rose-400',
        };
      case 'RAPID':
        return {
          label: '⚡ Cấp 3: Trọng yếu (12h)',
          style: 'bg-amber-950 text-amber-200 border-amber-800 font-black',
          timing: 'Thời hạn xử lý: Trong vòng 12 giờ',
          badgeColor: 'text-amber-400',
        };
      case 'EARLY':
      case 'DISTANT':
        return {
          label: '📌 C1-C2: Theo dõi & Phòng ngừa',
          style: 'bg-slate-800 text-slate-200 border-slate-700 font-bold',
          timing: 'Chu kỳ theo dõi: 24 – 48 giờ',
          badgeColor: 'text-slate-300',
        };
      case 'GAP':
      default:
        return {
          label: '⚡ Khoảng trống thông tin (Cần làm rõ)',
          style: 'bg-yellow-950 text-yellow-200 border-yellow-800 font-extrabold',
          timing: 'Cung cấp dữ liệu: Trong 12 – 24 giờ',
          badgeColor: 'text-yellow-400',
        };
    }
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-2 sm:p-4 bg-black/85 z-[100] backdrop-blur-md animate-fadeIn ${
      isFullscreen ? 'p-0' : ''
    }`}>
      <div
        className={`relative flex flex-col overflow-hidden transition-all duration-200 bg-slate-950 text-slate-100 ${
          isFullscreen
            ? 'fixed inset-0 w-full h-full max-w-none max-h-none rounded-none border-0 shadow-none z-[100]'
            : 'w-full max-w-7xl max-h-[95vh] rounded-2xl border-2 border-slate-700 shadow-2xl'
        }`}
      >
        {/* Modal Top Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 select-none ${
            isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}
          onDoubleClick={() => setIsFullscreen(!isFullscreen)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shadow-xs border border-slate-700">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider bg-rose-600 text-white px-2.5 py-0.5 rounded border border-rose-500 font-sans shadow-xs">
                  VẤN ĐỀ CẦN CHỈ ĐẠO & XỬ LÝ KHẨN
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {stats.active} vấn đề chờ xử lý ({stats.total} tổng cộng)
                </span>
                <span className="text-[11px] font-semibold text-slate-400 hidden md:inline">
                  • Đồng bộ chuẩn 4 Cấp Cảnh báo SOP & Nghị định 376/2026/NĐ-CP
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-2">
                Bảng Điều Hành Quản Lý Vấn Đề Cần Chỉ Đạo & Xử Lý Khẩn
              </h2>
            </div>
          </div>

          {/* Action buttons: Maximize / Minimize + Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
              title={isFullscreen ? 'Thu nhỏ về kích thước chuẩn' : 'Mở rộng toàn bộ màn hình (Full Screen)'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold hidden sm:inline text-amber-400">Thu nhỏ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span className="text-xs font-bold hidden sm:inline">Toàn màn hình</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick KPI Strip inside modal (Synchronized across all warning levels) */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3 overflow-x-auto custom-scrollbar shrink-0 flex-wrap">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'active'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>Chờ can thiệp</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-white font-mono font-bold text-[11px]">
                {stats.active}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('handled')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'handled'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đã xử lý (Phiên này)</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-emerald-400 font-mono font-bold text-[11px]">
                {stats.handled}
              </span>
            </button>
          </div>

          {/* Level count pills: Cấp 4, Cấp 3, Cấp 1-2, Khoảng trống */}
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold shrink-0 flex-wrap">
            <span
              onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'EMERGENCY' ? 'ALL' : 'EMERGENCY')}
              className={`px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                selectedLevelFilter === 'EMERGENCY'
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-rose-950/80 text-rose-300 border-rose-800/80 hover:bg-rose-900'
              }`}
              title="Cấp 4: Khẩn cấp (SOP 2-4h, 80-100đ)"
            >
              <span>🚨 C4 Khẩn cấp:</span> <strong>{stats.emergencyCount}</strong>
            </span>

            <span
              onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'RAPID' ? 'ALL' : 'RAPID')}
              className={`px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                selectedLevelFilter === 'RAPID'
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-amber-950/80 text-amber-300 border-amber-800/80 hover:bg-amber-900'
              }`}
              title="Cấp 3: Trọng yếu (12h, xét trong 3 ngày qua)"
            >
              <span>⚡ C3 Trọng yếu:</span> <strong>{stats.rapidCount}</strong>
            </span>

            <span
              onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'MONITORING' ? 'ALL' : 'MONITORING')}
              className={`px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                selectedLevelFilter === 'MONITORING'
                  ? 'bg-slate-700 text-white border-slate-600'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
              title="Cấp 1 - Cấp 2: Chỉ để ở mức Theo dõi & Phòng ngừa (24-48h)"
            >
              <span>📌 C1-C2 Theo dõi:</span> <strong>{stats.earlyCount + stats.distantCount}</strong>
            </span>

            {stats.gapCount > 0 && (
              <span
                onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'GAP' ? 'ALL' : 'GAP')}
                className={`px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                  selectedLevelFilter === 'GAP'
                    ? 'bg-yellow-600 text-white border-yellow-500'
                    : 'bg-yellow-950/80 text-yellow-300 border-yellow-800/80 hover:bg-yellow-900'
                }`}
                title="Khoảng trống thông tin cần làm rõ"
              >
                <span>⚡ Khoảng trống:</span> <strong>{stats.gapCount}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Filters, Batch Action and Search Bar */}
        <div className="px-6 py-2.5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            {[
              { id: 'ALL', label: `Tất cả (${activeTab === 'active' ? stats.active : stats.handled})` },
              { id: 'EMERGENCY', label: `🚨 C4: Khẩn cấp (${stats.emergencyCount})` },
              { id: 'RAPID', label: `⚡ C3: Trọng yếu (${stats.rapidCount})` },
              { id: 'MONITORING', label: `📌 C1-C2: Theo dõi & Phòng ngừa (${stats.earlyCount + stats.distantCount})` },
              ...(stats.gapCount > 0 ? [{ id: 'GAP', label: `❓ Khoảng trống thông tin (${stats.gapCount})` }] : []),
            ].map(({ id, label }) => {
              const isSelected = selectedLevelFilter === id;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedLevelFilter(id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-white text-slate-950 font-black shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'active' && activeItems.length > 0 && (
              <button
                onClick={handleMarkAllActiveAsHandled}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition cursor-pointer shadow-xs flex items-center gap-1 whitespace-nowrap"
                title="Đánh dấu đã xử lý toàn bộ các vấn đề trong phiên quét này"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Xử lý tất cả ({activeItems.length})</span>
              </button>
            )}

            {activeTab === 'handled' && handledItems.length > 0 && (
              <button
                onClick={handleRestoreAllHandled}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black transition cursor-pointer shadow-xs flex items-center gap-1 whitespace-nowrap border border-slate-700"
                title="Khôi phục toàn bộ bài viết đã xử lý"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục tất cả</span>
              </button>
            )}

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm vấn đề chỉ đạo..."
                className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Main List of Articles */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {displayedItems.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold border border-emerald-800">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-white">
                {activeTab === 'active'
                  ? selectedLevelFilter !== 'ALL'
                    ? `Không có vấn đề nào thuộc mức lọc này (${selectedLevelFilter})`
                    : 'Không còn vấn đề cảnh báo nào cần can thiệp'
                  : 'Chưa có bài viết nào được đánh dấu đã xử lý'}
              </h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                {activeTab === 'active'
                  ? 'Toàn bộ điểm tin cảnh báo trong phiên quét hiện tại đã được giải quyết hoặc đạt ngưỡng an toàn theo quy chế điều hành.'
                  : 'Khi xử lý xong một điểm tin, hãy tích vào ô "Đã xử lý" để loại bỏ bài viết khỏi danh sách can thiệp trong phiên quét.'}
              </p>
            </div>
          ) : (
            displayedItems.map(({ article, breakdown, classification, sopL4Eval, d376, isHandled, warningLevel }, index) => {
              const cleanTitle = decodeHtmlEntities(article.title || '');
              const agency = article.agencies?.[0] || article.source || 'Bộ Tài chính';
              const levelBadge = getLevelBadge(warningLevel);
              const publishedTime = classification.occurredTimeFormatted || formatNewsFullDateTime(article);

              const directAction =
                article.policyResponseAdvisor ||
                article.executiveDirective?.mediaStrategy?.tacticalRecommendation ||
                article.executiveDirective?.mediaStrategy?.title ||
                article.informationVacuum?.recommendedClosureAction ||
                classification.recommendedActionVi;

              return (
                <div
                  key={article.id || index}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all space-y-3 ${
                    isHandled
                      ? 'bg-slate-900/40 border-slate-800 opacity-70'
                      : warningLevel === 'EMERGENCY'
                      ? 'bg-rose-950/20 border-rose-800/80 shadow-md ring-1 ring-rose-900/50'
                      : warningLevel === 'RAPID'
                      ? 'bg-amber-950/20 border-amber-800/80 shadow-md ring-1 ring-amber-900/50'
                      : warningLevel === 'EARLY'
                      ? 'bg-blue-950/20 border-blue-800/80'
                      : warningLevel === 'DISTANT'
                      ? 'bg-indigo-950/20 border-indigo-800/80'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  {/* Top Bar of Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs border ${levelBadge.style}`}>
                        {levelBadge.label}
                      </span>

                      {/* Explicit SOP Level 4 Auto-Tag Badge */}
                      {sopL4Eval.isSopLevel4 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-700 text-white border border-rose-600 flex items-center gap-1 animate-pulse">
                          <AlertOctagon className="w-3 h-3 text-white" />
                          <span>Gán nhãn SOP Cấp 4</span>
                        </span>
                      )}

                      {/* Decree 376 Benchmark Chip */}
                      {(d376.matchedScenario || article.decree376Tier !== undefined) && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-200 border border-purple-800 flex items-center gap-1">
                          <Scale className="w-3 h-3 text-purple-400" />
                          <span>Nghị định 376: Mức {d376.tier} ({d376.matchedScenario?.scenarioCode || d376.tierLabelVi})</span>
                        </span>
                      )}

                      <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {agency}
                      </span>

                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{publishedTime}</span>
                      </span>

                      <span className="text-[11px] font-mono text-amber-300 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/60">
                        ⏱️ {levelBadge.timing}
                      </span>
                    </div>

                    {/* Prominent Checkbox to mark as handled */}
                    <div className="flex items-center gap-2 shrink-0">
                      <label className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition cursor-pointer select-none shadow-xs ${
                        isHandled
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-600'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}>
                        <input
                          type="checkbox"
                          checked={isHandled}
                          onChange={() => onToggleHandled(article.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs font-black">
                          {isHandled ? '✓ Đã xử lý (Ẩn)' : 'Đã xử lý (Xóa tin)'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Article Title */}
                  <div>
                    <h4
                      onClick={() => setDetailModalArticle(article)}
                      className="text-sm sm:text-base font-black text-white hover:text-amber-400 cursor-pointer transition leading-snug"
                    >
                      {cleanTitle}
                    </h4>
                    {article.summary && (
                      <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                        {article.summary}
                      </p>
                    )}
                  </div>

                  {/* Keyword violation alert callout if present */}
                  {sopL4Eval.matchedKeywords && sopL4Eval.matchedKeywords.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-xs flex items-center gap-2 flex-wrap">
                      <span className="font-black text-rose-300 uppercase text-[10px] tracking-wider">
                        Phát hiện từ khóa sai phạm tài chính nghiêm trọng:
                      </span>
                      <span className="font-mono text-rose-200 font-bold">
                        {sopL4Eval.matchedKeywords.join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Information Vacuum callout if present */}
                  {article.informationVacuum?.clarificationNeeded && (
                    <div className="p-2.5 rounded-lg bg-yellow-950/40 border border-yellow-800 text-xs space-y-1">
                      <span className="font-black text-yellow-300 uppercase text-[10px] tracking-wider block">
                        Khoảng trống thông tin cần làm rõ:
                      </span>
                      <p className="text-yellow-100 leading-relaxed font-medium">
                        {article.informationVacuum.clarificationNeeded}
                      </p>
                    </div>
                  )}

                  {/* Direct Action Recommendation */}
                  {directAction && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                      <span className="font-black text-amber-400 uppercase text-[10px] tracking-wider block">
                        Đề xuất chỉ đạo / SOP xử lý can thiệp:
                      </span>
                      <p className="text-slate-200 leading-relaxed font-medium">
                        {directAction}
                      </p>
                    </div>
                  )}

                  {/* Bottom Action Triggers */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setDetailModalArticle(article)}
                        className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Chi tiết tin</span>
                      </button>

                      {onOpenWarningPipeline && (
                        <button
                          onClick={() => onOpenWarningPipeline(article)}
                          className="px-2.5 py-1 rounded-lg border border-amber-700 bg-amber-950/50 hover:bg-amber-900 text-amber-300 font-black transition flex items-center gap-1 cursor-pointer"
                          title="Mở Mô hình Pipeline Cảnh báo sớm 3 Cấp Độ & Đối soát Nghị định 376"
                        >
                          <Compass className="w-3.5 h-3.5 text-amber-400" />
                          <span>Hồ Sơ Pipeline & NĐ 376</span>
                        </button>
                      )}

                      {onDraftStatement && (
                        <button
                          onClick={() => onDraftStatement(article)}
                          className="px-2.5 py-1 rounded-lg border border-blue-700 bg-blue-950/50 hover:bg-blue-900 text-blue-200 font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 text-blue-400" />
                          <span>Dự thảo phát ngôn</span>
                        </button>
                      )}

                      {onOpenGmailAlertModal && (
                        <button
                          onClick={() => onOpenGmailAlertModal(article)}
                          className="px-2.5 py-1 rounded-lg border border-rose-700 bg-rose-950/50 hover:bg-rose-900 text-rose-200 font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5 text-rose-400" />
                          <span>Gửi Gmail khẩn</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 font-bold">
                        Điểm rủi ro: <strong className="text-amber-400">{breakdown.riskScore}đ</strong> / 100 ({breakdown.level})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-between shrink-0 text-xs font-mono font-bold ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-slate-400' : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}
        >
          <span>
            Đã xử lý {stats.handled}/{stats.total} vấn đề trong phiên quét • Mức độ can thiệp: {stats.active} còn lại
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition cursor-pointer shadow-xs"
          >
            Hoàn tất & Đóng
          </button>
        </div>
      </div>

      {/* MODAL 3 PHẦN CHÍNH YẾU SINH BỞI AI CHO LÃNH ĐẠO */}
      {detailModalArticle && (
        <ExecutiveDirectiveDetailModal
          article={detailModalArticle}
          isOpen={Boolean(detailModalArticle)}
          onClose={() => setDetailModalArticle(null)}
          isHandled={handledArticleIds.has(detailModalArticle.id)}
          onToggleHandled={(id) => onToggleHandled(id)}
          onOpenGmailAlertModal={onOpenGmailAlertModal}
          onDraftStatement={onDraftStatement}
          allArticles={articles}
          isDark={isDark}
        />
      )}
    </div>
  );
};

