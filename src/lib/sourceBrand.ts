import React from 'react';
import {
  Landmark,
  Newspaper,
  Briefcase,
  TrendingUp,
  BarChart3,
  LineChart,
  Coffee,
  Globe,
  ShieldCheck,
  FileText,
  Layers,
  Radio,
  Tv,
  Flame,
  FileSpreadsheet,
  Building2,
  LucideIcon,
  CheckCircle2,
} from 'lucide-react';

export interface SourceBrandMeta {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  domain?: string;
  icon: LucideIcon;
  isOfficial?: boolean;
  tier: 'tier1_gov' | 'tier1_press' | 'tier2_finance' | 'general_media';
  tierLabel: string;
  badgeClassLight: string;
  badgeClassDark: string;
  iconBgLight: string;
  iconBgDark: string;
  iconColorLight: string;
  iconColorDark: string;
  borderLight: string;
  borderDark: string;
  textLight: string;
  textDark: string;
  accentDotColor: string;
}

export const KNOWN_SOURCES: Record<string, SourceBrandMeta> = {
  mof: {
    id: 'mof',
    name: 'Cổng TTĐT Bộ Tài chính',
    shortName: 'Bộ Tài chính',
    tagline: 'Cơ quan chỉ đạo Quản lý Nhà nước về Tài chính - Ngân sách',
    domain: 'mof.gov.vn',
    icon: Landmark,
    isOfficial: true,
    tier: 'tier1_gov',
    tierLabel: 'Cơ quan Điều hành',
    badgeClassLight: 'bg-rose-50 border-rose-300 text-rose-950',
    badgeClassDark: 'bg-rose-950/70 border-rose-700/80 text-rose-200',
    iconBgLight: 'bg-rose-600 text-white shadow-xs shadow-rose-600/30',
    iconBgDark: 'bg-rose-600 text-white shadow-xs shadow-rose-950',
    iconColorLight: 'text-white',
    iconColorDark: 'text-white',
    borderLight: 'border-rose-300',
    borderDark: 'border-rose-700/80',
    textLight: 'text-rose-950 font-bold',
    textDark: 'text-rose-200 font-bold',
    accentDotColor: 'bg-rose-600',
  },
  tbtcvn: {
    id: 'tbtcvn',
    name: 'Thời báo Tài chính Việt Nam',
    shortName: 'Thời báo Tài chính',
    tagline: 'Cơ quan ngôn luận của Bộ Tài chính Việt Nam',
    domain: 'thoibaotaichinhvietnam.vn',
    icon: Newspaper,
    isOfficial: true,
    tier: 'tier1_gov',
    tierLabel: 'Báo Ngành Tài chính',
    badgeClassLight: 'bg-red-50 border-red-200 text-red-900',
    badgeClassDark: 'bg-red-950/60 border-red-800/80 text-red-300',
    iconBgLight: 'bg-red-600 text-white shadow-xs',
    iconBgDark: 'bg-red-700 text-white shadow-xs',
    iconColorLight: 'text-white',
    iconColorDark: 'text-white',
    borderLight: 'border-red-200',
    borderDark: 'border-red-800/80',
    textLight: 'text-red-900 font-bold',
    textDark: 'text-red-300 font-bold',
    accentDotColor: 'bg-red-500',
  },
  baodautu: {
    id: 'baodautu',
    name: 'Báo Đầu tư',
    shortName: 'Báo Đầu tư',
    tagline: 'Cơ quan báo chí kinh tế, đầu tư & đối ngoại hàng đầu',
    domain: 'baodautu.vn',
    icon: Briefcase,
    isOfficial: true,
    tier: 'tier1_press',
    tierLabel: 'Báo chí Đầu tư',
    badgeClassLight: 'bg-teal-50/90 border-teal-300 text-teal-950',
    badgeClassDark: 'bg-teal-950/60 border-teal-700/80 text-teal-300',
    iconBgLight: 'bg-teal-700 text-white shadow-xs shadow-teal-700/20',
    iconBgDark: 'bg-teal-600 text-white shadow-xs',
    iconColorLight: 'text-white',
    iconColorDark: 'text-white',
    borderLight: 'border-teal-300',
    borderDark: 'border-teal-700/80',
    textLight: 'text-teal-950 font-bold',
    textDark: 'text-teal-200 font-bold',
    accentDotColor: 'bg-teal-600',
  },
  vneconomy: {
    id: 'vneconomy',
    name: 'VnEconomy',
    shortName: 'VnEconomy',
    tagline: 'Tạp chí Kinh tế Việt Nam - Chuyên trang vĩ mô & chính sách',
    domain: 'vneconomy.vn',
    icon: BarChart3,
    isOfficial: false,
    tier: 'tier1_press',
    tierLabel: 'Tạp chí Kinh tế',
    badgeClassLight: 'bg-indigo-50 border-indigo-200 text-indigo-950',
    badgeClassDark: 'bg-indigo-950/60 border-indigo-800/80 text-indigo-300',
    iconBgLight: 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20',
    iconBgDark: 'bg-indigo-600 text-white shadow-xs',
    iconColorLight: 'text-white',
    iconColorDark: 'text-white',
    borderLight: 'border-indigo-200',
    borderDark: 'border-indigo-800/80',
    textLight: 'text-indigo-950 font-bold',
    textDark: 'text-indigo-200 font-bold',
    accentDotColor: 'bg-indigo-500',
  },
  cafef: {
    id: 'cafef',
    name: 'CafeF',
    shortName: 'CafeF',
    tagline: 'Kênh thông tin tài chính, ngân hàng & dữ liệu chứng khoán',
    domain: 'cafef.vn',
    icon: Coffee,
    isOfficial: false,
    tier: 'tier2_finance',
    tierLabel: 'Dữ liệu Tài chính',
    badgeClassLight: 'bg-amber-50 border-amber-300 text-amber-950',
    badgeClassDark: 'bg-amber-950/60 border-amber-700/80 text-amber-300',
    iconBgLight: 'bg-amber-600 text-white shadow-xs shadow-amber-600/20',
    iconBgDark: 'bg-amber-600 text-white shadow-xs',
    iconColorLight: 'text-white',
    iconColorDark: 'text-white',
    borderLight: 'border-amber-300',
    borderDark: 'border-amber-700/80',
    textLight: 'text-amber-950 font-bold',
    textDark: 'text-amber-200 font-bold',
    accentDotColor: 'bg-amber-500',
  },
  vietstock: {
    id: 'vietstock',
    name: 'Vietstock',
    shortName: 'Vietstock',
    tagline: 'Cổng thông tin tài chính & công cụ phân tích chứng khoán',
    domain: 'vietstock.vn',
    icon: LineChart,
    isOfficial: false,
    tier: 'tier2_finance',
    tierLabel: 'Chuyên trang Chứng khoán',
    badgeClassLight: 'bg-cyan-50 border-cyan-200 text-cyan-950',
    badgeClassDark: 'bg-cyan-950/60 border-cyan-800/80 text-cyan-300',
    iconBgLight: 'bg-cyan-600 text-white shadow-xs shadow-cyan-600/20',
    iconBgDark: 'bg-cyan-600 text-white shadow-xs',
    iconColorLight: 'text-white',
    iconColorDark: 'text-white',
    borderLight: 'border-cyan-200',
    borderDark: 'border-cyan-800/80',
    textLight: 'text-cyan-950 font-bold',
    textDark: 'text-cyan-200 font-bold',
    accentDotColor: 'bg-cyan-500',
  },
  vnexpress: {
    id: 'vnexpress',
    name: 'VnExpress',
    shortName: 'VnExpress',
    tagline: 'Báo điện tử VnExpress - Chuyên mục Kinh Doanh & Tiền Tệ',
    domain: 'vnexpress.net',
    icon: Flame,
    isOfficial: false,
    tier: 'tier1_press',
    tierLabel: 'Báo điện tử Quốc dân',
    badgeClassLight: 'bg-rose-50 border-rose-200 text-rose-900',
    badgeClassDark: 'bg-rose-950/50 border-rose-800/80 text-rose-300',
    iconBgLight: 'bg-rose-700 text-white shadow-xs shadow-rose-700/20',
    iconBgDark: 'bg-rose-700 text-white shadow-xs',
    iconColorLight: 'text-white',
    iconColorDark: 'text-white',
    borderLight: 'border-rose-200',
    borderDark: 'border-rose-800/80',
    textLight: 'text-rose-900 font-bold',
    textDark: 'text-rose-300 font-bold',
    accentDotColor: 'bg-rose-600',
  },
  baochinhphu: {
    id: 'baochinhphu',
    name: 'Báo Điện tử Chính phủ',
    shortName: 'Báo Chính Phủ',
    tagline: 'Cổng TTĐT Chính phủ Nước CHXHCN Việt Nam',
    domain: 'baochinhphu.vn',
    icon: Landmark,
    isOfficial: true,
    tier: 'tier1_gov',
    tierLabel: 'Cổng TT Chính phủ',
    badgeClassLight: 'bg-red-50 border-red-300 text-red-950',
    badgeClassDark: 'bg-red-950/70 border-red-700 text-red-200',
    iconBgLight: 'bg-red-700 text-amber-300 shadow-xs shadow-red-700/30',
    iconBgDark: 'bg-red-700 text-amber-300 shadow-xs',
    iconColorLight: 'text-amber-300',
    iconColorDark: 'text-amber-300',
    borderLight: 'border-red-300',
    borderDark: 'border-red-700',
    textLight: 'text-red-950 font-bold',
    textDark: 'text-red-200 font-bold',
    accentDotColor: 'bg-red-600',
  },
  tuoitre: {
    id: 'tuoitre',
    name: 'Báo Tuổi Trẻ',
    shortName: 'Tuổi Trẻ',
    tagline: 'Báo Tuổi Trẻ Online - Kinh Tế & Thị Trường',
    domain: 'tuoitre.vn',
    icon: Newspaper,
    isOfficial: false,
    tier: 'tier1_press',
    tierLabel: 'Báo chí Toàn quốc',
    badgeClassLight: 'bg-blue-50 border-blue-200 text-blue-950',
    badgeClassDark: 'bg-blue-950/60 border-blue-800/80 text-blue-300',
    iconBgLight: 'bg-blue-600 text-white shadow-xs',
    iconBgDark: 'bg-blue-600 text-white shadow-xs',
    iconColorLight: 'text-white',
    iconColorDark: 'text-white',
    borderLight: 'border-blue-200',
    borderDark: 'border-blue-800/80',
    textLight: 'text-blue-950 font-bold',
    textDark: 'text-blue-200 font-bold',
    accentDotColor: 'bg-blue-500',
  },
  thanhnien: {
    id: 'thanhnien',
    name: 'Báo Thanh Niên',
    shortName: 'Thanh Niên',
    tagline: 'Báo Thanh Niên - Tài Chính & Tiêu Dùng',
    domain: 'thanhnien.vn',
    icon: Newspaper,
    isOfficial: false,
    tier: 'tier1_press',
    tierLabel: 'Báo chí Toàn quốc',
    badgeClassLight: 'bg-sky-50 border-sky-200 text-sky-950',
    badgeClassDark: 'bg-sky-950/60 border-sky-800/80 text-sky-300',
    iconBgLight: 'bg-sky-600 text-white shadow-xs',
    iconBgDark: 'bg-sky-600 text-white shadow-xs',
    iconColorLight: 'text-white',
    iconColorDark: 'text-white',
    borderLight: 'border-sky-200',
    borderDark: 'border-sky-800/80',
    textLight: 'text-sky-950 font-bold',
    textDark: 'text-sky-200 font-bold',
    accentDotColor: 'bg-sky-500',
  },
  laodong: {
    id: 'laodong',
    name: 'Báo Lao Động',
    shortName: 'Lao Động',
    tagline: 'Báo Lao Động - Tiền tệ & Đầu tư',
    domain: 'laodong.vn',
    icon: FileText,
    isOfficial: false,
    tier: 'tier1_press',
    tierLabel: 'Báo chí Toàn quốc',
    badgeClassLight: 'bg-orange-50 border-orange-200 text-orange-950',
    badgeClassDark: 'bg-orange-950/60 border-orange-800/80 text-orange-300',
    iconBgLight: 'bg-orange-600 text-white shadow-xs',
    iconBgDark: 'bg-orange-600 text-white shadow-xs',
    iconColorLight: 'text-white',
    iconColorDark: 'text-white',
    borderLight: 'border-orange-200',
    borderDark: 'border-orange-800/80',
    textLight: 'text-orange-950 font-bold',
    textDark: 'text-orange-200 font-bold',
    accentDotColor: 'bg-orange-500',
  },
  vietnambiz: {
    id: 'vietnambiz',
    name: 'VietnamBiz',
    shortName: 'VietnamBiz',
    tagline: 'Thông tin kinh tế, doanh nghiệp & chuỗi cung ứng',
    domain: 'vietnambiz.vn',
    icon: TrendingUp,
    isOfficial: false,
    tier: 'tier2_finance',
    tierLabel: 'Kinh doanh & Thị trường',
    badgeClassLight: 'bg-violet-50 border-violet-200 text-violet-950',
    badgeClassDark: 'bg-violet-950/60 border-violet-800/80 text-violet-300',
    iconBgLight: 'bg-violet-600 text-white shadow-xs',
    iconBgDark: 'bg-violet-600 text-white shadow-xs',
    iconColorLight: 'text-white',
    iconColorDark: 'text-white',
    borderLight: 'border-violet-200',
    borderDark: 'border-violet-800/80',
    textLight: 'text-violet-950 font-bold',
    textDark: 'text-violet-200 font-bold',
    accentDotColor: 'bg-violet-500',
  },
  haiquan: {
    id: 'haiquan',
    name: 'Hải quan Online',
    shortName: 'Hải quan',
    tagline: 'Tạp chí Hải quan - Cơ quan ngôn luận của Tổng cục Hải quan',
    domain: 'haiquanonline.com.vn',
    icon: ShieldCheck,
    isOfficial: true,
    tier: 'tier1_gov',
    tierLabel: 'Ngành Hải quan',
    badgeClassLight: 'bg-blue-50 border-blue-300 text-blue-950',
    badgeClassDark: 'bg-blue-950/70 border-blue-700 text-blue-200',
    iconBgLight: 'bg-blue-700 text-white shadow-xs',
    iconBgDark: 'bg-blue-700 text-white shadow-xs',
    iconColorLight: 'text-white',
    iconColorDark: 'text-white',
    borderLight: 'border-blue-300',
    borderDark: 'border-blue-700',
    textLight: 'text-blue-950 font-bold',
    textDark: 'text-blue-200 font-bold',
    accentDotColor: 'bg-blue-600',
  },
  tapchithue: {
    id: 'tapchithue',
    name: 'Tạp chí Thuế',
    shortName: 'Tạp chí Thuế',
    tagline: 'Cơ quan ngôn luận của Cục Thuế và Thuế địa phương',
    domain: 'tapchithue.com.vn',
    icon: FileSpreadsheet,
    isOfficial: true,
    tier: 'tier1_gov',
    tierLabel: 'Ngành Thuế',
    badgeClassLight: 'bg-rose-50 border-rose-300 text-rose-950',
    badgeClassDark: 'bg-rose-950/70 border-rose-700 text-rose-200',
    iconBgLight: 'bg-rose-600 text-white shadow-xs',
    iconBgDark: 'bg-rose-600 text-white shadow-xs',
    iconColorLight: 'text-white',
    iconColorDark: 'text-white',
    borderLight: 'border-rose-300',
    borderDark: 'border-rose-700',
    textLight: 'text-rose-950 font-bold',
    textDark: 'text-rose-200 font-bold',
    accentDotColor: 'bg-rose-600',
  },
  bnews: {
    id: 'bnews',
    name: 'Bnews / TTXVN',
    shortName: 'Bnews (TTXVN)',
    tagline: 'Trang thông tin kinh tế của Thông tấn xã Việt Nam',
    domain: 'bnews.vn',
    icon: Radio,
    isOfficial: true,
    tier: 'tier1_gov',
    tierLabel: 'Hãng Thông tấn',
    badgeClassLight: 'bg-emerald-50 border-emerald-200 text-emerald-950',
    badgeClassDark: 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300',
    iconBgLight: 'bg-emerald-600 text-white shadow-xs',
    iconBgDark: 'bg-emerald-600 text-white shadow-xs',
    iconColorLight: 'text-white',
    iconColorDark: 'text-white',
    borderLight: 'border-emerald-200',
    borderDark: 'border-emerald-800/80',
    textLight: 'text-emerald-950 font-bold',
    textDark: 'text-emerald-200 font-bold',
    accentDotColor: 'bg-emerald-500',
  },
  vtv: {
    id: 'vtv',
    name: 'VTV Money',
    shortName: 'VTV Money',
    tagline: 'Bản tin Tài chính Kinh doanh - Đài Truyền hình Việt Nam',
    domain: 'vtv.vn',
    icon: Tv,
    isOfficial: true,
    tier: 'tier1_press',
    tierLabel: 'Truyền hình Quốc gia',
    badgeClassLight: 'bg-red-50 border-red-200 text-red-950',
    badgeClassDark: 'bg-red-950/60 border-red-800/80 text-red-300',
    iconBgLight: 'bg-red-600 text-white shadow-xs',
    iconBgDark: 'bg-red-600 text-white shadow-xs',
    iconColorLight: 'text-white',
    iconColorDark: 'text-white',
    borderLight: 'border-red-200',
    borderDark: 'border-red-800/80',
    textLight: 'text-red-950 font-bold',
    textDark: 'text-red-200 font-bold',
    accentDotColor: 'bg-red-600',
  },
};

/**
 * Resolves source metadata and distinct styling based on source string or url
 */
export function getSourceBrandMeta(rawSource?: string, url?: string): SourceBrandMeta {
  const clean = (rawSource || '').toLowerCase().trim();
  const cleanUrl = (url || '').toLowerCase().trim();

  if (
    clean.includes('bộ tài chính') ||
    clean.includes('mof') ||
    clean.includes('cổng ttđt bộ tài chính') ||
    cleanUrl.includes('mof.gov.vn')
  ) {
    return KNOWN_SOURCES.mof;
  }

  if (
    clean.includes('thời báo tài chính') ||
    clean.includes('tbtcvn') ||
    cleanUrl.includes('thoibaotaichinhvietnam.vn')
  ) {
    return KNOWN_SOURCES.tbtcvn;
  }

  if (
    clean.includes('đầu tư') ||
    clean.includes('vir') ||
    clean.includes('đầu tư chứng khoán') ||
    cleanUrl.includes('baodautu.vn') ||
    cleanUrl.includes('tinnhanhchungkhoan.vn')
  ) {
    return KNOWN_SOURCES.baodautu;
  }

  if (
    clean.includes('vneconomy') ||
    clean.includes('thời báo kinh tế việt nam') ||
    cleanUrl.includes('vneconomy.vn')
  ) {
    return KNOWN_SOURCES.vneconomy;
  }

  if (
    clean.includes('cafef') ||
    clean.includes('cafebiz') ||
    cleanUrl.includes('cafef.vn') ||
    cleanUrl.includes('cafebiz.vn')
  ) {
    return KNOWN_SOURCES.cafef;
  }

  if (
    clean.includes('vietstock') ||
    cleanUrl.includes('vietstock.vn')
  ) {
    return KNOWN_SOURCES.vietstock;
  }

  if (
    clean.includes('vnexpress') ||
    cleanUrl.includes('vnexpress.net')
  ) {
    return KNOWN_SOURCES.vnexpress;
  }

  if (
    clean.includes('chính phủ') ||
    clean.includes('vgp') ||
    cleanUrl.includes('baochinhphu.vn')
  ) {
    return KNOWN_SOURCES.baochinhphu;
  }

  if (
    clean.includes('hải quan') ||
    cleanUrl.includes('haiquanonline.com.vn')
  ) {
    return KNOWN_SOURCES.haiquan;
  }

  if (
    clean.includes('tạp chí thuế') ||
    clean.includes('tổng cục thuế') ||
    cleanUrl.includes('gdt.gov.vn') ||
    cleanUrl.includes('tapchithue.com.vn')
  ) {
    return KNOWN_SOURCES.tapchithue;
  }

  if (
    clean.includes('bnews') ||
    clean.includes('ttxvn') ||
    cleanUrl.includes('bnews.vn')
  ) {
    return KNOWN_SOURCES.bnews;
  }

  if (
    clean.includes('vtv') ||
    cleanUrl.includes('vtv.vn')
  ) {
    return KNOWN_SOURCES.vtv;
  }

  if (
    clean.includes('tuổi trẻ') ||
    cleanUrl.includes('tuoitre.vn')
  ) {
    return KNOWN_SOURCES.tuoitre;
  }

  if (
    clean.includes('thanh niên') ||
    cleanUrl.includes('thanhnien.vn')
  ) {
    return KNOWN_SOURCES.thanhnien;
  }

  if (
    clean.includes('lao động') ||
    cleanUrl.includes('laodong.vn')
  ) {
    return KNOWN_SOURCES.laodong;
  }

  if (
    clean.includes('vietnambiz') ||
    cleanUrl.includes('vietnambiz.vn')
  ) {
    return KNOWN_SOURCES.vietnambiz;
  }

  // Fallback for general/unregistered sources
  const displayName = rawSource || 'Báo chí';
  return {
    id: 'generic',
    name: displayName,
    shortName: displayName.length > 18 ? displayName.slice(0, 16) + '...' : displayName,
    tagline: 'Cơ quan truyền thông báo chí',
    icon: Globe,
    isOfficial: false,
    tier: 'general_media',
    tierLabel: 'Truyền thông',
    badgeClassLight: 'bg-slate-100 border-slate-300 text-slate-800',
    badgeClassDark: 'bg-slate-800/90 border-slate-700 text-slate-200',
    iconBgLight: 'bg-slate-600 text-white shadow-xs',
    iconBgDark: 'bg-slate-700 text-white shadow-xs',
    iconColorLight: 'text-white',
    iconColorDark: 'text-white',
    borderLight: 'border-slate-300',
    borderDark: 'border-slate-700',
    textLight: 'text-slate-800 font-semibold',
    textDark: 'text-slate-200 font-semibold',
    accentDotColor: 'bg-slate-400',
  };
}
