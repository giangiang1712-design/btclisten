import React, { useState } from 'react';
import {
  Calculator,
  ShieldAlert,
  GitCompare,
  TrendingUp,
  Users,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { ScrapedNewsItem } from '../types';
import { generateWarningPipelineModel } from '../lib/warningPipelineEngine';
import { SeverityAlgorithmEngine } from '../lib/severityEngine';
import { Decree376ClassificationEngine } from '../lib/decree376ClassificationEngine';

export interface QuantitativeRiskBreakdown {
  S: number; // Severity [0, 50]
  D: number; // Divergence [0, 20]
  V: number; // Velocity [0.0, 1.0]
  I: number; // Impact [0.0, 1.0]
  riskScore: number; // [0, 100]
  level: 'DISTANT' | 'EARLY' | 'RAPID' | 'EMERGENCY' | 'STANDARD';
  levelLabel?: string;
  divergenceDetails?: string | null;
  severityReason?: string;
  impactReason?: string;
}

export function extractQuantitativeBreakdown(item: ScrapedNewsItem): QuantitativeRiskBreakdown {
  if (item.isMarketDigest) {
    return {
      S: 0,
      D: 0,
      V: 0.1,
      I: 0.1,
      riskScore: 0,
      level: 'STANDARD',
      levelLabel: 'Giám sát thường quy (<20 điểm)',
    };
  }

  if (item.warningPipeline?.formulaMetrics) {
    const fm = item.warningPipeline.formulaMetrics;
    const alertLevel = item.warningPipeline.level3Action?.alertLevel;
    const score = fm.rawRiskScore ?? item.riskScore ?? 0;

    let computedLvl: 'DISTANT' | 'EARLY' | 'RAPID' | 'EMERGENCY' | 'STANDARD' = 'STANDARD';
    if (alertLevel && alertLevel !== 'MARKET_DIGEST' && alertLevel !== 'STANDARD') {
      computedLvl = alertLevel as any;
    } else if (score >= 75 || item.isEmergency) {
      computedLvl = 'EMERGENCY';
    } else if (score >= 60) {
      computedLvl = 'RAPID';
    } else if (score >= 40) {
      computedLvl = 'EARLY';
    } else if (score >= 20) {
      computedLvl = 'DISTANT';
    }

    return {
      S: fm.S ?? 20,
      D: fm.D ?? 0,
      V: fm.V ?? 0.3,
      I: fm.I ?? 0.5,
      riskScore: score,
      level: computedLvl,
      levelLabel: item.warningPipeline.level3Action?.alertLevelLabelVi,
      divergenceDetails: item.warningPipeline.standardizedJsonOutput?.tier_2_crisis_risk?.divergence_details,
    };
  }

  // Check Decree 376 classification ground truth
  const d376 = Decree376ClassificationEngine.classify(item);

  // Calculate using SeverityAlgorithmEngine
  const unified = SeverityAlgorithmEngine.calculateUnifiedRisk(item);

  if (d376.isExcluded || d376.tier === 0) {
    return {
      S: Math.min(5, unified.S),
      D: 0,
      V: Math.min(0.2, unified.V),
      I: Math.min(0.3, unified.I),
      riskScore: Math.min(15, unified.riskScore),
      level: 'STANDARD',
      levelLabel: 'Giám sát Thường quy',
      divergenceDetails: 'Tin nghiệp vụ thường quy / Không có độ vênh chính sách',
      severityReason: d376.classificationReason
    };
  }

  let lvl: 'DISTANT' | 'EARLY' | 'RAPID' | 'EMERGENCY' | 'STANDARD' = 'STANDARD';
  if (d376.tier === 3 || unified.riskScore >= 75 || item.isEmergency) {
    lvl = 'EMERGENCY';
  } else if (unified.riskScore >= 60) {
    lvl = 'RAPID';
  } else if (d376.tier === 2 || unified.riskScore >= 40) {
    lvl = 'EARLY';
  } else if (d376.tier === 1 || unified.riskScore >= 20) {
    lvl = 'DISTANT';
  }

  return {
    S: unified.S,
    D: unified.D,
    V: unified.V,
    I: unified.I,
    riskScore: unified.riskScore,
    level: lvl,
    divergenceDetails: unified.divergenceOutput?.levelDescription || unified.divergenceOutput?.closestAnchorCase?.description,
    severityReason: d376.classificationReason
  };
}

export const ALERT_LEVEL_METRICS_META: Record<string, {
  nameVi: string;
  levelBadge: string;
  badgeBg: string;
  borderClass: string;
  textClass: string;
  rangeText: string;
  sla: string;
}> = {
  DISTANT: {
    nameVi: 'Cấp 1: Cảnh Báo Xa (Early Horizon)',
    levelBadge: '○ [SOP 1] CẢNH BÁO XA',
    badgeBg: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    borderClass: 'border-zinc-700',
    textClass: 'text-zinc-300',
    rangeText: '20 – 39 điểm',
    sla: '24–48h'
  },
  EARLY: {
    nameVi: 'Cấp 2: Cảnh Báo Sớm (Early Warning)',
    levelBadge: '□ [SOP 2] CẢNH BÁO SỚM',
    badgeBg: 'bg-zinc-700 text-zinc-100 border-zinc-600 font-medium',
    borderClass: 'border-zinc-600',
    textClass: 'text-zinc-200',
    rangeText: '40 – 59 điểm',
    sla: 'Trong 24h'
  },
  RAPID: {
    nameVi: 'Cấp 3: Cảnh Báo Nhanh (Rapid Alert)',
    levelBadge: '◇ [SOP 3] CẢNH BÁO NHANH',
    badgeBg: 'bg-zinc-200 text-zinc-950 font-bold border-white',
    borderClass: 'border-white',
    textClass: 'text-white font-bold',
    rangeText: '60 – 74 điểm',
    sla: 'Trong ngày (12h)'
  },
  EMERGENCY: {
    nameVi: 'Cấp 4: Cảnh Báo Khẩn Cấp (Emergency Alert)',
    levelBadge: '△ [SOP 4] KHẨN CẤP',
    badgeBg: 'bg-white text-black font-extrabold border-white',
    borderClass: 'border-white border-2',
    textClass: 'text-white font-extrabold',
    rangeText: '75 – 100 điểm',
    sla: 'Hỏa tốc 2–4h'
  },
  STANDARD: {
    nameVi: 'Giám sát Thường quy (Standard Monitoring)',
    levelBadge: '📋 THƯỜNG QUY',
    badgeBg: 'bg-zinc-900 text-zinc-400 border-zinc-800',
    borderClass: 'border-zinc-800',
    textClass: 'text-zinc-400',
    rangeText: '< 20 điểm',
    sla: 'Định kỳ'
  }
};

interface QuantitativeFormulaBreakdownProps {
  metrics: QuantitativeRiskBreakdown;
  mode?: 'card' | 'tooltip' | 'compact';
  isDark?: boolean;
  onOpenFullModal?: () => void;
}

export const QuantitativeFormulaBreakdown: React.FC<QuantitativeFormulaBreakdownProps> = ({
  metrics,
  mode = 'card',
  isDark = true,
  onOpenFullModal
}) => {
  const { S, D, V, I, riskScore, level, divergenceDetails } = metrics;
  const meta = ALERT_LEVEL_METRICS_META[level] || ALERT_LEVEL_METRICS_META.STANDARD;

  // Compute sub-formula values: (0.7*S + 0.3*D) and (1 + 0.3*V + 0.4*I)
  const baseWeight = Number((0.7 * S + 0.3 * D).toFixed(2));
  const multiplier = Number((1 + 0.3 * V + 0.4 * I).toFixed(2));

  if (mode === 'tooltip') {
    return (
      <div className="w-80 sm:w-96 p-3.5 rounded-xl border border-zinc-700 bg-zinc-950 text-white shadow-2xl space-y-2.5 text-xs select-text">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-1.5 font-black text-white">
            <Calculator className="w-3.5 h-3.5" />
            <span>Phân Rã Tham Số Risk_Score</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.badgeBg}`}>
            {meta.levelBadge} ({riskScore}đ)
          </span>
        </div>

        {/* Formula equation highlight */}
        <div className="p-2 rounded-lg font-mono text-[10.5px] leading-tight bg-zinc-900 text-white border border-zinc-700">
          <div>Risk_Score = min(100, (0.7·S + 0.3·D) × (1 + 0.3·V + 0.4·I))</div>
          <div className="mt-1 text-[9.5px] text-zinc-400 font-sans">
            = min(100, ({baseWeight}) × ({multiplier})) = <span className="font-bold text-white font-mono">{riskScore} điểm</span>
          </div>
        </div>

        {/* 4 Micro meters grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {/* S */}
          <div className="p-2 rounded-lg border bg-zinc-900 border-zinc-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-white">S (Severity):</span>
              <span className="font-mono font-bold text-white">{S}/50</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-white h-1.5 rounded-full" style={{ width: `${Math.min(100, (S / 50) * 100)}%` }} />
            </div>
            <span className="text-[9.5px] text-zinc-400 block mt-1">Mức nghiêm trọng thể chế</span>
          </div>

          {/* D */}
          <div className="p-2 rounded-lg border bg-zinc-900 border-zinc-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-zinc-200 flex items-center gap-1">
                <GitCompare className="w-2.5 h-2.5" />
                D (Divergence):
              </span>
              <span className="font-mono font-bold text-white">{D}/20</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-zinc-300 h-1.5 rounded-full" style={{ width: `${Math.min(100, (D / 20) * 100)}%` }} />
            </div>
            <span className="text-[9.5px] text-zinc-400 block mt-1">
              {D > 0 ? '⚠️ Có độ vênh chỉ đạo' : 'Thống nhất phát ngôn'}
            </span>
          </div>

          {/* V */}
          <div className="p-2 rounded-lg border bg-zinc-900 border-zinc-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-zinc-300">V (Velocity):</span>
              <span className="font-mono font-bold text-white">{V}</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-zinc-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, V * 100)}%` }} />
            </div>
            <span className="text-[9.5px] text-zinc-400 block mt-1">Gia tốc lan truyền</span>
          </div>

          {/* I */}
          <div className="p-2 rounded-lg border bg-zinc-900 border-zinc-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-zinc-300">I (Impact):</span>
              <span className="font-mono font-bold text-white">{I}</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-zinc-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, I * 100)}%` }} />
            </div>
            <span className="text-[9.5px] text-zinc-400 block mt-1">Quy mô ảnh hưởng XH</span>
          </div>
        </div>

        {/* Narrative-reality divergence callout if D > 0 */}
        {D > 0 && divergenceDetails && (
          <div className="p-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-200 text-[10.5px] flex items-start gap-1.5">
            <GitCompare className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
            <span className="line-clamp-2">{divergenceDetails}</span>
          </div>
        )}

        <div className="pt-1 flex items-center justify-between text-[10px] text-zinc-400">
          <span>Chuẩn Báo Cáo Chuyên Đề</span>
          <span className="font-semibold text-white">Bấm để mở rộng chi tiết ➔</span>
        </div>
      </div>
    );
  }

  // Card view mode (detailed accordion / card section)
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black p-4 sm:p-5 space-y-4 transition-all shadow-lg text-white">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-black uppercase tracking-wide text-white">
                Bảng Phân Rã 4 Tham Số Lượng Hóa Rủi Ro Khủng Hoảng
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                Tầng 3
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Chuẩn toán học định lượng rủi ro thể chế theo Báo Cáo Chuyên Đề ngành Tài chính
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-xl border font-mono font-black text-sm flex items-center gap-1.5 ${meta.badgeBg}`}>
            <span>{meta.levelBadge}</span>
            <span className="text-xs font-sans font-bold">({riskScore}/100đ)</span>
          </div>
          {onOpenFullModal && (
            <button
              onClick={onOpenFullModal}
              className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1"
            >
              <span>Chi tiết</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Formula Mathematical Banner */}
      <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950 font-mono text-xs text-zinc-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-bold text-[10px] border border-zinc-700">
              CÔNG THỨC TOÁN
            </span>
            <span className="text-xs sm:text-sm font-black text-white">
              Risk_Score = min(100, (0.7·S + 0.3·D) × (1 + 0.3·V + 0.4·I))
            </span>
          </div>
          <div className="text-[11px] font-sans text-zinc-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Thời hạn xử lý: <strong className="text-white">{meta.sla}</strong></span>
          </div>
        </div>

        {/* Step-by-step substitution */}
        <div className="mt-2.5 pt-2.5 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-400 text-[10px] block font-sans">1. Khối Lượng Trọng Số Thể Chế:</span>
            <span className="text-white font-bold">0.7·({S}) + 0.3·({D}) = {baseWeight}</span>
          </div>
          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-400 text-[10px] block font-sans">2. Hệ Số Khuếch Đại Lan Tỏa:</span>
            <span className="text-white font-bold">1 + 0.3·({V}) + 0.4·({I}) = {multiplier}</span>
          </div>
          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-400 text-[10px] block font-sans">3. Điểm Rủi Ro Tổng Hợp:</span>
            <span className="text-white font-black">{baseWeight} × {multiplier} ➔ {riskScore}/100đ</span>
          </div>
        </div>
      </div>

      {/* 4 Cards for Parameters S, D, V, I */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* PARAMETER S: SEVERITY */}
        <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                S (Severity)
              </span>
              <span className="font-mono font-black text-white text-sm">{S} <span className="text-[10px] text-zinc-500">/ 50</span></span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden my-1.5">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (S / 50) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Mức độ nghiêm trọng nội dung thể chế: Tổn hại uy tín lãnh đạo, quy kết trách nhiệm và thiệt hại kinh tế.
            </p>
          </div>
          <div className="text-[10px] font-semibold text-zinc-400 pt-1 border-t border-zinc-800 flex justify-between">
            <span>Khoảng chuẩn: [0, 50]</span>
            <span className={S >= 35 ? 'text-white font-bold' : 'text-zinc-300'}>
              {S >= 35 ? 'Nghiêm trọng cao' : S >= 20 ? 'Trung bình' : 'Mức thấp'}
            </span>
          </div>
        </div>

        {/* PARAMETER D: DIVERGENCE */}
        <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <GitCompare className="w-3.5 h-3.5" />
                D (Divergence)
              </span>
              <span className="font-mono font-black text-white text-sm">{D} <span className="text-[10px] text-zinc-500">/ 20</span></span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden my-1.5">
              <div
                className="bg-zinc-300 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (D / 20) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Độ vênh chỉ đạo và thực tế (Narrative-Reality): D=0 nếu thống nhất; D=20 nếu thực tế mâu thuẫn trực tiếp với phát ngôn.
            </p>
          </div>
          <div className="text-[10px] font-semibold text-zinc-400 pt-1 border-t border-zinc-800 flex justify-between">
            <span>Khoảng chuẩn: [0, 20]</span>
            <span className={D >= 15 ? 'text-white font-extrabold' : D > 0 ? 'text-zinc-200 font-bold' : 'text-zinc-400'}>
              {D >= 15 ? 'Vênh nghiêm trọng' : D > 0 ? 'Có độ vênh' : 'Đồng bộ'}
            </span>
          </div>
        </div>

        {/* PARAMETER V: VELOCITY */}
        <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                V (Velocity)
              </span>
              <span className="font-mono font-black text-white text-sm">{V} <span className="text-[10px] text-zinc-500">/ 1.0</span></span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden my-1.5">
              <div
                className="bg-zinc-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, V * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Hệ số vận tốc lan truyền tin tức: Tốc độ phát tán đa kênh (2h, 6h, 24h) và tương tác mạng xã hội.
            </p>
          </div>
          <div className="text-[10px] font-semibold text-zinc-400 pt-1 border-t border-zinc-800 flex justify-between">
            <span>Hệ số: [0.0, 1.0]</span>
            <span className={V >= 0.7 ? 'text-white font-bold' : 'text-zinc-300'}>
              {V >= 0.7 ? 'Bùng nổ (Spike)' : V >= 0.4 ? 'Lan tỏa nhanh' : 'Bình thường'}
            </span>
          </div>
        </div>

        {/* PARAMETER I: IMPACT */}
        <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                I (Impact)
              </span>
              <span className="font-mono font-black text-white text-sm">{I} <span className="text-[10px] text-zinc-500">/ 1.0</span></span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden my-1.5">
              <div
                className="bg-zinc-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, I * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Hệ số quy mô nhóm xã hội chịu tác động: I=0.2 (diện hẹp cá nhân/vụ việc); I=1.0 (5 triệu hộ KD / toàn thị trường vốn).
            </p>
          </div>
          <div className="text-[10px] font-semibold text-zinc-400 pt-1 border-t border-zinc-800 flex justify-between">
            <span>Hệ số: [0.0, 1.0]</span>
            <span className={I >= 0.8 ? 'text-white font-bold' : 'text-zinc-300'}>
              {I >= 0.8 ? 'Toàn dân / Thị trường' : I >= 0.5 ? 'Ngành / Hiệp hội' : 'Diện hẹp'}
            </span>
          </div>
        </div>
      </div>

      {/* Divergence alert banner if present */}
      {D > 0 && divergenceDetails && (
        <div className="p-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white flex items-start gap-2.5 text-xs">
          <GitCompare className="w-4 h-4 text-white shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold uppercase tracking-wider text-[11px] text-white block">
              Phát hiện độ vênh Narrative-Reality Divergence (D = {D}/20):
            </span>
            <p className="text-zinc-300 leading-relaxed">{divergenceDetails}</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Interactive trigger button for NewsCard / tables with hover tooltip & click expansion
 */
interface RiskScoreFormulaTriggerProps {
  metrics: QuantitativeRiskBreakdown;
  isDark?: boolean;
  onOpenDetails?: () => void;
  className?: string;
}

export const RiskScoreFormulaTrigger: React.FC<RiskScoreFormulaTriggerProps> = ({
  metrics,
  isDark = true,
  onOpenDetails,
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const meta = ALERT_LEVEL_METRICS_META[metrics.level] || ALERT_LEVEL_METRICS_META.STANDARD;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onOpenDetails) onOpenDetails();
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95 ${meta.badgeBg} ${className}`}
        title="Hover để xem phân rã tham số S, D, V, I hoặc Bấm để xem chi tiết đầy đủ"
      >
        <Calculator className="w-3.5 h-3.5" />
        <span>Risk:</span>
        <span className="font-black font-mono">{metrics.riskScore}</span>
        <span className="text-[10px] opacity-75">/100</span>
        {metrics.D > 0 && (
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" title="Có độ vênh chỉ đạo" />
        )}
      </button>

      {/* Floating Hover Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 left-0 sm:left-auto sm:right-0 mt-2 transform transition-opacity duration-150">
          <QuantitativeFormulaBreakdown
            metrics={metrics}
            mode="tooltip"
            isDark={isDark}
          />
        </div>
      )}
    </div>
  );
};
