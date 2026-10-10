import React, { useState, useEffect } from 'react';
import {
  AlertTriggerRule,
  AlertIgnoreRule,
  ScrapedNewsItem,
  ActiveAlertNotification,
  WarningAlertLevelType,
  formatNewsFullDateTime,
} from '../types';
import {
  DEFAULT_ALERT_TRIGGERS,
  DEFAULT_ALERT_IGNORE_RULES,
  MOF_SIMULATION_SCENARIOS,
  SimulationScenario,
  playAlertChime,
  requestNotificationPermission,
  ALERT_THRESHOLD_CONFIG,
  AlertThresholdConfig,
  AlertThresholdConfigItem,
  loadAlertThresholdConfig,
  saveAlertThresholdConfig,
  resetAlertThresholdConfig,
  loadAlertIgnoreList,
  saveAlertIgnoreList,
  resetAlertIgnoreList,
  addAlertIgnoreRule,
  deleteAlertIgnoreRule,
  toggleAlertIgnoreRule,
  AdvancedSystemLoadConfig,
  DEFAULT_ADVANCED_LOAD_CONFIG,
  loadAdvancedSystemLoadConfig,
  saveAdvancedSystemLoadConfig,
  resetAdvancedSystemLoadConfig,
  EARLY_WARNING_7_ACTIONS,
  loadSimulationScenarios,
  saveSimulationScenarios,
  addCustomSimulationScenario,
  deleteCustomSimulationScenario,
  resetSimulationScenarios,
} from '../lib/alertTriggers';
import {
  fetchAlertThresholdConfigFromCloud,
  fetchAlertTriggerRulesFromCloud,
  fetchAlertIgnoreListFromCloud,
  saveAlertIgnoreListToCloud,
  subscribeToCloudAlertIgnoreList,
  subscribeToCloudSimulationScenarios,
  fetchSimulationScenariosFromCloud,
  logSimulationExecutionToCloud,
  isCloudDatabaseActive,
  isFirestoreQuotaExceeded,
  saveUserPreferencesToCloud,
} from '../lib/firebase';
import { useTheme } from '../lib/theme';
import {
  BellRing,
  Volume2,
  Sliders,
  PlayCircle,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  Radio,
  Flame,
  ShieldCheck,
  Building2,
  X,
  Send,
  AlertOctagon,
  Activity,
  ClipboardList,
  ExternalLink,
  FileText,
  Clock,
  ChevronRight,
  Filter,
  Layers,
  Save,
  ShieldAlert,
  Gauge,
  Cpu,
  Settings2,
  SlidersHorizontal,
  CloudUpload,
  CheckCircle2,
  Info,
  Timer,
  Cloud,
  CloudOff,
  Database,
  RefreshCw,
} from 'lucide-react';

interface AlertTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRules: AlertTriggerRule[];
  onSaveTriggerRules: (rules: AlertTriggerRule[]) => void;
  onResetTriggerRules: () => void;
  scrapedArticles: ScrapedNewsItem[];
  onDispatchTriggerAlert: (alert: ActiveAlertNotification) => void;
  activeAlerts?: ActiveAlertNotification[];
  onOpenExecutiveModal?: (alert: ActiveAlertNotification) => void;
  onOpenDraftStatement?: (article: ScrapedNewsItem) => void;
  onClearAlert?: (alertId: string) => void;
  onClearAllAlerts?: () => void;
  thresholdConfig?: AlertThresholdConfig;
  onSaveThresholdConfig?: (config: AlertThresholdConfig) => void;
}

export const AlertTriggerModal: React.FC<AlertTriggerModalProps> = ({
  isOpen,
  onClose,
  triggerRules,
  onSaveTriggerRules,
  onResetTriggerRules,
  scrapedArticles,
  onDispatchTriggerAlert,
  activeAlerts = [],
  onOpenExecutiveModal,
  onOpenDraftStatement,
  onClearAlert,
  onClearAllAlerts,
  thresholdConfig,
  onSaveThresholdConfig,
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'alerts' | 'thresholds' | 'rules' | 'ignorelist' | 'simulator'>('alerts');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'ALL' | WarningAlertLevelType>('ALL');
  const [rules, setRules] = useState<AlertTriggerRule[]>(triggerRules);
  const [thresholds, setThresholds] = useState<AlertThresholdConfig>(() => thresholdConfig || loadAlertThresholdConfig());
  const [advancedLoadConfig, setAdvancedLoadConfig] = useState<AdvancedSystemLoadConfig>(() => loadAdvancedSystemLoadConfig());
  const [showAdvancedLoadMenu, setShowAdvancedLoadMenu] = useState<boolean>(true);
  const [saveThresholdMsg, setSaveThresholdMsg] = useState<string>('');
  
  // Scenarios State (Local + Cloud Firestore)
  const [scenarios, setScenarios] = useState<SimulationScenario[]>(() => loadSimulationScenarios());
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario>(() => {
    const list = loadSimulationScenarios();
    return list[0] || MOF_SIMULATION_SCENARIOS[0];
  });
  const [useCustomArticle, setUseCustomArticle] = useState<boolean>(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string>(scrapedArticles[0]?.id || '');
  const [simulationDelaySeconds, setSimulationDelaySeconds] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationCountdown, setSimulationCountdown] = useState<number>(0);

  // Persistent Ignore-list state
  const [ignoreRules, setIgnoreRules] = useState<AlertIgnoreRule[]>(() => loadAlertIgnoreList());
  const [showAddIgnoreRule, setShowAddIgnoreRule] = useState<boolean>(false);
  const [newIgnorePattern, setNewIgnorePattern] = useState<string>('');
  const [newIgnoreDesc, setNewIgnoreDesc] = useState<string>('');
  const [newIgnoreCategory, setNewIgnoreCategory] = useState<AlertIgnoreRule['category']>('corporate_dividend');
  const [ignoreFilterKeyword, setIgnoreFilterKeyword] = useState<string>('');

  // Cloud Sync state
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState<string>('');
  const [isSyncingCloudPrefs, setIsSyncingCloudPrefs] = useState<boolean>(false);
  const [syncPrefsNotice, setSyncPrefsNotice] = useState<string | null>(null);

  // Sync all local preferences to Cloud (Sync Local Preferences to Cloud)
  const handleSyncPreferencesToCloud = async () => {
    setIsCloudSyncing(true);
    setIsSyncingCloudPrefs(true);
    setSyncPrefsNotice(null);
    try {
      // Gather local keyword weights, thresholds, rules, ignoreRules, scenarios
      const res = await saveUserPreferencesToCloud({
        alertThresholdConfig: thresholds,
        alertTriggerRules: rules,
        alertIgnoreRules: ignoreRules,
      });

      // Also persist to respective cloud collections
      await Promise.allSettled([
        saveAlertThresholdConfig(thresholds),
        saveAlertIgnoreList(ignoreRules),
        saveSimulationScenarios(scenarios),
      ]);

      const successMsg = res.success
        ? `Đã đồng bộ lên Cloud thành công: ${res.syncedItems.keywordWeightsCount} trọng số từ khoá & ${res.syncedItems.alertThresholdsCount} cấu hình ngưỡng cảnh báo!`
        : (res.message || 'Đã lưu cấu hình cục bộ (Local Storage).');

      setCloudSyncMsg(successMsg);
      setSyncPrefsNotice(successMsg);
      setTimeout(() => {
        setCloudSyncMsg('');
        setSyncPrefsNotice(null);
      }, 4500);
    } catch (err: any) {
      setCloudSyncMsg('Đã lưu cấu hình cục bộ (Local Storage).');
      setSyncPrefsNotice('Đang ở chế độ lưu trữ cục bộ (Local Storage).');
      setTimeout(() => {
        setCloudSyncMsg('');
        setSyncPrefsNotice(null);
      }, 4000);
    } finally {
      setIsCloudSyncing(false);
      setIsSyncingCloudPrefs(false);
    }
  };

  // Add Custom Scenario Form state
  const [showAddScenario, setShowAddScenario] = useState<boolean>(false);
  const [newScenarioName, setNewScenarioName] = useState<string>('');
  const [newScenarioDesc, setNewScenarioDesc] = useState<string>('');
  const [newScenarioTriggerName, setNewScenarioTriggerName] = useState<string>('');
  const [newScenarioPriority, setNewScenarioPriority] = useState<'critical' | 'high' | 'medium'>('critical');
  const [newScenarioAlertLevel, setNewScenarioAlertLevel] = useState<WarningAlertLevelType>('EMERGENCY');
  const [newScenarioArticleTitle, setNewScenarioArticleTitle] = useState<string>('');
  const [newScenarioArticleSource, setNewScenarioArticleSource] = useState<string>('Báo Lao Động / Mạng Xã Hội');
  const [newScenarioArticleContent, setNewScenarioArticleContent] = useState<string>('');
  const [newScenarioArticleSector, setNewScenarioArticleSector] = useState<string>('gold_forex');
  const [newScenarioArticleTags, setNewScenarioArticleTags] = useState<string>('Vàng SJC, Quản lý thị trường, Thanh tra');

  // New rule form
  const [showAddRule, setShowAddRule] = useState<boolean>(false);
  const [newRuleName, setNewRuleName] = useState<string>('');
  const [newRuleKeywords, setNewRuleKeywords] = useState<string>('');
  const [newRuleNegations, setNewRuleNegations] = useState<string>('');
  const [newRuleAlertLevel, setNewRuleAlertLevel] = useState<WarningAlertLevelType>('RAPID');
  const [newRuleActivationStandard, setNewRuleActivationStandard] = useState<string>('');
  const [newRuleMinBuzz, setNewRuleMinBuzz] = useState<number>(75);
  const [newRuleSpikeOnly, setNewRuleSpikeOnly] = useState<boolean>(true);
  const [newRulePriority, setNewRulePriority] = useState<'critical' | 'high' | 'medium'>('high');

  // Real-time Cloud Listeners (Simulation Scenarios + Ignore-List)
  useEffect(() => {
    if (isFirestoreQuotaExceeded()) return;
    const unsubScenarios = subscribeToCloudSimulationScenarios((cloudScenarios) => {
      if (cloudScenarios && cloudScenarios.length > 0) {
        setScenarios(cloudScenarios);
      }
    });
    const unsubIgnore = subscribeToCloudAlertIgnoreList((cloudIgnore) => {
      if (cloudIgnore && cloudIgnore.length > 0) {
        setIgnoreRules(cloudIgnore);
      }
    });
    return () => {
      if (unsubScenarios) unsubScenarios();
      if (unsubIgnore) unsubIgnore();
    };
  }, []);

  // Update thresholds and rules if props change
  useEffect(() => {
    if (thresholdConfig) {
      setThresholds(thresholdConfig);
    }
  }, [thresholdConfig]);

  useEffect(() => {
    setRules(triggerRules);
  }, [triggerRules]);

  if (!isOpen) return null;

  const handleSyncFromCloud = async () => {
    setIsCloudSyncing(true);
    try {
      const [cThresholds, cRules, cScenarios, cIgnore] = await Promise.all([
        fetchAlertThresholdConfigFromCloud(),
        fetchAlertTriggerRulesFromCloud(),
        fetchSimulationScenariosFromCloud(),
        fetchAlertIgnoreListFromCloud(),
      ]);

      if (cThresholds) {
        setThresholds(cThresholds);
        if (onSaveThresholdConfig) onSaveThresholdConfig(cThresholds);
      }
      if (cRules && cRules.length > 0) {
        setRules(cRules);
        onSaveTriggerRules(cRules);
      }
      if (cScenarios && cScenarios.length > 0) {
        setScenarios(cScenarios);
      }
      if (cIgnore && cIgnore.length > 0) {
        setIgnoreRules(cIgnore);
      }
      setCloudSyncMsg('Đã đồng bộ thành công cấu hình ngưỡng, ignore-list & kịch bản từ Cloud Firestore!');
    } catch (err: any) {
      setCloudSyncMsg('Đang ở chế độ lưu trữ cục bộ (Local Storage).');
    } finally {
      setIsCloudSyncing(false);
      setTimeout(() => setCloudSyncMsg(''), 4000);
    }
  };

  // Ignore list handlers
  const handleToggleIgnore = (id: string) => {
    const updated = toggleAlertIgnoreRule(id);
    setIgnoreRules(updated);
  };

  const handleDeleteIgnore = (id: string) => {
    const updated = deleteAlertIgnoreRule(id);
    setIgnoreRules(updated);
    setSaveThresholdMsg('Đã xóa mục khỏi Ignore-list thành công!');
    setTimeout(() => setSaveThresholdMsg(''), 2500);
  };

  const handleResetIgnore = () => {
    const updated = resetAlertIgnoreList();
    setIgnoreRules(updated);
    setSaveThresholdMsg('Đã khôi phục Ignore-list mặc định và đồng bộ lên Cloud!');
    setTimeout(() => setSaveThresholdMsg(''), 3000);
  };

  const handleCreateIgnoreRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIgnorePattern.trim()) return;
    const updated = addAlertIgnoreRule(newIgnorePattern.trim(), newIgnoreDesc.trim(), newIgnoreCategory);
    setIgnoreRules(updated);
    setNewIgnorePattern('');
    setNewIgnoreDesc('');
    setShowAddIgnoreRule(false);
    setSaveThresholdMsg(`Đã thêm mẫu "${newIgnorePattern.trim()}" vào danh sách bỏ qua cảnh báo khẩn cấp!`);
    setTimeout(() => setSaveThresholdMsg(''), 3500);
  };

  const handleQuickAddPresetIgnore = (pattern: string, desc: string, cat: AlertIgnoreRule['category']) => {
    const updated = addAlertIgnoreRule(pattern, desc, cat);
    setIgnoreRules(updated);
    setSaveThresholdMsg(`Đã bật/thêm mẫu "${pattern}" vào danh sách bỏ qua!`);
    setTimeout(() => setSaveThresholdMsg(''), 3000);
  };

  const handleToggleRule = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    setRules(updated);
    onSaveTriggerRules(updated);
  };

  const handleDeleteRule = (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    onSaveTriggerRules(updated);
  };

  const handleAddRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newRuleKeywords.trim()) return;

    const kwArray = newRuleKeywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const negArray = newRuleNegations
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const newRule: AlertTriggerRule = {
      id: `custom-trig-${Date.now()}`,
      name: newRuleName.trim(),
      keywords: kwArray,
      negationExceptions: negArray.length > 0 ? negArray : undefined,
      alertLevel: newRuleAlertLevel,
      activationStandard: newRuleActivationStandard.trim() || undefined,
      minBuzzScore: newRuleMinBuzz,
      requireVelocitySpike: newRuleSpikeOnly,
      requireTier1: false,
      sentimentFilter: 'all',
      enabled: true,
      priorityLevel: newRulePriority,
      soundEnabled: true,
      notifyChannels: ['toast', 'modal'],
      category: 'custom',
    };

    const updated = [newRule, ...rules];
    setRules(updated);
    onSaveTriggerRules(updated);
    setShowAddRule(false);
    setNewRuleName('');
    setNewRuleKeywords('');
    setNewRuleNegations('');
    setNewRuleActivationStandard('');
  };

  const handleCreateCustomScenarioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScenarioName.trim() || !newScenarioArticleTitle.trim()) return;

    const tagsArray = newScenarioArticleTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const newScenario: SimulationScenario = {
      id: `scenario-custom-${Date.now()}`,
      name: newScenarioName.trim(),
      category: 'Lĩnh vực Trọng điểm',
      description: newScenarioDesc.trim() || newScenarioName.trim(),
      triggerName: newScenarioTriggerName.trim() || newScenarioName.trim(),
      priorityLevel: newScenarioPriority,
      alertLevel: newScenarioAlertLevel,
      article: {
        id: `sim-art-${Date.now()}`,
        title: newScenarioArticleTitle.trim(),
        url: 'https://mof.gov.vn/simulation/alert-' + Date.now(),
        source: newScenarioArticleSource.trim() || 'MoF Simulation System',
        domainTrustScore: 85,
        publishedAt: new Date().toISOString(),
        timeAgo: 'Vừa xong',
        summary: newScenarioArticleContent.trim() || newScenarioArticleTitle.trim(),
        keyPoints: [newScenarioArticleTitle.trim()],
        sixW: {
          who: 'Bộ Tài chính / Cơ quan chức năng',
          doingWhat: 'Theo dõi & xử lý thông tin bùng phát',
          aboutWhat: newScenarioName.trim(),
          resultOutcome: 'Đang triển khai các biện pháp kiểm soát rủi ro',
          whoIsAffected: 'Thị trường tài chính và dư luận xã hội',
          reaction: 'Cần phản hồi kịp thời để ổn định tâm lý',
        },
        sentiment: 'bearish',
        sentimentScore: newScenarioPriority === 'critical' ? -85 : -60,
        sentimentReason: 'Thông tin có tính chất bùng nổ dư luận cần chủ động xử lý',
        impactLevel: newScenarioPriority === 'critical' ? 'high' : 'medium',
        marketImplication: 'Tác động trực tiếp tới niềm tin thị trường và công tác quản lý',
        tickers: ['VÀNG', 'BTC'],
        sector: newScenarioArticleSector as any,
        sectorNameVi: 'Lĩnh vực Trọng điểm',
        impactScore: newScenarioPriority === 'critical' ? 95 : newScenarioPriority === 'high' ? 82 : 65,
        buzzScore: newScenarioPriority === 'critical' ? 94 : newScenarioPriority === 'high' ? 80 : 60,
        policyTags: tagsArray,
        velocityStatus: 'spike',
        isEmergency: newScenarioPriority === 'critical',
      }
    };

    const updated = addCustomSimulationScenario(newScenario);
    setScenarios(updated);
    setSelectedScenario(newScenario);
    setShowAddScenario(false);
    setNewScenarioName('');
    setNewScenarioDesc('');
    setNewScenarioTriggerName('');
    setNewScenarioArticleTitle('');
    setNewScenarioArticleContent('');
    setSaveThresholdMsg('Đã thêm kịch bản giả lập mới và lưu đồng bộ lên Cloud Firestore!');
    setTimeout(() => setSaveThresholdMsg(''), 3500);
  };

  const handleDeleteScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteCustomSimulationScenario(id);
    setScenarios(updated);
    if (selectedScenario.id === id) {
      setSelectedScenario(updated[0] || MOF_SIMULATION_SCENARIOS[0]);
    }
    setSaveThresholdMsg('Đã xóa kịch bản tùy chỉnh thành công!');
    setTimeout(() => setSaveThresholdMsg(''), 3000);
  };

  const handleResetAllScenarios = () => {
    const defaults = resetSimulationScenarios();
    setScenarios(defaults);
    setSelectedScenario(defaults[0]);
    setSaveThresholdMsg('Đã khôi phục các kịch bản đột biến mặc định của Bộ Tài chính!');
    setTimeout(() => setSaveThresholdMsg(''), 3000);
  };

  const handleUpdateThresholdField = (
    level: WarningAlertLevelType,
    field: keyof AlertThresholdConfigItem,
    val: any
  ) => {
    const updated = {
      ...thresholds,
      [level]: {
        ...thresholds[level],
        [field]: val,
      }
    };
    setThresholds(updated);
    saveAlertThresholdConfig(updated);
    if (onSaveThresholdConfig) {
      onSaveThresholdConfig(updated);
    }
  };

  const handleSaveThresholds = () => {
    saveAlertThresholdConfig(thresholds);
    saveAdvancedSystemLoadConfig(advancedLoadConfig);
    if (onSaveThresholdConfig) {
      onSaveThresholdConfig(thresholds);
    }
    setSaveThresholdMsg('Đã lưu cấu hình 5 cấp độ cảnh báo và đồng bộ Cloud Firestore thành công!');
    setTimeout(() => setSaveThresholdMsg(''), 3000);
  };

  const handleResetThresholds = () => {
    const def = resetAlertThresholdConfig();
    const defLoad = resetAdvancedSystemLoadConfig();
    setThresholds(def);
    setAdvancedLoadConfig(defLoad);
    if (onSaveThresholdConfig) {
      onSaveThresholdConfig(def);
    }
    setSaveThresholdMsg('Đã khôi phục cài đặt ngưỡng và tần suất mặc định của Bộ Tài chính.');
    setTimeout(() => setSaveThresholdMsg(''), 3000);
  };

  const handleApplyPreset = (presetType: 'realtime' | 'balanced' | 'low_overhead') => {
    if (presetType === 'realtime') {
      setThresholds(prev => ({
        ...prev,
        EMERGENCY: { ...prev.EMERGENCY, pollingFrequencySeconds: 45, minDomainTrustScore: 65, autoBlockFakeNewsSuspicious: true },
        RAPID: { ...prev.RAPID, pollingFrequencySeconds: 120, minDomainTrustScore: 55, autoBlockFakeNewsSuspicious: true },
        EARLY: { ...prev.EARLY, pollingFrequencySeconds: 240, minDomainTrustScore: 45, autoBlockFakeNewsSuspicious: true },
        DISTANT: { ...prev.DISTANT, pollingFrequencySeconds: 480, minDomainTrustScore: 35, autoBlockFakeNewsSuspicious: true },
        STANDARD: { ...prev.STANDARD, pollingFrequencySeconds: 1200, minDomainTrustScore: 25, autoBlockFakeNewsSuspicious: true },
      }));
      setAdvancedLoadConfig(prev => ({
        ...prev,
        burstRequestDelayMs: 300,
        enableAdaptiveThrottling: false,
        autoBlockUnverifiedSpam: true,
        globalMinDomainTrustScore: 30,
      }));
      setSaveThresholdMsg('Đã áp dụng chế độ: ⚡ Quét Cường Độ Cao (Real-time Scan)');
    } else if (presetType === 'balanced') {
      setThresholds(prev => ({
        ...prev,
        EMERGENCY: { ...prev.EMERGENCY, pollingFrequencySeconds: 60, minDomainTrustScore: 75, autoBlockFakeNewsSuspicious: true },
        RAPID: { ...prev.RAPID, pollingFrequencySeconds: 180, minDomainTrustScore: 65, autoBlockFakeNewsSuspicious: true },
        EARLY: { ...prev.EARLY, pollingFrequencySeconds: 300, minDomainTrustScore: 50, autoBlockFakeNewsSuspicious: true },
        DISTANT: { ...prev.DISTANT, pollingFrequencySeconds: 600, minDomainTrustScore: 40, autoBlockFakeNewsSuspicious: true },
        STANDARD: { ...prev.STANDARD, pollingFrequencySeconds: 1800, minDomainTrustScore: 30, autoBlockFakeNewsSuspicious: true },
      }));
      setAdvancedLoadConfig(prev => ({
        ...prev,
        burstRequestDelayMs: 800,
        enableAdaptiveThrottling: true,
        autoBlockUnverifiedSpam: true,
        globalMinDomainTrustScore: 40,
      }));
      setSaveThresholdMsg('Đã áp dụng chế độ: ⚖️ Cân Bằng Tối Ưu (Khuyên Dùng)');
    } else {
      setThresholds(prev => ({
        ...prev,
        EMERGENCY: { ...prev.EMERGENCY, pollingFrequencySeconds: 120, minDomainTrustScore: 80, autoBlockFakeNewsSuspicious: true },
        RAPID: { ...prev.RAPID, pollingFrequencySeconds: 360, minDomainTrustScore: 70, autoBlockFakeNewsSuspicious: true },
        EARLY: { ...prev.EARLY, pollingFrequencySeconds: 600, minDomainTrustScore: 55, autoBlockFakeNewsSuspicious: true },
        DISTANT: { ...prev.DISTANT, pollingFrequencySeconds: 1200, minDomainTrustScore: 45, autoBlockFakeNewsSuspicious: true },
        STANDARD: { ...prev.STANDARD, pollingFrequencySeconds: 3600, minDomainTrustScore: 35, autoBlockFakeNewsSuspicious: true },
      }));
      setAdvancedLoadConfig(prev => ({
        ...prev,
        burstRequestDelayMs: 1500,
        enableAdaptiveThrottling: true,
        autoBlockUnverifiedSpam: true,
        globalMinDomainTrustScore: 50,
      }));
      setSaveThresholdMsg('Đã áp dụng chế độ: 🍃 Tiết Kiệm Tải Tối Đa (Low Overhead)');
    }
    setTimeout(() => setSaveThresholdMsg(''), 3000);
  };

  const handleExecuteSimulation = async () => {
    // Request permission if browser channel is enabled
    await requestNotificationPermission();

    let targetArticle: ScrapedNewsItem = selectedScenario.article;
    let triggerName: string = selectedScenario.triggerName;
    let priorityLevel: 'critical' | 'high' | 'medium' = selectedScenario.priorityLevel;
    let alertLevel = selectedScenario.alertLevel || (priorityLevel === 'critical' ? 'EMERGENCY' : priorityLevel === 'high' ? 'RAPID' : 'EARLY');

    if (useCustomArticle) {
      const found = scrapedArticles.find(a => a.id === selectedArticleId);
      if (found) {
        targetArticle = {
          ...found,
          velocityStatus: 'spike',
          isEmergency: true,
          buzzScore: Math.max(88, found.buzzScore || 85),
          impactScore: Math.max(85, found.impactScore || 80),
        };
        triggerName = `Đột biến Khẩn cấp (${found.sectorNameVi || 'Thị trường'})`;
        priorityLevel = 'critical';
        alertLevel = 'EMERGENCY';
      }
    }

    const matchedKeywords = targetArticle.policyTags && targetArticle.policyTags.length > 0
      ? targetArticle.policyTags
      : targetArticle.tickers && targetArticle.tickers.length > 0
      ? targetArticle.tickers
      : ['BTC', 'Đột biến'];

    const mockAlert: ActiveAlertNotification = {
      id: `sim-alert-${Date.now()}`,
      triggerId: 'simulated-trigger',
      triggerName,
      priorityLevel,
      alertLevel,
      article: targetArticle,
      triggeredAt: new Date().toLocaleTimeString('vi-VN'),
      matchedKeywords,
      isSimulated: true,
    };

    // Log simulation execution to Cloud Firestore
    logSimulationExecutionToCloud({
      scenarioId: selectedScenario.id,
      scenarioName: selectedScenario.name,
      alertLevel,
      articleTitle: targetArticle.title,
      matchedKeywords,
      delaySeconds: simulationDelaySeconds,
    }).catch(err => console.warn('Silent log simulation error:', err));

    if (simulationDelaySeconds > 0) {
      setIsSimulating(true);
      setSimulationCountdown(simulationDelaySeconds);

      const interval = setInterval(() => {
        setSimulationCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsSimulating(false);
            onDispatchTriggerAlert(mockAlert);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      onDispatchTriggerAlert(mockAlert);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 z-[100] backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl border-2 border-slate-200 overflow-hidden bg-slate-950 text-slate-100">
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-700 flex items-center justify-center text-white shadow-md">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  Thiết Lập Ngưỡng Cảnh Báo & Giả Lập Đột Biến
                </h2>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-300 uppercase tracking-wider">
                  TRỌNG ĐIỂM BTC
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                  isCloudDatabaseActive()
                    ? isDark ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700' : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : isDark ? 'bg-amber-950/70 text-amber-300 border-amber-700' : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}>
                  <Database className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  {isCloudDatabaseActive() ? 'Cloud Firestore Đồng Bộ' : 'Local Storage Fallback'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Tự động bắt trọn tin nóng đột biến (Velocity Spike), quản lý ngưỡng rủi ro và lưu trữ đám mây
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncPreferencesToCloud}
              disabled={isCloudSyncing}
              title="Lưu trữ cấu hình ngưỡng cảnh báo lên Cloud Firestore để đồng bộ đa thiết bị"
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-600 text-emerald-200'
                  : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-400 text-emerald-900'
              }`}
            >
              <CloudUpload className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-bounce text-emerald-600' : 'text-emerald-700'}`} />
              <span>{isCloudSyncing ? 'Đang đẩy lên Cloud...' : 'Đồng bộ Preferences lên Cloud'}</span>
            </button>

            <button
              onClick={handleSyncFromCloud}
              disabled={isCloudSyncing}
              title="Đồng bộ lại dữ liệu mới nhất từ Cloud Firestore"
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-900'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin text-blue-500' : 'text-blue-700 dark:text-blue-400'}`} />
              <span>{isCloudSyncing ? 'Đang đồng bộ...' : 'Tải từ Cloud'}</span>
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl border cursor-pointer transition ${
                isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white' : 'border-slate-300 hover:bg-slate-200 text-slate-700 hover:text-slate-950'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {cloudSyncMsg && (
          <div className="px-6 py-2 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{cloudSyncMsg}</span>
            </div>
            <button onClick={() => setCloudSyncMsg('')} className="text-emerald-400 hover:text-emerald-200 text-xs font-bold">✕</button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className={`flex border-b-2 px-6 pt-2 gap-2 sm:gap-4 overflow-x-auto ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100/90 border-slate-300'}`}>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'alerts'
                ? 'border-red-700 text-red-800 dark:text-red-400 font-black'
                : isDark ? 'border-transparent text-slate-300 hover:text-white' : 'border-transparent text-slate-700 hover:text-slate-950'
            }`}
          >
            <BellRing className="w-4 h-4 text-red-600" />
            <span>Cảnh Báo Nổi Bật ({activeAlerts.length})</span>
            {activeAlerts.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-red-600 text-white rounded-full font-extrabold animate-pulse">
                {activeAlerts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('thresholds')}
            className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'thresholds'
                ? 'border-blue-800 text-blue-900 dark:text-blue-400 font-black'
                : isDark ? 'border-transparent text-slate-300 hover:text-white' : 'border-transparent text-slate-700 hover:text-slate-950'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-700" />
            <span>Cấu Hình 5 Cấp Độ Cảnh Báo</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'rules'
                ? 'border-indigo-800 text-indigo-900 dark:text-indigo-400 font-black'
                : isDark ? 'border-transparent text-slate-300 hover:text-white' : 'border-transparent text-slate-700 hover:text-slate-950'
            }`}
          >
            <Sliders className="w-4 h-4 text-indigo-700" />
            <span>Danh Sách Ngưỡng Kích Hoạt ({rules.filter(r => r.enabled).length}/{rules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ignorelist')}
            className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'ignorelist'
                ? 'border-emerald-800 text-emerald-900 dark:text-emerald-400 font-black'
                : isDark ? 'border-transparent text-slate-300 hover:text-white' : 'border-transparent text-slate-700 hover:text-slate-950'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Danh Sách Bỏ Qua ({ignoreRules.filter(r => r.enabled).length}/{ignoreRules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'simulator'
                ? 'border-amber-800 text-amber-900 dark:text-amber-400 font-black'
                : isDark ? 'border-transparent text-slate-300 hover:text-white' : 'border-transparent text-slate-700 hover:text-slate-950'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-700" />
            <span>Giả Lập Gửi Cảnh Báo</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 0: DEDICATED ALERTS LIST (MỤC CẢNH BÁO NỔI BẬT RIÊNG) */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              {/* Header Info & Actions */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      Bảng Giám Sát Cảnh Báo Nổi Bật (Chuyên Biệt)
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      Không làm phiền màn hình chính
                    </span>
                  </div>
                  <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Hệ thống lưu giữ các cảnh báo nóng nhất theo 5 cấp độ chuẩn hoá. Không bật popup choán tầm nhìn.
                  </p>
                </div>
                {activeAlerts.length > 0 && onClearAllAlerts && (
                  <button
                    onClick={onClearAllAlerts}
                    className={`self-start sm:self-auto px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    Xoá tất cả ({activeAlerts.length})
                  </button>
                )}
              </div>

              {/* 5 Cấp Độ Cảnh Báo Chuẩn Hoá (Filter Bar & Legend - Executive Minimalist Style) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {[
                  {
                    key: 'ALL',
                    label: 'TẤT CẢ',
                    count: activeAlerts.length,
                    borderNormal: 'border-slate-300 dark:border-slate-700',
                    borderActive: 'border-slate-900 ring-2 ring-slate-900 dark:border-white dark:ring-white bg-slate-100/90 dark:bg-slate-800',
                    bg: 'bg-white dark:bg-slate-900',
                    textColor: 'text-slate-900 dark:text-slate-100',
                    numColor: 'text-slate-950 dark:text-white',
                  },
                  {
                    key: 'EMERGENCY',
                    label: '🚨 CẤP BÁCH',
                    count: activeAlerts.filter(a => a.alertLevel === 'EMERGENCY' || a.priorityLevel === 'critical').length,
                    borderNormal: 'border-red-300 dark:border-red-800',
                    borderActive: 'border-red-700 ring-2 ring-red-700 dark:border-red-500 dark:ring-red-500 bg-red-50/90 dark:bg-red-950/60',
                    bg: 'bg-red-50/40 dark:bg-red-950/25',
                    textColor: 'text-red-900 dark:text-red-300',
                    numColor: 'text-red-700 dark:text-red-400',
                  },
                  {
                    key: 'RAPID',
                    label: '⚡ ĐÁNG CHÚ Ý',
                    count: activeAlerts.filter(a => a.alertLevel === 'RAPID').length,
                    borderNormal: 'border-amber-300 dark:border-amber-800',
                    borderActive: 'border-amber-700 ring-2 ring-amber-700 dark:border-amber-500 dark:ring-amber-500 bg-amber-50/90 dark:bg-amber-950/60',
                    bg: 'bg-amber-50/40 dark:bg-amber-950/25',
                    textColor: 'text-amber-900 dark:text-amber-300',
                    numColor: 'text-amber-800 dark:text-amber-400',
                  },
                  {
                    key: 'EARLY',
                    label: '⏳ CẦN LƯU TÂM',
                    count: activeAlerts.filter(a => a.alertLevel === 'EARLY').length,
                    borderNormal: 'border-orange-300 dark:border-orange-800',
                    borderActive: 'border-orange-700 ring-2 ring-orange-700 dark:border-orange-500 dark:ring-orange-500 bg-orange-50/90 dark:bg-orange-950/60',
                    bg: 'bg-orange-50/40 dark:bg-orange-950/25',
                    textColor: 'text-orange-900 dark:text-orange-300',
                    numColor: 'text-orange-800 dark:text-orange-400',
                  },
                  {
                    key: 'DISTANT',
                    label: '📡 DỰ BÁO XA',
                    count: activeAlerts.filter(a => a.alertLevel === 'DISTANT').length,
                    borderNormal: 'border-blue-300 dark:border-blue-800',
                    borderActive: 'border-blue-700 ring-2 ring-blue-700 dark:border-blue-500 dark:ring-blue-500 bg-blue-50/90 dark:bg-blue-950/60',
                    bg: 'bg-blue-50/40 dark:bg-blue-950/25',
                    textColor: 'text-blue-900 dark:text-blue-300',
                    numColor: 'text-blue-800 dark:text-blue-400',
                  },
                  {
                    key: 'STANDARD',
                    label: '📋 THƯỜNG QUY',
                    count: activeAlerts.filter(a => a.alertLevel === 'STANDARD' || (!a.alertLevel && a.priorityLevel === 'medium')).length,
                    borderNormal: 'border-slate-300 dark:border-slate-700',
                    borderActive: 'border-slate-700 ring-2 ring-slate-700 dark:border-slate-400 dark:ring-slate-400 bg-slate-200/90 dark:bg-slate-800',
                    bg: 'bg-slate-100/60 dark:bg-slate-800/40',
                    textColor: 'text-slate-800 dark:text-slate-200',
                    numColor: 'text-slate-900 dark:text-slate-100',
                  },
                ].map((item) => {
                  const isSelected = selectedLevelFilter === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setSelectedLevelFilter(item.key as any)}
                      className={`p-3 rounded-xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer shadow-xs ${
                        item.bg
                      } ${isSelected ? `${item.borderActive} shadow-md scale-[1.02]` : `${item.borderNormal} hover:border-slate-400 opacity-95 hover:opacity-100`}`}
                    >
                      <span className={`text-xs font-black truncate tracking-tight ${item.textColor}`}>{item.label}</span>
                      <div className="flex items-baseline justify-between mt-1.5">
                        <span className={`text-2xl font-black ${item.numColor}`}>{item.count}</span>
                        {isSelected && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${isDark ? 'bg-white/15 text-white' : 'bg-slate-900 text-white'}`}>
                            Đang chọn
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Alert List */}
              {(() => {
                const filtered = activeAlerts.filter(a => {
                  if (selectedLevelFilter === 'ALL') return true;
                  const effectiveLevel: WarningAlertLevelType =
                    a.alertLevel ||
                    (a.priorityLevel === 'critical' ? 'EMERGENCY' : a.priorityLevel === 'high' ? 'RAPID' : 'EARLY');
                  return effectiveLevel === selectedLevelFilter;
                });

                if (filtered.length === 0) {
                  return (
                    <div className={`py-12 px-6 text-center rounded-2xl border-2 transition ${
                      isDark ? 'border-slate-800 bg-slate-900/80 shadow-inner' : 'border-slate-200 bg-white shadow-sm'
                    }`}>
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm ${
                        isDark ? 'bg-emerald-950 text-emerald-300 border-2 border-emerald-700' : 'bg-emerald-50 text-emerald-800 border-2 border-emerald-300'
                      }`}>
                        <ShieldCheck className="w-9 h-9" />
                      </div>
                      <h4 className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                        Không có cảnh báo đột biến nào chưa xử lý
                      </h4>
                      <p className={`text-sm max-w-lg mx-auto mt-2.5 font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Hệ thống tiếp tục giám sát ngầm toàn bộ 150 nguồn tin tài chính. Khi có biến cố nghiêm trọng hoặc đạt ngưỡng kích hoạt, thông báo nổi bật sẽ lập tức hiện tại đây.
                      </p>
                      <button
                        onClick={() => setActiveTab('simulator')}
                        className="mt-5 px-6 py-2.5 text-sm font-black rounded-xl bg-blue-800 hover:bg-blue-900 text-white transition cursor-pointer inline-flex items-center gap-2 shadow-md active:scale-95"
                      >
                        <Zap className="w-4 h-4 text-amber-300" />
                        Chạy thử Giả Lập Cảnh Báo
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {filtered.map((alert) => {
                      const effectiveLevel: WarningAlertLevelType =
                        alert.alertLevel ||
                        (alert.priorityLevel === 'critical' ? 'EMERGENCY' : alert.priorityLevel === 'high' ? 'RAPID' : 'EARLY');

                      const levelStyles = {
                        EMERGENCY: {
                          border: isDark ? 'border-rose-500/60' : 'border-rose-300',
                          bg: isDark ? 'bg-rose-950/25' : 'bg-rose-50/80',
                          badge: 'bg-rose-600 text-white',
                          tag: '🚨 CẤP BÁCH (EMERGENCY)',
                          icon: <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />,
                        },
                        RAPID: {
                          border: isDark ? 'border-amber-500/60' : 'border-amber-300',
                          bg: isDark ? 'bg-amber-950/25' : 'bg-amber-50/80',
                          badge: 'bg-amber-500 text-white',
                          tag: '⚡ ĐÁNG CHÚ Ý (RAPID)',
                          icon: <Zap className="w-4 h-4 text-amber-500 shrink-0" />,
                        },
                        EARLY: {
                          border: isDark ? 'border-orange-500/60' : 'border-orange-300',
                          bg: isDark ? 'bg-orange-950/25' : 'bg-orange-50/80',
                          badge: 'bg-orange-500 text-white',
                          tag: '⏳ CẦN LƯU TÂM (EARLY)',
                          icon: <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />,
                        },
                        DISTANT: {
                          border: isDark ? 'border-indigo-500/60' : 'border-indigo-300',
                          bg: isDark ? 'bg-indigo-950/25' : 'bg-indigo-50/80',
                          badge: 'bg-indigo-600 text-white',
                          tag: '📡 DỰ BÁO XA (DISTANT)',
                          icon: <Activity className="w-4 h-4 text-indigo-500 shrink-0" />,
                        },
                        STANDARD: {
                          border: isDark ? 'border-slate-700' : 'border-slate-300',
                          bg: isDark ? 'bg-slate-900/40' : 'bg-slate-50',
                          badge: 'bg-slate-600 text-white',
                          tag: '📋 GIÁM SÁT THƯỜNG QUY',
                          icon: <ClipboardList className="w-4 h-4 text-slate-400 shrink-0" />,
                        },
                      }[effectiveLevel];

                      const realPublishTime = alert.article ? formatNewsFullDateTime(alert.article) : alert.triggeredAt;

                      return (
                        <div
                          key={alert.id}
                          className={`p-4 rounded-xl border transition-all hover:shadow-lg ${levelStyles.border} ${levelStyles.bg}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${levelStyles.badge}`}>
                                {levelStyles.icon}
                                {levelStyles.tag}
                              </span>
                              <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {alert.triggerName}
                              </span>
                              {alert.isSimulated && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 border border-indigo-500/30">
                                  Giả lập
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] flex items-center gap-1 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                <Clock className="w-3 h-3" />
                                {realPublishTime}
                              </span>
                              {onClearAlert && (
                                <button
                                  onClick={() => onClearAlert(alert.id)}
                                  className={`p-1 rounded transition cursor-pointer ${
                                    isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
                                  }`}
                                  title="Ẩn cảnh báo này"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <h4 className={`text-sm font-bold mt-2 line-clamp-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                            {alert.article?.title || 'Biến cố truyền thông tài chính'}
                          </h4>

                          <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {alert.article?.snippet || alert.article?.summary || 'Không có bản tóm tắt nội dung trích xuất.'}
                          </p>

                          {/* Khoảng Trống Thông Tin & Việc Cần Làm Ngay */}
                          {(alert.informationGap || alert.actionRequired || alert.article?.informationVacuum?.gapDetails) && (
                            <div className="space-y-2 mt-2.5">
                              {/* Thẻ Khoảng Trống Thông Tin */}
                              <div className={`p-2.5 rounded-xl border text-xs space-y-0.5 ${
                                isDark ? 'bg-amber-950/20 border-amber-900/40 text-amber-200' : 'bg-amber-50/90 border-amber-200/80 text-amber-900'
                              }`}>
                                <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-400">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>🔍 Khoảng Trống Thông Tin:</span>
                                </div>
                                <p className="text-xs font-medium leading-relaxed pl-4 text-slate-800 dark:text-slate-200">
                                  {alert.informationGap || alert.article?.informationVacuum?.gapDetails || 'Quy định/chính sách đang trong giai đoạn băn khoăn hoặc thiếu hướng dẫn chi tiết.'}
                                </p>
                              </div>

                              {/* Thẻ Việc Cần Làm Ngay */}
                              <div className={`p-2.5 rounded-xl border text-xs space-y-0.5 ${
                                isDark ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200' : 'bg-emerald-50/90 border-emerald-200/80 text-emerald-900'
                              }`}>
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                                    <Zap className="w-3 h-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <span>⚡ Việc Cần Làm Ngay (Chính Sách):</span>
                                  </div>
                                  {alert.responsibleUnit && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-600/15 text-emerald-800 dark:text-emerald-300">
                                      🏛️ {alert.responsibleUnit}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-medium leading-relaxed pl-4 text-slate-800 dark:text-slate-200">
                                  {alert.actionRequired || alert.article?.informationVacuum?.recommendedClosureAction || alert.article?.warningPipeline?.level3Action.actionPlaybook?.[0]?.actions?.[0] || 'Hoàn thiện tài liệu giải thích chính sách và lập bộ Q&A nghiệp vụ.'}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Metadata row */}
                          <div className={`flex items-center justify-between gap-2 mt-3 pt-2.5 border-t flex-wrap text-xs ${
                            isDark ? 'border-slate-700/50' : 'border-slate-200'
                          }`}>
                            <div className={`flex items-center gap-3 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              <span>Nguồn: <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{alert.article?.source || 'Bộ Tài chính'}</strong></span>
                              <span>•</span>
                              <span>Buzz Score: <strong className="text-rose-500 font-bold">{alert.article?.buzzScore || 85}/100</strong></span>
                              {alert.matchedKeywords && alert.matchedKeywords.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[200px]">Từ khóa: {alert.matchedKeywords.join(', ')}</span>
                                </>
                              )}
                            </div>

                            {/* Action Triggers */}
                            <div className="flex items-center gap-2">
                              {alert.article?.url && (
                                <a
                                  href={alert.article.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`px-2.5 py-1 text-[11px] rounded-lg border flex items-center gap-1 transition ${
                                    isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Xem gốc
                                </a>
                              )}
                              {onOpenDraftStatement && alert.article && (
                                <button
                                  onClick={() => onOpenDraftStatement(alert.article)}
                                  className="px-2.5 py-1 text-[11px] rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 transition cursor-pointer"
                                >
                                  <FileText className="w-3 h-3" />
                                  Soạn Thông Cáo
                                </button>
                              )}
                              {onOpenExecutiveModal && (
                                <button
                                  onClick={() => onOpenExecutiveModal(alert)}
                                  className="px-3 py-1 text-[11px] rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
                                >
                                  Tham Mưu 4 Trụ Cột
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: THRESHOLD CONFIGURATION (CẤU HÌNH 5 CẤP ĐỘ CẢNH BÁO) */}
          {activeTab === 'thresholds' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Info & Actions */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      <Layers className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                      Quy Chuẩn 5 Cấp Độ Cảnh Báo & Ngưỡng Kích Hoạt
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                      isDark ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-cyan-100 text-cyan-800 border-cyan-300'
                    }`}>
                      Chuẩn Vận Hành BTC
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Thiết lập điểm rủi ro, độ trễ quét tin (polling frequency), ngưỡng tin cậy tên miền và cơ chế loại bỏ tin giả/tin rác tự động.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleResetThresholds}
                    className={`px-3 py-1.5 border rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                      isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Khôi Phục Mặc Định
                  </button>
                  <button
                    onClick={handleSaveThresholds}
                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Lưu Cấu Hình Ngưỡng & Tần Suất
                  </button>
                  <button
                    onClick={handleSyncPreferencesToCloud}
                    disabled={isCloudSyncing}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                    title="Đồng bộ toàn bộ Trọng số Từ khóa & Cấu hình Ngưỡng lên Cloud Firestore cho mọi thiết bị (Sync Local Preferences to Cloud)"
                  >
                    <CloudUpload className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-bounce' : ''}`} />
                    <span>{isCloudSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Preferences Lên Cloud'}</span>
                  </button>
                </div>
              </div>

              {saveThresholdMsg && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{saveThresholdMsg}</span>
                </div>
              )}

              {/* Advanced System Load & Preset Bar */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                isDark ? 'bg-slate-900/90 border-cyan-500/30' : 'bg-cyan-50/70 border-cyan-200 shadow-2xs'
              }`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
                  isDark ? 'border-cyan-500/20' : 'border-cyan-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-cyan-500 dark:text-cyan-400 shrink-0" />
                    <div>
                      <span className={`font-bold text-xs block ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                        ⚙️ Menu Cấu Hình Nâng Cao: Tần Suất Quét (Polling Frequency) & Giảm Tải Hệ Thống
                      </span>
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Tự động điều tiết độ trễ quét tin theo cấp độ cảnh báo để bảo vệ Cloud I/O và ngăn nghẽn mạng khi quét cường độ cao.
                      </span>
                    </div>
                  </div>

                  {/* Preset Fast Switcher */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('realtime')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300' : 'bg-white hover:bg-slate-100 border-slate-300 text-amber-800 shadow-2xs'
                      }`}
                      title="Quét tần suất cao (Crisis 45s, Urgent 2m, Early 4m)"
                    >
                      <Zap className="w-3 h-3 text-amber-500" />
                      ⚡ Cường độ cao
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('balanced')}
                      className="px-2.5 py-1 rounded text-[11px] font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition cursor-pointer flex items-center gap-1 shadow-xs"
                      title="Cân bằng tối ưu (Crisis 60s, Urgent 3m, Early 5m, Standard 30m) - Khuyên dùng"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      ⚖️ Cân bằng tối ưu
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('low_overhead')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-emerald-300' : 'bg-white hover:bg-slate-100 border-slate-300 text-emerald-800 shadow-2xs'
                      }`}
                      title="Tiết kiệm tài nguyên tối đa (Crisis 2m, Urgent 6m, Early 10m, Standard 60m)"
                    >
                      <Cpu className="w-3 h-3 text-emerald-500" />
                      🍃 Tiết kiệm tải
                    </button>
                  </div>
                </div>

                {/* Global Load & Domain Trust Settings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Burst Request Delay */}
                  <div className={`p-3 rounded-lg border space-y-1.5 ${
                    isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                  }`}>
                    <div className={`flex justify-between items-center ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-cyan-500" />
                        Độ trễ giãn cách Burst:
                      </span>
                      <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400 text-xs">
                        {advancedLoadConfig.burstRequestDelayMs} ms
                      </span>
                    </div>
                    <input
                      type="range"
                      min="200"
                      max="3000"
                      step="100"
                      value={advancedLoadConfig.burstRequestDelayMs}
                      onChange={(e) => setAdvancedLoadConfig(prev => ({ ...prev, burstRequestDelayMs: Number(e.target.value) }))}
                      className={`w-full h-1.5 rounded-lg cursor-pointer ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
                    />
                    <span className={`text-[10px] block leading-tight ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Giãn cách giữa các lần gọi API/cổng tin để tránh quá tải nguồn.
                    </span>
                  </div>

                  {/* Global Min Domain Trust Score */}
                  <div className={`p-3 rounded-lg border space-y-1.5 ${
                    isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                  }`}>
                    <div className={`flex justify-between items-center ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                      <span className="flex items-center gap-1 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Ngưỡng Tin Cậy Tên Miền Sàn:
                      </span>
                      <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-xs">
                        ≥ {advancedLoadConfig.globalMinDomainTrustScore || 40} / 100
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      step="5"
                      value={advancedLoadConfig.globalMinDomainTrustScore || 40}
                      onChange={(e) => setAdvancedLoadConfig(prev => ({ ...prev, globalMinDomainTrustScore: Number(e.target.value) }))}
                      className={`w-full h-1.5 rounded-lg cursor-pointer ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
                    />
                    <span className={`text-[10px] block leading-tight ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Tự động hạ bậc hoặc ẩn tin từ các tên miền có điểm tin cậy dưới ngưỡng.
                    </span>
                  </div>

                  {/* Adaptive Throttling & Fake News Filter Toggles */}
                  <div className={`p-3 rounded-lg border flex flex-col justify-between gap-2 ${
                    isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                  }`}>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={advancedLoadConfig.enableAdaptiveThrottling}
                        onChange={(e) => setAdvancedLoadConfig(prev => ({ ...prev, enableAdaptiveThrottling: e.target.checked }))}
                        className="rounded border-slate-400 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
                      />
                      <span className={`text-[11px] font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        Điều tiết thích ứng khi yên tĩnh (Adaptive)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={advancedLoadConfig.autoBlockUnverifiedSpam}
                        onChange={(e) => setAdvancedLoadConfig(prev => ({ ...prev, autoBlockUnverifiedSpam: e.target.checked }))}
                        className="rounded border-slate-400 dark:border-slate-700 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                      />
                      <span className={`text-[11px] font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        Chặn tin giả & tin rác chưa xác minh
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 5 Warning Levels Cards */}
              <div className="space-y-4">
                {(['EMERGENCY', 'RAPID', 'EARLY', 'DISTANT', 'STANDARD'] as WarningAlertLevelType[]).map((levelKey) => {
                  const item = thresholds[levelKey] || ALERT_THRESHOLD_CONFIG[levelKey];
                  const levelThemes = {
                    EMERGENCY: {
                      border: isDark ? 'border-rose-500/60' : 'border-rose-300',
                      bg: isDark ? 'bg-rose-950/20' : 'bg-rose-50/60',
                      badgeBg: 'bg-rose-600 text-white',
                      accent: isDark ? 'text-rose-400' : 'text-rose-700',
                      pollingMin: 30,
                      pollingMax: 300,
                      pollingStep: 15,
                      defaultPollSec: 60,
                    },
                    RAPID: {
                      border: isDark ? 'border-amber-500/60' : 'border-amber-300',
                      bg: isDark ? 'bg-amber-950/20' : 'bg-amber-50/60',
                      badgeBg: 'bg-amber-500 text-white',
                      accent: isDark ? 'text-amber-400' : 'text-amber-700',
                      pollingMin: 60,
                      pollingMax: 600,
                      pollingStep: 30,
                      defaultPollSec: 180,
                    },
                    EARLY: {
                      border: isDark ? 'border-orange-500/60' : 'border-orange-300',
                      bg: isDark ? 'bg-orange-950/20' : 'bg-orange-50/60',
                      badgeBg: 'bg-orange-500 text-white',
                      accent: isDark ? 'text-orange-400' : 'text-orange-700',
                      pollingMin: 120,
                      pollingMax: 1200,
                      pollingStep: 60,
                      defaultPollSec: 300,
                    },
                    DISTANT: {
                      border: isDark ? 'border-indigo-500/60' : 'border-indigo-300',
                      bg: isDark ? 'bg-indigo-950/20' : 'bg-indigo-50/60',
                      badgeBg: 'bg-indigo-600 text-white',
                      accent: isDark ? 'text-indigo-400' : 'text-indigo-700',
                      pollingMin: 300,
                      pollingMax: 3600,
                      pollingStep: 60,
                      defaultPollSec: 600,
                    },
                    STANDARD: {
                      border: isDark ? 'border-slate-600' : 'border-slate-300',
                      bg: isDark ? 'bg-slate-900/40' : 'bg-slate-100/70',
                      badgeBg: 'bg-slate-600 text-white',
                      accent: isDark ? 'text-slate-400' : 'text-slate-700',
                      pollingMin: 600,
                      pollingMax: 7200,
                      pollingStep: 300,
                      defaultPollSec: 1800,
                    },
                  }[levelKey];

                  const formatPollingDisplay = (sec: number = levelThemes.defaultPollSec) => {
                    if (sec < 60) return `${sec} giây (Real-time)`;
                    const mins = Math.floor(sec / 60);
                    const remSec = sec % 60;
                    return remSec > 0 ? `${mins} phút ${remSec}s` : `${mins} phút`;
                  };

                  return (
                    <div
                      key={levelKey}
                      className={`p-4 rounded-xl border transition space-y-3 ${levelThemes.border} ${levelThemes.bg}`}
                    >
                      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
                        isDark ? 'border-slate-700/50' : 'border-slate-200'
                      }`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-1 rounded font-bold text-xs ${levelThemes.badgeBg}`}>
                            {item.badge}
                          </span>
                          <span className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                            {item.nameVi}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            <Clock className="w-3.5 h-3.5 text-cyan-500" />
                            Thời hạn xử lý: <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{item.timing}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Inputs grid for adjusting thresholds & Polling Latency */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        {/* 1. Risk Score Threshold */}
                        <div className={`p-3 rounded-lg border space-y-1 ${
                          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                        }`}>
                          <div className={`flex justify-between items-center ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                            <span className="font-semibold">Ngưỡng Rủi Ro:</span>
                            <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400 text-sm">≥ {item.minRiskScore} đ</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="95"
                            value={item.minRiskScore}
                            onChange={(e) => handleUpdateThresholdField(levelKey, 'minRiskScore', Number(e.target.value))}
                            className={`w-full h-1.5 rounded-lg cursor-pointer ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
                          />
                          <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Dấu hiệu khủng hoảng: <strong className="text-amber-600 dark:text-amber-400">{item.minCrisisCriteriaCount || 0} tiêu chí</strong>
                          </span>
                        </div>

                        {/* 2. Polling Frequency per Alert Level */}
                        <div className={`p-3 rounded-lg border space-y-1 ${
                          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                        }`}>
                          <div className={`flex justify-between items-center ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                            <span className="flex items-center gap-1 font-semibold">
                              <Timer className="w-3 h-3 text-cyan-500" />
                              Chu kỳ quét:
                            </span>
                            <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400 text-xs">
                              {formatPollingDisplay(item.pollingFrequencySeconds)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={levelThemes.pollingMin}
                            max={levelThemes.pollingMax}
                            step={levelThemes.pollingStep}
                            value={item.pollingFrequencySeconds || levelThemes.defaultPollSec}
                            onChange={(e) => handleUpdateThresholdField(levelKey, 'pollingFrequencySeconds', Number(e.target.value))}
                            className="w-full h-1.5 bg-cyan-600 dark:bg-cyan-700 rounded-lg cursor-pointer"
                          />
                          <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Độ trễ quét tin khi ở mức {levelKey}
                          </span>
                        </div>

                        {/* 3. Min Domain Trust Score */}
                        <div className={`p-3 rounded-lg border space-y-1 ${
                          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                        }`}>
                          <div className={`flex justify-between items-center ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                            <span className="flex items-center gap-1 font-semibold">
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                              Điểm Tin Cậy Nguồn:
                            </span>
                            <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-xs">
                              ≥ {item.minDomainTrustScore !== undefined ? item.minDomainTrustScore : 50} / 100
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="90"
                            step="5"
                            value={item.minDomainTrustScore !== undefined ? item.minDomainTrustScore : 50}
                            onChange={(e) => handleUpdateThresholdField(levelKey, 'minDomainTrustScore', Number(e.target.value))}
                            className="w-full h-1.5 bg-emerald-600 dark:bg-emerald-700 rounded-lg cursor-pointer"
                          />
                          <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Chỉ kích hoạt nếu nguồn đạt độ tin cậy
                          </span>
                        </div>

                        {/* 4. Fake News & Spam Auto-block */}
                        <div className={`p-3 rounded-lg border flex flex-col justify-between ${
                          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                        }`}>
                          <div>
                            <span className={`font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>🛡️ Lọc Tin Giả / Tin Rác:</span>
                            <label className="flex items-center gap-1.5 cursor-pointer mt-1">
                              <input
                                type="checkbox"
                                checked={item.autoBlockFakeNewsSuspicious !== false}
                                onChange={(e) => handleUpdateThresholdField(levelKey, 'autoBlockFakeNewsSuspicious', e.target.checked)}
                                className="rounded border-slate-400 dark:border-slate-700 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                              />
                              <span className={`text-[11px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                Chặn cảnh báo nếu là tin giật tít / chưa xác minh
                              </span>
                            </label>
                          </div>
                          <span className={`text-[10px] block mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Thời hạn xử lý: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{item.timing}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Standards & Criteria */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                        <div className={`p-2.5 rounded-lg border ${
                          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                        }`}>
                          <span className={`font-bold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>📋 Tiêu Chuẩn Kích Hoạt Cụ Thể:</span>
                          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {item.standardsCriteria || 'Đánh giá tự động theo mô hình chấm điểm rủi ro đa chiều.'}
                          </p>
                        </div>

                        <div className={`p-2.5 rounded-lg border ${
                          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                        }`}>
                          <span className={`font-bold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>🛡️ Quy Tắc Lọc Nhiễu & Loại Trừ:</span>
                          <p className={`text-[11px] leading-relaxed font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            {item.exclusionRules || 'Lọc nhiễu hành chính tự động thông qua Noise Gate.'}
                          </p>
                        </div>
                      </div>

                      {/* SPECIAL HIGHLIGHT FOR EARLY WARNING (40–59) - 7 ACTIONS PLAYBOOK */}
                      {levelKey === 'EARLY' && (
                        <div className={`p-3.5 rounded-xl border space-y-2.5 mt-2 ${
                          isDark ? 'border-orange-500/40 bg-orange-950/30' : 'border-orange-300 bg-orange-50/80 shadow-2xs'
                        }`}>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-orange-600 text-white">
                                ⭐ CẤP QUAN TRỌNG NHẤT HỆ THỐNG
                              </span>
                              <span className={`text-xs font-bold ${isDark ? 'text-orange-300' : 'text-orange-950'}`}>
                                7 Hành Động Tác Chiến Chuẩn Mực (Action Playbook)
                              </span>
                            </div>
                            <span className={`text-[10px] font-mono ${isDark ? 'text-amber-300' : 'text-amber-800 font-bold'}`}>
                              Thời hạn can thiệp: 24h
                            </span>
                          </div>

                          <div className={`p-2 rounded-lg border text-xs italic ${
                            isDark ? 'bg-slate-950/80 border-orange-500/20 text-orange-200' : 'bg-white border-orange-200 text-orange-950 shadow-2xs'
                          }`}>
                            “Mục tiêu của hệ thống không phải chờ khủng hoảng, mà phải báo: <strong>«Nếu không xử lý, chuyện này có thể trở thành vấn đề.»</strong>”
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {EARLY_WARNING_7_ACTIONS.map((act) => (
                              <div
                                key={act.id}
                                className={`p-2 rounded-lg border space-y-1 ${
                                  isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-white shadow-2xs'
                                }`}
                              >
                                <div className={`text-xs font-black flex items-center gap-1.5 ${
                                  isDark ? 'text-orange-300' : 'text-orange-900'
                                }`}>
                                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-800'
                                  }`}>
                                    {act.order}
                                  </span>
                                  <span>{act.label.split('. ')[1] || act.label}</span>
                                </div>
                                <p className={`text-[10px] leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                  {act.detail}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 1: SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-6">
              
              {/* Info banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                isDark ? 'bg-rose-950/20 border-rose-500/30 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}>
                <Flame className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
                <div className="text-xs leading-relaxed">
                  <strong className="font-bold block mb-0.5">Mục đích Trình Giả Lập Đột Biến:</strong>
                  Cho phép Chuyên viên/Lãnh đạo kiểm tra phản ứng của hệ thống cảnh báo âm thanh, thông báo đẩy (Toast/Modal) và khung tham mưu xử lý 4 trụ cột khi có sự cố bùng nổ truyền thông tài chính.
                </div>
              </div>

              {/* Mode Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Option A: Sample & Custom Crisis Scenarios */}
                <div className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                  !useCustomArticle
                    ? isDark ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500' : 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400'
                    : isDark ? 'bg-slate-800/40 border-slate-700 opacity-60' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
                onClick={() => setUseCustomArticle(false)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-sm flex items-center gap-2">
                        <Radio className="w-4 h-4 text-indigo-500" />
                        Kịch Bản Đột Biến ({scenarios.length})
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAddScenario(!showAddScenario);
                          }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Tạo mới</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResetAllScenarios();
                          }}
                          title="Khôi phục danh sách kịch bản mặc định"
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700/40 text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Custom Scenario Form Modal */}
                    {showAddScenario && (
                      <form
                        onSubmit={handleCreateCustomScenarioSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className={`mb-3 p-3 rounded-xl border space-y-2.5 ${
                          isDark ? 'bg-slate-900 border-indigo-500/50' : 'bg-white border-indigo-300 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
                          <span className="flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" /> Thêm Kịch Bản Giả Lập Mới
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowAddScenario(false)}
                            className="text-slate-400 hover:text-slate-200"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Tên kịch bản:</label>
                            <input
                              type="text"
                              required
                              placeholder="VD: Tin đồn sáp nhập ngân hàng..."
                              value={newScenarioName}
                              onChange={(e) => setNewScenarioName(e.target.value)}
                              className={`w-full p-1.5 rounded text-xs border outline-none ${
                                isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Cấp độ cảnh báo:</label>
                            <select
                              value={newScenarioPriority}
                              onChange={(e) => {
                                const p = e.target.value as any;
                                setNewScenarioPriority(p);
                                setNewScenarioAlertLevel(p === 'critical' ? 'EMERGENCY' : p === 'high' ? 'RAPID' : 'EARLY');
                              }}
                              className={`w-full p-1.5 rounded text-xs border outline-none ${
                                isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                              }`}
                            >
                              <option value="critical">CRITICAL (Khẩn cấp cấp 1)</option>
                              <option value="high">HIGH (Cao cấp 2)</option>
                              <option value="medium">MEDIUM (Trung bình cấp 3)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Tiêu đề bài báo giả lập:</label>
                          <input
                            type="text"
                            required
                            placeholder="Tiêu đề bài báo lan truyền..."
                            value={newScenarioArticleTitle}
                            onChange={(e) => setNewScenarioArticleTitle(e.target.value)}
                            className={`w-full p-1.5 rounded text-xs border outline-none ${
                              isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Tóm tắt nội dung bài viết:</label>
                          <textarea
                            rows={2}
                            placeholder="Nội dung bài viết tạo dư luận..."
                            value={newScenarioArticleContent}
                            onChange={(e) => setNewScenarioArticleContent(e.target.value)}
                            className={`w-full p-1.5 rounded text-xs border outline-none ${
                              isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                            }`}
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAddScenario(false)}
                            className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded shadow flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" /> Lưu & Đồng bộ Cloud
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {scenarios.map((scenario) => {
                        const isCustom = scenario.id.startsWith('scenario-custom-');
                        return (
                          <div
                            key={scenario.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setUseCustomArticle(false);
                              setSelectedScenario(scenario);
                            }}
                            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                              selectedScenario.id === scenario.id && !useCustomArticle
                                ? isDark
                                  ? 'bg-slate-900 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/50'
                                  : 'bg-white border-indigo-500 text-slate-900 shadow-sm font-semibold'
                                : isDark
                                ? 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700'
                                : 'bg-white/60 border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold truncate flex items-center gap-1.5">
                                {scenario.name}
                                {isCustom && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                                    Tùy chỉnh
                                  </span>
                                )}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-bold shrink-0 ${
                                  scenario.priorityLevel === 'critical'
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-amber-500 text-white'
                                }`}>
                                  {scenario.priorityLevel}
                                </span>
                                {isCustom && (
                                  <button
                                    onClick={(e) => handleDeleteScenario(scenario.id, e)}
                                    title="Xóa kịch bản này"
                                    className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] opacity-75 line-clamp-2">{scenario.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Option B: Choose an article from Current Scrape */}
                <div className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  useCustomArticle
                    ? isDark ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500' : 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400'
                    : isDark ? 'bg-slate-800/40 border-slate-700 opacity-60' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
                onClick={() => setUseCustomArticle(true)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-sm flex items-center gap-2">
                        <Radio className="w-4 h-4 text-indigo-500" />
                        Chọn Bản Tin Thực Tế Từ Phiên Quét
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-500/20 text-slate-400">
                        {scrapedArticles.length} bài sẵn có
                      </span>
                    </div>

                    <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Chọn bất kỳ bản tin nào từ danh sách bài viết hiện tại để giả lập sự kiện bùng nổ đột biến (Spike) ngay lập tức.
                    </p>

                    <label className="block text-xs font-bold mb-1.5">Chọn bài viết mục tiêu:</label>
                    <select
                      value={selectedArticleId}
                      onChange={(e) => {
                        setSelectedArticleId(e.target.value);
                        setUseCustomArticle(true);
                      }}
                      className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      {scrapedArticles.map((art) => (
                        <option key={art.id} value={art.id}>
                          [{art.sectorNameVi || art.sector}] {art.title.slice(0, 75)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Audio & Notification Test tools */}
                  <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-emerald-500" />
                      Kiểm tra âm thanh:
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => playAlertChime('critical')}
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer transition"
                      >
                        Âm Khẩn Cấp
                      </button>
                      <button
                        onClick={() => playAlertChime('high')}
                        className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold cursor-pointer transition"
                      >
                        Âm Vừa
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Delay & Launch Controls */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100/80 border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold">Thời gian trễ:</span>
                  <div className="flex gap-1.5">
                    {[0, 2, 5].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setSimulationDelaySeconds(sec)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                          simulationDelaySeconds === sec
                            ? 'bg-rose-600 border-rose-500 text-white'
                            : isDark
                            ? 'bg-slate-800 border-slate-700 text-slate-300'
                            : 'bg-white border-slate-300 text-slate-700'
                        }`}
                      >
                        {sec === 0 ? 'Gửi Ngay Lập Tức' : `Sau ${sec} giây`}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleExecuteSimulation}
                  disabled={isSimulating}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 disabled:opacity-50"
                >
                  {isSimulating ? (
                    <>
                      <Zap className="w-4 h-4 animate-spin" />
                      <span>Đang đếm ngược ({simulationCountdown}s)...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kích Hoạt Giả Lập Cảnh Báo Khẩn Cấp</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: RULES MANAGEMENT */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Danh Mục Ngưỡng Cảnh Báo Đang Hoạt Động</h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Hệ thống sẽ tự động quét đối soát bài viết sau mỗi phiên quét để kích hoạt cảnh báo
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddRule(!showAddRule)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Ngưỡng Mới</span>
                  </button>

                  <button
                    onClick={onResetTriggerRules}
                    className={`px-3 py-1.5 border rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition ${
                      isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Mặc Định Bộ</span>
                  </button>
                </div>
              </div>

              {/* Add Custom Rule Form */}
              {showAddRule && (
                <form
                  onSubmit={handleAddRuleSubmit}
                  className={`p-4 rounded-xl border animate-fadeIn ${
                    isDark ? 'bg-slate-950 border-indigo-500/40' : 'bg-indigo-50/70 border-indigo-300'
                  }`}
                >
                  <h4 className="font-bold text-xs mb-3 text-indigo-500 dark:text-indigo-300 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    Thiết Lập Ngưỡng Cảnh Báo Tùy Chỉnh
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">Tên quy tắc cảnh báo:</label>
                      <input
                        type="text"
                        placeholder="VD: Cảnh báo thao túng giá vàng & tỷ giá..."
                        value={newRuleName}
                        onChange={(e) => setNewRuleName(e.target.value)}
                        className={`w-full p-2 rounded-lg border text-xs ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">Cấp độ cảnh báo:</label>
                      <select
                        value={newRuleAlertLevel}
                        onChange={(e) => setNewRuleAlertLevel(e.target.value as WarningAlertLevelType)}
                        className={`w-full p-2 rounded-lg border text-xs ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="DISTANT">🔭 CẤP 1: Cảnh Báo Xa (20–39đ)</option>
                        <option value="EARLY">⏳ CẤP 2: Cảnh Báo Sớm (40–59đ)</option>
                        <option value="RAPID">⚡ CẤP 3: Cảnh Báo Nhanh (60–74đ)</option>
                        <option value="EMERGENCY">🚨 CẤP 4: Cảnh Báo Khẩn Cấp (75–100đ)</option>
                        <option value="STANDARD">📋 Giám Sát Thường Quy (&lt; 20đ)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">Mức độ ưu tiên xử lý:</label>
                      <select
                        value={newRulePriority}
                        onChange={(e) => setNewRulePriority(e.target.value as 'critical' | 'high' | 'medium')}
                        className={`w-full p-2 rounded-lg border text-xs ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="critical">Critical - Tối Khẩn (Báo động đỏ)</option>
                        <option value="high">High - Ưu Tiên Cao</option>
                        <option value="medium">Medium - Giám Sát Thường</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Từ khóa kích hoạt (phân cách bằng dấu phẩy):
                      </label>
                      <input
                        type="text"
                        placeholder="vàng miếng, sJC, độc quyền, ngoại tệ, nhập khẩu..."
                        value={newRuleKeywords}
                        onChange={(e) => setNewRuleKeywords(e.target.value)}
                        className={`w-full p-2 rounded-lg border text-xs ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Từ khóa phủ định / loại trừ nhiễu (Negation Exceptions):
                      </label>
                      <input
                        type="text"
                        placeholder="không buông lỏng, đôn đốc giải ngân, công bố lệnh..."
                        value={newRuleNegations}
                        onChange={(e) => setNewRuleNegations(e.target.value)}
                        className={`w-full p-2 rounded-lg border text-xs ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-bold mb-1">
                      Tiêu chuẩn & điều kiện kích hoạt:
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Chỉ kích hoạt khi có lệnh điều tra chính thức hoặc chậm thanh toán nợ..."
                      value={newRuleActivationStandard}
                      onChange={(e) => setNewRuleActivationStandard(e.target.value)}
                      className={`w-full p-2 rounded-lg border text-xs ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Điểm Buzz tối thiểu: <span className="text-rose-500 font-extrabold">{newRuleMinBuzz}</span>/100
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="95"
                        value={newRuleMinBuzz}
                        onChange={(e) => setNewRuleMinBuzz(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id="spikeOnly"
                        checked={newRuleSpikeOnly}
                        onChange={(e) => setNewRuleSpikeOnly(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="spikeOnly" className="text-xs font-medium cursor-pointer">
                        Chỉ kích hoạt khi là <strong>Velocity Spike (Đột biến)</strong>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddRule(false)}
                      className={`px-3 py-1.5 rounded-lg border text-xs ${
                        isDark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'
                      }`}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Lưu Ngưỡng Kích Hoạt
                    </button>
                  </div>
                </form>
              )}

              {/* Rules List */}
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      rule.enabled
                        ? isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
                        : isDark ? 'bg-slate-900/30 border-slate-800 opacity-50' : 'bg-slate-100/60 border-slate-200 opacity-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => handleToggleRule(rule.id)}
                        className="mt-1 w-4 h-4 rounded cursor-pointer text-indigo-600"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{rule.name}</h4>
                          {rule.alertLevel && (
                            <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                              rule.alertLevel === 'EMERGENCY'
                                ? isDark ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-rose-100 text-rose-800 border border-rose-300'
                                : rule.alertLevel === 'RAPID'
                                ? isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-amber-100 text-amber-800 border border-amber-300'
                                : rule.alertLevel === 'EARLY'
                                ? isDark ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'bg-orange-100 text-orange-800 border border-orange-300'
                                : rule.alertLevel === 'DISTANT'
                                ? isDark ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                                : isDark ? 'bg-slate-500/20 text-slate-300 border border-slate-500/40' : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}>
                              {ALERT_THRESHOLD_CONFIG[rule.alertLevel]?.badge || rule.alertLevel}
                            </span>
                          )}
                          <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                            rule.priorityLevel === 'critical'
                              ? isDark ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-rose-100 text-rose-800 border border-rose-300'
                              : rule.priorityLevel === 'high'
                              ? isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-amber-100 text-amber-800 border border-amber-300'
                              : isDark ? 'bg-slate-500/20 text-slate-300 border border-slate-500/40' : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}>
                            {rule.priorityLevel}
                          </span>
                          {rule.requireVelocitySpike && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5" /> Spike
                            </span>
                          )}
                          {rule.requireTier1 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-600 text-white font-bold">
                              Tầng 1
                            </span>
                          )}
                        </div>

                        {rule.activationStandard && (
                          <div className={`text-[11px] mt-1 flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span className="text-cyan-600 dark:text-cyan-400 font-bold">📋 Tiêu chuẩn:</span>
                            <span>{rule.activationStandard}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <span className={`text-[10px] font-semibold self-center mr-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Từ khóa:</span>
                          {rule.keywords.map((kw, kIdx) => (
                            <span
                              key={kIdx}
                              className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-800 font-medium'
                              }`}
                            >
                              {kw}
                            </span>
                          ))}
                        </div>

                        {rule.negationExceptions && rule.negationExceptions.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mr-1 flex items-center gap-1">
                              ⛔ Loại trừ (Noise Gate):
                            </span>
                            {rule.negationExceptions.map((neg, nIdx) => (
                              <span
                                key={nIdx}
                                className={`text-[10px] px-1.5 py-0.2 rounded border font-mono ${
                                  isDark ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                }`}
                              >
                                "{neg}"
                              </span>
                            ))}
                          </div>
                        )}

                        <div className={`text-[11px] mt-1.5 flex items-center gap-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          <span>Buzz tối thiểu: <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{rule.minBuzzScore}</strong></span>
                          <span>•</span>
                          <span>Âm thanh: <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{rule.soundEnabled ? 'Bật' : 'Tắt'}</strong></span>
                        </div>
                      </div>
                    </div>

                    {rule.category === 'custom' && (
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition self-end sm:self-center cursor-pointer"
                        title="Xóa quy tắc này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB: IGNORE-LIST / WHITELIST MANAGER */}
          {activeTab === 'ignorelist' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Header / Info banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}>
                <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-sm font-bold text-emerald-400">
                      Danh Sách Bỏ Qua & Whitelist Lọc Nhiễu Thường Quy (Noise Gate)
                    </strong>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      Đồng bộ Cloud & Local
                    </span>
                  </div>
                  <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Các bài viết chứa từ khóa/mẫu trong danh sách này sẽ <strong>tuyệt đối không kích hoạt cảnh báo khẩn cấp (Cấp 1 & Cấp 2)</strong>, 
                    được tự động xếp vào diện cập nhật thường quy hoặc hạ bậc rủi ro. 
                    Phù hợp cho các tin tức như <em>VPBank chia cổ tức tăng vốn 100.000 tỷ</em>, <em>thị trường lao động chuyển đổi số</em>, <em>lãi suất tiết kiệm</em>,...
                  </p>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`text-[11px] font-bold mb-2 flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Mẫu thường gặp (Bấm để thêm nhanh):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '+ Cổ tức & Tăng vốn', pattern: 'cổ tức', desc: 'Chia cổ tức bằng cổ phiếu / tiền mặt', cat: 'corporate_dividend' as const },
                    { label: '+ VPBank tăng vốn 100.000 tỷ', pattern: 'vpbank', desc: 'VPBank chốt quyền trả cổ tức tăng vốn điều lệ', cat: 'corporate_dividend' as const },
                    { label: '+ Thị trường lao động & Chuyển đổi số', pattern: 'thị trường lao động', desc: 'Nghiên cứu thị trường lao động và thể chế mới', cat: 'governance_reform' as const },
                    { label: '+ ĐHĐCĐ thường niên', pattern: 'đhđcđ', desc: 'Đại hội đồng cổ đông thường niên các ngân hàng', cat: 'banking_infrastructure' as const },
                    { label: '+ Lãi suất huy động', pattern: 'lãi suất tiền gửi', desc: 'Biểu lãi suất huy động định kỳ', cat: 'banking_infrastructure' as const },
                    { label: '+ Kết quả kinh doanh', pattern: 'lợi nhuận trước thuế', desc: 'Báo cáo kết quả kinh doanh quý/năm', cat: 'routine_business' as const },
                  ].map((preset, pIdx) => {
                    const exists = ignoreRules.some(r => r.pattern.toLowerCase() === preset.pattern.toLowerCase());
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleQuickAddPresetIgnore(preset.pattern, preset.desc, preset.cat)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition font-medium flex items-center gap-1 cursor-pointer ${
                          exists
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 opacity-70'
                            : isDark
                            ? 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200 hover:border-slate-500'
                            : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                        }`}
                      >
                        {exists ? '✓ Đã có: ' + preset.pattern : preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Bar & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm từ khóa bỏ qua (pattern)..."
                    value={ignoreFilterKeyword}
                    onChange={(e) => setIgnoreFilterKeyword(e.target.value)}
                    className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  {ignoreFilterKeyword && (
                    <button
                      onClick={() => setIgnoreFilterKeyword('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddIgnoreRule(!showAddIgnoreRule)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-emerald-600/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddIgnoreRule ? 'Đóng biểu mẫu' : 'Thêm từ khóa bỏ qua'}</span>
                  </button>

                  <button
                    onClick={handleResetIgnore}
                    title="Khôi phục danh sách Ignore-list mặc định ban đầu"
                    className={`p-1.5 rounded-xl border transition cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Add Ignore Rule Form */}
              {showAddIgnoreRule && (
                <form
                  onSubmit={handleCreateIgnoreRuleSubmit}
                  className={`p-4 rounded-xl border space-y-3 animate-fadeIn ${
                    isDark ? 'bg-slate-900 border-emerald-500/50' : 'bg-emerald-50/40 border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <Plus className="w-4 h-4" /> Thêm Mẫu / Từ Khóa Bỏ Qua Mới
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddIgnoreRule(false)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                        Từ khóa / Cụm từ / Regex (Không phân biệt hoa thường):
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: trả cổ tức, tăng vốn, vpbank, thị trường lao động..."
                        value={newIgnorePattern}
                        onChange={(e) => setNewIgnorePattern(e.target.value)}
                        className={`w-full p-2 rounded-lg border text-xs outline-none ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300'
                        }`}
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Có thể nhập chuỗi thông thường hoặc Regex dạng <code>/pattern/i</code>
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Phân loại danh mục:</label>
                      <select
                        value={newIgnoreCategory}
                        onChange={(e) => setNewIgnoreCategory(e.target.value as any)}
                        className={`w-full p-2 rounded-lg border text-xs outline-none ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300'
                        }`}
                      >
                        <option value="corporate_dividend">📈 Hoạt động Cổ tức & Tăng vốn</option>
                        <option value="banking_infrastructure">🏦 Hạ tầng & Sản phẩm Ngân hàng</option>
                        <option value="governance_reform">📑 Thể chế & Lao động vĩ mô</option>
                        <option value="routine_business">🏢 Hoạt động Doanh nghiệp Thường quy</option>
                        <option value="custom">⚙️ Tùy biến khác</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                      Mô tả lý do loại trừ / ghi chú nghiệp vụ:
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Thông tin tăng vốn kinh doanh thường quy, không phải khủng hoảng thanh khoản"
                      value={newIgnoreDesc}
                      onChange={(e) => setNewIgnoreDesc(e.target.value)}
                      className={`w-full p-2 rounded-lg border text-xs outline-none ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddIgnoreRule(false)}
                      className="px-3 py-1.5 rounded-lg border text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Lưu và Kích Hoạt
                    </button>
                  </div>
                </form>
              )}

              {/* List of Ignore Rules */}
              <div className="space-y-2.5">
                {ignoreRules
                  .filter(r => {
                    if (!ignoreFilterKeyword) return true;
                    const kw = ignoreFilterKeyword.toLowerCase();
                    return r.pattern.toLowerCase().includes(kw) || (r.description || '').toLowerCase().includes(kw);
                  })
                  .map((rule) => {
                    const categoryBadges: Record<string, { label: string; color: string }> = {
                      corporate_dividend: { label: 'Cổ tức / Vốn', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
                      banking_infrastructure: { label: 'Hạ tầng Ngân hàng', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
                      governance_reform: { label: 'Thể chế / Lao động', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                      routine_business: { label: 'Doanh nghiệp', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                      custom: { label: 'Tùy biến', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
                    };
                    const badge = categoryBadges[rule.category || 'custom'] || categoryBadges.custom;

                    return (
                      <div
                        key={rule.id}
                        className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                          rule.enabled
                            ? isDark
                              ? 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                            : isDark
                            ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                            : 'bg-slate-100 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={() => handleToggleIgnore(rule.id)}
                            className="mt-1 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                            title={rule.enabled ? 'Bấm để tạm dừng quy tắc' : 'Bấm để kích hoạt lại'}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                                isDark ? 'bg-slate-800 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              }`}>
                                {rule.pattern}
                              </span>
                              <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold border ${badge.color}`}>
                                {badge.label}
                              </span>
                              {rule.enabled ? (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  Đang lọc
                                </span>
                              ) : (
                                <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Tạm dừng</span>
                              )}
                            </div>

                            {rule.description && (
                              <p className={`text-xs mt-1 truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {rule.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleDeleteIgnore(rule.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                            title="Xóa mẫu này khỏi danh sách"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {ignoreRules.length === 0 && (
                  <div className={`p-8 text-center border rounded-xl border-dashed text-xs ${
                    isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'
                  }`}>
                    Chưa có từ khóa nào trong danh sách bỏ qua. Hãy bấm "Thêm từ khóa bỏ qua" hoặc chọn mẫu có sẵn ở trên.
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className={`px-6 py-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
          isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'
        }`}>
          <span className="flex items-center gap-2 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Bảo đảm tuân thủ quy chuẩn cảnh báo an toàn thông tin BTC</span>
          </span>

          <div className="flex items-center gap-2.5">
            {syncPrefsNotice && (
              <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 animate-fadeIn">
                {syncPrefsNotice}
              </span>
            )}
            <button
              type="button"
              onClick={handleSyncPreferencesToCloud}
              disabled={isSyncingCloudPrefs}
              className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white font-black text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50 active:scale-95"
              title="Đồng bộ cấu hình ngưỡng cảnh báo và từ khóa lên Google Cloud Firestore cho đa thiết bị"
              id="alert-modal-sync-preferences-btn"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${isSyncingCloudPrefs ? 'animate-spin' : ''}`} />
              <span>{isSyncingCloudPrefs ? 'Đang đồng bộ...' : 'Sync Preferences lên Cloud'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl transition cursor-pointer shadow-sm active:scale-95"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
