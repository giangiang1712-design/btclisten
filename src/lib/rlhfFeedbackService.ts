import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, isCloudDatabaseActive, sanitizeForFirestore, handleFirestoreError, isFirestoreQuotaExceeded } from './firebase';

export type FeedbackRating = 'positive' | 'negative';

export type RAGErrorCategory =
  | 'wrong_legal_citation'     // Trích dẫn sai điều khoản / số hiệu văn bản
  | 'outdated_law'             // Áp dụng văn bản đã hết hiệu lực / bị thay thế
  | 'wrong_macro_data'         // Sai số liệu vĩ mô, ngân sách, tỷ giá, chứng khoán
  | 'improper_official_tone'   // Sai thể thức văn bản hành chính công vụ
  | 'missing_context'          // Thiếu thông tin bối cảnh thực tế
  | 'hallucination'            // Suy đoán không có căn cứ
  | 'other';                   // Lý do khác

export interface RlhfFeedbackItem {
  id: string;
  messageId: string;
  sessionId?: string;
  sessionTitle?: string;
  userPrompt: string;
  assistantResponse: string;
  rating: FeedbackRating;
  errorCategory?: RAGErrorCategory;
  userCorrectionText?: string;
  suggestedLawCodes?: string[];
  suggestedKeywords?: string[];
  ragLegalCitations?: Array<{
    code: string;
    title: string;
    reRankScore: number;
    extractedClauses?: string[];
  }>;
  executiveProfileRole?: string;
  timestamp: number;
  dateFormatted: string;
  status: 'PENDING_REVIEW' | 'APPLIED_TO_RERANKER' | 'EXPORTED_FOR_TUNING';
}

export interface RlhfStatistics {
  totalCount: number;
  positiveCount: number;
  negativeCount: number;
  satisfactionRate: number; // 0 - 100%
  appliedCount: number;
  categoryBreakdown: Record<RAGErrorCategory, number>;
}

const LOCAL_STORAGE_RLHF_KEY = 'finpulse_rlhf_feedback_records';
const FEEDBACK_COLLECTION = 'ai_feedback_loop';

// In-memory dynamic weight tuning cache derived from negative feedback
let dynamicRerankerPenalties: Record<string, number> = {};
let dynamicRerankerBoosts: Record<string, number> = {};

/**
 * Load local fallback feedbacks
 */
export function getLocalFeedbacks(): RlhfFeedbackItem[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RLHF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to parse local RLHF feedbacks:', err);
    return [];
  }
}

/**
 * Save to local fallback storage
 */
export function saveLocalFeedbacks(list: RlhfFeedbackItem[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(LOCAL_STORAGE_RLHF_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Failed to save local RLHF feedbacks:', err);
  }
}

/**
 * Save feedback to Cloud Firestore (with local fallback)
 */
export async function saveFeedbackRecord(feedback: RlhfFeedbackItem): Promise<boolean> {
  // Update local storage first
  const currentList = getLocalFeedbacks();
  const existingIndex = currentList.findIndex(f => f.id === feedback.id || (f.messageId === feedback.messageId && f.messageId));
  if (existingIndex >= 0) {
    currentList[existingIndex] = feedback;
  } else {
    currentList.unshift(feedback);
  }
  saveLocalFeedbacks(currentList);

  // Update dynamic tuning weights
  updateDynamicWeightsFromFeedback(currentList);

  // Cloud Firestore Persistence
  if (!db || !isCloudDatabaseActive() || isFirestoreQuotaExceeded()) {
    return true;
  }

  try {
    const feedbackRef = doc(db, FEEDBACK_COLLECTION, feedback.id);
    const sanitized = sanitizeForFirestore({
      ...feedback,
      updatedAt: Date.now()
    });
    await setDoc(feedbackRef, sanitized, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Failed to save RLHF feedback to Firestore (stored locally):', err);
    return false;
  }
}

/**
 * Fetch all RLHF feedback records from Cloud Firestore or Local
 */
export async function fetchAllFeedbacks(): Promise<RlhfFeedbackItem[]> {
  if (db && isCloudDatabaseActive() && !isFirestoreQuotaExceeded()) {
    try {
      const q = query(
        collection(db, FEEDBACK_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      const snap = await getDocs(q);
      const list: RlhfFeedbackItem[] = [];
      snap.forEach(d => {
        list.push(d.data() as RlhfFeedbackItem);
      });
      if (list.length > 0) {
        saveLocalFeedbacks(list);
        updateDynamicWeightsFromFeedback(list);
        return list;
      }
    } catch (err) {
      handleFirestoreError(err);
      console.warn('Falling back to local RLHF records:', err);
    }
  }
  const local = getLocalFeedbacks();
  updateDynamicWeightsFromFeedback(local);
  return local;
}

/**
 * Delete a feedback record
 */
export async function deleteFeedbackRecord(id: string): Promise<boolean> {
  const currentList = getLocalFeedbacks().filter(f => f.id !== id);
  saveLocalFeedbacks(currentList);
  updateDynamicWeightsFromFeedback(currentList);

  if (db && isCloudDatabaseActive() && !isFirestoreQuotaExceeded()) {
    try {
      await deleteDoc(doc(db, FEEDBACK_COLLECTION, id));
      return true;
    } catch (err) {
      handleFirestoreError(err);
      console.warn('Failed to delete RLHF record from Firestore:', err);
      return false;
    }
  }
  return true;
}

/**
 * Subscribe to real-time changes in RLHF records
 */
export function subscribeToCloudFeedbacks(callback: (list: RlhfFeedbackItem[]) => void): Unsubscribe | null {
  if (!db || !isCloudDatabaseActive() || isFirestoreQuotaExceeded()) {
    callback(getLocalFeedbacks());
    return null;
  }

  try {
    const q = query(
      collection(db, FEEDBACK_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    return onSnapshot(q, (snap) => {
      const list: RlhfFeedbackItem[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as RlhfFeedbackItem);
      });
      saveLocalFeedbacks(list);
      updateDynamicWeightsFromFeedback(list);
      callback(list);
    }, (err) => {
      handleFirestoreError(err);
      console.warn('Firestore RLHF live listener error:', err);
      callback(getLocalFeedbacks());
    });
  } catch (err) {
    handleFirestoreError(err);
    console.warn('Failed to subscribe to cloud feedbacks:', err);
    callback(getLocalFeedbacks());
    return null;
  }
}

/**
 * Calculate statistical KPIs from feedback dataset
 */
export function calculateFeedbackStatistics(feedbacks: RlhfFeedbackItem[]): RlhfStatistics {
  const totalCount = feedbacks.length;
  const positiveCount = feedbacks.filter(f => f.rating === 'positive').length;
  const negativeCount = feedbacks.filter(f => f.rating === 'negative').length;
  const appliedCount = feedbacks.filter(f => f.status === 'APPLIED_TO_RERANKER').length;
  const satisfactionRate = totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 100;

  const categoryBreakdown: Record<RAGErrorCategory, number> = {
    wrong_legal_citation: 0,
    outdated_law: 0,
    wrong_macro_data: 0,
    improper_official_tone: 0,
    missing_context: 0,
    hallucination: 0,
    other: 0
  };

  feedbacks.forEach(f => {
    if (f.rating === 'negative' && f.errorCategory) {
      categoryBreakdown[f.errorCategory] = (categoryBreakdown[f.errorCategory] || 0) + 1;
    }
  });

  return {
    totalCount,
    positiveCount,
    negativeCount,
    satisfactionRate,
    appliedCount,
    categoryBreakdown
  };
}

/**
 * Update Dynamic Weights for Semantic Re-ranking from negative/positive user corrections
 */
function updateDynamicWeightsFromFeedback(feedbacks: RlhfFeedbackItem[]): void {
  const penalties: Record<string, number> = {};
  const boosts: Record<string, number> = {};

  feedbacks.forEach(fb => {
    if (fb.rating === 'negative') {
      // If user flagged bad legal citation, penalize that document code
      if (fb.ragLegalCitations && fb.ragLegalCitations.length > 0) {
        fb.ragLegalCitations.forEach(cit => {
          const key = cit.code.toLowerCase().trim();
          penalties[key] = (penalties[key] || 0) + 0.15; // penalize 15% per negative vote
        });
      }
      // If user suggested correct law codes, boost them
      if (fb.suggestedLawCodes && fb.suggestedLawCodes.length > 0) {
        fb.suggestedLawCodes.forEach(code => {
          const key = code.toLowerCase().trim();
          boosts[key] = (boosts[key] || 0) + 0.25; // boost 25% per suggestion
        });
      }
    } else if (fb.rating === 'positive') {
      // Boost validated citations
      if (fb.ragLegalCitations && fb.ragLegalCitations.length > 0) {
        fb.ragLegalCitations.forEach(cit => {
          const key = cit.code.toLowerCase().trim();
          boosts[key] = (boosts[key] || 0) + 0.10;
        });
      }
    }
  });

  dynamicRerankerPenalties = penalties;
  dynamicRerankerBoosts = boosts;
}

/**
 * Get dynamic multiplier for a specific legal document code based on accumulated RLHF
 */
export function getRlhfDocumentMultiplier(docCode: string): number {
  const key = docCode.toLowerCase().trim();
  const penalty = dynamicRerankerPenalties[key] || 0;
  const boost = dynamicRerankerBoosts[key] || 0;
  
  // Base multiplier is 1.0, bounded between 0.4 and 1.8
  const multiplier = 1.0 + boost - penalty;
  return Math.max(0.4, Math.min(1.8, multiplier));
}

/**
 * Export RLHF Dataset to standard JSONL format for fine-tuning LLMs (Gemini / OpenAI Tuning format)
 */
export function exportRlhfToJsonlString(feedbacks: RlhfFeedbackItem[]): string {
  const lines: string[] = [];

  feedbacks.forEach(fb => {
    const idealResponse = (fb.rating === 'negative' && fb.userCorrectionText && fb.userCorrectionText.trim().length > 0)
      ? fb.userCorrectionText.trim()
      : fb.assistantResponse;

    const row = {
      id: fb.id,
      timestamp: fb.timestamp,
      rating: fb.rating,
      category: fb.errorCategory || 'none',
      messages: [
        {
          role: "system",
          content: "Bạn là Trợ lý Cố vấn & Tham mưu Điều hành Cấp cao của Bộ Tài chính Việt Nam (FinPulse Executive AI). Hãy phản hồi chính xác, tuân thủ đúng quy định pháp luật và thể thức văn bản hành chính công vụ."
        },
        {
          role: "user",
          content: fb.userPrompt
        },
        {
          role: "assistant",
          content: idealResponse
        }
      ],
      metadata: {
        suggestedLaws: fb.suggestedLawCodes || [],
        suggestedKeywords: fb.suggestedKeywords || [],
        userRole: fb.executiveProfileRole || 'Lãnh đạo Bộ Tài chính'
      }
    };

    lines.push(JSON.stringify(row));
  });

  return lines.join('\n');
}

/**
 * Trigger browser file download of the JSONL dataset
 */
export function downloadRlhfJsonlDataset(feedbacks: RlhfFeedbackItem[]): void {
  const content = exportRlhfToJsonlString(feedbacks);
  const blob = new Blob([content], { type: 'application/jsonl;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finpulse_rlhf_tuning_dataset_${new Date().toISOString().slice(0, 10)}.jsonl`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
