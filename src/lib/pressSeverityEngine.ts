/**
 * PURE PRESS SEVERITY COMPUTATION ENGINE (S in [1, 50])
 * Module lượng hóa mức độ nghiêm trọng thể chế thuần báo chí điện tử
 * File: /src/lib/pressSeverityEngine.ts
 */

export interface CrawledArticleInput {
  title: string;
  content: string;
  sourceDomain?: string;
  publishedAt?: string | Date;
  authorType?: 'CHÍNH_THỐNG' | 'MẠNG_XÃ_HỘI' | 'HIỆP_HỘI' | 'CHUYÊN_GIA' | 'CỔNG_DVC';
}

export interface AxisBreakdown {
  A1_reputation: number;   // 1 - 50: Uy tín & Nghị trường
  A2_financial: number;    // 1 - 50: Thiệt hại tài chính vĩ mô
  A3_legal: number;        // 1 - 50: Chế tài pháp lý & Kỷ luật
  A4_operational: number;  // 1 - 50: Gián đoạn hạ tầng & Dân sinh
}

export interface PressSeverityOutput {
  S: number;
  tier: 1 | 2 | 3 | 4 | 5;
  tierName: string;
  rawScore: number;
  dominantAxis: 'REPUTATION' | 'FINANCIAL' | 'LEGAL' | 'OPERATIONAL';
  axes: AxisBreakdown;
  gateTriggered: string | null;
  extractedFinancialAmountVND: number; // Đơn vị: Tỷ đồng
  matchedAnchorTitle: string;
  closestAnchorDescription?: string;
  reasoningSteps: string[];
}

interface PressAnchorBenchmark {
  S: number;
  title: string;
  vector: [number, number, number, number]; // [A1, A2, A3, A4]
  keywords: string[];
}

const PRESS_ANCHOR_BENCHMARKS: PressAnchorBenchmark[] = [
  { S: 1, title: 'Khen thưởng thi đua ngành định kỳ', vector: [1, 1, 1, 1], keywords: ['khen thưởng', 'thi đua', 'hoàn thành kế hoạch', 'biểu dương'] },
  { S: 6, title: 'Hải quan bắt hàng lậu cửa khẩu mẫu mực', vector: [5, 6, 8, 3], keywords: ['hải quan', 'bắt giữ', 'buôn lậu', 'nội bài', 'tân sơn nhất', 'iphone lậu'] },
  { S: 7, title: 'Truy thu thuế bán lẻ vi mô', vector: [6, 7, 9, 3], keywords: ['truy thu', 'trốn thuế', 'nhà hàng', 'hộ kinh doanh', 'không xuất hóa đơn'] },
  { S: 10, title: 'Kế hoạch thanh tra thường niên công khai', vector: [10, 5, 10, 5], keywords: ['kế hoạch thanh tra', 'thường niên', 'định kỳ năm'] },
  { S: 14, title: 'Hiệp hội kiến nghị giảm lệ phí trước bạ', vector: [16, 12, 10, 15], keywords: ['hiệp hội kiến nghị', 'lệ phí trước bạ', 'kích cầu'] },
  { S: 20, title: 'Đề xuất nới trần giá vé máy bay nội địa', vector: [22, 20, 10, 22], keywords: ['trần giá vé máy bay', 'cục quản lý giá', 'bộ gtvt', 'cpi'] },
  { S: 21, title: 'Dự thảo thuế TTĐB nước giải khát có đường', vector: [25, 22, 15, 24], keywords: ['thuế tiêu thụ đặc biệt', 'nước giải khát có đường', 'amcham', 'eurocham'] },
  { S: 26, title: 'Nghẽn hải quan VNACCS tại Cát Lái 4 tiếng', vector: [26, 25, 15, 35], keywords: ['vnaccs', 'cát lái', 'chậm thông quan', 'container', 'ùn ứ'] },
  { S: 30, title: 'Cổng thuế điện tử sập đúng hạn nộp báo cáo quý', vector: [32, 20, 20, 38], keywords: ['thuedientu', 'sập cổng', 'nghẽn mạng', 'hạn chót', 'kế toán bức xúc'] },
  { S: 31, title: 'Hàng trăm DN gỗ kêu cứu đọng vốn hoàn thuế nghìn tỷ', vector: [36, 40, 25, 38], keywords: ['hoàn thuế gtgt', 'dăm gỗ', 'đọng vốn nghìn tỷ', 'kêu cứu', 'xác minh nguồn gốc'] },
  { S: 34, title: 'Báo chí đối chiếu mâu thuẫn giải ngân 95% vs 42%', vector: [42, 35, 25, 35], keywords: ['giải ngân đầu tư công', 'thấp kỷ lục', 'cam kết 95%', 'địa phương kêu khó'] },
  { S: 35, title: 'VTV điều tra tiết kiệm biến thành bảo hiểm Bancassurance', vector: [44, 38, 35, 42], keywords: ['vtv điều tra', 'bancassurance', 'tiết kiệm biến thành', 'vây trụ sở', 'đòi tiền'] },
  { S: 36, title: 'Cây xăng đóng cửa diện rộng vì chi phí định mức', vector: [43, 39, 28, 45], keywords: ['cây xăng đóng cửa', 'chi phí định mức', 'hết xăng', 'kiến nghị thủ tướng'] },
  { S: 38, title: 'ĐBQH chất vấn trụ sở công quyền đất vàng bỏ hoang', vector: [46, 42, 32, 38], keywords: ['chất vấn', 'đại biểu quốc hội', 'trụ sở bỏ hoang', 'công sản', 'lãng phí'] },
  { S: 42, title: 'Cổng DVC Kho bạc tê liệt tuần khóa sổ cuối năm', vector: [45, 46, 35, 50], keywords: ['dịch vụ công kho bạc', 'tê liệt', 'khóa sổ ngân sách', 'kẹt tiền lương'] },
  { S: 45, title: 'C03 bắt tạm giam cán bộ Lãnh đạo Cục/Vụ nhận hối lộ', vector: [50, 40, 50, 30], keywords: ['c03', 'bắt tạm giam', 'lãnh đạo cục', 'nhận hối lộ', 'khởi tố cán bộ'] },
  { S: 48, title: 'BreachForums rao bán CSDL 5 triệu người nộp thuế', vector: [49, 45, 48, 50], keywords: ['breachforums', 'rao bán dữ liệu', '5 triệu', 'người nộp thuế', 'cccd'] },
  { S: 50, title: 'Văn bản mật giả mạo Thứ trưởng làm VN-Index rơi 45 điểm', vector: [50, 50, 50, 50], keywords: ['văn bản mật giả mạo', 'thứ trưởng bị khởi tố', 'vn-index rơi', 'bốc hơi 100.000 tỷ'] }
];

export class PressSeverityAlgorithmEngine {
  /**
   * Tính toán chính xác S in [1, 50] thuần túy từ văn bản cào được
   */
  public static calculateSFromCrawledText(article: CrawledArticleInput): PressSeverityOutput {
    const reasoning: string[] = [];
    const text = `${article.title} ${article.content}`.toLowerCase();
    const domain = (article.sourceDomain || '').toLowerCase();

    reasoning.push(`PHA 1: Khởi động bộ lọc cứng báo chí (Hard Gates) cho bài viết từ "${domain || 'Online Press'}".`);

    // =========================================================
    // PHA 1: KIỂM TRA HARD GATES BÁO CHÍ
    // =========================================================

    // CỔNG 1: Gate Cưỡng chế pháp luật định kỳ / Báo động giả (S <= 10)
    const isEnforcementVerb =
      (text.includes('bắt giữ') || text.includes('triệt phá') || text.includes('phát hiện') || text.includes('thu giữ') || text.includes('truy thu')) &&
      (text.includes('hải quan') || text.includes('buôn lậu') || text.includes('cửa khẩu') || text.includes('trốn thuế') || text.includes('hàng giả'));

    const isInternalCorruption =
      text.includes('cán bộ nhận hối lộ') ||
      text.includes('lãnh đạo cục bị bắt') ||
      text.includes('tham ô') ||
      text.includes('tiêu cực nội bộ');

    if (isEnforcementVerb && !isInternalCorruption) {
      let finalS = 7;
      if (text.includes('hải quan') || text.includes('cửa khẩu')) finalS = 6;
      else if (text.includes('kiểm toán viên')) finalS = 8;
      else if (text.includes('kế hoạch thanh tra')) finalS = 10;
      else if (text.includes('nhắc nhở')) finalS = 4;

      reasoning.push(`[HARD GATE 1: BẢO VỆ PHÁP LUẬT] Cơ quan nhà nước đóng vai trò thực thi trừng phạt bên ngoài -> Khóa S = ${finalS}`);
      return this.buildOutput(finalS, { A1_reputation: finalS, A2_financial: 6, A3_legal: finalS, A4_operational: 3 }, 'GATE_ENFORCEMENT_SHIELD', 0, reasoning, 'Thực thi pháp luật mẫu mực');
    }

    // CỔNG 2: Gate An ninh quốc gia / Tin giả mạo Lãnh đạo cấp cao (S >= 45)
    const isLeadershipRumor =
      (text.includes('thứ trưởng') || text.includes('bộ trưởng')) &&
      (text.includes('khởi tố') || text.includes('bắt tạm giam') || text.includes('văn bản mật') || text.includes('giả mạo'));

    const isMassiveBreach =
      (text.includes('rao bán') || text.includes('rò rỉ')) &&
      text.includes('dữ liệu') &&
      (text.includes('triệu người') || text.includes('cccd') || text.includes('breachforums'));

    const isSystemicCollapse =
      (text.includes('sàn hose') || text.includes('chứng khoán')) &&
      (text.includes('rơi tự do') || text.includes('ngừng khớp lệnh') || text.includes('bốc hơi 100.000 tỷ'));

    if (isLeadershipRumor || isMassiveBreach || isSystemicCollapse) {
      let finalS = 48;
      if (text.includes('vn-index') || text.includes('100.000 tỷ') || isLeadershipRumor) finalS = 50;

      reasoning.push(`[HARD GATE 2: AN NINH QUỐC GIA] Phát hiện bài báo xâm hại Lãnh đạo hoặc an ninh hệ thống tài chính -> Khóa S = ${finalS}`);
      return this.buildOutput(finalS, { A1_reputation: 50, A2_financial: 48, A3_legal: 50, A4_operational: 48 }, 'GATE_NATIONAL_SECURITY', 100000, reasoning, 'Khẩn cấp an ninh quốc gia');
    }

    // CỔNG 3: Gate Vòng đời dự thảo / Nghiên cứu học thuật (S in [11, 20])
    const isExploratoryDraft =
      (text.includes('dự thảo') || text.includes('lấy ý kiến') || text.includes('hội thảo') || text.includes('nghiên cứu') || text.includes('đề xuất')) &&
      !text.includes('bức xúc') && !text.includes('kêu cứu') && !text.includes('đọng vốn') && !text.includes('đình trệ');

    if (isExploratoryDraft) {
      let finalS = 15;
      if (text.includes('vé máy bay') || text.includes('trần giá')) finalS = 20;
      else if (text.includes('nước giải khát') || text.includes('đồ uống có đường')) finalS = 21;
      else if (text.includes('thông tư') || text.includes('học thuật')) finalS = 11;

      reasoning.push(`[HARD GATE 3: VÒNG ĐỜI DỰ THẢO] Báo chí đưa tin giai đoạn nghiên cứu lấy ý kiến chính sách -> Ép S trong [11, 21], gán S = ${finalS}`);
      return this.buildOutput(finalS, { A1_reputation: finalS, A2_financial: 15, A3_legal: 10, A4_operational: 12 }, 'GATE_POLICY_LIFECYCLE', 0, reasoning, 'Giai đoạn dự thảo chính sách');
    }

    // =========================================================
    // PHA 2: BÓC TÁCH 4 TRỤC RỦI RO BÁO CHÍ
    // =========================================================
    reasoning.push('PHA 2: Phân tích cú pháp báo chí & Regex để định lượng độc lập 4 trục rủi ro.');

    // 1. Trục Uy tín & Sức ép chính trị (A1)
    let A1 = 15;
    if (text.includes('chất vấn') || text.includes('đại biểu quốc hội') || text.includes('nghị trường')) {
      A1 = 46;
      reasoning.push('Trục A1: Báo chí phản ánh có sự tham gia chất vấn của Đại biểu Quốc hội tại nghị trường -> A1 = 46');
    } else if (text.includes('vtv') || text.includes('phóng sự điều tra') || text.includes('báo nhân dân') || text.includes('loạt bài điều tra')) {
      A1 = 42;
      reasoning.push('Trục A1: Phóng sự điều tra của VTV1 / Báo Nhân Dân nhập cuộc điều tra -> A1 = 42');
    } else if (text.includes('hiệp hội') && (text.includes('kêu cứu') || text.includes('kiến nghị khẩn cấp') || text.includes('gửi thủ tướng'))) {
      A1 = 36;
      reasoning.push('Trục A1: Hiệp hội ngành hàng lớn gửi đơn kêu cứu / kiến nghị vượt cấp lên Thủ tướng -> A1 = 36');
    } else if (text.includes('bức xúc') || text.includes('tranh cãi gay gắt') || text.includes('phản ứng dữ dội')) {
      A1 = 28;
    }

    // 2. Trục Kinh tế & Ngân sách (A2) - Regex bóc tách số tiền
    const extractedLossVND = this.extractFinancialLossVND(text);
    let A2 = 10;
    if (extractedLossVND >= 10000) {
      A2 = 49; // Hàng chục nghìn tỷ
      reasoning.push(`Trục A2: Regex bóc tách quy mô tài chính cực đại: ${extractedLossVND.toLocaleString()} tỷ đồng -> A2 = 49`);
    } else if (extractedLossVND >= 1000) {
      A2 = 44; // Hàng nghìn tỷ (ví dụ đọng vốn 1.200 tỷ)
      reasoning.push(`Trục A2: Regex bóc tách số tiền thiệt hại/ách tắc: ${extractedLossVND.toLocaleString()} tỷ đồng -> A2 = 44`);
    } else if (extractedLossVND >= 300) {
      A2 = 38; // Vài trăm tỷ (ví dụ chiếm dụng 300 tỷ Quỹ BOG)
      reasoning.push(`Trục A2: Regex bóc tách số tiền: ${extractedLossVND} tỷ đồng -> A2 = 38`);
    } else if (extractedLossVND >= 10) {
      A2 = 28;
    } else if (extractedLossVND > 0) {
      A2 = 16;
    } else {
      // Heuristic từ vựng tài chính
      if (text.includes('nghìn tỷ') || text.includes('tỷ usd')) A2 = 40;
      else if (text.includes('trăm tỷ')) A2 = 32;
      else if (text.includes('chục tỷ')) A2 = 25;
    }

    // 3. Trục Pháp lý & Chế tài công vụ (A3)
    let A3 = 10;
    if (text.includes('c03') || text.includes('bắt tạm giam') || text.includes('khởi tố vụ án') || text.includes('nhận hối lộ')) {
      A3 = 46;
      reasoning.push('Trục A3: Cơ quan Cảnh sát điều tra (C03) khởi tố, bắt tạm giam cán bộ -> A3 = 46');
    } else if (text.includes('kết luận thanh tra') || text.includes('xử lý kỷ luật') || text.includes('thất thoát tài sản')) {
      A3 = 35;
      reasoning.push('Trục A3: Báo chí trích dẫn Kết luận thanh tra chỉ ra sai phạm kỷ luật -> A3 = 35');
    } else if (text.includes('khiếu nại hành chính') || text.includes('hủy thầu') || text.includes('tranh chấp')) {
      A3 = 25;
    } else if (text.includes('chậm trễ') || text.includes('đọng vốn') || text.includes('vướng thủ tục')) {
      A3 = 20;
    }

    // 4. Trục Gián đoạn hạ tầng & Dân sinh (A4)
    let A4 = 10;
    if (text.includes('tê liệt') || text.includes('sập hệ thống') || text.includes('hết xăng') || text.includes('kho bạc nghẽn')) {
      A4 = 46;
      reasoning.push('Trục A4: Báo chí phản ánh tê liệt dịch vụ công / đứt gãy cung ứng thiết yếu -> A4 = 46');
    } else if (text.includes('đọng vốn') || text.includes('ùn ứ') || text.includes('container') || text.includes('hàng triệu người')) {
      A4 = 36;
      reasoning.push('Trục A4: Ách tắc chuỗi cung ứng hoặc ảnh hưởng diện rộng hàng triệu người -> A4 = 36');
    } else if (text.includes('quá tải') || text.includes('chậm nộp') || text.includes('hộ kinh doanh')) {
      A4 = 26;
    }

    const axes: AxisBreakdown = {
      A1_reputation: A1,
      A2_financial: A2,
      A3_legal: A3,
      A4_operational: A4
    };

    // =========================================================
    // PHA 3: HÀM TỔNG HỢP HIỂM HỌA ĐỈNH (PEAK HAZARD)
    // =========================================================
    const allAxes = [A1, A2, A3, A4];
    const maxA = Math.max(...allAxes);
    const sumOthers = allAxes.reduce((sum, v) => sum + v, 0) - maxA;
    const meanOthers = sumOthers / 3.0;

    const rawS = 0.70 * maxA + 0.30 * meanOthers;
    reasoning.push(`PHA 3: Peak Hazard = 0.70 * max(${maxA}) + 0.30 * mean(${meanOthers.toFixed(1)}) = ${rawS.toFixed(2)}`);

    // =========================================================
    // PHA 4: ANCHOR SNAPPING & KHÓA BIÊN
    // =========================================================
    const matchedAnchor = this.snapToPressAnchor(rawS, axes, text);
    const finalS = Math.min(50, Math.max(1, matchedAnchor.S));
    reasoning.push(`PHA 4: So khớp đặc trưng và neo vào Anchor: "${matchedAnchor.title}" -> Điểm S cuối cùng = ${finalS}`);

    return this.buildOutput(
      finalS,
      axes,
      null,
      extractedLossVND,
      reasoning,
      matchedAnchor.title,
      rawS
    );
  }

  /**
   * Regex bóc tách số tiền quy đổi ra TỶ ĐỒNG (Billion VND)
   */
  private static extractFinancialLossVND(text: string): number {
    // 1. Nghìn tỷ / ngàn tỷ
    const nghinTyRegex = /(\d+([\.,]\d+)?)\s*(nghìn tỷ|ngàn tỷ)/gi;
    const matchNghinTy = nghinTyRegex.exec(text);
    if (matchNghinTy) {
      return parseFloat(matchNghinTy[1].replace(',', '.')) * 1000;
    }

    // 2. Tỷ USD
    const usdRegex = /(\d+([\.,]\d+)?)\s*(tỷ usd|tỷ đô)/gi;
    const matchUsd = usdRegex.exec(text);
    if (matchUsd) {
      return parseFloat(matchUsd[1].replace(',', '.')) * 25000; // Quy đổi ~25.000 tỷ/tỷ USD
    }

    // 3. Tỷ đồng
    const tyRegex = /(\d+([\.,]\d+)?)\s*(tỷ đồng|tỷ)/gi;
    const matchTy = tyRegex.exec(text);
    if (matchTy) {
      return parseFloat(matchTy[1].replace(',', '.'));
    }

    // 4. Trăm tỷ
    const tramTyRegex = /(\d+([\.,]\d+)?)\s*trăm tỷ/gi;
    const matchTramTy = tramTyRegex.exec(text);
    if (matchTramTy) {
      return parseFloat(matchTramTy[1].replace(',', '.')) * 100;
    }

    // 5. Triệu đồng
    const trieuRegex = /(\d+([\.,]\d+)?)\s*triệu đồng/gi;
    const matchTrieu = trieuRegex.exec(text);
    if (matchTrieu) {
      return parseFloat(matchTrieu[1].replace(',', '.')) / 1000;
    }

    return 0;
  }

  /**
   * So khớp điểm thô với Anchor Case báo chí gần nhất
   */
  private static snapToPressAnchor(
    rawS: number,
    axes: AxisBreakdown,
    text: string
  ): PressAnchorBenchmark {
    let bestAnchor = PRESS_ANCHOR_BENCHMARKS[0];
    let minDistance = Number.MAX_VALUE;

    const currentVec = [axes.A1_reputation, axes.A2_financial, axes.A3_legal, axes.A4_operational];

    for (const anchor of PRESS_ANCHOR_BENCHMARKS) {
      // Khoảng cách số học Euclidean
      let dist = Math.pow(rawS - anchor.S, 2);
      for (let i = 0; i < 4; i++) {
        dist += Math.pow(currentVec[i] - anchor.vector[i], 2) * 0.5;
      }
      dist = Math.sqrt(dist);

      // Thưởng trùng khớp từ khóa báo chí
      let kwHits = 0;
      for (const kw of anchor.keywords) {
        if (text.includes(kw)) kwHits++;
      }
      const adjustedDist = dist - (kwHits * 3.5);

      if (adjustedDist < minDistance) {
        minDistance = adjustedDist;
        bestAnchor = anchor;
      }
    }

    return bestAnchor;
  }

  private static buildOutput(
    S: number,
    axes: AxisBreakdown,
    gateTriggered: string | null,
    extractedFinancialAmountVND: number,
    reasoningSteps: string[],
    matchedAnchorTitle: string,
    rawScore?: number
  ): PressSeverityOutput {
    let tier: 1 | 2 | 3 | 4 | 5 = 1;
    let tierName = 'Tầng 1: An toàn & Thực thi công vụ mẫu mực';

    if (S > 40) {
      tier = 5;
      tierName = 'Tầng 5: Đe dọa an ninh tài chính quốc gia & Khẩn cấp';
    } else if (S > 30) {
      tier = 4;
      tierName = 'Tầng 4: Tổn hại uy tín điều hành, VTV điều tra & ĐBQH chất vấn';
    } else if (S > 20) {
      tier = 3;
      tierName = 'Tầng 3: Điểm nghẽn thực thi chính sách & Xung đột diện rộng';
    } else if (S > 10) {
      tier = 2;
      tierName = 'Tầng 2: Tín hiệu yếu, Tranh luận học thuật & Dự thảo';
    }

    // Xác định trục thống trị (Dominant Axis)
    const pairs: ['REPUTATION' | 'FINANCIAL' | 'LEGAL' | 'OPERATIONAL', number][] = [
      ['REPUTATION', axes.A1_reputation],
      ['FINANCIAL', axes.A2_financial],
      ['LEGAL', axes.A3_legal],
      ['OPERATIONAL', axes.A4_operational]
    ];
    pairs.sort((a, b) => b[1] - a[1]);

    return {
      S,
      tier,
      tierName,
      rawScore: rawScore ? Math.round(rawScore * 10) / 10 : S,
      dominantAxis: pairs[0][0],
      axes,
      gateTriggered,
      extractedFinancialAmountVND,
      matchedAnchorTitle,
      closestAnchorDescription: matchedAnchorTitle,
      reasoningSteps
    };
  }
}
