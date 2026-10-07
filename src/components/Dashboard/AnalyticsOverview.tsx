import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Scale, PiggyBank } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney } from '../../utils/format';

type PeriodMode = 'today' | 'week' | 'month';

export const AnalyticsOverview: React.FC = () => {
  const {
    todayIncome,
    todayExpense,
    weekIncome,
    weekExpense,
    monthIncome,
    monthExpense,
    monthSavings,
    netResultMonth,
    savingsRateMonth,
    settings
  } = useFinance();

  const [period, setPeriod] = useState<PeriodMode>('today');

  let currentInc = todayIncome;
  let currentExp = todayExpense;
  let periodLabel = 'сегодня';

  if (period === 'week') {
    currentInc = weekIncome;
    currentExp = weekExpense;
    periodLabel = 'эту неделю';
  } else if (period === 'month') {
    currentInc = monthIncome;
    currentExp = monthExpense;
    periodLabel = 'этот месяц';
  }

  // Net result for the chosen period
  const currentNet = currentInc - currentExp;

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
      {/* Header and Period Filter Tabs */}
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
          Сводка аналитики
        </h4>

        {/* Period Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setPeriod('today')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              period === 'today'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Сегодня
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              period === 'week'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Неделя
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              period === 'month'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Месяц
          </button>
        </div>
      </div>

      {/* Income vs Expenses Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
            <ArrowDownLeft className="w-4 h-4" />
            <span>Доходы</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            +{formatMoney(currentInc, settings.currency)}
          </div>
          <div className="text-[10px] text-slate-400 capitalize">За {periodLabel}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
          <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold mb-1">
            <ArrowUpRight className="w-4 h-4" />
            <span>Расходы</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            -{formatMoney(currentExp, settings.currency)}
          </div>
          <div className="text-[10px] text-slate-400 capitalize">За {periodLabel}</div>
        </div>
      </div>

      {/* Net Result (Чистый результат) bar */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Чистый результат
            </div>
            <div className="text-[10px] text-slate-400">
              {period === 'month' ? 'Доходы − расходы − переводы в накопления' : 'Доходы − расходы'}
            </div>
          </div>
        </div>
        <div
          className={`text-base font-extrabold ${
            (period === 'month' ? netResultMonth : currentNet) >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {(period === 'month' ? netResultMonth : currentNet) >= 0 ? '+' : ''}
          {formatMoney(period === 'month' ? netResultMonth : currentNet, settings.currency)}
        </div>
      </div>

      {/* Savings info for current month */}
      {period === 'month' && (
        <div className="flex items-center justify-between text-xs px-2 pt-1 text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <PiggyBank className="w-3.5 h-3.5 text-amber-500" />
            Отложено в копилку в этом месяце:
          </span>
          <span className="font-bold text-slate-900 dark:text-white">
            {formatMoney(monthSavings, settings.currency)} ({savingsRateMonth}%)
          </span>
        </div>
      )}
    </div>
  );
};
