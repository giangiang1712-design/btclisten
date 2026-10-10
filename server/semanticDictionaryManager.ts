import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { SemanticKeywordGroup, MOF_2026_SECTORS } from '../src/types/semanticDictionary';
import { INITIAL_SEMANTIC_GROUPS } from '../src/data/defaultSemanticDictionary';

const DATA_DIR = path.join(process.cwd(), 'data');
const DICT_FILE = path.join(DATA_DIR, 'custom_semantic_dictionary.json');

class SemanticDictionaryEngine {
  private groups: SemanticKeywordGroup[] = [];

  constructor() {
    this.initStorage();
  }

  private initStorage() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DICT_FILE)) {
        const raw = fs.readFileSync(DICT_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with INITIAL_SEMANTIC_GROUPS: update built-in groups to newest 2026 versions and keep user custom groups
          const customGroups = parsed.filter(g => !g.isBuiltIn);
          const defaultMap = new Map<string, SemanticKeywordGroup>();
          INITIAL_SEMANTIC_GROUPS.forEach(g => defaultMap.set(g.id, JSON.parse(JSON.stringify(g))));

          // Check if any existing built-in was modified by user or if we should sync
          for (const item of parsed) {
            if (item.isBuiltIn && defaultMap.has(item.id)) {
              // keep active status if user toggled it
              const defaultVer = defaultMap.get(item.id)!;
              defaultVer.isActive = item.isActive !== false;
            }
          }

          this.groups = [...Array.from(defaultMap.values()), ...customGroups];
          this.saveToFile();
          console.log(`[SemanticDictionary] Loaded & synchronized ${this.groups.length} groups for MoF 2026`);
          return;
        }
      }

      // If file doesn't exist or is empty, initialize with default 2026 MoF groups
      this.groups = JSON.parse(JSON.stringify(INITIAL_SEMANTIC_GROUPS));
      this.saveToFile();
      console.log(`[SemanticDictionary] Initialized ${this.groups.length} default 2026 MoF groups.`);
    } catch (err) {
      console.error('[SemanticDictionary] Failed to load custom dictionary:', err);
      this.groups = JSON.parse(JSON.stringify(INITIAL_SEMANTIC_GROUPS));
    }
  }

  private saveToFile(): boolean {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DICT_FILE, JSON.stringify(this.groups, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[SemanticDictionary] Error saving dictionary to file:', err);
      return false;
    }
  }

  public getAllGroups(): SemanticKeywordGroup[] {
    return [...this.groups];
  }

  public getGroupById(id: string): SemanticKeywordGroup | undefined {
    return this.groups.find(g => g.id === id);
  }

  public addOrUpdateGroup(group: SemanticKeywordGroup): SemanticKeywordGroup {
    const cleanGroup: SemanticKeywordGroup = {
      ...group,
      id: group.id || `grp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: (group.name || '').trim(),
      sector: group.sector || 'policy',
      sectorNameVi: group.sectorNameVi || 'Thể chế & Chính sách',
      primaryKeyword: (group.primaryKeyword || '').trim().toLowerCase(),
      synonyms: Array.isArray(group.synonyms) 
        ? Array.from(new Set(group.synonyms.map(s => (s || '').trim().toLowerCase()).filter(Boolean)))
        : [],
      contextRules: {
        mustIncludeAny: Array.isArray(group.contextRules?.mustIncludeAny)
          ? group.contextRules.mustIncludeAny.map(w => w.trim().toLowerCase()).filter(Boolean)
          : [],
        excludeWords: Array.isArray(group.contextRules?.excludeWords)
          ? group.contextRules.excludeWords.map(w => w.trim().toLowerCase()).filter(Boolean)
          : [],
        boostWeight: typeof group.contextRules?.boostWeight === 'number' ? group.contextRules.boostWeight : 1.5,
        targetAgencies: Array.isArray(group.contextRules?.targetAgencies)
          ? group.contextRules.targetAgencies.map(a => a.trim()).filter(Boolean)
          : [],
        targetRegulations: Array.isArray(group.contextRules?.targetRegulations)
          ? group.contextRules.targetRegulations.map(r => r.trim()).filter(Boolean)
          : [],
        description: group.contextRules?.description || ''
      },
      isActive: group.isActive !== false,
      isBuiltIn: !!group.isBuiltIn,
      updatedAt: new Date().toISOString()
    };

    const existingIdx = this.groups.findIndex(g => g.id === cleanGroup.id);
    if (existingIdx >= 0) {
      this.groups[existingIdx] = cleanGroup;
    } else {
      this.groups.unshift(cleanGroup);
    }

    this.saveToFile();
    return cleanGroup;
  }

  public deleteGroup(id: string): boolean {
    const initialLen = this.groups.length;
    this.groups = this.groups.filter(g => g.id !== id);
    if (this.groups.length !== initialLen) {
      this.saveToFile();
      return true;
    }
    return false;
  }

  public toggleActive(id: string): boolean {
    const group = this.groups.find(g => g.id === id);
    if (group) {
      group.isActive = !group.isActive;
      group.updatedAt = new Date().toISOString();
      this.saveToFile();
      return true;
    }
    return false;
  }

  public resetToDefault(): SemanticKeywordGroup[] {
    this.groups = JSON.parse(JSON.stringify(INITIAL_SEMANTIC_GROUPS));
    this.saveToFile();
    return [...this.groups];
  }

  public importGroups(imported: SemanticKeywordGroup[]): { success: boolean; count: number } {
    if (!Array.isArray(imported) || imported.length === 0) {
      return { success: false, count: 0 };
    }

    const validGroups: SemanticKeywordGroup[] = [];
    for (const item of imported) {
      if (item.name && item.primaryKeyword) {
        validGroups.push({
          id: item.id || `grp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: item.name.trim(),
          sector: item.sector || 'policy',
          sectorNameVi: item.sectorNameVi || 'Thể chế & Chính sách',
          primaryKeyword: item.primaryKeyword.trim().toLowerCase(),
          synonyms: Array.isArray(item.synonyms) ? item.synonyms.map(s => s.trim().toLowerCase()).filter(Boolean) : [],
          contextRules: {
            mustIncludeAny: item.contextRules?.mustIncludeAny || [],
            excludeWords: item.contextRules?.excludeWords || [],
            boostWeight: item.contextRules?.boostWeight || 1.5,
            targetAgencies: item.contextRules?.targetAgencies || [],
            targetRegulations: item.contextRules?.targetRegulations || [],
            description: item.contextRules?.description || ''
          },
          isActive: item.isActive !== false,
          isBuiltIn: !!item.isBuiltIn,
          updatedAt: new Date().toISOString()
        });
      }
    }

    if (validGroups.length > 0) {
      this.groups = validGroups;
      this.saveToFile();
      return { success: true, count: validGroups.length };
    }
    return { success: false, count: 0 };
  }

  /**
   * Build complete live active synonym dictionary for fast runtime mapping
   */
  public getActiveSynonymDictionary(): Record<string, string[]> {
    const dict: Record<string, string[]> = {};

    for (const grp of this.groups) {
      if (!grp.isActive) continue;

      const pKey = grp.primaryKeyword.toLowerCase().trim();
      if (!dict[pKey]) {
        dict[pKey] = [];
      }

      // Add primary and synonyms
      const allWords = [pKey, ...grp.synonyms];
      for (const w of allWords) {
        const cleanW = w.toLowerCase().trim();
        if (cleanW && !dict[pKey].includes(cleanW)) {
          dict[pKey].push(cleanW);
        }
      }

      // Bidirectional mapping for key synonyms
      for (const syn of grp.synonyms) {
        const cleanSyn = syn.toLowerCase().trim();
        if (!cleanSyn) continue;
        if (!dict[cleanSyn]) {
          dict[cleanSyn] = [];
        }
        for (const w of allWords) {
          const cw = w.toLowerCase().trim();
          if (cw && !dict[cleanSyn].includes(cw)) {
            dict[cleanSyn].push(cw);
          }
        }
      }
    }

    return dict;
  }

  /**
   * Expand query and match context for testing or scraping
   */
  public testSemanticQuery(query: string) {
    const qLower = (query || '').trim().toLowerCase();
    if (!qLower) {
      return {
        query: '',
        expandedVariants: [],
        matchedGroups: [],
        targetAgencies: [],
        targetRegulations: [],
        suggestedSearchQuery: ''
      };
    }

    const matchedGroups: SemanticKeywordGroup[] = [];
    const expandedVariants = new Set<string>();
    expandedVariants.add(qLower);

    const activeGroups = this.groups.filter(g => g.isActive);

    for (const grp of activeGroups) {
      const pKey = grp.primaryKeyword.toLowerCase();
      
      // Check exclude words
      const excludeWords = grp.contextRules?.excludeWords || [];
      const hasExcludeWord = excludeWords.some(ew => qLower.includes(ew.toLowerCase()));
      if (hasExcludeWord) {
        continue;
      }

      const isPrimaryMatch = qLower.includes(pKey) || (pKey.length > 3 && pKey.includes(qLower));
      const matchedSynonym = grp.synonyms.find(syn => {
        const sLower = syn.toLowerCase();
        return qLower.includes(sLower) || (sLower.length > 3 && sLower.includes(qLower));
      });

      if (isPrimaryMatch || matchedSynonym) {
        // Calculate context confidence score
        const mustInclude = grp.contextRules?.mustIncludeAny || [];
        let contextBoost = 1.0;
        if (mustInclude.length > 0) {
          const matchedIncludes = mustInclude.filter(w => qLower.includes(w.toLowerCase()));
          if (matchedIncludes.length > 0) {
            contextBoost += 0.5 * matchedIncludes.length;
          }
        }
        const weight = (grp.contextRules?.boostWeight || 1.5) * contextBoost;

        matchedGroups.push({
          ...grp,
          contextRules: {
            ...grp.contextRules,
            boostWeight: parseFloat(weight.toFixed(2))
          }
        });

        expandedVariants.add(grp.primaryKeyword);
        grp.synonyms.forEach(s => expandedVariants.add(s));
      }
    }

    // Sort matched groups by boostWeight descending
    matchedGroups.sort((a, b) => (b.contextRules?.boostWeight || 1) - (a.contextRules?.boostWeight || 1));

    // Extract unique agencies and regulations
    const targetAgencies = Array.from(new Set(
      matchedGroups.flatMap(g => g.contextRules?.targetAgencies || [])
    ));
    const targetRegulations = Array.from(new Set(
      matchedGroups.flatMap(g => g.contextRules?.targetRegulations || [])
    ));

    const topVariants = Array.from(expandedVariants).slice(0, 8);
    const suggestedSearchQuery = topVariants.length > 1
      ? `(${topVariants.slice(0, 4).join(' OR ')}) Bộ Tài chính`
      : `${qLower} Bộ Tài chính`;

    return {
      query: qLower,
      expandedVariants: Array.from(expandedVariants),
      matchedGroups,
      targetAgencies,
      targetRegulations,
      suggestedSearchQuery,
      confidenceScore: matchedGroups.length > 0 ? Math.min(99, Math.round((matchedGroups[0].contextRules?.boostWeight || 1) * 35)) : 40
    };
  }

  /**
   * Evaluate an article against active groups in the Semantic Dictionary
   * Returns matching groups, confidence score, detected agencies, regulations, and inferred sector
   */
  public evaluateArticle(title: string, snippet: string, targetSector: string = 'all') {
    const text = `${title || ''} ${snippet || ''}`.toLowerCase();
    const activeGroups = this.groups.filter(g => g.isActive !== false);

    const targetGroups = (targetSector && targetSector !== 'all')
      ? activeGroups.filter(g => g.sector === targetSector)
      : activeGroups;

    const matchedGroups: Array<{ group: SemanticKeywordGroup; matchedTerms: string[]; matchScore: number }> = [];
    const matchedAgenciesSet = new Set<string>();
    const matchedRegulationsSet = new Set<string>();

    for (const grp of targetGroups) {
      const pKey = grp.primaryKeyword.toLowerCase().trim();
      const synonyms = (grp.synonyms || []).map(s => s.toLowerCase().trim()).filter(Boolean);
      const excludeWords = (grp.contextRules?.excludeWords || []).map(w => w.toLowerCase().trim()).filter(Boolean);
      const mustIncludeAny = (grp.contextRules?.mustIncludeAny || []).map(w => w.toLowerCase().trim()).filter(Boolean);

      // 1. Exclude words check
      const hasExclude = excludeWords.some(ew => ew && text.includes(ew));
      if (hasExclude) {
        continue;
      }

      // 2. Keyword / Synonym match
      const matchedTerms: string[] = [];
      if (pKey && text.includes(pKey)) {
        matchedTerms.push(pKey);
      }
      for (const syn of synonyms) {
        if (syn && text.includes(syn)) {
          matchedTerms.push(syn);
        }
      }

      if (matchedTerms.length === 0) {
        continue;
      }

      // 3. Must include any check (if configured)
      if (mustIncludeAny.length > 0) {
        const hasRequiredContext = mustIncludeAny.some(mi => mi && text.includes(mi));
        if (!hasRequiredContext) {
          // If the group strictly requires context words and none matched, skip
          continue;
        }
      }

      // 4. Calculate group match score
      const baseWeight = typeof grp.contextRules?.boostWeight === 'number' ? grp.contextRules.boostWeight : 1.5;
      const termMatchBoost = Math.min(3, matchedTerms.length) * 0.5;
      const finalScore = baseWeight + termMatchBoost;

      matchedGroups.push({
        group: grp,
        matchedTerms,
        matchScore: parseFloat(finalScore.toFixed(2))
      });

      // Collect target agencies and regulations from matched group
      (grp.contextRules?.targetAgencies || []).forEach(a => matchedAgenciesSet.add(a));
      (grp.contextRules?.targetRegulations || []).forEach(r => matchedRegulationsSet.add(r));
    }

    // Sort matched groups by matchScore descending
    matchedGroups.sort((a, b) => b.matchScore - a.matchScore);

    const isMatched = matchedGroups.length > 0;
    const topMatch = matchedGroups[0];
    const inferredSector = topMatch?.group?.sector || (targetSector !== 'all' ? targetSector : 'policy');

    return {
      isMatched,
      matchedGroups: matchedGroups.map(m => m.group),
      topGroup: topMatch?.group,
      inferredSector,
      score: topMatch?.matchScore || 0,
      matchedAgencies: Array.from(matchedAgenciesSet),
      matchedRegulations: Array.from(matchedRegulationsSet),
      matchedTerms: Array.from(new Set(matchedGroups.flatMap(m => m.matchedTerms)))
    };
  }

  /**
   * Build dynamic Google News & search queries from active Semantic Dictionary groups for a given sector
   */
  public getDynamicSectorQuery(sector: string = 'all'): string {
    const activeGroups = this.groups.filter(g => g.isActive !== false);
    const targetGroups = (sector && sector !== 'all')
      ? activeGroups.filter(g => g.sector === sector)
      : activeGroups;

    if (targetGroups.length === 0) {
      return '"Bộ Tài chính"';
    }

    // Extract top primary keywords and synonyms
    const keywordsSet = new Set<string>();
    for (const grp of targetGroups.slice(0, 12)) {
      if (grp.primaryKeyword) keywordsSet.add(grp.primaryKeyword);
      (grp.synonyms || []).slice(0, 2).forEach(s => keywordsSet.add(s));
    }

    const keywordList = Array.from(keywordsSet).slice(0, 15);
    const orQuery = keywordList.map(k => (k.includes(' ') ? `"${k}"` : k)).join(' OR ');
    return `(${orQuery})`;
  }
}

export const semanticDictionaryEngine = new SemanticDictionaryEngine();

export const semanticDictionaryRouter = express.Router();

// POST /sync-2026: Force re-sync with latest 2026 dataset
semanticDictionaryRouter.post('/sync-2026', (req: Request, res: Response) => {
  try {
    const groups = semanticDictionaryEngine.resetToDefault();
    res.json({
      success: true,
      total: groups.length,
      groups,
      message: 'Đã đồng bộ hóa toàn bộ 40+ nhóm từ khóa & ma trận ánh xạ ngữ cảnh mới nhất năm 2026 của Bộ Tài chính!'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all groups
semanticDictionaryRouter.get('/groups', (req: Request, res: Response) => {
  try {
    const groups = semanticDictionaryEngine.getAllGroups();
    res.json({
      success: true,
      total: groups.length,
      groups
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET sectors info
semanticDictionaryRouter.get('/sectors', (req: Request, res: Response) => {
  res.json({
    success: true,
    sectors: MOF_2026_SECTORS
  });
});

// POST create or update group
semanticDictionaryRouter.post('/groups', (req: Request, res: Response) => {
  try {
    const groupData = req.body;
    if (!groupData || !groupData.name || !groupData.primaryKeyword) {
      return res.status(400).json({ success: false, error: 'Tên nhóm và từ khóa chính không được để trống' });
    }

    const saved = semanticDictionaryEngine.addOrUpdateGroup(groupData);
    res.json({ success: true, group: saved, message: 'Đã lưu nhóm từ khóa thành công' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update group
semanticDictionaryRouter.put('/groups/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const groupData = { ...req.body, id };
    const saved = semanticDictionaryEngine.addOrUpdateGroup(groupData);
    res.json({ success: true, group: saved, message: 'Đã cập nhật nhóm từ khóa' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE group
semanticDictionaryRouter.delete('/groups/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const success = semanticDictionaryEngine.deleteGroup(id);
    if (success) {
      res.json({ success: true, message: 'Đã xóa nhóm từ khóa' });
    } else {
      res.status(404).json({ success: false, error: 'Không tìm thấy nhóm từ khóa' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST toggle active state
semanticDictionaryRouter.post('/groups/toggle/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const success = semanticDictionaryEngine.toggleActive(id);
    if (success) {
      const updated = semanticDictionaryEngine.getGroupById(id);
      res.json({ success: true, group: updated });
    } else {
      res.status(404).json({ success: false, error: 'Không tìm thấy nhóm từ khóa' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST reset to 2026 default
semanticDictionaryRouter.post('/reset', (req: Request, res: Response) => {
  try {
    const groups = semanticDictionaryEngine.resetToDefault();
    res.json({
      success: true,
      total: groups.length,
      groups,
      message: 'Đã khôi phục toàn bộ từ điển chuẩn hóa năm 2026 của Bộ Tài chính'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST test / sandbox query expansion
semanticDictionaryRouter.post('/test', (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const result = semanticDictionaryEngine.testSemanticQuery(query || '');
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST import groups
semanticDictionaryRouter.post('/import', (req: Request, res: Response) => {
  try {
    const { groups } = req.body;
    const result = semanticDictionaryEngine.importGroups(groups);
    if (result.success) {
      res.json({ success: true, count: result.count, message: `Đã nhập thành công ${result.count} nhóm từ khóa` });
    } else {
      res.status(400).json({ success: false, error: 'Dữ liệu nhập không hợp lệ hoặc rỗng' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST AI Suggest 2026 Context
semanticDictionaryRouter.post('/ai-suggest', async (req: Request, res: Response) => {
  try {
    const { primaryKeyword, sector, name } = req.body;
    const kw = (primaryKeyword || name || '').trim();
    const sec = sector || 'policy';

    let result: {
      synonyms: string[];
      mustIncludeAny: string[];
      excludeWords: string[];
      targetAgencies: string[];
      targetRegulations: string[];
      boostWeight: number;
      suggestedName?: string;
      description?: string;
    } | null = null;

    const apiKey = (req.headers['x-user-gemini-key'] as string) || process.env.GEMINI_API_KEY;

    // Try Gemini API if key is present
    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Bạn là chuyên gia Phân tích Tài chính - Bộ Tài chính Việt Nam (Năm 2026).
Hãy gợi ý bộ từ khóa ngữ cảnh chuẩn hóa cho từ khóa gốc: "${kw}", Lĩnh vực: "${sec}".
Yêu cầu trả về duy nhất 1 JSON object với cấu trúc:
{
  "suggestedName": "Tên nhóm chuẩn hóa ngắn gọn",
  "synonyms": ["từ đồng nghĩa 1", "từ đồng nghĩa 2", ... 8-10 từ],
  "mustIncludeAny": ["cơ quan/từ bắt buộc 1", "bộ tài chính", ... 3-5 từ],
  "excludeWords": ["từ loại trừ 1", "từ loại trừ 2"],
  "targetAgencies": ["Tổng cục/Cục phụ trách 1", "Vụ phụ trách"],
  "targetRegulations": ["Văn bản quy phạm 1", "Văn bản quy phạm 2"],
  "boostWeight": 2.5,
  "description": "Mô tả ngắn gọn hướng dẫn tham mưu năm 2026"
}`;

        let responseText = '';
        try {
          const generatePromise = (async () => {
            try {
              const res = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: prompt,
                config: {
                  responseMimeType: 'application/json',
                  temperature: 0.2,
                  maxOutputTokens: 1024
                }
              });
              return res.text || '';
            } catch (err37) {
              const res = await ai.models.generateContent({
                model: 'gemini-flash-latest',
                contents: prompt,
                config: {
                  responseMimeType: 'application/json',
                  temperature: 0.2,
                  maxOutputTokens: 1024
                }
              });
              return res.text || '';
            }
          })();

          const timeoutPromise = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 12000)
          );

          responseText = await Promise.race([generatePromise, timeoutPromise]);
        } catch (_) {
          // Graceful fallback without noise
        }

        if (responseText) {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (_) {
        // Fallback silently to rule engine
      }
    }

    // Fallback domain rules if Gemini is unavailable or failed
    if (!result) {
      result = getFallbackAiSuggestions(kw, sec);
    }

    res.json({ success: true, suggestions: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper for fallback domain rules
function getFallbackAiSuggestions(kw: string, sec: string) {
  const lowerKw = kw.toLowerCase();
  const secObj = MOF_2026_SECTORS.find(s => s.id === sec);

  if (sec === 'leadership' || lowerKw.includes('bộ trưởng') || lowerKw.includes('thứ trưởng') || lowerKw.includes('lãnh đạo') || lowerKw.includes('cán bộ') || lowerKw.includes('bổ nhiệm')) {
    return {
      suggestedName: kw ? `Lãnh đạo & Chỉ đạo: ${kw}` : 'Lãnh đạo & Chỉ đạo Điều hành Bộ Tài chính',
      synonyms: ['bộ trưởng bộ tài chính', 'thứ trưởng bộ tài chính', 'lãnh đạo bộ tài chính', 'ban cán sự đảng bộ tài chính', 'thường trực bộ tài chính', 'chánh văn phòng bộ', 'bổ nhiệm lãnh đạo bộ', 'luân chuyển cán bộ tài chính', 'thông báo kết luận bộ trưởng'],
      mustIncludeAny: ['Bộ Tài chính', 'bộ trưởng', 'thứ trưởng', 'chỉ đạo', 'bổ nhiệm'],
      excludeWords: ['bộ trưởng bộ công an', 'bộ trưởng bộ giao thông', 'công ty tư nhân'],
      targetAgencies: ['Ban Cán sự Đảng Bộ Tài chính', 'Văn phòng Bộ Tài chính', 'Vụ Tổ chức Cán bộ - Bộ Tài chính'],
      targetRegulations: ['Nghị định quy định chức năng, nhiệm vụ Bộ Tài chính', 'Phân công công tác của Lãnh đạo Bộ Tài chính', 'Quy chế làm việc của Bộ Tài chính'],
      boostWeight: 2.8,
      description: 'Giám sát chỉ đạo điều hành, phát ngôn chính thức và quyết định của Bộ trưởng và các Thứ trưởng Bộ Tài chính.'
    };
  }

  if (sec === 'tax' || lowerKw.includes('thuế') || lowerKw.includes('vat') || lowerKw.includes('tax')) {
    return {
      suggestedName: kw ? `Thuế & Thu Ngân Sách: ${kw}` : 'Quản lý Thuế & Hóa Đơn Điện Tử 2026',
      synonyms: ['chính sách thuế', 'thuế suất', 'kê khai thuế', 'hoàn thuế GTGT', 'hóa đơn điện tử', 'thuế tối thiểu toàn cầu', 'Pillar 2', 'GMT', 'e-invoicing'],
      mustIncludeAny: ['Tổng cục Thuế', 'Bộ Tài chính', 'nghĩa vụ thuế', 'ngân sách nhà nước', 'kê khai'],
      excludeWords: ['thuế má dân sự', 'mua bán trái phép'],
      targetAgencies: ['Tổng cục Thuế (GDT)', 'Vụ Chính sách Thuế', 'Cục Thuế Doanh nghiệp lớn'],
      targetRegulations: ['Luật Quản lý thuế số 38/2019/QH14', 'Nghị quyết 107/2023/QH15', 'Nghị định 123/2020/NĐ-CP'],
      boostWeight: 2.4,
      description: 'Theo dõi chính sách thuế nội địa, thu ngân sách và thuế tối thiểu toàn cầu.'
    };
  }

  if (sec === 'securities' || lowerKw.includes('chứng khoán') || lowerKw.includes('krx') || lowerKw.includes('nâng hạng')) {
    return {
      suggestedName: kw ? `Chứng Khoán: ${kw}` : 'Thị Trường Chứng Khoán & KRX 2026',
      synonyms: ['thị trường chứng khoán', 'TTCK', 'hệ thống KRX', 'nâng hạng FTSE Russell', 'MSCI Emerging Markets', 'giao dịch không ký quỹ 100%', 'Non-Prefunding Delivery (NPF)', 'trái phiếu doanh nghiệp', 'sàn HOSE', 'sàn HNX', 'VSDC'],
      mustIncludeAny: ['UBCKNN', 'Ủy ban Chứng khoán', 'Bộ Tài chính', 'chỉ số VN-Index', 'HOSE'],
      excludeWords: ['tiền ảo', 'forex lừa đảo', 'crypto không phép'],
      targetAgencies: ['Ủy ban Chứng khoán Nhà nước (UBCKNN)', 'Sở Giao dịch Chứng khoán Việt Nam (VNX)', 'Tổng công ty Lưu ký và Bù trừ Chứng khoán (VSDC)'],
      targetRegulations: ['Thông tư 68/2024/TT-BTC', 'Luật Chứng khoán số 54/2019/QH14', 'Đề án Nâng hạng TTCK đến 2026'],
      boostWeight: 2.7,
      description: 'Giám sát hạ tầng KRX, tiến trình nâng hạng thị trường chứng khoán và trái phiếu doanh nghiệp.'
    };
  }

  return {
    suggestedName: kw ? `Nhóm Từ Khóa: ${kw}` : 'Nhóm Từ Khóa Ngữ Cảnh 2026',
    synonyms: [kw, `${kw} 2026`, `chính sách ${kw}`, `quản lý ${kw}`, `hướng dẫn ${kw}`, `chỉ đạo ${kw}`].filter(Boolean),
    mustIncludeAny: ['Bộ Tài chính', secObj?.nameVi || 'Tài chính'],
    excludeWords: ['thương mại tự do ngoài ngành'],
    targetAgencies: secObj ? [secObj.department2026] : ['Bộ Tài chính'],
    targetRegulations: ['Quy định quản lý ngành Tài chính 2026'],
    boostWeight: 2.0,
    description: `Gợi ý ngữ cảnh giám sát năm 2026 cho nhóm ${kw || sec}.`
  };
}

// GET export groups
semanticDictionaryRouter.get('/export', (req: Request, res: Response) => {
  try {
    const groups = semanticDictionaryEngine.getAllGroups();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="mof_2026_semantic_dictionary.json"');
    res.send(JSON.stringify(groups, null, 2));
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
