import React, { useState, useEffect } from 'react';
import { ScrapedNewsItem, LeadershipDraftStatement } from '../types';
import { fetchLeadershipDraftStatement } from '../services/api';
import { generateSmartExecutiveDirective, getMediaStrategyPresentation } from '../lib/directiveEngine';
import { useTheme } from '../lib/theme';
import { SourceBrandBadge } from './SourceBrandBadge';
import {
  X,
  FileText,
  Copy,
  Check,
  Sparkles,
  Flame,
  Volume2,
  Download,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

interface DraftStatementModalProps {
  item: ScrapedNewsItem | null;
  onClose: () => void;
}

export const DraftStatementModal: React.FC<DraftStatementModalProps> = ({ item, onClose }) => {
  const { isDark } = useTheme();
  const [statement, setStatement] = useState<LeadershipDraftStatement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'statement' | 'talkingPoints'>('statement');

  useEffect(() => {
    if (!item) {
      setStatement(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const directive = item.executiveDirective;
    const strategyType = directive?.mediaStrategy?.type || (item.sentiment === 'bearish' ? 'crisis_resolution' : 'positive_amplification');
    const agency = directive?.where?.primaryAgency || directive?.whereEntity || item.agencies?.[0] || 'Bộ Tài chính';
    const whatHappened = directive?.whatHappened || item.title;
    const rootCause = directive?.rootCause || 'Diễn biến thị trường và yếu tố khách quan.';

    fetchLeadershipDraftStatement({
      title: item.title,
      summary: item.summary,
      sector: item.sectorNameVi,
      strategyType,
      agency,
      whatHappened,
      rootCause,
    })
      .then((data) => {
        if (isMounted) {
          setStatement(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Không thể khởi tạo dự thảo phát ngôn.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [item]);

  if (!item) return null;

  const directive = item.executiveDirective && item.executiveDirective.mediaStrategy?.type && !(item.priorityScore && item.priorityScore < 4.5 && item.executiveDirective.mediaStrategy.type === 'positive_amplification')
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
  const isCrisis = directive.mediaStrategy.type === 'crisis_resolution';

  const handleCopy = () => {
    if (!statement) return;
    const textToCopy = `=== ${statement.headline} ===\n\n` +
      `CƠ QUAN PHÁT NGÔN: ${statement.issuingAgency}\n` +
      `ĐỐI TƯỢNG HƯỚNG TỚI: ${statement.targetAudience}\n` +
      `THÔNG ĐIỆP CỐT LÕI: ${statement.keyMessage}\n\n` +
      `LUẬN ĐIỂM CHÍNH:\n${statement.keyPoints.map(p => `- ${p}`).join('\n')}\n\n` +
      `TOÀN VĂN DỰ THẢO THÔNG CÁO BÁO CHÍ:\n${statement.fullDraftText}\n\n` +
      `GỢI Ý LUẬN ĐIỂM TIẾP XÚC BÁO CHÍ CHO LÃNH ĐẠO:\n${statement.talkingPointsForLeadership.map(tp => `* ${tp}`).join('\n')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!statement) return;
    const element = document.createElement('a');
    const file = new Blob([
      `=== BỘ TÀI CHÍNH VIỆT NAM - DỰ THẢO THÔNG CÁO PHÁT NGÔN ===\n\n` +
      `Tiêu đề: ${statement.headline}\n` +
      `Đơn vị: ${statement.issuingAgency}\n` +
      `Thời gian tạo: ${new Date().toLocaleString('vi-VN')}\n\n` +
      `1. THÔNG ĐIỆP CHỈ ĐẠO:\n${statement.keyMessage}\n\n` +
      `2. CÁC ĐIỂM CỐT LÕI:\n${statement.keyPoints.join('\n')}\n\n` +
      `3. TOÀN VĂN VĂN BẢN:\n${statement.fullDraftText}\n\n` +
      `4. TALKING POINTS CHO LÃNH ĐẠO:\n${statement.talkingPointsForLeadership.join('\n')}`
    ], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Thong_cao_phat_ngon_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 z-[100] backdrop-blur-md animate-fadeIn">
      <div className="rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border-2 border-slate-200 bg-slate-950 text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-slate-200 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg border-2 border-slate-200 bg-white text-black font-black">
              {isCrisis ? <Flame className="w-5 h-5 text-black" /> : <Sparkles className="w-5 h-5 text-black" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider border border-white bg-white text-black">
                  {isCrisis ? '🚨 Xử Lý Khủng Hoảng' : '🌟 Lan Tỏa Tích Cực'}
                </span>
                <span className="text-xs font-mono text-slate-300">• CHUẨN MỰC HÀNH CHÍNH BỘ TÀI CHÍNH</span>
              </div>
              <h2 className="text-base sm:text-xl font-bold text-white tracking-wide mt-1">
                DỰ THẢO THÔNG CÁO BÁO CHÍ & ĐỀ CƯƠNG PHÁT NGÔN LÃNH ĐẠO
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg transition cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Origin Article Brief Bar */}
          <div className={`p-4 rounded-xl border space-y-2 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <SourceBrandBadge
                source={item.source}
                url={item.url}
                size="sm"
                showIcon={true}
              />
              <span className={isDark ? 'text-slate-400 font-mono' : 'text-slate-500 font-mono'}>{item.timeAgo}</span>
              <span className="text-slate-400">•</span>
              <span className={`font-semibold ${isDark ? 'text-cyan-400' : 'text-sky-700'}`}>{item.sectorNameVi}</span>
            </div>
            <h3 className={`text-sm sm:text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{item.title}</h3>
          </div>

          {/* 4 Pillars Summary for Quick Leadership Reference */}
          {directive && (
            <div className={`border rounded-xl p-4 space-y-3 ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-amber-400' : 'text-amber-700'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                  Tổng Hợp 4 Trụ Cột Báo Cáo Lãnh Đạo
                </span>
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Trực quan hóa</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className={`p-2.5 rounded-lg border ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                }`}>
                  <span className={`font-bold block mb-1 ${isDark ? 'text-cyan-400' : 'text-sky-700'}`}>1. Chuyện gì đang xảy ra:</span>
                  <p>{directive.whatHappened}</p>
                </div>

                <div className={`p-2.5 rounded-lg border ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                }`}>
                  <span className={`font-bold block mb-1 ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>2. Ở đâu / Đơn vị phụ trách:</span>
                  <p>
                    <strong className={isDark ? 'text-indigo-300' : 'text-indigo-800'}>{directive.where.primaryAgency}</strong> ({directive.where.jurisdiction})
                  </p>
                </div>

                <div className={`p-2.5 rounded-lg border ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                }`}>
                  <span className={`font-bold block mb-1 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>3. Vì sao xảy ra (Nguyên nhân):</span>
                  <p>{directive.rootCause}</p>
                </div>

                <div className={`p-2.5 rounded-lg border ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                }`}>
                  <span className={`font-bold block mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>4. Đề xuất định hướng truyền thông:</span>
                  <p>{directive.mediaStrategy.tacticalRecommendation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading or Statement Container */}
          {isLoading ? (
            <div className="py-14 flex flex-col items-center justify-center space-y-3">
              <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Hệ thống đang tổng hợp văn phong công vụ, luận điểm chỉ đạo & dự thảo thông cáo báo chí...
              </p>
            </div>
          ) : error ? (
            <div className={`p-4 rounded-xl text-xs border ${
              isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              {error}
            </div>
          ) : statement ? (
            <div className="space-y-4">
              
              {/* Tab Selector */}
              <div className={`flex items-center gap-2 border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  onClick={() => setActiveTab('statement')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'statement'
                      ? isDark
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : isDark
                        ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Toàn Văn Thông Cáo Báo Chí</span>
                </button>

                <button
                  onClick={() => setActiveTab('talkingPoints')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'talkingPoints'
                      ? isDark
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-sky-100 text-sky-900 border border-sky-300'
                      : isDark
                        ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Đề Cương Phát Ngôn & Trả Lời Phỏng Vấn (Talking Points)</span>
                </button>
              </div>

              {/* View Tab: Statement */}
              {activeTab === 'statement' ? (
                <div className="space-y-3">
                  {/* Headline & Core Message */}
                  <div className={`p-4 rounded-xl border space-y-2 ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <h4 className={`text-sm font-bold leading-snug tracking-wide uppercase ${
                      isDark ? 'text-amber-300' : 'text-amber-800'
                    }`}>
                      {statement.headline}
                    </h4>
                    <div className={`flex flex-wrap items-center gap-3 text-xs pt-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      <span><strong>Cơ quan:</strong> {statement.issuingAgency}</span>
                      <span>•</span>
                      <span><strong>Đối tượng:</strong> {statement.targetAudience}</span>
                    </div>
                    <div className={`p-3 rounded-lg border text-xs leading-relaxed font-medium ${
                      isDark
                        ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    }`}>
                      <strong>Thông điệp then chốt:</strong> {statement.keyMessage}
                    </div>
                  </div>

                  {/* Full Draft Document */}
                  <div className={`p-4 sm:p-5 rounded-xl border space-y-2 font-mono text-xs leading-relaxed whitespace-pre-wrap ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200 selection:bg-emerald-500/30'
                      : 'bg-white border-slate-300 text-slate-800 selection:bg-emerald-200'
                  }`}>
                    {statement.fullDraftText}
                  </div>
                </div>
              ) : (
                /* View Tab: Talking Points */
                <div className="space-y-3">
                  <div className={`p-4 rounded-xl border space-y-2 ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isDark ? 'text-cyan-400' : 'text-sky-800'
                    }`}>
                      <Volume2 className="w-4 h-4" />
                      Gợi Ý Phát Ngôn Trực Tiếp Cho Lãnh Đạo Khi Tiếp Xúc Báo Chí
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Các luận điểm then chốt giúp định hướng dư luận, bình ổn tâm lý thị trường và khẳng định tinh thần thượng tôn pháp luật:
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {statement.talkingPointsForLeadership.map((tp, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border flex items-start gap-3 transition ${
                          isDark
                            ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono shrink-0 ${
                          isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-sky-100 text-sky-800'
                        }`}>
                          0{idx + 1}
                        </span>
                        <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {tp}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : null}

        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!statement}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                copied
                  ? isDark ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-600 text-white'
                  : isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-xs'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-sky-600'}`} />}
              <span>{copied ? 'Đã sao chép toàn văn!' : 'Sao chép toàn bộ dự thảo'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={!statement}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
              }`}
            >
              <Download className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <span>Tải file văn bản (.txt)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              isDark
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            Hoàn tất & Đóng
          </button>
        </div>

      </div>
    </div>
  );
};

