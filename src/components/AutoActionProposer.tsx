import React, { useState } from 'react';
import {
  ScrapedNewsItem,
  ProposedLeadershipAction,
  ArticleActionProposalResult,
} from '../types';
import {
  generateAutoActionProposals,
  getActionCategoryPresentation,
  formatActionProposalForClipboard,
  formatAllActionsProposalForClipboard,
} from '../lib/actionProposerEngine';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import {
  Sparkles,
  Zap,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldAlert,
  Clock,
  Building2,
  CheckCircle2,
  ArrowRight,
  Send,
  HelpCircle,
  Handshake,
  Gavel,
} from 'lucide-react';

interface AutoActionProposerProps {
  item: ScrapedNewsItem;
  onDraftStatement?: (item: ScrapedNewsItem) => void;
  onPolicySubmission?: (item: ScrapedNewsItem) => void;
  isCompact?: boolean;
}

export const AutoActionProposer: React.FC<AutoActionProposerProps> = ({
  item,
  onDraftStatement,
  onPolicySubmission,
  isCompact = false,
}) => {
  const { isDark } = useTheme();
  const { isVietnamese } = useI18n();
  const [isOpen, setIsOpen] = useState(true);
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);
  const [copiedActionId, setCopiedActionId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Fallback initial proposal result from 6W & sentiment rules
  const [proposalResult, setProposalResult] = useState<ArticleActionProposalResult>(() => generateAutoActionProposals(item));
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(false);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Update proposals if item changes and not yet AI generated
  React.useEffect(() => {
    if (!isAiGenerated) {
      setProposalResult(generateAutoActionProposals(item));
    }
  }, [item.id, isAiGenerated]);

  const handleGenerateWithGemini = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsLoadingAi(true);
    setGenerationError(null);
    try {
      const res = await fetch('/api/social-listening/auto-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item }),
      });
      const data = await res.json();
      if (data.success && data.data && Array.isArray(data.data.actions) && data.data.actions.length === 3) {
        setProposalResult(data.data);
        setIsAiGenerated(true);
      } else {
        throw new Error(data.error || 'Không thể sinh hành động');
      }
    } catch (err: any) {
      console.warn('Gemini Auto Action Error:', err);
      setGenerationError(err.message || 'Lỗi khi kết nối Tham khảo AI');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const { actions, recommendedFocus } = proposalResult;

  const handleCopySingleAction = (e: React.MouseEvent, action: ProposedLeadershipAction) => {
    e.stopPropagation();
    const text = formatActionProposalForClipboard(item, action);
    navigator.clipboard.writeText(text);
    setCopiedActionId(action.id);
    setTimeout(() => setCopiedActionId(null), 2000);
  };

  const handleCopyAllActions = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = formatAllActionsProposalForClipboard(item, proposalResult);
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const toggleActionSteps = (actionId: string) => {
    setExpandedActionId(expandedActionId === actionId ? null : actionId);
  };

  return (
    <div
      className={`rounded-xl border transition-all overflow-hidden ${
        isDark
          ? 'bg-gradient-to-b from-slate-900/95 to-indigo-950/30 border-indigo-500/30 shadow-md shadow-indigo-950/20'
          : 'bg-gradient-to-b from-white to-indigo-50/50 border-indigo-200 shadow-xs'
      }`}
    >
      {/* Top Header Bar */}
      <div
        className={`p-2.5 sm:p-3 border-b flex items-center justify-between gap-2 cursor-pointer select-none transition ${
          isDark
            ? 'bg-slate-950/70 border-indigo-500/20 hover:bg-slate-900/90'
            : 'bg-indigo-50/80 border-indigo-100 hover:bg-indigo-100/70'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={`p-1.5 rounded-lg border shrink-0 flex items-center justify-center ${
              isDark
                ? 'bg-gradient-to-br from-indigo-500/30 to-purple-500/20 text-indigo-300 border-indigo-500/40 shadow-xs'
                : 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
            }`}
          >
            <Zap className="w-4 h-4 fill-current animate-pulse" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-xs font-black uppercase tracking-wider ${
                  isDark ? 'text-indigo-200' : 'text-indigo-950'
                }`}
              >
                Auto-Action Proposer
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                  isDark
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-indigo-100 text-indigo-900 border-indigo-300 font-extrabold'
                }`}
              >
                {isVietnamese ? '3 Hành Động Tham Mưu' : '3 Leadership Actions'}
              </span>
              <span
                className={`text-[10px] hidden md:inline font-medium ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                • {isVietnamese ? 'Căn cứ phân tích 6W & Sắc thái' : 'Based on 6W & Sentiment Analysis'}
              </span>
            </div>

            {/* Recommended focus preview when collapsed or sub-line */}
            <p
              className={`text-[11px] truncate mt-0.5 font-medium ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              {recommendedFocus}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Gemini AI Action Generator Button */}
          <button
            onClick={handleGenerateWithGemini}
            disabled={isLoadingAi}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
              isAiGenerated
                ? (isDark ? 'bg-indigo-600/30 text-indigo-200 border-indigo-400/50 hover:bg-indigo-600/50' : 'bg-indigo-100 text-indigo-900 border-indigo-300 hover:bg-indigo-200')
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white border-transparent'
            } ${isLoadingAi ? 'opacity-70 cursor-wait' : ''}`}
            title="Tham khảo AI"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isLoadingAi ? 'animate-spin text-amber-300' : 'text-amber-300'}`} />
            <span className="hidden sm:inline">
              {isLoadingAi
                ? 'AI đang phân tích...'
                : isAiGenerated
                ? 'Làm mới Tham khảo AI'
                : 'Tham khảo AI'}
            </span>
          </button>

          <button
            onClick={handleCopyAllActions}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition cursor-pointer ${
              copiedAll
                ? 'bg-emerald-600 text-white border-emerald-600'
                : isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
            }`}
            title={isVietnamese ? "Sao chép toàn bộ 3 đề xuất hành động" : "Copy all 3 proposed actions"}
          >
            {copiedAll ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3 text-slate-400" />}
            <span className="hidden sm:inline">
              {copiedAll
                ? (isVietnamese ? 'Đã sao chép' : 'Copied All')
                : (isVietnamese ? 'Sao chép 3 đề xuất' : 'Copy 3 Proposals')}
            </span>
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-1 rounded-lg border transition cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300 shadow-2xs'
            }`}
            title={isOpen ? (isVietnamese ? 'Thu gọn đề xuất' : 'Collapse proposals') : (isVietnamese ? 'Mở rộng đề xuất' : 'Expand proposals')}
          >
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Body: 3 Action Cards */}
      {isOpen && (
        <div className="p-2.5 sm:p-3.5 space-y-2.5">
          {/* AI Generation Status Banner */}
          {isAiGenerated && (
            <div
              className={`p-2 rounded-lg text-xs font-semibold border flex items-center justify-between gap-2 ${
                isDark
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="truncate">
                  ✨ 03 Hành động tham mưu đã được Tham khảo AI phân tích và khởi tạo chuyên biệt theo bài viết!
                </span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 shrink-0">
                Tham khảo AI
              </span>
            </div>
          )}

          {generationError && (
            <div
              className={`p-2 rounded-lg text-xs border flex items-center justify-between gap-2 ${
                isDark ? 'bg-rose-950/40 text-rose-300 border-rose-500/40' : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              <span>{generationError}</span>
              <button
                onClick={handleGenerateWithGemini}
                className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-700 cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          )}
          {/* Grounding 6W & Sentiment context pill */}
          <div
            className={`p-2 rounded-lg text-[11px] border flex flex-wrap items-center justify-between gap-1.5 ${
              isDark
                ? 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
                {isVietnamese ? 'Căn cứ AI:' : 'AI Grounding:'}
              </span>
              <span className="truncate">
                {proposalResult.sentimentSummary} • {proposalResult.sixWSummary}
              </span>
            </div>
            <span
              className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${
                isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'
              }`}
            >
              MoF Protocol v2.5
            </span>
          </div>

          {/* Grid of 3 Actions */}
          <div className="grid grid-cols-1 gap-2.5">
            {actions.map((action, index) => {
              const styling = getActionCategoryPresentation(action.category, isDark);
              const isExpanded = expandedActionId === action.id;
              const isCopied = copiedActionId === action.id;

              const shortTagDisplay = isVietnamese ? action.shortTag : (action.shortTagEn || action.shortTag);
              const titleDisplay = isVietnamese ? action.title : (action.titleEn || action.title);
              const categoryLabelDisplay = isVietnamese ? action.categoryLabel : (action.categoryLabelEn || action.categoryLabel);
              const urgencyDisplay = isVietnamese ? action.urgency : (action.urgencyEn || action.urgency);
              const targetUnitDisplay = isVietnamese ? action.targetUnit : (action.targetUnitEn || action.targetUnit);
              const sixWRationaleDisplay = isVietnamese ? action.sixWRationale : (action.sixWRationaleEn || action.sixWRationale);
              const rationaleDisplay = isVietnamese ? action.rationale : (action.rationaleEn || action.rationale);
              const actionStepsDisplay = isVietnamese ? action.actionSteps : (action.actionStepsEn || action.actionSteps);

              return (
                <div
                  key={`${action.id || 'action'}-${index}`}
                  className={`rounded-xl p-3 border transition-all flex flex-col justify-between ${
                    styling.bgClass
                  } ${styling.borderClass} ${
                    isDark ? 'hover:border-indigo-400/60' : 'hover:border-indigo-400'
                  }`}
                >
                  <div>
                    {/* Action Header line */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Rank Badge */}
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                            action.rank === 1
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : isDark
                              ? 'bg-slate-800 text-slate-300 border border-slate-700'
                              : 'bg-white text-slate-800 border border-slate-300'
                          }`}
                        >
                          {action.rank}
                        </span>

                        {/* Short Tag Chip */}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider border shadow-2xs ${
                            styling.badgeClass
                          }`}
                        >
                          {styling.iconEmoji} {shortTagDisplay}
                        </span>

                        {/* Category Label */}
                        <span
                          className={`text-[11px] font-medium hidden sm:inline ${
                            isDark ? 'text-slate-400' : 'text-slate-600'
                          }`}
                        >
                          • {categoryLabelDisplay}
                        </span>

                        {/* Target Unit Badge */}
                        <span
                          className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            isDark
                              ? 'bg-slate-900/90 text-indigo-300 border-indigo-500/30'
                              : 'bg-white text-indigo-900 border-indigo-200 shadow-2xs'
                          }`}
                          title={isVietnamese ? `Đơn vị chủ trì: ${targetUnitDisplay}` : `Lead Unit: ${targetUnitDisplay}`}
                        >
                          <Building2 className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span className="truncate max-w-[170px] sm:max-w-none">Chủ trì: {targetUnitDisplay}</span>
                        </span>

                        {/* Cooperating Units Badge */}
                        {action.cooperatingUnits && action.cooperatingUnits.length > 0 && (
                          <span
                            className={`hidden md:flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                              isDark
                                ? 'bg-slate-900/70 text-cyan-300 border-cyan-500/30'
                                : 'bg-white text-cyan-900 border-cyan-200 shadow-2xs'
                            }`}
                            title={`Đơn vị phối hợp: ${action.cooperatingUnits.join(', ')}`}
                          >
                            <Handshake className="w-3 h-3 text-cyan-500 shrink-0" />
                            <span className="truncate max-w-[160px]">Phối hợp: {action.cooperatingUnits.slice(0, 2).join(', ')}</span>
                          </span>
                        )}
                      </div>

                      {/* Urgency Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          action.urgencyLevel === 'high'
                            ? isDark
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                              : 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold'
                            : action.urgencyLevel === 'medium'
                            ? isDark
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                            : isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{urgencyDisplay}</span>
                      </span>
                    </div>

                    {/* Action Title */}
                    <h4
                      className={`text-xs sm:text-sm font-bold leading-snug mb-1.5 ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}
                    >
                      {titleDisplay}
                    </h4>

                    {/* 6W Rationale Context Box */}
                    <div
                      className={`p-2 rounded-lg border text-[11px] leading-relaxed mb-2 space-y-1 ${
                        isDark
                          ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                          : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className={styling.textAccent}>
                            {isVietnamese ? 'Căn cứ 6W: ' : '6W Rationale: '}
                          </strong>
                          <span>{sixWRationaleDisplay}</span>
                        </div>
                      </div>
                      <p className={`text-[10px] pl-5 italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        💡 {rationaleDisplay}
                      </p>
                    </div>

                    {/* Expandable Implementation Steps */}
                    {isExpanded && (
                      <div
                        className={`p-2.5 rounded-lg border mb-2 text-xs space-y-1.5 animate-fadeIn ${
                          isDark
                            ? 'bg-slate-950/90 border-slate-800/90 text-slate-200'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider block mb-1 ${
                            isDark ? 'text-indigo-400' : 'text-indigo-700'
                          }`}
                        >
                          {isVietnamese ? '📌 3 Bước Triển Khai Thực Hiện:' : '📌 3 Execution Steps:'}
                        </span>
                        {actionStepsDisplay.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-2 text-[11px]">
                            <CheckCircle2
                              className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                isDark ? 'text-emerald-400' : 'text-emerald-600'
                              }`}
                            />
                            <span>
                              <strong>{isVietnamese ? `Bước ${sIdx + 1}` : `Step ${sIdx + 1}`}:</strong> {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Card Footer Controls */}
                  <div
                    className={`pt-2 border-t flex flex-wrap items-center justify-between gap-1.5 text-xs ${
                      isDark ? 'border-slate-800/70' : 'border-slate-200/80'
                    }`}
                  >
                    <button
                      onClick={() => toggleActionSteps(action.id)}
                      className={`text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                        isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>
                        {isExpanded
                          ? (isVietnamese ? 'Ẩn bước thực thi' : 'Hide execution steps')
                          : (isVietnamese ? 'Xem 3 bước thực thi' : 'View 3 execution steps')}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Copy single action brief */}
                      <button
                        onClick={(e) => handleCopySingleAction(e, action)}
                        className={`px-2 py-1 rounded text-[11px] font-medium border flex items-center gap-1 transition cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                        title={isVietnamese ? "Sao chép phiếu đề xuất hành động này" : "Copy action proposal brief"}
                      >
                        {isCopied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        <span>
                          {isCopied
                            ? (isVietnamese ? 'Đã chép' : 'Copied')
                            : (isVietnamese ? 'Chép phiếu' : 'Copy Brief')}
                        </span>
                      </button>

                      {/* Direct Apply / Draft Button */}
                      {onDraftStatement && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDraftStatement(item);
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs ${styling.btnClass}`}
                          title={isVietnamese ? `Khởi tạo văn bản chỉ đạo / phát ngôn cho hành động: ${titleDisplay}` : `Generate directive text for action: ${titleDisplay}`}
                        >
                          <FileText className="w-3 h-3" />
                          <span>{isVietnamese ? 'Áp dụng chỉ đạo' : 'Apply Directive'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
