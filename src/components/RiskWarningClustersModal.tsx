import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Radio,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileEdit,
  Send,
  Layers,
  HelpCircle,
  TrendingDown,
  Info,
  CheckCircle2,
  Share2,
  BookOpen,
  Compass,
  FileText
} from 'lucide-react';
import { ScrapedNewsItem, SentimentOverview, NegativeNewsCluster, CommunicationGapItem, UrgentAlert } from '../types';
import { useTheme } from '../lib/theme';
import { SourceBrandBadge } from './SourceBrandBadge';

interface RiskWarningClustersModalProps {
  isOpen?: boolean;
  onClose: () => void;
  sentiment: SentimentOverview;
  negativeClusters?: NegativeNewsCluster[];
  clusters?: NegativeNewsCluster[];
  communicationGaps?: CommunicationGapItem[];
  gaps?: CommunicationGapItem[];
  urgentAlerts?: UrgentAlert[];
  onSelectArticle?: (article: ScrapedNewsItem) => void;
  onDraftStatementForCluster?: (cluster: NegativeNewsCluster) => void;
  onDraftCampaignForGap?: (gap: CommunicationGapItem) => void;
}

export const RiskWarningClustersModal: React.FC<RiskWarningClustersModalProps> = ({
  isOpen = true,
  onClose,
  sentiment,
  negativeClusters: propNegClusters,
  clusters: propClusters,
  communicationGaps: propCommGaps,
  gaps: propGaps,
  urgentAlerts,
  onSelectArticle,
  onDraftStatementForCluster,
  onDraftCampaignForGap,
}) => {
  const { isDark } = useTheme();
  const negativeClusters = propNegClusters || propClusters || sentiment.negativeClusters || [];
  const communicationGaps = propCommGaps || propGaps || sentiment.communicationGaps || [];

  const [activeTab, setActiveTab] = useState<'negative_clusters' | 'communication_gaps'>('negative_clusters');
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(
    negativeClusters.length > 0 ? negativeClusters[0].id : null
  );
  const [expandedGapId, setExpandedGapId] = useState<string | null>(
    communicationGaps.length > 0 ? communicationGaps[0].id : null
  );

  if (!isOpen) return null;

  const score = sentiment.moodScore ?? 85;

  // =========================================================================
  // CÔNG THỨC TỔNG QUÁT TÂM LÝ THỊ TRƯỜNG & SẮC THÁI TIN TỨC:
  // M = X + Y * A - Z * B
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
    if (scoreValue >= 85) {
      return {
        level: 0,
        badgeLabel: 'Tốt (M ≥ 85)',
        title: 'Trạng thái Tốt / Ổn định',
        description: 'Chỉ số tâm lý thị trường đạt mức Tốt (≥ 85đ). Luồng thông tin tích cực và trung tính chiếm ưu thế tuyệt đối, thị trường tài chính bình ổn, niềm tin nhà đầu tư vững vàng.',
        icon: ShieldCheck,
        badgeClass: isDark ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40' : 'text-emerald-900 bg-emerald-100 border-emerald-300 font-extrabold',
        boxClass: isDark ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-950',
      };
    }
    if (scoreValue >= 79) {
      return {
        level: 1,
        badgeLabel: 'Cảnh báo Mức 1 (79 ≤ M < 85)',
        title: 'Cảnh báo Mức 1: Cần Lưu Ý Theo Dõi',
        description: 'Chỉ số tâm lý thị trường ở mức 79 - 84. Xuất hiện một số phản ánh trái chiều, cần lưu ý theo dõi luồng thông tin mới.',
        icon: Info,
        badgeClass: isDark ? 'text-blue-300 bg-blue-500/20 border-blue-500/40' : 'text-blue-900 bg-blue-100 border-blue-300 font-extrabold',
        boxClass: isDark ? 'bg-blue-950/30 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-950',
      };
    }
    if (scoreValue >= 75) {
      return {
        level: 2,
        badgeLabel: 'Cảnh báo Mức 2 (75 ≤ M < 79)',
        title: 'Cảnh báo Mức 2: Gia Tăng Phản Ánh Trái Chiều',
        description: 'Chỉ số tâm lý thị trường ở mức 75 - 78. Gia tăng thông tin thận trọng hoặc áp lực trái chiều, các đơn vị cần theo dõi sát và chuẩn bị phương án tham mưu.',
        icon: AlertTriangle,
        badgeClass: isDark ? 'text-amber-300 bg-amber-500/20 border-amber-500/40' : 'text-amber-900 bg-amber-100 border-amber-300 font-extrabold',
        boxClass: isDark ? 'bg-amber-950/30 border-amber-800 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-950',
      };
    }
    if (scoreValue >= 70) {
      return {
        level: 3,
        badgeLabel: 'Cảnh báo Mức 3 (70 ≤ M < 75)',
        title: 'Cảnh báo Mức 3: Áp Lực Tiêu Cực Cao',
        description: 'Chỉ số tâm lý thị trường ở mức 70 - 74. Tỷ lệ tin tức tiêu cực gia tăng rõ rệt, áp lực dư luận lan rộng, cần chủ động phương án điều hành & truyền thông.',
        icon: AlertTriangle,
        badgeClass: isDark ? 'text-orange-300 bg-orange-500/20 border-orange-500/40' : 'text-orange-900 bg-orange-100 border-orange-300 font-extrabold',
        boxClass: isDark ? 'bg-orange-950/40 border-orange-800 text-orange-200' : 'bg-orange-50 border-orange-300 text-orange-950',
      };
    }
    if (scoreValue >= 60) {
      return {
        level: 4,
        badgeLabel: 'Cảnh báo Mức 4 (60 ≤ M < 70)',
        title: 'Cảnh báo Mức 4: Nguy Cơ Lan Rộng',
        description: 'Chỉ số tâm lý thị trường ở mức 60 - 69. Tần suất tin tiêu cực dày đặc, nguy cơ lan truyền tâm lý lo ngại trên diện rộng, các đơn vị cần chủ động phản hồi.',
        icon: AlertOctagon,
        badgeClass: isDark ? 'text-rose-300 bg-rose-500/20 border-rose-500/40' : 'text-rose-900 bg-rose-100 border-rose-300 font-extrabold',
        boxClass: isDark ? 'bg-rose-950/40 border-rose-800 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-950',
      };
    }
    return {
      level: 5,
      badgeLabel: '🚨 Cảnh báo Khẩn Cấp (M < 60)',
      title: 'Cảnh báo Khẩn Cấp: Báo Động Đỏ Khủng Hoảng',
      description: 'Chỉ số tâm lý thị trường dưới 60 điểm. Báo động đỏ — Kích hoạt ngay phương án xử lý khủng hoảng truyền thông khẩn cấp!',
      icon: AlertOctagon,
      badgeClass: isDark ? 'text-rose-200 bg-rose-500/30 border-rose-500/60 animate-pulse font-black' : 'text-rose-950 bg-rose-100 border-rose-400 animate-pulse font-black',
      boxClass: isDark ? 'bg-rose-950/60 border-rose-500 text-rose-100' : 'bg-rose-100 border-rose-400 text-rose-950',
    };
  };

  const alertInfo = getAlertDetails(score);
  const AlertIcon = alertInfo.icon;
  const totalNegativeArticles = negativeClusters.reduce((sum, c) => sum + c.articleCount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-5xl max-h-[92vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-700/80 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${alertInfo.badgeClass}`}>
              <AlertIcon className="w-6 h-6 shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Bóc Tách Tin Tiêu Cực, Cảnh Báo & Khoảng Trống Truyền Thông
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${alertInfo.badgeClass}`}>
                  {alertInfo.badgeLabel}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Chỉ số sắc thái: <strong className="text-slate-900 dark:text-white font-black">{score}/100</strong> • Phát hiện{' '}
                <strong className="text-rose-600 dark:text-rose-400 font-bold">{negativeClusters.length} cụm vấn đề tiêu cực ({totalNegativeArticles} bài)</strong> và{' '}
                <strong className="text-amber-600 dark:text-amber-400 font-bold">{communicationGaps.length} khoảng trống truyền thông</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-slate-100/60 dark:bg-slate-950/80 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('negative_clusters')}
            className={`py-3 px-3.5 sm:px-5 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'negative_clusters'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>1. Bóc Tách Tin Tiêu Cực & Đề Xuất Phương Án Xử Lý</span>
            <span className="px-2 py-0.2 rounded-full text-xs font-black bg-rose-500/20 text-rose-600 dark:text-rose-400">
              {negativeClusters.length} Cụm ({totalNegativeArticles} bài)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('communication_gaps')}
            className={`py-3 px-3.5 sm:px-5 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'communication_gaps'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>2. Phát Hiện Nguy Cơ & Khoảng Trống Truyền Thông</span>
            <span className="px-2 py-0.2 rounded-full text-xs font-black bg-amber-500/20 text-amber-600 dark:text-amber-400">
              {communicationGaps.length} Vấn Đề
            </span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: BÓC TÁCH TIN TIÊU CỰC THEO CỤM & PHƯƠNG ÁN XỬ LÝ */}
          {activeTab === 'negative_clusters' && (
            <div className="space-y-4">
              {/* Alert Status Banner */}
              <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${alertInfo.boxClass}`}>
                <div className="flex items-center gap-3">
                  <AlertIcon className="w-5 h-5 shrink-0" />
                  <div className="text-xs sm:text-sm">
                    <strong className="font-bold">{alertInfo.title}: </strong>
                    <span>{alertInfo.description}</span>
                  </div>
                </div>
                <div className="text-xs font-bold shrink-0 self-end sm:self-auto text-right">
                  <div>Tổng hợp: <span className="underline">{sentiment.bearishPercentage}% Tiêu cực</span> • {sentiment.neutralPercentage}% Trung tính • {sentiment.bullishPercentage}% Tích cực</div>
                  <div className="font-mono text-[11px] opacity-80 mt-0.5">
                    M = {sentiment.neutralPercentage} + ({sentiment.bullishPercentage} × {sentiment.formulaComponents?.A ?? 1.05}) - ({sentiment.bearishPercentage} × {sentiment.formulaComponents?.B ?? 1.65}) = <strong className="underline">{score}</strong>
                  </div>
                </div>
              </div>

              {negativeClusters.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
                  <p className="font-bold text-sm">Không phát hiện cụm tin tiêu cực đáng kể nào trong phiên quét hiện tại.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Danh sách các cụm tin tiêu cực phân loại theo nội dung & Phương án xử lý:
                    </span>
                    <span className="text-xs text-slate-400 italic">
                      Nhấp vào từng nhóm để xem chi tiết bài báo & phương án truyền thông
                    </span>
                  </div>

                  {negativeClusters.map((cluster, idx) => {
                    const isExpanded = expandedClusterId === cluster.id;
                    return (
                      <div
                        key={cluster.id}
                        className={`rounded-xl border transition-all overflow-hidden ${
                          isExpanded
                            ? isDark
                              ? 'bg-slate-900/90 border-rose-500/70 shadow-lg'
                              : 'bg-white border-rose-400 shadow-md ring-1 ring-rose-300'
                            : isDark
                            ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Cluster Header */}
                        <div
                          onClick={() => setExpandedClusterId(isExpanded ? null : cluster.id)}
                          className="p-3.5 sm:p-4 cursor-pointer flex items-center justify-between gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-rose-500/30">
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                                  Có {cluster.articleCount} bài về nội dung:
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                                  {cluster.sectorNameVi}
                                </span>
                                {cluster.urgencyLevel === 'high' && (
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                                    ƯU TIÊN XỬ LÝ
                                  </span>
                                )}
                              </div>
                              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mt-1 leading-snug">
                                {cluster.topicTitle}
                              </h3>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 hidden sm:inline">
                              {cluster.articleCount} bài báo
                            </span>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                          </div>
                        </div>

                        {/* Cluster Expanded Body */}
                        {isExpanded && (
                          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 space-y-4 bg-white/50 dark:bg-slate-900/50">
                            {/* Tóm tắt thực trạng & Vì sao tiêu cực */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              <div className={`p-3.5 rounded-xl border text-xs sm:text-sm ${
                                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                              }`}>
                                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1.5 flex items-center gap-1.5">
                                  <Info className="w-4 h-4 text-amber-500" />
                                  Tóm tắt phản ánh từ các bài báo:
                                </h4>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                  {cluster.summary}
                                </p>
                              </div>

                              <div className={`p-3.5 rounded-xl border text-xs sm:text-sm ${
                                isDark ? 'bg-rose-950/20 border-rose-900/40 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-950'
                              }`}>
                                <h4 className="font-bold mb-1.5 flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                                  <TrendingDown className="w-4 h-4 text-rose-500" />
                                  Vì sao mang sắc thái tiêu cực (Nguyên nhân gốc rễ):
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-xs opacity-90">
                                  {cluster.rootCauses.map((rc, rIdx) => (
                                    <li key={rIdx}>{rc}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Danh sách các bài báo cụ thể trong cụm */}
                            <div className="space-y-2">
                              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                                Danh sách {cluster.articleCount} bài báo cụ thể trong cụm này:
                              </span>
                              <div className="space-y-2">
                                {cluster.articles.map((art) => (
                                  <div
                                    key={art.id}
                                    onClick={() => onSelectArticle && onSelectArticle(art)}
                                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.005] ${
                                      isDark
                                        ? 'bg-slate-950/80 border-slate-800 hover:border-rose-500/50'
                                        : 'bg-white border-slate-200 hover:border-rose-400 shadow-xs'
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1 space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap text-xs">
                                        <SourceBrandBadge source={art.source} url={art.url} size="xs" />
                                        <span className="text-slate-400">•</span>
                                        <span className="text-slate-500 dark:text-slate-400 font-mono">{art.timeAgo}</span>
                                        {art.isEmergency && (
                                          <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-600 text-white">
                                            KHẨN CẤP
                                          </span>
                                        )}
                                      </div>
                                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                        {art.title}
                                      </h4>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                        {art.summary}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                        Điểm: {art.sentimentScore}
                                      </span>
                                      <ArrowRight className="w-4 h-4 text-slate-400" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* ĐỀ XUẤT PHƯƠNG ÁN XỬ LÝ TRUYỀN THÔNG TÁC CHIẾN (BÁM SÁT CỤM NÀY) */}
                            <div className={`p-4 rounded-xl border-2 space-y-3 ${
                              isDark
                                ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/30 border-indigo-500/40 text-slate-100'
                                : 'bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/60 border-indigo-200 text-slate-900 shadow-sm'
                            }`}>
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-indigo-500" />
                                  <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                                    Đề Xuất Phương Án Xử Lý Truyền Thông Tác Chiến Cho Cụm Tin Này:
                                  </h4>
                                </div>
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                                  {cluster.mediaResponsePlan.targetStrategy}
                                </span>
                              </div>

                              {/* Đơn vị chủ trì & Kênh phát ngôn */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                  <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-0.5">
                                    Đơn vị chủ trì tham mưu:
                                  </span>
                                  <strong className="text-indigo-600 dark:text-indigo-300 font-bold">
                                    {cluster.mediaResponsePlan.leadAgency}
                                  </strong>
                                </div>
                                <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                  <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-0.5">
                                    Hình thức & Kênh phát ngôn:
                                  </span>
                                  <strong className="text-slate-800 dark:text-slate-200 font-bold">
                                    {cluster.mediaResponsePlan.spokespersonAction}
                                  </strong>
                                </div>
                              </div>

                              {/* Thông điệp then chốt (Key Talking Points) */}
                              <div className="space-y-1.5 text-xs sm:text-sm">
                                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs uppercase tracking-wider">
                                  Thông điệp then chốt cần phát ngôn (Key Talking Points):
                                </span>
                                <div className="space-y-1.5">
                                  {cluster.mediaResponsePlan.keyTalkingPoints.map((tp, tpIdx) => (
                                    <div key={tpIdx} className="flex items-start gap-2 p-2 rounded-lg bg-black/5 dark:bg-white/5">
                                      <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                      <span className="text-xs leading-relaxed">{tp}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* 3 Bước tác chiến cụ thể */}
                              <div className="space-y-1.5 text-xs sm:text-sm">
                                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs uppercase tracking-wider">
                                  Quy trình 3 bước tác chiến triển khai:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  {cluster.mediaResponsePlan.actionableSteps.map((step, sIdx) => (
                                    <div key={sIdx} className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs">
                                      <span className="font-mono font-black text-indigo-500 block mb-1">
                                        Bước {sIdx + 1}:
                                      </span>
                                      <span>{step}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Nút hành động trực tiếp */}
                              <div className="pt-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => onDraftStatementForCluster && onDraftStatementForCluster(cluster)}
                                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-2 transition-all cursor-pointer hover:shadow-lg"
                                >
                                  <FileEdit className="w-4 h-4" />
                                  <span>Soạn Thảo Phát Ngôn & Kế Hoạch Xử Lý Cho Cụm Này</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PHÁT HIỆN NGUY CƠ & KHOẢNG TRỐNG TRUYỀN THÔNG */}
          {activeTab === 'communication_gaps' && (
            <div className="space-y-4">
              {/* Definition Box */}
              <div className={`p-4 rounded-xl border space-y-1.5 ${
                isDark ? 'bg-amber-950/20 border-amber-800/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center gap-2 font-black text-sm">
                  <Compass className="w-5 h-5 text-amber-500" />
                  <span>Định Nghĩa Nguy Cơ & Khoảng Trống Truyền Thông (Media Vacuum)</span>
                </div>
                <p className="text-xs leading-relaxed opacity-95">
                  <strong>Khoảng trống truyền thông</strong> xuất hiện khi một <strong>vấn đề được dư luận, người dân và doanh nghiệp đặc biệt quan tâm</strong> (lượng tìm kiếm & thảo luận cao), nhưng <strong>chưa được cơ quan quản lý thông tin đầy đủ, chưa giải thích rõ chính sách, chưa có tư vấn cụ thể xem người dân & DN cần làm gì</strong>. Nếu không chủ động tăng cường tin bài lấp đầy khoảng trống, tin đồn thất thiệt và cách hiểu sai lệch sẽ chiếm lĩnh dư luận.
                </p>
              </div>

              {communicationGaps.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
                  <p className="font-bold text-sm">Các kênh thông tin chính sách đang đáp ứng đầy đủ nhu cầu của công chúng.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {communicationGaps.map((gap, gIdx) => {
                    const isExpanded = expandedGapId === gap.id;
                    return (
                      <div
                        key={gap.id}
                        className={`rounded-xl border transition-all overflow-hidden ${
                          isExpanded
                            ? isDark
                              ? 'bg-slate-900 border-amber-500/70 shadow-lg'
                              : 'bg-white border-amber-400 shadow-md ring-1 ring-amber-300'
                            : isDark
                            ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Gap Header */}
                        <div
                          onClick={() => setExpandedGapId(isExpanded ? null : gap.id)}
                          className="p-3.5 sm:p-4 cursor-pointer flex items-center justify-between gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                              {gIdx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                  gap.publicInterestLevel === 'very_high'
                                    ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                                }`}>
                                  Dư luận quan tâm: {gap.publicInterestLevel === 'very_high' ? 'Rất cao' : 'Cao'}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                                  {gap.sectorNameVi}
                                </span>
                              </div>
                              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mt-1 leading-snug">
                                {gap.topic}
                              </h3>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 hidden sm:inline">
                              {gap.proactiveActionPlan.priorityLevel}
                            </span>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                          </div>
                        </div>

                        {/* Gap Expanded Body */}
                        {isExpanded && (
                          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 space-y-4 bg-white/50 dark:bg-slate-900/50">
                            {/* Phân tích khoảng trống & Nguy cơ tiềm ẩn */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                              <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                              }`}>
                                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                  <Info className="w-4 h-4 text-amber-500" />
                                  Khoảng trống thông tin đang thiếu hụt:
                                </h4>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                  {gap.gapDescription}
                                </p>
                                <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                                  {gap.buzzVolumeDesc}
                                </p>
                              </div>

                              <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                                isDark ? 'bg-rose-950/20 border-rose-900/40 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-950'
                              }`}>
                                <h4 className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                                  Nguy cơ nếu không chủ động lấp khoảng trống:
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-xs opacity-90">
                                  {gap.potentialRisks.map((pr, prIdx) => (
                                    <li key={prIdx}>{pr}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Người dân & Doanh nghiệp thực sự cần làm gì / cần hiểu gì */}
                            <div className={`p-3.5 rounded-xl border text-xs sm:text-sm ${
                              isDark ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            }`}>
                              <h4 className="font-bold mb-2 flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 text-xs uppercase tracking-wider">
                                <BookOpen className="w-4 h-4 text-emerald-500" />
                                Hướng dẫn thực tế: Người dân & Doanh nghiệp cần làm gì & cần biết gì?
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {gap.whatPeopleNeedToKnow.map((item, itemIdx) => (
                                  <div key={itemIdx} className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs">
                                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 block mb-1">
                                      Điểm {itemIdx + 1}:
                                    </span>
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* ĐỀ XUẤT TÁC CHIẾN: CHỦ ĐỘNG TĂNG CƯỜNG TIN BÀI VÀO MẢNG ĐÓ */}
                            <div className={`p-4 rounded-xl border-2 space-y-3 ${
                              isDark
                                ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 border-amber-500/40 text-slate-100'
                                : 'bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60 border-amber-200 text-slate-900 shadow-sm'
                            }`}>
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-amber-500" />
                                  <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-amber-700 dark:text-amber-300">
                                    Kế Hoạch Tác Chiến: Chủ Động Tăng Cường Tin Bài & Cẩm Nang FAQ
                                  </h4>
                                </div>
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20">
                                  Đơn vị: {gap.proactiveActionPlan.leadUnit}
                                </span>
                              </div>

                              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                                Chiến dịch đề xuất: <strong>{gap.proactiveActionPlan.recommendedCampaign}</strong>
                              </p>

                              <div className="space-y-1.5 text-xs sm:text-sm">
                                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs uppercase tracking-wider">
                                  Các hành động tác chiến cụ thể để lấp khoảng trống thông tin:
                                </span>
                                <div className="space-y-1.5">
                                  {gap.proactiveActionPlan.tactics.map((tactic, tIdx) => (
                                    <div key={tIdx} className="flex items-start gap-2 p-2 rounded-lg bg-black/5 dark:bg-white/5">
                                      <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                      <span className="text-xs leading-relaxed">{tactic}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="pt-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => onDraftCampaignForGap && onDraftCampaignForGap(gap)}
                                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-amber-600 hover:bg-amber-700 text-white shadow-md flex items-center gap-2 transition-all cursor-pointer hover:shadow-lg"
                                >
                                  <FileText className="w-4 h-4" />
                                  <span>Khởi Tạo Kế Hoạch Tăng Cường Tin Bài & Cẩm Nang FAQ</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50 text-xs shrink-0">
          <span className="text-slate-500 dark:text-slate-400">
            Hệ thống Social Listening & Lắng nghe Dư luận BTC
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
