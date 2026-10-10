import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Table,
  FileCheck2,
  Globe2,
  PieChart,
  Landmark,
  Sparkles,
  Zap,
  ShieldAlert,
  Award,
  ShieldCheck,
  Building2,
  Globe,
  ChevronDown,
  Layers,
  Database,
  BookOpen,
  Cpu,
  Network,
  Activity,
  SlidersHorizontal,
  Check,
  RotateCw,
  Flame,
  AlertTriangle,
  Minus,
} from 'lucide-react';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { ViewDensityMode, TimeRange } from '../types';
import { CmsNavigationTab } from './CmsSidebar';
import { BackgroundSyncIndicator } from './BackgroundSyncIndicator';
import { backgroundSyncManager } from '../services/backgroundSyncManager';

interface ExecutiveCommandBarProps {
  cmsTab: CmsNavigationTab;
  onSelectTab: (tab: CmsNavigationTab) => void;
  totalFound: number;
  crisisCount: number;
  highConfidenceCrisisCount: number;
  showHighConfidenceOnly: boolean;
  onToggleHighConfidenceOnly: () => void;
  highImpactCount?: number;
  showHighImpactOnly?: boolean;
  onToggleHighImpactOnly?: () => void;
  interventionCount?: number;
  showInterventionOnly?: boolean;
  onToggleInterventionOnly?: () => void;
  positiveCount: number;
  highConfidenceBrightSpotCount: number;
  showHighConfidenceBrightSpotOnly: boolean;
  onToggleHighConfidenceBrightSpotOnly: () => void;
  neutralCount?: number;
  neutralPercentage?: number;
  showNeutralOnly?: boolean;
  onToggleNeutralOnly?: () => void;
  excludeAnomalies: boolean;
  onToggleExcludeAnomalies: () => void;
  integrityReport: {
    integrityRate: number;
    validCount: number;
    anomalousCount: number;
    totalChecked: number;
  } | null;
  isOfficialOnly: boolean;
  onSelectOfficialSource: (officialOnly: boolean) => void;
  onOpenOfficialPortalsModal: () => void;
  turboSilentMode: boolean;
  onToggleTurboSilentMode: () => void;
  densityMode: ViewDensityMode;
  onDensityModeChange: (mode: ViewDensityMode) => void;
  onOpenAdvisorChat: () => void;
  isLoading: boolean;
  timeRange: TimeRange;
  onTriggerBackgroundScrape: () => void;
  distantHorizonCount?: number;
  showDivergenceOnly?: boolean;
  onToggleDivergenceOnly?: () => void;
  showEarlyHorizonOnly?: boolean;
  onToggleEarlyHorizonOnly?: () => void;
  showEarlyWarningOnly?: boolean;
  onToggleEarlyWarningOnly?: () => void;
}

export const ExecutiveCommandBar: React.FC<ExecutiveCommandBarProps> = ({
  cmsTab,
  onSelectTab,
  totalFound,
  crisisCount,
  highConfidenceCrisisCount,
  showHighConfidenceOnly,
  onToggleHighConfidenceOnly,
  highImpactCount = 0,
  showHighImpactOnly = false,
  onToggleHighImpactOnly,
  interventionCount = 0,
  showInterventionOnly = false,
  onToggleInterventionOnly,
  positiveCount,
  highConfidenceBrightSpotCount,
  showHighConfidenceBrightSpotOnly,
  onToggleHighConfidenceBrightSpotOnly,
  neutralCount = 0,
  neutralPercentage,
  showNeutralOnly = false,
  onToggleNeutralOnly,
  excludeAnomalies,
  onToggleExcludeAnomalies,
  integrityReport,
  isOfficialOnly,
  onSelectOfficialSource,
  onOpenOfficialPortalsModal,
  turboSilentMode,
  onToggleTurboSilentMode,
  densityMode,
  onDensityModeChange,
  onOpenAdvisorChat,
  isLoading,
  timeRange,
  onTriggerBackgroundScrape,
  distantHorizonCount = 0,
  showDivergenceOnly = false,
  onToggleDivergenceOnly,
  showEarlyHorizonOnly = false,
  onToggleEarlyHorizonOnly,
  showEarlyWarningOnly = false,
  onToggleEarlyWarningOnly,
}) => {
  const { isDark } = useTheme();
  const { isVietnamese } = useI18n();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const primaryTabs: { id: CmsNavigationTab; labelVi: string; labelEn: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'dashboard',
      labelVi: 'Tổng quan',
      labelEn: 'Overview',
      icon: <LayoutDashboard className="w-3.5 h-3.5" />,
    },
    {
      id: 'table',
      labelVi: 'Dòng tin bài',
      labelEn: 'Articles',
      icon: <Table className="w-3.5 h-3.5" />,
      count: totalFound,
    },
    {
      id: 'briefing',
      labelVi: 'Tham mưu & Dự thảo',
      labelEn: 'Briefing',
      icon: <FileCheck2 className="w-3.5 h-3.5" />,
    },
    {
      id: 'sources',
      labelVi: '30+ Nguồn báo',
      labelEn: 'Sources',
      icon: <Globe2 className="w-3.5 h-3.5" />,
    },
    {
      id: 'analytics',
      labelVi: 'Phân tích',
      labelEn: 'Analytics',
      icon: <PieChart className="w-3.5 h-3.5" />,
    },
    {
      id: 'dictionary',
      labelVi: 'Từ điển BTC',
      labelEn: 'Dictionary',
      icon: <Landmark className="w-3.5 h-3.5" />,
    },
  ];

  const secondaryTabs: { id: CmsNavigationTab; labelVi: string; labelEn: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'knowledge',
      labelVi: 'Kho tri thức RAG',
      labelEn: 'RAG Knowledge Base',
      icon: <BookOpen className="w-4 h-4 text-amber-500" />,
      desc: isVietnamese ? 'Cơ sở dữ liệu văn bản pháp quy BTC' : 'Regulatory legal document database',
    },
    {
      id: 'finetune',
      labelVi: 'Fine-Tuning Studio',
      labelEn: 'Fine-Tuning Studio',
      icon: <Cpu className="w-4 h-4 text-purple-500" />,
      desc: isVietnamese ? 'Huấn luyện & tinh chỉnh mô hình AI' : 'AI model dataset training & tuning',
    },
    {
      id: 'graph',
      labelVi: 'Bản đồ Tri thức (Graph)',
      labelEn: 'Entity Knowledge Graph',
      icon: <Network className="w-4 h-4 text-cyan-500" />,
      desc: isVietnamese ? 'Ma trận tương quan thực thể đa chiều' : 'Multi-dimensional entity relationship map',
    },
    {
      id: 'database',
      labelVi: 'Cơ sở dữ liệu Quét',
      labelEn: 'Scraped Database Explorer',
      icon: <Database className="w-4 h-4 text-emerald-500" />,
      desc: isVietnamese ? 'Truy vấn & kiểm toán dữ liệu thô' : 'Raw scraped data query & audit engine',
    },
  ];

  const isSecondaryActive = secondaryTabs.some((t) => t.id === cmsTab);

  return (
    <div
      id="executive-command-bar"
      className={`border-b transition-colors duration-200 select-none ${
        isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300 shadow-sm'
      }`}
    >
      <div className="max-w-7xl 2xl:max-w-[1920px] mx-auto px-3 sm:px-5 lg:px-7">
        {/* TIER 1: MODERN HORIZONTAL NAVIGATION TABS + VIEW DENSITY */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pt-2.5 pb-2 border-b border-slate-300 dark:border-slate-800 min-w-0">
          {/* Main Navigation Tabs - Touch Horizontal Scroll Ribbon */}
          <nav className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar scroll-smooth py-0.5 min-w-0 flex-1" aria-label="CMS Navigation">
            {primaryTabs.map((tab) => {
              const isActive = cmsTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border-2 ${
                    isActive
                      ? isDark
                        ? 'bg-blue-950/80 text-blue-200 border-blue-500 shadow-sm'
                        : 'bg-blue-50 text-blue-950 border-blue-700 shadow-sm'
                      : isDark
                      ? 'text-slate-200 hover:text-white hover:bg-slate-800/90 border-transparent'
                      : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100 border-transparent'
                  }`}
                >
                  <span className={isActive ? (isDark ? 'text-blue-400' : 'text-blue-800') : (isDark ? 'text-slate-400' : 'text-slate-600')}>
                    {tab.icon}
                  </span>
                  <span className="tracking-tight">{isVietnamese ? tab.labelVi : tab.labelEn}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`ml-1 text-[11px] font-mono font-black px-2 py-0.5 rounded-md ${
                        isActive
                          ? isDark
                            ? 'bg-blue-800 text-white'
                            : 'bg-blue-800 text-white'
                          : isDark
                          ? 'bg-slate-800 text-slate-200'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* "More..." Dropdown for secondary tabs */}
            <div ref={moreMenuRef} className="relative">
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border-2 ${
                  isSecondaryActive || isMoreMenuOpen
                    ? isDark
                      ? 'bg-slate-800 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-100 text-slate-950 border-slate-700 shadow-sm'
                    : isDark
                    ? 'text-slate-200 hover:text-white hover:bg-slate-800/90 border-transparent'
                    : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100 border-transparent'
                }`}
                title="Các module chuyên sâu khác"
                aria-expanded={isMoreMenuOpen}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isVietnamese ? 'Mở rộng' : 'More'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMoreMenuOpen && (
                <div
                  className={`absolute left-0 top-full mt-2 w-72 rounded-xl border-2 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-950'
                  }`}
                >
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3 py-1.5">
                    {isVietnamese ? 'Module Nâng Cao' : 'Advanced Modules'}
                  </div>
                  <div className="space-y-1">
                    {secondaryTabs.map((item) => {
                      const isItemActive = cmsTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectTab(item.id);
                            setIsMoreMenuOpen(false);
                          }}
                          className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition cursor-pointer border ${
                            isItemActive
                              ? isDark
                                ? 'bg-blue-950/80 text-blue-200 border-blue-600 font-black'
                                : 'bg-blue-50 text-blue-950 border-blue-600 font-black'
                              : isDark
                              ? 'hover:bg-slate-800 border-transparent text-slate-200'
                              : 'hover:bg-slate-100 border-transparent text-slate-800'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">{item.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold flex items-center justify-between">
                              <span>{isVietnamese ? item.labelVi : item.labelEn}</span>
                              {isItemActive && <Check className="w-4 h-4 text-blue-500" />}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Controls: View Density Switcher + Advisor Chat Button */}
          <div className="flex items-center justify-between md:justify-end gap-2.5 shrink-0 pt-0.5 md:pt-0">
            {/* View Density Segmented Control */}
            <div
              className={`flex items-center p-1 rounded-xl border-2 text-xs font-black ${
                isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-100 border-slate-300'
              }`}
            >
              <button
                onClick={() => onDensityModeChange('executive')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center gap-1.5 ${
                  densityMode === 'executive'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
                title="Chế độ Lãnh đạo: Gọn nhẹ tối đa, chỉ hiện tiêu đề & tóm tắt 2 dòng"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Lãnh đạo</span>
              </button>

              <button
                onClick={() => onDensityModeChange('standard')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
                  densityMode === 'standard'
                    ? isDark
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-white text-slate-950 shadow-xs border border-slate-300'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
                title="Chế độ Chuẩn: Cân bằng đầy đủ thông tin"
              >
                <span>Chuẩn</span>
              </button>

              <button
                onClick={() => onDensityModeChange('deep')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
                  densityMode === 'deep'
                    ? 'bg-blue-800 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
                title="Chế độ Chuyên sâu: Bóc tách 6W & phân tích đa chiều"
              >
                <span>Chuyên sâu</span>
              </button>
            </div>

            {/* Direct Advisor Chat Trigger */}
            <button
              onClick={onOpenAdvisorChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-black shadow-sm transition cursor-pointer active:scale-95 shrink-0 border-2 border-red-700"
              title="Cố vấn & Tham mưu AI Trọng tâm cho Lãnh đạo (Ctrl+Shift+A)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Cố vấn AI</span>
            </button>
          </div>
        </div>

        {/* TIER 2: COMPACT INTERACTIVE KPI & ENGINE CONTROLS (Displayed only on Table and Database tabs) */}
        {(cmsTab === 'table' || cmsTab === 'database') && (
          <div className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs min-w-0">
          {/* Left: Interactive Quick KPI Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5 min-w-0 flex-1">
            {/* KPI 1: Total Scanned */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-black shrink-0 ${
                isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-slate-600 dark:text-slate-300 font-bold">{isVietnamese ? 'Tổng bài:' : 'Total:'}</span>
              <strong className="font-mono text-slate-950 dark:text-white font-black text-sm">{totalFound}</strong>
            </div>

            {/* Quick Filter: Tin Nóng (High Impact) */}
            {onToggleHighImpactOnly && (
              <button
                id="filter-high-impact-btn"
                onClick={() => {
                  onToggleHighImpactOnly();
                  if (cmsTab !== 'table') onSelectTab('table');
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-xs ${
                  showHighImpactOnly
                    ? 'bg-amber-600 text-white border-amber-700'
                    : isDark
                    ? 'bg-amber-950/40 border-amber-800/80 text-amber-300 hover:bg-amber-950/70'
                    : 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100'
                }`}
                title={isVietnamese ? `Lọc tin nóng có tác động cao nhất (${highImpactCount} bài)` : `High Impact filter (${highImpactCount})`}
              >
                <Flame className={`w-4 h-4 ${showHighImpactOnly ? 'text-white' : 'text-amber-500 animate-pulse'}`} />
                <span>{isVietnamese ? 'Tin nóng:' : 'High Impact:'}</span>
                <span className="font-mono font-black text-sm">{highImpactCount}</span>
                {showHighImpactOnly && (
                  <span className="text-[10px] font-black uppercase ml-0.5 px-1.5 py-0.2 bg-white/25 rounded">
                    ✕
                  </span>
                )}
              </button>
            )}

            {/* Quick Link: Vấn đề cần chỉ đạo & xử lý khẩn -> Direct to SOP 4-Level Early Warning Lifecycle */}
            {(onToggleInterventionOnly || onToggleHighConfidenceOnly) && (
              <button
                id="filter-urgent-intervention-btn"
                onClick={() => {
                  onSelectTab('dashboard');
                  if (onToggleInterventionOnly) onToggleInterventionOnly();
                  else if (onToggleHighConfidenceOnly) onToggleHighConfidenceOnly();
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border-2 text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-xs ${
                  showInterventionOnly || showHighConfidenceOnly
                    ? 'bg-rose-700 text-white border-rose-800 shadow-md ring-2 ring-rose-500/50'
                    : isDark
                    ? 'bg-rose-950/60 border-rose-800/90 text-rose-200 hover:bg-rose-900/70'
                    : 'bg-rose-50 border-rose-300 text-rose-950 hover:bg-rose-100'
                }`}
                title="Chuyển ngay tới mục Vòng Đời SOP 4 Cấp Độ để xem & chỉ đạo xử lý khẩn"
              >
                <AlertTriangle className={`w-4 h-4 ${showInterventionOnly || showHighConfidenceOnly ? 'text-white animate-bounce' : 'text-rose-600 dark:text-rose-400'}`} />
                <span>Vấn đề cần chỉ đạo & xử lý khẩn (Vòng Đời SOP):</span>
                <span className="font-mono font-black text-sm px-1.5 py-0.2 rounded bg-rose-950/40 dark:bg-rose-900/60 text-white">
                  {Math.max(interventionCount, crisisCount)}
                </span>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-600 text-white border border-rose-500 shadow-xs">
                  SOP KHẨN CẤP
                </span>
              </button>
            )}

            {/* KPI 3: Bright Spots (Positive) Filter */}
            <button
              onClick={() => {
                onToggleHighConfidenceBrightSpotOnly();
                if (cmsTab !== 'table') onSelectTab('table');
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-xs font-black transition cursor-pointer shrink-0 shadow-xs ${
                showHighConfidenceBrightSpotOnly
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : isDark
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300 hover:bg-emerald-950/70'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
              }`}
              title={isVietnamese ? `Lọc điểm sáng (${positiveCount} bài)` : `Filter bright spots (${positiveCount})`}
            >
              <Award className={`w-4 h-4 ${showHighConfidenceBrightSpotOnly ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
              <span>{isVietnamese ? 'Điểm sáng:' : 'Bright:'}</span>
              <span className="font-mono font-black text-sm">{positiveCount}</span>
              {showHighConfidenceBrightSpotOnly && (
                <span className="text-[10px] font-black uppercase ml-0.5 px-1.5 py-0.2 bg-white/25 rounded">
                  ✕
                </span>
              )}
            </button>

            {/* KPI: Dedicated Neutral Articles & Percentage Indicator */}
            <button
              id="filter-neutral-only-btn"
              onClick={() => {
                if (onToggleNeutralOnly) {
                  onToggleNeutralOnly();
                  if (cmsTab !== 'table') onSelectTab('table');
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-xs ${
                showNeutralOnly
                  ? 'bg-amber-600 text-white border-amber-700 ring-1 ring-amber-400'
                  : isDark
                  ? 'bg-amber-950/30 border-amber-800/70 text-amber-300 hover:bg-amber-950/60 hover:border-amber-600'
                  : 'bg-amber-50/80 border-amber-300 text-amber-900 hover:bg-amber-100 hover:border-amber-400'
              }`}
              title={
                isVietnamese
                  ? `Tin trung tính: ${neutralCount} bài (${neutralPercentage !== undefined ? neutralPercentage : totalFound > 0 ? Math.round((neutralCount / totalFound) * 100) : 0}% tổng đợt quét)`
                  : `Neutral articles: ${neutralCount} (${neutralPercentage !== undefined ? neutralPercentage : totalFound > 0 ? Math.round((neutralCount / totalFound) * 100) : 0}%)`
              }
            >
              <Minus className={`w-4 h-4 ${showNeutralOnly ? 'text-white' : 'text-amber-500 dark:text-amber-400'}`} />
              <span>{isVietnamese ? 'Trung tính:' : 'Neutral:'}</span>
              <span className="font-mono font-black text-sm">
                {neutralPercentage !== undefined
                  ? `${neutralPercentage}%`
                  : `${totalFound > 0 ? Math.round((neutralCount / totalFound) * 100) : 0}%`}
              </span>
              <span className="text-[10px] opacity-80 font-mono font-bold hidden sm:inline">
                ({neutralCount})
              </span>
              {showNeutralOnly && (
                <span className="text-[10px] font-black uppercase ml-0.5 px-1.5 py-0.2 bg-white/25 rounded">
                  ✕
                </span>
              )}
            </button>

            {/* KPI 4: Data Integrity */}
            <button
              onClick={onToggleExcludeAnomalies}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-xs font-black transition cursor-pointer shrink-0 ${
                excludeAnomalies
                  ? isDark
                    ? 'bg-blue-950/70 border-blue-600 text-blue-200'
                    : 'bg-blue-50 border-blue-700 text-blue-950'
                  : isDark
                  ? 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-slate-50 border-slate-300 text-slate-800 hover:text-slate-950'
              }`}
              title={integrityReport ? `Toàn vẹn: ${integrityReport.integrityRate}%` : 'Độ toàn vẹn dữ liệu'}
            >
              <ShieldCheck className={`w-4 h-4 ${excludeAnomalies ? (isDark ? 'text-blue-400' : 'text-blue-700') : 'text-slate-500'}`} />
              <span>{isVietnamese ? 'Toàn vẹn:' : 'Integrity:'}</span>
              <span className="font-mono font-black text-sm">{integrityReport ? `${integrityReport.integrityRate}%` : '100%'}</span>
            </button>

            {/* Background Sync Status */}
            <BackgroundSyncIndicator
              isDark={isDark}
              isVietnamese={isVietnamese}
              isMainAppLoading={isLoading}
              onTriggerManualBackgroundScrape={() => {
                onTriggerBackgroundScrape();
                backgroundSyncManager.triggerBackgroundScrape({
                  timeRange,
                  sector: 'all',
                  forceRefresh: true,
                });
              }}
            />
          </div>

          {/* Right: Source & Scan Engine Toggles */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full sm:flex-wrap shrink-0">
            {/* Multi-source vs Official BTC */}
            <div
              className={`flex items-center p-1 rounded-xl border-2 text-xs font-black ${
                isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-100 border-slate-300'
              }`}
            >
              <button
                onClick={() => onSelectOfficialSource(false)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center gap-1.5 ${
                  !isOfficialOnly
                    ? isDark
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-white text-slate-950 shadow-xs border border-slate-300'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
                title="Quét toàn diện 30+ nguồn báo chí và Cổng TTĐT"
              >
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>30+ Nguồn</span>
              </button>

              <button
                onClick={() => onSelectOfficialSource(true)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center gap-1.5 ${
                  isOfficialOnly
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : isDark
                    ? 'text-emerald-400 hover:text-emerald-300'
                    : 'text-emerald-800 hover:text-emerald-950'
                }`}
                title="Chỉ quét Cổng TTĐT Bộ Tài chính & trực thuộc"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Cổng BTC</span>
              </button>
            </div>

            {/* Official Portals Modal Trigger */}
            <button
              onClick={onOpenOfficialPortalsModal}
              className={`px-3 py-1.5 rounded-xl border-2 text-[11px] font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-emerald-300 hover:bg-slate-800'
                  : 'bg-white border-slate-300 text-emerald-900 hover:bg-slate-100'
              }`}
              title="8 Cổng TTĐT Trực thuộc Bộ Tài chính đang kết nối"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>8 Cổng</span>
            </button>

            {/* Turbo Scan Toggle */}
            <button
              onClick={onToggleTurboSilentMode}
              className={`px-3 py-1.5 rounded-xl border-2 text-[11px] font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                turboSilentMode
                  ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                  : isDark
                  ? 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'bg-white border-slate-300 text-slate-800 hover:text-slate-950 hover:bg-slate-100'
              }`}
              title={turboSilentMode ? 'Đang bật quét ngầm siêu tốc' : 'Bật quét ngầm siêu tốc'}
            >
              <Zap className={`w-3.5 h-3.5 ${turboSilentMode ? 'fill-current text-white' : 'text-amber-500'}`} />
              <span>{turboSilentMode ? 'Siêu tốc' : 'Quét sâu'}</span>
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
