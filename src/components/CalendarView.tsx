import React from 'react';
import { ChevronLeft, ChevronRight, PenLine, Sparkles, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { DayEntry, MOOD_DEFINITIONS, UserSettings } from '../types';
import {
  formatMoney,
  getDayTotal,
  getMonthName,
  getTodayDateString,
  isEntryActive,
  parseDateString,
  formatHumanDate,
} from '../utils/journalUtils';

interface CalendarViewProps {
  currentYear: number;
  currentMonth: number;
  onMonthChange: (year: number, month: number) => void;
  entries: Record<string, DayEntry>;
  settings: UserSettings;
  onSelectDay: (dateStr: string) => void;
  onOpenWrapup: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentYear,
  currentMonth,
  onMonthChange,
  entries,
  settings,
  onSelectDay,
  onOpenWrapup,
}) => {
  const todayStr = getTodayDateString();
  const [todayYear, todayMonthNum] = todayStr.split('-').map(Number);
  const isViewingCurrentMonth = currentYear === todayYear && currentMonth === todayMonthNum;

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      onMonthChange(currentYear - 1, 12);
    } else {
      onMonthChange(currentYear, currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      onMonthChange(currentYear + 1, 1);
    } else {
      onMonthChange(currentYear, currentMonth + 1);
    }
  };

  const handleJumpToToday = () => {
    onMonthChange(todayYear, todayMonthNum);
  };

  // Build calendar matrix
  // 1 = Monday ... 7 = Sunday or 0 = Sunday
  // Let's use Monday-first layout for journals (standard diary layout)
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  
  // getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
  // In Monday-first: Monday is 0, Sunday is 6
  let startingDayOffset = firstDayOfMonth.getDay() - 1;
  if (startingDayOffset === -1) startingDayOffset = 6; // Sunday becomes index 6

  const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();

  // Calculate monthly metrics for quiet backdrop
  let monthTotalSpent = 0;
  let loggedDaysCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const e = entries[dStr];
    if (e) {
      const tot = getDayTotal(e);
      monthTotalSpent += tot;
      if (isEntryActive(e)) {
        loggedDaysCount++;
      }
    }
  }

  const remainingBudget = settings.monthlyBudget - monthTotalSpent;
  const monthName = getMonthName(currentMonth);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Calendar Header with Paper Book Feel */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#EFE9DC] shadow-sm p-6 sm:p-8 mb-8 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F0ECE1]">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#2C2621]">
                {monthName} <span className="text-[#8C8071] font-normal">{currentYear}</span>
              </h1>
              {!isViewingCurrentMonth && (
                <button
                  onClick={handleJumpToToday}
                  className="px-2.5 py-1 text-xs font-serif italic text-[#8C4A2F] hover:bg-[#F7EBE3] rounded border border-[#E6D4C7] transition-colors cursor-pointer"
                >
                  Return to today
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-[#7A6F62] font-normal">
              Each day is an open page. Click any day to read notes or add what you spent.
            </p>
          </div>

          {/* Month Stepper & Wrap-up link */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center rounded-lg border border-[#E4DCcb] bg-[#FAF7F0] p-0.5">
              <button
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="p-2 text-[#6C6256] hover:text-[#2C2621] hover:bg-[#EFE9DC] rounded-md transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-medium text-[#4D453C]">
                {monthName.slice(0, 3)}
              </span>
              <button
                onClick={handleNextMonth}
                aria-label="Next month"
                className="p-2 text-[#6C6256] hover:text-[#2C2621] hover:bg-[#EFE9DC] rounded-md transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onOpenWrapup}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#4A4137] bg-[#F5F0E6] hover:bg-[#EAE2D2] border border-[#DDD3C0] rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#A36640]" />
              <span>Month Wrap-up</span>
            </button>
          </div>
        </div>

        {/* Quiet Monthly Story Summary */}
        <div className="py-4 flex flex-col md:flex-row md:items-center justify-between text-xs text-[#7A6F62] gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8C4A2F]" />
            <span>
              {loggedDaysCount === 0 ? (
                'No entries recorded yet this month. Click today to begin your chronicle.'
              ) : (
                <>
                  <strong className="text-[#2C2621] font-semibold">{loggedDaysCount} days</strong> logged so far · Spent{' '}
                  <strong className="text-[#2C2621] font-semibold">{formatMoney(monthTotalSpent, settings.currency)}</strong>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span>
              Monthly budget backdrop:{' '}
              <span className="font-semibold text-[#2C2621]">
                {formatMoney(settings.monthlyBudget, settings.currency)}
              </span>
            </span>
            <span className="text-[#B5AAA0]">·</span>
            <span>
              Remaining:{' '}
              <span className={remainingBudget >= 0 ? 'text-[#3E6845] font-semibold' : 'text-[#A3432B] font-semibold'}>
                {formatMoney(remainingBudget, settings.currency)}
              </span>
            </span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="mt-4 border-t border-[#F0ECE1] pt-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-medium text-[#8F8274] pb-2">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Prev month placeholder cells */}
            {Array.from({ length: startingDayOffset }).map((_, idx) => {
              const dayNum = daysInPrevMonth - startingDayOffset + idx + 1;
              return (
                <div
                  key={`prev-${idx}`}
                  className="min-h-[78px] sm:min-h-[104px] p-2 rounded-xl border border-transparent bg-[#FAF8F5]/40 text-[#C9BFB2] select-none flex flex-col justify-between opacity-50"
                >
                  <span className="text-xs font-serif">{dayNum}</span>
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const entry = entries[dateStr];
              const dayTotal = getDayTotal(entry);
              const hasExpenses = entry && entry.expenses && entry.expenses.length > 0;
              const hasReflection = Boolean(entry?.reflection && entry.reflection.trim().length > 0);
              const hasNotes = entry && (entry.expenses?.some((e) => e.note?.trim()) || hasReflection);
              const mood = entry?.mood ? MOOD_DEFINITIONS[entry.mood] : null;

              return (
                <button
                  key={dateStr}
                  onClick={() => onSelectDay(dateStr)}
                  className={`group relative min-h-[78px] sm:min-h-[104px] p-2 sm:p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                    isToday
                      ? 'bg-[#FCF9F3] border-[#D4A373] shadow-xs ring-1 ring-[#D4A373]/40'
                      : hasExpenses || hasNotes
                      ? 'bg-[#FFFFFF] border-[#EAE3D5] hover:border-[#CFBFA8] hover:shadow-sm'
                      : 'bg-[#FAF8F4]/70 border-[#EFE9DE]/80 hover:bg-[#FFFFFF] hover:border-[#DED5C5]'
                  }`}
                >
                  {/* Top row: day number and status dots */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs sm:text-sm font-serif font-medium transition-colors ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-[#8C4A2F] text-white flex items-center justify-center font-sans font-bold text-xs shadow-2xs'
                          : 'text-[#4A4237] group-hover:text-[#2C2621]'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Indicators: Note marker and Mood tag */}
                    <div className="flex items-center gap-1">
                      {mood && (
                        <span
                          title={`Mood: ${mood.label}`}
                          className="text-xs select-none"
                        >
                          {mood.symbol}
                        </span>
                      )}

                      {hasNotes && (
                        <span
                          title="Contains notes and reflections"
                          className="w-1.5 h-1.5 rounded-full bg-[#8C4A2F]"
                        />
                      )}
                    </div>
                  </div>

                  {/* Middle / Bottom Content */}
                  <div className="w-full mt-2">
                    {hasExpenses ? (
                      <div>
                        {/* The total spent on this day */}
                        <div className="font-serif text-sm sm:text-base font-semibold text-[#2C2621] tracking-tight">
                          {formatMoney(dayTotal, settings.currency)}
                        </div>
                        {/* Note preview snippet on larger screens */}
                        {entry.expenses[0]?.note && (
                          <p className="hidden sm:block text-[11px] text-[#82776A] truncate mt-0.5 font-normal italic">
                            {entry.expenses[0].note}
                          </p>
                        )}
                      </div>
                    ) : (
                      /*
                        CRITICAL REQUIREMENT:
                        "Days with no entry stay blank rather than showing "$0.00" —
                        emptiness should feel inviting, not like a failing grade."
                      */
                      <div className="h-6 flex items-end">
                        {hasReflection ? (
                          <p className="hidden sm:block text-[11px] text-[#8C7662] truncate italic font-serif">
                            "{entry.reflection}"
                          </p>
                        ) : (
                          <div className="w-full opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-[#A69C8E] flex items-center gap-1 font-serif italic">
                            <Plus className="w-2.5 h-2.5" />
                            <span>open page</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend / Guide at bottom of calendar */}
        <div className="mt-8 pt-4 border-t border-[#F0ECE1] flex flex-wrap items-center justify-between text-xs text-[#8C8071] gap-4">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8C4A2F]" />
              <span>Written diary note</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🌿</span>
              <span>Headspace / mood tag</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-md border border-[#D4A373] bg-[#FCF9F3] inline-block" />
              <span>Today’s date</span>
            </div>
          </div>

          <div className="font-serif italic text-[#7C7164]">
            Tip: Click today or press <kbd className="font-sans px-1 py-0.5 bg-[#EFE9DC] rounded text-[10px]">T</kbd> to record today’s expenses and thoughts.
          </div>
        </div>
      </div>
    </div>
  );
};
