import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialDataIfNeeded, DEFAULT_CATEGORIES, DEFAULT_GOAL, DEFAULT_SETTINGS } from '../db/db';
import type { 
  Transaction, 
  Category, 
  Goal, 
  Account, 
  PlannedTransaction, 
  Settings, 
  AppNotification 
} from '../types';

interface FinanceContextType {
  isInitialized: boolean;
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  primaryGoal: Goal | undefined;
  accounts: Account[];
  plannedTransactions: PlannedTransaction[];
  settings: Settings;
  notifications: AppNotification[];
  unreadNotifCount: number;

  // Calculated totals (TOR Section 4, 20)
  availableBalance: number;
  savingsTotal: number;
  totalCapital: number;
  todayIncome: number;
  todayExpense: number;
  weekIncome: number;
  weekExpense: number;
  monthIncome: number;
  monthExpense: number;
  monthSavings: number;
  netResultMonth: number;
  savingsRateMonth: number;

  // Goal & Forecast metrics (TOR Section 8, 9, 20)
  goalMetrics: {
    remaining: number;
    progressPercent: number;
    daysRemaining: number;
    monthsRemaining: number;
    recommendedDaily: number;
    recommendedMonthly: number;
    isPaceSufficient: boolean;
    paceWarningMessage: string;
  };
  forecastMetrics: {
    safeDailyLimit: number;
    safeWeeklyLimit: number;
    averageDailySpend: number;
    projectedMonthEndBalance: number;
    isBurnRateHigh: boolean;
    burnRateWarningMessage: string;
  };

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<string>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addCategory: (cat: Omit<Category, 'id'>) => Promise<string>;
  updateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<string>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  depositToSavings: (amount: number, goalId?: string, note?: string) => Promise<void>;
  withdrawFromSavings: (amount: number, goalId?: string, note?: string) => Promise<void>;

  addPlannedTransaction: (item: Omit<PlannedTransaction, 'id'>) => Promise<string>;
  updatePlannedTransaction: (id: string, item: Partial<PlannedTransaction>) => Promise<void>;
  deletePlannedTransaction: (id: string) => Promise<void>;

  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  addNotification: (title: string, message: string, type?: 'info' | 'warning' | 'success') => Promise<void>;

  exportToJson: () => Promise<string>;
  importFromJson: (jsonData: string) => Promise<{ success: boolean; message: string }>;
  resetToDefaults: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize DB and Seed data
  useEffect(() => {
    async function init() {
      try {
        await seedInitialDataIfNeeded();
      } catch (err) {
        console.error('Error seeding DB:', err);
      } finally {
        setIsInitialized(true);
      }
    }
    init();
  }, []);

  // Reactive queries
  const transactionsRaw = useLiveQuery(() => db.transactions.toArray()) ?? [];
  const categoriesRaw = useLiveQuery(() => db.categories.toArray()) ?? [];
  const goalsRaw = useLiveQuery(() => db.goals.toArray()) ?? [];
  const accountsRaw = useLiveQuery(() => db.accounts.toArray()) ?? [];
  const plannedRaw = useLiveQuery(() => db.plannedTransactions.toArray()) ?? [];
  const settingsRaw = useLiveQuery(() => db.settings.get('app-settings'));
  const notificationsRaw = useLiveQuery(() => db.notifications.reverse().toArray()) ?? [];

  const settings = settingsRaw || DEFAULT_SETTINGS;
  const categories = categoriesRaw.length > 0 ? categoriesRaw : DEFAULT_CATEGORIES;
  const goals = goalsRaw.length > 0 ? goalsRaw : [DEFAULT_GOAL];
  const primaryGoal = goals.find((g) => g.status === 'active') || goals[0];

  // Apply theme to HTML root
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Sort transactions by date descending, then time descending
  const transactions = useMemo(() => {
    return [...transactionsRaw].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.time || '').localeCompare(a.time || '');
    });
  }, [transactionsRaw]);

  // Calculations conforming to TOR Section 4, 8, 9, 20
  const calculations = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Current week boundary (Monday of this week)
    const currentDayOfWeek = (now.getDay() + 6) % 7; // 0 for Monday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

    // Current month prefix (YYYY-MM)
    const currentMonthPrefix = todayStr.substring(0, 7);

    let calculatedAvailable = 0;
    let calculatedSavings = 0;

    let todayInc = 0;
    let todayExp = 0;
    let weekInc = 0;
    let weekExp = 0;
    let monthInc = 0;
    let monthExp = 0;
    let monthSav = 0;

    // Summing by transaction type
    for (const tx of transactions) {
      const isToday = tx.date === todayStr;
      const isThisWeek = tx.date >= startOfWeekStr;
      const isThisMonth = tx.date.startsWith(currentMonthPrefix);

      switch (tx.type) {
        case 'income':
          calculatedAvailable += tx.amount;
          if (isToday) todayInc += tx.amount;
          if (isThisWeek) weekInc += tx.amount;
          if (isThisMonth) monthInc += tx.amount;
          break;

        case 'expense':
          calculatedAvailable -= tx.amount;
          if (isToday) todayExp += tx.amount;
          if (isThisWeek) weekExp += tx.amount;
          if (isThisMonth) monthExp += tx.amount;
          break;

        case 'savings_deposit':
          calculatedAvailable -= tx.amount;
          calculatedSavings += tx.amount;
          if (isThisMonth) monthSav += tx.amount;
          break;

        case 'savings_withdraw':
          calculatedAvailable += tx.amount;
          calculatedSavings -= tx.amount;
          break;
      }
    }

    // Accounts base offset
    // Base cash balance from accounts if defined
    const baseAccountBalance = accountsRaw.reduce((sum, acc) => {
      if (acc.type !== 'savings') return sum + acc.balance;
      return sum;
    }, 0);
    const baseSavingsBalance = accountsRaw.reduce((sum, acc) => {
      if (acc.type === 'savings') return sum + acc.balance;
      return sum;
    }, 0);

    // If transactions exist, we use transaction sums or combined
    // In our seed, baseAccountBalance = 4200, baseSavingsBalance = 2500
    // The formula in section 20: Доступный баланс = начальный баланс + доходы − расходы − переводы в накопления + возвраты из накоплений
    // Общие накопления = начальные накопления + переводы в накопления - возвраты
    const availableBalance = baseAccountBalance + calculatedAvailable;
    const savingsTotal = Math.max(0, baseSavingsBalance + calculatedSavings);
    const totalCapital = availableBalance + savingsTotal;

    // Чистый результат = доходы - расходы - переводы в накопления
    const netResultMonth = monthInc - monthExp - monthSav;

    // Процент сбережений = сумма, переведённая в накопления / доходы * 100%
    const savingsRateMonth = monthInc > 0 ? Math.round((monthSav / monthInc) * 100) : 0;

    return {
      availableBalance,
      savingsTotal,
      totalCapital,
      todayIncome: todayInc,
      todayExpense: todayExp,
      weekIncome: weekInc,
      weekExpense: weekExp,
      monthIncome: monthInc,
      monthExpense: monthExp,
      monthSavings: monthSav,
      netResultMonth,
      savingsRateMonth
    };
  }, [transactions, accountsRaw]);

  // Goal metrics (TOR Section 8, 20)
  const goalMetrics = useMemo(() => {
    if (!primaryGoal) {
      return {
        remaining: 0,
        progressPercent: 0,
        daysRemaining: 0,
        monthsRemaining: 0,
        recommendedDaily: 0,
        recommendedMonthly: 0,
        isPaceSufficient: true,
        paceWarningMessage: ''
      };
    }

    const currentVal = calculations.savingsTotal; // or primaryGoal.currentAmount
    const remaining = Math.max(0, primaryGoal.targetAmount - currentVal);
    const progressPercent = Math.min(100, Math.round((currentVal / primaryGoal.targetAmount) * 100));

    const today = new Date();
    const deadlineDate = new Date(primaryGoal.deadline + 'T23:59:59');
    const diffMs = deadlineDate.getTime() - today.getTime();
    const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30.4));

    const recommendedDaily = Math.round((remaining / daysRemaining) * 10) / 10;
    const recommendedMonthly = Math.round(remaining / monthsRemaining);

    // Current monthly savings pace
    const currentPace = calculations.monthSavings;
    const isPaceSufficient = currentPace >= recommendedMonthly || remaining === 0;
    const paceWarningMessage = isPaceSufficient
      ? ''
      : `Текущего темпа недостаточно — нужно откладывать примерно ${recommendedMonthly} ${settings.currency} в месяц.`;

    return {
      remaining,
      progressPercent,
      daysRemaining,
      monthsRemaining,
      recommendedDaily,
      recommendedMonthly,
      isPaceSufficient,
      paceWarningMessage
    };
  }, [primaryGoal, calculations.savingsTotal, calculations.monthSavings, settings.currency]);

  // Forecast & Safe Limits (TOR Section 9)
  const forecastMetrics = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const todayDate = now.getDate();
    const daysLeftInMonth = Math.max(1, lastDayOfMonth - todayDate + 1);

    // Planned mandatory expenses for remainder of month
    const plannedRemainingExpenses = plannedRaw
      .filter((p) => p.active && p.type === 'expense')
      .reduce((sum, p) => sum + p.amount, 0);

    // Safe daily limit = (availableBalance - plannedExpenses) / daysLeftInMonth
    const spendable = Math.max(0, calculations.availableBalance - plannedRemainingExpenses);
    const safeDailyLimit = Math.max(0, Math.round(spendable / daysLeftInMonth));
    const safeWeeklyLimit = safeDailyLimit * 7;

    // Average daily spend this month
    const averageDailySpend = todayDate > 0 ? Math.round(calculations.monthExpense / todayDate) : 0;

    // Projected end of month balance
    const projectedMonthEndBalance = Math.round(calculations.availableBalance - (averageDailySpend * (daysLeftInMonth - 1)));
    const isBurnRateHigh = averageDailySpend > safeDailyLimit && safeDailyLimit > 0;
    const burnRateWarningMessage = isBurnRateHigh
      ? `При текущем темпе расходов до конца месяца останется примерно ${Math.max(0, projectedMonthEndBalance)} ${settings.currency}.`
      : '';

    return {
      safeDailyLimit,
      safeWeeklyLimit,
      averageDailySpend,
      projectedMonthEndBalance,
      isBurnRateHigh,
      burnRateWarningMessage
    };
  }, [calculations.availableBalance, calculations.monthExpense, plannedRaw, settings.currency]);

  // Notifications checks (budget limits & goal warnings)
  useEffect(() => {
    if (!settings.notifications.categoryLimitWarning) return;

    // Check category budget limits
    const now = new Date();
    const currentMonthPrefix = now.toISOString().split('T')[0].substring(0, 7);

    categories.forEach((cat) => {
      if (cat.monthlyBudgetLimit && cat.monthlyBudgetLimit > 0) {
        const catSpent = transactions
          .filter((t) => t.type === 'expense' && t.categoryId === cat.id && t.date.startsWith(currentMonthPrefix))
          .reduce((sum, t) => sum + t.amount, 0);

        if (catSpent > cat.monthlyBudgetLimit) {
          // Check if warning already exists
          const exists = notificationsRaw.some((n) => n.title.includes(cat.name) && n.date.startsWith(currentMonthPrefix));
          if (!exists) {
            db.notifications.put({
              id: `notif-limit-${cat.id}-${currentMonthPrefix}`,
              type: 'warning',
              title: `Превышен лимит: ${cat.name}`,
              message: `Потрачено ${catSpent} ${settings.currency} из лимита ${cat.monthlyBudgetLimit} ${settings.currency}.`,
              date: now.toISOString().split('T')[0],
              read: false
            });
          }
        }
      }
    });
  }, [transactions, categories, settings.notifications.categoryLimitWarning, settings.currency, notificationsRaw]);

  // Actions
  const addTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const id = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newTx: Transaction = {
      ...txData,
      id,
      createdAt: Date.now()
    };
    await db.transactions.put(newTx);

    // If it's savings deposit, update primary goal amount
    if (newTx.type === 'savings_deposit' && primaryGoal) {
      await db.goals.update(primaryGoal.id, {
        currentAmount: primaryGoal.currentAmount + newTx.amount
      });
    } else if (newTx.type === 'savings_withdraw' && primaryGoal) {
      await db.goals.update(primaryGoal.id, {
        currentAmount: Math.max(0, primaryGoal.currentAmount - newTx.amount)
      });
    }

    return id;
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    await db.transactions.update(id, updates);
  };

  const deleteTransaction = async (id: string) => {
    await db.transactions.delete(id);
  };

  const addCategory = async (catData: Omit<Category, 'id'>) => {
    const id = `cat-custom-${Date.now()}`;
    const newCat: Category = { ...catData, id };
    await db.categories.put(newCat);
    return id;
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    await db.categories.update(id, updates);
  };

  const deleteCategory = async (id: string) => {
    await db.categories.delete(id);
  };

  const addGoal = async (goalData: Omit<Goal, 'id' | 'createdAt'>) => {
    const id = `goal-${Date.now()}`;
    const newGoal: Goal = { ...goalData, id, createdAt: Date.now() };
    await db.goals.put(newGoal);
    return id;
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    await db.goals.update(id, updates);
  };

  const deleteGoal = async (id: string) => {
    await db.goals.delete(id);
  };

  const depositToSavings = async (amount: number, goalId?: string, note?: string) => {
    const now = new Date();
    await addTransaction({
      type: 'savings_deposit',
      amount,
      categoryId: 'cat-other-exp',
      accountId: 'acc-main',
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().substring(0, 5),
      note: note || 'Пополнение накоплений'
    });
    if (goalId && goalId !== primaryGoal?.id) {
      const g = await db.goals.get(goalId);
      if (g) {
        await db.goals.update(goalId, { currentAmount: g.currentAmount + amount });
      }
    }
  };

  const withdrawFromSavings = async (amount: number, goalId?: string, note?: string) => {
    const now = new Date();
    await addTransaction({
      type: 'savings_withdraw',
      amount,
      categoryId: 'cat-other-exp',
      accountId: 'acc-main',
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().substring(0, 5),
      note: note || 'Возврат из накоплений в доступный баланс'
    });
    if (goalId && goalId !== primaryGoal?.id) {
      const g = await db.goals.get(goalId);
      if (g) {
        await db.goals.update(goalId, { currentAmount: Math.max(0, g.currentAmount - amount) });
      }
    }
  };

  const addPlannedTransaction = async (itemData: Omit<PlannedTransaction, 'id'>) => {
    const id = `plan-${Date.now()}`;
    const newItem: PlannedTransaction = { ...itemData, id };
    await db.plannedTransactions.put(newItem);
    return id;
  };

  const updatePlannedTransaction = async (id: string, updates: Partial<PlannedTransaction>) => {
    await db.plannedTransactions.update(id, updates);
  };

  const deletePlannedTransaction = async (id: string) => {
    await db.plannedTransactions.delete(id);
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    await db.settings.update('app-settings', newSettings);
  };

  const markNotificationRead = async (id: string) => {
    await db.notifications.update(id, { read: true });
  };

  const clearAllNotifications = async () => {
    await db.notifications.clear();
  };

  const addNotification = async (title: string, message: string, type: 'info' | 'warning' | 'success' = 'info') => {
    const id = `notif-${Date.now()}`;
    await db.notifications.put({
      id,
      type,
      title,
      message,
      date: new Date().toISOString().split('T')[0],
      read: false
    });
  };

  const exportToJson = async () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      accounts: await db.accounts.toArray(),
      categories: await db.categories.toArray(),
      goals: await db.goals.toArray(),
      plannedTransactions: await db.plannedTransactions.toArray(),
      transactions: await db.transactions.toArray(),
      settings: await db.settings.get('app-settings')
    };
    return JSON.stringify(backup, null, 2);
  };

  const importFromJson = async (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
        return { success: false, message: 'Неверный формат резервной копии' };
      }

      await db.transaction('rw', [db.accounts, db.categories, db.goals, db.plannedTransactions, db.transactions, db.settings], async () => {
        if (parsed.accounts) await db.accounts.bulkPut(parsed.accounts);
        if (parsed.categories) await db.categories.bulkPut(parsed.categories);
        if (parsed.goals) await db.goals.bulkPut(parsed.goals);
        if (parsed.plannedTransactions) await db.plannedTransactions.bulkPut(parsed.plannedTransactions);
        if (parsed.transactions) await db.transactions.bulkPut(parsed.transactions);
        if (parsed.settings) await db.settings.put(parsed.settings);
      });

      return { success: true, message: 'Данные успешно восстановлены!' };
    } catch (err: any) {
      return { success: false, message: `Ошибка импорта: ${err.message}` };
    }
  };

  const resetToDefaults = async () => {
    await db.transaction('rw', [db.accounts, db.categories, db.goals, db.plannedTransactions, db.transactions, db.settings, db.notifications], async () => {
      await db.accounts.clear();
      await db.categories.clear();
      await db.goals.clear();
      await db.plannedTransactions.clear();
      await db.transactions.clear();
      await db.settings.clear();
      await db.notifications.clear();
    });
    await seedInitialDataIfNeeded();
  };

  const unreadNotifCount = notificationsRaw.filter((n) => !n.read).length;

  return (
    <FinanceContext.Provider
      value={{
        isInitialized,
        transactions,
        categories,
        goals,
        primaryGoal,
        accounts: accountsRaw,
        plannedTransactions: plannedRaw,
        settings,
        notifications: notificationsRaw,
        unreadNotifCount,
        ...calculations,
        goalMetrics,
        forecastMetrics,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        addGoal,
        updateGoal,
        deleteGoal,
        depositToSavings,
        withdrawFromSavings,
        addPlannedTransaction,
        updatePlannedTransaction,
        deletePlannedTransaction,
        updateSettings,
        markNotificationRead,
        clearAllNotifications,
        addNotification,
        exportToJson,
        importFromJson,
        resetToDefaults
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
