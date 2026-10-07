import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Download,
  Clock,
  PiggyBank,
  RefreshCw,
  Repeat,
  X
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney, formatDateLabel, exportTransactionsToCSV } from '../../utils/format';
import { CategoryIcon } from '../../utils/icons';
import type { Transaction, TransactionType, TimeOfDayFilter } from '../../types';

interface TransactionsViewProps {
  onSelectTransaction: (tx: Transaction) => void;
  onOpenAddModal: () => void;
}

type PeriodFilter = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'year' | 'custom';

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onSelectTransaction,
  onOpenAddModal
}) => {
  const { transactions, categories, settings } = useFinance();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [timeOfDayFilter, setTimeOfDayFilter] = useState<TimeOfDayFilter>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(false);

  // Date boundary calculations
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const currentDayOfWeek = (today.getDay() + 6) % 7;
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayOfWeek);
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

  const currentMonthPrefix = todayStr.substring(0, 7);

  const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevMonthPrefix = prevMonthDate.toISOString().split('T')[0].substring(0, 7);

  const currentYearPrefix = today.getFullYear().toString();

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const cat = categories.find((c) => c.id === tx.categoryId);
        const matchNote = (tx.note || '').toLowerCase().includes(query);
        const matchCat = cat?.name.toLowerCase().includes(query) || false;
        if (!matchNote && !matchCat) return false;
      }

      // 2. Type
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

      // 3. Category
      if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;

      // 4. Amount Range
      if (minAmount && tx.amount < parseFloat(minAmount)) return false;
      if (maxAmount && tx.amount > parseFloat(maxAmount)) return false;

      // 5. Time of Day
      if (timeOfDayFilter !== 'all' && tx.time) {
        const hour = parseInt(tx.time.split(':')[0], 10);
        if (timeOfDayFilter === 'morning' && (hour < 6 || hour >= 12)) return false;
        if (timeOfDayFilter === 'afternoon' && (hour < 12 || hour >= 18)) return false;
        if (timeOfDayFilter === 'evening' && (hour < 18 || hour >= 23)) return false;
        if (timeOfDayFilter === 'night' && hour >= 6 && hour < 23) return false;
      }

      // 6. Period
      if (period === 'today' && tx.date !== todayStr) return false;
      if (period === 'yesterday' && tx.date !== yesterdayStr) return false;
      if (period === 'week' && tx.date < startOfWeekStr) return false;
      if (period === 'month' && !tx.date.startsWith(currentMonthPrefix)) return false;
      if (period === 'last_month' && !tx.date.startsWith(prevMonthPrefix)) return false;
      if (period === 'year' && !tx.date.startsWith(currentYearPrefix)) return false;
      if (period === 'custom') {
        if (customStartDate && tx.date < customStartDate) return false;
        if (customEndDate && tx.date > customEndDate) return false;
      }

      return true;
    });
  }, [
    transactions,
    categories,
    searchQuery,
    typeFilter,
    categoryFilter,
    minAmount,
    maxAmount,
    timeOfDayFilter,
    period,
    customStartDate,
    customEndDate,
    todayStr,
    yesterdayStr,
    startOfWeekStr,
    currentMonthPrefix,
    prevMonthPrefix,
    currentYearPrefix
  ]);

  // Group filtered transactions by date
  const groupedByDate = useMemo(() => {
    const groups: { date: string; items: Transaction[]; totalSpent: number; totalIncome: number }[] = [];
    const dateMap = new Map<string, Transaction[]>();

    filteredTransactions.forEach((tx) => {
      const list = dateMap.get(tx.date) || [];
      list.push(tx);
      dateMap.set(tx.date, list);
    });

    dateMap.forEach((items, date) => {
      const totalSpent = items
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = items
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      groups.push({ date, items, totalSpent, totalIncome });
    });

    return groups.sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredTransactions]);

  const activeFiltersCount =
    (typeFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    (timeOfDayFilter !== 'all' ? 1 : 0) +
    (minAmount || maxAmount ? 1 : 0) +
    (period !== 'month' ? 1 : 0);

  const resetFilters = () => {
    setPeriod('month');
    setTypeFilter('all');
    setCategoryFilter('all');
    setTimeOfDayFilter('all');
    setMinAmount('');
    setMaxAmount('');
    setCustomStartDate('');
    setCustomEndDate('');
    setSearchQuery('');
  };

  const handleExportCSV = () => {
    exportTransactionsToCSV(filteredTransactions, categories, settings.currency);
  };

  return (
    <div className="space-y-4 pb-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            История операций
          </h2>
          <p className="text-xs text-slate-400">
            Найдено: {filteredTransactions.length} операций
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            title="Экспорт в CSV"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              showFiltersPanel || activeFiltersCount > 0
                ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Фильтры</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-sky-600 font-bold text-[10px] flex items-center justify-center ml-0.5">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по описанию или категории..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-xs"
        />
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Period Badges (Horizontal scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-medium">
        {[
          { id: 'today' as PeriodFilter, label: 'Сегодня' },
          { id: 'yesterday' as PeriodFilter, label: 'Вчера' },
          { id: 'week' as PeriodFilter, label: 'Эта неделя' },
          { id: 'month' as PeriodFilter, label: 'Этот месяц' },
          { id: 'last_month' as PeriodFilter, label: 'Прошлый месяц' },
          { id: 'year' as PeriodFilter, label: 'Этот год' },
          { id: 'all' as PeriodFilter, label: 'Все время' },
          { id: 'custom' as PeriodFilter, label: 'Свой период' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setPeriod(item.id)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
              period === item.id
                ? 'bg-sky-500 text-white font-semibold shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Expandable Advanced Filter Panel (Section 5 & 11) */}
      {showFiltersPanel && (
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Параметры фильтрации
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs text-sky-500 hover:underline cursor-pointer"
              >
                Сбросить все
              </button>
            )}
          </div>

          {/* Custom Date Range (if period === 'custom') */}
          {period === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  С даты
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  По дату
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Operation Type Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Тип операции
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
              {[
                { id: 'all', label: 'Все' },
                { id: 'expense', label: 'Расход' },
                { id: 'income', label: 'Доход' },
                { id: 'savings_deposit', label: 'В копилку' },
                { id: 'savings_withdraw', label: 'Возврат' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeFilter(t.id as any)}
                  className={`py-1.5 px-2 rounded-xl text-center font-medium transition cursor-pointer ${
                    typeFilter === t.id
                      ? 'bg-sky-500 text-white font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time of Day Filter (Section 11) */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Время суток (фильтр по часам)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-xs">
              {[
                { id: 'all' as TimeOfDayFilter, label: 'Любое' },
                { id: 'morning' as TimeOfDayFilter, label: 'Утро (06-12)' },
                { id: 'afternoon' as TimeOfDayFilter, label: 'День (12-18)' },
                { id: 'evening' as TimeOfDayFilter, label: 'Вечер (18-23)' },
                { id: 'night' as TimeOfDayFilter, label: 'Ночь (23-06)' }
              ].map((tod) => (
                <button
                  key={tod.id}
                  type="button"
                  onClick={() => setTimeOfDayFilter(tod.id)}
                  className={`py-1.5 px-2 rounded-xl text-center font-medium transition cursor-pointer ${
                    timeOfDayFilter === tod.id
                      ? 'bg-sky-500 text-white font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tod.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter & Amount Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Категория
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white outline-none"
              >
                <option value="all">Все категории</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type === 'expense' ? 'Расход' : 'Доход'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Диапазон суммы ({settings.currency})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="От"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  placeholder="До"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Grouped List */}
      {groupedByDate.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Ничего не найдено по заданным параметрам
          </p>
          <div className="flex justify-center gap-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-sky-500 cursor-pointer"
              >
                Сбросить фильтры
              </button>
            )}
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-semibold cursor-pointer"
            >
              + Добавить операцию
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map((group) => (
            <div
              key={group.date}
              className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs"
            >
              {/* Group Date Header */}
              <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">
                  {formatDateLabel(group.date)}
                </span>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  {group.totalSpent > 0 && (
                    <span className="text-rose-500 font-bold">
                      -{formatMoney(group.totalSpent, settings.currency)}
                    </span>
                  )}
                  {group.totalIncome > 0 && (
                    <span className="text-emerald-500 font-bold">
                      +{formatMoney(group.totalIncome, settings.currency)}
                    </span>
                  )}
                </div>
              </div>

              {/* Transactions in Date Group */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {group.items.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const isExpense = tx.type === 'expense';
                  const isIncome = tx.type === 'income';
                  const isDeposit = tx.type === 'savings_deposit';
                  const isWithdraw = tx.type === 'savings_withdraw';

                  return (
                    <div
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer active:scale-[0.99]"
                    >
                      {/* Left: Icon & Title */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{
                            backgroundColor: isDeposit
                              ? '#f59e0b'
                              : isWithdraw
                              ? '#0284c7'
                              : cat?.color || '#64748b'
                          }}
                        >
                          {isDeposit ? (
                            <PiggyBank className="w-5 h-5" />
                          ) : isWithdraw ? (
                            <RefreshCw className="w-5 h-5" />
                          ) : (
                            <CategoryIcon name={cat?.icon || 'MoreHorizontal'} className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                            <span>
                              {isDeposit
                                ? 'В накопления'
                                : isWithdraw
                                ? 'Из накоплений'
                                : cat?.name || 'Операция'}
                            </span>
                            {tx.isRecurring && (
                              <span title="Регулярный платёж">
                                <Repeat className="w-3 h-3 text-sky-500" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            {tx.time && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {tx.time}
                              </span>
                            )}
                            {tx.note && <span className="truncate max-w-[150px]">· {tx.note}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Type badge */}
                      <div className="text-right">
                        <div
                          className={`text-sm font-extrabold ${
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isExpense
                              ? 'text-slate-900 dark:text-white'
                              : isDeposit
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-sky-600 dark:text-sky-400'
                          }`}
                        >
                          {isIncome ? '+' : isExpense ? '-' : ''}
                          {formatMoney(tx.amount, settings.currency)}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {isExpense
                            ? 'Расход'
                            : isIncome
                            ? 'Доход'
                            : isDeposit
                            ? 'В копилку'
                            : 'Возврат'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
