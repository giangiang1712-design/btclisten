import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { TimelineDataPoint, SectorStat } from '../types';
import { BarChart3, LineChart } from 'lucide-react';

interface AnalyticsChartsProps {
  timelineData: TimelineDataPoint[];
  sectorStats: SectorStat[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  timelineData,
  sectorStats,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-sans text-white">
      {/* Chart 1: Timeline Flow of news in the past 60 mins */}
      <div className="bg-black border-2 border-zinc-700 rounded-xl p-4 shadow-md transition-colors text-white">
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-white" />
            <h3 className="text-sm font-black tracking-tight text-white uppercase">
              Phân Bổ Dòng Tin Trong 60 Phút Qua
            </h3>
          </div>
          <span className="text-[11px] font-mono font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            Mỗi 10 phút
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {/* Pure Monochrome Area Gradients & SVG Patterns */}
                <linearGradient id="monoColorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0.02} />
                </linearGradient>
                <pattern id="monoBearishPattern" width="6" height="6" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="6" x2="6" y2="0" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />
                </pattern>
              </defs>
              <XAxis dataKey="timeLabel" stroke="#d4d4d8" fontSize={11} tick={{ fill: '#e4e4e7', fontWeight: 600 }} />
              <YAxis stroke="#d4d4d8" fontSize={11} tick={{ fill: '#e4e4e7', fontWeight: 600 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#000000',
                  borderColor: '#ffffff',
                  borderWidth: '2px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)',
                }}
              />
              <Area
                type="monotone"
                dataKey="articleCount"
                name="Tổng số tin"
                stroke="#ffffff"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#monoColorCount)"
              />
              <Area
                type="monotone"
                dataKey="bearishCount"
                name="Tin tiêu cực/rủi ro"
                stroke="#a1a1aa"
                strokeDasharray="4 4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#monoBearishPattern)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Sector Sentiment Distribution */}
      <div className="bg-black border-2 border-zinc-700 rounded-xl p-4 shadow-md transition-colors text-white">
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-white" />
            <h3 className="text-sm font-black tracking-tight text-white uppercase">
              Cơ Cấu Sắc Thái Cảm Xúc Theo Lĩnh Vực
            </h3>
          </div>
          <span className="text-[11px] font-mono font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            Tích cực vs Tiêu cực
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sectorStats.map((s) => ({
                name: s.name.split('&')[0].trim(),
                bullish: s.bullishCount,
                bearish: s.bearishCount,
                neutral: s.neutralCount,
              }))}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                {/* Monochrome Bar Pattern Texture */}
                <pattern id="barBearishHatch" width="4" height="4" patternUnits="userSpaceOnUse">
                  <path d="M 0 4 L 4 0" stroke="#000000" strokeWidth="1" />
                </pattern>
              </defs>
              <XAxis dataKey="name" stroke="#d4d4d8" fontSize={11} tick={{ fill: '#e4e4e7', fontWeight: 600 }} />
              <YAxis stroke="#d4d4d8" fontSize={11} tick={{ fill: '#e4e4e7', fontWeight: 600 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#000000',
                  borderColor: '#ffffff',
                  borderWidth: '2px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px', color: '#ffffff', fontWeight: 700 }} />
              <Bar dataKey="bullish" name="Tích cực (White)" fill="#ffffff" radius={[2, 2, 0, 0]} />
              <Bar dataKey="neutral" name="Trung lập (Medium Gray)" fill="#71717a" radius={[2, 2, 0, 0]} />
              <Bar dataKey="bearish" name="Tiêu cực (Dark Hatch)" fill="#27272a" stroke="#ffffff" strokeWidth={1} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

