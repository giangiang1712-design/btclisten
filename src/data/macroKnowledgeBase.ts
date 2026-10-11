/**
 * Hệ thống Tri thức Tài chính Vĩ mô, Pháp luật Ngân sách, Thuế, Thị trường Vốn
 * và Quy chuẩn Tham mưu 4 Bước Bộ Tài chính Việt Nam
 */

export interface LegalFrameworkItem {
  id: string;
  code: string;
  name: string;
  category: 'LUAT' | 'NGHI_DINH' | 'THONG_TU' | 'QUY_CHE' | 'NGHI_QUYET' | 'QUYET_DINH' | 'CONG_VAN';
  agency: string;
  coreHighlights: string[];
  applicableScenarios: string[];
}

export interface MacroIndicatorBenchmark {
  indicator: string;
  latestTarget: string;
  safeThreshold: string;
  warningThreshold: string;
  controllingAgency: string;
  advisoryRule: string;
}

export interface AdvisoryRoleDefinition {
  id: string;
  name: string;
  description: string;
  systemPersona: string;
  fourStepProtocol: {
    step1: string; // Thực trạng & Bóc tách Dữ liệu (What Happened)
    step2: string; // Đánh giá Tác động Đa chiều & Căn cứ Pháp lý (So What)
    step3: string; // Dự báo Rủi ro & Diễn biến Tâm lý Dư luận (What If)
    step4: string; // Đề xuất Kịch bản Hành động & Thể thức Văn bản (Now What)
  };
}

export const VIETNAM_FINANCIAL_LEGAL_BASE: LegalFrameworkItem[] = [
  {
    id: 'quy_chuan_thong_tin_tich_cuc_nghi_dinh_376',
    code: 'Bộ Chuẩn RAG Tiêu chí Nhận định Thông tin Tích cực (NĐ 376/2026/NĐ-CP)',
    name: 'Quy chuẩn Bộ nhớ RAG: Tiêu chí Nhận định, Phân loại & Lan tỏa Thông tin Tích cực, Điểm sáng Truyền thông Báo chí ngành Tài chính (File tttichcuc.md & NĐ 376)',
    category: 'QUY_CHE',
    agency: 'Bộ Tài chính & Ban Chỉ đạo Truyền thông 376',
    coreHighlights: [
      'Trụ cột 1 - Kết quả, thành tựu thực chất & Số liệu kinh tế bứt phá: Thu ngân sách nhà nước đạt/vượt tiến độ; giải ngân đầu tư công bứt phá; kiểm soát tốt nợ công; duy trì thặng dư thương mại và thu hút nguồn vốn FDI kỷ lục.',
      'Trụ cột 2 - Thể chế, Cải cách hành chính & Giảm chi phí tuân thủ: Ban hành chính sách gia hạn/miễn/giảm thuế phí hỗ trợ người dân và doanh nghiệp; mở rộng hóa đơn điện tử máy tính tiền; Hải quan luồng xanh, thông quan nhanh; ứng dụng AI/Big Data vào quản lý thuế và kho bạc.',
      'Trụ cột 3 - Ổn định Thị trường Tài chính - Tiền tệ & Niềm tin Nhà đầu tư: Tháo gỡ nút thắt nâng hạng thị trường chứng khoán (giao dịch Non-Prefunding theo TT 68); phát hành thành công trái phiếu Chính phủ; ổn định thị trường TPDN và bảo hiểm.',
      'Trụ cột 4 - Truyền thông Chính sách Chủ động & Dư luận Đồng thuận: Trích dẫn đánh giá tích cực từ các tổ chức quốc tế (WB, IMF, ADB); bài viết báo chí đồng thuận cao với chính sách mới; sự ghi nhận của hiệp hội doanh nghiệp và chính quyền địa phương.',
      'Bộ tiêu chí Loại trừ Nghiêm ngặt (Strict Exclusion): Loại bỏ hoàn toàn (100%) các bài điểm tin sự kiện lẻ, vụ việc nợ thuế/xử phạt công khai cá nhân; loại bỏ bài viết giật tít tích cực nhưng có nội dung chứa ẩn ý băn khoăn hay phản ánh vướng mắc chính sách (policy friction); triệt tiêu tin tức có Risk Score >= 30 hoặc mang sắc thái tiêu cực/bearish.'
    ],
    applicableScenarios: [
      'Định hướng AI nhận định chuẩn xác sắc thái thông tin tích cực và điểm sáng truyền thông báo chí ngành Tài chính',
      'Truy xuất RAG đối soát các bài viết truyền thông đạt chuẩn Nghị định 376 để tôn vinh và nhân rộng',
      'Loại bỏ báo động giả và ngăn chặn các tin tức giật tít giả định (fake positive) xâm nhập hệ thống',
      'Cung cấp căn cứ lập Báo cáo Tham mưu Điểm sáng Truyền thông định kỳ gửi Lãnh đạo Bộ'
    ]
  },
  {
    id: 'quy_chuan_canh_bao_4_cap_risk_rag',
    code: 'Quy chuẩn Lượng hóa Rủi ro & Đồng bộ 4 Cấp Cảnh báo (NĐ 376)',
    name: 'Quy chuẩn Chỉ lối Phân loại AI & RAG: 4 Cấp độ Cảnh báo SOP (Xa, Sớm, Nhanh, Khẩn cấp) & Công thức Risk Score (docs/risk_score_formula_definition.md)',
    category: 'QUY_CHE',
    agency: 'Bộ Tài chính & Ban Chỉ đạo 376',
    coreHighlights: [
      'Công thức chuẩn: Risk_Score = min(100, (0.7*S + 0.3*D) * (1 + 0.3*V + 0.4*I)). S: Nghiêm trọng thể chế (0-50), D: Độ vênh cam kết-thực thi (0-20), V: Vận tốc lan truyền (0-1), I: Quy mô xã hội (0-1)',
      'Cấp 4 - Khẩn cấp (75-100đ, SOP-4): Khung giờ vàng 2-4h, xử lý tin đồn thị trường, tài liệu mật giả mạo, rung lắc tài chính, công điện hỏa tốc',
      'Cấp 3 - Cảnh báo trực tiếp/nhanh (60-74đ, SOP-3): Xử lý trong 12h, báo lớn đồng loạt phản ánh bất cập thuế/hải quan, ban hành công văn giải đáp trước 18h',
      'Cấp 2 - Cảnh báo sớm (40-59đ, SOP-2): Xử lý trong 24h, bài phân tích chuyên gia, kiến nghị hiệp hội, dự thảo tờ trình tháo gỡ điểm nghẽn chính sách',
      'Cấp 1 - Cảnh báo xa (20-39đ, SOP-1): Chu kỳ 48-72h, tín hiệu yếu chính sách mới, nghiên cứu xu hướng vĩ mô quốc tế, đưa vào danh sách giám sát tự động',
      'Khoảng trống thông tin (GAP): Cơ quan chuyên môn im lặng >24h khi báo chí liên tục đặt câu hỏi, cần khẩn trương phát ngôn làm rõ',
      'Giám sát thường quy (<20đ): Nghiệp vụ xử phạt định kỳ, buôn lậu nhỏ lẻ, không kích hoạt cảnh báo nhằm triệt tiêu báo động giả'
    ],
    applicableScenarios: [
      'Chỉ lối cho AI phân loại mức độ cảnh báo và đề xuất kịch bản can thiệp khẩn',
      'Đồng bộ hóa 4 cấp cảnh báo SOP (Cảnh báo xa, sớm, nhanh, khẩn cấp) trên Dashboard',
      'Truy xuất ngữ nghĩa RAG (Semantic Grounding) và đối soát trách nhiệm 34 đơn vị theo Nghị định 376/2026/NĐ-CP',
      'Lựa chọn thể thức văn bản xử lý: Công điện hỏa tốc, Thông cáo báo chí, Công văn giải đáp, Tờ trình tham mưu'
    ]
  },
  {
    id: 'legal_admin_docs',
    code: 'Quy định Thể thức Văn bản Hành chính',
    name: 'Quy định về công tác văn thư và thể thức văn bản hành chính công vụ (Nghị định 30/2020/NĐ-CP)',
    category: 'NGHI_DINH',
    agency: 'Chính phủ',
    coreHighlights: [
      'Quy định 29 loại văn bản hành chính (Công văn, Tờ trình, Thông cáo báo chí, Công điện, Quyết định, Kế hoạch, Báo cáo...)',
      'Công văn hỏa tốc: Xử lý trong ngày hoặc theo giờ khẩn cấp',
      'Tờ trình: Văn bản đề xuất cấp trên phê duyệt chủ trương, cơ chế, chính sách mới hoặc sửa đổi quy phạm pháp luật',
      'Thông cáo báo chí: Dùng phát ngôn chính thức ra công chúng, định hướng dư luận và ổn định tâm lý thị trường'
    ],
    applicableScenarios: [
      'Lựa chọn thể thức văn bản tham mưu chỉ đạo điều hành',
      'Xử lý khủng hoảng truyền thông hoặc tin đồn thị trường',
      'Trình dự thảo sửa đổi luật, nghị định, thông tư'
    ]
  },
  {
    id: 'luat_ql_thue_38',
    code: 'Luật Quản lý thuế số 38/2019/QH14 & Nghị định 126/2020/NĐ-CP',
    name: 'Luật Quản lý Thuế, Quy định Trách nhiệm Sàn TMĐT & Hoàn thuế',
    category: 'LUAT',
    agency: 'Quốc hội & Cục Thuế',
    coreHighlights: [
      'Quy định quyền hạn và trách nhiệm của Người nộp thuế và Cơ quan thuế các cấp',
      'Cổng thông tin điện tử dành cho Nhà cung cấp nước ngoài (Meta, Google, TikTok...) kê khai và nộp thuế xuyên biên giới',
      'Trách nhiệm của sàn thương mại điện tử trong nước và tổ chức trung gian thanh toán cung cấp thông tin và khấu trừ nộp thuế thay',
      'Quy trình cưỡng chế nợ thuế: Trích tiền gửi ngân hàng, phong tỏa tài khoản, tạm hoãn xuất cảnh đối với người đại diện pháp luật chây ỳ nợ thuế'
    ],
    applicableScenarios: [
      'Truy thu thuế sàn thương mại điện tử, livestream bán hàng, tiếp thị liên kết (affiliate)',
      'Xử lý cưỡng chế nợ thuế và tạm hoãn xuất cảnh',
      'Thanh tra, kiểm tra chống thất thu ngân sách nhà nước'
    ]
  },
  {
    id: 'luat_thue_vat_hoan_thue',
    code: 'Luật Thuế GTGT số 13/2008/QH12 & Thông tư 80/2021/TT-BTC',
    name: 'Quy chuẩn Khấu trừ và Hoàn thuế Giá trị gia tăng (VAT) Xuất khẩu',
    category: 'LUAT',
    agency: 'Quốc hội & Bộ Tài chính',
    coreHighlights: [
      'Phân loại hồ sơ hoàn thuế: "Hoàn thuế trước, kiểm tra sau" (trong 06 ngày làm việc) và "Kiểm tra trước, hoàn thuế sau" (trong 40 ngày làm việc)',
      'Điều kiện hoàn thuế xuất khẩu: Tờ khai hải quan thông quan, Hóa đơn điện tử hợp pháp, Hợp đồng ngoại thương và Chứng từ thanh toán qua ngân hàng',
      'Quy chế hậu kiểm hoàn thuế và trách nhiệm bồi thường nếu cơ quan thuế chậm trễ do lỗi chủ quan'
    ],
    applicableScenarios: [
      'Doanh nghiệp gỗ, nông sản, cao su phản ánh chậm trễ hoàn thuế VAT xuất khẩu',
      'Phát hiện chuỗi hóa đơn F1-Fn rủi ro cao chiếm đoạt tiền hoàn thuế từ NSNN',
      'Chỉ đạo gỡ khó cho cộng đồng doanh nghiệp xuất khẩu đúng quy định pháp luật'
    ]
  },
  {
    id: 'nd_123_tt_78_hddt',
    code: 'Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC',
    name: 'Quy định Hóa đơn điện tử & Hóa đơn khởi tạo từ máy tính tiền',
    category: 'NGHI_DINH',
    agency: 'Chính phủ & Cục Thuế',
    coreHighlights: [
      '100% bắt buộc áp dụng Hóa đơn điện tử trên toàn quốc từ 01/07/2022',
      'Bắt buộc phát hành Hóa đơn điện tử từng lần bán hàng đối với kinh doanh bán lẻ xăng dầu, vàng bạc, ăn uống',
      'Quy trình tra soát, hủy và lập hóa đơn điều chỉnh khi có sai sót; kết nối trực tiếp dữ liệu hóa đơn về Cục Thuế'
    ],
    applicableScenarios: [
      'Kiểm tra hóa đơn điện tử từng lần bán tại các cây xăng, doanh nghiệp kinh doanh vàng bạc đá quý',
      'Chống nạn mua bán hóa đơn khống, gian lận chi phí thuế TNDN',
      'Tích hợp hóa đơn điện tử máy tính tiền với chương trình "Hóa đơn may mắn"'
    ]
  },
  {
    id: 'giam_thue_vat_8_percent',
    code: 'Nghị quyết 142/2024/QH15 & Nghị định 72/2024/NĐ-CP',
    name: 'Chính sách Giảm 2% Thuế suất Thuế Giá trị gia tăng (VAT 8%)',
    category: 'NGHI_DINH',
    agency: 'Quốc hội & Chính phủ',
    coreHighlights: [
      'Giảm thuế suất GTGT từ 10% xuống 8% đối với các nhóm hàng hóa, dịch vụ đang áp dụng mức thuế suất 10%',
      'Loại trừ: Bất động sản, chứng khoán, bảo hiểm, ngân hàng, viễn thông, khai khoáng, hóa chất và sản phẩm chịu thuế TTĐB',
      'Thời hạn áp dụng: Kích cầu tiêu dùng nội địa, hỗ trợ doanh nghiệp và người dân phục hồi sản xuất kinh doanh'
    ],
    applicableScenarios: [
      'Doanh nghiệp thắc mắc mã ngành hàng hóa có được giảm thuế 8% hay không',
      'Lập hóa đơn sai thuế suất (xuất 10% thay vì 8% hoặc ngược lại) và phương án xử lý điều chỉnh',
      'Đánh giá tác động giảm thu ngân sách nhà nước và hiệu ứng kích cầu GDP'
    ]
  },
  {
    id: 'thue_toi_thieu_toan_cau',
    code: 'Nghị quyết 107/2023/QH15 & Quy tắc Trụ cột 2 OECD',
    name: 'Áp dụng Thuế Thu nhập Doanh nghiệp Bổ sung (Thuế Tối thiểu Toàn cầu - QDMTT)',
    category: 'NGHI_QUYET',
    agency: 'Quốc hội & Bộ Tài chính',
    coreHighlights: [
      'Áp dụng mức thuế suất thực tế tối thiểu 15% đối với các tập đoàn đa quốc gia có doanh thu hợp nhất từ 750 triệu EUR trở lên',
      'Cơ chế Thuế TNDN bổ sung tối thiểu nội địa đạt chuẩn (QDMTT) bảo vệ quyền đánh thuế của Việt Nam',
      'Thành lập Quỹ Hỗ trợ Đầu tư để duy trì sức hút FDI công nghệ cao, bán dẫn, chip và AI'
    ],
    applicableScenarios: [
      'Tham mưu chính sách giữ chân các tập đoàn FDI lớn (Samsung, LG, Intel, Foxconn...)',
      'Xây dựng tiêu chí hỗ trợ đầu tư trực tiếp phi thuế quan thay thế cho ưu đãi thuế truyền thống',
      'Báo cáo thu ngân sách từ thuế TNDN bổ sung'
    ]
  },
  {
    id: 'luat_hai_quan_54',
    code: 'Luật Hải quan số 54/2014/QH13 & Nghị định 08/2015/NĐ-CP (sửa đổi NĐ 59/2018)',
    name: 'Luật Hải quan & Quy chế Thủ tục Hải quan, Kiểm tra Giám sát',
    category: 'LUAT',
    agency: 'Quốc hội & Tổng cục Hải quan',
    coreHighlights: [
      'Vận hành Hệ thống thông quan tự động VNACCS/VCIS 24/7',
      'Cơ chế Phân luồng tờ khai dựa trên Quản lý Rủi ro: Luồng Xanh (Miễn kiểm tra chi tiết hồ sơ & thực tế, thông quan ngay), Luồng Vàng (Kiểm tra chi tiết hồ sơ chứng từ), Luồng Đỏ (Kiểm tra chi tiết hồ sơ và kiểm tra thực tế hàng hóa)',
      'Kiểm tra sau thông quan (Post-Clearance Audit - PCA): Thời hạn kiểm tra trong vòng 05 năm kể từ ngày đăng ký tờ khai',
      'Bảo hộ quyền sở hữu trí tuệ tại biên giới và kiểm soát chống hàng giả, hàng cấm'
    ],
    applicableScenarios: [
      'Ùn tắc hàng hóa tại cửa khẩu đường bộ, cảng biển, kiến nghị thông quan nhanh hàng nông sản',
      'Thủ tục phân luồng tờ khai luồng đỏ đối với doanh nghiệp có độ rủi ro tuân thủ cao',
      'Xử lý tranh chấp kết luận kiểm tra sau thông quan và ấn định thuế hải quan'
    ]
  },
  {
    id: 'luat_thue_xnk_107',
    code: 'Luật Thuế XNK số 107/2016/QH13 & Nghị định 134/2016/NĐ-CP (sửa đổi NĐ 18/2021)',
    name: 'Biểu thuế Xuất nhập khẩu Ưu đãi, Quy tắc Xuất xứ (C/O) & Miễn thuế Gia công',
    category: 'LUAT',
    agency: 'Quốc hội & Tổng cục Hải quan',
    coreHighlights: [
      'Biểu thuế xuất khẩu, thuế nhập khẩu ưu đãi đặc biệt theo các hiệp định thương mại tự do (EVFTA, CPTPP, RCEP, VKFTA, ACFTA...)',
      'Quy tắc xuất xứ hàng hóa (C/O Form EUR.1, CPTPP, AK, AJ...): Điều kiện để hưởng thuế suất thuế nhập khẩu 0%',
      'Quy định Miễn thuế nhập khẩu đối với nguyên liệu, vật tư nhập khẩu để gia công, sản xuất hàng hóa xuất khẩu (SXXK)',
      'Xác định trước mã số HS, xuất xứ, trị giá hải quan để tạo thuận lợi thương mại'
    ],
    applicableScenarios: [
      'Kiểm tra gian lận xuất xứ, mượn đường Việt Nam để lẩn tránh phòng vệ thương mại (transshipment)',
      'Báo cáo quyết toán tình hình sử dụng nguyên phụ liệu nhập khẩu gia công, SXXK',
      'Khiếu nại phân loại mã số hàng hóa (HS Code) và áp thuế chống bán phá giá'
    ]
  },
  {
    id: 'mot_cua_quoc_gia_nsw',
    code: 'Cơ chế Một cửa Quốc gia (NSW) & Một cửa ASEAN (ASW)',
    name: 'Hệ thống Một cửa Quốc gia và Cải cách Kiểm tra Chuyên ngành',
    category: 'QUY_CHE',
    agency: 'Chính phủ, Bộ Tài chính & Tổng cục Hải quan',
    coreHighlights: [
      'Tích hợp 250+ thủ tục hành chính công của 13 Bộ, ngành trên Cổng Thông tin Một cửa Quốc gia',
      'Trao đổi Giấy chứng nhận xuất xứ điện tử (e-C/O Form D) và tờ khai hải quan điện tử qua Một cửa ASEAN',
      'Cắt giảm, đơn giản hóa danh mục hàng hóa phải kiểm tra chuyên ngành tại khâu thông quan, chuyển mạnh sang hậu kiểm'
    ],
    applicableScenarios: [
      'Cải cách thủ tục hành chính, rút ngắn thời gian giải phóng hàng tại cảng Cát Lái, Hải Phòng, Cái Mép',
      'Xử lý nghẽn mạng hoặc chậm cấp phép điện tử giữa các Bộ chuyên ngành',
      'Đánh giá chỉ số thuận lợi hóa thương mại quốc gia (Logistics Performance Index)'
    ]
  },
  {
    id: 'luat_ck_2019',
    code: 'Luật Chứng khoán số 54/2019/QH14 & Thông tư 68/2024/TT-BTC',
    name: 'Luật Chứng khoán 2019 và Quy định giao dịch không ký quỹ (Non-Prefunding)',
    category: 'LUAT',
    agency: 'Quốc hội & Bộ Tài chính',
    coreHighlights: [
      'Chuẩn hóa điều kiện niêm yết, công bố thông tin minh bạch và bảo vệ nhà đầu tư',
      'Thông tư 68/2024/TT-BTC gỡ nút thắt ký quỹ 100% tiền trước giao dịch (Non-Prefunding) cho NĐT nước ngoài',
      'Mục tiêu trọng tâm: Nâng hạng thị trường chứng khoán Việt Nam từ Cận biên lên Mới nổi (FTSE Russell & MSCI)'
    ],
    applicableScenarios: [
      'Nghẽn lệnh hệ thống giao dịch, sự cố công nghệ KRX',
      'Biến động bất thường của chỉ số VN-Index, dòng vốn ngoại rút ròng',
      'Xử lý thao túng thị trường chứng khoán, tin đồn room ngoại'
    ]
  },
  {
    id: 'nd_65_nd_08_tpdn',
    code: 'Nghị định 65/2022/NĐ-CP & Nghị định 08/2023/NĐ-CP',
    name: 'Quy định về chào bán, giao dịch trái phiếu doanh nghiệp riêng lẻ',
    category: 'NGHI_DINH',
    agency: 'Chính phủ & Bộ Tài chính',
    coreHighlights: [
      'Chuẩn hóa điều kiện nhà đầu tư chứng khoán chuyên nghiệp và xếp hạng tín nhiệm bắt buộc',
      'Quy chế hoãn, giãn nợ, thanh toán gốc lãi bằng tài sản khác và đàm phán trái chủ',
      'Vận hành Sàn giao dịch Trái phiếu Doanh nghiệp riêng lẻ tập trung tại HNX'
    ],
    applicableScenarios: [
      'Áp lực đáo hạn trái phiếu doanh nghiệp bất động sản',
      'Chậm trả gốc lãi trái phiếu, đàm phán cơ cấu nợ trái chủ',
      'Kiểm soát rủi ro thanh khoản hệ thống tín dụng và ngân hàng'
    ]
  },
  {
    id: 'nd_24_vang',
    code: 'Nghị định 24/2012/NĐ-CP (Đang sửa đổi)',
    name: 'Quản lý hoạt động kinh doanh vàng',
    category: 'NGHI_DINH',
    agency: 'Chính phủ, NHNN & Bộ Tài chính',
    coreHighlights: [
      'Nhà nước độc quyền sản xuất vàng miếng SJC',
      'Chỉ đạo của Thủ tướng: Xóa bỏ chênh lệch bất hợp lý giữa giá vàng trong nước và thế giới',
      'Bắt buộc áp dụng hóa đơn điện tử từng lần mua bán vàng và kiểm tra nguồn gốc vàng'
    ],
    applicableScenarios: [
      'Giá vàng miếng SJC biến động mạnh, chênh lệch giá thế giới cao',
      'Thanh tra liên ngành (NHNN, Bộ Tài chính, Bộ Công an) các doanh nghiệp kinh doanh vàng',
      'Tham mưu sửa đổi Nghị định 24 để tăng cung vàng và bình ổn thị trường'
    ]
  },
  {
    id: 'luat_ngan_sach_83',
    code: 'Luật Ngân sách Nhà nước số 83/2015/QH13',
    name: 'Quản lý thu, chi, bội chi và nợ công ngân sách quốc gia',
    category: 'LUAT',
    agency: 'Quốc hội & Bộ Tài chính',
    coreHighlights: [
      'Kỷ luật kỷ cương tài khóa, kiểm soát bội chi ngân sách dưới ngưỡng 4% GDP',
      'Giải ngân vốn đầu tư công, tạm ứng và thanh quyết toán qua Kho bạc Nhà nước',
      'Quản lý an toàn nợ công và trả nợ trong hạn mức trần Quốc hội cho phép'
    ],
    applicableScenarios: [
      'Tiến độ giải ngân vốn đầu tư công chậm tại các bộ, ngành, địa phương',
      'Đề xuất gói miễn, giảm, gia hạn thuế, phí, tiền thuê đất hỗ trợ doanh nghiệp',
      'Báo cáo dự toán và quyết toán ngân sách nhà nước định kỳ'
    ]
  },
  {
    id: 'nghi_dinh_376_mof',
    code: 'Nghị định số 376/2026/NĐ-CP của Chính phủ',
    name: 'Quy định Chức năng, Nhiệm vụ, Quyền hạn và Cơ cấu Tổ chức của Bộ Tài chính (34 Đơn vị & 5 Mảng Thẩm quyền Mới)',
    category: 'NGHI_DINH',
    agency: 'Chính phủ & Bộ Tài chính',
    coreHighlights: [
      'Cơ cấu tổ chức chính thức gồm 34 cơ quan, đơn vị trực thuộc (Khối Vụ tham mưu quản lý nhà nước 1-11, Khối Cục/Ủy ban/Cơ quan đặc thù 12-31, Khối Đơn vị sự nghiệp công lập 32-34)',
      'Tích hợp 5 lĩnh vực thẩm quyền mới tiếp nhận: (1) Đấu thầu mua sắm công & Dự án PPP (Cục Quản lý đấu thầu); (2) Quản lý dòng vốn FDI & Xúc tiến đầu tư (Cục Đầu tư nước ngoài); (3) Thống kê vĩ mô, điều tra kinh tế, công bố chỉ số CPI & GDP (Cục Thống kê); (4) Quản lý Quỹ BHXH, BHYT, BHTN quốc gia (Bảo hiểm xã hội Việt Nam); (5) Quản lý Quy hoạch tổng thể quốc gia và chiến lược không gian phát triển (Vụ Quản lý quy hoạch)',
      'Quy chuẩn phân công đơn vị chủ trì (Lead Agency) và đơn vị phối hợp (Cooperating Agencies) trong xử lý phản ánh báo chí và tham mưu chỉ đạo',
      'Bảo đảm sự gắn kết hữu cơ giữa tài khóa - ngân sách - thuế - hải quan - kho bạc - chứng khoán với các động lực tăng trưởng mới'
    ],
    applicableScenarios: [
      'Xác định đơn vị chủ trì và thẩm quyền xử lý theo đúng cơ cấu 34 đơn vị của Nghị định 376/2026/NĐ-CP',
      'Tham mưu văn bản chỉ đạo điều hành đối với 5 mảng thẩm quyền mới (Đấu thầu/PPP, FDI, Thống kê CPI/GDP, BHXH, Quy hoạch)',
      'Giải đáp, tư vấn thẩm quyền chức năng của từng Cục, Vụ, Ủy ban trực thuộc Bộ Tài chính',
      'Dự thảo Tờ trình, Thông cáo báo chí, Công văn hỏa tốc chỉ đạo phân công đầu mối công vụ'
    ]
  }
];

export const MACRO_FINANCIAL_BENCHMARKS: MacroIndicatorBenchmark[] = [
  {
    indicator: 'Tăng trưởng GDP, Mục tiêu 2 con số & Kinh tế Quý III',
    latestTarget: 'GDP cả năm 6.5 - 7.0%, Kịch bản quý III/quý 3 bứt phá 7.0 - 7.5%, hướng tới mục tiêu tăng trưởng 2 con số dài hạn',
    safeThreshold: 'Tăng trưởng GDP quý > 6.5%, Đổi mới mô hình tăng trưởng dựa trên KHCN, năng suất lao động và kinh tế số',
    warningThreshold: 'Tăng trưởng GDP quý < 5.8% hoặc động lực xuất khẩu/sản xuất công nghiệp suy giảm',
    controllingAgency: 'Chính phủ, Bộ Tài chính & Bộ Kế hoạch và Đầu tư',
    advisoryRule: 'Đẩy mạnh chính sách tài khóa mở rộng có trọng tâm, tháo gỡ điểm nghẽn đầu tư công và cải cách thể chế để tái cơ cấu mô hình tăng trưởng'
  },
  {
    indicator: 'Tăng trưởng GDP & Bội chi Ngân sách',
    latestTarget: 'GDP 6.5 - 7.0%, Bội chi NSNN < 3.6 - 3.8% GDP',
    safeThreshold: 'Bội chi < 4.0% GDP, Nợ công < 60% GDP',
    warningThreshold: 'Bội chi > 4.5% GDP hoặc Nợ công vượt 60% GDP',
    controllingAgency: 'Bộ Tài chính & Bộ Kế hoạch Đầu tư',
    advisoryRule: 'Cân đối linh hoạt chính sách tài khóa mở rộng có trọng tâm, kết hợp hài hòa với chính sách tiền tệ'
  },
  {
    indicator: 'Thanh khoản & Chỉ số Thị trường Chứng khoán (VN-Index)',
    latestTarget: 'Quy mô vốn hóa > 100% GDP, Giá trị giao dịch 20.000 - 30.000 tỷ/phiên',
    safeThreshold: 'Biến động phiên +/- 1.5%, Biên độ margin hệ thống an toàn (<60% vốn CSH CTCK)',
    warningThreshold: 'VN-Index giảm > 3.0% kèm thanh khoản đột biến, rủi ro bán giải chấp margin (force-sell)',
    controllingAgency: 'Ủy ban Chứng khoán Nhà nước (UBCKNN)',
    advisoryRule: 'Khẩn trương rà soát hệ thống KRX, giám sát chặt các mã có giao dịch bất thường, công bố thông tin trấn an kịp thời'
  },
  {
    indicator: 'Tỷ giá USD/VND & Dự trữ Ngoại hối',
    latestTarget: 'Biến động tỷ giá cả năm trong biên độ 2.5 - 3.5%',
    safeThreshold: 'Chênh lệch tỷ giá tự do và liên ngân hàng < 1.0%',
    warningThreshold: 'Tỷ giá mất giá > 4.5% hoặc tỷ giá tự do vượt đỉnh lịch sử',
    controllingAgency: 'Ngân hàng Nhà nước & Bộ Tài chính',
    advisoryRule: 'Theo dõi tác động tới nợ công bằng ngoại tệ và nghĩa vụ trả nợ nước ngoài của Chính phủ'
  },
  {
    indicator: 'Tiến độ Giải ngân Vốn Đầu tư Công',
    latestTarget: 'Đạt tối thiểu 95% kế hoạch Thủ tướng giao',
    safeThreshold: 'Tốc độ giải ngân bình quân > 8% mỗi tháng trong 6 tháng cuối năm',
    warningThreshold: 'Giải ngân lũy kế chậm hơn 10% so với cùng kỳ năm trước',
    controllingAgency: 'Bộ Tài chính (Kho bạc Nhà nước)',
    advisoryRule: 'Thành lập các Tổ công tác kiểm tra hiện trường, điều chuyển vốn từ dự án chậm sang dự án có khả năng hấp thụ tốt'
  }
];

export const ADVISORY_ROLES: AdvisoryRoleDefinition[] = [
  {
    id: 'mof_chief_counselor',
    name: 'Trưởng Cố Vấn Tham Mưu Chiến Lược (Executive Advisor)',
    description: 'Chuyên gia cao cấp tham mưu trực tiếp Lãnh đạo Bộ Tài chính về điều hành vĩ mô, pháp lý và phản ứng chính sách',
    systemPersona: `Bạn là Chuyên gia Cao cấp kiêm Trưởng Cố vấn Tham mưu Trực tiếp cho Lãnh đạo Bộ Tài chính Việt Nam.
Thông tin Nhân sự & Lãnh đạo Bộ Tài chính cập nhật theo thời gian thực:
- **Bộ trưởng Bộ Tài chính Việt Nam**: **Ngô Văn Tuấn** (Bộ trưởng hiện nhiệm).
- **Phó Thủ tướng Chính phủ (Nguyên Bộ trưởng Bộ Tài chính)**: Hồ Đức Phước (Hồ Đức Phớc).
- **Thứ trưởng Bộ Tài chính**: Nguyễn Đức Chi, Nguyễn Đức Tâm, Bùi Văn Khang, Lê Tấn Cận.
- **Chủ tịch Ủy ban Chứng khoán Nhà nước (UBCKNN)**: Vũ Thị Chân Phương.
- **Cục trưởng Cục Thuế**: Mai Xuân Thành.
- **Tổng cục trưởng Tổng cục Hải quan**: Nguyễn Văn Cẩn.

Phong thái: Chuẩn mực, khách quan, sâu sắc, nhạy bén chính trị và linh hoạt theo từng tính chất công việc.
Phương pháp Tư duy Chuỗi Suy Luận 4 Bước (Chain-of-Thought):
1. BƯỚC 1: NHẬN DIỆN THẨM QUYỀN & CĂN CỨ PHÁP LÝ (Jurisdiction & Legal Basis).
2. BƯỚC 2: CÂN BẰNG KỶ CƯƠNG TÀI KHÓA & NGUYỆN VỌNG DÂN/DN (Fiscal Discipline vs Public Needs).
3. BƯỚC 3: ĐÁNH GIÁ ĐƯỜNG TRUYỀN RỦI RO & HỆ QUẢ LIÊN NGÀNH (Impact Chain & Contagion).
4. BƯỚC 4: KẾ HOẠCH HÀNH ĐỘNG TÁC CHIẾN (Action Plan: 24h / 7 ngày / Trung hạn).`,
    fourStepProtocol: {
      step1: '1. CĂN CỨ PHÁP LÝ & THẨM QUYỀN: Xác định rõ đơn vị thụ lý (Thuế, Hải quan, Kho bạc, UBCKNN...) và văn bản quy phạm pháp luật điều chỉnh.',
      step2: '2. BÓC TÁCH NGUYỆN VỌNG DÂN/DN VS KỶ CƯƠNG TÀI KHÓA: Phân tích thấu đáo bức xúc thực tế của doanh nghiệp/người dân đặt trong mục tiêu vĩ mô.',
      step3: '3. ĐƯỜNG TRUYỀN RỦI RO & LAN TỎA LIÊN NGÀNH: Dự báo nguy cơ lây lan sang niềm tin thị trường, dòng vốn đầu tư và an toàn tài khóa.',
      step4: '4. KẾ HOẠCH HÀNH ĐỘNG TÁC CHIẾN: Đề xuất giải pháp ngắn hạn (trong 24h) và dài hạn (sửa đổi thể chế/thông tư).'
    }
  },
  {
    id: 'legal_compliance_expert',
    name: 'Chuyên Gia Pháp Chế & Quy Chuẩn Thể Chế (Legal & Regulatory)',
    description: 'Soi xét căn cứ thẩm quyền, tính hợp hiến/hợp pháp, đối chiếu các Nghị định, Thông tư và Luật chuyên ngành',
    systemPersona: `Bạn là Chuyên gia Cao cấp về Pháp chế và Thể chế Tài chính thuộc Bộ Tài chính.
Trọng tâm: Soi xét kỹ lưỡng tính hợp pháp, thẩm quyền ban hành, quy trình thủ tục hành chính, đối chiếu các Luật Thuế, Luật Chứng khoán, Luật Hải quan, Luật Quản lý Nợ công và các Nghị định hướng dẫn.
Phương pháp: Luôn đưa ra căn cứ điều khoản cụ thể, phân định ranh giới giữa thẩm quyền của Bộ trưởng, Thủ tướng Chính phủ và Quốc hội.`,
    fourStepProtocol: {
      step1: '1. RÀ SOÁT CĂN CỨ PHÁP LÝ HIỆN HÀNH: Trích dẫn chính xác số hiệu Luật, Nghị định, Thông tư có hiệu lực.',
      step2: '2. XÁC ĐỊNH KHOẢNG TRỐNG HOẶC XUNG ĐỘT PHÁP LUẬT: Chỉ ra các điểm nghẽn, quy định chưa rõ ràng hoặc chồng chéo giữa các văn bản.',
      step3: '3. ĐÁNH GIÁ TÍNH KHẢ THI & RỦI RO PHÁP LÝ: Đánh giá nguy cơ khiếu nại, phản ứng của đối tượng chịu tác động hoặc tranh chấp quốc tế.',
      step4: '4. ĐỀ XUẤT PHƯƠNG ÁN XỬ LÝ THỂ CHẾ: Kiến nghị ban hành Thông tư sửa đổi, Công văn hướng dẫn nghiệp vụ hoặc Tờ trình Chính phủ.'
    }
  },
  {
    id: 'crisis_communications_strategist',
    name: 'Chuyên Gia Phát Ngôn & Xử Lý Khủng Hoảng (Crisis & Media Comms)',
    description: 'Chuyên sâu về định hướng dư luận, xử lý tin đồn thất thiệt, bảo vệ uy tín ngành và soạn thông cáo báo chí khẩn cấp',
    systemPersona: `Bạn là Chuyên gia Chiến lược về Truyền thông Chính sách và Xử lý Khủng hoảng của Bộ Tài chính.
Trọng tâm: Phân tích tốc độ lan truyền của tin giả/tin đồn, nhận diện tâm lý bức xúc của dư luận, xây dựng thông điệp cốt lõi (Core Message) và lập kịch bản phát ngôn đính chính chủ động.`,
    fourStepProtocol: {
      step1: '1. ĐỊNH VỊ ĐIỂM NÓNG & TỐC ĐỘ LAN TRUYỀN: Xác định nguồn tin gốc, mức độ viral, từ khóa tiêu cực và tính chất thông tin.',
      step2: '2. BÓC TÁCH NGUYÊN NHÂN BỨC XÚC DƯ LUẬN: Xác định rõ người dân/doanh nghiệp đang hiểu lầm hay bất an ở khâu nào.',
      step3: '3. DỰ BÁO KỊCH BẢN XẤU NHẤT (Worst-case Scenario): Dự báo tác động tới uy tín Lãnh đạo Bộ và niềm tin của thị trường nếu im lặng.',
      step4: '4. THÔNG ĐIỆP CỐT LÕI & KỊCH BẢN PHÁT NGÔN 24H: Cung cấp dự thảo Thông cáo báo chí, phân công kênh phát ngôn và kế hoạch bơm tin tích cực.'
    }
  },
  {
    id: 'macro_fiscal_data_analyst',
    name: 'Chuyên Gia Dữ Liệu Vĩ Mô & Kế Hoạch Tài Khóa (Fiscal & Macro Data)',
    description: 'Chuyên sâu về định lượng số liệu thu chi NSNN, bội chi, giải ngân vốn đầu tư công, nợ công và mô hình tăng trưởng GDP',
    systemPersona: `Bạn là Chuyên gia Phân tích Dữ liệu Vĩ mô & Kế hoạch Tài khóa của Bộ Tài chính.
Trọng tâm: Đánh giá định lượng số liệu thu chi NSNN, tiến độ giải ngân vốn đầu tư công, chỉ số CPI, tỷ lệ nợ công/GDP, áp lực thanh khoản trái phiếu và diễn biến dòng vốn đầu tư.`,
    fourStepProtocol: {
      step1: '1. THỐNG KÊ SỐ LIỆU ĐỊNH LƯỢNG & BENCHMARK: So sánh số liệu thực tế với chỉ tiêu Quốc hội giao và cùng kỳ các năm.',
      step2: '2. PHÂN TÍCH ĐỘNG LỰC & ĐIỂM NGHẼN DÒNG TIỀN: Bóc tách nguyên nhân tăng/giảm thu, chậm giải ngân hoặc áp lực dòng vốn ngoại.',
      step3: '3. MÔ PHỎNG KỊCH BẢN DỰ BÁO (Stress-testing): Chạy các kịch bản Cơ sở / Lạc quan / Thận trọng về tăng trưởng và cân đối ngân sách.',
      step4: '4. KHUYẾN NGHỊ ĐIỀU HÀNH TÀI KHÓA: Đề xuất gói điều chuyển vốn, giải pháp kích cầu hoặc điều hành linh hoạt chính sách giá.'
    }
  }
];

export const SMART_ADVISORY_PROMPTS = [
  {
    category: 'Chẩn đoán Sắc thái & Khoảng trống Truyền thông',
    items: [
      {
        icon: '🎯',
        title: 'Chẩn đoán Sắc thái: Vì sao Tiêu cực/Tích cực & Kế hoạch Tác chiến',
        prompt: 'Hãy chẩn đoán sâu sắc thái các tin tức vừa quét được: Bóc tách rõ nguyên nhân VÌ SAO TIÊU CỰC (nguy cơ, bức xúc), VÌ SAO TÍCH CỰC (điểm sáng chính sách). Đề xuất kế hoạch hành động cụ thể để phát huy điểm mạnh và dập tắt rủi ro.',
        action: 'deep_dive' as const,
        actionLabel: 'Xem Chẩn đoán & Kế hoạch Tác chiến'
      },
      {
        icon: '📢',
        title: 'Khoảng trống Truyền thông: Dân & DN băn khoăn + Kế hoạch Bơm tin bài',
        prompt: 'Rà soát các Khoảng trống Truyền thông (Media Gap): Nhận diện các vấn đề người dân, DN đang băn khoăn nhưng chưa được giải thích chính sách đầy đủ. Tư vấn cụ thể xem người dân/DN cần làm gì ngay và lập kế hoạch chủ động bơm tin bài định hướng cho Bộ Tài chính.',
        action: 'draft_statement' as const,
        actionLabel: 'Soạn Chiến dịch Bơm tin bài'
      }
    ]
  },
  {
    category: 'Vĩ mô & Điều hành Lãnh đạo',
    items: [
      {
        icon: '📊',
        title: 'Tham mưu Kịch bản Tăng trưởng GDP, Mô hình Kinh tế & Quý III',
        prompt: 'Phân tích tổng hợp các bài báo về tăng trưởng kinh tế, tăng trưởng GDP, kịch bản tăng trưởng 2 con số, đổi mới mô hình tăng trưởng và tình hình kinh tế quý III (quý 3). Tham mưu các giải pháp tài khóa, đầu tư công và cải cách thể chế thúc đẩy tăng trưởng.',
        action: 'deep_dive' as const,
        actionLabel: 'Tham khảo AI'
      },
      {
        icon: '🏛️',
        title: 'Báo cáo Tổng hợp Nhanh & Tham mưu Lãnh đạo Bộ (Toàn diện)',
        prompt: 'Hãy lập Báo cáo Tham mưu Tổng hợp 4 Bước cho Lãnh đạo Bộ Tài chính về toàn bộ diễn biến tin tức, chỉ số tâm lý và các điểm nóng thị trường vừa quét được trong phiên hôm nay.',
        action: 'deep_dive' as const,
        actionLabel: 'Tham khảo AI'
      },
      {
        icon: '📰',
        title: 'Thống kê & Đánh giá Nguồn Báo chí Tài chính (24h)',
        prompt: 'Thống kê, tổng hợp tin bài của Báo Đầu tư và các báo chuyên ngành tài chính trong 24 giờ qua; đánh giá tính chất tin tức và áp dụng quy tắc quản lý nhà nước để tham mưu điều hành.',
        action: 'deep_dive' as const,
        actionLabel: 'Tham khảo AI'
      }
    ]
  },
  {
    category: 'Thị trường Vốn & Đầu tư',
    items: [
      {
        icon: '📈',
        title: 'Phân tích Biến động VN-Index & Tiến trình Nâng hạng',
        prompt: 'Phân tích các bài viết về thị trường chứng khoán, động thái khối ngoại và tiến độ gỡ nút thắt nâng hạng thị trường (Thông tư 68/2024/TT-BTC). Đề xuất tham mưu chỉ đạo UBCKNN.',
        action: 'draft_statement' as const,
        actionLabel: 'Tham khảo AI'
      },
      {
        icon: '💳',
        title: 'Rà soát Áp lực Đáo hạn Trái phiếu Doanh nghiệp',
        prompt: 'Đánh giá diễn biến thị trường Trái phiếu Doanh nghiệp (Nghị định 08/NĐ 65) và áp lực thanh khoản của các doanh nghiệp bất động sản trong quý này. Tham mưu giải pháp an toàn hệ thống.',
        action: 'deep_dive' as const,
        actionLabel: 'Tham khảo AI'
      }
    ]
  },
  {
    category: 'Thuế, Vàng & Xử lý Khủng hoảng',
    items: [
      {
        icon: '⚡',
        title: 'Xử lý Tin đồn Thất thiệt & Khủng hoảng Truyền thông',
        prompt: 'Đang xuất hiện tin đồn thất thiệt ảnh hưởng tiêu cực đến tâm lý thị trường. Áp dụng quy chế phát ngôn của Bộ để tham mưu phương án phát ngôn đính chính khẩn cấp.',
        action: 'draft_statement' as const,
        actionLabel: 'Soạn Thông cáo Đính chính AI'
      },
      {
        icon: '🪙',
        title: 'Tham mưu Bình ổn Thị trường Vàng & Hóa đơn Điện tử',
        prompt: 'Đánh giá các phản ánh về thị trường vàng, hóa đơn điện tử từng lần mua bán vàng và đề xuất sửa đổi Nghị định 24/2012/NĐ-CP để quản lý hiệu quả.',
        action: 'trigger_config' as const,
        actionLabel: 'Cấu hình Cảnh báo Rủi ro Vàng'
      }
    ]
  }
];
