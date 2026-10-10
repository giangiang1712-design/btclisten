import { ScrapedNewsItem } from '../types';
import {
  VIETNAM_FINANCIAL_LEGAL_BASE,
  MACRO_FINANCIAL_BENCHMARKS,
  LegalFrameworkItem
} from '../data/macroKnowledgeBase';
import {
  DECREE_376_100_SCENARIOS,
  Decree376ScenarioItem,
  searchDecree376ScenariosForRag
} from './decree376Handbook100Scenarios';
import {
  rerankLegalDocuments,
  RegulatoryDocumentSnippet,
  ReRankedLegalResult,
  expandQueryDomainTokens,
  normalizeVi
} from './legalSemanticReranker';

export interface RagScoredArticle {
  article: ScrapedNewsItem;
  totalScore: number;
  bm25Score: number;
  semanticAffinityScore: number;
  authorityScore: number;
  urgencyDecayScore: number;
  smartFilterBonus: number;
  relevanceExplanation: string;
  matchedKeywords: string[];
  matchedLegalBases: string[];
}

export interface HybridRagResult {
  topArticles: RagScoredArticle[];
  matchedLegalFramework: LegalFrameworkItem[];
  semanticLegalReRankResults: ReRankedLegalResult[];
  legalCitationsPromptContext: string;
  matchedBenchmarks: typeof MACRO_FINANCIAL_BENCHMARKS;
  matchedDecree376Scenarios: Decree376ScenarioItem[];
  decree376PromptContext: string;
  queryIntent: {
    category: 'chinh_sach' | 'dan_doanh_nghiep' | 'thi_truong_von' | 'khung_hoang_truyen_thong' | 'tong_hop_vi_mo' | 'thue_hai_quan';
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    primarySectors: string[];
    actionTypeSuggested: 'draft_statement' | 'policy_submission' | 'deep_dive' | 'gmail_alert' | 'impact_chain' | null;
    isTaxSpecific?: boolean;
    isCustomsSpecific?: boolean;
  };
  executiveContextSummary: string;
}

// Normalize Vietnamese string for robust accent-insensitive matching
export function normalizeVietnameseText(str: string): string {
  return normalizeVi(str);
}

// Financial and legal vocabulary weights for domain semantic scoring
const DOMAIN_KEYWORD_WEIGHTS: Record<string, { weight: number; sector: string; isPolicy?: boolean; isPublicConcern?: boolean }> = {
  // Policy & Institution
  'nghi dinh': { weight: 1.8, sector: 'macro', isPolicy: true },
  'thong tu': { weight: 1.8, sector: 'macro', isPolicy: true },
  'du thao luat': { weight: 1.9, sector: 'macro', isPolicy: true },
  'chi dao': { weight: 1.5, sector: 'macro', isPolicy: true },
  'quyet dinh': { weight: 1.4, sector: 'macro', isPolicy: true },
  'to trinh': { weight: 1.6, sector: 'macro', isPolicy: true },
  'tai khoa': { weight: 1.5, sector: 'budget', isPolicy: true },
  'bo tai chinh': { weight: 1.6, sector: 'macro', isPolicy: true },
  'nghi dinh 376': { weight: 2.5, sector: 'macro', isPolicy: true },
  '376': { weight: 2.0, sector: 'macro', isPolicy: true },
  '34 co quan': { weight: 2.2, sector: 'macro', isPolicy: true },
  'cuc quan ly dau thau': { weight: 2.2, sector: 'macro', isPolicy: true },
  'dau thau': { weight: 1.9, sector: 'macro', isPolicy: true },
  'cuc dau tu nuoc ngoai': { weight: 2.2, sector: 'macro', isPolicy: true },
  'fdi': { weight: 2.0, sector: 'macro', isPolicy: true },
  'cuc thong ke': { weight: 2.2, sector: 'macro', isPolicy: true },
  'bao hiem xa hoi viet nam': { weight: 2.2, sector: 'macro', isPolicy: true },
  'bhxh': { weight: 2.0, sector: 'macro', isPolicy: true },
  'vu quan ly quy hoach': { weight: 2.2, sector: 'macro', isPolicy: true },
  'tong cuc thue': { weight: 1.8, sector: 'tax', isPolicy: true },
  'hai quan': { weight: 1.8, sector: 'customs', isPolicy: true },
  'kho bac': { weight: 1.5, sector: 'treasury', isPolicy: true },
  'ubcknn': { weight: 1.6, sector: 'stocks', isPolicy: true },

  // Tax & Customs Specifics
  'hoan thue': { weight: 2.2, sector: 'tax', isPublicConcern: true },
  'vat': { weight: 1.8, sector: 'tax', isPublicConcern: true },
  'cham hoan thue': { weight: 2.4, sector: 'tax', isPublicConcern: true },
  'giam tru gia canh': { weight: 2.0, sector: 'tax', isPublicConcern: true },
  'thue tncn': { weight: 2.0, sector: 'tax', isPublicConcern: true },
  'hoa don dien tu': { weight: 2.0, sector: 'tax', isPublicConcern: true },
  'hoa don may tinh tien': { weight: 2.1, sector: 'tax', isPublicConcern: true },
  'thue tmdt': { weight: 2.1, sector: 'tax', isPublicConcern: true },
  'livestream': { weight: 1.9, sector: 'tax', isPublicConcern: true },
  'thue toi thieu toan cau': { weight: 2.2, sector: 'tax', isPolicy: true },
  'giam thue 8': { weight: 2.0, sector: 'tax', isPolicy: true },

  'thong quan': { weight: 2.2, sector: 'customs', isPolicy: true },
  'phan luong': { weight: 2.1, sector: 'customs', isPolicy: true },
  'luong xanh': { weight: 2.0, sector: 'customs', isPolicy: true },
  'luong do': { weight: 2.2, sector: 'customs', isPublicConcern: true },
  'kiem tra sau thong quan': { weight: 2.2, sector: 'customs', isPolicy: true },
  'xuat xu hang hoa': { weight: 2.1, sector: 'customs', isPolicy: true },
  'co form': { weight: 2.0, sector: 'customs', isPolicy: true },
  'bieu thue fta': { weight: 2.0, sector: 'customs', isPolicy: true },
  'mot cua quoc gia': { weight: 2.0, sector: 'customs', isPolicy: true },

  // Public & Enterprise Concerns
  'vuong mac': { weight: 1.7, sector: 'enterprise', isPublicConcern: true },
  'doanh nghiep keu': { weight: 2.0, sector: 'enterprise', isPublicConcern: true },
  'kien nghi': { weight: 1.6, sector: 'enterprise', isPublicConcern: true },
  'kho khan': { weight: 1.5, sector: 'enterprise', isPublicConcern: true },
  'trai chu': { weight: 1.9, sector: 'bonds', isPublicConcern: true },
  'dao han trai phieu': { weight: 2.0, sector: 'bonds', isPublicConcern: true },
  'giai ngan dau tu cong': { weight: 1.8, sector: 'treasury', isPolicy: true },
  'tien do cham': { weight: 1.7, sector: 'treasury', isPublicConcern: true },
  'gia vang': { weight: 1.8, sector: 'prices', isPublicConcern: true },
  'sjc': { weight: 1.8, sector: 'prices', isPublicConcern: true },
  'nang hang': { weight: 1.9, sector: 'stocks', isPolicy: true },
  'non prefunding': { weight: 2.0, sector: 'stocks', isPolicy: true },
  'tin don': { weight: 2.2, sector: 'crisis', isPublicConcern: true },
  'that thiet': { weight: 2.2, sector: 'crisis', isPublicConcern: true },
  'dinh chinh': { weight: 2.0, sector: 'crisis', isPolicy: true },

  // 4 Warning Tiers, SOP, and RAG Guidance Keywords
  'canh bao xa': { weight: 2.3, sector: 'macro', isPolicy: true },
  'canh bao som': { weight: 2.3, sector: 'macro', isPolicy: true },
  'canh bao nhanh': { weight: 2.5, sector: 'crisis', isPolicy: true },
  'canh bao truc tiep': { weight: 2.5, sector: 'crisis', isPolicy: true },
  'khan cap': { weight: 2.7, sector: 'crisis', isPolicy: true },
  'sop 4': { weight: 2.6, sector: 'crisis', isPolicy: true },
  'sop 3': { weight: 2.4, sector: 'crisis', isPolicy: true },
  'sop 2': { weight: 2.2, sector: 'macro', isPolicy: true },
  'sop 1': { weight: 2.2, sector: 'macro', isPolicy: true },
  'khoang trong thong tin': { weight: 2.5, sector: 'crisis', isPublicConcern: true },
  'do venh': { weight: 2.4, sector: 'crisis', isPolicy: true },
  'divergence': { weight: 2.2, sector: 'crisis', isPolicy: true },
  'risk score': { weight: 2.4, sector: 'macro', isPolicy: true },
  'luong hoa rui ro': { weight: 2.3, sector: 'macro', isPolicy: true },
  'chi dao khanh': { weight: 2.5, sector: 'crisis', isPolicy: true },
  'van de can chi dao': { weight: 2.6, sector: 'crisis', isPolicy: true }
};

// Authority source rating
const AUTHORITY_RATINGS: Record<string, number> = {
  'thời báo tài chính': 100,
  'thoibaotaichinh': 100,
  'tbtc': 100,
  'cổng ttđt bộ tài chính': 100,
  'mof.gov.vn': 100,
  'tạp chí thuế': 98,
  'báo hải quan': 98,
  'customsnews': 98,
  'báo chính phủ': 95,
  'baochinhphu': 95,
  'báo đầu tư': 90,
  'baodautu': 90,
  'vneconomy': 90,
  'cafef': 85,
  'vietstock': 85,
  'tuổi trẻ': 80,
  'thanh niên': 80,
  'vnexpress': 80,
  'vietnamnet': 80,
  'lao động': 75,
  'dân trí': 75
};

export function detectQueryIntent(query: string, options: { targetCategory?: string } = {}) {
  const normalizedQuery = normalizeVi(query);
  const queryDomain = expandQueryDomainTokens(query);

  let intentCategory: HybridRagResult['queryIntent']['category'] = 'tong_hop_vi_mo';
  let urgencyLevel: HybridRagResult['queryIntent']['urgencyLevel'] = 'low';
  let actionSuggested: HybridRagResult['queryIntent']['actionTypeSuggested'] = null;
  const detectedSectors = new Set<string>();

  if (
    normalizedQuery.includes('tin don') ||
    normalizedQuery.includes('that thiet') ||
    normalizedQuery.includes('dinh chinh') ||
    normalizedQuery.includes('khung hoang') ||
    normalizedQuery.includes('phat ngon') ||
    normalizedQuery.includes('thong cao')
  ) {
    intentCategory = 'khung_hoang_truyen_thong';
    urgencyLevel = 'critical';
    actionSuggested = 'draft_statement';
    detectedSectors.add('crisis');
  } else if (queryDomain.isTaxSpecific || queryDomain.isCustomsSpecific) {
    intentCategory = 'thue_hai_quan';
    urgencyLevel = 'high';
    actionSuggested = normalizedQuery.includes('to trinh') || normalizedQuery.includes('sua doi')
      ? 'policy_submission'
      : 'deep_dive';
    if (queryDomain.isTaxSpecific) detectedSectors.add('tax');
    if (queryDomain.isCustomsSpecific) detectedSectors.add('customs');
  } else if (
    normalizedQuery.includes('hoan thue') ||
    normalizedQuery.includes('vuong mac') ||
    normalizedQuery.includes('doanh nghiep') ||
    normalizedQuery.includes('dan keu') ||
    normalizedQuery.includes('thue tncn') ||
    normalizedQuery.includes('giam tru') ||
    normalizedQuery.includes('trai chu') ||
    options.targetCategory === 'dan_doanh_nghiep'
  ) {
    intentCategory = 'dan_doanh_nghiep';
    urgencyLevel = 'high';
    actionSuggested = 'gmail_alert';
  } else if (
    normalizedQuery.includes('nghi dinh') ||
    normalizedQuery.includes('thong tu') ||
    normalizedQuery.includes('du thao') ||
    normalizedQuery.includes('chi dao') ||
    normalizedQuery.includes('the che') ||
    options.targetCategory === 'chinh_sach'
  ) {
    intentCategory = 'chinh_sach';
    urgencyLevel = 'medium';
    actionSuggested = 'policy_submission';
  } else if (
    normalizedQuery.includes('chung khoan') ||
    normalizedQuery.includes('vn index') ||
    normalizedQuery.includes('trai phieu') ||
    normalizedQuery.includes('nang hang') ||
    normalizedQuery.includes('ubcknn')
  ) {
    intentCategory = 'thi_truong_von';
    urgencyLevel = 'medium';
    actionSuggested = 'deep_dive';
  }

  return {
    category: intentCategory,
    urgencyLevel,
    primarySectors: Array.from(detectedSectors),
    actionTypeSuggested: actionSuggested,
    isTaxSpecific: queryDomain.isTaxSpecific,
    isCustomsSpecific: queryDomain.isCustomsSpecific
  };
}

/**
 * Execute Hybrid RAG Search with Stage 2 Semantic Legal Document Re-ranking
 */
export function executeHybridRagSearch(
  query: string,
  articles: ScrapedNewsItem[],
  options: {
    targetSector?: string;
    targetCategory?: 'chinh_sach' | 'dan_doanh_nghiep' | 'all';
    maxResults?: number;
    userRolePreference?: string;
    userKnowledgeDocs?: any[];
  } = {}
): HybridRagResult {
  const maxResults = options.maxResults || 8;
  const normalizedQuery = normalizeVi(query);
  const queryTokens = normalizedQuery.split(' ').filter(t => t.length > 2);

  // 1. Detect Query Intent & Domain Taxonomy
  const detectedIntent = detectQueryIntent(query, options);
  const intentCategory = detectedIntent.category;
  const urgencyLevel = detectedIntent.urgencyLevel;
  const actionSuggested = detectedIntent.actionTypeSuggested;
  const detectedSectors = new Set<string>(detectedIntent.primarySectors);

  // 2. Score & Re-rank each article using Hybrid algorithm
  const scoredList: RagScoredArticle[] = [];

  for (const item of articles) {
    const titleNorm = normalizeVi(item.title || '');
    const summaryNorm = normalizeVi(item.summary || item.snippet || '');
    const keyPointsNorm = normalizeVi((item.keyPoints || []).join(' '));
    const combinedText = `${titleNorm} ${summaryNorm} ${keyPointsNorm}`;

    // A. BM25 / Lexical Overlap Score (0 - 100)
    let termHits = 0;
    const matchedKws: string[] = [];
    for (const token of queryTokens) {
      if (titleNorm.includes(token)) {
        termHits += 3;
        matchedKws.push(token);
      } else if (summaryNorm.includes(token)) {
        termHits += 1.5;
        matchedKws.push(token);
      } else if (keyPointsNorm.includes(token)) {
        termHits += 1;
        matchedKws.push(token);
      }
    }
    const rawBm25 = queryTokens.length > 0 ? (termHits / (queryTokens.length * 3)) * 100 : 30;
    const bm25Score = Math.min(100, Math.round(rawBm25));

    // B. Semantic Domain & Term Affinity (0 - 100)
    let domainScore = 40;
    for (const [kw, meta] of Object.entries(DOMAIN_KEYWORD_WEIGHTS)) {
      if (combinedText.includes(kw)) {
        domainScore += meta.weight * 12;
        if (meta.sector) detectedSectors.add(meta.sector);
        if (options.targetCategory === 'chinh_sach' && meta.isPolicy) domainScore += 15;
        if (options.targetCategory === 'dan_doanh_nghiep' && meta.isPublicConcern) domainScore += 15;
      }
    }
    const semanticAffinityScore = Math.min(100, Math.round(domainScore));

    // C. Authority Source Rating (0 - 100)
    const sourceLower = (item.source || '').toLowerCase();
    let authorityScore = 70;
    for (const [authSrc, rate] of Object.entries(AUTHORITY_RATINGS)) {
      if (sourceLower.includes(authSrc)) {
        authorityScore = rate;
        break;
      }
    }

    // D. Urgency / Velocity / Recency Score (0 - 100)
    const buzz = typeof item.buzzScore === 'number' ? item.buzzScore : 60;
    const isBearish = item.sentiment === 'bearish' || (typeof item.sentiment === 'object' && item.sentiment !== null && (item.sentiment as any).polarity === 'BEARISH');
    const urgencyDecayScore = Math.min(100, Math.round(buzz * 0.7 + (isBearish ? 25 : 10)));

    // E. Smart Filter Category Alignment Bonus
    let smartFilterBonus = 0;
    if (intentCategory === 'dan_doanh_nghiep' && (item.sentiment === 'bearish' || isBearish || combinedText.includes('vuong mac') || combinedText.includes('hoan thue'))) {
      smartFilterBonus = 20;
    } else if (intentCategory === 'chinh_sach' && (combinedText.includes('nghi dinh') || combinedText.includes('thong tu') || combinedText.includes('bo tai chinh'))) {
      smartFilterBonus = 20;
    } else if (intentCategory === 'thue_hai_quan' && (combinedText.includes('thue') || combinedText.includes('hai quan') || combinedText.includes('thong quan') || combinedText.includes('hoa don'))) {
      smartFilterBonus = 25;
    }

    // Combined Weighted Re-Ranking Score
    // Formula: Total = 0.35 * BM25 + 0.25 * Semantic + 0.15 * Authority + 0.15 * Urgency + 0.10 * SmartFilterBonus
    const totalScore = Math.round(
      0.35 * bm25Score +
      0.25 * semanticAffinityScore +
      0.15 * authorityScore +
      0.15 * urgencyDecayScore +
      0.10 * smartFilterBonus
    );

    // Build relevance explanation
    let relevanceExplanation = 'Phản ánh thông tin kinh tế tài chính chung';
    if (matchedKws.length > 0) {
      relevanceExplanation = `Khớp từ khóa trực tiếp: ${Array.from(new Set(matchedKws)).slice(0, 3).join(', ')}`;
    } else if (smartFilterBonus > 0) {
      relevanceExplanation = intentCategory === 'chinh_sach'
        ? 'Điểm tựa pháp lý và chỉ đạo thể chế then chốt'
        : intentCategory === 'thue_hai_quan'
        ? 'Chính sách thuế & nghiệp vụ hải quan trọng yếu'
        : 'Phản ánh trọng điểm bức xúc và vướng mắc thực thi của Dân & Doanh nghiệp';
    }

    // Matched legal bases
    const matchedLegalBases: string[] = [];
    VIETNAM_FINANCIAL_LEGAL_BASE.forEach(legal => {
      const legalNorm = normalizeVi(`${legal.code} ${legal.name} ${legal.coreHighlights.join(' ')}`);
      if (queryTokens.some(t => legalNorm.includes(t)) || combinedText.includes(normalizeVi(legal.code))) {
        matchedLegalBases.push(legal.code);
      }
    });

    scoredList.push({
      article: item,
      totalScore,
      bm25Score,
      semanticAffinityScore,
      authorityScore,
      urgencyDecayScore,
      smartFilterBonus,
      relevanceExplanation,
      matchedKeywords: Array.from(new Set(matchedKws)),
      matchedLegalBases: Array.from(new Set(matchedLegalBases))
    });
  }

  // Sort descending by totalScore
  scoredList.sort((a, b) => b.totalScore - a.totalScore);
  const topArticles = scoredList.slice(0, maxResults);

  // 3. EXECUTE ADVANCED SEMANTIC RE-RANKING ON REGULATORY & LEGAL DOCUMENTS
  // Convert VIETNAM_FINANCIAL_LEGAL_BASE + User Knowledge Docs into unified snippets
  const legalDocPool: RegulatoryDocumentSnippet[] = VIETNAM_FINANCIAL_LEGAL_BASE.map(lf => ({
    id: lf.id,
    code: lf.code,
    title: lf.name,
    category: lf.category as any,
    agency: lf.agency,
    summary: lf.coreHighlights.join('; '),
    contentSnippet: `${lf.coreHighlights.join('. ')}. Áp dụng cho: ${lf.applicableScenarios.join(', ')}`,
    tags: [lf.code, lf.agency, lf.category, ...lf.applicableScenarios],
    isActiveForAI: true
  }));

  // Include 100 Decree 376 Benchmark Scenarios into legalDocPool for deep semantic retrieval
  for (const sc of DECREE_376_100_SCENARIOS) {
    legalDocPool.push({
      id: `d376_${sc.scenarioCode}`,
      code: `NĐ 376 - ${sc.scenarioCode} (${sc.tierLabelVi.split(':')[0]})`,
      title: sc.title,
      category: 'NGHI_DINH',
      agency: sc.decree376Basis.leadAgencyName,
      summary: `${sc.realArticleTitle}. Bản chất khoảng trống: ${sc.natureOfInformationVacuum || sc.classificationReason}`,
      contentSnippet: `Căn cứ: ${sc.decree376Basis.clauseArticle}. Báo chí thực tế: ${sc.realArticleTitle}. Đơn vị chủ trì: ${sc.decree376Basis.leadAgencyName}. Phối hợp: ${(sc.decree376Basis.cooperatingUnits || []).join(', ')}. Kịch bản xử lý: ${sc.actionScriptVi || sc.emergencyPlaybook?.keyMessage || ''}`,
      tags: [sc.scenarioCode, `Mức ${sc.tier}`, sc.decree376Basis.leadAgencyName, ...sc.matchingKeywords],
      isActiveForAI: true
    });
  }

  // Include user knowledge docs if passed
  if (Array.isArray(options.userKnowledgeDocs) && options.userKnowledgeDocs.length > 0) {
    for (const ud of options.userKnowledgeDocs) {
      if (ud && ud.isActiveForAI !== false) {
        legalDocPool.push({
          id: ud.id || `ud_${Math.random()}`,
          code: ud.fileName || ud.title,
          title: ud.title || 'Văn bản Pháp quy',
          category: (ud.category || 'POLICY_DRAFT') as any,
          agency: ud.agency || 'Bộ Tài chính',
          summary: ud.summary || '',
          contentSnippet: ud.contentSnippet || ud.content || ud.summary || '',
          tags: ud.tags || [],
          isActiveForAI: true
        });
      }
    }
  }

  const { rankedDocuments: semanticLegalReRankResults, topLegalCitationsMarkdown } = rerankLegalDocuments(
    query,
    legalDocPool,
    { maxResults: 5, threshold: 25 }
  );

  // Retrieve top matching Decree 376 scenarios for high-precision RAG Grounding
  const { matchedScenarios: matchedDecree376Scenarios, promptContext: decree376PromptContext } =
    searchDecree376ScenariosForRag(query, 3);

  // Map to traditional LegalFrameworkItem format for backward compatibility
  const matchedLegal: LegalFrameworkItem[] = semanticLegalReRankResults.map(r => {
    const original = VIETNAM_FINANCIAL_LEGAL_BASE.find(v => v.id === r.doc.id);
    if (original) return original;
    return {
      id: r.doc.id,
      code: r.doc.code,
      name: r.doc.title,
      category: (r.doc.category === 'LUAT' || r.doc.category === 'NGHI_DINH' || r.doc.category === 'THONG_TU' || r.doc.category === 'NGHI_QUYET' || r.doc.category === 'QUYET_DINH' || r.doc.category === 'CONG_VAN')
        ? r.doc.category
        : 'NGHI_DINH',
      agency: r.doc.agency,
      coreHighlights: [r.doc.summary, ...r.extractedClauses],
      applicableScenarios: r.doc.tags || []
    };
  });

  // 4. Match relevant Macro Benchmarks
  const matchedBenchmarks = MACRO_FINANCIAL_BENCHMARKS.filter(bench => {
    const text = normalizeVi(`${bench.indicator} ${bench.controllingAgency}`);
    return queryTokens.some(t => text.includes(t));
  });

  // 5. Generate Executive Context Summary
  const topTitles = topArticles.slice(0, 3).map(a => `"${a.article.title}"`).join('; ');
  const topLaws = semanticLegalReRankResults.slice(0, 2).map(r => r.doc.code).join(', ');
  const executiveContextSummary = `Truy xuất Semantic RAG: Tìm thấy ${topArticles.length} bài viết, ${matchedDecree376Scenarios.length} tình huống chuẩn NĐ 376 và ${semanticLegalReRankResults.length} căn cứ pháp lý xếp hạng cao (Trọng tâm: ${topLaws ? `Văn bản [${topLaws}]` : ''} ${topTitles || 'Dữ liệu toàn diện'}).`;

  return {
    topArticles,
    matchedLegalFramework: matchedLegal.length > 0 ? matchedLegal : VIETNAM_FINANCIAL_LEGAL_BASE.slice(0, 3),
    semanticLegalReRankResults,
    legalCitationsPromptContext: topLegalCitationsMarkdown,
    matchedBenchmarks: matchedBenchmarks.length > 0 ? matchedBenchmarks : MACRO_FINANCIAL_BENCHMARKS.slice(0, 2),
    matchedDecree376Scenarios,
    decree376PromptContext,
    queryIntent: {
      category: intentCategory,
      urgencyLevel,
      primarySectors: Array.from(detectedSectors),
      actionTypeSuggested: actionSuggested,
      isTaxSpecific: detectedIntent.isTaxSpecific,
      isCustomsSpecific: detectedIntent.isCustomsSpecific
    },
    executiveContextSummary
  };
}

/**
 * Nâng cấp RAG Embeddings Ngữ Nghĩa:
 * Gọi trực tiếp endpoint /api/rag/semantic-search sử dụng mô hình text-embedding-004
 * (với fallback tự động sang gemini-embedding-2-preview 3072 chiều vector).
 */
export async function executeSemanticVectorRagPipeline(
  query: string,
  corpus: ScrapedNewsItem[],
  customDocs: any[] = [],
  options: {
    targetSector?: string;
    targetCategory?: 'chinh_sach' | 'dan_doanh_nghiep' | 'all';
    maxResults?: number;
    userRolePreference?: string;
    userKnowledgeDocs?: any[];
  } = {}
): Promise<HybridRagResult & { vectorModelUsed?: string; vectorDimensions?: number; isVectorEmbeddingActive?: boolean }> {
  // 1. Initial base hybrid pipeline run
  const baseResult = executeHybridRagSearch(query, corpus, { ...options, userKnowledgeDocs: customDocs });

  try {
    // 2. Prepare legal snippets for vector embeddings search
    const legalDocPool: RegulatoryDocumentSnippet[] = VIETNAM_FINANCIAL_LEGAL_BASE.map(lf => ({
      id: lf.id,
      code: lf.code,
      title: lf.name,
      category: (lf.category === 'LUAT' || lf.category === 'NGHI_DINH' || lf.category === 'THONG_TU' || lf.category === 'NGHI_QUYET' || lf.category === 'QUYET_DINH' || lf.category === 'CONG_VAN')
        ? lf.category
        : 'NGHI_DINH',
      agency: lf.agency,
      summary: lf.coreHighlights.join('; '),
      contentSnippet: `${lf.coreHighlights.join('. ')}. Kịch bản áp dụng: ${lf.applicableScenarios.join(', ')}`,
      tags: [lf.code, lf.agency, ...lf.applicableScenarios],
      isActiveForAI: true
    }));

    (customDocs || []).forEach((cd: any) => {
      legalDocPool.push({
        id: cd.id,
        code: cd.id,
        title: cd.title,
        category: 'NGHI_DINH',
        agency: cd.agency || 'Văn bản Người Dùng',
        summary: cd.summary || cd.title,
        contentSnippet: `${cd.summary || ''}. ${(cd.contentSnippet || '').slice(0, 500)}`,
        tags: cd.tags || [],
        isActiveForAI: true
      });
    });

    // 3. Call server endpoint /api/rag/semantic-search
    const res = await fetch('/api/rag/semantic-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        documents: legalDocPool,
        topK: 6,
        minSimilarity: 0.15
      })
    });

    const data = await res.json();
    if (data.success && Array.isArray(data.results) && data.results.length > 0) {
      // Map vector search results to ReRankedLegalResult
      const vectorReranked: ReRankedLegalResult[] = data.results.map((r: any, idx: number) => {
        const doc = r.doc;
        const cosineSimPct = r.similarityPercentage || Math.round((r.cosineSimilarity || 0.5) * 100);
        return {
          doc,
          reRankScore: Math.min(100, Math.max(10, Math.round(cosineSimPct * 0.85 + 15))),
          bm25Score: cosineSimPct, // Replaced with semantic vector score
          semanticScore: cosineSimPct,
          hierarchyWeight: 1.25,
          extractedClauses: [doc.summary || doc.title],
          matchedDomainTokens: [r.modelUsed || 'text-embedding-004'],
          relevanceRationale: `Vector Cosine Similarity: ${cosineSimPct}% (${data.vectorDimensions || 3072} chiều vector - ${r.modelUsed || 'text-embedding-004'})`
        };
      });

      return {
        ...baseResult,
        semanticLegalReRankResults: vectorReranked,
        vectorModelUsed: data.modelUsed,
        vectorDimensions: data.vectorDimensions,
        isVectorEmbeddingActive: true,
        executiveContextSummary: `[Embeddings RAG (${data.vectorDimensions} chiều)]: ${baseResult.executiveContextSummary}`
      };
    }
  } catch (err) {
    console.warn('Semantic Vector Search Fallback:', err);
  }

  return {
    ...baseResult,
    vectorModelUsed: 'Hybrid BM25 + Cross-Encoder Fallback',
    vectorDimensions: 768,
    isVectorEmbeddingActive: false
  };
}
