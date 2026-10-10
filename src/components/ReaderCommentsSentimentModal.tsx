import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  X,
  Users,
  Flame,
  Scale,
  Sparkles,
  Filter,
} from 'lucide-react';
import { ScrapedNewsItem, ReaderComment, PublicReactionAnalysis } from '../types';

interface ReaderCommentsSentimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: ScrapedNewsItem | null;
  onOpenViolationDossier?: (article: ScrapedNewsItem) => void;
  isDark?: boolean;
}

export const ReaderCommentsSentimentModal: React.FC<ReaderCommentsSentimentModalProps> = ({
  isOpen,
  onClose,
  article,
  onOpenViolationDossier,
  isDark = true,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [publicReaction, setPublicReaction] = useState<PublicReactionAnalysis | null>(null);
  const [comments, setComments] = useState<ReaderComment[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'positive' | 'negative' | 'skeptical' | 'top_likes'>('all');

  useEffect(() => {
    if (isOpen && article) {
      if (article.publicReaction && article.readerComments && article.readerComments.length > 0) {
        setPublicReaction(article.publicReaction);
        setComments(article.readerComments);
      } else {
        fetchComments();
      }
    }
  }, [isOpen, article]);

  const fetchComments = async () => {
    if (!article) return;
    setLoading(true);
    try {
      const resp = await fetch('/api/articles/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: article.url,
          title: article.title,
          source: article.source,
          summary: article.summary,
          sentimentScore: article.sentimentScore,
          sector: article.sectorNameVi || article.sector,
        }),
      });

      if (resp.ok) {
        const json = await resp.json();
        if (json.publicReaction) {
          setPublicReaction(json.publicReaction);
          setComments(json.readerComments || json.publicReaction.representativeComments || []);
        }
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !article) return null;

  const mediaScore = article.sentimentScore ?? 0;
  const publicScore = publicReaction?.publicSentimentScore ?? 0;
  const gap = mediaScore - publicScore;
  const isCriticalGap = publicReaction?.divergenceLevel === 'CRITICAL_DISCONNECT' || Math.abs(gap) >= 40;
  const isMildGap = publicReaction?.divergenceLevel === 'MILD_DIVERGENCE' || Math.abs(gap) >= 20;

  const filteredComments = comments.filter((c) => {
    if (filterType === 'all') return true;
    if (filterType === 'positive') return c.sentiment === 'positive';
    if (filterType === 'negative') return c.sentiment === 'negative';
    if (filterType === 'skeptical') return c.sentiment === 'skeptical';
    if (filterType === 'top_likes') return c.likes >= 40;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-xs">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-sky-400">
                  Khai Thác Luồng Bình Luận Độc Giả Thực Tế
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30 font-bold">
                  {article.source}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Trích xuất bình luận từ báo điện tử lớn & đo lường sắc thái dư luận công chúng thật (Citizen Sentiment)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchComments}
              disabled={loading}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'
              }`}
              title="Quét lại bình luận mới nhất"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-black'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Target Article Reference Banner */}
        <div className={`px-6 py-3 border-b text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <div className="flex-1 line-clamp-1">
            <span className="text-slate-400 mr-1.5 font-bold">Bài báo đang khảo sát:</span>
            <strong className="text-slate-100">{article.title}</strong>
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:underline flex items-center gap-1 shrink-0 font-bold"
          >
            <span>Mở trang báo gốc</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-300">
                Đang kết nối API trích xuất luồng bình luận độc giả từ {article.source}...
              </p>
              <p className="text-xs text-slate-500">
                Hệ thống đang tiến hành bóc tách thực thể cảm xúc và tính toán điểm lệch pha dư luận
              </p>
            </div>
          ) : (
            <>
              {/* DUAL SENTIMENT COMPARISON: MEDIA VS PUBLIC CITIZEN */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Media Sentiment */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-400">Sắc Thái Báo Chí (Media Tone)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 font-mono text-slate-300">Nhà báo</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-black font-mono ${
                      mediaScore > 10 ? 'text-emerald-400' : mediaScore < -10 ? 'text-rose-400' : 'text-slate-300'
                    }`}>
                      {mediaScore > 0 ? `+${mediaScore}` : mediaScore}
                    </span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {mediaScore > 20 ? 'Báo chí ghi nhận tích cực' : mediaScore < -20 ? 'Báo chí phản ánh rủi ro/bất cập' : 'Báo chí truyền tải trung lập'}
                  </p>
                </div>

                {/* 2. Real Public Reader Sentiment */}
                <div className={`p-4 rounded-xl border ${
                  publicScore < -10
                    ? isDark ? 'bg-rose-950/20 border-rose-800/50' : 'bg-rose-50 border-rose-200'
                    : isDark ? 'bg-emerald-950/20 border-emerald-800/50' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-sky-400">Dư Luận Độc Giả Thực Tế</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 font-bold text-sky-300 font-mono">
                      {publicReaction?.totalCommentsAnalyzed || comments.length} bình luận
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-black font-mono ${
                      publicScore > 10 ? 'text-emerald-400' : publicScore < -10 ? 'text-rose-400' : 'text-slate-300'
                    }`}>
                      {publicScore > 0 ? `+${publicScore}` : publicScore}
                    </span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    {publicScore < -15
                      ? 'Nhiều độc giả bày tỏ bất bình / lo ngại'
                      : publicScore > 25
                      ? 'Đa số độc giả đồng tình / ủng hộ'
                      : 'Ý kiến đa chiều, còn nhiều hoài nghi'}
                  </p>
                </div>

                {/* 3. Divergence / Consensus Gap */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                  isCriticalGap
                    ? isDark ? 'bg-rose-950/40 border-rose-500/50 text-rose-200' : 'bg-rose-100 border-rose-400 text-rose-900'
                    : isMildGap
                    ? isDark ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'
                    : isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase tracking-wider">Độ Lệch Pha Dư Luận</span>
                      {isCriticalGap ? (
                        <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                      ) : (
                        <Scale className="w-4 h-4 text-sky-400" />
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black font-mono">
                        {Math.abs(gap)} điểm
                      </span>
                      <span className="text-xs opacity-80">chênh lệch</span>
                    </div>
                  </div>
                  <div className="text-[11px] font-bold mt-1">
                    {isCriticalGap
                      ? '🚨 Cảnh báo phân kỳ: Dư luận phản ứng ngược chiều với bài viết!'
                      : isMildGap
                      ? '⚠️ Có sự chênh lệch nhẹ giữa báo chí và độc giả'
                      : '✅ Báo chí và độc giả có mức độ đồng thuận cao'}
                  </div>
                </div>
              </div>

              {/* Public Sentiment Breakdown Bar */}
              {publicReaction && (
                <div className={`p-4 rounded-xl border space-y-2.5 ${isDark ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">Tỷ lệ phân bổ sắc thái bình luận công chúng:</span>
                    <span className="text-slate-400 font-mono">Tổng 100%</span>
                  </div>

                  {/* Multi-colored ratio bar */}
                  <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-800">
                    <div
                      style={{ width: `${publicReaction.positiveRatio}%` }}
                      className="bg-emerald-500 transition-all duration-500"
                      title={`Đồng tình / Tán thành: ${publicReaction.positiveRatio}%`}
                    />
                    <div
                      style={{ width: `${publicReaction.skepticalRatio}%` }}
                      className="bg-amber-500 transition-all duration-500"
                      title={`Băn khoăn / Hoài nghi: ${publicReaction.skepticalRatio}%`}
                    />
                    <div
                      style={{ width: `${publicReaction.negativeRatio}%` }}
                      className="bg-rose-500 transition-all duration-500"
                      title={`Phản đối / Bức xúc: ${publicReaction.negativeRatio}%`}
                    />
                    <div
                      style={{ width: `${publicReaction.neutralRatio}%` }}
                      className="bg-slate-500 transition-all duration-500"
                      title={`Trung tính: ${publicReaction.neutralRatio}%`}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-slate-300">Đồng tình: <strong>{publicReaction.positiveRatio}%</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-slate-300">Hoài nghi: <strong>{publicReaction.skepticalRatio}%</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="text-slate-300">Phản đối: <strong>{publicReaction.negativeRatio}%</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
                      <span className="text-slate-300">Trung lập: <strong>{publicReaction.neutralRatio}%</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Reader Concerns & Summary */}
              {publicReaction && (
                <div className={`p-4 rounded-xl border space-y-2 ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className="text-xs font-black uppercase tracking-wide text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Vấn Đề Độc Giả Tranh Luận & Băn Khoăn Lớn Nhất
                  </h4>
                  <p className="text-xs text-slate-300 italic">
                    "{publicReaction.publicReactionSummary}"
                  </p>
                  <ul className="space-y-1.5 pt-1">
                    {publicReaction.topConcerns.map((concern, idx) => (
                      <li key={idx} className="text-xs flex items-start gap-2 text-slate-200">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* COMMENTS STREAM SECTION */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-400" />
                    <h3 className="text-sm font-bold text-slate-200">
                      Danh Sách Bình Luận Độc Giả Thực Tế ({filteredComments.length})
                    </h3>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setFilterType('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        filterType === 'all'
                          ? 'bg-sky-600 text-white'
                          : isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setFilterType('positive')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        filterType === 'positive'
                          ? 'bg-emerald-600 text-white'
                          : isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Ủng hộ
                    </button>
                    <button
                      onClick={() => setFilterType('skeptical')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        filterType === 'skeptical'
                          ? 'bg-amber-600 text-white'
                          : isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Hoài nghi
                    </button>
                    <button
                      onClick={() => setFilterType('negative')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        filterType === 'negative'
                          ? 'bg-rose-600 text-white'
                          : isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Phản đối
                    </button>
                    <button
                      onClick={() => setFilterType('top_likes')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        filterType === 'top_likes'
                          ? 'bg-purple-600 text-white'
                          : isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Nhiều lượt thích 👍
                    </button>
                  </div>
                </div>

                {/* Comment Cards */}
                <div className="space-y-2.5">
                  {filteredComments.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      Không có bình luận nào thuộc nhóm này.
                    </div>
                  ) : (
                    filteredComments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          comment.sentiment === 'negative'
                            ? isDark ? 'bg-rose-950/15 border-rose-900/30' : 'bg-rose-50/50 border-rose-200'
                            : comment.sentiment === 'positive'
                            ? isDark ? 'bg-emerald-950/15 border-emerald-900/30' : 'bg-emerald-50/50 border-emerald-200'
                            : isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-100 font-bold">{comment.author}</strong>
                            <span className="text-[10px] text-slate-500 font-mono">• {comment.timestamp}</span>
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                              {comment.sourceOutlet}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {comment.sentiment === 'positive' && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Tán thành
                              </span>
                            )}
                            {comment.sentiment === 'negative' && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Phản đối
                              </span>
                            )}
                            {comment.sentiment === 'skeptical' && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center gap-1">
                                <HelpCircle className="w-3 h-3" /> Hoài nghi
                              </span>
                            )}

                            <span className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" /> {comment.likes}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs leading-relaxed text-slate-200">
                          {comment.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`px-6 py-3.5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Dữ liệu bình luận được đối soát trực tiếp với API cổng báo chí điện tử.</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenViolationDossier && (
              <button
                onClick={() => {
                  onClose();
                  onOpenViolationDossier(article);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Lập Hồ Sơ Vi Phạm Cho Bài Này
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
