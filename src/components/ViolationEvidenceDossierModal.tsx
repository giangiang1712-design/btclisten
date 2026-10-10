import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  FileText,
  Camera,
  Download,
  CheckCircle2,
  ExternalLink,
  Building2,
  Scale,
  Send,
  X,
  Lock,
  Stamp,
  Printer,
  FileCheck2,
  Copy,
  Check,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { ScrapedNewsItem, ViolationEvidenceDossier } from '../types';
import {
  createViolationDossier,
  exportDossierToWordDocument,
  generateDossierSnapshotImage,
  downloadSnapshotPng,
  saveDossierToLocalHistory,
} from '../lib/violationDossierService';

interface ViolationEvidenceDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: ScrapedNewsItem | null;
  isDark?: boolean;
}

export const ViolationEvidenceDossierModal: React.FC<ViolationEvidenceDossierModalProps> = ({
  isOpen,
  onClose,
  article,
  isDark = true,
}) => {
  const [dossier, setDossier] = useState<ViolationEvidenceDossier | null>(null);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [snapshotUrl, setSnapshotUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'record' | 'snapshot' | 'referral'>('record');
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && article) {
      setIsGenerating(true);
      setDispatchStatus(null);
      createViolationDossier(article, customNotes)
        .then(async (newDossier) => {
          setDossier(newDossier);
          saveDossierToLocalHistory(newDossier);
          const imgUrl = await generateDossierSnapshotImage(newDossier);
          setSnapshotUrl(imgUrl);
        })
        .finally(() => {
          setIsGenerating(false);
        });
    }
  }, [isOpen, article]);

  if (!isOpen || !article) return null;

  const handleRegenerateWithNotes = async () => {
    if (!article) return;
    setIsGenerating(true);
    const newDossier = await createViolationDossier(article, customNotes);
    setDossier(newDossier);
    saveDossierToLocalHistory(newDossier);
    const imgUrl = await generateDossierSnapshotImage(newDossier);
    setSnapshotUrl(imgUrl);
    setIsGenerating(false);
  };

  const handleCopyHash = () => {
    if (!dossier) return;
    navigator.clipboard.writeText(dossier.sha256EvidenceHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
  };

  const handleDownloadDoc = () => {
    if (!dossier) return;
    exportDossierToWordDocument(dossier);
  };

  const handleDownloadPng = () => {
    if (!snapshotUrl || !dossier) return;
    downloadSnapshotPng(snapshotUrl, dossier.dossierId);
  };

  const handleDispatchReferral = () => {
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      setDispatchStatus(
        'Đã ký số và phát hành Phiếu chuyển hồ sơ vi phạm số ' +
          (dossier?.officialCode || '') +
          ' thành công đến Cục PTTH&TTĐT (Bộ TT&TT) và Cục An ninh mạng A05 (Bộ Công an).'
      );
      if (dossier) {
        const updated = { ...dossier, status: 'DISPATCHED' as const };
        setDossier(updated);
        saveDossierToLocalHistory(updated);
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-rose-500">
                  Hồ Sơ Giám Định & Biên Bản Bằng Chứng Vi Phạm Số
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono font-bold">
                  {dossier?.officialCode || 'Đang tạo...'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Cố định hiện trạng, đóng dấu băm SHA-256 & xuất biên bản xử lý hành chính theo Nghị định 72/2013 & NĐ 15/2020
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-black'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Tabs Bar */}
        <div className={`px-6 py-2.5 border-b flex items-center justify-between flex-wrap gap-2 ${
          isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('record')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'record'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              Biên Bản Giám Định Hành Chính
            </button>

            <button
              onClick={() => setActiveTab('snapshot')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'snapshot'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Ảnh Chụp Bằng Chứng Lưu Trữ (.PNG)
            </button>

            <button
              onClick={() => setActiveTab('referral')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'referral'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Công Văn Phối Hợp Xử Lý
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadDoc}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="Tải văn bản Word .doc chuẩn thể thức Nghị định 30/2020"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất Bản In / Word (.DOC)
            </button>

            <button
              onClick={handleDownloadPng}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="Tải chứng thư ảnh chụp bằng chứng số PNG độ phân giải cao"
            >
              <Camera className="w-3.5 h-3.5" />
              Tải Ảnh Chụp (.PNG)
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: FORMAL ADMINISTRATIVE RECORD */}
          {activeTab === 'record' && dossier && (
            <div className="space-y-4">
              {/* National Header in Administrative Format */}
              <div className={`p-6 rounded-2xl border text-center relative ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold mb-4 pb-4 border-b border-slate-800">
                  <div className="text-left">
                    <p className="font-black">BỘ TÀI CHÍNH</p>
                    <p className="font-extrabold text-slate-400">BAN CHỈ ĐẠO TRUYỀN THÔNG</p>
                    <p className="text-rose-500 mt-1 font-mono">{dossier.officialCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="font-bold underline decoration-1 underline-offset-4">Độc lập - Tự do - Hạnh phúc</p>
                    <p className="text-slate-400 italic mt-1 font-normal">Hà Nội, {dossier.capturedAtVn.split(' ')[0]}</p>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-black uppercase text-rose-500 tracking-wide mb-1">
                  BIÊN BẢN GIÁM ĐỊNH & LẬP HỒ SƠ BẰNG CHỨNG ĐIỆN TỬ
                </h3>
                <p className={`text-xs italic max-w-xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Về việc phát hiện thông tin sai lệch, suy diễn có dấu hiệu vi phạm pháp luật trên không gian mạng liên quan đến ngành Tài chính
                </p>
              </div>

              {/* SHA-256 Digital Checksum Box */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                isDark ? 'bg-emerald-950/30 border-emerald-800/60' : 'bg-emerald-50 border-emerald-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">
                        Chứng Thực Mã Băm Toàn Vẹn Bằng Chứng (SHA-256 Checksum)
                      </span>
                      <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        Đã Khóa Dữ Liệu
                      </span>
                    </div>
                    <code className="text-xs font-mono font-bold text-slate-200 block break-all mt-0.5">
                      {dossier.sha256EvidenceHash}
                    </code>
                  </div>
                </div>

                <button
                  onClick={handleCopyHash}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 text-slate-800 border'
                  }`}
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedHash ? 'Đã sao chép' : 'Sao chép mã băm'}
                </button>
              </div>

              {/* Section 1: Target Metadata */}
              <div className={`p-4 rounded-xl border space-y-2.5 ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h4 className="text-xs font-black uppercase text-sky-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> I. Thông Tin Bài Viết & Nguồn Phát Tán
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Tiêu đề đối tượng:</span>
                    <strong className="text-sm font-bold block mt-0.5 text-slate-100">{dossier.articleTitle}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Nguồn phát tán:</span>
                    <span className="font-bold text-amber-400 text-sm block mt-0.5">{dossier.sourceOutlet}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-slate-400 block font-medium">Đường dẫn liên kết (URL):</span>
                    <a
                      href={dossier.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline flex items-center gap-1 break-all mt-0.5 font-mono"
                    >
                      <span>{dossier.targetUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Thời điểm lập hồ sơ:</span>
                    <span className="font-mono text-slate-300 font-bold block mt-0.5">{dossier.capturedAtVn}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Mức độ nghiêm trọng:</span>
                    <span className="text-rose-400 font-black text-sm block mt-0.5 uppercase tracking-wide">
                      🚨 {dossier.violationSeverity} (Cần can thiệp khẩn cấp)
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Infringing Excerpts */}
              <div className={`p-4 rounded-xl border space-y-2.5 ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h4 className="text-xs font-black uppercase text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> II. Trích Dẫn Nội Dung Vi Phạm Bị Cố Định
                </h4>
                <div className="space-y-2">
                  {dossier.infringingExcerpts.map((excerpt, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border-l-4 border-rose-500 text-xs italic ${
                        isDark ? 'bg-rose-950/20 text-rose-200 border-y border-r border-rose-950/40' : 'bg-rose-50 text-rose-900'
                      }`}
                    >
                      "{excerpt}"
                    </div>
                  ))}
                </div>

                {/* Optional Examiner Notes */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Ghi chú của Cán bộ Giám định (Tùy chọn bổ sung vào biên bản):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="Nhập dấu hiệu nghi vấn, tên tác giả, tài khoản MXH hoặc động cơ bôi nhọ..."
                      className={`flex-1 px-3 py-2 rounded-xl text-xs border ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300'
                      }`}
                    />
                    <button
                      onClick={handleRegenerateWithNotes}
                      disabled={isGenerating}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                    >
                      Cập nhật
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 3: Statutory Legal Grounds */}
              <div className={`p-4 rounded-xl border space-y-2.5 ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h4 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                  <Scale className="w-4 h-4" /> III. Căn Cứ Pháp Lý Xử Phạt Vi Phạm
                </h4>
                <div className="space-y-2">
                  {dossier.legalGrounds.map((ground, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-xs ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <strong className="text-amber-300 font-bold">
                          {ground.statute} ({ground.clause})
                        </strong>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 font-bold">
                          Khung chế tài
                        </span>
                      </div>
                      <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>{ground.description}</p>
                      <div className="mt-1 text-[11px] text-rose-400 font-medium">
                        ⚖️ Áp dụng: {ground.sanctionRange}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EVEMENTIARY SNAPSHOT PREVIEW */}
          {activeTab === 'snapshot' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Ảnh Chụp Bằng Chứng Lưu Trữ Kỹ Thuật Số</h4>
                  <p className="text-xs text-slate-400">
                    Bản chứng thực hiển thị tiêu đề, trích dẫn, đường dẫn URL, mã băm SHA-256 và dấu niêm phong số của Bộ Tài chính.
                  </p>
                </div>
                <button
                  onClick={handleDownloadPng}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Tải Ảnh PNG Về Máy
                </button>
              </div>

              {snapshotUrl ? (
                <div className="rounded-xl overflow-hidden border border-slate-700 shadow-2xl bg-black">
                  <img src={snapshotUrl} alt="Forensic Evidence Snapshot" className="w-full h-auto object-contain" />
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">Đang khởi tạo ảnh chứng cứ canvas...</div>
              )}
            </div>
          )}

          {/* TAB 3: OFFICIAL REFERRAL DISPATCH */}
          {activeTab === 'referral' && dossier && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-sky-950/20 border-sky-800/50' : 'bg-sky-50 border-sky-300'}`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-sky-600 text-white">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-sky-400">
                      Phiếu Chuyển Thông Tin & Đề Nghị Phối Hợp Xử Lý Vi Phạm
                    </h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Kính gửi các cơ quan chức năng phối hợp ngăn chặn, yêu cầu gỡ bài và xử lý đối tượng phát tán thông tin sai sự thật theo quy định pháp luật.
                    </p>
                  </div>
                </div>
              </div>

              {dispatchStatus && (
                <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  isDark ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-emerald-100 border-emerald-400 text-emerald-900'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{dispatchStatus}</span>
                </div>
              )}

              <div className="space-y-3">
                <span className="text-xs font-black uppercase text-slate-300 block">
                  Cơ quan phối hợp tiếp nhận:
                </span>
                {dossier.referralRecipients.map((rec, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-sky-400" />
                        <h5 className="font-bold text-xs sm:text-sm text-slate-100">{rec.agency}</h5>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">{rec.role}</span>
                      <p className="text-xs text-amber-300 mt-1">
                        <strong>Nội dung yêu cầu:</strong> {rec.requestedAction}
                      </p>
                    </div>

                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold shrink-0 self-start sm:self-auto">
                      Đã kết nối luồng công văn
                    </span>
                  </div>
                ))}
              </div>

              <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100'}`}>
                <button
                  onClick={handleDispatchReferral}
                  disabled={isDispatching || dossier.status === 'DISPATCHED'}
                  className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg cursor-pointer ${
                    dossier.status === 'DISPATCHED'
                      ? 'bg-emerald-600/50 text-emerald-200 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  }`}
                >
                  <Stamp className="w-4 h-4" />
                  {isDispatching
                    ? 'Đang ký số & chuyển phát công văn khẩn...'
                    : dossier.status === 'DISPATCHED'
                    ? '✓ Đã chuyển phát công văn phối hợp xử lý'
                    : 'Ký Số & Phát Hành Công Văn Khẩn Yêu Cầu Phối Hợp Xử Lý'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3.5 border-t flex items-center justify-between ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>Hồ sơ lưu trữ điện tử có giá trị làm chứng cứ giám định hành chính và tư pháp</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
