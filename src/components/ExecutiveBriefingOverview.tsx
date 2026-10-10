import React, { useMemo } from 'react';
import {
  Compass,
  Flame,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Building2,
  FileText,
  Clock,
  Send,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';
import { ScrapeResponse, ScrapedNewsItem, TimeRange } from '../types';
import { useTheme } from '../lib/theme';
import { isRiskArticle } from '../lib/newsClassification';

interface ExecutiveBriefingOverviewProps {
  data: ScrapeResponse | null;
  timeRange: TimeRange;
  onSelectArticle: (article: ScrapedNewsItem) => void;
  onDraftStatement: (article: ScrapedNewsItem) => void;
  onNavigateTab: (tab: any) => void;
  handleSearch: (kw: string) => void;
}

export const ExecutiveBriefingOverview: React.FC<ExecutiveBriefingOverviewProps> = ({
  data,
  timeRange,
  onSelectArticle,
  onDraftStatement,
  onNavigateTab,
  handleSearch,
}) => {
  const { isDark } = useTheme();

  // 1. TÍNH TOÁN DỮ LIỆU 'TỔNG QUAN TÌNH HÌNH'
  const totalArticles = data?.news?.length || 0;
  const sentiment = data?.sentimentOverview;
  const bullishPct = sentiment?.bullishPercentage || 0;
  const neutralPct = sentiment?.neutralPercentage || 0;
  const bearishPct = sentiment?.bearishPercentage || 0;
  const positiveAndNeutralPct = Math.min(100, Math.round(bullishPct + neutralPct));
  const overallMood = sentiment?.overallMood || 'Ổn định & Lạc quan';

  const overviewSummary = useMemo(() => {
    if (data?.executiveSummaryReport?.generalSummary) {
      return data.executiveSummaryReport.generalSummary;
    }
    if (data?.executiveSummaryReport?.overallStrategicAdvice) {
      return data.executiveSummaryReport.overallStrategicAdvice;
    }
    if (sentiment?.keyDriver) {
      return `Dư luận kinh tế trong phiên tập trung vào: ${sentiment.keyDriver}. Nhìn chung dòng chảy thông tin tài chính - ngân sách giữ nhịp ổn định, cộng đồng doanh nghiệp và thị trường đồng thuận với các chỉ đạo của Chính phủ và Bộ Tài chính.`;
    }
    return 'Dư luận và dòng thông tin báo chí tài chính trong phiên duy trì ổn định. Các giải pháp điều hành vĩ mô, cân đối ngân sách nhà nước và hoàn thiện thể chế tiếp tục củng cố niềm tin của doanh nghiệp và nhà đầu tư.';
  }, [data?.executiveSummaryReport, sentiment]);

  // 2. TÍNH TOÁN DỮ LIỆU 'SỰ KIỆN NÓNG' (Ưu tiên các bài viết rủi ro / bức xúc / cần lưu ý)
  const hotEvents = useMemo(() => {
    const list: ScrapedNewsItem[] = [];

    // Ưu tiên 1: topCrisisDirectives trong báo cáo điều hành
    if (data?.executiveSummaryReport?.topCrisisDirectives && data.executiveSummaryReport.topCrisisDirectives.length > 0) {
      data.executiveSummaryReport.topCrisisDirectives.forEach((item) => {
        if (!list.some((x) => x.id === item.id || x.title === item.title)) {
          list.push(item);
        }
      });
    }

    // Ưu tiên 2: bài viết rủi ro cao từ news
    if (list.length < 3 && data?.news) {
      const riskItems = data.news.filter((n) => isRiskArticle(n));
      riskItems.sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0));
      for (const item of riskItems) {
        if (list.length >= 3) break;
        if (!list.some((x) => x.id === item.id || x.title === item.title)) {
          list.push(item);
        }
      }
    }

    // Ưu tiên 3: bài viết có impactScore cao nhất trong phiên nếu chưa đủ
    if (list.length === 0 && data?.news && data.news.length > 0) {
      const sorted = [...data.news].sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0));
      list.push(...sorted.slice(0, 3));
    }

    return list.slice(0, 3);
  }, [data?.executiveSummaryReport, data?.news]);

  // 3. TÍNH TOÁN DỮ LIỆU 'KHUYẾN NGHỊ HÀNH ĐỘNG'
  const mediaDirective = data?.executiveSummaryReport?.mediaDirective ||
    'Chủ động phối hợp các cơ quan báo chí chính thống và Cổng thông tin điện tử của Bộ cung cấp thông tin kịp thời, minh bạch, làm rõ chính sách để định hướng thị trường.';

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 shadow-xs transition-colors ${
        isDark
          ? 'bg-slate-900/90 border-slate-800'
          : 'bg-gradient-to-b from-white to-slate-50/70 border-slate-200/90'
      }`}
    >
      {/* Header Khối Tóm Tắt Điều Hành */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`text-base sm:text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Tóm Tắt Tình Hình & Tham Mưu Điều Hành
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isDark ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                Dành cho Lãnh đạo Bộ
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Bản tin phân tích nhanh bằng ngôn ngữ kinh tế: Tổng quan bối cảnh, sự kiện nóng cần chú ý và giải pháp tham mưu.
            </p>
          </div>
        </div>

        {/* Nút hành động nhanh của Lãnh đạo */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('briefing')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shadow-xs ${
              isDark
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600'
            }`}
            title="Mở phân hệ Soạn Văn Bản Chỉ Đạo / Báo Cáo Nhanh"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Soạn Văn Bản Chỉ Đạo</span>
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* 3 KHỐI TÓM TẮT TRỰC QUAN: TỔNG QUAN - SỰ KIỆN NÓNG - KHUYẾN NGHỊ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        
        {/* KHỐI 1: TỔNG QUAN TÌNH HÌNH */}
        <div
          className={`rounded-xl border p-4 flex flex-col justify-between transition-shadow hover:shadow-xs ${
            isDark
              ? 'bg-slate-950/60 border-slate-800'
              : 'bg-white border-slate-200/90 shadow-2xs'
          }`}
        >
          <div>
            {/* Header Thẻ */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <Compass className="w-4 h-4" />
                </span>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-blue-300' : 'text-blue-950'}`}>
                  1. Tổng Quan Tình Hình
                </h3>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800/60' : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}>
                {overallMood}
              </span>
            </div>

            {/* Chỉ số kinh tế cô đọng */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className={`p-2.5 rounded-lg border ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200/70'
              }`}>
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">Ổn định &amp; Tích cực</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {positiveAndNeutralPct}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">tỷ trọng dòng tin</span>
              </div>
              <div className={`p-2.5 rounded-lg border ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200/70'
              }`}>
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">Tin bài điểm tin</span>
                <span className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {totalArticles}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">nguồn chính thống</span>
              </div>
            </div>

            {/* Nhận định kinh tế vĩ mô dễ hiểu */}
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {overviewSummary}
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Phiên giám sát: {data?.scannedWindow || timeRange}</span>
            <button
              type="button"
              onClick={() => onNavigateTab('table')}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>Xem chi tiết</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KHỐI 2: SỰ KIỆN NÓNG */}
        <div
          id="widget-hot-events"
          className={`rounded-xl border p-4 flex flex-col justify-between transition-shadow hover:shadow-xs ${
            isDark
              ? 'bg-slate-950/60 border-slate-800'
              : 'bg-white border-slate-200/90 shadow-2xs'
          }`}
        >
          <div>
            {/* Header Thẻ */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Flame className="w-4 h-4" />
                </span>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-950'}`}>
                  2. Sự Kiện Nóng
                </h3>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                hotEvents.length > 0
                  ? isDark ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-800 border-amber-200'
                  : isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {hotEvents.length > 0 ? `${hotEvents.length} vấn đề nổi cộm` : 'Tình hình ổn định'}
              </span>
            </div>

            {/* Danh sách các sự kiện nóng: Tối giản - Emoji sắc thái + Tiêu đề + Nút Đọc báo cáo chi tiết */}
            {hotEvents.length > 0 ? (
              <div className="space-y-2.5">
                {hotEvents.map((item, idx) => {
                  // Biểu tượng cảm xúc (emoji) đại diện cho sắc thái
                  const isBearish = item.isEmergency || (item.sentimentScore !== undefined && item.sentimentScore < -20) || item.sentiment === 'bearish';
                  const isBullish = (item.sentimentScore !== undefined && item.sentimentScore > 20) || item.sentiment === 'bullish';
                  const emoji = isBearish ? '🔴' : isBullish ? '🟢' : '🟡';
                  const sentimentLabel = isBearish ? 'Tiêu cực / Cần lưu ý' : isBullish ? 'Tích cực' : 'Trung tính';

                  return (
                    <div
                      key={item.id || idx}
                      className={`p-3 rounded-xl border transition-colors flex flex-col justify-between gap-2.5 ${
                        isDark
                          ? 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                          : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100/90 hover:border-slate-300'
                      }`}
                    >
                      {/* Tiêu đề & Biểu tượng cảm xúc (Emoji) */}
                      <div className="flex items-start gap-2.5">
                        <span
                          className="text-base shrink-0 select-none mt-0.5"
                          title={`Sắc thái: ${sentimentLabel}`}
                          aria-label={sentimentLabel}
                        >
                          {emoji}
                        </span>
                        <h4
                          onClick={() => onSelectArticle(item)}
                          className={`text-xs font-semibold leading-relaxed line-clamp-2 cursor-pointer transition-colors ${
                            isDark ? 'text-slate-100 hover:text-amber-300' : 'text-slate-900 hover:text-amber-700'
                          }`}
                          title="Bấm để đọc báo cáo chi tiết"
                        >
                          {item.title}
                        </h4>
                      </div>

                      {/* Nút Đọc báo cáo chi tiết */}
                      <div className="flex items-center justify-end pt-1 border-t border-slate-200/50 dark:border-slate-800/60">
                        <button
                          type="button"
                          onClick={() => onSelectArticle(item)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border shadow-2xs hover:scale-[1.02] active:scale-[0.98] ${
                            isDark
                              ? 'bg-amber-950/70 hover:bg-amber-900/90 border-amber-700/80 text-amber-200'
                              : 'bg-white hover:bg-amber-50 border-amber-300 text-amber-900'
                          }`}
                          title="Đọc báo cáo chi tiết và bóc tách chuyên sâu"
                        >
                          <span>Đọc báo cáo chi tiết</span>
                          <ArrowRight className="w-3 h-3 text-amber-500 shrink-0" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`p-4 rounded-xl border text-center ${
                isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                <p className="text-xs font-medium">
                  Không ghi nhận phản ánh tiêu cực hay tranh cãi lớn trong phiên quét hiện tại.
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Trạng thái: Đã sàng lọc</span>
            {hotEvents[0] && (
              <button
                type="button"
                onClick={() => onDraftStatement(hotEvents[0])}
                className="font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              >
                <span>Soạn phản hồi nhanh</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* KHỐI 3: KHUYẾN NGHỊ HÀNH ĐỘNG */}
        <div
          className={`rounded-xl border p-4 flex flex-col justify-between transition-shadow hover:shadow-xs ${
            isDark
              ? 'bg-slate-950/60 border-slate-800'
              : 'bg-white border-slate-200/90 shadow-2xs'
          }`}
        >
          <div>
            {/* Header Thẻ */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-emerald-300' : 'text-emerald-950'}`}>
                  3. Khuyến Nghị Hành Động
                </h3>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                Tham Mưu Tác Chiến
              </span>
            </div>

            {/* 3 việc cần chỉ đạo cụ thể bằng ngôn ngữ kinh tế */}
            <div className="space-y-2.5 text-xs">
              <div className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <div className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    Chỉ đạo đơn vị chuyên môn xử lý phản ánh
                  </h4>
                  <p className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Giao các Cục, Tổng cục liên quan kịp thời rà soát ý kiến doanh nghiệp, ban hành văn bản hướng dẫn nghiệp vụ rõ ràng, tháo gỡ điểm nghẽn.
                  </p>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    Định hướng truyền thông chính thống
                  </h4>
                  <p className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {mediaDirective}
                  </p>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <div className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    Tăng cường lan tỏa điểm sáng kinh tế
                  </h4>
                  <p className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Đẩy mạnh thông tin về tiến độ giải ngân vốn đầu tư công, chính sách hỗ trợ phục hồi và kỷ luật tài chính - ngân sách.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Trạng thái: Sẵn sàng thực thi</span>
            <button
              type="button"
              onClick={() => onNavigateTab('briefing')}
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>Vào phòng Soạn thảo</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
