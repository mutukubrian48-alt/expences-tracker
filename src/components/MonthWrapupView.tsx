import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  Sparkles,
  Heart,
  TrendingDown,
  TrendingUp,
  Smile,
  Check,
} from 'lucide-react';
import { DayEntry, MoodType, MOOD_DEFINITIONS, UserSettings } from '../types';
import {
  computeMonthSummary,
  formatHumanDate,
  formatMoney,
  getMonthName,
  getTodayDateString,
} from '../utils/journalUtils';

interface MonthWrapupViewProps {
  year: number;
  month: number;
  entries: Record<string, DayEntry>;
  settings: UserSettings;
  onUpdateMonthReflection: (yearMonthKey: string, text: string) => void;
  onNavigateToCalendar: () => void;
  onNavigateToDay: (dateStr: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

export const MonthWrapupView: React.FC<MonthWrapupViewProps> = ({
  year,
  month,
  entries,
  settings,
  onUpdateMonthReflection,
  onNavigateToCalendar,
  onNavigateToDay,
  onMonthChange,
}) => {
  const yearMonthKey = `${year}-${String(month).padStart(2, '0')}`;
  const summary = computeMonthSummary(year, month, entries, settings);
  const [reflectionSaved, setReflectionSaved] = useState(false);

  const currentReflection = settings.monthReflections[yearMonthKey] || '';
  const [localReflection, setLocalReflection] = useState(currentReflection);

  const handleReflectionChange = (text: string) => {
    setLocalReflection(text);
    onUpdateMonthReflection(yearMonthKey, text);
    setReflectionSaved(true);
    setTimeout(() => setReflectionSaved(false), 2000);
  };

  const handlePrevMonth = () => {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-4 mb-6 text-xs text-[#7A6F62]">
        <button
          onClick={onNavigateToCalendar}
          className="flex items-center gap-1.5 font-medium text-[#5A5145] hover:text-[#2C2621] py-1 px-2.5 rounded-lg hover:bg-[#EFE9DC] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Calendar</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-[#E5DDD0] bg-[#FFFFFF] hover:bg-[#F7F3EA] text-[#4A4137] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Earlier Chapter</span>
          </button>
          <button
            onClick={handleNextMonth}
            aria-label="Next month"
            className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-[#E5DDD0] bg-[#FFFFFF] hover:bg-[#F7F3EA] text-[#4A4137] transition-colors cursor-pointer"
          >
            <span className="hidden sm:inline">Next Chapter</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Chapter Card */}
      <article className="paper-sheet rounded-3xl border border-[#EBE4D5] p-6 sm:p-12 transition-all space-y-10">
        {/* Chapter Header */}
        <header className="pb-8 border-b border-[#F0ECE1]">
          <div className="flex items-center gap-2 text-xs font-serif uppercase tracking-widest text-[#8C7662]">
            <span>Monthly Chapter Wrap-up</span>
            <span>·</span>
            <span>The Chronicle</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-[#2C2621] mt-2">
            {summary.monthName} <span className="font-normal text-[#8A7E70]">{year}</span>
          </h1>

          {/* Full Sentence Narrative Summary */}
          <div className="mt-4 p-5 rounded-2xl bg-[#FAF7F0] border border-[#EAE3D4] text-sm text-[#4E4437] leading-relaxed">
            <p>
              In {summary.monthName}, you recorded{' '}
              <strong className="text-[#2C2621] font-semibold">{summary.activeLoggingDays} days</strong> in your journal
              and spent{' '}
              <strong className="text-[#2C2621] font-semibold">
                {formatMoney(summary.totalSpent, settings.currency)}
              </strong>{' '}
              in total.
              {summary.remainingBudget >= 0 ? (
                <span>
                  {' '}You have{' '}
                  <strong className="text-[#3E6845] font-semibold">
                    {formatMoney(summary.remainingBudget, settings.currency)}
                  </strong>{' '}
                  remaining of your {formatMoney(summary.monthlyBudget, settings.currency)} monthly allowance.
                </span>
              ) : (
                <span>
                  {' '}You finished{' '}
                  <strong className="text-[#A3432B] font-semibold">
                    {formatMoney(Math.abs(summary.remainingBudget), settings.currency)}
                  </strong>{' '}
                  above your {formatMoney(summary.monthlyBudget, settings.currency)} monthly allowance.
                </span>
              )}
            </p>
            <p className="mt-2 text-xs text-[#7A6F62]">
              On average, you spent{' '}
              <strong className="text-[#2C2621]">
                {formatMoney(summary.actualDailyAverage, settings.currency)}
              </strong>{' '}
              per active day, alongside{' '}
              <strong className="text-[#2C2621]">{summary.zeroSpendDays} calm no-spend days</strong>.
            </p>
          </div>
        </header>

        {/* 1. THE STORY OF THE MONTH: Notes read back in sequence */}
        <section className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#8C4A2F]" />
              <h2 className="font-serif text-2xl font-medium text-[#2C2621]">
                The Story of {summary.monthName}
              </h2>
            </div>
            <p className="text-xs text-[#8C8071] mt-1">
              Your notes read back in chronological order. The life you lived behind the numbers.
            </p>
          </div>

          {summary.chronicleEntries.length === 0 ? (
            <div className="p-8 text-center bg-[#FAF8F4] rounded-2xl border border-[#EDE6D8]">
              <p className="font-serif italic text-[#7C7164]">
                No entries recorded for {summary.monthName} yet.
              </p>
            </div>
          ) : (
            <div className="border-l-2 border-[#E7DFD0] pl-4 sm:pl-6 space-y-6 my-6">
              {summary.chronicleEntries.map((day) => {
                const moodMeta = day.mood ? MOOD_DEFINITIONS[day.mood] : null;

                return (
                  <div key={day.date} className="relative group">
                    {/* Timeline dot */}
                    <span className="absolute -left-[23px] sm:-left-[31px] top-1.5 w-3 h-3 rounded-full bg-[#FFFFFF] border-2 border-[#8C4A2F]" />

                    {/* Day header in timeline */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onNavigateToDay(day.date)}
                        className="font-serif text-base font-semibold text-[#2C2621] hover:text-[#8C4A2F] transition-colors cursor-pointer text-left"
                      >
                        {day.dateLabel}
                      </button>

                      {moodMeta && (
                        <span className="text-xs text-[#7A6F62] flex items-center gap-1 bg-[#F5F1E8] px-2 py-0.5 rounded-md">
                          <span>{moodMeta.symbol}</span>
                          <span>{moodMeta.label}</span>
                        </span>
                      )}

                      <span className="text-xs font-serif font-medium text-[#7C7164]">
                        {day.dayTotal === 0 ? '· No spend' : `· ${formatMoney(day.dayTotal, settings.currency)}`}
                      </span>
                    </div>

                    {/* Day Reflection if present */}
                    {day.reflection && (
                      <blockquote className="mt-1.5 font-serif italic text-sm text-[#5E5345] bg-[#FAF8F3] p-3 rounded-xl border border-[#EFE8DA]">
                        "{day.reflection}"
                      </blockquote>
                    )}

                    {/* Individual expense notes */}
                    {day.expenses.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {day.expenses.map((exp) => (
                          <div
                            key={exp.id}
                            className="text-xs text-[#3D352B] flex items-baseline justify-between gap-3 bg-[#FFFFFF] p-2.5 rounded-lg border border-[#EDE6D8]"
                          >
                            <div className="flex-1">
                              <span className="font-normal text-[#2C2621]">{exp.note}</span>
                              <div className="text-[11px] text-[#8C8071] mt-0.5">
                                <span>{exp.category}</span>
                              </div>
                            </div>
                            <span className="font-serif font-semibold text-[#2C2621] whitespace-nowrap">
                              {formatMoney(exp.amount, settings.currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 2. HEADSPACE & MONEY PATTERNS: Mood vs spending */}
        <section className="space-y-4 pt-6 border-t border-[#F0ECE1]">
          <div>
            <div className="flex items-center gap-2">
              <Smile className="w-4 h-4 text-[#8C4A2F]" />
              <h2 className="font-serif text-2xl font-medium text-[#2C2621]">
                Headspace & Spending Patterns
              </h2>
            </div>
            <p className="text-xs text-[#8C8071] mt-1">
              Surfacing connections between how you were feeling and how you spent.
            </p>
          </div>

          {summary.moodInsights.length === 0 ? (
            <p className="text-xs font-serif italic text-[#8C8071]">
              Tag your days with moods to unlock behavioral reflections here over time.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {summary.moodInsights.map((insight) => (
                <div
                  key={insight.mood}
                  className="p-4 rounded-xl border border-[#EBE4D5] bg-[#FAF8F3] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#2C2621] flex items-center gap-1.5">
                      <span className="text-base">{insight.symbol}</span>
                      <span>{insight.label} days</span>
                    </span>
                    <span className="text-xs text-[#8C8071]">
                      {insight.count} {insight.count === 1 ? 'day' : 'days'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#EFE9DC] flex items-baseline justify-between">
                    <span className="text-[11px] text-[#7C7164]">Average spend:</span>
                    <span className="font-serif text-base font-semibold text-[#2C2621]">
                      {formatMoney(insight.averageAmount, settings.currency)}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#8C8071] flex items-baseline justify-between">
                    <span>Total spent:</span>
                    <span>{formatMoney(insight.totalAmount, settings.currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. CATEGORY BACKDROP: Quiet breakdown */}
        <section className="space-y-4 pt-6 border-t border-[#F0ECE1]">
          <div>
            <h2 className="font-serif text-2xl font-medium text-[#2C2621]">
              Where the Dollars Went
            </h2>
            <p className="text-xs text-[#8C8071] mt-1">
              Monthly spending grouped quietly into categories.
            </p>
          </div>

          {summary.categoryBreakdown.length === 0 ? (
            <p className="text-xs font-serif italic text-[#8C8071]">
              No expenses recorded this month yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {summary.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="p-3 rounded-xl border border-[#EDE6D8] bg-[#FFFFFF]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-[#2C2621]">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-semibold text-[#2C2621]">
                        {formatMoney(cat.amount, settings.currency)}
                      </span>
                      <span className="text-[#8C8071]">({cat.percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                  {/* Subtle bar */}
                  <div className="w-full h-1.5 bg-[#F0ECE1] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8C4A2F] rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, cat.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. MONTH-END REFLECTION PROMPT */}
        <section className="space-y-3 pt-6 border-t border-[#F0ECE1]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-medium text-[#2C2621]">
                Chapter Reflection
              </h2>
              <p className="text-xs text-[#8C8071] mt-0.5">
                What went well in {summary.monthName}? What felt completely worth it, and what would you adjust for next month?
              </p>
            </div>
            {reflectionSaved && (
              <span className="text-xs text-[#3E6845] flex items-center gap-1 font-serif italic">
                <Check className="w-3 h-3" /> Saved
              </span>
            )}
          </div>

          <textarea
            rows={5}
            value={localReflection}
            onChange={(e) => handleReflectionChange(e.target.value)}
            placeholder="Write your closing reflection for this month here..."
            className="w-full p-4 rounded-2xl border border-[#DECFC0] bg-[#FAF8F4] text-sm text-[#2C2621] placeholder-[#AFA597] focus:outline-none focus:ring-1 focus:ring-[#8C4A2F] leading-relaxed resize-y font-normal"
          />
        </section>
      </article>
    </div>
  );
};
