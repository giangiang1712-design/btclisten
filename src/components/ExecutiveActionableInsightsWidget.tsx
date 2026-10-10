import React, { useMemo } from 'react';
import {
  Sparkles,
  ShieldAlert,
  Megaphone,
  TrendingUp,
  FileCheck,
  ArrowRight,
  Send,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { ScrapeResponse, ScrapedNewsItem } from '../types';
import { useTheme } from '../lib/theme';
import { isRiskArticle } from '../lib/newsClassification';

interface ExecutiveActionableInsightsWidgetProps {
  data: ScrapeResponse | null;
  onSelectArticle: (article: ScrapedNewsItem) => void;
  onDraftStatement: (article: ScrapedNewsItem) => void;
  onNavigateTab: (tab: any) => void;
}

interface ActionableStep {
  id: string;
  category: 'urgent_response' | 'media_directive' | 'market_positive' | 'monitoring';
  title: string;
  directive: string;
  rationale: string;
  statusText: string;
  statusColor: 'rose' | 'amber' | 'emerald' | 'blue';
  actionLabel: string;
  targetArticle?: ScrapedNewsItem;
}

export const ExecutiveActionableInsightsWidget: React.FC<ExecutiveActionableInsightsWidgetProps> = ({
  data,
  onSelectArticle,
  onDraftStatement,
  onNavigateTab,
}) => {
  const { isDark } = useTheme();

  // Tính toán các khuyến nghị hành động theo ngôn ngữ kinh tế - quản lý vĩ mô
  const actionableSteps = useMemo<ActionableStep[]>(() => {
    const steps: ActionableStep[] = [];
    const news = data?.news || [];
    const riskNews = news.filter((n) => isRiskArticle(n));
    const topRisk = riskNews.length > 0
      ? riskNews.sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0))[0]
      : (data?.executiveSummaryReport?.topCrisisDirectives && data.executiveSummaryReport.topCrisisDirectives.length > 0)
      ? data.executiveSummaryReport.topCrisisDirectives[0]
      : null;

    // 1. Khuyến nghị xử lý điểm nghẽn / phản ánh doanh nghiệp & thị trường
    if (topRisk) {
      steps.push({
        id: 'step-1-urgent',
        category: 'urgent_response',
        title: 'Chỉ đạo tháo gỡ điểm nghẽn & xử lý kiến nghị thị trường',
        directive: `Giao Cục/Vụ chuyên môn khẩn trương rà soát vấn đề "${topRisk.title}" được các cơ quan báo chí phản ánh, kịp thời ban hành văn bản giải thích nghiệp vụ hoặc tháo gỡ vướng mắc cho Dân và Doanh nghiệp.`,
        rationale: 'Ngăn chặn thông tin suy diễn tiêu cực, duy trì sự nhất quán trong thực thi chính sách tài chính.',
        statusText: 'Cần giải quyết ngay',
        statusColor: 'rose',
        actionLabel: 'Soạn văn bản chỉ đạo',
        targetArticle: topRisk,
      });
    } else {
      steps.push({
        id: 'step-1-routine',
        category: 'monitoring',
        title: 'Duy trì cơ chế tiếp nhận & giải đáp vướng mắc chính sách',
        directive: 'Tiếp tục duy trì đường dây nóng và tổ công tác trực tuyến tháo gỡ khó khăn về thủ tục thuế, hải quan, đẩy nhanh lu thông hàng hóa và dòng vốn cho nền kinh tế.',
        rationale: 'Đảm bảo môi trường kinh doanh thông thoáng, không phát sinh bức xúc cục bộ.',
        statusText: 'Duy trì nhịp độ',
        statusColor: 'blue',
        actionLabel: 'Xem quy trình xử lý',
      });
    }

    // 2. Khuyến nghị định hướng truyền thông & chủ động làm rõ chính sách
    const mediaDirective = data?.executiveSummaryReport?.mediaDirective ||
      'Chủ động phối hợp Cổng thông tin Bộ và các báo đài chủ lực (VTV, TTXVN, Báo Đầu tư, Thời báo Tài chính) cung cấp tài liệu hỏi - đáp (Q&A) chi tiết về các dự thảo và chính sách tài khóa mới ban hành.';

    steps.push({
      id: 'step-2-media',
      category: 'media_directive',
      title: 'Định hướng truyền thông chính sách & làm rõ dư luận',
      directive: mediaDirective,
      rationale: 'Định hình dòng dư luận chuẩn xác, tránh khoảng trống thông tin khiến thị trường hoang mang.',
      statusText: 'Định hướng dư luận',
      statusColor: 'amber',
      actionLabel: 'Soạn thông cáo báo chí',
      targetArticle: topRisk || news[0],
    });

    // 3. Khuyến nghị lan tỏa kết quả tích cực & củng cố niềm tin đầu tư
    const positiveDirectives = data?.executiveSummaryReport?.topPositiveDirectives;
    const topPositive = positiveDirectives && positiveDirectives.length > 0 ? positiveDirectives[0] : null;

    if (topPositive) {
      steps.push({
        id: 'step-3-positive',
        category: 'market_positive',
        title: 'Đẩy mạnh truyền thông về tiến độ giải ngân & kỷ cương tài khóa',
        directive: `Tăng cường tuyến bài chuyên sâu về "${topPositive.title}", làm nổi bật quyết tâm điều hành ngân sách, tiến độ giải ngân vốn đầu tư công và hiệu quả chính sách tài khóa hỗ trợ tăng trưởng.`,
        rationale: 'Củng cố niềm tin của cộng đồng doanh nghiệp và các nhà đầu tư trong và ngoài nước.',
        statusText: 'Chủ động lan tỏa',
        statusColor: 'emerald',
        actionLabel: 'Lan tỏa thông điệp',
        targetArticle: topPositive,
      });
    } else {
      steps.push({
        id: 'step-3-positive-default',
        category: 'market_positive',
        title: 'Lan tỏa điểm sáng thu ngân sách & ổn định kinh tế vĩ mô',
        directive: 'Tăng cường thông tin về các giải pháp cải cách thủ tục hành chính, chuyển đổi số ngành Tài chính và tiến độ cân đối thu - chi ngân sách nhà nước bền vững.',
        rationale: 'Gia tăng sự đồng thuận xã hội đối với các chính sách lớn của Bộ.',
        statusText: 'Chủ động lan tỏa',
        statusColor: 'emerald',
        actionLabel: 'Soạn nội dung truyền thông',
        targetArticle: news[0],
      });
    }

    return steps;
  }, [data?.news, data?.executiveSummaryReport]);

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isDark
          ? 'bg-slate-900 border-slate-800 shadow-sm'
          : 'bg-white border-slate-200/90 shadow-2xs'
      }`}
    >
      {/* Header Khuyến nghị hành động */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Khuyến Nghị Hành Động &amp; Tham Mưu Tác Chiến
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                Actionable Insights
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Gợi ý các bước điều hành tiếp theo bằng ngôn ngữ quản lý kinh tế, trực tiếp phục vụ công tác lãnh đạo.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('briefing')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shadow-xs shrink-0 self-start sm:self-center ${
            isDark
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
          }`}
          title="Vào phân hệ Soạn Văn Bản Chỉ Đạo"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Vào Phòng Soạn Thảo Chỉ Đạo</span>
          <ArrowRight className="w-3 h-3 ml-0.5" />
        </button>
      </div>

      {/* Danh sách 3 khuyến nghị hành động chiến lược */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
        {actionableSteps.map((step, idx) => {
          const isRose = step.statusColor === 'rose';
          const isAmber = step.statusColor === 'amber';
          const isEmerald = step.statusColor === 'emerald';
          const isBlue = step.statusColor === 'blue';

          const statusBadgeClass = isRose
            ? isDark ? 'bg-rose-950/60 text-rose-300 border-rose-800/60' : 'bg-rose-50 text-rose-800 border-rose-200'
            : isAmber
            ? isDark ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-800 border-amber-200'
            : isEmerald
            ? isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800/60' : 'bg-blue-50 text-blue-800 border-blue-200';

          const iconContainerClass = isRose
            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            : isAmber
            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            : isEmerald
            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            : 'bg-blue-500/10 text-blue-500 border-blue-500/20';

          return (
            <div
              key={step.id}
              className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all hover:shadow-xs ${
                isDark
                  ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-50/50 border-slate-200/90 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div>
                {/* Header bước hành động */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs border shrink-0 ${iconContainerClass}`}>
                      {idx + 1}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${
                      isRose ? 'text-rose-500 dark:text-rose-400' :
                      isAmber ? 'text-amber-500 dark:text-amber-400' :
                      isEmerald ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-500 dark:text-blue-400'
                    }`}>
                      {isRose ? 'Nhiệm vụ trọng tâm' : isAmber ? 'Truyền thông chính sách' : isEmerald ? 'Lan tỏa điểm sáng' : 'Giám sát điều hành'}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeClass}`}>
                    {step.statusText}
                  </span>
                </div>

                {/* Tiêu đề & Nội dung chỉ đạo */}
                <h4 className={`text-xs font-bold leading-snug mb-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {step.title}
                </h4>

                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {step.directive}
                </p>

                {/* Cơ sở kinh tế */}
                <div className={`mt-2.5 p-2 rounded-lg border text-[11px] leading-relaxed ${
                  isDark ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-white border-slate-200/80 text-slate-600'
                }`}>
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Mục tiêu: </span>
                  {step.rationale}
                </div>
              </div>

              {/* Nút hành động */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                {step.targetArticle ? (
                  <button
                    type="button"
                    onClick={() => onSelectArticle(step.targetArticle!)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 truncate max-w-[120px] text-left cursor-pointer"
                    title={step.targetArticle.title}
                  >
                    Xem tin gốc &rarr;
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400">Điều hành thường kỳ</span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (step.targetArticle) {
                      onDraftStatement(step.targetArticle);
                    } else {
                      onNavigateTab('briefing');
                    }
                  }}
                  className={`inline-flex items-center gap-1 text-xs font-bold transition cursor-pointer hover:underline ${
                    isRose ? 'text-rose-600 dark:text-rose-400' :
                    isAmber ? 'text-amber-600 dark:text-amber-400' :
                    isEmerald ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  <span>{step.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
