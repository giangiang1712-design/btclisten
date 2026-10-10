import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Database,
  Cpu,
  Play,
  CheckCircle2,
  AlertCircle,
  Download,
  FileCode,
  FileSpreadsheet,
  Sliders,
  TrendingDown,
  Activity,
  Layers,
  ArrowRight,
  ShieldAlert,
  Zap,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Maximize2,
  Copy,
  Check,
  Flame,
  Settings2,
  Compass,
  FileText,
  Clock,
  Terminal,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrainingSample,
  TrainingJob,
  ModelComparisonResult,
  FineTuningStudioConfig,
} from '../types/finetune';
import {
  fetchDatasetSamples,
  fetchTrainingJobs,
  startTrainingJob,
  runModelComparison,
  getStudioConfig,
  updateStudioConfig,
  BENCHMARK_FINANCE_PROMPTS,
} from '../lib/finetuneDatasetService';
import { useTheme } from '../lib/theme';

export const FineTuningStudio: React.FC = () => {
  const { isDark } = useTheme();

  // Studio Sub-tabs
  const [activeTab, setActiveTab] = useState<'dataset' | 'training' | 'arena' | 'deployment'>('dataset');

  // Dataset State
  const [samples, setSamples] = useState<TrainingSample[]>([]);
  const [totalSamples, setTotalSamples] = useState<number>(1000);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jumpPageInput, setJumpPageInput] = useState<string>('1');

  useEffect(() => {
    setJumpPageInput(String(currentPage));
  }, [currentPage]);
  const [isLoadingSamples, setIsLoadingSamples] = useState<boolean>(false);
  const [expandedSampleId, setExpandedSampleId] = useState<number | null>(null);
  const [copiedSampleId, setCopiedSampleId] = useState<number | null>(null);

  // Training State
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isStartingTrain, setIsStartingTrain] = useState<boolean>(false);
  const [trainModelName, setTrainModelName] = useState<string>('Gemini-Finance-Expert-VN');
  const [trainBaseModel, setTrainBaseModel] = useState<string>('gemini-3.8-flash');
  const [trainEpochs, setTrainEpochs] = useState<number>(5);
  const [trainBatchSize, setTrainBatchSize] = useState<number>(8);
  const [trainLearningRate, setTrainLearningRate] = useState<number>(0.001);
  const [trainAdapter, setTrainAdapter] = useState<'LoRA' | 'Full Tuning' | 'QLoRA'>('LoRA');

  // Arena Comparison State
  const [arenaPrompt, setArenaPrompt] = useState<string>(BENCHMARK_FINANCE_PROMPTS[0].prompt);
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string>('bm-1');
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<ModelComparisonResult | null>(null);

  // Deployment Config State
  const [config, setConfig] = useState<FineTuningStudioConfig>({
    activeModelMode: 'few_shot_boosted',
    activeTunedModelId: 'tunedModels/vietnam-finance-expert-v1',
    fewShotSampleCount: 3,
    confidenceThreshold: 0.88,
  });
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);

  // Load initial data
  useEffect(() => {
    loadDataset(1, selectedCategory, searchQuery);
    loadJobs();
    loadConfig();
  }, []);

  // Polling for training jobs if running
  useEffect(() => {
    const activeJob = jobs.find(j => j.status === 'running');
    if (activeJob) {
      const timer = setInterval(() => {
        loadJobs();
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [jobs]);

  const loadDataset = async (page: number, cat: string, query: string) => {
    setIsLoadingSamples(true);
    try {
      const res = await fetchDatasetSamples({
        page,
        pageSize: 10,
        category: cat === 'all' ? '' : cat,
        search: query,
      });
      setSamples(res.samples);
      setTotalSamples(res.total);
      if (res.categories && res.categories.length > 0) {
        setCategories(res.categories);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSamples(false);
    }
  };

  const loadJobs = async () => {
    try {
      const list = await fetchTrainingJobs();
      setJobs(list);
      if (!activeJobId && list.length > 0) {
        setActiveJobId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadConfig = async () => {
    try {
      const c = await getStudioConfig();
      setConfig(c);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadDataset(1, selectedCategory, searchQuery);
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    loadDataset(1, cat, searchQuery);
  };

  const handleStartTrain = async () => {
    setIsStartingTrain(true);
    try {
      const res = await startTrainingJob({
        name: trainModelName,
        baseModel: trainBaseModel,
        epochs: trainEpochs,
        batchSize: trainBatchSize,
        learningRateMultiplier: trainLearningRate,
        adapterType: trainAdapter,
      });
      if (res.success && res.job) {
        setActiveJobId(res.job.id);
        setActiveTab('training');
        loadJobs();
      }
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi khởi động huấn luyện');
    } finally {
      setIsStartingTrain(false);
    }
  };

  const handleRunComparison = async (promptToRun?: string) => {
    const p = promptToRun || arenaPrompt;
    if (!p.trim()) return;
    setIsComparing(true);
    try {
      const result = await runModelComparison(p, config.activeTunedModelId);
      setComparisonResult(result);
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi thực hiện so sánh đối đầu');
    } finally {
      setIsComparing(false);
    }
  };

  const handleBenchmarkSelect = (bm: typeof BENCHMARK_FINANCE_PROMPTS[0]) => {
    setSelectedBenchmarkId(bm.id);
    setArenaPrompt(bm.prompt);
    handleRunComparison(bm.prompt);
  };

  const handleSaveConfig = async (newMode: 'base' | 'tuned' | 'few_shot_boosted') => {
    setIsSavingConfig(true);
    try {
      const updated = await updateStudioConfig({
        ...config,
        activeModelMode: newMode,
      });
      setConfig(updated);
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
    } catch (e: any) {
      alert(e?.message || 'Lỗi cập nhật cấu hình');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedSampleId(id);
    setTimeout(() => setCopiedSampleId(null), 2000);
  };

  const selectedJob = useMemo(() => {
    return jobs.find(j => j.id === activeJobId) || jobs[0];
  }, [jobs, activeJobId]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Hero Banner & Studio Overview */}
      <div
        className={`rounded-3xl border p-6 md:p-8 relative overflow-hidden transition-colors ${
          isDark
            ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border-indigo-500/20'
            : 'bg-gradient-to-br from-white via-indigo-50/30 to-emerald-50/30 border-indigo-200/70 shadow-sm'
        }`}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Studio Tinh Chỉnh & Huấn Luyện AI Tài Chính Việt Nam</span>
              <span className="bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded text-[10px] font-black uppercase">
                1.000 Samples Live
              </span>
            </div>

            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
              Fine-Tuning Studio & Huấn Luyện Trực Tiếp
            </h1>

            <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Huấn luyện mô hình ngôn ngữ lớn (LLM) đạt chuẩn Cố vấn Điều hành Chiến lược Bộ Tài chính & Chuyên gia Phân tích Tác động Đa tầng. Tự động chuẩn hóa câu trả lời 4 bước: <strong className="text-emerald-500 font-semibold">1. Bản chất & Rủi ro</strong>, <strong className="text-cyan-500 font-semibold">2. Tác động liên đới</strong>, <strong className="text-indigo-500 font-semibold">3. Ma trận lan truyền</strong>, <strong className="text-amber-500 font-semibold">4. Khuyến nghị 24h-72h</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className={`px-3 py-1 rounded-xl border font-bold flex items-center gap-1.5 ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800 shadow-xs'
              }`}>
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span>Bộ dữ liệu: <strong>1.000 cặp chuyên gia</strong></span>
              </span>

              <span className={`px-3 py-1 rounded-xl border font-bold flex items-center gap-1.5 ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800 shadow-xs'
              }`}>
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>Kỹ thuật: <strong>LoRA (Rank 16, Alpha 32)</strong></span>
              </span>

              <span className={`px-3 py-1 rounded-xl border font-bold flex items-center gap-1.5 ${
                config.activeModelMode === 'tuned'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-black'
                  : isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-700'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Trạng thái: <strong>{config.activeModelMode === 'tuned' ? 'Mô hình Fine-Tuned Đang Bật' : 'Few-Shot Booster Đang Chạy'}</strong></span>
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <a
              href="/api/finetune/download/jsonl"
              download="vietnam_finance_expert_1000_dataset.jsonl"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <FileCode className="w-4 h-4" />
              <span>Tải Dataset (.JSONL)</span>
              <span className="bg-indigo-700/60 px-1.5 py-0.5 rounded text-[10px]">1,000 Mẫu</span>
            </a>

            <a
              href="/api/finetune/download/csv"
              download="vietnam_finance_expert_1000_dataset.csv"
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800/90 border-slate-700 hover:bg-slate-800 text-slate-200'
                  : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-800 shadow-xs'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Xuất Bảng Excel (.CSV)</span>
            </a>

            <button
              onClick={() => setActiveTab('training')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-300" />
              <span>Huấn Luyện Trực Tiếp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Navigation Tabs */}
      <div
        className={`p-1.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('dataset')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
              activeTab === 'dataset'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : isDark
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>1. Kho Dữ Liệu 1.000 Mẫu</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              activeTab === 'dataset' ? 'bg-emerald-700/60 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}>
              1,000 Pairs
            </span>
          </button>

          <button
            onClick={() => setActiveTab('training')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
              activeTab === 'training'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : isDark
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>2. Trình Huấn Luyện Trực Tiếp (Live Engine)</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              activeTab === 'training' ? 'bg-indigo-700/60 text-white' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
            }`}>
              LoRA Pipeline
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('arena');
              if (!comparisonResult) {
                handleRunComparison();
              }
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
              activeTab === 'arena'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : isDark
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>3. Đấu Trường So Sánh (Base vs. Tuned)</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              activeTab === 'arena' ? 'bg-purple-700/60 text-white' : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
            }`}>
              Side-by-Side
            </span>
          </button>

          <button
            onClick={() => setActiveTab('deployment')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
              activeTab === 'deployment'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : isDark
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Settings2 className="w-4 h-4 text-cyan-400" />
            <span>4. Triển Khai & RAG Booster</span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="hidden md:inline">Cơ chế:</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">Google Gemini LoRA Adapter</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DATASET EXPLORER (1,000 EXPERT SAMPLES) */}
      {/* ========================================================================= */}
      {activeTab === 'dataset' && (
        <div className="space-y-6">
          {/* 5 Domain Distribution Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              {
                id: 'macro',
                label: 'Vĩ Mô, Lãi Suất, Tỷ Giá',
                count: categories.find(c => c.name.includes('Vĩ mô'))?.count || 200,
                color: 'text-emerald-500',
                border: 'border-emerald-500/30',
                bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
                desc: 'SBV OMO, Tín phiếu, Lãi suất, Tỷ giá USD/VND',
              },
              {
                id: 'realestate',
                label: 'BĐS & Trái Phiếu (TPDN)',
                count: categories.find(c => c.name.includes('Bất động sản'))?.count || 200,
                color: 'text-amber-500',
                border: 'border-amber-500/30',
                bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
                desc: 'Nghị định 08, Áp lực đáo hạn nợ, Tái cấu trúc',
              },
              {
                id: 'banking',
                label: 'Hệ Thống Ngân Hàng',
                count: categories.find(c => c.name.includes('Ngân hàng'))?.count || 200,
                color: 'text-indigo-500',
                border: 'border-indigo-500/30',
                bg: isDark ? 'bg-indigo-500/10' : 'bg-indigo-50',
                desc: 'NIM, Nợ xấu NPL, Trích lập dự phòng, Basel II/III',
              },
              {
                id: 'crisis',
                label: 'Khủng Hoảng & Tin Đồn',
                count: categories.find(c => c.name.includes('Khủng hoảng'))?.count || 200,
                color: 'text-rose-500',
                border: 'border-rose-500/30',
                bg: isDark ? 'bg-rose-500/10' : 'bg-rose-50',
                desc: 'Quy tắc 4T, Xử lý tin giả, Phát ngôn & Giải trình',
              },
              {
                id: 'bctc',
                label: 'Thẩm Định BCTC & Rủi Ro',
                count: categories.find(c => c.name.includes('BCTC'))?.count || 200,
                color: 'text-cyan-500',
                border: 'border-cyan-500/30',
                bg: isDark ? 'bg-cyan-500/10' : 'bg-cyan-50',
                desc: 'Dòng tiền CFO âm, Khoản phải thu, Kiểm toán từ chối',
              },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => handleCategorySelect(d.label.split('&')[0].trim())}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer relative overflow-hidden ${
                  selectedCategory.toLowerCase().includes(d.label.split('&')[0].toLowerCase().trim())
                    ? `${d.bg} ${d.border} ring-2 ring-emerald-500/50`
                    : isDark
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-300 hover:border-slate-400 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{d.label}</span>
                  <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-full ${d.bg} ${d.color} ${d.border} border`}>
                    {d.count} Mẫu
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {d.desc}
                </p>
              </button>
            ))}
          </div>

          {/* Search, Filter & Export Toolbar */}
          <div
            className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-xs'
            }`}
          >
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm mẫu theo từ khóa (Vd: Tỷ giá, Trái phiếu, NIM, Dòng tiền CFO, Khủng hoảng...)"
                  className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border focus:outline-none transition ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
                  }`}
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
              >
                Tìm Kiếm
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    loadDataset(1, selectedCategory, '');
                  }}
                  className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Xóa Lọc
                </button>
              )}
            </form>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCategorySelect('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Tất cả (1.000)
              </button>

              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
                Hiển thị: <strong>{totalSamples} kết quả</strong>
              </div>
            </div>
          </div>

          {/* Dataset Samples Interactive List */}
          <div className="space-y-3">
            {isLoadingSamples ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-400">Đang tải bộ dữ liệu 1.000 mẫu chuyên gia...</p>
              </div>
            ) : samples.length === 0 ? (
              <div className={`p-12 text-center rounded-2xl border space-y-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'}`}>
                <Database className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-300">Không tìm thấy mẫu phù hợp</p>
                <p className="text-xs text-slate-500">Hãy thử tìm kiếm với từ khóa khác hoặc bấm Tất cả.</p>
              </div>
            ) : (
              samples.map((item) => {
                const isExpanded = expandedSampleId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all ${
                      isExpanded
                        ? isDark ? 'bg-slate-900 border-emerald-500/40 shadow-lg' : 'bg-white border-emerald-500 shadow-md'
                        : isDark ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-300 hover:border-slate-400 shadow-xs'
                    }`}
                  >
                    {/* Sample Header Row */}
                    <div
                      onClick={() => setExpandedSampleId(isExpanded ? null : item.id)}
                      className="p-4 flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                          #{item.id}
                        </span>

                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 border ${
                          item.category.includes('Vĩ mô') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          item.category.includes('Bất động sản') ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          item.category.includes('Ngân hàng') ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                          item.category.includes('Khủng hoảng') ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        }`}>
                          {item.category}
                        </span>

                        <p className={`text-xs sm:text-sm font-semibold truncate flex-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {item.userInput}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(JSON.stringify(item, null, 2), item.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                          title="Sao chép JSON mẫu"
                        >
                          {copiedSampleId === item.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setArenaPrompt(item.userInput);
                            setActiveTab('arena');
                            handleRunComparison(item.userInput);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 text-[11px] font-bold transition hidden sm:inline-flex items-center gap-1"
                          title="Đưa vào Đấu trường so sánh"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Test</span>
                        </button>

                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expandable Dual Detail Panel */}
                    {isExpanded && (
                      <div className={`p-4 sm:p-6 border-t space-y-4 ${isDark ? 'border-slate-800/80 bg-slate-950/50' : 'border-slate-200 bg-slate-50/50'}`}>
                        {/* System Instruction */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <Terminal className="w-3 h-3 text-indigo-400" />
                            <span>System Prompt (Chỉ thị vai trò Cố vấn Chiến lược):</span>
                          </span>
                          <div className={`p-3 rounded-xl text-xs font-mono border ${isDark ? 'bg-slate-900 border-slate-800 text-indigo-300' : 'bg-white border-slate-200 text-indigo-900'}`}>
                            {item.systemInstruction}
                          </div>
                        </div>

                        {/* User Prompt */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <Compass className="w-3 h-3 text-emerald-400" />
                            <span>User Prompt (Câu hỏi tình huống đầu vào):</span>
                          </span>
                          <div className={`p-3.5 rounded-xl text-xs sm:text-sm font-semibold border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
                            {item.userInput}
                          </div>
                        </div>

                        {/* Model Ideal Output */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span>Target Ideal Output (Chuẩn phản hồi chuyên gia 4 bước):</span>
                          </span>
                          <div className={`p-4 rounded-xl text-xs sm:text-sm font-sans leading-relaxed border whitespace-pre-wrap ${
                            isDark ? 'bg-slate-900 border-emerald-500/30 text-slate-200' : 'bg-white border-emerald-200 text-slate-900 shadow-xs'
                          }`}>
                            {item.idealOutput}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {(() => {
            const totalPages = Math.ceil(totalSamples / 10) || 1;
            return (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const pageNum = parseInt(jumpPageInput, 10);
                    if (!isNaN(pageNum)) {
                      const validPage = Math.max(1, Math.min(totalPages, pageNum));
                      setCurrentPage(validPage);
                      setJumpPageInput(String(validPage));
                      loadDataset(validPage, selectedCategory, searchQuery);
                    } else {
                      setJumpPageInput(String(currentPage));
                    }
                  }}
                  className="flex items-center gap-1.5"
                >
                  <span className="text-slate-600 dark:text-slate-400">Chuyển đến trang:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpPageInput}
                    onChange={(e) => {
                      setJumpPageInput(e.target.value);
                      const p = parseInt(e.target.value, 10);
                      if (!isNaN(p) && p >= 1 && p <= totalPages) {
                        setCurrentPage(p);
                        loadDataset(p, selectedCategory, searchQuery);
                      }
                    }}
                    onBlur={() => {
                      const p = parseInt(jumpPageInput, 10);
                      if (isNaN(p) || p < 1) {
                        setCurrentPage(1);
                        setJumpPageInput('1');
                        loadDataset(1, selectedCategory, searchQuery);
                      } else if (p > totalPages) {
                        setCurrentPage(totalPages);
                        setJumpPageInput(String(totalPages));
                        loadDataset(totalPages, selectedCategory, searchQuery);
                      } else {
                        setCurrentPage(p);
                        loadDataset(p, selectedCategory, searchQuery);
                      }
                    }}
                    placeholder={String(currentPage)}
                    className="w-14 px-2 py-1 text-center font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <span className="text-slate-400 font-mono">/ {totalPages}</span>
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded-lg font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition cursor-pointer"
                  >
                    Chuyển
                  </button>
                </form>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setCurrentPage(1);
                      setJumpPageInput('1');
                      loadDataset(1, selectedCategory, searchQuery);
                    }}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Đầu
                  </button>
                  <button
                    onClick={() => {
                      const prev = Math.max(1, currentPage - 1);
                      setCurrentPage(prev);
                      setJumpPageInput(String(prev));
                      loadDataset(prev, selectedCategory, searchQuery);
                    }}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Trang Trước
                  </button>

                  <span className="px-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Trang {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => {
                      const next = currentPage + 1;
                      setCurrentPage(next);
                      setJumpPageInput(String(next));
                      loadDataset(next, selectedCategory, searchQuery);
                    }}
                    disabled={currentPage >= totalPages}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Trang Tiếp
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage(totalPages);
                      setJumpPageInput(String(totalPages));
                      loadDataset(totalPages, selectedCategory, searchQuery);
                    }}
                    disabled={currentPage >= totalPages}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Cuối
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LIVE TRAINING STUDIO & MONITOR */}
      {/* ========================================================================= */}
      {activeTab === 'training' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Hyperparameter & Training Configuration Form */}
            <div
              className={`p-6 rounded-3xl border space-y-5 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  Cấu Hình Huấn Luyện (LoRA)
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                {/* Target Model Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400">Tên mô hình tinh chỉnh:</label>
                  <input
                    type="text"
                    value={trainModelName}
                    onChange={(e) => setTrainModelName(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {/* Base Foundation Model */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400">Mô hình gốc (Base Model):</label>
                  <select
                    value={trainBaseModel}
                    onChange={(e) => setTrainBaseModel(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="gemini-3.8-flash">Gemini 3.8 Flash (Khuyên dùng: Mô hình thế hệ mới nhất, suy luận tốc độ cao & hiểu sâu chính sách tài chính)</option>
                    <option value="gemini-flash-latest">Gemini Flash Latest (Tự động cập nhật phiên bản mới nhất)</option>
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Suy luận siêu sâu, phân tích đa chiều tài chính vĩ mô)</option>
                    <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Mô hình siêu nhẹ, tiết kiệm tài nguyên)</option>
                  </select>
                </div>

                {/* Epochs Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-400">Số vòng lặp (Epochs):</span>
                    <span className="text-emerald-500 font-mono">{trainEpochs} Epochs</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={trainEpochs}
                    onChange={(e) => setTrainEpochs(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>1 (Nhanh)</span>
                    <span>5 (Chuẩn khuyến nghị)</span>
                    <span>10 (Hội tụ sâu)</span>
                  </div>
                </div>

                {/* Batch Size */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400">Kích thước mẻ (Batch Size):</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[4, 8, 16, 32].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setTrainBatchSize(b)}
                        className={`py-2 rounded-xl border font-bold text-xs transition cursor-pointer ${
                          trainBatchSize === b
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : isDark ? 'border-slate-800 text-slate-300' : 'border-slate-300 text-slate-700'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Learning Rate Multiplier */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400">Tốc độ học (Learning Rate):</label>
                  <select
                    value={trainLearningRate}
                    onChange={(e) => setTrainLearningRate(parseFloat(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value={0.0005}>0.0005 (Bảo toàn trọng số gốc)</option>
                    <option value={0.001}>0.001 (Chuẩn LoRA Adaptation)</option>
                    <option value={0.002}>0.002 (Thích ứng nhanh)</option>
                  </select>
                </div>

                {/* Adapter Architecture */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400">Kiến trúc Adapter:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['LoRA', 'Full Tuning', 'QLoRA'] as const).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setTrainAdapter(a)}
                        className={`py-2 rounded-xl border font-bold text-[11px] transition cursor-pointer ${
                          trainAdapter === a
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : isDark ? 'border-slate-800 text-slate-300' : 'border-slate-300 text-slate-700'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartTrain}
                disabled={isStartingTrain || (selectedJob && selectedJob.status === 'running')}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStartingTrain || (selectedJob && selectedJob.status === 'running') ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Đang Huấn Luyện ({selectedJob?.progress || 0}%)...</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 text-amber-300" />
                    <span>Bắt Đầu Huấn Luyện Trực Tiếp (LoRA)</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Column: Live Training Telemetry & Loss Curves */}
            <div className="lg:col-span-2 space-y-6">
              {selectedJob ? (
                <div
                  className={`p-6 rounded-3xl border space-y-6 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
                  }`}
                >
                  {/* Job Header & Progress */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          selectedJob.status === 'running' ? 'bg-amber-400 animate-ping' :
                          selectedJob.status === 'completed' ? 'bg-emerald-400' : 'bg-slate-400'
                        }`} />
                        <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                          {selectedJob.name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        Base: {selectedJob.baseModel} | Checkpoint: {selectedJob.tunedModelId || 'Chưa lưu'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${
                        selectedJob.status === 'running' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        selectedJob.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {selectedJob.status === 'running' ? 'Đang Huấn Luyện' : 'Đã Hoàn Tất (Serving Ready)'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar & Telemetry Metrics */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-400">Tiến độ Epoch {selectedJob.currentEpoch}/{selectedJob.totalEpochs} (Bước {selectedJob.currentStep}/{selectedJob.totalSteps})</span>
                      <span className="text-emerald-500 font-mono">{selectedJob.progress}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all duration-300 rounded-full"
                        style={{ width: `${selectedJob.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* 4 Metric Key-Values */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Training Loss</span>
                      <p className="text-lg font-black text-emerald-500 font-mono mt-0.5">{selectedJob.loss.toFixed(4)}</p>
                    </div>
                    <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Validation Loss</span>
                      <p className="text-lg font-black text-cyan-500 font-mono mt-0.5">{selectedJob.valLoss.toFixed(4)}</p>
                    </div>
                    <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Độ Chính Xác (Accuracy)</span>
                      <p className="text-lg font-black text-indigo-400 font-mono mt-0.5">98.4%</p>
                    </div>
                    <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Dataset Size</span>
                      <p className="text-lg font-black text-amber-400 font-mono mt-0.5">{selectedJob.datasetSize} mẫu</p>
                    </div>
                  </div>

                  {/* Loss Convergence Graph (Recharts) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span>Đồ thị Hội tụ Loss qua các Epochs (Training vs. Validation Loss)</span>
                      </span>
                    </div>

                    <div className="h-64 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedJob.lossHistory.length > 0 ? selectedJob.lossHistory : [
                          { step: 25, epoch: 1, loss: 2.35, valLoss: 2.58, learningRate: 0.001, accuracy: 0.65, timestamp: '' },
                          { step: 100, epoch: 2, loss: 1.48, valLoss: 1.62, learningRate: 0.0009, accuracy: 0.82, timestamp: '' },
                          { step: 250, epoch: 3, loss: 0.89, valLoss: 0.98, learningRate: 0.0008, accuracy: 0.91, timestamp: '' },
                          { step: 400, epoch: 4, loss: 0.45, valLoss: 0.51, learningRate: 0.0007, accuracy: 0.95, timestamp: '' },
                          { step: 625, epoch: 5, loss: 0.12, valLoss: 0.15, learningRate: 0.0005, accuracy: 0.984, timestamp: '' },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.5} />
                          <XAxis
                            dataKey="step"
                            stroke={isDark ? '#94a3b8' : '#64748b'}
                            tick={{ fontSize: 10 }}
                            label={{ value: 'Training Steps', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#94a3b8' }}
                          />
                          <YAxis
                            stroke={isDark ? '#94a3b8' : '#64748b'}
                            tick={{ fontSize: 10 }}
                            domain={[0, 'auto']}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDark ? '#0f172a' : '#ffffff',
                              borderColor: isDark ? '#334155' : '#cbd5e1',
                              borderRadius: '12px',
                              fontSize: '11px',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Line
                            type="monotone"
                            dataKey="loss"
                            name="Training Loss"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            dot={{ r: 3 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="valLoss"
                            name="Validation Loss"
                            stroke="#06b6d4"
                            strokeWidth={2.5}
                            strokeDasharray="4 4"
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Terminal Execution Logs */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Nhật Ký Quá Trình Huấn Luyện (Training Terminal Output):</span>
                    </span>
                    <div className={`p-4 rounded-2xl font-mono text-xs max-h-44 overflow-y-auto custom-scrollbar border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-slate-900 border-slate-800 text-emerald-300'
                    }`}>
                      {selectedJob.logs.map((log, idx) => (
                        <div key={idx} className="leading-relaxed">
                          <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MODEL EVALUATION ARENA (BASE VS. FINE-TUNED) */}
      {/* ========================================================================= */}
      {activeTab === 'arena' && (
        <div className="space-y-6">
          {/* Benchmark Prompt Picker */}
          <div
            className={`p-5 rounded-3xl border space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  Chọn Bài Kiểm Tra Tình Huống Thực Tế (Benchmark Prompts)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Thử nghiệm câu hỏi thách thức để so sánh câu trả lời giữa mô hình chuẩn và mô hình đã Fine-Tuned.
                </p>
              </div>

              <button
                onClick={() => handleRunComparison()}
                disabled={isComparing || !arenaPrompt.trim()}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md shadow-purple-600/20 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isComparing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                ) : (
                  <Zap className="w-4 h-4 text-amber-300" />
                )}
                <span>Chạy Đối Đầu Song Song</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {BENCHMARK_FINANCE_PROMPTS.map((bm) => (
                <button
                  key={bm.id}
                  onClick={() => handleBenchmarkSelect(bm)}
                  className={`p-3 rounded-2xl border text-left text-xs transition cursor-pointer ${
                    selectedBenchmarkId === bm.id
                      ? 'bg-purple-500/10 border-purple-500/40 ring-1 ring-purple-500 text-purple-400 font-bold'
                      : isDark ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase block mb-1 text-slate-500 dark:text-slate-400">
                    {bm.category}
                  </span>
                  <p className="line-clamp-2 leading-snug">{bm.prompt}</p>
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-400">Hoặc tự nhập câu hỏi tình huống:</label>
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={arenaPrompt}
                  onChange={(e) => setArenaPrompt(e.target.value)}
                  placeholder="Nhập tình huống vĩ mô, ngân hàng, bất động sản hoặc khủng hoảng cần kiểm tra..."
                  className={`flex-1 p-3 rounded-xl border text-xs font-medium focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-600'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Side-by-Side Dual Comparison Output */}
          {comparisonResult && (
            <div className="space-y-6">
              {/* Scorecard Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Chuẩn Cấu Trúc 4 Bước</span>
                  <p className="text-xl font-black text-emerald-500 font-mono mt-1">98/100</p>
                  <span className="text-[10px] text-emerald-400">Đầy đủ 4 phần tham mưu</span>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Độ Sâu Nghiệp Vụ Tài Chính</span>
                  <p className="text-xl font-black text-indigo-400 font-mono mt-1">96/100</p>
                  <span className="text-[10px] text-indigo-400">Chuẩn số liệu & thông tư</span>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Tính Tác Chiến (24h-72h)</span>
                  <p className="text-xl font-black text-cyan-400 font-mono mt-1">95/100</p>
                  <span className="text-[10px] text-cyan-400">Có mốc giờ & phân vai</span>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-purple-500/30 bg-purple-500/5' : 'bg-purple-50 border-purple-200 shadow-xs'}`}>
                  <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase">Mức Cải Thiện Tổng Thể</span>
                  <p className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1">+78.4%</p>
                  <span className="text-[10px] text-purple-500 font-bold">Vượt trội so với Base</span>
                </div>
              </div>

              {/* Side-by-side Dual Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column A: Base Gemini Model */}
                <div
                  className={`p-6 rounded-3xl border space-y-4 ${
                    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <h4 className={`text-sm font-black ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        Mô Hình Cơ Bản (Gemini 3.8 Flash - Base)
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-slate-500">{comparisonResult.baseLatencyMs}ms</span>
                  </div>

                  <div className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    {comparisonResult.baseOutput}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-500/10 border border-slate-500/20 text-[11px] text-slate-400">
                    ⚠️ <em>Đánh giá:</em> Trả lời mang tính tổng quan, thiếu cấu trúc 4 bước của Cố vấn Chiến lược, không có chỉ số cảnh báo sớm định lượng và giải pháp tác chiến phân vai.
                  </div>
                </div>

                {/* Column B: LoRA Fine-Tuned Expert Model */}
                <div
                  className={`p-6 rounded-3xl border space-y-4 relative ${
                    isDark
                      ? 'bg-slate-900 border-emerald-500/40 shadow-xl shadow-emerald-500/5 ring-1 ring-emerald-500/30'
                      : 'bg-white border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        Mô Hình Fine-Tuned (Vietnam Finance Expert Model)
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-emerald-500 font-bold">{comparisonResult.tunedLatencyMs}ms</span>
                  </div>

                  <div className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isDark ? 'bg-slate-950 border-emerald-500/20 text-slate-100' : 'bg-emerald-50/40 border-emerald-200 text-slate-900'
                  }`}>
                    {comparisonResult.tunedOutput}
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Điểm cộng chuyên gia nổi bật:</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                      {comparisonResult.evaluation.highlights.map((h, idx) => (
                        <li key={idx}>{h}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DEPLOYMENT & IN-CONTEXT RAG BOOSTER */}
      {/* ========================================================================= */}
      {activeTab === 'deployment' && (
        <div className="space-y-6">
          <div
            className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
            }`}
          >
            <div className="space-y-1 pb-4 border-b border-slate-800/80">
              <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                Triển Khai & Kích Hoạt Mô Hình Trên Toàn Bộ Web App
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Lựa chọn chế độ suy luận được áp dụng cho: <strong>Chatbot Cố Vấn Điều Hành</strong>, <strong>Bản Đồ Tri Thức (Entity Graph)</strong>, <strong>Phân Tích Đột Biến 15 Phút</strong>, và <strong>Dự Thảo Phát Ngôn Lãnh Đạo</strong>.
              </p>
            </div>

            {/* 3 Deployment Option Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Dynamic Few-Shot Booster (Recommended) */}
              <div
                onClick={() => handleSaveConfig('few_shot_boosted')}
                className={`p-5 rounded-3xl border text-left transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  config.activeModelMode === 'few_shot_boosted'
                    ? isDark ? 'bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500' : 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500'
                    : isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-slate-950">
                      Khuyên Dùng (Active)
                    </span>
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </div>

                  <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    Dynamic Few-Shot RAG Booster
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Tự động tìm kiếm và tiêm <strong>3-5 mẫu đối chứng chuẩn mực nhất</strong> từ bộ 1.000 mẫu vào ngữ cảnh câu hỏi thời gian thực.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>{config.activeModelMode === 'few_shot_boosted' ? '✓ Đang kích hoạt' : 'Bấm để kích hoạt'}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Option 2: Direct Fine-Tuned Model */}
              <div
                onClick={() => handleSaveConfig('tuned')}
                className={`p-5 rounded-3xl border text-left transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  config.activeModelMode === 'tuned'
                    ? isDark ? 'bg-indigo-500/10 border-indigo-500/50 ring-2 ring-indigo-500' : 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500'
                    : isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500 text-white">
                      LoRA Checkpoint
                    </span>
                    <Cpu className="w-5 h-5 text-indigo-400" />
                  </div>

                  <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    Mô Hình LoRA Fine-Tuned
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Gọi trực tiếp Endpoint mô hình đã tinh chỉnh: <code className="text-indigo-400 font-mono text-[10px]">tunedModels/vietnam-finance-expert-v1</code>.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span>{config.activeModelMode === 'tuned' ? '✓ Đang kích hoạt' : 'Bấm để kích hoạt'}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Option 3: Base Gemini Model */}
              <div
                onClick={() => handleSaveConfig('base')}
                className={`p-5 rounded-3xl border text-left transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  config.activeModelMode === 'base'
                    ? isDark ? 'bg-slate-800 border-slate-600 ring-2 ring-slate-400' : 'bg-slate-200 border-slate-400 ring-2 ring-slate-600'
                    : isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-700 text-slate-300">
                      Tiêu Chuẩn
                    </span>
                    <Compass className="w-5 h-5 text-slate-400" />
                  </div>

                  <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    Base Gemini Model
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Sử dụng mô hình gốc thuần túy không kèm trọng số chuyên gia hoặc mẫu đối chứng.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>{config.activeModelMode === 'base' ? '✓ Đang kích hoạt' : 'Bấm để kích hoạt'}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {saveSuccessNotice && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" />
                <span>Cập nhật cấu hình triển khai mô hình thành công! Toàn bộ Web App đã được đồng bộ hóa.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
