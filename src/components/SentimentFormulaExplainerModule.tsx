import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Cell,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { ScrapedNewsItem } from '../types';
import { useTheme } from '../lib/theme';
import { loadAlertThresholdConfig } from '../lib/alertTriggers';
import {
  GitFork,
  Sliders,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Zap,
  Sparkles,
  Calculator,
  ArrowRight,
  ShieldAlert,
  Scale,
  Search,
  BookOpen,
  Layers,
  ChevronRight,
  PieChart,
} from 'lucide-react';

interface SentimentFormulaExplainerModuleProps {
  newsItems: ScrapedNewsItem[];
  onSelectArticle?: (art: ScrapedNewsItem) => void;
}

export const SentimentFormulaExplainerModule: React.FC<SentimentFormulaExplainerModuleProps> = ({
  newsItems,
  onSelectArticle,
}) => {
  const { isDark } = useTheme();

  // Active View Tab inside Explainer: 'tree' | 'scatter' | 'simulator' | 'formulas'
  const [activeView, setActiveView] = useState<'tree' | 'scatter' | 'simulator' | 'formulas'>('tree');

  // Selected article for RAG / detail inspection
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // INTERACTIVE SIMULATOR STATE
  // ---------------------------------------------------------------------------
  const [simPosFreq, setSimPosFreq] = useState<number>(3);
  const [simPosWeight, setSimPosWeight] = useState<number>(25);
  const [simNegFreq, setSimNegFreq] = useState<number>(2);
  const [simNegWeight, setSimNegWeight] = useState<number>(30);
  const [simAgeHours, setSimAgeHours] = useState<number>(1.5);
  const [simSourceMultiplier, setSimSourceMultiplier] = useState<number>(1.25); // Official MoF = 1.25
  const [simContextReversal, setSimContextReversal] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // DYNAMIC CALCULATIONS FOR SIMULATOR
  // ---------------------------------------------------------------------------
  const simDecayFactor = useMemo(() => {
    // Decay formula: e^(-0.05 * hours)
    return Math.max(0.4, Math.exp(-0.05 * simAgeHours));
  }, [simAgeHours]);

  const simCalculated = useMemo(() => {
    let rawPos = simPosFreq * simPosWeight;
    let rawNeg = simNegFreq * simNegWeight;

    // Apply Context Reversal: If AI detects prevention/mitigation ("xử lý nợ xấu"), 45% of neg score converts to pos
    if (simContextReversal) {
      const converted = rawNeg * 0.45;
      rawNeg = rawNeg * 0.55;
      rawPos += converted;
    }

    // Apply Source Multiplier & Time Decay
    const posScore = Math.min(100, Math.round(rawPos * simSourceMultiplier * simDecayFactor));
    const crisisScore = Math.min(100, Math.round(rawNeg * simSourceMultiplier * simDecayFactor));

    // Base 50 + Net Impact
    const netImpact = (posScore - crisisScore) * 0.5;
    const finalSentiment = Math.max(0, Math.min(100, Math.round(50 + netImpact)));

    // Chuẩn hóa Điểm Áp Lực Nguy Cơ (Calculated Risk Pressure Score)
    // Mốc chuẩn hóa 86: <= 86 điểm là Vùng Bình Thường (Chưa Cảnh Báo)
    // Chỉ khi điểm áp lực vượt > 86 mới kích hoạt Cảnh báo Rủi ro
    const riskPressureScore = Math.min(100, Math.round(crisisScore * 1.05 + (finalSentiment < 40 ? 15 : 0)));
    const isAlertActive = riskPressureScore > 86;

    let classification: 'ACUTE_CRISIS' | 'MODERATE_RISK' | 'NORMAL_UNALERTED' | 'POSITIVE' = 'NORMAL_UNALERTED';
    if (riskPressureScore >= 95) {
      classification = 'ACUTE_CRISIS';
    } else if (riskPressureScore > 86) {
      classification = 'MODERATE_RISK';
    } else if (finalSentiment >= 60) {
      classification = 'POSITIVE';
    } else {
      classification = 'NORMAL_UNALERTED';
    }

    return {
      rawPos,
      rawNeg,
      posScore,
      crisisScore,
      riskPressureScore,
      isAlertActive,
      finalSentiment,
      classification,
      decayFactor: simDecayFactor,
    };
  }, [simPosFreq, simPosWeight, simNegFreq, simNegWeight, simAgeHours, simSourceMultiplier, simContextReversal, simDecayFactor]);

  // ---------------------------------------------------------------------------
  // SCATTER PLOT DATA GENERATION (FROM REAL FEED OR SIMULATED)
  // ---------------------------------------------------------------------------
  const scatterPlotData = useMemo(() => {
    const items = newsItems && newsItems.length > 0 ? newsItems : [];

    if (items.length === 0) {
      // Dummy rich dataset for visualization
      return [
        { id: 'd1', title: 'Thu ngân sách ngành thuế đạt 88% dự toán', hoursAgo: 0.5, crisisScore: 10, positiveScore: 85, sentimentScore: 88, source: 'Cổng TT Bộ Tài chính', keywordCount: 5, category: 'TÍCH CỰC' },
        { id: 'd2', title: 'Khởi tố vụ án thao túng giá chứng khoán', hoursAgo: 1.2, crisisScore: 90, positiveScore: 15, sentimentScore: 12, source: 'Báo Đầu Tư', keywordCount: 8, category: 'NGUY CƠ' },
        { id: 'd3', title: 'Vốn FDI giải ngân đạt kỷ lục 14 tỷ USD', hoursAgo: 2.0, crisisScore: 12, positiveScore: 78, sentimentScore: 82, source: 'VTV News', keywordCount: 6, category: 'TÍCH CỰC' },
        { id: 'd4', title: 'Căng thẳng thanh khoản trái phiếu doanh nghiệp', hoursAgo: 3.5, crisisScore: 82, positiveScore: 20, sentimentScore: 22, source: 'CafeF', keywordCount: 7, category: 'NGUY CƠ' },
        { id: 'd5', title: 'Thị trường vàng biến động nhẹ trong phiên', hoursAgo: 4.0, crisisScore: 35, positiveScore: 40, sentimentScore: 52, source: 'VNExpress', keywordCount: 3, category: 'TRUNG LẬP' },
        { id: 'd6', title: 'Hải quan triển khai thông quan tự động 24/7', hoursAgo: 5.5, crisisScore: 15, positiveScore: 75, sentimentScore: 79, source: 'Báo Hải Quan', keywordCount: 4, category: 'TÍCH CỰC' },
        { id: 'd7', title: 'Cảnh báo lừa đảo ứng dụng danh nghĩa thuế', hoursAgo: 6.0, crisisScore: 75, positiveScore: 25, sentimentScore: 28, source: 'Báo Tài Chính', keywordCount: 5, category: 'NGUY CƠ' },
        { id: 'd8', title: 'Chính phủ phê duyệt gói hỗ trợ lãi suất', hoursAgo: 8.0, crisisScore: 22, positiveScore: 80, sentimentScore: 76, source: 'Chinhphu.vn', keywordCount: 6, category: 'TÍCH CỰC' },
      ];
    }

    return items.map((art, idx) => {
      const pubMs = art.publishedTimestamp || (art.publishedAt ? Date.parse(art.publishedAt) : Date.now());
      const hoursAgo = Math.max(0.1, Number(((Date.now() - pubMs) / 3600000).toFixed(1)));
      const sent = typeof art.sentimentScore === 'number' ? art.sentimentScore : 50;
      const isBearish = art.sentiment === 'bearish';
      const isBullish = art.sentiment === 'bullish';

      // Calculate relative crisis score and positive score from article metadata
      let crisisScore = isBearish ? Math.min(100, Math.round((100 - Math.max(0, sent)) * 1.1)) : Math.round((100 - Math.max(0, sent)) * 0.4);
      let positiveScore = isBullish ? Math.min(100, Math.round(Math.max(0, sent) * 1.05)) : Math.round(Math.max(0, sent) * 0.5);

      let category: 'NGUY CƠ' | 'TRUNG LẬP' | 'TÍCH CỰC' = 'TRUNG LẬP';
      if (sent < 40) category = 'NGUY CƠ';
      else if (sent >= 60) category = 'TÍCH CỰC';

      return {
        id: art.id || `art-${idx}`,
        title: art.title,
        hoursAgo,
        crisisScore,
        positiveScore,
        sentimentScore: sent,
        source: art.source || 'Báo chí',
        keywordCount: (art.keyPeople?.length || 0) + (art.tickers?.length || 0) + 3,
        category,
        originalItem: art,
      };
    });
  }, [newsItems]);

  // Selected item for Scatter detail inspection
  const activeScatterArticle = useMemo(() => {
    if (!selectedArticleId) return scatterPlotData[0] || null;
    return scatterPlotData.find((d) => d.id === selectedArticleId) || scatterPlotData[0] || null;
  }, [selectedArticleId, scatterPlotData]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ------------------------------------------------------------------ */}
      {/* MODULE HEADER BAR */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={`p-5 rounded-2xl border ${
          isDark
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-slate-800'
            : 'bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-slate-800 shadow-md'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>Algorithmic Sentiment & Crisis Engine Specifications</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Trực Quan Hóa Thuật Toán "Điểm Sáng" & "Nguy Cơ"
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Giải thích tường minh sơ đồ hình cây (Decision Tree), biểu đồ phân tán (Scatter Chart) và bộ tham số đầu vào (tần suất từ khóa, trọng số pháp lý, độ trễ thời gian) tác động trực tiếp tới điểm số tham mưu Lãnh đạo.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              RAG Dynamic Logic v3.5
            </span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            <button
              onClick={() => setActiveView('tree')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeView === 'tree'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <GitFork className="w-4 h-4" />
              <span>Sơ Đồ Hình Cây (Decision Tree)</span>
            </button>

            <button
              onClick={() => setActiveView('scatter')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeView === 'scatter'
                  ? 'bg-indigo-500 text-white shadow-md font-black'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <PieChart className="w-4 h-4 text-indigo-300" />
              <span>Biểu Đồ Phân Tán (Scatter Plot)</span>
            </button>

            <button
              onClick={() => setActiveView('simulator')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeView === 'simulator'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Sliders className="w-4 h-4 text-emerald-950" />
              <span>Trình Mô Phỏng Tương Tác (Simulator)</span>
            </button>

            <button
              onClick={() => setActiveView('formulas')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeView === 'formulas'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Công Thức Toán & Quy Tắc Chấm</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            * Cập nhật thời gian thực theo khung giờ quét
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* VIEW 1: DECISION TREE DIAGRAM (SƠ ĐỒ HÌNH CÂY) */}
      {/* ------------------------------------------------------------------ */}
      {activeView === 'tree' && (
        <div className="space-y-6 animate-fadeIn">
          <div
            className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <GitFork className="w-5 h-5 text-amber-500" />
                  Sơ Đồ Hình Cây Phân Tích Thuật Toán (Algorithmic Decision Tree)
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Các luồng xử lý từ văn bản thô ➔ Tách từ khóa ➔ Xử lý ngữ cảnh AI ➔ Nhân trọng số nguồn ➔ Suy giảm thời gian ➔ Kết quả chốt
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Nhánh Tích Cực
                </span>
                <span className="flex items-center gap-1.5 text-rose-500 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Nhánh Nguy Cơ
                </span>
              </div>
            </div>

            {/* Tree Flow Representation */}
            <div className="overflow-x-auto p-4 custom-scrollbar">
              <div className="min-w-[900px] space-y-8">
                {/* LEVEL 0: RAW INPUT */}
                <div className="flex justify-center">
                  <div className="w-80 p-3.5 rounded-xl border border-indigo-500/40 bg-indigo-950/20 text-center shadow-md space-y-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 uppercase tracking-wide">
                      LEVEL 0: RAW INPUT DATA
                    </span>
                    <h4 className="text-sm font-bold text-white">Văn Bản Bài Báo Thu Thập</h4>
                    <p className="text-[11px] text-slate-400">Title + Summary + Source + PublishedAt</p>
                  </div>
                </div>

                {/* CONNECTOR LINE */}
                <div className="flex justify-center">
                  <div className="w-0.5 h-6 bg-slate-700"></div>
                </div>

                {/* LEVEL 1: BASE SCORE INITIALIZATION */}
                <div className="flex justify-center">
                  <div className="w-96 p-3.5 rounded-xl border border-slate-700 bg-slate-800/90 text-center shadow-sm space-y-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-700 text-slate-300 uppercase">
                      LEVEL 1: BASE SCORE INIT
                    </span>
                    <h4 className="text-sm font-bold text-amber-400">Điểm Trung Lập Gốc = 50 điểm</h4>
                    <p className="text-[11px] text-slate-400">Mọi bài viết xuất phát tại điểm mốc cân bằng 50/100</p>
                  </div>
                </div>

                {/* BRANCH SPLIT LINES */}
                <div className="relative flex justify-between max-w-4xl mx-auto px-12">
                  <div className="w-1/2 border-t-2 border-emerald-500/60 rounded-tl-xl h-6"></div>
                  <div className="w-1/2 border-t-2 border-rose-500/60 rounded-tr-xl h-6"></div>
                </div>

                {/* LEVEL 2: KEYWORD VECTOR EXTRACTION */}
                <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {/* POSITIVE BRANCH */}
                  <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400">
                        LEVEL 2A: POSITIVE VECTOR
                      </span>
                      <span className="text-xs font-bold text-emerald-400">+ Điểm Tích Cực</span>
                    </div>
                    <h5 className="text-xs font-bold text-white">Trích Xuất Từ Khóa "Điểm Sáng"</h5>
                    <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                      <li>Tăng trưởng, xuất siêu, vượt kế hoạch (+25)</li>
                      <li>Giải ngân vượt tiến độ, tháo gỡ vướng mắc (+20)</li>
                      <li>Thu hút FDI khủng, nâng hạng (+20)</li>
                    </ul>
                    <div className="pt-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/30 p-2 rounded border border-emerald-500/20">
                      Raw Positive Score = ∑(Từ Khóa × Trọng Số)
                    </div>
                  </div>

                  {/* NEGATIVE BRANCH */}
                  <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400">
                        LEVEL 2B: CRISIS VECTOR
                      </span>
                      <span className="text-xs font-bold text-rose-400">- Điểm Nguy Cơ</span>
                    </div>
                    <h5 className="text-xs font-bold text-white">Trích Xuất Từ Khóa "Nguy Cơ"</h5>
                    <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                      <li>Khởi tố, gian lận, thao túng giá (-30)</li>
                      <li>Nợ xấu, vỡ nợ, chậm trả gốc lãi (-25)</li>
                      <li>Sụt giảm, thất thu, rút vốn (-20)</li>
                    </ul>
                    <div className="pt-1 text-[11px] font-mono text-rose-400 bg-rose-950/30 p-2 rounded border border-rose-500/20">
                      Raw Crisis Score = ∑(Từ Khóa × Trọng Số)
                    </div>
                  </div>
                </div>

                {/* LEVEL 3: CONTEXTUAL AI MODIFIER */}
                <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 max-w-4xl mx-auto space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300">
                      LEVEL 3: AI CONTEXTUAL REVERSAL & NEGATION ENGINE
                    </span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <h5 className="text-xs font-bold text-white">Kiểm Tra Ngữ Cảnh Phủ Định & Khắc Phục</h5>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Hệ thống kiểm tra cụm từ đi kèm. Nếu phát hiện từ tiêu cực nhưng ở dạng <em>"Phòng ngừa thất thoát"</em> hoặc <em>"Xử lý dứt điểm nợ xấu"</em> ➔ Đảo chiều 45% điểm tiêu cực thành điểm sáng tích cực cho công tác quản lý.
                  </p>
                </div>

                {/* LEVEL 4: MULTIPLIERS & TIME DECAY */}
                <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
                  <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/10 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                      LEVEL 4A: SOURCE CREDIBILITY
                    </span>
                    <h5 className="text-xs font-bold text-white">Nhân Trọng Số Nguồn</h5>
                    <p className="text-[11px] text-slate-300">
                      Cổng TT Bộ Tài chính / NHNN = <strong>x1.25</strong> | Báo chí = <strong>x1.10</strong> | Mạng xã hội = <strong>x0.85</strong>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/10 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                      LEVEL 4B: TIME DECAY FACTOR
                    </span>
                    <h5 className="text-xs font-bold text-white">Suy Giảm Theo Thời Gian</h5>
                    <p className="text-[11px] text-slate-300">
                      Công thức decay: <code className="text-cyan-300">e^(-0.05 × t_hours)</code>. Tin mới công bố giữ lực 100%, tin cũ giảm tác động.
                    </p>
                  </div>
                </div>

                {/* LEVEL 5: FINAL DECISION LEAVES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-2">
                  <div className="p-3.5 rounded-xl border border-emerald-500/50 bg-emerald-950/30 text-center space-y-1">
                    <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                      <Zap className="w-4 h-4" />
                      Điểm Áp Lực ≤ 86đ (Mốc Chuẩn)
                    </div>
                    <div className="text-sm font-black text-white">🟢 VÙNG BÌNH THƯỜNG / CHƯA CẢNH BÁO</div>
                    <p className="text-[10px] text-slate-300">Điểm sáng thành tựu, tin trung lập, biến động ổn định trong tầm kiểm soát</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-amber-500/50 bg-amber-950/30 text-center space-y-1">
                    <div className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1">
                      <Scale className="w-4 h-4" />
                      87 ≤ Điểm Áp Lực ≤ 94đ
                    </div>
                    <div className="text-sm font-black text-white">🟡 CẢNH BÁO RỦI RO VỪA (MODERATE)</div>
                    <p className="text-[10px] text-slate-300">Áp lực thị trường hoặc sự vụ tranh chấp cần chuyên viên chuyên ngành theo dõi</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-rose-500 bg-rose-950/50 text-center space-y-1">
                    <div className="text-xs font-bold text-rose-400 flex items-center justify-center gap-1">
                      <ShieldAlert className="w-4 h-4" />
                      Điểm Áp Lực ≥ 95đ
                    </div>
                    <div className="text-sm font-black text-white">🔴 CẢNH BÁO KHỦNG HOẢNG CẤP BÁCH</div>
                    <p className="text-[10px] text-slate-300">Đại án pháp lý, khởi tố, vỡ nợ diện rộng ➔ Báo cáo khẩn cấp Lãnh đạo Bộ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* VIEW 2: SCATTER PLOT ANALYSIS (BIỂU ĐỒ PHÂN TÁN) */}
      {/* ------------------------------------------------------------------ */}
      {activeView === 'scatter' && (
        <div className="space-y-6 animate-fadeIn">
          <div
            className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <PieChart className="w-5 h-5 text-indigo-400" />
                  Biểu Đồ Phân Tán Điểm Sáng vs. Nguy Cơ Theo Độ Trễ Thời Gian
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Trực quan hóa vị trí tương quan của từng bài báo: Trục X = Độ trễ thời gian (Giờ), Trục Y = Điểm Nguy Cơ (0-100), Kích thước bóng = Tần suất từ khóa
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  Vùng Bình Thường / Chưa Cảnh Báo (≤ 86đ)
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-rose-400">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  Vùng Cảnh Báo Nguy Cơ (&gt; 86đ)
                </span>
              </div>
            </div>

            {/* Scatter Chart Container */}
            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                  <ReferenceLine
                    y={86}
                    stroke="#f43f5e"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{
                      value: 'Mốc Bình Thường / Chưa Cảnh Báo (86đ)',
                      position: 'top',
                      fill: '#f43f5e',
                      fontSize: 11,
                      fontWeight: 'bold'
                    }}
                  />
                  <XAxis
                    type="number"
                    dataKey="hoursAgo"
                    name="Độ trễ thời gian"
                    unit="h"
                    domain={[0, 'auto']}
                    stroke={isDark ? '#94a3b8' : '#64748b'}
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Độ trễ thời gian công bố (Giờ trước)', position: 'insideBottom', offset: -10, fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="crisisScore"
                    name="Điểm Áp Lực Nguy Cơ"
                    domain={[0, 100]}
                    stroke={isDark ? '#94a3b8' : '#64748b'}
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Điểm Áp Lực Nguy Cơ (Crisis Score)', angle: -90, position: 'insideLeft', fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                  />
                  <ZAxis type="number" dataKey="keywordCount" range={[60, 300]} name="Mức độ dày từ khóa" />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className={`p-3 rounded-xl border text-xs shadow-xl space-y-1.5 max-w-xs ${
                            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                          }`}>
                            <div className="font-bold border-b border-slate-700/50 pb-1 text-xs line-clamp-2">
                              {data.title}
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Nguồn: {data.source}</span>
                              <span className="font-mono text-cyan-400">{data.hoursAgo}h trước</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <div className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
                                <div>Nguy cơ: <strong>{data.crisisScore}/100</strong></div>
                              </div>
                              <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                <div>Điểm sáng: <strong>{data.positiveScore}/100</strong></div>
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-400 text-center font-mono pt-1">
                              Cảm xúc chốt: <strong>{data.sentimentScore}/100</strong> ({data.category})
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Reference line for Risk Threshold */}
                  <ReferenceLine y={60} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Ngưỡng Nguy Cơ Cao (60+)', fill: '#f43f5e', fontSize: 10, position: 'right' }} />
                  <Scatter
                    name="Bài viết"
                    data={scatterPlotData}
                    onClick={(entry: any) => {
                      const payload = entry && (entry.id ? entry : entry.payload);
                      if (payload && payload.id) {
                        setSelectedArticleId(payload.id);
                        if (payload.originalItem && onSelectArticle) {
                          onSelectArticle(payload.originalItem);
                        }
                      }
                    }}
                    cursor="pointer"
                  >
                    {scatterPlotData.map((entry, index) => {
                      let color = '#94a3b8'; // Neutral slate
                      if (entry.category === 'NGUY CƠ') color = '#f43f5e';
                      else if (entry.category === 'TÍCH CỰC') color = '#10b981';
                      return <Cell key={`cell-${index}`} fill={color} opacity={0.85} stroke={isDark ? '#0f172a' : '#ffffff'} strokeWidth={2} />;
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Clicked Article Detailed Calculation Inspector */}
            {activeScatterArticle && (
              <div className={`mt-5 p-4 rounded-xl border space-y-3 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono">
                      Chi Tiết Thuật Toán Bài Báo Đang Chọn
                    </h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold font-mono ${
                    activeScatterArticle.category === 'NGUY CƠ' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    activeScatterArticle.category === 'TÍCH CỰC' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {activeScatterArticle.category}
                  </span>
                </div>

                <div className="text-sm font-bold text-white line-clamp-1">
                  "{activeScatterArticle.title}"
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="p-2.5 rounded-lg border border-slate-700/50 bg-slate-900/40 space-y-0.5">
                    <span className="text-[10px] text-slate-400">Nguồn Tin Tức:</span>
                    <div className="font-bold text-slate-200">{activeScatterArticle.source}</div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-700/50 bg-slate-900/40 space-y-0.5">
                    <span className="text-[10px] text-slate-400">Độ Trễ Công Bố:</span>
                    <div className="font-bold text-cyan-400 font-mono">{activeScatterArticle.hoursAgo} giờ trước</div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-950/20 space-y-0.5">
                    <span className="text-[10px] text-rose-400">Điểm Nguy Cơ (Crisis):</span>
                    <div className="font-black text-rose-400 font-mono text-sm">{activeScatterArticle.crisisScore} / 100</div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 space-y-0.5">
                    <span className="text-[10px] text-emerald-400">Điểm Sáng (Positive):</span>
                    <div className="font-black text-emerald-400 font-mono text-sm">{activeScatterArticle.positiveScore} / 100</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* VIEW 3: INTERACTIVE PARAMETER SIMULATOR (TRÌNH MÔ PHỎNG TƯƠNG TÁC) */}
      {/* ------------------------------------------------------------------ */}
      {activeView === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* SLIDER CONTROLS PANEL */}
          <div
            className={`lg:col-span-7 p-5 rounded-2xl border space-y-5 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Bảng Điều Chỉnh Tham Số Đầu Vào
                </h3>
              </div>
              <button
                onClick={() => {
                  setSimPosFreq(3);
                  setSimPosWeight(25);
                  setSimNegFreq(2);
                  setSimNegWeight(30);
                  setSimAgeHours(1.5);
                  setSimSourceMultiplier(1.25);
                  setSimContextReversal(false);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                Đặt lại mặc định
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* SLIDER 1: NEGATIVE KEYWORD FREQUENCY */}
              <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Tần Suất Từ Khóa Nguy Cơ (F_neg):
                  </label>
                  <span className="font-mono font-bold text-rose-300 text-sm">{simNegFreq} từ xuất hiện</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={simNegFreq}
                  onChange={(e) => setSimNegFreq(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0 (Không có từ nguy cơ)</span>
                  <span>5 (Khá nhiều)</span>
                  <span>10 (Cực kỳ dày đặc)</span>
                </div>
              </div>

              {/* SLIDER 2: NEGATIVE KEYWORD WEIGHT */}
              <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-rose-400">
                    Trọng Số Mức Độ Nghiêm Trọng (W_neg):
                  </label>
                  <span className="font-mono font-bold text-rose-300 text-sm">{simNegWeight} điểm/từ</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={simNegWeight}
                  onChange={(e) => setSimNegWeight(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>10 (Nội dung sụt giảm nhẹ)</span>
                  <span>30 (Nợ xấu, sai phạm)</span>
                  <span>50 (Khởi tố, vỡ nợ)</span>
                </div>
              </div>

              {/* SLIDER 3: POSITIVE KEYWORD FREQUENCY */}
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Tần Suất Từ Khóa Điểm Sáng (F_pos):
                  </label>
                  <span className="font-mono font-bold text-emerald-300 text-sm">{simPosFreq} từ xuất hiện</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={simPosFreq}
                  onChange={(e) => setSimPosFreq(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0 (Không có từ điểm sáng)</span>
                  <span>5 (Khá tích cực)</span>
                  <span>10 (Tín hiệu rất mạnh)</span>
                </div>
              </div>

              {/* SLIDER 4: POSITIVE KEYWORD WEIGHT */}
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-400">
                    Trọng Số Tích Cực Khơi Thông (W_pos):
                  </label>
                  <span className="font-mono font-bold text-emerald-300 text-sm">{simPosWeight} điểm/từ</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={simPosWeight}
                  onChange={(e) => setSimPosWeight(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>10 (Tin ổn định)</span>
                  <span>25 (Vượt kế hoạch, tháo gỡ)</span>
                  <span>50 (Xuất siêu kỷ lục, FDI khủng)</span>
                </div>
              </div>

              {/* SLIDER 5: TIME DECAY (ARTICLE AGE) */}
              <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-cyan-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Độ Trễ Thời Gian (Tuổi tin tức):
                  </label>
                  <span className="font-mono font-bold text-cyan-300 text-sm">{simAgeHours} giờ trước</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="0.5"
                  value={simAgeHours}
                  onChange={(e) => setSimAgeHours(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0h (Mới phát hành - Decay 1.0)</span>
                  <span>4h (Decay 0.82)</span>
                  <span>24h (Tin cũ - Decay 0.40)</span>
                </div>
              </div>

              {/* DROPDOWN: SOURCE MULTIPLIER & CONTEXT TOGGLE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Trọng số Nguồn tin (M_source):</label>
                  <select
                    value={simSourceMultiplier}
                    onChange={(e) => setSimSourceMultiplier(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                  >
                    <option value={1.25}>Cổng TT Bộ Tài chính / NHNN (x1.25)</option>
                    <option value={1.10}>Báo chí Tài chính Chính thống (x1.10)</option>
                    <option value={0.85}>Mạng Xã Hội / Tin đồn (x0.85)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Ngữ cảnh Phục hồi AI:</label>
                  <button
                    onClick={() => setSimContextReversal(!simContextReversal)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      simContextReversal
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <span>{simContextReversal ? 'BẬT (Có ngữ cảnh khắc phục)' : 'TẮT (Không có ngữ cảnh)'}</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC RESULT OUTPUT PANEL */}
          <div
            className={`lg:col-span-5 p-5 rounded-2xl border space-y-5 flex flex-col justify-between ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Kết Quả Thuật Toán Mô Phỏng
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400">
                  REAL-TIME PREVIEW
                </span>
              </div>

              {/* FINAL SCORE GAUGE */}
              <div className={`p-5 rounded-2xl border text-center space-y-3 ${
                simCalculated.classification === 'ACUTE_CRISIS' ? 'bg-rose-950/40 border-rose-500/50' :
                simCalculated.classification === 'MODERATE_RISK' ? 'bg-amber-950/40 border-amber-500/50' :
                simCalculated.classification === 'POSITIVE' ? 'bg-emerald-950/40 border-emerald-500/50' :
                'bg-slate-800/80 border-slate-700'
              }`}>
                <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-slate-400">
                  <span>SẮC THÁI: {simCalculated.finalSentiment}/100</span>
                  <span className="text-amber-400">MỐC CHUẨN AN TOÀN: ≤ 86đ</span>
                </div>

                <div className="py-1">
                  <div className="text-[11px] font-mono text-slate-400 mb-1">ĐIỂM ÁP LỰC NGUY CƠ TỔNG HỢP</div>
                  <div className="text-5xl font-black font-mono tracking-tight text-white flex items-center justify-center gap-2">
                    <span>{simCalculated.riskPressureScore}</span>
                    <span className="text-lg text-slate-400 font-normal">/ 100</span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className={`inline-block px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider font-mono shadow-md ${
                    simCalculated.classification === 'ACUTE_CRISIS' ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse' :
                    simCalculated.classification === 'MODERATE_RISK' ? 'bg-amber-500 text-slate-950 shadow-amber-500/30' :
                    simCalculated.classification === 'POSITIVE' ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30' :
                    'bg-slate-700 text-slate-200'
                  }`}>
                    {simCalculated.classification === 'ACUTE_CRISIS' && '🔴 CẢNH BÁO: KHỦNG HOẢNG CẤP BÁCH (> 95đ)'}
                    {simCalculated.classification === 'MODERATE_RISK' && '🟡 CẢNH BÁO: RỦI RO MỨC VỪA (87 - 94đ)'}
                    {simCalculated.classification === 'POSITIVE' && '🟢 ĐIỂM SÁNG TÍCH CỰC (VÙNG AN TOÀN ≤ 86đ)'}
                    {simCalculated.classification === 'NORMAL_UNALERTED' && '🟢 VÙNG BÌNH THƯỜNG / CHƯA CẢNH BÁO (≤ 86đ)'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 pt-1">
                  {simCalculated.isAlertActive
                    ? '⚠️ Điểm áp lực đã vượt ngưỡng 86đ ➔ Đủ điều kiện kích hoạt Cảnh báo rủi ro lên giao diện.'
                    : '✅ Điểm áp lực nằm trong vùng an toàn (≤ 86đ) ➔ Hoạt động nghiệp vụ bình thường, không tạo cảnh báo giả.'}
                </p>
              </div>

              {/* STEP-BY-STEP CALCULATION DETAILS */}
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-950/20 flex items-center justify-between">
                  <span className="text-slate-300">Điểm Nguy Cơ Thô (Raw Crisis):</span>
                  <span className="font-bold text-rose-400">{simCalculated.rawNeg.toFixed(0)} pt</span>
                </div>

                <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 flex items-center justify-between">
                  <span className="text-slate-300">Điểm Tích Cực Thô (Raw Pos):</span>
                  <span className="font-bold text-emerald-400">{simCalculated.rawPos.toFixed(0)} pt</span>
                </div>

                <div className="p-2.5 rounded-xl border border-cyan-500/20 bg-cyan-950/20 flex items-center justify-between">
                  <span className="text-slate-300">Hệ số Suy Giảm Thời Gian (Decay):</span>
                  <span className="font-bold text-cyan-300">{(simCalculated.decayFactor).toFixed(3)}</span>
                </div>

                <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-950/20 flex items-center justify-between">
                  <span className="text-slate-300">Hệ số Nguồn (Source Multiplier):</span>
                  <span className="font-bold text-amber-300">x{simSourceMultiplier}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              💡 <strong>Quy tắc ngưỡng 86:</strong> Chỉ các tin tức có tính chất thực sự căng thẳng, rủi ro pháp lý lớn hoặc nguy cơ mất thanh khoản nghiêm trọng mới vượt qua mốc 86 để xuất hiện ở Mục Cảnh Báo. Các tin tức trung tính hoặc định kỳ luôn được giữ ở mức ≤ 86 điểm.
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* VIEW 4: MATHEMATICAL FORMULA SPECS (CÔNG THỨC TOÁN HỌC & S, D, V, I) */}
      {/* ------------------------------------------------------------------ */}
      {activeView === 'formulas' && (
        <div className="space-y-6 animate-fadeIn">
          <div
            className={`p-6 rounded-2xl border space-y-6 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  Công Thức Lượng Hóa Rủi Ro Thống Nhất (S, D, V, I Risk Score Formula)
                </h3>
                <span className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-xs font-bold">
                  📄 Tham khảo: docs/risk_score_formula_definition.md
                </span>
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Chuyển dịch từ "lắng nghe cảm xúc bề mặt" sang "dự báo nguy cơ thể chế" bằng phương trình trọng số rủi ro thống nhất.
              </p>
            </div>

            {/* MAIN FORMULA BANNER */}
            <div className="p-5 rounded-xl border border-indigo-500/50 bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-950 space-y-3 shadow-md">
              <div className="text-xs uppercase font-mono font-bold tracking-wider text-indigo-300">
                Phương Trình Toán Học Chuẩn Hóa (Risk Score $\in [0, 100]$):
              </div>
              <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs sm:text-sm text-amber-300 text-center font-black overflow-x-auto border border-indigo-500/30">
                Risk_Score = min(100, (0.7 · S + 0.3 · D) × (1 + 0.3 · V + 0.4 · I))
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                Công thức kết hợp lớp nền tảng thể chế và độ vênh số liệu <code className="text-indigo-300 font-mono">(0.7·S + 0.3·D)</code> với hệ thống khuếch đại vận tốc lan truyền và tầm ảnh hưởng xã hội <code className="text-indigo-300 font-mono">× (1 + 0.3·V + 0.4·I)</code>.
              </p>
            </div>

            {/* 4 VARIABLE BREAKDOWN GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* VARIABLE S */}
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-rose-400 uppercase">1. S - Severity (Mức Độ Nghiêm Trọng)</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[11px] font-mono">S ∈ [0, 50]</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Đo lường mức độ tổn hại uy tín lãnh đạo, trách nhiệm pháp lý của Bộ và thiệt hại kinh tế vĩ mô dựa trên 50 Anchor Cases chuẩn.
                </p>
              </div>

              {/* VARIABLE D */}
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-400 uppercase">2. D - Divergence (Độ Vênh Thực Tế)</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px] font-mono">D ∈ [0, 20]</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Định lượng hiện tượng <em>Narrative-Reality Divergence</em> (ví dụ: phát biểu chỉ đạo rất tích cực nhưng số liệu thực tế giải ngân/thủ tục chậm trễ).
                </p>
              </div>

              {/* VARIABLE V */}
              <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-400 uppercase">3. V - Velocity (Vận Tốc Lan Truyền)</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[11px] font-mono">V ∈ [0.0, 1.0]</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Hệ số đo lường tốc độ phát tán thông tin trong các khung giờ (2h, 6h, 24h) trên báo chí chính thống và mạng xã hội.
                </p>
              </div>

              {/* VARIABLE I */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-400 uppercase">4. I - Impact (Quy Mô Tác Động)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-mono">I ∈ [0.0, 1.0]</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Hệ số quy mô nhóm xã hội chịu ảnh hưởng (I = 0.2 diện hẹp; I = 1.0 khi chạm tới hàng triệu hộ kinh doanh hoặc toàn thị trường vốn).
                </p>
              </div>
            </div>

            {/* 4 WARNING TIERS MATRIX */}
            <div className="p-5 rounded-xl border border-slate-700 bg-slate-950/80 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Ma Trận 4 Cấp Độ Cảnh Báo Chuẩn Mực & SOP Tác Chiến
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-indigo-500/50 bg-indigo-950/30 space-y-1.5">
                  <span className="font-bold text-indigo-300 block font-mono">📡 CẤP 1: CẢNH BÁO XA</span>
                  <div className="font-bold text-white text-sm">20 – 39 điểm</div>
                  <p className="text-slate-300 text-[11px] leading-tight">
                    Tín hiệu yếu, chính sách mới ban hành, câu hỏi thăm dò, chuyên gia bình luận trung tính.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-500/50 bg-amber-950/30 space-y-1.5">
                  <span className="font-bold text-amber-300 block font-mono">⏳ CẤP 2: CẢNH BÁO SỚM</span>
                  <div className="font-bold text-white text-sm">40 – 59 điểm</div>
                  <p className="text-slate-300 text-[11px] leading-tight">
                    Vướng mắc thủ tục lặp lại ở nhiều địa phương, bài phân tích sâu điểm nghẽn thực thi.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-orange-500/50 bg-orange-950/30 space-y-1.5">
                  <span className="font-bold text-orange-300 block font-mono">⚡ CẤP 3: CẢNH BÁO NHANH</span>
                  <div className="font-bold text-white text-sm">60 – 74 điểm</div>
                  <p className="text-slate-300 text-[11px] leading-tight">
                    Báo chí lớn đồng loạt phản ánh bất cập, mạng xã hội tăng đột biến, quy kết trách nhiệm.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-rose-500/50 bg-rose-950/30 space-y-1.5">
                  <span className="font-bold text-rose-300 block font-mono">🚨 CẤP 4: KHẨN CẤP</span>
                  <div className="font-bold text-white text-sm">75 – 100 điểm</div>
                  <p className="text-slate-300 text-[11px] leading-tight">
                    Khủng hoảng bùng phát, tin đồn sai lệch nghiêm trọng, liên quan nhân sự lãnh đạo / thị trường tài chính.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                🛡️ <strong>Lưu ý giám sát thường quy (&lt; 20 điểm):</strong> Các bài viết về nghiệp vụ cưỡng chế pháp luật định kỳ (xử phạt vi phạm cá nhân, buôn lậu nhỏ lẻ) hoặc điểm tin thị trường thuần túy được giữ ở mức dưới 20 điểm và <strong>không kích hoạt cảnh báo</strong> nhằm triệt tiêu báo động giả.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
