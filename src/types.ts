export type MoodType =
  | 'peaceful'
  | 'content'
  | 'stressed'
  | 'celebratory'
  | 'impulsive'
  | 'tired'
  | 'thoughtful'
  | 'grateful';

export interface MoodMeta {
  type: MoodType;
  label: string;
  symbol: string;
  description: string;
  colorClass: string;
}

export const MOOD_DEFINITIONS: Record<MoodType, MoodMeta> = {
  peaceful: {
    type: 'peaceful',
    label: 'Peaceful',
    symbol: '🌿',
    description: 'Calm, grounded, no rush',
    colorClass: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
  },
  content: {
    type: 'content',
    label: 'Content',
    symbol: '☕',
    description: 'A good, steady ordinary day',
    colorClass: 'text-sky-400 bg-sky-950/60 border-sky-800/60',
  },
  stressed: {
    type: 'stressed',
    label: 'Stressed',
    symbol: '⚡',
    description: 'Pressed for time, anxious, deadline crunch',
    colorClass: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
  },
  celebratory: {
    type: 'celebratory',
    label: 'Celebratory',
    symbol: '✨',
    description: 'Milestones, treats, gathering with friends',
    colorClass: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60',
  },
  impulsive: {
    type: 'impulsive',
    label: 'Impulsive',
    symbol: '🌀',
    description: 'Bought on a whim, retail therapy',
    colorClass: 'text-purple-400 bg-purple-950/60 border-purple-800/60',
  },
  tired: {
    type: 'tired',
    label: 'Tired',
    symbol: '🛋️',
    description: 'Low energy, ordered in for convenience',
    colorClass: 'text-slate-400 bg-slate-900/60 border-slate-700/60',
  },
  thoughtful: {
    type: 'thoughtful',
    label: 'Thoughtful',
    symbol: '📖',
    description: 'Reflective, mindful, intentional',
    colorClass: 'text-blue-400 bg-blue-950/60 border-blue-800/60',
  },
  grateful: {
    type: 'grateful',
    label: 'Grateful',
    symbol: '🙏',
    description: 'Appreciating small luxuries and good company',
    colorClass: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60',
  },
};

export const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Chai & Snacks',
  'Groceries & Pantry',
  'Matatu & Boda Boda',
  'Fuel & Travel',
  'M-Pesa & Airtime',
  'Rent & House Bills',
  'Home & Living',
  'Family & Social Support',
  'Health & Chemist',
  'Books & Learning',
  'Savings & Stash',
  'Other Notes',
];

export interface ExpenseItem {
  id: string;
  amount: number;
  category: string;
  note: string; // The note is first-class, not an optional afterthought
  time?: string; // Time recorded or changed (e.g., "13:45" or "1:45 PM")
  createdAt: string;
  budgetItemId?: string; // Optional link to shopping list item
}

export interface DayEntry {
  date: string; // 'YYYY-MM-DD'
  mood?: MoodType;
  reflection?: string; // "How did today go?"
  expenses: ExpenseItem[];
  updatedAt: string;
}

// Shopping list & budget allocation row (Excel linked)
export interface BudgetItem {
  id: string;
  name: string; // Item to be bought
  category: string;
  allocatedPrice: number; // Price allocated per unit
  allocatedQuantity: number; // Amount/quantity allocated
  actualPrice: number; // Actual price paid per unit
  actualQuantity: number; // Actual amount/quantity bought
  status: 'planned' | 'bought';
  dateBought?: string; // Date bought YYYY-MM-DD
  timeBought?: string; // Time bought HH:MM
  note?: string; // Note/comment
}

export interface UserSettings {
  monthlyBudget: number; // Default spending cap
  plannedSavings: number; // Default planned savings target in KSh
  monthlyIncome: number; // Estimated monthly cash in
  currency: string; // e.g. "KSh"
  monthlyCateredBudgets: Record<string, number>; // key: 'YYYY-MM' -> catered amount for that month
  monthlyPlannedSavings: Record<string, number>; // key: 'YYYY-MM' -> savings planned for that month
  monthReflections: Record<string, string>; // key: 'YYYY-MM' -> reflection text
}

export type ActiveView = 'dates' | 'day' | 'excel' | 'summary';
