import React, { useState, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  Sparkles,
  Download,
  RefreshCw,
  Link2,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Eye,
  X,
  Layers,
  HelpCircle,
  ArrowRight,
  Database,
  Calendar,
  Building2,
  UserCheck,
  Scale,
  Hash
} from 'lucide-react';
import {
  StandardizationLogEntry,
  StandardizationFailureReason,
  auditBatchStandardization,
  auditArticleStandardization,
  enrichAndStandardizeArticle,
  saveLocalArchiveCache
} from '../lib/newsArchiveService';

interface StandardizationLogTableProps {
  articles: any[];
  onArticleStandardized?: (updatedArticle: any) => void;
  onBatchStandardized?: (updatedArticles: any[]) => void;
  isOptimizing?: boolean;
  onRunBatchOptimization?: () => void;
  className?: string;
}

export const StandardizationLogTable: React.FC<StandardizationLogTableProps> = ({
  articles = [],
  onArticleStandardized,
  onBatchStandardized,
  isOptimizing = false,
  onRunBatchOptimization,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEEDS_FIX' | 'GOOGLE_NEWS' | 'OPTIMAL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [selectedEntry, setSelectedEntry] = useState<StandardizationLogEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [singleFixingId, setSingleFixingId] = useState<string | null>(null);
  const [singleSuccessMsg, setSingleSuccessMsg] = useState<string | null>(null);

  // Compute log entries and batch statistics
  const { entries: allLogEntries, stats } = useMemo(() => {
    return auditBatchStandardization(articles);
  }, [articles]);

  // Extract unique sources for filter dropdown
  const uniqueSources = useMemo(() => {
    const set = new Set<string>();
    allLogEntries.forEach(e => {
      if (e.source) set.add(e.source);
    });
    return Array.from(set).sort();
  }, [allLogEntries]);

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    return allLogEntries.filter(entry => {
      // Status filter
      if (statusFilter === 'NEEDS_FIX' && entry.is100Percent) return false;
      if (statusFilter === 'OPTIMAL' && !entry.is100Percent) return false;
      if (statusFilter === 'GOOGLE_NEWS' && !entry.isGoogleNewsRedirect && !entry.hasTrackingParams) return false;

      // Source filter
      if (sourceFilter !== 'ALL' && entry.source !== sourceFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = entry.id.toLowerCase().includes(q);
        const matchTitle = entry.title.toLowerCase().includes(q);
        const matchSource = (entry.source || '').toLowerCase().includes(q);
        const matchRawUrl = entry.rawUrl.toLowerCase().includes(q);
        const matchCanonical = entry.canonicalUrl.toLowerCase().includes(q);
        const matchReason = entry.failureReasons.some(r => 
          r.criterion.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
        );
        return matchId || matchTitle || matchSource || matchRawUrl || matchCanonical || matchReason;
      }

      return true;
    });
  }, [allLogEntries, statusFilter, sourceFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / pageSize) || 1;
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, currentPage, pageSize]);

  // Handle single article quick standardization
  const handleSingleStandardize = async (entry: StandardizationLogEntry) => {
    setSingleFixingId(entry.id);
    try {
      const enriched = enrichAndStandardizeArticle(entry.rawArticle);
      
      // Update local storage cache
      saveLocalArchiveCache([enriched]);

      if (onArticleStandardized) {
        onArticleStandardized(enriched);
      }

      setSingleSuccessMsg(`Đã chuẩn hóa 100% cho bài viết: "${enriched.title.slice(0, 45)}..."`);
      setTimeout(() => setSingleSuccessMsg(null), 4000);

      // If modal is open with this entry, update it
      if (selectedEntry && selectedEntry.id === entry.id) {
        const reAudited = auditArticleStandardization(enriched);
        setSelectedEntry(reAudited);
      }
    } catch (err) {
      console.error('Lỗi khi chuẩn hóa bài viết:', err);
    } finally {
      setSingleFixingId(null);
    }
  };

  // Copy helper
  const handleCopy = (text: string, type: 'id' | 'url', itemId: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'id') {
        setCopiedId(itemId);
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        setCopiedUrl(itemId);
        setTimeout(() => setCopiedUrl(null), 2000);
      }
    }
  };

  // Export Standardization Log as CSV
  const handleExportCsv = () => {
    const headers = [
      'STT',
      'ID_Bai_Viet',
      'Tieu_De',
      'Nguon_Bao',
      'Diem_Chuan_Hoa_Percent',
      'Trang_Thai',
      'URL_Goc_Raw',
      'URL_Chuan_Hoa_Canonical',
      'La_Google_News_Redirect',
      'Co_Ma_Tracking_Rac',
      'So_Ly_Do_Chua_Dat',
      'Chi_Tiet_Ly_Do_Loi_Hoac_Thieu'
    ];

    const rows = filteredEntries.map((e, idx) => {
      const reasonsStr = e.failureReasons.map(r => `[${r.criterion}]: ${r.description}`).join(' | ');
      return [
        idx + 1,
        `"${e.id}"`,
        `"${e.title.replace(/"/g, '""')}"`,
        `"${e.source}"`,
        e.standardizationScore,
        `"${e.statusLabelVi}"`,
        `"${e.rawUrl}"`,
        `"${e.canonicalUrl}"`,
        e.isGoogleNewsRedirect ? 'CO' : 'KHONG',
        e.hasTrackingParams ? 'CO' : 'KHONG',
        e.failureReasons.length,
        `"${reasonsStr.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nhat_ky_chuan_hoa_bo_tai_chinh_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export Standardization Log as JSON
  const handleExportJson = () => {
    const payload = {
      exportTimestamp: new Date().toISOString(),
      reportTitle: 'Nhật Ký Chuẩn Hóa & Truy Vết Lỗi Trỏ Link Dữ Liệu Báo Chí',
      stats,
      totalEntries: filteredEntries.length,
      entries: filteredEntries
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nhat_ky_chuan_hoa_trace_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 4 SUMMARY DIAGNOSTIC PILLS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Tổng bài trong nhật ký */}
        <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Tổng Bản Ghi</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-white font-mono">{stats.totalAudited}</span>
              <span className="text-xs text-slate-400">bài</span>
            </div>
          </div>
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Đạt chuẩn 100% */}
        <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Đạt Chuẩn 100%</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">{stats.optimalCount}</span>
              <span className="text-xs text-emerald-500 font-semibold">({stats.optimalPercentage}%)</span>
            </div>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Cần chuẩn hóa (<100%) */}
        <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Cần Chuẩn Hóa</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-2xl font-extrabold font-mono ${stats.needsStandardizationCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {stats.needsStandardizationCount}
              </span>
              <span className="text-xs text-amber-500 font-semibold">
                {stats.needsStandardizationCount > 0 ? 'bản ghi' : 'Tất cả đạt chuẩn'}
              </span>
            </div>
          </div>
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Phát hiện Link Google News / Chưa bóc tách */}
        <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Link Google News / Rác</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-2xl font-extrabold font-mono ${stats.googleNewsRedirectsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {stats.googleNewsRedirectsCount + stats.trackingDirtyCount}
              </span>
              <span className="text-xs text-rose-400 font-semibold">
                {stats.googleNewsRedirectsCount > 0 ? 'Cần bóc link' : 'Link sạch'}
              </span>
            </div>
          </div>
          <div className={`p-2.5 rounded-lg border ${stats.googleNewsRedirectsCount > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
            <Link2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* SUCCESS BANNER WHEN STANDARDIZING SINGLE */}
      {singleSuccessMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{singleSuccessMsg}</span>
        </div>
      )}

      {/* TOOLBAR: SEARCH & FILTERS & BATCH ACTIONS */}
      <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo ID bài viết (art_...), tiêu đề, nguồn, URL gốc hoặc lý do..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            Tất cả ({allLogEntries.length})
          </button>

          <button
            onClick={() => { setStatusFilter('NEEDS_FIX'); setCurrentPage(1); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              statusFilter === 'NEEDS_FIX'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Cần Xử Lý ({stats.needsStandardizationCount})
          </button>

          <button
            onClick={() => { setStatusFilter('GOOGLE_NEWS'); setCurrentPage(1); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              statusFilter === 'GOOGLE_NEWS'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-800 text-rose-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            Link Google News ({stats.googleNewsRedirectsCount})
          </button>

          <button
            onClick={() => { setStatusFilter('OPTIMAL'); setCurrentPage(1); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              statusFilter === 'OPTIMAL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-emerald-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đạt 100% ({stats.optimalCount})
          </button>

          {/* Source Dropdown */}
          {uniqueSources.length > 1 && (
            <select
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Tất cả nguồn báo ({uniqueSources.length})</option>
              {uniqueSources.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onRunBatchOptimization && (
            <button
              onClick={onRunBatchOptimization}
              disabled={isOptimizing}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-lg transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
              title="Chuẩn hóa toàn bộ danh sách bài viết chưa đạt 100%"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : 'text-amber-300'}`} />
              <span>{isOptimizing ? 'Đang Xử Lý...' : '⚡ Chuẩn Hóa Tất Cả'}</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg border border-slate-700 transition flex items-center gap-1"
            title="Xuất file CSV nhật ký kiểm định"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg border border-slate-700 transition flex items-center gap-1"
            title="Xuất file JSON nhật ký kiểm định"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* MAIN STANDARDIZATION LOG DATA TABLE */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-900/60 shadow-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <th className="py-3 px-3 w-12 text-center">STT</th>
              <th className="py-3 px-3 w-48">ID Bài Viết</th>
              <th className="py-3 px-4 min-w-[220px]">Tiêu Đề & Nguồn Báo</th>
              <th className="py-3 px-4 min-w-[260px]">Truy Vết Đường Dẫn (Link Trace)</th>
              <th className="py-3 px-3 w-28 text-center">Chuẩn Hóa</th>
              <th className="py-3 px-4 min-w-[280px]">Chẩn Đoán & Lý Do Chưa Đạt 100%</th>
              <th className="py-3 px-3 w-32 text-center">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {paginatedEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <ShieldCheck className="w-10 h-10 text-emerald-400/60 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">Không tìm thấy bản ghi nào khớp với bộ lọc</p>
                  <p className="text-xs text-slate-500 mt-1">Thử đổi từ khóa tìm kiếm hoặc bấm chọn "Tất cả"</p>
                </td>
              </tr>
            ) : (
              paginatedEntries.map((entry, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index + 1;
                const isSingleFixing = singleFixingId === entry.id;

                return (
                  <tr
                    key={entry.id}
                    className={`transition-colors hover:bg-slate-800/40 ${
                      !entry.is100Percent ? 'bg-amber-950/10' : ''
                    }`}
                  >
                    {/* Column 1: STT */}
                    <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {globalIndex}
                    </td>

                    {/* Column 2: ID Bài Viết */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <code
                          className="font-mono text-[11px] text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 truncate max-w-[130px]"
                          title={entry.id}
                        >
                          {entry.id}
                        </code>
                        <button
                          onClick={() => handleCopy(entry.id, 'id', entry.id)}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                          title="Sao chép ID bài viết"
                        >
                          {copiedId === entry.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        {entry.scrapedAtFormatted}
                      </div>
                    </td>

                    {/* Column 3: Tiêu Đề & Nguồn Báo */}
                    <td className="py-3 px-4">
                      <div
                        className="font-medium text-slate-100 line-clamp-2 leading-relaxed hover:text-indigo-300 cursor-pointer"
                        title={entry.title}
                        onClick={() => setSelectedEntry(entry)}
                      >
                        {entry.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-indigo-300 border border-slate-700">
                          {entry.source}
                        </span>
                        {entry.publishedAtFormatted && (
                          <span className="text-[10px] text-slate-400">
                            {entry.publishedAtFormatted}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Column 4: Truy Vết Đường Dẫn (Link Trace) */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {/* Status Warning Tag */}
                        {entry.isGoogleNewsRedirect ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 w-fit">
                            <AlertCircle className="w-3 h-3" />
                            <span>Link Google News Redirect (Cần bóc tách)</span>
                          </div>
                        ) : entry.hasTrackingParams ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            <span>URL chứa tham số rác (UTM/Tracking)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 w-fit">
                            <Check className="w-3 h-3" />
                            <span>URL Chuẩn Hóa Tòa Soạn</span>
                          </div>
                        )}

                        {/* Canonical Resolved URL */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 shrink-0 font-semibold">Đích:</span>
                          <span
                            className="font-mono text-[11px] text-indigo-300 truncate max-w-[200px]"
                            title={entry.canonicalUrl || entry.rawUrl}
                          >
                            {entry.canonicalUrl || entry.rawUrl}
                          </span>

                          <a
                            href={entry.canonicalUrl || entry.rawUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition shrink-0"
                            title="Mở liên kết bài báo gốc trên tab mới"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => handleCopy(entry.canonicalUrl || entry.rawUrl, 'url', entry.id)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition shrink-0"
                            title="Sao chép đường dẫn chuẩn"
                          >
                            {copiedUrl === entry.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        {/* If was Google News, show raw preview */}
                        {entry.isGoogleNewsRedirect && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[220px]" title={entry.rawUrl}>
                            Gốc: <code className="text-rose-400/80">{entry.rawUrl.slice(0, 35)}...</code>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Column 5: Chuẩn Hóa & Điểm Số */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`text-base font-extrabold font-mono ${
                          entry.standardizationScore === 100 
                            ? 'text-emerald-400' 
                            : entry.standardizationScore >= 80 
                            ? 'text-indigo-400' 
                            : 'text-amber-400'
                        }`}>
                          {entry.standardizationScore}%
                        </span>
                        
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden my-1">
                          <div
                            className={`h-full ${
                              entry.standardizationScore === 100
                                ? 'bg-emerald-500'
                                : entry.standardizationScore >= 80
                                ? 'bg-indigo-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${entry.standardizationScore}%` }}
                          />
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono">
                          {entry.passedChecksCount}/{entry.totalChecksCount} đạt
                        </span>
                      </div>
                    </td>

                    {/* Column 6: Chẩn Đoán & Lý Do Chưa Đạt 100% */}
                    <td className="py-3 px-4">
                      {entry.is100Percent ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Đạt chuẩn toàn diện 12/12 tiêu chí</span>
                        </div>
                      ) : (
                        <div className="space-y-1 max-w-sm">
                          {entry.failureReasons.slice(0, 2).map((r, rIdx) => (
                            <div key={rIdx} className="text-[11px] flex items-start gap-1 text-slate-300">
                              <span className={`text-xs mt-0.5 shrink-0 ${
                                r.severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'
                              }`}>
                                •
                              </span>
                              <span className="leading-tight">
                                <strong className="text-slate-200">{r.criterion}:</strong> {r.description}
                              </span>
                            </div>
                          ))}
                          {entry.failureReasons.length > 2 && (
                            <button
                              onClick={() => setSelectedEntry(entry)}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold underline block"
                            >
                              + Xem thêm {entry.failureReasons.length - 2} lý do khác...
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Column 7: Hành Động */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {!entry.is100Percent ? (
                          <button
                            onClick={() => handleSingleStandardize(entry)}
                            disabled={isSingleFixing}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-[11px] rounded-lg transition shadow-sm flex items-center gap-1 disabled:opacity-50"
                            title="Chuẩn hóa và nâng lên 100% ngay cho bài này"
                          >
                            <Sparkles className={`w-3 h-3 ${isSingleFixing ? 'animate-spin' : 'text-amber-300'}`} />
                            <span>{isSingleFixing ? 'Đang sửa...' : 'Sửa Ngay'}</span>
                          </button>
                        ) : (
                          <span className="px-2 py-1 rounded text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                            ✓ Tối Ưu
                          </span>
                        )}

                        <button
                          onClick={() => setSelectedEntry(entry)}
                          className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition"
                          title="Xem chi tiết 12 tiêu chí và dữ liệu JSON"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION BAR */}
      {filteredEntries.length > pageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 px-2">
          <div>
            Hiển thị <strong>{(currentPage - 1) * pageSize + 1}</strong> - <strong>{Math.min(currentPage * pageSize, filteredEntries.length)}</strong> trên tổng số <strong>{filteredEntries.length}</strong> bài viết
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 disabled:opacity-40"
            >
              Trước
            </button>
            <span className="px-2 font-mono font-bold text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* DETAIL INSPECTION MODAL (12 CRITERIA CHECKLIST & LINK DIAGNOSTIC) */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Chi Tiết Kiểm Định Bản Ghi:</span>
                    <code className="font-mono text-xs text-indigo-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {selectedEntry.id}
                    </code>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-lg">
                    {selectedEntry.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Score and status overview */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-slate-400 text-xs block">Điểm hoàn thiện chuẩn hóa:</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className={`text-3xl font-extrabold font-mono ${
                      selectedEntry.standardizationScore === 100 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {selectedEntry.standardizationScore}%
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      ({selectedEntry.passedChecksCount}/12 tiêu chí đạt)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!selectedEntry.is100Percent && (
                    <button
                      onClick={() => handleSingleStandardize(selectedEntry)}
                      disabled={singleFixingId === selectedEntry.id}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-xl transition shadow-md flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>⚡ Chuẩn Hóa 100% Ngay</span>
                    </button>
                  )}
                </div>
              </div>

              {/* LINK TRACE RESOLUTION BOX */}
              <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-indigo-300">
                  <Link2 className="w-4 h-4" />
                  <span>Truy Vết Hành Trình URL (Link Trace Resolution):</span>
                </div>
                <div className="space-y-1.5 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">1. URL Gốc Khi Load (Raw URL):</span>
                    <p className={`p-1.5 rounded border break-all ${
                      selectedEntry.isGoogleNewsRedirect 
                        ? 'bg-rose-950/30 text-rose-300 border-rose-800/40' 
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}>
                      {selectedEntry.rawUrl || '—'}
                    </p>
                  </div>

                  {selectedEntry.isGoogleNewsRedirect && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">2. URL Đã Giải Mã Từ Google News:</span>
                      <p className="p-1.5 bg-indigo-950/40 text-indigo-200 border border-indigo-800/40 rounded break-all">
                        {selectedEntry.unwrappedUrl || '—'}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-400 block text-[10px]">3. URL Đích Chuẩn Hóa Sạch (Canonical Cleaned URL):</span>
                    <p className="p-1.5 bg-emerald-950/30 text-emerald-300 border border-emerald-800/40 rounded break-all">
                      {selectedEntry.canonicalUrl || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 12 CRITERIA CHECKLIST */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-200 text-xs">Danh Sách 12 Tiêu Chuẩn Kiểm Định Schema:</h4>

                {/* Passed Checks */}
                {selectedEntry.passedChecks.length > 0 && (
                  <div className="space-y-1.5">
                    {selectedEntry.passedChecks.map((chk, cIdx) => (
                      <div key={cIdx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center gap-2 text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-medium text-slate-200">{chk}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Failed Reasons */}
                {selectedEntry.failureReasons.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <span className="font-bold text-amber-400 text-xs block">
                      Các tiêu chí chưa đạt ({selectedEntry.failureReasons.length}):
                    </span>
                    {selectedEntry.failureReasons.map((fail, fIdx) => (
                      <div
                        key={fIdx}
                        className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                          fail.severity === 'CRITICAL'
                            ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                            : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                        }`}
                      >
                        <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                          fail.severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'
                        }`} />
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-100">{fail.criterion}</div>
                          <p className="text-slate-300 leading-relaxed text-[11px]">{fail.description}</p>
                          <p className="text-indigo-300 text-[11px] font-semibold mt-1">
                            💡 Khắc phục: {fail.remedyAction}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 text-xs">
                Mã định danh: <code className="text-indigo-300 font-mono">{selectedEntry.id}</code>
              </span>
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StandardizationLogTable;
