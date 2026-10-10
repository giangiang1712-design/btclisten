import React, { useState, useEffect } from 'react';
import { ScrapedNewsItem } from '../types';
import {
  getGmailAlertConfig,
  saveGmailAlertConfig,
  sendGmailCrisisAlert,
  requestGmailAccessToken,
  GmailAlertConfig,
} from '../lib/gmailAlertService';
import {
  Mail,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  X,
  ExternalLink,
  Sparkles,
  Lock,
  Clock,
  Key,
  Check,
} from 'lucide-react';

interface GmailAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedArticle?: ScrapedNewsItem | null;
  isDark: boolean;
}

interface AlertLogItem {
  id: string;
  recipientEmail: string;
  subject: string;
  sentAt: string;
  status: 'SUCCESS' | 'FAILED';
  alertTitle: string;
  error?: string;
  messageId?: string;
}

export const GmailAlertModal: React.FC<GmailAlertModalProps> = ({
  isOpen,
  onClose,
  selectedArticle,
  isDark,
}) => {
  const [config, setConfig] = useState<GmailAlertConfig>(getGmailAlertConfig());
  const [customNote, setCustomNote] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    message?: string;
    simulated?: boolean;
    error?: string;
  } | null>(null);
  const [logs, setLogs] = useState<AlertLogItem[]>([]);
  const [activeTab, setActiveTab] = useState<'send' | 'settings' | 'logs'>('send');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getGmailAlertConfig());
      fetchLogs();
    }
  }, [isOpen]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/gmail/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('Failed to fetch Gmail alert logs:', err);
    }
  };

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    saveGmailAlertConfig(config);
    setSendResult({
      success: true,
      message: 'Cấu hình Gmail Cảnh báo đã được lưu thành công.',
    });
  };

  const handleAuthenticateOAuth = () => {
    setIsAuthenticating(true);
    requestGmailAccessToken(
      (token) => {
        setIsAuthenticating(false);
        const updated = getGmailAlertConfig();
        setConfig(updated);
        setSendResult({
          success: true,
          message: 'Xác thực Google Gmail OAuth thành công! Hệ thống sẵn sàng gửi email cảnh báo thực tế.',
        });
      },
      (err) => {
        setIsAuthenticating(false);
        setSendResult({
          success: false,
          error: typeof err === 'string' ? err : 'Không thể hoàn tất xác thực OAuth. Kiểm tra cài đặt tài khoản.',
        });
      }
    );
  };

  const handleSendAlertEmail = async () => {
    setIsSending(true);
    setSendResult(null);

    const result = await sendGmailCrisisAlert({
      article: selectedArticle || undefined,
      alertTitle: selectedArticle?.title || 'Cảnh báo rủi ro & khủng hoảng khẩn cấp BTC',
      alertSeverity: 'CRITICAL',
      customNote,
      recipientEmail: config.recipientEmail,
    });

    setIsSending(false);
    if (result.success) {
      setSendResult({
        success: true,
        message: result.simulated
          ? 'Đã phát email cảnh báo (Chế độ xem trước). Hãy bấm "Xác thực Gmail OAuth" để gửi email thực tế vào hộp thư Gmail.'
          : `Đã gửi Gmail cảnh báo thành công tới ${config.recipientEmail}! Mã thư: ${result.messageId || 'OK'}`,
        simulated: result.simulated,
      });
      fetchLogs();
    } else {
      setSendResult({
        success: false,
        error: result.error || 'Gửi email thất bại',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden max-h-[90vh] ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-rose-900/30 via-slate-900 to-emerald-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600/20 text-rose-500 border border-rose-500/30">
              <Mail className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Tự Động Gửi Gmail Cảnh Báo Khẩn Cấp
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Google Gmail OAuth
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Gửi email thông báo tức thì tới Gmail khi phát hiện điểm nóng hoặc rủi ro nghiêm trọng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 border-b px-4 pt-3 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <button
            onClick={() => setActiveTab('send')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'send'
                ? 'border-rose-500 text-rose-500 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi Cảnh Báo Gmail</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'settings'
                ? 'border-emerald-500 text-emerald-500 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Cấu Hình & OAuth</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'logs'
                ? 'border-cyan-500 text-cyan-500 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Nhật Ký Email ({logs.length})</span>
          </button>
        </div>

        {/* Modal Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Notification Alert Status Message */}
          {sendResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-start gap-2.5 ${
                sendResult.success
                  ? isDark
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : isDark
                  ? 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {sendResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p>{sendResult.message || sendResult.error}</p>
                {sendResult.simulated && (
                  <button
                    onClick={handleAuthenticateOAuth}
                    className="mt-2 text-xs font-bold underline text-amber-400 hover:text-amber-300 cursor-pointer"
                  >
                    &rarr; Xác thực Google Gmail OAuth ngay
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: SEND CRISIS EMAIL */}
          {activeTab === 'send' && (
            <div className="space-y-4">
              {/* Selected Article Preview Banner */}
              {selectedArticle ? (
                <div
                  className={`p-3.5 rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase text-rose-500 tracking-wider block mb-1">
                    Sự việc / Tin bài cần gửi cảnh báo:
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold line-clamp-2 leading-snug mb-1">
                    {selectedArticle.title}
                  </h4>
                  <p className={`text-xs line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {selectedArticle.summary || selectedArticle.snippet}
                  </p>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Nguồn: {selectedArticle.sourceName || selectedArticle.source}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      Lĩnh vực: {selectedArticle.sectorNameVi || 'Vĩ mô & Tài chính'}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className={`p-3.5 rounded-xl border text-center ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto mb-1.5" />
                  <p className="text-xs font-bold">
                    Cảnh báo sự cố khẩn cấp ở cấp độ toàn hệ thống
                  </p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Email sẽ tổng hợp các điểm nóng rủi ro cao nhất hiện tại để gửi lãnh đạo.
                  </p>
                </div>
              )}

              {/* Recipient Input & Multiple Email Tag Manager */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Danh sách Gmail nhận cảnh báo (Tự động gửi đồng thời):
                  </label>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    Hỗ trợ nhập nhiều email (cách nhau dấu phẩy)
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={config.recipientEmail}
                      onChange={(e) => setConfig({ ...config, recipientEmail: e.target.value })}
                      placeholder="giangiang1712@gmail.com, lanhdao@mof.gov.vn, chanhvanphong@mof.gov.vn"
                      className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <button
                    onClick={handleAuthenticateOAuth}
                    disabled={isAuthenticating}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1 shrink-0 cursor-pointer transition"
                    title="Xác thực OAuth với Google"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{config.accessToken ? 'OAuth Đã Bật' : 'Xác thực OAuth'}</span>
                  </button>
                </div>

                {/* Email Tag Badges and Preset Additions */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 mr-1">Email đang chọn:</span>
                    {config.recipientEmail
                      .split(/[,;]/)
                      .map((e) => e.trim())
                      .filter(Boolean)
                      .map((email, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30"
                        >
                          <Mail className="w-3 h-3 text-rose-400" />
                          <span>{email}</span>
                          <button
                            onClick={() => {
                              const remaining = config.recipientEmail
                                .split(/[,;]/)
                                .map((item) => item.trim())
                                .filter((item) => item !== email && item.length > 0)
                                .join(', ');
                              setConfig({ ...config, recipientEmail: remaining });
                            }}
                            className="p-0.5 hover:bg-rose-500/30 rounded text-rose-300 hover:text-white transition cursor-pointer ml-1"
                            title="Xóa email này"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="font-bold text-slate-400">Thêm nhanh gợi ý:</span>
                    <button
                      onClick={() => {
                        const current = config.recipientEmail.trim();
                        const addition = 'lanhdao@mof.gov.vn';
                        if (!current.includes(addition)) {
                          setConfig({
                            ...config,
                            recipientEmail: current ? `${current}, ${addition}` : addition,
                          });
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                    >
                      + Lãnh đạo Bộ
                    </button>
                    <button
                      onClick={() => {
                        const current = config.recipientEmail.trim();
                        const addition = 'truyenthong@mof.gov.vn';
                        if (!current.includes(addition)) {
                          setConfig({
                            ...config,
                            recipientEmail: current ? `${current}, ${addition}` : addition,
                          });
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                    >
                      + Ban Truyền thông
                    </button>
                    <button
                      onClick={() => {
                        const current = config.recipientEmail.trim();
                        const addition = 'chanhvanphong@mof.gov.vn';
                        if (!current.includes(addition)) {
                          setConfig({
                            ...config,
                            recipientEmail: current ? `${current}, ${addition}` : addition,
                          });
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                    >
                      + Chánh Văn phòng
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Leader Directive Note */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Bổ sung ghi chú / Chỉ đạo tham mưu đi kèm (Không bắt buộc):
                </label>
                <textarea
                  rows={3}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Ví dụ: Đề nghị Chánh Văn phòng Bộ rà soát ngay thông cáo báo chí trong 2 giờ tới..."
                  className={`w-full p-3 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Submit Action Button */}
              <button
                onClick={handleSendAlertEmail}
                disabled={isSending || !config.recipientEmail}
                className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
                  isSending
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-rose-900/30'
                }`}
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang kết nối Gmail API & Gửi email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gửi Gmail Cảnh Báo Ngay Tới {config.recipientEmail}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: SETTINGS & OAUTH STATUS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-emerald-500" />
                    <h4 className="text-xs sm:text-sm font-bold">Trạng Thái Kết Nối Google Gmail OAuth</h4>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${
                      config.accessToken
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {config.accessToken ? 'Đã Xác Thực Gmail API' : 'Chưa Kết Nối OAuth'}
                  </span>
                </div>

                <p className={`text-xs mb-3 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Phạm vi quyền được phê duyệt: <code>https://www.googleapis.com/auth/gmail.send</code>. Hệ thống sử dụng quyền gửi thư bảo mật cao nhất để tự động gửi thông báo khi có sự việc khẩn cấp.
                </p>

                <button
                  onClick={handleAuthenticateOAuth}
                  disabled={isAuthenticating}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  <span>{isAuthenticating ? 'Đang mở cửa sổ OAuth...' : 'Ủy Quyền / Làm Mới Gmail OAuth Token'}</span>
                </button>
              </div>

              {/* Auto Dispatch Toggle */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <h4 className="text-xs sm:text-sm font-bold">
                    Tự động gửi Gmail khi phát hiện Điểm nóng / Rủi ro
                  </h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Khi có tin tức Bearish hoặc sự kiện tác động mức độ High trong lượt quét tin real-time, hệ thống sẽ tự động gửi email mà không cần bấm thủ công.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={config.autoDispatch}
                    onChange={(e) => setConfig({ ...config, autoDispatch: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <button
                onClick={handleSaveConfig}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Lưu Cấu Hình Gmail</span>
              </button>
            </div>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                  Nhật ký email đã phát
                </span>
                <button
                  onClick={fetchLogs}
                  className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Làm mới</span>
                </button>
              </div>

              {logs.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border flex flex-col gap-1 text-xs ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold truncate text-slate-200">{log.recipientEmail}</span>
                        <span className="text-[10px] font-mono text-slate-400">{log.sentAt}</span>
                      </div>
                      <p className="font-extrabold text-rose-400 truncate">{log.alertTitle}</p>
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/60 mt-1">
                        <span className="text-slate-400">ID: {log.messageId || log.id}</span>
                        <span
                          className={`font-black uppercase px-1.5 py-0.2 rounded ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`p-6 rounded-xl border text-center ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Mail className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold">Chưa có nhật ký email nào được ghi nhận.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
