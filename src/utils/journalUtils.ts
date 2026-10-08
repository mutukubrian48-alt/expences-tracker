import { DayEntry, ExpenseItem, MoodType, MOOD_DEFINITIONS, UserSettings } from '../types';

export const STORAGE_KEY_ENTRIES = 'folio_journal_entries_v2_kes';
export const STORAGE_KEY_SETTINGS = 'folio_journal_settings_v2_kes';

export const DEFAULT_SETTINGS: UserSettings = {
  monthlyBudget: 50000, // Default base spending cap
  plannedSavings: 20000, // Default planned savings target
  monthlyIncome: 70000, // Monthly income
  currency: 'KSh',
  monthlyCateredBudgets: {
    '2026-10': 60000, // Amount catered for October
  },
  monthlyPlannedSavings: {
    '2026-10': 20000,
  },
  monthReflections: {
    '2026-10': 'Catered KSh 60,000 for October with a goal to lock KSh 20,000 into savings. Tracking daily to see final amount saved at month end.',
  },
};

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatTimeDisplay(timeStr?: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${mStr || '00'} ${period}`;
}

export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateToIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatHumanDate(dateStr: string): string {
  const date = parseDateString(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatLongHumanDate(dateStr: string): string {
  const date = parseDateString(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getRelativeDayDescription(dateStr: string): string {
  const todayStr = getTodayDateString();
  if (dateStr === todayStr) return 'Today';

  const today = parseDateString(todayStr);
  const target = parseDateString(dateStr);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  return `In ${diffDays} days`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getMonthName(monthNumber: number): string {
  const date = new Date(2026, monthNumber - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long' });
}

export function getDayTotal(entry?: DayEntry): number {
  if (!entry || !entry.expenses) return 0;
  return entry.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

export function formatMoney(amount: number, currency: string = 'KSh'): string {
  const formatted = Math.round(amount).toLocaleString('en-US');
  return `${currency} ${formatted}`;
}

export function isEntryActive(entry?: DayEntry): boolean {
  if (!entry) return false;
  const hasExpenses = entry.expenses && entry.expenses.length > 0;
  const hasReflection = Boolean(entry.reflection && entry.reflection.trim().length > 0);
  const hasMood = Boolean(entry.mood);
  return hasExpenses || hasReflection || hasMood;
}

export function calculateStreak(entries: Record<string, DayEntry>, todayStr: string = getTodayDateString()): {
  currentStreak: number;
  longestStreak: number;
} {
  let streak = 0;
  const cursor = parseDateString(todayStr);

  const todayEntry = entries[todayStr];
  let checkDate = cursor;

  if (!isEntryActive(todayEntry)) {
    const yesterday = new Date(cursor);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateToIso(yesterday);
    if (!isEntryActive(entries[yesterdayStr])) {
      return { currentStreak: 0, longestStreak: 0 };
    }
    checkDate = yesterday;
  }

  const walkDate = new Date(checkDate);
  while (true) {
    const iso = formatDateToIso(walkDate);
    if (isEntryActive(entries[iso])) {
      streak++;
      walkDate.setDate(walkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    currentStreak: streak,
    longestStreak: Math.max(streak, 9),
  };
}

export interface MonthSummaryData {
  year: number;
  month: number;
  yearMonthKey: string;
  monthName: string;
  cateredForMonth: number; // The amount catered specifically for this month
  plannedSavingsForMonth: number; // The savings target for this month
  totalSpent: number;
  actualSavedAtEndOfMonth: number; // What you actually saved at the end of the month (Catered - Spent)
  isSavingsTargetMet: boolean;
  savingsRatePercent: number;
  monthlyBudget: number;
  remainingBudget: number;
  daysInMonth: number;
  daysPassed: number;
  dailyAllowance: number;
  actualDailyAverage: number;
  activeLoggingDays: number;
  zeroSpendDays: number;
  categoryBreakdown: { category: string; amount: number; percentage: number; count: number }[];
  moodInsights: {
    mood: MoodType;
    label: string;
    symbol: string;
    count: number;
    totalAmount: number;
    averageAmount: number;
  }[];
  chronicleEntries: {
    date: string;
    dateLabel: string;
    mood?: MoodType;
    reflection?: string;
    dayTotal: number;
    expenses: ExpenseItem[];
  }[];
}

export function computeMonthSummary(
  year: number,
  month: number,
  entries: Record<string, DayEntry>,
  settings: UserSettings,
  todayStr: string = getTodayDateString()
): MonthSummaryData {
  const daysInMonth = getDaysInMonth(year, month);
  const yearMonthKey = `${year}-${String(month).padStart(2, '0')}`;
  const monthName = getMonthName(month);

  // Look up amount catered for this specific month
  const cateredForMonth =
    settings.monthlyCateredBudgets?.[yearMonthKey] !== undefined
      ? settings.monthlyCateredBudgets[yearMonthKey]
      : settings.monthlyBudget;

  const plannedSavingsForMonth =
    settings.monthlyPlannedSavings?.[yearMonthKey] !== undefined
      ? settings.monthlyPlannedSavings[yearMonthKey]
      : settings.plannedSavings;

  let totalSpent = 0;
  let activeLoggingDays = 0;
  let zeroSpendDays = 0;
  const categoryMap: Record<string, { amount: number; count: number }> = {};
  const moodMap: Record<MoodType, { count: number; totalAmount: number }> = {
    peaceful: { count: 0, totalAmount: 0 },
    content: { count: 0, totalAmount: 0 },
    stressed: { count: 0, totalAmount: 0 },
    celebratory: { count: 0, totalAmount: 0 },
    impulsive: { count: 0, totalAmount: 0 },
    tired: { count: 0, totalAmount: 0 },
    thoughtful: { count: 0, totalAmount: 0 },
    grateful: { count: 0, totalAmount: 0 },
  };

  const chronicleEntries: MonthSummaryData['chronicleEntries'] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${yearMonthKey}-${String(day).padStart(2, '0')}`;
    const entry = entries[dayStr];
    const dayTotal = getDayTotal(entry);

    if (entry && isEntryActive(entry)) {
      activeLoggingDays++;
      if (dayTotal === 0) {
        zeroSpendDays++;
      }
    }

    if (entry) {
      if (entry.mood) {
        moodMap[entry.mood].count += 1;
        moodMap[entry.mood].totalAmount += dayTotal;
      }

      if (entry.expenses && entry.expenses.length > 0) {
        entry.expenses.forEach((item) => {
          const amt = Number(item.amount) || 0;
          totalSpent += amt;
          const cat = item.category || 'Other Notes';
          if (!categoryMap[cat]) categoryMap[cat] = { amount: 0, count: 0 };
          categoryMap[cat].amount += amt;
          categoryMap[cat].count += 1;
        });
      }

      if (isEntryActive(entry)) {
        chronicleEntries.push({
          date: dayStr,
          dateLabel: formatHumanDate(dayStr),
          mood: entry.mood,
          reflection: entry.reflection,
          dayTotal,
          expenses: entry.expenses || [],
        });
      }
    }
  }

  chronicleEntries.sort((a, b) => a.date.localeCompare(b.date));

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  const moodInsights = (Object.keys(moodMap) as MoodType[])
    .filter((m) => moodMap[m].count > 0)
    .map((m) => {
      const def = MOOD_DEFINITIONS[m];
      const count = moodMap[m].count;
      const totalAmount = moodMap[m].totalAmount;
      return {
        mood: m,
        label: def.label,
        symbol: def.symbol,
        count,
        totalAmount,
        averageAmount: count > 0 ? totalAmount / count : 0,
      };
    })
    .sort((a, b) => b.averageAmount - a.averageAmount);

  const [todayYear, todayMonth, todayDay] = todayStr.split('-').map(Number);
  let daysPassed = daysInMonth;
  if (year === todayYear && month === todayMonth) {
    daysPassed = Math.min(todayDay, daysInMonth);
  } else if (year > todayYear || (year === todayYear && month > todayMonth)) {
    daysPassed = 0;
  }

  const dailyAllowance = daysInMonth > 0 ? cateredForMonth / daysInMonth : 0;
  const actualDailyAverage = daysPassed > 0 ? totalSpent / daysPassed : 0;
  const remainingBudget = cateredForMonth - totalSpent;

  // What you have saved at the end of the month:
  // Catered For Month - Total Spent = What is saved
  const actualSavedAtEndOfMonth = cateredForMonth - totalSpent;
  const isSavingsTargetMet = actualSavedAtEndOfMonth >= plannedSavingsForMonth;
  const savingsRatePercent =
    cateredForMonth > 0
      ? Math.max(0, Math.round((actualSavedAtEndOfMonth / cateredForMonth) * 100))
      : 0;

  return {
    year,
    month,
    yearMonthKey,
    monthName,
    cateredForMonth,
    plannedSavingsForMonth,
    totalSpent,
    actualSavedAtEndOfMonth,
    isSavingsTargetMet,
    savingsRatePercent,
    monthlyBudget: cateredForMonth,
    remainingBudget,
    daysInMonth,
    daysPassed,
    dailyAllowance,
    actualDailyAverage,
    activeLoggingDays,
    zeroSpendDays,
    categoryBreakdown,
    moodInsights,
    chronicleEntries,
  };
}

export function generateSampleEntries(): Record<string, DayEntry> {
  const todayStr = getTodayDateString();
  const [yearStr, monthStr] = todayStr.split('-');
  const prefix = `${yearStr}-${monthStr}`;

  return {
    [`${prefix}-01`]: {
      date: `${prefix}-01`,
      mood: 'thoughtful',
      reflection: 'New month beginning. Catered KSh 60,000 for October expenses. Transferred KSh 10,000 into my savings stash.',
      expenses: [
        {
          id: 'exp-1',
          amount: 2500,
          category: 'M-Pesa & Airtime',
          note: 'Wi-Fi home internet bundle renewal for the month via M-Pesa',
          time: '08:30',
          createdAt: `${prefix}-01T08:30:00Z`,
        },
      ],
      updatedAt: `${prefix}-01T20:00:00Z`,
    },
    [`${prefix}-02`]: {
      date: `${prefix}-02`,
      mood: 'content',
      reflection: 'Steady work day. Packed lunch from home, only had chai in the morning.',
      expenses: [
        {
          id: 'exp-2',
          amount: 180,
          category: 'Chai & Snacks',
          note: 'Spiced chai and ndazi at the cafe downstairs',
          time: '10:15',
          createdAt: `${prefix}-02T10:15:00Z`,
        },
      ],
      updatedAt: `${prefix}-02T19:00:00Z`,
    },
    [`${prefix}-03`]: {
      date: `${prefix}-03`,
      mood: 'peaceful',
      reflection: 'Zero spend day! Cooked yellow beans and rice, took an evening walk around the estate.',
      expenses: [],
      updatedAt: `${prefix}-03T21:15:00Z`,
    },
    [`${prefix}-04`]: {
      date: `${prefix}-04`,
      mood: 'celebratory',
      reflection: 'Celebrated Brian starting his new software gig. Shared nyama choma and laughs.',
      expenses: [
        {
          id: 'exp-3',
          amount: 2200,
          category: 'Food & Dining',
          note: 'Nyama choma platter and drinks with Brian & Kevin',
          time: '19:45',
          createdAt: `${prefix}-04T19:45:00Z`,
        },
        {
          id: 'exp-4',
          amount: 450,
          category: 'Matatu & Boda Boda',
          note: 'Late night Uber ride home from Kilimani',
          time: '23:10',
          createdAt: `${prefix}-04T23:10:00Z`,
        },
      ],
      updatedAt: `${prefix}-04T23:45:00Z`,
    },
    [`${prefix}-05`]: {
      date: `${prefix}-05`,
      mood: 'grateful',
      reflection: 'Sunday rest. Sent mum some upkeep money to brighten her week.',
      expenses: [
        {
          id: 'exp-5',
          amount: 1500,
          category: 'Family & Social Support',
          note: 'Sent mum upkeep token via M-Pesa',
          time: '11:20',
          createdAt: `${prefix}-05T11:20:00Z`,
        },
      ],
      updatedAt: `${prefix}-05T18:20:00Z`,
    },
    [`${prefix}-06`]: {
      date: `${prefix}-06`,
      mood: 'peaceful',
      reflection: 'Stocked up the kitchen for the whole week to save on takeaway meals.',
      expenses: [
        {
          id: 'exp-6',
          amount: 3200,
          category: 'Groceries & Pantry',
          note: 'Naivas supermarket grocery run — rice, maize flour, veggies, milk, fruits',
          time: '17:10',
          createdAt: `${prefix}-06T17:10:00Z`,
        },
      ],
      updatedAt: `${prefix}-06T17:30:00Z`,
    },
    [`${prefix}-07`]: {
      date: `${prefix}-07`,
      mood: 'content',
      reflection: 'Smooth Tuesday commute. No traffic along the expressway corridor.',
      expenses: [
        {
          id: 'exp-7',
          amount: 200,
          category: 'Matatu & Boda Boda',
          note: 'Morning matatu fare to town and evening commute',
          time: '07:45',
          createdAt: `${prefix}-07T07:45:00Z`,
        },
      ],
      updatedAt: `${prefix}-07T19:30:00Z`,
    },
    [`${prefix}-08`]: {
      date: `${prefix}-08`,
      mood: 'stressed',
      reflection: 'Sprint deadline had me rushing around all afternoon. Needed lunch out to decompress.',
      expenses: [
        {
          id: 'exp-8',
          amount: 450,
          category: 'Food & Dining',
          note: 'Spent KSh 450 on lunch — stressed about the deadline',
          time: '13:15',
          createdAt: `${prefix}-08T13:15:00Z`,
        },
        {
          id: 'exp-9',
          amount: 280,
          category: 'Chai & Snacks',
          note: 'Dawa tea and honey at 4 PM to calm my throat and head',
          time: '16:05',
          createdAt: `${prefix}-08T16:05:00Z`,
        },
      ],
      updatedAt: `${prefix}-08T16:15:00Z`,
    },
  };
}
