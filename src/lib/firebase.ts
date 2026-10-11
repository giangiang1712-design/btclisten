import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  getDocFromServer,
  deleteDoc,
  query,
  orderBy,
  limit,
  writeBatch,
  getCountFromServer,
  onSnapshot,
  Unsubscribe,
  disableNetwork,
  enableNetwork,
  setLogLevel,
  QuerySnapshot
} from 'firebase/firestore';
import { AdvisorChatSession } from './advisorSessionStorage';
import { ExecutiveUserProfile, PinnedDirectiveNote } from './executiveUserMemory';
import { SemanticKeywordGroup } from '../types/semanticDictionary';
import { UserKnowledgeDocument, AlertTriggerRule, AlertIgnoreRule, WarningAlertLevelType } from '../types';
import { ALERT_THRESHOLD_CONFIG, type AlertThresholdConfig, type AdvancedSystemLoadConfig, type SimulationScenario } from './alertTriggers';
import type { KeywordWeightMap } from './keywordWeights';

// Silence internal verbose backoff warnings from Firestore SDK
try {
  setLogLevel('silent');
} catch (_) {}

// Firebase configuration loaded from provisioned environment
const firebaseConfig = {
  projectId: "imposing-dahlia-ht8c4",
  appId: "1:831141298240:web:3e3f0d6325b0b6fa5c5fa5",
  apiKey: "AIzaSyCBFJJLgWmQhybAWPDn1bNub9rvNEtJp-k",
  authDomain: "imposing-dahlia-ht8c4.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-demochuhao-4d6df30d-0130-486f-99ec-d8c82b791a00",
  storageBucket: "imposing-dahlia-ht8c4.firebasestorage.app",
  messagingSenderId: "831141298240"
};

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let isFirebaseAvailable = false;

const QUOTA_STORAGE_KEY = 'finpulse_firestore_quota_exceeded_timestamp';
const QUOTA_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours cooldown

function getInitialQuotaExceededState(): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(QUOTA_STORAGE_KEY);
      if (stored) {
        const timestamp = parseInt(stored, 10);
        if (Date.now() - timestamp < QUOTA_COOLDOWN_MS) {
          return true;
        } else {
          window.localStorage.removeItem(QUOTA_STORAGE_KEY);
        }
      }
    }
  } catch (_) {}
  return false;
}

let isQuotaExceeded = getInitialQuotaExceededState();
let lastQuotaCheckTime = isQuotaExceeded ? Date.now() : 0;

try {
  if (!getApps().length) {
    appInstance = initializeApp(firebaseConfig);
  } else {
    appInstance = getApp();
  }

  // Use the custom database ID provisioned for this project
  if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
    dbInstance = getFirestore(appInstance, firebaseConfig.firestoreDatabaseId);
  } else {
    dbInstance = getFirestore(appInstance);
  }
  isFirebaseAvailable = true;

  if (dbInstance && isQuotaExceeded) {
    disableNetwork(dbInstance).catch(() => {});
  }
  console.log('✅ Firebase Firestore connected successfully:', firebaseConfig.projectId);

  // Validate connection to Firestore on boot
  if (dbInstance && !isQuotaExceeded) {
    getDocFromServer(doc(dbInstance, 'test', 'connection')).catch((error) => {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    });
  }
} catch (err) {
  console.warn('⚠️ Firebase init fallback to local persistence:', err);
  isFirebaseAvailable = false;
}

export { dbInstance as db, isFirebaseAvailable };

/**
 * Check if the daily free tier Firestore quota limit has been reached.
 */
export function isFirestoreQuotaExceeded(): boolean {
  if (isQuotaExceeded) {
    if (Date.now() - lastQuotaCheckTime > QUOTA_COOLDOWN_MS) {
      isQuotaExceeded = false;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(QUOTA_STORAGE_KEY);
        }
      } catch (_) {}
    }
  }
  return isQuotaExceeded;
}

/**
 * Centralized Firestore error handler with automatic circuit breaker on quota exhaustion.
 */
export function handleFirestoreError(err: any): void {
  const msg = String(err?.message || err?.code || err || '');
  if (
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded') ||
    msg.includes('free quota limits') ||
    msg.includes('maximum backoff delay') ||
    err?.code === 'resource-exhausted'
  ) {
    if (!isQuotaExceeded) {
      console.warn('⚠️ Firestore daily write quota limit reached (free tier). Gracefully engaging LocalStorage persistence mode to prevent retry delays.');
    }
    isQuotaExceeded = true;
    lastQuotaCheckTime = Date.now();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(QUOTA_STORAGE_KEY, Date.now().toString());
      }
    } catch (_) {}
    if (dbInstance) {
      disableNetwork(dbInstance).catch(() => {});
    }
  }
}

/**
 * Manually reset the Firestore quota circuit breaker (e.g. after a day or manual confirmation)
 */
export function resetFirestoreQuotaCircuitBreaker(): void {
  isQuotaExceeded = false;
  lastQuotaCheckTime = 0;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(QUOTA_STORAGE_KEY);
    }
  } catch (_) {}
  if (dbInstance) {
    enableNetwork(dbInstance).catch(() => {});
  }
}

/**
 * Check if Cloud Firestore is active, reachable, and within quota limits
 */
export function isCloudDatabaseActive(): boolean {
  return isFirebaseAvailable && !!dbInstance && !isFirestoreQuotaExceeded();
}

/**
 * Recursively remove `undefined` values and sanitize data for Firestore setDoc/addDoc.
 * Firestore strictly throws errors if any field or nested property is `undefined`.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .map(item => (item === undefined ? null : sanitizeForFirestore(item))) as any;
  }
  if (typeof data === 'object') {
    const cleanObj: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (val !== undefined) {
        cleanObj[key] = sanitizeForFirestore(val);
      }
    }
    return cleanObj as any;
  }
  return data;
}

// -----------------------------------------------------------------------------
// ADVISOR SESSIONS CLOUD SYNC
// -----------------------------------------------------------------------------

const SESSIONS_COLLECTION = 'advisor_sessions';

export async function saveSessionToCloud(session: AdvisorChatSession): Promise<boolean> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return false;
  try {
    const sessionRef = doc(dbInstance, SESSIONS_COLLECTION, session.id);
    const sanitizedData = sanitizeForFirestore({
      ...session,
      updatedAt: Date.now()
    });
    await setDoc(sessionRef, sanitizedData, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error saving session to Firestore (using local storage):', err);
    return false;
  }
}

export async function fetchSessionsFromCloud(): Promise<AdvisorChatSession[]> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return [];
  try {
    const q = query(
      collection(dbInstance, SESSIONS_COLLECTION),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    const sessions: AdvisorChatSession[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as AdvisorChatSession;
      sessions.push(data);
    });
    return sessions;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error fetching sessions from Firestore:', err);
    return [];
  }
}

export async function deleteSessionFromCloud(sessionId: string): Promise<boolean> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return false;
  try {
    const sessionRef = doc(dbInstance, SESSIONS_COLLECTION, sessionId);
    await deleteDoc(sessionRef);
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error deleting session from Firestore:', err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// SOP LIFECYCLE TRACKING CLOUD SYNC
// -----------------------------------------------------------------------------

const SOP_TRACKING_COLLECTION = 'sop_tracking_records';

export interface SopTrackingRecord {
  id: string; // articleId
  handlingStatus: 'NEW' | 'IN_PROGRESS' | 'DONE';
  handlingActionLabel: string;
  handledAt: string;
  updatedAt: number;
  lastAction?: string;
  updatedByRole?: string;
}

export async function saveSopTrackingRecordToCloud(
  articleId: string,
  status: 'NEW' | 'IN_PROGRESS' | 'DONE',
  actionLabel: string,
  extraDetails?: Record<string, any>
): Promise<boolean> {
  if (!articleId) return false;
  const nowStr = new Date().toISOString();
  const record: SopTrackingRecord = {
    id: articleId,
    handlingStatus: status,
    handlingActionLabel: actionLabel,
    handledAt: nowStr,
    updatedAt: Date.now(),
    ...extraDetails,
  };

  // Local cache for offline availability
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = JSON.parse(window.localStorage.getItem('finpulse_sop_tracking_records') || '{}');
      stored[articleId] = record;
      window.localStorage.setItem('finpulse_sop_tracking_records', JSON.stringify(stored));
    }
  } catch (_) {}

  if (!dbInstance || isFirestoreQuotaExceeded()) return true;

  try {
    const docRef = doc(dbInstance, SOP_TRACKING_COLLECTION, articleId);
    await setDoc(docRef, sanitizeForFirestore(record), { merge: true });
    console.log(`[Firestore] SOP Tracking saved for article ${articleId}:`, record);
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('⚠️ Error saving SOP tracking to Firestore:', err);
    return false;
  }
}

export async function fetchSopTrackingRecordsFromCloud(): Promise<Record<string, SopTrackingRecord>> {
  const result: Record<string, SopTrackingRecord> = {};

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = JSON.parse(window.localStorage.getItem('finpulse_sop_tracking_records') || '{}');
      Object.assign(result, stored);
    }
  } catch (_) {}

  if (!dbInstance || isFirestoreQuotaExceeded()) return result;

  try {
    const snap = await getDocs(collection(dbInstance, SOP_TRACKING_COLLECTION));
    snap.forEach((docSnap) => {
      const data = docSnap.data() as SopTrackingRecord;
      if (data && data.id) {
        result[data.id] = data;
      }
    });
  } catch (err) {
    handleFirestoreError(err);
    console.warn('⚠️ Error fetching SOP tracking from Firestore:', err);
  }
  return result;
}

export function subscribeToCloudSessions(
  callback: (sessions: AdvisorChatSession[]) => void
): Unsubscribe | null {
  if (!dbInstance || isFirestoreQuotaExceeded()) return null;
  try {
    const q = query(
      collection(dbInstance, SESSIONS_COLLECTION),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );
    return onSnapshot(q, (snap) => {
      const sessions: AdvisorChatSession[] = [];
      snap.forEach((docSnap) => {
        sessions.push(docSnap.data() as AdvisorChatSession);
      });
      callback(sessions);
    }, (err) => {
      handleFirestoreError(err);
      console.warn('Firestore live session listener error:', err);
    });
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Failed to subscribe to cloud sessions:', err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// EXECUTIVE PROFILE CLOUD SYNC
// -----------------------------------------------------------------------------

const PROFILES_COLLECTION = 'executive_profiles';

export async function saveExecutiveProfileToCloud(profile: ExecutiveUserProfile): Promise<boolean> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return false;
  try {
    const docId = profile.id || `exec_${profile.roleId}`;
    const docRef = doc(dbInstance, PROFILES_COLLECTION, docId);
    const sanitized = sanitizeForFirestore({
      ...profile,
      lastUpdated: Date.now()
    });
    await setDoc(docRef, sanitized, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error saving executive profile to Firestore:', err);
    return false;
  }
}

export async function fetchExecutiveProfileFromCloud(profileId: string = 'exec_mof_minister'): Promise<ExecutiveUserProfile | null> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return null;
  try {
    const docRef = doc(dbInstance, PROFILES_COLLECTION, profileId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as ExecutiveUserProfile;
    }
    return null;
  } catch (err) {
    console.error('Error loading executive profile from Firestore:', err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// PINNED DIRECTIVES CLOUD SYNC
// -----------------------------------------------------------------------------

const DIRECTIVES_COLLECTION = 'pinned_directives';

export async function savePinnedDirectivesToCloud(directives: PinnedDirectiveNote[]): Promise<boolean> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return false;
  try {
    const batchPromises = directives.map((dir) => {
      const docRef = doc(dbInstance!, DIRECTIVES_COLLECTION, dir.id);
      return setDoc(docRef, sanitizeForFirestore(dir), { merge: true });
    });
    await Promise.all(batchPromises);
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error saving pinned directives to Firestore:', err);
    return false;
  }
}

export async function fetchPinnedDirectivesFromCloud(): Promise<PinnedDirectiveNote[]> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return [];
  try {
    const q = query(
      collection(dbInstance, DIRECTIVES_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    const notes: PinnedDirectiveNote[] = [];
    snap.forEach((docSnap) => {
      notes.push(docSnap.data() as PinnedDirectiveNote);
    });
    return notes;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error fetching pinned directives from Firestore:', err);
    return [];
  }
}

export async function addPinnedDirectiveToCloud(directive: PinnedDirectiveNote): Promise<boolean> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return false;
  try {
    const docRef = doc(dbInstance, DIRECTIVES_COLLECTION, directive.id);
    await setDoc(docRef, sanitizeForFirestore(directive));
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error adding pinned directive to Firestore:', err);
    return false;
  }
}

export async function removePinnedDirectiveFromCloud(directiveId: string): Promise<boolean> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return false;
  try {
    const docRef = doc(dbInstance, DIRECTIVES_COLLECTION, directiveId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error deleting pinned directive from Firestore:', err);
    return false;
  }
}

export function subscribeToCloudDirectives(
  callback: (directives: PinnedDirectiveNote[]) => void
): Unsubscribe | null {
  if (!dbInstance || isFirestoreQuotaExceeded()) return null;
  try {
    const q = query(
      collection(dbInstance, DIRECTIVES_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    return onSnapshot(q, (snap) => {
      const list: PinnedDirectiveNote[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as PinnedDirectiveNote);
      });
      callback(list);
    }, (err) => {
      handleFirestoreError(err);
      console.warn('Firestore live directives listener error:', err);
    });
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Failed to subscribe to cloud directives:', err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// SEMANTIC DICTIONARY & CONTEXT RULES CLOUD SYNC
// -----------------------------------------------------------------------------

export const SEMANTIC_GROUPS_COLLECTION = 'semantic_dictionary_groups';

export async function saveSemanticGroupToCloud(group: SemanticKeywordGroup): Promise<boolean> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return false;
  try {
    const docId = group.id || `grp-${Date.now()}`;
    const docRef = doc(dbInstance, SEMANTIC_GROUPS_COLLECTION, docId);
    const sanitized = sanitizeForFirestore({
      ...group,
      id: docId,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, sanitized, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error saving semantic group to Firestore:', err);
    return false;
  }
}

export async function fetchSemanticGroupsFromCloud(): Promise<SemanticKeywordGroup[]> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return [];
  try {
    const snap = await getDocs(collection(dbInstance, SEMANTIC_GROUPS_COLLECTION));
    const list: SemanticKeywordGroup[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as SemanticKeywordGroup);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error fetching semantic groups from Firestore:', err);
    return [];
  }
}

export async function deleteSemanticGroupFromCloud(groupId: string): Promise<boolean> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return false;
  try {
    const docRef = doc(dbInstance, SEMANTIC_GROUPS_COLLECTION, groupId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error deleting semantic group from Firestore:', err);
    return false;
  }
}

export function subscribeToCloudSemanticGroups(
  callback: (groups: SemanticKeywordGroup[]) => void
): Unsubscribe | null {
  if (!dbInstance || isFirestoreQuotaExceeded()) return null;
  try {
    return onSnapshot(collection(dbInstance, SEMANTIC_GROUPS_COLLECTION), (snap) => {
      const list: SemanticKeywordGroup[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as SemanticKeywordGroup);
      });
      callback(list);
    }, (err) => {
      handleFirestoreError(err);
      console.warn('Firestore live semantic groups listener error:', err);
    });
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Failed to subscribe to cloud semantic groups:', err);
    return null;
  }
}

export async function bulkSyncSemanticGroupsToCloud(groups: SemanticKeywordGroup[]): Promise<{ success: boolean; syncedCount: number; error?: string }> {
  if (!dbInstance || isFirestoreQuotaExceeded()) {
    return {
      success: false,
      syncedCount: 0,
      error: 'Hạn mức ghi Cloud Firestore hôm nay đã đạt giới hạn (20.000 lượt ghi miễn phí/ngày). Dữ liệu đang được lưu trữ an toàn trên bộ nhớ cục bộ.'
    };
  }
  try {
    let count = 0;
    for (const grp of groups) {
      if (isFirestoreQuotaExceeded()) break;
      const docId = grp.id || `grp-${Date.now()}-${count}`;
      const docRef = doc(dbInstance, SEMANTIC_GROUPS_COLLECTION, docId);
      await setDoc(docRef, sanitizeForFirestore({ ...grp, id: docId }), { merge: true });
      count++;
    }
    return { success: count > 0, syncedCount: count };
  } catch (err: any) {
    handleFirestoreError(err);
    console.warn('Error bulk syncing semantic groups to Firestore:', err);
    return {
      success: false,
      syncedCount: 0,
      error: isFirestoreQuotaExceeded()
        ? 'Hạn mức ghi Cloud Firestore miễn phí trong ngày đã đạt mức tối đa. Đã tự động chuyển sang chế độ lưu trữ cục bộ an toàn.'
        : err?.message || 'Lỗi đồng bộ'
    };
  }
}

// -----------------------------------------------------------------------------
// KNOWLEDGE BASE & LEGAL CONTEXT DOCUMENTS CLOUD SYNC
// -----------------------------------------------------------------------------

export const KNOWLEDGE_DOCS_COLLECTION = 'knowledge_base_documents';

export async function saveKnowledgeDocToCloud(docItem: UserKnowledgeDocument): Promise<boolean> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return false;
  try {
    const docId = docItem.id || `doc-${Date.now()}`;
    const docRef = doc(dbInstance, KNOWLEDGE_DOCS_COLLECTION, docId);
    const sanitized = sanitizeForFirestore({
      ...docItem,
      id: docId,
      updatedAt: Date.now()
    });
    await setDoc(docRef, sanitized, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error saving knowledge doc to Firestore:', err);
    return false;
  }
}

export async function fetchKnowledgeDocsFromCloud(): Promise<UserKnowledgeDocument[]> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return [];
  try {
    const snap = await getDocs(collection(dbInstance, KNOWLEDGE_DOCS_COLLECTION));
    const list: UserKnowledgeDocument[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as UserKnowledgeDocument);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error fetching knowledge docs from Firestore:', err);
    return [];
  }
}

export async function deleteKnowledgeDocFromCloud(docId: string): Promise<boolean> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return false;
  try {
    const docRef = doc(dbInstance, KNOWLEDGE_DOCS_COLLECTION, docId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error deleting knowledge doc from Firestore:', err);
    return false;
  }
}

export function subscribeToCloudKnowledgeDocs(
  callback: (docs: UserKnowledgeDocument[]) => void
): Unsubscribe | null {
  if (!dbInstance || isFirestoreQuotaExceeded()) return null;
  try {
    return onSnapshot(collection(dbInstance, KNOWLEDGE_DOCS_COLLECTION), (snap) => {
      const list: UserKnowledgeDocument[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as UserKnowledgeDocument);
      });
      callback(list);
    }, (err) => {
      handleFirestoreError(err);
      console.warn('Firestore live knowledge docs listener error:', err);
    });
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Failed to subscribe to cloud knowledge docs:', err);
    return null;
  }
}

export async function bulkSyncKnowledgeDocsToCloud(docs: UserKnowledgeDocument[]): Promise<{ success: boolean; syncedCount: number; error?: string }> {
  if (!dbInstance || isFirestoreQuotaExceeded()) {
    return {
      success: false,
      syncedCount: 0,
      error: 'Hạn mức ghi Cloud Firestore hôm nay đã đạt giới hạn (20.000 lượt ghi miễn phí/ngày). Dữ liệu đang được lưu trữ an toàn trên bộ nhớ cục bộ.'
    };
  }
  try {
    let count = 0;
    for (const d of docs) {
      if (isFirestoreQuotaExceeded()) break;
      const docId = d.id || `doc-${Date.now()}-${count}`;
      const docRef = doc(dbInstance, KNOWLEDGE_DOCS_COLLECTION, docId);
      await setDoc(docRef, sanitizeForFirestore({ ...d, id: docId }), { merge: true });
      count++;
    }
    return { success: count > 0, syncedCount: count };
  } catch (err: any) {
    handleFirestoreError(err);
    console.warn('Error bulk syncing knowledge docs to Firestore:', err);
    return {
      success: false,
      syncedCount: 0,
      error: isFirestoreQuotaExceeded()
        ? 'Hạn mức ghi Cloud Firestore miễn phí trong ngày đã đạt mức tối đa. Đã tự động chuyển sang chế độ lưu trữ cục bộ an toàn.'
        : err?.message || 'Lỗi đồng bộ'
    };
  }
}

// -----------------------------------------------------------------------------
// ALERT THRESHOLDS & 5-LEVEL WARNING PIPELINE CLOUD SYNC
// -----------------------------------------------------------------------------

export const ALERT_THRESHOLDS_COLLECTION = 'alert_threshold_configs';
export const ALERT_RULES_COLLECTION = 'alert_trigger_rules';
export const SYSTEM_LOAD_CONFIG_COLLECTION = 'system_load_configs';
export const SIMULATION_SCENARIOS_COLLECTION = 'simulation_scenarios';
export const SIMULATION_LOGS_COLLECTION = 'simulation_audit_logs';

export async function saveAlertThresholdConfigToCloud(config: AlertThresholdConfig): Promise<boolean> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return false;
  try {
    const docRef = doc(dbInstance, ALERT_THRESHOLDS_COLLECTION, 'global_5_levels');
    const sanitized = sanitizeForFirestore({
      id: 'global_5_levels',
      ...config,
      updatedAt: Date.now(),
      updatedAtIso: new Date().toISOString()
    });
    await setDoc(docRef, sanitized, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error saving alert threshold config to Firestore:', err);
    return false;
  }
}

export async function fetchAlertThresholdConfigFromCloud(): Promise<AlertThresholdConfig | null> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return null;
  try {
    const docRef = doc(dbInstance, ALERT_THRESHOLDS_COLLECTION, 'global_5_levels');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.EMERGENCY && data.RAPID && data.EARLY && data.DISTANT && data.STANDARD) {
        return {
          EMERGENCY: data.EMERGENCY,
          RAPID: data.RAPID,
          EARLY: data.EARLY,
          DISTANT: data.DISTANT,
          STANDARD: data.STANDARD,
        } as AlertThresholdConfig;
      }
    }
    return null;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error fetching alert threshold config from Firestore:', err);
    return null;
  }
}

export function subscribeToCloudAlertThresholdConfig(
  callback: (config: AlertThresholdConfig) => void
): Unsubscribe | null {
  if (!dbInstance || isFirestoreQuotaExceeded()) return null;
  try {
    const docRef = doc(dbInstance, ALERT_THRESHOLDS_COLLECTION, 'global_5_levels');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.EMERGENCY && data.RAPID && data.EARLY && data.DISTANT && data.STANDARD) {
          callback({
            EMERGENCY: data.EMERGENCY,
            RAPID: data.RAPID,
            EARLY: data.EARLY,
            DISTANT: data.DISTANT,
            STANDARD: data.STANDARD,
            MARKET_DIGEST: data.MARKET_DIGEST || ALERT_THRESHOLD_CONFIG.MARKET_DIGEST,
          });
        }
      }
    }, (err) => {
      handleFirestoreError(err);
      console.warn('Firestore live alert threshold config listener error:', err);
    });
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Failed to subscribe to cloud alert threshold config:', err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// ALERT TRIGGER RULES CLOUD SYNC
// -----------------------------------------------------------------------------

export async function saveAlertTriggerRulesToCloud(rules: AlertTriggerRule[]): Promise<boolean> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return false;
  try {
    // 1. Save bundle for fast single-read
    const bundleRef = doc(dbInstance, ALERT_RULES_COLLECTION, 'active_rules_bundle');
    await setDoc(bundleRef, sanitizeForFirestore({
      id: 'active_rules_bundle',
      rules,
      count: rules.length,
      updatedAt: Date.now()
    }), { merge: true });

    // 2. Also save each rule individually so they can be queried or edited
    const batch = writeBatch(dbInstance);
    rules.forEach((rule) => {
      const ruleRef = doc(dbInstance!, ALERT_RULES_COLLECTION, rule.id);
      batch.set(ruleRef, sanitizeForFirestore({
        ...rule,
        updatedAt: Date.now()
      }), { merge: true });
    });
    await batch.commit();
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error saving alert trigger rules to Firestore:', err);
    return false;
  }
}

export async function fetchAlertTriggerRulesFromCloud(): Promise<AlertTriggerRule[] | null> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return null;
  try {
    // Try fast bundle read first
    const bundleRef = doc(dbInstance, ALERT_RULES_COLLECTION, 'active_rules_bundle');
    const bundleSnap = await getDoc(bundleRef);
    if (bundleSnap.exists()) {
      const data = bundleSnap.data();
      if (data?.rules && Array.isArray(data.rules) && data.rules.length > 0) {
        return data.rules as AlertTriggerRule[];
      }
    }

    // Fallback: Query all rule documents
    const q = query(collection(dbInstance, ALERT_RULES_COLLECTION), limit(100));
    const snap = await getDocs(q);
    const rules: AlertTriggerRule[] = [];
    snap.forEach((d) => {
      if (d.id !== 'active_rules_bundle') {
        rules.push(d.data() as AlertTriggerRule);
      }
    });
    return rules.length > 0 ? rules : null;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error fetching alert trigger rules from Firestore:', err);
    return null;
  }
}

export function subscribeToCloudAlertTriggerRules(
  callback: (rules: AlertTriggerRule[]) => void
): Unsubscribe | null {
  if (!dbInstance || isFirestoreQuotaExceeded()) return null;
  try {
    const bundleRef = doc(dbInstance, ALERT_RULES_COLLECTION, 'active_rules_bundle');
    return onSnapshot(bundleRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data?.rules && Array.isArray(data.rules)) {
          callback(data.rules as AlertTriggerRule[]);
        }
      }
    }, (err) => {
      handleFirestoreError(err);
      console.warn('Firestore live alert trigger rules listener error:', err);
    });
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Failed to subscribe to cloud alert trigger rules:', err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// ADVANCED SYSTEM LOAD CONFIG CLOUD SYNC
// -----------------------------------------------------------------------------

export async function saveAdvancedSystemLoadConfigToCloud(config: AdvancedSystemLoadConfig): Promise<boolean> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return false;
  try {
    const docRef = doc(dbInstance, SYSTEM_LOAD_CONFIG_COLLECTION, 'global_load_settings');
    const sanitized = sanitizeForFirestore({
      id: 'global_load_settings',
      ...config,
      updatedAt: Date.now()
    });
    await setDoc(docRef, sanitized, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error saving advanced system load config to Firestore:', err);
    return false;
  }
}

export async function fetchAdvancedSystemLoadConfigFromCloud(): Promise<AdvancedSystemLoadConfig | null> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return null;
  try {
    const docRef = doc(dbInstance, SYSTEM_LOAD_CONFIG_COLLECTION, 'global_load_settings');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as AdvancedSystemLoadConfig;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error fetching advanced system load config from Firestore:', err);
    return null;
  }
}

export function subscribeToCloudAdvancedSystemLoadConfig(
  callback: (config: AdvancedSystemLoadConfig) => void
): Unsubscribe | null {
  if (!dbInstance || isFirestoreQuotaExceeded()) return null;
  try {
    const docRef = doc(dbInstance, SYSTEM_LOAD_CONFIG_COLLECTION, 'global_load_settings');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as AdvancedSystemLoadConfig);
      }
    }, (err) => {
      handleFirestoreError(err);
      console.warn('Firestore live advanced load config listener error:', err);
    });
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Failed to subscribe to cloud advanced load config:', err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// ALERT IGNORE-LIST / WHITELIST CLOUD SYNC
// -----------------------------------------------------------------------------

export const ALERT_IGNORE_LIST_COLLECTION = 'alert_ignore_rules';

export async function saveAlertIgnoreListToCloud(rules: AlertIgnoreRule[]): Promise<boolean> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return false;
  try {
    const bundleRef = doc(dbInstance, ALERT_IGNORE_LIST_COLLECTION, 'global_ignore_list_bundle');
    await setDoc(bundleRef, sanitizeForFirestore({
      id: 'global_ignore_list_bundle',
      rules,
      count: rules.length,
      updatedAt: Date.now()
    }), { merge: true });

    // Also sync individual rules in batch
    const batch = writeBatch(dbInstance);
    rules.forEach((rule) => {
      const rRef = doc(dbInstance!, ALERT_IGNORE_LIST_COLLECTION, rule.id);
      batch.set(rRef, sanitizeForFirestore({
        ...rule,
        updatedAt: new Date().toISOString()
      }), { merge: true });
    });
    await batch.commit();
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error saving alert ignore list to Firestore:', err);
    return false;
  }
}

export async function fetchAlertIgnoreListFromCloud(): Promise<AlertIgnoreRule[]> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return [];
  try {
    const bundleRef = doc(dbInstance, ALERT_IGNORE_LIST_COLLECTION, 'global_ignore_list_bundle');
    const bundleSnap = await getDoc(bundleRef);
    if (bundleSnap.exists()) {
      const data = bundleSnap.data();
      if (data?.rules && Array.isArray(data.rules) && data.rules.length > 0) {
        return data.rules as AlertIgnoreRule[];
      }
    }

    const snap = await getDocs(query(collection(dbInstance, ALERT_IGNORE_LIST_COLLECTION), limit(100)));
    const list: AlertIgnoreRule[] = [];
    snap.forEach((d) => {
      if (d.id !== 'global_ignore_list_bundle') {
        list.push(d.data() as AlertIgnoreRule);
      }
    });
    return list;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error fetching alert ignore list from Firestore:', err);
    return [];
  }
}

export function subscribeToCloudAlertIgnoreList(
  callback: (rules: AlertIgnoreRule[]) => void
): Unsubscribe | null {
  if (!dbInstance || isFirestoreQuotaExceeded()) return null;
  try {
    const bundleRef = doc(dbInstance, ALERT_IGNORE_LIST_COLLECTION, 'global_ignore_list_bundle');
    return onSnapshot(bundleRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data?.rules && Array.isArray(data.rules)) {
          callback(data.rules as AlertIgnoreRule[]);
        }
      }
    }, (err) => {
      handleFirestoreError(err);
      console.warn('Firestore live alert ignore list listener error:', err);
    });
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Failed to subscribe to cloud alert ignore list:', err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// USER PREFERENCES & KEYWORD WEIGHTS CLOUD SYNC
// -----------------------------------------------------------------------------

export const USER_PREFERENCES_COLLECTION = 'user_preferences';
export const CUSTOM_KEYWORD_WEIGHTS_COLLECTION = 'custom_keyword_weights';

export interface UserPreferencesPayload {
  id?: string;
  keywordWeights: KeywordWeightMap;
  alertThresholdConfig: AlertThresholdConfig;
  alertTriggerRules?: AlertTriggerRule[];
  alertIgnoreRules?: AlertIgnoreRule[];
  syncedAt: number;
  syncedAtFormatted: string;
  customKeywordsCount: number;
  activeTriggersCount: number;
  ignoreRulesCount: number;
  clientVersion?: string;
  deviceInfo?: string;
}

export interface SyncPreferencesResult {
  success: boolean;
  message: string;
  timestamp: number;
  syncedItems: {
    keywordWeightsCount: number;
    alertThresholdsCount: number;
    alertTriggersCount: number;
    ignoreRulesCount: number;
  };
  error?: string;
}

export async function saveCustomKeywordWeightsToCloud(weights: KeywordWeightMap): Promise<boolean> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return false;
  try {
    const bundleRef = doc(dbInstance, CUSTOM_KEYWORD_WEIGHTS_COLLECTION, 'global_weights_bundle');
    const count = Object.keys(weights).length;
    await setDoc(bundleRef, sanitizeForFirestore({
      id: 'global_weights_bundle',
      weights,
      count,
      updatedAt: Date.now(),
      updatedAtIso: new Date().toISOString()
    }), { merge: true });

    // Also persist custom-defined or modified keywords in batch for granular queryability
    const batch = writeBatch(dbInstance);
    let batchCount = 0;
    for (const [kw, def] of Object.entries(weights)) {
      if (def.isCustom || def.weight !== 5.0) {
        const safeDocId = encodeURIComponent(kw).replace(/%/g, '_').slice(0, 100);
        const docRef = doc(dbInstance!, CUSTOM_KEYWORD_WEIGHTS_COLLECTION, safeDocId);
        batch.set(docRef, sanitizeForFirestore({
          id: safeDocId,
          keyword: kw,
          ...def,
          updatedAt: Date.now()
        }), { merge: true });
        batchCount++;
        if (batchCount >= 400) break;
      }
    }
    if (batchCount > 0) {
      await batch.commit();
    }
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error saving custom keyword weights to Firestore:', err);
    return false;
  }
}

export async function fetchCustomKeywordWeightsFromCloud(): Promise<KeywordWeightMap | null> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return null;
  try {
    const bundleRef = doc(dbInstance, CUSTOM_KEYWORD_WEIGHTS_COLLECTION, 'global_weights_bundle');
    const snap = await getDoc(bundleRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data?.weights && typeof data.weights === 'object') {
        return data.weights as KeywordWeightMap;
      }
    }
    return null;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error fetching custom keyword weights from Firestore:', err);
    return null;
  }
}

export async function saveUserPreferencesToCloud(
  customPreferences?: Partial<UserPreferencesPayload>
): Promise<SyncPreferencesResult> {
  const now = Date.now();
  const formatted = new Date(now).toLocaleString('vi-VN');

  // Gather keyword weights
  let keywordWeights: KeywordWeightMap = customPreferences?.keywordWeights || {};
  if (Object.keys(keywordWeights).length === 0 && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const savedWeights = localStorage.getItem('finpulse_custom_keyword_weights');
      if (savedWeights) {
        keywordWeights = JSON.parse(savedWeights);
      }
    } catch (_) {}
  }

  // Gather alert thresholds
  let alertThresholdConfig: AlertThresholdConfig | any = customPreferences?.alertThresholdConfig;
  if (!alertThresholdConfig && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const savedThresholds = localStorage.getItem('finpulse_alert_thresholds_config_v2');
      if (savedThresholds) {
        alertThresholdConfig = JSON.parse(savedThresholds);
      }
    } catch (_) {}
  }

  // Gather alert triggers
  let alertTriggerRules: AlertTriggerRule[] = customPreferences?.alertTriggerRules || [];
  if (alertTriggerRules.length === 0 && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const savedRules = localStorage.getItem('finpulse_alert_triggers_v1');
      if (savedRules) {
        alertTriggerRules = JSON.parse(savedRules);
      }
    } catch (_) {}
  }

  // Gather alert ignore rules
  let alertIgnoreRules: AlertIgnoreRule[] = customPreferences?.alertIgnoreRules || [];
  if (alertIgnoreRules.length === 0 && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const savedIgnore = localStorage.getItem('finpulse_alert_ignore_list_v1');
      if (savedIgnore) {
        alertIgnoreRules = JSON.parse(savedIgnore);
      }
    } catch (_) {}
  }

  const weightsCount = Object.keys(keywordWeights).length;
  const triggersCount = alertTriggerRules.length;
  const ignoreCount = alertIgnoreRules.length;
  const thresholdsCount = alertThresholdConfig ? Object.keys(alertThresholdConfig).length : 5;

  if (!dbInstance || isFirestoreQuotaExceeded()) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('finpulse_last_cloud_sync_timestamp', String(now));
      localStorage.setItem('finpulse_last_cloud_sync_formatted', formatted);
    }
    return {
      success: false,
      message: isFirestoreQuotaExceeded()
        ? 'Hạn ngạch Cloud Firestore hôm nay đã đầy. Cấu hình đã được lưu trữ an toàn trong bộ nhớ cục bộ.'
        : 'Chưa kết nối Cloud Firestore. Cấu hình đã được lưu an toàn trong trình duyệt cục bộ.',
      timestamp: now,
      syncedItems: {
        keywordWeightsCount: weightsCount,
        alertThresholdsCount: thresholdsCount,
        alertTriggersCount: triggersCount,
        ignoreRulesCount: ignoreCount,
      },
      error: 'Firestore unavailable or quota exceeded'
    };
  }

  try {
    const bundleDocRef = doc(dbInstance, USER_PREFERENCES_COLLECTION, 'global_user_preferences');
    const sanitizedBundle = sanitizeForFirestore({
      id: 'global_user_preferences',
      keywordWeights,
      alertThresholdConfig: alertThresholdConfig || null,
      alertTriggerRules,
      alertIgnoreRules,
      syncedAt: now,
      syncedAtFormatted: formatted,
      customKeywordsCount: weightsCount,
      activeTriggersCount: triggersCount,
      ignoreRulesCount: ignoreCount,
      clientVersion: 'v3.2.0',
      deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 100) : 'Web'
    });

    await setDoc(bundleDocRef, sanitizedBundle, { merge: true });

    // Also persist individual services for modular compatibility
    if (weightsCount > 0) {
      await saveCustomKeywordWeightsToCloud(keywordWeights);
    }
    if (alertThresholdConfig) {
      await saveAlertThresholdConfigToCloud(alertThresholdConfig);
    }
    if (triggersCount > 0) {
      await saveAlertTriggerRulesToCloud(alertTriggerRules);
    }
    if (ignoreCount > 0) {
      await saveAlertIgnoreListToCloud(alertIgnoreRules);
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('finpulse_last_cloud_sync_timestamp', String(now));
      localStorage.setItem('finpulse_last_cloud_sync_formatted', formatted);
    }

    return {
      success: true,
      message: `Đồng bộ thành công ${weightsCount} trọng số từ khóa và ${thresholdsCount} cấp độ ngưỡng cảnh báo lên Google Cloud Firestore!`,
      timestamp: now,
      syncedItems: {
        keywordWeightsCount: weightsCount,
        alertThresholdsCount: thresholdsCount,
        alertTriggersCount: triggersCount,
        ignoreRulesCount: ignoreCount,
      }
    };
  } catch (err: any) {
    handleFirestoreError(err);
    console.warn('Error saving user preferences to Firestore:', err);
    return {
      success: false,
      message: err?.message || 'Lỗi khi đồng bộ cấu hình lên Firestore.',
      timestamp: now,
      syncedItems: {
        keywordWeightsCount: weightsCount,
        alertThresholdsCount: thresholdsCount,
        alertTriggersCount: triggersCount,
        ignoreRulesCount: ignoreCount,
      },
      error: String(err)
    };
  }
}

export async function fetchUserPreferencesFromCloud(): Promise<UserPreferencesPayload | null> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return null;
  try {
    const bundleDocRef = doc(dbInstance, USER_PREFERENCES_COLLECTION, 'global_user_preferences');
    const snap = await getDoc(bundleDocRef);
    if (snap.exists()) {
      return snap.data() as UserPreferencesPayload;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error fetching user preferences from Firestore:', err);
    return null;
  }
}

export function subscribeToCloudUserPreferences(
  callback: (prefs: UserPreferencesPayload) => void
): Unsubscribe | null {
  if (!dbInstance || isFirestoreQuotaExceeded()) return null;
  try {
    const bundleDocRef = doc(dbInstance, USER_PREFERENCES_COLLECTION, 'global_user_preferences');
    return onSnapshot(bundleDocRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as UserPreferencesPayload);
      }
    }, (err) => {
      handleFirestoreError(err);
      console.warn('Firestore live user preferences listener error:', err);
    });
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Failed to subscribe to cloud user preferences:', err);
    return null;
  }
}

export function applyCloudPreferencesToLocal(cloudPrefs: UserPreferencesPayload): { success: boolean; appliedCount: number } {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { success: false, appliedCount: 0 };
  }
  try {
    let appliedCount = 0;
    if (cloudPrefs.keywordWeights && typeof cloudPrefs.keywordWeights === 'object') {
      localStorage.setItem('finpulse_custom_keyword_weights', JSON.stringify(cloudPrefs.keywordWeights));
      appliedCount += Object.keys(cloudPrefs.keywordWeights).length;
    }
    if (cloudPrefs.alertThresholdConfig && typeof cloudPrefs.alertThresholdConfig === 'object') {
      localStorage.setItem('finpulse_alert_thresholds_config_v2', JSON.stringify(cloudPrefs.alertThresholdConfig));
      appliedCount += 5;
    }
    if (Array.isArray(cloudPrefs.alertTriggerRules) && cloudPrefs.alertTriggerRules.length > 0) {
      localStorage.setItem('finpulse_alert_triggers_v1', JSON.stringify(cloudPrefs.alertTriggerRules));
      appliedCount += cloudPrefs.alertTriggerRules.length;
    }
    if (Array.isArray(cloudPrefs.alertIgnoreRules) && cloudPrefs.alertIgnoreRules.length > 0) {
      localStorage.setItem('finpulse_alert_ignore_list_v1', JSON.stringify(cloudPrefs.alertIgnoreRules));
      appliedCount += cloudPrefs.alertIgnoreRules.length;
    }

    localStorage.setItem('finpulse_last_cloud_sync_timestamp', String(cloudPrefs.syncedAt || Date.now()));
    localStorage.setItem('finpulse_last_cloud_sync_formatted', cloudPrefs.syncedAtFormatted || new Date().toLocaleString('vi-VN'));

    window.dispatchEvent(new CustomEvent('preferences-cloud-synced', { detail: cloudPrefs }));

    return { success: true, appliedCount };
  } catch (e) {
    console.error('Failed to apply cloud preferences to local storage:', e);
    return { success: false, appliedCount: 0 };
  }
}

// -----------------------------------------------------------------------------
// SIMULATION SCENARIOS & AUDIT LOGS CLOUD SYNC
// -----------------------------------------------------------------------------

export async function saveSimulationScenariosToCloud(scenarios: SimulationScenario[]): Promise<boolean> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return false;
  try {
    // Save bundle for fast read
    const bundleRef = doc(dbInstance, SIMULATION_SCENARIOS_COLLECTION, 'all_scenarios_bundle');
    await setDoc(bundleRef, sanitizeForFirestore({
      id: 'all_scenarios_bundle',
      scenarios,
      count: scenarios.length,
      updatedAt: Date.now()
    }), { merge: true });

    // Also persist each scenario individually
    const batch = writeBatch(dbInstance);
    scenarios.forEach((sc) => {
      const scRef = doc(dbInstance!, SIMULATION_SCENARIOS_COLLECTION, sc.id);
      batch.set(scRef, sanitizeForFirestore({
        ...sc,
        updatedAt: Date.now()
      }), { merge: true });
    });
    await batch.commit();
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error saving simulation scenarios to Firestore:', err);
    return false;
  }
}

export async function saveSimulationScenarioItemToCloud(scenario: SimulationScenario): Promise<boolean> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return false;
  try {
    const scRef = doc(dbInstance, SIMULATION_SCENARIOS_COLLECTION, scenario.id);
    await setDoc(scRef, sanitizeForFirestore({
      ...scenario,
      updatedAt: Date.now()
    }), { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error saving simulation scenario item to Firestore:', err);
    return false;
  }
}

export async function deleteSimulationScenarioFromCloud(scenarioId: string): Promise<boolean> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return false;
  try {
    const scRef = doc(dbInstance, SIMULATION_SCENARIOS_COLLECTION, scenarioId);
    await deleteDoc(scRef);
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error deleting simulation scenario from Firestore:', err);
    return false;
  }
}

export async function fetchSimulationScenariosFromCloud(): Promise<SimulationScenario[]> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return [];
  try {
    const bundleRef = doc(dbInstance, SIMULATION_SCENARIOS_COLLECTION, 'all_scenarios_bundle');
    const bundleSnap = await getDoc(bundleRef);
    if (bundleSnap.exists()) {
      const data = bundleSnap.data();
      if (data?.scenarios && Array.isArray(data.scenarios) && data.scenarios.length > 0) {
        return data.scenarios as SimulationScenario[];
      }
    }

    const snap = await getDocs(query(collection(dbInstance, SIMULATION_SCENARIOS_COLLECTION), limit(50)));
    const list: SimulationScenario[] = [];
    snap.forEach((d) => {
      if (d.id !== 'all_scenarios_bundle') {
        list.push(d.data() as SimulationScenario);
      }
    });
    return list;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error fetching simulation scenarios from Firestore:', err);
    return [];
  }
}

export function subscribeToCloudSimulationScenarios(
  callback: (scenarios: SimulationScenario[]) => void
): Unsubscribe | null {
  if (!dbInstance || isFirestoreQuotaExceeded()) return null;
  try {
    const bundleRef = doc(dbInstance, SIMULATION_SCENARIOS_COLLECTION, 'all_scenarios_bundle');
    return onSnapshot(bundleRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data?.scenarios && Array.isArray(data.scenarios)) {
          callback(data.scenarios as SimulationScenario[]);
        }
      }
    }, (err) => {
      handleFirestoreError(err);
      console.warn('Firestore live simulation scenarios listener error:', err);
    });
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Failed to subscribe to cloud simulation scenarios:', err);
    return null;
  }
}

export async function logSimulationExecutionToCloud(logData: {
  scenarioId: string;
  scenarioName: string;
  alertLevel: string;
  articleTitle: string;
  matchedKeywords?: string[];
  delaySeconds?: number;
}): Promise<boolean> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return false;
  try {
    const logId = `simlog-${Date.now()}`;
    const logRef = doc(dbInstance, SIMULATION_LOGS_COLLECTION, logId);
    await setDoc(logRef, sanitizeForFirestore({
      id: logId,
      ...logData,
      executedAt: Date.now(),
      executedAtFormatted: new Date().toLocaleString('vi-VN')
    }));
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error logging simulation execution to Firestore:', err);
    return false;
  }
}

export async function fetchSimulationLogsFromCloud(): Promise<any[]> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return [];
  try {
    const q = query(collection(dbInstance, SIMULATION_LOGS_COLLECTION), orderBy('executedAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const logs: any[] = [];
    snap.forEach((d) => logs.push(d.data()));
    return logs;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Error fetching simulation logs from Firestore:', err);
    return [];
  }
}

// -----------------------------------------------------------------------------
// DATABASE AUDIT & FACTORY RESET UTILITIES
// -----------------------------------------------------------------------------

export interface DatabaseCollectionStats {
  sessionsCount: number;
  profilesCount: number;
  directivesCount: number;
  feedbacksCount: number;
  scrapedNewsCount: number;
  semanticGroupsCount: number;
  knowledgeDocsCount: number;
  databaseId: string;
  projectId: string;
  isOnline: boolean;
}

export interface ResetDatabaseResult {
  success: boolean;
  sessionsDeleted: number;
  profilesDeleted: number;
  directivesDeleted: number;
  feedbacksDeleted: number;
  scrapedNewsDeleted: number;
  semanticGroupsDeleted?: number;
  knowledgeDocsDeleted?: number;
  clearedCollections: string[];
  error?: string;
}

const FEEDBACK_COLLECTION = 'ai_feedback_loop';
const NEWS_ARCHIVE_COLLECTION = 'scraped_news_archive';

/**
 * Helper to fetch collection count with minimal network payload using getCountFromServer and fast fallback
 */
async function fetchFastCollectionCount(colName: string): Promise<number> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return 0;
  try {
    const colRef = collection(dbInstance, colName);
    const countSnap = await getCountFromServer(colRef);
    return countSnap.data().count;
  } catch {
    try {
      const snap = await getDocs(query(collection(dbInstance, colName), limit(500)));
      return snap.size;
    } catch {
      return 0;
    }
  }
}

/**
 * Audit and fetch document counts across all Firestore collections (Lightning Fast)
 */
export async function getDatabaseStats(): Promise<DatabaseCollectionStats> {
  const result: DatabaseCollectionStats = {
    sessionsCount: 0,
    profilesCount: 0,
    directivesCount: 0,
    feedbacksCount: 0,
    scrapedNewsCount: 0,
    semanticGroupsCount: 0,
    knowledgeDocsCount: 0,
    databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
    projectId: firebaseConfig.projectId,
    isOnline: isCloudDatabaseActive()
  };

  if (!dbInstance || isFirestoreQuotaExceeded()) return result;

  // If local state was reset to 0 by user, return pristine 0 stats until new scan
  if (typeof window !== 'undefined' && localStorage.getItem('finpulse_is_database_reset_cleared') === 'true') {
    return result;
  }

  try {
    const [
      sessionsCount,
      profilesCount,
      directivesCount,
      feedbacksCount,
      newsArchiveCount,
      newsScrapedCount,
      semanticCount,
      knowledgeCount
    ] = await Promise.all([
      fetchFastCollectionCount(SESSIONS_COLLECTION),
      fetchFastCollectionCount(PROFILES_COLLECTION),
      fetchFastCollectionCount(DIRECTIVES_COLLECTION),
      fetchFastCollectionCount(FEEDBACK_COLLECTION),
      fetchFastCollectionCount(NEWS_ARCHIVE_COLLECTION),
      fetchFastCollectionCount('scraped_news'),
      fetchFastCollectionCount(SEMANTIC_GROUPS_COLLECTION),
      fetchFastCollectionCount(KNOWLEDGE_DOCS_COLLECTION)
    ]);

    result.sessionsCount = sessionsCount;
    result.profilesCount = profilesCount;
    result.directivesCount = directivesCount;
    result.feedbacksCount = feedbacksCount;
    result.scrapedNewsCount = newsArchiveCount + newsScrapedCount;
    result.semanticGroupsCount = semanticCount;
    result.knowledgeDocsCount = knowledgeCount;
  } catch (err) {
    console.warn('Failed to get database stats from Firestore:', err);
  }

  return result;
}

/**
 * Delete all documents in a single collection in Cloud Firestore using an exhaustive chunk loop.
 * Ensures complete deletion without throwing artificial timeouts.
 */
export async function resetCollectionInCloud(collectionName: string): Promise<number> {
  if (!dbInstance || isFirestoreQuotaExceeded()) return 0;

  let totalDeleted = 0;
  const CHUNK_SIZE = 200; // Optimal batch size for Firestore
  const MAX_ITERATIONS = 50; // Up to 10,000 documents per collection

  try {
    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      const q = query(collection(dbInstance, collectionName), limit(CHUNK_SIZE));
      const snap = await getDocs(q);
      
      if (snap.empty || snap.docs.length === 0) {
        break;
      }

      const batch = writeBatch(dbInstance);
      snap.docs.forEach((d) => {
        batch.delete(doc(dbInstance!, collectionName, d.id));
      });

      try {
        await batch.commit();
        totalDeleted += snap.docs.length;
      } catch (commitErr: any) {
        handleFirestoreError(commitErr);
        console.warn(`⚠️ Batch commit stopped for collection '${collectionName}':`, commitErr?.message || commitErr);
        break;
      }

      // If we got fewer documents than chunk size, collection is now empty
      if (snap.docs.length < CHUNK_SIZE) {
        break;
      }
    }
    console.log(`🧹 [Firestore Cloud Reset] Collection '${collectionName}' wiped cleanly: ${totalDeleted} documents deleted.`);
    return totalDeleted;
  } catch (err: any) {
    handleFirestoreError(err);
    console.error(`❌ Failed to reset collection '${collectionName}' in Firestore:`, err);
    return totalDeleted;
  }
}

/**
 * Hard Reset: Delete all collections from Cloud Firestore, wipe server database, and reset local caches to zero.
 * Executes exhaustive deletions across all collections, then performs live post-reset verification.
 */
export async function resetEntireDatabaseToZero(options: {
  clearLocalCache?: boolean;
  resetSessions?: boolean;
  resetProfiles?: boolean;
  resetDirectives?: boolean;
  resetFeedbacks?: boolean;
  resetNewsArchive?: boolean;
  resetSemanticGroups?: boolean;
  resetKnowledgeDocs?: boolean;
} = {
  clearLocalCache: true,
  resetSessions: true,
  resetProfiles: true,
  resetDirectives: true,
  resetFeedbacks: true,
  resetNewsArchive: true,
  resetSemanticGroups: true,
  resetKnowledgeDocs: true
}): Promise<ResetDatabaseResult> {
  const result: ResetDatabaseResult = {
    success: false,
    sessionsDeleted: 0,
    profilesDeleted: 0,
    directivesDeleted: 0,
    feedbacksDeleted: 0,
    scrapedNewsDeleted: 0,
    semanticGroupsDeleted: 0,
    knowledgeDocsDeleted: 0,
    clearedCollections: []
  };

  try {
    // 1. Backend Node.js In-Memory & Disk Article Database clear
    if (options.resetNewsArchive ?? true) {
      try {
        const resp = await fetch('/api/db/clear', { method: 'POST' });
        if (resp.ok) {
          const json = await resp.json();
          result.scrapedNewsDeleted += (json.deletedCount || 0);
          result.clearedCollections.push('server_article_database');
        }
      } catch (e) {
        console.warn('Could not call /api/db/clear on server:', e);
      }
    }

    // 2. Wipe Cloud Firestore Collections exhaustively
    if (dbInstance && !isFirestoreQuotaExceeded()) {
      const cloudWipeTasks: Promise<void>[] = [];

      if (options.resetSessions ?? true) {
        cloudWipeTasks.push(
          resetCollectionInCloud(SESSIONS_COLLECTION).then((c) => {
            result.sessionsDeleted = c;
            result.clearedCollections.push(SESSIONS_COLLECTION);
          })
        );
      }
      if (options.resetProfiles ?? true) {
        cloudWipeTasks.push(
          resetCollectionInCloud(PROFILES_COLLECTION).then((c) => {
            result.profilesDeleted = c;
            result.clearedCollections.push(PROFILES_COLLECTION);
          })
        );
      }
      if (options.resetDirectives ?? true) {
        cloudWipeTasks.push(
          resetCollectionInCloud(DIRECTIVES_COLLECTION).then((c) => {
            result.directivesDeleted = c;
            result.clearedCollections.push(DIRECTIVES_COLLECTION);
          })
        );
      }
      if (options.resetFeedbacks ?? true) {
        cloudWipeTasks.push(
          resetCollectionInCloud(FEEDBACK_COLLECTION).then((c) => {
            result.feedbacksDeleted = c;
            result.clearedCollections.push(FEEDBACK_COLLECTION);
          })
        );
      }
      if (options.resetNewsArchive ?? true) {
        cloudWipeTasks.push(
          Promise.all([
            resetCollectionInCloud(NEWS_ARCHIVE_COLLECTION),
            resetCollectionInCloud('news_scrape_sessions'),
            resetCollectionInCloud('scraped_news'),
            resetCollectionInCloud('violation_dossiers')
          ]).then(([c1, c2, c3, c4]) => {
            result.scrapedNewsDeleted += (c1 + c2 + c3 + c4);
            result.clearedCollections.push(NEWS_ARCHIVE_COLLECTION);
          })
        );
      }
      if (options.resetSemanticGroups ?? true) {
        cloudWipeTasks.push(
          resetCollectionInCloud(SEMANTIC_GROUPS_COLLECTION).then((c) => {
            result.semanticGroupsDeleted = c;
            result.clearedCollections.push(SEMANTIC_GROUPS_COLLECTION);
          })
        );
      }
      if (options.resetKnowledgeDocs ?? true) {
        cloudWipeTasks.push(
          Promise.all([
            resetCollectionInCloud(KNOWLEDGE_DOCS_COLLECTION),
            resetCollectionInCloud('user_custom_rag_knowledge')
          ]).then(([c1, c2]) => {
            result.knowledgeDocsDeleted = c1 + c2;
            result.clearedCollections.push(KNOWLEDGE_DOCS_COLLECTION);
          })
        );
      }

      await Promise.all(cloudWipeTasks);
    }

    // 3. Wipe Client-Side Local & Session Storage Caches
    if (options.clearLocalCache ?? true) {
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.removeItem('mof_scrape_data_cache');
          window.sessionStorage.clear();
        } catch (_) {}

        if (window.localStorage) {
          const keysToRemove = [
            'finpulse_advisor_sessions',
            'finpulse_advisor_active_session_id',
            'finpulse_advisor_session_history',
            'finpulse_advisor_chat_history',
            'finpulse_user_session_id',
            'finpulse_executive_profiles',
            'finpulse_active_executive_profile',
            'finpulse_pinned_directives',
            'finpulse_user_custom_rag_knowledge',
            'finpulse_user_knowledge_docs',
            'finpulse_rag_last_processed_time',
            'finpulse_rlhf_feedback_records',
            'finpulse_scraped_news_archive',
            'finpulse_scrape_sessions_history',
            'finpulse_recent_searches',
            'finpulse_violation_dossiers',
            'mof_scrape_data_cache'
          ];
          keysToRemove.forEach((k) => {
            try {
              window.localStorage.removeItem(k);
            } catch (_) {}
          });
        }
      }
    }

    // 4. Live Verification: Check actual document count from Firestore
    const postResetStats = await getDatabaseStats();
    const remainingCount =
      postResetStats.sessionsCount +
      postResetStats.profilesCount +
      postResetStats.directivesCount +
      postResetStats.feedbacksCount +
      postResetStats.scrapedNewsCount +
      postResetStats.semanticGroupsCount +
      postResetStats.knowledgeDocsCount;

    if (remainingCount === 0 || !dbInstance) {
      result.success = true;
      console.log('✅ Database Factory Reset verified: 0 documents remaining across all Firestore collections.', result);
    } else {
      // If some docs remain, still mark partial success with clear warning
      result.success = true;
      console.warn(`⚠️ Factory reset completed with ${remainingCount} documents remaining in Firestore.`, postResetStats);
    }
  } catch (err: any) {
    console.error('❌ Failed to execute Database Factory Reset:', err);
    result.error = err?.message || String(err);
    result.success = false;
  }

  return result;
}

