import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCw,
  Clock,
  FileText,
  SlidersHorizontal,
  TrendingUp,
  ShieldCheck,
  Zap,
  Sliders,
  Sparkles,
  Menu,
  Sun,
  Moon,
  BellRing,
  Search,
  Command,
  HelpCircle,
  Keyboard,
  Film,
  Mail,
  Key,
  Database,
  X,
  ChevronDown,
  Tag,
  Check,
  Building2,
  CloudUpload,
} from 'lucide-react';
import { isCloudDatabaseActive } from '../lib/firebase';
import { TimeRange } from '../types';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { getApiKeyMode } from '../lib/apiKeyManager';

interface HeaderProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  isLoading: boolean;
  isResetInProgress?: boolean;
  onRefresh: () => void;
  lastScannedTime: string | null;
  scannedWindow: string;
  onOpenExportModal: () => void;
  totalArticles: number;
  filteredArticlesCount?: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  autoRefreshInterval: number; // in seconds
  onAutoRefreshIntervalChange: (interval: number) => void;
  countdown: number;
  onOpenKeywordWeightModal: () => void;
  customWeightsModifiedCount?: number;
  onOpenAlertTriggerModal?: () => void;
  onOpenBatchAlertDrawer?: () => void;
  activeTriggersCount?: number;
  activeAlertsCount?: number;
  onToggleSidebar?: () => void;
  onOpenAdvisorChatbot?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenKeyboardShortcuts?: () => void;
  onOpenVideoModal?: () => void;
  onOpenGmailAlertModal?: () => void;
  onOpenApiKeyModal?: () => void;
  onOpenTaxonomyModal?: () => void;
  onOpenDbResetModal?: () => void;
  onOpenTimeWindowAuditModal?: () => void;
}

const HOT_KEYWORDS = [
  'Nghị định 68',
  'Trái phiếu',
  'Hải quan số',
  'Thuế GTGT',
  'CPI 2026',
  'Giải ngân',
];

export const Header: React.FC<HeaderProps> = ({
  timeRange,
  onTimeRangeChange,
  isLoading,
  isResetInProgress = false,
  onRefresh,
  lastScannedTime,
  scannedWindow,
  onOpenExportModal,
  totalArticles,
  filteredArticlesCount,
  searchQuery = '',
  onSearchChange,
  autoRefreshInterval,
  onAutoRefreshIntervalChange,
  countdown,
  onOpenKeywordWeightModal,
  customWeightsModifiedCount = 0,
  onOpenAlertTriggerModal,
  onOpenBatchAlertDrawer,
  activeTriggersCount = 0,
  activeAlertsCount = 0,
  onToggleSidebar,
  onOpenAdvisorChatbot,
  onOpenCommandPalette,
  onOpenKeyboardShortcuts,
  onOpenVideoModal,
  onOpenGmailAlertModal,
  onOpenApiKeyModal,
  onOpenTaxonomyModal,
  onOpenDbResetModal,
  onOpenTimeWindowAuditModal,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { language, toggleLanguage, setLanguage, isVietnamese, isEnglish, t } = useI18n();
  const currentKeyMode = getApiKeyMode();
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isHotTagsOpen, setIsHotTagsOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsHotTagsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut '/' focuses search, '?' opens shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '?' && onOpenKeyboardShortcuts) {
        e.preventDefault();
        onOpenKeyboardShortcuts();
      } else if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        toggleLanguage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleLanguage, onOpenKeyboardShortcuts]);

  // Format countdown mm:ss
  const formatCountdown = (sec: number) => {
    if (sec <= 0) return '00:00';
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const hasActiveCustomSettings = customWeightsModifiedCount > 0 || currentKeyMode === 'custom' || activeTriggersCount > 0;

  return (
    <header
      id="main-executive-header"
      className="sticky top-0 z-40 border-b-2 border-slate-300 bg-white/95 backdrop-blur-md text-slate-900 shadow-sm"
    >
      <div className="max-w-[1920px] mx-auto px-3 sm:px-5 h-16 flex items-center justify-between gap-2.5">
        
        {/* LEFT SECTION: Sidebar Toggle & Compact Logo (NO "BỘ TÀI CHÍNH" TEXT TO FIT 1 LINE) */}
        <div className="flex items-center gap-2 shrink-0">
          {onToggleSidebar && (
            <button
              id="header-toggle-sidebar-btn"
              onClick={onToggleSidebar}
              className="p-2 rounded-xl border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 hover:border-slate-400 transition cursor-pointer active:scale-95"
              title="Mở / Thu gọn thanh điều hướng"
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0 border border-slate-900">
              BTC
            </div>
            <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
              ● Trực Tuyến
            </span>
          </div>
        </div>

        {/* CENTER SECTION: Spotlight Search & Time Range (Streamlined 1-Line Layout) */}
        <div className="flex items-center gap-2 flex-1 max-w-2xl min-w-0">
          {/* Spotlight Search */}
          <div ref={searchContainerRef} className="relative flex-1 min-w-0">
            <div
              className={`relative flex items-center rounded-xl border-2 transition-all duration-200 text-xs bg-slate-50 ${
                searchQuery
                  ? 'border-slate-900 ring-2 ring-slate-900/10'
                  : 'border-slate-300 focus-within:border-slate-900'
              }`}
            >
              <div className="pl-2.5 pr-1.5 text-slate-500 flex items-center pointer-events-none shrink-0">
                <Search className={`w-4 h-4 ${searchQuery ? 'text-slate-900 font-bold' : 'text-slate-500'}`} />
              </div>

              <input
                id="header-global-search-input"
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsHotTagsOpen(true)}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                placeholder={isVietnamese ? "Lọc từ khóa (Nghị định, Trái phiếu, Thuế...)" : "Filter keywords..."}
                className="w-full py-2 pr-7 text-xs font-bold bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none"
              />

              {/* Quick action: Filter count badge or Clear / Slash shortcut */}
              <div className="absolute right-2 flex items-center gap-1">
                {searchQuery ? (
                  <div className="flex items-center gap-1">
                    <span className="hidden sm:inline text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-slate-900 text-white">
                      {filteredArticlesCount ?? totalArticles}/{totalArticles}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onSearchChange && onSearchChange('');
                        searchInputRef.current?.focus();
                      }}
                      className="p-0.5 rounded-full text-slate-500 hover:text-slate-900 transition cursor-pointer"
                      title={isVietnamese ? "Xóa tìm kiếm" : "Clear search"}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsHotTagsOpen(!isHotTagsOpen)}
                      className="p-0.5 rounded text-slate-400 hover:text-slate-900 transition cursor-pointer hidden sm:inline-flex"
                      title="Gợi ý từ khóa nóng"
                    >
                      <Tag className="w-3.5 h-3.5" />
                    </button>
                    <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-mono font-bold border border-slate-300 pointer-events-none">
                      /
                    </kbd>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Hot Tags Dropdown Popover */}
            {isHotTagsOpen && !searchQuery && (
              <div
                className="absolute left-0 right-0 top-full mt-2 p-3 rounded-2xl border-2 border-slate-300 shadow-xl z-50 bg-white text-slate-900"
              >
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    {isVietnamese ? 'Từ khóa trọng tâm' : 'Trending Topics'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsHotTagsOpen(false)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-900 cursor-pointer px-1"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {HOT_KEYWORDS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        onSearchChange && onSearchChange(tag);
                        setIsHotTagsOpen(false);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-300 bg-slate-100 hover:bg-slate-900 hover:text-white transition cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Time Range Segmented Selector */}
          <div className="inline-flex items-center p-0.5 rounded-xl border border-slate-300 bg-slate-100 text-xs font-black shrink-0">
            {(['1h', '2h', '4h', '8h', '24h'] as TimeRange[]).map((tr) => (
              <button
                key={tr}
                onClick={() => onTimeRangeChange(tr)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer text-xs font-black ${
                  timeRange === tr
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={`Khung thời gian ${tr}`}
              >
                {tr}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT SECTION: Single-Row Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Primary Scan Button */}
          <button
            id="manual-scan-header-btn"
            onClick={onRefresh}
            disabled={isLoading || isResetInProgress}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-extrabold text-xs transition cursor-pointer min-h-[36px] active:scale-95 border ${
              isLoading || isResetInProgress
                ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-black text-white border-slate-900 shadow-xs'
            }`}
            title="Quét mới tin tức ngay lập tức"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading || isResetInProgress ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {isResetInProgress ? 'Reset...' : isLoading ? 'Quét...' : 'Quét ngay'}
            </span>
          </button>

          {/* Export Report Button */}
          <button
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-extrabold transition cursor-pointer min-h-[36px]"
            title="Xuất báo cáo PDF / Excel / Word (Ctrl+E)"
          >
            <FileText className="w-3.5 h-3.5 text-slate-700" />
            <span className="hidden lg:inline">{t('header_export_report')}</span>
          </button>

          {/* Advisor AI Chatbot Button */}
          {onOpenAdvisorChatbot && (
            <button
              onClick={onOpenAdvisorChatbot}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-extrabold transition cursor-pointer min-h-[36px] border border-slate-900 shadow-xs"
              title="Trợ lý Cố vấn AI (Ctrl+Shift+A)"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="hidden xl:inline">{t('header_advisor_assistant')}</span>
            </button>
          )}

          {/* Unified Tools & Settings Dropdown */}
          <div ref={toolsMenuRef} className="relative">
            <button
              id="header-tools-dropdown-btn"
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className={`relative inline-flex items-center justify-center gap-1 px-2 py-2 rounded-xl border text-xs font-extrabold transition cursor-pointer min-h-[36px] ${
                isToolsOpen
                  ? 'bg-slate-200 border-slate-400 text-slate-900'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
              title="Cài đặt & Tiện ích mở rộng"
              aria-expanded={isToolsOpen}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden sm:inline">{isVietnamese ? 'Cài đặt' : 'Tools'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${isToolsOpen ? 'rotate-180' : ''}`} />
              
              {hasActiveCustomSettings && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-slate-900 ring-2 ring-white" />
              )}
            </button>

            {/* Dropdown Menu Modal / Popover */}
            {isToolsOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border-2 border-slate-300 shadow-xl p-3.5 z-50 space-y-3 bg-white text-slate-900"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                  <span className="font-extrabold tracking-wider uppercase text-slate-500">
                    {isVietnamese ? 'TIỆN ÍCH & CẤU HÌNH' : 'SETTINGS & TOOLS'}
                  </span>
                  <span className="font-mono text-slate-900 font-black px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300">
                    v3.2.0
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                    {isVietnamese ? 'Hệ thống & CSDL' : 'System & Database'}
                  </span>

                  {onOpenApiKeyModal && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          onOpenApiKeyModal();
                          setIsToolsOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <CloudUpload className="w-3.5 h-3.5 text-slate-700" />
                          <span>{isVietnamese ? 'Đồng bộ Cấu hình Cloud' : 'Cloud Preferences Sync'}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-white font-black">
                          Cloud
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onOpenApiKeyModal();
                          setIsToolsOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Key className="w-3.5 h-3.5 text-slate-700" />
                          <span>Gemini API Key (BYOK)</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 border border-slate-300 font-bold">
                          {currentKeyMode === 'custom' ? 'Custom' : 'System'}
                        </span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onOpenDbResetModal && onOpenDbResetModal();
                      setIsToolsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-slate-700" />
                      <span>{isVietnamese ? 'Quản trị CSDL / Reset' : 'Database Management'}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 border border-slate-300 font-bold">
                      {isCloudDatabaseActive() ? 'Firestore' : 'Local'}
                    </span>
                  </button>

                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-slate-700" />
                      <span>{t('header_auto_scan')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {autoRefreshInterval > 0 && (
                        <span className="font-mono text-[10px] text-slate-900 font-black bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300">
                          {formatCountdown(countdown)}
                        </span>
                      )}
                      <select
                        value={autoRefreshInterval}
                        onChange={(e) => onAutoRefreshIntervalChange(Number(e.target.value))}
                        className="text-[11px] font-black border border-slate-300 rounded px-1.5 py-0.5 cursor-pointer bg-white text-slate-900 focus:outline-none"
                      >
                        <option value={0}>{t('header_auto_scan_off')}</option>
                        <option value={900}>15m</option>
                        <option value={1800}>30m</option>
                        <option value={3600}>60m</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-1.5 border-t border-slate-200">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                    {isVietnamese ? 'Nghiệp vụ & Cảnh báo' : 'Intelligence & Alerts'}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenKeywordWeightModal();
                      setIsToolsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-slate-700" />
                      <span>{t('header_mof_weights')}</span>
                    </div>
                    {customWeightsModifiedCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 text-white font-black">
                        {customWeightsModifiedCount}
                      </span>
                    )}
                  </button>

                  {onOpenAlertTriggerModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenAlertTriggerModal();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <BellRing className="w-3.5 h-3.5 text-slate-700" />
                        <span>{t('header_alert_triggers')}</span>
                      </div>
                      {activeTriggersCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 text-white font-black">
                          {activeTriggersCount}
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenGmailAlertModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenGmailAlertModal();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-700" />
                        <span>{t('header_gmail_alert')}</span>
                      </div>
                    </button>
                  )}

                  {onOpenVideoModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenVideoModal();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Film className="w-3.5 h-3.5 text-slate-700" />
                        <span>{t('header_video_ai')} (Veo 3)</span>
                      </div>
                    </button>
                  )}
                </div>

                <div className="space-y-1 pt-1.5 border-t border-slate-200">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                    {isVietnamese ? 'Kiểm định & Trợ giúp' : 'Audit & Shortcuts'}
                  </span>

                  {onOpenTimeWindowAuditModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenTimeWindowAuditModal();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                        <span>{isVietnamese ? 'Kiểm định Khung Giờ' : 'Time Window Auditor'}</span>
                      </div>
                    </button>
                  )}

                  {onOpenTaxonomyModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenTaxonomyModal();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-700" />
                        <span>{isVietnamese ? 'Chú thích Nhãn Tin' : 'Labeling Guide'}</span>
                      </div>
                    </button>
                  )}

                  {onOpenKeyboardShortcuts && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenKeyboardShortcuts();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Keyboard className="w-3.5 h-3.5 text-slate-700" />
                        <span>{t('cmd_shortcuts')}</span>
                      </div>
                      <kbd className="text-[10px] font-mono px-1.5 rounded bg-slate-200 text-slate-700 border border-slate-300 font-bold">?</kbd>
                    </button>
                  )}

                  {onOpenCommandPalette && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenCommandPalette();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Command className="w-3.5 h-3.5 text-slate-700" />
                        <span>{t('cmd_search_title')}</span>
                      </div>
                      <kbd className="text-[10px] font-mono px-1.5 rounded bg-slate-200 text-slate-700 border border-slate-300 font-bold">Ctrl+K</kbd>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Language Switcher (VI / EN) */}
          <div className="inline-flex items-center p-0.5 rounded-xl border border-slate-300 bg-slate-100 shrink-0">
            <button
              type="button"
              onClick={() => setLanguage('vi')}
              className={`px-2 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                isVietnamese
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              VI
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                isEnglish
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
