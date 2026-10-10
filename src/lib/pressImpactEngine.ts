/**
 * PURE PRESS IMPACT COMPUTATION ENGINE (I in [0.1, 1.0])
 * Module tự động bóc tách quy mô đối tượng chịu tác động thể chế từ bài báo cào trên mạng
 * File: /src/lib/pressImpactEngine.ts
 */

export interface CrawledArticleInput {
  title: string;
  content: string;
  sourceDomain?: string;
  publishedAt?: string | Date;
}

export interface PressImpactOutput {
  I: number;
  rawScore: number;
  impactLevel: 'MICRO' | 'LOCAL' | 'SECTOR' | 'INDUSTRY_WIDE' | 'POPULATION_WIDE' | 'NATIONAL_SYSTEMIC';
  levelDescription: string;
  axes: {
    I_entity: number;     // Quy mô danh từ tập hợp
    I_headcount: number;  // Quy mô con số trích xuất bằng Regex
    I_geo: number;        // Phạm vi địa lý hành chính
    I_policy: number;     // Tính chất bắt buộc của loại hình chính sách
  };
  gateTriggered: string | null;
  extractedHeadcount: number | null;
  matchedAnchorTitle: string;
  reasoningSteps: string[];
}

interface ImpactAnchorBenchmark {
  I: number;
  level: PressImpactOutput['impactLevel'];
  title: string;
  keywords: string[];
}

const IMPACT_ANCHOR_BENCHMARKS: ImpactAnchorBenchmark[] = [
  { I: 0.10, level: 'MICRO', title: 'Cá lẻ / Vi mô cô lập', keywords: ['01 đối tượng', 'hành khách', 'cá nhân', 'cửa hàng', 'quán ăn', 'chi cục'] },
  { I: 0.25, level: 'LOCAL', title: 'Cục bộ một đơn vị / Dự án nhỏ', keywords: ['dự án nhỏ', 'kiểm toán viên', 'xã', 'huyện', 'chi nhánh'] },
  { I: 0.50, level: 'SECTOR', title: 'Địa phương / Ngành chuyên biệt', keywords: ['cát lái', 'bệnh viện công', 'dự trữ khu vực', 'thẩm định giá', 'vật tư y tế'] },
  { I: 0.75, level: 'INDUSTRY_WIDE', title: 'Toàn bộ ngành hàng / Khối FDI', keywords: ['hiệp hội gỗ', 'xuất khẩu', 'fdi', 'amcham', 'eurocham', 'doanh nghiệp xuất nhập khẩu'] },
  { I: 0.90, level: 'POPULATION_WIDE', title: 'Số đông đại chúng / Chuỗi huyết mạch', keywords: ['hộ kinh doanh', 'tiểu thương', 'cây xăng', 'xăng dầu', 'bancassurance', 'tiết kiệm'] },
  { I: 1.00, level: 'NATIONAL_SYSTEMIC', title: 'Toàn quốc / Thị trường vốn vĩ mô', keywords: ['thuế thu nhập cá nhân', 'giảm trừ gia cảnh', 'chứng khoán', 'vn-index', 'toàn quốc', 'toàn bộ nền kinh tế', '5 triệu', 'csdl'] }
];

export class PressImpactAlgorithmEngine {
  /**
   * Tính toán chính xác biến số I in [0.1, 1.0] thuần túy từ văn bản cào được
   */
  public static calculateIFromCrawledText(article: CrawledArticleInput): PressImpactOutput {
    const reasoning: string[] = [];
    const text = `${article.title} ${article.content}`.toLowerCase();

    reasoning.push('PHA 1: Khởi động bộ phân tích quy mô tác động thể chế (Press Impact NLP).');

    // =========================================================
    // PHA 1: KIỂM TRA HARD GATES QUY MÔ
    // =========================================================

    // CỔNG 1: Gate Vi mô cô lập (I <= 0.20)
    const isMicroTarget =
      (text.includes('01 cá nhân') || text.includes('hành khách') || text.includes('01 cửa hàng') || text.includes('quán ăn') || text.includes('hộ kinh doanh cá thể lẻ')) &&
      !text.includes('toàn quốc') && !text.includes('thông tư') && !text.includes('chính sách') && !text.includes('hàng triệu');

    const isRoutineEnforcementOnly =
      (text.includes('hải quan') && text.includes('bắt giữ') && !text.includes('ách tắc')) ||
      (text.includes('truy thu') && text.includes('cửa hàng'));

    if (isMicroTarget || (isRoutineEnforcementOnly && !text.includes('hiệp hội'))) {
      const finalI = 0.10;
      reasoning.push(`[HARD GATE 1: QUY MÔ VI MÔ CÔ LẬP] Sự việc chỉ tác động tới 01 đối tượng/vụ việc vi mô riêng lẻ -> Khóa trần I = ${finalI}`);
      return this.buildOutput(finalI, finalI, 'MICRO', 'Cá lẻ / Vi mô cô lập', { I_entity: 0.1, I_headcount: 0.1, I_geo: 0.15, I_policy: 0.1 }, 'GATE_MICRO_ISOLATED', null, 'Cá lẻ / Vi mô cô lập', reasoning);
    }

    // CỔNG 2: Gate Toàn dân / Hệ thống vĩ mô (I >= 0.90)
    const isNationalSystemic =
      text.includes('thuế thu nhập cá nhân') ||
      text.includes('giảm trừ gia cảnh') ||
      text.includes('vn-index') ||
      text.includes('toàn bộ nền kinh tế') ||
      text.includes('người làm công ăn lương') ||
      text.includes('5 triệu người nộp thuế') ||
      (text.includes('cây xăng') && (text.includes('đóng cửa diện rộng') || text.includes('tê liệt')));

    if (isNationalSystemic) {
      const finalI = (text.includes('thuế thu nhập cá nhân') || text.includes('vn-index') || text.includes('5 triệu')) ? 1.00 : 0.90;
      reasoning.push(`[HARD GATE 2: TOÀN DÂN / HỆ THỐNG VĨ MÔ] Vấn đề tác động tới toàn bộ người dân, thị trường vốn hoặc năng lượng thiết yếu -> Ép I = ${finalI}`);
      return this.buildOutput(finalI, finalI, finalI === 1.0 ? 'NATIONAL_SYSTEMIC' : 'POPULATION_WIDE', 'Toàn quốc / Thị trường vốn vĩ mô', { I_entity: finalI, I_headcount: finalI, I_geo: 1.0, I_policy: 1.0 }, 'GATE_NATIONAL_SYSTEMIC', null, 'Toàn quốc / Thị trường vốn vĩ mô', reasoning);
    }

    // =========================================================
    // PHA 2: BÓC TÁCH 4 TRỤC QUY MÔ
    // =========================================================
    reasoning.push('PHA 2: Phân tích cú pháp để đo lường độc lập 4 trục quy mô tác động.');

    // 1. TRỤC 1: QUY MÔ THỰC THỂ ĐỐI TƯỢNG XÃ HỘI (I_entity)
    let I_entity = 0.35;
    if (text.includes('người nộp thuế trên cả nước') || text.includes('người dân') || text.includes('người tiêu dùng') || text.includes('nhà đầu tư chứng khoán')) {
      I_entity = 1.00;
      reasoning.push('Trục 1 (Thực thể): Đối tượng là người dân / người nộp thuế toàn quốc -> I_entity = 1.00');
    } else if (text.includes('hộ kinh doanh') || text.includes('tiểu thương') || text.includes('cộng đồng doanh nghiệp') || text.includes('doanh nghiệp nhỏ và vừa')) {
      I_entity = 0.85;
      reasoning.push('Trục 1 (Thực thể): Đối tượng là hàng triệu hộ kinh doanh / cộng đồng doanh nghiệp -> I_entity = 0.85');
    } else if (text.includes('hiệp hội') || text.includes('doanh nghiệp xuất nhập khẩu') || text.includes('khối fdi') || text.includes('ngành gỗ') || text.includes('doanh nghiệp bảo hiểm')) {
      I_entity = 0.70;
      reasoning.push('Trục 1 (Thực thể): Đối tượng là các hiệp hội ngành hàng lớn / doanh nghiệp xuất nhập khẩu -> I_entity = 0.70');
    } else if (text.includes('bệnh viện công') || text.includes('chủ đầu tư') || text.includes('đơn vị thẩm định') || text.includes('dự trữ nhà nước')) {
      I_entity = 0.50;
      reasoning.push('Trục 1 (Thực thể): Đối tượng là nhóm chuyên ngành hẹp / chủ đầu tư công -> I_entity = 0.50');
    } else if (text.includes('một số doanh nghiệp') || text.includes('chi nhánh') || text.includes('chi cục')) {
      I_entity = 0.25;
    }

    // 2. TRỤC 2: REGEX BÓC TÁCH CON SỐ HEADCOUNT (I_headcount)
    const extractedHeadcount = this.extractHeadcountCount(text);
    let I_headcount = 0.30;
    if (extractedHeadcount !== null) {
      if (extractedHeadcount >= 1000000) {
        I_headcount = 1.00;
        reasoning.push(`Trục 2 (Headcount): Regex bóc tách số lượng cực đại: ${extractedHeadcount.toLocaleString()} đối tượng -> I_headcount = 1.00`);
      } else if (extractedHeadcount >= 100000) {
        I_headcount = 0.85;
        reasoning.push(`Trục 2 (Headcount): Regex bóc tách: ${extractedHeadcount.toLocaleString()} đối tượng -> I_headcount = 0.85`);
      } else if (extractedHeadcount >= 10000) {
        I_headcount = 0.70;
        reasoning.push(`Trục 2 (Headcount): Regex bóc tách: ${extractedHeadcount.toLocaleString()} đối tượng -> I_headcount = 0.70`);
      } else if (extractedHeadcount >= 100) {
        I_headcount = 0.55;
        reasoning.push(`Trục 2 (Headcount): Bóc tách quy mô hàng trăm tổ chức/doanh nghiệp -> I_headcount = 0.55`);
      } else {
        I_headcount = 0.20;
      }
    } else {
      // Heuristic từ vựng số lượng
      if (text.includes('hàng triệu')) I_headcount = 1.00;
      else if (text.includes('hàng vạn') || text.includes('hàng trăm nghìn')) I_headcount = 0.85;
      else if (text.includes('hàng nghìn') || text.includes('hàng ngàn')) I_headcount = 0.70;
      else if (text.includes('hàng trăm')) I_headcount = 0.55;
      else I_headcount = I_entity; // Fallback theo thực thể
    }

    // 3. TRỤC 3: PHẠM VI ĐỊA LÝ & LÃNH THỔ HÀNH CHÍNH (I_geo)
    let I_geo = 0.35;
    if (text.includes('toàn quốc') || text.includes('trên cả nước') || text.includes('63 tỉnh') || text.includes('diện rộng')) {
      I_geo = 1.00;
      reasoning.push('Trục 3 (Địa lý): Phạm vi toàn quốc / 63 tỉnh thành -> I_geo = 1.00');
    } else if (text.includes('miền bắc') || text.includes('miền nam') || text.includes('miền trung') || text.includes('các cửa khẩu')) {
      I_geo = 0.75;
      reasoning.push('Trục 3 (Địa lý): Phạm vi liên tỉnh / liên vùng kinh tế lớn -> I_geo = 0.75');
    } else if (text.includes('hà nội') || text.includes('tp.hcm') || text.includes('thành phố hồ chí minh') || text.includes('đà nẵng')) {
      I_geo = 0.55;
      reasoning.push('Trục 3 (Địa lý): Đô thị trung tâm loại đặc biệt -> I_geo = 0.55');
    } else if (text.includes('cát lái') || text.includes('nội bài') || text.includes('tân sơn nhất') || text.includes('tại một')) {
      I_geo = 0.20;
    }

    // 4. TRỤC 4: TÍNH CHẤT NGHĨA VỤ PHÁP LÝ & LOẠI HÌNH CHÍNH SÁCH (I_policy)
    let I_policy = 0.30;
    if (text.includes('thuế thu nhập cá nhân') || text.includes('hóa đơn điện tử') || text.includes('giá xăng dầu') || text.includes('lệ phí trước bạ')) {
      I_policy = 1.00;
      reasoning.push('Trục 4 (Chính sách): Nghĩa vụ tài chính bắt buộc diện rộng toàn dân -> I_policy = 1.00');
    } else if (text.includes('hoàn thuế') || text.includes('thuế tiêu thụ đặc biệt') || text.includes('bảo hiểm') || text.includes('trái phiếu')) {
      I_policy = 0.75;
      reasoning.push('Trục 4 (Chính sách): Chính sách ngành hàng kinh tế lớn -> I_policy = 0.75');
    } else if (text.includes('thẩm định giá') || text.includes('đấu thầu') || text.includes('mua sắm công') || text.includes('dự trữ')) {
      I_policy = 0.50;
      reasoning.push('Trục 4 (Chính sách): Quy chế mua sắm công / dự trữ chuyên biệt -> I_policy = 0.50');
    } else {
      I_policy = 0.20;
    }

    // =========================================================
    // PHA 3: HÀM TỔNG HỢP ĐIỂM THÔ
    // =========================================================
    const coreTarget = Math.max(I_entity, I_headcount);
    const rawI = 0.40 * coreTarget + 0.30 * I_geo + 0.30 * I_policy;
    reasoning.push(`PHA 3: Tổng hợp I_raw = 0.40 * max(${I_entity}, ${I_headcount}) + 0.30 * ${I_geo} + 0.30 * ${I_policy} = ${rawI.toFixed(3)}`);

    // =========================================================
    // PHA 4: NEO ĐIỂM CHUẨN (ANCHOR SNAPPING) & KHÓA BIÊN
    // =========================================================
    const matchedAnchor = this.snapToImpactAnchor(rawI, text);
    const finalI = Math.min(1.00, Math.max(0.10, matchedAnchor.I));
    reasoning.push(`PHA 4: Neo vào Anchor: "${matchedAnchor.title}" -> Điểm I cuối cùng = ${finalI}`);

    return this.buildOutput(
      finalI,
      Math.round(rawI * 100) / 100,
      matchedAnchor.level,
      matchedAnchor.title,
      { I_entity, I_headcount, I_geo, I_policy },
      null,
      extractedHeadcount,
      matchedAnchor.title,
      reasoning
    );
  }

  /**
   * Bóc tách số lượng con người/tổ chức quy ra số nguyên
   */
  private static extractHeadcountCount(text: string): number | null {
    // 1. Regex triệu người / triệu hộ
    const trieuRegex = /(\d+([\.,]\d+)?)\s*(triệu|tr)\s*(người|dân|hộ|lao động|người nộp thuế|tài khoản)/i;
    const matchTrieu = trieuRegex.exec(text);
    if (matchTrieu) {
      return parseFloat(matchTrieu[1].replace(',', '.')) * 1000000;
    }

    // 2. Regex vạn / trăm nghìn
    const vanRegex = /(\d+([\.,]\d+)?)\s*(vạn)/i;
    const matchVan = vanRegex.exec(text);
    if (matchVan) {
      return parseFloat(matchVan[1].replace(',', '.')) * 10000;
    }

    // 3. Regex nghìn / ngàn
    const nghinRegex = /(\d+([\.,]\d+)?)\s*(nghìn|ngàn)\s*(doanh nghiệp|hộ|người|công ty)/i;
    const matchNghin = nghinRegex.exec(text);
    if (matchNghin) {
      return parseFloat(matchNghin[1].replace(',', '.')) * 1000;
    }

    // 4. Cụm từ "hàng trăm"
    if (text.includes('hàng trăm doanh nghiệp') || text.includes('hàng trăm công ty') || text.includes('hàng trăm cây xăng')) {
      return 300;
    }

    return null;
  }

  /**
   * Ánh xạ điểm thô vào mốc chuẩn Anchor gần nhất
   */
  private static snapToImpactAnchor(rawI: number, text: string): ImpactAnchorBenchmark {
    let bestAnchor = IMPACT_ANCHOR_BENCHMARKS[0];
    let minDiff = Number.MAX_VALUE;

    for (const anchor of IMPACT_ANCHOR_BENCHMARKS) {
      let diff = Math.abs(rawI - anchor.I);

      // Thưởng trùng khớp từ khóa
      let hits = 0;
      for (const kw of anchor.keywords) {
        if (text.includes(kw)) hits++;
      }
      diff -= (hits * 0.08);

      if (diff < minDiff) {
        minDiff = diff;
        bestAnchor = anchor;
      }
    }

    return bestAnchor;
  }

  private static buildOutput(
    I: number,
    rawScore: number,
    impactLevel: PressImpactOutput['impactLevel'],
    levelDescription: string,
    axes: PressImpactOutput['axes'],
    gateTriggered: string | null,
    extractedHeadcount: number | null,
    matchedAnchorTitle: string,
    reasoningSteps: string[]
  ): PressImpactOutput {
    return {
      I,
      rawScore,
      impactLevel,
      levelDescription,
      axes,
      gateTriggered,
      extractedHeadcount,
      matchedAnchorTitle,
      reasoningSteps
    };
  }
}
