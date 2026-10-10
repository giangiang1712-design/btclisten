import React, { useState, useEffect } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  BookOpen,
  Send,
  HelpCircle,
  Save,
  MessageSquare
} from 'lucide-react';
import {
  RlhfFeedbackItem,
  RAGErrorCategory,
  FeedbackRating,
  saveFeedbackRecord
} from '../lib/rlhfFeedbackService';

interface RlhfFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  userPrompt: string;
  assistantResponse: string;
  initialRating?: FeedbackRating;
  sessionId?: string;
  sessionTitle?: string;
  ragLegalCitations?: Array<{
    code: string;
    title: string;
    reRankScore: number;
    extractedClauses?: string[];
  }>;
  executiveProfileRole?: string;
  isDark?: boolean;
  onFeedbackSaved?: (feedback: RlhfFeedbackItem) => void;
}

const ERROR_CATEGORIES: Array<{
  key: RAGErrorCategory;
  label: string;
  desc: string;
}> = [
  {
    key: 'wrong_legal_citation',
    label: 'Trích dẫn sai Điều khoản / Số hiệu văn bản',
    desc: 'AI trích dẫn nhầm số hiệu Luật, Nghị định hoặc sai nội dung Điều khoản'
  },
  {
    key: 'outdated_law',
    label: 'Áp dụng văn bản cũ / đã hết hiệu lực',
    desc: 'Văn bản đã bị sửa đổi, bổ sung hoặc bãi bỏ bởi văn bản mới hơn'
  },
  {
    key: 'wrong_macro_data',
    label: 'Sai số liệu kinh tế vĩ mô / thị trường',
    desc: 'Số liệu thu chi ngân sách, CPI, GDP, VN-Index, tỷ giá hoặc lãi suất chưa chuẩn xác'
  },
  {
    key: 'improper_official_tone',
    label: 'Chưa chuẩn thể thức văn bản hành chính',
    desc: 'Ngôn từ chưa bám sát quy chuẩn công vụ, thiếu thẩm quyền phân định'
  },
  {
    key: 'missing_context',
    label: 'Thiếu bối cảnh thực tiễn điều hành',
    desc: 'Chưa bám sát chỉ đạo mới nhất của Lãnh đạo BTC'
  },
  {
    key: 'hallucination',
    label: 'AI tự suy đoán không có căn cứ',
    desc: 'Tự sinh thông tin không có trong kho dữ liệu pháp quy và báo chí'
  },
  {
    key: 'other',
    label: 'Lý do khác',
    desc: 'Góp ý hoặc hiệu chỉnh bổ sung khác'
  }
];

export const RlhfFeedbackModal: React.FC<RlhfFeedbackModalProps> = ({
  isOpen,
  onClose,
  messageId,
  userPrompt,
  assistantResponse,
  initialRating = 'negative',
  sessionId,
  sessionTitle,
  ragLegalCitations = [],
  executiveProfileRole,
  isDark = false,
  onFeedbackSaved
}) => {
  const [rating, setRating] = useState<FeedbackRating>(initialRating);
  const [errorCategory, setErrorCategory] = useState<RAGErrorCategory>('wrong_legal_citation');
  const [userCorrectionText, setUserCorrectionText] = useState<string>('');
  const [suggestedLawCodesInput, setSuggestedLawCodesInput] = useState<string>('');
  const [suggestedKeywordsInput, setSuggestedKeywordsInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setRating(initialRating);
      setIsSuccess(false);
      setIsSubmitting(false);
      setErrorCategory('wrong_legal_citation');
      setUserCorrectionText('');
      setSuggestedLawCodesInput('');
      setSuggestedKeywordsInput('');
    }
  }, [isOpen, initialRating]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const suggestedLawCodes = suggestedLawCodesInput
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const suggestedKeywords = suggestedKeywordsInput
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const feedbackRecord: RlhfFeedbackItem = {
      id: `rlhf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      messageId,
      sessionId,
      sessionTitle,
      userPrompt,
      assistantResponse,
      rating,
      errorCategory: rating === 'negative' ? errorCategory : undefined,
      userCorrectionText: userCorrectionText.trim(),
      suggestedLawCodes,
      suggestedKeywords,
      ragLegalCitations,
      executiveProfileRole,
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleString('vi-VN'),
      status: 'PENDING_REVIEW'
    };

    try {
      await saveFeedbackRecord(feedbackRecord);
      setIsSuccess(true);
      if (onFeedbackSaved) {
        onFeedbackSaved(feedbackRecord);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-rlhf-feedback-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="modal-rlhf-feedback-card"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden transition-all ${
          isDark
            ? 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-slate-950/60'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between gap-3 ${
          isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs border ${
              rating === 'positive'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
            }`}>
              {rating === 'positive' ? <ThumbsUp className="w-5 h-5" /> : <ThumbsDown className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {rating === 'positive'
                    ? 'Đánh giá Câu trả lời Hữu ích (RLHF)'
                    : 'Góp ý & Tinh chỉnh Câu trả lời AI'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                  RLHF Loop
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dữ liệu này sẽ trực tiếp tối ưu hóa trọng số Semantic Re-ranking và kho từ điển pháp quy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* User Prompt & Truncated AI Response Context */}
          <div className={`p-3 rounded-xl border space-y-2 ${
            isDark ? 'bg-slate-800/40 border-slate-700/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700 dark:text-slate-300">
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
              <span>Câu hỏi của bạn:</span>
            </div>
            <p className="text-xs italic text-slate-600 dark:text-slate-300 line-clamp-2 pl-2 border-l-2 border-blue-500">
              "{userPrompt}"
            </p>
          </div>

          {/* Rating Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Chất Lượng Câu Trả Lời:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRating('positive')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition cursor-pointer ${
                  rating === 'positive'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>👍 Chuẩn xác & Hữu ích</span>
              </button>

              <button
                type="button"
                onClick={() => setRating('negative')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition cursor-pointer ${
                  rating === 'negative'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                <span>👎 Cần cải thiện / Chưa chuẩn</span>
              </button>
            </div>
          </div>

          {/* Conditional Error Category Selection (When Negative) */}
          {rating === 'negative' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Chọn Phân Loại Điểm Chưa Chuẩn:</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                  * Giúp RAG Engine gắn nhãn học tăng cường
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ERROR_CATEGORIES.map(cat => (
                  <div
                    key={cat.key}
                    onClick={() => setErrorCategory(cat.key)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer text-left ${
                      errorCategory === cat.key
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-500'
                        : isDark
                        ? 'bg-slate-800/30 border-slate-700/60 hover:border-slate-600'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${errorCategory === cat.key ? 'bg-amber-500' : 'bg-slate-400'}`} />
                      <span>{cat.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-3.5 leading-snug">
                      {cat.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Law Code & Keyword Suggestions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>Văn bản pháp quy đúng nên áp dụng:</span>
              </label>
              <input
                type="text"
                value={suggestedLawCodesInput}
                onChange={(e) => setSuggestedLawCodesInput(e.target.value)}
                placeholder="Ví dụ: Luật 38/2019, Nghị định 123/2020..."
                className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-hidden focus:ring-2 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white focus:ring-indigo-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:ring-indigo-500'
                }`}
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Phân tách bằng dấu phẩy để hệ thống tăng trọng số re-ranking
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                <span>Thuật ngữ / Từ khóa chuyên ngành bổ sung:</span>
              </label>
              <input
                type="text"
                value={suggestedKeywordsInput}
                onChange={(e) => setSuggestedKeywordsInput(e.target.value)}
                placeholder="Ví dụ: hoàn thuế trước kiểm tra sau, C/O Form D..."
                className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-hidden focus:ring-2 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white focus:ring-cyan-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:ring-cyan-500'
                }`}
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Bổ sung vào Thesaurus mở rộng ngữ nghĩa
              </span>
            </div>
          </div>

          {/* User Ground Truth / Expected Correction Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                <span>Nội dung hiệu chỉnh / Câu trả lời chuẩn mong muốn (Ground Truth):</span>
              </span>
              <span className="text-[10.5px] font-normal text-slate-500">Tùy chọn</span>
            </label>
            <textarea
              rows={3}
              value={userCorrectionText}
              onChange={(e) => setUserCorrectionText(e.target.value)}
              placeholder="Nhập hướng dẫn xử lý chuẩn, trích dẫn quy định thực tế hoặc nội dung bạn mong muốn AI phản hồi..."
              className={`w-full p-3 rounded-xl text-xs border resize-none focus:outline-hidden focus:ring-2 ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500'
                  : 'bg-white border-slate-300 text-slate-900 focus:ring-emerald-500'
              }`}
            />
          </div>

          {/* Success Banner */}
          {isSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-xs font-bold">
                Đã lưu đánh giá vào Cloud Firestore và cập nhật trọng số Semantic Re-ranking thành công!
              </div>
            </div>
          )}

          {/* Footer Submit Actions */}
          <div className={`pt-3 border-t flex items-center justify-between gap-3 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm cursor-pointer ${
                rating === 'positive'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800'
                  : 'bg-gradient-to-r from-amber-600 to-red-700 hover:from-amber-700 hover:to-red-800'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Đang lưu đánh giá...' : 'Lưu Đánh Giá & Cập Nhật RAG'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
