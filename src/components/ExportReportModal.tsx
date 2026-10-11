import React, { useState, useRef } from 'react';
import { ScrapeResponse, ScrapedNewsItem, TimeRange, SectorType } from '../types';
import { toCanvas, toPng, toBlob } from 'html-to-image';
import jsPDF from 'jspdf';
import { useTheme } from '../lib/theme';
import { fetchEmailDigest, EmailDigestResult } from '../services/api';
import {
  X,
  Copy,
  Download,
  Check,
  FileText,
  FileSpreadsheet,
  Send,
  Image as ImageIcon,
  Printer,
  Sparkles,
  Flame,
  TrendingUp,
  Clock,
  Layers,
  CheckCircle2,
  Sliders,
  Share2,
  FileCheck,
  AlertCircle,
  BarChart2,
  ChevronDown,
  Sun,
  Moon,
  Mail,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface ExportReportModalProps {
  data: ScrapeResponse | null;
  filteredNews?: ScrapedNewsItem[];
  timeRange?: TimeRange;
  sector?: SectorType;
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  data,
  filteredNews,
  timeRange = '24h',
  sector = 'all',
  onClose,
}) => {
  const { isDark } = useTheme();
  const [format, setFormat] = useState<'snapshot' | 'pdf' | 'email' | 'brief' | 'markdown' | 'csv'>('snapshot');
  const [copied, setCopied] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Email digest state
  const [emailDigest, setEmailDigest] = useState<EmailDigestResult | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  // Snapshot visual customization
  const [snapshotTheme, setSnapshotTheme] = useState<'dark' | 'light'>(isDark ? 'dark' : 'light');
  const [articleCount, setArticleCount] = useState<number>(6);
  const [include6W, setInclude6W] = useState<boolean>(true);
  const [includeStats, setIncludeStats] = useState<boolean>(true);

  const snapshotRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  // Active articles list to export
  const activeNewsList = filteredNews && filteredNews.length > 0 ? filteredNews : data.news;
  const articlesToExport = activeNewsList.slice(0, articleCount);

  const getSafeDateTime = () => {
    try {
      const d = new Date();
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes} ngày ${day}/${month}/${year}`;
    } catch {
      return new Date().toISOString();
    }
  };

  // Text Formats Generators
  const generateBriefText = () => {
    const timeStr = getSafeDateTime();
    const topKeywords = data.trendingKeywords.slice(0, 8).map(k => `#${k.keyword}(★${k.weight})`).join(' ');

    let report = `📢 BÁO CÁO NHANH SOCIAL LISTENING & TIN TỨC TÀI CHÍNH (${data.scannedWindow.toUpperCase()})\n`;
    report += `⏱️ Thời điểm: ${timeStr} | Khung quét: ${data.scannedWindow}\n`;
    const moodScore = data.sentimentOverview.moodScore;
    const alertTag = moodScore < 60 
      ? ' [🚨 CẢNH BÁO KHẨN CẤP (M < 60)]' 
      : moodScore < 70 
      ? ' [⚠️ CẢNH BÁO MỨC 4 (60 ≤ M < 70)]' 
      : moodScore < 75 
      ? ' [⚠️ CẢNH BÁO MỨC 3 (70 ≤ M < 75)]' 
      : moodScore < 79 
      ? ' [⚡ CẢNH BÁO MỨC 2 (75 ≤ M < 79)]' 
      : moodScore < 85 
      ? ' [ℹ️ CẢNH BÁO MỨC 1 (79 ≤ M < 85)]' 
      : ' [✅ TỐT (M ≥ 85)]';
    report += `🎯 Chỉ số tâm lý thị trường: M = ${moodScore}/100 (${data.sentimentOverview.overallMood})${alertTag}\n`;
    report += `📐 Công thức: M = X + Y·A - Z·B | X=${data.sentimentOverview.neutralPercentage}% Trung tính, Y=${data.sentimentOverview.bullishPercentage}% Tích cực (A=${data.sentimentOverview.formulaComponents?.A ?? 1.05}), Z=${data.sentimentOverview.bearishPercentage}% Tiêu cực (B=${data.sentimentOverview.formulaComponents?.B ?? 1.65})\n`;
    report += `📊 Tỷ lệ: ${data.sentimentOverview.bullishPercentage}% Tích cực | ${data.sentimentOverview.neutralPercentage}% Trung lập | ${data.sentimentOverview.bearishPercentage}% Tiêu cực\n`;
    report += `💡 Dẫn dắt chính: ${data.sentimentOverview.keyDriver}\n`;
    report += `🔥 Trọng tâm từ khóa Bộ Tài chính & Thị trường: ${topKeywords}\n\n`;

    report += `🔥 TIN NÓNG TÁC ĐỘNG CAO (ĐÃ BÓC TÁCH MÔ HÌNH 6W):\n\n`;
    articlesToExport.forEach((n, idx) => {
      report += `${idx + 1}. [${n.sentiment.toUpperCase()}] ${n.title}\n`;
      report += `   ⏰ Thời gian: ${n.timeAgo} | Nguồn: ${n.source} | Lĩnh vực: ${n.sectorNameVi}\n`;
      if (n.sixW && include6W) {
        report += `   • Ai (Chủ thể): ${n.sixW.who}\n`;
        report += `   • Đang làm gì: ${n.sixW.doingWhat}\n`;
        report += `   • Vấn đề: ${n.sixW.aboutWhat}\n`;
        report += `   • Kết quả: ${n.sixW.resultOutcome}\n`;
        report += `   • Bị tác động: ${n.sixW.whoIsAffected}\n`;
        report += `   • Phản ứng: ${n.sixW.reaction}\n`;
      }
      report += `   👉 Tác động thị trường: ${n.marketImplication}\n\n`;
    });

    report += `---\nNguồn: FinPulse Realtime Financial News & Social Listening Engine`;
    return report;
  };

  const generateMarkdown = () => {
    let md = `# Báo Cáo Social Listening & Tin Tức Tài Chính Bộ Tài Chính\n\n`;
    md += `- **Thời gian xuất báo cáo:** ${getSafeDateTime()}\n`;
    md += `- **Khung quét:** ${data.scannedWindow}\n`;
    const moodScore = data.sentimentOverview.moodScore;
    const alertTag = moodScore < 60 
      ? ' [🚨 CẢNH BÁO KHẨN CẤP (M < 60)]' 
      : moodScore < 70 
      ? ' [⚠️ CẢNH BÁO MỨC 4 (60 ≤ M < 70)]' 
      : moodScore < 75 
      ? ' [⚠️ CẢNH BÁO MỨC 3 (70 ≤ M < 75)]' 
      : moodScore < 79 
      ? ' [⚡ CẢNH BÁO MỨC 2 (75 ≤ M < 79)]' 
      : moodScore < 85 
      ? ' [ℹ️ CẢNH BÁO MỨC 1 (79 ≤ M < 85)]' 
      : ' [✅ TỐT (M ≥ 85)]';
    md += `- **Chỉ số tâm lý thị trường:** M = ${moodScore}/100 (${data.sentimentOverview.overallMood})${alertTag}\n`;
    md += `- **Công thức tính:** M = X + Y·A - Z·B | X=${data.sentimentOverview.neutralPercentage}%, Y=${data.sentimentOverview.bullishPercentage}%, Z=${data.sentimentOverview.bearishPercentage}%\n`;
    md += `- **Tổng số tin ghi nhận:** ${data.totalFound}\n\n`;
    md += `## 1. Trọng Tâm Từ Khóa Ưu Tiên\n\n`;
    data.trendingKeywords.slice(0, 10).forEach(kw => {
      md += `- **${kw.keyword}** (Trọng số: ${kw.weight.toFixed(1)}/5.0) - ${kw.mentions} lượt đề cập\n`;
    });
    md += `\n## 2. Chi Tiết Tin Tức & Mô Hình 6W Phân Tích\n\n`;
    articlesToExport.forEach((n) => {
      md += `### ${n.title}\n`;
      md += `- **Nguồn:** [${n.source}](${n.url}) | **Thời gian:** ${n.timeAgo} | **Lĩnh vực:** ${n.sectorNameVi}\n`;
      md += `- **Sắc thái:** ${n.sentiment.toUpperCase()} (${n.sentimentScore}/100) | **Mức tác động:** ${n.impactLevel.toUpperCase()}\n`;
      if (n.sixW && include6W) {
        md += `\n**Mô hình 6W:**\n`;
        md += `- 👤 **Ai:** ${n.sixW.who}\n`;
        md += `- ⚡ **Đang làm gì:** ${n.sixW.doingWhat}\n`;
        md += `- 📋 **Vấn đề gì:** ${n.sixW.aboutWhat}\n`;
        md += `- 🎯 **Kết quả thế nào:** ${n.sixW.resultOutcome}\n`;
        md += `- 👥 **Ai bị tác động:** ${n.sixW.whoIsAffected}\n`;
        md += `- 💬 **Phản ứng ra sao:** ${n.sixW.reaction}\n\n`;
      }
      md += `- **Hàm ý đầu tư:** ${n.marketImplication}\n`;
      if (n.tickers && n.tickers.length > 0) {
        md += `- **Mã liên quan:** ${n.tickers.join(', ')}\n`;
      }
      md += `\n---\n\n`;
    });
    return md;
  };

  const generateCSV = () => {
    const headers = [
      'Tiêu đề',
      'Nguồn',
      'Thời gian',
      'Lĩnh vực',
      'Sắc thái',
      'Điểm cảm xúc',
      'Mức tác động',
      'Ai (Who)',
      'Đang làm gì (Action)',
      'Về vấn đề gì (Issue)',
      'Kết quả thế nào (Result)',
      'Ai bị tác động (Affected)',
      'Phản ứng ra sao (Reaction)',
      'Từ khóa trọng số',
      'Mã cổ phiếu',
      'Link',
    ];
    const rows = activeNewsList.map((n) => [
      `"${n.title.replace(/"/g, '""')}"`,
      `"${n.source.replace(/"/g, '""')}"`,
      `"${n.timeAgo}"`,
      `"${n.sectorNameVi}"`,
      `"${n.sentiment}"`,
      n.sentimentScore,
      `"${n.impactLevel}"`,
      `"${(n.sixW?.who || '').replace(/"/g, '""')}"`,
      `"${(n.sixW?.doingWhat || '').replace(/"/g, '""')}"`,
      `"${(n.sixW?.aboutWhat || '').replace(/"/g, '""')}"`,
      `"${(n.sixW?.resultOutcome || '').replace(/"/g, '""')}"`,
      `"${(n.sixW?.whoIsAffected || '').replace(/"/g, '""')}"`,
      `"${(n.sixW?.reaction || '').replace(/"/g, '""')}"`,
      `"${(n.weightedKeywords || []).map(k => `${k.keyword}(★${k.weight})`).join('; ')}"`,
      `"${n.tickers.join(';')}"`,
      `"${n.url}"`,
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const handlePrepareEmailDigest = async () => {
    setFormat('email');
    if (emailDigest && !isGeneratingEmail) return;

    setIsGeneratingEmail(true);
    setGenerateError(null);
    try {
      const digest = await fetchEmailDigest({
        news: activeNewsList,
        timeRange,
        sector,
        sentimentOverview: data.sentimentOverview,
        trendingKeywords: data.trendingKeywords,
      });
      setEmailDigest(digest);
    } catch (err: any) {
      console.error('Error generating email digest:', err);
      setGenerateError(err?.message || 'Không thể tổng hợp Email Digest.');
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleCopySubject = () => {
    if (!emailDigest?.subject) return;
    navigator.clipboard.writeText(emailDigest.subject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleCopyBody = () => {
    if (!emailDigest?.emailBodyText) return;
    navigator.clipboard.writeText(emailDigest.emailBodyText);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const handleCopyFullEmail = () => {
    if (!emailDigest) return;
    const fullText = `Tiêu đề: ${emailDigest.subject}\n\n${emailDigest.emailBodyText}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMailClient = () => {
    if (!emailDigest) return;
    const subject = encodeURIComponent(emailDigest.subject);
    const body = encodeURIComponent(emailDigest.emailBodyText);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const getContent = () => {
    if (format === 'email') return emailDigest?.emailBodyText || '';
    if (format === 'markdown') return generateMarkdown();
    if (format === 'csv') return generateCSV();
    return generateBriefText();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(getContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadText = () => {
    const text = getContent();
    const blob = new Blob([text], {
      type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finpulse-report-${timeRange}-${Date.now()}.${format === 'csv' ? 'csv' : format === 'markdown' ? 'md' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate Image Canvas helper using html-to-image (supports modern Tailwind oklch colors)
  const captureSnapshotCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!snapshotRef.current) return null;
    return await toCanvas(snapshotRef.current, {
      pixelRatio: 2,
      backgroundColor: snapshotTheme === 'dark' ? '#0b1120' : '#ffffff',
      cacheBust: true,
      skipFonts: true,
    });
  };

  // Download Snapshot Image (PNG)
  const handleDownloadSnapshotImage = async () => {
    if (!snapshotRef.current) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const dataUrl = await toPng(snapshotRef.current, {
        pixelRatio: 2,
        backgroundColor: snapshotTheme === 'dark' ? '#0b1120' : '#ffffff',
        cacheBust: true,
        skipFonts: true,
      });

      const link = document.createElement('a');
      link.download = `finpulse-snapshot-${timeRange}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      console.error('Error generating image:', err);
      setGenerateError(err?.message || 'Lỗi khi xuất hình ảnh Snapshot.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy Image to Clipboard (Instant paste into Zalo, Telegram, Slack, Email)
  const handleCopySnapshotImageToClipboard = async () => {
    if (!snapshotRef.current) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const blob = await toBlob(snapshotRef.current, {
        pixelRatio: 2,
        backgroundColor: snapshotTheme === 'dark' ? '#0b1120' : '#ffffff',
        cacheBust: true,
        skipFonts: true,
      });

      if (!blob) {
        throw new Error('Lỗi chuyển đổi dữ liệu ảnh.');
      }

      try {
        if (navigator.clipboard && typeof (window as any).ClipboardItem !== 'undefined') {
          const item = new (window as any).ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 2500);
        } else {
          const link = document.createElement('a');
          link.download = `finpulse-snapshot-${Date.now()}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 2500);
        }
      } catch (clipErr) {
        console.warn('Clipboard write failed, downloading instead:', clipErr);
        const link = document.createElement('a');
        link.download = `finpulse-snapshot-${Date.now()}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
      }
    } catch (err: any) {
      console.error('Error copying snapshot image:', err);
      setGenerateError(err?.message || 'Không thể sao chép ảnh vào Clipboard.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export to PDF
  const handleDownloadPDF = async () => {
    if (!snapshotRef.current) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const canvas = await captureSnapshotCanvas();
      if (!canvas) throw new Error('Không thể khởi tạo bản chụp báo cáo.');

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 mm
      const pageHeight = 297; // A4 mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Multi-page if report is longer than 1 A4 page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`finpulse-report-snapshot-${timeRange}-${Date.now()}.pdf`);
    } catch (err: any) {
      console.error('Error exporting PDF:', err);
      setGenerateError(err?.message || 'Lỗi khi tạo tệp PDF báo cáo.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Native Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 z-[100] backdrop-blur-md animate-fadeIn">
      <div
        className="border-2 border-slate-200 rounded-xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden bg-slate-950 text-slate-100"
      >
        {/* Header */}
        <div
          className="p-4 border-b-2 border-slate-800 flex items-center justify-between bg-slate-900"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-500 border border-emerald-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Xuất Báo Cáo & Snapshot Tổng Hợp
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[10px] font-semibold border border-emerald-500/30">
                  PDF / Image / Email Digest
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Tạo bản tin đồ họa trực quan (Snapshot), tệp PDF hoặc Email Digest AI cho Lãnh đạo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrepareEmailDigest}
              disabled={isGeneratingEmail}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              title="Soạn Báo cáo Email Digest chuyên sâu bằng AI sẵn sàng gửi Lãnh đạo"
            >
              <Mail className="w-4 h-4 text-amber-400" />
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>{isGeneratingEmail ? 'Đang tổng hợp...' : 'Prepare Email Digest'}</span>
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Format Selector Tabs */}
        <div
          className={`p-3 border-b flex flex-wrap items-center justify-between gap-2 transition-colors ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
            <button
              onClick={handlePrepareEmailDigest}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                format === 'email'
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
              }`}
              title="Tạo Báo cáo Email Digest AI tổng hợp gửi Lãnh đạo"
            >
              <Mail className="w-3.5 h-3.5" />
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
              <span>Email Digest (AI)</span>
            </button>

            <button
              onClick={() => setFormat('snapshot')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                format === 'snapshot'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Snapshot Hình Ảnh (PNG)</span>
            </button>

            <button
              onClick={() => setFormat('pdf')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                format === 'pdf'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Tài Liệu PDF (.pdf)</span>
            </button>

            <button
              onClick={() => setFormat('brief')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                format === 'brief'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Bản tin Zalo/Telegram (Text)</span>
            </button>

            <button
              onClick={() => setFormat('markdown')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                format === 'markdown'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>

            <button
              onClick={() => setFormat('csv')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                format === 'csv'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel CSV</span>
            </button>
          </div>

          {/* Quick Customization Controls for Snapshot & PDF */}
          {(format === 'snapshot' || format === 'pdf') && (
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                <button
                  onClick={() => setSnapshotTheme('dark')}
                  className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
                    snapshotTheme === 'dark' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Giao diện Tối sang trọng"
                >
                  <Moon className="w-3 h-3" />
                  Dark
                </button>
                <button
                  onClick={() => setSnapshotTheme('light')}
                  className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
                    snapshotTheme === 'light' ? 'bg-slate-200 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Giao diện Sáng trang trọng"
                >
                  <Sun className="w-3 h-3" />
                  Light
                </button>
              </div>

              <select
                value={articleCount}
                onChange={(e) => setArticleCount(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value={4}>Top 4 tin tiêu biểu</option>
                <option value={6}>Top 6 tin quan trọng</option>
                <option value={10}>Top 10 tin</option>
                <option value={activeNewsList.length}>Toàn bộ ({activeNewsList.length} tin)</option>
              </select>

              <label className="flex items-center gap-1 text-[11px] text-slate-300 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={include6W}
                  onChange={(e) => setInclude6W(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0 cursor-pointer"
                />
                <span>Mô hình 6W</span>
              </label>
            </div>
          )}
        </div>

        {/* Error message */}
        {generateError && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{generateError}</span>
          </div>
        )}

        {/* Preview Container */}
        <div className="p-4 flex-1 overflow-y-auto bg-slate-950/40 flex justify-center">
          {format === 'snapshot' || format === 'pdf' ? (
            /* Visual Snapshot Document Card (This element is captured by html2canvas) */
            <div className="w-full max-w-2xl">
              <div
                ref={snapshotRef}
                className={`p-6 sm:p-8 rounded-2xl border transition-all shadow-xl font-sans ${
                  snapshotTheme === 'dark'
                    ? 'bg-slate-950 text-slate-100 border-slate-800'
                    : 'bg-white text-slate-900 border-slate-200'
                }`}
                style={{ minWidth: '320px' }}
              >
                {/* Snapshot Header */}
                <div className={`pb-5 border-b flex items-start justify-between gap-4 ${
                  snapshotTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider ${
                        snapshotTheme === 'dark'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}>
                        FinPulse • MoF & Macro Intelligence
                      </span>
                      <span className={`text-[11px] font-semibold ${
                        snapshotTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Khung giờ: {data.scannedWindow}
                      </span>
                    </div>
                    <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${
                      snapshotTheme === 'dark' ? 'text-white' : 'text-slate-950'
                    }`}>
                      BÁO CÁO TỔNG HỢP TIN TỨC & SOCIAL LISTENING
                    </h1>
                    <p className={`text-xs mt-1 ${
                      snapshotTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Thời gian xuất: {getSafeDateTime()} | Lĩnh vực: {sector === 'all' ? 'Toàn cảnh thị trường' : sector}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl text-center shrink-0 border ${
                    snapshotTheme === 'dark'
                      ? 'bg-slate-900 border-slate-800 text-slate-200'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Tổng tin</div>
                    <div className="text-xl font-black text-emerald-500">{data.totalFound}</div>
                  </div>
                </div>

                {/* Market Mood & Sentiment Card */}
                {includeStats && data.sentimentOverview && (
                  <div className={`mt-5 p-4 rounded-xl border ${
                    snapshotTheme === 'dark'
                      ? 'bg-slate-900/90 border-slate-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-500">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Chỉ số sắc thái tin tức
                      </span>
                      <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                        data.sentimentOverview.moodScore >= 85
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : data.sentimentOverview.moodScore >= 79
                          ? 'bg-blue-500/20 text-blue-400'
                          : data.sentimentOverview.moodScore >= 75
                          ? 'bg-amber-500/20 text-amber-400'
                          : data.sentimentOverview.moodScore >= 70
                          ? 'bg-orange-500/20 text-orange-400'
                          : data.sentimentOverview.moodScore >= 60
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-rose-600/30 text-rose-300 ring-1 ring-rose-500 animate-pulse'
                      }`}>
                        M: {data.sentimentOverview.moodScore}/100 • {data.sentimentOverview.overallMood}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2.5 w-full bg-slate-700/40 rounded-full overflow-hidden flex mb-2">
                      <div style={{ width: `${data.sentimentOverview.bullishPercentage}%` }} className="bg-emerald-500" />
                      <div style={{ width: `${data.sentimentOverview.neutralPercentage}%` }} className="bg-slate-400" />
                      <div style={{ width: `${data.sentimentOverview.bearishPercentage}%` }} className="bg-rose-500" />
                    </div>

                    <div className={`flex items-center justify-between text-[11px] ${
                      snapshotTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      <span className="text-emerald-500 font-semibold">{data.sentimentOverview.bullishPercentage}% Tích cực</span>
                      <span className="text-slate-400">{data.sentimentOverview.neutralPercentage}% Trung lập</span>
                      <span className="text-rose-500 font-semibold">{data.sentimentOverview.bearishPercentage}% Tiêu cực</span>
                    </div>

                    <p className={`text-xs mt-2 italic ${
                      snapshotTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      💡 <strong>Dẫn dắt chính:</strong> {data.sentimentOverview.keyDriver}
                    </p>
                  </div>
                )}

                {/* Top Weighted Keywords */}
                {includeStats && data.trendingKeywords && (
                  <div className="mt-4">
                    <div className={`text-[11px] font-bold uppercase mb-1.5 flex items-center gap-1 ${
                      snapshotTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Trọng tâm Từ khóa & Chủ đề sôi động
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {data.trendingKeywords.slice(0, 8).map((kw, i) => (
                        <span
                          key={i}
                          className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                            snapshotTheme === 'dark'
                              ? 'bg-slate-900 border-slate-800 text-slate-300'
                              : 'bg-slate-100 border-slate-200 text-slate-800'
                          }`}
                        >
                          #{kw.keyword}{' '}
                          <span className="text-amber-400 font-bold">★{kw.weight.toFixed(1)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Articles List with 6W */}
                <div className="mt-6 space-y-4">
                  <div className={`text-xs font-bold uppercase tracking-wider pb-1 border-b ${
                    snapshotTheme === 'dark' ? 'text-slate-300 border-slate-800' : 'text-slate-700 border-slate-200'
                  }`}>
                    Top {articlesToExport.length} Tin Nóng Tác Động Cao & Bóc Tách 6W
                  </div>

                  {articlesToExport.map((article, idx) => (
                    <div
                      key={article.id || idx}
                      className={`p-3.5 rounded-xl border ${
                        snapshotTheme === 'dark'
                          ? 'bg-slate-900/60 border-slate-800/80'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {/* Meta header */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-emerald-500">#{idx + 1}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            article.sentiment === 'bullish'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : article.sentiment === 'bearish'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            {article.sentiment}
                          </span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                            snapshotTheme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {article.sectorNameVi}
                          </span>
                        </div>
                        <span className={`text-[10px] ${
                          snapshotTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {article.timeAgo} • {article.source}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className={`text-sm font-bold leading-snug mb-2 ${
                        snapshotTheme === 'dark' ? 'text-white' : 'text-slate-950'
                      }`}>
                        {article.title}
                      </h3>

                      {/* 6W Structure Breakdown */}
                      {include6W && article.sixW && (
                        <div className={`p-2.5 rounded-lg text-xs space-y-1 mb-2 border font-mono ${
                          snapshotTheme === 'dark'
                            ? 'bg-slate-950/80 border-slate-800/80 text-slate-300'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}>
                          <div className="flex items-start gap-1">
                            <span className="text-emerald-500 font-bold shrink-0">👤 Ai:</span>
                            <span>{article.sixW.who}</span>
                          </div>
                          <div className="flex items-start gap-1">
                            <span className="text-cyan-500 font-bold shrink-0">⚡ Làm gì:</span>
                            <span>{article.sixW.doingWhat}</span>
                          </div>
                          <div className="flex items-start gap-1">
                            <span className="text-amber-500 font-bold shrink-0">📋 Vấn đề:</span>
                            <span>{article.sixW.aboutWhat}</span>
                          </div>
                          <div className="flex items-start gap-1">
                            <span className="text-purple-400 font-bold shrink-0">🎯 Kết quả:</span>
                            <span>{article.sixW.resultOutcome}</span>
                          </div>
                          <div className="flex items-start gap-1">
                            <span className="text-rose-400 font-bold shrink-0">👥 Ảnh hưởng:</span>
                            <span>{article.sixW.whoIsAffected}</span>
                          </div>
                          <div className="flex items-start gap-1">
                            <span className="text-blue-400 font-bold shrink-0">💬 Phản ứng:</span>
                            <span>{article.sixW.reaction}</span>
                          </div>
                        </div>
                      )}

                      {/* Market Implication */}
                      <div className={`text-xs ${
                        snapshotTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        👉 <strong>Tác động thị trường:</strong> {article.marketImplication}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Signature */}
                <div className={`mt-6 pt-4 border-t flex items-center justify-between text-[11px] ${
                  snapshotTheme === 'dark'
                    ? 'border-slate-800 text-slate-500'
                    : 'border-slate-200 text-slate-400'
                }`}>
                  <span>Hệ thống FinPulse Social Listening & Financial News Realtime</span>
                  <span>Trích xuất từ Google Search & Báo chí chính thống VN</span>
                </div>
              </div>
            </div>
          ) : format === 'email' ? (
            /* Email Digest Specific Rich Preview Card */
            <div className="w-full max-w-2xl space-y-4">
              {isGeneratingEmail ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center my-6 shadow-xl">
                  <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/30 text-amber-400 mb-4 animate-bounce">
                    <Sparkles className="w-8 h-8 animate-spin" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">Đang Tổng Hợp Email Digest Chuyên Sâu Bằng AI...</h3>
                  <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                    Hệ thống đang phân tích {activeNewsList.length} tin tức nóng, trích xuất điểm chỉ đạo cốt lõi và tổng hợp văn bản chuẩn mực ready-to-copy cho email client (Gmail, Outlook).
                  </p>
                </div>
              ) : emailDigest ? (
                <div className="space-y-4">
                  {/* Subject Line Header Card */}
                  <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          <Mail className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                          AI Executive Email Digest
                        </span>
                      </div>
                      <button
                        onClick={handlePrepareEmailDigest}
                        disabled={isGeneratingEmail}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 flex items-center gap-1 cursor-pointer transition"
                        title="Tham khảo AI phân tích lại"
                      >
                        <RefreshCw className={`w-3 h-3 ${isGeneratingEmail ? 'animate-spin' : ''}`} />
                        <span>Tạo lại AI</span>
                      </button>
                    </div>

                    {/* Subject Box */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                        <span>Tiêu đề Email (Subject Line):</span>
                        <button
                          onClick={handleCopySubject}
                          className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                        >
                          {copiedSubject ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Đã chép tiêu đề!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Sao chép Tiêu đề</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-white select-all font-sans leading-snug">
                        {emailDigest.subject}
                      </div>
                    </div>
                  </div>

                  {/* Body Editor Box */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                      <span className="font-semibold text-slate-300">Nội dung Email (Sẵn sàng dán vào Outlook/Gmail):</span>
                      <span className="text-[11px] text-emerald-400">Đã định dạng chia mục chuyên nghiệp</span>
                    </div>
                    <textarea
                      value={emailDigest.emailBodyText}
                      onChange={(e) => setEmailDigest({ ...emailDigest, emailBodyText: e.target.value })}
                      rows={15}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-sans text-slate-200 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed shadow-inner"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
                  <p className="text-xs text-slate-400 mb-3">Chưa khởi tạo Email Digest.</p>
                  <button
                    onClick={handlePrepareEmailDigest}
                    className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    Tạo Email Digest Ngay
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Plain Text / Markdown / CSV Editor Box */
            <textarea
              readOnly
              value={getContent()}
              rows={16}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 focus:outline-none resize-none leading-relaxed"
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/80">
          <div className="flex items-center gap-2 flex-wrap">
            {format === 'snapshot' && (
              <>
                <button
                  onClick={handleDownloadSnapshotImage}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGenerating ? 'Đang xuất ảnh...' : 'Tải File Ảnh (.PNG)'}</span>
                </button>

                <button
                  onClick={handleCopySnapshotImageToClipboard}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Sao chép ảnh trực tiếp vào Clipboard để dán (Ctrl+V) ngay vào Zalo / Telegram / Slack"
                >
                  {copiedImage ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Đã chép ảnh vào Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-cyan-400" />
                      <span>Sao chép ảnh (Dán Zalo/Telegram)</span>
                    </>
                  )}
                </button>
              </>
            )}

            {format === 'pdf' && (
              <>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGenerating ? 'Đang tạo PDF...' : 'Tải Tệp PDF (.PDF)'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  title="Mở hộp thoại in ấn / Lưu PDF từ trình duyệt"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>In ấn / Lưu PDF Trình duyệt</span>
                </button>
              </>
            )}

            {format === 'email' && (
              <>
                <button
                  onClick={handleOpenMailClient}
                  disabled={!emailDigest || isGeneratingEmail}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold border border-emerald-500/40 transition cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Mở ứng dụng email (Gmail / Outlook) và tự động điền Tiêu đề + Nội dung"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <span>Mở Trình gửi Email (mailto)</span>
                </button>

                <button
                  onClick={handleCopyBody}
                  disabled={!emailDigest || isGeneratingEmail}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-50"
                >
                  {copiedBody ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Đã chép Nội dung!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-cyan-400" />
                      <span>Sao chép Nội dung</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopyFullEmail}
                  disabled={!emailDigest || isGeneratingEmail}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Đã chép Toàn bộ!</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Sao chép Toàn bộ Email</span>
                    </>
                  )}
                </button>
              </>
            )}

            {(format === 'brief' || format === 'markdown' || format === 'csv') && (
              <>
                <button
                  onClick={handleDownloadText}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Tải về tệp (.{format === 'csv' ? 'csv' : format === 'markdown' ? 'md' : 'txt'})</span>
                </button>

                <button
                  onClick={handleCopyText}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Đã sao chép nội dung!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Sao chép nội dung</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
