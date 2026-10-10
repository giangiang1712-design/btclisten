// ============================================================================
// DANH MỤC 30 NGUỒN BÁO CHÍ TRỌNG ĐIỂM QUỐC GIA & NGÀNH TÀI CHÍNH
// Tuyển chọn 30 cơ quan báo chí - truyền thông uy tín cao nhất, liên tục cập nhật
// phục vụ giám sát toàn diện thông tin Bộ Tài chính, chính sách vĩ mô, thuế, hải quan,
// kho bạc, đầu tư công và thị trường tài chính - chứng khoán - doanh nghiệp.
// ============================================================================

export interface OfficialSourceDefinition {
  id: string;
  name: string;
  shortName: string;
  domain: string;
  tier: 'tier1' | 'tier2' | 'tier3';
  tierLabel: string;
  category: 'mof_agencies' | 'economic_press' | 'national_press' | 'industry_specialized' | 'regional_press';
  categoryLabelVi: string;
  defaultSector: string;
  rssUrl?: string;
  categoryUrls?: string[];
  authorityWeight: number; // 2.0 (Tier 1 Cơ quan NN/Bộ), 1.6 (Tier 1 Báo chí chủ lực), 1.3 (Tier 2 Chuyên ngành)
  description: string;
  trafficPriority: 'high' | 'medium' | 'standard'; // Priority queue classification
  trafficRank: number; // 1-30 traffic ordering
}

export const CORE_30_SOURCES: OfficialSourceDefinition[] = [
  // ============================================================================
  // NHÓM 1: CƠ QUAN QUẢN LÝ NHÀ NƯỚC & BÁO CHÍ BỘ TÀI CHÍNH (TIER 1 CỐT LÕI)
  // ============================================================================
  {
    id: 'tbtcvn',
    trafficPriority: 'high',
    trafficRank: 9,
    name: 'Thời báo Tài chính Việt Nam',
    shortName: 'Thời báo Tài chính',
    domain: 'thoibaotaichinhvietnam.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Cơ quan Ngôn luận BTC',
    category: 'mof_agencies',
    categoryLabelVi: 'Báo Ngành Tài chính',
    defaultSector: 'tax',
    rssUrl: 'https://thoibaotaichinhvietnam.vn/tai-chinh',
    categoryUrls: [
      'https://thoibaotaichinhvietnam.vn/tai-chinh',
      'https://thoibaotaichinhvietnam.vn/kinh-te-nganh',
      'https://thoibaotaichinhvietnam.vn/thue',
      'https://thoibaotaichinhvietnam.vn/chung-khoan',
      'https://thoibaotaichinhvietnam.vn/tien-te-bao-hiem'
    ],
    authorityWeight: 2.0,
    description: 'Cơ quan ngôn luận của Bộ Tài chính, truyền thông chính sách thuế, hải quan, kho bạc, nợ công và TTCK.',
  },
  {
    id: 'mof_gov',
    trafficPriority: 'medium',
    trafficRank: 20,
    name: 'Cổng TTĐT Bộ Tài chính',
    shortName: 'Bộ Tài chính',
    domain: 'mof.gov.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Cơ quan Quản lý BTC',
    category: 'mof_agencies',
    categoryLabelVi: 'Cơ quan Quản lý Nhà nước',
    defaultSector: 'policy',
    categoryUrls: [
      'https://mof.gov.vn',
      'https://mof.gov.vn/webcenter/portal/btc/r/m/ttsk/tin-tuc-su-kien'
    ],
    authorityWeight: 2.0,
    description: 'Chỉ đạo điều hành vĩ mô, thông cáo báo chí Lãnh đạo Bộ, văn bản quy phạm pháp luật tài chính.',
  },
  {
    id: 'tapchitaichinh',
    trafficPriority: 'medium',
    trafficRank: 16,
    name: 'Tạp chí Tài chính',
    shortName: 'Tạp chí Tài chính',
    domain: 'tapchitaichinh.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Cơ quan Nghiên cứu BTC',
    category: 'mof_agencies',
    categoryLabelVi: 'Nghiên cứu Thể chế & Tài khóa',
    defaultSector: 'treasury_budget',
    categoryUrls: [
      'https://tapchitaichinh.vn/tai-chinh-kinh-doanh.html',
      'https://tapchitaichinh.vn/chinh-sach.html',
      'https://tapchitaichinh.vn/su-kien-noi-bat.html'
    ],
    authorityWeight: 1.9,
    description: 'Cơ quan lý luận & nghiệp vụ của Bộ Tài chính, phân tích vĩ mô, ngân sách nhà nước, quản lý công nợ.',
  },
  {
    id: 'baochinhphu',
    trafficPriority: 'high',
    trafficRank: 10,
    name: 'Báo điện tử Chính phủ',
    shortName: 'Báo Chính phủ',
    domain: 'baochinhphu.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Cơ quan Truyền thông Chính phủ',
    category: 'mof_agencies',
    categoryLabelVi: 'Chỉ đạo Điều hành Quốc gia',
    defaultSector: 'policy',
    categoryUrls: [
      'https://baochinhphu.vn/kinh-te.htm',
      'https://baochinhphu.vn/chi-dao-dieu-hanh.htm',
      'https://baochinhphu.vn/doanh-nghiep.htm'
    ],
    authorityWeight: 1.95,
    description: 'Thông tin chỉ đạo điều hành kinh tế vĩ mô của Chính phủ, Thủ tướng Chính phủ, Nghị quyết, Nghị định về tài chính - ngân sách.',
  },

  // ============================================================================
  // NHÓM 2: BÁO CHÍ KINH TẾ - ĐẦU TƯ - TÀI CHÍNH - CHỨNG KHOÁN CHUYÊN SÂU (11)
  // ============================================================================
  {
    id: 'cafef',
    trafficPriority: 'high',
    trafficRank: 1,
    name: 'CafeF',
    shortName: 'CafeF',
    domain: 'cafef.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Kênh Tin Tài chính Đầu ngành',
    category: 'economic_press',
    categoryLabelVi: 'Tài chính - Chứng khoán',
    defaultSector: 'securities',
    rssUrl: 'https://cafef.vn/tai-chinh-ngan-hang.rss',
    categoryUrls: [
      'https://cafef.vn/tai-chinh-ngan-hang.rss',
      'https://cafef.vn/thi-truong-chung-khoan.rss',
      'https://cafef.vn/kinh-te-vi-mo.rss'
    ],
    authorityWeight: 1.75,
    description: 'Cổng thông tin kinh tế, tài chính, thị trường chứng khoán, ngân hàng và dữ liệu doanh nghiệp hàng đầu.',
  },
  {
    id: 'cafebiz',
    trafficPriority: 'medium',
    trafficRank: 19,
    name: 'CafeBiz',
    shortName: 'CafeBiz',
    domain: 'cafebiz.vn',
    tier: 'tier2',
    tierLabel: 'Tier 2 - Kinh doanh & Doanh nghiệp',
    category: 'economic_press',
    categoryLabelVi: 'Kinh doanh & Vĩ mô',
    defaultSector: 'corporate',
    categoryUrls: [
      'https://cafebiz.vn/tai-chinh.chn',
      'https://cafebiz.vn/vi-mo.chn',
      'https://cafebiz.vn/kinh-doanh.chn'
    ],
    authorityWeight: 1.5,
    description: 'Tin tức kinh doanh, xu hướng thị trường, dòng tiền doanh nghiệp và chính sách kinh tế vi mô - vĩ mô.',
  },
  {
    id: 'baodautu',
    trafficPriority: 'high',
    trafficRank: 7,
    name: 'Báo Đầu tư',
    shortName: 'Báo Đầu tư',
    domain: 'baodautu.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Kinh tế Đầu tư Quốc gia',
    category: 'economic_press',
    categoryLabelVi: 'Đầu tư & Vĩ mô',
    defaultSector: 'public_investment',
    rssUrl: 'https://baodautu.vn/rss/kinh-te.rss',
    categoryUrls: [
      'https://baodautu.vn/rss/kinh-te.rss',
      'https://baodautu.vn/dau-tu-tai-chinh-d6/',
      'https://baodautu.vn/thoi-su-dau-tu-d1/',
      'https://baodautu.vn/dau-tu-cong-d12/'
    ],
    authorityWeight: 1.8,
    description: 'Cơ quan của Bộ Kế hoạch & Đầu tư (nay là các chính sách liên bộ), chuyên sâu giải ngân đầu tư công, FDI và kinh tế vĩ mô.',
  },
  {
    id: 'vneconomy',
    trafficPriority: 'medium',
    trafficRank: 11,
    name: 'VnEconomy - Thời báo Kinh tế VN',
    shortName: 'VnEconomy',
    domain: 'vneconomy.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Thời báo Kinh tế',
    category: 'economic_press',
    categoryLabelVi: 'Kinh tế & Tài chính',
    defaultSector: 'macro',
    categoryUrls: [
      'https://vneconomy.vn/tai-chinh.htm',
      'https://vneconomy.vn/chung-khoan.htm',
      'https://vneconomy.vn/kinh-te-vi-mo.htm'
    ],
    authorityWeight: 1.8,
    description: 'Tạp chí Kinh tế Việt Nam, phân tích chính sách tài khóa, tiền tệ, cải cách thuế và bức tranh kinh tế vĩ mô.',
  },
  {
    id: 'vietnambiz',
    trafficPriority: 'medium',
    trafficRank: 12,
    name: 'Vietnambiz',
    shortName: 'Vietnambiz',
    domain: 'vietnambiz.vn',
    tier: 'tier2',
    tierLabel: 'Tier 2 - Báo chí Tài chính',
    category: 'economic_press',
    categoryLabelVi: 'Tài chính - Ngân hàng',
    defaultSector: 'banking',
    rssUrl: 'https://vietnambiz.vn/rss/tai-chinh.rss',
    categoryUrls: [
      'https://vietnambiz.vn/rss/tai-chinh.rss',
      'https://vietnambiz.vn/rss/chung-khoan.rss',
      'https://vietnambiz.vn/rss/vi-mo.rss'
    ],
    authorityWeight: 1.5,
    description: 'Thông tin chuyên sâu về tài chính ngân hàng, trái phiếu doanh nghiệp, lãi suất và diễn biến chứng khoán.',
  },
  {
    id: 'tinnhanhchungkhoan',
    trafficPriority: 'high',
    trafficRank: 8,
    name: 'Đầu tư Chứng khoán / Tin nhanh Chứng khoán',
    shortName: 'Tin nhanh Chứng khoán',
    domain: 'tinnhanhchungkhoan.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Chuyên trang Thị trường Vốn',
    category: 'economic_press',
    categoryLabelVi: 'Thị trường Vốn & Cổ phiếu',
    defaultSector: 'securities',
    categoryUrls: [
      'https://www.tinnhanhchungkhoan.vn/tai-chinh/',
      'https://www.tinnhanhchungkhoan.vn/chung-khoan/',
      'https://www.tinnhanhchungkhoan.vn/doanh-nghiep/'
    ],
    authorityWeight: 1.7,
    description: 'Chuyên trang thị trường chứng khoán của Báo Đầu tư, cơ sở giám sát biến động vốn, UBCKNN và cổ phiếu niêm yết.',
  },
  {
    id: 'vietnamfinance',
    trafficPriority: 'medium',
    trafficRank: 17,
    name: 'VietnamFinance',
    shortName: 'VietnamFinance',
    domain: 'vietnamfinance.vn',
    tier: 'tier2',
    tierLabel: 'Tier 2 - Tạp chí Đầu tư Tài chính',
    category: 'economic_press',
    categoryLabelVi: 'Tài chính & Đầu tư',
    defaultSector: 'corporate',
    categoryUrls: [
      'https://vietnamfinance.vn/tai-chinh.html',
      'https://vietnamfinance.vn/dau-tu.html'
    ],
    authorityWeight: 1.5,
    description: 'Tạp chí Đầu tư Tài chính Việt Nam, chuyên sâu tài chính dự án, nợ xấu, trái phiếu và thị trường tiền tệ.',
  },
  {
    id: 'taichinhdoanhnghiep',
    trafficPriority: 'standard',
    trafficRank: 28,
    name: 'Tạp chí Tài chính Doanh nghiệp',
    shortName: 'Tài chính Doanh nghiệp',
    domain: 'taichinhdoanhnghiep.net.vn',
    tier: 'tier2',
    tierLabel: 'Tier 2 - Quản trị Tài chính DN',
    category: 'economic_press',
    categoryLabelVi: 'Tài chính Công ty & Thuế',
    defaultSector: 'tax',
    categoryUrls: [
      'https://taichinhdoanhnghiep.net.vn/tai-chinh',
      'https://taichinhdoanhnghiep.net.vn'
    ],
    authorityWeight: 1.45,
    description: 'Cơ quan của Hội Tư vấn Thuế & Tài chính DN, phản ánh quản lý hóa đơn, chính sách thuế TNDN, quyết toán tài chính.',
  },
  {
    id: 'nguoiquansat',
    trafficPriority: 'medium',
    trafficRank: 18,
    name: 'Người Quan Sát',
    shortName: 'Người Quan Sát',
    domain: 'nguoiquansat.vn',
    tier: 'tier2',
    tierLabel: 'Tier 2 - Phân tích Thị trường',
    category: 'economic_press',
    categoryLabelVi: 'Thị trường & Doanh nghiệp',
    defaultSector: 'securities',
    categoryUrls: [
      'https://nguoiquansat.vn/tai-chinh',
      'https://nguoiquansat.vn'
    ],
    authorityWeight: 1.45,
    description: 'Kênh phân tích chuyên sâu báo cáo tài chính doanh nghiệp, dòng tiền lớn và chính sách tiền tệ tài khóa.',
  },
  {
    id: 'markettimes',
    trafficPriority: 'standard',
    trafficRank: 29,
    name: 'MarketTimes - Nhịp sống Thị trường',
    shortName: 'MarketTimes',
    domain: 'markettimes.vn',
    tier: 'tier2',
    tierLabel: 'Tier 2 - Nhịp sống Thị trường',
    category: 'economic_press',
    categoryLabelVi: 'Thị trường & Vĩ mô',
    defaultSector: 'market',
    categoryUrls: [
      'https://markettimes.vn/tai-chinh',
      'https://markettimes.vn'
    ],
    authorityWeight: 1.45,
    description: 'Tạp chí điện tử Nhịp sống Thị trường, cập nhật giá vàng, tỷ giá, thị trường bất động sản và thanh khoản ngân hàng.',
  },
  {
    id: 'diendandoanhnghiep',
    trafficPriority: 'standard',
    trafficRank: 27,
    name: 'Diễn đàn Doanh nghiệp (VCCI)',
    shortName: 'Diễn đàn Doanh nghiệp',
    domain: 'diendandoanhnghiep.com.vn',
    tier: 'tier2',
    tierLabel: 'Tier 2 - Cơ quan Ngôn luận VCCI',
    category: 'economic_press',
    categoryLabelVi: 'Phản biện Chính sách Thuế & DN',
    defaultSector: 'tax',
    categoryUrls: [
      'https://diendandoanhnghiep.com.vn/tai-chinh/',
      'https://diendandoanhnghiep.com.vn/kinh-te/'
    ],
    authorityWeight: 1.6,
    description: 'Cơ quan của Liên đoàn Thương mại và Công nghiệp Việt Nam (VCCI), đại diện tiếng nói cộng đồng DN phản biện chính sách thuế, hải quan.',
  },

  // ============================================================================
  // NHÓM 3: CƠ QUAN BÁO CHÍ QUỐC GIA & TRUYỀN THÔNG ĐA PHƯƠNG TIỆN CHỦ LỰC (15)
  // ============================================================================
  {
    id: 'vnexpress',
    trafficPriority: 'high',
    trafficRank: 2,
    name: 'VnExpress',
    shortName: 'VnExpress',
    domain: 'vnexpress.net',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Báo Điện tử Số 1 VN',
    category: 'national_press',
    categoryLabelVi: 'Báo chí Toàn cảnh Quốc gia',
    defaultSector: 'macro',
    rssUrl: 'https://vnexpress.net/rss/kinh-doanh.rss',
    categoryUrls: [
      'https://vnexpress.net/rss/kinh-doanh.rss',
      'https://vnexpress.net/rss/thoi-su.rss',
      'https://vnexpress.net/kinh-doanh'
    ],
    authorityWeight: 1.85,
    description: 'Báo điện tử có lượng độc giả lớn nhất Việt Nam, ban Kinh doanh cập nhật nhanh nhất về biến động tài chính, thuế, ngân sách.',
  },
  {
    id: 'tuoitre',
    trafficPriority: 'high',
    trafficRank: 3,
    name: 'Tuổi Trẻ',
    shortName: 'Tuổi Trẻ',
    domain: 'tuoitre.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Báo Tuổi Trẻ',
    category: 'national_press',
    categoryLabelVi: 'Báo chí Quốc gia',
    defaultSector: 'macro',
    rssUrl: 'https://tuoitre.vn/rss/kinh-doanh.rss',
    categoryUrls: [
      'https://tuoitre.vn/rss/kinh-doanh.rss',
      'https://tuoitre.vn/kinh-doanh.htm'
    ],
    authorityWeight: 1.8,
    description: 'Cơ quan báo chí lớn hàng đầu cả nước, tuyến bài sâu sắc về thuế thu nhập cá nhân, giá cả sinh hoạt, hỗ trợ người dân và DN.',
  },
  {
    id: 'thanhnien',
    trafficPriority: 'high',
    trafficRank: 4,
    name: 'Thanh Niên',
    shortName: 'Thanh Niên',
    domain: 'thanhnien.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Báo Thanh Niên',
    category: 'national_press',
    categoryLabelVi: 'Báo chí Quốc gia',
    defaultSector: 'macro',
    rssUrl: 'https://thanhnien.vn/rss/kinh-te.rss',
    categoryUrls: [
      'https://thanhnien.vn/rss/kinh-te.rss',
      'https://thanhnien.vn/kinh-te.htm'
    ],
    authorityWeight: 1.8,
    description: 'Cơ quan báo chí uy tín hàng đầu, chuyên mục Kinh tế phân tích đa chiều về tài chính công, thị trường ngoại tệ và xăng dầu.',
  },
  {
    id: 'dantri',
    trafficPriority: 'high',
    trafficRank: 6,
    name: 'Dân Trí',
    shortName: 'Dân Trí',
    domain: 'dantri.com.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Báo Điện tử Dân Trí',
    category: 'national_press',
    categoryLabelVi: 'Báo chí Quốc gia',
    defaultSector: 'macro',
    rssUrl: 'https://dantri.com.vn/rss/kinh-doanh.rss',
    categoryUrls: [
      'https://dantri.com.vn/rss/kinh-doanh.rss',
      'https://dantri.com.vn/kinh-doanh.htm'
    ],
    authorityWeight: 1.75,
    description: 'Cơ quan của Bộ Lao động - Thương binh & Xã hội, độc giả đông đảo, phản ánh nhanh nhạy về bất động sản, thuế và lãi suất ngân hàng.',
  },
  {
    id: 'vietnamnet',
    trafficPriority: 'high',
    trafficRank: 5,
    name: 'VietNamNet',
    shortName: 'VietNamNet',
    domain: 'vietnamnet.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Báo Điện tử VietNamNet',
    category: 'national_press',
    categoryLabelVi: 'Báo chí Quốc gia',
    defaultSector: 'macro',
    rssUrl: 'https://vietnamnet.vn/rss/kinh-doanh.rss',
    categoryUrls: [
      'https://vietnamnet.vn/rss/kinh-doanh.rss',
      'https://vietnamnet.vn/kinh-doanh'
    ],
    authorityWeight: 1.8,
    description: 'Cơ quan của Bộ Thông tin & Truyền thông, chuyên mục Kinh doanh theo dõi sát sao các đại dự án, chính sách tài khóa và ngân hàng.',
  },
  {
    id: 'laodong',
    trafficPriority: 'medium',
    trafficRank: 13,
    name: 'Báo Lao Động',
    shortName: 'Lao Động',
    domain: 'laodong.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Cơ quan Tổng LĐLĐ VN',
    category: 'national_press',
    categoryLabelVi: 'Ngân sách, Lương & An sinh',
    defaultSector: 'treasury_budget',
    categoryUrls: [
      'https://laodong.vn/kinh-doanh',
      'https://laodong.vn'
    ],
    authorityWeight: 1.8,
    description: 'Tiếng nói người lao động và tổ chức công đoàn, giám sát chặt chẽ chính sách lương thưởng, bảo hiểm, thuế TNCN và ngân sách an sinh.',
  },
  {
    id: 'tienphong',
    trafficPriority: 'medium',
    trafficRank: 14,
    name: 'Báo Tiền Phong',
    shortName: 'Tiền Phong',
    domain: 'tienphong.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Báo Tiền Phong',
    category: 'national_press',
    categoryLabelVi: 'Báo chí Quốc gia',
    defaultSector: 'macro',
    rssUrl: 'https://tienphong.vn/rss/kinh-te-3.rss',
    categoryUrls: [
      'https://tienphong.vn/rss/kinh-te-3.rss',
      'https://tienphong.vn/kinh-te/'
    ],
    authorityWeight: 1.7,
    description: 'Báo điện tử Tiền Phong, chuyên trang Kinh tế - Thị trường cập nhật tin tức đầu tư công, đấu giá tài sản và quản lý tài nguyên.',
  },
  {
    id: 'nld',
    trafficPriority: 'medium',
    trafficRank: 15,
    name: 'Báo Người Lao Động',
    shortName: 'Người Lao Động',
    domain: 'nld.com.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Báo Người Lao Động',
    category: 'national_press',
    categoryLabelVi: 'Báo chí Quốc gia',
    defaultSector: 'market',
    rssUrl: 'https://nld.com.vn/rss/kinh-te.rss',
    categoryUrls: [
      'https://nld.com.vn/rss/kinh-te.rss',
      'https://nld.com.vn/kinh-te.htm'
    ],
    authorityWeight: 1.7,
    description: 'Cơ quan của Liên đoàn Lao động TP.HCM, cập nhật thị trường vàng, ngoại tệ, chính sách giá và bảo vệ người tiêu dùng.',
  },
  {
    id: 'vtv',
    trafficPriority: 'standard',
    trafficRank: 21,
    name: 'Báo điện tử VTV News',
    shortName: 'VTV News',
    domain: 'vtv.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Đài Truyền hình Việt Nam',
    category: 'national_press',
    categoryLabelVi: 'Đài Truyền hình Quốc gia',
    defaultSector: 'macro',
    categoryUrls: [
      'https://vtv.vn/kinh-te.htm',
      'https://vtv.vn'
    ],
    authorityWeight: 1.9,
    description: 'Báo điện tử Đài Truyền hình Quốc gia, trung tâm các bản tin Tài chính Kinh doanh, Dòng chảy tài chính và tiêu điểm vĩ mô.',
  },
  {
    id: 'vov',
    trafficPriority: 'standard',
    trafficRank: 22,
    name: 'Báo điện tử VOV',
    shortName: 'VOV News',
    domain: 'vov.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Đài Tiếng nói Việt Nam',
    category: 'national_press',
    categoryLabelVi: 'Đài Phát thanh Quốc gia',
    defaultSector: 'macro',
    categoryUrls: [
      'https://vov.vn/kinh-te',
      'https://vov.vn'
    ],
    authorityWeight: 1.85,
    description: 'Báo điện tử Đài Tiếng nói Việt Nam, phản ánh kịp thời các nghị định, phiên họp Chính phủ về ngân sách và phát triển kinh tế.',
  },
  {
    id: 'vietnamplus',
    trafficPriority: 'standard',
    trafficRank: 23,
    name: 'VietnamPlus (TTXVN)',
    shortName: 'VietnamPlus',
    domain: 'vietnamplus.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Báo điện tử Quốc gia TTXVN',
    category: 'national_press',
    categoryLabelVi: 'Hãng Thông tấn Quốc gia',
    defaultSector: 'macro',
    rssUrl: 'https://www.vietnamplus.vn/rss/kinhte.rss',
    categoryUrls: [
      'https://www.vietnamplus.vn/rss/kinhte.rss',
      'https://www.vietnamplus.vn'
    ],
    authorityWeight: 1.9,
    description: 'Báo điện tử đối ngoại & quốc gia của Thông tấn xã Việt Nam, nguồn tin chính thống chuẩn mực về dữ liệu kinh tế và hiệp định thương mại.',
  },
  {
    id: 'baotintuc',
    trafficPriority: 'standard',
    trafficRank: 24,
    name: 'Báo Tin Tức (TTXVN)',
    shortName: 'Báo Tin Tức',
    domain: 'baotintuc.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Báo Tin Tức TTXVN',
    category: 'national_press',
    categoryLabelVi: 'Hãng Thông tấn Quốc gia',
    defaultSector: 'macro',
    rssUrl: 'https://baotintuc.vn/rss/kinh-te.rss',
    categoryUrls: [
      'https://baotintuc.vn/rss/kinh-te.rss',
      'https://baotintuc.vn/kinh-te.htm'
    ],
    authorityWeight: 1.85,
    description: 'Kênh thông tin thời sự - chính luận của TTXVN, cập nhật diễn biến các phiên họp điều hành giá, bình ổn thị trường của Bộ Tài chính.',
  },
  {
    id: 'nhandan',
    trafficPriority: 'standard',
    trafficRank: 25,
    name: 'Báo Nhân Dân',
    shortName: 'Báo Nhân Dân',
    domain: 'nhandan.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Tiếng nói Đảng, Nhà nước & Nhân dân',
    category: 'national_press',
    categoryLabelVi: 'Báo chí Cơ quan Trung ương',
    defaultSector: 'policy',
    categoryUrls: [
      'https://nhandan.vn/kinhte',
      'https://nhandan.vn'
    ],
    authorityWeight: 2.0,
    description: 'Cơ quan trung ương của Đảng Cộng sản Việt Nam, tiếng nói của Đảng, Nhà nước và nhân dân về đường lối kinh tế và quản trị tài khóa.',
  },
  {
    id: 'sggp',
    trafficPriority: 'standard',
    trafficRank: 26,
    name: 'Báo Sài Gòn Giải Phóng',
    shortName: 'Sài Gòn Giải Phóng',
    domain: 'sggp.org.vn',
    tier: 'tier1',
    tierLabel: 'Tier 1 - Báo SGGP',
    category: 'national_press',
    categoryLabelVi: 'Kinh tế Đầu tàu TP.HCM',
    defaultSector: 'treasury_budget',
    categoryUrls: [
      'https://www.sggp.org.vn/kinhte',
      'https://www.sggp.org.vn'
    ],
    authorityWeight: 1.75,
    description: 'Tiếng nói của Đảng bộ, Chính quyền và Nhân dân TP.HCM, trọng điểm thu ngân sách lớn nhất cả nước và trung tâm tài chính quốc tế.',
  },
  {
    id: 'znews',
    trafficPriority: 'standard',
    trafficRank: 30,
    name: 'Znews Tri Thức',
    shortName: 'Znews',
    domain: 'znews.vn',
    tier: 'tier2',
    tierLabel: 'Tier 2 - Tạp chí Điện tử Tri Thức',
    category: 'national_press',
    categoryLabelVi: 'Truyền thông Đa phương tiện',
    defaultSector: 'corporate',
    categoryUrls: [
      'https://znews.vn/kinh-doanh-tai-chinh.html',
      'https://znews.vn'
    ],
    authorityWeight: 1.5,
    description: 'Tạp chí điện tử Tri thức, chuyên mục Kinh doanh & Tài chính phân tích trực quan về các thương hiệu lớn, thị trường tiêu dùng và đầu tư.',
  }
];

// Alias for backwards compatibility across existing modules
export const OFFICIAL_150_SOURCES: OfficialSourceDefinition[] = CORE_30_SOURCES;

// Fast Domain Lookup Map
export const OFFICIAL_DOMAIN_MAP = new Map<string, OfficialSourceDefinition>();
CORE_30_SOURCES.forEach((src) => {
  OFFICIAL_DOMAIN_MAP.set(src.domain.toLowerCase(), src);
  const clean = src.domain.toLowerCase().replace(/^www\./, '');
  OFFICIAL_DOMAIN_MAP.set(clean, src);
});

// Helper: Match any article URL to one of the 30 official core sources
export function matchArticleToOfficial150Source(url: string | undefined, sourceName?: string): OfficialSourceDefinition | undefined {
  if (url) {
    try {
      let cleanUrl = url.trim();
      if (!/^https?:\/\//i.test(cleanUrl)) cleanUrl = 'https://' + cleanUrl;
      const parsed = new URL(cleanUrl);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      
      // Direct match
      if (OFFICIAL_DOMAIN_MAP.has(host)) {
        return OFFICIAL_DOMAIN_MAP.get(host);
      }

      // Suffix/Subdomain match
      for (const [dom, def] of OFFICIAL_DOMAIN_MAP.entries()) {
        if (host === dom || host.endsWith('.' + dom)) {
          return def;
        }
      }
    } catch (_) {}
  }

  // Fallback match by sourceName string
  if (sourceName) {
    const lower = sourceName.toLowerCase().trim();
    for (const src of CORE_30_SOURCES) {
      if (
        lower.includes(src.shortName.toLowerCase()) ||
        src.name.toLowerCase().includes(lower) ||
        lower.includes(src.domain.toLowerCase())
      ) {
        return src;
      }
    }
  }

  return undefined;
}
