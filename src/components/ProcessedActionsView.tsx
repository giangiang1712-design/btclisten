import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Calendar,
  Clock,
  Filter,
  Search,
  RotateCcw,
  ExternalLink,
  FileText,
  ShieldAlert,
  AlertTriangle,
  ArrowUpRight,
  Download,
  Copy,
  Check,
  Building2,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { ProcessedActionRecord, ScrapedNewsItem } from '../types';
import { cleanHtmlTitle } from '../lib/htmlDecoder';

interface ProcessedActionsViewProps {
  onOpenArticleDetail?: (article: ScrapedNewsItem) => void;
  onRestoreAction?: (articleId: string) => void;
  isDark?: boolean;
}

export type TimeFilterDays = 1 | 2 | 3 | 7 | 0; // 0 = all

export const ProcessedActionsView: React.FC<ProcessedActionsViewProps> = ({
  onOpenArticleDetail,
  onRestoreAction,
  isDark = false,
}) => {
  const [actions, setActions] = useState<ProcessedActionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDays, setSelectedDays] = useState<TimeFilterDays>(1); // Default: trong ngày (1 ngày)
  const [selectedTierFilter, setSelectedTierFilter] = useState<'ALL' | 'C4' | 'C3' | 'C1_C2'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [selectedActionDetail, setSelectedActionDetail] = useState<ProcessedActionRecord | null>(null);

  // Fetch actions from database endpoint /api/processed-actions
  const fetchActions = async (days: TimeFilterDays) => {
    setIsLoading(true);
    try {
      const daysQuery = days === 0 ? 'all' : days;
      const res = await fetch(`/api/processed-actions?days=${daysQuery}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.actions)) {
          setActions(json.actions);
        }
      }
    } catch (err) {
      console.warn('[ProcessedActionsView] Lỗi tải việc đã xử lý từ API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActions(selectedDays);
  }, [selectedDays]);

  // Handle Undo / Restore
  const handleUndo = async (action: ProcessedActionRecord) => {
    if (!window.confirm(`Bạn có chắc muốn khôi phục bài viết "${action.title.slice(0, 50)}..." về danh sách cần chỉ đạo?`)) {
      return;
    }
    try {
      await fetch(`/api/processed-actions/${action.id}`, { method: 'DELETE' });
      setActions((prev) => prev.filter((a) => a.id !== action.id && a.articleId !== action.articleId));
      if (onRestoreAction) {
        onRestoreAction(action.articleId);
      }
    } catch (err) {
      console.warn('[ProcessedActionsView] Lỗi hoàn tác:', err);
    }
  };

  // Copy summary to clipboard
  const handleCopyAction = (action: ProcessedActionRecord) => {
    const text = `[BÁO CÁO VIỆC ĐÃ XỬ LÝ]\n- Vấn đề: ${action.title}\n- Cấp độ: ${action.tier} (${action.importance})\n- Nguồn: ${action.source || 'Báo chí'}\n- Thời gian xử lý: ${new Date(action.handledAt).toLocaleString('vi-VN')}\n- Chỉ đạo: ${action.directiveLabel}\n- Giải pháp: ${action.solutionSummary || action.summary || 'Đã ban hành văn bản chỉ đạo hoàn tất'}\n- Đơn vị thực hiện: ${action.handledBy || 'Lãnh đạo Bộ'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(action.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Export report
  const handleExportReport = () => {
    setIsExporting(true);
    const filterLabel =
      selectedDays === 1
        ? 'Trong ngày (24 giờ)'
        : selectedDays === 2
        ? 'Trong 2 ngày (48 giờ)'
        : selectedDays === 3
        ? 'Trong 3 ngày (72 giờ)'
        : selectedDays === 7
        ? 'Trong 1 tuần (7 ngày)'
        : 'Toàn bộ thời gian';

    let content = `BÁO CÁO TỔNG HỢP CÁC VẤN ĐỀ ĐÃ XỬ LÝ\nThời gian lọc: ${filterLabel}\nNgày xuất: ${new Date().toLocaleString('vi-VN')}\nTổng số việc: ${filteredActions.length}\n` +
      `=======================================================\n\n`;

    filteredActions.forEach((act, idx) => {
      content += `${idx + 1}. [${act.tier}] ${act.title}\n`;
      content += `   - Nguồn: ${act.source || 'Báo chí'}\n`;
      content += `   - Thời gian hoàn tất: ${new Date(act.handledAt).toLocaleString('vi-VN')}\n`;
      content += `   - Phân cấp: ${act.importance === 'URGENT' ? 'Khẩn cấp' : act.importance === 'IMPORTANT' ? 'Trọng yếu' : 'Theo dõi & phòng ngừa'}\n`;
      content += `   - Hướng xử lý: ${act.directiveLabel}\n`;
      if (act.solutionSummary) {
        content += `   - Giải pháp: ${act.solutionSummary}\n`;
      }
      if (act.handledBy) {
        content += `   - Đơn vị/Lãnh đạo: ${act.handledBy}\n`;
      }
      content += `\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bao_cao_viec_da_xu_ly_${selectedDays}ngay_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  // Filter actions based on search and tier
  const filteredActions = useMemo(() => {
    return actions.filter((act) => {
      // Tier filter
      if (selectedTierFilter === 'C4' && act.tier !== 'C4') return false;
      if (selectedTierFilter === 'C3' && act.tier !== 'C3') return false;
      if (selectedTierFilter === 'C1_C2' && act.tier !== 'C1' && act.tier !== 'C2') return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = (act.title || '').toLowerCase().includes(q);
        const matchesSource = (act.source || '').toLowerCase().includes(q);
        const matchesDirective = (act.directiveLabel || '').toLowerCase().includes(q);
        const matchesSolution = (act.solutionSummary || '').toLowerCase().includes(q);
        const matchesHandler = (act.handledBy || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesSource && !matchesDirective && !matchesSolution && !matchesHandler) {
          return false;
        }
      }

      return true;
    });
  }, [actions, selectedTierFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    let c4 = 0;
    let c3 = 0;
    let c1c2 = 0;
    actions.forEach((a) => {
      if (a.tier === 'C4') c4++;
      else if (a.tier === 'C3') c3++;
      else c1c2++;
    });
    return { total: actions.length, c4, c3, c1c2 };
  }, [actions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner & Executive Metrics */}
      <div className="p-6 rounded-2xl bg-white border-2 border-slate-300 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-600 text-white shadow-md flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  VIỆC ĐÃ XỬ LÝ
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {stats.total} Đã hoàn tất
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-600 mt-1">
                Lưu trữ cơ sở dữ liệu các vấn đề báo chí & chỉ đạo khẩn đã được Lãnh đạo xử lý hoàn tất
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => fetchActions(selectedDays)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition cursor-pointer border border-slate-300 flex items-center gap-1.5"
              title="Tải lại cơ sở dữ liệu"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
            <button
              onClick={handleExportReport}
              disabled={filteredActions.length === 0 || isExporting}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black transition cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
              title="Xuất báo cáo văn bản"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Báo Cáo Xử Lý</span>
            </button>
          </div>
        </div>

        {/* 4 Mini Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-500 block">Tổng đã xử lý</span>
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">Trong mốc lọc</span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
            <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              C4: Khẩn cấp đã xử lý
            </span>
            <span className="text-2xl font-black text-rose-900">{stats.c4}</span>
            <span className="text-[11px] font-semibold text-rose-600 block mt-0.5">SLA 2-4h hoàn thành</span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              C3: Trọng yếu đã xử lý
            </span>
            <span className="text-2xl font-black text-amber-900">{stats.c3}</span>
            <span className="text-[11px] font-semibold text-amber-600 block mt-0.5">Xử lý trong 12-24h</span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
            <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              C1 & C2: Phòng ngừa
            </span>
            <span className="text-2xl font-black text-blue-900">{stats.c1c2}</span>
            <span className="text-[11px] font-semibold text-blue-600 block mt-0.5">Theo dõi & kiểm soát</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Time Range Filters & Controls */}
      <div className="p-5 rounded-2xl bg-white border-2 border-slate-300 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Main Time Range Tabs: Trong ngày, 2 ngày, 3 ngày, 1 tuần, Tất cả */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Khoảng thời gian xử lý:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { days: 1 as TimeFilterDays, label: 'Trong ngày (24h)' },
                { days: 2 as TimeFilterDays, label: 'Trong 2 ngày' },
                { days: 3 as TimeFilterDays, label: 'Trong 3 ngày' },
                { days: 7 as TimeFilterDays, label: 'Trong 1 tuần' },
                { days: 0 as TimeFilterDays, label: 'Tất cả thời gian' },
              ].map(({ days, label }) => {
                const isSelected = selectedDays === days;
                return (
                  <button
                    key={days}
                    onClick={() => setSelectedDays(days)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tier Level Filter */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider">
              <Filter className="w-4 h-4 text-slate-600" />
              <span>Cấp độ hành động:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'C4', label: '🚨 C4: Khẩn cấp' },
                { id: 'C3', label: '⚡ C3: Trọng yếu' },
                { id: 'C1_C2', label: '📌 C1-C2: Phòng ngừa' },
              ].map(({ id, label }) => {
                const isSelected = selectedTierFilter === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedTierFilter(id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative pt-2">
          <Search className="w-4 h-4 absolute left-3.5 top-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm vấn đề đã xử lý, tiêu đề bài viết, người xử lý, giải pháp đã áp dụng..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* 3. List of Resolved Actions */}
      <div className="space-y-3.5">
        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-2xl border-2 border-slate-300 shadow-sm space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-600">Đang truy vấn cơ sở dữ liệu việc đã xử lý...</p>
          </div>
        ) : filteredActions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border-2 border-slate-300 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Không có việc đã xử lý nào trong bộ lọc này</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
              Bạn có thể thay đổi mốc thời gian (2 ngày, 3 ngày, 1 tuần hoặc Tất cả) hoặc đánh dấu hoàn tất các vấn đề tại bảng "Chỉ Đạo & Xử Lý Khẩn".
            </p>
          </div>
        ) : (
          filteredActions.map((act) => {
            const isC4 = act.tier === 'C4';
            const isC3 = act.tier === 'C3';
            const handledTimeStr = new Date(act.handledAt).toLocaleString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });

            return (
              <div
                key={act.id}
                className={`p-5 rounded-2xl border-2 transition-all duration-200 bg-white hover:shadow-md space-y-4 ${
                  isC4
                    ? 'border-rose-200 hover:border-rose-300'
                    : isC3
                    ? 'border-amber-200 hover:border-amber-300'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                {/* Header Row: Tier + Status + Time + Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Tier Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-black flex items-center gap-1 ${
                        isC4
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : isC3
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
                      {isC4 ? '🚨 C4: KHẨN CẤP' : isC3 ? '⚡ C3: TRỌNG YẾU' : '📌 C1-C2: THEO DÕI'}
                    </span>

                    {/* Status Badge */}
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{act.directiveLabel || 'Đã xử lý xong'}</span>
                    </span>

                    {/* Source */}
                    {act.source && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                        {act.source}
                      </span>
                    )}
                  </div>

                  {/* Handled Timestamp */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hoàn tất lúc: {handledTimeStr}</span>
                  </div>
                </div>

                {/* Article Title & Link */}
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-snug hover:text-emerald-700 transition">
                    {cleanHtmlTitle(act.title, act.summary)}
                  </h3>
                  {act.summary && (
                    <p className="text-xs sm:text-sm font-medium text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
                      {act.summary}
                    </p>
                  )}
                </div>

                {/* Solution & Implementation Details */}
                {(act.solutionSummary || act.handledBy) && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    {act.solutionSummary && (
                      <div className="flex items-start gap-2">
                        <span className="font-black text-slate-800 shrink-0">Giải pháp chỉ đạo:</span>
                        <span className="font-semibold text-slate-700 leading-relaxed">{act.solutionSummary}</span>
                      </div>
                    )}
                    {act.handledBy && (
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800 shrink-0">Đơn vị / Phụ trách:</span>
                        <span className="font-semibold text-slate-600">{act.handledBy}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
                  <div className="flex items-center gap-2">
                    {act.url && (
                      <a
                        href={act.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Xem bài gốc</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={() => handleCopyAction(act)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition inline-flex items-center gap-1 cursor-pointer"
                      title="Sao chép nội dung xử lý"
                    >
                      {copiedId === act.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === act.id ? 'Đã sao chép' : 'Sao chép'}</span>
                    </button>
                  </div>

                  {/* Undo Button */}
                  <button
                    onClick={() => handleUndo(act)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 hover:text-rose-900 hover:bg-rose-50 transition inline-flex items-center gap-1 cursor-pointer"
                    title="Khôi phục lại vào danh sách cần xử lý"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Hoàn tác (Chưa xử lý)</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
