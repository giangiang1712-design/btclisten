import React, { useState, useRef, useMemo } from 'react';
import {
  Flame,
  Pause,
  Play,
  TrendingUp,
  TrendingDown,
  Clock,
  X,
  RotateCw,
  Zap,
} from 'lucide-react';
import { ScrapedNewsItem } from '../types';
import { useTheme } from '../lib/theme';
import { getSourceBrandMeta } from '../lib/sourceBrand';
import { decodeHtmlEntities } from '../lib/htmlDecoder';

interface LiveTickerTapeProps {
  articles: ScrapedNewsItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onSelectArticle?: (article: ScrapedNewsItem) => void;
  onOpenAdvisorWithArticle?: (article: ScrapedNewsItem) => void;
}

export const LiveTickerTape: React.FC<LiveTickerTapeProps> = ({
  articles,
  isLoading = false,
  onRefresh,
  onSelectArticle,
  onOpenAdvisorWithArticle,
}) => {
  const { isDark } = useTheme();
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [tickerSpeed, setTickerSpeed] = useState<'normal' | 'slow' | 'fast'>('normal');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Take top 20 most recent / relevant articles
  const tickerArticles = useMemo(() => {
    if (!articles || articles.length === 0) return [];
    return [...articles].slice(0, 20);
  }, [articles]);

  // Construct duplicate loops to ensure smooth infinite marquee animation even with few items
  const repeatedItems = useMemo(() => {
    if (tickerArticles.length === 0) return [];
    // If fewer than 6 items, repeat to create a rich continuous tape
    const repeatMultiplier = tickerArticles.length < 4 ? 4 : tickerArticles.length < 8 ? 3 : 2;
    const items: { item: ScrapedNewsItem; loopKey: string }[] = [];
    for (let r = 0; r < repeatMultiplier; r++) {
      tickerArticles.forEach((art, idx) => {
        items.push({ item: art, loopKey: `loop-${r}-${art.id || idx}` });
      });
    }
    return items;
  }, [tickerArticles]);

  const speedDurationClass =
    tickerSpeed === 'slow' ? 'duration-[90s]' : tickerSpeed === 'fast' ? 'duration-[35s]' : 'duration-[55s]';

  return (
    <div
      id="live-ticker-tape-container"
      className={`relative z-40 border-b overflow-hidden transition-all select-none ${
        isDark
          ? 'bg-slate-950/95 border-slate-800/90 text-slate-200 shadow-md'
          : 'bg-slate-900 text-slate-100 border-slate-800 shadow-sm'
      }`}
    >
      {isCollapsed ? (
        <div className="flex items-center justify-between px-3 py-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="font-bold text-[11px] uppercase tracking-wider text-rose-400">
              TIN NÓNG 5 PHÚT (Đã thu gọn)
            </span>
            <span className="text-slate-400 text-[10px]">
              • {tickerArticles.length} tin tức thời gian thực từ 150+ nguồn báo
            </span>
          </div>
          <button
            onClick={() => setIsCollapsed(false)}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold px-2 py-0.5 rounded hover:bg-slate-800 transition cursor-pointer"
          >
            Mở rộng
          </button>
        </div>
      ) : (
        <div className="flex flex-nowrap items-center h-9 sm:h-10 max-h-10 overflow-hidden w-full">
          {/* Ticker Lead Label */}
          <div
            className={`flex items-center flex-nowrap gap-2 px-3 sm:px-4 h-full shrink-0 z-10 border-r whitespace-nowrap ${
              isDark
                ? 'bg-gradient-to-r from-rose-950/80 to-slate-900 border-slate-800 text-rose-300'
                : 'bg-gradient-to-r from-rose-900 to-slate-900 border-slate-800 text-rose-200'
            }`}
          >
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <div className="flex items-center gap-1.5 font-black text-[11px] sm:text-xs tracking-wider uppercase whitespace-nowrap shrink-0">
              <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-500/30 shrink-0 animate-bounce" />
              <span className="inline-block whitespace-nowrap">TIN NÓNG 5 PHÚT</span>
            </div>
            <span className="hidden lg:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
              150+ BÁO
            </span>
          </div>

          {/* Marquee Scrolling Content */}
          <div
            ref={containerRef}
            className="flex-1 overflow-hidden relative h-full flex items-center min-w-0"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {tickerArticles.length === 0 ? (
              <div className="flex items-center gap-2 px-4 text-xs text-slate-400 italic">
                {isLoading ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                    <span>Đang nạp luồng tin nóng 5 phút từ 150+ nguồn báo chí...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Sẵn sàng tiếp nhận tin nóng 5 phút • Nhấn Quét tin để nạp dữ liệu trực tiếp</span>
                    {onRefresh && (
                      <button
                        onClick={onRefresh}
                        className="ml-2 px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[10px] border border-rose-500/30 cursor-pointer not-italic transition"
                      >
                        Quét ngay
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div
                className={`flex flex-nowrap items-center gap-6 whitespace-nowrap will-change-transform animate-marquee ${
                  isPaused ? '[animation-play-state:paused]' : ''
                } ${speedDurationClass}`}
              >
                {repeatedItems.map(({ item: art, loopKey }) => {
                  const isCrisis = art.sentiment === 'bearish' || art.isEmergency || art.isUrgent || art.impactLevel === 'high';
                  const isPositive = art.sentiment === 'bullish';
                  const cleanTitle = decodeHtmlEntities(art.title || 'Tin tức thị trường');
                  const sourceDisplay = art.sourceName || art.source || 'Báo chí';

                  return (
                    <div
                      key={loopKey}
                      onClick={() => onSelectArticle && onSelectArticle(art)}
                      className="inline-flex shrink-0 items-center gap-2 cursor-pointer group hover:bg-slate-800/80 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
                    >
                      {/* Sentiment / Bullet Icon */}
                      {isCrisis ? (
                        <span className="p-0.5 rounded bg-rose-500/20 text-rose-400 shrink-0">
                          <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                      ) : isPositive ? (
                        <span className="p-0.5 rounded bg-emerald-500/20 text-emerald-400 shrink-0">
                          <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                      )}

                      {/* Source pill */}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded border font-mono shrink-0 whitespace-nowrap ${
                          isDark
                            ? 'bg-slate-900 border-slate-700 text-indigo-300'
                            : 'bg-slate-800 border-slate-700 text-sky-300'
                        }`}
                      >
                        {sourceDisplay}
                      </span>

                      {/* Headline */}
                      <span
                        className={`text-xs font-semibold group-hover:text-indigo-300 group-hover:underline transition-colors max-w-[280px] sm:max-w-[420px] md:max-w-[550px] truncate whitespace-nowrap inline-block ${
                          isCrisis
                            ? 'text-rose-300 font-bold'
                            : isPositive
                            ? 'text-emerald-300 font-bold'
                            : 'text-slate-200'
                        }`}
                      >
                        {cleanTitle}
                      </span>

                      {/* Published time tag */}
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 shrink-0 whitespace-nowrap">
                        <Clock className="w-2.5 h-2.5 opacity-60" />
                        {art.publishedTimeStr || art.timeAgo || 'Vừa quét'}
                      </span>

                      {/* Divider bullet */}
                      <span className="text-slate-600 font-bold mx-1 shrink-0">◆</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Controls Bar on Right Side */}
          <div
            className={`flex items-center flex-nowrap gap-1.5 px-2.5 h-full shrink-0 border-l whitespace-nowrap ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-slate-800'
            }`}
          >
            {/* Pause / Play button */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
              title={isPaused ? 'Tiếp tục chạy ticker' : 'Tạm dừng ticker'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            {/* Speed toggle */}
            <button
              onClick={() =>
                setTickerSpeed(tickerSpeed === 'normal' ? 'slow' : tickerSpeed === 'slow' ? 'fast' : 'normal')
              }
              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
              title={`Tốc độ: ${tickerSpeed.toUpperCase()} (Bấm để đổi)`}
            >
              {tickerSpeed === 'slow' ? '0.75x' : tickerSpeed === 'fast' ? '1.5x' : '1.0x'}
            </button>

            {/* Collapse toggle */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition ml-0.5 cursor-pointer"
              title="Thu gọn Ticker Tape"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
