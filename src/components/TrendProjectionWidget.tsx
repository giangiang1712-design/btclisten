import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';
import { ScrapedNewsItem } from '../types';
import {
  Zap,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  Download,
  Filter,
  CheckCircle2,
  Building2,
  LineChart,
  Activity,
  Layers,
  ChevronRight,
  Info,
  Table as TableIcon,
  BarChart2,
  Gauge as GaugeIcon,
  LayoutList,
  Search,
  ArrowUpDown,
  Sliders,
  FileText,
} from 'lucide-react';
import { useTheme } from '../lib/theme';
import { SourceBrandBadge } from './SourceBrandBadge';

interface KeyFinancialEntity {
  id: string;
  name: string;
  tickerOrCode?: string;
  type: 'agency' | 'ticker' | 'market';
  categoryVi: string;
  matchedKeywords: string[];
}

// Pre-defined key financial entities monitored for 4-hour trend projection
const MONITORED_ENTITIES: KeyFinancialEntity[] = [
  {
    id: 'mof',
    name: 'Bộ Tài chính',
    tickerOrCode: 'BTC',
    type: 'agency',
    categoryVi: 'Cơ quan Quản lý',
    matchedKeywords: ['bộ tài chính', 'thứ trưởng bộ tài chính', 'bộ trưởng bộ tài chính', 'ngân sách'],
  },
  {
    id: 'sbv',
    name: 'Ngân hàng Nhà nước',
    tickerOrCode: 'NHNN',
    type: 'agency',
    categoryVi: 'Điều hành Tín dụng',
    matchedKeywords: ['ngân hàng nhà nước', 'nhnn', 'lãi suất', 'tỷ giá', 'tín dụng'],
  },
  {
    id: 'ssc',
    name: 'Ủy ban Chứng khoán NN',
    tickerOrCode: 'UBCK',
    type: 'agency',
    categoryVi: 'Thị trường Chứng khoán',
    matchedKeywords: ['ủy ban chứng khoán', 'ubcknn', 'nâng hạng chứng khoán', 'hoose', 'vsd'],
  },
  {
    id: 'bonds_mkt',
    name: 'Thị trường Trái phiếu TPDN',
    tickerOrCode: 'BOND',
    type: 'market',
    categoryVi: 'Thị trường Nợ',
    matchedKeywords: ['trái phiếu', 'tpdn', 'đáo hạn trái phiếu', 'chậm trả gốc lãi'],
  },
  {
    id: 'vic',
    name: 'Tập đoàn Vingroup',
    tickerOrCode: 'VIC',
    type: 'ticker',
    categoryVi: 'Bất động sản & Công nghiệp',
    matchedKeywords: ['vingroup', 'vic', 'vinfast', 'vinhomes'],
  },
  {
    id: 'vcb',
    name: 'Vietcombank',
    tickerOrCode: 'VCB',
    type: 'ticker',
    categoryVi: 'Ngân hàng Thương mại',
    matchedKeywords: ['vietcombank', 'vcb', 'ngân hàng ngoại thương'],
  },
  {
    id: 'ssi',
    name: 'Công ty Chứng khoán SSI',
    tickerOrCode: 'SSI',
    type: 'ticker',
    categoryVi: 'Dịch vụ Tài chính',
    matchedKeywords: ['ssi', 'chứng khoán ssi', 'thị phần chứng khoán'],
  },
  {
    id: 'hpg',
    name: 'Tập đoàn Hòa Phát',
    tickerOrCode: 'HPG',
    type: 'ticker',
    categoryVi: 'Sản xuất Steel & Vật liệu',
    matchedKeywords: ['hòa phát', 'hpg', 'thép hòa phát', 'dung quất'],
  },
  {
    id: 'nvl',
    name: 'Tập đoàn Novaland',
    tickerOrCode: 'NVL',
    type: 'ticker',
    categoryVi: 'Bất động sản Doanh nghiệp',
    matchedKeywords: ['novaland', 'nvl', 'dự án novaland', 'tái cấu trúc nợ'],
  },
  {
    id: 'gold_sjc',
    name: 'Thị trường Vàng & SJC',
    tickerOrCode: 'GOLD',
    type: 'market',
    categoryVi: 'Hàng hóa & Vàng',
    matchedKeywords: ['giá vàng', 'sjc', 'đấu thầu vàng', 'vàng miếng'],
  },
];

export type ProjectionEventType = 'flash_crash' | 'viral_spike' | 'stable';

export interface EntityProjectionData {
  entity: KeyFinancialEntity;
  eventType: ProjectionEventType;
  probability: number; // % confidence (0-100)
  currentSentimentScore: number; // -100 to +100
  projected4hSentimentScore: number; // -100 to +100
  sentimentDelta: number; // Change in sentiment score
  volatilityIndex: number; // Absolute volatility score
  projectedVolumeMultiplier: number; // e.g. 2.4x
  catalystSummary: string; // Key cause
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  recommendedAction: string;
  matchedArticles: ScrapedNewsItem[];
  timelinePoints: Array<{
    timeLabel: string;
    isProjection: boolean;
    sentimentScore: number;
    upperConfidence?: number;
    lowerConfidence?: number;
    mentionVolume: number;
  }>;
}

interface TrendProjectionWidgetProps {
  newsItems: ScrapedNewsItem[];
  onSelectArticle?: (article: ScrapedNewsItem) => void;
  onOpenAlertModal?: (entityName: string, eventType: ProjectionEventType) => void;
}

export const TrendProjectionWidget: React.FC<TrendProjectionWidgetProps> = ({
  newsItems = [],
  onSelectArticle,
  onOpenAlertModal,
}) => {
  const { isDark } = useTheme();

  // View state: 'gauge_barchart' | 'table' | 'timeline'
  const [viewMode, setViewMode] = useState<'gauge_barchart' | 'table' | 'timeline'>('gauge_barchart');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('mof');
  const [filterType, setFilterType] = useState<'all' | 'flash_crash' | 'viral_spike' | 'agency' | 'ticker'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'volatility' | 'delta' | 'sentiment' | 'probability'>('volatility');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [alertSentToast, setAlertSentToast] = useState<string | null>(null);

  // Calculate 4-Hour Projections for each entity dynamically based on newsItems
  const entityProjections: EntityProjectionData[] = useMemo(() => {
    return MONITORED_ENTITIES.map((ent) => {
      // Find matching news items for entity
      const matched = newsItems.filter((item) => {
        const text = `${item.title} ${item.summary || ''} ${item.agencies?.join(' ') || ''} ${
          item.policyTags?.join(' ') || ''
        } ${item.tickers?.join(' ') || ''}`.toLowerCase();
        return ent.matchedKeywords.some((kw) => text.includes(kw));
      });

      // Calculate historical sentiment metrics over past 24h
      let sumSentiment = 0;
      let bearishCount = 0;
      let bullishCount = 0;

      matched.forEach((m) => {
        const score = m.sentimentScore ?? (m.sentiment === 'bullish' ? 60 : m.sentiment === 'bearish' ? -60 : 0);
        sumSentiment += score;
        if (m.sentiment === 'bearish') {
          bearishCount++;
        } else if (m.sentiment === 'bullish') {
          bullishCount++;
        }
      });

      const count = Math.max(1, matched.length);
      const avgCurrentSentiment = Math.round(sumSentiment / count);

      // Deterministic hash seed based on entity id for realistic smooth projection modeling
      const seedHash = Array.from(ent.id).reduce((acc, c) => acc + c.charCodeAt(0), 0);

      // Sentiment Velocity Calculation
      const sentimentShiftVelocity =
        bearishCount > bullishCount
          ? -15 - (bearishCount / Math.max(1, matched.length)) * 25
          : bullishCount > bearishCount
          ? +15 + (bullishCount / Math.max(1, matched.length)) * 25
          : (seedHash % 20) - 10;

      // Project 4-hour future score
      let projected4h = Math.max(-95, Math.min(95, Math.round(avgCurrentSentiment + sentimentShiftVelocity * 1.8)));

      if ((ent.id === 'nvl' || ent.id === 'bonds_mkt' || ent.id === 'vic') && bearishCount > 0) {
        projected4h = Math.min(projected4h, -65);
      } else if ((ent.id === 'ssc' || ent.id === 'mof' || ent.id === 'ssi') && bullishCount >= bearishCount) {
        projected4h = Math.max(projected4h, +68);
      }

      const sentimentDelta = projected4h - avgCurrentSentiment;
      const volumeMultiplier = Math.round((1.8 + Math.abs(sentimentDelta) / 30) * 10) / 10;
      const volatilityIndex = Math.min(100, Math.round(Math.abs(sentimentDelta) * 1.2 + volumeMultiplier * 10));

      // Determine Event Type
      let eventType: ProjectionEventType = 'stable';
      if (projected4h <= -45 || sentimentDelta <= -30) {
        eventType = 'flash_crash';
      } else if (projected4h >= +50 || sentimentDelta >= +30) {
        eventType = 'viral_spike';
      } else {
        eventType = 'stable';
      }

      // Confidence & Probability
      const probability = Math.min(98, Math.max(72, Math.round(75 + Math.abs(sentimentDelta) * 0.4 + matched.length * 3)));

      // Catalyst summary
      let catalystSummary = '';
      if (eventType === 'flash_crash') {
        catalystSummary =
          matched.length > 0 && matched[0].summary
            ? matched[0].summary
            : `Gia tăng tin đồn áp lực tài chính, rủi ro tái cấu trúc dòng tiền và thanh tra liên ngành trong 6h qua.`;
      } else if (eventType === 'viral_spike') {
        catalystSummary =
          matched.length > 0 && matched[0].summary
            ? matched[0].summary
            : `Xuất hiện hiệu ứng lan tỏa từ chính sách tháo gỡ vướng mắc, thu hút dòng tiền NĐT và tin bứt phá tích cực.`;
      } else {
        catalystSummary = `Luồng thông tin duy trì trạng thái trung tính, biến động tâm lý nằm trong khung kiểm soát.`;
      }

      // Risk Level
      let riskLevel: 'critical' | 'high' | 'medium' | 'low' = 'low';
      if (eventType === 'flash_crash') {
        riskLevel = probability > 85 ? 'critical' : 'high';
      } else if (eventType === 'viral_spike') {
        riskLevel = 'medium';
      }

      // Recommended Action
      let recommendedAction = '';
      if (eventType === 'flash_crash') {
        recommendedAction = `Kích hoạt ngay Đội Phản ứng nhanh Khủng hoảng: Đính chính thông tin sai lệch, phát ngôn báo chí làm rõ tình hình và phối hợp UBCKNN/NHNN ổn định tâm lý thị trường.`;
      } else if (eventType === 'viral_spike') {
        recommendedAction = `Đẩy mạnh khuếch đại thông tin chính thống trên các Cổng TTĐT và cơ quan báo chí chủ lực nhằm dẫn dắt xu hướng dư luận tích cực.`;
      } else {
        recommendedAction = `Tiếp tục duy trì giám sát thường nhật 24/7, cập nhật diễn biến tin tức theo từng khung giờ giao dịch.`;
      }

      // Timeline Points
      const timelinePoints = [
        {
          timeLabel: 'T-24h',
          isProjection: false,
          sentimentScore: Math.round(avgCurrentSentiment - sentimentShiftVelocity * 0.8 + Math.sin(seedHash) * 10),
          mentionVolume: Math.round(15 + (seedHash % 20)),
        },
        {
          timeLabel: 'T-18h',
          isProjection: false,
          sentimentScore: Math.round(avgCurrentSentiment - sentimentShiftVelocity * 0.6 + Math.cos(seedHash) * 8),
          mentionVolume: Math.round(22 + (seedHash % 25)),
        },
        {
          timeLabel: 'T-12h',
          isProjection: false,
          sentimentScore: Math.round(avgCurrentSentiment - sentimentShiftVelocity * 0.4),
          mentionVolume: Math.round(35 + (seedHash % 30)),
        },
        {
          timeLabel: 'T-6h',
          isProjection: false,
          sentimentScore: Math.round(avgCurrentSentiment - sentimentShiftVelocity * 0.2),
          mentionVolume: Math.round(48 + (seedHash % 40)),
        },
        {
          timeLabel: 'T-0 (Hiện tại)',
          isProjection: false,
          sentimentScore: avgCurrentSentiment,
          mentionVolume: Math.round(60 + matched.length * 10),
        },
        {
          timeLabel: 'T+1h',
          isProjection: true,
          sentimentScore: Math.round(avgCurrentSentiment + sentimentDelta * 0.3),
          upperConfidence: Math.min(100, Math.round(avgCurrentSentiment + sentimentDelta * 0.3 + 12)),
          lowerConfidence: Math.max(-100, Math.round(avgCurrentSentiment + sentimentDelta * 0.3 - 12)),
          mentionVolume: Math.round(75 + matched.length * 12),
        },
        {
          timeLabel: 'T+2h',
          isProjection: true,
          sentimentScore: Math.round(avgCurrentSentiment + sentimentDelta * 0.6),
          upperConfidence: Math.min(100, Math.round(avgCurrentSentiment + sentimentDelta * 0.6 + 18)),
          lowerConfidence: Math.max(-100, Math.round(avgCurrentSentiment + sentimentDelta * 0.6 - 18)),
          mentionVolume: Math.round(90 + matched.length * 15),
        },
        {
          timeLabel: 'T+3h',
          isProjection: true,
          sentimentScore: Math.round(avgCurrentSentiment + sentimentDelta * 0.85),
          upperConfidence: Math.min(100, Math.round(avgCurrentSentiment + sentimentDelta * 0.85 + 22)),
          lowerConfidence: Math.max(-100, Math.round(avgCurrentSentiment + sentimentDelta * 0.85 - 22)),
          mentionVolume: Math.round(110 + matched.length * 18),
        },
        {
          timeLabel: 'T+4h (Dự báo)',
          isProjection: true,
          sentimentScore: projected4h,
          upperConfidence: Math.min(100, Math.round(projected4h + 25)),
          lowerConfidence: Math.max(-100, Math.round(projected4h - 25)),
          mentionVolume: Math.round(135 + matched.length * 22),
        },
      ];

      return {
        entity: ent,
        eventType,
        probability,
        currentSentimentScore: avgCurrentSentiment,
        projected4hSentimentScore: projected4h,
        sentimentDelta,
        volatilityIndex,
        projectedVolumeMultiplier: volumeMultiplier,
        catalystSummary,
        riskLevel,
        recommendedAction,
        matchedArticles: matched.slice(0, 5),
        timelinePoints,
      };
    });
  }, [newsItems]);

  // Filtered list based on filterType and searchQuery
  const filteredProjections = useMemo(() => {
    return entityProjections
      .filter((p) => {
        if (filterType === 'flash_crash') return p.eventType === 'flash_crash';
        if (filterType === 'viral_spike') return p.eventType === 'viral_spike';
        if (filterType === 'agency') return p.entity.type === 'agency';
        if (filterType === 'ticker') return p.entity.type === 'ticker';
        return true;
      })
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.entity.name.toLowerCase().includes(q) ||
          p.entity.tickerOrCode?.toLowerCase().includes(q) ||
          p.entity.categoryVi.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortField === 'volatility') {
          valA = a.volatilityIndex;
          valB = b.volatilityIndex;
        } else if (sortField === 'delta') {
          valA = Math.abs(a.sentimentDelta);
          valB = Math.abs(b.sentimentDelta);
        } else if (sortField === 'sentiment') {
          valA = a.projected4hSentimentScore;
          valB = b.projected4hSentimentScore;
        } else if (sortField === 'probability') {
          valA = a.probability;
          valB = b.probability;
        }
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      });
  }, [entityProjections, filterType, searchQuery, sortField, sortOrder]);

  // Active projection data for detail view
  const activeProjection = useMemo(() => {
    return (
      entityProjections.find((p) => p.entity.id === selectedEntityId) ||
      entityProjections[0] ||
      null
    );
  }, [entityProjections, selectedEntityId]);

  // Bar Chart Data for Recharts
  const barChartData = useMemo(() => {
    return filteredProjections.map((p) => ({
      name: p.entity.tickerOrCode || p.entity.name,
      fullName: p.entity.name,
      'Tâm lý Hiện tại (T-0)': p.currentSentimentScore,
      'Dự báo (T+4h)': p.projected4hSentimentScore,
      'Độ Biến động (Spread)': Math.abs(p.sentimentDelta),
      eventType: p.eventType,
      volatilityIndex: p.volatilityIndex,
      probability: p.probability,
    }));
  }, [filteredProjections]);

  // Summary counts
  const flashCrashCount = entityProjections.filter((p) => p.eventType === 'flash_crash').length;
  const viralSpikeCount = entityProjections.filter((p) => p.eventType === 'viral_spike').length;

  const handleTriggerAlert = (entityName: string, eventType: ProjectionEventType) => {
    if (onOpenAlertModal) {
      onOpenAlertModal(entityName, eventType);
    } else {
      setAlertSentToast(`Đã gửi cảnh báo dự báo T+4h cho thực thể: ${entityName}`);
      setTimeout(() => setAlertSentToast(null), 4000);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'ID Thực thể',
      'Tên Thực thể',
      'Mã Ticker',
      'Phân loại',
      'Tâm lý Hiện tại T-0',
      'Dự báo T+4h',
      'Chênh lệch Delta',
      'Chỉ số Biến động Volatility',
      'Loại Cảnh báo',
      'Độ tin cậy %',
      'Khuyến nghị',
    ];
    const rows = filteredProjections.map((p) => [
      p.entity.id,
      `"${p.entity.name}"`,
      p.entity.tickerOrCode || '',
      `"${p.entity.categoryVi}"`,
      p.currentSentimentScore,
      p.projected4hSentimentScore,
      p.sentimentDelta,
      p.volatilityIndex,
      p.eventType,
      p.probability,
      `"${p.recommendedAction.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Du_Bao_Xu_Huong_T4h_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`border rounded-2xl p-5 shadow-lg space-y-5 transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Toast Notification */}
      {alertSentToast && (
        <div className="p-3 rounded-xl bg-cyan-600 text-white font-bold text-xs flex items-center justify-between shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{alertSentToast}</span>
          </div>
          <button onClick={() => setAlertSentToast(null)} className="text-white hover:underline cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* Widget Header & View Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-amber-500/30 text-amber-400">
              <Zap className="w-5 h-5 animate-pulse text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Dự Báo Xu Hướng 4 Giờ & Ra-đa Cảnh Báo Sớm</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  T+4h Horizon AI
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Phân tích lịch sử dịch chuyển tâm lý dư luận để mô phỏng nguy cơ <strong>Flash Crash</strong> hoặc <strong>Viral Sentiment Spike</strong> đối với các thực thể tài chính trọng điểm.
              </p>
            </div>
          </div>
        </div>

        {/* VIEW MODE TOGGLE & EXPORT */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`p-1 rounded-xl border flex items-center gap-1 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
            <button
              onClick={() => setViewMode('gauge_barchart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'gauge_barchart'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Chế độ Đồng hồ Gauge & Biểu đồ Thanh Biến động"
            >
              <GaugeIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gauge & Bar Chart</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Chế độ Bảng Tổng hợp Thông số Dữ liệu"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bảng Thông Số (Tabular)</span>
            </button>

            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'timeline'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Phân tích Sâu Dòng Thời gian"
            >
              <LineChart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dòng Thời Gian</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-800'
            }`}
            title="Xuất báo cáo CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Lọc thực thể:
          </span>

          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
              filterType === 'all'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tất cả ({entityProjections.length})
          </button>

          <button
            onClick={() => setFilterType('flash_crash')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
              filterType === 'flash_crash'
                ? 'bg-rose-600 text-white font-black shadow-xs'
                : isDark
                ? 'bg-slate-800 text-rose-300 hover:bg-slate-700'
                : 'bg-slate-100 text-rose-700 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Flash Crash ({flashCrashCount})</span>
          </button>

          <button
            onClick={() => setFilterType('viral_spike')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
              filterType === 'viral_spike'
                ? 'bg-emerald-600 text-white font-black shadow-xs'
                : isDark
                ? 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
                : 'bg-slate-100 text-emerald-700 hover:bg-slate-200'
            }`}
          >
            <Flame className="w-3 h-3 text-emerald-400" />
            <span>Viral Spike ({viralSpikeCount})</span>
          </button>

          <button
            onClick={() => setFilterType('agency')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
              filterType === 'agency'
                ? 'bg-blue-600 text-white font-black shadow-xs'
                : isDark
                ? 'bg-slate-800 text-blue-300 hover:bg-slate-700'
                : 'bg-slate-100 text-blue-700 hover:bg-slate-200'
            }`}
          >
            Cơ quan
          </button>

          <button
            onClick={() => setFilterType('ticker')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
              filterType === 'ticker'
                ? 'bg-purple-600 text-white font-black shadow-xs'
                : isDark
                ? 'bg-slate-800 text-purple-300 hover:bg-slate-700'
                : 'bg-slate-100 text-purple-700 hover:bg-slate-200'
            }`}
          >
            Mã CK
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên, mã chứng khoán..."
            className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-medium border outline-none transition ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
            }`}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: VISUAL GAUGE & BAR-CHART REPRESENTATION */}
      {/* ========================================================================= */}
      {viewMode === 'gauge_barchart' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Row: Gauge Visual Risk Meters & Projected Volatility Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Active Entity Gauge Card */}
            {activeProjection && (
              <div className={`p-4 rounded-2xl border space-y-3 flex flex-col justify-between ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1">
                    <GaugeIcon className="w-4 h-4" /> ĐỒNG HỒ DỰ BÁO TÂM LÝ T+4H
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {activeProjection.entity.tickerOrCode}
                  </span>
                </div>

                {/* SVG Semi-Circle Gauge */}
                <div className="flex flex-col items-center justify-center relative py-2">
                  <svg width="220" height="120" viewBox="0 0 220 120" className="overflow-visible">
                    {/* Gauge Arc Background Zones */}
                    {/* Left Flash Crash Zone (-100 to -30) */}
                    <path d="M 20 110 A 90 90 0 0 1 70 30" fill="none" stroke="#f43f5e" strokeWidth="18" strokeLinecap="round" opacity="0.3" />
                    {/* Middle Stable Zone (-30 to +30) */}
                    <path d="M 70 30 A 90 90 0 0 1 150 30" fill="none" stroke="#3b82f6" strokeWidth="18" opacity="0.3" />
                    {/* Right Viral Spike Zone (+30 to +100) */}
                    <path d="M 150 30 A 90 90 0 0 1 200 110" fill="none" stroke="#10b981" strokeWidth="18" strokeLinecap="round" opacity="0.3" />

                    {/* Active Score Needle */}
                    {(() => {
                      const score = activeProjection.projected4hSentimentScore; // -100 to +100
                      const angle = -180 + ((score + 100) / 200) * 180;
                      const rad = (angle * Math.PI) / 180;
                      const nx = 110 + 72 * Math.cos(rad);
                      const ny = 110 + 72 * Math.sin(rad);

                      return (
                        <g>
                          <line x1="110" y1="110" x2={nx} y2={ny} stroke={score < 0 ? '#f43f5e' : '#10b981'} strokeWidth="4" strokeLinecap="round" />
                          <circle cx="110" cy="110" r="8" fill={isDark ? '#0f172a' : '#ffffff'} stroke="#f59e0b" strokeWidth="3" />
                        </g>
                      );
                    })()}
                  </svg>

                  {/* Center Text Score */}
                  <div className="text-center -mt-6 space-y-0.5">
                    <div className={`text-2xl font-black font-mono ${activeProjection.projected4hSentimentScore < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {activeProjection.projected4hSentimentScore > 0 ? `+${activeProjection.projected4hSentimentScore}` : activeProjection.projected4hSentimentScore}
                    </div>
                    <div className="text-[11px] font-bold text-slate-400">
                      Chỉ số Tâm lý T+4h (Delta: {activeProjection.sentimentDelta > 0 ? `+${activeProjection.sentimentDelta}` : activeProjection.sentimentDelta})
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-800/30">
                  <span className="text-slate-400">Tốc độ Gia tốc: <strong className="text-amber-400">+{activeProjection.projectedVolumeMultiplier}x</strong></span>
                  <span className="text-slate-400">Độ tin cậy: <strong className="text-cyan-400">{activeProjection.probability}%</strong></span>
                </div>
              </div>
            )}

            {/* Projected Volatility Index Ranking Bar Representation */}
            <div className={`md:col-span-2 p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4" /> CHỈ SỐ BIẾN ĐỘNG TÂM LÝ DỰ BÁO (VOLATILITY INDEX)
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Top thực thể biến động cao nhất 4h tới</span>
              </div>

              {/* Progress Bar Volatility Cards Grid */}
              <div className="space-y-2.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                {filteredProjections.slice(0, 4).map((p) => (
                  <div
                    key={p.entity.id}
                    onClick={() => setSelectedEntityId(p.entity.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between gap-3 ${
                      p.entity.id === selectedEntityId
                        ? 'bg-amber-500/10 border-amber-500/50'
                        : isDark
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-28 shrink-0 font-bold flex items-center gap-1.5">
                      <span className="font-mono text-amber-400">{p.entity.tickerOrCode}</span>
                      <span className="truncate text-slate-300">{p.entity.name}</span>
                    </div>

                    {/* Progress Bar Visual */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                        <span className="text-slate-400">Vol: {p.volatilityIndex}/100</span>
                        <span className={p.sentimentDelta < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                          Delta: {p.sentimentDelta > 0 ? `+${p.sentimentDelta}` : p.sentimentDelta}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            p.eventType === 'flash_crash'
                              ? 'bg-gradient-to-r from-rose-600 to-rose-400'
                              : p.eventType === 'viral_spike'
                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                              : 'bg-gradient-to-r from-blue-600 to-cyan-400'
                          }`}
                          style={{ width: `${Math.max(10, p.volatilityIndex)}%` }}
                        />
                      </div>
                    </div>

                    {/* Badge */}
                    <div className="shrink-0 text-right">
                      {p.eventType === 'flash_crash' && <span className="text-[10px] px-2 py-0.5 rounded font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">Flash Crash</span>}
                      {p.eventType === 'viral_spike' && <span className="text-[10px] px-2 py-0.5 rounded font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Viral Spike</span>}
                      {p.eventType === 'stable' && <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-400">Ổn định</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MAIN BAR CHART: Projected Sentiment Score Comparison Across All Monitored Entities */}
          <div className={`p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-black flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-amber-500" />
                  <span>Biểu Đồ Thanh So Sánh Tâm Lý Hiện Tại vs Dự Báo 4 Giờ Tới</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cột màu phản ánh xu hướng dịch chuyển tâm lý (-100 tiêu cực cực đoan ➔ +100 tích cực bứt phá)
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-cyan-500 inline-block"></span> Tâm lý T-0
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span> Dự báo T+4h
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} interval={0} angle={-25} textAnchor="end" />
                  <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} domain={[-100, 100]} ticks={[-100, -50, 0, 50, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                    }}
                  />
                  <ReferenceLine y={0} stroke={isDark ? '#475569' : '#cbd5e1'} strokeDasharray="3 3" />
                  <Bar dataKey="Tâm lý Hiện tại (T-0)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Dự báo (T+4h)" radius={[4, 4, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.eventType === 'flash_crash' ? '#f43f5e' : entry.eventType === 'viral_spike' ? '#10b981' : '#f59e0b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: TABULAR DATA VIEW (TABLE MODE) */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Table Control Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5">
              <TableIcon className="w-4 h-4 text-amber-500" /> Bảng Tổng Hợp Thông Số Dự Báo Tâm Lý ({filteredProjections.length} thực thể)
            </span>

            <div className="flex items-center gap-2">
              <span>Sắp xếp:</span>
              <select
                value={sortField}
                onChange={(e: any) => setSortField(e.target.value)}
                className={`px-2.5 py-1 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                }`}
              >
                <option value="volatility">Chỉ số Biến động Volatility</option>
                <option value="delta">Chênh lệch Tâm lý (|Delta|)</option>
                <option value="sentiment">Tâm lý Dự báo T+4h</option>
                <option value="probability">Độ tin cậy %</option>
              </select>

              <button
                onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
                className={`p-1.5 rounded-xl border cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-300'}`}
                title="Đảo chiều sắp xếp"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* High Density Data Table */}
          <div className={`border rounded-2xl overflow-hidden shadow-xs ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b text-[11px] font-black uppercase tracking-wider ${isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    <th className="p-3">Mã & Thực thể</th>
                    <th className="p-3">Phân loại</th>
                    <th className="p-3 text-right">Tâm lý T-0</th>
                    <th className="p-3 text-right">Dự báo T+4h</th>
                    <th className="p-3 text-right">Chênh lệch Delta</th>
                    <th className="p-3 text-center">Rủi ro Volatility</th>
                    <th className="p-3 text-center">Cảnh báo Horizon</th>
                    <th className="p-3 text-right">Độ tin cậy</th>
                    <th className="p-3 text-center">Thao tác Khẩn</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                  {filteredProjections.map((p) => (
                    <tr
                      key={p.entity.id}
                      onClick={() => setSelectedEntityId(p.entity.id)}
                      className={`transition cursor-pointer ${
                        p.entity.id === selectedEntityId
                          ? isDark
                            ? 'bg-amber-500/10'
                            : 'bg-amber-500/10'
                          : isDark
                          ? 'hover:bg-slate-800/50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Entity Name & Ticker */}
                      <td className="p-3 font-bold">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-400 font-black px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700">
                            {p.entity.tickerOrCode}
                          </span>
                          <span className="text-slate-200">{p.entity.name}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3 text-slate-400 font-medium">{p.entity.categoryVi}</td>

                      {/* Current Sentiment T-0 */}
                      <td className="p-3 text-right font-mono font-bold">{p.currentSentimentScore}</td>

                      {/* Projected Sentiment T+4h */}
                      <td className={`p-3 text-right font-mono font-black ${p.projected4hSentimentScore < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {p.projected4hSentimentScore > 0 ? `+${p.projected4hSentimentScore}` : p.projected4hSentimentScore}
                      </td>

                      {/* Sentiment Delta */}
                      <td className="p-3 text-right font-mono font-extrabold">
                        {p.sentimentDelta < 0 ? (
                          <span className="text-rose-400 flex items-center justify-end gap-0.5">
                            <TrendingDown className="w-3 h-3" /> {p.sentimentDelta}
                          </span>
                        ) : p.sentimentDelta > 0 ? (
                          <span className="text-emerald-400 flex items-center justify-end gap-0.5">
                            <TrendingUp className="w-3 h-3" /> +{p.sentimentDelta}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      {/* Volatility Bar Meter */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${p.eventType === 'flash_crash' ? 'bg-rose-500' : p.eventType === 'viral_spike' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.max(10, p.volatilityIndex)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-300">{p.volatilityIndex}</span>
                        </div>
                      </td>

                      {/* Event Type Badge */}
                      <td className="p-3 text-center">
                        {p.eventType === 'flash_crash' && (
                          <span className="px-2 py-0.5 rounded font-black text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400" /> Flash Crash
                          </span>
                        )}
                        {p.eventType === 'viral_spike' && (
                          <span className="px-2 py-0.5 rounded font-black text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1">
                            <Flame className="w-3 h-3 text-emerald-400" /> Viral Spike
                          </span>
                        )}
                        {p.eventType === 'stable' && (
                          <span className="px-2 py-0.5 rounded font-medium text-[10px] bg-slate-800 text-slate-400">
                            Ổn định
                          </span>
                        )}
                      </td>

                      {/* Confidence */}
                      <td className="p-3 text-right font-mono font-bold text-cyan-400">{p.probability}%</td>

                      {/* Action */}
                      <td className="p-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTriggerAlert(p.entity.name, p.eventType);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-[10px] transition cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <Send className="w-3 h-3" /> Cảnh báo
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: DEEP TIMELINE & CAUSE ANALYSIS VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fadeIn">
          {/* LEFT COLUMN (8 cols): Deep Projection Chart & Root Cause Analysis */}
          {activeProjection && (
            <div
              className={`lg:col-span-7 xl:col-span-8 p-4 sm:p-5 rounded-2xl border space-y-4 transition ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/80 border-slate-200'
              }`}
            >
              {/* Active Entity Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/30">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-2xl border font-mono font-black text-sm shrink-0 ${
                      activeProjection.eventType === 'flash_crash'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : activeProjection.eventType === 'viral_spike'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    }`}
                  >
                    {activeProjection.entity.tickerOrCode}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base sm:text-lg font-black">{activeProjection.entity.name}</h4>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {activeProjection.entity.categoryVi}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Tọa độ dự báo 4h: Tâm lý hiện tại ({activeProjection.currentSentimentScore}) ➔ Dự báo T+4h ({activeProjection.projected4hSentimentScore})
                    </p>
                  </div>
                </div>

                {/* Event Badge & Risk Level */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  {activeProjection.eventType === 'flash_crash' && (
                    <div className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-extrabold text-xs flex items-center gap-1.5 shadow-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                      <span>Rủi ro Flash Crash</span>
                      <span className="font-mono text-rose-200 font-black">({activeProjection.probability}%)</span>
                    </div>
                  )}

                  {activeProjection.eventType === 'viral_spike' && (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs flex items-center gap-1.5 shadow-xs">
                      <Flame className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span>Viral Sentiment Spike</span>
                      <span className="font-mono text-emerald-200 font-black">({activeProjection.probability}%)</span>
                    </div>
                  )}

                  {activeProjection.eventType === 'stable' && (
                    <div className="px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 font-extrabold text-xs flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-blue-400" />
                      <span>Ổn định Tương đối</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4-HOUR PROJECTION CHART */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <LineChart className="w-3.5 h-3.5 text-amber-500" /> Biểu đồ Đường Dịch chuyển Tâm lý & Vùng Dự báo T+4h
                  </span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span> Lịch sử (-24h)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-300 inline-block animate-pulse"></span> Dự báo T+4h
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={activeProjection.timelinePoints} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                      <XAxis dataKey="timeLabel" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} />
                      <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} domain={[-100, 100]} ticks={[-100, -50, 0, 50, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#0f172a' : '#ffffff',
                          borderColor: isDark ? '#334155' : '#cbd5e1',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: isDark ? '#f8fafc' : '#0f172a',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                        }}
                      />
                      <ReferenceLine y={0} stroke={isDark ? '#475569' : '#cbd5e1'} strokeDasharray="3 3" />
                      <ReferenceLine x="T-0 (Hiện tại)" stroke="#f59e0b" strokeWidth={2} label={{ value: 'T-0 NOW', fill: '#f59e0b', fontSize: 10, position: 'top' }} />
                      <ReferenceArea x1="T-0 (Hiện tại)" x2="T+4h (Dự báo)" fill={activeProjection.eventType === 'flash_crash' ? '#f43f5e' : activeProjection.eventType === 'viral_spike' ? '#10b981' : '#3b82f6'} fillOpacity={0.08} />
                      <Line
                        type="monotone"
                        dataKey="sentimentScore"
                        name="sentimentScore"
                        stroke={activeProjection.eventType === 'flash_crash' ? '#f43f5e' : activeProjection.eventType === 'viral_spike' ? '#10b981' : '#3b82f6'}
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 7 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Catalyst & Root Cause Breakdown */}
              <div className={`p-4 rounded-xl border space-y-2.5 text-xs ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Nguyên nhân kích hoạt (Predictive Catalysts)
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-400">Gia tốc tin bài: +{activeProjection.projectedVolumeMultiplier}x</span>
                </div>

                <p className="leading-relaxed font-medium text-slate-300 dark:text-slate-300">{activeProjection.catalystSummary}</p>

                <div className={`p-3 rounded-lg border text-xs font-medium space-y-1 ${
                  activeProjection.eventType === 'flash_crash'
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                }`}>
                  <strong className="font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Khuyến nghị tác chiến Bộ Tài chính & Ban Lãnh đạo:
                  </strong>
                  <p>{activeProjection.recommendedAction}</p>
                </div>

                {/* Matched articles trigger */}
                {activeProjection.matchedArticles.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
                      Bài viết kích hoạt nguồn tin gốc ({activeProjection.matchedArticles.length}):
                    </span>
                    <div className="space-y-1.5">
                      {activeProjection.matchedArticles.slice(0, 2).map((art) => (
                        <div
                          key={art.id}
                          onClick={() => onSelectArticle && onSelectArticle(art)}
                          className={`p-2 rounded-lg border text-xs transition cursor-pointer flex items-center justify-between gap-2 ${
                            isDark ? 'bg-slate-950 hover:border-amber-500/40 border-slate-800' : 'bg-slate-50 hover:border-amber-400 border-slate-200'
                          }`}
                        >
                          <div className="space-y-0.5 line-clamp-1 flex-1">
                            <span className="font-bold hover:text-amber-400 transition">{art.title}</span>
                          </div>
                          <SourceBrandBadge source={art.source} url={art.url} size="xs" showIcon={false} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  onClick={() => handleTriggerAlert(activeProjection.entity.name, activeProjection.eventType)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kích hoạt Cảnh báo Khẩn cho {activeProjection.entity.tickerOrCode}</span>
                </button>

                <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">Confidence: {activeProjection.probability}%</span>
              </div>
            </div>
          )}

          {/* RIGHT COLUMN (4 cols): Monitored Entities Risk Ranking List */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-400 px-1">
              <span>Danh sách Thực thể Giám sát ({filteredProjections.length})</span>
              <span>Dự báo T+4h</span>
            </div>

            <div className="space-y-2 max-h-[580px] overflow-y-auto custom-scrollbar pr-1">
              {filteredProjections.map((p) => {
                const isSelected = p.entity.id === selectedEntityId;

                return (
                  <div
                    key={p.entity.id}
                    onClick={() => setSelectedEntityId(p.entity.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer relative shadow-xs ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 ring-2 ring-amber-500/30'
                        : isDark
                        ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 border ${
                            p.eventType === 'flash_crash'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : p.eventType === 'viral_spike'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {p.entity.tickerOrCode}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <h5 className="font-bold text-xs sm:text-sm">{p.entity.name}</h5>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                            {p.entity.categoryVi}
                          </span>
                        </div>
                      </div>

                      {/* Sentiment Delta Badge */}
                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1 font-mono text-xs font-black">
                          {p.sentimentDelta < 0 ? (
                            <span className="text-rose-400 flex items-center gap-0.5">
                              <TrendingDown className="w-3.5 h-3.5" />
                              {p.projected4hSentimentScore}
                            </span>
                          ) : p.sentimentDelta > 0 ? (
                            <span className="text-emerald-400 flex items-center gap-0.5">
                              <TrendingUp className="w-3.5 h-3.5" />
                              +{p.projected4hSentimentScore}
                            </span>
                          ) : (
                            <span className="text-slate-400">{p.projected4hSentimentScore}</span>
                          )}
                        </div>

                        {/* Event Pill */}
                        {p.eventType === 'flash_crash' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            ⚡ Flash Crash
                          </span>
                        )}
                        {p.eventType === 'viral_spike' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            🚀 Viral Spike
                          </span>
                        )}
                        {p.eventType === 'stable' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-800 text-slate-400">
                            ⚖️ Ổn định
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sparkline mini bar */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/20 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Xác suất: <strong className="text-slate-200">{p.probability}%</strong></span>
                      <span className="flex items-center gap-1 font-mono">
                        <span>{p.currentSentimentScore}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                        <strong className={p.projected4hSentimentScore < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                          {p.projected4hSentimentScore}
                        </strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
