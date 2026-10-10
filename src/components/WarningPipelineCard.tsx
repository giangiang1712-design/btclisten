import React, { useState } from 'react';
import { ScrapedNewsItem, WarningPipelineModel, WarningAlertLevelType } from '../types';
import { generateWarningPipelineModel } from '../lib/warningPipelineEngine';
import { useTheme } from '../lib/theme';
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  Zap,
  ChevronDown,
  ChevronUp,
  Clock,
  Building2,
  CheckCircle2,
  Cpu,
  Flame,
  FileCheck2,
  Copy,
  Check,
  Handshake,
  Calculator,
  GitCompare,
  TrendingUp,
  Users
} from 'lucide-react';
import {
  QuantitativeFormulaBreakdown,
  RiskScoreFormulaTrigger
} from './QuantitativeFormulaBreakdown';

interface WarningPipelineCardProps {
  item: ScrapedNewsItem;
  onOpenFullModal?: () => void;
}

export const WarningPipelineCard: React.FC<WarningPipelineCardProps> = ({
  item,
  onOpenFullModal
}) => {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  // Tự động phân tích và sinh mô hình cảnh báo
  const model: WarningPipelineModel = item.warningPipeline || generateWarningPipelineModel(item);
  const formula = model.formulaMetrics || {
    S: 20,
    D: 0,
    V: 0.3,
    I: 0.5,
    rawRiskScore: model.level2Risk.riskScore,
    calculationFormula: `min(100, (0.7 × 20 + 0.3 × 0) × (1 + 0.3 × 0.3 + 0.4 × 0.5)) = ${model.level2Risk.riskScore}đ`
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(model.executiveBrief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAlertBadge = (level: WarningAlertLevelType | string) => {
    switch (level) {
      case 'EMERGENCY':
        return 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400';
      case 'RAPID':
        return 'bg-orange-600 text-white shadow-sm ring-1 ring-orange-400';
      case 'EARLY':
        return 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400';
      case 'DISTANT':
        return 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400';
      case 'MARKET_DIGEST':
        return 'bg-slate-500 text-white';
      case 'STANDARD':
      default:
        return 'bg-slate-600 text-white';
    }
  };

  const baseWeight = (0.7 * formula.S + 0.3 * formula.D).toFixed(1);
  const multiplier = (1 + 0.3 * formula.V + 0.4 * formula.I).toFixed(2);

  return (
    <div className={`rounded-2xl border transition-all ${
      isDark ? 'bg-slate-950/70 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Top Banner */}
      <div className="p-3.5 sm:p-4.5 flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase flex items-center gap-1 ${getAlertBadge(model.level3Action.alertLevel)}`}>
              {model.level3Action.alertLevel === 'EMERGENCY' && <Flame className="w-3 h-3 animate-pulse" />}
              {model.level3Action.alertLevel === 'RAPID' && <Zap className="w-3 h-3" />}
              {model.level3Action.alertLevel === 'EARLY' && <AlertTriangle className="w-3 h-3" />}
              {model.level3Action.alertLevel === 'DISTANT' && <Activity className="w-3 h-3" />}
              <span>{model.level3Action.alertLevelBadge}</span>
            </span>

            <RiskScoreFormulaTrigger
              metrics={{
                S: formula.S,
                D: formula.D,
                V: formula.V,
                I: formula.I,
                riskScore: model.level2Risk.riskScore,
                level: (model.level3Action.alertLevel === 'MARKET_DIGEST' ? 'STANDARD' : model.level3Action.alertLevel) as any,
                levelLabel: model.level3Action.alertLevelLabelVi,
                divergenceDetails: model.standardizedJsonOutput?.tier_2_crisis_risk?.divergence_details,
              }}
              isDark={isDark}
              onOpenDetails={() => setShowFormulaDetails((prev) => !prev)}
            />

            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{model.level3Action.urgencyTiming}</span>
            </span>

            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              <span>Chủ trì: <strong>{model.level3Action.leadUnit}</strong></span>
            </span>

            {model.level3Action.cooperatingUnits && model.level3Action.cooperatingUnits.length > 0 && (
              <span className="text-[11px] font-semibold text-cyan-400/90 hidden sm:flex items-center gap-1">
                <Handshake className="w-3 h-3" />
                <span>Phối hợp: {model.level3Action.cooperatingUnits.slice(0, 2).join(', ')}</span>
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm font-medium text-slate-300 dark:text-slate-200 line-clamp-2 leading-relaxed">
            {model.executiveBrief}
          </p>

          {/* Automated Pipeline Strip */}
          <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5 overflow-x-auto flex-wrap">
            <div className="flex items-center gap-1 text-emerald-500 font-bold shrink-0">
              <Cpu className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Quy trình 7 bước (Signal ➔ Alert)</span>
            </div>
            <span>•</span>
            <span>Tầng 1 Sắc thái: <strong className="text-indigo-400">{model.level1Sentiment.sentimentDirection}</strong></span>
            <span>•</span>
            <span>Tầng 2 Rủi ro thể chế: <strong className="text-amber-400">{model.level2Risk.crisisPotential}</strong></span>
            <span>•</span>
            <button
              onClick={() => setShowFormulaDetails(!showFormulaDetails)}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer transition underline decoration-dotted"
            >
              <Calculator className="w-3 h-3" />
              <span>Phân rã S-D-V-I</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopy}
            className={`p-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
            title="Sao chép tóm tắt chỉ đạo"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          {onOpenFullModal && (
            <button
              onClick={onOpenFullModal}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              }`}
            >
              <span>Xem toàn diện</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 border-slate-300'
            }`}
            title={isExpanded ? 'Thu gọn' : 'Mở rộng kế hoạch'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* PARAMETER DECOMPOSITION GRID (S, D, V, I) */}
      {showFormulaDetails && (
        <div className={`border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-3 ${
          isDark ? 'bg-slate-900/60' : 'bg-slate-50'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-black uppercase text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" />
              Bảng Phân Rã 4 Tham Số Lượng Hóa Rủi Ro Khủng Hoảng
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Risk_Score = min(100, (0.7·S + 0.3·D) × (1 + 0.3·V + 0.4·I))
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* S: Severity */}
            <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold">S (Severity):</span>
                <span className="font-mono font-black text-emerald-400">{formula.S}/50</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, (formula.S / 50) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Nghiêm trọng thể chế & tổn hại uy tín
              </p>
            </div>

            {/* D: Divergence */}
            <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold flex items-center gap-1">
                  <GitCompare className="w-3 h-3 text-rose-400" />
                  D (Divergence):
                </span>
                <span className="font-mono font-black text-rose-400">{formula.D}/20</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-rose-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, (formula.D / 20) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Độ vênh chỉ đạo và thực tế
              </p>
            </div>

            {/* V: Velocity */}
            <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-sky-400" />
                  V (Velocity):
                </span>
                <span className="font-mono font-black text-sky-400">{formula.V}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-sky-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, formula.V * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Vận tốc lan truyền đa nền tảng
              </p>
            </div>

            {/* I: Impact */}
            <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold flex items-center gap-1">
                  <Users className="w-3 h-3 text-purple-400" />
                  I (Impact):
                </span>
                <span className="font-mono font-black text-purple-400">{formula.I}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-purple-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, formula.I * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Quy mô nhóm xã hội chịu tác động
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-black/20 dark:bg-black/40 text-[11px] font-mono text-slate-300 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span>Trọng số cơ sở = (0.7 × {formula.S} + 0.3 × {formula.D}) = <strong>{baseWeight}</strong></span>
              <span className="mx-2">×</span>
              <span>Hệ số nhân = (1 + 0.3 × {formula.V} + 0.4 × {formula.I}) = <strong>{multiplier}</strong></span>
            </div>
            <div className="text-amber-400 font-bold">
              ➔ Điểm Risk_Score = {model.level2Risk.riskScore}đ ({model.level3Action.alertLevelBadge})
            </div>
          </div>
        </div>
      )}

      {/* Expanded Quick Action Overview */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Sắc thái & Rủi ro */}
            <div className={`p-3 rounded-xl border space-y-2 ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="font-bold text-indigo-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>Bóc tách Sắc thái & Nguy cơ Thể chế</span>
              </div>
              <p className="text-slate-300 dark:text-slate-300 leading-relaxed text-[11px]">
                {model.level1Sentiment.summaryExplanation}
              </p>
              <div className="pt-1 text-[11px] text-slate-400 space-y-0.5">
                <div>• Tổn hại uy tín: <strong className="text-slate-200">{model.level2Risk.criteria.reputationDamage.score}%</strong></div>
                <div>• Quy kết trách nhiệm: <strong className="text-slate-200">{model.level2Risk.criteria.blameAttribution.score}%</strong></div>
                <div>• Kiến nghị thể chế: <strong className="text-slate-200">{model.level2Risk.criteria.policyPetitions.score}%</strong></div>
                <div>• Xâm hại quyền lợi DN/NĐT: <strong className="text-slate-200">{model.level2Risk.criteria.investorBizImpact.score}%</strong></div>
              </div>
            </div>

            {/* Kế hoạch Tác chiến */}
            <div className={`p-3 rounded-xl border space-y-2 ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Quy trình SOP Tác chiến ({model.level3Action.alertLevel})</span>
              </div>
              {model.level3Action.actionPlaybook[0] && (
                <div className="space-y-1">
                  <span className="font-semibold text-slate-200 text-[11px]">{model.level3Action.actionPlaybook[0].phase}:</span>
                  <ul className="pl-4 list-disc space-y-0.5 text-slate-300 text-[11px]">
                    {model.level3Action.actionPlaybook[0].actions.slice(0, 3).map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
              {model.level3Action.contingencyScenario && (
                <div className="pt-1 text-[10px] text-amber-400/90 italic">
                  Kịch bản dự phòng: {model.level3Action.contingencyScenario}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
