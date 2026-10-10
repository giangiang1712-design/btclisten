import React, { useMemo, useState } from 'react';
import {
  FileText,
  Landmark,
  TrendingUp,
  AlertTriangle,
  Building2,
  Send,
  ArrowRight,
  Copy,
  Check,
  ShieldCheck,
  Compass,
  Layers,
  ChevronRight
} from 'lucide-react';
import { ScrapeResponse, ScrapedNewsItem } from '../types';
import { useTheme } from '../lib/theme';
import { isRiskArticle } from '../lib/newsClassification';

interface ExecutiveSummaryBriefWidgetProps {
  data: ScrapeResponse | null;
  onSelectArticle: (article: ScrapedNewsItem) => void;
  onDraftStatement: (article: ScrapedNewsItem) => void;
  onNavigateTab: (tab: any) => void;
}

interface SummaryBullet {
  id: string;
  pillar: 'fiscal_policy' | 'capital_market' | 'market_feedback';
  badgeTitle: string;
  badgeColor: 'rose' | 'amber' | 'emerald' | 'indigo';
  icon: React.ElementType;
  headline: string;
  economicImpact: string;
  governanceAction: string;
  leadAgency: string;
  sourceArticle?: ScrapedNewsItem;
}

export const ExecutiveSummaryBriefWidget: React.FC<ExecutiveSummaryBriefWidgetProps> = ({
  data,
  onSelectArticle,
  onDraftStatement,
  onNavigateTab,
}) => {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  // Tự động tổng hợp các tin bài có tác động chính trị/tài chính cao nhất thành 3 gạch đầu dòng kinh tế súc tích
  const summaryBullets = useMemo<SummaryBullet[]>(() => {
    const news = data?.news || [];
    if (news.length === 0) {
      return [
        {
          id: 'b1-empty',
          pillar: 'fiscal_policy',
          badgeTitle: 'Tài khóa & Ngân sách',
          badgeColor: 'indigo',
          icon: Landmark,
          headline: 'Thu chi ngân sách và điều hành tài khóa giữ vững ổn định vĩ mô',
          economicImpact: 'Kỷ cương tài chính - ngân sách được giữ nghiêm; dòng vốn giải ngân đầu tư công tiếp tục được đôn đốc tạo động lực tăng trưởng GDP.',
          governanceAction: 'Tiếp tục theo dõi tiến độ các khoản thu chủ lực và đẩy nhanh tiến độ thẩm định phân bổ vốn các dự án trọng điểm quốc gia.',
          leadAgency: 'Vụ NSNN, Kho bạc Nhà nước',
        },
        {
          id: 'b2-empty',
          pillar: 'capital_market',
          badgeTitle: 'Thị trường Vốn & Tiền tệ',
          badgeColor: 'emerald',
          icon: TrendingUp,
          headline: 'Thị trường chứng khoán và trái phiếu vận hành thông suốt, cung cầu cân bằng',
          economicImpact: 'Thanh khoản thị trường duy trì tích cực; tiến trình hoàn thiện hạ tầng công nghệ và đáp ứng tiêu chí nâng hạng thị trường diễn tiến theo lộ trình.',
          governanceAction: 'Giám sát chặt chẽ hoạt động phát hành trái phiếu riêng lẻ và hoạt động giao dịch ký quỹ, bảo vệ quyền lợi nhà đầu tư.',
          leadAgency: 'UBCKNN, Vụ TCNH',
        },
        {
          id: 'b3-empty',
          pillar: 'market_feedback',
          badgeTitle: 'Dư luận Doanh nghiệp & Kiến nghị',
          badgeColor: 'amber',
          icon: AlertTriangle,
          headline: 'Dư luận xã hội đánh giá cao nỗ lực cắt giảm thủ tục hành chính, cải thiện môi trường đầu tư',
          economicImpact: 'Các chính sách gia hạn, giảm thuế phí hỗ trợ người nộp thuế phát huy hiệu quả thực chất, giảm chi phí tuân thủ cho doanh nghiệp.',
          governanceAction: 'Tăng cường truyền thông chính sách chủ động; tiếp tục tháo gỡ ngay các vướng mắc hải quan và hóa đơn điện tử.',
          leadAgency: 'Tổng cục Thuế, Tổng cục Hải quan, Văn phòng Bộ',
        },
      ];
    }

    // 1. Phân loại tin theo các trụ cột tác động chính trị / tài chính vĩ mô
    const fiscalNews = news.filter(
      (n) => n.sector === 'tax' || n.sector === 'treasury_budget' || n.sector === 'public_investment' || n.sector === 'public_debt'
    );
    const capitalMarketNews = news.filter(
      (n) => n.sector === 'stocks' || n.sector === 'bonds' || n.sector === 'price_management' || n.sector === 'insurance'
    );
    const feedbackNews = news.filter(
      (n) => isRiskArticle(n) || n.sector === 'customs' || (n.sentimentScore < 0) || n.isEmergency
    );

    // Tìm bài có tác động lớn nhất trong từng cụm (ưu tiên impactScore, priorityScore, isEmergency)
    const getTopArticle = (items: ScrapedNewsItem[], fallbackPool: ScrapedNewsItem[]) => {
      const pool = items.length > 0 ? items : fallbackPool;
      if (pool.length === 0) return null;
      return [...pool].sort((a, b) => {
        const scoreA = (a.isEmergency ? 100 : 0) + (a.priorityScore || 0) + (a.impactScore || 0);
        const scoreB = (b.isEmergency ? 100 : 0) + (b.priorityScore || 0) + (b.impactScore || 0);
        return scoreB - scoreA;
      })[0];
    };

    const topFiscal = getTopArticle(fiscalNews, news);
    const topCapital = getTopArticle(capitalMarketNews, news);
    const topFeedback = getTopArticle(feedbackNews, news);

    // Bullet 1: Thể chế & Điều hành Ngân sách - Tài khóa
    const b1: SummaryBullet = {
      id: 'bullet-1-fiscal',
      pillar: 'fiscal_policy',
      badgeTitle: 'Tài khóa & Ngân sách Vĩ mô',
      badgeColor: 'indigo',
      icon: Landmark,
      headline: topFiscal
        ? `Tập trung điều hành: ${topFiscal.title}`
        : 'Điều hành thu - chi ngân sách và kỷ cương tài khóa giữ nhịp tăng trưởng',
      economicImpact: topFiscal?.tldrKeyImpact || topFiscal?.marketImplication ||
        'Tiến độ thu ngân sách nhà nước đạt kế hoạch đề ra, nguồn lực tài khóa được bảo đảm vững chắc cho các chương trình mục tiêu quốc gia và an sinh xã hội.',
      governanceAction: topFiscal?.executiveDirective?.rootCause
        ? `Yêu cầu rà soát nguyên nhân gốc rễ: ${topFiscal.executiveDirective.rootCause.slice(0, 140)}...`
        : 'Chỉ đạo các cơ quan thu phối hợp chặt chẽ với địa phương, đôn đốc giải ngân vốn đầu tư công và chống thất thu ngân sách.',
      leadAgency: topFiscal?.executiveDirective?.whereEntity || 'Vụ NSNN, Cục QLN, KBNN',
      sourceArticle: topFiscal || undefined,
    };

    // Bullet 2: Thị trường Vốn, Chứng khoán & Trái phiếu
    const b2: SummaryBullet = {
      id: 'bullet-2-capital',
      pillar: 'capital_market',
      badgeTitle: 'Thị trường Vốn & Thanh khoản',
      badgeColor: 'emerald',
      icon: TrendingUp,
      headline: topCapital
        ? `Biến động thị trường: ${topCapital.title}`
        : 'Thị trường vốn duy trì thanh khoản ổn định, cấu trúc dòng tiền có xu hướng tích cực',
      economicImpact: topCapital?.tldrKeyImpact || topCapital?.marketImplication ||
        'Thanh khoản toàn thị trường vận hành ổn định; tâm lý nhà đầu tư phản ứng thận trọng nhưng hấp thụ tốt các thông tin vĩ mô trong và ngoài nước.',
      governanceAction: topCapital?.executiveDirective?.mediaStrategy?.keyMessage
        ? `Thông điệp điều hành: ${topCapital.executiveDirective.mediaStrategy.keyMessage}`
        : 'Tăng cường giám sát thị trường chứng khoán và trái phiếu doanh nghiệp, đảm bảo tính công khai, minh bạch và an toàn hệ thống.',
      leadAgency: topCapital?.executiveDirective?.whereEntity || 'UBCKNN, Vụ TCNH',
      sourceArticle: topCapital || undefined,
    };

    // Bullet 3: Phản ánh Dư luận Doanh nghiệp & Kiến nghị Thực thi
    const b3: SummaryBullet = {
      id: 'bullet-3-feedback',
      pillar: 'market_feedback',
      badgeTitle: 'Dư luận & Điểm nghẽn Thực thi',
      badgeColor: topFeedback && isRiskArticle(topFeedback) ? 'rose' : 'amber',
      icon: topFeedback && isRiskArticle(topFeedback) ? AlertTriangle : Building2,
      headline: topFeedback
        ? `Phản ánh dư luận: ${topFeedback.title}`
        : 'Dư luận phản ánh kiến nghị tháo gỡ thủ tục hành chính và vướng mắc thực tiễn',
      economicImpact: topFeedback?.tldrKeyImpact || topFeedback?.marketImplication ||
        'Cộng đồng doanh nghiệp tiếp tục kiến nghị đẩy nhanh cải cách thủ tục thuế, hải quan và đơn giản hóa điều kiện kinh doanh để khơi thông dòng vốn lưu động.',
      governanceAction: topFeedback?.policyResponseAdvisor ||
        'Chủ động ban hành thông cáo hoặc văn bản hướng dẫn nghiệp vụ giải tỏa băn khoăn của thị trường, tránh hình thành khoảng trống thông tin.',
      leadAgency: topFeedback?.executiveDirective?.whereEntity || 'Tổng cục Thuế, Tổng cục Hải quan, Văn phòng Bộ',
      sourceArticle: topFeedback || undefined,
    };

    return [b1, b2, b3];
  }, [data?.news]);

  // Hành động sao chép toàn văn 3 gạch đầu dòng để Lãnh đạo gửi nhanh
  const handleCopySummary = () => {
    const textToCopy = [
      '🏛️ BÁO CÁO TÓM TẮT THAM MƯU ĐIỀU HÀNH - BỘ TÀI CHÍNH',
      `Thời điểm: ${new Date().toLocaleDateString('vi-VN')} | Nguồn tổng hợp: Trung tâm Thông tin & Phân tích Dư luận BTC`,
      '',
      ...summaryBullets.map((b, i) => {
        return `${i + 1}. [${b.badgeTitle.toUpperCase()}] ${b.headline}\n- Tác động kinh tế: ${b.economicImpact}\n- Tham mưu chỉ đạo: ${b.governanceAction}\n- Đơn vị phối hợp: ${b.leadAgency}\n`;
      }),
    ].join('\n');

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div
      id="executive-summary-brief-widget"
      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isDark
          ? 'bg-slate-900 border-slate-800 shadow-sm'
          : 'bg-white border-slate-200/90 shadow-2xs'
      }`}
    >
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Tóm Tắt Tham Mưu Điều Hành
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isDark ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60' : 'bg-indigo-50 text-indigo-800 border-indigo-200'
              }`}>
                Executive Summary Brief
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                Báo cáo 3 Trụ Cột Tác Động
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Tổng hợp súc tích các tin bài có tác động chính trị - tài chính vĩ mô cao nhất trong phiên bằng ngôn ngữ kinh tế, phục vụ Lãnh đạo chỉ đạo tức thì.
            </p>
          </div>
        </div>

        {/* Nút hành động nhanh trên header */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={handleCopySummary}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-500'
                : isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Sao chép toàn văn 3 gạch đầu dòng tham mưu"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép tóm tắt'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('briefing')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shadow-xs ${
              isDark
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600'
            }`}
            title="Chuyển sang phân hệ Soạn Văn Bản Chỉ Đạo"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Phát Lệnh Chỉ Đạo</span>
          </button>
        </div>
      </div>

      {/* 3 Gạch Đầu Dòng Tham Mưu Điều Hành */}
      <div className="mt-4 space-y-3">
        {summaryBullets.map((bullet, idx) => {
          const Icon = bullet.icon;
          const isRose = bullet.badgeColor === 'rose';
          const isAmber = bullet.badgeColor === 'amber';
          const isEmerald = bullet.badgeColor === 'emerald';
          const isIndigo = bullet.badgeColor === 'indigo';

          const badgeClass = isRose
            ? isDark ? 'bg-rose-950/60 text-rose-300 border-rose-800/60' : 'bg-rose-50 text-rose-800 border-rose-200'
            : isAmber
            ? isDark ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-800 border-amber-200'
            : isEmerald
            ? isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : isDark ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60' : 'bg-indigo-50 text-indigo-800 border-indigo-200';

          const iconContainer = isRose
            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            : isAmber
            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            : isEmerald
            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';

          return (
            <div
              key={bullet.id}
              className={`rounded-xl border p-3.5 sm:p-4 transition-all hover:shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-3 ${
                isDark
                  ? 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700'
                  : 'bg-slate-50/50 border-slate-200/90 hover:border-slate-300 hover:bg-white'
              }`}
            >
              {/* Nội dung tham mưu */}
              <div className="flex-1 min-w-0">
                {/* Dòng định danh gạch đầu dòng */}
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 text-xs font-black ${iconContainer}`}>
                    {idx + 1}
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                    {bullet.badgeTitle}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                    <span>Đơn vị phối hợp:</span>
                    <span className="font-bold text-slate-600 dark:text-slate-300">{bullet.leadAgency}</span>
                  </div>
                </div>

                {/* Tiêu đề diễn biến cốt lõi */}
                <h4 className={`text-xs sm:text-sm font-bold leading-snug mb-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {bullet.headline}
                </h4>

                {/* Khối tác động kinh tế & chỉ đạo ngắn gọn */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 pt-1">
                  <div className={`p-2.5 rounded-lg border text-xs leading-relaxed ${
                    isDark ? 'bg-slate-900/80 border-slate-800/80 text-slate-300' : 'bg-white border-slate-200/80 text-slate-700'
                  }`}>
                    <span className="font-bold text-indigo-500 dark:text-indigo-400 block mb-0.5">
                      📊 Tác động kinh tế - chính sách:
                    </span>
                    {bullet.economicImpact}
                  </div>

                  <div className={`p-2.5 rounded-lg border text-xs leading-relaxed ${
                    isDark ? 'bg-slate-900/80 border-slate-800/80 text-slate-300' : 'bg-white border-slate-200/80 text-slate-700'
                  }`}>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                      ⚡ Tham mưu hành động điều hành:
                    </span>
                    {bullet.governanceAction}
                  </div>
                </div>
              </div>

              {/* Cột thao tác tức thời gắn với bài viết nguồn */}
              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/50 dark:border-slate-800/50 shrink-0 md:min-w-[140px]">
                {bullet.sourceArticle ? (
                  <button
                    type="button"
                    onClick={() => onSelectArticle(bullet.sourceArticle!)}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer truncate max-w-[150px] text-left"
                    title={`Xem bài viết nguồn: ${bullet.sourceArticle.title}`}
                  >
                    <span>Xem tin nguồn</span>
                    <ArrowRight className="w-3 h-3 shrink-0" />
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400">Tham mưu tổng hợp</span>
                )}

                {bullet.sourceArticle && (
                  <button
                    type="button"
                    onClick={() => onDraftStatement(bullet.sourceArticle!)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                    }`}
                  >
                    <span>Soạn chỉ đạo</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
