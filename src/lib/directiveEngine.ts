import {
  ExecutiveDirective,
  MediaStrategyType,
  SentimentType,
  ImpactLevel,
  SixWAnalysis,
} from '../types';
import { isMinistryAuthorityProposal } from './newsClassification';

interface DirectiveContext {
  priorityScore?: number;
  sentiment?: SentimentType;
  impactLevel?: ImpactLevel;
  buzzScore?: number;
  isUrgent?: boolean;
  sectorNameVi?: string;
  agencies?: string[];
  tickers?: string[];
  keyPeople?: string[];
  policyTags?: string[];
  keyPoints?: string[];
}

export interface MediaStrategyPresentation {
  type: MediaStrategyType;
  badgeLabel: string;
  icon: string;
  badgeClassLight: string;
  badgeClassDark: string;
  textClassLight: string;
  textClassDark: string;
  borderClassLight: string;
  borderClassDark: string;
  description: string;
  title: string;
  reasoning: string;
}

/**
 * Intelligent directive generator tailored to Ministry of Finance (MoF) priorities,
 * score thresholds, sentiment, and specialized financial domains.
 */
export function generateSmartExecutiveDirective(
  title: string,
  summary: string = '',
  context: DirectiveContext = {}
): ExecutiveDirective {
  const text = `${title} ${summary}`.toLowerCase();
  const priorityScore = context.priorityScore ?? 5.0;
  const sentiment: SentimentType = context.sentiment || 'neutral';
  const buzzScore = context.buzzScore ?? 50;
  const isUrgent = context.isUrgent ?? false;

  // 1. Determine Where (Agency / Jurisdiction)
  let primaryAgency = 'Bộ Tài chính & Các đơn vị trực thuộc';
  let jurisdiction = 'Lĩnh vực quản lý chuyên ngành Bộ Tài chính';

  if (context.agencies && context.agencies.length > 0) {
    primaryAgency = context.agencies.join(', ');
  } else if (text.includes('kho bạc') || text.includes('kbnn') || text.includes('tiền gửi kho bạc') || text.includes('ngân quỹ')) {
    primaryAgency = 'Kho bạc Nhà nước (KBNN)';
    jurisdiction = 'Quản lý Ngân quỹ Nhà nước & Trái phiếu Chính phủ';
  } else if (text.includes('uỷ ban chứng khoán') || text.includes('ubcknn') || text.includes('chứng khoán') || text.includes('hose') || text.includes('hnx') || text.includes('ftse') || text.includes('non-prefunding')) {
    primaryAgency = 'Ủy ban Chứng khoán Nhà nước (UBCKNN)';
    jurisdiction = 'Giám sát Thị trường Chứng khoán & Nâng hạng';
  } else if (text.includes('thuế') || text.includes('hóa đơn điện tử') || text.includes('hoàn thuế') || text.includes('chống thất thu')) {
    primaryAgency = 'Cục Thuế và Thuế địa phương';
    jurisdiction = 'Quản lý Thu ngân sách & Hóa đơn số';
  } else if (text.includes('hải quan') || text.includes('thông quan') || text.includes('xuất nhập khẩu') || text.includes('xnk') || text.includes('buôn lậu')) {
    primaryAgency = 'Cục Hải quan';
    jurisdiction = 'Giám sát Xuất nhập khẩu & Thuế quan';
  } else if (text.includes('trái phiếu') || text.includes('tpdn') || text.includes('nợ công') || text.includes('đáo hạn')) {
    primaryAgency = 'Vụ Tài chính các Ngân hàng & TCTD / Cục Quản lý Nợ (Bộ Tài chính)';
    jurisdiction = 'Thị trường Trái phiếu Doanh nghiệp & Quản lý Nợ công';
  } else if (text.includes('giá') || text.includes('bình ổn') || text.includes('xăng dầu')) {
    primaryAgency = 'Cục Quản lý Giá (Bộ Tài chính)';
    jurisdiction = 'Điều hành Mặt bằng Giá & Bình ổn Thị trường';
  } else if (text.includes('bảo hiểm') || text.includes('bancassurance')) {
    primaryAgency = 'Cục Quản lý Giám sát Bảo hiểm';
    jurisdiction = 'Thị trường Dịch vụ Bảo hiểm & Bảo vệ Người tiêu dùng';
  } else if (text.includes('fdi') || text.includes('đầu tư nước ngoài')) {
    primaryAgency = 'Bộ Tài chính phối hợp Bộ KH&ĐT';
    jurisdiction = 'Chính sách Ưu đãi Đầu tư & Thuế tối thiểu toàn cầu';
  } else if (context.tickers && context.tickers.length > 0) {
    primaryAgency = `Nhóm doanh nghiệp niêm yết (${context.tickers.slice(0, 3).join(', ')})`;
    jurisdiction = 'Quan hệ Nhà đầu tư & Thị trường thứ cấp';
  }

  // Check if article is about Ministry authority/institutional proposal
  const isAuthorityProposal = isMinistryAuthorityProposal(text);

  // 2. Determine What Happened
  let whatHappened = `${title}. ${summary || ''}`.trim();
  if (isAuthorityProposal) {
    whatHappened = `[Đề xuất Thể chế & Thẩm quyền]: ${title}. Bộ Tài chính chủ động đề xuất bổ sung thẩm quyền và hoàn thiện thể chế nhằm nâng cao hiệu quả phòng ngừa tội phạm kinh tế, bảo vệ quyền sở hữu trí tuệ và nguồn thu ngân sách nhà nước.`;
  } else if (sentiment === 'bearish' || text.includes('sai phạm') || text.includes('thao túng') || text.includes('vỡ nợ') || text.includes('khởi tố')) {
    whatHappened = `[Cảnh báo Rủi ro]: ${title}. Ghi nhận biến động bất lợi hoặc vi phạm cần sự theo dõi, khoanh vùng và xử lý chặt chẽ của cơ quan quản lý.`;
  } else if (sentiment === 'bullish' || text.includes('vượt mốc') || text.includes('khởi sắc') || text.includes('kỷ lục') || text.includes('tháo gỡ')) {
    whatHappened = `[Điểm sáng Đột phá]: ${title}. Ghi nhận tín hiệu tích cực vượt kỳ vọng, tạo động lực thúc đẩy niềm tin thị trường và hỗ trợ tăng trưởng kinh tế.`;
  } else if (priorityScore < 4.0) {
    whatHappened = `[Diễn biến Thị trường Thường nhật]: ${title}. Biến động kỹ thuật và tâm lý cung cầu tự nhiên trong phiên giao dịch.`;
  } else {
    whatHappened = `[Thông tin Điều hành & Thể chế]: ${title}. Tiến độ triển khai cơ chế chính sách mới và phản hồi từ các thành viên thị trường.`;
  }

  // 3. Determine Root Cause
  let rootCause = 'Do quy luật vận động tự nhiên của cung cầu thị trường và tiến trình hoàn thiện thể chế kinh tế tài chính.';
  if (isAuthorityProposal) {
    rootCause = 'Xuất phát từ yêu cầu thực tiễn quản lý nhà nước về thuế, tài chính và hải quan; cần bổ sung công cụ pháp lý đủ mạnh cho cơ quan chuyên ngành để xử lý kịp thời các hành vi trốn thuế tinh vi và vi phạm sở hữu trí tuệ qua biên giới.';
  } else if (text.includes('kho bạc') || text.includes('kbnn') || text.includes('tiền gửi')) {
    rootCause = 'KBNN thực hiện đấu thầu gửi tiền nhàn rỗi công khai, minh bạch tại các ngân hàng thương mại lớn, vừa bảo toàn vốn ngân sách vừa hỗ trợ thanh khoản hệ thống.';
  } else if (text.includes('trái phiếu') || text.includes('tpdn')) {
    if (sentiment === 'bearish' || text.includes('chậm trả') || text.includes('vỡ nợ')) {
      rootCause = 'Áp lực đáo hạn nợ gốc tập trung cao điểm, dòng tiền bán hàng của doanh nghiệp BĐS gặp khó khăn cục bộ và tâm lý e ngại của trái chủ cá nhân.';
    } else {
      rootCause = 'Khung khổ pháp lý Nghị định 08 phát huy hiệu quả, các bên chủ động đàm phán gia hạn kỳ hạn nợ và sự hỗ trợ từ việc phục hồi dòng tiền sản xuất.';
    }
  } else if (text.includes('non-prefunding') || text.includes('ftse') || text.includes('nâng hạng') || text.includes('thông tư 68')) {
    rootCause = 'Nỗ lực gỡ bỏ rào cản ký quỹ 100% trước giao dịch theo chuẩn FTSE Russell, tạo tiền đề tiếp nhận 3-5 tỷ USD vốn định chế toàn cầu.';
  } else if (text.includes('hóa đơn') || text.includes('gian lận') || text.includes('trốn thuế') || text.includes('khởi tố')) {
    rootCause = 'Hành vi cố tình lợi dụng kẽ hở hóa đơn điện tử để chiếm đoạt tiền hoàn thuế hoặc thao túng giá trục lợi, bị cơ quan thuế & công an phát hiện triệt phá.';
  } else if (text.includes('xu hướng chứng khoán') || text.includes('thận trọng') || text.includes('phân hóa') || text.includes('nhận định')) {
    rootCause = 'Tâm lý nhà đầu tư giao dịch thăm dò trước các mốc thông tin vĩ mô quan trọng, dòng tiền luân chuyển giữa các nhóm ngành cơ bản.';
  } else if (sentiment === 'bearish') {
    rootCause = 'Tác động lan truyền từ thị trường quốc tế, áp lực tỷ giá ngắn hạn hoặc phản ứng thận trọng trước các tin tức chưa được kiểm chứng.';
  } else if (sentiment === 'bullish') {
    rootCause = 'Dòng tiền nội ngoại gia tăng giải ngân vào các nhóm cổ phiếu đầu ngành nhờ triển vọng kết quả kinh doanh khởi sắc và hỗ trợ từ chính sách tài khóa.';
  }

  // 4. Strategic Directive Classification Matrix (Score, Sentiment, Topic)
  let strategyType: MediaStrategyType = 'policy_guidance';
  let titleStrategy = '';
  let tacticalRecommendation = '';
  let actionPlan: string[] = [];
  let targetAudience = 'Nhà đầu tư, cộng đồng doanh nghiệp và dư luận xã hội';
  let recommendedSpokesperson = 'Người phát ngôn Bộ Tài chính / Thủ trưởng Đơn vị chuyên trách';
  let keyMessage = '';
  let suggestedChannels = ['Cổng TTĐT Bộ Tài chính (mof.gov.vn)', 'Thời báo Tài chính Việt Nam', 'VTV1'];

  // Case 0: Đề xuất Thẩm quyền & Hoàn thiện Thể chế của Bộ Tài chính
  if (isAuthorityProposal) {
    strategyType = 'policy_guidance';
    titleStrategy = 'Truyền thông chủ động về đề xuất bổ sung thẩm quyền của Bộ Tài chính nhằm hoàn thiện thể chế và nâng cao hiệu quả phòng chống tội phạm kinh tế, sở hữu trí tuệ';
    tacticalRecommendation = 'Khẳng định việc bổ sung thẩm quyền là công cụ quản lý chuyên ngành cần thiết, phù hợp thông lệ quốc tế và bảo vệ quyền lợi hợp pháp của doanh nghiệp làm ăn chân chính.';
    actionPlan = [
      '1. Đăng tải bài viết chuyên đề trên Cổng TTĐT Bộ Tài chính và Thời báo Tài chính Việt Nam giải thích cơ sở pháp lý và sự cần thiết của đề xuất.',
      '2. Tổ chức tham vấn chuyên gia pháp lý và cơ quan hữu quan để xây dựng quy trình thực thi chặt chẽ, minh bạch.',
      '3. Nhấn mạnh mục tiêu chống thất thu ngân sách, bảo vệ quyền sở hữu trí tuệ và tạo môi trường kinh doanh bình đẳng.',
      '4. Chủ động cung cấp thông tin cho báo chí chính thống để định hướng dư luận chính xác, tránh các cách hiểu suy diễn sai lệch.',
    ];
    targetAudience = 'Cộng đồng doanh nghiệp, tổ chức sở hữu trí tuệ, chuyên gia pháp lý và cơ quan báo chí';
    recommendedSpokesperson = 'Lãnh đạo Vụ Pháp chế / Đại diện Lãnh đạo Cục Thuế / Cục Hải quan';
    keyMessage = 'Bộ Tài chính đề xuất bổ sung thẩm quyền khởi tố một số vụ án thuế và sở hữu trí tuệ là bước đi chủ động nhằm tăng cường kỷ cương, bảo vệ quyền lợi hợp pháp của doanh nghiệp và an toàn ngân sách quốc gia.';
    suggestedChannels = ['Cổng TTĐT Bộ Tài chính', 'Thời báo Tài chính Việt Nam', 'Bản tin VTV1'];
  }
  // Case 1: Law Enforcement & Crackdown (Thanh tra, Vi phạm, Khởi tố, Gian lận)
  else if (
    text.includes('sai phạm') ||
    text.includes('thao túng') ||
    text.includes('khởi tố') ||
    text.includes('thanh tra') ||
    text.includes('gian lận hóa đơn') ||
    text.includes('buôn lậu') ||
    text.includes('trốn thuế') ||
    text.includes('bắt tạm giam')
  ) {
    strategyType = 'law_enforcement';
    titleStrategy = 'Công bố kết quả xử lý nghiêm sai phạm để răn đe, khẳng định trật tự và kỷ cương tài chính';
    tacticalRecommendation = 'Khẳng định tinh thần xử lý không có vùng cấm, công khai tiến độ xử phạt và bảo đảm thị trường minh bạch.';
    actionPlan = [
      '1. Phát hành thông cáo báo chí chính thức tóm lược sai phạm và chế tài xử lý đã áp dụng.',
      '2. Phối hợp với Cơ quan Điều tra (Bộ Công an) để định hướng thông tin chuẩn xác, tránh suy diễn.',
      '3. Chỉ đạo hệ thống giám sát tự động kích hoạt đối soát rà soát các chuỗi giao dịch / hóa đơn tương tự trên toàn quốc.',
      '4. Nhấn mạnh thông điệp bảo vệ các doanh nghiệp và nhà đầu tư làm ăn chân chính.',
    ];
    targetAudience = 'Cộng đồng doanh nghiệp, người nộp thuế, nhà đầu tư chứng khoán và các cơ quan truyền thông';
    recommendedSpokesperson = 'Chánh Thanh tra Bộ Tài chính / Đại diện Lãnh đạo Cục Thuế / UBCKNN';
    keyMessage = 'Bộ Tài chính kiên quyết xử lý nghiêm minh mọi hành vi gian lận, thao túng và vi phạm pháp luật; giữ vững kỷ cương, sự công bằng và an toàn cho toàn bộ hệ thống tài chính.';
    suggestedChannels = ['Cổng TTĐT Bộ Tài chính', 'Thời báo Tài chính Việt Nam', 'Báo Pháp luật', 'Bản tin VTV1'];
  }
  // Case 2: Systemic Crisis, Bond Default, Extreme Panic, Dangerous Rumors (Bearish & High Priority/Urgent)
  else if (
    (sentiment === 'bearish' && (priorityScore >= 7.0 || isUrgent || buzzScore >= 75)) ||
    text.includes('vỡ nợ') ||
    text.includes('chậm trả nợ') ||
    text.includes('tin đồn thất thiệt') ||
    text.includes('bán tháo') ||
    text.includes('đính chính')
  ) {
    strategyType = 'crisis_resolution';
    titleStrategy = 'Kịp thời kiểm soát khủng hoảng truyền thông, đính chính thông tin sai lệch và khoanh vùng rủi ro';
    tacticalRecommendation = 'Phát thông cáo khẩn cấp trong 2-4h, ổn định tâm lý nhà đầu tư, khoanh vùng rủi ro cục bộ.';
    actionPlan = [
      '1. Ban hành ngay Thông cáo báo chí chính thức giải trình rõ thực trạng và các biện pháp bảo vệ hệ thống.',
      '2. Người phát ngôn chủ động trả lời phỏng vấn trên VTV1 và các báo kinh tế chủ lực để ngăn chặn tin đồn lan rộng.',
      '3. Làm việc trực tiếp với các định chế tài chính, tổ chức phát hành và ngân hàng liên quan để triển khai phương án ứng phó.',
      '4. Thiết lập đường dây nóng hỗ trợ giải đáp thắc mắc, triệt tiêu tâm lý hoang mang đám đông.',
    ];
    targetAudience = 'Trái chủ, nhà đầu tư cá nhân và tổ chức, cộng đồng mạng xã hội và hệ thống ngân hàng';
    recommendedSpokesperson = 'Chánh Văn phòng - Người phát ngôn Bộ Tài chính phối hợp Lãnh đạo UBCKNN / Vụ chuyên môn';
    keyMessage = 'Bộ Tài chính khẳng định mọi diễn biến đang được giám sát chặt chẽ; khung pháp lý luôn bảo đảm quyền lợi chính đáng của nhà đầu tư và sự ổn định của thị trường vốn.';
    suggestedChannels = ['Cổng TTĐT Bộ Tài chính (mof.gov.vn)', 'VTV1 - Bản tin Tài chính', 'Thời báo Tài chính VN', 'Họp báo đột xuất'];
  }
  // Case 3: State Treasury Management & Cash Optimization (KBNN, Tiền gửi, Quản lý ngân quỹ)
  else if (text.includes('kho bạc') || text.includes('kbnn') || text.includes('tiền gửi kho bạc') || text.includes('ngân quỹ') || text.includes('phát hành tpcp')) {
    strategyType = 'treasury_optimization';
    titleStrategy = 'Minh bạch hóa quản lý ngân quỹ Nhà nước, tối ưu hóa nguồn vốn công phục vụ nền kinh tế';
    tacticalRecommendation = 'Công khai cơ chế điều hành ngân quỹ an toàn, linh hoạt, hỗ trợ thanh khoản nền kinh tế và tối đa hóa nguồn thu cho ngân sách.';
    actionPlan = [
      '1. Cung cấp số liệu chính thống về tình hình quản lý ngân quỹ và tiến độ phát hành Trái phiếu Chính phủ định kỳ.',
      '2. Phổ biến quy trình đấu thầu gửi tiền ngân quỹ công khai, cạnh tranh, an toàn tại các NHTM có uy tín.',
      '3. Phối hợp với Ngân hàng Nhà nước điều hòa nhịp nhàng giữa chính sách tài khóa và tiền tệ, hỗ trợ mặt bằng lãi suất.',
      '4. Khẳng định hiệu quả bảo toàn và sinh lời cho nguồn vốn ngân sách quốc gia.',
    ];
    targetAudience = 'Hệ thống ngân hàng thương mại, các định chế tài chính, cử tri và công luận';
    recommendedSpokesperson = 'Lãnh đạo Kho bạc Nhà nước / Cục Quản lý Nợ & TCĐN';
    keyMessage = 'Kho bạc Nhà nước vận hành ngân quỹ quốc gia với nguyên tắc an toàn, thanh khoản cao, minh bạch và hiệu quả kinh tế tối ưu, đóng góp tích cực vào nguồn thu ngân sách nhà nước.';
    suggestedChannels = ['Cổng TTĐT Kho bạc Nhà nước', 'Cổng TTĐT Bộ Tài chính', 'Thời báo Tài chính Việt Nam', 'Báo Đầu Tư'];
  }
  // Case 4: Upgrading / FTSE / Major Institutional Breakthroughs (Non-prefunding, TT68, KRX)
  else if (text.includes('non-prefunding') || text.includes('ftse') || text.includes('nâng hạng') || text.includes('thông tư 68') || text.includes('krx')) {
    if (priorityScore >= 6.5 || sentiment === 'bullish') {
      strategyType = 'positive_amplification';
      titleStrategy = 'Đẩy mạnh truyền thông lộ trình gỡ vướng tiêu chuẩn FTSE & củng cố niềm tin dòng vốn quốc tế';
      tacticalRecommendation = 'Chủ động tổ chức quảng bá chính sách mới tới các quỹ ngoại, làm nổi bật quyết tâm cải cách thể chế của Bộ Tài chính.';
      actionPlan = [
        '1. Tổ chức hội thảo giới thiệu cơ chế Non-prefunding tới các tổ chức xếp hạng (FTSE, MSCI) và quỹ đầu tư quốc tế.',
        '2. Xây dựng tài liệu song ngữ Anh - Việt hướng dẫn quy chế giao dịch mới và kiểm soát rủi ro thanh toán.',
        '3. Tuyên truyền rộng rãi trên các kênh tài chính quốc tế (Bloomberg, Reuters) và truyền thông trong nước.',
        '4. Phối hợp chặt chẽ với VSDC và các CTCK để vận hành hệ thống thông suốt.',
      ];
      targetAudience = 'Nhà đầu tư nước ngoài (FII), các quỹ quản lý tài sản quốc tế, CTCK và thị trường chứng khoán';
      recommendedSpokesperson = 'Lãnh đạo Bộ Tài chính / Chủ tịch UBCKNN';
      keyMessage = 'Việt Nam quyết tâm hoàn thiện các tiêu chí nâng hạng thị trường chứng khoán, xây dựng môi trường đầu tư công bằng, thuận lợi và đạt chuẩn mực quốc tế.';
      suggestedChannels = ['Cổng TTĐT Bộ Tài chính & UBCKNN', 'Bloomberg', 'Reuters', 'Thời báo Tài chính Việt Nam'];
    } else {
      strategyType = 'policy_guidance';
      titleStrategy = 'Chủ động cập nhật tiến độ hoàn thiện khung pháp lý nâng hạng thị trường chứng khoán';
      tacticalRecommendation = 'Cung cấp thông tin khách quan, giải đáp thắc mắc của nhà đầu tư và thành viên thị trường về lộ trình đáp ứng tiêu chí FTSE.';
      actionPlan = [
        '1. Ban hành bản tin cập nhật tiến độ tháo gỡ các nút thắt nâng hạng định kỳ hàng tháng.',
        '2. Lắng nghe và tiếp thu ý kiến đóng góp từ các hiệp hội đầu tư và công ty chứng khoán thành viên.',
        '3. Tránh để thị trường kỳ vọng thái quá hoặc thất vọng không có cơ sở khoa học.',
      ];
      targetAudience = 'Nhà đầu tư trong nước, cộng đồng phân tích chứng khoán và các cơ quan truyền thông';
      recommendedSpokesperson = 'Đại diện Vụ Phát triển Thị trường - UBCKNN';
      keyMessage = 'Tiến trình nâng hạng thị trường chứng khoán đang được triển khai bài bản theo lộ trình cụ thể với sự tham gia đồng bộ của cả hệ thống tài chính.';
      suggestedChannels = ['Cổng TTĐT UBCKNN', 'Thời báo Tài chính Việt Nam', 'Tạp chí Chứng khoán'];
    }
  }
  // Case 5: Routine Market Commentary / Non-Ministry Daily Fluctuations (Score < 4.0 & Neutral/Routine)
  // [CRITICAL FIX]: For low score daily news (like Score 2.4, 3.4 - "Xu hướng chứng khoán 19/8 thận trọng", "Nhận định thị trường"),
  // we MUST classify as routine monitoring (do not intervene) instead of generic amplification!
  else if (priorityScore < 4.5 && sentiment !== 'bearish') {
    strategyType = 'routine_monitoring';
    titleStrategy = 'Duy trì theo dõi thường nhật biên độ thị trường, không cần can thiệp truyền thông hành chính';
    tacticalRecommendation = 'Ghi nhận biến động kỹ thuật thường quy, duy trì quan sát thụ động, tránh can thiệp hành chính làm méo mó tâm lý thị trường.';
    actionPlan = [
      '1. Tiếp tục duy trì hệ thống giám sát tự động phiên giao dịch của UBCKNN và các Sở Giao dịch.',
      '2. Không thực hiện các biện pháp can thiệp truyền thông trực tiếp để tránh gây nhiễu tâm lý giao dịch tự nhiên.',
      '3. Tổng hợp số liệu vào Báo cáo nhanh cuối ngày phục vụ công tác điều hành vĩ mô thường kỳ.',
    ];
    targetAudience = 'Tổ theo dõi thị trường nội bộ Bộ Tài chính & UBCKNN';
    recommendedSpokesperson = 'Tổ Giám sát Giao dịch (Không phát ngôn đại chúng)';
    keyMessage = 'Thị trường vận hành theo quy luật cung cầu tự nhiên; hệ thống kỹ thuật và giao dịch duy trì ổn định, an toàn.';
    suggestedChannels = ['Báo cáo Giám sát nội bộ', 'Hệ thống Dashboard điều hành CMS'];
  }
  // Case 6: Market Volatility / Mild Correction / FX pressures (Bearish & Moderate Score)
  else if (sentiment === 'bearish' || text.includes('thận trọng') || text.includes('áp lực tỷ giá') || text.includes('khối ngoại bán ròng') || text.includes('phân hóa')) {
    strategyType = 'risk_mitigation';
    titleStrategy = 'Chủ động theo dõi cung cầu thị trường, chuẩn bị kịch bản thanh khoản ổn định tâm lý';
    tacticalRecommendation = 'Theo dõi chặt chẽ thanh khoản và tỷ giá, định hướng thông tin trung lập giúp nhà đầu tư nhìn nhận triển vọng dài hạn.';
    actionPlan = [
      '1. Giám sát chặt chẽ hoạt động giao dịch của khối ngoại, tự doanh và các tài khoản ký quỹ (margin).',
      '2. Phối hợp các chuyên gia kinh tế đăng tải các bài phân tích chuyên sâu về sức chống chịu của nền kinh tế vĩ mô.',
      '3. Sẵn sàng các công cụ điều tiết thị trường nếu xuất hiện biến động vượt biên độ cho phép.',
    ];
    targetAudience = 'Nhà đầu tư cá nhân, môi giới chứng khoán và các tổ chức tín dụng';
    recommendedSpokesperson = 'Đại diện Lãnh đạo UBCKNN / Vụ Tài chính Tiền tệ';
    keyMessage = 'Các nền tảng kinh tế vĩ mô và cân đối lớn của Việt Nam vẫn vững chắc; khuyến nghị nhà đầu tư thận trọng, quản trị rủi ro danh mục hợp lý.';
    suggestedChannels = ['Cổng TTĐT Bộ Tài chính', 'Thời báo Tài chính Việt Nam', 'Báo Đầu Tư'];
  }
  // Case 7: High-Impact Positive / Milestone Breakthrough (Score >= 6.5 & Bullish)
  else if (sentiment === 'bullish' || text.includes('vượt mốc') || text.includes('kỷ lục') || text.includes('bứt phá') || text.includes('tháo gỡ thành công') || text.includes('thu ngân sách vượt')) {
    strategyType = 'positive_amplification';
    titleStrategy = 'Đẩy mạnh truyền thông lan tỏa kết quả điều hành tài khóa & củng cố niềm tin dòng vốn';
    tacticalRecommendation = 'Tận dụng thời cơ truyền thông đa phương tiện để lan tỏa tinh thần cải cách, thúc đẩy niềm tin thị trường.';
    actionPlan = [
      '1. Xây dựng phóng sự, infographic và thông cáo báo chí làm nổi bật các thành tựu thu ngân sách / cải cách thủ tục.',
      '2. Tọa đàm với các hiệp hội doanh nghiệp và chuyên gia kinh tế để phân tích tác động tích cực đến nền kinh tế.',
      '3. Đưa tin trên các chương trình thời sự chính luận (VTV1 Thời sự 19h, Bản tin Tài chính).',
      '4. Kịp thời biểu dương các đơn vị, cá nhân có thành tích xuất sắc trong thực thi nhiệm vụ tài chính.',
    ];
    targetAudience = 'Cộng đồng doanh nghiệp trong và ngoài nước, nhà đầu tư và cử tri cả nước';
    recommendedSpokesperson = 'Lãnh đạo Bộ Tài chính / Thủ trưởng các Tổng cục';
    keyMessage = 'Chính sách tài khóa mở rộng có trọng tâm tiếp tục phát huy hiệu quả mạnh mẽ, tạo động lực vững chắc cho tăng trưởng kinh tế và thu hút đầu tư chất lượng cao.';
    suggestedChannels = ['Cổng TTĐT Chính phủ & Bộ Tài chính', 'VTV1 - Thời sự 19h', 'Báo Nhân Dân, Thời báo Tài chính VN'];
  }
  // Case 8: Standard Policy Framework & Circular Guidance (Default / Moderate Score)
  else {
    strategyType = 'policy_guidance';
    titleStrategy = 'Tăng cường hướng dẫn thực thi cơ chế chính sách mới, giải đáp tháo gỡ vướng mắc cho doanh nghiệp';
    tacticalRecommendation = 'Phổ biến sâu rộng quy định mới, tổ chức đối thoại để đảm bảo chính sách đi vào cuộc sống thuận lợi.';
    actionPlan = [
      '1. Đăng tải cẩm nang hướng dẫn và bộ câu hỏi thường gặp (Q&A) trên Cổng TTĐT Bộ Tài chính.',
      '2. Tổ chức các buổi hội nghị tập huấn trực tuyến cho các đối tượng chịu tác động của chính sách.',
      '3. Thiết lập kênh tiếp nhận và phản hồi nhanh các vướng mắc thực tiễn của người dân và doanh nghiệp.',
    ];
    targetAudience = 'Người nộp thuế, doanh nghiệp xuất nhập khẩu và các cơ quan thực thi cơ sở';
    recommendedSpokesperson = 'Thủ trưởng đơn vị soạn thảo văn bản / Vụ Pháp chế (Bộ Tài chính)';
    keyMessage = 'Bộ Tài chính luôn lắng nghe, đồng hành và tạo điều kiện thuận lợi tối đa để người dân và doanh nghiệp tuân thủ pháp luật dễ dàng, minh bạch.';
    suggestedChannels = ['Cổng TTĐT Bộ Tài chính', 'Thời báo Tài chính Việt Nam', 'Tạp chí Tài chính'];
  }

  return {
    whatHappened,
    whereEntity: primaryAgency,
    where: {
      primaryAgency,
      jurisdiction,
    },
    rootCause,
    mediaStrategy: {
      type: strategyType,
      title: titleStrategy,
      tacticalRecommendation,
      actionPlan,
      targetAudience,
      recommendedSpokesperson,
      keyMessage,
      suggestedChannels,
    },
  };
}

/**
 * Helper to get presentation metadata for any MediaStrategyType
 */
export function getMediaStrategyPresentation(
  type: MediaStrategyType,
  title?: string,
  priorityScore?: number
): MediaStrategyPresentation {
  switch (type) {
    case 'crisis_resolution':
      return {
        type: 'crisis_resolution',
        badgeLabel: '🚨 Xử lý khủng hoảng',
        icon: 'Flame',
        badgeClassLight: 'bg-rose-100 text-rose-800 border-rose-300',
        badgeClassDark: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        textClassLight: 'text-rose-700',
        textClassDark: 'text-rose-400',
        borderClassLight: 'border-rose-200',
        borderClassDark: 'border-rose-500/30',
        description: 'Khoanh vùng rủi ro, phát ngôn chính thức đính chính tin đồn trong 2-4h.',
        title: title || 'Kịp thời kiểm soát khủng hoảng truyền thông và đính chính thông tin sai lệch',
        reasoning: 'Rủi ro cao hoặc tiêu cực ảnh hưởng niềm tin thị trường, cần hành động khẩn cấp.',
      };

    case 'positive_amplification':
      return {
        type: 'positive_amplification',
        badgeLabel: '📢 Khuếch đại tích cực',
        icon: 'Sparkles',
        badgeClassLight: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        badgeClassDark: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        textClassLight: 'text-emerald-700',
        textClassDark: 'text-emerald-400',
        borderClassLight: 'border-emerald-200',
        borderClassDark: 'border-emerald-500/30',
        description: 'Lan tỏa thành tựu đột phá, củng cố niềm tin dòng vốn trong nước và quốc tế.',
        title: title || 'Đẩy mạnh truyền thông lan tỏa kết quả điều hành tài khóa & củng cố niềm tin dòng vốn',
        reasoning: 'Điểm sáng thể chế hoặc kết quả vượt mốc, tạo xung lực tích cực cho kinh tế vĩ mô.',
      };

    case 'law_enforcement':
      return {
        type: 'law_enforcement',
        badgeLabel: '⚖️ Răn đe & Kỷ cương PL',
        icon: 'ShieldAlert',
        badgeClassLight: 'bg-purple-100 text-purple-800 border-purple-300',
        badgeClassDark: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        textClassLight: 'text-purple-700',
        textClassDark: 'text-purple-400',
        borderClassLight: 'border-purple-200',
        borderClassDark: 'border-purple-500/30',
        description: 'Công bố kết quả thanh tra xử phạt, giữ vững tính thượng tôn pháp luật.',
        title: title || 'Công bố kết quả xử lý nghiêm sai phạm để răn đe, bảo đảm kỷ cương tài chính',
        reasoning: 'Hành vi vi phạm, thao túng hoặc gian lận cần công khai chế tài xử lý nghiêm minh.',
      };

    case 'treasury_optimization':
      return {
        type: 'treasury_optimization',
        badgeLabel: '🏦 Tối ưu ngân quỹ KBNN',
        icon: 'Landmark',
        badgeClassLight: 'bg-teal-100 text-teal-800 border-teal-300',
        badgeClassDark: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
        textClassLight: 'text-teal-700',
        textClassDark: 'text-teal-400',
        borderClassLight: 'border-teal-200',
        borderClassDark: 'border-teal-500/30',
        description: 'Minh bạch hóa quản lý ngân quỹ Nhà nước, tối ưu hóa nguồn vốn công.',
        title: title || 'Minh bạch hóa quản lý ngân quỹ Nhà nước, tối ưu hóa nguồn vốn công phục vụ nền kinh tế',
        reasoning: 'Nghiệp vụ Kho bạc Nhà nước điều hành ngân quỹ an toàn, thanh khoản và hiệu quả.',
      };

    case 'routine_monitoring':
      return {
        type: 'routine_monitoring',
        badgeLabel: '👁️ Giám sát thường nhật',
        icon: 'Eye',
        badgeClassLight: 'bg-slate-100 text-slate-700 border-slate-300',
        badgeClassDark: 'bg-slate-800 text-slate-300 border-slate-700',
        textClassLight: 'text-slate-600',
        textClassDark: 'text-slate-400',
        borderClassLight: 'border-slate-200',
        borderClassDark: 'border-slate-800',
        description: 'Theo dõi thị trường thường quy, không can thiệp truyền thông hành chính.',
        title: title || 'Duy trì theo dõi thường nhật biên độ thị trường, không cần can thiệp truyền thông',
        reasoning: `Điểm MoF ${priorityScore !== undefined ? `(${priorityScore} đ)` : '< 4.5'}: Tin tức phân tích thường nhật thị trường, kiến nghị giám sát thụ động không phát ngôn.`,
      };

    case 'risk_mitigation':
      return {
        type: 'risk_mitigation',
        badgeLabel: '🛡️ Khoanh vùng & Ổn định',
        icon: 'Shield',
        badgeClassLight: 'bg-amber-100 text-amber-900 border-amber-300',
        badgeClassDark: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        textClassLight: 'text-amber-800',
        textClassDark: 'text-amber-300',
        borderClassLight: 'border-amber-200',
        borderClassDark: 'border-amber-500/30',
        description: 'Theo dõi áp lực thanh khoản/tỷ giá, chuẩn bị kịch bản ổn định tâm lý.',
        title: title || 'Chủ động theo dõi cung cầu thị trường, chuẩn bị kịch bản thanh khoản ổn định tâm lý',
        reasoning: 'Biến động thận trọng hoặc áp lực điều chỉnh, cần theo dõi định hướng có chọn lọc.',
      };

    case 'policy_guidance':
    default:
      return {
        type: 'policy_guidance',
        badgeLabel: '📘 Hướng dẫn & Tham mưu',
        icon: 'BookOpen',
        badgeClassLight: 'bg-sky-100 text-sky-800 border-sky-300',
        badgeClassDark: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        textClassLight: 'text-sky-700',
        textClassDark: 'text-sky-400',
        borderClassLight: 'border-sky-200',
        borderClassDark: 'border-sky-500/30',
        description: 'Hướng dẫn thực thi chính sách mới, giải đáp tháo gỡ vướng mắc cho doanh nghiệp.',
        title: title || 'Tăng cường hướng dẫn thực thi cơ chế chính sách mới, giải đáp tháo gỡ vướng mắc',
        reasoning: 'Văn bản quy phạm, tiêu chuẩn kỹ thuật hoặc giải đáp thể chế cần tuyên truyền rộng rãi.',
      };
  }
}
