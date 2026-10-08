import React from 'react';
import {
  BookOpen,
  Calendar,
  Flame,
  Search,
  SlidersHorizontal,
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
  Edit2,
  PiggyBank,
} from 'lucide-react';
import { ActiveView } from '../types';
import { formatMoney, getTodayDateString } from '../utils/journalUtils';

interface HeaderNavProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView, date?: string) => void;
  streakCount: number;
  cateredForMonth: number;
  actualSavedAtEndOfMonth: number;
  dailyAllowance: number;
  plannedSavings: number;
  currentMonthName: string;
  currency: string;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenEditCatered: () => void;
  selectedDate: string;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentView,
  onNavigate,
  streakCount,
  cateredForMonth,
  actualSavedAtEndOfMonth,
  dailyAllowance,
  plannedSavings,
  currentMonthName,
  currency,
  onOpenSearch,
  onOpenSettings,
  onOpenEditCatered,
  selectedDate,
}) => {
  const todayStr = getTodayDateString();

  return (
    <header className="border-b border-[#1E2B45] bg-[#080D1A]/95 backdrop-blur-md sticky top-0 z-30 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <button
                onClick={() => onNavigate('dates')}
                className="text-left group cursor-pointer focus-visible:outline-none"
              >
                <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#F1F5F9] group-hover:text-[#38BDF8] transition-colors">
                  Budget Expenses
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-mono text-[#38BDF8]">
                  KES Spending & Savings
                </span>
              </button>
            </div>

            {/* Mobile streak & search */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={onOpenEditCatered}
                title="Edit catered amount"
                className="p-2 text-[#38BDF8] hover:bg-[#1E293B] rounded-lg transition-colors cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenSearch}
                aria-label="Search diary notes"
                className="p-2 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1E293B] rounded-lg transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenSettings}
                aria-label="Settings"
                className="p-2 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1E293B] rounded-lg transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Catered for Month & Saved at End of Month */}
          <div className="hidden lg:flex items-center gap-2.5 text-xs text-[#94A3B8] bg-[#0D1527] px-3.5 py-1.5 rounded-xl border border-[#1E2B45]">
            <button
              onClick={onOpenEditCatered}
              className="flex items-center gap-1.5 text-[#38BDF8] hover:text-[#60A5FA] font-semibold cursor-pointer group"
              title="Click to edit catered amount for this month"
            >
              <span>{currentMonthName} Catered: {formatMoney(cateredForMonth, currency)}</span>
              <Edit2 className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
            <span className="text-[#334155]">·</span>
            <span className="flex items-center gap-1 text-[#34D399] font-medium">
              <PiggyBank className="w-3.5 h-3.5" />
              Saved at month end: <strong className="font-bold">{formatMoney(actualSavedAtEndOfMonth, currency)}</strong>
            </span>
            <span className="text-[#334155]">·</span>
            <span className="text-[#94A3B8]">{formatMoney(dailyAllowance, currency)}/day</span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Streak Pill */}
            <div
              title={`${streakCount} consecutive dates recorded in your journal`}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#F59E0B] bg-[#451A03]/50 border border-[#78350F]/70 rounded-lg"
            >
              <Flame className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
              <span>{streakCount}d streak</span>
            </div>

            {/* View Tabs */}
            <nav className="flex items-center gap-1 bg-[#0D1527] p-1 rounded-xl border border-[#1E2B45]" aria-label="Views">
              <button
                onClick={() => onNavigate('dates')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  currentView === 'dates'
                    ? 'bg-[#2563EB] text-white shadow-md'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Dates</span>
              </button>

              <button
                onClick={() => onNavigate('excel')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  currentView === 'excel'
                    ? 'bg-[#2563EB] text-white shadow-md'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
                title="Excel shopping budget sheet with variance balance"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel Sheet</span>
              </button>

              <button
                onClick={() => onNavigate('day', todayStr)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  currentView === 'day' && selectedDate === todayStr
                    ? 'bg-[#2563EB] text-white shadow-md'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Today</span>
              </button>

              <button
                onClick={() => onNavigate('summary')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  currentView === 'summary'
                    ? 'bg-[#2563EB] text-white shadow-md'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Summary & Savings</span>
              </button>
            </nav>

            {/* Search */}
            <button
              onClick={onOpenSearch}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#94A3B8] hover:text-[#F1F5F9] bg-[#0D1527] hover:bg-[#1E293B] border border-[#1E2B45] rounded-lg transition-colors cursor-pointer"
              title="Search notes (Press /)"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="hidden md:flex items-center p-1.5 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1E293B] border border-[#1E2B45] rounded-lg transition-colors cursor-pointer"
              title="Settings"
              aria-label="Settings"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Context */}
        <div className="mt-2 pt-2 border-t border-[#1E2B45] flex items-center justify-between text-xs text-[#94A3B8] lg:hidden">
          <button
            onClick={onOpenEditCatered}
            className="flex items-center gap-1 text-[#38BDF8] underline font-medium"
          >
            <span>Catered: {formatMoney(cateredForMonth, currency)}</span>
            <Edit2 className="w-3 h-3" />
          </button>
          <span>Saved: <strong className="text-[#34D399]">{formatMoney(actualSavedAtEndOfMonth, currency)}</strong></span>
        </div>
      </div>
    </header>
  );
};
