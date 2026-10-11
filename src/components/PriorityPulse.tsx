import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  FileEdit,
  FileText,
  Flame,
  Mail,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { ScrapedNewsItem, formatNewsFullDateTime } from '../types';
import { decodeHtmlEntities, cleanHtmlTitle } from '../lib/htmlDecoder';
import { classifyArticleUrgency } from '../lib/warningPipelineEngine';
import { isSopLevel4Article } from '../lib/sentimentCalculator';
import { ExecutiveDirectiveDetailModal } from './ExecutiveDirectiveDetailModal';

interface PriorityPulseProps {
  articles: ScrapedNewsItem[];
  onSelectArticle: (article: ScrapedNewsItem) => void;
  onDraftStatement?: (article: ScrapedNewsItem) => void;
  onOpenGmailAlertModal?: (article: ScrapedNewsItem) => void;
  isDark?: boolean;
}

export const PriorityPulse: React.FC<PriorityPulseProps> = ({
  articles,
  onSelectArticle,
  onDraftStatement,
  onOpenGmailAlertModal,
  isDark = false,
}) => {
  const [pulseDetailArticle, setPulseDetailArticle] = React.useState<ScrapedNewsItem | null>(null);
  const [handledIds, setHandledIds] = React.useState<Set<string>>(new Set());

  const top5NoteworthyArticles = useMemo(() => {
    if (!articles || articles.length === 0) return [];
    
    // TIÊU CHÍ BẮT BUỘC TỪ LÃNH ĐẠO:
    // Tuyệt đối không được ghi vào sự việc khẩn nếu không phải tin bị trừ SOP Cấp 4 Khẩn cấp.
    const mapped = articles
      .filter((item) => isSopLevel4Article(item))
      .map((item) => ({
        article: item,
        classification: classifyArticleUrgency(item),
      }));

    return [...mapped]
      .sort((a, b) => b.classification.priorityScore - a.classification.priorityScore)
      .slice(0, 5)
      .map(({ article }) => article);
  }, [articles]);

  if (top5NoteworthyArticles.length === 0) {
    return null; // Hide completely from executive view when zero urgent items exist
  }

  return (
    <div className="rounded-2xl border border-slate-300 bg-white transition-all text-slate-900 shadow-sm">
      {/* Header bar */}
      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-ping absolute" />
            <span className="w-2 h-2 rounded-full bg-slate-900 relative" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight text-slate-900 uppercase flex items-center gap-2">
              <span>Priority Pulse</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-900 border border-slate-300 lowercase tracking-normal">
                top 5 vụ việc đáng chú ý
              </span>
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 font-bold">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Theo thời gian thực xuất bản tin tức</span>
        </div>
      </div>

      {/* List of 5 streamlined items */}
      <div className="divide-y divide-slate-200">
        {top5NoteworthyArticles.map((item, index) => {
          const cleanTitle = cleanHtmlTitle(item.title, item.summary || item.snippet);
          const agency = item.agencies?.[0] || item.source || 'Bộ Tài chính';
          const classification = classifyArticleUrgency(item);
          const publishedTime = classification.occurredTimeFormatted || formatNewsFullDateTime(item);

          const directAction =
            item.policyResponseAdvisor ||
            item.executiveDirective?.mediaStrategy?.tacticalRecommendation ||
            item.executiveDirective?.mediaStrategy?.title ||
            classification.recommendedActionVi;

          return (
            <div
              key={item.id || index}
              className="p-4 transition-colors duration-150 hover:bg-slate-50"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
                {/* Ranking index & urgency indicator */}
                <div className="lg:col-span-1 flex lg:flex-col items-center justify-between lg:justify-center gap-1.5 pt-0.5">
                  <span className="font-mono text-xs font-black text-slate-400">
                    0{index + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white border border-slate-900">
                    {classification.categoryVi}
                  </span>
                </div>

                {/* Simplified 'Issue' Section */}
                <div className="lg:col-span-5 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                      Issue / Vấn đề
                    </span>
                    <span className="text-xs font-bold text-slate-600 truncate">
                      {agency}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1 ml-auto">
                      <Clock className="w-3 h-3" />
                      {publishedTime}
                    </span>
                  </div>
                  <h4
                    onClick={() => setPulseDetailArticle(item)}
                    className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug hover:underline cursor-pointer transition line-clamp-2"
                  >
                    {cleanTitle}
                  </h4>
                </div>

                {/* Simplified 'Direct Action' Section */}
                <div className="lg:col-span-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-900">
                    <Compass className="w-3 h-3 text-slate-900" />
                    <span>Direct Action / Hành động trực tiếp</span>
                  </div>
                  <div className="p-2.5 rounded-xl text-xs leading-relaxed border border-slate-300 bg-slate-50 text-slate-800 font-medium">
                    <p className="line-clamp-2">{directAction}</p>
                  </div>
                </div>

                {/* Quick Action Controls */}
                <div className="lg:col-span-2 flex items-center justify-end gap-1.5 self-center lg:pt-1">
                  {onDraftStatement && (
                    <button
                      onClick={() => onDraftStatement(item)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-black border border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-900 hover:text-white transition cursor-pointer flex items-center gap-1"
                      title="Chỉ đạo xử lý hoặc Soạn định hướng"
                    >
                      <FileEdit className="w-3 h-3" />
                      <span>Chỉ đạo</span>
                    </button>
                  )}

                  <button
                    onClick={() => setPulseDetailArticle(item)}
                    className="p-1.5 rounded-lg text-xs font-bold border border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200 transition cursor-pointer"
                    title="Xem chi tiết phân tích"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>

                  {onOpenGmailAlertModal && (
                    <button
                      onClick={() => onOpenGmailAlertModal(item)}
                      className="p-1.5 rounded-lg text-xs font-bold border border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200 transition cursor-pointer"
                      title="Chuyển tiếp báo cáo tham mưu"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pulseDetailArticle && (
        <ExecutiveDirectiveDetailModal
          article={pulseDetailArticle}
          isOpen={Boolean(pulseDetailArticle)}
          onClose={() => setPulseDetailArticle(null)}
          isHandled={handledIds.has(pulseDetailArticle.id)}
          onToggleHandled={(id) => {
            setHandledIds((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            });
          }}
          onOpenGmailAlertModal={onOpenGmailAlertModal}
          onDraftStatement={onDraftStatement}
          allArticles={articles}
          isDark={isDark}
        />
      )}
    </div>
  );
};
