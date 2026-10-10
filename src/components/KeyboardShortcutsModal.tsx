import React from 'react';
import {
  X,
  Keyboard,
  Command,
  Sparkles,
  Search,
  RotateCw,
  FileText,
  Sliders,
  BellRing,
  LayoutDashboard,
  Table,
  FileCheck2,
  PieChart,
  Moon,
  Zap,
  CornerDownLeft,
  ArrowRight
} from 'lucide-react';
import { useTheme } from '../lib/theme';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCommandPalette?: () => void;
  onOpenAdvisorChatbot?: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  badge?: string;
}

interface ShortcutGroup {
  title: string;
  icon: React.ReactNode;
  shortcuts: ShortcutItem[];
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onOpenCommandPalette,
  onOpenAdvisorChatbot,
}) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'Tìm kiếm & Điều hướng Nhanh',
      icon: <Search className="w-4 h-4 text-emerald-500" />,
      shortcuts: [
        {
          keys: [modKey, 'K'],
          description: 'Mở Menu Lệnh Tìm kiếm Toàn diện & Điều hướng Nhanh (Command Palette)',
          badge: 'Quan trọng',
        },
        {
          keys: ['/'],
          description: 'Focus nhanh vào thanh tìm kiếm bài viết',
        },
        {
          keys: ['?'],
          description: 'Mở Bảng tra cứu phím tắt trợ giúp này (Cheat Sheet)',
        },
        {
          keys: ['ESC'],
          description: 'Đóng Modal hiện tại, Command Palette hoặc Trợ lý AI',
        },
      ],
    },
    {
      title: 'Trí tuệ Nhân tạo & Nghiệp vụ Tham mưu',
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      shortcuts: [
        {
          keys: [modKey, 'Shift', 'A'],
          description: 'Bật/Tắt Trợ lý AI Chatbot Tham mưu Văn bản',
          badge: 'Power User',
        },
        {
          keys: [modKey, 'E'],
          description: 'Mở Modal Xuất Báo cáo Social Listening (PDF / Word / JSON)',
        },
        {
          keys: [modKey, 'Shift', 'W'],
          description: 'Cấu hình Hệ số Trọng số Từ khóa BTC (MoF Priority)',
        },
        {
          keys: [modKey, 'Shift', 'L'],
          description: 'Mở Bảng Thiết lập Ngưỡng Cảnh báo Tự động (Alert Trigger Rules)',
        },
      ],
    },
    {
      title: 'Chuyển đổi Tab Chức năng (CMS Tabs)',
      icon: <LayoutDashboard className="w-4 h-4 text-indigo-500" />,
      shortcuts: [
        {
          keys: [modKey, '1'],
          description: 'Chuyển sang Bảng điều khiển Tổng quan (Executive Dashboard)',
        },
        {
          keys: [modKey, '2'],
          description: 'Chuyển sang Bảng Dữ liệu Bài viết & Phân tích 6W',
        },
        {
          keys: [modKey, '3'],
          description: 'Chuyển sang Tham mưu Tác chiến & Soạn Thảo Văn bản',
        },
        {
          keys: [modKey, '4'],
          description: 'Chuyển sang Biểu đồ Phân tích & Xu hướng (Analytics)',
        },
      ],
    },
    {
      title: 'Tác vụ Hệ thống & Dữ liệu',
      icon: <Zap className="w-4 h-4 text-cyan-500" />,
      shortcuts: [
        {
          keys: ['Alt', 'R'],
          description: 'Quét dữ liệu mới nhất theo phiên thời gian thực',
        },
        {
          keys: ['Alt', 'T'],
          description: 'Chuyển đổi chế độ Giao diện Sáng / Tối (Light / Dark Mode)',
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Box */}
      <div
        className={`relative w-full max-w-3xl rounded-3xl shadow-2xl border overflow-hidden transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-700/80 text-slate-100 ring-1 ring-white/10'
            : 'bg-white border-slate-200 text-slate-900 ring-1 ring-slate-900/5'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Phím Tắt Điều Hướng Nhanh (Keyboard Shortcuts)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                  Power Users
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tăng tốc độ điều hướng và thao tác nghiệp vụ tham mưu tài chính trong 1 nốt nhạc
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

        {/* Shortcuts Grid Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 custom-scrollbar">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <span className="p-1 rounded-md bg-slate-100 dark:bg-slate-800">{group.icon}</span>
                <span>{group.title}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {group.shortcuts.map((sc, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug">
                        {sc.description}
                      </p>
                      {sc.badge && (
                        <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          {sc.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {sc.keys.map((k, kIdx) => (
                        <React.Fragment key={kIdx}>
                          <kbd className="px-2 py-1 text-xs font-mono font-bold rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-xs">
                            {k}
                          </kbd>
                          {kIdx < sc.keys.length - 1 && (
                            <span className="text-[11px] text-slate-400 font-bold">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Command className="w-4 h-4 text-emerald-500" />
            <span>Mẹo: Bấm <kbd className="px-1.5 py-0.5 font-mono text-[11px] rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">{modKey}+K</kbd> bất cứ lúc nào để mở Menu tìm kiếm</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCommandPalette && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCommandPalette();
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Mở Command Palette</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
