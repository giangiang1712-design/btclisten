/**
 * PURE PRESS VELOCITY COMPUTATION ENGINE (V in [0.0, 1.0])
 * Module lượng hóa chính xác vận tốc và động lượng phát tán báo chí điện tử
 * File: /src/lib/pressVelocityEngine.ts
 */

export interface CrawledArticleRecord {
  id?: string;
  sourceDomain: string;         // vd: "tuoitre.vn", "vtv.vn", "vnexpress.net"
  publishedAt: string | Date;   // ISO 8601 string hoặc Date object
  title: string;
  content?: string;
  isHeadline?: boolean;         // Thuộc Top Trang nhất / Tin tiêu điểm
  isInvestigativeSeries?: boolean; // Tuyến bài điều tra / vệt bài nhiều kỳ
}

export interface PressVelocityEvaluationOutput {
  V: number;
  rawVelocity: number;
  velocityLevel: 'QUIET' | 'SLOW' | 'MODERATE' | 'HIGH' | 'VIRAL_PRESS' | 'MEDIA_STORM';
  levelDescription: string;
  metricsBreakdown: {
    totalArticles24h: number;
    articlesLast3h: number;
    uniqueOutletsCount: number;
    weightedThroughput_M: number;
    V_base: number;
    K_burst: number;
    B_syndicate: number;
    tier1Count: number;
    tier2Count: number;
    tier3Count: number;
  };
  heuristicInferred: boolean;
  reasoningSteps: string[];
}

export class PressVelocityAlgorithmEngine {
  private static readonly M_PRESS_THRESHOLD = 650.0; // Ngưỡng bão hòa lưu lượng báo chí Việt Nam

  // Danh mục phân tầng tên miền báo chí Việt Nam
  private static readonly TIER_1_DOMAINS = [
    'vtv.vn',
    'nhandan.vn',
    'chinhphu.vn',
    'baochinhphu.vn',
    'ttxvn.vn',
    'vietnamplus.vn',
    'mof.gov.vn'
  ];

  private static readonly TIER_2_DOMAINS = [
    'vnexpress.net',
    'tuoitre.vn',
    'thanhnien.vn',
    'laodong.vn',
    'vietnamnet.vn',
    'dantri.com.vn',
    'baodautu.vn',
    'thoibaotaichinhvietnam.vn',
    'vneconomy.vn',
    'cafef.vn',
    'cafebiz.vn',
    'tienphong.vn'
  ];

  /**
   * Tính toán V từ tập hợp danh sách các bài báo do Bot Crawler cào về trong 24h
   */
  public static calculateVFromCrawledCluster(
    articles: CrawledArticleRecord[],
    referenceTime: Date = new Date()
  ): PressVelocityEvaluationOutput {
    const reasoning: string[] = [];
    reasoning.push(`PHA 1: Khởi động bộ lượng hóa vận tốc thuần báo chí từ ${articles.length} bài báo cào được.`);

    if (articles.length === 0) {
      reasoning.push('Không có bài báo nào trong cụm -> Khóa V = 0.0');
      return this.buildResult(0, 0, 'QUIET', 'Tĩnh lặng tuyệt đối', {
        totalArticles24h: 0,
        articlesLast3h: 0,
        uniqueOutletsCount: 0,
        weightedThroughput_M: 0,
        V_base: 0,
        K_burst: 1.0,
        B_syndicate: 0.75,
        tier1Count: 0,
        tier2Count: 0,
        tier3Count: 0
      }, false, reasoning);
    }

    const refMs = referenceTime.getTime();
    const ms24h = 24 * 60 * 60 * 1000;
    const ms3h = 3 * 60 * 60 * 1000;

    // Lọc bài báo trong 24h gần nhất
    const validArticles = articles.filter(a => {
      const pubMs = new Date(a.publishedAt).getTime();
      return (refMs - pubMs) >= 0 && (refMs - pubMs) <= ms24h;
    });

    const totalArticles24h = validArticles.length;
    let articlesLast3h = 0;
    const uniqueDomains = new Set<string>();

    let tier1Count = 0;
    let tier2Count = 0;
    let tier3Count = 0;
    let M_press = 0.0;

    for (const art of validArticles) {
      const pubMs = new Date(art.publishedAt).getTime();
      if ((refMs - pubMs) <= ms3h) {
        articlesLast3h++;
      }

      const domain = art.sourceDomain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      uniqueDomains.add(domain);

      // Phân tầng tên miền
      let w = 6; // Mặc định Tier 3
      if (this.TIER_1_DOMAINS.some(d => domain.includes(d))) {
        w = 35;
        tier1Count++;
      } else if (this.TIER_2_DOMAINS.some(d => domain.includes(d))) {
        w = 18;
        tier2Count++;
      } else {
        tier3Count++;
      }

      // Hệ số định dạng bài
      let mu = 1.0;
      const titleLower = art.title.toLowerCase();
      const isInvestigative = art.isInvestigativeSeries ||
        titleLower.includes('điều tra') ||
        titleLower.includes('kỳ 1') ||
        titleLower.includes('kỳ 2') ||
        titleLower.includes('loạt bài');
      const isExpert = titleLower.includes('chất vấn') ||
        titleLower.includes('chuyên gia') ||
        titleLower.includes('kiến nghị') ||
        titleLower.includes('đại biểu quốc hội');

      if (isInvestigative) mu = 2.2;
      else if (isExpert) mu = 1.4;

      // Hệ số vị trí
      let rho = 1.0;
      if (art.isHeadline || titleLower.includes('tiêu điểm') || titleLower.includes('nóng')) {
        rho = 2.0;
      }

      M_press += (w * mu * rho);
    }

    reasoning.push(`Lưu lượng M_press: T1=${tier1Count} bài (w=35), T2=${tier2Count} bài (w=18), T3=${tier3Count} bài (w=6) -> M = ${M_press.toFixed(1)}`);

    // PHA 2: Chuyển đổi phi tuyến logarit
    const logM = Math.log10(1 + M_press);
    const logThresh = Math.log10(1 + this.M_PRESS_THRESHOLD);
    const V_base = Math.min(1.0, Math.max(0.0, logM / logThresh));
    reasoning.push(`Thể tích cơ sở V_base: log10(1 + ${M_press.toFixed(1)}) / log10(1 + ${this.M_PRESS_THRESHOLD}) = ${V_base.toFixed(3)}`);

    // PHA 3: Gia tốc 3h và Đa dạng tòa soạn
    let K_burst = 1.0;
    if (totalArticles24h > 0) {
      const R_3h = articlesLast3h / totalArticles24h;
      if (R_3h >= 0.50) K_burst = 1.35;
      else if (R_3h >= 0.35) K_burst = 1.20;
      else if (R_3h >= 0.15) K_burst = 1.00;
      else K_burst = 0.80;
      reasoning.push(`Gia tốc xuất bản: ${articlesLast3h}/${totalArticles24h} bài trong 3h (${(R_3h * 100).toFixed(1)}%) -> K_burst = ${K_burst}`);
    }

    const uniqueOutletsCount = uniqueDomains.size;
    let B_syndicate = 0.75;
    if (uniqueOutletsCount >= 15) B_syndicate = 1.25;
    else if (uniqueOutletsCount >= 8) B_syndicate = 1.10;
    else if (uniqueOutletsCount >= 3) B_syndicate = 0.95;
    else B_syndicate = 0.75;
    reasoning.push(`Độ phủ tòa soạn độc lập: ${uniqueOutletsCount} tòa soạn khác nhau -> B_syndicate = ${B_syndicate}`);

    // PHA 4: Khóa biên V_press
    const rawV = V_base * K_burst * B_syndicate;
    const finalV = Math.min(1.0, Math.max(0.0, Math.round(rawV * 100) / 100));
    reasoning.push(`Tổng hợp V_raw = ${V_base.toFixed(3)} * ${K_burst} * ${B_syndicate} = ${rawV.toFixed(3)} -> Khóa V = ${finalV}`);

    return this.buildResult(finalV, rawV, this.getVelocityLevel(finalV), this.getLevelDescription(finalV), {
      totalArticles24h,
      articlesLast3h,
      uniqueOutletsCount,
      weightedThroughput_M: Math.round(M_press * 10) / 10,
      V_base: Math.round(V_base * 1000) / 1000,
      K_burst,
      B_syndicate,
      tier1Count,
      tier2Count,
      tier3Count
    }, false, reasoning);
  }

  /**
   * Chế độ Heuristic: Tự suy luận V khi bot crawler chỉ cào được 1 văn bản riêng lẻ
   */
  public static calculateVFromSingleArticleText(
    title: string,
    content: string,
    sourceDomain: string = ''
  ): PressVelocityEvaluationOutput {
    const reasoning: string[] = [];
    reasoning.push('[HEURISTIC MODE] Phân tích văn bản bài báo để trích xuất tín hiệu động lượng báo chí.');

    const text = `${title} ${content} ${sourceDomain}`.toLowerCase();
    let simulatedTier1 = 0;
    let simulatedTier2 = 1;
    let simulatedTier3 = 0;
    let simulatedUnique = 1;
    let articles3h = 1;
    let total24h = 2;

    // Phát hiện nguồn báo trực tiếp
    if (this.TIER_1_DOMAINS.some(d => text.includes(d)) || text.includes('vtv') || text.includes('báo nhân dân') || text.includes('chính phủ')) {
      simulatedTier1 += 1;
    }

    // Phát hiện tín hiệu báo chí diện rộng trích dẫn trong văn bản
    if (text.includes('đồng loạt đưa tin') || text.includes('báo chí phản ánh') || text.includes('dư luận dậy sóng')) {
      simulatedTier1 += 2;
      simulatedTier2 += 12;
      simulatedUnique = 16;
      articles3h = 12;
      total24h = 20;
      reasoning.push('Phát hiện tín hiệu: Nhiều báo đồng loạt lên tiếng -> Nâng lưu lượng giả lập.');
    } else if (text.includes('kêu cứu') || text.includes('kiến nghị khẩn cấp') || text.includes('chất vấn')) {
      simulatedTier2 += 6;
      simulatedUnique = 7;
      articles3h = 4;
      total24h = 9;
      reasoning.push('Phát hiện sự kiện hiệp hội kêu cứu hoặc chất vấn nghị trường.');
    }

    const syntheticArticles: CrawledArticleRecord[] = [];
    const now = new Date();

    for (let i = 0; i < simulatedTier1; i++) {
      syntheticArticles.push({
        sourceDomain: 'vtv.vn',
        publishedAt: new Date(now.getTime() - (i < articles3h ? 1 : 10) * 3600 * 1000),
        title,
        isHeadline: i === 0
      });
    }
    for (let i = 0; i < simulatedTier2; i++) {
      syntheticArticles.push({
        sourceDomain: `baolon_${i}.vn`,
        publishedAt: new Date(now.getTime() - (i < articles3h ? 2 : 12) * 3600 * 1000),
        title,
        isHeadline: false
      });
    }

    const result = this.calculateVFromCrawledCluster(syntheticArticles, now);
    result.heuristicInferred = true;
    result.reasoningSteps = [...reasoning, ...result.reasoningSteps];
    return result;
  }

  private static getVelocityLevel(v: number): PressVelocityEvaluationOutput['velocityLevel'] {
    if (v >= 0.90) return 'MEDIA_STORM';
    if (v >= 0.75) return 'VIRAL_PRESS';
    if (v >= 0.50) return 'HIGH';
    if (v >= 0.30) return 'MODERATE';
    if (v > 0.05) return 'SLOW';
    return 'QUIET';
  }

  private static getLevelDescription(v: number): string {
    if (v >= 0.90) return 'Cực hạn: Toàn bộ làng báo đồng thanh giật tít trang nhất liên tục';
    if (v >= 0.75) return 'Vệt bài điều tra lớn: VTV Thời sự phát sóng, nhiều báo lớn ra loạt bài nhiều kỳ';
    if (v >= 0.50) return 'Động lượng cao: 10-15 cơ quan báo chí lớn cùng đưa tin trong vài giờ';
    if (v >= 0.30) return 'Lan tỏa trung tính: Một vài báo kinh tế đưa tin dự thảo hoặc hội thảo';
    if (v > 0.05) return 'Lan tỏa chậm: 1-2 bài báo đưa tin sự vụ định kỳ';
    return 'Tĩnh lặng tuyệt đối trên báo chí điện tử';
  }

  private static buildResult(
    V: number,
    rawVelocity: number,
    velocityLevel: PressVelocityEvaluationOutput['velocityLevel'],
    levelDescription: string,
    metricsBreakdown: PressVelocityEvaluationOutput['metricsBreakdown'],
    heuristicInferred: boolean,
    reasoningSteps: string[]
  ): PressVelocityEvaluationOutput {
    return {
      V,
      rawVelocity: Math.round(rawVelocity * 1000) / 1000,
      velocityLevel,
      levelDescription,
      metricsBreakdown,
      heuristicInferred,
      reasoningSteps
    };
  }
}
