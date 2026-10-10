import React, { useState, useMemo } from 'react';
import {
  Filter,
  Sparkles,
  Search,
  Landmark,
  Users,
  AlertTriangle,
  FileEdit,
  Mail,
  Eye,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Tag,
  Copy,
  Check,
  Zap,
  Layers,
  ArrowRight,
  HelpCircle,
  Clock,
  ShieldAlert,
  Building2,
  FileText
} from 'lucide-react';
import { ScrapedNewsItem, formatNewsTimeDisplay } from '../types';
import { useTheme } from '../lib/theme';
import {
  SmartFilterCategory,
  SMART_FILTER_SUBTOPICS,
  classifyArticleSmartFilter,
  filterArticlesWithSmartEngine,
  ArticleSmartFilterAnalysis
} from '../lib/sentimentSmartFilter';
import { SourceBrandBadge } from './SourceBrandBadge';
import { SentimentScoreBreakdownModal } from './SentimentScoreBreakdownModal';

interface SentimentSmartFilterSectionProps {
  newsItems: ScrapedNewsItem[];
  onDraftStatement?: (article: ScrapedNewsItem) => void;
  onOpenGmailAlertModal?: (article?: ScrapedNewsItem) => void;
  onDeepDive?: (article: ScrapedNewsItem) => void;
  initialCategory?: SmartFilterCategory;
}

export const SentimentSmartFilterSection: React.FC<SentimentSmartFilterSectionProps> = ({
  newsItems,
  onDraftStatement,
  onOpenGmailAlertModal,
  onDeepDive,
  initialCategory = 'all'
}) => {
  const { isDark } = useTheme();

  // Active filter states
  const [selectedCategory, setSelectedCategory] = useState<SmartFilterCategory>(initialCategory);
  const [selectedSubTopic, setSelectedSubTopic] = useState<string>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Selected article for Sentiment Breakdown modal
  const [breakdownArticle, setBreakdownArticle] = useState<ScrapedNewsItem | null>(null);

  // Apply Smart Filtering
  const { filteredArticles, stats } = useMemo(() => {
    return filterArticlesWithSmartEngine(newsItems, {
      category: selectedCategory,
      subTopicId: selectedSubTopic,
      sentimentFilter: selectedSentiment,
      searchTerm: searchKeyword
    });
  }, [newsItems, selectedCategory, selectedSubTopic, selectedSentiment, searchKeyword]);

  // Subtopics available under the active category
  const relevantSubTopics = useMemo(() => {
    if (selectedCategory === 'all') return SMART_FILTER_SUBTOPICS;
    if (selectedCategory === 'policy') {
      return SMART_FILTER_SUBTOPICS.filter((s) => s.category === 'policy');
    }
    if (selectedCategory === 'public_enterprise') {
      return SMART_FILTER_SUBTOPICS.filter((s) => s.category === 'public_enterprise');
    }
    return SMART_FILTER_SUBTOPICS;
  }, [selectedCategory]);

  // Copy Smart Filter Briefing Report
  const handleCopySmartReport = () => {
    const categoryName =
      selectedCategory === 'policy'
        ? 'CHÍNH SÁCH & THỂ CHẾ BỘ TÀI CHÍNH'
        : selectedCategory === 'public_enterprise'
        ? 'NGƯỜI DÂN & DOANH NGHIỆP QUAN TÂM'
        : selectedCategory === 'urgent_cross'
        ? 'TRỌNG ĐIỂM CẤP BÁCH / GIAO THOA CHÍNH SÁCH - DÂN SINH'
        : 'TOÀN BỘ TIN TỨC SẮC THÁI BỘ TÀI CHÍNH';

    const topIssues = filteredArticles.slice(0, 8).map((art, idx) => {
      const analysis = classifyArticleSmartFilter(art);
      const score = art.sentimentScore !== undefined ? (art.sentimentScore > 0 ? `+${art.sentimentScore}` : art.sentimentScore) : 'N/A';
      return `${idx + 1}. [${art.sentiment?.toUpperCase()} | Điểm: ${score}] ${art.title}\n   - Nguồn: ${art.source} (${art.timeAgo || art.publishedTimeStr || 'Mới nhất'})\n   - Trọng tâm tham mưu: ${analysis.leadershipFocusReason}\n   - Link: ${art.url || 'N/A'}`;
    });

    const reportText = [
      `=== BÁO CÁO SMART FILTER TRỌNG TÂM LÃNH ĐẠO (MOF SENTIMENT INTELLIGENCE) ===`,
      `Phân loại: ${categoryName}`,
      `Thời điểm trích xuất: ${new Date().toLocaleString('vi-VN')}`,
      `Số lượng bài ghi nhận: ${filteredArticles.length} bài viết (Khớp bộ lọc)`,
      `--------------------------------------------------`,
      `DANH SÁCH CÁC VẤN ĐỀ TRỌNG ĐIỂM CẦN XỬ LÝ / THEO DÕI:`,
      ``,
      topIssues.join('\n\n'),
      ``,
      `--------------------------------------------------`,
      `Hệ thống Giám sát & Bóc tách Dư luận Báo chí Tài chính 2026.`
    ].join('\n');

    navigator.clipboard.writeText(reportText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* SMART FILTER CONTROL HUB CARD */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isDark
            ? 'bg-slate-900/90 border-indigo-500/30 shadow-lg'
            : 'bg-white border-indigo-200 shadow-sm'
        }`}
      >
        {/* Header with Title & Copy Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <Filter className="w-5 h-5 text-indigo-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  Smart Filter: Lọc Nhanh Trọng Tâm Cho Lãnh Đạo
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  AI Context Taxonomy
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Truy xuất tức thì các luồng tin theo <strong>Chính sách thể chế</strong> hoặc <strong>Vấn đề người dân/doanh nghiệp phản ánh</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopySmartReport}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border shadow-xs ${
                isCopied
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Sao chép toàn bộ danh sách bài viết theo bộ lọc thông minh"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{isCopied ? 'Đã sao chép báo cáo' : 'Xuất tóm tắt cho Lãnh đạo'}</span>
            </button>
          </div>
        </div>

        {/* Level 1: Primary Smart Category Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3.5">
          {/* Option 1: All Articles */}
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedSubTopic('all');
            }}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-500/30 font-bold'
                : isDark
                ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-500/10 text-slate-400'
                }`}
              >
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black block truncate">Toàn cảnh Luồng tin</span>
                <span className={`text-[10px] ${selectedCategory === 'all' ? 'text-indigo-100' : 'text-slate-500'}`}>
                  Mọi chủ đề phân tích
                </span>
              </div>
            </div>
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full shrink-0 ${
                selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {stats.total}
            </span>
          </button>

          {/* Option 2: Chính sách & Thể chế */}
          <button
            onClick={() => {
              setSelectedCategory('policy');
              setSelectedSubTopic('all');
            }}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              selectedCategory === 'policy'
                ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white border-blue-500 shadow-md ring-2 ring-blue-500/30 font-bold'
                : isDark
                ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-blue-500/40 hover:bg-slate-900'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  selectedCategory === 'policy' ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-400'
                }`}
              >
                <Landmark className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black block truncate">Chính sách & Thể chế</span>
                <span className={`text-[10px] ${selectedCategory === 'policy' ? 'text-blue-100' : 'text-slate-500'}`}>
                  Nghị định, Thông tư, Quy định
                </span>
              </div>
            </div>
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full shrink-0 ${
                selectedCategory === 'policy' ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {stats.policyCount}
            </span>
          </button>

          {/* Option 3: Người dân & Doanh nghiệp quan tâm */}
          <button
            onClick={() => {
              setSelectedCategory('public_enterprise');
              setSelectedSubTopic('all');
            }}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              selectedCategory === 'public_enterprise'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-500 shadow-md ring-2 ring-amber-500/30 font-bold'
                : isDark
                ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-amber-500/40 hover:bg-slate-900'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  selectedCategory === 'public_enterprise' ? 'bg-white/20 text-white' : 'bg-amber-500/10 text-amber-400'
                }`}
              >
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black block truncate">Dân & Doanh Nghiệp</span>
                <span
                  className={`text-[10px] ${
                    selectedCategory === 'public_enterprise' ? 'text-amber-100' : 'text-slate-500'
                  }`}
                >
                  Vướng mắc, Hoàn thuế, Thủ tục
                </span>
              </div>
            </div>
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full shrink-0 ${
                selectedCategory === 'public_enterprise' ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {stats.publicEnterpriseCount}
            </span>
          </button>

          {/* Option 4: Vấn đề Trọng điểm Cấp bách (Giao thoa) */}
          <button
            onClick={() => {
              setSelectedCategory('urgent_cross');
              setSelectedSubTopic('all');
            }}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              selectedCategory === 'urgent_cross'
                ? 'bg-gradient-to-r from-rose-700 to-red-800 text-white border-rose-500 shadow-md ring-2 ring-rose-500/30 font-bold'
                : isDark
                ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-rose-500/40 hover:bg-slate-900'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-rose-300 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  selectedCategory === 'urgent_cross' ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black block truncate">Trọng Điểm Cấp Bách</span>
                <span className={`text-[10px] ${selectedCategory === 'urgent_cross' ? 'text-rose-100' : 'text-slate-500'}`}>
                  Giao thoa nóng cần chỉ đạo
                </span>
              </div>
            </div>
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full shrink-0 ${
                selectedCategory === 'urgent_cross' ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {stats.urgentCrossCount}
            </span>
          </button>
        </div>

        {/* Level 2: Subtopic Chips + Live Search + Sentiment Filter */}
        <div className="mt-3.5 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
          {/* Subtopic Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 mr-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-indigo-400" />
              Chủ đề trọng điểm:
            </span>

            <button
              onClick={() => setSelectedSubTopic('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedSubTopic === 'all'
                  ? 'bg-indigo-600 text-white'
                  : isDark
                  ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả chủ đề
            </button>

            {relevantSubTopics.map((sub) => {
              const isSelected = selectedSubTopic === sub.id;
              const count = stats.subTopicCounts[sub.id] || 0;
              const isPolicySub = sub.category === 'policy';

              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubTopic(isSelected ? 'all' : sub.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? isPolicySub
                        ? 'bg-blue-600 text-white font-black shadow-xs'
                        : 'bg-amber-600 text-white font-black shadow-xs'
                      : isDark
                      ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={sub.description}
                >
                  <span>{sub.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : isDark
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search bar & Sentiment refinement */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            {/* Sentiment Quick Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 mr-1">Sắc thái:</span>
              <button
                onClick={() => setSelectedSentiment('all')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  selectedSentiment === 'all'
                    ? 'bg-slate-800 text-white dark:bg-slate-700'
                    : isDark
                    ? 'text-slate-400 hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setSelectedSentiment('bullish')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  selectedSentiment === 'bullish'
                    ? 'bg-emerald-600 text-white'
                    : isDark
                    ? 'text-emerald-400 hover:bg-emerald-950/40'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>Tích cực</span>
              </button>
              <button
                onClick={() => setSelectedSentiment('bearish')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  selectedSentiment === 'bearish'
                    ? 'bg-rose-600 text-white'
                    : isDark
                    ? 'text-rose-400 hover:bg-rose-950/40'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                <TrendingDown className="w-3 h-3" />
                <span>Tiêu cực / Vướng mắc</span>
              </button>
              <button
                onClick={() => setSelectedSentiment('neutral')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  selectedSentiment === 'neutral'
                    ? 'bg-amber-600 text-white'
                    : isDark
                    ? 'text-amber-400 hover:bg-amber-950/40'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                <Activity className="w-3 h-3" />
                <span>Trung tính</span>
              </button>
            </div>

            {/* Keyword Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm bài viết, từ khóa chính sách..."
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border transition outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-indigo-400'
                    : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-indigo-500'
                }`}
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-[10px] font-bold px-1 rounded cursor-pointer"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER RESULTS SUMMARY BAR */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <span>
            Kết quả lọc: <strong className="text-slate-900 dark:text-white font-black">{filteredArticles.length}</strong> bài viết phù hợp
          </span>
          {selectedCategory !== 'all' && (
            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {selectedCategory === 'policy'
                ? '🏛️ Nhóm Chính sách & Thể chế'
                : selectedCategory === 'public_enterprise'
                ? '👥 Nhóm Người dân & Doanh nghiệp'
                : '⚡ Nhóm Trọng điểm Cấp bách'}
            </span>
          )}
        </div>

        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Nhấp vào <strong>Điểm số Sắc thái</strong> trên từng bài để xem bóc tách chi tiết
        </span>
      </div>

      {/* ARTICLE FEED */}
      {filteredArticles.length === 0 ? (
        <div
          className={`p-10 rounded-2xl border text-center space-y-2.5 ${
            isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-300 dark:text-slate-200">
            Không tìm thấy bài viết nào khớp với điều kiện lọc hiện tại
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Vui lòng thử chọn lại nhóm danh mục, xóa từ khóa tìm kiếm hoặc chuyển sắc thái sang Tất cả.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedSubTopic('all');
              setSelectedSentiment('all');
              setSearchKeyword('');
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer mt-2"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredArticles.map((article, idx) => {
            const analysis = classifyArticleSmartFilter(article);
            const score = article.sentimentScore !== undefined ? article.sentimentScore : 50;
            const isBullish = article.sentiment === 'bullish';
            const isBearish = article.sentiment === 'bearish';

            return (
              <div
                key={article.id || idx}
                className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                }`}
              >
                {/* Article Header & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b pb-2.5 dark:border-slate-800/80 border-slate-100">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <SourceBrandBadge
                        source={article.source}
                        url={article.url}
                        size="sm"
                        showIcon={true}
                      />

                      <span className={`text-xs font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        🕒 {formatNewsTimeDisplay(article)}
                      </span>

                      {/* Smart Category Badges */}
                      {analysis.isPolicy && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1">
                          <Landmark className="w-3 h-3" />
                          <span>Chính sách / Thể chế</span>
                        </span>
                      )}

                      {analysis.isPublicEnterprise && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>Dân & Doanh Nghiệp</span>
                        </span>
                      )}

                      {analysis.isUrgentCross && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500 text-white animate-pulse flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          <span>Trọng điểm Khẩn</span>
                        </span>
                      )}
                    </div>

                    {/* Article Title */}
                    <h4 className={`text-sm sm:text-base font-bold leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {article.title}
                    </h4>
                  </div>

                  {/* Sentiment Score Badge (Clickable for decomposition) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setBreakdownArticle(article)}
                      className={`px-3 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-2 shadow-xs group ${
                        isBullish
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                          : isBearish
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400'
                          : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400'
                      }`}
                      title="Bấm để xem Báo cáo bóc tách thành phần điểm số cảm xúc (Sentiment Diagnostic)"
                    >
                      <div className="text-left">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider block opacity-70">
                          {isBullish ? '🟢 Bullish' : isBearish ? '🔴 Bearish' : '🟡 Neutral'}
                        </span>
                        <span className="text-xs font-black">
                          {score > 0 ? `+${score}` : score}/100
                        </span>
                      </div>
                      <Eye className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition" />
                    </button>
                  </div>
                </div>

                {/* Article Summary */}
                {article.summary && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {article.summary}
                  </p>
                )}

                {/* Leadership Priority Directive Box */}
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                    isBearish || analysis.isUrgentCross
                      ? isDark
                        ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                        : 'bg-rose-50/70 border-rose-200 text-rose-800'
                      : analysis.isPolicy
                      ? isDark
                        ? 'bg-blue-950/20 border-blue-500/30 text-blue-200'
                        : 'bg-blue-50/70 border-blue-200 text-blue-800'
                      : isDark
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                      : 'bg-amber-50/70 border-amber-200 text-amber-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <span className="font-black uppercase text-[10px] text-amber-400 tracking-wider">
                      Điểm chạm Lãnh đạo cần lưu ý:
                    </span>
                    <p className="leading-relaxed font-medium">
                      {analysis.leadershipFocusReason}
                    </p>
                  </div>
                </div>

                {/* Matched Keywords Tags & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                  {/* Keyword Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400">Từ khóa:</span>
                    {analysis.policyKeywordsMatched.slice(0, 3).map((kw, kwIdx) => (
                      <span
                        key={`pol-${kwIdx}`}
                        className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20"
                      >
                        #{kw}
                      </span>
                    ))}
                    {analysis.publicEnterpriseKeywordsMatched.slice(0, 3).map((kw, kwIdx) => (
                      <span
                        key={`pe-${kwIdx}`}
                        className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {onDeepDive && (
                      <button
                        onClick={() => onDeepDive(article)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 border ${
                          isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                        title="Xem bóc tách sâu 6W Matrix"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                        <span>Mổ xẻ</span>
                      </button>
                    )}

                    {onDraftStatement && (
                      <button
                        onClick={() => onDraftStatement(article)}
                        className="px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-white shadow-xs"
                        title="Soạn thông cáo báo chí phản hồi hoặc hướng dẫn chính sách"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        <span>Soạn phản hồi</span>
                      </button>
                    )}

                    {onOpenGmailAlertModal && (
                      <button
                        onClick={() => onOpenGmailAlertModal(article)}
                        className={`p-1.5 rounded-xl border transition cursor-pointer ${
                          isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                        title="Gửi email cảnh báo khẩn cho Lãnh đạo"
                      >
                        <Mail className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    )}

                    {article.url && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-400 transition"
                        title="Xem bài báo gốc"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sentiment Score Decomposition Modal */}
      {breakdownArticle && (
        <SentimentScoreBreakdownModal
          item={breakdownArticle}
          isOpen={true}
          onClose={() => setBreakdownArticle(null)}
          onDraftStatement={onDraftStatement}
          onGmailAlert={onOpenGmailAlertModal}
        />
      )}
    </div>
  );
};
