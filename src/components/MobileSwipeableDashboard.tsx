import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ScrapeResponse, ScrapedNewsItem, BuzzKeyword, TimeRange, UrgentAlert, SECTOR_NAMES } from '../types';
import { CmsNavigationTab } from './CmsSidebar';
import { MarketPulseWidget } from './MarketPulseWidget';
import { SocialListeningOperationalWorkflow } from './SocialListeningOperationalWorkflow';
import { TrendingBuzzWidget } from './TrendingBuzzWidget';
import { decodeHtmlEntities } from '../lib/htmlDecoder';
import { SourceBrandBadge } from './SourceBrandBadge';
import { isRiskArticle } from '../lib/newsClassification';
import { scrollToNewsCard } from '../lib/scrollToArticle';
import {
  Sparkles,
  ShieldAlert,
  TrendingUp,
  Zap,
  ArrowRight,
  Activity,
  ChevronLeft,
  ChevronRight,
  Layers,
  FileEdit,
  Share2,
  Lightbulb,
  Flame,
  FileCheck2,
  ListOrdered,
  FolderKanban,
  Newspaper,
  ExternalLink,
  Mail,
  LayoutGrid,
  Columns2,
} from 'lucide-react';

interface SectorNewsGroupProps {
  sectorKey: string;
  sectorName: string;
  items: ScrapedNewsItem[];
  isDark: boolean;
  onSelectArticle: (article: ScrapedNewsItem) => void;
  onDraftStatement: (article: ScrapedNewsItem) => void;
  onOpenGmailAlertModal?: (article?: ScrapedNewsItem) => void;
}

const SectorNewsGroupSlider: React.FC<SectorNewsGroupProps> = ({
  sectorName,
  items,
  isDark,
  onSelectArticle,
  onDraftStatement,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -250, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 250, behavior: 'smooth' });
    }
  };

  return (
    <div className={`p-3 rounded-xl border mb-3 shadow-sm ${
      isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'
    }`}>
      {/* Group Header */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="p-1 rounded bg-emerald-500/10 text-emerald-500 shrink-0 border border-emerald-500/20">
            <FolderKanban className="w-3.5 h-3.5" />
          </span>
          <h4 className={`text-xs font-black truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {sectorName}
          </h4>
          <span className={`px-1.5 py-0.2 text-[10px] font-mono font-extrabold rounded border shrink-0 ${
            items.length > 1
              ? (isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300')
              : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-200 text-slate-600 border-slate-300')
          }`}>
            {items.length} tin
          </span>
        </div>

        {/* Scroll Nav Buttons for Nested Slider */}
        {items.length > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={scrollLeft}
              className={`p-1 rounded-lg border transition cursor-pointer ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Cuộn sang trái"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={scrollRight}
              className={`p-1 rounded-lg border transition cursor-pointer ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Cuộn sang phải"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Nested Horizontal Slider */}
      <div
        ref={sliderRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-2.5 py-1 px-0.5 scroll-smooth touch-pan-x"
      >
        {items.map((item) => {
          const isBullish = item.sentiment === 'bullish';
          const isBearish = item.sentiment === 'bearish';

          const sentimentBg = isBullish
            ? (isDark ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-emerald-50/90 border-emerald-200')
            : isBearish
            ? (isDark ? 'bg-rose-950/40 border-rose-500/30' : 'bg-rose-50/90 border-rose-200')
            : (isDark ? 'bg-amber-950/40 border-amber-500/30' : 'bg-amber-50/90 border-amber-200');

          const sentimentBadge = isBullish
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : isBearish
            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            : 'bg-amber-500/20 text-amber-400 border-amber-500/30';

          const sentimentText = isBullish ? 'Tích cực' : isBearish ? 'Tiêu cực' : 'Trung tính';

          return (
            <div
              key={item.id}
              id={`news-card-${item.id}`}
              data-article-id={item.id}
              className={`news-card snap-start shrink-0 w-[250px] sm:w-[270px] p-3 rounded-xl border flex flex-col justify-between shadow-sm transition hover:border-emerald-500/50 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              } ${sentimentBg}`}
            >
              <div>
                {/* Source & Sentiment */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <SourceBrandBadge source={item.sourceName || item.source} />
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${sentimentBadge}`}>
                    {sentimentText}
                  </span>
                </div>

                {/* Article Title */}
                <h5
                  onClick={() => onSelectArticle(item)}
                  className={`text-xs font-bold line-clamp-2 leading-snug cursor-pointer mb-1.5 hover:text-emerald-500 transition ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                  title={item.title}
                >
                  {decodeHtmlEntities(item.title)}
                </h5>

                {/* Snippet */}
                <p className={`text-[11px] line-clamp-2 leading-relaxed mb-2 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {decodeHtmlEntities(item.summary || item.snippet || '')}
                </p>
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 mt-auto">
                <button
                  onClick={() => onSelectArticle(item)}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold border flex items-center justify-center gap-1 transition cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                      : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <span>Xem tin</span>
                  <ExternalLink className="w-3 h-3 text-emerald-500" />
                </button>
                <button
                  onClick={() => onDraftStatement(item)}
                  className="py-1 px-2.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 transition cursor-pointer"
                  title="Soạn phát ngôn"
                >
                  <FileEdit className="w-3 h-3" />
                  <span>Phát ngôn</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface MobileSwipeableDashboardProps {
  data: ScrapeResponse | null;
  isDark: boolean;
  timeRange: TimeRange;
  onSelectArticle: (article: ScrapedNewsItem) => void;
  onDraftStatement: (article: ScrapedNewsItem) => void;
  onNavigateTab: (tab: CmsNavigationTab) => void;
  enrichedTrendingKeywords: BuzzKeyword[];
  handleSearch: (kw: string) => void;
  setShowKeywordWeightModal: (show: boolean) => void;
  onOpenGmailAlertModal?: (article?: ScrapedNewsItem) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const MobileSwipeableDashboard: React.FC<MobileSwipeableDashboardProps> = ({
  data,
  isDark,
  timeRange,
  onSelectArticle,
  onDraftStatement,
  onNavigateTab,
  enrichedTrendingKeywords,
  handleSearch,
  setShowKeywordWeightModal,
  onOpenGmailAlertModal,
  isLoading = false,
  onRefresh,
}) => {
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('all');
  const [displayMode, setDisplayMode] = useState<'swipe' | 'grid'>('swipe');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group all news items by sector
  const groupedNewsBySector = useMemo(() => {
    if (!data?.news || data.news.length === 0) return [];

    const map = new Map<string, { sectorKey: string; sectorName: string; items: ScrapedNewsItem[] }>();

    data.news.forEach((item) => {
      const secKey = item.sector || 'macro';
      const secName = item.sectorNameVi || SECTOR_NAMES[secKey] || 'Lĩnh vực khác';

      if (!map.has(secKey)) {
        map.set(secKey, { sectorKey: secKey, sectorName: secName, items: [] });
      }
      map.get(secKey)!.items.push(item);
    });

    return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
  }, [data?.news]);

  // Filtered sector groups based on filter selection
  const filteredSectorGroups = useMemo(() => {
    if (selectedSectorFilter === 'all') return groupedNewsBySector;
    return groupedNewsBySector.filter((g) => g.sectorKey === selectedSectorFilter);
  }, [groupedNewsBySector, selectedSectorFilter]);

  // Extract all crisis items
  const crisisItems = useMemo(() => {
    if (!data?.news) return [];
    return data.news.filter(isRiskArticle);
  }, [data?.news]);

  // Group crisis news items by sector
  const crisisNewsGrouped = useMemo(() => {
    if (crisisItems.length === 0) return [];

    const map = new Map<string, { sectorKey: string; sectorName: string; items: ScrapedNewsItem[] }>();

    crisisItems.forEach((item) => {
      const secKey = item.sector || 'macro';
      const secName = item.sectorNameVi || SECTOR_NAMES[secKey] || 'Lĩnh vực khác';
      if (!map.has(secKey)) {
        map.set(secKey, { sectorKey: secKey, sectorName: secName, items: [] });
      }
      map.get(secKey)!.items.push(item);
    });

    return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
  }, [data?.news]);

  // Group positive news items by sector
  const positiveNewsGrouped = useMemo(() => {
    if (!data?.news) return [];
    const posItems = data.news.filter((n) => n.sentiment === 'bullish');
    if (posItems.length === 0) return [];

    const map = new Map<string, { sectorKey: string; sectorName: string; items: ScrapedNewsItem[] }>();

    posItems.forEach((item) => {
      const secKey = item.sector || 'macro';
      const secName = item.sectorNameVi || SECTOR_NAMES[secKey] || 'Lĩnh vực khác';
      if (!map.has(secKey)) {
        map.set(secKey, { sectorKey: secKey, sectorName: secName, items: [] });
      }
      map.get(secKey)!.items.push(item);
    });

    return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
  }, [data?.news]);

  const cardList = [
    { id: 'pulse', title: 'Xung Nhịp & Cảnh Báo / Tin Nổi Bật', icon: Activity, badge: 'Xung nhịp' },
    { id: 'sectors', title: 'Tin Bài Theo Lĩnh Vực', icon: FolderKanban, badge: `${groupedNewsBySector.length} Lĩnh vực` },
    { id: 'workflow', title: 'Quy Trình Tác Chiến', icon: Layers, badge: '4 Bước' },
    { id: 'advice', title: 'Nhận Định Chiến Lược', icon: Lightbulb, badge: 'MoF AI' },
    { id: 'crisis', title: 'Điểm Nóng & Rủi Ro', icon: ShieldAlert, badge: `${data?.executiveSummaryReport?.crisisCount || 0} Vụ việc` },
    { id: 'positive', title: 'Điểm Sáng Lan Tỏa', icon: TrendingUp, badge: `${data?.executiveSummaryReport?.positiveCount || 0} Tích cực` },
    { id: 'directive', title: 'Chỉ Đạo Truyền Thông', icon: Zap, badge: 'Tác chiến' },
    { id: 'trending', title: 'Chủ Đề Nóng & Trend', icon: Flame, badge: `${enrichedTrendingKeywords.length} Từ khóa` },
  ];

  // Scroll card into view on button/tab click (ensures seamless left scrolling in full-screen mode)
  const scrollToCard = (index: number) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    
    // Explicitly handle scrolling to the first item (left: 0)
    if (index <= 0) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
      setActiveCardIndex(0);
      return;
    }

    const cardElements = container.children;
    const target = cardElements[index] as HTMLElement;
    if (target) {
      // Calculate precise offset to avoid center-alignment clamping in wide/fullscreen viewports
      const targetLeft = target.offsetLeft - container.offsetLeft;
      container.scrollTo({
        left: Math.max(0, targetLeft - 8),
        behavior: 'smooth',
      });
      setActiveCardIndex(index);
    }
  };

  // Track scroll position to update active indicator
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollLeft = container.scrollLeft;

    if (scrollLeft <= 20) {
      if (activeCardIndex !== 0) setActiveCardIndex(0);
      return;
    }

    const cardElements = Array.from(container.children) as HTMLElement[];
    let closestIndex = 0;
    let minDiff = Infinity;

    cardElements.forEach((el, idx) => {
      const elOffset = el.offsetLeft - container.offsetLeft;
      const diff = Math.abs(elOffset - scrollLeft);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });

    if (closestIndex >= 0 && closestIndex < cardList.length && closestIndex !== activeCardIndex) {
      setActiveCardIndex(closestIndex);
    }
  };

  const handleNextCard = () => {
    if (activeCardIndex < cardList.length - 1) {
      scrollToCard(activeCardIndex + 1);
    }
  };

  const handlePrevCard = () => {
    if (activeCardIndex > 0) {
      scrollToCard(activeCardIndex - 1);
    } else {
      // Even if index was 0, ensure container is strictly at left: 0
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }
  };

  // Re-synchronize active card scroll alignment upon window resize or fullscreen transition
  useEffect(() => {
    const handleResizeOrFullscreen = () => {
      if (!scrollRef.current) return;
      const container = scrollRef.current;
      if (activeCardIndex === 0) {
        container.scrollTo({ left: 0, behavior: 'auto' });
        return;
      }
      const cardElements = container.children;
      const target = cardElements[activeCardIndex] as HTMLElement;
      if (target) {
        const targetLeft = target.offsetLeft - container.offsetLeft;
        container.scrollTo({
          left: Math.max(0, targetLeft - 8),
          behavior: 'auto',
        });
      }
    };

    window.addEventListener('resize', handleResizeOrFullscreen);
    document.addEventListener('fullscreenchange', handleResizeOrFullscreen);
    return () => {
      window.removeEventListener('resize', handleResizeOrFullscreen);
      document.removeEventListener('fullscreenchange', handleResizeOrFullscreen);
    };
  }, [activeCardIndex]);

  // Listen for active alert navigation jump events to auto-scroll to the target NewsCard
  useEffect(() => {
    const handleScrollToArticleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ articleId: string }>;
      const articleId = customEvent.detail?.articleId;
      if (!articleId) return;

      const isInCrisis = crisisItems.some((item) => item.id === articleId);
      if (isInCrisis) {
        if (displayMode === 'swipe') {
          scrollToCard(4);
        }
      } else {
        const sectorGroup = groupedNewsBySector.find((g) => g.items.some((i) => i.id === articleId));
        if (sectorGroup) {
          setSelectedSectorFilter('all');
          if (displayMode === 'swipe') {
            scrollToCard(1);
          }
        }
      }

      setTimeout(() => {
        scrollToNewsCard(articleId);
      }, 300);
    };

    window.addEventListener('mof-scroll-to-article', handleScrollToArticleEvent);
    return () => {
      window.removeEventListener('mof-scroll-to-article', handleScrollToArticleEvent);
    };
  }, [crisisItems, groupedNewsBySector, displayMode]);

  const executiveReport = data?.executiveSummaryReport;

  // Individual Card Render Functions for Clean Reusability
  const renderCard1_MarketPulse = () => (
    <div className="w-full h-full flex flex-col">
      {data?.sentimentOverview ? (
        <MarketPulseWidget
          sentiment={data.sentimentOverview}
          urgentAlerts={data.urgentAlerts || []}
          timeRange={timeRange}
          articles={data.news || []}
          negativeClusters={data.sentimentOverview.negativeClusters}
          communicationGaps={data.sentimentOverview.communicationGaps}
          onSelectArticle={onSelectArticle}
          onDraftStatementForCluster={(cluster) => {
            if (cluster.articles && cluster.articles.length > 0) {
              onDraftStatement(cluster.articles[0]);
            }
          }}
          onSelectAlert={(alert: UrgentAlert) => {
            const matched = data.news.find(
              (n) =>
                n.id === alert.id ||
                n.title.trim().toLowerCase() === alert.title.trim().toLowerCase() ||
                (n.title && alert.title && (n.title.includes(alert.title) || alert.title.includes(n.title)))
            );
            if (matched) {
              onSelectArticle(matched);
            } else {
              onSelectArticle({
                id: alert.id || `alert-${Date.now()}`,
                title: alert.title,
                summary: alert.summary || alert.title,
                sector: (alert.sector as any) || 'macro',
                sectorNameVi: 'Cảnh báo rủi ro & Trọng tâm',
                sentiment: 'bearish',
                sentimentScore: -65,
                impactLevel: (alert.impact as any) || 'high',
                timeAgo: alert.timeAgo || 'Vừa cập nhật',
                publishedAt: (alert as any).publishedAt || new Date().toISOString(),
                source: (alert as any).source || 'Cổng thông tin Bộ Tài chính',
                url: (alert as any).url || 'https://thoibaotaichinhvietnam.vn',
                keyPoints: [alert.summary || alert.title],
                isEmergency: Boolean(alert.isEmergency),
                tickers: alert.tickers || [],
                isOfficialSource: true,
              } as any);
            }
          }}
        />
      ) : (
        <div
          className={`p-4 rounded-2xl border h-full flex flex-col items-center justify-center text-center ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
          }`}
        >
          <Activity className="w-8 h-8 text-emerald-500 animate-pulse mb-2" />
          <p className="text-xs font-medium">Đang tải dữ liệu Chỉ số Sắc thái Tin tức...</p>
        </div>
      )}
    </div>
  );

  const renderCard2_SectorGroups = () => (
    <div
      className={`w-full h-full min-h-[460px] max-h-[540px] rounded-2xl border p-4 shadow-xl flex flex-col overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b pb-2.5 mb-2.5 border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
              <FolderKanban className="w-4 h-4 text-emerald-500" />
            </span>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Tin Bài Theo Lĩnh Vực
              </h3>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Phân nhóm & Slider cuộn ngang
              </p>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              isDark ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'bg-cyan-100 text-cyan-800 border-cyan-300'
            }`}
          >
            {groupedNewsBySector.length} Lĩnh vực
          </span>
        </div>

        {/* Filter Pills for Sectors */}
        {groupedNewsBySector.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-2 mb-1 shrink-0">
            <button
              onClick={() => setSelectedSectorFilter('all')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap border cursor-pointer transition ${
                selectedSectorFilter === 'all'
                  ? 'bg-emerald-600 text-white border-emerald-500 font-extrabold'
                  : isDark
                  ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:text-slate-900'
              }`}
            >
              Tất cả ({data?.news?.length || 0})
            </button>
            {groupedNewsBySector.map((group) => (
              <button
                key={group.sectorKey}
                onClick={() => setSelectedSectorFilter(group.sectorKey)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap border cursor-pointer transition ${
                  selectedSectorFilter === group.sectorKey
                    ? 'bg-emerald-600 text-white border-emerald-500 font-extrabold'
                    : isDark
                    ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-600 border-slate-300 hover:text-slate-900'
                }`}
              >
                {group.sectorName} ({group.items.length})
              </button>
            ))}
          </div>
        )}

        {/* Scrollable Container of Sector Groups */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-0.5 -mr-0.5">
          {filteredSectorGroups.length > 0 ? (
            filteredSectorGroups.map((group) => (
              <SectorNewsGroupSlider
                key={group.sectorKey}
                sectorKey={group.sectorKey}
                sectorName={group.sectorName}
                items={group.items}
                isDark={isDark}
                onSelectArticle={onSelectArticle}
                onDraftStatement={onDraftStatement}
              />
            ))
          ) : (
            <div
              className={`p-4 rounded-xl border text-center my-auto ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <Newspaper className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
              <p className="text-xs font-medium">Chưa có dữ liệu tin bài thuộc lĩnh vực này.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCard3_Workflow = () => (
    <div className="w-full h-full flex flex-col">
      {data?.sentimentOverview ? (
        <SocialListeningOperationalWorkflow
          sentiment={data.sentimentOverview}
          newsItems={data.news || []}
          onSelectArticle={(item) => onSelectArticle(item)}
          isDark={isDark}
          onNavigateTab={(tab) => onNavigateTab(tab)}
        />
      ) : (
        <div
          className={`p-4 rounded-2xl border h-full flex flex-col items-center justify-center text-center ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
          }`}
        >
          <Layers className="w-8 h-8 text-emerald-500 mb-2" />
          <p className="text-xs font-medium">Đang tải Quy trình tác chiến...</p>
        </div>
      )}
    </div>
  );

  const renderCard4_StrategicAdvice = () => (
    <div
      className={`w-full h-full min-h-[440px] rounded-2xl border p-4 shadow-xl flex flex-col justify-between ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      <div>
        <div className="flex items-center justify-between border-b pb-3 mb-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
              <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
            </span>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Nhận Định Chiến Lược
              </h3>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Bối cảnh dư luận & Tham mưu chỉ đạo
              </p>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              isDark ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-900 border-amber-300'
            }`}
          >
            MoF AI
          </span>
        </div>

        <div
          className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span
            className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${
              isDark ? 'text-cyan-400' : 'text-cyan-700'
            }`}
          >
            💡 Bối Cảnh Dư Luận & Định Hướng Phản Ứng
          </span>
          <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {executiveReport?.overallStrategicAdvice ||
              executiveReport?.generalSummary ||
              'Chưa phát hiện dấu hiệu bất thường. Tiếp tục theo dõi các kênh truyền thông chính thống và mạng xã hội.'}
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 mt-3">
        <button
          onClick={() => onNavigateTab('briefing')}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
            isDark
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
              : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700'
          }`}
        >
          <span>Mở Soạn thảo Văn bản Tham mưu</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderCard5_CrisisHotspots = () => (
    <div
      className={`w-full h-full min-h-[440px] rounded-2xl border p-4 shadow-xl flex flex-col justify-between ${
        isDark ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50/70 border-rose-200'
      }`}
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between border-b pb-3 mb-3 border-rose-500/20">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-rose-300' : 'text-rose-900'}`}>
                  1. Cảnh Báo Rủi Ro & Điểm Nóng
                </h3>
                <p className={`text-[10px] ${isDark ? 'text-rose-400/80' : 'text-rose-700'}`}>
                  Sự kiện nguy cơ khủng hoảng
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                isDark
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-rose-200 text-rose-900 border border-rose-300'
              }`}
            >
              {executiveReport?.crisisCount || 0} Vụ việc
            </span>
          </div>

          <div
            className={`p-3 rounded-xl border mb-3 ${
              isDark ? 'bg-slate-950/80 border-rose-500/20' : 'bg-white border-rose-200'
            }`}
          >
            <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {executiveReport?.crisisSummary ||
                (executiveReport?.topCrisisDirectives && executiveReport.topCrisisDirectives.length > 0
                  ? executiveReport.topCrisisDirectives.map((d) => `• ${d.title}`).join('\n')
                  : 'Chưa phát hiện điểm nóng tiêu cực có nguy cơ khủng hoảng truyền thông.')}
            </p>
          </div>

          {/* Nested Sector Sliders for Crisis Items if present */}
          {crisisNewsGrouped.length > 0 && (
            <div className="mt-2 space-y-2 max-h-[190px] overflow-y-auto custom-scrollbar pr-0.5">
              <span className="text-[10px] font-extrabold uppercase text-rose-400 tracking-wider block">
                Phân nhóm rủi ro theo Lĩnh vực:
              </span>
              {crisisNewsGrouped.map((grp) => (
                <SectorNewsGroupSlider
                  key={`crisis_${grp.sectorKey}`}
                  sectorKey={grp.sectorKey}
                  sectorName={grp.sectorName}
                  items={grp.items}
                  isDark={isDark}
                  onSelectArticle={onSelectArticle}
                  onDraftStatement={onDraftStatement}
                />
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-rose-500/20 mt-2">
          {executiveReport?.topCrisisDirectives && executiveReport.topCrisisDirectives.length > 0 ? (
            <div className="space-y-2 mt-2">
              <button
                onClick={() => onDraftStatement(executiveReport.topCrisisDirectives[0])}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
              >
                <FileEdit className="w-4 h-4" />
                <span>Soạn Phát Ngôn Xử Lý Ngay &rarr;</span>
              </button>

              {onOpenGmailAlertModal && (
                <button
                  onClick={() => onOpenGmailAlertModal(executiveReport.topCrisisDirectives[0])}
                  className="w-full py-2 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-red-800 to-rose-900 hover:from-red-900 hover:to-rose-950 text-white flex items-center justify-center gap-2 transition cursor-pointer shadow-md border border-rose-500/40"
                >
                  <Mail className="w-4 h-4 text-rose-300 animate-pulse" />
                  <span>🚨 Gửi Gmail Cảnh Báo Tới Lãnh Đạo</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              {onOpenGmailAlertModal && (
                <button
                  onClick={() => onOpenGmailAlertModal(undefined)}
                  className="w-full py-2 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-red-800 to-rose-900 hover:from-red-900 hover:to-rose-950 text-white flex items-center justify-center gap-2 transition cursor-pointer shadow-md border border-rose-500/40"
                >
                  <Mail className="w-4 h-4 text-rose-300 animate-pulse" />
                  <span>🚨 Gửi Gmail Cảnh Báo Tổng Thể</span>
                </button>
              )}
              <button
                onClick={() => onNavigateTab('table')}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition cursor-pointer ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-700'
                }`}
              >
                <span>Xem danh sách tin bài CMS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCard6_PositiveHighlights = () => (
    <div
      className={`w-full h-full min-h-[440px] rounded-2xl border p-4 shadow-xl flex flex-col justify-between ${
        isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50/70 border-emerald-200'
      }`}
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between border-b pb-3 mb-3 border-emerald-500/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-emerald-300' : 'text-emerald-900'}`}>
                  2. Điểm Sáng & Cơ Hội Lan Tỏa
                </h3>
                <p className={`text-[10px] ${isDark ? 'text-emerald-400/80' : 'text-emerald-700'}`}>
                  Tín hiệu tích cực thị trường
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                isDark
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-emerald-200 text-emerald-900 border border-emerald-300'
              }`}
            >
              {executiveReport?.positiveCount || 0} Sự kiện
            </span>
          </div>

          <div
            className={`p-3 rounded-xl border mb-3 ${
              isDark ? 'bg-slate-950/80 border-emerald-500/20' : 'bg-white border-emerald-200'
            }`}
          >
            <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {executiveReport?.positiveSummary ||
                (executiveReport?.topPositiveDirectives && executiveReport.topPositiveDirectives.length > 0
                  ? executiveReport.topPositiveDirectives.map((d) => `• ${d.title}`).join('\n')
                  : 'Ghi nhận nhiều chuyển biến tích cực trong chính sách tiền tệ & xuất khẩu.')}
            </p>
          </div>

          {/* Nested Sector Sliders for Positive Items if present */}
          {positiveNewsGrouped.length > 0 && (
            <div className="mt-2 space-y-2 max-h-[190px] overflow-y-auto custom-scrollbar pr-0.5">
              <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider block">
                Phân nhóm tích cực theo Lĩnh vực:
              </span>
              {positiveNewsGrouped.map((grp) => (
                <SectorNewsGroupSlider
                  key={`pos_${grp.sectorKey}`}
                  sectorKey={grp.sectorKey}
                  sectorName={grp.sectorName}
                  items={grp.items}
                  isDark={isDark}
                  onSelectArticle={onSelectArticle}
                  onDraftStatement={onDraftStatement}
                />
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-emerald-500/20 mt-2">
          {executiveReport?.topPositiveDirectives && executiveReport.topPositiveDirectives.length > 0 ? (
            <button
              onClick={() => onDraftStatement(executiveReport.topPositiveDirectives[0])}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <Share2 className="w-4 h-4" />
              <span>Lan Tỏa Thông Tin Tích Cực &rarr;</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigateTab('table')}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition cursor-pointer ${
                isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-700'
              }`}
            >
              <span>Xem danh sách tin bài CMS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderCard7_MediaDirectives = () => (
    <div
      className={`w-full h-full min-h-[440px] rounded-2xl border p-4 shadow-xl flex flex-col justify-between ${
        isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50/70 border-amber-200'
      }`}
    >
      <div>
        <div className="flex items-center gap-2 border-b pb-3 mb-3 border-amber-500/20">
          <Zap className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
              3. Chỉ Đạo Truyền Thông Tác Chiến
            </h3>
            <p className={`text-[10px] ${isDark ? 'text-amber-400/80' : 'text-amber-700'}`}>
              Khuyến nghị định hướng báo chí
            </p>
          </div>
        </div>

        <div
          className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-slate-950/80 border-amber-500/20' : 'bg-white border-amber-200'
          }`}
        >
          <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {executiveReport?.mediaDirective ||
              'Chủ động phối hợp các cơ quan báo chí chính thống cung cấp thông tin kịp thời, minh bạch để định hướng dư luận thị trường tài chính.'}
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-amber-500/20 flex items-center gap-2 mt-3">
        <button
          onClick={() => onNavigateTab('briefing')}
          className="flex-1 py-2.5 px-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Dự Thảo Báo Cáo</span>
        </button>
        <button
          onClick={() => onNavigateTab('table')}
          className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
          }`}
        >
          <span>Xem Tin CMS</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  const renderCard8_TrendingBuzz = () => (
    <div className="w-full h-full min-h-[440px] flex flex-col">
      <TrendingBuzzWidget
        keywords={enrichedTrendingKeywords}
        newsItems={data?.news || []}
        isLoading={isLoading}
        onRefresh={onRefresh}
        lastUpdated={data?.vnEndTimeStr || data?.timeBounds?.vnEndTimeStr}
        onSelectKeyword={(kw) => {
          handleSearch(kw);
          onNavigateTab('table');
        }}
        sourceStats={data?.sourceStats || []}
        onOpenKeywordWeightModal={() => setShowKeywordWeightModal(true)}
      />
    </div>
  );

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-auto space-y-3 md:hidden">
      {/* Top Mobile & Tablet Navigation / Mode Switcher Bar */}
      <div
        className={`p-2.5 rounded-2xl border flex flex-col gap-2 shadow-sm ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-black min-w-0">
            <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
              <ListOrdered className="w-3.5 h-3.5" />
            </span>
            <span className={`truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {displayMode === 'swipe' ? 'Vuốt Ngang' : 'Lưới Responsive'}
            </span>
            {displayMode === 'swipe' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                Thẻ {activeCardIndex + 1}/{cardList.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Display Mode Toggle: Swipe vs Grid */}
            <div
              className={`p-0.5 rounded-xl border flex items-center ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
              }`}
            >
              <button
                onClick={() => setDisplayMode('swipe')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                  displayMode === 'swipe'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Chế độ vuốt ngang theo thẻ"
              >
                <Columns2 className="w-3 h-3" />
                <span className="hidden xs:inline">Vuốt Thẻ</span>
              </button>
              <button
                onClick={() => setDisplayMode('grid')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                  displayMode === 'grid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Chế độ lưới đa cột mật độ cao"
              >
                <LayoutGrid className="w-3 h-3" />
                <span className="hidden xs:inline">Lưới Grid</span>
              </button>
            </div>

            {displayMode === 'swipe' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevCard}
                  disabled={activeCardIndex === 0}
                  className={`p-1.5 rounded-xl border transition cursor-pointer ${
                    activeCardIndex === 0
                      ? 'opacity-40 cursor-not-allowed border-slate-700 text-slate-500'
                      : isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                      : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                  }`}
                  title="Thẻ trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextCard}
                  disabled={activeCardIndex === cardList.length - 1}
                  className={`p-1.5 rounded-xl border transition cursor-pointer ${
                    activeCardIndex === cardList.length - 1
                      ? 'opacity-40 cursor-not-allowed border-slate-700 text-slate-500'
                      : isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                      : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                  }`}
                  title="Thẻ tiếp"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Card Pill Selector in Swipe Mode */}
        {displayMode === 'swipe' && (
          <>
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 pt-0.5">
              {cardList.map((card, idx) => {
                const Icon = card.icon;
                const isActive = activeCardIndex === idx;
                return (
                  <button
                    key={card.id}
                    onClick={() => scrollToCard(idx)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md font-black scale-102'
                        : isDark
                        ? 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200'
                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-emerald-500'}`} />
                    <span>{card.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Pagination Dots */}
            <div className="flex items-center justify-center gap-1.5 pt-0.5">
              {cardList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToCard(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activeCardIndex === idx
                      ? 'w-6 bg-emerald-500'
                      : isDark
                      ? 'w-1.5 bg-slate-700 hover:bg-slate-500'
                      : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                  title={`Chuyển tới thẻ ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* RENDER MODE 1: SWIPEABLE CARDS ROW */}
      {displayMode === 'swipe' ? (
        <div className="w-full max-w-full min-w-0 overflow-x-auto">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="w-full max-w-full min-w-0 flex overflow-x-auto snap-x snap-mandatory overscroll-x-contain touch-pan-x custom-scrollbar gap-3.5 pb-2 pt-1 px-1 scroll-smooth scroll-pl-1 box-border"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          >
            {/* CARD 1: MARKET PULSE */}
            <div className="snap-start shrink-0 w-[88vw] sm:w-[380px] max-w-[420px] min-h-[460px] flex flex-col min-w-0 box-border">
              {renderCard1_MarketPulse()}
            </div>

            {/* CARD 2: SECTOR GROUPED NEWS */}
            <div className="snap-start shrink-0 w-[88vw] sm:w-[380px] max-w-[420px] min-h-[460px] flex flex-col min-w-0 box-border">
              {renderCard2_SectorGroups()}
            </div>

            {/* CARD 3: OPERATIONAL WORKFLOW */}
            <div className="snap-start shrink-0 w-[88vw] sm:w-[380px] max-w-[420px] min-h-[460px] flex flex-col min-w-0 box-border">
              {renderCard3_Workflow()}
            </div>

            {/* CARD 4: STRATEGIC OVERVIEW & ADVICE */}
            <div className="snap-start shrink-0 w-[88vw] sm:w-[380px] max-w-[420px] min-h-[460px] flex flex-col min-w-0 box-border">
              {renderCard4_StrategicAdvice()}
            </div>

            {/* CARD 5: CRISIS HOTSPOTS & RISKS */}
            <div className="snap-start shrink-0 w-[88vw] sm:w-[380px] max-w-[420px] min-h-[460px] flex flex-col min-w-0 box-border">
              {renderCard5_CrisisHotspots()}
            </div>

            {/* CARD 6: POSITIVE HIGHLIGHTS */}
            <div className="snap-start shrink-0 w-[88vw] sm:w-[380px] max-w-[420px] min-h-[460px] flex flex-col min-w-0 box-border">
              {renderCard6_PositiveHighlights()}
            </div>

            {/* CARD 7: MEDIA DIRECTIVES */}
            <div className="snap-start shrink-0 w-[88vw] sm:w-[380px] max-w-[420px] min-h-[460px] flex flex-col min-w-0 box-border">
              {renderCard7_MediaDirectives()}
            </div>

            {/* CARD 8: TRENDING BUZZ WIDGET */}
            <div className="snap-start shrink-0 w-[88vw] sm:w-[380px] max-w-[420px] min-h-[460px] flex flex-col min-w-0 box-border">
              {renderCard8_TrendingBuzz()}
            </div>
          </div>
        </div>
      ) : (
        /* RENDER MODE 2: TABLET / MOBILE RESPONSIVE CSS GRID */
        <div className="w-full max-w-full min-w-0 overflow-x-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 items-stretch w-full min-w-0 box-border">
            {/* Card 1: Market Pulse -> Full Width Hero */}
            <div className="col-span-1 sm:col-span-2 flex flex-col min-w-0">{renderCard1_MarketPulse()}</div>

            {/* Card 2: Sector News -> Full Width */}
            <div className="col-span-1 sm:col-span-2 flex flex-col min-w-0">{renderCard2_SectorGroups()}</div>

            {/* Card 3: Workflow -> Full Width */}
            <div className="col-span-1 sm:col-span-2 flex flex-col min-w-0">{renderCard3_Workflow()}</div>

            {/* Card 4: Strategic Advice -> 1 Col on Tablet */}
            <div className="col-span-1 flex flex-col min-w-0">{renderCard4_StrategicAdvice()}</div>

            {/* Card 5: Crisis Hotspots -> 1 Col on Tablet */}
            <div className="col-span-1 flex flex-col min-w-0">{renderCard5_CrisisHotspots()}</div>

            {/* Card 6: Positive Highlights -> 1 Col on Tablet */}
            <div className="col-span-1 flex flex-col min-w-0">{renderCard6_PositiveHighlights()}</div>

            {/* Card 7: Media Directives -> 1 Col on Tablet */}
            <div className="col-span-1 flex flex-col min-w-0">{renderCard7_MediaDirectives()}</div>

            {/* Card 8: Trending Buzz -> Full Width on Tablet */}
            <div className="col-span-1 sm:col-span-2 flex flex-col min-w-0">{renderCard8_TrendingBuzz()}</div>
          </div>
        </div>
      )}
    </div>
  );
};
