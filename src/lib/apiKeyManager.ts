const API_KEY_STORAGE_KEY = 'finpulse_custom_gemini_api_key';
const API_KEY_MODE_KEY = 'finpulse_api_key_mode'; // 'system' | 'custom'

export function getCustomApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setCustomApiKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
      localStorage.setItem(API_KEY_MODE_KEY, 'custom');
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      localStorage.setItem(API_KEY_MODE_KEY, 'system');
    }
  } catch (e) {
    console.error('Failed to save API key to localStorage', e);
  }
}

export function getApiKeyMode(): 'system' | 'custom' {
  try {
    const mode = localStorage.getItem(API_KEY_MODE_KEY);
    const customKey = getCustomApiKey();
    if (mode === 'custom' && customKey) {
      return 'custom';
    }
  } catch {
    // fallback
  }
  return 'system';
}

export function setApiKeyMode(mode: 'system' | 'custom'): void {
  try {
    localStorage.setItem(API_KEY_MODE_KEY, mode);
  } catch (e) {
    console.error('Failed to save API key mode', e);
  }
}

export function getActiveApiKey(): string {
  if (getApiKeyMode() === 'custom') {
    return getCustomApiKey();
  }
  return '';
}

export function getApiKeyHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'x-gemini-model': 'gemini-3.8-flash',
  };
  try {
    const customKey = getActiveApiKey();
    if (customKey && typeof customKey === 'string') {
      // Strip any non-ASCII characters, control characters, or newlines to guarantee valid HTTP header ByteString
      const sanitized = customKey.replace(/[^\x21-\x7E]/g, '').trim();
      if (sanitized.length > 0) {
        headers['x-user-gemini-key'] = sanitized;
      }
    }
  } catch {}
  return headers;
}

export function getCustomApiKeyHeader(): Record<string, string> {
  return getApiKeyHeaders();
}

export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  return key.substring(0, 4) + '••••••••••••' + key.substring(key.length - 4);
}
