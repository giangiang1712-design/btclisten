import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Cpu,
  Sparkles,
  ExternalLink,
  Info,
  Server,
  UserCheck,
  Trash2,
  X,
  Cloud,
  CloudUpload,
  CloudDownload,
  Sliders,
  BellRing,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  getCustomApiKey,
  setCustomApiKey,
  getApiKeyMode,
  setApiKeyMode,
  maskApiKey
} from '../lib/apiKeyManager';
import {
  saveUserPreferencesToCloud,
  fetchUserPreferencesFromCloud,
  applyCloudPreferencesToLocal,
  isCloudDatabaseActive,
  SyncPreferencesResult,
  UserPreferencesPayload
} from '../lib/firebase';
import { loadCustomKeywordWeights } from '../lib/keywordWeights';
import { loadAlertThresholdConfig, loadAlertTriggers, loadAlertIgnoreList } from '../lib/alertTriggers';

interface ApiKeySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
  initialTab?: 'apikey' | 'preferences';
}

export const ApiKeySettingsModal: React.FC<ApiKeySettingsModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated,
  initialTab = 'preferences'
}) => {
  const [activeTab, setActiveTab] = useState<'apikey' | 'preferences'>(initialTab);
  
  // API Key BYOK States
  const [keyMode, setKeyModeState] = useState<'system' | 'custom'>(getApiKeyMode());
  const [inputKey, setInputKey] = useState<string>(getCustomApiKey());
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    modelTested?: string;
  } | null>(null);

  // Cloud Sync States
  const [isSyncingToCloud, setIsSyncingToCloud] = useState<boolean>(false);
  const [isPullingFromCloud, setIsPullingFromCloud] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<SyncPreferencesResult | null>(null);
  const [pullResult, setPullResult] = useState<{ success: boolean; message: string } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Preference stats state
  const [prefStats, setPrefStats] = useState({
    keywordCount: 0,
    customOverrideCount: 0,
    thresholdLevelsCount: 5,
    triggersCount: 0,
    ignoreRulesCount: 0,
  });

  const refreshPrefStats = () => {
    try {
      const weights = loadCustomKeywordWeights();
      const allKeys = Object.keys(weights);
      const customOverrides = allKeys.filter(k => weights[k]?.isCustom || weights[k]?.weight !== 5.0).length;
      const triggers = loadAlertTriggers();
      const ignores = loadAlertIgnoreList();
      const thresholds = loadAlertThresholdConfig();

      setPrefStats({
        keywordCount: allKeys.length,
        customOverrideCount: customOverrides,
        thresholdLevelsCount: Object.keys(thresholds).length || 5,
        triggersCount: triggers.length,
        ignoreRulesCount: ignores.length
      });

      const savedTime = localStorage.getItem('finpulse_last_cloud_sync_formatted');
      if (savedTime) {
        setLastSyncTime(savedTime);
      }
    } catch (e) {
      console.error('Error refreshing preference stats:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setKeyModeState(getApiKeyMode());
      setInputKey(getCustomApiKey());
      setTestResult(null);
      setSyncResult(null);
      setPullResult(null);
      setActiveTab(initialTab);
      refreshPrefStats();
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Handle Testing Gemini Key
  const handleTestKey = async () => {
    setIsTesting(true);
    setTestResult(null);

    const keyToTest = keyMode === 'custom' ? inputKey.trim() : '';

    try {
      const res = await fetch('/api/check-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(keyToTest ? { 'x-user-gemini-key': keyToTest } : {})
        },
        body: JSON.stringify({ customApiKey: keyToTest })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Kết nối API Key thành công! Gemini Flash đang hoạt động ổn định.',
          modelTested: data.modelTested
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Kết nối API Key thất bại. Vui lòng kiểm tra lại tính chính xác của Key.'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Không thể kết nối đến máy chủ kiểm tra API Key.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Handle Save API Key
  const handleSaveApiKey = () => {
    if (keyMode === 'custom') {
      if (!inputKey.trim()) {
        alert('Vui lòng nhập Gemini API Key cá nhân hoặc chuyển về chế độ "Mặc định hệ thống".');
        return;
      }
      setCustomApiKey(inputKey.trim());
      setApiKeyMode('custom');
    } else {
      setApiKeyMode('system');
    }

    if (onKeyUpdated) onKeyUpdated();
    onClose();
  };

  const handleClearCustomKey = () => {
    setCustomApiKey('');
    setInputKey('');
    setApiKeyMode('system');
    setKeyModeState('system');
    setTestResult(null);
    if (onKeyUpdated) onKeyUpdated();
  };

  // Handle "Sync Local Preferences to Cloud"
  const handleSyncPreferencesToCloud = async () => {
    setIsSyncingToCloud(true);
    setSyncResult(null);
    setPullResult(null);

    try {
      const currentWeights = loadCustomKeywordWeights();
      const currentThresholds = loadAlertThresholdConfig();
      const currentTriggers = loadAlertTriggers();
      const currentIgnores = loadAlertIgnoreList();

      const result = await saveUserPreferencesToCloud({
        keywordWeights: currentWeights,
        alertThresholdConfig: currentThresholds,
        alertTriggerRules: currentTriggers,
        alertIgnoreRules: currentIgnores
      });

      setSyncResult(result);
      if (result.success) {
        const formatted = new Date(result.timestamp).toLocaleString('vi-VN');
        setLastSyncTime(formatted);
        refreshPrefStats();
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err?.message || 'Có lỗi xảy ra khi đồng bộ lên Cloud Firestore.',
        timestamp: Date.now(),
        syncedItems: {
          keywordWeightsCount: prefStats.keywordCount,
          alertThresholdsCount: prefStats.thresholdLevelsCount,
          alertTriggersCount: prefStats.triggersCount,
          ignoreRulesCount: prefStats.ignoreRulesCount
        },
        error: String(err)
      });
    } finally {
      setIsSyncingToCloud(false);
    }
  };

  // Handle "Pull Preferences from Cloud"
  const handlePullPreferencesFromCloud = async () => {
    setIsPullingFromCloud(true);
    setPullResult(null);
    setSyncResult(null);

    try {
      const cloudPrefs = await fetchUserPreferencesFromCloud();
      if (!cloudPrefs) {
        setPullResult({
          success: false,
          message: 'Không tìm thấy dữ liệu cấu hình đã lưu trên Cloud Firestore. Vui lòng bấm "Sync Local Preferences to Cloud" trước để tạo bản sao lưu đầu tiên.'
        });
        return;
      }

      const applyRes = applyCloudPreferencesToLocal(cloudPrefs);
      if (applyRes.success) {
        refreshPrefStats();
        setPullResult({
          success: true,
          message: `Đã kéo và cập nhật thành công cấu hình từ Cloud về thiết bị (${applyRes.appliedCount} mục được làm mới)!`
        });
        if (cloudPrefs.syncedAtFormatted) {
          setLastSyncTime(cloudPrefs.syncedAtFormatted);
        }
      } else {
        setPullResult({
          success: false,
          message: 'Không thể áp dụng cấu hình từ Cloud vào bộ nhớ cục bộ trình duyệt.'
        });
      }
    } catch (err: any) {
      setPullResult({
        success: false,
        message: err?.message || 'Lỗi khi tải cấu hình từ Cloud.'
      });
    } finally {
      setIsPullingFromCloud(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl overflow-hidden bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 via-amber-500/20 to-red-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Cài Đặt Hệ Thống & Đồng Bộ Đám Mây
                <span className="px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-800 rounded-full">
                  Cross-Device Sync
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quản lý đồng bộ trọng số từ khóa, ngưỡng cảnh báo và chìa khóa AI cá nhân
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'preferences'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white/60 dark:bg-slate-900/60'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Đồng Bộ Cấu Hình Cloud (Preferences Sync)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apikey')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'apikey'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white/60 dark:bg-slate-900/60'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Gemini API Key (BYOK)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">

          {/* ============================================================= */}
          {/* TAB 1: CLOUD PREFERENCES SYNC */}
          {/* ============================================================= */}
          {activeTab === 'preferences' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Highlight Hero Card with 'Sync Local Preferences to Cloud' CTA */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-indigo-900/20 border border-indigo-500/30 text-slate-100 space-y-4 shadow-lg shadow-indigo-950/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-5 h-5 text-indigo-400 animate-pulse" />
                      <h4 className="font-bold text-sm text-indigo-200">
                        Đồng Bộ Đa Thiết Bị Qua Google Cloud Firestore
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                      Lưu trữ vĩnh viễn cấu hình trọng số từ khóa tùy chỉnh, ngưỡng cảnh báo 5 cấp độ và danh sách bỏ qua lên đám mây để sử dụng đồng nhất trên máy tính, máy tính bảng và điện thoại.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Firestore Sẵn Sàng
                    </span>
                  </div>
                </div>

                {/* Primary Action Button: 'Sync Local Preferences to Cloud' */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSyncPreferencesToCloud}
                    disabled={isSyncingToCloud || isPullingFromCloud}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                    id="sync-local-preferences-to-cloud-btn"
                  >
                    <CloudUpload className={`w-4 h-4 text-indigo-200 transition-transform ${isSyncingToCloud ? 'animate-bounce' : 'group-hover:-translate-y-0.5'}`} />
                    <span>{isSyncingToCloud ? 'Đang đẩy lên Firestore...' : 'Sync Local Preferences to Cloud'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePullPreferencesFromCloud}
                    disabled={isSyncingToCloud || isPullingFromCloud}
                    className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    title="Kéo cấu hình đã lưu trên Cloud về áp dụng cho trình duyệt hiện tại"
                  >
                    <CloudDownload className={`w-4 h-4 text-cyan-400 ${isPullingFromCloud ? 'animate-bounce' : ''}`} />
                    <span>{isPullingFromCloud ? 'Đang kéo dữ liệu...' : 'Tải cấu hình từ Cloud về'}</span>
                  </button>
                </div>

                {lastSyncTime && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Lần đồng bộ gần nhất: <strong className="font-mono text-indigo-300">{lastSyncTime}</strong></span>
                  </div>
                )}
              </div>

              {/* Status & Feedback Banners */}
              {syncResult && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 animate-fadeIn ${
                    syncResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  {syncResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs space-y-1">
                    <p className="font-bold">{syncResult.message}</p>
                    {syncResult.success && syncResult.syncedItems && (
                      <p className="text-[11px] opacity-90">
                        Chi tiết: <strong>{syncResult.syncedItems.keywordWeightsCount}</strong> trọng số từ khóa,{' '}
                        <strong>{syncResult.syncedItems.alertThresholdsCount}</strong> cấp độ ngưỡng,{' '}
                        <strong>{syncResult.syncedItems.alertTriggersCount}</strong> quy tắc kích hoạt và{' '}
                        <strong>{syncResult.syncedItems.ignoreRulesCount}</strong> mẫu bỏ qua.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {pullResult && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 animate-fadeIn ${
                    pullResult.success
                      ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  {pullResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs">
                    <p className="font-semibold">{pullResult.message}</p>
                  </div>
                </div>
              )}

              {/* Data Items Breakdown Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Dữ Liệu Cấu Hình Trong Phiên Làm Việc Hiện Tại
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Card 1: Custom Keyword Weights */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                          <Sliders className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Trọng Số Từ Khóa MoF
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                        {prefStats.keywordCount} từ khóa
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Bao gồm {prefStats.customOverrideCount} từ khóa có trọng số tùy biến riêng của chuyên viên hoặc từ mới bổ sung.
                    </p>
                  </div>

                  {/* Card 2: 5-Level Warning Thresholds */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
                          <BellRing className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Cấu Hình Ngưỡng 5 Cấp Độ
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                        {prefStats.thresholdLevelsCount} Cấp độ
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Cảnh báo Khẩn cấp (Emergency), Nhanh (Rapid), Sớm (Early), Từ xa (Distant), và Chuẩn (Standard).
                    </p>
                  </div>

                  {/* Card 3: Alert Triggers */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                          <Layers className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Quy Tắc Kích Hoạt Đột Biến
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {prefStats.triggersCount} Quy tắc
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Bộ quy tắc phát hiện tin đồn tiêu cực, rò rỉ chính sách và áp lực truyền thông ngành.
                    </p>
                  </div>

                  {/* Card 4: Ignore List */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                          <Filter className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Danh Sách Bỏ Qua (Ignore-list)
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {prefStats.ignoreRulesCount} Mẫu lọc
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Loại trừ các thông báo trả cổ tức, tăng vốn kỹ thuật và hoạt động thường quy định kỳ.
                    </p>
                  </div>

                </div>
              </div>

              {/* Security & Reliability Note */}
              <div className="p-3.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>Bảo mật & Chuẩn hóa Firestore:</strong> Dữ liệu cấu hình được khử trùng (sanitized) và bảo vệ bằng quy chuẩn kiểm tra schema <code>firestore.rules</code> trước khi ghi vào cơ sở dữ liệu.
                </span>
              </div>

            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 2: GEMINI API KEY (BYOK) */}
          {/* ============================================================= */}
          {activeTab === 'apikey' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Mode Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Mode System Card */}
                <div
                  onClick={() => {
                    setKeyModeState('system');
                    setTestResult(null);
                  }}
                  className={`cursor-pointer relative p-4 rounded-xl border transition-all ${
                    keyMode === 'system'
                      ? 'bg-red-50/50 dark:bg-red-950/20 border-red-500/60 shadow-sm ring-2 ring-red-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${keyMode === 'system' ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Key Hệ Thống Mặc Định</h4>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Sẵn sàng sử dụng</span>
                      </div>
                    </div>
                    {keyMode === 'system' && (
                      <CheckCircle2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Sử dụng Key được cấp sẵn từ môi trường AI Studio. Phù hợp cho việc kiểm thử nhanh, không cần cấu hình thêm.
                  </p>
                </div>

                {/* Mode BYOK Card */}
                <div
                  onClick={() => {
                    setKeyModeState('custom');
                    setTestResult(null);
                  }}
                  className={`cursor-pointer relative p-4 rounded-xl border transition-all ${
                    keyMode === 'custom'
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-500/60 shadow-sm ring-2 ring-amber-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${keyMode === 'custom' ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Key Cá Nhân (BYOK)</h4>
                        <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Tối đa hạn ngạch & tốc độ</span>
                      </div>
                    </div>
                    {keyMode === 'custom' && (
                      <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Sử dụng API Key cá nhân của bạn từ Google AI Studio. Đảm bảo hạn ngạch riêng, tốc độ cao nhất và hoàn toàn độc lập.
                  </p>
                </div>

              </div>

              {/* Custom Key Input Form */}
              {keyMode === 'custom' && (
                <div className="p-4 rounded-xl bg-amber-50/30 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/40 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Gemini API Key Cá Nhân của bạn
                    </label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                    >
                      Lấy API Key miễn phí tại Google AI Studio
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      placeholder="Nhập Gemini API Key (Ví dụ: AIzaSy...)"
                      className="w-full px-3.5 py-2.5 pr-10 text-xs font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title={showKey ? 'Ẩn Key' : 'Hiện Key'}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {inputKey && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span>Mã hóa Key đang lưu: <code className="font-mono text-amber-700 dark:text-amber-400">{maskApiKey(inputKey)}</code></span>
                      <button
                        onClick={handleClearCustomKey}
                        className="text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Xóa Key cá nhân
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Test Status Banner */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 animate-fadeIn ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs">
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.modelTested && (
                      <p className="text-[11px] opacity-80 mt-0.5">
                        Mô hình đã thử nghiệm thành công: <code className="font-mono">{testResult.modelTested}</code>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Security Note */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>Bảo mật tối đa:</strong> API Key cá nhân của bạn chỉ lưu an toàn trong trình duyệt cục bộ (localStorage) và được truyền qua mã hóa SSL bảo mật tới backend proxy. Tuyệt đối không chia sẻ hay lưu trữ công khai.
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800">
          {activeTab === 'preferences' ? (
            <>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Cloud className="w-4 h-4 text-indigo-500" />
                <span>Google Cloud Firestore Sync</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSyncPreferencesToCloud}
                  disabled={isSyncingToCloud}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CloudUpload className={`w-4 h-4 ${isSyncingToCloud ? 'animate-spin' : ''}`} />
                  {isSyncingToCloud ? 'Đang Đồng Bộ...' : 'Sync Local Preferences to Cloud'}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTesting || (keyMode === 'custom' && !inputKey.trim())}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Đang kiểm tra...' : 'Kiểm Tra Kết Nối Key'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Lưu & Áp Dụng Chế Độ
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
