import React, { useState } from 'react';
import { X, Download, Upload, RotateCcw, AlertTriangle, Check, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetSampleData: () => void;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onExportData,
  onImportData,
  onResetSampleData,
  onClearAllData,
}) => {
  const [budgetInput, setBudgetInput] = useState(settings.monthlyBudget.toString());
  const [savingsInput, setSavingsInput] = useState(settings.plannedSavings.toString());
  const [currencyInput, setCurrencyInput] = useState(settings.currency);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBudget = parseFloat(budgetInput);
    const parsedSavings = parseFloat(savingsInput);
    if (isNaN(parsedBudget) || parsedBudget < 0) return;

    onUpdateSettings({
      ...settings,
      monthlyBudget: parsedBudget,
      plannedSavings: isNaN(parsedSavings) ? 0 : parsedSavings,
      currency: currencyInput.trim() || 'KSh',
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-md">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#0D1527] rounded-3xl shadow-2xl border border-[#223354] overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2B45] bg-[#0A1020]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#38BDF8]" />
            <h2 className="font-serif text-lg font-medium text-[#F1F5F9]">
              Settings & Planned Savings
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
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Monthly Budget & Planned Savings Form */}
          <form onSubmit={handleSavePreferences} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#38BDF8] mb-1">
                Planned Savings & Spending Target
              </label>
              <p className="text-xs text-[#94A3B8] mb-3">
                Configure your savings goal and spending allowance in Kenyan Shillings.
              </p>

              <div className="space-y-3">
                {/* Currency */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="text-[10px] text-[#64748B]">Currency</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={currencyInput}
                      onChange={(e) => setCurrencyInput(e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-[#223354] bg-[#0A1020] text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-[#64748B]">Monthly Spending Cap</label>
                    <input
                      type="number"
                      step="500"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-sm font-semibold rounded-xl border border-[#223354] bg-[#0A1020] text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                    />
                  </div>
                </div>

                {/* Planned Savings Target */}
                <div className="p-3.5 rounded-xl border border-[#1E3A8A] bg-[#0B1A3A]">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#38BDF8] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Planned Savings Target (Monthly)
                    </label>
                  </div>
                  <p className="text-[11px] text-[#93C5FD] mb-2">
                    How much you want locked in your savings/investments this month.
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#38BDF8]">
                      {currencyInput}
                    </span>
                    <input
                      type="number"
                      step="500"
                      value={savingsInput}
                      onChange={(e) => setSavingsInput(e.target.value)}
                      className="w-full pl-12 pr-3 py-2 text-base font-bold rounded-xl border border-[#223354] bg-[#080D1A] text-[#38BDF8] focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {savedSuccess ? (
                <span className="text-xs text-[#34D399] flex items-center gap-1 font-serif italic">
                  <Check className="w-3.5 h-3.5" /> Saved settings
                </span>
              ) : (
                <span className="text-xs text-[#64748B] font-mono">
                  Daily allowance: {currencyInput} {(parseFloat(budgetInput) / 31 || 0).toFixed(0)}/day
                </span>
              )}
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors cursor-pointer shadow-md"
              >
                Save Preferences
              </button>
            </div>
          </form>

          {/* Data Backup & Restore */}
          <div className="pt-4 border-t border-[#1E2B45] space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-[#38BDF8]">
              Journal Backup & Data
            </label>
            <p className="text-xs text-[#94A3B8]">
              Your journal entries are stored locally and privately in this browser.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={onExportData}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-[#223354] bg-[#0A1020] hover:bg-[#16233E] text-[#F1F5F9] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Export JSON Backup</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-[#223354] bg-[#0A1020] hover:bg-[#16233E] text-[#F1F5F9] transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Restore Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportData}
                  className="hidden"
                />
              </label>

              <button
                onClick={onResetSampleData}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-[#223354] bg-[#0A1020] hover:bg-[#16233E] text-[#F1F5F9] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Load Sample KES Entries</span>
              </button>
            </div>
          </div>

          {/* Reset Zone */}
          <div className="pt-4 border-t border-[#1E2B45]">
            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-xs text-[#EF4444] hover:underline cursor-pointer"
              >
                Erase all journal entries...
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-[#450A0A]/40 border border-[#7F1D1D] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F87171]">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Are you sure? This will delete all entries.</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      onClearAllData();
                      setConfirmClear(false);
                      onClose();
                    }}
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#EF4444] text-white hover:bg-[#DC2626]"
                  >
                    Yes, erase everything
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-3 py-1 text-xs text-[#94A3B8] hover:bg-[#1E293B] rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
