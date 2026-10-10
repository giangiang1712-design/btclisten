export interface SemanticKeywordGroup {
  id: string;
  name: string;
  sector: string;
  sectorNameVi: string;
  primaryKeyword: string;
  synonyms: string[];
  contextRules: {
    mustIncludeAny?: string[];
    excludeWords?: string[];
    boostWeight?: number;
    targetAgencies?: string[];
    targetRegulations?: string[];
    description?: string;
  };
  isActive: boolean;
  isBuiltIn: boolean;
  updatedAt: string;
}

export interface MoFSectorInfo {
  id: string;
  nameVi: string;
  nameEn: string;
  department2026: string;
  iconName: string;
  description: string;
  color: string;
}

export const MOF_2026_SECTORS: MoFSectorInfo[] = [
  {
    id: 'leadership',
    nameVi: 'Lãnh đạo Bộ & Cán bộ Cấp cao',
    nameEn: 'Ministry Leadership & Senior Officials',
    department2026: 'Ban Cán sự Đảng & Lãnh đạo Bộ Tài chính',
    iconName: 'Shield',
    description: 'Phát ngôn, chỉ đạo điều hành của Bộ trưởng, các Thứ trưởng, Ban Cán sự Đảng và Thủ trưởng các Tổng cục/Cục/Vụ thuộc Bộ Tài chính.',
    color: 'rose',
  },
  {
    id: 'tax',
    nameVi: 'Thuế & Quản lý Thu Ngân sách',
    nameEn: 'Tax & Domestic Revenue Management',
    department2026: 'Cục Thuế',
    iconName: 'Receipt',
    description: 'Chính sách thuế GTGT, TNDN, TNCN, Thuế tối thiểu toàn cầu GMT, Hóa đơn điện tử, Chống thất thu thuế TMĐT.',
    color: 'emerald',
  },
  {
    id: 'customs',
    nameVi: 'Hải quan & Thương mại XNK',
    nameEn: 'Customs & International Trade',
    department2026: 'Tổng cục Hải quan',
    iconName: 'Ship',
    description: 'Thủ tục thông quan số, kiểm tra chuyên ngành, cán cân thương mại, biểu thuế XNK, chống buôn lậu & gian lận xuất xứ.',
    color: 'sky',
  },
  {
    id: 'public_investment',
    nameVi: 'Kế hoạch, Đầu tư công & Hạ tầng Chiến lược',
    nameEn: 'Public Investment & Strategic Infrastructure',
    department2026: 'Cục Quản lý Đầu tư công & Phát triển',
    iconName: 'Building2',
    description: 'Kế hoạch vốn đầu tư công trung hạn, giải ngân đại dự án quốc gia (cao tốc Bắc - Nam, sân bay Long Thành, đường sắt tốc độ cao), vốn ODA, đối tác PPP.',
    color: 'amber',
  },
  {
    id: 'stocks',
    nameVi: 'Chứng khoán & Thị trường Vốn',
    nameEn: 'Securities & Capital Market',
    department2026: 'Ủy ban Chứng khoán Nhà nước (UBCKNN)',
    iconName: 'TrendingUp',
    description: 'Vận hành TTCK (HOSE, HNX), nâng hạng thị trường FTSE/MSCI, cơ chế Non-prefunding (Thông tư 68), hệ thống KRX, giám sát giao dịch.',
    color: 'violet',
  },
  {
    id: 'bonds',
    nameVi: 'Trái phiếu Doanh nghiệp & TPCP',
    nameEn: 'Corporate & Government Bonds',
    department2026: 'Vụ Tài chính các Ngân hàng & TCTC',
    iconName: 'FileCheck',
    description: 'Thị trường TPDN riêng lẻ (NĐ 65/NĐ 08), áp lực đáo hạn trái phiếu, phát hành trái phiếu xanh, đấu thầu Trái phiếu Chính phủ.',
    color: 'indigo',
  },
  {
    id: 'treasury',
    nameVi: 'Kho bạc Nhà nước & Ngân sách Quốc gia',
    nameEn: 'State Treasury & National Budget',
    department2026: 'Kho bạc Nhà nước (KBNN) & Vụ Ngân sách Nhà nước',
    iconName: 'Landmark',
    description: 'Dự toán - quyết toán NSNN, kiểm soát chi ngân sách, quản lý ngân quỹ quốc gia, quản lý bội chi và cân đối tài khóa.',
    color: 'teal',
  },
  {
    id: 'price_management',
    nameVi: 'Quản lý Giá & Bình ổn Thị trường',
    nameEn: 'Price Management & Market Stabilization',
    department2026: 'Cục Quản lý Giá',
    iconName: 'Scale',
    description: 'Thi hành Luật Giá 2023, điều hành giá xăng dầu, giá điện, sách giáo khoa, hàng hóa thiết yếu, kiểm soát lạm phát mục tiêu.',
    color: 'orange',
  },
  {
    id: 'state_capital',
    nameVi: 'Kinh tế Nhà nước, DNNN & SCIC',
    nameEn: 'State-Owned Enterprises & Capital Investment (SCIC)',
    department2026: 'Cục Tài chính Doanh nghiệp & SCIC',
    iconName: 'Briefcase',
    description: 'Quản lý vốn nhà nước tại doanh nghiệp, kế hoạch thoái vốn - cổ phần hóa, tái cơ cấu tập đoàn/tổng công ty nhà nước.',
    color: 'blue',
  },
  {
    id: 'insurance',
    nameVi: 'Bảo hiểm & Thị trường Dịch vụ Tài chính',
    nameEn: 'Insurance & Financial Services Supervision',
    department2026: 'Cục Quản lý, Giám sát Bảo hiểm',
    iconName: 'ShieldCheck',
    description: 'Luật Kinh doanh bảo hiểm, thanh tra bancassurance, bảo hiểm nhân thọ & phi nhân thọ, phát triển quỹ hưu trí tự nguyện.',
    color: 'rose',
  },
  {
    id: 'public_debt',
    nameVi: 'Nợ công & Tài chính Đối ngoại',
    nameEn: 'Public Debt & External Finance',
    department2026: 'Cục Quản lý Nợ & Tài chính Đối ngoại',
    iconName: 'Globe',
    description: 'Chỉ tiêu an toàn nợ công, trần nợ chính phủ, đàm phán hiệp định vay ODA/ưu đãi, xếp hạng tín nhiệm quốc gia (S&P, Moody\'s, Fitch).',
    color: 'cyan',
  },
  {
    id: 'public_assets',
    nameVi: 'Tài sản công & Quản lý Công sản',
    nameEn: 'Public Assets Management',
    department2026: 'Cục Quản lý Công sản',
    iconName: 'Home',
    description: 'Luật Quản lý sử dụng tài sản công, sắp xếp cơ sở nhà đất công vụ, đấu giá tài sản công, quản lý khai thác tài sản kết cấu hạ tầng.',
    color: 'yellow',
  },
  {
    id: 'state_reserve',
    nameVi: 'Dự trữ Nhà nước & An ninh Vật tư',
    nameEn: 'National Reserves & Strategic Logistics',
    department2026: 'Tổng cục Dự trữ Nhà nước',
    iconName: 'Package',
    description: 'Quản lý kho dự trữ quốc gia, xuất cấp gạo cứu trợ thiên tai, dự trữ vật tư - trang thiết bị cứu hộ, an ninh lương thực quốc gia.',
    color: 'lime',
  },
  {
    id: 'green_finance',
    nameVi: 'Tài chính Xanh, ESG & Thị trường Carbon',
    nameEn: 'Green Finance, ESG & Carbon Market',
    department2026: 'Ban Đổi mới Phát triển Bền vững & Kinh tế Xanh',
    iconName: 'Leaf',
    description: 'Thành lập sàn giao dịch hạn ngạch phát thải & tín chỉ carbon, tiêu chí phân loại xanh (Green Taxonomy), trái phiếu xanh, Net Zero 2050.',
    color: 'green',
  },
  {
    id: 'fintech_digital',
    nameVi: 'Tài sản số, FinTech & Chuyển đổi số Ngành',
    nameEn: 'Digital Assets, FinTech & Financial Modernization',
    department2026: 'Cục Công nghệ Thông tin & Chuyển đổi số Tài chính',
    iconName: 'Cpu',
    description: 'Cơ chế thử nghiệm có kiểm soát (Sandbox), khung pháp lý tài sản ảo/tiền mã hóa, trung tâm dữ liệu tài chính số, hóa đơn điện tử AI.',
    color: 'purple',
  },
  {
    id: 'macro_growth',
    nameVi: 'Kinh tế Vĩ mô & Động lực Tăng trưởng 2 con số',
    nameEn: 'Macroeconomic Policy & Double-Digit Growth Drivers',
    department2026: 'Viện Chiến lược & Chính sách Tài chính',
    iconName: 'Zap',
    description: 'Kế hoạch phát triển kinh tế 5 năm (2026-2030), mục tiêu tăng trưởng 2 con số, cải thiện năng suất lao động TFP, kịch bản điều hành vĩ mô.',
    color: 'red',
  },
  {
    id: 'policy',
    nameVi: 'Thể chế, Pháp chế & Cải cách Hành chính',
    nameEn: 'Institutional Reform, Legislation & Governance',
    department2026: 'Vụ Pháp chế & Văn phòng Bộ',
    iconName: 'BookOpen',
    description: 'Đột phá thể chế, tháo gỡ điểm nghẽn pháp lý, sửa đổi bổ sung các Luật ngành Tài chính, đơn giản hóa thủ tục hành chính công vụ.',
    color: 'slate',
  }
];
