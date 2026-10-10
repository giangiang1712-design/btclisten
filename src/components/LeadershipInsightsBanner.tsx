import React, { useState } from 'react';
import { ExecutiveSummaryReport, ScrapedNewsItem, formatNewsTimeDisplay } from '../types';
import { useTheme } from '../lib/theme';
import { SourceBrandBadge } from './SourceBrandBadge';
import {
  Sparkles,
  Flame,
  FileText,
  ChevronDown,
  ChevronUp,
  Award,
  Copy,
  Check,
  Printer,
} from 'lucide-react';

interface LeadershipInsightsBannerProps {
  report?: ExecutiveSummaryReport;
  onSelectArticleForDraft: (article: ScrapedNewsItem) => void;
  onDeepDive: (article: ScrapedNewsItem) => void;
}

export const LeadershipInsightsBanner: React.FC<LeadershipInsightsBannerProps> = ({
  report,
  onSelectArticleForDraft,
  onDeepDive,
}) => {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'crisis' | 'positive'>('crisis');
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  if (!report) return null;

  const {
    scannedWindow,
    crisisCount,
    positiveCount,
    policyGuidanceCount,
    overallStrategicAdvice,
    topCrisisDirectives,
    topPositiveDirectives,
  } = report;

  const handleCopyReport = () => {
    const text = `[BÁO CÁO THAM MƯU LÃNH ĐẠO BỘ TÀI CHÍNH - KHUNG 24H]
• Tổng quan chiến lược: ${overallStrategicAdvice}
• Điểm nóng cần xử lý: ${crisisCount} vụ việc
• Điểm sáng lan tỏa: ${positiveCount} nội dung
• Chỉ đạo truyền thông:
${topCrisisDirectives.slice(0, 3).map((d, i) => `  ${i + 1}. [${d.sectorNameVi || d.sector}] ${d.title}: ${d.executiveDirective || d.summary || ''}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <section className={`rounded-2xl p-4 sm:p-5 shadow-md transition-all border ${
      isDark
        ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border-indigo-500/30'
        : 'bg-gradient-to-br from-white via-indigo-50/30 to-blue-50/40 border-indigo-200'
    }`}>
      {/* Top Banner Header */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 ${
        isDark ? 'border-indigo-500/20' : 'border-indigo-100'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 shadow-md shrink-0">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`text-base sm:text-lg font-bold tracking-wide ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Báo Cáo Chỉ Đạo Truyền Thông & Tham Mưu Lãnh Đạo
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                isDark
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                Khung 4 Trụ Cột BTC
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Tự động bóc tách: <strong>Chuyện gì xảy ra</strong> • <strong>Ở đâu</strong> • <strong>Nguyên nhân</strong> • <strong>Đề xuất truyền thông giải quyết khủng hoảng / lan tỏa</strong>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyReport}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
              hasCopied
                ? 'bg-emerald-600 text-white border-emerald-600'
                : isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
            }`}
            title="Sao chép nhanh tóm tắt tham mưu cho Lãnh đạo"
          >
            {hasCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
            <span>{hasCopied ? 'Đã sao chép!' : 'Sao chép tóm tắt'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
            }`}
          >
            <span>{isExpanded ? 'Thu gọn báo cáo' : 'Xem chi tiết'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          
          {/* Executive Strategic Summary Callout */}
          <div className={`p-3.5 sm:p-4 rounded-xl border space-y-2 ${
            isDark
              ? 'bg-slate-950/80 border-indigo-500/30'
              : 'bg-white border-indigo-200 shadow-xs'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-amber-400' : 'text-amber-700'
              }`}>
                <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                Tham Mưu Chiến Lược Tổng Thể ({scannedWindow})
              </span>
              <div className="flex items-center gap-2 text-[11px] flex-wrap">
                <span className={`px-2 py-0.5 rounded font-semibold border ${
                  isDark
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  🚨 {crisisCount} Điểm rủi ro/khủng hoảng
                </span>
                <span className={`px-2 py-0.5 rounded font-semibold border ${
                  isDark
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}>
                  🌟 {positiveCount} Điểm sáng lan tỏa
                </span>
                <span className={`px-2 py-0.5 rounded font-semibold border hidden sm:inline ${
                  isDark
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : 'bg-blue-50 text-blue-800 border-blue-300'
                }`}>
                  📌 {policyGuidanceCount} Hướng dẫn chính sách
                </span>
              </div>
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed font-medium ${
              isDark ? 'text-slate-200' : 'text-slate-700'
            }`}>
              {overallStrategicAdvice}
            </p>
          </div>

          {/* Sub Tab Switcher: Crisis vs Positive (Touch-friendly scrollable ribbon) */}
          <div className={`flex items-center gap-2 border-b pb-2 overflow-x-auto no-scrollbar py-0.5 max-w-full ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <button
              onClick={() => setActiveSubTab('crisis')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
                activeSubTab === 'crisis'
                  ? isDark
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                    : 'bg-rose-100 text-rose-900 border border-rose-300 shadow-xs'
                  : isDark
                    ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
              <span>Điểm Nóng Cần Xử Lý Khủng Hoảng ({topCrisisDirectives.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('positive')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
                activeSubTab === 'positive'
                  ? isDark
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs'
                  : isDark
                    ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <span>Điểm Sáng Cải Cách Cần Lan Tỏa ({topPositiveDirectives.length})</span>
            </button>
          </div>

          {/* Directives Cards List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {(activeSubTab === 'crisis' ? topCrisisDirectives : topPositiveDirectives).map((art) => {
              const directive = art.executiveDirective;
              const isCrisisItem = activeSubTab === 'crisis';

              return (
                <div
                  key={art.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isCrisisItem
                      ? isDark
                        ? 'bg-slate-950/90 border-rose-500/30 hover:border-rose-500/60 shadow-sm'
                        : 'bg-white border-rose-200 hover:border-rose-300 shadow-xs'
                      : isDark
                        ? 'bg-slate-950/90 border-emerald-500/30 hover:border-emerald-500/60 shadow-sm'
                        : 'bg-white border-emerald-200 hover:border-emerald-300 shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header meta */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <SourceBrandBadge
                          source={art.source}
                          url={art.url}
                          size="xs"
                          showIcon={true}
                        />
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          isCrisisItem
                            ? isDark
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                            : isDark
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}>
                          {isCrisisItem ? '🚨 Giải quyết khủng hoảng' : '🌟 Lan tỏa thành tựu'}
                        </span>
                        <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatNewsTimeDisplay(art)}</span>
                      </div>
                      <span className={`text-[11px] font-semibold ${isDark ? 'text-cyan-400' : 'text-sky-700'}`}>{art.sectorNameVi}</span>
                    </div>

                    {/* Title */}
                    <h3 className={`text-sm font-bold transition leading-snug ${
                      isDark
                        ? 'text-slate-100 hover:text-cyan-300'
                        : 'text-slate-900 hover:text-sky-700'
                    }`}>
                      <a href={art.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {art.title}
                      </a>
                    </h3>

                    {/* 4 Pillars Grid for the article */}
                    {directive && (
                      <div className={`rounded-lg p-3 border space-y-2 text-xs ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-800/80'
                          : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div>
                          <span className={`text-[10px] font-bold uppercase block mb-0.5 ${
                            isDark ? 'text-cyan-400' : 'text-sky-700'
                          }`}>
                            1. Chuyện gì xảy ra:
                          </span>
                          <p className={`leading-snug ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{directive.whatHappened}</p>
                        </div>

                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t ${
                          isDark ? 'border-slate-800' : 'border-slate-200'
                        }`}>
                          <div>
                            <span className={`text-[10px] font-bold uppercase block mb-0.5 ${
                              isDark ? 'text-indigo-400' : 'text-indigo-700'
                            }`}>
                              2. Ở đâu / Đơn vị:
                            </span>
                            <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{directive.where?.primaryAgency || directive.whereEntity || 'BTC'}</p>
                          </div>
                          <div>
                            <span className={`text-[10px] font-bold uppercase block mb-0.5 ${
                              isDark ? 'text-amber-400' : 'text-amber-700'
                            }`}>
                              3. Nguyên nhân (Vì sao):
                            </span>
                            <p className={`leading-snug ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{directive.rootCause}</p>
                          </div>
                        </div>

                        <div className={`pt-1.5 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                          <span className={`text-[10px] font-bold uppercase block mb-0.5 ${
                            isCrisisItem
                              ? isDark ? 'text-rose-400' : 'text-rose-700'
                              : isDark ? 'text-emerald-400' : 'text-emerald-700'
                          }`}>
                            4. Đề xuất chiến lược truyền thông:
                          </span>
                          <p className={`font-medium leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                            {directive.mediaStrategy?.tacticalRecommendation || directive.mediaStrategy?.title || directive.mediaStrategy?.keyMessage}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions for Leadership */}
                  <div className={`pt-3 mt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isDark ? 'border-slate-800/80' : 'border-slate-200'
                  }`}>
                    <button
                      onClick={() => onDeepDive(art)}
                      className={`w-full sm:w-auto px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer text-center ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      Bóc tách 6W chi tiết
                    </button>

                    <button
                      onClick={() => onSelectArticleForDraft(art)}
                      className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ${
                        isCrisisItem
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isCrisisItem ? 'Soạn Đề Cương Phát Ngôn Xử Lý' : 'Soạn Thông Cáo Báo Chí Lan Tỏa'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {(activeSubTab === 'crisis' ? topCrisisDirectives : topPositiveDirectives).length === 0 && (
            <div className={`p-8 text-center rounded-xl border text-xs ${
              isDark
                ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              Không có điểm tin {activeSubTab === 'crisis' ? 'tiêu cực / khủng hoảng' : 'tích cực'} đột biến trong khung giờ đã quét.
            </div>
          )}

        </div>
      )}
    </section>
  );
};

