import React, { useState, useMemo } from 'react';
import {
  X,
  Sliders,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Search,
  Star,
  Layers,
  Sparkles,
  Info,
  SlidersHorizontal,
  CloudUpload,
  CheckCircle2
} from 'lucide-react';
import {
  KeywordWeightMap,
  KeywordWeightDef,
  DEFAULT_KEYWORD_CONFIG,
  KEYWORD_CATEGORIES,
} from '../lib/keywordWeights';
import { useTheme } from '../lib/theme';
import { saveUserPreferencesToCloud } from '../lib/firebase';

interface KeywordWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  weights: KeywordWeightMap;
  onSaveWeights: (newWeights: KeywordWeightMap) => void;
  onResetWeights: () => void;
}

export const KeywordWeightModal: React.FC<KeywordWeightModalProps> = ({
  isOpen,
  onClose,
  weights,
  onSaveWeights,
  onResetWeights,
}) => {
  const { isDark } = useTheme();
  const [localWeights, setLocalWeights] = useState<KeywordWeightMap>(weights);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  
  // State for adding new custom keyword
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState('Tùy chỉnh riêng');
  const [newWeight, setNewWeight] = useState(4.5);
  const [addError, setAddError] = useState<string | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [cloudSyncSuccess, setCloudSyncSuccess] = useState<string | null>(null);

  // Sync with props whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalWeights(weights);
      setShowAddForm(false);
      setAddError(null);
      setCloudSyncSuccess(null);
    }
  }, [isOpen, weights]);

  // Handle Sync to Cloud
  const handleSyncToCloud = async () => {
    setIsSyncingCloud(true);
    setCloudSyncSuccess(null);
    try {
      onSaveWeights(localWeights);
      const res = await saveUserPreferencesToCloud({ keywordWeights: localWeights });
      if (res.success) {
        setCloudSyncSuccess(`Đã đồng bộ lên Cloud (${res.syncedItems.keywordWeightsCount} từ khóa)!`);
      } else {
        setCloudSyncSuccess(res.message);
      }
      setTimeout(() => setCloudSyncSuccess(null), 4000);
    } catch (err: any) {
      setCloudSyncSuccess('Lỗi khi đồng bộ lên Cloud');
      setTimeout(() => setCloudSyncSuccess(null), 4000);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  if (!isOpen) return null;

  // Handle individual weight change
  const handleWeightChange = (kw: string, val: number) => {
    setLocalWeights((prev) => ({
      ...prev,
      [kw]: {
        ...prev[kw],
        weight: Number(val.toFixed(1)),
      },
    }));
  };

  // Handle enable/disable toggle
  const handleToggleEnabled = (kw: string) => {
    setLocalWeights((prev) => ({
      ...prev,
      [kw]: {
        ...prev[kw],
        enabled: prev[kw].enabled === false ? true : false,
      },
    }));
  };

  // Handle delete custom keyword
  const handleDeleteKeyword = (kw: string) => {
    setLocalWeights((prev) => {
      const copy = { ...prev };
      delete copy[kw];
      return copy;
    });
  };

  // Handle add new keyword
  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newKeyword.trim();
    if (!trimmed) {
      setAddError('Vui lòng nhập tên từ khóa');
      return;
    }
    if (localWeights[trimmed]) {
      setAddError('Từ khóa này đã tồn tại trong danh sách');
      return;
    }

    setLocalWeights((prev) => ({
      ...prev,
      [trimmed]: {
        category: newCategory,
        weight: Number(newWeight.toFixed(1)),
        isCustom: true,
        enabled: true,
      },
    }));

    setNewKeyword('');
    setShowAddForm(false);
    setAddError(null);
  };

  // Filtered keywords list
  const filteredKeywords = (Object.entries(localWeights) as [string, KeywordWeightDef][]).filter(([kw, def]) => {
    if (selectedCategory !== 'Tất cả') {
      if (selectedCategory === 'Lãnh đạo') {
        if (!def.category.toLowerCase().includes('lãnh đạo')) return false;
      } else if (def.category !== selectedCategory) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return kw.toLowerCase().includes(q) || def.category.toLowerCase().includes(q);
    }
    return true;
  });

  // Calculate statistics
  const totalKeywords = Object.keys(localWeights).length;
  const customModifiedCount = (Object.entries(localWeights) as [string, KeywordWeightDef][]).filter(([kw, def]) => {
    const defaultItem = DEFAULT_KEYWORD_CONFIG[kw];
    if (!defaultItem) return true; // Custom added
    return defaultItem.weight !== def.weight || defaultItem.enabled !== def.enabled;
  }).length;

  const handleSave = () => {
    onSaveWeights(localWeights);
    onClose();
  };

  const handleResetToDefault = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục toàn bộ hệ số trọng số từ khóa về mặc định của Bộ Tài chính?')) {
      onResetWeights();
      setLocalWeights({ ...DEFAULT_KEYWORD_CONFIG });
    }
  };

  // Color helper based on weight
  const getWeightColorClasses = (w: number, enabled = true) => {
    if (!enabled) return isDark ? 'text-slate-500 bg-slate-900 border-slate-800' : 'text-slate-400 bg-slate-100 border-slate-200';
    if (w >= 4.8) return 'text-amber-500 bg-amber-500/15 border-amber-500/30';
    if (w >= 4.0) return 'text-emerald-500 bg-emerald-500/15 border-emerald-500/30';
    if (w >= 3.0) return 'text-cyan-500 bg-cyan-500/15 border-cyan-500/30';
    return isDark ? 'text-slate-400 bg-slate-800/80 border-slate-700' : 'text-slate-600 bg-slate-100 border-slate-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className={`border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Tùy Chỉnh Trọng Số Từ Khóa Bộ Tài Chính
                </h2>
                {customModifiedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[11px] font-bold">
                    {customModifiedCount} đã chỉnh sửa
                  </span>
                )}
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Điều chỉnh hệ số ưu tiên (1.0 - 5.0) để định hình thứ tự sắp xếp và mức độ quan trọng của tin tức
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div
          className={`p-4 border-b space-y-3 transition-colors ${
            isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {/* Search Box */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm từ khóa (VD: Trái phiếu, UBCKNN, Thuế, FDI, GDP, KRX...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-xl pl-9 pr-8 py-2 text-xs placeholder-slate-400 focus:outline-none focus:border-amber-500 transition ${
                  isDark ? 'bg-slate-900 border-slate-700/80 text-slate-200' : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Add Custom Keyword Button */}
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className={`w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer border ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 hover:border-emerald-300'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Thêm từ khóa mới</span>
            </button>
          </div>

          {/* Add Custom Keyword Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddKeyword}
              className="p-3.5 bg-slate-900 border border-emerald-500/30 rounded-xl space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Thêm từ khóa theo dõi riêng của bạn
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Đóng
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tên từ khóa:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nhà ở xã hội, Cắt giảm lãi suất..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Phân loại:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Tùy chỉnh riêng">Tùy chỉnh riêng</option>
                    <option value="Trái phiếu (TPDN)">Trái phiếu (TPDN)</option>
                    <option value="Chứng khoán (UBCK)">Chứng khoán (UBCK)</option>
                    <option value="Thuế & NSNN">Thuế & NSNN</option>
                    <option value="Hải quan & XNK">Hải quan & XNK</option>
                    <option value="Đầu tư Nước ngoài">Đầu tư Nước ngoài</option>
                    <option value="Vĩ mô & Tăng trưởng">Vĩ mô & Tăng trưởng</option>
                    <option value="Kinh tế Nhà nước">Kinh tế Nhà nước</option>
                    <option value="Kinh tế Hợp tác">Kinh tế Hợp tác</option>
                    <option value="Thị trường & Tài sản">Thị trường & Tài sản</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Trọng số ban đầu: <strong className="text-amber-400 font-mono">{newWeight.toFixed(1)}/5.0</strong>
                  </label>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer mt-1"
                  />
                </div>
              </div>

              {addError && <p className="text-xs text-rose-400">{addError}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Xác nhận thêm
                </button>
              </div>
            </form>
          )}

          {/* Categories Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {KEYWORD_CATEGORIES.map((cat) => {
              const count = (Object.values(localWeights) as KeywordWeightDef[]).filter((item) => {
                if (cat === 'Tất cả') return true;
                if (cat === 'Lãnh đạo') return item.category.toLowerCase().includes('lãnh đạo');
                return item.category === cat;
              }).length;

              if (count === 0 && cat !== 'Tất cả') return null;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition border cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-xs'
                      : isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="ml-1 text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Keywords List Section */}
        <div
          className={`flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y transition-colors ${
            isDark ? 'divide-slate-800/60' : 'divide-slate-200/80'
          }`}
        >
          {filteredKeywords.length > 0 ? (
            filteredKeywords.map(([kw, def]) => {
              const isEnabled = def.enabled !== false;
              const defaultItem = DEFAULT_KEYWORD_CONFIG[kw];
              const isModified = defaultItem && defaultItem.weight !== def.weight;

              return (
                <div
                  key={kw}
                  className={`pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl transition ${
                    !isEnabled
                      ? isDark
                        ? 'opacity-40 bg-slate-950/40'
                        : 'opacity-40 bg-slate-100'
                      : isModified
                      ? isDark
                        ? 'bg-amber-950/15 border border-amber-500/20'
                        : 'bg-amber-50/60 border border-amber-300'
                      : isDark
                      ? 'bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800/60'
                      : 'bg-slate-50 hover:bg-slate-100/80 border border-slate-200'
                  }`}
                >
                  {/* Left: Info & Badges */}
                  <div className="flex items-start gap-2.5 min-w-0 sm:w-5/12">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleToggleEnabled(kw)}
                      className={`mt-1 rounded text-amber-500 focus:ring-0 cursor-pointer ${
                        isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'
                      }`}
                      title={isEnabled ? 'Bấm để tắt theo dõi từ này' : 'Bấm để bật theo dõi từ này'}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-xs sm:text-sm font-bold truncate ${
                            !isEnabled
                              ? 'text-slate-400 line-through'
                              : isDark
                              ? 'text-slate-100'
                              : 'text-slate-900'
                          }`}
                        >
                          {kw}
                        </span>
                        {def.isCoreMof && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[9px] font-bold uppercase">
                            Cốt lõi MoF
                          </span>
                        )}
                        {def.isCustom && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 text-[9px] font-bold uppercase">
                            Tự tạo
                          </span>
                        )}
                        {isModified && (
                          <span className="text-[10px] text-amber-500 font-mono">
                            (Mặc định: {defaultItem.weight.toFixed(1)})
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {def.category}
                      </span>
                    </div>
                  </div>

                  {/* Right: Slider & Controls */}
                  <div className="flex items-center gap-3 sm:w-7/12 justify-end">
                    {/* Preset buttons */}
                    <div className="hidden sm:flex items-center gap-1">
                      {[3.0, 4.0, 4.5, 5.0].map((presetVal) => (
                        <button
                          key={presetVal}
                          type="button"
                          disabled={!isEnabled}
                          onClick={() => handleWeightChange(kw, presetVal)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition border cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                            def.weight === presetVal
                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                              : isDark
                              ? 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {presetVal.toFixed(1)}
                        </button>
                      ))}
                    </div>

                    {/* Interactive Slider */}
                    <div className="flex-1 max-w-[140px] flex items-center gap-1.5">
                      <input
                        type="range"
                        min="1.0"
                        max="5.0"
                        step="0.1"
                        disabled={!isEnabled}
                        value={def.weight}
                        onChange={(e) => handleWeightChange(kw, Number(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Current Weight Badge */}
                    <div
                      className={`px-2 py-1 rounded-lg border text-xs font-mono font-bold min-w-[54px] text-center flex items-center justify-center gap-0.5 ${getWeightColorClasses(
                        def.weight,
                        isEnabled
                      )}`}
                    >
                      <Star className="w-3 h-3 fill-current" />
                      <span>{def.weight.toFixed(1)}</span>
                    </div>

                    {/* Custom delete button if custom */}
                    {def.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteKeyword(kw)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        title="Xóa từ khóa tự tạo này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className={`p-8 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Không tìm thấy từ khóa nào phù hợp với bộ lọc "{searchQuery}".
            </div>
          )}
        </div>

        {/* Footer info & action buttons */}
        <div
          className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-10 transition-colors ${
            isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Info className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Tổng cộng <strong>{totalKeywords}</strong> từ khóa. Trọng số cao hơn sẽ ưu tiên bài viết lên đầu khi chọn chế độ sắp xếp theo trọng số MoF.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {cloudSyncSuccess && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {cloudSyncSuccess}
              </span>
            )}

            <button
              type="button"
              onClick={handleSyncToCloud}
              disabled={isSyncingCloud}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Lưu trữ vĩnh viễn cấu hình trọng số từ khóa và ngưỡng cảnh báo lên Google Cloud Firestore cho đa thiết bị"
              id="keyword-modal-sync-preferences-btn"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              <span>{isSyncingCloud ? 'Đang đồng bộ...' : 'Sync Local Preferences to Cloud'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition border cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Mặc định</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Lưu & Áp Dụng Ngay</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
