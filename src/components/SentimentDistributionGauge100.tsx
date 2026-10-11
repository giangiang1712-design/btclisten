import React, { useState } from 'react';
import {
  TrendingUp,
  Minus,
  AlertTriangle,
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTheme } from '../lib/theme';
import { NormalizedSentimentResult } from '../lib/sentimentNormalization';

interface SentimentDistributionGauge100Props {
  sentimentData: NormalizedSentimentResult;
  onFilterSentiment?: (sentiment: 'all' | 'bullish' | 'neutral' | 'bearish') => void;
  selectedSentiment?: 'all' | 'bullish' | 'neutral' | 'bearish';
  showDetailCards?: boolean;
  compact?: boolean;
}

export const SentimentDistributionGauge100: React.FC<SentimentDistributionGauge100Props> = ({
  sentimentData,
  onFilterSentiment,
  selectedSentiment = 'all',
  showDetailCards = false,
  compact = false,
}) => {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(showDetailCards);

  const {
    total,
    bullish,
    neutral,
    bearish,
    bullishPct,
    neutralPct,
    bearishPct,
    sum,
    sentimentScore,
    marketMood,
    moodColor,
  } = sentimentData;

  return (
    <div
      id="sentiment-distribution-compact"
      className={`rounded-2xl border transition-all duration-200 ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 shadow-sm text-slate-100'
          : 'bg-white border-slate-200/90 shadow-xs text-slate-800'
      } p-3 sm:p-4`}
    >
      {/* COMPACT EXECUTIVE ROW: Score + Segmented Bar + 3 Quick Action Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        {/* Left: Overall Health Score */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="w-11 h-11 rounded-xl flex flex-col items-center justify-center font-mono font-black text-white shadow-xs shrink-0"
            style={{ backgroundColor: total === 0 ? (isDark ? '#334155' : '#64748b') : moodColor }}
            title={`Điểm sắc thái: ${total === 0 ? '--' : sentimentScore}/100`}
          >
            <span className="text-base leading-none">{total === 0 ? '--' : sentimentScore}</span>
            <span className="text-[9px] font-bold opacity-85 leading-none mt-0.5">/100</span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Sắc Thái:
              </span>
              <span className="text-xs font-bold" style={{ color: total === 0 ? (isDark ? '#94a3b8' : '#64748b') : moodColor }}>
                {total === 0 ? 'Chờ quét tin' : marketMood}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Đo lường {total.toLocaleString('vi-VN')} tin bài • <span className="font-mono font-bold text-emerald-500">Chuẩn 100%</span>
            </p>
          </div>
        </div>

        {/* Center: The Interactive 100% Bar */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onFilterSentiment && onFilterSentiment(selectedSentiment === 'bullish' ? 'all' : 'bullish')}
                className={`flex items-center gap-1 transition cursor-pointer hover:opacity-80 ${
                  selectedSentiment === 'bullish' ? 'font-black underline text-emerald-600 dark:text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
                title="Lọc tin tích cực"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>Tích cực: {bullishPct}%</span>
              </button>

              <button
                type="button"
                onClick={() => onFilterSentiment && onFilterSentiment(selectedSentiment === 'neutral' ? 'all' : 'neutral')}
                className={`flex items-center gap-1 transition cursor-pointer hover:opacity-80 ${
                  selectedSentiment === 'neutral' ? 'font-black underline text-amber-600 dark:text-amber-400' : 'text-amber-600 dark:text-amber-400'
                }`}
                title="Lọc tin trung tính"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                <span>Trung tính: {neutralPct}%</span>
              </button>

              <button
                type="button"
                onClick={() => onFilterSentiment && onFilterSentiment(selectedSentiment === 'bearish' ? 'all' : 'bearish')}
                className={`flex items-center gap-1 transition cursor-pointer hover:opacity-80 ${
                  selectedSentiment === 'bearish' ? 'font-black underline text-rose-600 dark:text-rose-400' : 'text-rose-600 dark:text-rose-400'
                }`}
                title="Lọc tin tiêu cực"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                <span>Tiêu cực: {bearishPct}%</span>
              </button>
            </div>

            {selectedSentiment !== 'all' && (
              <button
                type="button"
                onClick={() => onFilterSentiment && onFilterSentiment('all')}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
              >
                Xóa lọc ({selectedSentiment === 'bullish' ? 'Tích cực' : selectedSentiment === 'neutral' ? 'Trung tính' : 'Tiêu cực'}) ✕
              </button>
            )}
          </div>

          {/* Interactive Multi-segment Bar */}
          <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/80 dark:border-slate-700/60 flex gap-0.5">
            {total === 0 ? (
              <div className="w-full h-full bg-slate-200/70 dark:bg-slate-700/50 rounded-full flex items-center justify-center text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Chưa có tin bài trong phiên — Bấm &quot;Quét Tin&quot; để cập nhật
              </div>
            ) : (
              <>
                {bullishPct > 0 && (
                  <div
                    style={{ width: `${bullishPct}%` }}
                    title={`Tích cực: ${bullish} bài (${bullishPct}%) - Bấm để lọc`}
                    onClick={() => onFilterSentiment && onFilterSentiment(selectedSentiment === 'bullish' ? 'all' : 'bullish')}
                    className={`h-full rounded-full bg-emerald-500 hover:bg-emerald-600 transition-all cursor-pointer ${
                      selectedSentiment === 'bullish' ? 'ring-2 ring-emerald-400' : ''
                    }`}
                  />
                )}
                {neutralPct > 0 && (
                  <div
                    style={{ width: `${neutralPct}%` }}
                    title={`Trung tính: ${neutral} bài (${neutralPct}%) - Bấm để lọc`}
                    onClick={() => onFilterSentiment && onFilterSentiment(selectedSentiment === 'neutral' ? 'all' : 'neutral')}
                    className={`h-full rounded-full bg-amber-400 hover:bg-amber-500 transition-all cursor-pointer ${
                      selectedSentiment === 'neutral' ? 'ring-2 ring-amber-300' : ''
                    }`}
                  />
                )}
                {bearishPct > 0 && (
                  <div
                    style={{ width: `${bearishPct}%` }}
                    title={`Tiêu cực: ${bearish} bài (${bearishPct}%) - Bấm để lọc`}
                    onClick={() => onFilterSentiment && onFilterSentiment(selectedSentiment === 'bearish' ? 'all' : 'bearish')}
                    className={`h-full rounded-full bg-rose-500 hover:bg-rose-600 transition-all cursor-pointer ${
                      selectedSentiment === 'bearish' ? 'ring-2 ring-rose-400' : ''
                    }`}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: 3 Clickable Compact Metric Pills + Expand Toggle */}
        <div className="flex items-center gap-1.5 shrink-0 self-start lg:self-center">
          <button
            type="button"
            onClick={() => onFilterSentiment && onFilterSentiment(selectedSentiment === 'bullish' ? 'all' : 'bullish')}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedSentiment === 'bullish'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                : isDark
                ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-emerald-400'
                : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            <span>{bullish.toLocaleString()}</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterSentiment && onFilterSentiment(selectedSentiment === 'neutral' ? 'all' : 'neutral')}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedSentiment === 'neutral'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs font-black'
                : isDark
                ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-amber-400'
                : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
            }`}
          >
            <Minus className="w-3 h-3" />
            <span>{neutral.toLocaleString()}</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterSentiment && onFilterSentiment(selectedSentiment === 'bearish' ? 'all' : 'bearish')}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedSentiment === 'bearish'
                ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                : isDark
                ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-rose-400'
                : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>{bearish.toLocaleString()}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={isExpanded ? 'Thu gọn chi tiết' : 'Xem chi tiết'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* OPTIONAL EXPANDED CARDS (Only when user explicitly clicks expand) */}
      {isExpanded && (
        <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3 text-xs animate-fadeIn">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 block text-[11px]">Tích Cực</span>
              <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{bullishPct}% ({bullish} bài)</span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
              <span className="font-bold text-amber-700 dark:text-amber-400 block text-[11px]">Trung Tính</span>
              <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{neutralPct}% ({neutral} bài)</span>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40">
              <span className="font-bold text-rose-700 dark:text-rose-400 block text-[11px]">Tiêu Cực</span>
              <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{bearishPct}% ({bearish} bài)</span>
            </div>
          </div>

          {/* Quy chuẩn phân cấp thời hạn xử lý (SLA) theo điểm sắc thái */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span>QUY CHUẨN XỬ LÝ THEO CHỈ SỐ SẮC THÁI DƯ LUẬN:</span>
              <span className="text-[10px] font-mono text-slate-400">Chỉ đạo Lãnh đạo Bộ</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 text-[11px] font-mono">
              <div className="p-1.5 rounded-lg bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-300 border border-red-300 dark:border-red-800 text-center font-bold">
                <span className="block text-[10px] text-red-700 dark:text-red-400">&lt; 50 điểm</span>
                <span>Xử lý trong 2h</span>
              </div>
              <div className="p-1.5 rounded-lg bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-300 dark:border-orange-800 text-center font-bold">
                <span className="block text-[10px] text-orange-700 dark:text-orange-400">&lt; 60 điểm (50-60)</span>
                <span>Xử lý trong 6h</span>
              </div>
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-center font-bold">
                <span className="block text-[10px] text-amber-700 dark:text-amber-400">&lt; 75 điểm (60-75)</span>
                <span>Xử lý trong 12h</span>
              </div>
              <div className="p-1.5 rounded-lg bg-yellow-100 text-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800 text-center font-bold">
                <span className="block text-[10px] text-yellow-700 dark:text-yellow-400">75 - 85 điểm</span>
                <span>Trong ngày</span>
              </div>
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-300 dark:border-blue-800 text-center font-bold">
                <span className="block text-[10px] text-blue-700 dark:text-blue-400">85 - 90 điểm</span>
                <span>Cân bằng</span>
              </div>
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-center font-bold">
                <span className="block text-[10px] text-emerald-700 dark:text-emerald-400">&gt; 90 điểm</span>
                <span>Tích cực</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
