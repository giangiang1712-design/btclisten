import React from 'react';
import { getSourceBrandMeta, SourceBrandMeta } from '../lib/sourceBrand';
import { ShieldCheck, CheckCircle2, Globe, ExternalLink } from 'lucide-react';
import { useTheme } from '../lib/theme';

export interface SourceBrandBadgeProps {
  source?: string;
  url?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'tag' | 'pill' | 'card';
  showIcon?: boolean;
  showOfficialBadge?: boolean;
  showDomain?: boolean;
  showTierTag?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const SourceBrandBadge: React.FC<SourceBrandBadgeProps> = ({
  source,
  url,
  size = 'sm',
  variant = 'badge',
  showIcon = true,
  showOfficialBadge = true,
  showDomain = false,
  showTierTag = false,
  className = '',
  onClick,
}) => {
  const { isDark } = useTheme();
  const brand = getSourceBrandMeta(source, url);
  const IconComponent = brand.icon;

  const sizeClasses = {
    xs: {
      container: 'px-1.5 py-0.5 text-[10px] gap-1',
      iconBox: 'w-3.5 h-3.5 text-[8px] rounded-xs',
      icon: 'w-2.5 h-2.5',
      text: 'text-[10px]',
      tag: 'text-[8px] px-1 py-0.2',
    },
    sm: {
      container: 'px-2 py-0.5 text-[11px] gap-1.5',
      iconBox: 'w-4 h-4 text-[9px] rounded-sm',
      icon: 'w-3 h-3',
      text: 'text-[11px]',
      tag: 'text-[9px] px-1.5 py-0.2',
    },
    md: {
      container: 'px-2.5 py-1 text-xs gap-1.5',
      iconBox: 'w-5 h-5 text-[10px] rounded-md',
      icon: 'w-3.5 h-3.5',
      text: 'text-xs',
      tag: 'text-[10px] px-1.5 py-0.5',
    },
    lg: {
      container: 'px-3 py-1.5 text-sm gap-2',
      iconBox: 'w-6 h-6 text-xs rounded-md',
      icon: 'w-4 h-4',
      text: 'text-sm',
      tag: 'text-xs px-2 py-0.5',
    },
  }[size];

  const badgeThemeClasses = isDark ? brand.badgeClassDark : brand.badgeClassLight;
  const iconBgClasses = isDark ? brand.iconBgDark : brand.iconBgLight;
  const textClasses = isDark ? brand.textDark : brand.textLight;

  return (
    <span
      id={`source-brand-${brand.id}`}
      title={`${brand.name} • ${brand.tagline}${brand.domain ? ` (${brand.domain})` : ''}`}
      onClick={onClick}
      className={`inline-flex items-center rounded-lg border font-semibold transition-all duration-150 select-none ${
        onClick ? 'cursor-pointer hover:opacity-90 hover:scale-[1.02]' : ''
      } ${sizeClasses.container} ${badgeThemeClasses} ${className}`}
    >
      {/* Brand Icon Avatar */}
      {showIcon && (
        <span
          className={`flex items-center justify-center shrink-0 font-bold ${sizeClasses.iconBox} ${iconBgClasses}`}
        >
          <IconComponent className={sizeClasses.icon} />
        </span>
      )}

      {/* Source Name */}
      <span className={`tracking-tight truncate ${textClasses} ${sizeClasses.text}`}>
        {brand.shortName || source}
      </span>

      {/* Official Verified Indicator */}
      {showOfficialBadge && brand.isOfficial && (
        <span
          className={`inline-flex items-center gap-0.5 shrink-0 ${
            isDark ? 'text-amber-400' : 'text-amber-700'
          }`}
          title="Nguồn tin chính thống / Cơ quan Nhà nước"
        >
          <ShieldCheck className="w-3 h-3 text-amber-500 fill-amber-500/20" />
        </span>
      )}

      {/* Optional Tier Tag */}
      {showTierTag && (
        <span
          className={`rounded-full font-bold uppercase tracking-wider ${
            isDark ? 'bg-slate-800 text-slate-300' : 'bg-white/80 text-slate-700 shadow-2xs'
          } ${sizeClasses.tag}`}
        >
          {brand.tierLabel}
        </span>
      )}

      {/* Optional Domain display */}
      {showDomain && brand.domain && (
        <span
          className={`hidden sm:inline font-mono opacity-70 text-[10px] ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {brand.domain}
        </span>
      )}
    </span>
  );
};
