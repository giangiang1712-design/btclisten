/**
 * Dedicated Semantic Re-ranking Engine for Legal Frameworks & Regulatory Documents
 * Specialized for Ministry of Finance (MoF), General Department of Taxation (Tổng cục Thuế)
 * and General Department of Vietnam Customs (Tổng cục Hải quan).
 */

import { LegalFrameworkItem } from '../data/macroKnowledgeBase';
import { getRlhfDocumentMultiplier } from './rlhfFeedbackService';

export interface RegulatoryDocumentSnippet {
  id: string;
  code: string;
  title: string;
  category: 'LUAT' | 'NGHI_DINH' | 'THONG_TU' | 'NGHI_QUYET' | 'QUYET_DINH' | 'CONG_VAN' | 'POLICY_DRAFT';
  agency: string;
  effectiveYear?: number;
  summary: string;
  contentSnippet: string;
  tags: string[];
  articles?: Array<{
    number: string;
    title: string;
    content: string;
  }>;
  isActiveForAI?: boolean;
}

export interface ReRankedLegalResult {
  doc: RegulatoryDocumentSnippet;
  reRankScore: number;          // 0 - 100 Final composite score
  bm25Score: number;            // 0 - 100 Lexical relevance
  semanticScore: number;        // 0 - 100 Embedding / Contextual affinity
  hierarchyWeight: number;      // 0.70 - 1.0 Authority hierarchy factor
  domainRelevanceBoost: number; // Domain specific bonus (Thuế, Hải quan, Ngân sách)
  matchedKeyTerms: string[];
  extractedClauses: string[];
  relevanceRationale: string;
  advisoryTip: string;
}

// Normalize Vietnamese string for robust accent-insensitive and diacritic-agnostic matching
export function normalizeVi(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Specialized Taxonomy of Domain Thesaurus & Synonym Expansion for Tax & Customs
export const TAX_CUSTOMS_THESAURUS: Record<string, { synonyms: string[]; domain: 'TAX' | 'CUSTOMS' | 'TREASURY' | 'SECURITIES' | 'MACRO'; boost: number }> = {
  // Tax Core Terms
  'hoan thue': {
    synonyms: ['hoan thue vat', 'kiem truoc hoan sau', 'hoan truoc kiem sau', 'ho so hoan thue', 'vat dau vao', 'thue xuat khau'],
    domain: 'TAX',
    boost: 1.8
  },
  'hoa don dien tu': {
    synonyms: ['hoa don may tinh tien', 'hoa don co ma', 'hoa don khong co ma', 'hoa don xang dau', 'gian lan hoa don', 'hoa don dien tu tung lan'],
    domain: 'TAX',
    boost: 1.7
  },
  'thue tmdt': {
    synonyms: ['thuong mai dien tu', 'san tmdt', 'livestream', 'nha cung cap nuoc ngoai', 'khau tru nop thay', 'cong thong tin dien tu nha cung cap nuoc ngoai'],
    domain: 'TAX',
    boost: 1.75
  },
  'thue toi thieu toan cau': {
    synonyms: ['qdmtt', 'tru cot 2 oecd', 'thue tndn bo sung', 'chong xoi mon co so thue', '750 trieu eur', 'tap doan da quoc gia'],
    domain: 'TAX',
    boost: 1.9
  },
  'giam thue vat': {
    synonyms: ['giam thue 8', 'giam 2 thue vat', 'chinh sach giam thue', 'nghi nghi dinh 72', 'nghi dinh 94', 'nghi dinh 44'],
    domain: 'TAX',
    boost: 1.65
  },
  'thue tncn': {
    synonyms: ['thu nhap ca nhan', 'giam tru gia canh', 'bieu thue luy tien', 'quyet toan thue tncn', 'nguoi phu thuoc'],
    domain: 'TAX',
    boost: 1.6
  },
  'chong that thu thue': {
    synonyms: ['thanh tra kiem tra thue', 'truy thu thue', 'xac minh hoa don', 'rui ro thue', 'quan ly no thue', 'cuong che thue'],
    domain: 'TAX',
    boost: 1.7
  },

  // Customs Core Terms
  'thong quan': {
    synonyms: ['thu tuc hai quan', 'phan luong to khai', 'luong xanh', 'luong vang', 'luong do', 'vnaccs', 'vcis', 'thong quan tu dong'],
    domain: 'CUSTOMS',
    boost: 1.85
  },
  'kiem tra sau thong quan': {
    synonyms: ['pca', 'post clearance audit', 'kiem tra tai tru so doanh nghiep', 'kiem tra tai co quan hai quan', 'an dinh thue hai quan'],
    domain: 'CUSTOMS',
    boost: 1.8
  },
  'xuat xu hang hoa': {
    synonyms: ['co', 'chung nhan xuat xu', 'form eur 1', 'form cptpp', 'form rcep', 'form ak', 'form aj', 'gian lan xuat xu', 'chuyen tai bat hop phap'],
    domain: 'CUSTOMS',
    boost: 1.8
  },
  'bieu thue xuat nhap khau': {
    synonyms: ['thue suat mfn', 'thue suat fta', 'thue suat uu dai dac biet', 'ma hs', 'phan loai hang hoa', 'tri gia tinh thue hai quan'],
    domain: 'CUSTOMS',
    boost: 1.75
  },
  'mot cua quoc gia': {
    synonyms: ['nsw', 'asw', 'mot cua asean', 'kiem tra chuyen nganh', 'giam thoi gian thong quan', 'cang bien'],
    domain: 'CUSTOMS',
    boost: 1.7
  },
  'mien thue gia cong': {
    synonyms: ['san xuat xuat khau', 'nguyen lieu nhap khau', 'hoan thue nhap khau', 'dieu kien mien thue', 'bao cao quyet toan hai quan'],
    domain: 'CUSTOMS',
    boost: 1.75
  },
  'chong buon lau': {
    synonyms: ['gian lan thuong mai', 'hang gia', 'van chuyen trai phep', 'kiem soat hai quan', 'hai quan cua khau'],
    domain: 'CUSTOMS',
    boost: 1.65
  }
};

// Hierarchy Weight Factor (Strict Institutional Rule: Constitution/Law > Decree > Circular > Guidance)
export const LEGAL_HIERARCHY_WEIGHTS: Record<string, number> = {
  'LUAT': 1.0,         // Luật Quốc hội (High authority)
  'NGHI_QUYET': 0.95,   // Nghị quyết Quốc hội / Ủy ban Thường vụ Quốc hội
  'NGHI_DINH': 0.88,    // Nghị định Chính phủ
  'QUYET_DINH': 0.82,   // Quyết định Thủ tướng Chính phủ
  'THONG_TU': 0.80,     // Thông tư Bộ Tài chính
  'CONG_VAN': 0.72,     // Công văn hướng dẫn nghiệp vụ Tổng cục
  'POLICY_DRAFT': 0.75  // Dự thảo chính sách đang lấy ý kiến
};

/**
 * Expand query with tax & customs thesaurus synonyms
 */
export function expandQueryDomainTokens(query: string): {
  normalizedTokens: string[];
  expandedTerms: string[];
  detectedSector: 'TAX' | 'CUSTOMS' | 'TREASURY' | 'SECURITIES' | 'MACRO' | 'GENERAL';
  isTaxSpecific: boolean;
  isCustomsSpecific: boolean;
} {
  const normQuery = normalizeVi(query);
  const baseTokens = normQuery.split(' ').filter(t => t.length > 1);
  const expandedSet = new Set<string>();
  let detectedSector: 'TAX' | 'CUSTOMS' | 'TREASURY' | 'SECURITIES' | 'MACRO' | 'GENERAL' = 'GENERAL';
  let isTaxSpecific = false;
  let isCustomsSpecific = false;

  let taxHits = 0;
  let customsHits = 0;

  for (const [keyTerm, config] of Object.entries(TAX_CUSTOMS_THESAURUS)) {
    if (normQuery.includes(keyTerm) || config.synonyms.some(s => normQuery.includes(s))) {
      expandedSet.add(keyTerm);
      config.synonyms.forEach(s => expandedSet.add(s));

      if (config.domain === 'TAX') taxHits += 1;
      if (config.domain === 'CUSTOMS') customsHits += 1;
    }
  }

  // Broad checks
  if (normQuery.includes('thue') || normQuery.includes('vat') || normQuery.includes('tndn') || normQuery.includes('tncn') || normQuery.includes('hoa don') || normQuery.includes('tong cuc thue')) {
    taxHits += 3;
  }
  if (normQuery.includes('hai quan') || normQuery.includes('thong quan') || normQuery.includes('xuat nhap khau') || normQuery.includes('to khai') || normQuery.includes('luong xanh') || normQuery.includes('tong cuc hai quan')) {
    customsHits += 3;
  }

  if (taxHits > 0 || customsHits > 0) {
    if (taxHits >= customsHits) {
      detectedSector = 'TAX';
      isTaxSpecific = true;
    } else {
      detectedSector = 'CUSTOMS';
      isCustomsSpecific = true;
    }
  }

  return {
    normalizedTokens: baseTokens,
    expandedTerms: Array.from(expandedSet),
    detectedSector,
    isTaxSpecific,
    isCustomsSpecific
  };
}

/**
 * Compute BM25-style lexical matching score
 */
function computeLexicalBM25(
  tokens: string[],
  docTitleNorm: string,
  docContentNorm: string,
  docTagsNorm: string
): { score: number; matchedTerms: string[] } {
  if (tokens.length === 0) return { score: 20, matchedTerms: [] };

  let termHits = 0;
  const matched = new Set<string>();

  for (const t of tokens) {
    if (t.length < 2) continue;
    let hit = false;
    if (docTitleNorm.includes(t)) {
      termHits += 3.5;
      hit = true;
    }
    if (docTagsNorm.includes(t)) {
      termHits += 2.5;
      hit = true;
    }
    if (docContentNorm.includes(t)) {
      termHits += 1.0;
      hit = true;
    }
    if (hit) matched.add(t);
  }

  const maxPossible = tokens.length * 3.5;
  const rawScore = (termHits / (maxPossible || 1)) * 100;
  return {
    score: Math.min(100, Math.round(rawScore)),
    matchedTerms: Array.from(matched)
  };
}

/**
 * Compute Cross-Encoder Style Semantic Context Score
 */
function computeSemanticContextScore(
  normQuery: string,
  expandedTerms: string[],
  docTextNorm: string,
  docAgency: string,
  isTaxQuery: boolean,
  isCustomsQuery: boolean
): { score: number; rationale: string; bonus: number } {
  let semanticScore = 35;
  let bonus = 0;
  const matchedConcepts: string[] = [];

  // Check synonym and concept matches
  for (const term of expandedTerms) {
    if (docTextNorm.includes(term)) {
      semanticScore += 12;
      matchedConcepts.push(term);
    }
  }

  const agencyNorm = normalizeVi(docAgency);
  // Sector alignment boost
  if (isTaxQuery) {
    if (agencyNorm.includes('thue') || agencyNorm.includes('tong cuc thue') || docTextNorm.includes('quan ly thue') || docTextNorm.includes('ngan sach')) {
      bonus += 25;
    }
    if (normQuery.includes('hoan thue') && docTextNorm.includes('hoan thue')) {
      bonus += 20;
    }
    if (normQuery.includes('hoa don') && docTextNorm.includes('hoa don')) {
      bonus += 20;
    }
    if (normQuery.includes('tmdt') && (docTextNorm.includes('thuong mai dien tu') || docTextNorm.includes('xuyen bien gioi'))) {
      bonus += 20;
    }
  }

  if (isCustomsQuery) {
    if (agencyNorm.includes('hai quan') || agencyNorm.includes('tong cuc hai quan') || docTextNorm.includes('thong quan') || docTextNorm.includes('xuat nhap khau')) {
      bonus += 25;
    }
    if (normQuery.includes('phan luong') && (docTextNorm.includes('luong xanh') || docTextNorm.includes('luong do') || docTextNorm.includes('luong vang'))) {
      bonus += 20;
    }
    if (normQuery.includes('xuat xu') && (docTextNorm.includes('co') || docTextNorm.includes('xuat xu'))) {
      bonus += 20;
    }
  }

  semanticScore = Math.min(100, Math.round(semanticScore + bonus));

  let rationale = 'Tài liệu pháp quy tham chiếu chung';
  if (matchedConcepts.length > 0) {
    rationale = `Khớp khái niệm ngữ nghĩa chuyên sâu: ${matchedConcepts.slice(0, 3).join(', ')}`;
  } else if (bonus > 0) {
    rationale = isTaxQuery
      ? 'Căn cứ điều hành then chốt ngành Thuế & Quản lý thu NSNN'
      : 'Quy chuẩn thông quan và kiểm soát hải quan chuyên ngành';
  }

  return {
    score: semanticScore,
    rationale,
    bonus
  };
}

/**
 * Extract key clauses / articles mentioning relevant query topics
 */
function extractRelevantClauses(snippet: string, queryTokens: string[]): string[] {
  if (!snippet) return [];
  const lines = snippet.split(/\n|\r\n|\.\s+/);
  const matchedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 15) continue;
    const lineNorm = normalizeVi(trimmed);
    if (queryTokens.some(t => lineNorm.includes(t))) {
      matchedLines.push(trimmed);
      if (matchedLines.length >= 3) break;
    }
  }

  return matchedLines.length > 0 ? matchedLines : [snippet.slice(0, 200) + '...'];
}

/**
 * Main Semantic Re-Ranking Function
 * Ranks all regulatory and legal documents in two stages:
 * Stage 1: Fast multi-field token retrieval with thesaurus expansion
 * Stage 2: Cross-Encoder semantic score fusion with legal hierarchy weighting
 */
export function rerankLegalDocuments(
  query: string,
  documents: RegulatoryDocumentSnippet[],
  options: {
    maxResults?: number;
    threshold?: number;
    preferredSector?: 'TAX' | 'CUSTOMS' | 'TREASURY' | 'SECURITIES' | 'ALL';
  } = {}
): {
  rankedDocuments: ReRankedLegalResult[];
  queryAnalysis: ReturnType<typeof expandQueryDomainTokens>;
  topLegalCitationsMarkdown: string;
} {
  const maxResults = options.maxResults || 6;
  const threshold = options.threshold || 20;
  const queryAnalysis = expandQueryDomainTokens(query);
  const normQuery = normalizeVi(query);

  const results: ReRankedLegalResult[] = [];

  for (const doc of documents) {
    // Check if doc is active for AI
    if (doc.isActiveForAI === false) continue;

    const titleNorm = normalizeVi(doc.title);
    const summaryNorm = normalizeVi(doc.summary || '');
    const contentNorm = normalizeVi(doc.contentSnippet || '');
    const tagsNorm = normalizeVi((doc.tags || []).join(' '));
    const combinedText = `${titleNorm} ${summaryNorm} ${contentNorm} ${tagsNorm}`;

    // 1. Stage 1: BM25 Lexical Score
    const bm25 = computeLexicalBM25(
      queryAnalysis.normalizedTokens,
      titleNorm,
      contentNorm,
      tagsNorm
    );

    // 2. Stage 2: Cross-Encoder Semantic Affinity Score
    const semantic = computeSemanticContextScore(
      normQuery,
      queryAnalysis.expandedTerms,
      combinedText,
      doc.agency,
      queryAnalysis.isTaxSpecific,
      queryAnalysis.isCustomsSpecific
    );

    // 3. Hierarchy Weight Factor
    const hierarchyFactor = LEGAL_HIERARCHY_WEIGHTS[doc.category] || 0.80;

    // 4. Exact Law/Decree Code Mention Boost (e.g. user typed "Luật 38", "Nghị định 123", "Thông tư 78")
    let exactCodeBonus = 0;
    const docCodeNorm = normalizeVi(doc.code);
    if (docCodeNorm && normQuery.includes(docCodeNorm)) {
      exactCodeBonus = 30;
    }

    // 5. RLHF Dynamic Multiplier from Continuous User Feedback Loop
    const rlhfMultiplier = getRlhfDocumentMultiplier(doc.code);

    // 6. Final Composite Re-Rank Score Fusion
    // Formula: ReRank = (0.30 * BM25 + 0.40 * Semantic + 0.15 * ExactBonus + 0.15 * DomainBonus) * HierarchyFactor * RlhfMultiplier
    const weightedRaw =
      (0.30 * bm25.score) +
      (0.40 * semantic.score) +
      (0.15 * exactCodeBonus) +
      (0.15 * (semantic.bonus > 0 ? 100 : 30));

    const finalReRankScore = Math.min(100, Math.round(weightedRaw * hierarchyFactor * rlhfMultiplier));

    if (finalReRankScore >= threshold) {
      const extractedClauses = extractRelevantClauses(doc.contentSnippet, queryAnalysis.normalizedTokens);

      // Construct practical advisory tip
      let advisoryTip = `Áp dụng đúng quy định tại ${doc.code} để đảm bảo tính pháp lý.`;
      if (queryAnalysis.isTaxSpecific) {
        advisoryTip = `Trích dẫn Điều khoản của ${doc.code} trong văn bản chỉ đạo Cục Thuế/Chi cục Thuế để tháo gỡ vướng mắc cho NNT.`;
      } else if (queryAnalysis.isCustomsSpecific) {
        advisoryTip = `Căn cứ ${doc.code} để hướng dẫn Chi cục Hải quan xử lý thủ tục thông quan và kiểm tra sau thông quan.`;
      }

      results.push({
        doc,
        reRankScore: finalReRankScore,
        bm25Score: bm25.score,
        semanticScore: semantic.score,
        hierarchyWeight: hierarchyFactor,
        domainRelevanceBoost: semantic.bonus,
        matchedKeyTerms: bm25.matchedTerms,
        extractedClauses,
        relevanceRationale: semantic.rationale,
        advisoryTip
      });
    }
  }

  // Sort descending by reRankScore
  results.sort((a, b) => b.reRankScore - a.reRankScore);
  const topRanked = results.slice(0, maxResults);

  // Generate formatted legal citations markdown for Chatbot prompt injection
  const citationsMd = topRanked.length > 0
    ? topRanked.map((item, idx) => {
        return `[CĂN CỨ PHÁP LÝ TÁI XẾP HẠNG NGỮ NGHĨA #${idx + 1} - ĐIỂM RE-RANK: ${item.reRankScore}/100]\n` +
          `• **Văn bản:** ${item.doc.title} (${item.doc.code || item.doc.category})\n` +
          `• **Cơ quan ban hành:** ${item.doc.agency} | **Thứ bậc pháp lý:** ${item.doc.category} (Hệ số: ${item.hierarchyWeight})\n` +
          `• **Lý do AI xếp hạng:** ${item.relevanceRationale}\n` +
          `• **Trích yếu quy phạm / Điều khoản then chốt:**\n` +
          `  ${item.extractedClauses.map(c => `> "${c}"`).join('\n  ')}\n` +
          `• **Gợi ý tham mưu áp dụng:** ${item.advisoryTip}`;
      }).join('\n\n')
    : 'Không có căn cứ pháp lý nào vượt qua ngưỡng xếp hạng.';

  return {
    rankedDocuments: topRanked,
    queryAnalysis,
    topLegalCitationsMarkdown: citationsMd
  };
}
