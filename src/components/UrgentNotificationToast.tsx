import React, { useState, useMemo } from 'react';
import { ActiveAlertNotification, WarningAlertLevelType, formatNewsFullDateTime, ScrapedNewsItem } from '../types';
import { useTheme } from '../lib/theme';
import {
  Flame,
  X,
  Building2,
  FileText,
  AlertTriangle,
  Zap,
  Activity,
  ClipboardList,
  AlertOctagon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sliders,
  ExternalLink,
} from 'lucide-react';

interface UrgentNotificationToastProps {
  alert?: ActiveAlertNotification | null;
  alerts?: ActiveAlertNotification[] | null;
  onClose: () => void;
  onOpenExecutiveModal: (alert: ActiveAlertNotification) => void;
  onOpenDraftStatement: (alert: ActiveAlertNotification) => void;
  onOpenAlertsModal?: () => void;
  onOpenInterventionModal?: (article: ScrapedNewsItem) => void;
}

// Helper to determine the effective alert level from notification or article pipeline
const resolveAlertLevel = (alert: ActiveAlertNotification): WarningAlertLevelType => {
  if (alert.alertLevel) return alert.alertLevel;
  if (alert.article?.warningPipeline?.level3Action?.alertLevel) {
    return alert.article.warningPipeline.level3Action.alertLevel;
  }
  if (alert.priorityLevel === 'critical' || alert.article?.isEmergency) return 'EMERGENCY';
  if (alert.priorityLevel === 'high') return 'RAPID';
  if (alert.priorityLevel === 'medium') return 'EARLY';
  return 'STANDARD';
};

interface AlertLevelVisualConfig {
  nameVi: string;
  badgeLabel: string;
  badgeClass: string;
  pulseColor: string;
  dotColor: string;
  containerClass: (isDark: boolean) => string;
  subtitleClass: string;
  icon: React.ReactNode;
  primaryButtonClass: string;
}

const getAlertLevelConfig = (level: WarningAlertLevelType): AlertLevelVisualConfig => {
  switch (level) {
    case 'EMERGENCY':
      return {
        nameVi: 'Vụ việc Cấp bách (Cần xử lý ngay)',
        badgeLabel: '△ [SOP 4] CẤP BÁCH',
        badgeClass: 'bg-white text-black font-black border border-white',
        pulseColor: 'bg-white',
        dotColor: 'bg-white',
        containerClass: (isDark) => 'bg-black border-2 border-white shadow-2xl text-white',
        subtitleClass: 'text-white font-bold',
        icon: <AlertOctagon className="w-4 h-4 text-white" />,
        primaryButtonClass: 'bg-white text-black font-black hover:bg-zinc-200',
      };
    case 'RAPID':
      return {
        nameVi: 'Tin tức Đáng chú ý (Cần chỉ đạo)',
        badgeLabel: '◇ [SOP 3] CẢNH BÁO NHANH',
        badgeClass: 'bg-zinc-200 text-zinc-950 font-bold border border-white',
        pulseColor: 'bg-zinc-300',
        dotColor: 'bg-zinc-100',
        containerClass: (isDark) => 'bg-black border-2 border-zinc-400 shadow-xl text-white',
        subtitleClass: 'text-zinc-100 font-bold',
        icon: <Zap className="w-4 h-4 text-white" />,
        primaryButtonClass: 'bg-zinc-800 text-white font-bold hover:bg-zinc-700 border border-zinc-600',
      };
    case 'EARLY':
      return {
        nameVi: 'Cấp 2: Cảnh Báo Sớm — Early Warning (40–59)',
        badgeLabel: '□ [SOP 2] CẢNH BÁO SỚM',
        badgeClass: 'bg-zinc-700 text-white font-bold border border-zinc-600',
        pulseColor: 'bg-zinc-400',
        dotColor: 'bg-zinc-300',
        containerClass: (isDark) => 'bg-black border border-zinc-600 shadow-lg text-white',
        subtitleClass: 'text-zinc-200 font-medium',
        icon: <AlertTriangle className="w-4 h-4 text-zinc-300" />,
        primaryButtonClass: 'bg-zinc-800 text-white font-bold hover:bg-zinc-700 border border-zinc-700',
      };
    case 'DISTANT':
      return {
        nameVi: 'Cấp 1: Cảnh Báo Xa — Early Horizon (20–39)',
        badgeLabel: '○ [SOP 1] CẢNH BÁO XA',
        badgeClass: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
        pulseColor: 'bg-zinc-500',
        dotColor: 'bg-zinc-400',
        containerClass: (isDark) => 'bg-black border border-zinc-800 shadow-md text-white',
        subtitleClass: 'text-zinc-300',
        icon: <Activity className="w-4 h-4 text-zinc-400" />,
        primaryButtonClass: 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700',
      };
    case 'STANDARD':
    default:
      return {
        nameVi: 'Giám sát Thường quy',
        badgeLabel: '📋 GIÁM SÁT THƯỜNG QUY',
        badgeClass: 'bg-zinc-900 text-zinc-400 border border-zinc-800',
        pulseColor: 'bg-zinc-600',
        dotColor: 'bg-zinc-500',
        containerClass: (isDark) => 'bg-black border border-zinc-800 text-white',
        subtitleClass: 'text-zinc-400',
        icon: <ClipboardList className="w-4 h-4 text-zinc-400" />,
        primaryButtonClass: 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700',
      };
  }
};

export const UrgentNotificationToast: React.FC<UrgentNotificationToastProps> = ({
  alert,
  alerts,
  onClose,
  onOpenExecutiveModal,
  onOpenDraftStatement,
  onOpenAlertsModal,
  onOpenInterventionModal,
}) => {
  const { isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Normalize alert items list
  const alertList: ActiveAlertNotification[] = useMemo(() => {
    if (alerts && alerts.length > 0) return alerts;
    if (alert) return [alert];
    return [];
  }, [alerts, alert]);

  if (alertList.length === 0) return null;

  const totalCount = alertList.length;
  const safeIndex = Math.min(currentIndex, totalCount - 1);
  const currentAlert = alertList[safeIndex] || alertList[0];

  const { article, triggerName, matchedKeywords, isSimulated } = currentAlert;
  const alertLevel = resolveAlertLevel(currentAlert);
  const visualConfig = getAlertLevelConfig(alertLevel);
  const realPublishedTime = formatNewsFullDateTime(article);

  // Level statistics in the batch for summary header
  const levelCounts = useMemo(() => {
    const emergencyCount = alertList.filter((a) => resolveAlertLevel(a) === 'EMERGENCY').length;
    const rapidCount = alertList.filter((a) => resolveAlertLevel(a) === 'RAPID').length;
    const earlyCount = alertList.filter((a) => resolveAlertLevel(a) === 'EARLY').length;
    const distantCount = alertList.filter((a) => resolveAlertLevel(a) === 'DISTANT').length;
    return { emergencyCount, rapidCount, earlyCount, distantCount };
  }, [alertList]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalCount - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < totalCount - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 z-[100] backdrop-blur-md animate-fadeIn">
      <div
        className={`p-6 sm:p-8 rounded-xl transition-all overflow-hidden relative max-w-3xl w-full border-2 border-slate-200 shadow-2xl bg-slate-950 text-white ${visualConfig.containerClass(
          isDark
        )}`}
      >
        {/* Top Summary Banner when multiple alerts are in batch */}
        {totalCount > 1 && (
          <div className="-mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-5 px-6 py-3.5 border-b-2 border-slate-800 bg-slate-900 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-white" />
                <span>PHIÊN QUÉT CẢNH BÁO ({totalCount} SỰ VỤ KHẨN)</span>
              </span>
              <div className="flex items-center gap-1.5">
                {levelCounts.emergencyCount > 0 && (
                  <span className="text-xs px-2.5 py-1 rounded-sm bg-white text-black font-black uppercase">
                    {levelCounts.emergencyCount} Cấp bách
                  </span>
                )}
                {levelCounts.rapidCount > 0 && (
                  <span className="text-xs px-2.5 py-1 rounded-sm bg-slate-200 text-slate-950 font-bold uppercase">
                    {levelCounts.rapidCount} Đáng chú ý
                  </span>
                )}
                {levelCounts.earlyCount > 0 && (
                  <span className="text-xs px-2.5 py-1 rounded-sm bg-slate-700 text-white font-bold uppercase">
                    {levelCounts.earlyCount} Lưu tâm
                  </span>
                )}
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-mono font-bold text-slate-300">
                {safeIndex + 1} / {totalCount}
              </span>
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 transition cursor-pointer text-white border border-slate-600"
                title="Sự vụ trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 transition cursor-pointer text-white border border-slate-600"
                title="Sự vụ kế tiếp"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Current Alert Status Strip */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex h-3.5 w-3.5 relative">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${visualConfig.pulseColor}`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-3.5 w-3.5 ${visualConfig.dotColor}`}
              ></span>
            </span>

            <span
              className={`text-xs font-black uppercase px-2.5 py-1 rounded-sm tracking-wider ${visualConfig.badgeClass}`}
            >
              {isSimulated ? '[GIẢ LẬP] ' : ''}
              {visualConfig.badgeLabel}
            </span>

            {article.velocityStatus === 'spike' && (
              <span className="text-xs px-2 py-0.5 rounded-sm bg-slate-800 text-white font-bold border border-slate-600 flex items-center gap-1 animate-pulse">
                <Flame className="w-3.5 h-3.5 text-white" /> Spike
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-300 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" />
              {realPublishedTime}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition cursor-pointer"
              title="Đóng thông báo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Trigger Name Subtitle with dynamic Icon & Color */}
        <div className={`text-sm font-bold mb-2 flex items-center gap-2 ${visualConfig.subtitleClass}`}>
          {visualConfig.icon}
          <span className="truncate">{triggerName}</span>
        </div>

        {/* Article Headline (18px+) */}
        <h4 className="text-lg sm:text-xl font-black leading-snug mb-3 text-white">
          {article.title}
        </h4>

        {/* Metrics Row (14px Readable) */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm mb-4">
          <span className="px-2.5 py-1 rounded-sm border border-slate-700 bg-slate-900 text-slate-200 font-medium">
            Nguồn: <strong className="font-bold text-white">{article.source}</strong>
          </span>

          <span className="px-2.5 py-1 rounded-sm bg-slate-800 border border-slate-700 text-white font-bold">
            Buzz: {article.buzzScore}/100
          </span>

          <span className="px-2.5 py-1 rounded-sm bg-slate-800 border border-slate-700 text-white font-bold">
            Impact: {article.impactScore || 85}/100
          </span>

          {matchedKeywords && matchedKeywords.length > 0 && (
            <span className="text-xs text-slate-300 flex items-center gap-1 font-mono">
              Khớp: {matchedKeywords.slice(0, 3).join(', ')}
            </span>
          )}
        </div>

        {/* Action Buttons (High Contrast Square Buttons) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t-2 border-slate-800">
          <button
            onClick={() => {
              if (onOpenInterventionModal && article) {
                onOpenInterventionModal(article);
              } else {
                onOpenExecutiveModal(currentAlert);
              }
            }}
            className="px-4 py-3 text-sm sm:text-base font-bold bg-white text-slate-950 hover:bg-slate-200 border-2 border-white rounded-md shadow-md flex items-center justify-center gap-2 cursor-pointer transition min-h-[48px]"
          >
            <Zap className="w-4 h-4 text-slate-950" />
            <span>Xử Lý Can Thiệp</span>
          </button>

          <button
            onClick={() => onOpenDraftStatement(currentAlert)}
            className="px-4 py-3 border-2 border-slate-300 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base rounded-md flex items-center justify-center gap-2 cursor-pointer transition min-h-[48px]"
          >
            <FileText className="w-4 h-4 text-white" />
            <span>Soạn Thông Cáo</span>
          </button>

          {onOpenAlertsModal && totalCount > 1 && (
            <button
              onClick={onOpenAlertsModal}
              className="px-4 py-3 border-2 border-slate-400 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm sm:text-base rounded-md flex items-center justify-center gap-2 cursor-pointer transition min-h-[48px]"
              title="Mở toàn bộ danh sách cảnh báo"
            >
              <Layers className="w-4 h-4 text-white" />
              <span>Xem {totalCount} Cảnh Báo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
