import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Filter, X, CornerDownLeft, History, Trash2, Bookmark, Clock, Tag } from 'lucide-react';
import { SentimentType, ImpactLevel } from '../types';
import { useTheme } from '../lib/theme';

interface CustomKeywordScannerProps {
  onSearch: (query: string) => void;
  activeQuery: string;
  selectedSentiment: SentimentType | 'all';
  onSentimentChange: (sentiment: SentimentType | 'all') => void;
  selectedImpact: ImpactLevel | 'all';
  onImpactChange: (impact: ImpactLevel | 'all') => void;
}

export interface RecentSearchItem {
  id: string;
  query: string;
  sentiment?: SentimentType | 'all';
  impact?: ImpactLevel | 'all';
  timestamp: number;
}

const POPULAR_PRESETS = [
  'Tăng trưởng kinh tế',
  'Tăng trưởng GDP',
  'Tăng trưởng 2 con số',
  'Mô hình tăng trưởng',
  'Kinh tế quý III',
  'Kinh tế quý 3',
  'Trái phiếu doanh nghiệp',
  'Chứng khoán',
  'Cục Thuế & Thuế địa phương',
  'Tổng cục Hải quan',
  'Đầu tư FDI',
  'Kinh tế Nhà nước (SCIC)',
  'Kinh tế Tập thể (HTX)',
  'Nâng hạng FTSE',
  'Lãi suất điều hành',
  'VN-Index',
  'Giá vàng SJC',
];

const RECENT_SEARCHES_KEY = 'finpulse_recent_searches_v2';
const MAX_RECENT_SEARCHES = 12;

export const CustomKeywordScanner: React.FC<CustomKeywordScannerProps> = ({
  onSearch,
  activeQuery,
  selectedSentiment,
  onSentimentChange,
  selectedImpact,
  onImpactChange,
}) => {
  const { isDark } = useTheme();
  const [inputVal, setInputVal] = useState(activeQuery);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed);
        }
      } else {
        // Fallback check for v1 string array key
        const legacy = localStorage.getItem('finpulse_recent_searches');
        if (legacy) {
          const parsedLegacy = JSON.parse(legacy);
          if (Array.isArray(parsedLegacy)) {
            const converted: RecentSearchItem[] = parsedLegacy
              .filter((q) => typeof q === 'string' && q.trim().length > 0)
              .map((q, idx) => ({
                id: `legacy-${idx}-${Date.now()}`,
                query: q.trim(),
                timestamp: Date.now() - idx * 1000,
              }));
            setRecentSearches(converted);
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(converted));
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load recent searches from localStorage:', e);
    }
  }, []);

  // Sync input value when activeQuery changes externally
  useEffect(() => {
    setInputVal(activeQuery);
  }, [activeQuery]);

  // Click outside listener to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to save a search item into localStorage
  const saveRecentQuery = (query: string, sentiment = selectedSentiment, impact = selectedImpact) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setRecentSearches((prev) => {
      // Filter out existing duplicates with same query text (case-insensitive)
      const filtered = prev.filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase());
      const newItem: RecentSearchItem = {
        id: `search-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        query: trimmed,
        sentiment: sentiment !== 'all' ? sentiment : undefined,
        impact: impact !== 'all' ? impact : undefined,
        timestamp: Date.now(),
      };
      const updated = [newItem, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save recent search to localStorage:', e);
      }
      return updated;
    });
  };

  // Remove a single recent query
  const removeRecentQuery = (e: React.MouseEvent, idToRemove: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.id !== idToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to remove recent search from localStorage:', e);
      }
      return updated;
    });
  };

  // Clear all recent searches
  const clearAllRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      localStorage.removeItem('finpulse_recent_searches');
    } catch (e) {
      console.warn('Failed to clear recent searches:', e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (trimmed) {
      saveRecentQuery(trimmed);
    }
    setIsDropdownOpen(false);
    onSearch(trimmed);
  };

  const handleSelectRecentItem = (item: RecentSearchItem) => {
    setInputVal(item.query);
    if (item.sentiment) onSentimentChange(item.sentiment);
    if (item.impact) onImpactChange(item.impact);
    saveRecentQuery(item.query, item.sentiment || selectedSentiment, item.impact || selectedImpact);
    setIsDropdownOpen(false);
    onSearch(item.query);
  };

  const handleSelectPreset = (presetQuery: string) => {
    setInputVal(presetQuery);
    saveRecentQuery(presetQuery);
    setIsDropdownOpen(false);
    onSearch(presetQuery);
  };

  const handleClearInput = () => {
    setInputVal('');
    onSearch('');
  };

  return (
    <div
      className={`border rounded-xl p-3.5 shadow-sm space-y-3 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* Top Section: Search Input & Filter Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Bar with Dropdown Suggestions */}
        <div className="relative flex-1" ref={dropdownRef}>
          <form onSubmit={handleSubmit} className="relative">
            <Search
              className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            />
            <input
              type="text"
              value={inputVal}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setInputVal(e.target.value);
                if (!isDropdownOpen) setIsDropdownOpen(true);
              }}
              placeholder="Quét tin theo từ khóa (VD: HPG, VCB, Lãi suất, Vàng SJC, Bất động sản...)"
              className={`w-full border rounded-lg pl-9 pr-24 py-2 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition ${
                isDark
                  ? 'bg-slate-950 border-slate-700/80 text-slate-100 placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
            {inputVal && (
              <button
                type="button"
                onClick={handleClearInput}
                className={`absolute right-14 top-1/2 -translate-y-1/2 p-1 cursor-pointer transition ${
                  isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Xóa nhập"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded transition flex items-center gap-1 cursor-pointer shadow-xs"
            >
              Quét
              <CornerDownLeft className="w-3 h-3" />
            </button>
          </form>

          {/* Interactive Dropdown for Recent Searches & Suggestions */}
          {isDropdownOpen && (
            <div
              className={`absolute left-0 right-0 top-full mt-1.5 border rounded-xl shadow-2xl z-40 overflow-hidden text-xs max-h-80 overflow-y-auto divide-y animate-fadeIn ${
                isDark
                  ? 'bg-slate-900 border-slate-700/90 divide-slate-800 text-slate-200'
                  : 'bg-white border-slate-200 divide-slate-100 text-slate-800'
              }`}
            >
              {/* Recent Searches Header & Items */}
              {recentSearches.length > 0 && (
                <div className={`p-2 space-y-1 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                  <div
                    className={`flex items-center justify-between px-2 py-1 text-[11px] font-semibold ${
                      isDark ? 'text-cyan-400' : 'text-cyan-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" />
                      Lịch sử quét từ khóa gần đây
                    </span>
                    <button
                      type="button"
                      onClick={clearAllRecent}
                      className={`text-[10px] flex items-center gap-1 transition cursor-pointer ${
                        isDark ? 'text-slate-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                      }`}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      Xóa toàn bộ
                    </button>
                  </div>

                  <div className="space-y-0.5">
                    {recentSearches.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectRecentItem(item)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer group transition ${
                          isDark
                            ? 'hover:bg-slate-800 text-slate-200'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock
                            className={`w-3 h-3 shrink-0 group-hover:text-cyan-400 ${
                              isDark ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          />
                          <span className="truncate font-medium">{item.query}</span>

                          {/* Filter badges if saved */}
                          {item.sentiment && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded border ${
                                item.sentiment === 'bullish'
                                  ? isDark
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : item.sentiment === 'bearish'
                                  ? isDark
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                  : isDark
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {item.sentiment === 'bullish'
                                ? 'Tích cực'
                                : item.sentiment === 'bearish'
                                ? 'Tiêu cực'
                                : 'Trung lập'}
                            </span>
                          )}
                          {item.impact && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded border ${
                                isDark
                                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              Tác động: {item.impact === 'high' ? 'Cao' : item.impact === 'medium' ? 'Trung bình' : 'Thấp'}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => removeRecentQuery(e, item.id)}
                          className={`p-1 rounded transition ${
                            isDark
                              ? 'text-slate-500 hover:text-rose-400 hover:bg-slate-700'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-slate-200'
                          }`}
                          title="Xóa khỏi lịch sử"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Financial Keywords Presets */}
              <div className={`p-2 space-y-1 ${isDark ? 'bg-slate-900/90' : 'bg-slate-50'}`}>
                <div
                  className={`px-2 py-1 text-[11px] font-semibold flex items-center gap-1.5 ${
                    isDark ? 'text-amber-400' : 'text-amber-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Từ khóa tài chính hot đề xuất
                </div>
                <div className="grid grid-cols-2 gap-1 px-1">
                  {POPULAR_PRESETS.slice(0, 8).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`text-left px-2 py-1 rounded transition flex items-center gap-1.5 text-[11px] cursor-pointer ${
                        isDark
                          ? 'hover:bg-slate-800 text-slate-300 hover:text-emerald-300'
                          : 'hover:bg-slate-200 text-slate-700 hover:text-emerald-800'
                      }`}
                    >
                      <Tag className={`w-3 h-3 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                      <span className="truncate">{preset}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sentiment & Impact Filter Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`flex items-center border rounded-lg px-2 py-1 text-xs ${
              isDark ? 'bg-slate-950 border-slate-700/80' : 'bg-slate-50 border-slate-300'
            }`}
          >
            <span className={`mr-1.5 flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <Filter className="w-3 h-3 text-emerald-500" />
              Sắc thái:
            </span>
            <select
              value={selectedSentiment}
              onChange={(e) => onSentimentChange(e.target.value as any)}
              className={`bg-transparent focus:outline-none cursor-pointer text-xs ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              <option value="all" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}>
                Tất cả sắc thái
              </option>
              <option
                value="bullish"
                className={isDark ? 'bg-slate-900 text-emerald-400' : 'bg-white text-emerald-700 font-medium'}
              >
                🟢 Tích cực (Bullish)
              </option>
              <option
                value="bearish"
                className={isDark ? 'bg-slate-900 text-rose-400' : 'bg-white text-rose-700 font-medium'}
              >
                🔴 Tiêu cực (Bearish)
              </option>
              <option
                value="neutral"
                className={isDark ? 'bg-slate-900 text-amber-400' : 'bg-white text-amber-700 font-medium'}
              >
                🟡 Trung lập
              </option>
            </select>
          </div>

          <div
            className={`flex items-center border rounded-lg px-2 py-1 text-xs ${
              isDark ? 'bg-slate-950 border-slate-700/80' : 'bg-slate-50 border-slate-300'
            }`}
          >
            <select
              value={selectedImpact}
              onChange={(e) => onImpactChange(e.target.value as any)}
              className={`bg-transparent focus:outline-none cursor-pointer text-xs ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              <option value="all" className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}>
                Tất cả mức tác động
              </option>
              <option
                value="high"
                className={isDark ? 'bg-slate-900 text-rose-300' : 'bg-white text-rose-700 font-medium'}
              >
                🔥 Tác động cao
              </option>
              <option
                value="medium"
                className={isDark ? 'bg-slate-900 text-amber-300' : 'bg-white text-amber-700 font-medium'}
              >
                ⚡ Tác động trung bình
              </option>
              <option
                value="low"
                className={isDark ? 'bg-slate-900 text-slate-300' : 'bg-white text-slate-700 font-medium'}
              >
                🌿 Tác động thấp
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Recent Searches Quick Pills Bar */}
      {recentSearches.length > 0 && (
        <div
          className={`flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar pt-1 border-t ${
            isDark ? 'border-slate-800/80' : 'border-slate-200'
          }`}
        >
          <span
            className={`text-[11px] font-semibold shrink-0 flex items-center gap-1 ${
              isDark ? 'text-cyan-400' : 'text-cyan-700'
            }`}
          >
            <History className="w-3 h-3" />
            Đã tìm gần đây ({recentSearches.length}):
          </span>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {recentSearches.map((item) => {
              const isActive = activeQuery.toLowerCase() === item.query.toLowerCase();
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectRecentItem(item)}
                  className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition border cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'bg-cyan-500/20 border-cyan-500/70 text-cyan-300 shadow-xs'
                        : 'bg-cyan-50 border-cyan-400 text-cyan-800 shadow-xs'
                      : isDark
                      ? 'bg-slate-800/90 border-slate-700/90 text-slate-300 hover:bg-slate-700/90 hover:text-white hover:border-cyan-500/40'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900 hover:border-cyan-400'
                  }`}
                  title={`Bấm để tìm nhanh: "${item.query}"`}
                >
                  <span className="truncate max-w-[140px]">{item.query}</span>

                  {item.sentiment && (
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded ${
                        item.sentiment === 'bullish'
                          ? isDark
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-emerald-100 text-emerald-800 font-medium'
                          : item.sentiment === 'bearish'
                          ? isDark
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-rose-100 text-rose-800 font-medium'
                          : isDark
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-amber-100 text-amber-800 font-medium'
                      }`}
                    >
                      {item.sentiment === 'bullish'
                        ? 'Tích cực'
                        : item.sentiment === 'bearish'
                        ? 'Tiêu cực'
                        : 'Trung lập'}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => removeRecentQuery(e, item.id)}
                    className={`transition p-0.5 rounded ${
                      isDark
                        ? 'text-slate-500 hover:text-rose-400 hover:bg-slate-700/80'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-slate-200'
                    }`}
                    title="Xóa khỏi danh sách"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={clearAllRecent}
            className={`text-[10px] flex items-center gap-0.5 ml-1 shrink-0 transition cursor-pointer py-1 px-1.5 rounded ${
              isDark
                ? 'text-slate-500 hover:text-rose-400 hover:bg-slate-800'
                : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
            }`}
            title="Xóa toàn bộ lịch sử tìm kiếm"
          >
            <Trash2 className="w-2.5 h-2.5" />
            <span>Xóa lịch sử</span>
          </button>
        </div>
      )}

      {/* Popular Preset Keyword Tags */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
        <span
          className={`text-[11px] shrink-0 flex items-center gap-1 font-medium ${
            isDark ? 'text-slate-500' : 'text-slate-500'
          }`}
        >
          <Sparkles className="w-3 h-3 text-amber-500" />
          Gợi ý từ khóa nóng:
        </span>
        {POPULAR_PRESETS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleSelectPreset(tag)}
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 transition border cursor-pointer ${
              activeQuery.toLowerCase() === tag.toLowerCase()
                ? isDark
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-xs'
                  : 'bg-emerald-100 border-emerald-400 text-emerald-800 font-semibold shadow-xs'
                : isDark
                ? 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
};
