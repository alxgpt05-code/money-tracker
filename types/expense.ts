export interface MonthlyBudget {
  id: string;
  userId: string;
  year: number;
  month: number;
  amount: number;
}

export interface ExpenseCategory {
  id: string;
  userId: string;
  name: string;
  color?: string;
  isSystem?: boolean;
  isArchived?: boolean;
}

export interface Expense {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  spentAt: string;
  note?: string;
}

export interface CreateExpenseInput {
  amount: number;
  spentAtDayKey: string;
  categoryId?: string;
}

export interface UpdateExpenseInput {
  amount: number;
  spentAtDayKey: string;
  categoryId: string;
}

export interface DailyExpensePoint {
  dateIso: string;
  dateKey: string;
  day: number;
  weekdayShort: string;
  amount: number;
}

export interface MonthlyExpensePoint {
  monthStartIso: string;
  monthLabel: string;
  amount: number;
}

export interface ExpenseHistoryItem {
  id: string;
  category: ExpenseCategory;
  amount: number;
  dateIso: string;
  dateKey: string;
}

export interface ExpenseHistoryGroup {
  id: string;
  label: string;
  dateIso: string;
  dateKey: string;
  items: ExpenseHistoryItem[];
}

export interface DashboardMonthData {
  monthKey: string;
  monthStartIso: string;
  monthLabel: string;
  budget: number | null;
  totalExpenses: number;
  dailyExpenses: DailyExpensePoint[];
  history: ExpenseHistoryGroup[];
}

export interface DashboardMockData {
  currentMonthKey: string;
  months: DashboardMonthData[];
  monthlyExpenses: MonthlyExpensePoint[];
}

export interface MockExpenseStore {
  userId: string;
  categories: ExpenseCategory[];
  budgets: MonthlyBudget[];
  expenses: Expense[];
}
