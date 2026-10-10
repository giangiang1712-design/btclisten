/**
 * SOURCE-LEVEL DIVERGENCE ENGINE (D_source [0, 20])
 * Thuật toán tính toán biến số D dựa trên độ lệch thông tin, khoảng cách thời gian và độ tin cậy nguồn tin.
 * File: /src/lib/dEngine.ts
 */

export interface SourceDivergenceInput {
  title: string;
  content: string;
  sourceTrustScore?: number;      // Độ tin cậy của nguồn tin: [0, 100] (mặc định 60)
  timeDistanceHours?: number;     // Khoảng cách thời gian phát hiện giữa các nguồn tin đối lập (giờ)
  informationDiscrepancy?: number; // Tỷ lệ độ lệch thông tin bóc tách trực tiếp: [0, 100]
}

export interface SourceDivergenceOutput {
  D: number;                      // Giá trị nguyên cuối cùng: [0, 20]
  rawD: number;                   // Giá trị thực tế trước làm tròn
  discrepancyScore: number;       // Trục 1: Điểm lệch lệch thông tin [0, 100]
  timeFactor: number;             // Trục 2: Hệ số thời gian [0.5, 1.5]
  trustFactor: number;            // Trục 3: Hệ số tin cậy nguồn [0.2, 1.2]
  reasoning: string[];
}

export class DEngine {
  /**
   * Tính toán biến số D nguồn tin
   */
  public static calculateD(input: SourceDivergenceInput): SourceDivergenceOutput {
    const reasoning: string[] = [];
    const text = `${input.title} ${input.content}`.toLowerCase();

    reasoning.push('KHỞI ĐỘNG D_SOURCE ENGINE: Phân tích độ lệch nguồn tin dựa trên 3 tiêu chí.');

    // 1. TRỤC 1: ĐỘ LỆCH THÔNG TIN (informationDiscrepancy)
    let discrepancy = input.informationDiscrepancy ?? 0;
    if (input.informationDiscrepancy === undefined) {
      // Heuristic bóc tách tự động độ lệch thông tin từ văn bản
      if (text.includes('tin đồn ác ý') || text.includes('văn bản mật giả mạo') || text.includes('sai sự thật')) {
        discrepancy = 90;
        reasoning.push('[Heuristic] Phát hiện yếu tố mạo danh / tin đồn nghiêm trọng -> Gán độ lệch thông tin = 90.');
      } else if (text.includes('mâu thuẫn số liệu') || text.includes('vênh số liệu') || text.includes('không thống nhất')) {
        discrepancy = 75;
        reasoning.push('[Heuristic] Phát hiện mâu thuẫn số liệu hoặc bất nhất báo cáo -> Gán độ lệch thông tin = 75.');
      } else if (text.includes('chênh lệch nhẹ') || text.includes('lệch nhỏ') || text.includes('làm tròn số')) {
        discrepancy = 15;
        reasoning.push('[Heuristic] Chỉ là sai lệch kỹ thuật vi mô hoặc làm tròn thống kê -> Gán độ lệch = 15.');
      } else if (text.includes('chậm trễ') || text.includes('trễ hạn') || text.includes('vướng thủ tục')) {
        discrepancy = 40;
        reasoning.push('[Heuristic] Có độ lệch tiến độ thực thi thực tế -> Gán độ lệch = 40.');
      } else {
        discrepancy = 10;
        reasoning.push('[Heuristic] Không có dấu hiệu lệch thông tin đáng kể -> Gán mặc định = 10.');
      }
    } else {
      reasoning.push(`Độ lệch thông tin đầu vào: ${discrepancy}/100.`);
    }

    // 2. TRỤC 2: KHOẢNG CÁCH THỜI GIAN GIỮA CÁC NGUỒN TIN (timeDistanceHours)
    // - Khoảng cách thời gian cực ngắn (dưới 12 giờ) chứng tỏ sự dồn dập, mâu thuẫn bộc lộ gay gắt ngay lập tức -> Hệ số phạt cao nhất.
    // - Khoảng cách quá dài (trên 168 giờ) chứng tỏ bối cảnh đã dịu đi, tin tức nguội lạnh -> Hệ số phạt giảm mạnh.
    let timeDistance = input.timeDistanceHours ?? 12; // mặc định 12 giờ
    let timeFactor = 1.0;

    if (timeDistance <= 2) {
      timeFactor = 1.4;
      reasoning.push(`[Thời gian] Khoảng cách cực ngắn (${timeDistance} giờ), mâu thuẫn bùng nổ tức thì -> Hệ số phạt tăng cường = 1.4.`);
    } else if (timeDistance <= 12) {
      timeFactor = 1.2;
      reasoning.push(`[Thời gian] Khoảng cách ngắn (${timeDistance} giờ), gia tốc đối nghịch cao -> Hệ số phạt = 1.2.`);
    } else if (timeDistance <= 24) {
      timeFactor = 1.0;
      reasoning.push(`[Thời gian] Khoảng cách trung bình (${timeDistance} giờ) trong ngày -> Hệ số = 1.0.`);
    } else if (timeDistance <= 72) {
      timeFactor = 0.8;
      reasoning.push(`[Thời gian] Khoảng cách 1-3 ngày (${timeDistance} giờ), tin tức bắt đầu phân tán -> Hệ số giảm = 0.8.`);
    } else {
      timeFactor = 0.5;
      reasoning.push(`[Thời gian] Khoảng cách kéo dài trên 3 ngày (${timeDistance} giờ), độ nóng mâu thuẫn giảm sâu -> Hệ số giảm trần = 0.5.`);
    }

    // 3. TRỤC 3: ĐỘ TIN CẬY CỦA NGUỒN TIN (sourceTrustScore)
    // - Nếu nguồn tin mâu thuẫn xuất phát từ báo chính thống lớn (Trust >= 80), rủi ro thật sự nghiêm trọng -> Hệ số phạt tối đa.
    // - Nếu xuất phát từ mạng xã hội vô danh hoặc diễn đàn không xác thực (Trust < 40), rủi ro mang tính tin đồn tự phát -> Hệ số giảm sâu.
    let trustScore = input.sourceTrustScore ?? 60; // mặc định 60
    let trustFactor = 1.0;

    if (trustScore >= 85) {
      trustFactor = 1.2;
      reasoning.push(`[Nguồn tin] Nguồn chính thống cấp Quốc gia (Độ tin cậy: ${trustScore}) -> Hệ số tăng cường = 1.2.`);
    } else if (trustScore >= 65) {
      trustFactor = 1.0;
      reasoning.push(`[Nguồn tin] Nguồn chính thống chuyên ngành (Độ tin cậy: ${trustScore}) -> Hệ số = 1.0.`);
    } else if (trustScore >= 45) {
      trustFactor = 0.7;
      reasoning.push(`[Nguồn tin] Diễn đàn kinh doanh / Trang tin tổng hợp (Độ tin cậy: ${trustScore}) -> Hệ số giảm = 0.7.`);
    } else {
      trustFactor = 0.3;
      reasoning.push(`[Nguồn tin] Mạng xã hội tự phát / Tin đồn chưa xác minh (Độ tin cậy: ${trustScore}) -> Giảm trừ trách nhiệm thể chế, hệ số = 0.3.`);
    }

    // 4. TÍNH TOÁN D CHUNG
    // D_raw = (discrepancy * 0.15) * timeFactor * trustFactor
    const baseD = discrepancy * 0.15; // Max base is 15.0
    const rawD = baseD * timeFactor * trustFactor;
    const finalD = Math.max(0, Math.min(20, Math.round(rawD)));

    reasoning.push(`Công thức: D_raw = (${discrepancy} * 0.15) * ${timeFactor} * ${trustFactor} = ${rawD.toFixed(2)}.`);
    reasoning.push(`Kết luận S-D_source: Điểm D nguyên cuối cùng gán = ${finalD}/20.`);

    return {
      D: finalD,
      rawD: Number(rawD.toFixed(2)),
      discrepancyScore: discrepancy,
      timeFactor,
      trustFactor,
      reasoning
    };
  }
}
