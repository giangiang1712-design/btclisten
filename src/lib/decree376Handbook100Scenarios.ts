/**
 * CẨM NANG 100 TÌNH HUỐNG BÁO CHÍ THỰC CHIẾN
 * NHẬN DIỆN KHOẢNG TRỐNG THÔNG TIN VÀ PHÂN CẤP CẢNH BÁO
 * THEO NGHỊ ĐỊNH SỐ 376/2026/NĐ-CP CỦA CHÍNH PHỦ
 * 
 * Hệ thống Dữ liệu Chuẩn đối soát (Ground Truth Benchmark & Classification Engine)
 * Phục vụ vận hành hệ thống quét tin, huấn luyện AI và tác nghiệp xử lý khủng hoảng truyền thông chính sách Bộ Tài chính.
 */

export type Decree376AlertTier = 0 | 1 | 2 | 3;

export interface Decree376ScenarioItem {
  id: number;
  scenarioCode: string; // e.g. "TH-01", "TH-76"
  tier: Decree376AlertTier;
  tierLabelVi: string;
  sopLevel: number; // 0, 1, 2, 3, 4
  sopLevelNameVi: string;
  title: string;
  realArticleTitle: string;
  pressSources: string[];
  decree376Basis: {
    clauseArticle: string;
    leadAgencyId: string;
    leadAgencyName: string;
    decreeArticleClause: string;
    cooperatingUnits?: string[];
  };
  classificationReason: string;
  natureOfInformationVacuum?: string;
  actionScriptVi?: string;
  emergencyPlaybook?: {
    goldenHourTiming: string;
    keyMessage: string;
    operationalDirectives: string[];
  };
  calibratedScores: {
    S: number; // 0 - 50
    D: number; // 0 - 20
    V: number; // 0.0 - 1.0
    I: number; // 0.0 - 1.0
    riskScore: number; // 0 - 100
  };
  matchingKeywords: string[];
}

export const DECREE_376_100_SCENARIOS: Decree376ScenarioItem[] = [
  // ==========================================================================
  // PHẦN I: NHÓM MỨC 0 - TẬP MẪU LOẠI TRỪ (10 TÌNH HUỐNG: 01 – 10)
  // ==========================================================================
  {
    id: 1,
    scenarioCode: 'TH-01',
    tier: 0,
    tierLabelVi: 'Mức 0: Loại trừ / Không cảnh báo (Thông tin đã minh bạch)',
    sopLevel: 0,
    sopLevelNameVi: 'Mức 0: Giám sát thường nhật / Không cảnh báo',
    title: 'Chính phủ ban hành chính sách giảm 2% thuế GTGT',
    realArticleTitle: 'Chính phủ ban hành Nghị định giảm 2% thuế GTGT: Chi tiết các nhóm hàng hóa được áp dụng',
    pressSources: ['Báo Điện tử Chính phủ', 'Tuổi Trẻ'],
    decree376Basis: {
      clauseArticle: 'Điểm a Khoản 9 Điều 2; Khoản 9 Điều 3',
      leadAgencyId: 'vu-cstpl',
      leadAgencyName: 'Vụ Chính sách thuế, phí và lệ phí',
      decreeArticleClause: 'Khoản 9 Điều 3',
    },
    classificationReason: 'Chính sách đã hoàn thiện đầy đủ căn cứ pháp lý, có văn bản ban hành kèm phụ lục danh mục hàng hóa chi tiết. Không có khoảng trống thông tin.',
    actionScriptVi: 'Gán nhãn Mức 0, lưu kho dữ liệu truyền thông thường nhật.',
    calibratedScores: { S: 2, D: 0, V: 0.2, I: 0.8, riskScore: 2.0 },
    matchingKeywords: ['nghị định giảm 2% thuế gtgt', 'giảm 2% vat', 'chi tiết các nhóm hàng hóa được áp dụng']
  },
  {
    id: 2,
    scenarioCode: 'TH-02',
    tier: 0,
    tierLabelVi: 'Mức 0: Loại trừ / Không cảnh báo (Nghiệp vụ tư pháp bình thường)',
    sopLevel: 0,
    sopLevelNameVi: 'Mức 0: Giám sát thường nhật / Không cảnh báo',
    title: 'Hải quan bắt giữ 3 tấn pháo lậu tại cửa khẩu quốc tế',
    realArticleTitle: 'Hải quan Quảng Trị phối hợp Bộ đội Biên phòng bắt giữ hơn 3 tấn pháo lậu ngụy trang tinh vi',
    pressSources: ['Báo Công an Nhân dân'],
    decree376Basis: {
      clauseArticle: 'Điểm a, Điểm b Khoản 20 Điều 2; Khoản 25 Điều 3',
      leadAgencyId: 'cuc-hq',
      leadAgencyName: 'Cục Hải quan',
      decreeArticleClause: 'Khoản 25 Điều 3',
      cooperatingUnits: ['Bộ đội Biên phòng']
    },
    classificationReason: 'Hoạt động nghiệp vụ tư pháp tố tụng bình thường, chế tài xử lý buôn lậu đã có quy định rõ ràng, không có tranh chấp chính sách.',
    actionScriptVi: 'Gán nhãn Mức 0, lưu điểm tin nghiệp vụ trấn áp buôn lậu định kỳ.',
    calibratedScores: { S: 5, D: 0, V: 0.15, I: 0.2, riskScore: 4.0 },
    matchingKeywords: ['phối hợp bộ đội biên phòng bắt giữ', '3 tấn pháo lậu', 'pháo lậu ngụy trang']
  },
  {
    id: 3,
    scenarioCode: 'TH-03',
    tier: 0,
    tierLabelVi: 'Mức 0: Loại trừ / Không cảnh báo (Sai thẩm quyền bộ ngành)',
    sopLevel: 0,
    sopLevelNameVi: 'Mức 0: Giám sát thường nhật / Không cảnh báo',
    title: 'Hiệp hội Bất động sản kiến nghị hạ lãi suất cho vay',
    realArticleTitle: 'HoREA kiến nghị nới room tín dụng và giảm thêm lãi suất cho vay mua nhà ở xã hội',
    pressSources: ['Báo Đầu tư'],
    decree376Basis: {
      clauseArticle: 'Thẩm quyền Ngân hàng Nhà nước Việt Nam',
      leadAgencyId: 'nhnn',
      leadAgencyName: 'Ngân hàng Nhà nước Việt Nam (Chuyển tham khảo)',
      decreeArticleClause: 'Luật Ngân hàng Nhà nước',
    },
    classificationReason: 'Sai thẩm quyền bộ ngành quản lý, thuộc chức năng điều hành chính sách tiền tệ và tín dụng của Ngân hàng Nhà nước Việt Nam. Bộ Tài chính không điều hành trần lãi suất thương mại.',
    actionScriptVi: 'Gán nhãn Mức 0 (Chuyển bản tin tham khảo vĩ mô).',
    calibratedScores: { S: 2, D: 0, V: 0.3, I: 0.4, riskScore: 3.0 },
    matchingKeywords: ['horea kiến nghị nới room tín dụng', 'lãi suất cho vay mua nhà ở xã hội', 'nới room tín dụng']
  },
  {
    id: 4,
    scenarioCode: 'TH-04',
    tier: 0,
    tierLabelVi: 'Mức 0: Loại trừ / Không cảnh báo (Sai thẩm quyền bộ ngành)',
    sopLevel: 0,
    sopLevelNameVi: 'Mức 0: Giám sát thường nhật / Không cảnh báo',
    title: 'Công bố bảng giá đất bồi thường giải phóng mặt bằng',
    realArticleTitle: 'Hà Nội ban hành hệ số điều chỉnh giá đất bồi thường dự án đường vành đai 4',
    pressSources: ['Báo Kinh tế & Đô thị'],
    decree376Basis: {
      clauseArticle: 'Thẩm quyền UBND cấp tỉnh và ngành TN&MT',
      leadAgencyId: 'ubnd-tinh',
      leadAgencyName: 'UBND TP Hà Nội / Sở TN&MT',
      decreeArticleClause: 'Luật Đất đai',
    },
    classificationReason: 'Thẩm quyền xác định hệ số điều chỉnh giá đất cụ thể thuộc chính quyền địa phương, không thuộc thẩm quyền ban hành quyết định của Bộ Tài chính.',
    actionScriptVi: 'Gán nhãn Mức 0.',
    calibratedScores: { S: 2, D: 0, V: 0.2, I: 0.3, riskScore: 2.5 },
    matchingKeywords: ['hệ số điều chỉnh giá đất bồi thường', 'đường vành đai 4', 'bồi thường dự án đường']
  },
  {
    id: 5,
    scenarioCode: 'TH-05',
    tier: 0,
    tierLabelVi: 'Mức 0: Loại trừ / Không cảnh báo (Tư vấn luật ổn định)',
    sopLevel: 0,
    sopLevelNameVi: 'Mức 0: Giám sát thường nhật / Không cảnh báo',
    title: 'Tư vấn thời hạn nộp hồ sơ hưởng trợ cấp ốm đau',
    realArticleTitle: 'Người lao động ốm đau dài ngày: Nộp hồ sơ hưởng trợ cấp BHXH trong bao lâu?',
    pressSources: ['Báo Lao Động'],
    decree376Basis: {
      clauseArticle: 'Khoản 22 Điều 2; Khoản 34 Điều 3',
      leadAgencyId: 'bhxh-vn',
      leadAgencyName: 'Bảo hiểm xã hội Việt Nam',
      decreeArticleClause: 'Khoản 34 Điều 3',
    },
    classificationReason: 'Chuyên gia pháp lý trích dẫn chính xác quy định đã ổn định của Luật BHXH, giải quyết trọn vẹn thắc mắc của độc giả.',
    actionScriptVi: 'Gán nhãn Mức 0, không phát sinh khoảng trống.',
    calibratedScores: { S: 1, D: 0, V: 0.1, I: 0.2, riskScore: 1.5 },
    matchingKeywords: ['người lao động ốm đau dài ngày', 'nộp hồ sơ hưởng trợ cấp bhxh trong bao lâu']
  },
  {
    id: 6,
    scenarioCode: 'TH-06',
    tier: 0,
    tierLabelVi: 'Mức 0: Loại trừ / Không cảnh báo (Tuyên truyền phong trào nội bộ)',
    sopLevel: 0,
    sopLevelNameVi: 'Mức 0: Giám sát thường nhật / Không cảnh báo',
    title: 'Kho bạc Nhà nước hoàn thành vượt mức chỉ tiêu giải ngân năm',
    realArticleTitle: 'Hệ thống Kho bạc Nhà nước nỗ lực kiểm soát chi, góp phần đẩy nhanh tiến độ dự án quốc gia',
    pressSources: ['Thời báo Tài chính Việt Nam'],
    decree376Basis: {
      clauseArticle: 'Khoản 10 Điều 2; Khoản 28 Điều 3',
      leadAgencyId: 'kbnn',
      leadAgencyName: 'Kho bạc Nhà nước',
      decreeArticleClause: 'Khoản 28 Điều 3',
    },
    classificationReason: 'Tin tức tuyên truyền phong trào, thi đua tích cực nội bộ.',
    actionScriptVi: 'Gán nhãn Mức 0, ghi nhận thành tích thi đua.',
    calibratedScores: { S: 1, D: 0, V: 0.1, I: 0.3, riskScore: 1.0 },
    matchingKeywords: ['hệ thống kho bạc nhà nước nỗ lực kiểm soát chi', 'góp phần đẩy nhanh tiến độ dự án quốc gia']
  },
  {
    id: 7,
    scenarioCode: 'TH-07',
    tier: 0,
    tierLabelVi: 'Mức 0: Loại trừ / Không cảnh báo (Án tố tụng đã rõ ràng)',
    sopLevel: 0,
    sopLevelNameVi: 'Mức 0: Giám sát thường nhật / Không cảnh báo',
    title: 'Khởi tố giám đốc doanh nghiệp trốn thuế thu nhập doanh nghiệp',
    realArticleTitle: 'Khởi tố vụ án trốn thuế hơn 40 tỷ đồng tại Công ty xây dựng Hoàng Hà',
    pressSources: ['Báo Pháp luật Việt Nam'],
    decree376Basis: {
      clauseArticle: 'Điểm đ Khoản 9 Điều 2; Khoản 24 Điều 3',
      leadAgencyId: 'cuc-thue',
      leadAgencyName: 'Cục Thuế',
      decreeArticleClause: 'Khoản 24 Điều 3',
    },
    classificationReason: 'Tin tức điều tra án hình sự kinh tế đã có phán quyết tố tụng, hành vi gian lận rõ ràng, không phát sinh tranh cãi quy định.',
    actionScriptVi: 'Gán nhãn Mức 0.',
    calibratedScores: { S: 6, D: 0, V: 0.2, I: 0.2, riskScore: 5.0 },
    matchingKeywords: ['khởi tố vụ án trốn thuế hơn 40 tỷ', 'công ty xây dựng hoàng hà']
  },
  {
    id: 8,
    scenarioCode: 'TH-08',
    tier: 0,
    tierLabelVi: 'Mức 0: Loại trừ / Không cảnh báo (An sinh xã hội tích cực)',
    sopLevel: 0,
    sopLevelNameVi: 'Mức 0: Giám sát thường nhật / Không cảnh báo',
    title: 'Công ty Xổ số kiến thiết trao học bổng cho học sinh nghèo',
    realArticleTitle: 'Công ty Xổ số kiến thiết Cần Thơ tài trợ 2.000 suất học bổng tiếp sức đến trường',
    pressSources: ['Báo Cần Thơ'],
    decree376Basis: {
      clauseArticle: 'Điểm b Khoản 19 Điều 2; Khoản 8 Điều 3',
      leadAgencyId: 'vu-dchtc',
      leadAgencyName: 'Vụ Các định chế tài chính',
      decreeArticleClause: 'Khoản 8 Điều 3',
    },
    classificationReason: 'Tin tức hoạt động an sinh xã hội tích cực, không có tranh chấp.',
    actionScriptVi: 'Gán nhãn Mức 0.',
    calibratedScores: { S: 1, D: 0, V: 0.1, I: 0.2, riskScore: 1.0 },
    matchingKeywords: ['công ty xổ số kiến thiết cần thơ tài trợ', 'tiếp sức đến trường']
  },
  {
    id: 9,
    scenarioCode: 'TH-09',
    tier: 0,
    tierLabelVi: 'Mức 0: Loại trừ / Không cảnh báo (Thống kê định kỳ chính thống)',
    sopLevel: 0,
    sopLevelNameVi: 'Mức 0: Giám sát thường nhật / Không cảnh báo',
    title: 'Số liệu thống kê xuất nhập khẩu 9 tháng đầu năm tăng trưởng',
    realArticleTitle: 'Kim ngạch xuất nhập khẩu cả nước 9 tháng vượt mốc 500 tỷ USD: Điểm sáng thặng dư thương mại',
    pressSources: ['Báo VietNamNet'],
    decree376Basis: {
      clauseArticle: 'Khoản 20, Khoản 23 Điều 2; Khoản 27 Điều 3, Khoản 25 Điều 3',
      leadAgencyId: 'cuc-tk',
      leadAgencyName: 'Cục Thống kê',
      decreeArticleClause: 'Khoản 27 Điều 3',
      cooperatingUnits: ['Cục Hải quan']
    },
    classificationReason: 'Dữ liệu thống kê công bố định kỳ chính thống, không có tranh luận hay khoảng trống thông tin.',
    actionScriptVi: 'Gán nhãn Mức 0, ghi nhận điểm sáng vĩ mô.',
    calibratedScores: { S: 1, D: 0, V: 0.2, I: 0.7, riskScore: 1.5 },
    matchingKeywords: ['kim ngạch xuất nhập khẩu cả nước 9 tháng', 'vượt mốc 500 tỷ usd', 'thặng dư thương mại']
  },
  {
    id: 10,
    scenarioCode: 'TH-10',
    tier: 0,
    tierLabelVi: 'Mức 0: Loại trừ / Không cảnh báo (Sai thẩm quyền bộ ngành)',
    sopLevel: 0,
    sopLevelNameVi: 'Mức 0: Giám sát thường nhật / Không cảnh báo',
    title: 'Giá vàng thế giới biến động theo quyết định của Fed',
    realArticleTitle: 'Giá vàng thế giới lập đỉnh lịch sử sau phát biểu nới lỏng tiền tệ của Chủ tịch Fed',
    pressSources: ['Báo Thanh Niên'],
    decree376Basis: {
      clauseArticle: 'Thẩm quyền Ngân hàng Nhà nước Việt Nam (Nghị định 24)',
      leadAgencyId: 'nhnn',
      leadAgencyName: 'Ngân hàng Nhà nước Việt Nam',
      decreeArticleClause: 'Nghị định 24/2012/NĐ-CP',
    },
    classificationReason: 'Thị trường vàng miếng trong nước và chính sách tiền tệ quốc tế thuộc trách nhiệm quản lý nhà nước của Ngân hàng Nhà nước Việt Nam (Nghị định 24). Sai thẩm quyền bộ ngành.',
    actionScriptVi: 'Gán nhãn Mức 0.',
    calibratedScores: { S: 2, D: 0, V: 0.3, I: 0.5, riskScore: 3.0 },
    matchingKeywords: ['giá vàng thế giới lập đỉnh', 'sau phát biểu nới lỏng tiền tệ của chủ tịch fed']
  },

  // ==========================================================================
  // PHẦN II: NHÓM MỨC 1 - CẦN LƯU TÂM (30 TÌNH HUỐNG: 11 – 40)
  // ==========================================================================
  {
    id: 11,
    scenarioCode: 'TH-11',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm (Thắc mắc quy trình / Chưa có thiệt hại)',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm (Early Horizon)',
    title: 'Tích hợp mã số thuế cá nhân với số Căn cước công dân gắn chip',
    realArticleTitle: 'Đồng bộ mã số thuế với căn cước công dân: Người nộp thuế lúng túng khi hệ thống báo trùng lặp thông tin',
    pressSources: ['Báo Tuổi Trẻ Online'],
    decree376Basis: {
      clauseArticle: 'Điểm d Khoản 9 Điều 2; Khoản 24 Điều 3',
      leadAgencyId: 'cuc-thue',
      leadAgencyName: 'Cục Thuế',
      decreeArticleClause: 'Khoản 24 Điều 3',
      cooperatingUnits: ['Cục Công nghệ thông tin và chuyển đổi số (Khoản 23 Điều 3)']
    },
    classificationReason: 'Người dân chưa biết cách chuẩn hóa thông tin số CMND 9 số cũ khi đối soát cơ sở dữ liệu quốc gia về dân cư.',
    natureOfInformationVacuum: 'Người dân chưa biết cách chuẩn hóa thông tin số CMND 9 số cũ khi đối soát cơ sở dữ liệu quốc gia về dân cư.',
    actionScriptVi: 'Cục Thuế đăng tải Infographic 4 bước chuẩn hóa thông tin trên eTax Mobile; gửi bài giải đáp Bạn đọc Báo Tuổi Trẻ.',
    calibratedScores: { S: 12, D: 5, V: 0.35, I: 0.5, riskScore: 24.5 },
    matchingKeywords: ['đồng bộ mã số thuế với căn cước công dân', 'trùng lặp thông tin', 'lúng túng khi hệ thống báo']
  },
  {
    id: 12,
    scenarioCode: 'TH-12',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Đăng ký người phụ thuộc giảm trừ gia cảnh cho Freelancer',
    realArticleTitle: 'Làm nghề tự do, kinh doanh online đăng ký giảm trừ gia cảnh thuế TNCN thế nào?',
    pressSources: ['Báo Dân Trí'],
    decree376Basis: {
      clauseArticle: 'Điểm d Khoản 9 Điều 2; Khoản 24 Điều 3',
      leadAgencyId: 'cuc-thue',
      leadAgencyName: 'Cục Thuế',
      decreeArticleClause: 'Khoản 24 Điều 3',
    },
    classificationReason: 'Thiếu cẩm nang hướng dẫn chứng minh thu nhập của người phụ thuộc đối với lao động phi chính thức.',
    natureOfInformationVacuum: 'Thiếu cẩm nang hướng dẫn chứng minh thu nhập của người phụ thuộc đối với lao động phi chính thức.',
    actionScriptVi: 'Xuất bản bài viết Q&A trên Báo Tài chính - Đầu tư kèm biểu mẫu tải về trực tuyến.',
    calibratedScores: { S: 10, D: 4, V: 0.25, I: 0.4, riskScore: 21.0 },
    matchingKeywords: ['làm nghề tự do, kinh doanh online', 'giảm trừ gia cảnh thuế tncn thế nào']
  },
  {
    id: 13,
    scenarioCode: 'TH-13',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Quy trình nộp hồ sơ thai sản điện tử trên ứng dụng VssID',
    realArticleTitle: 'Nộp hồ sơ thai sản trực tuyến qua VssID: Cần chuẩn bị những giấy tờ gì để không bị từ chối?',
    pressSources: ['Báo Lao Động'],
    decree376Basis: {
      clauseArticle: 'Khoản 22 Điều 2; Khoản 34 Điều 3',
      leadAgencyId: 'bhxh-vn',
      leadAgencyName: 'Bảo hiểm xã hội Việt Nam',
      decreeArticleClause: 'Khoản 34 Điều 3',
    },
    classificationReason: 'Lao động nữ lúng túng khi đính kèm bản quét (scan) giấy chứng sinh và giấy ra viện bị mờ dấu mộc.',
    natureOfInformationVacuum: 'Lao động nữ lúng túng khi đính kèm bản scan giấy chứng sinh và giấy ra viện bị mờ dấu mộc.',
    actionScriptVi: 'BHXH Việt Nam phát hành video clip 60 giây mô phỏng thao tác nộp hồ sơ chuẩn trên app VssID.',
    calibratedScores: { S: 10, D: 4, V: 0.25, I: 0.35, riskScore: 20.5 },
    matchingKeywords: ['nộp hồ sơ thai sản trực tuyến qua vssid', 'không bị từ chối']
  },
  {
    id: 14,
    scenarioCode: 'TH-14',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Biểu mẫu bãi bỏ theo Quyết định số 2772/QĐ-BTC của Bộ Tài chính',
    realArticleTitle: 'Bộ Tài chính bãi bỏ 5 quyết định trong lĩnh vực tài chính - kế toán: Kế toán doanh nghiệp áp dụng mẫu biểu nào thay thế?',
    pressSources: ['Thời báo Tài chính Việt Nam'],
    decree376Basis: {
      clauseArticle: 'Khoản 16 Điều 2; Khoản 17 Điều 3',
      leadAgencyId: 'cuc-qlktkt',
      leadAgencyName: 'Cục Quản lý, giám sát kế toán, kiểm toán',
      decreeArticleClause: 'Khoản 17 Điều 3',
    },
    classificationReason: 'Kế toán đơn vị sự nghiệp băn khoăn về văn bản áp dụng chuyển tiếp trong kỳ quyết toán quý.',
    natureOfInformationVacuum: 'Kế toán băn khoăn về văn bản áp dụng chuyển tiếp trong kỳ quyết toán quý sau khi bãi bỏ 5 quyết định.',
    actionScriptVi: 'Biên soạn Bảng đối chiếu văn bản thay thế (Cross-reference matrix) đăng tải trên Cổng thông tin Bộ Tài chính.',
    calibratedScores: { S: 11, D: 4, V: 0.2, I: 0.35, riskScore: 21.0 },
    matchingKeywords: ['bãi bỏ 5 quyết định trong lĩnh vực tài chính - kế toán', 'mẫu biểu nào thay thế', '2772/qđ-btc']
  },
  {
    id: 15,
    scenarioCode: 'TH-15',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Tra cứu mã HS cho thiết bị bay không người lái nông nghiệp nhập khẩu',
    realArticleTitle: 'Nhập khẩu thiết bị bay nông nghiệp (Drone): Doanh nghiệp băn khoăn cách tra cứu thuế suất ưu đãi',
    pressSources: ['Báo Nông nghiệp Việt Nam'],
    decree376Basis: {
      clauseArticle: 'Khoản 20 Điều 2; Khoản 25 Điều 3',
      leadAgencyId: 'cuc-hq',
      leadAgencyName: 'Cục Hải quan',
      decreeArticleClause: 'Khoản 25 Điều 3',
    },
    classificationReason: 'Công nghệ mới tích hợp nhiều tính năng khiến DN lúng túng chọn mã HS giữa thiết bị cơ khí và viễn thông.',
    natureOfInformationVacuum: 'Công nghệ mới khiến DN lúng túng chọn mã HS giữa thiết bị cơ khí và viễn thông.',
    actionScriptVi: 'Cục Hải quan đăng tải hướng dẫn áp mã sơ bộ và thủ tục xác định trước mã số trên Cổng DVC Hải quan.',
    calibratedScores: { S: 10, D: 4, V: 0.2, I: 0.3, riskScore: 20.0 },
    matchingKeywords: ['nhập khẩu thiết bị bay nông nghiệp', 'tra cứu thuế suất ưu đãi', 'drone nông nghiệp']
  },
  {
    id: 16,
    scenarioCode: 'TH-16',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Thủ tục thay đổi địa chỉ đăng ký hộ kinh doanh khi sáp nhập xã phường',
    realArticleTitle: 'Sau sắp xếp đơn vị hành chính xã phường: Hộ kinh doanh có phải đổi lại giấy phép đăng ký kinh doanh?',
    pressSources: ['Báo Pháp luật TP.HCM'],
    decree376Basis: {
      clauseArticle: 'Khoản 14 Điều 2; Khoản 20 Điều 3',
      leadAgencyId: 'cuc-ptdn-tnkt',
      leadAgencyName: 'Cục Phát triển doanh nghiệp tư nhân và kinh tế tập thể',
      decreeArticleClause: 'Khoản 20 Điều 3',
    },
    classificationReason: 'Tiểu thương băn khoăn có bị phạt nếu chưa cập nhật tên phường mới trên biển hiệu và hóa đơn.',
    natureOfInformationVacuum: 'Tiểu thương băn khoăn có bị phạt nếu chưa cập nhật tên phường mới sau sắp xếp địa giới hành chính.',
    actionScriptVi: 'Ban hành văn bản hướng dẫn: Cơ quan ĐKKD tự động cập nhật dữ liệu, người dân không phải làm thủ tục cấp đổi nếu không có nhu cầu.',
    calibratedScores: { S: 12, D: 4, V: 0.3, I: 0.5, riskScore: 23.5 },
    matchingKeywords: ['sau sắp xếp đơn vị hành chính xã phường', 'đổi lại giấy phép đăng ký kinh doanh']
  },
  {
    id: 17,
    scenarioCode: 'TH-17',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Mở tài khoản giao dịch chứng khoán xác thực bằng CCCD gắn chip',
    realArticleTitle: 'Nhà đầu tư F0 hỏi cách xác thực sinh trắc học khi mở tài khoản chứng khoán trực tuyến',
    pressSources: ['Báo Đầu tư Chứng khoán'],
    decree376Basis: {
      clauseArticle: 'Khoản 17 Điều 2; Khoản 29 Điều 3',
      leadAgencyId: 'ubcknn',
      leadAgencyName: 'Ủy ban Chứng khoán Nhà nước',
      decreeArticleClause: 'Khoản 29 Điều 3',
    },
    classificationReason: 'Quy trình NFC quét thẻ căn cước tại các công ty chứng khoán chưa có tiêu chuẩn giao diện đồng nhất.',
    natureOfInformationVacuum: 'Quy trình NFC quét thẻ căn cước tại các CTCK chưa có tiêu chuẩn giao diện đồng nhất.',
    actionScriptVi: 'UBCKNN ban hành khuyến nghị kỹ thuật chuẩn hóa quy trình onboarding khách hàng cho các CTCK.',
    calibratedScores: { S: 11, D: 4, V: 0.25, I: 0.4, riskScore: 22.0 },
    matchingKeywords: ['xác thực sinh trắc học khi mở tài khoản chứng khoán', 'nhà đầu tư f0 hỏi']
  },
  {
    id: 18,
    scenarioCode: 'TH-18',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Đăng ký kê khai giá sách giáo khoa tái bản',
    realArticleTitle: 'Kê khai giá sách giáo khoa chương trình mới: Nhà xuất bản nộp hồ sơ tại cơ quan nào?',
    pressSources: ['Báo Giáo dục & Thời đại'],
    decree376Basis: {
      clauseArticle: 'Điểm k Khoản 21 Điều 2; Khoản 18 Điều 3',
      leadAgencyId: 'cuc-qlg',
      leadAgencyName: 'Cục Quản lý giá',
      decreeArticleClause: 'Khoản 18 Điều 3',
    },
    classificationReason: 'Doanh nghiệp xuất bản chưa rõ phân cấp nộp hồ sơ kê khai giá giữa Bộ Tài chính và địa phương theo Luật Giá mới.',
    natureOfInformationVacuum: 'Doanh nghiệp xuất bản chưa rõ phân cấp tiếp nhận hồ sơ kê khai giá sách theo Luật Giá mới.',
    actionScriptVi: 'Cục Quản lý giá ban hành bảng thông báo phân cấp tiếp nhận biểu mẫu kê khai giá đăng tải trên Báo Giáo dục & Thời đại.',
    calibratedScores: { S: 11, D: 4, V: 0.2, I: 0.35, riskScore: 21.0 },
    matchingKeywords: ['kê khai giá sách giáo khoa chương trình mới', 'nhà xuất bản nộp hồ sơ tại cơ quan nào']
  },
  {
    id: 19,
    scenarioCode: 'TH-19',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Nộp chứng từ chi ngân sách qua Dịch vụ công trực tuyến Kho bạc Nhà nước',
    realArticleTitle: 'Kế toán trường học băn khoăn về quy cách chứng từ ký số khi thanh toán qua Kho bạc',
    pressSources: ['Báo Kinh tế & Đô thị'],
    decree376Basis: {
      clauseArticle: 'Điểm c Khoản 10 Điều 2; Khoản 28 Điều 3',
      leadAgencyId: 'kbnn',
      leadAgencyName: 'Kho bạc Nhà nước',
      decreeArticleClause: 'Khoản 28 Điều 3',
    },
    classificationReason: 'Lỗi định dạng chữ ký số tập trung khiến chứng từ điện tử bị trả về nhiều lần.',
    natureOfInformationVacuum: 'Lỗi định dạng chữ ký số tập trung khiến chứng từ điện tử bị trả về nhiều lần.',
    actionScriptVi: 'KBNN nâng cấp cẩm nang xử lý lỗi phần mềm DVC KBNN, gửi trực tiếp về các Phòng Giáo dục quận/huyện.',
    calibratedScores: { S: 11, D: 4, V: 0.25, I: 0.35, riskScore: 21.5 },
    matchingKeywords: ['kế toán trường học băn khoăn', 'quy cách chứng từ ký số khi thanh toán qua kho bạc']
  },
  {
    id: 20,
    scenarioCode: 'TH-20',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Thủ tục thanh lý bàn ghế, tài sản công cũ hỏng tại trạm y tế xã',
    realArticleTitle: 'Tài sản công hư hỏng tại cơ sở y tế xã: Làm sao thanh lý đúng quy trình không sợ sai phạm?',
    pressSources: ['Báo Sức khỏe & Đời sống'],
    decree376Basis: {
      clauseArticle: 'Khoản 12 Điều 2; Khoản 14 Điều 3',
      leadAgencyId: 'cuc-qlcs',
      leadAgencyName: 'Cục Quản lý công sản',
      decreeArticleClause: 'Khoản 14 Điều 3',
    },
    classificationReason: 'Cán bộ cơ sở lúng túng trước các quy định định giá tài sản dưới 50 triệu đồng.',
    natureOfInformationVacuum: 'Cán bộ cơ sở lúng túng trước các quy định định giá tài sản công quy mô nhỏ dưới 50 triệu đồng.',
    actionScriptVi: 'Xuất bản cẩm nang "Xử lý tài sản công quy mô nhỏ tại cấp xã/phường" dưới dạng Infographic.',
    calibratedScores: { S: 10, D: 3, V: 0.2, I: 0.3, riskScore: 20.0 },
    matchingKeywords: ['tài sản công hư hỏng tại cơ sở y tế xã', 'thanh lý đúng quy trình không sợ sai phạm']
  },
  {
    id: 21,
    scenarioCode: 'TH-21',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Đăng ký làm đại lý bảo hiểm nhân thọ trực tuyến',
    realArticleTitle: 'Thi chứng chỉ đại lý bảo hiểm trực tuyến: Thí sinh cần đáp ứng tiêu chuẩn đường truyền và thiết bị ra sao?',
    pressSources: ['Tạp chí Thị trường Tài chính Tiền tệ'],
    decree376Basis: {
      clauseArticle: 'Khoản 18 Điều 2; Khoản 16 Điều 3',
      leadAgencyId: 'cuc-qlbh',
      leadAgencyName: 'Cục Quản lý, giám sát bảo hiểm',
      decreeArticleClause: 'Khoản 16 Điều 3',
    },
    classificationReason: 'Thiếu tài liệu quy chuẩn kỹ thuật phòng thi sát hạch chứng chỉ trực tuyến.',
    natureOfInformationVacuum: 'Thiếu tài liệu quy chuẩn kỹ thuật phòng thi sát hạch chứng chỉ trực tuyến.',
    actionScriptVi: 'Cục QLBH ban hành thông báo quy chế giám sát thi trực tuyến bảo đảm minh bạch.',
    calibratedScores: { S: 10, D: 3, V: 0.2, I: 0.25, riskScore: 20.0 },
    matchingKeywords: ['thi chứng chỉ đại lý bảo hiểm trực tuyến', 'tiêu chuẩn đường truyền và thiết bị']
  },
  {
    id: 22,
    scenarioCode: 'TH-22',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Thủ tục miễn thuế nhập khẩu hàng quà biếu, tặng phi mậu dịch',
    realArticleTitle: 'Nhận quà biếu của người thân ở nước ngoài: Định mức miễn thuế nhập khẩu là bao nhiêu?',
    pressSources: ['Báo Thanh Niên'],
    decree376Basis: {
      clauseArticle: 'Khoản 9, Khoản 20 Điều 2; Khoản 25 Điều 3',
      leadAgencyId: 'cuc-hq',
      leadAgencyName: 'Cục Hải quan',
      decreeArticleClause: 'Khoản 25 Điều 3',
    },
    classificationReason: 'Người dân chưa rõ mức trị giá hải quan được miễn thuế đối với bưu phẩm quốc tế.',
    natureOfInformationVacuum: 'Người dân chưa rõ định mức trị giá hải quan miễn thuế đối với bưu phẩm phi mậu dịch.',
    actionScriptVi: 'Cung cấp bảng tra cứu định mức miễn thuế bưu phẩm phi mậu dịch trên trang Bạn đọc Báo Thanh Niên.',
    calibratedScores: { S: 10, D: 3, V: 0.2, I: 0.35, riskScore: 20.5 },
    matchingKeywords: ['nhận quà biếu của người thân ở nước ngoài', 'định mức miễn thuế nhập khẩu là bao nhiêu']
  },
  {
    id: 23,
    scenarioCode: 'TH-23',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Tiêu chí phân loại dự án đầu tư công ưu tiên dẫn dắt',
    realArticleTitle: 'Đổi mới kế hoạch hóa đầu tư công: Doanh nghiệp tìm hiểu tiêu chí lựa chọn dự án dẫn dắt đầu tư',
    pressSources: ['Báo VnEconomy'],
    decree376Basis: {
      clauseArticle: 'Khoản 7 Điều 2; Khoản 2 Điều 3',
      leadAgencyId: 'vu-dtht',
      leadAgencyName: 'Vụ Đầu tư và Phát triển hạ tầng',
      decreeArticleClause: 'Khoản 2 Điều 3',
    },
    classificationReason: 'Thiếu hướng dẫn định lượng về phương pháp đánh giá tính lan tỏa liên vùng của dự án.',
    natureOfInformationVacuum: 'Thiếu hướng dẫn định lượng về phương pháp đánh giá tính lan tỏa liên vùng của dự án đầu tư công.',
    actionScriptVi: 'Vụ Đầu tư và Phát triển hạ tầng đăng bài phân tích trên Thời báo Tài chính Việt Nam.',
    calibratedScores: { S: 11, D: 4, V: 0.2, I: 0.35, riskScore: 21.0 },
    matchingKeywords: ['đổi mới kế hoạch hóa đầu tư công', 'tiêu chí lựa chọn dự án dẫn dắt đầu tư']
  },
  {
    id: 24,
    scenarioCode: 'TH-24',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Kê khai thuế TNCN tiền thưởng khuyến mại thẻ tín dụng',
    realArticleTitle: 'Nhận tiền thưởng mở thẻ tín dụng có phải kê khai nộp thuế TNCN?',
    pressSources: ['Báo Tiền Phong'],
    decree376Basis: {
      clauseArticle: 'Điểm d Khoản 9 Điều 2; Khoản 24 Điều 3',
      leadAgencyId: 'cuc-thue',
      leadAgencyName: 'Cục Thuế',
      decreeArticleClause: 'Khoản 24 Điều 3',
    },
    classificationReason: 'Khách hàng cá nhân băn khoăn về nghĩa vụ thuế đối với các chương trình hoàn tiền (cashback) và quà tặng.',
    natureOfInformationVacuum: 'Khách hàng cá nhân băn khoăn về nghĩa vụ thuế đối với các chương trình cashback và quà tặng ngân hàng.',
    actionScriptVi: 'Cục Thuế phát hành bài hướng dẫn phân biệt giữa thu nhập chịu thuế và chiết khấu thương mại.',
    calibratedScores: { S: 10, D: 3, V: 0.2, I: 0.35, riskScore: 20.0 },
    matchingKeywords: ['nhận tiền thưởng mở thẻ tín dụng', 'kê khai nộp thuế tncn']
  },
  {
    id: 25,
    scenarioCode: 'TH-25',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Đăng ký tài khoản đấu thầu qua mạng cho hợp tác xã nông nghiệp',
    realArticleTitle: 'Hợp tác xã nông nghiệp tham gia đấu thầu cung cấp suất ăn học đường: Đăng ký trên mạng thế nào?',
    pressSources: ['Báo Nông thôn Ngày nay'],
    decree376Basis: {
      clauseArticle: 'Khoản 13 Điều 2; Khoản 15 Điều 3',
      leadAgencyId: 'cuc-qldt',
      leadAgencyName: 'Cục Quản lý đấu thầu',
      decreeArticleClause: 'Khoản 15 Điều 3',
    },
    classificationReason: 'Hợp tác xã vùng sâu gặp khó khăn trong việc cài đặt chứng thư số công cộng trên hệ thống e-GP.',
    natureOfInformationVacuum: 'HTX vùng sâu gặp khó khăn trong cài đặt chứng thư số công cộng trên hệ thống e-GP.',
    actionScriptVi: 'Cục Quản lý đấu thầu mở chuyên mục hỗ trợ kỹ thuật trực tiếp cho khu vực kinh tế tập thể.',
    calibratedScores: { S: 10, D: 4, V: 0.2, I: 0.3, riskScore: 20.5 },
    matchingKeywords: ['hợp tác xã nông nghiệp tham gia đấu thầu', 'đăng ký trên mạng thế nào', 'suất ăn học đường']
  },
  {
    id: 26,
    scenarioCode: 'TH-26',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Khám chữa bệnh BHYT bằng ứng dụng VNeID mức độ 2',
    realArticleTitle: 'Đi khám bệnh chỉ mang theo điện thoại có cài VNeID: Bệnh viện có chấp nhận thẻ BHYT điện tử?',
    pressSources: ['Báo Người Lao Động'],
    decree376Basis: {
      clauseArticle: 'Khoản 22 Điều 2; Khoản 34 Điều 3',
      leadAgencyId: 'bhxh-vn',
      leadAgencyName: 'Bảo hiểm xã hội Việt Nam',
      decreeArticleClause: 'Khoản 34 Điều 3',
    },
    classificationReason: 'Một số cơ sở y tế tuyến huyện chưa trang bị máy quét mã QR, khiến bệnh nhân phải quay về lấy thẻ giấy.',
    natureOfInformationVacuum: 'Một số cơ sở y tế tuyến huyện chưa có máy quét mã QR, khiến bệnh nhân phải quay về lấy thẻ giấy.',
    actionScriptVi: 'BHXH Việt Nam ban hành công văn đôn đốc các cơ sở y tế bảo đảm 100% tiếp nhận VNeID.',
    calibratedScores: { S: 11, D: 4, V: 0.3, I: 0.5, riskScore: 23.0 },
    matchingKeywords: ['đi khám bệnh chỉ mang theo điện thoại có cài vneid', 'chấp nhận thẻ bhyt điện tử']
  },
  {
    id: 27,
    scenarioCode: 'TH-27',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Thủ tục xin cấp phép kinh doanh dịch vụ thẩm định giá',
    realArticleTitle: 'Điều kiện thành lập doanh nghiệp thẩm định giá mới: Cần bao nhiêu thẩm định viên hành nghề?',
    pressSources: ['Báo Đầu tư'],
    decree376Basis: {
      clauseArticle: 'Điểm i Khoản 21 Điều 2; Khoản 18 Điều 3',
      leadAgencyId: 'cuc-qlg',
      leadAgencyName: 'Cục Quản lý giá',
      decreeArticleClause: 'Khoản 18 Điều 3',
    },
    classificationReason: 'Doanh nghiệp khởi nghiệp chưa nắm rõ quy định mới về số lượng thẩm định viên toàn thời gian theo Luật Giá 2023.',
    natureOfInformationVacuum: 'Doanh nghiệp khởi nghiệp chưa rõ quy định về số lượng thẩm định viên toàn thời gian theo Luật Giá 2023.',
    actionScriptVi: 'Cục Quản lý giá đăng tải bộ checklist điều kiện cấp phép hành nghề trên trang web Bộ.',
    calibratedScores: { S: 10, D: 3, V: 0.2, I: 0.25, riskScore: 20.0 },
    matchingKeywords: ['điều kiện thành lập doanh nghiệp thẩm định giá mới', 'cần bao nhiêu thẩm định viên hành nghề']
  },
  {
    id: 28,
    scenarioCode: 'TH-28',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Đăng ký chứng nhận dự án đầu tư trực tuyến ra nước ngoài',
    realArticleTitle: 'Doanh nghiệp công nghệ đầu tư mở văn phòng tại Singapore: Quy trình nộp hồ sơ trực tuyến ra sao?',
    pressSources: ['Báo Diễn đàn Doanh nghiệp'],
    decree376Basis: {
      clauseArticle: 'Điểm d Khoản 8 Điều 2; Khoản 21 Điều 3',
      leadAgencyId: 'cuc-dtnn',
      leadAgencyName: 'Cục Đầu tư nước ngoài',
      decreeArticleClause: 'Khoản 21 Điều 3',
    },
    classificationReason: 'Thiếu hướng dẫn số hóa hồ sơ chứng minh năng lực tài chính chuyển ngoại tệ ra nước ngoài.',
    natureOfInformationVacuum: 'Thiếu hướng dẫn số hóa hồ sơ chứng minh năng lực tài chính chuyển ngoại tệ đầu tư ra nước ngoài.',
    actionScriptVi: 'Cục Đầu tư nước ngoài phát hành cẩm nang song ngữ hướng dẫn đầu tư ra nước ngoài.',
    calibratedScores: { S: 10, D: 4, V: 0.2, I: 0.3, riskScore: 20.5 },
    matchingKeywords: ['đầu tư mở văn phòng tại singapore', 'quy trình nộp hồ sơ trực tuyến ra sao']
  },
  {
    id: 29,
    scenarioCode: 'TH-29',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Trích xuất dữ liệu thống kê doanh nghiệp phục vụ nghiên cứu',
    realArticleTitle: 'Các viện nghiên cứu và trường đại học hỏi cách khai thác dữ liệu mở từ Tổng điều tra kinh tế',
    pressSources: ['Báo Khoa học & Đời sống'],
    decree376Basis: {
      clauseArticle: 'Khoản 23 Điều 2; Khoản 27 Điều 3',
      leadAgencyId: 'cuc-tk',
      leadAgencyName: 'Cục Thống kê',
      decreeArticleClause: 'Khoản 27 Điều 3',
    },
    classificationReason: 'Chưa rõ cơ chế trích xuất vi dữ liệu (microdata) ẩn danh phục vụ học thuật.',
    natureOfInformationVacuum: 'Chưa rõ cơ chế trích xuất vi dữ liệu (microdata) ẩn danh từ Tổng điều tra kinh tế phục vụ nghiên cứu.',
    actionScriptVi: 'Cục Thống kê mở cổng API dữ liệu thống kê mở dành cho các viện nghiên cứu.',
    calibratedScores: { S: 10, D: 3, V: 0.2, I: 0.25, riskScore: 20.0 },
    matchingKeywords: ['viện nghiên cứu và trường đại học hỏi cách khai thác dữ liệu mở', 'tổng điều tra kinh tế']
  },
  {
    id: 30,
    scenarioCode: 'TH-30',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Hóa đơn điện tử máy tính tiền cho hộ kinh doanh nhà thuốc',
    realArticleTitle: 'Nhà thuốc tư nhân băn khoăn: Phần mềm bán lẻ có tự động đồng bộ hóa đơn máy tính tiền với cơ quan thuế?',
    pressSources: ['Báo Sức khỏe & Đời sống'],
    decree376Basis: {
      clauseArticle: 'Điểm d Khoản 9 Điều 2; Khoản 24 Điều 3',
      leadAgencyId: 'cuc-thue',
      leadAgencyName: 'Cục Thuế',
      decreeArticleClause: 'Khoản 24 Điều 3',
    },
    classificationReason: 'Chủ nhà thuốc lo lắng chi phí kết nối phần mềm quản trị bán hàng với hệ thống cơ quan thuế.',
    natureOfInformationVacuum: 'Chủ nhà thuốc lo lắng chi phí kết nối phần mềm bán lẻ với hệ thống máy tính tiền của cơ quan thuế.',
    actionScriptVi: 'Cục Thuế công bố danh sách 20 nhà cung cấp giải pháp miễn phí năm đầu cho hộ kinh doanh.',
    calibratedScores: { S: 11, D: 4, V: 0.25, I: 0.4, riskScore: 22.0 },
    matchingKeywords: ['nhà thuốc tư nhân băn khoăn', 'đồng bộ hóa đơn máy tính tiền với cơ quan thuế']
  },
  {
    id: 31,
    scenarioCode: 'TH-31',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Quy định thời hạn bảo quản hồ sơ chứng từ kế toán điện tử',
    realArticleTitle: 'Lưu trữ hóa đơn điện tử trong 10 năm: Doanh nghiệp cần lưu trên đám mây hay in ra giấy?',
    pressSources: ['Thời báo Tài chính Việt Nam'],
    decree376Basis: {
      clauseArticle: 'Khoản 16 Điều 2; Khoản 17 Điều 3',
      leadAgencyId: 'cuc-qlktkt',
      leadAgencyName: 'Cục Quản lý, giám sát kế toán, kiểm toán',
      decreeArticleClause: 'Khoản 17 Điều 3',
    },
    classificationReason: 'Kế toán lo ngại rủi ro dữ liệu số bị hỏng sau nhiều năm lưu trữ điện tử.',
    natureOfInformationVacuum: 'Kế toán lo ngại rủi ro dữ liệu số bị hỏng sau 10 năm lưu trữ điện tử, băn khoăn in giấy hay lưu cloud.',
    actionScriptVi: 'Ban hành thông tư hướng dẫn tiêu chuẩn lưu trữ và xác thực toàn vẹn chứng từ số.',
    calibratedScores: { S: 11, D: 4, V: 0.2, I: 0.4, riskScore: 21.5 },
    matchingKeywords: ['lưu trữ hóa đơn điện tử trong 10 năm', 'lưu trên đám mây hay in ra giấy']
  },
  {
    id: 32,
    scenarioCode: 'TH-32',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Đổi thẻ BHYT mẫu mới do bị rách hoặc mờ chữ',
    realArticleTitle: 'Thẻ BHYT bị ướt, mờ mã QR: Thủ tục cấp đổi thẻ mới mất bao lâu?',
    pressSources: ['Báo Hà Nội Mới'],
    decree376Basis: {
      clauseArticle: 'Khoản 22 Điều 2; Khoản 34 Điều 3',
      leadAgencyId: 'bhxh-vn',
      leadAgencyName: 'Bảo hiểm xã hội Việt Nam',
      decreeArticleClause: 'Khoản 34 Điều 3',
    },
    classificationReason: 'Người lớn tuổi chưa biết thủ tục cấp đổi trực tuyến qua Cổng Dịch vụ công Quốc gia.',
    natureOfInformationVacuum: 'Người lớn tuổi chưa biết thủ tục cấp đổi thẻ BHYT trực tuyến qua Cổng DVC Quốc gia.',
    actionScriptVi: 'BHXH cơ sở mở quầy hướng dẫn người cao tuổi cài đặt và sử dụng căn cước thay thế thẻ BHYT giấy.',
    calibratedScores: { S: 10, D: 3, V: 0.2, I: 0.35, riskScore: 20.0 },
    matchingKeywords: ['thẻ bhyt bị ướt, mờ mã qr', 'thủ tục cấp đổi thẻ mới mất bao lâu']
  },
  {
    id: 33,
    scenarioCode: 'TH-33',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Kê khai tài sản công là ô tô chuyên dùng của thanh tra chuyên ngành',
    realArticleTitle: 'Quy chuẩn định mức xe ô tô chuyên dùng cấp sở ngành: Đơn vị sự nghiệp mua sắm theo định mức nào?',
    pressSources: ['Báo Đại biểu Nhân dân'],
    decree376Basis: {
      clauseArticle: 'Điểm b Khoản 12 Điều 2; Khoản 14 Điều 3',
      leadAgencyId: 'cuc-qlcs',
      leadAgencyName: 'Cục Quản lý công sản',
      decreeArticleClause: 'Khoản 14 Điều 3',
    },
    classificationReason: 'Thiếu cẩm nang đối chiếu định mức theo diện tích địa bàn và tính chất công vụ.',
    natureOfInformationVacuum: 'Thiếu cẩm nang đối chiếu định mức xe công chuyên dùng theo địa bàn và tính chất công vụ.',
    actionScriptVi: 'Cục Quản lý công sản tổ chức tập huấn trực tuyến toàn quốc về Nghị định tiêu chuẩn định mức ô tô công.',
    calibratedScores: { S: 11, D: 4, V: 0.2, I: 0.3, riskScore: 21.0 },
    matchingKeywords: ['quy chuẩn định mức xe ô tô chuyên dùng', 'mua sắm theo định mức nào']
  },
  {
    id: 34,
    scenarioCode: 'TH-34',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Lộ trình cắt giảm thuế quan theo Hiệp định CPTPP năm thứ 8',
    realArticleTitle: 'Doanh nghiệp dệt may tìm hiểu lộ trình giảm thuế nhập khẩu nguyên phụ liệu từ các nước CPTPP',
    pressSources: ['Tạp chí Công Thương'],
    decree376Basis: {
      clauseArticle: 'Khoản 20, Khoản 24 Điều 2; Khoản 25 Điều 3',
      leadAgencyId: 'cuc-hq',
      leadAgencyName: 'Cục Hải quan',
      decreeArticleClause: 'Khoản 25 Điều 3',
    },
    classificationReason: 'Thiếu công cụ tra cứu tích hợp chứng nhận xuất xứ (C/O form CPTPP) và thuế suất tương ứng.',
    natureOfInformationVacuum: 'Thiếu công cụ tra cứu tích hợp C/O form CPTPP và thuế suất ưu đãi tương ứng.',
    actionScriptVi: 'Cục Hải quan cập nhật công cụ tính thuế tự động trên Cổng Thông tin điện tử ngành Hải quan.',
    calibratedScores: { S: 10, D: 3, V: 0.2, I: 0.35, riskScore: 20.5 },
    matchingKeywords: ['doanh nghiệp dệt may tìm hiểu lộ trình giảm thuế', 'nguyên phụ liệu từ các nước cptpp']
  },
  {
    id: 35,
    scenarioCode: 'TH-35',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Hạch toán tài trợ giáo dục, y tế vào chi phí hợp lý của doanh nghiệp',
    realArticleTitle: 'Tài trợ xây trường học vùng cao: Doanh nghiệp cần chứng từ gì để được trừ thuế TNDN?',
    pressSources: ['Báo Doanh nhân Sài Gòn'],
    decree376Basis: {
      clauseArticle: 'Điểm d Khoản 9 Điều 2; Khoản 24 Điều 3',
      leadAgencyId: 'cuc-thue',
      leadAgencyName: 'Cục Thuế',
      decreeArticleClause: 'Khoản 24 Điều 3',
    },
    classificationReason: 'Doanh nghiệp băn khoăn về biên bản bàn giao và xác nhận của chính quyền địa phương để hợp lệ hóa chi phí.',
    natureOfInformationVacuum: 'DN băn khoăn về hồ sơ biên bản bàn giao tài trợ để được khấu trừ chi phí thuế TNDN.',
    actionScriptVi: 'Đăng bài hướng dẫn thủ tục hồ sơ tài trợ từ thiện trên trang web Thuế Việt Nam.',
    calibratedScores: { S: 10, D: 3, V: 0.2, I: 0.3, riskScore: 20.0 },
    matchingKeywords: ['tài trợ xây trường học vùng cao', 'chứng từ gì để được trừ thuế tndn']
  },
  {
    id: 36,
    scenarioCode: 'TH-36',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Đăng ký thế chấp quyền đòi nợ mua bán nhà ở xã hội',
    realArticleTitle: 'Thủ tục đăng ký giao dịch bảo đảm đối với nhà ở xã hội hình thành trong tương lai',
    pressSources: ['Báo Xây dựng'],
    decree376Basis: {
      clauseArticle: 'Khoản 19 Điều 2; Khoản 8 Điều 3',
      leadAgencyId: 'vu-dchtc',
      leadAgencyName: 'Vụ Các định chế tài chính',
      decreeArticleClause: 'Khoản 8 Điều 3',
    },
    classificationReason: 'Người mua nhà băn khoăn về quy trình xác nhận tài sản thế chấp tại ngân hàng chính sách.',
    natureOfInformationVacuum: 'Người mua nhà băn khoăn về quy trình xác nhận tài sản thế chấp tại ngân hàng chính sách.',
    actionScriptVi: 'Ban hành văn bản nghiệp vụ hướng dẫn các Ngân hàng Chính sách xã hội tạo thuận lợi cho người dân.',
    calibratedScores: { S: 10, D: 4, V: 0.2, I: 0.35, riskScore: 20.5 },
    matchingKeywords: ['thủ tục đăng ký giao dịch bảo đảm', 'nhà ở xã hội hình thành trong tương lai']
  },
  {
    id: 37,
    scenarioCode: 'TH-37',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Kiểm tra độ ẩm và chất lượng thóc bảo quản trong kho dự trữ quốc gia',
    realArticleTitle: 'Quy trình kiểm tra kỹ thuật định kỳ thóc dự trữ quốc gia được thực hiện thế nào?',
    pressSources: ['Báo Nông nghiệp Việt Nam'],
    decree376Basis: {
      clauseArticle: 'Khoản 11 Điều 2; Khoản 26 Điều 3',
      leadAgencyId: 'cuc-dtnn-res',
      leadAgencyName: 'Cục Dự trữ Nhà nước',
      decreeArticleClause: 'Khoản 26 Điều 3',
    },
    classificationReason: 'Thiếu tài liệu truyền thông trực quan giới thiệu công nghệ bảo quản kín khí hiện đại của ngành dự trữ.',
    natureOfInformationVacuum: 'Thiếu tài liệu trực quan giới thiệu quy trình công nghệ bảo quản kín khí hiện đại của ngành dự trữ.',
    actionScriptVi: 'Phát sóng phóng sự ngắn trên Truyền hình Quốc hội giới thiệu kho công nghệ cao ngành Dự trữ.',
    calibratedScores: { S: 10, D: 3, V: 0.15, I: 0.25, riskScore: 20.0 },
    matchingKeywords: ['quy trình kiểm tra kỹ thuật định kỳ thóc dự trữ quốc gia', 'thóc dự trữ quốc gia được thực hiện thế nào']
  },
  {
    id: 38,
    scenarioCode: 'TH-38',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Tra cứu thông tin người đại diện pháp luật bị treo mã số thuế',
    realArticleTitle: 'Làm sao biết căn cước công dân của mình có đang đứng tên doanh nghiệp nợ thuế nào không?',
    pressSources: ['Báo Tuổi Trẻ'],
    decree376Basis: {
      clauseArticle: 'Khoản 9, Khoản 14 Điều 2; Khoản 24 Điều 3, Khoản 20 Điều 3',
      leadAgencyId: 'cuc-thue',
      leadAgencyName: 'Cục Thuế',
      decreeArticleClause: 'Khoản 24 Điều 3',
      cooperatingUnits: ['Cục Phát triển doanh nghiệp tư nhân và kinh tế tập thể']
    },
    classificationReason: 'Người dân chưa biết tính năng tra cứu nghĩa vụ thuế cá nhân qua app eTax Mobile.',
    natureOfInformationVacuum: 'Người dân chưa biết tính năng tra cứu nghĩa vụ nợ thuế người đại diện qua app eTax Mobile.',
    actionScriptVi: 'Sản xuất infographic "Tra cứu tình trạng thuế cá nhân trong 30 giây" gửi các cơ quan báo chí.',
    calibratedScores: { S: 12, D: 4, V: 0.3, I: 0.45, riskScore: 23.0 },
    matchingKeywords: ['căn cước công dân của mình có đang đứng tên doanh nghiệp nợ thuế', 'làm sao biết căn cước công dân']
  },
  {
    id: 39,
    scenarioCode: 'TH-39',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Điều chỉnh vốn điều lệ trên Cổng Đăng ký doanh nghiệp quốc gia',
    realArticleTitle: 'Doanh nghiệp giảm vốn điều lệ: Hồ sơ nộp qua mạng có cần công chứng báo cáo tài chính?',
    pressSources: ['Báo Đầu tư'],
    decree376Basis: {
      clauseArticle: 'Khoản 14 Điều 2; Khoản 20 Điều 3',
      leadAgencyId: 'cuc-ptdn-tnkt',
      leadAgencyName: 'Cục Phát triển doanh nghiệp tư nhân và kinh tế tập thể',
      decreeArticleClause: 'Khoản 20 Điều 3',
    },
    classificationReason: 'Quy định chứng minh tài sản khi giảm vốn chưa được diễn giải bằng các ví dụ trực quan.',
    natureOfInformationVacuum: 'Quy định chứng minh tài sản khi giảm vốn chưa được diễn giải bằng ví dụ trực quan trên Cổng ĐKKD.',
    actionScriptVi: 'Cập nhật hướng dẫn trực tuyến ngay tại giao diện nộp hồ sơ của Cổng ĐKKD quốc gia.',
    calibratedScores: { S: 10, D: 4, V: 0.2, I: 0.3, riskScore: 20.5 },
    matchingKeywords: ['doanh nghiệp giảm vốn điều lệ', 'có cần công chứng báo cáo tài chính']
  },
  {
    id: 40,
    scenarioCode: 'TH-40',
    tier: 1,
    tierLabelVi: 'Mức 1: Cần lưu tâm',
    sopLevel: 1,
    sopLevelNameVi: 'Cấp 1: Cảnh báo xa / Cần lưu tâm',
    title: 'Ký hợp đồng lao động điện tử và khai báo tăng lao động BHXH',
    realArticleTitle: 'Ký hợp đồng lao động từ xa: Thủ tục báo tăng bảo hiểm xã hội thực hiện ra sao?',
    pressSources: ['Báo Lao Động'],
    decree376Basis: {
      clauseArticle: 'Khoản 22 Điều 2; Khoản 34 Điều 3',
      leadAgencyId: 'bhxh-vn',
      leadAgencyName: 'Bảo hiểm xã hội Việt Nam',
      decreeArticleClause: 'Khoản 34 Điều 3',
    },
    classificationReason: 'Doanh nghiệp công nghệ chưa rõ giá trị pháp lý của chữ ký số cá nhân người lao động trên e-contract khi hậu kiểm.',
    natureOfInformationVacuum: 'DN chưa rõ giá trị pháp lý của chữ ký số cá nhân trên hợp đồng e-contract khi cơ quan BHXH hậu kiểm.',
    actionScriptVi: 'BHXH Việt Nam ban hành hướng dẫn chấp thuận hợp đồng lao động điện tử hợp pháp trong hồ sơ tham gia BHXH.',
    calibratedScores: { S: 11, D: 4, V: 0.25, I: 0.35, riskScore: 21.5 },
    matchingKeywords: ['ký hợp đồng lao động từ xa', 'thủ tục báo tăng bảo hiểm xã hội thực hiện ra sao']
  },

  // ==========================================================================
  // PHẦN III: NHÓM MỨC 2 - CẢNH BÁO SỚM (35 TÌNH HUỐNG: 41 – 75)
  // ==========================================================================
  {
    id: 41,
    scenarioCode: 'TH-41',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm (Ách tắc / Thiệt hại tài chính / Hiệp hội kiến nghị)',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm / Cần xử lý (Early Warning)',
    title: 'Nan giải làm sạch mã số thuế - Hàng trăm nghìn DN mắc kẹt',
    realArticleTitle: 'Nan giải \'làm sạch\' mã số thuế: Cần xóa 617.000 MST nhưng mới xử lý được 125.000',
    pressSources: ['Báo VnEconomy', 'Báo VietNamNet'],
    decree376Basis: {
      clauseArticle: 'Điểm c Khoản 9 Điều 2; Khoản 24 Điều 3, Khoản 20 Điều 3',
      leadAgencyId: 'cuc-thue',
      leadAgencyName: 'Cục Thuế',
      decreeArticleClause: 'Khoản 24 Điều 3',
      cooperatingUnits: ['Cục Phát triển doanh nghiệp tư nhân và kinh tế tập thể']
    },
    classificationReason: 'Thiếu cơ chế khoanh nợ và phân loại hồ sơ đối với các DN giải thể thực tế nhưng còn treo tiền phạt chậm nộp nợ thuế nhỏ.',
    natureOfInformationVacuum: 'Thiếu cơ chế khoanh nợ và phân loại hồ sơ đối với các DN giải thể thực tế nhưng còn treo tiền phạt chậm nộp nợ thuế nhỏ.',
    actionScriptVi: 'Ban hành quy trình giải thể rút gọn cho DN ngừng hoạt động trên 5 năm không còn tài sản; trả lời phỏng vấn Báo VnEconomy khẳng định không phạt dồn tích.',
    calibratedScores: { S: 26, D: 10, V: 0.55, I: 0.65, riskScore: 48.0 },
    matchingKeywords: ['nan giải \'làm sạch\' mã số thuế', 'cần xóa 617.000 mst', 'mới xử lý được 125.000']
  },
  {
    id: 42,
    scenarioCode: 'TH-42',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Bị tạm hoãn xuất cảnh vì nợ tiền thuế vài chục nghìn đồng',
    realArticleTitle: 'Tạm hoãn xuất cảnh nếu nợ thuế 1 triệu đồng: Mức quá thấp! / Cục Thuế làm rõ vụ nợ 15.000 đồng bị tạm hoãn xuất cảnh',
    pressSources: ['Báo Tuổi Trẻ', 'Báo VietNamNet'],
    decree376Basis: {
      clauseArticle: 'Điểm b Khoản 9 Điều 2; Khoản 24 Điều 3',
      leadAgencyId: 'cuc-thue',
      leadAgencyName: 'Cục Thuế',
      decreeArticleClause: 'Khoản 24 Điều 3',
    },
    classificationReason: 'Thiếu ngưỡng nợ cưỡng chế tối thiểu và thiếu cơ chế gửi thông báo trực tiếp đến người nộp thuế trước khi ban hành lệnh hoãn xuất cảnh.',
    natureOfInformationVacuum: 'Thiếu ngưỡng nợ cưỡng chế tối thiểu và thiếu cơ chế gửi thông báo trực tiếp trước khi hoãn xuất cảnh ra sân bay.',
    actionScriptVi: 'Công văn chấn chỉnh các địa phương không cấm xuất cảnh đối với nợ phạt vi phạm hành chính nhỏ; nâng cấp cảnh báo nợ tự động trên app eTax trước 30 ngày.',
    calibratedScores: { S: 32, D: 14, V: 0.65, I: 0.7, riskScore: 56.5 },
    matchingKeywords: ['tạm hoãn xuất cảnh nếu nợ thuế', 'mức quá thấp', 'nợ 15.000 đồng bị tạm hoãn xuất cảnh', 'hoãn xuất cảnh vì nợ thuế']
  },
  {
    id: 43,
    scenarioCode: 'TH-43',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Bất cập phân loại mã HS hàng hóa công nghệ giữa các chi cục hải quan',
    realArticleTitle: 'Doanh nghiệp vẫn gặp khó khăn từ cách phân loại mã hàng hoá xuất nhập khẩu / Cùng một thiết bị, Hải quan TP.HCM áp 0%, Hải Phòng truy thu 10%',
    pressSources: ['Báo VnEconomy', 'Báo Đầu tư'],
    decree376Basis: {
      clauseArticle: 'Khoản 20 Điều 2; Khoản 25 Điều 3',
      leadAgencyId: 'cuc-hq',
      leadAgencyName: 'Cục Hải quan',
      decreeArticleClause: 'Khoản 25 Điều 3',
    },
    classificationReason: 'Thiếu danh mục hướng dẫn phân loại hàng hóa thống nhất toàn quốc; việc chuyển sang hậu kiểm dẫn đến nguy cơ doanh nghiệp bị hồi tố truy thu hàng tỷ đồng.',
    natureOfInformationVacuum: 'Thiếu danh mục mã hàng thống nhất toàn quốc; hậu kiểm vênh nhau giữa các cục khiến DN nguy cơ bị hồi tố truy thu thuế hàng tỷ đồng.',
    actionScriptVi: 'Ban hành văn bản nghiệp vụ gửi 20 Cục Hải quan khu vực thống nhất mã phân loại; cung cấp bài phỏng vấn đại diện Cục Hải quan trên Báo VnEconomy.',
    calibratedScores: { S: 28, D: 12, V: 0.5, I: 0.6, riskScore: 51.0 },
    matchingKeywords: ['phân loại mã hàng hoá xuất nhập khẩu', 'áp thuế 0%, hải quan hải phòng truy thu 10%', 'vênh mã hs giữa các chi cục']
  },
  {
    id: 44,
    scenarioCode: 'TH-44',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Doanh nghiệp kiến nghị lo rủi ro hồi tố chính sách thuế sau thanh tra',
    realArticleTitle: 'Lo rủi ro hồi tố, doanh nghiệp kiến nghị chính sách thuế ổn định, rõ lộ trình',
    pressSources: ['Báo VietNamNet'],
    decree376Basis: {
      clauseArticle: 'Điểm a, Điểm e Khoản 9 Điều 2; Khoản 9 Điều 3, Khoản 24 Điều 3',
      leadAgencyId: 'vu-cstpl',
      leadAgencyName: 'Vụ Chính sách thuế, phí và lệ phí',
      decreeArticleClause: 'Khoản 9 Điều 3',
      cooperatingUnits: ['Cục Thuế']
    },
    classificationReason: 'Cơ quan thuế chưa ban hành cam kết nguyên tắc không hồi tố đối với những doanh nghiệp đã thực hiện đúng theo các văn bản trả lời nghiệp vụ trước đó.',
    natureOfInformationVacuum: 'Cơ quan thuế chưa ban hành nguyên tắc không hồi tố đối với DN đã thực hiện đúng theo văn bản trả lời nghiệp vụ trước đó.',
    actionScriptVi: 'Cục Thuế phát thông cáo báo chí giải đáp kiến nghị: Khẳng định bảo vệ quyền lợi hợp pháp của người nộp thuế nếu đã tuân thủ đúng văn bản hướng dẫn.',
    calibratedScores: { S: 27, D: 11, V: 0.5, I: 0.6, riskScore: 49.5 },
    matchingKeywords: ['lo rủi ro hồi tố', 'doanh nghiệp kiến nghị chính sách thuế ổn định', 'rủi ro hồi tố thuế']
  },
  {
    id: 45,
    scenarioCode: 'TH-45',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Tiệm vàng đồng loạt đóng cửa né kiểm tra hóa đơn điện tử máy tính tiền',
    realArticleTitle: 'Tiệm vàng đóng cửa lan rộng, nhiều nơi giấu hàng nhái thương hiệu / Phố vàng đóng cửa né tránh kiểm tra hóa đơn điện tử',
    pressSources: ['Báo Tuổi Trẻ', 'Báo Người Lao Động'],
    decree376Basis: {
      clauseArticle: 'Điểm b, Điểm d Khoản 9 Điều 2; Khoản 24 Điều 3',
      leadAgencyId: 'cuc-thue',
      leadAgencyName: 'Cục Thuế',
      decreeArticleClause: 'Khoản 24 Điều 3',
    },
    classificationReason: 'Tiểu thương lo sợ bị hồi tố truy thu nguồn gốc vàng trang sức tích lũy lịch sử; thiếu hướng dẫn về việc lập bảng kê kiểm kê tồn kho ban đầu.',
    natureOfInformationVacuum: 'Tiểu thương lo sợ bị hồi tố truy thu nguồn gốc vàng lịch sử; thiếu hướng dẫn về bảng kê tồn kho ban đầu.',
    actionScriptVi: 'Ban hành văn bản hướng dẫn biểu mẫu tự kê khai tồn kho ban đầu; cam kết không máy móc hồi tố lịch sử nguồn gốc; đối thoại trực tiếp với Hội Kim hoàn.',
    calibratedScores: { S: 31, D: 12, V: 0.6, I: 0.65, riskScore: 54.5 },
    matchingKeywords: ['tiệm vàng đóng cửa lan rộng', 'phố vàng tại tp.hcm đóng cửa', 'né tránh kiểm tra hóa đơn điện tử']
  },
  {
    id: 46,
    scenarioCode: 'TH-46',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Hàng nghìn tỷ hoàn thuế GTGT dăm gỗ, cao su bị ngâm vì xác minh F3, F4',
    realArticleTitle: 'Hàng nghìn tỷ đồng tiền hoàn thuế GTGT bị ngâm: Doanh nghiệp cạn kiệt dòng tiền / Xác minh nguồn gốc gỗ đến tận người trồng rừng gây ách tắc',
    pressSources: ['Báo VnEconomy', 'Báo Nông nghiệp Việt Nam'],
    decree376Basis: {
      clauseArticle: 'Điểm c Khoản 9 Điều 2; Khoản 24 Điều 3',
      leadAgencyId: 'cuc-thue',
      leadAgencyName: 'Cục Thuế',
      decreeArticleClause: 'Khoản 24 Điều 3',
    },
    classificationReason: 'Cơ quan thuế chậm công bố thời hạn tối đa xác minh chuỗi trung gian; doanh nghiệp xuất khẩu chân chính bị đọng vốn hàng trăm tỷ đồng không được giải quyết.',
    natureOfInformationVacuum: 'Cơ quan thuế chậm công bố thời hạn tối đa xác minh chuỗi trung gian; DN xuất khẩu chân chính bị đọng vốn hàng trăm tỷ đồng.',
    actionScriptVi: 'Ban hành Công điện khẩn của Cục Thuế: Phân định rõ DN xuất khẩu chỉ chịu trách nhiệm ở khâu F1; nếu có chứng từ ngân hàng và tờ khai thì hoàn thuế trong 6 ngày.',
    calibratedScores: { S: 35, D: 15, V: 0.7, I: 0.75, riskScore: 63.5 },
    matchingKeywords: ['hàng nghìn tỷ đồng tiền hoàn thuế gtgt bị ngâm', 'doanh nghiệp cạn kiệt dòng tiền', 'xác minh nguồn gốc gỗ đến tận người trồng rừng']
  },
  {
    id: 47,
    scenarioCode: 'TH-47',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Bất cập mức giảm trừ gia cảnh thuế TNCN 11 triệu đồng',
    realArticleTitle: 'Mức giảm trừ gia cảnh tăng: Người làm công ăn lương vẫn bị thiệt / Mức giảm trừ 11 triệu đồng quá lạc hậu, người làm công oằn mình cõng thuế',
    pressSources: ['Báo Tuổi Trẻ', 'Báo Lao Động'],
    decree376Basis: {
      clauseArticle: 'Điểm a Khoản 9 Điều 2; Khoản 9 Điều 3',
      leadAgencyId: 'vu-cstpl',
      leadAgencyName: 'Vụ Chính sách thuế, phí và lệ phí',
      decreeArticleClause: 'Khoản 9 Điều 3',
    },
    classificationReason: 'Bộ Tài chính chậm công bố phương án sửa đổi Luật Thuế TNCN theo biến động chi phí sinh hoạt (y tế, giáo dục) và cải cách tiền lương, khiến cử tri bức xúc.',
    natureOfInformationVacuum: 'Chậm công bố phương án sửa đổi Luật Thuế TNCN theo biến động CPI y tế, giáo dục và cải cách tiền lương.',
    actionScriptVi: 'Đăng tải Dự thảo đề cương sửa đổi Luật Thuế TNCN trên Cổng TTĐT lấy ý kiến nhân dân; tổ chức tọa đàm chuyên gia trên Báo Tuổi Trẻ phân tích phương án nâng mức.',
    calibratedScores: { S: 32, D: 14, V: 0.65, I: 0.85, riskScore: 61.5 },
    matchingKeywords: ['mức giảm trừ gia cảnh tăng: người làm công ăn lương', 'mức giảm trừ 11 triệu đồng quá lạc hậu', 'oằn mình cõng thuế']
  },
  {
    id: 48,
    scenarioCode: 'TH-48',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Cây xăng đóng cửa diện rộng vì chiết khấu 0 đồng kéo dài',
    realArticleTitle: 'Doanh nghiệp bán lẻ xăng dầu rơi vào \'thế bí\', đồng loạt kêu cứu vì chiết khấu 0 đồng / Chấm dứt tình trạng chiết khấu 0 đồng',
    pressSources: ['Báo VnEconomy', 'Báo Lao Động'],
    decree376Basis: {
      clauseArticle: 'Khoản 21 Điều 2; Khoản 18 Điều 3',
      leadAgencyId: 'cuc-qlg',
      leadAgencyName: 'Cục Quản lý giá',
      decreeArticleClause: 'Khoản 18 Điều 3',
      cooperatingUnits: ['Bộ Công Thương']
    },
    classificationReason: 'Bộ Tài chính bị chỉ trích chậm cập nhật chi phí vận tải biển và premium nhập khẩu vào giá cơ sở; hai bộ đùn đẩy trách nhiệm điều hành giá trên mặt báo.',
    natureOfInformationVacuum: 'Chậm cập nhật chi phí vận tải biển và premium vào giá cơ sở; hai bộ đùn đẩy trách nhiệm điều hành chiết khấu trên mặt báo.',
    actionScriptVi: 'Khảo sát hỏa tốc chi phí phát sinh; ban hành văn bản nâng chi phí kinh doanh định mức áp dụng ngay kỳ điều hành tiếp theo; họp báo liên bộ công khai phương pháp tính.',
    calibratedScores: { S: 36, D: 16, V: 0.75, I: 0.85, riskScore: 68.0 },
    matchingKeywords: ['bán lẻ xăng dầu rơi vào \'thế bí\'', 'đồng loạt kêu cứu vì chiết khấu 0 đồng', 'chấm dứt tình trạng chiết khấu 0 đồng']
  },
  {
    id: 49,
    scenarioCode: 'TH-49',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Hàng nghìn trụ sở cơ quan công quyền dôi dư sau sáp nhập bỏ hoang',
    realArticleTitle: 'Hơn 1.000 trụ sở, nhà đất dôi dư bỏ hoang xuống cấp sau sáp nhập / Trụ sở xã dôi dư biến thành nơi chăn thả bò, lãng phí nghìn tỷ',
    pressSources: ['Báo VOV', 'Báo Đại biểu Nhân dân'],
    decree376Basis: {
      clauseArticle: 'Điểm a, Điểm b Khoản 12 Điều 2; Khoản 14 Điều 3',
      leadAgencyId: 'cuc-qlcs',
      leadAgencyName: 'Cục Quản lý công sản',
      decreeArticleClause: 'Khoản 14 Điều 3',
    },
    classificationReason: 'Địa phương lúng túng vì quy định phê duyệt phương án sắp xếp lại nhà đất công sản theo Nghị định của Bộ Tài chính quá rườm rà; dư luận chỉ trích cơ quan trung ương ôm quyền.',
    natureOfInformationVacuum: 'Địa phương lúng túng vì quy định phê duyệt phương án sắp xếp nhà đất công sản quá rườm rà; dư luận chỉ trích ôm quyền.',
    actionScriptVi: 'Trình Chính phủ sửa đổi Nghị định về quản lý công sản: Phân cấp triệt để 100% quyền tự quyết chuyển đổi công năng hoặc đấu giá trụ sở dôi dư cho Chủ tịch UBND cấp tỉnh.',
    calibratedScores: { S: 33, D: 14, V: 0.6, I: 0.7, riskScore: 59.0 },
    matchingKeywords: ['hơn 1.000 trụ sở, nhà đất dôi dư bỏ hoang', 'trụ sở xã dôi dư biến thành nơi chăn thả bò']
  },
  {
    id: 50,
    scenarioCode: 'TH-50',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Doanh nghiệp BĐS ép trái chủ nhận đất định giá ảo để cấn trừ nợ',
    realArticleTitle: 'Nghẽn mạch tái cơ cấu trái phiếu: Doanh nghiệp muốn trả nợ bằng đất nhưng nhà đầu tư từ chối vì giá ảo / Ép đổi trái phiếu lấy căn hộ trên giấy',
    pressSources: ['Báo VietNamNet', 'Báo Dân Trí'],
    decree376Basis: {
      clauseArticle: 'Khoản 19 Điều 2; Khoản 8 Điều 3',
      leadAgencyId: 'vu-dchtc',
      leadAgencyName: 'Vụ Các định chế tài chính',
      decreeArticleClause: 'Khoản 8 Điều 3',
      cooperatingUnits: ['Ủy ban Chứng khoán Nhà nước']
    },
    classificationReason: 'Thiếu hướng dẫn về nguyên tắc thỏa thuận dân sự bình đẳng; nhà đầu tư hoang mang không biết từ chối tài sản có làm mất quyền đòi nợ tiền mặt hay không.',
    natureOfInformationVacuum: 'Thiếu hướng dẫn về thỏa thuận dân sự bình đẳng; NĐT không biết từ chối nhận đất định giá ảo có làm mất quyền đòi tiền mặt hay không.',
    actionScriptVi: 'Trả lời phỏng vấn báo chí: Khẳng định việc trả nợ bằng tài sản phải có sự đồng thuận 100% của trái chủ và chứng thư thẩm định giá độc lập; nếu không đồng thuận thì DN vẫn phải trả tiền mặt.',
    calibratedScores: { S: 34, D: 15, V: 0.65, I: 0.75, riskScore: 62.0 },
    matchingKeywords: ['nghẽn mạch tái cơ cấu trái phiếu', 'trả nợ bằng nhà đất nhưng nhà đầu tư từ chối', 'giá ảo', 'đổi trái phiếu lấy căn hộ trên giấy']
  },
  {
    id: 51,
    scenarioCode: 'TH-51',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Bệnh viện công tắc nghẽn mua máy móc y tế dưới 100 triệu do vướng định mức công sản',
    realArticleTitle: 'Mua sắm máy móc y tế dưới 100 triệu đồng vẫn phải qua 5 tầng nấc thẩm định: Bệnh viện công tắc nghẽn chi thường xuyên',
    pressSources: ['Báo Đại biểu Nhân dân'],
    decree376Basis: {
      clauseArticle: 'Điểm b Khoản 12 Điều 2; Khoản 14 Điều 3, Khoản 4 Điều 3',
      leadAgencyId: 'cuc-qlcs',
      leadAgencyName: 'Cục Quản lý công sản',
      decreeArticleClause: 'Khoản 14 Điều 3',
      cooperatingUnits: ['Vụ Tài chính hành chính sự nghiệp']
    },
    classificationReason: 'Lãnh đạo bệnh viện không dám tự quyết mua phụ tùng thay thế vì sợ vi phạm định mức máy móc chuyên dùng; thiếu văn bản giải thích cơ chế tự chủ tài sản.',
    natureOfInformationVacuum: 'Lãnh đạo bệnh viện không dám tự quyết mua phụ tùng thay thế vì sợ vi phạm định mức máy móc chuyên dùng; thiếu văn bản giải thích cơ chế tự chủ tài sản.',
    actionScriptVi: 'Ban hành Thông tư sửa đổi định mức tài sản chuyên dùng: Giao toàn quyền cho Giám đốc bệnh viện tự chủ quyết định mua sắm sửa chữa tài sản dưới 100 triệu đồng từ quỹ phát triển hoạt động sự nghiệp.',
    calibratedScores: { S: 30, D: 12, V: 0.55, I: 0.6, riskScore: 53.0 },
    matchingKeywords: ['mua sắm máy móc y tế dưới 100 triệu', 'qua 5 tầng nấc thẩm định', 'bệnh viện công tắc nghẽn chi thường xuyên']
  },
  {
    id: 52,
    scenarioCode: 'TH-52',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Tiêu chí "cài cắm" trong hồ sơ mời thầu xây lắp hạn chế cạnh tranh',
    realArticleTitle: 'Cài cắm tiêu chí hồ sơ mời thầu: Doanh nghiệp vừa và nhỏ \'bó tay\' nhìn các gói thầu lớn / Bẫy quân xanh quân đỏ trong đấu thầu qua mạng',
    pressSources: ['Báo Lao Động', 'Báo Đấu thầu'],
    decree376Basis: {
      clauseArticle: 'Điểm b, Điểm c Khoản 13 Điều 2; Khoản 15 Điều 3',
      leadAgencyId: 'cuc-qldt',
      leadAgencyName: 'Cục Quản lý đấu thầu',
      decreeArticleClause: 'Khoản 15 Điều 3',
    },
    classificationReason: 'Chủ đầu tư né tránh trả lời kiến nghị của nhà thầu; cơ quan quản lý chưa kịp thời ban hành danh mục các tiêu chí vi phạm tính cạnh tranh để làm căn cứ hủy thầu.',
    natureOfInformationVacuum: 'Chủ đầu tư né tránh trả lời kiến nghị; chưa có danh mục nhận diện các tiêu chí vi phạm tính cạnh tranh để làm căn cứ hủy thầu.',
    actionScriptVi: 'Ban hành văn bản chấn chỉnh toàn quốc kèm Phụ lục nhận diện 15 tiêu chí hạn chế cạnh tranh trái luật; quyết định kiểm tra đột xuất gói thầu báo chí phản ánh.',
    calibratedScores: { S: 31, D: 13, V: 0.6, I: 0.65, riskScore: 55.0 },
    matchingKeywords: ['cài cắm tiêu chí hồ sơ mời thầu', 'doanh nghiệp vừa và nhỏ \'bó tay\'', 'bẫy quân xanh quân đỏ trong đấu thầu']
  },
  {
    id: 53,
    scenarioCode: 'TH-53',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Doanh nghiệp trúng thầu gạo dự trữ quốc gia bỏ cọc khi giá gạo tăng',
    realArticleTitle: 'Vụ doanh nghiệp trúng thầu gạo dự trữ quốc gia bỏ cọc: Cần xử lý nghiêm minh / Doanh nghiệp bỏ thầu cung ứng gạo: Nguy cơ thiếu hụt nguồn cung cứu trợ',
    pressSources: ['Báo Công an Nhân dân', 'Báo Tuổi Trẻ'],
    decree376Basis: {
      clauseArticle: 'Khoản 11 Điều 2; Khoản 26 Điều 3',
      leadAgencyId: 'cuc-dtnn-res',
      leadAgencyName: 'Cục Dự trữ Nhà nước',
      decreeArticleClause: 'Khoản 26 Điều 3',
    },
    classificationReason: 'Dư luận lo ngại kho gạo dự trữ quốc gia bị thiếu hụt phục vụ cứu trợ thiên tai; thiếu thông tin về biện pháp đấu thầu bổ sung và chế tài xử lý nhà thầu bội tín.',
    natureOfInformationVacuum: 'Dư luận lo ngại kho gạo dự trữ quốc gia thiếu hụt cứu trợ thiên tai; thiếu thông tin về đấu thầu bổ sung và chế tài xử lý nhà thầu bội tín.',
    actionScriptVi: 'Công bố quyết định tịch thu bảo lãnh và cấm tham gia thầu 3 năm; kích hoạt phương án điều phối gạo giữa 15 Cục Dự trữ Nhà nước khu vực bảo đảm an toàn mức dự trữ.',
    calibratedScores: { S: 33, D: 13, V: 0.6, I: 0.7, riskScore: 58.5 },
    matchingKeywords: ['trúng thầu gạo dự trữ quốc gia bỏ cọc', 'nguy cơ thiếu hụt nguồn cung cứu trợ', 'bỏ thầu cung ứng gạo dự trữ']
  },
  {
    id: 54,
    scenarioCode: 'TH-54',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Chậm giải ngân vốn đầu tư công do Kho bạc kiểm soát thủ tục rườm rà',
    realArticleTitle: 'Giải ngân vốn đầu tư công chậm: Vốn chờ thủ tục hay thủ tục chờ vốn? / Hàng nghìn tỷ đồng vốn đầu tư công đắp chiếu vì vướng mắc thanh toán',
    pressSources: ['Thời báo Tài chính Việt Nam', 'Báo Đầu tư'],
    decree376Basis: {
      clauseArticle: 'Khoản 7, Khoản 10 Điều 2; Khoản 2 Điều 3, Khoản 28 Điều 3',
      leadAgencyId: 'vu-dtht',
      leadAgencyName: 'Vụ Đầu tư và Phát triển hạ tầng',
      decreeArticleClause: 'Khoản 2 Điều 3',
      cooperatingUnits: ['Kho bạc Nhà nước']
    },
    classificationReason: 'Chủ đầu tư đổ lỗi cho Kho bạc kiểm soát hồ sơ chậm; Kho bạc giải thích do hồ sơ thiếu thủ tục; nhà thầu bị nợ đọng xây dựng cơ bản kéo dài.',
    natureOfInformationVacuum: 'Chủ đầu tư đổ lỗi cho Kho bạc kiểm soát chậm; Kho bạc giải thích do thiếu thủ tục; nhà thầu bị nợ đọng xây dựng cơ bản kéo dài.',
    actionScriptVi: 'KBNN ban hành công điện khẩn chỉ đạo 20 Kho bạc khu vực áp dụng quy trình "thanh toán trước, kiểm soát sau", cam kết duyệt chi trong 24 giờ cho hồ sơ hợp lệ.',
    calibratedScores: { S: 34, D: 16, V: 0.65, I: 0.8, riskScore: 63.5 },
    matchingKeywords: ['giải ngân vốn đầu tư công chậm: vốn chờ thủ tục', 'hàng nghìn tỷ đồng vốn đầu tư công đắp chiếu', 'vướng mắc thủ tục thanh toán']
  },
  {
    id: 55,
    scenarioCode: 'TH-55',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Bệnh nhân BHYT khốn khổ tự mua thuốc ngoài do bệnh viện thiếu thuốc đấu thầu',
    realArticleTitle: 'Bệnh nhân BHYT khốn khổ vì phải tự mua thuốc ngoài: Quyền lợi người bệnh bị xâm hại / Bệnh viện cạn kiệt vật tư, người có thẻ gánh viện phí tiền triệu',
    pressSources: ['Báo Dân Trí', 'Báo Tiền Phong'],
    decree376Basis: {
      clauseArticle: 'Khoản 22 Điều 2; Khoản 34 Điều 3',
      leadAgencyId: 'bhxh-vn',
      leadAgencyName: 'Bảo hiểm xã hội Việt Nam',
      decreeArticleClause: 'Khoản 34 Điều 3',
    },
    classificationReason: 'Cơ quan BHXH chậm ban hành cơ chế thanh toán trực tiếp cho người bệnh khi cơ sở y tế thiếu thuốc đấu thầu; người dân bức xúc vì có thẻ BHYT nhưng phải tự bỏ tiền túi.',
    natureOfInformationVacuum: 'Chậm ban hành cơ chế thanh toán trực tiếp khi bệnh viện thiếu thuốc đấu thầu; người có thẻ BHYT bức xúc vì phải bỏ tiền túi.',
    actionScriptVi: 'BHXH Việt Nam ban hành hướng dẫn: Cho phép người bệnh mang hóa đơn mua thuốc ngoài về cơ quan BHXH huyện thanh toán lại 100%; trừ kinh phí vào quỹ BHYT bệnh viện vi phạm.',
    calibratedScores: { S: 35, D: 15, V: 0.7, I: 0.8, riskScore: 64.5 },
    matchingKeywords: ['bệnh nhân bhyt khốn khổ vì phải tự mua thuốc ngoài', 'quyền lợi người bệnh bị xâm hại', 'bệnh viện cạn kiệt vật tư']
  },
  {
    id: 56,
    scenarioCode: 'TH-56',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Tranh cãi số liệu doanh nghiệp rút lui khỏi thị trường tăng đột biến',
    realArticleTitle: 'Tranh cãi số liệu doanh nghiệp rút lui khỏi thị trường tăng đột biến: Nền kinh tế thực sự khó khăn hay do thanh lọc tự nhiên?',
    pressSources: ['Thời báo Ngân hàng', 'Báo VnEconomy'],
    decree376Basis: {
      clauseArticle: 'Khoản 23 Điều 2; Khoản 27 Điều 3, Khoản 20 Điều 3',
      leadAgencyId: 'cuc-tk',
      leadAgencyName: 'Cục Thống kê',
      decreeArticleClause: 'Khoản 27 Điều 3',
      cooperatingUnits: ['Cục Phát triển doanh nghiệp tư nhân và kinh tế tập thể']
    },
    classificationReason: 'Báo cáo thống kê ban đầu chưa bóc tách rõ giữa các doanh nghiệp ảo bị thu hồi giấy phép theo chiến dịch làm sạch dữ liệu và các doanh nghiệp đang sản xuất kinh doanh thật.',
    natureOfInformationVacuum: 'Chưa bóc tách rõ giữa doanh nghiệp ảo bị xóa MST theo chiến dịch làm sạch và doanh nghiệp kinh doanh thật rút lui.',
    actionScriptVi: 'Cục Thống kê phát hành thông cáo báo chí chuyên đề: Phân tích sâu cơ cấu doanh nghiệp rút lui, làm rõ tỷ lệ DN "chết lâm sàng" tồn đọng nhiều năm để ổn định tâm lý thị trường.',
    calibratedScores: { S: 28, D: 12, V: 0.5, I: 0.6, riskScore: 50.5 },
    matchingKeywords: ['tranh cãi số liệu doanh nghiệp rút lui khỏi thị trường', 'tăng đột biến', 'kinh tế khó khăn hay thanh lọc tự nhiên']
  },
  {
    id: 57,
    scenarioCode: 'TH-57',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Vướng mắc thủ tục ghi thu ghi chi vốn ODA viện trợ làm chậm dự án nước sạch',
    realArticleTitle: 'Vướng mắc thủ tục ghi thu ghi chi vốn ODA không hoàn lại: Nhiều công trình cấp nước sạch trường học miền núi chậm tiến độ',
    pressSources: ['Báo Nhân Dân'],
    decree376Basis: {
      clauseArticle: 'Khoản 15 Điều 2; Khoản 13 Điều 3, Khoản 28 Điều 3',
      leadAgencyId: 'cuc-qln',
      leadAgencyName: 'Cục Quản lý nợ và Tài chính đối ngoại',
      decreeArticleClause: 'Khoản 13 Điều 3',
      cooperatingUnits: ['Kho bạc Nhà nước']
    },
    classificationReason: 'Thủ tục xác nhận viện trợ tài chính tại Kho bạc quá phức tạp khiến tiền viện trợ đã về tài khoản nhưng không thể giải ngân cho nhà thầu.',
    natureOfInformationVacuum: 'Thủ tục xác nhận viện trợ tài chính quá phức tạp khiến tiền đã về tài khoản nhưng không thể giải ngân cho nhà thầu.',
    actionScriptVi: 'Ban hành quy trình điện tử rút ngắn thời gian xử lý hồ sơ ghi thu ghi chi viện trợ khẩn cấp xuống còn 3 ngày làm việc.',
    calibratedScores: { S: 29, D: 11, V: 0.45, I: 0.55, riskScore: 50.0 },
    matchingKeywords: ['vướng mắc thủ tục ghi thu ghi chi vốn oda không hoàn lại', 'nhiều công trình cấp nước sạch trường học miền núi chậm']
  },
  {
    id: 58,
    scenarioCode: 'TH-58',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Giá dịch vụ cảng biển tại Việt Nam thấp bất thường do cạnh tranh phá giá',
    realArticleTitle: 'Giá dịch vụ cảng biển tại Việt Nam thấp bất thường: Doanh nghiệp logistics kêu gọi áp giá sàn để tránh cạnh tranh phá giá',
    pressSources: ['Báo Diễn đàn Doanh nghiệp'],
    decree376Basis: {
      clauseArticle: 'Điểm c, Điểm e Khoản 21 Điều 2; Khoản 18 Điều 3',
      leadAgencyId: 'cuc-qlg',
      leadAgencyName: 'Cục Quản lý giá',
      decreeArticleClause: 'Khoản 18 Điều 3',
      cooperatingUnits: ['Bộ Giao thông Vận tải']
    },
    classificationReason: 'Hãng tàu nước ngoài ép giá bốc dỡ của cảng Việt Nam xuống mức quá thấp gây thất thu ngân sách; Bộ Tài chính chưa công bố kết quả rà soát khung giá dịch vụ bốc dỡ.',
    natureOfInformationVacuum: 'Hãng tàu ngoại ép giá bốc dỡ của cảng Việt Nam xuống quá thấp; chưa công bố khung giá tối thiểu dịch vụ bốc dỡ container.',
    actionScriptVi: 'Cục Quản lý giá trả lời phỏng vấn báo chí: Công bố tiến độ ban hành khung giá tối thiểu dịch vụ bốc dỡ container cảng biển để bảo vệ doanh nghiệp hạ tầng trong nước.',
    calibratedScores: { S: 28, D: 11, V: 0.45, I: 0.55, riskScore: 49.0 },
    matchingKeywords: ['giá dịch vụ cảng biển tại việt nam thấp bất thường', 'kêu gọi áp giá sàn để tránh cạnh tranh phá giá']
  },
  {
    id: 59,
    scenarioCode: 'TH-59',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Thuế sàn TMĐT: Tranh chấp nghĩa vụ giữa cá nhân kinh doanh và Shopee, TikTok',
    realArticleTitle: 'Thu thuế sàn thương mại điện tử: Trách nhiệm thuộc về sàn hay người bán hàng?',
    pressSources: ['Báo Đầu tư', 'Báo VnExpress'],
    decree376Basis: {
      clauseArticle: 'Điểm b Khoản 9 Điều 2; Khoản 24 Điều 3',
      leadAgencyId: 'cuc-thue',
      leadAgencyName: 'Cục Thuế',
      decreeArticleClause: 'Khoản 24 Điều 3',
    },
    classificationReason: 'Quy định yêu cầu sàn khấu trừ và nộp thuế thay chưa rõ lộ trình; người bán hàng lo sợ bị phạt truy thu kép cả ở địa phương lẫn trên sàn.',
    natureOfInformationVacuum: 'Quy định khấu trừ và nộp thuế thay trên sàn chưa rõ lộ trình; người bán hàng lo sợ bị phạt truy thu kép.',
    actionScriptVi: 'Cục Thuế tổ chức họp báo chuyên đề: Làm rõ nguyên tắc sàn cung cấp thông tin doanh thu, hướng dẫn cá nhân tự đối soát nghĩa vụ trên app eTax Mobile.',
    calibratedScores: { S: 31, D: 13, V: 0.6, I: 0.7, riskScore: 56.5 },
    matchingKeywords: ['thu thuế sàn thương mại điện tử', 'trách nhiệm thuộc về sàn hay người bán hàng']
  },
  {
    id: 60,
    scenarioCode: 'TH-60',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Hàng loạt dự án cổ phần hóa tổng công ty nhà nước đóng băng vì đất đai',
    realArticleTitle: 'Vướng phương án sắp xếp lại nhà đất: Dự án cổ phần hóa nghìn tỷ của các tổng công ty nhà nước tiếp tục \'đóng băng\'',
    pressSources: ['Báo VnEconomy'],
    decree376Basis: {
      clauseArticle: 'Khoản 12, Khoản 14 Điều 2; Khoản 14 Điều 3, Khoản 19 Điều 3',
      leadAgencyId: 'cuc-qlcs',
      leadAgencyName: 'Cục Quản lý công sản',
      decreeArticleClause: 'Khoản 14 Điều 3',
      cooperatingUnits: ['Cục Phát triển doanh nghiệp nhà nước (Khoản 19 Điều 3)']
    },
    classificationReason: 'Chồng chéo giữa quy định định giá quyền sử dụng đất khi cổ phần hóa và Luật Đất đai khiến các hội đồng thẩm định địa phương không dám ký phê duyệt phương án.',
    natureOfInformationVacuum: 'Chồng chéo giữa định giá đất khi cổ phần hóa và Luật Đất đai khiến hội đồng thẩm định địa phương sợ trách nhiệm, không dám ký phê duyệt.',
    actionScriptVi: 'Cục Phát triển doanh nghiệp nhà nước chủ trì hội thảo bàn tròn kinh tế, công bố dự thảo quy trình liên thông thẩm định đất đai phục vụ cổ phần hóa.',
    calibratedScores: { S: 32, D: 14, V: 0.55, I: 0.65, riskScore: 57.0 },
    matchingKeywords: ['vướng phương án sắp xếp lại nhà đất', 'cổ phần hóa nghìn tỷ của các tổng công ty', 'tiếp tục \'đóng băng\'']
  },
  {
    id: 61,
    scenarioCode: 'TH-61',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Bảo hiểm từ chối bồi thường vì lỗi kê khai không có quan hệ nhân quả',
    realArticleTitle: 'Bảo hiểm từ chối chi trả tiền chữa ung thư vì \'chưa kê khai viêm họng từ 5 năm trước\': Khách hàng khởi kiện ra tòa',
    pressSources: ['Báo VnExpress'],
    decree376Basis: {
      clauseArticle: 'Khoản 18 Điều 2; Khoản 16 Điều 3',
      leadAgencyId: 'cuc-qlbh',
      leadAgencyName: 'Cục Quản lý, giám sát bảo hiểm',
      decreeArticleClause: 'Khoản 16 Điều 3',
    },
    classificationReason: 'Doanh nghiệp bảo hiểm lạm dụng điều khoản "trung thực tuyệt đối" để từ chối bồi thường các bệnh không liên quan; cơ quan quản lý chưa ban hành chế tài bảo vệ bên mua yếu thế.',
    natureOfInformationVacuum: 'Doanh nghiệp bảo hiểm lạm dụng điều khoản trung thực tuyệt đối để từ chối bồi thường các bệnh không có quan hệ nhân quả y khoa.',
    actionScriptVi: 'Cục QLBH ban hành văn bản chấn chỉnh toàn thị trường: Nghiêm cấm từ chối bồi thường đối với tiền sử bệnh lý không có mối quan hệ nhân quả y khoa với sự kiện bảo hiểm.',
    calibratedScores: { S: 33, D: 14, V: 0.65, I: 0.7, riskScore: 60.0 },
    matchingKeywords: ['bảo hiểm từ chối chi trả tiền chữa ung thư', 'chưa kê khai viêm họng từ 5 năm trước', 'khách hàng khởi kiện ra tòa']
  },
  {
    id: 62,
    scenarioCode: 'TH-62',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Nhà đầu tư ngoại ngóng ưu đãi thuế tại Khu thương mại tự do Đà Nẵng',
    realArticleTitle: 'Khu thương mại tự do Đà Nẵng: Nhà đầu tư ngoại \'ngóng\' danh mục ưu đãi thuế tài chính và cơ chế một cửa',
    pressSources: ['Báo Đầu tư'],
    decree376Basis: {
      clauseArticle: 'Khoản 7, Khoản 9 Điều 2; Khoản 2 Điều 3, Khoản 9 Điều 3',
      leadAgencyId: 'vu-cstpl',
      leadAgencyName: 'Vụ Chính sách thuế, phí và lệ phí',
      decreeArticleClause: 'Khoản 9 Điều 3',
      cooperatingUnits: ['Vụ Đầu tư và Phát triển hạ tầng']
    },
    classificationReason: 'Nghị quyết Quốc hội đã có hiệu lực nhưng Bộ Tài chính chưa ban hành văn bản hướng dẫn chi tiết về khấu hao tài sản và thuế TNDN ưu đãi trong khu phi thuế quan.',
    natureOfInformationVacuum: 'Nghị quyết Quốc hội có hiệu lực nhưng chậm ban hành thông tư hướng dẫn ưu đãi tài chính và khấu hao tài sản trong khu tự do.',
    actionScriptVi: 'Đăng tải toàn văn Dự thảo Thông tư hướng dẫn ưu đãi tài chính cho Khu thương mại tự do trên Cổng thông tin Bộ để lấy ý kiến rộng rãi.',
    calibratedScores: { S: 27, D: 11, V: 0.45, I: 0.55, riskScore: 48.0 },
    matchingKeywords: ['khu thương mại tự do đà nẵng', 'nhà đầu tư ngoại \'ngóng\' danh mục ưu đãi thuế tài chính']
  },
  {
    id: 63,
    scenarioCode: 'TH-63',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Hàng nghìn công nhân mang thai bị treo chế độ do chủ DN bỏ trốn nợ BHXH',
    realArticleTitle: 'Hàng nghìn công nhân mang thai bị treo chế độ: Doanh nghiệp trốn đóng tiền tỷ BHXH rồi biến mất, bảo hiểm xã hội \'bó tay\'?',
    pressSources: ['Báo Thanh Niên'],
    decree376Basis: {
      clauseArticle: 'Khoản 22 Điều 2; Khoản 34 Điều 3',
      leadAgencyId: 'bhxh-vn',
      leadAgencyName: 'Bảo hiểm xã hội Việt Nam',
      decreeArticleClause: 'Khoản 34 Điều 3',
    },
    classificationReason: 'Thiếu văn bản hướng dẫn giải quyết quyền lợi cho người lao động độc lập với tình trạng tài chính của người sử dụng lao động; công nhân đóng đủ nhưng bị tước đoạt trợ cấp.',
    natureOfInformationVacuum: 'Thiếu hướng dẫn giải quyết chế độ thai sản độc lập với tình trạng tài chính của chủ DN nợ tiền bỏ trốn.',
    actionScriptVi: 'BHXH Việt Nam ban hành hướng dẫn nghiệp vụ: Ghi nhận quá trình đóng thực tế để chi trả ngay chế độ thai sản, chuyển hồ sơ chủ DN trốn đóng sang công an xử lý hình sự.',
    calibratedScores: { S: 35, D: 15, V: 0.7, I: 0.75, riskScore: 63.5 },
    matchingKeywords: ['hàng nghìn công nhân mang thai bị treo chế độ', 'trốn đóng tiền tỷ bhxh rồi biến mất', 'bảo hiểm xã hội \'bó tay\'']
  },
  {
    id: 64,
    scenarioCode: 'TH-64',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Bão giá cát đá xây dựng khiến nhà thầu cao tốc Bắc - Nam xin bù giá',
    realArticleTitle: 'Bão giá vật liệu xây dựng: Hàng loạt nhà thầu cao tốc Bắc - Nam xin bù giá vì nguy cơ phá sản nếu thi công hợp đồng trọn gói',
    pressSources: ['Báo Giao thông'],
    decree376Basis: {
      clauseArticle: 'Khoản 13 Điều 2; Khoản 15 Điều 3',
      leadAgencyId: 'cuc-qldt',
      leadAgencyName: 'Cục Quản lý đấu thầu',
      decreeArticleClause: 'Khoản 15 Điều 3',
      cooperatingUnits: ['Bộ Giao thông Vận tải']
    },
    classificationReason: 'Thiếu cơ chế xử lý trường hợp bất khả kháng về biến động giá vật liệu đối với hợp đồng trọn gói trong dự án trọng điểm quốc gia.',
    natureOfInformationVacuum: 'Thiếu cơ chế xử lý biến động giá bất khả kháng đối với hợp đồng trọn gói trong dự án cao tốc trọng điểm quốc gia.',
    actionScriptVi: 'Cục Quản lý đấu thầu trả lời Báo Giao thông: Hướng dẫn chủ đầu tư căn cứ điều khoản bất khả kháng trong Luật Đấu thầu báo cáo Thủ tướng Chính phủ cơ chế điều chỉnh giá hợp đồng.',
    calibratedScores: { S: 31, D: 13, V: 0.55, I: 0.65, riskScore: 55.5 },
    matchingKeywords: ['bão giá vật liệu xây dựng', 'hàng loạt nhà thầu cao tốc bắc - nam xin bù giá', 'nguy cơ phá sản nếu thi công hợp đồng trọn gói']
  },
  {
    id: 65,
    scenarioCode: 'TH-65',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'DN xuất khẩu chịu tiền phạt container cắm điện nửa tỷ mỗi ngày tại cửa khẩu',
    realArticleTitle: 'Nông sản xuất khẩu ùn tắc tại cửa khẩu Lạng Sơn: Doanh nghiệp chịu tiền phạt cắm điện lạnh container lên tới nửa tỷ mỗi ngày',
    pressSources: ['Báo Tiền Phong'],
    decree376Basis: {
      clauseArticle: 'Khoản 20 Điều 2; Khoản 25 Điều 3',
      leadAgencyId: 'cuc-hq',
      leadAgencyName: 'Cục Hải quan',
      decreeArticleClause: 'Khoản 25 Điều 3',
    },
    classificationReason: 'Thiếu cơ chế phân luồng điều tiết xe từ xa giữa các tỉnh biên giới; chậm cập nhật quy chuẩn bao bì kiểm dịch mới của nước bạn.',
    natureOfInformationVacuum: 'Thiếu cơ chế phân luồng điều tiết xe từ xa giữa các tỉnh biên giới; chậm cập nhật quy chuẩn bao bì kiểm dịch mới của nước bạn.',
    actionScriptVi: 'Cục Hải quan phát hành bản tin điều tiết phương tiện hàng ngày; lập tổ công tác hội đàm tại cửa khẩu đề nghị Hải quan bạn kéo dài giờ làm việc đến 22h đêm.',
    calibratedScores: { S: 32, D: 13, V: 0.6, I: 0.65, riskScore: 56.5 },
    matchingKeywords: ['nông sản xuất khẩu ùn tắc tại cửa khẩu lạng sơn', 'phạt cắm điện lạnh container lên tới nửa tỷ mỗi ngày']
  },
  {
    id: 66,
    scenarioCode: 'TH-66',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Bất cập thẩm định giá tài sản tịch thu sung công quỹ cấp huyện',
    realArticleTitle: 'Tài sản tang vật tịch thu sung công quỹ chất đống mục nát vì vướng hội đồng thẩm định giá cấp huyện',
    pressSources: ['Báo Pháp luật Việt Nam'],
    decree376Basis: {
      clauseArticle: 'Khoản 12, Khoản 21 Điều 2; Khoản 14 Điều 3, Khoản 18 Điều 3',
      leadAgencyId: 'cuc-qlcs',
      leadAgencyName: 'Cục Quản lý công sản',
      decreeArticleClause: 'Khoản 14 Điều 3',
      cooperatingUnits: ['Cục Quản lý giá']
    },
    classificationReason: 'Cán bộ tài chính huyện không dám tham gia định giá tang vật vì sợ rủi ro; chi phí thuê thẩm định độc lập vượt quá giá trị tài sản tịch thu.',
    natureOfInformationVacuum: 'Cán bộ tài chính huyện sợ rủi ro không dám định giá tang vật; thuê thẩm định độc lập thì chi phí vượt quá giá trị tài sản.',
    actionScriptVi: 'Ban hành thông tư liên tịch hướng dẫn phương pháp định giá rút gọn cho tang vật giá trị dưới 100 triệu đồng.',
    calibratedScores: { S: 28, D: 11, V: 0.45, I: 0.5, riskScore: 48.0 },
    matchingKeywords: ['tài sản tang vật tịch thu sung công quỹ chất đống', 'vướng hội đồng thẩm định giá cấp huyện']
  },
  {
    id: 67,
    scenarioCode: 'TH-67',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Kiểm toán viên bị xử phạt vì bỏ qua sai sót tại đơn vị công chúng',
    realArticleTitle: 'Bộ Tài chính đình chỉ 4 kiểm toán viên vì chất lượng kiểm toán báo cáo tài chính yếu kém',
    pressSources: ['Thời báo Tài chính Việt Nam'],
    decree376Basis: {
      clauseArticle: 'Khoản 16 Điều 2; Khoản 17 Điều 3',
      leadAgencyId: 'cuc-qlktkt',
      leadAgencyName: 'Cục Quản lý, giám sát kế toán, kiểm toán',
      decreeArticleClause: 'Khoản 17 Điều 3',
    },
    classificationReason: 'Thị trường lo ngại chất lượng kiểm toán các công ty niêm yết; thiếu thông tin về danh sách các công ty kiểm toán đạt chuẩn cho công ty đại chúng.',
    natureOfInformationVacuum: 'Thị trường lo ngại chất lượng kiểm toán công ty niêm yết; thiếu thông tin công khai về danh sách đơn vị kiểm toán đạt chuẩn.',
    actionScriptVi: 'Cục QLKT công bố công khai danh sách các doanh nghiệp kiểm toán đủ điều kiện và kết quả thanh tra chất lượng định kỳ hàng năm.',
    calibratedScores: { S: 29, D: 11, V: 0.5, I: 0.55, riskScore: 50.5 },
    matchingKeywords: ['bộ tài chính đình chỉ 4 kiểm toán viên', 'chất lượng kiểm toán báo cáo tài chính yếu kém']
  },
  {
    id: 68,
    scenarioCode: 'TH-68',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Tranh chấp tiền thưởng vé số mua hộ qua ứng dụng online',
    realArticleTitle: 'Tranh chấp tiền thưởng xổ số Vietlott qua ứng dụng mua hộ: Khách hàng trúng giải độc đắc khởi kiện vì đại lý giữ vé gốc',
    pressSources: ['Thời báo Doanh nhân & Pháp luật'],
    decree376Basis: {
      clauseArticle: 'Điểm b, Điểm c Khoản 19 Điều 2; Khoản 8 Điều 3',
      leadAgencyId: 'vu-dchtc',
      leadAgencyName: 'Vụ Các định chế tài chính',
      decreeArticleClause: 'Khoản 8 Điều 3',
    },
    classificationReason: 'Cơ quan quản lý chậm công bố thông điệp cảnh báo về tính bất hợp pháp của dịch vụ bán vé số qua ứng dụng Internet trung gian.',
    natureOfInformationVacuum: 'Chậm công bố thông điệp cảnh báo tính bất hợp pháp và rủi ro tranh chấp của dịch vụ mua hộ vé số online trung gian.',
    actionScriptVi: 'Bộ Tài chính ban hành công văn chấn chỉnh các công ty xổ số; đăng bài cảnh báo rủi ro pháp lý của dịch vụ mua hộ vé số không được cấp phép.',
    calibratedScores: { S: 29, D: 12, V: 0.55, I: 0.55, riskScore: 52.0 },
    matchingKeywords: ['tranh chấp tiền thưởng xổ số vietlott qua ứng dụng mua hộ', 'đại lý giữ vé gốc']
  },
  {
    id: 69,
    scenarioCode: 'TH-69',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Doanh nghiệp FDI bị truy thu ưu đãi thuế TNDN hàng triệu USD',
    realArticleTitle: 'Vướng mắc thủ tục xác nhận dự án công nghệ cao: Doanh nghiệp FDI bị truy thu ưu đãi thuế TNDN hàng triệu USD',
    pressSources: ['Báo Đầu tư'],
    decree376Basis: {
      clauseArticle: 'Khoản 8, Khoản 9 Điều 2; Khoản 21 Điều 3, Khoản 24 Điều 3',
      leadAgencyId: 'cuc-dtnn',
      leadAgencyName: 'Cục Đầu tư nước ngoài',
      decreeArticleClause: 'Khoản 21 Điều 3',
      cooperatingUnits: ['Cục Thuế']
    },
    classificationReason: 'Tiêu chí xác định DN công nghệ cao giữa cơ quan khoa học công nghệ và cơ quan thuế chưa đồng bộ, dẫn đến việc DN bị hồi tố truy thu thuế sau nhiều năm.',
    natureOfInformationVacuum: 'Tiêu chí xác định DN công nghệ cao chưa đồng bộ giữa các bộ ngành, khiến DN FDI bị hồi tố truy thu thuế hàng triệu USD sau nhiều năm.',
    actionScriptVi: 'Lãnh đạo Bộ Tài chính chủ trì cuộc họp liên ngành gỡ vướng thủ tục xác nhận ưu đãi cho các dự án FDI trọng điểm.',
    calibratedScores: { S: 33, D: 14, V: 0.6, I: 0.65, riskScore: 58.0 },
    matchingKeywords: ['vướng mắc thủ tục xác nhận dự án công nghệ cao', 'doanh nghiệp fdi bị truy thu ưu đãi thuế tndn hàng triệu usd']
  },
  {
    id: 70,
    scenarioCode: 'TH-70',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Cắt margin cổ phiếu diện rộng gây rung lắc tâm lý thị trường',
    realArticleTitle: 'Hàng loạt cổ phiếu bị cắt margin quý III: Nhà đầu tư cá nhân lo ngại làn sóng bán giải chấp',
    pressSources: ['Báo Đầu tư Chứng khoán'],
    decree376Basis: {
      clauseArticle: 'Khoản 17 Điều 2; Khoản 29 Điều 3',
      leadAgencyId: 'ubcknn',
      leadAgencyName: 'Ủy ban Chứng khoán Nhà nước',
      decreeArticleClause: 'Khoản 29 Điều 3',
    },
    classificationReason: 'Thiếu báo cáo tổng hợp lý giải nguyên nhân cắt margin là do yếu tố định kỳ (báo cáo kiểm toán bán niên có ý kiến ngoại trừ) chứ không phải do sự cố vĩ mô.',
    natureOfInformationVacuum: 'Thiếu thông tin giải thích nguyên nhân cắt margin là do yếu tố kiểm toán định kỳ, tránh tin đồn hoang mang thị trường.',
    actionScriptVi: 'UBCKNN chỉ đạo các Sở GDCK đăng thông cáo báo chí giải thích quy chuẩn định kỳ về danh mục margin để ổn định tâm lý nhà đầu tư.',
    calibratedScores: { S: 29, D: 12, V: 0.6, I: 0.65, riskScore: 53.5 },
    matchingKeywords: ['hàng loạt cổ phiếu bị cắt margin', 'nhà đầu tư cá nhân lo ngại làn sóng bán giải chấp']
  },
  {
    id: 71,
    scenarioCode: 'TH-71',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Nhà thầu ngoại dọa phạt hợp đồng metro vì chậm thanh toán vốn ODA',
    realArticleTitle: 'Dự án metro chậm tiến độ: Nhà thầu ngoại dọa phạt hợp đồng vì bị nợ đọng vốn ODA',
    pressSources: ['Báo Giao thông'],
    decree376Basis: {
      clauseArticle: 'Khoản 15 Điều 2; Khoản 13 Điều 3',
      leadAgencyId: 'cuc-qln',
      leadAgencyName: 'Cục Quản lý nợ và Tài chính đối ngoại',
      decreeArticleClause: 'Khoản 13 Điều 3',
    },
    classificationReason: 'Quy trình phê duyệt điều chỉnh hiệp định vay vốn ưu đãi nước ngoài kéo dài qua nhiều cấp thẩm định.',
    natureOfInformationVacuum: 'Quy trình phê duyệt điều chỉnh hiệp định vay vốn ODA kéo dài khiến nhà thầu bị nợ đọng, đe dọa phạt hợp đồng quốc tế.',
    actionScriptVi: 'Cục Quản lý nợ làm việc khẩn cấp với nhà tài trợ quốc tế (JICA/ADB) để kích hoạt cơ chế giải ngân tạm ứng song song với quá trình điều chỉnh hiệp định.',
    calibratedScores: { S: 34, D: 14, V: 0.6, I: 0.65, riskScore: 59.5 },
    matchingKeywords: ['dự án metro chậm tiến độ: nhà thầu ngoại dọa phạt hợp đồng', 'nợ đọng vốn oda']
  },
  {
    id: 72,
    scenarioCode: 'TH-72',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Ách tắc tiền đấu giá đất nộp vào ngân sách, hụt thu ngân sách địa phương',
    realArticleTitle: 'Nhiều địa phương hụt thu ngân sách do đấu giá đất đóng băng, nhà đầu tư bỏ cọc',
    pressSources: ['Thời báo Tài chính Việt Nam'],
    decree376Basis: {
      clauseArticle: 'Khoản 6, Khoản 9 Điều 2; Khoản 1 Điều 3, Khoản 24 Điều 3',
      leadAgencyId: 'vu-nsnn',
      leadAgencyName: 'Vụ Ngân sách nhà nước',
      decreeArticleClause: 'Khoản 1 Điều 3',
      cooperatingUnits: ['Cục Thuế']
    },
    classificationReason: 'Thiếu đánh giá tác động của nguồn thu đất đai đối với cân đối ngân sách địa phương và kịch bản bù đắp hụt thu.',
    natureOfInformationVacuum: 'Thiếu đánh giá tác động của nguồn thu đất đai đối với cân đối ngân sách địa phương và kịch bản bù đắp hụt thu.',
    actionScriptVi: 'Vụ Ngân sách nhà nước ban hành hướng dẫn các tỉnh chủ động rà soát, cơ cấu lại nhiệm vụ chi thường xuyên và huy động các nguồn thu thay thế.',
    calibratedScores: { S: 31, D: 13, V: 0.55, I: 0.65, riskScore: 55.5 },
    matchingKeywords: ['nhiều địa phương hụt thu ngân sách', 'đấu giá đất đóng băng', 'nhà đầu tư bỏ cọc']
  },
  {
    id: 73,
    scenarioCode: 'TH-73',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Kho dự trữ quốc gia Tây Nguyên xuống cấp, nguy cơ hư hao hàng cứu trợ',
    realArticleTitle: 'Kho dự trữ quốc gia tại Tây Nguyên xuống cấp: Nguy cơ hư hao hàng cứu trợ khẩn cấp',
    pressSources: ['Báo Tiền Phong'],
    decree376Basis: {
      clauseArticle: 'Khoản 11 Điều 2; Khoản 26 Điều 3',
      leadAgencyId: 'cuc-dtnn-res',
      leadAgencyName: 'Cục Dự trữ Nhà nước',
      decreeArticleClause: 'Khoản 26 Điều 3',
    },
    classificationReason: 'Quy hoạch mạng lưới kho dự trữ quốc gia chưa được giải thích rõ lộ trình đầu tư nâng cấp bằng vốn ngân sách.',
    natureOfInformationVacuum: 'Quy hoạch mạng lưới kho dự trữ chưa giải thích rõ lộ trình đầu tư nâng cấp bằng vốn ngân sách.',
    actionScriptVi: 'Cục Dự trữ Nhà nước công bố tiến độ xây dựng kho dự trữ tích hợp công nghệ cao vùng Tây Nguyên giai đoạn 2026–2030.',
    calibratedScores: { S: 29, D: 11, V: 0.45, I: 0.55, riskScore: 50.0 },
    matchingKeywords: ['kho dự trữ quốc gia tại tây nguyên xuống cấp', 'nguy cơ hư hao hàng cứu trợ khẩn cấp']
  },
  {
    id: 74,
    scenarioCode: 'TH-74',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Tranh luận số liệu tỷ lệ thất nghiệp thanh niên giữa các cơ quan nghiên cứu',
    realArticleTitle: 'Thước đo tỷ lệ thất nghiệp thanh niên: Vì sao số liệu thống kê vênh với thực tế xin việc?',
    pressSources: ['Báo Lao Động'],
    decree376Basis: {
      clauseArticle: 'Khoản 23 Điều 2; Khoản 27 Điều 3',
      leadAgencyId: 'cuc-tk',
      leadAgencyName: 'Cục Thống kê',
      decreeArticleClause: 'Khoản 27 Điều 3',
    },
    classificationReason: 'Phương pháp luận thu thập số liệu mẫu về lao động phi chính thức và gig economy chưa được phổ biến rộng rãi.',
    natureOfInformationVacuum: 'Phương pháp luận thu thập số liệu mẫu về lao động phi chính thức và việc làm gig economy chưa được phổ biến rõ.',
    actionScriptVi: 'Cục Thống kê tổ chức hội thảo phương pháp luận thống kê lao động việc làm theo chuẩn quốc tế ILO để báo giới nắm bắt.',
    calibratedScores: { S: 28, D: 12, V: 0.5, I: 0.6, riskScore: 50.5 },
    matchingKeywords: ['thước đo tỷ lệ thất nghiệp thanh niên', 'vì sao số liệu thống kê vênh với thực tế']
  },
  {
    id: 75,
    scenarioCode: 'TH-75',
    tier: 2,
    tierLabelVi: 'Mức 2: Cảnh báo sớm',
    sopLevel: 2,
    sopLevelNameVi: 'Cấp 2: Cảnh báo sớm',
    title: 'Bất cập thu phí bảo hiểm xe máy bắt buộc: Kiến nghị bãi bỏ',
    realArticleTitle: 'Bảo hiểm xe máy bắt buộc: Mua để đối phó công an chứ bồi thường quá nhiêu khê! / Kiến nghị bỏ bảo hiểm bắt buộc xe máy',
    pressSources: ['Báo Thanh Niên', 'Báo Tuổi Trẻ'],
    decree376Basis: {
      clauseArticle: 'Khoản 18 Điều 2; Khoản 16 Điều 3',
      leadAgencyId: 'cuc-qlbh',
      leadAgencyName: 'Cục Quản lý, giám sát bảo hiểm',
      decreeArticleClause: 'Khoản 16 Điều 3',
    },
    classificationReason: 'Thủ tục bồi thường quá phức tạp khiến người dân định kiến chính sách mang tính "thu phí"; thiếu số liệu chứng minh hiệu quả chi trả nhân đạo.',
    natureOfInformationVacuum: 'Thủ tục bồi thường phức tạp tạo định kiến chính sách mang tính thu phí; thiếu số liệu chứng minh hiệu quả bồi thường nhân đạo.',
    actionScriptVi: 'Cục QLBH họp báo công bố số liệu chi trả bồi thường hàng trăm tỷ đồng; ban hành thông tư cắt giảm 70% thủ tục giấy tờ bồi thường xe máy qua chụp ảnh hiện trường.',
    calibratedScores: { S: 34, D: 14, V: 0.65, I: 0.85, riskScore: 63.5 },
    matchingKeywords: ['bảo hiểm xe máy bắt buộc: mua để đối phó công an', 'bồi thường quá nhiêu khê', 'kiến nghị bỏ bảo hiểm bắt buộc xe máy']
  },

  // ==========================================================================
  // PHẦN IV: NHÓM MỨC 3 - CẢNH BÁO GẤP / KHẨN CẤP (25 TÌNH HUỐNG: 76 – 100)
  // ==========================================================================
  {
    id: 76,
    scenarioCode: 'TH-76',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp / Khẩn cấp (SOP Cấp 4: Điều tra giờ vàng / Khủng hoảng niềm tin)',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Cảnh báo Khẩn cấp (Emergency Alert)',
    title: 'Khủng hoảng gửi tiết kiệm SCB bị biến thành bảo hiểm Manulife',
    realArticleTitle: 'Khách hàng tố Manulife và SCB: Chuyển đơn lên Bộ Công an - Hàng trăm người nộp đơn tố cáo bị lừa đảo / Cám cảnh người đi kiện vụ SCB',
    pressSources: ['Báo Tuổi Trẻ', 'Báo Dân Trí'],
    decree376Basis: {
      clauseArticle: 'Điểm c, Điểm d Khoản 18 Điều 2; Khoản 16 Điều 3, Khoản 12 Điều 3',
      leadAgencyId: 'cuc-qlbh',
      leadAgencyName: 'Cục Quản lý, giám sát bảo hiểm',
      decreeArticleClause: 'Khoản 16 Điều 3',
      cooperatingUnits: ['Văn phòng Bộ', 'Cơ quan Thanh tra Bộ Công an']
    },
    classificationReason: 'Cơ quan quản lý bị chỉ trích buông lỏng giám sát kênh phân phối Bancassurance; người dân hoang mang không biết cơ chế đối thoại khiếu nại để nhận lại tiền gốc.',
    natureOfInformationVacuum: 'Cơ quan quản lý bị chỉ trích buông lỏng giám sát kênh Bancassurance; người dân hoang mang không biết cơ chế khiếu nại để nhận lại tiền gốc.',
    actionScriptVi: 'Kích hoạt kịch bản khẩn cấp: Phát Holding Statement trong 2 giờ; họp báo trong 24-48 giờ; lập đoàn thanh tra đột xuất Manulife và SCB; buộc đối thoại 1-1 với khách hàng.',
    emergencyPlaybook: {
      goldenHourTiming: '02 giờ (Holding Statement) - 24 đến 48 giờ (Kết luận thanh tra & Họp báo)',
      keyMessage: 'Bộ Tài chính kiên quyết bảo vệ quyền lợi hợp pháp của người tham gia bảo hiểm; buộc doanh nghiệp hủy hợp đồng và hoàn tiền 100% nếu phát hiện nhân viên tư vấn sai quy trình.',
      operationalDirectives: [
        'Thành lập Đoàn thanh tra đột xuất Manulife và ngân hàng SCB.',
        'Buộc Tổng Giám đốc hãng bảo hiểm tổ chức đối thoại 1-1 với khách hàng có đơn khiếu nại.',
        'Chuyển dấu hiệu lừa đảo giả mạo chữ ký sang Cơ quan Cảnh sát điều tra Bộ Công an.'
      ]
    },
    calibratedScores: { S: 46, D: 18, V: 0.9, I: 0.95, riskScore: 89.0 },
    matchingKeywords: ['khách hàng tố manulife và scb', 'chuyển đơn lên bộ công an', 'gửi tiết kiệm scb thành bảo hiểm manulife', 'bancassurance scb manulife']
  },
  {
    id: 77,
    scenarioCode: 'TH-77',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Hủy 9 đợt phát hành trái phiếu Tân Hoàng Minh 10.030 tỷ đồng',
    realArticleTitle: 'Ủy ban Chứng khoán Nhà nước hủy bỏ 9 đợt chào bán trái phiếu trị giá 10.030 tỷ đồng Tân Hoàng Minh / Khủng hoảng niềm tin trái phiếu: Vạn nhà đầu tư vây đòi tiền',
    pressSources: ['Báo Lao Động', 'Báo VnExpress', 'Báo Đầu tư'],
    decree376Basis: {
      clauseArticle: 'Điểm c Khoản 17 Điều 2; Khoản 29 Điều 3, Khoản 8 Điều 3',
      leadAgencyId: 'ubcknn',
      leadAgencyName: 'Ủy ban Chứng khoán Nhà nước',
      decreeArticleClause: 'Khoản 29 Điều 3',
      cooperatingUnits: ['Vụ Các định chế tài chính']
    },
    classificationReason: 'Nhà đầu tư cá nhân không hiểu hậu quả pháp lý của quyết định "hủy đợt chào bán"; không rõ tiền đã nộp vào tài khoản sẽ được thu hồi theo quy trình nào.',
    natureOfInformationVacuum: 'Nhà đầu tư cá nhân không hiểu hậu quả pháp lý của việc hủy đợt chào bán; hoang mang về quy trình thu hồi tiền gốc.',
    actionScriptVi: 'Họp báo trong vòng 2 giờ; thông điệp ưu tiên bảo vệ quyền lợi tài sản người dân; tham mưu ban hành Nghị định gỡ nút thắt tái cấu trúc nợ.',
    emergencyPlaybook: {
      goldenHourTiming: '02 giờ đầu tiên (Họp báo & Thông cáo khẩn cấp)',
      keyMessage: 'Quyết định hủy bỏ nhằm bảo vệ tối đa quyền lợi tài sản của người dân trước hành vi gian lận thông tin; toàn bộ dòng tiền bị phong tỏa được cơ quan tố tụng ưu tiên hoàn trả cho trái chủ.',
      operationalDirectives: [
        'Tham mưu trình Chính phủ ban hành Nghị định 08/2023/NĐ-CP gỡ nút thắt tái cấu trúc nợ trái phiếu bằng tài sản hợp pháp khác.',
        'Lập chuyên trang thông tin giải đáp quyền lợi trái chủ tại UBCKNN.',
        'Phối hợp Cục Cảnh sát kinh tế C03 công bố đầu mối tiếp nhận giấy tờ xác nhận quyền sở hữu trái phiếu.'
      ]
    },
    calibratedScores: { S: 48, D: 19, V: 0.95, I: 0.95, riskScore: 94.0 },
    matchingKeywords: ['hủy bỏ 9 đợt chào bán trái phiếu', 'tân hoàng minh', '10.030 tỷ đồng', 'vạn nhà đầu tư vây đòi tiền gốc']
  },
  {
    id: 78,
    scenarioCode: 'TH-78',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Cổng nộp thuế điện tử eTax nghẽn mạng tê liệt sát giờ chót 31-3',
    realArticleTitle: 'Cổng thuế điện tử nghẽn mạng tê liệt sát giờ chót quyết toán thuế: Hàng vạn kế toán thức trắng đêm / Doanh nghiệp kêu trời vì không nộp được báo cáo',
    pressSources: ['Báo Lao Động', 'Báo Tuổi Trẻ', 'Báo VnExpress'],
    decree376Basis: {
      clauseArticle: 'Khoản 26 Điều 2; Khoản 23 Điều 3, Khoản 24 Điều 3',
      leadAgencyId: 'cuc-cntt',
      leadAgencyName: 'Cục Công nghệ thông tin và chuyển đổi số',
      decreeArticleClause: 'Khoản 23 Điều 3',
      cooperatingUnits: ['Cục Thuế']
    },
    classificationReason: 'Doanh nghiệp hoảng loạn vì sợ bị phạt chậm nộp hàng trăm triệu sau 24h00 mà không có văn bản pháp lý bảo đảm; đường dây nóng ngành thuế bị tê liệt.',
    natureOfInformationVacuum: 'DN hoảng loạn sợ bị phạt chậm nộp sau 24h00 do lỗi nghẽn cổng nộp thuế điện tử mà không có cam kết pháp lý.',
    actionScriptVi: 'Xử lý trong 1 giờ ngay trong đêm 31/3: Bộ Tài chính chính thức gia hạn thời hạn nộp 3 ngày làm việc; cam kết 100% không xử phạt vi phạm hành chính do sự cố mạng.',
    emergencyPlaybook: {
      goldenHourTiming: '01 giờ (Xử lý ngay trong đêm 31/3 lúc 23h30)',
      keyMessage: 'Bộ Tài chính chính thức gia hạn thời hạn nộp hồ sơ quyết toán thuế thêm 03 ngày làm việc trên phạm vi toàn quốc; cam kết 100% không xử phạt vi phạm hành chính đối với bất kỳ người nộp thuế nào do sự cố quá tải mạng.',
      operationalDirectives: [
        'Đăng thông báo khẩn chữ đỏ trên trang chủ Cục Thuế lúc 23:30 đêm.',
        'Cục CNTT tăng gấp 3 lần băng thông máy chủ và kích hoạt cổng phụ (Backup Gateway).',
        'Gửi tin nhắn SMS khẩn thông báo gia hạn tới số điện thoại của 100% kế toán trưởng doanh nghiệp.'
      ]
    },
    calibratedScores: { S: 42, D: 16, V: 0.85, I: 0.9, riskScore: 82.5 },
    matchingKeywords: ['cổng thuế điện tử nghẽn mạng tê liệt sát giờ chót', 'hàng vạn kế toán thức trắng đêm', 'không nộp được báo cáo tài chính']
  },
  {
    id: 79,
    scenarioCode: 'TH-79',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Làn sóng công nhân đình công, rút BHXH một lần do tin đồn cấm rút',
    realArticleTitle: 'Làn sóng rút bảo hiểm xã hội một lần: Nỗi lo an sinh / Công nhân xếp hàng từ 3h sáng rút BHXH một lần / Hàng vạn công nhân xin nghỉ việc rút BHXH',
    pressSources: ['Báo Lao Động', 'Báo Thanh Niên', 'Báo Tuổi Trẻ'],
    decree376Basis: {
      clauseArticle: 'Khoản 22 Điều 2; Khoản 34 Điều 3, Khoản 11 Điều 3',
      leadAgencyId: 'bhxh-vn',
      leadAgencyName: 'Bảo hiểm xã hội Việt Nam',
      decreeArticleClause: 'Khoản 34 Điều 3',
      cooperatingUnits: ['Vụ Pháp chế']
    },
    classificationReason: 'Người lao động hoang mang do mạng xã hội tung tin sai sự thật rằng luật mới sẽ "khóa quyền rút"; tâm lý tháo chạy khỏi hệ thống an sinh xã hội bùng nổ tại các KCN.',
    natureOfInformationVacuum: 'Người lao động hoang mang do MXH tung tin sai luật mới sẽ cấm rút BHXH một lần, gây làn sóng tháo chạy khỏi an sinh.',
    actionScriptVi: 'Phản ứng hỏa tốc trong 4 giờ: Khẳng định luật mới bảo lưu 100% quyền tự quyết; Tổng Giám đốc họp báo trực tuyến; cử đoàn công tác xuống các KCN Đồng Nai, Bình Dương.',
    emergencyPlaybook: {
      goldenHourTiming: '04 giờ (Phản ứng hỏa tốc trước ca làm việc buổi sáng)',
      keyMessage: 'Chính sách BHXH mới bảo lưu 100% quyền tự quyết của người lao động đã tham gia hệ thống; Nhà nước cam kết Quỹ BHXH an toàn tuyệt đối và thiết kế các gói hưu trí linh hoạt nhất.',
      operationalDirectives: [
        'Tổng Giám đốc BHXH Việt Nam chủ trì họp báo trực tuyến toàn quốc.',
        'Cử các đoàn công tác trực tiếp xuống các khu công nghiệp trọng điểm (Đồng Nai, Bình Dương) phát tờ rơi giải thích chính sách.',
        'Phối hợp Tổng Liên đoàn Lao động Việt Nam tổ chức đối thoại trực tiếp tại các nhà máy có trên 5.000 công nhân.'
      ]
    },
    calibratedScores: { S: 44, D: 17, V: 0.9, I: 0.95, riskScore: 86.5 },
    matchingKeywords: ['làn sóng rút bảo hiểm xã hội một lần', 'công nhân xếp hàng từ 3h sáng rút bhxh', 'xin nghỉ việc rút bhxh một lần']
  },
  {
    id: 80,
    scenarioCode: 'TH-80',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Vấn nạn mạo danh căn cước công dân lập doanh nghiệp "ma" xuất hóa đơn khống',
    realArticleTitle: 'Thứ trưởng Bộ Tài chính nói rõ trách nhiệm xử lý mạo danh lập doanh nghiệp / Bỗng dưng thành giám đốc nợ thuế hàng tỷ: Nạn nhân bị đánh cắp CCCD kêu cứu',
    pressSources: ['Báo VietNamNet', 'Báo Tuổi Trẻ'],
    decree376Basis: {
      clauseArticle: 'Khoản 14, Khoản 9 Điều 2; Khoản 20 Điều 3, Khoản 24 Điều 3',
      leadAgencyId: 'cuc-ptdn-tnkt',
      leadAgencyName: 'Cục Phát triển doanh nghiệp tư nhân và kinh tế tập thể',
      decreeArticleClause: 'Khoản 20 Điều 3',
      cooperatingUnits: ['Cục Thuế', 'Cơ quan Cảnh sát điều tra Bộ Công an']
    },
    classificationReason: 'Nạn nhân gửi đơn giải trình nhưng cơ quan ĐKKD và Thuế đùn đẩy trách nhiệm kéo dài trên 6 tháng; người dân bị cấm xuất cảnh và phong tỏa tài khoản oan.',
    natureOfInformationVacuum: 'Cơ quan ĐKKD và Thuế đùn đẩy trách nhiệm kéo dài khiến nạn nhân bị cấm xuất cảnh và phong tỏa tài khoản oan uổng.',
    actionScriptVi: 'Phản ứng trong 12 giờ: Công văn hỏa tốc chỉ đạo gỡ bỏ ngay lệnh cấm xuất cảnh trong 24 giờ sau khi có xác nhận của công an; nâng cấp quét NFC CCCD bắt buộc trên Cổng ĐKKD.',
    emergencyPlaybook: {
      goldenHourTiming: '12 giờ (Phản ứng công văn khẩn)',
      keyMessage: 'Bộ Tài chính kiên quyết xử lý dứt điểm tình trạng lợi dụng danh tính lập DN khống; thiết lập quy trình một cửa ưu tiên gỡ bỏ ngay lệnh cấm xuất cảnh trong 24 giờ sau khi có xác nhận của công an.',
      operationalDirectives: [
        'Ban hành Công văn hỏa tốc chỉ đạo Cục ĐKKD và Cục Thuế phối hợp tạm dừng pháp lý của DN mạo danh.',
        'Nâng cấp tính năng quét sinh trắc học NFC CCCD gắn chip bắt buộc trên Cổng ĐKKD quốc gia.',
        'Cục Thuế công khai số hotline chuyên trách tiếp nhận khiếu nại mạo danh CCCD.'
      ]
    },
    calibratedScores: { S: 43, D: 16, V: 0.8, I: 0.85, riskScore: 81.0 },
    matchingKeywords: ['mạo danh lập doanh nghiệp', 'bỗng dưng thành giám đốc công ty nợ thuế hàng tỷ', 'bị đánh cắp cccd kêu cứu khắp nơi']
  },
  {
    id: 81,
    scenarioCode: 'TH-81',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Sự cố VNACCS/VCIS gây tê liệt cảng biển Cát Lái và Hải Phòng >24h',
    realArticleTitle: 'Sự cố đường truyền hệ thống VNACCS/VCIS kéo dài hơn 24 giờ: Toàn bộ cảng Cát Lái và Hải Phòng tê liệt, hàng vạn container ách tắc',
    pressSources: ['Báo VnExpress', 'VTV1 Thời sự 19h'],
    decree376Basis: {
      clauseArticle: 'Khoản 20, Khoản 26 Điều 2; Khoản 25 Điều 3, Khoản 23 Điều 3',
      leadAgencyId: 'cuc-hq',
      leadAgencyName: 'Cục Hải quan',
      decreeArticleClause: 'Khoản 25 Điều 3',
      cooperatingUnits: ['Cục Công nghệ thông tin và chuyển đổi số']
    },
    classificationReason: 'Xe container xếp hàng dài 15km; hãng tàu dọa bỏ cảng; thiếu thông tin về tiến độ khắc phục và quy trình thông quan giấy khẩn cấp chậm được kích hoạt.',
    natureOfInformationVacuum: 'Xe container xếp hàng 15km, hãng tàu dọa bỏ cảng; thiếu thông tin tiến độ khắc phục và chậm kích hoạt quy trình thông quan giấy.',
    actionScriptVi: 'Kích hoạt trong 1 giờ: Chuyển toàn bộ hệ thống sang cơ chế thông quan thủ công bằng chứng từ giấy 24/7; Lãnh đạo Cục Hải quan trực tiếp có mặt tại hiện trường.',
    emergencyPlaybook: {
      goldenHourTiming: '01 giờ (Kích hoạt phương án sự cố công nghệ cấp quốc gia)',
      keyMessage: 'Cục Hải quan chuyển toàn bộ hệ thống sang cơ chế thông quan thủ công bằng chứng từ giấy 24/7; cam kết không để đứt gãy chuỗi cung ứng xuất nhập khẩu quốc gia.',
      operationalDirectives: [
        'Lãnh đạo Cục Hải quan trực tiếp có mặt tại hiện trường cảng Cát Lái chỉ đạo thông quan.',
        'Cục CNTT cô lập máy chủ bị lỗi đường truyền vệ tinh và chuyển hướng dữ liệu sang cáp quang dự phòng.',
        'Huy động 100% cán bộ hải quan tăng ca xuyên đêm duyệt hồ sơ giấy không thu phụ phí.'
      ]
    },
    calibratedScores: { S: 45, D: 17, V: 0.9, I: 0.9, riskScore: 86.5 },
    matchingKeywords: ['sự cố đường truyền hệ thống vnaccs/vcis kéo dài hơn 24 giờ', 'toàn bộ cảng cát lái và hải phòng tê liệt', 'hàng vạn container ách tắc']
  },
  {
    id: 82,
    scenarioCode: 'TH-82',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Ùn tắc nghiêm trọng hơn 6.000 xe nông sản tại các cửa khẩu phía Bắc',
    realArticleTitle: 'Khủng hoảng cửa khẩu phía Bắc: Hơn 6.000 xe nông sản ùn ứ thối rữa, tài xế khóc ròng, hiệp hội gửi đơn kêu cứu khẩn cấp lên Thủ tướng',
    pressSources: ['Báo Tiền Phong', 'Báo Thanh Niên'],
    decree376Basis: {
      clauseArticle: 'Khoản 20 Điều 2; Khoản 25 Điều 3',
      leadAgencyId: 'cuc-hq',
      leadAgencyName: 'Cục Hải quan',
      decreeArticleClause: 'Khoản 25 Điều 3',
      cooperatingUnits: ['UBND tỉnh Lạng Sơn', 'Bộ Công Thương']
    },
    classificationReason: 'Thiếu cơ chế đàm phán cấp bộ với phía Hải quan bạn; thiếu thông tin phân luồng phương tiện từ các tỉnh Tây Nguyên ra phía Bắc.',
    natureOfInformationVacuum: 'Thiếu cơ chế đàm phán cấp bộ kéo dài giờ thông quan; thiếu cảnh báo phân luồng phương tiện từ các tỉnh phía Nam ra phía Bắc.',
    actionScriptVi: 'Xử lý trong 2-4 giờ: Lãnh đạo Cục Hải quan lên cửa khẩu Hữu Nghị hội đàm kéo dài giờ làm việc đến 22h đêm; gửi thông báo hỏa tốc cho các Sở Công Thương điều tiết xe.',
    emergencyPlaybook: {
      goldenHourTiming: '02 đến 04 giờ (Kích hoạt ngoại giao biên mậu khẩn cấp)',
      keyMessage: 'Cục Hải quan kích hoạt phương án thông quan tối đa 24/7; hội đàm khẩn cấp mở "luồng xanh" riêng biệt cho nông sản tươi sống; cảnh báo giãn tiến độ vận chuyển từ gốc.',
      operationalDirectives: [
        'Lãnh đạo Cục Hải quan trực tiếp lên cửa khẩu Hữu Nghị chủ trì hội đàm với Hải quan bạn kéo dài giờ mở cửa khẩu đến 22h đêm.',
        'Gửi thông báo hỏa tốc cho các Sở Công Thương phía Nam điều tiết lượng xe lên biên giới.',
        'Bố trí bãi đỗ phụ trợ miễn phí bảo quản lạnh tạm thời cho tài xế.'
      ]
    },
    calibratedScores: { S: 44, D: 16, V: 0.85, I: 0.85, riskScore: 82.5 },
    matchingKeywords: ['hơn 6.000 xe nông sản ùn ứ thối rữa', 'khủng hoảng cửa khẩu phía bắc', 'tài xế khóc ròng, hiệp hội gửi đơn kêu cứu']
  },
  {
    id: 83,
    scenarioCode: 'TH-83',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Văn bản giả mạo khởi tố lãnh đạo UBCKNN gây bán tháo sập TTCK',
    realArticleTitle: 'Văn bản giả mạo khởi tố lãnh đạo UBCKNN lan truyền: Thị trường chứng khoán \'tắm máu\', VN-Index bốc hơi 55 điểm, 130.000 tỷ vốn hóa biến mất',
    pressSources: ['Báo VietNamNet', 'Báo Đầu tư'],
    decree376Basis: {
      clauseArticle: 'Điểm đ Khoản 17 Điều 2; Khoản 29 Điều 3',
      leadAgencyId: 'ubcknn',
      leadAgencyName: 'Ủy ban Chứng khoán Nhà nước',
      decreeArticleClause: 'Khoản 29 Điều 3',
      cooperatingUnits: ['Cục An ninh mạng và phòng chống tội phạm công nghệ cao (A05)']
    },
    classificationReason: 'Sự im lặng trong phiên giao dịch của cơ quan quản lý khiến nhà đầu tư tin vào văn bản giả mạo con dấu Bộ Công an.',
    natureOfInformationVacuum: 'Sự im lặng trong phiên giao dịch khiến nhà đầu tư tin vào văn bản giả mạo, dẫn đến bán tháo hoảng loạn.',
    actionScriptVi: 'Bác bỏ tin đồn ngay trong phiên giao dịch (dưới 30 phút); UBCKNN khẳng định văn bản hoàn toàn bịa đặt; phối hợp A05 khởi tố hình sự đối tượng tán phát.',
    emergencyPlaybook: {
      goldenHourTiming: 'Dưới 30 phút (Ngay trong phiên giao dịch khớp lệnh)',
      keyMessage: 'UBCKNN khẳng định văn bản lan truyền trên mạng xã hội là hoàn toàn giả mạo, bịa đặt; mọi hoạt động điều hành thị trường vẫn diễn ra bình thường; cảnh báo nhà đầu tư bình tĩnh, không bán tháo theo tin đồn thất thiệt.',
      operationalDirectives: [
        'Phát văn bản hỏa tốc đính chính trên Cổng UBCKNN và gửi thông báo khẩn qua hệ thống tin nhắn của toàn bộ 74 công ty chứng khoán thành viên.',
        'Phối hợp Cục An ninh mạng (A05) truy tìm và khởi tố hình sự đối tượng tán phát tin giả.',
        'Tổ chức họp báo sau giờ đóng cửa phiên giao dịch tái khẳng định các chỉ số thanh khoản thị trường an toàn.'
      ]
    },
    calibratedScores: { S: 50, D: 20, V: 1.0, I: 1.0, riskScore: 100.0 },
    matchingKeywords: ['văn bản giả mạo khởi tố lãnh đạo ubcknn', 'thị trường chứng khoán \'tắm máu\'', 'vn-index bốc hơi 55 điểm', '130.000 tỷ vốn hóa biến mất']
  },
  {
    id: 84,
    scenarioCode: 'TH-84',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Khủng hoảng vỡ nợ trái phiếu BĐS 25.000 tỷ: Biểu ngữ vây trụ sở',
    realArticleTitle: 'Khủng hoảng trái phiếu: Hàng nghìn người mang biểu ngữ vây kín trụ sở tập đoàn X đòi lại tiền tiết kiệm',
    pressSources: ['Báo Tuổi Trẻ', 'Báo Pháp luật TP.HCM'],
    decree376Basis: {
      clauseArticle: 'Khoản 17, Khoản 19 Điều 2; Khoản 8 Điều 3, Khoản 29 Điều 3',
      leadAgencyId: 'vu-dchtc',
      leadAgencyName: 'Vụ Các định chế tài chính',
      decreeArticleClause: 'Khoản 8 Điều 3',
      cooperatingUnits: ['Ủy ban Chứng khoán Nhà nước']
    },
    classificationReason: 'Báo chí chất vấn trách nhiệm quản lý giám sát và sự thiếu hụt phương án phong tỏa tài sản bảo đảm của Bộ Tài chính đối với doanh nghiệp mất khả năng thanh toán.',
    natureOfInformationVacuum: 'Chất vấn trách nhiệm giám sát và phương án phong tỏa tài sản bảo đảm của Bộ đối với doanh nghiệp mất khả năng thanh toán.',
    actionScriptVi: 'Họp báo khẩn trong 12 giờ: Khẳng định trách nhiệm dân sự tối thượng của doanh nghiệp phát hành; lập đoàn thanh tra liên ngành kiểm tra mục đích sử dụng vốn trái phiếu.',
    emergencyPlaybook: {
      goldenHourTiming: '12 giờ (Họp báo khẩn cấp & Giám sát dòng tiền)',
      keyMessage: 'Khẳng định trách nhiệm dân sự tối thượng của doanh nghiệp phát hành; cơ quan quản lý áp dụng các biện pháp giám sát chặt chẽ dòng tiền dự án để ưu tiên bảo vệ quyền lợi hợp pháp của người dân.',
      operationalDirectives: [
        'Lập đoàn thanh tra liên ngành kiểm tra mục đích sử dụng vốn trái phiếu của tập đoàn phát hành.',
        'Yêu cầu tổ chức phát hành đối thoại công khai lộ trình giãn hoãn nợ minh bạch theo đúng quy định pháp luật.',
        'Báo cáo lãnh đạo Chính phủ phương án phong tỏa tài sản dự án dở dang để bảo toàn tài sản cho trái chủ.'
      ]
    },
    calibratedScores: { S: 46, D: 18, V: 0.9, I: 0.9, riskScore: 88.0 },
    matchingKeywords: ['hàng nghìn người mang biểu ngữ vây kín trụ sở', 'khủng hoảng trái phiếu', 'đòi lại tiền tiết kiệm', 'vỡ nợ trái phiếu 25.000 tỷ']
  },
  {
    id: 85,
    scenarioCode: 'TH-85',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'App "IFC" mạo danh Bộ Tài chính lừa đảo hàng nghìn tỷ lãi 30%/tháng',
    realArticleTitle: 'Bẫy lừa nghìn tỷ: Ứng dụng \'Đầu tư tài chính quốc tế IFC\' mạo danh Bộ Tài chính cam kết sinh lời 30%/tháng bị sập, hàng vạn nạn nhân kêu cứu',
    pressSources: ['Báo Công an Nhân dân', 'VTV1 Chuyển động 24h'],
    decree376Basis: {
      clauseArticle: 'Điểm g Khoản 19 Điều 2; Khoản 8 Điều 3, Khoản 12 Điều 3',
      leadAgencyId: 'vu-dchtc',
      leadAgencyName: 'Vụ Các định chế tài chính',
      decreeArticleClause: 'Khoản 8 Điều 3',
      cooperatingUnits: ['Văn phòng Bộ', 'Cục An ninh mạng A05']
    },
    classificationReason: 'Kẻ lừa đảo cắt ghép hình ảnh lễ ký kết của Lãnh đạo Bộ để tạo niềm tin giả; cơ quan quản lý chậm công bố danh tính các định chế tài chính hợp pháp.',
    natureOfInformationVacuum: 'Kẻ lừa đảo cắt ghép hình ảnh Lãnh đạo Bộ; chậm công bố danh tính các định chế tài chính quốc tế hợp pháp được cấp phép.',
    actionScriptVi: 'Phát sóng cảnh báo trên VTV1 19h trong ngày: Khẳng định Bộ Tài chính không cấp phép cho bất kỳ app đầu tư đa cấp nào; chuyển hồ sơ sang Cục An ninh mạng triệt phá.',
    emergencyPlaybook: {
      goldenHourTiming: 'Trong ngày (Phát sóng cảnh báo trên VTV1 19h và Cổng TTĐT Chính phủ)',
      keyMessage: 'Bộ Tài chính khẳng định không cấp phép cho bất kỳ ứng dụng đầu tư tài chính huy động vốn đa cấp nào; cảnh báo người dân tuyệt đối không nộp tiền vào các app cam kết lợi nhuận bất thường.',
      operationalDirectives: [
        'Cung cấp toàn bộ hồ sơ kỹ thuật và dữ liệu mạo danh cho Cục An ninh mạng Bộ Công an triệt phá.',
        'Công bố danh bạ các định chế tài chính hợp pháp trên Cổng TTĐT Bộ.',
        'Gửi văn bản đề nghị Bộ TT&TT ngăn chặn tên miền và link tải ứng dụng độc hại.'
      ]
    },
    calibratedScores: { S: 45, D: 17, V: 0.85, I: 0.9, riskScore: 85.0 },
    matchingKeywords: ['đầu tư tài chính quốc tế ifc', 'mạo danh bộ tài chính', 'cam kết sinh lời 30%/tháng bị sập', 'hàng vạn nạn nhân kêu cứu']
  },
  {
    id: 86,
    scenarioCode: 'TH-86',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Đại án hóa đơn khống 30.000 tỷ: Phong tỏa tài khoản hàng loạt DN ngay tình',
    realArticleTitle: 'Phá đường dây mua bán hóa đơn khống 30.000 tỷ đồng: Hàng loạt doanh nghiệp sản xuất ngay tình bị phong tỏa tài khoản ngân hàng',
    pressSources: ['Báo Lao Động', 'Báo VnExpress'],
    decree376Basis: {
      clauseArticle: 'Khoản 9 Điều 2; Khoản 24 Điều 3',
      leadAgencyId: 'cuc-thue',
      leadAgencyName: 'Cục Thuế',
      decreeArticleClause: 'Khoản 24 Điều 3',
    },
    classificationReason: 'Chi cục thuế địa phương phong tỏa tài khoản ngân hàng đột ngột đối với các DN mua hàng thật chỉ vì hóa đơn đầu vào F2, F3 dính vào công ty ma, làm tê liệt dòng tiền.',
    natureOfInformationVacuum: 'Chi cục thuế tùy tiện phong tỏa tài khoản DN mua hàng thật do dính F2, F3 công ty ma, làm tê liệt dòng tiền sản xuất.',
    actionScriptVi: 'Họp báo trong 24 giờ: Khẳng định nguyên tắc bảo vệ quyền lợi hợp pháp của doanh nghiệp ngay tình; ban hành Công điện nghiêm cấm tùy tiện phong tỏa tài khoản.',
    emergencyPlaybook: {
      goldenHourTiming: '24 giờ (Họp báo & Công điện khẩn chấn chỉnh)',
      keyMessage: 'Ngành Thuế kiên quyết đấu tranh chống gian lận hóa đơn nhưng bảo đảm nguyên tắc bảo vệ quyền lợi hợp pháp của doanh nghiệp ngay tình có chứng từ thanh toán ngân hàng và hàng hóa thực tế.',
      operationalDirectives: [
        'Ban hành Công điện khẩn chấn chỉnh các Cục Thuế: Nghiêm cấm tùy tiện phong tỏa tài khoản doanh nghiệp khi chưa chứng minh được hành vi thông đồng thông thầu trái luật.',
        'Thiết lập tổ công tác phân loại nhanh hồ sơ doanh nghiệp ngay tình để giải tỏa tài khoản ngân hàng trong 48 giờ.',
        'Nâng cấp hệ thống AI phân tích rủi ro hóa đơn tự động khoanh vùng đúng đối tượng chủ mưu.'
      ]
    },
    calibratedScores: { S: 46, D: 17, V: 0.85, I: 0.85, riskScore: 85.5 },
    matchingKeywords: ['phá đường dây mua bán hóa đơn khống 30.000 tỷ', 'doanh nghiệp sản xuất ngay tình bị phong tỏa tài khoản']
  },
  {
    id: 87,
    scenarioCode: 'TH-87',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Rò rỉ dữ liệu chữ ký số và CCCD của 2,5 triệu chủ DN rao bán trên mạng',
    realArticleTitle: 'Rò rỉ dữ liệu chữ ký số và CCCD của 2,5 triệu chủ doanh nghiệp từ hệ thống công: Rao bán công khai trên diễn đàn hacker quốc tế',
    pressSources: ['Báo VnExpress', 'Báo Tuổi Trẻ'],
    decree376Basis: {
      clauseArticle: 'Khoản 14, Khoản 26 Điều 2; Khoản 23 Điều 3, Khoản 20 Điều 3',
      leadAgencyId: 'cuc-cntt',
      leadAgencyName: 'Cục Công nghệ thông tin và chuyển đổi số',
      decreeArticleClause: 'Khoản 23 Điều 3',
      cooperatingUnits: ['Cục Phát triển doanh nghiệp tư nhân và kinh tế tập thể']
    },
    classificationReason: 'Cơ quan quản lý chậm xác nhận mức độ rò rỉ dữ liệu, khiến doanh nghiệp hoang mang sợ bị kẻ gian làm thủ tục chuyển quyền đại diện pháp luật và chiếm đoạt tài khoản.',
    natureOfInformationVacuum: 'Chậm xác nhận mức độ rò rỉ dữ liệu khiến DN hoang mang sợ bị kẻ gian chuyển quyền đại diện pháp luật chiếm đoạt tài khoản.',
    actionScriptVi: 'Thông cáo báo chí khẩn trong 2 giờ: Cô lập hoàn toàn phân hệ máy chủ; cơ sở dữ liệu gốc an toàn; kích hoạt xác thực sinh trắc học 2 lớp đối với mọi thay đổi hồ sơ.',
    emergencyPlaybook: {
      goldenHourTiming: '02 giờ (Thông cáo báo chí khẩn & Cô lập hạ tầng mạng)',
      keyMessage: 'Bộ Tài chính đã cô lập hoàn toàn phân hệ máy chủ liên quan; cơ sở dữ liệu gốc an toàn tuyệt đối; kích hoạt tính năng xác thực sinh trắc học 2 lớp đối với mọi thay đổi hồ sơ pháp nhân.',
      operationalDirectives: [
        'Phối hợp Cục An toàn thông tin (Bộ TT&TT) rà soát mã độc.',
        'Tạm khóa chức năng nộp hồ sơ thay đổi người đại diện online nếu không quét NFC căn cước gắn chip chính chủ.',
        'Gửi cảnh báo bảo mật tới toàn bộ các tổ chức cung cấp dịch vụ chứng thực chữ ký số công cộng (CA).'
      ]
    },
    calibratedScores: { S: 47, D: 18, V: 0.9, I: 0.95, riskScore: 90.5 },
    matchingKeywords: ['rò rỉ dữ liệu chữ ký số và cccd của 2,5 triệu chủ doanh nghiệp', 'rao bán công khai trên diễn đàn hacker quốc tế']
  },
  {
    id: 88,
    scenarioCode: 'TH-88',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Bê bối thông thầu tại gói thầu sân bay quốc tế hàng nghìn tỷ',
    realArticleTitle: 'Bê bối lộ bí mật dữ liệu thầu tại dự án sân bay quốc tế: Khởi tố đường dây thông thầu \'quân xanh quân đỏ\' cấu kết cán bộ thẩm định',
    pressSources: ['Báo Nhân Dân', 'VTV1 Thời sự'],
    decree376Basis: {
      clauseArticle: 'Khoản 13 Điều 2; Khoản 15 Điều 3',
      leadAgencyId: 'cuc-qldt',
      leadAgencyName: 'Cục Quản lý đấu thầu',
      decreeArticleClause: 'Khoản 15 Điều 3',
    },
    classificationReason: 'Dư luận nghi ngờ tính bảo mật của Hệ thống mạng đấu thầu quốc gia khi dự toán giá thầu bị lộ cho nhà thầu "sân sau" trước giờ mở thầu.',
    natureOfInformationVacuum: 'Dư luận nghi ngờ tính bảo mật của Hệ thống mạng đấu thầu quốc gia khi dự toán bị lộ cho nhà thầu sân sau trước giờ mở thầu.',
    actionScriptVi: 'Phản ứng trong 12 giờ: Hủy ngay gói thầu vi phạm; công bố kết quả kiểm toán an toàn mật mã của Hệ thống e-GP; đình chỉ tư cách thầu của liên danh vi phạm.',
    emergencyPlaybook: {
      goldenHourTiming: '12 giờ (Xử lý kiên quyết & Công bố bảo mật hệ thống e-GP)',
      keyMessage: 'Cục Quản lý đấu thầu kiên quyết xử lý không có vùng cấm đối với mọi hành vi gian lận; ra quyết định hủy ngay gói thầu vi phạm và phối hợp xử lý hình sự các cá nhân liên quan.',
      operationalDirectives: [
        'Công bố kết quả kiểm toán an toàn mật mã của Hệ thống mạng đấu thầu quốc gia.',
        'Đình chỉ tư cách tham gia thầu của toàn bộ liên danh nhà thầu vi phạm.',
        'Chuyển hồ sơ cán bộ thẩm định tiếp tay sang Cơ quan Cảnh sát điều tra Bộ Công an.'
      ]
    },
    calibratedScores: { S: 45, D: 17, V: 0.85, I: 0.85, riskScore: 84.0 },
    matchingKeywords: ['lộ bí mật dữ liệu thầu tại dự án sân bay quốc tế', 'thông thầu \'quân xanh quân đỏ\' cấu kết với cán bộ thẩm định']
  },
  {
    id: 89,
    scenarioCode: 'TH-89',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Khủng hoảng chuỗi cung ứng xăng dầu: Cây xăng treo biển hết hàng xuyên đêm',
    realArticleTitle: 'Cây xăng đóng cửa diện rộng tại Hà Nội và TP.HCM: Người dân đội mưa xếp hàng xuyên đêm mua từng lít xăng, vận tải đình trệ',
    pressSources: ['Báo Lao Động', 'Báo Tuổi Trẻ', 'Báo Tiền Phong'],
    decree376Basis: {
      clauseArticle: 'Khoản 21 Điều 2; Khoản 18 Điều 3',
      leadAgencyId: 'cuc-qlg',
      leadAgencyName: 'Cục Quản lý giá',
      decreeArticleClause: 'Khoản 18 Điều 3',
      cooperatingUnits: ['Bộ Công Thương']
    },
    classificationReason: 'Người dân phẫn nộ trước cảnh đùn đẩy trách nhiệm điều hành giá giữa Bộ Tài chính và Bộ Công Thương; thiếu thông tin về giải pháp xuất cấp nguồn cung xăng dầu dự trữ khẩn cấp.',
    natureOfInformationVacuum: 'Người dân phẫn nộ trước cảnh đùn đẩy trách nhiệm điều hành giá giữa hai Bộ; thiếu giải pháp xuất cấp nguồn cung khẩn cấp.',
    actionScriptVi: 'Xử lý trong đêm (dưới 4 giờ): Ký văn bản hỏa tốc áp dụng ngay giá chi phí định mức mới; kiểm tra thu hồi giấy phép cây xăng găm hàng chờ tăng giá.',
    emergencyPlaybook: {
      goldenHourTiming: 'Dưới 04 giờ (Ngay trong đêm)',
      keyMessage: 'Bộ Tài chính cập nhật ngay chi phí vận chuyển và chi phí định mức mới vào công thức giá cơ sở; bảo đảm mức chiết khấu hợp lý để các cây xăng mở cửa bán hàng bình thường trở lại.',
      operationalDirectives: [
        'Ký văn bản hỏa tốc áp dụng ngay giá chi phí định mức mới trong kỳ điều hành gần nhất.',
        'Thành lập đoàn kiểm tra thu hồi giấy phép kinh doanh các cây xăng găm hàng chờ tăng giá.',
        'Họp báo khẩn cấp cùng Bộ Công Thương công bố kế hoạch bảo đảm 100% nguồn cung xăng dầu cho thủ đô và TP.HCM.'
      ]
    },
    calibratedScores: { S: 46, D: 18, V: 0.9, I: 0.95, riskScore: 89.0 },
    matchingKeywords: ['cây xăng đóng cửa diện rộng tại hà nội và tp.hcm', 'người dân đội mưa xếp hàng xuyên đêm mua từng lít xăng', 'vận tải đình trệ']
  },
  {
    id: 90,
    scenarioCode: 'TH-90',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Phẫn nộ vụ 500 tấn gạo dự trữ quốc gia cứu trợ lũ lụt bị ẩm mốc, hôi thối',
    realArticleTitle: 'Phẫn nộ vụ 500 tấn gạo dự trữ quốc gia cấp phát cứu trợ đồng bào lũ lụt miền Trung bị ẩm mốc, vón cục hôi thối',
    pressSources: ['Báo Tuổi Trẻ', 'Báo Thanh Niên'],
    decree376Basis: {
      clauseArticle: 'Khoản 11 Điều 2; Khoản 26 Điều 3',
      leadAgencyId: 'cuc-dtnn-res',
      leadAgencyName: 'Cục Dự trữ Nhà nước',
      decreeArticleClause: 'Khoản 26 Điều 3',
    },
    classificationReason: 'Sự im lặng của Cục Dự trữ Nhà nước trong 24 giờ đầu tiên khiến mạng xã hội bùng nổ phẫn nộ, nghi ngờ bòn rút tráo đổi gạo cứu trợ kém chất lượng.',
    natureOfInformationVacuum: 'Im lặng trong 24 giờ đầu khiến dư luận bùng nổ phẫn nộ, nghi ngờ có hành vi bòn rút, tráo đổi gạo cứu trợ kém chất lượng.',
    actionScriptVi: 'Xin lỗi và xử lý trong 12 giờ: Công khai xin lỗi nhân dân; đình chỉ công tác ban giám đốc chi cục dự trữ liên quan; điều động xe chở gạo mới loại 1 thay thế 100% ngay trong ngày.',
    emergencyPlaybook: {
      goldenHourTiming: '12 giờ (Công khai xin lỗi & Đổi gạo mới ngay trong ngày)',
      keyMessage: 'Lãnh đạo Cục Dự trữ Nhà nước công khai xin lỗi nhân dân; đình chỉ công tác toàn bộ ban giám đốc chi cục dự trữ liên quan; điều động xe chở gạo mới loại 1 thay thế 100% cho bà con vùng lũ ngay trong ngày.',
      operationalDirectives: [
        'Thành lập đoàn kiểm tra đặc biệt niêm phong toàn bộ kho bảo quản liên quan.',
        'Chuyển hồ sơ sang cơ quan cảnh sát điều tra nếu phát hiện sai phạm quy trình kiểm định chất lượng xuất kho.',
        'Thiết lập đường dây nóng tiếp nhận phản ánh chất lượng hàng cứu trợ tại các tỉnh miền Trung.'
      ]
    },
    calibratedScores: { S: 46, D: 18, V: 0.9, I: 0.9, riskScore: 88.0 },
    matchingKeywords: ['500 tấn gạo dự trữ quốc gia cấp phát cứu trợ', 'bị ẩm mốc, vón cục hôi thối', 'phẫn nộ vụ 500 tấn gạo dự trữ']
  },
  {
    id: 91,
    scenarioCode: 'TH-91',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Hãng kiểm toán Big 4 bị đình chỉ vì che giấu nợ xấu ngân hàng',
    realArticleTitle: 'Bê bối một hãng kiểm toán Big 4 tại Việt Nam bị thu hồi giấy phép vì che giấu nợ xấu ngân hàng: Thị trường tài chính rung lắc',
    pressSources: ['Báo VnEconomy', 'Reuters'],
    decree376Basis: {
      clauseArticle: 'Khoản 16 Điều 2; Khoản 17 Điều 3',
      leadAgencyId: 'cuc-qlktkt',
      leadAgencyName: 'Cục Quản lý, giám sát kế toán, kiểm toán',
      decreeArticleClause: 'Khoản 17 Điều 3',
    },
    classificationReason: 'Thị trường tài chính hoang mang rút tiền gửi; cơ quan quản lý chậm công bố thông điệp bảo đảm an toàn hệ thống và phạm vi trách nhiệm của kiểm toán viên.',
    natureOfInformationVacuum: 'Thị trường tài chính hoang mang rút tiền gửi; cơ quan quản lý chậm công bố thông điệp bảo đảm an toàn hệ thống.',
    actionScriptVi: 'Họp báo trong 24 giờ: Đình chỉ tư cách kiểm toán viên hành nghề ký báo cáo sai lệch; khẳng định các chỉ số thanh khoản ngân hàng được giám sát độc lập, an toàn.',
    emergencyPlaybook: {
      goldenHourTiming: '24 giờ (Họp báo & Ổn định thị trường vốn)',
      keyMessage: 'Bộ Tài chính kiên quyết thanh lọc thị trường kiểm toán; các chỉ số an toàn thanh khoản của hệ thống ngân hàng được Ngân hàng Nhà nước và Bộ Tài chính giám sát độc lập, an toàn tuyệt đối.',
      operationalDirectives: [
        'Ban hành quyết định đình chỉ tư cách kiểm toán viên hành nghề của các cá nhân ký báo cáo sai lệch.',
        'Mở đợt tổng thanh tra chất lượng hồ sơ kiểm toán các tổ chức tín dụng.',
        'Phối hợp Ngân hàng Nhà nước ra thông cáo chung khẳng định độ an toàn của hệ thống tiền gửi.'
      ]
    },
    calibratedScores: { S: 47, D: 18, V: 0.9, I: 0.95, riskScore: 90.5 },
    matchingKeywords: ['hãng kiểm toán big 4 tại việt nam bị thu hồi giấy phép', 'che giấu nợ xấu ngân hàng', 'thị trường tài chính rung lắc dữ dội']
  },
  {
    id: 92,
    scenarioCode: 'TH-92',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Bán chỉ định "đất vàng" công sản giá bèo bọt thất thoát hàng nghìn tỷ',
    realArticleTitle: 'Kỳ 1: Hàng chục khu \'đất vàng\' công sản tại trung tâm TP.HCM bị bán chỉ định giá bèo bọt - Ai chịu trách nhiệm làm thất thoát ngân sách?',
    pressSources: ['Báo Tiền Phong'],
    decree376Basis: {
      clauseArticle: 'Khoản 12 Điều 2; Khoản 14 Điều 3',
      leadAgencyId: 'cuc-qlcs',
      leadAgencyName: 'Cục Quản lý công sản',
      decreeArticleClause: 'Khoản 14 Điều 3',
    },
    classificationReason: 'Báo chí chỉ rõ sai phạm thẩm định giá theo Nghị định 167; đặt dấu hỏi về sự thiếu minh bạch và buông lỏng kiểm tra của cơ quan quản lý công sản trung ương.',
    natureOfInformationVacuum: 'Báo chí chỉ rõ sai phạm định giá theo Nghị định 167; chất vấn sự buông lỏng kiểm tra của cơ quan quản lý công sản.',
    actionScriptVi: 'Phản ứng trong 24 giờ: Chủ động thành lập đoàn thanh tra đặc biệt rà soát toàn bộ quy trình sắp xếp đất công sản; chuyển dấu hiệu sai phạm định giá sang C03.',
    emergencyPlaybook: {
      goldenHourTiming: '24 giờ (Thành lập đoàn thanh tra đặc biệt)',
      keyMessage: 'Bộ Tài chính chủ động thành lập đoàn thanh tra đặc biệt rà soát toàn bộ quy trình sắp xếp đất công sản; kiên quyết kiến nghị thu hồi tài sản vi phạm về cho nhà nước.',
      operationalDirectives: [
        'Ký quyết định thanh tra toàn diện hồ sơ chuyển nhượng các khu đất báo chí nêu.',
        'Chuyển toàn bộ dấu hiệu sai phạm định giá sang Cơ quan Cảnh sát điều tra Bộ Công an (C03).',
        'Cung cấp thông tin tiến độ thanh tra định kỳ hàng tuần cho Báo Tiền Phong.'
      ]
    },
    calibratedScores: { S: 46, D: 17, V: 0.85, I: 0.85, riskScore: 85.5 },
    matchingKeywords: ['hàng chục khu \'đất vàng\' công sản tại trung tâm', 'bị bán chỉ định giá bèo bọt', 'thất thoát ngân sách']
  },
  {
    id: 93,
    scenarioCode: 'TH-93',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Tin đồn thất thiệt "Nợ công vượt trần 75% GDP, Chính phủ nguy cơ vỡ nợ"',
    realArticleTitle: 'Tin đồn thất thiệt \'Nợ công vượt trần 75% GDP, Chính phủ đứng trước nguy cơ vỡ nợ\': Dư luận hoang mang đổ xô đi mua vàng và USD',
    pressSources: ['Báo Dân Trí', 'Báo Tuổi Trẻ'],
    decree376Basis: {
      clauseArticle: 'Khoản 15 Điều 2; Khoản 13 Điều 3',
      leadAgencyId: 'cuc-qln',
      leadAgencyName: 'Cục Quản lý nợ và Tài chính đối ngoại',
      decreeArticleClause: 'Khoản 13 Điều 3',
    },
    classificationReason: 'Kênh truyền thông nước ngoài trích dẫn số liệu bịa đặt gây hoảng loạn; thiếu các biểu đồ trực quan, dễ hiểu phản bác lại các thông tin sai lệch về chỉ số nợ công an toàn thực tế.',
    natureOfInformationVacuum: 'Kênh truyền thông nước ngoài trích dẫn số liệu bịa đặt; thiếu biểu đồ trực quan bác bỏ tin đồn nợ công vượt trần.',
    actionScriptVi: 'Lên sóng Thời sự VTV1 19h trong ngày: Khẳng định tỷ lệ nợ công thực tế chỉ khoảng 37% GDP, nằm sâu trong ngưỡng an toàn 60% của Quốc hội; phát hành Bản tin Nợ công đặc biệt.',
    emergencyPlaybook: {
      goldenHourTiming: 'Thời sự VTV1 19h trong ngày (Phản bác tin đồn kinh tế vĩ mô)',
      keyMessage: 'Bộ Tài chính khẳng định tỷ lệ nợ công thực tế của Việt Nam chỉ khoảng 37% GDP, nằm sâu trong ngưỡng an toàn 60% của Quốc hội; nghĩa vụ trả nợ của Chính phủ luôn được bảo đảm đầy đủ, đúng hạn.',
      operationalDirectives: [
        'Phát hành "Bản tin Nợ công đặc biệt" kèm Infographic trực quan trên Cổng thông tin Chính phủ.',
        'Phối hợp cơ quan an ninh xử lý các kênh truyền thông tung tin bịa đặt.',
        'Tổ chức họp báo quốc tế cung cấp số liệu nợ công chính thống cho các hãng thông tấn nước ngoài (Bloomberg, Reuters).'
      ]
    },
    calibratedScores: { S: 48, D: 19, V: 0.95, I: 0.95, riskScore: 94.0 },
    matchingKeywords: ['nợ công vượt trần 75% gdp', 'chính phủ đứng trước nguy cơ vỡ nợ', 'dư luận hoang mang đổ xô đi mua vàng và usd']
  },
  {
    id: 94,
    scenarioCode: 'TH-94',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Gián đoạn thuốc ung thư danh mục BHYT do tắc thầu thuốc tập trung',
    realArticleTitle: 'Bất cập danh mục thuốc BHYT gây gián đoạn điều trị ung thư: Bệnh nhân nghèo đứng trước nguy cơ dừng thuốc vì hết thầu',
    pressSources: ['Báo Tuổi Trẻ', 'Báo Dân Trí'],
    decree376Basis: {
      clauseArticle: 'Khoản 22 Điều 2; Khoản 34 Điều 3',
      leadAgencyId: 'bhxh-vn',
      leadAgencyName: 'Bảo hiểm xã hội Việt Nam',
      decreeArticleClause: 'Khoản 34 Điều 3',
      cooperatingUnits: ['Bộ Y tế']
    },
    classificationReason: 'Sự chậm trễ phê duyệt kết quả đấu thầu thuốc tập trung khiến người bệnh ung thư nguy kịch; cơ quan BHXH bị quy trách nhiệm cứng nhắc trong thủ tục thanh toán chi trả.',
    natureOfInformationVacuum: 'Chậm phê duyệt kết quả thầu thuốc tập trung khiến bệnh nhân ung thư nguy kịch; cơ quan BHXH bị quy trách nhiệm cứng nhắc.',
    actionScriptVi: 'Ban hành văn bản hỏa tốc trong 6 giờ: Kích hoạt ngay cơ chế thanh toán đặc thù cho các phác đồ đang điều trị để bệnh viện mua sắm khẩn cấp, BHXH cam kết thanh toán 100%.',
    emergencyPlaybook: {
      goldenHourTiming: '06 giờ (Ban hành cơ chế đặc thù khẩn cấp)',
      keyMessage: 'Bảo hiểm xã hội Việt Nam đặt sinh mạng của người bệnh lên trên hết; kích hoạt ngay cơ chế thanh toán đặc thù cho các phác đồ đang điều trị để bệnh viện mua sắm khẩn cấp.',
      operationalDirectives: [
        'Ban hành công văn cho phép các bệnh viện ung bướu áp dụng chỉ định thầu rút gọn hoặc mua sắm trực tiếp.',
        'BHXH cam kết thanh quyết toán 100% chi phí thuốc phát sinh.',
        'Lập tổ công tác thường trực tại Bệnh viện K và Ung bướu TP.HCM để tháo gỡ vướng mắc hồ sơ bảo hiểm trong 24 giờ.'
      ]
    },
    calibratedScores: { S: 46, D: 18, V: 0.85, I: 0.9, riskScore: 86.5 },
    matchingKeywords: ['gián đoạn điều trị ung thư: bệnh nhân nghèo', 'dừng thuốc vì hết thầu', 'bất cập danh mục thuốc bhyt']
  },
  {
    id: 95,
    scenarioCode: 'TH-95',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Hàng triệu đơn hàng giá rẻ sàn TMĐT xuyên biên giới né thuế',
    realArticleTitle: 'Hàng triệu đơn hàng giá rẻ xuyên biên giới né thuế mỗi ngày: Doanh nghiệp dệt may, da giày trong nước kêu cứu bên bờ vực phá sản',
    pressSources: ['Báo Thanh Niên', 'Báo Lao Động'],
    decree376Basis: {
      clauseArticle: 'Khoản 9, Khoản 20 Điều 2; Khoản 24 Điều 3, Khoản 25 Điều 3',
      leadAgencyId: 'cuc-thue',
      leadAgencyName: 'Cục Thuế',
      decreeArticleClause: 'Khoản 24 Điều 3',
      cooperatingUnits: ['Cục Hải quan']
    },
    classificationReason: 'Dư luận phẫn nộ vì chính sách miễn thuế GTGT đối với hàng nhập khẩu giá trị nhỏ dưới 1 triệu đồng qua sàn TMĐT (Shopee, Temu) tạo bất bình đẳng nghiêm trọng với hàng nội.',
    natureOfInformationVacuum: 'Chính sách miễn thuế GTGT hàng nhập khẩu giá trị nhỏ dưới 1 triệu đồng qua sàn TMĐT tạo bất bình đẳng nghiêm trọng, đe dọa bóp nghẹt sản xuất nội địa.',
    actionScriptVi: 'Họp báo trong 24 giờ: Trình Chính phủ bãi bỏ quy định miễn thuế GTGT đối với hàng nhập khẩu giá trị nhỏ qua thương mại điện tử; xây dựng cơ chế thu thuế tự động tại cổng hải quan số.',
    emergencyPlaybook: {
      goldenHourTiming: '24 giờ (Họp báo & Trình cấp có thẩm quyền sửa đổi chính sách)',
      keyMessage: 'Bộ Tài chính khẩn trương trình Chính phủ bãi bỏ quy định miễn thuế GTGT đối với hàng nhập khẩu giá trị nhỏ qua thương mại điện tử; xây dựng cơ chế thu thuế tự động tại cổng hải quan số.',
      operationalDirectives: [
        'Trình cấp có thẩm quyền ban hành Nghị định bãi bỏ Quyết định 78/2010/QĐ-TTg.',
        'Yêu cầu các sàn TMĐT xuyên biên giới phải đăng ký thuế và nộp thuế thay cho các nhà bán hàng quốc tế.',
        'Tăng cường kiểm tra thực tế hàng hóa tại các kho ngoại quan và cửa khẩu chuyển phát nhanh.'
      ]
    },
    calibratedScores: { S: 44, D: 16, V: 0.85, I: 0.9, riskScore: 83.5 },
    matchingKeywords: ['hàng triệu đơn hàng giá rẻ xuyên biên giới né thuế', 'doanh nghiệp dệt may, da giày trong nước kêu cứu', 'miễn thuế dưới 1 triệu đồng']
  },
  {
    id: 96,
    scenarioCode: 'TH-96',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Tin tặc tấn công mã hóa hệ thống TABMIS Kho bạc Nhà nước',
    realArticleTitle: 'Tin tặc mã hóa cơ sở dữ liệu Kho bạc Nhà nước: Thực hư thông tin dừng toàn bộ việc chi trả lương cán bộ, công chức toàn quốc?',
    pressSources: ['Báo VietNamNet', 'Báo VTC News'],
    decree376Basis: {
      clauseArticle: 'Khoản 10, Khoản 26 Điều 2; Khoản 28 Điều 3, Khoản 23 Điều 3',
      leadAgencyId: 'kbnn',
      leadAgencyName: 'Kho bạc Nhà nước',
      decreeArticleClause: 'Khoản 28 Điều 3',
      cooperatingUnits: ['Cục Công nghệ thông tin và chuyển đổi số', 'Cục An toàn thông tin']
    },
    classificationReason: 'Tin tặc tung ảnh chụp màn hình dữ liệu chi ngân sách lên diễn đàn ngầm; tin đồn lan truyền gây hoang mang trong toàn bộ hệ thống cơ quan hành chính nhà nước.',
    natureOfInformationVacuum: 'Tin tặc tung ảnh chụp dữ liệu chi ngân sách; tin đồn dừng chi trả lương gây hoang mang trong toàn bộ hệ thống hành chính.',
    actionScriptVi: 'Thông cáo báo chí bác bỏ tin đồn trong 1 giờ: Khẳng định hệ thống TABMIS vận hành độc lập, an toàn 100%; tiền lương và chi ngân sách giải ngân thông suốt.',
    emergencyPlaybook: {
      goldenHourTiming: '01 giờ (Bác bỏ tin đồn an ninh mạng quốc gia)',
      keyMessage: 'Kho bạc Nhà nước khẳng định hệ thống thông tin TABMIS và Cổng DVC trực tuyến KBNN vận hành độc lập, an toàn 100%; tiền lương và các khoản chi ngân sách được giải ngân bình thường, thông suốt.',
      operationalDirectives: [
        'KBNN kích hoạt tường lửa quân sự, phối hợp Cục An toàn thông tin và A05 rà soát mã độc.',
        'Gửi thông báo số hóa đến 100% đơn vị sử dụng ngân sách trên toàn quốc khẳng định an toàn hệ thống.',
        'Cung cấp bằng chứng kỹ thuật chứng minh các ảnh chụp trên mạng là dữ liệu mô phỏng giả mạo.'
      ]
    },
    calibratedScores: { S: 49, D: 19, V: 0.95, I: 0.95, riskScore: 96.0 },
    matchingKeywords: ['tin tặc mã hóa cơ sở dữ liệu kho bạc nhà nước', 'thực hư thông tin dừng toàn bộ việc chi trả lương', 'mã hóa hệ thống tabmis']
  },
  {
    id: 97,
    scenarioCode: 'TH-97',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Tranh cãi tính chính xác số liệu GDP quý: Nguy cơ hạ bậc tín nhiệm',
    realArticleTitle: 'Tranh cãi số liệu tăng trưởng GDP quý III: Các tổ chức tài chính quốc tế hoài nghi phương pháp thống kê bỏ sót khu vực kinh tế số',
    pressSources: ['Báo Đầu tư', 'Reuters'],
    decree376Basis: {
      clauseArticle: 'Khoản 23 Điều 2; Khoản 27 Điều 3',
      leadAgencyId: 'cuc-tk',
      leadAgencyName: 'Cục Thống kê',
      decreeArticleClause: 'Khoản 27 Điều 3',
    },
    classificationReason: 'Báo chí quốc tế đặt dấu hỏi về độ tin cậy của tốc độ tăng trưởng kinh tế Việt Nam khi không phản ánh đúng sự sụt giảm đơn hàng xuất khẩu; nguy cơ các tổ chức xếp hạng tín nhiệm hạ bậc quốc gia.',
    natureOfInformationVacuum: 'Báo chí quốc tế hoài nghi độ tin cậy số liệu GDP; nguy cơ các tổ chức S&P, Moody\'s hạ bậc tín nhiệm quốc gia.',
    actionScriptVi: 'Họp báo quốc tế trong 48 giờ: Khẳng định quy trình thu thập và xử lý số liệu GDP tuân thủ 100% theo SNA 2008 của LHQ; công khai phương pháp luận đo lường kinh tế số.',
    emergencyPlaybook: {
      goldenHourTiming: '48 giờ (Họp báo quốc tế & Bàn tròn kinh tế)',
      keyMessage: 'Cục Thống kê khẳng định quy trình thu thập và xử lý số liệu GDP tuân thủ 100% theo Hệ thống Tài khoản Quốc gia của Liên Hợp Quốc (SNA 2008); công khai minh bạch phương pháp luận đo lường kinh tế số.',
      operationalDirectives: [
        'Tổ chức hội thảo bàn tròn quốc tế với sự tham dự của đại diện WB, IMF và các chuyên gia kinh tế độc lập.',
        'Phát hành tài liệu giải thích chi tiết phương pháp tính GDP bằng song ngữ Anh - Việt.',
        'Làm việc trực tiếp với các tổ chức xếp hạng tín nhiệm (S&P, Moody\'s, Fitch) cung cấp cơ sở dữ liệu vi mô đối chiếu.'
      ]
    },
    calibratedScores: { S: 44, D: 16, V: 0.8, I: 0.9, riskScore: 82.0 },
    matchingKeywords: ['tranh cãi số liệu tăng trưởng gdp quý iii', 'hoài nghi phương pháp thống kê bỏ sót kinh tế số', 'nguy cơ hạ bậc tín nhiệm']
  },
  {
    id: 98,
    scenarioCode: 'TH-98',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Lừa đảo đầu tư trái phiếu qua app mạo danh con dấu UBCKNN lãi 25%/năm',
    realArticleTitle: 'Hàng vạn nạn nhân sập bẫy ứng dụng \'Tiết kiệm đầu tư linh hoạt\' cam kết lãi suất 25%/năm mạo danh con dấu UBCKNN',
    pressSources: ['Báo Dân Trí', 'VTV1 Chuyển động 24h'],
    decree376Basis: {
      clauseArticle: 'Khoản 17, Khoản 19 Điều 2; Khoản 29 Điều 3',
      leadAgencyId: 'ubcknn',
      leadAgencyName: 'Ủy ban Chứng khoán Nhà nước',
      decreeArticleClause: 'Khoản 29 Điều 3',
    },
    classificationReason: 'Kẻ lừa đảo làm giả Giấy phép hoạt động của UBCKNN để huy động vốn trái phiếu ma; cơ quan quản lý chậm đưa ra thông điệp cảnh báo định danh các đơn vị quản lý quỹ được cấp phép.',
    natureOfInformationVacuum: 'Kẻ lừa đảo làm giả Giấy phép hoạt động của UBCKNN để huy động vốn trái phiếu ma; chậm đưa thông điệp định danh các đơn vị hợp pháp.',
    actionScriptVi: 'Lên bản tin Thời sự trong ngày: Khẳng định UBCKNN không cấp phép cho bất kỳ app FinTech nào huy động vốn cam kết lãi suất cố định; chuyển danh sách sang Cục CSHS khởi tố.',
    emergencyPlaybook: {
      goldenHourTiming: 'Trong ngày (Phát sóng cảnh báo trên bản tin Thời sự)',
      keyMessage: 'UBCKNN khẳng định không cấp phép cho bất kỳ ứng dụng FinTech nào huy động vốn trái phiếu cam kết lãi suất cố định; khuyến cáo nhà đầu tư tra cứu danh sách các công ty quản lý quỹ hợp pháp trên cổng UBCKNN.',
      operationalDirectives: [
        'Chuyển toàn bộ danh sách 15 ứng dụng mạo danh sang Cục Cảnh sát hình sự Bộ Công an để khởi tố vụ án lừa đảo chiếm đoạt tài sản.',
        'Công bố danh bạ các quỹ mở được cấp phép chính thức.',
        'Yêu cầu các ngân hàng thương mại tạm dừng chuyển tiền tới các tài khoản thụ hưởng có tên trùng với app lừa đảo.'
      ]
    },
    calibratedScores: { S: 46, D: 17, V: 0.85, I: 0.9, riskScore: 86.5 },
    matchingKeywords: ['tiết kiệm đầu tư linh hoạt cam kết lãi suất 25%/năm', 'mạo danh con dấu ubcknn', 'hàng vạn nạn nhân sập bẫy ứng dụng']
  },
  {
    id: 99,
    scenarioCode: 'TH-99',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Bất cập tiêu chí đấu thầu thuốc tập trung nguy cơ vỡ hợp đồng toàn quốc',
    realArticleTitle: 'Nguy cơ vỡ thầu cung ứng thuốc quốc gia: Doanh nghiệp dược phẩm đồng loạt từ chối ký hợp đồng vì giá trúng thầu thấp hơn giá thành sản xuất',
    pressSources: ['Báo Tiền Phong', 'Báo Lao Động'],
    decree376Basis: {
      clauseArticle: 'Khoản 13, Khoản 21 Điều 2; Khoản 15 Điều 3, Khoản 18 Điều 3',
      leadAgencyId: 'cuc-qldt',
      leadAgencyName: 'Cục Quản lý đấu thầu',
      decreeArticleClause: 'Khoản 15 Điều 3',
      cooperatingUnits: ['Cục Quản lý giá', 'Bộ Y tế']
    },
    classificationReason: 'Tình trạng thiếu thuốc diện rộng có nguy cơ tái diễn do cách tính giá kế hoạch máy móc không cập nhật biến động giá nguyên liệu toàn cầu; hai cơ quan đấu thầu và quản lý giá chậm đưa giải pháp.',
    natureOfInformationVacuum: 'Cách tính giá kế hoạch máy móc không cập nhật giá nguyên liệu dược toàn cầu; nguy cơ vỡ thầu cung ứng thuốc toàn quốc.',
    actionScriptVi: 'Họp liên bộ khẩn cấp trong 24 giờ: Điều chỉnh phương pháp xác định giá gói thầu thuốc theo sát thị trường quốc tế; cho phép áp dụng phương pháp đàm phán giá đối với biệt dược gốc.',
    emergencyPlaybook: {
      goldenHourTiming: '24 giờ (Họp liên bộ khẩn cấp & Sửa đổi mẫu hồ sơ thầu)',
      keyMessage: 'Bộ Tài chính phối hợp Bộ Y tế điều chỉnh phương pháp xác định giá gói thầu thuốc theo sát thị trường quốc tế; bảo đảm lợi ích hài hòa giữa nhà nước, doanh nghiệp và bệnh nhân.',
      operationalDirectives: [
        'Cục Quản lý đấu thầu ban hành văn bản hướng dẫn cho phép áp dụng phương pháp đàm phán giá đối với các nhóm thuốc biệt dược gốc và thuốc hiếm.',
        'Sửa đổi mẫu hồ sơ mời thầu thuốc tập trung cho phép điều chỉnh giá theo biến động CPI nguyên liệu dược phẩm quốc tế.',
        'Ký cam kết liên ngành không để xảy ra tình trạng thiếu thuốc cấp cứu tại các bệnh viện tuyến cuối.'
      ]
    },
    calibratedScores: { S: 45, D: 17, V: 0.85, I: 0.95, riskScore: 86.5 },
    matchingKeywords: ['nguy cơ vỡ thầu cung ứng thuốc quốc gia', 'doanh nghiệp dược phẩm đồng loạt từ chối ký hợp đồng', 'giá trúng thầu thấp hơn giá thành sản xuất']
  },
  {
    id: 100,
    scenarioCode: 'TH-100',
    tier: 3,
    tierLabelVi: 'Mức 3: Cảnh báo gấp',
    sopLevel: 4,
    sopLevelNameVi: 'SOP Cấp 4: Khẩn cấp',
    title: 'Đại dự án PPP đội vốn hàng nghìn tỷ do tranh chấp chia sẻ doanh thu',
    realArticleTitle: 'Bế tắc dự án cao tốc PPP nghìn tỷ: Doanh nghiệp dự án dọa trả lại trạm thu phí vì nhà nước chậm kích hoạt cơ chế chia sẻ giảm doanh thu',
    pressSources: ['Báo Đầu tư', 'Báo VnExpress'],
    decree376Basis: {
      clauseArticle: 'Điểm a Khoản 7 Điều 2; Khoản 2 Điều 3, Khoản 1 Điều 3',
      leadAgencyId: 'vu-dtht',
      leadAgencyName: 'Vụ Đầu tư và Phát triển hạ tầng',
      decreeArticleClause: 'Khoản 2 Điều 3',
      cooperatingUnits: ['Vụ Ngân sách nhà nước']
    },
    classificationReason: 'Báo chí mổ xẻ việc Luật PPP quy định cơ chế chia sẻ rủi ro giảm doanh thu nhưng Bộ Tài chính chưa bố trí nguồn vốn ngân sách dự phòng để thanh toán, dẫn đến nguy cơ các ngân hàng siết nợ đình trệ dự án.',
    natureOfInformationVacuum: 'Luật PPP quy định cơ chế chia sẻ rủi ro nhưng chưa bố trí nguồn dự phòng ngân sách thanh toán, dẫn tới nguy cơ ngân hàng siết nợ đình trệ cao tốc.',
    actionScriptVi: 'Báo cáo Thủ tướng Chính phủ và họp báo trong 48 giờ: Hoàn thiện phương án phân bổ nguồn dự phòng ngân sách trung ương trình Chính phủ báo cáo Ủy ban Thường vụ Quốc hội xem xét quyết định.',
    emergencyPlaybook: {
      goldenHourTiming: '48 giờ (Báo cáo Thủ tướng Chính phủ và Họp báo)',
      keyMessage: 'Bộ Tài chính cam kết đồng hành cùng nhà đầu tư PPP thực hiện đúng hợp đồng đã ký kết; khẩn trương xây dựng phương án sử dụng nguồn tăng thu ngân sách trung ương để thanh toán nghĩa vụ chia sẻ rủi ro doanh thu theo luật định.',
      operationalDirectives: [
        'Vụ Đầu tư và Phát triển hạ tầng phối hợp Vụ Ngân sách nhà nước hoàn thiện phương án phân bổ nguồn dự phòng ngân sách trung ương.',
        'Làm việc với Ngân hàng Nhà nước và các ngân hàng tài trợ vốn cam kết cơ cấu nợ, không chuyển nhóm nợ xấu đối với các dự án PPP trọng điểm.',
        'Tổ chức đối thoại tháo gỡ khó khăn với Hiệp hội các nhà đầu tư công trình giao thông (VARSI).'
      ]
    },
    calibratedScores: { S: 46, D: 18, V: 0.85, I: 0.9, riskScore: 87.0 },
    matchingKeywords: ['bế tắc dự án cao tốc ppp nghìn tỷ', 'doanh nghiệp dự án dọa trả lại trạm thu phí', 'chậm kích hoạt cơ chế chia sẻ giảm doanh thu']
  }
];

/**
 * Tìm kiếm tình huống chuẩn đối soát trong Cẩm nang 100 tình huống
 */
export function findMatchingDecree376Scenario(text: string): Decree376ScenarioItem | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  for (const item of DECREE_376_100_SCENARIOS) {
    // 1. Kiểm tra từ khóa đặc thù của từng bài báo
    const matchCount = item.matchingKeywords.filter(kw => lower.includes(kw.toLowerCase())).length;
    if (matchCount > 0) {
      return item;
    }

    // 2. Kiểm tra tiêu đề chính xác
    if (lower.includes(item.title.toLowerCase()) || lower.includes(item.realArticleTitle.toLowerCase())) {
      return item;
    }
  }

  return null;
}

/**
 * Tìm kiếm và truy xuất RAG đối soát từ Cẩm nang 100 tình huống Nghị định 376
 */
export function searchDecree376ScenariosForRag(
  query: string,
  limit: number = 3
): {
  matchedScenarios: Decree376ScenarioItem[];
  promptContext: string;
} {
  if (!query) {
    return { matchedScenarios: [], promptContext: '' };
  }

  const queryLower = query.toLowerCase();
  const queryTokens = queryLower.split(/\s+/).filter(t => t.length > 2);

  const scored = DECREE_376_100_SCENARIOS.map(item => {
    let score = 0;
    const combined = `${item.scenarioCode} ${item.title} ${item.realArticleTitle} ${item.classificationReason} ${item.natureOfInformationVacuum || ''} ${item.actionScriptVi || ''} ${item.decree376Basis.leadAgencyName} ${item.matchingKeywords.join(' ')}`.toLowerCase();

    // 1. Kiểm tra từ khóa tình huống
    for (const kw of item.matchingKeywords) {
      if (queryLower.includes(kw.toLowerCase())) score += 35;
    }

    // 2. Kiểm tra mã tình huống (e.g. "TH-01", "TH-76")
    if (queryLower.includes(item.scenarioCode.toLowerCase())) score += 60;

    // 3. Khớp tiêu đề
    if (queryLower.includes(item.title.toLowerCase()) || queryLower.includes(item.realArticleTitle.toLowerCase())) {
      score += 40;
    }

    // 4. Token overlap
    for (const token of queryTokens) {
      if (combined.includes(token)) score += 3;
      if (item.title.toLowerCase().includes(token)) score += 6;
    }

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const matchedScenarios = scored.filter(s => s.score > 0).slice(0, limit).map(s => s.item);

  if (matchedScenarios.length === 0) {
    return { matchedScenarios: [], promptContext: '' };
  }

  const promptContext = `[BỘ NHỚ RAG ĐỐI SOÁT CHUẨN NGHỊ ĐỊNH 376/2026/NĐ-CP (100 TÌNH HUỐNG THỰC CHIẾN BỘ TÀI CHÍNH)]:\n` +
    matchedScenarios.map((sc, i) => {
      const emergencyStr = sc.emergencyPlaybook
        ? `\n     * Khung giờ vàng: ${sc.emergencyPlaybook.goldenHourTiming}\n     * Thông điệp chủ đạo (Key Message): "${sc.emergencyPlaybook.keyMessage}"\n     * Chỉ đạo tác chiến: ${sc.emergencyPlaybook.operationalDirectives.join('; ')}`
        : '';
      return `${i + 1}. **Mã ${sc.scenarioCode}**: ${sc.title} [${sc.tierLabelVi}] (Điểm rủi ro: ${sc.calibratedScores.riskScore}/100)\n` +
        `   - Báo chí thực tế: "${sc.realArticleTitle}" (${sc.pressSources.join(', ')})\n` +
        `   - Căn cứ NĐ 376: ${sc.decree376Basis.clauseArticle}; Đơn vị chủ trì: **${sc.decree376Basis.leadAgencyName}**${sc.decree376Basis.cooperatingUnits?.length ? ` (Phối hợp: ${sc.decree376Basis.cooperatingUnits.join(', ')})` : ''}\n` +
        `   - Bản chất khoảng trống thông tin: ${sc.natureOfInformationVacuum || sc.classificationReason}\n` +
        `   - Kịch bản xử lý / Tham mưu: ${sc.actionScriptVi || 'Theo quy trình phân cấp NĐ 376'}${emergencyStr}`;
    }).join('\n\n');

  return { matchedScenarios, promptContext };
}

/**
 * Hướng dẫn chỉ lối cho AI phân loại thông tin và vận hành bộ nhớ RAG theo Cẩm nang 100 tình huống NĐ 376
 */
export function generateDecree376AiClassificationGuidePrompt(): string {
  return `[HƯỚNG DẪN CHỈ LỐI PHÂN LOẠI & BỘ NHỚ RAG THEO CẨM NANG 100 TÌNH HUỐNG NGHỊ ĐỊNH 376/2026/NĐ-CP]:
Khi đánh giá và phân loại bất kỳ thông tin, điểm tin báo chí hay phản ánh dư luận nào liên quan đến ngành Tài chính, AI BẮT BUỘC đối soát theo Ma trận 100 Tình huống thực chiến Nghị định 376/2026/NĐ-CP:
1. NHÓM MỨC 0 - TẬP MẪU LOẠI TRỪ / KHÔNG CẢNH BÁO (Tình huống 01 – 10, 0-19 điểm):
   - Bản chất: Thông tin chính sách đã hoàn thiện đầy đủ căn cứ (như giảm 2% thuế GTGT đã có NĐ); hoạt động tư pháp tố tụng bình thường (bắt pháo lậu); an sinh xã hội, thi đua khen thưởng; thống kê định kỳ; hoặc SAI THẨM QUYỀN BỘ NGÀNH (lãi suất thương mại thuộc NHNN, giá đất bồi thường thuộc địa phương, giá vàng thế giới).
   - Nhiệm vụ AI: Gán nhãn Mức 0, khử nhiễu tuyệt đối, không tạo cảnh báo hay kịch bản can thiệp.
2. NHÓM MỨC 1 - CẦN LƯU TÂM / CẢNH BÁO XA (Tình huống 11 – 40, 20-39 điểm):
   - Bản chất: Người dân/doanh nghiệp hỏi đáp thủ tục, lúng túng quy trình (đồng bộ CCCD và MST, giảm trừ gia cảnh freelancer, VssID thai sản, tra mã HS drone, kê khai giá SGK, hóa đơn máy tính tiền...). CHƯA phát sinh thiệt hại tài chính hay phạt tiền.
   - Nhiệm vụ AI: Gán nhãn Mức 1 / Cảnh báo xa, xác định đúng đơn vị chủ trì (trong 34 đơn vị NĐ 376), đề xuất kịch bản lấp khoảng trống bằng Infographic, video ngắn, bài viết Q&A Bạn đọc, KHÔNG trầm trọng hóa khủng hoảng.
3. NHÓM MỨC 2 - CẢNH BÁO SỚM (Tình huống 41 – 75, 40-74 điểm):
   - Bản chất: Báo chí kinh tế phản ánh bất cập, bắt đầu có thiệt hại tài chính, ách tắc dòng tiền, nợ thuế bị phạt, tạm hoãn xuất cảnh vì nợ nhỏ, tiệm vàng đóng cửa né HĐĐT, chậm hoàn thuế GTGT dăm gỗ, cây xăng chiết khấu 0 đồng, trụ sở công dôi dư bỏ hoang, bệnh viện thiếu máy móc vướng công sản, Hiệp hội gửi đơn kiến nghị.
   - Nhiệm vụ AI: Gán nhãn Mức 2 / Cảnh báo sớm, đề xuất SOP 24h, công văn chấn chỉnh các Cục địa phương, tháo gỡ điểm nghẽn, trả lời phỏng vấn báo chí minh bạch.
4. NHÓM MỨC 3 - CẢNH BÁO GẤP / KHẨN CẤP (Tình huống 76 – 100, 75-100 điểm):
   - Bản chất: Tuyến bài điều tra trang nhất, Thời sự VTV1 19h giờ vàng, hệ thống tê liệt diện rộng (eTax nghẽn mạng 31/3, VNACCS Cát Lái tê liệt), khủng hoảng niềm tin (SCB - Manulife, hủy trái phiếu Tân Hoàng Minh 10.030 tỷ), văn bản giả mạo khởi tố UBCKNN gây sập sàn, rò rỉ dữ liệu CCCD 2.5 triệu doanh nghiệp, nguy cơ vỡ thầu thuốc quốc gia, khiếu kiện đông người.
   - Nhiệm vụ AI: Gán nhãn Mức 3 / Cảnh báo gấp (SOP Cấp 4), kích hoạt Khung giờ vàng 2 - 4h, cung cấp Thông điệp chủ đạo (Key Message), đề xuất thành lập Đoàn thanh tra khẩn hoặc công bố quyết định điều hành hỏa tốc.`;
}
