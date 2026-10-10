import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileCheck,
  FileEdit,
  Mail,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Info,
  Layers,
  Activity,
  Award,
  Zap,
  HelpCircle,
  Clock,
  Send,
  Eye,
  GitCommit,
  GitBranch,
  Network,
  Share2,
  Calendar,
  Compass,
  ArrowRight,
  Radio,
  Tag,
  Hash,
  GitFork,
  Target,
  Filter,
  Landmark,
  Users
} from 'lucide-react';
import { ScrapedNewsItem, SectorStat, SectorType, SECTOR_NAMES, formatNewsTimeDisplay } from '../types';
import { useTheme } from '../lib/theme';
import { enrichArticleWithDiagnosticAndGap } from '../lib/sentimentAndGapEngine';
import { calculateNormalizedSentiment } from '../lib/sentimentNormalization';
import { ImpactChainViewer } from './ImpactChainViewer';
import { SourceBrandBadge } from './SourceBrandBadge';
import { SentimentSmartFilterSection } from './SentimentSmartFilterSection';
import { SmartFilterCategory } from '../lib/sentimentSmartFilter';

interface SentimentLeadershipAdvisoryModuleProps {
  newsItems: ScrapedNewsItem[];
  sectorStats: SectorStat[];
  onDraftStatement?: (article: ScrapedNewsItem) => void;
  onOpenGmailAlertModal?: (article?: ScrapedNewsItem) => void;
  onDeepDive?: (article: ScrapedNewsItem) => void;
}

export interface CorrelatedEventChain {
  id: string;
  topicTitle: string;
  keyEntity: string;
  summary: string;
  articles: ScrapedNewsItem[];
  earliestDate: string;
  latestDate: string;
  dominantSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentTrend: 'escalating_risk' | 'cooling_down' | 'positive_momentum' | 'stable';
  policyImpactDomain: string;
  recommendedAction: string;
}

export const SentimentLeadershipAdvisoryModule: React.FC<SentimentLeadershipAdvisoryModuleProps> = ({
  newsItems,
  sectorStats,
  onDraftStatement,
  onOpenGmailAlertModal,
  onDeepDive,
}) => {
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'overview' | 'smart_filter' | 'impact_chain' | 'events' | 'advisory' | 'matrix' | 'sectors'>('overview');
  const [smartFilterInitialCategory, setSmartFilterInitialCategory] = useState<SmartFilterCategory>('all');
  const [selectedSentimentFilter, setSelectedSentimentFilter] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all');
  const [expandedChainId, setExpandedChainId] = useState<string | null>(null);
  const [selectedChainFilter, setSelectedChainFilter] = useState<'all' | 'escalating_risk' | 'positive_momentum' | 'stable'>('all');
  
  // State for Impact Chain tab
  const [impactChainRiskFilter, setImpactChainRiskFilter] = useState<'all' | 'CRITICAL' | 'ELEVATED' | 'MODERATE'>('all');
  const [impactChainSectorFilter, setImpactChainSectorFilter] = useState<string>('all');
  const [impactChainSearch, setImpactChainSearch] = useState<string>('');

  // Extract negative articles and their inferred multi-sector impact chains
  const negativeArticlesWithChain = useMemo(() => {
    if (!newsItems || newsItems.length === 0) return [];
    return newsItems
      .filter((i) => i.sentiment === 'bearish' || (i.sentimentScore !== undefined && i.sentimentScore < 0) || i.isEmergency)
      .map((i) => {
        if (i.sentimentDiagnostic?.impactChain) return i;
        return enrichArticleWithDiagnosticAndGap(i);
      })
      .filter((i) => i.sentimentDiagnostic?.impactChain !== undefined);
  }, [newsItems]);

  // Statistics for Impact Chains
  const impactChainStats = useMemo(() => {
    const total = negativeArticlesWithChain.length;
    const critical = negativeArticlesWithChain.filter(
      (a) => a.sentimentDiagnostic?.impactChain?.spilloverRiskLevel === 'CRITICAL'
    ).length;
    const elevated = negativeArticlesWithChain.filter(
      (a) => a.sentimentDiagnostic?.impactChain?.spilloverRiskLevel === 'ELEVATED'
    ).length;
    const moderate = negativeArticlesWithChain.filter(
      (a) => a.sentimentDiagnostic?.impactChain?.spilloverRiskLevel === 'MODERATE'
    ).length;

    // Origin sectors frequency
    const originSectorsCount: Record<string, number> = {};
    // Impacted secondary/systemic sectors frequency
    const impactedSectorsCount: Record<string, number> = {};

    negativeArticlesWithChain.forEach((a) => {
      const chain = a.sentimentDiagnostic?.impactChain;
      if (!chain) return;
      
      const origin = a.sectorNameVi || a.sector || 'Khác';
      originSectorsCount[origin] = (originSectorsCount[origin] || 0) + 1;

      chain.chainNodes.forEach((node) => {
        if (node.level !== 'DIRECT') {
          impactedSectorsCount[node.sectorNameVi] = (impactedSectorsCount[node.sectorNameVi] || 0) + 1;
        }
      });
    });

    const topOriginSector = Object.entries(originSectorsCount).sort((a, b) => b[1] - a[1])[0] || ['Chưa có', 0];
    const topImpactedSector = Object.entries(impactedSectorsCount).sort((a, b) => b[1] - a[1])[0] || ['Chưa có', 0];

    return {
      total,
      critical,
      elevated,
      moderate,
      topOriginSector,
      topImpactedSector,
      originSectorsCount,
      impactedSectorsCount
    };
  }, [negativeArticlesWithChain]);

  // Filtered list of impact chain articles
  const filteredImpactChainArticles = useMemo(() => {
    return negativeArticlesWithChain.filter((article) => {
      const chain = article.sentimentDiagnostic?.impactChain;
      if (!chain) return false;

      // Risk level filter
      if (impactChainRiskFilter !== 'all' && chain.spilloverRiskLevel !== impactChainRiskFilter) {
        return false;
      }

      // Sector filter (matches origin or any node in chain)
      if (impactChainSectorFilter !== 'all') {
        const matchesOrigin = article.sector === impactChainSectorFilter || article.sectorNameVi?.toLowerCase().includes(impactChainSectorFilter.toLowerCase());
        const matchesNode = chain.chainNodes.some(
          (n) => n.sector === impactChainSectorFilter || n.sectorNameVi.toLowerCase().includes(impactChainSectorFilter.toLowerCase())
        );
        if (!matchesOrigin && !matchesNode) return false;
      }

      // Search keyword filter
      if (impactChainSearch.trim()) {
        const term = impactChainSearch.toLowerCase();
        const matchesTitle = article.title.toLowerCase().includes(term);
        const matchesPath = chain.transmissionPathSummary.toLowerCase().includes(term);
        const matchesNodes = chain.chainNodes.some(
          (n) => n.sectorNameVi.toLowerCase().includes(term) || n.consequence.toLowerCase().includes(term) || n.mechanism.toLowerCase().includes(term)
        );
        if (!matchesTitle && !matchesPath && !matchesNodes) return false;
      }

      return true;
    });
  }, [negativeArticlesWithChain, impactChainRiskFilter, impactChainSectorFilter, impactChainSearch]);

  // Helper keyword extractor for event correlation
  const eventChains: CorrelatedEventChain[] = useMemo(() => {
    if (!newsItems || newsItems.length === 0) return [];

    // Semantic cluster keywords mapping to major MoF and market topics
    const TOPIC_CLUSTERS = [
      {
        id: 'chain_upgrade_prefunding',
        title: 'Tiến trình Nâng hạng TTCK & Cơ chế Non-prefunding (Thông tư 68)',
        entity: 'UBCKNN / FTSE Russell / BTC',
        domain: 'Thị trường Chứng khoán & Đầu tư Gián tiếp Nước ngoài',
        keywords: ['nâng hạng', 'ftse', 'msci', 'non-prefunding', 'thông tư 68', 'tt68', 'ký quỹ', 'ubcknn', 'khối ngoại'],
        defaultRecommendation: 'Đôn đốc các CTCK và ngân hàng lưu ký hoàn thiện hệ thống kết nối bù trừ, đảm bảo đáp ứng tiêu chuẩn FTSE vào kỳ đánh giá tới.',
      },
      {
        id: 'chain_bond_maturity',
        title: 'Áp lực Đáo hạn Trái phiếu Doanh nghiệp (TPDN) & Nghị định 08',
        entity: 'Doanh nghiệp BĐS / VBMA / BTC',
        domain: 'Thị trường Trái phiếu & Tái cơ cấu Nợ',
        keywords: ['trái phiếu', 'tpdn', 'đáo hạn', 'nghị định 08', 'chậm trả', 'khất nợ', 'vbma', 'trái chủ', 'hoán đổi'],
        defaultRecommendation: 'Giám sát chặt chẽ các đợt phát hành riêng lẻ, đôn đốc doanh nghiệp công bố thông tin minh bạch và thương lượng phương án tái cấu trúc nợ.',
      },
      {
        id: 'chain_vat_tax_policy',
        title: 'Chính sách Giảm Thuế VAT 2% & Hoàn Thuế Giá trị Gia tăng',
        entity: 'Cục Thuế / Quốc hội / Doanh nghiệp',
        domain: 'Chính sách Thuế & Quản lý Ngân sách Nhà nước',
        keywords: ['thuế vat', 'giảm thuế 2%', 'hoàn thuế', 'cục thuế', 'hóa đơn điện tử', 'ngân sách', 'nghị quyết quốc hội', 'thuế thu nhập'],
        defaultRecommendation: 'Đẩy mạnh giải quyết hồ sơ hoàn thuế VAT tự động, tuyên truyền lợi ích kích cầu tiêu dùng nội địa từ chính sách giảm thuế 2%.',
      },
      {
        id: 'chain_gold_forex_fx',
        title: 'Điều hành Chênh lệch Giá Vàng SJC & Ổn định Tỷ giá USD/VND',
        entity: 'Ngân hàng Nhà nước / BTC / SJC',
        domain: 'Thị trường Vàng, Ngoại hối & Ổn định Kinh tế Vĩ mô',
        keywords: ['giá vàng', 'vàng miếng', 'sjc', 'đấu thầu vàng', 'tỷ giá', 'usd/vnd', 'dxy', 'nhnn', 'ngoại tệ'],
        defaultRecommendation: 'Phối hợp liên ngành Thuế - Quản lý Thị trường kiểm tra hóa đơn điện tử từng lần bán vàng, đồng thời theo dõi sát thanh khoản ngoại tệ.',
      },
      {
        id: 'chain_public_investment_infra',
        title: 'Đẩy mạnh Giải ngân Vốn Đầu tư Công & Dự án Trọng điểm Quốc gia',
        entity: 'Bộ Kế hoạch & Đầu tư / Kho bạc Nhà nước',
        domain: 'Ngân sách Nhà nước & Vốn Đầu tư Công',
        keywords: ['đầu tư công', 'giải ngân', 'kho bạc', 'cao tốc', 'sân bay long thành', 'vốn ngân sách', 'vành đai 4'],
        defaultRecommendation: 'Tăng cường thanh toán điện tử qua KBNN, tháo gỡ vướng mắc giải phóng mặt bằng để đạt mục tiêu giải ngân trên 95% kế hoạch.',
      },
      {
        id: 'chain_customs_export_green',
        title: 'Chuyển đổi Xanh, Tiêu chuẩn CBAM & Hiện đại hóa Hải quan Thông minh',
        entity: 'Tổng cục Hải quan / Doanh nghiệp Xuất khẩu',
        domain: 'Hải quan, Thuế quan & Thương mại Quốc tế',
        keywords: ['hải quan', 'cbam', 'thuế carbon', 'xuất khẩu', 'thông quan', 'cửa khẩu', 'chống buôn lậu', 'chuyển đổi xanh'],
        defaultRecommendation: 'Hỗ trợ doanh nghiệp đo lường phát thải carbon theo cơ chế CBAM của EU và mở rộng hệ thống thông quan điện tử tự động 24/7.',
      },
      {
        id: 'chain_scic_divestment_soe',
        title: 'Đổi mới Doanh nghiệp Nhà nước & Kế hoạch Thoái vốn SCIC',
        entity: 'SCIC / Ủy ban Quản lý Vốn Nhà nước',
        domain: 'Tài chính Doanh nghiệp Nhà nước',
        keywords: ['scic', 'thoái vốn', 'doanh nghiệp nhà nước', 'dnnn', 'cổ phần hóa', 'bán vốn', 'quản lý vốn'],
        defaultRecommendation: 'Chuẩn bị danh mục bán vốn công khai, minh bạch trên sàn chứng khoán nhằm tối ưu hóa giá trị tài sản nhà nước.',
      },
      {
        id: 'chain_fintech_digital_assets',
        title: 'Khung Pháp lý Thử nghiệm (Sandbox) Fintech & Tài sản Số',
        entity: 'BTC / NHNN / Trung tâm Đổi mới Sáng tạo',
        domain: 'Kinh tế Số & Tài chính Công nghệ',
        keywords: ['sandbox', 'fintech', 'tài sản số', 'tiền điện tử', 'chuyển đổi số', 'kinh tế số', 'ngân hàng số'],
        defaultRecommendation: 'Chủ động nghiên cứu kinh nghiệm quốc tế để tham mưu ban hành khung pháp lý kiểm soát rủi ro rửa tiền và quản lý thuế đối với tài sản mã hóa.',
      }
    ];

    const clusters: CorrelatedEventChain[] = [];

    TOPIC_CLUSTERS.forEach((tpl) => {
      const matchedArticles = newsItems.filter((art) => {
        const text = `${art.title} ${art.summary || ''} ${art.snippet || ''} ${art.sector || ''}`.toLowerCase();
        return tpl.keywords.some((kw) => text.includes(kw));
      });

      if (matchedArticles.length >= 2) {
        // Sort chronologically (earliest to latest or by date)
        const sorted = [...matchedArticles].sort((a, b) => {
          const tA = new Date(a.publishedAt || 0).getTime() || 0;
          const tB = new Date(b.publishedAt || 0).getTime() || 0;
          return tA - tB;
        });

        // Sentiment stats for this chain
        const bearishCount = sorted.filter((a) => a.sentiment === 'bearish').length;
        const bullishCount = sorted.filter((a) => a.sentiment === 'bullish').length;

        let dominantSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        if (bullishCount > bearishCount) dominantSentiment = 'bullish';
        else if (bearishCount > bullishCount) dominantSentiment = 'bearish';

        let sentimentTrend: 'escalating_risk' | 'cooling_down' | 'positive_momentum' | 'stable' = 'stable';
        if (bearishCount >= 2 && bearishCount > bullishCount) {
          sentimentTrend = 'escalating_risk';
        } else if (bullishCount >= 2 && bullishCount > bearishCount) {
          sentimentTrend = 'positive_momentum';
        } else if (bearishCount > 0 && bullishCount > 0) {
          sentimentTrend = 'cooling_down';
        }

        const earliestDate = sorted[0]?.publishedTimeStr || sorted[0]?.timeAgo || 'Gần đây';
        const latestDate = sorted[sorted.length - 1]?.publishedTimeStr || sorted[sorted.length - 1]?.timeAgo || 'Vừa cập nhật';

        clusters.push({
          id: tpl.id,
          topicTitle: tpl.title,
          keyEntity: tpl.entity,
          summary: `Chuỗi ghi nhận ${sorted.length} bài báo liên kết từ các đầu báo tài chính, phản ánh chu kỳ từ lúc phát sinh thông tin đến các động thái phản ứng mới nhất.`,
          articles: sorted,
          earliestDate,
          latestDate,
          dominantSentiment,
          sentimentTrend,
          policyImpactDomain: tpl.domain,
          recommendedAction: tpl.defaultRecommendation,
        });
      }
    });

    // Also build generic clusters from high-frequency co-occurring entities if fewer clusters matched
    if (clusters.length === 0 && newsItems.length >= 3) {
      const top3 = newsItems.slice(0, 3);
      clusters.push({
        id: 'chain_market_pulse',
        topicTitle: 'Diễn biến Thanh khoản & Sắc thái Thị trường Tài chính',
        keyEntity: 'Thị trường Tài chính Việt Nam',
        summary: `Tập hợp chuỗi ${top3.length} tin tức phản ánh diễn biến kinh tế và chuyển động chỉ số trong phiên giao dịch hôm nay.`,
        articles: top3,
        earliestDate: top3[top3.length - 1]?.timeAgo || 'Hôm nay',
        latestDate: top3[0]?.timeAgo || 'Vừa xong',
        dominantSentiment: 'neutral',
        sentimentTrend: 'stable',
        policyImpactDomain: 'Thị trường Vốn & Đầu tư',
        recommendedAction: 'Duy trì theo dõi biến động dòng tiền và thông cáo báo chí định kỳ.',
      });
    }

    return clusters;
  }, [newsItems]);

  const filteredEventChains = useMemo(() => {
    if (selectedChainFilter === 'all') return eventChains;
    return eventChains.filter((c) => c.sentimentTrend === selectedChainFilter);
  }, [eventChains, selectedChainFilter]);

  // Overall Sentiment Calculations (Normalized to 100%)
  const sentimentStats = useMemo(() => {
    const norm = calculateNormalizedSentiment(newsItems);
    return {
      total: norm.total,
      bullish: norm.bullish,
      bearish: norm.bearish,
      neutral: norm.neutral,
      bullishPct: norm.bullishPct,
      bearishPct: norm.bearishPct,
      neutralPct: norm.neutralPct,
      sum: norm.sum,
      sentimentScore: norm.sentimentScore,
      bullBearRatio: norm.ratio,
      marketMood: norm.marketMood,
      moodColor: norm.moodColor,
      formulaDisplay: norm.formulaDisplay,
    };
  }, [newsItems]);

  // High Impact Bearish Items (Crisis / Urgent Attention needed for Leadership)
  const highImpactBearishItems = useMemo(() => {
    return newsItems
      .filter((i) => i.sentiment === 'bearish' && (i.impactLevel === 'high' || i.buzzScore >= 65 || i.isEmergency))
      .sort((a, b) => (b.buzzScore || 0) - (a.buzzScore || 0));
  }, [newsItems]);

  // High Impact Bullish Items (Policy Successes / Strategic Opportunities)
  const highImpactBullishItems = useMemo(() => {
    return newsItems
      .filter((i) => i.sentiment === 'bullish' && (i.impactLevel === 'high' || i.buzzScore >= 60))
      .sort((a, b) => (b.buzzScore || 0) - (a.buzzScore || 0));
  }, [newsItems]);

  // Filtered news items based on sentiment selection
  const displayedNews = useMemo(() => {
    if (selectedSentimentFilter === 'all') return newsItems.slice(0, 10);
    return newsItems.filter((i) => i.sentiment === selectedSentimentFilter).slice(0, 10);
  }, [newsItems, selectedSentimentFilter]);

  // Sector Sentiment Radar Data
  const sectorRadarData = useMemo(() => {
    return sectorStats.slice(0, 6).map((stat) => {
      const totalInSector = (stat.bullishCount || 0) + (stat.bearishCount || 0) + (stat.neutralCount || 0);
      const score = totalInSector > 0 
        ? Math.round(50 + (((stat.bullishCount || 0) - (stat.bearishCount || 0)) / totalInSector) * 45)
        : 50;
      return {
        sectorName: stat.name.split('&')[0].trim(),
        sentimentScore: score,
        fullMark: 100,
      };
    });
  }, [sectorStats]);

  // Pie Chart Data
  const pieData = [
    { name: 'Tích cực (Bullish)', value: sentimentStats.bullish, color: '#10b981' },
    { name: 'Trung lập (Neutral)', value: sentimentStats.neutral, color: '#f59e0b' },
    { name: 'Tiêu cực (Bearish)', value: sentimentStats.bearish, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Banner Header */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isDark
            ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/30 border-slate-800'
            : 'bg-gradient-to-r from-white via-slate-50 to-indigo-50/50 border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-sm">
                <ShieldAlert className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    Phân Tích Cảm Xúc & Báo Cáo Tham Mưu Chiến Lược Lãnh Đạo
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    MoF Executive Advisory
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Đo lường tâm lý thị trường (Bullish/Bearish/Neutral), dự báo điểm nóng rủi ro và tham mưu chỉ đạo truyền thông chính sách
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons for Leadership */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setSmartFilterInitialCategory('policy');
                setActiveTab('smart_filter');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 transition cursor-pointer border border-blue-500/40 shadow-xs"
              title="Lọc nhanh các bài viết về Chính sách, Thể chế & Văn bản mới của BTC"
            >
              <Landmark className="w-3.5 h-3.5 text-blue-400" />
              <span>🏛️ Lọc Chính Sách</span>
            </button>

            <button
              onClick={() => {
                setSmartFilterInitialCategory('public_enterprise');
                setActiveTab('smart_filter');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 transition cursor-pointer border border-amber-500/40 shadow-xs"
              title="Lọc nhanh các bài viết về Vướng mắc, Kiến nghị & Mối quan tâm của Người dân / Doanh nghiệp"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>👥 Lọc Dân & Doanh Nghiệp</span>
            </button>

            {onOpenGmailAlertModal && (
              <button
                onClick={() => onOpenGmailAlertModal(highImpactBearishItems[0] || null)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-rose-700 to-red-800 hover:from-rose-800 hover:to-red-900 text-white transition cursor-pointer shadow-md border border-rose-500/40"
                title="Gửi cảnh báo nguy cơ dư luận tức thì qua Gmail"
              >
                <Mail className="w-3.5 h-3.5 text-rose-200 animate-pulse" />
                <span>🚨 Gửi Gmail Cảnh Báo</span>
              </button>
            )}

            {highImpactBearishItems[0] && onDraftStatement && (
              <button
                onClick={() => onDraftStatement(highImpactBearishItems[0])}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer border border-slate-700"
              >
                <FileEdit className="w-3.5 h-3.5 text-amber-400" />
                <span>Soạn Phát Ngôn</span>
              </button>
            )}
          </div>
        </div>

        {/* Sentiment Fear & Greed Gauge Strip with Guaranteed 100% Breakdown */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tỷ Lệ Phân Bổ Sắc Thái Toàn Phiên (Tổng 100%):
            </span>
            <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold flex items-center gap-1.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Tích cực: {sentimentStats.bullishPct}%</span>
              <span className="text-slate-400">+</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">Trung tính: {sentimentStats.neutralPct}%</span>
              <span className="text-slate-400">+</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">Tiêu cực: {sentimentStats.bearishPct}%</span>
              <span className="text-slate-400">=</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white text-[10px] font-mono font-bold">100%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Gauge Meter */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
              <span>Chỉ số Sắc thái Tin tức Toàn Phiên (0-100)</span>
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-14 h-14 rounded-full border-4 border-slate-200 dark:border-slate-800 shrink-0">
                <span
                  className="text-lg font-black"
                  style={{ color: sentimentStats.moodColor }}
                >
                  {sentimentStats.sentimentScore}
                </span>
              </div>
              <div className="min-w-0">
                <span
                  className="text-xs font-black truncate block"
                  style={{ color: sentimentStats.moodColor }}
                >
                  {sentimentStats.marketMood}
                </span>
                <span className="text-[10px] text-slate-400">
                  Tỷ lệ Tích cực/Tiêu cực: <strong className="text-slate-700 dark:text-slate-300">{sentimentStats.bullBearRatio}x</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Bullish Volume */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
              <span>Tin Tích Cực (Bullish)</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {sentimentStats.bullish}
              </span>
              <span className="text-xs font-bold text-emerald-600/80">
                ({sentimentStats.bullishPct}%)
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Thông tin tạo niềm tin, chính sách thuận lợi</p>
          </div>

          {/* Neutral Volume */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
              <span>Tin Trung Lập / Thận Trọng</span>
              <Activity className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {sentimentStats.neutral}
              </span>
              <span className="text-xs font-bold text-amber-600/80">
                ({sentimentStats.neutralPct}%)
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Thông tin dữ liệu, nhận định quan sát</p>
          </div>

          {/* Bearish Volume */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
              <span>Tin Tiêu Cực / Rủi Ro (Bearish)</span>
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {sentimentStats.bearish}
              </span>
              <span className="text-xs font-bold text-rose-600/80">
                ({sentimentStats.bearishPct}%)
              </span>
            </div>
            <p className="text-[10px] text-rose-500 font-medium mt-1">
              {highImpactBearishItems.length} sự việc tác động cao cần rà soát
            </p>
          </div>
        </div>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Tổng Quan Cảm Xúc</span>
        </button>

        <button
          onClick={() => {
            setSmartFilterInitialCategory('all');
            setActiveTab('smart_filter');
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'smart_filter'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-600 text-white shadow-sm'
              : isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Filter className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Smart Filter (Chính Sách & Dân Sinh)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Trọng tâm Lãnh đạo
          </span>
        </button>

        <button
          onClick={() => setActiveTab('impact_chain')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'impact_chain'
              ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-sm'
              : isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Network className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Chuỗi Tác Động Hệ Quả ({negativeArticlesWithChain.length} Rủi ro)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Impact Chain
          </span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'events'
              ? 'bg-indigo-600 text-white shadow-sm'
              : isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5 text-sky-400" />
          <span>Chuỗi Sự Kiện Liên Quan ({eventChains.length} Chủ đề)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            Event Correlator
          </span>
        </button>

        <button
          onClick={() => setActiveTab('advisory')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'advisory'
              ? 'bg-indigo-600 text-white shadow-sm'
              : isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Bản Tham Mưu Lãnh Đạo (Strategic Advisory)</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow-sm'
              : isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Ma Trận Rủi Ro & Cơ Hội ({highImpactBearishItems.length} Khẩn)</span>
        </button>

        <button
          onClick={() => setActiveTab('sectors')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'sectors'
              ? 'bg-indigo-600 text-white shadow-sm'
              : isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Cảm Xúc Theo Lĩnh Vực MoF</span>
        </button>
      </div>

      {/* SUB-TAB: IMPACT CHAIN VIEWER (Chuỗi Tác Động Hệ Quả Liên Ngành 16 Lĩnh Vực) */}
      {activeTab === 'impact_chain' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Header Card */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border ${
              isDark
                ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-amber-950/30 border-rose-500/40 shadow-lg'
                : 'bg-gradient-to-br from-rose-50/70 via-white to-amber-50/50 border-rose-200 shadow-sm'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                  <Network className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Suy Luận Chuỗi Tác Động Hệ Quả Liên Ngành (Impact Chain Engine)
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      16 Lĩnh Vực BTC
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-4xl">
                    Tự động bóc tách và truy vết đường truyền dẫn rủi ro (Transmission Path) từ một sự cố tiêu cực ban đầu (như Trái phiếu, Hoàn thuế, Giải ngân vốn...) sang các lĩnh vực phụ thuộc tiếp theo, giúp Lãnh đạo chủ động khoanh vùng và cắt đứt chuỗi lây lan trước khi trở thành khủng hoảng hệ thống.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-700'
                }`}>
                  Đã nhận diện <strong className="text-rose-500">{negativeArticlesWithChain.length}</strong> chuỗi rủi ro
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
            }`}>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                <span>Tổng Chuỗi Rủi Ro Đang Bám Sát</span>
                <Layers className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {impactChainStats.total}
                </span>
                <span className="text-xs text-slate-400">bài viết / sự vụ</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Đã suy luận đường truyền dẫn đa nấc</p>
            </div>

            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-rose-950/30 border-rose-500/30' : 'bg-rose-50/70 border-rose-200 shadow-2xs'
            }`}>
              <div className="flex items-center justify-between text-[11px] text-rose-500 font-semibold mb-1">
                <span>Nguy Cơ Lây Lan Toàn Diện</span>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {impactChainStats.critical}
                </span>
                <span className="text-xs font-bold text-rose-500">Mức CRITICAL</span>
              </div>
              <p className="text-[10px] text-rose-500/80 font-medium mt-1">Cần Lãnh đạo chỉ đạo liên ngành ngay</p>
            </div>

            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-amber-950/30 border-amber-500/30' : 'bg-amber-50/70 border-amber-200 shadow-2xs'
            }`}>
              <div className="flex items-center justify-between text-[11px] text-amber-500 font-semibold mb-1">
                <span>Lĩnh Vực Khởi Phát Rủi Ro Cao Nhất</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2 truncate">
                <span className="text-base font-black text-amber-600 dark:text-amber-400 truncate">
                  {impactChainStats.topOriginSector[0]}
                </span>
              </div>
              <p className="text-[10px] text-amber-600/80 font-medium mt-1">
                {impactChainStats.topOriginSector[1]} sự cố bắt nguồn từ mảng này
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-indigo-950/30 border-indigo-500/30' : 'bg-indigo-50/70 border-indigo-200 shadow-2xs'
            }`}>
              <div className="flex items-center justify-between text-[11px] text-indigo-400 font-semibold mb-1">
                <span>Lĩnh Vực Chịu Tác Động Lan Tỏa Nhiều Nhất</span>
                <TrendingDown className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="flex items-baseline gap-2 truncate">
                <span className="text-base font-black text-indigo-600 dark:text-indigo-400 truncate">
                  {impactChainStats.topImpactedSector[0]}
                </span>
              </div>
              <p className="text-[10px] text-indigo-500/80 font-medium mt-1">
                {impactChainStats.topImpactedSector[1]} lần là điểm đến thứ cấp / hệ thống
              </p>
            </div>
          </div>

          {/* Interactive Filters Bar */}
          <div className={`p-3.5 rounded-xl border space-y-3 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Risk Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Cấp độ rủi ro:</span>
                <button
                  onClick={() => setImpactChainRiskFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    impactChainRiskFilter === 'all'
                      ? 'bg-slate-800 text-white dark:bg-slate-700'
                      : isDark
                      ? 'text-slate-400 hover:bg-slate-800'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Tất cả ({negativeArticlesWithChain.length})
                </button>
                <button
                  onClick={() => setImpactChainRiskFilter('CRITICAL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    impactChainRiskFilter === 'CRITICAL'
                      ? 'bg-rose-600 text-white'
                      : isDark
                      ? 'text-rose-400 hover:bg-rose-950/40'
                      : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Nguy cơ lây lan cao ({impactChainStats.critical})
                </button>
                <button
                  onClick={() => setImpactChainRiskFilter('ELEVATED')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    impactChainRiskFilter === 'ELEVATED'
                      ? 'bg-amber-600 text-white'
                      : isDark
                      ? 'text-amber-400 hover:bg-amber-950/40'
                      : 'text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Nguy cơ lan tỏa ({impactChainStats.elevated})
                </button>
                <button
                  onClick={() => setImpactChainRiskFilter('MODERATE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    impactChainRiskFilter === 'MODERATE'
                      ? 'bg-sky-600 text-white'
                      : isDark
                      ? 'text-sky-400 hover:bg-sky-950/40'
                      : 'text-sky-700 hover:bg-sky-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  Nguy cơ cục bộ ({impactChainStats.moderate})
                </button>
              </div>

              {/* Keyword Search */}
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  value={impactChainSearch}
                  onChange={(e) => setImpactChainSearch(e.target.value)}
                  placeholder="Tìm theo từ khóa, cơ chế lây lan..."
                  className={`w-full px-3 py-1.5 text-xs rounded-xl border transition outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-amber-400'
                      : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-amber-500'
                  }`}
                />
              </div>
            </div>

            {/* Origin Sector Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t dark:border-slate-800 border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Lĩnh vực liên quan:</span>
              <button
                onClick={() => setImpactChainSectorFilter('all')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  impactChainSectorFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Tất cả lĩnh vực
              </button>
              {Object.keys(SECTOR_NAMES).map((sKey) => {
                const sName = SECTOR_NAMES[sKey as SectorType] || sKey;
                const isSelected = impactChainSectorFilter === sKey || impactChainSectorFilter === sName;
                return (
                  <button
                    key={sKey}
                    onClick={() => setImpactChainSectorFilter(isSelected ? 'all' : sKey)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 text-white font-bold'
                        : isDark
                        ? 'bg-slate-800/70 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {sName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Impact Chain Cards */}
          {filteredImpactChainArticles.length === 0 ? (
            <div className={`p-8 rounded-2xl border text-center space-y-2 ${
              isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300 dark:text-slate-200">
                Không tìm thấy chuỗi rủi ro phù hợp với bộ lọc
              </h4>
              <p className="text-xs text-slate-500">
                Hãy thử chọn bộ lọc cấp độ rủi ro hoặc lĩnh vực khác.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredImpactChainArticles.map((article) => {
                const chain = article.sentimentDiagnostic?.impactChain;
                if (!chain) return null;

                return (
                  <div
                    key={article.id}
                    className={`p-4.5 rounded-2xl border transition shadow-sm space-y-3.5 ${
                      isDark ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Article Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 border-b pb-3 dark:border-slate-800/80 border-slate-100">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <SourceBrandBadge
                            source={article.source}
                            url={article.url}
                            size="sm"
                            showIcon={true}
                          />
                          <span className={`text-xs font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {formatNewsTimeDisplay(article)}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                            isDark ? 'bg-slate-800 border-slate-700 text-cyan-300' : 'bg-sky-50 border-sky-200 text-sky-800'
                          }`}>
                            Gốc rễ: {article.sectorNameVi || article.sector}
                          </span>
                          {article.isEmergency && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                              Khẩn cấp
                            </span>
                          )}
                        </div>

                        <h4 className={`text-sm font-bold leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {article.title}
                        </h4>

                        {article.summary && (
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {article.summary}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {onDeepDive && (
                          <button
                            onClick={() => onDeepDive(article)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer flex items-center gap-1 ${
                              isDark
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            }`}
                            title="Xem Bóc tách Chi tiết (Deep Dive)"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-400" />
                            <span>Mổ xẻ</span>
                          </button>
                        )}

                        {onDraftStatement && (
                          <button
                            onClick={() => onDraftStatement(article)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-white shadow-xs"
                            title="Soạn Kế hoạch Xử lý & Thông cáo Báo chí"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                            <span>Kế hoạch</span>
                          </button>
                        )}

                        {onOpenGmailAlertModal && (
                          <button
                            onClick={() => onOpenGmailAlertModal(article)}
                            className={`p-1.5 rounded-xl transition border cursor-pointer ${
                              isDark
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            }`}
                            title="Gửi Báo cáo Cảnh báo Khẩn qua Gmail"
                          >
                            <Mail className="w-4 h-4 text-rose-400" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inferred Multi-Sector Impact Chain Visualization */}
                    <ImpactChainViewer
                      impactChain={chain}
                      onSelectSector={(s) => setImpactChainSectorFilter(s)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: EVENT CORRELATOR (Gom nhóm Chuỗi Sự Kiện theo Dòng Thời Gian) */}
      {activeTab === 'events' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Feature Header Card */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border ${
              isDark
                ? 'bg-slate-900/90 border-sky-500/30 shadow-lg'
                : 'bg-white border-sky-200 shadow-sm'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Bộ Tương Quan & Nhận Diện Chuỗi Sự Kiện (Event Correlator)
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                      Timeline AI Clustering
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tự động gom nhóm các bài báo cùng chung mạch vấn đề/chủ thể qua các mốc thời gian xuất bản khác nhau, giúp Lãnh đạo nắm bắt trọn vẹn diễn biến vòng đời sự việc từ khởi phát đến cao điểm.
                  </p>
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setSelectedChainFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedChainFilter === 'all'
                      ? 'bg-sky-600 text-white'
                      : isDark
                      ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({eventChains.length})
                </button>
                <button
                  onClick={() => setSelectedChainFilter('escalating_risk')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    selectedChainFilter === 'escalating_risk'
                      ? 'bg-rose-600 text-white'
                      : isDark
                      ? 'bg-slate-800 text-rose-400 hover:bg-rose-500/20'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <TrendingDown className="w-3 h-3" />
                  <span>Rủi ro leo thang</span>
                </button>
                <button
                  onClick={() => setSelectedChainFilter('positive_momentum')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    selectedChainFilter === 'positive_momentum'
                      ? 'bg-emerald-600 text-white'
                      : isDark
                      ? 'bg-slate-800 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>Đà tích cực</span>
                </button>
              </div>
            </div>
          </div>

          {/* Event Chain Cards List */}
          {filteredEventChains.length === 0 ? (
            <div className="text-center py-12 border rounded-2xl border-dashed border-slate-700/60 bg-slate-900/30">
              <Compass className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-bold text-slate-400">Không tìm thấy chuỗi sự kiện phù hợp bộ lọc.</p>
              <p className="text-xs text-slate-500 mt-1">Hệ thống đang tiếp tục quét và đối chiếu các mốc tin mới.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEventChains.map((chain, chainIdx) => {
                const isExpanded = expandedChainId === chain.id || (expandedChainId === null && chainIdx === 0);
                const isEscalating = chain.sentimentTrend === 'escalating_risk';
                const isPositive = chain.sentimentTrend === 'positive_momentum';

                return (
                  <div
                    key={chain.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                    }`}
                  >
                    {/* Chain Title Header */}
                    <div
                      onClick={() => setExpandedChainId(isExpanded ? '__none__' : chain.id)}
                      className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none transition ${
                        isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                            isEscalating
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : isPositive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          }`}
                        >
                          <GitCommit className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                                isEscalating
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  : isPositive
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {isEscalating
                                ? '⚠️ RỦI RO LEO THANG'
                                : isPositive
                                ? '✨ ĐÀ TÍCH CỰC'
                                : 'ỔN ĐỊNH / THEO DÕI'}
                            </span>

                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3" />
                              {chain.earliestDate} ➔ {chain.latestDate}
                            </span>

                            <span className="text-[11px] font-bold px-2 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {chain.articles.length} bài báo liên kết
                            </span>
                          </div>

                          <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                            {chain.topicTitle}
                          </h4>

                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>
                              Chủ thể trọng tâm: <strong className="text-slate-700 dark:text-slate-200">{chain.keyEntity}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Lĩnh vực: <strong className="text-indigo-600 dark:text-indigo-400">{chain.policyImpactDomain}</strong>
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
                        <div className="text-left md:text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Diễn biến chuỗi</span>
                          <span
                            className={`text-xs font-black ${
                              isEscalating
                                ? 'text-rose-400'
                                : isPositive
                                ? 'text-emerald-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {isEscalating
                              ? 'Cần định hướng truyền thông'
                              : isPositive
                              ? 'Hiệu ứng chính sách tốt'
                              : 'Quan sát chỉ số'}
                          </span>
                        </div>

                        <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Timeline Content */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 pt-0 border-t border-slate-200 dark:border-slate-800 space-y-4">
                        {/* Executive Strategic Recommendation for this specific chain */}
                        <div
                          className={`p-3.5 rounded-xl border mt-3 flex items-start gap-2.5 ${
                            isEscalating
                              ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                              : isPositive
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                              : 'bg-indigo-950/20 border-indigo-500/30 text-indigo-200'
                          }`}
                        >
                          <Compass className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="text-xs space-y-1">
                            <span className="font-black tracking-wide uppercase text-[10px] text-amber-400">
                              Đề xuất Tham mưu Chỉ đạo của Bộ:
                            </span>
                            <p className="leading-relaxed font-medium text-slate-200">
                              {chain.recommendedAction}
                            </p>
                          </div>
                        </div>

                        {/* Interactive Chronological Story Timeline */}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-sky-400" />
                              Dòng thời gian bóc tách qua các mốc xuất bản ({chain.articles.length} bài)
                            </span>
                            <span className="text-[10px] font-normal text-slate-500 lowercase">
                              (sắp xếp từ sớm đến muộn nhất)
                            </span>
                          </div>

                          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700/60">
                            {chain.articles.map((art, artIdx) => {
                              const isArtBearish = art.sentiment === 'bearish';
                              const isArtBullish = art.sentiment === 'bullish';

                              return (
                                <div key={art.id || artIdx} className="relative group">
                                  {/* Milestone Node Dot */}
                                  <div
                                    className={`absolute -left-[19px] top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                                      isArtBearish
                                        ? 'bg-rose-500 border-slate-900 group-hover:scale-125'
                                        : isArtBullish
                                        ? 'bg-emerald-500 border-slate-900 group-hover:scale-125'
                                        : 'bg-indigo-500 border-slate-900 group-hover:scale-125'
                                    }`}
                                  />

                                  {/* Article Card in Timeline */}
                                  <div
                                    className={`p-3.5 rounded-xl border transition ${
                                      isDark
                                        ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white shadow-xs'
                                    }`}
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 border border-slate-700 font-mono">
                                          {art.sourceName || art.source}
                                        </span>
                                        <span
                                          className={`text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                            isArtBearish
                                              ? 'bg-rose-500/10 text-rose-400'
                                              : isArtBullish
                                              ? 'bg-emerald-500/10 text-emerald-400'
                                              : 'bg-amber-500/10 text-amber-400'
                                          }`}
                                        >
                                          {isArtBearish ? 'Tiêu cực / Cảnh báo' : isArtBullish ? 'Tích cực / Đột phá' : 'Trung lập'}
                                        </span>
                                      </div>

                                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                        <Clock className="w-3 h-3 opacity-60" />
                                        {art.publishedTimeStr || art.timeAgo || `Mốc ${artIdx + 1}`}
                                      </span>
                                    </div>

                                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug mb-1">
                                      {art.title}
                                    </h5>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                                      {art.summary || art.snippet}
                                    </p>

                                    {/* Action Links */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                                      <div className="flex items-center gap-2">
                                        {onDeepDive && (
                                          <button
                                            onClick={() => onDeepDive(art)}
                                            className="px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-bold cursor-pointer transition flex items-center gap-1"
                                          >
                                            <Eye className="w-3 h-3" />
                                            <span>Mổ xẻ 6W Matrix</span>
                                          </button>
                                        )}

                                        {onDraftStatement && isArtBearish && (
                                          <button
                                            onClick={() => onDraftStatement(art)}
                                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer transition flex items-center gap-1"
                                          >
                                            <FileEdit className="w-3 h-3 text-amber-400" />
                                            <span>Soạn phản hồi</span>
                                          </button>
                                        )}
                                      </div>

                                      {art.url && (
                                        <a
                                          href={art.url}
                                          target="_blank"
                                          rel="noreferrer noopener"
                                          className="text-[11px] text-slate-400 hover:text-indigo-400 flex items-center gap-1 font-medium"
                                        >
                                          <span>Xem báo gốc</span>
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 1: OVERVIEW & CHARTS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart 1: Donut Distribution */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tỷ Lệ Phân Bổ Sắc Thái Cảm Xúc
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cơ cấu tin bài Tích cực vs Trung lập vs Tiêu cực
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">Tổng: {sentimentStats.total} bài</span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Sector Sentiment Bar breakdown */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tương Quan Sắc Thái Theo Lĩnh Vực
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  So sánh số lượng tin Tích cực / Tiêu cực trong từng mảng
                </p>
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sectorStats.map((s) => ({
                    name: s.name.split('&')[0].trim(),
                    bullish: s.bullishCount || 0,
                    neutral: s.neutralCount || 0,
                    bearish: s.bearishCount || 0,
                  }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} />
                  <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Bar dataKey="bullish" name="Tích cực" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="neutral" name="Trung lập" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bearish" name="Tiêu cực" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Integrated Smart Filter Explorer for Executive Overview */}
          <div className="col-span-1 lg:col-span-2 pt-2">
            <SentimentSmartFilterSection
              newsItems={newsItems}
              initialCategory={smartFilterInitialCategory}
              onDraftStatement={onDraftStatement}
              onOpenGmailAlertModal={onOpenGmailAlertModal}
              onDeepDive={onDeepDive}
            />
          </div>
        </div>
      )}

      {/* SUB-TAB: DEDICATED SMART FILTER (CHÍNH SÁCH / DÂN & DOANH NGHIỆP) */}
      {activeTab === 'smart_filter' && (
        <div className="space-y-4 animate-fadeIn">
          <SentimentSmartFilterSection
            newsItems={newsItems}
            initialCategory={smartFilterInitialCategory}
            onDraftStatement={onDraftStatement}
            onOpenGmailAlertModal={onOpenGmailAlertModal}
            onDeepDive={onDeepDive}
          />
        </div>
      )}

      {/* SUB-TAB 2: EXECUTIVE STRATEGIC ADVISORY (Tham mưu Lãnh đạo chi tiết) */}
      {activeTab === 'advisory' && (
        <div className="space-y-4">
          <div
            className={`p-5 rounded-2xl border ${
              isDark
                ? 'bg-slate-900 border-indigo-500/30'
                : 'bg-white border-indigo-200 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Bản Tham Mưu Chiến Lược Lãnh Đạo BTC (Executive Directives)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Directive Block 1: 0-6 hours */}
              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">
                  <Clock className="w-4 h-4" />
                  <span>Hành Động Khẩn (0 - 6 Giờ)</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                  {highImpactBearishItems.length > 0
                    ? `Chủ động theo dõi luồng tin về [${highImpactBearishItems[0].title}]. Giao Cục/Vụ chuyên môn phối hợp cùng Cổng Thông tin Bộ phản hồi làm rõ tính xác thực, tránh tin đồn thất thiệt lan truyền gây hoang mang dư luận.`
                    : 'Thị trường tương đối ổn định. Duy trì cơ chế trực ban truyền thông báo chí, chủ động theo dõi các chỉ số giao dịch chứng khoán, tỷ giá và phản ứng của nhà đầu tư.'}
                </p>
              </div>

              {/* Directive Block 2: 24-48 hours */}
              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">
                  <Zap className="w-4 h-4" />
                  <span>Định Hướng Ngắn Hạn (24 - 48 Giờ)</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                  Tổ chức điểm báo chuyên đề; chuẩn bị sẵn các thông điệp định hướng về ổn định kinh tế vĩ mô, tháo gỡ điểm nghẽn thị trường vốn, thúc đẩy giải ngân đầu tư công và cải cách thủ tục thuế/hải quan.
                </p>
              </div>

              {/* Directive Block 3: Medium-term */}
              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">
                  <Award className="w-4 h-4" />
                  <span>Tham Mưu Thể Chế & Vĩ Mô</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                  Rà soát, kiến nghị hoàn thiện các văn bản quy phạm pháp luật liên quan (Nghị định về TPDN, Thông tư chứng khoán, Luật Thuế GTGT sửa đổi), củng cố niềm tin và thúc đẩy thanh khoản thị trường.
                </p>
              </div>
            </div>

            {/* Key Talking Points for Spokesperson */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                <span>Gợi Ý Luận Điểm Phát Ngôn Trọng Tâm Cho Lãnh Đạo / Người Phát Ngôn</span>
              </h4>

              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  <strong>1. Về ổn định thị trường & thanh khoản:</strong> "BTC luôn theo dõi sát sao diễn biến thị trường vốn, các chỉ số thanh khoản và sẵn sàng các kịch bản điều hành đồng bộ để bảo vệ quyền lợi hợp pháp của nhà đầu tư."
                </div>
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-800 dark:text-indigo-300">
                  <strong>2. Về chính sách hỗ trợ doanh nghiệp & người dân:</strong> "Tiếp tục triển khai quyết liệt các gói miễn, giảm, gia hạn thuế, phí, lệ phí và đẩy mạnh cải cách thủ tục hành chính, chuyển đổi số ngành tài chính."
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: RISK & OPPORTUNITY MATRIX */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* High Impact Bearish List */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-rose-500/30' : 'bg-rose-50/40 border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  Điểm Nóng Rủi Ro Tiêu Cực Cần Xử Lý Khẩn ({highImpactBearishItems.length})
                </h3>
              </div>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-rose-500 text-white">
                Cấp bách
              </span>
            </div>

            {highImpactBearishItems.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">Không ghi nhận sự cố tiêu cực nghiêm trọng.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {highImpactBearishItems.map((art) => (
                  <div
                    key={art.id}
                    className={`p-3 rounded-xl border transition ${
                      isDark ? 'bg-slate-950 border-slate-800 hover:border-rose-500/50' : 'bg-white border-slate-200 hover:border-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-bold text-rose-500">{art.sourceName || art.source}</span>
                      <span>{art.timeAgo || art.publishedTimeStr}</span>
                    </div>
                    <h4 className="text-xs font-bold line-clamp-2 mb-1.5 text-slate-900 dark:text-white">
                      {art.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                      {art.summary || art.snippet}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        {onOpenGmailAlertModal && (
                          <button
                            onClick={() => onOpenGmailAlertModal(art)}
                            className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black cursor-pointer inline-flex items-center gap-1 shadow-xs"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Gửi Gmail</span>
                          </button>
                        )}
                        {onDraftStatement && (
                          <button
                            onClick={() => onDraftStatement(art)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                          >
                            <FileEdit className="w-3 h-3" />
                            <span>Soạn phát ngôn</span>
                          </button>
                        )}
                      </div>

                      {onDeepDive && (
                        <button
                          onClick={() => onDeepDive(art)}
                          className="text-[11px] font-bold text-slate-400 hover:text-emerald-400 flex items-center gap-0.5 cursor-pointer"
                        >
                          Chi tiết <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* High Impact Bullish Opportunities */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-emerald-500/30' : 'bg-emerald-50/40 border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  Điểm Sáng Tích Cực & Cơ Hội Truyền Thông ({highImpactBullishItems.length})
                </h3>
              </div>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500 text-white">
                Lan tỏa
              </span>
            </div>

            {highImpactBullishItems.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">Chưa có bài viết tác động cao thuộc nhóm tích cực.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {highImpactBullishItems.map((art) => (
                  <div
                    key={art.id}
                    className={`p-3 rounded-xl border transition ${
                      isDark ? 'bg-slate-950 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-bold text-emerald-500">{art.sourceName || art.source}</span>
                      <span>{art.timeAgo || art.publishedTimeStr}</span>
                    </div>
                    <h4 className="text-xs font-bold line-clamp-2 mb-1.5 text-slate-900 dark:text-white">
                      {art.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                      {art.summary || art.snippet}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        Đẩy mạnh tuyên truyền
                      </span>
                      {onDeepDive && (
                        <button
                          onClick={() => onDeepDive(art)}
                          className="text-[11px] font-bold text-slate-400 hover:text-emerald-400 flex items-center gap-0.5 cursor-pointer"
                        >
                          Chi tiết <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SECTOR RADAR */}
      {activeTab === 'sectors' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Bản Đồ Radar Tâm Lý Theo 6 Lĩnh Vực Chuyên Ngành
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thang điểm 0 (Rất Tiêu cực) đến 100 (Rất Tích cực)
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={sectorRadarData}>
                  <PolarGrid stroke={isDark ? '#334155' : '#e2e8f0'} />
                  <PolarAngleAxis
                    dataKey="sectorName"
                    stroke={isDark ? '#94a3b8' : '#64748b'}
                    fontSize={11}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={isDark ? '#475569' : '#cbd5e1'} />
                  <Radar
                    name="Chỉ số Tâm lý"
                    dataKey="sentimentScore"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.4}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Bảng Tổng Hợp Tâm Lý Ngành
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chi tiết tỷ lệ và trạng thái cảnh báo theo từng đơn vị
              </p>
            </div>

            <div className="space-y-2.5">
              {sectorStats.map((sec) => {
                const total = (sec.bullishCount || 0) + (sec.bearishCount || 0) + (sec.neutralCount || 0);
                const score = total > 0 
                  ? Math.round(50 + (((sec.bullishCount || 0) - (sec.bearishCount || 0)) / total) * 45)
                  : 50;

                return (
                  <div
                    key={sec.sector}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {sec.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {total} bài viết ({sec.bullishCount} tích cực, {sec.bearishCount} tiêu cực)
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded ${
                          score >= 60
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : score <= 40
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        {score}/100
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
