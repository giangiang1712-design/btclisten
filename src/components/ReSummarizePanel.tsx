import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Briefcase,
  Glasses,
  Users,
  Check,
  Copy,
  Clock,
  Target,
  Loader2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { ScrapedNewsItem, LeadershipLevel, SummaryLengthMode, TailoredReSummary } from '../types';
import { fetchTailoredReSummary } from '../services/api';
import { useTheme } from '../lib/theme';

interface ReSummarizePanelProps {
  item: ScrapedNewsItem;
  originalSummary?: string;
  onApplyAsPrimarySummary?: (newSummary: string) => void;
}

const AUDIENCE_OPTIONS: {
  id: LeadershipLevel;
  label: string;
  shortLabel: string;
  subLabel: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  badgeClass: string;
}[] = [
  {
    id: 'executive',
    label: 'For Executives (Lãnh đạo Cấp cao)',
    shortLabel: 'Lãnh đạo Cấp cao',
    subLabel: 'Bộ trưởng • Thứ trưởng • Thủ tướng',
    desc: 'Siêu cô đọng, nguyên tắc BLUF, trọng tâm tác động tài khóa và quyết sách chỉ đạo điều hành vĩ mô.',
    icon: Briefcase,
    colorClass: 'text-indigo-500 border-indigo-500/30 bg-indigo-500/10',
    badgeClass: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  },
  {
    id: 'technical_analyst',
    label: 'For Technical Analysts (Chuyên viên Phân tích)',
    shortLabel: 'Chuyên gia Kỹ thuật',
    subLabel: 'Vụ/Cục chuyên môn • Kiểm toán • Thanh tra',
    desc: 'Bóc tách số liệu định lượng, viện dẫn văn bản quy phạm pháp luật, chuỗi truyền dẫn và ma trận rủi ro.',
    icon: Glasses,
    colorClass: 'text-cyan-500 border-cyan-500/30 bg-cyan-500/10',
    badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  },
  {
    id: 'simplified_public',
    label: 'For Public Briefing (Người phát ngôn & Dân sinh)',
    shortLabel: 'Dân sinh & Phát ngôn',
    subLabel: 'Doanh nghiệp • Người nộp thuế • Báo chí',
    desc: 'Ngôn từ bình dị, dễ hiểu, làm rõ quyền lợi/nghĩa vụ của người dân và thông điệp giải tỏa băn khoăn.',
    icon: Users,
    colorClass: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
];

export const ReSummarizePanel: React.FC<ReSummarizePanelProps> = ({
  item,
  originalSummary,
  onApplyAsPrimarySummary,
}) => {
  const { isDark } = useTheme();

  // State
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [selectedAudience, setSelectedAudience] = useState<LeadershipLevel>('executive');
  const [lengthMode, setLengthMode] = useState<SummaryLengthMode>('standard');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tailoredSummary, setTailoredSummary] = useState<TailoredReSummary | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const activeAudienceConfig = AUDIENCE_OPTIONS.find((a) => a.id === selectedAudience) || AUDIENCE_OPTIONS[0];

  const handleReSummarize = async (overrideAudience?: LeadershipLevel, overrideMode?: SummaryLengthMode) => {
    const audienceToUse = overrideAudience || selectedAudience;
    const modeToUse = overrideMode || lengthMode;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchTailoredReSummary({
        title: item.title,
        summary: item.summary || originalSummary || '',
        sector: item.sectorNameVi,
        source: item.source,
        keyPoints: item.keyPoints,
        audienceLevel: audienceToUse,
        lengthMode: modeToUse,
      });

      setTailoredSummary(res);
      if (onApplyAsPrimarySummary && res.summaryText) {
        onApplyAsPrimarySummary(res.summaryText);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tạo bản tóm tắt lại theo cấp bậc lãnh đạo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudienceChange = (level: LeadershipLevel) => {
    setSelectedAudience(level);
    handleReSummarize(level, lengthMode);
  };

  const handleModeChange = (mode: SummaryLengthMode) => {
    setLengthMode(mode);
    handleReSummarize(selectedAudience, mode);
  };

  const handleCopy = () => {
    if (!tailoredSummary) return;
    const text =
      `📋 [BẢN TÓM TẮT ĐIỀU HÀNH TÙY BIẾN THEO CẤP BẬC - MOF LISTENING]\n` +
      `🏷️ Đối tượng: ${tailoredSummary.audienceLabel}\n` +
      `⏱️ Thời gian đọc: ${tailoredSummary.readingTime}\n` +
      `📌 Bài viết: ${item.title}\n\n` +
      `💡 Kết luận trọng tâm (BLUF):\n${tailoredSummary.headline}\n\n` +
      `📝 Nội dung tóm tắt:\n${tailoredSummary.summaryText}\n\n` +
      `🎯 Các điểm then chốt:\n` +
      tailoredSummary.bulletPoints.map((b, i) => ` • Ý ${i + 1}: ${b}`).join('\n') +
      `\n\n⚡ Khuyến nghị hành động:\n${tailoredSummary.recommendation}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setTailoredSummary(null);
    if (onApplyAsPrimarySummary && originalSummary) {
      onApplyAsPrimarySummary(originalSummary);
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
        isDark
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/30 border-indigo-500/30'
          : 'bg-gradient-to-br from-indigo-50/40 via-white to-sky-50/30 border-indigo-200'
      }`}
    >
      {/* Header Bar */}
      <div className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 border-b ${
        isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-indigo-100/80 bg-indigo-50/20'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border ${
            isDark ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-indigo-100 text-indigo-700 border-indigo-200'
          }`}>
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Re-summarize AI (Tùy Biến Cấp Bậc Lãnh Đạo)
              </h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                activeAudienceConfig.badgeClass
              }`}>
                {activeAudienceConfig.shortLabel}
              </span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Yêu cầu AI tái tóm tắt theo phong cách phù hợp: Lãnh đạo Cấp cao vs Chuyên viên Kỹ thuật
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!tailoredSummary ? (
            <button
              type="button"
              onClick={() => handleReSummarize()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tổng hợp...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tóm tắt lại (Re-summarize)</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/30 transition cursor-pointer"
                title="Sao chép bản tóm tắt tùy biến"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleReSummarize()}
                disabled={isLoading}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 border border-slate-300/50 dark:border-slate-700 transition cursor-pointer disabled:opacity-50"
                title="Tạo lại tóm tắt"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Tạo lại</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-500 transition cursor-pointer"
                title="Quay về bản tóm tắt nguyên gốc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bản gốc</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title={isOpen ? 'Thu gọn bộ điều khiển' : 'Mở rộng bộ điều khiển'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 space-y-4">
          {/* Audience Selector Tabs */}
          <div className="space-y-1.5">
            <label className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <Target className="w-3.5 h-3.5 text-indigo-500" />
              <span>1. Chọn Cấp Bậc / Đối Tượng Tiếp Nhận Báo Cáo:</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {AUDIENCE_OPTIONS.map((aud) => {
                const IconComponent = aud.icon;
                const isSelected = selectedAudience === aud.id;
                return (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => handleAudienceChange(aud.id)}
                    className={`p-3 rounded-xl border text-left transition relative cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500'
                          : 'bg-white border-indigo-500 text-slate-900 shadow-md ring-1 ring-indigo-500'
                        : isDark
                        ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                        : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${
                          isSelected
                            ? isDark ? 'bg-indigo-500 text-white' : 'bg-indigo-600 text-white'
                            : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <span className={`text-xs font-bold block ${isSelected ? 'text-indigo-400 dark:text-indigo-300' : ''}`}>
                            {aud.shortLabel}
                          </span>
                          <span className="text-[10px] text-slate-400 block line-clamp-1">
                            {aud.subLabel}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      )}
                    </div>

                    <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-400 line-clamp-2">
                      {aud.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format & Length Mode Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-dashed dark:border-slate-800 border-slate-200">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Độ dài tóm tắt:
              </span>
              <div className="inline-flex rounded-lg p-0.5 border dark:border-slate-800 border-slate-200 dark:bg-slate-950 bg-slate-100">
                <button
                  type="button"
                  onClick={() => handleModeChange('ultra_concise')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    lengthMode === 'ultra_concise'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ⚡ Siêu ngắn (30s)
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('standard')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    lengthMode === 'standard'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📋 Tiêu chuẩn (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('deep')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    lengthMode === 'deep'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🔬 Đầy đủ (In-depth)
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                Thời gian đọc ước tính:{' '}
                <strong className={isDark ? 'text-indigo-300' : 'text-indigo-700'}>
                  {tailoredSummary ? tailoredSummary.readingTime : lengthMode === 'ultra_concise' ? '20-30s' : '45-60s'}
                </strong>
              </span>
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-center gap-3 text-xs text-indigo-300 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
              <span>Tham khảo AI đang cấu trúc lại nội dung chuyên biệt cho {activeAudienceConfig.shortLabel}...</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => handleReSummarize()}
                className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 font-bold transition cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Tailored Result View */}
          {tailoredSummary && !isLoading && (
            <div className={`p-4 rounded-xl border space-y-3.5 ${
              isDark ? 'bg-slate-950/90 border-indigo-500/30' : 'bg-white border-indigo-200 shadow-xs'
            }`}>
              {/* Output Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 dark:border-slate-800 border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase border ${activeAudienceConfig.badgeClass}`}>
                    {tailoredSummary.audienceLabel}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    <span>Thời gian đọc: {tailoredSummary.readingTime}</span>
                  </span>
                  {tailoredSummary.isAiGenerated && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Tham khảo AI</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="hover:underline text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              {/* BLUF Headline */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                isDark
                  ? 'bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/20 border-indigo-500/30'
                  : 'bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/40 border-indigo-200'
              }`}>
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                    Kết luận trọng tâm (Bottom Line Up Front - BLUF)
                  </span>
                  <p className={`text-xs font-bold leading-relaxed ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {tailoredSummary.headline}
                  </p>
                </div>
              </div>

              {/* Tailored Narrative Summary */}
              <div className="space-y-1">
                <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Tóm tắt nội dung tùy biến ({activeAudienceConfig.shortLabel}):
                </span>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {tailoredSummary.summaryText}
                </p>
              </div>

              {/* Bullet Points */}
              {tailoredSummary.bulletPoints && tailoredSummary.bulletPoints.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                    isDark ? 'text-indigo-400' : 'text-indigo-700'
                  }`}>
                    Các trọng điểm then chốt theo góc nhìn chuyên biệt:
                  </span>
                  <div className="space-y-1.5">
                    {tailoredSummary.bulletPoints.map((point, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border flex items-start gap-2 text-xs leading-relaxed ${
                          isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="font-bold text-indigo-500 shrink-0 mt-0.5">
                          #{idx + 1}
                        </span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Directive / Recommendation */}
              {tailoredSummary.recommendation && (
                <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                  isDark ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <Target className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                      Khuyến nghị chỉ đạo / Hành động dành riêng cho {activeAudienceConfig.shortLabel}
                    </span>
                    <p className="text-xs font-semibold leading-relaxed">
                      {tailoredSummary.recommendation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
