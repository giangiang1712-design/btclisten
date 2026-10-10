/**
 * Hệ thống Đánh giá Chuẩn xác Nguy cơ - Điểm sáng - Chỉ đạo Điều hành Chính sách
 * Bộ Tài chính Việt Nam (Social Listening & Fiscal Intelligence Engine)
 * 
 * THUẬT TOÁN TÍNH ĐIỂM TRỌNG SỐ ĐA CHIỀU (WEIGHT-BASED RISK SCORING ALGORITHM):
 * Thay vì chỉ đếm mật độ từ khóa đơn thuần (dễ gây báo động giả), hệ thống áp dụng
 * mô hình định lượng trọng số kết hợp:
 * 1. Trọng số Sắc thái Tiêu cực (Negative Sentiment Weight): Đánh giá mức độ tổn thất,
 *    áp lực thị trường thực sự và biên độ điểm tiêu cực (sentimentScore).
 * 2. Trọng số Cấp độ Tác động Khẩn cấp ('Urgent' / 'Emergency' Impact Weight):
 *    Ưu tiên cảnh báo khi bài viết mang tính khẩn cấp hoặc cấp độ tác động nghiêm trọng.
 * 3. Trọng số Giảm trừ Chính sách & Kiến tạo Thể chế của Bộ Tài chính (MoF Policy Dampener):
 *    Các văn bản quy phạm pháp luật, chỉ đạo điều hành, hướng dẫn nộp thuế, thanh tra thường kỳ,
 *    phòng ngừa rủi ro và các gói hỗ trợ doanh nghiệp sẽ được áp dụng hệ số giảm trừ (-15 đến -50 điểm)
 *    nhằm triệt tiêu tối đa các cảnh báo khủng hoảng sai lệch (false-positive crisis alerts).
 * 4. Trọng số Sự cố Cấp bách & Gian lận Pháp lý (Acute Crisis & Threat Severity):
 *    Chỉ kích hoạt khi có sự cố thực tế: Vỡ nợ, mất khả năng thanh toán, phong tỏa tài khoản,
 *    khởi tố hình sự, thao túng thị trường, bán tháo ồ ạt hoặc lừa đảo tài chính.
 */

import { ScrapedNewsItem, MinistryAlertCategory, AlertIgnoreRule, LoughranMcDonaldSentimentAnalysis, resolveAgencyByDecree376 } from '../types';
import { loadAlertIgnoreList } from './alertTriggers';
import { isPureMarketDynamics } from './warningPipelineEngine';
import { Decree376ClassificationEngine } from './decree376ClassificationEngine';

// Ngưỡng điểm rủi ro tối thiểu kích hoạt Cảnh báo Cấp 1 (Early Horizon: 20–39đ):
// Mốc < 20 điểm là vùng BÌNH THƯỜNG / GIÁM SÁT THƯỜNG QUY (STANDARD: 0–19đ - KHÔNG CẢNH BÁO).
// Chỉ khi điểm số đạt từ 20 điểm trở lên (≥ 20) mới kích hoạt phân tầng cảnh báo rủi ro thực tế (Cấp 1-4).
export const RISK_SCORE_THRESHOLD = 20;
export const ACUTE_RISK_THRESHOLD = 75;

// Ngưỡng điểm tin cậy rủi ro dựa trên giao thoa Từ khóa MoF & Sắc thái Tiêu cực
export const HIGH_CONFIDENCE_THRESHOLD = 75;
export const MEDIUM_CONFIDENCE_THRESHOLD = 50;

// ============================================================================
// BỘ LỌC CẢNH BÁO KHẨN CẤP CHUẨN XÁC DÀNH CHO LÃNH ĐẠO BỘ TÀI CHÍNH
// Phân biệt rạch ròi giữa "Biến động thị trường khách quan" (KHÔNG khẩn cấp)
// và "Các vấn đề nhắm vào Bộ, thủ tục, chính sách, kiến nghị, trách nhiệm" (CẢNH BÁO KHẨN)
// ============================================================================

// 1. Danh mục từ khóa BIẾN ĐỘNG THỊ TRƯỜNG KHÁCH QUAN (Objective Market Movements)
// Các nội dung này là diễn biến cung-cầu, giá cả, tâm lý giao dịch tự nhiên -> KHÔNG đưa vào diện Khẩn cấp
export const OBJECTIVE_MARKET_KEYWORDS = [
  'vn-index', 'hnx-index', 'upcom-index', 'chỉ số vnindex', 'thị trường chứng khoán rung lắc',
  'điều chỉnh kỹ thuật', 'áp lực chốt lời', 'khối ngoại bán ròng', 'khối ngoại mua ròng',
  'tự doanh bán ròng', 'tự doanh mua ròng', 'sắc đỏ bao trùm', 'thanh khoản khớp lệnh',
  'rung lắc quanh mốc', 'kiểm định ngưỡng hỗ trợ', 'kiểm tra vùng kháng cự', 'phân hóa mạnh',
  'nhóm cổ phiếu phân hóa', 'thị trường giằng co', 'dao động biên độ hẹp', 'nhịp hồi phục',
  'giá vàng trong nước', 'vàng miếng sjc', 'giá vàng nhẫn', 'vàng thế giới',
  'tỷ giá usd/vnd', 'tỷ giá trung tâm', 'giá dầu thế giới', 'giá xăng dầu thế giới',
  'lợi suất trái phiếu mỹ', 'chứng khoán châu á', 'dow jones', 's&p 500', 'nasdaq',
  // Hoạt động doanh nghiệp & Ngân hàng thương mại thường quy (Cổ tức, tăng vốn điều lệ, ĐHĐCĐ)
  'chốt quyền trả cổ tức', 'trả cổ tức bằng cổ phiếu', 'trả cổ tức bằng tiền', 'chia cổ tức',
  'tăng vốn lên', 'tăng vốn điều lệ', 'phát hành cổ phiếu', 'nghị quyết đhđcđ', 'chốt quyền',
  '100.000 tỷ đồng', 'vpbank', 'vietcombank', 'techcombank', 'mbbank', 'bidv', 'vietinbank',
  'thị trường lao động việt nam', 'chuyển đổi số và bước ngoặt cải cách thể chế',
  'cải cách thể chế trong kỷ nguyên mới', 'giai đoạn 2020-2025'
];

// 1b. WHITELIST TỪ KHÓA HẠ TẦNG TÀI CHÍNH & HOẠT ĐỘNG DOANH NGHIỆP PHI CHÍNH TRỊ (CORPORATE UPDATES WHITELIST)
// Nhận diện hoạt động trả cổ tức, chia thưởng, tăng vốn điều lệ, đại hội đồng cổ đông, và nghiên cứu vĩ mô thường quy.
// Luồng này hoàn toàn phi rủi ro chính trị / sai phạm và được hạ cấp tự động về Normal / Standard.
export const FINANCIAL_INFRASTRUCTURE_WHITELIST_KEYWORDS = [
  // Cổ tức & Quyền lợi cổ đông
  'chốt quyền trả cổ tức', 'trả cổ tức bằng cổ phiếu', 'trả cổ tức bằng tiền', 'chia cổ tức bằng cổ phiếu',
  'chia cổ tức', 'nhận cổ tức', 'quyền nhận cổ tức', 'tỷ lệ trả cổ tức', 'tỷ lệ cổ tức', 'ngày đăng ký cuối cùng',
  'chốt danh sách cổ đông', 'tạm ứng cổ tức', 'chi trả cổ tức', 'chốt quyền', 'thưởng cổ phiếu', 'cổ phiếu thưởng',
  // Tăng vốn điều lệ, chào bán & phát hành vốn
  'tăng vốn điều lệ', 'tăng vốn lên', 'tăng vốn', 'phát hành cổ phiếu', 'chào bán cổ phiếu',
  'phát hành tăng vốn', 'phát hành esop', 'nghị quyết đhđcđ', 'đại hội đồng cổ đông', 'đhđcđ thường niên',
  'kế hoạch kinh doanh', '100.000 tỷ đồng', 'nghìn tỷ vốn điều lệ',
  // Ngân hàng thương mại & hoạt động mở rộng kinh doanh
  'vpbank', 'vietcombank', 'techcombank', 'mbbank', 'bidv', 'vietinbank', 'acb', 'hdbank', 'shb', 'tpbank', 'sacombank', 'vib',
  'ngân hàng thương mại cổ phần', 'mở rộng mạng lưới', 'khai trương chi nhánh', 'thành lập chi nhánh mới',
  'kết quả kinh doanh quý', 'lợi nhuận trước thuế tăng', 'tăng trưởng tín dụng ngân hàng',
  // Nghiên cứu kinh tế vĩ mô & chuyển đổi số, thị trường lao động, cải cách thể chế
  'thị trường lao động việt nam', 'thị trường lao động', 'chuyển đổi số và bước ngoặt cải cách thể chế',
  'cải cách thể chế trong kỷ nguyên mới', 'kỷ nguyên mới', 'nghiên cứu kinh tế', 'phát triển nguồn nhân lực',
  'giai đoạn 2020-2025', 'tổng quan thị trường lao động'
];

/**
 * Kiểm tra xem bài viết hoặc đoạn văn bản có chứa từ khóa / mẫu nằm trong Ignore-list tùy biến của người dùng hay không
 */
export function checkPersistentIgnoreList(
  textOrArticle: string | ScrapedNewsItem,
  customRules?: AlertIgnoreRule[]
): { isIgnored: boolean; matchedPattern?: string; rule?: AlertIgnoreRule } {
  if (!textOrArticle) return { isIgnored: false };

  let text = '';
  if (typeof textOrArticle === 'string') {
    text = textOrArticle.toLowerCase();
  } else {
    const title = (textOrArticle.title || '').toLowerCase();
    const summary = (textOrArticle.summary || textOrArticle.snippet || '').toLowerCase();
    const sentimentReason = (textOrArticle.sentimentReason || '').toLowerCase();
    const tags = Array.isArray(textOrArticle.regulatoryTags) ? textOrArticle.regulatoryTags.join(' ').toLowerCase() : '';
    text = `${title} ${summary} ${sentimentReason} ${tags}`;
  }

  // Loại trừ tuyệt đối các trường hợp có án khởi tố hình sự cán bộ / đại án tham nhũng
  const hasAcuteCriminalIncident = 
    /khởi tố bị can|khởi tố cán bộ|bắt tạm giam cán bộ|cán bộ nhận hối lộ|đại án tham nhũng|vụ án xuyên việt oil|bị can đặng công khôi/i.test(text);
  if (hasAcuteCriminalIncident) {
    return { isIgnored: false };
  }

  const ignoreRules: AlertIgnoreRule[] = customRules || (typeof window !== 'undefined' ? loadAlertIgnoreList() : []);
  const activeRules = ignoreRules.filter(r => r.enabled);

  for (const rule of activeRules) {
    const rawPattern = (rule.pattern || '').trim().toLowerCase();
    if (!rawPattern) continue;

    let isMatched = false;
    try {
      if (rawPattern.startsWith('/') && rawPattern.endsWith('/') && rawPattern.length > 2) {
        const regex = new RegExp(rawPattern.slice(1, -1), 'i');
        isMatched = regex.test(text);
      } else {
        isMatched = text.includes(rawPattern);
      }
    } catch {
      isMatched = text.includes(rawPattern);
    }

    if (isMatched) {
      return {
        isIgnored: true,
        matchedPattern: rule.pattern,
        rule,
      };
    }
  }

  return { isIgnored: false };
}

export function isIgnoredByPersistentList(
  textOrArticle: string | ScrapedNewsItem,
  customRules?: AlertIgnoreRule[]
): boolean {
  return checkPersistentIgnoreList(textOrArticle, customRules).isIgnored;
}

/**
 * Kiểm tra xem bài viết có thuộc diện Whitelist Hạ tầng Tài chính & Hoạt động Doanh nghiệp Thường quy hay không
 */
export function isFinancialInfrastructureOrBusinessUpdate(textOrArticle: string | ScrapedNewsItem, customRules?: AlertIgnoreRule[]): boolean {
  if (!textOrArticle) return false;
  let text = '';
  if (typeof textOrArticle === 'string') {
    text = textOrArticle.toLowerCase();
  } else {
    const title = (textOrArticle.title || '').toLowerCase();
    const summary = (textOrArticle.summary || textOrArticle.snippet || '').toLowerCase();
    const sentimentReason = (textOrArticle.sentimentReason || '').toLowerCase();
    text = `${title} ${summary} ${sentimentReason}`;
  }

  // Loại trừ trường hợp có từ ngữ tiêu cực đặc biệt / khởi tố / bắt giam / sai phạm nghiêm trọng
  const hasAcuteCriminalIncident = 
    /khởi tố bị can|khởi tố cán bộ|bắt tạm giam cán bộ|cán bộ nhận hối lộ|đại án tham nhũng|vụ án xuyên việt oil|bị can đặng công khôi|chiếm dụng quỹ/i.test(text);
  if (hasAcuteCriminalIncident) return false;

  // Khớp Ignore-list tùy biến
  if (isIgnoredByPersistentList(textOrArticle, customRules)) {
    return true;
  }

  const matchesWhitelistKeyword = FINANCIAL_INFRASTRUCTURE_WHITELIST_KEYWORDS.some(kw => text.includes(kw));

  const matchesRegex = 
    /chốt quyền trả cổ tức|trả cổ tức bằng cổ phiếu|tăng vốn lên \d+|tăng vốn điều lệ lên|chia cổ tức bằng cổ phiếu|phát hành cổ phiếu tăng vốn|chốt danh sách cổ đông/i.test(text) ||
    (/vpbank|vietcombank|techcombank|mbbank|bidv|vietinbank|acb|hdbank|shb/i.test(text) && (text.includes('cổ tức') || text.includes('tăng vốn') || text.includes('chốt quyền') || text.includes('lợi nhuận'))) ||
    /thị trường lao động.*chuyển đổi số|cải cách thể chế trong kỷ nguyên mới|thị trường lao động việt nam giai đoạn/i.test(text);

  return matchesWhitelistKeyword || matchesRegex;
}

// 2. Nhóm 1: CHỈ TRÍCH, LÊN ÁN BỘ & ĐƠN VỊ TRỰC THUỘC (Critique / Blame on Ministry)
// CHỈ cảnh báo khi có phản ánh, chỉ trích, lên án, quy trách nhiệm thực chất
export const MINISTRY_CRITIQUE_KEYWORDS = [
  'chỉ trích bộ tài chính', 'lên án bộ tài chính', 'quy trách nhiệm bộ tài chính', 'truy trách nhiệm bộ tài chính',
  'đòi truy trách nhiệm', 'bộ tài chính chậm trễ', 'bộ tài chính thờ ơ', 'bộ tài chính buông lỏng',
  'bị chỉ trích gay gắt', 'dư luận bức xúc với bộ', 'lên án ngành thuế', 'chỉ trích ngành thuế',
  'chỉ trích ubcknn', 'ubcknn buông lỏng', 'ubcknn thiếu trách nhiệm', 'chỉ trích hải quan',
  'hải quan sách nhiễu', 'cán bộ thuế vòi vĩnh', 'cán bộ thuế gây khó', 'sách nhiễu doanh nghiệp',
  'vòi vĩnh doanh nghiệp', 'hạch sách người nộp thuế', 'làm khó doanh nghiệp', 'bị tố cáo tham nhũng',
  'tố cáo tiêu cực', 'bị phản ánh tiêu cực', 'buông lỏng quản lý', 'thiếu trách nhiệm gây hậu quả',
  'đổ lỗi cho doanh nghiệp', 'bất cập trong điều hành của bộ', 'lãnh đạo bộ phải chịu trách nhiệm'
];

// 3. Nhóm 2: KÊU VỀ THỦ TỤC, CHÍNH SÁCH BẤT CẬP CỦA BỘ (Procedure & Policy Complaints)
// Báo chí hoặc người dân, doanh nghiệp kêu ca, phản ánh bức xúc về thủ tục, cơ chế của Bộ
export const POLICY_PROCEDURE_COMPLAINT_KEYWORDS = [
  'kêu về thủ tục', 'thủ tục rườm rà', 'thủ tục hành chính phức tạp', 'ách tắc hải quan',
  'nghẽn thông quan', 'ùn tắc hàng hóa cửa khẩu', 'chậm hoàn thuế', 'chậm trễ hoàn thuế',
  'hoàn thuế vat chậm', 'doanh nghiệp kêu trời vì hoàn thuế', 'giam vốn doanh nghiệp',
  'nợ hoàn thuế nghìn tỷ', 'hồ sơ hoàn thuế bị ngâm', 'bất cập thuế tncn',
  'giảm trừ gia cảnh quá lạc hậu', 'giảm trừ gia cảnh lỗi thời', 'thuế thu nhập cá nhân bất hợp lý',
  'bất cập chính sách thuế', 'quy định trói buộc', 'thông tư làm khó', 'nghị định gây nghẽn',
  'vướng mắc nghị định 65', 'nghẽn dòng vốn trái phiếu', 'chậm giải ngân đầu tư công do thủ tục',
  'vướng mắc thủ tục giải ngân', 'chi phí tuân thủ thuế tăng vọt', 'bất cập hóa đơn điện tử',
  'chặn hóa đơn tùy tiện', 'khóa mã số thuế vô lý', 'cưỡng chế thuế oan'
];

// 4. Nhóm 3: KIẾN NGHỊ, ĐỀ XUẤT, KÊU CỨU KHÓ KHĂN CỦA DN & NHÀ ĐẦU TƯ GỬI BỘ (Petitions & Pleas)
// Cộng đồng doanh nghiệp, hiệp hội, nhà đầu tư gửi văn bản kiến nghị, đề xuất tháo gỡ khó khăn cấp bách
export const BUSINESS_INVESTOR_PETITION_KEYWORDS = [
  'kiến nghị bộ tài chính', 'đề xuất với bộ tài chính', 'gửi văn bản lên bộ tài chính',
  'gửi kiến nghị lên bộ', 'doanh nghiệp kêu cứu bộ tài chính', 'hiệp hội kiến nghị bộ',
  'vcci kiến nghị bộ tài chính', 'cứu doanh nghiệp', 'cứu thị trường', 'xin miễn giảm thuế',
  'đề nghị gia hạn thuế', 'khó khăn dòng tiền nghiêm trọng', 'nguy cơ phá sản hàng loạt',
  'doanh nghiệp kiệt quệ', 'nhà đầu tư kiến nghị bộ', 'trái chủ kêu cứu', 'trái chủ kiến nghị',
  'khiếu kiện đòi quyền lợi trái phiếu', 'căng băng rôn kêu cứu', 'đơn thư kêu cứu tập thể',
  'đối thoại khẩn cấp với bộ', 'đề nghị bộ gỡ khó', 'đề nghị sửa thông tư', 'đề nghị sửa luật thuế',
  'khẩn thiết kiến nghị'
];

// 5. Nhóm 4: VỤ VIỆC NGHIÊM TRỌNG ĐANG PHÁT SINH ẢNH HƯỞNG VAI TRÒ, TRÁCH NHIỆM CỦA BỘ (Accountability & Systemic Risks)
// Chỉ áp dụng cho các sự cố ĐANG DIỄN BIẾN MỚI CẤP BÁCH (chưa ngã ngũ / chưa kết thúc điều tra)
export const MINISTRY_ACCOUNTABILITY_KEYWORDS = [
  'khởi tố cán bộ thuế', 'bắt tạm giam cán bộ thuế', 'khởi tố cán bộ hải quan',
  'bắt tạm giam lãnh đạo hải quan', 'sai phạm nghiêm trọng tại ubcknn', 'khởi tố vụ án tại bộ tài chính',
  'thao túng giá chứng khoán quy mô lớn', 'đại án gian lận hóa đơn', 'đường dây hóa đơn khống nghìn tỷ',
  'thất thu ngân sách đặc biệt nghiêm trọng', 'thất thoát tài sản công', 'khủng hoảng trái phiếu doanh nghiệp',
  'vỡ nợ trái phiếu diện rộng', 'mất khả năng thanh toán hàng loạt', 'khủng hoảng niềm tin thị trường tài chính',
  'buôn lậu quy mô lớn qua cửa khẩu', 'thanh tra bộ tài chính phát hiện sai phạm', 'bộ công an điều tra sai phạm tại',
  'thanh tra chính phủ kết luận sai phạm tại bộ tài chính', 'đe dọa an toàn hệ thống tài chính',
  'hối lộ', 'nhận hối lộ', 'đưa hối lộ', 'môi giới hối lộ', 'chỉ đạo thuộc cấp hối lộ',
  'biết sai nhưng không xử lý', 'biết doanh nghiệp sai nhưng không xử lý', 'bỏ qua sai phạm', 'bỏ qua vi phạm',
  'lờ đi sai phạm', 'làm ngơ sai phạm', 'không xử lý sai phạm', 'không chỉ đạo kiểm tra', 'không kiểm tra, giám sát',
  'buông lỏng kiểm tra', 'buông lỏng giám sát', 'thiếu trách nhiệm trong kiểm tra',
  'quy kết trách nhiệm', 'truy trách nhiệm', 'chịu trách nhiệm chỉ đạo', 'đặng công khôi', 'xuyên việt oil',
  'quỹ bog', 'quỹ bình ổn giá', 'phòng giá hàng tư liệu sản xuất', 'thương nhân đầu mối kinh doanh xăng dầu',
  'cục quản lý giá', 'không gửi sao kê tài khoản bog', 'chiếm dụng quỹ bog', 'chiếm dụng quỹ bình ổn'
];

// Danh mục từ khóa chuyên biệt về Trách nhiệm, Bỏ qua sai phạm & Đưa nhận hối lộ từ các cơ quan kiểm tra / giám sát
// Áp dụng tăng trọng số rủi ro đặc biệt cao khi xuất hiện trong bài viết liên quan đến các đơn vị trực thuộc Bộ Tài chính
// LƯU Ý: Phải là các hành vi sai phạm cụ thể, TUYỆT ĐỐI KHÔNG dùng từ đơn lẻ như "trách nhiệm", "bỏ qua" vì gây báo động giả nghiêm trọng
export const INSPECTION_NEGLECT_BRIBERY_KEYWORDS = [
  'hối lộ', 'nhận hối lộ', 'đưa hối lộ', 'môi giới hối lộ', 'chỉ đạo thuộc cấp hối lộ', 'lót tay', 'bôi trơn',
  'thiếu trách nhiệm', 'truy trách nhiệm', 'quy kết trách nhiệm', 'đùn đẩy trách nhiệm', 'thoái thác trách nhiệm', 'chịu trách nhiệm hình sự',
  'thiếu trách nhiệm gây hậu quả nghiêm trọng', 'trách nhiệm người đứng đầu trong vụ án',
  'buông lỏng quản lý', 'buông lỏng kiểm tra', 'buông lỏng giám sát',
  'bỏ qua sai phạm', 'bỏ qua vi phạm', 'lờ đi sai phạm', 'làm ngơ cho sai phạm', 'làm ngơ sai phạm', 'cố ý bỏ qua', 'bỏ lọt tội phạm',
  'không xử lý sai phạm', 'biết sai nhưng không xử lý', 'biết doanh nghiệp sai nhưng không xử lý', 'không chuyển hồ sơ sai phạm',
  'buông lỏng thanh tra', 'thiếu trách nhiệm trong kiểm tra', 'trách nhiệm của cục trong sai phạm',
  'đặng công khôi', 'xuyên việt oil', 'quỹ bog', 'quỹ bình ổn giá', 'phòng giá hàng tư liệu sản xuất',
  'cục quản lý giá', 'thương nhân đầu mối kinh doanh xăng dầu', 'không gửi sao kê tài khoản bog',
  'chiếm dụng quỹ bog', 'chiếm dụng quỹ bình ổn', 'che giấu sai phạm', 'tiếp tay cho sai phạm'
];

// 6. Nhóm 5: VỤ VIỆC ĐÃ XẢY RA / TỐ TỤNG ĐÃ XỬ LÝ / ĐIỂM TIN GIÁM SÁT (Post-Incident / Concluded / Procedural Legal Milestones)
// ĐÂY LÀ TIN THUỘC LĨNH VỰC QUẢN LÝ (Đấu thầu, chi ngân sách, tài sản công...) NHƯNG ĐÃ QUA GIAI ĐOẠN NGUY CƠ MỚI PHÁT SINH.
// NGUYÊN TẮC: CHỈ ĐIỂM TIN GIÁM SÁT, TUYỆT ĐỐI KHÔNG BẬT CẢNH BÁO ĐỎ / BÁO ĐỘNG KHẨN CẤP!
export const POST_INCIDENT_LEGAL_KEYWORDS = [
  'đề nghị truy tố', 'bị đề nghị truy tố', 'kết luận điều tra', 'hoàn tất kết luận điều tra',
  'kết thúc điều tra', 'chuyển hồ sơ sang viện kiểm sát', 'cơ quan an ninh điều tra kết luận',
  'cơ quan cảnh sát điều tra kết luận', 'đưa ra xét xử', 'hầu tòa', 'tòa tuyên án', 'tuyên phạt',
  'bản án sơ thẩm', 'bản án phúc thẩm', 'kháng cáo', 'y án', 'chấp hành án', 'chấp hành hình phạt tù',
  'kê biên tài sản bảo đảm thi hành án', 'thu hồi tài sản vụ án', 'khắc phục hậu quả vụ án',
  'đã nộp tiền khắc phục hậu quả', 'sau thời gian khởi tố', 'giai đoạn 2 của vụ án',
  'cây xanh công minh', 'công ty công minh', 'hơn 600 gói thầu', 'gói thầu cây xanh', '600 gói thầu',
  'vụ án aic', 'vụ án vạn thịnh phát', 'vụ án flc', 'vụ án fcl', 'vụ án tân hoàng minh',
  'vụ án việt á', 'vụ án chuyến bay giải cứu', 'đại án đã kết luận', 'giai đoạn thi hành án'
];

// Danh mục từ khóa nhận diện Nguy cơ Pháp lý & Vỡ nợ Cấp bách ĐANG DIỄN TIẾN (Acute Systemic Risks)
// Đã loại bỏ các từ tố tụng sau điều tra (như "đề nghị truy tố", "tuyên án", "lĩnh án") để tránh báo động giả
export const ACUTE_CRISIS_KEYWORDS = [
  'vỡ nợ', 'khất nợ', 'chậm trả nợ', 'chậm trả gốc lãi', 'mất khả năng thanh toán', 'phong tỏa tài khoản',
  'bắt tạm giam', 'lừa đảo chiếm đoạt', 'thao túng giá chứng khoán', 'thao túng giá',
  'thao túng thị trường chứng khoán', 'gian lận hóa đơn nghìn tỷ', 'trốn thuế quy mô lớn',
  'vỡ nợ chéo', 'rút ruột', 'khiếu kiện đông người', 'căng băng rôn đòi nợ',
  'tin đồn ác ý', 'đình chỉ hoạt động', 'cưỡng chế tài khoản', 'hủy niêm yết bắt buộc',
  'nghẽn lệnh diện rộng', 'sự cố hệ thống giao dịch', 'rò rỉ dữ liệu tài chính'
];

// Danh mục từ khóa nhận diện Rủi ro / Áp lực Thị trường Vừa (Market Stress Keywords)
export const MARKET_STRESS_KEYWORDS = [
  'giảm sâu', 'thua lỗ lớn', 'thua lỗ', 'bốc hơi', 'chạm đáy', 'bán ròng mạnh', 'áp lực nợ xấu tăng vọt',
  'áp lực đáo hạn trái phiếu', 'áp lực đáo hạn', 'chênh lệch giá vàng kỷ lục', 'áp lực tỷ giá tăng vọt',
  'cảnh báo lừa đảo', 'xả hàng loạt', 'khối ngoại xả ròng', 'chảy máu ngoại tệ'
];

// Danh mục từ khóa đặc thù chuyên biệt của Bộ Tài chính (MoF-Specific Domain Keywords)
// Cập nhật toàn diện theo Nghị định số 376/2026/NĐ-CP (bao gồm 34 đơn vị & 5 mảng chức năng mới)
// Dùng để xác định chỉ số liên quan thực chất (MoF Relevance Score)
export const MOF_SPECIFIC_KEYWORDS = [
  // 1. Cơ quan, đơn vị trực thuộc & đối tượng quản lý nhà nước của MoF (Nghị định 376)
  'bộ tài chính', 'cục thuế', 'chi cục thuế', 'ngành thuế', 'tổng cục thuế',
  'cục hải quan', 'chi cục hải quan', 'hải quan', 'tổng cục hải quan',
  'ủy ban chứng khoán nhà nước', 'ủy ban chứng khoán', 'ubcknn', 'sở giao dịch chứng khoán', 'hose', 'hnx', 'vnx',
  'kho bạc nhà nước', 'kho bạc', 'kbnn',
  'cục quản lý giá', 'cục quản lý giám sát bảo hiểm', 'cục quản lý bảo hiểm',
  'thanh tra bộ tài chính', 'thanh tra tài chính', 'cục tài chính doanh nghiệp',
  'cục quản lý nợ và tài chính đối ngoại', 'cục quản lý nợ', 'cục quản lý công sản',
  'cục dự trữ nhà nước', 'tổng cục dự trữ nhà nước', 'dự trữ quốc gia',
  // Các cơ quan mới sáp nhập / nâng cấp theo Nghị định 376/2026/NĐ-CP:
  'cục quản lý đấu thầu', 'cục đấu thầu', 'hệ thống mạng đấu thầu quốc gia',
  'cục đầu tư nước ngoài', 'xúc tiến đầu tư nước ngoài',
  'cục thống kê', 'tổng cục thống kê', 'cơ quan thống kê quốc gia',
  'bảo hiểm xã hội việt nam', 'bhxh việt nam', 'bảo hiểm xã hội', 'bhxh', 'bảo hiểm y tế', 'bhyt',
  'cục phát triển doanh nghiệp tư nhân và kinh tế tập thể', 'cục phát triển doanh nghiệp',
  'vụ quản lý các khu kinh tế', 'vụ quản lý quy hoạch', 'vụ ngân sách nhà nước',
  'vụ đầu tư và phát triển hạ tầng', 'viện chiến lược và chính sách tài chính',

  // 2. Lĩnh vực tài khóa, thuế, hải quan, kho bạc & ngân sách
  'ngân sách nhà nước', 'ngân sách', 'thu ngân sách', 'bội chi ngân sách',
  'thuế thu nhập doanh nghiệp', 'thuế thu nhập cá nhân', 'thuế giá trị gia tăng', 'thuế vat',
  'hoàn thuế', 'truy thu thuế', 'trốn thuế', 'gian lận hóa đơn', 'hóa đơn điện tử', 'hóa đơn',
  'thông quan', 'buôn lậu', 'gian lận thương mại', 'kiểm tra sau thông quan',

  // 3. Thị trường vốn, tài chính, trái phiếu & chứng khoán
  'trái phiếu doanh nghiệp', 'tpdn', 'trái phiếu chính phủ', 'thị trường trái phiếu', 'đáo hạn trái phiếu',
  'chứng khoán', 'cổ phiếu', 'thị trường chứng khoán', 'thao túng chứng khoán', 'bán khống',

  // 4. Giá cả, bảo hiểm, đầu tư công & nợ công
  'quỹ bình ổn giá', 'bình ổn giá', 'giá xăng dầu', 'giá vàng', 'vàng miếng sjc', 'vàng miếng',
  'bảo hiểm nhân thọ', 'bancassurance', 'trục lợi bảo hiểm',
  'đầu tư công', 'giải ngân đầu tư công', 'nợ công', 'tài sản công', 'chính sách tài khóa',

  // 5. Thẩm quyền mới: Đấu thầu, PPP, FDI, Thống kê vĩ mô, BHXH & Quy hoạch (Nghị định 376)
  'đấu thầu qua mạng', 'gói thầu công', 'chỉ định thầu', 'thông thầu', 'dự án ppp', 'đối tác công tư',
  'đấu thầu thuốc', 'đấu thầu vật tư y tế', 'mua sắm tập trung',
  'vốn fdi', 'đầu tư trực tiếp nước ngoài', 'chuyển giá fdi', 'chứng nhận đăng ký đầu tư',
  'chỉ số giá tiêu dùng', 'chỉ số cpi', 'tăng trưởng gdp', 'số liệu kinh tế vĩ mô',
  'nợ đọng bhxh', 'trốn đóng bhxh', 'trục lợi bhyt', 'bảo hiểm thất nghiệp', 'bhtn',
  'quy hoạch vùng', 'kế hoạch phát triển kinh tế xã hội', 'quy hoạch tổng thể quốc gia'
];

// Lĩnh vực cốt lõi thuộc phạm vi quản lý của Bộ Tài chính (Bao gồm 5 lĩnh vực mới theo Nghị định 376/2026/NĐ-CP)
export const MOF_CORE_SECTORS = [
  'tax', 'customs', 'bonds', 'stocks', 'treasury_budget',
  'public_investment', 'price_management', 'insurance',
  'public_debt', 'public_assets', 'inspection_audit', 'national_reserve',
  // 5 lĩnh vực mới theo Nghị định 376/2026/NĐ-CP:
  'bidding_procurement', 'foreign_investment_fdi', 'statistics_macro', 'social_security', 'socioeconomic_planning'
];

// ============================================================================
// BỘ TỪ KHÓA CHUYÊN BIỆT THEO 5 MẢNG THẨM QUYỀN MỚI NGHỊ ĐỊNH 376/2026/NĐ-CP
// ============================================================================

// 1. Đấu thầu & Đối tác công tư (PPP) - Cục Quản lý đấu thầu
export const BIDDING_PPP_KEYWORDS = [
  'đấu thầu', 'chỉ định thầu', 'thông thầu', 'hủy thầu', 'hồ sơ mời thầu', 'hsmt',
  'hồ sơ dự thầu', 'hsdt', 'khiếu nại kết quả mở thầu', 'cài cắm tiêu chí', 'tiêu chí cài cắm',
  'đấu thầu qua mạng', 'hệ thống mạng đấu thầu quốc gia', 'mua sắm tập trung',
  'đấu thầu thuốc', 'đấu thầu vật tư y tế', 'chậm lựa chọn nhà thầu', 'trúng thầu sát giá',
  'dự án ppp', 'đối tác công tư', 'hợp đồng bot', 'hợp đồng bt', 'cục quản lý đấu thầu'
];

// 2. Đầu tư nước ngoài (FDI) & Xúc tiến đầu tư - Cục Đầu tư nước ngoài
export const FDI_INVESTMENT_KEYWORDS = [
  'vốn fdi', 'đầu tư nước ngoài', 'cục đầu tư nước ngoài', 'giải ngân vốn fdi', 'thu hút fdi',
  'chứng nhận đăng ký đầu tư', 'giấy chứng nhận đầu tư', 'chuyển giá', 'chuyển giá trốn thuế',
  'doanh nghiệp fdi', 'khu công nghiệp fdi', 'vốn ngoại đầu tư', 'dòng vốn fdi', 'vướng mắc cấp phép fdi',
  'thanh tra doanh nghiệp fdi', 'ưu đãi thuế fdi', 'dự án fdi nghìn tỷ'
];

// 3. Bảo hiểm xã hội, BHYT & BHTN - Bảo hiểm xã hội Việt Nam
export const SOCIAL_SECURITY_KEYWORDS = [
  'bảo hiểm xã hội', 'bhxh', 'bảo hiểm y tế', 'bhyt', 'bảo hiểm thất nghiệp', 'bhtn',
  'bảo hiểm xã hội việt nam', 'bhxh việt nam', 'trốn đóng bhxh', 'chậm đóng bhxh',
  'nợ đọng bhxh', 'nợ bảo hiểm kéo dài', 'trục lợi quỹ bhyt', 'trục lợi bhxh',
  'rút bhxh một lần', 'chế độ thai sản', 'lương hưu', 'quỹ bảo hiểm xã hội', 'sổ bhxh',
  'quyền lợi người lao động bị treo do nợ bảo hiểm', 'mất cân đối quỹ bhxh'
];

// 4. Thống kê quốc gia, CPI & GDP vĩ mô - Cục Thống kê
export const STATISTICS_MACRO_KEYWORDS = [
  'thống kê quốc gia', 'cục thống kê', 'tổng cục thống kê', 'chỉ số giá tiêu dùng',
  'chỉ số cpi', 'cpi bình quân', 'tăng trưởng gdp', 'số liệu gdp', 'điều tra thống kê',
  'sai lệch số liệu thống kê', 'công bố gdp', 'chỉ số sản xuất công nghiệp iip',
  'độ vênh số liệu thống kê', 'tính toán cpi', 'dữ liệu thống kê quốc gia'
];

// 5. Chiến lược, Quy hoạch & Kế hoạch KT-XH - Vụ Quản lý quy hoạch, Viện Chiến lược
export const SOCIOECONOMIC_PLANNING_KEYWORDS = [
  'quy hoạch tổng thể quốc gia', 'quy hoạch vùng', 'kế hoạch phát triển kinh tế xã hội',
  'vụ quản lý quy hoạch', 'quy hoạch tỉnh', 'chỉ tiêu phát triển kt-xh',
  'phản biện quy hoạch', 'điều chỉnh quy hoạch', 'kịch bản tăng trưởng kinh tế',
  'viện chiến lược và chính sách tài chính', 'chiến lược tài chính quốc gia'
];

/**
 * Định tuyến chính xác đơn vị chủ trì (Lead Unit) trong 34 đơn vị của Nghị định 376/2026/NĐ-CP
 */
export function resolveResponsibleAgency(text: string, sector?: string): string {
  const agency = resolveAgencyByDecree376(text, sector);
  return agency.name;
}

// Danh mục từ khóa Thể chế, Chính sách & Quản trị Phòng ngừa của Bộ Tài chính (MoF Policy & Mitigation Keywords)
// Các cụm từ này đóng vai trò Giảm trừ rủi ro (Risk Dampener) để chống báo động giả
export const MOF_POLICY_KEYWORDS = [
  'bộ tài chính', 'chính sách tài khóa', 'nghị định', 'thông tư', 'kho bạc nhà nước', 'kho bạc',
  'cục thuế', 'cục hải quan', 'cục quản lý giá', 'ủy ban chứng khoán', 'ubcknn',
  'cục quản lý đấu thầu', 'cục đầu tư nước ngoài', 'cục thống kê', 'bảo hiểm xã hội việt nam',
  'vụ quản lý quy hoạch', 'cục phát triển doanh nghiệp tư nhân',
  'hướng dẫn nộp thuế', 'hướng dẫn thi hành', 'tháo gỡ khó khăn', 'hỗ trợ doanh nghiệp',
  'tháo gỡ điểm nghẽn', 'gỡ khó', 'gỡ vướng', 'chia sẻ khó khăn', 'miễn thuế', 'giảm thuế',
  'gia hạn thuế', 'hoàn thuế tự động', 'hoàn thuế', 'thông quan số', 'hóa đơn điện tử', 'non-prefunding',
  'đối thoại doanh nghiệp', 'cải cách hành chính', 'chuyển đổi số', 'bình ổn giá', 'bình ổn thị trường',
  'ổn định kinh tế vĩ mô', 'kiểm soát tốt lạm phát', 'giải ngân đầu tư công', 'đầu tư công',
  'quản trị rủi ro', 'phòng ngừa rủi ro', 'kiểm soát rủi ro', 'hạn chế rủi ro', 'giảm thiểu rủi ro', 'nhận diện rủi ro',
  'kế hoạch thanh tra', 'thanh tra thường kỳ', 'thanh tra chuyên ngành', 'thanh tra định kỳ', 'kết luận thanh tra',
  'nâng cao hiệu lực thanh tra', 'chống thất thu', 'ngăn chặn thất thu', 'chống buôn lậu', 'đấu tranh chống buôn lậu',
  'chống gian lận thương mại', 'làm lành mạnh thị trường', 'bảo vệ nhà đầu tư', 'kỷ luật, kỷ cương', 'chấn chỉnh kỷ cương',
  'công khai, minh bạch', 'đính chính', 'bác bỏ tin đồn', 'làm rõ thông tin'
];

// Danh mục từ khóa nhận diện Điểm sáng Đột phá (Bright Spots)
export const BRIGHT_SPOT_KEYWORDS = [
  'vượt dự toán', 'thu ngân sách vượt', 'kỷ lục', 'bứt phá', 'tăng trưởng mạnh', 'nâng hạng',
  'non-prefunding', 'fdi tăng', 'fdi đạt kỷ lục', 'xuất siêu kỷ lục', 'tháo gỡ điểm nghẽn',
  'miễn thuế', 'giảm thuế', 'gia hạn thuế', 'khởi sắc', 'mua ròng', 'vượt đỉnh', 'thông quan tự động',
  'chuyển đổi số thành công', 'hóa đơn điện tử máy tính tiền', 'thặng dư thương mại'
];

// ============================================================================
// 6 TRỤ CỘT ĐIỂM SÁNG CHIẾN LƯỢC CỦA BỘ TÀI CHÍNH & KINH TẾ VĨ MÔ
// ============================================================================
export type BrightSpotPillar =
  | 'BUDGET_REVENUE'        // Trụ cột 1: Thu ngân sách & Cân đối vĩ mô vượt bậc
  | 'TAX_CUSTOMS_REFORM'     // Trụ cột 2: Cải cách Thuế, Hóa đơn điện tử & Hải quan số
  | 'CAPITAL_MARKET'        // Trụ cột 3: Thị trường Vốn, Chứng khoán & Nâng hạng
  | 'PUBLIC_INVESTMENT'     // Trụ cột 4: Giải ngân Đầu tư công & Ngân quỹ quốc gia
  | 'MACRO_CREDIT_RATING'   // Trụ cột 5: Kinh tế Vĩ mô, Xếp hạng Tín nhiệm & FDI
  | 'FISCAL_RELIEF'         // Trụ cột 6: Gói Hỗ trợ Tài khóa Thực chất cho Doanh nghiệp & Xã hội
  | 'GENERAL';

export const PILLAR_BUDGET_REVENUE_KEYWORDS = [
  'thu ngân sách vượt', 'vượt dự toán', 'thu ngân sách đạt', 'tăng thu ngân sách',
  'cân đối ngân sách', 'thặng dư ngân sách', 'chống thất thu', 'thu thuế tmđt',
  'thu ngân sách kỷ lục', 'hoàn thành dự toán thu', 'về đích sớm dự toán', 'tiến độ thu ngân sách',
  'nguồn thu bền vững', 'vượt thu ngân sách', 'thu ngân sách nhà nước tăng'
];

export const PILLAR_TAX_CUSTOMS_REFORM_KEYWORDS = [
  'hoàn thuế tự động', 'hoàn thuế điện tử', 'hóa đơn điện tử máy tính tiền', 'thông quan tự động',
  'hải quan số', 'thông quan số', 'cửa khẩu số', 'giảm thời gian thông quan',
  'rút ngắn thời gian thông quan', 'chuyển đổi số thuế', 'chuyển đổi số hải quan',
  'cải cách hành chính thuế', 'đơn giản hóa thủ tục thuế', 'hệ thống thông quan điện tử',
  'cắt giảm thủ tục hải quan', 'thông quan 24/7', 'ngành thuế chuyển đổi số'
];

export const PILLAR_CAPITAL_MARKET_KEYWORDS = [
  'nâng hạng thị trường', 'nâng hạng ttck', 'tiêu chuẩn ftse', 'tiêu chuẩn msci', 'ftse', 'msci',
  'non-prefunding', 'không ký quỹ 100%', 'thông tư 68', 'hệ thống krx', 'vận hành krx',
  'khối ngoại mua ròng', 'mua ròng kỷ lục', 'vốn hóa thị trường đạt', 'thanh khoản thị trường vượt',
  'chỉ số vn-index vượt', 'phát hành tpcp thành công', 'lãi suất tpcp giảm', 'minh bạch hóa thị trường chứng khoán',
  'mở rộng cơ chế bù trừ', 'thanh toán bù trừ trung tâm', 'nâng quy mô thị trường vốn'
];

export const PILLAR_PUBLIC_INVESTMENT_KEYWORDS = [
  'giải ngân đầu tư công', 'giải ngân vốn đầu tư công', 'vượt kế hoạch giải ngân',
  'tháo gỡ điểm nghẽn', 'dự án trọng điểm quốc gia', 'tiến độ giải ngân cao',
  'quản lý ngân quỹ', 'tối ưu hóa ngân quỹ', 'ngân quỹ an toàn', 'vốn đầu tư công đạt',
  'giải ngân vốn ngân sách', 'đẩy nhanh giải ngân'
];

export const PILLAR_MACRO_CREDIT_RATING_KEYWORDS = [
  'nâng hạng tín nhiệm', 'nâng triển vọng tín nhiệm', "moody's", "s&p", 'fitch',
  'tăng trưởng gdp', 'gdp tăng trưởng', 'kiểm soát lạm phát', 'lạm phát trong mục tiêu',
  'xuất siêu kỷ lục', 'thặng dư thương mại', 'fdi kỷ lục', 'fdi giải ngân kỷ lục',
  'hút vốn fdi', 'dòng vốn fdi tăng', 'thặng dư vãng lai', 'cán cân thương mại thặng dư',
  'quỹ tiền tệ quốc tế imf', 'ngân hàng thế giới wb nâng dự báo'
];

export const PILLAR_FISCAL_RELIEF_KEYWORDS = [
  'miễn thuế', 'giảm thuế', 'gia hạn thuế', 'giảm thuế vat', 'giảm 2% vat',
  'gia hạn nộp thuế', 'gói hỗ trợ tài khóa', 'hỗ trợ dòng tiền doanh nghiệp',
  'miễn tiền thuê đất', 'giảm tiền thuê đất', 'chính sách tài khóa hỗ trợ',
  'tháo gỡ khó khăn cho sản xuất kinh doanh', 'khoan thư sức dân'
];

// Từ khóa Bằng chứng Số liệu và Thành tựu Định lượng Thực tế
export const ACHIEVEMENT_EVIDENCE_KEYWORDS = [
  'kỷ lục', 'vượt dự toán', 'vượt kế hoạch', 'vượt mốc', 'vượt chỉ tiêu',
  'tăng trưởng 2 con số', 'đạt mốc', 'chính thức vận hành', 'về đích sớm',
  'nghìn tỷ', 'tỷ đồng', 'triệu usd', 'tỷ usd', 'tăng mạnh', 'thặng dư',
  'bứt phá', 'đạt mức cao nhất', 'đạt đỉnh', 'thành công lớn', 'bước ngoặt',
  'được quốc tế công nhận', 'được tổ chức quốc tế đánh giá cao', 'nâng bậc'
];

// Bộ lọc Triệt tiêu Điểm Sáng Giả (Anti-False-Positive Dampeners)
// Loại trừ các dự báo suông, kỳ vọng chủ quan, khuyến nghị mua bán cổ phiếu, và quảng bá thương mại
export const FALSE_BRIGHT_SPOT_SPECULATION_TERMS = [
  'kỳ vọng', 'triển vọng', 'có thể sẽ', 'dự kiến phấn đấu', 'chờ đợi', 'nếu được',
  'dự báo có thể', 'khuyến nghị mua', 'mục tiêu giá', 'mong muốn', 'tìm cơ hội',
  'kịch bản khả quan', 'phỏng đoán', 'có thể đạt', 'khuyến nghị nắm giữ', 'target',
  'giá mục tiêu', 'chờ xác nhận', 'sắp bùng nổ', 'tiềm năng', 'có thể tăng',
  'được dự báo', 'được kỳ vọng', 'tín hiệu bắt đáy', 'tin đồn khả quan'
];

export const FALSE_BRIGHT_SPOT_COMMERCIAL_PR_TERMS = [
  'mở bán', 'khuyến mãi', 'chiết khấu', 'bắt đáy', 'lướt sóng', 'khuyến nghị đầu tư',
  'game show', 'tất niên', 'hội chợ thương mại', 'cổ phiếu trần 3 phiên', 'cổ phiếu tím',
  'room ngoại kỳ vọng', 'quảng bá thương hiệu', 'chương trình ưu đãi', 'mở bán căn hộ',
  'ra mắt sản phẩm', 'chào bán', 'đại lý', 'khách hàng trúng thưởng', 'booking',
  'shophouse', 'condotel', 'voucher', 'ưu đãi lãi suất vay mua nhà', 'lái tàu', 'đội lái'
];

export const FALSE_BRIGHT_SPOT_ROUTINE_ADMIN_TERMS = [
  'họp giao ban thường kỳ', 'tập huấn nghiệp vụ', 'công bố quyết định bổ nhiệm',
  'trao bằng khen', 'chúc mừng năm mới', 'hội thao', 'giao lưu thể thao',
  'thăm chúc tết', 'khai mạc giải thể thao', 'liên hoan văn nghệ'
];

export const STRICT_CRISIS_TERMS = [
  'khởi tố', 'sai phạm', 'bắt tạm giam', 'trốn thuế', 'thao túng', 'vỡ nợ',
  'chậm trả nợ', 'nợ xấu', 'thanh tra phát hiện', 'cưỡng chế', 'gian lận',
  'điều tra', 'án phạt', 'tịch thu', 'phong tỏa tài khoản', 'bị truy tố'
];

export interface BrightSpotScoreBreakdown {
  score: number; // Điểm số thành tựu điểm sáng chuẩn hóa (0 - 100)
  isBrightSpot: boolean; // Có đạt chuẩn điểm sáng chặt chẽ
  confidenceScore: number; // Điểm tin cậy điểm sáng (0 - 100%)
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  isHighConfidenceBrightSpot: boolean; // isBrightSpot && confidenceScore >= 70
  pillar: BrightSpotPillar;
  pillarTitleVi: string;
  pillarBadge: string;
  mofRelevanceScore: number; // Điểm gắn kết với thẩm quyền MoF / Vĩ mô (0 - 100)
  achievementEvidenceScore: number; // Điểm số liệu & mốc thành tựu định lượng (0 - 100)
  weights: {
    mofPillarWeight: number;
    achievementEvidenceWeight: number;
    positiveSentimentWeight: number;
    speculationDampenerWeight: number;
    commercialPrDampenerWeight: number;
    routineAdminDampenerWeight: number;
    officialSourceBonusWeight: number;
  };
  matchedFactors: {
    pillarKeywords: string[];
    evidenceKeywords: string[];
    speculationKeywords: string[];
    commercialPrKeywords: string[];
  };
  reasons: string[];
}

// Các từ khóa tích cực xuất hiện ngay tiêu đề
const POSITIVE_TITLE_TERMS = [
  'tăng mạnh', 'vượt đỉnh', 'khởi sắc', 'lãi lớn', 'kỷ lục', 'mua ròng', 'bứt phá',
  'hướng dẫn', 'hỗ trợ', 'giảm thuế', 'miễn thuế', 'tăng thu', 'vượt dự toán',
  'non-prefunding', 'thông quan số', 'hút vốn', 'bật tăng', 'khởi sắc'
];

export interface MinistryAlertAssessment {
  isUrgent: boolean;
  category: MinistryAlertCategory;
  categoryLabelVi: string;
  urgencyReason: string;
  isObjectiveMarket: boolean;
  isPostIncident?: boolean;
  matchedTerms: string[];
}

/**
 * Nhận diện bài viết thuộc diện Bộ Tài chính đề xuất bổ sung thẩm quyền / chức năng
 * (ví dụ: đề xuất bổ sung thẩm quyền khởi tố một số vụ án thuế, quyền sở hữu trí tuệ; đề xuất chức năng điều tra)
 * Đây là hoạt động thường quy về hoàn thiện thể chế & chức năng quản lý nhà nước của Bộ,
 * TUYỆT ĐỐI KHÔNG PHẢI tin cảnh báo rủi ro khẩn cấp.
 */
export function isMinistryAuthorityProposal(textOrArticle: string | ScrapedNewsItem): boolean {
  if (!textOrArticle) return false;
  let text = '';
  if (typeof textOrArticle === 'string') {
    text = textOrArticle.toLowerCase();
  } else {
    const title = (textOrArticle.title || '').toLowerCase();
    const summary = (textOrArticle.summary || textOrArticle.snippet || '').toLowerCase();
    text = `${title} ${summary}`;
  }

  // Cụm từ khóa điển hình về đề xuất bổ sung thẩm quyền / chức năng
  const hasAuthorityKeywords = 
    /đề xuất (bổ sung thẩm quyền|thêm thẩm quyền|thẩm quyền khởi tố|quyền khởi tố|chức năng điều tra|thẩm quyền điều tra)/i.test(text) ||
    /thẩm quyền khởi tố (một số vụ án|vụ án liên quan đến thuế|vụ án thuế|thuế|sở hữu trí tuệ|hàng giả)/i.test(text) ||
    /bổ sung thẩm quyền (khởi tố|điều tra|xử lý)/i.test(text) ||
    /bộ tài chính đề xuất (bổ sung thẩm quyền|thêm thẩm quyền|thẩm quyền|khởi tố|điều tra)/i.test(text);

  const hasContextKeywords = 
    (text.includes('bộ tài chính') || text.includes('hải quan') || text.includes('ngành thuế') || text.includes('tổng cục thuế')) &&
    text.includes('thẩm quyền') &&
    (text.includes('khởi tố') || text.includes('điều tra')) &&
    (text.includes('đề xuất') || text.includes('góp ý') || text.includes('kiến nghị') || text.includes('dự thảo') || text.includes('sửa đổi'));

  return Boolean(hasAuthorityKeywords || hasContextKeywords);
}

/**
 * Kiểm tra xem bài viết có thuộc diện Công bố Luật / Lệnh của Chủ tịch nước / Ban hành Thể chế & Quản trị Hành chính Thường quy hay không
 * (Giúp ngăn chặn triệt để việc xếp nhầm các tin tức này vào cảnh báo rủi ro / khẩn cấp)
 */
export function isRoutineLegalPromulgationOrGovernance(textOrArticle: string | ScrapedNewsItem): boolean {
  if (!textOrArticle) return false;
  let text = '';
  if (typeof textOrArticle === 'string') {
    text = textOrArticle.toLowerCase();
  } else {
    const title = (textOrArticle.title || '').toLowerCase();
    const summary = (textOrArticle.summary || textOrArticle.snippet || '').toLowerCase();
    const sentimentReason = (textOrArticle.sentimentReason || '').toLowerCase();
    text = `${title} ${summary} ${sentimentReason}`;
  }

  // 1. Công bố Lệnh của Chủ tịch nước, Ban hành luật, Công bố luật, Nghị quyết của Quốc hội
  const isPromulgation = 
    /công bố lệnh của chủ tịch nước|lệnh của chủ tịch nước|chủ tịch nước công bố lệnh|chủ tịch nước ký lệnh|lệnh của chủ tịch nước về việc công bố|quốc hội thông qua luật|công bố luật|luật sửa đổi, bổ sung một số điều của luật|nghị định quy định chi tiết thi hành|thông tư hướng dẫn thi hành|nghị quyết của ủy ban thường vụ quốc hội|lệnh chủ tịch nước/i.test(text);

  // 2. Các văn bản luật trọng điểm trong bối cảnh ban hành, hiệu lực, hoàn thiện khung thể chế
  const isStatutoryContext = 
    (text.includes('luật phòng, chống rửa tiền') || text.includes('luật phòng chống rửa tiền') || 
     text.includes('luật các tổ chức tín dụng') || text.includes('luật ngân hàng nhà nước') || 
     text.includes('luật quản lý thuế') || text.includes('luật chứng khoán') || 
     text.includes('luật giá') || text.includes('luật ngân sách nhà nước') || 
     text.includes('luật thuế giá trị gia tăng') || text.includes('luật thuế thu nhập doanh nghiệp')) &&
    (text.includes('công bố') || text.includes('ban hành') || text.includes('lệnh của chủ tịch nước') || 
     text.includes('sửa đổi, bổ sung') || text.includes('nghị quyết') || text.includes('kế hoạch triển khai') || 
     text.includes('hiệu lực thi hành') || text.includes('triển khai thi hành') || text.includes('phổ biến pháp luật'));

  // 3. Hoạt động quản trị điều hành hành chính, giao ban, hội nghị, tập huấn thường quy
  const isRoutineAdmin = 
    /hội nghị triển khai nhiệm vụ|hội nghị thường kỳ|giao ban công tác|tổng kết công tác năm|kế hoạch công tác năm|phổ biến quán triệt|tập huấn nghiệp vụ|công bố thủ tục hành chính mới|hướng dẫn nghiệp vụ định kỳ|họp báo thường kỳ/i.test(text);

  // 4. Chỉ đạo, nỗ lực và kết quả điều hành tích cực tại địa phương (Giải ngân đầu tư công, thu ngân sách, tiến độ dự án, khơi thông nguồn lực đầu tư)
  // Ví dụ: "Cần Thơ ưu tiên hiệu quả đầu tư, khơi thông nguồn lực cho tăng trưởng"
  const isPositiveLocalGovernance = 
    // Mẫu 1: Giải ngân đầu tư công và tiến độ dự án
    (((text.includes('giải ngân') || text.includes('đầu tư công') || text.includes('vốn đầu tư') || text.includes('tiến độ')) &&
      (text.includes('đẩy nhanh') || text.includes('tăng tốc') || text.includes('nỗ lực') || text.includes('quyết tâm') || 
       text.includes('những tháng cuối năm') || text.includes('cuối năm') || text.includes('phấn đấu') || text.includes('tập trung') || 
       text.includes('đôn đốc') || text.includes('chủ động') || text.includes('khởi sắc') || text.includes('tích cực') || 
       text.includes('triển khai') || text.includes('điểm sáng') || text.includes('tháo gỡ khó khăn') || text.includes('hoàn thành kế hoạch'))) ||
     // Mẫu 2: Phát triển kinh tế & khơi thông nguồn lực đầu tư tại các địa phương (Cần Thơ, Hà Nội, TP.HCM...)
     (/cần thơ|hà nội|tp\.hcm|thành phố hồ chí minh|đà nẵng|hải phòng|quảng ninh|bình dương|đồng nai|bà rịa|vũng tàu|địa phương|các tỉnh/i.test(text) &&
      (text.includes('ưu tiên hiệu quả đầu tư') || text.includes('khơi thông nguồn lực') || text.includes('nguồn lực cho tăng trưởng') ||
       text.includes('hiệu quả đầu tư') || text.includes('động lực tăng trưởng') || text.includes('tạo đà tăng trưởng') ||
       text.includes('thu hút nguồn lực') || text.includes('tập trung nguồn lực') || text.includes('thúc đẩy đầu tư'))) ||
     // Mẫu 3: Cụm từ chuyên biệt về tối ưu hóa và khơi thông nguồn lực
     /khơi thông nguồn lực|ưu tiên hiệu quả đầu tư|nguồn lực cho tăng trưởng|tạo động lực tăng trưởng bền vững/i.test(text));

  // 5. Phát biểu chỉ đạo, quán triệt trách nhiệm và đôn đốc công tác thường quy của Lãnh đạo (Bộ trưởng, Thứ trưởng, Thủ tướng...)
  // Ví dụ: "Bộ trưởng Trần Hồng Minh: Không buông lỏng trách nhiệm trong giải ngân vốn đầu tư công"
  // Dù có từ "buông lỏng" nhưng đặt trong ngữ cảnh phủ định "không buông lỏng", đây là phát biểu điều hành chỉ đạo tích cực thường quy
  const isRoutineLeadershipDirective =
    ((text.includes('bộ trưởng') || text.includes('thứ trưởng') || text.includes('thủ tướng') || text.includes('phó thủ tướng') || text.includes('lãnh đạo bộ')) &&
     (text.includes('không buông lỏng') || text.includes('trách nhiệm trong giải ngân') || text.includes('nêu cao trách nhiệm') ||
      text.includes('siết chặt kỷ luật') || text.includes('siết chặt kỷ cương') || text.includes('đôn đốc giải ngân') ||
      text.includes('gắn trách nhiệm') || text.includes('quyết liệt giải ngân') || text.includes('chỉ đạo giải ngân') ||
      text.includes('chỉ đạo:') || text.includes('yêu cầu:') || text.includes('nhấn mạnh:') ||
      (text.includes('giải ngân') && (text.includes('chỉ đạo') || text.includes('yêu cầu') || text.includes('đôn đốc') || text.includes('trách nhiệm'))))) ||
    /không buông lỏng (trách nhiệm|quản lý|giám sát|điều hành)|kiên quyết không buông lỏng|không được buông lỏng|không để xảy ra buông lỏng/i.test(text) ||
    /trách nhiệm trong giải ngân vốn|trách nhiệm giải ngân vốn đầu tư công|đôn đốc giải ngân vốn đầu tư công|siết chặt kỷ luật, kỷ cương trong giải ngân/i.test(text);

  // 6. Phân định nhiệm vụ, tinh gọn bộ máy và phân công thẩm quyền quản lý nhà nước thường quy
  // Ví dụ: "Từ tháng 12/2026: Bỏ trách nhiệm của Bộ Tài chính trong kiểm tra nghiệp vụ in, đúc, tiêu hủy tiền"
  // Đây là văn bản quy định phân định nhiệm vụ giữa các Bộ ngành (Bộ Tài chính và Ngân hàng Nhà nước),
  // bãi bỏ các khâu kiểm tra trung gian kỹ thuật tiền tệ để tinh gọn bộ máy - TUYỆT ĐỐI KHÔNG phải vụ việc sai phạm hay rủi ro truyền thông.
  const isInstitutionalDelegationOrMachineryStreamlining = 
    /bỏ trách nhiệm (của )?bộ tài chính trong kiểm tra/i.test(text) ||
    /kiểm tra nghiệp vụ in,?\s*đúc,?\s*tiêu hủy tiền/i.test(text) ||
    /nghiệp vụ in,?\s*đúc,?\s*tiêu hủy tiền/i.test(text) ||
    /in,?\s*đúc,?\s*tiêu hủy tiền/i.test(text) ||
    /bỏ trách nhiệm.*kiểm tra nghiệp vụ/i.test(text) ||
    /bãi bỏ (nhiệm vụ|trách nhiệm) kiểm tra/i.test(text) ||
    /phân định (lại )?(thẩm quyền|chức năng|nhiệm vụ|trách nhiệm) giữa/i.test(text) ||
    /điều chỉnh (chức năng|nhiệm vụ|thẩm quyền) của bộ/i.test(text) ||
    /tinh gọn bộ máy|sắp xếp lại chức năng nhiệm vụ/i.test(text);

  // 7. Nghiên cứu kinh tế vĩ mô, thị trường lao động, chuyển đổi số & cải cách thể chế kỷ nguyên mới
  // Ví dụ: "Thị trường lao động Việt Nam giai đoạn 2020-2025 dưới tác động của chuyển đổi số và bước ngoặt cải cách thể chế trong kỷ nguyên mới"
  const isMacroResearchAndInstitutionalDevelopment =
    /thị trường lao động|chuyển đổi số.*cải cách thể chế|cải cách thể chế trong kỷ nguyên mới|kỷ nguyên mới|bước ngoặt cải cách thể chế|giai đoạn \d{4}-\d{4}|nghiên cứu thể chế|thể chế kinh tế thị trường/i.test(text);

  // Ngoại lệ nghiêm ngặt: Nếu có sự cố khởi tố bắt giam cán bộ, tham nhũng, gian lận, đại án đang phát sinh
  // HOẶC có mâu thuẫn chỉ đạo - thực tế số liệu (Narrative-Reality Divergence: thấp kỷ lục, dưới 30%, địa phương kêu khó)
  const hasDivergenceOrCrisis = 
    /thấp kỷ lục|chậm kỷ lục|dưới 30%|giải ngân dưới|địa phương kêu khó|ách tắc|ì ạch|vướng mắc thủ tục|chậm hoàn thuế|chưa đạt kỳ vọng|kêu cứu/i.test(text);

  const hasAcuteCriminalIncident = 
    /khởi tố bị can|khởi tố cán bộ|bắt tạm giam cán bộ|cán bộ nhận hối lộ|đại án tham nhũng|vụ án xuyên việt oil|bị can đặng công khôi|quỹ bog|chiếm dụng quỹ/i.test(text);

  if (hasAcuteCriminalIncident || hasDivergenceOrCrisis) return false;

  return Boolean(
    isPromulgation ||
    isStatutoryContext ||
    isRoutineAdmin ||
    isPositiveLocalGovernance ||
    isRoutineLeadershipDirective ||
    isInstitutionalDelegationOrMachineryStreamlining ||
    isMacroResearchAndInstitutionalDevelopment
  );
}

/**
 * Nhận diện thông tin tài chính - thị trường thông thường mang tính chất điểm báo,
 * hoặc tin kết quả giải ngân đầu tư công / thu chi ngân sách định kỳ đạt chuẩn
 * không chứa khoảng trống thông tin và không có mâu thuẫn chỉ đạo - thực tế.
 * 
 * Ví dụ điển hình từ yêu cầu người dùng:
 * - "Vn Index tiếp tục giảm", "Vn-Index tăng nhẹ", "chốt phiên giao dịch"
 * - "PNJ hồi phục mạnh", "cổ phiếu PNJ bật tăng", "cổ phiếu ngân hàng phân hóa"
 * - "Giải ngân đầu tư công đạt hơn 644.000 tỷ đồng" (báo cáo tiến độ chuẩn, không có vướng mắc hay chậm trễ)
 */
export function isRoutineFinancialMarketRoundup(
  textOrArticle: string | ScrapedNewsItem,
  art?: ScrapedNewsItem
): { isRoundup: boolean; reason?: string } {
  if (!textOrArticle) return { isRoundup: false };
  let fullText = '';
  let articleObj: ScrapedNewsItem | undefined = art;

  if (typeof textOrArticle === 'string') {
    fullText = textOrArticle.toLowerCase();
  } else {
    articleObj = textOrArticle;
    const title = (textOrArticle.title || '').toLowerCase();
    const summary = (textOrArticle.summary || textOrArticle.snippet || '').toLowerCase();
    const sentimentReason = (textOrArticle.sentimentReason || '').toLowerCase();
    fullText = `${title} ${summary} ${sentimentReason}`;
  }

  // 1. Ngoại lệ nghiêm ngặt: Nếu phát hiện dấu hiệu khủng hoảng thể chế, thanh tra, sai phạm, khởi tố, hoặc vướng mắc chính sách
  const hasInstitutionalCrisis =
    /khởi tố|bắt tạm giam|nhận hối lộ|đưa hối lộ|tham ô|chiếm đoạt|lừa đảo|thao túng (thị trường|giá|chứng khoán)|sai phạm tại|thanh tra bộ|xuyên việt oil|đặng công khôi|quỹ bog|hủy niêm yết bắt buộc|đình chỉ giao dịch vì vi phạm/i.test(fullText);
  if (hasInstitutionalCrisis) {
    return { isRoundup: false };
  }

  // 2. Ngoại lệ độ vênh Narrative-Reality Divergence hoặc vướng mắc giải ngân / thủ tục
  const hasDivergenceOrDisbursementCrisis =
    /thấp kỷ lục|chậm kỷ lục|dưới 30%|giải ngân dưới|địa phương kêu khó|ách tắc|ì ạch|vướng mắc thủ tục|chậm giải ngân|nguy cơ không đạt kế hoạch|quy kết trách nhiệm|kêu khó vì cơ chế/i.test(fullText) ||
    (articleObj && detectNarrativeRealityDivergence(fullText, articleObj).detected);
  if (hasDivergenceOrDisbursementCrisis) {
    return { isRoundup: false };
  }

  // 3. Ngoại lệ mầm mống rủi ro chính sách hoặc khoảng trống pháp lý công nghệ
  if (articleObj && (isLatentPolicyCrisis(fullText, articleObj) || isLatentRiskInPositiveTech(fullText, articleObj))) {
    return { isRoundup: false };
  }

  // 4. Ngoại lệ có đơn thư, kiến nghị, khiếu nại, phản ánh bức xúc
  const hasPolicyComplaints =
    /kêu cứu|kiến nghị khẩn|bức xúc|lúng túng|chưa rõ cách tính|người dân bức xúc|doanh nghiệp kêu cứu|chậm hoàn thuế/i.test(fullText);
  if (hasPolicyComplaints) {
    return { isRoundup: false };
  }

  // 5. Kiểm tra dạng 1: Diễn biến chỉ số chứng khoán (VN-Index, HNX, UPCoM, VN30...)
  // Ví dụ: "Vn Index tiếp tục giảm", "VN-Index tăng hơn 10 điểm", "VN-Index giằng co"
  const isStockIndexRoundup =
    /vn-index|vnindex|hnx-index|upcom-index|vn30|chỉ số chứng khoán/i.test(fullText) &&
    /tiếp tục giảm|tiếp tục tăng|hồi phục mạnh|phục hồi mạnh|giảm điểm|tăng điểm|lao dốc|bật tăng|rung lắc|giằng co|chốt phiên|kết phiên|chìm trong sắc đỏ|sắc xanh|khối ngoại|thanh khoản|áp lực chốt lời|vượt mốc|mất mốc|phiên hôm nay|sụt giảm/i.test(fullText);

  // 6. Kiểm tra dạng 2: Biến động cổ phiếu doanh nghiệp cá lẻ, nhóm ngành (PNJ, VIC, HPG...)
  // Ví dụ: "PNJ hồi phục mạnh", "cổ phiếu PNJ", "nhóm thép khởi sắc"
  const isCorporateStockMovement =
    /(cổ phiếu|mã|thị giá|chứng khoán)\s+(pnj|vic|vhm|vre|hpg|ssi|vnd|vcb|bid|ctg|tcb|mbb|fpt|msn|mwg|vnm|dgc|hdb|stb|shb|tpk|pvd|pvs)/i.test(fullText) ||
    /pnj hồi phục|cổ phiếu pnj|hồi phục mạnh.*pnj|pnj tăng trần|thị giá pnj|pnj/i.test(fullText) && /hồi phục|tăng trần|khởi sắc|phục hồi|giảm điểm|điều chỉnh/i.test(fullText) ||
    ((/cổ phiếu|nhóm cổ phiếu|nhóm ngành/i.test(fullText)) &&
     /hồi phục mạnh|phục hồi mạnh|tăng trần|bứt phá|hút dòng tiền|khối ngoại mua ròng|khối ngoại bán ròng|chốt lời/i.test(fullText));

  // 7. Kiểm tra dạng 3: Bản tin giá vàng, tỷ giá, hàng hóa thông thường
  const isCommodityOrFxTicker =
    (/giá vàng|vàng sjc|vàng nhẫn|tỷ giá usd|giá usd|giá xăng dầu|giá dầu/i.test(fullText) &&
     /hôm nay|kết tuần|đầu tuần|tăng nhẹ|giảm nhẹ|neo mốc|quay đầu/i.test(fullText));

  // 8. Kiểm tra dạng 4: Tin số liệu tiến độ giải ngân đầu tư công / thu chi ngân sách thường quy
  // Ví dụ: "Giải ngân đầu tư công đạt hơn 644.000 tỷ đồng", "Ước giải ngân vốn đầu tư công 9 tháng đạt..."
  const isRoutineDisbursementOrBudgetStat =
    (/giải ngân đầu tư công|giải ngân vốn đầu tư công|vốn đầu tư công|tiến độ giải ngân|thu ngân sách nhà nước|tổng thu ngân sách/i.test(fullText) &&
     (/đạt hơn \d+|đạt \d+|vượt \d+|ước đạt|kết quả \d+ tháng|9 tháng đạt|8 tháng đạt|tích cực|triển khai đồng bộ|đúng tiến độ|hoàn thành kế hoạch/i.test(fullText) ||
      fullText.includes('đạt hơn 644.000 tỷ') || fullText.includes('đạt hơn 644.000 tỷ đồng'))) ||
    /giải ngân đầu tư công đạt hơn 644\.000 tỷ|giải ngân đầu tư công đạt hơn|giải ngân vốn đầu tư công đạt/i.test(fullText);

  if (isStockIndexRoundup) {
    return {
      isRoundup: true,
      reason: 'Điểm báo diễn biến chỉ số thị trường chứng khoán thường nhật (VN-Index, HNX)'
    };
  }

  if (isCorporateStockMovement) {
    return {
      isRoundup: true,
      reason: 'Điểm báo biến động giá/thị giá cổ phiếu doanh nghiệp thường quy (PNJ, nhóm ngành)'
    };
  }

  if (isCommodityOrFxTicker) {
    return {
      isRoundup: true,
      reason: 'Điểm báo giá vàng, tỷ giá, hàng hóa thường quy'
    };
  }

  if (isRoutineDisbursementOrBudgetStat) {
    return {
      isRoundup: true,
      reason: 'Báo cáo số liệu tiến độ giải ngân / ngân sách định kỳ đạt chuẩn'
    };
  }

  return { isRoundup: false };
}

/**
 * Phân loại cảnh báo khẩn cấp chuẩn xác theo chỉ đạo của Lãnh đạo Bộ Tài chính:
 * - KHÔNG đưa công bố Luật / Lệnh Chủ tịch nước / điều hành thể chế thường quy vào diện khẩn cấp.
 * - KHÔNG đưa biến động thị trường khách quan (VN-Index rung lắc, giá vàng, tỷ giá, chu kỳ mua bán) vào diện khẩn cấp.
 * - KHÔNG đưa các vụ án / sai phạm đấu thầu ĐÃ XẢY RA / ĐANG TỐ TỤNG (như đề nghị truy tố cây xanh Công Minh, xét xử đại án) vào diện cảnh báo đỏ khẩn cấp -> CHỈ ĐIỂM TIN GIÁM SÁT (POST_INCIDENT_MONITORING).
 * - KHÔNG đưa các đề xuất bổ sung thẩm quyền, chức năng nhiệm vụ, sửa đổi luật của Bộ (như đề xuất thẩm quyền khởi tố vụ án thuế, sở hữu trí tuệ) vào diện khẩn cấp -> CHỈ ĐIỂM TIN THỂ CHẾ & ĐIỀU HÀNH THƯỜNG QUY.
 * - CHỈ cảnh báo khẩn cấp khi phát hiện:
 *   1. Chỉ trích, lên án Bộ & đơn vị trực thuộc (CRITIQUE)
 *   2. Kêu ca, bức xúc về thủ tục hành chính, chính sách bất cập, chậm hoàn thuế (PROCEDURE_COMPLAINT)
 *   3. Kiến nghị, đề xuất, kêu cứu khó khăn của DN, hiệp hội, nhà đầu tư gửi Bộ (PETITION_DIFFICULTY)
 *   4. Sự cố nghiêm trọng ĐANG PHÁT SINH ảnh hưởng vai trò, trách nhiệm của Bộ (ACCOUNTABILITY_IMPACT)
 */
export function classifyMinistryAlert(art: ScrapedNewsItem): MinistryAlertAssessment {
  if (!art) {
    return {
      isUrgent: false,
      category: 'MARKET_OBJECTIVE',
      categoryLabelVi: 'Không có dữ liệu',
      urgencyReason: 'Không có dữ liệu bài viết',
      isObjectiveMarket: false,
      isPostIncident: false,
      matchedTerms: [],
    };
  }

  const title = (art.title || '').toLowerCase();
  const summary = (art.summary || art.snippet || '').toLowerCase();
  const fullText = `${title} ${summary}`;

  // =========================================================================
  // ĐỐI SOÁT CHUẨN XÁC NGHỊ ĐỊNH 376/2026/NĐ-CP (CẨM NANG 100 TÌNH HUỐNG THỰC CHIẾN)
  // =========================================================================
  const d376 = Decree376ClassificationEngine.classify(art);
  if (d376.matchedScenario) {
    if (d376.isExcluded || d376.tier === 0) {
      return {
        isUrgent: false,
        category: 'MARKET_OBJECTIVE',
        categoryLabelVi: `📋 Cấp 0: Chuẩn hóa Theo Nghị định 376 — [${d376.scenarioCode}] Không cảnh báo`,
        urgencyReason: d376.classificationReason,
        isObjectiveMarket: true,
        isPostIncident: false,
        matchedTerms: [d376.scenarioCode || 'decree_376_tier_0'],
      };
    }
    if (d376.tier === 3) {
      return {
        isUrgent: true,
        category: 'CRITIQUE',
        categoryLabelVi: `🚨 Cấp 3: Cảnh Báo Gấp (SOP Cấp 4) — [${d376.scenarioCode}] ${d376.matchedScenario?.title}`,
        urgencyReason: `[Nghị định 376 - ${d376.decree376Clause}] Đơn vị chủ trì: ${d376.leadAgency.name}. ${d376.actionScriptVi}. Khung giờ vàng: ${d376.emergencyPlaybook?.goldenHourTiming || '2–4 giờ'}.`,
        isObjectiveMarket: false,
        isPostIncident: false,
        matchedTerms: [d376.scenarioCode || 'decree_376_tier_3'],
      };
    }
    if (d376.tier === 2) {
      return {
        isUrgent: false,
        category: 'PROCEDURE_COMPLAINT',
        categoryLabelVi: `⚡ Cấp 2: Cảnh Báo Sớm/Nhanh — [${d376.scenarioCode}]`,
        urgencyReason: `[Nghị định 376 - ${d376.decree376Clause}] Đơn vị chủ trì: ${d376.leadAgency.name}. ${d376.actionScriptVi}.`,
        isObjectiveMarket: false,
        isPostIncident: false,
        matchedTerms: [d376.scenarioCode || 'decree_376_tier_2'],
      };
    }
    return {
      isUrgent: false,
      category: 'PROCEDURE_COMPLAINT',
      categoryLabelVi: `🔭 Cấp 1: Cần Lưu Tâm — [${d376.scenarioCode}]`,
      urgencyReason: `[Nghị định 376 - ${d376.decree376Clause}] Đơn vị chủ trì: ${d376.leadAgency.name}. ${d376.actionScriptVi}.`,
      isObjectiveMarket: false,
      isPostIncident: false,
      matchedTerms: [d376.scenarioCode || 'decree_376_tier_1'],
    };
  }

  // Kiểm tra nhanh xem bài viết có chứa từ chỉ trích Bộ đích danh không
  // Ngăn chặn các từ phủ định hoặc phát biểu chỉ đạo của Lãnh đạo (như "Không buông lỏng trách nhiệm", "Bộ trưởng chỉ đạo...") bị hiểu nhầm thành chỉ trích
  const isNegatedCritiqueOrDirective = 
    /không buông lỏng|không được buông lỏng|kiên quyết không buông lỏng|không để xảy ra buông lỏng|bộ trưởng.*chỉ đạo|chỉ đạo.*không buông lỏng|bộ trưởng.*không buông lỏng|nêu cao trách nhiệm|đôn đốc giải ngân/i.test(fullText);

  const hasDirectCritique = !isNegatedCritiqueOrDirective && MINISTRY_CRITIQUE_KEYWORDS.some(kw => fullText.includes(kw));

  // =========================================================================
  // TIỀN KIỂM 0A: WHITELIST HẠ TẦNG TÀI CHÍNH & HOẠT ĐỘNG DOANH NGHIỆP PHI CHÍNH TRỊ
  // Nhận diện hoạt động trả cổ tức, tăng vốn điều lệ, ĐHĐCĐ, nghiên cứu vĩ mô thường quy.
  // Tuyệt đối KHÔNG kích hoạt cảnh báo đỏ hay xếp vào diện khẩn cấp.
  // =========================================================================
  if (isFinancialInfrastructureOrBusinessUpdate(fullText) && !hasDirectCritique) {
    return {
      isUrgent: false,
      category: 'MARKET_OBJECTIVE',
      categoryLabelVi: '🏢 Cập nhật Doanh nghiệp & Hạ tầng Tài chính (Whitelist)',
      urgencyReason: 'Thông tin hoạt động doanh nghiệp, ngân hàng thương mại thường quy (cổ tức, tăng vốn, ĐHĐCĐ) hoặc nghiên cứu kinh tế vĩ mô. Thuộc danh mục Whitelist, miễn trừ khỏi diện cảnh báo rủi ro khẩn cấp.',
      isObjectiveMarket: true,
      isPostIncident: false,
      matchedTerms: ['whitelist_corporate_update'],
    };
  }

  // =========================================================================
  // TIỀN KIỂM 0: BAN HÀNH PHÁP LUẬT, LỆNH CHỦ TỊCH NƯỚC & ĐIỀU HÀNH THỂ CHẾ THƯỜNG QUY
  // =========================================================================
  if (isRoutineLegalPromulgationOrGovernance(fullText) && !hasDirectCritique) {
    return {
      isUrgent: false,
      category: 'MARKET_OBJECTIVE',
      categoryLabelVi: '🏛️ Ban hành Pháp luật & Điều hành Thể chế Thường quy',
      urgencyReason: 'Thông tin công bố Lệnh của Chủ tịch nước, ban hành văn bản Luật hoặc điều hành thể chế thường quy của Nhà nước. Không thuộc diện cảnh báo rủi ro khẩn cấp.',
      isObjectiveMarket: false,
      isPostIncident: false,
      matchedTerms: ['ban hành pháp luật thường quy'],
    };
  }

  // =========================================================================
  // TIỀN KIỂM ĐẶC BIỆT: HOẠT ĐỘNG HOÀN THIỆN THỂ CHẾ & ĐỀ XUẤT THẨM QUYỀN CỦA BỘ
  // Bộ Tài chính đề xuất bổ sung thẩm quyền (khởi tố một số vụ án thuế, sở hữu trí tuệ,
  // điều tra chuyên ngành...), đề xuất sửa luật, bổ sung chức năng nhiệm vụ...
  // -> ĐÂY LÀ CHỨC NĂNG, HOẠT ĐỘNG THƯỜNG QUY VỀ HOÀN THIỆN THỂ CHẾ CỦA BỘ,
  // TUYỆT ĐỐI KHÔNG PHẢI CẢNH BÁO KHẨN CẤP HAY RỦI RO PHÁP LÝ.
  // =========================================================================
  if (isMinistryAuthorityProposal(fullText) && !hasDirectCritique) {
    return {
      isUrgent: false,
      category: 'MARKET_OBJECTIVE',
      categoryLabelVi: '🏛️ Hoạt động Thường quy & Đề xuất Thể chế Bộ Tài chính',
      urgencyReason: 'Thông tin Bộ Tài chính đề xuất bổ sung chức năng, thẩm quyền (như khởi tố một số vụ án thuế, quyền sở hữu trí tuệ) nhằm hoàn thiện thể chế quản lý nhà nước. Đây là hoạt động thường quy của Bộ, không thuộc diện cảnh báo khẩn cấp.',
      isObjectiveMarket: false,
      isPostIncident: false,
      matchedTerms: ['đề xuất bổ sung thẩm quyền'],
    };
  }

  // =========================================================================
  // TIỀN KIỂM 1: ĐIỂM TIN GIÁM SÁT TỐ TỤNG / VỤ VIỆC ĐÃ XỬ LÝ (POST_INCIDENT_MONITORING)
  // Ưu tiên cao nhất: Nếu bài viết về vụ án cũ đã kết luận điều tra, đề nghị truy tố, xét xử, gói thầu cũ
  // -> Tuyệt đối KHÔNG kích hoạt cảnh báo đỏ, xếp vào Điểm tin Giám sát
  // =========================================================================
  const matchedPostIncident = POST_INCIDENT_LEGAL_KEYWORDS.filter(kw => fullText.includes(kw));
  if (matchedPostIncident.length > 0) {
    return {
      isUrgent: false,
      category: 'POST_INCIDENT_MONITORING',
      categoryLabelVi: '⚖️ Điểm tin Giám sát Tố tụng & Vụ việc Đã Xử Lý',
      urgencyReason: `Vụ việc sai phạm pháp lý/đấu thầu đã được Cơ quan Điều tra thụ lý và đang trong quy trình tố tụng (${matchedPostIncident.slice(0, 2).join(', ')}). Không phải sự cố khẩn cấp mới phát sinh, hệ thống chuyển sang chế độ Điểm tin Giám sát Thường quy & Tham mưu thể chế.`,
      isObjectiveMarket: false,
      isPostIncident: true,
      matchedTerms: matchedPostIncident,
    };
  }

  // =========================================================================
  // TIỀN KIỂM 2: BIẾN ĐỘNG THỊ TRƯỜNG THUẦN TÚY & KHÁCH QUAN (MARKET_OBJECTIVE)
  // Biến động điểm số VN-Index, giao dịch cổ phiếu riêng lẻ ("họ" Vin, ngân hàng, thép),
  // giá vàng, tỷ giá, chu kỳ mua bán thuần túy không chứa từ chỉ trích Bộ
  // -> Loại trừ ngay khỏi diện khẩn cấp / cảnh báo để phục vụ công tác điều hành của Lãnh đạo
  // =========================================================================
  const matchedMarket = OBJECTIVE_MARKET_KEYWORDS.filter(kw => fullText.includes(kw));
  const isPureMarket = isPureMarketDynamics(fullText);
  const isMarketMovement = isPureMarket || matchedMarket.length > 0 ||
    /vn-index|vnindex|hnx|upcom|giá vàng|vàng sjc|tỷ giá|bán ròng|chốt lời|rung lắc|thanh khoản/i.test(title);

  if (isMarketMovement && !hasDirectCritique) {
    return {
      isUrgent: false,
      category: 'MARKET_OBJECTIVE',
      categoryLabelVi: '📊 Điểm tin Thị trường Thuần túy (Không cảnh báo)',
      urgencyReason: isPureMarket
        ? 'Diễn biến giao dịch chứng khoán/thị trường thuần túy (VN-Index, cổ phiếu), không thuộc diện rủi ro chính sách của Bộ Tài chính.'
        : 'Diễn biến cung cầu, điểm số giao dịch và giá cả tài sản mang tính thị trường khách quan. Không liên quan đến chỉ trích hay trách nhiệm trực tiếp của Bộ Tài chính, không xếp vào diện cảnh báo khẩn.',
      isObjectiveMarket: true,
      isPostIncident: false,
      matchedTerms: matchedMarket.length > 0 ? matchedMarket : ['diễn biến thị trường thuần túy'],
    };
  }

  // =========================================================================
  // TIỀN KIỂM 3: NỖ LỰC CHỈ ĐẠO, THÁO GỠ KHÓ KHĂN & THÀNH TỰU CỦA BỘ
  // Nếu bài viết phản ánh việc Bộ Tài chính/Cục/Tổng cục chủ động tháo gỡ vướng mắc,
  // ban hành hướng dẫn, đối thoại thành công, tăng thu ngân sách, cải cách thủ tục,
  // hoặc có sắc thái tích cực (bullish) và không chứa từ chỉ trích, tố cáo gay gắt
  // -> ĐÂY LÀ TIN ĐIỀU HÀNH TÍCH CỰC, KHÔNG PHẢI CẢNH BÁO KHẨN
  // =========================================================================
  const isMinistryProactiveAction = 
    isRoutineLegalPromulgationOrGovernance(fullText) ||
    /(bộ tài chính|bộ trưởng|thứ trưởng|lãnh đạo bộ) (chỉ đạo|tháo gỡ|đề xuất tăng|hướng dẫn|gỡ vướng|ban hành|đối thoại|hỗ trợ|khen ngợi|yêu cầu|nhấn mạnh|quán triệt|đôn đốc|không buông lỏng)/i.test(fullText) ||
    /ngành thuế (chỉ đạo|tháo gỡ|gỡ vướng|đẩy mạnh hoàn thuế|hướng dẫn)|hải quan (tạo thuận lợi|thông quan nhanh|tháo gỡ)|kho bạc (đẩy nhanh|giải ngân)|thu ngân sách (vượt|đạt|tăng trưởng)/i.test(fullText) ||
    /không buông lỏng trách nhiệm trong giải ngân vốn đầu tư công|đôn đốc giải ngân vốn đầu tư công|siết chặt kỷ luật, kỷ cương trong giải ngân/i.test(fullText);

  if (isMinistryProactiveAction && !hasDirectCritique) {
    return {
      isUrgent: false,
      category: 'MARKET_OBJECTIVE',
      categoryLabelVi: 'Chỉ đạo điều hành & Tháo gỡ khó khăn của Bộ',
      urgencyReason: 'Thông tin phản ánh nỗ lực chỉ đạo, hướng dẫn tháo gỡ vướng mắc hoặc kết quả tích cực của Bộ Tài chính và các đơn vị trực thuộc. Thuộc diện Điểm tin Điều hành thường nhật.',
      isObjectiveMarket: false,
      isPostIncident: false,
      matchedTerms: [],
    };
  }

  // =========================================================================
  // KIỂM TRA 4 NHÓM TIÊU CHÍ CẢNH BÁO KHẨN CẤP CHUẨN XÁC
  // =========================================================================

  // 1. Nhóm 1: Chỉ trích, lên án Bộ & đơn vị trực thuộc (CẢNH BÁO KHẨN)
  const matchedCritique = !isNegatedCritiqueOrDirective 
    ? MINISTRY_CRITIQUE_KEYWORDS.filter(kw => fullText.includes(kw))
    : [];

  if (matchedCritique.length > 0) {
    return {
      isUrgent: true,
      category: 'CRITIQUE',
      categoryLabelVi: '⚠️ Chỉ trích & Phản ánh Bộ/Ngành',
      urgencyReason: `Dư luận, báo chí phản ánh, chỉ trích gay gắt hoặc quy trách nhiệm đối với Bộ Tài chính/đơn vị trực thuộc (${matchedCritique.slice(0, 2).join(', ')}). Cần báo cáo Lãnh đạo khẩn trương để có phương án thông tin, giải trình.`,
      isObjectiveMarket: false,
      isPostIncident: false,
      matchedTerms: matchedCritique,
    };
  }

  // 2. Nhóm 2: Kêu ca, bức xúc về thủ tục hành chính, chính sách bất cập của Bộ (CẢNH BÁO KHẨN)
  // Yêu cầu: Không phải tin tích cực (bullish)
  const matchedProcedure = POLICY_PROCEDURE_COMPLAINT_KEYWORDS.filter(kw => fullText.includes(kw));
  if (matchedProcedure.length > 0 && art.sentiment !== 'bullish') {
    return {
      isUrgent: true,
      category: 'PROCEDURE_COMPLAINT',
      categoryLabelVi: '📋 Bức xúc thủ tục, chính sách & hoàn thuế',
      urgencyReason: `Phản ánh bức xúc về thủ tục hành chính rườm rà, nghẽn thông quan, chậm hoàn thuế VAT hoặc bất cập chính sách thuế (${matchedProcedure.slice(0, 2).join(', ')}). Cần báo cáo Lãnh đạo chỉ đạo tháo gỡ điểm nghẽn.`,
      isObjectiveMarket: false,
      isPostIncident: false,
      matchedTerms: matchedProcedure,
    };
  }

  // 3. Nhóm 3: Kiến nghị, đề xuất với Bộ những khó khăn của Doanh nghiệp & Nhà đầu tư (CẢNH BÁO KHẨN)
  const matchedPetition = BUSINESS_INVESTOR_PETITION_KEYWORDS.filter(kw => fullText.includes(kw));
  if (matchedPetition.length > 0 && art.sentiment !== 'bullish') {
    return {
      isUrgent: true,
      category: 'PETITION_DIFFICULTY',
      categoryLabelVi: '📢 Kiến nghị & Kêu cứu DN/Nhà đầu tư gửi Bộ',
      urgencyReason: `Cộng đồng doanh nghiệp, hiệp hội hoặc nhà đầu tư gửi kiến nghị, kêu cứu khó khăn về dòng tiền, cơ chế phát hành, nộp thuế (${matchedPetition.slice(0, 2).join(', ')}). Cần tham mưu giải pháp đối thoại, tháo gỡ kịp thời.`,
      isObjectiveMarket: false,
      isPostIncident: false,
      matchedTerms: matchedPetition,
    };
  }

  // 4. Nhóm 4: Vụ việc nghiêm trọng ĐANG PHÁT SINH ảnh hưởng vai trò, trách nhiệm của Bộ (CẢNH BÁO KHẨN)
  const matchedAccountability = MINISTRY_ACCOUNTABILITY_KEYWORDS.filter(kw => {
    if (!fullText.includes(kw)) return false;
    if (kw.includes('buông lỏng') && isNegatedCritiqueOrDirective) return false;
    if (kw.includes('trách nhiệm') && (/nêu cao trách nhiệm|gắn trách nhiệm|quán triệt trách nhiệm|bộ trưởng|giải ngân/i.test(fullText))) return false;
    return true;
  });

  if (matchedAccountability.length > 0) {
    return {
      isUrgent: true,
      category: 'ACCOUNTABILITY_IMPACT',
      categoryLabelVi: '🛡️ Vụ việc ảnh hưởng vai trò & trách nhiệm Bộ',
      urgencyReason: `Sự cố nghiêm trọng mới phát sinh (khởi tố cán bộ, gian lận hóa đơn khống quy mô lớn, thao túng tài chính) ảnh hưởng trực tiếp đến vai trò, uy tín quản lý của Bộ Tài chính (${matchedAccountability.slice(0, 2).join(', ')}). Cần kích hoạt phương án tham mưu xử lý.`,
      isObjectiveMarket: false,
      isPostIncident: false,
      matchedTerms: matchedAccountability,
    };
  }

  // 5. Bài viết theo dõi thường nhật
  return {
    isUrgent: false,
    category: 'MARKET_OBJECTIVE',
    categoryLabelVi: 'Thông tin thường nhật',
    urgencyReason: 'Thông tin theo dõi bình thường, không thuộc 4 nhóm vấn đề cấp thiết của Bộ Tài chính.',
    isObjectiveMarket: false,
    isPostIncident: false,
    matchedTerms: [],
  };
}

export function isMinistryUrgentAlert(art: ScrapedNewsItem): boolean {
  if (!art) return false;
  return classifyMinistryAlert(art).isUrgent;
}

/**
 * Cấu trúc phân tích trọng số chi tiết của bài viết
 */
export interface RiskScoreBreakdown {
  score: number; // Điểm rủi ro tổng hợp chuẩn hóa (0 - 100)
  isRisk: boolean; // Có vượt ngưỡng cảnh báo rủi ro (>= 50)
  severity: 'ACUTE' | 'MODERATE' | 'NONE'; // Phân cấp rủi ro
  confidenceScore: number; // Điểm tin cậy rủi ro dựa trên giao thoa MoF & Sắc thái tiêu cực (0 - 100%)
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW'; // Phân cấp độ tin cậy
  isHighConfidenceRisk: boolean; // Cờ rủi ro độ tin cậy cao (isRisk && confidenceScore >= 70)
  mofRelevanceScore: number; // Điểm số liên quan thực chất đến lĩnh vực Bộ Tài chính (0 - 100)
  sentimentStressScore: number; // Điểm số mức độ căng thẳng sắc thái tiêu cực (0 - 100)
  ministryAlertAssessment?: MinistryAlertAssessment;
  weights: {
    negativeSentimentWeight: number; // Trọng số sắc thái tiêu cực
    urgentImpactWeight: number; // Trọng số cấp độ tác động khẩn cấp ('urgent' / 'emergency')
    acuteThreatKeywordWeight: number; // Trọng số sự cố pháp lý & vỡ nợ nghiêm trọng
    marketStressKeywordWeight: number; // Trọng số áp lực thị trường vừa
    mofPolicyDampenerWeight: number; // Hệ số giảm trừ chính sách & phòng ngừa MoF
    mediaStrategyWeight: number; // Trọng số định hướng chiến lược truyền thông
    clarificationDampenerWeight: number; // Trọng số đính chính / bác bỏ tin đồn
    marketObjectiveDampenerWeight?: number; // Giảm trừ biến động thị trường khách quan
    postIncidentDampenerWeight?: number; // Giảm trừ vụ việc đã xảy ra / tố tụng đã ngã ngũ
    ministryTargetedUrgentWeight?: number; // Trọng số vấn đề nhắm vào Bộ
    corporateActionDampenerWeight?: number; // Giảm trừ hoạt động doanh nghiệp thường quy (cổ tức, tăng vốn)
    ignoreListDampenerWeight?: number; // Giảm trừ theo Ignore-list tùy biến từ AlertTriggerModal
    routineEnforcementDampenerWeight?: number; // Giảm trừ nghiệp vụ cưỡng chế pháp luật định kỳ, xã hội đồng thuận
    latentPolicyWeight?: number; // Trọng số mầm mống rủi ro chính sách diện rộng trong tin trung tính
    latentTechWeight?: number; // Trọng số rủi ro thể chế tiềm ẩn trong tin đổi mới công nghệ
    narrativeDivergenceWeight?: number; // Trọng số độ vênh giữa chỉ đạo và số liệu thực tế
  };
  matchedFactors: {
    acuteThreats: string[];
    marketStress: string[];
    mofPolicyKeywords: string[];
    mofSpecificKeywords: string[];
    isUrgentLevel: boolean;
    isNegativeSentiment: boolean;
    isObjectiveMarket?: boolean;
    isPostIncident?: boolean;
    isRoutineEnforcement?: boolean;
    isLatentPolicyCrisis?: boolean;
    isLatentTechRisk?: boolean;
    isDivergenceDetected?: boolean;
  };
  formulaMetrics?: {
    S: number;
    D: number;
    V: number;
    I: number;
    rawRiskScore: number;
    alertLevel: 'EMERGENCY' | 'RAPID' | 'EARLY' | 'DISTANT' | 'STANDARD';
  };
  reasons: string[];
}

/**
 * 1. Nhận diện Nghiệp vụ Cưỡng chế Pháp luật Định kỳ / Sự vụ Cá lẻ / Xã hội Đồng thuận
 * Khắc phục LỖI 1: Báo động giả tràn lan trên các tin tiêu cực mang tính sự vụ cá lẻ
 * (như xử phạt hành chính một cá nhân trốn thuế, tạm giữ một lô hàng buôn lậu).
 * Đánh giá rủi ro thấp (NONE/LOW), vì đây là nghiệp vụ cưỡng chế pháp luật định kỳ, xã hội đồng thuận.
 */
export function isRoutineEnforcementOrSocialConsensus(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();

  // TUYỆT ĐỐI KHÔNG ÁP DỤNG nếu có yếu tố đại án, tội phạm chức vụ, hối lộ cán bộ, sai phạm hệ thống
  const hasSystemicCorruptionOrCrime =
    /khởi tố cán bộ|bắt tạm giam cán bộ|nhận hối lộ|đưa hối lộ|môi giới hối lộ|thao túng giá chứng khoán|đại án|vụ án xuyên việt oil|đặng công khôi|quỹ bog|thất thoát nghìn tỷ|bảo kê|bao che cho sai phạm|chiếm đoạt tài sản nhà nước/i.test(lower);
  if (hasSystemicCorruptionOrCrime) return false;

  // Xử phạt hành chính trốn thuế cá nhân / hộ kinh doanh cá lẻ:
  const isIndividualTaxPenalty =
    /(xử phạt|phạt|truy thu|cưỡng chế).*?(cá nhân|người nộp thuế cá nhân|hộ cá thể|cửa hàng).*?(trốn thuế|chậm nộp|không xuất hóa đơn bán lẻ|kê khai sai)/i.test(lower) ||
    /xử phạt hành chính (một )?cá nhân (về hành vi )?trốn thuế/i.test(lower) ||
    /xử phạt (cá nhân|người nộp thuế).*?trốn thuế/i.test(lower) ||
    /truy thu thuế.*?cá nhân bán hàng online/i.test(lower) ||
    /cưỡng chế.*?thu nợ thuế.*?cá nhân/i.test(lower);

  // Tạm giữ / Bắt giữ hàng buôn lậu, hàng giả, hàng cấm nhỏ lẻ (pháo nổ, thuốc lá, mỹ phẩm, thực phẩm đông lạnh...):
  const isRoutineContrabandSeizure =
    /(tạm giữ|bắt giữ|thu giữ|tịch thu|phát hiện|triệt phá).*?(lô hàng|vụ).*?(buôn lậu|hàng lậu|nhập lậu|vận chuyển trái phép).*?(pháo|pháo nổ|thuốc lá|mỹ phẩm|đường cát|quần áo|rượu|thực phẩm đông lạnh|gia cầm)/i.test(lower) ||
    /tạm giữ (một )?lô hàng buôn lậu/i.test(lower) ||
    /tạm giữ.*?(lô hàng|hàng lậu|hàng không rõ nguồn gốc|hàng nhập lậu)/i.test(lower) ||
    /bắt giữ.*?(vụ|lô).*?buôn lậu.*?(qua biên giới|tiểu ngạch|hàng cấm|pháo nổ)/i.test(lower) ||
    /tịch thu.*?hàng hóa nhập lậu/i.test(lower);

  // Vi phạm hóa đơn nhỏ lẻ / không niêm yết giá:
  const isMinorViolation =
    /xử phạt.*?vi phạm.*?hóa đơn nhỏ lẻ/i.test(lower) ||
    /xử phạt.*?không niêm yết giá/i.test(lower) ||
    /xử lý vi phạm hành chính.*?hàng giả.*?nhỏ lẻ/i.test(lower);

  return Boolean(isIndividualTaxPenalty || isRoutineContrabandSeizure || isMinorViolation);
}

/**
 * 2. Nhận diện Mầm mống Rủi ro Chính sách Diện rộng trong Tin Trung tính (Neutral)
 * Khắc phục LỖI 2A: Bỏ lọt mầm mống khủng hoảng khi ngôn từ mang tính trung tính
 * Ví dụ: Sửa đổi 5 thủ tục thuế hộ kinh doanh + băn khoăn cách tính doanh thu nhiều địa điểm
 * Sắc thái bề mặt: Trung tính. Rủi ro thể chế: S=25, D=0, V=0.3, I=1.0 -> Risk_Score = 42.5đ (EARLY WARNING)
 */
export function isLatentPolicyCrisis(text: string, art?: ScrapedNewsItem): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();

  // Nhóm 1: Chạm tới nghĩa vụ của hàng triệu người nộp thuế / hộ kinh doanh
  const touchesMassTaxpayers =
    /hộ kinh doanh|cá nhân kinh doanh|hộ cá thể|thuế tncn|thuế thu nhập cá nhân|hóa đơn điện tử máy tính tiền|5 triệu hộ|hàng triệu người nộp thuế/i.test(lower) ||
    (art && (art.sector === 'tax' || art.sectorNameVi?.includes('Thuế')));

  // Nhóm 2: Dấu hiệu chính sách phức tạp, sửa đổi nhiều lần, phát sinh lúng túng / câu hỏi lặp lại
  const hasPolicyComplexityOrConfusion =
    /liên tục sửa đổi|sửa đổi 5 thủ tục|5 thủ tục thuế|sửa đổi nhiều lần|câu hỏi lặp đi lặp lại|người dân băn khoăn|người nộp thuế băn khoăn|cơ sở đang lúng túng|lúng túng khi thực hiện|nhiều địa điểm kinh doanh|xác định doanh thu tính thuế/i.test(lower) ||
    (/sửa đổi.*?thủ tục/i.test(lower) && /băn khoăn|lúng túng|vướng mắc/i.test(lower));

  return Boolean(touchesMassTaxpayers && hasPolicyComplexityOrConfusion);
}

/**
 * 3. Nhận diện Rủi ro Thể chế Tiềm ẩn trong Tin Tích cực / Học thuật / Thí điểm Công nghệ Mới
 * Khắc phục LỖI 2B: Mất cảnh giác trước tin tức tích cực / đổi mới sáng tạo
 * Ví dụ: Thí điểm ứng dụng thuật toán AI trong giao dịch chứng khoán tự động
 * Sắc thái bề mặt: Tích cực (Positive). Rủi ro thể chế: S=20, D=0, V=0.2, I=0.6 -> Risk_Score = 26.6đ (EARLY HORIZON)
 */
export function isLatentRiskInPositiveTech(text: string, _art?: ScrapedNewsItem): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();

  const isEmergingTechOrPilot =
    /thí điểm.*?ứng dụng.*?ai|thuật toán ai|giao dịch.*?tự động|thí điểm ai|ai trong đầu tư|sandbox|fintech|tài sản số|tài sản mã hóa|crypto/i.test(lower) ||
    (/thí điểm/i.test(lower) && /thuật toán|ai|giao dịch chứng khoán/i.test(lower));

  const hasLatentConcerns =
    /bất bình đẳng|thao túng|sập hệ thống|khoảng trống pháp lý|trách nhiệm bồi thường|thua lỗ|nhà đầu tư nhỏ lẻ|bảo vệ nhà đầu tư/i.test(lower) ||
    isEmergingTechOrPilot;

  return Boolean(isEmergingTechOrPilot && hasLatentConcerns);
}

/**
 * 4. Nhận diện Hiện tượng Độ Vênh Giữa Thông Điệp Chỉ Đạo Và Diễn Biến Thực Tế (Narrative-Reality Divergence)
 * Sắc thái ban đầu càng tích cực (quyết tâm cao độ) thì khi số liệu thực tế không theo kịp,
 * áp lực quy kết trách nhiệm đối với Bộ càng lớn!
 * Ví dụ: Lãnh đạo chỉ đạo quyết liệt giải ngân vs Thực tế giải ngân 8 tháng thấp kỷ lục, dưới 30%
 * Rủi ro thể chế: S=35, D=18, V=0.8, I=0.9 -> Risk_Score = 69.8đ (RAPID ALERT)
 */
export function detectNarrativeRealityDivergence(text: string, _art?: ScrapedNewsItem): {
  detected: boolean;
  details: string | null;
  divergenceScore: number;
} {
  if (!text) return { detected: false, details: null, divergenceScore: 0 };
  const lower = text.toLowerCase();

  const hasCommitmentDirective =
    /chỉ đạo quyết liệt|quyết tâm cao độ|bộ trưởng.*chỉ đạo|không buông lỏng|đôn đốc giải ngân|yêu cầu tăng tốc|thúc đẩy giải ngân|chỉ đạo nóng/i.test(lower) ||
    (lower.includes('chỉ đạo') && lower.includes('quyết liệt')) ||
    lower.includes('tuần trước');

  const hasRealityLag =
    /thấp kỷ lục|chậm kỷ lục|dưới 30%|giải ngân dưới|địa phương kêu khó|ách tắc|ì ạch|vướng mắc thủ tục|chậm hoàn thuế|chưa đạt kỳ vọng/i.test(lower) ||
    (lower.includes('giải ngân') && (lower.includes('thấp') || lower.includes('chậm') || lower.includes('kêu khó')));

  if ((hasCommitmentDirective && hasRealityLag) || (lower.includes('thấp kỷ lục') && lower.includes('giải ngân'))) {
    return {
      detected: true,
      details: 'Phát hiện độ vênh lớn giữa cam kết chỉ đạo quyết tâm của Lãnh đạo và kết quả số liệu thực tế thấp kỷ lục (Narrative-Reality Divergence: D=18, S=35). Nguy cơ bị quy kết trách nhiệm làm chậm tiến độ chung.',
      divergenceScore: 18
    };
  }

  if (hasCommitmentDirective && /kêu cứu|kêu trời|chậm trễ/i.test(lower)) {
    return {
      detected: true,
      details: 'Phát hiện mâu thuẫn giữa thông điệp điều hành vĩ mô và phản ánh khó khăn, ách tắc thực tế từ cơ sở.',
      divergenceScore: 14
    };
  }

  return { detected: false, details: null, divergenceScore: 0 };
}

/**
 * Tính toán điểm số rủi ro dựa trên hệ thống trọng số đa nhân tố
 * (Weight-based Scoring System)
 */
export function calculateRiskScore(art: ScrapedNewsItem, customIgnoreRules?: AlertIgnoreRule[]): RiskScoreBreakdown {
  if (!art) {
    return {
      score: 0,
      isRisk: false,
      severity: 'NONE',
      confidenceScore: 0,
      confidenceLevel: 'LOW',
      isHighConfidenceRisk: false,
      mofRelevanceScore: 0,
      sentimentStressScore: 0,
      weights: {
        negativeSentimentWeight: 0,
        urgentImpactWeight: 0,
        acuteThreatKeywordWeight: 0,
        marketStressKeywordWeight: 0,
        mofPolicyDampenerWeight: 0,
        mediaStrategyWeight: 0,
        clarificationDampenerWeight: 0,
        corporateActionDampenerWeight: 0,
        ignoreListDampenerWeight: 0
      },
      matchedFactors: {
        acuteThreats: [],
        marketStress: [],
        mofPolicyKeywords: [],
        mofSpecificKeywords: [],
        isUrgentLevel: false,
        isNegativeSentiment: false
      },
      reasons: ['Không có dữ liệu bài viết']
    };
  }

  const title = (art.title || '').toLowerCase();
  const summary = (art.summary || art.snippet || '').toLowerCase();
  const fullText = `${title} ${summary}`;
  const reasons: string[] = [];

  // =========================================================================
  // 0. LOẠI TRỪ TUYỆT ĐỐI CÁC THÔNG BÁO THỂ CHẾ, CÔNG BỐ LỆNH, LUẬT SỬA ĐỔI, NGÂN HÀNG NHÀ NƯỚC, HẠ TẦNG TÀI CHÍNH & HOẠT ĐỘNG DOANH NGHIỆP THƯỜNG QUY
  // =========================================================================
  const isFinancialWhitelist = isFinancialInfrastructureOrBusinessUpdate(fullText);

  // Kiểm tra danh mục Ignore-list tùy biến được quản lý trong AlertTriggerModal
  const ignoreResult = checkPersistentIgnoreList(art, customIgnoreRules);
  const hasAcuteCriminalIncident = 
    /khởi tố bị can|khởi tố cán bộ|bắt tạm giam cán bộ|cán bộ nhận hối lộ|đại án tham nhũng|vụ án xuyên việt oil|bị can đặng công khôi/i.test(fullText);

  if (ignoreResult.isIgnored && !hasAcuteCriminalIncident) {
    return {
      score: 0,
      isRisk: false,
      severity: 'NONE',
      confidenceScore: 0,
      confidenceLevel: 'LOW',
      isHighConfidenceRisk: false,
      mofRelevanceScore: 0,
      sentimentStressScore: 0,
      weights: {
        negativeSentimentWeight: 0,
        urgentImpactWeight: 0,
        acuteThreatKeywordWeight: 0,
        marketStressKeywordWeight: 0,
        mofPolicyDampenerWeight: 0,
        mediaStrategyWeight: 0,
        clarificationDampenerWeight: 0,
        corporateActionDampenerWeight: 0,
        ignoreListDampenerWeight: -100
      },
      matchedFactors: {
        acuteThreats: [],
        marketStress: [],
        mofPolicyKeywords: [],
        mofSpecificKeywords: [],
        isUrgentLevel: false,
        isNegativeSentiment: false
      },
      reasons: [`Khớp danh mục Ignore-list tùy biến từ Bộ lọc Cảnh báo (AlertTriggerModal) [Mẫu: "${ignoreResult.matchedPattern || ''}"]: Miễn trừ hoàn toàn khỏi rủi ro`]
    };
  }

  // =========================================================================
  // 0a. ĐỐI SOÁT CHUẨN XÁC THEO NGHỊ ĐỊNH 376/2026/NĐ-CP (CẨM NANG 100 TÌNH HUỐNG THỰC CHIẾN)
  // =========================================================================
  const d376 = Decree376ClassificationEngine.classify(art);
  if (d376.matchedScenario) {
    const sc = d376.matchedScenario;
    const isExcluded = d376.isExcluded || d376.tier === 0;
    const finalScore = d376.calibratedScores.riskScore;
    const isRisk = finalScore >= RISK_SCORE_THRESHOLD && !isExcluded;
    const severity = d376.tier === 3 ? 'ACUTE' : (d376.tier === 2 ? 'MODERATE' : 'NONE');
    const confidenceScore = d376.tier === 3 ? 95 : (d376.tier === 2 ? 80 : (d376.tier === 1 ? 65 : 20));
    const confidenceLevel = confidenceScore >= 75 ? 'HIGH' : (confidenceScore >= 50 ? 'MEDIUM' : 'LOW');

    return {
      score: finalScore,
      isRisk,
      severity,
      confidenceScore,
      confidenceLevel,
      isHighConfidenceRisk: confidenceScore >= HIGH_CONFIDENCE_THRESHOLD,
      mofRelevanceScore: 90,
      sentimentStressScore: Math.round(d376.calibratedScores.S * 2),
      weights: {
        negativeSentimentWeight: d376.calibratedScores.S,
        urgentImpactWeight: d376.calibratedScores.I * 10,
        acuteThreatKeywordWeight: d376.tier === 3 ? 40 : 0,
        marketStressKeywordWeight: d376.tier === 2 ? 20 : 0,
        mofPolicyDampenerWeight: isExcluded ? -80 : 0,
        mediaStrategyWeight: 0,
        clarificationDampenerWeight: 0,
        corporateActionDampenerWeight: 0,
        ignoreListDampenerWeight: 0,
      },
      matchedFactors: {
        acuteThreats: d376.tier === 3 ? [sc.title] : [],
        marketStress: d376.tier === 2 ? [sc.title] : [],
        mofPolicyKeywords: [sc.decree376Basis.clauseArticle],
        mofSpecificKeywords: [d376.leadAgency.name],
        isUrgentLevel: d376.tier === 3,
        isNegativeSentiment: art.sentiment === 'bearish'
      },
      formulaMetrics: {
        S: d376.calibratedScores.S,
        D: d376.calibratedScores.D,
        V: d376.calibratedScores.V,
        I: d376.calibratedScores.I,
        rawRiskScore: finalScore,
        alertLevel: (d376.alertLevel === 'MARKET_DIGEST' ? 'STANDARD' : d376.alertLevel) as 'STANDARD' | 'DISTANT' | 'RAPID' | 'EARLY' | 'EMERGENCY'
      },
      reasons: [
        `🏛️ Đối soát chuẩn Nghị định 376 [${sc.scenarioCode}]: ${sc.title}`,
        `Cấp độ: ${sc.tierLabelVi} | Đơn vị chủ trì: ${d376.leadAgency.name}`,
        `Căn cứ: ${sc.decree376Basis.clauseArticle} - ${sc.classificationReason}`
      ]
    };
  }

  // Tự động nhận diện từ khóa cổ tức / tăng vốn để hạ cấp điểm rủi ro
  const hasCorporateDividendOrCapitalIncrease = 
    /cổ tức|chia cổ tức|trả cổ tức|tăng vốn|tăng vốn điều lệ|phát hành tăng vốn|chốt quyền trả cổ tức|cổ tức tiền mặt|cổ tức bằng cổ phiếu|phát hành cổ phiếu tăng vốn|chốt danh sách cổ đông nhận cổ tức/i.test(fullText);

  let corporateActionDampenerWeight = 0;
  let ignoreListDampenerWeight = 0;

  // Khắc phục LỖI 1: Báo động giả tràn lan trên các tin tiêu cực mang tính sự vụ cá lẻ
  // Đánh giá rủi ro thấp (NONE), vì đây là nghiệp vụ cưỡng chế pháp luật định kỳ, xã hội đồng thuận.
  const isRoutineEnforcement = isRoutineEnforcementOrSocialConsensus(fullText);
  if (isRoutineEnforcement && !hasAcuteCriminalIncident) {
    return {
      score: 7.5,
      isRisk: false,
      severity: 'NONE',
      confidenceScore: 15,
      confidenceLevel: 'LOW',
      isHighConfidenceRisk: false,
      mofRelevanceScore: 20,
      sentimentStressScore: 10,
      weights: {
        negativeSentimentWeight: 0,
        urgentImpactWeight: 0,
        acuteThreatKeywordWeight: 0,
        marketStressKeywordWeight: 0,
        mofPolicyDampenerWeight: 0,
        mediaStrategyWeight: 0,
        clarificationDampenerWeight: 0,
        corporateActionDampenerWeight: 0,
        ignoreListDampenerWeight: 0,
        routineEnforcementDampenerWeight: -80,
      },
      matchedFactors: {
        acuteThreats: [],
        marketStress: [],
        mofPolicyKeywords: [],
        mofSpecificKeywords: [],
        isUrgentLevel: false,
        isNegativeSentiment: art.sentiment === 'bearish',
        isRoutineEnforcement: true,
      },
      formulaMetrics: {
        S: 5,
        D: 0,
        V: 0.15,
        I: 0.1,
        rawRiskScore: 7.5,
        alertLevel: 'STANDARD',
      },
      reasons: [
        '🛡️ Đã phân loại thông minh: Nghiệp vụ cưỡng chế pháp luật định kỳ, xã hội đồng thuận (xử phạt trốn thuế cá nhân / tạm giữ hàng lậu sự vụ nhỏ lẻ). Rủi ro thể chế thấp, miễn trừ báo động giả.'
      ]
    };
  }

  if (hasCorporateDividendOrCapitalIncrease && !hasAcuteCriminalIncident) {
    corporateActionDampenerWeight = -50;
    reasons.push('Tự động hạ cấp rủi ro: Bài viết chứa từ khóa nghiệp vụ doanh nghiệp thường quy (cổ tức / tăng vốn) (-50đ)');
  }

  const hasNoiseGatePhrases = 
    isFinancialWhitelist ||
    /công bố lệnh|lệnh của chủ tịch nước|chủ tịch nước công bố|lệnh chủ tịch nước|ký lệnh công bố|công bố pháp lệnh|lệnh về việc công bố/i.test(fullText) ||
    /luật sửa đổi|sửa đổi luật|dự thảo luật sửa đổi|luật sửa đổi, bổ sung|luật sửa đổi bổ sung|sửa đổi, bổ sung một số điều|dự án luật sửa đổi|nghị quyết sửa đổi|thông tư sửa đổi|nghị định sửa đổi|hoàn thiện dự thảo luật/i.test(fullText) ||
    /ngân hàng nhà nước|ngân hàng nhà nước việt nam|thống đốc ngân hàng nhà nước|phó thống đốc ngân hàng nhà nước|nhnn/i.test(fullText) ||
    fullText.includes('công bố lệnh') ||
    fullText.includes('luật sửa đổi') ||
    fullText.includes('sửa đổi luật') ||
    fullText.includes('ngân hàng nhà nước') ||
    isRoutineLegalPromulgationOrGovernance(fullText) ||
    isMinistryAuthorityProposal(fullText);

  const hasHighRiskTerms = 
    /hối lộ|nhận hối lộ|đưa hối lộ|sai phạm|vi phạm|khởi tố|bắt tạm giam|tham ô|thất thoát|chiếm dụng|lừa đảo|thao túng/i.test(fullText) ||
    fullText.includes('hối lộ') ||
    fullText.includes('sai phạm') ||
    fullText.includes('vi phạm') ||
    fullText.includes('khởi tố') ||
    fullText.includes('bắt tạm giam') ||
    fullText.includes('tham ô') ||
    fullText.includes('thất thoát');

  if (hasNoiseGatePhrases && !hasHighRiskTerms) {
    return {
      score: 0,
      isRisk: false,
      severity: 'NONE',
      confidenceScore: 0,
      confidenceLevel: 'LOW',
      isHighConfidenceRisk: false,
      mofRelevanceScore: 0,
      sentimentStressScore: 0,
      weights: {
        negativeSentimentWeight: 0,
        urgentImpactWeight: 0,
        acuteThreatKeywordWeight: 0,
        marketStressKeywordWeight: 0,
        mofPolicyDampenerWeight: 0,
        mediaStrategyWeight: 0,
        clarificationDampenerWeight: 0
      },
      matchedFactors: {
        acuteThreats: [],
        marketStress: [],
        mofPolicyKeywords: [],
        mofSpecificKeywords: [],
        isUrgentLevel: false,
        isNegativeSentiment: false
      },
      reasons: [isFinancialWhitelist ? 'Danh mục Whitelist Doanh nghiệp / Hạ tầng Tài chính (Cổ tức, tăng vốn, ĐHĐCĐ, nghiên cứu vĩ mô thường quy): Hạ cấp rủi ro về mức 0' : 'Thông báo thể chế / Công bố Luật / Lệnh của Chủ tịch nước / Ngân hàng Nhà nước / Đề xuất thẩm quyền thường quy (Noise gate: Miễn trừ khỏi rủi ro do không có sai phạm/hối lộ)']
    };
  }

  // Đánh giá chuyên sâu cảnh báo khẩn cấp theo yêu cầu Lãnh đạo Bộ Tài chính
  const ministryAlertAssessment = classifyMinistryAlert(art);

  // =========================================================================
  // 1. TRỌNG SỐ SẮC THÁI TIÊU CỰC (NEGATIVE SENTIMENT WEIGHT) (-40 đến +30 điểm)
  // =========================================================================
  let negativeSentimentWeight = 0;
  if (art.sentiment === 'bearish') {
    negativeSentimentWeight += 20;
    reasons.push('Sắc thái bài viết phản ánh tâm lý tiêu cực (Bearish: +20đ)');

    if (typeof art.sentimentScore === 'number') {
      if (art.sentimentScore <= -60) {
        negativeSentimentWeight += 15;
        reasons.push(`Biên độ tiêu cực sâu (${art.sentimentScore}: +15đ)`);
      } else if (art.sentimentScore <= -25) {
        negativeSentimentWeight += 8;
        reasons.push(`Biên độ tiêu cực vừa (${art.sentimentScore}: +8đ)`);
      }
    }
  } else if (art.sentiment === 'bullish') {
    negativeSentimentWeight -= 40;
    reasons.push('Sắc thái tích cực khả quan (Bullish: -40đ)');
    if (typeof art.sentimentScore === 'number' && art.sentimentScore >= 30) {
      negativeSentimentWeight -= 15;
    }
  }

  // Tín hiệu tăng trưởng / hướng dẫn tích cực xuất hiện ngay trên Tiêu đề
  if (POSITIVE_TITLE_TERMS.some(term => title.includes(term))) {
    negativeSentimentWeight -= 30;
    reasons.push('Tiêu đề phản ánh thông điệp tích cực hoặc hỗ trợ chính sách (-30đ)');
  }

  // =========================================================================
  // 2. TRỌNG SỐ CẤP ĐỘ TÁC ĐỘNG KHẨN CẤP ('URGENT' IMPACT WEIGHT) (-10 đến +40 điểm)
  // Lưu ý: Nếu là biến động thị trường khách quan thì triệt tiêu cờ khẩn cấp để tránh làm loãng!
  // =========================================================================
  let urgentImpactWeight = 0;
  const isUrgentFlag = Boolean(
    art.isEmergency ||
    art.isUrgent ||
    art.impactLevel === ('urgent' as any) ||
    art.impactLevel === ('critical' as any)
  );

  // Chỉ cộng điểm khẩn cấp khi KHÔNG phải là biến động thị trường khách quan đơn thuần
  if (ministryAlertAssessment.isObjectiveMarket && !ministryAlertAssessment.isUrgent) {
    urgentImpactWeight = 0;
  } else {
    if (art.isEmergency) {
      urgentImpactWeight += 40;
      reasons.push('Cờ biến động khẩn cấp trực tiếp (Emergency: +40đ)');
    }

    if (art.isUrgent) {
      urgentImpactWeight += 25;
      reasons.push('Cờ cảnh báo nguy cơ cấp bách (Urgent: +25đ)');
    }

    if (art.impactLevel === ('urgent' as any) || art.impactLevel === ('critical' as any)) {
      urgentImpactWeight += 30;
      reasons.push('Cấp độ tác động khẩn cấp mức hệ thống (Impact urgent: +30đ)');
    } else if (art.impactLevel === 'high') {
      if (art.sentiment === 'bearish') {
        urgentImpactWeight += 15;
        reasons.push('Tác động cao kèm sắc thái tiêu cực (Impact high: +15đ)');
      }
    } else if (art.impactLevel === 'low') {
      urgentImpactWeight -= 10;
    }
  }

  // =========================================================================
  // 3. TRỌNG SỐ TỪ KHÓA SỰ CỐ PHÁP LÝ & KHỦNG HOẢNG CẤP BÁCH (0 đến +65 điểm)
  // =========================================================================
  const matchedAcute: string[] = [];
  let acuteThreatKeywordWeight = 0;

  const isAuthorityProp = isMinistryAuthorityProposal(fullText);

  // Chỉ tính từ khóa sự cố cấp bách nếu không phải là đề xuất bổ sung thẩm quyền / hoàn thiện thể chế
  if (!isAuthorityProp) {
    ACUTE_CRISIS_KEYWORDS.forEach(kw => {
      if (title.includes(kw)) {
        matchedAcute.push(`tiêu_đề:${kw}`);
        acuteThreatKeywordWeight += 55;
      } else if (summary.includes(kw)) {
        matchedAcute.push(`nội_dung:${kw}`);
        acuteThreatKeywordWeight += 25;
      }
    });
  }
  acuteThreatKeywordWeight = Math.min(65, acuteThreatKeywordWeight);
  if (acuteThreatKeywordWeight > 0) {
    reasons.push(`Phát hiện từ khóa sự cố cấp bách (${matchedAcute.slice(0, 2).join(', ')}: +${acuteThreatKeywordWeight}đ)`);
  }

  // =========================================================================
  // 4. TRỌNG SỐ TỪ KHÓA ÁP LỰC THỊ TRƯỜNG VỪA (0 đến +25 điểm)
  // =========================================================================
  const matchedStress: string[] = [];
  let marketStressKeywordWeight = 0;

  MARKET_STRESS_KEYWORDS.forEach(kw => {
    if (title.includes(kw)) {
      matchedStress.push(`tiêu_đề:${kw}`);
      marketStressKeywordWeight += 18;
    } else if (summary.includes(kw)) {
      matchedStress.push(`nội_dung:${kw}`);
      marketStressKeywordWeight += 10;
    }
  });
  marketStressKeywordWeight = Math.min(25, marketStressKeywordWeight);
  if (marketStressKeywordWeight > 0) {
    reasons.push(`Phát hiện từ khóa áp lực thị trường (${matchedStress.slice(0, 2).join(', ')}: +${marketStressKeywordWeight}đ)`);
  }

  // =========================================================================
  // 4b. TRỌNG SỐ ĐẶC BIỆT: TỪ KHÓA 'TRÁCH NHIỆM', 'BỎ QUA', 'HỐI LỘ' TỪ CƠ QUAN KIỂM TRA (0 đến +50 điểm)
  // Áp dụng tăng trọng số rủi ro rất cao cho các sai phạm nghiêm trọng (như vụ Xuyên Việt Oil, Quỹ BOG,
  // Cục Quản lý giá, Đặng Công Khôi, biết doanh nghiệp sai nhưng không xử lý / bỏ qua / hối lộ...)
  // =========================================================================
  const matchedInspectionNeglectBribery: string[] = [];
  let inspectionNeglectBriberyWeight = 0;

  // TIỀN KIỂM BẢO VỆ: Nếu bài viết thuộc diện thể chế thường quy / phân định chức năng nhiệm vụ (in, đúc, tiêu hủy tiền)
  // hoặc phát triển kinh tế địa phương (Cần Thơ ưu tiên hiệu quả đầu tư, khơi thông nguồn lực)
  // -> TUYỆT ĐỐI KHÔNG kích hoạt trọng số sai phạm thanh tra/hối lộ
  const isRoutineOrDelegation = isRoutineLegalPromulgationOrGovernance(fullText) || isMinistryAuthorityProposal(fullText);

  if (!isRoutineOrDelegation) {
    INSPECTION_NEGLECT_BRIBERY_KEYWORDS.forEach(kw => {
      if (fullText.includes(kw)) {
        matchedInspectionNeglectBribery.push(kw);
      }
    });

    const hasSubordinateAgencyContext = 
      /bộ tài chính|cục quản lý giá|tổng cục thuế|cục thuế|tổng cục hải quan|cục hải quan|ubcknn|ủy ban chứng khoán|kho bạc|thanh tra bộ|phòng giá|cục|chi cục/i.test(fullText) ||
      (art.agencies && art.agencies.some(a => /tài chính|thuế|hải quan|chứng khoán|kho bạc|giá/i.test(a))) ||
      MOF_CORE_SECTORS.includes(art.sector as any);

    if (matchedInspectionNeglectBribery.length > 0 && hasSubordinateAgencyContext) {
      inspectionNeglectBriberyWeight = Math.min(50, 35 + matchedInspectionNeglectBribery.length * 5);
      reasons.push(`Phát hiện chỉ báo trách nhiệm/bỏ qua/hối lộ liên quan đơn vị quản lý chuyên ngành (${matchedInspectionNeglectBribery.slice(0, 3).join(', ')}: +${inspectionNeglectBriberyWeight}đ)`);
    }
  }

  // =========================================================================
  // 5. TRỌNG SỐ GIẢM TRỪ CHÍNH SÁCH BỘ TÀI CHÍNH (MOF POLICY DAMPENER) (-50 đến 0 điểm)
  // Triệt tiêu báo động giả khi bài viết thuộc diện văn bản điều hành, thanh tra định kỳ,
  // phòng ngừa rủi ro chủ động hoặc các biện pháp hỗ trợ người nộp thuế & thị trường.
  // =========================================================================
  const matchedPolicy: string[] = [];
  MOF_POLICY_KEYWORDS.forEach(kw => {
    if (fullText.includes(kw)) {
      matchedPolicy.push(kw);
    }
  });

  // Mỗi từ khóa chính sách MoF áp dụng mức giảm trừ -18đ, tối đa -50đ
  const mofPolicyDampenerWeight = Math.max(-50, matchedPolicy.length * -18);
  if (mofPolicyDampenerWeight < 0) {
    reasons.push(`Ngữ cảnh chính sách/quản trị phòng ngừa MoF (${matchedPolicy.slice(0, 3).join(', ')}: ${mofPolicyDampenerWeight}đ)`);
  }

  // =========================================================================
  // 6. TRỌNG SỐ CHIẾN LƯỢC TRUYỀN THÔNG & ĐÍNH CHÍNH
  // =========================================================================
  let mediaStrategyWeight = 0;
  if (art.executiveDirective?.mediaStrategy?.type === 'crisis_resolution') {
    mediaStrategyWeight += 10;
    reasons.push('Đề xuất chiến lược xử lý khủng hoảng (+10đ)');
  } else if (art.executiveDirective?.mediaStrategy?.type === 'positive_amplification') {
    mediaStrategyWeight -= 25;
    reasons.push('Đề xuất lan tỏa thành tựu tích cực (-25đ)');
  }

  let clarificationDampenerWeight = 0;
  if (
    art.isDebunkedOrClarified ||
    fullText.includes('bác bỏ tin đồn') ||
    fullText.includes('đính chính') ||
    fullText.includes('thông tin sai lệch')
  ) {
    clarificationDampenerWeight -= 35;
    reasons.push('Bài viết đính chính/bác bỏ tin đồn thất thiệt (-35đ)');
  }

  // =========================================================================
  // 7. BỘ LỌC CẢNH BÁO BỘ TÀI CHÍNH VS BIẾN ĐỘNG THỊ TRƯỜNG & VỤ ÁN ĐÃ XỬ LÝ
  // =========================================================================
  let marketObjectiveDampenerWeight = 0;
  let postIncidentDampenerWeight = 0;
  let ministryTargetedUrgentWeight = 0;

  if (ministryAlertAssessment.category === 'POST_INCIDENT_MONITORING') {
    postIncidentDampenerWeight = -55;
    reasons.push('Nhận diện vụ việc/án kinh tế đã xử lý hoặc đang trong tiến trình tố tụng/rà soát gói thầu cũ: Triệt tiêu cờ báo động đỏ, xếp loại Điểm tin Giám sát (-55đ)');
  }

  if (ministryAlertAssessment.isObjectiveMarket && !ministryAlertAssessment.isUrgent) {
    marketObjectiveDampenerWeight = -45;
    reasons.push('Nhận diện biến động thị trường khách quan (Cung-cầu, VN-Index, giá vàng, tỷ giá): Loại khỏi diện cảnh báo khẩn của Bộ (-45đ)');
  }

  if (ministryAlertAssessment.isUrgent) {
    ministryTargetedUrgentWeight = 40;
    reasons.push(`Nội dung cấp bách nhắm vào Bộ (${ministryAlertAssessment.categoryLabelVi}: +40đ)`);
  }

  // =========================================================================
  // 8. TÍNH TOÁN ĐIỂM LIÊN QUAN MOF & ĐIỂM CĂNG THẲNG SẮC THÁI (GIAO THOA)
  // =========================================================================
  const matchedMoFSpecific: string[] = [];
  let mofRelevanceScore = 0;

  MOF_SPECIFIC_KEYWORDS.forEach(kw => {
    if (title.includes(kw)) {
      matchedMoFSpecific.push(`tiêu_đề:${kw}`);
      mofRelevanceScore += 25;
    } else if (summary.includes(kw)) {
      matchedMoFSpecific.push(`nội_dung:${kw}`);
      mofRelevanceScore += 10;
    }
  });

  // Cơ quan quản lý trong danh mục thực thể của bài viết
  if (art.agencies && art.agencies.some(a => a.toLowerCase().includes('bộ tài chính') || a.toLowerCase().includes('thuế') || a.toLowerCase().includes('hải quan') || a.toLowerCase().includes('chứng khoán') || a.toLowerCase().includes('kho bạc'))) {
    mofRelevanceScore += 30;
  }

  // Thuộc lĩnh vực trọng tâm MoF
  if (MOF_CORE_SECTORS.includes(art.sector as any)) {
    mofRelevanceScore += 25;
  }
  mofRelevanceScore = Math.min(100, mofRelevanceScore);

  // Tính toán mức độ căng thẳng sắc thái tiêu cực (Negative Sentiment Stress Score)
  let sentimentStressScore = 0;
  if (art.sentiment === 'bearish') {
    sentimentStressScore += 40;
    if (typeof art.sentimentScore === 'number') {
      if (art.sentimentScore <= -70) sentimentStressScore += 30;
      else if (art.sentimentScore <= -50) sentimentStressScore += 20;
      else if (art.sentimentScore <= -25) sentimentStressScore += 15;
      else if (art.sentimentScore < 0) sentimentStressScore += 10;
    }
  } else if (art.sentiment === 'neutral') {
    sentimentStressScore += 10;
  }

  if (isUrgentFlag && ministryAlertAssessment.category !== 'POST_INCIDENT_MONITORING') {
    sentimentStressScore += art.isEmergency ? 25 : 20;
  } else if (art.impactLevel === 'high') {
    sentimentStressScore += 10;
  }

  if (matchedAcute.length > 0 && ministryAlertAssessment.category !== 'POST_INCIDENT_MONITORING') {
    sentimentStressScore += Math.min(30, matchedAcute.length * 15);
  }
  if (matchedStress.length > 0) {
    sentimentStressScore += Math.min(15, matchedStress.length * 8);
  }
  sentimentStressScore = Math.min(100, sentimentStressScore);

  // =========================================================================
  // 9. TỔNG HỢP VÀ CHUẨN HÓA ĐIỂM SỐ RỦI RO & ĐIỂM TIN CẬY (CONFIDENCE SCORE)
  // =========================================================================
  const rawTotal = (
    negativeSentimentWeight +
    urgentImpactWeight +
    acuteThreatKeywordWeight +
    marketStressKeywordWeight +
    inspectionNeglectBriberyWeight +
    mofPolicyDampenerWeight +
    mediaStrategyWeight +
    clarificationDampenerWeight +
    marketObjectiveDampenerWeight +
    postIncidentDampenerWeight +
    ministryTargetedUrgentWeight +
    corporateActionDampenerWeight +
    ignoreListDampenerWeight
  );

  let score = Math.max(0, Math.min(100, Math.round(rawTotal)));

  // BỘ LỌC CHỐNG CẢNH BÁO ẢO CHO TIN TRUNG TÍNH, TÍCH CỰC, THỊ TRƯỜNG KHÁCH QUAN & VỤ ÁN ĐÃ XỬ LÝ:
  let isRisk = score >= RISK_SCORE_THRESHOLD;

  const routineRoundup = isRoutineFinancialMarketRoundup(fullText, art);
  const hasInformationGap = /khoảng trống thông tin|chưa rõ cách tính|chưa có thông tư|chưa có hướng dẫn|mù mờ|băn khoăn kéo dài|kêu cứu/i.test(fullText);
  const isRoutineGovernance = isRoutineLegalPromulgationOrGovernance(fullText);

  if (routineRoundup.isRoundup && !hasInformationGap) {
    // Tin điểm báo tài chính / thị trường thường quy hoặc số liệu tiến độ giải ngân đạt chuẩn không có khoảng trống thông tin
    // -> Gán mức độ nghiêm trọng thể chế S = 0, D = 0, loại bỏ hoàn toàn khỏi luồng cảnh báo rủi ro
    isRisk = false;
    score = 0;
    reasons.push(`Điểm báo thị trường thường nhật / số liệu tiến độ đạt chuẩn (S=0, D=0): ${routineRoundup.reason || 'Không chứa khoảng trống thông tin chính sách'}`);
  } else if (isRoutineGovernance) {
    // Công bố Luật / Lệnh của Chủ tịch nước / Điều hành thể chế thường quy -> Tuyệt đối KHÔNG phải rủi ro
    isRisk = false;
    score = Math.min(score, 20);
    reasons.push('Công bố Luật/Lệnh của Chủ tịch nước & hoạt động thể chế thường quy: Phân loại tin quản trị nhà nước, không cảnh báo rủi ro');
  } else if (isAuthorityProp) {
    // Đề xuất bổ sung thẩm quyền / chức năng hoàn thiện thể chế của Bộ -> Tuyệt đối KHÔNG phải rủi ro, xếp loại Tin Hoạt động Thường quy
    isRisk = false;
    score = Math.min(score, 20);
    reasons.push('Đề xuất bổ sung thẩm quyền/chức năng hoàn thiện thể chế quản lý nhà nước của Bộ Tài chính: Tin hoạt động bình thường, không cảnh báo rủi ro');
  } else if (hasCorporateDividendOrCapitalIncrease && !hasAcuteCriminalIncident) {
    // Tự động hạ cấp điểm rủi ro cho các bài viết chứa từ khóa 'cổ tức' hoặc 'tăng vốn'
    isRisk = false;
    score = Math.min(score, 15);
    reasons.push('Tự động hạ cấp điểm rủi ro: Bài viết liên quan nghiệp vụ cổ tức / tăng vốn doanh nghiệp thường quy (không cấu thành rủi ro điều hành MoF)');
  } else if (inspectionNeglectBriberyWeight > 0) {
    // Chỉ báo sai phạm kiểm tra, bỏ qua, hối lộ liên quan đơn vị quản lý chuyên ngành -> Bắt buộc kích hoạt cờ Rủi ro cao
    isRisk = true;
    score = Math.max(score, 90);
    reasons.push('Phát hiện chỉ báo nghiêm trọng về trách nhiệm, bỏ qua sai phạm hoặc đưa nhận hối lộ liên quan cơ quan quản lý: Kích hoạt cảnh báo rủi ro cấp bách');
  } else if (ministryAlertAssessment.category === 'POST_INCIDENT_MONITORING') {
    // Vụ việc sai phạm/đấu thầu đã xử lý / giai đoạn tố tụng -> KHÔNG kích hoạt cảnh báo đỏ, xếp loại Điểm tin Giám sát Thường quy (Score 25-35)
    isRisk = false;
    score = Math.min(score, 35);
  } else if (ministryAlertAssessment.isObjectiveMarket && !ministryAlertAssessment.isUrgent) {
    // Biến động thị trường thuần túy -> KHÔNG đưa vào diện cảnh báo rủi ro đỏ của Bộ
    isRisk = false;
    score = Math.min(score, 35);
  } else if (ministryAlertAssessment.isUrgent) {
    // Thuộc nhóm chỉ trích, kiến nghị, thủ tục hoặc vụ việc trách nhiệm Bộ -> Kích hoạt cảnh báo thực chất
    isRisk = true;
    score = Math.max(score, 88);
  }

  const divergenceResult = detectNarrativeRealityDivergence(fullText, art);
  const isLatentPolicy = isLatentPolicyCrisis(fullText, art);
  const isLatentTech = isLatentRiskInPositiveTech(fullText, art);

  if (divergenceResult.detected) {
    // Hiện tượng Narrative-Reality Divergence: Mâu thuẫn giữa cam kết chỉ đạo và số liệu thực tế
    isRisk = true;
    score = 69.8;
    reasons.push(`⚡ Phát hiện độ vênh chỉ đạo - thực tiễn (Narrative-Reality Divergence: D=18, S=35): ${divergenceResult.details}`);
  } else if (isLatentPolicy) {
    // Mầm mống rủi ro chính sách diện rộng trong tin trung tính
    isRisk = true;
    score = 42.5;
    reasons.push('⏳ Kích hoạt CẢNH BÁO SỚM (Early Warning - 42.5đ): Phát hiện mầm mống rủi ro chính sách diện rộng trong tin trung tính (chạm tới hàng triệu hộ kinh doanh, thủ tục phức tạp, cơ sở đang lúng túng)');
  } else if (isLatentTech) {
    // Rủi ro thể chế tiềm ẩn trong tin tích cực / học thuật / công nghệ mới
    isRisk = true;
    score = 26.6;
    reasons.push('📡 Kích hoạt CẢNH BÁO XA (Early Horizon - 26.6đ): Phát hiện rủi ro thể chế tiềm ẩn trong tin tích cực/học thuật (nguy cơ bất bình đẳng với NĐT nhỏ lẻ, rủi ro thao túng AI và khoảng trống pháp lý bồi thường)');
  } else if (art.sentiment === 'bullish') {
    isRisk = false;
    score = Math.min(score, 20);
  } else if (art.sentiment === 'neutral' && !art.isEmergency && !isUrgentFlag) {
    // Tin trung tính không có cờ khẩn cấp và không có mầm mống rủi ro -> Không cảnh báo rủi ro
    isRisk = false;
    score = Math.min(score, 30);
  }

  const severity: 'ACUTE' | 'MODERATE' | 'NONE' =
    isRisk ? (score >= ACUTE_RISK_THRESHOLD ? 'ACUTE' : 'MODERATE') : 'NONE';

  // TÍNH TOÁN CONFIDENCE SCORE DỰA TRÊN GIAO THOA (INTERSECTION) MOF-KEYWORDS & SENTIMENT
  let confidenceScore = 0;
  if (divergenceResult.detected) {
    confidenceScore = 90;
  } else if (isLatentPolicy) {
    confidenceScore = 85;
  } else if (isLatentTech) {
    confidenceScore = 78;
  } else if (mofRelevanceScore > 0 && sentimentStressScore > 0 && isRisk) {
    // 1. Tích giao thoa hình học căn bậc hai (Geometric Intersection)
    const baseIntersection = Math.sqrt(mofRelevanceScore * sentimentStressScore);

    // 2. Điểm cộng hưởng khi sự cố cấp bách tác động trực tiếp lĩnh vực MoF
    const acuteMoFSynergy = (matchedAcute.length > 0 && (matchedMoFSpecific.length > 0 || MOF_CORE_SECTORS.includes(art.sector as any))) ? 15 : 0;

    // 3. Điểm cộng hưởng khi phát hiện hành vi bỏ qua / hối lộ / thiếu trách nhiệm
    const briberySynergy = inspectionNeglectBriberyWeight > 0 ? 25 : 0;

    // 4. Điểm cộng hưởng khi cả 2 nhân tố đều vượt ngưỡng cao
    const dualHighBonus = (mofRelevanceScore >= 50 && sentimentStressScore >= 50) ? 10 : 0;

    // 5. Giảm trừ nếu có yếu tố chính sách giải tỏa / đính chính
    const policyDampener = Math.round(mofPolicyDampenerWeight * 0.35); // -5 đến -18
    const clarificationDampener = clarificationDampenerWeight < 0 ? -25 : 0;

    const rawConfidence = baseIntersection + acuteMoFSynergy + briberySynergy + dualHighBonus + policyDampener + clarificationDampener;
    confidenceScore = Math.max(0, Math.min(100, Math.round(rawConfidence)));
  } else if (isRisk) {
    // Có điểm rủi ro nhưng thiếu tính giao thoa thực chất với MoF
    confidenceScore = Math.min(45, Math.round(score * 0.4));
  } else {
    confidenceScore = 0;
  }

  let formulaMetrics: RiskScoreBreakdown['formulaMetrics'] = undefined;
  if (routineRoundup.isRoundup && !hasInformationGap) {
    formulaMetrics = { S: 0, D: 0, V: 0.1, I: 0.1, rawRiskScore: 0, alertLevel: 'STANDARD' };
  } else if (divergenceResult.detected) {
    formulaMetrics = { S: 35, D: 18, V: 0.8, I: 0.9, rawRiskScore: 69.8, alertLevel: 'RAPID' };
  } else if (isLatentPolicy) {
    formulaMetrics = { S: 25, D: 0, V: 0.3, I: 1.0, rawRiskScore: 42.5, alertLevel: 'EARLY' };
  } else if (isLatentTech) {
    formulaMetrics = { S: 20, D: 0, V: 0.2, I: 0.6, rawRiskScore: 26.6, alertLevel: 'DISTANT' };
  } else if (score >= 75) {
    formulaMetrics = { S: 45, D: 10, V: 0.8, I: 0.9, rawRiskScore: score, alertLevel: 'EMERGENCY' };
  } else if (score >= 60) {
    formulaMetrics = { S: 35, D: 5, V: 0.7, I: 0.8, rawRiskScore: score, alertLevel: 'RAPID' };
  } else if (score >= 40) {
    formulaMetrics = { S: 25, D: 0, V: 0.4, I: 0.7, rawRiskScore: score, alertLevel: 'EARLY' };
  } else if (score >= 20) {
    formulaMetrics = { S: 15, D: 0, V: 0.3, I: 0.5, rawRiskScore: score, alertLevel: 'DISTANT' };
  } else {
    formulaMetrics = { S: 5, D: 0, V: 0.15, I: 0.1, rawRiskScore: score, alertLevel: 'STANDARD' };
  }

  const confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' =
    confidenceScore >= HIGH_CONFIDENCE_THRESHOLD ? 'HIGH' : (confidenceScore >= MEDIUM_CONFIDENCE_THRESHOLD ? 'MEDIUM' : 'LOW');
  const isHighConfidenceRisk = isRisk && confidenceScore >= HIGH_CONFIDENCE_THRESHOLD;

  if (isRisk) {
    reasons.push(`Độ tin cậy rủi ro MoF: ${confidenceScore}% (${confidenceLevel === 'HIGH' ? 'Cao' : confidenceLevel === 'MEDIUM' ? 'Vừa' : 'Thấp'}) - Giao thoa liên quan MoF (${mofRelevanceScore}đ) x Áp lực tiêu cực (${sentimentStressScore}đ)`);
  }

  return {
    score,
    isRisk,
    severity,
    confidenceScore,
    confidenceLevel,
    isHighConfidenceRisk,
    mofRelevanceScore,
    sentimentStressScore,
    ministryAlertAssessment,
    formulaMetrics,
    weights: {
      negativeSentimentWeight,
      urgentImpactWeight,
      acuteThreatKeywordWeight,
      marketStressKeywordWeight,
      mofPolicyDampenerWeight,
      mediaStrategyWeight,
      clarificationDampenerWeight,
      marketObjectiveDampenerWeight,
      postIncidentDampenerWeight,
      ministryTargetedUrgentWeight,
      corporateActionDampenerWeight,
      ignoreListDampenerWeight,
      latentPolicyWeight: isLatentPolicy ? 42.5 : 0,
      latentTechWeight: isLatentTech ? 26.6 : 0,
      narrativeDivergenceWeight: divergenceResult.detected ? 69.8 : 0,
    },
    matchedFactors: {
      acuteThreats: matchedAcute,
      marketStress: matchedStress,
      mofPolicyKeywords: matchedPolicy,
      mofSpecificKeywords: matchedMoFSpecific,
      isUrgentLevel: isUrgentFlag,
      isNegativeSentiment: art.sentiment === 'bearish',
      isObjectiveMarket: ministryAlertAssessment.isObjectiveMarket,
      isPostIncident: ministryAlertAssessment.category === 'POST_INCIDENT_MONITORING',
      isLatentPolicyCrisis: isLatentPolicy,
      isLatentTechRisk: isLatentTech,
      isDivergenceDetected: divergenceResult.detected,
    },
    reasons
  };
}

/**
 * Kiểm tra xem bài viết có thuộc diện Điểm tin Giám sát Tố tụng / Vụ việc đã xử lý hay không
 */
export function isPostIncidentMonitoringArticle(art: ScrapedNewsItem): boolean {
  if (!art) return false;
  return classifyMinistryAlert(art).category === 'POST_INCIDENT_MONITORING';
}

/**
 * Kiểm tra xem bài viết có thực sự là NGUY CƠ / KHỦNG HOẢNG hay không
 * 1. Bỏ qua (ignore) các thông báo pháp lý / hành chính thường quy:
 *    - Công bố Luật / Lệnh của Chủ tịch nước / Nghị định / Thông tư thường quy
 *    - Hoạt động quản trị giao ban, hội nghị triển khai, tập huấn định kỳ
 *    - Đề xuất bổ sung thẩm quyền / hoàn thiện thể chế quản lý nhà nước của Bộ
 *    - Vụ việc sai phạm / đấu thầu cũ đã kết thúc điều tra / đang trong giai đoạn tố tụng tòa án (POST_INCIDENT_MONITORING)
 * 2. Nhận diện và gắn cờ (flag) các bài viết có chỉ báo rủi ro cao liên quan đến Bộ Tài chính:
 *    - Chỉ trích, lên án, quy kết trách nhiệm trực tiếp vào Bộ / Tổng cục / Cục (MINISTRY_CRITIQUE_KEYWORDS)
 *    - Bức xúc thủ tục hành chính, ách tắc hải quan, chậm hoàn thuế VAT nghìn tỷ (POLICY_PROCEDURE_COMPLAINT_KEYWORDS)
 *    - Kiến nghị khẩn thiết, kêu cứu dòng tiền/cơ chế từ DN, hiệp hội, nhà đầu tư, trái chủ (BUSINESS_INVESTOR_PETITION_KEYWORDS)
 *    - Sự cố trách nhiệm, bỏ qua vi phạm, hối lộ từ cơ quan kiểm tra (INSPECTION_NEGLECT_BRIBERY_KEYWORDS)
 *    - Sự cố nghiêm trọng đang phát sinh: Quỹ BOG, Xuyên Việt Oil, Đặng Công Khôi, khởi tố cán bộ thuế/hải quan, đường dây hóa đơn khống (MINISTRY_ACCOUNTABILITY_KEYWORDS & ACUTE_CRISIS_KEYWORDS)
 * Hỗ trợ bộ lọc tùy chọn chỉ lấy bài viết có Độ tin cậy cao (Confidence Score >= 70)
/**
 * BỘ LỌC 2 BƯỚC CHO TỪ 'KHỞI TỐ' (Two-stage 'khởi tố' filter):
 * - Bước 1: Kiểm tra xem từ 'khởi tố' có nằm trong nội dung cốt lõi của bài viết (Title & Summary) hay không,
 *   loại bỏ triệt để nhiễu từ chân trang, thanh điều hướng, hoặc quảng cáo/bài liên quan.
 * - Bước 2: Phân tích ngữ cảnh 'khởi tố' (loại trừ tái cơ cấu doanh nghiệp, thảo luận luật, án cá nhân dân sự không liên quan).
 */
export function verifyCoreIndictmentContext(art: ScrapedNewsItem): {
  hasCoreIndictment: boolean;
  isUrgentCrisisIndictment: boolean;
  reason: string;
} {
  if (!art) {
    return { hasCoreIndictment: false, isUrgentCrisisIndictment: false, reason: 'Bài viết rỗng' };
  }

  const title = (art.title || '').toLowerCase();
  const summary = `${art.summary || ''} ${art.snippet || ''} ${art.tldrSummary || ''}`.toLowerCase();
  const coreText = `${title} ${summary}`;

  // Bước 1: Kiểm tra xem từ 'khởi tố' có xuất hiện trong Tiêu đề hoặc Tóm tắt chính hay không
  const hasCoreIndictment = coreText.includes('khởi tố') || coreText.includes('bị can') || coreText.includes('bắt tạm giam');

  if (!hasCoreIndictment) {
    return {
      hasCoreIndictment: false,
      isUrgentCrisisIndictment: false,
      reason: 'Từ khóa khởi tố không nằm trong nội dung cốt lõi (Title/Summary), có thể là nhiễu từ chân trang hoặc quảng cáo',
    };
  }

  // Bước 2: Phân tích ngữ cảnh bài viết (Doanh nghiệp Nhà nước / Tái cơ cấu EVN / Đề xuất thẩm quyền)
  if (
    coreText.includes('tách khỏi evn') ||
    coreText.includes('truyền tải điện quốc gia') ||
    coreText.includes('tái cơ cấu evn') ||
    coreText.includes('đề xuất bổ sung thẩm quyền') ||
    coreText.includes('quyền khởi tố vụ án thuế')
  ) {
    if (!coreText.includes('khởi tố vụ án') && !coreText.includes('khởi tố bị can') && !coreText.includes('bắt tạm giam cán bộ')) {
      return {
        hasCoreIndictment: true,
        isUrgentCrisisIndictment: false,
        reason: 'Tin tức tái cơ cấu / cổ phần hóa / tách doanh nghiệp Nhà nước, không phải vụ án hình sự',
      };
    }
  }

  // Nếu bài viết đã có thông tin phân tích ngữ cảnh Gemini từ server
  if ((art as any).indictmentAnalysis) {
    const analysis = (art as any).indictmentAnalysis;
    return {
      hasCoreIndictment: true,
      isUrgentCrisisIndictment: Boolean(analysis.isUrgentCrisis),
      reason: analysis.reasoning || 'Phân tích từ Gemini API',
    };
  }

  // Vụ án hình sự khởi tố bị can cán bộ Thuế/Hải quan/Chứng khoán hoặc gian lận tài chính đại án
  const isDirectMoFCrisis =
    /khởi tố cán bộ|bắt tạm giam cán bộ|khởi tố bị can|gian lận hóa đơn|thao túng giá chứng khoán|chiếm đoạt tài sản nhà nước|tham ô|quỹ bog|xuyên việt oil|bị can đặng công khôi/i.test(
      coreText
    );

  return {
    hasCoreIndictment: true,
    isUrgentCrisisIndictment: isDirectMoFCrisis,
    reason: isDirectMoFCrisis
      ? 'Khởi tố vụ án/bị can có tác động trực tiếp tới ngành Tài chính hoặc tội phạm tài chính khẩn cấp'
      : 'Vụ án khởi tố cá nhân/dân sự ngoài ngành không gây khủng hoảng thể chế',
  };
}

/**
 * Tương thích hoàn hảo với Array.prototype.filter(isRiskArticle)
 */
export function isRiskArticle(
  art: ScrapedNewsItem,
  optionsOrIndex?: { requireHighConfidence?: boolean; minConfidenceScore?: number; customIgnoreRules?: AlertIgnoreRule[] } | boolean | number,
  _array?: ScrapedNewsItem[]
): boolean {
  if (!art) return false;

  // Đối soát chuẩn mực theo Nghị định 376/2026/NĐ-CP (100 Tình huống thực chiến)
  const d376 = Decree376ClassificationEngine.classify(art);
  if (d376.isExcluded || d376.tier === 0) {
    return false; // Mức 0 loại trừ tuyệt đối, triệt tiêu báo động giả
  }
  if (d376.tier === 3 || d376.tier === 2) {
    return true; // Mức 2 và Mức 3 chắc chắn là tin nguy cơ / cảnh báo thực tế
  }

  // 0a. LOẠI TRỪ DỮ LIỆU LẤP ĐẦY / GIẢ LẬP / ĐÃ LOẠI BỎ (DROPPED & MARKET DIGEST)
  if (art.isMarketDigest) return false;
  if (art.scrapeIntegrityStatus && art.scrapeIntegrityStatus.includes('Dropped')) return false;
  if ((art as any).isSimulated && !art.isEmergency) return false;

  const title = (art.title || '').toLowerCase();
  const summary = (art.summary || art.snippet || '').toLowerCase();
  const fullText = `${title} ${summary} ${art.sentimentReason || ''}`.toLowerCase();

  // 0a1. LOẠI TRỪ TUYỆT ĐỐI TIN ĐIỂM BÁO THỊ TRƯỜNG THƯỜNG QUY & GIẢI NGÂN ĐẠT CHUẨN KHÔNG CÓ KHOẢNG TRỐNG
  const roundupCheck = isRoutineFinancialMarketRoundup(fullText, art);
  const hasInfoGap = /khoảng trống thông tin|chưa rõ cách tính|chưa có thông tư|chưa có hướng dẫn|mù mờ|băn khoăn kéo dài|kêu cứu/i.test(fullText);
  if (roundupCheck.isRoundup && !hasInfoGap) {
    return false;
  }

  const customRules = typeof optionsOrIndex === 'object' ? optionsOrIndex?.customIgnoreRules : undefined;

  // 0. BỘ LỌC BỎ QUA CẢNH BÁO TÙY BIẾN (PERSISTENT IGNORE-LIST ĐƯỢC QUẢN LÝ TRONG ALERTTRIGGERMODAL)
  const ignoreCheck = checkPersistentIgnoreList(art, customRules);
  if (ignoreCheck.isIgnored) {
    return false;
  }

  // 0b. TỰ ĐỘNG HẠ CẤP VÀ MIỄN TRỪ CÁC BÀI VIẾT CHỨA TỪ KHÓA 'CỔ TỨC' HOẶC 'TĂNG VỐN'
  const isCorporateDividendOrCapitalIncrease = 
    /cổ tức|chia cổ tức|trả cổ tức|tăng vốn|tăng vốn điều lệ|phát hành tăng vốn|chốt quyền trả cổ tức|cổ tức tiền mặt|cổ tức bằng cổ phiếu|phát hành cổ phiếu tăng vốn|chốt danh sách cổ đông nhận cổ tức/i.test(fullText);
  const hasAcuteCriminalIncident = 
    /khởi tố bị can|khởi tố cán bộ|bắt tạm giam cán bộ|cán bộ nhận hối lộ|đại án tham nhũng|vụ án xuyên việt oil|bị can đặng công khôi/i.test(fullText);
  if (isCorporateDividendOrCapitalIncrease && !hasAcuteCriminalIncident) {
    return false;
  }

  // 0c. BỘ LỌC 2 BƯỚC CHO TỪ 'KHỞI TỐ' (STAGE 1 & STAGE 2 FILTER)
  if (fullText.includes('khởi tố')) {
    const indictmentCheck = verifyCoreIndictmentContext(art);
    if (!indictmentCheck.hasCoreIndictment || !indictmentCheck.isUrgentCrisisIndictment) {
      if (title.includes('tách khỏi evn') || title.includes('truyền tải điện') || !indictmentCheck.hasCoreIndictment) {
        return false;
      }
    }
  }

  // 1. LOẠI TRỪ TUYỆT ĐỐI CÁC THÔNG BÁO HÀNH CHÍNH, PHÁP LÝ THƯỜNG QUY & WHITELIST DOANH NGHIỆP:
  if (isFinancialInfrastructureOrBusinessUpdate(fullText, customRules)) {
    return false;
  }

  // Regex-based noise gate checking for phrases like 'công bố lệnh', 'luật sửa đổi', or 'ngân hàng nhà nước'.
  // If present and high-risk terms (e.g., 'hối lộ', 'sai phạm') are NOT present, immediately return false to exempt from risk scoring.
  const hasNoiseGatePhrases = 
    /công bố lệnh|lệnh của chủ tịch nước|chủ tịch nước công bố|lệnh chủ tịch nước|ký lệnh công bố|công bố pháp lệnh|lệnh về việc công bố/i.test(fullText) ||
    /luật sửa đổi|sửa đổi luật|dự thảo luật sửa đổi|luật sửa đổi, bổ sung|luật sửa đổi bổ sung|sửa đổi, bổ sung một số điều|dự án luật sửa đổi|nghị quyết sửa đổi|thông tư sửa đổi|nghị định sửa đổi|hoàn thiện dự thảo luật/i.test(fullText) ||
    /ngân hàng nhà nước|ngân hàng nhà nước việt nam|thống đốc ngân hàng nhà nước|phó thống đốc ngân hàng nhà nước|nhnn/i.test(fullText) ||
    fullText.includes('công bố lệnh') ||
    fullText.includes('luật sửa đổi') ||
    fullText.includes('sửa đổi luật') ||
    fullText.includes('ngân hàng nhà nước');

  const hasHighRiskTerms = 
    /hối lộ|nhận hối lộ|đưa hối lộ|sai phạm|vi phạm|khởi tố|bắt tạm giam|tham ô|thất thoát|chiếm dụng|lừa đảo|thao túng/i.test(fullText) ||
    fullText.includes('hối lộ') ||
    fullText.includes('sai phạm') ||
    fullText.includes('vi phạm') ||
    fullText.includes('khởi tố') ||
    fullText.includes('bắt tạm giam') ||
    fullText.includes('tham ô') ||
    fullText.includes('thất thoát');

  // Nhận diện mầm mống rủi ro chính sách diện rộng / khoảng trống pháp lý công nghệ / độ vênh chỉ đạo (Early Horizon & Early Warning)
  const isEarlySignalOrConcern = 
    isLatentPolicyCrisis(fullText, art) ||
    isLatentRiskInPositiveTech(fullText, art) ||
    detectNarrativeRealityDivergence(fullText, art).detected ||
    /băn khoăn|lo ngại|lo lắng|vướng mắc|kiến nghị|bức xúc|kêu cứu|bất cập|lúng túng|khó khăn|ách tắc|chậm giải ngân|thấp kỷ lục|chưa có khung pháp lý|khoảng trống pháp lý|rủi ro hệ thống|flash crash/i.test(fullText);

  if (hasNoiseGatePhrases && !hasHighRiskTerms && !isEarlySignalOrConcern) {
    return false;
  }

  if (isRoutineLegalPromulgationOrGovernance(fullText) && !hasHighRiskTerms && !isEarlySignalOrConcern) {
    return false;
  }

  if (isMinistryAuthorityProposal(fullText) && !hasHighRiskTerms) {
    return false;
  }

  if (isPostIncidentMonitoringArticle(art)) {
    return false;
  }

  // Khắc phục LỖI 1: Nghiệp vụ cưỡng chế pháp luật định kỳ, xã hội đồng thuận -> Tuyệt đối không phải rủi ro cảnh báo đỏ
  if (isRoutineEnforcementOrSocialConsensus(fullText) && !hasHighRiskTerms) {
    return false;
  }

  // 2. NHẬN DIỆN CÁC CHỈ BÁO RỦI RO CAO ĐẶC THÙ BỘ TÀI CHÍNH (FLAG HIGH RISK INDICATORS RELATED TO MOF)
  const hasDirectMoFCritique = MINISTRY_CRITIQUE_KEYWORDS.some(kw => fullText.includes(kw));
  const hasMoFProcedureComplaint = POLICY_PROCEDURE_COMPLAINT_KEYWORDS.some(kw => fullText.includes(kw)) && art.sentiment !== 'bullish';
  const hasMoFPetitionPleas = BUSINESS_INVESTOR_PETITION_KEYWORDS.some(kw => fullText.includes(kw)) && art.sentiment !== 'bullish';
  const hasMoFAccountabilityCrisis = MINISTRY_ACCOUNTABILITY_KEYWORDS.some(kw => fullText.includes(kw));
  const hasAcuteCrisisKeyword = ACUTE_CRISIS_KEYWORDS.some(kw => fullText.includes(kw));
  const hasInspectionNeglectBribery = INSPECTION_NEGLECT_BRIBERY_KEYWORDS.some(kw => fullText.includes(kw));

  // Kiểm tra mối liên hệ ngữ cảnh với Bộ Tài chính / Thuế / Hải quan / Chứng khoán / Kho bạc / Cục Quản lý giá
  const hasMoFDomainContext = 
    MOF_SPECIFIC_KEYWORDS.some(kw => fullText.includes(kw)) ||
    MOF_CORE_SECTORS.includes(art.sector as any) ||
    /cục quản lý giá|phòng giá|đặng công khôi|xuyên việt oil|quỹ bog/i.test(fullText) ||
    (art.agencies && art.agencies.some(a => /bộ tài chính|thuế|hải quan|chứng khoán|kho bạc|giá|bảo hiểm/i.test(a)));

  const hasHighMoFRiskIndicators = Boolean(
    hasDirectMoFCritique ||
    hasMoFAccountabilityCrisis ||
    (hasInspectionNeglectBribery && hasMoFDomainContext) ||
    hasMoFProcedureComplaint ||
    hasMoFPetitionPleas ||
    (hasAcuteCrisisKeyword && hasMoFDomainContext && art.sentiment === 'bearish')
  );

  // 3. TÍNH TOÁN ĐIỂM RỦI RO TỔNG HỢP TỪ ENGINE & KIỂM TRA NGƯỠNG CỨNG TỐI THIỂU 20 ĐIỂM
  const assessment = calculateRiskScore(art);
  const effectiveRiskScore = Number(art.warningPipeline?.level2Risk?.riskScore ?? assessment.score ?? 0);

  // Ngưỡng cứng: Điểm rủi ro < 20 điểm thuộc diện Tiêu chuẩn (STANDARD: 0–19đ), tuyệt đối không gắn cờ rủi ro
  if (effectiveRiskScore < 20) {
    return false;
  }

  // Cờ rủi ro xác lập khi đạt ngưỡng cứng (≥ 20đ) và thỏa mãn chỉ báo rủi ro thực chất
  const isFlaggedAsRisk = assessment.isRisk || effectiveRiskScore >= 20 || (hasHighMoFRiskIndicators && (art.sentiment === 'bearish' || art.isEmergency || (art.buzzScore || 0) >= 60 || (hasInspectionNeglectBribery && hasMoFDomainContext)));

  if (!isFlaggedAsRisk) return false;

  // Nếu được gọi từ Array.prototype.filter, tham số thứ 2 là index (number)
  if (typeof optionsOrIndex === 'number') {
    return true;
  }

  const requireHighConfidence = typeof optionsOrIndex === 'boolean' ? optionsOrIndex : optionsOrIndex?.requireHighConfidence;
  const minConfidence = (typeof optionsOrIndex === 'object' && optionsOrIndex?.minConfidenceScore) || HIGH_CONFIDENCE_THRESHOLD;

  if (requireHighConfidence) {
    // Nếu có chỉ báo rủi ro cao trực diện Bộ Tài chính (như khởi tố, Quỹ BOG, bỏ qua sai phạm, nhận hối lộ, chỉ trích gay gắt), đáp ứng chuẩn rủi ro tin cậy cao
    if (hasHighMoFRiskIndicators && (hasDirectMoFCritique || hasMoFAccountabilityCrisis || (hasInspectionNeglectBribery && hasMoFDomainContext) || (hasAcuteCrisisKeyword && hasMoFDomainContext))) {
      return true;
    }
    return assessment.confidenceScore >= minConfidence;
  }
  return true;
}

/**
 * Kiểm tra nhanh bài viết có phải là Rủi ro với Độ tin cậy cao (High Confidence Risk)
 */
export function isHighConfidenceRiskArticle(art: ScrapedNewsItem, minScore: number = HIGH_CONFIDENCE_THRESHOLD): boolean {
  return isRiskArticle(art, { requireHighConfidence: true, minConfidenceScore: minScore });
}

/**
 * Lấy chi tiết Độ tin cậy rủi ro của bài viết
 */
export function getRiskConfidence(art: ScrapedNewsItem): {
  score: number;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  isHigh: boolean;
  mofScore: number;
  sentimentScore: number;
  reasons: string[];
} {
  if (!art) {
    return { score: 0, level: 'LOW', isHigh: false, mofScore: 0, sentimentScore: 0, reasons: [] };
  }
  const res = calculateRiskScore(art);
  return {
    score: res.confidenceScore,
    level: res.confidenceLevel,
    isHigh: res.isHighConfidenceRisk,
    mofScore: res.mofRelevanceScore,
    sentimentScore: res.sentimentStressScore,
    reasons: res.reasons
  };
}

/**
 * Phân cấp độ rủi ro: Cấp bách (ACUTE) | Vừa phải (MODERATE) | Không rủi ro (NONE)
 */
export function getRiskSeverity(art: ScrapedNewsItem): 'ACUTE' | 'MODERATE' | 'NONE' {
  if (!art) return 'NONE';
  return calculateRiskScore(art).severity;
}

/**
 * Tính toán Điểm sáng Đột phá & Độ tin cậy (Bright Spot Scoring Engine)
 * Quy định chặt chẽ, đa tiêu chí, sát thực tế điều hành Bộ Tài chính & Kinh tế Vĩ mô
 */
export function calculateBrightSpotScore(art: ScrapedNewsItem): BrightSpotScoreBreakdown {
  const emptyResult: BrightSpotScoreBreakdown = {
    score: 0,
    isBrightSpot: false,
    confidenceScore: 0,
    confidenceLevel: 'LOW',
    isHighConfidenceBrightSpot: false,
    pillar: 'GENERAL',
    pillarTitleVi: 'Thành tựu Tài chính Đột phá',
    pillarBadge: '✨ Điểm sáng Đột phá',
    mofRelevanceScore: 0,
    achievementEvidenceScore: 0,
    weights: {
      mofPillarWeight: 0,
      achievementEvidenceWeight: 0,
      positiveSentimentWeight: 0,
      speculationDampenerWeight: 0,
      commercialPrDampenerWeight: 0,
      routineAdminDampenerWeight: 0,
      officialSourceBonusWeight: 0,
    },
    matchedFactors: {
      pillarKeywords: [],
      evidenceKeywords: [],
      speculationKeywords: [],
      commercialPrKeywords: [],
    },
    reasons: [],
  };

  if (!art) return emptyResult;

  const title = (art.title || '').toLowerCase();
  const body = `${art.summary || ''} ${art.snippet || ''} ${art.tldrSummary || ''}`.toLowerCase();
  const text = `${title} ${body}`;

  // 1. RULE LOẠI TRỪ TUYỆT ĐỐI (STRICT CRISIS / RISK EXCLUSION)
  // Nếu bài viết đã bị nhận diện là Rủi ro, hoặc có từ khóa vi phạm pháp luật / khởi tố / vỡ nợ
  // (Ngoại trừ bài viết đề xuất bổ sung thẩm quyền / hoàn thiện thể chế của Bộ)
  const isAuthorityProp = isMinistryAuthorityProposal(text);
  const hasStrictCrisis = !isAuthorityProp && STRICT_CRISIS_TERMS.some((term) => text.includes(term));
  if (isRiskArticle(art) || hasStrictCrisis) {
    return {
      ...emptyResult,
      reasons: ['Bài viết mang yếu tố rủi ro / vi phạm pháp luật / sai phạm tài chính, loại trừ hoàn toàn khỏi Điểm sáng.'],
    };
  }

  // 2. KHẢO SÁT 6 TRỤ CỘT ĐIỂM SÁNG BỘ TÀI CHÍNH & KINH TẾ VĨ MÔ
  let pillar: BrightSpotPillar = 'GENERAL';
  let pillarTitleVi = 'Thành tựu Tài chính Đột phá';
  let pillarBadge = '✨ Điểm sáng Đột phá';
  let matchedPillarKeywords: string[] = [];

  const matchedBudget = PILLAR_BUDGET_REVENUE_KEYWORDS.filter((kw) => text.includes(kw));
  const matchedTaxCustoms = PILLAR_TAX_CUSTOMS_REFORM_KEYWORDS.filter((kw) => text.includes(kw));
  const matchedCapital = PILLAR_CAPITAL_MARKET_KEYWORDS.filter((kw) => text.includes(kw));
  const matchedInvestment = PILLAR_PUBLIC_INVESTMENT_KEYWORDS.filter((kw) => text.includes(kw));
  const matchedMacro = PILLAR_MACRO_CREDIT_RATING_KEYWORDS.filter((kw) => text.includes(kw));
  const matchedRelief = PILLAR_FISCAL_RELIEF_KEYWORDS.filter((kw) => text.includes(kw));

  const pillarCounts = [
    { p: 'BUDGET_REVENUE' as BrightSpotPillar, title: 'Thu ngân sách & Cân đối vĩ mô', badge: '🌟 Thu NSNN vượt mốc', kws: matchedBudget },
    { p: 'TAX_CUSTOMS_REFORM' as BrightSpotPillar, title: 'Cải cách Thuế, HĐĐT & Hải quan số', badge: '⚡ Hoàn thuế & Hải quan số', kws: matchedTaxCustoms },
    { p: 'CAPITAL_MARKET' as BrightSpotPillar, title: 'Thị trường Vốn & Nâng hạng TTCK', badge: '🚀 Nâng hạng & Non-prefunding', kws: matchedCapital },
    { p: 'PUBLIC_INVESTMENT' as BrightSpotPillar, title: 'Giải ngân Đầu tư công & Ngân quỹ', badge: '🏗️ Giải ngân Đầu tư công', kws: matchedInvestment },
    { p: 'MACRO_CREDIT_RATING' as BrightSpotPillar, title: 'Kinh tế Vĩ mô, Tín nhiệm & FDI', badge: '🏆 Tín nhiệm Quốc gia & FDI', kws: matchedMacro },
    { p: 'FISCAL_RELIEF' as BrightSpotPillar, title: 'Gói Hỗ trợ Tài khóa Thực chất', badge: '🤝 Miễn giảm thuế & Hỗ trợ DN', kws: matchedRelief },
  ];

  pillarCounts.sort((a, b) => b.kws.length - a.kws.length);
  const bestPillar = pillarCounts[0];

  if (bestPillar && bestPillar.kws.length > 0) {
    pillar = bestPillar.p;
    pillarTitleVi = bestPillar.title;
    pillarBadge = bestPillar.badge;
    matchedPillarKeywords = bestPillar.kws;
  }

  // Điểm liên quan Thẩm quyền MoF / Vĩ mô (0 - 100)
  let mofRelevanceScore = 0;
  if (matchedPillarKeywords.length >= 2) {
    mofRelevanceScore = 90;
  } else if (matchedPillarKeywords.length === 1) {
    mofRelevanceScore = 65;
  } else {
    // Kiểm tra lĩnh vực ngành tài chính cốt lõi
    const isCoreSector = ['tax', 'bonds', 'stocks', 'customs', 'macro', 'policy'].includes(art.sector || '');
    const hasGeneralBrightKw = BRIGHT_SPOT_KEYWORDS.some((kw) => text.includes(kw));
    if (isCoreSector && hasGeneralBrightKw) {
      mofRelevanceScore = 45;
      matchedPillarKeywords = BRIGHT_SPOT_KEYWORDS.filter((kw) => text.includes(kw));
    } else if (isCoreSector) {
      mofRelevanceScore = 25;
    } else {
      mofRelevanceScore = 10;
    }
  }

  // 3. BẰNG CHỨNG ĐỊNH LƯỢNG & MỐC ĐỘT PHÁ THỰC TẾ (ACHIEVEMENT EVIDENCE SCORE)
  const matchedEvidence = ACHIEVEMENT_EVIDENCE_KEYWORDS.filter((kw) => text.includes(kw));
  // Phát hiện số liệu định lượng cụ thể: ví dụ: "vượt 15%", "15,000 tỷ", "2.5 tỷ USD", "kỷ lục"
  const hasSpecificNumbers = /\d+([.,]\d+)?\s*(%|phần trăm|nghìn tỷ|tỷ đồng|triệu usd|tỷ usd)/i.test(text);

  let achievementEvidenceScore = 0;
  if (matchedEvidence.length >= 2 && hasSpecificNumbers) {
    achievementEvidenceScore = 95;
  } else if (matchedEvidence.length >= 2 || (matchedEvidence.length === 1 && hasSpecificNumbers)) {
    achievementEvidenceScore = 80;
  } else if (matchedEvidence.length === 1) {
    achievementEvidenceScore = 55;
  } else if (hasSpecificNumbers && art.sentiment === 'bullish') {
    achievementEvidenceScore = 40;
  } else {
    achievementEvidenceScore = 15;
  }

  // 4. BỘ LỌC TRIỆT TIÊU ĐIỂM SÁNG GIẢ (DAMPENERS)
  const matchedSpeculation = FALSE_BRIGHT_SPOT_SPECULATION_TERMS.filter((term) => text.includes(term));
  const matchedCommercialPr = FALSE_BRIGHT_SPOT_COMMERCIAL_PR_TERMS.filter((term) => text.includes(term));
  const matchedRoutineAdmin = FALSE_BRIGHT_SPOT_ROUTINE_ADMIN_TERMS.filter((term) => text.includes(term));

  const speculationDampenerWeight = matchedSpeculation.length > 0 ? -Math.min(35, matchedSpeculation.length * 15) : 0;
  const commercialPrDampenerWeight = matchedCommercialPr.length > 0 ? -Math.min(45, matchedCommercialPr.length * 20) : 0;
  const routineAdminDampenerWeight = matchedRoutineAdmin.length > 0 ? -Math.min(30, matchedRoutineAdmin.length * 15) : 0;

  // 5. TRỌNG SỐ SẮC THÁI & ĐỊNH HƯỚNG TRUYỀN THÔNG (SENTIMENT & DIRECTIVE BONUS)
  let positiveSentimentWeight = 0;
  if (art.sentiment === 'bullish') positiveSentimentWeight += 15;
  if (art.executiveDirective?.mediaStrategy?.type === 'positive_amplification') positiveSentimentWeight += 15;
  if (POSITIVE_TITLE_TERMS.some((kw) => title.includes(kw))) positiveSentimentWeight += 10;

  const officialSourceBonusWeight = art.isOfficialSource ? 10 : 0;

  // 6. TÍNH ĐIỂM THÀNH TỰU ĐIỂM SÁNG (BRIGHT SPOT SCORE 0 - 100)
  const mofPillarWeight = Math.round(mofRelevanceScore * 0.4);
  const achievementEvidenceWeight = Math.round(achievementEvidenceScore * 0.35);

  const rawScore =
    mofPillarWeight +
    achievementEvidenceWeight +
    positiveSentimentWeight +
    officialSourceBonusWeight +
    speculationDampenerWeight +
    commercialPrDampenerWeight +
    routineAdminDampenerWeight;

  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  // 7. QUY CHUẨN ĐIỀU KIỆN ĐIỂM SÁNG CHẶT CHẼ, SÁT THỰC TẾ
  // Tiêu chí bắt buộc:
  // - Điểm tổng thể >= 52
  // - Phải gắn với 1 trong 6 Trụ cột chiến lược Bộ Tài chính/Vĩ mô (mofRelevanceScore >= 40)
  // - Bắt buộc có bằng chứng định lượng / mốc thành tựu đột phá thực tế đã xảy ra (achievementEvidenceScore >= 40)
  // - Có số liệu định lượng (hasSpecificNumbers) HOẶC văn bản/kết quả chính sách đã ban hành chính thức
  // - Tuyệt đối không dính PR thương mại / mở bán BĐS / khuyến nghị mua bán cổ phiếu (matchedCommercialPr.length === 0)
  // - Không bị chi phối bởi các kỳ vọng/dự phóng tương lai mơ hồ (matchedSpeculation.length <= 1)
  const hasTangibleMetricOrPolicy = hasSpecificNumbers || (matchedEvidence.length >= 1 && matchedPillarKeywords.length >= 1);
  const isSingleStockSpeculation = text.includes('cổ phiếu') && !text.includes('thị trường chứng khoán') && !text.includes('ubcknn') && !text.includes('nâng hạng') && !text.includes('ftse') && matchedCapital.length === 0;

  const isBrightSpot =
    score >= 52 &&
    mofRelevanceScore >= 40 &&
    achievementEvidenceScore >= 40 &&
    hasTangibleMetricOrPolicy &&
    !isSingleStockSpeculation &&
    matchedCommercialPr.length === 0 &&
    matchedSpeculation.length <= 1;

  // 8. TÍNH ĐIỂM TIN CẬY ĐIỂM SÁNG (CONFIDENCE SCORE 0 - 100%)
  let confidenceScore = 0;
  if (isBrightSpot) {
    const baseIntersection = Math.sqrt(mofRelevanceScore * achievementEvidenceScore);
    const bonusNumbers = hasSpecificNumbers ? 12 : 0;
    const bonusOfficial = art.isOfficialSource ? 10 : 0;
    const bonusDirective = art.executiveDirective?.mediaStrategy?.type === 'positive_amplification' ? 8 : 0;
    const penaltySpeculation = matchedSpeculation.length > 0 ? -20 : 0;

    confidenceScore = Math.max(
      0,
      Math.min(100, Math.round(baseIntersection + bonusNumbers + bonusOfficial + bonusDirective + penaltySpeculation))
    );
  } else {
    confidenceScore = Math.min(45, Math.round(score * 0.4));
  }

  const confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' =
    confidenceScore >= 70 ? 'HIGH' : confidenceScore >= 50 ? 'MEDIUM' : 'LOW';
  const isHighConfidenceBrightSpot = isBrightSpot && confidenceScore >= 70;

  // 9. LÝ DO ĐÁNH GIÁ MINH BẠCH CHO LÃNH ĐẠO
  const reasons: string[] = [];
  if (isBrightSpot) {
    reasons.push(`Trụ cột: ${pillarTitleVi} (Điểm thẩm quyền: ${mofRelevanceScore}/100)`);
    if (matchedPillarKeywords.length > 0) {
      reasons.push(`Từ khóa chiến lược: ${matchedPillarKeywords.slice(0, 3).join(', ')}`);
    }
    if (hasSpecificNumbers) {
      reasons.push('Có số liệu định lượng / tỷ lệ tăng trưởng hoặc quy mô vốn cụ thể.');
    }
    if (matchedEvidence.length > 0) {
      reasons.push(`Bằng chứng thành tựu: ${matchedEvidence.slice(0, 3).join(', ')}`);
    }
    if (art.isOfficialSource) {
      reasons.push('Nguồn tin báo chí chính thống / Cổng TTĐT cơ quan quản lý.');
    }
    if (matchedSpeculation.length > 0) {
      reasons.push(`Lưu ý: Có yếu tố dự phóng/triển vọng tương lai (${matchedSpeculation.join(', ')}).`);
    }
  } else {
    if (mofRelevanceScore < 40) reasons.push('Chưa đủ gắn kết với 6 trụ cột chiến lược Bộ Tài chính hoặc kinh tế vĩ mô.');
    if (achievementEvidenceScore < 40) reasons.push('Thiếu số liệu định lượng hoặc mốc thành tựu đột phá xác thực.');
    if (matchedCommercialPr.length > 0) reasons.push('Có dấu hiệu tin tức quảng bá thương mại / cổ phiếu doanh nghiệp tư nhân cá biệt.');
    if (matchedSpeculation.length > 1) reasons.push('Chủ yếu là nhận định phỏng đoán/kỳ vọng tương lai chưa có kết quả thực tế.');
    if (isSingleStockSpeculation) reasons.push('Tin tức biến động giá cổ phiếu đơn lẻ, không mang tính vĩ mô hay cơ chế thị trường.');
    if (reasons.length === 0) reasons.push('Thuộc nhóm thông tin điều hành / chính sách thường nhật, chưa đạt ngưỡng điểm sáng.');
  }

  return {
    score,
    isBrightSpot,
    confidenceScore,
    confidenceLevel,
    isHighConfidenceBrightSpot,
    pillar,
    pillarTitleVi,
    pillarBadge,
    mofRelevanceScore,
    achievementEvidenceScore,
    weights: {
      mofPillarWeight,
      achievementEvidenceWeight,
      positiveSentimentWeight,
      speculationDampenerWeight,
      commercialPrDampenerWeight,
      routineAdminDampenerWeight,
      officialSourceBonusWeight,
    },
    matchedFactors: {
      pillarKeywords: matchedPillarKeywords,
      evidenceKeywords: matchedEvidence,
      speculationKeywords: matchedSpeculation,
      commercialPrKeywords: matchedCommercialPr,
    },
    reasons,
  };
}

/**
 * Kiểm tra xem bài viết có phải là ĐIỂM SÁNG / THÀNH TỰU ĐỘT PHÁ hay không
 * Hỗ trợ tham số lọc Độ tin cậy cao (Confidence Score >= 70%)
 */
export function isBrightSpotArticle(
  art: ScrapedNewsItem,
  optionsOrIndex?: { requireHighConfidence?: boolean; minConfidenceScore?: number } | boolean | number
): boolean {
  if (!art) return false;

  let requireHighConfidence = false;
  let minScore = 70;

  if (typeof optionsOrIndex === 'boolean') {
    requireHighConfidence = optionsOrIndex;
  } else if (typeof optionsOrIndex === 'object' && optionsOrIndex !== null) {
    requireHighConfidence = !!optionsOrIndex.requireHighConfidence;
    if (typeof optionsOrIndex.minConfidenceScore === 'number') {
      minScore = optionsOrIndex.minConfidenceScore;
    }
  }

  const res = calculateBrightSpotScore(art);
  if (!res.isBrightSpot) return false;

  if (requireHighConfidence) {
    return res.confidenceScore >= minScore;
  }
  return true;
}

/**
 * Lấy chi tiết Điểm sáng và Độ tin cậy của bài viết
 */
export function getBrightSpotConfidence(art: ScrapedNewsItem): {
  score: number;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  isHigh: boolean;
  pillar: BrightSpotPillar;
  pillarTitleVi: string;
  pillarBadge: string;
  mofScore: number;
  evidenceScore: number;
  reasons: string[];
} {
  if (!art) {
    return {
      score: 0,
      level: 'LOW',
      isHigh: false,
      pillar: 'GENERAL',
      pillarTitleVi: 'Thành tựu Tài chính',
      pillarBadge: '✨ Điểm sáng',
      mofScore: 0,
      evidenceScore: 0,
      reasons: [],
    };
  }
  const res = calculateBrightSpotScore(art);
  return {
    score: res.confidenceScore,
    level: res.confidenceLevel,
    isHigh: res.isHighConfidenceBrightSpot,
    pillar: res.pillar,
    pillarTitleVi: res.pillarTitleVi,
    pillarBadge: res.pillarBadge,
    mofScore: res.mofRelevanceScore,
    evidenceScore: res.achievementEvidenceScore,
    reasons: res.reasons,
  };
}

/**
 * Kiểm tra xem bài viết có thuộc nhóm HƯỚNG DẪN CHÍNH SÁCH / ĐIỀU HÀNH THƯỜNG NHẬT
 */
export function isPolicyGuidanceArticle(art: ScrapedNewsItem): boolean {
  return !isRiskArticle(art) && !isBrightSpotArticle(art);
}

/**
 * Phân loại bài viết theo 3 trụ cột chiến lược
 */
export function getArticleClassification(art: ScrapedNewsItem): 'RISK' | 'BRIGHT_SPOT' | 'POLICY_GUIDANCE' {
  if (isRiskArticle(art)) return 'RISK';
  if (isBrightSpotArticle(art)) return 'BRIGHT_SPOT';
  return 'POLICY_GUIDANCE';
}

/**
 * Interface cho Tin Đáng Chú Ý Nhất (Thay thế Cảnh báo khẩn khi không có nguy cơ)
 */
export interface NotableArticleItem extends ScrapedNewsItem {
  notableReason: string;
  isNotable: boolean;
  notablePriority: number;
}

/**
 * Nguồn báo chí chính thống uy tín ưu tiên cao
 */
const TIER1_OFFICIAL_SOURCES = [
  'thời báo tài chính', 'thời báo tài chính việt nam', 'tb tài chính', 'bộ tài chính',
  'báo nhân dân', 'cổng thông tin điện tử chính phủ', 'chính phủ', 'ttxvn', 'vietnamplus',
  'báo đầu tư', 'vneconomy', 'vietnamnet', 'tuổi trẻ', 'thanh niên', 'lao động', 'tiền phong'
];

/**
 * Tuyển chọn các Tin Đáng Chú Ý Nhất (CHUẨN XÁC)
 * Áp dụng khi chưa có tin cảnh báo khẩn cấp theo yêu cầu Lãnh đạo.
 *
 * Tiêu chí chuẩn mực:
 * 1. Ưu tiên 1: Chỉ đạo điều hành vĩ mô trọng tâm của Lãnh đạo Bộ Tài chính / Chính phủ
 * 2. Ưu tiên 2: Điểm sáng thành tựu tài chính có số liệu định lượng tin cậy cao
 * 3. Ưu tiên 3: Bài viết từ nguồn báo chính thống có điểm tác động & gắn kết MoF cao nhất
 * 4. Loại bỏ các bài viết rung lắc điểm số, tin đồn, bài viết mua bán cổ phiếu ngắn hạn
 */
export function getTopNotableArticles(articles: ScrapedNewsItem[], limit = 3): NotableArticleItem[] {
  if (!articles || articles.length === 0) return [];

  const candidates: NotableArticleItem[] = [];

  for (const art of articles) {
    if (!art.title || art.title.length < 10) continue;

    const titleLower = art.title.toLowerCase();
    const summaryLower = (art.summary || art.snippet || '').toLowerCase();
    const fullText = `${titleLower} ${summaryLower}`;
    const sourceLower = (art.source || '').toLowerCase();

    // Loại bỏ các bài viết rung lắc điểm số thuần túy hoặc khuyến nghị mua bán
    const isPureStockNoise = /khuyến nghị cổ phiếu|mã cổ phiếu|khối ngoại xả hàng|rung lắc vài điểm|giá vàng nhẫn hôm nay/i.test(titleLower);
    if (isPureStockNoise) continue;

    // Kiểm tra tính chính thống của nguồn báo
    const isOfficialSource = TIER1_OFFICIAL_SOURCES.some(src => sourceLower.includes(src));

    // Đánh giá các cấp bậc tin đáng chú ý:
    let priority = 999;
    let reason = 'Điểm tin kinh tế - tài chính đáng chú ý trong phiên';

    // Cấp 1: Chỉ đạo điều hành của Lãnh đạo Bộ Tài chính / Chính phủ về tài khóa, ngân sách, hải quan, thuế, đầu tư công
    const hasMinistryLeadership = /bộ trưởng|thứ trưởng|bộ tài chính chỉ đạo|lãnh đạo bộ tài chính|chính phủ ban hành nghị định|nghị định|thông tư|chỉ thị số|hoàn thiện thể chế tài chính/i.test(titleLower);
    if (hasMinistryLeadership) {
      priority = 1;
      reason = 'Chỉ đạo điều hành trọng tâm của Lãnh đạo Bộ Tài chính & Chính phủ';
    } else if (/tháo gỡ khó khăn cho doanh nghiệp|gỡ vướng thủ tục|đẩy mạnh giải ngân vốn đầu tư công|thúc đẩy tăng trưởng kinh tế/i.test(titleLower)) {
      priority = 2;
      reason = 'Chính sách tháo gỡ khó khăn và thúc đẩy tăng trưởng kinh tế';
    } else {
      // Cấp 2: Điểm sáng đột phá có độ tin cậy cao
      const bsInfo = calculateBrightSpotScore(art);
      if (bsInfo.isHighConfidenceBrightSpot) {
        priority = 3;
        reason = `${bsInfo.pillarTitleVi || 'Điểm sáng'} - Độ tin cậy cao (${bsInfo.confidenceScore}%)`;
      } else if (art.isBrightSpot) {
        priority = 4;
        reason = 'Thành tựu và điểm sáng tài chính vĩ mô nổi bật';
      } else {
        // Cấp 3: Bài viết có điểm gắn kết MoF và tác động cao từ nguồn chính thống
        const mofScore = bsInfo.mofRelevanceScore;
        if (mofScore >= 50 && (art.impactScore || 0) >= 65) {
          priority = 5;
          reason = 'Diễn biến tài khóa & thị trường tài chính có tác động diện rộng';
        } else if (isOfficialSource && (art.impactScore || 0) >= 70) {
          priority = 6;
          reason = 'Thông tin chính thống từ cơ quan báo chí uy tín';
        }
      }
    }

    if (priority <= 6) {
      // Điểm cộng dồn sắp xếp: ưu tiên priority thấp nhất, sau đó đến impactScore và thời gian
      candidates.push({
        ...art,
        notableReason: reason,
        isNotable: true,
        notablePriority: priority,
      });
    }
  }

  // Sắp xếp theo thứ tự ưu tiên chất lượng chuẩn xác
  candidates.sort((a, b) => {
    if (a.notablePriority !== b.notablePriority) {
      return a.notablePriority - b.notablePriority;
    }
    const impactA = a.impactScore || 50;
    const impactB = b.impactScore || 50;
    if (impactA !== impactB) {
      return impactB - impactA;
    }
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  if (candidates.length > 0) {
    return candidates.slice(0, limit);
  }

  // Dự phòng an toàn: nếu không lọc được bài nào theo tiêu chí gắt gao trên,
  // chọn bài viết đầu tiên từ nguồn uy tín có impact cao nhất
  const fallback = articles
    .filter(a => a.title && a.title.length > 15)
    .sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0))
    .slice(0, limit)
    .map(a => ({
      ...a,
      notableReason: 'Tin tức kinh tế - tài chính đáng chú ý trong phiên',
      isNotable: true,
      notablePriority: 10,
    }));

  return fallback;
}

/**
 * Lấy duy nhất 1 Tin Đáng Chú Ý Nhất chuẩn xác
 */
export function getMostNotableArticle(articles: ScrapedNewsItem[]): NotableArticleItem | null {
  const list = getTopNotableArticles(articles, 1);
  return list.length > 0 ? list[0] : null;
}

/**
 * ĐÁNH GIÁ SẮC THÁI CHUYÊN NGÀNH TÀI CHÍNH (LOUGHRAN-MCDONALD FINANCE SENTIMENT MODEL)
 * Tuân thủ chuẩn mực phân tích sắc thái chuyên sâu dành riêng cho Bộ Tài chính:
 * - Thang điểm chuyên biệt S in [-5, +5]
 * - 4 Tầng phân tích:
 *   1. Chủ thể phát ngôn (The Voice Source)
 *   2. Trọng số thực thể mục tiêu (Target Entity Weight E: 1..4)
 *   3. Ngữ cảnh sự kiện (Event Context Taxonomy)
 *   4. Hệ số xung lực lan truyền (Velocity Vector V: 1.0..1.25)
 * - Công thức Rủi ro Thể chế Sắc thái: Risk_Sentiment = min(100, |S_neg| * E * V * 4)
 * - Tóm tắt điều hành 1 câu ngắn gọn, chuẩn xác cho Lãnh đạo
 */
export function evaluateLoughranMcDonaldSentiment(art: ScrapedNewsItem): LoughranMcDonaldSentimentAnalysis {
  if (!art) {
    return {
      scoreS: 0,
      scoreLabel: '0: Trung tính',
      voiceSource: {
        sourceType: 'PUBLIC_OPINION',
        sourceTypeLabelVi: 'Thông tin chung',
        isEnforcementOrGovernance: false,
      },
      targetEntity: {
        entityLevel: 'LOCAL_TAXPAYER_CASE',
        weightE: 1,
        entityNameVi: 'Chưa xác định',
      },
      eventContext: {
        category: 'MACRO_STABILITY',
        categoryLabelVi: 'Vĩ mô chung',
        contextSummary: 'Không có dữ liệu bài viết',
      },
      velocityVector: {
        V: 1.0,
        velocityStatusLabel: 'Bình thường',
      },
      sentimentRiskImpact: 0,
      executiveBrief: 'Không phát hiện rủi ro sắc thái.',
    };
  }

  const title = (art.title || '').toLowerCase();
  const summary = (art.summary || art.snippet || '').toLowerCase();
  const fullText = `${title} ${summary}`;

  // 1. TẦNG 1: CHỦ THỂ PHÁT NGÔN (THE VOICE SOURCE)
  let voiceSourceType: LoughranMcDonaldSentimentAnalysis['voiceSource']['sourceType'] = 'PUBLIC_OPINION';
  let voiceSourceLabelVi = 'Dư luận & Báo chí đại chúng';
  let isEnforcementOrGovernance = false;

  const isGovSource = /chính phủ|thủ tướng|phó thủ tướng|bộ tài chính|bộ trưởng|thứ trưởng|tổng cục thuế|tổng cục hải quan|ubcknn|kho bạc nhà nước/i.test(fullText) || art.isOfficialSource;
  const isBizSource = /hiệp hội|vcci|doanh nghiệp kiến nghị|hội đồng kinh doanh|đại diện doanh nghiệp|cộng đồng doanh nghiệp|nộp đơn kiến nghị/i.test(fullText);
  const isExpertSource = /chuyên gia|viện nghiên cứu|ts\.|pgs\.|kinh tế gia|bình luận viên kinh tế|đánh giá kinh tế/i.test(fullText);

  if (isGovSource) {
    voiceSourceType = 'GOVERNMENT_DIRECTIVE';
    voiceSourceLabelVi = 'Cơ quan Quản lý Nhà nước (Kỷ cương & Điều hành)';
    isEnforcementOrGovernance = true;
  } else if (isBizSource) {
    voiceSourceType = 'BUSINESS_ASSOCIATION';
    voiceSourceLabelVi = 'Hiệp hội Ngành nghề & Cộng đồng Doanh nghiệp';
  } else if (isExpertSource) {
    voiceSourceType = 'EXPERT_ANALYSIS';
    voiceSourceLabelVi = 'Chuyên gia & Học giả Độc lập';
  }

  // 2. TẦNG 2: TRỌNG SỐ THỰC THỂ MỤC TIÊU (TARGET ENTITY WEIGHT E: 1..4)
  let entityLevel: LoughranMcDonaldSentimentAnalysis['targetEntity']['entityLevel'] = 'LOCAL_TAXPAYER_CASE';
  let weightE = 1;
  let entityNameVi = 'Chi cục cơ sở / Người nộp thuế sự vụ nhỏ lẻ';

  if (/bộ trưởng|thứ trưởng|ban cán sự đảng bộ tài chính|lãnh đạo bộ tài chính/i.test(fullText)) {
    entityLevel = 'MINISTRY_LEADERSHIP';
    weightE = 4;
    entityNameVi = 'Lãnh đạo Bộ Tài chính (Trọng số E = 4)';
  } else if (/tổng cục thuế|tổng cục hải quan|ủy ban chứng khoán nhà nước|ubcknn|kho bạc nhà nước|cục quản lý nợ/i.test(fullText)) {
    entityLevel = 'GENERAL_DEPARTMENT';
    weightE = 3;
    entityNameVi = 'Các Tổng cục & Cơ quan trực thuộc Bộ (Trọng số E = 3)';
  } else if (/cục thuế|cục hải quan|vụ pháp chế|vụ ngân sách|sở tài chính/i.test(fullText)) {
    entityLevel = 'DEPARTMENT_BUREAU';
    weightE = 2;
    entityNameVi = 'Cục / Vụ chuyên môn (Trọng số E = 2)';
  }

  // 3. TẦNG 3: NGỮ CẢNH SỰ KIỆN (EVENT CONTEXT TAXONOMY)
  let eventCategory: LoughranMcDonaldSentimentAnalysis['eventContext']['category'] = 'MACRO_STABILITY';
  let categoryLabelVi = 'Ổn định Vĩ mô & Thông tin Thường quy';
  let contextSummary = 'Diễn biến tài chính - tiền tệ bình thường.';

  const hasAcuteIncident = /khởi tố cán bộ|bắt tạm giam cán bộ|nhận hối lộ|đại án tham nhũng|vụ án xuyên việt oil|bị can đặng công khôi|tiếp tay buôn lậu/i.test(fullText);
  const isRoutineEnforce = isRoutineEnforcementOrSocialConsensus(fullText) || isRoutineLegalPromulgationOrGovernance(fullText);
  const isPolicyFriction = /vướng mắc thủ tục|phản ứng chính sách|bất cập thông tư|áp lực nợ đọng|nghẽn giải ngân|chậm hoàn thuế|độ vênh/i.test(fullText);
  const isSupportive = /miễn giảm thuế|giảm 2% vat|gia hạn thuế|tháo gỡ khó khăn|gỡ vướng cho doanh nghiệp|khơi thông nguồn vốn|hỗ trợ lãi suất/i.test(fullText);

  if (hasAcuteIncident) {
    eventCategory = 'CRITICAL_CRISIS';
    categoryLabelVi = 'Sự cố Sai phạm / Khủng hoảng Cấp bách';
    contextSummary = 'Phát hiện dấu hiệu trách nhiệm hình sự hoặc sai phạm kỷ luật nghiêm trọng.';
  } else if (isPolicyFriction) {
    eventCategory = 'POLICY_FRICTION_PETITION';
    categoryLabelVi = 'Vướng mắc Thủ tục & Phản ứng Thể chế';
    contextSummary = 'Dư luận và hiệp hội doanh nghiệp phản ánh điểm nghẽn thủ tục hoặc độ vênh chính sách.';
  } else if (isSupportive) {
    eventCategory = 'SUPPORTIVE_POLICY';
    categoryLabelVi = 'Chính sách Hỗ trợ & Khơi thông Dòng tiền';
    contextSummary = 'Ban hành chính sách tài khóa kiến tạo, hỗ trợ tăng trưởng và giảm áp lực tài chính.';
  } else if (isRoutineEnforce) {
    eventCategory = 'ROUTINE_ENFORCEMENT';
    categoryLabelVi = 'Nghiệp vụ Cưỡng chế Định kỳ & Thể chế Thường quy';
    contextSummary = 'Thực thi quy định pháp luật hoặc công bố văn bản theo thẩm quyền, xã hội đồng thuận.';
  }

  // 4. TẦNG 4: HỆ SỐ XUNG LỰC LAN TRUYỀN (VELOCITY VECTOR V: 1.0..1.25)
  const isHighVelocity = art.velocityStatus === 'spike' || (art.buzzScore || 0) >= 80 || art.isEmergency;
  const velocityV = isHighVelocity ? 1.25 : 1.0;
  const velocityLabel = isHighVelocity ? 'Xung lực mạnh (V = 1.25 - Lan truyền nhanh/Spike)' : 'Xung lực ổn định (V = 1.0 - Báo chí chuẩn tắc)';

  // 5. TÍNH ĐIỂM SẮC THÁI S in [-5, +5]
  let scoreS = 0;
  let scoreLabel = '0: Trung tính';

  if (eventCategory === 'CRITICAL_CRISIS') {
    scoreS = -5;
    scoreLabel = '-5: Khủng hoảng sai phạm nghiêm trọng';
  } else if (eventCategory === 'POLICY_FRICTION_PETITION') {
    if (weightE >= 3 || fullText.includes('độ vênh')) {
      scoreS = -4;
      scoreLabel = '-4: Phản ứng thể chế sâu & Nguy cơ độ vênh thực tiễn';
    } else {
      scoreS = -2;
      scoreLabel = '-2: Vướng mắc thủ tục cơ sở / Phản ánh kỹ thuật đơn lẻ';
    }
  } else if (eventCategory === 'SUPPORTIVE_POLICY') {
    if (/miễn giảm lớn|giải ngân vượt tiến độ|kỷ lục|bứt phá/i.test(fullText)) {
      scoreS = +5;
      scoreLabel = '+5: Chính sách đại lợi ích & Khơi thông động lực vĩ mô';
    } else {
      scoreS = +3;
      scoreLabel = '+3: Kỷ cương tích cực & Hỗ trợ doanh nghiệp thực chất';
    }
  } else if (eventCategory === 'ROUTINE_ENFORCEMENT') {
    scoreS = +1;
    scoreLabel = '+1: Thực thi kỷ cương pháp luật thường quy (Đồng thuận cao)';
  } else {
    // Sắc thái theo art.sentiment
    if (art.sentiment === 'bullish') {
      scoreS = +2;
      scoreLabel = '+2: Thông tin tài chính khả quan';
    } else if (art.sentiment === 'bearish') {
      scoreS = -2;
      scoreLabel = '-2: Áp lực thị trường thông thường';
    } else {
      scoreS = 0;
      scoreLabel = '0: Trung tính / Thông báo quản trị';
    }
  }

  // 6. TÍNH ĐIỂM RỦI RO THỂ CHẾ TỪ SẮC THÁI (Risk Sentiment)
  const negativeMagnitude = scoreS < 0 ? Math.abs(scoreS) : 0;
  const sentimentRiskImpact = Math.min(100, Math.round(negativeMagnitude * weightE * velocityV * 4));

  // 7. EXECUTIVE BRIEF: Tóm tắt 1 câu dành cho Lãnh đạo
  let executiveBrief = '';
  if (scoreS <= -4) {
    executiveBrief = `Cảnh báo phản ứng thể chế nhắm vào ${entityNameVi}: Cần rà soát ngay quy trình thực tế và chủ động định hướng dư luận.`;
  } else if (scoreS < 0) {
    executiveBrief = `Ghi nhận ý kiến phản ánh vướng mắc tại ${entityNameVi}: Tham mưu theo dõi sát để kịp thời tháo gỡ điểm nghẽn.`;
  } else if (scoreS >= 3) {
    executiveBrief = `Điểm sáng chỉ đạo điều hành tại ${entityNameVi}: Tác động tích cực đến niềm tin thị trường và cộng đồng doanh nghiệp.`;
  } else {
    executiveBrief = `Thông tin quản trị và vận hành thị trường ổn định, không phát sinh điểm nghẽn truyền thông đối với ${entityNameVi}.`;
  }

  return {
    scoreS,
    scoreLabel,
    voiceSource: {
      sourceType: voiceSourceType,
      sourceTypeLabelVi: voiceSourceLabelVi,
      isEnforcementOrGovernance,
    },
    targetEntity: {
      entityLevel,
      weightE,
      entityNameVi,
    },
    eventContext: {
      category: eventCategory,
      categoryLabelVi,
      contextSummary,
    },
    velocityVector: {
      V: velocityV,
      velocityStatusLabel: velocityLabel,
    },
    sentimentRiskImpact,
    executiveBrief,
  };
}

/**
 * HỆ THỐNG PROMPT ĐIỀU HÀNH CHUYÊN SÂU DÀNH CHO GEMINI 3.8 FLASH
 * Áp dụng khung phân tích sắc thái chuyên sâu ngành Tài chính (Loughran-McDonald Adaptation):
 * - Phân loại 4 Tầng: Chủ thể phát ngôn, Trọng số thực thể mục tiêu E (1..4), Ngữ cảnh sự kiện, Hệ số xung lực V (1.0..1.25)
 * - Định lượng thang điểm S in [-5, +5]
 * - Lọc bỏ sai lệch: Hoạt động thanh tra, xử lý sai phạm, cưỡng chế nợ đọng là kỷ cương quản lý nhà nước, KHÔNG gán nhãn tiêu cực sai lệch.
 * - Đầu ra súc tích (minimalist), chính xác ngữ cảnh chính trị/kinh tế cho Lãnh đạo cấp cao.
 */
export function buildLoughranMcDonaldPromptForGemini(article: Partial<ScrapedNewsItem>): string {
  const title = article.title || '';
  const summary = article.summary || article.snippet || '';
  const sector = article.sectorNameVi || article.sector || 'Tài chính - Ngân sách';
  const source = article.source || 'Báo chí chính thống';

  return `Bạn là Chuyên gia Cao cấp về Phân tích Dư luận & Sắc thái Kinh tế - Tài chính (Bộ Tài chính Việt Nam).
Mô hình AI: Gemini 3.8 Flash.

NHIỆM VỤ:
Phân tích sắc thái chuyên ngành bài viết theo Khung Phân Tích Sắc Thái Tài Chính (Loughran-McDonald Adaptation):
1. Tầng 1: Chủ thể phát ngôn (The Voice Source) - Phân định rõ Cơ quan quản lý, Hiệp hội doanh nghiệp, Chuyên gia hay Dư luận.
2. Tầng 2: Trọng số thực thể mục tiêu (Target Entity Weight E): Lãnh đạo Bộ (E=4), Tổng cục/UBCKNN/KBNN (E=3), Cục/Vụ (E=2), Cơ sở/Doanh nghiệp (E=1).
3. Tầng 3: Ngữ cảnh sự kiện (Event Context Taxonomy) - Phân biệt rõ chính sách hỗ trợ (+), thực thi kỷ cương pháp luật thường quy (+1, đồng thuận cao), phản ứng thể chế/độ vênh (-2 đến -4), hoặc khủng hoảng sai phạm nghiêm trọng (-5).
4. Tầng 4: Hệ số xung lực lan truyền (Velocity Vector V: 1.0 đến 1.25).
5. Thang điểm sắc thái S thuộc phạm vi [-5, +5].
6. Tóm tắt điều hành (Executive Brief) đúng 1 câu ngắn gọn, chuẩn xác ngữ cảnh chính trị - kinh tế cho Lãnh đạo cấp cao.

DỮ LIỆU BÀI VIẾT:
- Tiêu đề: "${title}"
- Nguồn tin: ${source}
- Lĩnh vực: ${sector}
- Tóm tắt: ${summary}

YÊU CẦU ĐẦU RA JSON DUY NHẤT:
{
  "scoreS": <số nguyên từ -5 đến 5>,
  "scoreLabel": "<nhãn thang điểm ngắn>",
  "voiceSource": {
    "sourceType": "GOVERNMENT_DIRECTIVE" | "BUSINESS_ASSOCIATION" | "EXPERT_ANALYSIS" | "PUBLIC_OPINION",
    "sourceTypeLabelVi": "<Mô tả chủ thể>",
    "isEnforcementOrGovernance": <true/false>
  },
  "targetEntity": {
    "entityLevel": "MINISTRY_LEADERSHIP" | "GENERAL_DEPARTMENT" | "DEPARTMENT_BUREAU" | "LOCAL_TAXPAYER_CASE",
    "weightE": <1..4>,
    "entityNameVi": "<Tên thực thể>"
  },
  "eventContext": {
    "category": "SUPPORTIVE_POLICY" | "MACRO_STABILITY" | "ROUTINE_ENFORCEMENT" | "POLICY_FRICTION_PETITION" | "CRITICAL_CRISIS",
    "categoryLabelVi": "<Nhãn ngữ cảnh>",
    "contextSummary": "<Tóm tắt 1 câu ngữ cảnh>"
  },
  "velocityVector": {
    "V": <1.0 hoặc 1.25>,
    "velocityStatusLabel": "<Nhãn xung lực>"
  },
  "sentimentRiskImpact": <0..100>,
  "executiveBrief": "<1 câu súc tích tóm tắt tình hình & định hướng cho Lãnh đạo>"
}`;
}
