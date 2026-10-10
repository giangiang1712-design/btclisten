export type TimeRange = '1h' | '2h' | '4h' | '8h' | '24h';

export type SectorType =
  | 'all'
  // --- Khối Trọng tâm Quản lý Nhà nước (Bộ Tài chính - Nghị định 376/2026/NĐ-CP) ---
  | 'tax'                // Thuế & Quản lý thu NSNN (Cục Thuế)
  | 'customs'            // Hải quan & Xuất nhập khẩu (Cục Hải quan)
  | 'bonds'              // Trái phiếu Doanh nghiệp & TPCP (Vụ ĐCTC)
  | 'stocks'             // Chứng khoán & Nâng hạng (UBCKNN)
  | 'treasury_budget'    // Kho bạc & Ngân sách Nhà nước (KBNN, Vụ NSNN)
  | 'public_investment'  // Đầu tư công & Giải ngân vốn NSNN (Vụ Đầu tư & PT Hạ tầng)
  | 'price_management'   // Quản lý Giá & Bình ổn thị trường (Cục Quản lý Giá)
  | 'insurance'          // Bảo hiểm & Giám sát bảo hiểm (Cục QLBH)
  | 'state_economy'      // Doanh nghiệp Nhà nước & SCIC (Cục Phát triển DNNN)
  | 'public_debt'        // Nợ công & Tài chính đối ngoại (Cục QLN)
  | 'public_assets'      // Tài sản công & Đấu giá công sản (Cục QLCS)
  | 'inspection_audit'   // Thanh tra Tài chính & Giám sát kế toán, kiểm toán
  | 'national_reserve'   // Dự trữ Nhà nước (Cục Dự trữ Nhà nước)
  // --- Khối Thẩm quyền Mới sáp nhập theo Nghị định 376/2026/NĐ-CP ---
  | 'bidding_procurement'   // Đấu thầu & PPP (Cục Quản lý đấu thầu)
  | 'foreign_investment_fdi'// Đầu tư nước ngoài FDI & Xúc tiến đầu tư (Cục Đầu tư nước ngoài)
  | 'statistics_macro'      // Thống kê quốc gia, CPI & GDP (Cục Thống kê)
  | 'social_security'       // Bảo hiểm xã hội, BHYT & BHTN (Bảo hiểm xã hội Việt Nam)
  | 'socioeconomic_planning'// Chiến lược, Quy hoạch & Kế hoạch KT-XH (Vụ QL Quy hoạch, Viện CL)
  // --- Khối Thị trường Tài chính & Dòng tiền ---
  | 'banking_credit'     // Ngân hàng, Tín dụng & Lãi suất (NHNN)
  | 'realestate'         // Bất động sản (Tài chính & Pháp lý Đất đai)
  | 'gold'               // Vàng & Kim loại quý (SJC, Đấu thầu vàng)
  | 'forex'              // Tỷ giá & Ngoại tệ (USD/VND, DXY)
  | 'fdi'                // Đầu tư Nước ngoài (FDI & Vốn ngoại)
  | 'crypto'             // Tài sản số & FinTech
  // --- Khối Vĩ mô, Doanh nghiệp & Chính sách ---
  | 'macro'              // Tăng trưởng GDP & Kinh tế vĩ mô
  | 'enterprise'         // Doanh nghiệp tư nhân, Hộ kinh doanh & M&A
  | 'collective_economy' // Kinh tế Tập thể & Hợp tác xã (HTX)
  | 'fintech_digital'    // Tài chính số, Thuế TMĐT & Hóa đơn số
  | 'policy'             // Chính sách, Thể chế & Văn bản pháp quy
  | 'people';            // Lãnh đạo điều hành & Nhân vật thị trường

export const SECTOR_NAMES: Record<string, string> = {
  all: 'Toàn cảnh',
  tax: 'Thuế & Thu NSNN (Cục Thuế)',
  customs: 'Hải quan & XNK (Cục Hải quan)',
  bonds: 'Trái phiếu (TPDN & TPCP)',
  stocks: 'Chứng khoán (UBCK)',
  treasury_budget: 'Kho bạc & Ngân sách (KBNN)',
  public_investment: 'Đầu tư công & Giải ngân',
  price_management: 'Quản lý Giá & Bình ổn',
  insurance: 'Bảo hiểm thương mại',
  state_economy: 'Doanh nghiệp Nhà nước',
  public_debt: 'Nợ công & TC Đối ngoại',
  public_assets: 'Tài sản công',
  inspection_audit: 'Thanh tra, Kế toán, Kiểm toán',
  national_reserve: 'Dự trữ Nhà nước',
  // Lĩnh vực mới theo Nghị định 376/2026/NĐ-CP:
  bidding_procurement: 'Đấu thầu & PPP (Cục QL Đấu thầu)',
  foreign_investment_fdi: 'Đầu tư FDI (Cục ĐT Nước ngoài)',
  statistics_macro: 'Thống kê quốc gia & CPI (Cục Thống kê)',
  social_security: 'BHXH, BHYT & BHTN (BHXH Việt Nam)',
  socioeconomic_planning: 'Quy hoạch & Kế hoạch KT-XH',
  banking_credit: 'Ngân hàng & Tín dụng',
  realestate: 'Bất động sản & Đất đai',
  gold: 'Vàng & Kim loại quý',
  forex: 'Tỷ giá & Ngoại tệ',
  fdi: 'Đầu tư Nước ngoài (FDI)',
  crypto: 'Crypto & Tài sản số',
  macro: 'Tăng trưởng GDP & Vĩ mô',
  enterprise: 'Doanh nghiệp tư nhân & Hộ KD',
  collective_economy: 'Kinh tế Tập thể & HTX',
  fintech_digital: 'Tài chính số & Thuế TMĐT',
  policy: 'Chính sách & Pháp lý',
  people: 'Lãnh đạo & Nhân vật',
};

// ============================================================================
// DANH MỤC 34 ĐƠN VỊ TRỰC THUỘC BỘ TÀI CHÍNH THEO ĐIỀU 3 NGHỊ ĐỊNH 376/2026/NĐ-CP
// ============================================================================
export interface MofAgencyDecree376 {
  id: string;
  name: string;
  shortName: string;
  type: 'administrative' | 'special_agency' | 'public_service';
  sectors: SectorType[];
  keywords: string[];
  leadFunctions: string;
}

export const MOF_34_AGENCIES_DECREE_376: MofAgencyDecree376[] = [
  // --- Khối Vụ Tham mưu Quản lý Nhà nước (1-11) ---
  {
    id: 'vu-nsnn',
    name: 'Vụ Ngân sách nhà nước',
    shortName: 'Vụ NSNN',
    type: 'administrative',
    sectors: ['treasury_budget', 'tax'],
    keywords: ['vụ ngân sách nhà nước', 'vụ nsnn', 'cân đối ngân sách', 'dự toán thu chi ngân sách', 'bội chi nsnn'],
    leadFunctions: 'Chủ trì lập dự toán ngân sách nhà nước, phân bổ ngân sách trung ương, theo dõi cân đối thu chi ngân sách quốc gia.'
  },
  {
    id: 'vu-dtpt',
    name: 'Vụ Đầu tư và Phát triển hạ tầng',
    shortName: 'Vụ Đầu tư',
    type: 'administrative',
    sectors: ['public_investment'],
    keywords: ['vụ đầu tư', 'vụ đầu tư và phát triển hạ tầng', 'kế hoạch vốn đầu tư công', 'đôn đốc giải ngân', 'vốn đầu tư công'],
    leadFunctions: 'Quản lý tài chính các dự án đầu tư công, giải ngân vốn xây dựng cơ bản, phát triển hạ tầng kinh tế kỹ thuật.'
  },
  {
    id: 'vu-i',
    name: 'Vụ Tài chính quốc phòng, an ninh, đặc biệt (Vụ I)',
    shortName: 'Vụ I',
    type: 'administrative',
    sectors: ['treasury_budget', 'policy'],
    keywords: ['vụ tài chính quốc phòng an ninh', 'vụ i bộ tài chính', 'vụ 1', 'ngân sách quốc phòng'],
    leadFunctions: 'Quản lý tài chính, ngân sách nhà nước lĩnh vực quốc phòng, an ninh và nhiệm vụ đặc biệt.'
  },
  {
    id: 'vu-hcsn',
    name: 'Vụ Tài chính hành chính sự nghiệp',
    shortName: 'Vụ HCSN',
    type: 'administrative',
    sectors: ['treasury_budget', 'policy'],
    keywords: ['vụ tài chính hành chính sự nghiệp', 'vụ hcsn', 'kinh phí sự nghiệp', 'tự chủ tài chính đơn vị sự nghiệp'],
    leadFunctions: 'Quản lý kinh phí chi thường xuyên các cơ quan nhà nước, đơn vị sự nghiệp công lập, cơ chế tự chủ tài chính.'
  },
  {
    id: 'vu-tcnh',
    name: 'Vụ Tài chính các ngân hàng và tổ chức tài chính',
    shortName: 'Vụ TCNH',
    type: 'administrative',
    sectors: ['bonds', 'banking_credit', 'insurance'],
    keywords: ['vụ tài chính ngân hàng', 'vụ tcnh', 'thị trường trái phiếu doanh nghiệp', 'xổ số', 'casino', 'tổ chức tài chính'],
    leadFunctions: 'Quản lý nhà nước về thị trường trái phiếu doanh nghiệp, dịch vụ tài chính, kinh doanh xổ số, đặt cược, casino.'
  },
  {
    id: 'vu-htqt',
    name: 'Vụ Hợp tác quốc tế',
    shortName: 'Vụ HTQT',
    type: 'administrative',
    sectors: ['policy', 'macro'],
    keywords: ['vụ hợp tác quốc tế', 'vụ htqt', 'hội nhập tài chính', 'hợp tác tài chính song phương', 'fta'],
    leadFunctions: 'Chủ trì hợp tác quốc tế trong lĩnh vực tài chính, đàm phán các cam kết tài chính quốc tế và các hiệp định FTA.'
  },
  {
    id: 'vu-pc',
    name: 'Vụ Pháp chế',
    shortName: 'Vụ Pháp chế',
    type: 'administrative',
    sectors: ['policy'],
    keywords: ['vụ pháp chế', 'pháp chế bộ tài chính', 'thẩm định văn bản quy phạm', 'hoàn thiện thể chế pháp luật'],
    leadFunctions: 'Thẩm định, xây dựng chương trình văn bản quy phạm pháp luật, bảo đảm tính hợp hiến, hợp pháp của chính sách.'
  },
  {
    id: 'vu-tccb',
    name: 'Vụ Tổ chức cán bộ',
    shortName: 'Vụ TCCB',
    type: 'administrative',
    sectors: ['people', 'policy'],
    keywords: ['vụ tổ chức cán bộ', 'vụ tccb', 'bổ nhiệm cán bộ tài chính', 'cơ cấu tổ chức bộ tài chính'],
    leadFunctions: 'Quản lý tổ chức bộ máy, biên chế công chức, công tác quy hoạch, bổ nhiệm và đào tạo cán bộ toàn ngành.'
  },
  {
    id: 'vu-tdkt',
    name: 'Vụ Thi đua - Khen thưởng',
    shortName: 'Vụ TĐKT',
    type: 'administrative',
    sectors: ['people'],
    keywords: ['vụ thi đua khen thưởng', 'thi đua khen thưởng bộ tài chính'],
    leadFunctions: 'Công tác thi đua, khen thưởng các tập thể, cá nhân ngành Tài chính.'
  },
  {
    id: 'tt-btc',
    name: 'Thanh tra Bộ Tài chính',
    shortName: 'Thanh tra Bộ',
    type: 'administrative',
    sectors: ['inspection_audit'],
    keywords: ['thanh tra bộ tài chính', 'thanh tra tài chính', 'kết luận thanh tra bộ tài chính', 'xử lý sai phạm tài chính'],
    leadFunctions: 'Thanh tra việc chấp hành pháp luật về tài chính, ngân sách; phòng, chống tham nhũng, tiêu cực và tiếp công dân.'
  },
  {
    id: 'vp-btc',
    name: 'Văn phòng Bộ Tài chính',
    shortName: 'Văn phòng Bộ',
    type: 'administrative',
    sectors: ['people', 'policy'],
    keywords: ['văn phòng bộ tài chính', 'vp bộ tài chính', 'phát ngôn bộ tài chính', 'thông cáo báo chí bộ tài chính'],
    leadFunctions: 'Tổng hợp công tác chỉ đạo điều hành của Lãnh đạo Bộ, đầu mối phát ngôn và cung cấp thông tin cho báo chí.'
  },

  // --- Khối Cục Quản lý Chuyên ngành (12-20) ---
  {
    id: 'cuc-qlcs',
    name: 'Cục Quản lý công sản',
    shortName: 'Cục QLCS',
    type: 'administrative',
    sectors: ['public_assets'],
    keywords: ['cục quản lý công sản', 'cục qlcs', 'tài sản công', 'đấu giá tài sản công', 'nhà đất công'],
    leadFunctions: 'Quản lý chế độ sử dụng tài sản công, sắp xếp lại cơ sở nhà đất công, đấu giá và chống thất thoát tài sản nhà nước.'
  },
  {
    id: 'cuc-qln',
    name: 'Cục Quản lý nợ và Tài chính đối ngoại',
    shortName: 'Cục QLN',
    type: 'administrative',
    sectors: ['public_debt'],
    keywords: ['cục quản lý nợ', 'cục quản lý nợ và tài chính đối ngoại', 'cục qln', 'nợ công', 'vay nợ nước ngoài', 'vốn oda'],
    leadFunctions: 'Quản lý an toàn nợ công, trần nợ quốc gia, huy động vốn vay ODA và trả nợ nước ngoài của Chính phủ.'
  },
  {
    id: 'cuc-qlg',
    name: 'Cục Quản lý giá',
    shortName: 'Cục QL Giá',
    type: 'administrative',
    sectors: ['price_management'],
    keywords: ['cục quản lý giá', 'bình ổn giá', 'quỹ bog', 'quỹ bình ổn xăng dầu', 'kê khai giá', 'định giá hàng hóa thiết yếu'],
    leadFunctions: 'Điều hành mặt bằng giá các mặt hàng thiết yếu, kiểm soát lạm phát mục tiêu, quản lý Quỹ bình ổn giá.'
  },
  {
    id: 'cuc-ptdn-tnkt',
    name: 'Cục Phát triển doanh nghiệp tư nhân và kinh tế tập thể',
    shortName: 'Cục PT Doanh nghiệp',
    type: 'administrative',
    sectors: ['enterprise', 'collective_economy'],
    keywords: ['cục phát triển doanh nghiệp', 'kinh tế tư nhân', 'hợp tác xã', 'kinh tế tập thể', 'hỗ trợ doanh nghiệp nhỏ và vừa'],
    leadFunctions: 'Xây dựng cơ chế hỗ trợ tài chính cho doanh nghiệp tư nhân, hộ kinh doanh và phát triển kinh tế tập thể, HTX.'
  },
  {
    id: 'cuc-qlbh',
    name: 'Cục Quản lý, giám sát bảo hiểm',
    shortName: 'Cục QLBH',
    type: 'administrative',
    sectors: ['insurance'],
    keywords: ['cục quản lý giám sát bảo hiểm', 'cục qlbh', 'bảo hiểm nhân thọ', 'bancassurance', 'doanh nghiệp bảo hiểm', 'trục lợi bảo hiểm'],
    leadFunctions: 'Thanh tra, giám sát thị trường bảo hiểm nhân thọ, phi nhân thọ và kênh phân phối bảo hiểm qua ngân hàng (bancassurance).'
  },
  {
    id: 'cuc-qlktkt',
    name: 'Cục Quản lý, giám sát kế toán, kiểm toán',
    shortName: 'Cục QL Kiểm toán',
    type: 'administrative',
    sectors: ['inspection_audit'],
    keywords: ['cục quản lý kế toán kiểm toán', 'kiểm toán độc lập', 'chuẩn mực kế toán', 'sai phạm kiểm toán bctc'],
    leadFunctions: 'Quản lý chuẩn mực kế toán, kiểm toán quốc gia, thanh tra chất lượng các công ty kiểm toán độc lập.'
  },
  {
    id: 'cuc-qldt',
    name: 'Cục Quản lý đấu thầu',
    shortName: 'Cục QL Đấu thầu',
    type: 'administrative',
    sectors: ['bidding_procurement'],
    keywords: ['cục quản lý đấu thầu', 'đấu thầu qua mạng', 'hồ sơ mời thầu', 'thông thầu', 'chỉ định thầu', 'dự án ppp', 'đối tác công tư'],
    leadFunctions: 'Quản lý nhà nước về hoạt động đấu thầu mua sắm công, kiểm soát Hệ thống mạng đấu thầu quốc gia và các dự án PPP.'
  },
  {
    id: 'cuc-dtnn',
    name: 'Cục Đầu tư nước ngoài',
    shortName: 'Cục ĐT Nước ngoài',
    type: 'administrative',
    sectors: ['foreign_investment_fdi', 'fdi'],
    keywords: ['cục đầu tư nước ngoài', 'vốn fdi', 'chuyển giá fdi', 'cấp chứng nhận đầu tư', 'thu hút đầu tư nước ngoài'],
    leadFunctions: 'Quản lý xúc tiến đầu tư nước ngoài (FDI), theo dõi dòng vốn ngoại, kiểm soát hoạt động chuyển giá của doanh nghiệp FDI.'
  },
  {
    id: 'cuc-ptdnn',
    name: 'Cục Phát triển doanh nghiệp nhà nước',
    shortName: 'Cục PT DNNN',
    type: 'administrative',
    sectors: ['state_economy'],
    keywords: ['cục phát triển doanh nghiệp nhà nước', 'cục dnnn', 'cổ phần hóa dnnn', 'thoái vốn nhà nước', 'scic', 'tập đoàn kinh tế nhà nước'],
    leadFunctions: 'Tái cơ cấu, cổ phần hóa và giám sát hiệu quả sử dụng vốn nhà nước tại các doanh nghiệp và tập đoàn kinh tế.'
  },

  // --- Khối Vụ Kinh tế Chuyên ngành Mới sáp nhập (21-24) ---
  {
    id: 'vu-qlkkt',
    name: 'Vụ Quản lý các khu kinh tế',
    shortName: 'Vụ Khu kinh tế',
    type: 'administrative',
    sectors: ['foreign_investment_fdi', 'enterprise'],
    keywords: ['vụ quản lý các khu kinh tế', 'khu công nghiệp', 'khu kinh tế cửa khẩu', 'khu công nghệ cao'],
    leadFunctions: 'Quản lý chính sách phát triển và tài chính ưu đãi đối với các khu kinh tế, khu công nghiệp, khu chế xuất.'
  },
  {
    id: 'vu-qlqh',
    name: 'Vụ Quản lý quy hoạch',
    shortName: 'Vụ Quy hoạch',
    type: 'administrative',
    sectors: ['socioeconomic_planning'],
    keywords: ['vụ quản lý quy hoạch', 'quy hoạch tổng thể quốc gia', 'quy hoạch vùng', 'kế hoạch phát triển kinh tế xã hội'],
    leadFunctions: 'Chủ trì lập và điều phối quy hoạch tổng thể quốc gia, quy hoạch không gian biển và quy hoạch vùng KT-XH.'
  },
  {
    id: 'vu-ktnn',
    name: 'Vụ Kinh tế nông nghiệp và dịch vụ',
    shortName: 'Vụ KT Nông nghiệp',
    type: 'administrative',
    sectors: ['macro', 'price_management'],
    keywords: ['vụ kinh tế nông nghiệp', 'tài chính nông nghiệp', 'hỗ trợ nông dân', 'an ninh lương thực'],
    leadFunctions: 'Nghiên cứu cơ chế tài chính hỗ trợ khu vực nông nghiệp, nông thôn và phát triển ngành dịch vụ.'
  },
  {
    id: 'vu-ktcn',
    name: 'Vụ Kinh tế công nghiệp và xây dựng',
    shortName: 'Vụ KT Công nghiệp',
    type: 'administrative',
    sectors: ['macro', 'public_investment'],
    keywords: ['vụ kinh tế công nghiệp', 'ngành công nghiệp trọng điểm', 'tài chính xây dựng cơ bản'],
    leadFunctions: 'Theo dõi tài chính các ngành công nghiệp mũi nhọn, năng lượng, vật liệu và hạ tầng xây dựng.'
  },

  // --- Khối Cơ quan Chuyên trách Trực thuộc & Đơn vị Đặc thù (25-31) ---
  {
    id: 'cuc-thue',
    name: 'Cục Thuế',
    shortName: 'Cục Thuế',
    type: 'special_agency',
    sectors: ['tax', 'fintech_digital'],
    keywords: ['cục thuế', 'ngành thuế', 'hóa đơn điện tử', 'hoàn thuế vat', 'thuế tmđt', 'thuế tncn', 'thanh tra thuế', 'truy thu thuế'],
    leadFunctions: 'Cơ quan chuyên trách quản lý nguồn thu nội địa, chống thất thu, triển khai hóa đơn điện tử và hiện đại hóa quản lý thuế.'
  },
  {
    id: 'cuc-hq',
    name: 'Cục Hải quan',
    shortName: 'Cục Hải quan',
    type: 'special_agency',
    sectors: ['customs'],
    keywords: ['cục hải quan', 'hải quan', 'thông quan hàng hóa', 'chống buôn lậu', 'kiểm tra sau thông quan', 'gian lận xuất xứ'],
    leadFunctions: 'Cơ quan chuyên trách quản lý hàng hóa XNK, thông quan điện tử, thu thuế xuất nhập khẩu và kiểm soát chống buôn lậu.'
  },
  {
    id: 'kbnn',
    name: 'Kho bạc Nhà nước',
    shortName: 'KBNN',
    type: 'special_agency',
    sectors: ['treasury_budget', 'public_investment'],
    keywords: ['kho bạc nhà nước', 'kbnn', 'ngân quỹ quốc gia', 'kiểm soát chi', 'tồn ngân kho bạc', 'thanh toán vốn đầu tư công'],
    leadFunctions: 'Quản lý ngân quỹ quốc gia, thực hiện kiểm soát thanh toán chi ngân sách và phát hành Trái phiếu Chính phủ.'
  },
  {
    id: 'ubcknn',
    name: 'Ủy ban Chứng khoán Nhà nước',
    shortName: 'UBCKNN',
    type: 'special_agency',
    sectors: ['stocks', 'bonds'],
    keywords: ['ủy ban chứng khoán nhà nước', 'ubcknn', 'thị trường chứng khoán', 'nâng hạng thị trường', 'thao túng cổ phiếu', 'hose', 'hnx'],
    leadFunctions: 'Quản lý, giám sát toàn diện thị trường chứng khoán, bảo vệ quyền lợi nhà đầu tư và thúc đẩy nâng hạng thị trường vốn.'
  },
  {
    id: 'cuc-dtnn-res',
    name: 'Cục Dự trữ Nhà nước',
    shortName: 'Cục Dự trữ NN',
    type: 'special_agency',
    sectors: ['national_reserve'],
    keywords: ['cục dự trữ nhà nước', 'dự trữ quốc gia', 'xuất cấp gạo cứu trợ', 'vật tư dự trữ quốc gia'],
    leadFunctions: 'Quản lý hàng dự trữ quốc gia, sẵn sàng xuất cấp cứu trợ thiên tai, dịch bệnh và bảo đảm an ninh lương thực.'
  },
  {
    id: 'cuc-tk',
    name: 'Cục Thống kê',
    shortName: 'Cục Thống kê',
    type: 'special_agency',
    sectors: ['statistics_macro', 'macro'],
    keywords: ['cục thống kê', 'tổng cục thống kê', 'chỉ số giá tiêu dùng', 'chỉ số cpi', 'tăng trưởng gdp', 'điều tra thống kê quốc gia'],
    leadFunctions: 'Cơ quan chuyên trách thực hiện điều tra thống kê, tính toán công bố chỉ số CPI, số liệu GDP và các chỉ tiêu vĩ mô quốc gia.'
  },
  {
    id: 'bhxh-vn',
    name: 'Bảo hiểm xã hội Việt Nam',
    shortName: 'BHXH Việt Nam',
    type: 'special_agency',
    sectors: ['social_security'],
    keywords: ['bảo hiểm xã hội việt nam', 'bhxh việt nam', 'bhxh', 'bhyt', 'bhtn', 'quỹ bảo hiểm xã hội', 'nợ đọng bhxh', 'trục lợi bhyt'],
    leadFunctions: 'Cơ quan đặc thù trực thuộc Bộ Tài chính theo NĐ 376, thực hiện thu chi và quản lý các quỹ BHXH, BHYT, BHTN quốc gia.'
  },

  // --- Khối Đơn vị Sự nghiệp Công lập Trọng điểm (32-34) ---
  {
    id: 'vien-clcs',
    name: 'Viện Chiến lược và Chính sách tài chính',
    shortName: 'Viện Chiến lược',
    type: 'public_service',
    sectors: ['socioeconomic_planning', 'macro'],
    keywords: ['viện chiến lược và chính sách tài chính', 'nghiên cứu tài chính vĩ mô', 'dự báo kinh tế tài chính'],
    leadFunctions: 'Nghiên cứu lý luận, tổng kết thực tiễn, tham mưu hoạch định chiến lược phát triển tài chính - kinh tế quốc gia.'
  },
  {
    id: 'tb-tcvn',
    name: 'Thời báo Tài chính Việt Nam / Tạp chí Tài chính',
    shortName: 'Báo chí Ngành Tài chính',
    type: 'public_service',
    sectors: ['policy', 'people'],
    keywords: ['thời báo tài chính việt nam', 'tạp chí tài chính', 'cổng thông tin bộ tài chính'],
    leadFunctions: 'Cơ quan ngôn luận, tuyên truyền định hướng chính sách tài khóa, giải thích pháp luật và phản hồi dư luận báo chí.'
  },
  {
    id: 'hv-tc',
    name: 'Học viện Tài chính / Trường Bồi dưỡng cán bộ tài chính',
    shortName: 'Học viện Tài chính',
    type: 'public_service',
    sectors: ['people', 'policy'],
    keywords: ['học viện tài chính', 'trường bồi dưỡng cán bộ tài chính', 'đào tạo nhân lực tài chính'],
    leadFunctions: 'Đào tạo nguồn nhân lực tài chính chất lượng cao, bồi dưỡng nghiệp vụ chuyên môn cho công chức ngành Tài chính.'
  }
];

export function resolveAgencyByDecree376(text: string, sector?: string): MofAgencyDecree376 {
  if (text) {
    const lower = text.toLowerCase();
    for (const agency of MOF_34_AGENCIES_DECREE_376) {
      if (agency.keywords.some(kw => lower.includes(kw))) {
        return agency;
      }
    }
  }

  if (sector) {
    const matched = MOF_34_AGENCIES_DECREE_376.find(a => a.sectors.includes(sector as SectorType));
    if (matched) return matched;
  }

  // Mặc định là Văn phòng Bộ Tài chính
  return MOF_34_AGENCIES_DECREE_376[10]; // Văn phòng Bộ Tài chính
}

export type SentimentType = 'bullish' | 'bearish' | 'neutral';
export type ImpactLevel = 'high' | 'medium' | 'low';

export type MediaStrategyType = 
  | 'crisis_resolution'       // 🚨 Xử lý khủng hoảng & Đính chính
  | 'positive_amplification'  // 📢 Khuếch đại tích cực & Lan tỏa
  | 'policy_guidance'         // 📘 Hướng dẫn & Tuyên truyền chính sách
  | 'routine_monitoring'      // 👁️ Giám sát thường nhật (Không can thiệp)
  | 'risk_mitigation'         // 🛡️ Khoanh vùng rủi ro & Ổn định
  | 'law_enforcement'         // ⚖️ Răn đe & Thượng tôn pháp luật
  | 'treasury_optimization';  // 🏦 Quản lý & Tối ưu ngân quỹ KBNN

export interface MediaStrategy {
  type: MediaStrategyType;
  title: string; // Định hướng truyền thông chính
  tacticalRecommendation?: string; // Khuyến nghị tác chiến tóm tắt
  actionPlan: string[]; // Các bước tác chiến cụ thể cho Lãnh đạo & Tổ truyền thông Bộ
  targetAudience: string; // Nhóm công chúng mục tiêu (NĐT, doanh nghiệp, người nộp thuế...)
  recommendedSpokesperson: string; // Đơn vị/Đại diện phát ngôn đề xuất (Văn phòng Bộ, Lãnh đạo Tổng cục, UBCKNN...)
  keyMessage: string; // Thông điệp truyền thông then chốt cần phát đi
  suggestedChannels: string[]; // Kênh đề xuất (Cổng TTĐT Bộ, VTV1, Báo chí Tài chính, Họp báo...)
}

export type DirectiveActionType = 'Regulatory Review' | 'Policy Adjustment' | 'Public Statement';

export interface ExecutiveDirective {
  whatHappened: string; // 1. Chuyện gì đang xảy ra (Tóm tắt thực chất sự việc, sắc thái tích cực / tiêu cực)
  whereEntity: string; // 2. Ở đâu / Thuộc đơn vị nào (Cục Thuế, UBCKNN, Tổng cục Hải quan, KBNN, Cục QLN, DN, Địa phương...)
  where?: {
    primaryAgency: string;
    jurisdiction?: string;
  };
  rootCause: string; // 3. Vì sao xảy ra (Nguyên nhân gốc rễ: cơ chế chính sách, tâm lý thị trường, vướng mắc thực thi...)
  mediaStrategy: MediaStrategy; // 4. Đề xuất nên truyền thông thế nào (Xử lý khủng hoảng hoặc Lan tỏa điều tốt)
  actionType?: DirectiveActionType; // Loại hành động: 'Regulatory Review' | 'Policy Adjustment' | 'Public Statement'
  actionTypeLabelVi?: string; // e.g., 'Rà soát Pháp lý' | 'Điều chỉnh Chính sách' | 'Phát ngôn Truyền thông'
  actionTypeBadge?: string; // e.g., '🟣 Rà soát Pháp lý' | '🔵 Điều chỉnh Chính sách' | '🟢 Phát ngôn Truyền thông'
}

export interface SixWAnalysis {
  who: string; // Ai (Chủ thể: Bộ Tài chính, UBCKNN, Cục Thuế, Doanh nghiệp...)
  doingWhat: string; // Đang làm gì (Hành động, quyết sách, chỉ đạo, giải ngân...)
  aboutWhat: string; // Về vấn đề gì (Trái phiếu doanh nghiệp, Non-prefunding, Hóa đơn điện tử, FDI...)
  resultOutcome: string; // Kết quả thế nào (Số liệu, tiến độ, kết quả thực tế...)
  whoIsAffected: string; // Ai bị tác động (Nhà đầu tư, trái chủ, doanh nghiệp, HTX, thị trường...)
  reaction: string; // Phản ứng ra sao (Tâm lý thị trường, động thái gom mua, giải tỏa lo ngại...)
  recommendation?: string; // Khuyến nghị truyền thông tóm tắt
}

export type ActionCategory =
  | 'INSPECTION'       // 🔍 Yêu cầu Thanh tra / Kiểm tra
  | 'COMMUNICATION'    // 📢 Phát ngôn Trấn an / Định hướng
  | 'MONITORING'       // 👁️ Theo dõi Sát sao / Giám sát
  | 'POLICY_REFORM'    // 🏛️ Tháo gỡ Thể chế / Cơ chế
  | 'INTER_AGENCY'     // 🤝 Phối hợp Liên ngành
  | 'STABILIZATION';   // 🛡️ Bình ổn & Can thiệp Thị trường

export interface ProposedLeadershipAction {
  id: string;
  rank: 1 | 2 | 3;
  title: string;
  titleEn?: string;
  shortTag: string; // Nhãn ngắn gọn hiển thị nhanh: 'Yêu cầu thanh tra', 'Phát ngôn trấn an', 'Theo dõi sát sao'
  shortTagEn?: string;
  category: ActionCategory;
  categoryLabel: string;
  categoryLabelEn?: string;
  urgency: 'Khẩn cấp' | 'Ưu tiên cao' | 'Theo dõi 24h';
  urgencyEn?: string;
  urgencyLevel: 'high' | 'medium' | 'low';
  targetUnit: string; // Đơn vị chủ trì thực hiện
  targetUnitEn?: string;
  cooperatingUnits?: string[]; // Đơn vị phối hợp thực hiện theo Nghị định 376
  cooperatingUnitsEn?: string[];
  sixWRationale: string; // Luận giải logic trích từ phân tích 6W
  sixWRationaleEn?: string;
  sentimentContext: string; // Bối cảnh sắc thái và chỉ số rủi ro
  rationale: string; // Tóm tắt căn cứ tham mưu
  rationaleEn?: string;
  actionSteps: string[]; // 3 bước hành động cụ thể
  actionStepsEn?: string[];
  draftingActionType?: 'statement' | 'inspection_order' | 'monitoring_report' | 'press_release' | 'dispatch_notice';
}

export interface ArticleActionProposalResult {
  articleId?: string;
  actions: ProposedLeadershipAction[]; // 3 hành động cụ thể cho Lãnh đạo
  recommendedFocus: string;
  sentimentSummary: string;
  sixWSummary: string;
}

export interface WeightedKeywordTag {
  keyword: string;
  weight: number; // Trọng số từ 1.0 đến 5.0
  category?: string;
  isCoreMof?: boolean;
}

export interface ScrapedNewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  sourceName?: string; // Optional alias for source display
  snippet?: string; // Optional alias for summary
  publishedAt: string; // ISO or relative
  publishedTimeStr?: string; // e.g. "14:10"
  timeAgo: string; // e.g. "2 giờ 50 phút trước"
  sector: SectorType;
  sectors?: SectorType[]; // Đa nhãn lĩnh vực liên quan (Multi-label)
  sectorNameVi: string;
  summary: string;
  keyPoints: string[];
  sixW: SixWAnalysis; // Khung 6 yếu tố: Ai - Làm gì - Về gì - Kết quả - Ai chịu tác động - Phản ứng
  sixWActionType?: 'EXPLAIN' | 'RESPOND' | 'INFORM' | 'MONITOR'; // Phân loại hành động 6W Matrix
  executiveDirective?: ExecutiveDirective; // Tham mưu Lãnh đạo: Chuyện gì - Ở đâu - Vì sao - Đề xuất truyền thông
  weightedKeywords?: WeightedKeywordTag[]; // Từ khóa kèm trọng số
  sentiment: SentimentType;
  sentimentScore: number; // -100 to +100
  sentimentReason: string;
  impactLevel: ImpactLevel;
  marketImplication: string;
  policyResponseAdvisor?: string; // Đề xuất khuyến nghị phản ứng chính sách cho Lãnh đạo
  tldrSummary?: string; // Tóm tắt điều hành 2 câu bằng AI (TL;DR Executive Summary)
  tldrKeyImpact?: string; // Tác động chính yếu rút ra từ TL;DR
  isEmergency?: boolean; // Biến động khẩn cấp / Cảnh báo đỏ nguy cơ rủi ro
  isOfficialSource?: boolean; // Xác thực nguồn tin chính thống từ Cổng thông tin Chính phủ / Bộ / Tổng cục
  tickers: string[];
  keyPeople?: string[]; // e.g. "Vũ Thị Chân Phương", "Mai Xuân Thành"
  policyTags?: string[]; // e.g. "Nghị định 08", "Thông tư 68/2024/TT-BTC"
  agencies?: string[]; // e.g. "Bộ Tài chính", "UBCKNN", "Cục Thuế", "Tổng cục Hải quan"
  buzzScore: number; // 1 to 100
  priorityScore?: number; // Điểm trọng số ưu tiên MoF (0 - 100)
  timeDecayScore?: number; // Điểm Buzz sau khi áp dụng hàm suy giảm thời gian (Time-Decay)
  velocityStatus?: 'spike' | 'accelerating' | 'normal'; // Trạng thái gia tốc lan truyền (Spike: Bùng nổ, Accelerating: Lan tỏa nhanh)
  authorityLevel?: 'official_gov' | 'major_financial' | 'general'; // Phân cấp thẩm quyền nguồn tin
  authorityWeight?: number; // Hệ số thẩm quyền (x1.8: Cơ quan quản lý, x1.3: Báo tài chính hàng đầu, x1.0: Nguồn khác)
  domainTrustScore?: number; // Điểm tín nhiệm tên miền / Domain Trust Score (0 - 100)
  domainTrustTier?: 'TIER_1_OFFICIAL' | 'TIER_1_PRESS' | 'TIER_2_REPUTABLE' | 'TIER_3_NICHE' | 'UNVERIFIED' | 'SUSPICIOUS'; // Phân hạng uy tín nguồn
  domainTrustBadge?: string; // Huy hiệu xác thực nguồn (🏛️ Nguồn Chính Thống, ✅ Báo chí Cốt lõi...)
  isFakeNewsSuspicious?: boolean; // Cờ cảnh báo nghi vấn tin giả, câu view, giật tít không kiểm chứng
  fakeNewsReason?: string; // Lý do nghi vấn tin giả hoặc tin rác
  isSpamFiltered?: boolean; // Tự động loại bỏ khỏi luồng tin cảnh báo cấp bách
  sourceCount?: number; // Số lượng cơ quan báo chí cùng xác nhận / đồng phát tán
  impactScore?: number; // Điểm tác động thể chế & thị trường tổng hợp (0 - 100)
  tierLevel?: 1 | 2 | 3; // Tầng 1: Quốc gia & Điều hành, Tầng 2: Ngành & Thị trường, Tầng 3: Doanh nghiệp
  isDebunkedOrClarified?: boolean; // Nhận diện bài viết bác bỏ tin đồn / làm rõ sự thật (Semantic Inversion)
  isUrgent?: boolean;
  isAlertTriggered?: boolean; // Cờ nhận diện bài viết kích hoạt theo quy tắc Alert (Trigger Rule)
  triggerRuleName?: string; // Tên quy tắc alert được kích hoạt
  riskConfidenceScore?: number; // Điểm tin cậy rủi ro MoF dựa trên giao thoa từ khóa MoF & sắc thái tiêu cực (0 - 100)
  riskConfidenceLevel?: 'HIGH' | 'MEDIUM' | 'LOW'; // Phân cấp độ tin cậy
  isHighConfidenceRisk?: boolean; // Cờ nhận diện rủi ro độ tin cậy cao (confidence >= 70%)
  sentimentDiagnostic?: SentimentDiagnostic; // Chẩn đoán sắc thái chuyên sâu: Vì sao tích cực/tiêu cực + Kế hoạch phát huy/xử lý
  mediaGap?: MediaGapAnalysis; // Cảnh báo khoảng trống truyền thông: Vấn đề dư luận quan tâm nhưng thiếu thông tin + Tư vấn Dân/DN + Kế hoạch tăng cường tin bài
  geographicScope?: 'VIETNAM_DOMESTIC' | 'GLOBAL_WITH_VN_IMPACT' | 'INTERNATIONAL_NOISE'; // Bán kính địa lý liên quan
  geographicEntities?: string[]; // Thực thể / Địa danh Việt Nam phát hiện trong bài
  publishedTimestamp?: number; // Epoch timestamp (ms)
  scrapedAt?: string; // ISO string when crawled/discovered
  scrapedTimestamp?: number; // Milliseconds timestamp of crawl discovery
  discoveredOrder?: number; // Sequential discovery order in the scan session (1, 2, 3...)
  isCurrentSession?: boolean; // True if collected during the active scan session
  scrapeIntegrityStatus?: 'Passed' | 'Dropped: Stale Data' | 'Dropped: Duplicate (SHA-256 Match)'; // Trạng thái kiểm tra toàn vẹn dữ liệu
  dropReason?: string; // Lý do bị loại bỏ (vd: 'Dropped: Stale Data')
  contentSha256?: string; // SHA-256 content checksum for duplicate filtering

  readerComments?: ReaderComment[]; // Luồng bình luận độc giả thực tế từ báo điện tử lớn
  publicReaction?: PublicReactionAnalysis; // Tính toán sắc thái dư luận công chúng thật từ bình luận
  isBrightSpot?: boolean;
  brightSpotReason?: string;
  brightSpotScore?: number;
  isRisk?: boolean;
  riskReason?: string;
  loughranSentiment?: LoughranMcDonaldSentimentAnalysis;
  riskScore?: number;
  isPostIncident?: boolean; // Điểm tin vụ án / vụ việc đã xử lý / giai đoạn tố tụng (chỉ điểm tin giám sát)
  postIncidentReason?: string;
  isManualEntry?: boolean;
  regulatoryTags?: string[];
  categoryLabels?: string[];
  imageUrl?: string; // Ảnh minh họa / Banner bài báo gốc
  author?: string; // Tên tác giả / Bút danh phóng viên
  commentCount?: number; // Số lượng bình luận độc giả
  syndicationCount?: number; // Số lượng báo xuất bản cùng chủ đề (Độ lan truyền)
  wordCount?: number; // Số từ trong bài viết
  isTimestampAnomalous?: boolean; // Tự động gắn cờ bài viết có định dạng timestamp không chuẩn / rác
  timestampAnomalyReason?: string; // Lý do timestamp bị gắn cờ (vd: Thời gian tương lai, Unparseable, Trùng mốc 1970...)
  timestampIntegrityScore?: number; // Điểm toàn vẹn thời gian (0 - 100)
  warningPipeline?: WarningPipelineModel; // Mô hình Cảnh báo 7 bước & 3 Cấp độ (Signal → Context → Risk → Velocity → Impact → Escalation → Alert)
  informationVacuum?: InformationVacuumAssessment; // Đánh giá Khoảng trống Thông tin & Cấp độ Cảnh báo
  hasInformationGap?: boolean; // Cờ nhận diện có tồn tại khoảng trống thông tin
  isGapBelowAlertThreshold?: boolean; // Cờ nhận diện: Có khoảng trống thông tin nhưng CHƯA ĐẾN MỨC CẢNH BÁO (Chỉ theo dõi)
  isMarketDigest?: boolean; // Cờ nhận diện: Điểm tin thị trường thuần túy (VN-Index, cổ phiếu riêng lẻ, giao dịch phiên) -> Không ảnh hưởng Bộ -> Không cảnh báo
  marketDigestReason?: string; // Diễn giải lý do xếp vào Điểm tin thị trường thuần túy
  isVerifiedByExpert?: boolean; // Cờ chuyên gia đã xác thực mẫu chuẩn
  aiConfidence?: number; // Điểm tin cậy phân loại AI (0 - 100)
  leadUnit?: string; // Đơn vị chủ trì theo Nghị định 376/2026/NĐ-CP
  cooperatingUnits?: string[]; // Đơn vị phối hợp theo Nghị định 376/2026/NĐ-CP
  decree376Tier?: 0 | 1 | 2 | 3; // Phân tầng chuẩn theo Nghị định 376 (0: Loại trừ, 1: Lưu tâm, 2: Cảnh báo sớm, 3: Cảnh báo gấp)
  decree376ScenarioCode?: string; // Mã tình huống chuẩn đối soát (vd: 'TH-01', 'TH-76')
  decree376Clause?: string; // Căn cứ pháp lý theo Điều/Khoản Nghị định 376
  decree376Reason?: string; // Diễn giải phân loại theo Nghị định 376
  handlingStatus?: 'NEW' | 'IN_PROGRESS' | 'DONE'; // Trạng thái xử lý Vòng đời SOP: Đang xử lý / Đã hoàn thành
  handlingActionLabel?: string; // Nhãn hành động chi tiết (vd: 'Đã phát ngôn', 'Điều chỉnh chính sách')
  handledAt?: string; // Mốc thời gian Lãnh đạo thực hiện hành động
}

export interface StandardizedTier1Sentiment {
  polarity: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  confidence_score: number;
  linguistic_markers: string[];
  target_entity: string;
  summary_tone: string;
}

export interface StandardizedTier2CrisisRisk {
  reputation_damage_potential: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  accountability_attribution: 'NONE' | 'INDIRECT' | 'DIRECT_MINISTRY' | 'DIRECT_LEADERSHIP';
  socio_economic_impact_scale: 'LOCAL' | 'SECTORAL' | 'NATIONAL' | 'SYSTEMIC';
  stakeholders_affected: string[];
  narrative_divergence_detected: boolean;
  divergence_details: string | null;
  core_institutional_risks: string[];
}

export interface StandardizedRecommendedAction {
  action_type: 'MONITORING' | 'PREPARE_QA' | 'PRESS_RELEASE' | 'REGULATORY_GUIDANCE' | 'CRISIS_TEAM_CONVENE';
  description: string;
  lead_department: string;
}

export interface StandardizedTier3ActionableAlert {
  risk_score: number;
  alert_level: 'EARLY_HORIZON' | 'EARLY_WARNING' | 'RAPID_ALERT' | 'EMERGENCY_ALERT' | 'STANDARD_MONITORING';
  urgency: 'ROUTINE' | 'WITHIN_24H' | 'SAME_DAY' | 'IMMEDIATE';
  vulnerability_analysis: string;
  formula_metrics: {
    S_severity: number; // 0 - 50
    D_divergence: number; // 0 - 20
    V_velocity: number; // 0.0 - 1.0
    I_impact: number; // 0.0 - 1.0
    calculation_formula: string;
  };
  recommended_actions: StandardizedRecommendedAction[];
}

export interface StandardizedWarningSystemOutput {
  tier_1_sentiment: StandardizedTier1Sentiment;
  tier_2_crisis_risk: StandardizedTier2CrisisRisk;
  tier_3_actionable_alert: StandardizedTier3ActionableAlert;
}

export type InformationGapLevelType =
  | 'NO_GAP'                   // Không có khoảng trống thông tin (Thông tin chính sách minh bạch, đã có văn bản/hướng dẫn rõ ràng) -> KHÔNG CẢNH BÁO
  | 'MARKET_DIGEST'            // Điểm tin Thị trường Thuần túy (VN-Index, biến động cổ phiếu, dòng tiền giao dịch) -> KHÔNG ẢNH HƯỞNG BỘ -> KHÔNG CẢNH BÁO
  | 'MONITORING_NO_ALERT'      // Khoảng trống thông tin NHƯNG CHƯA ĐẾN MỨC CẢNH BÁO (Trao đổi chuyên môn/học thuật/mới phát sinh nhẹ, không gây hoang mang, quy mô hẹp) -> CHỈ THEO DÕI
  | 'GAP_EARLY_ALERT'          // Khoảng trống thông tin Cấp 1 -> Cần lưu tâm & Dự báo sớm (Hợp nhất Cảnh báo xa & Cần lưu tâm: Thiếu hướng dẫn, băn khoăn thủ tục/chi phí)
  | 'GAP_DISTANT_ALERT'        // Alias tương thích ngược cho GAP_EARLY_ALERT
  | 'GAP_RAPID_ALERT'          // Khoảng trống thông tin Cấp 2 -> Cảnh báo Nhanh (Rapid Alert: Báo chí lớn và MXH đưa tin dồn dập, áp lực giải trình trong ngày)
  | 'GAP_EMERGENCY_ALERT';     // Khoảng trống thông tin Cấp 3 -> Cảnh báo Khẩn cấp (Emergency: Bị lợi dụng phát tán tin đồn thất thiệt, hoang mang thị trường)

export interface InformationVacuumAssessment {
  hasGap: boolean; // Có tồn tại khoảng trống thông tin hay không
  gapLevel: InformationGapLevelType;
  gapLevelLabelVi: string;
  isAlertWarranted: boolean; // true CHỈ KHI có khoảng trống thông tin và rủi ro thực chất cần can thiệp
  whyNoAlertYet?: string; // Giải thích vì sao dù có thông tin nhưng không kích hoạt cảnh báo
  issueConcern?: string; // Vấn đề dư luận, người dân, DN quan tâm / than phiền (VD: Xử lý DN ngừng hoạt động theo MST 03-06, thủ tục rườm rà, phạt tiền cao...)
  clarificationNeeded?: string; // Cảnh báo: Cần làm rõ điều gì (thủ tục, mức phí, thời gian làm, mục đích quản lý...)
  gapDetails: string; // Nội dung khoảng trống thông tin: Chưa được thông tin đầy đủ, chưa giải thích chính sách, chưa có hướng dẫn cụ thể...
  publicConfusionRisk?: string; // Nguy cơ nếu tiếp tục để trống thông tin (hoang mang dư luận, suy giảm niềm tin, chi phí tuân thủ...)
  recommendedClosureAction: string; // Đề xuất giải quyết để lấp khoảng trống (cần làm gì: tăng loại tin bài gì, tổ chức hội thảo, infographic, công văn...)
  targetedFormats?: string[]; // Danh sách hình thức truyền thông cụ thể: ['Bài viết giải thích nghiệp vụ', 'Infographic quy trình', 'Tọa đàm / Hội thảo trực tuyến', 'Công văn hướng dẫn', 'Cẩm nang Hỏi - Đáp (FAQ)']
  actionOwnerUnit?: string; // Đơn vị chủ trì chịu trách nhiệm giải quyết (theo 34 đơn vị trực thuộc Bộ Tài chính NĐ 376)
  closingTimeline?: string; // Khung thời gian hoàn thành đề xuất (trong 12h, 24h, 48h)
}

export type WarningAlertLevelType =
  | 'DISTANT'   // 🔭 Cấp 1: Cảnh Báo Xa (Early Horizon 20–39 điểm)
  | 'EARLY'     // ⏳ Cấp 2: Cảnh Báo Sớm (Early Warning 40–59 điểm - Cấp phòng ngừa quan trọng nhất)
  | 'RAPID'     // ⚡ Cấp 3: Cảnh Báo Nhanh (Rapid Alert 60–74 điểm)
  | 'EMERGENCY' // 🚨 Cấp 4: Cảnh Báo Khẩn Cấp (Emergency Alert 75–100 điểm)
  | 'STANDARD'  // 📋 Giám sát thường quy (<20 điểm - Hoạt động định kỳ / Không cảnh báo)
  | 'MARKET_DIGEST'; // 📊 Điểm tin Thị trường Thuần túy (Không cảnh báo - Khách quan)

export interface WarningPipelineStageItem {
  stage: 'SIGNAL' | 'CONTEXT' | 'RISK' | 'VELOCITY' | 'IMPACT' | 'ESCALATION' | 'ALERT';
  titleVi: string;
  badge: string;
  summary: string;
  details: string[];
  status: 'SAFE' | 'WATCH' | 'WARNING' | 'CRITICAL';
}

export interface LoughranMcDonaldSentimentAnalysis {
  scoreS: number; // Thang điểm S chuyên ngành [-5, +5]
  scoreLabel: string; // "+5: Lợi ích chính sách lớn", "-4: Phản ứng thể chế sâu", etc.
  voiceSource: {
    sourceType: 'GOVERNMENT_DIRECTIVE' | 'BUSINESS_ASSOCIATION' | 'EXPERT_ANALYSIS' | 'PUBLIC_OPINION';
    sourceTypeLabelVi: string;
    isEnforcementOrGovernance: boolean; // Đúng quy trình kỷ cương / điều hành, không gán tiêu cực sai lệch
  };
  targetEntity: {
    entityLevel: 'MINISTRY_LEADERSHIP' | 'GENERAL_DEPARTMENT' | 'DEPARTMENT_BUREAU' | 'LOCAL_TAXPAYER_CASE';
    weightE: number; // 1 to 4
    entityNameVi: string;
  };
  eventContext: {
    category: 'SUPPORTIVE_POLICY' | 'MACRO_STABILITY' | 'ROUTINE_ENFORCEMENT' | 'POLICY_FRICTION_PETITION' | 'CRITICAL_CRISIS';
    categoryLabelVi: string;
    contextSummary: string;
  };
  velocityVector: {
    V: number; // 1.0 to 1.25
    velocityStatusLabel: string;
  };
  sentimentRiskImpact: number; // 0 to 100 calculated by min(100, |S_neg| * E * V * 4)
  executiveBrief: string; // Tóm tắt 1 câu cô đọng dành cho Lãnh đạo
}

export interface WarningLevel1Sentiment {
  levelTitle: string; // Mức độ 1: Đánh giá Sắc thái & Chiều hướng (SENTIMENT)
  coreQuestion: string; // Tin tức báo chí - dư luận đang nói về Bộ Tài chính theo chiều hướng nào?
  sentimentDirection: 'Tích cực' | 'Trung tính' | 'Tiêu cực' | 'Trái chiều / Tranh luận' | 'Trung tính nhưng tiềm ẩn rủi ro';
  polarityScore: number; // -100 to 100
  criteria: {
    language: string; // 1. Ngôn ngữ (Từ ngữ biểu đạt, tính khách quan / chỉ trích / nghi vấn)
    context: string;  // 2. Bối cảnh (Bối cảnh kinh tế, sức khỏe DN, nợ đọng, gánh nặng chi phí, chậm giải ngân)
    targetEntity: string; // 3. Đối tượng (Bộ Tài chính, Lãnh đạo Bộ, Cục Thuế, UBCKNN, Doanh nghiệp, NĐT...)
    consequence: string; // 4. Hệ quả (Tác động xã hội, tâm lý thị trường, phát sinh câu hỏi chính sách)
    sentimentNuance: string; // 5. Sắc thái (Bản chất cảm xúc dư luận ẩn sau câu chữ tiêu đề)
  };
  hasHiddenRiskBehindNeutralTitle: boolean; // Cờ nhận diện tiêu đề trung tính nhưng bối cảnh tiềm ẩn rủi ro truyền thông
  loughranSentiment?: LoughranMcDonaldSentimentAnalysis; // Khung phân tích sắc thái chuyên sâu (Loughran-McDonald PDF)
  summaryExplanation: string;
}

export interface WarningLevel2Risk {
  levelTitle: string; // Mức độ 2: Dấu hiệu Khủng hoảng & Khả năng thành Vấn đề Truyền thông (RISK)
  coreQuestion: string; // Vấn đề này có khả năng trở thành vấn đề truyền thông đối với Bộ hay không?
  crisisPotential: 'RẤT CAO' | 'CAO' | 'TRUNG BÌNH' | 'THẤP';
  riskScore: number; // 0 to 100
  criteria: {
    reputationDamage: {
      hasRisk: boolean;
      score: number; // 0 - 100
      analysis: string;
    };
    blameAttribution: {
      hasRisk: boolean;
      score: number; // 0 - 100
      analysis: string;
    };
    policyPetitions: {
      hasRisk: boolean;
      score: number; // 0 - 100
      analysis: string;
      petitionItems: string[];
    };
    investorBizImpact: {
      hasRisk: boolean;
      score: number; // 0 - 100
      analysis: string;
    };
  };
  criteriaPassedCount?: number; // 0 - 4 tiêu chí đạt
  allFourCriteriaMet?: boolean; // Cờ đạt cả 4/4 tiêu chí khủng hoảng
  criteriaEvaluationNotes?: string[];
  overallRiskSummary: string;
}

export interface WarningPlaybookPhase {
  phase: string;
  actions: string[];
}

export interface WarningLevel3Action {
  levelTitle: string; // Mức độ 3: Khả năng & Cấp độ Hành động (ACTIONABLE ALERT)
  coreQuestion: string; // Có cần hành động không? Nếu hành động thì như thế nào (sớm hay bình thường, làm những gì)?
  requiresAction: boolean;
  alertLevel: WarningAlertLevelType;
  alertLevelLabelVi: string;
  alertLevelBadge: string;
  urgencyTiming: string; // "Hành động ngay lập tức (1-2h)", "Xử lý trong 12-24h", "Theo dõi nhịp độ 24-48h", "Chủ động chuẩn bị từ xa"
  leadUnit: string; // Đơn vị chủ trì thực hiện
  cooperatingUnits: string[]; // Đơn vị phối hợp
  actionPlaybook: WarningPlaybookPhase[];
  contingencyScenario: string; // Kịch bản dự phòng nếu tình hình leo thang
}

export interface WarningPipelineModel {
  articleId?: string;
  articleTitle?: string;
  pipelineStages: WarningPipelineStageItem[]; // 7 bước: Signal → Context → Risk → Velocity → Impact → Escalation → Alert
  level1Sentiment: WarningLevel1Sentiment; // Mức độ 1: Sentiment
  level2Risk: WarningLevel2Risk;           // Mức độ 2: Risk
  level3Action: WarningLevel3Action;       // Mức độ 3: Actionable Alert
  informationVacuum?: InformationVacuumAssessment; // Đánh giá Khoảng trống Thông tin & Cấp độ Cảnh báo (Information Vacuum Gatekeeper)
  executiveBrief: string; // Tóm tắt điều hành 1 đoạn dành riêng cho Lãnh đạo Bộ
  standardizedJsonOutput?: StandardizedWarningSystemOutput; // Toàn văn JSON Schema chuẩn phục vụ vibe coding
  formulaMetrics?: {
    S: number; // Inherent threat to institutional credibility [0 - 50]
    D: number; // Discrepancy between leadership directives and actual empirical reality [0 - 20]
    V: number; // Media propagation speed and cross-platform spread [0.0 - 1.0]
    I: number; // Scope of affected population/entities [0.0 - 1.0]
    rawRiskScore: number;
    calculationFormula: string;
    severityOutput?: any;
    divergenceOutput?: any;
    impactOutput?: any;
  };
  narrativeDivergence?: {
    detected: boolean;
    details: string | null;
  };
  decree376Audit?: {
    tier: 0 | 1 | 2 | 3;
    tierLabelVi: string;
    scenarioCode?: string;
    decreeClause: string;
    leadAgency: string;
    cooperatingAgencies?: string[];
    actionScript: string;
    emergencyPlaybook?: any;
  };
  generatedAt?: string;
}

export interface TimestampAnomalyItem {
  id?: string;
  title: string;
  source: string;
  url?: string;
  rawPublishedAt?: string;
  rawPublishedTimestamp?: number;
  parsedTimestamp?: number;
  parsedDateIso?: string;
  parsedDateVn?: string;
  rawUtcParsed?: string;
  discrepancyType: string;
  details: string;
  deltaHoursWithNow?: number;
  deltaMinsWithTimestampField?: number;
}

export interface TimestampIntegrityReport {
  totalChecked: number;
  validCount: number;
  anomalousCount: number;
  integrityRate: number; // percentage, e.g. 98.5%
  anomaliesByReason: {
    reason: string;
    count: number;
    sampleArticleTitles: string[];
  }[];
  detailedAnomalies?: TimestampAnomalyItem[];
  checkedAt: string;
}

export interface ReaderComment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  sentiment: 'positive' | 'negative' | 'neutral' | 'skeptical';
  sentimentScore: number; // -100 to +100
  sourceOutlet: string; // e.g., 'VnExpress', 'Tuổi Trẻ', 'Dân Trí', 'Thanh Niên', 'Vietstock', 'CafeF'
  reactionType?: 'agreement' | 'disagreement' | 'question' | 'concern';
  replyCount?: number;
}

export interface PublicReactionAnalysis {
  totalCommentsAnalyzed: number;
  publicSentimentScore: number; // -100 to +100
  positiveRatio: number; // 0 to 100 (%)
  negativeRatio: number; // 0 to 100 (%)
  neutralRatio: number; // 0 to 100 (%)
  skepticalRatio: number; // 0 to 100 (%)
  consensusGapWithMedia: number; // Chênh lệch giữa sắc thái báo chí và phản ứng độc giả
  divergenceLevel: 'ALIGNED' | 'MILD_DIVERGENCE' | 'CRITICAL_DISCONNECT';
  topConcerns: string[]; // Mối quan ngại lớn nhất của độc giả
  representativeComments: ReaderComment[];
  publicReactionSummary: string;
}

export interface LegalStatuteGround {
  statute: string; // Tên văn bản (Nghị định 72/2013/NĐ-CP, Nghị định 15/2020/NĐ-CP, Luật An ninh mạng 2018)
  clause: string; // Điều khoản cụ thể
  description: string; // Diễn giải hành vi vi phạm
  sanctionRange: string; // Khung xử phạt hành chính hoặc biện pháp cưỡng chế
}

export interface ViolationEvidenceDossier {
  dossierId: string; // e.g. HS-VP-2026-09-8421
  officialCode: string; // Số: 142/BB-BTC-TT
  articleId: string;
  articleTitle: string;
  targetUrl: string;
  sourceOutlet: string;
  publisher?: string;
  capturedAtIso: string;
  capturedAtVn: string;
  sha256EvidenceHash: string; // Mã băm mật mã toàn vẹn dữ liệu SHA-256
  violationSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  legalGrounds: LegalStatuteGround[];
  infringingExcerpts: string[]; // Trích dẫn nguyên văn câu từ vi phạm
  assessedImpact: string; // Đánh giá hậu quả đối với quản lý tài chính - tiền tệ
  recommendedActions: string[]; // Đề xuất xử lý
  referralRecipients: {
    agency: string;
    role: string;
    requestedAction: string;
  }[];
  snapshotDataUrl?: string; // Ảnh chụp màn hình lưu trữ bằng chứng Base64
  digitalSealVerified: boolean;
  status: 'DRAFTED' | 'SEALED' | 'DISPATCHED';
}

export interface SentimentKeywordToken {
  word: string;
  category: 'positive' | 'negative' | 'mof_core' | 'neutral';
  weight: number; // point impact e.g. +8, -12
  contextExcerpt?: string;
}

export interface SentimentScoreDecomposition {
  keywordPolarityScore: number; // Điểm từ khóa cảm xúc (-40 đến +40)
  policyContextScore: number; // Điểm ngữ cảnh chính sách (-25 đến +25)
  impactIntensityScore: number; // Điểm cường độ phản ánh (-20 đến +20)
  authorityBuzzScore: number; // Điểm khuếch đại uy tín nguồn & lan truyền (-15 đến +15)
  totalScore: number; // -100 đến +100
  positiveKeywords: string[]; // Từ khóa tích cực được phát hiện
  negativeKeywords: string[]; // Từ khóa tiêu cực được phát hiện
  mofDomainKeywords: string[]; // Từ khóa thể chế / nghiệp vụ MoF
  tokens: SentimentKeywordToken[]; // Danh sách token chi tiết
}

export interface SentimentDiagnostic {
  polarity: SentimentType;
  score: number; // -100 to +100
  whyExplanation: string; // Lý giải chi tiết: Vì sao tiêu cực hoặc Vì sao tích cực
  keyDrivers: string[]; // Các nhân tố then chốt (Điểm sáng nổi bật hoặc Rủi ro chính yếu)
  impactChain?: NegativeImpactChain; // Chuỗi tác động hệ quả liên ngành (dành riêng cho bài viết tiêu cực/rủi ro)
  decomposition?: SentimentScoreDecomposition; // Bóc tách thành phần điểm số & từ khóa trọng điểm
  actionablePlan: {
    title: string; // Tiêu đề kế hoạch (vd: "Kế hoạch Phát huy Điểm mạnh & Lan tỏa Truyền thông" hoặc "Kế hoạch Kiểm soát Rủi ro & Xử lý Khủng hoảng")
    steps: string[]; // 3-4 bước tác chiến cụ thể cho Lãnh đạo và cơ quan chuyên môn
    targetOutcome: string; // Kết quả đầu ra mong đợi
  };
}

export interface ImpactChainNode {
  sector: SectorType;
  sectorNameVi: string;
  order: number; // 1 = Trực tiếp, 2 = Thứ cấp / Lan tỏa, 3 = Hệ thống / Toàn diện
  level: 'DIRECT' | 'SECONDARY' | 'SYSTEMIC';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  mechanism: string; // Kênh truyền dẫn / Cơ chế lây lan rủi ro
  consequence: string; // Tác động / Thiệt hại cụ thể tại lĩnh vực này
  preventiveMitigation: string; // Giải pháp can thiệp ngăn chặn đứt gãy chuỗi
}

export interface NegativeImpactChain {
  originSector: SectorType;
  originSectorNameVi: string;
  rootIssue: string; // Vấn đề rủi ro gốc rễ
  transmissionPathSummary: string; // Mô tả vắn tắt đường truyền dẫn (e.g. Trái phiếu ➔ Bất động sản ➔ Tín dụng ➔ Thu NSNN)
  spilloverRiskLevel: 'CRITICAL' | 'ELEVATED' | 'MODERATE'; // Cấp độ nguy cơ lan tỏa
  chainNodes: ImpactChainNode[]; // Các nấc tác động trong 16 lĩnh vực của Bộ Tài chính
  containmentRecommendation: string; // Khuyến nghị Lãnh đạo khoanh vùng và cắt đứt chuỗi lây lan
}

export interface MediaGapAnalysis {
  hasGap: boolean; // Có phát hiện khoảng trống truyền thông / thiếu hụt thông tin chính sách không?
  gapSeverity: 'HIGH' | 'MEDIUM' | 'LOW';
  topicConcern: string; // Vấn đề dư luận, người dân, DN đang quan tâm / lúng túng
  informationDeficit: string; // Khoảng trống thông tin: Chưa được giải thích cặn kẽ điều gì, thiếu hướng dẫn nào
  citizenBizGuidance: string[]; // Tư vấn cụ thể: Người dân, Doanh nghiệp cần làm gì ngay (hồ sơ, thủ tục, tra cứu ở đâu)
  proactiveGovAction: {
    leadAgency: string; // Đơn vị chủ trì (Cục Thuế, UBCKNN, Tổng cục Hải quan, Cục Quản lý Giá...)
    campaignTitle: string; // Chiến dịch truyền thông đề xuất (vd: "Phát hành Cẩm nang Q&A Hướng dẫn Kê khai Thuế TMĐT")
    communicationSteps: string[]; // Các biện pháp chủ động tăng cường tin bài (Infographic, Họp báo, Livestream giải đáp, Công văn nghiệp vụ)
  };
}

export type TrendForecastDirection = 'increasing' | 'decreasing' | 'sideways';

export interface KeywordHistoricalDataPoint {
  timeLabel: string; // e.g. "T-24h", "T-18h", "T-12h", "T-6h", "Hiện tại"
  mentions: number;
  sentimentScore: number;
  authorityWeightSum?: number;
}

export interface BuzzKeyword {
  keyword: string;
  category: string;
  mentions: number;
  weight: number; // Trọng số ưu tiên (1.0 - 5.0)
  sentiment: SentimentType;
  sentimentScore: number;
  isHot?: boolean;
  isCoreMof?: boolean;
  velocityPercent?: number;
  momentumStatus?: 'surging' | 'rising' | 'stable' | 'cooling';
  momentumLabel?: string;
  sentimentBreakdown?: { bullish: number; bearish: number; neutral: number };
  recentArticles?: ScrapedNewsItem[];

  // --- Phân tích & Dự báo Xu hướng 24 Giờ qua ---
  trendScore?: number; // Điểm xu hướng tổng hợp từ 0 đến 100 (>= 60: Tăng, 40-59: Đi ngang, < 40: Giảm)
  trendDirection?: TrendForecastDirection; // 'increasing' (Tăng), 'decreasing' (Giảm), 'sideways' (Đi ngang)
  trendDeltaPercent?: number; // Phần trăm biến động gia tốc so với mốc nền 24h trước (e.g. +38.5%, -15.2%)
  trendForecastLabel?: string; // Nhãn mô tả dự báo (e.g. "Dự báo: Tăng mạnh (+35%)", "Dự báo: Ổn định (Đi ngang)")
  historicalDataPoints?: KeywordHistoricalDataPoint[]; // Các điểm dữ liệu chuỗi thời gian 24h qua (4 - 6 mốc thời gian)
  confidenceScore?: number; // Độ tin cậy của mô hình dự báo (%) dựa trên mật độ tin và trọng số nguồn chính thống
  forecastReasoning?: string; // Căn cứ lý giải dự báo xu hướng (Vietnamese analytical narrative)
}

export interface NegativeNewsCluster {
  id: string;
  topicTitle: string; // Tên chủ đề tiêu cực gom nhóm (e.g. "Áp lực đáo hạn Trái phiếu doanh nghiệp & Rủi ro thanh khoản")
  sector: SectorType;
  sectorNameVi: string;
  articleCount: number; // e.g. 3 bài
  urgencyLevel: 'high' | 'medium' | 'low';
  summary: string; // Tóm tắt thực trạng phản ánh của nhóm bài
  rootCauses: string[]; // Vì sao tiêu cực / Các nguyên nhân gốc rễ
  riskPoints: string[]; // Điểm nghẽn / Rủi ro nếu không can thiệp
  articles: ScrapedNewsItem[]; // Danh sách các bài báo cụ thể trong cụm
  mediaResponsePlan: {
    targetStrategy: string; // Chiến lược truyền thông (Ví dụ: Định hướng dư luận & minh bạch dòng tiền)
    leadAgency: string; // Đơn vị chủ trì tham mưu (Cục QLN&TCĐN / Cục Thuế / UBCKNN...)
    spokespersonAction: string; // Hành động phát ngôn cụ thể
    keyTalkingPoints: string[]; // 3-4 thông điệp then chốt cần phát ngôn
    actionableSteps: string[]; // Các bước tác chiến (Họp báo, Thông cáo báo chí, Ban hành văn bản hướng dẫn...)
  };
}

export interface CommunicationGapItem {
  id: string;
  topic: string; // Tên vấn đề (Ví dụ: "Quy định kê khai thuế sàn TMĐT xuyên biên giới & Hộ kinh doanh online")
  sector: SectorType;
  sectorNameVi: string;
  publicInterestLevel: 'very_high' | 'high' | 'medium'; // Độ quan tâm của Dư luận / Người dân / DN
  buzzVolumeDesc: string; // Mô tả mật độ tìm kiếm / quan tâm (Ví dụ: "Dư luận và doanh nghiệp đặc biệt quan tâm, thảo luận tăng 140%")
  gapDescription: string; // Khoảng trống thông tin (Chưa được thông tin đầy đủ, chưa giải thích chính sách, thiếu cẩm nang hướng dẫn)
  potentialRisks: string[]; // Nguy cơ nếu để khoảng trống (Bị hiểu sai quy định, tin đồn thất thiệt, hoang mang, phản ứng chính sách)
  whatPeopleNeedToKnow: string[]; // Người dân & Doanh nghiệp thực sự cần làm gì / cần hiểu gì
  proactiveActionPlan: {
    recommendedCampaign: string; // Chiến dịch truyền thông chủ động đề xuất
    leadUnit: string; // Đơn vị phụ trách (Cục Thuế / UBCKNN...)
    tactics: string[]; // Hành động cụ thể: 1. Ban hành FAQ 20 câu hỏi thường gặp; 2. Xuất bản Infographic hướng dẫn 3 bước; 3. Tổ chức tọa đàm trực tuyến...
    priorityLevel: 'Khẩn cấp' | 'Ưu tiên cao' | 'Trung hạn';
  };
  relatedArticles?: ScrapedNewsItem[];
}

export interface SentimentDeepReasoning {
  sentiment: SentimentType;
  score: number;
  whyNegative?: {
    rootCause: string;
    riskKeywords: string[];
    adversePublicPerception: string;
    systemicImplication: string;
    mitigationRecommendation: string;
  };
  positiveAnalysis?: {
    strengthsIdentified: string[];
    coreDrivers: string;
    marketConfidenceBoost: string;
    amplificationPlan: string[]; // Đề xuất phương án phát huy điểm mạnh & lan tỏa
  };
  neutralAnalysis?: {
    balancedViewpoints: string[];
    watchPoints: string[];
  };
}

export interface SentimentOverview {
  bullishPercentage: number;
  bearishPercentage: number;
  neutralPercentage: number;
  totalArticles: number;
  overallMood: 'Rất Lạc Quan' | 'Lạc Quan' | 'Trung Lập' | 'Thận Trọng' | 'Tiêu Cực' | string;
  moodScore: number; // 0 to 100 (Chỉ số sắc thái tin tức tổng quát: M = X + Y*A - Z*B)
  keyDriver: string;
  alertLevel?: 0 | 1 | 2 | 3 | 4 | 5; // 0: Tốt (>=85), 1: Cảnh báo Mức 1 (79-84), 2: Cảnh báo Mức 2 (75-78), 3: Cảnh báo Mức 3 (70-74), 4: Cảnh báo Mức 4 (60-69), 5: Cảnh báo Khẩn cấp (<60)
  alertLabel?: string;
  alertDescription?: string;
  crisisProtocolRecommended?: boolean; // True nếu M < 60 (Cảnh báo mức khẩn cấp)
  formulaComponents?: {
    X: number; // % tin trung tính
    Y: number; // % tin tích cực
    Z: number; // % tin tiêu cực
    A: number; // Hệ số củng cố tin tích cực
    B: number; // Hệ số răn đe / phạt tin tiêu cực
    M: number; // Điểm tổng quát
    status: 'good' | 'warn1' | 'warn2' | 'warn3' | 'warn4' | 'emergency';
  };
  negativeClusters?: NegativeNewsCluster[];
  communicationGaps?: CommunicationGapItem[];
}

export interface SectorStat {
  sector: SectorType;
  name: string;
  count: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  isTrending?: boolean; // Phát hiện đột biến thảo luận (Trend Volatility)
}

export interface TimelineDataPoint {
  timeLabel: string;
  articleCount: number;
  bullishCount: number;
  bearishCount: number;
}

export type MinistryAlertCategory =
  | 'CRITIQUE'                // Chỉ trích / Lên án cơ chế, quản lý của Bộ & đơn vị trực thuộc
  | 'PROCEDURE_COMPLAINT'     // Bức xúc thủ tục hành chính, chậm hoàn thuế, ách tắc hải quan
  | 'PETITION_DIFFICULTY'     // Kiến nghị, kêu cứu, khó khăn của doanh nghiệp & nhà đầu tư
  | 'ACCOUNTABILITY_IMPACT'   // Vụ việc nghiêm trọng ảnh hưởng vai trò, trách nhiệm, uy tín của Bộ (Đang phát sinh)
  | 'POST_INCIDENT_MONITORING'// Điểm tin vụ án / Vụ việc đã xử lý / Tố tụng đã ngã ngũ / Rà soát gói thầu cũ (Chỉ điểm tin giám sát, KHÔNG cảnh báo khẩn)
  | 'MARKET_OBJECTIVE';       // Biến động thị trường khách quan (Không xếp vào diện khẩn cấp)

export interface UrgentAlert {
  id: string;
  title: string;
  timeAgo: string;
  sector: SectorType;
  impact: ImpactLevel;
  summary: string;
  tickers: string[];
  isEmergency?: boolean; // Cảnh báo khẩn cấp rủi ro đỏ (Red Alerts)
  alertCategory?: MinistryAlertCategory;
  categoryLabelVi?: string;
  urgencyReason?: string;
  isObjectiveMarket?: boolean;
}

export interface ExecutiveSummaryReport {
  scannedWindow: string;
  totalAnalyzed: number;
  crisisCount: number; // Số vụ việc nguy cơ / tiêu cực cần xử lý khủng hoảng
  positiveCount: number; // Số điểm sáng / tích cực cần truyền thông lan tỏa
  policyGuidanceCount: number; // Số vụ việc hướng dẫn cơ chế chính sách
  overallStrategicAdvice: string; // Chỉ đạo chiến lược tổng thể cho Lãnh đạo
  generalSummary?: string; // Tóm tắt tình hình chung
  crisisSummary?: string; // Tóm tắt các vấn đề rủi ro/khủng hoảng
  positiveSummary?: string; // Tóm tắt các điểm sáng tích cực
  mediaDirective?: string; // Định hướng truyền thông chính
  topCrisisDirectives: ScrapedNewsItem[]; // Danh sách các vụ việc tiêu cực / nguy cơ
  topPositiveDirectives: ScrapedNewsItem[]; // Danh sách các điểm sáng cần lan tỏa
}

export interface AbsoluteTimeBounds {
  startTimeMs: number;
  endTimeMs: number;
  startTimeIso: string; // ISO GMT+7 string (e.g. "2026-08-19T17:00:00+07:00")
  endTimeIso: string;   // ISO GMT+7 string (e.g. "2026-08-19T18:00:00+07:00")
  vnStartTimeStr: string; // Readable Vietnam Time string ("19/08/2026 17:00:00")
  vnEndTimeStr: string;   // Readable Vietnam Time string ("19/08/2026 18:00:00")
  timeZone: string;     // "Asia/Ho_Chi_Minh (UTC+7)"
  maxMinutes: number;
}

export interface ScrapeResponse {
  success: boolean;
  timestamp: string;
  serverTimeIso?: string;
  timeBounds?: AbsoluteTimeBounds;
  vnStartTimeStr?: string;
  vnEndTimeStr?: string;
  scannedWindow: string; // e.g. "Phiên 1 giờ (19/08/2026 17:00:00 ➔ 19/08/2026 18:00:00 - Giờ VN)"
  query?: string;
  sector: SectorType;
  totalFound: number;
  news: ScrapedNewsItem[];
  sentimentOverview: SentimentOverview;
  trendingKeywords: BuzzKeyword[];
  sectorStats: SectorStat[];
  timelineData: TimelineDataPoint[];
  urgentAlerts: UrgentAlert[];
  sourceStats: { name: string; count: number }[];
  executiveSummaryReport?: ExecutiveSummaryReport; // Báo cáo tham mưu Lãnh đạo tổng hợp
  droppedCount?: number;
  droppedArticles?: ScrapedNewsItem[];
}

export type NewsSortOption =
  | 'time_desc' // Mới nhất xuất bản trước (Giờ đăng giảm dần)
  | 'time_asc' // Cũ nhất xuất bản trước (Giờ đăng tăng dần)
  | 'crawl_desc' // Mới xuất hiện trong phiên quét lên đầu (Phiên quét gần nhất)
  | 'crawl_asc' // Xuất hiện đầu phiên quét (Phiên quét từ đầu)
  | 'mof_weight_desc' // Ưu tiên Trọng Số MoF ★
  | 'buzz_desc' // Sức hút dư luận (Buzz)
  | 'sentiment_desc'; // Điểm Tích cực nhất

export type NewsFeedViewMode = 'compact' | 'detailed';

export interface LeadershipDraftStatement {
  headline: string;
  type: 'press_release' | 'official_clarification' | 'spokesperson_qna' | 'success_broadcast';
  issuingAgency: string;
  targetAudience: string;
  keyMessage: string;
  keyPoints: string[];
  fullDraftText: string;
  talkingPointsForLeadership: string[];
}

export interface PolicyAdvisorySubmission {
  documentHeader: {
    issuingMinistry: string;
    officeUnit: string;
    documentTitle: string;
    urgencyLevel: 'THƯỢNG KHẨN' | 'KHẨN' | 'BÌNH THƯỜNG';
    dateString: string;
  };
  executiveSummary: string;
  problemIdentification: {
    coreIssue: string;
    affectedDomains: string[];
    riskScore: number;
    riskLevel: string;
    rootCauses: string[];
  };
  impactAssessment: {
    fiscalBudgetImpact: string;
    marketFinancialImpact: string;
    publicOpinionImpact: string;
  };
  strategicActionOptions: {
    optionCode: string;
    optionName: string;
    description: string;
    pros: string[];
    cons: string[];
    riskMitigation: string;
    isRecommendedOption?: boolean;
  }[];
  finalLeadershipRecommendation: {
    recommendedOptionCode: string;
    justification: string;
    immediateActionPlan: string[];
    assignedUnits: { agencyName: string; taskDescription: string; deadline: string }[];
  };
  draftOfficialDirectiveText: string;
}

export interface AlertIgnoreRule {
  id: string;
  pattern: string; // Từ khóa, cụm từ hoặc biểu thức mẫu (không phân biệt chữ hoa/thường)
  description?: string;
  category?: 'corporate_dividend' | 'capital_increase' | 'macro_research' | 'routine_legal' | 'governance_reform' | 'banking_infrastructure' | 'routine_business' | 'custom';
  enabled: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AlertTriggerRule {
  id: string;
  name: string;
  keywords: string[];
  negationExceptions?: string[]; // Các từ/cụm từ phủ định hoặc chỉ đạo điều hành loại trừ không kích hoạt (VD: 'không buông lỏng', 'đôn đốc giải ngân')
  minBuzzScore: number;
  minImpactScore?: number;
  requireVelocitySpike: boolean;
  requireTier1: boolean;
  sentimentFilter: 'all' | 'bearish_only' | 'bullish_only';
  enabled: boolean;
  priorityLevel: 'critical' | 'high' | 'medium';
  alertLevel?: WarningAlertLevelType; // Cấp độ cảnh báo tương ứng: 'EMERGENCY' | 'RAPID' | 'EARLY' | 'DISTANT' | 'STANDARD'
  soundEnabled: boolean;
  notifyChannels: ('toast' | 'modal' | 'browser')[];
  category: 'mof_core' | 'tax_customs' | 'market_capital' | 'macro_fx' | 'custom';
  activationStandard?: string; // Tiêu chuẩn kích hoạt cụ thể
}

export interface ActiveAlertNotification {
  id: string;
  triggerId: string;
  triggerName: string;
  priorityLevel: 'critical' | 'high' | 'medium';
  alertLevel?: WarningAlertLevelType; // 5 official alert levels: 'DISTANT' | 'EARLY' | 'RAPID' | 'STANDARD' | 'EMERGENCY'
  article: ScrapedNewsItem;
  triggeredAt: string;
  matchedKeywords: string[];
  isSimulated?: boolean;
  informationGap?: string; // Khoảng trống thông tin nhận diện (Quy định chưa rõ, thiếu hướng dẫn, còn tranh luận, băn khoăn...)
  actionRequired?: string; // Việc cần làm ngay về mặt chính sách (SOP hành động chuẩn)
  publicConfusionRisk?: string; // Nguy cơ nếu để trống thông tin
  responsibleUnit?: string; // Đơn vị chủ trì thực hiện
}

export interface DeepDiveAnalysis {
  title: string;
  executiveSummary: string;
  marketImpact: {
    shortTerm: string;
    mediumTerm: string;
    affectedAssets: string[];
  };
  socialSentimentAnalysis: {
    communityReaction: string;
    rumorsOrDebates: string;
    sentimentPolarity: string;
  };
  recommendations: {
    investorAction: string;
    riskWatchouts: string[];
  };
  executiveDirective?: ExecutiveDirective;
}

export type LeadershipLevel = 'executive' | 'technical_analyst' | 'simplified_public';
export type SummaryLengthMode = 'ultra_concise' | 'standard' | 'deep';

export interface TailoredReSummary {
  title: string;
  audienceLevel: LeadershipLevel;
  audienceLabel: string;
  lengthMode: SummaryLengthMode;
  readingTime: string;
  headline: string;
  summaryText: string;
  bulletPoints: string[];
  recommendation: string;
  isAiGenerated: boolean;
}

export function formatNewsFullDateTime(item: { publishedAt?: string; publishedTimestamp?: number; publishedTimeStr?: string }): string {
  const ts = item.publishedTimestamp || (item.publishedAt ? new Date(item.publishedAt).getTime() : 0);
  if (!ts || isNaN(ts)) return item.publishedTimeStr || 'Vừa cập nhật';

  const d = new Date(ts + 7 * 3600 * 1000); // Vietnam GMT+7
  const pad = (n: number) => String(n).padStart(2, '0');
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const day = pad(d.getUTCDate());
  const month = pad(d.getUTCMonth() + 1);
  const year = d.getUTCFullYear();

  const nowVn = new Date(Date.now() + 7 * 3600 * 1000);
  const isToday = d.getUTCFullYear() === nowVn.getUTCFullYear() &&
                  d.getUTCMonth() === nowVn.getUTCMonth() &&
                  d.getUTCDate() === nowVn.getUTCDate();

  if (isToday) {
    return `Hôm nay ${hours}:${minutes}`;
  }
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function formatCrawlTimeDisplay(item: { scrapedAt?: string; scrapedTimestamp?: number; discoveredOrder?: number; isCurrentSession?: boolean }): string {
  const ts = item.scrapedTimestamp || (item.scrapedAt ? new Date(item.scrapedAt).getTime() : 0);
  if (!ts || isNaN(ts)) return '';
  const d = new Date(ts + 7 * 3600 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = pad(d.getUTCHours());
  const m = pad(d.getUTCMinutes());
  const s = pad(d.getUTCSeconds());
  const orderStr = item.discoveredOrder ? ` (#${item.discoveredOrder})` : '';
  return `${h}:${m}:${s}${orderStr}`;
}

export function formatNewsTimeDisplay(item: { publishedAt?: string; publishedTimestamp?: number; publishedTimeStr?: string; timeAgo?: string }): string {
  const dateTimeStr = formatNewsFullDateTime(item);
  const ago = item.timeAgo || 'Gần đây';
  if (dateTimeStr && dateTimeStr !== 'Vừa cập nhật') {
    return `${dateTimeStr} • ${ago}`;
  }
  return ago;
}

export interface ManagementFieldDef {
  clusterId: number; // 1 to 18
  code: string; // e.g. "Cụm 1"
  name: string; // e.g. "Thuế & Quản lý thu NSNN"
  fullTitle: string; // e.g. "Cụm 1: Thuế & Quản lý thu NSNN"
}

export const MANAGEMENT_FIELDS_18: Record<string, ManagementFieldDef> = {
  tax: { clusterId: 1, code: 'Cụm 1', name: 'Thuế & Quản lý thu NSNN', fullTitle: 'Cụm 1: Thuế & Quản lý thu NSNN' },
  customs: { clusterId: 2, code: 'Cụm 2', name: 'Hải quan & Xuất nhập khẩu', fullTitle: 'Cụm 2: Hải quan & Xuất nhập khẩu' },
  treasury_budget: { clusterId: 3, code: 'Cụm 3', name: 'Kho bạc & Ngân sách Nhà nước', fullTitle: 'Cụm 3: Kho bạc & Ngân sách Nhà nước' },
  bonds: { clusterId: 4, code: 'Cụm 4', name: 'Trái phiếu Doanh nghiệp & TPCP', fullTitle: 'Cụm 4: Trái phiếu Doanh nghiệp & TPCP' },
  stocks: { clusterId: 5, code: 'Cụm 5', name: 'Chứng khoán & Nâng hạng thị trường', fullTitle: 'Cụm 5: Chứng khoán & Nâng hạng thị trường' },
  price_management: { clusterId: 6, code: 'Cụm 6', name: 'Quản lý Giá & Bình ổn thị trường', fullTitle: 'Cụm 6: Quản lý Giá & Bình ổn thị trường' },
  insurance: { clusterId: 7, code: 'Cụm 7', name: 'Bảo hiểm & Giám sát bảo hiểm', fullTitle: 'Cụm 7: Bảo hiểm & Giám sát bảo hiểm' },
  public_investment: { clusterId: 8, code: 'Cụm 8', name: 'Đầu tư công & Giải ngân vốn', fullTitle: 'Cụm 8: Đầu tư công & Giải ngân vốn' },
  state_economy: { clusterId: 9, code: 'Cụm 9', name: 'Tài chính Doanh nghiệp Nhà nước & SCIC', fullTitle: 'Cụm 9: Tài chính Doanh nghiệp Nhà nước & SCIC' },
  public_debt: { clusterId: 10, code: 'Cụm 10', name: 'Nợ công & Tài chính đối ngoại', fullTitle: 'Cụm 10: Nợ công & Tài chính đối ngoại' },
  public_assets: { clusterId: 11, code: 'Cụm 11', name: 'Quản lý Tài sản công', fullTitle: 'Cụm 11: Quản lý Tài sản công' },
  inspection_audit: { clusterId: 12, code: 'Cụm 12', name: 'Thanh tra & Giám sát tài chính', fullTitle: 'Cụm 12: Thanh tra & Giám sát tài chính' },
  national_reserve: { clusterId: 13, code: 'Cụm 13', name: 'Dự trữ Quốc gia', fullTitle: 'Cụm 13: Dự trữ Quốc gia' },
  banking_credit: { clusterId: 14, code: 'Cụm 14', name: 'Ngân hàng & Tín dụng', fullTitle: 'Cụm 14: Ngân hàng & Tín dụng' },
  realestate: { clusterId: 15, code: 'Cụm 15', name: 'Bất động sản & Tài chính Đất đai', fullTitle: 'Cụm 15: Bất động sản & Đất đai' },
  fdi: { clusterId: 16, code: 'Cụm 16', name: 'Đầu tư Nước ngoài (FDI)', fullTitle: 'Cụm 16: Đầu tư Nước ngoài (FDI)' },
  fintech_digital: { clusterId: 17, code: 'Cụm 17', name: 'Tài chính số & Thuế TMĐT', fullTitle: 'Cụm 17: Tài chính số & Thuế TMĐT' },
  macro: { clusterId: 18, code: 'Cụm 18', name: 'Kinh tế Vĩ mô & Thể chế Tài chính', fullTitle: 'Cụm 18: Kinh tế Vĩ mô & Thể chế Tài chính' },

  crypto: { clusterId: 17, code: 'Cụm 17', name: 'Tài chính số & Thuế TMĐT', fullTitle: 'Cụm 17: Tài chính số & Thuế TMĐT' },
  gold: { clusterId: 18, code: 'Cụm 18', name: 'Kinh tế Vĩ mô & Thể chế Tài chính', fullTitle: 'Cụm 18: Kinh tế Vĩ mô & Thể chế Tài chính' },
  forex: { clusterId: 18, code: 'Cụm 18', name: 'Kinh tế Vĩ mô & Thể chế Tài chính', fullTitle: 'Cụm 18: Kinh tế Vĩ mô & Thể chế Tài chính' },
  enterprise: { clusterId: 9, code: 'Cụm 9', name: 'Tài chính Doanh nghiệp Nhà nước & SCIC', fullTitle: 'Cụm 9: Tài chính Doanh nghiệp Nhà nước & SCIC' },
  collective_economy: { clusterId: 18, code: 'Cụm 18', name: 'Kinh tế Vĩ mô & Thể chế Tài chính', fullTitle: 'Cụm 18: Kinh tế Vĩ mô & Thể chế Tài chính' },
  policy: { clusterId: 18, code: 'Cụm 18', name: 'Kinh tế Vĩ mô & Thể chế Tài chính', fullTitle: 'Cụm 18: Kinh tế Vĩ mô & Thể chế Tài chính' },
  people: { clusterId: 18, code: 'Cụm 18', name: 'Kinh tế Vĩ mô & Thể chế Tài chính', fullTitle: 'Cụm 18: Kinh tế Vĩ mô & Thể chế Tài chính' },
  all: { clusterId: 18, code: 'Cụm 18', name: 'Kinh tế Vĩ mô & Thể chế Tài chính', fullTitle: 'Cụm 18: Kinh tế Vĩ mô & Thể chế Tài chính' },
};

export function get18ManagementField(item: { sector?: SectorType; sectors?: SectorType[]; sectorNameVi?: string }): ManagementFieldDef {
  const primarySector = item.sector;
  if (primarySector && MANAGEMENT_FIELDS_18[primarySector]) {
    return MANAGEMENT_FIELDS_18[primarySector];
  }

  if (item.sectors && item.sectors.length > 0) {
    for (const sec of item.sectors) {
      if (MANAGEMENT_FIELDS_18[sec]) {
        return MANAGEMENT_FIELDS_18[sec];
      }
    }
  }

  return MANAGEMENT_FIELDS_18.macro;
}

export type ViewDensityMode = 'executive' | 'standard' | 'deep';

// ============================================================================
// NEWS DATABASE & QUERY ENGINE TYPES
// ============================================================================

export interface NewsArticleRecord {
  id: string;
  title: string;
  content: string; // Nội dung chi tiết bài viết
  summary?: string; // Tóm tắt ngắn gọn
  snippet?: string;
  url: string; // URL nguồn tin gốc
  publishedAt: string; // ISO 8601 string
  publishedTimestamp: number; // Milliseconds timestamp for fast range queries
  publishedTimeStr?: string; // e.g. "14:35 29/08/2026"
  timeAgo?: string;
  source: string; // Nguồn tin (e.g. Báo Đầu Tư, CafeF, VnEconomy, Cục Thuế...)
  sourceNormalized?: string;
  sector?: string; // Lĩnh vực (tax, customs, bonds, stocks, macro...)
  sectorNameVi?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  sentimentScore?: number;
  sentimentReason?: string;
  impactLevel?: 'high' | 'medium' | 'low';
  impactScore?: number;
  buzzScore?: number;
  keyPoints?: string[];
  keyPeople?: string[];
  agencies?: string[];
  tickers?: string[];
  policyTags?: string[];
  sixW?: SixWAnalysis;
  executiveDirective?: ExecutiveDirective;
  authorityLevel?: 'official' | 'top_tier' | 'standard' | 'unverified';
  isOfficialSource?: boolean;
  isEmergency?: boolean;
  publishedDate?: string; // YYYY-MM-DD
  publishedYear?: number;
  publishedMonth?: number;
  publishedDay?: number;
  publishedHour?: number;
  crawledAt: string;
  crawledTimestamp: number;
  scrapedDateFormatted?: string; // Formatted VN time "07/09/2026 16:12:00"
  scrapedDate?: string; // YYYY-MM-DD "2026-09-07"
  scrapedYear?: number;
  scrapedMonth?: number;
  scrapedDay?: number;
  scrapedHour?: number;
  linkAuditStatus?: 'ok' | 'dead_link' | 'mismatch' | 'unchecked';
  deduplicationHash?: string; // Mã băm mật mã SHA-256 / MD5 URL chống lặp
  archivedAt?: string; // Thời điểm ghi vào kho lưu trữ định dạng ISO
  archivedAtMs?: number; // Timestamp kho lưu trữ
  retentionTier?: 'HOT' | 'WARM' | 'COLD'; // Phân tầng lưu trữ (Hot: <30 ngày, Warm: <365 ngày, Cold: >365 ngày)
  imageUrl?: string;
  author?: string;
  commentCount?: number;
  syndicationCount?: number;
  wordCount?: number;
  tags?: string[];
}

export interface NewsDbQueryCriteria {
  keyword?: string; // Từ khóa tìm kiếm trong title, content, entities
  sources?: string[]; // Danh sách nguồn tin cần lọc
  timeFilter?: {
    startTime?: number | string | Date; // Thời gian bắt đầu
    endTime?: number | string | Date; // Thời gian kết thúc
    preset?: '1h' | '2h' | '4h' | '8h' | '24h' | '7d' | '30d' | 'all' | 'custom';
  };
  // Lọc chi tiết theo ngày, giờ, tháng, năm
  year?: number | string; // Lọc theo năm (vd: 2026, 2025...)
  month?: number | string; // Lọc theo tháng (1 - 12)
  day?: number | string; // Lọc theo ngày trong tháng (1 - 31)
  hour?: number | string; // Lọc theo giờ cụ thể (0 - 23)
  hourFrom?: number | string; // Khung giờ từ (0 - 23)
  hourTo?: number | string; // Khung giờ đến (0 - 23)
  exactDate?: string; // Ngày chính xác 'YYYY-MM-DD'
  dateFrom?: string; // Từ ngày 'YYYY-MM-DD'
  dateTo?: string; // Đến ngày 'YYYY-MM-DD'
  scope?: 'database' | 'session'; // Phạm vi: 'database' (toàn bộ CSDL lưu trữ) hoặc 'session' (phiên quét hiện tại)
  sectors?: string[]; // Lọc theo danh mục/lĩnh vực
  sentiments?: ('bullish' | 'bearish' | 'neutral')[]; // Lọc theo cảm xúc
  impactLevels?: ('high' | 'medium' | 'low')[]; // Lọc theo mức độ tác động
  minSentimentScore?: number;
  maxSentimentScore?: number;
  minBuzzScore?: number;
  isOfficialOnly?: boolean;
  sortBy?: 'publishedAt' | 'sentimentScore' | 'buzzScore' | 'impactScore' | 'relevance' | 'title';
  sortOrder?: 'desc' | 'asc';
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
}

export interface NewsDbQueryResult {
  articles: NewsArticleRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  executionTimeMs: number;
  appliedCriteria: NewsDbQueryCriteria;
  hasMore: boolean;
}

export interface NewsDbSourceStat {
  source: string;
  count: number;
  percentage: number;
  avgSentimentScore: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  officialCount: number;
}

export interface NewsDbTimelinePoint {
  timeLabel: string;
  timestamp: number;
  totalCount: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
}

export interface NewsDbSectorStat {
  sector: string;
  sectorNameVi: string;
  count: number;
  percentage: number;
  avgSentimentScore: number;
  highImpactCount: number;
}

export interface NewsDbAnalyticsResult {
  totalArticles: number;
  uniqueSourcesCount: number;
  timeSpan: {
    earliest: string;
    latest: string;
    durationHours: number;
  };
  sourceDistribution: NewsDbSourceStat[];
  timelineDistribution: NewsDbTimelinePoint[];
  sentimentBreakdown: {
    bullish: number;
    bearish: number;
    neutral: number;
    bullishPercentage: number;
    bearishPercentage: number;
    neutralPercentage: number;
    overallMood: 'bullish' | 'bearish' | 'neutral';
    marketMoodScore: number; // 0 - 100
  };
  sectorBreakdown: NewsDbSectorStat[];
  impactBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
  topKeywords: Array<{ keyword: string; count: number; weight: number }>;
  topEntities: {
    agencies: Array<{ name: string; count: number }>;
    people: Array<{ name: string; count: number }>;
    tickers: Array<{ name: string; count: number }>;
    policies: Array<{ name: string; count: number }>;
  };
  executiveInsights: string[];
  executionTimeMs: number;
}

export interface UserKnowledgeDocument {
  id: string;
  title: string;
  category: 'LEGAL' | 'POLICY_DRAFT' | 'MACRO_REPORT' | 'INTERNAL_DIRECTIVE' | 'RESEARCH_PAPER';
  fileName: string;
  fileSizeStr: string;
  uploadedAt: string;
  summary: string;
  contentSnippet: string;
  tags: string[];
  agency?: string;
  isActiveForAI: boolean;
  wordCount?: number;
  extractedEntities?: string[];
  updatedAt?: number;
}

export interface AiExclusionRule {
  id: string;
  name: string;
  userNote: string;
  category: 'bds_quang_cao' | 'ngoai_nganh' | 'giai_tri_doi_song' | 'nham_tu_khoa' | 'tin_rac' | 'tin_nuoc_ngoai' | 'khac' | string;
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

export interface AiExclusionAnalyzeResponse {
  ruleName: string;
  category: string;
  keywords: string[];
  aiExplanation: string;
}

