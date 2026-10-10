/**
 * DIVERGENCE COMPUTATION ENGINE (D in [0, 20])
 * Module tính toán chính xác độ vênh Narrative - Reality ngành Tài chính
 * File: /src/lib/divergenceEngine.ts
 */

export interface NarrativePayload {
  speakerLevel?: 'MINISTER' | 'VICE_MINISTER' | 'DEPARTMENT_HEAD' | 'OFFICER' | 'NONE';
  statementDate?: string;      // Định dạng YYYY-MM-DD
  commitmentType?: 'QUANTITATIVE' | 'DEADLINE' | 'QUALITATIVE_INTEGRITY' | 'NONE';
  targetValue?: number;         // Giá trị con số đã hứa (VD: 95% vốn, 100% hồ sơ)
  targetUnit?: string;          // '%', 'ngày', 'tỷ'
  targetDeadline?: string;      // Hạn hoàn thành đã hứa (YYYY-MM-DD)
  statementText?: string;       // Nguyên văn câu phát ngôn/cam kết
}

export interface RealityPayload {
  actualDate?: string;          // Thời điểm phát sinh thực tế (YYYY-MM-DD)
  actualValue?: number;         // Giá trị con số thực tế đạt được (VD: 42%)
  actualDelayDays?: number;     // Số ngày trễ hạn thực tế
  attributionType?: 'INTERNAL_FULL' | 'SHARED' | 'EXOGENOUS_MARKET' | 'FORCE_MAJEURE';
  realitySummary: string;       // Tóm tắt diễn biến thực tế từ bài viết báo chí
}

export interface DivergenceEvaluationOutput {
  D: number;                    // Điểm cuối cùng: Số nguyên từ 0 đến 20
  rawScore: number;             // Điểm số thực trước khi làm tròn/snapping
  divergenceLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  levelDescription: string;
  axisScores: {
    D_num: number;              // 0 - 20: Độ vênh định lượng
    D_time: number;             // 0 - 20: Độ lệch tiến độ
    D_pol: number;              // 0 - 20: Mâu thuẫn bản chất đạo đức/hành vi
  };
  weights: {
    W_speaker: number;
    K_decay: number;
    K_attr: number;
  };
  narrativeDetected: boolean;
  closestAnchorCase: {
    D: number;
    title: string;
    description: string;
  };
  reasoningSteps: string[];
}

interface DivergenceAnchor {
  D: number;
  title: string;
  description: string;
  keywords: string[];
}

const DIVERGENCE_ANCHORS: DivergenceAnchor[] = [
  { D: 0, title: 'Tuyệt đối nhất quán', description: 'Không có cam kết hoặc lời nói khớp thực tế hoàn hảo', keywords: ['không có cam kết', 'bắt buôn lậu', 'định kỳ'] },
  { D: 1, title: 'Sai lệch kỹ thuật vi mô', description: 'Chênh lệch con số < 3%, do phương sai làm tròn thống kê', keywords: ['lệch nhẹ', 'sai số nhỏ'] },
  { D: 2, title: 'Trễ hạn khách quan ngắn', description: 'Trễ hạn < 5 ngày trong nội bộ giải quyết thủ tục, không gây thiệt hại', keywords: ['trễ hạn 2 ngày', 'chậm 1 ngày', 'chậm 3 ngày'] },
  { D: 3, title: 'Khác biệt giải thích kỹ thuật', description: 'Tranh luận câu chữ thông tư, không sai lệch nghĩa vụ', keywords: ['học thuật', 'câu chữ', 'khái niệm'] },
  { D: 4, title: 'Lệch chỉ tiêu vi mô có báo trước', description: 'Chỉ tiêu ngành trượt nhẹ (3 - 7%), đơn vị đã chủ động có báo cáo giải trình', keywords: ['trượt nhẹ', 'hụt nhẹ'] },
  { D: 5, title: 'Trễ hạn có cam kết lại', description: 'Trễ hạn thủ tục 10 - 15 ngày, cơ quan đã chủ động gửi văn bản xin lỗi', keywords: ['gia hạn', 'lùi lịch', 'chậm nộp'] },
  { D: 6, title: 'Lệch số liệu mức độ nhỏ', description: 'Sai lệch 10-15%, phát sinh băn khoăn nhẹ', keywords: ['hơi chậm', 'chưa đồng đều', 'cần cải thiện'] },
  { D: 7, title: 'Hướng dẫn chưa theo kịp nhu cầu', description: 'Lãnh đạo chỉ đạo thông thoáng nhưng thực tế phát sinh nhiều hướng dẫn phụ', keywords: ['thông thoáng', 'lúng túng', 'chưa thống nhất'] },
  { D: 8, title: 'Cam kết thời gian bị phá vỡ', description: 'Đặt hạn hoàn thành trước 31/12, nhưng thực tế phải gia hạn sang năm sau', keywords: ['31/12', 'phá vỡ', 'không kịp hạn'] },
  { D: 9, title: 'Đứt gãy kỹ thuật trái cam kết', description: 'Cam kết hệ thống 24/7 nhưng nghẽn mạng nhiều giờ', keywords: ['nghẽn mạng', 'quá tải', 'không nộp được', 'hạn chót', 'sập cổng'] },
  { D: 10, title: 'Lệch chỉ tiêu vĩ mô trung bình', description: 'Cam kết và thực tế sai lệch từ 20 - 30%, các bên bắt đầu đùn đẩy trách nhiệm', keywords: ['đùn đẩy', 'tranh cãi trách nhiệm', 'chỉ tiêu vĩ mô'] },
  { D: 11, title: 'Chậm tháo gỡ kiến nghị', description: 'Lãnh đạo hứa tháo gỡ ngay nhưng nhiều tuần chưa có văn bản chính thức', keywords: ['chưa tháo gỡ', 'kiến nghị chậm', 'doanh nghiệp fdi'] },
  { D: 12, title: 'Nghịch lý chi phí định mức', description: 'Cam kết hài hòa nhưng cơ chế gây lỗ doanh nghiệp', keywords: ['cây xăng', 'đóng cửa', 'hết xăng', 'chi phí định mức'] },
  { D: 13, title: 'Hủy thầu mua sắm dự trữ', description: 'Bảo đảm an ninh lương thực nhưng định giá trần quá thấp', keywords: ['hủy thầu', 'gạo dự trữ', 'giá trần'] },
  { D: 14, title: 'Báo chí điều tra sự mâu thuẫn', description: 'Khẳng định thông thoáng nhưng doanh nghiệp đọng vốn nghìn tỷ', keywords: ['hoàn thuế vat', 'dăm gỗ', 'kêu cứu', 'đọng vốn'] },
  { D: 15, title: 'Giải ngân đầu tư công trái cam kết', description: 'Cam kết trên 95% nhưng thực tế dưới 45%', keywords: ['giải ngân', 'thấp kỷ lục', 'địa phương kêu khó', 'vốn đầu tư công'] },
  { D: 16, title: 'Đứt gãy niềm tin Bancassurance', description: 'Tuyên bố thị trường lành mạnh nhưng dân bị ép mua bảo hiểm', keywords: ['bancassurance', 'tiết kiệm biến thành', 'vây trụ sở', 'ép mua'] },
  { D: 17, title: 'ĐBQH chất vấn nghị trường', description: 'Báo cáo quản lý tốt nhưng đất vàng trụ sở bỏ hoang', keywords: ['chất vấn', 'đại biểu quốc hội', 'công sản', 'lãng phí', 'bỏ hoang'] },
  { D: 18, title: 'Đảo chiều phát ngôn nghiêm trọng', description: 'Cam kết ổn định nhưng thị trường tê liệt diện rộng', keywords: ['hết hàng', 'kiến nghị thủ tướng', 'khủng hoảng cung ứng', 'tê liệt toàn diện'] },
  { D: 19, title: 'Rò rỉ dữ liệu trái cam kết an toàn', description: 'Vinh danh an ninh số nhưng dữ liệu bị hacker rao bán', keywords: ['breachforums', 'rao bán dữ liệu', 'rò rỉ', '5 triệu', 'người nộp thuế'] },
  { D: 20, title: 'Phản bội niềm tin thể chế cực đại', description: 'Tuyên bố liêm chính nhưng lãnh đạo nhận hối lộ bị khởi tố', keywords: ['nhận hối lộ', 'bắt tạm giam', 'c03', 'lãnh đạo cục', 'khởi tố bị can'] }
];

export class DivergenceAlgorithmEngine {
  /**
   * Tính toán toàn diện biến số D
   */
  public static calculateD(
    narrative?: NarrativePayload,
    reality?: RealityPayload
  ): DivergenceEvaluationOutput {
    const reasoning: string[] = [];
    const realityText = (reality?.realitySummary || '').toLowerCase();
    const narrativeText = (narrative?.statementText || '').toLowerCase();
    const combinedText = `${narrativeText} ${realityText}`;

    reasoning.push('PHA 1: Kiểm tra tính hiện hữu của Narrative & cấp độ ràng buộc.');

    // 1. Kiểm tra trường hợp KHÔNG CÓ NARRATIVE (Default: D = 0)
    const hasNarrative = Boolean(
      narrative &&
      (narrative.statementText || narrative.targetValue !== undefined || narrative.speakerLevel)
    );

    if (!hasNarrative) {
      reasoning.push('[ZERO-NARRATIVE] Không phát hiện cam kết/phát ngôn chỉ đạo nào được ghi nhận -> Gán D = 0.');
      return this.buildResult(
        0,
        0,
        { D_num: 0, D_time: 0, D_pol: 0 },
        { W_speaker: 0, K_decay: 1, K_attr: 1 },
        false,
        reasoning,
        DIVERGENCE_ANCHORS[0]
      );
    }

    // 2. Xác định Trọng số Người phát ngôn W_speaker
    let W_speaker = 0.65; // Mặc định cấp Cục/Vụ
    switch (narrative?.speakerLevel) {
      case 'MINISTER': W_speaker = 1.0; break;
      case 'VICE_MINISTER': W_speaker = 0.85; break;
      case 'DEPARTMENT_HEAD': W_speaker = 0.65; break;
      case 'OFFICER': W_speaker = 0.40; break;
      case 'NONE': W_speaker = 0.0; break;
      default:
        // Heuristic từ ngữ phát ngôn
        if (narrativeText.includes('bộ trưởng') || combinedText.includes('bộ trưởng')) W_speaker = 1.0;
        else if (narrativeText.includes('thứ trưởng') || combinedText.includes('thứ trưởng')) W_speaker = 0.85;
        else if (narrativeText.includes('cục trưởng') || narrativeText.includes('vụ trưởng')) W_speaker = 0.65;
        break;
    }
    reasoning.push(`Xác định cấp thẩm quyền phát ngôn: Trọng số W_speaker = ${W_speaker}.`);

    // =========================================================
    // PHA 2: TÍNH TOÁN 3 TRỤC ĐỘ VÊNH
    // =========================================================
    reasoning.push('PHA 2: Phân tích 3 trục độ vênh (Định lượng, Tiến độ, Đạo đức/Hành vi).');

    // TRỤC 1: ĐỘ VÊNH ĐỊNH LƯỢNG (D_num)
    let D_num = 0;
    if (narrative?.targetValue !== undefined && reality?.actualValue !== undefined) {
      const maxVal = Math.max(narrative.targetValue, reality.actualValue);
      if (maxVal > 0) {
        const deltaRel = Math.abs(narrative.targetValue - reality.actualValue) / maxVal;
        D_num = Math.min(20, Math.round(20 * Math.pow(deltaRel, 1.2)));
        reasoning.push(`Trục 1 (Số liệu): Mục tiêu=${narrative.targetValue}, Thực tế=${reality.actualValue} -> Delta=${(deltaRel*100).toFixed(1)}% -> D_num = ${D_num}`);
      }
    } else {
      // Heuristic bóc tách tự động con số giải ngân
      if (combinedText.includes('95%') && (combinedText.includes('42%') || combinedText.includes('thấp kỷ lục') || combinedText.includes('dưới 50%'))) {
        D_num = 15;
        reasoning.push('Trục 1 (Heuristic): Phát hiện mâu thuẫn chỉ đạo giải ngân 95% nhưng thực tế dưới 50% -> D_num = 15.');
      }
    }

    // TRỤC 2: ĐỘ LỆCH TIẾN ĐỘ & HẠN ĐỊNH (D_time)
    let D_time = 0;
    if (reality?.actualDelayDays !== undefined) {
      const delay = reality.actualDelayDays;
      if (delay <= 0) D_time = 0;
      else if (delay <= 15) D_time = 4;
      else if (delay <= 45) D_time = 8;
      else if (delay <= 90) D_time = 14;
      else D_time = 18;
      reasoning.push(`Trục 2 (Tiến độ): Trễ hạn ${delay} ngày -> D_time = ${D_time}`);
    } else {
      if (combinedText.includes('chậm tiến độ 6 tháng') || combinedText.includes('lùi hạn lần 3')) D_time = 16;
      else if (combinedText.includes('chậm nộp') || combinedText.includes('trễ hạn')) D_time = 6;
    }

    // TRỤC 3: ĐẢO CỰC BẢN CHẤT HÀNH ĐỘNG / ĐẠO ĐỨC (D_pol)
    let D_pol = 0;
    const isCorruptionContradiction =
      (narrativeText.includes('liêm chính') || narrativeText.includes('chống tham nhũng') || narrativeText.includes('kỷ cương')) &&
      (realityText.includes('nhận hối lộ') || realityText.includes('bắt tạm giam') || realityText.includes('c03'));

    const isFuelCrisisContradiction =
      (narrativeText.includes('đủ nguồn cung') || narrativeText.includes('đáp ứng')) &&
      (realityText.includes('hết xăng') || realityText.includes('đóng cửa') || realityText.includes('cây xăng'));

    const isSystemSafetyContradiction =
      (narrativeText.includes('an toàn') || narrativeText.includes('bảo mật')) &&
      (realityText.includes('rao bán dữ liệu') || realityText.includes('rò rỉ') || realityText.includes('breachforums'));

    const isTaxRefundContradiction =
      (narrativeText.includes('thông thoáng') || narrativeText.includes('cải cách')) &&
      (realityText.includes('đọng vốn') || realityText.includes('kêu cứu') || realityText.includes('hàng nghìn tỷ'));

    if (isCorruptionContradiction) {
      D_pol = 20;
      reasoning.push('Trục 3 (Mâu thuẫn cực đại): Cam kết liêm chính đối lập hoàn toàn với hành vi nhận hối lộ bị khởi tố -> D_pol = 20.');
    } else if (isFuelCrisisContradiction) {
      D_pol = 18;
      reasoning.push('Trục 3: Cam kết bảo đảm nguồn cung nhưng cây xăng tê liệt toàn đô thị -> D_pol = 18.');
    } else if (isSystemSafetyContradiction) {
      D_pol = 19;
      reasoning.push('Trục 3: Cam kết an toàn bảo mật nhưng CSDL hàng triệu dân bị rao bán -> D_pol = 19.');
    } else if (isTaxRefundContradiction) {
      D_pol = 14;
      reasoning.push('Trục 3: Tuyên bố thông thoáng nhưng doanh nghiệp xuất khẩu kêu cứu vì đọng vốn -> D_pol = 14.');
    } else if (combinedText.includes('bancassurance') || combinedText.includes('tiết kiệm biến thành')) {
      D_pol = 16;
      reasoning.push('Trục 3: Thị trường lành mạnh đối lập thực tế người dân bị ép mua bảo hiểm -> D_pol = 16.');
    } else if (combinedText.includes('trụ sở bỏ hoang') && combinedText.includes('chất vấn')) {
      D_pol = 17;
      reasoning.push('Trục 3: Cam kết chống lãng phí nhưng hàng nghìn công sản đất vàng bỏ hoang -> D_pol = 17.');
    }

    // =========================================================
    // PHA 3: GIẢM TRỪ THỜI GIAN & YẾU TỐ NGOẠI CẢNH
    // =========================================================
    reasoning.push('PHA 3: Áp dụng hệ số suy giảm thời gian (K_decay) & quy kết ngoại cảnh (K_attr).');

    // 1. K_decay theo thời gian
    let K_decay = 1.0;
    if (narrative?.statementDate && reality?.actualDate) {
      const diffMs = Math.abs(new Date(reality.actualDate).getTime() - new Date(narrative.statementDate).getTime());
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays <= 30) K_decay = 1.0;
      else if (diffDays <= 90) K_decay = 0.85;
      else if (diffDays <= 180) K_decay = 0.65;
      else K_decay = 0.40;
      reasoning.push(`Khoảng cách phát ngôn - thực tế: ${Math.round(diffDays)} ngày -> K_decay = ${K_decay}`);
    }

    // 2. K_attr theo nguyên nhân
    let K_attr = 1.0;
    switch (reality?.attributionType) {
      case 'INTERNAL_FULL': K_attr = 1.0; break;
      case 'SHARED': K_attr = 0.70; break;
      case 'EXOGENOUS_MARKET': K_attr = 0.35; break;
      case 'FORCE_MAJEURE': K_attr = 0.10; break;
      default:
        if (realityText.includes('chiến tranh') || realityText.includes('tỷ giá fed') || realityText.includes('bão lũ')) {
          K_attr = 0.35;
          reasoning.push('Phát hiện yếu tố bất khả kháng/biến động kinh tế toàn cầu -> Giảm trừ trách nhiệm K_attr = 0.35.');
        } else if (realityText.includes('địa phương chậm') || realityText.includes('chủ đầu tư chưa nộp')) {
          K_attr = 0.70;
          reasoning.push('Lỗi hỗn hợp liên ngành/địa phương -> Giảm trừ K_attr = 0.70.');
        }
        break;
    }

    // Tính điểm thô D_raw
    const maxCoreD = Math.max(D_num, D_time, D_pol);
    const rawD = maxCoreD * W_speaker * K_decay * K_attr;
    reasoning.push(`D_raw = max(${D_num}, ${D_time}, ${D_pol}) * ${W_speaker} * ${K_decay} * ${K_attr} = ${rawD.toFixed(2)}`);

    // =========================================================
    // PHA 4: ANCHOR POINT SNAPPING & GÁN KẾT QUẢ CUỐI CÙNG
    // =========================================================
    reasoning.push('PHA 4: Ánh xạ và neo điểm vào 21 Anchor Points chuẩn hóa.');
    const matchedAnchor = this.snapToDivergenceAnchor(rawD, combinedText);
    const finalD = Math.max(0, Math.min(20, matchedAnchor.D));
    reasoning.push(`Neo vào Anchor Case: "${matchedAnchor.title}" -> Giá trị D cuối cùng = ${finalD}`);

    return this.buildResult(
      finalD,
      rawD,
      { D_num, D_time, D_pol },
      { W_speaker, K_decay, K_attr },
      true,
      reasoning,
      matchedAnchor
    );
  }

  /**
   * So khớp điểm thô với Anchor Case gần nhất
   */
  private static snapToDivergenceAnchor(rawD: number, combinedText: string): DivergenceAnchor {
    let bestAnchor = DIVERGENCE_ANCHORS[0];
    let minDiff = Number.MAX_VALUE;

    for (const anchor of DIVERGENCE_ANCHORS) {
      // Khoảng cách số học
      let diff = Math.abs(rawD - anchor.D);

      // Thưởng điểm tương đồng từ khóa
      let kwHits = 0;
      for (const kw of anchor.keywords) {
        if (combinedText.includes(kw)) kwHits++;
      }
      diff -= (kwHits * 1.5);

      if (diff < minDiff) {
        minDiff = diff;
        bestAnchor = anchor;
      }
    }

    return bestAnchor;
  }

  /**
   * Đóng gói kết quả đầu ra
   */
  private static buildResult(
    finalD: number,
    rawScore: number,
    axisScores: { D_num: number; D_time: number; D_pol: number },
    weights: { W_speaker: number; K_decay: number; K_attr: number },
    narrativeDetected: boolean,
    reasoning: string[],
    anchor: DivergenceAnchor
  ): DivergenceEvaluationOutput {
    let divergenceLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'NONE';
    let levelDescription = 'Không có độ vênh Narrative - Reality (Nhất quán hoàn hảo)';

    if (finalD >= 18) {
      divergenceLevel = 'CRITICAL';
      levelDescription = 'Khủng hoảng phản bội cam kết cực đại: Nói một đằng làm một nẻo, sụp đổ niềm tin thể chế';
    } else if (finalD >= 14) {
      divergenceLevel = 'HIGH';
      levelDescription = 'Độ vênh nghiêm trọng: Cam kết chỉ đạo trái ngược số liệu, VTV điều tra & ĐBQH chất vấn';
    } else if (finalD >= 8) {
      divergenceLevel = 'MEDIUM';
      levelDescription = 'Độ vênh trung bình: Chậm trễ tiến độ hoặc sai lệch chỉ tiêu gây lúng túng thực thi';
    } else if (finalD > 0) {
      divergenceLevel = 'LOW';
      levelDescription = 'Độ vênh kỹ thuật vi mô: Chênh lệch nhẹ do phương sai thống kê hoặc diễn giải văn bản';
    }

    return {
      D: finalD,
      rawScore: Math.round(rawScore * 10) / 10,
      divergenceLevel,
      levelDescription,
      axisScores,
      weights,
      narrativeDetected,
      closestAnchorCase: {
        D: anchor.D,
        title: anchor.title,
        description: anchor.description
      },
      reasoningSteps: reasoning
    };
  }
}
