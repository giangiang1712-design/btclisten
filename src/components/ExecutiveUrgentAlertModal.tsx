import React, { useState, useEffect } from 'react';
import { ActiveAlertNotification, WarningAlertLevelType, formatNewsFullDateTime } from '../types';
import { useTheme } from '../lib/theme';
import { EARLY_WARNING_7_ACTIONS } from '../lib/alertTriggers';
import {
  Flame,
  FileText,
  ExternalLink,
  Award,
  Clock,
  X,
  AlertTriangle,
  Zap,
  Activity,
  ClipboardList,
  AlertOctagon,
  CheckCircle2,
  HelpCircle,
  Search,
  ShieldCheck,
  Compass,
  Mic,
  Sliders,
  Sparkles,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';

interface ExecutiveUrgentAlertModalProps {
  alert: ActiveAlertNotification | null;
  onClose: () => void;
  onOpenDraftStatement: (alert: ActiveAlertNotification) => void;
  onOpenDeepDive: (articleId: string) => void;
}

// Helper to resolve the 5 official alert levels strictly adhering to hard threshold milestones:
// < 20đ: STANDARD | 20–39đ: DISTANT | 40–59đ: EARLY (Cần lưu tâm) | 60–74đ: RAPID | 75–100đ: EMERGENCY
const resolveAlertLevel = (alert: ActiveAlertNotification): WarningAlertLevelType => {
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

interface ModalAlertVisualTheme {
  nameVi: string;
  badgeLabel: string;
  badgeBg: string;
  modalBorder: (isDark: boolean) => string;
  headerGradient: string;
  headerBorder: string;
  iconContainerBg: string;
  iconContainerBorder: string;
  icon: React.ReactNode;
  primaryActionBtn: string;
  accentText: string;
}

const getModalAlertTheme = (level: WarningAlertLevelType): ModalAlertVisualTheme => {
  switch (level) {
    case 'EMERGENCY':
      return {
        nameVi: 'Vụ việc Cấp bách — EMERGENCY ACTION',
        badgeLabel: '🚨 VỤ VIỆC CẤP BÁCH (EMERGENCY)',
        badgeBg: 'bg-rose-600 text-white shadow-xs shadow-rose-600/50 ring-1 ring-rose-400/50',
        modalBorder: (isDark) =>
          isDark ? 'bg-slate-900 border-rose-600 shadow-rose-950/70 ring-1 ring-rose-500/30' : 'bg-white border-rose-600 shadow-rose-200 ring-1 ring-rose-500/20',
        headerGradient: 'bg-gradient-to-r from-rose-950 via-red-900 to-slate-900 text-white',
        headerBorder: 'border-rose-700/60',
        iconContainerBg: 'bg-rose-600/30',
        iconContainerBorder: 'border-rose-400/50',
        icon: <AlertOctagon className="w-6 h-6 text-rose-400 animate-pulse" />,
        primaryActionBtn: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30',
        accentText: 'text-rose-400',
      };
    case 'RAPID':
      return {
        nameVi: 'Tin tức Đáng chú ý — RAPID DIRECTIVE',
        badgeLabel: '⚡ TIN ĐÁNG CHÚ Ý (RAPID)',
        badgeBg: 'bg-amber-500 text-white shadow-xs shadow-amber-600/50 ring-1 ring-amber-300/50',
        modalBorder: (isDark) =>
          isDark ? 'bg-slate-900 border-amber-500 shadow-amber-950/60 ring-1 ring-amber-500/30' : 'bg-white border-amber-500 shadow-amber-200 ring-1 ring-amber-500/20',
        headerGradient: 'bg-gradient-to-r from-amber-950 via-orange-900 to-slate-900 text-white',
        headerBorder: 'border-amber-700/60',
        iconContainerBg: 'bg-amber-600/30',
        iconContainerBorder: 'border-amber-400/50',
        icon: <Zap className="w-6 h-6 text-amber-400 animate-pulse" />,
        primaryActionBtn: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/30',
        accentText: 'text-amber-400',
      };
    case 'EARLY':
      return {
        nameVi: 'Cấp 2: Cảnh Báo Sớm — EARLY WARNING (40–59đ)',
        badgeLabel: '⏳ CẢNH BÁO SỚM (EARLY)',
        badgeBg: 'bg-amber-600 text-white shadow-xs shadow-amber-600/50',
        modalBorder: (isDark) =>
          isDark ? 'bg-slate-900 border-amber-500 shadow-amber-950/60' : 'bg-white border-amber-500 shadow-amber-200',
        headerGradient: 'bg-gradient-to-r from-amber-950 via-orange-900 to-slate-900 text-white',
        headerBorder: 'border-amber-700/60',
        iconContainerBg: 'bg-amber-600/30',
        iconContainerBorder: 'border-amber-400/50',
        icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
        primaryActionBtn: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30',
        accentText: 'text-amber-400',
      };
    case 'DISTANT':
      return {
        nameVi: 'Cấp 1: Cảnh Báo Xa — EARLY HORIZON (20–39đ)',
        badgeLabel: '🔭 CẢNH BÁO XA (DISTANT)',
        badgeBg: 'bg-sky-600 text-white shadow-xs shadow-sky-600/50',
        modalBorder: (isDark) =>
          isDark ? 'bg-slate-900 border-sky-500 shadow-sky-950/60' : 'bg-white border-sky-500 shadow-sky-200',
        headerGradient: 'bg-gradient-to-r from-sky-950 via-indigo-900 to-slate-900 text-white',
        headerBorder: 'border-sky-700/60',
        iconContainerBg: 'bg-sky-600/30',
        iconContainerBorder: 'border-sky-400/50',
        icon: <Activity className="w-6 h-6 text-sky-400" />,
        primaryActionBtn: 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30',
        accentText: 'text-sky-400',
      };
    case 'STANDARD':
    default:
      return {
        nameVi: 'Giám sát Thường quy — STANDARD MONITORING',
        badgeLabel: '📋 GIÁM SÁT THƯỜNG QUY',
        badgeBg: 'bg-slate-600 text-white',
        modalBorder: (isDark) =>
          isDark ? 'bg-slate-900 border-slate-700 shadow-slate-950/50' : 'bg-white border-slate-300 shadow-slate-200',
        headerGradient: 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white',
        headerBorder: 'border-slate-700',
        iconContainerBg: 'bg-slate-700/50',
        iconContainerBorder: 'border-slate-600',
        icon: <ClipboardList className="w-6 h-6 text-slate-300" />,
        primaryActionBtn: 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 shadow-slate-700/30',
        accentText: 'text-slate-300',
      };
  }
};

export const ExecutiveUrgentAlertModal: React.FC<ExecutiveUrgentAlertModalProps> = ({
  alert,
  onClose,
  onOpenDraftStatement,
  onOpenDeepDive: _onOpenDeepDive,
}) => {
  const { isDark } = useTheme();
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({
    verify_info: false,
    identify_root_cause: false,
    trace_source: false,
    prepare_qa: false,
    prepare_spokesperson: false,
    prepare_explanation_article: false,
    monitor_24h: false,
  });

  // State for Gemini-powered 3-bullet Executive "Why This Matters" Summary
  const [whyMattersBullets, setWhyMattersBullets] = useState<string[]>([]);
  const [isGeneratingBullets, setIsGeneratingBullets] = useState<boolean>(false);
  const [whyMattersError, setWhyMattersError] = useState<string | null>(null);

  const fetchWhyMattersBullets = async (force: boolean = false) => {
    if (!alert?.article) return;
    setIsGeneratingBullets(true);
    setWhyMattersError(null);
    try {
      const art = alert.article;
      const response = await fetch('/api/social-listening/executive-summary-bullets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: art.title,
          summary: art.summary || art.snippet || '',
          sector: art.sector || 'Tài chính - Ngân sách',
          source: art.source || 'Báo chí tài chính',
          keyPoints: art.keyPoints || [],
        }),
      });
      const resData = await response.json();
      if (resData && resData.success && Array.isArray(resData.data?.bullets) && resData.data.bullets.length > 0) {
        setWhyMattersBullets(resData.data.bullets.slice(0, 3));
      } else {
        throw new Error(resData?.error || 'Không nhận được phân tích từ hệ thống');
      }
    } catch (err: any) {
      console.warn('Fallback why-this-matters summary:', err);
      // Construct high-quality fallback bullets based on article context
      const art = alert.article;
      setWhyMattersBullets([
        `Bản chất sự kiện: ${art.title} - Tín hiệu rủi ro thuộc nhóm ${art.sector || 'Tài chính - Ngân sách'} cần thẩm tra thực tế.`,
        `Tác động mục tiêu: Tiềm ẩn nguy cơ ảnh hưởng mục tiêu điều hành ngân sách, cân đối tài khóa và tâm lý thị trường nếu phản ứng chậm trễ.`,
        `Khuyến nghị tham mưu: Chỉ đạo các cơ quan chức năng kích hoạt theo dõi chặt 24h, chủ động chuẩn bị tài liệu Q&A và thông cáo định hướng dư luận.`
      ]);
    } finally {
      setIsGeneratingBullets(false);
    }
  };

  useEffect(() => {
    if (alert?.article) {
      fetchWhyMattersBullets();
    }
  }, [alert?.article?.id, alert?.article?.title]);

  if (!alert) return null;

  const { article, triggerName, triggeredAt, matchedKeywords, isSimulated } = alert;
  const alertLevel = resolveAlertLevel(alert);
  const theme = getModalAlertTheme(alertLevel);

  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;

  // Parse Policy Response Advisor 4-pillar steps
  const advisorText = article.policyResponseAdvisor || '';
  const headerMatch = advisorText.match(/^(\[[^\]]+\])\s*(.*)$/);
  const headerTag = headerMatch ? headerMatch[1] : null;
  const contentBody = headerMatch ? headerMatch[2] : advisorText;
  const stepMatches = contentBody.split(/(?=\d+\.\s+)/);
  const hasSteps = stepMatches.length > 1;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 z-[100] backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-xl shadow-2xl border-2 border-slate-200 bg-slate-950 text-white overflow-hidden">

        {/* Top Executive Header with High-Contrast Monochrome Command Center Identity */}
        <div className="px-6 py-4 border-b-2 border-slate-200 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-white text-black font-black border-2 border-slate-200 flex items-center justify-center shrink-0">
              {theme.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black px-2.5 py-0.5 rounded bg-white text-black border border-white uppercase tracking-wider">
                  {isSimulated ? '[GIẢ LẬP] ' : ''}{theme.badgeLabel}
                </span>
                <span className="text-xs text-slate-300 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-200" /> XUẤT BẢN: {formatNewsFullDateTime(article)}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide mt-1 uppercase">
                {triggerName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Section 1: Event Summary & Metrics */}
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Bản Tin Khớp Ngưỡng Cảnh Báo:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {article.velocityStatus === 'spike' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-600 text-white font-extrabold flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Velocity Spike (Gia Tốc Cao)
                  </span>
                )}
                {article.authorityLevel === 'official_gov' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-600 text-white font-extrabold">
                    Nguồn Cơ quan Nhà nước (x1.8)
                  </span>
                )}
              </div>
            </div>

            <h3 className={`text-base font-extrabold leading-snug mb-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {article.title}
            </h3>

            {/* Source & Real Occurrence Timestamp Provenance Row */}
            <div className={`flex flex-wrap items-center gap-3 text-xs py-2 px-3 rounded-lg mb-3 border ${
              isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Nguồn:</span>
                <strong className="font-bold text-indigo-400">{article.source || 'Cơ quan báo chí'}</strong>
              </div>
              <span className="text-slate-500">•</span>
              <div className="flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-slate-400">Thời điểm xuất bản:</span>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{formatNewsFullDateTime(article)}</strong>
                {article.timeAgo && <span className="text-slate-400">({article.timeAgo})</span>}
              </div>
              {article.agencies && article.agencies.length > 0 && (
                <>
                  <span className="text-slate-500">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-medium">Đơn vị liên quan:</span>
                    <span className="font-semibold text-emerald-400">{article.agencies.join(', ')}</span>
                  </div>
                </>
              )}
            </div>

            <p className={`text-xs leading-relaxed mb-4 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              {article.summary}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className={`p-2 rounded-lg border text-center ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="text-[10px] text-slate-400 font-bold">BUZZ SCORE</div>
                <div className="text-base font-black text-rose-500">{article.buzzScore}/100</div>
              </div>

              <div className={`p-2 rounded-lg border text-center ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="text-[10px] text-slate-400 font-bold">MỨC TÁC ĐỘNG</div>
                <div className="text-base font-black text-indigo-400">{article.impactScore || 85}/100</div>
              </div>

              <div className={`p-2 rounded-lg border text-center ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="text-[10px] text-slate-400 font-bold">SẮC THÁI</div>
                <div className={`text-xs font-black mt-1 ${
                  article.sentiment === 'bullish' ? 'text-emerald-500' : article.sentiment === 'bearish' ? 'text-rose-500' : 'text-slate-400'
                }`}>
                  {article.sentiment === 'bullish' ? 'TÍCH CỰC (+)' : article.sentiment === 'bearish' ? 'TIÊU CỰC (-)' : 'TRUNG TÍNH'}
                </div>
              </div>

              <div className={`p-2 rounded-lg border text-center ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="text-[10px] text-slate-400 font-bold">ĐỒNG PHÁT TÁN</div>
                <div className="text-base font-black text-amber-500">{article.sourceCount || 1} Báo lớn</div>
              </div>
            </div>
          </div>

          {/* Section 1.5: Gemini-Powered "Why This Matters" - 3-Bullet Executive Assessment */}
          <div className={`p-4 sm:p-5 rounded-2xl border-2 transition-all relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-purple-950/30 border-indigo-500/40 shadow-xl shadow-indigo-950/20'
              : 'bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 border-indigo-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between gap-3 mb-3 border-b pb-2.5 border-indigo-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
                      ⚡ Vì Sao Lãnh Đạo Cần Quan Tâm (Why This Matters)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Tham khảo AI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tóm lược 3 gạch đầu dòng cốt lõi hỗ trợ Lãnh đạo đánh giá nhanh rủi ro và điều hành
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchWhyMattersBullets(true)}
                disabled={isGeneratingBullets}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 hover:bg-indigo-950/50 hover:border-indigo-500/50 text-indigo-300'
                    : 'bg-white border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-indigo-700 shadow-2xs'
                } disabled:opacity-50`}
                title="Tham khảo AI phân tích lại"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingBullets ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Phân tích lại</span>
              </button>
            </div>

            {isGeneratingBullets ? (
              <div className="space-y-2.5 py-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border animate-pulse flex items-start gap-3 ${
                      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/30 shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="h-3 bg-indigo-500/30 rounded w-1/4" />
                      <div className="h-3 bg-indigo-500/15 rounded w-11/12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : whyMattersBullets.length > 0 ? (
              <div className="space-y-2.5">
                {/* Bullet 1: Bản chất sự kiện / Rủi ro cốt lõi */}
                <div className={`p-3 rounded-xl border flex items-start gap-3 transition ${
                  isDark
                    ? 'bg-slate-900/80 border-cyan-500/30 text-slate-200'
                    : 'bg-white border-cyan-200 text-slate-800 shadow-2xs'
                }`}>
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black">
                    1
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 block mb-0.5">
                      Bản chất sự kiện & Tín hiệu rủi ro
                    </span>
                    <p className="text-xs leading-relaxed font-medium">
                      {whyMattersBullets[0]}
                    </p>
                  </div>
                </div>

                {/* Bullet 2: Tác động mục tiêu Bộ Tài chính */}
                <div className={`p-3 rounded-xl border flex items-start gap-3 transition ${
                  isDark
                    ? 'bg-slate-900/80 border-amber-500/30 text-slate-200'
                    : 'bg-white border-amber-200 text-slate-800 shadow-2xs'
                }`}>
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black">
                    2
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block mb-0.5">
                      Tác động tới mục tiêu quản lý của Bộ Tài chính
                    </span>
                    <p className="text-xs leading-relaxed font-medium">
                      {whyMattersBullets[1]}
                    </p>
                  </div>
                </div>

                {/* Bullet 3: Khuyến nghị tham mưu hành động tức thì */}
                <div className={`p-3 rounded-xl border flex items-start gap-3 transition ${
                  isDark
                    ? 'bg-slate-900/80 border-emerald-500/30 text-slate-200'
                    : 'bg-white border-emerald-200 text-slate-800 shadow-2xs'
                }`}>
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black">
                    3
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 block mb-0.5">
                      Khuyến nghị tham mưu hành động tức thì
                    </span>
                    <p className="text-xs leading-relaxed font-medium">
                      {whyMattersBullets[2]}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-3">
                Chưa có phân tích. Bấm "Phân tích lại" để kích hoạt AI.
              </div>
            )}
          </div>

          {/* Section: CẦN LƯU TÂM & DỰ BÁO SỚM — EARLY WARNING & HORIZON (40–59) */}
          <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-3.5 transition-all ${
            isDark ? 'bg-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-950/30' : 'bg-amber-50/80 border-amber-300 shadow-sm'
          }`}>
            {/* Header with Philosophy */}
            <div className="border-b pb-3 border-amber-500/30 space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-amber-600 text-white shadow-xs">
                    ⏳ CẦN LƯU TÂM & DỰ BÁO SỚM (40–59)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ⭐ CẤP QUAN TRỌNG NHẤT HỆ THỐNG
                  </span>
                </div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span className="text-slate-400">Tiến độ 7 hành động:</span>
                  <span className={`font-mono px-2 py-0.5 rounded text-[11px] ${
                    completedCount === 7 ? 'bg-emerald-600 text-white' : 'bg-amber-600/30 text-amber-300'
                  }`}>
                    {completedCount}/7 hoàn thành
                  </span>
                </div>
              </div>

              {/* Core System Philosophy Quote */}
              <div className={`p-2.5 rounded-lg border text-xs leading-relaxed italic ${
                isDark ? 'bg-slate-950/80 border-amber-500/30 text-amber-200' : 'bg-white border-amber-200 text-amber-950'
              }`}>
                “Mục tiêu của hệ thống không phải chờ khủng hoảng, mà phải nhận diện mầm mống và khoảng trống thông tin: <strong>«Vấn đề dư luận, người dân, DN quan tâm nhưng chưa được giải thích đầy đủ ➔ Cảnh báo làm rõ ➔ Đề xuất xử lý cụ thể để lấp khoảng trống.»</strong>”
              </div>

              {/* Detailed Information Vacuum Breakdown if present */}
              {article.informationVacuum && (article.informationVacuum.isAlertWarranted || article.informationVacuum.hasGap) && (
                <div className="mt-3 p-3.5 rounded-xl border border-amber-500/40 bg-black/20 space-y-2.5 text-xs not-italic">
                  {article.informationVacuum.issueConcern && (
                    <div className="space-y-0.5">
                      <span className="font-bold text-amber-400 block uppercase text-[10px] tracking-wider">
                        1. Vấn đề Dư luận / Người dân / DN quan tâm, than phiền:
                      </span>
                      <p className="text-slate-200 leading-relaxed font-medium">
                        {article.informationVacuum.issueConcern}
                      </p>
                    </div>
                  )}

                  {article.informationVacuum.clarificationNeeded && (
                    <div className="space-y-0.5 pt-1.5 border-t border-amber-500/20">
                      <span className="font-bold text-rose-400 block uppercase text-[10px] tracking-wider">
                        2. Cảnh báo cần làm rõ:
                      </span>
                      <p className="text-slate-200 leading-relaxed font-medium">
                        {article.informationVacuum.clarificationNeeded}
                      </p>
                    </div>
                  )}

                  {article.informationVacuum.recommendedClosureAction && (
                    <div className="space-y-0.5 pt-1.5 border-t border-amber-500/20">
                      <span className="font-bold text-emerald-400 block uppercase text-[10px] tracking-wider">
                        3. Đề xuất giải quyết để lấp khoảng trống thông tin (Cần làm gì):
                      </span>
                      <p className="text-emerald-300 leading-relaxed font-medium">
                        {article.informationVacuum.recommendedClosureAction}
                      </p>
                    </div>
                  )}

                  <div className="pt-1.5 border-t border-amber-500/20 flex items-center justify-between gap-2 flex-wrap text-[11px] text-slate-400">
                    <span>🏛️ Đơn vị chủ trì: <strong className="text-emerald-400">{article.informationVacuum.actionOwnerUnit || 'Bộ Tài chính'}</strong></span>
                    <span>⏱️ Thời hạn: <strong className="text-amber-400">{article.informationVacuum.closingTimeline || '24h - 48h'}</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* 7 Action Checklist Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {EARLY_WARNING_7_ACTIONS.map((action) => {
                const isDone = !!completedSteps[action.id];
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => toggleStep(action.id)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 select-none ${
                      isDone
                        ? (isDark ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-100' : 'bg-emerald-50 border-emerald-300 text-emerald-900')
                        : (isDark ? 'bg-slate-900/90 border-slate-800 hover:border-orange-500/40 text-slate-200' : 'bg-white border-slate-200 hover:border-orange-300 text-slate-800 shadow-2xs')
                    }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition ${
                      isDone
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs'
                        : (isDark ? 'border-slate-600 bg-slate-800 text-transparent' : 'border-slate-300 bg-slate-100 text-transparent')
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-black ${
                          isDone ? 'text-emerald-400 line-through opacity-90' : (isDark ? 'text-orange-300' : 'text-orange-800')
                        }`}>
                          {action.label}
                        </span>
                        {isDone && (
                          <span className="text-[9px] font-bold uppercase text-emerald-400">Đã tick</span>
                        )}
                      </div>
                      <p className={`text-[11px] leading-snug line-clamp-2 ${
                        isDone ? 'text-slate-400' : (isDark ? 'text-slate-300' : 'text-slate-600')
                      }`}>
                        {action.detail}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Action Bar for Early Warning */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 flex-wrap text-xs ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <span className="text-[11px] text-slate-400 font-medium">
                🎯 Kích hoạt tác chiến 24h: Soạn Q&A, bài giải thích và chỉ định người phát ngôn
              </span>
              <button
                type="button"
                onClick={() => onOpenDraftStatement(alert)}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Soạn Q&A & Bài giải thích</span>
              </button>
            </div>
          </div>

          {/* Section 2: Executive 4-Pillar Action Matrix */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold flex items-center gap-2 text-indigo-400">
                <Award className="w-4 h-4 text-indigo-500" />
                <span>Khung Tham Mưu Điều Hành 4 Trụ Cột Cho Lãnh Đạo</span>
              </h3>
              {headerTag && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  {headerTag}
                </span>
              )}
            </div>

            {hasSteps ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stepMatches.map((step, sIdx) => {
                  const trimmed = step.trim().replace(/;\s*$/, '');
                  if (!trimmed) return null;

                  const isRegulatory = trimmed.includes('Thể chế') || trimmed.includes('Cơ chế') || trimmed.includes('Hướng dẫn');
                  const isAudit = trimmed.includes('Thanh tra') || trimmed.includes('Giám sát') || trimmed.includes('Kiểm tra');
                  const isMedia = trimmed.includes('Truyền thông') || trimmed.includes('Công bố') || trimmed.includes('Định hướng') || trimmed.includes('Họp báo');
                  const isInterAgency = trimmed.includes('Liên ngành') || trimmed.includes('Phối hợp') || trimmed.includes('NHNN') || trimmed.includes('Công an');

                  return (
                    <div
                      key={sIdx}
                      className={`p-3.5 rounded-xl border leading-relaxed flex flex-col justify-between ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {sIdx + 1}
                        </span>
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          isRegulatory
                            ? isDark ? 'text-cyan-400' : 'text-sky-700'
                            : isAudit
                            ? isDark ? 'text-rose-400' : 'text-rose-700'
                            : isMedia
                            ? isDark ? 'text-amber-400' : 'text-amber-700'
                            : isInterAgency
                            ? isDark ? 'text-emerald-400' : 'text-emerald-700'
                            : isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          {isRegulatory ? '🏛️ Thể chế & Nghiệp vụ' : isAudit ? '🔍 Thanh tra & Giám sát' : isMedia ? '📢 Truyền thông & Dư luận' : isInterAgency ? '🤝 Phối hợp Liên ngành' : '📌 Chỉ đạo Thực thi'}
                        </span>
                      </div>
                      <p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {trimmed.replace(/^\d+\.\s*/, '')}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`p-4 rounded-xl border text-xs leading-relaxed font-medium ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                {advisorText}
              </div>
            )}
          </div>

          {/* Section 3: Market & Policy tags */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {article.agencies && article.agencies.map((agency, aIdx) => (
              <span key={aIdx} className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold">
                🏛️ {agency}
              </span>
            ))}
            {article.policyTags && article.policyTags.map((tag, tIdx) => (
              <span key={tIdx} className="px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold">
                📜 {tag}
              </span>
            ))}
          </div>

        </div>

        {/* Footer Actions with Dynamic Level Styling */}
        <div className={`px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Từ khóa kích hoạt: <strong>{matchedKeywords.join(', ')}</strong></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onOpenDraftStatement(alert)}
              className={`flex-1 sm:flex-none px-4 py-2 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 ${theme.primaryActionBtn}`}
            >
              <FileText className="w-4 h-4" />
              <span>Duyệt & Soạn Thông Cáo Khẩn</span>
            </button>

            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-3 py-2 border font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition ${
                  isDark
                    ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-300 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>Nguồn gốc</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

