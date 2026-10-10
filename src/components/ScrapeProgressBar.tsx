import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Radio,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Layers,
  X,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Cpu,
  Activity,
  Check,
  Server,
  TrendingUp,
} from 'lucide-react';
import { useTheme } from '../lib/theme';
import { TimeRange } from '../types';

interface ScrapeProgressBarProps {
  isLoading: boolean;
  totalArticlesFound?: number;
  timeRange: TimeRange;
  onCancel?: () => void;
  isOfficialOnly?: boolean;
}

interface ScrapeStage {
  id: number;
  title: string;
  description: string;
  targetPercent: number;
  icon: React.ComponentType<{ className?: string }>;
}

interface RecentSourceItem {
  sourceId: string;
  sourceName: string;
  shortName: string;
  domain: string;
  tier: string;
  tierLabel: string;
  categoryLabelVi: string;
  articlesEvaluated: number;
  matchingArticlesCount: number;
  status: 'matched' | 'no_matches' | 'unreachable';
  latencyMs: number;
  crawlMethod?: string;
  crawlMethodLabel?: string;
  evaluationNote?: string;
}

interface ActiveSourceTarget {
  id: string;
  name: string;
  shortName: string;
  domain: string;
  tier: string;
  tierLabel: string;
  categoryLabelVi: string;
}

const STAGES: ScrapeStage[] = [
  {
    id: 1,
    title: 'Khởi động & Quét Tuần Tự 150 Nguồn Báo Chí',
    description: 'Truy cập tuần tự từng nguồn một (Tier 1 -> Tier 2 -> Cổng TTĐT BTC)',
    targetPercent: 25,
    icon: Globe,
  },
  {
    id: 2,
    title: 'Trích Xuất Đa Tầng & Thẩm Định Từng Nguồn',
    description: 'Bóc tách DOM & RSS, đối soát mốc thời gian UTC+7 và đếm bài thoả mãn',
    targetPercent: 55,
    icon: Radio,
  },
  {
    id: 3,
    title: 'Khử Nhiễu & Phân Loại 16 Phân Hệ Tài Chính',
    description: 'Đối soát Từ điển Ngữ cảnh 2026, loại bỏ tin PR/Showbiz & phân định lĩnh vực',
    targetPercent: 80,
    icon: Layers,
  },
  {
    id: 4,
    title: 'AI Phân Tích Sắc Thái & Đo Lường Điểm Rủi Ro',
    description: 'Bóc tách thực thể (NER), tính toán độ tin cậy rủi ro (≥ 70%) & tóm tắt TL;DR',
    targetPercent: 95,
    icon: Cpu,
  },
  {
    id: 5,
    title: 'Đồng Bộ Hóa Dữ Liệu & Tham Mưu Điều Hành',
    description: 'Cập nhật Executive Dashboard, chuỗi sự kiện & chỉ báo trọng điểm',
    targetPercent: 100,
    icon: Sparkles,
  },
];

export const ScrapeProgressBar: React.FC<ScrapeProgressBarProps> = ({
  isLoading,
  totalArticlesFound = 0,
  timeRange,
  onCancel,
  isOfficialOnly = false,
}) => {
  const { isDark } = useTheme();
  const [progress, setProgress] = useState<number>(0);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [processedSources, setProcessedSources] = useState<number>(0);
  const [matchedSourcesCount, setMatchedSourcesCount] = useState<number>(0);
  const [itemsParsed, setItemsParsed] = useState<number>(0);
  const [itemsEvaluated, setItemsEvaluated] = useState<number>(0);
  const [currentSourceIndex, setCurrentSourceIndex] = useState<number>(0);
  const [activeSource, setActiveSource] = useState<ActiveSourceTarget | null>(null);
  const [recentSources, setRecentSources] = useState<RecentSourceItem[]>([]);

  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const telemetryIntervalRef = useRef<number | null>(null);

  // Poll live telemetry from the backend while scraping
  const fetchLiveTelemetry = async () => {
    try {
      const res = await fetch('/api/scrape/source-telemetry');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const count = json.scannedSourcesCount || 0;
          setProcessedSources(Math.min(150, count));
          if (json.matchedSourcesCount !== undefined) {
            setMatchedSourcesCount(Math.min(150, json.matchedSourcesCount));
          }
          if (json.currentSourceIndex !== undefined) {
            setCurrentSourceIndex(json.currentSourceIndex);
          }
          if (json.currentSource) {
            setActiveSource(json.currentSource);
          }
          if (Array.isArray(json.recentScanned)) {
            setRecentSources(json.recentScanned);
          }
          
          const totalEval = json.totalEvaluated !== undefined ? json.totalEvaluated : 0;
          const totalMatch = json.totalMatched !== undefined ? json.totalMatched : 0;
          setItemsEvaluated(totalEval);
          setItemsParsed(totalMatch);

          // Calculate direct percent based on source progression (1 to 150)
          const liveIndex = json.currentSourceIndex || count;
          const calculatedPercent = Math.min(94, Math.max(5, Math.round((liveIndex / 150) * 90) + 4));
          setProgress((prev) => Math.max(prev, calculatedPercent));

          if (calculatedPercent < 25) setCurrentStageIndex(0);
          else if (calculatedPercent < 55) setCurrentStageIndex(1);
          else if (calculatedPercent < 80) setCurrentStageIndex(2);
          else setCurrentStageIndex(3);
        }
      }
    } catch {
      // Ignore background telemetry polling failures
    }
  };

  // When isLoading turns true, start animation and telemetry tracking
  useEffect(() => {
    // Visibility change handler: Immediately sync telemetry and elapsed time when tab regains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLiveTelemetry();
        if (startTimeRef.current > 0) {
          setElapsedMs(Date.now() - startTimeRef.current);
        }
      }
    };

    if (isLoading) {
      setProgress(5);
      setCurrentStageIndex(0);
      setElapsedMs(0);
      setIsCompleted(false);
      setProcessedSources(0);
      setMatchedSourcesCount(0);
      setCurrentSourceIndex(1);
      setItemsParsed(0);
      setItemsEvaluated(0);
      setRecentSources([]);
      setActiveSource({
        id: 'init',
        name: 'Đang kết nối 150 nguồn báo chí...',
        shortName: 'Khởi tạo luồng cào',
        domain: 'mof.gov.vn',
        tier: 'tier1',
        tierLabel: 'Tier 1 - Cơ quan trọng yếu',
        categoryLabelVi: 'Cổng TTĐT Bộ Tài chính',
      });
      startTimeRef.current = Date.now();

      // Telemetry Timer
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 100);

      // Fetch telemetry immediately and then poll every 350ms for high responsiveness
      fetchLiveTelemetry();
      telemetryIntervalRef.current = window.setInterval(fetchLiveTelemetry, 350);

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Smooth step progress fallback
      progressIntervalRef.current = window.setInterval(() => {
        setProgress((prev) => {
          if (prev < 94) {
            return prev + 0.5;
          }
          return 94;
        });
      }, 250);
    } else {
      // Loading finished: Sync with exact returned article count
      if (progress > 0 && !isCompleted) {
        setProgress(100);
        setCurrentStageIndex(4);
        setProcessedSources(150);
        setIsCompleted(true);
        setItemsParsed(totalArticlesFound);

        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        if (telemetryIntervalRef.current) clearInterval(telemetryIntervalRef.current);

        // Fetch final telemetry once
        fetchLiveTelemetry();

        // Auto dismiss / fade out completion status after 5 seconds
        const timeout = setTimeout(() => {
          setProgress(0);
          setIsCompleted(false);
        }, 5000);

        return () => clearTimeout(timeout);
      }
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (telemetryIntervalRef.current) clearInterval(telemetryIntervalRef.current);
    };
  }, [isLoading, totalArticlesFound]);

  if (!isLoading && !isCompleted && progress === 0) {
    return null;
  }

  const currentStage = STAGES[currentStageIndex] || STAGES[0];
  const elapsedSec = (elapsedMs / 1000).toFixed(1);

  return (
    <div className="w-full transition-all duration-300 animate-fadeIn" id="scrape-live-progress-container">
      <div
        className={`rounded-2xl border p-4 sm:p-5 shadow-xl transition-all relative overflow-hidden ${
          isDark
            ? 'bg-slate-900/95 border-indigo-500/40 text-slate-100 shadow-indigo-950/30'
            : 'bg-white/95 border-indigo-200 text-slate-900 shadow-indigo-100'
        }`}
      >
        {/* Background Subtle Gradient Pulse */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-emerald-500/5 pointer-events-none" />

        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-indigo-600 text-white animate-pulse shadow-md shadow-indigo-500/20'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <RotateCw className="w-5 h-5 animate-spin" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-400 dark:text-indigo-300">
                  {isCompleted
                    ? 'Hoàn tất phiên quét dữ liệu'
                    : isOfficialOnly
                    ? 'Đang quét 8 Cổng TTĐT Bộ Tài chính'
                    : 'Đang quét toàn diện 150 Nguồn Báo chí & Cổng TTĐT'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Khung giờ: {timeRange}
                </span>
                {isCompleted && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {totalArticlesFound} bài viết hợp lệ
                  </span>
                )}
              </div>

              <h4 className="text-sm font-bold mt-0.5 flex items-center gap-2">
                <span>{isCompleted ? 'Đã thẩm định 150 nguồn và đồng bộ vào hệ thống điều hành' : currentStage.title}</span>
              </h4>
            </div>
          </div>

          {/* Right Action & Controls */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {/* Live Timer Readout */}
            <div
              className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border ${
                isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{elapsedSec}s</span>
            </div>

            {/* Percentage Display */}
            <div className="px-3 py-1 rounded-xl text-xs font-black font-mono bg-indigo-600 text-white shadow-sm">
              {Math.round(progress)}%
            </div>

            {/* Toggle Details Button */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title={isMinimized ? 'Mở rộng chi tiết tiến độ' : 'Thu gọn tiến độ'}
            >
              {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            {/* Cancel Button */}
            {isLoading && onCancel && (
              <button
                onClick={onCancel}
                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-600/10 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition cursor-pointer flex items-center gap-1"
                title="Hủy phiên quét này"
              >
                <X className="w-3.5 h-3.5" />
                <span>Hủy</span>
              </button>
            )}
          </div>
        </div>

        {/* Visual Progress Bar Track */}
        <div className="relative w-full h-3 bg-slate-800/80 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-700/60 p-0.5 mb-3 z-10">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer light reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Detailed Stages & Telemetry (Visible when not minimized) */}
        {!isMinimized && (
          <div className="space-y-3 pt-2 border-t border-slate-800/70 relative z-10">
            {/* 5 Sequential Stage Steps */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {STAGES.map((stg, index) => {
                const IconComponent = stg.icon;
                const isPast = progress >= stg.targetPercent;
                const isCurrent = currentStageIndex === index && !isCompleted;

                return (
                  <div
                    key={stg.id}
                    className={`p-2 rounded-xl border transition-all ${
                      isPast
                        ? isDark
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : isCurrent
                        ? isDark
                          ? 'bg-indigo-950/40 border-indigo-500/60 text-indigo-200 ring-1 ring-indigo-500/50'
                          : 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-400'
                        : isDark
                        ? 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                        : 'bg-slate-50/60 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div
                        className={`p-1 rounded-md ${
                          isPast
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isCurrent
                            ? 'bg-indigo-600 text-white animate-pulse'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        <IconComponent className="w-3 h-3" />
                      </div>
                      <span className="text-[11px] font-black leading-tight truncate">
                        {index + 1}. {stg.title.split(' ')[0]}...
                      </span>
                    </div>
                    <p className="text-[10px] line-clamp-2 leading-relaxed opacity-80">{stg.description}</p>
                  </div>
                );
              })}
            </div>

            {/* LIVE ACTIVE SOURCE RADAR (Real-time connection status) */}
            {!isCompleted && activeSource && (
              <div
                className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark
                    ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-100'
                    : 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 shrink-0">
                    <Radio className="w-4 h-4 animate-pulse text-indigo-400" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Nguồn {currentSourceIndex}/150
                      </span>
                      <span className="text-xs font-bold text-slate-100 dark:text-white">
                        {activeSource.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        ({activeSource.domain})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span className="text-amber-400 font-medium">{activeSource.tierLabel || activeSource.tier}</span>
                      <span>•</span>
                      <span className="text-sky-400">{activeSource.categoryLabelVi || 'Báo chí chuyên ngành'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 animate-pulse">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    Đang bóc tách & thẩm định...
                  </span>
                </div>
              </div>
            )}

            {/* LIVE STREAM OF RECENTLY SCANNED SOURCES (Ticker Feed) */}
            {recentSources.length > 0 && (
              <div
                className={`p-2.5 rounded-xl border text-xs font-mono ${
                  isDark ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/60 text-[11px] text-slate-400 font-sans">
                  <span className="flex items-center gap-1.5 font-bold text-slate-300">
                    <Server className="w-3.5 h-3.5 text-emerald-400" />
                    Nhật ký thẩm định tuần tự thời gian thực (Live Source Verification Stream):
                  </span>
                  <span className="text-slate-500">
                    {processedSources}/150 hoàn tất
                  </span>
                </div>

                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {recentSources.map((item, idx) => (
                    <div
                      key={`${item.sourceId}-${idx}`}
                      title={item.evaluationNote || `${item.shortName || item.sourceName} (${item.domain}) - ${item.articlesEvaluated || 0} tin thẩm định`}
                      className="flex items-center justify-between gap-2 py-0.5 px-1.5 rounded hover:bg-slate-800/40 text-[11px]"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {item.matchingArticlesCount > 0 ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-200 truncate max-w-[170px] sm:max-w-[220px]">
                          {item.shortName || item.sourceName}
                        </span>
                        {item.crawlMethodLabel && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800/80 text-cyan-300/90 border border-cyan-500/20 shrink-0">
                            {item.crawlMethodLabel}
                          </span>
                        )}
                        <span className="text-slate-500 text-[10px] hidden sm:inline truncate">
                          ({item.domain})
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-slate-400 text-[10px]" title={item.evaluationNote}>
                          {Math.max(item.articlesEvaluated || 0, item.matchingArticlesCount > 0 ? item.matchingArticlesCount : 1)} tin đã duyệt
                        </span>
                        <span
                          title={item.evaluationNote || undefined}
                          className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            item.matchingArticlesCount > 0
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : item.evaluationNote?.includes('kho lưu trữ')
                              ? 'bg-amber-500/10 text-amber-400/80 border border-amber-500/20'
                              : 'text-slate-500'
                          }`}
                        >
                          {item.matchingArticlesCount > 0
                            ? `✅ +${item.matchingArticlesCount} bài đạt chuẩn`
                            : item.evaluationNote?.includes('kho lưu trữ')
                            ? 'Chưa có tin mới'
                            : '0 bài trong phiên'}
                        </span>
                        <span className="text-slate-500 text-[10px]">{item.latencyMs}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Telemetry Status Counters */}
            <div
              className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                isDark ? 'bg-slate-950/60 border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Nguồn báo đã kết nối:</span>
                  <span className="font-bold text-indigo-400 font-mono">
                    {processedSources}/150 nguồn ({Math.round((processedSources / 150) * 100)}%)
                  </span>
                </div>

                <div className="flex items-center gap-1.5" title="Số cơ quan báo chí trong danh bạ 150 nguồn có bài viết thoả mãn tiêu chí">
                  <span className="text-slate-500">Nguồn có bài thoả mãn:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {Math.min(150, matchedSourcesCount)}/150 cơ quan
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">{isCompleted ? 'Bài viết hợp lệ thu nạp:' : 'Bài đã thẩm định:'}</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {isCompleted ? `${itemsParsed} bài` : `${itemsEvaluated > 0 ? itemsEvaluated : itemsParsed} bài`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Phân hệ:</span>
                  <span className="font-bold text-sky-400">16 Lĩnh vực MoF</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Thuật toán Quét tuần tự & Thẩm định thời gian thực</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
