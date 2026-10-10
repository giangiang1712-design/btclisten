import React, { useMemo, useState } from 'react';
import {
  Zap,
  Flame,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Send,
  Building2,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Eye,
  Filter,
  FileCheck,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { ScrapedNewsItem, WarningPipelineModel, LoughranMcDonaldSentimentAnalysis, WarningAlertLevelType } from '../types';
import { useTheme } from '../lib/theme';
import { isRiskArticle, evaluateLoughranMcDonaldSentiment } from '../lib/newsClassification';
import { generateWarningPipelineModel } from '../lib/warningPipelineEngine';

export type AlertLevelFilter = 'all' | 'EMERGENCY' | 'RAPID' | 'EARLY' | 'DISTANT' | 'DIVERGENCE';

interface ExecutiveImpactSnapshotBannerProps {
  news: ScrapedNewsItem[];
  onSelectArticle: (article: ScrapedNewsItem) => void;
  onDraftStatement: (article: ScrapedNewsItem) => void;
  onOpenWarningPipeline?: (article: ScrapedNewsItem) => void;
}

export const ExecutiveImpactSnapshotBanner: React.FC<ExecutiveImpactSnapshotBannerProps> = ({
  news,
  onSelectArticle,
  onDraftStatement,
  onOpenWarningPipeline,
}) => {
  const { isDark } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');
  const [levelFilter, setLevelFilter] = useState<AlertLevelFilter>('all');
  const [institutionalOnly, setInstitutionalOnly] = useState<boolean>(true);
  const [expandedSopId, setExpandedSopId] = useState<string | null>(null);

  // Gắn mô hình cảnh báo 4 cấp độ và sắc thái chuyên ngành tài chính cho từng tin bài
  const processedArticles = useMemo(() => {
    if (!news || news.length === 0) return [];

    const hotList = news.filter((item) => {
      const isHighLevel = item.impactLevel === 'high';
      const isEmerg = Boolean(item.isEmergency);
      const isUrg = Boolean(item.isUrgent);
      const isHighImpactScore = (item.impactScore || 0) >= 75;
      const isHighRisk = isRiskArticle(item);
      const isHighBuzz = (item.buzzScore || 0) >= 80;

      return isHighLevel || isEmerg || isUrg || isHighImpactScore || (isHighRisk && isHighBuzz);
    });

    return hotList.map((item) => {
      const model: WarningPipelineModel = item.warningPipeline || generateWarningPipelineModel(item);
      const loughran: LoughranMcDonaldSentimentAnalysis = item.loughranSentiment || evaluateLoughranMcDonaldSentiment(item);
      const riskScore = Number(model.level2Risk.riskScore || item.riskScore || 0);
      let alertLevel: WarningAlertLevelType = 'STANDARD';
      if (riskScore >= 75 || item.isEmergency) alertLevel = 'EMERGENCY';
      else if (riskScore >= 60) alertLevel = 'RAPID';
      else if (riskScore >= 40) alertLevel = 'EARLY';
      else if (riskScore >= 20) alertLevel = 'DISTANT';
      else alertLevel = 'STANDARD';

      const urgency = model.level3Action.urgencyTiming;
      const sentimentDirection = model.level1Sentiment.sentimentDirection;
      const sentimentNuance = model.level1Sentiment.criteria?.sentimentNuance || '';
      const hasDivergence = Boolean(
        (model.formulaMetrics && model.formulaMetrics.D >= 10) ||
        model.narrativeDivergence?.detected ||
        (model.level2Risk.overallRiskSummary || '').toLowerCase().includes('độ vênh')
      );
      const isRoutineEnforcement = Boolean(
        (model.formulaMetrics && model.formulaMetrics.S <= 8 && model.formulaMetrics.D === 0) ||
        riskScore < 20
      );

      return {
        article: item,
        model,
        loughran,
        alertLevel,
        urgency,
        riskScore,
        sentimentDirection,
        sentimentNuance,
        hasDivergence,
        isRoutineEnforcement,
      };
    }).sort((a, b) => {
      // Ưu tiên theo điểm rủi ro và tình trạng khẩn cấp
      const scoreA = (a.article.isEmergency ? 100 : 0) + a.riskScore;
      const scoreB = (b.article.isEmergency ? 100 : 0) + b.riskScore;
      return scoreB - scoreA;
    });
  }, [news]);

  // Danh sách đã lọc theo chế độ Chỉ Rủi Ro Thể Chế (loại trừ các tin xử lý sự vụ cá lẻ)
  const effectiveArticles = useMemo(() => {
    if (!institutionalOnly) return processedArticles;
    return processedArticles.filter((x) => !x.isRoutineEnforcement);
  }, [processedArticles, institutionalOnly]);

  // Đếm số lượng theo 4 cấp độ cảnh báo chính thức và độ vênh
  const counts = useMemo(() => {
    return {
      all: effectiveArticles.length,
      EMERGENCY: effectiveArticles.filter((x) => x.alertLevel === 'EMERGENCY').length,
      RAPID: effectiveArticles.filter((x) => x.alertLevel === 'RAPID').length,
      EARLY: effectiveArticles.filter((x) => x.alertLevel === 'EARLY').length,
      DISTANT: effectiveArticles.filter((x) => x.alertLevel === 'DISTANT').length,
      DIVERGENCE: effectiveArticles.filter((x) => x.hasDivergence).length,
    };
  }, [effectiveArticles]);

  // Lọc theo cấp độ người dùng lựa chọn
  const filteredArticles = useMemo(() => {
    if (levelFilter === 'all') return effectiveArticles.slice(0, 6);
    if (levelFilter === 'DIVERGENCE') return effectiveArticles.filter((x) => x.hasDivergence).slice(0, 6);
    return effectiveArticles.filter((x) => x.alertLevel === levelFilter).slice(0, 6);
  }, [effectiveArticles, levelFilter]);

  if (processedArticles.length === 0) {
    return null;
  }

  const getAlertBadgeConfig = (level: string) => {
    switch (level) {
      case 'EMERGENCY':
        return {
          title: 'Cấp 4: Khẩn cấp (SOP 2-4h)',
          badgeClass: 'bg-rose-600 text-white border-rose-700 animate-pulse',
          borderClass: isDark ? 'border-rose-700/60 bg-rose-950/20' : 'border-rose-300 bg-rose-50/70',
          accentColor: 'text-rose-600 dark:text-rose-400',
        };
      case 'RAPID':
        return {
          title: 'Cấp 3: Nhanh (Trong ngày)',
          badgeClass: 'bg-amber-500 text-slate-950 font-black border-amber-600',
          borderClass: isDark ? 'border-amber-700/60 bg-amber-950/20' : 'border-amber-200 bg-amber-50/70',
          accentColor: 'text-amber-600 dark:text-amber-400',
        };
      case 'EARLY':
        return {
          title: 'Cấp 2: Sớm (24h - Trọng tâm)',
          badgeClass: 'bg-blue-600 text-white border-blue-700 font-black',
          borderClass: isDark ? 'border-blue-700/60 bg-blue-950/20' : 'border-blue-200 bg-blue-50/70',
          accentColor: 'text-blue-600 dark:text-blue-400',
        };
      case 'DISTANT':
      default:
        return {
          title: 'Cấp 1: Cảnh báo xa',
          badgeClass: isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300',
          borderClass: isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-slate-50/50',
          accentColor: 'text-slate-500 dark:text-slate-400',
        };
    }
  };

  return (
    <div
      id="executive-impact-snapshot-banner"
      className={`rounded-2xl border transition-all overflow-hidden ${
        isDark
          ? 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/30 border-rose-800/50 shadow-md'
          : 'bg-gradient-to-r from-rose-50/90 via-amber-50/40 to-orange-50/60 border-rose-200 shadow-xs'
      }`}
    >
      {/* Header của Impact Snapshot Banner */}
      <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200/60 dark:border-rose-900/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-600 text-white shadow-xs shrink-0 flex items-center justify-center">
            <Zap className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3" />
                <span>Tin Nóng & Cảnh Báo Trọng Tâm</span>
              </span>
              <h3 className={`text-sm sm:text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                Thông Báo Tóm Tắt Tác Động (Impact Snapshot)
              </h3>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full font-mono border ${
                isDark ? 'bg-rose-900/40 text-rose-300 border-rose-700/50' : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}>
                {processedArticles.length} vấn đề cần lưu ý
              </span>
            </div>
            <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? 'text-rose-200/80' : 'text-rose-900'}`}>
              Phát hiện nguy cơ thể chế & độ vênh chỉ đạo thực tiễn — Kèm kịch bản tác chiến (SOP) và thời hạn hoàn tất cụ thể.
            </p>
          </div>
        </div>

        {/* Thanh công cụ: Chuyển đổi dạng xem & Ẩn/Hiện */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <div className="flex items-center p-0.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-white/60 dark:bg-slate-900/60 text-xs">
            <button
              type="button"
              onClick={() => {
                setViewMode('cards');
                setIsCollapsed(false);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                viewMode === 'cards' && !isCollapsed
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Thẻ chi tiết
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('compact');
                setIsCollapsed(false);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                viewMode === 'compact' && !isCollapsed
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dòng tinh gọn
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isDark
                ? 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
            title={isCollapsed ? 'Mở rộng bảng tóm tắt tác động' : 'Thu gọn bảng'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bộ lọc 4 Cấp Độ Cảnh Báo Chuẩn (Ma Trận 4 Cấp Độ PDF 1) */}
      {!isCollapsed && (
        <div className="px-3.5 sm:px-4 py-2 border-b border-rose-200/40 dark:border-rose-900/30 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3 h-3" />
            <span>Phân cấp cảnh báo:</span>
          </span>

          <button
            type="button"
            onClick={() => setLevelFilter('all')}
            className={`px-2 py-0.8 rounded-lg font-bold text-[11px] transition cursor-pointer shrink-0 ${
              levelFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Tất cả ({counts.all})
          </button>

          {counts.EMERGENCY > 0 && (
            <button
              type="button"
              onClick={() => setLevelFilter('EMERGENCY')}
              className={`px-2 py-0.8 rounded-lg font-bold text-[11px] transition cursor-pointer shrink-0 flex items-center gap-1 ${
                levelFilter === 'EMERGENCY'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 hover:bg-rose-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Cấp 4: Khẩn cấp ({counts.EMERGENCY})</span>
            </button>
          )}

          {counts.RAPID > 0 && (
            <button
              type="button"
              onClick={() => setLevelFilter('RAPID')}
              className={`px-2 py-0.8 rounded-lg font-bold text-[11px] transition cursor-pointer shrink-0 ${
                levelFilter === 'RAPID'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                  : 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 hover:bg-amber-200'
              }`}
            >
              <span>Cấp 3: Nhanh ({counts.RAPID})</span>
            </button>
          )}

          {counts.EARLY > 0 && (
            <button
              type="button"
              onClick={() => setLevelFilter('EARLY')}
              className={`px-2 py-0.8 rounded-lg font-bold text-[11px] transition cursor-pointer shrink-0 flex items-center gap-1 ${
                levelFilter === 'EARLY'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300 hover:bg-blue-200'
              }`}
            >
              <span>★ Cấp 2: Sớm (24h) ({counts.EARLY})</span>
            </button>
          )}

          {counts.DISTANT > 0 && (
            <button
              type="button"
              onClick={() => setLevelFilter('DISTANT')}
              className={`px-2 py-0.8 rounded-lg font-bold text-[11px] transition cursor-pointer shrink-0 ${
                levelFilter === 'DISTANT'
                  ? 'bg-slate-700 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <span>Cấp 1: Xa ({counts.DISTANT})</span>
            </button>
          )}

          {counts.DIVERGENCE > 0 && (
            <button
              type="button"
              onClick={() => setLevelFilter('DIVERGENCE')}
              className={`px-2 py-0.8 rounded-lg font-bold text-[11px] transition cursor-pointer shrink-0 flex items-center gap-1 ${
                levelFilter === 'DIVERGENCE'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 hover:bg-amber-200'
              }`}
            >
              <span>⚡ Độ vênh ({counts.DIVERGENCE})</span>
            </button>
          )}

          <div className="ml-auto shrink-0 flex items-center gap-1.5 pl-2">
            <button
              type="button"
              onClick={() => setInstitutionalOnly(!institutionalOnly)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                institutionalOnly
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                  : isDark ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
              title="Lọc bỏ tin vi phạm cá lẻ/sự vụ thường quy, chỉ tập trung vào rủi ro thể chế & chính sách theo Báo cáo chuyên đề"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{institutionalOnly ? 'Chỉ rủi ro thể chế' : 'Hiển thị tất cả (cả sự vụ)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Nội dung Tóm Tắt Tác Động */}
      {!isCollapsed && (
        <div className="p-3.5 sm:p-4">
          {viewMode === 'cards' ? (
            /* Chế độ Grid Cards: Đầy đủ tóm tắt tác động vĩ mô */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredArticles.map(({ article, model, loughran, alertLevel, urgency, riskScore, sentimentNuance, hasDivergence }, idx) => {
                const badgeCfg = getAlertBadgeConfig(alertLevel);
                const leadUnit = model.level3Action.leadUnit || article.executiveDirective?.whereEntity || article.sectorNameVi || 'Bộ Tài chính';
                
                // Trích xuất tóm tắt tác động kinh tế không dùng thuật ngữ AI
                const quickImpact = article.tldrKeyImpact || 
                  article.marketImplication || 
                  (article.sixW?.reaction ? `Phản ứng thị trường: ${article.sixW.reaction}` : '') ||
                  article.summary;

                const isExpanded = expandedSopId === (article.id || String(idx));
                const sopActions = model.level3Action.actionPlaybook || [];

                return (
                  <div
                    key={article.id || idx}
                    className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all hover:shadow-sm ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-800 hover:border-rose-500/50'
                        : 'bg-white/95 border-rose-200/90 hover:border-rose-300'
                    }`}
                  >
                    <div>
                      {/* Huy hiệu Cấp Độ Cảnh Báo & Nguồn */}
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase border ${badgeCfg.badgeClass}`}>
                            {badgeCfg.title}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {article.sectorNameVi || article.sector}
                          </span>
                          {hasDivergence && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              ⚡ Độ vênh chỉ đạo
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                          <span className="font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[85px]">
                            {article.source}
                          </span>
                          {article.timeAgo && <span>• {article.timeAgo}</span>}
                        </div>
                      </div>

                      {/* Tiêu đề bài viết */}
                      <h4
                        onClick={() => onSelectArticle(article)}
                        className={`text-xs sm:text-sm font-bold leading-snug cursor-pointer hover:underline mb-2 ${
                          isDark ? 'text-slate-100' : 'text-slate-950'
                        }`}
                        title="Bấm để xem chi tiết bài viết"
                      >
                        {article.title}
                      </h4>

                      {/* Khối Sắc Thái Tài Chính Chuyên Ngành (Loughran-McDonald PDF) */}
                      <div className="text-[11px] mb-2 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded font-mono ${
                            loughran.scoreS > 0
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                              : loughran.scoreS < 0
                              ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            S={loughran.scoreS > 0 ? `+${loughran.scoreS}` : loughran.scoreS}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate text-[11px]">
                            {sentimentNuance || loughran.scoreLabel || 'Sắc thái chuyên ngành'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-mono shrink-0">
                          <span className="text-slate-400">E={loughran.targetEntity?.weightE || 3}</span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400">Rủi ro {riskScore}/100</span>
                        </div>
                      </div>

                      {/* Khối Tóm tắt Tác động (Impact Snapshot) - Điểm trọng tâm lãnh đạo cần đọc ngay */}
                      <div className={`p-2.5 rounded-lg border text-xs leading-relaxed mb-2.5 ${
                        isDark
                          ? 'bg-rose-950/30 border-rose-900/50 text-rose-200/90'
                          : 'bg-rose-50/70 border-rose-200 text-rose-950'
                      }`}>
                        <div className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 text-[11px] mb-1">
                          <Zap className="w-3 h-3 shrink-0" />
                          <span>Tác động nhanh (Impact Snapshot):</span>
                        </div>
                        <p className="line-clamp-3">
                          {quickImpact}
                        </p>
                      </div>

                      {/* Đơn vị chịu trách nhiệm / thời hạn tác chiến */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                        <div className="flex items-center gap-1 truncate max-w-[65%]">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{leadUnit}</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono font-bold text-amber-600 dark:text-amber-400">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{urgency}</span>
                        </div>
                      </div>

                      {/* Inline SOP Preview: Xem nhanh 3 bước tác chiến */}
                      {isExpanded && sopActions.length > 0 && (
                        <div className="mb-2.5 p-2.5 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 text-xs animate-fadeIn">
                          <div className="font-bold text-blue-700 dark:text-blue-300 text-[11px] mb-1.5 flex items-center justify-between">
                            <span>Kịch bản tác chiến (SOP {urgency}):</span>
                            <span className="text-[10px] text-blue-500">Hoàn tất trong thời hạn</span>
                          </div>
                          <div className="space-y-1.5">
                            {sopActions.map((step, sIdx) => (
                              <div key={sIdx} className="text-[11px]">
                                <span className="font-bold text-slate-700 dark:text-slate-300">{step.phase}:</span>
                                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 mt-0.5 space-y-0.5 pl-1">
                                  {step.actions.slice(0, 2).map((act, aIdx) => (
                                    <li key={aIdx} className="line-clamp-1">{act}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Thao tác tức thì: Kịch bản SOP & Soạn chỉ đạo */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setExpandedSopId(isExpanded ? null : (article.id || String(idx)))}
                          className="px-2 py-1 rounded text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer flex items-center gap-0.5"
                          title="Xem các bước xử lý nhanh của bài viết này"
                        >
                          <span>SOP</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {onOpenWarningPipeline && (
                          <button
                            type="button"
                            onClick={() => onOpenWarningPipeline(article)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200 dark:border-blue-900 cursor-pointer"
                            title="Mở hồ sơ cảnh báo và phương án tác chiến toàn diện"
                          >
                            <ShieldAlert className="w-3 h-3" />
                            <span>Kịch bản đầy đủ</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onDraftStatement(article)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs ${
                          isDark
                            ? 'bg-rose-600 hover:bg-rose-500 text-white'
                            : 'bg-rose-600 hover:bg-rose-700 text-white'
                        }`}
                        title="Soạn văn bản chỉ đạo hoặc thông cáo phản hồi cho tin này"
                      >
                        <Send className="w-3 h-3" />
                        <span>Soạn chỉ đạo</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Chế độ Compact Feed: Dạng dòng tin quét nhanh theo chiều dọc */
            <div className="space-y-2">
              {filteredArticles.map(({ article, model, loughran, alertLevel, urgency, riskScore, hasDivergence }, idx) => {
                const badgeCfg = getAlertBadgeConfig(alertLevel);
                const leadUnit = model.level3Action.leadUnit || article.executiveDirective?.whereEntity || article.sectorNameVi || 'Bộ Tài chính';
                const quickImpact = article.tldrKeyImpact || article.marketImplication || article.summary;

                return (
                  <div
                    key={article.id || idx}
                    className={`p-2.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-2 transition cursor-pointer ${
                      isDark
                        ? 'bg-slate-900/80 border-slate-800 hover:bg-slate-900 hover:border-rose-500/40'
                        : 'bg-white border-rose-200 hover:bg-rose-50/40'
                    }`}
                  >
                    <div className="flex items-start md:items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0 mt-1.5 md:mt-0 animate-pulse" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase border ${badgeCfg.badgeClass}`}>
                            {badgeCfg.title}
                          </span>
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase border ${
                            isDark ? 'bg-rose-950/80 text-rose-300 border-rose-800' : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {article.sectorNameVi || article.sector}
                          </span>
                          {hasDivergence && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              ⚡ Độ vênh
                            </span>
                          )}
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            loughran.scoreS > 0
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                              : loughran.scoreS < 0
                              ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            S={loughran.scoreS > 0 ? `+${loughran.scoreS}` : loughran.scoreS}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {article.source} • {article.timeAgo}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                            [{leadUnit}]
                          </span>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                            (Hạn: {urgency})
                          </span>
                        </div>
                        <p className={`text-xs font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {article.title}
                        </p>
                        <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-rose-300/85' : 'text-rose-900'}`}>
                          <strong>Tác động: </strong>{quickImpact}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                      {onOpenWarningPipeline && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenWarningPipeline(article);
                          }}
                          className="px-2 py-1 rounded text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 cursor-pointer flex items-center gap-1"
                          title="Xem kịch bản SOP"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>SOP</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectArticle(article);
                        }}
                        className="px-2 py-1 rounded text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                      >
                        Bóc tách
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDraftStatement(article);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-2xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Soạn chỉ đạo</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
