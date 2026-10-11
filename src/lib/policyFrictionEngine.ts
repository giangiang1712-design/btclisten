/**
 * BỘ ĐỘNG CƠ SÀNG LỌC VÀ ĐÁNH GIÁ ĐỘ BĂN KHOĂN CHÍNH SÁCH
 * (POLICY FRICTION & 3-DAY TOPIC FREQUENCY INTELLIGENCE ENGINE)
 * 
 * Bám sát yêu cầu chỉ đạo của Lãnh đạo:
 * 1. Thuật toán loại trừ các bài "điểm tin", "thông báo vụ việc/sự kiện" đơn lẻ,
 *    không tạo sự băn khoăn hay khoảng trống chính sách:
 *    - Loạt bài chuyên đề vĩ mô / giải ngân tích cực chung chung
 *    - Thông báo công khai nợ thuế, xử phạt hành chính cá nhân / doanh nghiệp cụ thể
 *    - Điểm tin tái cơ cấu bộ ngành khác không thuộc diện chỉ đạo của Bộ Tài chính
 * 2. Thuật toán nhận diện Tin Cảnh Báo Xa (Theo dõi & phòng ngừa):
 *    - Tính chất lấp lửng, gây khó hiểu, mập mờ
 *    - Chính sách mới có nhiều điểm mới có thể gây khó khăn, bỡ ngỡ, lúng túng khi thực hiện
 * 3. Thuật toán nhận diện Tin Trọng Yếu (Cần xử lý trong ngày):
 *    - Xét cửa sổ 3 ngày qua (72 giờ) có số lượng tin tức về chủ đề đó dày đặc (đa kênh)
 *    - Phản ánh nhiều băn khoăn, bức xúc, vướng mắc thực tế từ doanh nghiệp/người dân/địa phương
 */

import { ScrapedNewsItem } from '../types';
import { extractQuantitativeBreakdown } from '../components/QuantitativeFormulaBreakdown';

export interface PolicyFrictionEvaluation {
  isExcludedRoutineDigest: boolean;
  exclusionReason?: string;
  isDistantWarningWeakSignal: boolean;
  distantWarningReason?: string;
  isImportantPolicyConcern: boolean;
  importanceReason?: string;
  frequency3Days: number;
}

/**
 * 1. Thuật toán phát hiện bài viết mang tính "Điểm tin / Thông báo vụ việc / Sự kiện" đơn lẻ
 *    nhưng KHÔNG tạo nỗi băn khoăn trong chính sách -> Cần loại bỏ khỏi diện xử lý khẩn.
 */
export function isRoutineDigestOrSingleIncident(title: string, summary: string = ''): { isRoutine: boolean; reason?: string } {
  if (!title) return { isRoutine: false };
  const rawText = `${title} ${summary}`.toLowerCase();

  // A. Loạt bài chuyên đề diễn đàn vĩ mô / truyền thông chính sách chung chung không có băn khoăn
  const isMacroSeriesOrForum = (
    /loạt bài:.*bài \d+:|bài \d+:.*loạt bài/i.test(title) ||
    /loạt bài: để đầu tư công tạo "lực k(éo|héo)"|để đầu tư công tạo "lực k(éo|héo)"/i.test(rawText) ||
    /giải ngân đầu tư công - không chỉ là câu chuyện tỷ lệ|không chỉ là câu chuyện tỷ lệ/i.test(rawText) ||
    (
      /loạt bài|chuyên đề|bài \d+:|nhìn lại \d+ năm|bức tranh kinh tế|động lực tăng trưởng|tạo lực k(éo|héo)|kinh nghiệm quốc tế/i.test(title) &&
      !/bức xúc|ách tắc|tranh cãi|khiếu nại|bất cập nghiêm trọng|phản ứng gay gắt|sai phạm/i.test(rawText)
    )
  );

  if (isMacroSeriesOrForum) {
    return {
      isRoutine: true,
      reason: 'Loạt bài chuyên đề diễn đàn kinh tế vĩ mô / giải ngân tích cực chung chung, không tạo sự băn khoăn hay vướng mắc chính sách.'
    };
  }

  // B. Thông báo công khai danh sách nợ thuế, cưỡng chế nợ thuế của cá nhân, doanh nghiệp cụ thể
  // (Ví dụ: Công ty Tăng Nhật Tuệ nợ thuế 578 triệu, nhóm liên quan Lý Thùy Chang và Chi Bảo nợ hơn 5 tỉ, BGI Group bị phạt thuế, v.v.)
  const isRoutineTaxDebtOrPenalty = (
    /tăng nhật tuệ/i.test(rawText) ||
    /bgi group/i.test(rawText) ||
    /lý thùy chang/i.test(rawText) ||
    /chi bảo.*nợ.*(thuế|tỷ|tỉ|triệu)/i.test(rawText) ||
    /nợ thuế của citigym|nợ thuế nhóm công ty điền quân/i.test(rawText) ||
    /công ty .* nợ thuế \d+|doanh nghiệp .* nợ thuế \d+|nợ thuế hơn \d+ (triệu|tỷ|tỉ)|nợ hơn \d+ (triệu|tỷ|tỉ)/i.test(title) ||
    /bgi group bị phạt và truy thu|bgi group.*truy thu.*thuế|truy thu gần \d+ tỷ đồng tiền thuế/i.test(rawText) ||
    (
      /(bị phạt và truy thu|bị xử phạt vi phạm hành chính về thuế|truy thu.*tiền thuế|công khai danh sách.*nợ thuế|đứng đầu danh sách nợ thuế)/i.test(title) &&
      !/cán bộ thuế|nhận hối lộ|thông đồng|oan sai|doanh nghiệp khiếu nại|khiếu kiện|phản đối quy định/i.test(rawText)
    )
  );

  if (isRoutineTaxDebtOrPenalty) {
    return {
      isRoutine: true,
      reason: 'Thông báo hành chính công khai danh sách nợ thuế hoặc xử phạt vi phạm thuế của doanh nghiệp/cá nhân cụ thể, không phát sinh băn khoăn về quy định chính sách.'
    };
  }

  // C. Điểm tin lộ trình, tái cơ cấu nội bộ của các bộ ngành khác (không thuộc thẩm quyền trực tiếp giải quyết khẩn của Bộ Tài chính)
  const isInterMinistryRestructuringTicker = (
    /tái cơ cấu evn/i.test(rawText) ||
    /hai bộ vênh nhau về lộ trình tách truyền tải/i.test(rawText) ||
    /lộ trình tách truyền tải, bán lẻ|tách truyền tải.*bán lẻ/i.test(rawText) ||
    /phương án tái cơ cấu petrovietnam|tái cơ cấu vinacomin|tái cơ cấu tổng công ty đường sắt/i.test(rawText)
  );

  if (isInterMinistryRestructuringTicker) {
    return {
      isRoutine: true,
      reason: 'Điểm tin thời sự về lộ trình đề án tái cơ cấu chuyên ngành giữa các bộ, không phải bất cập chính sách tài chính của Bộ Tài chính.'
    };
  }

  return { isRoutine: false };
}

/**
 * 2. Thuật toán nhận diện Tin "Cảnh Báo Xa" (Weak Signals / Vướng Mắc Tiềm Ẩn)
 *    Khi bài viết có tính chất lấp lửng, gây khó hiểu, hoặc chính sách mới có nhiều điểm mới có thể gây khó khăn.
 */
export function isDistantWarningWeakSignal(title: string, summary: string = ''): { isDistant: boolean; reason?: string } {
  if (!title) return { isDistant: false };
  const text = `${title} ${summary}`.toLowerCase();

  // A. Tính chất lấp lửng, gây khó hiểu, mập mờ, bối rối
  const hasAmbiguousOrConfusingMarkers = (
    /lấp lửng|khó hiểu|chưa rõ|mơ hồ|mập mờ|hiểu thế nào cho đúng|còn nhiều cách hiểu|nhiều băn khoăn|người dân băn khoăn|doanh nghiệp băn khoăn|chưa rõ cách tính|chưa có hướng dẫn cụ thể|ngỡ ngàng|bối rối|lúng túng|bỡ ngỡ|lo ngại quy định mới|quy định mới khiến|vướng ở đâu|nghẽn ở đâu|điểm nghẽn từ|gây khó khăn|phát sinh vướng mắc/i.test(text)
  );

  // B. Chính sách mới / Quy định mới có nhiều điểm mới gây khó khăn, băn khoăn
  const hasNewPolicyFriction = (
    /(nghị định mới|thông tư mới|luật mới|quy định mới|chính sách mới|áp dụng từ ngày|hiệu lực từ ngày|điểm mới của luật|điểm mới nghị định) .*(nhiều điểm mới|điểm mới|gây khó|vướng mắc|băn khoăn|lúng túng|khó khăn|bỡ ngỡ|lo lắng)/i.test(text) ||
    (/(nghị định|thông tư|luật|quy định|chính sách)/i.test(title) && /(điểm mới|gây khó|băn khoăn|lúng túng|vướng mắc|chưa rõ)/i.test(text))
  );

  if (hasAmbiguousOrConfusingMarkers || hasNewPolicyFriction) {
    return {
      isDistant: true,
      reason: hasAmbiguousOrConfusingMarkers
        ? 'Phản ánh bài viết có tính chất lấp lửng, khó hiểu hoặc người dân/doanh nghiệp băn khoăn trước cách hiểu quy định.'
        : 'Chính sách mới ban hành có nhiều điểm mới có thể gây khó khăn, lúng túng trong thực tiễn thực hiện.'
    };
  }

  return { isDistant: false };
}

/**
 * 3. Thuật toán tính toán số lượng tin tức cùng chủ đề trong cơ sở dữ liệu trong vòng 3 ngày qua (72 giờ).
 */
export function calculate3DayTopicFrequency(
  target: ScrapedNewsItem,
  allArticles: ScrapedNewsItem[]
): { frequency: number; isMultiChannelCluster: boolean } {
  if (!target || !allArticles || allArticles.length === 0) {
    return { frequency: 1, isMultiChannelCluster: false };
  }

  // Lấy mốc thời gian bài viết hiện tại (hoặc hiện tại nếu không có)
  const targetTime = target.publishedAt ? new Date(target.publishedAt).getTime() : Date.now();
  const threeDaysMs = 72 * 60 * 60 * 1000;

  // Lọc bài viết trong cửa sổ 3 ngày qua (72 giờ)
  const windowArticles = allArticles.filter((item) => {
    if (!item.publishedAt) return true; // Chấp nhận bài không rõ thời gian trong phiên
    const itemTime = new Date(item.publishedAt).getTime();
    return Math.abs(targetTime - itemTime) <= threeDaysMs;
  });

  // Tách từ khóa thực thể quan trọng của bài target để so khớp
  const cleanTitle = (target.title || '').toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'–—]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !['cho', 'của', 'các', 'những', 'được', 'trong', 'với', 'theo', 'này', 'bài'].includes(w));

  const targetSector = target.sector || '';

  let matchCount = 0;
  windowArticles.forEach((item) => {
    if (item.id === target.id) {
      matchCount++;
      return;
    }

    const itemText = `${item.title || ''} ${item.summary || ''}`.toLowerCase();
    
    // Khớp cùng ngành/lĩnh vực và có ít nhất 2 từ khóa đặc thù trùng nhau
    const matchesSector = item.sector && item.sector === targetSector;
    let sharedKeywords = 0;
    for (const kw of cleanTitle) {
      if (itemText.includes(kw)) {
        sharedKeywords++;
      }
    }

    if (sharedKeywords >= 3 || (matchesSector && sharedKeywords >= 2)) {
      matchCount++;
    }
  });

  // Nếu bài viết gốc có thuộc tính syndicationCount (được đăng trên nhiều báo), tính thêm
  const effectiveCount = Math.max(matchCount, target.syndicationCount || 1);

  return {
    frequency: effectiveCount,
    isMultiChannelCluster: effectiveCount >= 2
  };
}

/**
 * 4. Thuật toán tổng hợp: Đánh giá toàn diện mức độ quan trọng & điều kiện xử lý của bài viết
 */
export function evaluatePolicyFriction(
  target: ScrapedNewsItem,
  allArticles: ScrapedNewsItem[] = []
): PolicyFrictionEvaluation {
  const title = target.title || '';
  const summary = target.summary || target.snippet || '';

  // 1. Kiểm tra loại trừ tin điểm tin / thông báo vụ việc đơn lẻ
  const routineCheck = isRoutineDigestOrSingleIncident(title, summary);
  if (routineCheck.isRoutine) {
    return {
      isExcludedRoutineDigest: true,
      exclusionReason: routineCheck.reason,
      isDistantWarningWeakSignal: false,
      isImportantPolicyConcern: false,
      frequency3Days: 1
    };
  }

  // 2. Tính tần suất trong vòng 3 ngày qua
  const freqCheck = calculate3DayTopicFrequency(target, allArticles);

  // 3. Kiểm tra tính chất lấp lửng / cảnh báo xa
  const distantCheck = isDistantWarningWeakSignal(title, summary);

  // 4. Kiểm tra điều kiện Tin Trọng Yếu:
  // - Xét trong 3 ngày qua có số lượng tin tức dày đặc (>= 2 bài trở lên)
  // - Phải là chính sách mới hoặc phản ánh nhiều băn khoăn, vướng mắc từ dư luận/hiệp hội/doanh nghiệp
  const rawText = `${title} ${summary}`.toLowerCase();
  const hasSubstantialPolicyConcern = (
    /ách tắc|bất cập|vướng mắc|kiến nghị|đề xuất sửa|chậm trễ|bức bức|khó khăn|đọng vốn|vênh nhau|độ vênh|chưa thống nhất|trái chiều|khiếu nại/i.test(rawText) ||
    Boolean(target.informationVacuum?.isAlertWarranted) ||
    (target.impactLevel === 'high' && target.sentiment === 'bearish')
  );

  const isImportant = (
    // Điều kiện: Nhiều bài trong 3 ngày qua VÀ có băn khoăn chính sách
    (freqCheck.isMultiChannelCluster && hasSubstantialPolicyConcern) ||
    // Hoặc có độ vênh thông tin/chỉ đạo cao
    Boolean(target.hasInformationGap || (target.warningPipeline?.formulaMetrics?.D && target.warningPipeline.formulaMetrics.D > 0))
  );

  return {
    isExcludedRoutineDigest: false,
    isDistantWarningWeakSignal: distantCheck.isDistant,
    distantWarningReason: distantCheck.reason,
    isImportantPolicyConcern: isImportant,
    importanceReason: isImportant
      ? `Chủ đề xuất hiện ${freqCheck.frequency} bài trong 3 ngày qua và phản ánh băn khoăn/vướng mắc chính sách thực tế.`
      : undefined,
    frequency3Days: freqCheck.frequency
  };
}

/**
 * 5. Phân loại chuẩn hóa 4 cấp độ hành động (C1 - C4) theo đúng chỉ đạo Lãnh đạo:
 * - C4: Khẩn cấp (SLA 2-4h) -> Xếp vào "KHẨN CẤP"
 * - C3: Trọng yếu (SLA 12h) -> Xếp vào "TRỌNG YẾU"
 * - C1, C2: Chỉ ở mức Theo dõi & Phòng ngừa -> BẮT BUỘC xếp vào "THEO DÕI & PHÒNG NGỪA"
 */
export type DirectiveTier = 'C4' | 'C3' | 'C2' | 'C1';

export function getDirectiveTier(item: ScrapedNewsItem): DirectiveTier {
  if (!item) return 'C1';
  const breakdown = extractQuantitativeBreakdown(item);

  // C4: Khẩn cấp (Báo động đỏ / SLA 2-4h)
  if (
    breakdown.level === 'EMERGENCY' ||
    Boolean(item.isEmergency) ||
    item.decree376Tier === 3 ||
    breakdown.riskScore >= 75
  ) {
    return 'C4';
  }

  // C3: Trọng yếu (Cảnh báo nhanh / SLA 12h)
  if (
    breakdown.level === 'RAPID' ||
    item.warningPipeline?.level3Action?.alertLevel === 'RAPID' ||
    (breakdown.riskScore >= 60 && breakdown.riskScore < 75)
  ) {
    return 'C3';
  }

  // C2: Theo dõi & phòng ngừa (Cảnh báo sớm)
  if (
    breakdown.level === 'EARLY' ||
    (breakdown.riskScore >= 40 && breakdown.riskScore < 60)
  ) {
    return 'C2';
  }

  // C1: Theo dõi & phòng ngừa (Cảnh báo xa / Tín hiệu mới / Khoảng trống thông tin)
  return 'C1';
}

/**
 * Mức độ quan trọng tinh gọn phục vụ nhóm thẻ Lãnh đạo:
 * - C4 -> URGENT (Khẩn cấp)
 * - C3 -> IMPORTANT (Trọng yếu)
 * - C1, C2 -> MONITORING (Theo dõi & phòng ngừa)
 */
export function getDirectiveImportance(item: ScrapedNewsItem): 'URGENT' | 'IMPORTANT' | 'MONITORING' {
  const tier = getDirectiveTier(item);
  if (tier === 'C4') return 'URGENT';
  if (tier === 'C3') return 'IMPORTANT';
  return 'MONITORING'; // C1, C2 đều thuộc Theo dõi & Phòng ngừa
}

/**
 * 6. Thuật toán chọn lọc thông tin THỰC SỰ LÀ TÍCH CỰC (Chuẩn RAG Nghị định 376/2026/NĐ-CP & tttichcuc.md):
 * - Bám sát 4 Trụ cột Thông tin Tích cực Bộ Tài chính
 * - Triệt tiêu 100% tin tức tiêu cực, rủi ro (Risk Score >= 30), cảnh báo SOP, vi phạm nợ thuế, khiếu nại, sự kiện đơn lẻ
 */
export function isTrulyPositiveArticle(art: ScrapedNewsItem): boolean {
  if (!art) return false;
  if (art.isMarketDigest) return false;

  // 1. Loại trừ tuyệt đối tin tiêu cực, rủi ro, khẩn cấp, hoặc bị xếp cấp cảnh báo SOP
  if (
    Boolean(art.isEmergency) ||
    art.sentiment === 'bearish' ||
    (art.riskScore || 0) >= 30 ||
    art.decree376Tier === 3 ||
    art.decree376Tier === 2 ||
    Boolean(art.hasInformationGap)
  ) {
    return false;
  }

  // 2. Loại trừ tin thông báo vụ việc nợ thuế/xử phạt/điểm tin tái cơ cấu đơn lẻ
  const routineCheck = isRoutineDigestOrSingleIncident(art.title || '', art.summary || art.snippet || '');
  if (routineCheck.isRoutine) return false;

  const text = `${art.title || ''} ${art.summary || art.snippet || ''}`.toLowerCase();

  // 3. Triệt tiêu các từ khóa chứa sắc thái tiêu cực hoặc băn khoăn chính sách
  if (/sai phạm|khởi tố|bắt tạm giam|truy thu|khiếu nại|nợ thuế|xử phạt|chậm trễ|ách tắc|đình chỉ|vỡ nợ|bất cập|khiếu kiện|chây ỳ/i.test(text)) {
    return false;
  }

  // 4. Đối soát 4 Trụ cột Thông tin Tích cực chuẩn NĐ 376:
  // Trụ cột 1: Thành tựu & Chỉ số Kinh tế - Tài khoa (Thu ngân sách, giải ngân, xuất siêu, FDI, lạm phát)
  const pillar1Pillar = /vượt thu ngân sách|thu ngân sách đạt|giải ngân đầu tư công bứt phá|thặng dư thương mại|xuất siêu|kỷ lục thu hút fdi|kiểm soát lạm phát|nợ công an toàn|tăng trưởng kinh tế|sức khỏe tài khóa/i.test(text);

  // Trụ cột 2: Cải cách thể chế, cắt giảm chi phí tuân thủ & chuyển đổi số (Gia hạn/giảm thuế, hải quan luồng xanh, HĐĐT, AI)
  const pillar2Reform = /gia hạn thuế|miễn giảm thuế|giảm phí lệ phí|luồng xanh hải quan|thông quan nhanh|hóa đơn điện tử máy tính tiền|chuyển đổi số ngành tài chính|ứng dụng ai|đơn giản hóa thủ tục/i.test(text);

  // Trụ cột 3: Ổn định Thị trường Tài chính - Tiền tệ & Nâng hạng (Non-Prefunding TT 68, phát hành TPCP, TPDN)
  const pillar3Market = /nâng hạng thị trường|non-prefunding|ftse russell|phát hành thành công trái phiếu|ổn định thị trường chứng khoán|khơi thông trái phiếu doanh nghiệp|minh bạch bảo hiểm/i.test(text);

  // Trụ cột 4: Đánh giá Tích cực Quốc tế & Đồng thuận Xã hội (WB, IMF, ADB đánh giá cao, doanh nghiệp/địa phương ghi nhận)
  const pillar4Endorsement = /wb đánh giá|imf đánh giá|adb đánh giá|chuyên gia quốc tế đánh giá cao|doanh nghiệp ghi nhận|địa phương đánh giá cao|đồng thuận cao|phấn khởi|đánh giá tích cực/i.test(text);

  // Tổng hợp sắc thái tích cực
  const isPositiveSentiment = art.sentiment === 'bullish';
  const hasPositiveCoreKeywords = /khởi sắc|vượt chỉ tiêu|tăng trưởng|đột phá|thu hút đầu tư|nâng hạng|vượt kế hoạch|kỷ lục|phấn khởi|thặng dư|giải ngân nhanh|thành tựu|chuyển biến tích cực|phát hành thành công|thu ngân sách đạt/i.test(text);

  return isPositiveSentiment || hasPositiveCoreKeywords || pillar1Pillar || pillar2Reform || pillar3Market || pillar4Endorsement;
}

