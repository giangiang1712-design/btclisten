import {
  ScrapedNewsItem,
  SentimentDiagnostic,
  MediaGapAnalysis,
  SentimentType,
  NegativeImpactChain,
  ImpactChainNode,
  SectorType,
  SECTOR_NAMES,
  SentimentScoreDecomposition,
  SentimentKeywordToken
} from '../types';

export const POSITIVE_LEXICON: { word: string; weight: number }[] = [
  { word: 'tăng trưởng', weight: 8 },
  { word: 'bứt phá', weight: 9 },
  { word: 'vượt chỉ tiêu', weight: 10 },
  { word: 'vượt dự toán', weight: 10 },
  { word: 'vượt mốc', weight: 8 },
  { word: 'kỷ lục', weight: 8 },
  { word: 'thuận lợi', weight: 6 },
  { word: 'kích cầu', weight: 7 },
  { word: 'tháo gỡ', weight: 8 },
  { word: 'miễn giảm thuế', weight: 9 },
  { word: 'gia hạn thuế', weight: 7 },
  { word: 'nâng hạng', weight: 10 },
  { word: 'non-prefunding', weight: 8 },
  { word: 'minh bạch', weight: 7 },
  { word: 'phục hồi', weight: 8 },
  { word: 'thặng dư', weight: 8 },
  { word: 'xuất siêu', weight: 8 },
  { word: 'khởi sắc', weight: 7 },
  { word: 'lạc quan', weight: 6 },
  { word: 'điểm sáng', weight: 8 },
  { word: 'hiệu quả', weight: 6 },
  { word: 'thành công', weight: 7 },
  { word: 'khen thưởng', weight: 6 },
  { word: 'cải cách', weight: 7 },
  { word: 'đổi mới', weight: 6 },
  { word: 'bền vững', weight: 7 },
  { word: 'ổn định', weight: 6 },
  { word: 'hóa đơn điện tử', weight: 7 },
  { word: 'chuyển đổi số', weight: 7 },
  { word: 'hải quan thông minh', weight: 8 }
];

export const NEGATIVE_LEXICON: { word: string; weight: number }[] = [
  { word: 'áp lực', weight: -7 },
  { word: 'thách thức', weight: -6 },
  { word: 'khó khăn', weight: -7 },
  { word: 'vướng mắc', weight: -8 },
  { word: 'chậm giải ngân', weight: -10 },
  { word: 'chậm hoàn thuế', weight: -10 },
  { word: 'ách tắc', weight: -9 },
  { word: 'nợ đọng', weight: -9 },
  { word: 'thất thu', weight: -9 },
  { word: 'thao túng', weight: -10 },
  { word: 'thanh tra', weight: -7 },
  { word: 'khất nợ', weight: -9 },
  { word: 'đáo hạn', weight: -6 },
  { word: 'chậm trả', weight: -9 },
  { word: 'sụt giảm', weight: -7 },
  { word: 'bán tháo', weight: -9 },
  { word: 'lao dốc', weight: -9 },
  { word: 'gian lận', weight: -10 },
  { word: 'sai phạm', weight: -10 },
  { word: 'trốn thuế', weight: -10 },
  { word: 'hóa đơn khống', weight: -10 },
  { word: 'truy thu', weight: -8 },
  { word: 'bội chi', weight: -8 },
  { word: 'cảnh báo', weight: -7 },
  { word: 'đình trệ', weight: -9 },
  { word: 'ứ đọng', weight: -8 },
  { word: 'chậm nộp', weight: -7 },
  { word: 'vi phạm', weight: -8 },
  { word: 'thua lỗ', weight: -8 },
  { word: 'lo ngại', weight: -6 },
  { word: 'nguy cơ', weight: -7 },
  { word: 'vỡ nợ', weight: -10 },
  { word: 'lừa đảo', weight: -10 },
  { word: 'giả danh', weight: -9 },
  { word: 'chiếm đoạt', weight: -10 },
  { word: 'lĩnh án', weight: -9 },
  { word: 'phạt tù', weight: -9 },
  { word: 'năm tù', weight: -9 },
  { word: 'án tù', weight: -9 },
  { word: 'tuyên án', weight: -8 },
  { word: 'truy tố', weight: -9 },
  { word: 'bị cáo', weight: -8 },
  { word: 'rửa tiền', weight: -10 }
];

export const MOF_DOMAIN_KEYWORDS = [
  'Bộ Tài chính', 'Cục Thuế', 'Tổng cục Hải quan', 'Kho bạc Nhà nước',
  'Ủy ban Chứng khoán Nhà nước', 'UBCKNN', 'Cục Quản lý Giá', 'Cục Quản lý Công sản',
  'Cục Quản lý Nợ', 'SCIC', 'Vụ Tài chính Ngân hàng', 'Vụ Ngân sách Nhà nước',
  'VAT', 'Thuế TNDN', 'Thuế TNCN', 'eTax Mobile', 'Hóa đơn điện tử',
  'Trái phiếu doanh nghiệp', 'TPDN', 'TPCP', 'Dự toán NSNN', 'Đầu tư công',
  'Thị trường vàng', 'Non-prefunding', 'Thông tư 68', 'Nghị định 08', 'Nghị định 24',
  'FTSE Russell', 'KRX', 'Luật Đất đai', 'Luật Giá 2023'
];

export function decomposeSentimentScore(item: ScrapedNewsItem): SentimentScoreDecomposition {
  const text = `${item.title || ''} ${item.summary || ''} ${item.snippet || ''} ${item.sentimentReason || ''}`.toLowerCase();
  
  const tokens: SentimentKeywordToken[] = [];
  const positiveKeywords: string[] = [];
  const negativeKeywords: string[] = [];
  const mofDomainKeywords: string[] = [];

  let rawKeywordScore = 0;

  // Check positive keywords
  POSITIVE_LEXICON.forEach(lex => {
    if (text.includes(lex.word.toLowerCase())) {
      positiveKeywords.push(lex.word);
      tokens.push({
        word: lex.word,
        category: 'positive',
        weight: lex.weight
      });
      rawKeywordScore += lex.weight;
    }
  });

  // Check negative keywords
  NEGATIVE_LEXICON.forEach(lex => {
    if (text.includes(lex.word.toLowerCase())) {
      negativeKeywords.push(lex.word);
      tokens.push({
        word: lex.word,
        category: 'negative',
        weight: lex.weight
      });
      rawKeywordScore += lex.weight;
    }
  });

  // Check MoF keywords
  MOF_DOMAIN_KEYWORDS.forEach(kw => {
    if (text.includes(kw.toLowerCase())) {
      mofDomainKeywords.push(kw);
      tokens.push({
        word: kw,
        category: 'mof_core',
        weight: 5
      });
    }
  });

  // Normalize keyword polarity score into [-40, +40]
  let keywordPolarityScore = Math.round(Math.max(-40, Math.min(40, rawKeywordScore * 1.5)));

  // Policy context score: assesses institutional momentum vs friction (-25 to +25)
  let policyContextScore = 0;
  if (item.sentiment === 'bullish' || rawKeywordScore > 5) {
    policyContextScore = Math.min(25, 10 + (positiveKeywords.length * 3));
  } else if (item.sentiment === 'bearish' || rawKeywordScore < -5) {
    policyContextScore = Math.max(-25, -10 - (negativeKeywords.length * 3));
  } else {
    policyContextScore = 0;
  }

  // Impact intensity score: scope and depth (-20 to +20)
  let impactIntensityScore = 0;
  const isCoreSector = ['tax', 'customs', 'bonds', 'stocks', 'treasury_budget', 'public_investment'].includes(item.sector || '');
  if (item.sentiment === 'bullish') {
    impactIntensityScore = isCoreSector ? 18 : 12;
  } else if (item.sentiment === 'bearish') {
    impactIntensityScore = isCoreSector ? -18 : -12;
  } else {
    impactIntensityScore = 0;
  }

  // Authority buzz score: Source weight & viral spread (-15 to +15)
  let authorityBuzzScore = 0;
  const buzz = item.buzzScore || 50;
  const isAuthoritative = ['Bộ Tài chính', 'Thời báo Tài chính', 'TTXVN', 'VTV1', 'VnEconomy', 'Báo Đầu tư'].includes(item.source || '');
  const buzzFactor = Math.round((buzz - 50) / 5); // [-10 to 10]
  if (item.sentiment === 'bullish') {
    authorityBuzzScore = Math.min(15, (isAuthoritative ? 6 : 3) + Math.max(0, buzzFactor));
  } else if (item.sentiment === 'bearish') {
    authorityBuzzScore = Math.max(-15, (isAuthoritative ? -6 : -3) - Math.abs(buzzFactor));
  } else {
    authorityBuzzScore = 0;
  }

  // Compute composite score
  let totalScore = keywordPolarityScore + policyContextScore + impactIntensityScore + authorityBuzzScore;
  totalScore = Math.max(-100, Math.min(100, totalScore));

  // Harmonize with item.sentimentScore if already provided
  if (typeof item.sentimentScore === 'number' && item.sentimentScore !== 0) {
    totalScore = item.sentimentScore;
  }

  return {
    keywordPolarityScore,
    policyContextScore,
    impactIntensityScore,
    authorityBuzzScore,
    totalScore,
    positiveKeywords: Array.from(new Set(positiveKeywords)),
    negativeKeywords: Array.from(new Set(negativeKeywords)),
    mofDomainKeywords: Array.from(new Set(mofDomainKeywords)),
    tokens
  };
}

interface GapRule {
  id: string;
  keywords: string[];
  topicConcern: string;
  informationDeficit: string;
  citizenBizGuidance: string[];
  leadAgency: string;
  campaignTitle: string;
  communicationSteps: string[];
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

const MEDIA_GAP_RULES: GapRule[] = [
  {
    id: 'ecommerce_tax',
    keywords: ['thương mại điện tử', 'tmđt', 'livestream', 'kinh doanh online', 'bán hàng qua mạng', 'tiktok shop', 'shopee', 'lazada', 'etax mobile', 'thuế tmđt', 'truy thu thuế online'],
    topicConcern: 'Người bán hàng online, streamer và hộ kinh doanh cá thể lúng túng về biểu thuế, thời hạn kê khai và lo ngại bị phạt truy thu thuế.',
    informationDeficit: 'Thiếu cẩm nang infographic hướng dẫn từng bước kê khai trên eTax Mobile; dư luận hiểu nhầm về cách tính thuế trên doanh thu hay lợi nhuận.',
    citizenBizGuidance: [
      '1. Tải ứng dụng eTax Mobile và đăng nhập bằng tài khoản VNeID để tra cứu nghĩa vụ thuế.',
      '2. Tổng hợp doanh thu thực nhận qua các sàn TMĐT và tài khoản ngân hàng kinh doanh trong kỳ.',
      '3. Nộp tờ khai thuế trực tuyến theo quý hoặc liên hệ Chi cục Thuế địa phương để được hướng dẫn thủ tục tự nguyện kê khai không bị xử phạt chậm nộp.'
    ],
    leadAgency: 'Cục Thuế (Cục Thuế Doanh nghiệp Nhỏ & Cá nhân)',
    campaignTitle: 'Chiến dịch truyền thông: "Cẩm nang Kê khai Thuế TMĐT & Hướng dẫn Hộ kinh doanh số"',
    communicationSteps: [
      '1. Phát hành bộ Infographic đồ họa và video ngắn 60s hướng dẫn từng bước kê khai trên eTax Mobile.',
      '2. Tổ chức Tọa đàm trực tuyến "Giải đáp chính sách thuế TMĐT: Quyền lợi và nghĩa vụ của người kinh doanh số".',
      '3. Ban hành Công văn chỉ đạo các Cục Thuế mở bàn hướng dẫn riêng và đường dây nóng hỗ trợ người nộp thuế.'
    ],
    severity: 'HIGH'
  },
  {
    id: 'vat_refund',
    keywords: ['hoàn thuế', 'hoàn thuế vat', 'chậm hoàn thuế', 'hồ sơ hoàn thuế', 'kiểm tra trước hoàn', 'hoàn trước kiểm sau', 'ách tắc hoàn thuế', 'gỗ', 'sắn', 'cao su'],
    topicConcern: 'Doanh nghiệp xuất khẩu bức xúc do hồ sơ hoàn thuế VAT bị kéo dài, ảnh hưởng nghiêm trọng đến dòng vốn lưu động.',
    informationDeficit: 'Chưa công khai minh bạch tiêu chí phân loại rủi ro hồ sơ (Luồng Xanh / Luồng Đỏ); thiếu hướng dẫn xử lý xác minh hóa đơn F1, F2 từ đầu nguồn.',
    citizenBizGuidance: [
      '1. Rà soát kỹ tính hợp pháp của chuỗi hóa đơn đầu vào và chứng từ thanh toán không dùng tiền mặt.',
      '2. Chủ động phối hợp cung cấp tài liệu giải trình xác minh nguồn gốc hàng hóa cho cơ quan thuế trong 03 ngày làm việc.',
      '3. Sử dụng cổng dịch vụ công trực tuyến để theo dõi trạng thái tiếp nhận và xử lý hồ sơ hoàn thuế.'
    ],
    leadAgency: 'Cục Thuế (Vụ Kê khai & Kế toán Thuế)',
    campaignTitle: 'Chiến dịch minh bạch hóa: "Quy trình Hoàn thuế VAT Nhanh - Đúng - Trúng cho Doanh nghiệp"',
    communicationSteps: [
      '1. Công bố công khai thời hạn cam kết giải quyết hồ sơ hoàn thuế VAT phân loại theo mức độ rủi ro.',
      '2. Đăng tải bài viết chuyên sâu trên Báo Đầu tư & Thời báo Tài chính về việc ứng dụng AI cảnh báo gian lận để bảo vệ DN chân chính.',
      '3. Tổ chức Hội nghị đối thoại trực tiếp với các Hiệp hội ngành hàng xuất khẩu trọng điểm (gỗ, nông sản, cao su).'
    ],
    severity: 'HIGH'
  },
  {
    id: 'gold_invoice_market',
    keywords: ['vàng', 'tiệm vàng', 'hóa đơn vàng', 'hóa đơn điện tử máy tính tiền', 'mua bán vàng', 'chênh lệch giá vàng', 'sjc', 'nghị định 24'],
    topicConcern: 'Người dân và tiểu thương kinh doanh vàng lo ngại về yêu cầu cung cấp CCCD khi mua vàng và quy định xuất hóa đơn điện tử từng lần.',
    informationDeficit: 'Chưa giải thích rõ quyền lợi người mua vàng có hóa đơn hợp pháp (bảo vệ quyền sở hữu, không bị ép giá khi bán lại); quy định bảo mật dữ liệu cá nhân.',
    citizenBizGuidance: [
      '1. Luôn yêu cầu tiệm vàng xuất hóa đơn điện tử có mã khởi tạo từ máy tính tiền khi giao dịch.',
      '2. Lưu giữ hóa đơn điện tử (qua email/tin nhắn SMS) để đối chiếu nguồn gốc hợp pháp khi bán lại.',
      '3. Không mua bán vàng tại các điểm không có giấy phép hoặc không xuất hóa đơn để tránh rủi ro vàng trôi nổi.'
    ],
    leadAgency: 'Cục Thuế phối hợp Vụ Quản lý Ngoại hối (NHNN)',
    campaignTitle: 'Chiến dịch truyền thông: "Minh bạch Thị trường Vàng - Bảo vệ Quyền lợi Người tiêu dùng"',
    communicationSteps: [
      '1. Truyền thông mạnh mẽ thông điệp: Hóa đơn điện tử là giấy khai sinh bảo vệ tài sản vàng của người dân.',
      '2. Công khai danh sách các doanh nghiệp vàng uy tín đã hoàn thành kết nối 100% hóa đơn điện tử.',
      '3. Phối hợp với Đài Truyền hình Việt Nam (VTV1) phát phóng sự chuyên đề về lợi ích thị trường vàng minh bạch.'
    ],
    severity: 'HIGH'
  },
  {
    id: 'non_prefunding_ftse',
    keywords: ['non-prefunding', 'ký quỹ', 'thông tư 68', 'nâng hạng', 'ftse russell', 'ctck', 'giao dịch ký quỹ', 'khối ngoại', 'nhà đầu tư nước ngoài'],
    topicConcern: 'Các CTCK và Nhà đầu tư nước ngoài cần hướng dẫn chi tiết quy trình xử lý khi nhà đầu tư ngoại không đủ tiền thanh toán tại ngày T+2.',
    informationDeficit: 'Chưa có sổ tay hướng dẫn nghiệp vụ chuẩn hóa cơ chế quản trị rủi ro thanh toán giữa CTCK và Ngân hàng lưu ký.',
    citizenBizGuidance: [
      '1. CTCK hoàn thiện hệ thống chấm điểm hạn mức tín dụng và ký hợp đồng mở rộng dịch vụ Non-prefunding với NĐT tổ chức.',
      '2. NĐT trong nước nắm bắt cơ hội dòng vốn ngoại sắp đổ vào các cổ phiếu vốn hóa lớn thuộc rổ chỉ số chuẩn.',
      '3. Tuân thủ nghiêm ngặt quy chế công bố thông tin và báo cáo giao dịch khối ngoại theo Thông tư 68.'
    ],
    leadAgency: 'Ủy ban Chứng khoán Nhà nước (UBCKNN)',
    campaignTitle: 'Chiến dịch truyền thông Quốc tế: "Việt Nam Sẵn sàng Nâng hạng Thị trường Chứng khoán"',
    communicationSteps: [
      '1. Phát hành Tài liệu Hướng dẫn Song ngữ (Việt - Anh) về Quy trình Giao dịch Không cần Ký quỹ 100%.',
      '2. Tổ chức chuỗi Roadshow trực tuyến đối thoại với các Quỹ đầu tư quốc tế và tổ chức xếp hạng FTSE/MSCI.',
      '3. Đưa tin đậm nét trên các kênh tài chính quốc tế (Bloomberg, Reuters) về cam kết thể chế của Bộ Tài chính.'
    ],
    severity: 'HIGH'
  },
  {
    id: 'corporate_bond_debt',
    keywords: ['trái phiếu', 'tpdn', 'trái chủ', 'đáo hạn trái phiếu', 'nghị định 08', 'nghị định 65', 'chậm trả gốc lãi', 'hoán đổi trái phiếu'],
    topicConcern: 'Trái chủ cá nhân hoang mang khi nhận được đề nghị hoán đổi tài sản hoặc gia hạn kỳ hạn trái phiếu thêm 2 năm từ tổ chức phát hành.',
    informationDeficit: 'Thiếu hướng dẫn pháp lý cụ thể về quyền biểu quyết của trái chủ và quy trình định giá tài sản hoán đổi theo Nghị định 08.',
    citizenBizGuidance: [
      '1. Đọc kỹ phương án tái cơ cấu của doanh nghiệp phát hành và hồ sơ định giá tài sản bảo đảm độc lập.',
      '2. Tham gia hội nghị trái chủ để thực hiện quyền biểu quyết theo tỷ lệ sở hữu hợp pháp.',
      '3. Đề nghị đại diện người sở hữu trái phiếu (Ngân hàng/CTCK lưu ký) cung cấp báo cáo giám sát tiến độ định kỳ.'
    ],
    leadAgency: 'Vụ Tài chính Ngân hàng & UBCKNN',
    campaignTitle: 'Chiến dịch truyền thông: "Ổn định & Tái cấu trúc Lành mạnh Thị trường Trái phiếu"',
    communicationSteps: [
      '1. Phát hành bản tin Q&A hướng dẫn quyền và nghĩa vụ của nhà đầu tư trái phiếu khi tham gia đàm phán nợ.',
      '2. Công khai các doanh nghiệp phát hành đã thực hiện đầy đủ cam kết thanh toán để củng cố niềm tin thị trường.',
      '3. Nhấn mạnh thông điệp thượng tôn pháp luật và trách nhiệm của doanh nghiệp đối với trái chủ.'
    ],
    severity: 'HIGH'
  },
  {
    id: 'land_tax_valuation',
    keywords: ['bảng giá đất', 'luật đất đai', 'tiền thuê đất', 'tiền sử dụng đất', 'định giá đất', 'giảm 30% tiền thuê đất', 'bất động sản'],
    topicConcern: 'Doanh nghiệp và người dân băn khoăn về cách tính tiền sử dụng đất mới và hồ sơ thụ hưởng chính sách giảm tiền thuê đất.',
    informationDeficit: 'Chưa có bảng tra cứu trực quan các mức giảm tiền thuê đất; quy trình thẩm định giá đất tại các địa phương còn thiếu thống nhất.',
    citizenBizGuidance: [
      '1. Chuẩn bị hợp đồng thuê đất và giấy nộp tiền thuê đất của năm trước để làm căn cứ nộp hồ sơ xin giảm.',
      '2. Nộp Giấy đề nghị giảm tiền thuê đất theo mẫu quy định tại Nghị định của Chính phủ trước ngày 30/11.',
      '3. Tra cứu bảng giá đất ban hành của UBND tỉnh/thành phố để ước tính chính xác nghĩa vụ tài chính.'
    ],
    leadAgency: 'Cục Quản lý Công sản & Cục Thuế',
    campaignTitle: 'Chiến dịch hỗ trợ: "Triển khai Chính sách Giảm Tiền thuê đất - Đồng hành cùng Doanh nghiệp"',
    communicationSteps: [
      '1. Đăng tải mẫu tờ khai điện tử đơn giản hóa và video hướng dẫn nộp hồ sơ trong 5 phút.',
      '2. Chỉ đạo cơ quan thuế cơ sở tiếp nhận hồ sơ trực tuyến 24/7, tuyệt đối không yêu cầu thêm giấy tờ ngoài quy định.',
      '3. Họp báo công bố kết quả thực thi gói hỗ trợ tài khóa và tổng số tiền đã miễn giảm cho DN.'
    ],
    severity: 'MEDIUM'
  },
  {
    id: 'public_investment_disbursement',
    keywords: ['giải ngân đầu tư công', 'đầu tư công', 'vốn ngân sách', 'chậm giải ngân', 'vướng giải phóng mặt bằng', 'vật liệu xây dựng'],
    topicConcern: 'Dư luận lo ngại một số địa phương, dự án hạ tầng lớn giải ngân vốn ngân sách đạt tỷ lệ thấp, gây lãng phí nguồn lực.',
    informationDeficit: 'Chưa làm rõ nguyên nhân khách quan (mặt bằng, nguồn mỏ cát, thủ tục chuyển đổi đất rừng) so với nguyên nhân chủ quan (năng lực BQL).',
    citizenBizGuidance: [
      '1. Các nhà thầu chủ động lập hồ sơ thanh toán khối lượng hoàn thành theo từng phân kỳ gửi Kho bạc Nhà nước.',
      '2. Ban Quản lý dự án áp dụng dịch vụ công trực tuyến của KBNN để rút ngắn thời gian xử lý xuống dưới 24h.',
      '3. Người dân vùng dự án theo dõi phương án bồi thường, tái định cư công khai tại trụ sở UBND xã/phường.'
    ],
    leadAgency: 'Vụ Đầu tư & Kho bạc Nhà nước',
    campaignTitle: 'Chiến dịch hành động: "Thúc đẩy 100% Giải ngân Vốn Đầu tư công - Động lực Tăng trưởng"',
    communicationSteps: [
      '1. Công khai bảng xếp hạng tỷ lệ giải ngân của các Bộ, ngành, địa phương hàng tháng trên Cổng TTĐT Bộ Tài chính.',
      '2. Truyền thông mô hình "Kho bạc 3 không" (Không giấy tờ - Không tiền mặt - Không chậm trễ) trong kiểm soát chi.',
      '3. Phát sóng phóng sự ghi nhận tinh thần "vượt nắng thắng mưa" trên các công trường trọng điểm quốc gia.'
    ],
    severity: 'MEDIUM'
  },
  {
    id: 'gasoline_price_stabilization',
    keywords: ['quỹ bình ổn giá', 'xăng dầu', 'giá xăng', 'giá dầu', 'cục quản lý giá', 'bình ổn giá', 'luật giá 2023'],
    topicConcern: 'Người dân và doanh nghiệp vận tải thắc mắc về cơ chế trích lập - chi sử dụng Quỹ BOG xăng dầu khi giá thế giới biến động mạnh.',
    informationDeficit: 'Chưa giải thích minh bạch công thức tính giá cơ sở và số dư Quỹ BOG tại từng doanh nghiệp đầu mối.',
    citizenBizGuidance: [
      '1. Theo dõi thông báo điều hành giá xăng dầu định kỳ vào thứ Năm hàng tuần của Liên Bộ Công Thương - Tài chính.',
      '2. Doanh nghiệp vận tải chủ động lập kế hoạch kinh doanh và tối ưu hóa lộ trình logistics theo chu kỳ giá.',
      '3. Phản ánh ngay đến Tổng đài Quản lý Thị trường nếu phát hiện cây xăng găm hàng, tăng giá sai quy định.'
    ],
    leadAgency: 'Cục Quản lý Giá (Bộ Tài chính)',
    campaignTitle: 'Chiến dịch minh bạch: "Công khai Cơ chế Điều hành Giá Xăng dầu & Bình ổn Thị trường"',
    communicationSteps: [
      '1. Công khai bảng số liệu số dư Quỹ BOG xăng dầu theo quý trên Cổng TTĐT Bộ Tài chính.',
      '2. Phát hành Infographic phân tích các yếu tố cấu thành giá bán lẻ xăng dầu (giá nhập khẩu, thuế, chi phí định mức).',
      '3. Trả lời phỏng vấn báo chí khẳng định nguồn cung xăng dầu trong nước luôn được bảo đảm vững chắc.'
    ],
    severity: 'MEDIUM'
  }
];

export function generateSentimentDiagnostic(item: ScrapedNewsItem): SentimentDiagnostic {
  const text = `${item.title || ''} ${item.summary || ''} ${item.snippet || ''} ${item.sentimentReason || ''}`.toLowerCase();
  const polarity = item.sentiment || 'neutral';
  const score = item.sentimentScore || 0;

  // Extract key drivers
  const positiveDrivers: string[] = [];
  const negativeDrivers: string[] = [];

  if (text.includes('vượt dự toán') || text.includes('vượt mốc') || text.includes('thu ngân sách')) {
    positiveDrivers.push('Thu ngân sách nhà nước tăng trưởng vững chắc, vượt tiến độ dự toán đề ra.');
  }
  if (text.includes('hóa đơn điện tử') || text.includes('hải quan thông minh') || text.includes('chuyển đổi số')) {
    positiveDrivers.push('Hiện đại hóa, chuyển đổi số ngành tài chính (100% HĐĐT, dịch vụ công trực tuyến).');
  }
  if (text.includes('nâng hạng') || text.includes('non-prefunding') || text.includes('thông tư 68')) {
    positiveDrivers.push('Đột phá thể chế tháo gỡ nút thắt ký quỹ, tiến gần mục tiêu nâng hạng FTSE Russell.');
  }
  if (text.includes('giải ngân') || text.includes('đầu tư công')) {
    positiveDrivers.push('Dòng vốn đầu tư công được đẩy mạnh giải ngân vào các dự án hạ tầng trọng điểm.');
  }
  if (text.includes('fdi') || text.includes('xuất siêu') || text.includes('tín nhiệm')) {
    positiveDrivers.push('Kinh tế vĩ mô ổn định, kiểm soát tốt lạm phát và nâng tầm tín nhiệm quốc gia.');
  }
  if (text.includes('giảm thuế') || text.includes('gia hạn thuế') || text.includes('tiền thuê đất')) {
    positiveDrivers.push('Chính sách tài khóa kịp thời hỗ trợ người dân và cộng đồng doanh nghiệp phục hồi.');
  }

  if (text.includes('chậm hoàn') || text.includes('ách tắc')) {
    negativeDrivers.push('Vướng mắc thủ tục xác minh hồ sơ hoàn thuế VAT kéo dài làm ứ đọng vốn DN.');
  }
  if (text.includes('gian lận') || text.includes('trốn thuế') || text.includes('hóa đơn khống')) {
    negativeDrivers.push('Hành vi mua bán hóa đơn bất hợp pháp và gian lận thuế tinh vi cần chấn chỉnh.');
  }
  if (text.includes('đáo hạn') || text.includes('chậm trả') || text.includes('trái phiếu')) {
    negativeDrivers.push('Áp lực thanh toán nghĩa vụ nợ trái phiếu doanh nghiệp đáo hạn gia tăng.');
  }
  if (text.includes('bán tháo') || text.includes('giảm sâu') || text.includes('lao dốc')) {
    negativeDrivers.push('Tâm lý thị trường chứng khoán biến động tiêu cực do tin đồn hoặc áp lực chốt lời.');
  }
  if (text.includes('chậm giải ngân') || text.includes('vướng mặt bằng')) {
    negativeDrivers.push('Tỷ lệ giải ngân đầu tư công tại một số địa phương còn chậm so với kế hoạch.');
  }

  let whyExplanation = '';
  let keyDrivers: string[] = [];
  let actionablePlan: { title: string; steps: string[]; targetOutcome: string };

  if (polarity === 'bearish' || score < -10) {
    keyDrivers = negativeDrivers.length > 0 ? negativeDrivers : [
      'Phát sinh sự cố hoặc áp lực điều chỉnh rủi ro trong quản lý điều hành.',
      'Dư luận xã hội và thị trường xuất hiện mối quan ngại cần được giải tỏa.',
      'Cần có biện pháp giám sát chặt chẽ từ cơ quan quản lý chuyên ngành.'
    ];
    whyExplanation = `Bài viết mang sắc thái TIÊU CỰC / CẢNH BÁO (Điểm: ${score}/100) do phản ánh ${keyDrivers[0].toLowerCase()} Điều này đặt ra yêu cầu cơ quan quản lý phải nhanh chóng vào cuộc kiểm soát, xử lý và định hướng thông tin tránh tạo tâm lý hoang mang lan rộng.`;

    actionablePlan = {
      title: 'Kế hoạch Kiểm soát Rủi ro & Xử lý Khủng hoảng',
      steps: [
        '1. Thành lập đoàn kiểm tra/xác minh thực địa: Rà soát tính chính xác của phản ánh báo chí và xác định nguyên nhân cốt lõi trong 24h.',
        '2. Phát ngôn chính thống định hướng dư luận: Ban hành Thông cáo Báo chí hoặc Công văn hướng dẫn làm rõ sự thật, tránh tin đồn thất thiệt.',
        '3. Tháo gỡ nút thắt cơ chế: Rà soát kẽ hở chính sách và hướng dẫn quy trình thực thi nghiệp vụ thông suốt.'
      ],
      targetOutcome: 'Ngăn chặn khủng hoảng truyền thông lây lan, bảo vệ quyền lợi hợp pháp của người dân/DN và củng cố kỷ cương quản lý.'
    };
  } else if (polarity === 'bullish' || score > 10) {
    keyDrivers = positiveDrivers.length > 0 ? positiveDrivers : [
      'Ghi nhận kết quả quản lý điều hành tích cực và số liệu tăng trưởng khả quan.',
      'Chính sách đi vào cuộc sống, tạo hiệu ứng lan tỏa niềm tin cho thị trường.',
      'Cải cách hành chính và chuyển đổi số mang lại hiệu quả thực chất.'
    ];
    whyExplanation = `Bài viết mang sắc thái TÍCH CỰC / ĐIỂM SÁNG (Điểm: +${score}/100) nhờ ghi nhận ${keyDrivers[0].toLowerCase()} Đây là thành tựu thực chất cần được biểu dương và tận dụng làm đòn bẩy truyền thông củng cố niềm tin của toàn xã hội.`;

    actionablePlan = {
      title: 'Kế hoạch Phát huy Điểm mạnh & Lan tỏa Truyền thông',
      steps: [
        '1. Đẩy mạnh chiến dịch truyền thông tích cực: Đưa tin sâu trên Cổng TTĐT Bộ Tài chính, Thời báo Tài chính, VTV1 để lan tỏa kết quả.',
        '2. Nhân rộng mô hình thành công: Chỉ đạo các đơn vị trực thuộc học tập kinh nghiệm thực tiễn và chuẩn hóa quy trình triển khai.',
        '3. Củng cố kỳ vọng nhà đầu tư: Sử dụng số liệu thành tựu thực tế để quảng bá môi trường đầu tư kinh doanh minh bạch của Việt Nam.'
      ],
      targetOutcome: 'Tạo động lực tinh thần cho toàn ngành, khơi thông dòng vốn đầu tư và nâng tầm uy tín quản lý nhà nước của Bộ Tài chính.'
    };
  } else {
    keyDrivers = [
      'Thông tin phản ánh diễn biến khách quan, cập nhật thị trường và số liệu định kỳ.',
      'Chưa xuất hiện biến động đột biến hoặc rủi ro nghiêm trọng.',
      'Chính sách đang trong giai đoạn triển khai lấy ý kiến hoặc thực thi thường nhật.'
    ];
    whyExplanation = `Bài viết mang sắc thái TRUNG TÍNH (Điểm: ${score}/100), tập trung vào phản ánh sự kiện thực tế, trao đổi chuyên môn hoặc cung cấp số liệu thị trường thường nhật mà không mang yếu tố rủi ro hay đột phá nổi bật.`;

    actionablePlan = {
      title: 'Kế hoạch Giám sát Thường nhật & Dự báo Vĩ mô',
      steps: [
        '1. Tiếp tục duy trì cơ chế giám sát thời thực các luồng dư luận liên quan.',
        '2. Cập nhật dữ liệu vào cơ sở tri thức vĩ mô phục vụ công tác tham mưu định kỳ.',
        '3. Sẵn sàng phương án truyền thông giải thích khi chính sách chính thức được ban hành.'
      ],
      targetOutcome: 'Đảm bảo thông tin điều hành luôn thông suốt, chủ động nắm bắt diễn biến để không bị động, bất ngờ.'
    };
  }

  // Tự động phân tách thành phần điểm số & trích xuất từ khóa trọng điểm
  const decomposition = decomposeSentimentScore(item);

  // Tự động suy luận Chuỗi tác động hệ quả (Impact Chain) cho bài viết tiêu cực/cảnh báo rủi ro
  const impactChain = (polarity === 'bearish' || score < 0)
    ? generateImpactChain(item, polarity, score)
    : undefined;

  return {
    polarity,
    score,
    whyExplanation,
    keyDrivers,
    impactChain,
    decomposition,
    actionablePlan
  };
}

/**
 * Tự động suy luận Chuỗi Tác động Hệ quả (Impact Chain) cho bài viết tiêu cực
 * Phân tích kênh truyền dẫn rủi ro từ lĩnh vực khởi phát đến các lĩnh vực khác trong 16 lĩnh vực quản lý của Bộ Tài chính
 */
export function generateImpactChain(
  item: ScrapedNewsItem,
  polarity: SentimentType = item.sentiment || 'bearish',
  score: number = item.sentimentScore || -40
): NegativeImpactChain {
  const originSector: SectorType = (item.sector as SectorType) || 'policy';
  const originSectorNameVi = item.sectorNameVi || SECTOR_NAMES[originSector] || 'Lĩnh vực Quản lý';
  const text = `${item.title || ''} ${item.summary || ''} ${item.snippet || ''} ${item.sentimentReason || ''}`.toLowerCase();

  const title = item.title || '';

  // 1. Nhóm Trái phiếu Doanh nghiệp & Thị trường vốn (bonds)
  if (originSector === 'bonds' || text.includes('trái phiếu') || text.includes('tpdn') || text.includes('đáo hạn nợ')) {
    const nodes: ImpactChainNode[] = [
      {
        sector: 'bonds',
        sectorNameVi: 'Trái phiếu (TPDN & TPCP)',
        order: 1,
        level: 'DIRECT',
        severity: 'HIGH',
        mechanism: 'Tắc nghẽn dòng tiền thanh toán gốc và lãi trái phiếu đáo hạn của các tổ chức phát hành.',
        consequence: 'Gia tăng áp lực thanh khoản ngắn hạn, nguy cơ đàm phán gia hạn trái phiếu kéo dài gây lo ngại cho trái chủ.',
        preventiveMitigation: 'Thúc đẩy đàm phán hoán đổi nợ hợp pháp theo Nghị định 08/2023/NĐ-CP và tăng cường giám sát công bố thông tin minh bạch.'
      },
      {
        sector: 'realestate',
        sectorNameVi: 'Bất động sản & Đất đai',
        order: 2,
        level: 'SECONDARY',
        severity: 'HIGH',
        mechanism: 'Doanh nghiệp BĐS (chiếm tỷ trọng phát hành lớn) bị thắt chặt dòng vốn, thiếu tiền tiếp tục triển khai dự án.',
        consequence: 'Đình trệ thi công các đại dự án, đóng băng thanh khoản tài sản thế chấp và giảm nguồn cung nhà ở.',
        preventiveMitigation: 'Tập trung tháo gỡ pháp lý cấp phép dự án để khơi thông dòng tiền bán hàng và huy động vốn thương mại.'
      },
      {
        sector: 'banking_credit',
        sectorNameVi: 'Ngân hàng & Tín dụng',
        order: 2,
        level: 'SECONDARY',
        severity: 'HIGH',
        mechanism: 'Nợ xấu tiềm ẩn từ các khoản đầu tư TPDN và dư nợ cho vay BĐS chuyển nhóm nợ tại các ngân hàng thương mại.',
        consequence: 'Áp lực tăng trích lập dự phòng rủi ro tín dụng, làm giảm biên lợi nhuận ngân hàng và siết điều kiện vay mới.',
        preventiveMitigation: 'Giám sát chặt chẽ hệ số an toàn vốn (CAR) và giãn lộ trình phân loại nợ có kiểm soát theo Thông tư của NHNN.'
      },
      {
        sector: 'treasury_budget',
        sectorNameVi: 'Kho bạc & Ngân sách',
        order: 3,
        level: 'SYSTEMIC',
        severity: 'MEDIUM',
        mechanism: 'Thị trường BĐS và DN khó khăn làm sụt giảm nguồn thu tiền sử dụng đất và thuế thu nhập doanh nghiệp (TNDN).',
        consequence: 'Bội chi ngân sách địa phương chịu áp lực, ảnh hưởng kế hoạch thu nộp ngân sách nhà nước cả năm.',
        preventiveMitigation: 'Chủ động điều hành dự toán thu, tiết kiệm chi thường xuyên và đẩy nhanh cổ phần hóa thu hồi vốn nhà nước.'
      },
      {
        sector: 'stocks',
        sectorNameVi: 'Chứng khoán (UBCK)',
        order: 3,
        level: 'SYSTEMIC',
        severity: 'MEDIUM',
        mechanism: 'Tâm lý thị trường e ngại rủi ro chéo, áp lực bán giải chấp cổ phiếu của lãnh đạo và tổ chức cầm cố.',
        consequence: 'Chỉ số VN-Index biến động giảm điểm, làm chậm tiến trình thu hút dòng vốn ngoại và nâng hạng TTCK.',
        preventiveMitigation: 'UBCKNN chủ động phối hợp các Sở giao dịch công bố thông tin chính xác, kiểm soát tin đồn và thanh tra giao dịch bất thường.'
      }
    ];

    return {
      originSector: 'bonds',
      originSectorNameVi: 'Trái phiếu (TPDN & TPCP)',
      rootIssue: `Áp lực đáo hạn và rủi ro thanh khoản trên thị trường trái phiếu doanh nghiệp: "${title}"`,
      transmissionPathSummary: 'Trái phiếu (TPDN) ➔ Bất động sản ➔ Tín dụng Ngân hàng ➔ Thu Ngân sách & Chứng khoán',
      spilloverRiskLevel: 'CRITICAL',
      chainNodes: nodes,
      containmentRecommendation: 'Chỉ đạo Tổ công tác thị trường vốn khẩn trương rà soát nhóm DN đáo hạn lớn; phối hợp NHNN tháo gỡ tín dụng dự án khả thi nhằm ngắt mạch lây lan sang hệ thống ngân hàng.'
    };
  }

  // 2. Nhóm Thuế, Hóa đơn & Quản lý Thu (tax)
  if (originSector === 'tax' || text.includes('hoàn thuế') || text.includes('hóa đơn khống') || text.includes('truy thu thuế') || text.includes('trốn thuế')) {
    const isVatRefund = text.includes('hoàn thuế');
    const nodes: ImpactChainNode[] = isVatRefund ? [
      {
        sector: 'tax',
        sectorNameVi: 'Thuế & Thu NSNN',
        order: 1,
        level: 'DIRECT',
        severity: 'HIGH',
        mechanism: 'Thời gian thẩm định và phân loại hồ sơ hoàn thuế GTGT bị kéo dài do quy trình xác minh chuỗi cung ứng.',
        consequence: 'Ùn tắc hồ sơ hoàn thuế, phản ánh bức xúc của các hiệp hội ngành nghề và doanh nghiệp xuất khẩu.',
        preventiveMitigation: 'Ban hành quy trình hoàn thuế điện tử tự động, chuẩn hóa tiêu chí phân loại luồng xanh - luồng đỏ rõ ràng.'
      },
      {
        sector: 'enterprise',
        sectorNameVi: 'Doanh nghiệp & M&A',
        order: 2,
        level: 'SECONDARY',
        severity: 'HIGH',
        mechanism: 'Dòng vốn lưu động hàng nghìn tỷ đồng bị ứ đọng, doanh nghiệp không có nguồn tài chính quay vòng mua nguyên liệu.',
        consequence: 'Đình trệ sản xuất, doanh nghiệp phải vay ngân hàng chịu thêm chi phí lãi vay, giảm năng lực cạnh tranh.',
        preventiveMitigation: 'Áp dụng cơ chế "hoàn trước - kiểm sau" có bảo lãnh tín dụng ngân hàng cho các DN uy tín.'
      },
      {
        sector: 'customs',
        sectorNameVi: 'Hải quan & XNK',
        order: 2,
        level: 'SECONDARY',
        severity: 'MEDIUM',
        mechanism: 'Thiếu dòng tiền khiến tiến độ thực hiện các hợp đồng xuất nhập khẩu nguyên vật liệu bị chậm trễ.',
        consequence: 'Nguy cơ hủy hợp đồng ngoại thương, giảm kim ngạch xuất khẩu các mặt hàng chủ lực (gỗ, nông sản, cao su).',
        preventiveMitigation: 'Cơ quan Hải quan và Thuế liên thông dữ liệu tờ khai hải quan điện tử để rút ngắn thời gian đối soát.'
      },
      {
        sector: 'macro',
        sectorNameVi: 'Tăng trưởng GDP & Vĩ mô',
        order: 3,
        level: 'SYSTEMIC',
        severity: 'MEDIUM',
        mechanism: 'Tác động tiêu cực đến chuỗi cung ứng sản xuất hàng xuất khẩu và tốc độ tăng trưởng kinh tế vĩ mô.',
        consequence: 'Ảnh hưởng chỉ tiêu tăng trưởng GDP quý và tâm lý nhà đầu tư về môi trường kinh doanh minh bạch.',
        preventiveMitigation: 'Chỉ đạo quyết liệt các Cục Thuế địa phương hoàn tất giải quyết dứt điểm hồ sơ đúng hạn luật định.'
      }
    ] : [
      {
        sector: 'tax',
        sectorNameVi: 'Thuế & Thu NSNN',
        order: 1,
        level: 'DIRECT',
        severity: 'HIGH',
        mechanism: 'Hành vi mua bán hóa đơn điện tử khống, gian lận khấu trừ thuế GTGT và trốn thuế TNDN.',
        consequence: 'Thất thu nguồn thu ngân sách nhà nước, phá vỡ trật tự kỷ cương quản lý thuế.',
        preventiveMitigation: 'Khai thác ứng dụng AI phân tích dữ liệu hóa đơn điện tử để phát hiện chuỗi mua bán lòng vòng 24/7.'
      },
      {
        sector: 'inspection_audit',
        sectorNameVi: 'Thanh tra & Giám sát',
        order: 2,
        level: 'SECONDARY',
        severity: 'HIGH',
        mechanism: 'Yêu cầu mở rộng thanh tra liên ngành và chuyển hồ sơ các vụ việc vi phạm nghiêm trọng sang cơ quan điều tra.',
        consequence: 'Tăng áp lực khối lượng thanh tra, xử phạt vi phạm hành chính và thu hồi tiền thuế trốn lậu.',
        preventiveMitigation: 'Tăng cường phối hợp giữa Thanh tra Tài chính, Cục Thuế và Cục Cảnh sát kinh tế (C03).'
      },
      {
        sector: 'treasury_budget',
        sectorNameVi: 'Kho bạc & Ngân sách',
        order: 3,
        level: 'SYSTEMIC',
        severity: 'MEDIUM',
        mechanism: 'Thất thu thuế ảnh hưởng đến kế hoạch cân đối ngân sách nhà nước và tỷ lệ thu nội địa.',
        consequence: 'Tạo lỗ hổng thu chi ngân sách, bất bình đẳng môi trường cạnh tranh giữa các doanh nghiệp làm ăn chân chính.',
        preventiveMitigation: 'Giao chỉ tiêu thu bổ sung và đẩy mạnh thanh tra chống chuyển giá, hóa đơn bất hợp pháp.'
      }
    ];

    return {
      originSector: 'tax',
      originSectorNameVi: 'Thuế & Thu NSNN',
      rootIssue: `Vấn đề phát sinh trong quản lý thuế và hoàn thuế: "${title}"`,
      transmissionPathSummary: isVatRefund
        ? 'Thuế & Hoàn VAT ➔ Dòng vốn Doanh nghiệp ➔ Hải quan & XNK ➔ Tăng trưởng Vĩ mô'
        : 'Thuế & Gian lận Hóa đơn ➔ Doanh nghiệp ➔ Thanh tra Tài chính ➔ Cân đối Ngân sách',
      spilloverRiskLevel: 'ELEVATED',
      chainNodes: nodes,
      containmentRecommendation: 'Chỉ đạo Cục Thuế khẩn trương rà soát hệ thống phân luồng rủi ro; tháo gỡ điểm nghẽn hoàn thuế cho DN tuân thủ tốt và xử lý nghiêm đối tượng cố tình lập công ty ma trốn thuế.'
    };
  }

  // 3. Nhóm Đầu tư công & Giải ngân vốn NSNN (public_investment)
  if (originSector === 'public_investment' || text.includes('giải ngân') || text.includes('đầu tư công') || text.includes('vướng mặt bằng') || text.includes('dự án chậm')) {
    const nodes: ImpactChainNode[] = [
      {
        sector: 'public_investment',
        sectorNameVi: 'Đầu tư công & Giải ngân',
        order: 1,
        level: 'DIRECT',
        severity: 'HIGH',
        mechanism: 'Tỷ lệ giải ngân vốn đầu tư công đạt thấp do vướng giải phóng mặt bằng, thủ tục điều chỉnh dự án và vật liệu.',
        consequence: 'Các dự án hạ tầng giao thông trọng điểm bị kéo dài tiến độ, giảm hiệu quả sử dụng nguồn vốn ngân sách.',
        preventiveMitigation: 'Thành lập các Tổ công tác đặc biệt của Chính phủ/Bộ Tài chính kiểm tra, đôn đốc tháo gỡ trực tiếp tại địa phương.'
      },
      {
        sector: 'treasury_budget',
        sectorNameVi: 'Kho bạc & Ngân sách',
        order: 2,
        level: 'SECONDARY',
        severity: 'HIGH',
        mechanism: 'Nguồn vốn NSNN đã bố trí bị tồn ngân tại Kho bạc Nhà nước, không thể thanh toán khối lượng nghiệm thu.',
        consequence: 'Hiệu quả điều hành vốn ngân sách bị giảm sút, tăng chi phí cơ hội của nguồn vốn nhà nước.',
        preventiveMitigation: 'Kho bạc Nhà nước đẩy mạnh kiểm soát chi điện tử "3 không" (Không giấy tờ - Không tiền mặt - Không chậm trễ).'
      },
      {
        sector: 'state_economy',
        sectorNameVi: 'DNNN & SCIC',
        order: 2,
        level: 'SECONDARY',
        severity: 'MEDIUM',
        mechanism: 'Các tổng công ty nhà nước và nhà thầu xây lắp hạ tầng bị chậm thu hồi công nợ xây dựng cơ bản.',
        consequence: 'Dòng tiền thi công bị cạn kiệt, phát sinh nợ đọng xây dựng cơ bản và khó khăn chi trả lương công nhân.',
        preventiveMitigation: 'Cho phép tạm ứng vốn hợp pháp theo quy định để nhà thầu có nguồn lực thu xếp vật tư, nhân công.'
      },
      {
        sector: 'macro',
        sectorNameVi: 'Tăng trưởng GDP & Vĩ mô',
        order: 3,
        level: 'SYSTEMIC',
        severity: 'HIGH',
        mechanism: 'Vốn đầu tư công là "vốn mồi", giải ngân chậm làm giảm tác động lan tỏa kích thích đầu tư tư nhân và FDI.',
        consequence: 'Nguy cơ không hoàn thành mục tiêu tăng trưởng kinh tế (GDP 7% - 8%) và chỉ tiêu giải ngân trên 95% Thủ tướng giao.',
        preventiveMitigation: 'Điều chuyển vốn linh hoạt từ dự án chậm sang dự án có tiến độ giải ngân tốt và khả năng hấp thụ vốn cao.'
      }
    ];

    return {
      originSector: 'public_investment',
      originSectorNameVi: 'Đầu tư công & Giải ngân',
      rootIssue: `Tiến độ giải ngân vốn đầu tư công và ách tắc thực thi dự án: "${title}"`,
      transmissionPathSummary: 'Đầu tư công ➔ Kho bạc & Tồn ngân NSNN ➔ Doanh nghiệp Xây lắp ➔ Tăng trưởng GDP Quốc gia',
      spilloverRiskLevel: 'ELEVATED',
      chainNodes: nodes,
      containmentRecommendation: 'Kiến nghị Lãnh đạo chỉ đạo KBNN linh hoạt thủ tục kiểm soát chi; rà soát điều chuyển vốn kịp thời trước 30/9 và cá thể hóa trách nhiệm người đứng đầu chủ đầu tư chậm giải ngân.'
    };
  }

  // 4. Nhóm Chứng khoán & Thị trường vốn (stocks)
  if (originSector === 'stocks' || text.includes('chứng khoán') || text.includes('vn-index') || text.includes('bán tháo') || text.includes('thao túng giá')) {
    const nodes: ImpactChainNode[] = [
      {
        sector: 'stocks',
        sectorNameVi: 'Chứng khoán (UBCK)',
        order: 1,
        level: 'DIRECT',
        severity: 'HIGH',
        mechanism: 'Áp lực giảm điểm mạnh, thanh khoản suy giảm hoặc phát sinh hành vi thao túng, gian lận công bố thông tin.',
        consequence: 'Vốn hóa thị trường bị hao hụt, tâm lý nhà đầu tư cá nhân hoang mang và kích hoạt lệnh bán tháo giải chấp.',
        preventiveMitigation: 'UBCKNN phối hợp các Sở giao dịch công bố thông tin minh bạch, tăng cường giám sát giao dịch bất thường.'
      },
      {
        sector: 'fdi',
        sectorNameVi: 'Đầu tư Nước ngoài (FDI)',
        order: 2,
        level: 'SECONDARY',
        severity: 'HIGH',
        mechanism: 'Khối ngoại (nhà đầu tư gián tiếp FII) lo ngại biến động rút ròng vốn, làm chậm mục tiêu nâng hạng TTCK FTSE/MSCI.',
        consequence: 'Áp lực rút vốn ngoại tệ, ảnh hưởng vị thế và sức hấp dẫn của thị trường vốn Việt Nam trên trường quốc tế.',
        preventiveMitigation: 'Đẩy nhanh triển khai mô hình Non-Prefunding (Thông tư 68) và vận hành hệ thống KRX đồng bộ.'
      },
      {
        sector: 'bonds',
        sectorNameVi: 'Trái phiếu (TPDN & TPCP)',
        order: 2,
        level: 'SECONDARY',
        severity: 'MEDIUM',
        mechanism: 'Tâm lý thị trường vốn đóng băng lây lan sang kênh phát hành trái phiếu doanh nghiệp mới.',
        consequence: 'Các doanh nghiệp gặp khó khăn trong việc huy động vốn trung và dài hạn qua kênh đại chúng.',
        preventiveMitigation: 'Khuyến khích các tổ chức phát hành uy tín có xếp hạng tín nhiệm chuẩn hóa tiếp cận nhà đầu tư chuyên nghiệp.'
      },
      {
        sector: 'state_economy',
        sectorNameVi: 'DNNN & SCIC',
        order: 3,
        level: 'SYSTEMIC',
        severity: 'MEDIUM',
        mechanism: 'Thị trường chứng khoán ảm đạm làm định giá doanh nghiệp sụt giảm, cản trở kế hoạch thoái vốn nhà nước.',
        consequence: 'Kế hoạch cổ phần hóa và thoái vốn DNNN nộp về Quỹ Hỗ trợ sắp xếp và phát triển DN bị đình trệ.',
        preventiveMitigation: 'Lựa chọn thời điểm chào bán cổ phần nhà nước phù hợp với chu kỳ phục hồi của thị trường chứng khoán.'
      }
    ];

    return {
      originSector: 'stocks',
      originSectorNameVi: 'Chứng khoán (UBCK)',
      rootIssue: `Biến động rủi ro thị trường chứng khoán và niềm tin nhà đầu tư: "${title}"`,
      transmissionPathSummary: 'Chứng khoán ➔ Dòng vốn Ngoại (FDI/FII) ➔ Kênh huy động Trái phiếu ➔ Thoái vốn DNNN (SCIC)',
      spilloverRiskLevel: 'ELEVATED',
      chainNodes: nodes,
      containmentRecommendation: 'UBCKNN chủ động đưa ra thông điệp trấn an thị trường; kiểm soát chặt hoạt động margin của các CTCK và đẩy nhanh việc hoàn thiện các tiêu chí nâng hạng thị trường vốn.'
    };
  }

  // 5. Nhóm Quản lý Giá & Bình ổn (price_management)
  if (originSector === 'price_management' || text.includes('giá cả') || text.includes('lạm phát') || text.includes('giá xăng dầu') || text.includes('giá điện') || text.includes('tăng giá')) {
    const nodes: ImpactChainNode[] = [
      {
        sector: 'price_management',
        sectorNameVi: 'Quản lý Giá & Bình ổn',
        order: 1,
        level: 'DIRECT',
        severity: 'HIGH',
        mechanism: 'Giá các mặt hàng đầu vào chiến lược (xăng dầu, điện, vật liệu) biến động tăng mạnh do thị trường quốc tế.',
        consequence: 'Gia tăng chi phí sản xuất kinh doanh, áp lực tăng chỉ số giá tiêu dùng (CPI) trong ngắn hạn.',
        preventiveMitigation: 'Sử dụng linh hoạt Quỹ bình ổn giá, theo dõi sát diễn biến thị trường và kiểm soát chặt việc kê khai giá.'
      },
      {
        sector: 'banking_credit',
        sectorNameVi: 'Ngân hàng & Tín dụng',
        order: 2,
        level: 'SECONDARY',
        severity: 'HIGH',
        mechanism: 'Áp lực lạm phát kỳ vọng buộc cơ quan quản lý tiền tệ phải thận trọng với chính sách nới lỏng lãi suất.',
        consequence: 'Mặt bằng lãi suất cho vay khó giảm sâu, làm tăng chi phí vốn của toàn bộ nền kinh tế.',
        preventiveMitigation: 'Phối hợp nhịp nhàng giữa chính sách tài khóa mở rộng có trọng tâm và chính sách tiền tệ chủ động, linh hoạt.'
      },
      {
        sector: 'treasury_budget',
        sectorNameVi: 'Kho bạc & Ngân sách',
        order: 2,
        level: 'SECONDARY',
        severity: 'MEDIUM',
        mechanism: 'Giá hàng hóa tăng làm tăng chi phí đầu vào của các gói thầu mua sắm công và an sinh xã hội.',
        consequence: 'Ngân sách phải bố trí thêm nguồn lực trợ giá, hỗ trợ đối tượng yếu thế và bù chênh lệch chi phí đầu tư.',
        preventiveMitigation: 'Rà soát cắt giảm các khoản chi thường xuyên chưa cấp bách để dành nguồn lực bình ổn giá các mặt hàng thiết yếu.'
      },
      {
        sector: 'macro',
        sectorNameVi: 'Tăng trưởng GDP & Vĩ mô',
        order: 3,
        level: 'SYSTEMIC',
        severity: 'HIGH',
        mechanism: 'Sức mua tiêu dùng nội địa giảm sút do giá cả leo thang, ảnh hưởng đến tổng cầu của nền kinh tế.',
        consequence: 'Rủi ro lạm phát vượt ngưỡng mục tiêu 4.0% - 4.5% Quốc hội giao, cản trở đà phục hồi kinh tế.',
        preventiveMitigation: 'Ban hành kịp thời các gói giảm thuế GTGT 2% và giảm phí, lệ phí để kích cầu tiêu dùng nội địa.'
      }
    ];

    return {
      originSector: 'price_management',
      originSectorNameVi: 'Quản lý Giá & Bình ổn',
      rootIssue: `Biến động giá cả hàng hóa thiết yếu và áp lực lạm phát: "${title}"`,
      transmissionPathSummary: 'Quản lý Giá ➔ Lãi suất & Tín dụng Ngân hàng ➔ Chi tiêu Ngân sách ➔ Tăng trưởng GDP & Vĩ mô',
      spilloverRiskLevel: 'ELEVATED',
      chainNodes: nodes,
      containmentRecommendation: 'Ban Chỉ đạo Điều hành Giá chủ động tính toán kịch bản điều chỉnh giá các mặt hàng nhà nước quản lý theo lộ trình giãn cách; đồng thời phối hợp NHNN giữ vững ổn định kinh tế vĩ mô.'
    };
  }

  // 6. Nhóm Vàng & Tỷ giá Ngoại tệ (gold / forex)
  if (originSector === 'gold' || originSector === 'forex' || text.includes('giá vàng') || text.includes('sjc') || text.includes('tỷ giá') || text.includes('usd/vnd')) {
    const nodes: ImpactChainNode[] = [
      {
        sector: 'gold',
        sectorNameVi: 'Vàng & Kim loại quý',
        order: 1,
        level: 'DIRECT',
        severity: 'HIGH',
        mechanism: 'Chênh lệch giá vàng miếng SJC trong nước và thế giới nới rộng, kích hoạt đầu cơ găm giữ.',
        consequence: 'Dư luận lo ngại về tính minh bạch của thị trường vàng, phát sinh nguy cơ buôn lậu vàng qua biên giới.',
        preventiveMitigation: 'Bắt buộc áp dụng 100% hóa đơn điện tử từng lần mua bán vàng kết nối cơ quan thuế và thanh tra liên ngành.'
      },
      {
        sector: 'customs',
        sectorNameVi: 'Hải quan & XNK',
        order: 2,
        level: 'SECONDARY',
        severity: 'HIGH',
        mechanism: 'Chênh lệch giá vàng và tỷ giá chợ đen gia tăng thúc đẩy hoạt động buôn lậu ngoại tệ, vàng qua đường biên.',
        consequence: 'Tăng áp lực kiểm soát tại các cửa khẩu quốc tế và các tuyến biên giới trọng điểm.',
        preventiveMitigation: 'Tổng cục Hải quan chỉ đạo Đội Kiểm soát chống buôn lậu tăng cường soi chiếu và tuần tra biên giới.'
      },
      {
        sector: 'public_debt',
        sectorNameVi: 'Nợ công & TC Đối ngoại',
        order: 2,
        level: 'SECONDARY',
        severity: 'MEDIUM',
        mechanism: 'Biến động tỷ giá USD/VND tăng cao làm gia tăng quy mô nghĩa vụ trả nợ gốc và lãi nước ngoài của Chính phủ.',
        consequence: 'Gia tăng chi phí trả nợ ngoại tệ trong cân đối ngân sách nhà nước năm tài chính.',
        preventiveMitigation: 'Chủ động cơ cấu lại danh mục nợ công theo hướng tăng tỷ trọng vay nợ nội tệ và phòng ngừa rủi ro tỷ giá.'
      },
      {
        sector: 'banking_credit',
        sectorNameVi: 'Ngân hàng & Tín dụng',
        order: 3,
        level: 'SYSTEMIC',
        severity: 'HIGH',
        mechanism: 'Dòng tiền trong nền kinh tế bị hút vào vàng và ngoại tệ thay vì chảy vào sản xuất kinh doanh.',
        consequence: 'Gây sức ép lên thanh khoản tiền đồng tại hệ thống NHTM và làm suy yếu vị thế đồng nội tệ.',
        preventiveMitigation: 'Thực hiện đồng bộ các giải pháp chống "vàng hóa", "đô la hóa" nền kinh tế theo chỉ đạo của Thủ tướng Chính phủ.'
      }
    ];

    return {
      originSector: (originSector === 'forex' ? 'forex' : 'gold') as SectorType,
      originSectorNameVi: originSector === 'forex' ? 'Tỷ giá & Ngoại tệ' : 'Vàng & Kim loại quý',
      rootIssue: `Biến động chênh lệch giá vàng và áp lực tỷ giá ngoại tệ: "${title}"`,
      transmissionPathSummary: 'Vàng & Ngoại tệ ➔ Hải quan & Chống buôn lậu ➔ Nợ công Quốc gia ➔ Thanh khoản Ngân hàng',
      spilloverRiskLevel: 'ELEVATED',
      chainNodes: nodes,
      containmentRecommendation: 'Chỉ đạo Cục Thuế và Tổng cục Hải quan phối hợp NHNN tổng kiểm tra việc chấp hành pháp luật kinh doanh vàng; siết chặt hóa đơn điện tử và kiểm soát chặt dòng ngoại tệ qua biên giới.'
    };
  }

  // 7. Nhóm Hải quan & Xuất nhập khẩu (customs)
  if (originSector === 'customs' || text.includes('hải quan') || text.includes('buôn lậu') || text.includes('ách tắc cửa khẩu') || text.includes('gian lận xuất xứ')) {
    const nodes: ImpactChainNode[] = [
      {
        sector: 'customs',
        sectorNameVi: 'Hải quan & XNK',
        order: 1,
        level: 'DIRECT',
        severity: 'HIGH',
        mechanism: 'Ách tắc thông quan tại các cửa khẩu hoặc phát hiện các vụ việc buôn lậu, gian lận xuất xứ hàng hóa quy mô lớn.',
        consequence: 'Thời gian thông quan bị kéo dài, phát sinh chi phí lưu kho bãi cho doanh nghiệp XNK.',
        preventiveMitigation: 'Mở rộng cơ chế thông quan tự động 24/7 và áp dụng chuyển đổi số hải quan thông minh.'
      },
      {
        sector: 'tax',
        sectorNameVi: 'Thuế & Thu NSNN',
        order: 2,
        level: 'SECONDARY',
        severity: 'HIGH',
        mechanism: 'Hành vi khai sai mã HS, gian lận trị giá hải quan nhằm trốn thuế xuất nhập khẩu và thuế tiêu thụ đặc biệt.',
        consequence: 'Nguy cơ thất thu ngân sách tại khâu xuất nhập khẩu và thất thoát thuế nội địa sau thông quan.',
        preventiveMitigation: 'Tăng cường kiểm tra sau thông quan và đối soát chéo dữ liệu thuế nội địa - hải quan.'
      },
      {
        sector: 'enterprise',
        sectorNameVi: 'Doanh nghiệp & M&A',
        order: 2,
        level: 'SECONDARY',
        severity: 'MEDIUM',
        mechanism: 'Doanh nghiệp sản xuất trong nước chịu cạnh tranh không lành mạnh từ hàng nhập lậu giá rẻ.',
        consequence: 'Thu hẹp thị phần doanh nghiệp chân chính, nguy cơ bị nước ngoài áp thuế phòng vệ thương mại do gian lận C/O.',
        preventiveMitigation: 'Bảo vệ quyền lợi doanh nghiệp tuân thủ tốt qua chương trình Doanh nghiệp ưu tiên (AEO).'
      },
      {
        sector: 'macro',
        sectorNameVi: 'Tăng trưởng GDP & Vĩ mô',
        order: 3,
        level: 'SYSTEMIC',
        severity: 'MEDIUM',
        mechanism: 'Ảnh hưởng đến tốc độ lu chuyển hàng hóa và thặng dư cán cân thương mại quốc tế.',
        consequence: 'Tác động đến uy tín chuỗi cung ứng logistics quốc tế đi qua các cảng biển và cửa khẩu Việt Nam.',
        preventiveMitigation: 'Tháo gỡ ngay các rào cản kiểm tra chuyên ngành liên bộ tại các cửa khẩu trọng điểm.'
      }
    ];

    return {
      originSector: 'customs',
      originSectorNameVi: 'Hải quan & XNK',
      rootIssue: `Vấn đề phát sinh trong quản lý hải quan và chống buôn lậu: "${title}"`,
      transmissionPathSummary: 'Hải quan ➔ Thất thu Thuế XNK ➔ Doanh nghiệp Sản xuất ➔ Cán cân Thương mại Vĩ mô',
      spilloverRiskLevel: 'MODERATE',
      chainNodes: nodes,
      containmentRecommendation: 'Chỉ đạo Tổng cục Hải quan khẩn trương thông quan nhanh hàng hóa ùn ứ; đồng thời mở cao điểm chống buôn lậu, gian lận thương mại và giả mạo xuất xứ hàng hóa Việt Nam.'
    };
  }

  // 8. Nhóm Bảo hiểm (insurance)
  if (originSector === 'insurance' || text.includes('bảo hiểm') || text.includes('bancassurance') || text.includes('tranh chấp bảo hiểm')) {
    const nodes: ImpactChainNode[] = [
      {
        sector: 'insurance',
        sectorNameVi: 'Bảo hiểm & Giám sát BH',
        order: 1,
        level: 'DIRECT',
        severity: 'HIGH',
        mechanism: 'Khách hàng phản ánh bị ép mua bảo hiểm khi vay vốn hoặc thông tin tư vấn bảo hiểm nhân thọ mập mờ.',
        consequence: 'Khủng hoảng niềm tin trên thị trường bảo hiểm, gia tăng đơn thư khiếu nại của người dân.',
        preventiveMitigation: 'Thanh tra toàn diện quy trình bán bảo hiểm qua ngân hàng (Bancassurance) và xử phạt nghiêm đại lý sai phạm.'
      },
      {
        sector: 'banking_credit',
        sectorNameVi: 'Ngân hàng & Tín dụng',
        order: 2,
        level: 'SECONDARY',
        severity: 'HIGH',
        mechanism: 'Hoạt động phân phối chéo bảo hiểm tại các NHTM bị siết chặt, ảnh hưởng nguồn thu dịch vụ phi tín dụng.',
        consequence: 'Tổn hại uy tín thương hiệu của các ngân hàng liên quan và sụt giảm doanh thu phí bảo hiểm mới.',
        preventiveMitigation: 'Cơ quan QLBH phối hợp Cơ quan Thanh tra Giám sát Ngân hàng chuẩn hóa quy tắc ứng xử đại lý.'
      },
      {
        sector: 'inspection_audit',
        sectorNameVi: 'Thanh tra & Giám sát',
        order: 2,
        level: 'SECONDARY',
        severity: 'MEDIUM',
        mechanism: 'Phát sinh yêu cầu thanh tra chuyên đề việc trích lập dự phòng nghiệp vụ và an toàn tài chính tại các DNBH.',
        consequence: 'Phát hiện các sai sót trong quản trị tài chính, hoa hồng đại lý và hợp đồng đại lý bảo hiểm.',
        preventiveMitigation: 'Công khai kết luận thanh tra để làm trong sạch thị trường và bảo vệ quyền lợi người tham gia bảo hiểm.'
      },
      {
        sector: 'stocks',
        sectorNameVi: 'Chứng khoán (UBCK)',
        order: 3,
        level: 'SYSTEMIC',
        severity: 'LOW',
        mechanism: 'Các doanh nghiệp bảo hiểm là nhà đầu tư tổ chức lớn giảm quy mô giải ngân vào thị trường cổ phiếu/trái phiếu.',
        consequence: 'Hạn chế dòng vốn đầu tư dài hạn từ các quỹ bảo hiểm vào thị trường chứng khoán.',
        preventiveMitigation: 'Hoàn thiện khung pháp lý theo Luật Kinh doanh bảo hiểm 2022 để mở rộng danh mục đầu tư an toàn.'
      }
    ];

    return {
      originSector: 'insurance',
      originSectorNameVi: 'Bảo hiểm & Giám sát BH',
      rootIssue: `Rủi ro tranh chấp và khủng hoảng niềm tin thị trường bảo hiểm: "${title}"`,
      transmissionPathSummary: 'Bảo hiểm ➔ Kênh Ngân hàng (Bancassurance) ➔ Thanh tra Tài chính ➔ Dòng vốn Đầu tư Dài hạn',
      spilloverRiskLevel: 'MODERATE',
      chainNodes: nodes,
      containmentRecommendation: 'Cục Quản lý Giám sát Bảo hiểm ban hành ngay văn bản chấn chỉnh hoạt động đại lý bảo hiểm; thiết lập đường dây nóng tiếp nhận và xử lý dứt điểm khiếu nại của người dân.'
    };
  }

  // 9. Generic Multi-Sector Fallback Rule for all other sectors
  const genericNodes: ImpactChainNode[] = [
    {
      sector: originSector,
      sectorNameVi: originSectorNameVi,
      order: 1,
      level: 'DIRECT',
      severity: 'HIGH',
      mechanism: `Phát sinh rủi ro trực tiếp trong phạm vi quản lý của lĩnh vực ${originSectorNameVi}.`,
      consequence: 'Gây dư luận lo ngại, ảnh hưởng hiệu quả quản lý nhà nước và phát sinh áp lực xử lý của cơ quan chuyên môn.',
      preventiveMitigation: 'Nhanh chóng thành lập tổ phản ứng nhanh để xác minh và ban hành chỉ đạo chấn chỉnh kịp thời.'
    },
    {
      sector: 'treasury_budget',
      sectorNameVi: 'Kho bạc & Ngân sách',
      order: 2,
      level: 'SECONDARY',
      severity: 'MEDIUM',
      mechanism: 'Rủi ro lan tỏa ảnh hưởng đến tiến độ thu nộp hoặc hiệu quả chi trả của ngân sách nhà nước.',
      consequence: 'Tạo áp lực lên kế hoạch cân đối tài khóa và điều hành dòng tiền ngân sách trung ương/địa phương.',
      preventiveMitigation: 'Rà soát các kịch bản dự phòng ngân sách và đảm bảo an toàn cân đối tài chính quốc gia.'
    },
    {
      sector: 'inspection_audit',
      sectorNameVi: 'Thanh tra & Giám sát',
      order: 2,
      level: 'SECONDARY',
      severity: 'MEDIUM',
      mechanism: 'Yêu cầu kích hoạt cơ chế giám sát tuân thủ, phòng ngừa vi phạm kỷ luật tài chính và quy định pháp luật.',
      consequence: 'Tăng cường thanh tra đột xuất để khoanh vùng sai phạm, tránh tạo tiền lệ xấu.',
      preventiveMitigation: 'Tăng cường công tác tự kiểm tra nội bộ và siết chặt kỷ luật, kỷ cương tài chính công.'
    },
    {
      sector: 'macro',
      sectorNameVi: 'Tăng trưởng GDP & Vĩ mô',
      order: 3,
      level: 'SYSTEMIC',
      severity: 'LOW',
      mechanism: 'Tác động tâm lý liên ngành có thể làm giảm niềm tin của thị trường và môi trường kinh doanh.',
      consequence: 'Ảnh hưởng đến sự ổn định và tính đồng bộ của hệ sinh thái tài chính quốc gia.',
      preventiveMitigation: 'Chủ động truyền thông định hướng dư luận và ban hành giải pháp tháo gỡ khó khăn thực chất.'
    }
  ];

  return {
    originSector,
    originSectorNameVi,
    rootIssue: `Vấn đề rủi ro phát sinh tại ${originSectorNameVi}: "${title}"`,
    transmissionPathSummary: `${originSectorNameVi} ➔ Kho bạc & Ngân sách ➔ Thanh tra Tài chính ➔ Ổn định Kinh tế Vĩ mô`,
    spilloverRiskLevel: 'MODERATE',
    chainNodes: genericNodes,
    containmentRecommendation: 'Chỉ đạo đơn vị chuyên trách chủ trì phối hợp với các Cục, Vụ liên quan của Bộ Tài chính theo dõi sát diễn biến; chủ động báo cáo Lãnh đạo phương án kiểm soát rủi ro liên ngành.'
  };
}

export function detectMediaGap(item: ScrapedNewsItem): MediaGapAnalysis {
  const text = `${item.title || ''} ${item.summary || ''} ${item.snippet || ''} ${item.sentimentReason || ''}`.toLowerCase();

  // Check matching rules
  let matchedRule: GapRule | null = null;
  let maxMatchedKeywords = 0;

  for (const rule of MEDIA_GAP_RULES) {
    const matchCount = rule.keywords.filter(kw => text.includes(kw)).length;
    if (matchCount > 0 && matchCount > maxMatchedKeywords) {
      maxMatchedKeywords = matchCount;
      matchedRule = rule;
    }
  }

  if (matchedRule && maxMatchedKeywords >= 1) {
    return {
      hasGap: true,
      gapSeverity: matchedRule.severity,
      topicConcern: matchedRule.topicConcern,
      informationDeficit: matchedRule.informationDeficit,
      citizenBizGuidance: matchedRule.citizenBizGuidance,
      proactiveGovAction: {
        leadAgency: matchedRule.leadAgency,
        campaignTitle: matchedRule.campaignTitle,
        communicationSteps: matchedRule.communicationSteps
      }
    };
  }

  // Fallback / Generic gap detection for high negative articles with missing guidance
  if (item.sentiment === 'bearish' || (item.sentimentScore && item.sentimentScore <= -30)) {
    return {
      hasGap: true,
      gapSeverity: 'MEDIUM',
      topicConcern: `Dư luận và doanh nghiệp đang có tâm lý e ngại, băn khoăn trước thông tin: "${item.title}".`,
      informationDeficit: 'Chưa có thông điệp chính thống giải thích cặn kẽ về lộ trình, phạm vi tác động và hướng dẫn thực thi cụ thể từ cơ quan quản lý.',
      citizenBizGuidance: [
        '1. Bình tĩnh theo dõi các thông cáo chính thức từ Cổng Thông tin điện tử Bộ Tài chính (mof.gov.vn).',
        '2. Không vội vàng đưa ra quyết định kinh doanh dựa trên tin đồn hoặc diễn đàn mạng xã hội chưa kiểm chứng.',
        '3. Gửi văn bản kiến nghị trực tiếp đến cơ quan có thẩm quyền nếu phát sinh vướng mắc thực tế.'
      ],
      proactiveGovAction: {
        leadAgency: (item.agencies && item.agencies[0]) || 'Văn phòng Bộ Tài chính',
        campaignTitle: `Chiến dịch cung cấp thông tin chính thống về "${item.sectorNameVi || 'Lĩnh vực quản lý'}"`,
        communicationSteps: [
          '1. Ban hành Thông cáo Báo chí đính chính và làm rõ quan điểm nhất quán của Bộ trong 12 giờ.',
          '2. Trả lời phỏng vấn trên các cơ quan báo chí ngành Tài chính để giải tỏa bức xúc của dư luận.',
          '3. Mở chuyên mục "Hỏi - Đáp Chính sách" trực tuyến để lắng nghe và tháo gỡ vướng mắc cho doanh nghiệp.'
        ]
      }
    };
  }

  return {
    hasGap: false,
    gapSeverity: 'LOW',
    topicConcern: '',
    informationDeficit: '',
    citizenBizGuidance: [],
    proactiveGovAction: {
      leadAgency: '',
      campaignTitle: '',
      communicationSteps: []
    }
  };
}

export function enrichArticleWithDiagnosticAndGap(item: ScrapedNewsItem): ScrapedNewsItem {
  const sentimentDiagnostic = generateSentimentDiagnostic(item);
  const mediaGap = detectMediaGap(item);

  return {
    ...item,
    sentimentDiagnostic,
    mediaGap
  };
}

export interface MediaGapSummaryGroup {
  ruleId: string;
  topicConcern: string;
  leadAgency: string;
  campaignTitle: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  articles: ScrapedNewsItem[];
  articleCount: number;
  informationDeficit: string;
  citizenBizGuidance: string[];
  communicationSteps: string[];
}

export function aggregateMediaGaps(items: ScrapedNewsItem[]): MediaGapSummaryGroup[] {
  const map = new Map<string, MediaGapSummaryGroup>();

  for (const item of items) {
    const enriched = item.mediaGap ? item : enrichArticleWithDiagnosticAndGap(item);
    const gap = enriched.mediaGap;

    if (gap && gap.hasGap) {
      const key = gap.proactiveGovAction.campaignTitle || gap.topicConcern || 'Vấn đề phát sinh khác';
      if (!map.has(key)) {
        map.set(key, {
          ruleId: key,
          topicConcern: gap.topicConcern,
          leadAgency: gap.proactiveGovAction.leadAgency,
          campaignTitle: gap.proactiveGovAction.campaignTitle,
          severity: gap.gapSeverity,
          articles: [item],
          articleCount: 1,
          informationDeficit: gap.informationDeficit,
          citizenBizGuidance: gap.citizenBizGuidance,
          communicationSteps: gap.proactiveGovAction.communicationSteps
        });
      } else {
        const group = map.get(key)!;
        group.articles.push(item);
        group.articleCount += 1;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const scoreMap = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return scoreMap[b.severity] * 10 + b.articleCount - (scoreMap[a.severity] * 10 + a.articleCount);
  });
}
