import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  Table as TableIcon,
  BarChart3,
  FileCheck2,
  Sparkles,
  ShieldAlert,
  Flame,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  X,
  Layers,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { CmsNavigationTab } from './CmsSidebar';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { UrgentAlert, ActiveAlertNotification, ScrapedNewsItem } from '../types';
import { scrollToNewsCard } from '../lib/scrollToArticle';
import { isRiskArticle } from '../lib/newsClassification';

export interface AlertNavItem {
  id: string;
  articleId: string;
  title: string;
  impact?: 'critical' | 'high' | 'medium' | 'low';
  isEmergency?: boolean;
  timeAgo?: string;
  source?: string;
}

interface MobileStickyFooterProps {
  activeTab: CmsNavigationTab;
  onSelectTab: (tab: CmsNavigationTab) => void;
  totalArticles?: number;
  crisisCount?: number;
  onOpenAdvisor?: () => void;
  urgentAlerts?: UrgentAlert[];
  activeUrgentToast?: ActiveAlertNotification | null;
  articles?: ScrapedNewsItem[];
  onSelectAlertArticle?: (articleId: string) => void;
}

export const MobileStickyFooter: React.FC<MobileStickyFooterProps> = ({
  activeTab,
  onSelectTab,
  totalArticles = 0,
  crisisCount = 0,
  onOpenAdvisor,
  urgentAlerts = [],
  activeUrgentToast = null,
  articles = [],
  onSelectAlertArticle,
}) => {
  const { isDark } = useTheme();
  const { isVietnamese } = useI18n();
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [showAlertSheet, setShowAlertSheet] = useState(false);
  const [isAlertBannerDismissed, setIsAlertBannerDismissed] = useState(false);

  // Synthesize and normalize all active alerts
  const resolvedAlerts = useMemo<AlertNavItem[]>(() => {
    const list: AlertNavItem[] = [];
    const seenArticleIds = new Set<string>();

    // 1. Toast alert (highest priority live spike)
    if (activeUrgentToast?.article) {
      const art = activeUrgentToast.article;
      seenArticleIds.add(art.id);
      list.push({
        id: `toast-${art.id}`,
        articleId: art.id,
        title: art.title,
        impact: activeUrgentToast.priorityLevel === 'critical' ? 'critical' : 'high',
        isEmergency: true,
        timeAgo: art.timeAgo || 'Vừa phát hiện',
        source: art.source,
      });
    }

    // 2. Urgent alerts from data
    if (urgentAlerts && urgentAlerts.length > 0) {
      urgentAlerts.forEach((ua) => {
        let matchedId = ua.id;
        if (!seenArticleIds.has(matchedId) && articles && articles.length > 0) {
          const matched = articles.find(
            (a) =>
              a.id === ua.id ||
              a.title.trim().toLowerCase() === ua.title.trim().toLowerCase() ||
              (a.title && ua.title && (a.title.includes(ua.title) || ua.title.includes(a.title)))
          );
          if (matched) matchedId = matched.id;
        }

        if (!seenArticleIds.has(matchedId)) {
          seenArticleIds.add(matchedId);
          list.push({
            id: ua.id,
            articleId: matchedId,
            title: ua.title,
            impact: (ua.impact as any) || 'high',
            isEmergency: Boolean(ua.isEmergency),
            timeAgo: ua.timeAgo || 'Gần đây',
            source: (ua as any).source,
          });
        }
      });
    }

    // 3. Fallback to crisis articles if crisisCount > 0 but urgentAlerts is empty
    if (list.length === 0 && crisisCount > 0 && articles && articles.length > 0) {
      const crisisArticles = articles.filter(isRiskArticle).slice(0, 5);
      crisisArticles.forEach((art) => {
        if (!seenArticleIds.has(art.id)) {
          seenArticleIds.add(art.id);
          list.push({
            id: art.id,
            articleId: art.id,
            title: art.title,
            impact: art.impactLevel || 'high',
            isEmergency: Boolean(art.isEmergency),
            timeAgo: art.timeAgo || 'Vừa cập nhật',
            source: art.source,
          });
        }
      });
    }

    return list;
  }, [activeUrgentToast, urgentAlerts, articles, crisisCount]);

  // Keep currentAlertIndex within bounds
  useEffect(() => {
    if (currentAlertIndex >= resolvedAlerts.length) {
      setCurrentAlertIndex(0);
    }
  }, [resolvedAlerts.length, currentAlertIndex]);

  const activeAlert = resolvedAlerts[currentAlertIndex] || resolvedAlerts[0] || null;

  // Handler for tapping an active alert to scroll directly to its NewsCard
  const handleJumpToAlert = (articleId: string) => {
    if (!articleId) return;

    // Subtle tactile feedback
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      navigator.vibrate(20);
    }

    setShowAlertSheet(false);

    // Notify parent controller if callback provided
    if (onSelectAlertArticle) {
      onSelectAlertArticle(articleId);
    }

    // If not currently on dashboard, switch to dashboard first
    if (activeTab !== 'dashboard') {
      onSelectTab('dashboard');
    }

    // Dispatch custom DOM event for MobileSwipeableDashboard to swipe to the matching card
    window.dispatchEvent(
      new CustomEvent('mof-scroll-to-article', {
        detail: { articleId },
      })
    );

    // Trigger smooth scroll to target NewsCard with progressive delays for transitions
    setTimeout(() => {
      scrollToNewsCard(articleId);
    }, 120);

    setTimeout(() => {
      scrollToNewsCard(articleId);
    }, 380);
  };

  const handleNextAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (resolvedAlerts.length > 1) {
      setCurrentAlertIndex((prev) => (prev + 1) % resolvedAlerts.length);
    }
  };

  const handlePrevAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (resolvedAlerts.length > 1) {
      setCurrentAlertIndex((prev) => (prev - 1 + resolvedAlerts.length) % resolvedAlerts.length);
    }
  };

  const effectiveCrisisCount = resolvedAlerts.length > 0 ? resolvedAlerts.length : crisisCount;

  const coreNavItems = [
    {
      id: 'dashboard' as CmsNavigationTab,
      label: isVietnamese ? 'Tổng quan' : 'Dashboard',
      icon: LayoutDashboard,
      badge: effectiveCrisisCount > 0 ? effectiveCrisisCount : undefined,
      badgeType: 'danger' as const,
      hasActiveAlert: resolvedAlerts.length > 0,
    },
    {
      id: 'table' as CmsNavigationTab,
      label: isVietnamese ? 'Bảng tin' : 'Table',
      icon: TableIcon,
      badge: totalArticles > 0 ? (totalArticles > 999 ? '999+' : totalArticles) : undefined,
      badgeType: 'neutral' as const,
      hasActiveAlert: false,
    },
    {
      id: 'analytics' as CmsNavigationTab,
      label: 'Analytics',
      icon: BarChart3,
      badge: undefined,
      badgeType: 'neutral' as const,
      hasActiveAlert: false,
    },
    {
      id: 'briefing' as CmsNavigationTab,
      label: isVietnamese ? 'Tham mưu' : 'Briefing',
      icon: FileCheck2,
      badge: undefined,
      badgeType: 'neutral' as const,
      hasActiveAlert: false,
    },
  ];

  return (
    <>
      {/* Active Alerts Quick-Sheet / Drawer (Modal on mobile) */}
      {showAlertSheet && resolvedAlerts.length > 0 && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="flex-1"
            onClick={() => setShowAlertSheet(false)}
          />
          <div
            className={`rounded-t-2xl border-t p-4 max-h-[75vh] flex flex-col shadow-2xl transition-all ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <ShieldAlert className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-rose-500">
                    Danh Sách Cảnh Báo Hoạt Động ({resolvedAlerts.length})
                  </h3>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Chạm vào bất kỳ cảnh báo nào để cuộn ngay tới NewsCard
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAlertSheet(false)}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900'
                }`}
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of active alerts */}
            <div className="space-y-2 overflow-y-auto custom-scrollbar pr-0.5">
              {resolvedAlerts.map((alert, idx) => (
                <div
                  key={alert.id || idx}
                  id={`mobile-nav-alert-item-${alert.articleId}`}
                  onClick={() => handleJumpToAlert(alert.articleId)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition active:scale-[0.98] ${
                    isDark
                      ? 'bg-slate-900/90 border-slate-800 hover:border-rose-500/50 hover:bg-slate-900'
                      : 'bg-slate-50 border-slate-200 hover:border-rose-400 hover:bg-rose-50/40'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
                      </span>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        {alert.isEmergency ? 'BÁO ĐỘNG ĐỎ' : 'CẢNH BÁO TÁC CHIẾN'}
                      </span>
                      {alert.source && (
                        <span className="text-[9px] font-mono text-slate-400 truncate">
                          {alert.source}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs font-bold line-clamp-2 leading-snug ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}>
                      {alert.title}
                    </p>
                  </div>
                  <button
                    className="shrink-0 py-1.5 px-2.5 rounded-lg text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 shadow-sm"
                  >
                    <span>Xem tin</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Mobile Sticky Navigation Bar */}
      <nav
        id="mobile-sticky-footer-nav"
        aria-label="Mobile Core Navigation"
        className={`fixed bottom-0 inset-x-0 z-40 md:hidden transition-colors border-t backdrop-blur-lg select-none pb-safe ${
          isDark
            ? 'bg-slate-950/95 border-slate-800 text-slate-200 shadow-2xl shadow-black/80'
            : 'bg-white/95 border-slate-200 text-slate-800 shadow-lg shadow-slate-900/10'
        }`}
      >
        {/* Docked Active Alert Banner Strip (Visible when active alert exists and not dismissed) */}
        {activeAlert && !isAlertBannerDismissed && (
          <div
            id="mobile-nav-active-alert-strip"
            className={`border-b transition-all duration-200 ${
              isDark
                ? 'bg-gradient-to-r from-rose-950/90 via-slate-950 to-slate-950 border-rose-500/30'
                : 'bg-gradient-to-r from-rose-50 via-white to-white border-rose-200'
            }`}
          >
            <div className="max-w-lg mx-auto px-2 py-1.5 flex items-center justify-between gap-1.5">
              {/* Tap anywhere on alert strip to scroll directly to target NewsCard */}
              <div
                onClick={() => handleJumpToAlert(activeAlert.articleId)}
                className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer group active:opacity-80"
                title="Chạm để cuộn ngay tới thẻ bài viết này"
              >
                {/* Flashing Alert Indicator */}
                <div className="relative flex items-center justify-center shrink-0">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-rose-500 dark:text-rose-400 shrink-0">
                      {activeAlert.isEmergency ? '🚨 KHẨN CẤP' : '⚠️ CẢNH BÁO'}
                    </span>
                    {resolvedAlerts.length > 1 && (
                      <span className="text-[9px] font-mono px-1 rounded bg-rose-500/15 text-rose-400 shrink-0">
                        {currentAlertIndex + 1}/{resolvedAlerts.length}
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-bold truncate ${
                        isDark ? 'text-slate-100 group-hover:text-rose-300' : 'text-slate-900 group-hover:text-rose-600'
                      }`}
                    >
                      {activeAlert.title}
                    </span>
                  </div>
                </div>

                {/* Direct Action Pill */}
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition active:scale-95">
                  <span>Xem thẻ</span>
                  <ArrowRight className="w-3 h-3 animate-pulse" />
                </span>
              </div>

              {/* Multiple alerts toggles + Dismiss */}
              <div className="flex items-center gap-0.5 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-1.5 ml-1">
                {resolvedAlerts.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevAlert}
                      className={`p-1 rounded transition cursor-pointer ${
                        isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
                      }`}
                      title="Cảnh báo trước"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowAlertSheet(true)}
                      className="text-[9px] font-black font-mono px-1 py-0.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                      title="Xem tất cả cảnh báo"
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={handleNextAlert}
                      className={`p-1 rounded transition cursor-pointer ${
                        isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
                      }`}
                      title="Cảnh báo tiếp"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsAlertBannerDismissed(true)}
                  className={`p-1 rounded transition cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                  }`}
                  title="Ẩn thanh cảnh báo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5-Column Core Navigation Buttons */}
        <div className="grid grid-cols-5 items-stretch h-14 max-w-lg mx-auto px-1.5">
          {coreNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                id={`mobile-nav-btn-${item.id}`}
                type="button"
                onClick={() => {
                  // If tapping Dashboard with an active alert present, also trigger auto-scroll to NewsCard
                  if (item.id === 'dashboard' && resolvedAlerts.length > 0) {
                    onSelectTab('dashboard');
                    if (activeAlert) {
                      handleJumpToAlert(activeAlert.articleId);
                    }
                    return;
                  }

                  onSelectTab(item.id);
                  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
                    navigator.vibrate(12);
                  }
                }}
                className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-150 py-1 px-0.5 rounded-lg active:scale-95 touch-manipulation focus:outline-hidden ${
                  isActive
                    ? isDark
                      ? 'text-emerald-400 font-bold'
                      : 'text-emerald-700 font-bold'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {/* Active indicator top bar */}
                {isActive && (
                  <span className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
                )}

                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-150 ${
                      isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                    }`}
                  />

                  {/* Danger Badge for Active Alerts / Crisis Count */}
                  {item.badge !== undefined && (
                    <span
                      onClick={(e) => {
                        // Tapping directly on the danger badge triggers active alert jump
                        if (item.hasActiveAlert && activeAlert) {
                          e.stopPropagation();
                          handleJumpToAlert(activeAlert.articleId);
                        }
                      }}
                      className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center leading-none ring-1 cursor-pointer ${
                        item.badgeType === 'danger'
                          ? 'bg-rose-600 text-white ring-rose-400/50 animate-pulse hover:scale-110'
                          : isDark
                          ? 'bg-slate-800 text-emerald-400 ring-slate-700'
                          : 'bg-slate-200 text-slate-800 ring-slate-300'
                      }`}
                      title={item.hasActiveAlert ? 'Chạm để cuộn tới bài viết cảnh báo' : undefined}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] leading-tight tracking-tight truncate max-w-full px-0.5 ${
                    isActive ? 'font-black' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* 5th slot: Quick Action AI Advisor button */}
          <button
            id="mobile-nav-btn-advisor"
            type="button"
            onClick={() => {
              if (onOpenAdvisor) onOpenAdvisor();
              if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
                navigator.vibrate(15);
              }
            }}
            className="relative flex flex-col items-center justify-center gap-1 transition-all duration-150 py-1 px-0.5 rounded-lg active:scale-95 touch-manipulation focus:outline-hidden text-amber-500 hover:text-amber-400"
            title={isVietnamese ? 'Cố vấn AI Lãnh đạo' : 'AI Advisor'}
          >
            <div className="relative flex items-center justify-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isDark
                    ? 'bg-gradient-to-tr from-amber-600/30 to-rose-600/30 border border-amber-500/40 text-amber-300'
                    : 'bg-amber-100 border border-amber-300 text-amber-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              </div>
            </div>
            <span className="text-[10px] font-bold leading-tight tracking-tight truncate max-w-full px-0.5">
              {isVietnamese ? 'Cố vấn' : 'Advisor'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
