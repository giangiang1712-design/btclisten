/**
 * EventClusterCard.tsx
 * 
 * Component hiển thị Thẻ Tin Sự Kiện Gom Cụm (Event Cluster Card)
 * Tích hợp:
 * - Cosine & MinHash Jaccard Similarity Badge (>75% tương đồng).
 * - Nhận diện Báo phát tin đầu tiên (First-Mover Origin Source) với huy hiệu vàng đặc biệt.
 * - Danh sách các báo phát tán lại (Echo Sources) kèm độ trễ thời gian (+X phút).
 * - Hành động nhanh: Deep Dive, Soạn thảo phát ngôn, Phân tích 6W.
 */

import React, { useState } from 'react';
import { ClusteredEventCard } from '../lib/eventClusteringEngine';
import { ScrapedNewsItem, formatNewsTimeDisplay } from '../types';
import { useTheme } from '../lib/theme';
import { SourceBrandBadge } from './SourceBrandBadge';
import {
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileEdit,
  Radio,
  Clock,
  ArrowRight,
  Flame,
  Tag,
  Building,
  User,
  Share2,
  Check,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';

interface EventClusterCardProps {
  cluster: ClusteredEventCard;
  onDeepDive: (item: ScrapedNewsItem) => void;
  onDraftStatement: (item: ScrapedNewsItem) => void;
  onPolicySubmission?: (item: ScrapedNewsItem) => void;
  query?: string;
}

export const EventClusterCard: React.FC<EventClusterCardProps> = ({
  cluster,
  onDeepDive,
  onDraftStatement,
  onPolicySubmission,
  query,
}) => {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState<boolean>(cluster.totalArticles > 1);
  const [copied, setCopied] = useState<boolean>(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `[CHUỖI SỰ KIỆN TÀI CHÍNH - PHÁT TÁN TỰ ĐỘNG]
📌 Chủ đề: ${cluster.clusterTitle}
🚀 Nguồn phát tin đầu tiên (First-Mover): ${cluster.originSource} (${cluster.originPublishedTimeStr})
📰 Tổng số cơ quan báo chí đăng tin: ${cluster.totalArticles} báo (${cluster.allSources.join(', ')})
🔗 Link bài gốc: ${cluster.originArticle.url || 'N/A'}
📊 Sắc thái: ${cluster.dominantSentiment === 'bullish' ? 'Tích cực' : cluster.dominantSentiment === 'bearish' ? 'Tiêu cực' : 'Trung tính'}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const isMultiArticle = cluster.totalArticles > 1;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Header Bar */}
      <div className="p-4 sm:p-5 space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Multi-Article Cluster Pill */}
            {isMultiArticle ? (
              <span
                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-bold border ${
                  isDark
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-indigo-50 text-indigo-900 border-indigo-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Chùm {cluster.totalArticles} báo cùng phát tán</span>
                <span className="text-[10px] font-mono opacity-80">({cluster.similarityScore}% tương đồng)</span>
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg font-medium border ${
                  isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <span>Tin độc lập</span>
              </span>
            )}

            {/* First-Mover / Origin Highlight Badge */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-bold border ${
                isDark
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}
              title={`Báo ${cluster.originSource} là nguồn phát hiện và đăng tin đầu tiên`}
            >
              <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
              <span>Nguồn gốc: <strong>{cluster.originSource}</strong></span>
              <span className="font-mono text-[10px]">({cluster.originPublishedTimeStr})</span>
            </span>

            {/* Sector */}
            <span
              className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border ${
                isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {cluster.sectorNameVi}
            </span>
          </div>

          {/* Sentiment & Buzz Metrics */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-xs px-2.5 py-1 rounded-lg font-bold border ${
                cluster.dominantSentiment === 'bullish'
                  ? isDark
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : cluster.dominantSentiment === 'bearish'
                  ? isDark
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {cluster.dominantSentiment === 'bullish'
                ? '🟢 Tích cực'
                : cluster.dominantSentiment === 'bearish'
                ? '🔴 Tiêu cực'
                : '⚪ Trung tính'}
            </span>

            <span
              className={`text-xs px-2 py-1 rounded-lg font-mono font-bold border ${
                isDark ? 'bg-slate-950 text-amber-400 border-slate-800' : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title="Điểm sức hút dư luận (Buzz Score)"
            >
              🔥 {cluster.maxBuzzScore}
            </span>

            <button
              onClick={handleShare}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
              title="Sao chép báo cáo chuỗi tin"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Main Event Title */}
        <div className="space-y-1.5">
          <h3
            onClick={() => onDeepDive(cluster.originArticle)}
            className={`text-base sm:text-lg font-bold leading-snug cursor-pointer transition ${
              isDark ? 'text-slate-100 hover:text-emerald-400' : 'text-slate-900 hover:text-emerald-600'
            }`}
          >
            {cluster.clusterTitle}
          </h3>
          <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {cluster.eventSummary}
          </p>
        </div>

        {/* Entities and Policy Tags */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {cluster.tickers.map((ticker) => (
            <span
              key={ticker}
              className={`text-[11px] font-mono font-black px-2 py-0.5 rounded border ${
                isDark ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-cyan-50 text-cyan-800 border-cyan-300'
              }`}
            >
              ${ticker}
            </span>
          ))}

          {cluster.agencies.map((agency) => (
            <span
              key={agency}
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${
                isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Building className="w-3 h-3 text-slate-400" />
              <span>{agency}</span>
            </span>
          ))}

          {cluster.keyPeople.map((person) => (
            <span
              key={person}
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${
                isDark ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60' : 'bg-indigo-50 text-indigo-800 border-indigo-200'
              }`}
            >
              <User className="w-3 h-3 text-indigo-400" />
              <span>{person}</span>
            </span>
          ))}

          {cluster.policyTags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${
                isDark ? 'bg-amber-950/50 text-amber-300 border-amber-800/50' : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <Tag className="w-3 h-3 text-amber-500" />
              <span>{tag}</span>
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex-wrap">
          <div className="flex items-center gap-2">
            {cluster.originArticle.url && (
              <a
                href={cluster.originArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-cyan-800 border-slate-300'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Báo gốc ({cluster.originSource})</span>
              </a>
            )}

            <button
              onClick={() => onDeepDive(cluster.originArticle)}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800/60'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Deep Dive 6W</span>
            </button>

            <button
              onClick={() => onDraftStatement(cluster.originArticle)}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border-cyan-800/60'
                  : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border-cyan-300'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5 text-cyan-500" />
              <span>Soạn phát ngôn</span>
            </button>
          </div>

          {/* Toggle Expand / Collapse Sub-Echo Articles */}
          {isMultiArticle && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <span>{isExpanded ? 'Thu gọn' : `Xem thêm ${cluster.echoArticles.length} báo dẫn lại`}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Echo Stream (First-Mover Timeline & Propagation Trail) */}
      {isMultiArticle && isExpanded && (
        <div
          className={`p-4 sm:p-5 border-t space-y-3 ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-amber-500" />
              <span>Dòng chảy phát tán & Tốc độ đăng bài của các cơ quan báo chí:</span>
            </span>
            <span className="font-mono text-[11px]">Độ trễ trung bình: +{cluster.leadTimeMinutes} phút</span>
          </div>

          {/* Origin Lead Row */}
          <div
            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDark
                ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                : 'bg-amber-50/90 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                1. Báo Gốc (First Mover)
              </span>
              <SourceBrandBadge source={cluster.originSource} url={cluster.originArticle.url} size="xs" showIcon={true} />
              <span className="font-bold text-xs">{cluster.originArticle.title}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <strong className="text-amber-600 dark:text-amber-400">{cluster.originPublishedTimeStr}</strong>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 font-bold">Mốc 0p</span>
            </div>
          </div>

          {/* Echo Sub-Articles List */}
          <div className="space-y-2 pl-3 sm:pl-4 border-l-2 border-slate-300 dark:border-slate-700">
            {cluster.echoArticles.map((echoItem, idx) => (
              <div
                key={echoItem.article.id}
                className={`p-2.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
                  isDark
                    ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 flex-wrap flex-1">
                  <span className="font-mono text-[10px] text-slate-500">{idx + 2}.</span>
                  <SourceBrandBadge
                    source={echoItem.article.source}
                    url={echoItem.article.url}
                    size="xs"
                    showIcon={true}
                  />
                  <span
                    onClick={() => onDeepDive(echoItem.article)}
                    className="font-medium hover:text-emerald-500 cursor-pointer line-clamp-1"
                  >
                    {echoItem.article.title}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {echoItem.similarity}% tương đồng
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                  <span className="text-slate-400">{echoItem.publishedTimeStr}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                      echoItem.lagMinutes > 30
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    +{echoItem.lagMinutes}p trễ
                  </span>
                  {echoItem.article.url && (
                    <a
                      href={echoItem.article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-cyan-400"
                      title="Xem link gốc"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
