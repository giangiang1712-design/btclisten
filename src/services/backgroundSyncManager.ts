// Background Sync & Service Worker Manager for continuous background crawling
// Handles Service Worker registration, Periodic Background Sync, and background state notifications

export interface BackgroundProgressState {
  currentSourceIndex: number;
  totalSources: number;
  scannedSourcesCount: number;
  currentSourceName: string;
  matchedSourcesCount?: number;
  totalEvaluated?: number;
  totalMatched?: number;
}

export interface BackgroundSyncStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isPeriodicSyncSupported: boolean;
  isBackgroundScraping: boolean;
  isTabHidden: boolean;
  lastSyncTimestamp: number;
  lastResultCount: number;
  progress: BackgroundProgressState;
  hasNewDataWhileHidden: boolean;
}

type SyncCallback = (status: BackgroundSyncStatus) => void;
type ScrapeCompletionCallback = (data: any, totalArticles: number) => void;

class BackgroundSyncService {
  private registration: ServiceWorkerRegistration | null = null;
  private listeners: Set<SyncCallback> = new Set();
  private completionListeners: Set<ScrapeCompletionCallback> = new Set();
  private originalTitle: string = typeof document !== 'undefined' ? document.title : 'Bộ Tài chính - Giám sát tin tức';
  private wasScrapingWhenHidden: boolean = false;

  private state: BackgroundSyncStatus = {
    isSupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    isRegistered: false,
    isPeriodicSyncSupported: false,
    isBackgroundScraping: false,
    isTabHidden: typeof document !== 'undefined' ? document.hidden : false,
    lastSyncTimestamp: 0,
    lastResultCount: 0,
    progress: {
      currentSourceIndex: 0,
      totalSources: 150,
      scannedSourcesCount: 0,
      currentSourceName: '',
    },
    hasNewDataWhileHidden: false,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  public async init() {
    if (!this.state.isSupported) {
      console.warn('⚠️ [Background Sync] Service Worker not supported in this browser environment');
      return;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('⚡ [Background Sync] Service Worker registered with scope:', this.registration.scope);

      this.state.isRegistered = true;

      // Check Periodic Sync support
      if ('periodicSync' in this.registration) {
        this.state.isPeriodicSyncSupported = true;
        this.registerPeriodicSync();
      }

      // Listen for messages from the Service Worker
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

      // Listen for tab visibility changes
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

      // Query current worker status
      this.queryWorkerStatus();

      this.notifyListeners();
    } catch (err) {
      console.warn('⚠️ [Background Sync] Registration error:', err);
    }
  }

  // Register modern Periodic Background Sync
  private async registerPeriodicSync() {
    if (!this.registration || !('periodicSync' in this.registration)) return;

    try {
      const periodicSync = (this.registration as any).periodicSync;
      const tags = await periodicSync.getTags();
      if (!tags.includes('mof-periodic-news-sync')) {
        await periodicSync.register('mof-periodic-news-sync', {
          minInterval: 15 * 60 * 1000, // Sync every 15 minutes in background
        });
        console.log('🔄 [Background Sync] Periodic Background Sync tag registered');
      }
    } catch (err) {
      console.warn('⚠️ [Background Sync] Periodic Sync registration notice (may require PWA install):', err);
    }
  }

  // Handle visibility transitions
  private handleVisibilityChange() {
    const isHidden = document.hidden;
    this.state.isTabHidden = isHidden;

    if (isHidden) {
      // Tab hidden: If scraping is currently active, mark that it's running in background
      if (this.state.isBackgroundScraping) {
        this.wasScrapingWhenHidden = true;
        this.updateBackgroundTitle();
      }
    } else {
      // Tab visible again: restore title
      this.restoreTitle();
      // If new data arrived while user was away, let the UI know
      this.notifyListeners();
    }
  }

  private updateBackgroundTitle() {
    if (typeof document !== 'undefined') {
      const percent = Math.min(100, Math.round((this.state.progress.scannedSourcesCount / 150) * 100));
      document.title = `🔄 [Đang cào ngầm ${percent}%...] Bộ Tài chính - 150 Nguồn Báo Chí`;
    }
  }

  private restoreTitle() {
    if (typeof document !== 'undefined') {
      document.title = this.originalTitle || 'Bộ Tài chính - Giám sát tin tức & Phân tích chính sách';
    }
  }

  // Handle messages dispatched by the Service Worker
  private handleServiceWorkerMessage(event: MessageEvent) {
    const data = event.data;
    if (!data || !data.type) return;

    switch (data.type) {
      case 'BACKGROUND_SCRAPE_STARTED':
        this.state.isBackgroundScraping = true;
        this.state.progress = {
          currentSourceIndex: 0,
          totalSources: 150,
          scannedSourcesCount: 0,
          currentSourceName: 'Bắt đầu quét ngầm 150 nguồn...',
        };
        if (this.state.isTabHidden) {
          this.wasScrapingWhenHidden = true;
          this.updateBackgroundTitle();
        }
        this.notifyListeners();
        break;

      case 'BACKGROUND_SCRAPE_PROGRESS':
        if (data.progress) {
          this.state.progress = {
            ...this.state.progress,
            ...data.progress,
          };
          if (this.state.isTabHidden) {
            this.updateBackgroundTitle();
          }
        }
        this.notifyListeners();
        break;

      case 'BACKGROUND_SCRAPE_COMPLETED':
        this.state.isBackgroundScraping = false;
        this.state.lastSyncTimestamp = data.timestamp || Date.now();
        this.state.lastResultCount = data.totalArticles || data.data?.news?.length || 0;
        this.state.progress = {
          currentSourceIndex: 150,
          totalSources: 150,
          scannedSourcesCount: 150,
          currentSourceName: 'Hoàn tất cào ngầm 150 nguồn',
        };

        if (this.state.isTabHidden || this.wasScrapingWhenHidden) {
          this.state.hasNewDataWhileHidden = true;
        }

        this.restoreTitle();
        this.notifyListeners();

        // Dispatch completed data to app listeners
        for (const cb of this.completionListeners) {
          try {
            cb(data.data, this.state.lastResultCount);
          } catch (e) {
            console.error('Error in completion listener:', e);
          }
        }
        break;

      case 'BACKGROUND_SCRAPE_FAILED':
        this.state.isBackgroundScraping = false;
        this.restoreTitle();
        this.notifyListeners();
        break;

      case 'STATUS_RESPONSE':
        this.state.isBackgroundScraping = data.isBackgroundScraping || false;
        if (data.currentProgress) {
          this.state.progress = data.currentProgress;
        }
        if (data.lastScrapeTimestamp) {
          this.state.lastSyncTimestamp = data.lastScrapeTimestamp;
        }
        this.notifyListeners();
        break;

      default:
        break;
    }
  }

  // Query status from Service Worker
  public queryWorkerStatus() {
    if (!navigator.serviceWorker.controller) return;
    navigator.serviceWorker.controller.postMessage({ type: 'GET_STATUS' });
  }

  // Trigger background scrape via Service Worker
  public triggerBackgroundScrape(params: {
    timeRange?: string;
    sector?: string;
    query?: string;
    forceRefresh?: boolean;
    officialOnly?: boolean;
  } = {}) {
    this.state.isBackgroundScraping = true;
    this.notifyListeners();

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'TRIGGER_BACKGROUND_SCRAPE',
        payload: params,
      });
    } else if (this.registration?.active) {
      this.registration.active.postMessage({
        type: 'TRIGGER_BACKGROUND_SCRAPE',
        payload: params,
      });
    } else {
      // Fallback: one-shot sync registration
      if (this.registration && 'sync' in this.registration) {
        (this.registration as any).sync.register('mof-background-news-sync').catch(() => {});
      }
    }
  }

  // Mark that user has seen the newly fetched background data
  public dismissNewDataIndicator() {
    this.state.hasNewDataWhileHidden = false;
    this.wasScrapingWhenHidden = false;
    this.notifyListeners();
  }

  // Request native notification permission for background completion alerts
  public async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  // State subscription
  public subscribe(cb: SyncCallback): () => void {
    this.listeners.add(cb);
    cb(this.state);
    return () => this.listeners.delete(cb);
  }

  // Scrape completion subscription
  public onScrapeCompleted(cb: ScrapeCompletionCallback): () => void {
    this.completionListeners.add(cb);
    return () => this.completionListeners.delete(cb);
  }

  public getStatus(): BackgroundSyncStatus {
    return { ...this.state };
  }

  private notifyListeners() {
    const current = { ...this.state };
    for (const listener of this.listeners) {
      try {
        listener(current);
      } catch (err) {
        console.error('Error calling listener:', err);
      }
    }
  }
}

export const backgroundSyncManager = new BackgroundSyncService();
