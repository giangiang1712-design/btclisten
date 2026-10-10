import React, { useState } from 'react';
import { ScrapedNewsItem } from '../types';
import { generateSentimentDiagnostic } from '../lib/sentimentAndGapEngine';
import { useTheme } from '../lib/theme';
import {
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Target,
  Network,
  BarChart3
} from 'lucide-react';
import { ImpactChainViewer } from './ImpactChainViewer';
import { SentimentScoreBreakdownModal } from './SentimentScoreBreakdownModal';

interface SentimentDiagnosticCardProps {
  item: ScrapedNewsItem;
  className?: string;
  onSelectSector?: (sector: string) => void;
  onDraftStatement?: (item: ScrapedNewsItem) => void;
  onGmailAlert?: (item: ScrapedNewsItem) => void;
}

export const SentimentDiagnosticCard: React.FC<SentimentDiagnosticCardProps> = ({
  item,
  className = '',
  onSelectSector,
  onDraftStatement,
  onGmailAlert
}) => {
  const { isDark } = useTheme();
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const diagnostic = item.sentimentDiagnostic || generateSentimentDiagnostic(item);

  const isPositive = diagnostic.polarity === 'bullish';
  const isNegative = diagnostic.polarity === 'bearish';
  const isNeutral = diagnostic.polarity === 'neutral';

  const themeConfig = isPositive
    ? {
        borderClass: isDark ? 'border-emerald-500/40' : 'border-emerald-300',
        bgClass: isDark ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-emerald-50/70 via-white to-slate-50',
        headerText: isDark ? 'text-emerald-300' : 'text-emerald-800',
        badgeBg: isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300',
        badgeLabel: 'TÍCH CỰC / ĐIỂM SÁNG',
        scoreColor: isDark ? 'text-emerald-400' : 'text-emerald-600',
        actionBorder: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
        actionBg: isDark ? 'bg-emerald-950/30' : 'bg-emerald-50/80',
        icon: Sparkles
      }
    : isNegative
    ? {
        borderClass: isDark ? 'border-rose-500/40' : 'border-rose-300',
        bgClass: isDark ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-rose-50/70 via-white to-slate-50',
        headerText: isDark ? 'text-rose-300' : 'text-rose-800',
        badgeBg: isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-rose-100 text-rose-800 border-rose-300',
        badgeLabel: 'TIÊU CỰC / CẢNH BÁO RỦI RO',
        scoreColor: isDark ? 'text-rose-400' : 'text-rose-600',
        actionBorder: isDark ? 'border-rose-500/30' : 'border-rose-200',
        actionBg: isDark ? 'bg-rose-950/30' : 'bg-rose-50/80',
        icon: AlertTriangle
      }
    : {
        borderClass: isDark ? 'border-sky-500/40' : 'border-sky-300',
        bgClass: isDark ? 'bg-gradient-to-br from-sky-950/30 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-sky-50/70 via-white to-slate-50',
        headerText: isDark ? 'text-sky-300' : 'text-sky-800',
        badgeBg: isDark ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-sky-100 text-sky-800 border-sky-300',
        badgeLabel: 'TRUNG TÍNH / THÔNG TIN CHÍNH SÁCH',
        scoreColor: isDark ? 'text-sky-400' : 'text-sky-600',
        actionBorder: isDark ? 'border-sky-500/30' : 'border-sky-200',
        actionBg: isDark ? 'bg-sky-950/30' : 'bg-sky-50/80',
        icon: HelpCircle
      };

  const IconComponent = themeConfig.icon;

  return (
    <div className={`p-4 rounded-2xl border shadow-sm space-y-3.5 ${themeConfig.borderClass} ${themeConfig.bgClass} ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b pb-2.5 dark:border-slate-800/80 border-slate-200">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${themeConfig.badgeBg}`}>
            <IconComponent className="w-4 h-4" />
          </div>
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider ${themeConfig.headerText}`}>
              Chẩn Đoán Sắc Thái & Kế Hoạch Tác Chiến
            </h4>
            <p className="text-[10px] text-slate-400">
              Bóc tách nguyên nhân gốc rễ và đề xuất phương án phát huy thế mạnh / xử lý rủi ro
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${themeConfig.badgeBg}`}>
            {themeConfig.badgeLabel}
          </span>
          <button
            type="button"
            onClick={() => setShowBreakdownModal(true)}
            title="Bấm để xem biểu đồ bóc tách 4 thành phần điểm số & từ khóa highlight"
            className="flex items-baseline gap-0.5 font-mono cursor-pointer transition hover:scale-105 active:scale-95 px-2 py-0.5 rounded-lg border bg-slate-800/40 border-slate-700/60"
          >
            <span className={`text-sm font-black ${themeConfig.scoreColor}`}>
              {diagnostic.score > 0 ? `+${diagnostic.score}` : diagnostic.score}
            </span>
            <span className="text-[10px] text-slate-400">/100</span>
            <span className="text-[10px] ml-1 text-cyan-400">⚡</span>
          </button>
        </div>
      </div>

      {/* Button to open Full Sentiment Decomposition & Keyword Highlight Modal */}
      <button
        type="button"
        onClick={() => setShowBreakdownModal(true)}
        className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between shadow-xs ${
          isDark
            ? 'bg-indigo-950/40 hover:bg-indigo-900/60 border-indigo-700/50 text-indigo-300'
            : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-900'
        }`}
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span>Bóc tách 4 Thành phần & Từ khóa Highlight</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-indigo-400 font-mono">
          <span>Chi tiết</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </button>

      {/* Why Explanation Section */}
      <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
        <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
          💡 Vì sao {isPositive ? 'TÍCH CỰC?' : isNegative ? 'TIÊU CỰC?' : 'TRUNG TÍNH?'}:
        </span>
        <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
          {diagnostic.whyExplanation}
        </p>

        {/* Key Drivers */}
        {diagnostic.keyDrivers && diagnostic.keyDrivers.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-dashed dark:border-slate-800 border-slate-200">
            <span className={`text-[10px] font-bold uppercase block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Các nhân tố mấu chốt được bóc tách:
            </span>
            <ul className="space-y-1">
              {diagnostic.keyDrivers.map((driver, idx) => (
                <li key={idx} className="text-xs flex items-start gap-1.5 text-slate-300 dark:text-slate-300 light:text-slate-700">
                  <span className={isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-sky-400'}>•</span>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{driver}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Plan Section */}
      <div className={`p-3 rounded-xl border ${themeConfig.actionBorder} ${themeConfig.actionBg}`}>
        <div className="flex items-center gap-1.5 mb-2">
          <Target className={`w-3.5 h-3.5 ${themeConfig.scoreColor}`} />
          <span className={`text-[11px] font-bold uppercase tracking-wider ${themeConfig.headerText}`}>
            {diagnostic.actionablePlan.title}
          </span>
        </div>

        <div className="space-y-1.5">
          {diagnostic.actionablePlan.steps.map((step, idx) => (
            <div key={idx} className={`p-2 rounded-lg text-xs leading-relaxed border ${
              isDark ? 'bg-slate-900/80 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
            }`}>
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${themeConfig.scoreColor}`} />
                <span>{step}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] pt-1.5 border-t border-dashed dark:border-slate-800/80 border-slate-200">
          <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Đích đến kỳ vọng:
          </span>
          <span className={`font-bold ${themeConfig.headerText}`}>
            {diagnostic.actionablePlan.targetOutcome}
          </span>
        </div>
      </div>

      {/* Chuỗi Tác Động Hệ Quả Liên Ngành (Impact Chain) cho bài viết Tiêu cực / Rủi ro */}
      {diagnostic.impactChain && (
        <ImpactChainViewer
          impactChain={diagnostic.impactChain}
          onSelectSector={onSelectSector}
        />
      )}

      {/* Sentiment Score Component Breakdown & Highlight Modal */}
      <SentimentScoreBreakdownModal
        item={item}
        isOpen={showBreakdownModal}
        onClose={() => setShowBreakdownModal(false)}
        onDraftStatement={onDraftStatement}
        onGmailAlert={onGmailAlert}
      />
    </div>
  );
};
