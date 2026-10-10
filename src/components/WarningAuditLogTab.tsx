import React, { useState, useMemo, useEffect } from 'react';
import { ScrapedNewsItem, WarningAlertLevelType } from '../types';
import {
  WarningAuditEntry,
  AuditFlagType,
  RiskThresholdHistoricalStats,
  auditArticlesForWarningDiscrepancies,
  computeRiskThresholdHistoricalStats,
  saveHumanAuditAction,
  resetHumanAuditAction,
  loadStoredHumanAuditActions,
} from '../lib/warningAuditService';
import { useTheme } from '../lib/theme';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Filter,
  BarChart3,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Database,
  Cpu,
  Zap,
  TrendingUp,
  FileSearch,
  HelpCircle
} from 'lucide-react';

interface WarningAuditLogTabProps {
  currentItem: ScrapedNewsItem;
  allNews?: ScrapedNewsItem[];
  onOverrideArticle?: (updatedItem: ScrapedNewsItem) => void;
}

export const WarningAuditLogTab: React.FC<WarningAuditLogTabProps> = ({
  currentItem,
  allNews = [],
  onOverrideArticle,
}) => {
  const { isDark } = useTheme();

  // Combine currentItem with allNews if not present
  const fullArticleList = useMemo(() => {
    const list = [...allNews];
    if (currentItem && !list.some((a) => a.id === currentItem.id)) {
      list.unshift(currentItem);
    }
    return list;
  }, [allNews, currentItem]);

  const [filterType, setFilterType] = useState<'ALL' | 'LEVEL_DISCREPANCY' | 'FILL_DATA' | 'PENDING' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeThresholdBucket, setActiveThresholdBucket] = useState<string | null>(null);
  const [overrideMenuOpenId, setOverrideMenuOpenId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for storage changes
  useEffect(() => {
    const handleUpdate = () => {
      setRefreshKey((k) => k + 1);
    };
    window.addEventListener('finpulse-audit-actions-updated', handleUpdate);
    return () => window.removeEventListener('finpulse-audit-actions-updated', handleUpdate);
  }, []);

  // Run audit for 7 days lookback
  const { entries, totalScanned, levelDiscrepancyCount, fillDataCount } = useMemo(() => {
    return auditArticlesForWarningDiscrepancies(fullArticleList, 7);
  }, [fullArticleList, refreshKey]);

  // Compute threshold historical stats (20, 40, 60, 75 points)
  const stats: RiskThresholdHistoricalStats = useMemo(() => {
    return computeRiskThresholdHistoricalStats(fullArticleList);
  }, [fullArticleList, refreshKey]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (filterType === 'LEVEL_DISCREPANCY' && e.flagType !== 'LEVEL_DISCREPANCY' && e.flagType !== 'BOTH') return false;
      if (filterType === 'FILL_DATA' && e.flagType !== 'FILL_DATA' && e.flagType !== 'BOTH') return false;
      if (filterType === 'PENDING' && e.auditStatus !== 'PENDING') return false;
      if (filterType === 'RESOLVED' && e.auditStatus === 'PENDING') return false;

      if (activeThresholdBucket) {
        const bucket = Object.values(stats.buckets).find((b) => b.id === activeThresholdBucket);
        if (bucket) {
          if (e.riskScore < bucket.min || e.riskScore > bucket.max) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const t = (e.title || '').toLowerCase();
        const s = (e.source || '').toLowerCase();
        const r = (e.flagReason || '').toLowerCase();
        return t.includes(q) || s.includes(q) || r.includes(q);
      }
      return true;
    });
  }, [entries, filterType, activeThresholdBucket, searchQuery, stats.buckets]);

  const handleApprove = (entry: WarningAuditEntry) => {
    saveHumanAuditAction(entry.articleId, {
      status: 'APPROVED',
      note: 'Human-in-the-loop đã kiểm tra và phê duyệt, giữ nguyên phân loại.'
    });
    setRefreshKey((k) => k + 1);
  };

  const handleDismiss = (entry: WarningAuditEntry) => {
    saveHumanAuditAction(entry.articleId, {
      status: 'DISMISSED',
      overriddenLevel: 'STANDARD',
      note: 'Đã gắn cờ loại trừ tin giả/tin lấp đầy khỏi luồng cảnh báo khẩn cấp.'
    });
    if (onOverrideArticle && entry.originalArticle) {
      onOverrideArticle({
        ...entry.originalArticle,
        isEmergency: false,
        warningPipeline: entry.originalArticle.warningPipeline ? {
          ...entry.originalArticle.warningPipeline,
          level3Action: {
            ...entry.originalArticle.warningPipeline.level3Action,
            alertLevel: 'STANDARD',
            alertLevelLabelVi: 'Đã qua xử lý Human-in-the-loop (Loại trừ tin giả/lấp đầy)',
            requiresAction: false
          }
        } : undefined
      });
    }
    setRefreshKey((k) => k + 1);
  };

  const handleOverrideLevel = (entry: WarningAuditEntry, targetLevel: WarningAlertLevelType) => {
    let targetScore = entry.riskScore;
    if (targetLevel === 'EMERGENCY' && targetScore < 75) targetScore = 80;
    else if (targetLevel === 'RAPID' && (targetScore < 60 || targetScore >= 75)) targetScore = 65;
    else if (targetLevel === 'EARLY' && (targetScore < 40 || targetScore >= 60)) targetScore = 48;
    else if (targetLevel === 'DISTANT' && (targetScore < 20 || targetScore >= 40)) targetScore = 28;
    else if (targetLevel === 'STANDARD' && targetScore >= 20) targetScore = 15;

    saveHumanAuditAction(entry.articleId, {
      status: 'OVERRIDDEN',
      overriddenLevel: targetLevel,
      overriddenRiskScore: targetScore,
      note: `Human-in-the-loop điều chỉnh thủ công sang cấp ${targetLevel} (${targetScore} điểm).`
    });

    if (onOverrideArticle && entry.originalArticle) {
      const updatedArticle = {
        ...entry.originalArticle,
        riskScore: targetScore,
        warningPipeline: entry.originalArticle.warningPipeline ? {
          ...entry.originalArticle.warningPipeline,
          level2Risk: {
            ...entry.originalArticle.warningPipeline.level2Risk,
            riskScore: targetScore
          },
          level3Action: {
            ...entry.originalArticle.warningPipeline.level3Action,
            alertLevel: targetLevel,
            alertLevelLabelVi: `Thủ công: ${targetLevel}`
          }
        } : undefined
      };
      onOverrideArticle(updatedArticle);
    }

    setOverrideMenuOpenId(null);
    setRefreshKey((k) => k + 1);
  };

  const handleReset = (entry: WarningAuditEntry) => {
    resetHumanAuditAction(entry.articleId);
    setRefreshKey((k) => k + 1);
  };

  const getLevelBadgeClass = (lvl: WarningAlertLevelType) => {
    switch (lvl) {
      case 'EMERGENCY':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'RAPID':
        return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30';
      case 'EARLY':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'DISTANT':
        return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  const getLevelLabel = (lvl: WarningAlertLevelType) => {
    switch (lvl) {
      case 'EMERGENCY':
        return '🚨 Cấp 4: Khẩn cấp (75–100đ)';
      case 'RAPID':
        return '⚡ Cấp 3: Nhanh (60–74đ)';
      case 'EARLY':
        return '⏳ Cấp 2: Sớm (40–59đ)';
      case 'DISTANT':
        return '📡 Cấp 1: Xa (20–39đ)';
      default:
        return '📋 Tiêu chuẩn (<20đ)';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER & OVERVIEW STATS */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <FileSearch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Audit Log & Kiểm Toán Tính Toàn Vẹn Cảnh Báo
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                  7 NGÀY QUA
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Rà soát các bài viết bị gắn cờ "sai lệch mức độ" hoặc "dữ liệu lấp đầy", hỗ trợ Human-in-the-loop phê duyệt & hiệu chỉnh ngưỡng cứng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Tổng quét: <strong>{totalScanned}</strong> bài
            </span>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Sai lệch mức độ</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-500">
              {levelDiscrepancyCount}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Bài có điểm risk mâu thuẫn với cấp cảnh báo (vd: &lt;40đ ở Cấp 2)
            </p>
          </div>

          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Dữ liệu lấp đầy / Mẫu</span>
              <Database className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-500">
              {fillDataCount}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Bài viết dạng synthetic, placeholder hoặc ID mẫu thử nghiệm
            </p>
          </div>

          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Tin bài thực tế</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-500">
              {stats.realTotal}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Chiếm {stats.totalAnalyzed > 0 ? ((stats.realTotal / stats.totalAnalyzed) * 100).toFixed(1) : 0}% tổng cơ sở dữ liệu
            </p>
          </div>

          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Đã Human xử lý</span>
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-500">
              {entries.filter(e => e.auditStatus !== 'PENDING').length}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Đã được chuyên viên phê duyệt hoặc điều chỉnh mức cảnh báo
            </p>
          </div>
        </div>
      </div>

      {/* 2. BIỂU ĐỒ TRỰC QUAN HÓA DỮ LIỆU LỊCH SỬ CÁC NGƯỠNG CẢNH BÁO (20, 40, 60, 75 ĐIỂM) */}
      <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white">
              Phân Phối Lịch Sử Theo 4 Ngưỡng Cảnh Báo (20, 40, 60, 75 Điểm)
            </h4>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            So sánh: <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1 align-middle" />Tin thực tế vs{' '}
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500 mr-1 align-middle" />Tin lấp đầy/giả
          </span>
        </div>

        {/* Interactive Breakdown Visualizer */}
        <div className="space-y-3">
          {Object.values(stats.buckets).map((bucket) => {
            const isSelected = activeThresholdBucket === bucket.id;
            return (
              <div
                key={bucket.id}
                onClick={() => setActiveThresholdBucket(isSelected ? null : bucket.id)}
                className={`p-3 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? (isDark ? 'bg-slate-850 border-indigo-500 ring-1 ring-indigo-500/50' : 'bg-indigo-50/50 border-indigo-400 ring-1 ring-indigo-300')
                    : (isDark ? 'bg-slate-950/40 hover:bg-slate-950 border-slate-800' : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200')
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5 flex-wrap gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: bucket.color }}
                    />
                    <strong className="font-bold text-slate-900 dark:text-white">
                      {bucket.name}
                    </strong>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {bucket.rangeLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Thực tế: <strong>{bucket.realCount}</strong> ({bucket.realPct}%)
                    </span>
                    <span className="text-purple-600 dark:text-purple-400">
                      Lấp đầy: <strong>{bucket.fillCount}</strong> ({bucket.fillPct}%)
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Tổng: {bucket.totalCount} bài
                    </span>
                  </div>
                </div>

                {/* Progress bars: Dual stacked comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Tỷ lệ bài viết thực tế</span>
                      <span className="font-mono">{bucket.realPct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, bucket.realPct)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Tỷ lệ dữ liệu lấp đầy / giả</span>
                      <span className="font-mono">{bucket.fillPct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, bucket.fillPct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>SOP tác chiến: {bucket.actionSop}</span>
                  <span className="text-[10px] underline text-indigo-500">
                    {isSelected ? 'Bỏ lọc nhóm này' : 'Nhấn để lọc danh sách bên dưới'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Insight Box: Tinh Chỉnh Cấu Hình Ngưỡng Cứng */}
        <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
          isDark ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-950'
        }`}>
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h5 className="font-bold">
              Nhận Định Chuyên Môn Về Cấu Hình Ngưỡng Cứng (Hard Threshold Calibration)
            </h5>
            <p className="leading-relaxed">
              {stats.calibrationInsight.summary} {stats.calibrationInsight.recommendation}
            </p>
            <p className="text-[11px] opacity-80">
              ⚡ <strong>Quy chuẩn nghiêm ngặt:</strong> Cấp 2 ("Cần lưu tâm") bắt buộc có điểm risk từ <strong>40 đến 59 điểm</strong>. Các bài viết có điểm risk &lt; 40 điểm bị loại bỏ tuyệt đối khỏi Cấp 2 và đưa về đúng Cấp 1 (20–39đ: Cảnh báo xa) hoặc Tiêu chuẩn (&lt;20đ: Không cảnh báo).
            </p>
          </div>
        </div>
      </div>

      {/* 3. BẢNG AUDIT LOG CHI TIẾT & NÚT HUMAN-IN-THE-LOOP */}
      <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <span>Danh Sách Bài Viết Bị Gắn Cờ Trong 7 Ngày Qua</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                {filteredEntries.length} mục
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Liệt kê chi tiết lý do gắn cờ và cung cấp công cụ Human-in-the-loop điều chỉnh thủ công
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả ({entries.length})
            </button>
            <button
              onClick={() => setFilterType('LEVEL_DISCREPANCY')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterType === 'LEVEL_DISCREPANCY'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Sai lệch mức ({levelDiscrepancyCount})
            </button>
            <button
              onClick={() => setFilterType('FILL_DATA')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterType === 'FILL_DATA'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Dữ liệu lấp đầy ({fillDataCount})
            </button>
            <button
              onClick={() => setFilterType('PENDING')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterType === 'PENDING'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Chờ duyệt ({entries.filter(e => e.auditStatus === 'PENDING').length})
            </button>
          </div>
        </div>

        {/* Search input & active filter chips */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề, nguồn tin hoặc lý do gắn cờ..."
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border transition outline-none ${
                isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
          {activeThresholdBucket && (
            <button
              onClick={() => setActiveThresholdBucket(null)}
              className="px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 text-indigo-500 border-indigo-400/40 bg-indigo-500/10 cursor-pointer"
            >
              <span>Xóa lọc mốc điểm</span>
              <span>×</span>
            </button>
          )}
        </div>

        {/* Audit Items List */}
        {filteredEntries.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
            <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              Không có bài viết nào vi phạm quy tắc gắn cờ trong điều kiện lọc hiện tại.
            </p>
            <p className="text-xs text-slate-400">
              Toàn bộ các bài viết đã được đối chiếu nghiêm ngặt với các mốc điểm 20, 40, 60, 75 điểm.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map((entry) => {
              const isResolved = entry.auditStatus !== 'PENDING';
              const isOverrideMenuOpen = overrideMenuOpenId === entry.articleId;

              return (
                <div
                  key={entry.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition ${
                    isResolved
                      ? (isDark ? 'bg-slate-950/30 border-slate-800 opacity-80' : 'bg-slate-50/80 border-slate-200 opacity-90')
                      : (isDark ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-xs hover:border-slate-300')
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.flagType === 'LEVEL_DISCREPANCY' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Sai Lệch Mức Độ</span>
                          </span>
                        )}
                        {entry.flagType === 'FILL_DATA' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            <span>Dữ Liệu Lấp Đầy / Giả</span>
                          </span>
                        )}
                        {entry.flagType === 'BOTH' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Sai Lệch Mức & Lấp Đầy</span>
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400 font-medium">
                          Nguồn: <strong>{entry.source}</strong> • {entry.publishedAt}
                        </span>

                        {isResolved && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>{entry.auditStatus === 'APPROVED' ? 'Đã duyệt' : entry.auditStatus === 'OVERRIDDEN' ? 'Đã điều chỉnh thủ công' : 'Đã loại trừ'}</span>
                          </span>
                        )}
                      </div>

                      <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                        {entry.title}
                      </h5>

                      {/* Reason Box */}
                      <div className={`p-2.5 rounded-lg text-xs border ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-amber-50/60 border-amber-200'
                      }`}>
                        <div className="flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-amber-600 dark:text-amber-400">Lý do kiểm toán: </span>
                            <span className="text-slate-700 dark:text-slate-300 leading-relaxed">
                              {entry.flagReason}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Metrics Badges */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
                        <span className="px-2 py-0.5 rounded border text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          Risk Score: <strong className="text-amber-500">{entry.riskScore}đ</strong>
                          {entry.formulaMetrics && ` (S=${entry.formulaMetrics.S}, D=${entry.formulaMetrics.D}, V=${entry.formulaMetrics.V}, I=${entry.formulaMetrics.I})`}
                        </span>

                        <div className="flex items-center gap-1 text-[11px]">
                          <span>Mức hiện tại:</span>
                          <span className={`px-2 py-0.5 rounded border font-bold ${getLevelBadgeClass(entry.assignedAlertLevel)}`}>
                            {entry.assignedAlertLevel}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span>Ngưỡng chuẩn (20-40-60-75):</span>
                          <span className={`px-2 py-0.5 rounded border font-bold ${getLevelBadgeClass(entry.expectedAlertLevel)}`}>
                            {entry.expectedAlertLevel}
                          </span>
                        </div>
                      </div>

                      {entry.humanNote && (
                        <p className="text-[11px] text-blue-500 dark:text-blue-400 italic">
                          Ghi chú Human-in-the-loop: {entry.humanNote}
                        </p>
                      )}
                    </div>

                    {/* HUMAN-IN-THE-LOOP ACTION BUTTONS */}
                    <div className="flex flex-col sm:items-end gap-2 shrink-0 pt-2 sm:pt-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {entry.auditStatus === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleApprove(entry)}
                              title="Phê duyệt đánh giá của hệ thống là đúng"
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Phê duyệt</span>
                            </button>

                            <div className="relative">
                              <button
                                onClick={() => setOverrideMenuOpenId(isOverrideMenuOpen ? null : entry.articleId)}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition flex items-center gap-1 cursor-pointer"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>Điều chỉnh mức</span>
                              </button>

                              {/* Dropdown Menu for Overriding Level */}
                              {isOverrideMenuOpen && (
                                <div className={`absolute right-0 top-full mt-1 w-56 rounded-xl border shadow-xl z-30 p-1.5 space-y-1 ${
                                  isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                                }`}>
                                  <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                                    Chọn Cấp Độ Chuẩn
                                  </div>
                                  <button
                                    onClick={() => handleOverrideLevel(entry, 'STANDARD')}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-between"
                                  >
                                    <span>📋 Tiêu chuẩn (&lt; 20đ)</span>
                                    <span className="text-[10px] text-slate-400">0–19đ</span>
                                  </button>
                                  <button
                                    onClick={() => handleOverrideLevel(entry, 'DISTANT')}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-500/10 text-indigo-500 transition flex items-center justify-between"
                                  >
                                    <span>📡 Cấp 1: Cảnh báo xa</span>
                                    <span className="text-[10px]">20–39đ</span>
                                  </button>
                                  <button
                                    onClick={() => handleOverrideLevel(entry, 'EARLY')}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-500/10 text-amber-500 transition flex items-center justify-between"
                                  >
                                    <span>⏳ Cấp 2: Cần lưu tâm</span>
                                    <span className="text-[10px]">40–59đ</span>
                                  </button>
                                  <button
                                    onClick={() => handleOverrideLevel(entry, 'RAPID')}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-orange-500/10 text-orange-500 transition flex items-center justify-between"
                                  >
                                    <span>⚡ Cấp 3: Cảnh báo nhanh</span>
                                    <span className="text-[10px]">60–74đ</span>
                                  </button>
                                  <button
                                    onClick={() => handleOverrideLevel(entry, 'EMERGENCY')}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-rose-500/10 text-rose-500 transition flex items-center justify-between"
                                  >
                                    <span>🚨 Cấp 4: Khẩn cấp</span>
                                    <span className="text-[10px]">75–100đ</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {entry.isFillData && (
                              <button
                                onClick={() => handleDismiss(entry)}
                                title="Loại trừ tin giả/lấp đầy khỏi chuông báo"
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 transition flex items-center gap-1 cursor-pointer"
                              >
                                <Database className="w-3.5 h-3.5" />
                                <span>Loại trừ tin lấp đầy</span>
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => handleReset(entry)}
                            title="Hoàn tác về trạng thái ban đầu"
                            className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Khôi phục</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
