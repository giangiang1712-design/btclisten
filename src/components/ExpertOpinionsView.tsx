import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Building2,
  Sparkles,
  Star,
  StarOff,
  Filter,
  Search,
  ExternalLink,
  MessageSquareQuote,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Award,
  ChevronRight,
  ShieldCheck,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { ExpertOpinionRecord, ExpertStance, ExpertSpeakerType, ScrapedNewsItem } from '../types';
import { cleanHtmlTitle } from '../lib/htmlDecoder';
import {
  loadCustomKeywordWeights,
  extractWeightedKeywordsForText,
  calculateArticleMoFPriorityScore,
  KeywordWeightMap,
} from '../lib/keywordWeights';

export type PolicyImpactLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ClassifiedOpinionRecord extends ExpertOpinionRecord {
  policyImpactLevel: PolicyImpactLevel;
  policyImpactScore: number;
  matchedKeywords: Array<{ keyword: string; weight: number; category?: string; isCoreMof?: boolean }>;
}

interface ExpertOpinionsViewProps {
  onOpenArticleDetail?: (articleId?: string) => void;
  newsArticles?: ScrapedNewsItem[];
  isDark?: boolean;
}

export const ExpertOpinionsView: React.FC<ExpertOpinionsViewProps> = ({
  onOpenArticleDetail,
  newsArticles = [],
  isDark = false,
}) => {
  const [opinions, setOpinions] = useState<ExpertOpinionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'WATCHLIST' | 'EXPERT' | 'ORGANIZATION'>('ALL');
  const [selectedStance, setSelectedStance] = useState<ExpertStance | 'ALL'>('ALL');
  const [selectedImpact, setSelectedImpact] = useState<PolicyImpactLevel | 'ALL'>('ALL');
  const [viewGrouping, setViewGrouping] = useState<'LIST' | 'IMPACT_GROUPS' | 'SENTIMENT_GROUPS' | 'MATRIX'>('LIST');
  const [selectedDays, setSelectedDays] = useState<number>(0); // 0 = all, 1, 2, 3, 7
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSpeakerFilter, setSelectedSpeakerFilter] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const keywordWeights = useMemo(() => loadCustomKeywordWeights(), []);

  // Automated Classification Engine using Keyword Weight Configuration
  const classifiedOpinions = useMemo<ClassifiedOpinionRecord[]>(() => {
    return opinions.map((op) => {
      const matchedKeywords = extractWeightedKeywordsForText(
        op.articleTitle,
        `${op.opinionSummary} ${op.statementQuote || ''}`,
        keywordWeights
      );
      const priorityScore = calculateArticleMoFPriorityScore(
        op.articleTitle,
        `${op.opinionSummary} ${op.statementQuote || ''}`,
        keywordWeights,
        {
          policyResponseAdvisor: op.policyArea,
          sentiment: op.stance === 'SUPPORT' ? 'bullish' : op.stance === 'WARNING' ? 'bearish' : 'neutral',
        }
      );

      const maxWeight = matchedKeywords.length > 0 ? Math.max(...matchedKeywords.map((k) => k.weight)) : 0;
      let policyImpactLevel: PolicyImpactLevel = 'LOW';
      if (priorityScore >= 4.5 || maxWeight >= 4.5 || matchedKeywords.some((k) => k.isCoreMof)) {
        policyImpactLevel = 'HIGH';
      } else if (priorityScore >= 2.5 || maxWeight >= 3.0) {
        policyImpactLevel = 'MEDIUM';
      } else {
        policyImpactLevel = 'LOW';
      }

      return {
        ...op,
        policyImpactLevel,
        policyImpactScore: priorityScore,
        matchedKeywords,
      };
    });
  }, [opinions, keywordWeights]);

  // New opinion form state
  const [formSpeakerName, setFormSpeakerName] = useState<string>('');
  const [formSpeakerRole, setFormSpeakerRole] = useState<string>('');
  const [formSpeakerType, setFormSpeakerType] = useState<ExpertSpeakerType>('EXPERT');
  const [formOrganizationName, setFormOrganizationName] = useState<string>('');
  const [formArticleTitle, setFormArticleTitle] = useState<string>('');
  const [formArticleUrl, setFormArticleUrl] = useState<string>('');
  const [formSource, setFormSource] = useState<string>('Báo chí kinh tế');
  const [formOpinionSummary, setFormOpinionSummary] = useState<string>('');
  const [formStatementQuote, setFormStatementQuote] = useState<string>('');
  const [formStance, setFormStance] = useState<ExpertStance>('CRITIQUE');
  const [formPolicyArea, setFormPolicyArea] = useState<string>('Chính sách Thuế & Quản lý Nhà nước');
  const [formIsWatchlist, setFormIsWatchlist] = useState<boolean>(true);

  // Fetch opinions from /api/expert-opinions
  const fetchOpinions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/expert-opinions');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.opinions)) {
          setOpinions(json.opinions);
        }
      }
    } catch (err) {
      console.warn('[ExpertOpinionsView] Lỗi tải ý kiến chuyên gia:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpinions();
  }, []);

  // Trigger automated scan from current news articles if needed
  const handleScanFromNews = async () => {
    if (!newsArticles || newsArticles.length === 0) {
      alert('Chưa có danh sách tin tức trong phiên hiện tại để quét.');
      return;
    }
    setIsScanning(true);
    try {
      const res = await fetch('/api/expert-opinions/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articles: newsArticles }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          await fetchOpinions();
          alert(`Đã hoàn tất rà soát! Trích xuất thêm ${json.extractedCount || 0} ý kiến nhận định vào CSDL.`);
        }
      }
    } catch (err) {
      console.warn('[ExpertOpinionsView] Lỗi quét ý kiến từ tin tức:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Toggle watchlist ⭐
  const handleToggleWatchlist = async (id: string, currentWatchlist: boolean) => {
    try {
      const res = await fetch(`/api/expert-opinions/${id}/toggle-watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isWatchlist: !currentWatchlist }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          // Re-fetch to synchronize all entries belonging to the same speaker
          fetchOpinions();
        }
      }
    } catch (err) {
      console.warn('[ExpertOpinionsView] Lỗi cập nhật đáng lưu tâm:', err);
    }
  };

  // Submit manual opinion form
  const handleCreateOpinion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSpeakerName.trim() || !formArticleTitle.trim() || !formOpinionSummary.trim()) {
      alert('Vui lòng điền đầy đủ Tên nhân vật, Tiêu đề bài viết và Tóm tắt nhận định.');
      return;
    }

    try {
      const payload = {
        speakerName: formSpeakerName.trim(),
        speakerRole: formSpeakerRole.trim() || 'Chuyên gia độc lập',
        speakerType: formSpeakerType,
        organizationName: formOrganizationName.trim() || undefined,
        articleTitle: formArticleTitle.trim(),
        articleUrl: formArticleUrl.trim(),
        source: formSource.trim() || 'Báo chí',
        opinionSummary: formOpinionSummary.trim(),
        statementQuote: formStatementQuote.trim() || undefined,
        stance: formStance,
        policyArea: formPolicyArea.trim() || 'Chính sách Tài chính',
        isWatchlist: formIsWatchlist,
        publishedAt: new Date().toISOString(),
      };

      const res = await fetch('/api/expert-opinions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowAddModal(false);
        // Reset form
        setFormSpeakerName('');
        setFormSpeakerRole('');
        setFormArticleTitle('');
        setFormOpinionSummary('');
        setFormStatementQuote('');
        fetchOpinions();
      }
    } catch (err) {
      console.warn('[ExpertOpinionsView] Lỗi thêm nhận định mới:', err);
    }
  };

  const handleCopyQuote = (op: ExpertOpinionRecord) => {
    const text = `[Ý KIẾN NHẬN ĐỊNH CHÍNH SÁCH]\n- Nhân vật / Tổ chức: ${op.speakerName} (${op.speakerRole})\n- Bài viết: ${op.articleTitle}\n- Lĩnh vực: ${op.policyArea}\n- Quan điểm: ${op.stance === 'SUPPORT' ? 'Ủng hộ / Đồng thuận' : op.stance === 'CRITIQUE' ? 'Phản biện / Góp ý' : 'Cảnh báo / Lo ngại'}\n- Tóm tắt ý kiến: ${op.opinionSummary}\n${op.statementQuote ? `- Trích dẫn: "${op.statementQuote}"` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(op.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Group by distinct speaker to display "BẢNG VÀNG NHÂN VẬT & TỔ CHỨC ĐÁNG LƯU TÂM"
  const distinctInfluencers = useMemo(() => {
    const map = new Map<string, {
      name: string;
      role: string;
      type: ExpertSpeakerType;
      org?: string;
      isWatchlist: boolean;
      count: number;
      policyAreas: Set<string>;
      stances: Record<ExpertStance, number>;
      latestQuote?: string;
    }>();

    opinions.forEach((op) => {
      const key = op.speakerName.trim();
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.policyAreas.add(op.policyArea);
        existing.stances[op.stance] = (existing.stances[op.stance] || 0) + 1;
        if (op.isWatchlist) existing.isWatchlist = true;
        if (!existing.latestQuote && op.statementQuote) existing.latestQuote = op.statementQuote;
      } else {
        const stances: Record<ExpertStance, number> = { SUPPORT: 0, CRITIQUE: 0, WARNING: 0, NEUTRAL: 0 };
        stances[op.stance] = 1;
        map.set(key, {
          name: op.speakerName,
          role: op.speakerRole,
          type: op.speakerType,
          org: op.organizationName,
          isWatchlist: op.isWatchlist,
          count: 1,
          policyAreas: new Set([op.policyArea]),
          stances,
          latestQuote: op.statementQuote,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      // Prioritize watchlist then frequency
      if (a.isWatchlist && !b.isWatchlist) return -1;
      if (!a.isWatchlist && b.isWatchlist) return 1;
      return b.count - a.count;
    });
  }, [opinions]);

  // Filtered opinions for display list
  const filteredOpinions = useMemo(() => {
    return classifiedOpinions.filter((op) => {
      // Tab filter
      if (activeTab === 'WATCHLIST' && !op.isWatchlist) return false;
      if (activeTab === 'EXPERT' && op.speakerType !== 'EXPERT') return false;
      if (activeTab === 'ORGANIZATION' && op.speakerType !== 'ORGANIZATION') return false;

      // Stance filter (Stakeholder Sentiment)
      if (selectedStance !== 'ALL' && op.stance !== selectedStance) return false;

      // Policy Impact filter
      if (selectedImpact !== 'ALL' && op.policyImpactLevel !== selectedImpact) return false;

      // Specific speaker filter
      if (selectedSpeakerFilter && op.speakerName.toLowerCase() !== selectedSpeakerFilter.toLowerCase()) {
        return false;
      }

      // Time filter
      if (selectedDays > 0) {
        const cutoff = Date.now() - selectedDays * 24 * 60 * 60 * 1000;
        const ts = new Date(op.publishedAt || op.createdAt).getTime();
        if (isNaN(ts) || ts < cutoff) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSpeaker = op.speakerName.toLowerCase().includes(q);
        const matchesRole = op.speakerRole.toLowerCase().includes(q);
        const matchesTitle = op.articleTitle.toLowerCase().includes(q);
        const matchesSummary = op.opinionSummary.toLowerCase().includes(q);
        const matchesPolicy = op.policyArea.toLowerCase().includes(q);
        const matchesKeyword = op.matchedKeywords.some((k) => k.keyword.toLowerCase().includes(q));
        if (!matchesSpeaker && !matchesRole && !matchesTitle && !matchesSummary && !matchesPolicy && !matchesKeyword) {
          return false;
        }
      }

      return true;
    });
  }, [classifiedOpinions, activeTab, selectedStance, selectedImpact, selectedSpeakerFilter, selectedDays, searchQuery]);

  // Overall statistics & Classification breakdowns
  const stats = useMemo(() => {
    const total = classifiedOpinions.length;
    const watchlistCount = classifiedOpinions.filter((o) => o.isWatchlist).length;
    const supportCount = classifiedOpinions.filter((o) => o.stance === 'SUPPORT').length;
    const critiqueCount = classifiedOpinions.filter((o) => o.stance === 'CRITIQUE').length;
    const warningCount = classifiedOpinions.filter((o) => o.stance === 'WARNING').length;
    const neutralCount = classifiedOpinions.filter((o) => o.stance === 'NEUTRAL').length;

    const highImpactCount = classifiedOpinions.filter((o) => o.policyImpactLevel === 'HIGH').length;
    const mediumImpactCount = classifiedOpinions.filter((o) => o.policyImpactLevel === 'MEDIUM').length;
    const lowImpactCount = classifiedOpinions.filter((o) => o.policyImpactLevel === 'LOW').length;

    return {
      total,
      watchlistCount,
      supportCount,
      critiqueCount,
      warningCount,
      neutralCount,
      highImpactCount,
      mediumImpactCount,
      lowImpactCount,
    };
  }, [classifiedOpinions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner & Key Metrics */}
      <div className="p-6 rounded-2xl bg-white border-2 border-slate-300 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500 text-white shadow-md flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Ý KIẾN NHÂN VẬT, TỔ CHỨC
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                  {stats.total} Nhận định
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-rose-600 text-rose-600" />
                  <span>{stats.watchlistCount} Đáng lưu tâm</span>
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-600 mt-1">
                Tổng hợp phát biểu, nhận định của các chuyên gia & tổ chức ảnh hưởng tới chính sách của Bộ Tài chính
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleScanFromNews}
              disabled={isScanning}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition cursor-pointer border border-slate-300 flex items-center gap-1.5 shadow-2xs"
              title="Rà soát tự động từ các bài viết báo chí hiện tại"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-600 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Đang rà soát...' : 'Rà Soát Từ Tin Tức'}</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ghi Nhận Ý Kiến Mới</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              Mục đáng lưu tâm
            </span>
            <span className="text-2xl font-black text-amber-950">{stats.watchlistCount}</span>
            <span className="text-[11px] font-semibold text-amber-700 block mt-0.5">Tần suất nhận định cao</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Ủng hộ & Đồng thuận
            </span>
            <span className="text-2xl font-black text-emerald-950">{stats.supportCount}</span>
            <span className="text-[11px] font-semibold text-emerald-700 block mt-0.5">Đánh giá tích cực</span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
            <span className="text-xs font-bold text-blue-800 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              Phản biện & Góp ý
            </span>
            <span className="text-2xl font-black text-blue-950">{stats.critiqueCount}</span>
            <span className="text-[11px] font-semibold text-blue-700 block mt-0.5">Khoảng trống & Đề xuất</span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
            <span className="text-xs font-bold text-rose-800 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Cảnh báo & Lo ngại
            </span>
            <span className="text-2xl font-black text-rose-950">{stats.warningCount}</span>
            <span className="text-[11px] font-semibold text-rose-700 block mt-0.5">Rủi ro cần lưu tâm</span>
          </div>
        </div>

        {/* Automated Classification Engine Summary Bar */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="text-xs font-black uppercase text-slate-900 block">
                Phân Loại Tự Động Theo Tác Động Chính Sách (Policy Impact & Keyword Weight)
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Đã chuẩn hóa bằng bộ trọng số từ khóa cấu hình sẵn trong hệ thống
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs font-mono font-extrabold">
            <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
              🚨 Cao / Trọng yếu: <strong>{stats.highImpactCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
              ⚡ Trung bình: <strong>{stats.mediumImpactCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-1">
              📌 Giám sát: <strong>{stats.lowImpactCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Spotlight: "BẢNG VÀNG NHÂN VẬT & TỔ CHỨC ĐÁNG LƯU TÂM" */}
      <div className="p-5 rounded-2xl bg-white border-2 border-slate-300 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              MỤC ĐÁNG LƯU TÂM (HỒ SƠ NHÂN VẬT & TỔ CHỨC THƯỜNG XUYÊN PHÁT BIỂU)
            </h2>
          </div>
          {selectedSpeakerFilter && (
            <button
              onClick={() => setSelectedSpeakerFilter(null)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Bỏ lọc nhân vật: {selectedSpeakerFilter}</span>
            </button>
          )}
        </div>

        {/* Influencer Profile Carousel / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {distinctInfluencers.slice(0, 6).map((inf) => {
            const isSelected = selectedSpeakerFilter?.toLowerCase() === inf.name.toLowerCase();
            const topPolicy = Array.from(inf.policyAreas)[0] || 'Chính sách Tài chính';

            return (
              <div
                key={inf.name}
                onClick={() => setSelectedSpeakerFilter(isSelected ? null : inf.name)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/60 shadow-md ring-2 ring-amber-400/40'
                    : inf.isWatchlist
                    ? 'border-amber-200 bg-slate-50 hover:border-amber-400 hover:bg-amber-50/30'
                    : 'border-slate-200 bg-white hover:border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-black text-slate-900">{inf.name}</span>
                      {inf.isWatchlist && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          <span>Đáng lưu tâm</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-600 line-clamp-1">{inf.role}</p>
                  </div>

                  <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-slate-200 text-slate-800 shrink-0">
                    {inf.count} bài
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 truncate">{topPolicy}</span>
                  <div className="flex items-center gap-1 shrink-0 font-bold text-[11px]">
                    {inf.stances.SUPPORT > 0 && (
                      <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                        +{inf.stances.SUPPORT}
                      </span>
                    )}
                    {inf.stances.CRITIQUE > 0 && (
                      <span className="text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                        ⚡{inf.stances.CRITIQUE}
                      </span>
                    )}
                    {inf.stances.WARNING > 0 && (
                      <span className="text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                        !{inf.stances.WARNING}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Filters & Search Navigation Bar */}
      <div className="p-5 rounded-2xl bg-white border-2 border-slate-300 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Main Category Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'ALL', label: `Tất cả (${opinions.length})` },
              { id: 'WATCHLIST', label: `⭐ Đáng lưu tâm (${stats.watchlistCount})` },
              { id: 'EXPERT', label: `Chuyên gia cá nhân` },
              { id: 'ORGANIZATION', label: `Tổ chức & Hiệp hội` },
            ].map(({ id, label }) => {
              const isSelected = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Stance Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'ALL', label: 'Tất cả sắc thái' },
              { id: 'SUPPORT', label: '✓ Ủng hộ / Tích cực' },
              { id: 'CRITIQUE', label: '⚡ Phản biện / Góp ý' },
              { id: 'WARNING', label: '🚨 Cảnh báo / Lo ngại' },
            ].map(({ id, label }) => {
              const isSelected = selectedStance === id;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedStance(id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Policy Impact Level Filter Bar & View Grouping Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 mr-1">Tác động chính sách:</span>
            {[
              { id: 'ALL', label: `Tất cả (${stats.total})` },
              { id: 'HIGH', label: `🚨 Trọng yếu / Cao (${stats.highImpactCount})` },
              { id: 'MEDIUM', label: `⚡ Trung bình (${stats.mediumImpactCount})` },
              { id: 'LOW', label: `📌 Thấp / Giám sát (${stats.lowImpactCount})` },
            ].map(({ id, label }) => {
              const isSelected = selectedImpact === id;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedImpact(id as any)}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                    isSelected
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* View Grouping Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setViewGrouping('LIST')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewGrouping === 'LIST' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:text-black'
              }`}
            >
              Danh sách
            </button>
            <button
              onClick={() => setViewGrouping('IMPACT_GROUPS')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewGrouping === 'IMPACT_GROUPS' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:text-black'
              }`}
            >
              Nhóm Tác Động
            </button>
            <button
              onClick={() => setViewGrouping('SENTIMENT_GROUPS')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewGrouping === 'SENTIMENT_GROUPS' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:text-black'
              }`}
            >
              Nhóm Sắc Thái
            </button>
            <button
              onClick={() => setViewGrouping('MATRIX')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewGrouping === 'MATRIX' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:text-black'
              }`}
            >
              Ma Trận 2D
            </button>
          </div>
        </div>

        {/* Time Filter & Search Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
          <div className="lg:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên chuyên gia, GS. Đặng Hùng Võ, TS. Cấn Văn Lực, VCCI, từ khóa chính sách..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
            />
          </div>

          <div className="lg:col-span-4 flex items-center gap-1.5">
            {[
              { days: 1, label: 'Hôm nay' },
              { days: 2, label: '2 ngày' },
              { days: 3, label: '3 ngày' },
              { days: 7, label: '1 tuần' },
              { days: 0, label: 'Tất cả' },
            ].map(({ days, label }) => {
              const isSelected = selectedDays === days;
              return (
                <button
                  key={days}
                  onClick={() => setSelectedDays(days)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer text-center ${
                    isSelected
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. List / Grouped View of Expert & Stakeholder Opinions */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-2xl border-2 border-slate-300 shadow-sm space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-600">Đang truy vấn dữ liệu ý kiến chuyên gia & tổ chức...</p>
          </div>
        ) : filteredOpinions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border-2 border-slate-300 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Không tìm thấy ý kiến nhận định nào phù hợp</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
              Bạn có thể điều chỉnh từ khóa tìm kiếm hoặc bấm nút "Rà Soát Từ Tin Tức" để tự động phát hiện nhận định mới.
            </p>
          </div>
        ) : viewGrouping === 'IMPACT_GROUPS' ? (
          /* GROUPED BY POLICY IMPACT LEVEL */
          <div className="space-y-6">
            {[
              { level: 'HIGH', title: '🚨 Nhóm Nhận Định Có Tác Động Chính Sách Trọng Yếu & Cao', bg: 'bg-rose-50/70 border-rose-300', text: 'text-rose-950' },
              { level: 'MEDIUM', title: '⚡ Nhóm Nhận Định Có Tác Động Chính Sách Trung Bình', bg: 'bg-amber-50/70 border-amber-300', text: 'text-amber-950' },
              { level: 'LOW', title: '📌 Nhóm Nhận Định Thuộc Diện Giám Sát Thường Quy', bg: 'bg-slate-50 border-slate-300', text: 'text-slate-950' },
            ].map(({ level, title, bg, text }) => {
              const groupItems = filteredOpinions.filter((o) => o.policyImpactLevel === level);
              if (groupItems.length === 0) return null;

              return (
                <div key={level} className={`p-4 rounded-2xl border-2 ${bg} space-y-3`}>
                  <div className="flex items-center justify-between pb-2 border-b border-black/10">
                    <h3 className={`text-sm font-black uppercase tracking-tight ${text}`}>{title}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white border border-slate-300">
                      {groupItems.length} nhận định
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groupItems.map((op) => (
                      <div key={op.id} className="p-3.5 rounded-xl bg-white border border-slate-300 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-slate-900">{op.speakerName}</span>
                          <span className="text-[10px] font-bold text-slate-500">{op.speakerRole}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 line-clamp-2">{cleanHtmlTitle(op.articleTitle)}</p>
                        <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded border">{op.opinionSummary}</p>
                        {op.matchedKeywords && op.matchedKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {op.matchedKeywords.map((k) => (
                              <span key={k.keyword} className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-50 border text-amber-900">
                                #{k.keyword} ({k.weight.toFixed(1)}đ)
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : viewGrouping === 'SENTIMENT_GROUPS' ? (
          /* GROUPED BY STAKEHOLDER SENTIMENT */
          <div className="space-y-6">
            {[
              { stance: 'CRITIQUE', title: '⚡ Phản Biện & Đóng Góp Xây Dựng Chính Sách', bg: 'bg-blue-50/70 border-blue-300', text: 'text-blue-950' },
              { stance: 'WARNING', title: '🚨 Cảnh Báo & Lo Ngại Rủi Ro Truyền Thông / Thị Trường', bg: 'bg-rose-50/70 border-rose-300', text: 'text-rose-950' },
              { stance: 'SUPPORT', title: '✓ Ủng Hộ & Đồng Thuận Chủ Trương Bộ Tài Chính', bg: 'bg-emerald-50/70 border-emerald-300', text: 'text-emerald-950' },
              { stance: 'NEUTRAL', title: '💬 Phân Tích Khách Quan & Trung Lập', bg: 'bg-slate-50 border-slate-300', text: 'text-slate-950' },
            ].map(({ stance, title, bg, text }) => {
              const groupItems = filteredOpinions.filter((o) => o.stance === stance);
              if (groupItems.length === 0) return null;

              return (
                <div key={stance} className={`p-4 rounded-2xl border-2 ${bg} space-y-3`}>
                  <div className="flex items-center justify-between pb-2 border-b border-black/10">
                    <h3 className={`text-sm font-black uppercase tracking-tight ${text}`}>{title}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white border border-slate-300">
                      {groupItems.length} nhận định
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groupItems.map((op) => (
                      <div key={op.id} className="p-3.5 rounded-xl bg-white border border-slate-300 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-slate-900">{op.speakerName}</span>
                          <span className="text-[10px] font-bold text-slate-500">{op.speakerRole}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 line-clamp-2">{cleanHtmlTitle(op.articleTitle)}</p>
                        <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded border">{op.opinionSummary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : viewGrouping === 'MATRIX' ? (
          /* 2D CLASSIFICATION MATRIX GRID (POLICY IMPACT x STAKEHOLDER SENTIMENT) */
          <div className="p-5 rounded-2xl bg-white border-2 border-slate-300 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase">
                  Ma Trận Phân Loại 2D: Tác Động Chính Sách x Sắc Thái Quan Điểm
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Phân bố ma trận nhận định dựa theo Trọng số Từ khóa cấu hình
                </p>
              </div>
              <span className="text-xs font-mono font-black text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                Matrix View
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { impact: 'HIGH', label: '🚨 Tác Động Trọng Yếu / Cao', headerBg: 'bg-rose-900 text-white' },
                { impact: 'MEDIUM', label: '⚡ Tác Động Trung Bình', headerBg: 'bg-amber-800 text-white' },
                { impact: 'LOW', label: '📌 Tác Động Thấp / Giám Sát', headerBg: 'bg-slate-800 text-white' },
              ].map(({ impact, label, headerBg }) => {
                const impactItems = filteredOpinions.filter((o) => o.policyImpactLevel === impact);

                return (
                  <div key={impact} className="rounded-2xl border-2 border-slate-300 overflow-hidden bg-slate-50 flex flex-col">
                    <div className={`p-3 font-black text-xs uppercase tracking-wider text-center ${headerBg}`}>
                      {label} ({impactItems.length})
                    </div>

                    <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[600px]">
                      {impactItems.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-6">Không có nhận định thuộc nhóm này</p>
                      ) : (
                        impactItems.map((op) => (
                          <div key={op.id} className="p-3 rounded-xl bg-white border border-slate-300 shadow-2xs space-y-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-black text-slate-900 truncate">{op.speakerName}</span>
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                op.stance === 'SUPPORT' ? 'bg-emerald-100 text-emerald-800' :
                                op.stance === 'CRITIQUE' ? 'bg-blue-100 text-blue-800' :
                                op.stance === 'WARNING' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {op.stance}
                              </span>
                            </div>
                            <p className="text-[11px] font-semibold text-slate-700 line-clamp-2">{op.opinionSummary}</p>
                            {op.matchedKeywords && op.matchedKeywords.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {op.matchedKeywords.map((k) => (
                                  <span key={k.keyword} className="px-1 py-0.1 rounded text-[9px] font-mono bg-slate-100 text-slate-700 border">
                                    #{k.keyword}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* DEFAULT LIST VIEW */
          filteredOpinions.map((op) => {
            const isSupport = op.stance === 'SUPPORT';
            const isCritique = op.stance === 'CRITIQUE';
            const isWarning = op.stance === 'WARNING';

            const pubDateStr = new Date(op.publishedAt || op.createdAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });

            return (
              <div
                key={op.id}
                className={`p-5 rounded-2xl border-2 transition-all bg-white hover:shadow-md space-y-4 ${
                  op.isWatchlist
                    ? 'border-amber-300/80 bg-amber-50/15'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                {/* Header Row: Speaker Profile & Watchlist Pin */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl text-white font-black shrink-0 ${
                      op.speakerType === 'ORGANIZATION' ? 'bg-indigo-600' : 'bg-slate-900'
                    }`}>
                      {op.speakerType === 'ORGANIZATION' ? <Building2 className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-slate-900">{op.speakerName}</span>
                        {op.isWatchlist && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>Đáng lưu tâm</span>
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                          isSupport
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isCritique
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : isWarning
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isSupport ? 'Ủng hộ / Tích cực' : isCritique ? 'Phản biện / Góp ý' : isWarning ? 'Cảnh báo / Lo ngại' : 'Khách quan'}
                        </span>
                        {/* Automated Classification Badge */}
                        <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                          op.policyImpactLevel === 'HIGH'
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : op.policyImpactLevel === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-800 border border-slate-300'
                        }`}>
                          {op.policyImpactLevel === 'HIGH'
                            ? `🚨 Tác động Trọng yếu/Cao (${op.policyImpactScore}đ)`
                            : op.policyImpactLevel === 'MEDIUM'
                            ? `⚡ Tác động Trung bình (${op.policyImpactScore}đ)`
                            : `📌 Tác động Giám sát (${op.policyImpactScore}đ)`}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">{op.speakerRole}</p>
                    </div>
                  </div>

                  {/* Right Header: Watchlist Toggle & Source */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => handleToggleWatchlist(op.id, op.isWatchlist)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 border ${
                        op.isWatchlist
                          ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                      title={op.isWatchlist ? 'Bỏ ghim khỏi Mục đáng lưu tâm' : 'Ghim vào Mục đáng lưu tâm'}
                    >
                      <Star className={`w-3.5 h-3.5 ${op.isWatchlist ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                      <span>{op.isWatchlist ? 'Đang lưu tâm' : 'Lưu tâm'}</span>
                    </button>

                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{pubDateStr}</span>
                    </span>
                  </div>
                </div>

                {/* Article Reference Title */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                    <span>Bài viết liên quan:</span>
                    {op.source && <span className="text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded font-semibold">{op.source}</span>}
                    <span className="text-amber-800 font-extrabold bg-amber-50 px-2 py-0.2 rounded border border-amber-200">
                      {op.policyArea}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug hover:text-amber-700 transition">
                    {cleanHtmlTitle(op.articleTitle)}
                  </h3>

                  {/* Matched Keywords Cloud (Keyword Weight Configuration) */}
                  {op.matchedKeywords && op.matchedKeywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[11px] font-bold text-slate-500">Từ khóa trọng số kích hoạt:</span>
                      {op.matchedKeywords.map((k) => (
                        <span
                          key={k.keyword}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            k.weight >= 4.8
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : k.weight >= 4.0
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-blue-50 text-blue-800 border-blue-300'
                          }`}
                          title={k.category ? `Danh mục: ${k.category}` : undefined}
                        >
                          #{k.keyword} ({k.weight.toFixed(1)}đ)
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Opinion Summary */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                  <span className="font-black text-slate-900 block mb-1">Tóm tắt luận điểm đóng góp chính sách:</span>
                  {op.opinionSummary}
                </div>

                {/* Direct Quote If Available */}
                {op.statementQuote && (
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border-l-4 border-amber-500 text-xs sm:text-sm font-semibold text-slate-800 italic leading-relaxed flex items-start gap-2.5">
                    <MessageSquareQuote className="w-5 h-5 text-amber-600 shrink-0 not-italic mt-0.5" />
                    <div>
                      <span>{op.statementQuote}</span>
                      <span className="block text-[11px] font-black text-amber-800 not-italic mt-1">
                        — {op.speakerName} ({op.speakerRole})
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Row */}
                <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
                  <div className="flex items-center gap-2">
                    {op.articleUrl && (
                      <a
                        href={op.articleUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Xem nguồn bài viết</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={() => handleCopyQuote(op)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === op.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === op.id ? 'Đã sao chép' : 'Sao chép nhận định'}</span>
                    </button>
                  </div>

                  <span className="text-xs font-bold text-slate-400">
                    Cơ sở dữ liệu Ý kiến chuyên gia Bộ Tài chính
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Modal: Ghi Nhận Ý Kiến Chuyên Gia Mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border-2 border-slate-300 shadow-2xl p-6 space-y-4 my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-900 text-white">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Ghi nhận Ý kiến Nhân vật / Tổ chức mới</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOpinion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    Tên Nhân vật hoặc Tổ chức *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSpeakerName}
                    onChange={(e) => setFormSpeakerName(e.target.value)}
                    placeholder="Ví dụ: GS. Đặng Hùng Võ hoặc VCCI"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    Chức danh / Vai trò
                  </label>
                  <input
                    type="text"
                    value={formSpeakerRole}
                    onChange={(e) => setFormSpeakerRole(e.target.value)}
                    placeholder="Ví dụ: Nguyên Thứ trưởng Bộ TN&MT"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Loại chủ thể</label>
                  <select
                    value={formSpeakerType}
                    onChange={(e) => setFormSpeakerType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="EXPERT">Chuyên gia cá nhân</option>
                    <option value="ORGANIZATION">Tổ chức / Hiệp hội</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Sắc thái quan điểm</label>
                  <select
                    value={formStance}
                    onChange={(e) => setFormStance(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="CRITIQUE">Phản biện / Góp ý</option>
                    <option value="SUPPORT">Ủng hộ / Tích cực</option>
                    <option value="WARNING">Cảnh báo / Lo ngại</option>
                    <option value="NEUTRAL">Khách quan / Trung lập</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Lĩnh vực chính sách</label>
                  <input
                    type="text"
                    value={formPolicyArea}
                    onChange={(e) => setFormPolicyArea(e.target.value)}
                    placeholder="Thuế, Đất đai, Trái phiếu..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  Tiêu đề bài viết phát biểu *
                </label>
                <input
                  type="text"
                  required
                  value={formArticleTitle}
                  onChange={(e) => setFormArticleTitle(e.target.value)}
                  placeholder="Tiêu đề bài báo đăng tải ý kiến chuyên gia..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Nguồn báo</label>
                  <input
                    type="text"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    placeholder="VietNamNet, VnEconomy..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Đường dẫn URL bài viết</label>
                  <input
                    type="url"
                    value={formArticleUrl}
                    onChange={(e) => setFormArticleUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  Tóm tắt nhận định & Luận điểm đóng góp *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formOpinionSummary}
                  onChange={(e) => setFormOpinionSummary(e.target.value)}
                  placeholder="Tóm tắt nhận định, các khoảng trống chính sách chỉ ra hoặc đề xuất giải pháp..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  Trích dẫn nguyên văn phát biểu (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={formStatementQuote}
                  onChange={(e) => setFormStatementQuote(e.target.value)}
                  placeholder="Trích dẫn nguyên văn câu nói ấn tượng..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formWatchlist"
                  checked={formIsWatchlist}
                  onChange={(e) => setFormIsWatchlist(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="formWatchlist" className="text-xs font-bold text-slate-800 cursor-pointer">
                  ⭐ Đưa vào "Mục Đáng Lưu Tâm" (Theo dõi thường xuyên)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black transition cursor-pointer shadow-xs"
                >
                  Lưu vào Cơ sở dữ liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
