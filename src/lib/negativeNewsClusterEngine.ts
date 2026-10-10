import { ScrapedNewsItem, NegativeNewsCluster, SentimentDeepReasoning, SectorType, SECTOR_NAMES } from '../types';

/**
 * Phân cụm tin tức tiêu cực và cảnh báo rủi ro thành các nhóm nội dung cụ thể
 * Kèm theo đề xuất phương án xử lý truyền thông tác chiến bám sát từng cụm vấn đề
 */
export function clusterNegativeAndAtRiskNews(articles: ScrapedNewsItem[]): NegativeNewsCluster[] {
  if (!articles || articles.length === 0) return [];

  // Lọc các bài viết thực sự tiêu cực, căng thẳng hoặc khẩn cấp (loại bỏ hoàn toàn tin tức trung tính/tích cực)
  const negativeArticles = articles.filter(
    (a) => (a.sentiment === 'bearish' && (a.sentimentScore <= -10 || a.impactLevel !== 'low')) || a.isEmergency
  );

  if (negativeArticles.length === 0) return [];

  // Định nghĩa các nhóm chủ đề tiêu cực trọng tâm của ngành Tài chính
  const TOPIC_PATTERNS = [
    {
      id: 'cluster_bonds_maturity',
      title: 'Áp lực Đáo hạn Trái phiếu Doanh nghiệp & Rủi ro Dòng tiền Chậm trả',
      sector: 'bonds' as SectorType,
      keywords: ['trái phiếu', 'tpdn', 'đáo hạn', 'chậm trả', 'khất nợ', 'vỡ nợ', 'nghị định 08', 'trái chủ', 'hoán đổi nợ'],
      summary: 'Dư luận và nhà đầu tư lo ngại về khả năng thanh toán gốc lãi các lô trái phiếu đến hạn trong quý, nguy cơ nợ xấu và tranh chấp với trái chủ.',
      rootCauses: [
        'Dòng tiền kinh doanh của nhóm BĐS hồi phục chậm, thanh khoản tín dụng còn thận trọng.',
        'Thời gian gia hạn 2 năm theo Nghị định 08 bắt đầu chạm mốc đáo hạn dồn dập.',
        'Tâm lý thị trường thứ cấp nhạy cảm với các thông tin chậm công bố báo cáo tài chính kiểm toán.',
      ],
      riskPoints: [
        'Hiệu ứng domino lan truyền sang nhóm nhà đầu tư cá nhân và các tổ chức phát hành khác.',
        'Nguy cơ khiếu kiện đông người và tin đồn thất thiệt trên mạng xã hội gây nhiễu loạn thị trường.',
      ],
      leadAgency: 'Cục Quản lý Nợ & Tài chính Đối ngoại / Vụ Tài chính Ngân hàng & TCTD / UBCKNN',
      targetStrategy: 'Minh bạch hóa lộ trình trả nợ & Khẳng định kỷ cương thị trường TPDN',
      spokespersonAction: 'Lãnh đạo Cục/Vụ phát ngôn chính thức trên Thời báo Tài chính Việt Nam & Cổng TTĐT Bộ Tài chính',
      keyTalkingPoints: [
        'Bộ Tài chính tiếp tục chỉ đạo giám sát chặt chẽ nghĩa vụ thanh toán của các tổ chức phát hành, yêu cầu đàm phán minh bạch với trái chủ.',
        'Khung pháp lý Nghị định 65 và Nghị định 08 đã phân định rõ trách nhiệm dân sự của doanh nghiệp phát hành; bảo vệ quyền lợi hợp pháp của nhà đầu tư.',
        'Hệ thống giao dịch TPDN riêng lẻ tập trung vận hành ổn định, tăng cường tính thanh khoản và chuẩn hóa thông tin giao dịch.',
      ],
      actionableSteps: [
        'Yêu cầu các tổ chức phát hành có lô trái phiếu đến hạn công khai phương án tái cấu trúc hoặc đàm phán hoán đổi tài sản.',
        'Phát hành Thông cáo báo chí định hướng dư luận, công bố bức tranh tổng thể thanh khoản và tỷ lệ trái phiếu đã thanh toán đúng hạn.',
        'Phối hợp cơ quan quản lý liên ngành xử lý nghiêm các trường hợp cố tình gian lận hoặc tung tin đồn thất thiệt.',
      ],
    },
    {
      id: 'cluster_tax_fraud_refund',
      title: 'Gian lận Hóa đơn Điện tử & Chậm trễ Hoàn thuế Giá trị Gia tăng (VAT)',
      sector: 'tax' as SectorType,
      keywords: ['hoàn thuế', 'thuế vat', 'gian lận hóa đơn', 'hóa đơn khống', 'nợ thuế', 'truy thu', 'chậm hoàn thuế', 'thanh tra thuế'],
      summary: 'Phản ánh vướng mắc của cộng đồng doanh nghiệp về thời gian thẩm định hoàn thuế VAT kéo dài, đồng thời nổi lên các vụ việc mua bán hóa đơn điện tử trái phép.',
      rootCauses: [
        'Cơ quan thuế siết chặt quy trình phân loại rủi ro nhằm ngăn chặn hành vi xuất khống hóa đơn giá trị gia tăng.',
        'Hệ thống đối soát chéo chuỗi cung ứng gặp điểm nghẽn tại các hóa đơn F1, F2 từ doanh nghiệp bỏ trốn.',
      ],
      riskPoints: [
        'Doanh nghiệp làm ăn chân chính bị đọng vốn lưu động, ảnh hưởng đến chu kỳ sản xuất kinh doanh.',
        'Báo chí phản ánh đơn thư kiến nghị, tạo áp lực giải trình đối với ngành Thuế.',
      ],
      leadAgency: 'Cục Thuế / Cục Công nghệ Thông tin (Cục Thuế)',
      targetStrategy: 'Công khai quy trình phân luồng rủi ro & Ứng dụng AI đẩy nhanh hoàn thuế hợp pháp',
      spokespersonAction: 'Họp báo chuyên đề hoặc trả lời phỏng vấn của Lãnh đạo Cục Thuế',
      keyTalkingPoints: [
        'Cục Thuế quyết liệt bảo vệ doanh nghiệp tuân thủ tốt, cam kết giải quyết hồ sơ hoàn thuế thuộc diện "Hoàn trước kiểm sau" đúng hạn luật định.',
        'Việc kiểm soát chặt là nhằm triệt phá các đường dây mua bán hóa đơn giả, tạo môi trường kinh doanh bình đẳng và chống thất thu NSNN.',
        'Triển khai hệ thống phân tích dữ liệu lớn (Big Data & AI) để tự động hóa đối soát hóa đơn, giảm thiểu tối đa thời gian chờ đợi của người nộp thuế.',
      ],
      actionableSteps: [
        'Ban hành Công điện đôn đốc Cục Thuế các tỉnh, thành phố giải quyết dứt điểm các hồ sơ hoàn thuế đủ điều kiện.',
        'Xuất bản bài viết phân tích chuyên sâu giải thích rõ tiêu chí "Rủi ro cao" và hướng dẫn doanh nghiệp chuẩn hóa hồ sơ.',
        'Thiết lập đường dây nóng và tổ công tác tiếp nhận phản ánh trực tiếp từ hiệp hội doanh nghiệp.',
      ],
    },
    {
      id: 'cluster_stock_market_volatility',
      title: 'Biến động Tâm lý Bán tháo trên TTCK & Áp lực Bán ròng Khối ngoại',
      sector: 'stocks' as SectorType,
      keywords: ['bán tháo', 'giảm điểm', 'khối ngoại bán ròng', 'margin call', 'nghẽn lệnh', 'thao túng', 'ubcknn', 'thị trường chứng khoán'],
      summary: 'Thị trường chứng khoán ghi nhận áp lực điều chỉnh mạnh, đà bán ròng của dòng vốn ngoại và tâm lý hoang mang về hiện tượng bán giải chấp (force sell).',
      rootCauses: [
        'Chênh lệch lãi suất và biến động tỷ giá DXY kích hoạt hoạt động cơ cấu danh mục của các quỹ ETF ngoại.',
        'Tin đồn lan truyền chưa được kiểm chứng trên các diễn đàn đầu tư và hội nhóm mạng xã hội.',
      ],
      riskPoints: [
        'Tác động tiêu cực đến tiến trình nâng hạng TTCK và tâm lý dòng tiền nội.',
        'Gia tăng rủi ro thanh khoản hệ thống khi áp lực giải chấp chéo lan rộng.',
      ],
      leadAgency: 'Ủy ban Chứng khoán Nhà nước (UBCKNN) / Sở Giao dịch Chứng khoán VN (VNX)',
      targetStrategy: 'Trấn an tâm lý nhà đầu tư & Cập nhật tiến độ hoàn thiện cơ chế Non-prefunding',
      spokespersonAction: 'Chủ tịch/Phó Chủ tịch UBCKNN phát biểu định hướng và cập nhật tình hình thanh khoản',
      keyTalkingPoints: [
        'Nền tảng vĩ mô và sức khỏe tài chính của các doanh nghiệp niêm yết vẫn duy trì tăng trưởng tích cực, P/E thị trường đang ở vùng định giá hấp dẫn.',
        'Cơ quan quản lý theo dõi chặt chẽ mọi giao dịch bất thường, kiên quyết xử lý hành vi thao túng hoặc lan truyền tin đồn thất thiệt.',
        'Tiến trình nâng hạng thị trường theo chuẩn FTSE vẫn đang diễn ra đúng lộ trình với sự phối hợp chặt chẽ của các tổ chức quốc tế.',
      ],
      actionableSteps: [
        'Đưa ra thông cáo trấn an thị trường, nhấn mạnh các yếu tố vĩ mô tích cực và tiến độ thử nghiệm hệ thống giao dịch mới.',
        'Tăng cường giám sát biên độ giá và các tài khoản có dấu hiệu thao túng, giao dịch bất thường trong phiên.',
        'Họp làm việc với các công ty chứng khoán lớn để đảm bảo quản trị rủi ro margin an toàn, minh bạch.',
      ],
    },
    {
      id: 'cluster_customs_smuggling',
      title: 'Gian lận Xuất xứ Hàng hóa, Thất thu Thuế XNK & Buôn lậu Xuyên biên giới',
      sector: 'customs' as SectorType,
      keywords: ['buôn lậu', 'gian lận xuất xứ', 'chuyển giá', 'hải quan', 'tạm nhập tái xuất', 'thất thu thuế', 'xnk'],
      summary: 'Phát hiện các vụ việc mượn danh xuất xứ Việt Nam (Made in Vietnam) để lẩn tránh thuế quan và buôn lậu qua các cửa khẩu.',
      rootCauses: [
        'Lợi dụng chính sách tạo thuận lợi thông quan nhanh (luồng Xanh/luồng Vàng) để khai báo sai mã HS và trị giá tính thuế.',
        'Các rào cản phòng vệ thương mại quốc tế gia tăng khiến hành vi chuyển tải bất hợp pháp trở nên tinh vi.',
      ],
      riskPoints: [
        'Ảnh hưởng đến uy tín hàng hóa xuất khẩu Việt Nam trên thị trường quốc tế (Hoa Kỳ, EU).',
        'Gây thất thu ngân sách và tổn hại ngành sản xuất trong nước.',
      ],
      leadAgency: 'Cục Hải quan / Cục Điều tra Chống buôn lậu',
      targetStrategy: 'Khẳng định quyết tâm làm sạch môi trường XNK & Bảo vệ thương hiệu quốc gia',
      spokespersonAction: 'Đại diện Cục Hải quan cung cấp thông tin kết quả chuyên án lớn',
      keyTalkingPoints: [
        'Ngành Hải quan kiên quyết triệt phá các đường dây buôn lậu, gian lận xuất xứ để bảo vệ quyền lợi doanh nghiệp chân chính.',
        'Ứng dụng quản lý rủi ro hiện đại và hợp tác chặt chẽ với cơ quan hải quan quốc tế để kiểm soát chuỗi cung ứng.',
      ],
      actionableSteps: [
        'Công bố các chuyên án xử lý nghiêm minh các vi phạm để răn đe.',
        'Ban hành văn bản cảnh báo các mặt hàng có nguy cơ cao về chuyển tải bất hợp pháp.',
      ],
    },
    {
      id: 'cluster_public_investment_lag',
      title: 'Chậm Giải ngân Vốn Đầu tư Công & Vướng mắc Thủ tục Giải phóng Mặt bằng',
      sector: 'public_investment' as SectorType,
      keywords: ['chậm giải ngân', 'đầu tư công', 'đọng vốn', 'vướng mặt bằng', 'kho bạc', 'thủ tục thanh toán'],
      summary: 'Tỷ lệ giải ngân một số dự án trọng điểm đạt thấp so với kế hoạch, nguy cơ ảnh hưởng đến mục tiêu tăng trưởng kinh tế.',
      rootCauses: [
        'Vướng mắc trong công tác đền bù giải phóng mặt bằng, nguồn cung vật liệu xây dựng.',
        'Tâm lý sợ sai, đùn đẩy trách nhiệm trong phê duyệt dự toán tại một số địa phương, chủ đầu tư.',
      ],
      riskPoints: [
        'Lãng phí nguồn lực NSNN, kéo dài thời gian thi công, phát sinh chi phí.',
      ],
      leadAgency: 'Vụ Đầu tư (Bộ Tài chính) / Kho bạc Nhà nước',
      targetStrategy: 'Tháo gỡ điểm nghẽn thủ tục thanh toán & Đôn đốc tiến độ giải ngân',
      spokespersonAction: 'Lãnh đạo Bộ Tài chính chỉ đạo trực tiếp và công khai tiến độ các bộ, ngành, địa phương',
      keyTalkingPoints: [
        'Kho bạc Nhà nước cam kết thanh toán vốn trong vòng 1-3 ngày làm việc kể từ khi nhận đủ hồ sơ hợp lệ.',
        'Bộ Tài chính kịp thời báo cáo Thủ tướng Chính phủ điều chuyển vốn từ dự án chậm sang dự án có tiến độ tốt.',
      ],
      actionableSteps: [
        'Công khai danh sách các đơn vị giải ngân chậm trên Cổng TTĐT Bộ Tài chính.',
        'Thành lập các đoàn kiểm tra thực tế tại các dự án trọng điểm có vướng mắc.',
      ],
    },
  ];

  const clusters: NegativeNewsCluster[] = [];
  const assignedArticleIds = new Set<string>();

  // Gom bài viết vào các cluster định sẵn
  TOPIC_PATTERNS.forEach((pattern) => {
    const matchedArticles = negativeArticles.filter((art) => {
      if (assignedArticleIds.has(art.id)) return false;
      const text = `${art.title} ${art.summary} ${(art.keyPoints || []).join(' ')}`.toLowerCase();
      const hasKeyword = pattern.keywords.some((kw) => text.includes(kw.toLowerCase()));
      const isSectorMatch = art.sector === pattern.sector;
      return hasKeyword || isSectorMatch;
    });

    if (matchedArticles.length > 0) {
      matchedArticles.forEach((a) => assignedArticleIds.add(a.id));
      const hasEmergency = matchedArticles.some((a) => a.isEmergency);
      const highImpactCount = matchedArticles.filter((a) => a.impactLevel === 'high').length;

      clusters.push({
        id: pattern.id,
        topicTitle: pattern.title,
        sector: pattern.sector,
        sectorNameVi: SECTOR_NAMES[pattern.sector] || 'Trọng điểm Tài chính',
        articleCount: matchedArticles.length,
        urgencyLevel: hasEmergency || highImpactCount >= 2 ? 'high' : 'medium',
        summary: pattern.summary,
        rootCauses: pattern.rootCauses,
        riskPoints: pattern.riskPoints,
        articles: matchedArticles,
        mediaResponsePlan: {
          targetStrategy: pattern.targetStrategy,
          leadAgency: pattern.leadAgency,
          spokespersonAction: pattern.spokespersonAction,
          keyTalkingPoints: pattern.keyTalkingPoints,
          actionableSteps: pattern.actionableSteps,
        },
      });
    }
  });

  // Gom các bài tiêu cực còn lại (nếu có) vào cụm tổng hợp
  const remainingArticles = negativeArticles.filter((a) => !assignedArticleIds.has(a.id));
  if (remainingArticles.length > 0) {
    clusters.push({
      id: 'cluster_other_concerns',
      topicTitle: 'Các Phản ánh Trái chiều & Cảnh báo Rủi ro Khác trên Thị trường',
      sector: 'macro' as SectorType,
      sectorNameVi: 'Vĩ mô & Thị trường',
      articleCount: remainingArticles.length,
      urgencyLevel: 'medium',
      summary: 'Tập hợp các điểm tin phản ánh khó khăn trong tiếp cận vốn, chi phí đầu vào tăng và các kiến nghị chính sách từ dư luận.',
      rootCauses: [
        'Áp lực lạm phát chi phí đẩy và cạnh tranh thị trường gia tăng.',
        'Người dân và doanh nghiệp cần thêm hướng dẫn cụ thể về các chính sách thuế, phí mới.',
      ],
      riskPoints: [
        'Nếu không giải thích rõ, dễ phát sinh tâm lý hoang mang hoặc phản ứng chính sách tiêu cực.',
      ],
      articles: remainingArticles,
      mediaResponsePlan: {
        targetStrategy: 'Truyền thông chủ động giải thích chính sách & Lắng nghe phản hồi',
        leadAgency: 'Văn phòng Bộ Tài chính / Ban Biên tập Cổng TTĐT',
        spokespersonAction: 'Cung cấp thông tin kịp thời qua các bản tin và bài trả lời phỏng vấn chuyên gia',
        keyTalkingPoints: [
          'Bộ Tài chính luôn lắng nghe và chủ động rà soát cơ chế chính sách để tạo thuận lợi tối đa cho doanh nghiệp và người dân.',
          'Các giải pháp hỗ trợ tài khóa tiếp tục được triển khai đồng bộ nhằm nuôi dưỡng nguồn thu và giữ vững ổn định vĩ mô.',
        ],
        actionableSteps: [
          'Tổng hợp các kiến nghị để chuyển các Vụ, Cục chức năng tham mưu phản hồi bằng văn bản.',
          'Đẩy mạnh truyền thông đa phương tiện (infographic, video ngắn) giải thích chính sách mới.',
        ],
      },
    });
  }

  // Sắp xếp các cụm: Ưu tiên cụm có số lượng bài nhiều hơn và mức độ khẩn cấp cao hơn
  return clusters.sort((a, b) => {
    if (a.urgencyLevel === 'high' && b.urgencyLevel !== 'high') return -1;
    if (b.urgencyLevel === 'high' && a.urgencyLevel !== 'high') return 1;
    return b.articleCount - a.articleCount;
  });
}

/**
 * Phân tích chuyên sâu sắc thái tin tức cho từng bài viết cụ thể (Tiêu cực / Tích cực / Trung lập)
 */
export function getSentimentDeepReasoning(article: ScrapedNewsItem): SentimentDeepReasoning {
  const sentiment = article.sentiment;
  const score = article.sentimentScore ?? (sentiment === 'bullish' ? 75 : sentiment === 'bearish' ? -65 : 10);
  const text = `${article.title} ${article.summary} ${(article.keyPoints || []).join(' ')}`.toLowerCase();

  if (sentiment === 'bearish') {
    // Trích xuất các từ khóa rủi ro
    const RISK_DICTIONARY = [
      'nợ xấu', 'chậm trả', 'vỡ nợ', 'gian lận', 'thao túng', 'bán tháo', 'áp lực',
      'phong tỏa', 'khất nợ', 'thất thu', 'truy thu', 'vi phạm', 'khủng hoảng',
      'đọng vốn', 'vướng mắc', 'buôn lậu', 'xử phạt', 'rủi ro', 'giảm sút'
    ];
    const detectedRiskKeywords = RISK_DICTIONARY.filter((kw) => text.includes(kw));
    const riskKeywords = detectedRiskKeywords.length > 0
      ? detectedRiskKeywords.map((k) => k.toUpperCase())
      : ['ÁP LỰC ĐIỀU CHỈNH', 'RỦI RO THỊ TRƯỜNG'];

    return {
      sentiment: 'bearish',
      score,
      whyNegative: {
        rootCause: article.sentimentReason || article.executiveDirective?.rootCause ||
          'Bài viết phản ánh vướng mắc thực tiễn, áp lực thanh khoản hoặc các lo ngại liên quan đến rủi ro tài chính của doanh nghiệp.',
        riskKeywords,
        adversePublicPerception:
          'Dư luận và nhà đầu tư có xu hướng phản ứng tiêu cực khi tiếp nhận thông tin về chậm trễ thanh toán, thanh tra sai phạm hoặc áp lực dòng tiền.',
        systemicImplication:
          'Nếu không có thông tin định hướng và giải thích kịp thời, nguy cơ lan truyền tâm lý bán tháo hoặc gây tranh cãi về năng lực giám sát của cơ quan quản lý.',
        mitigationRecommendation:
          article.executiveDirective?.mediaStrategy?.tacticalRecommendation ||
          'Chủ động phát ngôn chính thức, làm rõ bản chất vụ việc, công khai số liệu thực tế để dập tắt tin đồn thất thiệt.',
      },
    };
  }

  if (sentiment === 'bullish') {
    return {
      sentiment: 'bullish',
      score,
      positiveAnalysis: {
        strengthsIdentified: [
          'Thể hiện nỗ lực cải cách hành chính quyết liệt và tinh thần đồng hành cùng người nộp thuế, doanh nghiệp.',
          'Tạo lập môi trường đầu tư minh bạch, củng cố niềm tin của dòng vốn trong nước và quốc tế.',
          'Hỗ trợ kích cầu tiêu dùng nội địa, thúc đẩy tăng trưởng GDP và duy trì bền vững nguồn thu NSNN.',
        ],
        coreDrivers:
          article.sentimentReason ||
          'Tín hiệu chỉ đạo điều hành quyết liệt, chính sách miễn giảm thuế phí kịp thời và tiến độ nâng hạng TTCK đạt kết quả tích cực.',
        marketConfidenceBoost:
          'Thúc đẩy tâm lý lạc quan của cộng đồng doanh nghiệp và nhà đầu tư, gia tăng dòng tiền giao dịch tích cực.',
        amplificationPlan: [
          'Chủ động cung cấp tài liệu cho các cơ quan báo chí chủ lực (VTV1, Thời báo Tài chính, VietnamPlus) để lan tỏa rộng rãi.',
          'Xây dựng các sản phẩm truyền thông trực quan (Infographic, video tóm tắt 60 giây) đăng tải trên Cổng TTĐT Bộ và mạng xã hội.',
          'Lồng ghép vào báo cáo điều hành của Chính phủ như một minh chứng cho hiệu quả chính sách tài khóa linh hoạt.',
        ],
      },
    };
  }

  // Trung lập
  return {
    sentiment: 'neutral',
    score,
    neutralAnalysis: {
      balancedViewpoints: [
        'Bài viết đưa tin khách quan về diễn biến cung - cầu thị trường và các số liệu thống kê định kỳ.',
        'Phản ánh đa chiều ý kiến của các chuyên gia kinh tế, chỉ ra cả cơ hội và thách thức cần lưu tâm.',
      ],
      watchPoints: [
        'Tiếp tục theo dõi phản ứng của thị trường trong 24 giờ tới để kịp thời phát hiện xu hướng phân hóa.',
        'Chuẩn bị sẵn thông tin giải đáp nếu các hiệp hội ngành hàng có ý kiến đề xuất bổ sung.',
      ],
    },
  };
}
