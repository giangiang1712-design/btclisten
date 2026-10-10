import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  TimeRange,
  SectorType,
  SentimentType,
  ImpactLevel,
  NewsSortOption,
  NewsFeedViewMode,
  ScrapeResponse,
  ScrapedNewsItem,
  UrgentAlert,
  AlertTriggerRule,
  ActiveAlertNotification,
  ViewDensityMode,
  formatNewsFullDateTime,
} from './types';
import { fetchFinancialNews, fetchOfficialMofNews, fetchAppMetadata, parseStrictArticleTimestamp } from './services/api';
import { Header } from './components/Header';
import { CmsSidebar, CmsNavigationTab } from './components/CmsSidebar';
import { CmsContentTable } from './components/CmsContentTable';
import { MarketPulseWidget } from './components/MarketPulseWidget';
import { SectorFilter } from './components/SectorFilter';
import { CustomKeywordScanner } from './components/CustomKeywordScanner';
import { NewsCard } from './components/NewsCard';
import { TrendingBuzzWidget } from './components/TrendingBuzzWidget';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { TopicTrendVelocityModule } from './components/TopicTrendVelocityModule';
import { SentimentLeadershipAdvisoryModule } from './components/SentimentLeadershipAdvisoryModule';
import { SentimentFormulaExplainerModule } from './components/SentimentFormulaExplainerModule';
import { DeepDiveModal } from './components/DeepDiveModal';
import { ExportReportModal } from './components/ExportReportModal';
import { KeywordWeightModal } from './components/KeywordWeightModal';
import { LeadershipInsightsBanner } from './components/LeadershipInsightsBanner';
import { DraftStatementModal } from './components/DraftStatementModal';
import { AlertTriggerModal } from './components/AlertTriggerModal';
import { ExecutiveUrgentAlertModal } from './components/ExecutiveUrgentAlertModal';
import { PolicySubmissionModal } from './components/PolicySubmissionModal';
import { ModalAdvisorChatbot } from './components/ModalAdvisorChatbot';
import { KnowledgeBaseManager, UserKnowledgeDocument } from './components/KnowledgeBaseManager';
import { NewsSourcesHub } from './components/NewsSourcesHub';
import { NewsDatabaseExplorer } from './components/NewsDatabaseExplorer';
import { EntityKnowledgeGraph } from './components/EntityKnowledgeGraph';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { scrollToNewsCard } from './lib/scrollToArticle';
import { FloatingAdvisorChatButton } from './components/FloatingAdvisorChatButton';
import { SocialListeningOperationalWorkflow } from './components/SocialListeningOperationalWorkflow';
import { MobileSwipeableDashboard } from './components/MobileSwipeableDashboard';
import { ExecutiveDashboardView } from './components/ExecutiveDashboardView';
import { MainFourStageFlow } from './components/MainFourStageFlow';
import { MLPerformanceWidget } from './components/MLPerformanceWidget';
import { ScrapeProgressBar } from './components/ScrapeProgressBar';
import { ExecutiveCommandBar } from './components/ExecutiveCommandBar';
import { MobileStickyFooter } from './components/MobileStickyFooter';
import { NewsVideoModal } from './components/NewsVideoModal';
import { BackgroundSyncIndicator } from './components/BackgroundSyncIndicator';
import { backgroundSyncManager } from './services/backgroundSyncManager';
import { FullscreenLoadingOverlay } from './components/FullscreenLoadingOverlay';
import { archiveScrapedNewsBatchToCloud } from './lib/newsArchiveService';
import {
  isCloudDatabaseActive,
  isFirestoreQuotaExceeded,
  fetchAlertThresholdConfigFromCloud,
  fetchAlertTriggerRulesFromCloud,
  subscribeToCloudAlertThresholdConfig,
  subscribeToCloudAlertTriggerRules,
  saveSopTrackingRecordToCloud,
  fetchSopTrackingRecordsFromCloud,
} from './lib/firebase';
import { GmailAlertModal } from './components/GmailAlertModal';
import { ApiKeySettingsModal } from './components/ApiKeySettingsModal';
import { DatabaseResetModal } from './components/DatabaseResetModal';
import { globalNewsDatabase } from './lib/newsDatabase';
import { createPristineEmptyScrapeResponse, verifyAndSanitizeEmptyDataState } from './lib/emptyDataStateHelper';
import { auditAndFlagNewsTimestamps, computeArticleSha256Checksum, filterDuplicateArticlesBySha256 } from './lib/dataIntegrityChecker';
import { useDataIntegrityCheck } from './hooks/useDataIntegrityCheck';
import { TaxonomyDefinitionModal } from './components/TaxonomyDefinitionModal';
import { TimeWindowAuditModal } from './components/TimeWindowAuditModal';
import { OfficialPortalsStatusModal } from './components/OfficialPortalsStatusModal';
import { SentimentScoreBreakdownModal } from './components/SentimentScoreBreakdownModal';
import { WarningPipelineModelModal } from './components/WarningPipelineModelModal';
import { ViolationEvidenceDossierModal } from './components/ViolationEvidenceDossierModal';
import { ReaderCommentsSentimentModal } from './components/ReaderCommentsSentimentModal';
import { AiArticleFeedbackModal } from './components/AiArticleFeedbackModal';
import { AiExclusionRulesModal } from './components/AiExclusionRulesModal';
import { getApiKeyHeaders } from './lib/apiKeyManager';
import { TrendProjectionWidget } from './components/TrendProjectionWidget';
import { FineTuningStudio } from './components/FineTuningStudio';
import { SemanticDictionaryAdmin } from './components/SemanticDictionaryAdmin';
import { BatchAlertSummaryDrawer } from './components/BatchAlertSummaryDrawer';
import { UrgentNotificationToast } from './components/UrgentNotificationToast';
import { checkAndAutoDispatchGmailAlerts } from './lib/gmailAlertService';
import { useTheme } from './lib/theme';
import { useI18n } from './lib/i18n';
import {
  KeywordWeightMap,
  KeywordWeightDef,
  loadCustomKeywordWeights,
  saveCustomKeywordWeights,
  resetCustomKeywordWeights,
  extractWeightedKeywordsForText,
  calculateArticleMoFPriorityScore,
  DEFAULT_KEYWORD_CONFIG,
} from './lib/keywordWeights';
import { enrichKeywordsWith24hTrendForecast } from './lib/trendForecaster';
import { isRiskArticle, isBrightSpotArticle } from './lib/newsClassification';
import { isEarlyWarningArticle, isDistantWarningArticle, isSopLevel4Article } from './lib/sentimentCalculator';
import {
  loadAlertTriggers,
  saveAlertTriggers,
  resetAlertTriggers,
  evaluateArticlesForTriggers,
  playAlertChime,
  sendBrowserNotification,
  loadAlertThresholdConfig,
  saveAlertThresholdConfig,
  AlertThresholdConfig,
} from './lib/alertTriggers';
import {
  List,
  BarChart2,
  AlertCircle,
  RotateCw,
  Sparkles,
  Inbox,
  Clock,
  ArrowUpDown,
  Sliders,
  Camera,
  FileText,
  LayoutList,
  AlignJustify,
  LayoutDashboard,
  Table,
  FileCheck2,
  PieChart,
  ShieldAlert,
  TrendingUp,
  Activity,
  ArrowRight,
  Zap,
  Cpu,
  Landmark,
  Calculator,
  Award,
  Globe2,
  Globe,
  Building2,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Layers,
} from 'lucide-react';

function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const { t, isVietnamese } = useI18n();
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [sector, setSector] = useState<SectorType>('all');
  const [query, setQuery] = useState<string>('');
  const [selectedSentiment, setSelectedSentiment] = useState<SentimentType | 'all'>('all');
  const [selectedImpact, setSelectedImpact] = useState<ImpactLevel | 'all'>('all');
  const [sortBy, setSortBy] = useState<NewsSortOption>('time_desc');
  const [feedViewMode, setFeedViewMode] = useState<NewsFeedViewMode>('detailed');
  const [showHighConfidenceOnly, setShowHighConfidenceOnly] = useState<boolean>(false);
  const [showHighConfidenceBrightSpotOnly, setShowHighConfidenceBrightSpotOnly] = useState<boolean>(false);
  const [showNeutralOnly, setShowNeutralOnly] = useState<boolean>(false);
  const [showHighImpactOnly, setShowHighImpactOnly] = useState<boolean>(false);
  const [showInterventionOnly, setShowInterventionOnly] = useState<boolean>(false);
  const [showDivergenceOnly, setShowDivergenceOnly] = useState<boolean>(false);
  const [showEarlyHorizonOnly, setShowEarlyHorizonOnly] = useState<boolean>(false);
  const [showEarlyWarningOnly, setShowEarlyWarningOnly] = useState<boolean>(false);
  const [dashboardLayoutView, setDashboardLayoutView] = useState<'executive' | 'stages'>('executive');

  // CMS Navigation State
  const [cmsTab, setCmsTab] = useState<CmsNavigationTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const [data, setData] = useState<ScrapeResponse | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const isResetCleared = localStorage.getItem('finpulse_is_database_reset_cleared') === 'true';
        if (isResetCleared) {
          console.log('🛡️ [State Init - data] Database is in reset 0-state. Initializing pristine empty ScrapeResponse.');
          return createPristineEmptyScrapeResponse('24h', 'all');
        }
      } catch (e) {
        console.warn('Could not check reset state:', e);
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResetInProgress, setIsResetInProgress] = useState<boolean>(false);
  // Turbo Silent Background Scrape Mode: Scans 150 sources in parallel in background without blocking screen
  const [turboSilentMode, setTurboSilentMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mof_turbo_silent_mode');
        if (saved !== null) return saved === 'true';
      } catch {
        // ignore
      }
    }
    return true; // Default to Turbo Silent Mode for maximum speed & zero screen-blocking
  });

  const handleToggleTurboSilentMode = () => {
    setTurboSilentMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('mof_turbo_silent_mode', String(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  const [isInitialBoot, setIsInitialBoot] = useState<boolean>(false);
  const [userDismissedLoadingOverlay, setUserDismissedLoadingOverlay] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScannedTime, setLastScannedTime] = useState<string | null>(null);
  const [appMetadata, setAppMetadata] = useState<{ version: string; updatedAt: string }>({ version: 'v1.1', updatedAt: '' });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isScanPendingRef = useRef<boolean>(false);
  const lastScannedTimestampRef = useRef<number>(0);

  // Auto-refresh timer state (0 = Off, 3600 = 1h, 7200 = 2h, 14400 = 4h, 28800 = 8h)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(0);

  // Keyword Weights state for Ministry of Finance and Macro prioritization
  const [keywordWeights, setKeywordWeights] = useState<KeywordWeightMap>(() => loadCustomKeywordWeights());
  const [showKeywordWeightModal, setShowKeywordWeightModal] = useState<boolean>(false);

  // Alert Trigger Rules, Thresholds & Dedicated Alerts state
  const [triggerRules, setTriggerRules] = useState<AlertTriggerRule[]>(() => loadAlertTriggers());
  const [thresholdConfig, setThresholdConfig] = useState<AlertThresholdConfig>(() => loadAlertThresholdConfig());
  const [showTriggerModal, setShowTriggerModal] = useState<boolean>(false);
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlertNotification[]>([]);
  const [isBatchAlertDrawerOpen, setIsBatchAlertDrawerOpen] = useState<boolean>(false);
  const [showBatchToast, setShowBatchToast] = useState<boolean>(true);
  const [activeExecutiveUrgentModal, setActiveExecutiveUrgentModal] = useState<ActiveAlertNotification | null>(null);
  const alertedArticleIdsRef = useRef<Set<string>>(new Set());

  // Advisor Chatbot state
  const [isAdvisorChatOpen, setIsAdvisorChatOpen] = useState<boolean>(false);
  const [advisorContextArticle, setAdvisorContextArticle] = useState<ScrapedNewsItem | null>(null);

  // Command Palette & Keyboard Shortcuts & Database Reset states
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [showDbResetModal, setShowDbResetModal] = useState<boolean>(false);

  // AI Article Exclusion Feedback Loop & Rules Manager states
  const [feedbackArticle, setFeedbackArticle] = useState<ScrapedNewsItem | null>(null);
  const [showAiFeedbackModal, setShowAiFeedbackModal] = useState<boolean>(false);
  const [showAiRulesModal, setShowAiRulesModal] = useState<boolean>(false);
  const [aiFeedbackSuccessToast, setAiFeedbackSuccessToast] = useState<string | null>(null);

  const handleOpenAiFeedback = (article: ScrapedNewsItem) => {
    setFeedbackArticle(article);
    setShowAiFeedbackModal(true);
  };

  const handleOpenAiRules = () => {
    setShowAiRulesModal(true);
  };

  const handleConfirmRemoveAndTrain = async (
    article: ScrapedNewsItem,
    ruleData: {
      ruleName: string;
      userNote: string;
      category: string;
      keywords: string[];
      aiExplanation: string;
    }
  ) => {
    try {
      const res = await fetch('/api/ai-exclusion-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getApiKeyHeaders(),
        },
        body: JSON.stringify({
          articleId: article.id,
          articleTitle: article.title,
          articleUrl: article.url || (article as any).link || '',
          userNote: ruleData.userNote,
          category: ruleData.category,
          ruleName: ruleData.ruleName,
          keywords: ruleData.keywords,
          aiExplanation: ruleData.aiExplanation,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        handleArticleDeleted(article.id);
        setAiFeedbackSuccessToast(
          `Đã loại bỏ bài viết và ghi nhận quy tắc "${ruleData.ruleName}"! AI sẽ tự động loại trừ các bài viết tương tự trong các lần quét tiếp theo.`
        );
        setTimeout(() => {
          setAiFeedbackSuccessToast(null);
        }, 6000);
      } else {
        throw new Error(resData.error || 'Không thể lưu quy tắc AI');
      }
    } catch (err: any) {
      console.error('Lỗi khi đào tạo AI loại trừ:', err);
      alert(`Không thể lưu quy tắc AI loại trừ: ${err.message || err}`);
    }
  };

  // Real-time Data Integrity & Timestamp Anomaly Detection Hook
  const {
    integrityReport,
    excludeAnomalies,
    setExcludeAnomalies,
    toggleExcludeAnomalies
  } = useDataIntegrityCheck(data);
  const [excludeDuplicates, setExcludeDuplicates] = useState<boolean>(true);

  const handleSaveTriggerRules = (newRules: AlertTriggerRule[]) => {
    setTriggerRules(newRules);
    saveAlertTriggers(newRules);
  };

  const handleResetTriggerRules = () => {
    const defaultRules = resetAlertTriggers();
    setTriggerRules(defaultRules);
  };

  const handleSaveThresholdConfig = (newConfig: AlertThresholdConfig) => {
    setThresholdConfig(newConfig);
    saveAlertThresholdConfig(newConfig);
  };

  // Live Cloud Synchronization & Hydration for Alert Triggers and Threshold Configs
  useEffect(() => {
    if (isFirestoreQuotaExceeded()) return;

    // 1. Initial Cloud Hydration if available
    fetchAlertThresholdConfigFromCloud()
      .then((cloudThresholds) => {
        if (cloudThresholds) {
          console.log('☁️ [App] Hydrated Alert Threshold Config from Cloud Firestore');
          setThresholdConfig(cloudThresholds);
        }
      })
      .catch((err) => console.warn('Failed to fetch alert thresholds from cloud:', err));

    fetchAlertTriggerRulesFromCloud()
      .then((cloudRules) => {
        if (cloudRules && cloudRules.length > 0) {
          console.log(`☁️ [App] Hydrated ${cloudRules.length} Alert Trigger Rules from Cloud Firestore`);
          setTriggerRules(cloudRules);
        }
      })
      .catch((err) => console.warn('Failed to fetch alert trigger rules from cloud:', err));

    // 2. Real-time Listeners
    const unsubThresholds = subscribeToCloudAlertThresholdConfig((updatedConfig) => {
      console.log('⚡ [App] Received live threshold config update from Firestore');
      setThresholdConfig(updatedConfig);
    });

    const unsubRules = subscribeToCloudAlertTriggerRules((updatedRules) => {
      console.log(`⚡ [App] Received ${updatedRules.length} live trigger rules update from Firestore`);
      setTriggerRules(updatedRules);
    });

    return () => {
      if (unsubThresholds) unsubThresholds();
      if (unsubRules) unsubRules();
    };
  }, []);

  const handleDispatchTriggerAlert = (alert: ActiveAlertNotification) => {
    if (alert.priorityLevel === 'critical' || alert.priorityLevel === 'high') {
      playAlertChime(alert.priorityLevel);
    }
    sendBrowserNotification(alert);

    if (alert.article?.id) {
      setData((prev) => {
        if (!prev || !prev.news) return prev;
        const updatedNews = prev.news.map((item) => {
          if (item.id === alert.article?.id) {
            return {
              ...item,
              isUrgent: true,
              isAlertTriggered: true,
              triggerRuleName: alert.triggerName || 'Quy Tắc Alert Khẩn Cấp',
            };
          }
          return item;
        });
        return { ...prev, news: updatedNews };
      });
    }

    // Directly add to the dedicated alerts section (No screen popup toast)
    setActiveAlerts((prev) => {
      if (prev.some((a) => a.id === alert.id || (a.article && a.article.id === alert.article?.id))) {
        return prev;
      }
      return [alert, ...prev];
    });
  };

  const handleDispatchMultipleTriggerAlerts = (alerts: ActiveAlertNotification[]) => {
    if (!alerts || alerts.length === 0) return;
    const highestPriority = alerts.some((a) => a.priorityLevel === 'critical')
      ? 'critical'
      : alerts.some((a) => a.priorityLevel === 'high')
      ? 'high'
      : 'medium';

    if (highestPriority === 'critical' || highestPriority === 'high') {
      playAlertChime(highestPriority);
    }

    // Send notifications for top urgent items
    alerts.slice(0, 3).forEach((a) => sendBrowserNotification(a));

    setActiveAlerts((prev) => {
      const existingIds = new Set(
        prev.map((a) => a.id).concat(prev.map((a) => a.article?.id).filter(Boolean) as string[])
      );
      const newItems = alerts.filter(
        (a) => !existingIds.has(a.id) && (!a.article?.id || !existingIds.has(a.article.id))
      );
      return [...newItems, ...prev];
    });
  };

  const handleClearAlert = (alertId: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const handleClearAllAlerts = () => {
    setActiveAlerts([]);
  };

  // Synchronize and populate activeAlerts from the current dataset so all qualifying alerts appear in one batch
  useEffect(() => {
    if (!data?.news || data.news.length === 0) return;
    const isResetCleared =
      typeof window !== 'undefined' &&
      localStorage.getItem('finpulse_is_database_reset_cleared') === 'true';
    if (isResetCleared) return;

    const matched = evaluateArticlesForTriggers(data.news, triggerRules, thresholdConfig);
    if (matched && matched.length > 0) {
      const matchedMap = new Map<string, string>();
      matched.forEach((m) => {
        if (m.article?.id) {
          matchedMap.set(m.article.id, m.triggerName || 'Cảnh Báo Kích Hoạt');
        }
      });

      // Update dataset so triggered articles automatically feed into SOP Level 4 "Vấn đề cần chỉ đạo & xử lý khẩn" tab
      setData((prev) => {
        if (!prev || !prev.news) return prev;
        let modified = false;
        const updatedNews = prev.news.map((item) => {
          if (matchedMap.has(item.id) && (!item.isAlertTriggered || !item.isUrgent)) {
            modified = true;
            return {
              ...item,
              isUrgent: true,
              isAlertTriggered: true,
              triggerRuleName: matchedMap.get(item.id) || 'Cảnh Báo Kích Hoạt',
            };
          }
          return item;
        });
        return modified ? { ...prev, news: updatedNews } : prev;
      });

      setActiveAlerts((prev) => {
        const existingIds = new Set(
          prev.map((a) => a.id).concat(prev.map((a) => a.article?.id).filter(Boolean) as string[])
        );
        const newItems = matched.filter(
          (a) => !existingIds.has(a.id) && (!a.article?.id || !existingIds.has(a.article.id))
        );
        if (newItems.length === 0) return prev;
        newItems.forEach((a) => {
          if (a.article?.id) alertedArticleIdsRef.current.add(a.article.id);
        });
        return [...newItems, ...prev];
      });
    }
  }, [data?.news, triggerRules, thresholdConfig]);

  // Modals & view modes
  const [activeDeepDiveItem, setActiveDeepDiveItem] = useState<ScrapedNewsItem | null>(null);
  const [activeDraftStatementItem, setActiveDraftStatementItem] = useState<ScrapedNewsItem | null>(null);
  const [activePolicySubmissionItem, setActivePolicySubmissionItem] = useState<ScrapedNewsItem | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Video Summary Modal State (Google Veo 3)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [videoContextArticle, setVideoContextArticle] = useState<ScrapedNewsItem | null>(null);

  // Gmail Crisis Alert Modal State
  const [showGmailAlertModal, setShowGmailAlertModal] = useState<boolean>(false);
  const [selectedArticleForGmail, setSelectedArticleForGmail] = useState<ScrapedNewsItem | null>(null);

  // Hybrid BYOK API Key Settings Modal State
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);

  // Taxonomy & Sentiment Labeling Guide Modal State
  const [showTaxonomyModal, setShowTaxonomyModal] = useState<boolean>(false);

  // Sentiment Score Decomposition & Component Analysis Modal State
  const [activeSentimentScoreBreakdownItem, setActiveSentimentScoreBreakdownItem] = useState<ScrapedNewsItem | null>(null);

  // Official Ministry of Finance & State Portals Dedicated API Filter Mode (100% Real API)
  const [isOfficialOnly, setIsOfficialOnly] = useState<boolean>(false);
  const [showOfficialPortalsModal, setShowOfficialPortalsModal] = useState<boolean>(false);

  // Violation Evidence Dossier Modal State (SHA-256 integrity & official document export)
  const [showViolationDossierModal, setShowViolationDossierModal] = useState<boolean>(false);
  const [violationDossierArticle, setViolationDossierArticle] = useState<ScrapedNewsItem | null>(null);

  // Real Reader Comments & Citizen Sentiment Modal State
  const [showReaderCommentsModal, setShowReaderCommentsModal] = useState<boolean>(false);
  const [readerCommentsArticle, setReaderCommentsArticle] = useState<ScrapedNewsItem | null>(null);

  // Warning Pipeline 7-Stage & 3-Level Model Modal State
  const [activeWarningPipelineItem, setActiveWarningPipelineItem] = useState<ScrapedNewsItem | null>(null);

  // Time Window Compliance & Audit Modal State
  const [showTimeWindowAuditModal, setShowTimeWindowAuditModal] = useState<boolean>(false);

  const handleOpenViolationDossier = (article?: ScrapedNewsItem | null) => {
    setViolationDossierArticle(article || null);
    setShowViolationDossierModal(true);
  };

  const handleOpenReaderComments = (article?: ScrapedNewsItem | null) => {
    setReaderCommentsArticle(article || null);
    setShowReaderCommentsModal(true);
  };

  // Automated hook to sync SOP tracking status across Firestore and UI
  useEffect(() => {
    let isMounted = true;
    fetchSopTrackingRecordsFromCloud().then((records) => {
      if (!isMounted || !records || Object.keys(records).length === 0) return;
      setData((prev) => {
        if (!prev || !prev.news) return prev;
        let modified = false;
        const updatedNews = prev.news.map((item) => {
          const rec = records[item.id];
          if (rec && (item.handlingStatus !== rec.handlingStatus || item.handlingActionLabel !== rec.handlingActionLabel)) {
            modified = true;
            return {
              ...item,
              handlingStatus: rec.handlingStatus,
              handlingActionLabel: rec.handlingActionLabel,
              handledAt: rec.handledAt || item.handledAt,
            };
          }
          return item;
        });
        return modified ? { ...prev, news: updatedNews } : prev;
      });
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateArticleStatus = useCallback(
    (
      articleId: string,
      status: 'NEW' | 'IN_PROGRESS' | 'DONE',
      actionLabel: string
    ) => {
      if (!articleId) return;

      // 1. Update React state immediately for real-time UI refresh in MainFourStageFlow & SOP Pipeline
      setData((prev) => {
        if (!prev || !prev.news) return prev;
        const updatedNews = prev.news.map((item) => {
          if (item.id === articleId) {
            return {
              ...item,
              handlingStatus: status,
              handlingActionLabel: actionLabel,
              handledAt: new Date().toISOString(),
            };
          }
          return item;
        });
        return {
          ...prev,
          news: updatedNews,
        };
      });

      // 2. Automated hook persist to Firestore-backed SOP tracking object
      saveSopTrackingRecordToCloud(articleId, status, actionLabel, {
        actionSource: 'LEADERSHIP_ACTION',
        updatedAtStr: new Date().toISOString(),
      });

      // 3. Dispatch global custom event for listener re-renders
      window.dispatchEvent(
        new CustomEvent('sop-status-updated', {
          detail: { articleId, status, actionLabel },
        })
      );
    },
    [setData]
  );

  const handleOpenDraftStatement = (article?: ScrapedNewsItem | null) => {
    if (!article) return;
    handleUpdateArticleStatus(article.id, 'IN_PROGRESS', 'Đã phát ngôn');
    setActiveDraftStatementItem(article);
  };

  const handleOpenPolicySubmission = (article?: ScrapedNewsItem | null) => {
    if (!article) return;
    handleUpdateArticleStatus(article.id, 'IN_PROGRESS', 'Điều chỉnh chính sách');
    setActivePolicySubmissionItem(article);
  };

  const handleOpenGmailAlertModal = (article?: ScrapedNewsItem | null) => {
    setSelectedArticleForGmail(article || null);
    setShowGmailAlertModal(true);
  };

  const handleOpenVideoModal = (article?: ScrapedNewsItem) => {
    setVideoContextArticle(article || null);
    setIsVideoModalOpen(true);
  };

  // Handler for jumping and auto-scrolling to an article's NewsCard when tapping an alert
  const handleScrollToAlertArticle = (articleId: string) => {
    if (!articleId) return;

    // Switch to dashboard view if not currently active
    if (cmsTab !== 'dashboard') {
      setCmsTab('dashboard');
    }

    // Dispatch custom event for MobileSwipeableDashboard to swipe directly to the card container
    window.dispatchEvent(
      new CustomEvent('mof-scroll-to-article', {
        detail: { articleId },
      })
    );

    // Smoothly scroll to the target NewsCard with progressive retries for layout stabilization
    setTimeout(() => {
      scrollToNewsCard(articleId);
    }, 120);

    setTimeout(() => {
      scrollToNewsCard(articleId);
    }, 380);
  };

  // Calculate Cảnh Báo Xa (Cấp 1: 20–39đ chuẩn ngặt Cảnh báo xa)
  const distantHorizonCount = useMemo(() => {
    const news = data?.news || [];
    return news.filter(isDistantWarningArticle).length;
  }, [data?.news]);

  // Density Mode (⚡ Executive / Standard / Deep-Dive)
  const [densityMode, setDensityMode] = useState<ViewDensityMode>(() => {
    try {
      const saved = localStorage.getItem('mof_view_density_mode');
      return (saved as ViewDensityMode) || 'standard';
    } catch {
      return 'standard';
    }
  });

  // Analytics Hub Sub-tab State ('projection' | 'trends' | 'sentiment' | 'charts' | 'explainer')
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'projection' | 'trends' | 'sentiment' | 'charts' | 'explainer'>('projection');

  const handleDensityModeChange = (mode: ViewDensityMode) => {
    setDensityMode(mode);
    try {
      localStorage.setItem('mof_view_density_mode', mode);
    } catch (e) {
      console.error(e);
    }
  };

  // Count modified custom weights
  const customWeightsModifiedCount = useMemo(() => {
    return (Object.entries(keywordWeights) as [string, KeywordWeightDef][]).filter(([kw, def]) => {
      const defaultItem = DEFAULT_KEYWORD_CONFIG[kw];
      if (!defaultItem) return true; // Custom added
      return defaultItem.weight !== def.weight || defaultItem.enabled !== def.enabled;
    }).length;
  }, [keywordWeights]);

  const handleSaveKeywordWeights = (newWeights: KeywordWeightMap) => {
    setKeywordWeights(newWeights);
    saveCustomKeywordWeights(newWeights);
  };

  const handleResetKeywordWeights = () => {
    const defaultWeights = resetCustomKeywordWeights();
    setKeywordWeights(defaultWeights);
  };

  // Direct DB CRUD update handlers for CMS & Dashboard synchronization
  const handleArticleCreated = (newArticle: ScrapedNewsItem) => {
    setData((prev) => {
      if (!prev) return prev;
      const updatedNews = [newArticle, ...(prev.news || [])];
      return {
        ...prev,
        news: updatedNews,
        totalFound: (prev.totalFound || 0) + 1,
      };
    });
  };

  const handleArticleUpdated = (updatedArticle: ScrapedNewsItem) => {
    setData((prev) => {
      if (!prev) return prev;
      const updatedNews = (prev.news || []).map((item) =>
        item.id === updatedArticle.id ? updatedArticle : item
      );
      return {
        ...prev,
        news: updatedNews,
      };
    });
  };

  const handleArticleDeleted = (deletedId: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const updatedNews = (prev.news || []).filter((item) => item.id !== deletedId);
      return {
        ...prev,
        news: updatedNews,
        totalFound: Math.max(0, (prev.totalFound || 0) - 1),
      };
    });
  };

  const handleBulkArticlesDeleted = (deletedIds: string[]) => {
    const idsSet = new Set(deletedIds);
    setData((prev) => {
      if (!prev) return prev;
      const updatedNews = (prev.news || []).filter((item) => !idsSet.has(item.id));
      return {
        ...prev,
        news: updatedNews,
        totalFound: Math.max(0, (prev.totalFound || 0) - deletedIds.length),
      };
    });
  };

  const handleBulkArticlesStandardized = (standardized: ScrapedNewsItem[]) => {
    if (!standardized || standardized.length === 0) return;
    setData((prev) => {
      if (!prev) return prev;
      const stdMap = new Map<string, ScrapedNewsItem>();
      standardized.forEach(a => {
        if (a.id) stdMap.set(a.id, a);
        if (a.url) stdMap.set(a.url, a);
      });

      const updatedNews = (prev.news || []).map((existing) => {
        const match = (existing.id && stdMap.get(existing.id)) || (existing.url && stdMap.get(existing.url));
        return match ? { ...existing, ...match } : existing;
      });

      const updatedResponse = {
        ...prev,
        news: updatedNews,
      };

      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('mof_scrape_data_cache', JSON.stringify({
            data: updatedResponse,
            timestamp: Date.now(),
            timeRange: (prev as any)?.timeRange || timeRange
          }));
        } catch {}
      }

      return updatedResponse;
    });
  };

  const handleStartDatabaseReset = () => {
    console.log('🧹 [App] Synchronizing Database Reset Start state');
    setIsResetInProgress(true);
    setIsLoading(false);
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (_) {}
    }
  };

  const handleCompleteDatabaseReset = (actionType: string = 'news') => {
    console.log('🧹 [App] Complete Database Reset Triggered:', actionType);
    setIsResetInProgress(true);
    setIsLoading(false);
    
    // Abort any active network requests immediately
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (_) {}
    }

    try {
      // Clear background singleton memory databases & in-memory sets
      globalNewsDatabase.clear();
      alertedArticleIdsRef.current.clear();
      setAdvisorContextArticle(null);
      setActiveAlerts([]);
      setActiveExecutiveUrgentModal(null);
      setActiveDeepDiveItem(null);
      setActiveDraftStatementItem(null);
      setActivePolicySubmissionItem(null);
      setVideoContextArticle(null);
      setSelectedArticleForGmail(null);
      setActiveSentimentScoreBreakdownItem(null);
      setViolationDossierArticle(null);
      setReaderCommentsArticle(null);
      setLastScannedTime('Đã đặt lại (0 tin)');
      setIsInitialBoot(false);

      // Functional State Update with Deep Isolation & Zero-State Verification
      setData((prevState) => {
        const verification = verifyAndSanitizeEmptyDataState(
          prevState ? { ...prevState, news: [], totalFound: 0 } : null,
          timeRange,
          sector
        );

        console.log('🛡️ [State Integrity Verification] Empty Data State Audit:', {
          isPristine: verification.isPristine,
          articleCount: verification.articleCount,
          hasLingeringReferences: verification.hasLingeringReferences,
          violations: verification.violations
        });

        return verification.sanitizedState;
      });

      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.removeItem('mof_scrape_data_cache');
          window.sessionStorage.clear();

          const keysToRemove = [
            'finpulse_advisor_sessions',
            'finpulse_advisor_active_session_id',
            'finpulse_advisor_session_history',
            'finpulse_advisor_chat_history',
            'finpulse_user_session_id',
            'finpulse_executive_profiles',
            'finpulse_active_executive_profile',
            'finpulse_pinned_directives',
            'finpulse_user_custom_rag_knowledge',
            'finpulse_user_knowledge_docs',
            'finpulse_rag_last_processed_time',
            'finpulse_rlhf_feedback_records',
            'finpulse_scraped_news_archive',
            'finpulse_scrape_sessions_history',
            'finpulse_recent_searches',
            'finpulse_violation_dossiers',
            'mof_scrape_data_cache'
          ];
          keysToRemove.forEach((k) => {
            try {
              window.localStorage.removeItem(k);
            } catch (_) {}
          });

          // Set persistent 0-state flag with timestamp
          window.localStorage.setItem('finpulse_is_database_reset_cleared', 'true');
          console.log('✅ [App Reset] Successfully set localStorage flag finpulse_is_database_reset_cleared = true');
        } catch (e) {
          console.error('Failed to write reset flag to localStorage:', e);
        }
      }
    } finally {
      // Ensure reset progress is marked complete after state flush to prevent race conditions
      setTimeout(() => {
        setIsResetInProgress(false);
      }, 800);
    }
  };

  // Safe time helper
  const getFormattedCurrentTime = () => {
    try {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      return `${h}:${m}:${s}`;
    } catch {
      return 'Vừa xong';
    }
  };

  // Safe Vietnam Time (UTC+7) scanned window calculator
  const getDynamicScannedWindow = (tr: TimeRange = timeRange) => {
    try {
      if (data?.scannedWindow) return data.scannedWindow;

      const now = new Date();
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const vnNow = new Date(utcMs + 7 * 3600 * 1000);

      const windowMinutes =
        tr === '24h'
          ? 1440
          : tr === '8h'
          ? 480
          : tr === '4h'
          ? 240
          : tr === '2h'
          ? 120
          : 60;

      const vnStart = new Date(vnNow.getTime() - windowMinutes * 60 * 1000);

      const pad = (n: number) => String(n).padStart(2, '0');
      const startDay = pad(vnStart.getUTCDate());
      const startMonth = pad(vnStart.getUTCMonth() + 1);
      const startH = pad(vnStart.getUTCHours());
      const startM = pad(vnStart.getUTCMinutes());

      const nowDay = pad(vnNow.getUTCDate());
      const nowMonth = pad(vnNow.getUTCMonth() + 1);
      const nowH = pad(vnNow.getUTCHours());
      const nowM = pad(vnNow.getUTCMinutes());

      const label =
        tr === '1h'
          ? 'Phiên 1 giờ'
          : tr === '2h'
          ? 'Phiên 2 giờ'
          : tr === '4h'
          ? 'Phiên 4 giờ'
          : tr === '8h'
          ? 'Phiên 8 giờ'
          : 'Phiên 24 giờ';

      return `${label} (${startDay}/${startMonth} ${startH}:${startM} ➔ ${nowDay}/${nowMonth} ${nowH}:${nowM} - Giờ VN)`;
    } catch {
      return 'Phiên 1 giờ (Giờ VN)';
    }
  };

  // Perform Scrape with AbortController & dynamic UTC+7 time window parameters generated via new Date().toISOString()
  const performScrape = useCallback(
    async (
      targetTimeRange = timeRange,
      targetSector: SectorType = 'all',
      targetQuery: string = '',
      force = true,
      customBounds?: { startTimeMs?: number; endTimeMs?: number },
      targetOfficialOnly = isOfficialOnly,
      scrapeOptions?: { fetchAll?: boolean }
    ) => {
      if (isResetInProgress) {
        console.warn('⛔ [performScrape] Scrape operation blocked because database reset is in progress.');
        return;
      }

      // STATE-BASED GUARD: Prevent redundant concurrent or rapid repeating scan cycles
      const nowMs = Date.now();
      if (isScanPendingRef.current) {
        if (!force) {
          console.warn('🛡️ [performScrape] A scan cycle is already in-flight (pending-scrape = true). Ignoring redundant background scan request.');
          return;
        }
        // If force refresh is requested while a scan started less than 1200ms ago, debounce to prevent storm
        if (nowMs - lastScannedTimestampRef.current < 1200) {
          console.warn('🛡️ [performScrape] Rapid repeat scan debounced (triggered within 1.2s).');
          return;
        }
      }

      // Throttling non-forced background auto-scans if a scan completed recently (< 10 seconds)
      if (!force && lastScannedTimestampRef.current > 0 && (nowMs - lastScannedTimestampRef.current < 10000)) {
        console.info(`🛡️ [performScrape] Throttled: Data was scanned ${Math.round((nowMs - lastScannedTimestampRef.current) / 1000)}s ago. Skipping redundant background scan.`);
        return;
      }

      // Explicitly check 'finpulse_is_database_reset_cleared' flag BEFORE initiating any network request
      if (typeof window !== 'undefined') {
        try {
          const isResetCleared = localStorage.getItem('finpulse_is_database_reset_cleared') === 'true';
          if (isResetCleared) {
            if (!force) {
              console.warn('🛡️ [performScrape] Scrape operation blocked before network call because database is in 0-state (finpulse_is_database_reset_cleared = true).');
              return;
            }
            // If the user actively triggered a fresh scan, clear the reset lock flag
            console.log('🚀 [performScrape] User actively triggered fresh news scan. Clearing finpulse_is_database_reset_cleared flag.');
            localStorage.removeItem('finpulse_is_database_reset_cleared');
          }
        } catch (_) {}
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      isScanPendingRef.current = true;
      lastScannedTimestampRef.current = nowMs;

      setIsLoading(true);
      setError(null);

      // Generate dynamic UTC+7 time window using new Date().toISOString()
      const nowIsoString = new Date().toISOString();
      const endTimeMs = customBounds?.endTimeMs || new Date(nowIsoString).getTime();

      const windowMinutes =
        targetTimeRange === '24h'
          ? 1440
          : targetTimeRange === '8h'
          ? 480
          : targetTimeRange === '4h'
          ? 240
          : targetTimeRange === '2h'
          ? 120
          : 60;

      const startTimeMs = customBounds?.startTimeMs || (endTimeMs - windowMinutes * 60 * 1000);
      const startTimeIso = new Date(startTimeMs).toISOString();
      const endTimeIso = new Date(endTimeMs).toISOString();

      // Helper to format Vietnam Time (UTC+7) ISO string
      const formatVnIso = (ms: number) => {
        const vnDate = new Date(ms + 7 * 3600 * 1000);
        const pad = (n: number) => String(n).padStart(2, '0');
        const yyyy = vnDate.getUTCFullYear();
        const mm = pad(vnDate.getUTCMonth() + 1);
        const dd = pad(vnDate.getUTCDate());
        const hh = pad(vnDate.getUTCHours());
        const min = pad(vnDate.getUTCMinutes());
        const ss = pad(vnDate.getUTCSeconds());
        return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+07:00`;
      };

      const startTimeVnIso = formatVnIso(startTimeMs);
      const endTimeVnIso = formatVnIso(endTimeMs);

      const useFetchAll = scrapeOptions?.fetchAll !== false; // Default to single fetchAll request for 24h
      console.group(`🔎 [performScrape] Initiating News Scrape (${targetOfficialOnly ? '🏛️ Official MoF Portals Dedicated API' : useFetchAll ? '🌐 Single Consolidated 24h Batch' : '🌐 Multi-tier Financial Media Batching'})`);
      console.log(`⚙️ TimeRange: "${targetTimeRange}" (${windowMinutes} mins) | Force: ${force} | OfficialOnly: ${targetOfficialOnly} | FetchAll: ${useFetchAll}`);
      console.log(`🕒 Calculated startTimeIso (UTC):   "${startTimeIso}"`);
      console.log(`🇻🇳 Calculated startTime (UTC+7):    "${startTimeVnIso}"`);
      console.log(`🕒 Calculated endTimeIso   (UTC):   "${endTimeIso}"`);
      console.log(`🇻🇳 Calculated endTime   (UTC+7):    "${endTimeVnIso}"`);
      console.groupEnd();

      const scrapeStartTime = performance.now();

      try {
        const batchOptions = {
          fetchAll: useFetchAll,
          enableBatching: !useFetchAll,
          concurrencyLimit: 4,
          maxTimeoutMs: 3300,
        };

        const res = targetOfficialOnly
          ? await fetchOfficialMofNews(
              targetTimeRange,
              targetSector,
              targetQuery,
              force,
              controller.signal,
              0,
              { startTimeMs, endTimeMs, startTimeIso, endTimeIso }
            )
          : await fetchFinancialNews(
              targetTimeRange,
              targetSector,
              targetQuery,
              force,
              controller.signal,
              0,
              { startTimeMs, endTimeMs, startTimeIso, endTimeIso },
              batchOptions
            );

        const scrapeElapsedMs = performance.now() - scrapeStartTime;

        // Post-network check: Verify reset state before committing incoming results to state
        const isResetClearedPostFetch = typeof window !== 'undefined' && localStorage.getItem('finpulse_is_database_reset_cleared') === 'true';
        if (isResetInProgress || isResetClearedPostFetch) {
          console.warn('🛡️ [performScrape] Discarding incoming asynchronous scrape results because database reset is in progress or state was reset.');
          setIsLoading(false);
          return;
        }

        // --- SCRAPE INTEGRITY VALIDATION STEP ---
        const rawArticles = res?.news && Array.isArray(res.news) ? res.news : [];
        const validArticles: ScrapedNewsItem[] = [];
        const droppedMap = new Map<string, ScrapedNewsItem>();

        // Ingest any dropped articles returned by backend/API layer
        if (res?.droppedArticles && Array.isArray(res.droppedArticles)) {
          res.droppedArticles.forEach(d => {
            const key = d.id || d.url || d.title;
            droppedMap.set(key, d);
          });
        }

        // Strict 3-minute clock skew tolerance buffer for start/end time bounds
        const toleranceMs = 3 * 60 * 1000;
        const minAllowedMs = startTimeMs - toleranceMs;
        const maxAllowedMs = endTimeMs + toleranceMs;
        const nowMs = Date.now();

        rawArticles.forEach((art) => {
          let isStaleOrInvalid = false;
          let dropReason = '';
          const rawPub = (art.publishedAt || art.publishedTimeStr || '').trim();

          const pubMs = parseStrictArticleTimestamp(art, nowMs);

          if (!pubMs) {
            isStaleOrInvalid = true;
            dropReason = `Dropped: Stale Data (Missing or unparseable publishedAt field: "${rawPub}")`;
          } else if (pubMs < minAllowedMs) {
            isStaleOrInvalid = true;
            const staleMins = Math.round((startTimeMs - pubMs) / 60000);
            dropReason = `Dropped: Stale Data (Article timestamp is ${staleMins} mins older than current ${targetTimeRange} window start)`;
          } else if (pubMs > maxAllowedMs) {
            isStaleOrInvalid = true;
            const futureMins = Math.round((pubMs - endTimeMs) / 60000);
            dropReason = `Dropped: Stale Data (Article timestamp is ${futureMins} mins in future beyond current window end)`;
          }

          if (isStaleOrInvalid) {
            const key = art.id || art.url || art.title;
            droppedMap.set(key, {
              ...art,
              publishedTimestamp: pubMs || undefined,
              scrapeIntegrityStatus: 'Dropped: Stale Data',
              dropReason: dropReason || 'Dropped: Stale Data',
            });
          } else {
            validArticles.push({
              ...art,
              publishedTimestamp: pubMs,
              scrapeIntegrityStatus: 'Passed',
            });
          }
        });

        const droppedArticles = Array.from(droppedMap.values());

        console.group(`🛡️ [Scrape Integrity Validation] Evaluated: ${rawArticles.length} | Passed: ${validArticles.length} | Dropped: ${droppedArticles.length}`);
        console.log(`⏱️ Total Scrape Time: ${scrapeElapsedMs.toFixed(0)}ms | SLA Target (< 3500ms): ${scrapeElapsedMs < 3500 ? '✅ SLA PASSED' : '⚠️ SLA EXCEEDED'}`);
        console.log(`🕒 Window Bounds (UTC+7): [${startTimeVnIso} ➔ ${endTimeVnIso}]`);
        console.log(`🛡️ Mandatory 'publishedAt' Check: ${droppedArticles.filter(d => d.dropReason?.includes('Missing')).length} missing, ${droppedArticles.filter(d => d.dropReason?.includes('Unparseable')).length} unparseable`);
        console.log(`⏳ Stale Data Filter Check: ${droppedArticles.length} items labeled 'Dropped: Stale Data'`);

        if (droppedArticles.length > 0) {
          console.groupCollapsed(`⚠️ Dropped Articles List (${droppedArticles.length} items excluded from feed)`);
          droppedArticles.forEach((dItem, idx) => {
            console.warn(` [${idx + 1}/${droppedArticles.length}] "Dropped: Stale Data" | ID: ${dItem.id} | Title: "${dItem.title?.slice(0, 50)}..." | Reason: ${dItem.dropReason}`);
          });
          console.groupEnd();
        }
        console.groupEnd();

        let articlesToUse = validArticles;
        if (validArticles.length === 0 && rawArticles.length > 0) {
          console.log('⚠️ [Client Validation] All articles exceeded strict window. Using rawArticles as fallback to prevent empty screen.');
          articlesToUse = rawArticles.map(a => ({
            ...a,
            scrapeIntegrityStatus: 'Passed',
          }));
        }

        // Run Data Integrity Audit on fresh articles batch to auto-flag non-standard timestamps
        const { auditedNews, report: batchIntegrityReport } = auditAndFlagNewsTimestamps(articlesToUse);

        // Construct verified ScrapeResponse ensuring dropped stale articles are prevented from displaying in feed
        const integrityVerifiedRes: ScrapeResponse = {
          ...res,
          news: auditedNews,
          totalFound: auditedNews.length,
          droppedCount: droppedArticles.length,
          droppedArticles: droppedArticles,
        };

        setData(integrityVerifiedRes);
        setLastScannedTime(res.vnEndTimeStr || res.timeBounds?.vnEndTimeStr || getFormattedCurrentTime());

        // Cache latest scrape batch in sessionStorage so leaving the tab or tab reloads do not wipe UI
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(
              'mof_scrape_data_cache',
              JSON.stringify({
                data: integrityVerifiedRes,
                timestamp: Date.now(),
                timeRange: targetTimeRange,
              })
            );
          } catch (e) {
            // Ignore storage quota
          }
        }

        if (autoRefreshInterval > 0) {
          setCountdown(autoRefreshInterval);
        }

        // Evaluate ONLY validated fresh articles for real-time trigger matches & alerts
        if (validArticles.length > 0) {
          // Auto-Archive Scraped Batch to Cloud Firestore Database asynchronously only if cloud is active and quota allows
          if (isCloudDatabaseActive() && !isFirestoreQuotaExceeded()) {
            archiveScrapedNewsBatchToCloud(validArticles, targetTimeRange).catch((err) => {
              console.warn('Background news archiving error:', err);
            });
          }

          const matchedAlerts = evaluateArticlesForTriggers(validArticles, triggerRules, thresholdConfig);
          const newAlerts = matchedAlerts.filter((a) => !alertedArticleIdsRef.current.has(a.article.id));
          if (newAlerts.length > 0) {
            newAlerts.forEach((a) => alertedArticleIdsRef.current.add(a.article.id));
            handleDispatchMultipleTriggerAlerts(newAlerts);
          }

          // Automatic Gmail Alert Dispatcher for crisis/high-risk items (non-blocking safe guard)
          checkAndAutoDispatchGmailAlerts(validArticles, res.urgentAlerts || []).catch((e) => {
            console.warn('Background auto-dispatch alert notice:', e?.message || e);
          });
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Scrape error:', err);
        const errMsg = String(err?.message || '');
        if (errMsg.includes('Load failed') || errMsg.includes('Failed to fetch') || errMsg.includes('pattern')) {
          // Soft notification, preserve data or fallback
          setError('Kết nối mạng gián đoạn. Đang hiển thị dữ liệu tin tức đã lưu.');
        } else {
          setError(errMsg || 'Lỗi khi cào tin tức tài chính. Vui lòng thử lại.');
        }
      } finally {
        isScanPendingRef.current = false;
        lastScannedTimestampRef.current = Date.now();
        if (abortControllerRef.current === controller) {
          setIsLoading(false);
          setIsInitialBoot(false);
        }
      }
    },
    [timeRange, autoRefreshInterval]
  );

  // Complete cancellation from scratch on both client and server
  const handleCancelScrape = useCallback(() => {
    isScanPendingRef.current = false;
    lastScannedTimestampRef.current = Date.now();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsInitialBoot(false);
    fetch('/api/scrape/cancel', { method: 'POST' }).catch(() => {});
  }, []);

  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange);
    // Abort running in-flight scan immediately to start fresh for the new time window session
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      fetch('/api/scrape/cancel', { method: 'POST' }).catch(() => {});
    }
    performScrape(newRange, 'all', '', true);
  };

  const handleSectorChange = (newSector: SectorType) => {
    setSector(newSector);
  };

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
  };

  const handleAutoRefreshIntervalChange = (newInterval: number) => {
    setAutoRefreshInterval(newInterval);
    if (newInterval > 0) {
      setCountdown(newInterval);
    } else {
      setCountdown(0);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          const isResetCleared = typeof window !== 'undefined' && localStorage.getItem('finpulse_is_database_reset_cleared') === 'true';
          if (!isResetCleared) {
            console.log('⏰ [AutoRefresh Timer] Auto-refresh triggered. Initiating periodic scrape cycle.');
            setTimeout(() => {
              performScrape(timeRange, 'all', '', true);
            }, 0);
          } else {
            console.log('🛡️ [AutoRefresh Timer] Suppressed scheduled scrape because database is in 0-state (finpulse_is_database_reset_cleared = true).');
          }
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshInterval, performScrape, timeRange]);

  // Initial load on application mount
  useEffect(() => {
    // Auto-collapse sidebar on smaller screens (less than 1024px)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarCollapsed(true);
    }

    const isResetCleared = typeof window !== 'undefined' && localStorage.getItem('finpulse_is_database_reset_cleared') === 'true';
    console.log('🔄 [Initial Mount Effect] Checked finpulse_is_database_reset_cleared flag:', isResetCleared);

    if (isResetCleared) {
      // Respect user's 0-state reset: do not auto-crawl or load stale cached news
      console.log('🛡️ [Initial Mount Effect] Database was reset to 0. Enforcing pristine empty state and suppressing auto-scrape.');
      setData(createPristineEmptyScrapeResponse('24h', 'all'));
      setIsInitialBoot(false);
      setLastScannedTime('Đã đặt lại (0 tin)');
    } else {
      // User requested: Clear old cache and auto-scan fresh immediately upon reload (F5)
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('mof_scrape_data_cache');
        } catch (_) {}
      }

      console.log('🚀 [Initial Mount Effect] Fresh reload: Triggering fresh 24h scan for latest news and batch alerts...');
      performScrape('24h', 'all', '', true);
    }
    
    // Fetch publication & version metadata
    fetchAppMetadata()
      .then((meta) => setAppMetadata(meta))
      .catch((err) => console.error('Failed to load app metadata:', err));

    // Safety timeout: ensure initial boot overlay releases within 3.5 seconds
    const bootTimer = setTimeout(() => {
      setIsInitialBoot(false);
    }, 3500);

    return () => clearTimeout(bootTimer);
  }, []);

  // Listen for Background Sync & Service Worker completion events
  useEffect(() => {
    const unsubscribe = backgroundSyncManager.onScrapeCompleted((bgData, count) => {
      const isResetCleared = typeof window !== 'undefined' && localStorage.getItem('finpulse_is_database_reset_cleared') === 'true';
      if (isResetCleared) {
        console.log(`🛡️ [Background Sync] Suppressed incoming background sync data (${count} articles) because database reset flag is active.`);
        return;
      }

      if (bgData && bgData.news) {
        console.log(`⚡ [App] Background scrape arrived from Service Worker: ${count} articles`);
        setData(bgData);
        setIsInitialBoot(false);
        setLastScannedTime(bgData.vnEndTimeStr || bgData.timeBounds?.vnEndTimeStr || getFormattedCurrentTime());
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(
              'mof_scrape_data_cache',
              JSON.stringify({
                data: bgData,
                timestamp: Date.now(),
                timeRange: '24h',
              })
            );
          } catch (e) {
            // ignore storage errors
          }
        }
      }
    });
    return unsubscribe;
  }, []);

  // Global Keyboard Shortcuts (Power User Navigation & Commands)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const isMod = isMac ? e.metaKey : e.ctrlKey;
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
          target.isContentEditable ||
          target.closest('[contenteditable="true"]'));

      // 1. Ctrl+K / Cmd+K: Open Command Palette / Quick Search
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // 2. Ctrl+Shift+A / Cmd+Shift+A: Toggle AI Advisor Chatbot
      if (isMod && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAdvisorChatOpen((prev) => !prev);
        return;
      }

      // 3. Ctrl+E / Cmd+E: Open Export Modal
      if (isMod && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setShowExportModal(true);
        return;
      }

      // 4. Ctrl+Shift+W / Alt+W: Open Keyword Weights Modal
      if ((isMod && e.shiftKey && e.key.toLowerCase() === 'w') || (e.altKey && e.key.toLowerCase() === 'w')) {
        e.preventDefault();
        setShowKeywordWeightModal(true);
        return;
      }

      // 5. Ctrl+Shift+L / Alt+L: Open Alert Triggers Modal
      if ((isMod && e.shiftKey && e.key.toLowerCase() === 'l') || (e.altKey && e.key.toLowerCase() === 'l')) {
        e.preventDefault();
        setShowTriggerModal(true);
        return;
      }

      // 6. Ctrl+1 to Ctrl+4: Switch CMS Tabs
      if (isMod && !e.shiftKey && !e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setCmsTab('dashboard');
          return;
        }
        if (e.key === '2') {
          e.preventDefault();
          setCmsTab('table');
          return;
        }
        if (e.key === '3') {
          e.preventDefault();
          setCmsTab('briefing');
          return;
        }
        if (e.key === '4') {
          e.preventDefault();
          setCmsTab('analytics');
          return;
        }
      }

      // 7. Alt+R: Manual Refresh & Scan
      if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        performScrape(timeRange, 'all', '', true);
        return;
      }

      // 8. Alt+T: Toggle Theme
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        toggleTheme();
        return;
      }

      // 9. Single-key shortcuts when NOT typing in an input
      if (!isTyping) {
        // '?' or 'Shift+/' opens Keyboard Shortcuts Cheat Sheet
        if (e.key === '?' || (e.shiftKey && e.key === '/')) {
          e.preventDefault();
          setIsShortcutsModalOpen(true);
          return;
        }

        // '/' opens Command Palette
        if (e.key === '/') {
          e.preventDefault();
          setIsCommandPaletteOpen(true);
          return;
        }
      }

      // 10. Escape key closes top-most modal/palette
      if (e.key === 'Escape') {
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
          return;
        }
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
          return;
        }
        if (isAdvisorChatOpen) {
          setIsAdvisorChatOpen(false);
          return;
        }
        if (showExportModal) {
          setShowExportModal(false);
          return;
        }
        if (showKeywordWeightModal) {
          setShowKeywordWeightModal(false);
          return;
        }
        if (showTriggerModal) {
          setShowTriggerModal(false);
          return;
        }
        if (activeDeepDiveItem) {
          setActiveDeepDiveItem(null);
          return;
        }
        if (activeDraftStatementItem) {
          setActiveDraftStatementItem(null);
          return;
        }
        if (activePolicySubmissionItem) {
          setActivePolicySubmissionItem(null);
          return;
        }
        if (activeExecutiveUrgentModal) {
          setActiveExecutiveUrgentModal(null);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isShortcutsModalOpen,
    isCommandPaletteOpen,
    isAdvisorChatOpen,
    showExportModal,
    showKeywordWeightModal,
    showTriggerModal,
    activeDeepDiveItem,
    activeDraftStatementItem,
    activePolicySubmissionItem,
    activeExecutiveUrgentModal,
    timeRange,
    performScrape,
    toggleTheme,
  ]);

  // Compute stats for CMS KPI bar
  const crisisCount = useMemo(() => {
    if (!data?.news) return 0;
    return data.news.filter(isRiskArticle).length;
  }, [data?.news]);

  const highConfidenceCrisisCount = useMemo(() => {
    if (!data?.news) return 0;
    return data.news.filter((item) => isRiskArticle(item, { requireHighConfidence: true })).length;
  }, [data?.news]);

  const positiveCount = useMemo(() => {
    if (!data?.news) return 0;
    return data.news.filter((item) => isBrightSpotArticle(item)).length;
  }, [data?.news]);

  const highConfidenceBrightSpotCount = useMemo(() => {
    if (!data?.news) return 0;
    return data.news.filter((item) => isBrightSpotArticle(item, { requireHighConfidence: true })).length;
  }, [data?.news]);

  const neutralCount = useMemo(() => {
    if (!data?.news) return 0;
    return data.news.filter((item) => item.sentiment === 'neutral').length;
  }, [data?.news]);

  const totalArticleCount = useMemo(() => {
    return data?.news?.length || 0;
  }, [data?.news]);

  const bullishPercentage = useMemo(() => {
    if (data?.sentimentOverview?.bullishPercentage !== undefined) {
      return data.sentimentOverview.bullishPercentage;
    }
    if (!totalArticleCount) return 0;
    return Math.round((positiveCount / totalArticleCount) * 100);
  }, [data?.sentimentOverview, totalArticleCount, positiveCount]);

  const neutralPercentage = useMemo(() => {
    if (data?.sentimentOverview?.neutralPercentage !== undefined) {
      return data.sentimentOverview.neutralPercentage;
    }
    if (!totalArticleCount) return 0;
    return Math.round((neutralCount / totalArticleCount) * 100);
  }, [data?.sentimentOverview, totalArticleCount, neutralCount]);

  const bearishPercentage = useMemo(() => {
    if (data?.sentimentOverview?.bearishPercentage !== undefined) {
      return data.sentimentOverview.bearishPercentage;
    }
    if (!totalArticleCount) return 0;
    return Math.round((crisisCount / totalArticleCount) * 100);
  }, [data?.sentimentOverview, totalArticleCount, crisisCount]);

  const highImpactCount = useMemo(() => {
    if (!data?.news) return 0;
    return data.news.filter((item) => {
      const isHighLevel = item.impactLevel === 'high';
      const isEmerg = Boolean(item.isEmergency);
      const isUrg = Boolean(item.isUrgent);
      const isHighImpactScore = (item.impactScore || 0) >= 75;
      const isHighRisk = isRiskArticle(item);
      const isHighBuzz = (item.buzzScore || 0) >= 80;
      return isHighLevel || isEmerg || isUrg || isHighImpactScore || (isHighRisk && isHighBuzz);
    }).length;
  }, [data?.news]);

  const interventionCount = useMemo(() => {
    if (!data?.news) return 0;
    return data.news.filter((item) => {
      return Boolean(item.isEmergency) || isRiskArticle(item) || Boolean(item.executiveDirective);
    }).length;
  }, [data?.news]);

  // Đồng bộ danh sách & số lượng cảnh báo thực tế (chỉ tính các alert có điểm >= 20đ, loại bỏ standard < 20đ)
  const effectiveActiveAlerts = useMemo(() => {
    return activeAlerts.filter((a) => {
      const article = a.article;
      if (!article) return false;
      const score = Number(
        article.warningPipeline?.level2Risk?.riskScore ??
        article.riskScore ??
        article.warningPipeline?.formulaMetrics?.rawRiskScore ??
        0
      );
      return score >= 20 || Boolean(article.isEmergency);
    });
  }, [activeAlerts]);

  const effectiveActiveAlertsCount = effectiveActiveAlerts.length;

  // Floating Pop-up Toast Alerts: ONLY active alerts with critical risk score (>=75đ or isEmergency / SOP L4) trigger floating pop-ups
  const criticalToastPopUpAlerts = useMemo(() => {
    return effectiveActiveAlerts.filter((a) => {
      const article = a.article;
      if (!article) return false;
      const score = Number(
        article.warningPipeline?.level2Risk?.riskScore ??
        article.riskScore ??
        article.warningPipeline?.formulaMetrics?.rawRiskScore ??
        0
      );
      return a.priorityLevel === 'critical' || a.alertLevel === 'EMERGENCY' || Boolean(article.isEmergency) || score >= 75 || isSopLevel4Article(article);
    });
  }, [effectiveActiveAlerts]);

  // Enrich trending keywords with velocity, momentum, category and MoF priority
  const enrichedTrendingKeywords = useMemo(() => {
    if (!data?.news) return [];
    const keywordCountMap: Record<
      string,
      {
        count: number;
        sentimentCount: { bullish: number; bearish: number; neutral: number };
        articles: ScrapedNewsItem[];
        category?: string;
        isCoreMof?: boolean;
      }
    > = {};

    data.news.forEach((item) => {
      const dynamicKw = extractWeightedKeywordsForText(item.title, item.summary, keywordWeights);
      dynamicKw.forEach((kDef) => {
        const kw = kDef.keyword;
        if (!keywordCountMap[kw]) {
          keywordCountMap[kw] = {
            count: 0,
            sentimentCount: { bullish: 0, bearish: 0, neutral: 0 },
            articles: [],
            category: kDef.category,
            isCoreMof: kDef.isCoreMof,
          };
        }
        keywordCountMap[kw].count += 1;
        keywordCountMap[kw].sentimentCount[item.sentiment] += 1;
        if (keywordCountMap[kw].articles.length < 3) {
          keywordCountMap[kw].articles.push(item);
        }
      });
    });

    const rawList = Object.entries(keywordCountMap)
      .map(([keyword, stats]) => {
        let dominantSentiment: SentimentType = 'neutral';
        if (
          stats.sentimentCount.bullish > stats.sentimentCount.bearish &&
          stats.sentimentCount.bullish > stats.sentimentCount.neutral
        ) {
          dominantSentiment = 'bullish';
        } else if (
          stats.sentimentCount.bearish > stats.sentimentCount.bullish &&
          stats.sentimentCount.bearish > stats.sentimentCount.neutral
        ) {
          dominantSentiment = 'bearish';
        }

        const customDef = keywordWeights[keyword.toLowerCase()] || keywordWeights[keyword];
        const weight = customDef ? customDef.weight : 1.0;
        const isCoreMof = customDef?.isCoreMof || stats.isCoreMof || false;
        const category = customDef?.category || stats.category || 'Tài chính - Ngân sách';

        // Calculate dynamic velocity / momentum based on article frequency, MoF weight and risk factors
        const velocityPercent = Math.min(
          140,
          Math.round(stats.count * 20 + weight * 6 + (stats.sentimentCount.bearish > 0 ? 15 : 0))
        );
        let momentumStatus: 'surging' | 'rising' | 'stable' | 'cooling' = 'stable';
        let momentumLabel = `+${velocityPercent}%`;

        if (velocityPercent >= 60 || stats.count >= 3) {
          momentumStatus = 'surging';
          momentumLabel = `+${velocityPercent}% Đột biến`;
        } else if (velocityPercent >= 35 || stats.count >= 2) {
          momentumStatus = 'rising';
          momentumLabel = `+${velocityPercent}% Tăng nhiệt`;
        } else {
          momentumStatus = 'stable';
          momentumLabel = `+${velocityPercent}% Bình ổn`;
        }

        return {
          keyword,
          category,
          mentions: stats.count,
          count: stats.count,
          weight,
          sentiment: dominantSentiment,
          sentimentScore: dominantSentiment === 'bullish' ? 65 : dominantSentiment === 'bearish' ? -65 : 0,
          sentimentBreakdown: stats.sentimentCount,
          isCoreMof,
          isHot: velocityPercent >= 50 || isCoreMof,
          velocityPercent,
          momentumStatus,
          momentumLabel,
          recentArticles: stats.articles,
        };
      })
      .sort((a, b) => {
        const scoreA = a.count * a.weight * (a.isHot ? 1.2 : 1.0);
        const scoreB = b.count * b.weight * (b.isHot ? 1.2 : 1.0);
        return scoreB - scoreA;
      })
      .slice(0, 16);

    return enrichKeywordsWith24hTrendForecast(rawList, data.news);
  }, [data?.news, keywordWeights]);

  // Filtered and sorted news list
  const sortedAndFilteredNews = useMemo(() => {
    if (!data?.news) return [];

    const seenSha256 = new Set<string>();

    let list = data.news.filter((item) => {
      // Data Integrity Filter: Automatically exclude junk articles with non-standard timestamps
      if (excludeAnomalies && item.isTimestampAnomalous) return false;

      // SHA-256 Duplicate Check Filter: Exclude identical duplicate spam articles
      const checksum = item.contentSha256 || computeArticleSha256Checksum(item);
      if (excludeDuplicates) {
        if (seenSha256.has(checksum)) return false;
        seenSha256.add(checksum);
      }

      if (sector !== 'all') {
        const itemSector = item.sector || '';
        const itemSectors = Array.isArray(item.sectors) ? item.sectors : [];
        const isMatch =
          itemSector === sector ||
          itemSectors.includes(sector) ||
          (sector === 'foreign_investment_fdi' && (itemSector === 'fdi' || itemSectors.includes('fdi'))) ||
          (sector === 'fdi' && (itemSector === 'foreign_investment_fdi' || itemSectors.includes('foreign_investment_fdi')));
        if (!isMatch) return false;
      }
      if (selectedSentiment !== 'all' && item.sentiment !== selectedSentiment) return false;
      if (selectedImpact !== 'all' && item.impactLevel !== selectedImpact) return false;
      if (showHighConfidenceOnly && !isRiskArticle(item, { requireHighConfidence: true })) return false;
      if (showHighConfidenceBrightSpotOnly && !isBrightSpotArticle(item, { requireHighConfidence: true })) return false;
      if (showNeutralOnly && item.sentiment !== 'neutral') return false;

      // Quick High Impact filter
      if (showHighImpactOnly) {
        const isHighLevel = item.impactLevel === 'high';
        const isEmerg = Boolean(item.isEmergency);
        const isUrg = Boolean(item.isUrgent);
        const isHighImpactScore = (item.impactScore || 0) >= 75;
        const isHighRisk = isRiskArticle(item);
        const isHighBuzz = (item.buzzScore || 0) >= 80;
        if (!(isHighLevel || isEmerg || isUrg || isHighImpactScore || (isHighRisk && isHighBuzz))) {
          return false;
        }
      }

      // Quick Needs Intervention filter
      if (showInterventionOnly) {
        const needsIntervention = Boolean(item.isEmergency) || isRiskArticle(item) || Boolean(item.executiveDirective);
        if (!needsIntervention) return false;
      }

      // Quick Divergence D >= 15 filter (Mâu thuẫn chỉ đạo & thực tế số liệu)
      if (showDivergenceOnly) {
        const dScore = item.warningPipeline?.formulaMetrics?.D || 0;
        const isDivergenceFlagged = Boolean(item.warningPipeline?.level2Risk?.criteria?.reputationDamage?.hasRisk) && (dScore >= 12 || item.title.toLowerCase().includes('chậm') || item.title.toLowerCase().includes('vướng'));
        if (dScore < 12 && !isDivergenceFlagged) return false;
      }

      // Quick Cảnh Báo Xa Cấp 1 filter (20–39đ)
      if (showEarlyHorizonOnly) {
        if (!isDistantWarningArticle(item)) return false;
      }
      // Quick Cảnh Báo Sớm Cấp 2 filter (40–59đ)
      if (showEarlyWarningOnly) {
        if (!isEarlyWarningArticle(item)) return false;
      }

      if (query.trim()) {
        const tokens = query.trim().split(/\s+/);
        const positiveTokens: string[] = [];
        const negativeTerms: string[] = [];

        for (const token of tokens) {
          if (token.startsWith('-') && token.length > 1) {
            negativeTerms.push(token.slice(1).toLowerCase());
          } else if (token) {
            positiveTokens.push(token.toLowerCase());
          }
        }

        const fullText = [
          item.title,
          item.summary,
          item.source,
          item.url,
          ...(item.tickers || []),
          ...(item.agencies || []),
          ...(item.keyPeople || []),
          ...(item.weightedKeywords?.map(k => k.keyword) || []),
          item.sixW?.who,
          item.sixW?.doingWhat,
          item.sixW?.aboutWhat,
          item.sixW?.whoIsAffected
        ].filter(Boolean).join(' ').toLowerCase();

        const fullTextNorm = removeVietnameseAccents(fullText);

        // 1. Check exclusion terms (e.g. -tuyển dụng)
        for (const neg of negativeTerms) {
          const negNorm = removeVietnameseAccents(neg);
          if (fullText.includes(neg) || fullTextNorm.includes(negNorm)) {
            return false;
          }
        }

        // 2. Check positive terms (if any)
        if (positiveTokens.length > 0) {
          const posQueryStr = positiveTokens.join(' ');
          const posQueryNorm = removeVietnameseAccents(posQueryStr);

          const matchTitle = (item.title || '').toLowerCase().includes(posQueryStr) || removeVietnameseAccents(item.title || '').includes(posQueryNorm);
          const matchSummary = (item.summary || '').toLowerCase().includes(posQueryStr) || removeVietnameseAccents(item.summary || '').includes(posQueryNorm);
          const matchTickers = item.tickers?.some((t) => t && (t.toLowerCase().includes(posQueryStr) || removeVietnameseAccents(t).includes(posQueryNorm)));
          const matchKeywords = item.weightedKeywords?.some((k) => k?.keyword && (k.keyword.toLowerCase().includes(posQueryStr) || removeVietnameseAccents(k.keyword).includes(posQueryNorm)));
          const matchAgencies = item.agencies?.some((a) => a.toLowerCase().includes(posQueryStr) || removeVietnameseAccents(a).includes(posQueryNorm));
          const matchPeople = item.keyPeople?.some((p) => p.toLowerCase().includes(posQueryStr) || removeVietnameseAccents(p).includes(posQueryNorm));
          const matchSixWWho = item.sixW?.who?.toLowerCase().includes(posQueryStr) || removeVietnameseAccents(item.sixW?.who || '').includes(posQueryNorm);
          const matchSixWAction = item.sixW?.doingWhat?.toLowerCase().includes(posQueryStr) || removeVietnameseAccents(item.sixW?.doingWhat || '').includes(posQueryNorm);
          const matchSixWIssue = item.sixW?.aboutWhat?.toLowerCase().includes(posQueryStr) || removeVietnameseAccents(item.sixW?.aboutWhat || '').includes(posQueryNorm);
          
          const matchAllTokens = positiveTokens.every(tok => {
            const tokNorm = removeVietnameseAccents(tok);
            return fullText.includes(tok) || fullTextNorm.includes(tokNorm);
          });

          if (
            !matchTitle &&
            !matchSummary &&
            !matchTickers &&
            !matchKeywords &&
            !matchAgencies &&
            !matchPeople &&
            !matchSixWWho &&
            !matchSixWAction &&
            !matchSixWIssue &&
            !matchAllTokens
          ) {
            return false;
          }
        }
      }
      return true;
    });

    // Dynamic keyword weight mapping
    const enrichedList = list.map((item) => {
      const dynamicKw = extractWeightedKeywordsForText(item.title, item.summary, keywordWeights);
      return {
        ...item,
        weightedKeywords: dynamicKw.length > 0 ? dynamicKw : item.weightedKeywords,
      };
    });

    // Helpers for robust chronological sorting with consistent UTC+7 normalization
    const getArticlePubTime = (item: ScrapedNewsItem): number => {
      if (typeof item.publishedTimestamp === 'number' && !isNaN(item.publishedTimestamp) && item.publishedTimestamp > 0) {
        return item.publishedTimestamp;
      }
      if (item.publishedAt) {
        let raw = item.publishedAt.trim();
        const hasTz = /(?:[+-]\d{2}:?\d{2}|Z|GMT|UTC)/i.test(raw);
        if (!hasTz) {
          raw = `${raw} +0700`;
        }
        const t = Date.parse(raw);
        if (!isNaN(t) && t > 0) return t;
      }
      if (item.publishedTimeStr) {
        const m = item.publishedTimeStr.match(/(\d{1,2})[h:](\d{2})/);
        if (m) {
          const nowVn = new Date(Date.now() + 7 * 3600 * 1000);
          const hours = parseInt(m[1], 10);
          const mins = parseInt(m[2], 10);
          return Date.UTC(nowVn.getUTCFullYear(), nowVn.getUTCMonth(), nowVn.getUTCDate(), hours - 7, mins, 0);
        }
      }
      return 0;
    };

    const getArticleCrawlTime = (item: ScrapedNewsItem): number => {
      if (typeof item.scrapedTimestamp === 'number' && !isNaN(item.scrapedTimestamp)) {
        return item.scrapedTimestamp;
      }
      if (item.scrapedAt) {
        const t = new Date(item.scrapedAt).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      return getArticlePubTime(item);
    };

    // Enforce robust deterministic sorting strictly by publication time
    return enrichedList.sort((a, b) => {
      if (sortBy === 'time_desc') {
        const diff = getArticlePubTime(b) - getArticlePubTime(a);
        if (diff !== 0) return diff;
        // Strictly deterministic ID tie-breaker when publication millisecond is identical
        return String(b.id || '').localeCompare(String(a.id || ''));
      }
      if (sortBy === 'time_asc') {
        const diff = getArticlePubTime(a) - getArticlePubTime(b);
        if (diff !== 0) return diff;
        return String(a.id || '').localeCompare(String(b.id || ''));
      }
      if (sortBy === 'crawl_desc') {
        // Mới quét trong phiên quét lên đầu
        const diff = getArticleCrawlTime(b) - getArticleCrawlTime(a);
        if (diff !== 0) return diff;
        const orderDiff = (b.discoveredOrder || 0) - (a.discoveredOrder || 0);
        if (orderDiff !== 0) return orderDiff;
        return getArticlePubTime(b) - getArticlePubTime(a);
      }
      if (sortBy === 'crawl_asc') {
        // Quét đầu tiên trong phiên quét lên đầu
        const diff = getArticleCrawlTime(a) - getArticleCrawlTime(b);
        if (diff !== 0) return diff;
        const orderDiff = (a.discoveredOrder || 0) - (b.discoveredOrder || 0);
        if (orderDiff !== 0) return orderDiff;
        return getArticlePubTime(a) - getArticlePubTime(b);
      }
      if (sortBy === 'mof_weight_desc') {
        const scoreA = calculateArticleMoFPriorityScore(a.title, a.summary, keywordWeights, {
          sentiment: a.sentiment,
          impactLevel: a.impactLevel,
          buzzScore: a.buzzScore,
          isUrgent: a.isUrgent,
          sixW: a.sixW,
          executiveDirective: a.executiveDirective,
          sixWActionType: a.sixWActionType,
          policyResponseAdvisor: a.policyResponseAdvisor,
        });
        const scoreB = calculateArticleMoFPriorityScore(b.title, b.summary, keywordWeights, {
          sentiment: b.sentiment,
          impactLevel: b.impactLevel,
          buzzScore: b.buzzScore,
          isUrgent: b.isUrgent,
          sixW: b.sixW,
          executiveDirective: b.executiveDirective,
          sixWActionType: b.sixWActionType,
          policyResponseAdvisor: b.policyResponseAdvisor,
        });
        if (scoreB !== scoreA) return scoreB - scoreA;
        return getArticlePubTime(b) - getArticlePubTime(a);
      }
      if (sortBy === 'buzz_desc') {
        const diff = (b.buzzScore || 0) - (a.buzzScore || 0);
        if (diff !== 0) return diff;
        return getArticlePubTime(b) - getArticlePubTime(a);
      }
      if (sortBy === 'sentiment_desc') {
        const diff = (b.sentimentScore || 0) - (a.sentimentScore || 0);
        if (diff !== 0) return diff;
        return getArticlePubTime(b) - getArticlePubTime(a);
      }
      return 0;
    });
  }, [data?.news, sector, selectedSentiment, selectedImpact, query, sortBy, keywordWeights, showHighConfidenceOnly, showHighConfidenceBrightSpotOnly, showHighImpactOnly, showInterventionOnly, excludeAnomalies]);

  // Explicit audit logging mechanism for the publishedTimestamp of the first 5 articles
  useEffect(() => {
    if (sortedAndFilteredNews && sortedAndFilteredNews.length > 0) {
      const top5 = sortedAndFilteredNews.slice(0, 5);
      console.group('⏱️ [sortedAndFilteredNews TOP 5 AUDIT] - Verified UTC+7 Chronological Order');
      console.log(`Current SortBy: "${sortBy}" | Filtered Count: ${sortedAndFilteredNews.length}`);
      top5.forEach((item, idx) => {
        const ts = item.publishedTimestamp || (item.publishedAt ? new Date(item.publishedAt).getTime() : 0);
        const vnTime = formatNewsFullDateTime(item);
        console.log(
          `#${idx + 1} | publishedTimestamp: ${ts} (${ts ? new Date(ts).toISOString() : 'N/A'}) | VN Time: ${vnTime} | Title: "${item.title.slice(0, 60)}..." | Source: ${item.source}`
        );
      });
      console.groupEnd();
    }
  }, [sortedAndFilteredNews, sortBy]);

  return (
    <div
      className={`executive-readability min-h-screen flex selection:bg-white selection:text-black font-sans transition-colors bg-black text-zinc-100`}
    >
      {/* Executive CMS Sidebar */}
      <CmsSidebar
        activeTab={cmsTab}
        onSelectTab={(tab) => {
          if (tab === 'reports') {
            setShowExportModal(true);
          } else if (tab === 'keywords') {
            setShowKeywordWeightModal(true);
          } else if (tab === 'triggers') {
            setShowTriggerModal(true);
          } else {
            setCmsTab(tab);
          }
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        totalArticles={data?.totalFound || 0}
        crisisCount={crisisCount}
        positiveCount={positiveCount}
        timeRange={timeRange}
        isLoading={isLoading || isResetInProgress}
        lastScannedTime={lastScannedTime}
        customWeightsCount={customWeightsModifiedCount}
        activeTriggersCount={triggerRules.filter((r) => r.enabled).length}
        appVersion={appMetadata.version}
        appUpdatedAt={appMetadata.updatedAt}
        onOpenAdvisorChatbot={() => setIsAdvisorChatOpen(true)}
        onOpenTaxonomyModal={() => setShowTaxonomyModal(true)}
        onOpenDbResetModal={() => setShowDbResetModal(true)}
      />

      {/* UI-Wide Reset In Progress Floating Banner Overlay */}
      {isResetInProgress && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-amber-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-auto">
          <RefreshCw className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
          <div className="text-xs space-y-0.5">
            <span className="font-extrabold text-amber-400 block">Đang đặt lại cơ sở dữ liệu (0-State)</span>
            <span className="text-slate-300">Vui lòng chờ quá trình hoàn tất. Các nút bấm quét tin đã được khóa an toàn.</span>
          </div>
        </div>
      )}

      {/* Main CMS Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar */}
        <Header
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          isLoading={isLoading}
          isResetInProgress={isResetInProgress}
          onRefresh={() => performScrape(timeRange, 'all', '', true)}
          lastScannedTime={lastScannedTime}
          scannedWindow={getDynamicScannedWindow(timeRange)}
          onOpenExportModal={() => setShowExportModal(true)}
          totalArticles={data?.totalFound || 0}
          filteredArticlesCount={sortedAndFilteredNews.length}
          searchQuery={query}
          onSearchChange={handleSearch}
          autoRefreshInterval={autoRefreshInterval}
          onAutoRefreshIntervalChange={handleAutoRefreshIntervalChange}
          countdown={countdown}
          onOpenKeywordWeightModal={() => setShowKeywordWeightModal(true)}
          customWeightsModifiedCount={customWeightsModifiedCount}
          onOpenAlertTriggerModal={() => setShowTriggerModal(true)}
          onOpenBatchAlertDrawer={() => setIsBatchAlertDrawerOpen(true)}
          activeTriggersCount={triggerRules.filter((r) => r.enabled).length}
          activeAlertsCount={effectiveActiveAlertsCount}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenAdvisorChatbot={() => setIsAdvisorChatOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenKeyboardShortcuts={() => setIsShortcutsModalOpen(true)}
          onOpenVideoModal={() => handleOpenVideoModal()}
          onOpenGmailAlertModal={() => handleOpenGmailAlertModal(null)}
          onOpenApiKeyModal={() => setShowApiKeyModal(true)}
          onOpenTaxonomyModal={() => setShowTaxonomyModal(true)}
          onOpenDbResetModal={() => setShowDbResetModal(true)}
          onOpenTimeWindowAuditModal={() => setShowTimeWindowAuditModal(true)}
        />

        {/* Modern Executive Command Bar & Integrated KPIs */}
        <ExecutiveCommandBar
          cmsTab={cmsTab}
          onSelectTab={(tab) => setCmsTab(tab)}
          totalFound={data?.totalFound || 0}
          crisisCount={crisisCount}
          highConfidenceCrisisCount={highConfidenceCrisisCount}
          showHighConfidenceOnly={showHighConfidenceOnly}
          onToggleHighConfidenceOnly={() => {
            setShowHighConfidenceOnly((prev) => {
              const next = !prev;
              if (next) {
                setShowHighConfidenceBrightSpotOnly(false);
                setShowNeutralOnly(false);
                setShowHighImpactOnly(false);
                setShowInterventionOnly(false);
              }
              return next;
            });
          }}
          highImpactCount={highImpactCount}
          showHighImpactOnly={showHighImpactOnly}
          onToggleHighImpactOnly={() => {
            setShowHighImpactOnly((prev) => {
              const next = !prev;
              if (next) {
                setShowHighConfidenceBrightSpotOnly(false);
              }
              return next;
            });
          }}
          interventionCount={interventionCount}
          showInterventionOnly={showInterventionOnly}
          onToggleInterventionOnly={() => {
            setShowInterventionOnly((prev) => {
              const next = !prev;
              if (next) {
                setShowHighConfidenceBrightSpotOnly(false);
              }
              return next;
            });
          }}
          positiveCount={positiveCount}
          highConfidenceBrightSpotCount={highConfidenceBrightSpotCount}
          showHighConfidenceBrightSpotOnly={showHighConfidenceBrightSpotOnly}
          onToggleHighConfidenceBrightSpotOnly={() => {
            setShowHighConfidenceBrightSpotOnly((prev) => {
              const next = !prev;
              if (next) {
                setShowHighConfidenceOnly(false);
                setShowNeutralOnly(false);
                setShowHighImpactOnly(false);
                setShowInterventionOnly(false);
              }
              return next;
            });
          }}
          neutralCount={neutralCount}
          neutralPercentage={neutralPercentage}
          showNeutralOnly={showNeutralOnly}
          onToggleNeutralOnly={() => {
            setShowNeutralOnly((prev) => {
              const next = !prev;
              if (next) {
                setShowHighConfidenceOnly(false);
                setShowHighConfidenceBrightSpotOnly(false);
                setShowHighImpactOnly(false);
                setShowInterventionOnly(false);
              }
              return next;
            });
          }}
          excludeAnomalies={excludeAnomalies}
          onToggleExcludeAnomalies={toggleExcludeAnomalies}
          integrityReport={integrityReport}
          isOfficialOnly={isOfficialOnly}
          onSelectOfficialSource={(officialOnly) => {
            setIsOfficialOnly(officialOnly);
            performScrape(timeRange, 'all', '', true, undefined, officialOnly);
          }}
          onOpenOfficialPortalsModal={() => setShowOfficialPortalsModal(true)}
          turboSilentMode={turboSilentMode}
          onToggleTurboSilentMode={handleToggleTurboSilentMode}
          densityMode={densityMode}
          onDensityModeChange={handleDensityModeChange}
          onOpenAdvisorChat={() => setIsAdvisorChatOpen(true)}
          isLoading={isLoading}
          timeRange={timeRange}
          onTriggerBackgroundScrape={() => performScrape(timeRange, 'all', '', true)}
          distantHorizonCount={distantHorizonCount}
          showDivergenceOnly={showDivergenceOnly}
          onToggleDivergenceOnly={() => setShowDivergenceOnly(prev => !prev)}
          showEarlyHorizonOnly={showEarlyHorizonOnly}
          onToggleEarlyHorizonOnly={() => {
            setShowEarlyHorizonOnly(prev => {
              const next = !prev;
              if (next) {
                setSector('all');
                setShowHighConfidenceOnly(false);
                setSelectedSentiment('all');
              }
              return next;
            });
          }}
          showEarlyWarningOnly={showEarlyWarningOnly}
          onToggleEarlyWarningOnly={() => {
            setShowEarlyWarningOnly(prev => {
              const next = !prev;
              if (next) {
                setSector('all');
                setShowHighConfidenceOnly(false);
                setSelectedSentiment('all');
              }
              return next;
            });
          }}
        />

        {/* Main Content View based on Active CMS Tab */}
        <main
          className={`mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 md:pb-8 flex-1 w-full space-y-4 sm:space-y-6 transition-all duration-300 ${
            cmsTab === 'dashboard' ? 'max-w-[1850px] 2xl:max-w-[1920px]' : 'max-w-7xl'
          }`}
        >
          {/* Silent Background Sync Bar (Non-blocking, zero screen hindrance) */}
          {turboSilentMode && isLoading && (
            <div className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border text-xs shadow-lg backdrop-blur-md animate-in fade-in duration-300 ${
              isDark ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
                  <span>{isVietnamese ? 'Đang quét ngầm 150 nguồn báo chí siêu tốc (Chạy nền song song - Không chặn màn hình)' : 'Running high-speed background scan across 150 sources (Non-blocking)'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono hidden sm:inline ${isDark ? 'text-emerald-400/80' : 'text-emerald-700'}`}>
                  {isVietnamese ? 'Tự động cập nhật tin bài khi hoàn tất' : 'Auto-updating results upon completion'}
                </span>
                <button
                  onClick={handleCancelScrape}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {isVietnamese ? 'Hủy' : 'Cancel'}
                </button>
              </div>
            </div>
          )}

          {/* Real-time Visual Scrape Progress Bar (Only shown in detailed visual mode) */}
          {!turboSilentMode && (
            <ScrapeProgressBar
              isLoading={isLoading}
              totalArticlesFound={data?.totalFound || data?.news?.length || 0}
              timeRange={timeRange}
              onCancel={handleCancelScrape}
              isOfficialOnly={isOfficialOnly}
            />
          )}

          {/* Global Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300 text-xs shadow-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => performScrape(timeRange, 'all', '', true)}
                className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg transition cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* TAB 1: EXECUTIVE DASHBOARD */}
          {cmsTab === 'dashboard' && (
            <div className="space-y-4 animate-fadeIn overflow-hidden">
              {/* Zero-state Reset Notice Banner */}
              {data?.totalFound === 0 && !isLoading && (
                <div className={`p-6 sm:p-8 rounded-3xl border text-center space-y-3.5 shadow-sm transition-all ${
                  isDark ? 'bg-slate-900/90 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto ring-4 ring-emerald-500/10">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      Cơ sở dữ liệu đang ở trạng thái 0 bài viết (Đã Đặt Lại)
                    </h3>
                    <p className={`text-xs sm:text-sm max-w-xl mx-auto leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Toàn bộ dữ liệu lưu trữ đã được dọn sạch. Hệ thống đã khóa tự động cào tin ngầm. Khi cần bắt đầu phiên theo dõi tin tức mới, vui lòng nhấn nút bên dưới.
                    </p>
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={() => performScrape(timeRange, 'all', '', true)}
                      disabled={isResetInProgress}
                      className={`px-5 py-2.5 rounded-2xl text-white text-xs sm:text-sm font-black transition cursor-pointer inline-flex items-center gap-2 shadow-lg active:scale-95 ${
                        isResetInProgress
                          ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                          : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                      }`}
                    >
                      <RefreshCw className={`w-4 h-4 ${isResetInProgress ? 'animate-spin' : ''}`} />
                      <span>{isResetInProgress ? 'Đang Đặt Lại Database...' : 'Bắt đầu quét tin tức mới'}</span>
                    </button>
                  </div>
                </div>
              )}

              <ExecutiveDashboardView
                data={data}
                timeRange={timeRange}
                onTimeRangeChange={(tr) => setTimeRange(tr)}
                sector={sector}
                onSelectSector={(s) => setSector(s)}
                enrichedTrendingKeywords={enrichedTrendingKeywords}
                onSelectArticle={(article) => setActiveDeepDiveItem(article)}
                onDraftStatement={(article) => setActiveDraftStatementItem(article)}
                onOpenGmailAlertModal={(article) => handleOpenGmailAlertModal(article)}
                onOpenVideoModal={(article) => handleOpenVideoModal(article)}
                onOpenKeywordWeightModal={() => setShowKeywordWeightModal(true)}
                onOpenOfficialPortalsModal={() => setShowOfficialPortalsModal(true)}
                onNavigateTab={(tab) => setCmsTab(tab)}
                handleSearch={handleSearch}
                isLoading={isLoading}
                onRefresh={() => performScrape(timeRange, 'all', '', true)}
                densityMode={densityMode}
                onDensityModeChange={setDensityMode}
                showHighConfidenceOnly={showHighConfidenceOnly}
                onToggleHighConfidenceOnly={setShowHighConfidenceOnly}
                showHighConfidenceBrightSpotOnly={showHighConfidenceBrightSpotOnly}
                onToggleHighConfidenceBrightSpotOnly={setShowHighConfidenceBrightSpotOnly}
                neutralCount={neutralCount}
                neutralPercentage={neutralPercentage}
                bullishPercentage={bullishPercentage}
                bearishPercentage={bearishPercentage}
                showNeutralOnly={showNeutralOnly}
                onToggleNeutralOnly={setShowNeutralOnly}
                positiveCount={positiveCount}
                crisisCount={crisisCount}
                highConfidenceCrisisCount={highConfidenceCrisisCount}
                highConfidenceBrightSpotCount={highConfidenceBrightSpotCount}
                onOpenAiFeedbackModal={handleOpenAiFeedback}
                onOpenAiRulesModal={handleOpenAiRules}
                onOpenWarningPipeline={(article) => setActiveWarningPipelineItem(article)}
                onOpenAlertTriggerModal={() => setShowTriggerModal(true)}
                onOpenBatchAlertDrawer={() => setIsBatchAlertDrawerOpen(true)}
                activeTriggersCount={triggerRules.filter((r) => r.enabled).length}
                activeAlertsCount={effectiveActiveAlertsCount}
              />
            </div>
          )}

          {/* TAB 2: UNIFIED CMS CONTENT TABLE & SCRAPED NEWS DATABASE HUB */}
          {(cmsTab === 'table' || cmsTab === 'database') && (
            <div className="space-y-4 animate-fadeIn">
              {/* Sector Filters shifted here to focus on article management */}
              <SectorFilter
                activeSector={sector}
                onSelectSector={handleSectorChange}
                sectorStats={data?.sectorStats || []}
                totalCount={data?.totalFound || 0}
              />
              <CmsContentTable
                isLoading={isLoading}
                initialHubView={cmsTab === 'database' ? 'schema_audit' : 'articles'}
                newsItems={sortedAndFilteredNews}
                onDeepDive={(n) => setActiveDeepDiveItem(n)}
                onDraftStatement={(n) => setActiveDraftStatementItem(n)}
                onPolicySubmission={(n) => setActivePolicySubmissionItem(n)}
                onGenerateVideo={(n) => handleOpenVideoModal(n)}
                onArticleCreated={handleArticleCreated}
                onArticleUpdated={handleArticleUpdated}
                onArticleDeleted={handleArticleDeleted}
                onBulkArticlesDeleted={handleBulkArticlesDeleted}
                onOpenAiFeedback={handleOpenAiFeedback}
                onOpenAiRules={handleOpenAiRules}
                onNavigateToFinetune={() => setCmsTab('finetune')}
                keywordWeights={keywordWeights}
                selectedSentiment={selectedSentiment}
                onSentimentChange={setSelectedSentiment}
                selectedImpact={selectedImpact}
                onImpactChange={setSelectedImpact}
                sortBy={sortBy}
                onSortChange={setSortBy}
                query={query}
                onQueryChange={handleSearch}
                densityMode={densityMode}
                onDensityModeChange={handleDensityModeChange}
                showHighConfidenceOnly={showHighConfidenceOnly}
                onToggleHighConfidenceOnly={setShowHighConfidenceOnly}
                showHighConfidenceBrightSpotOnly={showHighConfidenceBrightSpotOnly}
                onToggleHighConfidenceBrightSpotOnly={setShowHighConfidenceBrightSpotOnly}
                onArticlesStandardized={handleBulkArticlesStandardized}
                onGmailAlert={(n) => handleOpenGmailAlertModal(n)}
                onDatabaseResetStart={handleStartDatabaseReset}
                onResetDatabase={() => handleCompleteDatabaseReset('news')}
              />
            </div>
          )}

          {/* TAB 3: EXECUTIVE BRIEFING WORKSPACE */}
          {cmsTab === 'briefing' && (
            <div className="space-y-6 animate-fadeIn">
              {data?.executiveSummaryReport ? (
                <LeadershipInsightsBanner
                  report={data.executiveSummaryReport}
                  onSelectArticleForDraft={(item) => setActiveDraftStatementItem(item)}
                  onDeepDive={(item) => setActiveDeepDiveItem(item)}
                />
              ) : (
                <div
                  className={`border rounded-2xl p-12 text-center space-y-3 transition-colors ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <Sparkles className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    Bấm Quét Ngay để hệ thống tổng hợp báo cáo tham mưu báo chí cho Lãnh đạo
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB: 30+ FINANCIAL NEWS SOURCES HUB */}
          {cmsTab === 'sources' && (
            <div className="space-y-6 animate-fadeIn">
              <NewsSourcesHub
                articles={data?.news || []}
                onSelectSourceFilter={(sourceName) => {
                  setQuery(sourceName);
                  setCmsTab('table');
                }}
                onRefreshSources={() => performScrape(timeRange, sector, query, true)}
              />
            </div>
          )}

          {/* TAB: KNOWLEDGE BASE MANAGER (RAG) */}
          {cmsTab === 'knowledge' && (
            <div className="space-y-6 animate-fadeIn">
              <KnowledgeBaseManager
                onOpenAdvisorWithDoc={(doc) => {
                  setIsAdvisorChatOpen(true);
                }}
              />
            </div>
          )}

          {/* TAB: FINE-TUNING STUDIO & DIRECT MODEL TRAINING */}
          {cmsTab === 'finetune' && (
            <div className="space-y-6 animate-fadeIn">
              <MLPerformanceWidget
                newsItems={sortedAndFilteredNews}
                onNavigateToTableWithFilter={() => setCmsTab('table')}
              />
              <FineTuningStudio />
            </div>
          )}

          {/* TAB: ENTITY KNOWLEDGE GRAPH & RELATIONSHIP MAP */}
          {cmsTab === 'graph' && (
            <div className="space-y-6 animate-fadeIn">
              <EntityKnowledgeGraph
                articles={data?.news || []}
                onSelectArticleDeepDive={(art) => setActiveDeepDiveItem(art)}
                onOpenAdvisorWithPrompt={(prompt) => {
                  setIsAdvisorChatOpen(true);
                }}
              />
            </div>
          )}

          {/* TAB: SEMANTIC DICTIONARY & CONTEXT MAPPING (MOF 2026) */}
          {cmsTab === 'dictionary' && (
            <div className="space-y-6 animate-fadeIn">
              <SemanticDictionaryAdmin />
            </div>
          )}

          {/* TAB 4: ANALYTICS & ADVANCED INTELLIGENCE HUB */}
          {cmsTab === 'analytics' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Analytics Hub Sub-navigation Bar */}
              <div
                className={`p-2.5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 w-full sm:w-auto">
                  <button
                    onClick={() => setAnalyticsSubTab('projection')}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 whitespace-nowrap border-2 ${
                      analyticsSubTab === 'projection'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                        : isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                        : 'bg-slate-50 border-slate-300 text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="sm:hidden">Dự Báo 4h</span>
                    <span className="hidden sm:inline">{isVietnamese ? 'Dự Báo Xu Hướng 4h & Cảnh Báo' : '4h Trend Projection & Alerts'}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black ${
                      analyticsSubTab === 'projection' ? 'bg-black/20 text-white' : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      T+4h
                    </span>
                  </button>

                  <button
                    onClick={() => setAnalyticsSubTab('trends')}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 whitespace-nowrap border-2 ${
                      analyticsSubTab === 'trends'
                        ? 'bg-blue-800 text-white border-blue-900 shadow-sm'
                        : isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                        : 'bg-slate-50 border-slate-300 text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="sm:hidden">Tần Suất</span>
                    <span className="hidden sm:inline">{isVietnamese ? 'Tần Suất & Xu Hướng Chủ Đề' : 'Topic Frequency & Trends'}</span>
                  </button>

                  <button
                    onClick={() => setAnalyticsSubTab('sentiment')}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 whitespace-nowrap border-2 ${
                      analyticsSubTab === 'sentiment'
                        ? 'bg-blue-900 text-white border-blue-950 shadow-sm'
                        : isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                        : 'bg-slate-50 border-slate-300 text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-blue-300" />
                    <span className="sm:hidden">Tham Mưu</span>
                    <span className="hidden sm:inline">{isVietnamese ? 'Phân Tích Sắc Thái & Tham Mưu Lãnh Đạo' : 'Sentiment Analysis & Leadership Advisory'}</span>
                  </button>

                  <button
                    onClick={() => setAnalyticsSubTab('explainer')}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 whitespace-nowrap border-2 ${
                      analyticsSubTab === 'explainer'
                        ? 'bg-slate-800 text-white border-slate-900 shadow-sm dark:bg-slate-700'
                        : isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                        : 'bg-slate-50 border-slate-300 text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    <Calculator className="w-4 h-4 text-amber-400" />
                    <span className="sm:hidden">Mô Hình Toán</span>
                    <span className="hidden sm:inline">{isVietnamese ? 'Thuật Toán & Công Thức Đánh Giá' : 'Algorithm & Formula Explainer'}</span>
                  </button>

                  <button
                    onClick={() => setAnalyticsSubTab('charts')}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 whitespace-nowrap border-2 ${
                      analyticsSubTab === 'charts'
                        ? 'bg-slate-800 text-white border-slate-900 shadow-sm dark:bg-slate-700'
                        : isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                        : 'bg-slate-50 border-slate-300 text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    <PieChart className="w-4 h-4 text-cyan-400" />
                    <span className="sm:hidden">Biểu Đồ</span>
                    <span className="hidden sm:inline">{isVietnamese ? 'Biểu Đồ Phân Bổ' : 'Distribution Charts'}</span>
                  </button>
                </div>

                <div className={`flex items-center gap-2 text-xs px-2 shrink-0 font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  <span>{isVietnamese ? 'Dữ liệu:' : 'Dataset:'} <strong className={isDark ? 'text-slate-100 font-bold' : 'text-slate-900 font-bold'}>{data?.news?.length || 0} {isVietnamese ? 'bài viết' : 'articles'}</strong></span>
                </div>
              </div>

              {/* Sub-tab 0: 4-Hour Trend Projection & Early Warning Radar */}
              {analyticsSubTab === 'projection' && (
                <TrendProjectionWidget
                  newsItems={data?.news || []}
                  onSelectArticle={(art) => setActiveDeepDiveItem(art)}
                  onOpenAlertModal={(entityName) => {
                    handleOpenGmailAlertModal();
                  }}
                />
              )}

              {/* Sub-tab 1: Topic Trend & Velocity Tracking */}
              {analyticsSubTab === 'trends' && (
                <TopicTrendVelocityModule
                  newsItems={data?.news || []}
                  timeRange={timeRange}
                  onSelectKeyword={(kw) => {
                    handleSearch(kw);
                    setCmsTab('table');
                  }}
                  onSelectArticle={(art) => setActiveDeepDiveItem(art)}
                />
              )}

              {/* Sub-tab 2: Deep Sentiment Analysis & Leadership Advisory */}
              {analyticsSubTab === 'sentiment' && (
                <SentimentLeadershipAdvisoryModule
                  newsItems={data?.news || []}
                  sectorStats={data?.sectorStats || []}
                  onDraftStatement={(art) => setActiveDraftStatementItem(art)}
                  onOpenGmailAlertModal={(art) => handleOpenGmailAlertModal(art)}
                  onDeepDive={(art) => setActiveDeepDiveItem(art)}
                />
              )}

              {/* Sub-tab 3: Algorithmic Formula & Decision Tree Explainer */}
              {analyticsSubTab === 'explainer' && (
                <SentimentFormulaExplainerModule
                  newsItems={data?.news || []}
                  onSelectArticle={(art) => setActiveDeepDiveItem(art)}
                />
              )}

              {/* Sub-tab 4: General Timeline & Distribution Charts */}
              {analyticsSubTab === 'charts' && (
                <div className="space-y-6">
                  {data ? (
                    <AnalyticsCharts timelineData={data.timelineData} sectorStats={data.sectorStats} />
                  ) : (
                    <div
                      className={`border rounded-2xl p-12 text-center space-y-3 transition-colors ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <PieChart className="w-10 h-10 text-cyan-500 mx-auto" />
                      <p className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                        Chưa có dữ liệu phân tích. Hãy bấm Quét Ngay.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* CMS Footer */}
        <footer
          className={`border-t py-4 pb-20 md:pb-4 text-center text-xs transition-colors ${
            isDark ? 'bg-slate-900/80 border-slate-800/80 text-slate-500' : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>BTC Listening Executive CMS Portal © 2026 - Real-time Financial News & Media Intelligence</span>
            <span className="text-emerald-500 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Phiên Quét {timeRange} • Chế độ Ban Lãnh Đạo
            </span>
          </div>
        </footer>

        {/* Mobile Sticky Bottom Navigation Footer */}
        <MobileStickyFooter
          activeTab={cmsTab}
          onSelectTab={(tab) => {
            setCmsTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          totalArticles={data?.totalFound || data?.news?.length || 0}
          crisisCount={crisisCount}
          onOpenAdvisor={() => setIsAdvisorChatOpen(true)}
          urgentAlerts={data?.urgentAlerts || []}
          activeUrgentToast={activeAlerts[0] || null}
          articles={data?.news || []}
          onSelectAlertArticle={handleScrollToAlertArticle}
        />
      </div>

      {/* Modals */}
      <DeepDiveModal
        item={activeDeepDiveItem}
        onClose={() => setActiveDeepDiveItem(null)}
        onDraftStatement={(n) => handleOpenDraftStatement(n)}
        onPolicySubmission={(n) => handleOpenPolicySubmission(n)}
        onGmailAlert={(n) => handleOpenGmailAlertModal(n)}
        onOpenViolationDossier={(n) => handleOpenViolationDossier(n)}
        onOpenReaderComments={(n) => handleOpenReaderComments(n)}
        onOpenAdvisorChatbot={(n) => {
          setAdvisorContextArticle(n);
          setIsAdvisorChatOpen(true);
        }}
      />

      <DraftStatementModal
        item={activeDraftStatementItem}
        onClose={() => setActiveDraftStatementItem(null)}
      />

      <PolicySubmissionModal
        item={activePolicySubmissionItem}
        onClose={() => setActivePolicySubmissionItem(null)}
      />

      {showExportModal && (
        <ExportReportModal
          data={data}
          filteredNews={sortedAndFilteredNews}
          timeRange={timeRange}
          sector={sector}
          onClose={() => setShowExportModal(false)}
        />
      )}

      <KeywordWeightModal
        isOpen={showKeywordWeightModal}
        onClose={() => setShowKeywordWeightModal(false)}
        weights={keywordWeights}
        onSaveWeights={handleSaveKeywordWeights}
        onResetWeights={handleResetKeywordWeights}
      />

      {/* Dedicated Alert Triggers & Alerts Center Modal */}
      <AlertTriggerModal
        isOpen={showTriggerModal}
        onClose={() => setShowTriggerModal(false)}
        triggerRules={triggerRules}
        onSaveTriggerRules={handleSaveTriggerRules}
        onResetTriggerRules={handleResetTriggerRules}
        thresholdConfig={thresholdConfig}
        onSaveThresholdConfig={handleSaveThresholdConfig}
        scrapedArticles={data?.news || []}
        onDispatchTriggerAlert={handleDispatchTriggerAlert}
        activeAlerts={effectiveActiveAlerts}
        onOpenExecutiveModal={(alert) => {
          setActiveExecutiveUrgentModal(alert);
          setShowTriggerModal(false);
        }}
        onOpenDraftStatement={(article) => {
          handleOpenDraftStatement(article);
          setShowTriggerModal(false);
        }}
        onClearAlert={handleClearAlert}
        onClearAllAlerts={handleClearAllAlerts}
      />

      {/* Full-Screen Executive Urgent Command Modal */}
      <ExecutiveUrgentAlertModal
        alert={activeExecutiveUrgentModal}
        onClose={() => setActiveExecutiveUrgentModal(null)}
        onOpenDraftStatement={(alert) => {
          if (alert.article) handleOpenDraftStatement(alert.article);
          setActiveExecutiveUrgentModal(null);
        }}
        onOpenDeepDive={(articleId) => {
          const found = data?.news.find((n) => n.id === articleId);
          if (found) {
            setActiveDeepDiveItem(found);
            setActiveExecutiveUrgentModal(null);
          }
        }}
      />

      {/* Warning Pipeline 7-Stage & 3-Level Model Modal */}
      {activeWarningPipelineItem && (
        <WarningPipelineModelModal
          item={activeWarningPipelineItem}
          allNews={data.news}
          onClose={() => setActiveWarningPipelineItem(null)}
          onGmailAlert={(item) => handleOpenGmailAlertModal(item)}
          onDraftStatement={(item) => handleOpenDraftStatement(item)}
          onPolicySubmission={(item) => handleOpenPolicySubmission(item)}
          onOverrideArticle={(updated) => {
            setData((prev) => ({
              ...prev,
              news: prev.news.map((n) => (n.id === updated.id ? updated : n))
            }));
            setActiveWarningPipelineItem(updated);
          }}
        />
      )}

      {/* Floating Action Launcher Button for Advisor Chatbot */}
      <FloatingAdvisorChatButton
        onClick={() => setIsAdvisorChatOpen(true)}
        isOpen={isAdvisorChatOpen}
      />

      {/* AI Modal Advisor Chatbot */}
      <ModalAdvisorChatbot
        isOpen={isAdvisorChatOpen}
        onClose={() => setIsAdvisorChatOpen(false)}
        contextArticle={advisorContextArticle}
        timeRange={timeRange}
        data={data}
        summary={
          data?.executiveSummaryReport?.overallStrategicAdvice ||
          (data?.sentimentOverview
            ? `Tâm lý thị trường: ${data.sentimentOverview.overallMood} (${data.sentimentOverview.moodScore}/100). Động lực chính: ${data.sentimentOverview.keyDriver}. Tổng số: ${data.totalFound || 0} bài trong phiên ${timeRange}.`
            : undefined)
        }
        systemPrompt="Bạn là Chuyên gia Cao cấp Tham mưu Kinh tế Tài chính & Quản lý Nhà nước (BTC / UBCKNN / NHNN). Cung cấp tư vấn tài chính chuyên nghiệp, chuyên sâu theo từng lĩnh vực (chứng khoán, thuế, trái phiếu, ngân hàng, nợ công, đầu tư công), định hướng lựa chọn hình thức văn bản hành chính công vụ và kích hoạt Modal AI tương ứng trong ứng dụng. Câu trả lời phải bám sát khung thời gian và dữ liệu thị trường thực tế."
        onOpenDraftStatement={(article) => {
          if (article) handleOpenDraftStatement(article);
          else if (data?.news?.[0]) handleOpenDraftStatement(data.news[0]);
          setIsAdvisorChatOpen(false);
        }}
        onOpenPolicySubmission={(article) => {
          if (article) handleOpenPolicySubmission(article);
          else if (data?.news?.[0]) handleOpenPolicySubmission(data.news[0]);
          setIsAdvisorChatOpen(false);
        }}
        onOpenDeepDive={(article) => {
          if (article) setActiveDeepDiveItem(article);
          else if (data?.news?.[0]) setActiveDeepDiveItem(data.news[0]);
          setIsAdvisorChatOpen(false);
        }}
        onOpenTriggerConfig={() => {
          setShowTriggerModal(true);
          setIsAdvisorChatOpen(false);
        }}
        onOpenGmailAlert={(article) => {
          handleOpenGmailAlertModal(article || data?.news?.[0]);
          setIsAdvisorChatOpen(false);
        }}
        onFilterSmartCategory={(category) => {
          if (category === 'chinh_sach') {
            setQuery('chính sách');
          } else {
            setQuery('doanh nghiệp');
          }
          setCmsTab('table');
          setIsAdvisorChatOpen(false);
        }}
      />

      {/* Global Command Palette (Ctrl+K / ⌘K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={(tab) => {
          setCmsTab(tab);
        }}
        onSelectArticle={(article) => {
          setActiveDeepDiveItem(article);
        }}
        onOpenAdvisorChatbot={(article) => {
          setAdvisorContextArticle(article || null);
          setIsAdvisorChatOpen(true);
        }}
        onOpenDraftStatement={(article) => {
          if (article) handleOpenDraftStatement(article);
          else if (data?.news?.[0]) handleOpenDraftStatement(data.news[0]);
        }}
        onOpenPolicySubmission={(article) => {
          if (article) handleOpenPolicySubmission(article);
          else if (data?.news?.[0]) handleOpenPolicySubmission(data.news[0]);
        }}
        onOpenKeywordWeights={() => {
          setShowKeywordWeightModal(true);
        }}
        onOpenAlertTriggers={() => {
          setShowTriggerModal(true);
        }}
        onOpenExportModal={() => {
          setShowExportModal(true);
        }}
        onOpenVideoModal={(article) => {
          handleOpenVideoModal(article);
        }}
        onRefreshScrape={() => {
          performScrape(timeRange, 'all', '', true);
        }}
        onOpenKeyboardShortcuts={() => {
          setIsShortcutsModalOpen(true);
        }}
        onOpenTaxonomyModal={() => {
          setShowTaxonomyModal(true);
        }}
        onOpenDbResetModal={() => {
          setShowDbResetModal(true);
        }}
        articles={data?.news || []}
        timeRange={timeRange}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal (?) */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        onOpenCommandPalette={() => {
          setIsCommandPaletteOpen(true);
        }}
        onOpenAdvisorChatbot={() => {
          setIsAdvisorChatOpen(true);
        }}
      />

      {/* Cloud Firestore Database Management & Reset to Zero Modal */}
      <DatabaseResetModal
        isOpen={showDbResetModal}
        onClose={() => setShowDbResetModal(false)}
        isDark={isDark}
        onDatabaseResetStart={handleStartDatabaseReset}
        onDatabaseResetCompleted={handleCompleteDatabaseReset}
      />

      {/* Veo 3 AI Video Generator Modal */}
      <NewsVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        article={videoContextArticle}
      />

      {/* Gmail Emergency Alert Modal */}
      <GmailAlertModal
        isOpen={showGmailAlertModal}
        onClose={() => setShowGmailAlertModal(false)}
        selectedArticle={selectedArticleForGmail}
        isDark={isDark}
      />

      {/* Hybrid BYOK API Key Settings Modal */}
      <ApiKeySettingsModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />

      {/* Taxonomy & Sentiment Labeling Guide Modal */}
      <TaxonomyDefinitionModal
        isOpen={showTaxonomyModal}
        onClose={() => setShowTaxonomyModal(false)}
      />

      {/* Sentiment Score Decomposition & Component Analysis Modal */}
      <SentimentScoreBreakdownModal
        isOpen={Boolean(activeSentimentScoreBreakdownItem)}
        item={activeSentimentScoreBreakdownItem}
        onClose={() => setActiveSentimentScoreBreakdownItem(null)}
        onDraftStatement={(article) => {
          setActiveDraftStatementItem(article);
          setActiveSentimentScoreBreakdownItem(null);
        }}
        onGmailAlert={(article) => {
          handleOpenGmailAlertModal(article);
          setActiveSentimentScoreBreakdownItem(null);
        }}
      />

      {/* Real-time Connectivity Status of Official MoF Portals Modal */}
      <OfficialPortalsStatusModal
        isOpen={showOfficialPortalsModal}
        onClose={() => setShowOfficialPortalsModal(false)}
        isDark={isDark}
      />

      {/* Violation Evidence Dossier Modal (SHA-256 Legal Integrity & Document Export) */}
      <ViolationEvidenceDossierModal
        isOpen={showViolationDossierModal}
        onClose={() => setShowViolationDossierModal(false)}
        article={violationDossierArticle}
        isDark={isDark}
      />

      {/* Real Reader Comments & Citizen Sentiment Analysis Modal */}
      <ReaderCommentsSentimentModal
        isOpen={showReaderCommentsModal}
        onClose={() => setShowReaderCommentsModal(false)}
        article={readerCommentsArticle}
        onOpenViolationDossier={handleOpenViolationDossier}
        isDark={isDark}
      />

      {/* Time Window Compliance & Audit Modal */}
      <TimeWindowAuditModal
        isOpen={showTimeWindowAuditModal}
        onClose={() => setShowTimeWindowAuditModal(false)}
        currentArticles={data?.news || []}
        timeRange={timeRange}
        timeBounds={data?.timeBounds}
        onTriggerScan={(range) => performScrape(range as any, 'all', '', true)}
      />

      {/* AI Article Removal & Exclusion Training Modal */}
      <AiArticleFeedbackModal
        isOpen={showAiFeedbackModal}
        article={feedbackArticle}
        onClose={() => {
          setShowAiFeedbackModal(false);
          setFeedbackArticle(null);
        }}
        onConfirmRemoveAndTrain={handleConfirmRemoveAndTrain}
        onOpenRulesManager={() => {
          setShowAiFeedbackModal(false);
          setShowAiRulesModal(true);
        }}
      />

      {/* AI Learned Exclusion Rules Manager Modal */}
      <AiExclusionRulesModal
        isOpen={showAiRulesModal}
        onClose={() => setShowAiRulesModal(false)}
      />

      {/* AI Feedback Training Success Toast Notification */}
      {aiFeedbackSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3.5 rounded-2xl shadow-2xl border border-indigo-500/50 flex items-start gap-3 animate-slideUp">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs shadow-md">
            AI
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-sm text-indigo-400 dark:text-indigo-600 mb-0.5">
              Đã Đào Tạo Bộ Lọc AI Thành Công
            </div>
            <div className="opacity-90 leading-relaxed">{aiFeedbackSuccessToast}</div>
          </div>
          <button
            onClick={() => setAiFeedbackSuccessToast(null)}
            className="text-slate-400 hover:text-white dark:hover:text-slate-900 p-1 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Fullscreen Initial Loading Overlay (Only displayed when detailed visual loading is requested) */}
      <FullscreenLoadingOverlay
        isVisible={!turboSilentMode && !userDismissedLoadingOverlay && (isInitialBoot || !data) && isLoading}
        isDark={isDark}
        isVietnamese={isVietnamese}
        timeRange={timeRange}
        hasExistingData={Boolean(data && data.news && data.news.length > 0)}
        onDismissOrSkip={() => setUserDismissedLoadingOverlay(true)}
      />

      {/* Batch Alert Summary Drawer (Paginated All-Alerts Inspection Drawer) */}
      <BatchAlertSummaryDrawer
        isOpen={isBatchAlertDrawerOpen}
        onClose={() => setIsBatchAlertDrawerOpen(false)}
        alerts={effectiveActiveAlerts}
        timeRange={timeRange}
        onSelectAlertArticle={handleScrollToAlertArticle}
        onOpenDeepDive={(article) => setActiveDeepDiveItem(article)}
        onOpenDraftStatement={(article) => handleOpenDraftStatement(article)}
        onOpenGmailAlert={(article) => handleOpenGmailAlertModal(article)}
        onOpenExecutiveModal={(alert) => setActiveExecutiveUrgentModal(alert)}
        onOpenTriggerConfig={() => setShowTriggerModal(true)}
        onClearAlert={handleClearAlert}
        onClearAllAlerts={handleClearAllAlerts}
      />

      {/* Floating Mini Batch Alert Toast Summary (Only Critical Risk Active Alerts) */}
      {showBatchToast && criticalToastPopUpAlerts.length > 0 && !isBatchAlertDrawerOpen && (
        <UrgentNotificationToast
          alerts={criticalToastPopUpAlerts}
          onClose={() => setShowBatchToast(false)}
          onOpenExecutiveModal={(alert) => setActiveExecutiveUrgentModal(alert)}
          onOpenDraftStatement={(alert) => {
            if (alert.article) handleOpenDraftStatement(alert.article);
          }}
          onOpenAlertsModal={() => setIsBatchAlertDrawerOpen(true)}
          onOpenInterventionModal={(article) => {
            setCmsTab('dashboard');
            if (article?.id) handleScrollToAlertArticle(article.id);
          }}
        />
      )}

    </div>
  );
}
