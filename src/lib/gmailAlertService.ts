import { ScrapedNewsItem, UrgentAlert } from '../types';
import { isRiskArticle, isMinistryAuthorityProposal } from './newsClassification';

export interface GmailAlertConfig {
  recipientEmail: string;
  autoDispatch: boolean;
  notifyOnBearishOnly: boolean;
  accessToken: string | null;
  lastTokenTimestamp: number | null;
}

const STORAGE_KEY_GMAIL_CONFIG = 'finpulse_gmail_alert_config';
const STORAGE_KEY_SENT_HISTORY = 'finpulse_sent_alert_ids';

export function getGmailAlertConfig(): GmailAlertConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_GMAIL_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        recipientEmail: parsed.recipientEmail || 'giangiang1712@gmail.com',
        autoDispatch: parsed.autoDispatch ?? false,
        notifyOnBearishOnly: parsed.notifyOnBearishOnly ?? true,
        accessToken: parsed.accessToken || null,
        lastTokenTimestamp: parsed.lastTokenTimestamp || null,
      };
    }
  } catch (err) {
    console.warn('Warning loading Gmail config:', err);
  }
  return {
    recipientEmail: 'giangiang1712@gmail.com',
    autoDispatch: false,
    notifyOnBearishOnly: true,
    accessToken: null,
    lastTokenTimestamp: null,
  };
}

export function saveGmailAlertConfig(config: GmailAlertConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_GMAIL_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving Gmail config:', err);
  }
}

// Track sent article IDs to avoid duplicate automatic email spam
function getSentAlertArticleIds(): Set<string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SENT_HISTORY);
    if (saved) return new Set(JSON.parse(saved));
  } catch (e) {
    // ignore
  }
  return new Set<string>();
}

function markArticleAlertSent(articleId: string) {
  try {
    const set = getSentAlertArticleIds();
    set.add(articleId);
    // Keep max 200 items
    const arr = Array.from(set).slice(-200);
    localStorage.setItem(STORAGE_KEY_SENT_HISTORY, JSON.stringify(arr));
  } catch (e) {
    // ignore
  }
}

// Client-side Token Request via Google Identity Services (GSI)
export function requestGmailAccessToken(onSuccess: (token: string) => void, onError?: (err: any) => void) {
  const google = (typeof window !== 'undefined' && (window as any).google);
  if (!google?.accounts?.oauth2) {
    if (onError) onError('Google Identity Services (GSI) library not loaded yet');
    return;
  }

  try {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: '33056830531-placeholder.apps.googleusercontent.com', // fallback, GSI uses active session
      scope: 'https://www.googleapis.com/auth/gmail.send',
      callback: (response: any) => {
        if (response && response.access_token) {
          const config = getGmailAlertConfig();
          config.accessToken = response.access_token;
          config.lastTokenTimestamp = Date.now();
          saveGmailAlertConfig(config);
          onSuccess(response.access_token);
        } else if (response && response.error) {
          if (onError) onError(response.error);
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  } catch (err) {
    console.warn('GSI Token request exception:', err);
    if (onError) onError(err);
  }
}

export interface SendGmailAlertParams {
  article?: ScrapedNewsItem;
  alertTitle?: string;
  alertSeverity?: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  customNote?: string;
  recipientEmail?: string;
  accessTokenOverride?: string;
}

export async function sendGmailCrisisAlert(params: SendGmailAlertParams): Promise<{
  success: boolean;
  simulated?: boolean;
  messageId?: string;
  error?: string;
  htmlPreview?: string;
}> {
  const config = getGmailAlertConfig();
  const tokenToUse = params.accessTokenOverride || config.accessToken;
  const recipient = params.recipientEmail || config.recipientEmail || 'giangiang1712@gmail.com';

  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      error: 'Thiết bị đang ngoại tuyến. Vui lòng kiểm tra lại kết nối mạng.',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    try {
      controller.abort();
    } catch {
      // ignore
    }
  }, 10000);

  try {
    const res = await fetch('/api/gmail/send-alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        accessToken: tokenToUse,
        recipientEmail: recipient,
        alertTitle: params.alertTitle || params.article?.title,
        alertSeverity: params.alertSeverity || 'CRITICAL',
        article: params.article,
        customNote: params.customNote,
      }),
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorMsg = `Máy chủ trả về trạng thái ${res.status}`;
      try {
        const errorJson = await res.json();
        if (errorJson && errorJson.error) {
          errorMsg = errorJson.error;
        }
      } catch {
        // ignore parse error
      }
      return {
        success: false,
        error: errorMsg,
      };
    }

    const data = await res.json();
    if (data.success && params.article?.id) {
      markArticleAlertSent(params.article.id);
    }
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('Gmail crisis alert dispatch notice:', err?.message || err);
    return {
      success: false,
      error: err?.name === 'AbortError'
        ? 'Thời gian chờ gửi Gmail cảnh báo đã hết hạn (Timeout).'
        : (err?.message || 'Không thể kết nối máy chủ gửi Gmail cảnh báo.'),
    };
  }
}

// Automatic background checker for high impact/crisis items
export async function checkAndAutoDispatchGmailAlerts(newsItems: ScrapedNewsItem[], urgentAlerts: UrgentAlert[]) {
  try {
    const config = getGmailAlertConfig();
    // Only auto-dispatch if explicitly enabled AND user has an authenticated token
    if (!config.autoDispatch || !config.accessToken) return;

    const sentIds = getSentAlertArticleIds();

    // Find articles that are strictly critical emergency items and not yet sent
    const severeItems = newsItems.filter(item => {
      if (sentIds.has(item.id)) return false;
      if (!isRiskArticle(item)) return false;
      if (isMinistryAuthorityProposal(item)) return false;
      const isEmergency = Boolean(item.isEmergency);
      const isSevereTitle = /khởi tố|bắt tạm giam|thao túng|vỡ nợ|mất khả năng thanh toán|phong tỏa tài khoản|lừa đảo|gian lận hóa đơn/i.test(item.title);
      return isEmergency || isSevereTitle || (item.sentimentScore !== undefined && item.sentimentScore <= -50);
    });

    if (severeItems.length === 0) return;

    // Process top critical item automatically
    const topCritical = severeItems[0];

    await sendGmailCrisisAlert({
      article: topCritical,
      alertTitle: topCritical.title,
      alertSeverity: 'CRITICAL',
      customNote: 'Tự động kích hoạt từ Hệ thống Cảnh báo Khủng hoảng Real-time FinPulse.',
    });
  } catch (err: any) {
    console.warn('Auto dispatch check skipped safely:', err?.message || err);
  }
}
