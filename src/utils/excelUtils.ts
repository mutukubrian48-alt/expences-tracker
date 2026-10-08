import * as XLSX from 'xlsx';
import { BudgetItem } from '../types';

export const STORAGE_KEY_BUDGET_ITEMS = 'folio_budget_shopping_items_v1';

export function calculateItemAllocated(item: BudgetItem): number {
  return (Number(item.allocatedPrice) || 0) * (Number(item.allocatedQuantity) || 1);
}

export function calculateItemSpent(item: BudgetItem): number {
  if (item.status === 'bought') {
    return (Number(item.actualPrice) || 0) * (Number(item.actualQuantity) || 1);
  }
  return 0;
}

export function calculateItemBalance(item: BudgetItem): number {
  const allocated = calculateItemAllocated(item);
  const spent = calculateItemSpent(item);
  if (item.status === 'bought') {
    return allocated - spent;
  }
  return allocated;
}

export function generateSampleBudgetItems(): BudgetItem[] {
  return [
    {
      id: 'bi-1',
      name: 'Naivas Groceries (Maize flour, rice, cooking oil, spices)',
      category: 'Groceries & Pantry',
      allocatedPrice: 3000,
      allocatedQuantity: 1,
      actualPrice: 3200,
      actualQuantity: 1,
      status: 'bought',
      dateBought: '2026-10-06',
      timeBought: '17:10',
      note: 'Bought extra cooking oil on offer',
    },
    {
      id: 'bi-2',
      name: 'Wi-Fi Home Internet Fiber Monthly Bundle',
      category: 'M-Pesa & Airtime',
      allocatedPrice: 2500,
      allocatedQuantity: 1,
      actualPrice: 2500,
      actualQuantity: 1,
      status: 'bought',
      dateBought: '2026-10-01',
      timeBought: '08:30',
      note: 'Prompt payment on 1st of month',
    },
    {
      id: 'bi-3',
      name: '13kg Gas Cylinder Refill',
      category: 'Home & Living',
      allocatedPrice: 2800,
      allocatedQuantity: 1,
      actualPrice: 3100,
      actualQuantity: 1,
      status: 'bought',
      dateBought: '2026-10-05',
      timeBought: '14:20',
      note: 'Gas price went up at local depot (-KSh 300 over budget)',
    },
    {
      id: 'bi-4',
      name: 'Work Shoes / Formal Loafers',
      category: 'Home & Living',
      allocatedPrice: 4500,
      allocatedQuantity: 1,
      actualPrice: 4000,
      actualQuantity: 1,
      status: 'planned',
      note: 'Planning to purchase this weekend at Bata / CBD',
    },
    {
      id: 'bi-5',
      name: 'Chemist Vitamins & Winter Cough Syrup',
      category: 'Health & Chemist',
      allocatedPrice: 1200,
      allocatedQuantity: 1,
      actualPrice: 1200,
      actualQuantity: 1,
      status: 'planned',
      note: 'Restocking the medicine cabinet',
    },
    {
      id: 'bi-6',
      name: 'Monthly M-Shwari Savings Lock Deposit',
      category: 'Savings & Stash',
      allocatedPrice: 20000,
      allocatedQuantity: 1,
      actualPrice: 20000,
      actualQuantity: 1,
      status: 'bought',
      dateBought: '2026-10-01',
      timeBought: '09:00',
      note: 'Locked away for planned savings goal',
    },
  ];
}

/**
 * Export budget items into a genuine formatted .xlsx spreadsheet file
 */
export function exportBudgetToExcelFile(
  items: BudgetItem[],
  currency: string = 'KSh',
  monthName: string = 'October 2026'
) {
  const rows: Record<string, any>[] = items.map((item, index) => {
    const allocatedTotal = calculateItemAllocated(item);
    const actualSpend = calculateItemSpent(item);
    const balance = item.status === 'bought' ? allocatedTotal - actualSpend : allocatedTotal;
    const isNegative = balance < 0;

    return {
      '#': index + 1,
      'Item Name': item.name,
      'Category': item.category,
      [`Allocated Price (${currency})`]: item.allocatedPrice,
      'Allocated Qty': item.allocatedQuantity,
      [`Total Allocated (${currency})`]: allocatedTotal,
      [`Actual Price (${currency})`]: item.status === 'bought' ? item.actualPrice : '',
      'Qty Bought': item.status === 'bought' ? item.actualQuantity : '',
      [`Total Spend (${currency})`]: item.status === 'bought' ? actualSpend : 0,
      [`Balance (${currency})`]: balance,
      'Over Budget?': isNegative ? `NEGATIVE (-${Math.abs(balance)})` : 'OK',
      'Status': item.status === 'bought' ? 'BOUGHT' : 'PLANNED',
      'Date Bought': item.dateBought || '',
      'Time Bought': item.timeBought || '',
      'Notes': item.note || '',
    };
  });

  // Calculate totals
  const totalAllocated = items.reduce((sum, item) => sum + calculateItemAllocated(item), 0);
  const totalSpent = items.reduce((sum, item) => sum + calculateItemSpent(item), 0);
  const totalBalance = totalAllocated - totalSpent;

  // Append summary row
  rows.push({
    '#': '',
    'Item Name': 'TOTAL SUMMARY',
    'Category': '',
    [`Allocated Price (${currency})`]: '',
    'Allocated Qty': '',
    [`Total Allocated (${currency})`]: totalAllocated,
    [`Actual Price (${currency})`]: '',
    'Qty Bought': '',
    [`Total Spend (${currency})`]: totalSpent,
    [`Balance (${currency})`]: totalBalance,
    'Over Budget?': totalBalance < 0 ? `NEGATIVE (-${Math.abs(totalBalance)})` : 'SURPLUS',
    'Status': '',
    'Date Bought': '',
    'Time Bought': '',
    'Notes': `Generated on ${new Date().toLocaleDateString()}`,
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 4 }, // #
    { wch: 35 }, // Item Name
    { wch: 20 }, // Category
    { wch: 18 }, // Allocated Price
    { wch: 14 }, // Allocated Qty
    { wch: 18 }, // Total Allocated
    { wch: 16 }, // Actual Price
    { wch: 12 }, // Qty Bought
    { wch: 18 }, // Total Spend
    { wch: 16 }, // Balance
    { wch: 16 }, // Over budget
    { wch: 12 }, // Status
    { wch: 14 }, // Date
    { wch: 12 }, // Time
    { wch: 30 }, // Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Shopping Budget & Spend');

  const filename = `Budget_Expenses_Shopping_List_${monthName.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Import items from an uploaded Excel or CSV file
 */
export async function parseBudgetFromExcelFile(file: File): Promise<BudgetItem[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);

  const imported: BudgetItem[] = [];

  rawRows.forEach((row, idx) => {
    // Skip empty or summary rows
    const name = row['Item Name'] || row['Item'] || row['name'] || row['ITEM'];
    if (!name || String(name).includes('TOTAL SUMMARY')) return;

    const allocatedPriceKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('allocated price') || k.toLowerCase().includes('planned price')
    );
    const allocatedPrice = parseFloat(row[allocatedPriceKey || ''] || row['Allocated Price'] || row['price'] || 0) || 0;

    const allocatedQtyKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('allocated qty') || k.toLowerCase().includes('quantity')
    );
    const allocatedQuantity = parseFloat(row[allocatedQtyKey || ''] || row['Allocated Qty'] || row['qty'] || 1) || 1;

    const actualPriceKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('actual price') || k.toLowerCase().includes('price bought')
    );
    const actualPrice = parseFloat(row[actualPriceKey || ''] || row['Actual Price'] || 0) || 0;

    const actualQtyKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('qty bought') || k.toLowerCase().includes('actual qty')
    );
    const actualQuantity = parseFloat(row[actualQtyKey || ''] || row['Qty Bought'] || 1) || 1;

    const statusVal = String(row['Status'] || '').toLowerCase();
    const isBought = statusVal.includes('bought') || actualPrice > 0;

    imported.push({
      id: `bi-imported-${Date.now()}-${idx}`,
      name: String(name),
      category: row['Category'] || 'Groceries & Pantry',
      allocatedPrice,
      allocatedQuantity,
      actualPrice: actualPrice || allocatedPrice,
      actualQuantity,
      status: isBought ? 'bought' : 'planned',
      dateBought: row['Date Bought'] || undefined,
      timeBought: row['Time Bought'] || undefined,
      note: row['Notes'] || row['Note'] || '',
    });
  });

  return imported;
}
