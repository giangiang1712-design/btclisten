import { OFFICIAL_150_SOURCES, OfficialSourceDefinition } from './official150Sources';

export type DomainTrustTier = 
  | 'TIER_1_OFFICIAL'   // Cổng Thông tin Nhà nước / Bộ / Ban ngành (Score 95 - 100)
  | 'TIER_1_PRESS'      // Cơ quan Báo chí Quốc gia & Tài chính Chủ lực (Score 85 - 94)
  | 'TIER_2_REPUTABLE'  // Báo chí & Tạp chí Kinh tế - Xã hội Uy tín (Score 70 - 84)
  | 'TIER_3_NICHE'      // Trang tin Chuyên ngành / Cổng Địa phương (Score 55 - 69)
  | 'UNVERIFIED'        // Nguồn tin Chưa xác thực / Trang tổng hợp (Score 35 - 54)
  | 'SUSPICIOUS';       // Nguồn nghi vấn tin giả / Giật tít / Tin rác (Score 0 - 34)

export interface DomainTrustAnalysis {
  domain: string;
  sourceName: string;
  trustScore: number; // 0 to 100
  trustTier: DomainTrustTier;
  trustTierLabelVi: string;
  isOfficialGov: boolean;
  isTier1Press: boolean;
  isFakeNewsSuspicious: boolean;
  isSpamFiltered: boolean;
  fakeNewsReason?: string;
  verificationBadge: string;
  matchedOfficialSource?: OfficialSourceDefinition;
}

// Danh sách các từ khóa / mẫu giật tít, tin giả, tin rác, lừa đảo tài chính
const FAKE_NEWS_CLICKBAIT_PATTERNS: { regex: RegExp; reason: string; penalty: number }[] = [
  {
    regex: /chưa kiểm chứng|nghe đồn|dân mạng đồn đoán|tin đồn chưa rõ thực hư|rò rỉ tin mật|không rõ nguồn gốc/i,
    reason: 'Tin đồn lan truyền chưa được cơ quan chức năng kiểm chứng hoặc đính chính chính thức',
    penalty: 40,
  },
  {
    regex: /sốc tận óc|kinh hoàng chưa từng thấy|bí mật động trời|lật tẩy chiêu trò kinh thiên|kinh ngạc|không xem thì phí|ngã ngửa vì/i,
    reason: 'Tiêu đề giật gân, câu view quá đà (Clickbait gián đoạn)',
    penalty: 35,
  },
  {
    regex: /kiếm tiền online không cần vốn|lãi suất \d{2,3}%|nhận tiền miễn phí|sàn ngoại hối cam kết|nhân đôi tài khoản trong ngày|tặng tiền tỷ/i,
    reason: 'Dấu hiệu quảng cáo lừa đảo tài chính, cờ bạc trực tuyến hoặc dụ dỗ góp vốn trái phép',
    penalty: 60,
  },
  {
    regex: /bộ trưởng bị bắt|bộ tài chính vỡ nợ|phá sản đồng loạt|ngân hàng sụp đổ hoàn toàn/i,
    reason: 'Cảnh báo: Thông tin nghiêm trọng bất thường nhưng phát tán từ nguồn tin phi chính thống',
    penalty: 50,
  },
  {
    regex: /đọc ngay kẻo hối|lộ bí mật|chấn động cả nước|tin sốc trưa nay|tin cực sốc/i,
    reason: 'Cấu trúc câu giật tít phi tiêu chuẩn, thiếu đạo đức báo chí chuyên nghiệp',
    penalty: 30,
  }
];

// Danh sách tên miền đuôi rác / free host dễ bị lợi dụng
const SUSPICIOUS_DOMAIN_SUFFIXES = [
  '.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.click', '.buzz', '.fit', '.link', '.work', '.casa', '.rest'
];

/**
 * Trích xuất tên miền sạch từ URL bất kỳ
 */
export function extractCleanDomain(url: string): string {
  if (!url) return '';
  try {
    let clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    const parsed = new URL(clean);
    return parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    return match ? match[1].toLowerCase() : '';
  }
}

/**
 * Đánh giá toàn diện mức độ tin cậy của tên miền & phát hiện tin rác / tin giả
 */
export function evaluateDomainTrust(
  url: string,
  sourceName?: string,
  title?: string,
  snippet?: string
): DomainTrustAnalysis {
  const domain = extractCleanDomain(url);
  const textToCheck = `${title || ''} ${snippet || ''} ${sourceName || ''}`.toLowerCase();
  
  let trustScore = 50; // Mặc định trung tính
  let matchedSource: OfficialSourceDefinition | undefined;
  let isOfficialGov = false;
  let isTier1Press = false;
  let isFakeNewsSuspicious = false;
  let fakeNewsReason: string | undefined;

  // 1. Kiểm tra khớp trong 150 Nguồn Tin Chính Thống của Bộ Tài chính
  if (domain) {
    matchedSource = OFFICIAL_150_SOURCES.find(s => {
      const sDomain = extractCleanDomain(s.domain);
      return sDomain && (domain === sDomain || domain.endsWith('.' + sDomain));
    });
  }

  // Nếu không khớp theo domain, thử khớp theo tên nguồn
  if (!matchedSource && sourceName) {
    const sNameNorm = sourceName.toLowerCase().trim();
    matchedSource = OFFICIAL_150_SOURCES.find(s => 
      s.name.toLowerCase().includes(sNameNorm) || s.shortName.toLowerCase() === sNameNorm
    );
  }

  // 2. Tính điểm dựa trên danh mục & cơ quan
  if (matchedSource) {
    if (matchedSource.tier === 'tier1') {
      if (matchedSource.category === 'mof_agencies' || domain.endsWith('.gov.vn')) {
        trustScore = 98;
        isOfficialGov = true;
      } else {
        trustScore = 92;
        isTier1Press = true;
      }
    } else if (matchedSource.tier === 'tier2') {
      trustScore = 80;
    } else {
      trustScore = 65;
    }
  } else if (domain.endsWith('.gov.vn') || domain === 'chinhphu.vn' || domain.endsWith('.chinhphu.vn')) {
    trustScore = 99;
    isOfficialGov = true;
  } else if (
    domain.includes('vnanet.vn') || 
    domain.includes('vietnamplus.vn') || 
    domain.includes('nhandan.vn') || 
    domain.includes('vtv.vn') || 
    domain.includes('vov.vn') || 
    domain.includes('tuoitre.vn') || 
    domain.includes('thanhnien.vn') || 
    domain.includes('vnexpress.net') || 
    domain.includes('baodautu.vn') || 
    domain.includes('vneconomy.vn') || 
    domain.includes('cafef.vn') || 
    domain.includes('vietstock.vn')
  ) {
    trustScore = 90;
    isTier1Press = true;
  } else if (
    domain.includes('dantri.com.vn') || 
    domain.includes('vietnamnet.vn') || 
    domain.includes('laodong.vn') || 
    domain.includes('tienphong.vn') || 
    domain.includes('plo.vn') || 
    domain.includes('kinhtedothi.vn') ||
    domain.includes('tinnhanhchungkhoan.vn')
  ) {
    trustScore = 82;
  } else if (domain.endsWith('.vn')) {
    // Tên miền .vn nói chung đã qua cấp phép VNNIC
    trustScore = 60;
  } else if (domain.includes('reuters.com') || domain.includes('bloomberg.com') || domain.includes('wsj.com') || domain.includes('ft.com') || domain.includes('worldbank.org') || domain.includes('imf.org')) {
    trustScore = 94;
    isTier1Press = true;
  } else {
    // Nguồn lạ / blog / trang tin quốc tế không định danh
    trustScore = 40;
  }

  // 3. Kiểm tra các yếu tố nghi vấn đuôi tên miền rác
  if (SUSPICIOUS_DOMAIN_SUFFIXES.some(suffix => domain.endsWith(suffix))) {
    trustScore -= 30;
    isFakeNewsSuspicious = true;
    fakeNewsReason = `Tên miền sử dụng đuôi miễn phí/rác (${domain}), tiềm ẩn nguy cơ website lừa đảo hoặc câu view không kiểm chứng.`;
  }

  // 4. Kiểm tra mẫu giật tít, tin giả, lừa đảo
  for (const pattern of FAKE_NEWS_CLICKBAIT_PATTERNS) {
    if (pattern.regex.test(textToCheck)) {
      trustScore -= pattern.penalty;
      isFakeNewsSuspicious = true;
      fakeNewsReason = fakeNewsReason ? `${fakeNewsReason}; ${pattern.reason}` : pattern.reason;
    }
  }

  // 5. Kiểm tra định dạng giật tít viết hoa toàn bộ hoặc nhiều dấu chấm cảm liên tiếp
  if (title && (/[!]{3,}|[?]{3,}/.test(title) || (title.length > 25 && title === title.toUpperCase() && /[A-ZÀ-Ỹ]/.test(title)))) {
    trustScore -= 20;
    isFakeNewsSuspicious = true;
    fakeNewsReason = fakeNewsReason ? `${fakeNewsReason}; Tiêu đề dùng định dạng giật gân (ALL CAPS/dấu chấm cảm lặp lại)` : 'Tiêu đề dùng định dạng giật gân bất thường';
  }

  // Giới hạn điểm từ 0 đến 100
  trustScore = Math.max(0, Math.min(100, Math.round(trustScore)));

  // 6. Phân cấp Tier dựa trên điểm số
  let trustTier: DomainTrustTier = 'UNVERIFIED';
  let trustTierLabelVi = 'Chưa xác thực';
  let verificationBadge = '⚠️ Chưa xác thực';

  if (trustScore >= 95 || isOfficialGov) {
    trustTier = 'TIER_1_OFFICIAL';
    trustTierLabelVi = 'Cơ quan Quản lý Nhà nước';
    verificationBadge = '🏛️ Nguồn Chính Thống (Bộ/Chính phủ)';
  } else if (trustScore >= 85 || isTier1Press) {
    trustTier = 'TIER_1_PRESS';
    trustTierLabelVi = 'Báo chí Tài chính Chủ lực';
    verificationBadge = '✅ Báo chí Quốc gia / Cốt lõi';
  } else if (trustScore >= 70) {
    trustTier = 'TIER_2_REPUTABLE';
    trustTierLabelVi = 'Báo chí & Tạp chí Uy tín';
    verificationBadge = '🛡️ Nguồn Uy Tín Đã Cấp Phép';
  } else if (trustScore >= 55) {
    trustTier = 'TIER_3_NICHE';
    trustTierLabelVi = 'Trang tin Chuyên ngành / Địa phương';
    verificationBadge = '📰 Tin Chuyên ngành / Địa phương';
  } else if (trustScore >= 35 && !isFakeNewsSuspicious) {
    trustTier = 'UNVERIFIED';
    trustTierLabelVi = 'Nguồn Mở / Cần Thận Trọng';
    verificationBadge = 'ℹ️ Nguồn Mở Chưa Kiểm Chứng';
  } else {
    trustTier = 'SUSPICIOUS';
    trustTierLabelVi = 'Nghi vấn Tin giả / Tin rác';
    verificationBadge = '🚫 Nghi Vấn Tin Rác / Clickbait';
  }

  const isSpamFiltered = trustScore < 35 || isFakeNewsSuspicious;

  return {
    domain,
    sourceName: matchedSource?.name || sourceName || domain,
    trustScore,
    trustTier,
    trustTierLabelVi,
    isOfficialGov,
    isTier1Press,
    isFakeNewsSuspicious,
    isSpamFiltered,
    fakeNewsReason,
    verificationBadge,
    matchedOfficialSource: matchedSource,
  };
}
