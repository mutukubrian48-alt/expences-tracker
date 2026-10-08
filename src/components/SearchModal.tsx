import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Calendar, ArrowRight, Clock } from 'lucide-react';
import { DayEntry, ExpenseItem, MOOD_DEFINITIONS } from '../types';
import { formatHumanDate, formatMoney, formatTimeDisplay } from '../utils/journalUtils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: Record<string, DayEntry>;
  currency: string;
  onSelectResultDate: (dateStr: string) => void;
}

interface SearchResult {
  date: string;
  type: 'expense' | 'reflection';
  snippet: string;
  amount?: number;
  category?: string;
  time?: string;
  mood?: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  entries,
  currency,
  onSelectResultDate,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();
  const results: SearchResult[] = [];

  if (trimmed.length > 0) {
    Object.values(entries).forEach((day) => {
      // Search in reflection
      if (day.reflection && day.reflection.toLowerCase().includes(trimmed)) {
        results.push({
          date: day.date,
          type: 'reflection',
          snippet: day.reflection,
          mood: day.mood ? MOOD_DEFINITIONS[day.mood]?.label : undefined,
        });
      }

      // Search in expenses
      day.expenses?.forEach((exp) => {
        if (
          exp.note?.toLowerCase().includes(trimmed) ||
          exp.category?.toLowerCase().includes(trimmed) ||
          exp.amount.toString().includes(trimmed) ||
          (exp.time && exp.time.includes(trimmed))
        ) {
          results.push({
            date: day.date,
            type: 'expense',
            snippet: exp.note,
            amount: exp.amount,
            category: exp.category,
            time: exp.time,
            mood: day.mood ? MOOD_DEFINITIONS[day.mood]?.label : undefined,
          });
        }
      });
    });

    results.sort((a, b) => b.date.localeCompare(a.date));
  }

  const highlightMatch = (text: string, q: string) => {
    if (!q) return text;
    const parts = text.split(new RegExp(`(${q})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === q.toLowerCase() ? (
            <mark key={i} className="bg-[#1D4ED8] text-[#93C5FD] px-1 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#030712]/80 backdrop-blur-md">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#0D1527] rounded-3xl shadow-2xl border border-[#223354] overflow-hidden z-10">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-[#1E2B45] bg-[#0A1020]">
          <Search className="w-5 h-5 text-[#38BDF8]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, M-Pesa, matatu, food, feelings..."
            className="w-full text-base bg-transparent text-[#F1F5F9] placeholder-[#64748B] focus:outline-none font-serif"
          />
          <button
            onClick={onClose}
            className="p-1 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1E293B] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 divide-y divide-[#1A263E]">
          {trimmed.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#94A3B8]">
              <p className="font-serif italic text-sm text-[#CBD5E1]">
                "When did I buy groceries?" or "matatu to town"
              </p>
              <p className="mt-1 text-[#64748B]">
                Type keywords from your entries, feelings, or notes to jump directly to that date.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#94A3B8]">
              <p className="font-serif italic text-sm text-[#CBD5E1]">
                No journal records matching "{query}"
              </p>
              <p className="mt-1 text-[#64748B]">
                Try another phrase or keyword from your diary notes.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#38BDF8] pb-2">
                Found {results.length} {results.length === 1 ? 'match' : 'matches'}
              </div>

              {results.map((res, index) => (
                <button
                  key={`${res.date}-${index}`}
                  onClick={() => {
                    onSelectResultDate(res.date);
                    onClose();
                  }}
                  className="w-full text-left p-3.5 rounded-xl border border-transparent hover:border-[#223354] hover:bg-[#111C35] transition-all group cursor-pointer flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-[#94A3B8] mb-1">
                      <span className="font-serif font-medium text-[#F1F5F9]">
                        {formatHumanDate(res.date)}
                      </span>
                      {res.time && (
                        <>
                          <span>·</span>
                          <span className="text-[#38BDF8] font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#38BDF8]" />
                            {formatTimeDisplay(res.time)}
                          </span>
                        </>
                      )}
                      {res.category && (
                        <>
                          <span>·</span>
                          <span>{res.category}</span>
                        </>
                      )}
                      {res.type === 'reflection' && (
                        <>
                          <span>·</span>
                          <span className="italic font-serif text-[#94A3B8]">Daily Reflection</span>
                        </>
                      )}
                    </div>

                    <p className="text-sm text-[#CBD5E1] line-clamp-2 leading-relaxed">
                      {highlightMatch(res.snippet, trimmed)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {res.amount !== undefined && (
                      <span className="font-serif text-sm font-bold text-[#F1F5F9]">
                        {formatMoney(res.amount, currency)}
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-[#475569] group-hover:text-[#38BDF8] transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
