import React from 'react';
import { ShieldCheck, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatMoney } from '../utils/journalUtils';

interface BudgetCycleWheelProps {
  monthlyCap: number; // Total spending budget cap, e.g. 50,000
  totalAllocatedToBuy: number; // Dedicated budget for shopping list, e.g. 35,000
  totalActualSpend: number; // Total actually spent, e.g. 11,060
  plannedSavings: number; // Planned savings target, e.g. 20,000
  currency?: string;
}

export const BudgetCycleWheel: React.FC<BudgetCycleWheelProps> = ({
  monthlyCap,
  totalAllocatedToBuy,
  totalActualSpend,
  plannedSavings,
  currency = 'KSh',
}) => {
  // Balance between dedicated budget to be bought vs actual spend on those items / total
  const dedicatedVsActualDiff = totalAllocatedToBuy - totalActualSpend;
  const isDedicatedOverspent = dedicatedVsActualDiff < 0;

  // Remaining buffer from overall monthly cap
  const remainingOverallBuffer = monthlyCap - totalActualSpend;
  const isOverallOverbudget = remainingOverallBuffer < 0;

  // Calculate percentages for SVG cycle gauge
  const safeCap = monthlyCap > 0 ? monthlyCap : 1;
  const spendPercent = Math.min(100, Math.round((totalActualSpend / safeCap) * 100));
  const allocatedPercent = Math.min(100, Math.round((totalAllocatedToBuy / safeCap) * 100));

  // Circular gauge math (radius 80, circumference = 2 * PI * 80 ≈ 502.65)
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const spendStrokeDashoffset = circumference - (spendPercent / 100) * circumference;
  const allocatedStrokeDashoffset = circumference - (allocatedPercent / 100) * circumference;

  return (
    <div className="blueblack-sheet rounded-3xl p-6 sm:p-8 border border-[#1E2B45] relative overflow-hidden shadow-xl">
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#1D4ED8]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#1E2B45] relative z-10">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#38BDF8] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
            Budget Overview Cycle
          </span>
          <h2 className="font-serif text-2xl font-medium text-[#F1F5F9] mt-1">
            Spend vs. Dedicated Allocation Cycle
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {isDedicatedOverspent ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg bg-[#450A0A] border border-[#7F1D1D] text-[#F87171]">
              <AlertTriangle className="w-3.5 h-3.5 text-[#F87171]" />
              Over Allocated by -{formatMoney(Math.abs(dedicatedVsActualDiff), currency)}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg bg-[#064E3B]/60 border border-[#059669]/60 text-[#34D399]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
              Within Dedicated Budget ({formatMoney(dedicatedVsActualDiff, currency)} left)
            </span>
          )}
        </div>
      </div>

      {/* Main Cycle Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-6 relative z-10">
        {/* SVG Circular Overview Cycle Wheel */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-52 h-52 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
              {/* Background Track */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                className="stroke-[#132038]"
                strokeWidth="14"
                fill="transparent"
              />

              {/* Dedicated Budget to be Bought Ring */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                className="stroke-[#3B82F6]/40 transition-all duration-700"
                strokeWidth="14"
                strokeDasharray={circumference}
                strokeDashoffset={allocatedStrokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />

              {/* Actual Budget Spent Ring */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                className={`transition-all duration-700 ${
                  isOverallOverbudget ? 'stroke-[#EF4444]' : 'stroke-[#38BDF8]'
                }`}
                strokeWidth="14"
                strokeDasharray={circumference}
                strokeDashoffset={spendStrokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Cycle Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <span className="text-[10px] font-mono uppercase text-[#94A3B8]">
                Actual Spend
              </span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-[#F1F5F9] mt-0.5">
                {formatMoney(totalActualSpend, currency)}
              </span>
              <span className="text-[11px] font-mono text-[#38BDF8] mt-0.5">
                {spendPercent}% of cap
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs mt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#38BDF8]" />
              <span className="text-[#CBD5E1]">Actual Spend</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#3B82F6]/50" />
              <span className="text-[#94A3B8]">Dedicated to Buy</span>
            </div>
          </div>
        </div>

        {/* Cycle Flow Pillars */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* Step 1: Total Cap */}
          <div className="p-3.5 rounded-2xl bg-[#0A1020] border border-[#223354] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#16233B] flex items-center justify-center font-mono text-xs font-bold text-[#93C5FD]">
                1
              </div>
              <div>
                <span className="text-xs font-medium text-[#F1F5F9] block">
                  Monthly Spending Cap
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Overall allowance before dipping into savings
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-serif text-base font-bold text-[#F1F5F9]">
                {formatMoney(monthlyCap, currency)}
              </span>
            </div>
          </div>

          {/* Step 2: Dedicated to be Bought (Shopping list) */}
          <div className="p-3.5 rounded-2xl bg-[#0C1D38] border border-[#1E3A8A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#1D4ED8] flex items-center justify-center font-mono text-xs font-bold text-white">
                2
              </div>
              <div>
                <span className="text-xs font-medium text-[#93C5FD] block">
                  Budget Dedicated to be Bought
                </span>
                <span className="text-[11px] text-[#60A5FA]">
                  Sum of planned items in your shopping list
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-serif text-base font-bold text-[#38BDF8]">
                {formatMoney(totalAllocatedToBuy, currency)}
              </span>
              <span className="text-[10px] text-[#93C5FD] block">
                {allocatedPercent}% of cap
              </span>
            </div>
          </div>

          {/* Step 3: Actual Spend */}
          <div className="p-3.5 rounded-2xl bg-[#0A1020] border border-[#223354] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#16233B] flex items-center justify-center font-mono text-xs font-bold text-[#93C5FD]">
                3
              </div>
              <div>
                <span className="text-xs font-medium text-[#F1F5F9] block">
                  Actual Budget Spent
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Recorded purchases & daily journal entries
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-serif text-base font-bold text-[#F1F5F9]">
                {formatMoney(totalActualSpend, currency)}
              </span>
            </div>
          </div>

          {/* Step 4: Net Balance & Planned Savings Safety */}
          <div className="p-3.5 rounded-2xl bg-[#0B1A3A] border border-[#1E3A8A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#059669] flex items-center justify-center font-mono text-xs font-bold text-white">
                ✓
              </div>
              <div>
                <span className="text-xs font-medium text-[#38BDF8] block">
                  Planned Savings Stash Target
                </span>
                <span className="text-[11px] text-[#93C5FD]">
                  {remainingOverallBuffer >= 0
                    ? `Safe! ${formatMoney(remainingOverallBuffer, currency)} unspent buffer remaining`
                    : `Alert: Spending exceeded budget cap by -${formatMoney(Math.abs(remainingOverallBuffer), currency)}`}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-serif text-base font-bold text-[#34D399]">
                {formatMoney(plannedSavings, currency)}
              </span>
              <span className="text-[10px] text-[#34D399] block font-mono">
                {remainingOverallBuffer >= 0 ? 'Protected' : 'Compromised'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
