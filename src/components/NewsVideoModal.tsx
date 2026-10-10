import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Video,
  Play,
  Download,
  Sparkles,
  RefreshCw,
  Monitor,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Film,
  FileText,
  Copy,
  Check,
  History
} from 'lucide-react';
import { ScrapedNewsItem } from '../types';
import {
  requestGenerateNewsVideo,
  checkNewsVideoStatus,
  getNewsVideoDownloadUrl,
  GeneratedVideoRecord
} from '../services/videoService';

interface NewsVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  article?: ScrapedNewsItem | null;
}

const PROGRESS_STEPS = [
  'Đang kết nối tới mô hình Google Veo 3.1 Fast...',
  'Đang phân tích cấu trúc văn bản tin tức & thể thức tài chính...',
  'Đang tổng hợp đồ họa chuyển động (Motion Graphics) & bảng biểu...',
  'Đang xử lý khung hình video độ phân giải cao...',
  'Đang mã hóa định dạng mp4 chuẩn truyền thông...'
];

export const NewsVideoModal: React.FC<NewsVideoModalProps> = ({
  isOpen,
  onClose,
  article
}) => {
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeOperationName, setActiveOperationName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideoRecord[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideoRecord | null>(null);

  const [copied, setCopied] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load article content when opened or article changes
  useEffect(() => {
    if (article) {
      setNewsTitle(article.title || '');
      const content = article.snippet || article.summary || article.sixW?.aboutWhat || '';
      setNewsContent(content);
      
      const defaultVisualPrompt = `High definition broadcast news video motion graphic, aspect ratio ${aspectRatio}. Dynamic financial news ticker with title: "${(article.title || '').slice(0, 90)}". Professional studio background with gold and navy blue lighting, floating tax and customs charts, 4k video production.`;
      setCustomPrompt(defaultVisualPrompt);
    } else if (!newsTitle) {
      setNewsTitle('Bộ Tài chính tiếp tục thực thi các chính sách tài khóa tháo gỡ khó khăn cho doanh nghiệp');
      setNewsContent('Tổng hợp tin tức chỉ đạo điều hành trọng tâm ngành Tài chính, Thuế, Hải quan, Kho bạc và Thị trường Chứng khoán.');
      setCustomPrompt(`High quality broadcast news summary video motion graphic, aspect ratio 16:9. Dynamic news ticker reading: "Bộ Tài chính tiếp tục thực thi các chính sách tài khóa". Professional studio backdrop, 4k financial graphics.`);
    }
  }, [article, isOpen]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const handleStartGeneration = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    setCurrentStepIndex(0);

    // Cycle progress messages periodically for smooth UI feedback
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    stepTimerRef.current = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev));
    }, 7000);

    try {
      const { operationName, promptUsed, isQuotaExceeded, warningMessage } = await requestGenerateNewsVideo({
        newsTitle,
        newsContent,
        prompt: customPrompt,
        aspectRatio,
        resolution
      });

      setActiveOperationName(operationName);

      const newRecord: GeneratedVideoRecord = {
        id: `vid_${Date.now()}`,
        title: newsTitle || 'Video tóm tắt tin tức',
        prompt: promptUsed,
        aspectRatio,
        operationName,
        createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        status: 'generating',
        isQuotaExceeded,
        warningMessage
      };

      setGeneratedVideos((prev) => [newRecord, ...prev]);
      setSelectedVideo(newRecord);

      // Start status polling
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      
      pollTimerRef.current = setInterval(async () => {
        try {
          const statusResult = await checkNewsVideoStatus(operationName);
          if (statusResult.done) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            if (stepTimerRef.current) clearInterval(stepTimerRef.current);

            if (statusResult.error) {
              const failReason = statusResult.error?.message || 'Tiến trình tạo video báo lỗi từ hệ thống AI.';
              setErrorMsg(failReason);
              setIsGenerating(false);
              setGeneratedVideos((prev) =>
                prev.map((v) => (v.operationName === operationName ? { ...v, status: 'failed', errorMessage: failReason } : v))
              );
            } else {
              // Video generation completed
              const videoDownloadUrl = getNewsVideoDownloadUrl(operationName);
              setIsGenerating(false);
              const updatedRecord: GeneratedVideoRecord = {
                ...newRecord,
                status: 'completed',
                videoUrl: videoDownloadUrl,
                isQuotaExceeded,
                warningMessage
              };
              setGeneratedVideos((prev) =>
                prev.map((v) => (v.operationName === operationName ? updatedRecord : v))
              );
              setSelectedVideo(updatedRecord);
            }
          }
        } catch (pollErr: any) {
          console.warn('[NewsVideoModal] Polling error:', pollErr);
        }
      }, 3000);

    } catch (err: any) {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      setIsGenerating(false);
      const msg = err?.message || 'Không thể khởi tạo tiến trình Veo 3.';
      if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
        setErrorMsg('Hạn ngạch Google Veo 3 API tạm thời vượt mức (Code 429). Hệ thống đã ghi nhận và tự động hỗ trợ bản mẫu HD.');
      } else {
        setErrorMsg(msg);
      }
    }
  };

  const handleCopyPrompt = () => {
    if (selectedVideo?.prompt) {
      navigator.clipboard.writeText(selectedVideo.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/70 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-red-600 to-amber-600 text-white shadow-lg shadow-red-900/30">
              <Film className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Tạo Video Tóm Tắt Tin Tức AI (Google Veo 3)
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-black tracking-wider uppercase rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  veo-3.1-fast
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Chuyển hóa văn bản chỉ đạo điều hành & tin báo chí thành video ngắn chuyên nghiệp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Inputs & Controls */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Article Title Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tiêu đề tin tức / Chủ đề video:
              </label>
              <input
                type="text"
                value={newsTitle}
                onChange={(e) => setNewsTitle(e.target.value)}
                placeholder="Nhập tiêu đề tin tức..."
                disabled={isGenerating}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* Article Content / Summary */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Trích yếu nội dung chính / Chỉ đạo nghiệp vụ:
              </label>
              <textarea
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                rows={3}
                placeholder="Nhập nội dung vắn tắt bài viết..."
                disabled={isGenerating}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all disabled:opacity-50 resize-none"
              />
            </div>

            {/* Aspect Ratio & Resolution Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tỷ lệ khung hình (Aspect Ratio):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    disabled={isGenerating}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      aspectRatio === '16:9'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Ngang 16:9</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('9:16')}
                    disabled={isGenerating}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      aspectRatio === '9:16'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Dọc 9:16</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Độ phân giải (Resolution):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResolution('720p')}
                    disabled={isGenerating}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all text-center ${
                      resolution === '720p'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    720p HD
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolution('1080p')}
                    disabled={isGenerating}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all text-center ${
                      resolution === '1080p'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    1080p FHD
                  </button>
                </div>
              </div>
            </div>

            {/* AI Visual Prompt Config */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Visual Prompt Đồ Họa Truyền Thông:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const prompt = `High quality broadcast news video motion graphic, aspect ratio ${aspectRatio}. Dynamic news ticker reading: "${(newsTitle || '').slice(0, 90)}". Professional financial graphs, modern studio backdrop with blue and gold lighting, floating data overlays, 4k broadcast presentation.`;
                    setCustomPrompt(prompt);
                  }}
                  disabled={isGenerating}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Tự động tạo lại prompt
                </button>
              </div>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                disabled={isGenerating}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-amber-200/90 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all resize-none disabled:opacity-50"
              />
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl flex items-start gap-2.5 text-red-200 text-xs animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Lỗi tạo video: </span>
                  {errorMsg}
                </div>
              </div>
            )}

            {/* Generate Action Button */}
            <button
              type="button"
              onClick={handleStartGeneration}
              disabled={isGenerating || !newsTitle.trim()}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-red-700 via-red-800 to-amber-700 hover:from-red-800 hover:to-amber-800 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-950/50 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Veo 3 Đang Dựng Video ({resolution} - {aspectRatio})...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Khởi Tạo Video Tóm Tắt Veo 3</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Preview & Status */}
          <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Khung Xem Trước Video Output</span>
              {selectedVideo && (
                <span className="text-[10px] normal-case text-slate-400">
                  Khởi tạo lúc: {selectedVideo.createdAt}
                </span>
              )}
            </h4>

            {/* Active Video Player or Progress State */}
            <div className="relative min-h-[260px] sm:min-h-[300px] flex flex-col items-center justify-center bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden p-4">
              {isGenerating ? (
                <div className="flex flex-col items-center text-center p-6 space-y-4 max-w-md">
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
                    <Film className="w-6 h-6 text-amber-300 absolute" />
                  </div>

                  <div>
                    <h5 className="text-sm font-bold text-amber-300 mb-1">
                      Đang Tạo Video Với Google Veo 3.1 Fast
                    </h5>
                    <p className="text-xs text-slate-300 animate-pulse">
                      {PROGRESS_STEPS[currentStepIndex]}
                    </p>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-red-600 to-amber-400 h-full transition-all duration-700 ease-out rounded-full"
                      style={{
                        width: `${((currentStepIndex + 1) / PROGRESS_STEPS.length) * 100}%`
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 italic">
                    Quá trình dựng video có thể mất từ 30 đến 90 giây tùy thuộc độ phân giải.
                  </p>
                </div>
              ) : selectedVideo?.status === 'completed' && selectedVideo.videoUrl ? (
                <div className="w-full flex flex-col items-center gap-3">
                  {selectedVideo.isQuotaExceeded && (
                    <div className="w-full p-2.5 bg-amber-950/80 border border-amber-500/50 rounded-xl flex items-start gap-2 text-amber-200 text-xs shadow-md">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-300">Thông báo Hạn Ngạch Veo 3 API (Code 429): </span>
                        {selectedVideo.warningMessage || 'Hạn ngạch Google Veo 3 API trong kho khóa tạm thời chạm ngưỡng. Hệ thống tự động kích hoạt Bản Xem Trước Video Tin Tức Mẫu HD để trải nghiệm quy trình.'}
                      </div>
                    </div>
                  )}

                  <div className="relative w-full max-h-[360px] flex items-center justify-center bg-black rounded-xl overflow-hidden border border-slate-800">
                    <video
                      key={selectedVideo.videoUrl}
                      src={selectedVideo.videoUrl}
                      controls
                      autoPlay
                      className={`max-h-[340px] object-contain rounded-lg ${
                        selectedVideo.aspectRatio === '9:16' ? 'w-auto h-[340px]' : 'w-full'
                      }`}
                    />
                  </div>

                  {/* Video Actions */}
                  <div className="w-full flex items-center justify-between gap-2 pt-1">
                    <a
                      href={selectedVideo.videoUrl}
                      download={`finpulse_veo3_${selectedVideo.id}.mp4`}
                      className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải Video MP4</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all border border-slate-700"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Chép Prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
                  <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                    <Video className="w-8 h-8" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-300">
                      Chưa có video được tạo
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Nhấn nút "Khởi Tạo Video Tóm Tắt Veo 3" bên trái để bắt đầu dựng clip.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Video History List */}
            {generatedVideos.length > 0 && (
              <div className="mt-2 border-t border-slate-800 pt-3">
                <h5 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  Lịch sử video đã tạo ({generatedVideos.length}):
                </h5>

                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {generatedVideos.map((vid) => (
                    <div
                      key={vid.id}
                      onClick={() => setSelectedVideo(vid)}
                      className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                        selectedVideo?.id === vid.id
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate font-medium">{vid.title}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-[10px]">
                        <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">
                          {vid.aspectRatio}
                        </span>
                        {vid.status === 'generating' && (
                          <span className="text-amber-400 animate-pulse">Đang dựng...</span>
                        )}
                        {vid.status === 'completed' && (
                          <span className="text-emerald-400 font-semibold">Sẵn sàng</span>
                        )}
                        {vid.status === 'failed' && (
                          <span className="text-red-400">Thất bại</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
