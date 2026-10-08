import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Check,
  Clock,
  Sparkles,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import {
  DayEntry,
  DEFAULT_CATEGORIES,
  ExpenseItem,
  MoodType,
  MOOD_DEFINITIONS,
  UserSettings,
} from '../types';
import {
  formatHumanDate,
  formatLongHumanDate,
  formatMoney,
  formatTimeDisplay,
  getCurrentTimeString,
  getDayTotal,
  getRelativeDayDescription,
  getTodayDateString,
  parseDateString,
  formatDateToIso,
  getDaysInMonth,
} from '../utils/journalUtils';

interface DayPageViewProps {
  dateStr: string;
  entry?: DayEntry;
  settings: UserSettings;
  onSaveEntry: (entry: DayEntry) => void;
  onBackToDates: () => void;
  onNavigateDate: (newDateStr: string) => void;
}

export const DayPageView: React.FC<DayPageViewProps> = ({
  dateStr,
  entry,
  settings,
  onSaveEntry,
  onBackToDates,
  onNavigateDate,
}) => {
  const todayStr = getTodayDateString();
  const isToday = dateStr === todayStr;

  // Local state for the day's reflection and mood
  const [reflectionText, setReflectionText] = useState(entry?.reflection || '');
  const [selectedMood, setSelectedMood] = useState<MoodType | undefined>(entry?.mood);
  const [reflectionSavedNotice, setReflectionSavedNotice] = useState(false);

  // New expense inline form state
  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [categoryInput, setCategoryInput] = useState(DEFAULT_CATEGORIES[0]);
  const [timeInput, setTimeInput] = useState(getCurrentTimeString());

  // Editing state for an existing expense
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTime, setEditTime] = useState('');

  const amountInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);

  // Synchronize local states when date changes
  useEffect(() => {
    setReflectionText(entry?.reflection || '');
    setSelectedMood(entry?.mood);
    setAmountInput('');
    setNoteInput('');
    setTimeInput(getCurrentTimeString());
    setEditingId(null);
  }, [dateStr, entry]);

  // Handle previous & next day navigation
  const handlePrevDay = () => {
    const curDate = parseDateString(dateStr);
    curDate.setDate(curDate.getDate() - 1);
    onNavigateDate(formatDateToIso(curDate));
  };

  const handleNextDay = () => {
    const curDate = parseDateString(dateStr);
    curDate.setDate(curDate.getDate() + 1);
    onNavigateDate(formatDateToIso(curDate));
  };

  // Compute daily budget allowance
  const [curYear, curMonth] = dateStr.split('-').map(Number);
  const daysInMonth = getDaysInMonth(curYear, curMonth);
  const dailyAllowance = daysInMonth > 0 ? settings.monthlyBudget / daysInMonth : 0;
  const dayTotal = getDayTotal(entry);
  const expenses = entry?.expenses || [];

  // Update helper
  const updateCurrentEntry = (partial: Partial<DayEntry>) => {
    const updated: DayEntry = {
      date: dateStr,
      expenses: partial.expenses !== undefined ? partial.expenses : expenses,
      reflection: partial.reflection !== undefined ? partial.reflection : reflectionText,
      mood: partial.mood !== undefined ? partial.mood : selectedMood,
      updatedAt: new Date().toISOString(),
    };
    onSaveEntry(updated);
  };

  // Add new expense item with time
  const handleAddExpense = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedAmount = parseFloat(amountInput);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      if (amountInputRef.current) amountInputRef.current.focus();
      return;
    }

    const trimmedNote = noteInput.trim();
    if (!trimmedNote) {
      if (noteInputRef.current) noteInputRef.current.focus();
      return;
    }

    const newItem: ExpenseItem = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      amount: parsedAmount,
      note: trimmedNote,
      category: categoryInput,
      time: timeInput.trim() || getCurrentTimeString(),
      createdAt: new Date().toISOString(),
    };

    const newExpenses = [...expenses, newItem];
    updateCurrentEntry({ expenses: newExpenses });

    // Reset inputs
    setAmountInput('');
    setNoteInput('');
    setTimeInput(getCurrentTimeString());
    if (amountInputRef.current) amountInputRef.current.focus();
  };

  // Delete expense item
  const handleDeleteExpense = (id: string) => {
    const newExpenses = expenses.filter((e) => e.id !== id);
    updateCurrentEntry({ expenses: newExpenses });
  };

  // Start editing item
  const handleStartEdit = (item: ExpenseItem) => {
    setEditingId(item.id);
    setEditAmount(item.amount.toString());
    setEditNote(item.note);
    setEditCategory(item.category);
    setEditTime(item.time || getCurrentTimeString());
  };

  // Save edited item
  const handleSaveEdit = (id: string) => {
    const parsedAmount = parseFloat(editAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!editNote.trim()) return;

    const newExpenses = expenses.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          amount: parsedAmount,
          note: editNote.trim(),
          category: editCategory,
          time: editTime.trim() || getCurrentTimeString(),
        };
      }
      return item;
    });

    updateCurrentEntry({ expenses: newExpenses });
    setEditingId(null);
  };

  // Save reflection
  const handleReflectionChange = (val: string) => {
    setReflectionText(val);
    updateCurrentEntry({ reflection: val });
    setReflectionSavedNotice(true);
    setTimeout(() => setReflectionSavedNotice(false), 2000);
  };

  // Select mood
  const handleSelectMood = (mood: MoodType) => {
    const newMood = selectedMood === mood ? undefined : mood;
    setSelectedMood(newMood);
    updateCurrentEntry({ mood: newMood });
  };

  // Quick Zero-Spend day marker
  const handleMarkZeroSpend = () => {
    const peacefulNote = 'A calm zero-spend day. Enjoyed homemade food and peaceful rest.';
    setReflectionText((prev) => (prev ? prev : peacefulNote));
    setSelectedMood('peaceful');
    updateCurrentEntry({
      reflection: reflectionText ? reflectionText : peacefulNote,
      mood: 'peaceful',
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'Escape') {
        onBackToDates();
      } else if (e.key === 'ArrowLeft') {
        handlePrevDay();
      } else if (e.key === 'ArrowRight') {
        handleNextDay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dateStr]);

  const relativeLabel = getRelativeDayDescription(dateStr);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-4 mb-6 text-xs text-[#94A3B8]">
        <button
          onClick={onBackToDates}
          className="flex items-center gap-1.5 font-medium text-[#94A3B8] hover:text-[#F1F5F9] py-1 px-2.5 rounded-lg hover:bg-[#1E293B] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#38BDF8]" />
          <span>Back to Dates Stream</span>
          <kbd className="hidden sm:inline-block ml-1 text-[10px] bg-[#1E293B] text-[#94A3B8] px-1 py-0.5 rounded border border-[#334155]">
            Esc
          </kbd>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevDay}
            aria-label="Previous date"
            className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-[#223354] bg-[#0D1527] hover:bg-[#16233E] text-[#CBD5E1] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Earlier</span>
          </button>
          <button
            onClick={handleNextDay}
            aria-label="Next date"
            className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-[#223354] bg-[#0D1527] hover:bg-[#16233E] text-[#CBD5E1] transition-colors cursor-pointer"
          >
            <span className="hidden sm:inline">Later</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Blue-Black Journal Page */}
      <article className="blueblack-sheet rounded-3xl border border-[#1E2B45] p-6 sm:p-12 transition-all relative overflow-hidden shadow-2xl">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#1D4ED8]/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. TOP: Date header */}
        <header className="pb-8 border-b border-[#1E2B45] relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono uppercase tracking-widest text-[#38BDF8]">
                  {relativeLabel}
                </span>
                {isToday && (
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-white bg-[#2563EB] px-2 py-0.5 rounded shadow-sm">
                    Today
                  </span>
                )}
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-[#F1F5F9] mt-1.5">
                {formatLongHumanDate(dateStr)}
              </h1>
            </div>

            {/* Total spent on this date */}
            <div className="sm:text-right mt-2 sm:mt-0">
              <span className="text-xs text-[#94A3B8] block font-serif italic">
                {expenses.length === 0 ? 'No spend recorded' : 'Day total'}
              </span>
              <div className="font-serif text-2xl sm:text-3xl font-bold text-[#F1F5F9] tracking-tight">
                {expenses.length === 0 ? '—' : formatMoney(dayTotal, settings.currency)}
              </div>
            </div>
          </div>
        </header>

        {/* 2. MIDDLE: Expenses list with TIME */}
        <section className="py-8 border-b border-[#1E2B45] relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-xl font-medium text-[#F1F5F9]">
                Entries & Spending
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                What you spent and the time it occurred. The context and note are first-class.
              </p>
            </div>

            {expenses.length > 0 && (
              <span className="text-xs text-[#38BDF8] font-mono">
                {expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}
              </span>
            )}
          </div>

          {/* List of existing expenses */}
          {expenses.length === 0 ? (
            <div className="py-8 px-6 rounded-2xl bg-[#0A1020] border border-[#1E2B45] text-center my-4">
              <p className="font-serif italic text-base text-[#94A3B8]">
                "No spending written down yet for this quiet date."
              </p>
              <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
                Did you buy groceries, send M-Pesa, pay matatu fare, or have a zero-spend day?
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleMarkZeroSpend}
                  className="px-3.5 py-1.5 text-xs font-medium text-[#34D399] bg-[#064E3B]/40 hover:bg-[#064E3B]/70 border border-[#059669]/50 rounded-lg transition-colors cursor-pointer"
                >
                  🌿 Mark as calm KSh 0 day
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {expenses.map((item) => (
                <div
                  key={item.id}
                  className="group relative p-4 rounded-xl border border-[#1E2B45] bg-[#0A1020]/70 hover:border-[#3B82F6]/50 hover:bg-[#0E172E] transition-all"
                >
                  {editingId === item.id ? (
                    // Inline Edit Form with TIME
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-3">
                          <label className="text-[10px] uppercase font-bold text-[#94A3B8]">Amount (KSh)</label>
                          <input
                            type="number"
                            step="1"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-full mt-1 px-3 py-1.5 rounded-lg border border-[#334155] bg-[#080D1A] text-sm text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="text-[10px] uppercase font-bold text-[#94A3B8]">Time Changed</label>
                          <input
                            type="time"
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                            className="w-full mt-1 px-3 py-1.5 rounded-lg border border-[#334155] bg-[#080D1A] text-xs text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="text-[10px] uppercase font-bold text-[#94A3B8]">Category</label>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="w-full mt-1 px-3 py-1.5 rounded-lg border border-[#334155] bg-[#080D1A] text-xs text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                          >
                            {DEFAULT_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-12">
                          <label className="text-[10px] uppercase font-bold text-[#94A3B8]">The Story / Note</label>
                          <input
                            type="text"
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            className="w-full mt-1 px-3 py-1.5 rounded-lg border border-[#334155] bg-[#080D1A] text-sm text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 text-xs text-[#94A3B8] hover:bg-[#1E293B] rounded-md"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="px-3 py-1 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-md"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display Row with prominent TIME badge
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2.5 flex-wrap">
                          {/* Time display */}
                          {item.time && (
                            <span className="text-xs font-mono text-[#38BDF8] bg-[#0C2449] border border-[#1E3A8A] px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3 text-[#38BDF8]" />
                              {formatTimeDisplay(item.time)}
                            </span>
                          )}

                          {/* The First-Class Diary Note */}
                          <p className="text-base text-[#F1F5F9] font-normal leading-relaxed">
                            {item.note}
                          </p>
                        </div>

                        {/* Category & Details */}
                        <div className="flex items-center gap-2 text-xs text-[#94A3B8] mt-1.5">
                          <span className="font-medium text-[#CBD5E1]">{item.category}</span>
                          <span aria-hidden="true" className="text-[#475569]">·</span>
                          <span>{formatMoney(item.amount, settings.currency)}</span>
                        </div>
                      </div>

                      {/* Right side: Amount and actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0">
                        <span className="font-serif text-lg font-bold text-[#F1F5F9]">
                          {formatMoney(item.amount, settings.currency)}
                        </span>

                        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(item)}
                            title="Edit entry"
                            aria-label="Edit entry"
                            className="p-1.5 text-[#94A3B8] hover:text-[#38BDF8] hover:bg-[#1E293B] rounded-md transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(item.id)}
                            title="Delete entry"
                            aria-label="Delete entry"
                            className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#450A0A] rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Inline Fast Add Form WITH TIME */}
          <div className="rounded-2xl border border-[#1E2B45] bg-[#0A1020] p-4 sm:p-5 mt-4 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#38BDF8] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Add an expense with time & story
              </span>
              <span className="text-[11px] text-[#64748B] font-mono hidden sm:inline">
                Enter saves quickly
              </span>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3">
                {/* Amount */}
                <div className="sm:col-span-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#38BDF8]">
                      {settings.currency}
                    </span>
                    <input
                      ref={amountInputRef}
                      type="number"
                      step="1"
                      placeholder="0"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="w-full pl-12 pr-3 py-2 text-base font-semibold rounded-xl border border-[#223354] bg-[#080D1A] text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                    />
                  </div>
                </div>

                {/* Time field */}
                <div className="sm:col-span-2">
                  <div className="relative">
                    <input
                      type="time"
                      value={timeInput}
                      onChange={(e) => setTimeInput(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs font-mono font-medium rounded-xl border border-[#223354] bg-[#080D1A] text-[#38BDF8] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Note / The story */}
                <div className="sm:col-span-4">
                  <input
                    ref={noteInputRef}
                    type="text"
                    placeholder="e.g. Spent KSh 450 on lunch — stressed about the deadline"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#223354] bg-[#080D1A] text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* Category */}
                <div className="sm:col-span-3">
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#223354] bg-[#080D1A] text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer"
                  >
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit button row */}
              <div className="flex items-center justify-between pt-1">
                {/* Category quick suggestions */}
                <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto py-1">
                  {DEFAULT_CATEGORIES.slice(0, 4).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategoryInput(c)}
                      className={`text-[11px] px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        categoryInput === c
                          ? 'bg-[#1D4ED8] text-white font-medium'
                          : 'text-[#94A3B8] hover:bg-[#1E293B]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!amountInput || !noteInput}
                  className="w-full sm:w-auto ml-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Write Entry</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* 3. BOTTOM: Headspace tag + Reflection box + Savings backdrop */}
        <section className="pt-8 space-y-8 relative z-10">
          {/* Headspace / Mood tag */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="font-serif text-lg font-medium text-[#F1F5F9] block">
                  Today’s Headspace & Tone
                </label>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Surfaces patterns later ("I overspend on days I mark as stressed").
                </p>
              </div>

              {selectedMood && (
                <button
                  onClick={() => handleSelectMood(selectedMood)}
                  className="text-xs text-[#94A3B8] hover:text-[#38BDF8] underline transition-colors cursor-pointer"
                >
                  Clear tag
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {(Object.keys(MOOD_DEFINITIONS) as MoodType[]).map((mKey) => {
                const def = MOOD_DEFINITIONS[mKey];
                const isSelected = selectedMood === mKey;
                return (
                  <button
                    key={mKey}
                    type="button"
                    onClick={() => handleSelectMood(mKey)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#3B82F6] bg-[#1E3A8A]/40 shadow-md ring-1 ring-[#38BDF8]'
                        : 'border-[#1E2B45] bg-[#0A1020] hover:border-[#334155] hover:bg-[#0E172E]'
                    }`}
                  >
                    <span className="text-lg select-none">{def.symbol}</span>
                    <div className="min-w-0">
                      <div className={`text-xs font-medium leading-none ${isSelected ? 'text-[#38BDF8]' : 'text-[#F1F5F9]'}`}>
                        {def.label}
                      </div>
                      <div className="text-[10px] text-[#64748B] truncate mt-1">
                        {def.description.split(',')[0]}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reflection Box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="reflection-textarea" className="font-serif text-lg font-medium text-[#F1F5F9]">
                Daily Reflection
              </label>
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                {reflectionSavedNotice && (
                  <span className="text-[#34D399] flex items-center gap-1 font-serif italic">
                    <Check className="w-3 h-3" /> Saved to page
                  </span>
                )}
                <span className="font-serif italic">Auto-saves as you type</span>
              </div>
            </div>

            <p className="text-xs text-[#94A3B8] mb-2">
              How was your day? What thoughts were behind the money decisions?
            </p>

            <textarea
              id="reflection-textarea"
              rows={4}
              value={reflectionText}
              onChange={(e) => handleReflectionChange(e.target.value)}
              placeholder="Write freely here. Notes about conversations, feelings, or why you chose to spend or hold back..."
              className="w-full p-4 rounded-2xl border border-[#223354] bg-[#0A1020] text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] leading-relaxed resize-y font-normal"
            />
          </div>

          {/* Quiet Budget & Planned Savings Context */}
          <div className="rounded-2xl border border-[#1E3A8A] bg-[#0B1736] p-5 sm:p-6 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#38BDF8] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
                  Planned Savings & Daily Context
                </span>
                <div className="font-serif text-lg sm:text-xl font-medium text-[#F1F5F9] mt-1">
                  {formatMoney(dayTotal, settings.currency)} today · {formatMoney(dailyAllowance, settings.currency)}/day allowance
                </div>
              </div>

              {/* Gentle evaluation */}
              <div className="text-xs sm:text-sm text-[#94A3B8] sm:max-w-xs font-normal">
                {dayTotal === 0 ? (
                  <p>A quiet no-spend day. Your planned savings target of <strong className="text-[#38BDF8]">{formatMoney(settings.plannedSavings, settings.currency)}</strong> is comfortably safe.</p>
                ) : dayTotal <= dailyAllowance ? (
                  <p>Within your daily spending share. Your planned monthly savings stay fully on track.</p>
                ) : (
                  <p>Higher than daily pace today, but balanced by quieter days this month.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </article>

      {/* Bottom Navigation */}
      <footer className="mt-6 flex items-center justify-between text-xs text-[#64748B] px-2">
        <button
          onClick={handlePrevDay}
          className="hover:text-[#F1F5F9] transition-colors cursor-pointer flex items-center gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Earlier Date</span>
        </button>

        <span className="font-mono text-[11px]">Use ← and → arrow keys to flip dates</span>

        <button
          onClick={handleNextDay}
          className="hover:text-[#F1F5F9] transition-colors cursor-pointer flex items-center gap-1"
        >
          <span>Later Date</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </footer>
    </div>
  );
};
