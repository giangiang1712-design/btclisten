import React, { useState, useMemo } from 'react';
import { ScrapedNewsItem } from '../types';
import { aggregateMediaGaps, MediaGapSummaryGroup } from '../lib/sentimentAndGapEngine';
import { useTheme } from '../lib/theme';
import {
  Radio,
  AlertTriangle,
  Megaphone,
  UserCheck,
  Building2,
  FileText,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Search,
  Filter,
  Layers,
  Sparkles,
  HelpCircle,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';

interface MediaGapRadarHubProps {
  newsItems: ScrapedNewsItem[];
  onSelectArticle?: (item: ScrapedNewsItem) => void;
  onDraftStatement?: (item: ScrapedNewsItem) => void;
  className?: string;
}

export const MediaGapRadarHub: React.FC<MediaGapRadarHubProps> = ({
  newsItems,
  onSelectArticle,
  onDraftStatement,
  className = ''
}) => {
  const { isDark } = useTheme();
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [selectedAgency, setSelectedAgency] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const gapGroups = useMemo(() => {
    return aggregateMediaGaps(newsItems);
  }, [newsItems]);

  const agenciesList = useMemo(() => {
    const set = new Set<string>();
    gapGroups.forEach(g => {
      if (g.leadAgency) set.add(g.leadAgency);
    });
    return Array.from(set);
  }, [gapGroups]);

  const filteredGroups = useMemo(() => {
    return gapGroups.filter(group => {
      if (selectedSeverity !== 'ALL' && group.severity !== selectedSeverity) return false;
      if (selectedAgency !== 'ALL' && group.leadAgency !== selectedAgency) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTopic = group.topicConcern.toLowerCase().includes(q);
        const inDeficit = group.informationDeficit.toLowerCase().includes(q);
        const inCampaign = group.campaignTitle.toLowerCase().includes(q);
        if (!inTopic && !inDeficit && !inCampaign) return false;
      }
      return true;
    });
  }, [gapGroups, selectedSeverity, selectedAgency, searchQuery]);

  const handleCopyGroupPlan = (group: MediaGapSummaryGroup) => {
    const text = `📋 [BÁO CÁO THAM MƯU: BÙ ĐẮP KHOẢNG TRỐNG TRUYỀN THÔNG CHÍNH SÁCH BỘ TÀI CHÍNH]\n` +
      `📌 Vấn đề dư luận/Doanh nghiệp băn khoăn:\n${group.topicConcern}\n\n` +
      `⚠️ Khoảng trống thông tin nhận diện:\n${group.informationDeficit}\n\n` +
      `🏢 Đơn vị chủ trì: ${group.leadAgency}\n` +
      `📢 Chiến dịch truyền thông đề xuất: ${group.campaignTitle}\n\n` +
      `👤 TƯ VẤN NGƯỜI DÂN & DOANH NGHIỆP CẦN LÀM GÌ:\n${group.citizenBizGuidance.map(g => ` ${g}`).join('\n')}\n\n` +
      `🚀 KẾ HOẠCH CHỦ ĐỘNG BƠM TIN BÀI & ĐỊNH HƯỚNG:\n${group.communicationSteps.map(s => ` ${s}`).join('\n')}\n\n` +
      `📰 Số lượng tin bài liên quan: ${group.articleCount} bài báo.`;

    navigator.clipboard.writeText(text);
    setCopiedId(group.ruleId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className={`rounded-2xl border p-5 space-y-5 ${
      isDark
        ? 'bg-slate-900/90 border-slate-800 text-slate-100'
        : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    } ${className}`}>
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4 dark:border-slate-800 border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">
                  Radar Khoảng Trống Truyền Thông & Kế Hoạch Tăng Cường Tin Bài
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {gapGroups.length} Chủ đề cần giải thích
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Phát hiện những chính sách người dân & DN đang băn khoăn nhưng chưa được giải thích cặn kẽ để chủ động định hướng
              </p>
            </div>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm chủ đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-8 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none transition ${
                isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
              }`}
            />
          </div>

          <div className="flex rounded-xl border p-0.5 dark:border-slate-800 border-slate-200 text-xs">
            <button
              onClick={() => setSelectedSeverity('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedSeverity === 'ALL'
                  ? isDark ? 'bg-amber-500 text-slate-950' : 'bg-amber-600 text-white'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({gapGroups.length})
            </button>
            <button
              onClick={() => setSelectedSeverity('HIGH')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedSeverity === 'HIGH'
                  ? 'bg-rose-600 text-white'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cấp thiết
            </button>
          </div>
        </div>
      </div>

      {/* Agency Filter chips */}
      {agenciesList.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className={`text-[10px] uppercase font-bold mr-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Đơn vị phụ trách:
          </span>
          <button
            onClick={() => setSelectedAgency('ALL')}
            className={`px-2.5 py-1 rounded-lg font-medium border transition cursor-pointer ${
              selectedAgency === 'ALL'
                ? isDark ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' : 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold'
                : isDark ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả đơn vị
          </button>
          {agenciesList.map(agency => (
            <button
              key={agency}
              onClick={() => setSelectedAgency(agency)}
              className={`px-2.5 py-1 rounded-lg font-medium border transition cursor-pointer ${
                selectedAgency === agency
                  ? isDark ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' : 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold'
                  : isDark ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {agency}
            </button>
          ))}
        </div>
      )}

      {/* Cards List */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Không tìm thấy khoảng trống truyền thông nào phù hợp với bộ lọc.
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isHigh = group.severity === 'HIGH';
            const isCopied = copiedId === group.ruleId;

            return (
              <div
                key={group.ruleId}
                className={`rounded-2xl border p-4.5 transition-all shadow-sm space-y-3.5 ${
                  isHigh
                    ? isDark
                      ? 'bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 border-amber-500/40 hover:border-amber-500/60'
                      : 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/30 border-amber-300 hover:border-amber-400'
                    : isDark
                    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-slate-800 hover:border-slate-700'
                    : 'bg-gradient-to-br from-slate-50 via-white to-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Group Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5 dark:border-slate-800 border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isHigh
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    }`}>
                      {isHigh ? '⚠️ NGUY CƠ THIẾU THÔNG TIN CAO' : 'ℹ️ CẦN BỔ SUNG TUYÊN TRUYỀN'}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      • {group.articleCount} bài báo liên quan
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                      isDark ? 'bg-slate-800 text-indigo-300 border-slate-700' : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                    }`}>
                      {group.leadAgency}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyGroupPlan(group)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition border cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                      title="Sao chép toàn bộ kế hoạch tham mưu và tư vấn"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Đã sao chép' : 'Sao chép Kế hoạch'}</span>
                    </button>
                  </div>
                </div>

                {/* Problem Statement: Public Concern & Deficit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border ${
                    isDark ? 'bg-slate-950/70 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                        Vấn đề Dư luận / Người dân / DN băn khoăn:
                      </span>
                    </div>
                    <p className="text-xs font-medium leading-relaxed">
                      {group.topicConcern}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${
                    isDark ? 'bg-slate-950/70 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-rose-400' : 'text-rose-800'}`}>
                        Khoảng trống thông tin nhận diện được:
                      </span>
                    </div>
                    <p className="text-xs font-medium leading-relaxed">
                      {group.informationDeficit}
                    </p>
                  </div>
                </div>

                {/* Action Blueprint: Citizen Guidance vs Ministry Campaign */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Citizen Guidance */}
                  <div className={`p-3 rounded-xl border ${
                    isDark ? 'bg-blue-950/20 border-blue-500/30' : 'bg-blue-50/60 border-blue-200'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-2 border-b pb-1 dark:border-blue-500/20 border-blue-200">
                      <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                        Tư vấn: Người dân & DN cần làm gì?
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {group.citizenBizGuidance.map((guide, idx) => (
                        <div key={idx} className={`p-2 rounded-lg text-xs leading-relaxed border ${
                          isDark ? 'bg-slate-900/90 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                        }`}>
                          <p>{guide}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ministry Proactive Action */}
                  <div className={`p-3 rounded-xl border ${
                    isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50/60 border-amber-200'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-2 border-b pb-1 dark:border-amber-500/20 border-amber-200">
                      <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                        Chủ động tăng cường tin bài định hướng
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className={`text-[11px] font-bold block ${isDark ? 'text-amber-200' : 'text-amber-950'}`}>
                        📌 {group.campaignTitle}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {group.communicationSteps.map((step, idx) => (
                        <div key={idx} className={`p-2 rounded-lg text-xs leading-relaxed border ${
                          isDark ? 'bg-slate-900/90 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                        }`}>
                          <p>{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Related Articles in this Gap */}
                {group.articles && group.articles.length > 0 && onSelectArticle && (
                  <div className="pt-2 border-t border-dashed dark:border-slate-800 border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Các bài báo kích hoạt cảnh báo này:
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.articles.slice(0, 4).map((art) => (
                        <button
                          key={art.id}
                          onClick={() => onSelectArticle(art)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition border cursor-pointer max-w-full truncate ${
                            isDark
                              ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                              : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-xs'
                          }`}
                        >
                          <span className="truncate max-w-[280px]">{art.title}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
