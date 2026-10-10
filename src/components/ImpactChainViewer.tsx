import React, { useState } from 'react';
import { NegativeImpactChain, ImpactChainNode } from '../types';
import { useTheme } from '../lib/theme';
import {
  GitFork,
  ArrowRight,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Layers,
  Zap,
  TrendingDown,
  Building2,
  Network,
  Info
} from 'lucide-react';

interface ImpactChainViewerProps {
  impactChain: NegativeImpactChain;
  className?: string;
  onSelectSector?: (sector: string) => void;
}

export const ImpactChainViewer: React.FC<ImpactChainViewerProps> = ({
  impactChain,
  className = '',
  onSelectSector
}) => {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);
  const [selectedNodeIdx, setSelectedNodeIdx] = useState<number | null>(null);

  if (!impactChain || !impactChain.chainNodes || impactChain.chainNodes.length === 0) {
    return null;
  }

  const isCritical = impactChain.spilloverRiskLevel === 'CRITICAL';
  const isElevated = impactChain.spilloverRiskLevel === 'ELEVATED';

  const handleCopyReport = () => {
    const text = `⛓️ [CHUỖI TÁC ĐỘNG HỆ QUẢ LIÊN NGÀNH - BỘ TÀI CHÍNH]\n` +
      `📌 Vấn đề gốc rễ: ${impactChain.rootIssue}\n` +
      `🔄 Đường truyền dẫn rủi ro: ${impactChain.transmissionPathSummary}\n` +
      `⚠️ Cấp độ nguy cơ lan tỏa: ${impactChain.spilloverRiskLevel}\n\n` +
      `📊 CÁC NẤC TÁC ĐỘNG TRONG 16 LĨNH VỰC:\n` +
      impactChain.chainNodes.map(n => 
        ` [Cấp ${n.order} - ${n.level === 'DIRECT' ? 'Trực tiếp' : n.level === 'SECONDARY' ? 'Lan tỏa thứ cấp' : 'Tác động hệ thống'}] ${n.sectorNameVi}\n` +
        `  • Kênh truyền dẫn: ${n.mechanism}\n` +
        `  • Hệ quả cụ thể: ${n.consequence}\n` +
        `  • Biện pháp cắt chuỗi: ${n.preventiveMitigation}`
      ).join('\n\n') +
      `\n\n🛡️ KHUYẾN NGHỊ LÃNH ĐẠO KHOANH VÙNG & CẮT ĐỨT CHUỖI LÂY LAN:\n${impactChain.containmentRecommendation}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const getLevelBadge = (level: ImpactChainNode['level'], order: number) => {
    switch (level) {
      case 'DIRECT':
        return {
          label: `Cấp ${order}: Trực tiếp`,
          bg: isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-rose-100 text-rose-800 border-rose-300',
          dot: 'bg-rose-500'
        };
      case 'SECONDARY':
        return {
          label: `Cấp ${order}: Lan tỏa thứ cấp`,
          bg: isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300',
          dot: 'bg-amber-500'
        };
      case 'SYSTEMIC':
      default:
        return {
          label: `Cấp ${order}: Toàn diện / Vĩ mô`,
          bg: isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-purple-100 text-purple-800 border-purple-300',
          dot: 'bg-purple-500'
        };
    }
  };

  const getSeverityBadge = (severity: ImpactChainNode['severity']) => {
    switch (severity) {
      case 'HIGH':
        return {
          label: 'Tác động Mạnh',
          color: isDark ? 'text-rose-400 bg-rose-950/60 border-rose-800/60' : 'text-rose-700 bg-rose-50 border-rose-200'
        };
      case 'MEDIUM':
        return {
          label: 'Tác động Trung bình',
          color: isDark ? 'text-amber-400 bg-amber-950/60 border-amber-800/60' : 'text-amber-700 bg-amber-50 border-amber-200'
        };
      case 'LOW':
      default:
        return {
          label: 'Tác động Thấp',
          color: isDark ? 'text-sky-400 bg-sky-950/60 border-sky-800/60' : 'text-sky-700 bg-sky-50 border-sky-200'
        };
    }
  };

  return (
    <div className={`p-4.5 rounded-2xl border shadow-md space-y-4 transition-all ${
      isCritical
        ? isDark
          ? 'bg-gradient-to-br from-rose-950/50 via-slate-900 to-amber-950/30 border-rose-500/50'
          : 'bg-gradient-to-br from-rose-50/80 via-white to-amber-50/50 border-rose-300'
        : isDark
        ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/40'
        : 'bg-gradient-to-br from-amber-50/70 via-white to-slate-50 border-amber-200'
    } ${className}`}>
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b pb-3 dark:border-slate-800 border-slate-200">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl border ${
            isCritical
              ? isDark ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-rose-100 text-rose-800 border-rose-300'
              : isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}>
            <Network className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`text-xs font-black uppercase tracking-wider ${
                isCritical
                  ? isDark ? 'text-rose-300' : 'text-rose-900'
                  : isDark ? 'text-amber-300' : 'text-amber-900'
              }`}>
                Chuỗi Tác Động Hệ Quả Liên Ngành (Impact Chain)
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isCritical
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : isElevated
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
              }`}>
                {isCritical ? '🚨 NGUY CƠ LÂY LAN CAO' : isElevated ? '⚠️ NGUY CƠ LAN TỎA' : 'ℹ️ NGUY CƠ CỤC BỘ'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Suy luận tự động đường truyền dẫn rủi ro sang các lĩnh vực khác trong 16 lĩnh vực của BTC
            </p>
          </div>
        </div>

        <button
          onClick={handleCopyReport}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer shrink-0 ${
            copied
              ? 'bg-emerald-600 text-white border-emerald-500'
              : isDark
              ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700 shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
          }`}
          title="Sao chép toàn văn Chuỗi tác động & Khuyến nghị cắt mạch rủi ro"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Đã sao chép' : 'Sao chép Sơ đồ'}</span>
        </button>
      </div>

      {/* Transmission Flow Pipeline Visualizer */}
      <div className={`p-3 rounded-xl border ${
        isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-1.5 mb-2">
          <GitFork className="w-3.5 h-3.5 text-amber-400" />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
            Đường truyền dẫn rủi ro liên ngành:
          </span>
        </div>

        {/* Pipeline Badges with interactive hover */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {impactChain.chainNodes.map((node, idx) => {
            const levelInfo = getLevelBadge(node.level, node.order);
            const isSelected = selectedNodeIdx === idx;

            return (
              <React.Fragment key={idx}>
                <button
                  onClick={() => {
                    setSelectedNodeIdx(isSelected ? null : idx);
                    if (onSelectSector) onSelectSector(node.sector);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-amber-400 bg-amber-500/20 border-amber-400 text-amber-300'
                      : levelInfo.bg
                  }`}
                  title={`Bấm để xem chi tiết tác động tại ${node.sectorNameVi}`}
                >
                  <span className={`w-2 h-2 rounded-full ${levelInfo.dot} shrink-0`} />
                  <span>{node.sectorNameVi}</span>
                  <span className="text-[9px] opacity-75 font-mono">({node.level === 'DIRECT' ? 'Gốc' : `Nấc ${node.order}`})</span>
                </button>

                {idx < impactChain.chainNodes.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Grid of Nodes / Detailed Breakdown */}
      <div className="space-y-2.5">
        <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Chi tiết cơ chế lây lan & Giải pháp ngắt mạch từng lĩnh vực:
        </span>

        <div className="grid grid-cols-1 gap-2.5">
          {impactChain.chainNodes.map((node, idx) => {
            const levelInfo = getLevelBadge(node.level, node.order);
            const severityInfo = getSeverityBadge(node.severity);
            const isSelected = selectedNodeIdx === idx;

            return (
              <div
                key={idx}
                onClick={() => setSelectedNodeIdx(isSelected ? null : idx)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-slate-900 border-amber-400/80 ring-1 ring-amber-400/50 shadow-md'
                      : 'bg-amber-50/50 border-amber-400 ring-1 ring-amber-400/50 shadow-sm'
                    : isDark
                    ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Node Title & Tags */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b pb-2 mb-2 dark:border-slate-800/80 border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${levelInfo.bg}`}>
                      {levelInfo.label}
                    </span>
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {node.sectorNameVi}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${severityInfo.color}`}>
                    {severityInfo.label}
                  </span>
                </div>

                {/* Mechanism & Consequence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className={`p-2 rounded-lg border ${
                    isDark ? 'bg-slate-950/50 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200/80 text-slate-700'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase block mb-1 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                      ⚡ Kênh truyền dẫn / Cơ chế lây lan:
                    </span>
                    <p className="leading-relaxed">{node.mechanism}</p>
                  </div>

                  <div className={`p-2 rounded-lg border ${
                    isDark ? 'bg-slate-950/50 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200/80 text-slate-700'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase block mb-1 ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                      💥 Tác động / Thiệt hại cụ thể:
                    </span>
                    <p className="leading-relaxed">{node.consequence}</p>
                  </div>
                </div>

                {/* Preventive Mitigation */}
                <div className={`mt-2 p-2 rounded-lg border flex items-start gap-2 text-xs ${
                  isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold">Giải pháp cắt đứt chuỗi lây lan: </span>
                    <span>{node.preventiveMitigation}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leadership Containment Directive Recommendation */}
      <div className={`p-3 rounded-xl border ${
        isDark ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-200' : 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
      }`}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-indigo-300' : 'text-indigo-900'}`}>
            Tham mưu Lãnh đạo: Phương án Khoanh vùng & Cắt đứt Rủi ro Liên ngành
          </span>
        </div>
        <p className="text-xs leading-relaxed font-medium">
          {impactChain.containmentRecommendation}
        </p>
      </div>
    </div>
  );
};
