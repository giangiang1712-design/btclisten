import React, { useState, useEffect } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  X,
  Database,
  Download,
  Trash2,
  Filter,
  Search,
  Sparkles,
  Scale,
  Brain,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCode,
  Tag,
  ArrowRight
} from 'lucide-react';
import {
  RlhfFeedbackItem,
  RAGErrorCategory,
  fetchAllFeedbacks,
  deleteFeedbackRecord,
  calculateFeedbackStatistics,
  downloadRlhfJsonlDataset,
  subscribeToCloudFeedbacks
} from '../lib/rlhfFeedbackService';
import { isCloudDatabaseActive } from '../lib/firebase';

interface RlhfFeedbackCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const RlhfFeedbackCenterModal: React.FC<RlhfFeedbackCenterModalProps> = ({
  isOpen,
  onClose,
  isDark = false
}) => {
  const [feedbacks, setFeedbacks] = useState<RlhfFeedbackItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterRating, setFilterRating] = useState<'all' | 'positive' | 'negative'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFeedback, setSelectedFeedback] = useState<RlhfFeedbackItem | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    // Subscribe to cloud updates or load initial
    const unsubscribe = subscribeToCloudFeedbacks((list) => {
      setFeedbacks(list);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const stats = calculateFeedbackStatistics(feedbacks);

  const filteredFeedbacks = feedbacks.filter(f => {
    if (filterRating !== 'all' && f.rating !== filterRating) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const promptMatch = f.userPrompt.toLowerCase().includes(q);
      const correctionMatch = (f.userCorrectionText || '').toLowerCase().includes(q);
      const lawMatch = (f.suggestedLawCodes || []).some(l => l.toLowerCase().includes(q));
      return promptMatch || correctionMatch || lawMatch;
    }
    return true;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi đánh giá này khỏi hệ thống?')) {
      await deleteFeedbackRecord(id);
      setFeedbacks(prev => prev.filter(f => f.id !== id));
      if (selectedFeedback?.id === id) {
        setSelectedFeedback(null);
      }
    }
  };

  const handleExport = () => {
    downloadRlhfJsonlDataset(feedbacks);
  };

  return (
    <div
      id="modal-rlhf-center-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="modal-rlhf-center-card"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-5xl rounded-2xl shadow-2xl border flex flex-col h-[90vh] overflow-hidden transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-slate-950/60'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        {/* Modal Header */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Trung Tâm Phản Hồi RLHF & Tinh Chỉnh RAG
                </h3>
                <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                  {isCloudDatabaseActive() ? 'Cloud Firestore Sync' : 'Local Persistence'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thu thập đánh giá câu trả lời của Trợ lý AI và tự động tinh chỉnh trọng số Semantic Re-ranking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
              title="Xuất toàn bộ dataset định dạng JSONL chuẩn fine-tune LLM"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Dataset (JSONL)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top KPIs Summary Bar */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 border-b shrink-0 ${
          isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-100/60 border-slate-200'
        }`}>
          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
          }`}>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Tổng Đánh Giá</div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.totalCount}</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Database className="w-4 h-4" />
            </div>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
          }`}>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Tỷ Lệ Hài Lòng</div>
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.satisfactionRate}%</div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ThumbsUp className="w-4 h-4" />
            </div>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
          }`}>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Lượt 👍 Hài Lòng</div>
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.positiveCount}</div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
          }`}>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Lượt 👎 Cần Cải Thiện</div>
              <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{stats.negativeCount}</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <ThumbsDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className={`p-3 border-b flex flex-wrap items-center justify-between gap-2.5 shrink-0 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterRating('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterRating === 'all'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Tất cả ({stats.totalCount})
            </button>
            <button
              onClick={() => setFilterRating('positive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                filterRating === 'positive'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <ThumbsUp className="w-3 h-3" />
              <span>Hài lòng ({stats.positiveCount})</span>
            </button>
            <button
              onClick={() => setFilterRating('negative')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                filterRating === 'negative'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <ThumbsDown className="w-3 h-3" />
              <span>Góp ý ({stats.negativeCount})</span>
            </button>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm câu hỏi, luật, từ khóa..."
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-hidden focus:ring-1 focus:ring-indigo-500 ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>
        </div>

        {/* Master-Detail Content Body */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* List View */}
          <div className={`w-full md:w-5/12 border-r overflow-y-auto p-3 space-y-2.5 ${
            isDark ? 'border-slate-800 bg-slate-950/20' : 'border-slate-200 bg-slate-50/50'
          }`}>
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
                Đang tải dữ liệu phản hồi từ Cloud Firestore...
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Chưa có bản ghi đánh giá nào phù hợp với bộ lọc.
              </div>
            ) : (
              filteredFeedbacks.map((fb) => (
                <div
                  key={fb.id}
                  onClick={() => setSelectedFeedback(fb)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    selectedFeedback?.id === fb.id
                      ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-500 shadow-xs'
                      : isDark
                      ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      fb.rating === 'positive'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {fb.rating === 'positive' ? <ThumbsUp className="w-2.5 h-2.5" /> : <ThumbsDown className="w-2.5 h-2.5" />}
                      <span>{fb.rating === 'positive' ? 'Hài lòng' : 'Cần sửa đổi'}</span>
                    </span>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {fb.dateFormatted || new Date(fb.timestamp).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 mb-1">
                    "{fb.userPrompt}"
                  </p>

                  {fb.userCorrectionText && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 line-clamp-2 italic bg-emerald-500/5 p-1.5 rounded-lg">
                      Sửa: {fb.userCorrectionText}
                    </p>
                  )}

                  {fb.suggestedLawCodes && fb.suggestedLawCodes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {fb.suggestedLawCodes.slice(0, 3).map((code, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[9.5px] font-mono font-semibold"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Detailed View */}
          <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
            {selectedFeedback ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Chi Tiết Bản Ghi</span>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {selectedFeedback.sessionTitle || 'Phiên Tư Vấn FinPulse AI'}
                    </h4>
                  </div>
                  <button
                    onClick={(e) => handleDelete(selectedFeedback.id, e)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 border border-red-500/20 text-xs flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                </div>

                {/* User Prompt */}
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Câu hỏi của người dùng:</div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedFeedback.userPrompt}
                  </div>
                </div>

                {/* AI Assistant Output */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Câu trả lời AI lúc đó:</div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed font-mono">
                    {selectedFeedback.assistantResponse}
                  </div>
                </div>

                {/* Ground Truth & User Correction */}
                {selectedFeedback.userCorrectionText && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200">
                    <div className="text-[11px] font-bold flex items-center gap-1 text-emerald-700 dark:text-emerald-400 mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Câu trả lời chuẩn mong muốn (Ground Truth / Hiệu chỉnh):</span>
                    </div>
                    <div className="text-xs leading-relaxed font-medium">
                      {selectedFeedback.userCorrectionText}
                    </div>
                  </div>
                )}

                {/* Law & Keyword Enhancements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20">
                    <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 mb-1 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5" />
                      <span>Văn bản pháp quy được gợi ý:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(selectedFeedback.suggestedLawCodes || []).length > 0 ? (
                        selectedFeedback.suggestedLawCodes?.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-mono font-bold">
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Không có đề xuất riêng</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/20">
                    <div className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300 mb-1 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Từ khóa chuyên môn gắn thêm:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(selectedFeedback.suggestedKeywords || []).length > 0 ? (
                        selectedFeedback.suggestedKeywords?.map((k, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-lg bg-cyan-600 text-white text-xs font-medium">
                            {k}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Không có từ khóa thêm</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <Brain className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                <h5 className="font-bold text-slate-600 dark:text-slate-300 text-sm">Chọn một bản ghi để xem chi tiết</h5>
                <p className="text-xs max-w-xs mt-1">
                  Xem đối sánh câu hỏi của người dùng, phản hồi của AI và nội dung hiệu chỉnh chuẩn (Ground Truth).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
