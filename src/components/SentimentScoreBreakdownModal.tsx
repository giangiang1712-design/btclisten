import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Layers,
  FileText,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Flame,
  Activity,
  Award,
  BookOpen,
  Mail,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { ScrapedNewsItem, formatNewsTimeDisplay } from '../types';
import { useTheme } from '../lib/theme';
import { SourceBrandBadge } from './SourceBrandBadge';
import { SentimentKeywordHighlighter } from './SentimentKeywordHighlighter';
import { ImpactChainViewer } from './ImpactChainViewer';
import { enrichArticleWithDiagnosticAndGap, decomposeSentimentScore } from '../lib/sentimentAndGapEngine';

interface SentimentScoreBreakdownModalProps {
  item: ScrapedNewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDraftStatement?: (item: ScrapedNewsItem) => void;
  onGmailAlert?: (item: ScrapedNewsItem) => void;
}

export const SentimentScoreBreakdownModal: React.FC<SentimentScoreBreakdownModalProps> = ({
  item,
  isOpen,
  onClose,
  onDraftStatement,
  onGmailAlert
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'breakdown' | 'highlight' | 'why' | 'chain'>('breakdown');
  const [copied, setCopied] = useState(false);

  // Enrich item with diagnostic and decomposition
  const enrichedItem = useMemo(() => {
    if (!item) return null;
    return enrichArticleWithDiagnosticAndGap(item);
  }, [item]);

  const diagnostic = enrichedItem?.sentimentDiagnostic;
  const decomposition = useMemo(() => {
    if (!enrichedItem) return null;
    return diagnostic?.decomposition || decomposeSentimentScore(enrichedItem);
  }, [enrichedItem, diagnostic]);

  if (!isOpen || !item || !enrichedItem || !decomposition) return null;

  const score = decomposition.totalScore;
  const isPositive = score > 10;
  const isNegative = score < -10;
  const isNeutral = !isPositive && !isNegative;

  // Prepare data for BarChart
  const chartData = [
    {
      name: 'Từ khóa cảm xúc',
      score: decomposition.keywordPolarityScore,
      maxPossible: 40,
      description: 'Đóng góp từ mật độ và trọng số từ khóa tích cực (+) hoặc rủi ro (-)'
    },
    {
      name: 'Ngữ cảnh chính sách',
      score: decomposition.policyContextScore,
      maxPossible: 25,
      description: 'Động lực thể chế, tháo gỡ khó khăn hoặc áp lực vướng mắc thực thi'
    },
    {
      name: 'Cường độ phản ánh',
      score: decomposition.impactIntensityScore,
      maxPossible: 20,
      description: 'Mức độ lan tỏa, quy mô tác động đến doanh nghiệp và thị trường'
    },
    {
      name: 'Uy tín & Lan truyền',
      score: decomposition.authorityBuzzScore,
      maxPossible: 15,
      description: 'Hệ số khuếch đại từ nguồn thông tấn chính thống và chỉ số Buzz'
    }
  ];

  // Full article text combining title, summary, snippet
  const fullTextToHighlight = [
    item.title ? `TIÊU ĐỀ: ${item.title}` : '',
    item.summary ? `TỔNG THUẬT: ${item.summary}` : '',
    item.snippet ? `TRÍCH ĐOẠN NỘI DUNG: ${item.snippet}` : '',
    item.sentimentReason ? `GHI CHÚ CHẨN ĐOÁN: ${item.sentimentReason}` : ''
  ].filter(Boolean).join('\n\n');

  const handleCopyReport = () => {
    const report = [
      `=== BÁO CÁO BÓC TÁCH THÀNH PHẦN CẢM XÚC (MOF SENTIMENT DIAGNOSTIC) ===`,
      `Tiêu đề: ${item.title}`,
      `Nguồn: ${item.source} | Lĩnh vực: ${item.sectorNameVi || item.sector}`,
      `Thời gian: ${formatNewsTimeDisplay(item)}`,
      `--------------------------------------------------`,
      `ĐIỂM SỐ TỔNG HỢP: ${score > 0 ? `+${score}` : score}/100 (${isPositive ? 'TÍCH CỰC' : isNegative ? 'TIÊU CỰC / CẢNH BÁO' : 'TRUNG TÍNH'})`,
      ``,
      `BÓC TÁCH 4 THÀNH PHẦN CẤU THÀNH:`,
      `1. Điểm phân cực từ khóa: ${decomposition.keywordPolarityScore > 0 ? `+${decomposition.keywordPolarityScore}` : decomposition.keywordPolarityScore}/40`,
      `2. Điểm ngữ cảnh chính sách: ${decomposition.policyContextScore > 0 ? `+${decomposition.policyContextScore}` : decomposition.policyContextScore}/25`,
      `3. Điểm cường độ phản ánh: ${decomposition.impactIntensityScore > 0 ? `+${decomposition.impactIntensityScore}` : decomposition.impactIntensityScore}/20`,
      `4. Điểm uy tín nguồn & Buzz: ${decomposition.authorityBuzzScore > 0 ? `+${decomposition.authorityBuzzScore}` : decomposition.authorityBuzzScore}/15`,
      ``,
      `GIẢI TRÌNH CỐT LÕI (WHY EXPLANATION):`,
      `${diagnostic?.whyExplanation || 'Chưa có giải trình.'}`,
      ``,
      `CÁC NHÂN TỐ THEN CHỐT:`,
      ...(diagnostic?.keyDrivers || []).map((d, i) => `  - ${d}`),
      ``,
      `TỪ KHÓA TÍCH CỰC PHÁT HIỆN: ${decomposition.positiveKeywords.join(', ') || 'Không có'}`,
      `TỪ KHÓA RỦI RO PHÁT HIỆN: ${decomposition.negativeKeywords.join(', ') || 'Không có'}`,
      `THUẬT NGỮ MOF PHÁT HIỆN: ${decomposition.mofDomainKeywords.join(', ') || 'Không có'}`,
      ``,
      `KẾ HOẠCH HÀNH ĐỘNG ĐỀ XUẤT: ${diagnostic?.actionablePlan?.title}`,
      ...(diagnostic?.actionablePlan?.steps || []).map(s => `  ${s}`)
    ].join('\n');

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-cyan-950/30'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-400/40'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-start justify-between gap-4 shrink-0 ${
            isDark ? 'bg-slate-900/90 border-slate-700/80' : 'bg-slate-50/90 border-slate-200'
          }`}
        >
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isPositive
                  ? isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : isNegative
                  ? isDark ? 'bg-rose-950/80 text-rose-300 border-rose-500/40' : 'bg-rose-100 text-rose-900 border-rose-300'
                  : isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}>
                ⚡ BÓC TÁCH THÀNH PHẦN & CƠ CHẾ ĐIỂM CẢM XÚC
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-bold border ${
                isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}>
                {item.sectorNameVi || item.sector}
              </span>
              <SourceBrandBadge source={item.source} url={item.url} size="xs" />
            </div>

            <h2 className="text-base sm:text-lg font-bold leading-snug line-clamp-2">
              {item.title}
            </h2>

            <div className={`text-xs flex items-center gap-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>🕒 {formatNewsTimeDisplay(item)}</span>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-cyan-500 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Bài viết gốc</span>
                </a>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition shrink-0 ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Score Gauge Banner */}
        <div
          className={`px-5 py-4 border-b shrink-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-center ${
            isPositive
              ? isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50/60 border-emerald-200'
              : isNegative
              ? isDark ? 'bg-rose-950/20 border-rose-900/40' : 'bg-rose-50/60 border-rose-200'
              : isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50 border-slate-200'
          }`}
        >
          {/* Left: Score Badge */}
          <div className="flex items-center gap-3">
            <div
              className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-mono font-black text-2xl border shadow-inner ${
                isPositive
                  ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-600 text-white border-emerald-700'
                  : isNegative
                  ? isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-rose-600 text-white border-rose-700'
                  : isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <span>{score > 0 ? `+${score}` : score}</span>
              <span className="text-[9px] font-sans font-normal opacity-80">/100</span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : isNegative ? (
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                ) : (
                  <Activity className="w-4 h-4 text-slate-400" />
                )}
                <span className="font-bold text-sm">
                  {isPositive ? 'TÍCH CỰC / ĐIỂM SÁNG' : isNegative ? 'TIÊU CỰC / CẢNH BÁO' : 'TRUNG TÍNH'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {score >= 60
                  ? 'Đột phá xuất sắc, hiệu ứng tích cực diện rộng'
                  : score >= 15
                  ? 'Ghi nhận kết quả tốt, chính sách thuận lợi'
                  : score <= -60
                  ? 'Rủi ro nghiêm trọng, nguy cơ khủng hoảng cao'
                  : score <= -15
                  ? 'Áp lực điều hành, xuất hiện vướng mắc/khiếu nại'
                  : 'Cập nhật số liệu thường nhật, trạng thái ổn định'}
              </p>
            </div>
          </div>

          {/* Center: Score Range Meter */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span className="text-rose-400">-100 (Cực nguy hại)</span>
              <span>0 (Trung tính)</span>
              <span className="text-emerald-400">+100 (Cực tích cực)</span>
            </div>
            <div className="h-3 w-full bg-slate-700/40 rounded-full overflow-hidden p-0.5 flex relative">
              {/* Center line marker */}
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-400 z-10"></div>
              {/* Progress bar fill */}
              {score >= 0 ? (
                <div
                  className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full ml-auto transition-all duration-500"
                  style={{
                    width: `${Math.min(50, (score / 100) * 50)}%`,
                    marginRight: 'auto',
                    marginLeft: '50%'
                  }}
                ></div>
              ) : (
                <div
                  className="h-full bg-linear-to-l from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(50, (Math.abs(score) / 100) * 50)}%`,
                    marginLeft: `${50 - Math.min(50, (Math.abs(score) / 100) * 50)}%`
                  }}
                ></div>
              )}
            </div>
          </div>

          {/* Right: Quick Highlights Summary */}
          <div className="flex items-center gap-2 justify-start md:justify-end flex-wrap text-xs">
            <div className={`px-2.5 py-1 rounded-lg border font-mono font-bold flex items-center gap-1.5 ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Buzz: {item.buzzScore || 50}</span>
            </div>
            <div className={`px-2.5 py-1 rounded-lg border font-mono font-bold flex items-center gap-1.5 ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>{decomposition.tokens.length} Từ khóa</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`flex items-center border-b px-5 gap-1 shrink-0 overflow-x-auto ${
          isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('breakdown')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'breakdown'
                ? isDark
                  ? 'border-indigo-400 text-indigo-400'
                  : 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Biểu đồ Thành phần</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('highlight')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'highlight'
                ? isDark
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Từ khóa Highlight ({decomposition.positiveKeywords.length + decomposition.negativeKeywords.length + decomposition.mofDomainKeywords.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('why')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'why'
                ? isDark
                  ? 'border-amber-400 text-amber-400'
                  : 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Giải trình & Kế hoạch</span>
          </button>

          {diagnostic?.impactChain && (
            <button
              type="button"
              onClick={() => setActiveTab('chain')}
              className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'chain'
                  ? isDark
                    ? 'border-rose-400 text-rose-400'
                    : 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Chuỗi Tác Động Hệ Quả</span>
            </button>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 grow">
          {/* TAB 1: Biểu đồ thành phần cảm xúc */}
          {activeTab === 'breakdown' && (
            <div className="space-y-6">
              {/* Component Bar Chart */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border ${
                  isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-400" />
                      <span>Trọng Số Đóng Góp Của 4 Thành Phần Cấu Thành</span>
                    </h3>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Mô hình định lượng hóa mức độ ảnh hưởng của ngữ nghĩa, chính sách, cường độ và lan truyền.
                    </p>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis
                        type="number"
                        domain={[-40, 40]}
                        tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: isDark ? '#cbd5e1' : '#334155', fontSize: 12, fontWeight: 600 }}
                        width={130}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className={`p-3 rounded-xl border shadow-xl text-xs space-y-1 ${
                                isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                              }`}>
                                <div className="font-bold text-sm">{data.name}</div>
                                <div className="flex items-center gap-2 font-mono">
                                  <span>Điểm số đóng góp:</span>
                                  <span className={`font-black ${data.score > 0 ? 'text-emerald-400' : data.score < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                    {data.score > 0 ? `+${data.score}` : data.score} điểm
                                  </span>
                                </div>
                                <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-700/50">
                                  {data.description}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine x={0} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={1.5} />
                      <Bar dataKey="score" radius={[4, 4, 4, 4]}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.score > 0
                                ? '#10b981' // emerald-500
                                : entry.score < 0
                                ? '#f43f5e' // rose-500
                                : '#94a3b8' // slate-400
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 4 Detail Pillar Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {chartData.map((col, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 transition ${
                      col.score > 0
                        ? isDark ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-emerald-50/50 border-emerald-200'
                        : col.score < 0
                        ? isDark ? 'bg-rose-950/20 border-rose-900/50' : 'bg-rose-50/50 border-rose-200'
                        : isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{col.name}</span>
                      <span
                        className={`text-xs font-mono font-black px-2 py-0.5 rounded border ${
                          col.score > 0
                            ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : col.score < 0
                            ? isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-rose-100 text-rose-900 border-rose-300'
                            : isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {col.score > 0 ? `+${col.score}` : col.score} / ±{col.maxPossible}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {col.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Detected Lexicon Pill Summary */}
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Tổng hợp các từ khóa tác động trực tiếp:</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {decomposition.positiveKeywords.map((w, idx) => (
                    <span
                      key={`pos-${idx}`}
                      className={`text-xs px-2 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                        isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                      <span>{w}</span>
                    </span>
                  ))}

                  {decomposition.negativeKeywords.map((w, idx) => (
                    <span
                      key={`neg-${idx}`}
                      className={`text-xs px-2 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                        isDark ? 'bg-rose-950/80 text-rose-300 border-rose-500/50' : 'bg-rose-100 text-rose-900 border-rose-300'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3 text-rose-500" />
                      <span>{w}</span>
                    </span>
                  ))}

                  {decomposition.mofDomainKeywords.map((w, idx) => (
                    <span
                      key={`mof-${idx}`}
                      className={`text-xs px-2 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                        isDark ? 'bg-amber-950/80 text-amber-300 border-amber-500/50' : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3 text-amber-500" />
                      <span>{w}</span>
                    </span>
                  ))}

                  {decomposition.positiveKeywords.length === 0 &&
                    decomposition.negativeKeywords.length === 0 &&
                    decomposition.mofDomainKeywords.length === 0 && (
                      <span className="text-xs italic text-slate-400">Không tìm thấy từ khóa cực đoan; bài viết duy trì văn phong trung tính.</span>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Highlight từ khóa trọng điểm trong văn bản */}
          {activeTab === 'highlight' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Trực Quan Hóa Từ Khóa Trọng Điểm Trong Văn Bản</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Nhấp chuột vào từng từ khóa để xem cơ chế tính điểm của thuật toán.
                  </p>
                </div>
              </div>

              <SentimentKeywordHighlighter
                text={fullTextToHighlight}
                positiveKeywords={decomposition.positiveKeywords}
                negativeKeywords={decomposition.negativeKeywords}
                mofDomainKeywords={decomposition.mofDomainKeywords}
              />
            </div>
          )}

          {/* TAB 3: Giải trình Vì sao & Kế hoạch hành động */}
          {activeTab === 'why' && (
            <div className="space-y-5">
              {/* Why Explanation Box */}
              <div
                className={`p-5 rounded-2xl border space-y-3 ${
                  isPositive
                    ? isDark ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : isNegative
                    ? isDark ? 'bg-rose-950/30 border-rose-800/60 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-900'
                    : isDark ? 'bg-slate-800/40 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Lý Giải Cốt Lõi (Vì sao {isPositive ? 'Tích Cực' : isNegative ? 'Tiêu Cực' : 'Trung Tính'}):</span>
                </div>
                <p className="text-sm leading-relaxed font-medium">
                  {diagnostic?.whyExplanation}
                </p>
              </div>

              {/* Key Drivers */}
              <div
                className={`p-5 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Các Nhân Tố Cấu Thành Mấu Chốt:</span>
                </h4>
                <div className="space-y-2">
                  {diagnostic?.keyDrivers.map((driver, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                        isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-white border-slate-200'
                      }`}
                    >
                      <span className="font-bold text-indigo-400 font-mono">0{idx + 1}.</span>
                      <span className="leading-relaxed font-medium">{driver}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Plan */}
              {diagnostic?.actionablePlan && (
                <div
                  className={`p-5 rounded-2xl border space-y-3.5 ${
                    isPositive
                      ? isDark ? 'bg-emerald-950/20 border-emerald-900/60' : 'bg-emerald-50/60 border-emerald-200'
                      : isNegative
                      ? isDark ? 'bg-amber-950/20 border-amber-900/60' : 'bg-amber-50/60 border-amber-200'
                      : isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>{diagnostic.actionablePlan.title}</span>
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {diagnostic.actionablePlan.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs leading-relaxed ${
                          isDark ? 'bg-slate-900/80 border-slate-700/80' : 'bg-white border-slate-200'
                        }`}
                      >
                        {step}
                      </div>
                    ))}
                  </div>

                  <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    isDark ? 'bg-slate-900/90 border-slate-700/80 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <span className="font-bold text-amber-500 shrink-0">🎯 Mục tiêu đầu ra:</span>
                    <span>{diagnostic.actionablePlan.targetOutcome}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Chuỗi Tác Động Hệ Quả */}
          {activeTab === 'chain' && diagnostic?.impactChain && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>Đường Truyền Dẫn & Lan Tỏa Rủi Ro Liên Ngành</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Phân tích hệ quả lan tỏa xuyên suốt 16 lĩnh vực chuyên môn của BTC.
                  </p>
                </div>
              </div>

              <ImpactChainViewer impactChain={diagnostic.impactChain} />
            </div>
          )}
        </div>

        {/* Modal Footer Toolbar */}
        <div
          className={`p-4 border-t flex items-center justify-between gap-3 shrink-0 flex-wrap ${
            isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyReport}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-xs ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : isDark
                  ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép báo cáo!' : 'Sao chép Phân tích Sắc thái'}</span>
            </button>

            {onDraftStatement && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDraftStatement(item);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  isDark
                    ? 'bg-indigo-950/70 text-indigo-300 border-indigo-700/60 hover:bg-indigo-900/80'
                    : 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Soạn Thông Cáo / Phản Hồi</span>
              </button>
            )}

            {onGmailAlert && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGmailAlert(item);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  isDark
                    ? 'bg-amber-950/70 text-amber-300 border-amber-700/60 hover:bg-amber-900/80'
                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Gửi Cảnh Báo Email</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                : 'bg-slate-200 text-slate-800 border-slate-300 hover:bg-slate-300'
            }`}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
