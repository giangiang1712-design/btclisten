import React, { useState, useEffect } from 'react';
import { ScrapedNewsItem, PolicyAdvisorySubmission } from '../types';
import { fetchPolicyAdvisorySubmission } from '../services/api';
import { useTheme } from '../lib/theme';
import {
  X,
  FileCheck2,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  Download,
  Loader2,
  ShieldAlert,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
} from 'lucide-react';

interface PolicySubmissionModalProps {
  item: ScrapedNewsItem | null;
  onClose: () => void;
}

export const PolicySubmissionModal: React.FC<PolicySubmissionModalProps> = ({ item, onClose }) => {
  const { isDark } = useTheme();
  const [submission, setSubmission] = useState<PolicyAdvisorySubmission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedDirective, setCopiedDirective] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'submission' | 'options' | 'directive'>('submission');

  useEffect(() => {
    if (!item) {
      setSubmission(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const directive = item.executiveDirective;
    const agency = directive?.where?.primaryAgency || directive?.whereEntity || item.agencies?.[0] || 'BTC';
    const whatHappened = directive?.whatHappened || item.title;
    const rootCause = directive?.rootCause || 'Diễn biến thị trường và bối cảnh kinh tế vĩ mô.';

    fetchPolicyAdvisorySubmission({
      title: item.title,
      summary: item.summary,
      sector: item.sectorNameVi,
      agency,
      whatHappened,
      rootCause,
    })
      .then((data) => {
        if (isMounted) {
          setSubmission(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Không thể lập Báo cáo Tham mưu Tờ trình.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [item]);

  if (!item) return null;

  const handleCopyFullText = () => {
    if (!submission) return;
    const textToCopy = `=====================================================
${submission.documentHeader.issuingMinistry}
${submission.documentHeader.officeUnit}
${submission.documentHeader.dateString}

${submission.documentHeader.documentTitle}
[ĐỘ KHẨN: ${submission.documentHeader.urgencyLevel}]
=====================================================

I. TÓM TẮT DÀNH CHO LÃNH ĐẠO BỘ:
${submission.executiveSummary}

II. NHẬN DIỆN VẤN ĐỀ & ĐÁNH GIÁ RỦI RO (ĐIỂM RỦI RO: ${submission.problemIdentification.riskScore}/100 - MỨC ${submission.problemIdentification.riskLevel.toUpperCase()}):
- Bản chất vấn đề: ${submission.problemIdentification.coreIssue}
- Các lĩnh vực bị tác động: ${submission.problemIdentification.affectedDomains.join(', ')}
- Nguyên nhân gốc rễ:
${submission.problemIdentification.rootCauses.map((rc, i) => `  ${i + 1}. ${rc}`).join('\n')}

III. ĐÁNH GIÁ TÁC ĐỘNG TỔNG HỢP:
1. Tác động Ngân sách & Thu chi tài khóa: ${submission.impactAssessment.fiscalBudgetImpact}
2. Tác động Thị trường Tài chính & Dòng tiền: ${submission.impactAssessment.marketFinancialImpact}
3. Tác động Dư luận & Truyền thông: ${submission.impactAssessment.publicOpinionImpact}

IV. ĐỀ XUẤT CÁC PHƯƠNG ÁN XỬ LÝ:
${submission.strategicActionOptions.map(opt => `
* ${opt.optionCode}: ${opt.optionName} ${opt.isRecommendedOption ? '[ĐỀ XUẤT LỰA CHỌN]' : ''}
  - Mô tả: ${opt.description}
  - Ưu điểm: ${opt.pros.join('; ')}
  - Hạn chế: ${opt.cons.join('; ')}
  - Kiểm soát rủi ro: ${opt.riskMitigation}
`).join('\n')}

V. KHUYẾN NGHỊ VÀ KẾ HOẠCH HÀNH ĐỘNG CỦA TỔ THAM MƯU:
- Đề xuất lựa chọn: ${submission.finalLeadershipRecommendation.recommendedOptionCode}
- Lý do căn cứ: ${submission.finalLeadershipRecommendation.justification}
- Kế hoạch triển khai khẩn:
${submission.finalLeadershipRecommendation.immediateActionPlan.map(ap => `  + ${ap}`).join('\n')}
- Phân công nhiệm vụ cụ thể:
${submission.finalLeadershipRecommendation.assignedUnits.map(au => `  + ${au.agencyName} (${au.deadline}): ${au.taskDescription}`).join('\n')}

VI. DỰ THẢO CÔNG VĂN HỎA TỐC CHỈ ĐẠO CỦA LÃNH ĐẠO BỘ:
${submission.draftOfficialDirectiveText}
`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyDirective = () => {
    if (!submission) return;
    navigator.clipboard.writeText(submission.draftOfficialDirectiveText);
    setCopiedDirective(true);
    setTimeout(() => setCopiedDirective(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!submission) return;
    const element = document.createElement('a');
    const file = new Blob([submission.draftOfficialDirectiveText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `To_Trinh_Tham_Muu_Bo_Tai_Chinh_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 z-[100] backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-xl shadow-2xl overflow-hidden border-2 border-slate-200 bg-slate-950 text-slate-100"
      >
        {/* Header Modal */}
        <div className="px-6 py-4 border-b-2 border-slate-200 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-white text-black font-black border-2 border-slate-200">
              <FileCheck2 className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-black tracking-wider uppercase rounded bg-white text-black border border-white">
                  THƯỢNG KHẨN
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  TỜ TRÌNH THAM MƯU CHÍNH SÁCH THỜI THỰC
                </span>
              </div>
              <h3 className="text-xl font-bold text-white line-clamp-1 mt-1 tracking-wide">
                BÁO CÁO THAM MƯU LÃNH ĐẠO BỘ TÀI CHÍNH
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        {submission && !isLoading && (
          <div className={`flex border-b px-6 py-2 gap-2 text-xs font-semibold ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50/80 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveTab('submission')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'submission'
                  ? 'bg-amber-500 text-white shadow-sm font-bold'
                  : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              1. Tờ trình & Nhận diện Vấn đề
            </button>
            <button
              onClick={() => setActiveTab('options')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'options'
                  ? 'bg-amber-500 text-white shadow-sm font-bold'
                  : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              2. Kịch bản & Khuyến nghị Phương án
            </button>
            <button
              onClick={() => setActiveTab('directive')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'directive'
                  ? 'bg-amber-500 text-white shadow-sm font-bold'
                  : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Send className="w-4 h-4" />
              3. Dự thảo Công văn Hỏa tốc
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Tổ Chuyên gia AI đang phân tích dữ liệu & lập Báo cáo Tham mưu...
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Đánh giá đa chiều tác động Ngân sách, Thị trường, Dư luận và Xây dựng Kịch bản chỉ đạo.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : submission ? (
            <>
              {/* TAB 1: TỜ TRÌNH & NHẬN DIỆN VẤN ĐỀ */}
              {activeTab === 'submission' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Quôc hiệu & Tiêu ngữ Tiêu chuẩn */}
                  <div className={`p-5 rounded-xl border text-center font-serif space-y-1 ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-amber-50/40 border-amber-200/60'
                  }`}>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      {submission.documentHeader.issuingMinistry} - {submission.documentHeader.officeUnit}
                    </p>
                    <h2 className="text-base font-bold uppercase text-slate-900 dark:text-white mt-1">
                      {submission.documentHeader.documentTitle}
                    </h2>
                    <p className="text-xs italic text-slate-500">
                      {submission.documentHeader.dateString} - Mức độ khẩn: <span className="font-bold text-red-600">{submission.documentHeader.urgencyLevel}</span>
                    </p>
                  </div>

                  {/* Tóm tắt điều hành */}
                  <div className={`p-4 rounded-xl border space-y-2 ${
                    isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50/80 border-amber-200'
                  }`}>
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      Tóm tắt Báo cáo cho Lãnh đạo Bộ
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                      {submission.executiveSummary}
                    </p>
                  </div>

                  {/* Khung Nhận diện Vấn đề & Điểm Rủi ro */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-xl border md:col-span-2 space-y-3 ${
                      isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Bản chất Cốt lõi & Lĩnh vực bị tác động
                      </h4>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {submission.problemIdentification.coreIssue}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {submission.problemIdentification.affectedDomains.map((domain, idx) => (
                          <span key={idx} className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            {domain}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center space-y-2 ${
                      submission.problemIdentification.riskScore >= 75
                        ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                    }`}>
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Chỉ số Rủi ro Thể chế
                      </span>
                      <div className="text-3xl font-extrabold font-mono">
                        {submission.problemIdentification.riskScore}<span className="text-sm font-normal text-slate-500">/100</span>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/60 dark:bg-slate-900/60 uppercase">
                        Mức rủi ro: {submission.problemIdentification.riskLevel}
                      </span>
                    </div>
                  </div>

                  {/* Nguyên nhân gốc rễ */}
                  <div className={`p-4 rounded-xl border space-y-2 ${
                    isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Nguyên nhân Gốc rễ & Bối cảnh Thực tế
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {submission.problemIdentification.rootCauses.map((cause, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="font-bold text-amber-500 shrink-0">•</span>
                          <span>{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Đánh giá Tác động Ngân sách / Thị trường / Dư luận */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Đánh giá Tác động Đa chiều
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className={`p-3.5 rounded-xl border space-y-1 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="font-bold text-blue-600 dark:text-blue-400">1. Ngân sách & Tài khóa:</span>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{submission.impactAssessment.fiscalBudgetImpact}</p>
                      </div>
                      <div className={`p-3.5 rounded-xl border space-y-1 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="font-bold text-purple-600 dark:text-purple-400">2. Thị trường & Dòng tiền:</span>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{submission.impactAssessment.marketFinancialImpact}</p>
                      </div>
                      <div className={`p-3.5 rounded-xl border space-y-1 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="font-bold text-amber-600 dark:text-amber-400">3. Dư luận & Truyền thông:</span>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{submission.impactAssessment.publicOpinionImpact}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SO SÁNH PHƯƠNG ÁN & KHUYẾN NGHỊ */}
              {activeTab === 'options' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      So sánh Các Kịch bản & Phương án Xử lý
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {submission.strategicActionOptions.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border space-y-3 transition-all ${
                            opt.isRecommendedOption
                              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5'
                              : isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                              {opt.optionCode}
                            </span>
                            {opt.isRecommendedOption && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500 text-white flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Đề xuất Lựa chọn
                              </span>
                            )}
                          </div>
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                            {opt.optionName}
                          </h5>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {opt.description}
                          </p>
                          <div className="space-y-1.5 text-xs pt-1">
                            <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                              <span className="font-bold">✓ Ưu điểm:</span> {opt.pros.join('; ')}
                            </div>
                            <div className="text-red-500 dark:text-red-400 font-medium">
                              <span className="font-bold">✗ Hạn chế:</span> {opt.cons.join('; ')}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 italic">
                              <span className="font-bold not-italic">🛡️ Kiểm soát rủi ro:</span> {opt.riskMitigation}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lựa chọn Cuối cùng & Phân công Công tác */}
                  <div className={`p-5 rounded-xl border space-y-4 ${
                    isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4" />
                        Kết luận Khuyến nghị của Tổ Tham mưu
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Lựa chọn: {submission.finalLeadershipRecommendation.recommendedOptionCode}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        "{submission.finalLeadershipRecommendation.justification}"
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Phân công Nhiệm vụ & Hạn hoàn thành cho các Đơn vị
                      </h5>
                      <div className="space-y-2">
                        {submission.finalLeadershipRecommendation.assignedUnits.map((au, i) => (
                          <div key={i} className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                          }`}>
                            <div className="space-y-0.5">
                              <span className="font-bold text-amber-600 dark:text-amber-400">{au.agencyName}</span>
                              <p className="text-slate-700 dark:text-slate-300">{au.taskDescription}</p>
                            </div>
                            <span className="px-2 py-1 font-mono font-bold rounded bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {au.deadline}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DỰ THẢO CÔNG VĂN HỎA TỐC */}
              {activeTab === 'directive' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <Send className="w-4 h-4 text-amber-500" />
                      Dự thảo Công văn Hỏa tốc Chỉ đạo của Lãnh đạo Bộ
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyDirective}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/20 transition-all flex items-center gap-1.5"
                      >
                        {copiedDirective ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedDirective ? 'Đã chép' : 'Sao chép Công văn'}
                      </button>
                      <button
                        onClick={handleDownloadTxt}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Tải Tệp .TXT
                      </button>
                    </div>
                  </div>

                  <div className={`p-5 rounded-xl border font-mono text-xs whitespace-pre-wrap leading-relaxed ${
                    isDark ? 'bg-slate-950/80 border-slate-800 text-slate-200' : 'bg-amber-50/30 border-amber-200 text-slate-800'
                  }`}>
                    {submission.draftOfficialDirectiveText}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        {submission && !isLoading && (
          <div className={`px-6 py-4 border-t flex items-center justify-between ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/80 border-slate-200'
          }`}>
            <button
              onClick={handleCopyFullText}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all flex items-center gap-2"
            >
              {copiedText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedText ? 'Đã sao chép Toàn văn Tờ trình' : 'Sao chép Toàn văn Báo cáo & Tờ trình'}
            </button>
            <button
              onClick={onClose}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              Đóng Màn hình
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
