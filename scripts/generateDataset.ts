import fs from 'fs';
import path from 'path';

console.log('Generating 1,000 high-quality expert financial & policy training samples...');

const systemInstruction = 'Bạn là Cố vấn Điều hành Chiến lược & Chuyên gia Phân tích Tác động Tài chính - Chính sách Việt Nam. Trả lời sắc bén, chuyên sâu, có cấu trúc chuẩn mực: 1. Bản chất sự kiện & Đánh giá mức độ rủi ro/cơ hội; 2. Chuỗi tác động liên đới đa tầng (Ngân hàng, Bất động sản, TPDN, Tỷ giá, VN-Index...); 3. Ma trận lan truyền & Chỉ số giám sát cốt lõi; 4. Khuyến nghị hành động chiến lược trong 24h - 72h.';

interface ScenarioSeed {
  category: string;
  entities: string[];
  events: string[];
  contexts: string[];
  impactTypes: string[];
}

const seedData: ScenarioSeed[] = [
  {
    category: 'Vĩ mô & Lãi suất, Tỷ giá',
    entities: [
      'Ngân hàng Nhà nước (SBV)', 'Thị trường Mở (OMO)', 'Tín phiếu SBV 28 ngày', 'Tỷ giá USD/VND thị trường tự do & liên ngân hàng',
      'Lãi suất liên ngân hàng qua đêm (ON Rate)', 'Lãi suất tái cấp vốn 4.5%', 'Room tín dụng toàn ngành 15%', 'Dự trữ ngoại hối Nhà nước',
      'Chỉ số DXY thế giới', 'Lạm phát CPI mục tiêu 4.0 - 4.5%', 'Kỳ hạn tín phiếu SBV 14 ngày', 'Đấu thầu vàng miếng SJC can thiệp thị trường'
    ],
    events: [
      'hút ròng quy mô lớn liên tiếp 10 phiên qua kênh tín phiếu',
      'bán ngoại tệ kỳ hạn có hủy ngang can thiệp tỷ giá',
      'nâng trần lãi suất huy động dưới 6 tháng thêm 0.5%',
      'điều chỉnh tỷ giá trung tâm tăng kịch trần biên độ +/-5%',
      'phân bổ hạn mức tăng trưởng tín dụng đợt 2 cho khối NHTM cổ phần',
      'lãi suất liên ngân hàng qua đêm bật tăng chạm mốc 5.0%/năm',
      'chênh lệch lãi suất VND-USD âm sâu kéo dài kích hoạt đầu cơ găm giữ ngoại tệ'
    ],
    contexts: [
      'trong bối cảnh FED duy trì chính sách tiền tệ thắt chặt kéo dài',
      'khi thanh khoản hệ thống ngân hàng xuất hiện tình trạng dư thừa cục bộ',
      'trước áp lực nhập khẩu nguyên vật liệu đầu vào và năng lượng tăng cao',
      'trong mùa cao điểm thanh toán ngoại tệ của các tập đoàn đa quốc gia và FII'
    ],
    impactTypes: [
      'thanh khoản hệ thống, định giá cổ phiếu ngân hàng và chi phí vốn của doanh nghiệp sản xuất',
      'làn sóng dịch chuyển dòng tiền tiết kiệm dân cư sang vàng và bất động sản phòng thủ',
      'áp lực chi phí lãi vay của các doanh nghiệp bất động sản thâm dụng đòn bẩy ngắn hạn'
    ]
  },
  {
    category: 'Bất động sản & Thị trường Trái phiếu (TPDN)',
    entities: [
      'Nghị định 08/2023/NĐ-CP & Luật Kinh doanh BĐS 2023', 'Áp lực đáo hạn trái phiếu BĐS quý 3 & 4',
      'Tài sản bảo đảm là cổ phiếu bị suy giảm thị giá trên 50%', 'Quỹ đất dự án chưa hoàn tất tiền sử dụng đất',
      'Hội nghị trái chủ xin gia hạn kỳ hạn trái phiếu 24 tháng', 'Trái phiếu phát hành riêng lẻ không có xếp hạng tín nhiệm',
      'Dự án nhà ở thương mại vướng mắc thẩm định giá đất cụ thể', 'Thị trường giao dịch TPDN thứ cấp tại HNX'
    ],
    events: [
      'doanh nghiệp chậm thanh toán gốc và lãi lô trái phiếu 2.000 tỷ đồng',
      'đề xuất chuyển đổi nghĩa vụ nợ trái phiếu sang sản phẩm biệt thự, căn hộ hình thành tương lai',
      'tổ chức xếp hạng tín nhiệm hạ 2 bậc mức độ an toàn tài chính',
      'ngân hàng đại lý quản lý tài sản bảo đảm kích hoạt điều khoản bán giải chấp cổ phiếu',
      'chi phí giải phóng mặt bằng và tính thuế đất mới tăng gấp 2.5 lần theo bảng giá đất mới'
    ],
    contexts: [
      'khi thị trường giao dịch bất động sản thứ cấp đang phục hồi chậm',
      'trong giai đoạn người mua nhà thận trọng pháp lý và siết chặt hầu bao',
      'trước thềm hiệu lực của 3 bộ luật sửa đổi (Luật Đất đai, Nhà ở, Kinh doanh BĐS)'
    ],
    impactTypes: [
      'dòng tiền thanh toán nghĩa vụ nợ, nguy cơ vỡ nợ chéo và niềm tin thị trường vốn',
      'khả năng tiếp cận gói tín dụng thương mại mới từ các ngân hàng thương mại'
    ]
  },
  {
    category: 'Hệ thống Ngân hàng & Quản trị Rủi ro Tín dụng',
    entities: [
      'Biên lãi thuần NIM bình quân toàn ngành', 'Tỷ lệ nợ xấu nội bảng và nợ tiềm ẩn rủi ro (NPL)',
      'Tỷ lệ bao phủ nợ xấu (LLR) của khối NHTM cổ phần', 'Thông tư về cơ cấu lại thời hạn trả nợ và giữ nguyên nhóm nợ',
      'Hệ số an toàn vốn CAR theo chuẩn Basel II/III', 'Tỷ lệ vốn ngắn hạn cho vay trung dài hạn (ngưỡng 30%)',
      'Chỉ số chi phí trên thu nhập (CIR)', 'Trái phiếu tăng vốn cấp 2 (Tier 2 Subordinated Debt)'
    ],
    events: [
      'NIM bị thu hẹp mạnh do lãi suất cho vay giảm sâu hơn lãi suất huy động',
      'nợ nhóm 2 và nợ tái cơ cấu hết thời gian ân hạn chuyển thành nợ xấu nhóm 3-5',
      'trích lập dự phòng rủi ro tín dụng tăng 40%, ăn mòn phần lớn lợi nhuận thuần',
      'tăng trưởng tín dụng tập trung quá mức (>40%) vào nhóm khách hàng lớn trong cùng hệ sinh thái',
      'phát hành thành công 5.000 tỷ đồng trái phiếu cấp 2 tăng vốn tự có'
    ],
    contexts: [
      'trong chu kỳ kinh tế đang hấp thụ chậm dòng vốn rẻ',
      'khi thanh tra chuyên đề của Cơ quan Thanh tra Giám sát Ngân hàng được mở rộng'
    ],
    impactTypes: [
      'định giá cổ phiếu ngành Ngân hàng (P/B), mục tiêu tăng trưởng lợi nhuận cả năm và an toàn thanh khoản'
    ]
  },
  {
    category: 'Khủng hoảng Truyền thông, Pháp lý & Tin đồn',
    entities: [
      'Tin đồn khởi tố/tạm hoãn xuất cảnh lãnh đạo chủ chốt', 'Cổ phiếu bị đưa vào diện kiểm soát đặc biệt/đình chỉ giao dịch',
      'Xử phạt vi phạm hành chính về thao túng thị trường chứng khoán', 'Tranh chấp pháp lý quyền điều hành giữa hai nhóm cổ đông lớn',
      'Người dân tập trung khiếu nại sản phẩm bảo hiểm liên kết đầu tư / tiền gửi liên kết',
      'Văn bản rò rỉ chưa kiểm chứng về kết luận thanh tra dự án trọng điểm'
    ],
    events: [
      'thông tin tiêu cực chưa kiểm chứng lan truyền với tốc độ 500.000 lượt xem/giờ trên mạng xã hội',
      'cổ phiếu bị dư bán sàn hàng triệu đơn vị ngay từ phiên ATO',
      'khách hàng đồng loạt yêu cầu rút vốn trước hạn tại các chi nhánh/phòng giao dịch',
      'các đối tác quốc tế tạm dừng phê duyệt các khoản giải ngân vay hợp vốn quốc tế',
      'nhận công văn yêu cầu giải trình của Ủy ban Chứng khoán Nhà nước trong thời hạn 24 giờ'
    ],
    contexts: [
      'vào thời điểm doanh nghiệp đang chuẩn bị chào bán cổ phần ra công chúng',
      'khi tâm lý nhà đầu tư trên thị trường đang rất nhạy cảm với các rủi ro pháp lý'
    ],
    impactTypes: [
      'danh tiếng thương hiệu, giá trị vốn hóa thị trường và khả năng huy động vốn trong 12 tháng tới'
    ]
  },
  {
    category: 'Thẩm định Báo cáo Tài chính & Dấu hiệu Cảnh báo',
    entities: [
      'Dòng tiền thuần từ hoạt động kinh doanh (CFO) âm liên tiếp nhiều kỳ',
      'Khoản phải thu khác và tạm ứng nhân viên tăng vọt chiếm >50% tổng tài sản',
      'Hàng tồn kho bất động sản dở dang ứ đọng kéo dài không tạo doanh thu',
      'Chi phí xây dựng cơ bản dở dang không có hồ sơ quyết toán rõ ràng',
      'Giao dịch chuyển nhượng vốn góp/cổ phần nội bộ tạo lợi nhuận tài chính bất thường',
      'Ý kiến kiểm toán ngoại trừ liên quan đến giá trị có thể thu hồi của công nợ'
    ],
    events: [
      'doanh nghiệp ghi nhận doanh thu tăng 30% nhưng tiền mặt thực tế sụt giảm 70%',
      'đơn vị kiểm toán Big 4 từ chối đưa ra ý kiến kiểm toán đối với Báo cáo tài chính năm',
      'tỷ lệ đòn bẩy tài chính Nợ vay / Vốn chủ sở hữu vượt ngưỡng an toàn 3.5 lần',
      'doanh nghiệp liên tục thay đổi đơn vị kiểm toán độc lập trong 2 năm gần nhất'
    ],
    contexts: [
      'trước khi các ngân hàng tài trợ xem xét cấp hạn mức tín dụng lưu động mới',
      'trong quá trình thẩm định đầu tư M&A của quỹ đầu tư ngoại'
    ],
    impactTypes: [
      'độ tin cậy của báo cáo tài chính, nguy cơ điều chỉnh hồi tố số liệu và rủi ro quản trị công ty'
    ]
  }
];

const samples: any[] = [];
let counter = 1;

while (samples.length < 1000) {
  for (const seed of seedData) {
    for (const ent of seed.entities) {
      for (const evt of seed.events) {
        for (const ctx of seed.contexts) {
          if (samples.length >= 1000) break;
          
          const impact = seed.impactTypes[samples.length % seed.impactTypes.length];
          const queryId = counter++;

          let userPrompt = '';
          let responseAnalysis = '';

          if (seed.category.includes('Vĩ mô')) {
            userPrompt = `[Câu hỏi #${queryId}] Phân tích tác động chính sách khi ${ent} xuất hiện diễn biến ${evt} ${ctx}. Đánh giá tác động đến ${impact} và khuyến nghị chiến lược ứng phó.`;
            responseAnalysis = `### 1. Bản chất sự kiện & Đánh giá rủi ro vĩ mô
- **Bản chất động thái**: Sự việc ${ent} diễn biến theo hướng ${evt} ${ctx} phản ánh sự chủ động trong việc điều tiết thanh khoản nhằm ổn định mặt bằng tỷ giá và kiểm soát dòng vốn nóng.
- **Cấp độ rủi ro**: Mức 3/5 (Cần theo dõi sát chỉ số liên ngân hàng và phản ứng của thị trường ngoại tệ trong 5-10 phiên tiếp theo).

### 2. Chuỗi tác động liên đới đa tầng
- **Tác động thanh khoản & Lãi suất**: Chi phí huy động vốn kỳ hạn ngắn dự báo nhích tăng nhẹ từ 0.2% - 0.5%; các định chế tài chính nhỏ chịu áp lực cạnh tranh vốn gay gắt hơn.
- **Tác động đến ${impact}**: Doanh nghiệp có độ mở thương mại lớn hoặc tỷ lệ nợ vay thả nổi cần sẵn sàng các công cụ bảo hiểm rủi ro tỷ giá (FX Forward/Swap).
- **Thị trường Chứng khoán (VN-Index)**: Nhóm cổ phiếu nhạy cảm lãi suất (Chứng khoán, Thép, BĐS) sẽ xuất hiện nhịp rung lắc tái định giá; dòng tiền thông minh có xu hướng dịch chuyển về nhóm Doanh nghiệp có cổ tức tiền mặt cao và Dòng tiền thuần dương.

### 3. Ma trận lan truyền & Chỉ số then chốt cần giám sát
- **Chỉ số giám sát cốt lõi**:
  - Chênh lệch lãi suất qua đêm VND - USD (Ngưỡng an toàn: duy trì dương hoặc tiệm cận 0%).
  - Tỷ giá USD/VND tại các NHTM lớn (Vietcombank, BIDV) và tỷ giá tự do.
  - Khối lượng bơm/hút ròng lũy kế 14 ngày qua kênh OMO/Tín phiếu.

### 4. Khuyến nghị hành động chiến lược (24h - 72h)
1. **Đối với Doanh nghiệp & Ban Lãnh đạo**: Rà soát lại danh mục nợ vay ngoại tệ, chốt sớm hợp đồng kỳ hạn tỷ giá đối với các lô hàng nguyên vật liệu nhập khẩu đến hạn quý tới.
2. **Đối với Khối Đầu tư & Quản lý Tài sản**: Giảm tỷ lệ đòn bẩy Margin, tập trung gom tích lũy các cổ phiếu đầu ngành có tỷ lệ nợ vay ròng trên vốn chủ sở hữu < 0.3 lần.`;
          } else if (seed.category.includes('Bất động sản')) {
            userPrompt = `[Tình huống #${queryId}] Đánh giá rủi ro và giải pháp khi ${ent} gặp sự kiện ${evt} ${ctx}. Phân tích tác động đến ${impact}.`;
            responseAnalysis = `### 1. Đánh giá bản chất & Cấp độ rủi ro
- **Tình trạng thực tế**: Sự kiện ${ent} diễn ra ${evt} ${ctx} là dấu hiệu cho thấy áp lực tái cấu trúc nợ đang ở giai đoạn then chốt.
- **Cấp độ rủi ro**: Cấp 4/5 (Rủi ro trọng yếu đối với thanh khoản hoạt động và uy tín phát hành của doanh nghiệp).

### 2. Chuỗi tác động liên đới đa tầng
- **Tâm lý nhà đầu tư & Trái chủ**: Tăng áp lực yêu cầu giải trình, nguy cơ phát sinh tranh chấp pháp lý nếu quyền lợi của trái chủ không được đảm bảo minh bạch.
- **Tác động đến ${impact}**: Nguy cơ ảnh hưởng chéo đến định mức tín nhiệm của các đơn vị bảo lãnh và đối tác tổng thầu trong hệ sinh thái.
- **Ngân hàng tài trợ dự án**: Buộc phải đánh giá lại giá trị thực tế của tài sản bảo đảm, xem xét chuyển nhóm nợ nếu điều kiện đàm phán không đạt chuẩn.

### 3. Ma trận lan truyền & Chỉ số giám sát cốt lõi
- **Chỉ số then chốt**: Tỷ lệ đồng thuận tại Hội nghị trái chủ (≥65% tổng mệnh giá), tiến độ hoàn thiện hồ sơ pháp lý giao đất và giấy phép xây dựng dự án đối ứng.

### 4. Khuyến nghị hành động chiến lược (24h - 72h)
1. **Chủ động công bố thông tin**: Thiết lập đường dây nóng hỗ trợ trái chủ, gửi văn bản kế hoạch dòng tiền hoàn trả chi tiết kèm cam kết bảo lãnh tài sản thực tế.
2. **Tối ưu danh mục tài sản**: Đẩy mạnh bán sỉ hoặc hợp tác đầu tư (BCC/M&A) một phần dự án thứ cấp cho các đối tác ngoại có tiềm lực tài chính để bổ sung thanh khoản khẩn cấp.
3. **Làm việc với tổ chức tư vấn độc lập**: Thuê đơn vị định giá quốc tế thẩm định lại tài sản nhằm củng cố niềm tin của các chủ nợ.`;
          } else if (seed.category.includes('Ngân hàng')) {
            userPrompt = `[Thẩm định ngân hàng #${queryId}] Phân tích chỉ số ${ent} khi xuất hiện hiện tượng ${evt} ${ctx}.`;
            responseAnalysis = `### 1. Bản chất sự kiện & Đánh giá an toàn hệ thống
- **Hiện tượng**: Diễn biến ${evt} tại chỉ tiêu ${ent} ${ctx} phản ánh sự thay đổi trong khẩu vị rủi ro và chất lượng bảng cân đối kế toán.
- **Cấp độ tác động**: Mức độ 3.5/5 (Tác động trung và dài hạn đến định giá cổ phiếu và khả năng tăng trưởng quy mô tài sản).

### 2. Chuỗi tác động liên đới đa tầng
- **Chất lượng lợi nhuận**: Chi phí trích lập dự phòng và chi phí vốn tăng khiến chỉ số ROE/ROA chịu áp lực điều chỉnh giảm trong 2 quý kế tiếp.
- **Khả năng mở rộng tín dụng**: Ngân hàng phải cơ cấu lại tỷ trọng cho vay, hạn chế giải ngân vào các lĩnh vực rủi ro cao và tập trung vào phân khúc bán lẻ, SME an toàn.
- **Thị trường liên ngân hàng**: Gia tăng chênh lệch lãi suất huy động giữa nhóm Ngân hàng TMCP Nhà nước (Big 4) và nhóm Ngân hàng TMCP tư nhân quy mô vừa và nhỏ.

### 3. Ma trận lan truyền & Chỉ số giám sát cốt lõi
- **Chỉ số theo dõi**: Tỷ lệ LDR (Cho vay/Huy động), Hệ số CAR theo Thông tư 41, Tỷ lệ nợ nhóm 2 chuyển thành nợ xấu (Migration Rate) và Tỷ lệ bao phủ nợ xấu (LLR).

### 4. Khuyến nghị hành động chiến lược (24h - 72h)
1. **Khối Quản trị Rủi ro Tín dụng**: Tăng tần suất kiểm tra thực địa tài sản bảo đảm, áp dụng chính sách chiết khấu định giá thận trọng hơn đối với BĐS tỉnh.
2. **Khối Khách hàng Doanh nghiệp**: Cơ cấu sớm các khoản vay tiềm ẩn rủi ro theo đúng quy định, thúc đẩy thu hồi nợ gốc đối với các khoản vay đã quá hạn.`;
          } else if (seed.category.includes('Khủng hoảng')) {
            userPrompt = `[Khủng hoảng khẩn cấp #${queryId}] Doanh nghiệp đối mặt với ${ent} khi có thông tin ${evt} ${ctx}. Soạn thảo kịch bản xử lý khủng hoảng truyền thông và ổn định vận hành.`;
            responseAnalysis = `### 1. Đánh giá cấp độ khủng hoảng & Tốc độ lan truyền
- **Mức độ khẩn cấp**: Cấp độ 1 (Khẩn cấp tối đa - Đe dọa trực tiếp đến thanh khoản và giá trị vốn hóa).
- **Rủi ro cốt lõi**: Hiện tượng hoảng loạn tâm lý dẫn đến bán tháo cổ phiếu và rút vốn dây chuyền từ đối tác.

### 2. Chuỗi tác động liên đới đa tầng
- **Cơ quan quản lý**: Nguy cơ nhận công văn yêu cầu giải trình bắt buộc từ SGDCK/UBCKNN trong 24h.
- **Hệ thống ngân hàng & Đối tác**: Các hợp đồng tín dụng mới và bảo lãnh thanh toán có thể bị tạm hoãn phê duyệt.
- **Nội bộ doanh nghiệp**: Nhân sự hoang mang, giảm động lực làm việc nếu thiếu thông tin chỉ đạo chính thức từ Hội đồng Quản trị.

### 3. Ma trận phản ứng nhanh (Quy tắc 4T)
- **Tốc độ (Speed)** - **Trung thực (Honesty)** - **Thấu cảm (Empathy)** - **Thống nhất 1 đầu mối (Single Voice)**.

### 4. Kịch bản hành động chi tiết theo mốc thời gian
1. **0 - 4 Giờ đầu**: Kích hoạt Ban Chỉ đạo Xử lý Khủng hoảng (Crisis Committee), ban hành thông báo nội bộ trấn an nhân viên, chỉ định người phát ngôn hợp pháp duy nhất.
2. **4 - 12 Giờ tiếp theo**: Phát hành Thông cáo báo chí chính thức gửi cơ quan quản lý và các cơ quan thông tấn lớn; giải trình rõ ràng các nội dung sai lệch có cơ sở pháp lý và số liệu kiểm toán.
3. **12 - 48 Giờ**: Trực tiếp gặp gỡ 5 ngân hàng tài trợ lớn nhất và top 10 khách hàng chiến lược để khẳng định năng lực thanh toán và vận hành bình thường.
4. **48 - 72 Giờ**: Sử dụng công cụ Social Listening quét sạch các nguồn phát tán tin giả có dấu hiệu vi phạm pháp luật, phối hợp cơ quan chức năng xử lý theo Luật An ninh mạng.`;
          } else {
            userPrompt = `[Thẩm định BCTC #${queryId}] Kiểm toán phát hiện ${ent} với diễn biến ${evt} ${ctx}. Phân tích dấu hiệu bất thường và rủi ro đầu tư.`;
            responseAnalysis = `### 1. Bản chất & Tín hiệu cảnh báo (Red Flags)
- **Bản chất kế toán**: Hiện tượng ${evt} liên quan đến ${ent} ${ctx} là dấu hiệu điển hình của việc ghi nhận lợi nhuận không đi kèm dòng tiền thực (Chất lượng lợi nhuận thấp).
- **Mức độ rủi ro**: Rất cao (Cần kiểm tra kỹ các giao dịch với các bên liên quan và tính có thật của số dư tài sản).

### 2. Chuỗi tác động liên đới đa tầng
- **Rủi ro mất vốn lưu động**: Doanh nghiệp phải liên tục tìm kiếm nguồn vốn vay nợ mới để bù đắp thâm hụt tiền mặt trong hoạt động kinh doanh hàng ngày.
- **Rủi ro pháp lý & Thuế**: Khả năng bị cơ quan thuế ấn định thuế hoặc yêu cầu loại trừ chi phí không hợp lý; kiểm toán viên có thể đưa ra ý kiến từ chối hoặc ngoại trừ.
- **Ảnh hưởng đến thị giá cổ phiếu**: Thị trường sẽ chiết khấu mạnh mức định giá P/E do rủi ro quản trị công ty kém minh bạch.

### 3. Ma trận lan truyền & Chỉ số cần bóc tách
- **Chỉ số trọng yếu**: Chu kỳ chuyển đổi tiền mặt (CCC), Tỷ lệ Khoản phải thu / Tổng tài sản, Tỷ lệ Dòng tiền thuần từ HĐKD trên Vốn điều lệ (CFO/Equity).

### 4. Khuyến nghị thẩm định chuyên sâu
1. **Đối với Chuyên viên Đầu tư/Tín dụng**: Không giải ngân hoặc hạ hạn mức tín dụng cho đến khi có báo cáo kiểm toán đặc biệt từ công ty kiểm toán độc lập uy tín.
2. **Đối với Hội đồng Quản trị**: Yêu cầu Ban Kiểm soát làm rõ bản chất kinh tế của các hợp đồng tạm ứng và ủy thác đầu tư dài hạn.`;
          }

          samples.push({
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: userPrompt },
              { role: 'model', content: responseAnalysis }
            ]
          });
        }
      }
    }
  }
}

const final1000 = samples.slice(0, 1000);

// Ensure directory
const outDir = path.join(process.cwd(), 'public', 'dataset');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Write JSONL
const jsonlPath = path.join(outDir, 'vietnam_finance_expert_1000_dataset.jsonl');
const jsonlContent = final1000.map(s => JSON.stringify(s)).join('\n');
fs.writeFileSync(jsonlPath, jsonlContent, 'utf-8');

// Write CSV
const csvPath = path.join(outDir, 'vietnam_finance_expert_1000_dataset.csv');
let csvContent = '\uFEFFsystem_instruction,user_input,ideal_output\n';
for (const item of final1000) {
  const sys = '"' + item.messages[0].content.replace(/"/g, '""') + '"';
  const usr = '"' + item.messages[1].content.replace(/"/g, '""') + '"';
  const mdl = '"' + item.messages[2].content.replace(/"/g, '""') + '"';
  csvContent += `${sys},${usr},${mdl}\n`;
}
fs.writeFileSync(csvPath, csvContent, 'utf-8');

console.log(`Successfully generated ${final1000.length} high-quality dataset pairs!`);
console.log('Saved to:');
console.log('1.', jsonlPath);
console.log('2.', csvPath);
