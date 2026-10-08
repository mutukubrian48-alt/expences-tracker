import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Clock,
  Smile,
  Check,
  TrendingUp,
  FileSpreadsheet,
  Edit2,
  PiggyBank,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { BudgetItem, DayEntry, MoodType, MOOD_DEFINITIONS, UserSettings } from '../types';
import {
  computeMonthSummary,
  formatHumanDate,
  formatMoney,
  formatTimeDisplay,
  getMonthName,
} from '../utils/journalUtils';
import { calculateItemAllocated, calculateItemSpent } from '../utils/excelUtils';
import { BudgetCycleWheel } from './BudgetCycleWheel';

interface SummaryViewProps {
  year: number;
  month: number;
  entries: Record<string, DayEntry>;
  budgetItems: BudgetItem[];
  settings: UserSettings;
  onUpdateMonthReflection: (yearMonthKey: string, text: string) => void;
  onNavigateToDates: () => void;
  onNavigateToDay: (dateStr: string) => void;
  onNavigateToExcel: () => void;
  onOpenEditCatered: () => void;
  onMonthChange: (year: number, month: number) => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  year,
  month,
  entries,
  budgetItems,
  settings,
  onUpdateMonthReflection,
  onNavigateToDates,
  onNavigateToDay,
  onNavigateToExcel,
  onOpenEditCatered,
  onMonthChange,
}) => {
  const yearMonthKey = `${year}-${String(month).padStart(2, '0')}`;
  const summary = computeMonthSummary(year, month, entries, settings);
  const [reflectionSaved, setReflectionSaved] = useState(false);

  const currentReflection = settings.monthReflections[yearMonthKey] || '';
  const [localReflection, setLocalReflection] = useState(currentReflection);

  // Dedicated budget from shopping list
  const totalAllocatedToBuy = budgetItems.reduce(
    (sum, item) => sum + calculateItemAllocated(item),
    0
  );

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

  const savingsSurplusOrDeficit = summary.actualSavedAtEndOfMonth - summary.plannedSavingsForMonth;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-4 text-xs text-[#94A3B8]">
        <button
          onClick={onNavigateToDates}
          className="flex items-center gap-1.5 font-medium text-[#94A3B8] hover:text-[#F1F5F9] py-1 px-2.5 rounded-lg hover:bg-[#1E293B] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#38BDF8]" />
          <span>Return to Dates Stream</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#223354] bg-[#0D1527] hover:bg-[#1E293B] text-[#38BDF8] transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Open Excel Sheet</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-lg border border-[#223354] bg-[#0D1527] hover:bg-[#1E293B] text-[#CBD5E1] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-1.5 rounded-lg border border-[#223354] bg-[#0D1527] hover:bg-[#1E293B] text-[#CBD5E1] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 1. END OF MONTH SAVINGS SHOWCASE CARD */}
      <div className="blueblack-sheet rounded-3xl p-6 sm:p-8 border border-[#1E3A8A] bg-gradient-to-br from-[#0B1A3A] to-[#0A1020] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#38BDF8]">
              <Award className="w-4 h-4 text-[#38BDF8]" />
              <span>End-of-Month Savings Report · {summary.monthName} {year}</span>
            </div>

            <div className="mt-2 flex items-baseline gap-3 flex-wrap">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F1F5F9]">
                What You Have Saved:{' '}
                <span className="text-[#34D399]">
                  {formatMoney(summary.actualSavedAtEndOfMonth, settings.currency)}
                </span>
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-[#94A3B8] mt-2 max-w-xl leading-relaxed">
              From an allocated fund of{' '}
              <strong className="text-[#38BDF8]">{formatMoney(summary.cateredForMonth, settings.currency)}</strong>{' '}
              catered for {summary.monthName}, you spent{' '}
              <strong className="text-[#F87171]">{formatMoney(summary.totalSpent, settings.currency)}</strong>{' '}
              across the month, leaving you with{' '}
              <strong className="text-[#34D399] font-semibold">{formatMoney(summary.actualSavedAtEndOfMonth, settings.currency)}</strong>{' '}
              saved in your pocket.
            </p>

            <div className="mt-3 flex items-center gap-3 text-xs flex-wrap">
              <span className="px-3 py-1 rounded-lg bg-[#064E3B]/60 border border-[#059669]/60 text-[#34D399] font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {summary.savingsRatePercent}% Savings Rate
              </span>

              {savingsSurplusOrDeficit >= 0 ? (
                <span className="text-[#93C5FD]">
                  ✨ Target of {formatMoney(summary.plannedSavingsForMonth, settings.currency)} exceeded by{' '}
                  <strong className="text-[#34D399]">+{formatMoney(savingsSurplusOrDeficit, settings.currency)}</strong>!
                </span>
              ) : (
                <span className="text-[#F87171]">
                  Target was {formatMoney(summary.plannedSavingsForMonth, settings.currency)} ({formatMoney(Math.abs(savingsSurplusOrDeficit), settings.currency)} short).
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 flex flex-col gap-2">
            <button
              onClick={onOpenEditCatered}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Catered Amount</span>
            </button>
            <span className="text-[11px] text-[#64748B] text-center">
              Tailor each month's allocation
            </span>
          </div>
        </div>
      </div>

      {/* 2. OVERVIEW CYCLE FOR BUDGET SPEND AND DEDICATED BUDGET TO BE BOUGHT */}
      <BudgetCycleWheel
        monthlyCap={summary.cateredForMonth}
        totalAllocatedToBuy={totalAllocatedToBuy}
        totalActualSpend={summary.totalSpent}
        plannedSavings={summary.plannedSavingsForMonth}
        currency={settings.currency}
      />

      {/* Main Blue-Black Summary Article */}
      <article className="blueblack-sheet rounded-3xl border border-[#1E2B45] p-6 sm:p-12 transition-all space-y-10 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1D4ED8]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <header className="pb-8 border-b border-[#1E2B45] relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#38BDF8]">
            <Sparkles className="w-4 h-4" />
            <span>Monthly Financial & Life Summary</span>
          </div>
          <div className="flex items-baseline justify-between gap-4 mt-2 flex-wrap">
            <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-[#F1F5F9]">
              {summary.monthName} <span className="font-normal text-[#64748B]">{year}</span>
            </h1>

            <button
              onClick={onOpenEditCatered}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#16233B] hover:bg-[#1E293B] text-[#93C5FD] border border-[#223354] transition-colors cursor-pointer"
            >
              <Edit2 className="w-3 h-3 text-[#38BDF8]" />
              <span>Catered: {formatMoney(summary.cateredForMonth, settings.currency)}</span>
            </button>
          </div>

          {/* Full Sentence Narrative Summary */}
          <div className="mt-4 p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] text-sm text-[#CBD5E1] leading-relaxed">
            <p>
              In {summary.monthName}, you spent{' '}
              <strong className="text-[#F1F5F9] font-semibold">
                {formatMoney(summary.totalSpent, settings.currency)}
              </strong>{' '}
              against a dedicated shopping budget of{' '}
              <strong className="text-[#38BDF8] font-semibold">
                {formatMoney(totalAllocatedToBuy, settings.currency)}
              </strong>
              . At the end of {summary.monthName}, you have officially saved{' '}
              <strong className="text-[#34D399] font-semibold">
                {formatMoney(summary.actualSavedAtEndOfMonth, settings.currency)}
              </strong>
              .
            </p>
            <p className="mt-2 text-xs text-[#94A3B8]">
              Average daily spending was{' '}
              <strong className="text-[#F1F5F9]">
                {formatMoney(summary.actualDailyAverage, settings.currency)}
              </strong>{' '}
              per active day, alongside{' '}
              <strong className="text-[#F1F5F9]">{summary.zeroSpendDays} calm no-spend days</strong>.
            </p>
          </div>
        </header>

        {/* 3. CHRONICLE WITH TIME LOG */}
        <section className="space-y-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#38BDF8]" />
              <h2 className="font-serif text-2xl font-medium text-[#F1F5F9]">
                Chronicle & Time Log
              </h2>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">
              Every expense, note, and time of day read back in order.
            </p>
          </div>

          {summary.chronicleEntries.length === 0 ? (
            <div className="p-8 text-center bg-[#0A1020] rounded-2xl border border-[#1E2B45]">
              <p className="font-serif italic text-[#64748B]">
                No entries recorded for {summary.monthName} yet.
              </p>
            </div>
          ) : (
            <div className="border-l-2 border-[#1E2B45] pl-4 sm:pl-6 space-y-6 my-6">
              {summary.chronicleEntries.map((day) => {
                const moodMeta = day.mood ? MOOD_DEFINITIONS[day.mood] : null;

                return (
                  <div key={day.date} className="relative group">
                    <span className="absolute -left-[23px] sm:-left-[31px] top-1.5 w-3 h-3 rounded-full bg-[#0D1527] border-2 border-[#38BDF8]" />

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onNavigateToDay(day.date)}
                        className="font-serif text-base font-semibold text-[#F1F5F9] hover:text-[#38BDF8] transition-colors cursor-pointer text-left"
                      >
                        {day.dateLabel}
                      </button>

                      {moodMeta && (
                        <span className={`text-xs px-2 py-0.5 rounded-md border flex items-center gap-1 ${moodMeta.colorClass}`}>
                          <span>{moodMeta.symbol}</span>
                          <span>{moodMeta.label}</span>
                        </span>
                      )}

                      <span className="text-xs font-mono text-[#94A3B8]">
                        {day.dayTotal === 0 ? '· No spend' : `· ${formatMoney(day.dayTotal, settings.currency)}`}
                      </span>
                    </div>

                    {day.reflection && (
                      <blockquote className="mt-2 font-serif italic text-sm text-[#94A3B8] bg-[#0A1020] p-3 rounded-xl border border-[#1E2B45]">
                        "{day.reflection}"
                      </blockquote>
                    )}

                    {day.expenses.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {day.expenses.map((exp) => (
                          <div
                            key={exp.id}
                            className="text-xs text-[#CBD5E1] flex items-baseline justify-between gap-3 bg-[#0A1020]/70 p-2.5 rounded-lg border border-[#1E2B45]"
                          >
                            <div className="flex-1">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                {exp.time && (
                                  <span className="text-[11px] font-mono text-[#38BDF8] bg-[#0C2449] px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                                    <Clock className="w-2.5 h-2.5 text-[#38BDF8]" />
                                    {formatTimeDisplay(exp.time)}
                                  </span>
                                )}
                                <span className="font-normal text-[#F1F5F9]">{exp.note}</span>
                              </div>
                              <div className="text-[11px] text-[#64748B] mt-0.5">
                                <span>{exp.category}</span>
                              </div>
                            </div>
                            <span className="font-serif font-bold text-[#F1F5F9] whitespace-nowrap">
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

        {/* 4. HEADSPACE & MONEY PATTERNS */}
        <section className="space-y-4 pt-6 border-t border-[#1E2B45] relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <Smile className="w-4 h-4 text-[#38BDF8]" />
              <h2 className="font-serif text-2xl font-medium text-[#F1F5F9]">
                Headspace & Spending Patterns
              </h2>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">
              Connections between how you were feeling and how you spent in Kenyan Shillings.
            </p>
          </div>

          {summary.moodInsights.length === 0 ? (
            <p className="text-xs font-serif italic text-[#64748B]">
              Tag your dates with moods to unlock behavioral reflections here over time.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {summary.moodInsights.map((insight) => (
                <div
                  key={insight.mood}
                  className="p-4 rounded-xl border border-[#1E2B45] bg-[#0A1020] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#F1F5F9] flex items-center gap-1.5">
                      <span className="text-base">{insight.symbol}</span>
                      <span>{insight.label}</span>
                    </span>
                    <span className="text-xs text-[#64748B]">
                      {insight.count} {insight.count === 1 ? 'date' : 'dates'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#1E2B45] flex items-baseline justify-between">
                    <span className="text-[11px] text-[#94A3B8]">Average spend:</span>
                    <span className="font-serif text-base font-bold text-[#F1F5F9]">
                      {formatMoney(insight.averageAmount, settings.currency)}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#64748B] flex items-baseline justify-between">
                    <span>Total spent:</span>
                    <span>{formatMoney(insight.totalAmount, settings.currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. CATEGORY BREAKDOWN */}
        <section className="space-y-4 pt-6 border-t border-[#1E2B45] relative z-10">
          <div>
            <h2 className="font-serif text-2xl font-medium text-[#F1F5F9]">
              Where the Shillings Went
            </h2>
            <p className="text-xs text-[#94A3B8] mt-1">
              Monthly spending grouped quietly into categories.
            </p>
          </div>

          {summary.categoryBreakdown.length === 0 ? (
            <p className="text-xs font-serif italic text-[#64748B]">
              No expenses recorded this month yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {summary.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="p-3.5 rounded-xl border border-[#1E2B45] bg-[#0A1020]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-[#F1F5F9]">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-[#F1F5F9]">
                        {formatMoney(cat.amount, settings.currency)}
                      </span>
                      <span className="text-[#64748B]">({cat.percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-[#1E2B45] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3B82F6] rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, cat.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 6. MONTH-END REFLECTION PROMPT */}
        <section className="space-y-3 pt-6 border-t border-[#1E2B45] relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-medium text-[#F1F5F9]">
                Chapter Reflection & Stash Review
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                What went well in {summary.monthName}? How did your planned savings hold up, and what would you adjust?
              </p>
            </div>
            {reflectionSaved && (
              <span className="text-xs text-[#34D399] flex items-center gap-1 font-serif italic">
                <Check className="w-3 h-3" /> Saved
              </span>
            )}
          </div>

          <textarea
            rows={5}
            value={localReflection}
            onChange={(e) => handleReflectionChange(e.target.value)}
            placeholder="Write your closing reflection for this month here..."
            className="w-full p-4 rounded-2xl border border-[#223354] bg-[#0A1020] text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] leading-relaxed resize-y font-normal"
          />
        </section>
      </article>
    </div>
  );
};
