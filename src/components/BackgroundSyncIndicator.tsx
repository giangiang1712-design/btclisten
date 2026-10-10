import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Bell,
  CheckCircle2,
  X,
  Radio,
  Layers,
  Sparkles,
  Info,
  Clock,
  Check,
} from 'lucide-react';
import { backgroundSyncManager, BackgroundSyncStatus } from '../services/backgroundSyncManager';

interface BackgroundSyncIndicatorProps {
  isDark?: boolean;
  isVietnamese?: boolean;
  isMainAppLoading?: boolean;
  onTriggerManualBackgroundScrape?: () => void;
}

export const BackgroundSyncIndicator: React.FC<BackgroundSyncIndicatorProps> = ({
  isDark = true,
  isVietnamese = true,
  isMainAppLoading = false,
  onTriggerManualBackgroundScrape,
}) => {
  const [status, setStatus] = useState<BackgroundSyncStatus>(() => backgroundSyncManager.getStatus());
  const [showModal, setShowModal] = useState<boolean>(false);
  const [notifGranted, setNotifGranted] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });
  const [justTriggered, setJustTriggered] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = backgroundSyncManager.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  const handleRequestNotification = async () => {
    const granted = await backgroundSyncManager.requestNotificationPermission();
    setNotifGranted(granted);
  };

  const handleTriggerScrape = () => {
    setJustTriggered(true);
    if (onTriggerManualBackgroundScrape) {
      onTriggerManualBackgroundScrape();
    } else {
      backgroundSyncManager.triggerBackgroundScrape({
        timeRange: '24h',
        sector: 'all',
        forceRefresh: true,
      });
    }
    setTimeout(() => setJustTriggered(false), 3000);
  };

  const isScrapingActive = status.isBackgroundScraping || (isMainAppLoading && status.isTabHidden);
  const scannedCount = Math.min(150, status.progress.scannedSourcesCount || 0);

  return (
    <>
      {/* 1. Header Navigation Status Pill */}
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold transition cursor-pointer shadow-xs ${
          isScrapingActive
            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 ring-2 ring-emerald-500/20 animate-pulse'
            : isDark
            ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
        }`}
        title={
          isVietnamese
            ? 'Service Worker & Background Sync: Đang duy trì cào dữ liệu kể cả khi chuyển tab hoặc ẩn màn hình. Bấm để xem chi tiết.'
            : 'Service Worker & Background Sync: Running continuously even when tab is hidden or backgrounded. Click for details.'
        }
      >
        {isScrapingActive ? (
          <div className="relative flex items-center justify-center">
            <Radio className="w-4 h-4 text-emerald-400 animate-spin" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-950 animate-ping" />
          </div>
        ) : status.isRegistered ? (
          <Wifi className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-amber-500" />
        )}

        <div className="flex items-center gap-1.5 font-mono">
          {isScrapingActive ? (
            <>
              <span className="font-extrabold text-emerald-400">
                {isVietnamese ? 'Cào ngầm:' : 'Bg Sync:'}
              </span>
              <span className="text-xs font-black text-emerald-300">
                {scannedCount > 0 ? `${scannedCount}/150 nguồn` : (isVietnamese ? 'Đang kích hoạt...' : 'Fetching...')}
              </span>
            </>
          ) : (
            <>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                {isVietnamese ? 'Cào ngầm:' : 'Bg Task:'}
              </span>
              <span className={`font-semibold ${status.isRegistered ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : 'text-slate-400'}`}>
                {status.isRegistered ? (isVietnamese ? 'Sẵn sàng' : 'Ready') : (isVietnamese ? 'Khởi tạo' : 'Init')}
              </span>
            </>
          )}
        </div>
      </button>

      {/* 2. Floating Toast when background scrape completes while tab was hidden */}
      {status.hasNewDataWhileHidden && (
        <div className="fixed top-20 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`p-4 rounded-2xl border shadow-2xl flex items-start gap-3 backdrop-blur-md ${
              isDark
                ? 'bg-slate-900/95 border-emerald-500/40 text-slate-100 shadow-emerald-950/40'
                : 'bg-white/95 border-emerald-400 text-slate-900 shadow-emerald-200/50'
            }`}
          >
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-extrabold text-emerald-400">
                  {isVietnamese ? 'Cào ngầm hoàn tất thành công!' : 'Background Scrape Completed!'}
                </h4>
                <button
                  onClick={() => backgroundSyncManager.dismissNewDataIndicator()}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {isVietnamese
                  ? `Đã tự động thu thập và đồng bộ ${status.lastResultCount || 0} bài báo tài chính từ 150 nguồn trong lúc bạn rời khỏi màn hình.`
                  : `Successfully fetched & synced ${status.lastResultCount || 0} financial articles from 150 sources while the tab was hidden.`}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={() => backgroundSyncManager.dismissNewDataIndicator()}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isVietnamese ? 'Xem kết quả mới' : 'View New Articles'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Detailed Background Sync Management Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Radio className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">
                    {isVietnamese ? 'Tiến Trình Cào Dữ Liệu Chạy Ngầm' : 'Background Periodic Scrape Service'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Service Worker & Background Periodic Sync 2026
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Grid */}
            <div className="mt-4 space-y-3 text-xs">
              {/* Item 1: Service Worker Status */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="font-bold">{isVietnamese ? 'Trạng thái Service Worker:' : 'Service Worker State:'}</div>
                    <div className="text-[11px] text-slate-400">
                      {status.isRegistered
                        ? (isVietnamese ? 'Đã kích hoạt điều khiển luồng độc lập' : 'Active & controlling background threads')
                        : (isVietnamese ? 'Đang khởi động Service Worker...' : 'Registering...')}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    status.isRegistered
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {status.isRegistered ? (isVietnamese ? 'Hoạt động' : 'Active') : (isVietnamese ? 'Chờ duyệt' : 'Pending')}
                </span>
              </div>

              {/* Item 2: Background Periodic Sync */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <RefreshCw className={`w-4 h-4 ${isScrapingActive ? 'text-emerald-400 animate-spin' : 'text-emerald-400'}`} />
                  <div>
                    <div className="font-bold">{isVietnamese ? 'Cào khi chuyển tab / ẩn màn hình:' : 'Hidden Tab Scrape Preservation:'}</div>
                    <div className="text-[11px] text-slate-400">
                      {isScrapingActive
                        ? (isVietnamese ? `Đang quét ngầm nguồn: ${scannedCount}/150` : `Scanning in background: ${scannedCount}/150`)
                        : (isVietnamese ? 'Tự động tiếp tục quét, không bị gián đoạn' : 'Preserves ongoing crawls when tab is hidden')}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/40">
                  {isVietnamese ? 'Tự động bảo toàn' : 'Auto Preserved'}
                </span>
              </div>

              {/* Item 3: Notification permission */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-bold">{isVietnamese ? 'Thông báo khi cào xong:' : 'Completion Notification:'}</div>
                    <div className="text-[11px] text-slate-400">
                      {notifGranted
                        ? (isVietnamese ? 'Đã bật thông báo trên màn hình' : 'Desktop notifications enabled')
                        : (isVietnamese ? 'Nhận thông báo khi hoàn tất lúc tab ẩn' : 'Notify when done while away')}
                    </div>
                  </div>
                </div>
                {notifGranted ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isVietnamese ? 'Đã bật' : 'Granted'}</span>
                  </span>
                ) : (
                  <button
                    onClick={handleRequestNotification}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition"
                  >
                    {isVietnamese ? 'Bật thông báo' : 'Enable'}
                  </button>
                )}
              </div>

              {/* Item 4: Last background sync timestamp */}
              {status.lastSyncTimestamp > 0 && (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="font-bold">{isVietnamese ? 'Lần cào ngầm gần nhất:' : 'Last Background Scrape:'}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(status.lastSyncTimestamp).toLocaleTimeString('vi-VN')} ({status.lastResultCount} bài báo)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Explanatory Info Card */}
            <div className="mt-4 p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                {isVietnamese
                  ? 'Khi bạn chuyển sang tab làm việc khác hoặc ẩn trình duyệt, Service Worker sẽ chạy độc lập để tiếp tục quét đủ 150 nguồn chính thức. Khi bạn quay lại, toàn bộ tin tức mới sẽ lập tức sẵn sàng mà không phải quét lại từ đầu.'
                  : 'When you switch to another tab or minimize the browser, the Service Worker runs independently in the background to complete crawling all 150 official sources without restarting.'}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
              <div className="text-[11px] text-slate-400">
                {isScrapingActive
                  ? (isVietnamese ? '⚡ Tiến trình cào ngầm đang thực thi...' : '⚡ Background crawling active...')
                  : (isVietnamese ? 'Sẵn sàng kích hoạt' : 'Ready')}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerScrape}
                  disabled={isScrapingActive}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-md ${
                    isScrapingActive
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : justTriggered
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScrapingActive ? 'animate-spin' : ''}`} />
                  <span>
                    {justTriggered
                      ? (isVietnamese ? 'Đã gửi lệnh cào ngầm!' : 'Dispatched!')
                      : (isVietnamese ? 'Kích hoạt cào ngầm ngay' : 'Trigger Background Scrape')}
                  </span>
                </button>

                <button
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                >
                  {isVietnamese ? 'Đóng' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
