import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  BookOpen,
  Filter,
  Check,
} from 'lucide-react';
import { BudgetItem, DEFAULT_CATEGORIES, ExpenseItem, UserSettings } from '../types';
import {
  calculateItemAllocated,
  calculateItemBalance,
  calculateItemSpent,
  exportBudgetToExcelFile,
  parseBudgetFromExcelFile,
} from '../utils/excelUtils';
import {
  formatMoney,
  formatTimeDisplay,
  getCurrentTimeString,
  getTodayDateString,
} from '../utils/journalUtils';

interface ExcelShoppingSheetProps {
  items: BudgetItem[];
  settings: UserSettings;
  onUpdateItems: (items: BudgetItem[]) => void;
  onSyncToDiary?: (item: BudgetItem) => void;
}

export const ExcelShoppingSheet: React.FC<ExcelShoppingSheetProps> = ({
  items,
  settings,
  onUpdateItems,
  onSyncToDiary,
}) => {
  const todayStr = getTodayDateString();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for adding a new item
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemNote, setNewItemNote] = useState('');

  // Filter & Search
  const [filterStatus, setFilterStatus] = useState<'all' | 'planned' | 'bought' | 'negative'>('all');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Totals
  const totalAllocated = items.reduce((sum, item) => sum + calculateItemAllocated(item), 0);
  const totalSpent = items.reduce((sum, item) => sum + calculateItemSpent(item), 0);
  const netBalance = totalAllocated - totalSpent;
  const isNetNegative = netBalance < 0;

  // Negative / over-allocated items count
  const negativeItemsCount = items.filter(
    (item) => item.status === 'bought' && calculateItemBalance(item) < 0
  ).length;

  // Add Item
  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim()) return;

    const parsedPrice = parseFloat(newItemPrice) || 0;
    const parsedQty = parseFloat(newItemQty) || 1;

    const newItem: BudgetItem = {
      id: `bi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newItemName.trim(),
      category: newItemCategory,
      allocatedPrice: parsedPrice,
      allocatedQuantity: parsedQty,
      actualPrice: parsedPrice, // default to allocated
      actualQuantity: parsedQty,
      status: 'planned',
      note: newItemNote.trim(),
    };

    onUpdateItems([newItem, ...items]);

    // Reset inputs
    setNewItemName('');
    setNewItemPrice('');
    setNewItemQty('1');
    setNewItemNote('');
  };

  // Delete Item
  const handleDeleteItem = (id: string) => {
    onUpdateItems(items.filter((item) => item.id !== id));
  };

  // Update cell field inline
  const handleUpdateField = (id: string, field: keyof BudgetItem, val: any) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: val };
      }
      return item;
    });
    onUpdateItems(updated);
  };

  // Toggle status Bought / Planned
  const handleToggleBought = (item: BudgetItem) => {
    const isNowBought = item.status !== 'bought';
    const updated = items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: isNowBought ? ('bought' as const) : ('planned' as const),
          dateBought: isNowBought ? (i.dateBought || todayStr) : undefined,
          timeBought: isNowBought ? (i.timeBought || getCurrentTimeString()) : undefined,
        };
      }
      return i;
    });
    onUpdateItems(updated);

    // If marked as bought and sync callback provided
    if (isNowBought && onSyncToDiary) {
      const updatedItem = updated.find((i) => i.id === item.id)!;
      onSyncToDiary(updatedItem);
      setSyncNotice(`Synced "${item.name}" to today's diary entry!`);
      setTimeout(() => setSyncNotice(null), 3000);
    }
  };

  // Export to real Excel .xlsx
  const handleExportExcel = () => {
    exportBudgetToExcelFile(items, settings.currency, 'October 2026');
  };

  // Import from Excel file
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await parseBudgetFromExcelFile(file);
      if (imported.length > 0) {
        onUpdateItems([...imported, ...items]);
        setSyncNotice(`Successfully imported ${imported.length} items from Excel!`);
        setTimeout(() => setSyncNotice(null), 3000);
      }
    } catch (err) {
      console.error('Failed to parse Excel file:', err);
    }
  };

  // Filtered items
  const filteredItems = items.filter((item) => {
    if (filterStatus === 'planned') return item.status === 'planned';
    if (filterStatus === 'bought') return item.status === 'bought';
    if (filterStatus === 'negative') return item.status === 'bought' && calculateItemBalance(item) < 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats & Excel Actions */}
      <div className="blueblack-sheet rounded-3xl p-6 sm:p-8 border border-[#1E2B45] relative overflow-hidden shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#38BDF8]">
              <FileSpreadsheet className="w-4 h-4 text-[#38BDF8]" />
              <span>Interactive Excel Shopping & Budget Sheet</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#F1F5F9] mt-1">
              Shopping List & Spending Allocations
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 max-w-2xl">
              Write down your planned purchases with allocated prices. As you record actual purchases, balances update dynamically. Any overspending is highlighted with a negative balance.
            </p>
          </div>

          {/* Action buttons: Export & Import Excel */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#1D4ED8] hover:bg-[#2563EB] text-white shadow-md transition-colors cursor-pointer"
              title="Download formatted .xlsx Excel file with calculations"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel (.xlsx)</span>
            </button>

            <label className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl bg-[#0D1527] hover:bg-[#1E293B] border border-[#223354] text-[#CBD5E1] transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Import Excel</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportExcel}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Sync notification */}
        {syncNotice && (
          <div className="mt-4 p-3 rounded-xl bg-[#064E3B]/60 border border-[#059669] text-xs text-[#34D399] flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4" />
            <span>{syncNotice}</span>
          </div>
        )}

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#1E2B45]">
          {/* Total Allocated */}
          <div className="p-3.5 rounded-xl bg-[#0A1020] border border-[#223354]">
            <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">
              Budget Dedicated
            </span>
            <div className="font-serif text-lg sm:text-xl font-bold text-[#F1F5F9] mt-0.5">
              {formatMoney(totalAllocated, settings.currency)}
            </div>
            <span className="text-[10px] text-[#64748B]">All planned items</span>
          </div>

          {/* Total Spent */}
          <div className="p-3.5 rounded-xl bg-[#0A1020] border border-[#223354]">
            <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">
              Amount Spent
            </span>
            <div className="font-serif text-lg sm:text-xl font-bold text-[#F1F5F9] mt-0.5">
              {formatMoney(totalSpent, settings.currency)}
            </div>
            <span className="text-[10px] text-[#64748B]">On bought items</span>
          </div>

          {/* Balance / Variance */}
          <div
            className={`p-3.5 rounded-xl border ${
              isNetNegative
                ? 'bg-[#450A0A]/40 border-[#7F1D1D]'
                : 'bg-[#064E3B]/30 border-[#059669]/60'
            }`}
          >
            <span
              className={`text-[10px] font-mono uppercase block ${
                isNetNegative ? 'text-[#F87171]' : 'text-[#34D399]'
              }`}
            >
              Net Balance
            </span>
            <div
              className={`font-serif text-lg sm:text-xl font-bold mt-0.5 ${
                isNetNegative ? 'text-[#F87171]' : 'text-[#34D399]'
              }`}
            >
              {isNetNegative ? '-' : '+'}
              {formatMoney(Math.abs(netBalance), settings.currency)}
            </div>
            <span className="text-[10px] text-[#94A3B8]">
              {isNetNegative ? 'Negative variance' : 'Surplus remaining'}
            </span>
          </div>

          {/* Over-budget alerts */}
          <div className="p-3.5 rounded-xl bg-[#0A1020] border border-[#223354]">
            <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">
              Over-budget Items
            </span>
            <div className="font-serif text-lg sm:text-xl font-bold text-[#F1F5F9] mt-0.5">
              {negativeItemsCount}{' '}
              <span className="text-xs font-sans font-normal text-[#94A3B8]">
                {negativeItemsCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <span className="text-[10px] text-[#F87171]">
              {negativeItemsCount > 0 ? 'Exceeded allocation' : 'All within budget'}
            </span>
          </div>
        </div>
      </div>

      {/* Add New Item Form Row */}
      <div className="blueblack-card rounded-2xl p-4 sm:p-5 border border-[#223354] shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#38BDF8] flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add item to shopping budget
          </span>
          <span className="text-[11px] text-[#64748B] font-mono hidden sm:inline">
            Directly updates spreadsheet & cycle
          </span>
        </div>

        <form onSubmit={handleAddItem} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            {/* Item Name */}
            <div className="sm:col-span-4">
              <label className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">Item to be bought</label>
              <input
                type="text"
                placeholder="e.g. 13kg Gas refill, Naivas groceries, Loafers"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#223354] bg-[#080D1A] text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
              />
            </div>

            {/* Category */}
            <div className="sm:col-span-3">
              <label className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">Category</label>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#223354] bg-[#080D1A] text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Allocated Price */}
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">Price (KSh)</label>
              <input
                type="number"
                step="1"
                placeholder="0"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-[#223354] bg-[#080D1A] text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
              />
            </div>

            {/* Qty */}
            <div className="sm:col-span-1">
              <label className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">Qty</label>
              <input
                type="number"
                step="1"
                min="1"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-[#223354] bg-[#080D1A] text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
              />
            </div>

            {/* Add Button */}
            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={!newItemName}
                className="w-full py-2 text-xs font-semibold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-[#0D1527] p-1 rounded-xl border border-[#1E2B45] text-xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterStatus === 'all' ? 'bg-[#2563EB] text-white' : 'text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            All Items ({items.length})
          </button>
          <button
            onClick={() => setFilterStatus('planned')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterStatus === 'planned' ? 'bg-[#2563EB] text-white' : 'text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            To be bought ({items.filter((i) => i.status === 'planned').length})
          </button>
          <button
            onClick={() => setFilterStatus('bought')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterStatus === 'bought' ? 'bg-[#2563EB] text-white' : 'text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            Bought ({items.filter((i) => i.status === 'bought').length})
          </button>
          <button
            onClick={() => setFilterStatus('negative')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterStatus === 'negative' ? 'bg-[#EF4444] text-white' : 'text-[#F87171] hover:text-white'
            }`}
          >
            Over-budget ({negativeItemsCount})
          </button>
        </div>

        <span className="text-xs text-[#64748B]">
          Edit prices or quantities inline; changes save automatically.
        </span>
      </div>

      {/* Interactive Spreadsheet Table */}
      <div className="blueblack-sheet rounded-3xl border border-[#1E2B45] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Table Header */}
            <thead className="bg-[#0A1020] text-[#94A3B8] uppercase font-mono tracking-wider border-b border-[#1E2B45]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Status</th>
                <th className="py-3 px-4 min-w-[200px]">Item to be bought</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Allocated Price</th>
                <th className="py-3 px-3 text-right w-16">Alloc. Qty</th>
                <th className="py-3 px-3 text-right">Total Allocated</th>
                <th className="py-3 px-3 text-right">Actual Price</th>
                <th className="py-3 px-3 text-right w-16">Qty Bought</th>
                <th className="py-3 px-3 text-right">Total Spent</th>
                <th className="py-3 px-4 text-right min-w-[140px]">Balance / Variance</th>
                <th className="py-3 px-3 text-center w-12">Delete</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#1A263E] text-[#F1F5F9]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-[#64748B] font-serif italic text-sm">
                    No items in this filter. Use the form above to add items to your budget.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const allocatedTotal = calculateItemAllocated(item);
                  const actualSpend = calculateItemSpent(item);
                  const balance = calculateItemBalance(item);
                  const isNegative = item.status === 'bought' && balance < 0;
                  const isBought = item.status === 'bought';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#111C35]/60 transition-colors group ${
                        isNegative ? 'bg-[#450A0A]/20' : ''
                      }`}
                    >
                      {/* Checkbox / Bought status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleBought(item)}
                          title={isBought ? 'Mark as planned' : 'Mark as bought'}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors cursor-pointer mx-auto ${
                            isBought
                              ? 'bg-[#059669] text-white shadow-xs'
                              : 'border border-[#334155] bg-[#0A1020] hover:border-[#38BDF8]'
                          }`}
                        >
                          {isBought && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      </td>

                      {/* Item Name */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateField(item.id, 'name', e.target.value)}
                          className={`w-full bg-transparent font-medium focus:outline-none focus:bg-[#0A1020] px-1.5 py-0.5 rounded border border-transparent focus:border-[#3B82F6] ${
                            isBought ? 'text-[#CBD5E1]' : 'text-[#F1F5F9]'
                          }`}
                        />
                        {item.note && (
                          <span className="block text-[11px] text-[#64748B] px-1.5 truncate">
                            {item.note}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="text-[#94A3B8] text-[11px]">
                          {item.category}
                        </span>
                      </td>

                      {/* Allocated Price */}
                      <td className="py-3 px-3 text-right font-mono">
                        <input
                          type="number"
                          step="1"
                          value={item.allocatedPrice}
                          onChange={(e) =>
                            handleUpdateField(item.id, 'allocatedPrice', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 text-right bg-transparent focus:outline-none focus:bg-[#0A1020] px-1 py-0.5 rounded border border-transparent focus:border-[#3B82F6] text-[#CBD5E1]"
                        />
                      </td>

                      {/* Allocated Qty */}
                      <td className="py-3 px-3 text-right font-mono">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={item.allocatedQuantity}
                          onChange={(e) =>
                            handleUpdateField(item.id, 'allocatedQuantity', parseFloat(e.target.value) || 1)
                          }
                          className="w-12 text-right bg-transparent focus:outline-none focus:bg-[#0A1020] px-1 py-0.5 rounded border border-transparent focus:border-[#3B82F6] text-[#CBD5E1]"
                        />
                      </td>

                      {/* Total Allocated */}
                      <td className="py-3 px-3 text-right font-mono font-medium text-[#CBD5E1]">
                        {formatMoney(allocatedTotal, settings.currency)}
                      </td>

                      {/* Actual Price */}
                      <td className="py-3 px-3 text-right font-mono">
                        <input
                          type="number"
                          step="1"
                          value={item.actualPrice}
                          onChange={(e) =>
                            handleUpdateField(item.id, 'actualPrice', parseFloat(e.target.value) || 0)
                          }
                          className={`w-20 text-right bg-transparent focus:outline-none focus:bg-[#0A1020] px-1 py-0.5 rounded border border-transparent focus:border-[#3B82F6] ${
                            isBought ? 'text-[#F1F5F9] font-semibold' : 'text-[#64748B]'
                          }`}
                        />
                      </td>

                      {/* Qty Bought */}
                      <td className="py-3 px-3 text-right font-mono">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={item.actualQuantity}
                          onChange={(e) =>
                            handleUpdateField(item.id, 'actualQuantity', parseFloat(e.target.value) || 1)
                          }
                          className={`w-12 text-right bg-transparent focus:outline-none focus:bg-[#0A1020] px-1 py-0.5 rounded border border-transparent focus:border-[#3B82F6] ${
                            isBought ? 'text-[#F1F5F9]' : 'text-[#64748B]'
                          }`}
                        />
                      </td>

                      {/* Total Spend */}
                      <td className="py-3 px-3 text-right font-serif font-bold text-[#F1F5F9]">
                        {isBought ? formatMoney(actualSpend, settings.currency) : '—'}
                      </td>

                      {/* BALANCE / VARIANCE (CRITICAL: Show negative in red if spent > allocated) */}
                      <td className="py-3 px-4 text-right">
                        {isBought ? (
                          isNegative ? (
                            /* NEGATIVE BALANCE: item has gone more than allocated */
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EF4444]/20 border border-[#EF4444]/60 text-[#F87171] font-mono font-bold text-xs">
                              <AlertTriangle className="w-3 h-3 text-[#EF4444]" />
                              <span>-{formatMoney(Math.abs(balance), settings.currency)}</span>
                            </div>
                          ) : (
                            /* POSITIVE BALANCE: within allocated */
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#059669]/20 border border-[#059669]/50 text-[#34D399] font-mono font-medium text-xs">
                              <span>+{formatMoney(balance, settings.currency)}</span>
                            </div>
                          )
                        ) : (
                          <span className="font-mono text-[#94A3B8] text-xs">
                            {formatMoney(allocatedTotal, settings.currency)} planned
                          </span>
                        )}
                      </td>

                      {/* Delete action */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          title="Delete item"
                          className="p-1 text-[#64748B] hover:text-[#EF4444] hover:bg-[#450A0A] rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer with Totals */}
            <tfoot className="bg-[#0A1020] border-t-2 border-[#1E2B45] font-mono text-xs text-[#CBD5E1]">
              <tr>
                <td colSpan={5} className="py-4 px-4 font-bold text-right text-[#94A3B8]">
                  TOTALS:
                </td>
                <td className="py-4 px-3 text-right font-bold text-[#38BDF8]">
                  {formatMoney(totalAllocated, settings.currency)}
                </td>
                <td colSpan={2} className="py-4 px-3 text-right text-[#94A3B8]">
                  Total Spent:
                </td>
                <td className="py-4 px-3 text-right font-bold text-[#F1F5F9]">
                  {formatMoney(totalSpent, settings.currency)}
                </td>
                <td className="py-4 px-4 text-right">
                  <span
                    className={`font-bold text-sm px-2.5 py-1 rounded-md inline-block ${
                      isNetNegative
                        ? 'bg-[#EF4444]/20 border border-[#EF4444]/60 text-[#F87171]'
                        : 'bg-[#059669]/20 border border-[#059669]/60 text-[#34D399]'
                    }`}
                  >
                    {isNetNegative ? '-' : '+'}
                    {formatMoney(Math.abs(netBalance), settings.currency)}
                  </span>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
