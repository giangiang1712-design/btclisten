import React, { useState } from 'react';
import { SectorType, SectorStat } from '../types';
import {
  Layers,
  TrendingUp,
  FileSpreadsheet,
  Receipt,
  Ship,
  Globe,
  Globe2,
  Landmark,
  Building2,
  Handshake,
  Scale,
  Users,
  Briefcase,
  Building,
  Coins,
  DollarSign,
  Bitcoin,
  ShieldCheck,
  Vault,
  HardHat,
  Tag,
  ShieldAlert,
  Percent,
  Cpu,
  BadgeAlert,
  Archive,
  ChevronDown,
  ChevronUp,
  Gavel,
  BarChart3,
  HeartHandshake,
  Map,
} from 'lucide-react';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';

interface SectorFilterProps {
  activeSector: SectorType;
  onSelectSector: (sector: SectorType) => void;
  sectorStats: SectorStat[];
  totalCount: number;
}

const SECTOR_ICONS: Record<SectorType, React.ReactNode> = {
  all: <Layers className="w-3.5 h-3.5" />,
  tax: <Receipt className="w-3.5 h-3.5" />,
  customs: <Ship className="w-3.5 h-3.5" />,
  bonds: <FileSpreadsheet className="w-3.5 h-3.5" />,
  stocks: <TrendingUp className="w-3.5 h-3.5" />,
  treasury_budget: <Vault className="w-3.5 h-3.5" />,
  public_investment: <HardHat className="w-3.5 h-3.5" />,
  price_management: <Tag className="w-3.5 h-3.5" />,
  insurance: <ShieldCheck className="w-3.5 h-3.5" />,
  state_economy: <Building2 className="w-3.5 h-3.5" />,
  public_debt: <Percent className="w-3.5 h-3.5" />,
  public_assets: <Building className="w-3.5 h-3.5" />,
  inspection_audit: <ShieldAlert className="w-3.5 h-3.5" />,
  national_reserve: <Archive className="w-3.5 h-3.5" />,
  // Thẩm quyền mới theo Nghị định 376/2026/NĐ-CP:
  bidding_procurement: <Gavel className="w-3.5 h-3.5" />,
  foreign_investment_fdi: <Globe2 className="w-3.5 h-3.5" />,
  statistics_macro: <BarChart3 className="w-3.5 h-3.5" />,
  social_security: <HeartHandshake className="w-3.5 h-3.5" />,
  socioeconomic_planning: <Map className="w-3.5 h-3.5" />,
  banking_credit: <Landmark className="w-3.5 h-3.5" />,
  realestate: <Building className="w-3.5 h-3.5" />,
  gold: <Coins className="w-3.5 h-3.5" />,
  forex: <DollarSign className="w-3.5 h-3.5" />,
  fdi: <Globe className="w-3.5 h-3.5" />,
  crypto: <Bitcoin className="w-3.5 h-3.5" />,
  macro: <TrendingUp className="w-3.5 h-3.5" />,
  enterprise: <Briefcase className="w-3.5 h-3.5" />,
  collective_economy: <Handshake className="w-3.5 h-3.5" />,
  fintech_digital: <Cpu className="w-3.5 h-3.5" />,
  policy: <Scale className="w-3.5 h-3.5" />,
  people: <Users className="w-3.5 h-3.5" />,
};

const SECTOR_LABELS_VI: Record<SectorType, string> = {
  all: 'Toàn cảnh',
  tax: 'Thuế & NSNN',
  customs: 'Hải quan & XNK',
  bonds: 'Trái phiếu (TPDN & TPCP)',
  stocks: 'Chứng khoán (UBCK)',
  treasury_budget: 'Kho bạc & Ngân sách',
  public_investment: 'Đầu tư công & Giải ngân',
  price_management: 'Quản lý Giá & Bình ổn',
  insurance: 'Bảo hiểm & QLBH',
  state_economy: 'Kinh tế Nhà nước (SCIC)',
  public_debt: 'Nợ công & TC Đối ngoại',
  public_assets: 'Tài sản công',
  inspection_audit: 'Thanh tra & Giám sát',
  national_reserve: 'Dự trữ Quốc gia',
  // Thẩm quyền mới theo Nghị định 376/2026/NĐ-CP:
  bidding_procurement: 'Đấu thầu & PPP (Cục QL Đấu thầu)',
  foreign_investment_fdi: 'Đầu tư FDI (Cục ĐT Nước ngoài)',
  statistics_macro: 'Thống kê quốc gia & CPI (Cục Thống kê)',
  social_security: 'BHXH, BHYT & BHTN (BHXH Việt Nam)',
  socioeconomic_planning: 'Quy hoạch & Kế hoạch KT-XH',
  banking_credit: 'Ngân hàng & Tín dụng',
  realestate: 'Bất động sản (Tài chính)',
  gold: 'Vàng & Kim loại quý',
  forex: 'Tỷ giá & Ngoại tệ',
  fdi: 'Đầu tư Nước ngoài (FDI)',
  crypto: 'Crypto & Tài sản số',
  macro: 'Tăng trưởng GDP & Vĩ mô',
  enterprise: 'Doanh nghiệp & BCTC',
  collective_economy: 'Kinh tế Tập thể & HTX',
  fintech_digital: 'Tài chính số & Thuế TMĐT',
  policy: 'Chính sách & Pháp lý BTC',
  people: 'Lãnh đạo & Nhân vật',
};

const SECTOR_LABELS_EN: Record<SectorType, string> = {
  all: 'All Sectors',
  tax: 'Tax & State Budget',
  customs: 'Customs & Trade',
  bonds: 'Bonds (Gov & Corp)',
  stocks: 'Stock Market (SSC)',
  treasury_budget: 'Treasury & Budget',
  public_investment: 'Public Investment',
  price_management: 'Price Management',
  insurance: 'Insurance Supervision',
  state_economy: 'State Capital & SOEs',
  public_debt: 'Public Debt & Foreign Fin',
  public_assets: 'Public Assets',
  inspection_audit: 'Inspection & Oversight',
  national_reserve: 'National Reserve',
  // New mandates:
  bidding_procurement: 'Procurement & PPP',
  foreign_investment_fdi: 'Foreign Investment (FDI)',
  statistics_macro: 'National Statistics & CPI',
  social_security: 'Social Security & Health Insurance',
  socioeconomic_planning: 'Socioeconomic Planning',
  banking_credit: 'Banking & Credit',
  realestate: 'Real Estate Finance',
  gold: 'Gold & Precious Metals',
  forex: 'FX & Exchange Rates',
  fdi: 'Foreign Direct Investment (FDI)',
  crypto: 'Crypto & Digital Assets',
  macro: 'Macroeconomy & GDP',
  enterprise: 'Corporate Finance',
  collective_economy: 'Collective Economy & Co-ops',
  fintech_digital: 'Fintech & E-commerce Tax',
  policy: 'Financial Regulations & Policy',
  people: 'Leadership & Key Figures',
};

export const SectorFilter: React.FC<SectorFilterProps> = ({
  activeSector,
  onSelectSector,
  sectorStats,
  totalCount,
}) => {
  const { isDark } = useTheme();
  const { t, isVietnamese } = useI18n();
  const [isExpanded, setIsExpanded] = useState(true);

  const sectorLabels = isVietnamese ? SECTOR_LABELS_VI : SECTOR_LABELS_EN;

  const sectorGroups = [
    {
      name: isVietnamese ? 'Trọng tâm BTC & Thu NSNN' : 'Core Ministry of Finance & State Budget',
      isPrimary: true,
      sectors: [
        'tax',
        'customs',
        'treasury_budget',
        'public_investment',
        'price_management',
        'insurance',
        'state_economy',
        'public_debt',
        'public_assets',
        'inspection_audit',
        'national_reserve',
      ] as SectorType[],
    },
    {
      name: isVietnamese ? 'Thẩm quyền Mới (Nghị định 376/2026/NĐ-CP)' : 'New Mandates (Decree 376/2026/ND-CP)',
      isPrimary: true,
      sectors: [
        'bidding_procurement',
        'foreign_investment_fdi',
        'statistics_macro',
        'social_security',
        'socioeconomic_planning',
      ] as SectorType[],
    },
    {
      name: isVietnamese ? 'Thị trường Vốn, Tiền tệ & Đầu tư' : 'Capital Markets, Money & Investment',
      isPrimary: false,
      sectors: [
        'stocks',
        'bonds',
        'banking_credit',
        'forex',
        'gold',
        'fdi',
        'realestate',
        'crypto',
      ] as SectorType[],
    },
    {
      name: isVietnamese ? 'Vĩ mô, Doanh nghiệp & Tham mưu Điều hành' : 'Macroeconomics, Corporate & Leadership Policy',
      isPrimary: false,
      sectors: [
        'macro',
        'enterprise',
        'collective_economy',
        'fintech_digital',
        'policy',
        'people',
      ] as SectorType[],
    },
  ];

  const DECREE_376_PRIMARY_SECTORS: { key: SectorType; labelVi: string; labelEn: string; shortBadgeVi: string }[] = [
    { key: 'foreign_investment_fdi', labelVi: 'Đầu tư FDI', labelEn: 'FDI Investment', shortBadgeVi: 'Cục ĐTNN' },
    { key: 'bidding_procurement', labelVi: 'Đấu thầu', labelEn: 'Procurement', shortBadgeVi: 'Cục QLĐT' },
    { key: 'statistics_macro', labelVi: 'Thống kê', labelEn: 'Statistics', shortBadgeVi: 'Cục TK' },
    { key: 'social_security', labelVi: 'Bảo hiểm xã hội', labelEn: 'Social Security', shortBadgeVi: 'BHXH VN' },
    { key: 'socioeconomic_planning', labelVi: 'Quy hoạch', labelEn: 'Planning', shortBadgeVi: 'Vụ QH' },
  ];

  return (
    <div className={`rounded-xl p-3 shadow-sm space-y-3 border ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* THANH LỌC CHÍNH (MAIN FILTER BAR) - TÍCH HỢP TRỰC TIẾP 5 LĨNH VỰC NGHỊ ĐỊNH 376 */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {/* Nút Toàn cảnh */}
          <button
            onClick={() => onSelectSector('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer shrink-0 ${
              activeSector === 'all'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('sector_all')}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeSector === 'all' ? 'bg-white/25 text-white' : isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-800'
            }`}>
              {totalCount}
            </span>
          </button>

          {/* Dải phân cách & Nhãn Thẩm quyền Mới NĐ 376 */}
          <div className="h-5 w-[1px] bg-slate-300 dark:bg-slate-700 mx-0.5 hidden sm:block" />
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border hidden md:inline-flex items-center gap-1 shrink-0 ${
            isDark ? 'bg-amber-950/40 text-amber-300 border-amber-600/40' : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}>
            <Gavel className="w-3 h-3 text-amber-500" />
            <span>Nghị định 376:</span>
          </span>

          {/* 5 LĨNH VỰC MỚI THEO NGHỊ ĐỊNH 376 TÍCH HỢP TRỰC TIẾP TRÊN THANH LỌC CHÍNH */}
          {DECREE_376_PRIMARY_SECTORS.map((item) => {
            const stat = sectorStats.find((s) => s.sector === item.key);
            const count = stat?.count || 0;
            const isTrending = stat?.isTrending;
            const isActive = activeSector === item.key;

            return (
              <button
                key={item.key}
                onClick={() => onSelectSector(item.key)}
                title={`${isVietnamese ? item.labelVi : item.labelEn} (${item.shortBadgeVi}) - Nghị định 376/2026/NĐ-CP`}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-1 ring-amber-400'
                    : isDark
                    ? 'bg-amber-950/20 text-amber-200 border-amber-700/40 hover:bg-amber-900/40 hover:border-amber-500'
                    : 'bg-amber-50/80 text-amber-900 border-amber-300 hover:bg-amber-100'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-amber-500 dark:text-amber-400'}>
                  {SECTOR_ICONS[item.key]}
                </span>
                <span>{isVietnamese ? item.labelVi : item.labelEn}</span>
                {isTrending && <span className="text-[10px] animate-pulse">🔥</span>}
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : isDark
                      ? 'bg-amber-900/60 text-amber-200'
                      : 'bg-amber-200/80 text-amber-950'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Nút thu gọn / mở rộng toàn bộ 31 phân hệ */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[11px] font-bold uppercase tracking-wider hidden xl:flex items-center gap-1.5 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            {isVietnamese ? 'Toàn bộ 31 Phân hệ' : 'All 31 Sectors'}
          </span>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg cursor-pointer transition-colors border ${
              isDark
                ? 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border-slate-700'
                : 'text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border-slate-300'
            }`}
          >
            <span>{isExpanded ? (isVietnamese ? 'Thu gọn' : 'Collapse') : (isVietnamese ? 'Mở rộng 31 phân hệ' : 'Expand all sectors')}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2.5 pt-1">
          {sectorGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold uppercase tracking-wide ${
                  group.isPrimary
                    ? isDark ? 'text-amber-300' : 'text-amber-800'
                    : isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {group.name}
                </span>
                <div className={`flex-1 h-[1px] ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {group.sectors.map((sec) => {
                  const stat = sectorStats.find((s) => s.sector === sec);
                  const count = stat?.count || 0;
                  const isTrending = stat?.isTrending;
                  const isActive = activeSector === sec;

                  return (
                    <button
                      key={sec}
                      onClick={() => onSelectSector(sec)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : isDark
                          ? group.isPrimary
                            ? 'bg-slate-800/90 text-slate-100 border-slate-700 hover:bg-slate-700 hover:text-white'
                            : 'bg-slate-900 text-slate-200 border-slate-800 hover:bg-slate-800 hover:text-white'
                          : group.isPrimary
                          ? 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100'
                          : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100 hover:text-slate-950'
                      }`}
                    >
                      <span className={
                        isActive
                          ? 'text-white'
                          : group.isPrimary
                          ? isDark ? 'text-amber-300' : 'text-amber-800'
                          : isDark ? 'text-slate-300' : 'text-slate-600'
                      }>
                        {SECTOR_ICONS[sec]}
                      </span>
                      <span>{sectorLabels[sec] || sec}</span>
                      {isTrending && (
                        <span className="text-[10px] animate-pulse" title={isVietnamese ? "Tâm điểm chú ý / Bùng nổ thảo luận" : "Trending focus / High buzz"}>🔥</span>
                      )}
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : isDark
                            ? 'bg-slate-700 text-slate-100'
                            : 'bg-slate-200 text-slate-900'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


