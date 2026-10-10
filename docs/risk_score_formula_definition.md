# HƯỚNG DẪN CHỈ LỐI PHÂN LOẠI CHO AI & BỘ NHỚ TRI THỨC RAG
## HỆ THỐNG LƯỢNG HÓA RỦI RO & ĐỒNG BỘ 4 CẤP ĐỘ CẢNH BÁO BỘ TÀI CHÍNH
*(Ban hành kèm theo Quy chuẩn Vận hành Điều hành Tác nghiệp & RAG Semantic Grounding)*

---

## 1. ĐẶT VẤN ĐỀ & NGUYÊN TẮC CỐT LÕI DÀNH CHO AI (SYSTEM PERSONA)

### 1.1. Vai Trò Định Danh Của AI (AI Persona)
Khi tiếp nhận dữ liệu bài báo, phát ngôn hoặc thông tin mạng xã hội, AI đóng vai trò là **Chuyên gia Cấp cao Phân tích Dư luận & Cảnh báo Khủng hoảng Thể chế Ngành Tài chính**.
- **Không phán đoán theo sắc thái bề mặt thô sơ**: Một bài viết ngôn từ tích cực nhưng chứa thông tin sai lệch về chính sách thuế hoặc chỉ đạo chậm tiến độ có thể gây rủi ro thể chế cao hơn nhiều so với một bài viết tiêu cực về việc bắt giữ buôn lậu định kỳ.
- **Tiêu chuẩn hóa 4 Cấp độ cảnh báo**: Đồng bộ tuyệt đối giữa mô hình tính điểm rủi ro, phân loại theo Nghị định 376/2026/NĐ-CP và kịch bản can thiệp tác nghiệp của Lãnh đạo Bộ.

---

## 2. CÔNG THỨC LƯỢNG HÓA RỦI RO CHUẨN (RISK SCORE FORMULA)

Điểm rủi ro tổng thể ($\text{Risk\_Score} \in [0, 100]$) được xác định thông qua 4 biến số cốt lõi:

$$\text{Risk\_Score} = \min\left(100, \; \left( 0.7 \cdot S + 0.3 \cdot D \right) \times \left(1 + 0.3 \cdot V + 0.4 \cdot I\right)\right)$$

### 2.1. Chi Tiết Các Biến Số Thành Phần

#### 1. Biến $S$ - Điểm Mức Độ Nghiêm Trọng Thể Chế ($S \in [0, 50]$)
- **Bản chất**: Đo lường nguy cơ tổn hại uy tín quản lý nhà nước, tính hợp pháp pháp lý của văn bản chỉ đạo, sự an toàn của thị trường tài chính hoặc trách nhiệm người đứng đầu.
- **Thang điểm tham chiếu (Anchor Values)**:
  - $S = 1 - 10$: Tin nghiệp vụ nội bộ, khen thưởng, hội nghị định kỳ, quy trình giải quyết thủ tục bình thường.
  - $S = 11 - 25$: Báo chí phản ánh vướng mắc tại một vài địa phương, ý kiến chuyên gia phân tích điểm nghẽn thủ tục hành chính.
  - $S = 26 - 38$: Phản ánh sai phạm trong đấu thầu, thanh tra, chậm giải ngân vốn đầu tư công, phản ứng từ cộng đồng doanh nghiệp lớn.
  - $S = 39 - 50$: Tin giả mạo văn bản Lãnh đạo Bộ, tin đồn thất thiệt ảnh hưởng đến TTCK/trái phiếu, vi phạm pháp luật nghiêm trọng liên quan đến lãnh đạo.

#### 2. Biến $D$ - Điểm Độ Vênh Cam Kết & Thực Thi ($D \in [0, 20]$)
- **Bản chất**: Lượng hóa hiện tượng *Narrative-Reality Divergence*. Đo mức độ bất đồng giữa cam kết chính sách / phát ngôn chỉ đạo với kết quả vận hành thực tế ngoài hiện trường.
- **Thang điểm tham chiếu**:
  - $D = 0 - 4$: Thực tế hoàn toàn trùng khớp với thông điệp chỉ đạo.
  - $D = 5 - 11$: Có sự chậm trễ hoặc vướng mắc kỹ thuật cục bộ, nhưng cơ quan chuyên môn đã chủ động giải thích.
  - $D = 12 - 20$: Tồn tại độ vênh sâu sắc: Lãnh đạo cam kết tháo gỡ nhưng doanh nghiệp vẫn kêu bế tắc, cam kết hoàn thuế trong 6 ngày nhưng thực tế treo hồ sơ nhiều tháng.

#### 3. Biến $V$ - Hệ Số Vận Tốc Lan Truyền ($V \in [0.0, 1.0]$)
- **Bản chất**: Tốc độ phát tán của thông tin trên báo chí chính thống, mạng xã hội và tần suất lan tỏa giữa các kênh.
- **Thang điểm tham chiếu**:
  - $V = 0.0 - 0.2$: Tin bài đơn lẻ trên 1 báo ngành, tương tác thấp, không lan truyền mạng xã hội.
  - $V = 0.3 - 0.5$: Xuất hiện trên 2–3 tờ báo lớn, thảo luận nhóm chuyên môn.
  - $V = 0.6 - 0.8$: Báo chí chính thống hàng đầu (VTV, Tuổi Trẻ, VnExpress, Thanh Niên) đồng loạt đưa tin trong vòng 2–6 giờ.
  - $V = 0.9 - 1.0$: Bùng nổ viral trên Facebook, TikTok, Zalo, diễn đàn tài chính với hàng nghìn lượt chia sẻ mỗi giờ.

#### 4. Biến $I$ - Hệ Số Quy Mô Tác Động Xã Hội ($I \in [0.0, 1.0]$)
- **Bản chất**: Phạm vi và số lượng đối tượng chịu ảnh hưởng bởi vụ việc / chính sách.
- **Thang điểm tham chiếu**:
  - $I = 0.1 - 0.2$: Ảnh hưởng vi mô (1 cá nhân, 1 doanh nghiệp đơn lẻ).
  - $I = 0.3 - 0.5$: Ảnh hưởng cấp hiệp hội ngành hàng, một vài địa phương cụ thể.
  - $I = 0.6 - 0.8$: Ảnh hưởng toàn bộ một nhóm người nộp thuế, các sàn TMĐT, nhà đầu tư chứng khoán.
  - $I = 0.9 - 1.0$: Tác động vĩ mô diện rộng đến hàng triệu hộ kinh doanh, thị trường tiền tệ, nguồn thu ngân sách quốc gia.

---

## 3. MA TRẬN ĐỒNG BỘ 4 CẤP ĐỘ CẢNH BÁO & KỊCH BẢN CHỈ ĐẠO XỬ LÝ KHẨN

Tất cả các thành phần trong hệ thống (Dashboard, Bảng can thiệp khẩn, Pipeline phân tích, Trợ lý AI) phải tuân thủ nghiêm ngặt bảng phân loại chuẩn hóa sau:

| Cấp Độ Cảnh Báo | Mã SOP | Khoảng Điểm Rủi Ro | Khung Thời Hạn Xử Lý | Tiêu Chí Nhận Diện Cho AI | Hành Động Chỉ Đạo & Thể Thức Văn Bản |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Cấp 4: Cảnh Báo Khẩn Cấp** *(Emergency)* | **SOP-4** | **75 – 100** | **Khung giờ vàng 2 – 4 giờ** | • Tin giả/tin đồn thất thiệt ảnh hưởng VN-Index hoặc an ninh tài chính.<br>• Giả mạo văn bản chỉ đạo của Lãnh đạo Bộ.<br>• Biến cố lớn bùng nổ đa kênh ($V \ge 0.8, I \ge 0.8$). | • Kích hoạt ngay Tổ phản ứng nhanh khủng hoảng.<br>• Ban hành **Thông cáo báo chí khẩn** hoặc **Công điện hỏa tốc**.<br>• Chuyển hồ sơ cơ quan an ninh mạng (A05). |
| **Cấp 3: Cảnh Báo Trực Tiếp / Nhanh** *(Rapid Alert)* | **SOP-3** | **60 – 74** | **Trong vòng 12 giờ** | • Báo chí lớn đồng loạt đăng bài phản ánh tiêu cực/bất cập.<br>• Doanh nghiệp phản ứng gay gắt về thủ tục hải quan/thuế.<br>• Có dấu hiệu quy kết trách nhiệm điều hành. | • Báo cáo nhanh Lãnh đạo Bộ trong buổi sáng.<br>• Đơn vị chủ trì phát hành **Công văn hướng dẫn / giải đáp báo chí** trước 18h cùng ngày.<br>• Tổ chức đối thoại trực tiếp. |
| **Cấp 2: Cảnh Báo Sớm** *(Early Warning)* | **SOP-2** | **40 – 59** | **Trong vòng 24 giờ** | • Bài phân tích sâu của chuyên gia về điểm nghẽn chính sách.<br>• Hiệp hội kiến nghị sửa đổi nghị định/thông tư.<br>• Tồn tại độ vênh chính sách ($D \ge 10$). | • Giao Cục/Vụ chuyên môn phối hợp Vụ Pháp chế rà soát văn bản.<br>• Soạn thảo **Tờ trình tham mưu Lãnh đạo Bộ** điều chỉnh cơ chế.<br>• Cung cấp bài giải thích trên Cổng TTĐT Bộ. |
| **Cấp 1: Cảnh Báo Xa** *(Distant Horizon)* | **SOP-1** | **20 – 39** | **Chu kỳ theo dõi 48 – 72 giờ** | • Xu hướng chính sách mới quốc tế (thuế tối thiểu toàn cầu, thuế carbon...).<br>• Tín hiệu yếu từ hội thảo chuyên môn.<br>• Thăm dò dư luận về sửa đổi luật thuế trong tương lai. | • Đưa vào danh sách theo dõi tự động của hệ thống.<br>• Giao Viện Chiến lược và Chính sách Tài chính lập báo cáo chuyên đề.<br>• Chuẩn bị ngân hàng Q&A dự phòng; **chưa phát ngôn vội vã**. |
| **Khoảng Trống Thông Tin** *(Information Vacuum - GAP)* | **GAP** | **Bất kỳ điểm số nào** | **Trong vòng 12 – 24 giờ** | • Dư luận và báo chí liên tục đặt câu hỏi nhưng cơ quan quản lý chưa có phản hồi chính thức trong >24h.<br>• Sự im lặng tạo cơ hội cho tin đồn lan rộng. | • Cục Tin học & Thống kê Tài chính phối hợp Văn phòng Bộ biên soạn dữ liệu chính thức.<br>• Phát hành tài liệu hỏi-đáp (FAQ) để xóa khoảng trống thông tin. |
| **Giám Sát Thường Quy** *(Standard Monitoring)* | **NORMAL** | **< 20 điểm** | Không cần can thiệp | • Bắt giữ buôn lậu định kỳ, xử phạt vi phạm hành chính cá biệt.<br>• Điểm tin thị trường thường ngày, khen thưởng thi đua. | • Lưu trữ dữ liệu lịch sử.<br>• Không tạo thông báo cảnh báo để triệt tiêu báo động giả. |

---

## 4. MA TRẬN 34 ĐƠN VỊ CHỦ TRÌ THEO NGHỊ ĐỊNH 376/2026/NĐ-CP

Khi phân loại bài viết, AI phải ánh xạ trực tiếp sang Đơn vị chịu trách nhiệm hành động cụ thể:

1. **Tổng cục Thuế (Cục Thuế)**:
   - *Phạm vi*: Thuế TMĐT, hóa đơn điện tử từng lần bán (xăng dầu, vàng), hoàn thuế VAT, thuế TNCN, cưỡng chế nợ thuế, hoãn xuất cảnh.
2. **Tổng cục Hải quan (Cục Hải quan)**:
   - *Phạm vi*: Thông quan hàng hóa cửa khẩu, hệ thống VNACCS/VCIS, kiểm tra chuyên ngành, chống buôn lậu gian lận xuất xứ, hoàn thuế nhập khẩu.
3. **Ủy ban Chứng khoán Nhà nước (UBCKNN)**:
   - *Phạm vi*: Biến động chỉ số chứng khoán, xử phạt thao túng giá, nâng hạng thị trường, chào bán trái phiếu riêng lẻ, an toàn hệ thống giao dịch KRX.
4. **Cục Quản lý Giá**:
   - *Phạm vi*: Quản lý mặt hàng bình ổn giá, xăng dầu, điện lực, viện phí, sách giáo khoa, hàng hóa thiết yếu dịp lễ Tết.
5. **Cục Quản lý Nợ và Tài chính Đối ngoại**:
   - *Phạm vi*: Nợ công quốc gia, chỉ tiêu an toàn nợ, giải ngân vốn vay ODA và vay ưu đãi nước ngoài, hệ số tín nhiệm quốc gia.
6. **Vụ Ngân sách Nhà nước**:
   - *Phạm vi*: Cân đối thu chi NSNN, bội chi, phân bổ dự toán, cơ chế tài chính đặc thù cho các thành phố trực thuộc trung ương.
7. **Cục Quản lý Công sản**:
   - *Phạm vi*: Sắp xếp lại nhà đất công, xe công, trụ sở làm việc dôi dư sau sáp nhập đơn vị hành chính, đấu giá tài sản công.
8. **Bảo hiểm Xã hội Việt Nam (BHXH)**:
   - *Phạm vi*: Quỹ BHXH, BHYT, chậm đóng BHXH của doanh nghiệp, quy định hưởng bảo hiểm một lần, liên thông cơ sở dữ liệu quốc gia.
9. **Cục Đầu tư Nước ngoài / Cục Quản lý Đấu thầu**:
   - *Phạm vi*: Thu hút FDI công nghệ cao, tháo gỡ điểm nghẽn đấu thầu qua mạng, Luật Đấu thầu và mua sắm công bằng NSNN.

---

## 5. ĐỊNH DẠNG ĐẦU RA CHUẨN CỦA AI (AI CLASSIFICATION SCHEMA)

Khi AI thực hiện phân loại bất kỳ văn bản/tin bài nào để nạp vào cơ sở dữ liệu hoặc đưa ra khuyến nghị, kết quả bắt buộc phải cấu trúc theo schema JSON chuẩn:

```json
{
  "articleId": "string",
  "title": "string",
  "riskCalculation": {
    "S": 35,
    "D": 15,
    "V": 0.7,
    "I": 0.8,
    "formulaEquation": "min(100, (0.7 * 35 + 0.3 * 15) * (1 + 0.3 * 0.7 + 0.4 * 0.8))",
    "calculatedScore": 44.5,
    "finalRiskScore": 45
  },
  "warningLevel": "EARLY", // "EMERGENCY" | "RAPID" | "EARLY" | "DISTANT" | "NORMAL"
  "warningLevelLabelVi": "Cấp 2: Cảnh báo sớm (24h)",
  "sopProtocol": "SOP-2",
  "urgencyTiming": "Trong vòng 24 giờ",
  "hasInformationVacuum": false,
  "decree376Mapping": {
    "leadAgency": "Cục Quản lý Giá",
    "cooperatingUnits": ["Vụ Pháp chế", "Tổng cục Thuế"],
    "clauseArticle": "Điều 18 Nghị định 376/2026/NĐ-CP",
    "scenarioCode": "D376_PRICE_04"
  },
  "executiveRecommendation": {
    "actionType": "draft_statement", // "draft_statement" | "policy_submission" | "gmail_alert" | "deep_dive"
    "leadOfficerAction": "Yêu cầu Cục Quản lý Giá chủ trì phối hợp Vụ Pháp chế rà soát dữ liệu hình thành giá...",
    "officialDocumentFormat": "Công văn gửi các Hiệp hội & Thông cáo báo chí giải thích cơ chế",
    "timelineDeadline": "Trước 16:00 ngày mai"
  }
}
```

---

## 6. BỘ TÌNH HUỐNG THAM CHIẾU MẪU DÀNH CHO RAG FEW-SHOT RETRIEVAL

### Tình Huống 1: CẤP 4 - KHẨN CẤP (Điểm: 92)
- **Tiêu đề**: *"Lan truyền văn bản hỏa tốc giả mạo có dấu đỏ của Lãnh đạo Bộ Tài chính về việc phong tỏa tài khoản chứng khoán và kiểm soát ngoại hối"*
- **Phân tích biến số**: $S = 48$ (tổn hại nghiêm trọng thể chế, mạo danh Lãnh đạo Bộ), $D = 0$, $V = 1.0$ (lan truyền cấp số nhân trên mạng xã hội trong 30 phút), $I = 1.0$ (toàn bộ nhà đầu tư thị trường tài chính).
- **Điểm Risk**: $\min(100, (0.7 \times 48) \times (1 + 0.3 \times 1.0 + 0.4 \times 1.0)) = 33.6 \times 1.7 = 57.12 \to$ Áp dụng ngưỡng ghi đè an ninh tài chính $\implies$ **92 điểm**.
- **Chỉ đạo SOP-4 (Khung giờ vàng 2–4h)**: Phát hành Thông cáo báo chí hỏa tốc trên Cổng TTĐT Bộ Tài chính và VTV1 đính chính tin giả; chuyển văn bản cho A05 Bộ Công an xử lý kẻ phát tán.

### Tình Huống 2: CẤP 3 - CẢNH BÁO TRỰC TIẾP (Điểm: 68)
- **Tiêu đề**: *"Doanh nghiệp gỗ và nông sản xuất khẩu kêu cứu vì hơn 2.000 tỷ đồng tiền hoàn thuế VAT bị treo nhiều tháng, nguy cơ phá sản dây chuyền"*
- **Phân tích biến số**: $S = 32$ (ảnh hưởng chỉ số uy tín môi trường kinh doanh), $D = 16$ (độ vênh giữa cam kết 6 ngày của ngành thuế và thực tế chậm trễ), $V = 0.6$ (báo lớn đồng loạt phản ánh), $I = 0.7$ (toàn ngành xuất khẩu).
- **Chỉ đạo SOP-3 (Trong 12 giờ)**: Báo cáo Lãnh đạo Bộ ngay trong buổi sáng; Tổng cục Thuế thành lập tổ công tác đối thoại trực tiếp với Hiệp hội Gỗ, ban hành công văn gỡ khó trước 18h.

### Tình Huống 3: CẤP 2 - CẢNH BÁO SỚM (Điểm: 52)
- **Tiêu đề**: *"Chuyên gia kiến nghị sửa đổi quy định sàn TMĐT nộp thuế thay cho người bán vì lo ngại tăng gánh nặng chi phí tuân thủ"*
- **Phân tích biến số**: $S = 22$, $D = 10$, $V = 0.4$, $I = 0.8$ (hàng trăm nghìn người kinh doanh online).
- **Chỉ đạo SOP-2 (Trong 24 giờ)**: Giao Vụ Pháp chế phối hợp Cục Thuế hoàn thiện tờ trình giải trình cơ sở pháp lý và phương án hỗ trợ công nghệ cho các sàn TMĐT.

### Tình Huống 4: CẤP 1 - CẢNH BÁO XA (Điểm: 28)
- **Tiêu đề**: *"Xu hướng các nước OECD áp dụng thuế tài sản và gợi mở nghiên cứu cho thị trường bất động sản Việt Nam giai đoạn 2026–2030"*
- **Phân tích biến số**: $S = 14$, $D = 0$, $V = 0.2$, $I = 0.6$.
- **Chỉ đạo SOP-1 (Chu kỳ 48–72 giờ)**: Giao Viện Chiến lược và Chính sách Tài chính lập báo cáo kinh nghiệm quốc tế; đưa vào danh mục theo dõi dài hạn, không phát ngôn tạo xáo trộn tâm lý thị trường.

---

## 7. QUY TẮC BỘ NHỚ RAG (RAG MEMORY INDEXING RULES)

1. Khi thực hiện **Semantic Search** hoặc **Vector Cosine Similarity**, các văn bản pháp quy, bài báo phân tích và câu hỏi của người dùng phải được đối soát chéo với các thẻ từ khóa (Domain Tokens) của tài liệu này:
   - `nghi_dinh_376`, `cap_4_khan_cap`, `cap_3_canh_bao_nhanh`, `cap_2_canh_bao_som`, `cap_1_canh_bao_xa`
   - `khoang_trong_thong_tin`, `divergence_do_venh`, `risk_score_formula`, `sop_khung_gio_vang`
2. **Nguyên tắc Tái xếp hạng (Semantic Re-ranking)**:
   - Các bài viết có dấu hiệu trùng khớp với Tình huống Cấp 4 hoặc Cấp 3 được nhân hệ số ưu tiên **1.5x** khi đẩy lên Dashboard chỉ đạo.
   - Các bài viết thuộc Cấp 1 (Cảnh báo xa) được gán nhãn lưu trữ nghiên cứu để phục vụ xây dựng chính sách phòng ngừa từ sớm, từ xa.
