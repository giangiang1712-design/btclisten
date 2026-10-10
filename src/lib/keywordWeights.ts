import { isMinistryAuthorityProposal, isRoutineLegalPromulgationOrGovernance } from './newsClassification';
import { detectNoiseGateCategory } from './alertTriggers';

export interface KeywordWeightDef {
  category: string;
  weight: number; // 1.0 to 5.0
  isCoreMof?: boolean;
  isCustom?: boolean;
  enabled?: boolean;
}

export type KeywordWeightMap = Record<string, KeywordWeightDef>;

export const DEFAULT_KEYWORD_CONFIG: KeywordWeightMap = {
  // Trụ cột Bộ Tài chính & Vĩ mô Cốt lõi (Weight: 5.0 - Ưu tiên hàng đầu)
  'Trái phiếu doanh nghiệp': { category: 'Trái phiếu (TPDN)', weight: 5.0, isCoreMof: true, enabled: true },
  'Thị trường TPDN': { category: 'Trái phiếu (TPDN)', weight: 5.0, isCoreMof: true, enabled: true },
  'Đáo hạn trái phiếu': { category: 'Trái phiếu (TPDN)', weight: 4.8, isCoreMof: true, enabled: true },
  'Nghị định 08': { category: 'Chính sách TPDN', weight: 5.0, isCoreMof: true, enabled: true },
  'Nghị định 65': { category: 'Chính sách TPDN', weight: 4.8, isCoreMof: true, enabled: true },
  'VBMA': { category: 'Hiệp hội Trái phiếu', weight: 4.6, isCoreMof: true, enabled: true },

  'UBCKNN': { category: 'Chứng khoán (UBCK)', weight: 5.0, isCoreMof: true, enabled: true },
  'Nâng hạng FTSE': { category: 'Thị trường Chứng khoán', weight: 5.0, isCoreMof: true, enabled: true },
  'Non-prefunding': { category: 'Cơ chế Giao dịch', weight: 5.0, isCoreMof: true, enabled: true },
  'Thông tư 68/2024/TT-BTC': { category: 'Thông tư BTC', weight: 5.0, isCoreMof: true, enabled: true },
  'Hệ thống KRX': { category: 'Hạ tầng Chứng khoán', weight: 4.7, isCoreMof: true, enabled: true },
  'VN-Index': { category: 'Thị trường Chứng khoán', weight: 4.5, isCoreMof: true, enabled: true },

  // Mảng Thuế & Quản lý thu NSNN (Ưu tiên tham mưu Lãnh đạo Bộ Tài chính)
  'Cục Thuế': { category: 'Thuế & NSNN', weight: 5.0, isCoreMof: true, enabled: true },
  'Cục Thuế và Thuế địa phương': { category: 'Thuế & NSNN', weight: 5.0, isCoreMof: true, enabled: true },
  'Chính sách thuế': { category: 'Thuế & NSNN', weight: 5.0, isCoreMof: true, enabled: true },
  'Thu ngân sách nhà nước': { category: 'Tài chính - Ngân sách', weight: 4.9, isCoreMof: true, enabled: true },
  'Hoàn thuế VAT': { category: 'Quản lý Thuế', weight: 4.9, isCoreMof: true, enabled: true },
  'Hóa đơn điện tử': { category: 'Quản lý Thuế', weight: 4.9, isCoreMof: true, enabled: true },
  'Chống thất thu thuế': { category: 'Quản lý Thuế', weight: 4.9, isCoreMof: true, enabled: true },
  'Thuế tối thiểu toàn cầu': { category: 'Chính sách Thuế', weight: 4.8, isCoreMof: true, enabled: true },
  'Thuế giá trị gia tăng (VAT)': { category: 'Chính sách Thuế', weight: 4.8, isCoreMof: true, enabled: true },
  'Thuế thu nhập doanh nghiệp (TNDN)': { category: 'Chính sách Thuế', weight: 4.8, isCoreMof: true, enabled: true },
  'Thuế thu nhập cá nhân (TNCN)': { category: 'Chính sách Thuế', weight: 4.8, isCoreMof: true, enabled: true },
  'Thuế thương mại điện tử': { category: 'Quản lý Thuế', weight: 4.8, isCoreMof: true, enabled: true },
  'Giảm thuế VAT 8%': { category: 'Chính sách Thuế', weight: 4.8, isCoreMof: true, enabled: true },
  'Quyết toán thuế': { category: 'Quản lý Thuế', weight: 4.7, isCoreMof: true, enabled: true },
  'Thanh tra kiểm tra thuế': { category: 'Quản lý Thuế', weight: 4.7, isCoreMof: true, enabled: true },
  'Gian lận hóa đơn': { category: 'Quản lý Thuế', weight: 4.7, isCoreMof: true, enabled: true },
  'Hóa đơn máy tính tiền': { category: 'Quản lý Thuế', weight: 4.6, isCoreMof: true, enabled: true },
  'Truy thu thuế': { category: 'Quản lý Thuế', weight: 4.6, isCoreMof: true, enabled: true },
  'Cục Thuế TP.HCM': { category: 'Thuế & NSNN', weight: 4.6, isCoreMof: true, enabled: true },
  'Cục Thuế Hà Nội': { category: 'Thuế & NSNN', weight: 4.6, isCoreMof: true, enabled: true },

  'Tổng cục Hải quan': { category: 'Hải quan & XNK', weight: 4.9, isCoreMof: true, enabled: true },
  'Kim ngạch xuất nhập khẩu': { category: 'Thương mại & XNK', weight: 4.8, isCoreMof: true, enabled: true },
  'Thông quan số hóa': { category: 'Hải quan & XNK', weight: 4.7, isCoreMof: true, enabled: true },
  'Chống buôn lậu': { category: 'Hải quan', weight: 4.5, isCoreMof: true, enabled: true },

  'Đầu tư FDI': { category: 'Đầu tư Nước ngoài', weight: 4.9, isCoreMof: true, enabled: true },
  'Giải ngân FDI': { category: 'Đầu tư Nước ngoài', weight: 4.8, isCoreMof: true, enabled: true },
  'Vốn ngoại': { category: 'Đầu tư Nước ngoài', weight: 4.5, isCoreMof: true, enabled: true },

  'Tăng trưởng kinh tế': { category: 'Vĩ mô & Tăng trưởng', weight: 5.0, isCoreMof: true, enabled: true },
  'Tăng trưởng GDP': { category: 'Vĩ mô & Tăng trưởng', weight: 5.0, isCoreMof: true, enabled: true },
  'Tăng trưởng 2 con số': { category: 'Vĩ mô & Tăng trưởng', weight: 4.9, isCoreMof: true, enabled: true },
  'Mô hình tăng trưởng': { category: 'Vĩ mô & Tăng trưởng', weight: 4.9, isCoreMof: true, enabled: true },
  'Kinh tế quý III': { category: 'Vĩ mô & Tăng trưởng', weight: 4.8, isCoreMof: true, enabled: true },
  'Kinh tế quý 3': { category: 'Vĩ mô & Tăng trưởng', weight: 4.8, isCoreMof: true, enabled: true },
  'Kinh tế quý IV': { category: 'Vĩ mô & Tăng trưởng', weight: 4.8, isCoreMof: true, enabled: true },
  'Kinh tế quý 4': { category: 'Vĩ mô & Tăng trưởng', weight: 4.8, isCoreMof: true, enabled: true },
  'Kịch bản tăng trưởng GDP': { category: 'Vĩ mô & Tăng trưởng', weight: 4.9, isCoreMof: true, enabled: true },
  'Động lực tăng trưởng': { category: 'Vĩ mô & Tăng trưởng', weight: 4.8, isCoreMof: true, enabled: true },
  'Đổi mới mô hình tăng trưởng': { category: 'Vĩ mô & Tăng trưởng', weight: 4.9, isCoreMof: true, enabled: true },
  'Quy mô nền kinh tế': { category: 'Vĩ mô & Tăng trưởng', weight: 4.7, isCoreMof: true, enabled: true },
  'Chính sách tài khóa': { category: 'Chính sách Tài chính', weight: 5.0, isCoreMof: true, enabled: true },
  'Đầu tư công': { category: 'Đầu tư công & Giải ngân', weight: 4.9, isCoreMof: true, enabled: true },
  'Lạm phát CPI': { category: 'Vĩ mô & Lạm phát', weight: 4.7, isCoreMof: true, enabled: true },
  'Kho bạc Nhà nước': { category: 'Kho bạc & Ngân sách', weight: 4.9, isCoreMof: true, enabled: true },
  'Ngân sách nhà nước': { category: 'Kho bạc & Ngân sách', weight: 5.0, isCoreMof: true, enabled: true },
  'Cân đối ngân sách': { category: 'Kho bạc & Ngân sách', weight: 4.8, isCoreMof: true, enabled: true },
  'Bội chi ngân sách': { category: 'Kho bạc & Ngân sách', weight: 4.8, isCoreMof: true, enabled: true },
  'Trái phiếu Chính phủ (TPCP)': { category: 'Kho bạc & Ngân sách', weight: 4.9, isCoreMof: true, enabled: true },
  'Quản lý ngân quỹ': { category: 'Kho bạc & Ngân sách', weight: 4.7, isCoreMof: true, enabled: true },

  // Đầu tư công & Giải ngân vốn
  'Giải ngân đầu tư công': { category: 'Đầu tư công & Giải ngân', weight: 5.0, isCoreMof: true, enabled: true },
  'Vốn ngân sách nhà nước': { category: 'Đầu tư công & Giải ngân', weight: 4.9, isCoreMof: true, enabled: true },
  'Dự án trọng điểm quốc gia': { category: 'Đầu tư công & Giải ngân', weight: 4.8, isCoreMof: true, enabled: true },
  'Chương trình mục tiêu quốc gia': { category: 'Đầu tư công & Giải ngân', weight: 4.8, isCoreMof: true, enabled: true },

  // Quản lý Giá & Bình ổn thị trường
  'Cục Quản lý Giá': { category: 'Quản lý Giá & Bình ổn', weight: 5.0, isCoreMof: true, enabled: true },
  'Bình ổn giá': { category: 'Quản lý Giá & Bình ổn', weight: 4.9, isCoreMof: true, enabled: true },
  'Luật Giá 2023': { category: 'Quản lý Giá & Bình ổn', weight: 4.9, isCoreMof: true, enabled: true },
  'Giá xăng dầu': { category: 'Quản lý Giá & Bình ổn', weight: 4.7, isCoreMof: true, enabled: true },
  'Giá điện sinh hoạt': { category: 'Quản lý Giá & Bình ổn', weight: 4.7, isCoreMof: true, enabled: true },
  'Quỹ bình ổn xăng dầu': { category: 'Quản lý Giá & Bình ổn', weight: 4.8, isCoreMof: true, enabled: true },

  // Bảo hiểm & Giám sát bảo hiểm
  'Cục Quản lý Giám sát Bảo hiểm': { category: 'Bảo hiểm & Giám sát BH', weight: 5.0, isCoreMof: true, enabled: true },
  'Thị trường bảo hiểm': { category: 'Bảo hiểm & Giám sát BH', weight: 4.8, isCoreMof: true, enabled: true },
  'Bancassurance': { category: 'Bảo hiểm & Giám sát BH', weight: 4.8, isCoreMof: true, enabled: true },
  'Bảo hiểm nhân thọ': { category: 'Bảo hiểm & Giám sát BH', weight: 4.6, isCoreMof: true, enabled: true },
  'Luật Kinh doanh bảo hiểm': { category: 'Bảo hiểm & Giám sát BH', weight: 4.8, isCoreMof: true, enabled: true },

  // Nợ công & Tài chính đối ngoại
  'Nợ công': { category: 'Nợ công & TC Đối ngoại', weight: 4.9, isCoreMof: true, enabled: true },
  'Nợ quốc gia': { category: 'Nợ công & TC Đối ngoại', weight: 4.8, isCoreMof: true, enabled: true },
  'Vốn ODA': { category: 'Nợ công & TC Đối ngoại', weight: 4.7, isCoreMof: true, enabled: true },
  'Xếp hạng tín nhiệm quốc gia': { category: 'Nợ công & TC Đối ngoại', weight: 4.8, isCoreMof: true, enabled: true },
  'Chỉ số nợ an toàn': { category: 'Nợ công & TC Đối ngoại', weight: 4.7, isCoreMof: true, enabled: true },

  // Tài sản công
  'Cục Quản lý Công sản': { category: 'Tài sản công', weight: 4.9, isCoreMof: true, enabled: true },
  'Nhà đất công': { category: 'Tài sản công', weight: 4.7, isCoreMof: true, enabled: true },
  'Đấu giá tài sản công': { category: 'Tài sản công', weight: 4.7, isCoreMof: true, enabled: true },
  'Sắp xếp tài sản công': { category: 'Tài sản công', weight: 4.6, isCoreMof: true, enabled: true },

  // Thanh tra & Phòng chống thất thu
  'Thanh tra Bộ Tài chính': { category: 'Thanh tra & Giám sát', weight: 5.0, isCoreMof: true, enabled: true },
  'Kiểm tra giám sát tài chính': { category: 'Thanh tra & Giám sát', weight: 4.8, isCoreMof: true, enabled: true },
  'Chống thất thu ngân sách': { category: 'Thanh tra & Giám sát', weight: 4.9, isCoreMof: true, enabled: true },
  'Xử lý gian lận tài chính': { category: 'Thanh tra & Giám sát', weight: 4.8, isCoreMof: true, enabled: true },
  'Thất thoát ngân sách': { category: 'Thanh tra & Giám sát', weight: 5.0, isCoreMof: true, enabled: true },
  'Sai phạm tài chính': { category: 'Thanh tra & Giám sát', weight: 5.0, isCoreMof: true, enabled: true },
  'Bao che sai phạm': { category: 'Thanh tra & Giám sát', weight: 5.0, isCoreMof: true, enabled: true },
  'Nhận hối lộ': { category: 'Thanh tra & Giám sát', weight: 5.0, isCoreMof: true, enabled: true },
  'Thất thoát': { category: 'Thanh tra & Giám sát', weight: 4.9, isCoreMof: true, enabled: true },
  'Sai phạm': { category: 'Thanh tra & Giám sát', weight: 4.9, isCoreMof: true, enabled: true },
  'Bao che': { category: 'Thanh tra & Giám sát', weight: 5.0, isCoreMof: true, enabled: true },
  'Hối lộ': { category: 'Thanh tra & Giám sát', weight: 5.0, isCoreMof: true, enabled: true },

  // Dự trữ Quốc gia
  'Tổng cục Dự trữ Nhà nước': { category: 'Dự trữ Quốc gia', weight: 4.9, isCoreMof: true, enabled: true },
  'Xuất cấp gạo cứu trợ': { category: 'Dự trữ Quốc gia', weight: 4.7, isCoreMof: true, enabled: true },
  'Dự trữ quốc gia': { category: 'Dự trữ Quốc gia', weight: 4.8, isCoreMof: true, enabled: true },

  // Ngân hàng & Tín dụng
  'Ngân hàng Nhà nước (NHNN)': { category: 'Ngân hàng & Tín dụng', weight: 4.8, enabled: true },
  'Tín dụng ngân hàng': { category: 'Ngân hàng & Tín dụng', weight: 4.7, enabled: true },
  'Room tín dụng': { category: 'Ngân hàng & Tín dụng', weight: 4.7, enabled: true },
  'Nợ xấu ngân hàng': { category: 'Ngân hàng & Tín dụng', weight: 4.7, enabled: true },
  'Tái cơ cấu tổ chức tín dụng': { category: 'Ngân hàng & Tín dụng', weight: 4.6, enabled: true },

  // Tài chính số & Thuế TMĐT
  'Hóa đơn điện tử máy tính tiền': { category: 'Tài chính số & Thuế TMĐT', weight: 4.8, isCoreMof: true, enabled: true },
  'Thuế sàn thương mại điện tử': { category: 'Tài chính số & Thuế TMĐT', weight: 4.8, isCoreMof: true, enabled: true },
  'FinTech': { category: 'Tài chính số & Thuế TMĐT', weight: 4.3, enabled: true },
  'Chuyển đổi số ngành tài chính': { category: 'Tài chính số & Thuế TMĐT', weight: 4.7, isCoreMof: true, enabled: true },

  'SCIC': { category: 'Kinh tế Nhà nước', weight: 4.8, isCoreMof: true, enabled: true },
  'Thoái vốn nhà nước': { category: 'Kinh tế Nhà nước', weight: 4.8, isCoreMof: true, enabled: true },
  'Doanh nghiệp nhà nước (DNNN)': { category: 'Kinh tế Nhà nước', weight: 4.7, isCoreMof: true, enabled: true },

  'Kinh tế tập thể': { category: 'Kinh tế Hợp tác', weight: 4.6, isCoreMof: true, enabled: true },
  'Hợp tác xã (HTX)': { category: 'Kinh tế Hợp tác', weight: 4.6, isCoreMof: true, enabled: true },
  'Luật Hợp tác xã 2023': { category: 'Kinh tế Hợp tác', weight: 4.7, isCoreMof: true, enabled: true },

  // Nhân vật & Lãnh đạo điều hành
  'Bộ Tài chính': { category: 'Cơ quan Điều hành', weight: 5.0, isCoreMof: true, enabled: true },
  'Ngô Văn Tuấn': { category: 'Bộ trưởng Bộ Tài chính', weight: 5.0, isCoreMof: true, enabled: true },
  'Vũ Thị Chân Phương': { category: 'Lãnh đạo UBCKNN', weight: 4.7, isCoreMof: true, enabled: true },
  'Mai Xuân Thành': { category: 'Lãnh đạo Ngành Thuế', weight: 4.7, isCoreMof: true, enabled: true },
  'Nguyễn Văn Cẩn': { category: 'Lãnh đạo Hải quan', weight: 4.7, isCoreMof: true, enabled: true },
  'Nguyễn Đức Chi': { category: 'Lãnh đạo Bộ Tài chính', weight: 4.8, isCoreMof: true, enabled: true },
  'Hồ Đức Phớc': { category: 'Nguyên Bộ trưởng Bộ Tài chính (Phó Thủ tướng)', weight: 4.5, isCoreMof: true, enabled: true },
  'Hồ Đức Phước': { category: 'Nguyên Bộ trưởng Bộ Tài chính (Phó Thủ tướng)', weight: 4.5, isCoreMof: true, enabled: true },
  'Nguyễn Thị Hồng': { category: 'Lãnh đạo NHNN', weight: 4.5, enabled: true },
  'Phạm Nhật Vượng': { category: 'Doanh nhân / Vingroup', weight: 4.2, enabled: true },
  'Trần Đình Long': { category: 'Doanh nhân / Hòa Phát', weight: 4.2, enabled: true },

  // Thị trường & Tài sản
  'Lãi suất điều hành': { category: 'Tiền tệ', weight: 4.2, enabled: true },
  'Tỷ giá USD/VND': { category: 'Ngoại tệ', weight: 3.8, enabled: true },
  'Giá vàng SJC': { category: 'Kim loại quý', weight: 3.5, enabled: true },
  'Bất động sản': { category: 'Địa ốc', weight: 3.5, enabled: true },
  'Khối ngoại mua ròng': { category: 'Dòng tiền', weight: 3.8, enabled: true },
  'Tài sản số (Crypto)': { category: 'Tài sản số', weight: 3.0, enabled: true },

  // Nhóm Từ khóa Tài chính & Kinh tế Tổng quát (Để hạn chế tối đa điểm 0)
  'Kinh tế': { category: 'Thị trường & Tài sản', weight: 2.5, enabled: true },
  'Tài chính': { category: 'Thị trường & Tài sản', weight: 2.5, enabled: true },
  'Doanh nghiệp': { category: 'Thị trường & Tài sản', weight: 2.0, enabled: true },
  'Ngân hàng': { category: 'Tiền tệ', weight: 2.8, enabled: true },
  'Chính sách': { category: 'Thị trường & Tài sản', weight: 2.5, enabled: true },
  'Đầu tư': { category: 'Thị trường & Tài sản', weight: 2.2, enabled: true },
  'Xuất nhập khẩu': { category: 'Hải quan & XNK', weight: 2.8, enabled: true },
  'Thị trường': { category: 'Thị trường & Tài sản', weight: 2.0, enabled: true },
  'Lãi suất': { category: 'Tiền tệ', weight: 2.8, enabled: true },
  'Sản xuất': { category: 'Thị trường & Tài sản', weight: 2.2, enabled: true },
  'Cổ phiếu': { category: 'Chứng khoán (UBCK)', weight: 2.5, enabled: true },
  'Thương mại': { category: 'Hải quan & XNK', weight: 2.2, enabled: true },
  'Tín dụng': { category: 'Tiền tệ', weight: 2.8, enabled: true },
  'Tỷ giá': { category: 'Ngoại tệ', weight: 2.6, enabled: true },
};

export const KEYWORD_CATEGORIES = [
  'Tất cả',
  'Thuế & NSNN',
  'Hải quan & XNK',
  'Trái phiếu (TPDN)',
  'Chứng khoán (UBCK)',
  'Kho bạc & Ngân sách',
  'Đầu tư công & Giải ngân',
  'Quản lý Giá & Bình ổn',
  'Bảo hiểm & Giám sát BH',
  'Nợ công & TC Đối ngoại',
  'Tài sản công',
  'Thanh tra & Giám sát',
  'Dự trữ Quốc gia',
  'Kinh tế Nhà nước',
  'Ngân hàng & Tín dụng',
  'Tài chính số & Thuế TMĐT',
  'Đầu tư Nước ngoài',
  'Vĩ mô & Tăng trưởng',
  'Kinh tế Hợp tác',
  'Cơ quan Điều hành',
  'Lãnh đạo',
  'Thị trường & Tài sản',
  'Tùy chỉnh riêng',
];

const LOCAL_STORAGE_KEY = 'finpulse_custom_keyword_weights';

// Load keyword weights from localStorage or fallback to defaults
export function loadCustomKeywordWeights(): KeywordWeightMap {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return { ...DEFAULT_KEYWORD_CONFIG };

    const parsed = JSON.parse(saved);
    if (typeof parsed === 'object' && parsed !== null) {
      // Merge with defaults to ensure any new default keywords are included
      return { ...DEFAULT_KEYWORD_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load custom keyword weights from localStorage:', e);
  }
  return { ...DEFAULT_KEYWORD_CONFIG };
}

// Save keyword weights to localStorage
export function saveCustomKeywordWeights(weights: KeywordWeightMap): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(weights));
  } catch (e) {
    console.warn('Failed to save custom keyword weights to localStorage:', e);
  }
}

// Reset keyword weights to default
export function resetCustomKeywordWeights(): KeywordWeightMap {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to reset custom keyword weights:', e);
  }
  return { ...DEFAULT_KEYWORD_CONFIG };
}

// Helper: Extract Weighted Keywords dynamically based on active user custom weights
export function extractWeightedKeywordsForText(
  title: string,
  summary: string,
  weights: KeywordWeightMap
): Array<{ keyword: string; weight: number; category?: string; isCoreMof?: boolean }> {
  const text = `${title} ${summary}`.toLowerCase();
  const matched: Array<{ keyword: string; weight: number; category?: string; isCoreMof?: boolean }> = [];

  for (const [kw, def] of Object.entries(weights)) {
    if (def.enabled === false) continue;
    if (text.includes(kw.toLowerCase())) {
      matched.push({
        keyword: kw,
        weight: def.weight,
        category: def.category,
        isCoreMof: def.isCoreMof,
      });
    }
  }

  matched.sort((a, b) => b.weight - a.weight);
  return matched.slice(0, 4);
}

export type SixWActionType = 'EXPLAIN' | 'RESPOND' | 'INFORM' | 'MONITOR';

export interface PriorityScoreExtra {
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  impactLevel?: 'high' | 'medium' | 'low';
  buzzScore?: number;
  isUrgent?: boolean;
  category?: string;
  alertLevel?: string;
  isAdministrative?: boolean;
  isRoutineRegulatory?: boolean;
  sixWActionType?: SixWActionType | string;
  actionType?: SixWActionType | string;
  sixW?: {
    who?: string;
    doingWhat?: string;
    aboutWhat?: string;
    resultOutcome?: string;
    whoIsAffected?: string;
    reaction?: string;
    recommendation?: string;
  };
  executiveDirective?: {
    whatHappened?: string;
    rootCause?: string;
    mediaStrategy?: {
      type?: string;
      title?: string;
    };
  };
  policyResponseAdvisor?: string;
}

/**
 * Identify the 6-W Matrix action classification ('EXPLAIN', 'RESPOND', 'INFORM', 'MONITOR')
 * based on article text, 6W analysis, executive directive, and policy advisor hints.
 */
export function identify6WActionType(
  title: string,
  summary: string = '',
  sixW?: PriorityScoreExtra['sixW'],
  executiveDirective?: PriorityScoreExtra['executiveDirective'],
  explicitType?: string
): SixWActionType {
  const normType = (explicitType || '').toUpperCase().trim();
  if (normType === 'EXPLAIN' || normType === 'RESPOND' || normType === 'INFORM' || normType === 'MONITOR') {
    return normType as SixWActionType;
  }

  const combinedText = `${title} ${summary} ${sixW?.doingWhat || ''} ${sixW?.aboutWhat || ''} ${sixW?.reaction || ''} ${executiveDirective?.whatHappened || ''} ${executiveDirective?.rootCause || ''}`.toLowerCase();

  // Check strategy type if directive present
  const strategyType = executiveDirective?.mediaStrategy?.type;
  if (strategyType === 'policy_guidance' || strategyType === 'treasury_optimization') {
    return 'EXPLAIN';
  }
  if (strategyType === 'crisis_resolution' || strategyType === 'risk_mitigation' || strategyType === 'law_enforcement') {
    return 'RESPOND';
  }

  // Text-based keywords for RESPOND (Phản hồi, Đính chính, Khắc phục vướng mắc, Bác bỏ tin đồn, Trả lời...)
  const respondKeywords = [
    'phản hồi', 'trả lời', 'đính chính', 'bác bỏ', 'làm rõ', 'xử lý vướng mắc',
    'khắc phục', 'chỉ đạo xử lý', 'giải đáp', 'kiến nghị', 'đối thoại', 'phản ứng chính sách',
    'khoanh vùng rủi ro', 'xử lý vi phạm', 'xử lý nghiêm', 'suy diễn'
  ];
  if (respondKeywords.some((kw) => combinedText.includes(kw))) {
    return 'RESPOND';
  }

  // Text-based keywords for EXPLAIN (Giải thích, Hướng dẫn, Tuyên truyền, Ban hành Nghị định/Thông tư, Cơ chế chính sách...)
  const explainKeywords = [
    'giải thích', 'hướng dẫn', 'tuyên truyền', 'nghị định', 'thông tư', 'quy định',
    'cơ chế chính sách', 'luật', 'dự thảo', 'giải trình', 'tháo gỡ vướng mắc', 'lộ trình',
    'tiêu chuẩn', 'đề án', 'chiến lược', 'quy hoạch', 'phổ biến', 'khung pháp lý', 'ban hành'
  ];
  if (explainKeywords.some((kw) => combinedText.includes(kw))) {
    return 'EXPLAIN';
  }

  // Fallback for daily market news / routine monitoring
  if (
    combinedText.includes('nhận định') ||
    combinedText.includes('diễn biến') ||
    combinedText.includes('giao dịch') ||
    combinedText.includes('chỉ số') ||
    combinedText.includes('phiên sáng') ||
    combinedText.includes('phiên chiều')
  ) {
    return 'MONITOR';
  }

  return 'INFORM';
}

// Calculate the effective priority score of an article for MoF weight sorting
export function calculateArticleMoFPriorityScore(
  title: string,
  summary: string,
  weights: KeywordWeightMap,
  extra?: PriorityScoreExtra
): number {
  const fullCombinedText = `${title || ''} ${summary || ''} ${extra?.policyResponseAdvisor || ''} ${extra?.sixW?.doingWhat || ''} ${extra?.sixW?.aboutWhat || ''}`.toLowerCase();
  const matched = extractWeightedKeywordsForText(title, summary, weights);
  
  // 1. Keyword-based Score component
  let keywordScore = 0;
  if (matched.length > 0) {
    let maxWeight = matched[0].weight;
    for (let i = 1; i < matched.length; i++) {
      if (matched[i].weight > maxWeight) maxWeight = matched[i].weight;
    }
    const countBonus = (matched.length - 1) * 0.25;
    keywordScore = maxWeight + countBonus;
  } else {
    // Fallback baseline for general financial relevance
    keywordScore = 1.5;
  }

  // 2. Contextual metadata score component
  const sentiment = extra?.sentiment || 'neutral';
  const impactLevel = extra?.impactLevel || 'low';
  const buzzScore = extra?.buzzScore !== undefined ? extra.buzzScore : 50;
  const isUrgent = extra?.isUrgent || false;

  let contextScore = 0;
  
  // Impact Level weighting
  if (impactLevel === 'high') {
    contextScore += 1.8;
  } else if (impactLevel === 'medium') {
    contextScore += 1.0;
  } else {
    contextScore += 0.2;
  }

  // Social/Media buzz weight
  contextScore += (buzzScore / 100) * 1.2;

  // Crisis/Sentiment Risk weighting (bearish events have high priority)
  if (sentiment === 'bearish') {
    contextScore += 0.8;
  } else if (sentiment === 'bullish') {
    contextScore += 0.2;
  }

  // Special Urgency flag
  if (isUrgent) {
    contextScore += 1.5;
  }

  // =========================================================================
  // 3. AGGRESSIVE CRISIS-TRIGGER KEYWORDS & MINISTRY LEADERSHIP / REGULATORY AUTHORITY ASSOCIATION SCORING
  // Combinations of 'cơ quan quản lý', 'lãnh đạo bộ' / đơn vị thuộc Bộ Tài chính
  // và các crisis keywords như 'bao che', 'trách nhiệm', 'hối lộ', 'sai phạm', 'thất thoát'
  // -> Kích hoạt hệ số nhân trọng số đặc biệt cao (Significant Weight Multiplier & Synergy Bonus)
  // =========================================================================
  const ministryUnitPatterns = [
    'bộ tài chính', 'ngành tài chính', 'tổng cục thuế', 'cục thuế', 'chi cục thuế', 'ngành thuế',
    'tổng cục hải quan', 'cục hải quan', 'chi cục hải quan', 'ngành hải quan',
    'kho bạc nhà nước', 'kbnn', 'kho bạc',
    'ubcknn', 'ủy ban chứng khoán', 'uy ban chung khoan', 'sở giao dịch chứng khoán', 'hnx', 'hose',
    'cục quản lý giá', 'cục quản lý giám sát bảo hiểm', 'cục quản lý công sản',
    'thanh tra bộ tài chính', 'thanh tra tài chính',
    'tổng cục dự trữ', 'dự trữ nhà nước',
    'scic', 'ngô văn tuấn', 'nguyễn đức chi', 'mai xuân thành', 'vũ thị chân phương'
  ];

  // Khái niệm Cơ quan quản lý & Lãnh đạo Bộ
  const hasRegulatorOrLeadership = 
    /cơ quan quản lý|lãnh đạo bộ|lãnh đạo bộ tài chính|thứ trưởng|bộ trưởng|cơ quan thanh tra|cơ quan giám sát|người đứng đầu|cấp ủy/i.test(fullCombinedText) ||
    fullCombinedText.includes('cơ quan quản lý') ||
    fullCombinedText.includes('lãnh đạo bộ');

  const hasMinistryUnit = 
    hasRegulatorOrLeadership ||
    ministryUnitPatterns.some(unit => fullCombinedText.includes(unit)) ||
    matched.some(m => m.isCoreMof || (m.category && ['Thuế & NSNN', 'Hải quan & XNK', 'Kho bạc & Ngân sách', 'Chứng khoán (UBCK)', 'Thanh tra & Giám sát', 'Cơ quan Điều hành', 'Tài sản công'].includes(m.category)));

  let crisisTriggerBonus = 0;
  let matchedCrisisTriggersCount = 0;
  let ministryCrisisSynergyBonus = 0;
  let leadershipCrisisMultiplier = 1.0;

  const hasThatThoat = fullCombinedText.includes('thất thoát') || fullCombinedText.includes('thất thu');
  const hasSaiPham = fullCombinedText.includes('sai phạm') || fullCombinedText.includes('vi phạm');
  const hasBaoChe = fullCombinedText.includes('bao che') || fullCombinedText.includes('tiếp tay') || fullCombinedText.includes('che giấu');
  const hasTrachNhiem = 
    !fullCombinedText.includes('bỏ trách nhiệm của bộ tài chính trong kiểm tra') &&
    !fullCombinedText.includes('in, đúc, tiêu hủy tiền') &&
    !fullCombinedText.includes('không buông lỏng') &&
    /truy trách nhiệm|chịu trách nhiệm hình sự|trách nhiệm người đứng đầu trong vụ án|thiếu trách nhiệm gây hậu quả|buông lỏng quản lý|buông lỏng kiểm tra|buông lỏng giám sát|đùn đẩy trách nhiệm|quy kết trách nhiệm/i.test(fullCombinedText);
  const hasHoiLo = fullCombinedText.includes('hối lộ') || fullCombinedText.includes('nhận hối lộ') || fullCombinedText.includes('đưa hối lộ') || fullCombinedText.includes('tham ô') || fullCombinedText.includes('trục lợi');

  // Kiểm tra Noise Gate Filter List
  const noiseGateResult = detectNoiseGateCategory(fullCombinedText);
  const isNoiseGateFiltered = noiseGateResult.isFiltered;

  // Identify if article is classified as 'Administrative' or 'Standard Regulatory Procedure'
  const isAdministrativeCategory = Boolean(
    isNoiseGateFiltered ||
    extra?.category === 'Administrative' ||
    extra?.category === 'administrative' ||
    extra?.category === 'Standard Regulatory Procedure' ||
    extra?.category === 'standard_regulatory_procedure' ||
    extra?.category === 'thể_chế_hành_chính' ||
    extra?.category === 'công_bố_lệnh' ||
    extra?.category === 'luật_sửa_đổi' ||
    extra?.category === 'đề_xuất_thẩm_quyền' ||
    extra?.category === 'ngân_hàng_nhà_nước' ||
    extra?.category === 'phân_định_nhiệm_vụ' ||
    extra?.category === 'phát_triển_địa_phương' ||
    extra?.isAdministrative ||
    extra?.isRoutineRegulatory ||
    extra?.alertLevel === 'STANDARD'
  );

  const containsAdministrativePhrases = 
    fullCombinedText.includes('công bố lệnh') ||
    fullCombinedText.includes('luật sửa đổi') ||
    fullCombinedText.includes('sửa đổi luật') ||
    fullCombinedText.includes('ngân hàng nhà nước') ||
    fullCombinedText.includes('in, đúc, tiêu hủy tiền') ||
    fullCombinedText.includes('khơi thông nguồn lực') ||
    fullCombinedText.includes('ưu tiên hiệu quả đầu tư') ||
    /công bố lệnh|lệnh của chủ tịch nước|chủ tịch nước công bố|lệnh chủ tịch nước|ký lệnh công bố|công bố pháp lệnh/i.test(fullCombinedText) ||
    /luật sửa đổi|sửa đổi luật|luật sửa đổi, bổ sung|luật sửa đổi bổ sung|dự thảo luật sửa đổi|sửa đổi, bổ sung một số điều/i.test(fullCombinedText) ||
    /ngân hàng nhà nước|ngân hàng nhà nước việt nam|thống đốc ngân hàng nhà nước|nhnn/i.test(fullCombinedText) ||
    /bỏ trách nhiệm (của )?bộ tài chính trong kiểm tra/i.test(fullCombinedText);

  const isAuthorityProposal = isMinistryAuthorityProposal(fullCombinedText);
  const isRoutineGovernance = isRoutineLegalPromulgationOrGovernance(fullCombinedText);

  const isAdministrativeOrRegulatory = isAdministrativeCategory || containsAdministrativePhrases || isAuthorityProposal || isRoutineGovernance;
  const isExemptFromCrisisScoring = isAdministrativeOrRegulatory;

  // Nếu bài viết thuộc diện Noise Gate và hoàn toàn KHÔNG có từ khóa khủng hoảng cấp bách ('hối lộ', 'sai phạm', 'bao che', 'thất thoát'):
  // -> Set MoF Priority Score về giá trị không đổi = 0, triệt tiêu hoàn toàn khả năng kích hoạt cảnh báo nhưng vẫn lưu giữ nguyên vẹn trong CSDL
  const hasAcuteCrisisPresence = hasThatThoat || hasSaiPham || hasBaoChe || hasTrachNhiem || hasHoiLo;
  if (isAdministrativeOrRegulatory && !hasAcuteCrisisPresence) {
    return 0;
  }

  if (!isExemptFromCrisisScoring) {
    if (hasThatThoat) {
      crisisTriggerBonus += 2.2; // Significant boost for loss/leakage of state budget/assets
      matchedCrisisTriggersCount++;
    }
    if (hasSaiPham) {
      crisisTriggerBonus += 2.0;
      matchedCrisisTriggersCount++;
    }
    if (hasBaoChe) {
      crisisTriggerBonus += 3.0; // Significant boost for cover-up / collusion
      matchedCrisisTriggersCount++;
    }
    if (hasTrachNhiem) {
      crisisTriggerBonus += 2.2; // Rủi ro truy cứu trách nhiệm quản lý
      matchedCrisisTriggersCount++;
    }
    if (hasHoiLo) {
      crisisTriggerBonus += 3.2; // Rủi ro tham nhũng/hình sự trực tiếp
      matchedCrisisTriggersCount++;
    }

    // Khi các từ khóa khủng hoảng này (đặc biệt là 'thất thoát', 'bao che', 'trách nhiệm', 'hối lộ') xuất hiện ĐỒNG THỜI cùng với 'cơ quan quản lý', 'lãnh đạo bộ' hoặc 'Ministry Unit':
    if (hasMinistryUnit && matchedCrisisTriggersCount > 0) {
      // Significant conditional boost: articles mentioning both a Ministry Unit and a Crisis Trigger Keyword
      leadershipCrisisMultiplier = 1.65;
      ministryCrisisSynergyBonus = 4.0 + (matchedCrisisTriggersCount * 1.5);
      // Tăng mạnh điểm nền cho keyword score để đảm bảo xếp hạng cao nhất
      keywordScore = Math.max(keywordScore, 6.0 + (matchedCrisisTriggersCount * 0.5));
    }
  }

  // 4. 6-W Matrix Action Weight Multiplier (Strategic Policy EXPLAIN / RESPOND vs Daily News Briefs)
  const actionType = identify6WActionType(
    title,
    summary,
    extra?.sixW,
    extra?.executiveDirective,
    extra?.sixWActionType || extra?.actionType
  );

  let matrixMultiplier = 1.0;
  let strategicBonus = 0;

  if (isAdministrativeOrRegulatory && !hasAcuteCrisisPresence) {
    return 0;
  } else if (actionType === 'EXPLAIN') {
    // Higher weight multiplier for Strategic Policy Explanation articles
    matrixMultiplier = 1.45;
    strategicBonus = 1.5;
  } else if (actionType === 'RESPOND' || (hasMinistryUnit && matchedCrisisTriggersCount > 0)) {
    // Higher weight multiplier for Strategic Policy Response & Acute Crisis articles
    matrixMultiplier = (hasMinistryUnit && matchedCrisisTriggersCount > 0 ? 1.85 : 1.50) * leadershipCrisisMultiplier;
    strategicBonus = hasMinistryUnit && matchedCrisisTriggersCount > 0 ? 3.0 : 1.8;
  } else if (actionType === 'MONITOR') {
    // Moderate dampening for routine daily market news briefs
    matrixMultiplier = 0.85;
  } else if (actionType === 'INFORM') {
    matrixMultiplier = 0.95;
  }

  // Calculate base score with crisis trigger bonus and apply 6-W Matrix multiplier + synergy
  const baseScore = keywordScore + contextScore + crisisTriggerBonus;
  let totalRaw = (baseScore * matrixMultiplier) + strategicBonus + ministryCrisisSynergyBonus;

  if (isAdministrativeOrRegulatory && !hasAcuteCrisisPresence) {
    return 0;
  }

  // Round to 1 decimal place, capping at 10.0
  return Math.round(Math.min(10.0, Math.max(0, totalRaw)) * 10) / 10;
}
