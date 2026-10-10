import React, { useState, useEffect } from 'react';
import {
  Building2,
  Radio,
  Sparkles,
  Zap,
  Globe,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Activity,
  Server,
  Database,
  RefreshCw,
} from 'lucide-react';
import { TimeRange } from '../types';

interface FullscreenLoadingOverlayProps {
  isVisible: boolean;
  isDark?: boolean;
  isVietnamese?: boolean;
  timeRange?: TimeRange;
  hasExistingData?: boolean;
  onDismissOrSkip?: () => void;
}

interface LoadingStage {
  id: number;
  labelVi: string;
  labelEn: string;
  descVi: string;
  descEn: string;
  icon: React.ComponentType<{ className?: string }>;
  minPercent: number;
}

const STAGES: LoadingStage[] = [
  {
    id: 1,
    labelVi: 'Khởi tạo luồng quét 30 nguồn trọng điểm',
    labelEn: 'Initializing 30 Core Sources',
    descVi: 'Thiết lập kết nối với Cổng TTĐT Bộ Tài chính & 30 cơ quan báo chí chính thống',
    descEn: 'Connecting to MoF Portal and top 30 official financial publications',
    icon: Globe,
    minPercent: 0,
  },
  {
    id: 2,
    labelVi: 'Thu thập & Khử trùng lặp tin tức',
    labelEn: 'Aggregating & Deduplicating',
    descVi: 'Cào dữ liệu, lọc mốc thời gian chặt chẽ và khử trùng lặp nội dung đa nguồn',
    descEn: 'Crawling headlines, applying strict timestamp bounds and deduplication',
    icon: Database,
    minPercent: 30,
  },
  {
    id: 3,
    labelVi: 'Phân tích sắc thái & Rủi ro vĩ mô',
    labelEn: 'Sentiment & Macro Risk Analysis',
    descVi: 'Đánh giá sắc thái 3 chiều, tính điểm ưu tiên MoF và rà soát cảnh báo khẩn cấp',
    descEn: 'Multi-layer sentiment scoring, MoF priority matrix & risk triage',
    icon: Cpu,
    minPercent: 65,
  },
  {
    id: 4,
    labelVi: 'Hoàn tất Bảng điều khiển Lãnh đạo',
    labelEn: 'Readying Executive Dashboard',
    descVi: 'Tổng hợp đồ thị xu hướng, biểu đồ tương quan và chuẩn bị giao diện',
    descEn: 'Generating trend charts, sector breakdown and rendering dashboard',
    icon: ShieldCheck,
    minPercent: 90,
  },
];

export const FullscreenLoadingOverlay: React.FC<FullscreenLoadingOverlayProps> = ({
  isVisible,
  isDark = true,
  isVietnamese = true,
  timeRange = '24h',
  hasExistingData = false,
  onDismissOrSkip,
}) => {
  const [percent, setPercent] = useState<number>(12);
  const [telemetry, setTelemetry] = useState<{
    currentSourceIndex: number;
    totalSources: number;
    scannedSourcesCount: number;
    currentSourceName: string;
    totalEvaluated: number;
    totalMatched: number;
  }>({
    currentSourceIndex: 1,
    totalSources: 30,
    scannedSourcesCount: 1,
    currentSourceName: 'Cổng Thông tin điện tử Bộ Tài chính (mof.gov.vn)',
    totalEvaluated: 0,
    totalMatched: 0,
  });

  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [canSkip, setCanSkip] = useState<boolean>(false);

  // Allow skip if loading takes more than 4 seconds and there's previous data or user wants to enter
  useEffect(() => {
    if (!isVisible) {
      setPercent(10);
      setCanSkip(false);
      return;
    }

    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, 4000);

    return () => clearTimeout(skipTimer);
  }, [isVisible]);

  // Poller for real backend crawl telemetry
  useEffect(() => {
    if (!isVisible) return;

    let isMounted = true;

    const fetchTelemetry = async () => {
      try {
        const res = await fetch('/api/scrape/source-telemetry');
        if (res.ok && isMounted) {
          const json = await res.json();
          const total = json.totalSources || 30;
          const current = Math.min(total, json.currentSourceIndex || json.scannedSourcesCount || 1);
          const currentName = json.currentSource?.name || json.currentSource?.shortName || 'Hệ thống báo chí quốc gia';

          setTelemetry({
            currentSourceIndex: current,
            totalSources: total,
            scannedSourcesCount: json.scannedSourcesCount || current,
            currentSourceName: currentName,
            totalEvaluated: json.totalEvaluated || 0,
            totalMatched: json.totalMatched || 0,
          });

          // Calculate percent from sources scanned, scaled between 15% and 96%
          const sourceRatio = total > 0 ? current / total : 0;
          const calculatedPercent = Math.min(96, Math.max(15, Math.round(15 + sourceRatio * 80)));
          setPercent((prev) => Math.max(prev, calculatedPercent));
        }
      } catch {
        // Fallback smooth incremental simulation
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 600);

    // Fallback simulation timer in case backend responds in single burst
    const simTimer = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 95) return 95;
        const inc = prev < 50 ? 5 : prev < 80 ? 3 : 1;
        return prev + inc;
      });
    }, 500);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearInterval(simTimer);
    };
  }, [isVisible]);

  // Update active stage based on percent
  useEffect(() => {
    if (percent >= 90) setActiveStageIndex(3);
    else if (percent >= 65) setActiveStageIndex(2);
    else if (percent >= 30) setActiveStageIndex(1);
    else setActiveStageIndex(0);
  }, [percent]);

  if (!isVisible) return null;

  const currentStage = STAGES[activeStageIndex];

  return (
    <div
      id="fullscreen-initial-loading-overlay"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 sm:p-6 transition-all duration-500 backdrop-blur-md select-none ${
        isDark ? 'bg-slate-950/98 text-slate-100' : 'bg-slate-50/98 text-slate-900'
      }`}
    >
      {/* Subtle Background Radial Aura */}
      <div
        className={`absolute inset-0 pointer-events-none opacity-40 transition-opacity duration-700 ${
          isDark
            ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950/20 to-transparent'
            : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/50 via-slate-100/30 to-transparent'
        }`}
      />

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center space-y-6">
        {/* Emblem & Spinner Icon */}
        <div className="relative flex items-center justify-center">
          {/* Animated Outer Pulse Rings */}
          <div className="absolute w-28 h-28 rounded-full border border-emerald-500/20 animate-ping duration-1000" />
          <div className="absolute w-24 h-24 rounded-full border-2 border-dashed border-emerald-500/40 animate-spin" style={{ animationDuration: '10s' }} />

          {/* Central Official MoF Seal */}
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl relative border transition-transform ${
              isDark
                ? 'bg-slate-900 border-emerald-500/50 shadow-emerald-950/50'
                : 'bg-white border-emerald-600 shadow-emerald-200/50'
            }`}
          >
            <Building2 className={`w-10 h-10 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-500 text-slate-950 shadow-md">
              <Zap className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
        </div>

        {/* Official Header & Subtitle */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border shadow-2xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>
              {isVietnamese
                ? 'Hệ Thống Giám Sát Thông Tin Báo Chí & Mạng Xã Hội'
                : 'Financial Intelligence & Media Monitoring System'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-100">
            {isVietnamese ? 'Bộ Tài chính Việt Nam' : 'Ministry of Finance, Vietnam'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            {isVietnamese
              ? 'Đang kết nối trung tâm dữ liệu 30 nguồn tin tức trọng điểm, phân tích sắc thái thị trường và chuẩn bị Bảng điều khiển Lãnh đạo.'
              : 'Connecting to 30 core news sources, analyzing sentiment, and loading the executive intelligence dashboard.'}
          </p>
        </div>

        {/* Progress Card */}
        <div
          className={`w-full p-5 rounded-2xl border shadow-xl backdrop-blur-md transition-all text-left space-y-4 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {/* Active Stage Header & Percentage */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                {React.createElement(currentStage.icon, { className: 'w-5 h-5 text-emerald-400' })}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-slate-100 truncate">
                  {isVietnamese ? currentStage.labelVi : currentStage.labelEn}
                </h3>
                <p className="text-xs text-slate-400 truncate">
                  {isVietnamese ? currentStage.descVi : currentStage.descEn}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-2xl font-black font-mono text-emerald-400">
                {percent}%
              </span>
            </div>
          </div>

          {/* Precision Animated Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 transition-all duration-300 rounded-full relative"
              style={{ width: `${percent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>

          {/* Live Scanner Telemetry Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
            {/* Chip 1: Sources scanned */}
            <div
              className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Globe className="w-3 h-3 text-sky-400" />
                <span>{isVietnamese ? 'Nguồn báo chí:' : 'Sources:'}</span>
              </span>
              <span className="font-mono font-bold text-sm text-slate-200 mt-1">
                {Math.min(30, telemetry.scannedSourcesCount)} / {telemetry.totalSources}
              </span>
            </div>

            {/* Chip 2: Articles evaluated */}
            <div
              className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Activity className="w-3 h-3 text-amber-400" />
                <span>{isVietnamese ? 'Tin đã duyệt:' : 'Evaluated:'}</span>
              </span>
              <span className="font-mono font-bold text-sm text-amber-300 mt-1">
                {telemetry.totalEvaluated > 0 ? telemetry.totalEvaluated : 'Đang duyệt...'}
              </span>
            </div>

            {/* Chip 3: Time Range */}
            <div
              className={`col-span-2 sm:col-span-1 p-2.5 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Server className="w-3 h-3 text-emerald-400" />
                <span>{isVietnamese ? 'Khung thời gian:' : 'Range:'}</span>
              </span>
              <span className="font-mono font-bold text-sm text-emerald-400 mt-1">
                {timeRange.toUpperCase()} (Thời gian thực)
              </span>
            </div>
          </div>

          {/* Current Source Ticker */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono overflow-hidden">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
            <span className="text-slate-400 shrink-0">
              {isVietnamese ? 'Đang quét:' : 'Scanning:'}
            </span>
            <span className="text-emerald-300 font-bold truncate">
              {telemetry.currentSourceName}
            </span>
          </div>
        </div>

        {/* 4 Steps Visual Timeline */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {STAGES.map((st, idx) => {
            const isDone = percent >= st.minPercent + 25 || idx < activeStageIndex;
            const isCurrent = idx === activeStageIndex;
            return (
              <div
                key={st.id}
                className={`p-2 rounded-xl border transition-all flex items-center gap-2 text-left ${
                  isCurrent
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-xs'
                    : isDone
                    ? 'bg-slate-900/50 border-slate-800 text-slate-400'
                    : 'bg-slate-950/30 border-slate-800/50 text-slate-600'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                )}
                <span className="truncate font-semibold text-[11px]">
                  {isVietnamese ? st.labelVi : st.labelEn}
                </span>
              </div>
            );
          })}
        </div>

        {/* Skip or Dismiss Button (User Safety Guard) */}
        {(canSkip || hasExistingData) && onDismissOrSkip && (
          <div className="pt-2 animate-in fade-in duration-300">
            <button
              onClick={onDismissOrSkip}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span>{isVietnamese ? 'Vào bảng điều khiển ngay' : 'Enter Dashboard Now'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
