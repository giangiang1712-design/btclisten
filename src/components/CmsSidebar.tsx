import React from 'react';
import {
  LayoutDashboard,
  Newspaper,
  FileCheck,
  BarChart3,
  SlidersHorizontal,
  FileSpreadsheet,
  Zap,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  Radio,
  Sparkles,
  CheckCircle2,
  ListFilter,
  Layers,
  Settings,
  BellRing,
  BookOpen,
  Globe2,
  Database,
  Network,
  Cpu,
  Landmark,
  Users,
  MessageSquareQuote,
} from 'lucide-react';
import { TimeRange } from '../types';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';

export type CmsNavigationTab =
  | 'dashboard'
  | 'processed'
  | 'experts'
  | 'table'
  | 'database'
  | 'graph'
  | 'briefing'
  | 'sources'
  | 'knowledge'
  | 'finetune'
  | 'dictionary'
  | 'keywords'
  | 'triggers'
  | 'analytics'
  | 'reports';

interface CmsSidebarProps {
  activeTab: CmsNavigationTab;
  onSelectTab: (tab: CmsNavigationTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  totalArticles: number;
  crisisCount: number;
  positiveCount: number;
  processedCount?: number;
  expertOpinionsCount?: number;
  watchlistCount?: number;
  timeRange: TimeRange;
  isLoading: boolean;
  lastScannedTime: string | null;
  customWeightsCount: number;
  activeTriggersCount?: number;
  appVersion?: string;
  appUpdatedAt?: string;
  onOpenAdvisorChatbot?: () => void;
  onOpenTaxonomyModal?: () => void;
  onOpenDbResetModal?: () => void;
}

export const CmsSidebar: React.FC<CmsSidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  totalArticles,
  crisisCount,
  positiveCount,
  processedCount = 0,
  expertOpinionsCount = 0,
  watchlistCount = 0,
  timeRange,
  isLoading,
  lastScannedTime,
  customWeightsCount,
  activeTriggersCount = 6,
  appVersion = 'v1.1',
  appUpdatedAt = '',
  onOpenAdvisorChatbot,
  onOpenTaxonomyModal,
  onOpenDbResetModal,
}) => {
  const { isDark } = useTheme();
  const { t, isVietnamese } = useI18n();
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState<boolean>(() => {
    return ['analytics', 'dictionary', 'graph', 'finetune'].includes(activeTab);
  });

  // Keep advanced section open if user selects an advanced tab
  React.useEffect(() => {
    if (['analytics', 'dictionary', 'graph', 'finetune'].includes(activeTab)) {
      setIsAdvancedOpen(true);
    }
  }, [activeTab]);

  // CORE EXECUTIVE LEADERSHIP NAVIGATION
  const primaryNavItems = [
    {
      id: 'dashboard' as CmsNavigationTab,
      label: isVietnamese ? 'Bảng Chỉ Huy & Sắc Thái' : 'Command & Sentiment',
      subLabel: isVietnamese ? '4 giai đoạn phân tích toàn cảnh' : '4-stage panoramic analysis',
      icon: LayoutDashboard,
      badge: crisisCount > 0 ? `${crisisCount} Tiêu cực` : undefined,
      badgeColor: 'bg-slate-900 text-white font-bold',
    },
    {
      id: 'processed' as CmsNavigationTab,
      label: isVietnamese ? 'VIỆC ĐÃ XỬ LÝ' : 'Resolved Actions',
      subLabel: isVietnamese ? 'Lọc theo ngày, 2-3 ngày, 1 tuần' : 'History & SLA filter 1-7 days',
      icon: CheckCircle2,
      badge: processedCount > 0 ? `${processedCount} Xong` : undefined,
      badgeColor: 'bg-emerald-700 text-white font-bold shadow-xs',
    },
    {
      id: 'experts' as CmsNavigationTab,
      label: isVietnamese ? 'Ý kiến Nhân Vật, Tổ chức' : 'Expert & Stakeholder Voices',
      subLabel: isVietnamese ? 'Nhận định chính sách & Đáng lưu tâm' : 'Policy opinions & Watchlist',
      icon: Users,
      badge: watchlistCount > 0 ? `⭐ ${watchlistCount} Lưu tâm` : (expertOpinionsCount > 0 ? `${expertOpinionsCount} Ý kiến` : undefined),
      badgeColor: 'bg-amber-600 text-white font-bold shadow-xs',
    },
    {
      id: 'sources' as CmsNavigationTab,
      label: isVietnamese ? '30 Nguồn Báo Chí' : '30 Core Sources',
      subLabel: isVietnamese ? 'Quản lý & Hàng đợi quét 24h' : 'Source controls & queue status',
      icon: Globe2,
      badge: '30 Nguồn',
      badgeColor: 'bg-slate-200 text-slate-900 border border-slate-300',
    },
    {
      id: 'table' as CmsNavigationTab,
      label: isVietnamese ? 'CSDL Bài Báo' : 'Article DB',
      subLabel: isVietnamese ? 'Tra cứu, lọc sắc thái & quản lý bài viết' : 'Articles library & sentiment filters',
      icon: Database,
      badge: `${totalArticles}`,
      badgeColor: 'bg-slate-200 text-slate-900 border border-slate-300',
    },
  ];

  // COLLAPSIBLE SPECIALIZED TOOLS
  const advancedNavItems = [
    {
      id: 'analytics' as CmsNavigationTab,
      label: isVietnamese ? 'Radar Phân Tích Đa Chiều' : 'Multi-axis Analytics',
      subLabel: isVietnamese ? 'Biểu đồ tương quan & sắc thái' : 'Correlation & sentiment charts',
      icon: BarChart3,
    },
    {
      id: 'dictionary' as CmsNavigationTab,
      label: isVietnamese ? 'Từ Điển 16 Lĩnh Vực' : '16-Sector Dictionary',
      subLabel: isVietnamese ? 'Chuẩn hóa thuật ngữ tài chính' : 'Financial taxonomy dictionary',
      icon: Landmark,
    },
    {
      id: 'graph' as CmsNavigationTab,
      label: isVietnamese ? 'Bản Đồ Mạng Lưới Lan Truyền' : 'Information Network',
      subLabel: isVietnamese ? 'Đồ thị lan tỏa tin tức' : 'Propagation graph network',
      icon: Network,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {!isCollapsed && (
        <div
          onClick={onToggleCollapse}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 cursor-pointer"
        />
      )}

      <aside
        className={`bg-white text-slate-900 border-r-2 border-slate-300 flex flex-col transition-all duration-200 z-50 shrink-0 shadow-sm
          ${isCollapsed ? 'w-20 lg:flex hidden' : 'w-72 lg:flex flex'}
          fixed lg:relative inset-y-0 left-0 h-full lg:h-auto`}
      >
      {/* Brand Header */}
      <div className="p-4 border-b-2 border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shrink-0 border border-slate-900 shadow-sm">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-base text-slate-900">Listening CMS</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-900 text-white uppercase">
                  Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate font-semibold mt-0.5">
                {isVietnamese ? 'Lắng nghe & Phân tích Tin tức' : 'Press & Social Media Listening'}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
          title={isCollapsed ? (isVietnamese ? 'Mở rộng CMS' : 'Expand Sidebar') : (isVietnamese ? 'Thu gọn CMS' : 'Collapse Sidebar')}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Engine Status Tag */}
      {!isCollapsed && (
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-100 text-slate-800 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isLoading ? 'bg-slate-900 animate-ping' : 'bg-slate-900'}`} />
            <span className="text-xs font-black text-slate-900">
              {isLoading ? t('header_scanning') : (isVietnamese ? 'Hệ thống Sẵn sàng' : 'System Ready')}
            </span>
          </div>
          <span className="text-xs font-mono font-black px-2 py-0.5 rounded border border-slate-300 bg-white text-slate-900">
            {timeRange}
          </span>
        </div>
      )}

      {/* CMS Navigation Menu */}
      <nav className="p-3 space-y-2 flex-1 overflow-y-auto">
        <div className={`px-2 py-1 text-xs font-black tracking-wider text-slate-400 uppercase ${isCollapsed ? 'text-center' : ''}`}>
          {isCollapsed ? '•••' : (isVietnamese ? 'Trọng tâm Lãnh đạo' : 'Core Leadership')}
        </div>

        {/* PRIMARY LEADERSHIP PILLARS (4 Items) */}
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={isCollapsed ? `${item.label} - ${item.subLabel}` : undefined}
              className={`w-full text-left flex items-center rounded-xl p-3 transition-all duration-150 cursor-pointer group relative border-2 ${
                isActive
                  ? 'bg-slate-900 text-white font-extrabold border-slate-900 shadow-md'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
              } ${isCollapsed ? 'justify-center' : 'gap-3.5'}`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-700'
                }`}
              />

              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm truncate font-black">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-full border shrink-0 ${
                          isActive
                            ? 'bg-white text-slate-900 border-white'
                            : item.badgeColor
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs truncate font-bold mt-0.5 ${
                      isActive ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    {item.subLabel}
                  </p>
                </div>
              )}

              {/* Active Indicator Bar */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-white rounded-r" />
              )}
            </button>
          );
        })}

        {/* COLLAPSIBLE SPECIALIZED TOOLS */}
        <div className="pt-3">
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            title={isCollapsed ? (isVietnamese ? 'Công cụ chuyên sâu' : 'Advanced Tools') : undefined}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 transition cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
          >
            <span className="flex items-center gap-2 uppercase tracking-wider text-xs font-black">
              <SlidersHorizontal className="w-4 h-4 text-slate-700" />
              {!isCollapsed && (isVietnamese ? 'Công cụ Chuyên sâu' : 'Advanced Tools')}
            </span>
            {!isCollapsed && (
              <ChevronRight
                className={`w-4 h-4 transition-transform duration-200 ${isAdvancedOpen ? 'rotate-90' : ''}`}
              />
            )}
          </button>

          {isAdvancedOpen && (
            <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-200">
              {advancedNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    title={isCollapsed ? `${item.label} - ${item.subLabel}` : undefined}
                    className={`w-full text-left flex items-center rounded-xl p-2.5 transition-all duration-150 cursor-pointer group relative border ${
                      isActive
                        ? 'bg-slate-900 text-white font-extrabold border-slate-900 shadow-xs'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400 hover:bg-slate-50 font-bold'
                    } ${isCollapsed ? 'justify-center' : 'gap-3'}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-700'
                      }`}
                    />

                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <span className="text-xs truncate font-extrabold block">{item.label}</span>
                        <p
                          className={`text-xs truncate font-medium ${
                            isActive ? 'text-slate-200' : 'text-slate-500'
                          }`}
                        >
                          {item.subLabel}
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* AI Chatbot Advisor & Taxonomy Guide CTA Buttons */}
      <div className="p-3 border-t-2 border-slate-200 space-y-2 bg-slate-50">
        {onOpenAdvisorChatbot && (
          <button
            onClick={onOpenAdvisorChatbot}
            className="w-full p-3 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs shadow-md transition-all flex items-center justify-between group cursor-pointer border border-slate-900"
          >
            <div className="flex items-center gap-2 truncate">
              <Sparkles className="w-4 h-4 text-white animate-spin shrink-0" />
              {!isCollapsed && <span className="truncate uppercase tracking-wide">{t('header_advisor_assistant')}</span>}
            </div>
            {!isCollapsed && (
              <span className="px-2 py-0.5 rounded bg-white text-slate-900 text-xs font-mono font-black shrink-0">
                AI
              </span>
            )}
          </button>
        )}

        {onOpenTaxonomyModal && (
          <button
            onClick={onOpenTaxonomyModal}
            className="w-full p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-2xs"
            title="Định nghĩa & Chú thích Gán nhãn Tin tức"
          >
            <BookOpen className="w-4 h-4 text-slate-700 shrink-0" />
            {!isCollapsed && <span className="truncate">{isVietnamese ? 'Chú Thích Nhãn Tin' : 'Sentiment Guide'}</span>}
          </button>
        )}

        {onOpenDbResetModal && (
          <button
            onClick={onOpenDbResetModal}
            className="w-full p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 text-xs font-black transition flex items-center gap-2 cursor-pointer group shadow-2xs"
            title="Quản trị Database & Reset về 0 (Cloud Firestore)"
          >
            <Database className="w-4 h-4 text-slate-700 shrink-0 group-hover:scale-110 transition-transform" />
            {!isCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <span className="truncate block">{isVietnamese ? 'Reset Database về 0' : 'Reset Database'}</span>
              </div>
            )}
          </button>
        )}
      </div>

      {/* Footer Info Box */}
      {!isCollapsed && (
        <div className="p-3 border-t-2 border-slate-200 bg-slate-100 space-y-2">
          <div className="p-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs space-y-2 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-extrabold text-slate-500">
                  {isVietnamese ? 'Cập nhật gần nhất' : 'Last Scanned'}
                </span>
                <Clock className="w-3.5 h-3.5 text-slate-700" />
              </div>
              <p className="font-mono text-slate-900 font-black text-xs">{appUpdatedAt || (isVietnamese ? 'Đang tải...' : 'Loading...')}</p>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">{t('header_version')}</span>
              <span className="text-slate-900 font-mono font-black">{appVersion}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs px-1 font-bold">
            <span className="flex items-center gap-1.5 text-slate-700">
              <ShieldAlert className="w-4 h-4 text-slate-900" />
              {isVietnamese ? 'Ban Lãnh Đạo' : 'Leadership Board'}
            </span>
            <span className="text-slate-900 font-black uppercase px-2 py-0.5 rounded bg-slate-200 border border-slate-300">Online</span>
          </div>
        </div>
      )}
    </aside>
    </>
  );
};
