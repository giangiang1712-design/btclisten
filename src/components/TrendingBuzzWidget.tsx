import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BuzzKeyword, ScrapedNewsItem, formatNewsTimeDisplay } from '../types';
import { useTheme } from '../lib/theme';
import { SourceBrandBadge } from './SourceBrandBadge';
import { decodeHtmlEntities } from '../lib/htmlDecoder';
import { isRiskArticle } from '../lib/newsClassification';
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Star,
  Sliders,
  Activity,
  Filter,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Search,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Compass,
} from 'lucide-react';

export interface TrendingBuzzWidgetProps {
  keywords: BuzzKeyword[];
  onSelectKeyword: (kw: string) => void;
  sourceStats?: { name: string; count: number }[];
  onOpenKeywordWeightModal?: () => void;
  newsItems?: ScrapedNewsItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  lastUpdated?: string | number;
  autoRefresh5mEnabled?: boolean;
}

type ExecutiveTrendFilter = 'all' | 'risk' | 'opportunity' | 'mof';

// ----------------------------------------------------------------------
// Helper: Xác định phân loại Nguy cơ / Cơ hội cho lãnh đạo
// ----------------------------------------------------------------------
function classifyKeywordTone(
  kw: BuzzKeyword,
  primaryArticle?: ScrapedNewsItem
): {
  type: 'risk' | 'opportunity' | 'neutral';
  label: string;
  badgeClass: string;
} {
  const kwLower = (kw.keyword || '').toLowerCase();
  const isRiskKeyword = /rủi ro|áp lực|thất thu|gian lận|nợ xấu|thao túng|khiếu nại|đình đốn|xử phạt|thu hồi|giảm mạnh|vướng mắc|sai phạm|thanh tra|kỷ luật/i.test(
    kwLower
  );
  const isOpportunityKeyword = /tăng trưởng|thặng dư|giải ngân nhanh|thu hút|fdi|phục hồi|phát triển|nâng hạng|kỷ lục|ổn định|điểm sáng|đột phá|thuận lợi/i.test(
    kwLower
  );

  const isNeg =
    kw.sentiment === 'bearish' ||
    isRiskKeyword ||
    (primaryArticle && (isRiskArticle(primaryArticle) || Boolean(primaryArticle.isEmergency)));

  if (isNeg) {
    return {
      type: 'risk',
      label: 'Nguy cơ',
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    };
  }

  const isPos = kw.sentiment === 'bullish' || isOpportunityKeyword;
  if (isPos) {
    return {
      type: 'opportunity',
      label: 'Cơ hội',
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    };
  }

  return {
    type: 'neutral',
    label: 'Theo dõi',
    badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  };
}

// ----------------------------------------------------------------------
// SUB-COMPONENT: Horizontal Card Item (Card Ngang Tối Giản Cho Lãnh Đạo)
// ----------------------------------------------------------------------
interface HorizontalBuzzCardProps {
  kw: BuzzKeyword;
  index: number;
  onSelect: (kwName: string) => void;
  isDark: boolean;
  primaryArticle?: ScrapedNewsItem;
  relatedCount: number;
}

const HorizontalBuzzCard: React.FC<HorizontalBuzzCardProps> = React.memo(
  ({ kw, index, onSelect, isDark, primaryArticle, relatedCount }) => {
    const cleanKeyword = decodeHtmlEntities(kw.keyword);
    const classification = useMemo(() => classifyKeywordTone(kw, primaryArticle), [kw, primaryArticle]);

    // Tiêu đề đại diện: Ưu tiên tiêu đề bài báo tiêu biểu hoặc tên chủ đề
    const representativeHeadline = primaryArticle?.title
      ? decodeHtmlEntities(primaryArticle.title)
      : `Phản ánh dư luận báo chí về "${cleanKeyword}"`;

    const sourceName = primaryArticle?.source || '30 nguồn báo chí trọng điểm';
    const timeDisplay = primaryArticle
      ? formatNewsTimeDisplay(primaryArticle)
      : 'Hôm nay';

    return (
      <div
        id={`buzz-card-${index}`}
        onClick={() => onSelect(kw.keyword)}
        className={`group p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          kw.isCoreMof
            ? isDark
              ? 'bg-amber-950/20 hover:bg-amber-950/35 border-amber-500/30 hover:border-amber-500/50 shadow-xs'
              : 'bg-amber-50/60 hover:bg-amber-100/70 border-amber-300 hover:border-amber-400 shadow-2xs'
            : isDark
            ? 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700 shadow-xs'
            : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-2xs'
        }`}
      >
        {/* Left Side: Icon Đại Diện & Tiêu Đề + Nguồn */}
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          {/* Icon Đại Diện: Nguy cơ (⚠️) hoặc Cơ hội (📈) hoặc Theo dõi (⚖️) */}
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs transition-transform group-hover:scale-105 ${
              classification.type === 'risk'
                ? isDark
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  : 'bg-rose-100 border-rose-300 text-rose-700'
                : classification.type === 'opportunity'
                ? isDark
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-700'
                : isDark
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                : 'bg-blue-100 border-blue-300 text-blue-700'
            }`}
            title={`Phân loại: ${classification.label}`}
          >
            {classification.type === 'risk' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : classification.type === 'opportunity' ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <Compass className="w-5 h-5" />
            )}
          </div>

          {/* Nội dung trung tâm: Chủ đề, Tiêu đề thực tế, Nguồn và Thời gian */}
          <div className="min-w-0 flex-1 space-y-1">
            {/* Dòng 1: Keyword badge + Tiêu đề tin tức phản ánh */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`font-black text-xs px-2 py-0.5 rounded-lg border font-mono tracking-tight shrink-0 ${
                  kw.isCoreMof
                    ? isDark
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                    : isDark
                    ? 'bg-slate-800 text-slate-200 border-slate-700'
                    : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                #{cleanKeyword}
              </span>

              {kw.isCoreMof && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  Trọng tâm MoF
                </span>
              )}

              <h4
                className={`text-xs sm:text-sm font-bold truncate flex-1 leading-snug transition-colors ${
                  isDark ? 'text-slate-100 group-hover:text-emerald-300' : 'text-slate-900 group-hover:text-emerald-700'
                }`}
                title={representativeHeadline}
              >
                {representativeHeadline}
              </h4>
            </div>

            {/* Dòng 2: Nguồn báo chí & Thời gian & Số lượng phản ánh */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              {primaryArticle?.source ? (
                <SourceBrandBadge source={primaryArticle.source} size="xs" />
              ) : (
                <span className="font-semibold text-slate-600 dark:text-slate-300">{sourceName}</span>
              )}
              <span>•</span>
              <span className="font-mono text-[11px]">{timeDisplay}</span>
              <span>•</span>
              <span className="font-medium text-[11px]">
                <strong className="text-slate-700 dark:text-slate-200 font-mono font-bold">
                  {relatedCount || kw.mentions || 1}
                </strong>{' '}
                bài báo phản ánh
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Status Badge (Nguy cơ / Cơ hội) & Action Arrow */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${classification.badgeClass}`}
          >
            {classification.type === 'risk' && <AlertTriangle className="w-3.5 h-3.5" />}
            {classification.type === 'opportunity' && <TrendingUp className="w-3.5 h-3.5" />}
            {classification.type === 'neutral' && <Compass className="w-3.5 h-3.5" />}
            <span>{classification.label}</span>
          </span>

          <button
            type="button"
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Lọc các bài viết theo chủ đề này"
          >
            <span className="hidden md:inline">Xem tin</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    );
  }
);
HorizontalBuzzCard.displayName = 'HorizontalBuzzCard';

// ----------------------------------------------------------------------
// MAIN COMPONENT: TrendingBuzzWidget
// ----------------------------------------------------------------------
const TrendingBuzzWidgetInternal: React.FC<TrendingBuzzWidgetProps> = ({
  keywords = [],
  onSelectKeyword,
  sourceStats = [],
  onOpenKeywordWeightModal,
  newsItems = [],
  isLoading = false,
  onRefresh,
  lastUpdated,
  autoRefresh5mEnabled = true,
}) => {
  const { isDark } = useTheme();
  const [activeFilter, setActiveFilter] = useState<ExecutiveTrendFilter>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [is5mAutoUpdate, setIs5mAutoUpdate] = useState<boolean>(autoRefresh5mEnabled);
  const [countdown5m, setCountdown5m] = useState<number>(300);

  // Map each keyword to its matching news articles
  const keywordToArticlesMap = useMemo(() => {
    const map = new Map<string, ScrapedNewsItem[]>();
    if (keywords.length === 0) return map;

    for (const k of keywords) {
      map.set(k.keyword.toLowerCase(), []);
    }

    if (!newsItems || newsItems.length === 0) return map;

    for (const item of newsItems) {
      const title = (item.title || '').toLowerCase();
      const summary = (item.summary || '').toLowerCase();

      for (const k of keywords) {
        const kwLower = k.keyword.toLowerCase();
        if (title.includes(kwLower) || summary.includes(kwLower)) {
          const list = map.get(kwLower);
          if (list && list.length < 15) {
            list.push(item);
          }
        }
      }
    }

    return map;
  }, [keywords, newsItems]);

  // Pre-calculate classification counts for clean filter tabs
  const filterCounts = useMemo(() => {
    let riskCount = 0;
    let oppCount = 0;
    let mofCount = 0;

    keywords.forEach((kw) => {
      if (kw.isCoreMof) mofCount++;
      const primary = keywordToArticlesMap.get(kw.keyword.toLowerCase())?.[0] || kw.recentArticles?.[0];
      const tone = classifyKeywordTone(kw, primary);
      if (tone.type === 'risk') riskCount++;
      else if (tone.type === 'opportunity') oppCount++;
    });

    return {
      all: keywords.length,
      risk: riskCount,
      opportunity: oppCount,
      mof: mofCount,
    };
  }, [keywords, keywordToArticlesMap]);

  // Filtered keywords list
  const filteredKeywords = useMemo(() => {
    if (!keywords || keywords.length === 0) return [];

    return keywords.filter((kw) => {
      const primary = keywordToArticlesMap.get(kw.keyword.toLowerCase())?.[0] || kw.recentArticles?.[0];
      const tone = classifyKeywordTone(kw, primary);

      if (activeFilter === 'risk' && tone.type !== 'risk') return false;
      if (activeFilter === 'opportunity' && tone.type !== 'opportunity') return false;
      if (activeFilter === 'mof' && !kw.isCoreMof) return false;

      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        const matchKw = (kw.keyword || '').toLowerCase().includes(q);
        const matchTitle = primary?.title ? primary.title.toLowerCase().includes(q) : false;
        if (!matchKw && !matchTitle) return false;
      }

      return true;
    });
  }, [keywords, activeFilter, searchFilter, keywordToArticlesMap]);

  // 5-Minute Auto-Refresh
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const isLoadingRef = useRef(isLoading);
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    if (!is5mAutoUpdate) return;
    const timer = setInterval(() => {
      setCountdown5m((prev) => {
        if (prev <= 1) {
          // Defer onRefresh execution out of the React state updater phase
          setTimeout(() => {
            if (onRefreshRef.current && !isLoadingRef.current) {
              onRefreshRef.current();
            }
          }, 0);
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [is5mAutoUpdate]);

  const formattedCountdown = useMemo(() => {
    const mins = Math.floor(countdown5m / 60);
    const secs = countdown5m % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [countdown5m]);

  return (
    <div
      id="trending-buzz-widget-container"
      className={`rounded-2xl border flex flex-col h-full overflow-hidden shadow-sm transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* Widget Header: Phong cách điều hành tối giản cho lãnh đạo */}
      <div
        className={`p-4 border-b flex flex-col gap-3 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-slate-50/70'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/15 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-500/30 shrink-0">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`text-sm sm:text-base font-black tracking-tight ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  Tin Tức Nóng & Xu Hướng Dư Luận
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono border border-rose-500/20">
                  {keywords.length} chủ đề
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Tổng hợp chủ đề nổi bật trên 30 nguồn báo chí, phân loại trực quan theo Nguy cơ & Cơ hội điều hành
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            {/* 5-minute countdown pulse */}
            <button
              onClick={() => {
                setCountdown5m(300);
                if (onRefresh) onRefresh();
              }}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition cursor-pointer ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-emerald-400'
                  : 'bg-white border-slate-300 text-slate-700 hover:text-emerald-600 shadow-2xs'
              }`}
              title="Đồng bộ lại tin tức mới nhất"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-[11px] font-sans">Cập nhật:</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formattedCountdown}</span>
            </button>

            {onOpenKeywordWeightModal && (
              <button
                onClick={onOpenKeywordWeightModal}
                className={`text-xs font-bold flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
                  isDark
                    ? 'text-amber-300 bg-amber-500/15 border-amber-500/35 hover:bg-amber-500/25'
                    : 'text-amber-950 bg-amber-100 border-amber-300 hover:bg-amber-200'
                }`}
                title="Tùy chỉnh danh mục từ khóa trọng tâm Bộ Tài chính"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">Trọng số MoF</span>
              </button>
            )}
          </div>
        </div>

        {/* Minimalist Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 whitespace-nowrap ${
                activeFilter === 'all'
                  ? isDark
                    ? 'bg-slate-800 text-white border-slate-700 shadow-xs'
                    : 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : isDark
                  ? 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>Tất cả</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10">
                {filterCounts.all}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('risk')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 whitespace-nowrap ${
                activeFilter === 'risk'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : isDark
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Nguy cơ</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10">
                {filterCounts.risk}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('opportunity')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 whitespace-nowrap ${
                activeFilter === 'opportunity'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : isDark
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Cơ hội</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10">
                {filterCounts.opportunity}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('mof')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 whitespace-nowrap ${
                activeFilter === 'mof'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : isDark
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span>Trọng tâm MoF</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10">
                {filterCounts.mof}
              </span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[200px] sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Tìm nhanh chủ đề..."
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-none transition ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-slate-600'
                  : 'bg-white border-slate-300 text-slate-800 focus:border-slate-400'
              }`}
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main List of Horizontal Buzz Cards */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 custom-scrollbar">
        {filteredKeywords.length > 0 ? (
          filteredKeywords.map((kw, index) => {
            const relNews = keywordToArticlesMap.get(kw.keyword.toLowerCase()) || [];
            const primaryArticle = relNews[0] || kw.recentArticles?.[0];
            return (
              <HorizontalBuzzCard
                key={kw.keyword}
                kw={kw}
                index={index}
                onSelect={onSelectKeyword}
                isDark={isDark}
                primaryArticle={primaryArticle}
                relatedCount={relNews.length || kw.mentions || 1}
              />
            );
          })
        ) : (
          <div className={`p-8 text-center text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <Filter className="w-6 h-6 mx-auto mb-2 opacity-40 text-slate-400" />
            <p>Không có chủ đề nào phù hợp với điều kiện tìm kiếm.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Custom Memo Comparator
function areTrendingBuzzPropsEqual(
  prevProps: Readonly<TrendingBuzzWidgetProps>,
  nextProps: Readonly<TrendingBuzzWidgetProps>
): boolean {
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.lastUpdated !== nextProps.lastUpdated) return false;
  if (prevProps.autoRefresh5mEnabled !== nextProps.autoRefresh5mEnabled) return false;

  const prevNewsLen = prevProps.newsItems ? prevProps.newsItems.length : 0;
  const nextNewsLen = nextProps.newsItems ? nextProps.newsItems.length : 0;
  if (prevNewsLen !== nextNewsLen) return false;

  if (prevProps.keywords.length !== nextProps.keywords.length) return false;
  for (let i = 0; i < prevProps.keywords.length; i++) {
    const pk = prevProps.keywords[i];
    const nk = nextProps.keywords[i];
    if (pk.keyword !== nk.keyword || pk.mentions !== nk.mentions || pk.sentiment !== nk.sentiment) {
      return false;
    }
  }

  return true;
}

export const TrendingBuzzWidget = React.memo(TrendingBuzzWidgetInternal, areTrendingBuzzPropsEqual);
