import { ScrapedNewsItem } from '../types';

export type SmartFilterCategory = 'all' | 'policy' | 'public_enterprise' | 'urgent_cross';

export interface SmartFilterSubTopic {
  id: string;
  label: string;
  category: 'policy' | 'public_enterprise' | 'all';
  keywords: string[];
  description: string;
  iconName?: string;
}

export interface ArticleSmartFilterAnalysis {
  isPolicy: boolean;
  isPublicEnterprise: boolean;
  isUrgentCross: boolean; // Both Policy impact + Urgent Enterprise/Citizen pain point
  policyScore: number; // 0 to 100
  publicEnterpriseScore: number; // 0 to 100
  policyKeywordsMatched: string[];
  publicEnterpriseKeywordsMatched: string[];
  matchedSubTopics: string[]; // SubTopic IDs
  primaryCategory: 'policy' | 'public_enterprise' | 'both' | 'general';
  leadershipFocusReason: string; // Tóm tắt ngắn gọn lý do lãnh đạo cần quan tâm
  relevanceBadge: string;
}

// Sub-topic taxonomy for quick 1-click filtering
export const SMART_FILTER_SUBTOPICS: SmartFilterSubTopic[] = [
  // --- Nhóm Chính sách & Thể chế ---
  {
    id: 'sub_policy_decrees',
    label: 'Nghị định, Thông tư & Dự thảo Luật',
    category: 'policy',
    keywords: ['nghị định', 'thông tư', 'dự thảo', 'luật', 'quyết định', 'nghị quyết', 'văn bản', 'pháp quy', 'chỉ thị', 'khung pháp lý'],
    description: 'Các văn bản quy phạm pháp luật, chỉ đạo ban hành mới từ Chính phủ và Bộ Tài chính'
  },
  {
    id: 'sub_policy_tax_customs',
    label: 'Chính sách Thuế & Hải quan',
    category: 'policy',
    keywords: ['tổng cục thuế', 'tổng cục hải quan', 'thuế vat', 'thuế tndn', 'thuế tncn', 'hải quan thông minh', 'chính sách thuế', 'miễn giảm thuế', 'gia hạn thuế'],
    description: 'Điều hành chính sách thuế nội địa, thu NSNN và quy chuẩn kiểm soát hải quan'
  },
  {
    id: 'sub_policy_capital_market',
    label: 'Quy chế Thị trường Vốn & Chứng khoán',
    category: 'policy',
    keywords: ['ubcknn', 'nâng hạng', 'non-prefunding', 'thông tư 68', 'nghị định 08', 'tpdn', 'chuẩn mực kế toán', 'quản lý nợ', 'scic'],
    description: 'Quy định quản lý thị trường chứng khoán, trái phiếu doanh nghiệp và vốn nhà nước'
  },
  {
    id: 'sub_policy_macro_budget',
    label: 'Dự toán Ngân sách & Đầu tư công',
    category: 'policy',
    keywords: ['kho bạc', 'dự toán', 'ngân sách', 'giải ngân', 'đầu tư công', 'vốn ngân sách', 'cục quản lý giá', 'bình ổn giá', 'bội chi'],
    description: 'Kế hoạch thu chi ngân sách quốc gia và điều phối vốn đầu tư công'
  },

  // --- Nhóm Người dân & Doanh nghiệp quan tâm ---
  {
    id: 'sub_pe_business_hurdles',
    label: 'Vướng mắc & Kiến nghị Doanh nghiệp',
    category: 'public_enterprise',
    keywords: ['doanh nghiệp', 'vướng mắc', 'khó khăn', 'kiến nghị', 'phản ánh', 'thủ tục', 'ách tắc', 'chậm trễ', 'hỗ trợ doanh nghiệp', 'tiếp cận vốn'],
    description: 'Các điểm nghẽn thực thi thủ tục hành chính và rào cản hoạt động sản xuất kinh doanh'
  },
  {
    id: 'sub_pe_tax_refund_cost',
    label: 'Hoàn thuế VAT & Chi phí Tuân thủ',
    category: 'public_enterprise',
    keywords: ['hoàn thuế', 'chậm hoàn thuế', 'hóa đơn điện tử', 'hóa đơn khống', 'truy thu', 'chi phí', 'kiểm tra thuế', 'người nộp thuế', 'hộ kinh doanh'],
    description: 'Phản ánh của cộng đồng doanh nghiệp và hộ kinh doanh về hoàn thuế, hóa đơn và thanh tra'
  },
  {
    id: 'sub_pe_personal_tax_livelihood',
    label: 'Thuế TNCN, Sức mua & Đời sống Dân sinh',
    category: 'public_enterprise',
    keywords: ['người dân', 'thuế tncn', 'giảm trừ gia cảnh', 'lương', 'thu nhập', 'sức mua', 'giá cả', 'đời sống', 'tiêu dùng', 'an sinh'],
    description: 'Mức độ hài lòng và kỳ vọng của người dân về chính sách giảm trừ gia cảnh, giá cả sinh hoạt'
  },
  {
    id: 'sub_pe_bonds_investors',
    label: 'Quyền lợi Nhà đầu tư & Trái chủ',
    category: 'public_enterprise',
    keywords: ['trái chủ', 'nhà đầu tư', 'khất nợ', 'đáo hạn', 'chậm trả', 'hoán đổi nợ', 'thua lỗ', 'bảo vệ nhà đầu tư', 'khiếu nại'],
    description: 'Nguyện vọng và áp lực thanh khoản từ các trái chủ và nhà đầu tư cá nhân trên thị trường vốn'
  }
];

// Comprehensive keyword lexicons
const POLICY_KEYWORDS = [
  'chính sách', 'nghị định', 'thông tư', 'quyết định', 'dự thảo', 'luật', 'bộ tài chính',
  'tổng cục thuế', 'tổng cục hải quan', 'kho bạc nhà nước', 'kho bạc', 'ubcknn', 'cục quản lý giá',
  'cục quản lý nợ', 'cục quản lý công sản', 'scic', 'thể chế', 'điều hành', 'vĩ mô', 'quy hoạch',
  'cơ chế', 'văn bản pháp quy', 'thanh tra tài chính', 'chỉ thị', 'nghị quyết', 'quốc hội', 'thủ tướng',
  'khung pháp lý', 'quản lý nhà nước', 'bãi bỏ', 'sửa đổi', 'ban hành', 'hướng dẫn thi hành',
  'dự toán nsnn', 'vốn đầu tư công', 'non-prefunding', 'chuẩn mực', 'bộ trưởng', 'thứ trưởng'
];

const PUBLIC_ENTERPRISE_KEYWORDS = [
  'doanh nghiệp', 'người dân', 'hộ kinh doanh', 'người nộp thuế', 'công chúng', 'thị trường',
  'vướng mắc', 'khó khăn', 'phản ánh', 'khiếu nại', 'kiến nghị', 'hoàn thuế', 'chậm hoàn thuế',
  'thủ tục hành chính', 'tiếp cận vốn', 'lãi suất', 'nợ đọng', 'chi phí', 'hóa đơn điện tử',
  'hóa đơn khống', 'chậm trễ', 'tắc nghẽn', 'trái chủ', 'nhà đầu tư', 'nhà đầu tư cá nhân',
  'sức mua', 'thu nhập', 'tiền lương', 'thuế thu nhập cá nhân', 'thuế tncn', 'giảm trừ gia cảnh',
  'an sinh xã hội', 'sinh kế', 'giá cả sinh hoạt', 'mặt bằng giá', 'giá vàng', 'phí và lệ phí',
  'giải cứu', 'áp lực chi phí', 'hỗ trợ doanh nghiệp', 'cắt giảm điều kiện'
];

/**
 * Classify a news article with the Smart Filter Engine
 */
export function classifyArticleSmartFilter(item: ScrapedNewsItem): ArticleSmartFilterAnalysis {
  const fullText = `${item.title || ''} ${item.summary || ''} ${item.snippet || ''} ${item.sentimentReason || ''} ${item.sectorNameVi || ''}`.toLowerCase();

  const matchedPolicyKws: string[] = [];
  POLICY_KEYWORDS.forEach((kw) => {
    if (fullText.includes(kw.toLowerCase())) {
      matchedPolicyKws.push(kw);
    }
  });

  const matchedPEKws: string[] = [];
  PUBLIC_ENTERPRISE_KEYWORDS.forEach((kw) => {
    if (fullText.includes(kw.toLowerCase())) {
      matchedPEKws.push(kw);
    }
  });

  // Calculate matching scores (0 to 100)
  const policyScore = Math.min(100, matchedPolicyKws.length * 20 + (item.sector === 'policy' || item.sector === 'tax' || item.sector === 'customs' || item.sector === 'treasury_budget' ? 25 : 0));
  const publicEnterpriseScore = Math.min(100, matchedPEKws.length * 18 + (item.sector === 'enterprise' || item.sector === 'tax' || item.sector === 'bonds' ? 20 : 0));

  const isPolicy = policyScore >= 20 || matchedPolicyKws.length >= 1;
  const isPublicEnterprise = publicEnterpriseScore >= 20 || matchedPEKws.length >= 1;

  // Identify subtopics
  const matchedSubTopics: string[] = [];
  SMART_FILTER_SUBTOPICS.forEach((sub) => {
    const hits = sub.keywords.some((kw) => fullText.includes(kw.toLowerCase()));
    if (hits) {
      matchedSubTopics.push(sub.id);
    }
  });

  // Urgent Cross: Article where policy directly intersects with high pain point/risk from public or enterprise
  const isUrgent = item.sentiment === 'bearish' || (item.sentimentScore !== undefined && item.sentimentScore < 0) || item.isEmergency || (item.buzzScore || 0) >= 60;
  const isUrgentCross = (isPolicy && isPublicEnterprise) || (isPublicEnterprise && isUrgent);

  let primaryCategory: 'policy' | 'public_enterprise' | 'both' | 'general' = 'general';
  if (isPolicy && isPublicEnterprise) {
    primaryCategory = 'both';
  } else if (isPolicy) {
    primaryCategory = 'policy';
  } else if (isPublicEnterprise) {
    primaryCategory = 'public_enterprise';
  }

  // Leadership focus reason synthesis
  let leadershipFocusReason = '';
  if (isUrgentCross) {
    leadershipFocusReason = `Phản ánh điểm nghẽn thực thi ảnh hưởng quyền lợi người dân/doanh nghiệp, liên quan trực tiếp đến cơ chế quản lý của ngành.`;
  } else if (isPolicy) {
    leadershipFocusReason = `Thông tin chỉ đạo, ban hành quy định thể chế mới (${matchedPolicyKws.slice(0, 3).join(', ')}).`;
  } else if (isPublicEnterprise) {
    leadershipFocusReason = `Tâm tư, nguyện vọng và phản hồi của người dân & cộng đồng doanh nghiệp (${matchedPEKws.slice(0, 3).join(', ')}).`;
  } else {
    leadershipFocusReason = `Diễn biến dữ liệu thị trường và thông tin tổng hợp.`;
  }

  let relevanceBadge = 'Toàn cảnh';
  if (primaryCategory === 'both') {
    relevanceBadge = 'Chính sách & Dân sinh';
  } else if (primaryCategory === 'policy') {
    relevanceBadge = 'Chính sách / Thể chế';
  } else if (primaryCategory === 'public_enterprise') {
    relevanceBadge = 'Dân & Doanh nghiệp';
  }

  return {
    isPolicy,
    isPublicEnterprise,
    isUrgentCross,
    policyScore,
    publicEnterpriseScore,
    policyKeywordsMatched: matchedPolicyKws,
    publicEnterpriseKeywordsMatched: matchedPEKws,
    matchedSubTopics,
    primaryCategory,
    leadershipFocusReason,
    relevanceBadge
  };
}

/**
 * Filter news items with Smart Filter options
 */
export interface SmartFilterQueryOptions {
  category: SmartFilterCategory;
  subTopicId?: string;
  sentimentFilter?: 'all' | 'bullish' | 'bearish' | 'neutral';
  searchTerm?: string;
  emergencyOnly?: boolean;
}

export function filterArticlesWithSmartEngine(
  articles: ScrapedNewsItem[],
  options: SmartFilterQueryOptions
): {
  filteredArticles: ScrapedNewsItem[];
  stats: {
    total: number;
    policyCount: number;
    publicEnterpriseCount: number;
    urgentCrossCount: number;
    subTopicCounts: Record<string, number>;
  };
} {
  const analysisMap = new Map<string, ArticleSmartFilterAnalysis>();

  let policyCount = 0;
  let publicEnterpriseCount = 0;
  let urgentCrossCount = 0;
  const subTopicCounts: Record<string, number> = {};

  SMART_FILTER_SUBTOPICS.forEach((st) => {
    subTopicCounts[st.id] = 0;
  });

  articles.forEach((art) => {
    const analysis = classifyArticleSmartFilter(art);
    analysisMap.set(art.id, analysis);

    if (analysis.isPolicy) policyCount++;
    if (analysis.isPublicEnterprise) publicEnterpriseCount++;
    if (analysis.isUrgentCross) urgentCrossCount++;

    analysis.matchedSubTopics.forEach((stId) => {
      subTopicCounts[stId] = (subTopicCounts[stId] || 0) + 1;
    });
  });

  const filteredArticles = articles.filter((art) => {
    const analysis = analysisMap.get(art.id);
    if (!analysis) return false;

    // 1. Category Filter
    if (options.category === 'policy' && !analysis.isPolicy) return false;
    if (options.category === 'public_enterprise' && !analysis.isPublicEnterprise) return false;
    if (options.category === 'urgent_cross' && !analysis.isUrgentCross) return false;

    // 2. SubTopic Filter
    if (options.subTopicId && options.subTopicId !== 'all') {
      if (!analysis.matchedSubTopics.includes(options.subTopicId)) return false;
    }

    // 3. Sentiment Filter
    if (options.sentimentFilter && options.sentimentFilter !== 'all') {
      if (art.sentiment !== options.sentimentFilter) return false;
    }

    // 4. Emergency Only
    if (options.emergencyOnly && !art.isEmergency && art.sentiment !== 'bearish') {
      return false;
    }

    // 5. Search text
    if (options.searchTerm && options.searchTerm.trim()) {
      const term = options.searchTerm.toLowerCase();
      const text = `${art.title || ''} ${art.summary || ''} ${art.source || ''} ${analysis.leadershipFocusReason || ''}`.toLowerCase();
      if (!text.includes(term)) return false;
    }

    return true;
  });

  return {
    filteredArticles,
    stats: {
      total: articles.length,
      policyCount,
      publicEnterpriseCount,
      urgentCrossCount,
      subTopicCounts
    }
  };
}
