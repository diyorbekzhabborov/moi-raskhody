import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Percent,
  TrendingDown,
  TrendingUp,
  Award,
  Flame
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney } from '../../utils/format';
import { CategoryIcon } from '../../utils/icons';

type AnalyticsPeriod = 'today' | '7days' | 'month' | 'last_month' | 'year' | 'custom';

export const AnalyticsView: React.FC = () => {
  const { transactions, categories, settings } = useFinance();

  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // 1. Calculate boundaries
  const boundaries = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const d7 = new Date(now);
    d7.setDate(d7.getDate() - 6);
    const d7Str = d7.toISOString().split('T')[0];

    const monthPrefix = todayStr.substring(0, 7);

    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthPrefix = prevMonthDate.toISOString().split('T')[0].substring(0, 7);

    const yearPrefix = now.getFullYear().toString();

    return {
      todayStr,
      d7Str,
      monthPrefix,
      prevMonthPrefix,
      yearPrefix
    };
  }, []);

  // 2. Filter transactions for the selected period
  const periodTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (period === 'today') return tx.date === boundaries.todayStr;
      if (period === '7days') return tx.date >= boundaries.d7Str && tx.date <= boundaries.todayStr;
      if (period === 'month') return tx.date.startsWith(boundaries.monthPrefix);
      if (period === 'last_month') return tx.date.startsWith(boundaries.prevMonthPrefix);
      if (period === 'year') return tx.date.startsWith(boundaries.yearPrefix);
      if (period === 'custom') {
        if (customStart && tx.date < customStart) return false;
        if (customEnd && tx.date > customEnd) return false;
      }
      return true;
    });
  }, [transactions, period, customStart, customEnd, boundaries]);

  // 3. Totals
  const { totalIncome, totalExpense, totalSavingsDeposited } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let sav = 0;

    periodTransactions.forEach((tx) => {
      if (tx.type === 'income') inc += tx.amount;
      if (tx.type === 'expense') exp += tx.amount;
      if (tx.type === 'savings_deposit') sav += tx.amount;
    });

    return { totalIncome: inc, totalExpense: exp, totalSavingsDeposited: sav };
  }, [periodTransactions]);

  // 4. Savings rate %
  const savingsRate = totalIncome > 0 ? Math.round((totalSavingsDeposited / totalIncome) * 100) : 0;

  // 5. Daily expenses aggregation & Peak day & Average daily
  const { dailyData, peakDay, averageDailyExpense } = useMemo(() => {
    const dayMap = new Map<string, number>();

    periodTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        dayMap.set(t.date, (dayMap.get(t.date) || 0) + t.amount);
      });

    let maxDay = { date: '', amount: 0 };
    dayMap.forEach((amount, date) => {
      if (amount > maxDay.amount) {
        maxDay = { date, amount };
      }
    });

    // Sort by date ascending for chart
    const daysSorted = Array.from(dayMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Number of days in calculation
    const distinctDays = Math.max(1, dayMap.size);
    const avg = Math.round(totalExpense / distinctDays);

    return {
      dailyData: daysSorted,
      peakDay: maxDay,
      averageDailyExpense: avg
    };
  }, [periodTransactions, totalExpense]);

  // 6. Category breakdown & Top-5 (Section 10)
  const categoryBreakdown = useMemo(() => {
    const catMap = new Map<string, number>();

    periodTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        catMap.set(t.categoryId, (catMap.get(t.categoryId) || 0) + t.amount);
      });

    const list = Array.from(catMap.entries())
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          catId,
          name: cat?.name || 'Другое',
          icon: cat?.icon || 'MoreHorizontal',
          color: cat?.color || '#64748b',
          amount,
          percent: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return list;
  }, [periodTransactions, categories, totalExpense]);

  const top5Categories = categoryBreakdown.slice(0, 5);

  // 7. Income by source breakdown (Section 7)
  const incomeSources = useMemo(() => {
    const incMap = new Map<string, number>();

    periodTransactions
      .filter((t) => t.type === 'income')
      .forEach((t) => {
        incMap.set(t.categoryId, (incMap.get(t.categoryId) || 0) + t.amount);
      });

    return Array.from(incMap.entries())
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          catId,
          name: cat?.name || 'Источник дохода',
          icon: cat?.icon || 'Briefcase',
          color: cat?.color || '#10b981',
          amount,
          percent: totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [periodTransactions, categories, totalIncome]);

  // 8. Month-over-month comparison (Section 10)
  const monthComparison = useMemo(() => {
    const curMonthSpent = transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith(boundaries.monthPrefix))
      .reduce((sum, t) => sum + t.amount, 0);

    const prevMonthSpent = transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith(boundaries.prevMonthPrefix))
      .reduce((sum, t) => sum + t.amount, 0);

    const diff = curMonthSpent - prevMonthSpent;
    const diffPercent = prevMonthSpent > 0 ? Math.round((diff / prevMonthSpent) * 100) : 0;

    return {
      curMonthSpent,
      prevMonthSpent,
      diff,
      diffPercent
    };
  }, [transactions, boundaries]);

  const maxChartBar = Math.max(...dailyData.map((d) => d.amount), 50);

  return (
    <div className="space-y-5 pb-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Финансовая аналитика
        </h2>
        <p className="text-xs text-slate-400">
          Структура расходов, динамика по дням и процент сбережений
        </p>
      </div>

      {/* Period Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        {[
          { id: 'today' as AnalyticsPeriod, label: 'Сегодня' },
          { id: '7days' as AnalyticsPeriod, label: '7 дней' },
          { id: 'month' as AnalyticsPeriod, label: 'Этот месяц' },
          { id: 'last_month' as AnalyticsPeriod, label: 'Прошлый месяц' },
          { id: 'year' as AnalyticsPeriod, label: 'Год' },
          { id: 'custom' as AnalyticsPeriod, label: 'Период' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setPeriod(item.id)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
              period === item.id
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Custom date range if selected */}
      {period === 'custom' && (
        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">С даты</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">По дату</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5"
            />
          </div>
        </div>
      )}

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-rose-500 font-semibold mb-1">
            <ArrowUpRight className="w-4 h-4" />
            <span>Расходы</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
            {formatMoney(totalExpense, settings.currency)}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold mb-1">
            <ArrowDownLeft className="w-4 h-4" />
            <span>Доходы</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
            {formatMoney(totalIncome, settings.currency)}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold mb-1">
            <PiggyBank className="w-4 h-4" />
            <span>Отложено</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
            {formatMoney(totalSavingsDeposited, settings.currency)}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-sky-500 font-semibold mb-1">
            <Percent className="w-4 h-4" />
            <span>Сбережения</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
            {savingsRate}%
          </div>
          <div className="text-[10px] text-slate-400">от всех доходов</div>
        </div>
      </div>

      {/* Month-over-Month Comparison Card (Section 10) */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Сравнение с прошлым месяцем
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
            {monthComparison.diff <= 0 ? (
              <span className="text-emerald-500 flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                Потрачено на {formatMoney(Math.abs(monthComparison.diff), settings.currency)} меньше ({Math.abs(monthComparison.diffPercent)}%)
              </span>
            ) : (
              <span className="text-rose-500 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Потрачено на {formatMoney(monthComparison.diff, settings.currency)} больше (+{monthComparison.diffPercent}%)
              </span>
            )}
          </div>
        </div>

        <div className="text-right text-xs text-slate-400">
          Прошлый месяц: {formatMoney(monthComparison.prevMonthSpent, settings.currency)}
        </div>
      </div>

      {/* Key Insights: Average Daily & Peak Day (Section 10) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Средний расход в день</div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">
              {formatMoney(averageDailyExpense, settings.currency)}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Самый затратный день</div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">
              {peakDay.amount > 0 ? formatMoney(peakDay.amount, settings.currency) : '—'}
              {peakDay.date && (
                <span className="text-xs font-normal text-slate-400 ml-2">({peakDay.date})</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Expenses Chart */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Динамика расходов по дням
          </h4>
          <span className="text-xs text-slate-400">TJS</span>
        </div>

        {dailyData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-xs text-slate-400">
            Нет данных о расходах за выбранный период
          </div>
        ) : (
          <div className="h-44 flex items-end gap-1.5 pt-6 pb-2 overflow-x-auto">
            {dailyData.map((d) => {
              const heightPercent = Math.max(6, Math.round((d.amount / maxChartBar) * 100));
              return (
                <div key={d.date} className="min-w-[28px] flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    {d.amount}
                  </span>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg flex items-end h-28 p-0.5 overflow-hidden">
                    <div
                      className="w-full rounded-md bg-gradient-to-t from-sky-500 to-emerald-400 transition-all duration-300"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 whitespace-nowrap">
                    {d.date.substring(5)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top-5 Categories by Amount (Section 10) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Топ-5 затратных категорий</span>
          </h4>
          <span className="text-xs text-slate-400">Рейтинг трат</span>
        </div>

        {top5Categories.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Расходы отсутствуют
          </div>
        ) : (
          <div className="space-y-3">
            {top5Categories.map((cat, idx) => (
              <div key={cat.catId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-slate-400 font-bold text-[11px]">{idx + 1}.</span>
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {cat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {formatMoney(cat.amount, settings.currency)}
                    </span>
                    <span className="text-slate-400 w-8 text-right font-medium">
                      {cat.percent}%
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incomes by Source (Section 7) */}
      {incomeSources.length > 0 && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Доходы по источникам
          </h4>
          <div className="space-y-3">
            {incomeSources.map((inc) => (
              <div key={inc.catId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: inc.color }}
                    >
                      <CategoryIcon name={inc.icon} className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {inc.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      +{formatMoney(inc.amount, settings.currency)}
                    </span>
                    <span className="text-slate-400 w-8 text-right font-medium">
                      {inc.percent}%
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${inc.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
