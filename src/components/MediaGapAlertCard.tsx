import React from 'react';
import { ScrapedNewsItem, MediaGapAnalysis } from '../types';
import { detectMediaGap } from '../lib/sentimentAndGapEngine';
import { useTheme } from '../lib/theme';
import {
  Radio,
  AlertCircle,
  HelpCircle,
  Megaphone,
  UserCheck,
  Building2,
  Share2,
  FileSpreadsheet,
  CheckCircle,
  Send,
  Sparkles
} from 'lucide-react';

interface MediaGapAlertCardProps {
  item: ScrapedNewsItem;
  className?: string;
  onDraftCampaign?: (gap: MediaGapAnalysis) => void;
}

export const MediaGapAlertCard: React.FC<MediaGapAlertCardProps> = ({
  item,
  className = '',
  onDraftCampaign
}) => {
  const { isDark } = useTheme();
  const gap = item.mediaGap || detectMediaGap(item);

  if (!gap || !gap.hasGap) {
    return null;
  }

  const isHighSeverity = gap.gapSeverity === 'HIGH';

  return (
    <div className={`p-4 rounded-2xl border shadow-md space-y-3.5 transition-all ${
      isHighSeverity
        ? isDark
          ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-rose-950/30 border-amber-500/50'
          : 'bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 border-amber-300'
        : isDark
        ? 'bg-gradient-to-br from-blue-950/30 via-slate-900 to-slate-950 border-blue-500/40'
        : 'bg-gradient-to-br from-blue-50/70 via-white to-slate-50 border-blue-200'
    } ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2.5 dark:border-slate-800 border-slate-200">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${
            isHighSeverity
              ? isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300'
              : isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' : 'bg-blue-100 text-blue-800 border-blue-300'
          }`}>
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className={`text-xs font-black uppercase tracking-wider ${
                isHighSeverity ? isDark ? 'text-amber-300' : 'text-amber-900' : isDark ? 'text-blue-300' : 'text-blue-900'
              }`}>
                Phát Hiện Khoảng Trống Truyền Thông (Media Gap)
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                isHighSeverity
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              }`}>
                {isHighSeverity ? '⚠️ NGUY CƠ CAO' : 'ℹ️ CẦN BỔ SUNG'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Chủ đề dư luận/doanh nghiệp quan tâm lớn nhưng thiếu thông điệp hướng dẫn chính sách đầy đủ
            </p>
          </div>
        </div>

        {onDraftCampaign && (
          <button
            onClick={() => onDraftCampaign(gap)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition shadow-xs cursor-pointer"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Kích Hoạt Tin Bài Định Hướng</span>
          </button>
        )}
      </div>

      {/* Identified Deficit & Public Concern */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <div className={`p-3 rounded-xl border ${
          isDark ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}>
          <div className="flex items-center gap-1.5 mb-1">
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
              Vấn đề Dư luận / Người dân / DN đang băn khoăn:
            </span>
          </div>
          <p className="text-xs leading-relaxed font-medium">
            {gap.topicConcern}
          </p>
        </div>

        <div className={`p-3 rounded-xl border ${
          isDark ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}>
          <div className="flex items-center gap-1.5 mb-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-rose-400' : 'text-rose-800'}`}>
              Khoảng trống thông tin nhận diện được:
            </span>
          </div>
          <p className="text-xs leading-relaxed font-medium">
            {gap.informationDeficit}
          </p>
        </div>
      </div>

      {/* 2-Column Action Pillars: Citizen/Business Guidance vs Government Proactive Communication */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Pillar 1: Tư vấn Người dân & Doanh nghiệp cần làm gì */}
        <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
          isDark ? 'bg-blue-950/20 border-blue-500/30' : 'bg-blue-50/60 border-blue-200'
        }`}>
          <div>
            <div className="flex items-center gap-1.5 mb-2 border-b pb-1.5 dark:border-blue-500/20 border-blue-200">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                1. Tư Vấn: Người Dân & DN Cần Làm Gì Ngay?
              </span>
            </div>
            <div className="space-y-1.5">
              {gap.citizenBizGuidance.map((guide, idx) => (
                <div key={idx} className={`p-2 rounded-lg text-xs leading-relaxed border ${
                  isDark ? 'bg-slate-900/90 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                }`}>
                  <p>{guide}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 text-[10px] text-blue-400 font-semibold">
            ✓ Tránh vi phạm hành chính & Bảo vệ quyền lợi hợp pháp
          </div>
        </div>

        {/* Pillar 2: Kế hoạch Chủ động Bơm tin bài & Tuyên truyền của Bộ */}
        <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
          isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50/60 border-amber-200'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2 border-b pb-1.5 dark:border-amber-500/20 border-amber-200">
              <div className="flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-amber-400" />
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                  2. Chủ Động Bơm Tin Bài & Định Hướng
                </span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {gap.proactiveGovAction.leadAgency}
              </span>
            </div>

            <div className="mb-2">
              <span className={`text-[11px] font-bold block ${isDark ? 'text-amber-200' : 'text-amber-950'}`}>
                📌 {gap.proactiveGovAction.campaignTitle}
              </span>
            </div>

            <div className="space-y-1.5">
              {gap.proactiveGovAction.communicationSteps.map((step, idx) => (
                <div key={idx} className={`p-2 rounded-lg text-xs leading-relaxed border ${
                  isDark ? 'bg-slate-900/90 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                }`}>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 text-[10px] text-amber-400 font-semibold">
            🚀 Tăng cường tần suất tin bài giải thích cặn kẽ trên các phương tiện truyền thông
          </div>
        </div>
      </div>
    </div>
  );
};
