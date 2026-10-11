import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  X,
  ExternalLink,
  FileEdit,
  Mail,
  Search,
  CheckSquare,
  Square,
  Clock,
  Building2,
  Zap,
  TrendingUp,
  Share2,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { ScrapedNewsItem, formatNewsFullDateTime } from '../types';
import { decodeHtmlEntities } from '../lib/htmlDecoder';
import { evaluateAndTagSopLevel4 } from '../lib/sentimentCalculator';
import { isBrightSpotArticle } from '../lib/newsClassification';
import { isTrulyPositiveArticle } from '../lib/policyFrictionEngine';

export type ExecutiveKpiModalMode = 'URGENT_CRISIS' | 'POSITIVE_BRIGHT';

interface ExecutiveKpiDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ExecutiveKpiModalMode;
  articles: ScrapedNewsItem[];
  sessionHandledArticleIds: Set<string>;
  onToggleHandledArticle: (articleId: string) => void;
  onDraftStatement?: (article: ScrapedNewsItem) => void;
  onOpenGmailAlert?: (article: ScrapedNewsItem) => void;
  onOpenDeepDive?: (article: ScrapedNewsItem) => void;
  isDark?: boolean;
}

export const ExecutiveKpiDetailModal: React.FC<ExecutiveKpiDetailModalProps> = ({
  isOpen,
  onClose,
  mode,
  articles,
  sessionHandledArticleIds,
  onToggleHandledArticle,
  onDraftStatement,
  onOpenGmailAlert,
  onOpenDeepDive,
  isDark = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'active' | 'handled'>('active');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Phân loại bài viết khẩn cấp SOP Cấp 4
  const sopEmergencyArticles = useMemo(() => {
    return articles.filter((item) => {
      const evaluation = evaluateAndTagSopLevel4(item);
      return evaluation.isSopLevel4;
    });
  }, [articles]);

  // 2. Phân loại bài viết tích cực khởi sắc (Đồng bộ chuẩn 100% với thẻ KPI bên ngoài & Sắc thái dư luận)
  const positiveArticles = useMemo(() => {
    return articles.filter((item) => isTrulyPositiveArticle(item));
  }, [articles]);

  const targetArticles = mode === 'URGENT_CRISIS' ? sopEmergencyArticles : positiveArticles;

  // Tách nhóm chưa xử lý và đã xử lý
  const activeList = useMemo(() => {
    return targetArticles.filter((item) => !sessionHandledArticleIds.has(item.id));
  }, [targetArticles, sessionHandledArticleIds]);

  const handledList = useMemo(() => {
    return targetArticles.filter((item) => sessionHandledArticleIds.has(item.id));
  }, [targetArticles, sessionHandledArticleIds]);

  const currentDisplayList = useMemo(() => {
    const list = activeTab === 'active' ? activeList : handledList;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((item) => {
      const title = (item.title || '').toLowerCase();
      const summary = (item.summary || item.snippet || '').toLowerCase();
      const source = (item.source || '').toLowerCase();
      return title.includes(q) || summary.includes(q) || source.includes(q);
    });
  }, [activeTab, activeList, handledList, searchQuery]);

  if (!isOpen) return null;

  const isUrgentMode = mode === 'URGENT_CRISIS';

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-2 sm:p-4 bg-black/85 z-[100] backdrop-blur-md animate-fadeIn ${
      isFullscreen ? 'p-0' : ''
    }`}>
      <div
        className={`relative flex flex-col shadow-2xl border-2 border-slate-700 bg-slate-950 text-white overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? 'fixed inset-0 w-full h-full max-w-none max-h-none rounded-none border-0 shadow-none z-[100]'
            : 'w-full max-w-6xl max-h-[94vh] rounded-2xl'
        }`}
      >
        {/* MODAL HEADER */}
        <div
          className="px-6 py-4 border-b-2 border-slate-800 bg-slate-900 flex items-center justify-between gap-3 select-none"
          onDoubleClick={() => setIsFullscreen(!isFullscreen)}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black bg-white text-black border-2 border-slate-200 shadow-xs"
            >
              {isUrgentMode ? <AlertOctagon className="w-6 h-6 text-black" /> : <Sparkles className="w-6 h-6 text-black" />}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-wide uppercase text-white">
                  {isUrgentMode ? 'SỰ VIỆC KHẨN CẤP (SOP CẤP 4)' : 'TIN TỨC KHỞI SẮC (POSITIVE / BRIGHT)'}
                </h2>
                <span
                  className="text-xs font-black px-2.5 py-0.5 rounded border border-white bg-white text-black uppercase"
                >
                  {isUrgentMode
                    ? activeList.length > 0
                      ? `${activeList.length} SỰ VIỆC KHẨN`
                      : 'AN TOÀN (0 TIN VI PHẠM SOP)'
                    : `${activeList.length} TIN TÍCH CỰC`}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isUrgentMode
                  ? 'Theo dõi & xử lý các tin vi phạm quy chuẩn SOP Cấp 4: Khẩn cấp theo đúng quy chế điều hành'
                  : 'Tổng hợp dòng chảy tin tức tích cực, tăng trưởng thu NSNN, nâng hạng TTCK và giải ngân vốn'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
              title={isFullscreen ? 'Thu nhỏ về kích thước chuẩn' : 'Mở rộng toàn bộ màn hình (Full Screen)'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold hidden sm:inline text-amber-400">Thu nhỏ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span className="text-xs font-bold hidden sm:inline">Toàn màn hình</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTROLS & TABS */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'active'
                  ? isUrgentMode
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <span>{isUrgentMode ? 'Cần can thiệp khẩn' : 'Tin khởi sắc'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
                {activeList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('handled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'handled'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã xử lý (Ẩn khỏi phiên quét)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/20 font-mono">
                {handledList.length}
              </span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, nguồn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* ARTICLES LIST */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {currentDisplayList.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              {isUrgentMode ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      {activeTab === 'active'
                        ? 'TRẠNG THÁI AN TOÀN: 0 SỰ VIỆC KHẨN CẤP'
                        : 'CHƯA CÓ TIN NÀO ĐƯỢC ĐÁNH DẤU ĐÃ XỬ LÝ'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                      {activeTab === 'active'
                        ? 'Không phát hiện bài báo nào vi phạm khung quy định SOP Cấp 4 (Khẩn cấp / Tiêu cực đặc biệt nghiêm trọng) trong đợt quét này. Dòng thông tin đang nằm trong tầm kiểm soát.'
                        : 'Các sự việc sau khi tích chọn "Đã xử lý" sẽ được lưu tại đây trong phiên quét.'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Không tìm thấy bài viết tích cực phù hợp
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Thử điều chỉnh từ khóa tìm kiếm hoặc kiểm tra tab khác.
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            currentDisplayList.map((article) => {
              const isHandled = sessionHandledArticleIds.has(article.id);
              const cleanTitle = decodeHtmlEntities(article.title);
              const sopEval = isUrgentMode ? evaluateAndTagSopLevel4(article) : null;
              const sentimentScore = article.sentimentScore ?? 0;

              return (
                <div
                  key={article.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 shadow-xs ${
                    isHandled
                      ? 'opacity-65 border-slate-300 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40'
                      : isUrgentMode
                      ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                      : 'border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                  }`}
                >
                  {/* Article Header & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {article.source}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatNewsFullDateTime(article)}
                      </span>

                      {/* Mode-specific Badge */}
                      {isUrgentMode ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-black bg-rose-600 text-white flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3" />
                          SOP CẤP 4: KHẨN CẤP
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-black bg-emerald-600 text-white flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          +{sentimentScore}% TÍCH CỰC
                        </span>
                      )}

                      {sopEval?.reason && (
                        <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                          {sopEval.reason}
                        </span>
                      )}
                    </div>

                    {/* Checkbox "Đã xử lý (Xóa khỏi phiên quét)" */}
                    <button
                      type="button"
                      onClick={() => onToggleHandledArticle(article.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                        isHandled
                          ? 'bg-slate-800 text-white border-slate-700 dark:bg-slate-200 dark:text-slate-900'
                          : isUrgentMode
                          ? 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                          : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                      }`}
                      title={isHandled ? 'Khôi phục lại bài viết vào phiên quét' : 'Đánh dấu đã xử lý và ẩn khỏi phiên quét'}
                    >
                      {isHandled ? (
                        <>
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Đã xử lý (Ẩn)</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5 text-slate-400" />
                          <span>Đã xử lý (Xóa tin)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {cleanTitle}
                    </h4>
                    {article.summary && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {decodeHtmlEntities(article.summary)}
                      </p>
                    )}
                  </div>

                  {/* ACTION BUTTONS ROW */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {article.url && (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Xem bài gốc</span>
                        </a>
                      )}

                      {onOpenDeepDive && (
                        <button
                          type="button"
                          onClick={() => onOpenDeepDive(article)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Phân tích AI</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isUrgentMode ? (
                        <>
                          {onDraftStatement && (
                            <button
                              type="button"
                              onClick={() => onDraftStatement(article)}
                              className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <FileEdit className="w-3 h-3" />
                              <span>Soạn thông cáo báo chí</span>
                            </button>
                          )}

                          {onOpenGmailAlert && (
                            <button
                              type="button"
                              onClick={() => onOpenGmailAlert(article)}
                              className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 transition flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Gửi cảnh báo Gmail</span>
                            </button>
                          )}
                        </>
                      ) : (
                        onDraftStatement && (
                          <button
                            type="button"
                            onClick={() => onDraftStatement(article)}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>Soạn tin truyền thông lan tỏa</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-1.5 font-medium">
            <span>Phiên quét thời gian thực:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
              {currentDisplayList.length} / {targetArticles.length} bài
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
