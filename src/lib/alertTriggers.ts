import { AlertTriggerRule, AlertIgnoreRule, ScrapedNewsItem, ActiveAlertNotification, WarningAlertLevelType, formatNewsFullDateTime } from '../types';
import {
  generateWarningPipelineModel,
  isRoutineLegalPromulgationOrGovernance,
  isPureMarketDynamics,
  classifyArticleUrgency,
  isGenuinePolicyOrSocialRisk,
  UrgencyClassificationResult,
  UrgencyCategory,
} from './warningPipelineEngine';
import { isMinistryAuthorityProposal, isFinancialInfrastructureOrBusinessUpdate, isRoutineFinancialMarketRoundup } from './newsClassification';

export { classifyArticleUrgency, isGenuinePolicyOrSocialRisk };
export type { UrgencyClassificationResult, UrgencyCategory };
import {
  saveAlertThresholdConfigToCloud,
  saveAlertTriggerRulesToCloud,
  saveAlertIgnoreListToCloud,
  saveAdvancedSystemLoadConfigToCloud,
  saveSimulationScenariosToCloud,
  deleteSimulationScenarioFromCloud,
  saveSimulationScenarioItemToCloud,
  logSimulationExecutionToCloud,
} from './firebase';

const STORAGE_KEY = 'finpulse_alert_triggers_v1';

// ============================================================================
// BẢNG CẤU HÌNH NGƯỠNG CẢNH BÁO TỰ ĐỘNG (ALERT THRESHOLD CONFIG)
// Phân loại 5 cấp độ từ Cảnh báo Từ xa đến Cảnh báo Khẩn cấp
// Dựa trên thuật toán 7 bước (Signal → Context → Risk → Velocity → Impact → Escalation → Alert)
// ============================================================================

export interface EarlyWarningActionItem {
  id: string;
  order: number;
  label: string;
  actionText: string;
  detail: string;
  iconName: string;
}

export const EARLY_WARNING_7_ACTIONS: EarlyWarningActionItem[] = [
  {
    id: 'verify_info',
    order: 1,
    label: '1. Xác minh thông tin',
    actionText: 'xác minh thông tin',
    detail: 'Kiểm chứng số liệu và dữ liệu thực tế với các Cục, Vụ chuyên môn phụ trách; đối soát tính xác thực của thông tin phản ánh.',
    iconName: 'ShieldCheck',
  },
  {
    id: 'identify_root_cause',
    order: 2,
    label: '2. Xác định nguyên nhân',
    actionText: 'xác định nguyên nhân',
    detail: 'Bóc tách căn nguyên cốt lõi (do quy trình thủ tục thực tế, hiểu sai chính sách, chậm trễ phối hợp hay vướng mắc văn bản).',
    iconName: 'Search',
  },
  {
    id: 'trace_source',
    order: 3,
    label: '3. Tìm nguồn',
    actionText: 'tìm nguồn',
    detail: 'Truy vết nguồn khởi phát thông tin (cơ quan báo chí, nhóm mạng xã hội, diễn đàn chuyên ngành hoặc ý kiến chuyên gia).',
    iconName: 'Compass',
  },
  {
    id: 'prepare_qa',
    order: 4,
    label: '4. Lập Q&A',
    actionText: 'lập Q&A',
    detail: 'Biên soạn ngay bộ câu hỏi và câu trả lời (Q&A) chuẩn mực cho các câu hỏi gai góc mà dư luận và báo chí có thể đặt ra.',
    iconName: 'HelpCircle',
  },
  {
    id: 'prepare_spokesperson',
    order: 5,
    label: '5. Chuẩn bị người phát ngôn',
    actionText: 'chuẩn bị người phát ngôn',
    detail: 'Chỉ định và phân công nhân sự phát ngôn có thẩm quyền của Cục/Vụ phụ trách; chuẩn bị đề cương và kịch bản phát ngôn.',
    iconName: 'Mic',
  },
  {
    id: 'prepare_explanation_article',
    order: 6,
    label: '6. Chuẩn bị bài giải thích',
    actionText: 'chuẩn bị bài giải thích',
    detail: 'Dự thảo sẵn bài viết giải thích cơ chế, infographic hoặc thông cáo báo chí giải trình rõ ràng, dễ hiểu về quy định chính sách.',
    iconName: 'FileText',
  },
  {
    id: 'monitor_24h',
    order: 7,
    label: '7. Theo dõi 24h',
    actionText: 'theo dõi 24h',
    detail: 'Thiết lập chế độ radar theo dõi liên tục 24h để nắm bắt biến động sắc thái và sẵn sàng can thiệp trước khi thành điểm nóng.',
    iconName: 'Clock',
  },
];

export interface AlertThresholdConfigItem {
  level: WarningAlertLevelType; // 'DISTANT' | 'EARLY' | 'RAPID' | 'STANDARD' | 'EMERGENCY'
  priorityLevel: 'critical' | 'high' | 'medium';
  nameVi: string;
  badge: string;
  timing: string;
  minRiskScore: number;
  minCrisisCriteriaCount: number; // 0 đến 4 tiêu chí khủng hoảng
  description: string;
  philosophy?: string; // Triết lý cốt lõi của cấp cảnh báo
  actionPlaybook?: string[]; // 7 bước hành động tác chiến chuẩn mực
  soundEnabled: boolean;
  notifyChannels: ('toast' | 'modal' | 'browser')[];
  standardsCriteria: string[]; // Danh sách tiêu chuẩn kích hoạt cụ thể
  exclusionRules: string[]; // Quy chuẩn loại trừ / Noise Gate / Negation
  scopeDescription: string; // Mô tả phạm vi tin & đối tượng áp dụng
  pollingFrequencySeconds: number; // Độ trễ / Chu kỳ quét tin tự động (giây) nhằm giảm tải hệ thống
  minDomainTrustScore: number; // Ngưỡng tín nhiệm nguồn tin tối thiểu (0-100) để kích hoạt cảnh báo
  autoBlockFakeNewsSuspicious: boolean; // Tự động chặn tin giả, tin rác, clickbait chưa xác thực
}

export type AlertThresholdConfig = Record<WarningAlertLevelType, AlertThresholdConfigItem>;

export interface AdvancedSystemLoadConfig {
  highIntensityMode: boolean; // Chế độ quét cường độ cao có điều tiết độ trễ tự động
  globalMinDomainTrustScore: number; // Ngưỡng lọc tin giả / rác toàn hệ thống (mặc định 40)
  autoFilterSpamAndFakeNews: boolean; // Tự động loại bỏ tin giả và tin rác khỏi bảng tin điều hành
  burstRequestDelayMs: number; // Độ trễ giãn cách giữa các lượt quét batch (ms) để bảo vệ server
  enableAdaptiveThrottling?: boolean; // Tự động giãn cách chu kỳ khi môi trường yên tĩnh
  autoBlockUnverifiedSpam?: boolean; // Tự động chặn tin giả và tin rác chưa xác minh
}

export const DEFAULT_ADVANCED_LOAD_CONFIG: AdvancedSystemLoadConfig = {
  highIntensityMode: true,
  globalMinDomainTrustScore: 40,
  autoFilterSpamAndFakeNews: true,
  burstRequestDelayMs: 450,
  enableAdaptiveThrottling: true,
  autoBlockUnverifiedSpam: true,
};

export const STORAGE_KEY_ADVANCED_LOAD = 'finpulse_advanced_load_config_v1';

export function loadAdvancedSystemLoadConfig(): AdvancedSystemLoadConfig {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return DEFAULT_ADVANCED_LOAD_CONFIG;
    }
    const raw = localStorage.getItem(STORAGE_KEY_ADVANCED_LOAD);
    if (!raw) return DEFAULT_ADVANCED_LOAD_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_ADVANCED_LOAD_CONFIG, ...parsed };
  } catch (e) {
    return DEFAULT_ADVANCED_LOAD_CONFIG;
  }
}

export function saveAdvancedSystemLoadConfig(config: AdvancedSystemLoadConfig): void {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_ADVANCED_LOAD, JSON.stringify(config));
    // Asynchronously synchronize with Cloud Firestore
    saveAdvancedSystemLoadConfigToCloud(config).catch((err) => {
      console.warn('Silent cloud sync for advanced system load config failed (cached locally):', err);
    });
  } catch (e) {
    console.error('Error saving advanced load config:', e);
  }
}

export function resetAdvancedSystemLoadConfig(): AdvancedSystemLoadConfig {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ADVANCED_LOAD, JSON.stringify(DEFAULT_ADVANCED_LOAD_CONFIG));
    }
    // Asynchronously synchronize reset to Cloud Firestore
    saveAdvancedSystemLoadConfigToCloud(DEFAULT_ADVANCED_LOAD_CONFIG).catch((err) => {
      console.warn('Silent cloud sync for reset advanced system load config failed:', err);
    });
    return DEFAULT_ADVANCED_LOAD_CONFIG;
  } catch (e) {
    return DEFAULT_ADVANCED_LOAD_CONFIG;
  }
}

export const ALERT_THRESHOLD_CONFIG: AlertThresholdConfig = {
  EMERGENCY: {
    level: 'EMERGENCY',
    priorityLevel: 'critical',
    nameVi: 'Cảnh báo Khẩn cấp — Emergency Alert (75–100)',
    badge: '🚨 CẢNH BÁO KHẨN CẤP',
    timing: 'Kích hoạt nhóm phản ứng truyền thông ngay lập tức (Không chờ báo cáo ngày, 1 - 2h)',
    minRiskScore: 75,
    minCrisisCriteriaCount: 3,
    pollingFrequencySeconds: 60, // 60s (1 phút) quét dồn dập khi khủng hoảng
    minDomainTrustScore: 75, // Bắt buộc từ nguồn uy tín cao / báo chí lớn
    autoBlockFakeNewsSuspicious: true,
    description: 'Thông tin lan truyền rất nhanh; có thông tin sai nghiêm trọng; liên quan trực tiếp cán bộ lãnh đạo bị khởi tố/bắt giam; đại án tham nhũng; vỡ nợ diện rộng; nhiều báo lớn đồng loạt khai thác; Bộ chưa có phản hồi; câu chuyện đang vượt khỏi phạm vi kiểm soát.',
    soundEnabled: true,
    notifyChannels: ['toast', 'modal', 'browser'],
    standardsCriteria: [
      'Điểm rủi ro tổng hợp đạt từ 75/100 trở lên HOẶC đạt tối thiểu 3/4 tiêu chí khủng hoảng (Tổn hại uy tín, Quy kết trách nhiệm, Kiến nghị, Ảnh hưởng DN).',
      'Đại án hình sự, khởi tố bị can/bắt tạm giam cán bộ ngành Tài chính, gian lận hóa đơn khống quy mô nghìn tỷ.',
      'Sự cố vỡ nợ doanh nghiệp lớn hoặc mất thanh khoản diện rộng có nguy cơ sụp đổ chéo thị trường.',
      'Thông tin sai lệch nghiêm trọng bùng nổ với gia tốc cao (Velocity Spike) trong giờ cao điểm.',
    ],
    exclusionRules: [
      'Tự động loại trừ các đề xuất hoàn thiện thể chế hoặc Bộ chủ động đề xuất bổ sung thẩm quyền khởi tố án thuế.',
      'Tự động loại trừ các phát biểu chỉ đạo của Lãnh đạo có cụm từ quán triệt (như "kiên quyết không buông lỏng", "siết chặt kỷ cương").',
    ],
    scopeDescription: 'Áp dụng cho các biến cố chấn động, sự cố hình sự, vỡ nợ hệ thống đòi hỏi Ban Lãnh đạo Bộ và Nhóm Cơ động phản ứng tức thì trong 1-2h.',
  },
  RAPID: {
    level: 'RAPID',
    priorityLevel: 'high',
    nameVi: 'Cảnh báo Nhanh — Rapid Warning (60–74)',
    badge: '⚡ CẢNH BÁO NHANH',
    timing: 'Phải có đầu mối và phương án xử lý ngay trong ngày (trong 12h)',
    minRiskScore: 60,
    minCrisisCriteriaCount: 2,
    pollingFrequencySeconds: 180, // 180s (3 phút)
    minDomainTrustScore: 65,
    autoBlockFakeNewsSuspicious: true,
    description: 'Nhiều báo chí lớn cùng đưa tin; mạng xã hội thảo luận dồn dập; xuất hiện kiến nghị bức xúc của hiệp hội doanh nghiệp; ách tắc thủ tục thuế/hải quan kéo dài; biến động cực đoan giá vàng hoặc tỷ giá gây áp lực lên ổn định vĩ mô.',
    soundEnabled: true,
    notifyChannels: ['toast', 'modal'],
    standardsCriteria: [
      'Điểm rủi ro tổng hợp đạt 60–74 điểm VÀ có sắc thái tiêu cực hoặc tối thiểu 2/4 tiêu chí rủi ro truyền thông.',
      'Ách tắc nghiêm trọng thủ tục hoàn thuế VAT, ùn ứ thông quan hàng hóa tại cửa khẩu khiến cộng đồng doanh nghiệp phản ứng gay gắt.',
      'Nhiều hiệp hội ngành nghề đồng loạt gửi đơn kiến nghị/kêu cứu về bất cập trong chính sách tài khóa.',
      'Biến động bất thường, chênh lệch giá vàng kỷ lục hoặc sốt tỷ giá USD/VND chợ đen đe dọa cân đối vĩ mô.',
    ],
    exclusionRules: [
      'Không áp dụng cho các tin bài tháo gỡ khó khăn, thông quan thành công, tăng thu ngân sách thường kỳ.',
      'Tự động loại trừ các tin tức đã có phản hồi chính thức hoặc cơ chế xử lý rõ ràng của Bộ.',
    ],
    scopeDescription: 'Áp dụng cho các vấn đề nóng đang lan rộng trên báo chí và mạng xã hội, đòi hỏi các Cục/Vụ chức năng hoàn tất báo cáo tham mưu trong ngày.',
  },
  EARLY: {
    level: 'EARLY',
    priorityLevel: 'medium',
    nameVi: 'Cấp 2: Cảnh Báo Sớm — Early Warning (40–59)',
    badge: '⏳ CẢNH BÁO SỚM',
    timing: 'Làm việc ngay với Cục/Vụ chuyên môn • Hoàn thiện ngân hàng Q&A • Chuẩn bị người phát ngôn • Soạn bài hướng dẫn nghiệp vụ • Giám sát 24h',
    minRiskScore: 40,
    minCrisisCriteriaCount: 1,
    pollingFrequencySeconds: 300, // 300s (5 phút)
    minDomainTrustScore: 50,
    autoBlockFakeNewsSuspicious: true,
    philosophy: 'Cấp độ phòng ngừa quan trọng nhất của hệ thống: «Nếu không xử lý sớm, chuyện này có thể bùng phát thành khủng hoảng.» Can thiệp ngay bằng hướng dẫn nghiệp vụ và minh bạch thông tin.',
    description: 'Cấp độ phòng ngừa quan trọng nhất. Cùng một vướng mắc thủ tục nhưng nhiều địa phương/doanh nghiệp liên tục hỏi đi hỏi lại; xuất hiện các bài phân tích sâu về điểm nghẽn thực thi chính sách.',
    actionPlaybook: [
      'Làm việc ngay với Cục/Vụ chuyên môn Bộ Tài chính để làm rõ nguyên nhân gốc rễ vướng mắc.',
      'Hoàn thiện ngân hàng Q&A giải thích rõ ràng các băn khoăn chuyên sâu của doanh nghiệp/người dân.',
      'Chuẩn bị người phát ngôn có thẩm quyền để sẵn sàng cung cấp thông tin khi báo chí chất vấn.',
      'Soạn thảo bài hướng dẫn nghiệp vụ, infographic trực quan để cung cấp cho các cơ quan báo chí.',
      'Thiết lập giám sát chặt chẽ trong vòng 24 giờ để theo dõi phản ứng dư luận sau khi giải thích.',
    ],
    soundEnabled: false,
    notifyChannels: ['toast'],
    standardsCriteria: [
      'Điểm rủi ro đạt 40–59 điểm VÀ phát hiện vướng mắc thủ tục lặp lại hoặc phân tích sâu điểm nghẽn.',
      'Thủ tục thuế hộ kinh doanh, chậm hoàn thuế VAT, hóa đơn điện tử, quy trình hải quan bị than phiền liên tục.',
      'Vướng mắc tiến độ giải ngân đầu tư công, thủ tục đấu thầu, bảo hiểm xã hội, chính sách FDI...',
      'Tiêu đề báo chí trung tính nhưng nội dung phản ánh bất cập thực thi chính sách cần giải tỏa.',
    ],
    exclusionRules: [
      'TUYỆT ĐỐI LOẠI TRỪ các phát biểu chỉ đạo của Lãnh đạo Bộ, báo cáo thu ngân sách, khen thưởng thi đua thường kỳ.',
      'Loại trừ các tin tức điều hành và điểm tin thị trường không có phản ánh vướng mắc thực chất.',
    ],
    scopeDescription: 'Tập trung phòng ngừa sớm điểm nghẽn thực thi chính sách, kích hoạt giải pháp truyền thông nghiệp vụ trước khi thành điểm nóng.',
  },
  DISTANT: {
    level: 'DISTANT',
    priorityLevel: 'medium',
    nameVi: 'Cấp 1: Cảnh Báo Xa — Early Horizon (20–39)',
    badge: '🔭 CẢNH BÁO XA',
    timing: 'Đưa vào danh sách giám sát tự động • Lập Q&A nội bộ • Chuẩn bị thông điệp định hướng • Không lên tiếng vội vã',
    minRiskScore: 20,
    minCrisisCriteriaCount: 0,
    pollingFrequencySeconds: 600,
    minDomainTrustScore: 40,
    autoBlockFakeNewsSuspicious: true,
    philosophy: 'Nhận diện tín hiệu yếu từ xa (Weak Signals). Thăm dò, phân tích chuyên gia, bài viết học thuật hoặc chính sách mới ban hành. Chủ động chuẩn bị tài liệu nội bộ, tuyệt đối không lên tiếng vội vã trên báo chí.',
    description: 'Tín hiệu yếu (Weak signals). Một chính sách mới ban hành; xuất hiện các câu hỏi thăm dò; chuyên gia bắt đầu bình luận phân tích; báo chí đưa tin trích dẫn nguyên văn với thái độ trung tính.',
    actionPlaybook: [
      'Đưa nội dung vấn đề vào danh sách giám sát tự động của hệ thống.',
      'Tổng hợp các băn khoăn ban đầu để lập sẵn bộ Hỏi - Đáp nội bộ (Internal Q&A).',
      'Chuẩn bị sẵn thông điệp định hướng chính sách từ góc độ ổn định thị trường.',
      'Không lên tiếng vội vã trên báo chí để tránh thu hút sự chú ý không cần thiết.',
    ],
    soundEnabled: false,
    notifyChannels: ['toast'],
    standardsCriteria: [
      'Điểm rủi ro đạt từ 20 đến 39 điểm.',
      'Chính sách tài chính mới ban hành hoặc đang trong giai đoạn lấy ý kiến dự thảo.',
      'Xuất hiện câu hỏi thăm dò hoặc bài viết phân tích học thuật của chuyên gia kinh tế.',
      'Báo chí đưa tin trích dẫn nguyên văn với thái độ trung tính, chưa hình thành luồng chỉ trích.',
    ],
    exclusionRules: [
      'Loại trừ các tin tức nghiệp vụ sự vụ cá lẻ (xử phạt trốn thuế cá nhân, thu giữ hàng buôn lậu định kỳ) vì xã hội đồng thuận.',
    ],
    scopeDescription: 'Cấp cảnh báo dự báo xa cho các mầm mống chính sách mới, chuẩn bị kịch bản đón đầu trước khi văn bản ban hành chính thức.',
  },
  STANDARD: {
    level: 'STANDARD',
    priorityLevel: 'medium',
    nameVi: 'Giám sát Thường quy & Điều hành — Standard Monitoring (0–19)',
    badge: '📋 GIÁM SÁT THƯỜNG QUY',
    timing: 'Điểm tin giám sát thường quy / Điểm sáng điều hành (Tuyệt đối không kích hoạt cảnh báo tiêu điểm)',
    minRiskScore: 0,
    minCrisisCriteriaCount: 0,
    pollingFrequencySeconds: 1800, // 1800s (30 phút)
    minDomainTrustScore: 30,
    autoBlockFakeNewsSuspicious: true,
    description: 'Các phát biểu chỉ đạo của Lãnh đạo Bộ, nỗ lực đẩy nhanh giải ngân của địa phương, công bố Luật, Lệnh của Chủ tịch nước, nâng hạng TTCK, tháo gỡ khó khăn cho DN và kết quả thực hiện nhiệm vụ thường quy.',
    soundEnabled: false,
    notifyChannels: [],
    standardsCriteria: [
      'Phát biểu chỉ đạo, đôn đốc kỷ cương của Lãnh đạo Bộ (như "Bộ trưởng: Không buông lỏng trách nhiệm trong giải ngân vốn đầu tư công", "Quyết liệt đôn đốc tiến độ").',
      'Công bố Lệnh của Chủ tịch nước, hoàn thiện dự án Luật, đề xuất chủ động bổ sung thẩm quyền của Bộ Tài chính (Đã qua Noise Gate).',
      'Điểm sáng điều hành thể chế: Nâng hạng thị trường chứng khoán (Non-prefunding), tăng trưởng thu ngân sách, đối thoại hỗ trợ doanh nghiệp.',
      'Hoạt động giao ban hành chính, ký kết hợp tác, thanh tra định kỳ theo kế hoạch.',
    ],
    exclusionRules: [
      'KHÔNG kích hoạt bất kỳ cảnh báo đẩy, chuông báo hoặc cửa sổ nổi bật nào trên màn hình làm việc chính.',
    ],
    scopeDescription: 'Dành riêng cho luồng thông tin tích cực, hoạt động điều hành thường quy và thành tựu của ngành Tài chính, bảo đảm màn hình cảnh báo không bị nhiễu.',
  },
  MARKET_DIGEST: {
    level: 'MARKET_DIGEST',
    priorityLevel: 'medium',
    nameVi: 'Điểm tin Thị trường — Market Digest (Không cảnh báo)',
    badge: '📊 ĐIỂM TIN THỊ TRƯỜNG',
    timing: 'Điểm tin tham khảo khách quan • Không cảnh báo • Không cần can thiệp',
    minRiskScore: 0,
    minCrisisCriteriaCount: 0,
    pollingFrequencySeconds: 3600, // 3600s (1 giờ)
    minDomainTrustScore: 20,
    autoBlockFakeNewsSuspicious: true,
    description: 'Diễn biến thị trường chứng khoán, giao dịch cổ phiếu (như VN-Index tăng/giảm, cổ phiếu riêng lẻ hút dòng tiền, khối ngoại mua ròng). Đây là điểm tin thuần túy khách quan, không tác động đến uy tín hay trách nhiệm điều hành của Bộ Tài chính.',
    soundEnabled: false,
    notifyChannels: [],
    standardsCriteria: [
      'Biến động chỉ số chứng khoán thị trường (VN-Index, HNX-Index, UPCoM).',
      'Diễn biến giao dịch của các nhóm cổ phiếu niêm yết (ngân hàng, bất động sản, họ Vin, thép...).',
      'Điểm tin giao dịch tự doanh, dòng tiền khối ngoại thuần túy.',
    ],
    exclusionRules: [
      'Tuyệt đối KHÔNG kích hoạt cảnh báo, không tính vào số lượng vấn đề cần can thiệp trên Dashboard của Lãnh đạo.',
      'Nếu xuất hiện sai phạm nghiêm trọng, thao túng thị trường hoặc khởi tố bắt giam thì tự động chuyển sang luồng cảnh báo pháp luật/khủng hoảng.',
    ],
    scopeDescription: 'Dành riêng cho điểm tin giao dịch thị trường khách quan, bảo đảm Lãnh đạo không bị phân tâm bởi các biến động giao dịch thường nhật.',
  },
};

export const STORAGE_KEY_THRESHOLDS = 'finpulse_alert_thresholds_config_v2';

export function loadAlertThresholdConfig(): AlertThresholdConfig {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return ALERT_THRESHOLD_CONFIG;
    }
    const raw = localStorage.getItem(STORAGE_KEY_THRESHOLDS);
    if (!raw) return ALERT_THRESHOLD_CONFIG;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.EMERGENCY) {
      return {
        EMERGENCY: { ...ALERT_THRESHOLD_CONFIG.EMERGENCY, ...parsed.EMERGENCY },
        RAPID: { ...ALERT_THRESHOLD_CONFIG.RAPID, ...parsed.RAPID },
        EARLY: { ...ALERT_THRESHOLD_CONFIG.EARLY, ...parsed.EARLY },
        DISTANT: { ...ALERT_THRESHOLD_CONFIG.DISTANT, ...parsed.DISTANT },
        STANDARD: { ...ALERT_THRESHOLD_CONFIG.STANDARD, ...parsed.STANDARD },
        MARKET_DIGEST: { ...ALERT_THRESHOLD_CONFIG.MARKET_DIGEST, ...(parsed.MARKET_DIGEST || {}) },
      };
    }
    return ALERT_THRESHOLD_CONFIG;
  } catch (e) {
    console.error('Error loading alert threshold config:', e);
    return ALERT_THRESHOLD_CONFIG;
  }
}

export function saveAlertThresholdConfig(config: AlertThresholdConfig): void {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_THRESHOLDS, JSON.stringify(config));
    // Asynchronously synchronize with Cloud Firestore
    saveAlertThresholdConfigToCloud(config).catch((err) => {
      console.warn('Silent cloud sync for alert threshold config failed (cached locally):', err);
    });
  } catch (e) {
    console.error('Error saving alert threshold config:', e);
  }
}

export function resetAlertThresholdConfig(): AlertThresholdConfig {
  try {
    localStorage.removeItem(STORAGE_KEY_THRESHOLDS);
    // Asynchronously synchronize reset to Cloud Firestore
    saveAlertThresholdConfigToCloud(ALERT_THRESHOLD_CONFIG).catch((err) => {
      console.warn('Silent cloud sync for reset alert threshold config failed:', err);
    });
  } catch (e) {
    console.error('Error resetting alert threshold config:', e);
  }
  return ALERT_THRESHOLD_CONFIG;
}

export const DEFAULT_ALERT_TRIGGERS: AlertTriggerRule[] = [
  // 1. CẤP ĐỘ KHẨN CẤP (EMERGENCY)
  {
    id: 'trig-mof-legal-corruption',
    name: 'Đại án Khởi tố & Bắt tạm giam Cán bộ / Thất thoát Lớn',
    keywords: ['khởi tố cán bộ', 'bắt tạm giam cán bộ', 'cán bộ nhận hối lộ', 'đại án tham nhũng', 'vụ án xuyên việt oil', 'chiếm dụng ngân sách'],
    negationExceptions: ['đề xuất bổ sung thẩm quyền', 'thẩm quyền khởi tố', 'bổ sung thẩm quyền khởi tố', 'chủ động đề xuất'],
    minBuzzScore: 80,
    minImpactScore: 78,
    requireVelocitySpike: false,
    requireTier1: true,
    sentimentFilter: 'bearish_only',
    enabled: true,
    priorityLevel: 'critical',
    alertLevel: 'EMERGENCY',
    soundEnabled: true,
    notifyChannels: ['toast', 'modal', 'browser'],
    category: 'mof_core',
    activationStandard: 'Bắt buộc có quyết định tố tụng hình sự đối với cá nhân/tổ chức cụ thể. Tự động loại trừ trường hợp Bộ chủ động đề xuất bổ sung thẩm quyền khởi tố trong công tác hoàn thiện thể chế.',
  },
  {
    id: 'trig-mof-bonds-crisis',
    name: 'Đột biến Trái phiếu Doanh nghiệp & Vỡ nợ / Chậm thanh toán',
    keywords: ['chậm thanh toán trái phiếu', 'vỡ nợ trái phiếu', 'khất nợ trái chủ', 'trái chủ căng băng rôn', 'vỡ nợ chéo'],
    negationExceptions: ['thanh toán đúng hạn', 'mua lại trái phiếu trước hạn'],
    minBuzzScore: 82,
    minImpactScore: 80,
    requireVelocitySpike: true,
    requireTier1: true,
    sentimentFilter: 'bearish_only',
    enabled: true,
    priorityLevel: 'critical',
    alertLevel: 'EMERGENCY',
    soundEnabled: true,
    notifyChannels: ['toast', 'modal', 'browser'],
    category: 'market_capital',
    activationStandard: 'Doanh nghiệp lớn mất khả năng thanh toán gốc lãi trái phiếu kèm tụ tập căng băng rôn hoặc nguy cơ vỡ nợ chéo lan truyền sang hệ thống ngân hàng.',
  },
  {
    id: 'trig-mof-tax-invoice-fraud',
    name: 'Đại án Gian lận Hóa đơn điện tử & Hoàn thuế VAT khống Nghìn tỷ',
    keywords: ['gian lận hóa đơn nghìn tỷ', 'trốn thuế nghìn tỷ', 'hoàn thuế vat khống nghìn tỷ', 'doanh nghiệp ma bán hóa đơn'],
    minBuzzScore: 80,
    minImpactScore: 78,
    requireVelocitySpike: false,
    requireTier1: true,
    sentimentFilter: 'bearish_only',
    enabled: true,
    priorityLevel: 'critical',
    alertLevel: 'EMERGENCY',
    soundEnabled: true,
    notifyChannels: ['toast', 'modal'],
    category: 'tax_customs',
    activationStandard: 'Phát hiện đường dây thành lập doanh nghiệp ma xuất khống hóa đơn điện tử hoặc hoàn thuế khống quy mô lớn gây thất thoát ngân sách nghiêm trọng.',
  },

  // 2. CẤP ĐỘ CẢNH BÁO NHANH (RAPID)
  {
    id: 'trig-mof-tax-customs-backlog',
    name: 'Bức xúc Thủ tục Thuế & Ách tắc Thông quan Hàng hóa Kéo dài',
    keywords: ['chậm hoàn thuế vat', 'bức xúc thủ tục thuế', 'ách tắc thông quan', 'ùn ứ cửa khẩu kéo dài', 'nghẽn hoàn thuế'],
    negationExceptions: ['tháo gỡ khó khăn', 'đã thông quan', 'hỗ trợ doanh nghiệp', 'rút ngắn thời gian'],
    minBuzzScore: 78,
    minImpactScore: 75,
    requireVelocitySpike: false,
    requireTier1: true,
    sentimentFilter: 'bearish_only',
    enabled: true,
    priorityLevel: 'high',
    alertLevel: 'RAPID',
    soundEnabled: true,
    notifyChannels: ['toast', 'modal'],
    category: 'tax_customs',
    activationStandard: 'Báo chí phản ánh nhiều doanh nghiệp bức xúc diện rộng do ách tắc thủ tục hành chính, chậm hoàn thuế hoặc ùn ứ hàng hóa tại cửa khẩu kéo dài.',
  },
  {
    id: 'trig-mof-business-urgent-petition',
    name: 'Hiệp hội Doanh nghiệp Đồng loạt Kiến nghị Khẩn cấp về Chính sách',
    keywords: ['hiệp hội doanh nghiệp kiến nghị', 'kêu cứu chính sách thuế', 'đề xuất khẩn cấp về thuế', 'gánh nặng chi phí thuế phí'],
    negationExceptions: ['tiếp thu kiến nghị', 'đã tháo gỡ vướng mắc', 'đồng thuận chính sách'],
    minBuzzScore: 78,
    minImpactScore: 75,
    requireVelocitySpike: false,
    requireTier1: false,
    sentimentFilter: 'bearish_only',
    enabled: true,
    priorityLevel: 'high',
    alertLevel: 'RAPID',
    soundEnabled: true,
    notifyChannels: ['toast', 'modal'],
    category: 'mof_core',
    activationStandard: 'Nhiều hiệp hội ngành nghề gửi văn bản kiến nghị trực tiếp phản ánh vướng mắc chính sách tài khóa, thuế, hải quan cần giải quyết trong 12h.',
  },
  {
    id: 'trig-mof-gold-fx-volatility',
    name: 'Biến động Cực đoan Giá Vàng & Sốt Tỷ giá USD/VND',
    keywords: ['sốt giá vàng miếng', 'sốt tỷ giá usd/vnd', 'đấu thầu vàng miếng thất bại', 'chênh lệch giá vàng kỷ lục', 'tỷ giá usd chợ đen tăng vọt'],
    minBuzzScore: 82,
    minImpactScore: 80,
    requireVelocitySpike: true,
    requireTier1: false,
    sentimentFilter: 'all',
    enabled: true,
    priorityLevel: 'high',
    alertLevel: 'RAPID',
    soundEnabled: true,
    notifyChannels: ['toast', 'modal'],
    category: 'macro_fx',
    activationStandard: 'Chênh lệch giá vàng trong nước và thế giới nới rộng kỷ lục hoặc tỷ giá ngoại tệ biến động nóng vượt khung dự báo của cơ quan điều hành.',
  },

  // 3. CẤP ĐỘ CẢNH BÁO SỚM (EARLY)
  {
    id: 'trig-mof-public-investment-bottleneck',
    name: 'Nguy cơ Điểm nghẽn Giải ngân Vốn Đầu tư công Thực tế',
    keywords: ['điểm nghẽn giải ngân đầu tư công', 'tồn ngân kho bạc đột biến', 'tắc nghẽn vốn đầu tư công', 'giải ngân chậm tiến độ'],
    negationExceptions: [
      'không buông lỏng',
      'không buông lỏng trách nhiệm',
      'đôn đốc giải ngân',
      'chỉ đạo giải ngân',
      'bộ trưởng chỉ đạo',
      'nêu cao trách nhiệm',
      'quyết liệt giải ngân',
      'khởi sắc giải ngân',
    ],
    minBuzzScore: 75,
    minImpactScore: 70,
    requireVelocitySpike: false,
    requireTier1: true,
    sentimentFilter: 'all',
    enabled: true,
    priorityLevel: 'high',
    alertLevel: 'EARLY',
    soundEnabled: false,
    notifyChannels: ['toast'],
    category: 'mof_core',
    activationStandard: 'CHỈ KÍCH HOẠT khi phản ánh vướng mắc thực tế tại công trường/dự án. TUYỆT ĐỐI LOẠI TRỪ phát biểu chỉ đạo của Lãnh đạo Bộ (như "Bộ trưởng: Không buông lỏng trách nhiệm trong giải ngân vốn đầu tư công").',
  },
  {
    id: 'trig-mof-policy-draft-debate',
    name: 'Tranh luận & Băn khoăn Dư luận về Dự thảo Chính sách Mới',
    keywords: ['tranh luận dự thảo thuế', 'băn khoăn quy định mới', 'lo ngại tác động thuế mới', 'chuyên gia phản biện dự thảo', 'đề xuất lùi thời hạn áp dụng'],
    negationExceptions: ['công bố lệnh của chủ tịch nước', 'chủ tịch nước ký lệnh', 'lệnh của chủ tịch nước'],
    minBuzzScore: 72,
    minImpactScore: 68,
    requireVelocitySpike: false,
    requireTier1: false,
    sentimentFilter: 'all',
    enabled: true,
    priorityLevel: 'medium',
    alertLevel: 'EARLY',
    soundEnabled: false,
    notifyChannels: ['toast'],
    category: 'mof_core',
    activationStandard: 'Phát hiện sớm các băn khoăn, tranh luận của giới chuyên gia và báo chí về dự thảo chính sách trước khi ban hành chính thức để kịp thời tham mưu giải trình.',
  },
  {
    id: 'trig-mof-bidding-procurement-bottleneck',
    name: 'Ách tắc Đấu thầu Mua sắm Công & Dự án PPP (Cục QL Đấu thầu)',
    keywords: ['ách tắc đấu thầu', 'tiêu chí cài cắm', 'thông thầu', 'hủy thầu', 'đấu thầu thuốc', 'đấu thầu vật tư y tế', 'khiếu nại kết quả mở thầu', 'chậm lựa chọn nhà thầu'],
    minBuzzScore: 75,
    minImpactScore: 72,
    requireVelocitySpike: false,
    requireTier1: false,
    sentimentFilter: 'all',
    enabled: true,
    priorityLevel: 'high',
    alertLevel: 'EARLY',
    soundEnabled: false,
    notifyChannels: ['toast'],
    category: 'mof_core',
    activationStandard: 'Phát hiện các sự cố chậm đấu thầu thuốc, vật tư y tế, vướng mắc dự án PPP trọng điểm để Cục Quản lý đấu thầu can thiệp xử lý kịp thời.',
  },
  {
    id: 'trig-mof-social-security-debt',
    name: 'Bức xúc Nợ đọng BHXH & Trục lợi Quỹ BHYT (BHXH Việt Nam)',
    keywords: ['nợ đọng bhxh', 'trốn đóng bhxh', 'trục lợi quỹ bhyt', 'chậm đóng bảo hiểm', 'doanh nghiệp nợ bảo hiểm', 'rút bhxh một lần'],
    minBuzzScore: 74,
    minImpactScore: 70,
    requireVelocitySpike: false,
    requireTier1: false,
    sentimentFilter: 'all',
    enabled: true,
    priorityLevel: 'high',
    alertLevel: 'EARLY',
    soundEnabled: false,
    notifyChannels: ['toast'],
    category: 'mof_core',
    activationStandard: 'Cảnh báo tình trạng doanh nghiệp nợ đọng BHXH số tiền lớn, ảnh hưởng quyền lợi người lao động để BHXH Việt Nam phối hợp thanh kiểm tra.',
  },
  {
    id: 'trig-mof-fdi-transfer-pricing',
    name: 'Vướng mắc Cấp phép FDI & Dấu hiệu Chuyển giá (Cục ĐT Nước ngoài & Cục Thuế)',
    keywords: ['vướng mắc cấp phép fdi', 'chuyển giá trốn thuế', 'giải ngân fdi sụt giảm', 'khiếu nại nhà đầu tư nước ngoài', 'chuyển giá fdi'],
    minBuzzScore: 72,
    minImpactScore: 68,
    requireVelocitySpike: false,
    requireTier1: false,
    sentimentFilter: 'all',
    enabled: true,
    priorityLevel: 'medium',
    alertLevel: 'EARLY',
    soundEnabled: false,
    notifyChannels: ['toast'],
    category: 'mof_core',
    activationStandard: 'Nhận diện các vướng mắc về thủ tục thu hút vốn FDI hoặc các phản ánh về chuyển giá của tập đoàn đa quốc gia.',
  },
  {
    id: 'trig-mof-national-statistics-cpi-discrepancy',
    name: 'Tranh cãi Dữ liệu Thống kê Quốc gia & Áp lực Lạm phát CPI (Cục Thống kê)',
    keywords: ['sai lệch số liệu thống kê', 'tính toán cpi', 'áp lực lạm phát cpi', 'tranh luận số liệu gdp', 'công bố gdp'],
    minBuzzScore: 70,
    minImpactScore: 65,
    requireVelocitySpike: false,
    requireTier1: false,
    sentimentFilter: 'all',
    enabled: true,
    priorityLevel: 'medium',
    alertLevel: 'EARLY',
    soundEnabled: false,
    notifyChannels: ['toast'],
    category: 'mof_core',
    activationStandard: 'Theo dõi các phản ánh của chuyên gia, báo chí về phương pháp tính toán hoặc độ vênh số liệu thống kê vĩ mô.',
  },

  // 4. CẤP ĐỘ CẢNH BÁO XA (DISTANT)
  {
    id: 'trig-mof-macro-contagion',
    name: 'Biến động Kinh tế Toàn cầu & Rủi ro Lạm phát Lan truyền',
    keywords: ['lạm phát toàn cầu', 'fed điều chỉnh lãi suất', 'biến động giá dầu thế giới', 'đứt gãy chuỗi cung ứng'],
    minBuzzScore: 70,
    minImpactScore: 65,
    requireVelocitySpike: false,
    requireTier1: false,
    sentimentFilter: 'all',
    enabled: true,
    priorityLevel: 'medium',
    alertLevel: 'DISTANT',
    soundEnabled: false,
    notifyChannels: ['toast'],
    category: 'macro_fx',
    activationStandard: 'Diễn biến vĩ mô quốc tế có độ trễ tác động đến cân đối thu chi ngân sách và ổn định tài khóa trong 3-7 ngày tới.',
  },

  // 5. CẤP ĐỘ GIÁM SÁT THƯỜNG QUY & ĐIỀU HÀNH (STANDARD - ĐÃ QUA NOISE GATE)
  {
    id: 'trig-mof-routine-leadership-directive',
    name: 'Chỉ đạo Điều hành Thường quy & Quán triệt Kỷ cương của Lãnh đạo',
    keywords: ['không buông lỏng trách nhiệm', 'đôn đốc giải ngân vốn đầu tư công', 'chỉ đạo giải ngân', 'nêu cao tinh thần trách nhiệm', 'siết chặt kỷ luật kỷ cương'],
    minBuzzScore: 50,
    minImpactScore: 50,
    requireVelocitySpike: false,
    requireTier1: true,
    sentimentFilter: 'all',
    enabled: true,
    priorityLevel: 'medium',
    alertLevel: 'STANDARD',
    soundEnabled: false,
    notifyChannels: [],
    category: 'mof_core',
    activationStandard: 'Phát biểu chỉ đạo, đôn đốc công tác thường quy của Bộ trưởng và Lãnh đạo. Hệ thống tự động phân loại vào Giám sát Thường quy, KHÔNG kích hoạt cảnh báo tiêu điểm.',
  },
  {
    id: 'trig-mof-market-upgrade-reform',
    name: 'Nâng hạng TTCK & Thể chế Non-prefunding (Điểm sáng Điều hành)',
    keywords: ['kết quả nâng hạng ttck', 'thông tư 68/2024/tt-btc', 'ftse russell công bố nâng hạng', 'non-prefunding chính thức'],
    minBuzzScore: 75,
    minImpactScore: 70,
    requireVelocitySpike: false,
    requireTier1: true,
    sentimentFilter: 'bullish_only',
    enabled: true,
    priorityLevel: 'medium',
    alertLevel: 'STANDARD',
    soundEnabled: false,
    notifyChannels: [],
    category: 'mof_core',
    activationStandard: 'Tin tức thành tựu, tháo gỡ điểm nghẽn thể chế để nâng hạng thị trường chứng khoán Việt Nam (Ghi nhận điểm sáng điều hành).',
  },
  {
    id: 'trig-mof-debunk-rumors-monitoring',
    name: 'Bác bỏ Tin đồn Thất thiệt & Đính chính Chính sách',
    keywords: ['bác bỏ tin đồn thất thiệt', 'phủ nhận thông tin sai sự thật', 'đính chính thông tin bộ tài chính'],
    minBuzzScore: 70,
    minImpactScore: 65,
    requireVelocitySpike: false,
    requireTier1: true,
    sentimentFilter: 'all',
    enabled: true,
    priorityLevel: 'medium',
    alertLevel: 'STANDARD',
    soundEnabled: false,
    notifyChannels: [],
    category: 'mof_core',
    activationStandard: 'Công tác phát ngôn kịp thời, bác bỏ các thông tin xuyên tạc để ổn định dư luận và niềm tin nhà đầu tư.',
  },
];

// LocalStorage helpers
export function loadAlertTriggers(): AlertTriggerRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ALERT_TRIGGERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_ALERT_TRIGGERS;
  } catch (e) {
    console.error('Error loading alert triggers:', e);
    return DEFAULT_ALERT_TRIGGERS;
  }
}

export function saveAlertTriggers(rules: AlertTriggerRule[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
    // Asynchronously synchronize with Cloud Firestore
    saveAlertTriggerRulesToCloud(rules).catch((err) => {
      console.warn('Silent cloud sync for alert trigger rules failed (cached locally):', err);
    });
  } catch (e) {
    console.error('Error saving alert triggers:', e);
  }
}

export function resetAlertTriggers(): AlertTriggerRule[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
    // Asynchronously synchronize reset with Cloud Firestore
    saveAlertTriggerRulesToCloud(DEFAULT_ALERT_TRIGGERS).catch((err) => {
      console.warn('Silent cloud sync for reset alert trigger rules failed:', err);
    });
  } catch (e) {
    console.error('Error resetting alert triggers:', e);
  }
  return DEFAULT_ALERT_TRIGGERS;
}

// ============================================================================
// BẢNG QUẢN LÝ TỪ KHÓA BỎ QUA CẢNH BÁO TÙY BIẾN (PERSISTENT IGNORE-LIST / WHITELIST)
// Cho phép quản trị viên thêm/xóa/sửa các từ khóa hoặc biểu thức mẫu (VD: 'cổ tức', 'tăng vốn')
// Các bài viết khớp với danh sách này sẽ KHÔNG BAO GIỜ kích hoạt cảnh báo khẩn cấp (Emergency Alert)
// bất kể sắc thái tiêu cực hay vận tốc lan truyền.
// ============================================================================

export const DEFAULT_ALERT_IGNORE_RULES: AlertIgnoreRule[] = [
  {
    id: 'ign-dividend-actions',
    pattern: 'cổ tức',
    description: 'Hoạt động trả/chia cổ tức bằng cổ phiếu hoặc tiền mặt của doanh nghiệp & ngân hàng',
    category: 'corporate_dividend',
    enabled: true,
    createdAt: '2026-09-12T00:00:00.000Z'
  },
  {
    id: 'ign-capital-increase',
    pattern: 'tăng vốn',
    description: 'Hoạt động tăng vốn điều lệ, chào bán cổ phiếu, phát hành cổ phiếu tăng vốn',
    category: 'capital_increase',
    enabled: true,
    createdAt: '2026-09-12T00:00:00.000Z'
  },
  {
    id: 'ign-dividend-record-date',
    pattern: 'chốt quyền',
    description: 'Chốt danh sách cổ đông nhận quyền, chia cổ tức',
    category: 'corporate_dividend',
    enabled: true,
    createdAt: '2026-09-12T00:00:00.000Z'
  },
  {
    id: 'ign-stock-issuance',
    pattern: 'phát hành cổ phiếu',
    description: 'Phát hành cổ phiếu cho cổ đông hiện hữu, ESOP hoặc trả cổ tức',
    category: 'capital_increase',
    enabled: true,
    createdAt: '2026-09-12T00:00:00.000Z'
  },
  {
    id: 'ign-shareholders-meeting',
    pattern: 'đại hội cổ đông',
    description: 'Nghị quyết và diễn biến Đại hội đồng Cổ đông thường niên/bất thường',
    category: 'corporate_dividend',
    enabled: true,
    createdAt: '2026-09-12T00:00:00.000Z'
  },
  {
    id: 'ign-macro-labor-research',
    pattern: 'thị trường lao động',
    description: 'Báo cáo nghiên cứu học thuật, việc làm, thị trường lao động Việt Nam giai đoạn mới',
    category: 'macro_research',
    enabled: true,
    createdAt: '2026-09-12T00:00:00.000Z'
  },
  {
    id: 'ign-vpbank-actions',
    pattern: 'vpbank',
    description: 'Hoạt động kinh doanh và tài chính doanh nghiệp của VPBank',
    category: 'corporate_dividend',
    enabled: true,
    createdAt: '2026-09-12T00:00:00.000Z'
  },
  {
    id: 'ign-business-financial-results',
    pattern: 'kết quả kinh doanh',
    description: 'Công bố báo cáo tài chính quý, doanh thu, lợi nhuận thường quy',
    category: 'corporate_dividend',
    enabled: true,
    createdAt: '2026-09-12T00:00:00.000Z'
  },
  {
    id: 'ign-deposit-interest-rates',
    pattern: 'lãi suất tiền gửi',
    description: 'Biểu lãi suất huy động tiền gửi ngân hàng thương mại',
    category: 'routine_legal',
    enabled: true,
    createdAt: '2026-09-12T00:00:00.000Z'
  }
];

export const STORAGE_KEY_IGNORE_LIST = 'finpulse_alert_ignore_list_v1';

export function loadAlertIgnoreList(): AlertIgnoreRule[] {
  try {
    if (typeof window === 'undefined') return DEFAULT_ALERT_IGNORE_RULES;
    const raw = localStorage.getItem(STORAGE_KEY_IGNORE_LIST);
    if (!raw) return DEFAULT_ALERT_IGNORE_RULES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_ALERT_IGNORE_RULES;
  } catch (e) {
    console.error('Error loading alert ignore list:', e);
    return DEFAULT_ALERT_IGNORE_RULES;
  }
}

export function saveAlertIgnoreList(rules: AlertIgnoreRule[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_IGNORE_LIST, JSON.stringify(rules));
    }
    saveAlertIgnoreListToCloud(rules).catch((err) => {
      console.warn('Silent cloud sync for alert ignore list failed:', err);
    });
  } catch (e) {
    console.error('Error saving alert ignore list:', e);
  }
}

export function resetAlertIgnoreList(): AlertIgnoreRule[] {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_IGNORE_LIST);
    }
    saveAlertIgnoreListToCloud(DEFAULT_ALERT_IGNORE_RULES).catch((err) => {
      console.warn('Silent cloud sync for reset alert ignore list failed:', err);
    });
  } catch (e) {
    console.error('Error resetting alert ignore list:', e);
  }
  return DEFAULT_ALERT_IGNORE_RULES;
}

export function addAlertIgnoreRule(
  pattern: string,
  description?: string,
  category: AlertIgnoreRule['category'] = 'custom'
): AlertIgnoreRule[] {
  const current = loadAlertIgnoreList();
  const trimmed = pattern.trim();
  if (!trimmed) return current;

  // Check if pattern already exists
  const existingIdx = current.findIndex(r => r.pattern.toLowerCase() === trimmed.toLowerCase());
  if (existingIdx >= 0) {
    // Enable it if disabled
    current[existingIdx].enabled = true;
    if (description) current[existingIdx].description = description;
    saveAlertIgnoreList(current);
    return current;
  }

  const newRule: AlertIgnoreRule = {
    id: `ign-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    pattern: trimmed,
    description: description || `Mẫu bỏ qua cảnh báo tự động cho: "${trimmed}"`,
    category,
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updated = [newRule, ...current];
  saveAlertIgnoreList(updated);
  return updated;
}

export function deleteAlertIgnoreRule(id: string): AlertIgnoreRule[] {
  const current = loadAlertIgnoreList();
  const filtered = current.filter(r => r.id !== id);
  saveAlertIgnoreList(filtered);
  return filtered;
}

export function toggleAlertIgnoreRule(id: string): AlertIgnoreRule[] {
  const current = loadAlertIgnoreList();
  const updated = current.map(r => (r.id === id ? { ...r, enabled: !r.enabled, updatedAt: new Date().toISOString() } : r));
  saveAlertIgnoreList(updated);
  return updated;
}

// Synthesize professional alert chimes using Web Audio API
export function playAlertChime(priority: 'critical' | 'high' | 'medium' = 'high') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (priority === 'critical') {
      // 3-tone urgent alert (A5 - F5 - A5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.setValueAtTime(698.46, now + 0.12); // F5
      osc1.frequency.setValueAtTime(880, now + 0.24); // A5

      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(349.23, now + 0.12);
      osc2.frequency.setValueAtTime(440, now + 0.24);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } else if (priority === 'high') {
      // 2-tone melodic notification (E5 - A5)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } else {
      // Soft single pop chime (C6)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now); // C6

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (err) {
    console.warn('Audio chime playback not allowed or supported:', err);
  }
}

// Request Browser Push Notification Permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

// Send standard browser desktop notification
export function sendBrowserNotification(alert: ActiveAlertNotification) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const title = `[CẢNH BÁO ${alert.priorityLevel.toUpperCase()}] ${alert.triggerName}`;
    const options: NotificationOptions = {
      body: `${alert.article.title}\nBuzz: ${alert.article.buzzScore}/100 | Impact: ${alert.article.impactScore || 70}/100`,
      icon: '/favicon.ico',
      tag: alert.id,
    };
    new Notification(title, options);
  } catch (e) {
    console.warn('Could not dispatch browser notification:', e);
  }
}

// ============================================================================
// STRICT NOISE GATE FILTER & AUDIT TRAIL
// Tự động phát hiện và loại bỏ các tin tức thông lệ, văn bản luật sửa đổi,
// công bố lệnh của Chủ tịch nước, điều hành của Ngân hàng Nhà nước, và hoạt động
// quản trị thường quy khỏi luồng cảnh báo khẩn cấp (Critical / Emergency flow).
// Ghi nhận đầy đủ vào Filtered Announcements Audit Trail để phục vụ giám sát thường quy.
// ============================================================================

export interface FilteredAnnouncementAuditItem {
  id: string;
  articleId: string;
  title: string;
  source: string;
  url?: string;
  publishedAt?: string;
  filteredCategory: string; // 'luật_sửa_đổi' | 'công_bố_lệnh' | 'ngân_hàng_nhà_nước' | 'điều_hành_thường_quy' | 'thể_chế_hành_chính' | 'đề_xuất_thẩm_quyền';
  reasonVi: string;
  riskScore: number;
  alertLevel: 'STANDARD';
  pipelineStatus: 'SAFE';
  timestamp: string;
}

// In-memory audit trail of announcements filtered out by the Noise Gate
const filteredAnnouncementsAuditTrail: FilteredAnnouncementAuditItem[] = [];

export function getFilteredAnnouncementsAuditTrail(): FilteredAnnouncementAuditItem[] {
  return [...filteredAnnouncementsAuditTrail];
}

export function clearFilteredAnnouncementsAuditTrail(): void {
  filteredAnnouncementsAuditTrail.length = 0;
}

export function logFilteredAnnouncementToAuditTrail(entry: FilteredAnnouncementAuditItem): void {
  const existingIdx = filteredAnnouncementsAuditTrail.findIndex(item => item.articleId === entry.articleId);
  if (existingIdx >= 0) {
    filteredAnnouncementsAuditTrail[existingIdx] = entry;
  } else {
    filteredAnnouncementsAuditTrail.unshift(entry);
    if (filteredAnnouncementsAuditTrail.length > 500) {
      filteredAnnouncementsAuditTrail.pop();
    }
  }
}

export interface NoiseGateDetectionResult {
  isFiltered: boolean;
  category:
    | 'ignore_list_tùy_biến'
    | 'luật_sửa_đổi'
    | 'công_bố_lệnh'
    | 'ngân_hàng_nhà_nước'
    | 'điều_hành_thường_quy'
    | 'thể_chế_hành_chính'
    | 'đề_xuất_thẩm_quyền'
    | 'chỉ_đạo_điều_hành'
    | 'phân_định_nhiệm_vụ'
    | 'phát_triển_địa_phương'
    | 'hoạt_động_doanh_nghiệp_ngân_hàng'
    | 'nghiên_cứu_thể_chế_vĩ_mô'
    | 'none';
  reasonVi: string;
}

export function detectNoiseGateCategory(text: string): NoiseGateDetectionResult {
  if (!text) return { isFiltered: false, category: 'none', reasonVi: '' };
  const t = text.toLowerCase();

  // 0. TIỀN KIỂM ƯU TIÊN 0: DANH MỤC IGNORE-LIST TÙY BIẾN CỦA QUẢN TRỊ VIÊN
  // Khớp các từ khóa/mẫu như 'cổ tức', 'tăng vốn', 'VPBank', 'đại hội cổ đông' được quản lý trong AlertTriggerModal
  const ignoreRules = loadAlertIgnoreList().filter(r => r.enabled);
  for (const rule of ignoreRules) {
    const rawPattern = (rule.pattern || '').trim().toLowerCase();
    if (!rawPattern) continue;
    let isMatched = false;
    try {
      if (rawPattern.startsWith('/') && rawPattern.endsWith('/') && rawPattern.length > 2) {
        const regex = new RegExp(rawPattern.slice(1, -1), 'i');
        isMatched = regex.test(t);
      } else {
        isMatched = t.includes(rawPattern);
      }
    } catch {
      isMatched = t.includes(rawPattern);
    }
    if (isMatched) {
      return {
        isFiltered: true,
        category: 'ignore_list_tùy_biến',
        reasonVi: `Khớp mẫu Ignore-list [${rule.pattern}] - ${rule.description || 'Miễn trừ cảnh báo khẩn cấp'}`,
      };
    }
  }

  // 1. TIỀN KIỂM ƯU TIÊN: Nhận diện Đề xuất Thẩm quyền & Chức năng của Bộ Tài chính
  // (Ví dụ: "Bộ Tài chính đề xuất bổ sung thẩm quyền khởi tố một số vụ án liên quan đến thuế, quyền sở hữu trí tuệ")
  // Đây là hoạt động chủ động, tích cực về mặt thể chế thường quy của Bộ, TUYỆT ĐỐI KHÔNG phải vụ án hình sự hay sự cố khẩn cấp.
  const isMinistryAuthority = 
    /đề xuất (bổ sung thẩm quyền|thêm thẩm quyền|thẩm quyền khởi tố|quyền khởi tố|chức năng điều tra|thẩm quyền điều tra)/i.test(t) ||
    /thẩm quyền khởi tố (một số vụ án|vụ án liên quan đến thuế|vụ án thuế|thuế|sở hữu trí tuệ|hàng giả)/i.test(t) ||
    /bổ sung thẩm quyền (khởi tố|điều tra|xử lý)/i.test(t) ||
    /bộ tài chính đề xuất (bổ sung thẩm quyền|thêm thẩm quyền|thẩm quyền|khởi tố|điều tra|sửa đổi|hoàn thiện)/i.test(t) ||
    ((t.includes('bộ tài chính') || t.includes('ngành thuế') || t.includes('hải quan')) &&
     t.includes('thẩm quyền') &&
     (t.includes('khởi tố') || t.includes('điều tra')) &&
     (t.includes('đề xuất') || t.includes('kiến nghị') || t.includes('dự thảo') || t.includes('bổ sung')));

  if (isMinistryAuthority) {
    return {
      isFiltered: true,
      category: 'đề_xuất_thẩm_quyền',
      reasonVi: 'Bộ Tài chính chủ động đề xuất bổ sung thẩm quyền (khởi tố/điều tra án thuế, sở hữu trí tuệ) & hoàn thiện thể chế quản lý nhà nước thường quy',
    };
  }

  // 1b. TIỀN KIỂM PHÂN ĐỊNH NHIỆM VỤ, TINH GỌN BỘ MÁY (Bãi bỏ kiểm tra in, đúc, tiêu hủy tiền)
  // (Ví dụ: "Từ tháng 12/2026: Bỏ trách nhiệm của Bộ Tài chính trong kiểm tra nghiệp vụ in, đúc, tiêu hủy tiền")
  // Phân định chức năng quản lý nhà nước thường quy giữa Bộ Tài chính và Ngân hàng Nhà nước để tinh gọn bộ máy
  const isInstitutionalDelegation = 
    /bỏ trách nhiệm (của )?bộ tài chính trong kiểm tra/i.test(t) ||
    /kiểm tra nghiệp vụ in,?\s*đúc,?\s*tiêu hủy tiền/i.test(t) ||
    /nghiệp vụ in,?\s*đúc,?\s*tiêu hủy tiền/i.test(t) ||
    /in,?\s*đúc,?\s*tiêu hủy tiền/i.test(t) ||
    /bỏ trách nhiệm.*kiểm tra nghiệp vụ/i.test(t) ||
    /bãi bỏ (nhiệm vụ|trách nhiệm) kiểm tra/i.test(t) ||
    /phân định (lại )?(thẩm quyền|chức năng|nhiệm vụ|trách nhiệm) giữa/i.test(t) ||
    /điều chỉnh (chức năng|nhiệm vụ|thẩm quyền) của bộ/i.test(t) ||
    /tinh gọn bộ máy|sắp xếp lại chức năng nhiệm vụ/i.test(t);

  if (isInstitutionalDelegation) {
    return {
      isFiltered: true,
      category: 'phân_định_nhiệm_vụ',
      reasonVi: 'Phân định chức năng nhiệm vụ & tinh gọn bộ máy quản lý nhà nước (Bãi bỏ kiểm tra nghiệp vụ in, đúc, tiêu hủy tiền thường quy)',
    };
  }

  // 1c. TIỀN KIỂM PHÁT TRIỂN ĐỊA PHƯƠNG & KHƠI THÔNG NGUỒN LỰC ĐẦU TƯ
  // (Ví dụ: "Cần Thơ ưu tiên hiệu quả đầu tư, khơi thông nguồn lực cho tăng trưởng")
  // Đây là tin điều hành tích cực, điểm sáng phát triển kinh tế địa phương, TUYỆT ĐỐI KHÔNG phải rủi ro hay cảnh báo khẩn cấp
  const isLocalEconomicGrowth = 
    (/cần thơ|hà nội|tp\.hcm|thành phố hồ chí minh|đà nẵng|hải phòng|quảng ninh|bình dương|đồng nai|bà rịa|vũng tàu|địa phương|các tỉnh/i.test(t) &&
     (t.includes('ưu tiên hiệu quả đầu tư') || t.includes('khơi thông nguồn lực') || t.includes('nguồn lực cho tăng trưởng') ||
      t.includes('hiệu quả đầu tư') || t.includes('động lực tăng trưởng') || t.includes('tạo đà tăng trưởng') ||
      t.includes('thu hút nguồn lực') || t.includes('tập trung nguồn lực') || t.includes('thúc đẩy đầu tư'))) ||
    /khơi thông nguồn lực|ưu tiên hiệu quả đầu tư|nguồn lực cho tăng trưởng|tạo động lực tăng trưởng bền vững/i.test(t);

  if (isLocalEconomicGrowth) {
    return {
      isFiltered: true,
      category: 'phát_triển_địa_phương',
      reasonVi: 'Chỉ đạo phát triển kinh tế & khơi thông nguồn lực đầu tư địa phương (Điểm sáng điều hành tăng trưởng)',
    };
  }

  // 2. Nhóm từ khóa: Công bố Lệnh của Chủ tịch nước
  // (Ví dụ: "Công bố Lệnh của Chủ tịch nước về Luật sửa đổi, bổ sung một số điều của Luật Ngân hàng Nhà nước Việt Nam, Luật Phòng, chống rửa tiền và Luật Các tổ chức tín dụng")
  const isPresidentialOrder = 
    /công bố lệnh|lệnh của chủ tịch nước|chủ tịch nước công bố lệnh|chủ tịch nước ký lệnh|lệnh chủ tịch nước|ký lệnh công bố|công bố pháp lệnh|lệnh về việc công bố|chủ tịch nước ban hành lệnh/i.test(t);
  if (isPresidentialOrder) {
    return {
      isFiltered: true,
      category: 'công_bố_lệnh',
      reasonVi: 'Công bố Lệnh của Chủ tịch nước / Pháp lệnh công bố luật thường quy của Nhà nước',
    };
  }

  // 3. Ngoại lệ nghiêm ngặt: Các sự cố hình sự THỰC SỰ (Cán bộ cụ thể bị khởi tố, bắt giam, đại án tham nhũng, nhận hối lộ)
  const hasAcuteIncident = 
    /khởi tố bị can|khởi tố cán bộ|bắt tạm giam cán bộ|cán bộ nhận hối lộ|cán bộ vi phạm|đại án tham nhũng|vụ án xuyên việt oil|bị can đặng công khôi|chiếm dụng quỹ|gian lận hoàn thuế nghìn tỷ|tham ô tài sản/i.test(t);
  if (hasAcuteIncident) {
    return { isFiltered: false, category: 'none', reasonVi: '' };
  }

  // 4. Phát biểu chỉ đạo, đôn đốc giải ngân & quán triệt trách nhiệm của Lãnh đạo
  // (Ví dụ: "Bộ trưởng Trần Hồng Minh: Không buông lỏng trách nhiệm trong giải ngân vốn đầu tư công")
  const isLeadershipDirective =
    ((t.includes('bộ trưởng') || t.includes('thứ trưởng') || t.includes('thủ tướng') || t.includes('phó thủ tướng') || t.includes('lãnh đạo bộ')) &&
     (t.includes('không buông lỏng') || t.includes('trách nhiệm trong giải ngân') || t.includes('nêu cao trách nhiệm') ||
      t.includes('siết chặt kỷ luật') || t.includes('siết chặt kỷ cương') || t.includes('đôn đốc giải ngân') ||
      t.includes('gắn trách nhiệm') || t.includes('quyết liệt giải ngân') || t.includes('chỉ đạo giải ngân') ||
      (t.includes('giải ngân') && (t.includes('chỉ đạo') || t.includes('yêu cầu') || t.includes('đôn đốc') || t.includes('trách nhiệm'))))) ||
    /không buông lỏng (trách nhiệm|quản lý|giám sát|điều hành)|kiên quyết không buông lỏng|không được buông lỏng|không để xảy ra buông lỏng/i.test(t) ||
    /trách nhiệm trong giải ngân vốn|trách nhiệm giải ngân vốn đầu tư công|đôn đốc giải ngân vốn đầu tư công/i.test(t);

  if (isLeadershipDirective) {
    return {
      isFiltered: true,
      category: 'chỉ_đạo_điều_hành',
      reasonVi: 'Phát biểu chỉ đạo, đôn đốc công tác thường quy của Lãnh đạo (không buông lỏng trách nhiệm, đẩy nhanh tiến độ giải ngân)',
    };
  }

  // 5. Nhóm từ khóa: Luật sửa đổi / Bổ sung / Dự thảo sửa đổi
  const isLawAmendment = 
    /luật sửa đổi|sửa đổi luật|dự thảo luật sửa đổi|luật sửa đổi, bổ sung|luật sửa đổi bổ sung|sửa đổi, bổ sung một số điều|dự án luật sửa đổi|nghị quyết sửa đổi|thông tư sửa đổi|nghị định sửa đổi|hoàn thiện dự thảo luật|sửa đổi luật quản lý thuế|sửa đổi luật chứng khoán|sửa đổi luật giá/i.test(t);
  if (isLawAmendment) {
    return {
      isFiltered: true,
      category: 'luật_sửa_đổi',
      reasonVi: 'Văn bản Luật sửa đổi, bổ sung / Hoàn thiện thể chế thường quy',
    };
  }

  // 6. Nhóm từ khóa: Ngân hàng Nhà nước (Chính sách tiền tệ, điều hành lãi suất/tín dụng, hoạt động thường quy của NHNN)
  const isStateBankOfVietnam = 
    /ngân hàng nhà nước|ngân hàng nhà nước việt nam|thống đốc ngân hàng nhà nước|phó thống đốc ngân hàng nhà nước|nhnn|chính sách tiền tệ của nhnn|điều hành của ngân hàng nhà nước|thông tư của ngân hàng nhà nước|họp báo ngân hàng nhà nước|chỉ đạo của ngân hàng nhà nước|ngân hàng nhà nước họp|ngân hàng nhà nước ban hành|ngân hàng nhà nước hút ròng|ngân hàng nhà nước bơm tiền/i.test(t);
  if (isStateBankOfVietnam) {
    return {
      isFiltered: true,
      category: 'ngân_hàng_nhà_nước',
      reasonVi: 'Chính sách & Hoạt động điều hành của Ngân hàng Nhà nước',
    };
  }

  // 7. Hoạt động doanh nghiệp & ngân hàng thương mại (cổ tức bằng cổ phiếu, tăng vốn điều lệ, phát hành cổ phiếu)
  // (Ví dụ: "VPBank chốt quyền trả cổ tức bằng cổ phiếu, tăng vốn lên 100.000 tỷ đồng")
  const isCorporateActionOrBankDividend =
    isFinancialInfrastructureOrBusinessUpdate(t) ||
    /chốt quyền trả cổ tức|trả cổ tức bằng cổ phiếu|tăng vốn lên|tăng vốn điều lệ|chia cổ tức bằng cổ phiếu|chia cổ tức|phát hành cổ phiếu tăng vốn|chốt danh sách cổ đông nhận cổ tức/i.test(t) ||
    (/vpbank|vietcombank|techcombank|mbbank|bidv|vietinbank|acb|hdbank|shb|tpbank|sacombank|vIB/i.test(t) && (t.includes('cổ tức') || t.includes('tăng vốn') || t.includes('chốt quyền')));

  if (isCorporateActionOrBankDividend) {
    return {
      isFiltered: true,
      category: 'hoạt_động_doanh_nghiệp_ngân_hàng',
      reasonVi: 'Hoạt động doanh nghiệp / Ngân hàng thương mại thường quy (chi trả cổ tức, tăng vốn điều lệ)',
    };
  }

  // 8. Nghiên cứu kinh tế vĩ mô, thị trường lao động, cải cách thể chế và chuyển đổi số kỷ nguyên mới
  // (Ví dụ: "Thị trường lao động Việt Nam giai đoạn 2020-2025 dưới tác động của chuyển đổi số và bước ngoặt cải cách thể chế trong kỷ nguyên mới")
  const isMacroResearchOrLaborStudy =
    /thị trường lao động|chuyển đổi số.*cải cách thể chế|cải cách thể chế trong kỷ nguyên mới|kỷ nguyên mới|nghiên cứu thể chế|bước ngoặt cải cách thể chế|giai đoạn \d{4}-\d{4}|phát triển nguồn nhân lực|chuyển đổi số và bước ngoặt/i.test(t);

  if (isMacroResearchOrLaborStudy) {
    return {
      isFiltered: true,
      category: 'nghiên_cứu_thể_chế_vĩ_mô',
      reasonVi: 'Nghiên cứu kinh tế vĩ mô / Thị trường lao động & Cải cách thể chế trong kỷ nguyên mới',
    };
  }

  // 9. Kiểm tra thêm thông qua bộ lọc thể chế & điều hành thường quy (quản trị, giải ngân ĐTC tích cực, v.v.)
  const isRoutine = isRoutineLegalPromulgationOrGovernance(t);
  if (isRoutine) {
    return {
      isFiltered: true,
      category: 'điều_hành_thường_quy',
      reasonVi: 'Hoạt động điều hành hành chính thường quy / Nỗ lực đẩy nhanh giải ngân ĐTC địa phương',
    };
  }

  return { isFiltered: false, category: 'none', reasonVi: '' };
}

export function isNoiseGateFiltered(text: string): boolean {
  return detectNoiseGateCategory(text).isFiltered;
}

// Trigger matching engine: Evaluate scraped articles with strict Noise Gate, Filtered Announcements audit logging, and 5-level threshold mapping
export function evaluateArticlesForTriggers(
  articles: ScrapedNewsItem[],
  rules: AlertTriggerRule[] = [],
  customConfig?: AlertThresholdConfig
): ActiveAlertNotification[] {
  const matches: ActiveAlertNotification[] = [];
  const activeRules = rules.filter(r => r.enabled);
  const thresholdMap = customConfig || loadAlertThresholdConfig();

  for (const article of articles) {
    const fullText = `${article.title || ''} ${article.summary || article.snippet || ''} ${article.sentimentReason || ''} ${article.regulatoryTags?.join(' ') || ''}`.toLowerCase();

    // =========================================================================
    // 0. EXPLICIT SHORT-CIRCUIT: IGNORE 'DIEM TIN' / 'MARKET NEWS' ARTICLES
    // Theo chỉ đạo của Lãnh đạo: Bỏ qua tuyệt đối các bài viết gắn thẻ "Điểm tin" / "Market News"
    // (những bài có thẻ xám Điểm tin) trước khi chạy phân tích khoảng trống và chấm điểm ưu tiên,
    // đảm bảo chỉ có các rủi ro xã hội / chính sách thực sự mới kích hoạt cảnh báo.
    // =========================================================================
    const routineRoundup = isRoutineFinancialMarketRoundup(fullText, article);
    const hasInformationGap = /khoảng trống thông tin|chưa rõ cách tính|chưa có thông tư|chưa có hướng dẫn|mù mờ|băn khoăn kéo dài|kêu cứu/i.test(fullText);

    const isTaggedMarketOrDigest =
      Boolean(article.isMarketDigest) ||
      (routineRoundup.isRoundup && !hasInformationGap) ||
      (Array.isArray(article.categoryLabels) && article.categoryLabels.some(l => /điểm tin|market news|thị trường thuần túy|thị trường khách quan|tổng hợp giao dịch/i.test(l))) ||
      (Array.isArray(article.regulatoryTags) && article.regulatoryTags.some(t => /điểm tin|market news|thị trường thuần túy/i.test(t))) ||
      (Array.isArray((article as any).tags) && (article as any).tags.some((t: string) => /điểm tin|market news|thị trường thuần túy/i.test(t))) ||
      (typeof article.sector === 'string' && /điểm tin|market news/i.test(article.sector)) ||
      (typeof (article as any).sourceSector === 'string' && /điểm tin|market news/i.test((article as any).sourceSector)) ||
      article.informationVacuum?.gapLevel === 'MARKET_DIGEST' ||
      article.warningPipeline?.level3Action.alertLevel === 'MARKET_DIGEST' ||
      isPureMarketDynamics(fullText);

    if (isTaggedMarketOrDigest) {
      article.isMarketDigest = true;
      article.isEmergency = false;
      article.isUrgent = false;
      if (!article.warningPipeline) {
        article.warningPipeline = generateWarningPipelineModel(article);
      }
      if (article.warningPipeline) {
        article.warningPipeline.level3Action.alertLevel = 'MARKET_DIGEST';
        article.warningPipeline.level3Action.alertLevelLabelVi = 'Điểm tin Thị trường Thuần túy (Không cảnh báo)';
        article.warningPipeline.level3Action.alertLevelBadge = '📊 ĐIỂM TIN THỊ TRƯỜNG';
        article.warningPipeline.level3Action.requiresAction = false;
        const alertStage = article.warningPipeline.pipelineStages?.find(s => s.stage === 'ALERT');
        if (alertStage) {
          alertStage.titleVi = '7. Điểm tin Thị trường Thuần túy (Không cảnh báo)';
          alertStage.badge = '📊 ĐIỂM TIN THỊ TRƯỜNG';
          alertStage.summary = 'Diễn biến giao dịch chứng khoán/thị trường thuần túy (VN-Index, cổ phiếu), không thuộc diện rủi ro chính sách của Bộ Tài chính. Không kích hoạt cảnh báo.';
          alertStage.status = 'SAFE';
        }
      }
      continue; // Tuyệt đối bỏ qua, không kích hoạt chuông báo hay đưa vào danh sách cảnh báo Lãnh đạo
    }

    // =========================================================================
    // MULTI-STAGE NOISE GATE & CRISIS VALIDATION FILTER
    // Check administrative keywords presence vs crisis keywords presence
    // If 'Luật sửa đổi', 'Công bố lệnh', 'Ngân hàng nhà nước' or authority proposals are found ALONE -> route strictly to 'Filtered Announcements' audit trail
    // If found WITH high-risk terms ('hối lộ', 'sai phạm', 'khởi tố', 'bắt tạm giam', 'thất thoát', 'bao che', 'tham ô', 'chiếm dụng') -> Flag for 'Emergency' alert flow
    // =========================================================================
    const hasAdministrativeKeywords =
      /công bố lệnh|lệnh của chủ tịch nước|chủ tịch nước công bố|lệnh chủ tịch nước|ký lệnh công bố|công bố pháp lệnh|lệnh về việc công bố/i.test(fullText) ||
      /luật sửa đổi|sửa đổi luật|dự thảo luật sửa đổi|luật sửa đổi, bổ sung|luật sửa đổi bổ sung|sửa đổi, bổ sung một số điều|dự án luật sửa đổi|nghị quyết sửa đổi|thông tư sửa đổi|nghị định sửa đổi|hoàn thiện dự thảo luật/i.test(fullText) ||
      /ngân hàng nhà nước|ngân hàng nhà nước việt nam|thống đốc ngân hàng nhà nước|phó thống đốc ngân hàng nhà nước|nhnn/i.test(fullText) ||
      fullText.includes('công bố lệnh') ||
      fullText.includes('luật sửa đổi') ||
      fullText.includes('sửa đổi luật') ||
      fullText.includes('ngân hàng nhà nước') ||
      isRoutineLegalPromulgationOrGovernance(fullText) ||
      isMinistryAuthorityProposal(fullText);

    const isNegatedCrisisOrDirective =
      /không để xảy ra (sai phạm|vi phạm|thất thoát|tiêu cực)|chống (lãng phí|thất thoát|tiêu cực)|ngăn chặn (sai phạm|vi phạm|thất thoát)|xử lý (nghiêm|các trường hợp vi phạm tiến độ)|bộ trưởng.*chỉ đạo|không buông lỏng/i.test(fullText);

    const hasCrisisKeywords = !isNegatedCrisisOrDirective && (
      /hối lộ|nhận hối lộ|đưa hối lộ|môi giới hối lộ|sai phạm nghiêm trọng|khởi tố bị can|khởi tố cán bộ|khởi tố vụ án|bắt tạm giam|tham ô|lừa đảo chiếm đoạt|thao túng giá|vỡ nợ|bao che cho sai phạm|tiếp tay cho sai phạm/i.test(fullText) ||
      (fullText.includes('hối lộ') && !fullText.includes('chống hối lộ')) ||
      (fullText.includes('khởi tố') && !isMinistryAuthorityProposal(fullText)) ||
      fullText.includes('bắt tạm giam') ||
      fullText.includes('tham ô') ||
      fullText.includes('chiếm dụng')
    );

    const gateResult = detectNoiseGateCategory(fullText);
    const isFilteredAdministrativeAlone = (hasAdministrativeKeywords || gateResult.isFiltered) && !hasCrisisKeywords;
    const isAdministrativeWithCrisis = (hasAdministrativeKeywords || gateResult.isFiltered) && hasCrisisKeywords;

    // 2. Chạy thuật toán 7 bước (Signal → Context → Risk → Velocity → Impact → Escalation → Alert)
    // Tự động gán và đồng bộ warningPipeline cho bài viết nếu chưa có
    if (!article.warningPipeline) {
      article.warningPipeline = generateWarningPipelineModel(article);
    }
    const pipeline = article.warningPipeline;
    const level1Sentiment = pipeline.level1Sentiment;
    const level2Risk = pipeline.level2Risk;
    const level3Action = pipeline.level3Action;

    // 3. XỬ LÝ ĐA TẦNG CHO THÔNG BÁO HÀNH CHÍNH / THỂ CHẾ (MULTI-STAGE NOISE GATE ROUTING):
    if (isFilteredAdministrativeAlone) {
      // Nhánh 3.1: Xuất hiện đơn lẻ không có từ khóa khủng hoảng/sai phạm
      // -> TUYỆT ĐỐI LOẠI BỎ KHỎI LUỒNG CẢNH BÁO KHẨN CẤP / CẢNH BÁO NHANH VÀ ĐƯA VỀ GIÁM SÁT THƯỜNG QUY (STANDARD)
      // -> ĐỒNG THỜI GHI NHẬN VÀO 'FILTERED ANNOUNCEMENTS' AUDIT TRAIL
      level3Action.alertLevel = 'STANDARD';
      level3Action.alertLevelLabelVi = `Đã qua Noise Gate (${gateResult.reasonVi || 'Tin Thể chế / Hành chính'})`;
      level3Action.alertLevelBadge = '🚫 ĐÃ QUA NOISE GATE';
      level3Action.requiresAction = false;
      article.isEmergency = false;

      // Cập nhật thẻ kết luận trong chuỗi 7 bước
      const alertStage = pipeline.pipelineStages.find(s => s.stage === 'ALERT');
      if (alertStage) {
        alertStage.titleVi = '7. Đã qua Noise Gate (Giám sát thường quy)';
        alertStage.badge = '🚫 ĐÃ QUA NOISE GATE';
        alertStage.summary = `Bài viết thuộc nhóm: ${gateResult.reasonVi || 'Thông báo thể chế/hành chính'}. Hệ thống tự động ghi nhận vào Filtered Announcements Audit Trail và loại bỏ khỏi luồng cảnh báo khẩn cấp do không có từ khóa khủng hoảng.`;
        alertStage.status = 'SAFE';
      }

      // Ghi nhận vào Filtered Announcements Audit Trail
      const auditEntry: FilteredAnnouncementAuditItem = {
        id: `audit-${article.id}-${Date.now()}`,
        articleId: article.id,
        title: article.title,
        source: article.source,
        url: article.url,
        publishedAt: article.publishedAt,
        filteredCategory: gateResult.category !== 'none' ? gateResult.category : 'thể_chế_hành_chính',
        reasonVi: gateResult.reasonVi || 'Văn bản hành chính / Thông báo thể chế thường quy',
        riskScore: level2Risk.riskScore || 0,
        alertLevel: 'STANDARD',
        pipelineStatus: 'SAFE',
        timestamp: new Date().toLocaleTimeString('vi-VN'),
      };
      logFilteredAnnouncementToAuditTrail(auditEntry);

      // Gắn cờ trên article để tham chiếu UI / Debug
      (article as any).isAdministrativeAnnouncement = true;
      (article as any).noiseGateAudit = auditEntry;

      console.info(`[FILTERED ANNOUNCEMENTS AUDIT TRAIL] Logged administrative announcement: "${article.title}" — Reason: ${gateResult.reasonVi || 'Administrative without crisis'}`);

      // Tuyệt đối KHÔNG tạo thông báo cảnh báo nguy cấp gửi tới Lãnh đạo
      continue;
    }

    if (isAdministrativeWithCrisis) {
      // Nhánh 3.2: Có chứa văn bản hành chính/ngân hàng nhà nước/luật sửa đổi NHƯNG ĐỒNG THỜI PHÁT SINH TỪ KHÓA KHỦNG HOẢNG (hối lộ, sai phạm, bao che, bắt giam, thất thoát)
      // -> BẮT BUỘC KÍCH HOẠT LUỒNG CẢNH BÁO KHẨN CẤP (EMERGENCY)
      article.isEmergency = true;
      level2Risk.riskScore = Math.max(level2Risk.riskScore || 0, 85);
      level3Action.alertLevel = 'EMERGENCY';
      level3Action.alertLevelLabelVi = 'Cảnh báo Nguy cấp Khẩn cấp (EMERGENCY) - Phát hiện Sai phạm / Hối lộ / Khủng hoảng';
      level3Action.alertLevelBadge = '🚨 CẢNH BÁO ĐỎ: NGUY CẤP (EMERGENCY)';
      level3Action.requiresAction = true;

      const alertStage = pipeline.pipelineStages.find(s => s.stage === 'ALERT');
      if (alertStage) {
        alertStage.titleVi = '7. Cảnh báo Nguy cấp (EMERGENCY)';
        alertStage.badge = '🚨 EMERGENCY';
        alertStage.summary = `Phát hiện yếu tố khủng hoảng trọng điểm (hối lộ, sai phạm, bao che, thất thoát) trong văn bản/lĩnh vực thể chế. Kích hoạt quy trình xử lý khẩn cấp của Lãnh đạo Bộ.`;
        alertStage.status = 'CRITICAL';
      }
    }

    // 4. Đánh giá Dấu hiệu Khủng hoảng (Crisis Signs) từ Mức độ 2 (RISK):
    // - 1. Tổn hại uy tín (Reputation Damage)
    // - 2. Quy kết trách nhiệm (Blame Attribution)
    // - 3. Kiến nghị & Yêu cầu (Policy Petitions)
    // - 4. Môi trường đầu tư & Quyền lợi (Investor & Business Impact)
    const crisisSigns: string[] = [];
    let crisisCriteriaCount = 0;

    if (level2Risk.criteria.reputationDamage.hasRisk) {
      crisisSigns.push(`Tổn hại uy tín (${level2Risk.criteria.reputationDamage.score}%)`);
      crisisCriteriaCount++;
    }
    if (level2Risk.criteria.blameAttribution.hasRisk) {
      crisisSigns.push(`Quy kết trách nhiệm (${level2Risk.criteria.blameAttribution.score}%)`);
      crisisCriteriaCount++;
    }
    if (level2Risk.criteria.policyPetitions.hasRisk) {
      crisisSigns.push(`Kiến nghị & Yêu cầu (${level2Risk.criteria.policyPetitions.score}%)`);
      crisisCriteriaCount++;
    }
    if (level2Risk.criteria.investorBizImpact.hasRisk) {
      crisisSigns.push(`Ảnh hưởng đầu tư & DN (${level2Risk.criteria.investorBizImpact.score}%)`);
      crisisCriteriaCount++;
    }

    // 5. Ánh xạ rủi ro sang 5 cấp độ cảnh báo chính thức theo Thang điểm 5 cấp độ chuẩn:
    // Cấp 0 (STANDARD): 0–19đ (Giám sát thường quy - KHÔNG CẢNH BÁO)
    // Cấp 1 (DISTANT - Cảnh Báo Xa): 20–39đ
    // Cấp 2 (EARLY - Cảnh Báo Sớm / Cần Lưu Tâm): 40–59đ
    // Cấp 3 (RAPID - Cảnh Báo Nhanh): 60–74đ
    // Cấp 4 (EMERGENCY - Cảnh Báo Khẩn Cấp): 75–100đ
    const riskScore = Number(level2Risk.riskScore ?? article.riskScore ?? 0);
    const urgencyCheck = classifyArticleUrgency(article);
    const vacuumGapLevel = article.informationVacuum?.gapLevel || pipeline.informationVacuum?.gapLevel;
    let automatedAlertLevel: WarningAlertLevelType = 'STANDARD';

    if (
      level3Action.alertLevel === 'MARKET_DIGEST' ||
      level3Action.alertLevel === 'STANDARD' ||
      urgencyCheck.category === 'market_digest' ||
      urgencyCheck.category === 'routine' ||
      vacuumGapLevel === 'MARKET_DIGEST' ||
      vacuumGapLevel === 'NO_GAP' ||
      vacuumGapLevel === 'MONITORING_NO_ALERT' ||
      article.informationVacuum?.isAlertWarranted === false
    ) {
      automatedAlertLevel = 'STANDARD';
    } else if (riskScore >= 75 || article.isEmergency) {
      automatedAlertLevel = 'EMERGENCY'; // Cấp 4: Cảnh Báo Khẩn Cấp (75–100đ)
      article.isEmergency = true;
    } else if (riskScore >= 60) {
      automatedAlertLevel = 'RAPID';     // Cấp 3: Cảnh Báo Nhanh (60–74đ)
    } else if (riskScore >= 40) {
      automatedAlertLevel = 'EARLY';     // Cấp 2: Cảnh Báo Sớm (40–59đ - Cấp phòng ngừa quan trọng nhất)
    } else if (riskScore >= 20 || (article.informationVacuum?.hasGap && article.informationVacuum?.isAlertWarranted)) {
      automatedAlertLevel = 'DISTANT';   // Cấp 1: Cảnh Báo Xa (20–39đ)
    } else {
      automatedAlertLevel = 'STANDARD';  // Giám sát thường quy (<20đ)
    }

    // Đồng bộ ngược lại pipeline level3Action
    level3Action.alertLevel = automatedAlertLevel;
    const thresholdConfig = thresholdMap[automatedAlertLevel] || thresholdMap.STANDARD;
    level3Action.alertLevelLabelVi = thresholdConfig.nameVi;
    level3Action.alertLevelBadge = thresholdConfig.badge;
    level3Action.urgencyTiming = thresholdConfig.timing;

    // 6. Kiểm tra với các quy tắc người dùng tùy chỉnh (User Defined Rules) nếu có:
    let matchedRule: AlertTriggerRule | null = null;
    let matchedKeywords: string[] = [];

    for (const rule of activeRules) {
      const kws = rule.keywords.filter(kw => fullText.includes(kw.toLowerCase()));
      if (kws.length === 0) continue;

      // Kiểm tra Bộ lọc Phủ định / Loại trừ (Negation Exceptions - VD: 'không buông lỏng', 'đôn đốc giải ngân')
      if (rule.negationExceptions && rule.negationExceptions.length > 0) {
        const hasNegation = rule.negationExceptions.some(neg => fullText.includes(neg.toLowerCase()));
        if (hasNegation) {
          // Bỏ qua quy tắc này vì phát hiện cụm từ phủ định hoặc quán triệt chỉ đạo
          continue;
        }
      }

      if (article.buzzScore < rule.minBuzzScore) continue;
      if (rule.minImpactScore && (article.impactScore || 50) < rule.minImpactScore) continue;
      if (rule.requireVelocitySpike && article.velocityStatus !== 'spike' && !article.isEmergency) continue;
      if (rule.requireTier1 && article.tierLevel !== 1) continue;
      if (rule.sentimentFilter === 'bearish_only' && article.sentiment !== 'bearish') continue;
      if (rule.sentimentFilter === 'bullish_only' && article.sentiment !== 'bullish') continue;

      matchedRule = rule;
      matchedKeywords = kws;
      break;
    }

    // 7. Gán cấp độ cảnh báo tự động & Tuân thủ nghiêm ngặt 4 cấp độ độc lập:
    // - Khẩn cấp: >= 75đ (EMERGENCY)
    // - Cảnh báo nhanh: 60–74đ (RAPID)
    // - Cảnh báo sớm: 40–59đ (EARLY)
    // - Cảnh báo xa: 20–39đ (DISTANT)
    // - Giám sát thường quy: < 20đ -> STANDARD (KHÔNG CẢNH BÁO)
    let finalAlertLevel: WarningAlertLevelType = automatedAlertLevel;
    if (matchedRule?.alertLevel) {
      const ruleLvl = matchedRule.alertLevel;
      if (ruleLvl === 'EMERGENCY' && riskScore >= 75) finalAlertLevel = 'EMERGENCY';
      else if (ruleLvl === 'RAPID' && riskScore >= 60 && riskScore < 75) finalAlertLevel = 'RAPID';
      else if (ruleLvl === 'EARLY' && riskScore >= 40 && riskScore < 60) finalAlertLevel = 'EARLY';
      else if (ruleLvl === 'DISTANT' && riskScore >= 20 && riskScore < 40) finalAlertLevel = 'DISTANT';
    }

    if (riskScore < 20 && !article.informationVacuum?.hasGap && !article.isEmergency) {
      finalAlertLevel = 'STANDARD';
    }

    const hasActiveWarning = finalAlertLevel !== 'STANDARD' && (riskScore >= 20 || (Boolean(article.informationVacuum?.hasGap) && article.informationVacuum?.isAlertWarranted) || article.isEmergency);

    if (hasActiveWarning) {
      // Xác định mức độ ưu tiên theo Bảng Cấu hình Ngưỡng (AlertThresholdConfig)
      const currentThreshold = thresholdMap[finalAlertLevel] || thresholdMap.STANDARD;
      const priorityLevel = matchedRule 
        ? matchedRule.priorityLevel 
        : currentThreshold.priorityLevel;

      let executiveTriggerName = matchedRule ? matchedRule.name : '';
      if (!executiveTriggerName) {
        switch (finalAlertLevel) {
          case 'EMERGENCY':
            executiveTriggerName = '🚨 Cảnh Báo Khẩn Cấp (Emergency Alert)';
            break;
          case 'RAPID':
            executiveTriggerName = '⚡ Cảnh Báo Nhanh (Rapid Alert)';
            break;
          case 'EARLY':
            executiveTriggerName = '⏳ Cần Lưu Tâm & Dự Báo Sớm';
            break;
          default:
            executiveTriggerName = `${currentThreshold.badge}: ${currentThreshold.nameVi}`;
            break;
        }
      }

      const triggerId = matchedRule 
        ? matchedRule.id 
        : `pipeline-${finalAlertLevel.toLowerCase()}`;

      // Làm sạch danh mục từ khóa / dấu hiệu nhận diện cho Lãnh đạo
      const cleanKeywords = matchedKeywords.length > 0 
        ? matchedKeywords 
        : (crisisSigns.length > 0 
            ? crisisSigns.map(s => s.replace(/\s*\(\d+%\)/g, '')) 
            : [currentThreshold.badge]);

      // Gắn với thời gian thực tế xuất hiện của tin bài (thời gian xuất bản thực)
      const realPublishedTime = formatNewsFullDateTime(article) || article.timeAgo || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

      // Trích xuất Khoảng trống thông tin & Việc cần làm ngay
      const vacuum = article.informationVacuum || article.warningPipeline?.informationVacuum;
      const pipelineLevel3 = article.warningPipeline?.level3Action;

      const informationGap = vacuum?.gapDetails || (
        finalAlertLevel === 'EARLY'
          ? 'Khoảng trống thông tin hướng dẫn thực thi hoặc băn khoăn thủ tục từ người nộp thuế & doanh nghiệp.'
          : finalAlertLevel === 'RAPID'
          ? 'Độ vênh giữa cam kết chỉ đạo và thực tế triển khai gây áp lực quy kết trách nhiệm cho Bộ.'
          : 'Khoảng trống thông tin nghiêm trọng bị lợi dụng phát tán tin đồn sai lệch, cần phản ứng trong 2–4 giờ.'
      );

      const actionRequired = vacuum?.recommendedClosureAction || (
        pipelineLevel3?.actionPlaybook?.[0]?.actions?.join(' • ') ||
        (finalAlertLevel === 'EARLY'
          ? 'Làm việc với Cục/Vụ chuyên môn làm rõ vướng mắc; hoàn thiện ngân hàng Q&A và bài hướng dẫn nghiệp vụ/infographic.'
          : finalAlertLevel === 'RAPID'
          ? 'Báo cáo nhanh Lãnh đạo Bộ, phân công đầu mối phát ngôn và phối hợp cơ quan báo chí chủ lực trong ngày.'
          : 'Kích hoạt ngay Tổ phản ứng nhanh khủng hoảng truyền thông; họp báo hoặc phát thông cáo trong 2–4 giờ.')
      );

      const publicConfusionRisk = vacuum?.publicConfusionRisk || 'Cần chủ động định hướng để tránh thị trường tự phát suy diễn.';
      const responsibleUnit = pipelineLevel3?.leadUnit || article.agencies?.[0] || 'Bộ Tài chính';

      matches.push({
        id: `alert-${triggerId}-${article.id}`,
        triggerId,
        triggerName: executiveTriggerName,
        priorityLevel,
        alertLevel: finalAlertLevel,
        article,
        triggeredAt: realPublishedTime,
        matchedKeywords: Array.from(new Set(cleanKeywords)),
        informationGap,
        actionRequired,
        publicConfusionRisk,
        responsibleUnit,
      });
    }
  }

  // Sắp xếp ưu tiên dành cho Lãnh đạo: Cấp 4 (EMERGENCY) -> Cấp 3 (RAPID) -> Cấp 2 (EARLY) -> Cấp 1 (DISTANT)
  const alertLevelOrder: Record<WarningAlertLevelType, number> = {
    EMERGENCY: 4,
    RAPID: 3,
    EARLY: 2,
    DISTANT: 1,
    STANDARD: 0,
    MARKET_DIGEST: -1,
  };

  matches.sort((a, b) => {
    const levelDiff = (alertLevelOrder[b.alertLevel || 'STANDARD'] || 0) - (alertLevelOrder[a.alertLevel || 'STANDARD'] || 0);
    if (levelDiff !== 0) return levelDiff;
    const scoreA = (a.article.isEmergency ? 100 : 0) + (a.article.impactScore || 50);
    const scoreB = (b.article.isEmergency ? 100 : 0) + (b.article.impactScore || 50);
    return scoreB - scoreA;
  });

  return matches;
}

// Pre-packaged Simulation Scenarios for Ministry of Finance Leadership Testing
export interface SimulationScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  article: ScrapedNewsItem;
  triggerName: string;
  priorityLevel: 'critical' | 'high' | 'medium';
  alertLevel?: WarningAlertLevelType;
}

export const MOF_SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: 'sim-crisis-bonds-spike',
    name: 'Bùng nổ tin đồn Chậm thanh toán Trái phiếu Bất động sản 12.000 tỷ',
    category: 'Thị trường Vốn & TPDN',
    description: 'Nhiều hội nhóm chia sẻ thông tin tập đoàn BĐS lớn không thu xếp được dòng tiền đáo hạn trái phiếu, lan rộng tâm lý bán tháo.',
    triggerName: 'Đột biến Trái phiếu & Chậm thanh toán / Vỡ nợ',
    priorityLevel: 'critical',
    alertLevel: 'EMERGENCY',
    article: {
      id: 'sim-art-101',
      title: 'Khẩn cấp: Rộ tin đồn tập đoàn bất động sản lớn chậm thanh toán gốc lãi lô trái phiếu 12.000 tỷ đồng sắp đáo hạn',
      summary: 'Dư luận và các diễn đàn tài chính đang xôn xao trước thông tin một doanh nghiệp BĐS quy mô lớn đề xuất lùi thời hạn thanh toán lô trái phiếu riêng lẻ. Áp lực lan truyền nhanh chóng khiến nhiều trái chủ lo ngại rủi ro vỡ nợ chéo.',
      url: 'https://chinhphu.vn/thong-tin-tai-chinh-trai-phieu-101',
      source: 'Cổng TTĐT Chính phủ & Báo Tài chính',
      publishedAt: '5 phút trước',
      timeAgo: '5 phút trước',
      sector: 'bonds',
      sectorNameVi: 'Thị trường Trái phiếu',
      sentiment: 'bearish',
      sentimentScore: -88,
      sentimentReason: 'Ghi nhận dấu hiệu áp lực thanh khoản trái phiếu tăng đột biến, tiềm ẩn rủi ro lây lan tâm lý tiêu cực tới thị trường vốn.',
      impactLevel: 'high',
      impactScore: 92,
      tierLevel: 1,
      buzzScore: 96,
      timeDecayScore: 96,
      velocityStatus: 'spike',
      authorityLevel: 'official_gov',
      authorityWeight: 1.8,
      isOfficialSource: true,
      sourceCount: 3,
      isEmergency: true,
      tickers: ['NVL', 'PDR', 'DIG'],
      keyPeople: ['Lãnh đạo Bộ Tài chính', 'Chủ tịch UBCKNN'],
      policyTags: ['Nghị định 08/2023/NĐ-CP', 'Nghị định 65/2022/NĐ-CP'],
      agencies: ['Bộ Tài chính', 'UBCKNN', 'Sở Giao dịch Chứng khoán Hà Nội'],
      marketImplication: 'Tạo áp lực điều chỉnh mạnh lên nhóm cổ phiếu BĐS và quỹ đầu tư trái phiếu; yêu cầu khoanh vùng sự việc.',
      keyPoints: [
        'Lô trái phiếu 12.000 tỷ đối mặt rủi ro chậm thanh toán khi đến hạn',
        'Tâm lý nhà đầu tư cá nhân trên các hội nhóm biến động dữ dội',
        'Cần kích hoạt cơ chế đàm phán cơ cấu nợ theo Nghị định 08',
      ],
      sixW: {
        who: 'Tập đoàn BĐS lớn và các trái chủ cá nhân',
        doingWhat: 'Đề xuất lùi thời hạn thanh toán lô trái phiếu 12.000 tỷ',
        aboutWhat: 'Rủi ro chậm trả nợ trái phiếu doanh nghiệp riêng lẻ khi đến hạn',
        resultOutcome: 'Gia tăng áp lực thanh khoản và kích hoạt tâm lý lo ngại vỡ nợ chéo',
        whoIsAffected: 'Nhà đầu tư cá nhân, quỹ mở trái phiếu và thị trường BĐS',
        reaction: 'Tâm lý thị trường hoang mang, xuất hiện bán tháo trên các diễn đàn',
        recommendation: 'Kích hoạt đàm phán cơ cấu nợ theo Nghị định 08 và phát ngôn chính thức',
      },
      policyResponseAdvisor: '[CHỈ ĐẠO KHẨN CẤP] 1. Thanh tra - Giám sát: Yêu cầu HNX và tổ chức lưu ký báo cáo chi tiết cơ cấu trái chủ và khả năng thanh toán thực tế của doanh nghiệp trong 4h; 2. Phối hợp Liên ngành: Làm việc với NHNN để kiểm soát rủi ro tín dụng liên quan; 3. Truyền thông: Phát thông cáo chính thức về khung pháp lý đàm phán gia hạn theo Nghị định 08 để trấn an nhà đầu tư.',
    },
  },
  {
    id: 'sim-reform-upgrade-spike',
    name: 'Bộ Tài chính ban hành Thông tư tháo gỡ Non-prefunding Nâng hạng TTCK',
    category: 'Chứng khoán & Nâng hạng',
    description: 'Chính thức công bố quy định bỏ ký quỹ 100% trước giao dịch đối với khối ngoại, giải quyết nút thắt lớn nhất của FTSE.',
    triggerName: 'Nâng hạng TTCK & Thể chế Non-prefunding',
    priorityLevel: 'high',
    alertLevel: 'RAPID',
    article: {
      id: 'sim-art-102',
      title: 'Bộ Tài chính ban hành Thông tư cơ chế Non-prefunding: Khơi thông dòng vốn ngoại, hoàn tất tiêu chí nâng hạng thị trường',
      summary: 'Bộ Tài chính vừa chính thức ký ban hành Thông tư sửa đổi các quy định về giao dịch chứng khoán, cho phép nhà đầu tư tổ chức nước ngoài thực hiện mua cổ phiếu không bắt buộc ký quỹ 100% tiền mặt. Đây là bước tiến quyết định giúp Việt Nam đáp ứng trọn vẹn tiêu chí xếp hạng của FTSE Russell.',
      url: 'https://mof.gov.vn/webcenter/portal/btc/r/m/tin-tuc-su-kien/chi-tiet-tin?dDocName=BTC_UPGRADE_68',
      source: 'Cổng TTĐT Bộ Tài chính (mof.gov.vn)',
      publishedAt: '12 phút trước',
      timeAgo: '12 phút trước',
      sector: 'stocks',
      sectorNameVi: 'Thị trường Chứng khoán',
      sentiment: 'bullish',
      sentimentScore: 94,
      sentimentReason: 'Đột phá thể chế cốt lõi mở đường đón dòng vốn nước ngoài hàng tỷ USD, tháo gỡ điểm nghẽn lịch sử của thị trường chứng khoán Việt Nam.',
      impactLevel: 'high',
      impactScore: 98,
      tierLevel: 1,
      buzzScore: 95,
      timeDecayScore: 95,
      velocityStatus: 'spike',
      authorityLevel: 'official_gov',
      authorityWeight: 1.8,
      isOfficialSource: true,
      sourceCount: 4,
      tickers: ['SSI', 'VND', 'VCI', 'VCB', 'FPT'],
      keyPeople: ['Bộ trưởng Bộ Tài chính', 'Chủ tịch UBCKNN'],
      policyTags: ['Thông tư 68/2024/TT-BTC', 'Luật Chứng khoán'],
      agencies: ['Bộ Tài chính', 'UBCKNN', 'VSDC', 'HOSE'],
      marketImplication: 'Kích thích dòng vốn khối ngoại quay lại mua ròng mạnh mẽ, tâm lý toàn thị trường bùng nổ tích cực.',
      keyPoints: [
        'Chính thức xóa bỏ rào cản ký quỹ trước 100% đối với NĐT nước ngoài',
        'Đáp ứng trọn vẹn 2 tiêu chí khắt khe còn lại của tổ chức xếp hạng FTSE',
        'Tạo tiền đề thu hút từ 3 đến 5 tỷ USD vốn ngoại vào rổ chỉ số',
      ],
      sixW: {
        who: 'Bộ Tài chính, UBCKNN, nhà đầu tư nước ngoài và các CTCK',
        doingWhat: 'Ban hành thông tư cơ chế Non-prefunding cho NĐT nước ngoài',
        aboutWhat: 'Xóa bỏ yêu cầu ký quỹ 100% tiền mặt trước khi đặt lệnh mua cổ phiếu',
        resultOutcome: 'Hoàn thành tiêu chí nâng hạng quyết định của FTSE Russell',
        whoIsAffected: 'Khối ngoại, các công ty chứng khoán và thị trường niêm yết',
        reaction: 'Thị trường hưng phấn, kỳ vọng hút 3-5 tỷ USD dòng vốn quốc tế',
        recommendation: 'Tổ chức hội nghị quảng bá quốc tế và đôn đốc giám sát rủi ro thanh toán',
      },
      policyResponseAdvisor: '[THAM MƯU THỊ TRƯỜNG CHỨNG KHOÁN] 1. Lộ trình Nâng hạng: Tổ chức hội nghị giới thiệu quy chế mới tới các định chế tài chính quốc tế (Citi, Morgan Stanley, HSBC); 2. Giám sát giao dịch: Đôn đốc VSDC và CTCK kiểm soát rủi ro thanh toán bảo đảm an toàn hệ thống; 3. Nâng cao chất lượng: Thúc đẩy tiến độ IPO các tập đoàn lớn.',
    },
  },
  {
    id: 'sim-tax-fraud-spike',
    name: 'Phát hiện đường dây Gian lận Hóa đơn điện tử quy mô 8.000 tỷ',
    category: 'Thuế & Hóa đơn số',
    description: 'Cơ quan thuế phối hợp Công an triệt phá đường dây thành lập 50 công ty ma mua bán hóa đơn VAT khống.',
    triggerName: 'Gian lận Hóa đơn điện tử & Thất thu Thuế lớn',
    priorityLevel: 'critical',
    alertLevel: 'EMERGENCY',
    article: {
      id: 'sim-art-103',
      title: 'Triệt phá đường dây mua bán hóa đơn điện tử khống trị giá 8.000 tỷ đồng, thu lợi bất chính hàng trăm tỷ',
      summary: 'Cục Thuế cùng Cơ quan An ninh điều tra đã phong tỏa chuỗi 50 doanh nghiệp có hành vi phát hành và mua bán hóa đơn giá trị gia tăng khống nhằm chiếm đoạt tiền hoàn thuế và trốn thuế TNDN quy mô đặc biệt lớn.',
      url: 'https://gdt.gov.vn/wps/portal/gdt_hoa_don_dien_tu_8000ty',
      source: 'Cổng TTĐT Cục Thuế (gdt.gov.vn)',
      publishedAt: '8 phút trước',
      timeAgo: '8 phút trước',
      sector: 'tax',
      sectorNameVi: 'Thuế & Ngân sách',
      sentiment: 'bearish',
      sentimentScore: -75,
      sentimentReason: 'Vụ việc gian lận hóa đơn quy mô lớn gây tổn hại ngân sách và ảnh hưởng trật tự kinh tế số.',
      impactLevel: 'high',
      impactScore: 88,
      tierLevel: 1,
      buzzScore: 89,
      timeDecayScore: 89,
      velocityStatus: 'spike',
      authorityLevel: 'official_gov',
      authorityWeight: 1.8,
      isOfficialSource: true,
      sourceCount: 3,
      isEmergency: true,
      tickers: [],
      keyPeople: ['Cục trưởng Cục Thuế'],
      policyTags: ['Luật Quản lý Thuế', 'Nghị định 123/2020/NĐ-CP'],
      agencies: ['Cục Thuế', 'Bộ Công an', 'Bộ Tài chính'],
      marketImplication: 'Răn đe mạnh mẽ các hành vi gian lận hóa đơn; củng cố niềm tin vào hệ thống quản lý thuế số.',
      keyPoints: [
        'Triệt phá 50 công ty ma phát hành khống 8.000 tỷ đồng hóa đơn điện tử',
        'Thu hồi số tiền hoàn thuế bất chính hàng trăm tỷ đồng cho ngân sách',
        'Nâng cấp hệ thống AI rà soát rủi ro hóa đơn thời gian thực',
      ],
      sixW: {
        who: 'Cục Thuế, Cục Cảnh sát kinh tế (C03) và đường dây vi phạm',
        doingWhat: 'Bóc gỡ đường dây mua bán hóa đơn khống và trốn thuế quy mô 8.000 tỷ',
        aboutWhat: 'Hành vi phát hành hóa đơn VAT giả nhằm chiếm đoạt tiền hoàn thuế',
        resultOutcome: 'Phong tỏa 50 doanh nghiệp ma và thu hồi hàng trăm tỷ về ngân sách',
        whoIsAffected: 'Cơ quan thuế, ngân sách nhà nước và các đối tác liên quan',
        reaction: 'Cộng đồng doanh nghiệp ủng hộ siết chặt kỷ cương quản lý thuế số',
        recommendation: 'Kích hoạt AI quét bất thường chuỗi hóa đơn và tạm dừng các bộ hồ sơ rủi ro cao',
      },
      policyResponseAdvisor: '[THAM MƯU CHÍNH SÁCH THUẾ] 1. Chống gian lận hóa đơn: Kích hoạt thuật toán AI quét bất thường chuỗi mua bán trên toàn quốc; 2. Hoàn thuế VAT: Tạm dừng hoàn thuế các hồ sơ có đối tác nằm trong danh sách rủi ro cao; 3. Truyền thông: Công bố kết quả triệt phá để giáo dục ý thức tuân thủ pháp luật thuế.',
    },
  },
  {
    id: 'sim-debunk-spike',
    name: 'Bác bỏ tin đồn thất thiệt liên quan đến Ngân sách và Hệ thống Ngân hàng',
    category: 'Đính chính & Bác tin đồn',
    description: 'Cơ quan quản lý chính thức lên tiếng bác bỏ thông tin sai sự thật lan truyền trên mạng xã hội.',
    triggerName: 'Bác bỏ Tin đồn Thất thiệt & Đính chính Chính sách',
    priorityLevel: 'medium',
    alertLevel: 'EARLY',
    article: {
      id: 'sim-art-104',
      title: 'Bộ Tài chính và Cơ quan quản lý chính thức bác bỏ tin đồn thất thiệt về việc điều chỉnh chính sách thuế và tỷ giá đột ngột',
      summary: 'Đại diện Bộ Tài chính khẳng định thông tin lan truyền trên các trang mạng xã hội về việc áp thuế đột xuất là hoàn toàn sai sự thật, không có căn cứ. Mọi chủ trương, chính sách tài khóa luôn được công khai, minh bạch theo đúng quy trình của pháp luật.',
      url: 'https://mof.gov.vn/webcenter/portal/btc/r/m/tin-tuc-su-kien/dinh-chinh-tin-don',
      source: 'Cổng TTĐT Bộ Tài chính (mof.gov.vn)',
      publishedAt: '15 phút trước',
      timeAgo: '15 phút trước',
      sector: 'tax',
      sectorNameVi: 'Chính sách & Điều hành',
      sentiment: 'neutral',
      sentimentScore: 25,
      sentimentReason: 'Bài viết chính thức bác bỏ tin đồn thất thiệt, giải tỏa tâm lý e ngại cho thị trường và bảo đảm môi trường kinh doanh minh bạch.',
      impactLevel: 'medium',
      impactScore: 72,
      tierLevel: 1,
      buzzScore: 84,
      timeDecayScore: 84,
      velocityStatus: 'spike',
      authorityLevel: 'official_gov',
      authorityWeight: 1.8,
      isOfficialSource: true,
      isDebunkedOrClarified: true,
      sourceCount: 4,
      tickers: [],
      keyPeople: ['Người phát ngôn Bộ Tài chính'],
      policyTags: ['Chính sách Tài khóa'],
      agencies: ['Bộ Tài chính', 'Bộ Thông tin và Truyền thông', 'Bộ Công an'],
      marketImplication: 'Dập tắt tâm lý hoang mang, giữ vững ổn định thanh khoản và kỳ vọng thị trường.',
      keyPoints: [
        'Bộ Tài chính phủ nhận hoàn toàn tin đồn thay đổi chính sách đột ngột',
        'Các chính sách tài khóa được vận hành nhất quán theo đúng kế hoạch',
        'Chuyển cơ quan chức năng điều tra các đối tượng tung tin trục lợi',
      ],
      sixW: {
        who: 'Người phát ngôn Bộ Tài chính, cơ quan an ninh mạng và cộng đồng mạng',
        doingWhat: 'Chính thức bác bỏ thông tin sai lệch về điều chỉnh thuế suất đột xuất',
        aboutWhat: 'Tin đồn thất thiệt lan truyền gây bất an tâm lý thị trường tài chính',
        resultOutcome: 'Giải tỏa mối lo ngại vô căn cứ, duy trì trật tự và niềm tin tài chính',
        whoIsAffected: 'Cộng đồng doanh nghiệp, nhà đầu tư và người nộp thuế',
        reaction: 'Dư luận an tâm trở lại, các diễn đàn hạ nhiệt thông tin hoang mang',
        recommendation: 'Phối hợp báo chí chủ lực đăng thông cáo đính chính và xử lý nghiêm đối tượng tung tin',
      },
      policyResponseAdvisor: '[THAM MƯU TRUYỀN THÔNG & ĐỊNH HƯỚNG] 1. Truyền thông: Phối hợp các cơ quan báo chí chủ lực đồng loạt đăng tải thông cáo đính chính; 2. Xử lý vi phạm: Chuyển thông tin các tài khoản mạng xã hội tung tin thất thiệt sang Bộ Công an xử lý nghiêm theo Luật An ninh mạng.',
    },
  },
  {
    id: 'sim-routine-governance-leadership',
    name: 'Bộ trưởng Trần Hồng Minh: Không buông lỏng trách nhiệm trong giải ngân vốn đầu tư công',
    category: 'Giám sát Thường quy & Chỉ đạo Điều hành',
    description: 'Phát biểu chỉ đạo điều hành thông thường của Lãnh đạo. Hệ thống áp dụng Noise Gate và Bộ lọc Phủ định (Negation Exception) tự động phân loại Cấp 5 (STANDARD), KHÔNG kích hoạt cảnh báo tiêu điểm.',
    triggerName: 'Giám Sát Thường Quy (Noise Gate Lọc Chỉ Đạo Hành Chính)',
    priorityLevel: 'medium',
    alertLevel: 'STANDARD',
    article: {
      id: 'sim-art-105',
      title: 'Bộ trưởng Trần Hồng Minh: Không buông lỏng trách nhiệm trong giải ngân vốn đầu tư công',
      summary: 'Tại cuộc họp giao ban sáng nay, Bộ trưởng Trần Hồng Minh quán triệt tinh thần quyết liệt đôn đốc tiến độ các dự án trọng điểm, yêu cầu các đơn vị trực thuộc không buông lỏng trách nhiệm trong công tác giải ngân vốn đầu tư công những tháng cuối năm.',
      url: 'https://mof.gov.vn/webcenter/portal/btc/r/m/tin-tuc-su-kien/giai-ngan-dau-tu-cong',
      source: 'Cổng TTĐT Bộ Tài chính (mof.gov.vn)',
      publishedAt: '20 phút trước',
      timeAgo: '20 phút trước',
      sector: 'tax',
      sectorNameVi: 'Đầu tư công & Ngân sách',
      sentiment: 'neutral',
      sentimentScore: 15,
      sentimentReason: 'Phát biểu chỉ đạo điều hành hành chính thông thường của người đứng đầu, quán triệt trách nhiệm đẩy nhanh giải ngân vốn đầu tư công.',
      impactLevel: 'medium',
      impactScore: 52,
      tierLevel: 1,
      buzzScore: 68,
      timeDecayScore: 68,
      velocityStatus: 'normal',
      authorityLevel: 'official_gov',
      authorityWeight: 1.8,
      isOfficialSource: true,
      sourceCount: 2,
      tickers: [],
      keyPeople: ['Bộ trưởng Trần Hồng Minh'],
      policyTags: ['Đầu tư công', 'Giải ngân vốn', 'Chỉ đạo điều hành'],
      agencies: ['Bộ Tài chính', 'Cục Quản lý Ngân sách'],
      marketImplication: 'Hoạt động điều hành nhà nước thông thường, không phát sinh rủi ro thể chế hay khủng hoảng truyền thông.',
      keyPoints: [
        'Bộ trưởng quán triệt không buông lỏng trách nhiệm giải ngân các dự án lớn',
        'Các vụ, cục chủ động tháo gỡ khó khăn về thủ tục hành chính',
        'Thuộc diện tin tức chỉ đạo điều hành chuẩn mực, xếp vào Giám sát Thường quy',
      ],
      sixW: {
        who: 'Bộ trưởng Trần Hồng Minh và các đơn vị trực thuộc Bộ',
        doingWhat: 'Họp chỉ đạo đôn đốc tiến độ giải ngân vốn đầu tư công',
        aboutWhat: 'Quán triệt nâng cao tinh thần trách nhiệm trong thực thi công vụ',
        resultOutcome: 'Tạo động lực giải ngân tích cực, duy trì kỷ cương ngân sách',
        whoIsAffected: 'Các ban quản lý dự án và các cục, vụ chức năng',
        reaction: 'Các đơn vị tiếp thu và xây dựng kế hoạch hành động cụ thể',
        recommendation: 'Lưu trữ vào cơ sở dữ liệu Giám sát Thường quy (Audit Log), không phát cảnh báo',
      },
      policyResponseAdvisor: '[THEO DÕI THƯỜNG QUY] Đây là phát biểu chỉ đạo hành chính thông lệ của Lãnh đạo Bộ. Hệ thống tự động phân loại STANDARD, lưu trữ vào Nhật ký Giám sát thể chế, không đưa vào danh sách cảnh báo tiêu điểm.',
    },
  },
  {
    id: 'sim-routine-can-tho',
    name: 'Cần Thơ ưu tiên hiệu quả đầu tư, khơi thông nguồn lực cho tăng trưởng',
    category: 'Điểm sáng Phát triển Kinh tế & Đầu tư Địa phương',
    description: 'Chỉ đạo phát triển kinh tế, tối ưu hóa hiệu quả đầu tư và khơi thông nguồn lực của địa phương. Hệ thống áp dụng Noise Gate tự động phân loại STANDARD (Giám sát thường quy), tuyệt đối không phát cảnh báo khẩn cấp.',
    triggerName: 'Giám Sát Thường Quy (Điểm Sáng Đầu Tư Địa Phương)',
    priorityLevel: 'medium',
    alertLevel: 'STANDARD',
    article: {
      id: 'sim-art-106',
      title: 'Cần Thơ ưu tiên hiệu quả đầu tư, khơi thông nguồn lực cho tăng trưởng',
      summary: 'Thành phố Cần Thơ đang tập trung ưu tiên nâng cao hiệu quả phân bổ vốn đầu tư công, tháo gỡ điểm nghẽn hạ tầng và khơi thông các nguồn lực xã hội nhằm tạo động lực bứt phá tăng trưởng kinh tế địa phương.',
      url: 'https://baocantho.com.vn/can-tho-uu-tien-hieu-qua-dau-tu-khoi-thong-nguon-luc-cho-tang-truong',
      source: 'Báo Cần Thơ',
      publishedAt: '12 phút trước',
      timeAgo: '12 phút trước',
      sector: 'macro',
      sectorNameVi: 'Đầu tư & Tăng trưởng',
      sentiment: 'bullish',
      sentimentScore: 40,
      sentimentReason: 'Thông tin điểm sáng tích cực về định hướng điều hành kinh tế địa phương, nâng cao hiệu quả đầu tư và khơi thông nguồn lực tăng trưởng.',
      impactLevel: 'medium',
      impactScore: 50,
      tierLevel: 2,
      buzzScore: 58,
      timeDecayScore: 58,
      velocityStatus: 'normal',
      authorityLevel: 'official_gov',
      authorityWeight: 1.5,
      isOfficialSource: true,
      sourceCount: 2,
      tickers: [],
      keyPeople: ['Lãnh đạo UBND TP Cần Thơ'],
      policyTags: ['Đầu tư công', 'Phát triển kinh tế địa phương', 'Khơi thông nguồn lực'],
      agencies: ['UBND TP Cần Thơ', 'Sở Kế hoạch và Đầu tư Cần Thơ'],
      marketImplication: 'Tác động tích cực đến niềm tin doanh nghiệp và nhà đầu tư trên địa bàn vùng Đồng bằng sông Cửu Long.',
      keyPoints: [
        'Ưu tiên bố trí vốn cho các dự án hạ tầng giao thông kết nối liên vùng',
        'Cải cách thủ tục hành chính, giải quyết kịp thời vướng mắc mặt bằng',
        'Thuộc diện tin tức thành tựu và điều hành phát triển, xếp vào Giám sát Thường quy',
      ],
      sixW: {
        who: 'Chính quyền TP Cần Thơ và cộng đồng doanh nghiệp nhà đầu tư',
        doingWhat: 'Tập trung khơi thông nguồn lực và nâng cao chất lượng sử dụng vốn đầu tư',
        aboutWhat: 'Chiến lược tăng trưởng kinh tế dựa trên hiệu quả đầu tư công và tư',
        resultOutcome: 'Cải thiện môi trường kinh doanh và thúc đẩy tiến độ hạ tầng',
        whoIsAffected: 'Cộng đồng doanh nghiệp và người dân trên địa bàn thành phố',
        reaction: 'Doanh nghiệp và nhà đầu tư đồng thuận, đánh giá cao tinh thần đồng hành',
        recommendation: 'Ghi nhận vào bản tin giám sát điều hành địa phương định kỳ, không phát cảnh báo',
      },
      policyResponseAdvisor: '[GIÁM SÁT ĐỊA PHƯƠNG] Thông tin tích cực về điều hành kinh tế địa phương. Hệ thống phân loại Giám sát Thường quy (STANDARD), phục vụ theo dõi dữ liệu tổng hợp.',
    },
  },
  {
    id: 'sim-routine-institutional-money',
    name: 'Từ tháng 12/2026: Bỏ trách nhiệm của Bộ Tài chính trong kiểm tra nghiệp vụ in, đúc, tiêu hủy tiền',
    category: 'Hoàn thiện Thể chế & Phân định Thẩm quyền Quản lý Nhà nước',
    description: 'Quy định pháp lý về phân định chức năng nhiệm vụ giữa Bộ Tài chính và Ngân hàng Nhà nước; tinh gọn quy trình kiểm tra nghiệp vụ tiền tệ. Phân loại STANDARD (Giám sát thường quy), không phải rủi ro tiêu cực.',
    triggerName: 'Giám Sát Thường Quy (Phân Định Thẩm Quyền Thể Chế)',
    priorityLevel: 'medium',
    alertLevel: 'STANDARD',
    article: {
      id: 'sim-art-107',
      title: 'Từ tháng 12/2026: Bỏ trách nhiệm của Bộ Tài chính trong kiểm tra nghiệp vụ in, đúc, tiêu hủy tiền',
      summary: 'Theo quy định mới tại văn bản pháp luật vừa ban hành, từ tháng 12/2026 sẽ bãi bỏ trách nhiệm của Bộ Tài chính trong việc kiểm tra nghiệp vụ in, đúc, bảo quản, vận chuyển và tiêu hủy tiền; chuyển giao toàn diện trách nhiệm chuyên môn kỹ thuật cho Ngân hàng Nhà nước Việt Nam nhằm tinh gọn bộ máy và phân định rành mạch thẩm quyền quản lý.',
      url: 'https://vneconomy.vn/bo-trach-nhiem-kiem-tra-nghiep-vu-in-duc-tien.htm',
      source: 'VnEconomy',
      publishedAt: '25 phút trước',
      timeAgo: '25 phút trước',
      sector: 'policy',
      sectorNameVi: 'Thể chế & Pháp luật',
      sentiment: 'neutral',
      sentimentScore: 10,
      sentimentReason: 'Văn bản quy định phân định chức năng nhiệm vụ quản lý nhà nước thường quy, bãi bỏ thủ tục trung gian kỹ thuật để tinh gọn bộ máy hành chính.',
      impactLevel: 'medium',
      impactScore: 55,
      tierLevel: 1,
      buzzScore: 65,
      timeDecayScore: 65,
      velocityStatus: 'normal',
      authorityLevel: 'official_gov',
      authorityWeight: 1.8,
      isOfficialSource: true,
      sourceCount: 3,
      tickers: [],
      keyPeople: ['Lãnh đạo Bộ Tài chính', 'Thống đốc Ngân hàng Nhà nước'],
      policyTags: ['Thể chế hành chính', 'Phân định chức năng nhiệm vụ', 'Tinh gọn bộ máy'],
      agencies: ['Bộ Tài chính', 'Ngân hàng Nhà nước Việt Nam'],
      marketImplication: 'Rõ ràng thẩm quyền chuyên môn của Ngân hàng Nhà nước, giảm thiểu đầu mối kiểm tra chồng chéo giữa hai cơ quan quản lý.',
      keyPoints: [
        'Bãi bỏ khâu kiểm tra trung gian của Bộ Tài chính trong nghiệp vụ in đúc tiền tệ từ 12/2026',
        'Phân định rành mạch trách nhiệm quản trị chuyên ngành tiền tệ cho Ngân hàng Nhà nước',
        'Là cải cách phân công nhiệm vụ nhà nước tích cực, tự động xếp vào Giám sát Thường quy',
      ],
      sixW: {
        who: 'Bộ Tài chính và Ngân hàng Nhà nước Việt Nam',
        doingWhat: 'Thực hiện phân định thẩm quyền quản lý nhà nước về in, đúc, tiêu hủy tiền tệ',
        aboutWhat: 'Bãi bỏ khâu kiểm tra hành chính trung gian giữa hai cơ quan',
        resultOutcome: 'Tinh gọn tổ chức bộ máy, nâng cao hiệu lực phân công quản lý',
        whoIsAffected: 'Cục Quản lý Ngân quỹ, Ngân hàng Nhà nước và các cơ quan hữu quan',
        reaction: 'Giới chuyên gia thể chế đánh giá cao sự phân công rành mạch, đúng chuyên môn',
        recommendation: 'Lưu trữ vào Filtered Announcements Audit Trail, ghi nhận kết quả rà soát thể chế',
      },
      policyResponseAdvisor: '[THỂ CHẾ THƯỜNG QUY] Văn bản hành chính quy định phân định nhiệm vụ giữa Bộ Tài chính và Ngân hàng Nhà nước. Đã qua Noise Gate tự động, phân loại STANDARD (Giám sát Thường quy).',
    },
  },
];

export const STORAGE_KEY_SIMULATION_SCENARIOS = 'finpulse_simulation_scenarios_v2';

/**
 * Load all simulation scenarios (merges custom/edited scenarios from local cache & defaults)
 */
export function loadSimulationScenarios(): SimulationScenario[] {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return MOF_SIMULATION_SCENARIOS;
    }
    const raw = localStorage.getItem(STORAGE_KEY_SIMULATION_SCENARIOS);
    if (!raw) return MOF_SIMULATION_SCENARIOS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return MOF_SIMULATION_SCENARIOS;
  } catch (e) {
    console.error('Error loading simulation scenarios:', e);
    return MOF_SIMULATION_SCENARIOS;
  }
}

/**
 * Save all simulation scenarios to local cache and synchronize with Cloud Firestore
 */
export function saveSimulationScenarios(scenarios: SimulationScenario[]): void {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_SIMULATION_SCENARIOS, JSON.stringify(scenarios));
    // Asynchronously synchronize with Cloud Firestore
    saveSimulationScenariosToCloud(scenarios).catch((err) => {
      console.warn('Silent cloud sync for simulation scenarios failed (cached locally):', err);
    });
  } catch (e) {
    console.error('Error saving simulation scenarios:', e);
  }
}

/**
 * Add a new custom simulation scenario
 */
export function addCustomSimulationScenario(newScenario: SimulationScenario): SimulationScenario[] {
  const current = loadSimulationScenarios();
  const updated = [newScenario, ...current.filter((s) => s.id !== newScenario.id)];
  saveSimulationScenarios(updated);
  saveSimulationScenarioItemToCloud(newScenario).catch((err) => {
    console.warn('Silent cloud sync for new scenario failed:', err);
  });
  return updated;
}

/**
 * Update an existing simulation scenario
 */
export function updateSimulationScenario(updatedScenario: SimulationScenario): SimulationScenario[] {
  const current = loadSimulationScenarios();
  const updated = current.map((s) => (s.id === updatedScenario.id ? updatedScenario : s));
  saveSimulationScenarios(updated);
  saveSimulationScenarioItemToCloud(updatedScenario).catch((err) => {
    console.warn('Silent cloud sync for updated scenario failed:', err);
  });
  return updated;
}

/**
 * Delete a custom simulation scenario
 */
export function deleteCustomSimulationScenario(scenarioId: string): SimulationScenario[] {
  const current = loadSimulationScenarios();
  const updated = current.filter((s) => s.id !== scenarioId);
  saveSimulationScenarios(updated);
  deleteSimulationScenarioFromCloud(scenarioId).catch((err) => {
    console.warn('Silent cloud sync for deleted scenario failed:', err);
  });
  return updated;
}

/**
 * Reset all simulation scenarios to MOF official defaults
 */
export function resetSimulationScenarios(): SimulationScenario[] {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_SIMULATION_SCENARIOS);
    }
    saveSimulationScenariosToCloud(MOF_SIMULATION_SCENARIOS).catch((err) => {
      console.warn('Silent cloud sync for reset simulation scenarios failed:', err);
    });
  } catch (e) {
    console.error('Error resetting simulation scenarios:', e);
  }
  return MOF_SIMULATION_SCENARIOS;
}
