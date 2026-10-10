import React, { useState } from 'react';
import { Sparkles, AlertTriangle, ShieldCheck, Tag, Filter } from 'lucide-react';
import { useTheme } from '../lib/theme';

interface SentimentKeywordHighlighterProps {
  text: string;
  positiveKeywords?: string[];
  negativeKeywords?: string[];
  mofDomainKeywords?: string[];
  highlightFilter?: 'all' | 'positive' | 'negative' | 'mof';
}

interface MatchSpan {
  start: number;
  end: number;
  word: string;
  category: 'positive' | 'negative' | 'mof';
}

export const SentimentKeywordHighlighter: React.FC<SentimentKeywordHighlighterProps> = ({
  text,
  positiveKeywords = [],
  negativeKeywords = [],
  mofDomainKeywords = [],
  highlightFilter: initialFilter = 'all'
}) => {
  const { isDark } = useTheme();
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'mof'>(initialFilter);
  const [selectedWord, setSelectedWord] = useState<{ word: string; category: string } | null>(null);

  if (!text) return null;

  // Build match spans
  const spans: MatchSpan[] = [];
  const lowerText = text.toLowerCase();

  const addMatches = (keywords: string[], category: 'positive' | 'negative' | 'mof') => {
    keywords.forEach(kw => {
      if (!kw || kw.trim().length === 0) return;
      const lowerKw = kw.toLowerCase();
      let startIndex = 0;
      while ((startIndex = lowerText.indexOf(lowerKw, startIndex)) !== -1) {
        const endIndex = startIndex + lowerKw.length;
        // avoid duplicate overlapping spans
        const isOverlapping = spans.some(s => 
          (startIndex >= s.start && startIndex < s.end) || 
          (endIndex > s.start && endIndex <= s.end)
        );
        if (!isOverlapping) {
          spans.push({
            start: startIndex,
            end: endIndex,
            word: text.substring(startIndex, endIndex),
            category
          });
        }
        startIndex += lowerKw.length;
      }
    });
  };

  if (filter === 'all' || filter === 'positive') addMatches(positiveKeywords, 'positive');
  if (filter === 'all' || filter === 'negative') addMatches(negativeKeywords, 'negative');
  if (filter === 'all' || filter === 'mof') addMatches(mofDomainKeywords, 'mof');

  // Sort spans by start index
  spans.sort((a, b) => a.start - b.start);

  // Split text according to spans
  const renderedElements: React.ReactNode[] = [];
  let lastIndex = 0;

  spans.forEach((span, idx) => {
    if (span.start > lastIndex) {
      renderedElements.push(
        <span key={`text-${lastIndex}`}>{text.substring(lastIndex, span.start)}</span>
      );
    }

    const isPos = span.category === 'positive';
    const isNeg = span.category === 'negative';
    const isMof = span.category === 'mof';

    renderedElements.push(
      <mark
        key={`span-${span.start}-${idx}`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedWord({ word: span.word, category: span.category });
        }}
        title={`Từ khóa: ${span.word} (${isPos ? 'Tích cực / Điểm sáng' : isNeg ? 'Tiêu cực / Rủi ro' : 'Nghiệp vụ BTC'})`}
        className={`px-1.5 py-0.5 mx-0.5 rounded cursor-pointer font-bold inline-flex items-center gap-1 transition shadow-xs ${
          isPos
            ? isDark
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900/90'
              : 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
            : isNeg
            ? isDark
              ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 hover:bg-rose-900/90'
              : 'bg-rose-100 text-rose-900 border border-rose-300 hover:bg-rose-200'
            : isDark
            ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50 hover:bg-amber-900/90'
            : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
        }`}
      >
        {isPos && <Sparkles className="w-3 h-3 text-emerald-500 inline-block shrink-0" />}
        {isNeg && <AlertTriangle className="w-3 h-3 text-rose-500 inline-block shrink-0" />}
        {isMof && <ShieldCheck className="w-3 h-3 text-amber-500 inline-block shrink-0" />}
        <span>{span.word}</span>
      </mark>
    );

    lastIndex = span.end;
  });

  if (lastIndex < text.length) {
    renderedElements.push(
      <span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs pb-1 border-b border-slate-700/30">
        <div className="flex items-center gap-1.5 font-bold text-slate-300">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          <span>Bộ lọc từ khóa highlight:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition border ${
              filter === 'all'
                ? isDark
                  ? 'bg-indigo-600 text-white border-indigo-400'
                  : 'bg-indigo-600 text-white border-indigo-600'
                : isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
          >
            Tất cả ({positiveKeywords.length + negativeKeywords.length + mofDomainKeywords.length})
          </button>
          {positiveKeywords.length > 0 && (
            <button
              type="button"
              onClick={() => setFilter('positive')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition border flex items-center gap-1 ${
                filter === 'positive'
                  ? isDark
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-emerald-700 text-white border-emerald-700'
                  : isDark
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span>🟢 Tích cực</span>
              <span className="font-mono font-bold">({positiveKeywords.length})</span>
            </button>
          )}
          {negativeKeywords.length > 0 && (
            <button
              type="button"
              onClick={() => setFilter('negative')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition border flex items-center gap-1 ${
                filter === 'negative'
                  ? isDark
                    ? 'bg-rose-600 text-white border-rose-400'
                    : 'bg-rose-700 text-white border-rose-700'
                  : isDark
                  ? 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/60'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span>🔴 Rủi ro / Tiêu cực</span>
              <span className="font-mono font-bold">({negativeKeywords.length})</span>
            </button>
          )}
          {mofDomainKeywords.length > 0 && (
            <button
              type="button"
              onClick={() => setFilter('mof')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition border flex items-center gap-1 ${
                filter === 'mof'
                  ? isDark
                    ? 'bg-amber-600 text-white border-amber-400'
                    : 'bg-amber-600 text-white border-amber-600'
                  : isDark
                  ? 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span>🟡 Nghiệp vụ MoF</span>
              <span className="font-mono font-bold">({mofDomainKeywords.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Rendered highlighted text body */}
      <div
        className={`text-sm leading-relaxed p-4 rounded-xl border font-normal whitespace-pre-line ${
          isDark
            ? 'bg-slate-900/70 border-slate-700/70 text-slate-200'
            : 'bg-slate-50/80 border-slate-200 text-slate-900'
        }`}
      >
        {renderedElements}
      </div>

      {/* Selected word helper badge */}
      {selectedWord && (
        <div
          className={`p-2.5 rounded-lg border flex items-center justify-between text-xs animate-in fade-in ${
            selectedWord.category === 'positive'
              ? isDark ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : selectedWord.category === 'negative'
              ? isDark ? 'bg-rose-950/60 border-rose-700/50 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-900'
              : isDark ? 'bg-amber-950/60 border-amber-700/50 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            <span>
              Từ khóa đã chọn: <strong>&ldquo;{selectedWord.word}&rdquo;</strong> — Phân loại:{' '}
              {selectedWord.category === 'positive'
                ? 'Đóng góp điểm tích cực (+) cho chỉ số cảm xúc'
                : selectedWord.category === 'negative'
                ? 'Đóng góp điểm rủi ro (-) làm hạ điểm cảm xúc'
                : 'Thực thể / Thuật ngữ pháp lý quản lý của BTC'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedWord(null)}
            className="text-xs underline hover:opacity-80 ml-2"
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  );
};
