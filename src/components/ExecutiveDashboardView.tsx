import React, { useMemo, useState, useEffect } from 'react';
import {
  Activity,
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe2,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ScrapedNewsItem,
  ScrapeResponse,
  SectorType,
  TimeRange,
  ViewDensityMode,
} from '../types';
import { useTheme } from '../lib/theme';
import { PriorityPulse } from './PriorityPulse';
import { SopLifecycleStagePipeline, SopLifecycleLevel } from './SopLifecycleStagePipeline';
import { calculateSopSentimentShift, isSopLevel4Article, isEarlyWarningArticle, isDistantWarningArticle } from '../lib/sentimentCalculator';
import { getSentimentSlaInfo } from '../lib/sentimentNormalization';
import { getDirectiveTier } from '../lib/policyFrictionEngine';
import { Decree376ClassificationEngine } from '../lib/decree376ClassificationEngine';
import { InterventionManagementModal } from './InterventionManagementModal';
import { ExecutiveKpiDetailModal, ExecutiveKpiModalMode } from './ExecutiveKpiDetailModal';
import { extractQuantitativeBreakdown } from './QuantitativeFormulaBreakdown';
import { saveSopTrackingRecordToCloud } from '../lib/firebase';
import { MarketPulseWidget } from './MarketPulseWidget';
import { TopicTrendVelocityModule } from './TopicTrendVelocityModule';

interface ExecutiveDashboardViewProps {
  data: ScrapeResponse | null;
  timeRange: TimeRange;
  onTimeRangeChange: (tr: TimeRange) => void;
  sector: SectorType;
  onSelectSector: (s: SectorType) => void;
  enrichedTrendingKeywords?: any[];
  onSelectArticle: (article: ScrapedNewsItem) => void;
  onDraftStatement: (article: ScrapedNewsItem) => void;
  onOpenGmailAlertModal: (article: ScrapedNewsItem) => void;
  onOpenVideoModal?: (article: ScrapedNewsItem) => void;
  onOpenKeywordWeightModal?: () => void;
  onOpenOfficialPortalsModal: () => void;
  onNavigateTab: (tab: any) => void;
  handleSearch: (q: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  densityMode?: ViewDensityMode;
  onDensityModeChange?: (mode: ViewDensityMode) => void;
  showHighConfidenceOnly?: boolean;
  onToggleHighConfidenceOnly?: (val: boolean) => void;
  showHighConfidenceBrightSpotOnly?: boolean;
  onToggleHighConfidenceBrightSpotOnly?: (val: boolean) => void;
  neutralCount?: number;
  neutralPercentage?: number;
  bullishPercentage?: number;
  bearishPercentage?: number;
  showNeutralOnly?: boolean;
  onToggleNeutralOnly?: (val: boolean) => void;
  positiveCount?: number;
  crisisCount?: number;
  highConfidenceCrisisCount?: number;
  highConfidenceBrightSpotCount?: number;
  onOpenAiFeedbackModal?: (article: ScrapedNewsItem) => void;
  onOpenAiRulesModal?: () => void;
  onOpenWarningPipeline?: (article: ScrapedNewsItem) => void;
  selectedSopLevel?: SopLifecycleLevel;
  onSelectSopLevel?: (level: SopLifecycleLevel) => void;
  onOpenAlertTriggerModal?: () => void;
  onOpenBatchAlertDrawer?: () => void;
  activeTriggersCount?: number;
  activeAlertsCount?: number;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  data,
  timeRange,
  onSelectArticle,
  onDraftStatement,
  onOpenGmailAlertModal,
  onOpenOfficialPortalsModal,
  onNavigateTab,
  onRefresh,
  isLoading,
  crisisCount = 0,
  highConfidenceCrisisCount = 0,
  positiveCount = 0,
  bullishPercentage = 0,
  neutralPercentage = 0,
  bearishPercentage = 0,
  onOpenWarningPipeline,
  selectedSopLevel: propSelectedSopLevel,
  onSelectSopLevel,
  onOpenAlertTriggerModal,
  onOpenBatchAlertDrawer,
  activeTriggersCount = 0,
  activeAlertsCount = 0,
  handleSearch,
}) => {
  const { isDark } = useTheme();
  const [internalSopLevel, setInternalSopLevel] = useState<SopLifecycleLevel>('ALL');
  const currentSopLevel = propSelectedSopLevel !== undefined ? propSelectedSopLevel : internalSopLevel;
  const handleSelectSopLevel = (lvl: SopLifecycleLevel) => {
    setInternalSopLevel(lvl);
    if (onSelectSopLevel) onSelectSopLevel(lvl);
  };

  const sopSentimentShift = useMemo(() => {
    return calculateSopSentimentShift(data?.news || []);
  }, [data?.news]);

  const totalArticles = data?.totalFound || data?.news?.length || 0;
  const moodScore = sopSentimentShift.finalScore;
  const scannedWindow = data?.scannedWindow || `Phiên ${timeRange} (Giờ Việt Nam)`;

  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState<boolean>(false);
  const [isChiDaoSectionOpen, setIsChiDaoSectionOpen] = useState<boolean>(false);
  const [sessionHandledArticleIds, setSessionHandledArticleIds] = useState<Set<string>>(new Set());

  // Load handled articles from database on mount to maintain persistence
  useEffect(() => {
    let isMounted = true;
    fetch('/api/processed-actions?days=all')
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted || !json.success || !Array.isArray(json.actions)) return;
        const ids = new Set<string>();
        json.actions.forEach((a: any) => {
          if (a.articleId) ids.add(a.articleId);
          if (a.id) ids.add(a.id);
        });
        setSessionHandledArticleIds((prev) => new Set([...prev, ...ids]));
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleHandledArticle = async (articleId: string) => {
    const isNowHandled = !sessionHandledArticleIds.has(articleId);
    setSessionHandledArticleIds((prev) => {
      const next = new Set(prev);
      if (next.has(articleId)) {
        next.delete(articleId);
      } else {
        next.add(articleId);
      }
      return next;
    });

    const targetArticle = data?.news?.find((a) => a.id === articleId);
    if (isNowHandled) {
      if (targetArticle) {
        const tier = getDirectiveTier(targetArticle);
        const importance = tier === 'C4' ? 'URGENT' : tier === 'C3' ? 'IMPORTANT' : 'MONITORING';
        const payload = {
          id: targetArticle.id,
          articleId: targetArticle.id,
          title: targetArticle.title,
          url: targetArticle.url || (targetArticle as any).link,
          source: targetArticle.source,
          summary: targetArticle.summary,
          publishedAt: targetArticle.publishedAt,
          handledAt: new Date().toISOString(),
          tier,
          importance,
          directiveLabel: tier === 'C4' ? 'Đã ban hành chỉ đạo khẩn' : tier === 'C3' ? 'Đã giao đơn vị xử lý' : 'Đã đưa vào giám sát phòng ngừa',
          handlingStatus: 'DONE',
          handledBy: 'Lãnh đạo Bộ / Ban Chỉ đạo',
          solutionSummary: (targetArticle as any).interventionBrief?.suggestedAction || 'Đã đọc và xử lý hoàn tất trong phiên chỉ đạo',
          sector: targetArticle.sector
        };
        try {
          await fetch('/api/processed-actions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (_) {}
      }
      saveSopTrackingRecordToCloud(articleId, 'DONE', 'Đã xử lý hoàn tất');
    } else {
      try {
        await fetch(`/api/processed-actions/${articleId}`, { method: 'DELETE' });
      } catch (_) {}
      saveSopTrackingRecordToCloud(articleId, 'IN_PROGRESS', 'Chờ xử lý');
    }
  };

  const [isKpiDetailModalOpen, setIsKpiDetailModalOpen] = useState<boolean>(false);
  const [kpiModalMode, setKpiModalMode] = useState<ExecutiveKpiModalMode>('URGENT_CRISIS');

  const handleOpenCrisisModal = () => {
    setKpiModalMode('URGENT_CRISIS');
    setIsKpiDetailModalOpen(true);
  };

  const handleOpenPositiveModal = () => {
    setKpiModalMode('POSITIVE_BRIGHT');
    setIsKpiDetailModalOpen(true);
  };

  // Lấy danh sách ID bài viết thuộc Cảnh báo chủ động (Active Alerts / Cảnh báo 4)
  const activeAlertArticleIds = useMemo(() => {
    const alerts = data?.urgentAlerts || [];
    return new Set(alerts.map((a: any) => a.id).filter(Boolean));
  }, [data?.urgentAlerts]);

  // 1. Các sự kiện vi phạm SOP Cấp 4 Khẩn cấp (Active Alerts / Cảnh báo 4)
  const sopEmergencyArticles = useMemo(() => {
    const news = data?.news || [];
    return news.filter((item) => isSopLevel4Article(item, activeAlertArticleIds));
  }, [data?.news, activeAlertArticleIds]);

  const sopEmergencyCount = sopEmergencyArticles.length;

  // 2. Mục INTERVENTION NEEDED: Đồng bộ chuẩn hóa toàn bộ các cấp độ cảnh báo (Cấp 4, 3, 2, 1, Nghị định 376 & Khoảng trống)
  const interventionArticles = useMemo(() => {
    const news = data?.news || [];
    return news.filter((item) => {
      if (
        item.isMarketDigest ||
        item.informationVacuum?.gapLevel === 'MONITORING_NO_ALERT' ||
        item.warningPipeline?.level3Action?.alertLevel === 'MARKET_DIGEST'
      ) {
        return false;
      }

      // 1. Phân loại chuẩn hóa theo Nghị định 376: Triệt tiêu 100% tin tức giám sát thường quy / loại trừ
      const d376 = Decree376ClassificationEngine.classify(item);
      if (d376.isExcluded || d376.tier === 0) {
        return false;
      }

      const breakdown = extractQuantitativeBreakdown(item);

      // Triệt tiêu 100% tin tức giám sát thường quy (< 20 điểm) bám sát Cẩm nang 100 tình huống
      if (breakdown.level === 'STANDARD' || breakdown.riskScore < 20) {
        return false;
      }

      const isLevel4 = breakdown.level === 'EMERGENCY' || isSopLevel4Article(item);
      const isLevel3 = breakdown.level === 'RAPID';
      const isLevel2 = breakdown.level === 'EARLY' || isEarlyWarningArticle(item);
      const isLevel1 = breakdown.level === 'DISTANT' || isDistantWarningArticle(item);

      const hasInformationGap = Boolean(
        item.informationVacuum?.isAlertWarranted &&
        item.informationVacuum?.gapLevel !== 'NO_GAP' &&
        item.informationVacuum?.gapLevel !== 'MARKET_DIGEST'
      );

      return Boolean(isLevel4 || isLevel3 || isLevel2 || isLevel1 || hasInformationGap);
    });
  }, [data?.news]);

  // 3. HỢP NHẤT TẤT CẢ BÀI VIẾT THUỘC URGENT CRISIS VÀ INTERVENTION NEEDED - LOẠI BỎ TRÙNG LẶP
  const mergedActionArticles = useMemo(() => {
    const map = new Map<string, ScrapedNewsItem>();
    
    // Đưa danh sách sự việc khẩn cấp (SOP 4) vào trước để ưu tiên
    sopEmergencyArticles.forEach((item) => {
      if (item && item.id) {
        map.set(item.id, item);
      }
    });

    // Hợp nhất các bài cần can thiệp (không bị trùng ID)
    interventionArticles.forEach((item) => {
      if (item && item.id && !map.has(item.id)) {
        map.set(item.id, item);
      }
    });

    return Array.from(map.values());
  }, [sopEmergencyArticles, interventionArticles]);

  // Danh sách các tin hợp nhất chưa tích "Đã xử lý" trong phiên
  const activeMergedArticles = useMemo(() => {
    return mergedActionArticles.filter((item) => !sessionHandledArticleIds.has(item.id));
  }, [mergedActionArticles, sessionHandledArticleIds]);

  const mergedActionCount = activeMergedArticles.length;

  // Thống kê phân rã chuẩn hóa đồng bộ 4 Cấp độ hành động:
  // C4: Khẩn cấp | C3: Trọng yếu | C1, C2: Theo dõi & Phòng ngừa
  const activeActionLevelCounts = useMemo(() => {
    let c4 = 0, c3 = 0, c2 = 0, c1 = 0, gap = 0;
    activeMergedArticles.forEach((item) => {
      const tier = getDirectiveTier(item);
      if (tier === 'C4') {
        c4++;
      } else if (tier === 'C3') {
        c3++;
      } else if (tier === 'C2') {
        c2++;
      } else {
        c1++;
      }
      if (item.informationVacuum?.isAlertWarranted) {
        gap++;
      }
    });
    return { c4, c3, c2, c1, gap };
  }, [activeMergedArticles]);

  // Overall mood status text & monochrome badges
  const moodStatus = useMemo(() => {
    if (crisisCount > 3 || highConfidenceCrisisCount > 0 || moodScore < -15) {
      return {
        badge: 'CẢNH BÁO RỦI RO',
        badgeClass: 'bg-slate-900 text-white font-black border border-slate-900',
        dotClass: 'bg-slate-900',
        sub: 'Dư luận có phản ánh nhạy cảm cần rà soát & định hướng',
      };
    }
    if (moodScore > 10) {
      return {
        badge: 'TÍCH CỰC & ĐỒNG THUẬN',
        badgeClass: 'bg-slate-200 text-slate-900 font-extrabold border border-slate-300',
        dotClass: 'bg-slate-600',
        sub: 'Thị trường đồng thuận, dòng chảy thông tin tài khóa lành mạnh',
      };
    }
    return {
      badge: 'CÂN BẰNG & ỔN ĐỊNH',
      badgeClass: 'bg-slate-100 text-slate-800 border border-slate-300',
      dotClass: 'bg-slate-500',
      sub: 'Dư luận giữ nhịp ổn định, không có biến động tiêu cực bất thường',
    };
  }, [crisisCount, highConfidenceCrisisCount, moodScore]);

  return (
    <div className="space-y-5 max-w-[1720px] mx-auto animate-fadeIn text-slate-900">
      {/* COMMAND CENTER HEADER BAR */}
      <div className="px-5 py-3.5 rounded-2xl border border-slate-300 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">
              High-Impact Command Center
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-mono text-slate-600 font-bold">
            {scannedWindow}
          </span>
          <span className="text-slate-300">|</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${moodStatus.badgeClass}`}>
            {moodStatus.badge}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-black transition cursor-pointer flex items-center gap-1.5"
            title="Quét mới toàn bộ 30 nguồn báo chí"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Đang quét...' : 'Cập nhật'}</span>
          </button>

          <button
            onClick={() => onNavigateTab('table')}
            className="px-3.5 py-2 rounded-xl text-xs font-black bg-slate-900 text-white hover:bg-black transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-white" />
            <span>Bảng tin CMS ({totalArticles})</span>
          </button>
        </div>
      </div>

      {/* 3 OVERSIZED KPI CARDS (RESPONSIVE EXECUTIVE GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5">
        {/* KPI 1: VẤN ĐỀ CẦN CHỈ ĐẠO & XỬ LÝ KHẨN (Hợp nhất Khẩn cấp & Cần can thiệp) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setIsChiDaoSectionOpen((prev) => {
              const next = !prev;
              if (next) {
                setTimeout(() => {
                  const el = document.getElementById('section-chi-dao-xu-ly-khan');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    el.classList.add('ring-4', 'ring-amber-400');
                    setTimeout(() => {
                      el.classList.remove('ring-4', 'ring-amber-400');
                    }, 2000);
                  }
                }, 100);
              }
              return next;
            });
          }}
          title={isChiDaoSectionOpen ? "Nhấp để thu gọn / ẩn phần Chỉ Đạo & Xử Lý Khẩn" : "Nhấp để mở phần Chỉ Đạo & Xử Lý Khẩn bên dưới"}
          className={`md:col-span-12 lg:col-span-4 xl:col-span-4 p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md cursor-pointer group active:scale-[0.99] select-none ${
            isChiDaoSectionOpen ? 'ring-2 ring-amber-400 shadow-xl' : ''
          } ${
            sopEmergencyCount > 0
              ? 'bg-slate-950 text-white border-slate-950 ring-2 ring-rose-600/50 shadow-lg'
              : mergedActionCount > 0
              ? 'bg-slate-900 text-white border-slate-900 hover:border-amber-400 shadow-md'
              : 'bg-white border-slate-300 text-slate-900 hover:border-slate-400'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className={`text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 ${
                sopEmergencyCount > 0 || mergedActionCount > 0 ? 'text-slate-100' : 'text-slate-900'
              }`}>
                <AlertOctagon className={`w-4 h-4 ${sopEmergencyCount > 0 ? 'text-rose-400 animate-bounce' : mergedActionCount > 0 ? 'text-amber-400' : 'text-slate-900'}`} />
                <span>Vấn đề cần chỉ đạo & xử lý khẩn</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-black border transition-transform group-hover:scale-105 ${
                sopEmergencyCount > 0
                  ? 'bg-rose-600 text-white border-rose-500'
                  : mergedActionCount > 0
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-slate-100 text-slate-900 border-slate-300'
              }`}>
                {sopEmergencyCount > 0 ? 'BÁO ĐỘNG ĐỎ' : mergedActionCount > 0 ? 'CẦN XỬ LÝ' : 'AN TOÀN / ĐÃ ĐỊNH HƯỚNG'}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className={`text-5xl sm:text-6xl font-black tracking-tight font-mono ${
                sopEmergencyCount > 0 || mergedActionCount > 0 ? 'text-white' : 'text-slate-950'
              }`}>
                {mergedActionCount}
              </span>
              <span className={`text-sm sm:text-base font-bold ${
                sopEmergencyCount > 0 || mergedActionCount > 0 ? 'text-slate-300' : 'text-slate-700'
              }`}>
                vấn đề chờ xử lý
              </span>
            </div>
          </div>

          {/* 3 Mức độ quan trọng tinh gọn: C4 Khẩn cấp, C3 Trọng yếu, C1-C2 Theo dõi & Phòng ngừa */}
          <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-xs font-mono font-bold">
            <span
              className="px-2.5 py-0.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1 shadow-xs"
              title="Cấp 4: Khẩn cấp (SLA 2-4h)"
            >
              <span>🚨 C4 Khẩn cấp:</span> <strong>{activeActionLevelCounts.c4}</strong>
            </span>
            <span
              className="px-2.5 py-0.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 shadow-xs"
              title="Cấp 3: Trọng yếu (SLA 12h, xét trong 3 ngày qua)"
            >
              <span>⚡ C3 Trọng yếu:</span> <strong>{activeActionLevelCounts.c3}</strong>
            </span>
            <span
              className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1 shadow-xs"
              title="Cấp 1 - Cấp 2: Chỉ để ở mức Theo dõi & Phòng ngừa"
            >
              <span>📌 C1-C2 Theo dõi:</span> <strong>{activeActionLevelCounts.c2 + activeActionLevelCounts.c1}</strong>
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-xs font-bold flex items-center justify-between text-amber-400">
            <span className="flex items-center gap-1.5 font-bold">
              {isChiDaoSectionOpen ? (
                <>
                  <ChevronUp className="w-4 h-4 text-amber-400" />
                  <span>▲ Đang mở Chỉ Đạo (Bấm để ẩn)</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span>↓ Bấm mở phần Chỉ Đạo bên dưới</span>
                </>
              )}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsInterventionModalOpen(true);
              }}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-white border border-slate-600 transition"
              title="Mở bảng điều hành toàn màn hình"
            >
              Toàn màn hình
            </button>
          </div>
        </div>

        {/* KPI 2: TIN KHỞI SẮC & THÀNH TỰU */}
        <div
          onClick={handleOpenPositiveModal}
          title="Nhấp để xem chi tiết các tin tức tích cực khởi sắc và tạo tin lan tỏa"
          className="md:col-span-6 lg:col-span-4 xl:col-span-4 p-6 rounded-2xl border border-slate-300 hover:border-slate-400 bg-white text-slate-900 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md cursor-pointer group hover:ring-2 hover:ring-emerald-500/40"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-slate-900" />
                <span>Tin khởi sắc & thành tựu</span>
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-black bg-slate-100 text-slate-950 border border-slate-300 transition-transform group-hover:scale-105">
                {sopSentimentShift.positivePercentage}% TÍCH CỰC
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-slate-950 font-mono">
                {sopSentimentShift.positiveCount}
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-700">
                tin khởi sắc
              </span>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-200 text-xs sm:text-sm text-slate-900 font-bold flex items-center justify-between gap-2">
            <span className="truncate">Thu NSNN, nâng hạng TTCK, giải ngân</span>
            <span className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline shrink-0 transition-colors">
              Xem tin →
            </span>
          </div>
        </div>

        {/* KPI 3: CHỈ SỐ SẮC THÁI DƯ LUẬN */}
        <div className="md:col-span-6 lg:col-span-4 xl:col-span-4 p-6 rounded-2xl border border-slate-300 bg-white text-slate-900 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-slate-900" />
                <span>Chỉ số sắc thái dư luận</span>
              </span>
              {(() => {
                const sla = getSentimentSlaInfo(moodScore);
                return (
                  <span className={`px-2.5 py-0.5 rounded text-xs font-black border shadow-2xs ${sla.badgeClass}`}>
                    {sla.badgeText}
                  </span>
                );
              })()}
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl sm:text-6xl font-black tracking-tight text-slate-950 font-mono">
                  {moodScore}
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-700">/ 100 điểm</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-black text-rose-700 block">
                  -{sopSentimentShift.totalDeduction}đ SOP
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {sopSentimentShift.deductedArticles.length} tin bị trừ
                </span>
              </div>
            </div>

            <div className="mt-1 text-[11px] font-bold text-slate-600">
              {getSentimentSlaInfo(moodScore).description}
            </div>

            {/* 3-Color Ratio Bar */}
            <div className="mt-3.5 space-y-2">
              <div className="h-2.5 w-full bg-slate-100 rounded-full flex overflow-hidden p-0.5 border border-slate-200">
                {sopSentimentShift.positivePercentage > 0 && (
                  <div
                    style={{ width: `${sopSentimentShift.positivePercentage}%` }}
                    className="h-full bg-emerald-600 rounded-l-full transition-all duration-300"
                    title={`Tích cực: ${sopSentimentShift.positivePercentage}% (${sopSentimentShift.positiveCount} tin)`}
                  />
                )}
                {sopSentimentShift.neutralPercentage > 0 && (
                  <div
                    style={{ width: `${sopSentimentShift.neutralPercentage}%` }}
                    className="h-full bg-slate-300 transition-all duration-300"
                    title={`Trung tính: ${sopSentimentShift.neutralPercentage}% (${sopSentimentShift.neutralCount} tin)`}
                  />
                )}
                {sopSentimentShift.negativePercentage > 0 && (
                  <div
                    style={{ width: `${sopSentimentShift.negativePercentage}%` }}
                    className="h-full bg-rose-600 rounded-r-full transition-all duration-300"
                    title={`Tiêu cực (Khấu trừ SOP): ${sopSentimentShift.negativePercentage}% (${sopSentimentShift.negativeCount} tin)`}
                  />
                )}
              </div>

              {/* 3 Percentages Breakdown */}
              <div className="grid grid-cols-3 gap-1 pt-0.5 text-[11px] font-mono">
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                    Tích cực
                  </span>
                  <span className="font-black text-slate-900 text-xs mt-0.5">
                    {sopSentimentShift.positivePercentage}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    Trung tính
                  </span>
                  <span className="font-black text-slate-900 text-xs mt-0.5">
                    {sopSentimentShift.neutralPercentage}%
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-rose-700 font-bold flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                    Tiêu cực
                  </span>
                  <span className="font-black text-rose-700 text-xs mt-0.5" title="Gồm các tin tức bị khấu trừ điểm SOP">
                    {sopSentimentShift.negativePercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-200 text-xs flex items-center justify-between text-slate-900 font-mono">
            <span className="text-slate-800 font-bold">
              Trừ {sopSentimentShift.totalDeduction}đ vào điểm cơ sở 100
            </span>
            <span className="text-slate-500 text-[11px]">
              {sopSentimentShift.deductedArticles.length > 0 ? `${sopSentimentShift.deductedArticles.length} tin SOP` : '0 vi phạm'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION CHỈ ĐẠO & XỬ LÝ KHẨN (CHỈ HIỂN THỊ KHI BẤM VÀO VẤN ĐỀ CẦN CHỈ ĐẠO & XỬ LÝ KHẨN) */}
      {isChiDaoSectionOpen && (
        <div id="section-chi-dao-xu-ly-khan" className="scroll-mt-6 transition-all duration-300 animate-fadeIn">
          <div className="flex items-center justify-between p-3 mb-3 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-400">
                Chỉ Đạo & Xử Lý Khẩn (Điều hành trực tiếp cho Lãnh đạo)
              </span>
            </div>
            <button
              onClick={() => setIsChiDaoSectionOpen(false)}
              className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-black text-slate-200 border border-slate-600 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Ẩn phần Chỉ Đạo & Xử Lý Khẩn"
            >
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Thu gọn / Ẩn phần này</span>
            </button>
          </div>

          <SopLifecycleStagePipeline
            articles={data?.news || []}
            selectedLevel={currentSopLevel}
            onSelectLevel={handleSelectSopLevel}
            onSelectArticle={onSelectArticle}
            onOpenWarningPipeline={onOpenWarningPipeline}
            onDraftStatement={onDraftStatement}
            onOpenGmailAlertModal={onOpenGmailAlertModal}
            onOpenAlertTriggerModal={onOpenAlertTriggerModal}
            onOpenBatchAlertDrawer={onOpenBatchAlertDrawer}
            activeTriggersCount={activeTriggersCount}
            activeAlertsCount={activeAlertsCount}
            isDark={false}
          />
        </div>
      )}



      {/* PRIORITY PULSE (PANEL CHỈ ĐẠO VÀ CẢNH BÁO ƯU TIÊN) */}
      <PriorityPulse
        articles={data?.news || []}
        onSelectArticle={onSelectArticle}
        onDraftStatement={onDraftStatement}
        onOpenGmailAlertModal={onOpenGmailAlertModal}
        isDark={false}
      />

      {/* INTERVENTION MANAGEMENT MODAL (Xử lý các vấn đề chỉ đạo & xử lý khẩn hợp nhất) */}
      <InterventionManagementModal
        isOpen={isInterventionModalOpen}
        onClose={() => setIsInterventionModalOpen(false)}
        articles={mergedActionArticles}
        handledArticleIds={sessionHandledArticleIds}
        onToggleHandled={handleToggleHandledArticle}
        onSelectArticle={onSelectArticle}
        onDraftStatement={onDraftStatement}
        onOpenGmailAlertModal={onOpenGmailAlertModal}
        onOpenWarningPipeline={onOpenWarningPipeline}
        isDark={false}
      />

      {/* EXECUTIVE KPI DETAIL MODAL (Xem chi tiết & Xử lý tin khẩn SOP Cấp 4 / Tin tích cực) */}
      <ExecutiveKpiDetailModal
        isOpen={isKpiDetailModalOpen}
        onClose={() => setIsKpiDetailModalOpen(false)}
        mode={kpiModalMode}
        articles={data?.news || []}
        sessionHandledArticleIds={sessionHandledArticleIds}
        onToggleHandledArticle={handleToggleHandledArticle}
        onDraftStatement={onDraftStatement}
        onOpenGmailAlert={onOpenGmailAlertModal}
        onOpenDeepDive={onSelectArticle}
        isDark={false}
      />
    </div>
  );
};
