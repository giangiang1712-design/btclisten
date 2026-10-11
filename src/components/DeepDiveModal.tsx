import React, { useState, useEffect, useRef } from 'react';
import { ScrapedNewsItem, DeepDiveAnalysis, formatNewsTimeDisplay } from '../types';
import { fetchDeepDiveAnalysis, fetchExecutiveSummaryBullets } from '../services/api';
import { generateSmartExecutiveDirective, getMediaStrategyPresentation } from '../lib/directiveEngine';
import { extractArticleMilestonesAndMetrics } from '../lib/articleContextExtractor';
import { useTheme } from '../lib/theme';
import { SourceBrandBadge } from './SourceBrandBadge';
import { AutoActionProposer } from './AutoActionProposer';
import { SentimentDiagnosticCard } from './SentimentDiagnosticCard';
import { MediaGapAlertCard } from './MediaGapAlertCard';
import { WarningPipelineCard } from './WarningPipelineCard';
import { CrisisResponseStrategyModule } from './CrisisResponseStrategyModule';
import { ReSummarizePanel } from './ReSummarizePanel';
import { RiskFormulaRadarChart } from './RiskFormulaRadarChart';
import {
  X,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Loader2,
  FileText,
  Flame,
  Award,
  FileCheck2,
  Mail,
  Clock,
  Bot,
  Copy,
  Check,
  RefreshCw,
  Target,
  Building2,
  Users,
  ShieldAlert,
  ChevronDown,
  Layers,
  BarChart3,
  HelpCircle
} from 'lucide-react';

interface DeepDiveModalProps {
  item: ScrapedNewsItem | null;
  onClose: () => void;
  onDraftStatement?: (item: ScrapedNewsItem) => void;
  onPolicySubmission?: (item: ScrapedNewsItem) => void;
  onGmailAlert?: (item: ScrapedNewsItem) => void;
  onOpenAdvisorChatbot?: (item: ScrapedNewsItem) => void;
  onOpenViolationDossier?: (item: ScrapedNewsItem) => void;
  onOpenReaderComments?: (item: ScrapedNewsItem) => void;
}

type ModalTab = 'briefing' | 'crisis' | 'sentiment' | 'details';

export const DeepDiveModal: React.FC<DeepDiveModalProps> = ({
  item,
  onClose,
  onDraftStatement,
  onPolicySubmission,
  onGmailAlert,
  onOpenAdvisorChatbot,
  onOpenViolationDossier,
  onOpenReaderComments,
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<ModalTab>('briefing');
  const [analysis, setAnalysis] = useState<DeepDiveAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Executive Summary (3-bullet-point summary of impact on MOF objectives)
  const [execSummaryBullets, setExecSummaryBullets] = useState<string[] | null>(null);
  const [isGeneratingBullets, setIsGeneratingBullets] = useState<boolean>(false);
  const [bulletsError, setBulletsError] = useState<string | null>(null);
  const [copiedBullets, setCopiedBullets] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [showMoreActions, setShowMoreActions] = useState<boolean>(false);
  const moreActionsRef = useRef<HTMLDivElement>(null);
  const reSummarizeRef = useRef<HTMLDivElement>(null);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (moreActionsRef.current && !moreActionsRef.current.contains(e.target as Node)) {
        setShowMoreActions(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (!item) {
      setAnalysis(null);
      setExecSummaryBullets(null);
      setIsGeneratingBullets(false);
      setBulletsError(null);
      setCopiedBullets(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setExecSummaryBullets(null);
    setIsGeneratingBullets(false);
    setBulletsError(null);
    setCopiedBullets(false);

    // Fetch deep dive analysis
    fetchDeepDiveAnalysis({
      title: item.title,
      summary: item.summary,
      sector: item.sectorNameVi,
      tickers: item.tickers,
    })
      .then((data) => {
        if (isMounted) {
          setAnalysis(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Không thể tạo phân tích chuyên sâu.');
          setIsLoading(false);
        }
      });

    // Auto load or generate 3-bullet executive summary
    setIsGeneratingBullets(true);
    fetchExecutiveSummaryBullets({
      title: item.title,
      summary: item.summary,
      sector: item.sectorNameVi,
      source: item.source,
      keyPoints: item.keyPoints,
    })
      .then((res) => {
        if (isMounted && res?.bullets?.length) {
          setExecSummaryBullets(res.bullets);
        }
      })
      .catch(() => {
        // Fallback to extract from item summary
        if (isMounted && item.summary) {
          setExecSummaryBullets([
            item.title,
            `Lĩnh vực ${item.sectorNameVi || 'Quản lý Bộ Tài chính'} cần theo dõi sát phản ứng dư luận.`,
            `Chủ động cung cấp thông tin chính thống và báo cáo Lãnh đạo Bộ các nội dung liên quan.`
          ]);
        }
      })
      .finally(() => {
        if (isMounted) setIsGeneratingBullets(false);
      });

    return () => {
      isMounted = false;
    };
  }, [item]);

  const handleGenerateExecutiveSummary = async () => {
    if (!item) return;
    setIsGeneratingBullets(true);
    setBulletsError(null);

    try {
      const res = await fetchExecutiveSummaryBullets({
        title: item.title,
        summary: item.summary,
        sector: item.sectorNameVi,
        source: item.source,
        keyPoints: item.keyPoints,
      });
      setExecSummaryBullets(res.bullets);
    } catch (err: any) {
      setBulletsError(err.message || 'Không thể tạo tóm tắt điều hành 3 ý AI.');
    } finally {
      setIsGeneratingBullets(false);
    }
  };

  if (!item) return null;

  const handleCopyReport = () => {
    const text = `📊 [BÁO CÁO SOCIAL LISTENING CHUYÊN SÂU - BTC LISTENING]\n` +
      `📌 Tiêu đề: ${item.title}\n` +
      `🏢 Nguồn: ${item.source} | Lĩnh vực: ${item.sectorNameVi}\n\n` +
      (execSummaryBullets ? `🎯 TÓM TẮT 3 Ý LÃNH ĐẠO:\n${execSummaryBullets.map((b, idx) => `${idx + 1}. ${b}`).join('\n')}\n\n` : '') +
      (analysis ? `💡 Tóm tắt chiến lược:\n${analysis.executiveSummary}\n\n` +
      `📈 Tác động ngắn hạn: ${analysis.marketImpact.shortTerm}\n` +
      `🎯 Tác động trung hạn: ${analysis.marketImpact.mediumTerm}\n` +
      `⚡ Khuyến nghị hành động: ${analysis.recommendations.investorAction}\n` : `Nội dung: ${item.summary}`);

    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const isRiskArticle = item.sentiment === 'bearish' || (item.priorityScore && item.priorityScore >= 7) || Boolean(item.isEmergency);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 z-[100] backdrop-blur-md animate-fadeIn">
      <div className="rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border-2 border-slate-200 bg-slate-950 text-slate-100">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b-2 border-slate-200 bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg shrink-0 bg-white text-black font-black border border-white">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wide truncate">
                BÁO CÁO THAM MƯU & SOCIAL LISTENING BỘ TÀI CHÍNH
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="font-mono text-white font-semibold">{formatNewsTimeDisplay(item)}</span>
                <span>•</span>
                <span className="text-slate-200 font-medium">{item.sectorNameVi}</span>
                <span>•</span>
                <span className="text-slate-300">{item.source}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition cursor-pointer shrink-0 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700"
            title="Đóng cửa sổ (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB NAVIGATION BAR: Keeps content clean, compact & scannable */}
        <div className={`px-4 sm:px-5 py-2 border-b flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0 ${
          isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-100/70 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('briefing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'briefing'
                ? isDark
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'bg-white text-emerald-800 border border-emerald-300 shadow-xs font-black'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-emerald-500" />
            <span>1. Tóm Tắt & Chỉ Đạo Lãnh Đạo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crisis')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'crisis'
                ? isDark
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs'
                  : 'bg-white text-rose-800 border border-rose-300 shadow-xs font-black'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>2. Cảnh Báo & Xử Lý Khủng Hoảng</span>
            {isRiskArticle && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sentiment')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sentiment'
                ? isDark
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'bg-white text-amber-800 border border-amber-300 shadow-xs font-black'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
            <span>3. Chẩn Đoán Sắc Thái & Khoảng Trống</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'details'
                ? isDark
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs'
                  : 'bg-white text-indigo-800 border border-indigo-300 shadow-xs font-black'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>4. Ma Trận 6W & Chuyên Sâu</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          
          {/* Top Article Title Banner */}
          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <SourceBrandBadge
                source={item.source}
                url={item.url}
                size="sm"
                showIcon={true}
              />
              <span className={`text-xs font-mono font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {formatNewsTimeDisplay(item)}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className={`text-xs font-semibold ${isDark ? 'text-cyan-400' : 'text-sky-700'}`}>
                {item.sectorNameVi}
              </span>
              {item.impactLevel && (
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                  item.impactLevel === 'high' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-800 text-slate-300'
                }`}>
                  Tác động: {item.impactLevel === 'high' ? 'Cao' : item.impactLevel === 'medium' ? 'Vừa' : 'Thấp'}
                </span>
              )}
            </div>
            <h3 className={`font-bold text-sm sm:text-base leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {item.title}
            </h3>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: EXECUTIVE BRIEFING & 3-BULLET POINT AI SUMMARY                     */}
          {/* ========================================================================= */}
          {activeTab === 'briefing' && (
            <div className="space-y-4 animate-fadeIn">
              {/* AI Executive Summary Card (3-bullet-point summary of MOF impact) */}
              <div className={`p-4 rounded-2xl border space-y-3 shadow-xs ${
                isDark
                  ? 'bg-slate-950/90 border-indigo-500/40'
                  : 'bg-white border-indigo-200 shadow-xs'
              }`}>
                <div className="flex items-center justify-between gap-2 border-b pb-2.5 border-indigo-500/20">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className={`font-bold text-xs sm:text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <span>AI Executive Summary</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                          3 Ý Cốt Lõi Tác Động BTC
                        </span>
                      </h4>
                      <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Trích xuất tự động tác động đến quản lý tài chính - ngân sách
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {execSummaryBullets && (
                      <button
                        type="button"
                        onClick={() => {
                          const text = `🎯 [TÓM TẮT 3 Ý - BTC LISTENING]\n📌 Bài viết: ${item.title}\n\n` +
                            execSummaryBullets.map((b, idx) => `• Ý ${idx + 1}: ${b}`).join('\n\n');
                          navigator.clipboard.writeText(text);
                          setCopiedBullets(true);
                          setTimeout(() => setCopiedBullets(false), 2000);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedBullets ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedBullets ? 'Đã sao chép' : 'Sao chép 3 ý'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleGenerateExecutiveSummary}
                      disabled={isGeneratingBullets}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Tạo lại tóm tắt 3 ý"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingBullets ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Tạo lại</span>
                    </button>
                  </div>
                </div>

                {/* Status / Loading / Error / Results */}
                {isGeneratingBullets && (
                  <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 flex items-center gap-2 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
                    <span>Tham khảo AI đang tổng hợp 3 ý tác động tới mục tiêu điều hành của BTC...</span>
                  </div>
                )}

                {bulletsError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between">
                    <span>{bulletsError}</span>
                    <button
                      type="button"
                      onClick={handleGenerateExecutiveSummary}
                      className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 font-bold transition cursor-pointer"
                    >
                      Thử lại
                    </button>
                  </div>
                )}

                {execSummaryBullets && execSummaryBullets.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    {execSummaryBullets.map((bullet, idx) => {
                      const icons = [
                        <FileText className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" key="1" />,
                        <Building2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" key="2" />,
                        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" key="3" />
                      ];
                      const labels = ['BẢN CHẤT SỰ KIỆN', 'TÁC ĐỘNG MỤC TIÊU BTC', 'KHUYẾN NGHỊ THAM MƯU'];
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                            isDark
                              ? 'bg-slate-900 border-slate-700/80 text-slate-100 shadow-2xs'
                              : 'bg-slate-50/90 border-slate-200 text-slate-900'
                          }`}
                        >
                          {icons[idx % 3]}
                          <div className="space-y-1 min-w-0 flex-1">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                              idx === 0 ? 'text-indigo-400' : idx === 1 ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              Ý {idx + 1}: {labels[idx % 3]}
                            </span>
                            <p className={`text-xs font-normal leading-relaxed ${
                              isDark ? 'text-slate-100' : 'text-slate-800'
                            }`}>
                              {bullet}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4 Trụ Cột Tham Mưu Chỉ Đạo Lãnh Đạo */}
              {(() => {
                const directive = item.executiveDirective && item.executiveDirective.mediaStrategy?.type
                  ? item.executiveDirective
                  : generateSmartExecutiveDirective(item.title, item.summary || '', {
                      priorityScore: item.priorityScore,
                      sentiment: item.sentiment,
                      impactLevel: item.impactLevel,
                      buzzScore: item.buzzScore,
                      isUrgent: item.isUrgent,
                      sectorNameVi: item.sectorNameVi,
                      agencies: item.agencies,
                      tickers: item.tickers,
                      policyTags: item.policyTags,
                    });

                const presentation = getMediaStrategyPresentation(
                  directive.mediaStrategy.type,
                  directive.mediaStrategy.title,
                  item.priorityScore
                );

                return (
                  <div className={`p-4 rounded-2xl border space-y-3 ${
                    isDark ? `${presentation.borderClassDark} bg-slate-950/60` : `${presentation.borderClassLight} bg-slate-50/80`
                  }`}>
                    <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border ${
                          isDark ? presentation.badgeClassDark : presentation.badgeClassLight
                        }`}>
                          {directive.mediaStrategy.type === 'crisis_resolution' ? (
                            <Flame className="w-4 h-4" />
                          ) : (
                            <Award className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            🏛️ 4 Trụ Cột Tham Mưu Chỉ Đạo
                          </span>
                          <span className={`text-[10px] font-semibold ${isDark ? presentation.textClassDark : presentation.textClassLight}`}>
                            {presentation.badgeLabel} • {presentation.description}
                          </span>
                        </div>
                      </div>

                      {onDraftStatement && (
                        <button
                          onClick={() => {
                            onClose();
                            onDraftStatement(item);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-xs cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Soạn Đề Cương</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                      <div className={`p-3 rounded-xl border ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                      }`}>
                        <span className={`text-[10px] font-bold uppercase block mb-1 ${isDark ? 'text-cyan-400' : 'text-sky-700'}`}>
                          1. Chuyện gì đang xảy ra:
                        </span>
                        <p className={`leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{directive.whatHappened}</p>
                      </div>

                      <div className={`p-3 rounded-xl border ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                      }`}>
                        <span className={`text-[10px] font-bold uppercase block mb-1 ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>
                          2. Cơ quan phụ trách:
                        </span>
                        <p className={`leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          <strong className={isDark ? 'text-indigo-300' : 'text-indigo-800'}>{directive.where?.primaryAgency || directive.whereEntity || 'Bộ Tài chính'}</strong> ({directive.where?.jurisdiction || 'Lĩnh vực quản lý chuyên ngành'})
                        </p>
                      </div>

                      <div className={`p-3 rounded-xl border ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                      }`}>
                        <span className={`text-[10px] font-bold uppercase block mb-1 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                          3. Nguyên nhân gốc rễ:
                        </span>
                        <p className={`leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{directive.rootCause}</p>
                      </div>

                      <div className={`p-3 rounded-xl border ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                      }`}>
                        <span className={`text-[10px] font-bold uppercase block mb-1 ${isDark ? presentation.textClassDark : presentation.textClassLight}`}>
                          4. Định hướng truyền thông:
                        </span>
                        <p className={`leading-relaxed font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{directive.mediaStrategy?.tacticalRecommendation || directive.mediaStrategy?.title || directive.mediaStrategy?.keyMessage}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Extracted Milestones & Financial Metrics */}
              {(() => {
                const extContext = extractArticleMilestonesAndMetrics(item);
                if (extContext.milestones.length === 0 && extContext.metrics.length === 0) return null;
                return (
                  <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 flex-wrap ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Số liệu & Cột mốc nổi bật:</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {extContext.milestones.map((m, idx) => (
                        <span
                          key={`dm-${idx}`}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                            isDark ? 'bg-amber-950/40 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}
                        >
                          <span>{m}</span>
                        </span>
                      ))}

                      {extContext.metrics.map((num, idx) => (
                        <span
                          key={`dnum-${idx}`}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                            isDark ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                          <span>{num}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CRISIS RESPONSE, SOP & ACTIONS                                     */}
          {/* ========================================================================= */}
          {activeTab === 'crisis' && (
            <div className="space-y-4 animate-fadeIn">
              {/* 0. Khối Kết Hợp: Radar Chart (S, D, V, I) & Ma Trận 2x2 Bốn Trục Đe Dọa Thể Chế */}
              {(() => {
                const risk2 = item.warningPipeline?.level2Risk;
                const metrics = (item.warningPipeline?.formulaMetrics || {
                  S: 25,
                  D: 0,
                  V: 0.3,
                  I: 0.6,
                }) as any;
                const totalScore = item.warningPipeline?.level2Risk?.riskScore || item.priorityScore || item.riskScore || 35;

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left Column: Radar Chart (5 cols) */}
                    <div className="lg:col-span-5">
                      <RiskFormulaRadarChart
                        severityS={metrics.S}
                        divergenceD={metrics.D}
                        velocityV={metrics.V}
                        impactI={metrics.I}
                        riskScore={totalScore}
                        isDark={isDark}
                      />
                    </div>

                    {/* Right Column: 2x2 Matrix 4 Trục Đe Dọa Thể Chế (7 cols) */}
                    <div className="lg:col-span-7">
                      <div className={`p-4 rounded-2xl border space-y-3 h-full flex flex-col justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-2xs'}`}>
                        <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-800 shrink-0">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4 text-amber-500" />
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                Ma Trận 4 Trục Đe Dọa Thể Chế (S = {metrics.S}/50)
                              </h4>
                            </div>
                            {metrics.severityOutput?.closestAnchorDescription && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-sans font-medium">
                                Neo: {metrics.severityOutput.closestAnchorDescription}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Tầng 2 Analysis
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs flex-1">
                          {/* Trục 1: Tổn hại Uy tín */}
                          <div className={`p-3 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'}`}>
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-bold text-amber-600 dark:text-amber-400 text-[11px]">1. Uy Tín & Chính Trị (A1)</span>
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold font-mono bg-amber-500/20 text-amber-600 dark:text-amber-300">
                                  {metrics.severityOutput?.axes?.A1_reputation || 15}đ
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-serif text-[11px] line-clamp-3">
                                {risk2?.criteria?.reputationDamage?.analysis || 'Có nguy cơ tác động tới niềm tin điều hành vĩ mô nếu thông tin báo chí không được định hướng kịp thời.'}
                              </p>
                            </div>
                          </div>

                          {/* Trục 2: Kinh tế & Ngân sách */}
                          <div className={`p-3 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'}`}>
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-bold text-rose-600 dark:text-rose-400 text-[11px]">2. Kinh Tế & Ngân Sách (A2)</span>
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold font-mono bg-rose-500/20 text-rose-600 dark:text-rose-400">
                                  {metrics.severityOutput?.axes?.A2_financial || 10}đ
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-serif text-[11px] line-clamp-3">
                                {risk2?.criteria?.investorBizImpact?.analysis || 'Quy mô tài chính ảnh hưởng tới vốn, dòng tiền và nguồn lực kinh tế.'}
                              </p>
                            </div>
                          </div>

                          {/* Trục 3: Pháp lý & Trách nhiệm */}
                          <div className={`p-3 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'}`}>
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">3. Pháp Lý & Kỷ Luật (A3)</span>
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold font-mono bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
                                  {metrics.severityOutput?.axes?.A3_legal || 10}đ
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-serif text-[11px] line-clamp-3">
                                {risk2?.criteria?.blameAttribution?.analysis || 'Các yếu tố sai phạm công vụ, thanh kiểm tra hoặc khởi tố cán bộ hành chính.'}
                              </p>
                            </div>
                          </div>

                          {/* Trục 4: Hạ tầng & Dân sinh */}
                          <div className={`p-3 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'}`}>
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">4. Hạ Tầng & Dân Sinh (A4)</span>
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold font-mono bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                                  {metrics.severityOutput?.axes?.A4_operational || 10}đ
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-serif text-[11px] line-clamp-3">
                                {risk2?.criteria?.investorBizImpact?.analysis || 'Phạm vi ảnh hưởng, độ nghẽn cổng kết nối hoặc tắc nghẽn thông quan hạ tầng.'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Section: Độ vênh Narrative - Reality (Divergence: D = {metrics.D}/20) */}
                        {metrics.divergenceOutput && (
                          <div className={`mt-3 p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-amber-50/40 border-amber-200/50 shadow-3xs'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                                <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                  <span>Độ Vênh Cam Kết - Thực Tiễn (Divergence: D = {metrics.D}/20)</span>
                                </h5>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                                metrics.divergenceOutput.divergenceLevel === 'CRITICAL' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                                metrics.divergenceOutput.divergenceLevel === 'HIGH' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20' :
                                metrics.divergenceOutput.divergenceLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                                'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/10'
                              }`}>
                                Cấp độ: {metrics.divergenceOutput.divergenceLevel}
                              </span>
                            </div>

                            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 mb-2.5 font-serif italic">
                              "{metrics.divergenceOutput.levelDescription}"
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10.5px]">
                              {/* D_num */}
                              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-3xs'}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-slate-500 dark:text-slate-400">Sai lệch Số liệu (D_num)</span>
                                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{metrics.divergenceOutput.axisScores?.D_num || 0}đ</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                  <div className="bg-amber-500 h-1 rounded-full" style={{ width: `${((metrics.divergenceOutput.axisScores?.D_num || 0) / 20) * 100}%` }}></div>
                                </div>
                              </div>

                              {/* D_time */}
                              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-3xs'}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-slate-500 dark:text-slate-400">Trễ hạn Tiến độ (D_time)</span>
                                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{metrics.divergenceOutput.axisScores?.D_time || 0}đ</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                  <div className="bg-rose-500 h-1 rounded-full" style={{ width: `${((metrics.divergenceOutput.axisScores?.D_time || 0) / 20) * 100}%` }}></div>
                                </div>
                              </div>

                              {/* D_pol */}
                              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-3xs'}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-slate-500 dark:text-slate-400">Đảo cực Hành vi (D_pol)</span>
                                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{metrics.divergenceOutput.axisScores?.D_pol || 0}đ</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                  <div className="bg-indigo-500 h-1 rounded-full" style={{ width: `${((metrics.divergenceOutput.axisScores?.D_pol || 0) / 20) * 100}%` }}></div>
                                </div>
                              </div>
                            </div>

                            {metrics.divergenceOutput.closestAnchorCase?.title && (
                              <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500">
                                <span className="font-medium">
                                  Mẫu neo kiểm chứng: <strong className="text-slate-700 dark:text-slate-300 font-bold">{metrics.divergenceOutput.closestAnchorCase.title}</strong>
                                </span>
                                <span className="font-mono bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                                  W={metrics.divergenceOutput.weights?.W_speaker?.toFixed(2)} • K_decay={metrics.divergenceOutput.weights?.K_decay?.toFixed(2)} • K_attr={metrics.divergenceOutput.weights?.K_attr?.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Section: Quy mô Tác động Thể chế (Impact: I = {metrics.I}/1.0) */}
                        {metrics.impactOutput && (
                          <div className={`mt-3 p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-indigo-50/40 border-indigo-200/50 shadow-3xs'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                  <span>Quy Mô Tác Động Thể Chế (Impact: I = {metrics.I?.toFixed(2) || '0.50'}/1.0)</span>
                                </h5>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                                metrics.impactOutput.impactLevel === 'NATIONAL_SYSTEMIC' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                                metrics.impactOutput.impactLevel === 'POPULATION_WIDE' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20' :
                                metrics.impactOutput.impactLevel === 'INDUSTRY_WIDE' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                                'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10'
                              }`}>
                                Cấp độ: {metrics.impactOutput.impactLevel}
                              </span>
                            </div>

                            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 mb-2.5 font-serif italic">
                              "{metrics.impactOutput.levelDescription}"
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
                              {/* I_entity */}
                              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-3xs'}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-slate-500 dark:text-slate-400">Thực thể (I_entity)</span>
                                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{metrics.impactOutput.axes?.I_entity?.toFixed(2) || '0.35'}</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                  <div className="bg-indigo-500 h-1 rounded-full" style={{ width: `${(metrics.impactOutput.axes?.I_entity || 0) * 100}%` }}></div>
                                </div>
                              </div>

                              {/* I_headcount */}
                              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-3xs'}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-slate-500 dark:text-slate-400">Số lượng (I_headcount)</span>
                                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{metrics.impactOutput.axes?.I_headcount?.toFixed(2) || '0.30'}</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                  <div className="bg-cyan-500 h-1 rounded-full" style={{ width: `${(metrics.impactOutput.axes?.I_headcount || 0) * 100}%` }}></div>
                                </div>
                              </div>

                              {/* I_geo */}
                              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-3xs'}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-slate-500 dark:text-slate-400">Địa lý (I_geo)</span>
                                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{metrics.impactOutput.axes?.I_geo?.toFixed(2) || '0.35'}</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                  <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${(metrics.impactOutput.axes?.I_geo || 0) * 100}%` }}></div>
                                </div>
                              </div>

                              {/* I_policy */}
                              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-3xs'}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-slate-500 dark:text-slate-400">Nghĩa vụ (I_policy)</span>
                                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{metrics.impactOutput.axes?.I_policy?.toFixed(2) || '0.30'}</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                  <div className="bg-amber-500 h-1 rounded-full" style={{ width: `${(metrics.impactOutput.axes?.I_policy || 0) * 100}%` }}></div>
                                </div>
                              </div>
                            </div>

                            {metrics.impactOutput.extractedHeadcount !== null && metrics.impactOutput.extractedHeadcount !== undefined && (
                              <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500">
                                <span className="font-medium">
                                  Số lượng đối tượng bóc tách: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{metrics.impactOutput.extractedHeadcount?.toLocaleString()} đối tượng</strong>
                                </span>
                                {metrics.impactOutput.matchedAnchorTitle && (
                                  <span className="font-mono bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                                    Neo chuẩn: {metrics.impactOutput.matchedAnchorTitle}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 0. Mô Hình Cảnh Báo 7 Bước (Signal → Context → Risk → Velocity → Impact → Escalation → Alert) */}
              <WarningPipelineCard item={item} />

              {/* 0.5. Chiến Lược Ứng Phó & SOP Xử Lý Khủng Hoảng Truyền Thông */}
              <CrisisResponseStrategyModule
                item={item}
                onDraftStatement={onDraftStatement ? (it) => {
                  onClose();
                  onDraftStatement(it);
                } : undefined}
                onPolicySubmission={onPolicySubmission ? (it) => {
                  onClose();
                  onPolicySubmission(it);
                } : undefined}
                onGmailAlert={onGmailAlert ? (it) => {
                  onClose();
                  onGmailAlert(it);
                } : undefined}
                onOpenAdvisorChatbot={onOpenAdvisorChatbot ? (it) => {
                  onClose();
                  onOpenAdvisorChatbot(it);
                } : undefined}
              />

              {/* Auto Action Proposer */}
              <AutoActionProposer
                item={item}
                onDraftStatement={(it) => {
                  onClose();
                  if (onDraftStatement) onDraftStatement(it);
                }}
                onPolicySubmission={(it) => {
                  onClose();
                  if (onPolicySubmission) onPolicySubmission(it);
                }}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SENTIMENT DIAGNOSTICS & MEDIA GAP ALERTS                           */}
          {/* ========================================================================= */}
          {activeTab === 'sentiment' && (
            <div className="space-y-4 animate-fadeIn">
              {/* 1. Chẩn Đoán Sắc Thái Chuyên Sâu & Kế Hoạch Tác Chiến */}
              <SentimentDiagnosticCard item={item} />

              {/* 2. Cảnh Báo Khoảng Trống Truyền Thông (Media Gap) */}
              <MediaGapAlertCard
                item={item}
                onDraftCampaign={() => {
                  if (onDraftStatement) {
                    onClose();
                    onDraftStatement(item);
                  }
                }}
              />

              {/* Phân tích Tác động (Impact Analysis Breakdown) */}
              {(() => {
                const score = item.impactScore || 55;
                const level = item.impactLevel || 'low';
                return (
                  <div className={`p-4 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800 border-slate-200">
                      <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Bảng Phân Tích Chỉ Số Tác Động Vĩ Mô
                      </h4>
                      <span className="text-xs font-bold text-emerald-400 font-mono">{score}/99đ</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">1. Phạm Vi Chính Sách & Thể Chế</span>
                        <p className={isDark ? 'text-slate-200' : 'text-slate-700'}>Lĩnh vực: {item.sectorNameVi || 'Quản lý Bộ'}</p>
                      </div>
                      <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">2. Từ Khóa Nghiệp Vụ</span>
                        <p className={isDark ? 'text-slate-200' : 'text-slate-700'}>{item.weightedKeywords?.length || 0} từ khóa trọng số</p>
                      </div>
                      <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">3. Cường Độ Sắc Thái</span>
                        <p className={isDark ? 'text-slate-200' : 'text-slate-700'}>Sắc thái {item.sentiment} ({item.sentimentScore || 50}/100)</p>
                      </div>
                      <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">4. Lan Tỏa Nguồn Báo</span>
                        <p className={isDark ? 'text-slate-200' : 'text-slate-700'}>Nguồn: {item.source}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: 6W MATRIX & DEEP DIVE RAW GEMINI ANALYSIS                          */}
          {/* ========================================================================= */}
          {activeTab === 'details' && (
            <div className="space-y-4 animate-fadeIn">
              {/* 6W Strategic Intelligence Matrix */}
              {item.sixW && (
                <div className={`border p-4 rounded-2xl shadow-xs space-y-3 ${
                  isDark
                    ? 'bg-slate-950/80 border-indigo-500/30'
                    : 'bg-white border-indigo-200'
                }`}>
                  <div className="flex items-center justify-between border-b pb-2 dark:border-indigo-500/20 border-indigo-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Mô Hình 6W Bóc Tách Bản Chất Vụ Việc
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      Chuẩn 6W MoF
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[10px] font-bold uppercase text-indigo-400 block mb-0.5">👤 1. Ai (Chủ thể thực hiện)</span>
                      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{item.sixW.who}</p>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[10px] font-bold uppercase text-cyan-400 block mb-0.5">⚡ 2. Đang làm gì (Hành động)</span>
                      <p className={isDark ? 'text-slate-200' : 'text-slate-800'}>{item.sixW.doingWhat}</p>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[10px] font-bold uppercase text-amber-400 block mb-0.5">📌 3. Về vấn đề gì (Lĩnh vực)</span>
                      <p className={isDark ? 'text-slate-200' : 'text-slate-800'}>{item.sixW.aboutWhat}</p>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-0.5">🎯 4. Kết quả thế nào (Số liệu)</span>
                      <p className={isDark ? 'text-slate-200' : 'text-slate-800'}>{item.sixW.resultOutcome}</p>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[10px] font-bold uppercase text-rose-400 block mb-0.5">👥 5. Ai bị tác động (Đối tượng)</span>
                      <p className={isDark ? 'text-slate-200' : 'text-slate-800'}>{item.sixW.whoIsAffected}</p>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[10px] font-bold uppercase text-teal-400 block mb-0.5">💬 6. Phản ứng ra sao (Tâm lý)</span>
                      <p className={isDark ? 'text-slate-200' : 'text-slate-800'}>{item.sixW.reaction}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Re-summarize Panel */}
              <div ref={reSummarizeRef} id="re-summarize-section">
                <ReSummarizePanel
                  item={item}
                  originalSummary={item.summary || analysis?.executiveSummary}
                  onApplyAsPrimarySummary={(newSum) => {
                    if (analysis) {
                      setAnalysis((prev) => (prev ? { ...prev, executiveSummary: newSum } : prev));
                    }
                  }}
                />
              </div>

              {/* Gemini Raw DeepDive Analysis Details */}
              {analysis && (
                <div className="space-y-3">
                  <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">Tóm Tắt Chiến Lược (Chi tiết)</span>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{analysis.executiveSummary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <span className="text-[10px] font-bold uppercase text-cyan-400 block mb-1">Tác Động Ngắn Hạn (1-3 Phiên)</span>
                      <p className={isDark ? 'text-slate-200' : 'text-slate-700'}>{analysis.marketImpact.shortTerm}</p>
                    </div>

                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <span className="text-[10px] font-bold uppercase text-indigo-400 block mb-1">Tác Động Trung Hạn (1-3 Tháng)</span>
                      <p className={isDark ? 'text-slate-200' : 'text-slate-700'}>{analysis.marketImpact.mediumTerm}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* CLEAN, STREAMLINED MODAL FOOTER */}
        <div className={`p-3 sm:p-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenAdvisorChatbot && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdvisorChatbot(item);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white transition cursor-pointer shadow-xs active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-200" />
                <span>Hỏi AI Tham Mưu</span>
              </button>
            )}

            {onPolicySubmission && (
              <button
                onClick={() => {
                  onClose();
                  onPolicySubmission(item);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition cursor-pointer shadow-xs"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Lập Tờ Trình</span>
              </button>
            )}

            {onGmailAlert && isRiskArticle && (
              <button
                onClick={() => {
                  onClose();
                  onGmailAlert(item);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer shadow-xs"
              >
                <Mail className="w-3.5 h-3.5 text-rose-200" />
                <span>Gửi Gmail Cảnh Báo</span>
              </button>
            )}

            {/* "More Actions..." Dropdown Menu */}
            <div ref={moreActionsRef} className="relative">
              <button
                type="button"
                onClick={() => setShowMoreActions(!showMoreActions)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  showMoreActions
                    ? isDark ? 'bg-slate-800 text-white border-slate-600' : 'bg-white text-slate-900 border-slate-300 shadow-xs'
                    : isDark ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>Thao tác khác</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoreActions ? 'rotate-180' : ''}`} />
              </button>

              {showMoreActions && (
                <div className={`absolute left-0 bottom-full mb-1.5 w-60 rounded-xl border shadow-xl p-1.5 z-50 animate-in fade-in duration-150 ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <button
                    onClick={handleCopyReport}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition cursor-pointer ${
                      isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {copiedReport ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-cyan-400" />}
                    <span>{copiedReport ? 'Đã sao chép báo cáo' : 'Sao chép báo cáo chi tiết'}</span>
                  </button>

                  {onOpenReaderComments && (
                    <button
                      onClick={() => {
                        setShowMoreActions(false);
                        onClose();
                        onOpenReaderComments(item);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition cursor-pointer ${
                        isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Users className="w-4 h-4 text-sky-400" />
                      <span>Dư Luận Độc Giả Thật</span>
                    </button>
                  )}

                  {onOpenViolationDossier && isRiskArticle && (
                    <button
                      onClick={() => {
                        setShowMoreActions(false);
                        onClose();
                        onOpenViolationDossier(item);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition cursor-pointer ${
                        isDark ? 'hover:bg-slate-800 text-rose-300' : 'hover:bg-rose-50 text-rose-700'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <span>Lập Hồ Sơ Vi Phạm (SHA-256)</span>
                    </button>
                  )}

                  {onDraftStatement && (
                    <button
                      onClick={() => {
                        setShowMoreActions(false);
                        onClose();
                        onDraftStatement(item);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition cursor-pointer ${
                        isDark ? 'hover:bg-slate-800 text-indigo-300' : 'hover:bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>Soạn Thông Cáo Báo Chí</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              isDark
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
