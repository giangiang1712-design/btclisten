import React, { useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import {
  TrendingUp,
  Minus,
  TrendingDown,
  PieChart as PieChartIcon,
  Info,
  Filter,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ScrapedNewsItem, SentimentOverview } from '../types';
import { useTheme } from '../lib/theme';
import { isRiskArticle, isBrightSpotArticle } from '../lib/newsClassification';

interface BatchSentimentDonutWidgetProps {
  newsItems: ScrapedNewsItem[];
  sentimentOverview?: SentimentOverview;
  onFilterSentiment?: (sentiment: 'bullish' | 'bearish' | 'neutral' | 'all') => void;
  selectedSentiment?: 'bullish' | 'bearish' | 'neutral' | 'all';
}

export const BatchSentimentDonutWidget: React.FC<BatchSentimentDonutWidgetProps> = ({
  newsItems,
  sentimentOverview,
  onFilterSentiment,
  selectedSentiment = 'all',
}) => {
  const { isDark } = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Compute breakdown from current scrape batch
  const batchStats = useMemo(() => {
    const total = newsItems.length;
    if (total === 0) {
      const bullishPct = sentimentOverview?.bullishPercentage ?? 0;
      const bearishPct = sentimentOverview?.bearishPercentage ?? 0;
      const neutralPct =
        sentimentOverview?.neutralPercentage ??
        Math.max(0, 100 - bullishPct - bearishPct);

      return {
        total: 0,
        bullish: { count: 0, percentage: bullishPct },
        neutral: { count: 0, percentage: neutralPct },
        bearish: { count: 0, percentage: bearishPct },
        dominant: neutralPct >= bullishPct && neutralPct >= bearishPct ? 'neutral' : bullishPct >= bearishPct ? 'bullish' : 'bearish',
      };
    }

    let bullishCount = 0;
    let bearishCount = 0;
    let neutralCount = 0;

    for (const item of newsItems) {
      if (item.sentiment === 'bullish' || isBrightSpotArticle(item)) {
        bullishCount++;
      } else if (item.sentiment === 'bearish' || isRiskArticle(item)) {
        bearishCount++;
      } else {
        neutralCount++;
      }
    }

    const bullishPct = Math.round((bullishCount / total) * 100);
    const bearishPct = Math.round((bearishCount / total) * 100);
    // Ensure sum is exactly 100%
    const neutralPct = Math.max(0, 100 - bullishPct - bearishPct);

    let dominant: 'bullish' | 'neutral' | 'bearish' = 'neutral';
    if (bullishPct > neutralPct && bullishPct >= bearishPct) dominant = 'bullish';
    else if (bearishPct > neutralPct && bearishPct > bullishPct) dominant = 'bearish';

    return {
      total,
      bullish: { count: bullishCount, percentage: bullishPct },
      neutral: { count: neutralCount, percentage: neutralPct },
      bearish: { count: bearishCount, percentage: bearishPct },
      dominant,
    };
  }, [newsItems, sentimentOverview]);

  // Chart data for Recharts Pie
  const chartData = useMemo(() => {
    return [
      {
        id: 'bullish',
        name: 'Tích cực (Bullish)',
        shortName: 'Tích cực',
        value: batchStats.bullish.count > 0 || batchStats.total === 0 ? batchStats.bullish.percentage : 0,
        count: batchStats.bullish.count,
        percentage: batchStats.bullish.percentage,
        color: '#10b981', // Emerald 500
        darkColor: '#059669',
        badgeBg: isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      {
        id: 'neutral',
        name: 'Trung tính (Neutral)',
        shortName: 'Trung tính',
        value: batchStats.neutral.count > 0 || batchStats.total === 0 ? batchStats.neutral.percentage : 0,
        count: batchStats.neutral.count,
        percentage: batchStats.neutral.percentage,
        color: '#f59e0b', // Amber 500
        darkColor: '#d97706',
        badgeBg: isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-800 border-amber-200',
      },
      {
        id: 'bearish',
        name: 'Tiêu cực / Cảnh báo (Bearish)',
        shortName: 'Tiêu cực',
        value: batchStats.bearish.count > 0 || batchStats.total === 0 ? batchStats.bearish.percentage : 0,
        count: batchStats.bearish.count,
        percentage: batchStats.bearish.percentage,
        color: '#f43f5e', // Rose 500
        darkColor: '#e11d48',
        badgeBg: isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200',
      },
    ];
  }, [batchStats, isDark]);

  // Custom Active Shape on Hover for smooth donut emphasis
  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
    } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))' }}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={outerRadius + 8}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.4}
        />
      </g>
    );
  };

  const dominantLabel = useMemo(() => {
    if (batchStats.dominant === 'bullish') return 'Tích cực chủ đạo';
    if (batchStats.dominant === 'bearish') return 'Cần theo dõi sát';
    return 'Cân bằng & Ổn định';
  }, [batchStats.dominant]);

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 shadow-sm transition-all ${
        isDark
          ? 'bg-slate-900/95 border-slate-800'
          : 'bg-white border-slate-200'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
            <PieChartIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-sm sm:text-base font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Cơ Cấu Sắc Thái Đợt Quét Hiện Tại
              </h3>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                isDark ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                Donut Breakdown
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Tỷ lệ phân bổ chi tiết 3 nhóm sắc thái: Tích cực (Bullish), Trung tính (Neutral), Tiêu cực (Bearish) trong đợt quét {batchStats.total} tin bài.
            </p>
          </div>
        </div>

        {/* Quick Reset Filter */}
        {selectedSentiment !== 'all' && onFilterSentiment && (
          <button
            onClick={() => onFilterSentiment('all')}
            className={`self-start sm:self-center px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
              isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
            }`}
          >
            <span>Hiển thị tất cả</span>
            <span className="text-[10px] bg-slate-700 text-white rounded px-1">✕</span>
          </button>
        )}
      </div>

      {/* Main Grid: Left Donut Chart | Right Detailed Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center mt-4">
        {/* Cột Trái: Donut Chart (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[220px]">
          <div className="w-full h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={2}
                  stroke={isDark ? '#0f172a' : '#ffffff'}
                  activeIndex={activeIndex !== null ? activeIndex : undefined}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_: any, index: number) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={(entry: any) => {
                    if (onFilterSentiment) {
                      const sentimentId = entry?.id || entry?.payload?.id;
                      if (sentimentId) {
                        onFilterSentiment(sentimentId as any);
                      }
                    }
                  }}
                  className="cursor-pointer outline-none"
                  {...({} as any)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={selectedSentiment === 'all' || selectedSentiment === entry.id ? 1 : 0.35}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [
                    `${val}% (${item?.payload?.count || 0} bài)`,
                    item?.payload?.name || name,
                  ]}
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Trung tâm Donut hiển thị Tổng số & Sắc thái chính */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Tổng đợt quét
              </span>
              <span className={`text-xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {batchStats.total} <span className="text-xs font-bold font-sans">bài</span>
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5 border ${
                batchStats.dominant === 'bullish'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : batchStats.dominant === 'bearish'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
              }`}>
                {dominantLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold mt-1 text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Tích cực
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              Trung tính
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              Tiêu cực
            </span>
          </div>
        </div>

        {/* Cột Phải: Chi Tiết 3 Khối Sắc Thái Tương Tác (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Bullish */}
          <div
            onClick={() => onFilterSentiment && onFilterSentiment('bullish')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedSentiment === 'bullish'
                ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/10 shadow-md'
                : isDark
                ? 'bg-slate-950/60 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900'
                : 'bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                    Tích Cực
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {batchStats.bullish.count} bài
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {batchStats.bullish.percentage}%
                </span>
                <span className="text-[10px] font-bold text-slate-400">tỷ trọng</span>
              </div>
            </div>

            {/* Progress mini bar */}
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${batchStats.bullish.percentage}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block truncate">
                Điểm sáng, tăng trưởng, đồng thuận
              </span>
            </div>
          </div>

          {/* Card 2: Neutral (Trung tính - Dedicated Metric) */}
          <div
            onClick={() => onFilterSentiment && onFilterSentiment('neutral')}
            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              selectedSentiment === 'neutral'
                ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-500/10 shadow-md'
                : isDark
                ? 'bg-slate-950/60 border-amber-500/30 hover:border-amber-500/60 hover:bg-slate-900'
                : 'bg-amber-50/40 border-amber-300/80 hover:border-amber-400 hover:bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Minus className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-black text-amber-800 dark:text-amber-300">
                    Trung Tính
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {batchStats.neutral.count} bài
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-2xl font-black font-mono text-amber-700 dark:text-amber-400">
                  {batchStats.neutral.percentage}%
                </span>
                <span className="text-[10px] font-bold text-slate-400">tỷ trọng</span>
              </div>
            </div>

            {/* Progress mini bar */}
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${batchStats.neutral.percentage}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block truncate">
                Thông tin sự vụ, hướng dẫn, cân bằng
              </span>
            </div>
          </div>

          {/* Card 3: Bearish (Tiêu cực / Rủi ro) */}
          <div
            onClick={() => onFilterSentiment && onFilterSentiment('bearish')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedSentiment === 'bearish'
                ? 'ring-2 ring-rose-500 border-rose-500 bg-rose-500/10 shadow-md'
                : isDark
                ? 'bg-slate-950/60 border-slate-800 hover:border-rose-500/40 hover:bg-slate-900'
                : 'bg-slate-50 border-slate-200 hover:border-rose-300 hover:bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    <TrendingDown className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-black text-rose-700 dark:text-rose-400">
                    Tiêu Cực
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {batchStats.bearish.count} bài
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                  {batchStats.bearish.percentage}%
                </span>
                <span className="text-[10px] font-bold text-slate-400">tỷ trọng</span>
              </div>
            </div>

            {/* Progress mini bar */}
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${batchStats.bearish.percentage}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block truncate">
                Rủi ro, phản ánh, áp lực thị trường
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Footer bar */}
      <div className={`mt-3.5 pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
        isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            <strong>Độ tin cậy sắc thái:</strong> {batchStats.bullish.percentage + batchStats.neutral.percentage}% luồng tin đạt trạng thái an toàn & tích cực.
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span>Khối lượng:</span>
          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
            {batchStats.total} bài viết
          </span>
        </div>
      </div>
    </div>
  );
};
