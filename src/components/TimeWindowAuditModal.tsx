import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  X,
  ExternalLink,
  Info,
  Calendar,
  Layers,
  Filter,
  Globe,
  Link2,
  AlertOctagon,
  FileSearch,
  Sparkles,
  Search,
} from 'lucide-react';
import { ScrapedNewsItem, TimeRange } from '../types';
import { parseStrictArticleTimestamp } from '../services/api';
import {
  getVietnamCurrentTimeAndWindow,
  compareArticleUtcVsVietnamTimestamp,
  formatVietnamDateTime,
  formatUtcDateTime,
} from '../lib/timestampDebugger';

interface TimeWindowAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentArticles: ScrapedNewsItem[];
  timeRange: string;
  timeBounds?: {
    startMs?: number;
    endMs?: number;
    scannedWindow?: string;
    vnStartTimeStr?: string;
    vnEndTimeStr?: string;
  };
  onTriggerScan?: (range: string) => void;
}

export interface LinkAuditResult {
  status: 'ok' | 'dead_link' | 'mismatch' | 'invalid_url' | 'checking';
  statusCode?: number;
  finalUrl?: string;
  pageTitle?: string;
  similarityScore?: number;
  reason?: string;
  canReadArticle?: boolean;
  isMatch?: boolean;
  checkedAt?: number;
}

export const TimeWindowAuditModal: React.FC<TimeWindowAuditModalProps> = ({
  isOpen,
  onClose,
  currentArticles,
  timeRange,
  timeBounds,
  onTriggerScan,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'liveTest'>('current');
  const [testTimeRange, setTestTimeRange] = useState<string>('1h');
  const [isRunningLiveTest, setIsRunningLiveTest] = useState<boolean>(false);
  const [autoVerifyLinksInLive, setAutoVerifyLinksInLive] = useState<boolean>(true);
  const [liveTestResult, setLiveTestResult] = useState<any | null>(null);
  const [filterType, setFilterType] = useState<
    'all' | 'valid' | 'invalid' | 'link_ok' | 'link_dead' | 'link_mismatch'
  >('all');

  // Link verification state
  const [linkAuditMap, setLinkAuditMap] = useState<Record<string, LinkAuditResult>>({});
  const [isAuditingBatch, setIsAuditingBatch] = useState<boolean>(false);
  const [auditProgress, setAuditProgress] = useState<{ current: number; total: number } | null>(null);

  if (!isOpen) return null;

  const now = Date.now();
  const tr = (timeRange as TimeRange) || '24h';
  const windowInfo = getVietnamCurrentTimeAndWindow(tr, timeBounds?.endMs || now);
  const expectedStartMs = timeBounds?.startMs || windowInfo.startTimeMs;
  const expectedEndMs = timeBounds?.endMs || windowInfo.endTimeMs;
  const graceBufferMs = 3 * 60 * 1000; // 3 min server drift allowance

  // Evaluate current articles time compliance
  const auditedArticles = currentArticles.map((art, index) => {
    const artId = art.id || `art-${index}-${art.url || 'nourl'}`;
    const pubMs = parseStrictArticleTimestamp(art, expectedEndMs);
    const comparison = compareArticleUtcVsVietnamTimestamp(art, {
      timeRange: tr,
      referenceNowMs: expectedEndMs,
      customStartTimeMs: expectedStartMs,
      customEndTimeMs: expectedEndMs,
    });

    let status: 'valid' | 'too_early' | 'future' | 'no_date' = 'valid';
    let deltaMinutes = 0;

    if (!pubMs || isNaN(pubMs)) {
      status = 'no_date';
    } else if (pubMs < expectedStartMs - graceBufferMs) {
      status = 'too_early';
      deltaMinutes = Math.round((expectedStartMs - pubMs) / 60000);
    } else if (pubMs > expectedEndMs + graceBufferMs) {
      status = 'future';
      deltaMinutes = Math.round((pubMs - expectedEndMs) / 60000);
    }

    return {
      ...art,
      artId,
      pubMs: pubMs || 0,
      auditStatus: status,
      deltaMinutes,
      comparison,
    };
  });

  const validTimeCount = auditedArticles.filter((a) => a.auditStatus === 'valid').length;
  const invalidTimeCount = auditedArticles.length - validTimeCount;
  const timePassRate =
    auditedArticles.length > 0
      ? ((validTimeCount / auditedArticles.length) * 100).toFixed(1)
      : '100.0';

  // Link audit statistics
  const checkedLinks = Object.values(linkAuditMap);
  const linkOkCount = checkedLinks.filter((r) => r.status === 'ok').length;
  const linkDeadCount = checkedLinks.filter(
    (r) => r.status === 'dead_link' || r.status === 'invalid_url'
  ).length;
  const linkMismatchCount = checkedLinks.filter((r) => r.status === 'mismatch').length;
  const totalCheckedLinks = checkedLinks.filter((r) => r.status !== 'checking').length;
  const linkPassRate =
    totalCheckedLinks > 0
      ? ((linkOkCount / totalCheckedLinks) * 100).toFixed(1)
      : null;

  const timestamps = auditedArticles
    .filter((a) => a.pubMs > 0)
    .map((a) => a.pubMs);
  const minTs = timestamps.length > 0 ? Math.min(...timestamps) : null;
  const maxTs = timestamps.length > 0 ? Math.max(...timestamps) : null;

  const formatVn = (ts?: number | null) => {
    if (!ts) return 'Không xác định';
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(ts));
  };

  // Filter list by time compliance and link integrity
  const displayedList = auditedArticles.filter((item) => {
    const linkRes = linkAuditMap[item.artId];
    if (filterType === 'valid') return item.auditStatus === 'valid';
    if (filterType === 'invalid') return item.auditStatus !== 'valid';
    if (filterType === 'link_ok') return linkRes?.status === 'ok';
    if (filterType === 'link_dead')
      return linkRes?.status === 'dead_link' || linkRes?.status === 'invalid_url';
    if (filterType === 'link_mismatch') return linkRes?.status === 'mismatch';
    return true;
  });

  // Verify a single article's link
  const handleVerifySingleLink = async (item: (typeof auditedArticles)[0]) => {
    setLinkAuditMap((prev) => ({
      ...prev,
      [item.artId]: { status: 'checking' },
    }));

    try {
      const res = await fetch('/api/audit/verify-article-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: item.url,
          expectedTitle: item.title,
          id: item.artId,
        }),
      });
      const data = await res.json();
      if (data && data.success) {
        setLinkAuditMap((prev) => ({
          ...prev,
          [item.artId]: {
            status: data.status,
            statusCode: data.statusCode,
            finalUrl: data.finalUrl,
            pageTitle: data.pageTitle,
            similarityScore: data.similarityScore,
            reason: data.reason,
            canReadArticle: data.canReadArticle,
            isMatch: data.isMatch,
            checkedAt: data.checkedAt,
          },
        }));
      } else {
        setLinkAuditMap((prev) => ({
          ...prev,
          [item.artId]: {
            status: 'dead_link',
            reason: data?.error || 'Lỗi khi gọi API kiểm tra link',
            checkedAt: Date.now(),
          },
        }));
      }
    } catch (err: any) {
      setLinkAuditMap((prev) => ({
        ...prev,
        [item.artId]: {
          status: 'dead_link',
          reason: `Lỗi mạng client: ${err?.message || 'Không thể kết nối máy chủ'}`,
          checkedAt: Date.now(),
        },
      }));
    }
  };

  // Verify all links in batch
  const handleVerifyAllLinks = async () => {
    if (auditedArticles.length === 0 || isAuditingBatch) return;

    setIsAuditingBatch(true);
    setAuditProgress({ current: 0, total: auditedArticles.length });

    // Mark all as checking
    const initialMap: Record<string, LinkAuditResult> = {};
    auditedArticles.forEach((art) => {
      initialMap[art.artId] = { status: 'checking' };
    });
    setLinkAuditMap((prev) => ({ ...prev, ...initialMap }));

    const BATCH_SIZE = 8;
    const items = auditedArticles.map((art) => ({
      id: art.artId,
      url: art.url,
      title: art.title,
    }));

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const chunk = items.slice(i, i + BATCH_SIZE);
      try {
        const res = await fetch('/api/audit/verify-links-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: chunk }),
        });
        const data = await res.json();
        if (data && data.success && Array.isArray(data.results)) {
          setLinkAuditMap((prev) => {
            const next = { ...prev };
            data.results.forEach((r: any) => {
              if (r.id) {
                next[r.id] = {
                  status: r.status,
                  statusCode: r.statusCode,
                  finalUrl: r.finalUrl,
                  pageTitle: r.pageTitle,
                  similarityScore: r.similarityScore,
                  reason: r.reason,
                  canReadArticle: r.canReadArticle,
                  isMatch: r.isMatch,
                  checkedAt: r.checkedAt,
                };
              }
            });
            return next;
          });
        }
      } catch (err) {
        console.error('Lỗi khi kiểm định batch link:', err);
      }

      setAuditProgress({
        current: Math.min(i + BATCH_SIZE, items.length),
        total: items.length,
      });
    }

    setIsAuditingBatch(false);
    setAuditProgress(null);
  };

  // Live sandbox test run
  const handleRunLiveTest = async () => {
    setIsRunningLiveTest(true);
    setLiveTestResult(null);
    try {
      const startMs =
        testTimeRange === '1h'
          ? Date.now() - 60 * 60 * 1000
          : Date.now() - 24 * 60 * 60 * 1000;
      const endMs = Date.now();

      const res = await fetch('/api/scrape/financial-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeRange: testTimeRange,
          sector: 'all',
          startMs,
          endMs,
        }),
      });
      const data = await res.json();

      if (data && data.success) {
        const news: any[] = data.news || [];
        let timeFails = 0;
        const evaluated = news.map((item, idx) => {
          const artId = item.id || `live-${idx}-${item.url || 'nourl'}`;
          const ts =
            item.publishedTimestamp ||
            (item.publishedAt ? new Date(item.publishedAt).getTime() : 0);
          const isOk = ts >= startMs && ts <= endMs + graceBufferMs;
          if (!isOk) timeFails++;
          return { ...item, artId, ts, isOk };
        });

        let linkAuditResults: any[] = [];
        let linkFails = 0;
        let linkMismatches = 0;

        if (autoVerifyLinksInLive && news.length > 0) {
          const verifyItems = evaluated.map((art) => ({
            id: art.artId,
            url: art.url,
            title: art.title,
          }));

          try {
            const linkRes = await fetch('/api/audit/verify-links-batch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: verifyItems }),
            });
            const linkData = await linkRes.json();
            if (linkData && linkData.success && Array.isArray(linkData.results)) {
              linkAuditResults = linkData.results;
              linkFails = linkData.deadCount || 0;
              linkMismatches = linkData.mismatchCount || 0;
            }
          } catch (e) {
            console.error('Lỗi khi audit links trong sandbox:', e);
          }
        }

        setLiveTestResult({
          total: news.length,
          timeFails,
          linkFails,
          linkMismatches,
          linkAuditResults,
          evaluated,
          startMs,
          endMs,
          timePassRate:
            news.length > 0
              ? (((news.length - timeFails) / news.length) * 100).toFixed(1)
              : '100.0',
          linkPassRate:
            linkAuditResults.length > 0
              ? (
                  ((linkAuditResults.length - linkFails - linkMismatches) /
                    linkAuditResults.length) *
                  100
                ).toFixed(1)
              : null,
        });
      }
    } catch (err: any) {
      console.error('Lỗi kiểm thử live:', err);
    } finally {
      setIsRunningLiveTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 dark:from-slate-900 dark:via-indigo-950/40 dark:to-emerald-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                <span>Hệ Thống Kiểm Định Kép: Khung Giờ & Toàn Vẹn Liên Kết Tin Tức</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold font-mono">
                  Phiên: {timeRange.toUpperCase()}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Xác thực 100% mốc thời gian xuất bản (`publishedTimestamp`) & kiểm tra khả năng đọc bài viết, chống link lỗi 404 hoặc trỏ sai bài
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-sm">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'current'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              Kiểm Định Bảng Tin Hiện Tại ({currentArticles.length} bài)
            </button>
            <button
              onClick={() => setActiveTab('liveTest')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'liveTest'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Play className="w-4 h-4" />
              Phiên Kiểm Thử Trực Tiếp (Live API Sandbox)
            </button>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'current' && (
              <button
                type="button"
                disabled={isAuditingBatch || auditedArticles.length === 0}
                onClick={handleVerifyAllLinks}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isAuditingBatch ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      Đang đọc thử {auditProgress?.current}/{auditProgress?.total}...
                    </span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    <span>Kiểm tra toàn bộ link & nội dung</span>
                  </>
                )}
              </button>
            )}

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              {formatVn(now)}
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'current' ? (
            <>
              {/* Scorecard Metrics: 4 Primary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Tổng bài */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    Tổng bài viết
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {auditedArticles.length}
                    </span>
                    <span className="text-xs text-slate-500">bài hiển thị</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Đã kiểm tra link: <strong className="text-slate-700 dark:text-slate-300">{totalCheckedLinks}/{auditedArticles.length}</strong>
                  </div>
                </div>

                {/* 2. Tuân thủ khung giờ */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    Tuân thủ khung giờ
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span
                      className={`text-2xl font-bold ${
                        Number(timePassRate) >= 99
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {timePassRate}%
                    </span>
                    <span className="text-xs text-emerald-600 font-semibold">
                      ({validTimeCount}/{auditedArticles.length} hợp lệ)
                    </span>
                  </div>
                  <div className="text-[11px] mt-1">
                    {invalidTimeCount === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">✅ Không có bài lệch giờ</span>
                    ) : (
                      <span className="text-red-500 font-medium">⚠️ {invalidTimeCount} bài xuất bản ngoài khung</span>
                    )}
                  </div>
                </div>

                {/* 3. Toàn vẹn Link & Đọc bài */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    Toàn vẹn Link & Khớp bài
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    {totalCheckedLinks > 0 ? (
                      <>
                        <span
                          className={`text-2xl font-bold ${
                            Number(linkPassRate) >= 95
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : Number(linkPassRate) >= 80
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {linkPassRate}%
                        </span>
                        <span className="text-xs text-emerald-600 font-semibold">
                          ({linkOkCount}/{totalCheckedLinks} link tốt)
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-slate-400 italic">
                        Chưa chạy kiểm tra link
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] mt-1 text-slate-500">
                    {linkDeadCount > 0 && (
                      <span className="text-red-500 font-bold mr-2">❌ {linkDeadCount} link lỗi</span>
                    )}
                    {linkMismatchCount > 0 && (
                      <span className="text-amber-600 font-bold">⚠️ {linkMismatchCount} trỏ sai bài</span>
                    )}
                    {totalCheckedLinks > 0 && linkDeadCount === 0 && linkMismatchCount === 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">✅ 100% link mở đọc tốt</span>
                    )}
                  </div>
                </div>

                {/* 4. Kết luận kiểm định kép */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                    Kết luận kiểm định
                  </span>
                  <div className="mt-2">
                    {invalidTimeCount === 0 && linkDeadCount === 0 && linkMismatchCount === 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4" /> ĐẠT CHUẨN KÉP 100%
                      </span>
                    ) : linkDeadCount > 0 || linkMismatchCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-300">
                        <AlertTriangle className="w-4 h-4" /> PHÁT HIỆN LINK LỖI
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                        <AlertTriangle className="w-4 h-4" /> CÓ BÀI LỆCH GIỜ
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    Đảm bảo người dùng bấm vào đọc được chính xác bài viết trong khung giờ.
                  </p>
                </div>
              </div>

              {/* Boundary Comparison Card */}
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs space-y-2">
                <div className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  Mốc Khung Giờ Yêu Cầu vs Thực Tế Dữ Liệu
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-mono text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-500">Khung giờ chọn:</span>{' '}
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      {formatVn(expectedStartMs)} ➔ {formatVn(expectedEndMs)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Phạm vi bài thu được:</span>{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatVn(minTs)} ➔ {formatVn(maxTs)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Bảng Chi Tiết Mốc Thời Gian & Tính Toàn Vẹn Từng Bài Viết
                </h4>
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      filterType === 'all'
                        ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Tất cả ({auditedArticles.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('valid')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      filterType === 'valid'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Giờ hợp lệ ({validTimeCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('invalid')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      filterType === 'invalid'
                        ? 'bg-red-600 text-white font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Lệch giờ ({invalidTimeCount})
                  </button>

                  {totalCheckedLinks > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setFilterType('link_ok')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          filterType === 'link_ok'
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                      >
                        Link đọc tốt ({linkOkCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterType('link_dead')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          filterType === 'link_dead'
                            ? 'bg-red-600 text-white font-bold'
                            : 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                        }`}
                      >
                        Link lỗi 404 ({linkDeadCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterType('link_mismatch')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          filterType === 'link_mismatch'
                            ? 'bg-amber-600 text-white font-bold'
                            : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                        }`}
                      >
                        Trỏ sai bài ({linkMismatchCount})
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Articles Table with Link Integrity Column */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 shadow-xs z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">STT</th>
                        <th className="py-2.5 px-3 w-28">Khung giờ</th>
                        <th className="py-2.5 px-3 w-36">Xuất bản</th>
                        <th className="py-2.5 px-3 w-32">Nguồn tin</th>
                        <th className="py-2.5 px-3 min-w-[260px]">Tiêu đề bài viết</th>
                        <th className="py-2.5 px-3 w-48 text-center">Kiểm định Link & Đọc bài</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {displayedList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                            Không có bài viết nào phù hợp với bộ lọc kiểm định.
                          </td>
                        </tr>
                      ) : (
                        displayedList.map((item, idx) => {
                          const linkRes = linkAuditMap[item.artId];
                          return (
                            <tr
                              key={item.artId || idx}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition"
                            >
                              <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                                {idx + 1}
                              </td>

                              {/* Time Compliance */}
                              <td className="py-2.5 px-3">
                                {item.auditStatus === 'valid' ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-sans font-semibold">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ
                                  </span>
                                ) : item.auditStatus === 'too_early' ? (
                                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-sans font-semibold">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Sớm ({item.deltaMinutes}p)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-sans font-semibold">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Không hợp lệ
                                  </span>
                                )}
                              </td>

                              {/* Timestamp */}
                              <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                                {item.publishedTimeStr || formatVn(item.pubMs)}
                              </td>

                              {/* Source */}
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-sans font-medium truncate max-w-[130px]">
                                {item.source}
                              </td>

                              {/* Title & URL Link */}
                              <td className="py-2.5 px-3 font-sans text-slate-800 dark:text-slate-200 font-medium">
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-1.5 group line-clamp-2"
                                >
                                  <span>{item.title}</span>
                                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500 shrink-0 inline" />
                                </a>
                                {linkRes?.status === 'mismatch' && linkRes?.pageTitle && (
                                  <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                                    <span>➔ Trang đích: <em>{linkRes.pageTitle.slice(0, 70)}...</em></span>
                                  </div>
                                )}
                              </td>

                              {/* Link Verification Status Column */}
                              <td className="py-2.5 px-3 text-center">
                                {!linkRes ? (
                                  <button
                                    type="button"
                                    onClick={() => handleVerifySingleLink(item)}
                                    className="px-2 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-md text-[11px] font-semibold transition cursor-pointer border border-slate-200 dark:border-slate-700 flex items-center gap-1 mx-auto"
                                    title="Bấm để kiểm tra liên kết này có đọc được bài và đúng nội dung không"
                                  >
                                    <FileSearch className="w-3 h-3 text-blue-500" />
                                    <span>Kiểm tra</span>
                                  </button>
                                ) : linkRes.status === 'checking' ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                                    <RotateCcw className="w-3 h-3 animate-spin" /> Đang đọc thử...
                                  </span>
                                ) : linkRes.status === 'ok' ? (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 text-[11px] font-bold"
                                    title={linkRes.reason || 'Link đọc tốt, tiêu đề khớp'}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Đọc tốt ({linkRes.similarityScore || 95}%)
                                  </span>
                                ) : linkRes.status === 'mismatch' ? (
                                  <div
                                    className="inline-flex flex-col items-center"
                                    title={linkRes.reason || 'Trỏ sang bài viết khác hoặc trang chủ'}
                                  >
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-300 text-[11px] font-bold">
                                      <AlertTriangle className="w-3.5 h-3.5" /> Trỏ sai bài
                                    </span>
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                                      Khớp {linkRes.similarityScore || 0}%
                                    </span>
                                  </div>
                                ) : (
                                  <div
                                    className="inline-flex flex-col items-center"
                                    title={linkRes.reason || 'Lỗi HTTP hoặc trang không tồn tại'}
                                  >
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-900 dark:bg-red-900/50 dark:text-red-300 text-[11px] font-bold">
                                      <AlertOctagon className="w-3.5 h-3.5" /> Lỗi / 404
                                    </span>
                                    {linkRes.statusCode ? (
                                      <span className="text-[10px] text-red-500 font-mono mt-0.5">
                                        HTTP {linkRes.statusCode}
                                      </span>
                                    ) : null}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* Live Sandbox Tab */
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-blue-600" />
                  Kích hoạt Phiên Quét & Kiểm Định Kép Trực Tiếp (Live Sandbox Audit)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Công cụ này sẽ gửi yêu cầu quét trực tiếp tới hệ thống thu thập 150 nguồn với khung giờ được chọn, đồng thời đọc thử toàn bộ liên kết bài viết vừa cào để xác thực không có link chết hoặc trỏ sai bài.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Chọn phiên kiểm tra:
                  </span>
                  <button
                    onClick={() => setTestTimeRange('1h')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      testTimeRange === '1h'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Phiên 1 Giờ (1h Gần Nhất)
                  </button>
                  <button
                    onClick={() => setTestTimeRange('24h')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      testTimeRange === '24h'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Phiên 24 Giờ (24h Gần Nhất)
                  </button>

                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 ml-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoVerifyLinksInLive}
                      onChange={(e) => setAutoVerifyLinksInLive(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Tự động kiểm định liên kết & đọc thử bài viết (Link Integrity)</span>
                  </label>

                  <button
                    disabled={isRunningLiveTest}
                    onClick={handleRunLiveTest}
                    className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    {isRunningLiveTest ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        Đang Quét & Kiểm Định Kép...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        Bắt Đầu Kiểm Thử Ngay
                      </>
                    )}
                  </button>
                </div>
              </div>

              {liveTestResult && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500 font-semibold">Tổng thu thập</span>
                      <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                        {liveTestResult.total} bài viết
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500 font-semibold">Đúng khung giờ</span>
                      <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        {liveTestResult.timePassRate}% ({liveTestResult.total - liveTestResult.timeFails}/{liveTestResult.total})
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500 font-semibold">Link đọc tốt</span>
                      <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        {liveTestResult.linkPassRate ? `${liveTestResult.linkPassRate}%` : 'Đã bỏ qua'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {liveTestResult.linkFails > 0 && `${liveTestResult.linkFails} lỗi 404 `}
                        {liveTestResult.linkMismatches > 0 && `${liveTestResult.linkMismatches} trỏ sai bài`}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500 font-semibold">Kết quả kiểm định</span>
                      <div className="mt-1">
                        {liveTestResult.timeFails === 0 && (liveTestResult.linkFails || 0) === 0 && (liveTestResult.linkMismatches || 0) === 0 ? (
                          <span className="text-xs px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full font-bold">
                            ✅ 100% HOÀN HẢO
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-full font-bold">
                            ⚠️ CÓ {liveTestResult.timeFails + (liveTestResult.linkFails || 0) + (liveTestResult.linkMismatches || 0)} LỖI
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
          <div className="text-slate-500">
            Chạy kiểm thử dòng lệnh độc lập: <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-blue-600 dark:text-blue-400">npx tsx scripts/verify_time_window.ts</code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-medium transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

