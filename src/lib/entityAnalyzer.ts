export interface EntityAnalysisResult {
  isPolicySensitive: boolean;
  sensitivityReason?: string;
  policyTags: string[];
  detectedAgencies?: string[];
  subTopics?: string[];
}

const POLICY_SENSITIVE_KEYWORDS = [
  'chương trình mục tiêu quốc gia',
  'tăng trưởng kinh tế',
  'tăng trưởng gdp',
  'gdp',
  'tăng trưởng 2 con số',
  'mô hình tăng trưởng',
  'kinh tế quý iii',
  'kinh tế quý 3',
  'kinh tế quý iv',
  'kinh tế quý 4',
  'động lực tăng trưởng',
  'kịch bản tăng trưởng',
  'đầu tư công',
  'nsnn',
  'ngân sách nhà nước',
  'kho bạc nhà nước',
  'kbnn',
  'nợ công',
  'bội chi',
  'cải cách tiền lương',
  'điều chỉnh giá điện',
  'bình ổn giá',
  'giá xăng dầu',
  'lạm phát',
  'cpi',
  'tỷ giá',
  'room tín dụng',
  'nợ xấu',
  'thị trường trái phiếu',
  'tpdn',
  'trái phiếu chính phủ',
  'nâng hạng thị trường',
  'krx',
  'non-prefunding',
  'thuế tối thiểu toàn cầu',
  'hoàn thuế vat',
  'hóa đơn điện tử',
  'thương mại điện tử',
  'luật đất đai 2024',
  'bảng giá đất',
  'đất đai',
  'bất động sản',
  'thoái vốn',
  'cổ phần hóa',
  'scic',
  'bảo hiểm nhân thọ',
  'bancassurance',
  'tài sản công',
  'dự trữ quốc gia',
  'thanh tra bộ tài chính'
];

const AGENCY_MAPPINGS: Record<string, string[]> = {
  'Bộ Tài chính': ['bộ tài chính', 'btc', 'bộ trưởng bộ tài chính', 'thứ trưởng bộ tài chính'],
  'Cục Thuế và Thuế địa phương': ['tổng cục thuế', 'ngành thuế', 'cục thuế', 'thuế địa phương', 'chi cục thuế'],
  'Tổng cục Hải quan': ['tổng cục hải quan', 'ngành hải quan', 'cục hải quan', 'chi cục hải quan'],
  'UBCKNN': ['ubcknn', 'ủy ban chứng khoán nhà nước', 'uỷ ban chứng khoán', 'sở giao dịch chứng khoán'],
  'Kho bạc Nhà nước': ['kho bạc nhà nước', 'kbnn', 'hệ thống kho bạc'],
  'Cục Quản lý Giá': ['cục quản lý giá', 'ban chỉ đạo điều hành giá'],
  'Cục QL Giám sát Bảo hiểm': ['cục quản lý, giám sát bảo hiểm', 'cục quản lý giám sát bảo hiểm', 'cục qlbh'],
  'Cục Quản lý Công sản': ['cục quản lý công sản', 'quản lý tài sản công'],
  'Cục QL Nợ & TCĐN': ['cục quản lý nợ và tài chính đối ngoại', 'cục quản lý nợ', 'quản lý nợ công'],
  'Cục Tài chính Doanh nghiệp': ['cục tài chính doanh nghiệp', 'cục tcdn'],
  'Tổng cục Dự trữ Nhà nước': ['tổng cục dự trữ nhà nước', 'tổng cục dự trữ', 'dự trữ quốc gia'],
  'Thanh tra Bộ Tài chính': ['thanh tra bộ tài chính', 'thanh tra tài chính'],
  'SCIC': ['scic', 'tổng công ty đầu tư và kinh doanh vốn nhà nước'],
  'Ngân hàng Nhà nước': ['ngân hàng nhà nước', 'nhnn', 'thống đốc'],
};

export function analyzeArticleEntity(
  title: string,
  summary: string,
  weightedKeywords?: { keyword: string }[]
): EntityAnalysisResult {
  const text = [
    title,
    summary,
    ...(weightedKeywords?.map((k) => k.keyword) || [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const matchedTags: string[] = [];
  for (const kw of POLICY_SENSITIVE_KEYWORDS) {
    if (text.includes(kw)) {
      matchedTags.push(kw);
    }
  }

  const detectedAgencies: string[] = [];
  for (const [agency, aliases] of Object.entries(AGENCY_MAPPINGS)) {
    if (aliases.some(alias => text.includes(alias))) {
      detectedAgencies.push(agency);
    }
  }

  const isPolicySensitive = matchedTags.length > 0;
  let sensitivityReason = '';

  if (isPolicySensitive) {
    sensitivityReason = `Đề cập đến trọng tâm chính sách: ${matchedTags.slice(0, 3).join(', ')}`;
  }

  return {
    isPolicySensitive,
    sensitivityReason,
    policyTags: matchedTags,
    detectedAgencies,
  };
}
