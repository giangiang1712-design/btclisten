import {
  ScrapedNewsItem,
  WarningPipelineModel,
  WarningLevel1Sentiment,
  WarningLevel2Risk,
  WarningLevel3Action,
  WarningPlaybookPhase,
  WarningPipelineStageItem,
  WarningAlertLevelType,
  InformationVacuumAssessment,
  InformationGapLevelType,
  SectorType,
  DirectiveActionType,
  SECTOR_NAMES,
  StandardizedWarningSystemOutput,
  formatNewsFullDateTime,
  resolveAgencyByDecree376
} from '../types';
import { PressSeverityAlgorithmEngine } from './pressSeverityEngine';
import { PressDivergenceAlgorithmEngine } from './pressDivergenceEngine';
import { PressVelocityAlgorithmEngine } from './pressVelocityEngine';
import { PressImpactAlgorithmEngine } from './pressImpactEngine';
import { SeverityAlgorithmEngine } from './severityEngine';
import { assignDepartmentWorkflow } from './departmentAssignmentEngine';
import { Decree376ClassificationEngine, Decree376ClassificationResult } from './decree376ClassificationEngine';
import { DECREE_376_100_SCENARIOS, Decree376ScenarioItem } from './decree376Handbook100Scenarios';

/**
 * Danh mục các kịch bản Bối cảnh & Tín hiệu trọng điểm (Context Rules)
 * Giúp bóc tách các bài viết có tiêu đề trung tính/thông thường nhưng ẩn chứa rủi ro chính sách,
 * gánh nặng doanh nghiệp, vướng mắc giải ngân hoặc công nghệ mới (AI chứng khoán, thuế tối thiểu toàn cầu, tài sản số...).
 */
interface ContextPattern {
  id: string;
  keywords: string[];
  contextTheme: string;
  underlyingRisk: string;
  velocityRiskProfile: string;
  impactDomain: string;
  escalationTrigger: string;
  defaultAlertLevel: WarningAlertLevelType;
  reputationRiskLevel: number; // 0 - 100
  blameRiskLevel: number;
  petitionRiskLevel: number;
  investorBizImpactLevel: number;
  samplePetitions: string[];
  leadUnit: string;
  cooperatingUnits: string[];
  playbook: { phase: string; actions: string[] }[];
}

/**
 * Kiểm tra xem bài viết có thuộc diện Ban hành Thể chế, Lệnh của Chủ tịch nước, Công bố Luật,
 * Đề xuất bổ sung thẩm quyền / chức năng quản lý nhà nước hoặc hoạt động quản lý điều hành thường quy của Nhà nước / Bộ Tài chính hay không.
 * (Giúp ngăn chặn tuyệt đối việc xếp nhầm các tin tức này vào mục Khẩn cấp)
 */
export function isRoutineLegalPromulgationOrGovernance(text: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase();

  // 1. Nhận diện Đề xuất Bổ sung Thẩm quyền, Chức năng của Bộ Tài chính (Khởi tố/điều tra án thuế, sở hữu trí tuệ, dự thảo luật)
  const isMinistryAuthorityProposal = 
    /đề xuất (bổ sung thẩm quyền|thêm thẩm quyền|thẩm quyền khởi tố|quyền khởi tố|chức năng điều tra|thẩm quyền điều tra)/i.test(t) ||
    /thẩm quyền khởi tố (một số vụ án|vụ án liên quan đến thuế|vụ án thuế|thuế|sở hữu trí tuệ|hàng giả)/i.test(t) ||
    /bổ sung thẩm quyền (khởi tố|điều tra|xử lý)/i.test(t) ||
    /bộ tài chính đề xuất (bổ sung thẩm quyền|thêm thẩm quyền|thẩm quyền|khởi tố|điều tra|sửa đổi|hoàn thiện)/i.test(t) ||
    ((t.includes('bộ tài chính') || t.includes('ngành thuế') || t.includes('hải quan')) &&
     t.includes('thẩm quyền') &&
     (t.includes('khởi tố') || t.includes('điều tra')) &&
     (t.includes('đề xuất') || t.includes('kiến nghị') || t.includes('dự thảo') || t.includes('bổ sung')));

  if (isMinistryAuthorityProposal) return true;

  // 2. Công bố Lệnh của Chủ tịch nước, Ban hành luật, Công bố luật
  const isPromulgation = 
    /công bố lệnh của chủ tịch nước|lệnh của chủ tịch nước|chủ tịch nước công bố lệnh|chủ tịch nước ký lệnh|lệnh của chủ tịch nước về việc công bố|chủ tịch nước ban hành lệnh|quốc hội thông qua luật|công bố luật|luật sửa đổi, bổ sung một số điều của luật|nghị định quy định chi tiết thi hành|thông tư hướng dẫn thi hành|nghị quyết của ủy ban thường vụ quốc hội/i.test(t);

  // 3. Các văn bản luật trọng điểm trong bối cảnh ban hành, hiệu lực, hoàn thiện khung thể chế
  const isStatutoryContext = 
    (t.includes('luật phòng, chống rửa tiền') || t.includes('luật phòng chống rửa tiền') || 
     t.includes('luật các tổ chức tín dụng') || t.includes('luật ngân hàng nhà nước') || 
     t.includes('luật quản lý thuế') || t.includes('luật chứng khoán') || 
     t.includes('luật giá') || t.includes('luật ngân sách nhà nước') || 
     t.includes('luật thuế giá trị gia tăng') || t.includes('luật thuế thu nhập doanh nghiệp')) &&
    (t.includes('công bố') || t.includes('ban hành') || t.includes('lệnh của chủ tịch nước') || 
     t.includes('sửa đổi, bổ sung') || t.includes('nghị quyết') || t.includes('kế hoạch triển khai') || 
     t.includes('hiệu lực thi hành') || t.includes('triển khai thi hành') || t.includes('phổ biến pháp luật'));

  // 4. Hoạt động quản trị điều hành hành chính thường quy định kỳ
  const isRoutineAdmin = 
    /hội nghị triển khai nhiệm vụ|hội nghị thường kỳ|giao ban công tác|tổng kết công tác năm|kế hoạch công tác năm|phổ biến quán triệt|tập huấn nghiệp vụ|công bố thủ tục hành chính mới/i.test(t);

  // 5. Chỉ đạo, nỗ lực và kết quả điều hành tích cực tại địa phương (Giải ngân đầu tư công, thu ngân sách, tiến độ dự án)
  // 5. Chỉ đạo, nỗ lực và kết quả điều hành tích cực tại địa phương (Giải ngân đầu tư công, thu ngân sách, tiến độ dự án, khơi thông nguồn lực đầu tư)
  // Ví dụ: "Cần Thơ ưu tiên hiệu quả đầu tư, khơi thông nguồn lực cho tăng trưởng"
  const isPositiveLocalGovernance = 
    // Mẫu 1: Giải ngân đầu tư công và tiến độ dự án
    (((t.includes('giải ngân') || t.includes('đầu tư công') || t.includes('vốn đầu tư') || t.includes('tiến độ')) &&
      (t.includes('đẩy nhanh') || t.includes('tăng tốc') || t.includes('nỗ lực') || t.includes('quyết tâm') || 
       t.includes('những tháng cuối năm') || t.includes('cuối năm') || t.includes('phấn đấu') || t.includes('tập trung') || 
       t.includes('đôn đốc') || t.includes('chủ động') || t.includes('khởi sắc') || t.includes('tích cực') || 
       t.includes('triển khai') || t.includes('điểm sáng') || t.includes('tháo gỡ khó khăn') || t.includes('hoàn thành kế hoạch'))) ||
     // Mẫu 2: Phát triển kinh tế & khơi thông nguồn lực đầu tư tại các địa phương (Cần Thơ, Hà Nội, TP.HCM...)
     (/cần thơ|hà nội|tp\.hcm|thành phố hồ chí minh|đà nẵng|hải phòng|quảng ninh|bình dương|đồng nai|bà rịa|vũng tàu|địa phương|các tỉnh/i.test(t) &&
      (t.includes('ưu tiên hiệu quả đầu tư') || t.includes('khơi thông nguồn lực') || t.includes('nguồn lực cho tăng trưởng') ||
       t.includes('hiệu quả đầu tư') || t.includes('động lực tăng trưởng') || t.includes('tạo đà tăng trưởng') ||
       t.includes('thu hút nguồn lực') || t.includes('tập trung nguồn lực') || t.includes('thúc đẩy đầu tư'))) ||
     // Mẫu 3: Cụm từ chuyên biệt về tối ưu hóa và khơi thông nguồn lực
     /khơi thông nguồn lực|ưu tiên hiệu quả đầu tư|nguồn lực cho tăng trưởng|tạo động lực tăng trưởng bền vững/i.test(t));

  // 6. Kết quả thu ngân sách, tài chính doanh nghiệp tích cực
  const isPositiveFiscalAchievement = 
    /thu ngân sách đạt|vượt dự toán thu|tăng trưởng thu ngân sách|kết quả thu ngân sách tích cực|tuyên dương người nộp thuế|đồng hành cùng doanh nghiệp/i.test(t);

  // 6b. Động lực tăng trưởng vĩ mô, tận dụng thời cơ và mục tiêu thu ngân sách nhà nước tích cực
  // Ví dụ: "Tận dụng thời gian vàng cho mục tiêu tăng trưởng và thu ngân sách", "Động lực tăng trưởng GDP", "Thúc đẩy mục tiêu tài khóa"
  const isMacroGrowthAndFiscalOpportunity =
    (/tận dụng thời gian vàng|thời gian vàng cho mục tiêu tăng trưởng|mục tiêu tăng trưởng và thu ngân sách|động lực tăng trưởng kinh tế|kịch bản tăng trưởng gdp|thúc đẩy tăng trưởng và thu ngân sách|tận dụng cơ hội tăng trưởng|hoàn thành mục tiêu thu ngân sách|nỗ lực đạt mục tiêu tăng trưởng|động lực cho tăng trưởng và thu ngân sách/i.test(t) ||
     ((t.includes('mục tiêu tăng trưởng') || t.includes('tăng trưởng kinh tế') || t.includes('tăng trưởng gdp') || t.includes('thời gian vàng')) &&
      (t.includes('thu ngân sách') || t.includes('tài khóa') || t.includes('động lực') || t.includes('cơ hội')))) &&
    !/thất thu|thất thoát|chậm trễ|ách tắc|kêu cứu|sai phạm|khiếu nại|khởi tố/i.test(t);

  // 7. Phát biểu chỉ đạo, quán triệt trách nhiệm và đôn đốc công tác thường quy của Lãnh đạo (Bộ trưởng, Thứ trưởng, Thủ tướng...)
  // Ví dụ: "Bộ trưởng Trần Hồng Minh: Không buông lỏng trách nhiệm trong giải ngân vốn đầu tư công"
  // Dù có từ như "buông lỏng" nhưng đặt trong ngữ cảnh phủ định "không buông lỏng" hoặc phát biểu đôn đốc, đây là hoạt động điều hành thường quy, không phải khủng hoảng truyền thông.
  const isRoutineLeadershipDirective =
    ((t.includes('bộ trưởng') || t.includes('thứ trưởng') || t.includes('thủ tướng') || t.includes('phó thủ tướng') || t.includes('lãnh đạo bộ')) &&
     (t.includes('không buông lỏng') || t.includes('trách nhiệm trong giải ngân') || t.includes('nêu cao trách nhiệm') ||
      t.includes('siết chặt kỷ luật') || t.includes('siết chặt kỷ cương') || t.includes('đôn đốc giải ngân') ||
      t.includes('gắn trách nhiệm') || t.includes('quyết liệt giải ngân') || t.includes('chỉ đạo giải ngân') ||
      t.includes('chỉ đạo:') || t.includes('yêu cầu:') || t.includes('nhấn mạnh:') ||
      (t.includes('giải ngân') && (t.includes('chỉ đạo') || t.includes('yêu cầu') || t.includes('đôn đốc') || t.includes('trách nhiệm'))))) ||
    /không buông lỏng (trách nhiệm|quản lý|giám sát|điều hành)|kiên quyết không buông lỏng|không được buông lỏng|không để xảy ra buông lỏng/i.test(t) ||
    /trách nhiệm trong giải ngân vốn|trách nhiệm giải ngân vốn đầu tư công|đôn đốc giải ngân vốn đầu tư công|siết chặt kỷ luật, kỷ cương trong giải ngân/i.test(t);

  // 8. Phân định nhiệm vụ, tinh gọn bộ máy và phân công thẩm quyền quản lý nhà nước thường quy
  // Ví dụ: "Từ tháng 12/2026: Bỏ trách nhiệm của Bộ Tài chính trong kiểm tra nghiệp vụ in, đúc, tiêu hủy tiền"
  // Đây là văn bản pháp luật tinh gọn bộ máy và phân định chức năng giữa Bộ Tài chính và Ngân hàng Nhà nước
  const isInstitutionalDelegationOrMachineryStreamlining = 
    /bỏ trách nhiệm (của )?bộ tài chính trong kiểm tra/i.test(t) ||
    /kiểm tra nghiệp vụ in,?\s*đúc,?\s*tiêu hủy tiền/i.test(t) ||
    /nghiệp vụ in,?\s*đúc,?\s*tiêu hủy tiền/i.test(t) ||
    /in,?\s*đúc,?\s*tiêu hủy tiền/i.test(t) ||
    /bỏ trách nhiệm.*kiểm tra nghiệp vụ/i.test(t) ||
    /bãi bỏ (nhiệm vụ|trách nhiệm) kiểm tra/i.test(t) ||
    /phân định (lại )?(thẩm quyền|chức năng|nhiệm vụ|trách nhiệm) giữa/i.test(t) ||
    /điều chỉnh (chức năng|nhiệm vụ|thẩm quyền) của bộ/i.test(t) ||
    /tinh gọn bộ máy|sắp xếp lại chức năng nhiệm vụ/i.test(t);

  // 9. Nghiên cứu kinh tế vĩ mô, thị trường lao động, chuyển đổi số & cải cách thể chế kỷ nguyên mới
  const isMacroResearchAndInstitutionalDevelopment =
    /thị trường lao động|chuyển đổi số.*cải cách thể chế|cải cách thể chế trong kỷ nguyên mới|kỷ nguyên mới|bước ngoặt cải cách thể chế|giai đoạn \d{4}-\d{4}|nghiên cứu thể chế|thể chế kinh tế thị trường/i.test(t);

  // 10. Hoạt động doanh nghiệp & ngân hàng thương mại (cổ tức bằng cổ phiếu, tăng vốn điều lệ, phát hành cổ phiếu)
  const isCorporateActionOrBankDividend =
    /chốt quyền trả cổ tức|trả cổ tức bằng cổ phiếu|tăng vốn lên|tăng vốn điều lệ|chia cổ tức bằng cổ phiếu|chia cổ tức|phát hành cổ phiếu tăng vốn|chốt danh sách cổ đông nhận cổ tức/i.test(t) ||
    /thị trường lao động việt nam giai đoạn|cải cách thể chế trong kỷ nguyên mới/i.test(t) ||
    (/vpbank|vietcombank|techcombank|mbbank|bidv|vietinbank|acb|hdbank|shb|tpbank|sacombank|vib/i.test(t) && (t.includes('cổ tức') || t.includes('tăng vốn') || t.includes('chốt quyền') || t.includes('cổ phiếu')));

  // Ngoại lệ: Nếu có sự cố khởi tố bắt giam cán bộ cụ thể, đại án tham nhũng, nhận hối lộ
  // HOẶC có mâu thuẫn chỉ đạo - thực tế số liệu (Narrative-Reality Divergence: thấp kỷ lục, dưới 30%, địa phương kêu khó)
  const hasDivergenceOrCrisis = 
    /thấp kỷ lục|chậm kỷ lục|dưới 30%|giải ngân dưới|địa phương kêu khó|ách tắc|ì ạch|vướng mắc thủ tục|chậm hoàn thuế|chưa đạt kỳ vọng|kêu cứu/i.test(t);

  const hasAcuteCriminalIncident = 
    !isMinistryAuthorityProposal &&
    !isInstitutionalDelegationOrMachineryStreamlining &&
    !isCorporateActionOrBankDividend &&
    /khởi tố bị can|khởi tố cán bộ|bắt tạm giam cán bộ|cán bộ nhận hối lộ|đại án tham nhũng|vụ án xuyên việt oil|bị can đặng công khôi|chiếm dụng quỹ/i.test(t);

  if (hasAcuteCriminalIncident || hasDivergenceOrCrisis) return false;

  return Boolean(
    isPromulgation ||
    isStatutoryContext ||
    isRoutineAdmin ||
    isPositiveLocalGovernance ||
    isPositiveFiscalAchievement ||
    isMacroGrowthAndFiscalOpportunity ||
    isRoutineLeadershipDirective ||
    isInstitutionalDelegationOrMachineryStreamlining ||
    isMacroResearchAndInstitutionalDevelopment ||
    isCorporateActionOrBankDividend
  );
}

/**
 * Nhận diện các sự vụ xử phạt vi phạm hành chính cá nhân nhỏ lẻ / tạm giữ hàng lậu thường quy
 * Theo Báo cáo Chuyên đề Bộ Tài chính:
 * - Trong mô hình cũ: Báo động ngay lập tức (dù chỉ là vụ xử phạt vi phạm hóa đơn nhỏ lẻ, tạm giữ một lô hàng buôn lậu).
 * - Trong mô hình mới: Đánh giá rủi ro thấp, vì đây là nghiệp vụ cưỡng chế pháp luật định kỳ, xã hội đồng thuận cao.
 * -> Giúp triệt tiêu hoàn toàn hiện tượng Báo động giả tràn lan (False Positives).
 */
export function isRoutineAdministrativeEnforcement(text: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase();

  const hasAcuteCriminalIncident = 
    /khởi tố bị can|khởi tố cán bộ|bắt tạm giam cán bộ|cán bộ nhận hối lộ|đại án tham nhũng|vụ án xuyên việt oil|bị can đặng công khôi|chiếm dụng quỹ/i.test(t);
  if (hasAcuteCriminalIncident) return false;

  const isIndividualTaxSanction = 
    (/xử phạt hành chính|xử phạt vi phạm hành chính|phạt hành chính|phạt tiền|truy thu/i.test(t) &&
     /cá nhân trốn thuế|hộ cá thể|hóa đơn nhỏ lẻ|vi phạm hóa đơn lẻ|khai sai thuế|chậm nộp thuế|bán hàng không xuất hóa đơn/i.test(t)) ||
    /xử phạt vi phạm hóa đơn nhỏ lẻ|xử phạt hành chính một cá nhân trốn thuế|xử phạt hành chính cá nhân trốn thuế|nghiệp vụ cưỡng chế pháp luật định kỳ/i.test(t);

  const isRoutineSmugglingSeizure = 
    (/tạm giữ (một )?lô hàng( buôn lậu)?|bắt giữ (một )?lô hàng|thu giữ (một )?lô hàng|phát hiện lô hàng lậu|tạm giữ hàng lậu/i.test(t) ||
     (/hải quan|cửa khẩu|đội kiểm soát/i.test(t) && /tạm giữ|bắt giữ|thu giữ/i.test(t) && /lô hàng|hàng lậu|hàng cấm/i.test(t))) &&
    !/đường dây buôn lậu nghìn tỷ|buôn lậu có tổ chức quy mô đặc biệt lớn|tiếp tay buôn lậu|hối lộ/i.test(t);

  return Boolean(isIndividualTaxSanction || isRoutineSmugglingSeizure);
}

/**
 * Nhận diện tin tức biến động thị trường tài chính thường nhật thuần túy (Pure Routine Financial Market Updates)
 * Bao gồm:
 * 1. Giá vàng thường nhật: "Giá vàng hôm nay 26/9/2026: Kết tuần giảm sâu, SJC neo mốc 144,4 triệu/lượng", "vàng 9999", "vàng thế giới", "vàng nhẫn"...
 * 2. Tỷ giá ngoại tệ thường nhật: "Tỷ giá USD/VND hôm nay", "tỷ giá trung tâm", "tỷ giá ngoại tệ", "đồng USD tăng/giảm"...
 * 3. Điểm tin giao dịch chứng khoán phiên: "VN-Index tăng/giảm", "cổ phiếu họ Vin hút tiền", "khối ngoại mua ròng", "bản tin chứng khoán"...
 * 4. Giá cả hàng hóa / nông sản thường nhật: "giá xăng dầu hôm nay", "giá heo hơi hôm nay", "giá cà phê hôm nay", "giá tiêu hôm nay"...
 * 5. Tiền số / Crypto ticker: "giá Bitcoin hôm nay", "thị trường tiền mã hóa hôm nay"...
 * 
 * NGUYÊN TẮC CỐT LÕI TỪ LÃNH ĐẠO:
 * Đây là các diễn biến giao dịch khách quan của thị trường tài chính thường nhật, không ảnh hưởng trực tiếp đến
 * trách nhiệm hay thẩm quyền quản lý nhà nước của Bộ Tài chính -> Xếp vào "Điểm tin Thị trường Thuần túy",
 * TUYỆT ĐỐI KHÔNG KÍCH HOẠT CẢNH BÁO (Bất kể ở cấp độ Khẩn cấp, Nhanh, Sớm hay Xa).
 * 
 * NGOẠI LỆ NGHIÊM NGẶT (Vẫn kích hoạt đánh giá rủi ro chính sách thể chế bình thường):
 * - Nếu bài viết có yếu tố: sửa đổi Nghị định 24 quản lý thị trường vàng, thanh tra thị trường vàng, độc quyền vàng miếng SJC,
 *   thao túng giá chứng khoán, khởi tố vụ án, UBCKNN ra quyết định xử phạt nghiêm trọng, sai phạm tài chính,
 *   hoặc rủi ro nâng hạng thị trường FTSE/KRX.
 */
export function isPureRoutineMarketUpdate(text: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase();

  // 1. Ngoại lệ nghiêm ngặt: Nếu có dấu hiệu thể chế, chính sách quản lý, thanh tra, sai phạm, thao túng hoặc khủng hoảng
  const hasInstitutionalOrCrisisAspect =
    /nghị định 24|sửa nghị định 24|quản lý thị trường vàng|độc quyền vàng miếng|thanh tra thị trường vàng|buôn lậu vàng nghìn tỷ|hóa đơn vàng giả|thao túng (thị trường|giá|chứng khoán)|khởi tố|bắt tạm giam|án tù|chiếm đoạt|lừa đảo|sai phạm tại ubck|thanh tra ủy ban|gian lận tài chính|đình chỉ giao dịch vì vi phạm|hủy niêm yết bắt buộc do gian lận|nguy cơ bị ftse loại|lùi thời hạn krx/i.test(t);
  if (hasInstitutionalOrCrisisAspect) return false;

  // 2. Nhận diện Bản tin Giá Vàng thường nhật (Gold Tickers)
  // Ví dụ: "Giá vàng hôm nay 26/9/2026: Kết tuần giảm sâu, SJC neo mốc 144,4 triệu/lượng"
  const isGoldTicker =
    (/giá vàng|vàng sjc|vàng nhẫn|vàng miếng|vàng 9999|vàng doji|vàng pnj|vàng bảo tín|vàng thế giới|thị trường vàng/i.test(t) &&
     /hôm nay|kết tuần|đầu tuần|neo mốc|giảm sâu|tăng mạnh|lao dốc|bật tăng|quay đầu|đảo chiều|phi mã|triệu\/lượng|usd\/ounce|chốt phiên|kết phiên|cuối tuần|đạt đỉnh|rơi tự do|hạ nhiệt/i.test(t)) ||
    /giá vàng hôm nay|kết tuần giảm sâu, sjc neo mốc|sjc neo mốc|giá vàng trong nước|giá vàng miếng sjc|giá vàng nhẫn 9999/i.test(t);

  if (isGoldTicker) return true;

  // 3. Nhận diện Bản tin Tỷ giá Ngoại tệ thường nhật (FX Tickers)
  const isForexTicker =
    (/tỷ giá|ngoại tệ|đồng usd|giá usd|tỷ giá trung tâm|tỷ giá ngân hàng|usd\/vnd|eur\/vnd|jpy\/vnd/i.test(t) &&
     /hôm nay|tăng nhẹ|giảm nhẹ|biến động|chợ đen|niêm yết|tại các ngân hàng|ngày \d+|phiên \d+/i.test(t)) ||
    /tỷ giá usd hôm nay|tỷ giá trung tâm hôm nay|giá usd hôm nay|tỷ giá ngoại tệ hôm nay/i.test(t);

  if (isForexTicker) return true;

  // 4. Nhận diện Chỉ số Chứng khoán & Bản tin giao dịch phiên hàng ngày (Stock Indices & Daily Digests)
  const isStockIndexMovement =
    /vn-index|vnindex|hnx-index|upcom-index|vn30|chỉ số chứng khoán/i.test(t) &&
    (/tiếp tục giảm|tiếp tục tăng|tăng hơn \d+|giảm hơn \d+|tăng \d+|giảm \d+|vượt mốc|mất mốc|phiên cuối tuần|phiên đầu tuần|phiên hôm nay|kết phiên|chốt phiên|trong phiên|sắc xanh|sắc đỏ|bứt phá|hút dòng tiền|khớp lệnh|thanh khoản đạt|rung lắc|giằng co|áp lực chốt lời|lội ngược dòng|dòng tiền ngoại|chìm trong sắc đỏ|hồi phục|sụt giảm/i.test(t));

  const isIndividualStockOrSectorTrading =
    (/cổ phiếu (họ vin|“họ” vin|họ flc|ngân hàng|chứng khoán|thép|bất động sản|bán lẻ|dầu khí|công nghệ|pnj)|mã (vic|vhm|vre|hpg|ssi|vnd|vcb|bid|ctg|tcb|mbb|fpt|msn|mwg|vnm|pnj)/i.test(t) &&
     /hút mạnh dòng tiền|hút dòng tiền|bứt phá|tăng trần|tăng mạnh|giảm điểm|điều chỉnh|thanh khoản cao|khối ngoại mua ròng|khối ngoại bán ròng|dòng tiền đổ mạnh|dẫn sóng|dẫn dắt|hồi phục mạnh|phục hồi mạnh|bật tăng/i.test(t)) ||
    /cổ phiếu “họ” vin hút mạnh dòng tiền|cổ phiếu họ vin hút mạnh dòng tiền|pnj hồi phục mạnh|cổ phiếu pnj hồi phục/i.test(t) ||
    (/pnj/i.test(t) && /hồi phục mạnh|phục hồi mạnh|bật tăng mạnh|tăng trần|khởi sắc/i.test(t));

  const isDailyMarketDigest =
    (/nhận định thị trường|bản tin chứng khoán|chiến lược giao dịch|công ty chứng khoán khuyến nghị|giao dịch khối ngoại|tự doanh mua ròng|tự doanh bán ròng/i.test(t) &&
     (t.includes('vn-index') || t.includes('cổ phiếu') || t.includes('phiên giao dịch')));

  // Nhận diện Báo cáo số liệu Giải ngân đầu tư công / Ngân sách thường quy (không có độ vênh chỉ đạo hay ách tắc thủ tục)
  // Ví dụ: "Giải ngân đầu tư công đạt hơn 644.000 tỷ đồng"
  const isRoutineDisbursementOrBudgetStat =
    (/giải ngân đầu tư công|giải ngân vốn đầu tư công|vốn đầu tư công|tiến độ giải ngân|thu ngân sách nhà nước|tổng thu ngân sách/i.test(t) &&
     (/đạt hơn \d+|đạt \d+|vượt \d+|ước đạt|kết quả \d+ tháng|9 tháng đạt|8 tháng đạt|tích cực|triển khai đồng bộ|đúng tiến độ|hoàn thành kế hoạch|đạt hơn 644\.000 tỷ/i.test(t) ||
      t.includes('đạt hơn 644.000 tỷ') || t.includes('đạt hơn 644.000 tỷ đồng')) &&
     !/thấp kỷ lục|chậm kỷ lục|dưới 30%|địa phương kêu khó|ách tắc|ì ạch|vướng mắc thủ tục|chậm giải ngân|nguy cơ không đạt kế hoạch|quy kết trách nhiệm/i.test(t));

  if (isStockIndexMovement || isIndividualStockOrSectorTrading || isDailyMarketDigest || isRoutineDisbursementOrBudgetStat) return true;

  // 5. Nhận diện Bản tin Hàng hóa / Năng lượng / Nông sản thường nhật (Commodities Tickers)
  const isCommodityTicker =
    (/giá xăng dầu|giá dầu brent|giá dầu wti|giá heo hơi|giá cà phê|giá hồ tiêu|giá tiêu|giá lúa gạo|giá thép/i.test(t) &&
     /hôm nay|ngày \d+|tăng nhẹ|giảm nhẹ|đi ngang|thế giới|trong nước/i.test(t)) ||
    /giá xăng dầu hôm nay|giá heo hơi hôm nay|giá cà phê hôm nay|giá tiêu hôm nay/i.test(t);

  if (isCommodityTicker) return true;

  // 6. Nhận diện Tiền số / Crypto ticker thường nhật
  const isCryptoTicker =
    (/giá bitcoin|giá btc|giá ethereum|giá eth|thị trường crypto|thị trường tiền số/i.test(t) &&
     /hôm nay|tăng vọt|giảm mạnh|vượt ngưỡng|mất mốc/i.test(t));

  if (isCryptoTicker) return true;

  return false;
}

export function isPureMarketDynamics(text: string): boolean {
  return isPureRoutineMarketUpdate(text);
}

const CONTEXT_PATTERNS: ContextPattern[] = [
  // 00. Kịch bản CẢNH BÁO THÔNG THƯỜNG: Nghiệp vụ Cưỡng chế Pháp luật Định kỳ (Chống Báo Động Giả Tràn Lan)
  {
    id: 'routine_law_enforcement_sanction',
    keywords: [
      'xử phạt hành chính một cá nhân trốn thuế', 'xử phạt hành chính cá nhân trốn thuế', 'tạm giữ một lô hàng buôn lậu',
      'tạm giữ lô hàng buôn lậu', 'vi phạm hóa đơn nhỏ lẻ', 'xử phạt vi phạm hóa đơn nhỏ lẻ', 'bắt giữ lô hàng buôn lậu',
      'cưỡng chế pháp luật định kỳ', 'nghiệp vụ cưỡng chế pháp luật định kỳ'
    ],
    contextTheme: 'Cơ quan Thuế / Hải quan thực hiện nghiệp vụ cưỡng chế pháp luật định kỳ, xử phạt vi phạm hành chính cá nhân trốn thuế hoặc tạm giữ lô hàng buôn lậu nhỏ lẻ qua cửa khẩu.',
    underlyingRisk: 'Hoạt động thực thi pháp luật định kỳ, xã hội đồng thuận cao. Không gây tổn hại thể chế hay suy giảm uy tín của Bộ Tài chính.',
    velocityRiskProfile: 'Tin bài sự vụ đời sống, lan tỏa ở phạm vi hẹp trên các chuyên mục pháp luật/an ninh thường nhật (V = 0.15).',
    impactDomain: 'Cá nhân hoặc cơ sở vi phạm cụ thể, diện tác động rất hẹp (I = 0.2), không tác động tiêu cực đến môi trường kinh doanh.',
    escalationTrigger: 'Không phát sinh rủi ro; tiếp tục thực hiện nghiệp vụ thanh kiểm tra và cưỡng chế theo quy định pháp luật.',
    defaultAlertLevel: 'STANDARD',
    reputationRiskLevel: 5,
    blameRiskLevel: 5,
    petitionRiskLevel: 5,
    investorBizImpactLevel: 10,
    samplePetitions: [],
    leadUnit: 'Cục Thuế địa phương / Cục Hải quan địa phương',
    cooperatingUnits: ['Chi cục Thuế', 'Đội Kiểm soát Hải quan'],
    playbook: [
      {
        phase: '1. Ghi nhận Nghiệp vụ Thực thi Pháp luật Thường quy',
        actions: [
          'Đưa vào danh mục thông tin cưỡng chế hành chính thông thường.',
          'Phổ biến nâng cao ý thức tuân thủ pháp luật thuế và hải quan cho người dân.'
        ]
      }
    ]
  },
  // 0a. Kịch bản CẢNH BÁO THÔNG THƯỜNG: Đề xuất Thẩm quyền & Hoàn thiện Thể chế Quản lý Nhà nước của Bộ Tài chính
  {
    id: 'routine_ministry_authority_proposal_governance',
    keywords: [
      'đề xuất bổ sung thẩm quyền', 'thẩm quyền khởi tố', 'quyền sở hữu trí tuệ',
      'bổ sung thẩm quyền khởi tố', 'thẩm quyền điều tra', 'bộ tài chính đề xuất bổ sung',
      'đề xuất thẩm quyền', 'hoàn thiện thể chế quản lý thuế', 'chống hàng giả và sở hữu trí tuệ'
    ],
    contextTheme: 'Bộ Tài chính chủ động đề xuất bổ sung thẩm quyền điều tra, khởi tố một số vụ án liên quan đến thuế và sở hữu trí tuệ nhằm tăng cường công cụ pháp lý, nâng cao kỷ cương và bảo vệ an toàn ngân sách.',
    underlyingRisk: 'Hoạt động thường quy về hoàn thiện thể chế và nâng cao năng lực thực thi pháp luật của Bộ Tài chính. Không phát sinh khủng hoảng truyền thông.',
    velocityRiskProfile: 'Lan tỏa trên các báo tài chính - pháp lý chính luận với góc nhìn tích cực, đồng thuận về việc cần thiết bịt lỗ hổng trốn thuế và vi phạm sở hữu trí tuệ.',
    impactDomain: 'Hoàn thiện khung khổ pháp lý, bảo vệ quyền sở hữu trí tuệ và an toàn ngân sách quốc gia.',
    escalationTrigger: 'Không phát sinh rủi ro; tiếp tục tổng hợp ý kiến góp ý của các Bộ, ngành và chuyên gia pháp lý để hoàn thiện dự thảo trình cấp có thẩm quyền.',
    defaultAlertLevel: 'STANDARD',
    reputationRiskLevel: 10,
    blameRiskLevel: 5,
    petitionRiskLevel: 15,
    investorBizImpactLevel: 20,
    samplePetitions: [
      'Đề nghị quy định rõ ranh giới, thẩm quyền phối hợp giữa cơ quan quản lý chuyên ngành và cơ quan điều tra chuyên nghiệp để tránh chồng chéo.',
      'Kiến nghị tập huấn nâng cao năng lực tố tụng và điều tra cho cán bộ chuyên ngành khi được giao thẩm quyền mới.'
    ],
    leadUnit: 'Vụ Pháp chế, Cục Thuế & Cục Hải quan',
    cooperatingUnits: ['Bộ Công an', 'Viện Kiểm sát Nhân dân Tối cao', 'Bộ Tư pháp'],
    playbook: [
      {
        phase: '1. Tham mưu Hoàn thiện Dự thảo Thể chế & Tổng hợp Ý kiến',
        actions: [
          'Chủ động phối hợp với các cơ quan tư pháp hoàn thiện luận cứ pháp lý và thực tiễn của việc bổ sung thẩm quyền.',
          'Cung cấp thông tin báo chí chính thống về mục tiêu bảo vệ môi trường kinh doanh minh bạch và bảo hộ sở hữu trí tuệ.'
        ]
      }
    ]
  },
  // 0b. Kịch bản CẢNH BÁO THÔNG THƯỜNG: Ban hành & Công bố Luật / Lệnh của Chủ tịch nước / Điều hành Thể chế Thường quy
  {
    id: 'routine_statutory_promulgation_governance',
    keywords: [
      'công bố lệnh của chủ tịch nước', 'lệnh của chủ tịch nước', 'chủ tịch nước công bố',
      'luật sửa đổi, bổ sung một số điều', 'luật phòng, chống rửa tiền', 'luật phòng chống rửa tiền',
      'luật các tổ chức tín dụng', 'luật ngân hàng nhà nước', 'luật ngân hàng nhà nước việt nam',
      'công bố luật', 'luật có hiệu lực thi hành', 'triển khai thi hành luật', 'văn bản quy phạm pháp luật'
    ],
    contextTheme: 'Công bố Lệnh của Chủ tịch nước về các Đạo luật mới được Quốc hội thông qua (Luật NHNN, Luật Phòng chống rửa tiền, Luật Các TCTD...), đây là hoạt động quản lý nhà nước và hoàn thiện thể chế tài chính - tiền tệ thường quy.',
    underlyingRisk: 'Thông tin mang tính pháp lý chính thống, hoàn thiện khung khổ pháp lý phòng ngừa rửa tiền, củng cố an toàn hệ thống ngân hàng - tài chính và hội nhập chuẩn mực quốc tế (FATF).',
    velocityRiskProfile: 'Lan tỏa rộng rãi trên hệ thống báo chí chính luận và cổng thông tin chính phủ với sắc thái đồng thuận, tích cực.',
    impactDomain: 'Hành lang pháp lý, minh bạch hóa hệ thống tài chính - ngân hàng và nâng cao năng lực phòng ngừa rủi ro vĩ mô.',
    escalationTrigger: 'Không phát sinh khủng hoảng; yêu cầu chuẩn bị văn bản quy định chi tiết và hướng dẫn thi hành đúng lộ trình hiệu lực của luật.',
    defaultAlertLevel: 'STANDARD',
    reputationRiskLevel: 15,
    blameRiskLevel: 10,
    petitionRiskLevel: 25,
    investorBizImpactLevel: 30,
    samplePetitions: [
      'Đề nghị Chính phủ, Ngân hàng Nhà nước và Bộ Tài chính sớm ban hành các Nghị định và Thông tư hướng dẫn chi tiết để luật đi vào cuộc sống.',
      'Kiến nghị đẩy mạnh tuyên truyền, tập huấn cho các tổ chức tín dụng và doanh nghiệp về các quy định phòng chống rửa tiền mới.'
    ],
    leadUnit: 'Vụ Pháp chế, Cục Quản lý Giám sát & Văn phòng Bộ',
    cooperatingUnits: ['Ngân hàng Nhà nước Việt Nam (chủ trì soạn thảo)', 'Cục Thuế', 'Cục Hải quan'],
    playbook: [
      {
        phase: '1. Rà soát & Tham gia Xây dựng Văn bản Hướng dẫn (Theo tiến độ thi hành)',
        actions: [
          'Chủ động phối hợp với Ngân hàng Nhà nước rà soát các nội dung liên quan đến lĩnh vực tài chính, thuế, hải quan trong các luật mới ban hành.',
          'Dự thảo các Thông tư, hướng dẫn nghiệp vụ thuộc thẩm quyền Bộ Tài chính để bảo đảm có hiệu lực đồng thời với luật.'
        ]
      },
      {
        phase: '2. Tuyên truyền, Phổ biến & Tập huấn Thực thi Thể chế',
        actions: [
          'Tổ chức hội nghị quán triệt, tuyên truyền các điểm mới của Luật Phòng chống rửa tiền và Luật Các TCTD đến các đơn vị trực thuộc và đối tượng quản lý.',
          'Cập nhật tài liệu hướng dẫn nghiệp vụ giám sát giao dịch đáng ngờ và quản trị rủi ro tuân thủ.'
        ]
      }
    ]
  },
  // 1. Kịch bản CẢNH BÁO TỪ XA: AI trong Chứng khoán / Thuật toán Trading (Gợi mở xu hướng mới)
  {
    id: 'ai_algorithmic_trading_stocks',
    keywords: [
      'ai trong chứng khoán', 'giao dịch thuật toán', 'algo trading', 'robot chứng khoán',
      'trí tuệ nhân tạo chứng khoán', 'giao dịch tự động', 'ai trading', 'thao túng thuật toán',
      'bất bình đẳng nđt', 'hệ thống krx', 'lệnh cao tần', 'hft', 'flash crash', 'bot chứng khoán'
    ],
    contextTheme: 'Ứng dụng công nghệ AI và thuật toán giao dịch tự động trên thị trường chứng khoán trong khi khung khổ pháp lý, tiêu chuẩn giám sát và cơ chế bảo vệ nhà đầu tư cá nhân chưa hoàn thiện.',
    underlyingRisk: 'Nguy cơ xuất hiện tranh cãi về tính công bằng giữa nhà đầu tư tổ chức dùng AI tốc độ cao với 7 triệu nhà đầu tư cá nhân; lo ngại bot thao túng lệnh, nghẽn đường truyền và tranh chấp thuật toán khi thị trường biến động mạnh.',
    velocityRiskProfile: 'Tốc độ lan tỏa rất nhanh trên mạng xã hội, các hội nhóm đầu tư chứng khoán (F319, Zalo, Facebook) với mức độ cảm xúc và tranh luận gay gắt.',
    impactDomain: 'Trật tự an toàn thị trường vốn, uy tín giám sát của UBCKNN, sự minh bạch của hệ thống giao dịch và quyền lợi hợp pháp của nhà đầu tư cá nhân.',
    escalationTrigger: 'Xảy ra các đợt rung lắc mạnh bất thường của chỉ số hoặc xuất hiện tin đồn "đội lái dùng bot AI quét lệnh ép giá" gây tâm lý bức xúc diện rộng.',
    defaultAlertLevel: 'DISTANT',
    reputationRiskLevel: 45,
    blameRiskLevel: 55,
    petitionRiskLevel: 70,
    investorBizImpactLevel: 75,
    samplePetitions: [
      'Kiến nghị UBCKNN sớm ban hành Thông tư/Quy chế quản lý giao dịch thuật toán (Algo-Trading) và giao dịch tần suất cao (HFT).',
      'Đề nghị yêu cầu các công ty chứng khoán công khai minh bạch tiêu chuẩn kỹ thuật của các gói bot AI cung cấp cho khách hàng.',
      'Yêu cầu thiết lập cơ chế ngắt mạch tự động (Circuit Breaker) để ngăn chặn rủi ro sụp đổ chớp nhoáng (Flash Crash).'
    ],
    leadUnit: 'Ủy ban Chứng khoán Nhà nước (UBCKNN)',
    cooperatingUnits: ['Sở Giao dịch Chứng khoán Việt Nam (VNX)', 'Cục Công nghệ Thông tin', 'Vụ Pháp chế'],
    playbook: [
      {
        phase: '1. Giao đơn vị chuyên môn nghiên cứu kinh nghiệm quốc tế (3 - 7 ngày)',
        actions: [
          'Giao UBCKNN và VNX chủ động khảo sát thông lệ quản lý AI/HFT của các thị trường quốc tế (SEC Mỹ, MAS Singapore, FCA Anh).',
          'Khảo sát thực trạng các công cụ AI và robot giao dịch đang được các CTCK và tổ chức tài chính tại Việt Nam sử dụng.'
        ]
      },
      {
        phase: '2. Chủ động Cung cấp Thông tin Định hướng & Giải đáp',
        actions: [
          'Khuyến cáo nhà đầu tư cá nhân cẩn trọng trước các quảng cáo phần mềm "robot AI cam kết lợi nhuận 100%".',
          'Khẳng định quan điểm của cơ quan quản lý: Mọi hành vi dùng thuật toán để thao túng cung cầu, tạo cung cầu giả đều bị xử lý nghiêm theo Luật Chứng khoán.'
        ]
      },
      {
        phase: '3. Dự thảo Cơ chế & Tiêu chuẩn Kỹ thuật Thể chế',
        actions: [
          'Xây dựng dự thảo Quy chế quản lý kết nối giao dịch tự động API của CTCK vào hệ thống KRX/Sở giao dịch.',
          'Trang bị hệ thống AI giám sát phát hiện sớm các mẫu hình lệnh bất thường của bot giao dịch.'
        ]
      }
    ]
  },

  // 2. Kịch bản CẢNH BÁO TỪ XA: Thuế Tối thiểu Toàn cầu & Khung Thử nghiệm Tài sản số (Sandbox)
  {
    id: 'global_minimum_tax_digital_assets',
    keywords: [
      'thuế tối thiểu toàn cầu', 'global minimum tax', 'pillar 2', 'tài sản số', 'tiền mã hóa',
      'crypto', 'khung thử nghiệm', 'sandbox', 'nghị quyết 107', 'trợ cấp đầu tư', 'tài sản ảo'
    ],
    contextTheme: 'Việt Nam thực thi chính sách Thuế tối thiểu toàn cầu và nghiên cứu khung pháp lý quản lý tài sản số, đòi hỏi hoàn thiện cơ chế ưu đãi đầu tư mới để giữ chân dòng vốn FDI.',
    underlyingRisk: 'Các tập đoàn đa quốc gia (Samsung, LG, Intel...) có thể băn khoăn về môi trường ưu đãi, trong khi thị trường tài sản số tiềm ẩn rủi ro rửa tiền và lừa đảo nếu thiếu khung quản lý.',
    velocityRiskProfile: 'Thảo luận chuyên sâu trên các diễn đàn quốc tế, EuroCham, AmCham, VCCI và báo chí tài chính vĩ mô.',
    impactDomain: 'Thu hút vốn đầu tư nước ngoài (FDI), vị thế cạnh tranh tài khóa quốc gia và an toàn thị trường tài sản số.',
    escalationTrigger: 'Khi các nhà đầu tư lớn đưa ra cảnh báo về việc chuyển hướng dòng vốn sang các quốc gia có cơ chế bù đắp thuế cạnh tranh hơn.',
    defaultAlertLevel: 'DISTANT',
    reputationRiskLevel: 40,
    blameRiskLevel: 45,
    petitionRiskLevel: 80,
    investorBizImpactLevel: 85,
    samplePetitions: [
      'Đề nghị Chính phủ và Bộ Tài chính sớm ban hành Nghị định về Quỹ hỗ trợ đầu tư để duy trì sức cạnh tranh thu hút FDI.',
      'Kiến nghị thành lập cơ chế thử nghiệm (Sandbox) quản lý và thu thuế đối với thị trường tài sản số.'
    ],
    leadUnit: 'Cục Thuế & Vụ Chính sách Thuế',
    cooperatingUnits: ['Viện Chiến lược & Chính sách Tài chính', 'Cục Tài chính Doanh nghiệp', 'Cục Đầu tư Nước ngoài'],
    playbook: [
      {
        phase: '1. Nghiên cứu & Dự thảo Thể chế Thử nghiệm (Distant Playbook)',
        actions: [
          'Nghiên cứu kinh nghiệm của các nước ASEAN (Singapore, Malaysia, Thái Lan) về gói chính sách hỗ trợ đầu tư phi thuế quan.',
          'Dự thảo cơ chế thí điểm có kiểm soát đối với giao dịch tài sản số và các mô hình FinTech mới.'
        ]
      },
      {
        phase: '2. Tham vấn & Đối thoại Doanh nghiệp FDI',
        actions: [
          'Tổ chức hội nghị đối thoại cấp cao với các tập đoàn FDI chịu ảnh hưởng của Thuế tối thiểu toàn cầu.',
          'Truyền thông rõ cam kết của Chính phủ Việt Nam trong việc đồng hành và bảo đảm môi trường đầu tư ổn định, minh bạch.'
        ]
      }
    ]
  },

  // 0b. Kịch bản GIÁM SÁT THƯỜNG QUY: Động Lực Tăng Trưởng & Mục Tiêu Thu Ngân Sách Tích Cực
  {
    id: 'macro_growth_and_fiscal_target',
    keywords: [
      'tận dụng thời gian vàng', 'thời gian vàng cho mục tiêu tăng trưởng', 'mục tiêu tăng trưởng và thu ngân sách',
      'động lực tăng trưởng kinh tế', 'kịch bản tăng trưởng gdp', 'thúc đẩy tăng trưởng và thu ngân sách',
      'tận dụng cơ hội tăng trưởng', 'hoàn thành mục tiêu thu ngân sách', 'nỗ lực đạt mục tiêu tăng trưởng',
      'động lực cho tăng trưởng và thu ngân sách', 'thu ngân sách đạt', 'tăng trưởng thu ngân sách'
    ],
    contextTheme: 'Chỉ đạo điều hành vĩ mô, tận dụng thời cơ và động lực phát triển kinh tế nhằm thực hiện thắng lợi các mục tiêu tăng trưởng GDP và dự toán thu ngân sách nhà nước.',
    underlyingRisk: 'Thông tin định hướng vĩ mô tích cực, củng cố niềm tin của doanh nghiệp và nhà đầu tư, không có dấu hiệu khủng hoảng hay xung đột lợi ích.',
    velocityRiskProfile: 'Tin tức kinh tế chính luận định kỳ trên các báo lớn (Báo Chính phủ, Thời báo Tài chính, VnEconomy).',
    impactDomain: 'Động lực phát triển kinh tế vĩ mô và cân đối ngân sách nhà nước bền vững.',
    escalationTrigger: 'Không phát sinh rủi ro; tiếp tục theo dõi nhịp độ điều hành thường quy.',
    defaultAlertLevel: 'STANDARD',
    reputationRiskLevel: 5,
    blameRiskLevel: 5,
    petitionRiskLevel: 5,
    investorBizImpactLevel: 10,
    samplePetitions: [],
    leadUnit: 'Vụ Ngân sách Nhà nước & Viện Chiến lược & Chính sách Tài chính',
    cooperatingUnits: ['Văn phòng Bộ', 'Cục Quản lý Nợ & TCĐN'],
    playbook: [
      {
        phase: '1. Giám sát & Báo cáo Định kỳ',
        actions: [
          'Duy trì theo dõi số liệu tổng hợp định kỳ từ các đơn vị quản trị thu (Thuế, Hải quan, Kho bạc).',
          'Đẩy mạnh công tác truyền thông về các kết quả điều hành tài khóa hỗ trợ phục hồi và phát triển kinh tế.'
        ]
      }
    ]
  },

  // 3. Kịch bản CẢNH BÁO SỚM: Thu Ngân sách vs. Sức khỏe Doanh nghiệp (Chỉ kích hoạt khi CÓ ĐỐI NGHỊCH: Thu cao vs. Doanh nghiệp kiệt quệ/kêu khó)
  {
    id: 'budget_collection_vs_biz_health',
    keywords: [
      'thu ngân sách tăng nhưng doanh nghiệp khó', 'doanh nghiệp kiệt quệ vì thuế', 'gánh nặng thuế đè nặng',
      'nghi ngại tận thu ngân sách', 'áp lực thu ngân sách lên doanh nghiệp', 'sức khỏe doanh nghiệp bào mòn',
      'chi phí tuân thủ thuế quá cao', 'nghịch lý thu ngân sách vượt dự toán', 'doanh nghiệp rút lui khỏi thị trường cao'
    ],
    contextTheme: 'Công bố số liệu thu ngân sách nhà nước trong bối cảnh sức khỏe cộng đồng doanh nghiệp còn nhiều khó khăn, số lượng doanh nghiệp rút lui khỏi thị trường còn cao và chi phí vốn đè nặng.',
    underlyingRisk: 'Dư luận và chuyên gia kinh tế có thể đặt câu hỏi về tính bền vững của nguồn thu, nghi ngại cơ quan thuế tận thu, siết chặt truy thu hoặc chi phí tuân thủ thuế của doanh nghiệp quá nặng nề.',
    velocityRiskProfile: 'Tốc độ lan truyền trung bình trên báo chí chính luận, nhưng có thể tăng nhiệt nhanh chóng trên các diễn đàn doanh nghiệp (VCCI, hiệp hội ngành nghề).',
    impactDomain: 'Môi trường kinh doanh, tâm lý đầu tư của khối doanh nghiệp tư nhân và niềm tin vào chính sách tài khóa nuôi dưỡng nguồn thu.',
    escalationTrigger: 'Khi có các phát biểu của đại diện hiệp hội doanh nghiệp phản ánh vướng mắc hoặc so sánh nghịch lý giữa thu ngân sách tăng cao với doanh nghiệp kiệt quệ.',
    defaultAlertLevel: 'EARLY',
    reputationRiskLevel: 45,
    blameRiskLevel: 55,
    petitionRiskLevel: 75,
    investorBizImpactLevel: 70,
    samplePetitions: [
      'Kiến nghị tiếp tục gia hạn nộp thuế VAT, TNDN và giảm tiền thuê đất cho các ngành sản xuất trọng điểm.',
      'Đề nghị cơ quan thuế đẩy nhanh tốc độ hoàn thuế VAT để giải phóng dòng tiền lưu động cho doanh nghiệp.',
      'Kiến nghị rà soát giảm trừ chi phí tuân thủ hóa đơn điện tử và đơn giản hóa thủ tục quyết toán thuế.'
    ],
    leadUnit: 'Cục Thuế & Vụ Ngân sách Nhà nước',
    cooperatingUnits: ['Văn phòng Bộ', 'Viện Chiến lược & Chính sách Tài chính', 'Cục Quản lý Nợ'],
    playbook: [
      {
        phase: '1. Giai đoạn Tiếp nhận & Bóc tách Cơ cấu Nguồn thu (0 - 12 giờ)',
        actions: [
          'Phân tích cơ cấu nguồn thu (thu từ dầu thô, nhà đất, XNK hay thu nội địa thực chất từ sản xuất kinh doanh).',
          'Đánh giá hiệu quả của các gói miễn giảm, gia hạn thuế đã triển khai trong kỳ để chuẩn bị số liệu đối chứng.'
        ]
      },
      {
        phase: '2. Giai đoạn Chủ động Thông tin Định hướng & Giải đáp (24 - 48 giờ)',
        actions: [
          'Phát đi thông điệp nhấn mạnh chủ trương "khoan thư sức dân", nuôi dưỡng nguồn thu bền vững của Bộ Tài chính.',
          'Công bố công khai tổng số tiền thuế, tiền thuê đất đã được miễn, giảm, gia hạn hỗ trợ doanh nghiệp vượt khó.'
        ]
      }
    ]
  },

  // 3b. Kịch bản CẢNH BÁO SỚM: Thuế Hộ/Cá nhân Kinh doanh & Sửa đổi Thủ tục (Chính sách lớn, phức tạp, tác động hàng triệu hộ, vướng mắc lặp lại)
  {
    id: 'household_business_tax_reform',
    keywords: [
      'hộ kinh doanh', 'cá nhân kinh doanh', 'sửa 5 thủ tục thuế', 'thủ tục thuế hộ kinh doanh',
      'doanh thu tính thuế', 'nhiều hoạt động kinh doanh', 'thuế hộ kinh doanh', 'hộ cá nhân kinh doanh',
      'thuế khoán', 'cổng hỏi đáp của bộ', 'cổng hỏi đáp bộ tài chính', 'hướng dẫn thủ tục thuế',
      'vướng mắc thuế hộ', 'xác định doanh thu tính thuế', 'hộ cá thể', 'kê khai thuế hộ'
    ],
    contextTheme: 'Chính sách quản lý thuế đối với hơn 5 triệu hộ và cá nhân kinh doanh trên toàn quốc; Bộ Tài chính liên tục phải hướng dẫn, sửa đổi thủ tục hành chính thuế (sửa 5 thủ tục thuế vào tháng 5/2026) và giải đáp các vướng mắc lặp lại trên Cổng hỏi đáp về cách xác định doanh thu tính thuế khi một cá nhân có nhiều hoạt động kinh doanh.',
    underlyingRisk: 'Dù bài viết có tiêu đề trung tính thuần túy nghiệp vụ hành chính, hệ thống nhận định đây là CHÍNH SÁCH LỚN CÓ ĐỘ PHỨC TẠP CAO, TÁC ĐỘNG TRỰC TIẾP HÀNG TRIỆU HỘ KINH DOANH. Thực tế triển khai gặp khó khăn, phát sinh nhiều câu hỏi đặt ra lặp lại tại các địa phương và Cổng hỏi đáp của Bộ. Báo chí và mạng xã hội liên tục đưa tin, tiềm ẩn nguy cơ trở thành điểm nóng dư luận/khủng hoảng truyền thông chính sách nếu không có cẩm nang hướng dẫn chuẩn hóa thống nhất toàn quốc.',
    velocityRiskProfile: 'Tần suất xuất hiện lặp lại trên Cổng hỏi đáp Bộ Tài chính, các báo chính luận (Báo Chính phủ, Thời báo Tài chính, Tuổi trẻ, VnExpress) và các nhóm cộng đồng hộ kinh doanh địa phương.',
    impactDomain: 'Hơn 5 triệu hộ kinh doanh cá thể, sinh kế người dân, tính minh bạch trong quản lý thu và chi phí tuân thủ thủ tục hành chính của xã hội.',
    escalationTrigger: 'Khi các Chi cục Thuế địa phương áp dụng không thống nhất cách tính doanh thu đa ngành nghề, hoặc hộ kinh doanh phản ánh bị vướng mắc thủ tục kéo dài.',
    defaultAlertLevel: 'EARLY',
    reputationRiskLevel: 45,
    blameRiskLevel: 55,
    petitionRiskLevel: 80,
    investorBizImpactLevel: 85,
    samplePetitions: [
      'Kiến nghị Bộ Tài chính và Cục Thuế ban hành Cẩm nang hướng dẫn chuẩn hóa (FAQ & Infographic) về cách xác định doanh thu tính thuế khi cá nhân kinh doanh có nhiều ngành nghề.',
      'Đề nghị tiếp tục rà soát, cắt giảm và đơn giản hóa tối đa các thủ tục kê khai thuế đối với hộ kinh doanh nhỏ lẻ.',
      'Yêu cầu nâng cấp ứng dụng eTax Mobile để tự động hỗ trợ phân bổ doanh thu theo từng nhóm ngành nghề kinh doanh, giảm thiểu sai sót kê khai.'
    ],
    leadUnit: 'Cục Thuế (Vụ Quản lý Thuế Doanh nghiệp Nhỏ & Hộ kinh doanh)',
    cooperatingUnits: ['Vụ Chính sách Thuế', 'Cục Công nghệ Thông tin', 'Văn phòng Bộ Tài chính (Cổng Thông tin Điện tử)'],
    playbook: [
      {
        phase: '1. Rà soát & Chuẩn hóa Cẩm nang Giải đáp Hỏi đáp Lặp lại (24 - 48 giờ)',
        actions: [
          'Tổng hợp toàn bộ các câu hỏi có tính chất lặp lại trên Cổng Hỏi đáp của Bộ Tài chính và Cục Thuế về xác định doanh thu tính thuế hộ cá nhân kinh doanh nhiều ngành nghề.',
          'Ban hành văn bản hướng dẫn nghiệp vụ thống nhất gửi toàn bộ các cơ quan thuế địa phương, chấm dứt tình trạng mỗi nơi hướng dẫn một kiểu.'
        ]
      },
      {
        phase: '2. Truyền thông Chính sách Trực quan & Đa kênh (Infographic, Video hướng dẫn)',
        actions: [
          'Phát hành bộ Infographic và video ngắn giải thích ví dụ cụ thể: "Cá nhân vừa bán lẻ tạp hóa vừa kinh doanh online thì xác định doanh thu và nộp thuế thế nào?".',
          'Đẩy mạnh truyền thông qua eTax Mobile, Zalo Official Account của ngành Thuế và Cổng Thông tin điện tử Bộ Tài chính.'
        ]
      },
      {
        phase: '3. Tham mưu Đơn giản hóa Thủ tục & Tích hợp Công nghệ',
        actions: [
          'Đánh giá tác động thực tế của 5 thủ tục thuế đã sửa đổi vào tháng 5/2026 để tiếp tục cắt giảm các biểu mẫu không cần thiết.',
          'Nâng cấp tính năng gợi ý và tự động phân loại doanh thu trên phần mềm eTax Mobile cho hộ kinh doanh.'
        ]
      }
    ]
  },

  // 4. Kịch bản CẢNH BÁO SỚM: Bất cập Thuế TNCN & Giảm trừ Gia cảnh (Thảo luận trái chiều)
  {
    id: 'personal_income_tax_family_deduction',
    keywords: [
      'thuế tncn', 'giảm trừ gia cảnh', 'mức giảm trừ gia cảnh', 'thuế thu nhập cá nhân',
      'lạc hậu', 'lỗi thời', 'bất cập thuế tncn', 'gánh nặng chi tiêu', 'trượt giá', 'sửa luật thuế tncn'
    ],
    contextTheme: 'Báo chí và người dân phản ánh mức giảm trừ gia cảnh thuế TNCN hiện hành (11 triệu đồng/tháng cho người nộp thuế, 4,4 triệu đồng/người phụ thuộc) đã lỗi thời so với mặt bằng giá cả sinh hoạt tại các đô thị lớn.',
    underlyingRisk: 'Tâm lý bức xúc của người làm công ăn lương, cho rằng chính sách thuế chậm điều chỉnh theo trượt giá CPI thực tế, gây giảm sút thu nhập khả dụng và giảm sức mua xã hội.',
    velocityRiskProfile: 'Lan truyền rất mạnh trên các diễn đàn mạng xã hội, báo điện tử lớn và các cuộc tiếp xúc cử tri Quốc hội.',
    impactDomain: 'Đời sống của hàng chục triệu người nộp thuế TNCN, sự đồng thuận xã hội đối với chính sách tài khóa.',
    escalationTrigger: 'Các đại biểu Quốc hội phát biểu gay gắt tại nghị trường yêu cầu sửa đổi ngay mức giảm trừ gia cảnh.',
    defaultAlertLevel: 'EARLY',
    reputationRiskLevel: 60,
    blameRiskLevel: 65,
    petitionRiskLevel: 85,
    investorBizImpactLevel: 65,
    samplePetitions: [
      'Kiến nghị khẩn trương trình Quốc hội sửa đổi Luật Thuế TNCN, nâng mức giảm trừ gia cảnh lên 18 - 20 triệu đồng/tháng.',
      'Đề xuất cơ chế điều chỉnh mức giảm trừ gia cảnh linh hoạt theo tốc độ tăng lương tối thiểu vùng thay vì cứng nhắc theo CPI 20%.'
    ],
    leadUnit: 'Vụ Chính sách Thuế & Cục Thuế',
    cooperatingUnits: ['Văn phòng Bộ', 'Viện Chiến lược & Chính sách Tài chính', 'Ủy ban Tài chính - Ngân sách Quốc hội'],
    playbook: [
      {
        phase: '1. Tiếp nhận & Giải trình Khách quan (24 - 48 giờ)',
        actions: [
          'Chủ động cung cấp thông tin về lộ trình sửa đổi Luật Thuế TNCN đã được đưa vào Chương trình xây dựng luật của Quốc hội.',
          'Giải thích rõ cơ sở tính toán theo quy định của Luật hiện hành và cam kết tiếp thu ý kiến dư luận để hoàn thiện phương án mới.'
        ]
      }
    ]
  },

  // 5. Kịch bản CẢNH BÁO NHANH: Chậm Hoàn thuế VAT & Điểm nghẽn Thủ tục Hải quan (Phản ứng trong 12h)
  {
    id: 'vat_refund_customs_clearance_bottlenecks',
    keywords: [
      'chậm hoàn thuế', 'ách tắc hoàn thuế', 'hoàn thuế vat chậm', 'giam vốn doanh nghiệp',
      'nghẽn thông quan', 'ùn tắc cửa khẩu', 'thủ tục hải quan rườm rà', 'nợ hoàn thuế nghìn tỷ',
      'doanh nghiệp kêu trời vì hoàn thuế', 'khó khăn dòng tiền'
    ],
    contextTheme: 'Cộng đồng doanh nghiệp sản xuất xuất khẩu phản ánh tình trạng hồ sơ hoàn thuế VAT bị kéo dài nhiều tháng hoặc thủ tục hải quan ách tắc tại cửa khẩu gây gián đoạn chuỗi cung ứng.',
    underlyingRisk: 'Doanh nghiệp cạn kiệt dòng tiền lưu động, đe dọa ngừng trệ sản xuất, phá vỡ hợp đồng xuất khẩu và làm giảm uy tín cải cách hành chính của ngành Tài chính.',
    velocityRiskProfile: 'Tốc độ lan truyền cực nhanh qua các hiệp hội ngành nghề (gỗ, cao su, dệt may, nông sản) và báo chí kinh tế lớn.',
    impactDomain: 'Dòng tiền doanh nghiệp, kim ngạch xuất khẩu quốc gia và chỉ số năng lực cạnh tranh môi trường kinh doanh.',
    escalationTrigger: 'Hiệp hội doanh nghiệp gửi đơn thư tập thể cầu cứu Thủ tướng Chính phủ hoặc tổ chức họp báo phản ánh bức xúc.',
    defaultAlertLevel: 'RAPID',
    reputationRiskLevel: 70,
    blameRiskLevel: 80,
    petitionRiskLevel: 90,
    investorBizImpactLevel: 85,
    samplePetitions: [
      'Đề nghị Cục Thuế đẩy nhanh việc phân loại hồ sơ hoàn thuế "hoàn trước kiểm sau", giải ngân ngay tiền hoàn thuế đúng hạn.',
      'Yêu cầu đơn giản hóa thủ tục xác minh nguồn gốc lâm sản/nông sản và số hóa hoàn toàn quy trình hoàn thuế.'
    ],
    leadUnit: 'Cục Thuế & Cục Hải quan',
    cooperatingUnits: ['Văn phòng Bộ', 'Cục Công nghệ Thông tin', 'VCCI'],
    playbook: [
      {
        phase: '1. Kích hoạt Tổ phản ứng nhanh & Phát ngôn chính thống (trong 12 giờ)',
        actions: [
          'Kích hoạt Tổ phản ứng nhanh của Cục Thuế/Hải quan rà soát ngay danh sách các hồ sơ hoàn thuế tồn đọng.',
          'Phát ngôn chính thống làm rõ nguyên nhân (vướng mắc xác minh hay thủ tục), cam kết thời hạn giải quyết cụ thể cho từng nhóm doanh nghiệp.'
        ]
      },
      {
        phase: '2. Tháo gỡ Thực địa & Đối thoại Trực tiếp',
        actions: [
          'Lập đường dây nóng tiếp nhận phản ánh vướng mắc hoàn thuế của doanh nghiệp.',
          'Tổ chức buổi đối thoại trực tiếp giữa Lãnh đạo Cục Thuế với đại diện các hiệp hội ngành nghề có hồ sơ chậm hoàn.'
        ]
      }
    ]
  },

  // 6. Kịch bản CẢNH BÁO NHANH: Điểm nghẽn Giải ngân Đầu tư công & Ngân quỹ KBNN (Chỉ kích hoạt khi CÓ ĐIỂM NGHẼN/CHẬM TRỄ THỰC SỰ)
  {
    id: 'public_investment_bottleneck',
    keywords: [
      'ách tắc giải ngân đầu tư công', 'giải ngân đầu tư công chậm trễ', 'chậm giải ngân đầu tư công nghiêm trọng',
      'thủ tướng phê bình giải ngân chậm', 'bộ tài chính phê bình giải ngân chậm', 'tồn ngân kho bạc cao do chậm giải ngân',
      'nghẽn dòng vốn đầu tư công', 'chậm thanh toán vốn đầu tư công kéo dài', 'nguy cơ không đạt kế hoạch giải ngân',
      'vướng mắc nghiêm trọng giải ngân'
    ],
    contextTheme: 'Tiến độ giải ngân vốn đầu tư công bị ách tắc nghiêm trọng, chậm trễ kéo dài hoặc bị Lãnh đạo Chính phủ/Bộ phê bình nhắc nhở.',
    underlyingRisk: 'Áp lực chỉ trích về quy trình kiểm soát chi, thủ tục giải ngân và yêu cầu tháo gỡ cơ chế phân bổ vốn để kích thích tăng trưởng kinh tế.',
    velocityRiskProfile: 'Tần suất xuất hiện cao trong các kỳ họp Quốc hội, phiên họp Chính phủ và các bài viết phân tích vĩ mô chuyên sâu.',
    impactDomain: 'Hiệu quả sử dụng vốn ngân sách nhà nước, tăng trưởng GDP và thanh khoản của các nhà thầu thi công hạ tầng.',
    escalationTrigger: 'Thủ tướng Chính phủ hoặc Lãnh đạo cấp cao phê bình các đơn vị giải ngân chậm dưới mức bình quân.',
    defaultAlertLevel: 'RAPID',
    reputationRiskLevel: 65,
    blameRiskLevel: 70,
    petitionRiskLevel: 80,
    investorBizImpactLevel: 75,
    samplePetitions: [
      'Kiến nghị phân cấp, ủy quyền mạnh mẽ hơn cho chủ đầu tư trong điều chuyển vốn dự án chậm sang dự án có tiến độ tốt.',
      'Đơn giản hóa hồ sơ thanh toán tạm ứng và thanh toán khối lượng hoàn thành qua Dịch vụ công trực tuyến KBNN.'
    ],
    leadUnit: 'Cục Quản lý Ngân quỹ (KBNN) & Vụ Đầu tư',
    cooperatingUnits: ['Văn phòng Bộ', 'Cục Quản lý Nợ & TCĐN', 'Bộ Kế hoạch và Đầu tư (phối hợp)'],
    playbook: [
      {
        phase: '1. Khẩn trương Rà soát & Công khai Số liệu (trong 12 giờ)',
        actions: [
          'Công khai tiến độ giải ngân từng ngày qua Cổng Thông tin KBNN, phân loại rõ trách nhiệm do chủ đầu tư hay thủ tục.',
          'Đẩy mạnh kiểm soát chi điện tử "3 không" (Không giấy tờ, Không tiền mặt, Không tiếp xúc trực tiếp).'
        ]
      },
      {
        phase: '2. Tác chiến Thực địa & Tháo gỡ Vướng mắc',
        actions: [
          'Thành lập các Tổ công tác kiểm tra, đôn đốc trực tiếp tại các địa phương có tỷ lệ giải ngân thấp.',
          'Tham mưu văn bản chỉ đạo cho phép thanh toán linh hoạt cho các hạng mục đã hoàn thành nghiệm thu từng phần.'
        ]
      }
    ]
  },

  // 7. Kịch bản CẢNH BÁO NHANH: Thuế TMĐT, Livestream & Hóa đơn Điện tử
  {
    id: 'ecommerce_tax_invoicing',
    keywords: [
      'thuế tmđt', 'thuế thương mại điện tử', 'truy thu thuế online', 'nghĩa vụ thuế online',
      'kê khai thuế livestream', 'thuế livestream', 'thuế bán hàng online', 'thuế shopee', 'thuế tiktok',
      'gian lận hóa đơn điện tử', 'chặn hóa đơn điện tử', 'truy thu thuế bán hàng'
    ],
    contextTheme: 'Ngành thuế đẩy mạnh thanh tra, truy thu thuế đối với hoạt động kinh doanh trên sàn TMĐT, mạng xã hội và chuyển đổi số hóa đơn.',
    underlyingRisk: 'Người kinh doanh online, hộ kinh doanh phản ánh lúng túng về quy định kê khai, e ngại bị truy thu bất ngờ hoặc gặp vướng mắc kỹ thuật.',
    velocityRiskProfile: 'Lan truyền bùng nổ trên mạng xã hội với hàng nghìn bình luận, chia sẻ kinh nghiệm và lo ngại của cộng đồng kinh doanh online.',
    impactDomain: 'Hàng triệu hộ kinh doanh cá thể, người bán hàng số và trật tự quản lý thuế trong nền kinh tế số.',
    escalationTrigger: 'Xuất hiện các vụ việc truy thu số tiền lớn kèm thông tin gây hoang mang về việc phong tỏa tài khoản ngân hàng.',
    defaultAlertLevel: 'RAPID',
    reputationRiskLevel: 45,
    blameRiskLevel: 55,
    petitionRiskLevel: 85,
    investorBizImpactLevel: 75,
    samplePetitions: [
      'Đề nghị cơ quan thuế ban hành cẩm nang infographic hướng dẫn từng bước kê khai thuế TMĐT trên ứng dụng eTax Mobile.',
      'Kiến nghị mở đợt hướng dẫn tự nguyện kê khai không phạt chậm nộp cho các cá nhân kinh doanh chưa nắm rõ quy định.'
    ],
    leadUnit: 'Cục Thuế (Cục Thuế Doanh nghiệp Nhỏ & Hộ kinh doanh)',
    cooperatingUnits: ['Cục Công nghệ Thông tin', 'Văn phòng Bộ', 'Cục Thương mại Điện tử'],
    playbook: [
      {
        phase: '1. Kích hoạt Phản ứng Nhanh & Phát ngôn Hướng dẫn (trong 12 giờ)',
        actions: [
          'Sản xuất video ngắn 60s và infographic hướng dẫn tra cứu, kê khai thuế trên eTax Mobile.',
          'Tổ chức chương trình "Đồng hành cùng người nộp thuế số" giải đáp trực tuyến 24/7.'
        ]
      }
    ]
  },

  // 8. Kịch bản CẢNH BÁO KHẨN CẤP: Chỉ đạo Hỏa tốc của Lãnh đạo Chính phủ / Thủ tướng
  {
    id: 'prime_minister_urgent_directive',
    keywords: [
      'chỉ đạo hỏa tốc', 'thủ tướng chỉ đạo khẩn', 'công điện hỏa tốc', 'công điện khẩn',
      'chỉ đạo nóng của thủ tướng', 'văn bản hỏa tốc', 'chính phủ yêu cầu xử lý khẩn cấp'
    ],
    contextTheme: 'Thủ tướng Chính phủ hoặc Lãnh đạo Chính phủ ban hành Công điện hỏa tốc hoặc văn bản chỉ đạo khẩn cấp yêu cầu Bộ Tài chính xử lý ngay vấn đề nóng.',
    underlyingRisk: 'Vấn đề đã vượt cấp thành nhiệm vụ chính trị tối khẩn cấp, đòi hỏi phản ứng tức thời với kỷ luật hành chính nghiêm ngặt.',
    velocityRiskProfile: 'Phát sóng hỏa tốc trên VTV1, Cổng TTĐT Chính phủ và toàn bộ các cơ quan thông tấn báo chí quốc gia.',
    impactDomain: 'Trách nhiệm giải trình trực tiếp của Bộ trưởng và Ban Cán sự Đảng Bộ Tài chính trước Thủ tướng Chính phủ.',
    escalationTrigger: 'Văn bản hỏa tốc ấn định thời hạn báo cáo kết quả trong vòng 24 - 48 giờ.',
    defaultAlertLevel: 'EMERGENCY',
    reputationRiskLevel: 90,
    blameRiskLevel: 85,
    petitionRiskLevel: 85,
    investorBizImpactLevel: 90,
    samplePetitions: [
      'Yêu cầu thực hiện nghiêm chỉ đạo hỏa tốc của Thủ tướng Chính phủ, báo cáo kết quả trước thời hạn quy định.'
    ],
    leadUnit: 'Văn phòng Bộ Tài chính & Đơn vị phụ trách lĩnh vực được chỉ đạo',
    cooperatingUnits: ['Thanh tra Bộ', 'Vụ Pháp chế', 'Văn phòng Chính phủ'],
    playbook: [
      {
        phase: '1. Kích hoạt Báo cáo Khẩn cấp & Họp Khẩn (trong 1 - 2 giờ)',
        actions: [
          'Báo cáo khẩn cấp Bộ trưởng và các Thứ trưởng phụ trách lĩnh vực.',
          'Triệu tập cuộc họp khẩn với các đơn vị liên quan để phân công xử lý theo từng nội dung chỉ đạo.',
          'Phát đi thông cáo báo chí hỏa tốc khẳng định quyết tâm triển khai nghiêm túc chỉ đạo của Thủ tướng.'
        ]
      }
    ]
  },

  // 9. Kịch bản CẢNH BÁO KHẨN CẤP: Sự cố Pháp lý Nghiêm trọng / Khởi tố Cán bộ / Sai phạm Lớn
  {
    id: 'legal_investigation_emergency',
    keywords: [
      'khởi tố cán bộ', 'bắt tạm giam cán bộ', 'sai phạm nghiêm trọng tại bộ', 'cán bộ thuế bị bắt',
      'cán bộ hải quan bị bắt', 'đại án gian lận', 'khởi tố vụ án tại bộ tài chính', 'thanh tra chính phủ kết luận sai phạm lớn',
      'đe dọa an toàn hệ thống tài chính'
    ],
    contextTheme: 'Cơ quan Cảnh sát điều tra khởi tố vụ án, bắt giam cán bộ ngành Tài chính hoặc thanh tra phát hiện sai phạm đặc biệt nghiêm trọng.',
    underlyingRisk: 'Nguy cơ bùng phát khủng hoảng truyền thông nghiêm trọng, ảnh hưởng trực tiếp đến uy tín ngành Tài chính và kỷ cương thực thi công vụ.',
    velocityRiskProfile: 'Bùng nổ cực nhanh trên toàn bộ các kênh truyền thông chính thống và mạng xã hội (Viral Spike).',
    impactDomain: 'Uy tín chính trị của Lãnh đạo Bộ, hình ảnh ngành Tài chính và trật tự kỷ cương hành chính.',
    escalationTrigger: 'Báo chí giật tít về quy mô vụ án hoặc liên đới đến các vị trí quản lý lãnh đạo.',
    defaultAlertLevel: 'EMERGENCY',
    reputationRiskLevel: 95,
    blameRiskLevel: 90,
    petitionRiskLevel: 85,
    investorBizImpactLevel: 85,
    samplePetitions: [
      'Yêu cầu làm rõ trách nhiệm quản lý của người đứng đầu đơn vị để xảy ra sai phạm.',
      'Khẩn trương rà soát, bịt lỗ hổng quy trình nghiệp vụ để không tái diễn vụ việc tương tự.'
    ],
    leadUnit: 'Thanh tra Bộ Tài chính & Văn phòng Bộ',
    cooperatingUnits: ['Vụ Tổ chức cán bộ', 'Cục Thuế / Cục Hải quan liên quan', 'Cơ quan Điều tra'],
    playbook: [
      {
        phase: '1. Kích hoạt Quy trình Khẩn cấp (trong vòng 1 - 2 giờ)',
        actions: [
          'Báo cáo khẩn cấp Bộ trưởng và Ban Cán sự Đảng Bộ Tài chính.',
          'Tạm đình chỉ công tác cán bộ vi phạm và phối hợp tuyệt đối với cơ quan điều tra làm rõ sự thật.',
          'Ban hành Thông cáo báo chí hỏa tốc khẳng định quan điểm: "Xử lý nghiêm minh, không có vùng cấm, không có ngoại lệ".'
        ]
      }
    ]
  },

  // 10. Kịch bản CẢNH BÁO KHẨN CẤP: Sai phạm Quỹ Bình ổn giá (BOG) Xăng dầu / Nhận hối lộ / Vụ án Xuyên Việt Oil (Đặng Công Khôi - Cục Quản lý giá)
  {
    id: 'bog_fund_xuyen_viet_oil_corruption_emergency',
    keywords: [
      'đặng công khôi', 'cục quản lý giá', 'quỹ bog', 'quỹ bình ổn giá', 'xuyên việt oil', 'mai thị hồng hạnh',
      'hối lộ', 'nhận hối lộ', 'biết doanh nghiệp sai nhưng không xử lý', 'chiếm dụng quỹ bog', 'chiếm dụng trái phép',
      'phó cục trưởng cục quản lý giá', 'phòng giá hàng tư liệu sản xuất', 'kết luận điều tra vụ xuyên việt', 'đinh tiến dũng kế toán trưởng'
    ],
    contextTheme: 'Kết luận điều tra đại án Xuyên Việt Oil: Bị can Đặng Công Khôi (cựu Phó Cục trưởng Cục Quản lý giá, Bộ Tài chính) bị cáo buộc biết rõ sai phạm của doanh nghiệp không nộp tiền Quỹ BOG xăng dầu nhưng nhận hối lộ 20.000 USD nên không chỉ đạo kiểm tra, xử lý, gián tiếp tạo điều kiện cho doanh nghiệp chiếm dụng hàng trăm tỷ đồng Quỹ BOG.',
    underlyingRisk: 'Khủng hoảng truyền thông cực kỳ nghiêm trọng, chạm trực tiếp vào cơ chế quản lý Quỹ Bình ổn giá xăng dầu do Bộ Tài chính và Bộ Công Thương đồng quản lý; dư luận xã hội bức xúc vì tiền Quỹ BOG (nguồn tiền đóng góp của nhân dân qua giá xăng dầu) bị chiếm dụng do cán bộ thoái hóa biến chất buông lỏng quản lý.',
    velocityRiskProfile: 'Đột biến lan truyền khẩn cấp (Viral Spike) trên 100% cơ quan báo chí chính luận (VnExpress, Tuổi Trẻ, Thanh Niên, Báo CAND, Tiền Phong, Dân Trí...) và mạng xã hội.',
    impactDomain: 'Uy tín đặc biệt nghiêm trọng của Cục Quản lý giá, tính minh bạch của công cụ quản lý Quỹ BOG, niềm tin của người dân vào kỷ cương quản lý nhà nước về giá và năng lượng.',
    escalationTrigger: 'Khi Cơ quan An ninh điều tra / Cơ quan Cảnh sát điều tra Bộ Công an công bố Kết luận điều tra hoặc Viện KSND Tối cao ban hành Cáo trạng truy tố.',
    defaultAlertLevel: 'EMERGENCY',
    reputationRiskLevel: 98,
    blameRiskLevel: 96,
    petitionRiskLevel: 94,
    investorBizImpactLevel: 92,
    samplePetitions: [
      'Kiến nghị Bộ Tài chính rà soát toàn diện và công khai minh bạch số dư, việc trích lập và sử dụng Quỹ Bình ổn giá (BOG) tại tất cả các thương nhân đầu mối xăng dầu trên cả nước.',
      'Đề nghị Chính phủ và Quốc hội xem xét sửa đổi căn bản Nghị định về kinh doanh xăng dầu, cân nhắc xóa bỏ hoặc thay đổi cơ chế quản lý Quỹ BOG để tránh lỗ hổng tham nhũng.',
      'Yêu cầu xử lý nghiêm minh toàn bộ tập thể, cá nhân có liên quan tại Cục Quản lý giá theo đúng Kết luận điều tra của Bộ Công an.'
    ],
    leadUnit: 'Thanh tra Bộ Tài chính, Cục Quản lý Giá & Văn phòng Bộ',
    cooperatingUnits: ['Vụ Pháp chế', 'Bộ Công Thương (phối hợp)', 'Cơ quan Cảnh sát Điều tra Bộ Công an'],
    playbook: [
      {
        phase: '1. Kích hoạt Phản ứng Khẩn cấp & Báo cáo Lãnh đạo Bộ (trong vòng 1 - 2 giờ)',
        actions: [
          'Báo cáo khẩn cấp Bộ trưởng và Ban Cán sự Đảng Bộ Tài chính về các nội dung liên quan trong Kết luận điều tra.',
          'Phối hợp cung cấp đầy đủ tài liệu, hồ sơ kiểm tra Quỹ BOG theo yêu cầu của Cơ quan điều tra.',
          'Ban hành Thông cáo báo chí hỏa tốc khẳng định quan điểm nhất quán: "Kiên quyết xử lý nghiêm minh cán bộ sai phạm, không có vùng cấm, không bao che, đồng thời khẩn trương rà soát bịt kín lỗ hổng cơ chế quản lý".'
        ]
      },
      {
        phase: '2. Rà soát Toàn diện Quỹ BOG & Hoàn thiện Thể chế (24 - 48 giờ)',
        actions: [
          'Chỉ đạo Cục Quản lý giá khẩn trương kiểm tra, rà soát lại số dư tài khoản Quỹ BOG tại 100% các doanh nghiệp đầu mối xăng dầu, yêu cầu ngân hàng thương mại sao kê định kỳ bắt buộc.',
          'Chủ động phối hợp với Bộ Công Thương tham mưu Chính phủ sửa đổi Nghị định kinh doanh xăng dầu, thiết lập cơ chế giám sát dòng tiền tự động qua hệ thống ngân hàng.'
        ]
      }
    ]
  },

  // 11. Kịch bản CẢNH BÁO SỚM/NHANH: Ách tắc Đấu thầu Mua sắm Công & Dự án PPP (Nghị định 376 - Cục Quản lý đấu thầu)
  {
    id: 'bidding_ppp_infrastructure_bottleneck',
    keywords: [
      'ách tắc đấu thầu', 'tiêu chí cài cắm', 'thông thầu', 'hủy thầu', 'đấu thầu thuốc',
      'đấu thầu vật tư y tế', 'khiếu nại kết quả mở thầu', 'chậm lựa chọn nhà thầu',
      'cục quản lý đấu thầu', 'dự án ppp', 'đối tác công tư', 'trúng thầu sát giá'
    ],
    contextTheme: 'Phản ánh vướng mắc trong tổ chức đấu thầu mua sắm công, ách tắc đấu thầu thuốc, vật tư y tế hoặc khiếu nại tiêu chí cài cắm trong hồ sơ mời thầu thuộc thẩm quyền Cục Quản lý đấu thầu (Bộ Tài chính).',
    underlyingRisk: 'Nguy cơ gián đoạn cung ứng thuốc/vật tư y tế tại các bệnh viện công, chậm tiến độ các dự án PPP hạ tầng giao thông hoặc phát sinh tranh chấp khiếu nại đấu thầu kéo dài.',
    velocityRiskProfile: 'Lan tỏa nhanh trên các báo điện tử chuyên ngành và mạng xã hội khi liên quan đến quyền lợi khám chữa bệnh của người dân hoặc các gói thầu hạ tầng quy mô lớn.',
    impactDomain: 'Hệ thống y tế công lập, các nhà thầu, doanh nghiệp dự án PPP và người dân thụ hưởng dịch vụ công.',
    escalationTrigger: 'Khi nhiều bệnh viện đồng loạt báo cáo nguy cơ thiếu thuốc hoặc các nhà thầu gửi đơn khiếu nại tập thể lên Bộ Tài chính.',
    defaultAlertLevel: 'EARLY',
    reputationRiskLevel: 60,
    blameRiskLevel: 65,
    petitionRiskLevel: 75,
    investorBizImpactLevel: 70,
    samplePetitions: [
      'Kiến nghị Cục Quản lý đấu thầu khẩn trương hướng dẫn thống nhất quy trình lập hồ sơ mời thầu mua sắm thuốc, vật tư y tế tập trung.',
      'Đề nghị thanh tra, kiểm tra việc cài cắm tiêu chí hạn chế nhà thầu tại một số gói thầu xây lắp giao thông trọng điểm.'
    ],
    leadUnit: 'Cục Quản lý đấu thầu (Bộ Tài chính)',
    cooperatingUnits: ['Bộ Y tế (phối hợp)', 'Thanh tra Bộ Tài chính', 'Cục Công nghệ Thông tin'],
    playbook: [
      {
        phase: '1. Kích hoạt Rà soát Hồ sơ & Ban hành Hướng dẫn Nghiệp vụ (trong 24 giờ)',
        actions: [
          'Chỉ đạo Cục Quản lý đấu thầu kiểm tra ngay tính chuẩn hóa của hồ sơ mời thầu trên Hệ thống mạng đấu thầu quốc gia.',
          'Ban hành công văn hướng dẫn nghiệp vụ tháo gỡ vướng mắc trong phân nhóm và tiêu chí đánh giá gói thầu thuốc/thiết bị.',
          'Phối hợp với cơ quan báo chí giải thích rõ quy định pháp luật về đấu thầu để ổn định tâm lý các đơn vị mua sắm.'
        ]
      }
    ]
  },

  // 12. Kịch bản CẢNH BÁO SỚM: Bức xúc Nợ đọng BHXH, Trốn đóng Bảo hiểm & Trục lợi BHYT (Nghị định 376 - BHXH Việt Nam)
  {
    id: 'social_security_insurance_debt',
    keywords: [
      'trốn đóng bhxh', 'nợ đọng bhxh', 'chậm đóng bhxh', 'trục lợi quỹ bhyt', 'bảo hiểm xã hội việt nam',
      'nợ bảo hiểm kéo dài', 'quyền lợi người lao động bị treo do nợ bảo hiểm', 'mất cân đối quỹ bhxh',
      'bhxh việt nam', 'rút bhxh một lần'
    ],
    contextTheme: 'Phản ánh tình trạng doanh nghiệp trốn đóng, nợ đọng BHXH, BHYT kéo dài khiến người lao động không được chốt sổ hoặc trục lợi quỹ khám chữa bệnh BHYT thuộc phạm vi cơ quan BHXH Việt Nam trực thuộc Bộ Tài chính.',
    underlyingRisk: 'Bức xúc xã hội lan rộng ảnh hưởng trực tiếp đến an sinh xã hội của hàng triệu công nhân lao động; nguy cơ người lao động tụ tập khiếu kiện đòi quyền lợi sổ BHXH và chế độ ốm đau, thai sản.',
    velocityRiskProfile: 'Tốc độ lan truyền cao trên các diễn đàn công nhân, công đoàn và mạng xã hội lao động.',
    impactDomain: 'Hàng chục triệu người tham gia BHXH, tổ chức công đoàn và sự bền vững của quỹ an sinh quốc gia.',
    escalationTrigger: 'Khi phát sinh các vụ việc doanh nghiệp phá sản/chủ bỏ trốn để lại số nợ BHXH hàng trăm tỷ đồng.',
    defaultAlertLevel: 'EARLY',
    reputationRiskLevel: 65,
    blameRiskLevel: 70,
    petitionRiskLevel: 80,
    investorBizImpactLevel: 60,
    samplePetitions: [
      'Kiến nghị Bảo hiểm xã hội Việt Nam và Cục Thuế phối hợp cưỡng chế hóa đơn, phong tỏa tài khoản doanh nghiệp chây ỳ nợ BHXH.',
      'Đề nghị có cơ chế đặc thù giải quyết quyền lợi thai sản, ốm đau cho người lao động tại các doanh nghiệp có chủ bỏ trốn.'
    ],
    leadUnit: 'Bảo hiểm xã hội Việt Nam (Đơn vị đặc thù thuộc Bộ Tài chính)',
    cooperatingUnits: ['Cục Thuế', 'Thanh tra Bộ Tài chính', 'Tổng Liên đoàn Lao động Việt Nam'],
    playbook: [
      {
        phase: '1. Khẩn trương Phối hợp Thanh tra Liên ngành & Giải thích Chính sách (trong 24-48 giờ)',
        actions: [
          'Chỉ đạo Bảo hiểm xã hội Việt Nam rà soát danh sách các doanh nghiệp nợ đọng lớn trên 6 tháng, công khai danh tính trên Cổng TTĐT.',
          'Phối hợp với cơ quan Công an và Thanh tra Bộ chuyển hồ sơ các đơn vị có dấu hiệu trốn đóng theo Điều 216 Bộ luật Hình sự.',
          'Công bố đường dây nóng tiếp nhận phản ánh và hướng dẫn người lao động tra cứu quá trình đóng BHXH trên ứng dụng VssID.'
        ]
      }
    ]
  },

  // 13. Kịch bản CẢNH BÁO SỚM: Vướng mắc Cấp phép FDI, Thu hút Vốn ngoại & Nguy cơ Chuyển giá (Nghị định 376 - Cục Đầu tư nước ngoài)
  {
    id: 'foreign_investment_fdi_transfer_pricing',
    keywords: [
      'vướng mắc cấp phép fdi', 'chuyển giá trốn thuế', 'giải ngân vốn fdi', 'cục đầu tư nước ngoài',
      'thanh tra doanh nghiệp fdi', 'chuyển giá fdi', 'thu hút fdi sụt giảm', 'vốn fdi sụt giảm',
      'ưu đãi thuế fdi', 'chứng nhận đăng ký đầu tư'
    ],
    contextTheme: 'Phản ánh vướng mắc về thủ tục đăng ký đầu tư FDI, tranh cãi về áp dụng thuế tối thiểu toàn cầu hoặc các dấu hiệu chuyển giá, báo lỗ liên tục của tập đoàn đa quốc gia nhằm né nghĩa vụ tài chính.',
    underlyingRisk: 'Ảnh hưởng đến môi trường đầu tư kinh doanh quốc tế của Việt Nam hoặc gây thất thu lớn cho ngân sách nhà nước qua các thủ thuật chuyển giá tinh vi.',
    velocityRiskProfile: 'Lan tỏa trên các diễn đàn kinh tế quốc tế, báo đầu tư, VCCI và các phòng thương mại nước ngoài (AmCham, EuroCham, KorCham).',
    impactDomain: 'Cộng đồng doanh nghiệp có vốn đầu tư nước ngoài, các khu công nghiệp và nguồn thu ngân sách từ khu vực FDI.',
    escalationTrigger: 'Khi các hiệp hội nhà đầu tư nước ngoài gửi thư kiến nghị tập thể lên Lãnh đạo Chính phủ.',
    defaultAlertLevel: 'EARLY',
    reputationRiskLevel: 55,
    blameRiskLevel: 50,
    petitionRiskLevel: 70,
    investorBizImpactLevel: 80,
    samplePetitions: [
      'Đề nghị Cục Đầu tư nước ngoài phối hợp Cục Thuế hướng dẫn chi tiết cơ chế bù trừ ưu đãi sau khi áp dụng Thuế tối thiểu toàn cầu (Pillar 2).',
      'Kiến nghị rút ngắn thời gian xử lý hồ sơ điều chỉnh dự án đầu tư và cấp Giấy chứng nhận đăng ký đầu tư.'
    ],
    leadUnit: 'Cục Đầu tư nước ngoài (Bộ Tài chính)',
    cooperatingUnits: ['Cục Thuế', 'Vụ Quản lý các khu kinh tế', 'Cục Hải quan'],
    playbook: [
      {
        phase: '1. Đối thoại Trực tiếp & Rà soát Cơ chế Ưu đãi (trong 48 giờ)',
        actions: [
          'Chủ trì cuộc họp đối thoại với các hiệp hội doanh nghiệp FDI để nắm bắt cụ thể các điểm nghẽn thủ tục.',
          'Phối hợp với Cục Thuế ban hành hướng dẫn thực thi về chính sách hỗ trợ bổ sung cho nhà đầu tư chiến lược.',
          'Tăng cường các giải pháp xúc tiến đầu tư có chọn lọc, công khai quy trình thẩm định trên Cổng thông tin quốc gia.'
        ]
      }
    ]
  },

  // 14. Kịch bản CẢNH BÁO SỚM: Tranh cãi Dữ liệu Thống kê Quốc gia, Tính toán CPI & GDP Vĩ mô (Nghị định 376 - Cục Thống kê)
  {
    id: 'statistics_macro_cpi_gdp_discrepancy',
    keywords: [
      'cục thống kê', 'tổng cục thống kê', 'sai lệch số liệu thống kê', 'tính toán cpi', 'áp lực lạm phát cpi',
      'tranh luận số liệu gdp', 'công bố gdp', 'độ vênh số liệu thống kê', 'dữ liệu thống kê quốc gia',
      'chỉ số giá tiêu dùng'
    ],
    contextTheme: 'Dư luận chuyên gia kinh tế và báo chí thảo luận, phản biện về phương pháp tính toán chỉ số giá tiêu dùng CPI, số liệu tăng trưởng GDP hoặc sự chênh lệch giữa số liệu thống kê công bố với cảm nhận thực tế thị trường.',
    underlyingRisk: 'Làm giảm niềm tin của thị trường và giới quan sát quốc tế vào tính khách quan của dữ liệu vĩ mô Việt Nam, gây khó khăn cho việc hoạch định chính sách tiền tệ và tài khóa.',
    velocityRiskProfile: 'Lan tỏa trong giới học thuật, viện nghiên cứu, chuyên gia phân tích tài chính và các báo chuyên ngành kinh tế.',
    impactDomain: 'Nhà đầu tư thị trường vốn, các tổ chức quốc tế (WB, IMF, ADB) và cơ quan điều hành vĩ mô.',
    escalationTrigger: 'Khi các định chế tài chính quốc tế hoặc báo chí đưa ra các ước tính độc lập chênh lệch lớn so với số liệu chính thức.',
    defaultAlertLevel: 'EARLY',
    reputationRiskLevel: 50,
    blameRiskLevel: 55,
    petitionRiskLevel: 60,
    investorBizImpactLevel: 65,
    samplePetitions: [
      'Đề nghị Cục Thống kê công khai minh bạch hơn về rổ hàng hóa tính CPI và phương pháp thu thập giá thực tế.',
      'Kiến nghị cập nhật định kỳ năm gốc tính toán chỉ tiêu GDP để phản ánh đầy đủ quy mô nền kinh tế số.'
    ],
    leadUnit: 'Cục Thống kê (Bộ Tài chính) & Cục Quản lý giá',
    cooperatingUnits: ['Viện Chiến lược và Chính sách tài chính', 'Vụ Ngân sách nhà nước', 'Văn phòng Bộ'],
    playbook: [
      {
        phase: '1. Họp Báo Chuyên đề Giải trình Phương pháp & Dữ liệu (trong 24-48 giờ)',
        actions: [
          'Chỉ đạo Cục Thống kê tổ chức họp báo hoặc phát hành thông cáo chuyên đề giải thích chi tiết phương pháp luận chuẩn quốc tế.',
          'Mời các chuyên gia kinh tế độc lập tham gia tọa đàm phân tích đa chiều về diễn biến các cấu phần của chỉ số CPI/GDP.',
          'Đồng bộ dữ liệu thống kê với Cổng dữ liệu mở của Bộ Tài chính để người dân và doanh nghiệp dễ dàng tiếp cận.'
        ]
      }
    ]
  },

  // 15. Kịch bản CẢNH BÁO XA: Phản biện Quy hoạch Phát triển KT-XH & Chiến lược Vùng (Nghị định 376 - Vụ Quản lý quy hoạch)
  {
    id: 'socioeconomic_planning_regional_strategy',
    keywords: [
      'quy hoạch tổng thể quốc gia', 'quy hoạch vùng', 'kế hoạch phát triển kinh tế xã hội',
      'vụ quản lý quy hoạch', 'quy hoạch tỉnh', 'phản biện quy hoạch', 'điều chỉnh quy hoạch'
    ],
    contextTheme: 'Các địa phương, hiệp hội và chuyên gia phản ánh sự chồng chéo giữa quy hoạch phát triển kinh tế - xã hội của tỉnh/vùng với quy hoạch ngành, hoặc đề xuất điều chỉnh chỉ tiêu phát triển trung hạn.',
    underlyingRisk: 'Chậm trễ trong phê duyệt các dự án đầu tư theo quy hoạch, nguy cơ phân tán nguồn lực ngân sách nhà nước do các quy hoạch thiếu tính liên kết vùng.',
    velocityRiskProfile: 'Lan tỏa ở mức độ vừa trên các diễn đàn hội thảo khoa học, báo kinh tế - đô thị (V = 0.25).',
    impactDomain: 'Chiến lược phát triển vùng, không gian kinh tế địa phương và kế hoạch phân bổ vốn đầu tư công trung hạn (I = 0.6).',
    escalationTrigger: 'Khi nhiều địa phương cùng kiến nghị điều chỉnh quy hoạch để tháo gỡ cho các dự án bất động sản và công nghiệp.',
    defaultAlertLevel: 'DISTANT',
    reputationRiskLevel: 35,
    blameRiskLevel: 30,
    petitionRiskLevel: 45,
    investorBizImpactLevel: 50,
    samplePetitions: [
      'Kiến nghị Vụ Quản lý quy hoạch hướng dẫn trình tự rà soát, xử lý mâu thuẫn giữa quy hoạch tỉnh và quy hoạch vùng.',
      'Đề xuất phân cấp thẩm quyền điều chỉnh cục bộ quy hoạch phát triển kinh tế cho địa phương để tạo sự chủ động.'
    ],
    leadUnit: 'Vụ Quản lý quy hoạch & Viện Chiến lược và Chính sách tài chính',
    cooperatingUnits: ['Vụ Đầu tư và Phát triển hạ tầng', 'Vụ Quản lý các khu kinh tế', 'Văn phòng Bộ'],
    playbook: [
      {
        phase: '1. Tiếp thu & Hoàn thiện Hướng dẫn Quy hoạch (trong 3-5 ngày)',
        actions: [
          'Tổng hợp các kiến nghị của địa phương về điểm nghẽn quy hoạch để xây dựng cẩm nang hướng dẫn xử lý chồng chéo.',
          'Chủ động làm việc với các Bộ ngành liên quan để rà soát tích hợp các quy hoạch chuyên ngành.',
          'Cung cấp thông tin tiến độ triển khai quy hoạch tổng thể quốc gia cho các cơ quan thông tấn báo chí.'
        ]
      }
    ]
  }
];

/**
 * Đánh giá Khoảng trống Thông tin & Bộ lọc Cảnh báo 2 Bước (Information Vacuum Gatekeeper)
 * 
 * QUY TẮC CỐT LÕI TỪ LÃNH ĐẠO:
 * 1. Một tin được cảnh báo khi: Nó là KHOẢNG TRỐNG THÔNG TIN rồi mới cảnh báo các mức từ Xa đến Khẩn cấp.
 * 2. Có những KHOẢNG TRỐNG THÔNG TIN nhưng CHƯA ĐẾN MỨC CẢNH BÁO (Chỉ theo dõi nhịp độ thường nhật, không kích hoạt báo động).
 * 3. Tin tức có thông tin chính sách đầy đủ, minh bạch, hoạt động thường quy -> KHÔNG CÓ KHOẢNG TRỐNG -> KHÔNG CẢNH BÁO.
 */
export function evaluateInformationVacuum(
  item: ScrapedNewsItem,
  fullText: string,
  isRoutineGovernance: boolean,
  isEnforcement: boolean,
  calculatedRiskScore: number,
  criteriaPassedCount: number,
  matchedPattern: ContextPattern | null
): InformationVacuumAssessment {
  // 0. BỘ LỌC CHẶN TIN THỊ TRƯỜNG THƯỜNG NHẬT (Pure Routine Market Ticker Filter)
  // Loại bỏ hoàn toàn giá vàng hôm nay, tỷ giá USD/VND, diễn biến phiên VN-Index, giá xăng dầu...
  const isPureMarket = isPureRoutineMarketUpdate(fullText);
  if (isPureMarket) {
    return {
      hasGap: false,
      gapLevel: 'MARKET_DIGEST',
      gapLevelLabelVi: 'Điểm tin Thị trường Thuần túy — Diễn biến Khách quan (Không cảnh báo)',
      isAlertWarranted: false,
      whyNoAlertYet: 'Bản chất là biến động chỉ số, giá vàng hoặc tỷ giá giao dịch thường nhật khách quan của thị trường tài chính, không ảnh hưởng đến trách nhiệm hay thẩm quyền quản lý nhà nước của Bộ Tài chính.',
      gapDetails: 'Thông tin thị trường thường nhật, không tồn tại khoảng trống thông tin chính sách.',
      publicConfusionRisk: 'Không có nguy cơ khủng hoảng truyền thông hay hiểu lầm chính sách đối với cơ quan quản lý nhà nước.',
      recommendedClosureAction: 'Xếp vào Bảng điểm tin thị trường tham khảo thường nhật; không kích hoạt cảnh báo truyền thông và không tính vào danh mục cần can thiệp.'
    };
  }

  // 0b. ĐỐI SOÁT CHUẨN XÁC THEO NGHỊ ĐỊNH 376/2026/NĐ-CP (CẨM NANG 100 TÌNH HUỐNG THỰC CHIẾN)
  const d376 = Decree376ClassificationEngine.classify(item);
  if (d376) {
    if (d376.isExcluded || d376.tier === 0) {
      return {
        hasGap: false,
        gapLevel: 'NO_GAP',
        gapLevelLabelVi: `Mức 0: Không có khoảng trống thông tin — ${d376.classificationReason}`,
        isAlertWarranted: false,
        whyNoAlertYet: d376.classificationReason,
        gapDetails: d376.natureOfInformationVacuum || 'Thông tin chính sách đã hoàn thiện đầy đủ căn cứ hoặc thuộc thẩm quyền bộ ngành khác.',
        publicConfusionRisk: 'Không phát sinh rủi ro truyền thông hay hiểu lầm chính sách đối với Bộ Tài chính.',
        recommendedClosureAction: d376.actionScriptVi || 'Lưu kho dữ liệu truyền thông thường nhật.'
      };
    }

    if (d376.tier === 3) {
      return {
        hasGap: true,
        gapLevel: 'GAP_EMERGENCY_ALERT',
        gapLevelLabelVi: `Khoảng trống thông tin Cấp 3 — Cảnh Báo Gấp (SOP Cấp 4: Khẩn cấp)`,
        isAlertWarranted: true,
        issueConcern: d376.matchedScenario?.title || d376.classificationReason,
        clarificationNeeded: `Cảnh báo khẩn: Cần phát ngôn/bác bỏ tin đồn/xử lý ngay trong khung giờ vàng ${d376.emergencyPlaybook?.goldenHourTiming || '2–4 giờ'}.`,
        gapDetails: d376.natureOfInformationVacuum,
        publicConfusionRisk: 'Khủng hoảng niềm tin thị trường tài chính hoặc nguy cơ thiệt hại kinh tế quy mô lớn.',
        recommendedClosureAction: d376.actionScriptVi,
        targetedFormats: ['Thông cáo báo chí khẩn cấp', 'Phát biểu chỉ đạo Lãnh đạo Bộ trên VTV1 / Cổng TTĐT Chính phủ', 'Thanh tra đột xuất / Công điện hỏa tốc'],
        actionOwnerUnit: d376.leadAgency.name,
        closingTimeline: d376.emergencyPlaybook?.goldenHourTiming || 'Trong 2-4h'
      };
    }

    if (d376.tier === 2) {
      return {
        hasGap: true,
        gapLevel: 'GAP_RAPID_ALERT',
        gapLevelLabelVi: `Khoảng trống thông tin Cấp 2 — Cảnh Báo Sớm / Nhanh (Ách tắc dòng tiền / Thiệt hại)`,
        isAlertWarranted: true,
        issueConcern: d376.matchedScenario?.title || d376.classificationReason,
        clarificationNeeded: d376.classificationReason,
        gapDetails: d376.natureOfInformationVacuum,
        publicConfusionRisk: 'Nguy cơ tranh chấp kéo dài, chi phí tuân thủ tăng cao hoặc bức xúc dư luận lan rộng.',
        recommendedClosureAction: d376.actionScriptVi,
        targetedFormats: ['Công văn hướng dẫn nghiệp vụ', 'Họp báo chuyên đề', 'Đối thoại trực tiếp với Hiệp hội doanh nghiệp', 'Thông cáo giải đáp báo chí'],
        actionOwnerUnit: d376.leadAgency.name,
        closingTimeline: 'Trong vòng 12h - 24h'
      };
    }

    if (d376.tier === 1) {
      return {
        hasGap: true,
        gapLevel: 'GAP_EARLY_ALERT',
        gapLevelLabelVi: `Khoảng trống thông tin Cấp 1 — Cần Lưu Tâm & Dự Báo Sớm (Hỏi đáp thủ tục / Trực tiếp)`,
        isAlertWarranted: true,
        issueConcern: d376.matchedScenario?.title || d376.classificationReason,
        clarificationNeeded: d376.classificationReason,
        gapDetails: d376.natureOfInformationVacuum,
        publicConfusionRisk: 'Người nộp thuế hiểu sai quy trình, lúng túng khi thực hiện thủ tục hành chính hoặc cần thêm bài phân tích giải thích.',
        recommendedClosureAction: d376.actionScriptVi,
        targetedFormats: ['Infographic quy trình', 'Bài viết Q&A / FAQ', 'Video clip ngắn hướng dẫn', 'Hướng dẫn trên trang Bạn đọc báo chí', 'Bài viết phân tích chuyên sâu tiếp sau'],
        actionOwnerUnit: d376.leadAgency.name,
        closingTimeline: 'Trong vòng 24h - 48h'
      };
    }
  }

  // 1. KIỂM TRA BỘ LỌC KỶ CƯƠNG HÀNH PHÁP / HOẠT ĐỘNG THƯỜNG QUY KHÔNG BỨC XÚC
  // Nếu là hoạt động quản trị nhà nước, công bố luật, hoặc cưỡng chế pháp luật định kỳ hợp lòng dân, không có khiếu nại
  const hasUrgentFrictionKeywords = /than phiền|bức xúc|kêu cứu|kêu khó|làm khó|hạch sách|rườm rà|tốn kém|bị phạt|bị phạt tiền|chậm hoàn thuế|ách tắc|ì ạch|mâu thuẫn|nghi ngờ|chưa rõ|chưa được giải đáp|băn khoăn|nguy cơ thất thoát|vỡ nợ|khởi tố/i.test(fullText);
  
  if ((isRoutineGovernance || isEnforcement) && !hasUrgentFrictionKeywords) {
    return {
      hasGap: false,
      gapLevel: 'NO_GAP',
      gapLevelLabelVi: 'Đầy đủ thông tin chính sách — Không có khoảng trống (Không cảnh báo)',
      isAlertWarranted: false,
      whyNoAlertYet: 'Hoạt động điều hành, ban hành văn bản quy phạm pháp luật hoặc xử lý vi phạm định kỳ đúng quy trình, xã hội đồng thuận, không phát sinh bất cập.',
      gapDetails: 'Nội dung phản ánh thông tin thể chế, quy định pháp luật hoặc hoạt động điều hành thường quy đã được công bố minh bạch và đúng quy trình quản lý nhà nước.',
      publicConfusionRisk: 'Không có nguy cơ phát sinh hiểu lầm hay hoang mang dư luận.',
      recommendedClosureAction: 'Duy trì công tác phổ biến, tuyên truyền chính sách theo kế hoạch định kỳ.'
    };
  }

  // =========================================================================
  // 2. NHẬN DIỆN CÁC TÌNH HUỐNG KHOẢNG TRỐNG THÔNG TIN ĐẶC THÙ NGÀNH TÀI CHÍNH
  // LOGIC CỐT LÕI:
  // Vấn đề A được dư luận/người dân/DN quan tâm/than phiền
  // --> Cảnh báo: Cần làm rõ (thủ tục, mức phí, thời gian làm, mục đích...)
  // --> Đề xuất giải quyết để lấp khoảng trống: Tăng tin bài gì, tổ chức hội thảo gì, công văn hướng dẫn...
  // =========================================================================

  // TÌNH HUỐNG A: Xử lý DN ngừng hoạt động theo Mã số thuế (MST 03-06, đóng/khóa mã số thuế, phạt tiền)
  const isTaxCodeClosureIssue =
    /(mã số thuế|mst|03-06|03\/đk-tct|khóa mã số thuế|đóng mã số thuế|khôi phục mã số thuế|chấm dứt mã số thuế|chấm dứt hiệu lực mã số thuế|xử lý mã số thuế)/i.test(fullText) &&
    /(rườm rà|tốn kém|than phiền|băn khoăn|kêu khó|chưa rõ|chưa được giải đáp|bị phạt|chi phí tốn kém|mức phạt|vướng mắc|lúng túng|tiền chậm nộp|nghĩa vụ khi|bỏ không nhiều năm|làm sạch)/i.test(fullText);

  if (isTaxCodeClosureIssue) {
    return {
      hasGap: true,
      gapLevel: 'GAP_EARLY_ALERT',
      gapLevelLabelVi: 'Khoảng trống thông tin Cấp 1 — Cần Lưu Tâm & Dự Báo Sớm',
      isAlertWarranted: true,
      issueConcern: 'Thủ tục xử lý doanh nghiệp và hộ kinh doanh đã ngừng hoạt động theo mã số thuế (mẫu 03-06) còn rườm rà, kinh phí tốn kém, bị phạt tiền cao; người dân và doanh nghiệp than phiền nhiều điểm chưa rõ ràng, chưa được giải đáp kịp thời.',
      clarificationNeeded: 'Cảnh báo: Cần khẩn trương làm rõ: (1) Quy trình thủ tục chuẩn từng bước; (2) Mức phí và các khung chế tài phạt chậm nộp; (3) Thời hạn tiếp nhận và giải quyết hồ sơ; (4) Mục đích quản lý nhà nước và chính sách hỗ trợ/miễn giảm đối với trường hợp khó khăn bất khả kháng.',
      gapDetails: 'Khoảng trống thông tin: Chưa có bài viết giải thích chính sách căn cơ; chưa có tư vấn cụ thể người dân, doanh nghiệp cần làm những gì khi làm thủ tục chấm dứt hiệu lực MST; các Chi cục Thuế địa phương chưa thống nhất một quy trình hướng dẫn trực quan.',
      publicConfusionRisk: 'Người nộp thuế hoang mang, bức xúc lan rộng trên mạng xã hội, nguy cơ quy kết cơ quan thuế làm khó, gây gánh nặng chi phí tuân thủ cho cộng đồng doanh nghiệp nhỏ và vừa.',
      recommendedClosureAction: 'Đề xuất giải quyết để lấp khoảng trống thông tin: (1) Tăng cường tuyến tin bài hướng dẫn nghiệp vụ 3 bước xử lý MST 03-06 trên Thời báo Tài chính và Cổng TTĐT Tổng cục/Cục Thuế; (2) Xuất bản Infographic trực quan tóm tắt quy trình đóng/khôi phục MST; (3) Tổ chức Hội thảo / Tọa đàm trực tuyến đối thoại giữa Cục Thuế và các Hiệp hội DN tháo gỡ băn khoăn; (4) Ban hành Công văn hướng dẫn nghiệp vụ thống nhất cho các Chi cục Thuế cơ sở, tạo điều kiện thuận lợi tối đa.',
      targetedFormats: [
        'Bài viết hướng dẫn nghiệp vụ chuyên sâu',
        'Infographic quy trình 3 bước xử lý MST 03-06',
        'Hội thảo / Tọa đàm trực tuyến đối thoại với doanh nghiệp',
        'Công văn hướng dẫn nghiệp vụ thống nhất toàn quốc',
        'Cẩm nang Hỏi - Đáp (FAQ) thuế điện tử'
      ],
      actionOwnerUnit: 'Cục Thuế',
      closingTimeline: 'Trong vòng 24h - 48h'
    };
  }

  // TÌNH HUỐNG B: Thuế hộ kinh doanh & eTax Mobile & Doanh thu nhiều địa điểm kinh doanh
  const isHouseholdTaxIssue =
    (fullText.includes('hộ kinh doanh') || fullText.includes('etax mobile') || fullText.includes('thuế khoán')) &&
    (fullText.includes('nhiều địa điểm') || fullText.includes('doanh thu') || fullText.includes('lúng túng') || fullText.includes('vướng mắc') || fullText.includes('sửa đổi 5 thủ tục') || fullText.includes('thủ tục'));

  if (isHouseholdTaxIssue) {
    return {
      hasGap: true,
      gapLevel: 'GAP_EARLY_ALERT',
      gapLevelLabelVi: 'Khoảng trống thông tin Cấp 1 — Cần Lưu Tâm & Dự Báo Sớm',
      isAlertWarranted: true,
      issueConcern: 'Người dân và hộ kinh doanh băn khoăn về quy định xác định doanh thu tính thuế khi có nhiều địa điểm kinh doanh, lúng túng khi thao tác kê khai thuế số hóa trên ứng dụng eTax Mobile.',
      clarificationNeeded: 'Cảnh báo: Cần làm rõ: (1) Cách phân bổ doanh thu giữa các địa điểm kinh doanh; (2) Căn cứ tính thuế và ngưỡng doanh thu chịu thuế; (3) Hướng dẫn thao tác kê khai trực tuyến từng bước trên eTax Mobile.',
      gapDetails: 'Khoảng trống thông tin: Thiếu cẩm nang hướng dẫn trực quan; chưa có tài liệu trả lời các câu hỏi tình huống lặp đi lặp lại của hộ kinh doanh cá thể.',
      publicConfusionRisk: 'Người nộp thuế hiểu sai chính sách, phát sinh sai sót khi kê khai hoặc lo ngại bị xử phạt oan.',
      recommendedClosureAction: 'Đề xuất giải quyết để lấp khoảng trống thông tin: (1) Xuất bản Infographic và video clip 60 giây hướng dẫn thao tác eTax Mobile; (2) Tổ chức Tọa đàm trực tuyến giải đáp vướng mắc cho các hộ kinh doanh; (3) Cập nhật ngân hàng câu hỏi Q&A trên Cổng thông tin Cục Thuế.',
      targetedFormats: [
        'Infographic trực quan quy trình kê khai',
        'Video hướng dẫn thao tác eTax Mobile',
        'Tọa đàm trực tuyến giải đáp người nộp thuế',
        'Bản tin hướng dẫn trên mạng xã hội ngành Thuế'
      ],
      actionOwnerUnit: 'Cục Thuế',
      closingTimeline: 'Trong vòng 24h'
    };
  }

  // TÌNH HUỐNG C: Vênh số liệu Giải ngân Đầu tư công & Vướng mắc Kiểm soát chi KBNN
  const isDisbursementDivergenceIssue =
    (fullText.includes('giải ngân') || fullText.includes('đầu tư công')) &&
    (fullText.includes('chậm') || fullText.includes('ì ạch') || fullText.includes('thấp kỷ lục') || fullText.includes('địa phương kêu khó') || fullText.includes('kiểm soát chi') || fullText.includes('vướng mắc'));

  if (isDisbursementDivergenceIssue) {
    const isHighVelocityOrMajorPress = calculatedRiskScore >= 60 || /vtv|báo nhân dân|tuổi trẻ|vnexpress/i.test(fullText);
    return {
      hasGap: true,
      gapLevel: isHighVelocityOrMajorPress ? 'GAP_RAPID_ALERT' : 'GAP_EARLY_ALERT',
      gapLevelLabelVi: isHighVelocityOrMajorPress
        ? 'Khoảng trống thông tin Cấp 2 — Cảnh Báo Nhanh (Rapid Alert)'
        : 'Khoảng trống thông tin Cấp 1 — Cần Lưu Tâm & Dự Báo Sớm',
      isAlertWarranted: true,
      issueConcern: 'Phản ánh mâu thuẫn giữa thông điệp chỉ đạo quyết liệt của Lãnh đạo Bộ và thực tế tiến độ giải ngân đầu tư công còn chậm, nhiều địa phương phản ánh vướng mắc cơ chế và thủ tục kiểm soát chi Kho bạc Nhà nước.',
      clarificationNeeded: 'Cảnh báo: Cần phân rã số liệu và làm rõ: (1) Trách nhiệm của Bộ Tài chính và KBNN (đã phân bổ vốn đầy đủ, kiểm soát chi đúng hạn); (2) Chỉ rõ các nút thắt nằm ở khâu giải phóng mặt bằng, đấu thầu của chủ đầu tư địa phương.',
      gapDetails: 'Khoảng trống thông tin: Dư luận thiếu số liệu phân rã chi tiết, dễ dẫn đến quy kết trách nhiệm cho cơ quan tài chính làm chậm giải ngân chung của cả nền kinh tế.',
      recommendedClosureAction: 'Đề xuất giải quyết để lấp khoảng trống thông tin: (1) Cung cấp số liệu phân tích minh bạch cho Báo Nhân Dân, Báo Chính phủ, VTV1 trong ngày; (2) Tổ chức Họp báo chuyên đề hoặc Tọa đàm báo chí giải thích rõ nguyên nhân; (3) Ban hành Công văn đôn đốc KBNN địa phương rút ngắn tối đa thời gian kiểm soát chi.',
      targetedFormats: [
        'Thông cáo báo chí chuyên đề phân rã số liệu',
        'Họp báo / Tọa đàm báo chí chuyên sâu',
        'Bài phỏng vấn Lãnh đạo Vụ Đầu tư / KBNN',
        'Công văn chỉ đạo kiểm soát chi KBNN toàn quốc'
      ],
      actionOwnerUnit: 'Kho bạc Nhà nước & Vụ Đầu tư',
      closingTimeline: 'Trong vòng 12h'
    };
  }

  // TÌNH HUỐNG D: Đấu thầu mua sắm công & Dự án PPP (Cục Quản lý đấu thầu NĐ 376)
  const isBiddingProcurementIssue =
    (fullText.includes('đấu thầu') || fullText.includes('mua sắm công') || fullText.includes('dự án ppp') || fullText.includes('chỉ định thầu')) &&
    (fullText.includes('ách tắc') || fullText.includes('sợ sai') || fullText.includes('vướng mắc') || fullText.includes('chậm trễ') || fullText.includes('thiếu trang thiết bị') || fullText.includes('khiếu nại'));

  if (isBiddingProcurementIssue) {
    return {
      hasGap: true,
      gapLevel: 'GAP_EARLY_ALERT',
      gapLevelLabelVi: 'Khoảng trống thông tin Cấp 1 — Cần Lưu Tâm & Dự Báo Sớm',
      isAlertWarranted: true,
      issueConcern: 'Dư luận và các bệnh viện, trường học, ban quản lý dự án phản ánh ách tắc trong đấu thầu mua sắm trang thiết bị, vật tư công do tâm lý sợ sai, lúng túng khi áp dụng quy định mới của Luật Đấu thầu.',
      clarificationNeeded: 'Cảnh báo: Cần làm rõ: (1) Các trường hợp cụ thể được phép áp dụng chỉ định thầu hoặc chào hàng cạnh tranh rút gọn; (2) Tiêu chuẩn kỹ thuật và phương pháp định giá gói thầu; (3) Cơ chế bảo vệ cán bộ dám nghĩ dám làm vì lợi ích chung.',
      gapDetails: 'Khoảng trống thông tin: Thiếu tài liệu cẩm nang hướng dẫn tình huống thực tế; các chủ đầu tư chưa được giải đáp trực tiếp các vướng mắc pháp lý khi tổ chức đấu thầu.',
      recommendedClosureAction: 'Đề xuất giải quyết để lấp khoảng trống thông tin: (1) Tăng cường bài viết cẩm nang hướng dẫn áp dụng Luật Đấu thầu trên Thời báo Tài chính; (2) Tổ chức Hội nghị tập huấn trực tuyến toàn quốc cho các chủ đầu tư; (3) Thiết lập đường dây nóng giải đáp vướng mắc đấu thầu thuộc Cục Quản lý đấu thầu.',
      targetedFormats: [
        'Bài viết phân tích cẩm nang nghiệp vụ đấu thầu',
        'Hội nghị tập huấn trực tuyến toàn quốc',
        'Đường dây nóng / Hộp thư điện tử giải đáp vướng mắc',
        'Sổ tay hướng dẫn tình huống lựa chọn nhà thầu'
      ],
      actionOwnerUnit: 'Cục Quản lý đấu thầu',
      closingTimeline: 'Trong vòng 24h - 48h'
    };
  }

  // TÌNH HUỐNG E: Đầu tư FDI & Thuế tối thiểu toàn cầu GMT (Cục Đầu tư nước ngoài / Cục Thuế)
  const isFdiInvestmentIssue =
    (fullText.includes('fdi') || fullText.includes('đầu tư nước ngoài') || fullText.includes('thuế tối thiểu toàn cầu') || fullText.includes('chuyển giá')) &&
    (fullText.includes('băn khoăn') || fullText.includes('vướng mắc') || fullText.includes('suy giảm') || fullText.includes('kiến nghị') || fullText.includes('chậm cấp phép'));

  if (isFdiInvestmentIssue) {
    return {
      hasGap: true,
      gapLevel: 'GAP_EARLY_ALERT',
      gapLevelLabelVi: 'Khoảng trống thông tin Cấp 1 — Cần Lưu Tâm & Dự Báo Sớm',
      isAlertWarranted: true,
      issueConcern: 'Cộng đồng doanh nghiệp FDI và các hiệp hội thương mại quốc tế băn khoăn về cơ chế chính sách hỗ trợ đầu tư thay thế sau khi Việt Nam áp dụng Thuế tối thiểu toàn cầu GMT.',
      clarificationNeeded: 'Cảnh báo: Cần làm rõ: (1) Tiến độ ban hành Nghị định về Quỹ hỗ trợ đầu tư; (2) Tiêu chí, điều kiện và thủ tục nhận hỗ trợ chi phí cho doanh nghiệp công nghệ cao; (3) Cam kết ổn định môi trường pháp lý của Việt Nam.',
      gapDetails: 'Khoảng trống thông tin: Thiếu thông tin chính thức song ngữ về chính sách ưu đãi đầu tư mới, dẫn đến tâm lý chờ đợi hoặc do dự mở rộng dự án của các tập đoàn đa quốc gia.',
      recommendedClosureAction: 'Đề xuất giải quyết để lấp khoảng trống thông tin: (1) Tổ chức Tọa đàm / Hội nghị đối thoại bàn tròn với các Hiệp hội DN FDI (AmCham, EuroCham, KoCham); (2) Xuất bản cẩm nang hướng dẫn song ngữ Việt - Anh về Quỹ hỗ trợ đầu tư; (3) Truyền thông thông điệp cam kết đồng hành của Lãnh đạo Bộ trên báo chí đối ngoại.',
      targetedFormats: [
        'Bàn tròn đối thoại với Hiệp hội doanh nghiệp FDI',
        'Cẩm nang hướng dẫn chính sách song ngữ (Việt - Anh)',
        'Thông cáo báo chí đối ngoại',
        'Tọa đàm chuyên đề xúc tiến đầu tư'
      ],
      actionOwnerUnit: 'Cục Đầu tư nước ngoài',
      closingTimeline: 'Trong vòng 48h'
    };
  }

  // TÌNH HUỐNG F: Nợ đọng BHXH, BHYT & Chế độ người lao động (Vụ Tài chính hành chính sự nghiệp)
  const isSocialSecurityDebtIssue =
    (fullText.includes('bảo hiểm xã hội') || fullText.includes('bhxh') || fullText.includes('bhyt') || fullText.includes('trốn đóng')) &&
    (fullText.includes('nợ đọng') || fullText.includes('chậm đóng') || fullText.includes('kêu cứu') || fullText.includes('ảnh hưởng quyền lợi') || fullText.includes('treo sổ'));

  if (isSocialSecurityDebtIssue) {
    return {
      hasGap: true,
      gapLevel: 'GAP_EARLY_ALERT',
      gapLevelLabelVi: 'Khoảng trống thông tin Cấp 1 — Cần Lưu Tâm & Dự Báo Sớm',
      isAlertWarranted: true,
      issueConcern: 'Người lao động và các tổ chức công đoàn phản ánh tình trạng doanh nghiệp trốn đóng, nợ đọng BHXH kéo dài khiến người lao động bị đình trệ chế độ ốm đau, thai sản, chốt sổ hưu trí.',
      clarificationNeeded: 'Cảnh báo: Cần làm rõ: (1) Cơ chế xử lý nguồn tài chính giải quyết quyền lợi cho người lao động tại doanh nghiệp giải thể/phá sản; (2) Chế tài cưỡng chế và khởi tố đối với hành vi trốn đóng BHXH.',
      gapDetails: 'Khoảng trống thông tin: Người lao động chưa được hướng dẫn quy trình tự tra cứu và yêu cầu cơ quan bảo hiểm bảo lưu quyền lợi; thiếu thông tin về giải pháp tài khóa hỗ trợ giải quyết nợ đọng an sinh.',
      recommendedClosureAction: 'Đề xuất giải quyết để lấp khoảng trống thông tin: (1) Đẩy mạnh tuyến bài truyền thông về giải pháp bảo vệ quyền lợi an sinh của người lao động; (2) Xuất bản cẩm nang Hỏi - Đáp bảo hiểm cho người lao động; (3) Phối hợp liên ngành Tài chính - LĐTBXH - BHXH Việt Nam ban hành thông tư tháo gỡ điểm nghẽn.',
      targetedFormats: [
        'Bài viết truyền thông bảo vệ quyền lợi người lao động',
        'Cẩm nang Hỏi - Đáp về quyền lợi bảo hiểm an sinh',
        'Thông cáo liên ngành Tài chính - BHXH Việt Nam',
        'Tọa đàm trực tuyến với công đoàn và người lao động'
      ],
      actionOwnerUnit: 'Vụ Tài chính hành chính sự nghiệp',
      closingTimeline: 'Trong vòng 48h'
    };
  }

  // TÌNH HUỐNG G: Thống kê vĩ mô, Chỉ số CPI & Điều hành giá (Cục Thống kê / Cục QL Giá)
  const isStatisticsCpiIssue =
    (fullText.includes('thống kê') || fullText.includes('cpi') || fullText.includes('lạm phát') || fullText.includes('giá cả')) &&
    (fullText.includes('hoài nghi') || fullText.includes('trái chiều') || fullText.includes('tăng giá') || fullText.includes('chưa sát') || fullText.includes('áp lực'));

  if (isStatisticsCpiIssue) {
    return {
      hasGap: true,
      gapLevel: 'GAP_EARLY_ALERT',
      gapLevelLabelVi: 'Khoảng trống thông tin Cấp 1 — Cần Lưu Tâm & Dự Báo Sớm',
      isAlertWarranted: true,
      issueConcern: 'Dư luận có ý kiến băn khoăn về mức độ đồng bộ giữa chỉ số giá tiêu dùng CPI thống kê và mức tăng chi phí sinh hoạt thực tế của người dân.',
      clarificationNeeded: 'Cảnh báo: Cần làm rõ: (1) Phương pháp luận tính toán chỉ số CPI theo tiêu chuẩn quốc tế; (2) Cơ cấu rổ hàng hóa đại diện; (3) Đánh giá tác động của việc điều chỉnh giá dịch vụ y tế, giáo dục, điện.',
      gapDetails: 'Khoảng trống thông tin: Chưa có tài liệu giải thích phương pháp luận thống kê trực quan cho công chúng hiểu đúng bản chất chỉ số lạm phát.',
      recommendedClosureAction: 'Đề xuất giải quyết để lấp khoảng trống thông tin: (1) Xuất bản Infographic trực quan "Cách thức tính chỉ số CPI và giỏ hàng hóa đại diện"; (2) Tổ chức phỏng vấn chuyên gia kinh tế độc lập trên các cơ quan báo chí chủ lực; (3) Bản tin phân tích vĩ mô định kỳ làm rõ sự phối hợp giữa chính sách tiền tệ và tài khóa.',
      targetedFormats: [
        'Infographic trực quan giải thích phương pháp tính CPI',
        'Bài phỏng vấn chuyên gia kinh tế độc lập',
        'Bản tin phân tích vĩ mô định kỳ',
        'Thông cáo báo chí về công tác điều hành giá'
      ],
      actionOwnerUnit: 'Cục Thống kê',
      closingTimeline: 'Trong vòng 48h'
    };
  }

  // TÌNH HUỐNG H: Quy hoạch chồng chéo & Thẩm định dự án đầu tư (Vụ Quản lý quy hoạch)
  const isPlanningConflictIssue =
    (fullText.includes('quy hoạch') || fullText.includes('thẩm định dự án') || fullText.includes('chấp thuận chủ trương')) &&
    (fullText.includes('chồng chéo') || fullText.includes('ách tắc') || fullText.includes('xung đột') || fullText.includes('vướng mắc') || fullText.includes('đình trệ'));

  if (isPlanningConflictIssue) {
    return {
      hasGap: true,
      gapLevel: 'GAP_EARLY_ALERT',
      gapLevelLabelVi: 'Khoảng trống thông tin Cấp 1 — Cần Lưu Tâm & Dự Báo Sớm',
      isAlertWarranted: true,
      issueConcern: 'Sự thiếu đồng bộ và chồng chéo giữa Quy hoạch tỉnh, Quy hoạch ngành và Quy hoạch phân khu gây vướng mắc, làm đình trệ thủ tục phê duyệt dự án đầu tư phát triển tại nhiều địa phương.',
      clarificationNeeded: 'Cảnh báo: Cần làm rõ: (1) Thứ bậc ưu tiên áp dụng quy định khi xảy ra xung đột quy hoạch; (2) Quy trình thẩm định chuyển tiếp đối với các dự án đang triển khai dở dang.',
      gapDetails: 'Khoảng trống thông tin: Thiếu văn bản hướng dẫn nghiệp vụ xử lý chuyển tiếp quy hoạch; các địa phương lúng túng khi phê duyệt chủ trương đầu tư.',
      recommendedClosureAction: 'Đề xuất giải quyết để lấp khoảng trống thông tin: (1) Ban hành Công văn hướng dẫn xử lý chuyển tiếp quy hoạch gửi UBND các tỉnh, thành phố; (2) Tổ chức Hội thảo chuyên đề tháo gỡ điểm nghẽn quy hoạch đầu tư; (3) Công khai sơ đồ luồng thẩm định quy hoạch trên Cổng TTĐT.',
      targetedFormats: [
        'Công văn hướng dẫn xử lý chuyển tiếp quy hoạch',
        'Hội thảo chuyên đề tháo gỡ điểm nghẽn',
        'Sơ đồ luồng quy trình thẩm định minh bạch',
        'Bài viết phân tích chính sách trên Tạp chí Tài chính'
      ],
      actionOwnerUnit: 'Vụ Quản lý quy hoạch',
      closingTimeline: 'Trong vòng 48h'
    };
  }

  // TÌNH HUỐNG I: Thị trường vốn, Trái phiếu & Thí điểm AI chứng khoán (UBCKNN & Vụ TCNH)
  const isCapitalMarketIssue =
    (fullText.includes('trái phiếu doanh nghiệp') || fullText.includes('ai trong chứng khoán') || fullText.includes('thí điểm ai') || fullText.includes('thuật toán ai') || fullText.includes('sandbox')) &&
    (fullText.includes('đáo hạn') || fullText.includes('lo ngại') || fullText.includes('băn khoăn') || fullText.includes('khoảng trống pháp lý') || fullText.includes('tranh chấp'));

  if (isCapitalMarketIssue) {
    return {
      hasGap: true,
      gapLevel: 'GAP_EARLY_ALERT',
      gapLevelLabelVi: 'Khoảng trống thông tin Cấp 1 — Cần Lưu Tâm & Dự Báo Sớm',
      isAlertWarranted: true,
      issueConcern: 'Thị trường tài chính quan tâm đến lộ trình tháo gỡ áp lực đáo hạn trái phiếu doanh nghiệp và các băn khoăn về khoảng trống pháp lý, cơ chế bảo vệ nhà đầu tư khi thí điểm ứng dụng AI trong giao dịch chứng khoán.',
      clarificationNeeded: 'Cảnh báo: Cần làm rõ: (1) Khung cơ chế thử nghiệm có kiểm soát (Sandbox) đối với ứng dụng AI tài chính; (2) Trách nhiệm pháp lý bồi thường khi thuật toán gặp sự cố; (3) Biện pháp bảo vệ nhà đầu tư cá nhân và an toàn hệ thống.',
      gapDetails: 'Khoảng trống thông tin: Chưa công bố khung pháp lý Sandbox chính thức; dư luận tự phát tranh luận học thuật hoặc lo ngại rủi ro bất bình đẳng thông tin.',
      recommendedClosureAction: 'Đề xuất giải quyết để lấp khoảng trống thông tin: (1) Chuẩn bị sẵn khung giải trình về cơ chế thử nghiệm Sandbox và biện pháp bảo vệ nhà đầu tư trước khi chính thức ban hành; (2) Tổ chức Tọa đàm chuyên gia lấy ý kiến hoàn thiện quy định; (3) Định kỳ phát hành Bản tin giám sát an toàn thị trường vốn.',
      targetedFormats: [
        'Khung giải trình chính sách Sandbox thử nghiệm',
        'Tọa đàm chuyên gia lấy ý kiến đa chiều',
        'Bản tin an toàn thị trường vốn định kỳ',
        'Thông cáo báo chí định hướng dư luận'
      ],
      actionOwnerUnit: 'Ủy ban Chứng khoán Nhà nước',
      closingTimeline: 'Trong vòng 48h'
    };
  }

  // TÌNH HUỐNG J: Hoàn thuế VAT & Doanh nghiệp than phiền hồ sơ chậm trễ
  const isVatRefundIssue =
    (fullText.includes('hoàn thuế vat') || fullText.includes('hoàn thuế giá trị gia tăng') || fullText.includes('hoàn thuế')) &&
    (fullText.includes('chậm trễ') || fullText.includes('ách tắc') || fullText.includes('vướng mắc') || fullText.includes('than phiền') || fullText.includes('xác minh nguồn gốc') || fullText.includes('thanh tra'));

  if (isVatRefundIssue) {
    return {
      hasGap: true,
      gapLevel: 'GAP_EARLY_ALERT',
      gapLevelLabelVi: 'Khoảng trống thông tin Cấp 1 — Cần Lưu Tâm & Dự Báo Sớm',
      isAlertWarranted: true,
      issueConcern: 'Cộng đồng doanh nghiệp sản xuất và xuất khẩu than phiền công tác hoàn thuế giá trị gia tăng (VAT) còn nhiều ách tắc, hồ sơ bị chậm trễ kéo dài do khâu xác minh nguồn gốc hàng hóa phức tạp, gây ứ đọng vốn lưu động.',
      clarificationNeeded: 'Cảnh báo: Cần làm rõ: (1) Quy trình và thời hạn giải quyết hồ sơ hoàn thuế trước - kiểm tra sau; (2) Tiêu chí phân loại rủi ro minh bạch đối với doanh nghiệp tuân thủ tốt; (3) Hướng dẫn giải trình nguồn gốc nông - lâm - thủy sản hợp lý.',
      gapDetails: 'Khoảng trống thông tin: Chưa có hướng dẫn chuẩn hóa về tiêu chí xác minh chuỗi cung ứng, dẫn đến mỗi địa phương áp dụng một cách, làm doanh nghiệp lúng túng.',
      publicConfusionRisk: 'Doanh nghiệp xuất khẩu chịu gánh nặng chi phí tài chính, suy giảm năng lực cạnh tranh và có nguy cơ phát sinh khiếu nại diện rộng.',
      recommendedClosureAction: 'Đề xuất giải quyết để lấp khoảng trống thông tin: (1) Tăng cường tuyến bài hướng dẫn nghiệp vụ hoàn thuế điện tử trên Thời báo Tài chính; (2) Tổ chức Hội nghị trực tuyến đối thoại giữa Cục Thuế và các Hiệp hội ngành hàng xuất khẩu; (3) Ban hành Công văn chỉ đạo tháo gỡ điểm nghẽn hoàn thuế đúng thẩm quyền.',
      targetedFormats: [
        'Bài viết giải thích nghiệp vụ hoàn thuế điện tử',
        'Hội nghị trực tuyến đối thoại với hiệp hội xuất khẩu',
        'Infographic quy trình giải quyết hồ sơ hoàn thuế',
        'Công văn nghiệp vụ chỉ đạo các Cục Thuế địa phương'
      ],
      actionOwnerUnit: 'Cục Thuế',
      closingTimeline: 'Trong vòng 24h - 48h'
    };
  }

  // TÌNH HUỐNG K: Nghĩa vụ thuế thu nhập cá nhân đối với tiếp thị liên kết (Affiliate), TMĐT, Livestream
  const isAffiliateTaxIssue =
    (fullText.includes('tiếp thị liên kết') || fullText.includes('affiliate') || fullText.includes('livestream') || fullText.includes('thương mại điện tử')) &&
    (fullText.includes('nghĩa vụ thuế') || fullText.includes('khấu trừ') || fullText.includes('thuế tncn') || fullText.includes('kê khai') || fullText.includes('băn khoăn') || fullText.includes('chưa rõ'));

  if (isAffiliateTaxIssue) {
    return {
      hasGap: true,
      gapLevel: 'GAP_EARLY_ALERT',
      gapLevelLabelVi: 'Khoảng trống thông tin Cấp 1 — Cần Lưu Tâm & Dự Báo Sớm',
      isAlertWarranted: true,
      issueConcern: 'Cá nhân tham gia tiếp thị liên kết (Affiliate marketing), sáng tạo nội dung số và bán hàng trực tuyến còn nhiều băn khoăn về nghĩa vụ kê khai thuế TNCN, chưa rõ tỷ lệ khấu trừ tại nguồn và thủ tục quyết toán hàng năm.',
      clarificationNeeded: 'Cảnh báo: Cần làm rõ: (1) Căn cứ pháp lý và tỷ lệ khấu trừ thuế (10% tại nguồn hay tính theo biểu thuế lũy tiến); (2) Các bước tự kê khai trực tuyến trên Cổng thông tin thuế điện tử; (3) Trách nhiệm khấu trừ và xuất chứng từ của sàn TMĐT/mạng tiếp thị.',
      gapDetails: 'Khoảng trống thông tin: Thiếu cẩm nang hướng dẫn ngắn gọn cho người nộp thuế trẻ tuổi (Gen Z, KOC/KOL); chưa có ví dụ tình huống minh họa số tiền thuế phải nộp cụ thể.',
      publicConfusionRisk: 'Người nộp thuế lo lắng bị xử phạt chậm nộp hoặc không biết cách thức hoàn thuế khi thu nhập thực tế trong năm dưới mức chịu thuế.',
      recommendedClosureAction: 'Đề xuất giải quyết để lấp khoảng trống thông tin: (1) Xuất bản Infographic trực quan "3 bước kê khai thuế tiếp thị liên kết"; (2) Đăng tải tuyến bài giải đáp trên Cổng TTĐT Tổng cục Thuế và báo chí chuyên ngành; (3) Phối hợp các nền tảng TMĐT gửi thông báo hướng dẫn trực tiếp đến người dùng.',
      targetedFormats: [
        'Infographic 3 bước kê khai thuế tiếp thị liên kết',
        'Bài viết giải đáp tình huống trên Cổng TTĐT Thuế',
        'Video ngắn hướng dẫn thao tác eTax Mobile',
        'Tọa đàm trực tuyến với đại diện cộng đồng sáng tạo nội dung'
      ],
      actionOwnerUnit: 'Cục Thuế (Cục Quản lý thuế TMĐT & Hộ kinh doanh)',
      closingTimeline: 'Trong vòng 24h - 48h'
    };
  }

  // TÌNH HUỐNG L: Quỹ bình ổn giá xăng dầu trước bài toán minh bạch
  const isPetroleumFundIssue =
    (fullText.includes('quỹ bình ổn') || fullText.includes('quỹ bình ổn giá') || fullText.includes('bình ổn giá xăng dầu') || fullText.includes('xăng dầu')) &&
    (fullText.includes('minh bạch') || fullText.includes('bài toán') || fullText.includes('trích lập') || fullText.includes('số dư') || fullText.includes('kiểm toán') || fullText.includes('sửa đổi'));

  if (isPetroleumFundIssue) {
    return {
      hasGap: true,
      gapLevel: 'GAP_EARLY_ALERT',
      gapLevelLabelVi: 'Khoảng trống thông tin Cấp 1 — Cần Lưu Tâm & Dự Báo Sớm',
      isAlertWarranted: true,
      issueConcern: 'Dư luận và các chuyên gia kinh tế quan tâm đến tính minh bạch, hiệu quả sử dụng và cơ chế công khai số dư Quỹ bình ổn giá xăng dầu tại các doanh nghiệp đầu mối.',
      clarificationNeeded: 'Cảnh báo: Cần làm rõ: (1) Quy chế kiểm toán và công khai định kỳ số dư Quỹ bình ổn trên cổng thông tin; (2) Định hướng hoàn thiện cơ chế điều hành giá xăng dầu tiệm cận thị trường; (3) Trách nhiệm bảo toàn quỹ của các thương nhân đầu mối.',
      gapDetails: 'Khoảng trống thông tin: Thiếu số liệu cập nhật thường xuyên về biến động trích lập - chi sử dụng quỹ theo từng kỳ điều hành giá.',
      publicConfusionRisk: 'Dư luận hoài nghi về sự công tâm trong điều hành giá hoặc e ngại nguy cơ thất thoát tiền quỹ bình ổn.',
      recommendedClosureAction: 'Đề xuất giải quyết để lấp khoảng trống thông tin: (1) Công khai định kỳ số dư Quỹ bình ổn trên Cổng TTĐT Bộ Tài chính; (2) Phát hành thông cáo báo chí giải thích rõ nguyên tắc vận hành quỹ; (3) Tổ chức hội thảo lấy ý kiến sửa đổi cơ chế điều hành giá xăng dầu.',
      targetedFormats: [
        'Báo cáo công khai định kỳ số dư Quỹ bình ổn',
        'Thông cáo báo chí giải thích nguyên tắc điều hành giá',
        'Bài phỏng vấn Lãnh đạo Cục Quản lý giá',
        'Hội thảo tham vấn ý kiến sửa đổi Nghị định kinh doanh xăng dầu'
      ],
      actionOwnerUnit: 'Cục Quản lý giá',
      closingTimeline: 'Trong vòng 24h - 48h'
    };
  }

  // TÌNH HUỐNG M: Xóa nợ thuế trên 10 năm cho doanh nghiệp khi chấm dứt MST
  const isTaxDebtReliefIssue =
    (fullText.includes('xóa nợ thuế') || fullText.includes('nợ thuế trên 10 năm') || fullText.includes('khoản nợ thuế')) &&
    (fullText.includes('chấm dứt hiệu lực') || fullText.includes('đề xuất') || fullText.includes('doanh nghiệp'));

  if (isTaxDebtReliefIssue) {
    return {
      hasGap: true,
      gapLevel: 'GAP_EARLY_ALERT',
      gapLevelLabelVi: 'Khoảng trống thông tin Cấp 1 — Cần Lưu Tâm & Dự Báo Sớm',
      isAlertWarranted: true,
      issueConcern: 'Đề xuất xóa khoản nợ thuế trên 10 năm cho doanh nghiệp khi chấm dứt hiệu lực mã số thuế thu hút sự chú ý đặc biệt của cộng đồng doanh nghiệp, nhưng phát sinh băn khoăn về tiêu chí xét duyệt và nguy cơ trục lợi chính sách.',
      clarificationNeeded: 'Cảnh báo: Cần làm rõ: (1) Tiêu chí phân loại chính xác các khoản nợ tiền thuế, tiền phạt, tiền chậm nộp không còn khả năng thu hồi; (2) Quy trình rà soát, thẩm định hồ sơ công khai, minh bạch; (3) Biện pháp kiểm soát ngăn chặn việc cố tình chây ỳ để được xóa nợ.',
      gapDetails: 'Khoảng trống thông tin: Chưa có tài liệu giải thích cơ sở pháp lý và tính nhân văn của chính sách xóa nợ khó đòi; người dân chưa rõ điều kiện cụ thể để được xem xét.',
      publicConfusionRisk: 'Phát sinh tranh luận trái chiều về tính công bằng giữa doanh nghiệp chấp hành nghiêm túc và doanh nghiệp được xóa nợ.',
      recommendedClosureAction: 'Đề xuất giải quyết để lấp khoảng trống thông tin: (1) Đăng bài giải thích căn cứ pháp lý và tính nhân văn của chính sách trên Thời báo Tài chính; (2) Tiếp thu ý kiến đóng góp của các chuyên gia và hiệp hội doanh nghiệp; (3) Chuẩn bị dự thảo hướng dẫn thực hiện khi chính sách được cấp có thẩm quyền phê duyệt.',
      targetedFormats: [
        'Bài viết phân tích chính sách trên Thời báo Tài chính',
        'Hỏi - Đáp pháp lý về điều kiện xóa nợ thuế khó đòi',
        'Thông cáo báo chí giải trình cơ chế thẩm định minh bạch'
      ],
      actionOwnerUnit: 'Cục Thuế',
      closingTimeline: 'Trong vòng 48h'
    };
  }

  // =========================================================================
  // 3. KIỂM TRA KHẨN CẤP (EMERGENCY) VÀ CẢNH BÁO NHANH (RAPID)
  // =========================================================================

  // MỨC 3: KHOẢNG TRỐNG THÔNG TIN KHẨN CẤP (GAP_EMERGENCY_ALERT - 75–100 điểm)
  const hasEmergencyCrisis =
    item.isEmergency ||
    calculatedRiskScore >= 75 ||
    matchedPattern?.defaultAlertLevel === 'EMERGENCY' ||
    /đại án tham nhũng|nhận hối lộ|bắt tạm giam cán bộ|vỡ nợ trái phiếu dây chuyền|rút tiền hàng loạt|thất thoát nghìn tỷ|lũng đoạn thị trường/i.test(fullText);

  if (hasEmergencyCrisis) {
    return {
      hasGap: true,
      gapLevel: 'GAP_EMERGENCY_ALERT',
      gapLevelLabelVi: 'Khoảng trống thông tin Cấp 3 — Cảnh Báo Khẩn Cấp (Emergency Alert)',
      isAlertWarranted: true,
      issueConcern: 'Sự cố khủng hoảng thể chế nghiêm trọng, có nguy cơ bùng phát tin đồn thất thiệt, đe dọa trực tiếp an ninh trật tự tài chính tiền tệ hoặc liên quan đến trách nhiệm pháp lý cán bộ.',
      clarificationNeeded: 'Cảnh báo: Cần thông tin chính thức hỏa tốc, khẳng định lập trường kỷ cương pháp luật, làm rõ sự thật để ngăn chặn đứt gãy niềm tin vào hệ thống tài chính.',
      gapDetails: 'Khoảng trống thông tin nghiêm trọng bị các đối tượng xấu lợi dụng xuyên tạc, phát tán tin giả trên mạng xã hội.',
      publicConfusionRisk: 'Khủng hoảng niềm tin thị trường, làn sóng rút vốn hoặc bán tháo hoảng loạn trên diện rộng.',
      recommendedClosureAction: 'Đề xuất giải quyết: Kích hoạt ngay Tổ phản ứng nhanh khủng hoảng truyền thông trong vòng 2–4 giờ; tổ chức Họp báo hoặc phát hành Thông cáo báo chí chính thức làm rõ sự thật; phối hợp với cơ quan an ninh mạng (A05) xử lý nghiêm thông tin sai lệch.',
      targetedFormats: [
        'Thông cáo báo chí hỏa tốc (trong 2-4h)',
        'Họp báo chính thức của Người phát ngôn Bộ Tài chính',
        'Bản tin truyền hình thời sự VTV1 & TTXVN',
        'Công văn đề nghị xác minh, xử lý tin giả gửi Bộ Công an'
      ],
      actionOwnerUnit: 'Văn phòng Bộ Tài chính',
      closingTimeline: 'Trong vòng 2h - 4h'
    };
  }

  // MỨC 2: KHOẢNG TRỐNG THÔNG TIN CẢNH BÁO NHANH (GAP_RAPID_ALERT - 60–74 điểm)
  const hasRapidSignals =
    calculatedRiskScore >= 60 ||
    matchedPattern?.defaultAlertLevel === 'RAPID' ||
    ((fullText.includes('quy kết trách nhiệm') || fullText.includes('đổ lỗi cho cơ chế') || fullText.includes('kêu cứu tập thể')) && !isRoutineGovernance);

  if (hasRapidSignals) {
    return {
      hasGap: true,
      gapLevel: 'GAP_RAPID_ALERT',
      gapLevelLabelVi: 'Khoảng trống thông tin Cấp 2 — Cảnh Báo Nhanh (Rapid Alert)',
      isAlertWarranted: true,
      issueConcern: 'Nhiều cơ quan báo chí lớn cùng đăng bài phản ánh bất cập; mạng xã hội tăng đột biến lượt chia sẻ và bình luận gay gắt; xuất hiện xu hướng quy kết trách nhiệm cho cơ quan quản lý.',
      clarificationNeeded: 'Cảnh báo: Cần báo cáo Lãnh đạo Bộ, phân công đầu mối chuyên môn xử lý và phát ngôn ngay trong ngày để giải tỏa bức xúc dư luận.',
      gapDetails: 'Khoảng trống thông tin tạo luồng phản ánh dồn dập trên báo chí và mạng xã hội, chưa có tiếng nói chính thức của Bộ Tài chính giải thích trong 12h.',
      publicConfusionRisk: 'Dư luận hình thành luồng ý kiến tiêu cực diện rộng, tạo áp lực quy kết trách nhiệm điều hành lên Bộ tại nghị trường.',
      recommendedClosureAction: 'Đề xuất giải quyết: Báo cáo nhanh Lãnh đạo Bộ; phân công đầu mối phát ngôn ngay trong ngày; phối hợp cơ quan báo chí chủ lực (Báo Nhân Dân, Báo Chính phủ, VTV...) đăng tải nội dung giải thích chính sách; ban hành công văn hướng dẫn nghiệp vụ thống nhất.',
      targetedFormats: [
        'Bài viết giải thích chính sách trên báo chí chủ lực trong ngày',
        'Công văn trả lời cơ quan báo chí và hiệp hội',
        'Phỏng vấn Người phát ngôn trên Cổng TTĐT Bộ',
        'Chỉ đạo nghiệp vụ gửi các đơn vị cơ sở'
      ],
      actionOwnerUnit: matchedPattern?.leadUnit || 'Văn phòng Bộ Tài chính',
      closingTimeline: 'Trong vòng 12h'
    };
  }

  // =========================================================================
  // 4. XIẾT CHẶT BỘ LỌC CẢNH BÁO (TIGHTENED GATING - CHỐNG BÁO ĐỘNG GIẢ TRÀN LAN)
  // Loại trừ tin tức không thuộc ngành Tài chính hoặc là tin tức quốc tế/ngoại giao
  // =========================================================================
  const isBrokenOrHtmlTitle =
    item.title.trim().startsWith('<img') ||
    item.title.trim().startsWith('<a') ||
    item.title.includes('class="image-fallback"');

  const isForeignOrUnrelatedTopic =
    /spacex|tần số 800mhz|nước mỹ|quốc hội lào|chuyển đổi số quốc gia|make in vietnam|viễn thông hà nội|thủ tướng lê minh hưng/i.test(fullText) &&
    !/thuế|hải quan|kho bạc|trái phiếu|bộ tài chính|ngân sách|đầu tư công/i.test(fullText);

  if (isBrokenOrHtmlTitle || isForeignOrUnrelatedTopic) {
    return {
      hasGap: false,
      gapLevel: 'NO_GAP',
      gapLevelLabelVi: 'Tin tức tổng hợp / Không thuộc diện rủi ro Bộ Tài chính',
      isAlertWarranted: false,
      whyNoAlertYet: 'Bài viết không thuộc phạm vi thẩm quyền chính sách của Bộ Tài chính hoặc là tin tức kỹ thuật/quốc tế tổng hợp.',
      gapDetails: 'Không có khoảng trống thông tin chính sách của Bộ.',
      publicConfusionRisk: 'Không có nguy cơ.',
      recommendedClosureAction: 'Không kích hoạt cảnh báo.'
    };
  }

  // Nguyên tắc: Nếu không thuộc một trong các tình huống chính sách cụ thể phía trên,
  // và điểm số < 40đ -> Tuyệt đối KHÔNG PHÁT CẢNH BÁO, chuyển về Giám sát thường quy (NO_GAP).
  const isMoFCoreJurisdiction =
    /(bộ tài chính|ngành tài chính|thuế|tổng cục thuế|cục thuế|hải quan|kho bạc|kbnn|dự toán ngân sách|chứng khoán|ubcknn|thị trường vốn|quản lý giá|quản lý nợ|đầu tư công|quản lý đấu thầu|cục đầu tư nước ngoài|bảo hiểm xã hội|bhxh|thống kê cpi)/i.test(fullText);

  const isGenuinePublicConcern =
    /(vướng mắc|bất cập|thủ tục rườm rà|than phiền|bức xúc|kêu cứu|kêu khó|chưa rõ|chưa được giải đáp|băn khoăn|nghẽn|ách tắc|chậm hoàn thuế|bị phạt tiền|nợ đọng kéo dài|sai lệch số liệu|tranh luận gay gắt|kiến nghị khẩn cấp)/i.test(fullText);

  if (!isMoFCoreJurisdiction || !isGenuinePublicConcern || calculatedRiskScore < 40) {
    return {
      hasGap: false,
      gapLevel: 'NO_GAP',
      gapLevelLabelVi: 'Thông tin đầy đủ / Giám sát thường quy (Không cảnh báo)',
      isAlertWarranted: false,
      whyNoAlertYet: 'Bài viết phản ánh thông tin kinh tế - tài chính bình thường hoặc hoạt động điều hành thường nhật, không có khoảng trống chính sách cần giải tỏa.',
      gapDetails: 'Thông tin chính sách rõ ràng, hoạt động điều hành và thị trường diễn biến bình thường.',
      publicConfusionRisk: 'Không có nguy cơ.',
      recommendedClosureAction: 'Theo dõi thường nhật theo kế hoạch, không cần kích hoạt cảnh báo.'
    };
  }

  // Trường hợp hiếm: Thuộc ngành Tài chính, có than phiền gay gắt VÀ điểm số >= 40đ
  // Xếp vào MỨC 1 HỢP NHẤT: CẦN LƯU TÂM & DỰ BÁO SỚM
  return {
    hasGap: true,
    gapLevel: 'GAP_EARLY_ALERT',
    gapLevelLabelVi: 'Khoảng trống thông tin Cấp 2 — Cảnh Báo Sớm',
    isAlertWarranted: true,
    issueConcern: `Vấn đề về ${item.sectorNameVi || 'chính sách tài chính'} được dư luận, người dân và doanh nghiệp quan tâm theo dõi, bắt đầu xuất hiện câu hỏi thăm dò và băn khoăn về quy trình thực thi.`,
    clarificationNeeded: 'Cảnh báo: Cần làm rõ: (1) Căn cứ pháp lý và mục đích chính sách; (2) Hướng dẫn chi tiết người dân, DN cần làm gì; (3) Kênh giải đáp trực tiếp nếu phát sinh vướng mắc.',
    gapDetails: 'Khoảng trống thông tin: Chưa có tài liệu giải thích chính sách chi tiết, người dân và doanh nghiệp đang chờ văn bản hướng dẫn cụ thể.',
    publicConfusionRisk: 'Người dân và doanh nghiệp hiểu sai quy định, phát sinh chi phí tuân thủ hoặc cơ sở lúng túng khi thực hiện.',
    recommendedClosureAction: 'Đề xuất giải quyết để lấp khoảng trống thông tin: (1) Làm việc với Cục/Vụ chuyên môn hoàn thiện bộ Hỏi - Đáp (Internal Q&A); (2) Soạn thảo bài hướng dẫn nghiệp vụ và Infographic trực quan; (3) Giám sát chặt chẽ diễn biến dư luận trong 24h - 48h.',
    targetedFormats: [
      'Bộ câu hỏi - trả lời Q&A nội bộ',
      'Infographic trực quan tóm tắt quy trình',
      'Bài viết giải thích nghiệp vụ trên Tạp chí Tài chính',
      'Bản tin hướng dẫn thực thi trên Cổng TTĐT'
    ],
    actionOwnerUnit: matchedPattern?.leadUnit || 'Vụ/Cục chuyên môn phụ trách',
    closingTimeline: 'Trong vòng 24h - 48h'
  };
}

/**
 * Trình phân tích & Khởi tạo Mô hình Cảnh báo 7 bước & 3 Cấp độ
 * Signal → Context → Risk → Velocity → Impact → Escalation → Alert
 * 
 * ĐẢM BẢO CHUẨN XÁC THEO 3 MỨC ĐỘ VÀ 5 CẤP ĐỘ CẢNH BÁO:
 * - Mức độ 1: SENTIMENT (5 thành tố: Ngôn ngữ + Bối cảnh + Đối tượng + Hệ quả + Sắc thái bản chất; Gắn cờ tiêu đề trung tính có rủi ro).
 * - Mức độ 2: RISK (4 tiêu chí rõ ràng: Tổn hại uy tín, Quy kết trách nhiệm, Kiến nghị & Yêu cầu, Môi trường đầu tư & Quyền lợi).
 * - Mức độ 3: ACTIONABLE ALERT (5 cấp độ: Distant, Early, Rapid, Standard, Emergency).
 *   CHỈ đưa vào Emergency Alert khi THỰC SỰ ĐẢM BẢO: Có Chỉ đạo hỏa tốc của Lãnh đạo Chính phủ HOẶC Sự cố pháp lý nghiêm trọng HOẶC Thỏa mãn 4/4 tiêu chí Mức 2 kèm gia tốc Spike.
 */
export function generateWarningPipelineModel(item: ScrapedNewsItem): WarningPipelineModel {
  const title = (item.title || '').trim();
  const summary = (item.summary || item.snippet || '').trim();
  const fullText = `${title} ${summary} ${item.sentimentReason || ''}`.toLowerCase();
  const sector = item.sector || 'policy';
  const sectorNameVi = item.sectorNameVi || SECTOR_NAMES[sector] || 'Lĩnh vực Quản lý';

  // Nhận diện hoạt động Ban hành Luật, Lệnh của Chủ tịch nước & Quản trị điều hành thông thường
  const isRoutineGovernance = isRoutineLegalPromulgationOrGovernance(fullText);
  // Nhận diện nghiệp vụ cưỡng chế pháp luật định kỳ (xử phạt cá nhân trốn thuế, tạm giữ lô hàng buôn lậu nhỏ lẻ)
  const isEnforcement = isRoutineAdministrativeEnforcement(fullText);
  // Nhận diện biến động giao dịch thị trường tài chính thuần túy (VN-Index, cổ phiếu riêng lẻ, dòng tiền)
  const isPureMarket = isPureMarketDynamics(fullText);

  // 1. Tìm kiếm mẫu bối cảnh phù hợp nhất (Pattern Matching)
  // Yêu cầu khớp tối thiểu 2 từ khóa chuyên ngành để tránh gán nhầm mẫu rủi ro từ 1 từ phổ biến
  let matchedPattern: ContextPattern | null = null;
  let maxMatchedCount = 1;

  for (const pattern of CONTEXT_PATTERNS) {
    const count = pattern.keywords.filter(kw => fullText.includes(kw.toLowerCase())).length;
    if (count > maxMatchedCount) {
      maxMatchedCount = count;
      matchedPattern = pattern;
    }
  }

  // 2. MỨC ĐỘ 1: SENTIMENT (Đánh giá sắc thái & Bối cảnh chiều hướng)
  // Căn cứ 5 thành tố: Ngôn ngữ + Bối cảnh + Đối tượng + Hệ quả + Sắc thái bản chất
  const isBearish = !isRoutineGovernance && !isEnforcement && !isPureMarket && (item.sentiment === 'bearish' || (typeof item.sentimentScore === 'number' && item.sentimentScore < -15));
  const isBullish = isRoutineGovernance || isPureMarket || (!isEnforcement && (item.sentiment === 'bullish' || (typeof item.sentimentScore === 'number' && item.sentimentScore > 15)));
  const rawScore = typeof item.sentimentScore === 'number' 
    ? (isRoutineGovernance || isPureMarket ? Math.max(item.sentimentScore, 20) : item.sentimentScore)
    : (isBearish ? -45 : isBullish ? 50 : 0);

  // Nhận diện rủi ro ẩn sau tiêu đề trung tính (Hidden risk behind neutral title)
  // Lưu ý: Các văn bản công bố luật/lệnh chủ tịch nước thường quy & tin thị trường thuần túy KHÔNG coi là rủi ro ẩn
  const hasHiddenRiskBehindNeutralTitle = Boolean(
    !isRoutineGovernance && !isEnforcement && !isPureMarket && !isBearish && (
      (matchedPattern && (
        matchedPattern.id === 'household_business_tax_reform' ||
        matchedPattern.id === 'budget_collection_vs_biz_health' ||
        matchedPattern.id === 'ai_algorithmic_trading_stocks' ||
        matchedPattern.id === 'public_investment_bottleneck' ||
        matchedPattern.id === 'global_minimum_tax_digital_assets' ||
        matchedPattern.id === 'personal_income_tax_family_deduction'
      )) ||
      (fullText.includes('hộ kinh doanh') && (fullText.includes('thủ tục') || fullText.includes('doanh thu') || fullText.includes('vướng mắc') || fullText.includes('hướng dẫn'))) ||
      (fullText.includes('thu ngân sách') && (fullText.includes('sức khỏe doanh nghiệp') || fullText.includes('gánh nặng thuế') || fullText.includes('tận thu') || fullText.includes('kiệt quệ') || fullText.includes('kêu cứu'))) ||
      (fullText.includes('ai') && fullText.includes('chứng khoán') && (fullText.includes('thao túng') || fullText.includes('bất bình đẳng') || fullText.includes('tranh chấp'))) ||
      (fullText.includes('giảm trừ gia cảnh') && fullText.includes('thuế tncn') && (fullText.includes('lạc hậu') || fullText.includes('bất cập') || fullText.includes('kiến nghị tăng')))
    )
  );

  let sentimentDirection: WarningLevel1Sentiment['sentimentDirection'] = 'Trung tính';
  if (isPureMarket) {
    sentimentDirection = isBullish ? 'Tích cực' : 'Trung tính';
  } else if (isRoutineGovernance) {
    sentimentDirection = 'Tích cực';
  } else if (isEnforcement) {
    sentimentDirection = 'Tiêu cực';
  } else if (isBearish) {
    sentimentDirection = 'Tiêu cực';
  } else if (isBullish) {
    sentimentDirection = 'Tích cực';
  } else if (hasHiddenRiskBehindNeutralTitle) {
    sentimentDirection = 'Trung tính nhưng tiềm ẩn rủi ro';
  } else if (fullText.includes('tranh luận') || fullText.includes('trái chiều') || fullText.includes('ý kiến khác nhau')) {
    sentimentDirection = 'Trái chiều / Tranh luận';
  }

  // 5 Thành tố của Mức độ 1:
  // 1) Ngôn ngữ (Language):
  const languageAnalysis = isPureMarket
    ? 'Ngôn ngữ phản ánh diễn biến điểm số chỉ số chứng khoán (VN-Index) và luân chuyển dòng tiền giao dịch thị trường khách quan.'
    : isRoutineGovernance
    ? 'Ngôn ngữ pháp lý chuẩn mực, công bố Lệnh của Chủ tịch nước và văn bản Luật được Quốc hội thông qua, hoàn thiện hành lang pháp trị.'
    : isEnforcement
    ? 'Ngôn từ phản ánh sự vụ xử phạt vi phạm hành chính cá nhân trốn thuế hoặc tạm giữ lô hàng buôn lậu theo nghiệp vụ định kỳ, xã hội đồng thuận cao.'
    : isBearish
    ? `Ngôn ngữ phản ánh các từ khóa bức xúc, chỉ trích hoặc quan ngại trực tiếp: "${(item.keyPoints || []).slice(0, 2).join('; ') || 'nêu vướng mắc thực tiễn'}".`
    : hasHiddenRiskBehindNeutralTitle
    ? 'Ngôn ngữ tiêu đề và câu từ mang tính mô tả số liệu, trung tính khách quan nhưng gợi mở bối cảnh cần phân tích sâu.'
    : 'Ngôn ngữ mang tính thông tin định kỳ, ghi nhận kết quả và truyền tải chỉ đạo điều hành.';

  // 2) Bối cảnh (Context):
  const contextAnalysis = matchedPattern
    ? matchedPattern.contextTheme
    : isRoutineGovernance
    ? 'Công bố Luật và các quyết sách hoàn thiện thể chế nằm trong chương trình điều hành và xây dựng pháp luật thường quy của Nhà nước.'
    : `Tin tức xuất hiện trong bối cảnh điều hành lĩnh vực ${sectorNameVi}, có sự quan tâm của thị trường và các bên liên quan.`;

  // 3) Đối tượng (Target Entity):
  const targetEntityAnalysis = isRoutineGovernance
    ? 'Chủ tịch nước, Quốc hội, Bộ Tài chính, Ngân hàng Nhà nước và toàn thể hệ thống tài chính - doanh nghiệp'
    : (item.agencies?.[0] || 'Bộ Tài chính, các đơn vị trực thuộc (Cục Thuế, Cục Hải quan, UBCKNN, KBNN, Cục Thống kê, BHXH VN) và cộng đồng doanh nghiệp');

  // 4) Hệ quả (Consequence):
  const consequenceAnalysis = isRoutineGovernance
    ? 'Tạo cơ sở pháp lý vững chắc, nâng cao tính minh bạch, phòng chống rửa tiền và thúc đẩy thị trường phát triển an toàn, lành mạnh.'
    : matchedPattern
    ? matchedPattern.underlyingRisk
    : isBearish
    ? 'Có khả năng tạo áp lực giải trình hoặc phát sinh yêu cầu hướng dẫn nghiệp vụ rõ ràng hơn cho cơ quan quản lý.'
    : 'Tạo tâm lý ổn định, củng cố niềm tin thị trường và minh bạch hóa thông tin chính sách.';

  // 5) Sắc thái bản chất (Sentiment Nuance):
  const sentimentNuanceAnalysis = isRoutineGovernance
    ? 'Sắc thái chính thức, tích cực, khẳng định quyết tâm hoàn thiện thể chế và nâng cao năng lực phòng ngừa rủi ro vĩ mô của Nhà nước.'
    : hasHiddenRiskBehindNeutralTitle
    ? 'Tiêu đề trung tính nhưng bối cảnh thực tế cho thấy cộng đồng doanh nghiệp và thị trường đang đặt câu hỏi về gánh nặng thực thi, tính khả thi hoặc sự công bằng.'
    : isBearish
    ? 'Sắc thái nghiêng về quan ngại, phản ánh khó khăn hoặc chỉ trích điểm nghẽn thực thi.'
    : 'Sắc thái tích cực, đồng thuận với định hướng điều hành của cơ quan quản lý.';

  const level1Sentiment: WarningLevel1Sentiment = {
    levelTitle: 'Mức độ 1: Đánh giá Sắc thái & Chiều hướng Dư luận (SENTIMENT)',
    coreQuestion: 'Tin tức báo chí - dư luận đang nói về Bộ Tài chính, các lĩnh vực và Lãnh đạo Bộ theo chiều hướng nào?',
    sentimentDirection,
    polarityScore: rawScore,
    criteria: {
      language: languageAnalysis,
      context: contextAnalysis,
      targetEntity: targetEntityAnalysis,
      consequence: consequenceAnalysis,
      sentimentNuance: sentimentNuanceAnalysis
    },
    hasHiddenRiskBehindNeutralTitle,
    summaryExplanation: isRoutineGovernance
      ? 'Đánh giá tự động: Hoạt động quản trị nhà nước, công bố văn bản quy phạm pháp luật hoặc phát biểu chỉ đạo đôn đốc trách nhiệm thường quy của Lãnh đạo. Mang tính tích cực, củng cố kỷ cương điều hành và niềm tin thị trường.'
      : hasHiddenRiskBehindNeutralTitle
      ? `Tự động gắn cờ cảnh báo: Mặc dù tiêu đề bài viết mang sắc thái trung tính, nhưng đặt trong bối cảnh thực tiễn của ngành ${sectorNameVi}, vấn đề tiềm ẩn nguy cơ trở thành điểm nóng dư luận nếu không chủ động thông tin định hướng.`
      : `Đánh giá tổng thể cho thấy bài viết phản ánh sắc thái ${sentimentDirection} với điểm số cảm xúc ${rawScore > 0 ? `+${rawScore}` : rawScore}/100.`
  };

  // 3. MỨC ĐỘ 2: RISK (Dấu hiệu Khủng hoảng Thể chế & 4 Thuộc tính Đe dọa)
  // Đánh giá 4 thuộc tính:
  // 1. Tổn hại uy tín (Reputation damage potential)
  // 2. Quy kết trách nhiệm (Accountability attribution)
  // 3. Kiến nghị sửa đổi thể chế (Policy petitions)
  // 4. Tác động môi trường kinh doanh & nhà đầu tư (Socio-economic / Investor impact)

  // Kiểm tra cụ thể từng tiêu chí:
  const isNegatedBlameOrDirective = 
    /không buông lỏng|không được buông lỏng|kiên quyết không buông lỏng|không để xảy ra buông lỏng|không đùn đẩy|không lơ là|bộ trưởng.*không buông lỏng|chỉ đạo.*không buông lỏng|đôn đốc giải ngân/i.test(fullText);

  const isNegatedReputationRisk =
    /không để xảy ra (tiêu cực|sai phạm|thất thoát)|chống (tiêu cực|thất thoát|lãng phí)|phòng ngừa (tiêu cực|sai phạm)|ngăn chặn (tiêu cực|sai phạm)/i.test(fullText);

  const hasReputationKeywords = !isRoutineGovernance && !isNegatedReputationRisk && /chỉ trích|lên án|bị tố|tiêu cực|khởi tố|bắt giam|vụ án|thao túng|gian lận|thất thoát|sai phạm nghiêm trọng/i.test(fullText);
  const hasBlameKeywords = !isRoutineGovernance && !isNegatedBlameOrDirective && /buông lỏng|chậm trễ|thủ tục rườm rà|làm khó|hạch sách|sách nhiễu|nghẽn|ùn tắc|chậm hoàn thuế|ách tắc/i.test(fullText);
  const hasPetitionKeywords = /kiến nghị|đề xuất|kêu cứu|yêu cầu|đòi quyền lợi|đề nghị gỡ khó|sửa thông tư|sửa nghị định|sửa luật/i.test(fullText);
  const hasInvestorBizKeywords = /chi phí tuân thủ|gánh nặng thuế|dòng tiền|thiệt hại|quyền lợi nhà đầu tư|môi trường kinh doanh|khó khăn dòng tiền/i.test(fullText);

  // PHÁT HIỆN ĐỘ VÊNH CHỈ ĐẠO VÀ THỰC TIỄN (NARRATIVE-REALITY DIVERGENCE)
  // So sánh giữa thông điệp chỉ đạo quyết liệt và số liệu/thực trạng thực tế địa phương
  const hasDirectiveTone = /chỉ đạo|yêu cầu|đôn đốc|quyết liệt|tăng tốc|thúc đẩy|nêu cao trách nhiệm|không buông lỏng/i.test(fullText);
  const hasRealityLagTone = /chậm trễ|ách tắc|ì ạch|kêu cứu|bất cập|vướng mắc|nghẽn|chưa đạt|tồn đọng|thấp hơn kỳ vọng|gặp khó|địa phương kêu/i.test(fullText);
  const isDivergenceDetected = !isRoutineGovernance && (
    (hasDirectiveTone && hasRealityLagTone) ||
    matchedPattern?.id === 'public_investment_bottleneck' ||
    matchedPattern?.id === 'budget_collection_vs_biz_health' ||
    (fullText.includes('giải ngân') && (fullText.includes('chậm') || fullText.includes('ì ạch') || fullText.includes('tồn ngân'))) ||
    (fullText.includes('hoàn thuế') && (fullText.includes('ách tắc') || fullText.includes('chậm')))
  );

  let divergenceDetails: string | null = null;
  if (isDivergenceDetected) {
    if (fullText.includes('giải ngân') || fullText.includes('đầu tư công')) {
      divergenceDetails = 'Phát hiện độ vênh: Lãnh đạo chỉ đạo quyết liệt tăng tốc giải ngân đầu tư công nhưng thực tế tiến độ tại nhiều địa phương vẫn chậm trễ, phát sinh phản ánh vướng mắc thủ tục kiểm soát chi KBNN.';
    } else if (fullText.includes('thuế') || fullText.includes('hộ kinh doanh')) {
      divergenceDetails = 'Phát hiện độ vênh: Mục tiêu chuyển đổi số và cải cách thủ tục thuế đối với hộ kinh doanh/DN chưa đồng bộ với trải nghiệm thực tế của người nộp thuế trên ứng dụng eTax Mobile.';
    } else {
      divergenceDetails = 'Phát hiện độ vênh giữa thông điệp chỉ đạo điều hành vĩ mô và phản ánh khó khăn thực tế từ cơ sở hoặc cộng đồng doanh nghiệp.';
    }
  }

  let repScore = isRoutineGovernance ? 5 : (matchedPattern ? matchedPattern.reputationRiskLevel : (hasReputationKeywords ? 75 : isBearish ? 60 : 20));
  let blameScore = isRoutineGovernance ? 5 : (matchedPattern ? matchedPattern.blameRiskLevel : (hasBlameKeywords ? 75 : isBearish ? 65 : 25));
  let petitionScore = isRoutineGovernance ? 10 : (matchedPattern ? matchedPattern.petitionRiskLevel : (hasPetitionKeywords ? 80 : isBearish ? 60 : 30));
  let investorBizScore = isRoutineGovernance ? 10 : (matchedPattern ? matchedPattern.investorBizImpactLevel : (hasInvestorBizKeywords ? 80 : isBearish ? 65 : 25));

  if (item.isEmergency && !isRoutineGovernance) {
    repScore = Math.max(repScore, 90);
    blameScore = Math.max(blameScore, 85);
    petitionScore = Math.max(petitionScore, 85);
    investorBizScore = Math.max(investorBizScore, 85);
  }

  const isReputationRisk = repScore >= 50;
  const isBlameRisk = blameScore >= 50;
  const isPetitionRisk = petitionScore >= 50;
  const isInvestorBizRisk = investorBizScore >= 50;

  let criteriaPassedCount = 0;
  if (isReputationRisk) criteriaPassedCount++;
  if (isBlameRisk) criteriaPassedCount++;
  if (isPetitionRisk) criteriaPassedCount++;
  if (isInvestorBizRisk) criteriaPassedCount++;

  let allFourCriteriaMet = criteriaPassedCount === 4;

  // SỬ DỤNG ĐỘNG CƠ THỐNG NHẤT SEVERITYALGORITHMENGINE ĐÃ TÁI CẤU TRÚC
  const unifiedRiskResult = SeverityAlgorithmEngine.calculateUnifiedRisk(item);
  
  const severityOutput = unifiedRiskResult.severityOutput;
  let S_severity = unifiedRiskResult.S;
  
  const divergenceOutput = unifiedRiskResult.divergenceOutput;
  let D_divergence = unifiedRiskResult.D;

  const velocityOutput = unifiedRiskResult.velocityOutput;
  let V_velocity = unifiedRiskResult.V;

  const impactOutput = unifiedRiskResult.impactOutput;
  let I_impact = unifiedRiskResult.I;

  let finalRiskScore = unifiedRiskResult.riskScore;
  let calculatedRiskScore = finalRiskScore;

  // ĐỐI SOÁT CHUẨN XÁC NGHỊ ĐỊNH 376/2026/NĐ-CP (CẨM NANG 100 TÌNH HUỐNG THỰC CHIẾN)
  const d376Result = Decree376ClassificationEngine.classify(item);
  if (d376Result.matchedScenario) {
    S_severity = d376Result.calibratedScores.S;
    D_divergence = d376Result.calibratedScores.D;
    V_velocity = d376Result.calibratedScores.V;
    I_impact = d376Result.calibratedScores.I;
    finalRiskScore = d376Result.calibratedScores.riskScore;
    calculatedRiskScore = finalRiskScore;
  }

  let crisisPotential: WarningLevel2Risk['crisisPotential'] = 'THẤP';
  if (isPureMarket) {
    finalRiskScore = 0;
    calculatedRiskScore = 0;
    crisisPotential = 'THẤP';
    criteriaPassedCount = 0;
    allFourCriteriaMet = false;
  } else if (isRoutineGovernance || isEnforcement) {
    crisisPotential = 'THẤP';
  } else if (finalRiskScore >= 75 || item.isEmergency || allFourCriteriaMet) {
    crisisPotential = 'RẤT CAO';
  } else if (finalRiskScore >= 60 || criteriaPassedCount >= 2 || isBearish) {
    crisisPotential = 'CAO';
  } else if (finalRiskScore >= 40 || hasHiddenRiskBehindNeutralTitle) {
    crisisPotential = 'TRUNG BÌNH';
  }

  const level2Risk: WarningLevel2Risk = {
    levelTitle: 'Mức độ 2: Dấu hiệu Khủng hoảng & Khả năng thành Vấn đề Truyền thông (RISK)',
    coreQuestion: 'Vấn đề này có khả năng trở thành vấn đề truyền thông đối với Bộ Tài chính hay không?',
    crisisPotential,
    riskScore: finalRiskScore,
    criteriaPassedCount,
    allFourCriteriaMet: (isRoutineGovernance || isPureMarket) ? false : allFourCriteriaMet,
    criteriaEvaluationNotes: [
      `1. Tổn hại uy tín: ${isReputationRisk && !isPureMarket ? 'CÓ NGUY CƠ' : 'AN TOÀN'} (${isPureMarket ? 0 : repScore}%)`,
      `2. Quy kết trách nhiệm: ${isBlameRisk && !isPureMarket ? 'CÓ NGUY CƠ' : 'AN TOÀN'} (${isPureMarket ? 0 : blameScore}%)`,
      `3. Kiến nghị & Yêu cầu: ${isPetitionRisk && !isPureMarket ? 'GHI NHẬN KIẾN NGHỊ' : 'BÌNH THƯỜNG'} (${isPureMarket ? 0 : petitionScore}%)`,
      `4. Môi trường đầu tư & Quyền lợi: ${isInvestorBizRisk && !isPureMarket ? 'CÓ TÁC ĐỘNG' : 'ÍT ẢNH HƯỞNG'} (${isPureMarket ? 0 : investorBizScore}%)`,
      `5. Độ vênh chỉ đạo - thực tế: ${isDivergenceDetected && !isPureMarket ? 'PHÁT HIỆN ĐỘ VÊNH (D=' + D_divergence + '/20)' : 'ĐỒNG BỘ'}`
    ],
    criteria: {
      reputationDamage: {
        hasRisk: isReputationRisk && !isPureMarket,
        score: isPureMarket ? 0 : repScore,
        analysis: isPureMarket
          ? 'Diễn biến giao dịch thị trường khách quan, hoàn toàn không gây tổn hại uy tín Bộ Tài chính.'
          : isReputationRisk
          ? `Có nguy cơ làm giảm sút uy tín của Bộ/Lãnh đạo Bộ nếu thông tin bị suy diễn là thiếu lắng nghe hoặc để xảy ra sai phạm (Mức rủi ro: ${repScore}%).`
          : `Không gây tổn hại trực tiếp đến uy tín của Bộ/Lãnh đạo Bộ, thông tin mang tính chuyên môn thuần túy (Mức an toàn: ${100 - repScore}%).`
      },
      blameAttribution: {
        hasRisk: isBlameRisk && !isPureMarket,
        score: isPureMarket ? 0 : blameScore,
        analysis: isPureMarket
          ? 'Không có yếu tố quy kết trách nhiệm đối với cơ quan quản lý.'
          : isBlameRisk
          ? `Xuất hiện xu hướng quy kết trách nhiệm buông lỏng, chậm trễ, thủ tục rườm rà cho cơ quan quản lý (${item.agencies?.[0] || 'Bộ Tài chính'}).`
          : 'Chưa thấy dấu hiệu quy kết trách nhiệm trực tiếp vào cá nhân Lãnh đạo hay đơn vị cụ thể của Bộ.'
      },
      policyPetitions: {
        hasRisk: isPetitionRisk && !isPureMarket,
        score: isPureMarket ? 0 : petitionScore,
        analysis: isPureMarket
          ? 'Không phát sinh kiến nghị chính sách.'
          : isPetitionRisk
          ? `Phát sinh kiến nghị cụ thể từ cộng đồng doanh nghiệp/hiệp hội đòi hỏi Bộ Tài chính phải tháo gỡ, sửa đổi thông tư/nghị định.`
          : 'Không phát sinh kiến nghị đột xuất, các đề xuất nếu có đều nằm trong chương trình xây dựng văn bản quy phạm pháp luật thường kỳ.',
        petitionItems: matchedPattern ? matchedPattern.samplePetitions : [
          `Kiến nghị Bộ Tài chính sớm ban hành văn bản hướng dẫn chi tiết đối với ${sectorNameVi}.`,
          'Đề nghị tăng cường đối thoại giải đáp vướng mắc cho các đối tượng chịu tác động.'
        ]
      },
      investorBizImpact: {
        hasRisk: isInvestorBizRisk && !isPureMarket,
        score: isPureMarket ? 0 : investorBizScore,
        analysis: isPureMarket
          ? 'Giao dịch thông thường giữa các nhà đầu tư trên thị trường, không chịu tác động tiêu cực từ chính sách.'
          : isInvestorBizRisk
          ? `Vấn đề đặt ra chính sách/cách làm ảnh hưởng trực tiếp tới chi phí tuân thủ, quyền lợi của nhà đầu tư và môi trường kinh doanh.`
          : 'Tác động thứ cấp, không làm xáo trộn lớn đến môi trường đầu tư hay hoạt động sản xuất kinh doanh thông thường.'
      }
    },
    overallRiskSummary: isPureMarket
      ? `Tổng kết: Diễn biến giao dịch chứng khoán/thị trường tài chính khách quan (VN-Index, cổ phiếu), không thuộc diện rủi ro chính sách của Bộ Tài chính (Điểm rủi ro: ${finalRiskScore}/100).`
      : isRoutineGovernance
      ? `Tổng kết: Thông tin mang tính điều hành thể chế, phát biểu chỉ đạo đôn đốc trách nhiệm hoặc công bố luật thường quy của Nhà nước, không có dấu hiệu khủng hoảng truyền thông (Điểm rủi ro: ${finalRiskScore}/100).`
      : `Tổng hợp lượng hóa: S=${S_severity}, D=${D_divergence}, V=${V_velocity}, I=${I_impact} -> Điểm rủi ro tổng hợp: ${finalRiskScore}/100đ (${crisisPotential}).`
  };

  // 4. MỨC ĐỘ 3: ACTIONABLE ALERT (Khả năng & Cấp độ hành động theo Bộ lọc Khoảng trống Thông tin)
  // NGUYÊN TẮC:
  // - Một tin được cảnh báo khi: Nó là KHOẢNG TRỐNG THÔNG TIN rồi mới cảnh báo các mức từ Xa đến Khẩn cấp.
  // - Có những KHOẢNG TRỐNG THÔNG TIN nhưng CHƯA ĐẾN MỨC CẢNH BÁO (chỉ đưa vào danh mục theo dõi thường nhật).
  // - Tin tức đầy đủ thông tin chính sách, điều hành thường quy hoặc diễn biến thị trường thuần túy -> KHÔNG CÓ KHOẢNG TRỐNG -> KHÔNG CẢNH BÁO.

  const hasUrgentGovernmentDirective = !isRoutineGovernance && !isPureMarket && /chỉ đạo hỏa tốc|thủ tướng chỉ đạo khẩn|công điện hỏa tốc|công điện khẩn|yêu cầu xử lý khẩn cấp sai phạm/i.test(fullText);
  const hasAcuteLegalCrisis = !isPureMarket && hasAcuteLegalCrisisDetection(fullText);

  // Đánh giá Khoảng trống Thông tin
  const informationVacuum = evaluateInformationVacuum(
    item,
    fullText,
    isRoutineGovernance,
    isEnforcement,
    finalRiskScore,
    criteriaPassedCount,
    matchedPattern
  );

  let alertLevel: WarningAlertLevelType = 'STANDARD';

  // =========================================================================
  // THIẾT LẬP 4 CẤP ĐỘ CẢNH BÁO ĐỘC LẬP THEO BÁO CÁO CHUYÊN ĐỀ NGÀNH TÀI CHÍNH:
  // - CẤP 1: CẢNH BÁO XA (Early Horizon / 20–39đ) - DISTANT
  // - CẤP 2: CẢNH BÁO SỚM (Early Warning / 40–59đ - Cấp phòng ngừa quan trọng nhất) - EARLY
  // - CẤP 3: CẢNH BÁO NHANH (Rapid Alert / 60–74đ) - RAPID
  // - CẤP 4: CẢNH BÁO KHẨN CẤP (Emergency Alert / 75–100đ) - EMERGENCY
  // - GIÁM SÁT THƯỜNG QUY (<20đ, xử phạt thường quy, điểm tin thị trường) - STANDARD (KHÔNG CẢNH BÁO)
  // =========================================================================
  if (d376Result.matchedScenario) {
    alertLevel = d376Result.alertLevel;
  } else if (d376Result.isExcluded || d376Result.tier === 0) {
    alertLevel = 'STANDARD';
  } else if (isPureMarket || informationVacuum.gapLevel === 'MARKET_DIGEST') {
    alertLevel = 'STANDARD';
  } else if (isRoutineGovernance || isEnforcement || (!informationVacuum.isAlertWarranted && !informationVacuum.hasGap && finalRiskScore < 20) || informationVacuum.gapLevel === 'NO_GAP' || informationVacuum.gapLevel === 'MONITORING_NO_ALERT') {
    alertLevel = 'STANDARD';
  } else if (finalRiskScore >= 75 || hasAcuteLegalCrisis || hasUrgentGovernmentDirective) {
    alertLevel = 'EMERGENCY'; // Cấp 4: Cảnh Báo Khẩn Cấp (75–100đ)
  } else if (finalRiskScore >= 60) {
    alertLevel = 'RAPID';     // Cấp 3: Cảnh Báo Nhanh (60–74đ)
  } else if (finalRiskScore >= 40) {
    alertLevel = 'EARLY';     // Cấp 2: Cảnh Báo Sớm (40–59đ - Cấp phòng ngừa quan trọng nhất)
  } else if (finalRiskScore >= 20 || informationVacuum.hasGap) {
    alertLevel = 'DISTANT';   // Cấp 1: Cảnh Báo Xa (20–39đ)
  } else {
    alertLevel = 'STANDARD';  // Giám sát thường quy (<20đ)
  }

  // Đồng bộ trạng thái sang item gốc để UI và các luồng phân loại khác sử dụng nhất quán
  item.informationVacuum = informationVacuum;
  item.hasInformationGap = informationVacuum.hasGap;
  item.isGapBelowAlertThreshold = informationVacuum.gapLevel === 'MONITORING_NO_ALERT';
  item.decree376Tier = d376Result.tier;
  item.decree376ScenarioCode = d376Result.scenarioCode;
  item.decree376Clause = d376Result.decree376Clause;
  item.decree376Reason = d376Result.classificationReason;
  item.leadUnit = d376Result.leadAgency.name;
  item.cooperatingUnits = d376Result.cooperatingUnits || item.cooperatingUnits || [];
  item.riskScore = finalRiskScore;
  if (isPureMarket || informationVacuum.gapLevel === 'MARKET_DIGEST') {
    item.isMarketDigest = true;
    item.marketDigestReason = 'Diễn biến giao dịch chứng khoán/thị trường thuần túy (VN-Index, biến động cổ phiếu), không thuộc diện rủi ro chính sách của Bộ Tài chính.';
    item.isUrgent = false;
    item.isEmergency = false;
  }

  const alertBadgeMap: Record<WarningAlertLevelType, { label: string; badge: string; timing: string }> = {
    DISTANT: {
      label: 'Cấp 1: Cảnh Báo Xa — Early Horizon (20–39đ)',
      badge: '🔭 CẢNH BÁO XA',
      timing: 'Đưa vào danh sách giám sát tự động • Lập Q&A nội bộ • Chuẩn bị thông điệp định hướng • Không lên tiếng vội vã trên báo chí'
    },
    EARLY: {
      label: 'Cấp 2: Cảnh Báo Sớm — Early Warning (40–59đ)',
      badge: '⏳ CẢNH BÁO SỚM',
      timing: 'Làm việc ngay với Cục/Vụ chuyên môn • Hoàn thiện ngân hàng Q&A • Chuẩn bị người phát ngôn • Soạn bài hướng dẫn nghiệp vụ • Giám sát 24h'
    },
    RAPID: {
      label: 'Cấp 3: Cảnh Báo Nhanh — Rapid Alert (60–74đ)',
      badge: '⚡ CẢNH BÁO NHANH',
      timing: 'Báo cáo nhanh Lãnh đạo Bộ • Phân công đầu mối xử lý và phát ngôn ngay trong ngày (12h) • Phối hợp báo chí chủ lực (Nhân Dân, VTV, Cổng CP)'
    },
    EMERGENCY: {
      label: 'Cấp 4: Cảnh Báo Khẩn Cấp — Emergency Alert (75–100đ)',
      badge: '🚨 CẢNH BÁO KHẨN CẤP',
      timing: 'Kích hoạt ngay Tổ phản ứng nhanh • Không chờ báo cáo ngày • Họp báo/Thông cáo báo chí trong 2–4 giờ • Phối hợp an ninh mạng xử lý tin giả'
    },
    STANDARD: {
      label: 'Giám sát Thường quy — Standard Monitoring (<20đ)',
      badge: '📋 GIÁM SÁT THƯỜNG QUY',
      timing: 'Điểm tin giám sát thường quy / Điều hành định kỳ / Cưỡng chế vi phạm theo quy chuẩn (Không phát cảnh báo)'
    },
    MARKET_DIGEST: {
      label: 'Điểm tin Thị trường — Market Digest (Không cảnh báo)',
      badge: '📊 ĐIỂM TIN THỊ TRƯỜNG',
      timing: 'Điểm tin biến động giao dịch thị trường khách quan (VN-Index, cổ phiếu) • Không phát sinh rủi ro chính sách đối với Bộ Tài chính'
    }
  };

  const defaultPlaybookByLevel: Record<WarningAlertLevelType, WarningPlaybookPhase[]> = {
    EMERGENCY: [
      {
        phase: '1. Kích hoạt Tổ Phản ứng Nhanh Khủng hoảng (trong vòng 2–4 giờ)',
        actions: [
          'Báo cáo hỏa tốc Lãnh đạo Bộ và Ban Cán sự Đảng; không chờ chu kỳ báo cáo ngày.',
          'Kích hoạt ngay Tổ phản ứng nhanh khủng hoảng truyền thông của Bộ Tài chính.',
          'Tổ chức họp báo hoặc phát hành thông cáo báo chí chính thức trong vòng 2–4 giờ.',
          'Phối hợp với Ban Tuyên giáo, Bộ TT&TT và các cơ quan chức năng để ngăn chặn và xử lý tin giả, thông tin sai lệch.'
        ]
      },
      {
        phase: '2. Kiểm soát Lan truyền & Ổn định Thị trường',
        actions: [
          'Chỉ định người phát ngôn duy nhất có thẩm quyền cung cấp thông tin thống nhất.',
          'Cập nhật thông cáo chính thức trên Cổng TTĐT Bộ Tài chính và hệ thống thông tấn báo chí quốc gia.'
        ]
      }
    ],
    RAPID: [
      {
        phase: '1. Báo cáo Nhanh Lãnh đạo & Phân công Đầu mối trong Ngày (trong 12h)',
        actions: [
          'Báo cáo nhanh Lãnh đạo Bộ và phân công đơn vị đầu mối chuyên môn xử lý ngay trong ngày.',
          'Phối hợp với các cơ quan báo chí chủ lực (Báo Đầu tư, Tuổi Trẻ, VnExpress, Thời báo Tài chính...) đăng bài giải thích nghiệp vụ.',
          'Khẩn trương ban hành văn bản hướng dẫn hoặc văn bản trả lời báo chí để giải tỏa bức xúc.'
        ]
      },
      {
        phase: '2. Cung cấp Thông tin Minh bạch & Định hướng Dư luận',
        actions: [
          'Tổ chức cung cấp thông tin chuyên đề cho các phóng viên phụ trách ngành tài chính.',
          'Theo dõi phản hồi của dư luận sau khi phát hành nội dung định hướng để kịp thời điều chỉnh.'
        ]
      }
    ],
    EARLY: [
      {
        phase: '1. Xác minh, Bóc tách Nguyên nhân & Lập Bộ Q&A (Early Warning 24h SOP)',
        actions: [
          '1. Xác minh thông tin: Làm việc với Cục/Vụ chuyên môn để xác minh nguyên nhân gốc rễ của bức xúc/vướng mắc.',
          '2. Xác định nguyên nhân: Phân loại nguyên nhân do quy định chưa rõ, độ trễ hệ thống hay thao tác thực thi tại địa phương.',
          '3. Tìm nguồn: Truy vết các diễn đàn doanh nghiệp, cổng tiếp nhận kiến nghị và mạng xã hội khởi phát luồng ý kiến.',
          '4. Lập Q&A: Hoàn thiện ngân hàng câu hỏi - đáp (Q&A) chi tiết đón đầu các thắc mắc chuyên sâu.',
        ]
      },
      {
        phase: '2. Chuẩn bị Phát ngôn & Thiết lập Giám sát 24 Giờ',
        actions: [
          '5. Chuẩn bị người phát ngôn: Chỉ định lãnh đạo Cục/Vụ có chuyên môn để sẵn sàng giải thích khi báo chí chất vấn.',
          '6. Soạn bài giải thích: Soạn thảo sẵn bài giải thích chính sách, tài liệu infographic hoặc video hướng dẫn cụ thể.',
          '7. Giám sát 24h: Thiết lập chế độ theo dõi liên tục 24 giờ để phát hiện ngay các biến động leo thang.',
        ]
      }
    ],
    DISTANT: [
      {
        phase: '1. Theo dõi Tự động & Xây dựng Q&A Nội bộ (3 - 7 ngày)',
        actions: [
          'Đưa nội dung chính sách mới vào danh sách theo dõi tự động của hệ thống.',
          'Xây dựng ngay bộ tài liệu Hỏi - Đáp nội bộ (Internal Q&A) để thống nhất nhận thức trong toàn ngành.',
          'Chuẩn bị sẵn sàng thông điệp định hướng chính sách từ góc độ bảo vệ thị trường và người tiêu dùng.',
          'Không phát ngôn sớm trên truyền thông đại chúng để tránh tạo sự chú ý không cần thiết.'
        ]
      }
    ],
    STANDARD: [
      {
        phase: '1. Giám sát Thường quy & Điểm tin Quản trị',
        actions: [
          'Ghi nhận thông tin điều hành thể chế, tổng hợp dữ liệu phục vụ báo cáo định kỳ.',
          'Lan tỏa các điểm sáng điều hành, tiến độ giải ngân tích cực và kinh nghiệm quản lý tốt.'
        ]
      }
    ],
    MARKET_DIGEST: [
      {
        phase: '1. Ghi nhận Diễn biến Thị trường Tham khảo (Không kích hoạt cảnh báo)',
        actions: [
          'Ghi nhận số liệu phiên giao dịch và biến động dòng tiền phục vụ điểm tin tổng hợp thị trường.',
          'Không kích hoạt cảnh báo, không yêu cầu can thiệp hay phát ngôn từ cơ quan quản lý.'
        ]
      }
    ]
  };

  const badgeInfo = (isPureMarket || informationVacuum.gapLevel === 'MARKET_DIGEST')
    ? {
        label: 'Điểm tin Thị trường — Market Digest (Không cảnh báo)',
        badge: '📊 ĐIỂM TIN THỊ TRƯỜNG',
        timing: 'Điểm tin biến động giao dịch thị trường khách quan (VN-Index, cổ phiếu) • Không phát sinh rủi ro chính sách đối với Bộ Tài chính'
      }
    : alertBadgeMap[alertLevel];

  const level3Action: WarningLevel3Action = {
    levelTitle: 'Mức độ 3: Khả năng & Cấp độ Hành động (ACTIONABLE ALERT)',
    coreQuestion: 'Có cần hành động không? Nếu hành động thì như thế nào (sớm hay bình thường, làm những gì)?',
    requiresAction: alertLevel !== 'STANDARD' && !isPureMarket,
    alertLevel,
    alertLevelLabelVi: badgeInfo.label,
    alertLevelBadge: badgeInfo.badge,
    urgencyTiming: badgeInfo.timing,
    leadUnit: matchedPattern?.leadUnit || assignDepartmentWorkflow(item).leadUnit,
    cooperatingUnits: matchedPattern?.cooperatingUnits || assignDepartmentWorkflow(item).cooperatingUnits,
    actionPlaybook: (isPureMarket || informationVacuum.gapLevel === 'MARKET_DIGEST')
      ? [
          {
            phase: '1. Ghi nhận Diễn biến Thị trường Tham khảo',
            actions: [
              'Ghi nhận số liệu phiên giao dịch và biến động dòng tiền phục vụ điểm tin tổng hợp thị trường.',
              'Không kích hoạt cảnh báo, không yêu cầu can thiệp hay phát ngôn từ cơ quan quản lý.'
            ]
          }
        ]
      : (matchedPattern?.playbook || defaultPlaybookByLevel[alertLevel]),
    contingencyScenario: alertLevel === 'EMERGENCY'
      ? 'Nếu dư luận bùng phát diện rộng: Kích hoạt Tổ phản ứng nhanh khủng hoảng, chỉ định người phát ngôn duy nhất và phát hành thông cáo báo chí trong vòng 2-4h.'
      : alertLevel === 'RAPID'
      ? 'Nếu xuất hiện thêm ý kiến trái chiều gay gắt: Tổ chức họp báo chuyên đề hoặc đối thoại trực tiếp với các hiệp hội doanh nghiệp để giải tỏa vướng mắc trong ngày.'
      : alertLevel === 'EARLY'
      ? 'Nếu các hiệp hội doanh nghiệp gửi văn bản kiến nghị chính thức: Kích hoạt quy trình làm việc khẩn cấp giữa Vụ Chính sách Thuế/Cục Thuế với đại diện hiệp hội.'
      : 'Nếu dư luận xuất hiện câu hỏi mới: Chủ động cập nhật ngân hàng Q&A nội bộ và hoàn thiện khung hướng dẫn.'
  };

  // 5. CHUẨN BỊ TOÀN VĂN OUTPUT JSON SCHEMA CHUẨN CHO VIBE CODING
  const standardizedJsonOutput: StandardizedWarningSystemOutput = {
    tier_1_sentiment: {
      polarity: sentimentDirection === 'Tích cực' ? 'POSITIVE' : sentimentDirection === 'Tiêu cực' ? 'NEGATIVE' : 'NEUTRAL',
      confidence_score: Number((Math.min(0.99, Math.max(0.75, Math.abs(rawScore) / 100 + 0.3))).toFixed(2)),
      linguistic_markers: item.keyPoints && item.keyPoints.length > 0 ? item.keyPoints.slice(0, 4) : [title],
      target_entity: level1Sentiment.criteria.targetEntity,
      summary_tone: level1Sentiment.criteria.sentimentNuance
    },
    tier_2_crisis_risk: {
      reputation_damage_potential: repScore >= 80 ? 'CRITICAL' : repScore >= 60 ? 'HIGH' : repScore >= 40 ? 'MEDIUM' : repScore >= 20 ? 'LOW' : 'NONE',
      accountability_attribution: blameScore >= 75 ? 'DIRECT_LEADERSHIP' : blameScore >= 50 ? 'DIRECT_MINISTRY' : blameScore >= 25 ? 'INDIRECT' : 'NONE',
      socio_economic_impact_scale: I_impact >= 0.8 ? 'SYSTEMIC' : I_impact >= 0.6 ? 'NATIONAL' : I_impact >= 0.4 ? 'SECTORAL' : 'LOCAL',
      stakeholders_affected: matchedPattern?.samplePetitions || [
        'Cộng đồng doanh nghiệp trong ngành',
        'Người nộp thuế và cá nhân kinh doanh',
        'Cơ quan quản lý nhà nước ngành Tài chính'
      ],
      narrative_divergence_detected: isDivergenceDetected,
      divergence_details: divergenceDetails,
      core_institutional_risks: [
        `Rủi ro suy giảm niềm tin điều hành nếu chính sách phát sinh vướng mắc thực tiễn.`,
        `Nguy cơ phát sinh đơn thư kiến nghị tập thể từ các hiệp hội ngành nghề.`,
        `Ảnh hưởng đến chi phí tuân thủ và môi trường kinh doanh.`
      ]
    },
    tier_3_actionable_alert: {
      risk_score: finalRiskScore,
      alert_level: alertLevel === 'EMERGENCY' ? 'EMERGENCY_ALERT' : alertLevel === 'RAPID' ? 'RAPID_ALERT' : (alertLevel === 'EARLY' || (alertLevel as string) === 'DISTANT') ? 'EARLY_WARNING' : 'STANDARD_MONITORING',
      urgency: alertLevel === 'EMERGENCY' ? 'IMMEDIATE' : alertLevel === 'RAPID' ? 'SAME_DAY' : (alertLevel === 'EARLY' || (alertLevel as string) === 'DISTANT') ? 'WITHIN_24H' : 'ROUTINE',
      vulnerability_analysis: `Đánh giá tổn thương thể chế: Điểm Severty=${S_severity}/50, Độ vênh Divergence=${D_divergence}/20, Gia tốc Velocity=${V_velocity}, Tác động Impact=${I_impact}. Tổng điểm rủi ro=${finalRiskScore}/100.`,
      formula_metrics: {
        S_severity,
        D_divergence,
        V_velocity,
        I_impact,
        calculation_formula: `min(100, (0.7 * ${S_severity} + 0.3 * ${D_divergence}) * (1 + 0.3 * ${V_velocity} + 0.4 * ${I_impact})) = ${finalRiskScore}`
      },
      recommended_actions: alertLevel === 'EMERGENCY' ? [
        { action_type: 'CRISIS_TEAM_CONVENE', description: 'Kích hoạt ngay Tổ phản ứng nhanh khủng hoảng truyền thông trong vòng 2–4 giờ.', lead_department: level3Action.leadUnit },
        { action_type: 'PRESS_RELEASE', description: 'Phát hành thông cáo báo chí chính thức làm rõ sự thật và ổn định dư luận.', lead_department: 'Văn phòng Bộ Tài chính' }
      ] : alertLevel === 'RAPID' ? [
        { action_type: 'REGULATORY_GUIDANCE', description: 'Ban hành văn bản hướng dẫn nghiệp vụ giải tỏa bức xúc trong ngày.', lead_department: level3Action.leadUnit },
        { action_type: 'PRESS_RELEASE', description: 'Phối hợp báo chí chủ lực đăng bài giải thích chính sách.', lead_department: 'Văn phòng Bộ' }
      ] : alertLevel === 'EARLY' ? [
        { action_type: 'PREPARE_QA', description: 'Làm việc với Cục/Vụ chuyên môn hoàn thiện ngân hàng Q&A chi tiết và chuẩn bị người phát ngôn.', lead_department: level3Action.leadUnit },
        { action_type: 'MONITORING', description: 'Thiết lập chế độ giám sát radar 24 giờ liên tục theo dõi diễn biến.', lead_department: 'Cục Tin học & Thống kê Tài chính' }
      ] : [
        { action_type: 'MONITORING', description: 'Đưa vào danh sách theo dõi tự động, xây dựng Q&A nội bộ.', lead_department: level3Action.leadUnit }
      ]
    }
  };

  // 6. Khởi tạo 7 Bước trong Chuỗi Cảnh báo (Pipeline Stages)
  const pipelineStages: WarningPipelineStageItem[] = [
    {
      stage: 'SIGNAL',
      titleVi: '1. Tín hiệu (Signal)',
      badge: 'TÍN HIỆU KHỞI PHÁT',
      summary: `Tín hiệu phát hiện từ nguồn ${item.source || 'Báo chí'}: "${title.slice(0, 90)}${title.length > 90 ? '...' : ''}"`,
      details: [
        `Nguồn phát tin: ${item.source || 'Cơ quan thông tấn'}`,
        `Thời điểm phát hiện: ${item.publishedTimeStr || item.timeAgo || 'Vừa phát hiện'}`,
        `Lĩnh vực liên quan: ${sectorNameVi}`
      ],
      status: alertLevel === 'EMERGENCY' ? 'CRITICAL' : isBearish ? 'WARNING' : 'SAFE'
    },
    {
      stage: 'CONTEXT',
      titleVi: '2. Đặt trong Bối cảnh (Context)',
      badge: 'BỐI CẢNH THỰC TẾ',
      summary: level1Sentiment.criteria.context,
      details: [
        `5 thành tố Mức 1: Ngôn ngữ + Bối cảnh + Đối tượng + Hệ quả + Sắc thái`,
        `Cờ rủi ro ẩn: ${hasHiddenRiskBehindNeutralTitle ? 'Phát hiện tiêu đề trung tính nhưng bối cảnh tiềm ẩn rủi ro' : 'Bình thường'}`,
        `Độ vênh chỉ đạo - thực tế: ${isDivergenceDetected ? 'Có dấu hiệu phân kỳ' : 'Đồng bộ'}`
      ],
      status: hasHiddenRiskBehindNeutralTitle ? 'WATCH' : isBearish ? 'WARNING' : 'SAFE'
    },
    {
      stage: 'RISK',
      titleVi: '3. Nhận diện Rủi ro (Risk)',
      badge: 'DẤU HIỆU KHỦNG HOẢNG',
      summary: level2Risk.overallRiskSummary,
      details: [
        `Mức độ nghiêm trọng (S): ${S_severity}/50`,
        `Độ vênh chỉ đạo - thực tế (D): ${D_divergence}/20`,
        `Tổn hại uy tín: ${repScore}% | Quy kết trách nhiệm: ${blameScore}%`,
        `Kiến nghị DN/NĐT: ${petitionScore}% | Tác động môi trường ĐT: ${investorBizScore}%`
      ],
      status: finalRiskScore >= 75 ? 'CRITICAL' : finalRiskScore >= 50 ? 'WARNING' : finalRiskScore >= 30 ? 'WATCH' : 'SAFE'
    },
    {
      stage: 'VELOCITY',
      titleVi: '4. Tốc độ Lan truyền (Velocity)',
      badge: 'GIA TỐC PHÁT TÁN',
      summary: `Hệ số V=${V_velocity} (Buzz Score: ${item.buzzScore || 50}/100). ${matchedPattern?.velocityRiskProfile || 'Mức độ quan tâm ổn định.'}`,
      details: [
        `Số lượng báo/kênh đồng đăng tải: ${item.syndicationCount || 1} nguồn`,
        `Mức độ gia tốc: ${item.velocityStatus === 'spike' ? 'Bùng nổ đột biến (Spike)' : item.velocityStatus === 'accelerating' ? 'Lan tỏa nhanh (Accelerating)' : 'Bình thường (Normal)'}`,
        `Bình luận dư luận ghi nhận: ${item.commentCount || 0} lượt phản hồi`
      ],
      status: (item.buzzScore || 50) >= 80 ? 'CRITICAL' : (item.buzzScore || 50) >= 65 ? 'WARNING' : 'SAFE'
    },
    {
      stage: 'IMPACT',
      titleVi: '5. Đánh giá Tác động (Impact)',
      badge: 'PHẠM VI ẢNH HƯỞNG',
      summary: `Hệ số I=${I_impact}. ${matchedPattern?.impactDomain || `Tác động đến công tác quản lý điều hành lĩnh vực ${sectorNameVi} và tâm lý thị trường.`}`,
      details: [
        `Phạm vi tác động: ${standardizedJsonOutput.tier_2_crisis_risk.socio_economic_impact_scale}`,
        `Hệ lụy chính sách: ${level1Sentiment.criteria.consequence}`
      ],
      status: alertLevel === 'EMERGENCY' ? 'CRITICAL' : item.impactLevel === 'high' ? 'WARNING' : 'SAFE'
    },
    {
      stage: 'ESCALATION',
      titleVi: '6. Dấu hiệu Leo thang (Escalation)',
      badge: 'NGUY CƠ BÙNG PHÁT',
      summary: matchedPattern?.escalationTrigger || (isBearish ? 'Có nguy cơ xuất hiện thêm các bài viết phản biện liên tiếp từ các cơ quan báo chí khác.' : 'Chưa ghi nhận dấu hiệu phát tán tiêu cực chéo giữa các nền tảng.'),
      details: [
        `Khả năng bùng phát khủng hoảng: ${crisisPotential}`,
        `Kịch bản ứng phó dự phòng: ${level3Action.contingencyScenario}`
      ],
      status: crisisPotential === 'RẤT CAO' ? 'CRITICAL' : crisisPotential === 'CAO' ? 'WARNING' : crisisPotential === 'TRUNG BÌNH' ? 'WATCH' : 'SAFE'
    },
    {
      stage: 'ALERT',
      titleVi: '7. Kết luận Cảnh báo (Alert)',
      badge: level3Action.alertLevelBadge,
      summary: `Phân loại cấp độ: ${level3Action.alertLevelLabelVi}. Điểm Risk_Score: ${finalRiskScore}/100. Thời hạn tác chiến: ${level3Action.urgencyTiming}.`,
      details: [
        `Đơn vị chủ trì: ${level3Action.leadUnit}`,
        `Kế hoạch tác chiến gồm ${level3Action.actionPlaybook.length} giai đoạn SOP cụ thể.`
      ],
      status: alertLevel === 'EMERGENCY' ? 'CRITICAL' : alertLevel === 'RAPID' ? 'WARNING' : alertLevel === 'EARLY' ? 'WATCH' : 'SAFE'
    }
  ];

  const executiveBrief = `MÔ HÌNH CẢNH BÁO [${alertBadgeMap[alertLevel].badge}]: Bài viết "${title.slice(0, 70)}..." thuộc lĩnh vực ${sectorNameVi}. ` +
    `Đánh giá 3 Tầng: [Tầng 1 - Sắc thái: ${sentimentDirection} (${rawScore > 0 ? `+${rawScore}` : rawScore}đ)${hasHiddenRiskBehindNeutralTitle ? ' - Gắn cờ: Tiêu đề trung tính nhưng bối cảnh tiềm ẩn rủi ro' : ''}]; ` +
    `[Tầng 2 - Rủi ro thể chế: ${crisisPotential} (Điểm rủi ro: ${finalRiskScore}/100đ, S=${S_severity}, D=${D_divergence}, V=${V_velocity}, I=${I_impact}${isDivergenceDetected ? ' - Phát hiện độ vênh chỉ đạo/thực tiễn' : ''})]; ` +
    `[Tầng 3 - Hành động tác chiến: ${level3Action.alertLevelLabelVi}, giao ${level3Action.leadUnit} ${level3Action.urgencyTiming.toLowerCase()}].`;

  return {
    articleId: item.id,
    articleTitle: item.title,
    pipelineStages,
    level1Sentiment,
    level2Risk,
    level3Action,
    informationVacuum,
    executiveBrief,
    standardizedJsonOutput,
    formulaMetrics: {
      S: S_severity,
      D: D_divergence,
      V: V_velocity,
      I: I_impact,
      rawRiskScore: calculatedRiskScore,
      calculationFormula: `min(100, (0.7 * ${S_severity} + 0.3 * ${D_divergence}) * (1 + 0.3 * ${V_velocity} + 0.4 * ${I_impact})) = ${finalRiskScore}`,
      severityOutput: severityOutput as any,
      divergenceOutput: divergenceOutput as any,
      impactOutput: impactOutput as any
    },
    narrativeDivergence: {
      detected: isDivergenceDetected,
      details: divergenceDetails
    },
    decree376Audit: {
      tier: d376Result.tier,
      tierLabelVi: d376Result.tierLabelVi,
      scenarioCode: d376Result.scenarioCode,
      decreeClause: d376Result.decree376Clause,
      leadAgency: d376Result.leadAgency.name,
      cooperatingAgencies: d376Result.cooperatingUnits,
      actionScript: d376Result.actionScriptVi,
      emergencyPlaybook: d376Result.emergencyPlaybook
    },
    generatedAt: new Date().toISOString()
  };
}

function hasAcuteLegalCrisisDetection(text: string): boolean {
  return /khởi tố cán bộ|bắt tạm giam cán bộ|sai phạm nghiêm trọng tại bộ|cán bộ thuế bị bắt|cán bộ hải quan bị bắt|đại án gian lận|khởi tố vụ án tại bộ tài chính|xuyên việt oil|quỹ bog|đặng công khôi|hối lộ|nhận hối lộ|chiếm dụng quỹ/i.test(text);
}

/**
 * TẬP KỊCH BẢN KIỂM THỬ NGHIỆP VỤ CHUẨN (FEW-SHOT TEST CASES)
 * Phục vụ thẩm định độ chính xác của mô hình theo bản đặc tả kỹ thuật
 */
export interface FewShotTestCaseItem {
  id: string;
  title: string;
  scenarioName: string;
  category: string;
  rawInputSnippet: string;
  expectedTier1: string;
  expectedTier2: string;
  expectedTier3: string;
  expectedScoreRange: string;
  expectedLevel: WarningAlertLevelType;
  benchmarkAnalysis: string;
  sampleMockArticle: ScrapedNewsItem;
}

export const FEW_SHOT_TEST_CASES: FewShotTestCaseItem[] = [
  {
    id: 'test_case_0_routine_enforcement',
    scenarioName: 'Tình Huống 0: Nghiệp Vụ Cưỡng Chế Pháp Luật Định Kỳ (Chống Báo Động Giả)',
    title: 'Xử phạt hành chính một cá nhân trốn thuế và tạm giữ một lô hàng buôn lậu nhỏ lẻ qua cửa khẩu',
    category: 'Thanh tra & Cưỡng chế',
    rawInputSnippet: 'Cơ quan Thuế ban hành quyết định xử phạt vi phạm hành chính một cá nhân trốn thuế 50 triệu đồng. Đồng thời Đội Kiểm soát Hải quan tạm giữ một lô hàng buôn lậu nhỏ lẻ tại cửa khẩu do không xuất trình được hóa đơn chứng từ.',
    expectedTier1: 'Sắc thái bài viết (Tầng 1): Tiêu cực sự vụ (Negative incident). Ngôn từ phản ánh vi phạm, xử phạt, trốn thuế, buôn lậu.',
    expectedTier2: 'Đánh giá rủi ro (Tầng 2): RỦI RO THẤP. Đây là nghiệp vụ cưỡng chế pháp luật định kỳ của cơ quan chức năng, xã hội hoàn toàn đồng thuận. Không gây tổn hại thể chế hay suy giảm uy tín của Bộ Tài chính.',
    expectedTier3: 'Điểm số (Tầng 3): S = 6, D = 0, V = 0.15, I = 0.2 → Risk_Score = 12.0 điểm. Cấp độ: GIÁM SÁT THƯỜNG QUY (Standard Monitoring).',
    expectedScoreRange: '12.0 điểm (Standard Monitoring)',
    expectedLevel: 'STANDARD',
    benchmarkAnalysis: 'Minh chứng cốt lõi của Mô hình Mới: Trong mô hình cũ dựa vào từ khóa và sắc thái, bài viết này bị báo động đỏ ngay lập tức do chứa hàng loạt từ ngữ tiêu cực (xử phạt, trốn thuế, buôn lậu), gây hiện tượng "Báo động giả tràn lan" và làm quá tải hệ thống. Mô hình 3 Tầng mới bóc tách chính xác đây là nghiệp vụ cưỡng chế định kỳ, xã hội đồng thuận, tác động diện hẹp (I = 0.2), xếp vào Giám sát thường quy và triệt tiêu hoàn toàn báo động giả.',
    sampleMockArticle: {
      id: 'tc-0',
      title: 'Xử phạt hành chính một cá nhân trốn thuế và tạm giữ một lô hàng buôn lậu nhỏ lẻ qua cửa khẩu',
      url: 'https://haiquanonline.com.vn/tam-giu-lo-hang-buon-lau-nho-le',
      source: 'Hải quan Online',
      publishedAt: new Date().toISOString(),
      timeAgo: '20 phút trước',
      sector: 'customs',
      sectorNameVi: 'Hải quan & Biên mậu',
      summary: 'Cơ quan Thuế ban hành quyết định xử phạt vi phạm hành chính một cá nhân trốn thuế 50 triệu đồng. Đồng thời Đội Kiểm soát Hải quan tạm giữ một lô hàng buôn lậu nhỏ lẻ tại cửa khẩu do không xuất trình được hóa đơn chứng từ.',
      keyPoints: [
        'Xử phạt vi phạm hành chính một cá nhân trốn thuế 50 triệu đồng',
        'Tạm giữ một lô hàng buôn lậu nhỏ lẻ tại cửa khẩu',
        'Hoạt động cưỡng chế pháp luật định kỳ của ngành Thuế và Hải quan'
      ],
      sixW: {
        who: 'Cơ quan Thuế, Đội Kiểm soát Hải quan, cá nhân vi phạm',
        doingWhat: 'Xử phạt hành chính và tạm giữ lô hàng buôn lậu theo nghiệp vụ định kỳ',
        aboutWhat: 'Nghiệp vụ cưỡng chế pháp luật về thuế và kiểm soát biên mậu',
        resultOutcome: 'Xử lý nghiêm minh vi phạm hành chính, thu nộp ngân sách',
        whoIsAffected: 'Cá nhân vi phạm cụ thể, diện tác động rất hẹp (I = 0.2)',
        reaction: 'Dư luận xã hội đồng thuận cao với việc siết chặt kỷ cương pháp luật'
      },
      sentiment: 'bearish',
      sentimentScore: -40,
      sentimentReason: 'Ngôn từ phản ánh sự vụ xử phạt vi phạm hành chính cá nhân trốn thuế hoặc tạm giữ lô hàng buôn lậu theo nghiệp vụ định kỳ.',
      impactLevel: 'low',
      marketImplication: 'Không ảnh hưởng tới môi trường đầu tư hay uy tín quản trị của Bộ.',
      tickers: [],
      buzzScore: 15,
      velocityStatus: 'normal',
      agencies: ['Chi cục Hải quan', 'Chi cục Thuế']
    }
  },
  {
    id: 'test_case_pure_market_vnindex',
    scenarioName: 'Tình Huống 0.2: Điểm Tin Biến Động Thị Trường Thuần Túy (Không Cảnh Báo)',
    title: 'VN-Index tăng hơn 10 điểm trong phiên cuối tuần, cổ phiếu “họ” Vin hút mạnh dòng tiền',
    category: 'Thị trường Chứng khoán',
    rawInputSnippet: 'VN-Index tăng hơn 10 điểm trong phiên cuối tuần, cổ phiếu “họ” Vin hút mạnh dòng tiền. Khối ngoại mua ròng hơn 400 tỷ đồng, thanh khoản toàn sàn duy trì ổn định.',
    expectedTier1: 'Sắc thái bài viết (Tầng 1): Tích cực thị trường (Positive Market). Ngôn từ phản ánh tăng điểm, hút dòng tiền, mua ròng.',
    expectedTier2: 'Đánh giá rủi ro (Tầng 2): KHÔNG RỦI RO CHÍNH SÁCH. Đây là diễn biến giao dịch khách quan hàng ngày của thị trường chứng khoán, không gây tác động hay đòi hỏi trách nhiệm quản lý nhà nước của Bộ Tài chính.',
    expectedTier3: 'Điểm số (Tầng 3): Risk_Score = 5.0 điểm. Cấp độ: ĐIỂM TIN THỊ TRƯỜNG / GIÁM SÁT THƯỜNG QUY (Không cảnh báo - Không can thiệp).',
    expectedScoreRange: '5.0 điểm (Market Digest / Standard)',
    expectedLevel: 'MARKET_DIGEST',
    benchmarkAnalysis: 'Chuẩn hóa luồng: Phát hiện Khoảng trống ➔ Phân cấp Cảnh báo. Bài viết phản ánh diễn biến giao dịch thuần túy trên sàn chứng khoán, không có khoảng trống thông tin (No Gap / Market Digest), không có bất kỳ mâu thuẫn hay sai phạm thể chế nào. Hệ thống tự động phân loại vào "Điểm tin Thị trường", hiển thị thẻ xám nhạt trung tính, tuyệt đối không gửi chuông báo, không tính vào số lượng vấn đề cần Lãnh đạo can thiệp trên Dashboard.',
    sampleMockArticle: {
      id: 'tc-vnindex-pure-market',
      title: 'VN-Index tăng hơn 10 điểm trong phiên cuối tuần, cổ phiếu “họ” Vin hút mạnh dòng tiền',
      url: 'https://vneconomy.vn/vn-index-tang-hon-10-diem-phien-cuoi-tuan-co-phieu-vin.htm',
      source: 'VnEconomy',
      publishedAt: new Date().toISOString(),
      timeAgo: '15 phút trước',
      sector: 'stocks',
      sectorNameVi: 'Thị trường Chứng khoán',
      summary: 'VN-Index tăng hơn 10 điểm trong phiên cuối tuần, cổ phiếu “họ” Vin hút mạnh dòng tiền. Khối ngoại mua ròng hơn 400 tỷ đồng, thanh khoản toàn sàn duy trì ổn định.',
      keyPoints: [
        'VN-Index tăng hơn 10 điểm phiên cuối tuần',
        'Cổ phiếu nhóm Vin (VIC, VHM, VRE) hút mạnh dòng tiền giao dịch',
        'Khối ngoại mua ròng tích cực trên sàn HoSE'
      ],
      sixW: {
        who: 'Nhà đầu tư thị trường chứng khoán, cổ phiếu họ Vin (VIC, VHM, VRE)',
        doingWhat: 'Giao dịch mua bán cổ phiếu đẩy chỉ số VN-Index tăng hơn 10 điểm',
        aboutWhat: 'Biến động giao dịch phiên cuối tuần của thị trường chứng khoán',
        resultOutcome: 'Chỉ số tăng điểm tích cực, thanh khoản đạt kỳ vọng',
        whoIsAffected: 'Nhà đầu tư cá nhân và tổ chức trên thị trường',
        reaction: 'Tâm lý thị trường hưng phấn, giao dịch sôi động'
      },
      sentiment: 'bullish',
      sentimentScore: 65,
      sentimentReason: 'Giao dịch thị trường tăng điểm và hút dòng tiền thuần túy.',
      impactLevel: 'medium',
      marketImplication: 'Ghi nhận vào điểm tin thị trường tham khảo, không phát sinh rủi ro chính sách.',
      tickers: ['VIC', 'VHM', 'VRE'],
      buzzScore: 40,
      velocityStatus: 'normal',
      agencies: ['Sở GDCK TP.HCM (HoSE)', 'Ủy ban Chứng khoán Nhà nước'],
      isMarketDigest: true,
      marketDigestReason: 'Biến động giao dịch thị trường thuần túy, không ảnh hưởng đến điều hành của Bộ'
    }
  },
  {
    id: 'test_case_1_household_tax',
    scenarioName: 'Tình Huống 1: Chính Sách Thuế Đối Với Hộ Và Cá Nhân Kinh Doanh',
    title: 'Bộ Tài chính liên tục sửa đổi 5 thủ tục thuế hộ kinh doanh: Người dân băn khoăn cách xác định doanh thu tính thuế nhiều địa điểm',
    category: 'Thuế & Phí',
    rawInputSnippet: 'Báo Chính phủ đăng tải bài viết phản ánh việc Bộ Tài chính liên tục sửa đổi 5 thủ tục thuế liên quan đến hộ kinh doanh. Cùng lúc đó, Cổng thông tin của Bộ liên tục nhận được câu hỏi từ người dân về cách xác định doanh thu tính thuế khi có nhiều địa điểm kinh doanh.',
    expectedTier1: 'Sắc thái bài viết (Tầng 1): Trung tính (Neutral). Ngôn từ phản ánh thực tế thủ tục.',
    expectedTier2: 'Đánh giá rủi ro (Tầng 2): Quy định tác động trực tiếp tới hàng triệu hộ kinh doanh cá thể trên toàn quốc (I = 1.0). Việc thủ tục phải sửa đổi nhiều lần kết hợp với câu hỏi lặp đi lặp lại chứng minh chính sách có độ phức tạp cao, cơ sở đang lúng túng khi thực hiện.',
    expectedTier3: 'Điểm số (Tầng 3): S = 25, D = 0, V = 0.3, I = 1.0 → Risk_Score = 42.5 điểm. Cấp độ: CẢNH BÁO SỚM (Early Warning).',
    expectedScoreRange: '42.5 điểm (Early Warning)',
    expectedLevel: 'EARLY',
    benchmarkAnalysis: 'Chính sách thuế tác động trực tiếp tới hàng triệu hộ kinh doanh (I = 1.0). Việc thủ tục sửa đổi nhiều lần và câu hỏi lặp đi lặp lại chứng minh chính sách phức tạp, cơ sở đang lúng túng. Hệ thống kiến nghị Cục Thuế ban hành ngay văn bản hướng dẫn nghiệp vụ rõ ràng và xuất bản infographic hướng dẫn trực quan để giải tỏa băn khoăn cho người dân.',
    sampleMockArticle: {
      id: 'tc-1',
      title: 'Bộ Tài chính liên tục sửa đổi 5 thủ tục thuế hộ kinh doanh: Người dân băn khoăn cách xác định doanh thu tính thuế nhiều địa điểm',
      url: 'https://baochinhphu.vn/chinh-sach-thue-ho-kinh-doanh',
      source: 'Báo Chính phủ',
      publishedAt: new Date().toISOString(),
      timeAgo: '1 giờ trước',
      sector: 'tax',
      sectorNameVi: 'Thuế & Phí',
      summary: 'Báo Chính phủ đăng tải bài viết phản ánh việc Bộ Tài chính liên tục sửa đổi 5 thủ tục thuế liên quan đến hộ kinh doanh. Cùng lúc đó, Cổng thông tin của Bộ liên tục nhận được câu hỏi từ người dân về cách xác định doanh thu tính thuế khi có nhiều địa điểm kinh doanh.',
      keyPoints: [
        'Bộ Tài chính liên tục sửa đổi 5 thủ tục thuế liên quan đến hộ kinh doanh',
        'Cổng thông tin Bộ liên tục nhận câu hỏi về xác định doanh thu khi có nhiều địa điểm kinh doanh',
        'Cơ sở và người nộp thuế lúng túng trong quá trình áp dụng quy định mới'
      ],
      sixW: {
        who: 'Cơ quan Thuế, hàng triệu hộ kinh doanh cá thể trên toàn quốc',
        doingWhat: 'Sửa đổi 5 thủ tục thuế và tiếp nhận phản ánh băn khoăn của người dân',
        aboutWhat: 'Quy trình kê khai thuế và cách xác định doanh thu tính thuế nhiều địa điểm',
        resultOutcome: 'Xuất hiện câu hỏi lặp đi lặp lại, phát sinh lúng túng thực thi',
        whoIsAffected: 'Toàn bộ 5 triệu hộ kinh doanh cá thể trên toàn quốc (I = 1.0)',
        reaction: 'Băn khoăn, mong muốn có hướng dẫn nghiệp vụ rõ ràng, trực quan'
      },
      sentiment: 'neutral',
      sentimentScore: 50,
      sentimentReason: 'Bài viết phản ánh khách quan thực trạng sửa đổi thủ tục và các câu hỏi băn khoăn từ người dân.',
      impactLevel: 'high',
      marketImplication: 'Tác động sâu rộng tới 5 triệu hộ kinh doanh cá thể toàn quốc.',
      tickers: [],
      buzzScore: 30,
      velocityStatus: 'normal',
      agencies: ['Cục Thuế', 'Cục Thuế Doanh nghiệp Nhỏ & Hộ kinh doanh']
    }
  },
  {
    id: 'test_case_2_ai_algorithmic_trading',
    scenarioName: 'Tình Huống 2: Thí Điểm Ứng Dụng AI Trong Đầu Tư Chứng Khoán',
    title: 'Chuẩn bị thí điểm ứng dụng thuật toán AI trong giao dịch chứng khoán tự động cho nhà đầu tư chuyên nghiệp',
    category: 'Chứng khoán & TTCK',
    rawInputSnippet: 'Một số bài viết trên báo chuyên ngành kinh tế đưa tin về việc chuẩn bị thí điểm cho nhà đầu tư chuyên nghiệp ứng dụng thuật toán AI để giao dịch chứng khoán tự động. Ngôn từ bài viết mang tính học thuật, sắc thái tích cực.',
    expectedTier1: 'Sắc thái bài viết (Tầng 1): Tích cực (Positive). Ngôn từ mang tính học thuật, ủng hộ đổi mới công nghệ.',
    expectedTier2: 'Đánh giá rủi ro (Tầng 2): Phát hiện các rủi ro thể chế tiềm tàng: Nguy cơ tạo ra sự bất bình đẳng với đại đa số nhà đầu tư nhỏ lẻ; nguy cơ sử dụng AI để thao túng thị trường; rủi ro sập hệ thống và khoảng trống pháp lý về việc ai chịu trách nhiệm bồi thường khi xảy ra tranh chấp thua lỗ.',
    expectedTier3: 'Điểm số (Tầng 3): S = 20, D = 0, V = 0.2, I = 0.6 → Risk_Score = 26.6 điểm. Cấp độ: CẢNH BÁO XA (Early Horizon).',
    expectedScoreRange: '26.6 điểm (Early Horizon)',
    expectedLevel: 'DISTANT',
    benchmarkAnalysis: 'Bài viết tích cực về mặt bề mặt ngôn từ nhưng tiềm ẩn nguy cơ bất bình đẳng với nhà đầu tư nhỏ lẻ, rủi ro thao túng thị trường và khoảng trống pháp lý về trách nhiệm bồi thường khi thua lỗ. Hệ thống nhắc nhở đơn vị soạn thảo chuẩn bị sẵn khung giải trình về cơ chế thử nghiệm có kiểm soát (Sandbox) và biện pháp bảo vệ nhà đầu tư trước khi chính thức ban hành văn bản.',
    sampleMockArticle: {
      id: 'tc-2',
      title: 'Chuẩn bị thí điểm ứng dụng thuật toán AI trong giao dịch chứng khoán tự động cho nhà đầu tư chuyên nghiệp',
      url: 'https://ndh.vn/thi-diem-ai-chung-khoan-chuyen-nghiep',
      source: 'Báo Đầu Tư',
      publishedAt: new Date().toISOString(),
      timeAgo: '3 giờ trước',
      sector: 'stocks',
      sectorNameVi: 'Chứng khoán & TTCK',
      summary: 'Một số bài viết trên báo chuyên ngành kinh tế đưa tin về việc chuẩn bị thí điểm cho nhà đầu tư chuyên nghiệp ứng dụng thuật toán AI để giao dịch chứng khoán tự động. Ngôn từ bài viết mang tính học thuật, sắc thái tích cực.',
      keyPoints: [
        'Chuẩn bị thí điểm cho nhà đầu tư chuyên nghiệp ứng dụng AI giao dịch chứng khoán tự động',
        'Ngôn từ bài viết học thuật, sắc thái tích cực về tiềm năng công nghệ mới',
        'Tiềm ẩn nguy cơ bất bình đẳng với nhà đầu tư cá nhân và khoảng trống pháp lý bồi thường'
      ],
      sixW: {
        who: 'Nhà đầu tư chuyên nghiệp, CTCK và cơ quan quản lý thị trường chứng khoán',
        doingWhat: 'Nghiên cứu ứng dụng thuật toán AI trong giao dịch chứng khoán tự động',
        aboutWhat: 'Khung pháp lý sandbox và cơ chế kiểm soát rủi ro thuật toán',
        resultOutcome: 'Đón nhận tích cực từ giới công nghệ tài chính',
        whoIsAffected: 'Cộng đồng nhà đầu tư chứng khoán và trật tự an toàn thị trường vốn (I = 0.6)',
        reaction: 'Kỳ vọng đột phá công nghệ nhưng cần khung pháp lý bảo vệ nhà đầu tư nhỏ lẻ'
      },
      sentiment: 'bullish',
      sentimentScore: 70,
      sentimentReason: 'Ngôn từ bài viết mang tính học thuật, sắc thái tích cực về chuyển đổi số.',
      impactLevel: 'medium',
      marketImplication: 'Tác động đến thị trường vốn và trật tự an toàn giao dịch.',
      tickers: ['SSI', 'VND', 'HCM'],
      buzzScore: 20,
      velocityStatus: 'normal',
      agencies: ['Ủy ban Chứng khoán Nhà nước', 'Sở GDCK Việt Nam (VNX)']
    }
  },
  {
    id: 'test_case_3_public_investment_divergence',
    scenarioName: 'Tình Huống 3: Mâu Thuẫn Số Liệu Giải Ngân Vốn Đầu Tư Công',
    title: 'Tỷ lệ giải ngân 8 tháng vẫn thấp kỷ lục: Nhiều dự án lớn giải ngân dưới 30%, địa phương kêu khó vì thủ tục',
    category: 'Đầu tư công',
    rawInputSnippet: 'Tuần trước báo chí đăng rầm rộ thông điệp chỉ đạo quyết liệt của Bộ trưởng về việc đẩy nhanh tiến độ giải ngân vốn đầu tư công. Tuần này, các báo lớn đồng loạt đưa số liệu: "Tỷ lệ giải ngân 8 tháng vẫn thấp kỷ lục", "Nhiều dự án lớn giải ngân dưới 30%", "Địa phương kêu khó vì thủ tục".',
    expectedTier1: 'Sắc thái bài viết (Tầng 1): Tiêu cực (Negative). Đưa số liệu thấp kỷ lục và phản ánh bức xúc.',
    expectedTier2: 'Đánh giá rủi ro (Tầng 2): Phát hiện sự mâu thuẫn trực tiếp giữa cam kết chỉ đạo và kết quả thực tế (D = 18). Nguy cơ Bộ Tài chính bị dư luận và Quốc hội quy kết trách nhiệm làm chậm tiến độ chung của cả nền kinh tế.',
    expectedTier3: 'Điểm số (Tầng 3): S = 35, D = 18, V = 0.8, I = 0.9 → Risk_Score = 69.8 điểm. Cấp độ: CẢNH BÁO NHANH (Rapid Alert).',
    expectedScoreRange: '69.8 điểm (Rapid Alert)',
    expectedLevel: 'RAPID',
    benchmarkAnalysis: 'Hiện tượng Narrative-Reality Divergence: Sắc thái phát biểu chỉ đạo ban đầu càng tích cực thì độ thất vọng và áp lực quy kết trách nhiệm đối với Bộ sau đó càng lớn khi thực tế không theo kịp thông điệp. Hệ thống phát tín hiệu yêu cầu họp khẩn cấp, phân rã số liệu chứng minh phần trách nhiệm của Bộ Tài chính (đã phân bổ vốn đầy đủ, kiểm soát chi đúng hạn) và chỉ rõ các vướng mắc nằm ở khâu giải phóng mặt bằng của địa phương để thông tin minh bạch cho báo chí trong ngày.',
    sampleMockArticle: {
      id: 'tc-3',
      title: 'Tỷ lệ giải ngân 8 tháng vẫn thấp kỷ lục: Nhiều dự án lớn giải ngân dưới 30%, địa phương kêu khó vì thủ tục',
      url: 'https://tuoitre.vn/ty-le-giai-ngan-dau-tu-cong-thap-ky-luc',
      source: 'Báo Tuổi Trẻ',
      publishedAt: new Date().toISOString(),
      timeAgo: '45 phút trước',
      sector: 'public_investment',
      sectorNameVi: 'Đầu tư công',
      summary: 'Tuần trước báo chí đăng rầm rộ thông điệp chỉ đạo quyết liệt của Bộ trưởng về việc đẩy nhanh tiến độ giải ngân vốn đầu tư công. Tuần này, các báo lớn đồng loạt đưa số liệu: "Tỷ lệ giải ngân 8 tháng vẫn thấp kỷ lục", "Nhiều dự án lớn giải ngân dưới 30%", "Địa phương kêu khó vì thủ tục".',
      keyPoints: [
        'Thông điệp chỉ đạo tuần trước của Bộ trưởng rất quyết liệt',
        'Tuần này các báo lớn đồng loạt đưa tin tỷ lệ giải ngân 8 tháng thấp kỷ lục',
        'Nhiều dự án lớn giải ngân dưới 30%, địa phương kêu khó vì cơ chế thủ tục'
      ],
      sixW: {
        who: 'Bộ trưởng Bộ Tài chính, Kho bạc Nhà nước, Chủ đầu tư và các địa phương',
        doingWhat: 'Đưa tin mâu thuẫn giữa thông điệp chỉ đạo quyết tâm và kết quả thực tế thấp kỷ lục',
        aboutWhat: 'Tiến độ và tỷ lệ giải ngân vốn đầu tư công 8 tháng đầu năm',
        resultOutcome: 'Tỷ lệ giải ngân thấp kỷ lục, dưới 30% tại nhiều dự án trọng điểm',
        whoIsAffected: 'Tiến độ tăng trưởng kinh tế và uy tín điều hành của Bộ Tài chính (I = 0.9)',
        reaction: 'Bức xúc, quy kết trách nhiệm về phía cơ chế thủ tục của Bộ Tài chính'
      },
      sentiment: 'bearish',
      sentimentScore: -65,
      sentimentReason: 'Phát hiện sự mâu thuẫn trực tiếp giữa cam kết chỉ đạo và kết quả thực tế (Divergence D = 18).',
      impactLevel: 'high',
      impactScore: 78,
      marketImplication: 'Tác động trực tiếp đến giải ngân vốn và niềm tin thị trường',
      tickers: [],
      buzzScore: 80,
      velocityStatus: 'accelerating',
      agencies: ['Kho bạc Nhà nước', 'Vụ Đầu tư - Bộ Tài chính']
    }
  },
  {
    id: 'test_case_macro_growth_and_fiscal_target',
    scenarioName: 'Tình Huống: Tận Dụng Thời Gian Vàng Cho Mục Tiêu Tăng Trưởng Và Thu Ngân Sách',
    title: 'Tận dụng thời gian vàng cho mục tiêu tăng trưởng và thu ngân sách',
    category: 'Vĩ mô & Thu ngân sách',
    rawInputSnippet: 'Bài viết phân tích và truyền tải thông điệp điều hành kinh tế vĩ mô: Tận dụng thời gian vàng, cơ hội phục hồi kinh tế để thúc đẩy các động lực tăng trưởng GDP và hoàn thành thắng lợi nhiệm vụ thu ngân sách nhà nước năm 2026. Ngôn từ tích cực, mang tính định hướng phát triển và củng cố niềm tin.',
    expectedTier1: 'Sắc thái bài viết (Tầng 1): Tích cực (Positive). Ngôn từ mang tính động viên, truyền tải quyết tâm thực hiện thắng lợi mục tiêu vĩ mô.',
    expectedTier2: 'Đánh giá rủi ro (Tầng 2): Điểm rủi ro thấp (S = 4, D = 0, V = 0.2, I = 0.3 → Risk_Score = 3.2 điểm). Không có xung đột lợi ích, không có khiếu nại hay sai phạm thể chế.',
    expectedTier3: 'Điểm số (Tầng 3): Khoảng trống thông tin: NO_GAP. Cấp độ: GIÁM SÁT THƯỜNG QUY (STANDARD). Tuyệt đối KHÔNG kích hoạt Cảnh báo Nhanh (RAPID) hay Cảnh báo Khẩn (EMERGENCY).',
    expectedScoreRange: '3.2 điểm (Standard Monitoring)',
    expectedLevel: 'STANDARD',
    benchmarkAnalysis: 'Chuẩn hóa luồng: Phát hiện Khoảng trống ➔ Phân cấp Cảnh báo. Bài viết phản ánh định hướng điều hành vĩ mô và mục tiêu tăng trưởng kinh tế cùng dự toán thu ngân sách nhà nước tích cực, đầy đủ thông tin (NO_GAP). Hệ thống phân loại vào "Giám sát Thường quy", lưu trữ vào Bảng tin vĩ mô phục vụ tham mưu tổng hợp, không gửi chuông báo động, không tính vào số lượng vấn đề cần can thiệp trên Dashboard.',
    sampleMockArticle: {
      id: 'tc-macro-growth-fiscal-target',
      title: 'Tận dụng thời gian vàng cho mục tiêu tăng trưởng và thu ngân sách',
      url: 'https://thoibaotaichinhvietnam.vn/tan-dung-thoi-gian-vang-cho-muc-tieu-tang-truong-va-thu-ngan-sach',
      source: 'Thời báo Tài chính Việt Nam',
      publishedAt: new Date().toISOString(),
      timeAgo: '1 giờ trước',
      sector: 'treasury_budget',
      sectorNameVi: 'Thu chi Ngân sách & Vĩ mô',
      summary: 'Tận dụng thời gian vàng, nắm bắt cơ hội phục hồi kinh tế để thúc đẩy các động lực tăng trưởng GDP và hoàn thành thắng lợi nhiệm vụ thu ngân sách nhà nước.',
      keyPoints: [
        'Tận dụng thời gian vàng và động lực kinh tế mới',
        'Thúc đẩy tăng trưởng GDP và hoàn thành mục tiêu dự toán thu ngân sách',
        'Điều hành tài khóa mở rộng có trọng tâm, nuôi dưỡng nguồn thu bền vững'
      ],
      sixW: {
        who: 'Bộ Tài chính, Cục Thuế, Cục Hải quan, KBNN và cộng đồng doanh nghiệp',
        doingWhat: 'Tập trung chỉ đạo điều hành vĩ mô, tận dụng thời cơ thúc đẩy tăng trưởng và thu ngân sách',
        aboutWhat: 'Mục tiêu tăng trưởng kinh tế GDP và kết quả thu ngân sách nhà nước',
        resultOutcome: 'Tạo đà bứt phá cho các chỉ tiêu kinh tế - tài chính cả năm',
        whoIsAffected: 'Cộng đồng doanh nghiệp và toàn bộ nền kinh tế (I = 0.3)',
        reaction: 'Đồng thuận, phấn khởi, củng cố niềm tin vào điều hành vĩ mô của Nhà nước'
      },
      sentiment: 'bullish',
      sentimentScore: 85,
      sentimentReason: 'Bài viết phản ánh quyết tâm và giải pháp điều hành kinh tế vĩ mô tích cực, củng cố niềm tin thị trường.',
      impactLevel: 'medium',
      marketImplication: 'Củng cố niềm tin nhà đầu tư và tạo động lực tài khóa cho nền kinh tế.',
      tickers: [],
      buzzScore: 45,
      velocityStatus: 'normal',
      agencies: ['Bộ Tài chính', 'Vụ Ngân sách Nhà nước', 'Cục Thuế']
    }
  }
];

// ============================================================================
// URGENCY CLASSIFIER & QUEUEING ENGINE
// Phân loại chuẩn xác: 'Khẩn cấp' (Genuine Policy/Social Risk Triggers) vs 'Đáng chú ý' (Notable) vs 'Giám sát thường quy' vs 'Điểm tin thị trường'
// ============================================================================

export type UrgencyCategory = 'urgent' | 'notable' | 'routine' | 'market_digest';

export interface UrgencyClassificationResult {
  category: UrgencyCategory;
  categoryVi: 'Khẩn cấp' | 'Đáng chú ý' | 'Lưu tâm' | 'Giám sát thường quy' | 'Điểm tin thị trường';
  badge: string;
  badgeStyle: string;
  isUrgent: boolean;
  isNotable: boolean;
  priorityScore: number;
  reason: string;
  matchedRiskFactors: string[];
  recommendedActionVi: string;
  occurredTimeFormatted: string; // The genuine source timestamp extracted from article data
}

/**
 * Kiểm tra xem bài viết có thuộc diện Rủi ro Chính sách / Khủng hoảng Xã hội ĐÍCH THỰC hay không.
 * Chỉ những bài viết có yếu tố tham nhũng, khởi tố, bắt giam, thất thoát nghìn tỷ, bãi thị hoặc rút tiền hàng loạt
 * mới được phép kích hoạt trạng thái "Khẩn cấp".
 */
export function isGenuinePolicyOrSocialRisk(article: ScrapedNewsItem): { isCrisis: boolean; matchedFactors: string[]; reason: string } {
  const fullText = `${article.title || ''} ${article.summary || article.snippet || ''} ${article.sentimentReason || ''} ${article.regulatoryTags?.join(' ') || ''}`.toLowerCase();

  // 1. Loại trừ nếu là phát biểu chỉ đạo quán triệt đôn đốc hoặc đề xuất thẩm quyền thường quy
  const isDirectiveNegation =
    /không để xảy ra (sai phạm|vi phạm|thất thoát|tiêu cực)|chống (lãng phí|thất thoát|tiêu cực)|ngăn chặn (sai phạm|vi phạm|thất thoát)|xử lý nghiêm các trường hợp vi phạm tiến độ|bộ trưởng.*chỉ đạo|không buông lỏng/i.test(fullText);

  // 2. Nhận diện các yếu tố Khủng hoảng / Rủi ro Xã hội - Chính sách Đích thực (Genuine Triggers):
  const matchedFactors: string[] = [];

  // Yếu tố A: Đại án tham nhũng, hối lộ, bắt giam cán bộ ngành thuế/hải quan/tài chính
  if (!isDirectiveNegation && /nhận hối lộ|đưa hối lộ|môi giới hối lộ|hối lộ cán bộ|cán bộ nhận hối lộ|khởi tố bị can|khởi tố cán bộ|bắt tạm giam cán bộ|bắt tạm giam|tham ô|lừa đảo chiếm đoạt|chiếm dụng quỹ|đại án tham nhũng/i.test(fullText)) {
    matchedFactors.push('Tham nhũng / Hối lộ / Khởi tố bắt giam cán bộ');
  }

  // Yếu tố B: Thất thoát ngân sách lớn, gian lận hóa đơn / buôn lậu nghìn tỷ có tổ chức
  if (/thất thoát nghìn tỷ|thất thoát ngân sách đặc biệt lớn|đường dây buôn lậu nghìn tỷ|buôn lậu có tổ chức quy mô đặc biệt lớn|trốn thuế hàng trăm tỷ|thao túng giá chứng khoán nghiêm trọng/i.test(fullText)) {
    matchedFactors.push('Thất thoát nghìn tỷ / Gian lận quy mô lớn');
  }

  // Yếu tố C: Bức xúc xã hội gay gắt, kêu cứu tập thể, nguy cơ đình công / bãi thị phản ứng chính sách
  if (/kêu cứu tập thể|phản ứng gay gắt về thuế|nguy cơ bãi thị|đình công phản đối|hàng trăm doanh nghiệp kêu cứu|tiểu thương phản ứng dữ dội/i.test(fullText)) {
    matchedFactors.push('Phản ứng chính sách dữ dội / Kêu cứu tập thể');
  }

  // Yếu tố D: Vỡ nợ trái phiếu dây chuyền, rút tiền hàng loạt (Bank run), sụp đổ thanh khoản hệ thống
  if (/rút tiền hàng loạt|vỡ nợ trái phiếu dây chuyền|sụp đổ thanh khoản|mất khả năng chi trả hệ thống/i.test(fullText)) {
    matchedFactors.push('Rủi ro sụp đổ thanh khoản / Rút tiền dây chuyền');
  }

  // Yếu tố E: Độ vênh chỉ đạo - thực tế cực đoan hoặc cờ khẩn cấp từ pipeline rủi ro cao
  if (article.isEmergency || (article.warningPipeline?.level2Risk?.riskScore && article.warningPipeline.level2Risk.riskScore >= 80 && article.velocityStatus === 'spike')) {
    if (matchedFactors.length === 0) {
      matchedFactors.push('Cảnh báo Đỏ khẩn cấp từ Radar Giám sát');
    }
  }

  const isCrisis = matchedFactors.length > 0;
  const reason = isCrisis
    ? `Phát hiện rủi ro chính sách / xã hội nghiêm trọng: ${matchedFactors.join('; ')}`
    : 'Không phát hiện yếu tố khủng hoảng nguy cấp';

  return { isCrisis, matchedFactors, reason };
}

/**
 * Urgency Classifier: Phân biệt chính xác giữa 'Khẩn cấp' (High Impact/Urgent) và 'Đáng chú ý' (Notable)
 * - 'Khẩn cấp': Chỉ áp dụng cho các rủi ro xã hội / chính sách thực sự nghiêm trọng.
 * - 'Đáng chú ý': Dành cho các sự kiện kinh tế / chính sách vĩ mô quan trọng, theo dõi trong ngày.
 * - 'Giám sát thường quy' & 'Điểm tin thị trường': Lọc bỏ khỏi luồng ưu tiên cao.
 */
export function classifyArticleUrgency(article: ScrapedNewsItem): UrgencyClassificationResult {
  const fullText = `${article.title || ''} ${article.summary || article.snippet || ''} ${article.sentimentReason || ''} ${article.regulatoryTags?.join(' ') || ''}`.toLowerCase();
  const realPublishedTime = formatNewsFullDateTime(article);

  // 1. Phân loại Điểm tin thị trường (Market Digest)
  const isMarket =
    Boolean(article.isMarketDigest) ||
    article.informationVacuum?.gapLevel === 'MARKET_DIGEST' ||
    article.warningPipeline?.level3Action.alertLevel === 'MARKET_DIGEST' ||
    (Array.isArray(article.categoryLabels) && article.categoryLabels.some(l => /điểm tin|market news|thị trường thuần túy|thị trường khách quan/i.test(l))) ||
    isPureMarketDynamics(fullText);

  if (isMarket) {
    return {
      category: 'market_digest',
      categoryVi: 'Điểm tin thị trường',
      badge: '📊 ĐIỂM TIN THỊ TRƯỜNG',
      badgeStyle: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20',
      isUrgent: false,
      isNotable: false,
      priorityScore: -100,
      reason: 'Diễn biến giao dịch chứng khoán / điểm số thị trường khách quan.',
      matchedRiskFactors: [],
      recommendedActionVi: 'Lưu trữ theo dõi thị trường, không cần chỉ đạo can thiệp.',
      occurredTimeFormatted: realPublishedTime,
    };
  }

  // 2. Kiểm tra Dấu hiệu Rủi ro Khẩn cấp Đích thực (Genuine Emergency / High Impact Risks)
  const riskCheck = isGenuinePolicyOrSocialRisk(article);
  if (riskCheck.isCrisis) {
    const riskScore = article.warningPipeline?.level2Risk?.riskScore || article.impactScore || 85;
    const priorityScore = 180 + riskScore * 0.5 + (article.velocityStatus === 'spike' ? 30 : 0);

    return {
      category: 'urgent',
      categoryVi: 'Khẩn cấp',
      badge: '🚨 CẤP BÁCH',
      badgeStyle: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
      isUrgent: true,
      isNotable: false,
      priorityScore,
      reason: riskCheck.reason,
      matchedRiskFactors: riskCheck.matchedFactors,
      recommendedActionVi: `Chỉ đạo khẩn các Cục/Vụ phụ trách rà soát ngay, lập phương án truyền thông và giải trình trước Lãnh đạo.`,
      occurredTimeFormatted: realPublishedTime,
    };
  }

  // 3. Phân loại Tin Thể chế / Hành chính Thường quy (Routine Governance)
  const isRoutine =
    isRoutineLegalPromulgationOrGovernance(fullText) ||
    isRoutineAdministrativeEnforcement(fullText) ||
    (article as any).isAdministrativeAnnouncement;

  if (isRoutine) {
    return {
      category: 'routine',
      categoryVi: 'Giám sát thường quy',
      badge: '📋 GIÁM SÁT THƯỜNG QUY',
      badgeStyle: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20',
      isUrgent: false,
      isNotable: false,
      priorityScore: 20 + (typeof article.impactScore === 'number' ? article.impactScore * 0.2 : 10),
      reason: 'Hoạt động điều hành, ban hành thể chế hoặc cưỡng chế hành chính thường quy định kỳ.',
      matchedRiskFactors: [],
      recommendedActionVi: 'Tiếp tục giám sát thường nhật, chủ động cung cấp thông tin minh bạch.',
      occurredTimeFormatted: realPublishedTime,
    };
  }

  // 4. Phân loại Sự vụ Đáng chú ý (Notable / RAPID / EARLY)
  // Các sự kiện chính sách vĩ mô, thảo luận quy định, kiến nghị DN hoặc thành tựu thu ngân sách có tác động đáng kể
  const isBearish = article.sentiment === 'bearish';
  const isHighImpact = article.impactLevel === 'high' || (article.impactScore && article.impactScore >= 60);
  const priorityScore =
    (isHighImpact ? 60 : 30) +
    (isBearish ? 40 : 20) +
    (article.buzzScore ? article.buzzScore * 0.3 : 15) +
    (typeof article.impactScore === 'number' ? article.impactScore * 0.4 : 20);

  const agency = article.agencies?.[0] || article.source || 'Bộ Tài chính';

  return {
    category: 'notable',
    categoryVi: isBearish ? 'Lưu tâm' : 'Đáng chú ý',
    badge: isBearish ? '⏳ CẦN LƯU TÂM' : '⚡ ĐÁNG CHÚ Ý',
    badgeStyle: isBearish
      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    isUrgent: false,
    isNotable: true,
    priorityScore,
    reason: isBearish
      ? 'Vấn đề phát sinh cần theo dõi sát phản ứng dư luận và doanh nghiệp.'
      : 'Diễn biến chính sách / kinh tế vĩ mô tích cực đáng ghi nhận trong ngày.',
    matchedRiskFactors: [],
    recommendedActionVi: isBearish
      ? `Theo dõi phản ứng dư luận về ${agency}, chuẩn bị giải đáp thắc mắc nếu có kiến nghị.`
      : `Phát huy hiệu ứng tích cực của chính sách, tiếp tục chủ động truyền thông định hướng.`,
    occurredTimeFormatted: realPublishedTime,
  };
}

/**
 * Tự động phân loại Loại Hành Động (Action Type) chỉ đạo tham mưu:
 * 1. Regulatory Review (Rà soát Pháp lý / Thể chế)
 * 2. Policy Adjustment (Điều chỉnh Chính sách / Kỹ thuật)
 * 3. Public Statement (Phát ngôn / Thông cáo Truyền thông)
 */
export function resolveDirectiveActionType(item: ScrapedNewsItem): {
  actionType: DirectiveActionType;
  actionTypeLabelVi: string;
  actionTypeBadge: string;
  actionSummary: string;
} {
  if (!item) {
    return {
      actionType: 'Policy Adjustment',
      actionTypeLabelVi: 'Điều chỉnh Chính sách',
      actionTypeBadge: '🔵 Điều chỉnh Chính sách',
      actionSummary: 'Tham mưu hướng dẫn nghiệp vụ',
    };
  }

  const text = `${item.title || ''} ${item.summary || ''} ${item.executiveDirective?.mediaStrategy?.tacticalRecommendation || ''}`.toLowerCase();

  let actionType: DirectiveActionType = 'Policy Adjustment';

  if (
    /rà soát|pháp lý|thể chế|văn bản quy phạm|nghị định|thông tư|luật|thẩm quyền|kiểm tra pháp luật|hoàn thiện cơ chế|dự thảo|chính sách/i.test(text) ||
    (item.sector as string) === 'regulatory' ||
    (item.sector as string) === 'fiscal_policy'
  ) {
    actionType = 'Regulatory Review';
  } else if (
    /phát ngôn|thông cáo|đính chính|định hướng dư luận|họp báo|truyền thông|báo chí|trả lời báo chí|thông tin chính thống|lan tỏa|bác tin đồn/i.test(text) ||
    item.sentiment === 'bullish' ||
    item.isEmergency
  ) {
    actionType = 'Public Statement';
  } else {
    actionType = 'Policy Adjustment';
  }

  // Override if explicitly set in executiveDirective
  if (item.executiveDirective?.actionType) {
    actionType = item.executiveDirective.actionType;
  }

  let actionTypeLabelVi = 'Điều chỉnh Chính sách';
  let actionTypeBadge = '🔵 Điều chỉnh Chính sách';

  if (actionType === 'Regulatory Review') {
    actionTypeLabelVi = 'Rà soát Pháp lý';
    actionTypeBadge = '🟣 Rà soát Pháp lý';
  } else if (actionType === 'Public Statement') {
    actionTypeLabelVi = 'Phát ngôn Truyền thông';
    actionTypeBadge = '🟢 Phát ngôn Truyền thông';
  }

  const actionSummary =
    item.executiveDirective?.mediaStrategy?.tacticalRecommendation ||
    item.policyResponseAdvisor ||
    item.warningPipeline?.executiveBrief ||
    (actionType === 'Regulatory Review'
      ? 'Rà soát quy định pháp luật và văn bản hướng dẫn nghiệp vụ'
      : actionType === 'Public Statement'
      ? 'Soạn thảo thông cáo chính thống đính chính & phát ngôn báo chí'
      : 'Tham mưu điều chỉnh hướng dẫn kỹ thuật và tháo gỡ vướng mắc');

  return {
    actionType,
    actionTypeLabelVi,
    actionTypeBadge,
    actionSummary,
  };
}

