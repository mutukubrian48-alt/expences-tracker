/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ActiveView, BudgetItem, DayEntry, ExpenseItem, UserSettings } from './types';
import {
  DEFAULT_SETTINGS,
  generateSampleEntries,
  getTodayDateString,
  STORAGE_KEY_ENTRIES,
  STORAGE_KEY_SETTINGS,
  calculateStreak,
  computeMonthSummary,
  getCurrentTimeString,
} from './utils/journalUtils';
import {
  generateSampleBudgetItems,
  STORAGE_KEY_BUDGET_ITEMS,
} from './utils/excelUtils';
import { HeaderNav } from './components/HeaderNav';
import { DatesStreamView } from './components/DatesStreamView';
import { DayPageView } from './components/DayPageView';
import { ExcelShoppingSheet } from './components/ExcelShoppingSheet';
import { SummaryView } from './components/SummaryView';
import { SearchModal } from './components/SearchModal';
import { SettingsModal } from './components/SettingsModal';
import { EditMonthlyCateredModal } from './components/EditMonthlyCateredModal';

export default function App() {
  const todayStr = useMemo(() => getTodayDateString(), []);
  const [todayYear, todayMonth] = useMemo(() => todayStr.split('-').map(Number), [todayStr]);

  // Load saved entries
  const [entries, setEntries] = useState<Record<string, DayEntry>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ENTRIES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to read entries from storage:', e);
    }
    return generateSampleEntries();
  });

  // Load budget shopping items (linked to Excel)
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BUDGET_ITEMS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to read budget items from storage:', e);
    }
    return generateSampleBudgetItems();
  });

  // Load settings (with per-month catered fund in KSh)
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to read settings from storage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // View state
  const [currentView, setCurrentView] = useState<ActiveView>('dates');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [currentYear, setCurrentYear] = useState<number>(todayYear);
  const [currentMonth, setCurrentMonth] = useState<number>(todayMonth);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditCateredOpen, setIsEditCateredOpen] = useState(false);

  // Sync entries to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
    } catch (e) {
      console.error('Failed to save entries to localStorage:', e);
    }
  }, [entries]);

  // Sync budget items to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BUDGET_ITEMS, JSON.stringify(budgetItems));
    } catch (e) {
      console.error('Failed to save budget items to localStorage:', e);
    }
  }, [budgetItems]);

  // Sync settings to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  }, [settings]);

  // Streak calculations
  const streakInfo = useMemo(() => {
    return calculateStreak(entries, todayStr);
  }, [entries, todayStr]);

  // Month summary calculation
  const monthSummary = useMemo(() => {
    return computeMonthSummary(currentYear, currentMonth, entries, settings, todayStr);
  }, [currentYear, currentMonth, entries, settings, todayStr]);

  // Navigation handlers
  const handleNavigate = useCallback((view: ActiveView, date?: string) => {
    if (date) {
      setSelectedDate(date);
      const [y, m] = date.split('-').map(Number);
      setCurrentYear(y);
      setCurrentMonth(m);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    const [y, m] = dateStr.split('-').map(Number);
    setCurrentYear(y);
    setCurrentMonth(m);
    setCurrentView('day');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteDate = (dateStr: string) => {
    setEntries((prev) => {
      const next = { ...prev };
      delete next[dateStr];
      return next;
    });
  };

  const handleSaveDayEntry = (entry: DayEntry) => {
    setEntries((prev) => ({
      ...prev,
      [entry.date]: entry,
    }));
  };

  // Sync bought item from Excel sheet to Diary
  const handleSyncBudgetItemToDiary = (item: BudgetItem) => {
    const targetDate = item.dateBought || todayStr;
    const existingDay = entries[targetDate] || {
      date: targetDate,
      expenses: [],
      updatedAt: new Date().toISOString(),
    };

    const newExpense: ExpenseItem = {
      id: `exp-from-sheet-${item.id}`,
      amount: item.actualPrice * item.actualQuantity,
      category: item.category,
      note: `${item.name} (${item.actualQuantity > 1 ? `${item.actualQuantity}x ` : ''}bought for KSh ${item.actualPrice * item.actualQuantity}${item.note ? ` — ${item.note}` : ''})`,
      time: item.timeBought || getCurrentTimeString(),
      createdAt: new Date().toISOString(),
      budgetItemId: item.id,
    };

    const filteredExpenses = existingDay.expenses.filter((e) => e.budgetItemId !== item.id);

    setEntries((prev) => ({
      ...prev,
      [targetDate]: {
        ...existingDay,
        expenses: [...filteredExpenses, newExpense],
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const handleUpdateMonthReflection = (yearMonthKey: string, text: string) => {
    setSettings((prev) => ({
      ...prev,
      monthReflections: {
        ...prev.monthReflections,
        [yearMonthKey]: text,
      },
    }));
  };

  // Update Catered Amount and Planned Savings for a specific month
  const handleSaveMonthlyCatered = (yearMonthKey: string, newCatered: number, newSavings: number) => {
    setSettings((prev) => ({
      ...prev,
      monthlyCateredBudgets: {
        ...prev.monthlyCateredBudgets,
        [yearMonthKey]: newCatered,
      },
      monthlyPlannedSavings: {
        ...prev.monthlyPlannedSavings,
        [yearMonthKey]: newSavings,
      },
    }));
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey) {
        handleNavigate('day', todayStr);
      } else if (e.key.toLowerCase() === 'd' && !e.metaKey && !e.ctrlKey) {
        handleNavigate('dates');
      } else if (e.key.toLowerCase() === 'e' && !e.metaKey && !e.ctrlKey) {
        handleNavigate('excel');
      } else if (e.key.toLowerCase() === 's' && !e.metaKey && !e.ctrlKey) {
        handleNavigate('summary');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleNavigate, todayStr]);

  // Export JSON backup
  const handleExportData = () => {
    const backupData = {
      version: 2,
      currency: settings.currency,
      plannedSavings: settings.plannedSavings,
      exportedAt: new Date().toISOString(),
      settings,
      entries,
      budgetItems,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-expenses-kes-${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.entries) {
          setEntries(parsed.entries);
        }
        if (parsed.settings) {
          setSettings(parsed.settings);
        }
        if (parsed.budgetItems) {
          setBudgetItems(parsed.budgetItems);
        }
        setIsSettingsOpen(false);
      } catch (err) {
        console.error('Failed to import backup file:', err);
      }
    };
    reader.readAsText(file);
  };

  // Reset to sample entries
  const handleResetSampleData = () => {
    const freshSample = generateSampleEntries();
    setEntries(freshSample);
    setBudgetItems(generateSampleBudgetItems());
    setSettings(DEFAULT_SETTINGS);
    setIsSettingsOpen(false);
  };

  // Clear all data
  const handleClearAllData = () => {
    setEntries({});
    setBudgetItems([]);
    setSettings({
      ...DEFAULT_SETTINGS,
      monthlyCateredBudgets: {},
      monthlyPlannedSavings: {},
      monthReflections: {},
    });
    setIsSettingsOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080D1A] text-[#F1F5F9]">
      {/* Top blue-black accent stripe */}
      <div className="h-1 bg-gradient-to-r from-[#1E3A8A] via-[#38BDF8] to-[#1E3A8A] opacity-90 shadow-sm" />

      {/* Navigation Header */}
      <HeaderNav
        currentView={currentView}
        onNavigate={handleNavigate}
        streakCount={streakInfo.currentStreak}
        cateredForMonth={monthSummary.cateredForMonth}
        actualSavedAtEndOfMonth={monthSummary.actualSavedAtEndOfMonth}
        dailyAllowance={monthSummary.dailyAllowance}
        plannedSavings={monthSummary.plannedSavingsForMonth}
        currentMonthName={monthSummary.monthName}
        currency={settings.currency}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenEditCatered={() => setIsEditCateredOpen(true)}
        selectedDate={selectedDate}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16 px-4 sm:px-6 max-w-6xl mx-auto w-full pt-4">
        {currentView === 'dates' && (
          <DatesStreamView
            entries={entries}
            settings={settings}
            cateredForMonth={monthSummary.cateredForMonth}
            actualSavedAtEndOfMonth={monthSummary.actualSavedAtEndOfMonth}
            monthName={monthSummary.monthName}
            onSelectDate={handleSelectDate}
            onDeleteDate={handleDeleteDate}
            onOpenSummary={() => setCurrentView('summary')}
            onOpenExcel={() => setCurrentView('excel')}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenEditCatered={() => setIsEditCateredOpen(true)}
          />
        )}

        {currentView === 'excel' && (
          <ExcelShoppingSheet
            items={budgetItems}
            settings={settings}
            onUpdateItems={setBudgetItems}
            onSyncToDiary={handleSyncBudgetItemToDiary}
          />
        )}

        {currentView === 'day' && (
          <DayPageView
            dateStr={selectedDate}
            entry={entries[selectedDate]}
            settings={settings}
            onSaveEntry={handleSaveDayEntry}
            onBackToDates={() => setCurrentView('dates')}
            onNavigateDate={(newDate) => {
              setSelectedDate(newDate);
              const [y, m] = newDate.split('-').map(Number);
              setCurrentYear(y);
              setCurrentMonth(m);
            }}
          />
        )}

        {currentView === 'summary' && (
          <SummaryView
            year={currentYear}
            month={currentMonth}
            entries={entries}
            budgetItems={budgetItems}
            settings={settings}
            onUpdateMonthReflection={handleUpdateMonthReflection}
            onNavigateToDates={() => setCurrentView('dates')}
            onNavigateToDay={(dayStr) => {
              setSelectedDate(dayStr);
              setCurrentView('day');
            }}
            onNavigateToExcel={() => setCurrentView('excel')}
            onOpenEditCatered={() => setIsEditCateredOpen(true)}
            onMonthChange={(y, m) => {
              setCurrentYear(y);
              setCurrentMonth(m);
            }}
          />
        )}
      </main>

      {/* Sleek Blue-Black Footer */}
      <footer className="border-t border-[#1E2B45] bg-[#0A1020] py-6 text-center text-xs text-[#64748B]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-serif italic text-[#94A3B8]">
            "Budget Expenses — Catered monthly budget, Excel shopping list, and end-of-month savings."
          </p>
          <div className="flex items-center gap-4 text-[11px] text-[#64748B] flex-wrap justify-center">
            <span>{monthSummary.monthName} Catered: {settings.currency} {monthSummary.cateredForMonth.toLocaleString()}</span>
            <span>·</span>
            <span>Saved at End of Month: {settings.currency} {monthSummary.actualSavedAtEndOfMonth.toLocaleString()}</span>
            <span>·</span>
            <span>Press <kbd className="px-1 py-0.5 bg-[#1E293B] text-[#93C5FD] rounded border border-[#334155]">E</kbd> for Excel</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EditMonthlyCateredModal
        isOpen={isEditCateredOpen}
        onClose={() => setIsEditCateredOpen(false)}
        yearMonthKey={monthSummary.yearMonthKey}
        monthName={monthSummary.monthName}
        currentCatered={monthSummary.cateredForMonth}
        currentPlannedSavings={monthSummary.plannedSavingsForMonth}
        totalSpentSoFar={monthSummary.totalSpent}
        currency={settings.currency}
        onSave={handleSaveMonthlyCatered}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        entries={entries}
        currency={settings.currency}
        onSelectResultDate={(dateStr) => {
          setSelectedDate(dateStr);
          const [y, m] = dateStr.split('-').map(Number);
          setCurrentYear(y);
          setCurrentMonth(m);
          setCurrentView('day');
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetSampleData={handleResetSampleData}
        onClearAllData={handleClearAllData}
      />
    </div>
  );
}
