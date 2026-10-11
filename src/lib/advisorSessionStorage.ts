import { saveSessionToCloud, deleteSessionFromCloud } from './firebase';

export interface AdvisorChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedAction?: 'draft_statement' | 'deep_dive' | 'trigger_config' | 'gmail_alert' | 'smart_filter_policy' | 'smart_filter_public' | null;
  actionLabel?: string;
  isStreaming?: boolean;
  isError?: boolean;
  retryPrompt?: string;
  retryActionHint?: 'draft_statement' | 'deep_dive' | 'trigger_config' | 'gmail_alert' | 'smart_filter_policy' | 'smart_filter_public';
  cotBreakdown?: {
    jurisdiction?: string;
    fiscalVsPublic?: string;
    riskChain?: string;
    actionPlan?: string;
  };
}

export interface AdvisorChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: AdvisorChatMessage[];
  roleId: string;
  timeRange?: string;
  contextArticleTitle?: string;
  isPinned?: boolean;
}

const STORAGE_KEY_SESSIONS = 'finpulse_advisor_chat_sessions';
const STORAGE_KEY_ACTIVE_SESSION_ID = 'finpulse_advisor_active_session_id';
const STORAGE_KEY_LEGACY_HISTORY = 'finpulse_advisor_chat_history';

export function createInitialWelcomeMessage(): AdvisorChatMessage {
  return {
    id: `init_${Date.now()}`,
    sender: 'assistant',
    text: 'Xin chào! Tôi là **Trợ lý AI tham mưu, đề xuất hướng xử lý**.\n\nTôi sẵn sàng hỗ trợ anh/chị tham mưu xử lý tình huống, đề xuất chỉ đạo điều hành và tạo các loại văn bản công vụ phù hợp (Thông cáo báo chí, Tờ trình Lãnh đạo Bộ, Công văn, v.v.) theo thể thức văn bản hành chính và quy trình quản lý nhà nước.\n\n*Hệ thống được kích hoạt luồng phản hồi trực tiếp (Real-time Stream) giúp trả lời ngay tức thì không bị gián đoạn.*\n\nAnh/chị hãy chọn tình huống bên dưới hoặc nhập câu hỏi cụ thể!',
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    suggestedAction: null
  };
}

export function generateSessionTitleFromFirstQuery(query: string): string {
  const clean = (query || '')
    .replace(/^["'“«]+|["'”»]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return 'Phiên tư vấn mới';
  if (clean.length <= 42) return clean;
  return clean.slice(0, 40) + '...';
}

export function createDefaultAdvisorSession(
  roleId: string = 'mof_chief_counselor',
  contextArticleTitle?: string
): AdvisorChatSession {
  const now = Date.now();
  const timeStr = new Date(now).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return {
    id: `sess_${now}_${Math.random().toString(36).substring(2, 7)}`,
    title: `Phiên tư vấn (${timeStr})`,
    createdAt: now,
    updatedAt: now,
    messages: [createInitialWelcomeMessage()],
    roleId,
    contextArticleTitle,
    isPinned: false
  };
}

export function loadAllAdvisorSessions(): AdvisorChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((sess: any) => ({
          ...sess,
          messages: Array.isArray(sess.messages)
            ? sess.messages.map((m: any) => ({ ...m, isStreaming: false }))
            : [createInitialWelcomeMessage()]
        }));
      }
    }

    // Check legacy single-history migration
    const legacyHistory = localStorage.getItem(STORAGE_KEY_LEGACY_HISTORY);
    if (legacyHistory) {
      const parsedLegacy = JSON.parse(legacyHistory);
      if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
        const firstUserMsg = parsedLegacy.find((m: any) => m.sender === 'user');
        const legacyTitle = firstUserMsg ? generateSessionTitleFromFirstQuery(firstUserMsg.text) : 'Phiên tư vấn trước đó';
        const migratedSession: AdvisorChatSession = {
          id: 'sess_' + Date.now(),
          title: legacyTitle,
          createdAt: Date.now() - 3600000,
          updatedAt: Date.now(),
          messages: parsedLegacy.map((m: any) => ({ ...m, isStreaming: false })),
          roleId: 'mof_chief_counselor',
          isPinned: false
        };
        const initialList = [migratedSession];
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(initialList));
        localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION_ID, migratedSession.id);
        return initialList;
      }
    }
  } catch (e) {
    console.warn('Failed to load advisor sessions from localStorage:', e);
  }

  // Fallback: create and persist a fresh default session without recursion
  const defaultSess = createDefaultAdvisorSession();
  const initialList = [defaultSess];
  try {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(initialList));
    localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION_ID, defaultSess.id);
  } catch (e) {
    console.warn('Failed to initialize default advisor session in storage:', e);
  }
  return initialList;
}

let cloudSyncTimeout: any = null;

export function saveAllAdvisorSessions(sessions: AdvisorChatSession[]): void {
  try {
    const cleaned = sessions.map(s => ({
      ...s,
      messages: s.messages
        .filter(m => !m.isStreaming || m.text.trim().length > 0)
        .map(m => ({ ...m, isStreaming: false }))
        .slice(-50)
    }));
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(cleaned));

    // Debounce cloud synchronization and only sync the active / most recently updated session
    if (typeof window !== 'undefined') {
      if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout);
      cloudSyncTimeout = setTimeout(() => {
        const activeId = getActiveSessionId();
        const targetSession = cleaned.find(s => s.id === activeId) || cleaned[0];
        if (targetSession) {
          saveSessionToCloud(targetSession).catch(() => {});
        }
      }, 3000);
    }
  } catch (e) {
    console.warn('Failed to save advisor sessions to localStorage:', e);
  }
}

export function getActiveSessionId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION_ID);
  } catch {
    return null;
  }
}

export function setActiveSessionId(sessionId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION_ID, sessionId);
  } catch (e) {
    console.warn('Failed to set active session ID:', e);
  }
}

export function createNewAdvisorSession(
  roleId: string = 'mof_chief_counselor',
  contextArticleTitle?: string
): AdvisorChatSession {
  const newSession = createDefaultAdvisorSession(roleId, contextArticleTitle);
  const sessions = loadAllAdvisorSessions();
  const updatedSessions = [newSession, ...sessions];
  saveAllAdvisorSessions(updatedSessions);
  setActiveSessionId(newSession.id);
  return newSession;
}

export function deleteAdvisorSession(sessionId: string): {
  updatedSessions: AdvisorChatSession[];
  nextActiveSessionId: string;
} {
  deleteSessionFromCloud(sessionId).catch(() => {});
  const sessions = loadAllAdvisorSessions();
  const filtered = sessions.filter(s => s.id !== sessionId);

  let nextActiveSession: AdvisorChatSession;
  if (filtered.length === 0) {
    nextActiveSession = createDefaultAdvisorSession();
    filtered.push(nextActiveSession);
  } else {
    nextActiveSession = filtered[0];
  }

  saveAllAdvisorSessions(filtered);
  setActiveSessionId(nextActiveSession.id);

  return {
    updatedSessions: filtered,
    nextActiveSessionId: nextActiveSession.id
  };
}

export function updateAdvisorSession(
  sessionId: string,
  updater: Partial<AdvisorChatSession> | ((prev: AdvisorChatSession) => AdvisorChatSession)
): AdvisorChatSession[] {
  const sessions = loadAllAdvisorSessions();
  const updated = sessions.map(s => {
    if (s.id === sessionId) {
      if (typeof updater === 'function') {
        return updater(s);
      }
      return { ...s, ...updater, updatedAt: Date.now() };
    }
    return s;
  });
  saveAllAdvisorSessions(updated);
  return updated;
}

export function togglePinAdvisorSession(sessionId: string): AdvisorChatSession[] {
  return updateAdvisorSession(sessionId, prev => ({
    ...prev,
    isPinned: !prev.isPinned,
    updatedAt: Date.now()
  }));
}

export function renameAdvisorSession(sessionId: string, newTitle: string): AdvisorChatSession[] {
  const trimmed = newTitle.trim();
  if (!trimmed) return loadAllAdvisorSessions();
  return updateAdvisorSession(sessionId, { title: trimmed });
}

export function exportSessionAsMarkdown(session: AdvisorChatSession): string {
  const createdDate = new Date(session.createdAt).toLocaleString('vi-VN');
  let md = `# BIÊN BẢN TƯ VẤN THAM MƯU AI (BTC LISTENING)\n\n`;
  md += `- **Tiêu đề phiên:** ${session.title}\n`;
  md += `- **Mã phiên:** ${session.id}\n`;
  md += `- **Thời gian khởi tạo:** ${createdDate}\n`;
  md += `- **Vai trò tham mưu:** ${session.roleId}\n`;
  if (session.contextArticleTitle) {
    md += `- **Ngữ cảnh bài báo:** "${session.contextArticleTitle}"\n`;
  }
  md += `\n---\n\n`;

  session.messages.forEach((msg, idx) => {
    const senderLabel = msg.sender === 'user' ? '👤 NGƯỜI DÙNG / CHUYÊN VIÊN' : '🤖 TRỢ LÝ AI THAM MƯU CÔNG VỤ';
    md += `### [${idx + 1}] ${senderLabel} (${msg.timestamp})\n\n`;
    md += `${msg.text}\n\n`;
    if (msg.suggestedAction) {
      md += `> ⚡ *Khuyến nghị kích hoạt:* ${msg.actionLabel || msg.suggestedAction}\n\n`;
    }
    md += `---\n\n`;
  });

  md += `*Xuất tự động từ Hệ thống lắng nghe, phân tích tin tức, mạng xã hội BTC vào lúc ${new Date().toLocaleString('vi-VN')}*\n`;
  return md;
}

export function downloadSessionTranscript(session: AdvisorChatSession): void {
  const markdown = exportSessionAsMarkdown(session);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeTitle = session.title.replace(/[^a-zA-Z0-9À-ỹ_ -]/g, '').replace(/\s+/g, '_');
  link.href = url;
  link.download = `BienBan_ThamMuu_${safeTitle}_${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
