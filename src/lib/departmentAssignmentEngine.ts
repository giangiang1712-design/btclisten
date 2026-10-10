import {
  MofAgencyDecree376,
  MOF_34_AGENCIES_DECREE_376,
  SectorType,
  ScrapedNewsItem,
} from '../types';
import { decodeHtmlEntities } from './htmlDecoder';

export interface DepartmentAssignmentResult {
  leadAgency: MofAgencyDecree376;
  leadUnit: string;
  leadUnitShort: string;
  leadUnitId: string;
  leadFunctions: string;
  cooperatingAgencies: MofAgencyDecree376[];
  cooperatingUnits: string[];
  routingReason: string;
  legalBasis: string;
  assignmentConfidence: number; // 0 - 100%
  recommendedSopAction: string;
  dispatchDeadlineHours: number; // e.g. 2h, 4h, 24h, 48h
  isDecree376NewMandate: boolean;
  newMandateCategory?: 'BIDDING' | 'FDI' | 'STATISTICS' | 'SOCIAL_SECURITY' | 'PLANNING';
}

/**
 * Tra cứu thông tin chi tiết của bất kỳ cơ quan nào trong 34 đơn vị của Nghị định 376/2026/NĐ-CP
 */
export function getAgencyById(id: string): MofAgencyDecree376 | undefined {
  return MOF_34_AGENCIES_DECREE_376.find((a) => a.id === id);
}

export function getAll34Agencies(): MofAgencyDecree376[] {
  return MOF_34_AGENCIES_DECREE_376;
}

/**
 * Động cơ Phân công Đầu mối Tự động theo Nghị định 376/2026/NĐ-CP
 * Cơ chế: Tự động gán 1 ĐƠN VỊ CHỦ TRÌ (Lead Unit) và KÈM CÁC ĐƠN VỊ PHỐI HỢP (Cooperating Units)
 * Chuẩn hóa luồng tham mưu xử lý nội bộ cho toàn ngành Tài chính.
 */
export function assignDepartmentWorkflow(
  item: Partial<ScrapedNewsItem> | { title: string; summary?: string; sector?: string; text?: string; content?: string }
): DepartmentAssignmentResult {
  const title = decodeHtmlEntities(item.title || '');
  const summary = decodeHtmlEntities(item.summary || (item as any).snippet || '');
  const text = `${title} ${summary} ${(item as any).text || ''} ${(item as any).content || ''}`.toLowerCase();
  const currentSector = (item.sector as SectorType) || 'all';

  // Khai báo các đối tượng cơ quan chủ chốt để tiện phối hợp
  const agencyMap = new Map<string, MofAgencyDecree376>();
  for (const ag of MOF_34_AGENCIES_DECREE_376) {
    agencyMap.set(ag.id, ag);
  }

  const cucDauThau = agencyMap.get('cuc-qldt')!;
  const cucDauTuNuocNgoai = agencyMap.get('cuc-dtnn')!;
  const cucThongKe = agencyMap.get('cuc-tk')!;
  const bhxhVietNam = agencyMap.get('bhxh-vn')!;
  const vuQuyHoach = agencyMap.get('vu-qlqh')!;
  const cucThue = agencyMap.get('cuc-thue')!;
  const cucHaiQuan = agencyMap.get('cuc-hq')!;
  const kbnn = agencyMap.get('kbnn')!;
  const ubcknn = agencyMap.get('ubcknn')!;
  const vuDauTu = agencyMap.get('vu-dtpt')!;
  const cucGia = agencyMap.get('cuc-qlg')!;
  const cucQlcs = agencyMap.get('cuc-qlcs')!;
  const cucQln = agencyMap.get('cuc-qln')!;
  const thanhTraBo = agencyMap.get('tt-btc')!;
  const vanPhongBo = agencyMap.get('vp-btc')!;
  const vuPhapChe = agencyMap.get('vu-pc')!;
  const vienChienLuoc = agencyMap.get('vien-clcs')!;
  const vuKhuKinhTe = agencyMap.get('vu-qlkkt')!;
  const vuNsnn = agencyMap.get('vu-nsnn')!;
  const cucQlktkt = agencyMap.get('cuc-qlktkt')!;
  const cucQlbh = agencyMap.get('cuc-qlbh')!;
  const cucPtDnnn = agencyMap.get('cuc-ptdnn')!;

  // --------------------------------------------------------------------------
  // 1. NHÓM THẨM QUYỀN MỚI 1: BẢO HIỂM XÃ HỘI, BHYT & BHTN (BẢO HIỂM XÃ HỘI VIỆT NAM)
  // --------------------------------------------------------------------------
  const isSocialSecurityMatch =
    currentSector === 'social_security' ||
    text.includes('bảo hiểm xã hội') ||
    text.includes('bhxh') ||
    text.includes('bảo hiểm y tế') ||
    text.includes('bhyt') ||
    text.includes('bảo hiểm thất nghiệp') ||
    text.includes('bhtn') ||
    text.includes('quỹ bảo hiểm xã hội') ||
    text.includes('nợ đọng bhxh') ||
    text.includes('trốn đóng bhxh') ||
    text.includes('trục lợi bhyt') ||
    text.includes('rút bhxh một lần') ||
    text.includes('vssid');

  if (isSocialSecurityMatch) {
    const cooperatingAgencies: MofAgencyDecree376[] = [];

    // Nếu có yếu tố nợ đọng, trốn đóng, trốn thuế -> Phối hợp Cục Thuế & Thanh tra Bộ
    if (text.includes('nợ') || text.includes('trốn') || text.includes('cưỡng chế') || text.includes('thanh tra') || text.includes('sai phạm')) {
      cooperatingAgencies.push(cucThue);
      cooperatingAgencies.push(thanhTraBo);
    } else {
      cooperatingAgencies.push(cucThue);
    }

    // Nếu liên quan đến chi phí hành chính, cân đối quỹ hoặc chế độ lương hưu
    if (text.includes('lương hưu') || text.includes('ngân sách') || text.includes('chi trả')) {
      cooperatingAgencies.push(agencyMap.get('vu-hcsn') || vuNsnn);
    }

    // Văn phòng Bộ luôn phối hợp phát ngôn báo chí
    if (cooperatingAgencies.length < 3) {
      cooperatingAgencies.push(vanPhongBo);
    }

    return {
      leadAgency: bhxhVietNam,
      leadUnit: bhxhVietNam.name,
      leadUnitShort: bhxhVietNam.shortName,
      leadUnitId: bhxhVietNam.id,
      leadFunctions: bhxhVietNam.leadFunctions,
      cooperatingAgencies,
      cooperatingUnits: cooperatingAgencies.map((a) => a.name),
      routingReason: 'Bài viết thuộc chức năng quản lý Quỹ BHXH, BHYT và an sinh xã hội tiếp nhận theo Nghị định 376/2026/NĐ-CP.',
      legalBasis: 'Nghị định 376/2026/NĐ-CP - Điều 3, Khoản 30 (Bảo hiểm xã hội Việt Nam)',
      assignmentConfidence: 96,
      recommendedSopAction: 'Chỉ đạo BHXH Việt Nam chủ trì rà soát hồ sơ vụ việc; phối hợp Cục Thuế đối chiếu dữ liệu đóng nộp và Thanh tra Bộ kiểm tra liên ngành.',
      dispatchDeadlineHours: text.includes('bức xúc') || text.includes('trục lợi') ? 4 : 24,
      isDecree376NewMandate: true,
      newMandateCategory: 'SOCIAL_SECURITY',
    };
  }

  // --------------------------------------------------------------------------
  // 2. NHÓM THẨM QUYỀN MỚI 2: ĐẤU THẦU & PPP (CỤC QUẢN LÝ ĐẤU THẦU)
  // --------------------------------------------------------------------------
  const isBiddingMatch =
    currentSector === 'bidding_procurement' ||
    text.includes('đấu thầu') ||
    text.includes('chỉ định thầu') ||
    text.includes('thông thầu') ||
    text.includes('hồ sơ mời thầu') ||
    text.includes('hồ sơ dự thầu') ||
    text.includes('hệ thống mạng đấu thầu quốc gia') ||
    text.includes('đấu thầu qua mạng') ||
    text.includes('dự án ppp') ||
    text.includes('đối tác công tư') ||
    text.includes('đấu thầu thuốc') ||
    text.includes('đấu thầu vật tư y tế') ||
    text.includes('hủy thầu') ||
    text.includes('chậm lựa chọn nhà thầu') ||
    text.includes('cài cắm tiêu chí');

  if (isBiddingMatch) {
    const cooperatingAgencies: MofAgencyDecree376[] = [];

    // Nếu gói thầu liên quan dự án đầu tư công / hạ tầng -> phối hợp Vụ Đầu tư
    if (text.includes('đầu tư công') || text.includes('hạ tầng') || text.includes('xây lắp') || text.includes('dự án trọng điểm')) {
      cooperatingAgencies.push(vuDauTu);
    }

    // Nếu liên quan khiếu nại, tố cáo, cài cắm tiêu chí, sai phạm -> phối hợp Thanh tra Bộ & Vụ Pháp chế
    if (text.includes('khiếu nại') || text.includes('tiêu chí') || text.includes('thanh tra') || text.includes('sai phạm') || text.includes('thông thầu')) {
      cooperatingAgencies.push(thanhTraBo);
      cooperatingAgencies.push(vuPhapChe);
    } else {
      cooperatingAgencies.push(thanhTraBo);
    }

    if (cooperatingAgencies.length < 3) {
      cooperatingAgencies.push(vanPhongBo);
    }

    return {
      leadAgency: cucDauThau,
      leadUnit: cucDauThau.name,
      leadUnitShort: cucDauThau.shortName,
      leadUnitId: cucDauThau.id,
      leadFunctions: cucDauThau.leadFunctions,
      cooperatingAgencies,
      cooperatingUnits: cooperatingAgencies.map((a) => a.name),
      routingReason: 'Bài viết phản ánh hoạt động đấu thầu mua sắm công, hệ thống mạng đấu thầu và dự án PPP chuyển giao theo Nghị định 376/2026/NĐ-CP.',
      legalBasis: 'Nghị định 376/2026/NĐ-CP - Điều 3, Khoản 18 (Cục Quản lý đấu thầu)',
      assignmentConfidence: 95,
      recommendedSopAction: 'Giao Cục Quản lý đấu thầu chủ trì kiểm tra Hệ thống mạng đấu thầu quốc gia; phối hợp Vụ Đầu tư và Thanh tra Bộ làm rõ nội dung phản ánh.',
      dispatchDeadlineHours: text.includes('thiếu thuốc') || text.includes('ách tắc') ? 4 : 24,
      isDecree376NewMandate: true,
      newMandateCategory: 'BIDDING',
    };
  }

  // --------------------------------------------------------------------------
  // 3. NHÓM THẨM QUYỀN MỚI 3: ĐẦU TƯ NƯỚC NGOÀI (FDI) - CỤC ĐẦU TƯ NƯỚC NGOÀI
  // --------------------------------------------------------------------------
  const isFdiMatch =
    currentSector === 'foreign_investment_fdi' ||
    (currentSector === 'fdi' && !text.includes('chứng khoán')) ||
    text.includes('cục đầu tư nước ngoài') ||
    text.includes('vốn fdi') ||
    text.includes('thu hút fdi') ||
    text.includes('giải ngân fdi') ||
    text.includes('giấy chứng nhận đầu tư') ||
    text.includes('chứng nhận đăng ký đầu tư') ||
    text.includes('chuyển giá') ||
    text.includes('chuyển giá fdi') ||
    text.includes('doanh nghiệp fdi') ||
    text.includes('nhà đầu tư nước ngoài vào việt nam') ||
    text.includes('thuế tối thiểu toàn cầu');

  if (isFdiMatch) {
    const cooperatingAgencies: MofAgencyDecree376[] = [];

    // Nếu liên quan chuyển giá, ưu đãi thuế, thuế tối thiểu toàn cầu -> phối hợp chặt chẽ Cục Thuế
    if (text.includes('thuế') || text.includes('chuyển giá') || text.includes('ưu đãi') || text.includes('trốn thuế')) {
      cooperatingAgencies.push(cucThue);
    }

    // Nếu liên quan khu công nghiệp, khu kinh tế -> phối hợp Vụ Quản lý các khu kinh tế
    if (text.includes('khu công nghiệp') || text.includes('khu kinh tế') || text.includes('kcn') || text.includes('khu chế xuất')) {
      cooperatingAgencies.push(vuKhuKinhTe);
    }

    // Phối hợp Cục Hải quan nếu liên quan linh kiện, máy móc, xuất nhập khẩu FDI
    if (text.includes('xuất nhập khẩu') || text.includes('hải quan') || text.includes('nhập khẩu máy móc')) {
      cooperatingAgencies.push(cucHaiQuan);
    }

    if (cooperatingAgencies.length < 3) {
      cooperatingAgencies.push(vanPhongBo);
    }

    return {
      leadAgency: cucDauTuNuocNgoai,
      leadUnit: cucDauTuNuocNgoai.name,
      leadUnitShort: cucDauTuNuocNgoai.shortName,
      leadUnitId: cucDauTuNuocNgoai.id,
      leadFunctions: cucDauTuNuocNgoai.leadFunctions,
      cooperatingAgencies,
      cooperatingUnits: cooperatingAgencies.map((a) => a.name),
      routingReason: 'Vấn đề liên quan quản lý dòng vốn ngoại FDI, cấp phép và xúc tiến đầu tư theo Nghị định 376/2026/NĐ-CP.',
      legalBasis: 'Nghị định 376/2026/NĐ-CP - Điều 3, Khoản 19 (Cục Đầu tư nước ngoài)',
      assignmentConfidence: 94,
      recommendedSopAction: 'Giao Cục Đầu tư nước ngoài chủ trì rà soát dự án; phối hợp Cục Thuế kiểm soát nghĩa vụ thuế và Vụ Quản lý các KKT hỗ trợ nhà đầu tư.',
      dispatchDeadlineHours: 24,
      isDecree376NewMandate: true,
      newMandateCategory: 'FDI',
    };
  }

  // --------------------------------------------------------------------------
  // 4. NHÓM THẨM QUYỀN MỚI 4: THỐNG KÊ QUỐC GIA & CPI (CỤC THỐNG KÊ)
  // --------------------------------------------------------------------------
  const isStatisticsMatch =
    currentSector === 'statistics_macro' ||
    text.includes('cục thống kê') ||
    text.includes('tổng cục thống kê') ||
    text.includes('chỉ số cpi') ||
    text.includes('chỉ số giá tiêu dùng') ||
    text.includes('cpi bình quân') ||
    text.includes('số liệu gdp') ||
    text.includes('thống kê quốc gia') ||
    text.includes('sai lệch số liệu thống kê') ||
    text.includes('độ vênh số liệu thống kê') ||
    text.includes('điều tra thống kê') ||
    text.includes('chỉ số iip');

  if (isStatisticsMatch) {
    const cooperatingAgencies: MofAgencyDecree376[] = [];

    // Nếu liên quan CPI, lạm phát, giá cả -> phối hợp Cục Quản lý giá
    if (text.includes('cpi') || text.includes('giá') || text.includes('lạm phát') || text.includes('xăng dầu')) {
      cooperatingAgencies.push(cucGia);
    }

    // Phối hợp Viện Chiến lược và Chính sách tài chính nghiên cứu mô hình
    cooperatingAgencies.push(vienChienLuoc);

    // Phối hợp Vụ Ngân sách nhà nước nếu ảnh hưởng cân đối dự toán
    if (text.includes('ngân sách') || text.includes('dự toán') || text.includes('gdp')) {
      cooperatingAgencies.push(vuNsnn);
    }

    if (cooperatingAgencies.length < 3) {
      cooperatingAgencies.push(vanPhongBo);
    }

    return {
      leadAgency: cucThongKe,
      leadUnit: cucThongKe.name,
      leadUnitShort: cucThongKe.shortName,
      leadUnitId: cucThongKe.id,
      leadFunctions: cucThongKe.leadFunctions,
      cooperatingAgencies,
      cooperatingUnits: cooperatingAgencies.map((a) => a.name),
      routingReason: 'Vấn đề thuộc nghiệp vụ điều tra thống kê, công bố CPI và số liệu GDP vĩ mô theo Nghị định 376/2026/NĐ-CP.',
      legalBasis: 'Nghị định 376/2026/NĐ-CP - Điều 3, Khoản 29 (Cục Thống kê)',
      assignmentConfidence: 93,
      recommendedSopAction: 'Giao Cục Thống kê chủ trì giải trình phương pháp luận tính toán số liệu; phối hợp Cục Quản lý Giá và Viện Chiến lược cung cấp thông tin cho báo chí.',
      dispatchDeadlineHours: 24,
      isDecree376NewMandate: true,
      newMandateCategory: 'STATISTICS',
    };
  }

  // --------------------------------------------------------------------------
  // 5. NHÓM THẨM QUYỀN MỚI 5: QUY HOẠCH & KẾ HOẠCH KT-XH (VỤ QUẢN LÝ QUY HOẠCH)
  // --------------------------------------------------------------------------
  const isPlanningMatch =
    currentSector === 'socioeconomic_planning' ||
    text.includes('vụ quản lý quy hoạch') ||
    text.includes('quy hoạch tổng thể quốc gia') ||
    text.includes('quy hoạch vùng') ||
    text.includes('kế hoạch phát triển kinh tế xã hội') ||
    text.includes('quy hoạch tỉnh') ||
    text.includes('phản biện quy hoạch') ||
    text.includes('điều chỉnh quy hoạch') ||
    text.includes('chiến lược tài chính quốc gia');

  if (isPlanningMatch) {
    const cooperatingAgencies: MofAgencyDecree376[] = [];
    cooperatingAgencies.push(vienChienLuoc);
    cooperatingAgencies.push(vuDauTu);
    cooperatingAgencies.push(vuKhuKinhTe);

    return {
      leadAgency: vuQuyHoach,
      leadUnit: vuQuyHoach.name,
      leadUnitShort: vuQuyHoach.shortName,
      leadUnitId: vuQuyHoach.id,
      leadFunctions: vuQuyHoach.leadFunctions,
      cooperatingAgencies,
      cooperatingUnits: cooperatingAgencies.map((a) => a.name),
      routingReason: 'Vấn đề liên quan quy hoạch tổng thể, chiến lược không gian phát triển kinh tế chuyển giao theo Nghị định 376/2026/NĐ-CP.',
      legalBasis: 'Nghị định 376/2026/NĐ-CP - Điều 3, Khoản 22 (Vụ Quản lý quy hoạch)',
      assignmentConfidence: 91,
      recommendedSopAction: 'Giao Vụ Quản lý quy hoạch chủ trì tham mưu xử lý kiến nghị quy hoạch; phối hợp Viện Chiến lược và Vụ Đầu tư đánh giá tác động ngân sách.',
      dispatchDeadlineHours: 48,
      isDecree376NewMandate: true,
      newMandateCategory: 'PLANNING',
    };
  }

  // --------------------------------------------------------------------------
  // 6. CÁC ĐƠN VỊ CỐT LÕI KHÁC THUỘC BỘ TÀI CHÍNH (THUẾ, HẢI QUAN, KHO BẠC, UBCK...)
  // --------------------------------------------------------------------------
  // 6.1 Thuế
  if (currentSector === 'tax' || currentSector === 'fintech_digital' || text.includes('thuế') || text.includes('hoàn thuế') || text.includes('hóa đơn')) {
    const coops = [thanhTraBo];
    if (text.includes('ngân sách') || text.includes('dự toán')) coops.push(vuNsnn);
    if (text.includes('xuất nhập khẩu') || text.includes('buôn lậu')) coops.push(cucHaiQuan);
    coops.push(vanPhongBo);

    return {
      leadAgency: cucThue,
      leadUnit: cucThue.name,
      leadUnitShort: cucThue.shortName,
      leadUnitId: cucThue.id,
      leadFunctions: cucThue.leadFunctions,
      cooperatingAgencies: coops.slice(0, 3),
      cooperatingUnits: coops.slice(0, 3).map((a) => a.name),
      routingReason: 'Nội dung thuộc công tác quản lý thuế nội địa và thu ngân sách nhà nước.',
      legalBasis: 'Nghị định 376/2026/NĐ-CP - Điều 3, Khoản 25 (Cục Thuế)',
      assignmentConfidence: 95,
      recommendedSopAction: 'Giao Cục Thuế chủ trì kiểm tra xác minh, phối hợp Thanh tra Bộ và ban hành văn bản hướng dẫn xử lý.',
      dispatchDeadlineHours: text.includes('ách tắc') || text.includes('hoàn thuế') ? 4 : 24,
      isDecree376NewMandate: false,
    };
  }

  // 6.2 Hải quan
  if (currentSector === 'customs' || text.includes('hải quan') || text.includes('thông quan') || text.includes('buôn lậu')) {
    const coops = [thanhTraBo, cucThue, vanPhongBo];
    return {
      leadAgency: cucHaiQuan,
      leadUnit: cucHaiQuan.name,
      leadUnitShort: cucHaiQuan.shortName,
      leadUnitId: cucHaiQuan.id,
      leadFunctions: cucHaiQuan.leadFunctions,
      cooperatingAgencies: coops,
      cooperatingUnits: coops.map((a) => a.name),
      routingReason: 'Nội dung liên quan quản lý xuất nhập khẩu, kiểm soát thông quan và chống buôn lậu.',
      legalBasis: 'Nghị định 376/2026/NĐ-CP - Điều 3, Khoản 26 (Cục Hải quan)',
      assignmentConfidence: 95,
      recommendedSopAction: 'Giao Cục Hải quan kiểm tra quy trình thông quan tại các cửa khẩu trọng điểm.',
      dispatchDeadlineHours: 24,
      isDecree376NewMandate: false,
    };
  }

  // 6.3 Chứng khoán & Trái phiếu
  if (currentSector === 'stocks' || currentSector === 'bonds' || text.includes('chứng khoán') || text.includes('cổ phiếu') || text.includes('trái phiếu')) {
    const coops = [thanhTraBo, agencyMap.get('vu-tcnh') || vuPhapChe, vanPhongBo];
    return {
      leadAgency: ubcknn,
      leadUnit: ubcknn.name,
      leadUnitShort: ubcknn.shortName,
      leadUnitId: ubcknn.id,
      leadFunctions: ubcknn.leadFunctions,
      cooperatingAgencies: coops,
      cooperatingUnits: coops.map((a) => a.name),
      routingReason: 'Nội dung liên quan giám sát thị trường chứng khoán, trái phiếu và an toàn dòng vốn.',
      legalBasis: 'Nghị định 376/2026/NĐ-CP - Điều 3, Khoản 28 (Ủy ban Chứng khoán Nhà nước)',
      assignmentConfidence: 94,
      recommendedSopAction: 'Giao UBCKNN giám sát biến động giao dịch, kịp thời thanh tra các dấu hiệu thao túng.',
      dispatchDeadlineHours: 12,
      isDecree376NewMandate: false,
    };
  }

  // 6.4 Kho bạc & Đầu tư công
  if (currentSector === 'public_investment' || currentSector === 'treasury_budget' || text.includes('giải ngân') || text.includes('kho bạc')) {
    const coops = [vuDauTu, vuNsnn, vanPhongBo];
    return {
      leadAgency: kbnn,
      leadUnit: kbnn.name,
      leadUnitShort: kbnn.shortName,
      leadUnitId: kbnn.id,
      leadFunctions: kbnn.leadFunctions,
      cooperatingAgencies: coops,
      cooperatingUnits: coops.map((a) => a.name),
      routingReason: 'Nội dung liên quan ngân quỹ quốc gia và kiểm soát chi giải ngân vốn đầu tư công.',
      legalBasis: 'Nghị định 376/2026/NĐ-CP - Điều 3, Khoản 27 (Kho bạc Nhà nước)',
      assignmentConfidence: 94,
      recommendedSopAction: 'Giao KBNN phối hợp Vụ Đầu tư đôn đốc các địa phương thanh toán vốn giải ngân.',
      dispatchDeadlineHours: 24,
      isDecree376NewMandate: false,
    };
  }

  // 6.5 Giá cả & Lạm phát
  if (currentSector === 'price_management' || text.includes('bình ổn giá') || text.includes('xăng dầu')) {
    const coops = [cucThongKe, thanhTraBo, vanPhongBo];
    return {
      leadAgency: cucGia,
      leadUnit: cucGia.name,
      leadUnitShort: cucGia.shortName,
      leadUnitId: cucGia.id,
      leadFunctions: cucGia.leadFunctions,
      cooperatingAgencies: coops,
      cooperatingUnits: coops.map((a) => a.name),
      routingReason: 'Nội dung liên quan điều hành mặt bằng giá các mặt hàng thiết yếu.',
      legalBasis: 'Nghị định 376/2026/NĐ-CP - Điều 3, Khoản 14 (Cục Quản lý giá)',
      assignmentConfidence: 93,
      recommendedSopAction: 'Giao Cục Quản lý giá kiểm tra việc kê khai giá và điều hành Quỹ BOG linh hoạt.',
      dispatchDeadlineHours: 24,
      isDecree376NewMandate: false,
    };
  }

  // Mặc định: Văn phòng Bộ Tài chính làm đầu mối tổng hợp, phối hợp Vụ Pháp chế & Thanh tra Bộ
  return {
    leadAgency: vanPhongBo,
    leadUnit: vanPhongBo.name,
    leadUnitShort: vanPhongBo.shortName,
    leadUnitId: vanPhongBo.id,
    leadFunctions: vanPhongBo.leadFunctions,
    cooperatingAgencies: [vuPhapChe, thanhTraBo],
    cooperatingUnits: [vuPhapChe.name, thanhTraBo.name],
    routingReason: 'Thông tin chung về điều hành chính sách của Bộ Tài chính.',
    legalBasis: 'Nghị định 376/2026/NĐ-CP - Điều 3, Khoản 11 (Văn phòng Bộ)',
    assignmentConfidence: 85,
    recommendedSopAction: 'Văn phòng Bộ theo dõi luồng thông tin và điều phối các đơn vị nghiệp vụ liên quan.',
    dispatchDeadlineHours: 48,
    isDecree376NewMandate: false,
  };
}
