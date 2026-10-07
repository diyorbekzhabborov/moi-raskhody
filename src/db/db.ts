import Dexie, { type Table } from 'dexie';
import type { 
  User, 
  Account, 
  Transaction, 
  Category, 
  Goal, 
  PlannedTransaction, 
  Settings, 
  AppNotification 
} from '../types';

export class FinanceDatabase extends Dexie {
  users!: Table<User, string>;
  accounts!: Table<Account, string>;
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;
  goals!: Table<Goal, string>;
  plannedTransactions!: Table<PlannedTransaction, string>;
  settings!: Table<Settings, string>;
  notifications!: Table<AppNotification, string>;

  constructor() {
    super('MoiRaskhodyDB');
    this.version(1).stores({
      users: 'id, name, createdAt',
      accounts: 'id, name, type, balance',
      transactions: 'id, type, amount, categoryId, accountId, date, time, createdAt',
      categories: 'id, name, type, active',
      goals: 'id, name, status, deadline',
      plannedTransactions: 'id, type, recurrence, nextDate, active',
      settings: 'id',
      notifications: 'id, date, read'
    });
  }
}

export const db = new FinanceDatabase();

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense categories
  { id: 'cat-food', name: 'Еда', icon: 'Utensils', type: 'expense', color: '#f97316', monthlyBudgetLimit: 1200, active: true },
  { id: 'cat-transport', name: 'Транспорт', icon: 'Car', type: 'expense', color: '#3b82f6', monthlyBudgetLimit: 400, active: true },
  { id: 'cat-housing', name: 'Жильё', icon: 'Home', type: 'expense', color: '#8b5cf6', monthlyBudgetLimit: 1500, active: true },
  { id: 'cat-study', name: 'Учёба', icon: 'GraduationCap', type: 'expense', color: '#06b6d4', monthlyBudgetLimit: 500, active: true },
  { id: 'cat-shopping', name: 'Покупки', icon: 'ShoppingBag', type: 'expense', color: '#ec4899', monthlyBudgetLimit: 800, active: true },
  { id: 'cat-internet', name: 'Связь и интернет', icon: 'Wifi', type: 'expense', color: '#14b8a6', monthlyBudgetLimit: 150, active: true },
  { id: 'cat-subs', name: 'Подписки', icon: 'Tv', type: 'expense', color: '#6366f1', monthlyBudgetLimit: 100, active: true },
  { id: 'cat-leisure', name: 'Развлечения', icon: 'Gamepad2', type: 'expense', color: '#eab308', monthlyBudgetLimit: 300, active: true },
  { id: 'cat-clothes', name: 'Одежда', icon: 'Shirt', type: 'expense', color: '#a855f7', monthlyBudgetLimit: 600, active: true },
  { id: 'cat-health', name: 'Здоровье', icon: 'HeartPulse', type: 'expense', color: '#ef4444', monthlyBudgetLimit: 400, active: true },
  { id: 'cat-gifts', name: 'Подарки', icon: 'Gift', type: 'expense', color: '#f43f5e', monthlyBudgetLimit: 200, active: true },
  { id: 'cat-other-exp', name: 'Другое', icon: 'MoreHorizontal', type: 'expense', color: '#64748b', active: true },

  // Income categories / sources
  { id: 'cat-salary', name: 'Зарплата', icon: 'Briefcase', type: 'income', color: '#10b981', active: true },
  { id: 'cat-part-time', name: 'Подработка', icon: 'Laptop', type: 'income', color: '#059669', active: true },
  { id: 'cat-transfer', name: 'Перевод', icon: 'ArrowDownLeft', type: 'income', color: '#047857', active: true },
  { id: 'cat-gift-inc', name: 'Подарок', icon: 'Gift', type: 'income', color: '#10b981', active: true },
  { id: 'cat-refund', name: 'Возврат', icon: 'RefreshCw', type: 'income', color: '#34d399', active: true },
  { id: 'cat-other-inc', name: 'Другое', icon: 'DollarSign', type: 'income', color: '#6ee7b7', active: true },
];

export const DEFAULT_GOAL: Goal = {
  id: 'goal-main-2026',
  name: 'Накопить 10 000 сомони до конца года',
  targetAmount: 10000,
  currentAmount: 0,
  deadline: '2026-12-31',
  status: 'active',
  createdAt: Date.now(),
  note: 'Главная накопительная цель MVP'
};

export const DEFAULT_SETTINGS: Settings = {
  id: 'app-settings',
  currency: 'TJS',
  currencySymbol: 'TJS',
  theme: 'dark',
  notifications: {
    dailyReminder: true,
    recurringReminders: true,
    savingsReminders: true,
    goalDeadlineWarning: true,
    categoryLimitWarning: true,
  },
  dailyReminderTime: '21:00'
};

export async function seedInitialDataIfNeeded() {
  const CLEAN_SLATE_KEY = 'moi_raskhody_clean_slate_applied_v1';
  const isCleanSlateDone = localStorage.getItem(CLEAN_SLATE_KEY);

  // If previous demo data exists in browser, perform one-time clean wipe
  if (!isCleanSlateDone) {
    await db.transactions.clear();
    await db.plannedTransactions.clear();
    await db.notifications.clear();

    const mainAccount: Account = {
      id: 'acc-main',
      name: 'Основной счёт',
      type: 'card',
      balance: 0,
      currency: 'TJS'
    };

    const savingsAccount: Account = {
      id: 'acc-savings',
      name: 'Накопительный счёт',
      type: 'savings',
      balance: 0,
      currency: 'TJS'
    };

    await db.accounts.bulkPut([mainAccount, savingsAccount]);
    await db.goals.put(DEFAULT_GOAL);

    const welcomeNotif: AppNotification = {
      id: 'notif-welcome',
      type: 'info',
      title: 'Чистый лист готов!',
      message: 'Все тестовые операции и балансы сброшены в 0. Приложение готово к учету ваших личных финансов.',
      date: new Date().toISOString().split('T')[0],
      read: false
    };
    await db.notifications.put(welcomeNotif);

    localStorage.setItem(CLEAN_SLATE_KEY, 'true');
  }

  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.put(DEFAULT_SETTINGS);
  }

  const categoriesCount = await db.categories.count();
  if (categoriesCount === 0) {
    await db.categories.bulkPut(DEFAULT_CATEGORIES);
  }
}
