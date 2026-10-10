import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

export interface ServerAiExclusionRule {
  id: string;
  name: string;
  userNote: string;
  category: string;
  keywords: string[];
  domains?: string[];
  articleId?: string;
  articleTitle?: string;
  articleUrl?: string;
  aiExplanation?: string;
  createdAt: string;
  hitCount: number;
  isActive: boolean;
}

const RULES_FILE_PATH = path.join(process.cwd(), 'data', 'ai_exclusion_rules.json');

export class AiExclusionManager {
  private rules: ServerAiExclusionRule[] = [];
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(RULES_FILE_PATH)) {
        const raw = fs.readFileSync(RULES_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.rules = parsed;
          console.log(`🤖 [AI Exclusion Filter] Loaded ${this.rules.length} AI exclusion rules from ${RULES_FILE_PATH}`);
          return;
        }
      }
    } catch (err: any) {
      console.warn('[AI Exclusion Filter] Warning loading rules from disk:', err?.message || err);
    }

    // Default Seed Rules for High-Accuracy MoF News Intelligence
    this.rules = [
      {
        id: 'rule_seed_bds_phan_lo',
        name: 'Chặn tin phân lô bán nền & quảng cáo đất lẻ cá nhân',
        userNote: 'Các bài viết phân lô bán nền cá nhân, bán đất dịch vụ nông nghiệp không thuộc thẩm quyền và không phản ánh thị trường tài chính vĩ mô.',
        category: 'bds_quang_cao',
        keywords: ['phân lô bán nền', 'đất nền giá rẻ', 'sổ hồng trao tay', 'bán đất vườn', 'cắt lỗ đất nền', 'đất nền ven đô'],
        createdAt: new Date().toISOString(),
        hitCount: 0,
        isActive: true,
        aiExplanation: 'Bộ lọc tự động loại trừ các tin rao vặt phân lô bán nền cá nhân, giữ lại tin chính sách đất đai và bất động sản vĩ mô.',
      },
      {
        id: 'rule_seed_showbiz_gossip',
        name: 'Chặn tin đời sống nghệ sĩ & giải trí không liên quan',
        userNote: 'Chặn các tin showbiz, đời tư người nổi tiếng, giải trí không liên quan hoạt động kinh tế tài chính.',
        category: 'giai_tri_doi_song',
        keywords: ['showbiz', 'đám cưới thế kỷ', 'sao việt', 'hoa hậu', 'scandal', 'ly hôn sao', 'diễn viên', 'người mẫu'],
        createdAt: new Date().toISOString(),
        hitCount: 0,
        isActive: true,
        aiExplanation: 'Loại bỏ tin tức đời tư và sự kiện giải trí không mang giá trị quản lý tài chính nhà nước.',
      },
    ];
    this.saveToDiskSync();
  }

  public saveToDiskSync() {
    try {
      const dir = path.dirname(RULES_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(RULES_FILE_PATH, JSON.stringify(this.rules, null, 2), 'utf-8');
    } catch (err: any) {
      console.error('[AI Exclusion Filter] Error saving rules to disk:', err?.message || err);
    }
  }

  public debouncedSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveToDiskSync();
      this.saveTimeout = null;
    }, 2000);
  }

  public getAllRules(): ServerAiExclusionRule[] {
    return this.rules;
  }

  public getActiveRules(): ServerAiExclusionRule[] {
    return this.rules.filter((r) => r.isActive !== false);
  }

  public addRule(ruleData: Partial<ServerAiExclusionRule>): ServerAiExclusionRule {
    const id = ruleData.id || `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const cleanKeywords = (ruleData.keywords || [])
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length >= 2);

    const newRule: ServerAiExclusionRule = {
      id,
      name: ruleData.name?.trim() || 'Quy tắc loại trừ tin không phù hợp',
      userNote: ruleData.userNote?.trim() || '',
      category: ruleData.category || 'khac',
      keywords: cleanKeywords,
      domains: ruleData.domains || [],
      articleId: ruleData.articleId,
      articleTitle: ruleData.articleTitle,
      articleUrl: ruleData.articleUrl,
      aiExplanation: ruleData.aiExplanation || 'Quy tắc do người dùng huấn luyện AI để tự động loại trừ các bài viết tương tự.',
      createdAt: ruleData.createdAt || new Date().toISOString(),
      hitCount: 0,
      isActive: true,
    };

    // Prepend new rule
    this.rules.unshift(newRule);
    this.saveToDiskSync();
    console.log(`✨ [AI Exclusion Filter] Registered new user AI exclusion rule: "${newRule.name}" with ${cleanKeywords.length} keywords.`);
    return newRule;
  }

  public deleteRule(id: string): boolean {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx !== -1) {
      this.rules.splice(idx, 1);
      this.saveToDiskSync();
      console.log(`🗑️ [AI Exclusion Filter] Deleted rule: ${id}`);
      return true;
    }
    return false;
  }

  public toggleRule(id: string, active?: boolean): ServerAiExclusionRule | null {
    const rule = this.rules.find((r) => r.id === id);
    if (!rule) return null;
    rule.isActive = active !== undefined ? active : !rule.isActive;
    this.saveToDiskSync();
    return rule;
  }

  /**
   * Evaluates an article against all active AI exclusion rules.
   * Returns whether it should be excluded and which rule/keyword triggered it.
   */
  public isArticleExcluded(
    title: string,
    snippet: string = '',
    url: string = '',
    source: string = ''
  ): { excluded: boolean; matchedRule?: ServerAiExclusionRule; matchedKeyword?: string } {
    const activeRules = this.getActiveRules();
    if (activeRules.length === 0) {
      return { excluded: false };
    }

    const lowerTitle = (title || '').toLowerCase();
    const lowerSnippet = (snippet || '').toLowerCase();
    const lowerText = `${lowerTitle} ${lowerSnippet}`;
    const lowerUrl = (url || '').toLowerCase();

    for (const rule of activeRules) {
      // 1. Direct URL match if articleUrl was explicitly saved
      if (rule.articleUrl && lowerUrl && (rule.articleUrl.toLowerCase() === lowerUrl || lowerUrl.includes(rule.articleUrl.toLowerCase()))) {
        rule.hitCount = (rule.hitCount || 0) + 1;
        this.debouncedSave();
        return { excluded: true, matchedRule: rule, matchedKeyword: 'Trùng khớp liên kết bài viết' };
      }

      // 2. Keyword/phrase match
      for (const kw of rule.keywords) {
        if (!kw || kw.length < 2) continue;
        const lowerKw = kw.toLowerCase().trim();
        if (lowerText.includes(lowerKw)) {
          rule.hitCount = (rule.hitCount || 0) + 1;
          this.debouncedSave();
          return { excluded: true, matchedRule: rule, matchedKeyword: kw };
        }
      }

      // 3. Domain match
      if (rule.domains && rule.domains.length > 0) {
        for (const dom of rule.domains) {
          const lowerDom = dom.toLowerCase().trim();
          if (lowerDom && (lowerUrl.includes(lowerDom) || (source && source.toLowerCase().includes(lowerDom)))) {
            rule.hitCount = (rule.hitCount || 0) + 1;
            this.debouncedSave();
            return { excluded: true, matchedRule: rule, matchedKeyword: `Nguồn tin: ${dom}` };
          }
        }
      }
    }

    return { excluded: false };
  }

  /**
   * Uses Gemini AI to analyze the user's note and article, generating optimal exclusion keywords and a rule name.
   */
  public async analyzeExclusionWithGemini(
    ai: GoogleGenAI,
    title: string,
    snippet: string,
    userNote: string
  ): Promise<{
    ruleName: string;
    category: string;
    keywords: string[];
    aiExplanation: string;
  }> {
    const prompt = `Bạn là Chuyên gia Trí tuệ Nhân tạo giám sát và lọc tin tức cho Lãnh đạo Bộ Tài chính Việt Nam.
Người dùng là chuyên viên / lãnh đạo đang quản lý luồng tin tức và phát hiện bài viết sau KHÔNG PHÙ HỢP / KHÔNG NÊN QUÉT DÍNH:

- Tiêu đề bài viết: "${title}"
- Tóm tắt nội dung: "${snippet.substring(0, 400)}"
- Ghi chú / lý do của người dùng: "${userNote}"

Nhiệm vụ của bạn:
1. Đặt một tên quy tắc ngắn gọn, chuẩn nghiệp vụ (ruleName).
2. Phân loại vào một trong các nhóm danh mục (category):
   'bds_quang_cao' (Quảng cáo BĐS cá nhân/dự án) |
   'ngoai_nganh' (Không thuộc quản lý tài chính/Bộ Tài chính) |
   'giai_tri_doi_song' (Giải trí, showbiz, đời sống) |
   'nham_tu_khoa' (Dùng từ ngữ tài chính theo nghĩa bóng hoặc nhầm lẫn) |
   'tin_nuoc_ngoai' (Tin quốc tế không liên quan kinh tế VN) |
   'tin_rac' (Spam, giật tít câu view) |
   'khac'.
3. Trích xuất danh sách 3 đến 6 cụm từ khóa (keywords) cốt lõi đặc trưng bằng tiếng Việt để từ các phiên quét sau, robot cào tin sẽ tự động chặn và không nạp các tin tương tự.
   LƯU Ý CỰC KỲ QUAN TRỌNG: KHÔNG chọn các từ khóa quá chung chung như 'tiền', 'thuế', 'ngân sách', 'bộ tài chính', 'doanh nghiệp' vì sẽ làm mất tin tài chính thật. Hãy chọn cụm từ 2-4 từ mang tính đặc trưng của tin rác/không phù hợp đó (ví dụ: 'đất nền giá rẻ', 'sổ hồng trao tay', 'showbiz', 'scandal', 'hẹn hò', 'mua nhà tặng vàng').
4. Giải thích 1-2 câu cơ chế chặn của AI (aiExplanation).

Trả về DUY NHẤT một khối JSON hợp lệ theo cấu trúc sau (không kèm markdown thừa):
{
  "ruleName": "string",
  "category": "string",
  "keywords": ["cụm từ 1", "cụm từ 2", "cụm từ 3"],
  "aiExplanation": "string"
}`;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '';
        const parsed = JSON.parse(rawText);
        if (parsed && Array.isArray(parsed.keywords)) {
          return {
            ruleName: parsed.ruleName || `Chặn tin tương tự: ${title.substring(0, 40)}`,
            category: parsed.category || 'khac',
            keywords: parsed.keywords.map((k: string) => String(k).trim()).filter(Boolean),
            aiExplanation: parsed.aiExplanation || 'Hệ thống đã ghi nhận ghi chú và tạo bộ lọc từ khóa ngăn quét dính lần sau.',
          };
        }
      } catch (err: any) {
        console.warn(`[AI Exclusion Analyze] Attempt with model ${model} failed:`, err?.message || err);
      }
    }

    // Heuristic fallback if Gemini API is unavailable or rate-limited
    const cleanUserWords = userNote
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const fallbackKeywords: string[] = [];
    if (userNote.includes('bất động sản') || userNote.includes('đất nền') || title.includes('đất nền')) {
      fallbackKeywords.push('đất nền', 'phân lô', 'sổ hồng trao tay');
    } else if (userNote.includes('quảng cáo') || title.includes('mở bán')) {
      fallbackKeywords.push('mở bán dự án', 'ưu đãi chiết khấu');
    } else if (cleanUserWords.length >= 2) {
      fallbackKeywords.push(cleanUserWords.slice(0, 3).join(' '));
    } else {
      fallbackKeywords.push(title.split(' ').slice(0, 3).join(' '));
    }

    return {
      ruleName: `Loại trừ tin: ${title.substring(0, 45)}...`,
      category: 'khac',
      keywords: fallbackKeywords,
      aiExplanation: `Quy tắc được tạo dựa trên ghi chú của người dùng: "${userNote}". Hệ thống sẽ chặn các tin chứa các từ khóa này trong các lần quét tiếp theo.`,
    };
  }
}

export const aiExclusionManager = new AiExclusionManager();
