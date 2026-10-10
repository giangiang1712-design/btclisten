import { SemanticKeywordGroup } from '../types/semanticDictionary';

export const INITIAL_SEMANTIC_GROUPS: SemanticKeywordGroup[] = [
  // =========================================================================
  // 0. LÃNH ĐẠO BỘ & CÁN BỘ CẤP CAO (MINISTRY LEADERSHIP)
  // =========================================================================
  {
    id: 'grp-leadership-minister-deputies',
    name: 'Bộ trưởng & Các Thứ trưởng Bộ Tài chính (Lãnh đạo Bộ)',
    sector: 'leadership',
    sectorNameVi: 'Lãnh đạo Bộ & Cán bộ Cấp cao',
    primaryKeyword: 'bộ trưởng bộ tài chính',
    synonyms: [
      'bộ trưởng bộ tài chính',
      'bộ trưởng tài chính',
      'thứ trưởng bộ tài chính',
      'lãnh đạo bộ tài chính',
      'thường trực bộ tài chính',
      'ban cán sự đảng bộ tài chính',
      'phó bộ trưởng bộ tài chính',
      'người đứng đầu bộ tài chính',
      'tập thể lãnh đạo bộ tài chính',
      'bí thư ban cán sự đảng bộ tài chính',
      'bộ trưởng tài chính việt nam',
      'thứ trưởng thường trực bộ tài chính'
    ],
    contextRules: {
      mustIncludeAny: ['bộ trưởng', 'thứ trưởng', 'lãnh đạo bộ', 'bộ tài chính', 'chỉ đạo'],
      excludeWords: ['bộ trưởng bộ giao thông', 'bộ trưởng bộ công an', 'bộ trưởng bộ tài nguyên'],
      boostWeight: 2.8,
      targetAgencies: ['Ban Cán sự Đảng Bộ Tài chính', 'Văn phòng Bộ Tài chính', 'Lãnh đạo Bộ'],
      targetRegulations: ['Nghị định quy định chức năng, nhiệm vụ, quyền hạn và cơ cấu tổ chức của Bộ Tài chính', 'Phân công công tác của Lãnh đạo Bộ Tài chính'],
      description: 'Giám sát chỉ đạo điều hành, phát ngôn chính thức và các quyết định chiến lược của Bộ trưởng và các Thứ trưởng Bộ Tài chính.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-leadership-department-heads',
    name: 'Lãnh đạo Các Tổng cục, Cục, Vụ & Đơn vị Trực thuộc',
    sector: 'leadership',
    sectorNameVi: 'Lãnh đạo Bộ & Cán bộ Cấp cao',
    primaryKeyword: 'tổng cục trưởng tổng cục thuế',
    synonyms: [
      'tổng cục trưởng tổng cục hải quan',
      'chủ tịch ủy ban chứng khoán nhà nước',
      'tổng cục trưởng kho bạc nhà nước',
      'tổng cục trưởng tổng cục dự trữ nhà nước',
      'cục trưởng cục quản lý giá',
      'cục trưởng cục tài chính doanh nghiệp',
      'cục trưởng cục quản lý công sản',
      'cục trưởng cục quản lý nợ',
      'cục trưởng cục quản lý giám sát bảo hiểm',
      'chánh văn phòng bộ tài chính',
      'vụ trưởng vụ ngân sách nhà nước',
      'vụ trưởng vụ pháp chế bộ tài chính',
      'viện trưởng viện chiến lược tài chính',
      'thủ trưởng đơn vị thuộc bộ tài chính'
    ],
    contextRules: {
      mustIncludeAny: ['tổng cục trưởng', 'cục trưởng', 'vụ trưởng', 'chủ tịch ubcknn', 'chánh văn phòng bộ', 'bộ tài chính'],
      excludeWords: ['cục trưởng cục cảnh sát', 'vụ trưởng bộ giáo dục'],
      boostWeight: 2.6,
      targetAgencies: ['Cục Thuế', 'Tổng cục Hải quan', 'UBCKNN', 'Kho bạc Nhà nước', 'Tổng cục Dự trữ Nhà nước', 'Cục Quản lý Giá'],
      targetRegulations: ['Quy chế làm việc của Bộ Tài chính', 'Nghị định quy định cơ cấu tổ chức các Tổng cục và Cục trực thuộc'],
      description: 'Nhận diện thông tin điều hành nghiệp vụ chuyên sâu và thông điệp của Thủ trưởng các cơ quan trực thuộc Bộ Tài chính.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-leadership-key-appointments',
    name: 'Công tác Cán bộ, Bổ nhiệm & Luân chuyển Lãnh đạo Ngành',
    sector: 'leadership',
    sectorNameVi: 'Lãnh đạo Bộ & Cán bộ Cấp cao',
    primaryKeyword: 'bổ nhiệm thứ trưởng bộ tài chính',
    synonyms: [
      'công tác cán bộ bộ tài chính',
      'luân chuyển lãnh đạo ngành tài chính',
      'bổ nhiệm tổng cục trưởng',
      'bổ nhiệm cục trưởng cục thuế',
      'bổ nhiệm cục trưởng cục hải quan',
      'bổ nhiệm chánh văn phòng bộ tài chính',
      'quy hoạch cán bộ lãnh đạo bộ tài chính',
      'tiêu chuẩn chức danh lãnh đạo bộ tài chính',
      'quyết định bổ nhiệm bộ tài chính',
      'trao quyết định bổ nhiệm bộ tài chính',
      'điều động bổ nhiệm cán bộ tài chính',
      'kiện toàn bộ máy lãnh đạo bộ tài chính'
    ],
    contextRules: {
      mustIncludeAny: ['bổ nhiệm', 'cán bộ', 'luân chuyển', 'quy hoạch', 'điều động', 'lãnh đạo', 'bộ tài chính'],
      excludeWords: ['bổ nhiệm giáo viên', 'giám đốc công ty tư nhân'],
      boostWeight: 2.5,
      targetAgencies: ['Vụ Tổ chức Cán bộ - Bộ Tài chính', 'Ban Cán sự Đảng Bộ Tài chính'],
      targetRegulations: ['Quy định về luân chuyển và bổ nhiệm cán bộ ngành Tài chính', 'Quy định số 80-QĐ/TW của Bộ Chính trị về phân cấp quản lý cán bộ'],
      description: 'Theo dõi công tác kiện toàn tổ chức bộ máy, bổ nhiệm, luân chuyển và quy hoạch cán bộ cấp cao ngành Tài chính.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-leadership-directives-inspections',
    name: 'Chỉ đạo Trực tiếp, Kết luận Hội nghị & Chuyến Công tác Lãnh đạo Bộ',
    sector: 'leadership',
    sectorNameVi: 'Lãnh đạo Bộ & Cán bộ Cấp cao',
    primaryKeyword: 'chỉ đạo của bộ trưởng bộ tài chính',
    synonyms: [
      'thông báo kết luận của bộ trưởng bộ tài chính',
      'kết luận của thứ trưởng bộ tài chính',
      'chỉ đạo khẩn của lãnh đạo bộ tài chính',
      'đoàn công tác bộ tài chính',
      'lãnh đạo bộ tài chính làm việc với địa phương',
      'chỉ đạo thu ngân sách của bộ trưởng',
      'chỉ đạo tháo gỡ khó khăn doanh nghiệp',
      'hội nghị giao ban bộ tài chính',
      'yêu cầu siết chặt kỷ luật tài khóa của bộ trưởng',
      'chỉ đạo điều hành vĩ mô của bộ trưởng'
    ],
    contextRules: {
      mustIncludeAny: ['chỉ đạo', 'kết luận', 'bộ trưởng', 'thứ trưởng', 'đoàn công tác', 'bộ tài chính', 'hội nghị'],
      boostWeight: 2.7,
      targetAgencies: ['Văn phòng Bộ Tài chính', 'Thanh tra Bộ Tài chính', 'Cơ quan Thường trực Bộ'],
      targetRegulations: ['Thông báo kết luận các cuộc họp giao ban Lãnh đạo Bộ', 'Chỉ thị của Bộ trưởng Bộ Tài chính về nhiệm vụ trọng tâm ngành'],
      description: 'Giám sát các cuộc họp giao ban, thông báo kết luận chỉ đạo khẩn và chuyến công tác thực địa của Lãnh đạo Bộ Tài chính.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },

  // =========================================================================
  // 1. KẾ HOẠCH, ĐẦU TƯ CÔNG & HẠ TẦNG CHIẾN LƯỢC (PUBLIC INVESTMENT)
  // =========================================================================
  {
    id: 'grp-public-investment-disbursement',
    name: 'Giải ngân Vốn Đầu tư công & Kế hoạch 2026-2030',
    sector: 'public_investment',
    sectorNameVi: 'Kế hoạch, Đầu tư công & Hạ tầng Chiến lược',
    primaryKeyword: 'giải ngân đầu tư công',
    synonyms: [
      'tiến độ giải ngân',
      'vốn đầu tư công',
      'thúc đẩy giải ngân',
      'vốn ngân sách nhà nước',
      'vốn đầu tư phát triển',
      'tổ công tác giải ngân vốn',
      'kế hoạch đầu tư công trung hạn',
      'kế hoạch đầu tư công 2026-2030',
      'phân bổ vốn đầu tư công',
      'cam kết giải ngân 95%',
      'điều chuyển vốn đầu tư',
      'vốn mồi nhà nước'
    ],
    contextRules: {
      mustIncludeAny: ['đầu tư công', 'giải ngân', 'dự án', 'ngân sách', 'vốn'],
      excludeWords: ['đầu tư tiền số', 'bán lẻ', 'chi tiêu cá nhân', 'lướt sóng coin'],
      boostWeight: 2.5,
      targetAgencies: ['Cục Quản lý Đầu tư công & Phát triển', 'Bộ Tài chính', 'Kho bạc Nhà nước', 'UBND các tỉnh/thành phố'],
      targetRegulations: ['Luật Đầu tư công 2019 (sửa đổi)', 'Nghị quyết của Chính phủ về đẩy mạnh phân bổ và giải ngân vốn đầu tư công', 'Kế hoạch trung hạn 2026-2030'],
      description: 'Giám sát chỉ đạo điều hành tiến độ giải ngân vốn đầu tư công toàn quốc, thúc đẩy vai trò vốn mồi dẫn dắt vốn xã hội.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-strategic-mega-infrastructure',
    name: 'Đại dự án Đường sắt Tốc độ cao, Sân bay Long Thành & Cao tốc',
    sector: 'public_investment',
    sectorNameVi: 'Kế hoạch, Đầu tư công & Hạ tầng Chiến lược',
    primaryKeyword: 'đường sắt tốc độ cao',
    synonyms: [
      'đường sắt tốc độ cao bắc nam',
      'đường sắt cao tốc bắc nam',
      'cao tốc bắc nam',
      'sân bay long thành giai đoạn 1',
      'vành đai 4 hà nội',
      'vành đai 3 tphcm',
      'đường sắt lào cai hà nội hải phòng',
      'điện hạt nhân ninh thuận',
      'cảng trung chuyển quốc tế cần giờ',
      'công trình hạ tầng chiến lược quốc gia'
    ],
    contextRules: {
      mustIncludeAny: ['hạ tầng', 'dự án', 'đầu tư', 'cao tốc', 'sân bay', 'đường sắt', 'điện hạt nhân', 'cảng biển'],
      excludeWords: ['bất động sản phân lô', 'chứng khoán phái sinh'],
      boostWeight: 2.7,
      targetAgencies: ['Bộ Giao thông Vận tải', 'Bộ Tài chính', 'Ban Quản lý Dự án Quốc gia', 'Ủy ban Quản lý Vốn'],
      targetRegulations: ['Chủ trương đầu tư đường sắt tốc độ cao trục Bắc - Nam (Nghị quyết Quốc hội)', 'Nghị quyết số 81/2023/QH15'],
      description: 'Giám sát phương án bố trí vốn ngân sách và huy động nguồn lực quốc tế cho các đại dự án hạ tầng đột phá đến năm 2030.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-ppp-private-capital-infrastructure',
    name: 'Hợp tác Công tư (PPP), Vốn ODA Thế hệ Mới & Trung tâm Tài chính IFC',
    sector: 'public_investment',
    sectorNameVi: 'Kế hoạch, Đầu tư công & Hạ tầng Chiến lược',
    primaryKeyword: 'đối tác công tư ppp',
    synonyms: [
      'hợp tác công tư ppp',
      'luật ppp sửa đổi',
      'vốn oda thế hệ mới',
      'vốn vay ưu đãi quốc tế',
      'bảo lãnh chính phủ cho dự án ppp',
      'cơ chế chia sẻ rủi ro doanh thu',
      'hợp đồng bot',
      'hợp đồng bto',
      'hợp đồng bt trả bằng tiền',
      'trung tâm tài chính quốc tế tphcm',
      'trung tâm tài chính quốc tế đà nẵng (ifc)',
      'khơi thông nguồn lực tư nhân hạ tầng'
    ],
    contextRules: {
      mustIncludeAny: ['ppp', 'đối tác công tư', 'oda', 'ifc', 'trung tâm tài chính', 'hạ tầng', 'nhà đầu tư'],
      boostWeight: 2.4,
      targetAgencies: ['Cục Quản lý Đấu thầu & Đầu tư công', 'Bộ Tài chính', 'UBND TP.HCM', 'UBND Đà Nẵng'],
      targetRegulations: ['Luật Đầu tư theo phương thức đối tác công tư (PPP sửa đổi)', 'Đề án xây dựng Trung tâm Tài chính Quốc tế tại Việt Nam'],
      description: 'Cơ chế huy động vốn tư nhân, nguồn vốn ODA không ràng buộc và kiến tạo hạ tầng pháp lý cho Trung tâm Tài chính Quốc tế.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },

  // =========================================================================
  // 2. THUẾ & QUẢN LÝ THU NGÂN SÁCH (TAX)
  // =========================================================================
  {
    id: 'grp-tax-vat-corporate',
    name: 'Chính sách Thuế GTGT Sửa đổi & Thuế Thu nhập Doanh nghiệp (TNDN)',
    sector: 'tax',
    sectorNameVi: 'Thuế & Quản lý Thu Ngân sách',
    primaryKeyword: 'chính sách thuế',
    synonyms: [
      'thuế gtgt sửa đổi',
      'luật thuế gtgt',
      'thuế vat',
      'thuế giá trị gia tăng',
      'thuế tndn',
      'thuế thu nhập doanh nghiệp',
      'bỏ miễn thuế hàng nhập khẩu giá trị nhỏ',
      'bỏ miễn thuế hàng dưới 1 triệu',
      'giảm thuế vat 2%',
      'hoàn thuế gtgt điện tử',
      'quyết toán thuế tự động',
      'khấu trừ thuế'
    ],
    contextRules: {
      mustIncludeAny: ['thuế', 'tổng cục thuế', 'cục thuế', 'doanh nghiệp', 'chính sách tài khóa', 'sắc thuế'],
      excludeWords: ['đánh thuế tiền ảo chưa luật', 'thuế thân'],
      boostWeight: 2.6,
      targetAgencies: ['Cục Thuế', 'Vụ Chính sách Thuế - Bộ Tài chính', 'Cục Thuế các tỉnh/thành phố'],
      targetRegulations: ['Luật Thuế Giá trị gia tăng (sửa đổi)', 'Luật Thuế Thu nhập doanh nghiệp (sửa đổi)'],
      description: 'Chính sách sửa đổi bổ sung các sắc thuế cốt lõi, tháo gỡ điểm nghẽn hoàn thuế và xóa bỏ kẽ hở miễn thuế nhập khẩu tiểu ngạch.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-tax-e-commerce-and-einvoice',
    name: 'Thuế Thương mại Điện tử, Livestream & Sàn Xuyên biên giới (TikTok, Temu, Shopee)',
    sector: 'tax',
    sectorNameVi: 'Thuế & Quản lý Thu Ngân sách',
    primaryKeyword: 'thuế thương mại điện tử',
    synonyms: [
      'thuế tmđt',
      'thuế livestream',
      'thuế bán hàng online',
      'thuế tiktok shop',
      'thuế shopee',
      'sàn thương mại điện tử nộp thuế thay',
      'thuế sàn xuyên biên giới',
      'temu',
      'shein',
      'cổng thông tin thương mại điện tử',
      'định danh người bán hàng qua vneid',
      'chống thất thu thuế thương mại điện tử'
    ],
    contextRules: {
      mustIncludeAny: ['thuế', 'thương mại điện tử', 'tmđt', 'livestream', 'sàn', 'bán hàng online'],
      boostWeight: 2.8,
      targetAgencies: ['Cục Thuế', 'Cục Thuế Doanh nghiệp Lớn', 'Cục An ninh Mạng'],
      targetRegulations: ['Thông tư 78/2021/TT-BTC', 'Nghị định quy định trách nhiệm khấu trừ thuế của sàn TMĐT', 'Đề案 06 VNeID'],
      description: 'Quản lý thu thuế đối với kinh doanh trên sàn thương mại điện tử, livestream bán hàng và nền tảng mua sắm xuyên biên giới.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-tax-einvoice-cash-register-ai',
    name: 'Hóa đơn Điện tử Máy tính tiền & AI Chống Gian lận Thuế',
    sector: 'tax',
    sectorNameVi: 'Thuế & Quản lý Thu Ngân sách',
    primaryKeyword: 'hóa đơn điện tử máy tính tiền',
    synonyms: [
      'hóa đơn khởi tạo từ máy tính tiền',
      'hóa đơn điện tử xăng dầu',
      'hóa đơn điện tử từng lần',
      'hóa đơn dịch vụ ăn uống',
      'hóa đơn vàng bạc đá quý',
      'etax mobile 3.0',
      'trợ lý ảo ai ngành thuế',
      'phát hiện hóa đơn khống bằng ai',
      'quản trị rủi ro hóa đơn',
      'chống gian lận hoàn thuế'
    ],
    contextRules: {
      mustIncludeAny: ['hóa đơn', 'máy tính tiền', 'etax mobile', 'thuế', 'xăng dầu', 'gian lận'],
      boostWeight: 2.4,
      targetAgencies: ['Cục Thuế', 'Cục CNTT Cục Thuế'],
      targetRegulations: ['Thông tư 78/2021/TT-BTC', 'Chỉ thị số 04/CT-BTC về hóa đơn điện tử máy tính tiền'],
      description: 'Phủ sóng hóa đơn điện tử khởi tạo từ máy tính tiền tại 100% cơ sở kinh doanh ăn uống, bán lẻ, xăng dầu và vàng bạc.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-tax-global-minimum',
    name: 'Thuế Tối thiểu Toàn cầu (Pillar Two / GMT) & Quỹ Hỗ trợ Đầu tư',
    sector: 'tax',
    sectorNameVi: 'Thuế & Quản lý Thu Ngân sách',
    primaryKeyword: 'thuế tối thiểu toàn cầu',
    synonyms: [
      'global minimum tax',
      'trụ cột 2 oecd',
      'thuế bổ sung tối thiểu nội địa đạt chuẩn',
      'qdmtt',
      'quỹ hỗ trợ đầu tư',
      'chính sách ưu đãi fdi thế hệ mới',
      'giữ chân tập đoàn công nghệ cao',
      'thuế fdi bán dẫn và ai',
      'bù trừ chi phí đầu tư'
    ],
    contextRules: {
      mustIncludeAny: ['thuế tối thiểu toàn cầu', 'gmt', 'fdi', 'oecd', 'quỹ hỗ trợ đầu tư', 'qdmtt'],
      boostWeight: 2.5,
      targetAgencies: ['Cục Thuế', 'Vụ Hợp tác Quốc tế - Bộ Tài chính', 'Bộ Kế hoạch và Đầu tư'],
      targetRegulations: ['Nghị quyết số 107/2023/QH15 của Quốc hội', 'Nghị định thành lập Quỹ Hỗ trợ Đầu tư'],
      description: 'Thực thi thuế tối thiểu toàn cầu 15% đối với các tập đoàn đa quốc gia và triển khai cơ chế hỗ trợ chi phí duy trì năng lực cạnh tranh.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-tax-personal-income-tax-reform',
    name: 'Thuế TNCN & Điều chỉnh Mức Giảm trừ Gia cảnh 2026',
    sector: 'tax',
    sectorNameVi: 'Thuế & Quản lý Thu Ngân sách',
    primaryKeyword: 'thuế thu nhập cá nhân',
    synonyms: [
      'thuế tncn',
      'mức giảm trừ gia cảnh',
      'nâng mức giảm trừ gia cảnh',
      'ngưỡng chịu thuế tncn',
      'biểu thuế lũy tiến từng phần',
      'giảm trừ người phụ thuộc',
      'sửa đổi luật thuế tncn',
      'hoàn thuế tncn tự động'
    ],
    contextRules: {
      mustIncludeAny: ['thuế tncn', 'thu nhập cá nhân', 'giảm trừ gia cảnh', 'người phụ thuộc'],
      boostWeight: 2.6,
      targetAgencies: ['Vụ Chính sách Thuế - Bộ Tài chính', 'Cục Thuế', 'Ủy ban Tài chính - Ngân sách Quốc hội'],
      targetRegulations: ['Luật Thuế Thu nhập cá nhân (sửa đổi)'],
      description: 'Lộ trình sửa đổi Luật Thuế TNCN, nâng mức giảm trừ gia cảnh phù hợp với biến động chỉ số giá CPI và thu nhập thực tế.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },

  // =========================================================================
  // 3. HẢI QUAN & THƯƠNG MẠI XNK (CUSTOMS)
  // =========================================================================
  {
    id: 'grp-customs-smart-border-clearance',
    name: 'Hải quan Số, Cửa khẩu Thông minh & Cơ chế Một cửa ASEAN (ASW)',
    sector: 'customs',
    sectorNameVi: 'Hải quan & Thương mại XNK',
    primaryKeyword: 'hải quan số',
    synonyms: [
      'hải quan thông minh',
      'cửa khẩu thông minh',
      'smart border gate',
      'thông quan tự động 24/7',
      'hệ thống một cửa quốc gia nsw',
      'cơ chế một cửa asean',
      'kiểm tra chuyên ngành số hóa',
      'luồng xanh thông quan',
      'mô hình hải quan phi giấy tờ'
    ],
    contextRules: {
      mustIncludeAny: ['hải quan', 'cửa khẩu thông minh', 'thông quan', 'một cửa quốc gia', 'xnk'],
      boostWeight: 2.3,
      targetAgencies: ['Tổng cục Hải quan', 'Cục CNTT & Thống kê Hải quan', 'Cục Hải quan Lạng Sơn, Quảng Ninh, Hải Phòng, TP.HCM'],
      targetRegulations: ['Quyết định số 628/QĐ-TTg về Chiến lược phát triển Hải quan đến năm 2030', 'Đề án Xây dựng Cửa khẩu Thông minh'],
      description: 'Chuyển đổi số toàn diện hoạt động hải quan, ứng dụng IoT/AI tại cửa khẩu thông minh Hữu Nghị - Tân Thanh kết nối với Trung Quốc.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-customs-trade-turnover-surplus',
    name: 'Kim ngạch Xuất Nhập khẩu, Xuất siêu & Cán cân Thương mại 2026',
    sector: 'customs',
    sectorNameVi: 'Hải quan & Thương mại XNK',
    primaryKeyword: 'kim ngạch xuất nhập khẩu',
    synonyms: [
      'kim ngạch xnk',
      'xuất khẩu hàng hóa',
      'nhập khẩu hàng hóa',
      'cán cân thương mại',
      'xuất siêu kỷ lục',
      'thặng dư thương mại',
      'thâm hụt thương mại',
      'kim ngạch 800 tỷ usd',
      'kim ngạch 900 tỷ usd',
      'thương mại quốc tế việt nam'
    ],
    contextRules: {
      mustIncludeAny: ['kim ngạch', 'xuất khẩu', 'nhập khẩu', 'thương mại', 'tổng cục hải quan'],
      boostWeight: 2.3,
      targetAgencies: ['Tổng cục Hải quan', 'Bộ Công Thương', 'Tổng cục Thống kê'],
      description: 'Theo dõi tổng giá trị kim ngạch xuất nhập khẩu, thặng dư thương mại và cán cân thanh toán quốc gia theo tháng/quý/năm.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-customs-origin-cbam-eudr',
    name: 'Gian lận Xuất xứ C/O, Phòng vệ Thương mại, Thuế CBAM & Quy chuẩn EUDR',
    sector: 'customs',
    sectorNameVi: 'Hải quan & Thương mại XNK',
    primaryKeyword: 'quy tắc xuất xứ hàng hóa',
    synonyms: [
      'gian lận xuất xứ c/o',
      'chống lẩn tránh phòng vệ thương mại',
      'thuế carbon cbam',
      'cơ chế điều chỉnh biên giới carbon eu',
      'quy định chống phá rừng eudr',
      'chứng nhận xuất xứ điện tử e-c/o',
      'truy xuất nguồn gốc hàng hóa xnk',
      'kiểm tra sau thông quan',
      'chống buôn lậu gian lận thương mại'
    ],
    contextRules: {
      mustIncludeAny: ['xuất xứ', 'c/o', 'cbam', 'eudr', 'phòng vệ thương mại', 'buôn lậu', 'sau thông quan'],
      boostWeight: 2.5,
      targetAgencies: ['Tổng cục Hải quan', 'Cục Kiểm tra sau Thông quan', 'Ban Chỉ đạo 389 Quốc gia', 'Cục Phòng vệ Thương mại'],
      targetRegulations: ['Nghị định 31/2018/NĐ-CP về xuất xứ hàng hóa', 'Quy định EU CBAM & EUDR'],
      description: 'Kiểm soát chặt chẽ gian lận giả mạo xuất xứ Việt Nam để né thuế phòng vệ, thích ứng với các tiêu chuẩn xanh ngặt nghèo của thị trường xuất khẩu.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },

  // =========================================================================
  // 4. CHỨNG KHOÁN & THỊ TRƯỜNG VỐN (STOCKS)
  // =========================================================================
  {
    id: 'grp-stocks-market-upgrade',
    name: 'Nâng hạng TTCK (FTSE Russell / MSCI) & Cơ chế Non-Prefunding',
    sector: 'stocks',
    sectorNameVi: 'Chứng khoán & Thị trường Vốn',
    primaryKeyword: 'nâng hạng thị trường',
    synonyms: [
      'nâng hạng chứng khoán',
      'nâng hạng ttck việt nam',
      'ftse russell',
      'msci emerging markets',
      'thị trường mới nổi',
      'thông tư 68/2024/tt-btc',
      'non-prefunding',
      'giao dịch không ký quỹ 100% tiền',
      'công bố thông tin bằng tiếng anh',
      'thu hút dòng vốn ngoại fii',
      'tỷ lệ sở hữu nước ngoài room ngoại'
    ],
    contextRules: {
      mustIncludeAny: ['chứng khoán', 'nâng hạng', 'ftse', 'msci', 'ubcknn', 'non-prefunding'],
      boostWeight: 2.9,
      targetAgencies: ['Ủy ban Chứng khoán Nhà nước (UBCKNN)', 'Bộ Tài chính', 'VSDC', 'HOSE', 'HNX'],
      targetRegulations: ['Thông tư 68/2024/TT-BTC', 'Chiến lược phát triển TTCK đến năm 2030'],
      description: 'Mục tiêu chiến lược nâng hạng TTCK Việt Nam từ thị trường cận biên lên thị trường mới nổi thứ cấp (Secondary Emerging Market).'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-stocks-krx-trading-products',
    name: 'Hệ thống KRX, Giao dịch T+0, Bán khống (Short-selling) & Sản phẩm Mới',
    sector: 'stocks',
    sectorNameVi: 'Chứng khoán & Thị trường Vốn',
    primaryKeyword: 'hệ thống krx',
    synonyms: [
      'vận hành hệ thống krx',
      'giao dịch t+0',
      'giao dịch trong ngày day trading',
      'bán khống có kiểm soát',
      'short selling',
      'chứng quyền có bảo đảm',
      'hợp đồng tương lai chỉ số mới',
      'mô hình đối tác bù trừ trung tâm ccp',
      'tổng công ty lưu ký và bù trừ chứng khoán vsdc'
    ],
    contextRules: {
      mustIncludeAny: ['krx', 't+0', 'giao dịch', 'bù trừ ccp', 'vsdc', 'chứng quyền', 'bán khống'],
      boostWeight: 2.7,
      targetAgencies: ['Sở GDCK TP.HCM (HOSE)', 'Sở GDCK Hà Nội (HNX)', 'VSDC', 'UBCKNN'],
      description: 'Hạ tầng công nghệ thông tin lõi KRX tạo tiền đề triển khai đa dạng sản phẩm phái sinh và cơ chế thanh toán bù trừ chuẩn quốc tế.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-stocks-trading-vnindex-manipulation',
    name: 'Chỉ số VN-Index, Thanh khoản & Giám sát Chống Thao túng Giá Cổ phiếu',
    sector: 'stocks',
    sectorNameVi: 'Chứng khoán & Thị trường Vốn',
    primaryKeyword: 'vn-index',
    synonyms: [
      'vnindex',
      'chỉ số vn30',
      'sàn hose',
      'sàn hnx',
      'thanh khoản thị trường chứng khoán',
      'khối ngoại mua ròng',
      'khối ngoại bán ròng',
      'thanh tra ubcknn',
      'xử lý thao túng thị trường chứng khoán',
      'giao dịch nội gián insider trading',
      'bảo vệ nhà đầu tư cá nhân'
    ],
    contextRules: {
      mustIncludeAny: ['chứng khoán', 'cổ phiếu', 'giao dịch', 'vnindex', 'thao túng'],
      boostWeight: 2.3,
      targetAgencies: ['Ủy ban Chứng khoán Nhà nước (UBCKNN)', 'Cục Quản lý Giám sát Giao dịch', 'C03 Bộ Công an'],
      targetRegulations: ['Luật Chứng khoán 2019', 'Nghị định 156/2020/NĐ-CP xử phạt vi phạm hành chính'],
      description: 'Theo dõi diễn biến thị trường, thanh khoản giao dịch và tăng cường kỷ cương minh bạch, răn đe hành vi thao túng làm giá.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },

  // =========================================================================
  // 5. TRÁI PHIẾU DOANH NGHIỆP & TPCP (BONDS)
  // =========================================================================
  {
    id: 'grp-bonds-corporate-credit-rating',
    name: 'Trái phiếu Doanh nghiệp (TPDN), Sàn HNX & Xếp hạng Tín nhiệm Bắt buộc',
    sector: 'bonds',
    sectorNameVi: 'Trái phiếu Doanh nghiệp & TPCP',
    primaryKeyword: 'trái phiếu doanh nghiệp',
    synonyms: [
      'tpdn',
      'trái phiếu riêng lẻ',
      'đáo hạn trái phiếu',
      'áp lực đáo hạn tpdn',
      'xếp hạng tín nhiệm bắt buộc',
      'tổ chức xếp hạng tín nhiệm',
      'vis rating',
      'fiinratings',
      'saigon ratings',
      'sàn giao dịch tpdn riêng lẻ hnx',
      'chậm thanh toán gốc lãi',
      'tái cấu trúc nợ trái phiếu',
      'nghị định 65',
      'nghị định 08'
    ],
    contextRules: {
      mustIncludeAny: ['trái phiếu', 'tpdn', 'đáo hạn', 'xếp hạng tín nhiệm', 'hnx'],
      boostWeight: 2.7,
      targetAgencies: ['Vụ Tài chính các Ngân hàng & TCTC - Bộ Tài chính', 'UBCKNN', 'Sở GDCK Hà Nội (HNX)'],
      targetRegulations: ['Nghị định 65/2022/NĐ-CP', 'Nghị định 08/2023/NĐ-CP', 'Thông tư 30/2023/TT-BTC'],
      description: 'Giám sát an toàn thanh khoản thị trường TPDN riêng lẻ, thúc đẩy văn hóa xếp hạng tín nhiệm và giao dịch tập trung minh bạch.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-bonds-government-treasury-infrastructure',
    name: 'Trái phiếu Chính phủ & Kỳ hạn Dài (15-30 năm) Tài trợ Hạ tầng',
    sector: 'bonds',
    sectorNameVi: 'Trái phiếu Doanh nghiệp & TPCP',
    primaryKeyword: 'trái phiếu chính phủ',
    synonyms: [
      'tpcp',
      'đấu thầu trái phiếu chính phủ',
      'lợi suất trái phiếu chính phủ',
      'kho bạc nhà nước phát hành tpcp',
      'trái phiếu công trình quốc gia',
      'trái phiếu chính phủ xanh',
      'trái phiếu kỳ hạn 15 năm',
      'trái phiếu kỳ hạn 20 năm',
      'trái phiếu kỳ hạn 30 năm',
      'huy động vốn ngân sách nhà nước'
    ],
    contextRules: {
      mustIncludeAny: ['trái phiếu chính phủ', 'tpcp', 'kho bạc', 'đấu thầu', 'lợi suất'],
      boostWeight: 2.2,
      targetAgencies: ['Kho bạc Nhà nước', 'Vụ Tài chính Ngân hàng - Bộ Tài chính', 'Sở GDCK Hà Nội (HNX)'],
      description: 'Kênh huy động vốn nợ dài hạn chi phí thấp cho Ngân sách Nhà nước phục vụ đầu tư các công trình kết cấu hạ tầng chiến lược.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },

  // =========================================================================
  // 6. KHO BẠC NHÀ NƯỚC & NGÂN SÁCH QUỐC GIA (TREASURY)
  // =========================================================================
  {
    id: 'grp-treasury-national-budget-discipline',
    name: 'Thu Chi Ngân sách Nhà nước (NSNN), Kỷ luật Tài khóa & Dự toán 2026',
    sector: 'treasury',
    sectorNameVi: 'Kho bạc Nhà nước & Ngân sách Quốc gia',
    primaryKeyword: 'ngân sách nhà nước',
    synonyms: [
      'nsnn',
      'thu ngân sách nhà nước',
      'chi ngân sách nhà nước',
      'bội chi ngân sách',
      'cân đối ngân sách',
      'dự toán ngân sách 2026',
      'quyết toán ngân sách nhà nước',
      'kỷ luật tài khóa',
      'tiết kiệm chi thường xuyên',
      'quản lý ngân sách theo kết quả đầu ra'
    ],
    contextRules: {
      mustIncludeAny: ['ngân sách', 'thu ngân sách', 'chi ngân sách', 'bội chi', 'kỷ luật tài khóa'],
      boostWeight: 2.5,
      targetAgencies: ['Vụ Ngân sách Nhà nước', 'Bộ Tài chính', 'Chính phủ', 'Quốc hội'],
      targetRegulations: ['Luật Ngân sách Nhà nước 2015 (sửa đổi)', 'Nghị quyết phân bổ ngân sách trung ương năm 2026'],
      description: 'Kiểm soát bội chi ngân sách trong giới hạn trần Quốc hội phê chuẩn, nâng cao hiệu quả phân bổ và chi tiêu công.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-treasury-digital-services-tsa',
    name: 'Kho bạc Số, Quản lý Ngân quỹ TSA & Dịch vụ Công Trực tuyến Toàn trình',
    sector: 'treasury',
    sectorNameVi: 'Kho bạc Nhà nước & Ngân sách Quốc gia',
    primaryKeyword: 'kho bạc nhà nước',
    synonyms: [
      'kbnn',
      'ngân quỹ quốc gia',
      'tài khoản duy nhất kho bạc tsa',
      'dịch vụ công trực tuyến kho bạc',
      'kiểm soát chi ngân sách qua kts',
      'thanh toán điện tử liên ngân hàng',
      'kho bạc số 2026',
      'không dùng tiền mặt trong chi tiêu công',
      'quản lý ngân quỹ tập trung'
    ],
    contextRules: {
      mustIncludeAny: ['kho bạc', 'kbnn', 'ngân quỹ', 'kiểm soát chi', 'dịch vụ công'],
      boostWeight: 2.3,
      targetAgencies: ['Kho bạc Nhà nước', 'Cục CNTT Kho bạc Nhà nước', 'Hệ thống KBNN 63 tỉnh/thành phố'],
      targetRegulations: ['Chiến lược phát triển Kho bạc Nhà nước đến năm 2030'],
      description: 'Hiện đại hóa toàn trình quản lý ngân quỹ quốc gia, kiểm soát chi NSNN chặt chẽ, minh bạch và số hóa 100% hồ sơ.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },

  // =========================================================================
  // 7. QUẢN LÝ GIÁ & BÌNH ỔN THỊ TRƯỜNG (PRICE MANAGEMENT)
  // =========================================================================
  {
    id: 'grp-price-law-petroleum-stabilization',
    name: 'Thực thi Luật Giá 2023, Điều hành Giá Xăng dầu & Quỹ Bình ổn',
    sector: 'price_management',
    sectorNameVi: 'Quản lý Giá & Bình ổn Thị trường',
    primaryKeyword: 'quản lý giá',
    synonyms: [
      'cục quản lý giá',
      'luật giá 2023',
      'bình ổn giá',
      'điều hành giá xăng dầu',
      'quỹ bình ổn giá xăng dầu',
      'rút ngắn chu kỳ điều hành giá xăng dầu',
      'kê khai giá trực tuyến',
      'niêm yết giá',
      'kiểm soát lạm phát cpi',
      'bình ổn thị trường dịp lễ tết',
      'ban chỉ đạo điều hành giá'
    ],
    contextRules: {
      mustIncludeAny: ['giá', 'quản lý giá', 'bình ổn', 'xăng dầu', 'cpi', 'lạm phát'],
      boostWeight: 2.6,
      targetAgencies: ['Cục Quản lý Giá - Bộ Tài chính', 'Ban Chỉ đạo Điều hành Giá của Thủ tướng', 'Bộ Công Thương'],
      targetRegulations: ['Luật Giá số 16/2023/QH15', 'Nghị định quy định chi tiết thi hành Luật Giá'],
      description: 'Giám sát mặt bằng giá cả hàng hóa thiết yếu, vận hành cơ chế giá thị trường có sự điều tiết của Nhà nước nhằm giữ CPI dưới 4.5%.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-price-electricity-dppa-two-component',
    name: 'Cơ chế Giá Điện Thị trường, Mua bán Điện Trực tiếp (DPPA) & Giá 2 Thành phần',
    sector: 'price_management',
    sectorNameVi: 'Quản lý Giá & Bình ổn Thị trường',
    primaryKeyword: 'giá điện',
    synonyms: [
      'giá điện 2 thành phần',
      'giá điện công suất và điện năng',
      'cơ chế mua bán điện trực tiếp dppa',
      'điều chỉnh biểu giá bán lẻ điện',
      'giá điện năng lượng tái tạo',
      'chi phí sản xuất điện evn',
      'thị trường bán lẻ điện cạnh tranh',
      'bù chéo giá điện'
    ],
    contextRules: {
      mustIncludeAny: ['giá điện', 'dppa', 'điện 2 thành phần', 'evn', 'biểu giá điện'],
      boostWeight: 2.4,
      targetAgencies: ['Cục Quản lý Giá - Bộ Tài chính', 'Cục Điều tiết Điện lực - Bộ Công Thương', 'Tập đoàn Điện lực Việt Nam (EVN)'],
      targetRegulations: ['Nghị định số 80/2024/NĐ-CP về cơ chế DPPA', 'Quyết định Thủ tướng về cơ cấu biểu giá bán lẻ điện'],
      description: 'Đổi mới cơ chế định giá điện minh bạch, triển khai giá điện 2 thành phần và cơ chế mua bán điện trực tiếp cho doanh nghiệp xanh.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },

  // =========================================================================
  // 8. KINH TẾ NHÀ NƯỚC, DNNN & SCIC (STATE CAPITAL)
  // =========================================================================
  {
    id: 'grp-state-capital-soe-oecd-reform',
    name: 'Đổi mới Quản trị Doanh nghiệp Nhà nước (DNNN) theo Chuẩn mực OECD',
    sector: 'state_capital',
    sectorNameVi: 'Kinh tế Nhà nước, DNNN & SCIC',
    primaryKeyword: 'doanh nghiệp nhà nước',
    synonyms: [
      'dnnn',
      'kinh tế nhà nước',
      'tập đoàn kinh tế nhà nước',
      'tổng công ty nhà nước',
      'quản lý vốn nhà nước tại doanh nghiệp',
      'luật quản lý vốn nhà nước sửa đổi',
      'chuẩn mực quản trị oecd',
      'tách bạch chức năng chủ sở hữu và kinh doanh',
      'tái cơ cấu dnnn',
      'bảo toàn và phát triển vốn nhà nước'
    ],
    contextRules: {
      mustIncludeAny: ['dnnn', 'vốn nhà nước', 'tập đoàn', 'tổng công ty', 'chủ sở hữu'],
      boostWeight: 2.3,
      targetAgencies: ['Cục Tài chính Doanh nghiệp - Bộ Tài chính', 'Ủy ban Quản lý Vốn Nhà nước tại Doanh nghiệp', 'Các Tập đoàn/Tổng công ty Nhà nước'],
      targetRegulations: ['Luật số 69/2014/QH13 (sửa đổi)', 'Nghị quyết của Chính phủ về phát triển DNNN quy mô lớn'],
      description: 'Giải phóng nguồn lực của khu vực doanh nghiệp nhà nước, trao quyền tự chủ kinh doanh và áp dụng các tiêu chuẩn quản trị quốc tế hiện đại.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-state-capital-scic-sovereign-wealth-fund',
    name: 'SCIC thành Quỹ Đầu tư Quốc gia (Sovereign Wealth Fund) & Thoái vốn',
    sector: 'state_capital',
    sectorNameVi: 'Kinh tế Nhà nước, DNNN & SCIC',
    primaryKeyword: 'scic',
    synonyms: [
      'tổng công ty đầu tư và kinh doanh vốn nhà nước',
      'quỹ đầu tư quốc gia',
      'sovereign wealth fund',
      'mô hình temasek việt nam',
      'thoái vốn nhà nước',
      'đấu giá cổ phần nhà nước',
      'đầu tư vốn vào các ngành công nghệ cao bán dẫn',
      'danh mục thoái vốn scic',
      'bán đấu giá trọn lô'
    ],
    contextRules: {
      mustIncludeAny: ['scic', 'thoái vốn', 'quỹ đầu tư quốc gia', 'vốn nhà nước', 'đấu giá'],
      boostWeight: 2.4,
      targetAgencies: ['SCIC', 'Bộ Tài chính', 'Chính phủ'],
      targetRegulations: ['Chiến lược phát triển SCIC đến năm 2030, tầm nhìn 2035'],
      description: 'Chuyển đổi SCIC thành Quỹ Đầu tư Quốc gia đóng vai trò nhà đầu tư chiến lược của Chính phủ, đẩy mạnh thoái vốn ngoài ngành hiệu quả.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },

  // =========================================================================
  // 9. BẢO HIỂM & DỊCH VỤ TÀI CHÍNH (INSURANCE)
  // =========================================================================
  {
    id: 'grp-insurance-market-bancassurance-supervision',
    name: 'Chấn chỉnh Thị trường Bảo hiểm, Bancassurance & Bảo vệ Quyền lợi Khách hàng',
    sector: 'insurance',
    sectorNameVi: 'Bảo hiểm & Thị trường Dịch vụ Tài chính',
    primaryKeyword: 'thị trường bảo hiểm',
    synonyms: [
      'cục quản lý giám sát bảo hiểm',
      'bancassurance',
      'bán bảo hiểm qua ngân hàng',
      'ép khách hàng mua bảo hiểm khi vay vốn',
      'bảo hiểm nhân thọ',
      'bảo hiểm phi nhân thọ',
      'bảo hiểm liên kết đầu tư',
      'hợp đồng bảo hiểm minh bạch',
      'luật kinh doanh bảo hiểm 2022',
      'thanh tra doanh nghiệp bảo hiểm'
    ],
    contextRules: {
      mustIncludeAny: ['bảo hiểm', 'bancassurance', 'nhân thọ', 'doanh nghiệp bảo hiểm', 'hợp đồng bảo hiểm'],
      boostWeight: 2.5,
      targetAgencies: ['Cục Quản lý, Giám sát Bảo hiểm - Bộ Tài chính', 'Ngân hàng Nhà nước'],
      targetRegulations: ['Luật Kinh doanh Bảo hiểm 2022', 'Thông tư 67/2023/TT-BTC hướng dẫn Luật KD Bảo hiểm'],
      description: 'Tăng cường thanh tra, kiểm tra toàn diện kênh phân phối bảo hiểm qua ngân hàng, xử lý nghiêm hành vi ép buộc tư vấn sai lệch.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-insurance-micro-green-pension',
    name: 'Bảo hiểm Nông nghiệp, Bảo hiểm Vi mô & Quỹ Hưu trí Tự nguyện',
    sector: 'insurance',
    sectorNameVi: 'Bảo hiểm & Thị trường Dịch vụ Tài chính',
    primaryKeyword: 'bảo hiểm vi mô',
    synonyms: [
      'bảo hiểm nông nghiệp',
      'quỹ hưu trí tự nguyện',
      'quỹ hưu trí bổ sung',
      'bảo hiểm rủi ro thiên tai',
      'insurtech',
      'công nghệ bảo hiểm số',
      'bảo hiểm sức khỏe toàn dân',
      'bồi thường bảo hiểm nhanh qua ứng dụng'
    ],
    contextRules: {
      mustIncludeAny: ['bảo hiểm vi mô', 'hưu trí tự nguyện', 'bảo hiểm nông nghiệp', 'insurtech'],
      boostWeight: 2.0,
      targetAgencies: ['Cục Quản lý, Giám sát Bảo hiểm', 'Hiệp hội Bảo hiểm Việt Nam'],
      description: 'Phát triển các sản phẩm bảo hiểm an sinh xã hội, bảo vệ người có thu nhập thấp và kích cầu thị trường quỹ hưu trí bổ sung.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },

  // =========================================================================
  // 10. NỢ CÔNG & TÀI CHÍNH ĐỐI NGOẠI (PUBLIC DEBT)
  // =========================================================================
  {
    id: 'grp-public-debt-ceiling-safety',
    name: 'An toàn Nợ công, Trần Nợ Chính phủ & Chiến lược Nợ 2026-2030',
    sector: 'public_debt',
    sectorNameVi: 'Nợ công & Tài chính Đối ngoại',
    primaryKeyword: 'nợ công',
    synonyms: [
      'trần nợ công',
      'nợ chính phủ',
      'chỉ tiêu an toàn nợ công',
      'cục quản lý nợ và tài chính đối ngoại',
      'nghĩa vụ trả nợ trực tiếp của chính phủ',
      'hạn mức vay nợ quốc gia',
      'cơ cấu lại nợ công theo hướng bền vững',
      'nợ nước ngoài của quốc gia',
      'chiến lược nợ công 2026-2030'
    ],
    contextRules: {
      mustIncludeAny: ['nợ công', 'nợ chính phủ', 'trần nợ', 'trả nợ', 'tài chính đối ngoại'],
      boostWeight: 2.4,
      targetAgencies: ['Cục Quản lý Nợ & Tài chính Đối ngoại - Bộ Tài chính', 'Chính phủ', 'Quốc hội'],
      targetRegulations: ['Luật Quản lý Nợ công 2017', 'Kế hoạch vay, trả nợ công 5 năm giai đoạn 2026-2030'],
      description: 'Duy trì các chỉ số an toàn nợ công cách xa ngưỡng trần cho phép (dưới 60% GDP), bảo đảm khả năng thanh toán nợ đầy đủ, đúng hạn.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-public-debt-sovereign-credit-rating',
    name: 'Xếp hạng Tín nhiệm Quốc gia (S&P, Moody\'s, Fitch) lên Mức Đầu tư (Investment Grade)',
    sector: 'public_debt',
    sectorNameVi: 'Nợ công & Tài chính Đối ngoại',
    primaryKeyword: 'xếp hạng tín nhiệm quốc gia',
    synonyms: [
      'định mức tín nhiệm việt nam',
      'hạng mức đầu tư investment grade',
      'fitch ratings',
      'moody\'s',
      's&p global ratings',
      'nâng bậc tín nhiệm quốc gia',
      'hồ sơ tín nhiệm quốc gia',
      'đàm phán hiệp định vay vốn ưu đãi nước ngoài',
      'vốn vay song phương đa phương'
    ],
    contextRules: {
      mustIncludeAny: ['tín nhiệm quốc gia', 'fitch', 'moody', 's&p', 'định mức tín nhiệm', 'investment grade'],
      boostWeight: 2.6,
      targetAgencies: ['Bộ Tài chính', 'Ngân hàng Nhà nước', 'Viện Chiến lược Tài chính'],
      targetRegulations: ['Đề án Cải thiện xếp hạng tín nhiệm quốc gia đến năm 2030'],
      description: 'Hiện thực hóa mục tiêu nâng hạng tín nhiệm quốc gia của Việt Nam lên mức Đầu tư (Investment Grade) nhằm giảm chi phí huy động vốn.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },

  // =========================================================================
  // 11. TÀI SẢN CÔNG & QUẢN LÝ CÔNG SẢN (PUBLIC ASSETS)
  // =========================================================================
  {
    id: 'grp-public-assets-merger-housing-reallocation',
    name: 'Sắp xếp Trụ sở Công vụ sau Sáp nhập, Nhà đất Công & Đấu giá Trực tuyến',
    sector: 'public_assets',
    sectorNameVi: 'Tài sản công & Quản lý Công sản',
    primaryKeyword: 'tài sản công',
    synonyms: [
      'cục quản lý công sản',
      'nhà đất công',
      'sắp xếp lại cơ sở nhà đất công',
      'xử lý trụ sở công dôi dư sau sáp nhập',
      'đấu giá trực tuyến tài sản công',
      'tiêu chuẩn định mức sử dụng xe công',
      'chống lãng phí thất thoát tài sản công',
      'cơ sở dữ liệu quốc gia về tài sản công'
    ],
    contextRules: {
      mustIncludeAny: ['tài sản công', 'công sản', 'nhà đất công', 'trụ sở', 'dôi dư', 'đấu giá tài sản'],
      boostWeight: 2.4,
      targetAgencies: ['Cục Quản lý Công sản - Bộ Tài chính', 'UBND các tỉnh/thành phố', 'Các Bộ ngành liên quan'],
      targetRegulations: ['Luật Quản lý, sử dụng tài sản công 2017 (sửa đổi)', 'Nghị định số 167/2017/NĐ-CP & Nghị định 67/2021/NĐ-CP'],
      description: 'Xử lý dứt điểm tình trạng lãng phí nhà đất công vụ, trụ sở dôi dư sau sáp nhập các đơn vị hành chính và đẩy mạnh đấu giá minh bạch.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-public-assets-infrastructure-exploitation',
    name: 'Khai thác & Cho thuê Quyền Khai thác Tài sản Kết cấu Hạ tầng Công',
    sector: 'public_assets',
    sectorNameVi: 'Tài sản công & Quản lý Công sản',
    primaryKeyword: 'tài sản kết cấu hạ tầng',
    synonyms: [
      'khai thác tài sản hạ tầng giao thông',
      'cho thuê quyền khai thác tài sản công',
      'nhượng quyền khai thác hạ tầng',
      'tài sản hạ tầng thủy lợi',
      'tài sản hạ tầng cảng biển',
      'tài sản công nghệ thông tin nhà nước',
      'thương mại hóa tài sản công hợp pháp'
    ],
    contextRules: {
      mustIncludeAny: ['tài sản kết cấu hạ tầng', 'hạ tầng công', 'nhượng quyền', 'khai thác tài sản'],
      boostWeight: 2.1,
      targetAgencies: ['Cục Quản lý Công sản - Bộ Tài chính', 'Bộ Giao thông Vận tải', 'Bộ Nông nghiệp và Phát triển Nông thôn'],
      description: 'Khơi thông và tối ưu hóa nguồn thu ngân sách từ việc khai thác, vận hành tài sản kết cấu hạ tầng giao thông, thủy lợi và văn hóa.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },

  // =========================================================================
  // 12. DỰ TRỮ NHÀ NƯỚC & AN NINH VẬT TƯ (STATE RESERVE)
  // =========================================================================
  {
    id: 'grp-state-reserve-emergency-aid',
    name: 'Dự trữ Quốc gia, Xuất cấp Gạo Cứu trợ Khẩn cấp & An ninh Lương thực',
    sector: 'state_reserve',
    sectorNameVi: 'Dự trữ Nhà nước & An ninh Vật tư',
    primaryKeyword: 'dự trữ quốc gia',
    synonyms: [
      'tổng cục dự trữ nhà nước',
      'dtqg',
      'kho dự trữ quốc gia',
      'xuất cấp gạo cứu trợ thiên tai',
      'gạo dự trữ quốc gia',
      'vật tư cứu nạn cứu hộ',
      'phao cứu sinh dự trữ',
      'an ninh lương thực quốc gia',
      'bảo quản hàng dự trữ công nghệ cao'
    ],
    contextRules: {
      mustIncludeAny: ['dự trữ', 'cứu trợ', 'an ninh lương thực', 'tổng cục dự trữ', 'thiên tai'],
      boostWeight: 2.1,
      targetAgencies: ['Tổng cục Dự trữ Nhà nước - Bộ Tài chính', 'Cục Dự trữ Nhà nước khu vực', 'UBND các địa phương bị thiên tai'],
      targetRegulations: ['Luật Dự trữ Quốc gia 2012', 'Quyết định xuất cấp hàng dự trữ của Thủ tướng Chính phủ'],
      description: 'Chủ động xuất cấp kịp thời lương thực, vật tư y tế và trang thiết bị cứu hộ cứu nạn cho đồng bào vùng thiên tai, lũ lụt, bão lũ.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-state-reserve-petroleum-strategic-commodities',
    name: 'Dự trữ Xăng dầu Quốc gia & Vật tư Chiến lược Năng lượng',
    sector: 'state_reserve',
    sectorNameVi: 'Dự trữ Nhà nước & An ninh Vật tư',
    primaryKeyword: 'dự trữ xăng dầu quốc gia',
    synonyms: [
      'kho dự trữ xăng dầu',
      'mặt hàng dự trữ chiến lược',
      'an ninh năng lượng quốc gia',
      'mua tăng dự trữ nhà nước',
      'dự trữ vật tư quốc phòng an ninh',
      'đề án nâng cao năng lực dự trữ quốc gia'
    ],
    contextRules: {
      mustIncludeAny: ['dự trữ xăng dầu', 'an ninh năng lượng', 'mặt hàng chiến lược', 'dự trữ nhà nước'],
      boostWeight: 2.2,
      targetAgencies: ['Tổng cục Dự trữ Nhà nước', 'Bộ Công Thương', 'Bộ Tài chính'],
      description: 'Nâng cao tiềm lực dự trữ xăng dầu và các mặt hàng năng lượng thiết yếu nhằm đối phó với các cú sốc địa chính trị toàn cầu.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },

  // =========================================================================
  // 13. TÀI CHÍNH XANH, ESG & THỊ TRƯỜNG CARBON (GREEN FINANCE)
  // =========================================================================
  {
    id: 'grp-green-finance-carbon-ets-market',
    name: 'Sàn Giao dịch Tín chỉ Carbon Quốc gia (ETS), Hạn ngạch Phát thải & Thuế Carbon',
    sector: 'green_finance',
    sectorNameVi: 'Tài chính Xanh, ESG & Thị trường Carbon',
    primaryKeyword: 'tín chỉ carbon',
    synonyms: [
      'sàn giao dịch carbon',
      'thị trường carbon việt nam',
      'sàn carbon quốc gia',
      'hạn ngạch phát thải khí nhà kính ets',
      'thuế carbon biên giới cbam',
      'thương mại hóa tín chỉ carbon rừng',
      'sở giao dịch hạn ngạch carbon',
      'chuyển nhượng tín chỉ carbon quốc tế itmo'
    ],
    contextRules: {
      mustIncludeAny: ['carbon', 'tín chỉ carbon', 'hạn ngạch phát thải', 'sàn carbon', 'ets', 'khí nhà kính'],
      boostWeight: 2.8,
      targetAgencies: ['Bộ Tài chính', 'Bộ Tài nguyên và Môi trường', 'Sở GDCK Hà Nội (HNX)', 'UBCKNN'],
      targetRegulations: ['Đề án thành lập và phát triển thị trường carbon tại Việt Nam (Quyết định 01/2022/QĐ-TTg)'],
      description: 'Vận hành thử nghiệm sàn giao dịch tín chỉ carbon và hạn ngạch phát thải khí nhà kính quốc gia, chuẩn bị kết nối thị trường thế giới.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-green-finance-taxonomy-green-bonds',
    name: 'Danh mục Phân loại Xanh (Vietnam Green Taxonomy), Trái phiếu Xanh & Cam kết Net Zero 2050',
    sector: 'green_finance',
    sectorNameVi: 'Tài chính Xanh, ESG & Thị trường Carbon',
    primaryKeyword: 'trái phiếu xanh',
    synonyms: [
      'danh mục phân loại xanh',
      'vietnam green taxonomy',
      'tiêu chuẩn dự án xanh',
      'green bonds',
      'tín dụng xanh',
      'báo cáo esg bắt buộc',
      'net zero 2050',
      'chuyển dịch năng lượng công bằng jetp',
      'quỹ tài chính khí hậu'
    ],
    contextRules: {
      mustIncludeAny: ['trái phiếu xanh', 'green taxonomy', 'phân loại xanh', 'esg', 'net zero', 'tín dụng xanh'],
      boostWeight: 2.6,
      targetAgencies: ['Bộ Tài chính', 'Ngân hàng Nhà nước', 'Bộ Tài nguyên và Môi trường'],
      targetRegulations: ['Quy định Danh mục phân loại xanh quốc gia', 'Cam kết Tuyên bố JETP'],
      description: 'Ban hành khung tiêu chí phân loại xanh quốc gia chuẩn mực quốc tế để mở đường phát hành trái phiếu xanh quy mô lớn thu hút dòng vốn quốc tế.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },

  // =========================================================================
  // 14. TÀI SẢN SỐ, FINTECH & CHUYỂN ĐỔI SỐ NGÀNH (FINTECH & DIGITAL)
  // =========================================================================
  {
    id: 'grp-fintech-digital-crypto-vasp-framework',
    name: 'Khung Pháp lý Quản lý Tài sản Ảo / Tiền Mã hóa (Crypto), VASP & Phòng chống Rửa tiền',
    sector: 'fintech_digital',
    sectorNameVi: 'Tài sản số, FinTech & Chuyển đổi số Ngành',
    primaryKeyword: 'tài sản số',
    synonyms: [
      'tài sản ảo',
      'tiền mã hóa',
      'crypto',
      'khung pháp lý tài sản ảo',
      'nhà cung cấp dịch vụ tài sản ảo vasp',
      'phòng chống rửa tiền crypto fatf',
      'nghị quyết quản lý tài sản số',
      'tài sản mã hóa rwa real world assets',
      'sàn giao dịch tiền mã hóa có cấp phép',
      'khắc phục khuyến nghị fatf grey list'
    ],
    contextRules: {
      mustIncludeAny: ['tài sản số', 'tài sản ảo', 'crypto', 'tiền mã hóa', 'vasp', 'fatf', 'blockchain'],
      boostWeight: 2.8,
      targetAgencies: ['Cục CNTT & Chuyển đổi số Tài chính - Bộ Tài chính', 'Ngân hàng Nhà nước', 'Bộ Tư pháp', 'Cơ quan Phòng chống Rửa tiền'],
      targetRegulations: ['Kế hoạch hành động quốc gia phòng, chống rửa tiền, tài trợ khủng bố (Khuyến nghị FATF)'],
      description: 'Xây dựng hành lang pháp lý thí điểm quản lý và thu thuế đối với tài sản ảo, giám sát các nhà cung cấp VASP theo khuyến nghị FATF.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-fintech-sandbox-open-banking',
    name: 'Cơ chế Thử nghiệm FinTech (Sandbox), Open Banking & AI Định danh Tài chính',
    sector: 'fintech_digital',
    sectorNameVi: 'Tài sản số, FinTech & Chuyển đổi số Ngành',
    primaryKeyword: 'sandbox fintech',
    synonyms: [
      'cơ chế thử nghiệm có kiểm soát',
      'open banking',
      'ngân hàng mở',
      'trung gian thanh toán số',
      'chấm điểm tín dụng bằng ai',
      'định danh điện tử tài chính qua vneid',
      'bảo mật dữ liệu tài chính số',
      'fintech việt nam 2026'
    ],
    contextRules: {
      mustIncludeAny: ['sandbox', 'fintech', 'open banking', 'thử nghiệm có kiểm soát', 'công nghệ tài chính'],
      boostWeight: 2.4,
      targetAgencies: ['Ngân hàng Nhà nước', 'Bộ Tài chính', 'Bộ Thông tin và Truyền thông'],
      targetRegulations: ['Nghị định quy định về cơ chế thử nghiệm có kiểm soát trong lĩnh vực ngân hàng, tài chính'],
      description: 'Khuyến khích đổi mới sáng tạo tài chính số an toàn thông qua sandbox, bảo vệ quyền riêng tư dữ liệu người dùng.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-fintech-national-financial-data-cloud',
    name: 'Trung tâm Dữ liệu Tài chính Quốc gia & Ứng dụng AI/BigData Toàn diện',
    sector: 'fintech_digital',
    sectorNameVi: 'Tài sản số, FinTech & Chuyển đổi số Ngành',
    primaryKeyword: 'chuyển đổi số ngành tài chính',
    synonyms: [
      'trung tâm dữ liệu quốc gia về tài chính',
      'big data ngành tài chính',
      'trí tuệ nhân tạo ai trong kiểm toán tài chính',
      'cloud tài chính chính phủ',
      'nền tảng chia sẻ dữ liệu liên ngành',
      'an toàn an ninh mạng tài chính',
      'trợ lý ảo ai phục vụ người dân và doanh nghiệp'
    ],
    contextRules: {
      mustIncludeAny: ['chuyển đổi số', 'dữ liệu tài chính', 'trung tâm dữ liệu', 'ai tài chính', 'bộ tài chính số'],
      boostWeight: 2.3,
      targetAgencies: ['Cục CNTT & Chuyển đổi số Tài chính', 'Văn phòng Bộ Tài chính'],
      description: 'Xây dựng hạ tầng dữ liệu số đồng bộ liên thông giữa Thuế, Hải quan, Kho bạc, Chứng khoán và Bảo hiểm.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },

  // =========================================================================
  // 15. KINH TẾ VĨ MÔ & ĐỘNG LỰC TĂNG TRƯỞNG 2 CON SỐ (MACRO GROWTH)
  // =========================================================================
  {
    id: 'grp-macro-double-digit-growth-2026-2030',
    name: 'Kịch bản Tăng trưởng 2 con số (Double-Digit), Kế hoạch 5 năm (2026-2030) & Năng suất TFP',
    sector: 'macro_growth',
    sectorNameVi: 'Kinh tế Vĩ mô & Động lực Tăng trưởng 2 con số',
    primaryKeyword: 'tăng trưởng kinh tế',
    synonyms: [
      'tăng trưởng 2 con số',
      'tăng trưởng hai con số',
      'kế hoạch 5 năm 2026-2030',
      'kịch bản tăng trưởng 8-10%',
      'động lực tăng trưởng mới',
      'năng suất nhân tố tổng hợp tfp',
      'kỷ nguyên vươn mình của dân tộc',
      'kinh tế số',
      'kinh tế tuần hoàn',
      'vĩ mô việt nam',
      'gdp việt nam 2026',
      'quy mô nền kinh tế'
    ],
    contextRules: {
      mustIncludeAny: ['tăng trưởng', 'gdp', 'kế hoạch 5 năm', 'vĩ mô', 'kinh tế', 'tfp', 'kỷ nguyên vươn mình'],
      boostWeight: 2.8,
      targetAgencies: ['Viện Chiến lược & Chính sách Tài chính', 'Bộ Kế hoạch và Đầu tư', 'Chính phủ', 'Quốc hội'],
      targetRegulations: ['Nghị quyết Đại hội Đảng XIV', 'Kế hoạch phát triển kinh tế - xã hội 5 năm 2026-2030'],
      description: 'Nghiên cứu tham mưu các giải pháp tài chính - ngân sách đột phá nhằm hiện thực hóa mục tiêu tăng trưởng kinh tế nhanh và bền vững.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-macro-gold-market-decree-24-reform',
    name: 'Sửa đổi Toàn diện Nghị định 24/2012/NĐ-CP, Bỏ Độc quyền SJC & Sàn Vàng Quốc gia',
    sector: 'macro_growth',
    sectorNameVi: 'Kinh tế Vĩ mô & Động lực Tăng trưởng 2 con số',
    primaryKeyword: 'quản lý thị trường vàng',
    synonyms: [
      'sửa đổi nghị định 24',
      'nghị định 24/2012/nđ-cp',
      'bỏ độc quyền vàng miếng sjc',
      'thành lập sàn giao dịch vàng quốc gia',
      'chênh lệch giá vàng trong nước và thế giới',
      'hóa đơn điện tử mua bán vàng',
      'thanh tra doanh nghiệp kinh doanh vàng',
      'vàng nhẫn trơn',
      'đấu thầu vàng miếng'
    ],
    contextRules: {
      mustIncludeAny: ['vàng', 'nghị định 24', 'sjc', 'sàn vàng', 'thị trường vàng', 'vàng miếng'],
      boostWeight: 2.7,
      targetAgencies: ['Ngân hàng Nhà nước', 'Bộ Tài chính', 'Cơ quan Thanh tra Giám sát Ngân hàng', 'Bộ Công an'],
      targetRegulations: ['Nghị định sửa đổi Nghị định 24/2012/NĐ-CP về quản lý hoạt động kinh doanh vàng'],
      description: 'Cải cách căn bản thể chế quản lý thị trường vàng, xóa bỏ thế độc quyền, liên thông giá trong nước với quốc tế và hóa đơn minh bạch.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-macro-fiscal-monetary-policy-fx',
    name: 'Phối hợp Chính sách Tài khóa - Tiền tệ, Tỷ giá USD/VND & Dự trữ Ngoại hối',
    sector: 'macro_growth',
    sectorNameVi: 'Kinh tế Vĩ mô & Động lực Tăng trưởng 2 con số',
    primaryKeyword: 'chính sách tài khóa',
    synonyms: [
      'chính sách tài khóa mở rộng hợp lý',
      'phối hợp chính sách tài khóa và tiền tệ',
      'tỷ giá usd/vnd',
      'dự trữ ngoại hối nhà nước',
      'lãi suất điều hành',
      'áp lực tỷ giá',
      'bơm hút thanh khoản liên ngân hàng',
      'ổn định kinh tế vĩ mô'
    ],
    contextRules: {
      mustIncludeAny: ['tài khóa', 'tiền tệ', 'tỷ giá', 'dự trữ ngoại hối', 'lãi suất', 'vĩ mô'],
      boostWeight: 2.5,
      targetAgencies: ['Bộ Tài chính', 'Ngân hàng Nhà nước', 'Hội đồng Tư vấn Chính sách Tài chính - Tiền tệ Quốc gia'],
      description: 'Bảo đảm sự phối hợp nhịp nhàng giữa chính sách tài khóa mở rộng có trọng tâm với chính sách tiền tệ chủ động, linh hoạt.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },

  // =========================================================================
  // 16. THỂ CHẾ, PHÁP CHẾ & CẢI CÁCH HÀNH CHÍNH (POLICY & GOVERNANCE)
  // =========================================================================
  {
    id: 'grp-policy-institutional-breakthrough-res18',
    name: 'Đột phá Thể chế, Tinh gọn Bộ máy (Nghị quyết 18-NQ/TW) & Một Luật sửa Nhiều Luật',
    sector: 'policy',
    sectorNameVi: 'Thể chế, Pháp chế & Cải cách Hành chính',
    primaryKeyword: 'đột phá thể chế',
    synonyms: [
      'cải cách thể chế',
      'tháo gỡ điểm nghẽn pháp lý',
      'khơi thông nguồn lực phát triển',
      'tinh gọn tổ chức bộ máy',
      'nghị quyết 18-nq/tw',
      'sáp nhập bộ ngành tài chính 2026',
      'một luật sửa nhiều luật ngành tài chính',
      'phân cấp phân quyền triệt để',
      'cắt giảm 30% thủ tục hành chính',
      'cởi trói cơ chế'
    ],
    contextRules: {
      mustIncludeAny: ['thể chế', 'điểm nghẽn', 'nghị quyết 18', 'tinh gọn', 'phân cấp', 'sáp nhập', 'thủ tục hành chính'],
      boostWeight: 2.9,
      targetAgencies: ['Vụ Pháp chế - Bộ Tài chính', 'Văn phòng Chính phủ', 'Ủy ban Pháp luật Quốc hội', 'Bộ Nội vụ'],
      targetRegulations: ['Nghị quyết số 18-NQ/TW của Ban Chấp hành Trung ương', 'Luật sửa đổi, bổ sung một số điều của các Luật trong lĩnh vực tài chính, kế hoạch'],
      description: 'Quán triệt tư tưởng chỉ đạo coi đột phá thể chế là động lực then chốt, tinh gọn bộ máy hiệu năng, hiệu lực, phục vụ người dân và doanh nghiệp.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  },
  {
    id: 'grp-policy-integrity-civil-service-protection',
    name: 'Bảo vệ Cán bộ Dám nghĩ Dám làm (NĐ 73) & Kỷ luật Kỷ cương Công vụ Tài chính',
    sector: 'policy',
    sectorNameVi: 'Thể chế, Pháp chế & Cải cách Hành chính',
    primaryKeyword: 'bảo vệ cán bộ dám nghĩ dám làm',
    synonyms: [
      'nghị định 73/2023/nđ-cp',
      'khuyến khích cán bộ năng động sáng tạo',
      'khắc phục tình trạng đùn đẩy sợ sai',
      'kỷ luật kỷ cương công vụ',
      'liêm chính ngành tài chính',
      'chống tiêu cực tham nhũng vặt',
      'công khai minh bạch chính sách tài khóa'
    ],
    contextRules: {
      mustIncludeAny: ['cán bộ', 'dám nghĩ dám làm', 'nghị định 73', 'công vụ', 'kỷ cương', 'sợ sai'],
      boostWeight: 2.4,
      targetAgencies: ['Thanh tra Bộ Tài chính', 'Vụ Tổ chức Cán bộ - Bộ Tài chính', 'Đảng ủy Bộ Tài chính'],
      targetRegulations: ['Nghị định số 73/2023/NĐ-CP về khuyến khích, bảo vệ cán bộ năng động, sáng tạo, dám nghĩ, dám làm, dám chịu trách nhiệm'],
      description: 'Tạo hành lang tâm lý và pháp lý vững chắc bảo vệ cán bộ dám đột phá vì lợi ích chung, xóa bỏ triệt để tâm lý đùn đẩy né tránh trách nhiệm.'
    },
    isActive: true,
    isBuiltIn: true,
    updatedAt: '2026-08-31T00:00:00.000Z'
  }
];
