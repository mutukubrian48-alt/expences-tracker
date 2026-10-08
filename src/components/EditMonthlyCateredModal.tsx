import React, { useState, useEffect } from 'react';
import { X, Check, DollarSign, PiggyBank, Sparkles, TrendingUp } from 'lucide-react';
import { formatMoney } from '../utils/journalUtils';

interface EditMonthlyCateredModalProps {
  isOpen: boolean;
  onClose: () => void;
  yearMonthKey: string;
  monthName: string;
  currentCatered: number;
  currentPlannedSavings: number;
  totalSpentSoFar: number;
  currency: string;
  onSave: (yearMonthKey: string, newCatered: number, newSavings: number) => void;
}

export const EditMonthlyCateredModal: React.FC<EditMonthlyCateredModalProps> = ({
  isOpen,
  onClose,
  yearMonthKey,
  monthName,
  currentCatered,
  currentPlannedSavings,
  totalSpentSoFar,
  currency,
  onSave,
}) => {
  const [cateredInput, setCateredInput] = useState(currentCatered.toString());
  const [savingsInput, setSavingsInput] = useState(currentPlannedSavings.toString());
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setCateredInput(currentCatered.toString());
    setSavingsInput(currentPlannedSavings.toString());
  }, [currentCatered, currentPlannedSavings, isOpen]);

  if (!isOpen) return null;

  const parsedCatered = parseFloat(cateredInput) || 0;
  const parsedSavings = parseFloat(savingsInput) || 0;
  const projectedSavedAtEndOfMonth = Math.max(0, parsedCatered - totalSpentSoFar);
  const dailyAllowance = parsedCatered / 31;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(yearMonthKey, parsedCatered, parsedSavings);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-md">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#0D1527] rounded-3xl shadow-2xl border border-[#223354] overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2B45] bg-[#0A1020]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#38BDF8]">
              Monthly Allocation
            </span>
            <h2 className="font-serif text-lg font-medium text-[#F1F5F9]">
              Edit Catered Amount for {monthName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1E293B] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Catered amount input */}
          <div>
            <label className="text-xs font-semibold text-[#F1F5F9] block mb-1">
              Amount Catered for {monthName} ({currency})
            </label>
            <p className="text-xs text-[#94A3B8] mb-2">
              The total fund allocated for your expenses and bills this month.
            </p>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#38BDF8]">
                {currency}
              </span>
              <input
                type="number"
                step="500"
                value={cateredInput}
                onChange={(e) => setCateredInput(e.target.value)}
                className="w-full pl-14 pr-3 py-2.5 text-base font-bold rounded-xl border border-[#223354] bg-[#0A1020] text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                autoFocus
              />
            </div>
          </div>

          {/* Planned Savings Target */}
          <div>
            <label className="text-xs font-semibold text-[#38BDF8] block mb-1">
              Target Amount to Save in {monthName} ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#38BDF8]">
                {currency}
              </span>
              <input
                type="number"
                step="500"
                value={savingsInput}
                onChange={(e) => setSavingsInput(e.target.value)}
                className="w-full pl-14 pr-3 py-2.5 text-base font-bold rounded-xl border border-[#1E3A8A] bg-[#0B1A3A] text-[#38BDF8] focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
              />
            </div>
          </div>

          {/* Live Preview of End of Month Savings */}
          <div className="p-4 rounded-2xl bg-[#0F172A] border border-[#1E293B] space-y-2 text-xs">
            <span className="text-[10px] font-mono uppercase text-[#38BDF8] block">
              Live End-of-Month Projection:
            </span>

            <div className="flex items-center justify-between text-[#CBD5E1]">
              <span>Catered Fund:</span>
              <span className="font-mono font-medium">{formatMoney(parsedCatered, currency)}</span>
            </div>

            <div className="flex items-center justify-between text-[#CBD5E1]">
              <span>Spent so far:</span>
              <span className="font-mono font-medium text-[#F87171]">- {formatMoney(totalSpentSoFar, currency)}</span>
            </div>

            <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between text-[#F1F5F9] font-bold">
              <span>Saved at End of Month:</span>
              <span className="font-serif text-base text-[#34D399]">
                {formatMoney(projectedSavedAtEndOfMonth, currency)}
              </span>
            </div>

            <div className="text-[11px] text-[#94A3B8] pt-1">
              Daily allowance pace: <strong>{formatMoney(dailyAllowance, currency)}/day</strong>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#94A3B8] hover:bg-[#1E293B] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors cursor-pointer shadow-md"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Updated!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
