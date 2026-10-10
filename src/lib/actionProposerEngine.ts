import {
  ScrapedNewsItem,
  SixWAnalysis,
  SentimentType,
  ImpactLevel,
  ProposedLeadershipAction,
  ArticleActionProposalResult,
  ActionCategory,
} from '../types';
import { decodeHtmlEntities } from './htmlDecoder';
import { isMinistryAuthorityProposal } from './newsClassification';
import { assignDepartmentWorkflow } from './departmentAssignmentEngine';

/**
 * Intelligent Auto-Action Proposer Engine
 * Synthesizes 6W breakdown (Who, Doing What, About What, Result/Outcome, Who Is Affected, Reaction)
 * and Sentiment analysis into exactly 3 concrete, prioritized, actionable directives for leadership.
 */
export function generateAutoActionProposals(item: ScrapedNewsItem): ArticleActionProposalResult {
  const title = decodeHtmlEntities(item.title || '');
  const summary = decodeHtmlEntities(item.summary || '');
  const text = `${title} ${summary}`.toLowerCase();

  const sixW: SixWAnalysis = item.sixW || {
    who: 'Cơ quan quản lý & Đối tượng liên quan',
    doingWhat: 'Triển khai công tác quản lý chuyên ngành',
    aboutWhat: item.sectorNameVi || 'Lĩnh vực tài chính',
    resultOutcome: 'Ghi nhận biến động thị trường',
    whoIsAffected: 'Cộng đồng doanh nghiệp và nhà đầu tư',
    reaction: 'Đang theo dõi diễn biến',
  };

  const sentiment: SentimentType = item.sentiment || 'neutral';
  const score = item.sentimentScore ?? 0;
  const impact: ImpactLevel = item.impactLevel || 'medium';
  const isEmergency = Boolean(item.isEmergency || item.isUrgent);
  const sector = item.sector || 'policy';

  // Check if article is about Ministry authority proposal
  const isAuthorityProposal = isMinistryAuthorityProposal(text);

  // Detect specific risk or domain flags (exempt authority proposal from violation/fraud)
  const isViolationOrFraud =
    !isAuthorityProposal && (
      text.includes('sai phạm') ||
      text.includes('thao túng') ||
      text.includes('khởi tố') ||
      text.includes('điều tra') ||
      text.includes('gian lận') ||
      text.includes('trốn thuế') ||
      text.includes('buôn lậu') ||
      text.includes('vỡ nợ') ||
      text.includes('chậm thanh toán') ||
      text.includes('rút ruột')
    );

  const isMarketShockOrPlunge =
    text.includes('lao dốc') ||
    text.includes('bán tháo') ||
    text.includes('giảm sâu') ||
    text.includes('sụt giảm') ||
    text.includes('áp lực bán') ||
    text.includes('chảy máu ngoại tệ') ||
    text.includes('tỷ giá tăng nóng') ||
    text.includes('giá vàng nhảy múa');

  const isPositiveBreakthrough =
    sentiment === 'bullish' ||
    text.includes('vượt mốc') ||
    text.includes('kỷ lục') ||
    text.includes('khởi sắc') ||
    text.includes('nâng hạng') ||
    text.includes('tăng trưởng') ||
    text.includes('thặng dư') ||
    text.includes('bội thu') ||
    text.includes('hút dòng vốn') ||
    text.includes('giải ngân ấn tượng');

  const isTaxOrCustoms =
    sector === 'tax' ||
    sector === 'customs' ||
    sector === 'fintech_digital' ||
    text.includes('thuế') ||
    text.includes('hải quan') ||
    text.includes('hóa đơn');

  const isStockOrBonds =
    sector === 'stocks' ||
    sector === 'bonds' ||
    text.includes('chứng khoán') ||
    text.includes('trái phiếu') ||
    text.includes('ubck') ||
    text.includes('cổ phiếu');

  const isPriceOrTreasury =
    sector === 'price_management' ||
    sector === 'treasury_budget' ||
    sector === 'gold' ||
    sector === 'forex' ||
    text.includes('bình ổn') ||
    text.includes('kho bạc') ||
    text.includes('vàng') ||
    text.includes('xăng dầu');

  // Determine Target Leading Agencies and Cooperating Agencies (Decree 376 - 34 Agencies)
  const deptWorkflow = assignDepartmentWorkflow(item);
  let primaryUnit = deptWorkflow.leadUnit;
  let cooperatingUnits = deptWorkflow.cooperatingUnits;

  if (isAuthorityProposal) {
    primaryUnit = 'Vụ Pháp chế';
    cooperatingUnits = ['Cục Thuế', 'Cục Hải quan', 'Văn phòng Bộ'];
  } else if (item.agencies && item.agencies.length > 0 && !deptWorkflow.isDecree376NewMandate) {
    primaryUnit = item.agencies[0];
  }

  const actions: ProposedLeadershipAction[] = [];

  // ==========================================
  // CASE 0: ĐỀ XUẤT BỔ SUNG THẨM QUYỀN & HOÀN THIỆN THỂ CHẾ
  // ==========================================
  if (isAuthorityProposal) {
    actions.push({
      id: `${item.id}-action-1`,
      rank: 1,
      title: 'Hoàn thiện hồ sơ đề xuất thẩm quyền & báo cáo đánh giá tác động (RIA)',
      shortTag: 'Hoàn thiện thể chế',
      category: 'POLICY_REFORM',
      categoryLabel: 'Thể chế & Chính sách',
      urgency: 'Ưu tiên cao',
      urgencyLevel: 'medium',
      targetUnit: primaryUnit,
      sixWRationale: `Đề xuất xuất phát từ yêu cầu quản lý của "${sixW.who}" đối với "${sixW.aboutWhat}" nhằm bảo đảm quyền lợi của "${sixW.whoIsAffected}".`,
      sentimentContext: `Đề xuất hoàn thiện thể chế quản lý nhà nước thường quy của Bộ Tài chính.`,
      rationale: `Bổ sung thẩm quyền điều tra, khởi tố chuyên biệt đối với tội phạm thuế và sở hữu trí tuệ giúp bảo vệ kịp thời ngân sách nhà nước và bảo hộ quyền sở hữu trí tuệ.`,
      actionSteps: [
        `Giao Vụ Pháp chế chủ trì hoàn thiện báo cáo giải trình chi tiết về căn cứ thực tiễn và cơ sở pháp lý.`,
        `Thực hiện đánh giá tác động chính sách (RIA) đảm bảo phân định rõ ranh giới thẩm quyền giữa cơ quan tài chính và cơ quan công an.`,
        `Báo cáo Ban Cán sự Đảng Bộ Tài chính trước khi trình cấp có thẩm quyền xem xét thông qua.`,
      ],
      draftingActionType: 'statement',
    });

    actions.push({
      id: `${item.id}-action-2`,
      rank: 2,
      title: 'Phối hợp với Bộ Tư pháp, Viện Kiểm sát & Bộ Công an thống nhất cơ chế',
      shortTag: 'Phối hợp liên ngành',
      category: 'INTER_AGENCY',
      categoryLabel: 'Phối hợp Liên ngành',
      urgency: 'Theo dõi 24h',
      urgencyLevel: 'medium',
      targetUnit: 'Vụ Pháp chế phối hợp các cơ quan tư pháp',
      sixWRationale: `Thống nhất quy trình tố tụng và cơ chế phối hợp xử lý tin báo tội phạm liên quan đến thuế và sở hữu trí tuệ.`,
      sentimentContext: `Bảo đảm tính chặt chẽ, đồng bộ trong hệ thống pháp luật tố tụng hình sự.`,
      rationale: `Sự đồng thuận của các cơ quan tư pháp là điều kiện tiên quyết để đề xuất được cụ thể hóa thành quy định pháp luật.`,
      actionSteps: [
        `Tổ chức cuộc họp tham vấn kỹ thuật liên ngành với đại diện Bộ Tư pháp, VKSNDTC và Bộ Công an.`,
        `Làm rõ quy trình chuyển giao hồ sơ vụ án và kiểm sát việc tuân theo pháp luật trong quá trình thực thi thẩm quyền.`,
        `Tiếp thu các ý kiến đóng góp hợp lý để hoàn chỉnh dự thảo nghị định / dự án luật.`,
      ],
      draftingActionType: 'dispatch_notice',
    });

    actions.push({
      id: `${item.id}-action-3`,
      rank: 3,
      title: 'Chủ động truyền thông chính sách, giải tỏa băn khoăn của cộng đồng doanh nghiệp',
      shortTag: 'Định hướng dư luận',
      category: 'COMMUNICATION',
      categoryLabel: 'Truyền thông & Báo chí',
      urgency: 'Theo dõi 24h',
      urgencyLevel: 'low',
      targetUnit: 'Văn phòng Bộ Tài chính (Bộ phận Báo chí) & Thời báo Tài chính',
      sixWRationale: `Định hướng dư luận về "${sixW.aboutWhat}" để người nộp thuế và doanh nghiệp nắm rõ mục đích nhân văn và phòng ngừa vi phạm.`,
      sentimentContext: `Tránh cách hiểu suy diễn sai lệch là tạo thêm rào cản hành chính cho hoạt động kinh doanh.`,
      rationale: `Thông tin công khai, minh bạch giúp dư luận xã hội hiểu đúng bản chất là tăng cường công cụ phòng chống gian lận, bảo vệ doanh nghiệp làm ăn chân chính.`,
      actionSteps: [
        `Phát hành bài phỏng vấn Lãnh đạo Vụ Pháp chế hoặc Lãnh đạo Cục Thuế/Hải quan trên Thời báo Tài chính và Cổng TTĐT Bộ.`,
        `Nhấn mạnh thông điệp: Thẩm quyền chỉ áp dụng đối với các hành vi cố tình vi phạm nghiêm trọng có dấu hiệu tội phạm, không ảnh hưởng thủ tục kinh doanh bình thường.`,
        `Theo dõi sát luồng phản hồi từ các diễn đàn kinh tế để kịp thời giải thích thêm khi cần.`,
      ],
      draftingActionType: 'statement',
    });
  }

  // ==========================================
  // CASE 1: BEARISH / CRISIS / VIOLATION / HIGH RISK
  // ==========================================
  else if (sentiment === 'bearish' || isViolationOrFraud || isMarketShockOrPlunge || (isEmergency && score <= 0)) {
    // Action 1: Inspection & Verification
    actions.push({
      id: `${item.id}-action-1`,
      rank: 1,
      title: isViolationOrFraud
        ? 'Yêu cầu thanh tra, kiểm tra đột xuất & xác minh sai phạm'
        : 'Chỉ đạo rà soát giao dịch bất thường & khoanh vùng rủi ro',
      shortTag: 'Yêu cầu thanh tra',
      category: 'INSPECTION',
      categoryLabel: 'Thanh tra & Giám sát',
      urgency: 'Khẩn cấp',
      urgencyLevel: 'high',
      targetUnit: primaryUnit,
      sixWRationale: `Chủ thể "${sixW.who}" có dấu hiệu "${sixW.doingWhat}" gây hệ quả "${sixW.resultOutcome}", đe dọa quyền lợi của "${sixW.whoIsAffected}".`,
      sentimentContext: `Sắc thái Tiêu cực (${score}/100) với mức tác động ${impact === 'high' ? 'Cao' : 'Vừa'}.`,
      rationale: `Cần xác minh độc lập và xử lý dứt điểm điểm nghẽn trước khi rủi ro lây lan rộng trên thị trường.`,
      actionSteps: [
        `Thành lập tổ công tác kiểm tra nhanh do ${primaryUnit} chủ trì trong vòng 24 giờ.`,
        `Yêu cầu đơn vị/doanh nghiệp giải trình bằng văn bản và đối chiếu dữ liệu giao dịch/kê khai.`,
        `Báo cáo Lãnh đạo Bộ kết quả bước đầu và đề xuất biện pháp xử phạt nghiêm nếu phát hiện sai phạm.`,
      ],
      draftingActionType: 'inspection_order',
    });

    // Action 2: Communication & Reassurance
    actions.push({
      id: `${item.id}-action-2`,
      rank: 2,
      title: 'Phát ngôn trấn an dư luận & bác bỏ tin đồn thất thiệt',
      shortTag: 'Phát ngôn trấn an',
      category: 'COMMUNICATION',
      categoryLabel: 'Phát ngôn & Định hướng',
      urgency: 'Khẩn cấp',
      urgencyLevel: 'high',
      targetUnit: 'Văn phòng Bộ & Người phát ngôn cơ quan quản lý',
      sixWRationale: `Phản ứng dư luận "${sixW.reaction}" phản ánh tâm lý hoang mang của "${sixW.whoIsAffected}" về vấn đề "${sixW.aboutWhat}".`,
      sentimentContext: `Chỉ số rủi ro truyền thông tăng cao, cần ổn định tâm lý nhà đầu tư tức thì.`,
      rationale: `Thông tin chính thống, minh bạch và kịp thời là giải pháp then chốt để dập tắt tin đồn và ngăn chặn bán tháo/khiếu nại.`,
      actionSteps: [
        `Soạn thông cáo báo chí chính thức nêu rõ quan điểm kiên quyết bảo vệ kỷ cương thị trường và quyền lợi hợp pháp của người tham gia.`,
        `Phối hợp với Báo Thời báo Tài chính, Cổng TTĐT Bộ và VTV1 phát bản tin định hướng trong khung giờ vàng.`,
        `Cung cấp đường dây nóng/kênh tiếp nhận giải đáp thắc mắc cho công chúng và doanh nghiệp.`,
      ],
      draftingActionType: 'statement',
    });

    // Action 3: Monitoring & Liquidity Surveillance
    actions.push({
      id: `${item.id}-action-3`,
      rank: 3,
      title: 'Theo dõi sát sao thanh khoản & kích hoạt kịch bản dự phòng',
      shortTag: 'Theo dõi sát sao',
      category: 'MONITORING',
      categoryLabel: 'Giám sát 24/7',
      urgency: 'Theo dõi 24h',
      urgencyLevel: 'medium',
      targetUnit: 'Cục Quản lý Nợ / Vụ TCNH / KBNN',
      sixWRationale: `Đánh giá tác động dây chuyền tới "${sixW.whoIsAffected}" và diễn biến dòng tiền sau sự kiện "${sixW.doingWhat}".`,
      sentimentContext: `Duy trì giám sát chủ động không để xảy ra bất ngờ về thanh khoản hoặc ách tắc dòng tiền.`,
      rationale: `Giữ nhịp theo dõi liên tục giúp Lãnh đạo chủ động ra quyết định can thiệp chính sách kịp thời nếu chỉ số vượt ngưỡng an toàn.`,
      actionSteps: [
        `Thiết lập chế độ báo cáo nhanh tần suất 2 lần/ngày về chỉ số thanh khoản và biến động dư nợ/giao dịch.`,
        `Chuẩn bị sẵn sàng các công cụ điều tiết thị trường (hạn mức, cung tiền, hoán đổi kỳ hạn).`,
        `Phối hợp liên ngành với Ngân hàng Nhà nước và Bộ Công an khi xuất hiện biến động lan truyền.`,
      ],
      draftingActionType: 'monitoring_report',
    });
  }

  // ==========================================
  // CASE 2: BULLISH / BREAKTHROUGH / POSITIVE REFORM
  // ==========================================
  else if (sentiment === 'bullish' || isPositiveBreakthrough) {
    // Action 1: Amplify Positive Policy & Investor Trust
    actions.push({
      id: `${item.id}-action-1`,
      rank: 1,
      title: 'Khuếch đại truyền thông chính sách & củng cố niềm tin dòng vốn',
      shortTag: 'Lan tỏa truyền thông',
      category: 'COMMUNICATION',
      categoryLabel: 'Lan tỏa & Truyền thông',
      urgency: 'Ưu tiên cao',
      urgencyLevel: 'high',
      targetUnit: 'Văn phòng Bộ & Cổng TTĐT Bộ Tài chính',
      sixWRationale: `Kết quả đột phá "${sixW.resultOutcome}" tạo hiệu ứng tâm lý tích cực "${sixW.reaction}" đối với "${sixW.whoIsAffected}".`,
      sentimentContext: `Sắc thái Tích cực (+${Math.abs(score)}/100) - Thời điểm vàng để định hướng niềm tin thị trường.`,
      rationale: `Tận dụng xung lực tích cực để truyền thông nhất quán về quyết tâm cải cách thể chế và thu hút dòng vốn trong và ngoài nước.`,
      actionSteps: [
        `Phát hành bài chuyên sâu / Infographic trên Cổng TTĐT Bộ và mạng lưới báo chí kinh tế tài chính lớn.`,
        `Tổ chức tọa đàm / phỏng vấn Lãnh đạo đơn vị làm rõ cơ chế tạo nên thành công và định hướng tiếp theo.`,
        `Chia sẻ thông tin tới cộng đồng nhà đầu tư quốc tế và các tổ chức xếp hạng (FTSE, MSCI, WB).`,
      ],
      draftingActionType: 'press_release',
    });

    // Action 2: Scale Success & Remove Remaining Bottlenecks
    actions.push({
      id: `${item.id}-action-2`,
      rank: 2,
      title: 'Đẩy nhanh tháo gỡ điểm nghẽn & nhân rộng mô hình cải cách',
      shortTag: 'Tháo gỡ thể chế',
      category: 'POLICY_REFORM',
      categoryLabel: 'Cải cách Thể chế',
      urgency: 'Ưu tiên cao',
      urgencyLevel: 'medium',
      targetUnit: primaryUnit,
      sixWRationale: `Hành động "${sixW.doingWhat}" của "${sixW.who}" đã chứng minh hiệu quả về "${sixW.aboutWhat}".`,
      sentimentContext: `Động lực thúc đẩy tăng trưởng kinh tế và nâng cao hiệu quả thu nộp ngân sách.`,
      rationale: `Hiện thực hóa lợi thế hiện tại thành cơ chế thể chế hóa lâu dài, xóa bỏ triệt để các rào cản thủ tục hành chính.`,
      actionSteps: [
        `Rà soát và tổng kết kinh nghiệm thành công để chuẩn hóa thành quy trình mẫu áp dụng toàn ngành.`,
        `Đề xuất sửa đổi/bổ sung văn bản quy phạm pháp luật để tạo hành lang pháp lý bền vững.`,
        `Chỉ đạo các đơn vị địa phương đồng loạt triển khai nhằm tăng tốc giải ngân và phục vụ người dân, doanh nghiệp.`,
      ],
      draftingActionType: 'dispatch_notice',
    });

    // Action 3: Routine Surveillance & Sustainability Guard
    actions.push({
      id: `${item.id}-action-3`,
      rank: 3,
      title: 'Theo dõi sát sao dòng tiền & bảo đảm tính bền vững cân đối vĩ mô',
      shortTag: 'Theo dõi sát sao',
      category: 'MONITORING',
      categoryLabel: 'Giám sát 24/7',
      urgency: 'Theo dõi 24h',
      urgencyLevel: 'low',
      targetUnit: 'Vụ Ngân sách Nhà nước & KBNN',
      sixWRationale: `Quan sát phản ứng tiếp diễn của "${sixW.whoIsAffected}" để duy trì đà tăng trưởng ổn định.`,
      sentimentContext: `Chủ động kiểm soát các rủi ro phát sinh từ tăng trưởng nóng hoặc biến động ngoại biên.`,
      rationale: `Đảm bảo hiệu quả tài khóa đi kèm kỷ cương tài chính và an toàn nợ công dài hạn.`,
      actionSteps: [
        `Cập nhật số liệu điều hành ngân quỹ hàng tuần gắn với tiến độ thu chi NSNN.`,
        `Phân tích các kịch bản dự báo tác động tới thị trường trong 1-3 quý tới.`,
        `Tham mưu kịp thời cho Lãnh đạo Bộ phương án điều phối nhịp nhàng giữa chính sách tài khóa và tiền tệ.`,
      ],
      draftingActionType: 'monitoring_report',
    });
  }

  // ==========================================
  // CASE 3: NEUTRAL / POLICY GUIDANCE / MIXED / ROUTINE
  // ==========================================
  else {
    // Action 1: Active Surveillance & Market Tracking
    actions.push({
      id: `${item.id}-action-1`,
      rank: 1,
      title: 'Theo dõi sát sao diễn biến & biến động cung cầu thị trường',
      shortTag: 'Theo dõi sát sao',
      category: 'MONITORING',
      categoryLabel: 'Giám sát 24/7',
      urgency: 'Ưu tiên cao',
      urgencyLevel: 'medium',
      targetUnit: primaryUnit,
      sixWRationale: `Thị trường đang có phản ứng "${sixW.reaction}" xoay quanh nội dung "${sixW.aboutWhat}" của "${sixW.who}".`,
      sentimentContext: `Sắc thái Trung lập (${score}/100) - Tình hình đang trong tầm kiểm soát nhưng cần bám sát.`,
      rationale: `Giám sát liên tục giúp phát hiện sớm các dấu hiệu dịch chuyển bất thường để phản ứng trước khi thành điểm nóng.`,
      actionSteps: [
        `Giao ${primaryUnit} tổng hợp báo cáo nhanh tình hình giao dịch và phản ánh của doanh nghiệp.`,
        `Theo dõi chỉ số giá cả và thanh khoản trong các phiên giao dịch kế tiếp.`,
        `Sẵn sàng kịch bản điều hành khi có sự thay đổi đột ngột về tâm lý thị trường.`,
      ],
      draftingActionType: 'monitoring_report',
    });

    // Action 2: Inter-Agency Coordination & Policy Guidance
    actions.push({
      id: `${item.id}-action-2`,
      rank: 2,
      title: 'Chủ động hướng dẫn nghiệp vụ & giải đáp thắc mắc cho đối tượng tác động',
      shortTag: 'Hướng dẫn chính sách',
      category: 'POLICY_REFORM',
      categoryLabel: 'Hướng dẫn & Nghiệp vụ',
      urgency: 'Theo dõi 24h',
      urgencyLevel: 'medium',
      targetUnit: 'Vụ Pháp chế / Cục Quản lý chuyên ngành',
      sixWRationale: `Hỗ trợ "${sixW.whoIsAffected}" nắm rõ quy định và kết quả "${sixW.resultOutcome}" của chính sách.`,
      sentimentContext: `Tăng cường tính minh bạch và sự đồng thuận của người nộp thuế / nhà đầu tư.`,
      rationale: `Giải tỏa kịp thời các băn khoăn về quy trình thực thi giúp nâng cao hiệu lực quản lý nhà nước.`,
      actionSteps: [
        `Ban hành văn bản hướng dẫn nghiệp vụ hoặc công văn giải đáp các vướng mắc phổ biến.`,
        `Tổ chức đối thoại trực tuyến hoặc tập huấn chuyên đề cho các đối tượng chịu tác động.`,
        `Đăng tải công khai bộ câu hỏi thường gặp (FAQ) trên cổng thông tin điện tử.`,
      ],
      draftingActionType: 'dispatch_notice',
    });

    // Action 3: Inter-agency Consultation & Stabilization
    actions.push({
      id: `${item.id}-action-3`,
      rank: 3,
      title: 'Phối hợp liên ngành (NHNN, Bộ Công Thương) bảo đảm ổn định vĩ mô',
      shortTag: 'Phối hợp liên ngành',
      category: 'INTER_AGENCY',
      categoryLabel: 'Phối hợp Liên ngành',
      urgency: 'Theo dõi 24h',
      urgencyLevel: 'low',
      targetUnit: 'Tổ Thư ký Ban Chỉ đạo Điều hành Vĩ mô Bộ Tài chính',
      sixWRationale: `Đồng bộ chính sách giữa "${sixW.who}" và các bộ ngành liên quan đối với "${sixW.aboutWhat}".`,
      sentimentContext: `Duy trì thế chủ động và phối hợp nhịp nhàng giữa tài khóa và các chính sách vĩ mô khác.`,
      rationale: `Sự phối hợp chặt chẽ giữa các cơ quan quản lý giúp triệt tiêu độ trễ chính sách và tối ưu hóa nguồn lực quốc gia.`,
      actionSteps: [
        `Trao đổi thông tin định kỳ giữa Bộ Tài chính và Ngân hàng Nhà nước về cân đối thanh khoản và thị trường vốn.`,
        `Đánh giá tác động chéo giữa thị trường hàng hóa thế giới và mặt bằng giá nội địa.`,
        `Chuẩn bị nội dung tham mưu phục vụ các phiên họp thường kỳ của Chính phủ và Thủ tướng Chính phủ.`,
      ],
      draftingActionType: 'statement',
    });
  }

  const finalizedActions = actions.map((act) => ({
    ...act,
    cooperatingUnits: act.cooperatingUnits && act.cooperatingUnits.length > 0 ? act.cooperatingUnits : cooperatingUnits,
  }));

  // Generate Synthesized Recommended Focus
  const recommendedFocus =
    finalizedActions.length > 0
      ? `Trọng tâm Lãnh đạo cần ưu tiên: "${finalizedActions[0].title}" do ${finalizedActions[0].targetUnit} chủ trì thực hiện (Phối hợp: ${cooperatingUnits.slice(0, 2).join(', ')}).`
      : 'Tiếp tục theo dõi diễn biến thị trường và quản lý rủi ro thường nhật.';

  return {
    articleId: item.id,
    actions: finalizedActions,
    recommendedFocus,
    sentimentSummary: `Sắc thái ${
      sentiment === 'bullish' ? 'Tích cực' : sentiment === 'bearish' ? 'Tiêu cực' : 'Trung lập'
    } (${score > 0 ? '+' : ''}${score}/100) • Tác động ${impact.toUpperCase()}`,
    sixWSummary: `6W: ${sixW.who} | ${sixW.doingWhat} | ${sixW.resultOutcome}`,
  };
}

/**
 * Visual styling and metadata presentation helper for Action Categories
 */
export function getActionCategoryPresentation(category: ActionCategory, isDark: boolean) {
  switch (category) {
    case 'INSPECTION':
      return {
        iconEmoji: '🔍',
        badgeClass: isDark
          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          : 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold',
        borderClass: isDark ? 'border-rose-500/40' : 'border-rose-300',
        bgClass: isDark ? 'bg-rose-950/20' : 'bg-rose-50/70',
        textAccent: isDark ? 'text-rose-400' : 'text-rose-700',
        btnClass: 'bg-rose-600 hover:bg-rose-500 text-white',
      };
    case 'COMMUNICATION':
      return {
        iconEmoji: '📢',
        badgeClass: isDark
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          : 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold',
        borderClass: isDark ? 'border-amber-500/40' : 'border-amber-300',
        bgClass: isDark ? 'bg-amber-950/20' : 'bg-amber-50/70',
        textAccent: isDark ? 'text-amber-400' : 'text-amber-700',
        btnClass: 'bg-amber-600 hover:bg-amber-500 text-white',
      };
    case 'MONITORING':
      return {
        iconEmoji: '👁️',
        badgeClass: isDark
          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
          : 'bg-blue-100 text-blue-900 border-blue-300 font-extrabold',
        borderClass: isDark ? 'border-blue-500/40' : 'border-blue-300',
        bgClass: isDark ? 'bg-blue-950/20' : 'bg-blue-50/70',
        textAccent: isDark ? 'text-blue-400' : 'text-blue-700',
        btnClass: 'bg-blue-600 hover:bg-blue-500 text-white',
      };
    case 'POLICY_REFORM':
      return {
        iconEmoji: '🏛️',
        badgeClass: isDark
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          : 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold',
        borderClass: isDark ? 'border-emerald-500/40' : 'border-emerald-300',
        bgClass: isDark ? 'bg-emerald-950/20' : 'bg-emerald-50/70',
        textAccent: isDark ? 'text-emerald-400' : 'text-emerald-700',
        btnClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      };
    case 'INTER_AGENCY':
      return {
        iconEmoji: '🤝',
        badgeClass: isDark
          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
          : 'bg-indigo-100 text-indigo-900 border-indigo-300 font-extrabold',
        borderClass: isDark ? 'border-indigo-500/40' : 'border-indigo-300',
        bgClass: isDark ? 'bg-indigo-950/20' : 'bg-indigo-50/70',
        textAccent: isDark ? 'text-indigo-400' : 'text-indigo-700',
        btnClass: 'bg-indigo-600 hover:bg-indigo-500 text-white',
      };
    default:
      return {
        iconEmoji: '⚡',
        badgeClass: isDark
          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
          : 'bg-purple-100 text-purple-900 border-purple-300 font-extrabold',
        borderClass: isDark ? 'border-purple-500/40' : 'border-purple-300',
        bgClass: isDark ? 'bg-purple-950/20' : 'bg-purple-50/70',
        textAccent: isDark ? 'text-purple-400' : 'text-purple-700',
        btnClass: 'bg-purple-600 hover:bg-purple-500 text-white',
      };
  }
}

/**
 * Format a single proposed action into a professional clipboard dispatch brief
 */
export function formatActionProposalForClipboard(
  item: ScrapedNewsItem,
  action: ProposedLeadershipAction
): string {
  return (
    `📋 [PHIẾU ĐỀ XUẤT HÀNH ĐỘNG LÃNH ĐẠO - AUTO-ACTION PROPOSER]\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📰 Bài báo: ${item.title}\n` +
    `📡 Nguồn tin: ${item.source} (${item.url})\n` +
    `📊 Sắc thái: ${item.sentiment.toUpperCase()} (Điểm: ${item.sentimentScore}/100)\n\n` +
    `🎯 HÀNH ĐỘNG ĐỀ XUẤT #${action.rank}: ${action.title}\n` +
    `🏷️ Phân loại: ${action.categoryLabel} | Mức độ: ${action.urgency}\n` +
    `🏢 Đơn vị chủ trì: ${action.targetUnit}\n\n` +
    `💡 Căn cứ 6W:\n${action.sixWRationale}\n\n` +
    `📌 Các bước triển khai cụ thể:\n` +
    action.actionSteps.map((step, idx) => `  ${idx + 1}. ${step}`).join('\n') +
    `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Hệ thống Social Listening Bộ Tài chính - BTC Listening`
  );
}

/**
 * Format all 3 proposed actions for full briefing share
 */
export function formatAllActionsProposalForClipboard(
  item: ScrapedNewsItem,
  result: ArticleActionProposalResult
): string {
  return (
    `📋 [BẢNG TỔNG HỢP 3 HÀNH ĐỘNG THAM MƯU LÃNH ĐẠO - AUTO-ACTION PROPOSER]\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📰 Tiêu đề: ${item.title}\n` +
    `📊 Đánh giá: ${result.sentimentSummary}\n` +
    `🔍 ${result.sixWSummary}\n` +
    `⭐ Trọng tâm: ${result.recommendedFocus}\n\n` +
    result.actions
      .map(
        (a, i) =>
          `[HÀNH ĐỘNG ${i + 1}] ${a.title}\n` +
          `• Phân loại: ${a.categoryLabel} (${a.urgency}) | Đơn vị: ${a.targetUnit}\n` +
          `• Căn cứ: ${a.sixWRationale}\n` +
          `• Triển khai: ${a.actionSteps.join('; ')}\n`
      )
      .join('\n') +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Social Listening MoF • Generated by Auto-Action Proposer`
  );
}
