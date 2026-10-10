import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Filter,
  X,
  FileText,
  Users,
  ChevronDown,
  ChevronUp,
  Radio,
  Scale,
  Sparkles,
  ArrowRight,
  BellRing,
  SlidersHorizontal
} from 'lucide-react';
import { ScrapedNewsItem, WarningAlertLevelType } from '../types';
import { extractQuantitativeBreakdown } from './QuantitativeFormulaBreakdown';
import { Decree376ClassificationEngine } from '../lib/decree376ClassificationEngine';

export type SopLifecycleLevel = 'DISTANT' | 'EARLY' | 'RAPID' | 'EMERGENCY' | 'DIRECTIVE_URGENT' | 'STANDARD' | 'ALL';

interface SopStageConfig {
  id: 'DISTANT' | 'EARLY' | 'RAPID' | 'EMERGENCY';
  stepNumber: number;
  levelTitle: string;
  codeName: string;
  scoreRange: string;
  badgeLabel: string;
  slaTimeframe: string;
  highlightTag?: string;
  leadUnit: string;
  icon: string;
  colorTheme: {
    bgActive: string;
    bgDefault: string;
    borderActive: string;
    borderDefault: string;
    text: string;
    badgeBg: string;
    ring: string;
  };
  triggerSignals: string[];
  standardOperatingProcedure: string[];
  keyDirective: string;
}

export const SOP_STAGE_CONFIGS: SopStageConfig[] = [
  {
    id: 'DISTANT',
    stepNumber: 1,
    levelTitle: 'Cảnh Báo Xa',
    codeName: 'Early Horizon',
    scoreRange: '20 – 39 điểm',
    badgeLabel: '○ [SOP 1] CẢNH BÁO XA',
    slaTimeframe: '24–48 giờ',
    leadUnit: 'Tổ Giám sát Truyền thông & Phòng Chuyên môn',
    icon: '○',
    colorTheme: {
      bgActive: 'bg-slate-900 text-white',
      bgDefault: 'bg-white hover:bg-slate-50',
      borderActive: 'border-slate-900 border-2 ring-2 ring-slate-900/20 shadow-md',
      borderDefault: 'border-slate-300 hover:border-slate-400',
      text: 'text-slate-950 font-black',
      badgeBg: 'bg-slate-100 text-slate-950 border-slate-300 font-black',
      ring: 'ring-slate-900'
    },
    triggerSignals: [
      'Tín hiệu yếu (Weak signals) khởi phát',
      'Chính sách mới ban hành xuất hiện các câu hỏi thăm dò',
      'Chuyên gia bắt đầu bình luận phân tích; báo chí đưa tin trích dẫn nguyên văn với thái độ trung tính'
    ],
    standardOperatingProcedure: [
      'Đưa sự việc vào danh sách giám sát tự động 24/7',
      'Tổng hợp băn khoăn ban đầu để lập sẵn bộ Hỏi - Đáp nội bộ (Internal Q&A)',
      'Chuẩn bị sẵn thông điệp định hướng thông tin',
      'Tuyệt đối không lên tiếng vội vã trên báo chí để tránh thu hút sự chú ý không cần thiết'
    ],
    keyDirective: 'Giữ tĩnh lặng truyền thông, chủ động chuẩn bị khung dữ liệu giải trình nội bộ.'
  },
  {
    id: 'EARLY',
    stepNumber: 2,
    levelTitle: 'Cảnh Báo Sớm',
    codeName: 'Early Warning',
    scoreRange: '40 – 59 điểm',
    badgeLabel: '□ [SOP 2] CẢNH BÁO SỚM',
    slaTimeframe: 'Trong 24 giờ',
    highlightTag: 'PHÒNG NGỪA TRỌNG YẾU',
    leadUnit: 'Cục/Vụ Chuyên môn Trực thuộc Bộ & Văn phòng Bộ',
    icon: '□',
    colorTheme: {
      bgActive: 'bg-slate-900 text-white',
      bgDefault: 'bg-white hover:bg-slate-50',
      borderActive: 'border-slate-900 border-2 ring-2 ring-slate-900/20 shadow-md',
      borderDefault: 'border-slate-300 hover:border-slate-400',
      text: 'text-slate-950 font-black',
      badgeBg: 'bg-slate-200 text-slate-950 border-slate-300 font-black',
      ring: 'ring-slate-900'
    },
    triggerSignals: [
      'Cùng một vướng mắc thủ tục nhưng nhiều địa phương/doanh nghiệp liên tục hỏi đi hỏi lại',
      'Xuất hiện các bài phân tích sâu về điểm nghẽn thực thi chính sách trên báo chuyên ngành',
      'Có nguy cơ biến thành làn sóng thắc mắc diện rộng nếu chậm giải thích'
    ],
    standardOperatingProcedure: [
      'Làm việc ngay với Cục/Vụ chuyên môn để làm rõ bản chất vướng mắc nghiệp vụ',
      'Hoàn thiện ngân hàng Q&A giải thích rõ ràng, đơn giản hóa câu chữ pháp lý',
      'Chuẩn bị sẵn người phát ngôn chuyên trách',
      'Soạn thảo bài hướng dẫn nghiệp vụ/Infographic để cung cấp cho báo chí',
      'Thiết lập radar giám sát chặt chẽ trong 24 giờ'
    ],
    keyDirective: 'Giải quyết triệt để từ cấp phòng ngừa; không để vướng mắc kỹ thuật trở thành khủng hoảng chính trị - xã hội.'
  },
  {
    id: 'RAPID',
    stepNumber: 3,
    levelTitle: 'Cảnh Báo Nhanh',
    codeName: 'Rapid Alert',
    scoreRange: '60 – 74 điểm',
    badgeLabel: '◇ [SOP 3] CẢNH BÁO NHANH',
    slaTimeframe: 'Trong ngày (12h)',
    leadUnit: 'Lãnh đạo Bộ, Người phát ngôn & Cục Báo chí',
    icon: '◇',
    colorTheme: {
      bgActive: 'bg-slate-900 text-white',
      bgDefault: 'bg-white hover:bg-slate-50',
      borderActive: 'border-slate-900 border-2 shadow-lg ring-2 ring-slate-900/20',
      borderDefault: 'border-slate-400 hover:border-slate-500',
      text: 'text-slate-950 font-black',
      badgeBg: 'bg-slate-900 text-white font-black border-slate-900',
      ring: 'ring-slate-900'
    },
    triggerSignals: [
      'Nhiều cơ quan báo chí lớn cùng đăng bài phản ánh bất cập chính sách',
      'Mạng xã hội tăng đột biến lượt chia sẻ và bình luận gay gắt',
      'Bắt đầu xuất hiện câu hỏi trực diện quy kết trách nhiệm chỉ đạo điều hành của Bộ'
    ],
    standardOperatingProcedure: [
      'Báo cáo nhanh Lãnh đạo Bộ ngay trong đầu buổi làm việc',
      'Phân công đầu mối xử lý và phát ngôn chính thức ngay trong ngày (12 giờ)',
      'Phối hợp các cơ quan báo chí chủ lực (Báo Nhân Dân, Cổng TTĐT Chính phủ, VTV...) đăng nội dung giải thích chính sách',
      'Ban hành công văn hướng dẫn nghiệp vụ thống nhất toàn quốc để dập tắt độ vênh thực thi'
    ],
    keyDirective: 'Hành động thống nhất trong ngày; chủ động định hướng trước khi phiên giao ban ngày kế tiếp diễn ra.'
  },
  {
    id: 'EMERGENCY',
    stepNumber: 4,
    levelTitle: 'Cảnh Báo Khẩn Cấp',
    codeName: 'Emergency Alert',
    scoreRange: '75 – 100 điểm',
    badgeLabel: '△ [SOP 4] KHẨN CẤP',
    slaTimeframe: 'Hỏa tốc 2–4 giờ',
    highlightTag: 'KÍCH HOẠT TỔ PHẢN ỨNG NHANH',
    leadUnit: 'Tổ Phản ứng Nhanh Khủng hoảng Bộ & Ban Cán sự Đảng',
    icon: '△',
    colorTheme: {
      bgActive: 'bg-slate-900 text-white',
      bgDefault: 'bg-white hover:bg-slate-50',
      borderActive: 'border-slate-900 border-2 bg-slate-900 text-white shadow-xl ring-2 ring-slate-900/30',
      borderDefault: 'border-slate-400 border-2 hover:border-slate-600',
      text: 'text-slate-950 font-black',
      badgeBg: 'bg-slate-900 text-white font-black border-slate-900',
      ring: 'ring-slate-900'
    },
    triggerSignals: [
      'Khủng hoảng truyền thông bùng phát; tốc độ lan truyền cực nhanh xuyên nền tảng',
      'Xuất hiện tin đồn/tin sai lệch nghiêm trọng làm suy giảm niềm tin thị trường',
      'Liên quan trực tiếp đến nhân sự lãnh đạo Bộ (thanh tra, pháp lý, trách nhiệm cá nhân)',
      'Nguy cơ gây bất ổn thị trường tài chính, chứng khoán hoặc hệ thống thuế - kho bạc'
    ],
    standardOperatingProcedure: [
      'Kích hoạt ngay Tổ phản ứng nhanh khủng hoảng truyền thông; không chờ báo cáo ngày',
      'Tổ chức họp báo khẩn cấp hoặc phát hành thông cáo báo chí chính thức trong vòng 2–4 giờ',
      'Chỉ định người phát ngôn duy nhất có thẩm quyền cung cấp thông tin',
      'Phối hợp chặt chẽ với các cơ quan an ninh mạng để ngăn chặn và xử lý thông tin xuyên tạc'
    ],
    keyDirective: 'Ưu tiên cao nhất: Dập tắt tin đồn sai lệch trong 2-4h, bảo vệ ổn định thị trường tài chính quốc gia.'
  }
];

interface SopLifecycleStagePipelineProps {
  articles: ScrapedNewsItem[];
  selectedLevel: SopLifecycleLevel;
  onSelectLevel: (level: SopLifecycleLevel) => void;
  onSelectArticle?: (article: ScrapedNewsItem) => void;
  onOpenWarningPipeline?: (article: ScrapedNewsItem) => void;
  onDraftStatement?: (article: ScrapedNewsItem) => void;
  onOpenGmailAlertModal?: (article: ScrapedNewsItem) => void;
  onOpenAlertTriggerModal?: () => void;
  onOpenBatchAlertDrawer?: () => void;
  activeTriggersCount?: number;
  activeAlertsCount?: number;
  isDark?: boolean;
}

export const SopLifecycleStagePipeline: React.FC<SopLifecycleStagePipelineProps> = ({
  articles = [],
  selectedLevel = 'ALL',
  onSelectLevel,
  onSelectArticle,
  onOpenWarningPipeline,
  onDraftStatement,
  onOpenGmailAlertModal,
  onOpenAlertTriggerModal,
  onOpenBatchAlertDrawer,
  activeTriggersCount = 0,
  activeAlertsCount = 0,
  isDark = false
}) => {
  const [showFullMatrix, setShowFullMatrix] = useState<boolean>(false);
  // Sub-tab state for DIRECTIVE_URGENT tab ('ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED')
  const [directiveSubTab, setDirectiveSubTab] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  // Consolidated list of urgent items requiring executive directive & immediate handling (Đồng bộ chuẩn 4 Cấp độ cảnh báo)
  const directiveUrgentArticles = useMemo(() => {
    return articles.filter((item) => {
      if (item.isMarketDigest) return false;
      const d376 = Decree376ClassificationEngine.classify(item);
      if (d376.isExcluded || d376.tier === 0) return false;
      const breakdown = extractQuantitativeBreakdown(item);
      // Loại trừ hoàn toàn tin giám sát thường quy (< 20 điểm)
      if (breakdown.level === 'STANDARD' || breakdown.riskScore < 20) return false;
      const isWarning =
        breakdown.level === 'EMERGENCY' ||
        breakdown.level === 'RAPID' ||
        breakdown.level === 'EARLY' ||
        breakdown.level === 'DISTANT';
      const isIntervention = Boolean(item.informationVacuum?.isAlertWarranted);
      return Boolean(isWarning || isIntervention);
    });
  }, [articles]);

  // Group articles by their warning level
  const stageCounts = useMemo(() => {
    const counts = {
      DISTANT: 0,
      EARLY: 0,
      RAPID: 0,
      EMERGENCY: 0,
      DIRECTIVE_URGENT: directiveUrgentArticles.length,
      STANDARD: 0,
      TOTAL: articles.length
    };

    articles.forEach((item) => {
      const breakdown = extractQuantitativeBreakdown(item);
      if (breakdown.level in counts) {
        counts[breakdown.level as keyof typeof counts]++;
      } else {
        counts.STANDARD++;
      }
    });

    return counts;
  }, [articles, directiveUrgentArticles]);

  // Filtered list when a specific stage is clicked
  const filteredArticles = useMemo(() => {
    if (selectedLevel === 'ALL') return [];
    if (selectedLevel === 'DIRECTIVE_URGENT') return directiveUrgentArticles;
    return articles.filter((item) => {
      const breakdown = extractQuantitativeBreakdown(item);
      return breakdown.level === selectedLevel;
    });
  }, [articles, selectedLevel, directiveUrgentArticles]);

  return (
    <div className="p-5 sm:p-6 rounded-2xl border-2 transition-all space-y-5 bg-white border-slate-300 shadow-sm text-slate-900">
      {/* 1. Header with Title & Quick Filter Reset */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-slate-900 text-white shadow-xs">
            <Radio className="w-6 h-6 animate-pulse text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-wide text-slate-950">
                Vòng Đời SOP 4 Cấp Độ Cảnh Báo Sớm Khủng Hoảng
              </h3>
              <span className="px-3 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-950 border border-emerald-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Ngưỡng Tự Động Chuẩn Hóa NĐ 376</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1">
              Hệ thống tự động phân loại 4 cấp độ cảnh báo (C4: 75–100đ, C3: 60–74đ, C2: 40–59đ, C1: 20–39đ, Mức 0: &lt;20đ thường quy) bám sát Cẩm nang 100 tình huống – Loại trừ 100% điểm tin thị trường
            </p>
          </div>
        </div>

        {/* Filter State / Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Integrated Quick Tab: Vấn đề cần chỉ đạo & xử lý khẩn */}
          <button
            onClick={() => onSelectLevel(selectedLevel === 'DIRECTIVE_URGENT' ? 'ALL' : 'DIRECTIVE_URGENT')}
            className={`px-3.5 py-2 rounded-xl border-2 text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 shadow-sm ${
              selectedLevel === 'DIRECTIVE_URGENT'
                ? 'bg-rose-700 text-white border-rose-800 ring-2 ring-rose-500/50'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-950 border-rose-300'
            }`}
            title="Lọc danh sách các vấn đề khẩn cấp & cần chỉ đạo xử lý trực tiếp trong quy trình SOP"
          >
            <AlertTriangle className={`w-4 h-4 ${selectedLevel === 'DIRECTIVE_URGENT' ? 'text-white' : 'text-rose-600 animate-pulse'}`} />
            <span>Vấn đề cần chỉ đạo & xử lý khẩn ({directiveUrgentArticles.length})</span>
            {selectedLevel === 'DIRECTIVE_URGENT' && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">✓</span>}
          </button>

          {selectedLevel !== 'ALL' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-300">
                <Filter className="w-4 h-4 text-slate-900" />
                <span>Đang lọc: {
                  selectedLevel === 'DIRECTIVE_URGENT' ? 'Sự việc khẩn & Cần chỉ đạo' :
                  selectedLevel === 'DISTANT' ? 'Cấp 1: Cảnh Báo Xa' :
                  selectedLevel === 'EARLY' ? 'Cấp 2: Cảnh Báo Sớm' :
                  selectedLevel === 'RAPID' ? 'Cấp 3: Cảnh Báo Nhanh' :
                  selectedLevel === 'EMERGENCY' ? 'Cấp 4: Cảnh Báo Khẩn Cấp' : 'Giám sát Thường quy'
                } ({filteredArticles.length} bài)</span>
              </span>
              <button
                onClick={() => onSelectLevel('ALL')}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-950"
                title="Hủy lọc và hiển thị tất cả bài viết"
              >
                <X className="w-4 h-4 text-slate-900" />
                <span>Xóa lọc</span>
              </button>
            </div>
          ) : (
            <span className="text-xs sm:text-sm font-extrabold text-slate-800 italic">
              Bấm vào từng cấp độ bên dưới để lọc tức thì danh sách bài viết
            </span>
          )}

          <button
            onClick={() => setShowFullMatrix(!showFullMatrix)}
            className="px-3.5 py-2 rounded-xl border-2 text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-950"
          >
            <span>{showFullMatrix ? 'Thu gọn SOP' : 'Tra cứu Bảng Ma trận SOP'}</span>
            {showFullMatrix ? <ChevronUp className="w-4 h-4 text-slate-900" /> : <ChevronDown className="w-4 h-4 text-slate-900" />}
          </button>
        </div>
      </div>

      {/* 2. Visual 4-Level Pipeline Cards Grid (Dynamic Executive CSS Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5">
        {SOP_STAGE_CONFIGS.map((stage) => {
          const isSelected = selectedLevel === stage.id;
          const count = stageCounts[stage.id] || 0;
          const isPrimaryPriority = stage.id === 'EMERGENCY' || stage.id === 'RAPID';

          // Dynamic column span logic for executive tablets:
          // Primary SOP status cards (EMERGENCY / RAPID) take full width (col-span-12) or prioritized 6 cols on tablet (md:),
          // and equal 3 cols on extra-large screens (xl:col-span-3).
          let colSpanClass = 'md:col-span-6 xl:col-span-3';
          if (stage.id === 'EMERGENCY') {
            colSpanClass = count > 0 
              ? 'md:col-span-12 xl:col-span-3' 
              : 'md:col-span-12 lg:col-span-6 xl:col-span-3';
          } else if (stage.id === 'RAPID') {
            colSpanClass = count > 0 
              ? 'md:col-span-12 xl:col-span-3' 
              : 'md:col-span-6 xl:col-span-3';
          }

          return (
            <div
              key={stage.id}
              onClick={() => onSelectLevel(isSelected ? 'ALL' : stage.id)}
              className={`${colSpanClass} p-5 sm:p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden select-none min-h-[240px] ${
                isSelected
                  ? 'bg-slate-950 text-white border-slate-950 shadow-xl ring-2 ring-slate-900/30'
                  : isPrimaryPriority && count > 0
                  ? 'bg-white border-slate-900 hover:border-black text-slate-950 shadow-md'
                  : 'bg-white hover:bg-slate-50 border-slate-300 hover:border-slate-400 text-slate-950 shadow-xs'
              }`}
            >
              {/* Highlight Tag for Level 2 or 4 */}
              {stage.highlightTag && (
                <div className="absolute top-0 right-0">
                  <span className={`px-3 py-1 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-bl-xl border-l border-b ${
                    isSelected
                      ? 'bg-white text-slate-950 border-slate-300'
                      : 'bg-slate-950 text-white border-slate-950'
                  }`}>
                    {stage.highlightTag}
                  </span>
                </div>
              )}

              {/* Card Top: Level & Count */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-black ${isSelected ? 'text-white' : 'text-slate-950'}`}>{stage.icon}</span>
                    <span className={`text-sm sm:text-base font-black uppercase tracking-wider ${isSelected ? 'text-slate-200' : 'text-slate-950'}`}>
                      Cấp {stage.stepNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-black font-mono border ${
                      isSelected
                        ? 'bg-white text-slate-950 border-white'
                        : count > 0 && isPrimaryPriority
                        ? 'bg-slate-950 text-white border-slate-950'
                        : 'bg-slate-200 text-slate-950 border-slate-300'
                    }`}>
                      {count} bài viết
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <h4 className={`text-lg sm:text-xl font-black ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                    {stage.levelTitle}
                  </h4>
                  <div className={`flex items-center gap-2 text-xs sm:text-sm font-mono font-extrabold mt-1 ${
                    isSelected ? 'text-slate-300' : 'text-slate-900'
                  }`}>
                    <span>{stage.codeName}</span>
                    <span>•</span>
                    <span className={`font-black ${isSelected ? 'text-white' : 'text-slate-950'}`}>{stage.scoreRange}</span>
                  </div>
                </div>

                <div className={`text-xs sm:text-sm font-bold line-clamp-3 leading-relaxed mb-3 ${
                  isSelected ? 'text-slate-200' : 'text-slate-900'
                }`}>
                  {stage.triggerSignals[0]}
                </div>
              </div>

              {/* Card Bottom: SLA, Lead Unit & Directive */}
              <div className={`pt-3 border-t space-y-2.5 ${isSelected ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold">
                  <span className={`flex items-center gap-1 ${isSelected ? 'text-slate-300' : 'text-slate-800'}`}>
                    <Clock className="w-4 h-4" />
                    SLA Tác Chiến:
                  </span>
                  <span className={`font-black ${isSelected ? 'text-white' : 'text-slate-950'}`}>{stage.slaTimeframe}</span>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold gap-2">
                  <span className={`truncate max-w-[200px] font-bold ${isSelected ? 'text-slate-300' : 'text-slate-900'}`} title={stage.leadUnit}>
                    🏛️ {stage.leadUnit.split('&')[0]}
                  </span>
                  <span className={`font-black flex items-center gap-0.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                    <span>{isSelected ? 'Đang lọc' : 'Lọc tin'}</span>
                    <ChevronRight className="w-4 h-4 text-slate-950" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Routine / Standard Monitoring Bar */}
      <div className={`px-5 py-3.5 rounded-2xl border-2 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer transition ${
        selectedLevel === 'STANDARD'
          ? 'bg-slate-900 border-slate-900 text-white shadow-md'
          : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-950'
      }`}
        onClick={() => onSelectLevel(selectedLevel === 'STANDARD' ? 'ALL' : 'STANDARD')}
      >
        <div className="flex items-center gap-2">
          <Scale className={`w-4 h-4 ${selectedLevel === 'STANDARD' ? 'text-white' : 'text-slate-900'}`} />
          <span className="font-black">
            Giám sát Thường quy & Điều hành Định kỳ (&lt; 20 điểm):
          </span>
          <span className={`hidden md:inline font-bold ${selectedLevel === 'STANDARD' ? 'text-slate-200' : 'text-slate-800'}`}>
            Xử phạt vi phạm hành chính, điểm báo thị trường giao dịch khách quan, quy chuẩn thực thi pháp luật.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono font-black">
            {stageCounts.STANDARD} bài viết an toàn
          </span>
          <span className="font-extrabold underline">
            {selectedLevel === 'STANDARD' ? '✓ Đang lọc' : 'Lọc xem ➔'}
          </span>
        </div>
      </div>

      {/* 3. Filtered Articles Preview List if a stage is active */}
      {selectedLevel !== 'ALL' && (
        <div className="p-5 rounded-2xl border-2 border-slate-300 bg-slate-50 space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black uppercase text-slate-950 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-900" />
                Danh Sách Bài Viết Đang Lọc Theo Cấp Độ ({filteredArticles.length})
              </span>
            </div>
            <span className="text-xs font-bold text-slate-700">
              Nhấp bài viết để phân tích sâu hoặc xem toàn cảnh
            </span>
          </div>

          {/* If DIRECTIVE_URGENT, render Progress Status Tabs (Segmented Control) */}
          {selectedLevel === 'DIRECTIVE_URGENT' && (() => {
            const pendingCount = filteredArticles.filter(a => !a.handlingStatus || a.handlingStatus === 'NEW').length;
            const inProgressCount = filteredArticles.filter(a => a.handlingStatus === 'IN_PROGRESS').length;
            const completedCount = filteredArticles.filter(a => a.handlingStatus === 'DONE').length;

            return (
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200 text-xs font-black w-fit">
                <button
                  type="button"
                  onClick={() => setDirectiveSubTab('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    directiveSubTab === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  Tất cả ({filteredArticles.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDirectiveSubTab('PENDING')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    directiveSubTab === 'PENDING' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <span>Chờ xử lý</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono text-[10px]">
                    {pendingCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirectiveSubTab('IN_PROGRESS')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    directiveSubTab === 'IN_PROGRESS' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <span>Đang xử lý</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-500 text-white font-mono text-[10px]">
                    {inProgressCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirectiveSubTab('COMPLETED')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    directiveSubTab === 'COMPLETED' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <span>Đã hoàn tất</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-mono text-[10px]">
                    {completedCount}
                  </span>
                </button>
              </div>
            );
          })()}

          {filteredArticles.length === 0 ? (
            <div className="py-6 text-center text-xs sm:text-sm font-bold text-slate-600">
              Không có bài viết nào thuộc cấp độ này trong phiên theo dõi hiện tại.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 max-h-80 overflow-y-auto space-y-2.5 pr-1">
              {filteredArticles.map((article) => {
                const breakdown = extractQuantitativeBreakdown(article);
                return (
                  <div
                    key={article.id}
                    onClick={() => onSelectArticle && onSelectArticle(article)}
                    className="pt-3 pb-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black px-2.5 py-0.5 rounded bg-slate-900 text-white">
                          {article.source || 'Báo chí'}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          {article.publishedTimeStr || article.timeAgo || 'Vừa cập nhật'}
                        </span>
                        {(article.handlingStatus === 'IN_PROGRESS' || article.handlingActionLabel) && (
                          <span className="text-xs font-black px-2.5 py-0.5 rounded bg-blue-600 text-white border border-blue-700 flex items-center gap-1 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-blue-200 animate-pulse" />
                            <span>🔵 Đang xử lý {article.handlingActionLabel ? `• ${article.handlingActionLabel}` : ''}</span>
                          </span>
                        )}
                        {(article.isAlertTriggered || article.triggerRuleName) && (
                          <span className="text-xs font-black px-2.5 py-0.5 rounded bg-rose-700 text-white border border-rose-800 flex items-center gap-1 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-rose-200 animate-ping" />
                            <span>🚨 CẢNH BÁO KÍCH HOẠT {article.triggerRuleName ? `• ${article.triggerRuleName}` : ''}</span>
                          </span>
                        )}
                        {breakdown.D > 0 && (
                          <span className="text-xs font-black px-2 py-0.5 rounded bg-slate-200 text-slate-950 border border-slate-300">
                            ⚠️ Vênh chỉ đạo (D={breakdown.D})
                          </span>
                        )}
                      </div>
                      <h5 className="text-xs sm:text-sm font-black text-slate-950 hover:text-slate-800 transition truncate">
                        {article.title}
                      </h5>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-mono font-black text-slate-950">
                          Risk: {breakdown.riskScore}đ
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-700">
                          S={breakdown.S} · D={breakdown.D} · V={breakdown.V} · I={breakdown.I}
                        </div>
                      </div>
                      {onDraftStatement && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDraftStatement(article);
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black text-xs transition cursor-pointer flex items-center gap-1"
                          title="Soạn thảo thông cáo báo chí / văn bản chỉ đạo"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-950" />
                          <span>Soạn văn bản</span>
                        </button>
                      )}
                      {onOpenWarningPipeline && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenWarningPipeline(article);
                          }}
                          className="p-2 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-950 transition cursor-pointer"
                          title="Xem Mô hình 3 Tầng & 4 Cấp độ cảnh báo"
                        >
                          <ShieldAlert className="w-4 h-4 text-slate-950" />
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-800" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Full SOP Matrix Breakdown Table (Accordion View) */}
      {showFullMatrix && (
        <div className="p-5 sm:p-6 rounded-2xl border-2 border-slate-300 bg-slate-50 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-300">
            <h4 className="text-xs sm:text-sm font-black uppercase text-slate-950 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-900" />
              Bảng Ma Trận Bốn Cấp Độ Cảnh Báo Và Kịch Bản Phản Ứng Tác Chiến (SOP)
            </h4>
            <span className="text-xs font-bold text-slate-700">Trích xuất nguyên bản Báo Cáo Chuyên Đề</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 text-xs font-black uppercase text-slate-900 bg-slate-200">
                  <th className="py-3 px-3.5 w-48">Cấp Độ Cảnh Báo</th>
                  <th className="py-3 px-3.5 w-32">Điểm Rủi Ro</th>
                  <th className="py-3 px-3.5 w-72">Dấu Hiệu Kỹ Thuật Điển Hình</th>
                  <th className="py-3 px-3.5">Kịch Bản Hành Động Tiêu Chuẩn (SOP)</th>
                  <th className="py-3 px-3.5 w-36">Đơn Vị Chủ Trì</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 bg-white">
                {SOP_STAGE_CONFIGS.map((stage) => (
                  <tr key={stage.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-3.5 align-top">
                      <div className="font-black text-slate-950 flex items-center gap-1.5 text-sm sm:text-base">
                        <span>{stage.icon}</span>
                        <span>{stage.levelTitle}</span>
                      </div>
                      <div className="text-xs font-mono font-extrabold text-slate-800 mt-0.5">{stage.codeName}</div>
                      <div className="text-xs text-slate-900 font-black mt-1">SLA: {stage.slaTimeframe}</div>
                    </td>
                    <td className="py-3.5 px-3.5 align-top font-mono font-black text-slate-950 text-sm">
                      {stage.scoreRange}
                    </td>
                    <td className="py-3.5 px-3.5 align-top space-y-1 text-slate-900 font-extrabold">
                      {stage.triggerSignals.map((sig, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 leading-snug">
                          <span className="text-slate-950 font-black shrink-0">•</span>
                          <span>{sig}</span>
                        </div>
                      ))}
                    </td>
                    <td className="py-3.5 px-3.5 align-top space-y-1 text-slate-900 font-extrabold">
                      {stage.standardOperatingProcedure.map((sop, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 leading-snug">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-900 shrink-0 mt-0.5" />
                          <span>{sop}</span>
                        </div>
                      ))}
                      <div className="pt-2 text-xs font-black text-slate-950 italic">
                        💡 {stage.keyDirective}
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 align-top text-slate-900 font-extrabold text-xs">
                      {stage.leadUnit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
