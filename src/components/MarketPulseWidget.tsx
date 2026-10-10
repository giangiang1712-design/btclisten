import React, { useState, useMemo } from 'react';
import { SentimentOverview, UrgentAlert, NegativeNewsCluster, CommunicationGapItem, ScrapedNewsItem } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  Info,
  Flame,
  Radio,
  Sparkles,
  HelpCircle,
  X,
  Compass,
  FileText,
  Layers,
  Minus
} from 'lucide-react';
import { useTheme } from '../lib/theme';
import { clusterNegativeAndAtRiskNews } from '../lib/negativeNewsClusterEngine';
import { detectCommunicationGaps } from '../lib/communicationGapEngine';
import { getTopNotableArticles, NotableArticleItem } from '../lib/newsClassification';
import { RiskWarningClustersModal } from './RiskWarningClustersModal';

interface MarketPulseWidgetProps {
  sentiment: SentimentOverview;
  urgentAlerts: UrgentAlert[];
  onSelectAlert?: (alert: UrgentAlert) => void;
  timeRange?: string;
  onOpenAdvisor?: () => void;
  onOpenDraftCrisis?: () => void;
  negativeClusters?: NegativeNewsCluster[];
  communicationGaps?: CommunicationGapItem[];
  articles?: ScrapedNewsItem[];
  onSelectArticle?: (article: ScrapedNewsItem) => void;
  onDraftStatementForCluster?: (cluster: NegativeNewsCluster) => void;
  onDraftCampaignForGap?: (gap: CommunicationGapItem) => void;
}

export const MarketPulseWidget: React.FC<MarketPulseWidgetProps> = ({
  sentiment,
  urgentAlerts,
  onSelectAlert,
  timeRange = '24h',
  onOpenAdvisor,
  onOpenDraftCrisis,
  negativeClusters: propClusters,
  communicationGaps: propGaps,
  articles = [],
  onSelectArticle,
  onDraftStatementForCluster,
  onDraftCampaignForGap,
}) => {
  const { isDark } = useTheme();
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [showRiskClustersModal, setShowRiskClustersModal] = useState(false);
  const [activeAlertIdx, setActiveAlertIdx] = useState(0);
  const [activeNotableIdx, setActiveNotableIdx] = useState(0);

  // Tuyển chọn các tin đáng chú ý nhất chuẩn xác khi chưa có cảnh báo khẩn cấp
  const topNotableArticles = useMemo(() => {
    return getTopNotableArticles(articles, 4);
  }, [articles]);

  const currentNotable = topNotableArticles && topNotableArticles.length > 0
    ? topNotableArticles[Math.min(activeNotableIdx, topNotableArticles.length - 1)]
    : null;

  // Compute or resolve negative clusters & communication gaps
  const negativeClusters = useMemo(() => {
    if (propClusters && propClusters.length > 0) return propClusters;
    if (sentiment.negativeClusters && sentiment.negativeClusters.length > 0) return sentiment.negativeClusters;
    return clusterNegativeAndAtRiskNews(articles);
  }, [propClusters, sentiment.negativeClusters, articles]);

  const communicationGaps = useMemo(() => {
    if (propGaps && propGaps.length > 0) return propGaps;
    if (sentiment.communicationGaps && sentiment.communicationGaps.length > 0) return sentiment.communicationGaps;
    return detectCommunicationGaps(articles);
  }, [propGaps, sentiment.communicationGaps, articles]);

  // Keep activeAlertIdx in bounds when alerts change
  const currentAlert = urgentAlerts && urgentAlerts.length > 0
    ? urgentAlerts[Math.min(activeAlertIdx, urgentAlerts.length - 1)]
    : null;

  const formatTimeRangeVietnamese = (tr: string) => {
    switch (tr) {
      case '1h': return '1 giờ';
      case '2h': return '2 giờ';
      case '4h': return '4 giờ';
      case '8h': return '8 giờ';
      case '24h': return '24 giờ';
      default: return '1 giờ';
    }
  };

  const score = sentiment.moodScore ?? 85;

  const totalCount = sentiment.totalArticles ?? articles?.length ?? 0;

  // =========================================================================
  // CÔNG THỨC TỔNG QUÁT TÂM LÝ THỊ TRƯỜNG & SẮC THÁI TIN TỨC:
  // M = X + Y * A - Z * B
  // Trong đó:
  // - X: Tỷ lệ % tin trung tính (Neutral %)
  // - Y: Tỷ lệ % tin tích cực (Bullish %)
  // - Z: Tỷ lệ % tin tiêu cực (Bearish %)
  // - A: Hệ số củng cố của luồng tin tích cực (chuẩn 1.05)
  // - B: Hệ số phạt / rủi ro của luồng tin tiêu cực (chuẩn 1.65)
  //
  // 6 Mốc phân loại cảnh báo:
  // - M >= 85: Tốt
  // - 79 <= M < 85: Cảnh báo Mức 1 (Lưu ý theo dõi)
  // - 75 <= M < 79: Cảnh báo Mức 2 (Thận trọng)
  // - 70 <= M < 75: Cảnh báo Mức 3 (Áp lực cao)
  // - 60 <= M < 70: Cảnh báo Mức 4 (Nguy cơ cao)
  // - M < 60: Cảnh báo Mức Khẩn Cấp (Báo động đỏ)
  // =========================================================================
  const getAlertDetails = (scoreValue: number) => {
    if (totalCount === 0) {
      return {
        level: 0,
        badgeLabel: 'Chờ dữ liệu phiên',
        badgeClass: isDark
          ? 'text-slate-300 bg-slate-800 border-slate-700'
          : 'text-slate-700 bg-slate-100 border-slate-300 font-bold',
        title: 'Trạng thái Sắc thái: Chờ Dữ Liệu',
        description: 'Chưa có tin bài trong khung giờ đã chọn. Bấm "Quét Tin" để cập nhật dữ liệu báo chí mới nhất từ 30 đầu báo.',
        icon: Info,
        barColor: 'from-slate-400 to-slate-500',
        alertBoxClass: isDark
          ? 'bg-slate-900/60 border-slate-800 text-slate-300'
          : 'bg-slate-50 border-slate-200 text-slate-700',
      };
    }
    if (scoreValue >= 85) {
      return {
        level: 0,
        badgeLabel: 'Tốt (M ≥ 85)',
        badgeClass: isDark
          ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40'
          : 'text-emerald-900 bg-emerald-100 border-emerald-300 font-extrabold',
        title: 'Tâm lý Thị trường: Tốt / Ổn định',
        description: 'Chỉ số tâm lý thị trường đạt mức Tốt (≥ 85đ). Luồng thông tin tích cực và trung tính chiếm ưu thế tuyệt đối, thị trường tài chính bình ổn, niềm tin nhà đầu tư vững vàng.',
        icon: ShieldCheck,
        barColor: 'from-emerald-500 to-teal-500',
        alertBoxClass: isDark
          ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
          : 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
      };
    }
    if (scoreValue >= 79) {
      return {
        level: 1,
        badgeLabel: 'Theo dõi (79 ≤ M < 85)',
        badgeClass: isDark
          ? 'text-blue-300 bg-blue-500/20 border-blue-500/40'
          : 'text-blue-900 bg-blue-100 border-blue-300 font-extrabold',
        title: 'Tâm lý Thị trường: Cân bằng / Theo dõi',
        description: 'Chỉ số tâm lý thị trường ở mức 79 - 84. Xuất hiện một số phản ánh trái chiều, hệ thống duy trì giám sát thường quy.',
        icon: Info,
        barColor: 'from-blue-500 to-cyan-500',
        alertBoxClass: isDark
          ? 'bg-blue-950/30 border-blue-800/40 text-blue-300'
          : 'bg-blue-50/80 border-blue-200 text-blue-900',
      };
    }
    if (scoreValue >= 75) {
      return {
        level: 2,
        badgeLabel: 'Thận trọng (75 ≤ M < 79)',
        badgeClass: isDark
          ? 'text-amber-300 bg-amber-500/20 border-amber-500/40'
          : 'text-amber-900 bg-amber-100 border-amber-300 font-extrabold',
        title: 'Tâm lý Thị trường: Thận trọng',
        description: 'Chỉ số tâm lý thị trường ở mức 75 - 78. Gia tăng thông tin thận trọng hoặc rung lắc cung cầu, cần theo dõi sát diễn biến.',
        icon: AlertTriangle,
        barColor: 'from-amber-500 to-yellow-500',
        alertBoxClass: isDark
          ? 'bg-amber-950/30 border-amber-800/40 text-amber-300'
          : 'bg-amber-50/80 border-amber-200 text-amber-900',
      };
    }
    if (scoreValue >= 70) {
      return {
        level: 3,
        badgeLabel: 'Áp lực cao (70 ≤ M < 75)',
        badgeClass: isDark
          ? 'text-orange-300 bg-orange-500/20 border-orange-500/40'
          : 'text-orange-900 bg-orange-100 border-orange-300 font-extrabold',
        title: 'Áp lực Thông tin: Gia tăng',
        description: 'Chỉ số tâm lý thị trường ở mức 70 - 74. Tỷ lệ tin tức tiêu cực gia tăng, cần chú ý theo dõi phản ứng của nhà đầu tư.',
        icon: AlertTriangle,
        barColor: 'from-orange-500 to-amber-600',
        alertBoxClass: isDark
          ? 'bg-orange-950/40 border-orange-800/50 text-orange-200'
          : 'bg-orange-50 border-orange-300 text-orange-950',
      };
    }
    if (scoreValue >= 60) {
      return {
        level: 4,
        badgeLabel: 'Nguy cơ cao (60 ≤ M < 70)',
        badgeClass: isDark
          ? 'text-rose-300 bg-rose-500/20 border-rose-500/40'
          : 'text-rose-900 bg-rose-100 border-rose-300 font-extrabold',
        title: 'Áp lực Dư luận: Đáng chú ý',
        description: 'Chỉ số tâm lý thị trường ở mức 60 - 69. Tần suất tin phản ánh tiêu cực dày đặc, các đơn vị chuyên môn cần chủ động thông tin định hướng.',
        icon: AlertOctagon,
        barColor: 'from-rose-500 to-red-600',
        alertBoxClass: isDark
          ? 'bg-rose-950/40 border-rose-800/50 text-rose-200'
          : 'bg-rose-50 border-rose-300 text-rose-950',
      };
    }
    return {
      level: 5,
      badgeLabel: 'Báo động đỏ (M < 60)',
      badgeClass: isDark
        ? 'text-rose-200 bg-rose-500/30 border-rose-500/60 animate-pulse font-black'
        : 'text-rose-950 bg-rose-100 border-rose-400 animate-pulse font-black',
      title: 'Báo động Sắc thái Cấp bách',
      description: 'Chỉ số tâm lý thị trường dưới 60 điểm. Báo động đỏ — Kích hoạt ngay phương án xử lý khủng hoảng truyền thông cấp Bộ!',
      icon: AlertOctagon,
      barColor: 'from-rose-600 to-red-700',
      alertBoxClass: isDark
        ? 'bg-rose-950/60 border-rose-500/70 text-rose-100'
        : 'bg-rose-100 border-rose-400 text-rose-950',
    };
  };

  const alertInfo = getAlertDetails(score);
  const AlertIcon = alertInfo.icon;

  return (
    <div className="space-y-2.5">
      {/* Khối Đo Lường Sắc Thái Toàn Phiên (Nổi bật & Đứng đầu CMS Overview) */}
      <div
        className={`rounded-2xl border-2 p-3.5 sm:p-4 shadow-lg transition-all ${
          isDark
            ? 'bg-slate-900/95 border-indigo-500/30 shadow-indigo-950/20 ring-1 ring-indigo-500/20'
            : 'bg-white border-slate-300/90 shadow-slate-200/90 ring-1 ring-slate-200/80'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Cột 1: Chỉ số sắc thái tin tức & Điểm số tổng thể (5 cols) */}
          <div className="lg:col-span-5 flex items-center justify-between gap-3 pr-0 lg:pr-4 lg:border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Chỉ số sắc thái tin tức
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMatrixModal(true)}
                    className="text-slate-400 hover:text-indigo-500 transition-colors p-0.5 rounded"
                    title="Xem thang điểm & các mức cảnh báo"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2.5 mt-1">
                  <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {totalCount === 0 ? '--' : score}
                    <span className={`text-sm font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/100</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (negativeClusters.length > 0 || communicationGaps.length > 0) {
                        setShowRiskClustersModal(true);
                      } else {
                        setShowMatrixModal(true);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs font-black border shadow-xs flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 ${alertInfo.badgeClass}`}
                    title="Bấm để xem chi tiết trạng thái"
                  >
                    {alertInfo.badgeLabel}
                  </button>
                </div>
              </div>
            </div>

            {/* Thống kê tỷ lệ 3 màu: Tích cực / Trung tính / Tiêu cực */}
            <div className="flex flex-col gap-1 items-end shrink-0">
              <span className="flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/25 whitespace-nowrap">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{sentiment.bullishPercentage}% Tích cực</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/25 whitespace-nowrap">
                <Minus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{sentiment.neutralPercentage ?? Math.max(0, 100 - (sentiment.bullishPercentage || 0) - (sentiment.bearishPercentage || 0))}% Trung tính</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs font-black text-rose-700 dark:text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-lg border border-rose-500/25 whitespace-nowrap">
                <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{sentiment.bearishPercentage}% Tiêu cực</span>
              </span>
            </div>
          </div>

          {/* Cột 2: Thanh tiến trình 3 màu & Trọng tâm phiên (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-center space-y-2 px-0 lg:px-2">
            {/* Thanh tỷ lệ 3 màu */}
            <div className={`h-3 w-full rounded-full overflow-hidden flex p-0.5 gap-0.5 ${isDark ? 'bg-slate-950' : 'bg-slate-200 border border-slate-300'}`}>
              <div
                style={{ width: `${totalCount === 0 ? 33.3 : sentiment.bullishPercentage}%` }}
                className={`${totalCount === 0 ? 'bg-slate-400/40 dark:bg-slate-700' : 'bg-emerald-500'} rounded-l-full transition-all duration-500`}
                title={`Tích cực: ${sentiment.bullishPercentage}%`}
              />
              <div
                style={{ width: `${totalCount === 0 ? 33.3 : (sentiment.neutralPercentage ?? Math.max(0, 100 - (sentiment.bullishPercentage || 0) - (sentiment.bearishPercentage || 0)))}%` }}
                className={`${totalCount === 0 ? 'bg-slate-400/30 dark:bg-slate-800' : 'bg-amber-400'} transition-all duration-500`}
                title={`Trung tính: ${sentiment.neutralPercentage ?? Math.max(0, 100 - (sentiment.bullishPercentage || 0) - (sentiment.bearishPercentage || 0))}%`}
              />
              <div
                style={{ width: `${totalCount === 0 ? 33.4 : sentiment.bearishPercentage}%` }}
                className={`${totalCount === 0 ? 'bg-slate-400/20 dark:bg-slate-850' : 'bg-rose-500'} rounded-r-full transition-all duration-500`}
                title={`Tiêu cực: ${sentiment.bearishPercentage}%`}
              />
            </div>

            {/* Trọng tâm tin tức trong phiên */}
            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0" title={sentiment.keyDriver}>
              <span className={`text-xs font-black uppercase tracking-wider shrink-0 px-2 py-0.5 rounded flex items-center gap-1 ${isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-900 font-extrabold border border-amber-200'}`}>
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                Trọng tâm {formatTimeRangeVietnamese(timeRange)}:
              </span>
              <span className={`truncate font-bold text-xs sm:text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {totalCount === 0 ? 'Chưa ghi nhận sự kiện đột biến' : (sentiment.keyDriver || 'Thị trường tài chính bình ổn')}
              </span>
            </div>
          </div>

          {/* Cột 3: Trạng thái Cảnh báo phiên hoặc Tin Đáng Chú Ý Nhất (3 cols) */}
          <div className="lg:col-span-3 flex items-center justify-end">
            {totalCount === 0 ? (
              <div
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span>Sẵn sàng giám sát luồng tin</span>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Chờ quét tin
                </span>
              </div>
            ) : currentAlert ? (
              <div
                onClick={() => onSelectAlert && onSelectAlert(currentAlert)}
                className={`w-full p-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                  isDark
                    ? 'bg-rose-950/40 border-rose-500/50 hover:border-rose-400 text-rose-100 shadow-md'
                    : 'bg-rose-50 border-rose-300 hover:border-rose-400 text-rose-950 shadow-sm'
                }`}
                title="Cảnh báo khẩn cấp Bộ Tài chính - Bấm để xem chi tiết bài viết và phương án xử lý"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="flex h-2.5 w-2.5 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                  </span>
                  <div className="truncate flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          🚨 {currentAlert.categoryLabelVi || 'Cảnh báo khẩn Bộ Tài chính'}
                        </span>
                        {urgentAlerts.length > 1 && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-rose-500/20 text-rose-500 border border-rose-500/30">
                            {activeAlertIdx + 1}/{urgentAlerts.length}
                          </span>
                        )}
                      </div>
                      {currentAlert.timeAgo && (
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                          {currentAlert.timeAgo}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold truncate text-rose-950 dark:text-rose-100">
                      {currentAlert.title}
                    </p>
                    {currentAlert.urgencyReason && (
                      <p className="text-[11px] font-medium line-clamp-1 text-rose-800/80 dark:text-rose-200/80 mt-0.5">
                        {currentAlert.urgencyReason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {urgentAlerts.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveAlertIdx((prev) => (prev + 1) % urgentAlerts.length);
                      }}
                      className="p-1 rounded-md hover:bg-rose-500/20 text-rose-500 transition-colors text-[10px] font-bold"
                      title="Chuyển cảnh báo tiếp theo"
                    >
                      Tiếp
                    </button>
                  )}
                  <ArrowRight className="w-4 h-4 text-rose-500 shrink-0" />
                </div>
              </div>
            ) : currentNotable ? (
              /* THAY BẰNG TIN ĐÁNG CHÚ Ý NHẤT (CHUẨN XÁC) KHI CHƯA CÓ CẢNH BÁO KHẨN */
              <div
                onClick={() => onSelectArticle && onSelectArticle(currentNotable)}
                className={`w-full p-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                  isDark
                    ? 'bg-slate-900/90 border-indigo-500/40 hover:border-indigo-400 text-slate-100 shadow-sm'
                    : 'bg-indigo-50/70 border-indigo-200 hover:border-indigo-300 text-slate-900 shadow-xs'
                }`}
                title="Tin Đáng Chú Ý Nhất - Bấm để mở bài viết chi tiết"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="flex h-2.5 w-2.5 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600 dark:bg-indigo-400"></span>
                  </span>
                  <div className="truncate flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>Tin Đáng Chú Ý Nhất</span>
                        </span>
                        {topNotableArticles.length > 1 && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                            {activeNotableIdx + 1}/{topNotableArticles.length}
                          </span>
                        )}
                        {currentNotable.source && (
                          <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 truncate max-w-[120px]">
                            {currentNotable.source}
                          </span>
                        )}
                      </div>
                      {currentNotable.timeAgo && (
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                          {currentNotable.timeAgo}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold truncate text-slate-900 dark:text-slate-100">
                      {currentNotable.title}
                    </p>
                    <p className="text-[11px] font-medium line-clamp-1 text-slate-600 dark:text-slate-300 mt-0.5">
                      {currentNotable.notableReason || currentNotable.summary || 'Trọng tâm thông tin chỉ đạo điều hành'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {topNotableArticles.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveNotableIdx((prev) => (prev + 1) % topNotableArticles.length);
                      }}
                      className="px-1.5 py-1 rounded-md hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 transition-colors text-[10px] font-bold"
                      title="Chuyển tin đáng chú ý tiếp theo"
                    >
                      Tiếp
                    </button>
                  )}
                  <ArrowRight className="w-4 h-4 text-indigo-500 shrink-0" />
                </div>
              </div>
            ) : alertInfo.level >= 1 ? (
              <div
                className={`w-full p-2.5 rounded-xl border-2 flex items-center justify-between transition-all ${
                  alertInfo.level === 5
                    ? isDark ? 'bg-rose-950/70 border-rose-500 text-rose-100 ring-1 ring-rose-500/50 animate-pulse' : 'bg-rose-100 border-rose-500 text-rose-950 ring-1 ring-rose-400 animate-pulse'
                    : alertInfo.level === 4
                    ? isDark ? 'bg-rose-950/50 border-rose-500/60 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-950'
                    : alertInfo.level === 3
                    ? isDark ? 'bg-orange-950/40 border-orange-500 text-orange-200' : 'bg-orange-50 border-orange-300 text-orange-950'
                    : alertInfo.level === 2
                    ? isDark ? 'bg-amber-950/30 border-amber-500 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-950'
                    : isDark ? 'bg-blue-950/30 border-blue-500 text-blue-200' : 'bg-blue-50 border-blue-300 text-blue-950'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AlertIcon className="w-4 h-4 shrink-0" />
                  <div className="truncate">
                    <span className="text-[11px] font-black uppercase tracking-wider block">
                      {alertInfo.title}
                    </span>
                    <p className="text-xs font-semibold truncate">
                      Điểm M: {score}/100
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 uppercase shrink-0">
                  {score < 60 ? 'Báo động đỏ' : score < 75 ? 'Áp lực cao' : 'Theo dõi'}
                </span>
              </div>
            ) : (
              <div
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-950/80 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>Phiên {formatTimeRangeVietnamese(timeRange)} ổn định</span>
                </div>
                <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-black px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  Tốt (M ≥ 85)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dải Cảnh Báo Sắc Thái Toàn Phiên */}
        <div className={`mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl p-3 border-2 shadow-xs ${alertInfo.alertBoxClass}`}>
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-black/10 dark:bg-white/10 shrink-0 mt-0.5 sm:mt-0">
              <AlertIcon className={`w-5 h-5 shrink-0 ${alertInfo.level >= 4 && totalCount > 0 ? 'animate-bounce text-rose-500' : ''}`} />
            </div>
            <div className="text-xs sm:text-sm leading-snug min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-black uppercase tracking-wider text-xs px-2 py-0.5 rounded bg-black/10 dark:bg-white/15 whitespace-nowrap">
                  {alertInfo.level === 0 ? (totalCount === 0 ? 'Trạng thái phiên' : 'Sắc thái ổn định') : alertInfo.title}
                </span>
                {negativeClusters.length > 0 && (
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 whitespace-nowrap">
                    {negativeClusters.length} Cụm vấn đề tiêu cực
                  </span>
                )}
              </div>
              <p className="opacity-95 font-medium leading-relaxed">{alertInfo.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
            {negativeClusters.length > 0 && (
              <button
                type="button"
                onClick={() => setShowRiskClustersModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 whitespace-nowrap"
                title="Xem bóc tách cụm tin tiêu cực & đề xuất phương án xử lý"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Bóc tách {negativeClusters.length} cụm tiêu cực & Xử lý</span>
              </button>
            )}

            {communicationGaps.length > 0 && (
              <button
                type="button"
                onClick={() => setShowRiskClustersModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 border border-amber-500/40 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                title="Xem phát hiện khoảng trống truyền thông cần tăng cường tin bài"
              >
                <Compass className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{communicationGaps.length} Khoảng trống</span>
              </button>
            )}

            {alertInfo.level === 4 && totalCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (onOpenDraftCrisis) onOpenDraftCrisis();
                  else if (onOpenAdvisor) onOpenAdvisor();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-black bg-red-700 hover:bg-red-800 text-white shadow-sm flex items-center gap-1.5 transition-all whitespace-nowrap"
              >
                <Flame className="w-4 h-4 shrink-0" />
                <span>Khủng hoảng</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowMatrixModal(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 whitespace-nowrap"
              title="Xem ma trận phân loại sắc thái"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Thang điểm</span>
            </button>
          </div>
        </div>
      </div>

      {/* Risk Warning Clusters & Communication Gaps Modal */}
      {showRiskClustersModal && (
        <RiskWarningClustersModal
          sentiment={sentiment}
          clusters={negativeClusters}
          gaps={communicationGaps}
          onClose={() => setShowRiskClustersModal(false)}
          onSelectArticle={(art) => {
            setShowRiskClustersModal(false);
            if (onSelectArticle) onSelectArticle(art);
          }}
          onDraftStatementForCluster={onDraftStatementForCluster}
          onDraftCampaignForGap={onDraftCampaignForGap}
        />
      )}

      {/* Modal / Bảng Tra Cứu Thang Điểm Cảnh Báo Sắc Thái */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
                <h3 className="font-black text-sm sm:text-base">
                  Quy Chuẩn Thang Điểm Cảnh Báo Sắc Thái Tin Tức
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-3 text-xs sm:text-sm">
              {/* Thẻ công thức tổng quát */}
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-slate-950/80 border-slate-700/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Công thức tổng quát
                  </span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                    M = X + Y·A - Z·B
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Trong đó: <strong className="text-slate-700 dark:text-slate-200">X</strong> = % tin trung tính ({sentiment.neutralPercentage}%), <strong className="text-emerald-600 dark:text-emerald-400">Y</strong> = % tin tích cực ({sentiment.bullishPercentage}%), <strong className="text-rose-600 dark:text-rose-400">Z</strong> = % tin tiêu cực ({sentiment.bearishPercentage}%). Trọng số củng cố <strong className="text-indigo-400">A</strong> = {sentiment.formulaComponents?.A ?? 1.05}, Trọng số răn đe tổn thất <strong className="text-indigo-400">B</strong> = {sentiment.formulaComponents?.B ?? 1.65}.
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-mono text-xs">
                  <span className="text-slate-500">Tính toán thực tế:</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-300">
                    M = {sentiment.neutralPercentage} + ({sentiment.bullishPercentage} × {sentiment.formulaComponents?.A ?? 1.05}) - ({sentiment.bearishPercentage} × {sentiment.formulaComponents?.B ?? 1.65}) = <span className="underline font-extrabold">{score}</span>
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {/* 1. M >= 85: Tốt */}
                <div className={`p-2.5 rounded-xl border flex items-start gap-3 ${
                  score >= 85
                    ? isDark ? 'bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-500/50 text-emerald-200' : 'bg-emerald-100/90 border-emerald-400 ring-1 ring-emerald-400 text-emerald-950'
                    : isDark ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-emerald-500/20 shrink-0">
                    M ≥ 85
                  </span>
                  <div>
                    <strong className="block font-bold">Tốt (Bình ổn & Lan tỏa tích cực)</strong>
                    <span className="text-xs opacity-90">Sắc thái thị trường rất tích cực, niềm tin thị trường vững chắc, không phát sinh rủi ro truyền thông.</span>
                  </div>
                </div>

                {/* 2. 79 <= M < 85: Cảnh báo Mức 1 */}
                <div className={`p-2.5 rounded-xl border flex items-start gap-3 ${
                  score >= 79 && score < 85
                    ? isDark ? 'bg-blue-950/50 border-blue-500 ring-1 ring-blue-500/50 text-blue-200' : 'bg-blue-100/90 border-blue-400 ring-1 ring-blue-400 text-blue-950'
                    : isDark ? 'bg-blue-950/20 border-blue-800/40 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}>
                  <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-blue-500/20 shrink-0">
                    79 ≤ M &lt; 85
                  </span>
                  <div>
                    <strong className="block font-bold">Cảnh báo Mức 1 (Lưu ý theo dõi)</strong>
                    <span className="text-xs opacity-90">Xuất hiện một số phản ánh trái chiều nhỏ lẻ hoặc phản biện chính sách, cần lưu ý theo dõi luồng thông tin mới.</span>
                  </div>
                </div>

                {/* 3. 75 <= M < 79: Cảnh báo Mức 2 */}
                <div className={`p-2.5 rounded-xl border flex items-start gap-3 ${
                  score >= 75 && score < 79
                    ? isDark ? 'bg-amber-950/50 border-amber-500 ring-1 ring-amber-500/50 text-amber-200' : 'bg-amber-100/90 border-amber-400 ring-1 ring-amber-400 text-amber-950'
                    : isDark ? 'bg-amber-950/20 border-amber-800/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-amber-500/20 shrink-0">
                    75 ≤ M &lt; 79
                  </span>
                  <div>
                    <strong className="block font-bold">Cảnh báo Mức 2 (Thận trọng)</strong>
                    <span className="text-xs opacity-90">Gia tăng thông tin thận trọng hoặc áp lực trái chiều, các đơn vị cần theo dõi sát và chuẩn bị phương án tham mưu.</span>
                  </div>
                </div>

                {/* 4. 70 <= M < 75: Cảnh báo Mức 3 */}
                <div className={`p-2.5 rounded-xl border flex items-start gap-3 ${
                  score >= 70 && score < 75
                    ? isDark ? 'bg-orange-950/50 border-orange-500 ring-1 ring-orange-500/50 text-orange-200' : 'bg-orange-100/90 border-orange-400 ring-1 ring-orange-400 text-orange-950'
                    : isDark ? 'bg-orange-950/20 border-orange-800/40 text-orange-200' : 'bg-orange-50 border-orange-300 text-orange-950'
                }`}>
                  <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-orange-500/20 shrink-0">
                    70 ≤ M &lt; 75
                  </span>
                  <div>
                    <strong className="block font-bold">Cảnh báo Mức 3 (Áp lực cao)</strong>
                    <span className="text-xs opacity-90">Tỷ lệ tin tiêu cực gia tăng rõ rệt, áp lực dư luận lan rộng, cần chủ động chuẩn bị phương án thông tin chỉ đạo.</span>
                  </div>
                </div>

                {/* 5. 60 <= M < 70: Cảnh báo Mức 4 */}
                <div className={`p-2.5 rounded-xl border flex items-start gap-3 ${
                  score >= 60 && score < 70
                    ? isDark ? 'bg-rose-950/50 border-rose-500 ring-1 ring-rose-500/50 text-rose-200' : 'bg-rose-100/90 border-rose-400 ring-1 ring-rose-400 text-rose-950'
                    : isDark ? 'bg-rose-950/20 border-rose-800/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-rose-500/20 shrink-0">
                    60 ≤ M &lt; 70
                  </span>
                  <div>
                    <strong className="block font-bold">Cảnh báo Mức 4 (Nguy cơ cao)</strong>
                    <span className="text-xs opacity-90">Tần suất tin tiêu cực dày đặc, nguy cơ lan truyền tâm lý lo ngại trên diện rộng, các đơn vị cần chủ động phản hồi.</span>
                  </div>
                </div>

                {/* 6. M < 60: Cảnh báo Mức Khẩn Cấp */}
                <div className={`p-2.5 rounded-xl border-2 flex items-start gap-3 ${
                  score < 60
                    ? isDark ? 'bg-rose-950/70 border-rose-500 ring-2 ring-rose-500 text-rose-100 animate-pulse' : 'bg-rose-100 border-rose-500 ring-2 ring-rose-400 text-rose-950 animate-pulse'
                    : isDark ? 'bg-rose-950/30 border-rose-800/50 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-rose-500/30 text-rose-600 dark:text-rose-300 shrink-0">
                    M &lt; 60
                  </span>
                  <div>
                    <strong className="block font-bold">🚨 Cảnh báo Mức Khẩn Cấp (Báo động đỏ)</strong>
                    <span className="text-xs opacity-95">Sắc thái tiêu cực chiếm ưu thế áp đảo. Báo động đỏ — Kích hoạt ngay phương án xử lý khủng hoảng truyền thông khẩn cấp.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold transition-colors"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
