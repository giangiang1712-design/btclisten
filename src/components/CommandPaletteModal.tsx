import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Sparkles,
  RotateCw,
  FileText,
  Sliders,
  BellRing,
  LayoutDashboard,
  Table,
  FileCheck2,
  PieChart,
  Moon,
  Sun,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Zap,
  ExternalLink,
  Layers,
  ChevronRight,
  Command,
  CornerDownLeft,
  X,
  HelpCircle,
  Keyboard,
  Film,
  BookOpen,
  Globe,
  Cpu,
  Landmark,
  Database,
} from 'lucide-react';
import { ScrapedNewsItem, SectorType, TimeRange, SentimentType } from '../types';
import { CmsNavigationTab } from './CmsSidebar';
import { useTheme } from '../lib/theme';

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  newsItems?: ScrapedNewsItem[];
  articles?: ScrapedNewsItem[];
  currentTab?: CmsNavigationTab;
  onNavigateTab: (tab: CmsNavigationTab) => void;
  onSelectArticle: (article: ScrapedNewsItem) => void;
  onOpenAdvisorChatbot: (article?: ScrapedNewsItem) => void;
  onOpenDraftStatement?: (article?: ScrapedNewsItem) => void;
  onOpenTaxonomyModal?: () => void;
  onOpenDbResetModal?: () => void;
  onOpenKeywordWeights?: () => void;
  onOpenKeywordWeightModal?: () => void;
  onOpenAlertTriggers?: () => void;
  onOpenAlertTriggerModal?: () => void;
  onOpenExportModal: () => void;
  onOpenVideoModal?: (article?: ScrapedNewsItem) => void;
  onRefreshScrape: () => void;
  onToggleTheme?: () => void;
  isDark?: boolean;
  timeRange: TimeRange;
  onChangeTimeRange?: (range: TimeRange) => void;
  onSelectSector?: (sector: SectorType) => void;
  onOpenKeyboardShortcuts?: () => void;
  onOpenShortcutsHelp?: () => void;
}

interface PaletteAction {
  id: string;
  category: 'navigation' | 'ai_tools' | 'settings' | 'time_range' | 'article';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  shortcut?: string;
  badge?: string;
  badgeColor?: string;
  onExecute: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  newsItems,
  articles,
  currentTab = 'dashboard',
  onNavigateTab,
  onSelectArticle,
  onOpenAdvisorChatbot,
  onOpenDraftStatement,
  onOpenKeywordWeights,
  onOpenKeywordWeightModal,
  onOpenAlertTriggers,
  onOpenAlertTriggerModal,
  onOpenExportModal,
  onOpenVideoModal,
  onOpenDbResetModal,
  onRefreshScrape,
  onToggleTheme: customToggleTheme,
  isDark: customIsDark,
  timeRange,
  onChangeTimeRange,
  onSelectSector,
  onOpenKeyboardShortcuts,
  onOpenShortcutsHelp,
}) => {
  const { isDark: themeDark, toggleTheme } = useTheme();
  const activeIsDark = customIsDark !== undefined ? customIsDark : themeDark;
  const activeToggleTheme = customToggleTheme || toggleTheme;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const effectiveArticles = articles || newsItems || [];

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Build standard actions
  const defaultActions: PaletteAction[] = useMemo(() => [
    {
      id: 'ai-advisor',
      category: 'ai_tools',
      title: 'Mở Trợ lý AI tham mưu, đề xuất hướng xử lý',
      subtitle: 'Tham mưu chỉ đạo, đề xuất hướng xử lý và tạo văn bản hành chính công vụ',
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      shortcut: 'Ctrl+Shift+A',
      badge: 'AI Smart',
      badgeColor: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      onExecute: () => {
        onOpenAdvisorChatbot();
        onClose();
      }
    },
    {
      id: 'veo-video-generator',
      category: 'ai_tools',
      title: 'Tạo Video Short / BroadCast Tóm Tắt Tin Tức (Google Veo 3)',
      subtitle: 'Tạo video đồ họa chuyển động 16:9 hoặc 9:16 từ văn bản chỉ đạo bằng veo-3.1-fast-generate-preview',
      icon: <Film className="w-4 h-4 text-red-500" />,
      shortcut: 'Ctrl+Shift+V',
      badge: 'Veo 3.1',
      badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      onExecute: () => {
        if (onOpenVideoModal) onOpenVideoModal();
        onClose();
      }
    },
    {
      id: 'refresh-data',
      category: 'navigation',
      title: `Quét dữ liệu mới nhất (Phiên ${timeRange})`,
      subtitle: 'Cập nhật tin tức tài chính và phân tích xu hướng thời gian thực',
      icon: <RotateCw className="w-4 h-4 text-emerald-500" />,
      shortcut: 'Alt+R',
      onExecute: () => {
        onRefreshScrape();
        onClose();
      }
    },
    {
      id: 'tab-dashboard',
      category: 'navigation',
      title: 'Chuyển đến: Bảng điều khiển Tổng quan (Dashboard)',
      subtitle: 'Xem bối cảnh thị trường, chỉ đạo MoF, điểm nóng rủi ro & cơ hội',
      icon: <LayoutDashboard className="w-4 h-4 text-indigo-500" />,
      shortcut: 'Ctrl+1',
      onExecute: () => {
        onNavigateTab('dashboard');
        onClose();
      }
    },
    {
      id: 'tab-table',
      category: 'navigation',
      title: 'Chuyển đến: Bảng Dữ liệu Bài viết & Phân tích 6W',
      subtitle: 'Danh sách chi tiết bài viết, trích xuất thực thể, điểm nóng MoF',
      icon: <Table className="w-4 h-4 text-blue-500" />,
      shortcut: 'Ctrl+2',
      onExecute: () => {
        onNavigateTab('table');
        onClose();
      }
    },
    {
      id: 'tab-briefing',
      category: 'navigation',
      title: 'Chuyển đến: Tham mưu Tác chiến & Soạn Văn bản',
      subtitle: 'Soạn Thông cáo báo chí, Tờ trình chính sách, Định hướng dư luận',
      icon: <FileCheck2 className="w-4 h-4 text-emerald-500" />,
      shortcut: 'Ctrl+3',
      onExecute: () => {
        onNavigateTab('briefing');
        onClose();
      }
    },
    {
      id: 'tab-sources',
      category: 'navigation',
      title: 'Chuyển đến: Kho Báo Chí Tài Chính (30+ Nguồn Realtime)',
      subtitle: 'Quản lý danh mục 30+ đầu báo kinh tế, cổng TTĐT cơ quan quản lý và độ trễ cào',
      icon: <Globe className="w-4 h-4 text-sky-500" />,
      shortcut: 'Ctrl+S',
      onExecute: () => {
        onNavigateTab('sources');
        onClose();
      }
    },
    {
      id: 'tab-knowledge',
      category: 'navigation',
      title: 'Chuyển đến: Kho Tri Thức Vĩ Mô & RAG (Knowledge Base)',
      subtitle: 'Quản lý, nạp tệp PDF, Nghị định, Thông tư & tài liệu tham mưu cho Bot AI',
      icon: <BookOpen className="w-4 h-4 text-indigo-500" />,
      shortcut: 'Ctrl+K',
      onExecute: () => {
        onNavigateTab('knowledge');
        onClose();
      }
    },
    {
      id: 'tab-finetune',
      category: 'navigation',
      title: 'Chuyển đến: Fine-Tuning Studio & Huấn Luyện Trực Tiếp',
      subtitle: 'Quản lý 1.000 mẫu chuyên gia, xuất JSONL/CSV, kích hoạt LoRA Fine-Tuning',
      icon: <Cpu className="w-4 h-4 text-emerald-500" />,
      shortcut: 'Ctrl+F',
      badge: '1.000 Samples',
      badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      onExecute: () => {
        onNavigateTab('finetune');
        onClose();
      }
    },
    {
      id: 'tab-graph',
      category: 'navigation',
      title: 'Chuyển đến: Bản Đồ Tri Thức & Mối Quan Hệ Thực Thể (Knowledge Graph)',
      subtitle: 'Trực quan hóa mạng lưới liên kết Cơ quan ↔ Doanh nghiệp ↔ Chính sách & Mô phỏng Domino',
      icon: <Layers className="w-4 h-4 text-purple-500" />,
      shortcut: 'Ctrl+G',
      badge: 'Graph D3',
      badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800',
      onExecute: () => {
        onNavigateTab('graph');
        onClose();
      }
    },
    {
      id: 'tab-dictionary',
      category: 'navigation',
      title: 'Chuyển đến: Quản Trị Từ Điển Đồng Nghĩa & Ngữ Cảnh 2026 (BTC)',
      subtitle: 'Quản lý động từ khóa, đồng nghĩa và ánh xạ 16 lĩnh vực chuyên ngành sau sáp nhập',
      icon: <Landmark className="w-4 h-4 text-amber-500" />,
      shortcut: 'Ctrl+D',
      badge: '16 Lĩnh vực',
      badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      onExecute: () => {
        onNavigateTab('dictionary');
        onClose();
      }
    },
    {
      id: 'tab-analytics',
      category: 'navigation',
      title: 'Chuyển đến: Biểu đồ Phân tích & Xu hướng (Analytics)',
      subtitle: 'Thống kê sắc thái, dòng thời gian bài viết và phân bổ ngành',
      icon: <PieChart className="w-4 h-4 text-cyan-500" />,
      shortcut: 'Ctrl+4',
      onExecute: () => {
        onNavigateTab('analytics');
        onClose();
      }
    },
    {
      id: 'modal-export',
      category: 'settings',
      title: 'Xuất Báo cáo Social Listening (PDF / Word / JSON)',
      subtitle: 'Tải báo cáo tóm lược tình hình dư luận tài chính cho Ban Lãnh đạo',
      icon: <FileText className="w-4 h-4 text-emerald-600" />,
      shortcut: 'Ctrl+E',
      onExecute: () => {
        onOpenExportModal();
        onClose();
      }
    },
    {
      id: 'modal-weights',
      category: 'settings',
      title: 'Cấu hình Trọng số Từ khóa BTC (MoF Priority)',
      subtitle: 'Tùy chỉnh hệ số ưu tiên cho thuế, hải quan, trái phiếu, nợ công, SCIC...',
      icon: <Sliders className="w-4 h-4 text-amber-600" />,
      shortcut: 'Ctrl+Shift+W',
      onExecute: () => {
        if (onOpenKeywordWeightModal) onOpenKeywordWeightModal();
        else if (onOpenKeywordWeights) onOpenKeywordWeights();
        onClose();
      }
    },
    {
      id: 'modal-triggers',
      category: 'settings',
      title: 'Thiết lập Ngưỡng Cảnh báo Tự động (Alert Triggers)',
      subtitle: 'Quy tắc phát chuông & thông báo đẩy khi có tin xấu hoặc tin đột biến',
      icon: <BellRing className="w-4 h-4 text-rose-500" />,
      shortcut: 'Ctrl+Shift+L',
      onExecute: () => {
        if (onOpenAlertTriggerModal) onOpenAlertTriggerModal();
        else if (onOpenAlertTriggers) onOpenAlertTriggers();
        onClose();
      }
    },
    {
      id: 'toggle-theme',
      category: 'settings',
      title: activeIsDark ? 'Chuyển sang Giao diện Sáng (Light Mode)' : 'Chuyển sang Giao diện Tối (Dark Mode)',
      subtitle: 'Thay đổi chế độ hiển thị phù hợp với điều kiện làm việc',
      icon: activeIsDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />,
      shortcut: 'Alt+T',
      onExecute: () => {
        activeToggleTheme();
        onClose();
      }
    },
    {
      id: 'shortcuts-help',
      category: 'settings',
      title: 'Xem Bảng Phím tắt Nhanh Toàn diện (Cheat Sheet)',
      subtitle: 'Danh mục phím tắt tăng tốc độ điều hướng cho chuyên gia',
      icon: <Keyboard className="w-4 h-4 text-slate-500" />,
      shortcut: '?',
      onExecute: () => {
        onClose();
        if (onOpenKeyboardShortcuts) onOpenKeyboardShortcuts();
        else if (onOpenShortcutsHelp) onOpenShortcutsHelp();
      }
    },
    {
      id: 'modal-db-reset',
      category: 'settings',
      title: 'Quản trị & Reset Database về 0 (Google Cloud Firestore)',
      subtitle: 'Dọn sạch lịch sử phiên tư vấn, hồ sơ lãnh đạo và chỉ đạo khẩn trên Cloud',
      icon: <Database className="w-4 h-4 text-red-500" />,
      badge: 'Firestore DB',
      badgeColor: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800',
      onExecute: () => {
        onClose();
        if (onOpenDbResetModal) onOpenDbResetModal();
      }
    }
  ], [
    onOpenAdvisorChatbot,
    onClose,
    timeRange,
    onRefreshScrape,
    onNavigateTab,
    onOpenExportModal,
    onOpenKeywordWeightModal,
    onOpenKeywordWeights,
    onOpenAlertTriggerModal,
    onOpenAlertTriggers,
    activeIsDark,
    activeToggleTheme,
    onOpenKeyboardShortcuts,
    onOpenShortcutsHelp
  ]);

  // Search filtered actions and news items
  const filteredItems = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) {
      return defaultActions;
    }

    // Filter actions matching query
    const matchedActions = defaultActions.filter(
      (act) =>
        act.title.toLowerCase().includes(q) ||
        (act.subtitle && act.subtitle.toLowerCase().includes(q))
    );

    // Search articles
    const matchedArticles: PaletteAction[] = (effectiveArticles || [])
      .filter((art) => {
        const text = `${art.title || ''} ${art.source || ''} ${art.summary || ''} ${(art.tickers || []).join(' ')} ${(art.agencies || []).join(' ')}`.toLowerCase();
        return text.includes(q);
      })
      .slice(0, 15)
      .map((art) => ({
        id: `art-${art.id}`,
        category: 'article' as const,
        title: art.title,
        subtitle: `[${art.source || 'Báo chí'}] • ${art.sector ? art.sector.toUpperCase() : 'Tin tức'} • ${art.timeAgo || 'Mới nhất'}`,
        icon: art.sentiment === 'bearish' ? (
          <ShieldAlert className="w-4 h-4 text-rose-500" />
        ) : art.sentiment === 'bullish' ? (
          <TrendingUp className="w-4 h-4 text-emerald-500" />
        ) : (
          <FileText className="w-4 h-4 text-slate-400" />
        ),
        badge: art.sentiment === 'bearish' ? 'Tiêu cực' : art.sentiment === 'bullish' ? 'Tích cực' : 'Trung tính',
        badgeColor: art.sentiment === 'bearish'
          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
          : art.sentiment === 'bullish'
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
          : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800',
        onExecute: () => {
          onSelectArticle(art);
          onClose();
        }
      }));

    return [...matchedActions, ...matchedArticles];
  }, [searchTerm, defaultActions, effectiveArticles, onSelectArticle, onClose]);

  // Adjust selected index if filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length]);

  // Handle Keyboard Navigation within palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onExecute();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll selected item into view smoothly
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      try {
        const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
        if (activeEl) {
          activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      } catch {
        // Safe fallback if querySelector throws on negative or malformed selector
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 z-[100] backdrop-blur-md animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Command Box */}
      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden transition-all duration-200 ${
          activeIsDark
            ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/80 ring-1 ring-white/10'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-900/20 ring-1 ring-slate-900/5'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm tác vụ, chuyển tab, bài viết hoặc lệnh điều hướng..."
            className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto p-2 space-y-1 custom-scrollbar"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Không tìm thấy kết quả phù hợp cho "{searchTerm}"</p>
              <p className="text-xs text-slate-500 mt-1">Thử tìm theo từ khóa chính sách, mã cổ phiếu hoặc tên cơ quan</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  data-index={index}
                  onClick={() => item.onExecute()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-3 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 group ${
                    isSelected
                      ? activeIsDark
                        ? 'bg-slate-800 text-white'
                        : 'bg-emerald-50/80 text-slate-900 border border-emerald-500/20'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? activeIsDark
                            ? 'bg-slate-700 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold truncate block">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                              item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Shortcut or Action Key Icon */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.shortcut && (
                      <kbd
                        className={`hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono font-bold rounded border ${
                          isSelected
                            ? activeIsDark
                              ? 'bg-slate-900 border-slate-600 text-slate-200'
                              : 'bg-white border-emerald-300 text-emerald-800 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↓</kbd>
              <span className="text-[11px] ml-1">Điều hướng</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↵</kbd>
              <span className="text-[11px] ml-1">Chọn</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Command className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium">Bấm <kbd className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">?</kbd> để mở bảng phím tắt</span>
          </div>
        </div>
      </div>
    </div>
  );
};
