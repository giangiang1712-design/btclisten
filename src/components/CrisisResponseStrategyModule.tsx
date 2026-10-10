import React, { useState } from 'react';
import { ScrapedNewsItem, WarningPipelineModel, WarningAlertLevelType } from '../types';
import { generateWarningPipelineModel, FEW_SHOT_TEST_CASES } from '../lib/warningPipelineEngine';
import { useTheme } from '../lib/theme';
import {
  ShieldAlert,
  Flame,
  Zap,
  AlertTriangle,
  Activity,
  Clock,
  Building2,
  CheckCircle2,
  Copy,
  Check,
  Send,
  Mail,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Target,
  Sparkles,
  GitCompare,
  ListTodo,
  ExternalLink,
  Users,
  Scale,
  BookOpen,
  Calculator,
  HelpCircle
} from 'lucide-react';

interface CrisisResponseStrategyModuleProps {
  item: ScrapedNewsItem;
  onDraftStatement?: (item: ScrapedNewsItem) => void;
  onPolicySubmission?: (item: ScrapedNewsItem) => void;
  onGmailAlert?: (item: ScrapedNewsItem) => void;
  onOpenAdvisorChatbot?: (item: ScrapedNewsItem) => void;
}

export interface SOPActionItem {
  id: string;
  step: string;
  actionTitle: string;
  description: string;
  responsibleRole: string;
  timeline: string;
  requiredOutput: string;
  isMandatory: boolean;
}

export interface CrisisAlertTaxonomyLevel {
  levelKey: WarningAlertLevelType;
  badgeLabel: string;
  viLabel: string;
  scoreRange: string;
  slaTiming: string;
  leadUnit: string;
  strategicObjective: string;
  escalationTrigger: string;
  themeColor: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    accent: string;
  };
  sops: SOPActionItem[];
}

export const CRISIS_RESPONSE_TAXONOMY_SOPS: Record<WarningAlertLevelType, CrisisAlertTaxonomyLevel> = {
  EMERGENCY: {
    levelKey: 'EMERGENCY',
    badgeLabel: 'CẤP 4: CẢNH BÁO KHẨN CẤP',
    viLabel: 'Khẩn Cấp (Emergency Alert)',
    scoreRange: '75 – 100 điểm',
    slaTiming: '2h – 4h (Khung giờ Vàng Tối Khẩn)',
    leadUnit: 'Ban Cán sự Đảng, Lãnh đạo Bộ Tài chính & Tổ Cơ động Khủng hoảng',
    strategicObjective: 'Bảo vệ thể chế tối cao, ngăn ngừa đứt gãy niềm tin vào hệ thống tài chính - ngân sách, dập tắt tin giả/thao túng diện rộng.',
    escalationTrigger: 'Khiếu nại/biểu tình tập thể, sai phạm nghiêm trọng gây chấn động dư luận, hoặc tin giả quy mô quốc gia về tài chính tiền tệ.',
    themeColor: {
      bg: 'bg-rose-950/20 dark:bg-rose-950/30',
      border: 'border-rose-500/40',
      text: 'text-rose-600 dark:text-rose-400',
      badge: 'bg-rose-600 text-white',
      accent: 'text-rose-500'
    },
    sops: [
      {
        id: 'sop-4.1',
        step: 'SOP-4.1',
        actionTitle: 'Kích hoạt Ban Chỉ huy Khẩn cấp & Báo cáo Ban Cán sự Đảng',
        description: 'Triệu tập cuộc họp khẩn trong 60 phút giữa Lãnh đạo Bộ, Chánh Văn phòng và Thủ trưởng Vụ/Cục liên quan để thống nhất đường lối chỉ đạo.',
        responsibleRole: 'Chánh Văn phòng Bộ & Thủ trưởng đơn vị phụ trách',
        timeline: 'Trong vòng 1h - 2h',
        requiredOutput: 'Tờ trình Báo cáo Khẩn cấp & Biên bản phương án xử lý',
        isMandatory: true
      },
      {
        id: 'sop-4.2',
        step: 'SOP-4.2',
        actionTitle: 'Thực thi Quy chế Một Đầu Mối Phát Ngôn Duy Nhất',
        description: 'Chỉ định Người phát ngôn chính thức của Bộ Tài chính hoặc Thứ trưởng phụ trách. Nghiêm cấm các đơn vị trực thuộc tự ý cung cấp thông tin trái thẩm quyền.',
        responsibleRole: 'Người phát ngôn Bộ Tài chính',
        timeline: 'Trong vòng 2h',
        requiredOutput: 'Công điện/Văn bản quán triệt kỷ luật phát ngôn',
        isMandatory: true
      },
      {
        id: 'sop-4.3',
        step: 'SOP-4.3',
        actionTitle: 'Phát hành Thông Cáo Báo Chí Bác Bỏ / Đính Chính Toàn Diện',
        description: 'Đăng tải thông cáo chính thức trên Cổng TTĐT Bộ Tài chính (mof.gov.vn), phát sóng truyền hình VTV1, TTXVN và các báo chính thống.',
        responsibleRole: 'Phòng Báo chí - Văn phòng Bộ & Cổng TTĐT Bộ',
        timeline: 'Trong vòng 2h - 4h',
        requiredOutput: 'Thông cáo báo chí & Nội dung phỏng vấn Lãnh đạo',
        isMandatory: true
      },
      {
        id: 'sop-4.4',
        step: 'SOP-4.4',
        actionTitle: 'Phối hợp Liên ngành A05 Bộ Công An & Cục PTTH&TTĐT',
        description: 'Cung cấp bằng chứng, tài liệu xử lý các tài khoản mạng xã hội, hội nhóm phát tán tin đồn sai sự thật gây lũng đoạn thị trường.',
        responsibleRole: 'Tổ Pháp chế & Thanh tra Bộ Tài chính',
        timeline: 'Trong vòng 4h',
        requiredOutput: 'Công văn đề nghị xác minh & xử lý vi phạm không gian mạng',
        isMandatory: true
      },
      {
        id: 'sop-4.5',
        step: 'SOP-4.5',
        actionTitle: 'Ban hành Quyết sách Khắc phục / Chỉ đạo Nghiệp vụ Tức thì',
        description: 'Nếu khủng hoảng xuất phát từ bất cập thủ tục/phần mềm: Công bố ngay giải pháp tình thế (gia hạn, hỗ trợ trực tiếp, tạm dừng quy định gây ách tắc).',
        responsibleRole: 'Lãnh đạo Bộ Tài chính & Vụ Chính sách chuyên môn',
        timeline: 'Trong ngày (<= 12h)',
        requiredOutput: 'Quyết định/Công điện chỉ đạo nghiệp vụ tháo gỡ',
        isMandatory: true
      }
    ]
  },
  RAPID: {
    levelKey: 'RAPID',
    badgeLabel: 'CẤP 3: CẢNH BÁO NHANH',
    viLabel: 'Nhanh (Rapid Alert)',
    scoreRange: '60 – 74 điểm',
    slaTiming: '6h – 12h (Xử lý trong phiên làm việc)',
    leadUnit: 'Văn phòng Bộ Tài chính phối hợp Thủ trưởng Cục/Vụ phụ trách',
    strategicObjective: 'Chặn đà gia tăng vận tốc lan truyền (Velocity), dập tắt các suy đoán sai lệch, minh bạch hóa số liệu để tháo gỡ bức xúc của cộng đồng doanh nghiệp/người nộp thuế.',
    escalationTrigger: 'Nhiều cơ quan báo chí lớn cùng đăng bài phản ánh tiêu cực, xuất hiện kiến nghị tập thể của các hiệp hội doanh nghiệp, hoặc phát hiện độ vênh lớn giữa chỉ đạo và kết quả.',
    themeColor: {
      bg: 'bg-amber-950/20 dark:bg-amber-950/30',
      border: 'border-amber-500/40',
      text: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-600 text-white',
      accent: 'text-amber-500'
    },
    sops: [
      {
        id: 'sop-3.1',
        step: 'SOP-3.1',
        actionTitle: 'Kích hoạt Tổ phản ứng nhanh Truyền thông (Rapid Action Team)',
        description: 'Họp giao ban trực tuyến giữa Văn phòng Bộ và đơn vị chuyên môn để rà soát nguyên nhân, số liệu thực tế và luận điểm phản biện.',
        responsibleRole: 'Trưởng ban Truyền thông Văn phòng Bộ',
        timeline: 'Trong vòng 2h - 4h',
        requiredOutput: 'Bản Đánh giá nhanh tình hình & Phương án phát ngôn',
        isMandatory: true
      },
      {
        id: 'sop-3.2',
        step: 'SOP-3.2',
        actionTitle: 'Minh bạch hóa Số liệu Thực thi (Fact-Sheet)',
        description: 'Lập bảng số liệu đối soát chính thức (tiến độ giải ngân, số liệu thu/hoàn thuế, tình trạng giải quyết hồ sơ) để chứng minh nguyên nhân khách quan.',
        responsibleRole: 'Đơn vị quản lý nghiệp vụ (KBNN, Cục Thuế, Tổng cục Hải quan...)',
        timeline: 'Trong vòng 4h - 6h',
        requiredOutput: 'Bản Fact-Sheet dữ liệu minh bạch',
        isMandatory: true
      },
      {
        id: 'sop-3.3',
        step: 'SOP-3.3',
        actionTitle: 'Chủ động Cung cấp Thông tin cho Phóng viên Kinh tế',
        description: 'Gửi tài liệu giải thích cơ chế, bài phân tích chuyên gia cho các báo nòng cốt (Đầu tư, Thời báo Tài chính, Tuổi Trẻ, VnExpress...) để định hướng khách quan.',
        responsibleRole: 'Bộ phận Báo chí Văn phòng Bộ',
        timeline: 'Trong vòng 6h',
        requiredOutput: 'Gói tài liệu báo chí (Press Briefing Kit)',
        isMandatory: true
      },
      {
        id: 'sop-3.4',
        step: 'SOP-3.4',
        actionTitle: 'Đối thoại Trực tiếp với Đại diện Hiệp Hội / Doanh nghiệp',
        description: 'Tổ chức buổi làm việc hoặc gọi điện trực tiếp với các hiệp hội phát sinh vướng mắc để lắng nghe kiến nghị và giải tỏa hiểu lầm chính sách.',
        responsibleRole: 'Lãnh đạo Vụ/Cục chuyên môn',
        timeline: 'Trong vòng 12h',
        requiredOutput: 'Biên bản thống nhất phương án tháo gỡ',
        isMandatory: false
      },
      {
        id: 'sop-3.5',
        step: 'SOP-3.5',
        actionTitle: 'Giám sát Đo lường Độ dịu Lắng sau 12h',
        description: 'Theo dõi chỉ số sắc thái (Sentiment) và tần suất tin bài mới trên mạng xã hội để kịp thời bổ sung biện pháp nếu mức độ quan tâm chưa giảm.',
        responsibleRole: 'Bộ phận Social Listening & Phân tích Dữ liệu',
        timeline: 'Liên tục trong 24h tiếp theo',
        requiredOutput: 'Báo cáo Đo lường Tác động Sau can thiệp',
        isMandatory: true
      }
    ]
  },
  EARLY: {
    levelKey: 'EARLY',
    badgeLabel: 'CẤP 2: CẢNH BÁO SỚM',
    viLabel: 'Cảnh Báo Sớm (Early Warning)',
    scoreRange: '40 – 59 điểm (Cấp phòng ngừa quan trọng nhất)',
    slaTiming: 'Trong vòng 24h (Quy trình 7 bước SOP-2)',
    leadUnit: 'Cục/Vụ chuyên môn Bộ Tài chính chủ trì (34 đơn vị NĐ 376)',
    strategicObjective: '«Nếu không xử lý, chuyện này có thể trở thành vấn đề.» Cấp độ phòng ngừa quan trọng nhất. Cùng một vướng mắc thủ tục nhưng nhiều địa phương/doanh nghiệp liên tục hỏi đi hỏi lại; xuất hiện các bài phân tích sâu về điểm nghẽn thực thi chính sách. Cần làm việc ngay với Cục/Vụ chuyên môn, hoàn thiện ngân hàng Q&A và soạn bài hướng dẫn nghiệp vụ.',
    escalationTrigger: 'Cùng một vướng mắc thủ tục nhưng nhiều địa phương/doanh nghiệp liên tục hỏi đi hỏi lại; xuất hiện các bài phân tích sâu về điểm nghẽn thực thi chính sách.',
    themeColor: {
      bg: 'bg-amber-950/20 dark:bg-amber-950/30',
      border: 'border-amber-500/40',
      text: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-600 text-white',
      accent: 'text-amber-500'
    },
    sops: [
      {
        id: 'sop-2.1',
        step: 'SOP-2.1',
        actionTitle: 'Nhận diện Bản chất & Phân loại Vướng mắc (Tín hiệu yếu)',
        description: 'Bóc tách xem vướng mắc do "Độ phức tạp của quy trình", "Lỗi hạ tầng công nghệ", hay "Thiếu hụt tài liệu hướng dẫn trực quan".',
        responsibleRole: 'Chuyên viên thụ lý & Tổ nghiên cứu nghiệp vụ Vụ/Cục',
        timeline: '0h - 4h',
        requiredOutput: 'Phiếu Nhận diện Bản chất Rủi ro',
        isMandatory: true
      },
      {
        id: 'sop-2.2',
        step: 'SOP-2.2',
        actionTitle: 'Rà soát Cơ sở Pháp lý & Thẩm quyền Quy định',
        description: 'Kiểm tra căn cứ Luật, Nghị định, Thông tư liên quan để khẳng định tính chuẩn mực của chính sách, đồng thời tìm điểm nghẽn thực thi.',
        responsibleRole: 'Vụ Pháp chế / Phòng Pháp chế Cục chuyên ngành',
        timeline: '4h - 8h',
        requiredOutput: 'Bản Tổng hợp Cơ sở Pháp lý chuẩn hóa',
        isMandatory: true
      },
      {
        id: 'sop-2.3',
        step: 'SOP-2.3',
        actionTitle: 'Đánh giá Độ nhạy cảm & Đối tượng Chịu tác động',
        description: 'Xác định rõ nhóm đối tượng (Hộ kinh doanh nhỏ lẻ, tiểu thương, doanh nghiệp FDI, nhà đầu tư) và mức độ tổn hại nếu kéo dài.',
        responsibleRole: 'Tổ công tác chuyên trách',
        timeline: '8h - 12h',
        requiredOutput: 'Bản Đánh giá Tác động Nhóm đối tượng',
        isMandatory: true
      },
      {
        id: 'sop-2.4',
        step: 'SOP-2.4',
        actionTitle: 'Soạn thảo Thông điệp Giải thích Dễ hiểu (Infographic / Q&A)',
        description: 'Chuyển hóa ngôn ngữ pháp lý sang ngôn ngữ đời thường, hướng dẫn cầm tay chỉ việc dưới dạng infographic hoặc câu hỏi đáp ngắn.',
        responsibleRole: 'Tổ truyền thông Vụ/Cục',
        timeline: '12h - 16h',
        requiredOutput: 'Bộ cẩm nang Q&A / Infographic hướng dẫn',
        isMandatory: true
      },
      {
        id: 'sop-2.5',
        step: 'SOP-2.5',
        actionTitle: 'Trình Lãnh đạo Đơn vị Phê duyệt Khung Phát ngôn',
        description: 'Trình duyệt văn bản hướng dẫn xử lý hoặc bài giải thích gửi Cổng TTĐT và cơ quan báo chí ngành Tài chính.',
        responsibleRole: 'Lãnh đạo Vụ/Cục chuyên môn',
        timeline: '16h - 20h',
        requiredOutput: 'Tờ trình phê duyệt khung phát ngôn',
        isMandatory: true
      },
      {
        id: 'sop-2.6',
        step: 'SOP-2.6',
        actionTitle: 'Phối hợp với Kênh Báo chí & Kênh Đối thoại Doanh nghiệp',
        description: 'Đăng tải nội dung làm rõ trên Cổng TTĐT, mạng xã hội chính thống và gửi cho phóng viên chuyên trách.',
        responsibleRole: 'Bộ phận Thông tin Tuyên truyền',
        timeline: '20h - 24h',
        requiredOutput: 'Bài viết/Bản tin tuyên truyền chính thức',
        isMandatory: true
      },
      {
        id: 'sop-2.7',
        step: 'SOP-2.7',
        actionTitle: 'Lập Bộ Lọc Theo Dõi Liên Tục Diễn Biến Trong 48h',
        description: 'Cài đặt từ khóa theo dõi trên hệ thống AI Social Listening để đảm bảo dư luận đã hiểu đúng và không xuất hiện biến thể tiêu cực.',
        responsibleRole: 'Hệ thống FinPulse AI Listening',
        timeline: '24h - 72h',
        requiredOutput: 'Báo cáo Giám sát Hậu kiểm 48h',
        isMandatory: true
      }
    ]
  },
  DISTANT: {
    levelKey: 'DISTANT',
    badgeLabel: 'CẤP 1: CẢNH BÁO XA',
    viLabel: 'Cảnh Báo Xa (Early Horizon)',
    scoreRange: '20 – 39 điểm',
    slaTiming: 'Theo dõi tự động • Lập Q&A nội bộ • Không lên tiếng vội vã',
    leadUnit: 'Trung tâm Thông tin Dữ liệu & Phòng Phân tích Nghiệp vụ, Vụ Pháp chế',
    strategicObjective: 'Tín hiệu yếu (Weak signals). Một chính sách mới ban hành; xuất hiện các câu hỏi thăm dò; chuyên gia bắt đầu bình luận phân tích; báo chí đưa tin trích dẫn nguyên văn với thái độ trung tính. Đưa vào danh sách giám sát tự động; tổng hợp các băn khoăn ban đầu để lập sẵn bộ Hỏi - Đáp nội bộ (Internal Q&A); chuẩn bị sẵn thông điệp định hướng; không lên tiếng vội vã trên báo chí để tránh thu hút sự chú ý không cần thiết.',
    escalationTrigger: 'Một chính sách mới ban hành; xuất hiện các câu hỏi thăm dò; chuyên gia bắt đầu bình luận phân tích; báo chí đưa tin trích dẫn nguyên văn với thái độ trung tính.',
    themeColor: {
      bg: 'bg-sky-950/20 dark:bg-sky-950/30',
      border: 'border-sky-500/40',
      text: 'text-sky-600 dark:text-sky-400',
      badge: 'bg-sky-600 text-white',
      accent: 'text-sky-500'
    },
    sops: [
      {
        id: 'sop-1.1',
        step: 'SOP-1.1',
        actionTitle: 'Đưa vào Danh mục Theo dõi Chủ động (Active Horizon Watchlist)',
        description: 'Gắn thẻ sự kiện để hệ thống AI tự động gom cụm các bài viết cùng chủ đề trong nước và quốc tế.',
        responsibleRole: 'Chuyên viên Phân tích Dữ liệu',
        timeline: 'Trong vòng 24h',
        requiredOutput: 'Thẻ giám sát chủ đề chuyên biệt',
        isMandatory: true
      },
      {
        id: 'sop-1.2',
        step: 'SOP-1.2',
        actionTitle: 'Thu thập Thực tiễn Quốc tế & Khung Sandbox Tương đồng',
        description: 'Nghiên cứu kinh nghiệm quản lý của các nước OECD, ASEAN đối với vấn đề mới để làm tư liệu tham khảo cho Vụ/Cục.',
        responsibleRole: 'Tổ nghiên cứu Tổng hợp',
        timeline: 'Trong vòng 48h',
        requiredOutput: 'Báo cáo Tổng hợp Kinh nghiệm Quốc tế',
        isMandatory: false
      },
      {
        id: 'sop-1.3',
        step: 'SOP-1.3',
        actionTitle: 'Xây dựng Ngân hàng Câu hỏi Q&A Đón đầu Dư luận',
        description: 'Dự thảo trước các câu hỏi mà thị trường hoặc báo chí có thể đặt ra khi chính sách được ban hành chính thức.',
        responsibleRole: 'Phòng Pháp chế / Nghiệp vụ',
        timeline: 'Trong vòng 72h',
        requiredOutput: 'Ngân hàng Q&A dự phòng nội bộ',
        isMandatory: false
      },
      {
        id: 'sop-1.4',
        step: 'SOP-1.4',
        actionTitle: 'Định kỳ Tổng hợp vào Báo cáo Tuần gửi Lãnh đạo',
        description: 'Đưa tóm tắt diễn biến vào Bản tin Phân tích Xu hướng Tuần của Bộ Tài chính để Lãnh đạo nắm trước bức tranh toàn cảnh.',
        responsibleRole: 'Văn phòng Bộ Tài chính',
        timeline: 'Định kỳ Thứ Sáu hàng tuần',
        requiredOutput: 'Mục Xu hướng trong Bản tin Tuần',
        isMandatory: true
      }
    ]
  },
  STANDARD: {
    levelKey: 'STANDARD',
    badgeLabel: 'GIÁM SÁT THÔNG THƯỜNG',
    viLabel: 'Giám sát Thường nhật',
    scoreRange: '0 – 19 điểm',
    slaTiming: 'Theo dõi định kỳ',
    leadUnit: 'Bộ phận Giám sát Thường nhật',
    strategicObjective: 'Lưu trữ thông tin thường nhật, theo dõi định kỳ biến động bình thường.',
    escalationTrigger: 'Không có dấu hiệu bất thường.',
    themeColor: {
      bg: 'bg-slate-900/10 dark:bg-slate-900/40',
      border: 'border-slate-300 dark:border-slate-800',
      text: 'text-slate-600 dark:text-slate-400',
      badge: 'bg-slate-600 text-white',
      accent: 'text-slate-400'
    },
    sops: [
      {
        id: 'sop-0.1',
        step: 'SOP-0.1',
        actionTitle: 'Lưu trữ Hồ sơ Dữ liệu Hệ thống',
        description: 'Tự động lập chỉ mục và lưu trữ vào kho dữ liệu phục vụ tra cứu hồi tố khi cần.',
        responsibleRole: 'Hệ thống tự động',
        timeline: 'Tự động',
        requiredOutput: 'Bản ghi cơ sở dữ liệu',
        isMandatory: true
      }
    ]
  },
  MARKET_DIGEST: {
    levelKey: 'MARKET_DIGEST',
    badgeLabel: 'ĐIỂM TIN THỊ TRƯỜNG',
    viLabel: 'Điểm Tin Thị Trường Thuần Túy',
    scoreRange: '0 – 10 điểm',
    slaTiming: 'Điểm tin tham khảo - Không cảnh báo',
    leadUnit: 'Bộ phận Bản tin Thị trường Khách quan',
    strategicObjective: 'Ghi nhận số liệu VN-Index, giao dịch cổ phiếu phục vụ tổng hợp thông tin, không kích hoạt quy trình can thiệp.',
    escalationTrigger: 'Không có - Biến động thị trường thuần túy khách quan.',
    themeColor: {
      bg: 'bg-slate-500/10 dark:bg-slate-800/40',
      border: 'border-slate-300 dark:border-slate-700',
      text: 'text-slate-600 dark:text-slate-400',
      badge: 'bg-slate-500 text-white',
      accent: 'text-slate-400'
    },
    sops: [
      {
        id: 'sop-md.1',
        step: 'SOP-MD.1',
        actionTitle: 'Ghi nhận Điểm tin Thị trường Tham khảo',
        description: 'Tự động đưa vào mục Điểm tin Thị trường trong báo cáo ngày, không kích hoạt quy trình phát ngôn hay can thiệp.',
        responsibleRole: 'Hệ thống tự động',
        timeline: 'Thời gian thực',
        requiredOutput: 'Mục Điểm tin Thị trường',
        isMandatory: false
      }
    ]
  }
};

export const CrisisResponseStrategyModule: React.FC<CrisisResponseStrategyModuleProps> = ({
  item,
  onDraftStatement,
  onPolicySubmission,
  onGmailAlert,
  onOpenAdvisorChatbot
}) => {
  const { isDark } = useTheme();
  const model: WarningPipelineModel = item.warningPipeline || generateWarningPipelineModel(item);
  
  // Detect current active level based on calculated risk or fallback
  const calculatedLevel = model.level3Action.alertLevel || 'EARLY';
  const [selectedLevel, setSelectedLevel] = useState<WarningAlertLevelType>(calculatedLevel);
  const [completedSopIds, setCompletedSopIds] = useState<Record<string, boolean>>({});
  const [copiedSopPlan, setCopiedSopPlan] = useState(false);
  const [expandedSopId, setExpandedSopId] = useState<string | null>(null);

  const activeTaxonomy = CRISIS_RESPONSE_TAXONOMY_SOPS[selectedLevel] || CRISIS_RESPONSE_TAXONOMY_SOPS.EARLY;
  const isMatchCurrentArticle = selectedLevel === calculatedLevel;

  const [showComparison, setShowComparison] = useState(false);
  const [showBenchmarkScenarios, setShowBenchmarkScenarios] = useState(false);
  const [activeBenchmarkId, setActiveBenchmarkId] = useState<string | null>(null);

  const toggleSopStatus = (id: string) => {
    setCompletedSopIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyFullSOPPlan = () => {
    const text = `[KẾ HOẠCH PHẢN ỨNG KHỦNG HOẢNG TRUYỀN THÔNG - MOF RESPONSE SOP]\n` +
      `Sự vụ: ${item.title}\n` +
      `Lĩnh vực: ${item.sectorNameVi || 'Tài chính - Ngân sách'}\n` +
      `Cấp độ kích hoạt: ${activeTaxonomy.badgeLabel} (${activeTaxonomy.scoreRange})\n` +
      `Thời hạn hoàn tất (SLA): ${activeTaxonomy.slaTiming}\n` +
      `Đơn vị chủ trì: ${activeTaxonomy.leadUnit}\n` +
      `Mục tiêu chiến lược: ${activeTaxonomy.strategicObjective}\n\n` +
      `DANH MỤC CÁC BƯỚC THỰC THI CHUẨN (SOP CHECKLIST):\n` +
      activeTaxonomy.sops.map((sop, idx) => 
        `${idx + 1}. [${completedSopIds[sop.id] ? 'ĐÃ HOÀN TẤT' : 'CHỜ THỰC HIỆN'}] ${sop.step}: ${sop.actionTitle}\n` +
        `   - Chi tiết: ${sop.description}\n` +
        `   - Trách nhiệm: ${sop.responsibleRole}\n` +
        `   - Thời hạn: ${sop.timeline}\n` +
        `   - Sản phẩm bắt buộc: ${sop.requiredOutput}`
      ).join('\n\n') +
      `\n\nNguồn phát sinh: ${item.source} • FinPulse MOF Executive System.`;

    navigator.clipboard.writeText(text);
    setCopiedSopPlan(true);
    setTimeout(() => setCopiedSopPlan(false), 2500);
  };

  const getAlertLevelIcon = (lvl: WarningAlertLevelType) => {
    switch (lvl) {
      case 'EMERGENCY':
        return <Flame className="w-4 h-4 text-rose-500 animate-pulse" />;
      case 'RAPID':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'EARLY':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'DISTANT':
      default:
        return <Activity className="w-4 h-4 text-indigo-400" />;
    }
  };

  const completedCount = activeTaxonomy.sops.filter(s => completedSopIds[s.id]).length;
  const progressPercent = Math.round((completedCount / activeTaxonomy.sops.length) * 100);

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 shadow-sm transition-all ${
      isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* 1. MODULE HEADER & STRATEGIC CONTEXT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border ${
            isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-sm sm:text-base font-black uppercase tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Chiến Lược Ứng Phó & SOP Xử Lý Khủng Hoảng Truyền Thông
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                MOF 4-Tier Crisis SOP
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bản đồ quy trình tác chiến chuẩn hóa theo 4 cấp độ cảnh báo rủi ro thể chế
            </p>
          </div>
        </div>

        {/* TOOLBAR BUTTONS */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => {
              setShowComparison(!showComparison);
              if (!showComparison) setShowBenchmarkScenarios(false);
            }}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              showComparison
                ? 'bg-indigo-600 text-white border-indigo-500'
                : isDark
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
            title="Xem bảng phân định ranh giới Sắc thái (Cũ) và Rủi ro Khủng hoảng (Mới)"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Mô Hình Cũ vs Mới</span>
          </button>

          <button
            onClick={() => {
              setShowBenchmarkScenarios(!showBenchmarkScenarios);
              if (!showBenchmarkScenarios) setShowComparison(false);
            }}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              showBenchmarkScenarios
                ? 'bg-purple-600 text-white border-purple-500'
                : isDark
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
            title="Diễn tập 3 Kịch bản Thực tiễn Điển hình ngành Tài chính"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>3 Kịch Bản Thực Tiễn</span>
          </button>

          <button
            onClick={handleCopyFullSOPPlan}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
          >
            {copiedSopPlan ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Đã sao chép SOP</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                <span>Xuất Bản Kế Hoạch SOP</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* EXPANDABLE SECTION: METHODOLOGY COMPARISON (CŨ VS MỚI) */}
      {showComparison && (
        <div className={`p-4 rounded-2xl border space-y-3 animate-fadeIn ${
          isDark ? 'bg-slate-950/90 border-indigo-500/40 text-slate-200' : 'bg-indigo-50/50 border-indigo-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-black uppercase text-indigo-400">
                Bản Chất Sự Khác Biệt Giữa "Sắc Thái" (Mô Hình Cũ) Và "Rủi Ro Khủng Hoảng" (Mô Hình Mới)
              </h4>
            </div>
            <button
              onClick={() => setShowComparison(false)}
              className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              ✕ Đóng
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                  <th className="py-2 px-3 font-bold w-1/4">Khía Cạnh Đánh Giá</th>
                  <th className="py-2 px-3 font-bold w-3/8 text-rose-500 dark:text-rose-400">Đánh Giá Sắc Thái (Mô Hình Cũ)</th>
                  <th className="py-2 px-3 font-bold w-3/8 text-emerald-600 dark:text-emerald-400">Đánh Giá Nguy Cơ Rủi Ro (Mô Hình Mới)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-300">Bản chất đo lường</td>
                  <td className="py-2.5 px-3 text-slate-400">Đếm từ khóa khen/chê, tính điểm tích cực hay tiêu cực của câu chữ thuần túy.</td>
                  <td className="py-2.5 px-3 font-medium text-emerald-400 dark:text-emerald-300">Phân tích tác động chính sách, tổn hại thể chế và phản ứng dây chuyền xã hội.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-300">Trường hợp bài viết tiêu cực</td>
                  <td className="py-2.5 px-3 text-rose-400">Báo động ngay lập tức (dù chỉ là vụ xử phạt vi phạm hóa đơn nhỏ lẻ cá nhân).</td>
                  <td className="py-2.5 px-3 text-emerald-400 dark:text-emerald-300">Đánh giá rủi ro thấp (Giám sát thường quy), vì đây là nghiệp vụ cưỡng chế pháp luật định kỳ, xã hội đồng thuận.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-300">Trường hợp bài viết trung tính</td>
                  <td className="py-2.5 px-3 text-slate-400">Bỏ qua vì không thấy từ ngữ mang tính chỉ trích.</td>
                  <td className="py-2.5 px-3 text-amber-400 dark:text-amber-300">Nhận diện mầm mống rủi ro nếu chạm tới nghĩa vụ của hàng triệu người nộp thuế (I = 1.0) hoặc vướng mắc thủ tục lặp lại.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-300">Trường hợp bài viết tích cực</td>
                  <td className="py-2.5 px-3 text-slate-400">Ghi nhận kết quả tốt, đóng hồ sơ theo dõi.</td>
                  <td className="py-2.5 px-3 text-rose-400 dark:text-rose-300">Cảnh báo ngay nếu số liệu thực tế mâu thuẫn trực tiếp với thông điệp chỉ đạo (Narrative-Reality Divergence: D = 18).</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-300">Hành động đề xuất</td>
                  <td className="py-2.5 px-3 text-slate-400">Lập biểu đồ tỷ lệ % khen/chê thuần túy mô tả.</td>
                  <td className="py-2.5 px-3 text-indigo-400 dark:text-indigo-300">Kích hoạt kịch bản hành động SOP cụ thể cho từng Cục/Vụ phụ trách theo 4 cấp độ cảnh báo.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EXPANDABLE SECTION: 3 BENCHMARK SCENARIOS (KỊCH BẢN THỰC TIỄN) */}
      {showBenchmarkScenarios && (
        <div className={`p-4 rounded-2xl border space-y-3.5 animate-fadeIn ${
          isDark ? 'bg-slate-950/90 border-purple-500/40' : 'bg-purple-50/50 border-purple-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <div>
                <h4 className="text-xs font-black uppercase text-purple-400">
                  Minh Họa 3 Kịch Bản Thực Tiễn Của Ngành Tài Chính (Báo Cáo Chuyên Đề)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Nhấp vào từng kịch bản để xem phân tích 3 tầng dữ liệu và công thức lượng hóa thực tế
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBenchmarkScenarios(false)}
              className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              ✕ Đóng
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {FEW_SHOT_TEST_CASES.filter(c => ['test_case_1_household_tax', 'test_case_2_ai_algorithmic_trading', 'test_case_3_public_investment_divergence'].includes(c.id)).map((tc, idx) => {
              const isSelected = activeBenchmarkId === tc.id;
              return (
                <div
                  key={tc.id}
                  onClick={() => {
                    setActiveBenchmarkId(isSelected ? null : tc.id);
                    setSelectedLevel(tc.expectedLevel);
                  }}
                  className={`p-3.5 rounded-xl border text-xs space-y-2 cursor-pointer transition ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30'
                      : isDark
                      ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/20 text-purple-300">
                      Tình huống {idx + 1}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-amber-400">
                      {tc.expectedScoreRange}
                    </span>
                  </div>

                  <h5 className="font-bold text-slate-100 line-clamp-2">
                    {tc.scenarioName.split(': ')[1] || tc.scenarioName}
                  </h5>

                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {tc.rawInputSnippet}
                  </p>

                  <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">{tc.expectedTier1.split('. ')[0]}</span>
                    <span className="text-purple-300 font-bold flex items-center gap-1">
                      <span>Xem SOP {tc.expectedLevel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>

                  {isSelected && (
                    <div className="pt-2 border-t border-purple-500/30 space-y-2 text-[11px] text-slate-300">
                      <div className="p-2 rounded bg-purple-950/30 border border-purple-500/20 text-[10px] font-mono text-amber-300">
                        {tc.expectedTier3}
                      </div>
                      <p className="leading-relaxed text-slate-300">
                        {tc.benchmarkAnalysis}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. 4-LEVEL TAXONOMY SWITCHER TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(['DISTANT', 'EARLY', 'RAPID', 'EMERGENCY'] as WarningAlertLevelType[]).map((lvl) => {
          const tax = CRISIS_RESPONSE_TAXONOMY_SOPS[lvl];
          const isSelected = selectedLevel === lvl;
          const isArticleCalculated = calculatedLevel === lvl;

          return (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer flex flex-col justify-between gap-1.5 ${
                isSelected
                  ? isDark
                    ? 'bg-slate-800 border-slate-600 shadow-md ring-2 ring-indigo-500/40'
                    : 'bg-slate-50 border-slate-400 shadow-md ring-2 ring-indigo-500/30'
                  : isDark
                  ? 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs font-black">
                  {getAlertLevelIcon(lvl)}
                  <span className={tax.themeColor.text}>{tax.levelKey}</span>
                </span>
                {isArticleCalculated && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500 text-white">
                    Hiện tại
                  </span>
                )}
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                  {tax.viLabel.split(' (')[0]}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {tax.scoreRange}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. ACTIVE TAXONOMY OVERVIEW BANNER */}
      <div className={`p-4 rounded-2xl border space-y-2.5 ${activeTaxonomy.themeColor.bg} ${activeTaxonomy.themeColor.border}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase shadow-xs ${activeTaxonomy.themeColor.badge}`}>
              {activeTaxonomy.badgeLabel}
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Điểm rủi ro: <strong className="font-mono text-amber-500 dark:text-amber-400">{activeTaxonomy.scoreRange}</strong>
            </span>
            {isMatchCurrentArticle ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Khớp tính toán bài viết ({model.level2Risk.riskScore}đ)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-400 italic">
                (Đang xem mô phỏng cấp {selectedLevel})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Thời hạn xử lý (SLA): <strong className="text-amber-500 dark:text-amber-400">{activeTaxonomy.slaTiming}</strong></span>
          </div>
        </div>

        {/* Strategic Target & Lead Unit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
          <div className="flex items-start gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <span>Đơn vị chủ trì: <strong className="text-slate-800 dark:text-slate-200 font-bold">{activeTaxonomy.leadUnit}</strong></span>
          </div>
          <div className="flex items-start gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>Mục tiêu: <span className="text-slate-700 dark:text-slate-300">{activeTaxonomy.strategicObjective}</span></span>
          </div>
        </div>

        {/* Narrative-Reality Divergence Alert if present */}
        {model.narrativeDivergence?.detected && isMatchCurrentArticle && (
          <div className="p-2.5 rounded-xl border border-rose-500/40 bg-rose-950/30 text-xs flex items-start gap-2 text-rose-200 mt-2">
            <GitCompare className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block text-rose-300">Cảnh báo Độ vênh Chỉ đạo & Thực tiễn:</strong>
              <span>{model.narrativeDivergence.details} — SOP ưu tiên làm rõ số liệu thực tế tại hiện trường trong vòng 6h.</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. INTERACTIVE SOP PLAYBOOK CHECKLIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Quy Trình Tác Chiến Chuẩn (Standard Operating Procedures - {activeTaxonomy.sops.length} Bước)
            </h4>
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Tiến độ hoàn thành: <strong className="text-emerald-500 dark:text-emerald-400">{completedCount}/{activeTaxonomy.sops.length}</strong> ({progressPercent}%)
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* SOP Items List */}
        <div className="space-y-2.5">
          {activeTaxonomy.sops.map((sop, idx) => {
            const isCompleted = !!completedSopIds[sop.id];
            const isExpanded = expandedSopId === sop.id;

            return (
              <div
                key={sop.id}
                className={`rounded-xl border transition-all ${
                  isCompleted
                    ? (isDark ? 'bg-emerald-950/15 border-emerald-500/30' : 'bg-emerald-50/70 border-emerald-200')
                    : (isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200')
                }`}
              >
                <div className="p-3 sm:p-3.5 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    {/* Checkbox trigger */}
                    <button
                      onClick={() => toggleSopStatus(sop.id)}
                      className={`mt-0.5 p-1 rounded-lg border transition cursor-pointer shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : isDark
                          ? 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'
                          : 'bg-white border-slate-300 text-slate-400 hover:border-slate-400'
                      }`}
                      title={isCompleted ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-black font-mono ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isDark
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {sop.step}
                        </span>

                        <h5 className={`text-xs sm:text-sm font-bold leading-snug ${
                          isCompleted
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : isDark
                            ? 'text-slate-100'
                            : 'text-slate-900'
                        }`}>
                          {sop.actionTitle}
                        </h5>

                        {sop.isMandatory && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            Bắt buộc
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {sop.description}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 flex-wrap">
                        <span>Trách nhiệm: <strong className="text-indigo-400">{sop.responsibleRole}</strong></span>
                        <span>•</span>
                        <span>Thời hạn: <strong className="text-amber-400">{sop.timeline}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedSopId(isExpanded ? null : sop.id)}
                    className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer shrink-0"
                    title="Xem sản phẩm bắt buộc"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-200 dark:border-slate-800/80 text-xs space-y-2">
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 space-y-1">
                      <div className="font-bold text-amber-300 flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Sản phẩm nghiệm thu bắt buộc (Deliverable):</span>
                      </div>
                      <div className="font-mono text-emerald-400 text-xs">
                        {sop.requiredOutput}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. INSTANT ACTION EXECUTION DISPATCHER */}
      <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 flex-wrap ${
        isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Hành động tác chiến nhanh theo SOP cấp <strong>{selectedLevel}</strong>:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onGmailAlert && (
            <button
              onClick={() => onGmailAlert(item)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? 'bg-rose-950/50 hover:bg-rose-900/70 border-rose-800 text-rose-200'
                  : 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-rose-400" />
              <span>Bắn Gmail Báo Cáo Khẩn</span>
            </button>
          )}

          {onDraftStatement && (
            <button
              onClick={() => onDraftStatement(item)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? 'bg-emerald-950/50 hover:bg-emerald-900/70 border-emerald-800 text-emerald-200'
                  : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>Soạn Phát Ngôn Theo SOP</span>
            </button>
          )}

          {onPolicySubmission && (
            <button
              onClick={() => onPolicySubmission(item)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? 'bg-amber-950/50 hover:bg-amber-900/70 border-amber-800 text-amber-200'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Lập Tờ Trình Lãnh Đạo</span>
            </button>
          )}

          {onOpenAdvisorChatbot && (
            <button
              onClick={() => onOpenAdvisorChatbot(item)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? 'bg-indigo-950/50 hover:bg-indigo-900/70 border-indigo-800 text-indigo-200'
                  : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cố Vấn Tác Chiến AI</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
