import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Clock,
  Building2,
  FileText,
  ExternalLink,
  Download,
  Mail,
  Copy,
  Check,
  Compass,
  AlertOctagon,
  Sparkles,
  Info,
  RefreshCw,
  TrendingUp,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { ScrapedNewsItem, formatNewsFullDateTime, DeepDiveAnalysis } from '../types';
import { decodeHtmlEntities, cleanHtmlTitle } from '../lib/htmlDecoder';
import { fetchDeepDiveAnalysis } from '../services/api';
import { extractQuantitativeBreakdown } from './QuantitativeFormulaBreakdown';
import {
  calculate3DayTopicFrequency,
  isDistantWarningWeakSignal,
  getDirectiveTier
} from '../lib/policyFrictionEngine';

interface ExecutiveDirectiveDetailModalProps {
  article: ScrapedNewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  isHandled: boolean;
  onToggleHandled: (articleId: string) => void;
  onOpenGmailAlertModal?: (article: ScrapedNewsItem) => void;
  onDraftStatement?: (article: ScrapedNewsItem) => void;
  allArticles?: ScrapedNewsItem[];
  isDark?: boolean;
}

export const ExecutiveDirectiveDetailModal: React.FC<ExecutiveDirectiveDetailModalProps> = ({
  article,
  isOpen,
  onClose,
  isHandled,
  onToggleHandled,
  onOpenGmailAlertModal,
  onDraftStatement,
  allArticles = [],
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<DeepDiveAnalysis | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  React.useEffect(() => {
    setAiAnalysis(null);
    setAiError(null);
  }, [article?.id]);

  if (!isOpen || !article) return null;

  const handleTriggerAiDeepDive = async () => {
    if (!article) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const res = await fetchDeepDiveAnalysis({
        title: article.title,
        summary: article.summary || article.snippet || '',
        sector: article.sectorNameVi || 'Tài chính',
        tickers: article.tickers || [],
      });
      setAiAnalysis(res);
    } catch (err: any) {
      setAiError(err.message || 'Không thể kết nối Tham khảo AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const cleanTitle = cleanHtmlTitle(article.title, article.summary || article.snippet);
  const agency = article.agencies?.[0] || article.source || 'Bộ Tài chính';
  const publishedTime = formatNewsFullDateTime(article);
  const breakdown = extractQuantitativeBreakdown(article);
  const freqInfo = calculate3DayTopicFrequency(article, allArticles);
  const distantSignal = isDistantWarningWeakSignal(article.title, article.summary || article.snippet || '');

  // Phân cấp chuẩn theo yêu cầu Lãnh đạo:
  // - C4: Khẩn cấp (SLA 2-4h)
  // - C3: Trọng yếu (SLA 12h)
  // - C1, C2: Chỉ để ở mức Theo dõi & Phòng ngừa (Cảnh báo xa / Cảnh báo sớm)
  const tier = getDirectiveTier(article);
  const levelType: 'C4' | 'C3' | 'C1_C2' =
    tier === 'C4' ? 'C4' : tier === 'C3' ? 'C3' : 'C1_C2';

  // 1. PHẦN 1: KHOẢNG TRỐNG THÔNG TIN CẦN LÀM RÕ (SINH BỞI AI)
  const informationGapContent =
    article.informationVacuum?.clarificationNeeded ||
    article.mediaGap?.informationDeficit ||
    article.mediaGap?.topicConcern ||
    (article.hasInformationGap
      ? 'Dư luận và báo chí đang phản ánh độ vênh giữa kỳ vọng thực thi thực tế với quy định hiện hành, thiếu dữ liệu hướng dẫn cụ thể từ cơ quan quản lý.'
      : distantSignal.isDistant
      ? distantSignal.reason || 'Bài viết có tính chất lấp lửng, cách hiểu chưa thống nhất hoặc chính sách mới ban hành có nhiều điểm mới gây bỡ ngỡ, lúng túng khi thực thi.'
      : 'Cần làm rõ số liệu thực tế, thẩm quyền giải quyết và tiến độ xử lý văn bản quy phạm pháp luật liên quan để tránh dư luận suy diễn tiêu cực.');

  // 2. PHẦN 2: ĐỀ XUẤT CAN THIỆP (SINH BỞI AI)
  const interventionContent =
    article.policyResponseAdvisor ||
    article.executiveDirective?.mediaStrategy?.tacticalRecommendation ||
    article.informationVacuum?.recommendedClosureAction ||
    article.mediaGap?.proactiveGovAction?.campaignTitle ||
    (levelType === 'C4'
      ? 'Phát ngôn khẩn cấp trong 2–4 giờ, chủ động cung cấp thông tin chính thống để dập tắt tin đồn; giao Thanh tra và Cục/Vụ chuyên môn rà soát thực tế.'
      : levelType === 'C3'
      ? 'Phát hành thông cáo báo chí hoặc văn bản hướng dẫn nghiệp vụ trong ngày (12 giờ) để định hướng dư luận; chỉ đạo giải quyết dứt điểm vướng mắc.'
      : 'Giao Vụ Pháp chế và đơn vị chuyên ngành theo dõi diễn biến (24–48 giờ), chuẩn bị sẵn kịch bản hỏi đáp (Q&A) phòng ngừa phát sinh khủng hoảng.');

  // 3. PHẦN 3: CHI TIẾT TIN TỨC
  const detailNewsContent = article.summary || article.snippet || cleanTitle;

  // XUẤT RA GIẢI PHÁP (Tải file text & sao chép clipboard)
  const handleExportSolution = () => {
    const levelLabel =
      levelType === 'C4'
        ? 'CẤP 4: KHẨN CẤP (SLA: 2–4 Giờ)'
        : levelType === 'C3'
        ? 'CẤP 3: TRỌNG YẾU (SLA: 12 Giờ / Tần suất 3 ngày: ' + freqInfo.frequency + ' bài)'
        : 'CẤP 1–CẤP 2: THEO DÕI & PHÒNG NGỪA (Cảnh báo xa)';

    const solutionDocument = `===============================================================
BÁO CÁO PHƯƠNG ÁN CHỈ ĐẠO & XỬ LÝ (TỔNG HỢP BỞI AI)
BỘ TÀI CHÍNH - HỆ THỐNG GIÁM SÁT TRUYỀN THÔNG VÀ ĐIỀU HÀNH
===============================================================

TIÊU ĐỀ BÀI VIẾT: ${cleanTitle}
NGUỒN BÁO CHÍ: ${article.source || 'Báo chí'} | THỜI GIAN: ${publishedTime}
PHÂN CẤP XỬ LÝ: ${levelLabel}
TRẠNG THÁI HIỆN TẠI: ${isHandled ? 'ĐÃ XỬ LÝ HOÀN THIỆN' : 'CHỜ XỬ LÝ'}

---------------------------------------------------------------
1. KHOẢNG TRỐNG THÔNG TIN CẦN LÀM RÕ:
---------------------------------------------------------------
${informationGapContent}

---------------------------------------------------------------
2. ĐỀ XUẤT CAN THIỆP & HƯỚNG XỬ LÝ:
---------------------------------------------------------------
${interventionContent}

Đơn vị chủ trì tham mưu: ${agency}
Thời hạn SLA tác chiến: ${levelType === 'C4' ? 'Hỏa tốc 2 - 4 giờ' : levelType === 'C3' ? 'Trong vòng 12 giờ' : 'Theo dõi 24 - 48 giờ'}

---------------------------------------------------------------
3. CHI TIẾT TIN TỨC:
---------------------------------------------------------------
${detailNewsContent}
Đường dẫn bài viết: ${article.url || 'N/A'}

===============================================================
Ngày xuất báo cáo: ${new Date().toLocaleString('vi-VN')}
Trạng thái phê duyệt: ${isHandled ? '✓ ĐÃ PHÊ DUYỆT & HOÀN TẤT' : 'CHỜ LÃNH ĐẠO CHỈ ĐẠO'}
===============================================================`;

    // 1. Sao chép vào Clipboard
    navigator.clipboard.writeText(solutionDocument).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });

    // 2. Tải về file text
    const blob = new Blob([solutionDocument], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GIAI_PHAP_CHI_DAO_${article.id.slice(0, 8)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // GỬI EMAIL VỀ HƯỚNG XỬ NẾU THÔNG TIN ĐÓ QUAN TRỌNG
  const handleSendEmail = () => {
    if (onOpenGmailAlertModal) {
      onOpenGmailAlertModal(article);
    } else {
      const subject = encodeURIComponent(`[CHỈ ĐẠO KHẨN MOF] Hướng xử lý: ${cleanTitle}`);
      const body = encodeURIComponent(
        `Kính gửi Lãnh đạo và Đơn vị chuyên môn (${agency}),\n\n` +
        `Về tin bài: "${cleanTitle}" (${article.source} - ${publishedTime})\n\n` +
        `1. KHOẢNG TRỐNG THÔNG TIN CẦN LÀM RÕ:\n${informationGapContent}\n\n` +
        `2. ĐỀ XUẤT CAN THIỆP & HƯỚNG XỬ LÝ:\n${interventionContent}\n\n` +
        `Yêu cầu đơn vị chủ trì khẩn trương thực hiện theo thẩm quyền và báo cáo Lãnh đạo Bộ.\n`
      );
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white text-slate-900 shadow-2xl border-2 border-slate-300 overflow-hidden">
        {/* MODAL HEADER */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              levelType === 'C4'
                ? 'bg-rose-700 text-white shadow-xs'
                : levelType === 'C3'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-800 text-white shadow-xs'
            }`}>
              {levelType === 'C4' ? (
                <AlertOctagon className="w-5 h-5 text-white animate-pulse" />
              ) : levelType === 'C3' ? (
                <Zap className="w-5 h-5 text-white" />
              ) : (
                <Clock className="w-5 h-5 text-white" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {levelType === 'C4' && (
                  <span className="px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider bg-rose-700 text-white shadow-2xs">
                    🚨 TIN KHẨN CẤP (C4)
                  </span>
                )}
                {levelType === 'C3' && (
                  <span className="px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider bg-amber-600 text-white shadow-2xs">
                    ⚡ TIN TRỌNG YẾU (C3)
                  </span>
                )}
                {levelType === 'C1_C2' && (
                  <span className="px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider bg-slate-700 text-white shadow-2xs">
                    📌 THEO DÕI & PHÒNG NGỪA (C1 - C2)
                  </span>
                )}

                <span className="text-xs font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                  {agency}
                </span>

                <span className="text-xs font-mono font-bold text-slate-500">
                  {publishedTime}
                </span>

                {freqInfo.frequency > 1 && (
                  <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    3 ngày qua: {freqInfo.frequency} bài cùng chủ đề
                  </span>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-950 mt-1 line-clamp-2 leading-snug">
                {cleanTitle}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 PHẦN CHÍNH YẾU SINH BỞI AI ĐỂ LÃNH ĐẠO NẮM BẮT */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* PHẦN 1: KHOẢNG TRỐNG THÔNG TIN CẦN LÀM RÕ */}
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50/70 p-4 sm:p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-950">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
              <h4 className="text-sm font-black uppercase tracking-wide">
                1. Khoảng trống thông tin cần làm rõ
              </h4>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900 ml-auto border border-amber-300">
                AI Phân Tích
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-amber-950 leading-relaxed pl-7">
              {informationGapContent}
            </p>
          </div>

          {/* PHẦN 2: ĐỀ XUẤT CAN THIỆP */}
          <div className="rounded-xl border-2 border-slate-900 bg-slate-900 text-white p-4 sm:p-5 shadow-md space-y-2">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <h4 className="text-sm font-black uppercase tracking-wide text-amber-400">
                2. Đề xuất can thiệp & Hướng xử lý
              </h4>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-300 ml-auto border border-slate-700">
                AI Tham Mưu
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed pl-7">
              {interventionContent}
            </p>
            <div className="pt-2 pl-7 flex items-center gap-3 text-xs font-mono text-slate-300 flex-wrap">
              <span>Đơn vị chủ trì: <strong className="text-white">{agency}</strong></span>
              <span>•</span>
              <span>Thời hạn SLA: <strong className="text-amber-400">{levelType === 'C4' ? '2 – 4 giờ' : levelType === 'C3' ? '12 giờ' : '24 – 48 giờ'}</strong></span>
            </div>
          </div>

          {/* TÍCH HỢP TRỰC TIẾP AI (GEMINI): PHÂN TÍCH CHUYÊN SÂU & KIẾN NGHỊ TÁC CHIẾN */}
          <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/60 p-4 sm:p-5 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-700 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide text-indigo-950 flex items-center gap-1.5">
                    <span>Trợ Lý Tham Mưu (Tham khảo AI)</span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                      Tác Chiến Thời Gian Thực
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Phân tích phản ứng mạng xã hội, tin đồn, tác động thị trường và kịch bản can thiệp
                  </p>
                </div>
              </div>

              <button
                onClick={handleTriggerAiDeepDive}
                disabled={isAiLoading}
                className="px-3.5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50"
              >
                {isAiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                <span>{isAiLoading ? 'AI Đang Phân Tích...' : aiAnalysis ? 'Phân Tích Lại Bằng AI' : 'Kích Hoạt AI Phân Tích Chuyên Sâu'}</span>
              </button>
            </div>

            {aiError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {aiError}
              </div>
            )}

            {aiAnalysis && (
              <div className="space-y-3 pt-2 text-xs border-t border-indigo-200/80 animate-fadeIn">
                {/* Tóm tắt điều hành */}
                <div className="p-3 rounded-xl bg-white border border-indigo-200 text-slate-800 space-y-1">
                  <span className="font-black text-indigo-900 block uppercase text-[11px]">Bản chất sự kiện & Góc nhìn chiến lược:</span>
                  <p className="font-semibold leading-relaxed">{aiAnalysis.executiveSummary}</p>
                </div>

                {/* Tác động thị trường & Mạng xã hội */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-black text-slate-900 block text-[11px] flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                      Tác động thị trường tài chính:
                    </span>
                    <p className="text-slate-700 font-medium"><strong>Ngắn hạn:</strong> {aiAnalysis.marketImpact?.shortTerm}</p>
                    <p className="text-slate-700 font-medium"><strong>Trung hạn:</strong> {aiAnalysis.marketImpact?.mediumTerm}</p>
                    {aiAnalysis.marketImpact?.affectedAssets && aiAnalysis.marketImpact.affectedAssets.length > 0 && (
                      <p className="text-[11px] text-indigo-700 font-bold pt-0.5">
                        Tài sản/Mã chịu ảnh hưởng: {aiAnalysis.marketImpact.affectedAssets.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-black text-slate-900 block text-[11px] flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                      Phản ứng cộng đồng & Tin đồn:
                    </span>
                    <p className="text-slate-700 font-medium"><strong>Tâm lý nhà đầu tư:</strong> {aiAnalysis.socialSentimentAnalysis?.communityReaction}</p>
                    <p className="text-slate-700 font-medium"><strong>Điểm đồn đoán/tranh cãi:</strong> {aiAnalysis.socialSentimentAnalysis?.rumorsOrDebates}</p>
                  </div>
                </div>

                {/* Khuyến nghị can thiệp */}
                {aiAnalysis.recommendations && (
                  <div className="p-3 rounded-xl bg-indigo-950 text-white space-y-1.5">
                    <span className="font-black text-amber-400 block text-[11px] flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      Khuyến nghị chỉ đạo Lãnh đạo Bộ:
                    </span>
                    <p className="text-slate-100 font-medium">{aiAnalysis.recommendations.investorAction}</p>
                    {aiAnalysis.recommendations.riskWatchouts && aiAnalysis.recommendations.riskWatchouts.length > 0 && (
                      <ul className="list-disc list-inside text-[11px] text-slate-300 pt-1 space-y-0.5">
                        {aiAnalysis.recommendations.riskWatchouts.map((rw, i) => (
                          <li key={i}>{rw}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PHẦN 3: CHI TIẾT TIN */}
          <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 sm:p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-900">
              <FileText className="w-5 h-5 text-slate-700 shrink-0" />
              <h4 className="text-sm font-black uppercase tracking-wide">
                3. Chi tiết tin
              </h4>
              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 ml-auto cursor-pointer"
                >
                  <span>Xem nguồn báo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed pl-7">
              {detailNewsContent}
            </p>
            {article.keyPoints && article.keyPoints.length > 0 && (
              <div className="pt-2 pl-7 space-y-1">
                <span className="text-xs font-black text-slate-700 uppercase">Các luận điểm cốt lõi:</span>
                <ul className="list-disc list-inside text-xs font-medium text-slate-700 space-y-0.5">
                  {article.keyPoints.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER: HÀNH ĐỘNG CỦA LÃNH ĐẠO */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* TÍCH VÀO "ĐÃ XỬ LÝ" */}
          <label className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border-2 transition cursor-pointer select-none ${
            isHandled
              ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800 shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300 shadow-2xs'
          }`}>
            <input
              type="checkbox"
              checked={isHandled}
              onChange={() => onToggleHandled(article.id)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-black">
              {isHandled ? '✓ Đã đọc & xử lý hoàn thiện' : 'Tích vào: Đã xử lý'}
            </span>
          </label>

          {/* NHÓM NÚT XUẤT GIẢI PHÁP VÀ GỬI EMAIL */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* NÚT XUẤT RA GIẢI PHÁP */}
            <button
              onClick={handleExportSolution}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Xuất văn bản giải pháp chỉ đạo & tải file về máy"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4 text-white" />}
              <span>{copied ? 'Đã sao chép & Tải file' : 'Xuất giải pháp'}</span>
            </button>

            {/* NÚT GỬI EMAIL VỀ HƯỚNG XỬ NẾU THÔNG TIN ĐÓ QUAN TRỌNG */}
            <button
              onClick={handleSendEmail}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                levelType === 'C4'
                  ? 'bg-rose-700 hover:bg-rose-800 text-white ring-2 ring-rose-500/50'
                  : levelType === 'C3'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-400/50'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-900 border border-slate-300'
              }`}
              title={
                levelType === 'C4' || levelType === 'C3'
                  ? 'Gửi email báo cáo / chỉ đạo khẩn cấp về hướng xử lý cho Lãnh đạo và đơn vị chủ trì'
                  : 'Gửi email trao đổi về hướng xử lý'
              }
            >
              <Mail className="w-4 h-4" />
              <span>Gửi email hướng xử lý</span>
            </button>

            {onDraftStatement && (
              <button
                onClick={() => {
                  onClose();
                  onDraftStatement(article);
                }}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition cursor-pointer hidden md:flex items-center gap-1"
                title="Soạn thảo thông cáo báo chí hoặc văn bản chỉ đạo"
              >
                <span>Dự thảo phát ngôn</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-300 hover:bg-slate-400 text-slate-900 text-xs font-bold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
