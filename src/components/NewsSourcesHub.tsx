import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Zap,
  Clock,
  Filter,
  Check,
  Layers,
  Activity,
  Sliders,
  Power,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Radio,
  SlidersHorizontal,
  Plus,
  Trash2,
  RotateCcw,
  X,
  Building2,
} from 'lucide-react';
import { ScrapedNewsItem } from '../types';
import { useTheme } from '../lib/theme';
import {
  fetchSourcesManagement,
  toggleSourceStatus,
  addCustomSource,
  deleteSource,
  resetSourcesToDefault,
  ManagedSourceItem,
  SourcesManagementResponse,
} from '../services/api';

interface NewsSourcesHubProps {
  articles?: ScrapedNewsItem[];
  onSelectSourceFilter?: (sourceName: string) => void;
  onRefreshSources?: () => void;
  isScanning?: boolean;
}

export const NewsSourcesHub: React.FC<NewsSourcesHubProps> = ({
  articles = [],
  onSelectSourceFilter,
  onRefreshSources,
  isScanning = false,
}) => {
  const { isDark } = useTheme();

  const [data, setData] = useState<SourcesManagementResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Modal Thêm Đầu Báo
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<ManagedSourceItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newSourceForm, setNewSourceForm] = useState({
    name: '',
    shortName: '',
    domain: '',
    category: 'economic_press',
    categoryLabelVi: 'Báo chí Kinh tế - Đầu tư',
    tier: 'tier2' as 'tier1' | 'tier2' | 'tier3',
    tierLabel: 'Tier 2 - Báo chí Chuyên ngành',
    trafficPriority: 'medium' as 'high' | 'medium' | 'standard',
    authorityWeight: 1.4,
    description: '',
    rssUrl: '',
  });

  // Fetch 30 sources state from backend
  const loadSources = async () => {
    try {
      setIsLoading(true);
      const res = await fetchSourcesManagement();
      setData(res);
    } catch (err) {
      console.error('Failed to load 30 sources management data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  // Show temporary notice
  const notify = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  // Toggle single source
  const handleToggleSingle = async (sourceId: string, currentEnabled: boolean) => {
    const nextState = !currentEnabled;
    // Optimistic update
    if (data) {
      setData({
        ...data,
        enabledCount: nextState ? data.enabledCount + 1 : data.enabledCount - 1,
        disabledCount: nextState ? data.disabledCount - 1 : data.disabledCount + 1,
        sources: data.sources.map(s =>
          s.id === sourceId
            ? {
                ...s,
                enabled: nextState,
                sessionStatus: nextState ? 'pending' : 'disabled',
              }
            : s
        ),
      });
    }

    try {
      setIsUpdating(true);
      await toggleSourceStatus({
        action: 'single',
        sourceId,
        enabled: nextState,
      });
      notify(nextState ? `Đã bật quét cho nguồn "${sourceId}"` : `Đã tắt nguồn "${sourceId}"`);
    } catch (err) {
      console.error('Error toggling source:', err);
      // Rollback
      loadSources();
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle category
  const handleToggleCategory = async (categoryId: string, enable: boolean) => {
    if (!data) return;

    // Optimistic update
    const updatedSources = data.sources.map(s => {
      if (s.category === categoryId) {
        return {
          ...s,
          enabled: enable,
          sessionStatus: enable ? ('pending' as const) : ('disabled' as const),
        };
      }
      return s;
    });

    const enabledCount = updatedSources.filter(s => s.enabled).length;
    setData({
      ...data,
      enabledCount,
      disabledCount: updatedSources.length - enabledCount,
      sources: updatedSources,
    });

    try {
      setIsUpdating(true);
      await toggleSourceStatus({
        action: 'category',
        category: categoryId,
        enabled: enable,
      });
      notify(enable ? `Đã kích hoạt toàn bộ chuyên mục` : `Đã tạm tắt toàn bộ chuyên mục`);
    } catch (err) {
      console.error('Error toggling category:', err);
      loadSources();
    } finally {
      setIsUpdating(false);
    }
  };

  // Preset: Enable All
  const handleEnableAll = async () => {
    if (!data) return;
    try {
      setIsUpdating(true);
      await toggleSourceStatus({ action: 'all', enabled: true });
      await loadSources();
      notify('Đã kích hoạt đầy đủ 30 nguồn báo chí');
    } catch (err) {
      console.error('Error enabling all:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Preset: High Traffic Only (Priority 1)
  const handlePresetHighTrafficOnly = async () => {
    if (!data) return;
    const highTrafficIds = data.sources
      .filter(s => s.trafficPriority === 'high')
      .map(s => s.id);

    try {
      setIsUpdating(true);
      await toggleSourceStatus({
        action: 'batch',
        enabledSourceIds: highTrafficIds,
      });
      await loadSources();
      notify(`Đã kích hoạt chế độ siêu tốc: Chỉ quét 10 báo có lưu lượng lớn nhất`);
    } catch (err) {
      console.error('Error applying high traffic preset:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Preset: Tier 1 Only
  const handlePresetTier1Only = async () => {
    if (!data) return;
    const tier1Ids = data.sources
      .filter(s => s.tier === 'tier1')
      .map(s => s.id);

    try {
      setIsUpdating(true);
      await toggleSourceStatus({
        action: 'batch',
        enabledSourceIds: tier1Ids,
      });
      await loadSources();
      notify(`Đã kích hoạt chế độ báo cáo: Chỉ quét các cơ quan ngôn luận & báo quốc gia Tier 1`);
    } catch (err) {
      console.error('Error applying tier1 preset:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Quick preset templates for adding sources
  const QUICK_ADD_PRESETS = [
    {
      name: 'Báo Tuổi Trẻ',
      shortName: 'Tuổi Trẻ',
      domain: 'tuoitre.vn',
      category: 'national_press',
      categoryLabelVi: 'Báo chí Quốc gia',
      tier: 'tier1' as const,
      tierLabel: 'Tier 1 - Báo chí Quốc gia',
      trafficPriority: 'high' as const,
      authorityWeight: 1.8,
      description: 'Cơ quan ngôn luận Thành đoàn TP.HCM, thông tin kinh tế - xã hội, đời sống đa chiều.',
    },
    {
      name: 'Báo Lao Động',
      shortName: 'Lao Động',
      domain: 'laodong.vn',
      category: 'national_press',
      categoryLabelVi: 'Báo chí Quốc gia',
      tier: 'tier1' as const,
      tierLabel: 'Tier 1 - Báo chí Quốc gia',
      trafficPriority: 'high' as const,
      authorityWeight: 1.7,
      description: 'Tổng Liên đoàn Lao động VN, bám sát thuế TNCN, BHXH, thu nhập và đời sống người lao động.',
    },
    {
      name: 'Báo Tiền Phong',
      shortName: 'Tiền Phong',
      domain: 'tienphong.vn',
      category: 'national_press',
      categoryLabelVi: 'Báo chí Quốc gia',
      tier: 'tier2' as const,
      tierLabel: 'Tier 2 - Báo chí Quốc gia',
      trafficPriority: 'medium' as const,
      authorityWeight: 1.5,
      description: 'Trung ương Đoàn TNCS Hồ Chí Minh, phản ánh thị trường, kinh tế, bất động sản.',
    },
    {
      name: 'Báo Công Thương',
      shortName: 'Công Thương',
      domain: 'congthuong.vn',
      category: 'economic_press',
      categoryLabelVi: 'Báo chí Kinh tế - Đầu tư',
      tier: 'tier2' as const,
      tierLabel: 'Tier 2 - Chuyên ngành',
      trafficPriority: 'medium' as const,
      authorityWeight: 1.5,
      description: 'Cơ quan ngôn luận Bộ Công Thương, cập nhật xuất nhập khẩu, giá xăng dầu, điện năng.',
    },
    {
      name: 'Tạp chí Thuế Nhà Nước',
      shortName: 'Tạp chí Thuế',
      domain: 'tapchithue.com.vn',
      category: 'mof_agencies',
      categoryLabelVi: 'Bộ Tài chính & Cơ quan Điều hành',
      tier: 'tier1' as const,
      tierLabel: 'Tier 1 - Chuyên ngành Thuế',
      trafficPriority: 'medium' as const,
      authorityWeight: 1.9,
      description: 'Cơ quan ngôn luận của Tổng cục Thuế, hướng dẫn nghiệp vụ thuế, tháo gỡ vướng mắc doanh nghiệp.',
    },
    {
      name: 'Báo Pháp Luật TP.HCM',
      shortName: 'Pháp Luật TP.HCM',
      domain: 'plo.vn',
      category: 'national_press',
      categoryLabelVi: 'Báo chí Quốc gia',
      tier: 'tier2' as const,
      tierLabel: 'Tier 2 - Pháp lý & Chính sách',
      trafficPriority: 'medium' as const,
      authorityWeight: 1.6,
      description: 'Chuyên sâu phân tích khung pháp lý, nghị định, thủ tục hành chính và tranh chấp.',
    },
  ];

  const handleSelectQuickAddPreset = (preset: typeof QUICK_ADD_PRESETS[0]) => {
    setNewSourceForm({
      name: preset.name,
      shortName: preset.shortName,
      domain: preset.domain,
      category: preset.category,
      categoryLabelVi: preset.categoryLabelVi,
      tier: preset.tier,
      tierLabel: preset.tierLabel,
      trafficPriority: preset.trafficPriority,
      authorityWeight: preset.authorityWeight,
      description: preset.description,
      rssUrl: '',
    });
  };

  const handleSubmitAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceForm.name.trim() || !newSourceForm.domain.trim()) {
      alert('Vui lòng nhập tên báo và tên miền website!');
      return;
    }

    try {
      setIsSubmittingAdd(true);
      const res = await addCustomSource({
        name: newSourceForm.name.trim(),
        shortName: newSourceForm.shortName.trim() || newSourceForm.name.trim(),
        domain: newSourceForm.domain.trim(),
        category: newSourceForm.category,
        categoryLabelVi: newSourceForm.categoryLabelVi,
        tier: newSourceForm.tier,
        tierLabel: newSourceForm.tierLabel,
        trafficPriority: newSourceForm.trafficPriority,
        authorityWeight: Number(newSourceForm.authorityWeight) || 1.3,
        description: newSourceForm.description.trim(),
        rssUrl: newSourceForm.rssUrl.trim() || undefined,
      });

      notify(res.message || `Đã thêm thành công đầu báo "${newSourceForm.name}" vào Kho Giám Sát!`);
      setIsAddModalOpen(false);
      // Reset form
      setNewSourceForm({
        name: '',
        shortName: '',
        domain: '',
        category: 'economic_press',
        categoryLabelVi: 'Báo chí Kinh tế - Đầu tư',
        tier: 'tier2',
        tierLabel: 'Tier 2 - Báo chí Chuyên ngành',
        trafficPriority: 'medium',
        authorityWeight: 1.4,
        description: '',
        rssUrl: '',
      });
      await loadSources();
      if (onRefreshSources) onRefreshSources();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thêm đầu báo');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!sourceToDelete) return;
    try {
      setIsDeleting(true);
      const res = await deleteSource(sourceToDelete.id);
      notify(res.message || `Đã gỡ bỏ đầu báo "${sourceToDelete.name}" khỏi danh mục giám sát.`);
      setSourceToDelete(null);
      await loadSources();
      if (onRefreshSources) onRefreshSources();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gỡ bỏ đầu báo');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetDefaultSources = async () => {
    if (!confirm('Bạn có chắc chắn muốn khôi phục danh mục 30 nguồn báo chí mặc định ban đầu?')) {
      return;
    }
    try {
      setIsUpdating(true);
      const res = await resetSourcesToDefault();
      notify(res.message || 'Đã khôi phục danh mục 30 nguồn báo chuẩn.');
      await loadSources();
      if (onRefreshSources) onRefreshSources();
    } catch (err: any) {
      alert(err.message || 'Lỗi khôi phục');
    } finally {
      setIsUpdating(false);
    }
  };

  // Filtered sources
  const filteredSources = useMemo(() => {
    if (!data) return [];
    return data.sources.filter(source => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = source.name.toLowerCase().includes(q) || source.shortName.toLowerCase().includes(q);
        const matchesDomain = source.domain.toLowerCase().includes(q);
        const matchesDesc = source.description.toLowerCase().includes(q);
        if (!matchesName && !matchesDomain && !matchesDesc) return false;
      }
      // Category
      if (selectedCategory !== 'all' && source.category !== selectedCategory) {
        return false;
      }
      // Status
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'enabled' && !source.enabled) return false;
        if (selectedStatus === 'disabled' && source.enabled) return false;
        if (selectedStatus === 'scanned' && source.sessionStatus !== 'scanned') return false;
        if (selectedStatus === 'pending' && source.sessionStatus !== 'pending') return false;
        if (selectedStatus === 'scanning' && source.sessionStatus !== 'scanning') return false;
      }
      // Priority
      if (selectedPriority !== 'all' && source.trafficPriority !== selectedPriority) {
        return false;
      }
      return true;
    });
  }, [data, searchQuery, selectedCategory, selectedStatus, selectedPriority]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div
        className={`p-6 rounded-2xl border ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-xl'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                <Globe className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight">
                Quản Lý 30 Nguồn Báo Chí Cốt Lõi & Hàng Đợi Thông Minh
              </h1>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  isDark
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
              >
                Phiên Quét 24h
              </span>
            </div>
            <p className={`text-sm mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Hệ thống tinh gọn về đúng 30 trang báo chính thống bám sát vấn đề điều hành Bộ Tài chính. Hàng đợi xử lý
              ưu tiên các trang có lưu lượng tin lớn nhất trước để dữ liệu hiển thị sớm nhất cho Lãnh đạo.
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Thêm đầu báo mới
            </button>

            <button
              onClick={handleResetDefaultSources}
              title="Khôi phục danh mục 30 nguồn báo chí mặc định"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              Khôi phục 30 gốc
            </button>

            <button
              onClick={() => {
                loadSources();
                if (onRefreshSources) onRefreshSources();
              }}
              disabled={isLoading || isUpdating}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Success Notice Toast */}
        {successNotice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* 4 Summary Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Tổng Nguồn Chuẩn Hóa
              </span>
              <Globe className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">
              {data?.totalSources || 30}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">3 nhóm báo chí trọng điểm</p>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Đang Kích Hoạt
              </span>
              <Power className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {data?.enabledCount || 30} <span className="text-xs font-normal text-slate-500">/ 30</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Sẵn sàng trong phiên quét</p>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Đã Quét Thành Công
              </span>
              <CheckCircle2 className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-2xl font-bold mt-1 text-cyan-600 dark:text-cyan-400">
              {data?.scannedCount || 0} <span className="text-xs font-normal text-slate-500">nguồn</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Dữ liệu sẵn sàng báo cáo</p>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Đang Đợi Quét
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
              {data?.pendingCount || 0} <span className="text-xs font-normal text-slate-500">nguồn</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Trong hàng đợi thông minh</p>
          </div>
        </div>
      </div>

      {/* 3 Category Quick-Toggle Banners */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            Điều Khiển Bật/Tắt Theo Nhóm Chuyên Mục (Tối Ưu Hiệu Suất)
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleEnableAll}
              className={`px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              Bật tất cả (30)
            </button>
            <button
              onClick={handlePresetHighTrafficOnly}
              className="px-2.5 py-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-500/20 transition cursor-pointer"
            >
              ⚡ Siêu tốc: Top 10 lưu lượng
            </button>
            <button
              onClick={handlePresetTier1Only}
              className="px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium hover:bg-emerald-500/20 transition cursor-pointer"
            >
              🏛️ Chỉ Tier 1 Lãnh đạo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Group 1 */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between transition ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Tier 1 - Cốt lõi
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {data?.sources.filter(s => s.category === 'mof_agencies' && s.enabled).length} / 4 Bật
                </span>
              </div>
              <h3 className="font-bold text-sm mt-2">Bộ Tài chính & Cơ quan Điều hành</h3>
              <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Thời báo Tài chính, Cổng TTĐT BTC, Tạp chí Tài chính, Báo Chính phủ.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => handleToggleCategory('mof_agencies', true)}
                className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
              >
                Bật cả nhóm (4)
              </button>
              <button
                onClick={() => handleToggleCategory('mof_agencies', false)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                Tắt
              </button>
            </div>
          </div>

          {/* Group 2 */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between transition ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Chuyên môn sâu
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {data?.sources.filter(s => s.category === 'economic_press' && s.enabled).length} / 11 Bật
                </span>
              </div>
              <h3 className="font-bold text-sm mt-2">Báo chí Kinh tế - Đầu tư - TTCK</h3>
              <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                CafeF, Báo Đầu tư, VnEconomy, Tin nhanh CK, Vietnambiz, VietnamFinance, v.v.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => handleToggleCategory('economic_press', true)}
                className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer"
              >
                Bật cả nhóm (11)
              </button>
              <button
                onClick={() => handleToggleCategory('economic_press', false)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                Tắt
              </button>
            </div>
          </div>

          {/* Group 3 */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between transition ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  Đại chúng & Đa phương tiện
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {data?.sources.filter(s => s.category === 'national_press' && s.enabled).length} / 15 Bật
                </span>
              </div>
              <h3 className="font-bold text-sm mt-2">Báo chí Quốc gia & Truyền hình</h3>
              <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                VnExpress, Tuổi Trẻ, Thanh Niên, VietNamNet, Dân Trí, VTV, VOV, TTXVN, v.v.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => handleToggleCategory('national_press', true)}
                className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition cursor-pointer"
              >
                Bật cả nhóm (15)
              </button>
              <button
                onClick={() => handleToggleCategory('national_press', false)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                Tắt
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className={`p-4 rounded-xl border flex flex-col md:flex-row gap-3 items-center justify-between ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên báo hoặc tên miền..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className={`px-3 py-2 rounded-lg text-xs border focus:outline-none cursor-pointer ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            <option value="all">Tất cả Chuyên mục</option>
            <option value="mof_agencies">Bộ Tài chính (4 nguồn)</option>
            <option value="economic_press">Kinh tế - Đầu tư (11 nguồn)</option>
            <option value="national_press">Báo chí Quốc gia (15 nguồn)</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className={`px-3 py-2 rounded-lg text-xs border focus:outline-none cursor-pointer ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            <option value="all">Tất cả Trạng thái</option>
            <option value="scanned">Đã quét</option>
            <option value="pending">Đang đợi trong hàng đợi</option>
            <option value="scanning">Đang quét</option>
            <option value="enabled">Đang kích hoạt</option>
            <option value="disabled">Đã tắt</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className={`px-3 py-2 rounded-lg text-xs border focus:outline-none cursor-pointer ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            <option value="all">Mọi mức Ưu tiên</option>
            <option value="high">Ưu tiên 1 (Lưu lượng tin lớn nhất)</option>
            <option value="medium">Ưu tiên 2 (Chuyên sâu)</option>
            <option value="standard">Ưu tiên 3 (Thông tấn & TH)</option>
          </select>
        </div>
      </div>

      {/* Sources Grid List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span>
            Hiển thị <strong>{filteredSources.length}</strong> / 30 nguồn báo chí
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> Đã quét
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> Đang đợi
            <span className="inline-block w-2 h-2 rounded-full bg-slate-400" /> Đã tắt
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredSources.map(source => {
            const isHighTraffic = source.trafficPriority === 'high';
            const isMediumTraffic = source.trafficPriority === 'medium';

            return (
              <div
                key={source.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition relative ${
                  source.enabled
                    ? isDark
                      ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    : isDark
                    ? 'bg-slate-950/40 border-slate-900 opacity-60'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div>
                  {/* Top line: Priority Badge & Toggle Switch */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {isHighTraffic ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-indigo-500" />
                          Ưu tiên 1 #{source.trafficRank}
                        </span>
                      ) : isMediumTraffic ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          Ưu tiên 2 #{source.trafficRank}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-500/10 text-slate-500 border border-slate-500/20">
                          Ưu tiên 3 #{source.trafficRank}
                        </span>
                      )}

                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                        {source.categoryLabelVi}
                      </span>
                    </div>

                    {/* Actions: Toggle Switch & Delete Source Button */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleSingle(source.id, source.enabled)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          source.enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        title={source.enabled ? 'Tạm tắt nguồn này' : 'Bật quét nguồn này'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            source.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <button
                        onClick={() => setSourceToDelete(source)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                        title={`Bớt / Xóa đầu báo "${source.name}" khỏi danh mục`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Source Name & Domain */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-sm tracking-tight truncate" title={source.name}>
                        {source.name}
                      </h4>
                      <a
                        href={`https://${source.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                        title={`Mở trang ${source.domain}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                      <span>{source.domain}</span>
                      <span className="text-slate-400">•</span>
                      <span>{source.latencyMs}ms</span>
                    </p>
                  </div>

                  {/* One-sentence description */}
                  <p className={`text-xs mt-2 line-clamp-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {source.description}
                  </p>
                </div>

                {/* Bottom line: Session Status & Article count */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  {/* Status Indicator */}
                  {!source.enabled ? (
                    <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      Tạm tắt
                    </span>
                  ) : source.sessionStatus === 'scanning' ? (
                    <span className="flex items-center gap-1.5 text-sky-500 font-bold animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                      Đang quét...
                    </span>
                  ) : source.sessionStatus === 'scanned' ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Đã quét
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Đang đợi
                    </span>
                  )}

                  {/* Articles count in 24h */}
                  {source.enabled && (
                    <div className="flex items-center gap-2">
                      <span
                        onClick={() => onSelectSourceFilter && onSelectSourceFilter(source.shortName)}
                        className={`text-xs px-2 py-0.5 rounded font-bold cursor-pointer transition ${
                          source.articlesFound > 0
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                        title="Xem bài viết của nguồn này trong CSDL"
                      >
                        {source.articlesFound} bài
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredSources.length === 0 && (
          <div
            className={`p-12 text-center rounded-xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="font-semibold text-sm">Không tìm thấy nguồn tin phù hợp với bộ lọc</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSelectedPriority('all');
              }}
              className="mt-3 px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* MODAL: THÊM ĐẦU BÁO MỚI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl transition animate-fadeIn ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Thêm Đầu Báo Mới Vào Kho Giám Sát</h3>
                  <p className="text-xs text-slate-500">Mở rộng phạm vi thu thập tin tức báo chí kinh tế - tài chính</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Gợi ý nhanh 1-click (Chọn để điền tự động):
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_ADD_PRESETS.map(preset => (
                  <button
                    key={preset.domain}
                    type="button"
                    onClick={() => handleSelectQuickAddPreset(preset)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      newSourceForm.domain === preset.domain
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    <span>+ {preset.name}</span>
                    <span className="text-[10px] opacity-70">({preset.domain})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitAddSource} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Tên đầu báo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Báo Tuổi Trẻ, Báo Lao Động..."
                    value={newSourceForm.name}
                    onChange={e => setNewSourceForm({ ...newSourceForm, name: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Tên viết tắt / Nhãn
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Tuổi Trẻ, Lao Động..."
                    value={newSourceForm.shortName}
                    onChange={e => setNewSourceForm({ ...newSourceForm, shortName: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Tên miền website (Domain) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: tuoitre.vn hoặc laodong.vn"
                    value={newSourceForm.domain}
                    onChange={e => setNewSourceForm({ ...newSourceForm, domain: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Phân nhóm chuyên mục
                  </label>
                  <select
                    value={newSourceForm.category}
                    onChange={e => {
                      const cat = e.target.value;
                      let label = 'Báo chí Kinh tế - Đầu tư';
                      if (cat === 'mof_agencies') label = 'Bộ Tài chính & Cơ quan Điều hành';
                      if (cat === 'national_press') label = 'Báo chí Quốc gia & Đa phương tiện';
                      setNewSourceForm({ ...newSourceForm, category: cat, categoryLabelVi: label });
                    }}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="economic_press">Báo chí Kinh tế - Đầu tư - Chứng khoán</option>
                    <option value="mof_agencies">Bộ Tài chính & Cơ quan Điều hành</option>
                    <option value="national_press">Báo chí Quốc gia & Truyền hình Đa phương tiện</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Phân hạng thẩm quyền
                  </label>
                  <select
                    value={newSourceForm.tier}
                    onChange={e => {
                      const tier = e.target.value as 'tier1' | 'tier2' | 'tier3';
                      let tierLabel = 'Tier 2 - Báo chí Chuyên ngành';
                      if (tier === 'tier1') tierLabel = 'Tier 1 - Trọng điểm Quốc gia';
                      if (tier === 'tier3') tierLabel = 'Tier 3 - Tin tổng hợp';
                      setNewSourceForm({ ...newSourceForm, tier, tierLabel });
                    }}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="tier1">Tier 1 (Trọng điểm Quốc gia)</option>
                    <option value="tier2">Tier 2 (Chuyên ngành)</option>
                    <option value="tier3">Tier 3 (Tin tức tổng hợp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Mức độ ưu tiên quét
                  </label>
                  <select
                    value={newSourceForm.trafficPriority}
                    onChange={e => setNewSourceForm({ ...newSourceForm, trafficPriority: e.target.value as any })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="high">Ưu tiên 1 (Lưu lượng tin lớn nhất)</option>
                    <option value="medium">Ưu tiên 2 (Chuyên sâu)</option>
                    <option value="standard">Ưu tiên 3 (Tiêu chuẩn)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Trọng số uy tín (1.0 - 2.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="2.0"
                    value={newSourceForm.authorityWeight}
                    onChange={e => setNewSourceForm({ ...newSourceForm, authorityWeight: parseFloat(e.target.value) || 1.3 })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                  Mô tả vai trò / định hướng báo chí
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú về định hướng tin bài, cơ quan chủ quản..."
                  value={newSourceForm.description}
                  onChange={e => setNewSourceForm({ ...newSourceForm, description: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                    isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center gap-2"
                >
                  {isSubmittingAdd ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Đang Thêm...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Lưu & Thêm Vào Kho Báo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG XÁC NHẬN GỠ BỎ ĐẦU BÁO */}
      {sourceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl transition animate-fadeIn ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Gỡ Bỏ Đầu Báo Khỏi Kho Giám Sát</h4>
                <p className="text-xs text-slate-500">Xác nhận bớt nguồn khỏi danh mục quét</p>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p>
                <strong className="text-slate-800 dark:text-slate-200">Tên báo:</strong> {sourceToDelete.name}
              </p>
              <p>
                <strong className="text-slate-800 dark:text-slate-200">Tên miền:</strong>{' '}
                <span className="font-mono text-indigo-500">{sourceToDelete.domain}</span>
              </p>
              <p>
                <strong className="text-slate-800 dark:text-slate-200">Chuyên mục:</strong>{' '}
                {sourceToDelete.categoryLabelVi}
              </p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
              Bạn có chắc muốn gỡ bỏ đầu báo này? Hệ thống sẽ không quét các bài viết từ tên miền này nữa. Bạn luôn có
              thể thêm lại bất cứ lúc nào hoặc bấm "Khôi phục 30 gốc".
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setSourceToDelete(null)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                  isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Đang Gỡ...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Xác Nhận Gỡ Bỏ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
