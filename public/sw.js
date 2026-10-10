// Service Worker for Vietnam Ministry of Finance News Intelligence Dashboard
// Enables background scraping, Periodic Background Sync, and offline cache preservation

const CACHE_NAME = 'mof-news-sw-v1';
const DATA_CACHE_NAME = 'mof-background-scrape-cache-v1';

let isBackgroundScraping = false;
let currentProgress = {
  currentSourceIndex: 0,
  totalSources: 150,
  scannedSourcesCount: 0,
  currentSourceName: '',
};
let lastScrapeResult = null;
let lastScrapeTimestamp = 0;

// Install event: Cache essential assets & take control immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event: Claim clients immediately so background tasks work without refresh
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      console.log('⚡ [Service Worker] Active and controlling clients');
    })()
  );
});

// Broadcast helper to notify all open browser tabs/clients
async function broadcastToClients(message) {
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    for (const client of clients) {
      client.postMessage(message);
    }
  } catch (err) {
    console.warn('[Service Worker] Failed to broadcast message:', err);
  }
}

// Background scrape execution in Service Worker thread
async function executeBackgroundScrape(payload = {}) {
  if (isBackgroundScraping) {
    console.log('⚡ [Service Worker] Background scrape already running, skipping duplicate invocation');
    return lastScrapeResult;
  }

  isBackgroundScraping = true;
  const startTime = Date.now();
  const timeRange = payload.timeRange || '24h';
  const sector = payload.sector || 'all';
  const query = payload.query || '';
  const forceRefresh = payload.forceRefresh || false;
  const officialOnly = payload.officialOnly || false;

  await broadcastToClients({
    type: 'BACKGROUND_SCRAPE_STARTED',
    payload: { timeRange, sector, query, startedAt: startTime },
  });

  // Background telemetry poller during scrape
  let telemetryInterval = setInterval(async () => {
    try {
      const telRes = await fetch('/api/scrape/source-telemetry');
      if (telRes.ok) {
        const telJson = await telRes.json();
        currentProgress = {
          currentSourceIndex: telJson.currentSourceIndex || 0,
          totalSources: telJson.totalSources || 150,
          scannedSourcesCount: telJson.scannedSourcesCount || 0,
          currentSourceName: telJson.currentSource?.name || telJson.currentSource?.shortName || '',
          matchedSourcesCount: telJson.matchedSourcesCount || 0,
          totalEvaluated: telJson.totalEvaluated || 0,
          totalMatched: telJson.totalMatched || 0,
        };
        await broadcastToClients({
          type: 'BACKGROUND_SCRAPE_PROGRESS',
          progress: currentProgress,
          elapsedMs: Date.now() - startTime,
        });
      }
    } catch {
      // Ignore background telemetry errors
    }
  }, 600);

  try {
    console.log('🚀 [Service Worker] Initiating background financial news scrape...');
    const response = await fetch('/api/scrape/financial-news', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeRange,
        sector,
        query,
        forceRefresh,
        officialOnly,
      }),
    });

    clearInterval(telemetryInterval);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to scrape news in background`);
    }

    const data = await response.json();
    lastScrapeResult = data;
    lastScrapeTimestamp = Date.now();

    // Cache the latest response in Cache Storage for offline/instant resume
    try {
      const cache = await caches.open(DATA_CACHE_NAME);
      const cacheKey = new Request('/api/scrape/financial-news/latest-background');
      await cache.put(cacheKey, new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      }));
    } catch (cacheErr) {
      console.warn('[Service Worker] Failed to save in Cache Storage:', cacheErr);
    }

    isBackgroundScraping = false;
    currentProgress.currentSourceIndex = 150;
    currentProgress.scannedSourcesCount = 150;

    const totalArticles = data?.news?.length || 0;
    console.log(`✅ [Service Worker] Background scrape completed successfully: ${totalArticles} articles`);

    // Broadcast success to all clients
    await broadcastToClients({
      type: 'BACKGROUND_SCRAPE_COMPLETED',
      data,
      totalArticles,
      durationMs: Date.now() - startTime,
      timestamp: lastScrapeTimestamp,
    });

    // If client tabs are hidden or inactive, display a notification if permitted
    try {
      const clients = await self.clients.matchAll({ type: 'window' });
      const areAllHidden = clients.length === 0 || clients.every(c => c.visibilityState === 'hidden');
      if (areAllHidden && self.Notification && Notification.permission === 'granted') {
        self.registration.showNotification('Bộ Tài chính: Cập nhật tin tức chạy ngầm', {
          body: `Đã hoàn tất cào ngầm ${totalArticles} tin tức tài chính từ 150 nguồn báo chí.`,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: 'mof-background-scrape-notice',
          renotify: true,
          data: { url: '/' },
        });
      }
    } catch (notifErr) {
      // Ignore notification error
    }

    return data;
  } catch (error) {
    clearInterval(telemetryInterval);
    isBackgroundScraping = false;
    console.error('❌ [Service Worker] Background scrape error:', error);

    await broadcastToClients({
      type: 'BACKGROUND_SCRAPE_FAILED',
      error: error.message || 'Lỗi cào dữ liệu chạy ngầm',
      timestamp: Date.now(),
    });
    throw error;
  }
}

// Listen for messages from client tabs
self.addEventListener('message', (event) => {
  const message = event.data;
  if (!message || !message.type) return;

  switch (message.type) {
    case 'PING':
      event.source?.postMessage({
        type: 'PONG',
        timestamp: Date.now(),
        isBackgroundScraping,
        lastScrapeTimestamp,
      });
      break;

    case 'TRIGGER_BACKGROUND_SCRAPE':
      console.log('📥 [Service Worker] Received TRIGGER_BACKGROUND_SCRAPE message:', message.payload);
      event.waitUntil(executeBackgroundScrape(message.payload));
      break;

    case 'GET_STATUS':
      event.source?.postMessage({
        type: 'STATUS_RESPONSE',
        isBackgroundScraping,
        currentProgress,
        lastScrapeTimestamp,
        hasResult: Boolean(lastScrapeResult),
      });
      break;

    case 'GET_CACHED_DATA':
      (async () => {
        try {
          if (lastScrapeResult) {
            event.source?.postMessage({
              type: 'CACHED_DATA_RESPONSE',
              data: lastScrapeResult,
              timestamp: lastScrapeTimestamp,
            });
            return;
          }
          const cache = await caches.open(DATA_CACHE_NAME);
          const cached = await cache.match(new Request('/api/scrape/financial-news/latest-background'));
          if (cached) {
            const data = await cached.json();
            event.source?.postMessage({
              type: 'CACHED_DATA_RESPONSE',
              data,
              timestamp: lastScrapeTimestamp,
            });
          } else {
            event.source?.postMessage({
              type: 'CACHED_DATA_RESPONSE',
              data: null,
            });
          }
        } catch (err) {
          event.source?.postMessage({
            type: 'CACHED_DATA_RESPONSE',
            data: null,
            error: err.message,
          });
        }
      })();
      break;

    default:
      break;
  }
});

// Periodic Background Sync event handler (for modern Chrome / Android / PWA)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'mof-periodic-news-sync') {
    console.log('🔄 [Service Worker] Periodic background sync triggered!');
    event.waitUntil(executeBackgroundScrape({ timeRange: '24h', sector: 'all' }));
  }
});

// One-shot Background Sync event handler (triggered when network reconnects or background schedule activates)
self.addEventListener('sync', (event) => {
  if (event.tag === 'mof-background-news-sync') {
    console.log('🔄 [Service Worker] Background sync event triggered!');
    event.waitUntil(executeBackgroundScrape({ timeRange: '24h', sector: 'all' }));
  }
});

// Notification click handler: Focus or open the dashboard window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })()
  );
});
