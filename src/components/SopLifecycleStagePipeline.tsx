import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Zap,
  Clock,
  CheckCircle2,
  Filter,
  X,
  FileText,
  ChevronRight,
  Sparkles,
  Radio,
  Layers,
  Scale,
  Send,
  BellRing,
  RotateCw
} from 'lucide-react';
import { ScrapedNewsItem } from '../types';
import { cleanHtmlTitle } from '../lib/htmlDecoder';
import { clusterNewsArticles, ClusteredEventCard } from '../lib/eventClusteringEngine';
import { extractQuantitativeBreakdown } from './QuantitativeFormulaBreakdown';
import { Decree376ClassificationEngine } from '../lib/decree376ClassificationEngine';
import { saveSopTrackingRecordToCloud } from '../lib/firebase';
import {
  isRoutineDigestOrSingleIncident,
  isDistantWarningWeakSignal,
  calculate3DayTopicFrequency,
  getDirectiveImportance,
  getDirectiveTier
} from '../lib/policyFrictionEngine';
import { ExecutiveDirectiveDetailModal } from './ExecutiveDirectiveDetailModal';

export type SopLifecycleLevel =
  | 'URGENT'
  | 'IMPORTANT'
  | 'MONITORING'
  | 'ALL'
  | 'DIRECTIVE_URGENT'
  | 'EMERGENCY'
  | 'RAPID'
  | 'EARLY'
  | 'DISTANT'
  | 'STANDARD';

export type ImportanceLevel = 'URGENT' | 'IMPORTANT' | 'MONITORING';
export type ActionCategory = 'ALL' | 'STATEMENT' | 'LEGAL' | 'POLICY';
export type HandlingStatus = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

interface SopLifecycleStagePipelineProps {
  articles: ScrapedNewsItem[];
  selectedLevel: SopLifecycleLevel;
  onSelectLevel: (level: SopLifecycleLevel) => void;
  onSelectArticle?: (article: ScrapedNewsItem) => void;
  onOpenWarningPipeline?: (article: ScrapedNewsItem) => void;
  onDraftStatement?: (article: ScrapedNewsItem) => void;
  onOpenGmailAlertModal?: (article: ScrapedNewsItem) => void;
  onOpenAlertTriggerModal?: () => void;
  onOpenBatchAlertDrawer?: () => void;
  activeTriggersCount?: number;
  activeAlertsCount?: number;
  isDark?: boolean;
}

// Helper to determine importance level strictly based on Directive Tier:
// - C4: Khẩn cấp -> 'URGENT'
// - C3: Trọng yếu -> 'IMPORTANT'
// - C1, C2: Bắt buộc xếp vào Theo dõi & Phòng ngừa -> 'MONITORING'
function getArticleImportance(item: ScrapedNewsItem): ImportanceLevel {
  return getDirectiveImportance(item);
}

// Helper to categorize required action
function getArticleActionCategory(item: ScrapedNewsItem): 'STATEMENT' | 'LEGAL' | 'POLICY' {
  const text = `${item.title} ${item.summary || ''} ${item.executiveDirective?.rootCause || ''}`.toLowerCase();
  if (
    text.includes('phát ngôn') ||
    text.includes('thông cáo') ||
    text.includes('tin đồn') ||
    text.includes('báo chí') ||
    text.includes('dư luận') ||
    item.executiveDirective?.mediaStrategy?.type === 'crisis_resolution'
  ) {
    return 'STATEMENT';
  }
  if (
    text.includes('thanh tra') ||
    text.includes('kiểm tra') ||
    text.includes('pháp lý') ||
    text.includes('xử phạt') ||
    text.includes('vi phạm') ||
    text.includes('thẩm quyền') ||
    text.includes('khởi tố') ||
    item.executiveDirective?.mediaStrategy?.type === 'law_enforcement'
  ) {
    return 'LEGAL';
  }
  return 'POLICY';
}

export const SopLifecycleStagePipeline: React.FC<SopLifecycleStagePipelineProps> = ({
  articles = [],
  selectedLevel = 'ALL',
  onSelectLevel,
  onSelectArticle,
  onOpenWarningPipeline,
  onDraftStatement,
  onOpenGmailAlertModal,
  onOpenAlertTriggerModal,
  onOpenBatchAlertDrawer,
  activeTriggersCount = 0,
  activeAlertsCount = 0,
  isDark = false
}) => {
  // Local state for dynamic handling status overrides (persisted to Firestore & local cache)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, 'NEW' | 'IN_PROGRESS' | 'DONE'>>({});
  const [directiveModalArticle, setDirectiveModalArticle] = useState<ScrapedNewsItem | null>(null);

  // Sub-filters: Progress Status & Action Category
  const [statusTab, setStatusTab] = useState<HandlingStatus>('ALL');
  const [actionCategoryTab, setActionCategoryTab] = useState<ActionCategory>('ALL');
  const [isClusteredMode, setIsClusteredMode] = useState<boolean>(true);
  const [expandedClusterIds, setExpandedClusterIds] = useState<Set<string>>(new Set());

  const toggleClusterExpand = (clusterId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedClusterIds((prev) => {
      const next = new Set(prev);
      if (next.has(clusterId)) next.delete(clusterId);
      else next.add(clusterId);
      return next;
    });
  };

  // Consolidated list of all articles requiring action/directive
  const actionableArticles = useMemo(() => {
    return articles.filter((item) => {
      if (item.isMarketDigest) return false;

      // Thuật toán loại bỏ các bài "điểm tin / thông báo vụ việc / sự kiện đơn lẻ"
      // không tạo băn khoăn chính sách (Loạt bài vĩ mô chung chung, nợ thuế/phạt hành chính cá nhân, tái cơ cấu bộ khác)
      const routineCheck = isRoutineDigestOrSingleIncident(item.title, item.summary || item.snippet || '');
      if (routineCheck.isRoutine) return false;

      const d376 = Decree376ClassificationEngine.classify(item);
      if (d376.isExcluded || d376.tier === 0) return false;
      const breakdown = extractQuantitativeBreakdown(item);
      // Loại trừ tin thường quy an toàn (< 20 điểm)
      if (breakdown.level === 'STANDARD' || breakdown.riskScore < 20) return false;
      const isWarning =
        breakdown.level === 'EMERGENCY' ||
        breakdown.level === 'RAPID' ||
        breakdown.level === 'EARLY' ||
        breakdown.level === 'DISTANT';
      const isIntervention = Boolean(item.informationVacuum?.isAlertWarranted);
      return Boolean(isWarning || isIntervention);
    });
  }, [articles]);

  // Compute status of an article considering local overrides
  const getEffectiveStatus = (article: ScrapedNewsItem): 'NEW' | 'IN_PROGRESS' | 'DONE' => {
    if (statusOverrides[article.id]) {
      return statusOverrides[article.id];
    }
    return article.handlingStatus || 'NEW';
  };

  // Group by Importance Level
  const importanceCounts = useMemo(() => {
    let urgent = 0;
    let important = 0;
    let monitoring = 0;

    actionableArticles.forEach((item) => {
      const imp = getArticleImportance(item);
      if (imp === 'URGENT') urgent++;
      else if (imp === 'IMPORTANT') important++;
      else monitoring++;
    });

    return {
      URGENT: urgent,
      IMPORTANT: important,
      MONITORING: monitoring,
      TOTAL: actionableArticles.length
    };
  }, [actionableArticles]);

  // Determine active importance filter mapped from selectedLevel
  const activeImportanceFilter: ImportanceLevel | 'ALL' = useMemo(() => {
    if (selectedLevel === 'ALL' || selectedLevel === 'DIRECTIVE_URGENT') return 'ALL';
    if (selectedLevel === 'URGENT' || selectedLevel === 'EMERGENCY') return 'URGENT';
    if (selectedLevel === 'IMPORTANT' || selectedLevel === 'RAPID') return 'IMPORTANT';
    if (selectedLevel === 'MONITORING' || selectedLevel === 'EARLY' || selectedLevel === 'DISTANT') return 'MONITORING';
    return 'ALL';
  }, [selectedLevel]);

  // Filtered articles list based on: Importance + Status Tab + Action Category Tab
  const filteredArticles = useMemo(() => {
    return actionableArticles.filter((item) => {
      // 1. Importance filter
      if (activeImportanceFilter !== 'ALL') {
        const imp = getArticleImportance(item);
        if (imp !== activeImportanceFilter) return false;
      }

      // 2. Status tab filter
      const currentStatus = getEffectiveStatus(item);
      if (statusTab === 'PENDING' && currentStatus !== 'NEW') return false;
      if (statusTab === 'IN_PROGRESS' && currentStatus !== 'IN_PROGRESS') return false;
      if (statusTab === 'COMPLETED' && currentStatus !== 'DONE') return false;

      // 3. Action category filter
      if (actionCategoryTab !== 'ALL') {
        const cat = getArticleActionCategory(item);
        if (cat !== actionCategoryTab) return false;
      }

      return true;
    });
  }, [actionableArticles, articles, activeImportanceFilter, statusTab, actionCategoryTab, statusOverrides]);

  // Gom cụm tin bài trùng nhau theo Cosine / TF-IDF
  const clusteredEvents: ClusteredEventCard[] = useMemo(() => {
    if (!isClusteredMode || filteredArticles.length === 0) return [];
    return clusterNewsArticles(filteredArticles, 65);
  }, [filteredArticles, isClusteredMode]);

  // Status counts for actionable items
  const statusCounts = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let completed = 0;

    actionableArticles.forEach((item) => {
      const st = getEffectiveStatus(item);
      if (st === 'NEW') pending++;
      else if (st === 'IN_PROGRESS') inProgress++;
      else if (st === 'DONE') completed++;
    });

    return {
      ALL: actionableArticles.length,
      PENDING: pending,
      IN_PROGRESS: inProgress,
      COMPLETED: completed
    };
  }, [actionableArticles, statusOverrides]);

  // Action category counts
  const actionCounts = useMemo(() => {
    let statement = 0;
    let legal = 0;
    let policy = 0;

    actionableArticles.forEach((item) => {
      const cat = getArticleActionCategory(item);
      if (cat === 'STATEMENT') statement++;
      else if (cat === 'LEGAL') legal++;
      else if (cat === 'POLICY') policy++;
    });

    return {
      ALL: actionableArticles.length,
      STATEMENT: statement,
      LEGAL: legal,
      POLICY: policy
    };
  }, [actionableArticles]);

  // Handler to toggle handling status
  const handleUpdateStatus = (article: ScrapedNewsItem, nextStatus: 'NEW' | 'IN_PROGRESS' | 'DONE') => {
    setStatusOverrides((prev) => ({
      ...prev,
      [article.id]: nextStatus
    }));

    const actionLabel =
      nextStatus === 'IN_PROGRESS'
        ? 'Đang xử lý & phân công'
        : nextStatus === 'DONE'
        ? 'Đã chỉ đạo hoàn tất'
        : 'Chờ xử lý';

    saveSopTrackingRecordToCloud(article.id, nextStatus, actionLabel);

    if (nextStatus === 'DONE') {
      const tier = getDirectiveTier(article);
      const importance = tier === 'C4' ? 'URGENT' : tier === 'C3' ? 'IMPORTANT' : 'MONITORING';
      fetch('/api/processed-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: article.id,
          articleId: article.id,
          title: article.title,
          url: article.url || (article as any).link,
          source: article.source,
          summary: article.summary,
          publishedAt: article.publishedAt,
          handledAt: new Date().toISOString(),
          tier,
          importance,
          directiveLabel: actionLabel,
          handlingStatus: 'DONE',
          handledBy: 'Lãnh đạo Bộ / Ban Chỉ đạo',
          solutionSummary: (article as any).interventionBrief?.suggestedAction || 'Đã đọc và chỉ đạo xử lý hoàn tất',
          sector: article.sector
        })
      }).catch(() => {});
    } else {
      fetch(`/api/processed-actions/${article.id}`, { method: 'DELETE' }).catch(() => {});
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl border-2 transition-all space-y-5 bg-white border-slate-300 shadow-sm text-slate-900">
      {/* 1. Header tinh gọn nhất cho lãnh đạo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-slate-900 text-white shadow-xs">
            <Radio className="w-5 h-5 animate-pulse text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-wide text-slate-950">
                Chỉ Đạo & Xử Lý Khẩn
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-950 border border-rose-300 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                <span>{actionableArticles.length} bài cần xử lý</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-slate-700 mt-1">
              Phân loại tin bài cần xử lý theo mức độ quan trọng & tiến độ tác chiến
            </p>
          </div>
        </div>

        {/* Nút thao tác nhanh & Xóa lọc */}
        <div className="flex items-center gap-2 flex-wrap">
          {(activeImportanceFilter !== 'ALL' || statusTab !== 'ALL' || actionCategoryTab !== 'ALL') && (
            <button
              onClick={() => {
                onSelectLevel('ALL');
                setStatusTab('ALL');
                setActionCategoryTab('ALL');
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-950"
              title="Xóa bộ lọc và hiển thị toàn bộ"
            >
              <X className="w-4 h-4 text-slate-900" />
              <span>Xem tất cả ({actionableArticles.length})</span>
            </button>
          )}

          {onOpenBatchAlertDrawer && activeAlertsCount > 0 && (
            <button
              onClick={onOpenBatchAlertDrawer}
              className="px-3.5 py-1.5 rounded-xl border-2 text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-950"
            >
              <BellRing className="w-4 h-4 text-rose-700" />
              <span>Thông báo nóng ({activeAlertsCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* VÒNG ĐỜI SOP XỬ LÝ KHỦNG HOẢNG & CAN THIỆP (TINH GỌN CHO LÃNH ĐẠO) */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wide mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-900" />
            <span>VÒNG ĐỜI SOP TIẾP NHẬN & XỬ LÝ KHỦNG HOẢNG (4 ĐẦU MỤC CHÍNH)</span>
          </div>
          <span className="text-slate-500 font-mono text-[11px] font-bold">Quy trình rút gọn cho Lãnh đạo</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-white border border-slate-300 font-bold flex items-center gap-2 shadow-2xs">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">1</span>
            <span className="truncate text-slate-900">1. Tiếp nhận & Phân cấp (C1-C4)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-slate-300 font-bold flex items-center gap-2 shadow-2xs">
            <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">2</span>
            <span className="truncate text-slate-900">2. Khoảng trống thông tin</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-slate-300 font-bold flex items-center gap-2 shadow-2xs">
            <span className="w-5 h-5 rounded-full bg-rose-700 text-white flex items-center justify-center text-[10px] font-black shrink-0">3</span>
            <span className="truncate text-slate-900">3. Đề xuất can thiệp</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-slate-300 font-bold flex items-center gap-2 shadow-2xs">
            <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-black shrink-0">4</span>
            <span className="truncate text-slate-900">4. Xuất giải pháp & Hoàn tất</span>
          </div>
        </div>
      </div>

      {/* 2. Ba mức độ quan trọng tinh gọn thay thế 4 cấp độ cảnh báo cũ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Thẻ 1: Khẩn Cấp (C4) */}
        <div
          onClick={() => onSelectLevel(activeImportanceFilter === 'URGENT' ? 'ALL' : 'URGENT')}
          className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative select-none flex flex-col justify-between min-h-[140px] ${
            activeImportanceFilter === 'URGENT'
              ? 'bg-rose-900 text-white border-rose-950 shadow-lg ring-2 ring-rose-500/50'
              : importanceCounts.URGENT > 0
              ? 'bg-rose-50/80 hover:bg-rose-100/90 border-rose-300 text-rose-950'
              : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg">🚨</span>
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                  Khẩn Cấp (C4)
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black font-mono border ${
                  activeImportanceFilter === 'URGENT'
                    ? 'bg-white text-rose-950 border-white'
                    : 'bg-rose-700 text-white border-rose-800'
                }`}
              >
                {importanceCounts.URGENT} bài
              </span>
            </div>
            <p
              className={`text-xs font-extrabold leading-snug ${
                activeImportanceFilter === 'URGENT' ? 'text-rose-100' : 'text-slate-700'
              }`}
            >
              Điểm nóng dư luận, khủng hoảng truyền thông hoặc rủi ro pháp lý cấp bách (C4).
            </p>
          </div>
          <div
            className={`pt-2.5 mt-2 border-t flex items-center justify-between text-xs font-black ${
              activeImportanceFilter === 'URGENT' ? 'border-rose-800 text-rose-200' : 'border-rose-200 text-rose-900'
            }`}
          >
            <span>SLA: Hỏa tốc trong 2–4 giờ</span>
            <span>{activeImportanceFilter === 'URGENT' ? '✓ Đang lọc' : 'Lọc tin ➔'}</span>
          </div>
        </div>

        {/* Thẻ 2: Trọng Yếu (C3) */}
        <div
          onClick={() => onSelectLevel(activeImportanceFilter === 'IMPORTANT' ? 'ALL' : 'IMPORTANT')}
          className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative select-none flex flex-col justify-between min-h-[140px] ${
            activeImportanceFilter === 'IMPORTANT'
              ? 'bg-slate-900 text-white border-slate-950 shadow-lg ring-2 ring-slate-500/50'
              : importanceCounts.IMPORTANT > 0
              ? 'bg-amber-50/80 hover:bg-amber-100/90 border-amber-300 text-amber-950'
              : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg">⚡</span>
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                  Trọng Yếu (C3)
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black font-mono border ${
                  activeImportanceFilter === 'IMPORTANT'
                    ? 'bg-white text-slate-950 border-white'
                    : 'bg-amber-700 text-white border-amber-800'
                }`}
              >
                {importanceCounts.IMPORTANT} bài
              </span>
            </div>
            <p
              className={`text-xs font-extrabold leading-snug ${
                activeImportanceFilter === 'IMPORTANT' ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              Chính sách mới phản ánh nhiều băn khoăn hoặc xuất hiện dày đặc trong 3 ngày qua (C3).
            </p>
          </div>
          <div
            className={`pt-2.5 mt-2 border-t flex items-center justify-between text-xs font-black ${
              activeImportanceFilter === 'IMPORTANT' ? 'border-slate-800 text-slate-300' : 'border-amber-200 text-amber-900'
            }`}
          >
            <span>SLA: Xử lý trong ngày (12 giờ)</span>
            <span>{activeImportanceFilter === 'IMPORTANT' ? '✓ Đang lọc' : 'Lọc tin ➔'}</span>
          </div>
        </div>

        {/* Thẻ 3: Theo Dõi & Phòng Ngừa (C1, C2) */}
        <div
          onClick={() => onSelectLevel(activeImportanceFilter === 'MONITORING' ? 'ALL' : 'MONITORING')}
          className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative select-none flex flex-col justify-between min-h-[140px] ${
            activeImportanceFilter === 'MONITORING'
              ? 'bg-slate-900 text-white border-slate-950 shadow-lg ring-2 ring-slate-500/50'
              : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg">📌</span>
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                  Theo Dõi & Phòng Ngừa (C1, C2)
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black font-mono border ${
                  activeImportanceFilter === 'MONITORING'
                    ? 'bg-white text-slate-950 border-white'
                    : 'bg-slate-200 text-slate-950 border-slate-300'
                }`}
              >
                {importanceCounts.MONITORING} bài
              </span>
            </div>
            <p
              className={`text-xs font-extrabold leading-snug ${
                activeImportanceFilter === 'MONITORING' ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              Các tin tức ở mức C1 và C2 (cảnh báo sớm, cảnh báo xa, lấp lửng, điểm mới chính sách) chỉ để ở mức theo dõi và phòng ngừa.
            </p>
          </div>
          <div
            className={`pt-2.5 mt-2 border-t flex items-center justify-between text-xs font-black ${
              activeImportanceFilter === 'MONITORING' ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-800'
            }`}
          >
            <span>SLA: Theo dõi 24–48 giờ (Phòng ngừa)</span>
            <span>{activeImportanceFilter === 'MONITORING' ? '✓ Đang lọc' : 'Lọc tin ➔'}</span>
          </div>
        </div>
      </div>

      {/* 3. Thanh điều hướng lọc Tiến độ & Phân loại hành động (Segmented Controls) */}
      <div className="p-3 sm:p-4 rounded-xl bg-slate-100 border border-slate-300 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Bộ lọc Tiến độ */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black uppercase text-slate-800 mr-1">Tiến độ:</span>
          <div className="inline-flex p-1 rounded-xl bg-slate-200 border border-slate-300">
            <button
              onClick={() => setStatusTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                statusTab === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-800 hover:text-slate-950'
              }`}
            >
              Tất cả ({statusCounts.ALL})
            </button>
            <button
              onClick={() => setStatusTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                statusTab === 'PENDING' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-800 hover:text-slate-950'
              }`}
            >
              <span>Chờ xử lý</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-400/40 text-slate-950 text-[10px] font-mono">
                {statusCounts.PENDING}
              </span>
            </button>
            <button
              onClick={() => setStatusTab('IN_PROGRESS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                statusTab === 'IN_PROGRESS' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-800 hover:text-slate-950'
              }`}
            >
              <span>Đang xử lý</span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-200 text-blue-950 text-[10px] font-mono">
                {statusCounts.IN_PROGRESS}
              </span>
            </button>
            <button
              onClick={() => setStatusTab('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                statusTab === 'COMPLETED' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-800 hover:text-slate-950'
              }`}
            >
              <span>Đã hoàn tất</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-950 text-[10px] font-mono">
                {statusCounts.COMPLETED}
              </span>
            </button>
          </div>
        </div>

        {/* Bộ lọc Loại hành động */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black uppercase text-slate-800 mr-1">Hành động:</span>
          <div className="inline-flex p-1 rounded-xl bg-slate-200 border border-slate-300">
            <button
              onClick={() => setActionCategoryTab('ALL')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                actionCategoryTab === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-800 hover:text-slate-950'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActionCategoryTab('STATEMENT')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                actionCategoryTab === 'STATEMENT' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-800 hover:text-slate-950'
              }`}
            >
              <span>🎙️ Phát ngôn ({actionCounts.STATEMENT})</span>
            </button>
            <button
              onClick={() => setActionCategoryTab('LEGAL')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                actionCategoryTab === 'LEGAL' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-800 hover:text-slate-950'
              }`}
            >
              <span>⚖️ Pháp lý ({actionCounts.LEGAL})</span>
            </button>
            <button
              onClick={() => setActionCategoryTab('POLICY')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                actionCategoryTab === 'POLICY' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-800 hover:text-slate-950'
              }`}
            >
              <span>📜 Chính sách ({actionCounts.POLICY})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Danh sách bài viết cần chỉ đạo & xử lý */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-black text-slate-700 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              DANH SÁCH BÀI VIẾT CẦN XỬ LÝ ({isClusteredMode ? `${clusteredEvents.length} cụm / ${filteredArticles.length} bài` : `${filteredArticles.length} bài`})
              {activeImportanceFilter !== 'ALL' && ` • LỌC: ${activeImportanceFilter === 'URGENT' ? 'KHẨN CẤP' : activeImportanceFilter === 'IMPORTANT' ? 'TRỌNG YẾU' : 'THEO DÕI'}`}
              {statusTab !== 'ALL' && ` • TIẾN ĐỘ: ${statusTab === 'PENDING' ? 'CHỜ XỬ LÝ' : statusTab === 'IN_PROGRESS' ? 'ĐANG XỬ LÝ' : 'ĐÃ HOÀN TẤT'}`}
              {actionCategoryTab !== 'ALL' && ` • HÀNH ĐỘNG: ${actionCategoryTab === 'STATEMENT' ? 'PHÁT NGÔN' : actionCategoryTab === 'LEGAL' ? 'PHÁP LÝ' : 'CHÍNH SÁCH'}`}
            </span>
            <button
              onClick={() => setIsClusteredMode(!isClusteredMode)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                isClusteredMode
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                  : 'bg-slate-200 text-slate-800 border-slate-300'
              }`}
              title="Gom cụm các bài viết trùng lặp hoặc dẫn nguồn từ nhau"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isClusteredMode ? `✓ Đang gom cụm (${clusteredEvents.length} cụm)` : 'Gom cụm tin trùng'}</span>
            </button>
          </div>
          <span className="text-slate-500 font-bold">Nhấp vào bài viết để xem toàn văn</span>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="py-10 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-600 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-sm font-black text-slate-800">
              Không có bài viết nào phù hợp với bộ lọc đã chọn.
            </p>
            <p className="text-xs font-extrabold text-slate-500">
              Tất cả các vấn đề trong nhóm này đã được xử lý hoặc không có rủi ro phát sinh.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 border border-slate-300 rounded-xl overflow-hidden bg-white max-h-[500px] overflow-y-auto">
            {(isClusteredMode
              ? clusteredEvents
              : filteredArticles.map((a) => ({
                  id: a.id,
                  totalArticles: 1,
                  originArticle: a,
                  clusterTitle: a.title,
                  originSource: a.source,
                  echoArticles: [],
                  allSources: [a.source || 'Báo chí'],
                }))
            ).map((clusterItem: any) => {
              const article = clusterItem.originArticle || clusterItem;
              const isCluster = Boolean(clusterItem.totalArticles && clusterItem.totalArticles > 1);
              const isExpanded = expandedClusterIds.has(clusterItem.id);
              const breakdown = extractQuantitativeBreakdown(article);
              const tier = getDirectiveTier(article);
              const importance = getArticleImportance(article);
              const actionCat = getArticleActionCategory(article);
              const status = getEffectiveStatus(article);
              const freqInfo = calculate3DayTopicFrequency(article, articles);
              const distantSignal = isDistantWarningWeakSignal(article.title, article.summary || article.snippet || '');

              return (
                <div key={clusterItem.id} className="transition">
                  <div
                    onClick={() => setDirectiveModalArticle(article)}
                    className="p-4 hover:bg-slate-50 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3.5"
                  >
                    {/* Cột trái: Thông tin chính */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Huy hiệu Cụm tin nếu có nhiều nguồn cùng đưa */}
                        {isCluster && (
                          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-indigo-700 text-white flex items-center gap-1 shadow-2xs">
                            <Layers className="w-3 h-3" />
                            <span>Cụm tin: {clusterItem.totalArticles} nguồn báo</span>
                          </span>
                        )}

                        {/* Badge Mức độ quan trọng chuẩn C1-C4 */}
                        {importance === 'URGENT' && (
                          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-rose-700 text-white flex items-center gap-1 shadow-2xs">
                            <span>🚨 KHẨN CẤP (C4)</span>
                          </span>
                        )}
                        {importance === 'IMPORTANT' && (
                          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-600 text-white flex items-center gap-1 shadow-2xs">
                            <span>⚡ TRỌNG YẾU (C3{freqInfo.frequency > 1 ? ` - 3 ngày: ${freqInfo.frequency} bài` : ''})</span>
                          </span>
                        )}
                        {importance === 'MONITORING' && (
                          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-slate-700 text-white flex items-center gap-1 shadow-2xs">
                            <span>📌 THEO DÕI & PHÒNG NGỪA ({tier === 'C2' ? 'C2 - Cảnh báo sớm' : 'C1 - Cảnh báo xa'})</span>
                          </span>
                        )}

                        {/* Huy hiệu nhận diện tín hiệu lấp lửng / điểm mới chính sách */}
                        {distantSignal.isDistant && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-purple-100 text-purple-950 border border-purple-300 flex items-center gap-1" title={distantSignal.reason}>
                            <span>💡 Tín hiệu lấp lửng / Điểm mới chính sách</span>
                          </span>
                        )}

                        {/* Badge Loại hành động */}
                        <span className="text-[11px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-300">
                          {actionCat === 'STATEMENT' ? '🎙️ Phát ngôn' : actionCat === 'LEGAL' ? '⚖️ Pháp lý' : '📜 Chính sách'}
                        </span>

                        {/* Nguồn & Thời gian */}
                        <span className="text-xs font-bold text-slate-700">
                          <strong className="text-slate-900">{clusterItem.originSource || article.source || 'Báo chí'}</strong>
                          {isCluster && <span className="text-indigo-600 ml-1 font-semibold">(Đăng đầu tiên)</span>}
                          {' • '}
                          {article.publishedTimeStr || article.timeAgo || 'Vừa cập nhật'}
                        </span>

                        {/* Trạng thái tiến độ badge */}
                        {status === 'IN_PROGRESS' && (
                          <span className="text-[11px] font-black px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                            <span>Đang xử lý</span>
                          </span>
                        )}
                        {status === 'DONE' && (
                          <span className="text-[11px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>Đã hoàn tất</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-slate-950 hover:text-slate-800 transition line-clamp-2 leading-snug">
                        {cleanHtmlTitle(clusterItem.clusterTitle || article.title, article.summary)}
                      </h4>

                      {article.summary && (
                        <p className="text-xs font-semibold text-slate-600 line-clamp-1">
                          {article.summary}
                        </p>
                      )}

                      {/* Nút xem các nguồn dẫn lại */}
                      {isCluster && (
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => toggleClusterExpand(clusterItem.id, e)}
                            className="text-[11px] font-black text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? '▲ Thu gọn các báo khác' : `▼ Xem thêm ${clusterItem.echoArticles.length} nguồn báo khác cùng đưa tin`}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Cột phải: Điểm rủi ro & Nút thao tác lãnh đạo */}
                    <div className="flex items-center gap-2.5 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-200">
                      <div className="text-left md:text-right mr-1">
                        <div className="text-xs sm:text-sm font-mono font-black text-slate-950">
                          {breakdown.riskScore}đ Rủi ro
                        </div>
                        <div className="text-[11px] font-bold text-amber-700">
                          SLA: {tier === 'C4' ? 'Hỏa tốc 2–4h' : tier === 'C3' ? 'Trong ngày 12h' : 'Theo dõi 24–48h'}
                        </div>
                      </div>

                      {/* Nút đổi trạng thái 1-chạm */}
                      {status === 'NEW' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(article, 'IN_PROGRESS');
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-950 font-black text-xs transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Đánh dấu đang thụ lý giải quyết"
                        >
                          <span>Nhận xử lý</span>
                        </button>
                      )}

                      {status === 'IN_PROGRESS' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(article, 'DONE');
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-black text-xs transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Đánh dấu đã hoàn thành xử lý"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Hoàn tất</span>
                        </button>
                      )}

                      {status === 'DONE' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(article, 'IN_PROGRESS');
                          }}
                          className="p-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-black text-xs transition cursor-pointer"
                          title="Mở lại trạng thái đang xử lý"
                        >
                          <RotateCw className="w-3.5 h-3.5 text-slate-700" />
                        </button>
                      )}

                      {/* Nút Soạn văn bản */}
                      {onDraftStatement && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDraftStatement(article);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                          title="Soạn thảo thông cáo báo chí hoặc văn bản chỉ đạo"
                        >
                          <FileText className="w-3.5 h-3.5 text-white" />
                          <span className="hidden sm:inline">Chỉ đạo</span>
                        </button>
                      )}

                      {/* Nút gửi cảnh báo Gmail nếu khẩn cấp */}
                      {importance === 'URGENT' && onOpenGmailAlertModal && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenGmailAlertModal(article);
                          }}
                          className="p-2 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-950 font-black text-xs transition cursor-pointer"
                          title="Bắn cảnh báo khẩn cấp qua Gmail Lãnh đạo"
                        >
                          <Send className="w-3.5 h-3.5 text-rose-700" />
                        </button>
                      )}

                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Danh sách bài đưa tin tiếp theo khi mở cụm */}
                  {isCluster && isExpanded && clusterItem.echoArticles && (
                    <div className="bg-slate-50/90 border-t border-slate-200 px-6 py-2.5 space-y-1.5 text-xs">
                      <span className="font-black text-slate-700 uppercase block text-[10px]">
                        Các cơ quan báo chí dẫn nguồn hoặc đưa tin tiếp theo:
                      </span>
                      {clusterItem.echoArticles.map((echo: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => setDirectiveModalArticle(echo.article)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-400 transition cursor-pointer flex items-center justify-between gap-2"
                        >
                          <span className="text-slate-800 font-medium truncate">
                            <strong className="text-slate-900 mr-1">{echo.article.source || 'Báo khác'}:</strong>
                            {cleanHtmlTitle(echo.article.title)}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">
                            +{echo.lagMinutes > 0 ? `${echo.lagMinutes}p` : 'đồng thời'} • {echo.similarity}% tương đồng
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 3 PHẦN CHÍNH YẾU SINH BỞI AI CHO LÃNH ĐẠO */}
      {directiveModalArticle && (
        <ExecutiveDirectiveDetailModal
          article={directiveModalArticle}
          isOpen={Boolean(directiveModalArticle)}
          onClose={() => setDirectiveModalArticle(null)}
          isHandled={getEffectiveStatus(directiveModalArticle) === 'DONE'}
          onToggleHandled={() => {
            const currentStatus = getEffectiveStatus(directiveModalArticle);
            const nextStatus = currentStatus === 'DONE' ? 'IN_PROGRESS' : 'DONE';
            handleUpdateStatus(directiveModalArticle, nextStatus);
          }}
          onOpenGmailAlertModal={onOpenGmailAlertModal}
          onDraftStatement={onDraftStatement}
          allArticles={articles}
          isDark={isDark}
        />
      )}
    </div>
  );
};
