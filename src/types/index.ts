export type TransactionType = 'expense' | 'income' | 'savings_deposit' | 'savings_withdraw';

export interface User {
  id: string;
  name: string;
  email?: string;
  createdAt: number;
}

export type AccountType = 'cash' | 'card' | 'savings';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  note?: string;
  isRecurring?: boolean;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'expense' | 'income';
  color: string;
  monthlyBudgetLimit?: number;
  active: boolean;
}

export type GoalStatus = 'active' | 'paused' | 'completed';

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  status: GoalStatus;
  createdAt: number;
  note?: string;
}

export type RecurrenceType = 'daily' | 'weekly' | 'monthly';

export interface PlannedTransaction {
  id: string;
  title: string;
  type: 'expense' | 'income';
  amount: number;
  categoryId: string;
  recurrence: RecurrenceType;
  nextDate: string; // YYYY-MM-DD
  active: boolean;
}

export interface NotificationSettings {
  dailyReminder: boolean;
  recurringReminders: boolean;
  savingsReminders: boolean;
  goalDeadlineWarning: boolean;
  categoryLimitWarning: boolean;
}

export interface Settings {
  id: string;
  currency: string;
  currencySymbol: string;
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
  dailyReminderTime: string; // HH:mm e.g. "21:00"
}

export type TimeOfDayFilter = 'all' | 'morning' | 'afternoon' | 'evening' | 'night';

export interface TransactionFilter {
  dateRange: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
  type: 'all' | TransactionType;
  categoryId: string; // 'all' or categoryId
  minAmount?: number;
  maxAmount?: number;
  searchQuery: string;
  timeOfDay: TimeOfDayFilter;
}

export interface AppNotification {
  id: string;
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
  date: string;
  read: boolean;
}
