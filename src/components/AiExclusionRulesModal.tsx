import React, { useState, useEffect } from 'react';
import {
  X,
  BrainCircuit,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Filter,
  Sparkles,
  Tag,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { AiExclusionRule } from '../types';
import { useTheme } from '../lib/theme';

interface AiExclusionRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRulesChanged?: () => void;
}

export const AiExclusionRulesModal: React.FC<AiExclusionRulesModalProps> = ({
  isOpen,
  onClose,
  onRulesChanged,
}) => {
  const { isDark } = useTheme();

  const [rules, setRules] = useState<AiExclusionRule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [purgeNotice, setPurgeNotice] = useState<string | null>(null);

  // New Rule Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newRuleName, setNewRuleName] = useState<string>('');
  const [newUserNote, setNewUserNote] = useState<string>('');
  const [newKeywords, setNewKeywords] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('bds_quang_cao');
  const [isSavingNewRule, setIsSavingNewRule] = useState<boolean>(false);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai-exclusion-rules');
      const json = await res.json();
      if (json.success && Array.isArray(json.rules)) {
        setRules(json.rules);
      }
    } catch (err) {
      console.error('Error fetching AI exclusion rules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRules();
      setPurgeNotice(null);
    }
  }, [isOpen]);

  const handleToggleRule = async (ruleId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/ai-exclusion-rules/${ruleId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const json = await res.json();
      if (json.success) {
        setRules((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, isActive: !currentActive } : r))
        );
        if (onRulesChanged) onRulesChanged();
      }
    } catch (err) {
      console.error('Error toggling rule:', err);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa quy tắc loại trừ này không?')) return;
    try {
      const res = await fetch(`/api/ai-exclusion-rules/${ruleId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setRules((prev) => prev.filter((r) => r.id !== ruleId));
        if (onRulesChanged) onRulesChanged();
      }
    } catch (err) {
      console.error('Error deleting rule:', err);
    }
  };

  const handlePurgeExistingArticles = async () => {
    setIsPurging(true);
    setPurgeNotice(null);
    try {
      const res = await fetch('/api/ai-exclusion-rules/purge-matching', {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        setPurgeNotice(`Đã rà soát toàn bộ CSDL và thanh lọc ${json.purgedCount} bài viết vi phạm quy tắc AI!`);
        if (onRulesChanged) onRulesChanged();
      }
    } catch (err: any) {
      setPurgeNotice(`Lỗi thanh lọc: ${err?.message || 'Không thể thanh lọc'}`);
    } finally {
      setIsPurging(false);
    }
  };

  const handleCreateManualRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newKeywords.trim()) return;

    setIsSavingNewRule(true);
    try {
      const kws = newKeywords
        .split(/[,;\n]/)
        .map((k) => k.trim())
        .filter((k) => k.length >= 2);

      const res = await fetch('/api/ai-exclusion-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleName: newRuleName.trim(),
          userNote: newUserNote.trim() || 'Quy tắc do người dùng thiết lập thủ công',
          category: newCategory,
          keywords: kws,
          aiExplanation: 'Bộ lọc tự động loại trừ các bài viết chứa từ khóa này trong các đợt cào dữ liệu tiếp theo.',
        }),
      });

      const json = await res.json();
      if (json.success && json.rule) {
        setRules([json.rule, ...rules]);
        setShowAddForm(false);
        setNewRuleName('');
        setNewUserNote('');
        setNewKeywords('');
        if (onRulesChanged) onRulesChanged();
      }
    } catch (err) {
      console.error('Error creating manual rule:', err);
    } finally {
      setIsSavingNewRule(false);
    }
  };

  const filteredRules = rules.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = (r.name || '').toLowerCase().includes(q);
    const matchNote = (r.userNote || '').toLowerCase().includes(q);
    const matchKw = (r.keywords || []).some((k) => k.toLowerCase().includes(q));
    return matchName || matchNote || matchKw;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center ring-4 ring-indigo-500/10">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Quản Lý Bộ Lọc AI Loại Trừ Tin Bài
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  {rules.length} quy tắc
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Các quy tắc AI đã học từ ghi chú phản hồi của bạn để ngăn chặn quét dính tin rác trong tương lai.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div
          className={`p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 ${
            isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-100'
          }`}
        >
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm quy tắc, từ khóa..."
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500/40'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-indigo-500/30'
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePurgeExistingArticles}
              disabled={isPurging}
              title="Quét lại CSDL để xóa ngay các bài viết cũ đang dính các quy tắc này"
              className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPurging ? 'animate-spin' : ''}`} />
              <span>{isPurging ? 'Đang thanh lọc...' : 'Thanh Lọc CSDL Ngay'}</span>
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Đóng Form' : 'Thêm Quy Tắc'}</span>
            </button>
          </div>
        </div>

        {/* Purge Notice Banner */}
        {purgeNotice && (
          <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{purgeNotice}</span>
          </div>
        )}

        {/* Add Rule Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateManualRule}
            className={`p-4 border-b space-y-3 shrink-0 ${
              isDark ? 'bg-indigo-950/20 border-indigo-900/40' : 'bg-indigo-50/50 border-indigo-100'
            }`}
          >
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Thiết lập quy tắc loại trừ mới</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Tên quy tắc *
                </span>
                <input
                  type="text"
                  required
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="VD: Chặn tin rao bán đất nông nghiệp"
                  className={`w-full px-3 py-1.5 rounded-xl border text-xs ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                />
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Danh mục
                </span>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl border text-xs ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <option value="bds_quang_cao">Quảng cáo BĐS / Đất nền cá nhân</option>
                  <option value="ngoai_nganh">Không thuộc phạm vi Bộ Tài chính</option>
                  <option value="giai_tri_doi_song">Giải trí / Đời sống / Showbiz</option>
                  <option value="nham_tu_khoa">Nhầm lẫn từ khóa</option>
                  <option value="tin_nuoc_ngoai">Tin nước ngoài không liên quan VN</option>
                  <option value="tin_rac">Tin rác / Spam</option>
                  <option value="khac">Khác</option>
                </select>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Các từ khóa / Cụm từ cần chặn (phân cách bằng dấu phẩy) *
              </span>
              <input
                type="text"
                required
                value={newKeywords}
                onChange={(e) => setNewKeywords(e.target.value)}
                placeholder="VD: đất nông nghiệp, sổ đỏ chung, bán đất vườn, giá ngộp"
                className={`w-full px-3 py-1.5 rounded-xl border text-xs ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                }`}
              />
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Ghi chú / Hướng dẫn thêm cho AI
              </span>
              <input
                type="text"
                value={newUserNote}
                onChange={(e) => setNewUserNote(e.target.value)}
                placeholder="VD: Tin dạng này không có giá trị cho bản tin điều hành tài chính"
                className={`w-full px-3 py-1.5 rounded-xl border text-xs ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSavingNewRule}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1.5"
              >
                {isSavingNewRule ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>Lưu & Kích Hoạt Quy Tắc</span>
              </button>
            </div>
          </form>
        )}

        {/* Rules List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang tải các quy tắc AI...</span>
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <BrainCircuit className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
              <p className="text-sm font-bold">Chưa có quy tắc loại trừ nào phù hợp</p>
              <p className="text-xs max-w-sm mx-auto">
                Khi duyệt bài viết trên màn hình chính hoặc kho tin, bạn có thể nhấn &quot;Loại bỏ bài viết&quot; để đào tạo AI ghi nhớ.
              </p>
            </div>
          ) : (
            filteredRules.map((rule) => {
              const isActive = rule.isActive !== false;
              return (
                <div
                  key={rule.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                    isActive
                      ? isDark
                        ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
                      : isDark
                      ? 'bg-slate-950/20 border-slate-900 opacity-60'
                      : 'bg-slate-100/60 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                          {rule.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Đã chặn {rule.hitCount || 0} bài
                        </span>
                      </div>

                      {rule.userNote && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                          &ldquo;{rule.userNote}&rdquo;
                        </p>
                      )}

                      {rule.aiExplanation && (
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                          🤖 {rule.aiExplanation}
                        </p>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleRule(rule.id, isActive)}
                        title={isActive ? 'Đang bật, nhấn để tạm dừng' : 'Đang tắt, nhấn để kích hoạt'}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                      >
                        {isActive ? (
                          <ToggleRight className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-400" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        title="Xóa quy tắc này"
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Keywords Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Từ khóa chặn:
                    </span>
                    {(rule.keywords || []).map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 text-[11px] font-mono"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between shrink-0 ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Tất cả các lần quét tiếp theo sẽ tự động áp dụng các quy tắc đang bật.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
