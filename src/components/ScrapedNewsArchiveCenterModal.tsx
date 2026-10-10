import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Search,
  Filter,
  RefreshCw,
  Download,
  Code2,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Archive,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  queryArchivedNews,
  getNewsArchiveStats,
  ArchivedNewsArticle,
  NewsArchiveStats,
  ArchiveQueryCriteria
} from '../lib/newsArchiveService';
import { SECTOR_NAMES, SectorType } from '../types';

interface ScrapedNewsArchiveCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const ScrapedNewsArchiveCenterModal: React.FC<ScrapedNewsArchiveCenterModalProps> = ({
  isOpen,
  onClose,
  isDark = false
}) => {
  const [articles, setArticles] = useState<ArchivedNewsArticle[]>([]);
  const [stats, setStats] = useState<NewsArchiveStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<SectorType | 'all'>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<'all' | 'bullish' | 'neutral' | 'bearish'>('all');
  const [isBrightOnly, setIsBrightOnly] = useState<boolean>(false);
  const [isRiskOnly, setIsRiskOnly] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'archive' | 'schema' | 'sources'>('archive');

  // Expanded document JSON view
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  const loadArchiveData = async () => {
    setIsLoading(true);
    try {
      const criteria: ArchiveQueryCriteria = {
        sector: selectedSector,
        sentiment: selectedSentiment,
        searchQuery,
        isBrightSpotOnly: isBrightOnly,
        isRiskOnly: isRiskOnly,
        limit: 150
      };

      const [data, statData] = await Promise.all([
        queryArchivedNews(criteria),
        getNewsArchiveStats()
      ]);

      setArticles(data);
      setStats(statData);
    } catch (err) {
      console.error('Failed to load news archive from Cloud Firestore:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadArchiveData();
    }
  }, [isOpen, selectedSector, selectedSentiment, isBrightOnly, isRiskOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadArchiveData();
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(articles, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `finpulse_scraped_news_archive_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border ${
          isDark
            ? 'bg-slate-900 border-slate-700/80 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Cơ sở Dữ liệu Lưu trữ Tin tức Tự động</h3>
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Cloud Firestore Active
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                  Collection: scraped_news_archive
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Toàn bộ tin tức thu thập qua các phiên cào tự động được mã hóa, khử trùng lặp và lưu trữ vĩnh viễn vào Database
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className={`grid grid-cols-2 md:grid-cols-5 gap-3 p-4 border-b ${
          isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200/80'
        }`}>
          <div className="p-3 rounded-xl border bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60">
            <div className="text-[11px] text-slate-500 font-medium">Tổng bài báo lưu trong DB</div>
            <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5 font-mono">
              {stats ? stats.totalArticles : '...'}
            </div>
          </div>
          <div className="p-3 rounded-xl border bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60">
            <div className="text-[11px] text-slate-500 font-medium">Nguồn báo chí quét được</div>
            <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
              {stats ? `${stats.uniqueSourcesCount} nguồn` : '...'}
            </div>
          </div>
          <div className="p-3 rounded-xl border bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60">
            <div className="text-[11px] text-slate-500 font-medium">Điểm sáng Kinh tế (Brights)</div>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
              {stats ? stats.brightSpotsCount : '...'}
            </div>
          </div>
          <div className="p-3 rounded-xl border bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60">
            <div className="text-[11px] text-slate-500 font-medium">Cảnh báo Rủi ro (Risks)</div>
            <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 font-mono">
              {stats ? stats.risksCount : '...'}
            </div>
          </div>
          <div className="p-3 rounded-xl border bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 col-span-2 md:col-span-1">
            <div className="text-[11px] text-slate-500 font-medium">Tốc độ Tự động Lưu</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Real-time Batch Save
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`flex items-center gap-2 px-6 pt-3 border-b ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'archive'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Danh sách Tin tức đã lưu ({articles.length})
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'sources'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Phân bố Nguồn tin ({stats?.sourcesList.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'schema'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Cấu trúc Schema Cấu hình Database
          </button>

          <div className="ml-auto flex items-center gap-2 pb-1">
            <button
              onClick={loadArchiveData}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới Dữ liệu
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất Dataset JSON
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'archive' && (
            <>
              {/* Search & Filter Bar */}
              <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo tiêu đề, nguồn báo, nội dung, mã chứng khoán..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none transition ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
                    }`}
                  />
                </div>

                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value as any)}
                  className={`px-3 py-2 text-xs rounded-xl border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="all">Tất cả Lĩnh vực MoF</option>
                  {Object.entries(SECTOR_NAMES).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>

                <select
                  value={selectedSentiment}
                  onChange={(e) => setSelectedSentiment(e.target.value as any)}
                  className={`px-3 py-2 text-xs rounded-xl border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="all">Tất cả Sắc thái</option>
                  <option value="bullish">🟢 Tích cực (Bullish)</option>
                  <option value="neutral">⚪ Trung tính (Neutral)</option>
                  <option value="bearish">🔴 Tiêu cực (Bearish)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setIsBrightOnly(!isBrightOnly)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 ${
                    isBrightOnly
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-300'
                      : 'bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  🌟 Chỉ Điểm Sáng
                </button>

                <button
                  type="button"
                  onClick={() => setIsRiskOnly(!isRiskOnly)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 ${
                    isRiskOnly
                      ? 'bg-rose-600 text-white border-rose-600'
                      : isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-300'
                      : 'bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  ⚠️ Chỉ Cảnh Báo Rủi Ro
                </button>
              </form>

              {/* Articles Table */}
              {isLoading ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                  <p className="text-xs text-slate-500 font-medium">Đang truy vấn cơ sở dữ liệu tin tức từ Cloud Firestore...</p>
                </div>
              ) : articles.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed rounded-2xl border-slate-200 dark:border-slate-800 p-8">
                  <Database className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                  <p className="text-sm font-bold">Chưa có tin tức nào phù hợp trong Database</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Hãy bấm nút "Quét tin tức" ngoài màn hình chính để tự động lưu thêm các tin mới vào Database
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {articles.map((art) => {
                    const isExpanded = expandedDocId === art.id;
                    return (
                      <div
                        key={art.id}
                        className={`rounded-xl border transition overflow-hidden ${
                          isDark
                            ? 'bg-slate-800/40 border-slate-700/80 hover:border-slate-600'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="p-4 flex items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                {art.source}
                              </span>
                              <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {art.sectorNameVi}
                              </span>
                              {art.sentiment === 'bullish' && (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  🟢 Bullish (+{art.sentimentScore})
                                </span>
                              )}
                              {art.sentiment === 'bearish' && (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  🔴 Bearish ({art.sentimentScore})
                                </span>
                              )}
                              {art.isBrightSpot && (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  🌟 Điểm sáng ({art.brightSpotScore}/100)
                                </span>
                              )}
                              {art.isRisk && (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  ⚠️ Rủi ro ({art.riskScore}/100)
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono ml-auto">
                                ID: {art.id}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                              {art.title}
                            </h4>

                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                              {art.summary}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Đã lưu: {new Date(art.scrapedAt).toLocaleString('vi-VN')}
                              </span>
                              {art.regulatoryTags && art.regulatoryTags.length > 0 && (
                                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                                  Văn bản: {art.regulatoryTags.join(', ')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            {art.url && (
                              <a
                                href={art.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title="Xem bài gốc"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => setExpandedDocId(isExpanded ? null : art.id)}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1"
                            >
                              <Code2 className="w-3 h-3" />
                              {isExpanded ? 'Ẩn Schema JSON' : 'Xem Document JSON'}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Document JSON View */}
                        {isExpanded && (
                          <div className={`p-4 border-t font-mono text-[11px] overflow-x-auto ${
                            isDark ? 'bg-slate-950/80 border-slate-700 text-emerald-400' : 'bg-slate-900 text-emerald-400 border-slate-200'
                          }`}>
                            <div className="flex items-center justify-between text-slate-400 text-[10px] mb-2 font-sans border-b border-slate-800 pb-1">
                              <span>📄 Firestore Document Schema (Collection: scraped_news_archive)</span>
                              <span>Schema Version: {art.schemaVersion}</span>
                            </div>
                            <pre>{JSON.stringify(art, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'sources' && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Thống kê số lượng bài viết phân bổ theo nguồn báo chí:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {stats?.sourcesList.map(src => (
                  <div
                    key={src.name}
                    className={`p-4 rounded-xl border flex items-center justify-between ${
                      isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold">{src.name}</span>
                    </div>
                    <span className="text-sm font-extrabold font-mono text-blue-600 dark:text-blue-400">
                      {src.count} bài
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-xl border bg-slate-900 text-slate-200 border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-2">
                  <span>📌 Firestore Blueprint Entity Specification: scraped_news_archive</span>
                  <span>Strict Structural Types</span>
                </div>
                <pre className="text-[11px] leading-relaxed overflow-x-auto text-slate-300">{`{
  "id": "string (unique hash/id)",
  "title": "string (tiêu đề bài báo)",
  "url": "string (đường dẫn bài viết)",
  "source": "string (nhà xuất bản / nguồn báo)",
  "publishedAt": "string (thời điểm xuất bản ISO)",
  "publishedTimestamp": "number (timestamp unix ms)",
  "scrapedAt": "number (thời điểm cào tin)",
  "timeRange": "string ('1h'|'2h'|'4h'|'8h'|'24h')",
  "sector": "string ('tax'|'customs'|'stocks'|'bonds'...)",
  "sectorNameVi": "string (tên tiếng Việt)",
  "summary": "string (tóm tắt AI)",
  "sentiment": "string ('bullish'|'neutral'|'bearish')",
  "sentimentScore": "number (-100 đến +100)",
  "isBrightSpot": "boolean (điểm sáng kinh tế)",
  "brightSpotScore": "number (0-100)",
  "isRisk": "boolean (cảnh báo rủi ro)",
  "riskScore": "number (0-100)",
  "regulatoryTags": "array of strings (mã văn bản pháp quy)",
  "agencies": "array of strings (đơn vị liên quan)",
  "tickers": "array of strings (mã chứng khoán)",
  "scrapeSessionId": "string (mã phiên cào tin)",
  "schemaVersion": "number (1)"
}`}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
