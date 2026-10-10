import React, { useState, useMemo } from 'react';
import { SentimentOverview, ScrapedNewsItem } from '../types';
import { decodeHtmlEntities } from '../lib/htmlDecoder';
import { SourceBrandBadge } from './SourceBrandBadge';
import { ViolationEvidenceDossierModal } from './ViolationEvidenceDossierModal';
import { ReaderCommentsSentimentModal } from './ReaderCommentsSentimentModal';
import {
  Search,
  Radio,
  BellRing,
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Users,
  FileText,
  Trash2,
  ArrowRight,
  RefreshCw,
  Check,
  UserCheck,
  Flame,
  Info,
  ChevronDown,
  ChevronUp,
  Scale,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface SocialListeningOperationalWorkflowProps {
  sentiment: SentimentOverview;
  newsItems: ScrapedNewsItem[];
  onSelectArticle: (item: ScrapedNewsItem) => void;
  isDark: boolean;
  onNavigateTab: (tab: 'dashboard' | 'table' | 'briefing' | 'analytics') => void;
}

export const SocialListeningOperationalWorkflow: React.FC<SocialListeningOperationalWorkflowProps> = ({
  sentiment,
  newsItems,
  onSelectArticle,
  isDark,
}) => {
  const [isWorkflowCollapsed, setIsWorkflowCollapsed] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [crisisSimulatedActions, setCrisisSimulatedActions] = useState<string[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isRemovingFakeNews, setIsRemovingFakeNews] = useState<boolean>(false);
  const [removeFakeNewsResult, setRemoveFakeNewsResult] = useState<string | null>(null);

  // Evidence Dossier & Reader Comments Modal States
  const [isDossierModalOpen, setIsDossierModalOpen] = useState<boolean>(false);
  const [dossierArticle, setDossierArticle] = useState<ScrapedNewsItem | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState<boolean>(false);
  const [commentArticle, setCommentArticle] = useState<ScrapedNewsItem | null>(null);

  // Identify highest priority crisis/negative article for evidence dossier
  const targetRiskArticle = useMemo(() => {
    return newsItems.find(n => (n.sentimentScore !== undefined && n.sentimentScore < -20) || n.isEmergency || n.isHighConfidenceRisk) || newsItems[0] || null;
  }, [newsItems]);

  // Advanced interactive simulated states for Virality & Post-Crisis Cooling
  const [simulatedVirality, setSimulatedVirality] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [simulatedConsensus, setSimulatedConsensus] = useState<number>(88);
  const [isScanningPostCrisis, setIsScanningPostCrisis] = useState<boolean>(false);
  const [postCrisisStatus, setPostCrisisStatus] = useState<string>('Đang giám sát nền...');
  const [engagementFrequency, setEngagementFrequency] = useState<number>(1420); // interactions per hour

  // General policy news items
  const scannedPolicies = useMemo(() => {
    return newsItems.slice(0, 4);
  }, [newsItems]);

  // Determine if active warning threshold is breached (under 85%)
  const positiveIndex = sentiment.bullishPercentage;
  const isThresholdBreached = positiveIndex < 85;

  const handleSimulateAction = (actionKey: string, message: string) => {
    if (!crisisSimulatedActions.includes(actionKey)) {
      setCrisisSimulatedActions(prev => [...prev, actionKey]);
    }
    setActionNotice(message);
    setTimeout(() => {
      setActionNotice(null);
    }, 4500);
  };

  const handleRequestFakeNewsRemoval = () => {
    setIsRemovingFakeNews(true);
    setRemoveFakeNewsResult(null);
    setTimeout(() => {
      setIsRemovingFakeNews(false);
      setRemoveFakeNewsResult('Đã lập hồ sơ chứng cứ, gửi yêu cầu phối hợp với Cục Phát thanh, Truyền hình và Thông tin điện tử (Bộ TT&TT) rà quét và yêu cầu gỡ bỏ thành công 3 bài viết sai lệch.');
      setEngagementFrequency(prev => Math.round(prev * 0.45)); // lower interaction frequency after removal
    }, 1500);
  };

  const triggerPostCrisisScan = () => {
    setIsScanningPostCrisis(true);
    setPostCrisisStatus('Đang kích hoạt quét tự động tần suất tương tác hậu sự cố...');
    setTimeout(() => {
      setIsScanningPostCrisis(false);
      setPostCrisisStatus('Hoàn tất quét! Tần suất tương tác giảm sâu 72% so với đỉnh điểm. Mức độ lan tỏa đã hạ xuống mức "An toàn".');
      setSimulatedVirality('Low');
      setSimulatedConsensus(92);
      setEngagementFrequency(120); // significantly lower activity
    }, 2000);
  };

  const steps = [
    {
      id: 1,
      title: '1. Quét & Phát hiện sớm',
      shortTitle: 'Phát hiện sớm',
      desc: 'Quét tự động tần suất tương tác trên không gian mạng, kết hợp "Điểm báo" hằng ngày.',
      icon: Search,
      color: 'emerald',
    },
    {
      id: 2,
      title: '2. Đo lường & Cảnh báo',
      shortTitle: 'Đo lường & Cảnh báo',
      desc: 'Đo lường tốc độ lan tỏa & tỷ lệ đồng thuận xã hội. Cảnh báo khẩn cấp dưới 85%.',
      icon: BellRing,
      color: isThresholdBreached ? 'rose' : 'amber',
    },
    {
      id: 3,
      title: '3. Hỗ trợ xử lý',
      shortTitle: 'Xử lý khủng hoảng',
      desc: 'Tác chiến khẩn cấp, phối hợp gỡ bỏ bài đăng bôi nhọ sai lệch & lấp khoảng trống thông tin.',
      icon: FileCheck,
      color: 'sky',
    },
    {
      id: 4,
      title: '4. Giám sát hậu khủng hoảng',
      shortTitle: 'Giám sát sau đó',
      desc: 'Quét tần suất tương tác hậu khủng hoảng để đánh giá hiệu quả hạ nhiệt của sự cố.',
      icon: Activity,
      color: 'purple',
    },
  ];

  return (
    <div
      id="social-listening-workflow"
      className={`border rounded-2xl p-4 sm:p-5 shadow-md transition-colors duration-200 ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
      }`}
    >
      {/* Component Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2 flex-wrap">
              <span>Hệ Thống Lắng Nghe Mạng Xã Hội Bộ Tài Chính</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                isThresholdBreached 
                  ? (isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' : 'bg-rose-100 text-rose-900 border-rose-300') 
                  : (isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-900 border-emerald-300')
              }`}>
                {isThresholdBreached ? 'Cảnh báo Nguy cơ Cao' : 'Vận hành Chủ động'}
              </span>
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
              <span className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Đầu mối khai thác dữ liệu chính: <strong className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Văn phòng Bộ Tài chính</strong>
              </span>
              <span className="text-slate-400 dark:text-slate-600">•</span>
              <span className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Chỉ đạo: <strong className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Ban Chỉ đạo Truyền thông Chiến lược</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 lg:mt-0 flex-wrap">
          <div className="flex flex-col items-start lg:items-end">
            <span className={`text-[10px] font-bold uppercase tracking-tight ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Chỉ số truyền thông tích cực</span>
            <span className={`text-xs font-black font-mono px-2.5 py-1 rounded-lg border mt-0.5 ${
              isThresholdBreached 
                ? (isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-rose-100 text-rose-900 border-rose-300 font-bold') 
                : (isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold')
            }`}>
              {positiveIndex}% / Tiêu chuẩn &ge; 85%
            </span>
          </div>

          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={() => setIsWorkflowCollapsed(!isWorkflowCollapsed)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title={isWorkflowCollapsed ? 'Mở rộng chi tiết quy trình 4 bước' : 'Thu gọn quy trình'}
          >
            <span>{isWorkflowCollapsed ? 'Mở rộng quy trình' : 'Thu gọn'}</span>
            {isWorkflowCollapsed ? <ChevronDown className="w-4 h-4 text-emerald-500" /> : <ChevronUp className="w-4 h-4 text-emerald-500" />}
          </button>
        </div>
      </div>

      {!isWorkflowCollapsed && (
        <div className="pt-2 space-y-4">

      {/* Core Real-Time Shared Indicators Banner */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3.5 rounded-xl border ${
        isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-300'
      }`}>
        <div>
          <span className={`text-[10px] font-bold uppercase block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Tần suất tương tác thực tế</span>
          <span className={`text-sm font-black font-mono mt-0.5 block flex items-center gap-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
            <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
            {engagementFrequency.toLocaleString()} lượt / giờ
          </span>
        </div>
        <div>
          <span className={`text-[10px] font-bold uppercase block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Tốc độ lan tỏa</span>
          <span className={`text-sm font-black font-mono mt-0.5 block flex items-center gap-1 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            {simulatedVirality === 'Low' ? 'Thấp (1.1x)' : simulatedVirality === 'Medium' ? 'Trung bình (2.4x)' : simulatedVirality === 'High' ? 'Nhanh (5.8x)' : 'Báo động (9.5x)'}
          </span>
        </div>
        <div>
          <span className={`text-[10px] font-bold uppercase block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Tỷ lệ đồng thuận xã hội</span>
          <span className={`text-sm font-black font-mono mt-0.5 block flex items-center gap-1 ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
            <UserCheck className="w-3.5 h-3.5 text-sky-500" />
            {simulatedConsensus}%
          </span>
        </div>
        <div>
          <span className={`text-[10px] font-bold uppercase block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Nhiệm vụ trọng tâm</span>
          <span className={`text-[11px] font-bold mt-0.5 block truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            Chuyển "Bị động ứng phó" thành "Chủ động dẫn dắt"
          </span>
        </div>
      </div>

      {/* 4 Steps Interactive Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {steps.map((step) => {
          const IconComponent = step.icon;
          const isActive = currentStep === step.id;
          
          let tabClass = '';
          if (isActive) {
            tabClass = isDark
              ? 'bg-slate-800 border-emerald-500 text-emerald-300 font-bold shadow-sm'
              : 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold shadow-xs';
          } else {
            tabClass = isDark
              ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-950';
          }

          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${tabClass}`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className={`text-[10px] font-black tracking-wider uppercase ${isActive ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
                  Bước {step.id}
                </span>
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
              </div>
              <span className="text-xs truncate font-bold leading-tight">{step.shortTitle}</span>
            </button>
          );
        })}
      </div>

      {/* Step Content Area */}
      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50/80 border-slate-300'} min-h-[250px] transition-all`}>
        
        {/* STEP 1: SCAN AND EARLY DETECT */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0 shadow-xs">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                  Bước 1: Quét dữ liệu tự động & Phát hiện sớm dư luận
                </h4>
                <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Hệ thống <strong>"Lắng nghe mạng xã hội"</strong> được vận hành tự động 24/7 để trực tiếp <strong>"quét tần suất tương tác"</strong> của người dân, tổ chức và doanh nghiệp trên không gian mạng (Mạng xã hội, Diễn đàn, Báo điện tử). Văn phòng Bộ là đơn vị đầu mối chịu trách nhiệm trực tiếp phối hợp với công tác "Điểm báo" hằng ngày nhằm nắm bắt toàn diện tình hình, phản hồi tiêu cực đối với chính sách tài chính mới.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {/* Left Column: Live Scanned Policy Subjects */}
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} space-y-2.5 shadow-xs`}>
                <div className={`flex items-center justify-between text-[11px] font-black uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>🛰️ Tự động quét Tần suất tương tác</span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="space-y-2">
                  {scannedPolicies.map((item, index) => {
                    const cleanTitle = decodeHtmlEntities(item.title);
                    return (
                      <div
                        key={item.id || index}
                        onClick={() => onSelectArticle(item)}
                        className={`p-2.5 rounded-xl text-xs border cursor-pointer transition flex items-center justify-between gap-2.5 ${
                          isDark 
                            ? 'bg-slate-950/70 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/80 text-slate-200' 
                            : 'bg-slate-50 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-900'
                        }`}
                      >
                        <span className="font-bold truncate max-w-[200px]">{cleanTitle}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <SourceBrandBadge source={item.source} size="sm" />
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Key unit details & interactive control */}
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} flex flex-col justify-between shadow-xs`}>
                <div>
                  <span className={`text-[11px] font-black uppercase block mb-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                    🏢 Đầu mối quản lý & Khai thác
                  </span>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    <strong>Văn phòng Bộ Tài chính</strong> chịu trách nhiệm chính trong việc:
                  </p>
                  <ul className={`text-xs space-y-1.5 mt-2 list-disc pl-4 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <li>Rà quét tần suất thảo luận để tránh các tin tiêu cực bùng phát.</li>
                    <li>Tổng hợp dữ liệu Điểm báo và Social Listening hằng ngày để báo cáo khẩn cấp.</li>
                    <li>Đảm bảo giữ vững mục tiêu chỉ số truyền thông tích cực trên <strong>85%</strong>.</li>
                  </ul>
                </div>
                <div className="pt-3">
                  <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
                    isDark ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-emerald-50 border-emerald-300'
                  }`}>
                    <span className={`text-[11px] font-black uppercase ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>TRẠNG THÁI QUÉT TỰ ĐỘNG</span>
                    <span className={`text-[11px] font-black font-mono animate-pulse ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>HOẠT ĐỘNG 24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: MEASURE INDICATORS AND ALARM */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 shadow-xs ${isThresholdBreached ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-600 text-white'}`}>
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-xs font-black uppercase tracking-wider ${isThresholdBreached ? (isDark ? 'text-rose-400' : 'text-rose-800') : (isDark ? 'text-emerald-400' : 'text-emerald-800')}`}>
                  Bước 2: Đo lường tốc độ lan tỏa & Cảnh báo nhanh
                </h4>
                <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Dựa trên dữ liệu thu thập, <strong>Ban Chỉ đạo Truyền thông Chiến lược</strong> sẽ định kỳ kiểm tra và giám sát <strong>tốc độ lan tỏa</strong> của các thông tin liên quan đến chính sách, đánh giá tỷ lệ đồng thuận của xã hội. Nếu chỉ số truyền thông tích cực giảm xuống dưới 85%, hệ thống lập tức kích hoạt quy trình cảnh báo khẩn cấp.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {/* Left Box: Virality and Consensus Control Panel */}
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} space-y-3 shadow-xs`}>
                <span className={`text-[11px] font-black uppercase block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  ⚡ Điều chỉnh giả lập các thông số (Hãy thử tăng giảm)
                </span>
                
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      <Flame className="w-4 h-4 text-amber-500" /> Tốc độ lan tỏa:
                    </span>
                    <span className={`font-mono font-black ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{simulatedVirality}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['Low', 'Medium', 'High', 'Critical'] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          setSimulatedVirality(v);
                          if (v === 'Low') {
                            setSimulatedConsensus(91);
                            setEngagementFrequency(240);
                          } else if (v === 'Medium') {
                            setSimulatedConsensus(84);
                            setEngagementFrequency(1450);
                          } else if (v === 'High') {
                            setSimulatedConsensus(65);
                            setEngagementFrequency(4850);
                          } else {
                            setSimulatedConsensus(42);
                            setEngagementFrequency(12500);
                          }
                        }}
                        className={`py-1.5 rounded-lg text-[10px] font-black uppercase transition border cursor-pointer ${
                          simulatedVirality === v
                            ? (isDark ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-amber-500 text-slate-950 border-amber-600')
                            : (isDark ? 'bg-slate-950/70 border-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900')
                        }`}
                      >
                        {v === 'Low' ? 'Thấp' : v === 'Medium' ? 'Trung' : v === 'High' ? 'Cao' : 'Khẩn'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      <UserCheck className="w-4 h-4 text-sky-500" /> Tỷ lệ đồng thuận xã hội:
                    </span>
                    <span className={`font-mono font-black ${simulatedConsensus >= 85 ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-rose-400' : 'text-rose-700')}`}>
                      {simulatedConsensus}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={simulatedConsensus}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSimulatedConsensus(val);
                      if (val >= 85) {
                        setSimulatedVirality('Low');
                      } else if (val >= 70) {
                        setSimulatedVirality('Medium');
                      } else {
                        setSimulatedVirality('High');
                      }
                    }}
                    className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
              </div>

              {/* Right Box: Dynamic strategic action recommendations */}
              <div className={`p-3.5 rounded-xl border flex flex-col justify-between shadow-xs ${
                simulatedConsensus < 85 
                  ? (isDark ? 'border-rose-500/40 bg-rose-950/30' : 'border-rose-300 bg-rose-50') 
                  : (isDark ? 'border-emerald-500/30 bg-emerald-950/30' : 'border-emerald-300 bg-emerald-50')
              }`}>
                <div>
                  <div className="flex items-center gap-2 font-black text-xs">
                    {simulatedConsensus < 85 ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
                        <span className={isDark ? 'text-rose-300' : 'text-rose-900'}>CẢNH BÁO: TỶ LỆ ĐỒNG THUẬN GIẢM SÂU</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span className={isDark ? 'text-emerald-300' : 'text-emerald-900'}>DƯ LUẬN NẰM TRONG TẦM KIỂM SOÁT</span>
                      </>
                    )}
                  </div>
                  <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    Khi tỷ lệ đồng thuận xã hội là <strong className="font-mono">{simulatedConsensus}%</strong> (Chỉ số an toàn: &ge; 85%), hệ thống sẽ đưa ra các khuyến nghị:
                  </p>
                  
                  {simulatedConsensus < 85 ? (
                    <div className={`mt-2.5 p-2.5 rounded-xl border text-xs space-y-1.5 ${
                      isDark ? 'bg-slate-950/90 border-rose-500/30 text-rose-300' : 'bg-white border-rose-300 text-rose-950'
                    }`}>
                      <p>⚠️ <strong>Tốc độ lan tỏa rất nhanh:</strong> Cần kích hoạt quy trình xử lý khẩn cấp trong vòng 24 giờ.</p>
                      <p>📞 Báo cáo khẩn thiết lập Ban Chỉ đạo xử lý sự cố truyền thông.</p>
                    </div>
                  ) : (
                    <div className={`mt-2.5 p-2.5 rounded-xl border text-xs space-y-1.5 ${
                      isDark ? 'bg-slate-950/90 border-emerald-500/30 text-emerald-300' : 'bg-white border-emerald-300 text-emerald-950'
                    }`}>
                      <p>✅ Nhiệt độ thảo luận bình thường. Văn phòng Bộ Tài chính định kỳ trích xuất dữ liệu, tiếp tục vận hành giám sát thụ động.</p>
                    </div>
                  )}
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className={`w-full text-center py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                      isDark 
                        ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' 
                        : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300 shadow-xs'
                    }`}
                  >
                    Xem giải pháp can thiệp của Bộ &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* REAL READER COMMENTS CITIZEN SENTIMENT STREAM (YÊU CẦU ĐỘC GIẢ THỰC TẾ) */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
              isDark ? 'bg-sky-950/20 border-sky-800/40' : 'bg-sky-50 border-sky-200'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-black uppercase text-sky-400">
                    Khai Thác Luồng Bình Luận Độc Giả Thực Tế Từ Báo Chí Lớn
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono font-bold">
                    VnExpress, Dân Trí, Tuổi Trẻ...
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Đo lường sắc thái dư luận công chúng thật (Citizen Sentiment), phân tích tỷ lệ tán thành vs phản biện, và phát hiện độ lệch pha giữa báo chí và độc giả.
                </p>
              </div>

              <button
                onClick={() => {
                  setCommentArticle(targetRiskArticle || newsItems[0] || null);
                  setIsCommentModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shrink-0 flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Xem Phân Tích Bình Luận Độc Giả</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CRISIS MITIGATION SUPPORT */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-sky-600 text-white rounded-xl shrink-0 shadow-xs">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-sky-400' : 'text-sky-800'}`}>
                  Bước 3: Hỗ trợ xử lý khủng hoảng truyền thông
                </h4>
                <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Dựa trên các dữ liệu cảnh báo từ hệ thống Lắng nghe mạng xã hội, Bộ Tài chính nhanh chóng thực hiện quy trình phản ứng chiến dịch để lấp đầy khoảng trống thông tin và bảo vệ uy tín chính sách.
                </p>
              </div>
            </div>

            {actionNotice && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-fadeIn ${
                isDark ? 'bg-sky-950/60 border-sky-500/40 text-sky-200' : 'bg-sky-50 border-sky-300 text-sky-950'
              }`}>
                <Info className="w-4 h-4 text-sky-500 shrink-0" />
                <span>{actionNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Interactive Playbook tool list */}
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} space-y-2.5 shadow-xs`}>
                <span className={`text-[11px] font-black uppercase block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  🛠️ Kế hoạch can thiệp nhanh của Tổ tác chiến
                </span>
                
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      handleSimulateAction(
                        'tac_chien_team',
                        'Bộ trưởng thành lập ngay Nhóm Tác chiến Phản ứng nhanh gồm: Lãnh đạo Văn phòng Bộ, Cục Tin học, Cục Thuế và Thuế địa phương, Ủy ban Chứng khoán Nhà nước.'
                      );
                    }}
                    className={`w-full p-2.5 rounded-xl text-left text-xs border flex items-center justify-between transition cursor-pointer ${
                      crisisSimulatedActions.includes('tac_chien_team')
                        ? (isDark ? 'bg-sky-950/40 border-sky-500/50 text-sky-300 font-bold' : 'bg-sky-50 border-sky-400 text-sky-950 font-bold')
                        : (isDark ? 'bg-slate-950/70 border-slate-800 text-slate-200 hover:bg-slate-800' : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100')
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-sky-500 shrink-0" />
                      1. Thành lập Nhóm Tác chiến phản ứng nhanh
                    </span>
                    {crisisSimulatedActions.includes('tac_chien_team') ? (
                      <Check className="w-4 h-4 text-sky-500 shrink-0" />
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'}`}>Kích hoạt</span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      handleSimulateAction(
                        'official_docs',
                        'Ban hành các thông điệp, văn bản phản hồi chính thống để lấp đầy khoảng trống thông tin, giải thích tường minh dự thảo luật thuế mới.'
                      );
                    }}
                    className={`w-full p-2.5 rounded-xl text-left text-xs border flex items-center justify-between transition cursor-pointer ${
                      crisisSimulatedActions.includes('official_docs')
                        ? (isDark ? 'bg-sky-950/40 border-sky-500/50 text-sky-300 font-bold' : 'bg-sky-50 border-sky-400 text-sky-950 font-bold')
                        : (isDark ? 'bg-slate-950/70 border-slate-800 text-slate-200 hover:bg-slate-800' : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100')
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                      2. Phát hành văn bản phản hồi chính thống
                    </span>
                    {crisisSimulatedActions.includes('official_docs') ? (
                      <Check className="w-4 h-4 text-sky-500 shrink-0" />
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'}`}>Kích hoạt</span>
                    )}
                  </button>
                </div>
              </div>

              {/* AUTOMATED VIOLATION EVIDENCE DOSSIER GENERATOR (UPGRADED FROM SIMULATED REMOVAL BUTTON) */}
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} flex flex-col justify-between shadow-xs`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[11px] font-black uppercase flex items-center gap-1.5 ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                      <Scale className="w-4 h-4 text-rose-500" /> Tự Động Lập Hồ Sơ Bằng Chứng Vi Phạm (Thực Tế)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      Nghị định 72 & 15/2020
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed mb-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Thay vì chỉ bấm nút gỡ bài giả lập, hệ thống tự động cố định hiện trạng bài viết, tính toán mã băm SHA-256 bảo đảm toàn vẹn chứng cứ pháp lý, viện dẫn chính xác các điều khoản xử phạt và xuất <strong>Biên bản giám định kèm Ảnh chụp lưu trữ số</strong> gửi Cục PTTH&TTĐT và Cục An ninh mạng A05.
                  </p>

                  {targetRiskArticle && (
                    <div className={`p-2.5 rounded-xl text-xs border mb-3 ${
                      isDark ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                        <span>BÀI VIẾT NGUY CƠ ĐƯỢC CHỌN LẬP HỒ SƠ:</span>
                        <span className="text-rose-400 font-mono">{targetRiskArticle.source}</span>
                      </div>
                      <p className="font-bold text-rose-400 line-clamp-1">{targetRiskArticle.title}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setDossierArticle(targetRiskArticle);
                    setIsDossierModalOpen(true);
                  }}
                  className={`w-full py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border shadow-sm ${
                    isDark
                      ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500'
                      : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Tự Động Lập Hồ Sơ Bằng Chứng & Xuất Biên Bản</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: POST-CRISIS MONITORING */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-purple-600 text-white rounded-xl shrink-0 shadow-xs">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-purple-400' : 'text-purple-800'}`}>
                  Bước 4: Giám sát hậu khủng hoảng & Đánh giá hiệu quả
                </h4>
                <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <strong>Đo lường tần suất tương tác là bước bắt buộc trong quy trình xử lý sự cố truyền thông.</strong> Sau khi phối hợp gỡ bỏ các thông tin sai lệch và ban hành thông cáo phản hồi chính thống, hệ thống tiếp tục quét tự động tần suất tương tác thảo luận để đánh giá xem sự cố đã thực sự hạ nhiệt hay chưa, đảm bảo chỉ số tích cực quay về trạng thái an toàn trên 85%.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {/* Interaction cooling tracker graph with interactive refresh scan */}
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} space-y-3 shadow-xs`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-black uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    📈 Tần suất tương tác qua các mốc thời gian
                  </span>
                  <button
                    onClick={triggerPostCrisisScan}
                    disabled={isScanningPostCrisis}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 text-[10px] font-black uppercase border cursor-pointer ${
                      isDark 
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanningPostCrisis ? 'animate-spin text-emerald-500' : ''}`} />
                    Quét Lại
                  </button>
                </div>
                
                <div className={`h-28 flex items-end justify-between px-4 pb-2 pt-1 border-b ${isDark ? 'border-slate-800' : 'border-slate-300'}`}>
                  {/* Visual bars representing negative interaction count cooling down */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-rose-600 font-bold font-mono">12.5K</span>
                    <div className="w-6 bg-rose-500 h-20 rounded-t shadow-xs" />
                    <span className={`text-[9px] font-bold mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Đỉnh sự cố</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-orange-600 font-bold font-mono">4.8K</span>
                    <div className="w-6 bg-orange-500 h-10 rounded-t shadow-xs" />
                    <span className={`text-[9px] font-bold mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Gỡ tin sai</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-amber-600 font-bold font-mono">{engagementFrequency < 500 ? '120' : '1.4K'}</span>
                    <div className={`w-6 bg-amber-500 rounded-t transition-all duration-500 shadow-xs ${engagementFrequency < 500 ? 'h-3' : 'h-6'}`} />
                    <span className={`text-[9px] font-bold mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Hôm nay</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-emerald-600 font-bold font-mono">&lt; 150</span>
                    <div className="w-6 bg-emerald-500 h-3 rounded-t shadow-xs" />
                    <span className={`text-[9px] font-bold mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Mức nền</span>
                  </div>
                </div>

                <div className={`text-xs flex items-center justify-between font-mono p-2 rounded-xl border ${
                  isDark ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <span className="font-bold">Trạng thái:</span>
                  <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{postCrisisStatus}</span>
                </div>
              </div>

              {/* Recovery Verification Panel */}
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} flex flex-col justify-between shadow-xs`}>
                <div>
                  <span className={`text-[11px] font-black uppercase block mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    ✅ Biên bản Nghiệm thu Khắc phục
                  </span>
                  
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className={isDark ? 'text-slate-200' : 'text-slate-800 font-medium'}>Tần suất tương tác bài viết tiêu cực giảm về mức kiểm soát an toàn.</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className={isDark ? 'text-slate-200' : 'text-slate-800 font-medium'}>Thông cáo đính chính chính thống đứng top đầu kết quả tìm kiếm.</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className={isDark ? 'text-slate-200' : 'text-slate-800 font-medium'}>Chỉ số truyền thông tích cực khôi phục về trên <strong>85%</strong>.</span>
                    </div>
                  </div>
                </div>

                <div className={`text-xs p-2.5 rounded-xl border font-medium mt-3 ${
                  isDark ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                }`}>
                  🚀 Quy trình khép kín giúp Bộ Tài chính nâng tầm quản trị mạng xã hội vững chắc, giữ vững sự an tâm của xã hội.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
      )}
      {/* Evidence Dossier Modal */}
      <ViolationEvidenceDossierModal
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
        article={dossierArticle}
        isDark={isDark}
      />

      {/* Reader Comments Sentiment Analysis Modal */}
      <ReaderCommentsSentimentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        article={commentArticle}
        onOpenViolationDossier={(art) => {
          setDossierArticle(art);
          setIsDossierModalOpen(true);
        }}
        isDark={isDark}
      />
    </div>
  );
};
