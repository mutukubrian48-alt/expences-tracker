import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck,
  Trash2,
  FileSpreadsheet,
  Edit2,
  PiggyBank,
  CheckCircle2,
} from 'lucide-react';
import { DayEntry, MOOD_DEFINITIONS, UserSettings } from '../types';
import {
  formatHumanDate,
  formatLongHumanDate,
  formatMoney,
  formatTimeDisplay,
  getDayTotal,
  getMonthName,
  getRelativeDayDescription,
  getTodayDateString,
} from '../utils/journalUtils';

interface DatesStreamViewProps {
  entries: Record<string, DayEntry>;
  settings: UserSettings;
  cateredForMonth: number;
  actualSavedAtEndOfMonth: number;
  monthName: string;
  onSelectDate: (dateStr: string) => void;
  onDeleteDate: (dateStr: string) => void;
  onOpenSummary: () => void;
  onOpenExcel: () => void;
  onOpenSearch: () => void;
  onOpenEditCatered: () => void;
}

export const DatesStreamView: React.FC<DatesStreamViewProps> = ({
  entries,
  settings,
  cateredForMonth,
  actualSavedAtEndOfMonth,
  monthName,
  onSelectDate,
  onDeleteDate,
  onOpenSummary,
  onOpenExcel,
  onOpenSearch,
  onOpenEditCatered,
}) => {
  const todayStr = getTodayDateString();
  const [customDateInput, setCustomDateInput] = useState(todayStr);
  const [confirmDeleteDate, setConfirmDeleteDate] = useState<string | null>(null);

  // All known dates sorted descending
  const allDateKeys = Array.from(
    new Set([...Object.keys(entries), todayStr])
  ).sort((a, b) => b.localeCompare(a));

  const totalSpentAll = Object.values(entries).reduce(
    (sum, e) => sum + getDayTotal(e),
    0
  );

  const handleAddOrGoToDate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (customDateInput) {
      onSelectDate(customDateInput);
    }
  };

  const handleDeleteConfirmed = (e: React.MouseEvent, dateKey: string) => {
    e.stopPropagation();
    onDeleteDate(dateKey);
    setConfirmDeleteDate(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Blue-Black Planned Savings & Monthly Catered Fund Overview */}
      <div className="blueblack-sheet rounded-3xl p-6 sm:p-8 border border-[#1E2B45] relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#1D4ED8]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#38BDF8]">
              <PiggyBank className="w-4 h-4 text-[#38BDF8]" />
              <span>{monthName} Monthly Catered Fund & End-of-Month Savings</span>
            </div>

            {/* Catered amount with quick edit */}
            <div className="flex items-baseline gap-3 mt-2 flex-wrap">
              <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#F1F5F9]">
                Catered Fund:{' '}
                <span className="text-[#38BDF8] font-bold">
                  {formatMoney(cateredForMonth, settings.currency)}
                </span>
              </h1>
              <button
                onClick={onOpenEditCatered}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#1E293B] hover:bg-[#2A3852] text-[#93C5FD] border border-[#334155] transition-colors cursor-pointer"
                title="Edit catered amount for this month"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Catered</span>
              </button>
            </div>

            {/* What you have saved at the end of the month */}
            <div className="mt-4 p-4 rounded-2xl bg-[#09152B] border border-[#1E3A8A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono uppercase text-[#94A3B8] block">
                  What You Have Saved at End of {monthName}
                </span>
                <div className="font-serif text-2xl sm:text-3xl font-bold text-[#34D399] mt-0.5">
                  {formatMoney(actualSavedAtEndOfMonth, settings.currency)} Saved
                </div>
              </div>
              <div className="text-xs text-[#93C5FD] sm:text-right">
                <span className="block text-[11px] text-[#64748B]">
                  Formula: {formatMoney(cateredForMonth, settings.currency)} Catered - {formatMoney(totalSpentAll, settings.currency)} Spent
                </span>
                <span className="font-medium text-[#34D399] flex items-center sm:justify-end gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Target: {formatMoney(settings.plannedSavings, settings.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={onOpenExcel}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-[#0D1527] hover:bg-[#1E293B] border border-[#223354] text-[#CBD5E1] transition-all cursor-pointer shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#38BDF8]" />
              <span>Excel Budget</span>
            </button>

            <button
              onClick={onOpenSummary}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl bg-[#1D4ED8] hover:bg-[#2563EB] text-white shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#93C5FD]" />
              <span>Summary & Cycle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Picker & Quick Add Bar */}
      <div className="blueblack-card rounded-2xl p-4 sm:p-5 border border-[#223354] shadow-md">
        <form onSubmit={handleAddOrGoToDate} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#60A5FA]" />
            <span className="text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider">
              Add or Open Date
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <input
              type="date"
              value={customDateInput}
              onChange={(e) => setCustomDateInput(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-[#0A1020] border border-[#223354] text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer"
            />

            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add / Open Date</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectDate(todayStr)}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-[#223354] text-[#93C5FD] transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>
        </form>
      </div>

      {/* Daily Dates List with Add & Delete */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-serif text-xl font-medium text-[#F1F5F9]">
            Daily Diary Dates
          </h2>
          <span className="text-xs text-[#64748B]">
            {allDateKeys.length} {allDateKeys.length === 1 ? 'date' : 'dates'} recorded
          </span>
        </div>

        <div className="space-y-3">
          {allDateKeys.map((dateKey) => {
            const entry = entries[dateKey];
            const isToday = dateKey === todayStr;
            const dayTotal = getDayTotal(entry);
            const expenses = entry?.expenses || [];
            const mood = entry?.mood ? MOOD_DEFINITIONS[entry.mood] : null;
            const relative = getRelativeDayDescription(dateKey);
            const isConfirmingDelete = confirmDeleteDate === dateKey;

            return (
              <div
                key={dateKey}
                onClick={() => onSelectDate(dateKey)}
                className={`group blueblack-sheet rounded-2xl p-5 border transition-all duration-150 cursor-pointer hover:border-[#3B82F6]/70 hover:shadow-lg hover:shadow-blue-950/40 relative overflow-hidden ${
                  isToday
                    ? 'border-[#3B82F6] bg-[#0E172E]'
                    : 'border-[#1E2B45] hover:bg-[#0F182C]'
                }`}
              >
                {/* Header row of date card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1A263E]">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-lg sm:text-xl font-medium text-[#F1F5F9] group-hover:text-[#60A5FA] transition-colors">
                      {formatLongHumanDate(dateKey)}
                    </span>
                    <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#16233B] text-[#94A3B8]">
                      {relative}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#1D4ED8] text-white">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Day total, mood & delete action */}
                  <div className="flex items-center gap-3">
                    {mood && (
                      <span className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${mood.colorClass}`}>
                        <span>{mood.symbol}</span>
                        <span>{mood.label}</span>
                      </span>
                    )}

                    <div className="text-right">
                      <span className="font-serif text-lg sm:text-xl font-bold text-[#F1F5F9]">
                        {expenses.length === 0 ? '—' : formatMoney(dayTotal, settings.currency)}
                      </span>
                    </div>

                    {/* Delete Date Button */}
                    {!isToday && (
                      <div onClick={(e) => e.stopPropagation()} className="relative ml-1">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 bg-[#450A0A] p-1 rounded-lg border border-[#7F1D1D] text-xs">
                            <button
                              onClick={(e) => handleDeleteConfirmed(e, dateKey)}
                              className="px-2 py-0.5 rounded bg-[#DC2626] text-white font-semibold text-[10px]"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteDate(null)}
                              className="px-1 text-[#CBD5E1] text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteDate(dateKey)}
                            title="Delete this date"
                            className="p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-[#450A0A] rounded-lg transition-colors opacity-60 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Body: Reflection or list of expenses with TIME */}
                <div className="pt-3 space-y-2">
                  {entry?.reflection && (
                    <p className="font-serif italic text-xs sm:text-sm text-[#94A3B8] line-clamp-2 bg-[#0A1020]/70 p-2.5 rounded-xl border border-[#172238]">
                      "{entry.reflection}"
                    </p>
                  )}

                  {expenses.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      {expenses.slice(0, 3).map((exp) => (
                        <div
                          key={exp.id}
                          className="flex items-baseline justify-between gap-3 text-xs text-[#CBD5E1] bg-[#0A1020]/50 px-3 py-2 rounded-lg border border-[#162238]"
                        >
                          <div className="flex items-baseline gap-2 min-w-0">
                            {exp.time && (
                              <span className="text-[11px] font-mono text-[#38BDF8] shrink-0 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#38BDF8]" />
                                {formatTimeDisplay(exp.time)}
                              </span>
                            )}
                            <span className="font-medium text-[#F1F5F9] truncate">
                              {exp.note}
                            </span>
                            <span className="text-[10px] text-[#64748B] hidden sm:inline">
                              · {exp.category}
                            </span>
                          </div>

                          <span className="font-serif font-semibold text-[#F1F5F9] shrink-0">
                            {formatMoney(exp.amount, settings.currency)}
                          </span>
                        </div>
                      ))}

                      {expenses.length > 3 && (
                        <p className="text-[11px] text-[#64748B] text-right font-serif italic">
                          +{expenses.length - 3} more entries on this date
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-[#64748B] flex items-center justify-between pt-1">
                      <span className="font-serif italic">
                        {entry?.reflection
                          ? 'Zero-spend recorded for this day.'
                          : 'No spending or notes written down yet.'}
                      </span>
                      <span className="text-[#38BDF8] group-hover:translate-x-1 transition-transform flex items-center gap-1 font-medium">
                        Open page <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
