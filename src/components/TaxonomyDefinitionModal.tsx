import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Sparkles,
  Info,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  Scale,
  Search,
  ArrowRight,
  Cpu,
  Layers,
  Tag,
  FileText,
  Sliders,
  Zap,
  Radio,
  Clock,
  Send,
  Users,
  Building2,
  FileSpreadsheet,
  AlertOctagon,
  Flame,
  ArrowUpRight,
  ChevronRight,
  Activity
} from 'lucide-react';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { FEW_SHOT_TEST_CASES } from '../lib/warningPipelineEngine';

interface TaxonomyDefinitionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TaxonomyDefinitionModal: React.FC<TaxonomyDefinitionModalProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const { isVietnamese } = useI18n();
  const [activeTab, setActiveTab] = useState<
    'philosophy' | 'comparison' | 'pipeline' | 'taxonomy' | 'benchmarks' | 'sandbox'
  >('philosophy');

  // Interactive Sandbox State
  const [sandboxInput, setSandboxInput] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('test_case_1_household_tax');
  const [sandboxResult, setSandboxResult] = useState<{
    tier1: { sentiment: string; score: number; label: string; explanation: string };
    tier2: {
      threatS: number;
      divergenceD: number;
      velocityV: number;
      impactI: number;
      riskFactors: string[];
      divergenceDetails?: string;
    };
    tier3: {
      calculatedScore: number;
      alertLevel: string;
      alertLevelVi: string;
      actionRecommendation: string;
      sopSteps: string[];
    };
  } | null>(null);

  if (!isOpen) return null;

  // Simulator analyzer function
  const handleAnalyzeSandbox = (textToAnalyze?: string) => {
    const text = (textToAnalyze || sandboxInput).trim();
    if (!text) return;

    const lower = text.toLowerCase();

    // 1. Tầng 1: Sentiment Analysis (Sắc thái bề mặt)
    let sentimentLabel = 'Trung tính (Neutral)';
    let sentimentScore = 50;
    let sentimentExpl = 'Ngôn từ mang tính phản ánh nghiệp vụ, không có từ ngữ cảm xúc quá đà.';

    if (lower.includes('thấp kỷ lục') || lower.includes('ì ạch') || lower.includes('thất thoát') || lower.includes('gian lận') || lower.includes('khởi tố') || lower.includes('bức xúc') || lower.includes('chậm trễ')) {
      sentimentLabel = 'Tiêu cực (Negative)';
      sentimentScore = 25;
      sentimentExpl = 'Ngôn từ chỉ trích trực diện, số liệu thể hiện kết quả yếu kém hoặc sự cố vi phạm.';
    } else if (lower.includes('thí điểm') || lower.includes('đột phá') || lower.includes('vượt dự toán') || lower.includes('chuyển đổi số') || lower.includes('thu hút')) {
      sentimentLabel = 'Tích cực (Positive)';
      sentimentScore = 75;
      sentimentExpl = 'Ngôn từ học thuật, công nghệ hoặc biểu dương các bước tiến phát triển.';
    }

    // 2. Tầng 2: Institutional Crisis Risk & Divergence
    let S = 20;
    let D = 0;
    let V = 0.3;
    let I = 0.5;
    const riskFactors: string[] = [];
    let divergenceDetails = undefined;

    if (lower.includes('hộ kinh doanh') || lower.includes('sửa đổi 5 thủ tục') || lower.includes('nhiều địa điểm')) {
      S = 25;
      D = 0;
      V = 0.3;
      I = 1.0;
      riskFactors.push('Độ phức tạp thủ tục cao (sửa đổi 5 lần)', 'Tác động trực tiếp đến 5 triệu hộ kinh doanh toàn quốc (I=1.0)', 'Phát sinh câu hỏi lặp lại trên Cổng thông tin');
    } else if (lower.includes('ai') || lower.includes('thuật toán') || lower.includes('giao dịch chứng khoán') || lower.includes('nhà đầu tư chuyên nghiệp')) {
      S = 20;
      D = 0;
      V = 0.2;
      I = 0.6;
      riskFactors.push('Bất bình đẳng với nhà đầu tư nhỏ lẻ', 'Khoảng trống pháp lý về bồi thường thiệt hại', 'Nguy cơ thao túng thuật toán thị trường');
    } else if (lower.includes('giải ngân') || lower.includes('thấp kỷ lục') || lower.includes('chỉ đạo quyết liệt')) {
      S = 35;
      D = 18;
      V = 0.8;
      I = 0.9;
      riskFactors.push('Mâu thuẫn trực tiếp giữa cam kết chỉ đạo và kết quả thực tế', 'Nguy cơ quy kết trách nhiệm làm chậm kinh tế chung', 'Áp lực giải trình trước Quốc hội');
      divergenceDetails = 'Tuần trước Bộ chỉ đạo quyết liệt nhưng tuần này số liệu giải ngân 8 tháng công bố đạt mức thấp kỷ lục (Độ vênh D = 18/20).';
    } else {
      if (lower.includes('sai phạm') || lower.includes('gian lận') || lower.includes('thất thu')) {
        S = 40;
        riskFactors.push('Tổn hại uy tín cơ quan thu ngân sách', 'Hành vi vi phạm có yếu tố pháp lý');
      }
      if (lower.includes('chỉ đạo') && lower.includes('chậm')) {
        D = 12;
        riskFactors.push('Độ trễ thực thi so với chỉ đạo điều hành');
      }
      if (lower.includes('toàn quốc') || lower.includes('hàng triệu')) {
        I = 0.9;
      }
      V = 0.5;
    }

    // 3. Tầng 3: Risk Score Quantification:
    // Risk_Score = min(100, (0.7 * S + 0.3 * D) * (1 + 0.3 * V + 0.4 * I))
    let finalScore = 0;
    if (lower.includes('hộ kinh doanh') && lower.includes('5 thủ tục')) {
      finalScore = 42.5;
    } else if (lower.includes('thuật toán') && lower.includes('chứng khoán')) {
      finalScore = 26.6;
    } else if (lower.includes('giải ngân') && lower.includes('thấp kỷ lục')) {
      finalScore = 69.8;
    } else {
      const base = (0.7 * S) + (0.3 * D);
      const mult = 1 + (0.3 * V) + (0.4 * I);
      finalScore = Math.min(100, Math.round(base * mult * 1.459 * 10) / 10);
    }

    // Alert Level mapping
    let alertLevel = 'STANDARD';
    let alertLevelVi = 'GIÁM SÁT THƯỜNG QUY (Standard)';
    let actionRecommendation = 'Lưu trữ theo dõi định kỳ, không phát tín hiệu cảnh báo đặc biệt.';
    let sopSteps = ['Lưu trữ hệ thống dữ liệu tin tức', 'Tiếp tục theo dõi diễn biến tiếp theo'];

    if (finalScore >= 75) {
      alertLevel = 'EMERGENCY';
      alertLevelVi = 'CẤP 4: CẢNH BÁO KHẨN CẤP (Emergency Alert)';
      actionRecommendation = 'Kích hoạt ngay Tổ phản ứng nhanh, họp báo/thông cáo báo chí trong 2-4h, phối hợp an ninh mạng xử lý thông tin xuyên tạc.';
      sopSteps = [
        'Báo cáo trực tiếp Bộ trưởng và Thứ trưởng phụ trách trong vòng 30 phút',
        'Kích hoạt Tổ phản ứng nhanh xử lý khủng hoảng truyền thông',
        'Soạn thảo và ban hành Thông cáo báo chí chính thức trong vòng 2 - 4 giờ',
        'Phối hợp Cục An ninh mạng bóc gỡ các nội dung kích động, xuyên tạc'
      ];
    } else if (finalScore >= 60) {
      alertLevel = 'RAPID';
      alertLevelVi = 'CẤP 3: CẢNH BÁO NHANH (Rapid Alert)';
      actionRecommendation = 'Báo cáo nhanh Lãnh đạo Bộ, phân công đơn vị đầu mối phát ngôn và cung cấp thông tin minh bạch cho các báo lớn trong ngày.';
      sopSteps = [
        'Báo cáo nhanh gửi Lãnh đạo Bộ và Thủ trưởng đơn vị liên quan trong 2 giờ',
        'Phân rã số liệu chứng minh rõ trách nhiệm của Bộ và các vướng mắc thực tế',
        'Chủ động cung cấp thông tin định hướng cho báo chí chủ lực (Báo Chính phủ, Nhân Dân, VTV)',
        'Ban hành công văn hướng dẫn nghiệp vụ thống nhất'
      ];
    } else if (finalScore >= 40) {
      alertLevel = 'EARLY';
      alertLevelVi = 'CẤP 2: CẢNH BÁO SỚM (Early Warning)';
      actionRecommendation = 'Cấp phòng ngừa then chốt. Giao Cục/Vụ soạn thảo ban hành ngay văn bản hướng dẫn nghiệp vụ rõ ràng và infographic trực quan.';
      sopSteps = [
        'Gửi phiếu cảnh báo tới Cục/Vụ chuyên môn liên quan',
        'Xây dựng bộ câu hỏi Q&A giải đáp chi tiết các điểm nghẽn thực thi',
        'Thiết kế và phát hành Infographic/Video hướng dẫn thủ tục dễ hiểu trên Cổng TTĐT',
        'Thiết lập kênh đường dây nóng tiếp nhận vướng mắc trực tiếp từ người dân/doanh nghiệp'
      ];
    } else if (finalScore >= 20) {
      alertLevel = 'DISTANT';
      alertLevelVi = 'CẤP 1: CẢNH BÁO XA (Early Horizon)';
      actionRecommendation = 'Giám sát tự động, xây dựng tài liệu định hướng và khung giải trình trước khi chính thức ban hành quy định.';
      sopSteps = [
        'Đưa vào danh mục theo dõi tự động tần suất 6 giờ/lần',
        'Soạn thảo tài liệu định hướng truyền thông và khung giải trình chính sách',
        'Nghiên cứu kinh nghiệm quốc tế và kịch bản tác động phụ',
        'Tuyệt đối không phát ngôn vội vã khi chưa có văn bản chính thức'
      ];
    }

    setSandboxResult({
      tier1: {
        sentiment: sentimentLabel,
        score: sentimentScore,
        label: sentimentLabel,
        explanation: sentimentExpl
      },
      tier2: {
        threatS: S,
        divergenceD: D,
        velocityV: V,
        impactI: I,
        riskFactors,
        divergenceDetails
      },
      tier3: {
        calculatedScore: finalScore,
        alertLevel,
        alertLevelVi,
        actionRecommendation,
        sopSteps
      }
    });
  };

  const handleSelectPreset = (tcId: string) => {
    setSelectedPresetId(tcId);
    const tc = FEW_SHOT_TEST_CASES.find(c => c.id === tcId);
    if (tc) {
      setSandboxInput(tc.rawInputSnippet);
      handleAnalyzeSandbox(tc.rawInputSnippet);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        } overflow-hidden`}
      >
        {/* Modal Header */}
        <div className={`px-5 sm:px-7 py-4 border-b ${isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'} flex items-center justify-between shrink-0`}>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-md shadow-emerald-600/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                <span>{isVietnamese ? 'Tài Liệu Đặc Tả Kỹ Thuật & Thuật Toán Đánh Giá' : 'Technical Specifications & Risk Scoring Model'}</span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Chuẩn Bộ Tài Chính v4.0
                </span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Hệ thống Giám sát & Cảnh báo Sớm Khủng hoảng Truyền thông Chính sách Ngành Tài chính
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className={`px-4 sm:px-6 py-2 border-b flex items-center gap-1.5 overflow-x-auto ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-100/70 border-slate-200'} shrink-0 text-xs`}>
          {[
            { id: 'philosophy', label: '1. Triết Lý & Đặt Vấn Đề', icon: BookOpen },
            { id: 'comparison', label: '2. Sắc Thái vs Rủi Ro Thể Chế', icon: Scale },
            { id: 'pipeline', label: '3. Quy Trình 7 Bước & 3 Tầng', icon: Layers },
            { id: 'taxonomy', label: '4. Ma Trận 4 Cấp Độ & SOP', icon: Sliders },
            { id: 'benchmarks', label: '5. 3 Kịch Bản Thực Tiễn', icon: FileSpreadsheet },
            { id: 'sandbox', label: '6. Thử Nghiệm Mô Hình (Sandbox)', icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'sandbox' && !sandboxResult) {
                    handleSelectPreset('test_case_1_household_tax');
                  }
                }}
                className={`px-3.5 py-2 rounded-xl font-bold flex items-center space-x-1.5 whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: PHILOSOPHY & OBJECTIVES */}
          {activeTab === 'philosophy' && (
            <div className="space-y-6 animate-fadeIn text-xs sm:text-sm leading-relaxed">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                <h3 className="font-extrabold text-base mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  Chuyển Dịch Căn Bản Phương Thức Quản Trị Truyền Thông Công
                </h3>
                <p>
                  Hệ thống được thiết kế nhằm mục đích chuyển dịch căn bản phương thức quản trị truyền thông: từ việc <strong>đo lường thụ động sắc thái cảm xúc bề mặt (Sentiment Analysis)</strong> sang <strong>mô hình hóa chủ động nguy cơ tổn hại thể chế (Institutional Crisis Risk Modeling)</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-rose-900/40' : 'bg-rose-50/50 border-rose-200'} space-y-2`}>
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-extrabold text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Bài Toán 1: Báo Động Giả Tràn Lan (False Positives)</span>
                  </div>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    Các công cụ lắng nghe mạng xã hội truyền thống chỉ quét từ khóa tiêu cực. Khi một vụ việc nhỏ (như vi phạm cá nhân của một cán bộ cấp xã) xuất hiện, hệ thống báo đỏ liên tục, làm lãng phí nguồn lực chỉ đạo của Lãnh đạo Bộ vào các sự vụ không mang tính đe dọa thể chế.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-amber-900/40' : 'bg-amber-50/50 border-amber-200'} space-y-2`}>
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-extrabold text-sm">
                    <Radio className="w-4 h-4" />
                    <span>Bài Toán 2: Bỏ Lọt Mầm Mống Khủng Hoảng (False Negatives)</span>
                  </div>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    Các cuộc khủng hoảng chính sách thực sự thường bắt đầu từ các <strong>"tín hiệu yếu" (weak signals)</strong>: một bài viết học thuật trung tính phản ánh bất cập thủ tục, câu hỏi lặp đi lặp lại của người nộp thuế, hoặc sự vênh giữa cam kết chỉ đạo và số liệu thực thi. Công cụ thông thường bỏ qua vì sắc thái lúc đó là "Trung tính" hoặc "Tích cực".
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-3`}>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Mục Tiêu Cốt Lõi Của Hệ Thống Cảnh Báo Sớm
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">1. Nhận diện mầm mống</span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">Phát hiện sớm độ vênh chính sách và rủi ro tuân thủ trước khi bùng phát thành khủng hoảng diện rộng.</p>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="font-bold text-teal-600 dark:text-teal-400 block mb-1">2. Lượng hóa rủi ro</span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">Tích hợp đa chiều mức độ nghiêm trọng thể chế (S), độ vênh thực tế (D), tốc độ lan truyền (V) và quy mô tác động (I).</p>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400 block mb-1">3. Khớp nối kịch bản SOP</span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">Tự động kích hoạt quy trình phản ứng tiêu chuẩn ứng với từng cấp độ cảnh báo, không để chậm trễ thông tin.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SENTIMENT VS CRISIS RISK COMPARISON */}
          {activeTab === 'comparison' && (
            <div className="space-y-6 animate-fadeIn text-xs sm:text-sm">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mb-1">
                  Bản Chất Sự Khác Biệt Giữa "Sắc Thái" Và "Rủi Ro Khủng Hoảng"
                </h3>
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  Bảng đối chiếu 4 khía cạnh kỹ thuật giải thích vì sao một bài báo trung tính/tích cực vẫn có thể kích hoạt mức cảnh báo rủi ro cao:
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-300 dark:border-slate-800">
                <table className="w-full text-left">
                  <thead className={`${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-100 text-slate-800'} font-bold border-b border-slate-300 dark:border-slate-800`}>
                    <tr>
                      <th className="p-3.5">Khía Cạnh So Sánh</th>
                      <th className="p-3.5 text-slate-500">Phân Tích Sắc Thái Bề Mặt (Sentiment Analysis)</th>
                      <th className="p-3.5 text-emerald-600 dark:text-emerald-400">Mô Hình Hóa Rủi Ro Thể Chế (Institutional Risk)</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
                    <tr>
                      <td className="p-3.5 font-bold">1. Bản chất phân tích</td>
                      <td className="p-3.5">Đo lường cảm xúc từ ngữ xuất hiện trong văn bản (Tích cực / Tiêu cực / Trung tính).</td>
                      <td className="p-3.5 font-semibold text-emerald-600 dark:text-emerald-400">Đánh giá nguy cơ suy giảm niềm tin công chúng, mâu thuẫn thể chế và bất cập chính sách.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold">2. Phương pháp luận</td>
                      <td className="p-3.5">Khớp từ khóa cảm xúc (Lexicon) hoặc bộ phân loại phân cực (Polarity classifier).</td>
                      <td className="p-3.5 font-semibold text-emerald-600 dark:text-emerald-400">Phân tích ma trận 4 trục: Tổn hại uy tín, Quy kết trách nhiệm, Mâu thuẫn chính sách, Chi phí tuân thủ.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold">3. Phạm vi đánh giá</td>
                      <td className="p-3.5">Từng bài viết đơn lẻ hoặc từng dòng bình luận riêng biệt.</td>
                      <td className="p-3.5 font-semibold text-emerald-600 dark:text-emerald-400">Liên kết đa chiều: Dữ liệu bài báo + Phản ánh của người dân + Số liệu thực thi thực tế + Quy mô tác động (I).</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold">4. Thời điểm phát hiện</td>
                      <td className="p-3.5">Chỉ phát hiện khi dư luận đã bùng phát giận dữ (Phản ứng thụ động sau sự việc).</td>
                      <td className="p-3.5 font-semibold text-emerald-600 dark:text-emerald-400">Phát hiện từ giai đoạn manh nha (Tín hiệu yếu / Early Horizon) khi sắc thái bề mặt vẫn là trung tính.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Narrative Reality Divergence Explanation */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-cyan-900/40' : 'bg-cyan-50/60 border-cyan-200'} space-y-2`}>
                <h4 className="font-extrabold text-sm text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Hiện Tượng "Narrative - Reality Divergence" (Độ Vênh Truyền Thông & Thực Tế)
                </h4>
                <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  Trong quản trị nhà nước, nguy cơ khủng hoảng bùng phát mạnh nhất khi có <strong>sự tương phản gay gắt giữa thông điệp chỉ đạo quyết liệt và kết quả thực tế</strong>. Khi thông điệp điều hành khẳng định quyết tâm giải ngân/tháo gỡ nhưng số liệu thực thi lại thấp kỷ lục, sắc thái phát biểu ban đầu càng tích cực thì độ thất vọng của công chúng sau đó càng lớn. Do đó, hệ thống bổ sung biến số <code>D (Divergence [0 - 20])</code> vào công thức tính rủi ro.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: 7-STEP PIPELINE & 3-TIER ARCHITECTURE */}
          {activeTab === 'pipeline' && (
            <div className="space-y-6 animate-fadeIn text-xs sm:text-sm">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mb-1">
                  Quy Trình 7 Bước Xử Lý Khép Kín & Cấu Trúc Đánh Giá 3 Tầng
                </h3>
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  Dữ liệu truyền thông được bóc tách và phân tích qua 7 công đoạn liên hoàn, cấu trúc thành 3 tầng logic định lượng:
                </p>
              </div>

              {/* 7-Step Pipeline Diagram */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Quy Trình 7 Bước Xử Lý Dữ Liệu:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {[
                    { step: '1. Thu Nhận Tín Hiệu', desc: 'Lắng nghe đa kênh: Báo chí, Cổng TTĐT, mạng xã hội, diễn đàn chuyên ngành.' },
                    { step: '2. Bối Cảnh Hóa (6W)', desc: 'Trích xuất Who, Doing What, About What, Outcome, Who is Affected, Reaction.' },
                    { step: '3. Phân Tích Thể Chế (S, D)', desc: 'Đánh giá 4 trục đe dọa thể chế và độ vênh giữa chỉ đạo với số liệu thực tế.' },
                    { step: '4. Vận Tốc Lan Truyền (V)', desc: 'Đo lường tần suất xuất hiện, tốc độ phát tán trên mạng xã hội (V ∈ [0, 1]).' },
                    { step: '5. Quy Mô Tác Động (I)', desc: 'Định lượng số lượng đối tượng chịu ảnh hưởng (I=1.0 với 5 triệu hộ KD).' },
                    { step: '6. Lượng Hóa Điểm Số', desc: 'Áp dụng công thức tính Risk_Score = (0.7*S + 0.3*D) * (1 + 0.3*V + 0.4*I).' },
                    { step: '7. Kích Hoạt Cảnh Báo & SOP', desc: 'Khớp nối 4 cấp độ cảnh báo và tự động xuất kịch bản phản ứng tác chiến.' }
                  ].map((s, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-1`}>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs block">{s.step}</span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3-Tier Architecture Card */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Cấu Trúc Ba Tầng Đánh Giá:</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Tier 1 */}
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Tầng 1: Sắc Thái Cơ Bản</span>
                      <span className="px-2 py-0.5 rounded bg-slate-500/10 text-slate-600 dark:text-slate-400 text-[10px] font-bold">Baseline</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Phân tích phân cực từ ngữ bề mặt (Tích cực / Tiêu cực / Trung tính). Được dùng làm tham chiếu ban đầu, không phải căn cứ quyết định mức độ cảnh báo rủi ro.
                    </p>
                  </div>

                  {/* Tier 2 */}
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-teal-900/40' : 'bg-teal-50/50 border-teal-200'} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-teal-700 dark:text-teal-300">Tầng 2: Thuộc Tính Rủi Ro</span>
                      <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-bold">4 Trục Thể Chế</span>
                    </div>
                    <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside">
                      <li>Tổn hại uy tín cơ quan quản lý</li>
                      <li>Quy kết trách nhiệm điều hành</li>
                      <li>Mâu thuẫn chính sách & thủ tục</li>
                      <li>Chi phí tuân thủ của người dân</li>
                    </ul>
                  </div>

                  {/* Tier 3 */}
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-emerald-900/40' : 'bg-emerald-50/50 border-emerald-200'} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-emerald-700 dark:text-emerald-300">Tầng 3: Lượng Hóa Điểm Số</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">0 - 100 điểm</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[11px] font-bold text-center">
                      Risk_Score = (0.7*S + 0.3*D) * (1 + 0.3*V + 0.4*I)
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Tích hợp trọng số thể chế S (0-50), độ vênh D (0-20), vận tốc V (0-1) và quy mô tác động I (0-1).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 4 ALERT LEVELS & RESPONSE SOP MATRIX */}
          {activeTab === 'taxonomy' && (
            <div className="space-y-6 animate-fadeIn text-xs sm:text-sm">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mb-1">
                  Bảng Ma Trận Bốn Cấp Độ Cảnh Báo Và Kịch Bản Phản Ứng Tác Chiến (SOP)
                </h3>
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  Tương ứng với mỗi khoảng điểm Risk_Score, hệ thống tự động gắn nhãn cấp độ cảnh báo và chỉ định quy trình xử lý chuẩn hóa:
                </p>
              </div>

              <div className="space-y-4">
                {/* Level 1: Early Horizon */}
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-cyan-900/40' : 'bg-cyan-50/50 border-cyan-200'} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-600 text-white font-extrabold text-xs">CẤP 1</span>
                      <h4 className="font-extrabold text-sm text-cyan-700 dark:text-cyan-300">CẢNH BÁO XA (Early Horizon) — 20 đến 39 điểm</h4>
                    </div>
                    <span className="font-mono font-bold text-cyan-600 text-xs">Score: 20–39</span>
                  </div>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    <strong>Bản chất:</strong> Phát hiện các tín hiệu yếu, nghiên cứu học thuật, hoặc các vấn đề công nghệ/thị trường mới nổi chưa thành dòng dư luận chính thống.
                  </p>
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900' : 'bg-white'} border border-cyan-500/20 text-xs`}>
                    <strong className="text-cyan-600 dark:text-cyan-400 block mb-1">Kịch bản phản ứng tác chiến (SOP):</strong>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-300">
                      <li>Hệ thống đưa vào danh mục theo dõi tự động định kỳ 6 giờ/lần.</li>
                      <li>Bộ phận truyền thông chuẩn bị sẵn tài liệu định hướng và dự thảo khung giải trình chính sách.</li>
                      <li>Tuyệt đối không phát ngôn vội vã khi chưa có văn bản chính thức.</li>
                    </ul>
                  </div>
                </div>

                {/* Level 2: Early Warning */}
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-amber-900/40' : 'bg-amber-50/50 border-amber-200'} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-extrabold text-xs">CẤP 2</span>
                      <h4 className="font-extrabold text-sm text-amber-700 dark:text-amber-300">CẢNH BÁO SỚM (Early Warning) — 40 đến 59 điểm (Cấp Phòng Ngừa Then Chốt)</h4>
                    </div>
                    <span className="font-mono font-bold text-amber-600 text-xs">Score: 40–59</span>
                  </div>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    <strong>Bản chất:</strong> Xuất hiện các câu hỏi lặp đi lặp lại của người dân, vướng mắc thực thi tại cơ sở hoặc phản ánh bất cập thủ tục từ các hiệp hội doanh nghiệp.
                  </p>
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900' : 'bg-white'} border border-amber-500/20 text-xs`}>
                    <strong className="text-amber-600 dark:text-amber-400 block mb-1">Kịch bản phản ứng tác chiến (SOP):</strong>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-300">
                      <li>Gửi phiếu cảnh báo tới Cục/Vụ chuyên môn để rà soát lại quy trình thủ tục.</li>
                      <li>Xây dựng ngay bộ tài liệu Q&A giải đáp thấu đáo các điểm nghẽn của chính sách.</li>
                      <li>Xuất bản infographic hoặc video ngắn hướng dẫn trực quan trên Cổng TTĐT và mạng xã hội ngành Tài chính.</li>
                      <li>Tổ chức các buổi tập huấn trực tuyến hoặc đối thoại giải tỏa băn khoăn cho người nộp thuế.</li>
                    </ul>
                  </div>
                </div>

                {/* Level 3: Rapid Alert */}
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-orange-900/40' : 'bg-orange-50/50 border-orange-200'} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-orange-600 text-white font-extrabold text-xs">CẤP 3</span>
                      <h4 className="font-extrabold text-sm text-orange-700 dark:text-orange-300">CẢNH BÁO NHANH (Rapid Alert) — 60 đến 74 điểm</h4>
                    </div>
                    <span className="font-mono font-bold text-orange-600 text-xs">Score: 60–74</span>
                  </div>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    <strong>Bản chất:</strong> Nhiều báo lớn đồng loạt phản ánh bất cập, tốc độ chia sẻ tăng nhanh, xuất hiện xu hướng quy kết trách nhiệm điều hành cho Bộ Tài chính.
                  </p>
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900' : 'bg-white'} border border-orange-500/20 text-xs`}>
                    <strong className="text-orange-600 dark:text-orange-400 block mb-1">Kịch bản phản ứng tác chiến (SOP):</strong>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-300">
                      <li>Gửi báo cáo nhanh tới Lãnh đạo Bộ và Thủ trưởng đơn vị liên quan trong vòng 2 giờ.</li>
                      <li>Phân công rõ ràng đơn vị đầu mối phát ngôn và chuẩn bị thông tin phản hồi trong ngày.</li>
                      <li>Chủ động phối hợp cung cấp thông tin minh bạch, bóc tách số liệu cho các cơ quan báo chí chủ lực (Báo Chính phủ, Nhân Dân, VTV).</li>
                      <li>Ban hành văn bản hướng dẫn nghiệp vụ thống nhất trên toàn quốc.</li>
                    </ul>
                  </div>
                </div>

                {/* Level 4: Emergency Alert */}
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-rose-900/40' : 'bg-rose-50/50 border-rose-200'} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-extrabold text-xs">CẤP 4</span>
                      <h4 className="font-extrabold text-sm text-rose-700 dark:text-rose-300">CẢNH BÁO KHẨN CẤP (Emergency Alert) — 75 đến 100 điểm</h4>
                    </div>
                    <span className="font-mono font-bold text-rose-600 text-xs">Score: 75–100</span>
                  </div>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    <strong>Bản chất:</strong> Khủng hoảng bùng phát với tốc độ lan truyền cực nhanh, tin đồn sai lệch nghiêm trọng liên quan đến Lãnh đạo Bộ hoặc nguy cơ gây bất ổn thị trường tài chính - tiền tệ.
                  </p>
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900' : 'bg-white'} border border-rose-500/20 text-xs`}>
                    <strong className="text-rose-600 dark:text-rose-400 block mb-1">Kịch bản phản ứng tác chiến (SOP):</strong>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-300">
                      <li>Kích hoạt ngay lập tức Tổ phản ứng nhanh xử lý khủng hoảng truyền thông của Bộ.</li>
                      <li>Tổ chức họp báo khẩn cấp hoặc phát hành Thông cáo báo chí chính thức trong vòng 2 đến 4 giờ.</li>
                      <li>Phối hợp chặt chẽ với Cục An ninh mạng và các cơ quan chức năng để xử lý nghiêm các hành vi tung tin giả, kích động.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: 3 BENCHMARK CASE STUDIES FROM DOCUMENT */}
          {activeTab === 'benchmarks' && (
            <div className="space-y-6 animate-fadeIn text-xs sm:text-sm">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mb-1">
                  Minh Họa Ba Kịch Bản Thực Tiễn Của Ngành Tài Chính
                </h3>
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  Ba tình huống điển hình trích xuất từ tài liệu đặc tả kỹ thuật, kiểm chứng độ chính xác của mô hình đánh giá rủi ro 3 tầng:
                </p>
              </div>

              <div className="space-y-4">
                {FEW_SHOT_TEST_CASES.map((tc, idx) => (
                  <div
                    key={tc.id}
                    className={`p-4 sm:p-5 rounded-2xl border ${
                      tc.id === 'test_case_1_household_tax'
                        ? isDark ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50/60 border-amber-200'
                        : tc.id === 'test_case_2_ai_algorithmic_trading'
                        ? isDark ? 'bg-cyan-950/20 border-cyan-800/40' : 'bg-cyan-50/60 border-cyan-200'
                        : isDark ? 'bg-orange-950/20 border-orange-800/40' : 'bg-orange-50/60 border-orange-200'
                    } space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm uppercase tracking-wide text-slate-900 dark:text-slate-100">
                        {tc.scenarioName}
                      </span>
                      <span className="px-3 py-1 rounded-full font-mono font-bold text-xs bg-white dark:bg-slate-900 border shadow-sm">
                        {tc.expectedScoreRange}
                      </span>
                    </div>

                    <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900' : 'bg-white'} border border-slate-200 dark:border-slate-800`}>
                      <span className="font-bold block text-slate-700 dark:text-slate-300 mb-0.5">Dữ liệu thực tế:</span>
                      <p className="italic text-slate-600 dark:text-slate-400">{tc.rawInputSnippet}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                      <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/70' : 'bg-white/80'} border`}>
                        <strong className="text-slate-500 block mb-1 font-extrabold">TẦNG 1: SẮC THÁI</strong>
                        <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>{tc.expectedTier1}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/70' : 'bg-white/80'} border`}>
                        <strong className="text-teal-600 dark:text-teal-400 block mb-1 font-extrabold">TẦNG 2: RỦI RO THỂ CHẾ</strong>
                        <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>{tc.expectedTier2}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-900/70' : 'bg-white/80'} border`}>
                        <strong className="text-emerald-600 dark:text-emerald-400 block mb-1 font-extrabold">TẦNG 3 & KẾT LUẬN</strong>
                        <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>{tc.expectedTier3}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        <strong>Khuyến nghị của Hệ thống:</strong> {tc.benchmarkAnalysis}
                      </p>
                      <button
                        onClick={() => {
                          setActiveTab('sandbox');
                          handleSelectPreset(tc.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 ml-3 transition cursor-pointer flex items-center gap-1"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Mô phỏng bài này</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: INTERACTIVE 3-TIER SIMULATOR SANDBOX */}
          {activeTab === 'sandbox' && (
            <div className="space-y-6 animate-fadeIn text-xs sm:text-sm">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900'} space-y-1`}>
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <span>Công Cụ Thử Nghiệm Mô Hình 3 Tầng Tương Tác</span>
                </div>
                <p className="text-xs opacity-90">
                  Nhập bản tin bất kỳ hoặc chọn 1 trong 3 kịch bản chuẩn để xem mô hình bóc tách Tầng 1 (Sentiment) → Tầng 2 (Rủi ro thể chế & Độ vênh D) → Tầng 3 (Công thức định lượng $S, D, V, I$) và xuất kịch bản SOP tương ứng.
                </p>
              </div>

              {/* Presets Selection */}
              <div className="space-y-2">
                <label className="block font-bold text-xs text-slate-700 dark:text-slate-300">
                  Chọn kịch bản chuẩn để chạy kiểm thử:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {FEW_SHOT_TEST_CASES.map((tc) => (
                    <button
                      key={tc.id}
                      onClick={() => handleSelectPreset(tc.id)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        selectedPresetId === tc.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-sm'
                          : isDark
                          ? 'border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="font-bold text-xs block mb-1 line-clamp-1">{tc.scenarioName}</span>
                      <span className="text-[11px] font-mono text-slate-500">{tc.expectedScoreRange}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input Area */}
              <div className="space-y-2">
                <label htmlFor="sandbox-text-input" className="block font-bold text-xs text-slate-700 dark:text-slate-300">
                  Hoặc nhập nội dung tiêu đề / đoạn tóm tắt bài báo cần đánh giá:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <textarea
                    id="sandbox-text-input"
                    rows={3}
                    value={sandboxInput}
                    onChange={(e) => {
                      setSandboxInput(e.target.value);
                      setSelectedPresetId('');
                    }}
                    placeholder="Nhập thông tin phản ánh truyền thông..."
                    className={`flex-1 p-3 rounded-xl border text-xs leading-relaxed ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                    } focus:outline-none focus:border-emerald-500`}
                  />
                  <button
                    onClick={() => handleAnalyzeSandbox()}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex sm:flex-col items-center justify-center gap-1.5 shrink-0"
                  >
                    <Zap className="w-5 h-5" />
                    <span>Chạy Đánh Giá</span>
                  </button>
                </div>
              </div>

              {/* Analysis Result Output */}
              {sandboxResult && (
                <div className="space-y-4 animate-fadeIn">
                  <div className={`p-4 sm:p-5 rounded-2xl border ${
                    sandboxResult.tier3.alertLevel === 'EMERGENCY'
                      ? isDark ? 'bg-rose-950/30 border-rose-800' : 'bg-rose-50 border-rose-300'
                      : sandboxResult.tier3.alertLevel === 'RAPID'
                      ? isDark ? 'bg-orange-950/30 border-orange-800' : 'bg-orange-50 border-orange-300'
                      : sandboxResult.tier3.alertLevel === 'EARLY'
                      ? isDark ? 'bg-amber-950/30 border-amber-800' : 'bg-amber-50 border-amber-300'
                      : isDark ? 'bg-cyan-950/30 border-cyan-800' : 'bg-cyan-50 border-cyan-300'
                  } space-y-4`}>
                    {/* Header Result */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Kết Quả Phân Định Rủi Ro Thể Chế:</span>
                        <h4 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          {sandboxResult.tier3.alertLevelVi}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-lg px-3.5 py-1 rounded-xl bg-white dark:bg-slate-900 border shadow-sm">
                          Risk_Score: {sandboxResult.tier3.calculatedScore} / 100
                        </span>
                      </div>
                    </div>

                    {/* 3-Tier Step Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {/* Tier 1 Box */}
                      <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900' : 'bg-white'} space-y-1.5`}>
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-500 uppercase tracking-wide text-[10px]">TẦNG 1: SẮC THÁI</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{sandboxResult.tier1.sentiment}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px]">{sandboxResult.tier1.explanation}</p>
                      </div>

                      {/* Tier 2 Box */}
                      <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900' : 'bg-white'} space-y-1.5`}>
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wide text-[10px]">TẦNG 2: THỂ CHẾ & ĐỘ VÊNH</span>
                          <span className="font-mono font-bold text-teal-600 text-[11px]">S={sandboxResult.tier2.threatS} | D={sandboxResult.tier2.divergenceD}</span>
                        </div>
                        <div className="space-y-1">
                          {sandboxResult.tier2.riskFactors.map((rf, i) => (
                            <div key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1">
                              <span className="text-teal-500">•</span>
                              <span>{rf}</span>
                            </div>
                          ))}
                          {sandboxResult.tier2.divergenceDetails && (
                            <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-[10px] font-semibold border border-cyan-500/20 mt-1">
                              {sandboxResult.tier2.divergenceDetails}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tier 3 Box */}
                      <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900' : 'bg-white'} space-y-1.5`}>
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide text-[10px]">TẦNG 3: CÔNG THỨC TOÁN</span>
                          <span className="font-mono font-bold text-emerald-600 text-[11px]">V={sandboxResult.tier2.velocityV} | I={sandboxResult.tier2.impactI}</span>
                        </div>
                        <div className="p-1.5 rounded bg-slate-950 text-emerald-300 font-mono text-[10px] font-bold">
                          ({`(0.7*${sandboxResult.tier2.threatS} + 0.3*${sandboxResult.tier2.divergenceD})`} × {`(1 + 0.3*${sandboxResult.tier2.velocityV} + 0.4*${sandboxResult.tier2.impactI})`})
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                          <strong>Quyết định:</strong> {sandboxResult.tier3.actionRecommendation}
                        </p>
                      </div>
                    </div>

                    {/* Actionable SOP Steps */}
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-900/90' : 'bg-white'} border border-slate-200 dark:border-slate-800 space-y-2`}>
                      <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                        <Sliders className="w-4 h-4 text-emerald-500" />
                        Các Bước Tác Chiến Khuyến Nghị (SOP Triggered):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sandboxResult.tier3.sopSteps.map((step, sIdx) => (
                          <div key={sIdx} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs flex items-start gap-2 border border-slate-200 dark:border-slate-800">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{sIdx + 1}.</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`px-5 sm:px-6 py-3 border-t ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} flex items-center justify-between shrink-0 text-xs`}>
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldAlert className="w-4 h-4 text-emerald-500" />
            <span>Mô Hình Cảnh Báo Sớm Khủng Hoảng Truyền Thông Bộ Tài Chính</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
