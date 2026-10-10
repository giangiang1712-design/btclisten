import React from 'react';
import {
  Building2,
  TrendingUp,
  Coins,
  Scale,
  Cpu,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ScrapedNewsItem, SectorStat } from '../types';
import { useTheme } from '../lib/theme';

export interface FiscalPillarConfig {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  sectors: string[];
  keyMissions: string[];
}

export const FISCAL_PILLARS_2026: FiscalPillarConfig[] = [
  {
    id: 'budget_tax_customs',
    code: 'TRỤ CỘT I',
    title: 'Thuế, Hải Quan & Kho Bạc',
    subtitle: 'Quản lý thu NSNN, Luồng xanh Hải quan số & Kho bạc',
    icon: Building2,
    gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent',
    badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    badgeText: 'Thuế • Hải Quan • Kho Bạc',
    borderColor: 'hover:border-blue-500/40',
    sectors: ['tax', 'customs', 'treasury_budget', 'national_reserve'],
    keyMissions: ['Hóa đơn điện tử máy tính tiền', 'Luồng xanh Hải quan thông minh', 'Cân đối thu NSNN'],
  },
  {
    id: 'financial_markets',
    code: 'TRỤ CỘT II',
    title: 'Thị Trường Tài Chính & TTCK',
    subtitle: 'Chứng khoán (UBCK), Trái phiếu TPDN & Nâng hạng FTSE',
    icon: TrendingUp,
    gradient: 'from-amber-500/10 via-emerald-500/5 to-transparent',
    badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    badgeText: 'TTCK • Trái Phiếu • Tín Dụng',
    borderColor: 'hover:border-amber-500/40',
    sectors: ['stocks', 'bonds', 'banking_credit', 'forex', 'crypto', 'gold'],
    keyMissions: ['Hệ thống KRX & Giao dịch tập trung', 'Nâng hạng FTSE Emerging', 'An toàn thanh khoản Trái phiếu'],
  },
  {
    id: 'public_invest_debt',
    code: 'TRỤ CỘT III',
    title: 'Đầu Tư Công & Nợ Công',
    subtitle: 'Giải ngân vốn đầu tư công, An toàn nợ công & Tái cơ cấu DNNN',
    icon: Coins,
    gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    badgeText: 'Đầu Tư Công • Nợ Công • SCIC',
    borderColor: 'hover:border-emerald-500/40',
    sectors: ['public_investment', 'public_debt', 'public_assets', 'state_economy', 'fdi'],
    keyMissions: ['Tăng tốc giải ngân 100% kế hoạch', 'Chỉ tiêu nợ công an toàn', 'Quản lý tài sản công'],
  },
  {
    id: 'price_insurance_audit',
    code: 'TRỤ CỘT IV',
    title: 'Quản Lý Giá & Bảo Hiểm',
    subtitle: 'Bình ổn CPI, Giám sát Bảo hiểm nhân thọ & Thanh tra tài chính',
    icon: Scale,
    gradient: 'from-purple-500/10 via-indigo-500/5 to-transparent',
    badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    badgeText: 'Điều Hành Giá • Bảo Hiểm • Thanh Tra',
    borderColor: 'hover:border-purple-500/40',
    sectors: ['price_management', 'insurance', 'inspection_audit', 'realestate'],
    keyMissions: ['Kiểm soát CPI dưới 4.5%', 'Chấn chỉnh đại lý bảo hiểm', 'Thanh tra giao dịch đột biến'],
  },
  {
    id: 'digital_policy_comm',
    code: 'TRỤ CỘT V',
    title: 'Chuyển Đổi Số & Thể Chế',
    subtitle: 'Sửa đổi Luật Quản lý Thuế, Dữ liệu lớn BTC & Social Listening',
    icon: Cpu,
    gradient: 'from-cyan-500/10 via-blue-500/5 to-transparent',
    badgeBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    badgeText: 'Tài Chính Số • Thể Chế • Truyền Thông',
    borderColor: 'hover:border-cyan-500/40',
    sectors: ['policy', 'fintech_digital', 'macro', 'people'],
    keyMissions: ['Kho dữ liệu lớn ngành Tài chính', 'Sửa đổi Luật Quản lý Thuế', 'Định hướng dư luận 24/7'],
  },
];

interface FiscalPillarsCardGridProps {
  newsItems: ScrapedNewsItem[];
  sectorStats?: SectorStat[];
  onSelectPillarSectors?: (sectors: string[]) => void;
  onNavigateTab?: (tab: string) => void;
}

export const FiscalPillarsCardGrid: React.FC<FiscalPillarsCardGridProps> = ({
  newsItems,
  sectorStats = [],
  onSelectPillarSectors,
  onNavigateTab,
}) => {
  const { isDark } = useTheme();

  // Compute pillar statistics
  const pillarMetrics = React.useMemo(() => {
    return FISCAL_PILLARS_2026.map((pillar) => {
      const sectorSet = new Set(pillar.sectors);
      const matchedArticles = newsItems.filter((item) => sectorSet.has(item.sector));
      
      const totalCount = matchedArticles.length;
      const bullishCount = matchedArticles.filter((a) => a.sentiment === 'bullish').length;
      const bearishCount = matchedArticles.filter((a) => a.sentiment === 'bearish').length;
      const neutralCount = totalCount - bullishCount - bearishCount;

      const riskArticles = matchedArticles.filter((a) => (a as any).isEmergency || a.sentiment === 'bearish');

      // Calculate average sentiment score
      const avgScore = totalCount > 0
        ? Math.round(matchedArticles.reduce((acc, a) => acc + (a.sentimentScore || 0), 0) / totalCount)
        : 0;

      let statusBadge = { label: 'Ổn định', color: isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      if (bearishCount > 3 || riskArticles.length > 2) {
        statusBadge = { label: 'Cần chú ý', color: isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-rose-100 text-rose-800 border-rose-300' };
      } else if (bearishCount > 0) {
        statusBadge = { label: 'Theo dõi', color: isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300' };
      }

      return {
        ...pillar,
        totalCount,
        bullishCount,
        bearishCount,
        neutralCount,
        riskCount: riskArticles.length,
        avgScore,
        statusBadge,
        latestArticle: matchedArticles[0] || null,
      };
    });
  }, [newsItems, isDark]);

  return (
    <div className="space-y-2.5">
      {/* Sleek Compact Header Bar */}
      <div className={`px-4 py-2.5 rounded-2xl border flex items-center justify-between gap-3 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/90 shadow-2xs'
      }`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-xs sm:text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              5 Trụ Cột Tài Chính Chiến Lược BTC
            </h3>
            <p className="text-[10px] text-slate-400">
              Phân bổ dòng tin và sắc thái theo 5 cụm chỉ đạo trọng tâm của Bộ
            </p>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400 shrink-0">
          Tổng: <strong className="text-amber-500 font-bold">{newsItems.length}</strong> bài
        </div>
      </div>

      {/* 5 Pillars Compact Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {pillarMetrics.map((pm) => {
          const IconComp = pm.icon;
          return (
            <div
              key={pm.id}
              onClick={() => {
                if (onSelectPillarSectors) {
                  onSelectPillarSectors(pm.sectors);
                }
                if (onNavigateTab) {
                  onNavigateTab('table');
                }
              }}
              className={`p-3.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 shadow-2xs ${
                pm.borderColor
              } ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                  : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 rounded-xl shrink-0 ${isDark ? 'bg-slate-800 text-amber-400 border border-slate-700' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                      {pm.code}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border shrink-0 ${pm.statusBadge.color}`}>
                    {pm.statusBadge.label}
                  </span>
                </div>

                <div>
                  <h4 className={`text-xs font-black leading-snug line-clamp-2 min-h-[32px] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {pm.title}
                  </h4>
                  <p className={`text-[11px] leading-relaxed line-clamp-2 mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {pm.subtitle}
                  </p>
                </div>
              </div>

              {/* Metrics Row */}
              <div className={`my-2.5 p-2 rounded-xl border flex items-center justify-between text-xs ${
                isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tin bài:</span>
                <div className="flex items-center gap-1.5 font-mono text-xs font-black">
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>{pm.totalCount}</span>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span className="text-emerald-600 dark:text-emerald-400">+{pm.bullishCount}</span>
                  <span className="text-rose-600 dark:text-rose-400">-{pm.bearishCount}</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1 text-[11px]">
                <span className="text-slate-400 dark:text-slate-500 font-medium truncate text-[10px]">{pm.badgeText}</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5 shrink-0 text-xs">
                  <span>Xem</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
