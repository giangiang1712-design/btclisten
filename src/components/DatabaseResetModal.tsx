import React, { useState, useEffect } from 'react';
import {
  Database,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  Layers,
  MessageSquare,
  ShieldCheck,
  Pin,
  Lock,
  Sparkles,
  Server,
  CloudCheck,
  CloudOff,
  Newspaper
} from 'lucide-react';
import {
  isCloudDatabaseActive,
  getDatabaseStats,
  resetEntireDatabaseToZero,
  resetCollectionInCloud,
  DatabaseCollectionStats,
  ResetDatabaseResult
} from '../lib/firebase';
import { globalNewsDatabase } from '../lib/newsDatabase';

interface DatabaseResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  onDatabaseResetStart?: () => void;
  onDatabaseResetCompleted?: (actionType: 'all' | 'news' | 'sessions' | 'directives' | 'profiles') => void;
}

export const DatabaseResetModal: React.FC<DatabaseResetModalProps> = ({
  isOpen,
  onClose,
  isDark = false,
  onDatabaseResetStart,
  onDatabaseResetCompleted
}) => {
  const [stats, setStats] = useState<DatabaseCollectionStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetSuccessResult, setResetSuccessResult] = useState<ResetDatabaseResult | null>(null);
  const [confirmInput, setConfirmInput] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<'all' | 'news' | 'sessions' | 'directives' | 'profiles'>('all');
  const [clearLocalCache, setClearLocalCache] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await getDatabaseStats();
      setStats(data);
    } catch (err) {
      console.warn('Failed to load DB stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setConfirmInput('');
      setResetSuccessResult(null);
      setErrorMessage(null);
      loadStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isOnline = isCloudDatabaseActive();
  const isConfirmValid = confirmInput.trim().toUpperCase() === 'DELETE';

  const handleExecuteReset = async () => {
    if (!isConfirmValid) return;
    setIsResetting(true);
    setErrorMessage(null);
    setResetSuccessResult(null);

    if (onDatabaseResetStart) {
      onDatabaseResetStart();
    }

    try {
      if (selectedAction === 'all') {
        const res = await resetEntireDatabaseToZero({
          clearLocalCache,
          resetSessions: true,
          resetProfiles: true,
          resetDirectives: true,
          resetFeedbacks: true,
          resetNewsArchive: true,
          resetSemanticGroups: true,
          resetKnowledgeDocs: true
        });
        globalNewsDatabase.clear();
        if (clearLocalCache && typeof window !== 'undefined') {
          try {
            window.localStorage.setItem('finpulse_is_database_reset_cleared', 'true');
            window.sessionStorage.removeItem('mof_scrape_data_cache');
            window.sessionStorage.clear();
          } catch (_) {}
        }
        if (res.success) {
          setResetSuccessResult(res);
          setStats((prev) => prev ? {
            ...prev,
            sessionsCount: 0,
            profilesCount: 0,
            directivesCount: 0,
            feedbacksCount: 0,
            scrapedNewsCount: 0,
            semanticGroupsCount: 0,
            knowledgeDocsCount: 0
          } : null);
          loadStats(); // Non-blocking async background refresh
          if (onDatabaseResetCompleted) {
            onDatabaseResetCompleted('all');
          }
        } else {
          setErrorMessage(res.error || 'Có lỗi xảy ra trong quá trình reset cơ sở dữ liệu.');
          loadStats();
        }
      } else if (selectedAction === 'news') {
        const [serverData, c1, c2, c3, c4] = await Promise.all([
          fetch('/api/db/clear', { method: 'POST' })
            .then(r => r.ok ? r.json() : { deletedCount: 0 })
            .catch(e => {
              console.warn('Could not call /api/db/clear:', e);
              return { deletedCount: 0 };
            }),
          resetCollectionInCloud('scraped_news_archive'),
          resetCollectionInCloud('news_scrape_sessions'),
          resetCollectionInCloud('scraped_news'),
          resetCollectionInCloud('violation_dossiers')
        ]);
        const serverDeleted = serverData?.deletedCount || 0;
        const cloudDeleted = (c1 || 0) + (c2 || 0) + (c3 || 0) + (c4 || 0);

        globalNewsDatabase.clear();
        if (clearLocalCache && typeof window !== 'undefined') {
          try {
            window.localStorage.setItem('finpulse_is_database_reset_cleared', 'true');
            window.sessionStorage.removeItem('mof_scrape_data_cache');
            window.sessionStorage.clear();
            window.localStorage.removeItem('finpulse_scraped_news_archive');
            window.localStorage.removeItem('finpulse_scrape_sessions_history');
          } catch (_) {}
        }
        setResetSuccessResult({
          success: true,
          sessionsDeleted: 0,
          profilesDeleted: 0,
          directivesDeleted: 0,
          feedbacksDeleted: 0,
          scrapedNewsDeleted: serverDeleted + cloudDeleted,
          clearedCollections: ['scraped_news_archive', 'server_article_database', 'violation_dossiers']
        });
        setStats((prev) => prev ? { ...prev, scrapedNewsCount: 0 } : null);
        loadStats();
        if (onDatabaseResetCompleted) onDatabaseResetCompleted('news');
      } else if (selectedAction === 'sessions') {
        const deleted = await resetCollectionInCloud('advisor_sessions');
        if (clearLocalCache) {
          localStorage.removeItem('finpulse_advisor_sessions');
          localStorage.removeItem('finpulse_advisor_active_session_id');
        }
        setResetSuccessResult({
          success: true,
          sessionsDeleted: deleted,
          profilesDeleted: 0,
          directivesDeleted: 0,
          feedbacksDeleted: 0,
          scrapedNewsDeleted: 0,
          clearedCollections: ['advisor_sessions']
        });
        setStats((prev) => prev ? { ...prev, sessionsCount: 0 } : null);
        loadStats();
        if (onDatabaseResetCompleted) onDatabaseResetCompleted('sessions');
      } else if (selectedAction === 'directives') {
        const deleted = await resetCollectionInCloud('pinned_directives');
        if (clearLocalCache) {
          localStorage.removeItem('finpulse_pinned_directives');
        }
        setResetSuccessResult({
          success: true,
          sessionsDeleted: 0,
          profilesDeleted: 0,
          directivesDeleted: deleted,
          feedbacksDeleted: 0,
          scrapedNewsDeleted: 0,
          clearedCollections: ['pinned_directives']
        });
        setStats((prev) => prev ? { ...prev, directivesCount: 0 } : null);
        loadStats();
        if (onDatabaseResetCompleted) onDatabaseResetCompleted('directives');
      } else if (selectedAction === 'profiles') {
        const deleted = await resetCollectionInCloud('executive_profiles');
        if (clearLocalCache) {
          localStorage.removeItem('finpulse_executive_profiles');
          localStorage.removeItem('finpulse_active_executive_profile');
        }
        setResetSuccessResult({
          success: true,
          sessionsDeleted: 0,
          profilesDeleted: deleted,
          directivesDeleted: 0,
          feedbacksDeleted: 0,
          scrapedNewsDeleted: 0,
          clearedCollections: ['executive_profiles']
        });
        setStats((prev) => prev ? { ...prev, profilesCount: 0 } : null);
        loadStats();
        if (onDatabaseResetCompleted) onDatabaseResetCompleted('profiles');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể thực thi thao tác đặt lại cơ sở dữ liệu.');
    } finally {
      setIsResetting(false);
    }
  };

  const totalDocuments =
    (stats?.sessionsCount || 0) +
    (stats?.profilesCount || 0) +
    (stats?.directivesCount || 0) +
    (stats?.scrapedNewsCount || 0) +
    (stats?.feedbacksCount || 0) +
    (stats?.semanticGroupsCount || 0) +
    (stats?.knowledgeDocsCount || 0);

  return (
    <div
      id="modal-database-reset-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="modal-database-reset-card"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden transition-all ${
          isDark
            ? 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-slate-950/60'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between gap-3 ${
          isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center justify-center shadow-2xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Quản trị & Reset Database về 0
                </h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                  isOnline
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                }`}>
                  {isOnline ? <CloudCheck className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
                  {isOnline ? 'Cloud Firestore Online' : 'Local Fallback'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dọn sạch lịch sử phiên tư vấn, hồ sơ lãnh đạo và chỉ đạo khẩn trên Cloud Firestore
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Database Meta & Status Card */}
          <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark ? 'bg-slate-800/40 border-slate-700/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-500" />
                <span className="font-semibold text-slate-900 dark:text-white">Database ID:</span>
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                  {stats?.databaseId || 'ai-studio-demochuhao-4d6df30d-0130-486f-99ec-d8c82b791a00'}
                </span>
              </div>
              <div className="text-[11.5px] text-slate-500 dark:text-slate-400">
                GCP Project: <span className="font-mono text-slate-700 dark:text-slate-300">{stats?.projectId || 'imposing-dahlia-ht8c4'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={loadStats}
              disabled={isLoadingStats}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? 'animate-spin text-cyan-500' : ''}`} />
              <span>{isLoadingStats ? 'Đang kiểm tra...' : 'Làm mới thống kê'}</span>
            </button>
          </div>

          {/* Collection Status Grid */}
          <div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Dữ liệu thực tế trên Cloud Firestore</span>
              <span className="text-[11px] font-normal text-slate-500">
                Tổng cộng: <strong className="text-slate-900 dark:text-white font-mono">{totalDocuments}</strong> tài liệu
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Advisor Sessions */}
              <div
                onClick={() => setSelectedAction('sessions')}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  selectedAction === 'sessions'
                    ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 ring-1 ring-red-500'
                    : isDark
                    ? 'bg-slate-800/30 border-slate-700/70 hover:border-slate-600'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    <span>advisor_sessions</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                    {stats ? stats.sessionsCount : '...'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Lịch sử phiên hội thoại
                </p>
              </div>

              {/* Scraped News Archive */}
              <div
                onClick={() => setSelectedAction('news')}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  selectedAction === 'news'
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-500'
                    : isDark
                    ? 'bg-slate-800/30 border-slate-700/70 hover:border-slate-600'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Newspaper className="w-3.5 h-3.5 text-emerald-500" />
                    <span>scraped_news</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {stats ? stats.scrapedNewsCount : '...'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Kho lưu trữ tin tức & dữ liệu cào
                </p>
              </div>

              {/* Executive Profiles */}
              <div
                onClick={() => setSelectedAction('profiles')}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  selectedAction === 'profiles'
                    ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 ring-1 ring-red-500'
                    : isDark
                    ? 'bg-slate-800/30 border-slate-700/70 hover:border-slate-600'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>executive_profiles</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                    {stats ? stats.profilesCount : '...'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Hồ sơ phân vai chỉ đạo
                </p>
              </div>

              {/* Pinned Directives */}
              <div
                onClick={() => setSelectedAction('directives')}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  selectedAction === 'directives'
                    ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 ring-1 ring-red-500'
                    : isDark
                    ? 'bg-slate-800/30 border-slate-700/70 hover:border-slate-600'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Pin className="w-3.5 h-3.5 text-purple-500" />
                    <span>pinned_directives</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400">
                    {stats ? stats.directivesCount : '...'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Chỉ đạo khẩn đã ghim
                </p>
              </div>
            </div>
          </div>

          {/* Scope Selector */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Chọn Phạm Vi Muốn Đặt Lại:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setSelectedAction('all')}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                  selectedAction === 'all'
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                🔥 Xóa Sạch Toàn Bộ
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction('news')}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                  selectedAction === 'news'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                📰 Chỉ Tin Bài Đã Cào
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction('sessions')}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                  selectedAction === 'sessions'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                💬 Chỉ Phiên Chat
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction('directives')}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                  selectedAction === 'directives'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                📌 Chỉ Chỉ Đạo Ghim
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction('profiles')}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                  selectedAction === 'profiles'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                👤 Chỉ Hồ Sơ Lãnh Đạo
              </button>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold">Cảnh báo hành động không thể hoàn tác:</span>
              <p className="leading-relaxed text-slate-700 dark:text-amber-200/90">
                Thao tác này sẽ xóa vĩnh viễn dữ liệu tương ứng trên <strong>Google Cloud Firestore Database</strong> và <strong>Cơ sở dữ liệu máy chủ</strong>. Các bài viết và phiên làm việc sẽ được đưa về 0 ngay lập tức.
              </p>
            </div>
          </div>

          {/* Local Cache Toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={clearLocalCache}
              onChange={(e) => setClearLocalCache(e.target.checked)}
              className="w-4 h-4 rounded text-red-600 border-slate-300 focus:ring-red-500"
            />
            <span>Đồng thời xóa sạch bộ nhớ đệm trình duyệt & Session Cache</span>
          </label>

          {/* Success Result Box */}
          {resetSuccessResult && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold">Đặt lại Database thành công!</span>
                <p className="leading-relaxed text-slate-700 dark:text-emerald-200/90">
                  Đã xóa sạch: {resetSuccessResult.clearedCollections.join(', ')}.
                  (Bài viết: {resetSuccessResult.scrapedNewsDeleted}, Phiên chat: {resetSuccessResult.sessionsDeleted}, Chỉ đạo: {resetSuccessResult.directivesDeleted}, Hồ sơ: {resetSuccessResult.profilesDeleted}).
                </p>
              </div>
            </div>
          )}

          {/* Error Result Box */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-300 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold">Lỗi trong quá trình reset:</span>
                <p className="leading-relaxed text-slate-700 dark:text-red-200/90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Confirmation Input Guard */}
          <div className="p-3.5 rounded-xl border border-red-300 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Xác nhận bảo mật: Gõ chữ "DELETE" để mở khóa nút xóa</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Nhập DELETE để xác nhận..."
                className={`w-full px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase border focus:outline-hidden focus:ring-2 ${
                  isConfirmValid
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 focus:ring-emerald-500'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-red-500'
                }`}
              />
              {isConfirmValid && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã hợp lệ
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`px-5 py-3.5 border-t flex items-center justify-between gap-3 ${
          isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {isConfirmValid ? 'Sẵn sàng thực thi lệnh xóa' : 'Vui lòng gõ DELETE để tiếp tục'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleExecuteReset}
              disabled={!isConfirmValid || isResetting}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow-sm cursor-pointer ${
                !isConfirmValid || isResetting
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 active:scale-98'
              }`}
            >
              {isResetting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang dọn sạch Database...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {selectedAction === 'all'
                      ? 'Xác nhận Reset Toàn Bộ về 0'
                      : `Xác nhận Xóa ${selectedAction}`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
