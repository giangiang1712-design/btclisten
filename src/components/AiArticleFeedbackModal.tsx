import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldAlert,
  Trash2,
  Tag,
  AlertCircle,
  CheckCircle2,
  BrainCircuit,
  RefreshCw,
  Plus,
  HelpCircle,
  Flame,
  Building2,
  FileText,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { ScrapedNewsItem, AiExclusionRule, formatNewsTimeDisplay } from '../types';
import { useTheme } from '../lib/theme';
import { getCustomApiKeyHeader } from '../lib/apiKeyManager';

interface AiArticleFeedbackModalProps {
  article: ScrapedNewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRemoveAndTrain: (
    article: ScrapedNewsItem,
    ruleData: {
      ruleName: string;
      userNote: string;
      category: string;
      keywords: string[];
      aiExplanation: string;
    }
  ) => Promise<void>;
  onOpenRulesManager?: () => void;
}

const QUICK_REASON_TAGS = [
  {
    id: 'bds_quang_cao',
    label: 'Quảng cáo BĐS / Đất nền cá nhân',
    defaultNote: 'Bài viết quảng cáo bán đất nền, phân lô cá nhân, không thuộc quản lý tài chính nhà nước.',
  },
  {
    id: 'ngoai_nganh',
    label: 'Không thuộc phạm vi Tài chính công / BTC',
    defaultNote: 'Nội dung thuộc lĩnh vực khác, không liên quan đến điều hành kinh tế vĩ mô hay cơ quan Bộ Tài chính.',
  },
  {
    id: 'giai_tri_doi_song',
    label: 'Đời sống / Showbiz / Ngoài lề',
    defaultNote: 'Tin giật gân, đời sống nghệ sĩ, sự kiện giải trí không phục vụ báo cáo giao ban nghiệp vụ.',
  },
  {
    id: 'nham_tu_khoa',
    label: 'Nhầm lẫn từ ngữ (nghĩa bóng)',
    defaultNote: 'Bài viết dùng từ ngữ tài chính nhưng mang nghĩa bóng hoặc ví von, không có số liệu kinh tế thật.',
  },
  {
    id: 'tin_nuoc_ngoai',
    label: 'Tin quốc tế không liên quan VN',
    defaultNote: 'Tin tức nước ngoài không có tác động trực tiếp hay đối sánh với thị trường tài chính Việt Nam.',
  },
  {
    id: 'tin_rac',
    label: 'Tin rác / Spam / Giật tít',
    defaultNote: 'Tin quảng cáo thương mại thuần túy, tin rác không có giá trị phân tích.',
  },
];

export const AiArticleFeedbackModal: React.FC<AiArticleFeedbackModalProps> = ({
  article,
  isOpen,
  onClose,
  onConfirmRemoveAndTrain,
  onOpenRulesManager,
}) => {
  const { isDark } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<string>('bds_quang_cao');
  const [userNote, setUserNote] = useState<string>(
    'Bài viết này không phù hợp với nghiệp vụ theo dõi tin tức tài chính công. Đề nghị AI loại bỏ và không quét dính các tin tương tự.'
  );
  const [ruleName, setRuleName] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeywordInput, setNewKeywordInput] = useState<string>('');
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(false);

  // Initialize modal state when opened with article
  React.useEffect(() => {
    if (article) {
      const defaultTag = QUICK_REASON_TAGS[0];
      setSelectedCategory(defaultTag.id);
      setUserNote(defaultTag.defaultNote);
      setRuleName(`Loại trừ: ${article.title.substring(0, 45)}...`);
      setKeywords(extractDefaultKeywords(article));
      setAiExplanation('Hệ thống AI sẽ ghi nhận các từ khóa này để tự động bỏ qua bài viết tương tự trong các lần quét sau.');
      setHasAnalyzed(false);
    }
  }, [article]);

  function extractDefaultKeywords(item: ScrapedNewsItem): string[] {
    const kws: string[] = [];
    const text = `${item.title} ${item.summary || ''}`.toLowerCase();
    if (text.includes('đất nền') || text.includes('phân lô')) {
      kws.push('đất nền', 'phân lô bán nền', 'sổ hồng trao tay');
    } else if (text.includes('chung cư') || text.includes('căn hộ')) {
      kws.push('mở bán căn hộ', 'chiết khấu đặt cọc');
    } else if (text.includes('showbiz') || text.includes('diễn viên')) {
      kws.push('showbiz', 'nghệ sĩ', 'đời tư sao');
    } else {
      // Pick 2-3 unique words
      const words = item.title.split(/\s+/).filter((w) => w.length > 3 && !['chính', 'khoán', 'ngân', 'tài'].includes(w.toLowerCase()));
      if (words.length >= 2) {
        kws.push(`${words[0]} ${words[1]}`.toLowerCase());
      }
    }
    return kws;
  }

  const handleSelectQuickTag = (tag: typeof QUICK_REASON_TAGS[0]) => {
    setSelectedCategory(tag.id);
    setUserNote(tag.defaultNote);
  };

  const handleTriggerAiAnalysis = async () => {
    if (!article) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai-exclusion-rules/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCustomApiKeyHeader(),
        },
        body: JSON.stringify({
          title: article.title,
          snippet: article.summary || article.snippet || '',
          userNote: userNote,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setRuleName(json.data.ruleName || ruleName);
        if (json.data.category) setSelectedCategory(json.data.category);
        if (Array.isArray(json.data.keywords) && json.data.keywords.length > 0) {
          setKeywords(json.data.keywords);
        }
        if (json.data.aiExplanation) {
          setAiExplanation(json.data.aiExplanation);
        }
        setHasAnalyzed(true);
      }
    } catch (err) {
      console.warn('AI analysis error, keeping existing fields:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddKeyword = () => {
    const trimmed = newKeywordInput.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setNewKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleConfirm = async () => {
    if (!article) return;
    setIsSubmitting(true);
    try {
      await onConfirmRemoveAndTrain(article, {
        ruleName: ruleName || `Chặn tin: ${article.title.substring(0, 40)}`,
        userNote,
        category: selectedCategory,
        keywords: keywords.length > 0 ? keywords : extractDefaultKeywords(article),
        aiExplanation: aiExplanation || 'Quy tắc được ghi nhận theo yêu cầu người dùng để không quét dính lần sau.',
      });
      onClose();
    } catch (err: any) {
      console.error('Error submitting exclusion rule:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center ring-4 ring-rose-500/10">
              <BrainCircuit className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Loại Bỏ Tin Bài & Đào Tạo Bộ Lọc AI
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-600 dark:text-rose-400">
                  Lần sau không quét dính
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                AI sẽ tiếp thu lý do của bạn và tạo quy tắc chặn tự động để triệt tiêu các bài viết tương tự.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Article Summary Card */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border space-y-2 ${
              isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
              <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {article.source}
              </span>
              <span className="text-slate-400">
                {formatNewsTimeDisplay(article)}
              </span>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
              {article.title}
            </h4>
            <p className="text-slate-500 dark:text-slate-400 line-clamp-2 text-xs">
              {article.summary || article.snippet || 'Không có mô tả tóm tắt.'}
            </p>
          </div>

          {/* Quick Selection Tags */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs uppercase tracking-wider">
              1. Chọn nhanh lý do bài viết không phù hợp:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_REASON_TAGS.map((tag) => {
                const isSelected = selectedCategory === tag.id;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleSelectQuickTag(tag)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold shadow-xs'
                        : isDark
                        ? 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-rose-500 bg-rose-500' : 'border-slate-400'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-xs truncate">{tag.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom User Feedback Note */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">
                2. Ghi chú chi tiết cho AI (để AI hiểu ngữ cảnh):
              </label>
              <button
                type="button"
                onClick={handleTriggerAiAnalysis}
                disabled={isAnalyzing}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAnalyzing ? 'Đang trích xuất...' : 'AI phân tích từ khóa'}</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="Nhập yêu cầu của bạn, ví dụ: 'Tôi không muốn thấy các tin rao bán chung cư mini hay đất nền cá nhân...'"
              className={`w-full p-3 rounded-2xl border text-xs leading-relaxed focus:outline-none focus:ring-2 transition ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-rose-500/40'
                  : 'bg-white border-slate-200 text-slate-800 focus:ring-rose-500/30'
              }`}
            />
          </div>

          {/* AI Extracted Exclusion Rule & Keywords */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-indigo-950/20 border-indigo-900/50' : 'bg-indigo-50/50 border-indigo-200/70'
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-xs uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                  3. Quy tắc loại trừ AI đề xuất:
                </span>
              </div>
              <button
                type="button"
                onClick={handleTriggerAiAnalysis}
                disabled={isAnalyzing}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-700 transition flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>{isAnalyzing ? 'AI đang học...' : 'Trích xuất tự động bằng AI'}</span>
              </button>
            </div>

            {/* Rule Name Input */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Tên quy tắc:
              </span>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="VD: Chặn tin quảng cáo đất nền phân lô cá nhân"
                className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500/40'
                    : 'bg-white border-slate-200 text-slate-800 focus:ring-indigo-500/30'
                }`}
              />
            </div>

            {/* Keyword Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                Từ khóa / Cụm từ AI sẽ tự động chặn trong các lần quét sau:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25 text-xs font-semibold"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(kw)}
                      className="hover:text-rose-900 dark:hover:text-rose-100 transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Custom Keyword */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  placeholder="Thêm từ khóa chặn khác..."
                  className={`flex-1 px-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500/40'
                      : 'bg-white border-slate-200 text-slate-800 focus:ring-indigo-500/30'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
              </div>
            </div>

            {/* AI Explanation / Guarantee */}
            {aiExplanation && (
              <div className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{aiExplanation}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`p-4 sm:p-5 border-t flex items-center justify-between gap-3 shrink-0 flex-wrap ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          {onOpenRulesManager ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRulesManager();
              }}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-semibold underline cursor-pointer"
            >
              Xem danh sách các quy tắc AI đã học &rarr;
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-black text-xs shadow-md shadow-rose-600/20 hover:brightness-110 active:scale-98 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Đang cập nhật AI...' : 'Loại Bỏ & Đào Tạo AI Ngay'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
