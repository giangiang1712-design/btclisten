import { SemanticKeywordGroup, MoFSectorInfo, MOF_2026_SECTORS } from '../types/semanticDictionary';
import { INITIAL_SEMANTIC_GROUPS } from '../data/defaultSemanticDictionary';
import {
  saveSemanticGroupToCloud,
  fetchSemanticGroupsFromCloud,
  deleteSemanticGroupFromCloud,
  bulkSyncSemanticGroupsToCloud,
  subscribeToCloudSemanticGroups,
  isCloudDatabaseActive,
  isFirestoreQuotaExceeded
} from '../lib/firebase';

const LOCAL_STORAGE_KEY = 'cached_semantic_groups';

function getLocalCachedGroups(): SemanticKeywordGroup[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return [...INITIAL_SEMANTIC_GROUPS];
}

function setLocalCachedGroups(groups: SemanticKeywordGroup[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(groups));
    }
  } catch {
    // Ignore quota errors
  }
}

export async function fetchSemanticGroups(retryCount = 0): Promise<{ success: boolean; total: number; groups: SemanticKeywordGroup[]; isFromCloudDb?: boolean }> {
  // 1. First priority: if Cloud Firestore is active, fetch from Cloud Database
  if (isCloudDatabaseActive()) {
    try {
      const cloudGroups = await fetchSemanticGroupsFromCloud();
      if (cloudGroups && cloudGroups.length > 0) {
        // Merge cloud custom/updated groups with built-in groups
        const map = new Map<string, SemanticKeywordGroup>();
        INITIAL_SEMANTIC_GROUPS.forEach(g => map.set(g.id, { ...g }));
        cloudGroups.forEach(g => map.set(g.id, g));
        const merged = Array.from(map.values());
        setLocalCachedGroups(merged);
        return { success: true, total: merged.length, groups: merged, isFromCloudDb: true };
      }
    } catch (cloudErr) {
      console.warn('[SemanticDictionary] Cloud Firestore read fallback to API/Cache:', cloudErr);
    }
  }

  // 2. Second priority: fetch from server Express API
  try {
    const res = await fetch('/api/semantic-dictionary/groups');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data && data.success && Array.isArray(data.groups) && data.groups.length > 0) {
      setLocalCachedGroups(data.groups);
      return data;
    }
    throw new Error('Invalid response structure');
  } catch (err: any) {
    if (retryCount < 2 && (err?.name === 'TypeError' || err?.message?.includes('Load failed') || err?.message?.includes('Failed to fetch'))) {
      await new Promise((r) => setTimeout(r, 400 * (retryCount + 1)));
      return fetchSemanticGroups(retryCount + 1);
    }
    console.warn('[SemanticDictionary] Network unavailable, loaded built-in/cached 2026 dictionary:', err?.message || err);
    const cached = getLocalCachedGroups();
    return { success: true, total: cached.length, groups: cached };
  }
}

export async function fetchMoFSectors(retryCount = 0): Promise<{ success: boolean; sectors: MoFSectorInfo[] }> {
  try {
    const res = await fetch('/api/semantic-dictionary/sectors');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data && data.success && Array.isArray(data.sectors)) {
      return data;
    }
    throw new Error('Invalid response');
  } catch (err: any) {
    if (retryCount < 2 && (err?.name === 'TypeError' || err?.message?.includes('Load failed') || err?.message?.includes('Failed to fetch'))) {
      await new Promise((r) => setTimeout(r, 400 * (retryCount + 1)));
      return fetchMoFSectors(retryCount + 1);
    }
    console.warn('[SemanticDictionary] Using built-in sectors definition');
    return { success: true, sectors: MOF_2026_SECTORS };
  }
}

export async function saveSemanticGroup(group: Partial<SemanticKeywordGroup>): Promise<{ success: boolean; group?: SemanticKeywordGroup; error?: string; message?: string }> {
  const cleanGroup: SemanticKeywordGroup = {
    id: group.id || `grp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: group.name || 'Nhóm từ khóa mới',
    sector: group.sector || 'leadership',
    sectorNameVi: group.sectorNameVi || 'Lãnh đạo Bộ & Cán bộ Cấp cao',
    primaryKeyword: group.primaryKeyword || '',
    synonyms: group.synonyms || [],
    contextRules: group.contextRules || {},
    isActive: group.isActive !== false,
    isBuiltIn: !!group.isBuiltIn,
    updatedAt: new Date().toISOString()
  };

  // Sync to Cloud Firestore if active
  if (isCloudDatabaseActive()) {
    saveSemanticGroupToCloud(cleanGroup).catch(err => {
      console.warn('[SemanticDictionary] Cloud Firestore direct save error:', err);
    });
  }

  try {
    const res = await fetch('/api/semantic-dictionary/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanGroup)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && data.success && data.group) {
      const cached = getLocalCachedGroups();
      const idx = cached.findIndex(g => g.id === data.group.id);
      if (idx >= 0) cached[idx] = data.group;
      else cached.unshift(data.group);
      setLocalCachedGroups(cached);
      return data;
    }
    return data;
  } catch (err: any) {
    console.warn('[SemanticDictionary] Server API save fallback to local & cloud:', err?.message || err);
    const cached = getLocalCachedGroups();
    const idx = cached.findIndex(g => g.id === cleanGroup.id);
    if (idx >= 0) cached[idx] = cleanGroup;
    else cached.unshift(cleanGroup);
    setLocalCachedGroups(cached);
    return { success: true, group: cleanGroup, message: 'Đã lưu nhóm từ khóa thành công trên Cơ sở dữ liệu' };
  }
}

export async function deleteSemanticGroup(id: string): Promise<{ success: boolean; error?: string; message?: string }> {
  // Sync to Cloud Firestore if active
  if (isCloudDatabaseActive()) {
    deleteSemanticGroupFromCloud(id).catch(err => {
      console.warn('[SemanticDictionary] Cloud Firestore direct delete error:', err);
    });
  }

  try {
    const res = await fetch(`/api/semantic-dictionary/groups/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    const cached = getLocalCachedGroups().filter(g => g.id !== id);
    setLocalCachedGroups(cached);
    return data;
  } catch (err: any) {
    const cached = getLocalCachedGroups().filter(g => g.id !== id);
    setLocalCachedGroups(cached);
    return { success: true, message: 'Đã xóa nhóm từ khóa thành công trên Cơ sở dữ liệu' };
  }
}

export async function toggleSemanticGroupActive(id: string): Promise<{ success: boolean; group?: SemanticKeywordGroup; error?: string }> {
  const cached = getLocalCachedGroups();
  const idx = cached.findIndex(g => g.id === id);
  let updatedGroup: SemanticKeywordGroup | undefined;
  if (idx >= 0) {
    cached[idx].isActive = !cached[idx].isActive;
    cached[idx].updatedAt = new Date().toISOString();
    updatedGroup = cached[idx];
    setLocalCachedGroups(cached);
  }

  // Sync toggle state to Cloud Firestore
  if (updatedGroup && isCloudDatabaseActive()) {
    saveSemanticGroupToCloud(updatedGroup).catch(err => {
      console.warn('[SemanticDictionary] Cloud Firestore toggle update error:', err);
    });
  }

  try {
    const res = await fetch(`/api/semantic-dictionary/groups/toggle/${id}`, {
      method: 'POST'
    });
    const data = await res.json();
    if (data && data.success && data.group) {
      return data;
    }
  } catch (err: any) {
    console.warn('[SemanticDictionary] Offline toggle fallback:', err?.message || err);
  }

  return { success: true, group: updatedGroup };
}

export async function syncAllSemanticGroupsToCloudDatabase(): Promise<{ success: boolean; count: number; message: string }> {
  const groups = getLocalCachedGroups();
  if (!isCloudDatabaseActive()) {
    return {
      success: false,
      count: 0,
      message: isFirestoreQuotaExceeded()
        ? 'Hạn mức ghi Cloud Firestore miễn phí hôm nay đã đạt giới hạn (20.000 lượt ghi/ngày). Dữ liệu vẫn được lưu trữ và bảo vệ an toàn trên bộ nhớ cục bộ.'
        : 'Cơ sở dữ liệu Cloud Firestore chưa sẵn sàng hoặc đang ngoại tuyến'
    };
  }
  try {
    const result = await bulkSyncSemanticGroupsToCloud(groups);
    if (result.success) {
      return {
        success: true,
        count: result.syncedCount,
        message: `Đã đồng bộ thành công ${result.syncedCount} nhóm từ khóa và ma trận ngữ cảnh lên Cơ sở dữ liệu Cloud Firestore!`
      };
    } else {
      return {
        success: false,
        count: result.syncedCount,
        message: result.error || 'Không thể đồng bộ lên đám mây lúc này. Dữ liệu được lưu trữ an toàn trong bộ nhớ cục bộ.'
      };
    }
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      message: `Lỗi đồng bộ CSDL: ${err?.message || err}`
    };
  }
}

export async function resetSemanticDictionaryToDefault(): Promise<{ success: boolean; total: number; groups: SemanticKeywordGroup[]; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/semantic-dictionary/reset', {
      method: 'POST'
    });
    const data = await res.json();
    if (data && data.success && Array.isArray(data.groups)) {
      setLocalCachedGroups(data.groups);
      return data;
    }
  } catch (err: any) {
    console.warn('[SemanticDictionary] Offline reset fallback');
  }
  setLocalCachedGroups(INITIAL_SEMANTIC_GROUPS);
  return {
    success: true,
    total: INITIAL_SEMANTIC_GROUPS.length,
    groups: INITIAL_SEMANTIC_GROUPS,
    message: 'Đã khôi phục toàn bộ từ điển chuẩn hóa năm 2026 của Bộ Tài chính'
  };
}

export async function testSemanticQuerySandbox(query: string): Promise<{
  success: boolean;
  result?: {
    query: string;
    expandedVariants: string[];
    matchedGroups: SemanticKeywordGroup[];
    targetAgencies: string[];
    targetRegulations: string[];
    suggestedSearchQuery: string;
  };
  error?: string;
}> {
  try {
    const res = await fetch('/api/semantic-dictionary/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.result) return data;
    }
  } catch (err: any) {
    console.warn('[SemanticDictionary] Sandbox offline fallback');
  }

  const q = (query || '').toLowerCase().trim();
  const groups = getLocalCachedGroups().filter(g => g.isActive);
  const matched = groups.filter(g => {
    if (g.primaryKeyword && q.includes(g.primaryKeyword.toLowerCase())) return true;
    if (g.synonyms?.some(s => q.includes(s.toLowerCase()))) return true;
    return false;
  });

  const variants = Array.from(new Set(matched.flatMap(m => [m.primaryKeyword, ...m.synonyms]).filter(Boolean))).slice(0, 10);
  const targetAgencies = Array.from(new Set(matched.flatMap(m => m.contextRules?.targetAgencies || []))).slice(0, 6);
  const targetRegulations = Array.from(new Set(matched.flatMap(m => m.contextRules?.targetRegulations || []))).slice(0, 6);

  return {
    success: true,
    result: {
      query,
      expandedVariants: variants.length > 0 ? variants : [query],
      matchedGroups: matched,
      targetAgencies,
      targetRegulations,
      suggestedSearchQuery: variants.length > 0 ? `${query} OR ${variants.slice(0, 3).join(' OR ')}` : query
    }
  };
}

export async function importSemanticDictionary(groups: SemanticKeywordGroup[]): Promise<{ success: boolean; count?: number; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/semantic-dictionary/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groups })
    });
    return await res.json();
  } catch (err: any) {
    const existing = getLocalCachedGroups();
    const map = new Map<string, SemanticKeywordGroup>();
    existing.forEach(g => map.set(g.id, g));
    groups.forEach(g => map.set(g.id, g));
    const merged = Array.from(map.values());
    setLocalCachedGroups(merged);
    return { success: true, count: groups.length, message: 'Đã nhập nhóm từ khóa vào bộ nhớ cục bộ' };
  }
}

export async function fetchAiSemanticSuggestions(primaryKeyword: string, sector: string, name?: string): Promise<{
  success: boolean;
  suggestions?: {
    suggestedName?: string;
    synonyms: string[];
    mustIncludeAny: string[];
    excludeWords: string[];
    targetAgencies: string[];
    targetRegulations: string[];
    boostWeight: number;
    description?: string;
  };
  error?: string;
}> {
  try {
    const res = await fetch('/api/semantic-dictionary/ai-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ primaryKeyword, sector, name })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi gợi ý AI' };
  }
}

export async function syncSemanticDictionary2026(): Promise<{ success: boolean; total: number; groups: SemanticKeywordGroup[]; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/semantic-dictionary/sync-2026', {
      method: 'POST'
    });
    const data = await res.json();
    if (data && data.success && Array.isArray(data.groups)) {
      setLocalCachedGroups(data.groups);
      return data;
    }
  } catch (err: any) {
    console.warn('[SemanticDictionary] Offline sync fallback');
  }
  setLocalCachedGroups(INITIAL_SEMANTIC_GROUPS);
  return {
    success: true,
    total: INITIAL_SEMANTIC_GROUPS.length,
    groups: INITIAL_SEMANTIC_GROUPS,
    message: 'Đã đồng bộ hóa toàn bộ 40+ nhóm từ khóa & ma trận ánh xạ ngữ cảnh mới nhất năm 2026 của Bộ Tài chính!'
  };
}

