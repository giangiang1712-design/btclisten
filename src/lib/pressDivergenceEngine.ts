/**
 * PURE PRESS DIVERGENCE COMPUTATION ENGINE (D in [0, 20])
 * Module tự động bóc tách độ vênh Narrative - Reality thuần túy từ văn bản báo chí
 * File: /src/lib/pressDivergenceEngine.ts
 */

export interface CrawledArticleInput {
  title: string;
  content: string;
  sourceDomain?: string;
  publishedAt?: string | Date;
}

export interface PressDivergenceOutput {
  D: number;
  rawScore: number;
  divergenceLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  levelDescription: string;
  narrativeDetected: boolean;
  speakerLevel: string;
  speakerWeight: number;
  contrastPivotDetected: string | null;
  axisScores: {
    D_num: number;    // Độ vênh số liệu đối đầu (%)
    D_time: number;   // Trễ hạn tiến độ bóc tách từ báo
    D_pol: number;    // Mâu thuẫn bản chất đạo đức / phát ngôn
  };
  attributionDiscount: number; // K_attr
  matchedAnchorTitle: string;
  closestAnchorCase?: {
    D: number;
    title: string;
    description: string;
  };
  weights?: {
    W_speaker: number;
    K_decay: number;
    K_attr: number;
  };
  reasoningSteps: string[];
}

interface PressDivergenceAnchor {
  D: number;
  title: string;
  keywords: string[];
}

const PRESS_DIVERGENCE_ANCHORS: PressDivergenceAnchor[] = [
  { D: 0, title: 'Tuyệt đối nhất quán / Không có cam kết', keywords: ['không có cam kết', 'bắt giữ', 'hải quan', 'buôn lậu', 'định kỳ'] },
  { D: 2, title: 'Sai lệch kỹ thuật vi mô', keywords: ['lệch nhẹ', 'phương sai', 'bảo trì thêm vài giờ'] },
  { D: 4, title: 'Trượt chỉ tiêu có báo trước', keywords: ['hụt nhẹ', 'trả thưởng đột xuất', 'giải trình trước'] },
  { D: 6, title: 'Chậm trễ thủ tục có cam kết lại', keywords: ['chậm nộp', 'kéo dài thêm vài ngày', 'đã xin lỗi'] },
  { D: 8, title: 'Hướng dẫn chưa theo kịp thực tế', keywords: ['lúng túng', 'nhiều chi nhánh', 'chờ công văn hướng dẫn'] },
  { D: 10, title: 'Đứt gãy hạ tầng số trái cam kết', keywords: ['thuedientu', 'sập cổng', 'nghẽn mạng', 'hạn chót', 'kế toán bức xúc'] },
  { D: 12, title: 'Chậm trễ tháo gỡ kiến nghị doanh nghiệp', keywords: ['kiến nghị kéo dài', 'chưa được giải quyết', 'chờ đợi'] },
  { D: 13, title: 'Hủy thầu mua sắm công trái mục tiêu', keywords: ['hủy thầu', 'gạo dự trữ', 'giá trần thấp'] },
  { D: 14, title: 'Báo chí điều tra sự mâu thuẫn hoàn thuế', keywords: ['hoàn thuế gtgt', 'dăm gỗ', 'đọng vốn nghìn tỷ', 'kêu cứu', 'khẳng định thông thoáng'] },
  { D: 15, title: 'Giải ngân đầu tư công trái ngược cam kết', keywords: ['giải ngân', 'thấp kỷ lục', 'cam kết 95%', 'địa phương kêu khó', 'vốn đầu tư công'] },
  { D: 16, title: 'Đứt gãy niềm tin Bancassurance', keywords: ['bancassurance', 'tiết kiệm biến thành bảo hiểm', 'vây trụ sở', 'lành mạnh'] },
  { D: 17, title: 'ĐBQH chất vấn công sản bỏ hoang', keywords: ['chất vấn', 'đại biểu quốc hội', 'công sản bỏ hoang', 'lãng phí', 'chống lãng phí'] },
  { D: 18, title: 'Đảo chiều phát ngôn cung ứng xăng dầu', keywords: ['cây xăng đóng cửa', 'hết xăng', 'nguồn cung dồi dào', 'chi phí định mức', 'kiến nghị thủ tướng'] },
  { D: 19, title: 'Rò rỉ CSDL trái cam kết an toàn số', keywords: ['breachforums', 'rao bán dữ liệu', '5 triệu', 'người nộp thuế', 'an toàn tuyệt đối'] },
  { D: 20, title: 'Phản bội niềm tin thể chế cực đại', keywords: ['c03', 'bắt tạm giam', 'nhận hối lộ', 'lãnh đạo cục', 'liêm chính', 'kỷ cương'] }
];

export class PressDivergenceAlgorithmEngine {
  // Danh mục liên từ đảo chiều kinh điển trong báo chí điều tra
  private static readonly CONTRAST_PIVOTS = [
    'tuy nhiên',
    'song trên thực tế',
    'song thực tế',
    'trái ngược với',
    'mặc dù',
    'nhưng thực tế',
    'trong khi đó',
    'thế nhưng',
    'đối lập với',
    'thực tế lại',
    'ngược lại'
  ];

  // Từ khóa nhận diện cam kết / tuyên ngôn
  private static readonly COMMITMENT_MARKERS = [
    'cam kết',
    'khẳng định',
    'quyết tâm',
    'đặt mục tiêu',
    'phấn đấu đạt',
    'yêu cầu toàn ngành',
    'hứa',
    'chỉ đạo quyết liệt',
    'thông thoáng',
    'liêm chính',
    'không có vùng cấm'
  ];

  /**
   * Tính toán chính xác biến số D in [0, 20] từ văn bản cào được
   */
  public static calculateDFromCrawledText(article: CrawledArticleInput): PressDivergenceOutput {
    const reasoning: string[] = [];
    const text = `${article.title} ${article.content}`.toLowerCase();

    reasoning.push(`PHA 1: Khởi động bộ phân tích cú pháp tương phản báo chí (Press Contrast NLP).`);

    // =========================================================
    // PHA 1: KIỂM TRA ZERO-NARRATIVE & NGƯỜI PHÁT NGÔN
    // =========================================================

    // 1. Quét danh xưng người phát ngôn được báo trích dẫn
    let speakerLevel = 'NONE';
    let speakerWeight = 0.0;

    if (text.includes('bộ trưởng') || text.includes('người đứng đầu bộ')) {
      speakerLevel = 'MINISTER';
      speakerWeight = 1.0;
      reasoning.push('Phát hiện bài báo trích dẫn cam kết/chỉ đạo của Bộ trưởng -> W_speaker = 1.0');
    } else if (text.includes('thứ trưởng')) {
      speakerLevel = 'VICE_MINISTER';
      speakerWeight = 0.85;
      reasoning.push('Phát hiện bài báo trích dẫn phát ngôn Thứ trưởng -> W_speaker = 0.85');
    } else if (text.includes('tổng cục trưởng') || text.includes('cục trưởng') || text.includes('vụ trưởng') || text.includes('tổng cục')) {
      speakerLevel = 'DEPARTMENT_HEAD';
      speakerWeight = 0.65;
      reasoning.push('Phát hiện bài báo trích dẫn Lãnh đạo cấp Cục/Vụ/Tổng cục -> W_speaker = 0.65');
    } else if (text.includes('chi cục') || text.includes('đại diện')) {
      speakerLevel = 'LOCAL_OFFICER';
      speakerWeight = 0.40;
    } else if (text.includes('ngành tài chính') || text.includes('kế hoạch đề ra') || text.includes('mục tiêu đề ra')) {
      speakerLevel = 'INSTITUTION_GENERAL';
      speakerWeight = 0.50;
    }

    // 2. Tìm kiếm liên từ tương phản
    let detectedPivot: string | null = null;
    for (const pivot of this.CONTRAST_PIVOTS) {
      if (text.includes(pivot)) {
        detectedPivot = pivot;
        break;
      }
    }

    // 3. Tìm kiếm từ khóa cam kết
    const hasCommitment = this.COMMITMENT_MARKERS.some(marker => text.includes(marker));

    // BỘ LỌC CỨNG: ZERO-NARRATIVE FILTER
    if ((speakerWeight === 0.0 && !hasCommitment) || (!detectedPivot && !hasCommitment)) {
      reasoning.push('[ZERO-NARRATIVE] Bài báo thuần túy tường thuật sự việc khách quan, không trích dẫn cam kết hoặc không có cấu trúc tương phản -> Khóa D = 0');
      return this.buildOutput(
        0,
        0,
        'NONE',
        'Tuyệt đối nhất quán / Không có cam kết được ghi nhận',
        false,
        speakerLevel,
        speakerWeight,
        null,
        { D_num: 0, D_time: 0, D_pol: 0 },
        1.0,
        'Không có cam kết',
        reasoning
      );
    }

    reasoning.push(`Phát hiện cấu trúc tương phản báo chí qua liên từ: "${detectedPivot || 'đối chiếu trực tiếp'}" kèm cam kết thể chế.`);

    // =========================================================
    // PHA 2: BÓC TÁCH 3 TRỤC ĐỘ VÊNH TỪ CÚ PHÁP VĂN BẢN
    // =========================================================
    reasoning.push('PHA 2: Phân tích cú pháp để đo lường 3 trục độ vênh (Định lượng, Tiến độ, Đạo đức).');

    // 1. TRỤC 1: ĐỘ VÊNH SỐ LIỆU ĐỐI ĐẦU (D_num)
    let D_num = 0;
    const numComparison = this.extractContrastingPercentages(text);
    if (numComparison) {
      const deltaRel = Math.abs(numComparison.target - numComparison.actual) / Math.max(numComparison.target, numComparison.actual);
      D_num = Math.min(20, Math.round(20 * Math.pow(deltaRel, 1.2)));
      reasoning.push(`Trục 1 (Số liệu): Báo chí đối chiếu mâu thuẫn ${numComparison.target}% vs ${numComparison.actual}% -> Delta=${(deltaRel * 100).toFixed(1)}% -> D_num = ${D_num}`);
    } else if (text.includes('95%') && (text.includes('42%') || text.includes('thấp kỷ lục') || text.includes('dưới 50%'))) {
      D_num = 15;
      reasoning.push('Trục 1 (Heuristic): Cam kết giải ngân 95% đối lập thực tế dưới 50% -> D_num = 15');
    }

    // 2. TRỤC 2: TRỄ HẠN TIẾN ĐỘ BÓC TÁCH TỪ BÁO (D_time)
    let D_time = 0;
    if (text.includes('lùi hạn lần thứ 3') || text.includes('chậm tiến độ trên 6 tháng') || text.includes('nhiều năm chưa xong')) {
      D_time = 18;
      reasoning.push('Trục 2 (Tiến độ): Báo chí bóc tách đình trệ cực hạn, lùi hạn nhiều lần -> D_time = 18');
    } else if (text.includes('đọng vốn kéo dài') || text.includes('kéo dài nhiều tháng') || text.includes('kêu cứu') || text.includes('quá hạn')) {
      D_time = 14;
      reasoning.push('Trục 2 (Tiến độ): Báo chí phản ánh tình trạng đọng vốn kéo dài nhiều tháng -> D_time = 14');
    } else if (text.includes('chậm trễ') || text.includes('chưa đồng đều') || text.includes('chậm nộp')) {
      D_time = 8;
    }

    // 3. TRỤC 3: MÂU THUẪN ĐẠO ĐỨC & TUYÊN NGÔN BẢN CHẤT (D_pol)
    let D_pol = 0;
    const isCorruptionConflict =
      (text.includes('liêm chính') || text.includes('chống tham nhũng') || text.includes('kỷ cương')) &&
      (text.includes('hối lộ') || text.includes('bắt tạm giam') || text.includes('c03') || text.includes('khởi tố cán bộ'));

    const isFuelConflict =
      (text.includes('nguồn cung dồi dào') || text.includes('đáp ứng đủ') || text.includes('kiểm soát tốt')) &&
      (text.includes('hết xăng') || text.includes('đóng cửa') || text.includes('cây xăng') || text.includes('treo biển'));

    const isTaxRefundConflict =
      (text.includes('thông thoáng') || text.includes('thuận lợi') || text.includes('đồng hành')) &&
      (text.includes('kêu cứu') || text.includes('đọng vốn nghìn tỷ') || text.includes('bức xúc'));

    const isBancaConflict =
      (text.includes('lành mạnh') || text.includes('đúng quy định')) &&
      (text.includes('bancassurance') || text.includes('tiết kiệm biến thành bảo hiểm') || text.includes('vây trụ sở'));

    const isPublicPropertyConflict =
      (text.includes('chống lãng phí') || text.includes('tiết kiệm')) &&
      (text.includes('công sản bỏ hoang') || text.includes('trụ sở bỏ hoang') || text.includes('chất vấn'));

    if (isCorruptionConflict) {
      D_pol = 20;
      reasoning.push('Trục 3 (Mâu thuẫn cực đại): Tuyên ngôn liêm chính đối lập trực tiếp hành vi nhận hối lộ bị khởi tố -> D_pol = 20');
    } else if (isFuelConflict) {
      D_pol = 18;
      reasoning.push('Trục 3: Cam kết nguồn cung dồi dào đối lập thực tế cây xăng đóng cửa diện rộng -> D_pol = 18');
    } else if (isPublicPropertyConflict) {
      D_pol = 17;
      reasoning.push('Trục 3: Cam kết chống lãng phí đối lập hàng nghìn trụ sở công quyền đất vàng bỏ hoang -> D_pol = 17');
    } else if (isBancaConflict) {
      D_pol = 16;
      reasoning.push('Trục 3: Khẳng định thị trường lành mạnh đối lập việc người dân vây trụ sở đòi tiền bảo hiểm -> D_pol = 16');
    } else if (isTaxRefundConflict) {
      D_pol = 14;
      reasoning.push('Trục 3: Tuyên bố thủ tục thông thoáng đối lập việc hiệp hội gửi đơn kêu cứu đọng vốn nghìn tỷ -> D_pol = 14');
    }

    // =========================================================
    // PHA 3: GIẢM TRỪ NGUYÊN NHÂN KHÁCH QUAN & TÍNH ĐIỂM THÔ
    // =========================================================
    reasoning.push('PHA 3: Bóc tách yếu tố nguyên nhân khách quan được báo chí trích dẫn.');

    let K_attr = 1.0;
    if (text.includes('thị trường thế giới') || text.includes('xung đột') || text.includes('bất khả kháng') || text.includes('bão lũ')) {
      K_attr = 0.35;
      reasoning.push('Báo chí nêu rõ nguyên nhân do biến động kinh tế toàn cầu / thiên tai bất khả kháng -> Giảm trừ K_attr = 0.35');
    } else if (text.includes('địa phương chậm') || text.includes('giải phóng mặt bằng') || text.includes('chủ đầu tư chậm nộp')) {
      K_attr = 0.70;
      reasoning.push('Báo chí chỉ ra lỗi hỗn hợp liên ngành và địa phương chậm giải phóng mặt bằng -> Giảm trừ K_attr = 0.70');
    }

    const effectiveSpeakerW = speakerWeight > 0 ? speakerWeight : 0.65;
    const coreD = Math.max(D_num, D_time, D_pol, 4); // Nếu đã vào pha tương phản, ít nhất có độ vênh cơ sở = 4
    const rawD = coreD * effectiveSpeakerW * K_attr;

    reasoning.push(`Điểm thô: D_raw = max(${D_num}, ${D_time}, ${D_pol}) * ${effectiveSpeakerW} (W_speaker) * ${K_attr} (K_attr) = ${rawD.toFixed(2)}`);

    // =========================================================
    // PHA 4: NEO ĐIỂM CHUẨN (ANCHOR SNAPPING) & KHÓA BIÊN
    // =========================================================
    const matchedAnchor = this.snapToDivergenceAnchor(rawD, text);
    const finalD = Math.min(20, Math.max(0, matchedAnchor.D));
    reasoning.push(`PHA 4: Neo vào mốc chuẩn Anchor: "${matchedAnchor.title}" -> Điểm D cuối cùng = ${finalD}`);

    let level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'NONE';
    let levelDesc = 'Không có độ vênh đáng kể';

    if (finalD >= 18) {
      level = 'CRITICAL';
      levelDesc = 'Phản bội cam kết cực đại: Nói một đằng làm một nẻo, sụp đổ niềm tin thể chế';
    } else if (finalD >= 14) {
      level = 'HIGH';
      levelDesc = 'Độ vênh nghiêm trọng: Báo chí lớn điều tra loạt bài, ĐBQH chất vấn nghị trường';
    } else if (finalD >= 8) {
      level = 'MEDIUM';
      levelDesc = 'Độ vênh trung bình: Chậm trễ tiến độ hoặc sai lệch chỉ tiêu thực thi';
    } else if (finalD > 0) {
      level = 'LOW';
      levelDesc = 'Độ vênh kỹ thuật vi mô: Chênh lệch nhỏ do phương sai thống kê';
    }

    return this.buildOutput(
      finalD,
      Math.round(rawD * 10) / 10,
      level,
      levelDesc,
      true,
      speakerLevel,
      effectiveSpeakerW,
      detectedPivot,
      { D_num, D_time, D_pol },
      K_attr,
      matchedAnchor.title,
      reasoning
    );
  }

  /**
   * Bóc tách hai con số phần trăm mâu thuẫn trong cùng ngữ cảnh
   */
  private static extractContrastingPercentages(text: string): { target: number; actual: number } | null {
    const regex = /(cam kết|quyết tâm|mục tiêu|khẳng định|kế hoạch)[^%\.\n]{0,80}?(?<target>\d+([\.,]\d+)?)\s*%(?:(?!cam kết).){0,140}?(tuy nhiên|song|nhưng|thực tế|đạt)[^%\.\n]{0,80}?(?<actual>\d+([\.,]\d+)?)\s*%/is;
    const match = regex.exec(text);

    if (match && match.groups) {
      const target = parseFloat(match.groups.target.replace(',', '.'));
      const actual = parseFloat(match.groups.actual.replace(',', '.'));
      return { target, actual };
    }

    // Fallback tìm 2 số % nằm gần liên từ tương phản
    const percentages = text.match(/(\d+[\.,]?\d*)\s*%/g);
    if (percentages && percentages.length >= 2) {
      for (const pivot of this.CONTRAST_PIVOTS) {
        if (text.includes(pivot)) {
          const p1 = parseFloat(percentages[0].replace('%', '').replace(',', '.').trim());
          const p2 = parseFloat(percentages[1].replace('%', '').replace(',', '.').trim());
          if (p1 !== p2) {
            return { target: Math.max(p1, p2), actual: Math.min(p1, p2) };
          }
        }
      }
    }

    return null;
  }

  /**
   * Ánh xạ điểm thô vào Anchor Case gần nhất
   */
  private static snapToDivergenceAnchor(rawD: number, text: string): PressDivergenceAnchor {
    let bestAnchor = PRESS_DIVERGENCE_ANCHORS[0];
    let minDiff = Number.MAX_VALUE;

    for (const anchor of PRESS_DIVERGENCE_ANCHORS) {
      let diff = Math.abs(rawD - anchor.D);

      // Thưởng trùng khớp từ khóa
      let hits = 0;
      for (const kw of anchor.keywords) {
        if (text.includes(kw)) hits++;
      }
      diff -= (hits * 1.8);

      if (diff < minDiff) {
        minDiff = diff;
        bestAnchor = anchor;
      }
    }

    return bestAnchor;
  }

  private static buildOutput(
    D: number,
    rawScore: number,
    divergenceLevel: PressDivergenceOutput['divergenceLevel'],
    levelDescription: string,
    narrativeDetected: boolean,
    speakerLevel: string,
    speakerWeight: number,
    contrastPivotDetected: string | null,
    axisScores: PressDivergenceOutput['axisScores'],
    attributionDiscount: number,
    matchedAnchorTitle: string,
    reasoningSteps: string[]
  ): PressDivergenceOutput {
    return {
      D,
      rawScore,
      divergenceLevel,
      levelDescription,
      narrativeDetected,
      speakerLevel,
      speakerWeight,
      contrastPivotDetected,
      axisScores,
      attributionDiscount,
      matchedAnchorTitle,
      closestAnchorCase: {
        D,
        title: matchedAnchorTitle,
        description: levelDescription
      },
      weights: {
        W_speaker: speakerWeight,
        K_decay: 1.0,
        K_attr: attributionDiscount
      },
      reasoningSteps
    };
  }
}
