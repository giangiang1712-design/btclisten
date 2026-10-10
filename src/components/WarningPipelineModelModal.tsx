import React, { useState, useMemo } from 'react';
import { ScrapedNewsItem, WarningPipelineModel, WarningAlertLevelType, LoughranMcDonaldSentimentAnalysis, MOF_34_AGENCIES_DECREE_376, MofAgencyDecree376 } from '../types';
import { generateWarningPipelineModel, FEW_SHOT_TEST_CASES, FewShotTestCaseItem } from '../lib/warningPipelineEngine';
import { DECREE_376_100_SCENARIOS, Decree376ScenarioItem, Decree376AlertTier } from '../lib/decree376Handbook100Scenarios';
import { evaluateLoughranMcDonaldSentiment } from '../lib/newsClassification';
import { EARLY_WARNING_7_ACTIONS } from '../lib/alertTriggers';
import { useTheme } from '../lib/theme';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building2,
  Building,
  Copy,
  Check,
  Zap,
  Flame,
  Activity,
  Send,
  Mail,
  FileCheck2,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  Target,
  FileText,
  Calculator,
  Code2,
  FlaskConical,
  Sparkles,
  GitCompare,
  BookOpen,
  ClipboardCheck,
  Search,
  ExternalLink,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { WarningAuditLogTab } from './WarningAuditLogTab';

interface WarningPipelineModelModalProps {
  item: ScrapedNewsItem | null;
  allNews?: ScrapedNewsItem[];
  onClose: () => void;
  onGmailAlert?: (item: ScrapedNewsItem) => void;
  onDraftStatement?: (item: ScrapedNewsItem) => void;
  onPolicySubmission?: (item: ScrapedNewsItem) => void;
  onOverrideArticle?: (item: ScrapedNewsItem) => void;
}

function convertDecreeScenarioToNewsItem(sc: Decree376ScenarioItem): ScrapedNewsItem {
  return {
    id: `decree376-${sc.id}`,
    title: sc.title,
    url: 'https://mof.gov.vn',
    source: sc.pressSources?.[0] || 'Cổng Thông Tin Bộ Tài Chính',
    publishedAt: new Date().toISOString(),
    timeAgo: 'Vừa phát hiện',
    sector: 'policy',
    sectorNameVi: 'Thể chế & Chính sách Tài chính',
    summary: sc.realArticleTitle || sc.classificationReason,
    keyPoints: sc.matchingKeywords,
    sixW: {
      who: sc.decree376Basis.leadAgencyName,
      doingWhat: sc.title,
      aboutWhat: sc.decree376Basis.clauseArticle,
      resultOutcome: sc.classificationReason,
      whoIsAffected: 'Cộng đồng doanh nghiệp và người nộp thuế',
      reaction: sc.tier === 3 ? 'Bức xúc, đề nghị xử lý khẩn cấp' : 'Theo dõi hướng dẫn nghiệp vụ'
    },
    sentiment: sc.tier === 0 ? 'neutral' : (sc.tier === 3 ? 'bearish' : 'neutral'),
    sentimentScore: sc.tier === 0 ? 0 : (sc.tier === 3 ? -85 : (sc.tier === 2 ? -50 : -20)),
    sentimentReason: sc.classificationReason,
    impactLevel: sc.tier === 3 ? 'high' : (sc.tier === 2 ? 'medium' : 'low'),
    marketImplication: sc.natureOfInformationVacuum || sc.classificationReason,
    tickers: [],
    buzzScore: sc.tier === 3 ? 90 : (sc.tier === 2 ? 65 : 30),
    velocityStatus: sc.tier === 3 ? 'spike' : (sc.tier === 2 ? 'accelerating' : 'normal'),
    agencies: [sc.decree376Basis.leadAgencyName],
    isEmergency: sc.tier === 3,
    decree376Tier: sc.tier,
    decree376ScenarioCode: sc.scenarioCode,
    decree376Clause: sc.decree376Basis.clauseArticle,
    decree376Reason: sc.classificationReason,
    leadUnit: sc.decree376Basis.leadAgencyName,
    cooperatingUnits: sc.decree376Basis.cooperatingUnits,
    riskScore: sc.calibratedScores.riskScore,
  };
}

export const WarningPipelineModelModal: React.FC<WarningPipelineModelModalProps> = ({
  item,
  allNews = [],
  onClose,
  onGmailAlert,
  onDraftStatement,
  onPolicySubmission,
  onOverrideArticle,
}) => {
  const { isDark } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showTechnicalAudit, setShowTechnicalAudit] = useState(false);
  const [activeTab, setActiveTab] = useState<'dossier' | 'formula' | 'loughran' | 'json' | 'fewshot' | 'audit' | 'agencies376'>('dossier');
  const [agencySearchQuery, setAgencySearchQuery] = useState('');
  const [selectedTestCaseItem, setSelectedTestCaseItem] = useState<ScrapedNewsItem | null>(null);
  const [fewshotTierFilter, setFewshotTierFilter] = useState<'ALL' | 0 | 1 | 2 | 3>('ALL');
  const [fewshotSearchQuery, setFewshotSearchQuery] = useState('');
  const [selectedScenarioDetail, setSelectedScenarioDetail] = useState<Decree376ScenarioItem | null>(null);

  if (!item) return null;

  const currentItem = selectedTestCaseItem || item;
  const model: WarningPipelineModel = currentItem.warningPipeline || generateWarningPipelineModel(currentItem);
  const loughranData: LoughranMcDonaldSentimentAnalysis = currentItem.loughranSentiment || evaluateLoughranMcDonaldSentiment(currentItem);

  const handleCopyBrief = () => {
    const fullBriefText = `[BÁO CÁO CẢNH BÁO TRUYỀN THÔNG BỘ TÀI CHÍNH]\n` +
      `Tiêu đề: ${currentItem.title}\n` +
      `Cấp độ: ${model.level3Action.alertLevelBadge} (${model.level3Action.alertLevelLabelVi})\n` +
      `Thời hạn tác chiến: ${model.level3Action.urgencyTiming}\n` +
      `Đơn vị chủ trì: ${model.level3Action.leadUnit}\n` +
      `Khả năng khủng hoảng: ${model.level2Risk.crisisPotential} (Điểm rủi ro: ${model.level2Risk.riskScore}/100)\n\n` +
      `TÓM TẮT ĐIỀU HÀNH:\n${model.executiveBrief}\n\n` +
      `HÀNH ĐỘNG TÁC CHIẾN:\n` +
      model.level3Action.actionPlaybook.map((p) => `${p.phase}:\n- ${p.actions.join('\n- ')}`).join('\n\n') +
      `\n\nKỊCH BẢN DỰ PHÒNG:\n${model.level3Action.contingencyScenario}`;

    navigator.clipboard.writeText(fullBriefText);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2500);
  };

  const handleCopyJson = () => {
    if (model.standardizedJsonOutput) {
      navigator.clipboard.writeText(JSON.stringify(model.standardizedJsonOutput, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2500);
    }
  };

  const getAlertLevelTheme = (level: WarningAlertLevelType) => {
    switch (level) {
      case 'EMERGENCY':
        return {
          banner: isDark ? 'bg-gradient-to-r from-rose-950 via-rose-900/60 to-slate-900 border-rose-500/60 text-rose-100' : 'bg-gradient-to-r from-rose-50 via-rose-100/70 to-white border-rose-300 text-rose-950',
          badge: 'bg-rose-600 text-white shadow-rose-600/30 ring-2 ring-rose-400/50',
          accent: 'text-rose-500',
          border: isDark ? 'border-rose-500/40' : 'border-rose-200',
          pillBg: isDark ? 'bg-rose-500/15 text-rose-300' : 'bg-rose-100 text-rose-800'
        };
      case 'RAPID':
        return {
          banner: isDark ? 'bg-gradient-to-r from-amber-950 via-amber-900/60 to-slate-900 border-amber-500/60 text-amber-100' : 'bg-gradient-to-r from-amber-50 via-amber-100/70 to-white border-amber-300 text-amber-950',
          badge: 'bg-amber-600 text-white shadow-amber-600/30 ring-2 ring-amber-400/50',
          accent: 'text-amber-500',
          border: isDark ? 'border-amber-500/40' : 'border-amber-200',
          pillBg: isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-800'
        };
      case 'EARLY':
        return {
          banner: isDark ? 'bg-gradient-to-r from-orange-950 via-orange-900/60 to-slate-900 border-orange-500/50 text-orange-100' : 'bg-gradient-to-r from-orange-50 via-orange-100/70 to-white border-orange-300 text-orange-950',
          badge: 'bg-orange-500 text-white shadow-orange-500/30',
          accent: 'text-orange-500',
          border: isDark ? 'border-orange-500/40' : 'border-orange-200',
          pillBg: isDark ? 'bg-orange-500/15 text-orange-300' : 'bg-orange-100 text-orange-800'
        };
      case 'DISTANT':
        return {
          banner: isDark ? 'bg-gradient-to-r from-indigo-950 via-indigo-900/60 to-slate-900 border-indigo-500/50 text-indigo-100' : 'bg-gradient-to-r from-indigo-50 via-indigo-100/70 to-white border-indigo-300 text-indigo-950',
          badge: 'bg-indigo-600 text-white shadow-indigo-600/30',
          accent: 'text-indigo-400',
          border: isDark ? 'border-indigo-500/40' : 'border-indigo-200',
          pillBg: isDark ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-100 text-indigo-800'
        };
      case 'MARKET_DIGEST':
        return {
          banner: isDark ? 'bg-slate-900/90 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800',
          badge: 'bg-slate-500 text-white shadow-slate-500/20',
          accent: 'text-slate-400',
          border: isDark ? 'border-slate-800' : 'border-slate-200',
          pillBg: isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
        };
      case 'STANDARD':
      default:
        return {
          banner: isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900',
          badge: 'bg-slate-600 text-white',
          accent: 'text-slate-400',
          border: isDark ? 'border-slate-800' : 'border-slate-200',
          pillBg: isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
        };
    }
  };

  const theme = getAlertLevelTheme(model.level3Action.alertLevel);
  const formula = model.formulaMetrics || {
    S: 25,
    D: 0,
    V: 0.5,
    I: 0.5,
    rawRiskScore: model.level2Risk.riskScore,
    calculationFormula: `min(100, (0.7 * S + 0.3 * D) * (1 + 0.3 * V + 0.4 * I))`
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150 ${
      isFullscreen ? 'p-0' : ''
    }`}>
      <div
        className={`relative transition-all duration-200 border flex flex-col overflow-hidden ${
          isFullscreen
            ? 'fixed inset-0 w-full h-full max-w-none max-h-none rounded-none m-0 z-50 border-0 shadow-none'
            : 'w-full max-w-7xl my-auto rounded-2xl sm:rounded-3xl shadow-2xl max-h-[95vh]'
        } ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* TOP EXECUTIVE HEADER */}
        <div
          className={`p-4 sm:p-5 border-b shrink-0 select-none ${theme.banner}`}
          onDoubleClick={() => setIsFullscreen(!isFullscreen)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-md flex items-center gap-1.5 ${theme.badge}`}>
                  {model.level3Action.alertLevel === 'EMERGENCY' && <Flame className="w-3.5 h-3.5 animate-pulse" />}
                  {model.level3Action.alertLevel === 'RAPID' && <Zap className="w-3.5 h-3.5" />}
                  {model.level3Action.alertLevel === 'EARLY' && <AlertTriangle className="w-3.5 h-3.5" />}
                  {model.level3Action.alertLevel === 'DISTANT' && <Activity className="w-3.5 h-3.5" />}
                  <span>{model.level3Action.alertLevelBadge}</span>
                </span>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isDark ? 'bg-slate-950/60 text-slate-200 border-slate-700' : 'bg-white/90 text-slate-800 border-slate-300'
                }`}>
                  {currentItem.sectorNameVi || 'Lĩnh vực Quản lý'}
                </span>

                <span className="text-xs opacity-80 font-semibold">
                  Nguồn: {currentItem.source || 'Báo chí chính thống'}
                </span>

                {selectedTestCaseItem && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-600 text-white flex items-center gap-1">
                    <FlaskConical className="w-3 h-3" />
                    Kịch Bản Mẫu
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-black leading-snug tracking-tight">
                {currentItem.title}
              </h2>
            </div>

            {/* Header buttons: Maximize / Minimize + Close */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isDark
                    ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                }`}
                title={isFullscreen ? 'Thu nhỏ về kích thước chuẩn' : 'Mở rộng toàn bộ màn hình (Full Screen)'}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold hidden sm:inline text-amber-400">Thu nhỏ</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4" />
                    <span className="text-xs font-bold hidden sm:inline">Toàn màn hình</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className={`p-2 rounded-xl border transition cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                }`}
                title="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Key Executive Decision Metrics (Horizontal Bar) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-3 border-t border-black/10 dark:border-white/10 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 opacity-70 shrink-0" />
              <span>Thời hạn: <strong className="font-bold">{model.level3Action.urgencyTiming.split('•')[0] || model.level3Action.urgencyTiming}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 opacity-70 shrink-0" />
              <span className="truncate">Chủ trì: <strong className="font-bold">{model.level3Action.leadUnit}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 opacity-70 shrink-0" />
              <span>Rủi ro: <strong className="font-bold">{model.level2Risk.crisisPotential} ({model.level2Risk.riskScore}đ)</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 opacity-70 shrink-0" />
              <span>Sắc thái: <strong className="font-bold">{model.level1Sentiment.sentimentDirection}</strong></span>
            </div>
          </div>
        </div>

        {/* MODAL TABS NAVIGATION */}
        <div className={`px-4 py-2 border-b flex items-center justify-between gap-2 shrink-0 flex-wrap ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              onClick={() => setActiveTab('dossier')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'dossier'
                  ? (isDark ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-600 text-white shadow-xs')
                  : (isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-50')
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Hồ Sơ Điều Hành (3 Tầng)</span>
            </button>

            <button
              onClick={() => setActiveTab('formula')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'formula'
                  ? (isDark ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-600 text-white shadow-xs')
                  : (isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-50')
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Lượng Hóa Rủi Ro (Formula S-D-V-I)</span>
              {model.narrativeDivergence?.detected && (
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('loughran')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'loughran'
                  ? (isDark ? 'bg-cyan-600 text-white shadow-xs' : 'bg-cyan-600 text-white shadow-xs')
                  : (isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-50')
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Khung Sắc Thái Tài Chính (Loughran-McDonald 4 Tầng)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                loughranData.scoreS < 0 ? 'bg-rose-500/30 text-rose-300' : loughranData.scoreS > 0 ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-700 text-slate-300'
              }`}>
                S={loughranData.scoreS > 0 ? `+${loughranData.scoreS}` : loughranData.scoreS}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'json'
                  ? (isDark ? 'bg-indigo-600 text-white shadow-xs' : 'bg-indigo-600 text-white shadow-xs')
                  : (isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-50')
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>JSON Schema Chuẩn (Vibe Coding)</span>
            </button>

            <button
              onClick={() => setActiveTab('fewshot')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'fewshot'
                  ? (isDark ? 'bg-purple-600 text-white shadow-xs' : 'bg-purple-600 text-white shadow-xs')
                  : (isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-50')
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>100 Tình Huống Chuẩn (NĐ 376)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                100
              </span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'audit'
                  ? (isDark ? 'bg-indigo-600 text-white shadow-xs' : 'bg-indigo-600 text-white shadow-xs')
                  : (isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-50')
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Audit Log (Kiểm Toán & Ngưỡng)</span>
            </button>

            <button
              onClick={() => setActiveTab('agencies376')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'agencies376'
                  ? (isDark ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-600 text-white shadow-xs')
                  : (isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-50')
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>34 Đơn Vị (Nghị Định 376)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'json' ? (
              <button
                onClick={handleCopyJson}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold shrink-0 flex items-center gap-1 transition cursor-pointer ${
                  isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                {copiedJson ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Đã chép JSON</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Chép JSON Schema</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleCopyBrief}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold shrink-0 flex items-center gap-1 transition cursor-pointer ${
                  isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                {copiedBrief ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Chép chỉ đạo</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'dossier' && (
            <>
              {/* 1. TÓM TẮT ĐIỀU HÀNH CHỈ ĐẠO (EXECUTIVE BRIEF) */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-black text-xs uppercase tracking-wider text-slate-400">
                      Tóm Tắt Tình Hình & Định Hướng Điều Hành Lãnh Đạo
                    </h3>
                  </div>
                  {model.narrativeDivergence?.detected && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                      <GitCompare className="w-3 h-3" />
                      Phát hiện độ vênh chỉ đạo - thực tiễn
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                  {model.executiveBrief}
                </p>
              </div>

              {/* 1.05 ĐỐI SOÁT CHUẨN NGHỊ ĐỊNH 376/2026/NĐ-CP (100 TÌNH HUỐNG THỰC CHIẾN) */}
              {(model.decree376Audit || currentItem.decree376Tier !== undefined) && (
                <div className={`p-4 rounded-2xl border transition ${
                  (model.decree376Audit?.tier === 3 || currentItem.decree376Tier === 3)
                    ? (isDark ? 'bg-gradient-to-r from-rose-950/70 via-slate-900 to-rose-950/40 border-rose-500/60 shadow-lg' : 'bg-rose-50/80 border-rose-300 shadow-xs')
                    : (model.decree376Audit?.tier === 2 || currentItem.decree376Tier === 2)
                    ? (isDark ? 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/40 border-amber-500/60 shadow-md' : 'bg-amber-50/80 border-amber-300 shadow-xs')
                    : (model.decree376Audit?.tier === 1 || currentItem.decree376Tier === 1)
                    ? (isDark ? 'bg-gradient-to-r from-blue-950/70 via-slate-900 to-blue-950/40 border-blue-500/60' : 'bg-blue-50/80 border-blue-300')
                    : (isDark ? 'bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border-emerald-500/50' : 'bg-emerald-50/80 border-emerald-300')
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 mb-3 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-lg ${
                        (model.decree376Audit?.tier === 3 || currentItem.decree376Tier === 3)
                          ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40'
                          : (model.decree376Audit?.tier === 2 || currentItem.decree376Tier === 2)
                          ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40'
                          : (model.decree376Audit?.tier === 1 || currentItem.decree376Tier === 1)
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        <Building className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                            Chuẩn Hóa Theo Nghị Định Số 376/2026/NĐ-CP
                          </h4>
                          {model.decree376Audit?.scenarioCode && (
                            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              MÃ ĐỐI SOÁT: {model.decree376Audit.scenarioCode}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Bộ tiêu chí nhận diện khoảng trống & phân cấp cảnh báo 4 cấp độ (Cẩm nang 100 tình huống báo chí)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                        (model.decree376Audit?.tier === 3 || currentItem.decree376Tier === 3)
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 ring-1 ring-rose-500/30'
                          : (model.decree376Audit?.tier === 2 || currentItem.decree376Tier === 2)
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : (model.decree376Audit?.tier === 1 || currentItem.decree376Tier === 1)
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      }`}>
                        {model.decree376Audit?.tierLabelVi || (
                          currentItem.decree376Tier === 3 ? 'Mức 3: Cảnh báo gấp / SOP Cấp 4 (Khẩn cấp)' :
                          currentItem.decree376Tier === 2 ? 'Mức 2: Cảnh báo sớm (Ách tắc / Thiệt hại)' :
                          currentItem.decree376Tier === 1 ? 'Mức 1: Cần lưu tâm (Hỏi đáp quy trình)' :
                          'Mức 0: Loại trừ / Không cảnh báo'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[11px]">
                          Căn cứ pháp lý theo Nghị định 376:
                        </span>
                        <p className="text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
                          {model.decree376Audit?.decreeClause || currentItem.decree376Clause || 'Căn cứ chức năng, nhiệm vụ quản lý nhà nước tại Nghị định 376/2026/NĐ-CP'}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900/40 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-semibold">Đơn vị chủ trì (1 trong 34 đơn vị):</span>
                          <strong className="text-indigo-400 font-bold">
                            {model.decree376Audit?.leadAgency || currentItem.leadUnit || model.level3Action.leadUnit}
                          </strong>
                        </div>
                        {((model.decree376Audit?.cooperatingAgencies && model.decree376Audit.cooperatingAgencies.length > 0) || (currentItem.cooperatingUnits && currentItem.cooperatingUnits.length > 0)) && (
                          <div className="text-[11px] pt-1 border-t border-slate-800 text-slate-400">
                            <span className="font-semibold">Đơn vị phối hợp: </span>
                            <span>{(model.decree376Audit?.cooperatingAgencies || currentItem.cooperatingUnits || []).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[11px]">
                          Kịch bản hành động chuẩn hóa:
                        </span>
                        <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                          {model.decree376Audit?.actionScript || currentItem.decree376Reason || 'Chủ động rà soát, nắm bắt thông tin và cung cấp hướng dẫn nghiệp vụ thống nhất.'}
                        </p>
                      </div>

                      {model.decree376Audit?.emergencyPlaybook && (
                        <div className="p-2.5 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-200 space-y-1 text-[11px]">
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1 text-rose-300">
                              <Zap className="w-3.5 h-3.5" />
                              Khung Giờ Vàng (Golden Hour):
                            </span>
                            <span className="px-2 py-0.2 rounded font-mono bg-rose-500/20 border border-rose-500/40 text-rose-200 font-bold">
                              {model.decree376Audit.emergencyPlaybook.goldenHourTiming}
                            </span>
                          </div>
                          <p className="text-slate-300 text-[10.5px] leading-relaxed">
                            <strong>Thông điệp: </strong>{model.decree376Audit.emergencyPlaybook.keyMessage}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 1.1 BỘ LỌC KHOẢNG TRỐNG THÔNG TIN (INFORMATION VACUUM GATEKEEPER) */}
              {model.informationVacuum && (
                <div className={`p-4 rounded-2xl border transition ${
                  model.informationVacuum.gapLevel === 'GAP_EMERGENCY_ALERT'
                    ? (isDark ? 'bg-rose-950/40 border-rose-500/50' : 'bg-rose-50 border-rose-300')
                    : model.informationVacuum.gapLevel === 'GAP_RAPID_ALERT'
                    ? (isDark ? 'bg-amber-950/40 border-amber-500/50' : 'bg-amber-50 border-amber-300')
                    : model.informationVacuum.gapLevel === 'GAP_EARLY_ALERT'
                    ? (isDark ? 'bg-orange-950/40 border-orange-500/50' : 'bg-orange-50 border-orange-300')
                    : model.informationVacuum.gapLevel === 'GAP_DISTANT_ALERT'
                    ? (isDark ? 'bg-indigo-950/40 border-indigo-500/50' : 'bg-indigo-50 border-indigo-300')
                    : model.informationVacuum.gapLevel === 'MONITORING_NO_ALERT'
                    ? (isDark ? 'bg-cyan-950/40 border-cyan-500/50' : 'bg-cyan-50 border-cyan-300')
                    : (isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200')
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 mb-3 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-lg ${
                        model.informationVacuum.isAlertWarranted
                          ? 'bg-rose-500/20 text-rose-400'
                          : model.informationVacuum.hasGap
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        <Target className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <span>Bộ Lọc Khoảng Trống Thông Tin (Information Vacuum)</span>
                        </h4>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Nguyên tắc: Tin chỉ cảnh báo khi xuất hiện khoảng trống thông tin đạt ngưỡng rủi ro
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                        model.informationVacuum.isAlertWarranted
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : model.informationVacuum.hasGap
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {model.informationVacuum.gapLevelLabelVi}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1.5">
                      <div className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                        <span>Bản chất khoảng trống:</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                        {model.informationVacuum.gapDetails}
                      </p>
                      {model.informationVacuum.whyNoAlertYet && (
                        <div className={`p-2 rounded-xl text-xs mt-2 border ${
                          isDark ? 'bg-cyan-900/30 border-cyan-500/30 text-cyan-200' : 'bg-cyan-100/70 border-cyan-300 text-cyan-900'
                        }`}>
                          <strong className="block mb-0.5">Lý do chưa đến mức cảnh báo:</strong>
                          <span>{model.informationVacuum.whyNoAlertYet}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                        <span>Hành động bồi đắp / lấp đầy khoảng trống:</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                        {model.informationVacuum.recommendedClosureAction}
                      </p>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                        <strong>Nguy cơ hiểu sai:</strong> {model.informationVacuum.publicConfusionRisk}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. KHUNG 2 CỘT: MỨC 1 (SENTIMENT & BỐI CẢNH) + MỨC 2 (ĐÁNH GIÁ NGUY CƠ RỦI RO) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* CỘT TRÁI: MỨC ĐỘ 1 - SẮC THÁI & BỐI CẢNH (5 THÀNH TỐ) */}
                <div className={`p-4 rounded-2xl border space-y-3.5 ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Activity className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 dark:text-slate-200">
                          Tầng 1: Sắc Thái & Bối Cảnh (Sentiment)
                        </h4>
                        <span className="text-[10px] text-slate-400">5 thành tố bóc tách bản chất thông tin</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                      {model.level1Sentiment.sentimentDirection}
                    </span>
                  </div>

                  {/* Cảnh báo rủi ro ẩn sau tiêu đề trung tính */}
                  {model.level1Sentiment.hasHiddenRiskBehindNeutralTitle && (
                    <div className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                      isDark ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'
                    }`}>
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Cảnh báo rủi ro ngầm:</strong>
                        <span>Tiêu đề trung tính/kỹ thuật nhưng bối cảnh thực tiễn tác động lớn đến xã hội/doanh nghiệp, tiềm ẩn phản biện chính sách.</span>
                      </div>
                    </div>
                  )}

                  {/* 5 Thành tố bóc tách */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-indigo-400 min-w-[75px] shrink-0">1. Ngôn ngữ:</span>
                      <span className="text-slate-300 dark:text-slate-300 leading-relaxed">{model.level1Sentiment.criteria.language}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-indigo-400 min-w-[75px] shrink-0">2. Bối cảnh:</span>
                      <span className="text-slate-300 dark:text-slate-300 leading-relaxed">{model.level1Sentiment.criteria.context}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-indigo-400 min-w-[75px] shrink-0">3. Đối tượng:</span>
                      <span className="text-slate-300 dark:text-slate-300 leading-relaxed">{model.level1Sentiment.criteria.targetEntity}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-indigo-400 min-w-[75px] shrink-0">4. Hệ quả:</span>
                      <span className="text-slate-300 dark:text-slate-300 leading-relaxed">{model.level1Sentiment.criteria.consequence}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-indigo-400 min-w-[75px] shrink-0">5. Sắc thái:</span>
                      <span className="text-slate-300 dark:text-slate-300 leading-relaxed">{model.level1Sentiment.criteria.sentimentNuance}</span>
                    </div>
                  </div>
                </div>

                {/* CỘT PHẢI: MỨC ĐỘ 2 - ĐÁNH GIÁ NGUY CƠ KHỦNG HOẢNG THỂ CHẾ */}
                <div className={`p-4 rounded-2xl border space-y-3.5 ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 dark:text-slate-200">
                          Tầng 2: Rủi Ro Khủng Hoảng Thể Chế (Risk)
                        </h4>
                        <span className="text-[10px] text-slate-400">4 thuộc tính đe dọa uy tín và điều hành</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                      model.level2Risk.crisisPotential === 'RẤT CAO'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : model.level2Risk.crisisPotential === 'CAO'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {model.level2Risk.crisisPotential} ({model.level2Risk.riskScore}/100đ)
                    </span>
                  </div>

                  {/* 4 Tiêu chí Rủi ro */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* 1. Tổn hại uy tín */}
                    <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                      model.level2Risk.criteria.reputationDamage.hasRisk
                        ? (isDark ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50 border-rose-200')
                        : (isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200')
                    }`}>
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-amber-400">1. Tổn hại uy tín</span>
                        <span className={model.level2Risk.criteria.reputationDamage.hasRisk ? 'text-rose-400' : 'text-emerald-400'}>
                          {model.level2Risk.criteria.reputationDamage.score}%
                        </span>
                      </div>
                      <p className="text-slate-300 dark:text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                        {model.level2Risk.criteria.reputationDamage.analysis}
                      </p>
                    </div>

                    {/* 2. Quy kết trách nhiệm */}
                    <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                      model.level2Risk.criteria.blameAttribution.hasRisk
                        ? (isDark ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50 border-rose-200')
                        : (isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200')
                    }`}>
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-amber-400">2. Quy kết trách nhiệm</span>
                        <span className={model.level2Risk.criteria.blameAttribution.hasRisk ? 'text-rose-400' : 'text-emerald-400'}>
                          {model.level2Risk.criteria.blameAttribution.score}%
                        </span>
                      </div>
                      <p className="text-slate-300 dark:text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                        {model.level2Risk.criteria.blameAttribution.analysis}
                      </p>
                    </div>

                    {/* 3. Kiến nghị Bộ thực hiện */}
                    <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                      model.level2Risk.criteria.policyPetitions.hasRisk
                        ? (isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50 border-amber-200')
                        : (isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200')
                    }`}>
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-amber-400">3. Kiến nghị phát sinh</span>
                        <span className={model.level2Risk.criteria.policyPetitions.hasRisk ? 'text-amber-400' : 'text-emerald-400'}>
                          {model.level2Risk.criteria.policyPetitions.score}%
                        </span>
                      </div>
                      <p className="text-slate-300 dark:text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                        {model.level2Risk.criteria.policyPetitions.analysis}
                      </p>
                    </div>

                    {/* 4. Tác động DN & Đầu tư */}
                    <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                      model.level2Risk.criteria.investorBizImpact.hasRisk
                        ? (isDark ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50 border-rose-200')
                        : (isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200')
                    }`}>
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-amber-400">4. Tác động DN/Đầu tư</span>
                        <span className={model.level2Risk.criteria.investorBizImpact.hasRisk ? 'text-rose-400' : 'text-emerald-400'}>
                          {model.level2Risk.criteria.investorBizImpact.score}%
                        </span>
                      </div>
                      <p className="text-slate-300 dark:text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                        {model.level2Risk.criteria.investorBizImpact.analysis}
                      </p>
                    </div>
                  </div>

                  {/* Tóm tắt lượng hóa */}
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800 font-mono">
                    {model.level2Risk.overallRiskSummary}
                  </div>
                </div>
              </div>

              {/* 3. MỨC ĐỘ 3: PHƯƠNG ÁN TÁC CHIẾN CỤ THỂ (ACTION PLAYBOOK & CONTINGENCY) */}
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <FileCheck2 className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 dark:text-slate-200">
                        Tầng 3: Kế Hoạch Hành Động Tác Chiến (Action Playbook)
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        Chủ trì: <strong className="text-emerald-400">{model.level3Action.leadUnit}</strong> • Thời hạn: <strong className="text-amber-400">{model.level3Action.urgencyTiming}</strong>
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${theme.badge}`}>
                    {model.level3Action.alertLevelBadge}
                  </span>
                </div>

                {/* SPECIAL HIGHLIGHT FOR EARLY WARNING (40–59) */}
                {model.level3Action.alertLevel === 'EARLY' && (
                  <div className="p-3.5 rounded-xl border border-orange-500/40 bg-orange-950/30 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-orange-600 text-white">
                          ⭐ CẤP QUAN TRỌNG NHẤT HỆ THỐNG
                        </span>
                        <span className="text-xs font-bold text-orange-300">
                          7 Hành Động Tác Chiến Chuẩn Mực (Early Warning 24h SOP)
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-300 font-mono">
                        Thời hạn xử lý: 24h
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-orange-500/20 text-xs italic text-orange-200 leading-relaxed">
                      “Đây là cấp quan trọng nhất đối với hệ thống: <strong>«Nếu không xử lý, chuyện này có thể trở thành vấn đề.»</strong>”
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                      {EARLY_WARNING_7_ACTIONS.map((act) => (
                        <div
                          key={act.id}
                          className="p-2 rounded-lg border border-slate-800 bg-slate-900/90 space-y-0.5"
                        >
                          <div className="text-xs font-black text-orange-300 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px] font-bold">
                              {act.order}
                            </span>
                            <span>{act.label.split('. ')[1] || act.label}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug">
                            {act.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Các pha tác chiến cụ thể */}
                <div className="space-y-2.5">
                  {model.level3Action.actionPlaybook.map((stage, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border space-y-1.5 ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{stage.phase}</span>
                      </div>
                      <ul className="space-y-1 pl-4">
                        {stage.actions.map((act, aIdx) => (
                          <li key={aIdx} className="text-xs text-slate-300 dark:text-slate-300 list-disc leading-relaxed">
                            {act}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Kịch bản dự phòng khi leo thang */}
                <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                  isDark ? 'bg-rose-950/20 border-rose-500/30 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="font-bold flex items-center gap-1.5 text-rose-400">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Kịch bản Dự phòng nếu Tình hình Leo thang:</span>
                  </div>
                  <p className="leading-relaxed pl-5 text-[11px]">
                    {model.level3Action.contingencyScenario}
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'formula' && (
            <div className="space-y-5">
              {/* CÔNG THỨC LƯỢNG HÓA TOÁN HỌC */}
              <div className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-amber-400">
                      Mô Hình Lượng Hóa Điểm Số Rủi Ro (Quantified Crisis Risk Model)
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Điểm số cuối: {model.level2Risk.riskScore}/100đ
                  </span>
                </div>

                {/* Khung công thức */}
                <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 text-center font-mono text-sm sm:text-base text-amber-200 shadow-inner">
                  Risk_Score = min(100, (0.7 × S + 0.3 × D) × (1 + 0.3 × V + 0.4 × I))
                </div>

                {/* Diễn giải chi tiết từng biến số */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/90 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>S (Severity):</span>
                      <strong className="text-emerald-400 font-mono text-sm">{formula.S}/50</strong>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Mức độ đe dọa thể chế & uy tín (0–50).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/90 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>D (Divergence):</span>
                      <strong className="text-rose-400 font-mono text-sm">{formula.D}/20</strong>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Độ vênh chỉ đạo và thực tiễn (0–20).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/90 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>V (Velocity):</span>
                      <strong className="text-indigo-400 font-mono text-sm">{formula.V}</strong>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Tốc độ lan truyền & cross-platform (0.0–1.0).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/90 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>I (Impact):</span>
                      <strong className="text-purple-400 font-mono text-sm">{formula.I}</strong>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Quy mô đối tượng chịu tác động (0.0–1.0).
                    </p>
                  </div>
                </div>

                {/* Phép tính thực thi */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
                  <div className="font-bold text-amber-300">Các bước thực thi tính toán:</div>
                  <div>1. Trọng số cơ sở (Base Weight) = (0.7 × {formula.S}) + (0.3 × {formula.D}) = {(0.7 * formula.S + 0.3 * formula.D).toFixed(1)}</div>
                  <div>2. Hệ số nhân (Multiplier) = 1 + (0.3 × {formula.V}) + (0.4 × {formula.I}) = {(1 + 0.3 * formula.V + 0.4 * formula.I).toFixed(2)}</div>
                  <div>3. Điểm rủi ro = min(100, round({(0.7 * formula.S + 0.3 * formula.D).toFixed(1)} × {(1 + 0.3 * formula.V + 0.4 * formula.I).toFixed(2)})) = <strong className="text-amber-400">{model.level2Risk.riskScore} điểm</strong></div>
                </div>
              </div>

              {/* BANNER PHÁT HIỆN ĐỘ VÊNH CHỈ ĐẠO - THỰC TIỄN */}
              <div className={`p-4 rounded-2xl border ${
                model.narrativeDivergence?.detected
                  ? (isDark ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-950')
                  : (isDark ? 'bg-slate-950/50 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700')
              }`}>
                <div className="flex items-center gap-2 mb-2 font-bold text-xs uppercase tracking-wider">
                  <GitCompare className="w-4 h-4 text-rose-400" />
                  <span>Trạng Thái Độ Vênh Chỉ Đạo và Thực Tiễn (Narrative-Reality Divergence)</span>
                </div>
                {model.narrativeDivergence?.detected ? (
                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-rose-300">
                      {model.narrativeDivergence.details}
                    </p>
                    <p className="text-[11px] opacity-80">
                      Hệ thống tự động nâng hệ số D lên {formula.D}/20 do phát sinh mâu thuẫn giữa thông điệp quyết tâm của cơ quan quản lý và các phản ánh vướng mắc tại địa phương/cộng đồng doanh nghiệp.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs">
                    Không phát hiện độ vênh nghiêm trọng giữa chỉ đạo và số liệu thực thi thực tế trong bài viết này.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB: KHUNG PHÂN TÍCH SẮC THÁI CHUYÊN NGÀNH TÀI CHÍNH (LOUGHRAN-MCDONALD 4 TẦNG LOGIC) */}
          {activeTab === 'loughran' && (
            <div className="space-y-4">
              {/* Header Khung Lý Thuyết & Tóm Tắt */}
              <div className={`p-5 rounded-2xl border space-y-3.5 ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-cyan-500" />
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-cyan-400">
                        Khung Tham Số Phân Tích Đa Chiều & Mô Hình Toán Định Lượng Rủi Ro
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Phương pháp luận Loughran & McDonald: Khắc phục Semantic Mismatch trong văn bản tài chính công
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      Điểm Sắc Thái: {loughranData.scoreS > 0 ? `+${loughranData.scoreS}` : loughranData.scoreS} / [-5; +5]
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Risk_Score: {loughranData.sentimentRiskImpact}/100đ
                    </span>
                  </div>
                </div>

                {/* Công thức toán học định lượng rủi ro theo Loughran-McDonald */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 font-mono text-xs sm:text-sm text-cyan-200 space-y-1.5 shadow-inner">
                  <div className="text-center font-bold text-cyan-300">
                    Risk_Score = min(100, |S| × E × V × 4)
                  </div>
                  <div className="text-[11px] text-slate-400 text-center">
                    (Khi S ≥ 0 (trung tính hoặc tích cực): Risk_Score = 0. Khi S &lt; 0: tính toán theo tích số 4 tham số)
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 flex items-center justify-around flex-wrap gap-2">
                    <span>|S| = <strong className="text-amber-300">{loughranData.scoreS < 0 ? Math.abs(loughranData.scoreS) : 0}</strong></span>
                    <span>× E = <strong className="text-emerald-300">{loughranData.targetEntity.weightE}</strong></span>
                    <span>× V = <strong className="text-indigo-300">{loughranData.velocityVector.V}</strong></span>
                    <span>× 4 = <strong className="text-rose-400 font-bold">{loughranData.sentimentRiskImpact} điểm</strong></span>
                  </div>
                </div>

                {/* Khối Tóm tắt Điều hành (Executive Brief) */}
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 leading-relaxed">
                  <strong>Tóm tắt điều hành: </strong>{loughranData.executiveBrief}
                </div>
              </div>

              {/* MA TRẬN BỐN TẦNG LOGIC PHỤ THUỘC (THE 4-LAYER MATRIX) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Tầng 1: Định danh Chủ thể Phát ngôn (The Voice Source) */}
                <div className={`p-4 rounded-2xl border space-y-2.5 ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-black">1</span>
                      Tầng 1: Chủ Thể Phát Ngôn
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {loughranData.voiceSource.sourceType}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-200">
                      {loughranData.voiceSource.sourceTypeLabelVi}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {loughranData.voiceSource.isEnforcementOrGovernance
                        ? 'Phát ngôn từ Cơ quan quản lý về thanh tra, kiểm tra, kỷ cương pháp luật: Mặc định là Trung tính hoặc Tích cực vì thể hiện sự chủ động điều hành, không gán tiêu cực sai lệch (Semantic Mismatch Correction).'
                        : 'Phát ngôn từ Hiệp hội / Doanh nghiệp / Dư luận phản ánh khó khăn hoặc kiến nghị sửa đổi: Kéo sắc thái về hướng phản biện hoặc cần tháo gỡ.'}
                    </p>
                  </div>
                </div>

                {/* Tầng 2: Trọng số Thực thể bị tác động (Target Entity Weight E: 1..4) */}
                <div className={`p-4 rounded-2xl border space-y-2.5 ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-black">2</span>
                      Tầng 2: Trọng Số Thực Thể (E)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Trọng số E = {loughranData.targetEntity.weightE} / 4
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-200">
                      {loughranData.targetEntity.entityNameVi}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {loughranData.targetEntity.weightE === 4
                        ? 'E = 4: Tin tiêu cực hướng vào Lãnh đạo Bộ hoặc chính sách vĩ mô vĩnh viễn mang trọng số rủi ro cao nhất.'
                        : loughranData.targetEntity.weightE === 3
                        ? 'E = 3: Đề cập đến Tổng cục Thuế, Tổng cục Hải quan, UBCKNN hoặc cơ quan quản lý các TP lớn (Hà Nội, TP.HCM).'
                        : loughranData.targetEntity.weightE === 2
                        ? 'E = 2: Đề cập đến Cục/Chi cục Thuế, Hải quan tỉnh lẻ hoặc đơn vị cấp cơ sở.'
                        : 'E = 1: Đề cập đến cá nhân hoặc doanh nghiệp nhỏ lẻ đơn lẻ, không mang tính đại diện hệ thống.'}
                    </p>
                  </div>
                </div>

                {/* Tầng 3: Bản chất Ngữ cảnh Sự kiện (Event Context Taxonomy) */}
                <div className={`p-4 rounded-2xl border space-y-2.5 ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-black">3</span>
                      Tầng 3: Ngữ Cảnh Sự Kiện
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-amber-300 border border-slate-700">
                      {loughranData.eventContext.category}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-200">
                      {loughranData.eventContext.categoryLabelVi}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {loughranData.eventContext.contextSummary}
                    </p>
                  </div>
                </div>

                {/* Tầng 4: Hệ số Lan truyền & Tương tác (Velocity Vector V: 1.0..1.25) */}
                <div className={`p-4 rounded-2xl border space-y-2.5 ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-xs uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-black">4</span>
                      Tầng 4: Hệ Số Lan Truyền (V)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      V = {loughranData.velocityVector.V}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-200">
                      {loughranData.velocityVector.velocityStatusLabel}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {loughranData.velocityVector.V === 1.25
                        ? 'V = 1.25: Xuất hiện trên cơ quan báo chí lớn (VnExpress, Tuổi Trẻ, CafeF...) hoặc mạng xã hội có tương tác >500 lượt, nhân cấp độ rủi ro lên kịch trần.'
                        : 'V = 1.0: Trang tin điện tử tổng hợp, tạp chí chuyên ngành hẹp hoặc bài thảo luận đơn lẻ ít tương tác.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* BẢNG THANG ĐIỂM SẮC THÁI CHUYÊN NGÀNH [-5 ĐẾN +5] */}
              <div className={`p-4 rounded-2xl border space-y-2.5 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="text-slate-300 uppercase tracking-wider">Thang Điểm Sắc Thái Chuẩn Hóa Theo Tài Liệu Chuyên Đề</span>
                  <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                    loughranData.scoreS < 0 ? 'bg-rose-500/20 text-rose-300' : loughranData.scoreS > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
                  }`}>
                    Hiện tại: {loughranData.scoreLabel}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl border border-rose-900/40 bg-rose-950/20 space-y-1">
                    <div className="font-bold text-rose-400">Tiêu Cực (-1 đến -5)</div>
                    <ul className="text-slate-400 space-y-0.5 pl-1">
                      <li>• -1: Phàn nàn nhẹ thủ tục online (eTax)</li>
                      <li>• -2: Bất cập cơ sở, chậm thông quan lẻ</li>
                      <li>• -3: Treo mạng diện rộng, phản biện chính sách</li>
                      <li>• -4: Hiệp hội kiến nghị khẩn cấp (ngành gỗ...)</li>
                      <li>• -5: Tin đồn kích động/thất thiệt nhắm vào Lãnh đạo</li>
                    </ul>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                    <div className="font-bold text-slate-300">Trung Tính (0)</div>
                    <p className="text-slate-400 leading-relaxed">
                      • 0: Thông báo chính sách, văn bản quy phạm pháp luật, chỉ số thống kê vĩ mô, nhân sự chính phủ khách quan thuần túy.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl border border-emerald-900/40 bg-emerald-950/20 space-y-1">
                    <div className="font-bold text-emerald-400">Tích Cực (+1 đến +5)</div>
                    <ul className="text-slate-400 space-y-0.5 pl-1">
                      <li>• +1: Hài lòng về dịch vụ công tiện ích</li>
                      <li>• +2: Thông quan luồng xanh dưới 1 phút</li>
                      <li>• +3: Giảm 2% VAT kích cầu tiêu dùng</li>
                      <li>• +4: Phá đường dây buôn lậu lớn, vượt thu</li>
                      <li>• +5: Quốc tế nâng hạng tín nhiệm quốc gia</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Toàn văn định dạng JSON Schema chuẩn 3 Tầng theo đúng bản đặc tả kỹ thuật:
                </div>
                <button
                  onClick={handleCopyJson}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'Đã sao chép' : 'Sao chép JSON'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono overflow-x-auto max-h-[500px] leading-relaxed custom-scrollbar">
                {JSON.stringify(model.standardizedJsonOutput, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'fewshot' && (
            <div className="space-y-4">
              {/* HEADER BANNER */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                isDark ? 'bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/40 border-purple-500/40' : 'bg-gradient-to-r from-purple-50 via-white to-indigo-50 border-purple-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="p-1 rounded-lg bg-purple-500/20 text-purple-400">
                        <FlaskConical className="w-4 h-4" />
                      </span>
                      <h3 className="font-black text-sm uppercase tracking-wide text-purple-400">
                        Cẩm Nang 100 Tình Huống Báo Chí Thực Chiến
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Nghị định 376/2026/NĐ-CP
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                      Bộ dữ liệu chuẩn đối soát gồm 100 tình huống báo chí thực tế ngành Tài chính, phân cấp thành 4 tầng rủi ro chính xác: Mức 0 (Loại trừ), Mức 1 (Lưu tâm), Mức 2 (Cảnh báo sớm), Mức 3 (Cảnh báo gấp / SOP Cấp 4). Bấm vào bất kỳ tình huống nào để nạp dữ liệu và kiểm chứng mô hình phân loại.
                    </p>
                  </div>

                  {selectedTestCaseItem && (
                    <button
                      onClick={() => setSelectedTestCaseItem(null)}
                      className="self-start sm:self-auto px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 cursor-pointer shrink-0"
                    >
                      Khôi phục bài viết gốc ({item.title.slice(0, 24)}...)
                    </button>
                  )}
                </div>

                {/* BỘ LỌC 4 CẤP ĐỘ THEO NGHỊ ĐỊNH 376 */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3.5 mt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setFewshotTierFilter('ALL')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        fewshotTierFilter === 'ALL'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      Tất cả ({DECREE_376_100_SCENARIOS.length})
                    </button>

                    <button
                      onClick={() => setFewshotTierFilter(0)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        fewshotTierFilter === 0
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Mức 0: Loại trừ ({DECREE_376_100_SCENARIOS.filter(s => s.tier === 0).length})
                    </button>

                    <button
                      onClick={() => setFewshotTierFilter(1)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        fewshotTierFilter === 1
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Mức 1: Cần lưu tâm ({DECREE_376_100_SCENARIOS.filter(s => s.tier === 1).length})
                    </button>

                    <button
                      onClick={() => setFewshotTierFilter(2)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        fewshotTierFilter === 2
                          ? 'bg-amber-600 text-white shadow-xs'
                          : isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Mức 2: Cảnh báo sớm ({DECREE_376_100_SCENARIOS.filter(s => s.tier === 2).length})
                    </button>

                    <button
                      onClick={() => setFewshotTierFilter(3)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        fewshotTierFilter === 3
                          ? 'bg-rose-600 text-white shadow-xs'
                          : isDark ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      Mức 3: Cảnh báo gấp ({DECREE_376_100_SCENARIOS.filter(s => s.tier === 3).length})
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={fewshotSearchQuery}
                      onChange={(e) => setFewshotSearchQuery(e.target.value)}
                      placeholder="Tìm theo mã (TH-01), tiêu đề, từ khóa..."
                      className={`pl-8 pr-3 py-1.5 rounded-xl text-xs border transition outline-none w-56 sm:w-72 ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-purple-500'
                          : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* LƯỚI TÌNH HUỐNG 100 MẪU */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[580px] overflow-y-auto pr-1">
                {DECREE_376_100_SCENARIOS
                  .filter((sc) => {
                    if (fewshotTierFilter !== 'ALL' && sc.tier !== fewshotTierFilter) return false;
                    if (fewshotSearchQuery.trim()) {
                      const q = fewshotSearchQuery.toLowerCase();
                      return (
                        sc.scenarioCode.toLowerCase().includes(q) ||
                        sc.title.toLowerCase().includes(q) ||
                        (sc.realArticleTitle && sc.realArticleTitle.toLowerCase().includes(q)) ||
                        sc.classificationReason.toLowerCase().includes(q) ||
                        sc.decree376Basis.leadAgencyName.toLowerCase().includes(q) ||
                        (sc.pressSources && sc.pressSources.some(p => p.toLowerCase().includes(q)))
                      );
                    }
                    return true;
                  })
                  .map((sc) => {
                    const isSelected = selectedTestCaseItem?.id === `decree376-${sc.id}`;

                    return (
                      <div
                        key={sc.id}
                        className={`p-4 rounded-2xl border text-xs space-y-3 flex flex-col justify-between transition ${
                          isSelected
                            ? 'border-purple-500 bg-purple-950/30 ring-2 ring-purple-500/40 shadow-md'
                            : sc.tier === 3
                            ? (isDark ? 'bg-slate-900/90 border-rose-500/30 hover:border-rose-500/60' : 'bg-white border-rose-200 hover:border-rose-400')
                            : sc.tier === 2
                            ? (isDark ? 'bg-slate-900/90 border-amber-500/30 hover:border-amber-500/60' : 'bg-white border-amber-200 hover:border-amber-400')
                            : sc.tier === 1
                            ? (isDark ? 'bg-slate-900/90 border-blue-500/30 hover:border-blue-500/60' : 'bg-white border-blue-200 hover:border-blue-400')
                            : (isDark ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300')
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-mono font-black text-[11px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                              {sc.scenarioCode}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              sc.tier === 3
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : sc.tier === 2
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : sc.tier === 1
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}>
                              {sc.tierLabelVi.split('(')[0].trim()}
                            </span>
                          </div>

                          <h4 className="font-bold text-slate-100 line-clamp-2 text-xs leading-snug">
                            {sc.title}
                          </h4>

                          <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                            {sc.realArticleTitle || sc.classificationReason}
                          </p>

                          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1 text-[10.5px]">
                            <div className="flex items-center justify-between font-mono">
                              <span className="text-slate-400">Công thức: S={sc.calibratedScores.S} D={sc.calibratedScores.D} V={sc.calibratedScores.V} I={sc.calibratedScores.I}</span>
                              <strong className={`font-bold ${
                                sc.tier === 3 ? 'text-rose-400' : sc.tier === 2 ? 'text-amber-400' : sc.tier === 1 ? 'text-blue-400' : 'text-emerald-400'
                              }`}>
                                {sc.calibratedScores.riskScore}đ
                              </strong>
                            </div>
                            <div className="text-slate-400 truncate">
                              <strong>Đơn vị chủ trì: </strong>{sc.decree376Basis.leadAgencyName}
                            </div>
                            <div className="text-slate-500 truncate text-[10px]">
                              {sc.decree376Basis.clauseArticle}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const mockItem = convertDecreeScenarioToNewsItem(sc);
                            setSelectedTestCaseItem(mockItem);
                            setActiveTab('dossier');
                          }}
                          className={`w-full py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer transition ${
                            sc.tier === 3
                              ? 'bg-rose-600 hover:bg-rose-500'
                              : sc.tier === 2
                              ? 'bg-amber-600 hover:bg-amber-500'
                              : sc.tier === 1
                              ? 'bg-blue-600 hover:bg-blue-500'
                              : 'bg-emerald-600 hover:bg-emerald-500'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Nạp Kiểm Thử & Chạy Mô Hình</span>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <WarningAuditLogTab
              currentItem={currentItem}
              allNews={allNews}
              onOverrideArticle={onOverrideArticle}
            />
          )}

          {activeTab === 'agencies376' && (
            <div className="space-y-4">
              {/* HEADER BANNER */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                isDark ? 'bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border-blue-500/40' : 'bg-gradient-to-r from-blue-50 via-white to-white border-blue-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="p-1 rounded-lg bg-blue-500/20 text-blue-400">
                        <Building className="w-4 h-4" />
                      </span>
                      <h3 className="font-black text-sm uppercase tracking-wide text-blue-400">
                        Cơ Cấu Tổ Chức 34 Đơn Vị Thuộc Bộ Tài Chính
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Nghị định số 376/2026/NĐ-CP
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 dark:text-slate-300 leading-relaxed max-w-3xl">
                      Căn cứ Điều 3 Nghị định 376/2026/NĐ-CP ban hành ngày 01/10/2026, Bộ Tài chính được chuyển giao các mảng chức năng mới: Đấu thầu & PPP, Đầu tư nước ngoài (FDI), Thống kê quốc gia, Quy hoạch KT-XH và tiếp nhận Bảo hiểm xã hội Việt Nam. Hệ thống FinPulse tự động định tuyến đầu mối tham mưu (Lead Unit) cho từng bài viết vào đúng 1 trong 34 đơn vị chuyên trách dưới đây.
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={agencySearchQuery}
                        onChange={(e) => setAgencySearchQuery(e.target.value)}
                        placeholder="Tìm theo tên, từ khóa..."
                        className={`pl-8 pr-3 py-1.5 rounded-xl text-xs border transition outline-none w-48 sm:w-64 ${
                          isDark
                            ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-blue-500'
                            : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* THỐNG KÊ NHÓM ĐƠN VỊ */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Khối Vụ Tham Mưu</span>
                    <strong className="text-sm font-black text-indigo-400">11 Vụ</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Khối Cục Quản Lý</span>
                    <strong className="text-sm font-black text-cyan-400">9 Cục</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Vụ Chuyên Ngành Mới</span>
                    <strong className="text-sm font-black text-amber-400">4 Vụ</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Cơ Quan Trực Thuộc & Đặc Thù</span>
                    <strong className="text-sm font-black text-emerald-400">7 Cơ quan</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Sự Nghiệp Công Lập</span>
                    <strong className="text-sm font-black text-purple-400">3 Viện/Trường</strong>
                  </div>
                </div>
              </div>

              {/* DANH SÁCH 34 ĐƠN VỊ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {MOF_34_AGENCIES_DECREE_376
                  .filter((agency) => {
                    if (!agencySearchQuery.trim()) return true;
                    const q = agencySearchQuery.toLowerCase();
                    return (
                      agency.name.toLowerCase().includes(q) ||
                      agency.shortName.toLowerCase().includes(q) ||
                      agency.leadFunctions.toLowerCase().includes(q) ||
                      agency.keywords.some((kw) => kw.toLowerCase().includes(q))
                    );
                  })
                  .map((agency, index) => {
                    const isCurrentLead =
                      model.level3Action.leadUnit.toLowerCase().includes(agency.name.toLowerCase()) ||
                      model.level3Action.leadUnit.toLowerCase().includes(agency.shortName.toLowerCase());

                    return (
                      <div
                        key={agency.id}
                        className={`p-3.5 rounded-xl border transition space-y-2 relative ${
                          isCurrentLead
                            ? isDark
                              ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                              : 'bg-blue-50 border-blue-400 shadow-md ring-1 ring-blue-400/50'
                            : isDark
                            ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-black shrink-0">
                              {index + 1}
                            </span>
                            <div>
                              <h4 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                                <span>{agency.name}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                                  {agency.shortName}
                                </span>
                              </h4>
                            </div>
                          </div>

                          {isCurrentLead && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500 text-white shrink-0 animate-pulse">
                              Chủ Trì Bài Viết Này
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-300 dark:text-slate-400 leading-relaxed">
                          {agency.leadFunctions}
                        </p>

                        <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                          <div className="truncate max-w-[80%]">
                            <span className="font-semibold text-slate-400">Từ khóa quét: </span>
                            <span className="text-slate-400 italic">
                              {agency.keywords.slice(0, 3).join(', ')}...
                            </span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded font-mono uppercase text-[9px] ${
                            agency.type === 'special_agency'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : agency.type === 'administrative'
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {agency.type === 'special_agency' ? 'Chuyên trách' : agency.type === 'administrative' ? 'Hành chính' : 'Sự nghiệp'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 4. OPTIONAL: BÓC TÁCH CHI TIẾT 7 KHÂU THUẬT TOÁN (COLLAPSIBLE AUDIT) */}
          <div className={`rounded-xl border transition-all ${
            isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <button
              onClick={() => setShowTechnicalAudit(!showTechnicalAudit)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                <span>Xem chi tiết bóc tách kỹ thuật 7 khâu thuật toán (Pipeline Audit)</span>
              </div>
              {showTechnicalAudit ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTechnicalAudit && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {model.pipelineStages.map((st, i) => (
                    <div
                      key={st.stage}
                      className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-emerald-400">0{i + 1}. {st.titleVi.split('. ')[1] || st.titleVi}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">{st.badge}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{st.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER: INSTANT ACTION BUTTONS */}
        <div
          className={`p-4 sm:p-5 border-t flex items-center justify-between gap-3 shrink-0 flex-wrap ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hệ thống Tự động Cảnh báo FinPulse MOF Executive</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onGmailAlert && (
              <button
                onClick={() => onGmailAlert(currentItem)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  isDark
                    ? 'bg-rose-950/60 hover:bg-rose-900 border-rose-800 text-rose-200'
                    : 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-rose-400" />
                <span>Bắn Gmail Khẩn</span>
              </button>
            )}

            {onDraftStatement && (
              <button
                onClick={() => onDraftStatement(currentItem)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  isDark
                    ? 'bg-emerald-950/60 hover:bg-emerald-900 border-emerald-800 text-emerald-200'
                    : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900'
                }`}
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Soạn Phát Ngôn</span>
              </button>
            )}

            {onPolicySubmission && (
              <button
                onClick={() => onPolicySubmission(currentItem)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  isDark
                    ? 'bg-amber-950/60 hover:bg-amber-900 border-amber-800 text-amber-200'
                    : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Lập Tờ Trình</span>
              </button>
            )}

            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  : 'bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-800'
              }`}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

