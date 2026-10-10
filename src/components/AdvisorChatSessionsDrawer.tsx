import React, { useState, useMemo } from 'react';
import {
  History,
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  Edit3,
  Download,
  Check,
  X,
  MessageSquare,
  Clock,
  ShieldCheck,
  FileText,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { AdvisorChatSession, downloadSessionTranscript } from '../lib/advisorSessionStorage';
import { ADVISORY_ROLES } from '../data/macroKnowledgeBase';

interface AdvisorChatSessionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: AdvisorChatSession[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onCreateNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onTogglePinSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
}

export const AdvisorChatSessionsDrawer: React.FC<AdvisorChatSessionsDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateNewSession,
  onDeleteSession,
  onTogglePinSession,
  onRenameSession
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatSessionTime = (timestamp: number) => {
    if (!timestamp) return 'Vừa tạo';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getRoleLabel = (roleId?: string) => {
    const r = ADVISORY_ROLES.find(item => item.id === roleId);
    return r ? r.name.split(' (')[0] : 'Tham mưu chung';
  };

  const filteredSessions = useMemo(() => {
    let result = [...sessions];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(s => {
        const titleMatch = s.title.toLowerCase().includes(q);
        const articleMatch = s.contextArticleTitle?.toLowerCase().includes(q);
        const msgMatch = s.messages.some(m => m.text.toLowerCase().includes(q));
        return titleMatch || articleMatch || msgMatch;
      });
    }

    // Sort: Pinned first, then by updatedAt descending
    return result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  }, [sessions, searchQuery]);

  const handleStartRename = (session: AdvisorChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveRename = (sessionId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingTitle.trim()) {
      onRenameSession(sessionId, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = () => {
    setEditingId(null);
  };

  const handleConfirmDelete = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteSession(sessionId);
    setDeletingId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 left-0 z-30 w-full sm:w-80 md:w-84 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-left-4 duration-200">
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Lịch sử phiên tư vấn</span>
              <span className="px-1.5 py-0.2 text-[10px] bg-slate-200 dark:bg-slate-800 rounded-full font-semibold text-slate-600 dark:text-slate-400">
                {sessions.length}
              </span>
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Lưu vết & tiếp tục tham mưu</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onCreateNewSession}
            title="Tạo phiên tư vấn mới"
            className="px-2 py-1 bg-red-700 hover:bg-red-800 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Phiên mới</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Đóng danh sách phiên"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề, nội dung..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-red-600 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Session Cards List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-400 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="font-medium text-slate-600 dark:text-slate-300">Không tìm thấy phiên nào</p>
            <p className="text-[11px] mt-1 text-slate-400">
              {searchQuery ? 'Hãy thử tìm kiếm với từ khóa khác.' : 'Bắt đầu một phiên tham mưu mới ngay!'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 text-red-600 dark:text-red-400 hover:underline font-semibold text-xs"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            )}
          </div>
        ) : (
          filteredSessions.map((sess) => {
            const isActive = sess.id === activeSessionId;
            const isEditing = editingId === sess.id;
            const isDeleting = deletingId === sess.id;
            const userMsgCount = sess.messages.filter(m => m.sender === 'user').length;

            return (
              <div
                key={sess.id}
                onClick={() => {
                  if (!isEditing && !isDeleting) {
                    onSelectSession(sess.id);
                  }
                }}
                className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-red-50/90 dark:bg-red-950/30 border-red-300 dark:border-red-800 shadow-sm ring-1 ring-red-500/20'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {/* Delete Confirmation Overlay */}
                {isDeleting ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 space-y-2 animate-in fade-in duration-150"
                  >
                    <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold leading-tight">
                      Xác nhận xóa phiên tư vấn này?
                    </p>
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(null);
                        }}
                        className="px-2 py-0.5 text-[10.5px] rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={(e) => handleConfirmDelete(sess.id, e)}
                        className="px-2 py-0.5 text-[10.5px] rounded bg-red-700 hover:bg-red-800 text-white font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Xóa
                      </button>
                    </div>
                  </div>
                ) : isEditing ? (
                  /* Inline Title Editing Form */
                  <form
                    onSubmit={(e) => handleSaveRename(sess.id, e)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1"
                  >
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      autoFocus
                      className="flex-1 px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-red-500 rounded focus:outline-none text-slate-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded"
                      title="Lưu tên"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelRename}
                      className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                      title="Hủy"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <div>
                    {/* Title & Pin Icon */}
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-start gap-1.5 min-w-0">
                        {sess.isPinned && (
                          <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
                        )}
                        <h5
                          className={`text-xs font-semibold truncate leading-tight ${
                            isActive
                              ? 'text-red-900 dark:text-red-200'
                              : 'text-slate-800 dark:text-slate-200 group-hover:text-red-700 dark:group-hover:text-red-400'
                          }`}
                          title={sess.title}
                        >
                          {sess.title}
                        </h5>
                      </div>

                      {/* Quick Hover Actions */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePinSession(sess.id);
                          }}
                          className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
                            sess.isPinned ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                          }`}
                          title={sess.isPinned ? 'Bỏ ghim' : 'Ghim phiên này lên đầu'}
                        >
                          {sess.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                        </button>

                        <button
                          onClick={(e) => handleStartRename(sess, e)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Đổi tên phiên"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadSessionTranscript(sess);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Tải biên bản tham mưu (.md)"
                        >
                          <Download className="w-3 h-3" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(sess.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Xóa phiên"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata Sub-row */}
                    <div className="flex items-center justify-between gap-2 mt-1.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700/60 rounded text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[110px]">
                          {getRoleLabel(sess.roleId)}
                        </span>
                        <span>•</span>
                        <span>{userMsgCount} câu hỏi</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 text-[10px]">
                        <Clock className="w-2.5 h-2.5 opacity-60" />
                        <span>{formatSessionTime(sess.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Article Context pill if attached */}
                    {sess.contextArticleTitle && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300/90 truncate bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                        <FileText className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate italic">"{sess.contextArticleTitle}"</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Drawer Footer Info */}
      <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 text-[10.5px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Tự động lưu liên tục
        </span>
        <button
          onClick={onClose}
          className="text-red-700 dark:text-red-400 hover:underline font-semibold cursor-pointer"
        >
          Quay lại trò chuyện
        </button>
      </div>
    </div>
  );
};
