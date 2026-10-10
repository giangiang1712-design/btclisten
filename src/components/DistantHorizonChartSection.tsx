import React, { useState, useMemo } from 'react';
import {
  Compass,
  AlertTriangle,
  ChevronRight,
  FileCheck2,
  Info,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  BarChart2,
} from 'lucide-react';
import { ScrapedNewsItem } from '../types';

interface DistantHorizonChartSectionProps {
  articles: ScrapedNewsItem[];
  onOpenDossierModal: () => void;
  onSelectArticle: (article: ScrapedNewsItem) => void;
  isDark?: boolean;
}

interface PolicyCluster {
  sector: string;
  items: ScrapedNewsItem[];
  averageRiskScore: number;
  maxRiskScore: number;
  gapTypes: string[];
  primaryGapText: string;
  recommendedSop: string;
  alertCount: number;
}

export const DistantHorizonChartSection: React.FC<DistantHorizonChartSectionProps> = ({
  articles,
  onOpenDossierModal,
  onSelectArticle,
}) => {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  // Filter out pure routine market digests
  const validArticles = useMemo(() => {
    return articles.filter((item) => !item.isMarketDigest);
  }, [articles]);

  // Aggregate into Policy Clusters
  const clusters = useMemo<PolicyCluster[]>(() => {
    const map: Record<string, ScrapedNewsItem[]> = {};

    validArticles.forEach((item) => {
      const score = item.warningPipeline?.level2Risk?.riskScore ?? item.riskScore ?? 0;
      const alertLevel = item.warningPipeline?.level3Action?.alertLevel;

      // Cần Lưu Tâm & Dự Báo Sớm: Cấp 1 hợp nhất
      const isEarlyOrGap =
        alertLevel === 'EARLY' ||
        alertLevel === 'DISTANT' ||
        Boolean(item.informationVacuum?.hasGap) ||
        (score >= 40 && score < 60) ||
        (score >= 20 && score < 40 && item.informationVacuum?.isAlertWarranted);

      if (isEarlyOrGap) {
        const sec = item.sectorNameVi || item.sector || 'Tài chính - Ngân sách';
        if (!map[sec]) map[sec] = [];
        map[sec].push(item);
      }
    });

    const result: PolicyCluster[] = Object.entries(map).map(([sector, items]) => {
      const scores = items.map((i) => i.warningPipeline?.level2Risk?.riskScore || i.riskScore || 25);
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));
      const maxScore = Math.max(...scores, 20);

      const gapItem = items.find((i) => i.informationVacuum?.gapDetails);
      const primaryGapText =
        gapItem?.informationVacuum?.gapDetails ||
        'Đang có băn khoăn về quy trình thực thi chính sách mới, cần hướng dẫn nghiệp vụ rõ ràng.';

      const recommendedSop =
        gapItem?.informationVacuum?.recommendedClosureAction ||
        'Lập bộ Hỏi - Đáp (Internal Q&A) và chuẩn bị bài giải thích cho báo chí.';

      const gapTypes = Array.from(
        new Set(
          items
            .map((i) => i.informationVacuum?.gapLevel)
            .filter(Boolean) as string[]
        )
      );

      return {
        sector,
        items,
        averageRiskScore: avgScore,
        maxRiskScore: maxScore,
        gapTypes,
        primaryGapText,
        recommendedSop,
        alertCount: items.length,
      };
    });

    return result.sort((a, b) => b.maxRiskScore - a.maxRiskScore);
  }, [validArticles]);

  const totalDistantHorizonCount = useMemo(() => {
    return clusters.reduce((sum, c) => sum + c.alertCount, 0);
  }, [clusters]);

  const activeClusterDetails = useMemo(() => {
    if (!selectedSector) return clusters[0] || null;
    return clusters.find((c) => c.sector === selectedSector) || clusters[0] || null;
  }, [selectedSector, clusters]);

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-slate-300 bg-white transition-all text-slate-900 shadow-sm">
      {/* Component Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-slate-800" />
              <span>Cần Lưu Tâm & Dự Báo Sớm — Quản Lý Khoảng Trống Thông Tin</span>
            </span>
            <span className="text-xs font-mono text-slate-600 font-bold">
              [{totalDistantHorizonCount} vấn đề]
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span>Ma Trận Khoảng Trống Thông Tin & Đề Xuất Giải Quyết Theo Lĩnh Vực</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Nhận diện vấn đề người dân, DN quan tâm nhưng chưa được giải thích đầy đủ ➔ Cảnh báo làm rõ thủ tục, phí, thời gian ➔ Đề xuất tin bài, tọa đàm để lấp khoảng trống.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenDossierModal}
            className="px-4 py-2 rounded-xl text-xs font-black bg-slate-900 hover:bg-black text-white transition cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Lập Dossier Cảnh Báo ({totalDistantHorizonCount})</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Horizontal Bar Chart List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-between px-1">
            <span>Phân Cụm Lĩnh Vực Chính Sách</span>
            <span>Mức Độ Rủi Ro Thể Chế [0-100]</span>
          </div>

          {clusters.map((cluster) => {
            const isSelected = activeClusterDetails?.sector === cluster.sector;
            const score = cluster.maxRiskScore;
            const barColor = score >= 60 ? 'bg-slate-900' : 'bg-slate-600';
            const badgeBg = 'bg-slate-100 text-slate-900 border-slate-300 font-bold';

            return (
              <div
                key={cluster.sector}
                onClick={() => setSelectedSector(cluster.sector)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'bg-slate-100 border-slate-900 shadow-sm ring-1 ring-slate-900'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-slate-900">
                    <span className="w-2 h-2 rounded-full bg-slate-900" />
                    <span>{cluster.sector}</span>
                    <span className="text-xs font-bold text-slate-500 font-mono">
                      ({cluster.alertCount} bài)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border font-mono ${badgeBg}`}>
                      Risk {score}/100
                    </span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'rotate-90 text-slate-900' : ''}`} />
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 mb-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.max(score, 12)}%` }}
                  />
                </div>

                <div className="text-xs text-slate-600 line-clamp-1 italic font-medium">
                  "{cluster.primaryGapText}"
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Cluster Deep Dive Card */}
        <div className="lg:col-span-5">
          {activeClusterDetails ? (
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-300 bg-slate-50 h-full flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Chi Tiết Cụm Rủi Ro
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {activeClusterDetails.sector}
                    </h3>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-200 text-slate-900 border border-slate-300 font-mono">
                    {activeClusterDetails.alertCount} vụ việc
                  </span>
                </div>

                {/* Information Vacuum Card */}
                <div className="mt-3 p-3.5 rounded-xl bg-white border border-slate-300 text-xs space-y-1.5 shadow-2xs">
                  <div className="font-black text-slate-900 flex items-center gap-1.5">
                    <Info className="w-4 h-4 shrink-0 text-slate-800" />
                    <span>Khoảng Trống Thông Tin Phát Hiện:</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-serif text-[12.5px] font-medium">
                    {activeClusterDetails.primaryGapText}
                  </p>
                </div>

                {/* Immediate SOP Action */}
                <div className="mt-3 p-3.5 rounded-xl bg-white border border-slate-300 text-xs space-y-1 shadow-2xs">
                  <div className="font-black text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-slate-800" />
                    <span>Văn Bản / SOP Cần Làm Ngay:</span>
                  </div>
                  <p className="text-slate-800 font-bold text-[12px]">
                    {activeClusterDetails.recommendedSop}
                  </p>
                </div>

                {/* List of articles */}
                <div className="mt-4 space-y-2">
                  <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    Các Bài Báo Phản Ánh ({activeClusterDetails.items.length})
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeClusterDetails.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onSelectArticle(item)}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white transition-all cursor-pointer flex items-start justify-between gap-2 hover:border-slate-400 shadow-2xs"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-extrabold text-slate-900 line-clamp-2 hover:underline">
                            {item.title}
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-2">
                            <span>{item.source}</span>
                            <span>•</span>
                            <span>{item.timeAgo}</span>
                          </div>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  Tự động cập nhật từ 30 nguồn báo chí
                </span>
                <button
                  onClick={onOpenDossierModal}
                  className="px-3 py-1.5 rounded-lg text-xs font-black text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Tổng hợp Dossier Tờ Trình</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
