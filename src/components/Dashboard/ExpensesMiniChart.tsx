import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney } from '../../utils/format';
import { CategoryIcon } from '../../utils/icons';

export const ExpensesMiniChart: React.FC = () => {
  const { transactions, categories, settings } = useFinance();

  // 1. Last 7 days expenses
  const dailyData = useMemo(() => {
    const days: { dateStr: string; label: string; amount: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('ru-RU', { weekday: 'short' });

      const daySpent = transactions
        .filter((t) => t.type === 'expense' && t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);

      days.push({ dateStr, label, amount: daySpent });
    }
    return days;
  }, [transactions]);

  const maxDailyAmount = useMemo(() => {
    const max = Math.max(...dailyData.map((d) => d.amount), 50);
    return max;
  }, [dailyData]);

  // 2. Category breakdown for current month
  const categoryData = useMemo(() => {
    const currentMonthPrefix = new Date().toISOString().split('T')[0].substring(0, 7);
    const catMap = new Map<string, number>();

    transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith(currentMonthPrefix))
      .forEach((t) => {
        catMap.set(t.categoryId, (catMap.get(t.categoryId) || 0) + t.amount);
      });

    const totalExpense = Array.from(catMap.values()).reduce((sum, v) => sum + v, 0);

    const result = Array.from(catMap.entries())
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

    return { items: result, totalExpense };
  }, [transactions, categories]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Bar Chart: Daily Expenses (Last 7 Days) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Расходы за 7 дней
          </h4>
          <span className="text-[11px] text-slate-400">по дням</span>
        </div>

        {/* SVG / Flex Bar Chart */}
        <div className="h-36 flex items-end justify-between gap-2 pt-6 pb-2 px-1">
          {dailyData.map((day, idx) => {
            const heightPercent = Math.max(8, Math.round((day.amount / maxDailyAmount) * 100));
            const isToday = idx === dailyData.length - 1;

            return (
              <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1.5 group">
                {/* Tooltip amount on hover / focus */}
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {day.amount > 0 ? day.amount : ''}
                </span>

                {/* Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-lg flex items-end h-24 p-0.5 overflow-hidden">
                  <div
                    className={`w-full rounded-md transition-all duration-500 ${
                      isToday
                        ? 'bg-gradient-to-t from-sky-500 to-emerald-400'
                        : 'bg-gradient-to-t from-slate-400 to-sky-400 dark:from-slate-700 dark:to-sky-500'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                {/* Day label */}
                <span
                  className={`text-[11px] capitalize ${
                    isToday
                      ? 'font-bold text-sky-600 dark:text-sky-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Donut / Category Breakdown */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Структура расходов
          </h4>
          <span className="text-[11px] text-slate-400">в этом месяце</span>
        </div>

        {categoryData.items.length === 0 ? (
          <div className="h-36 flex items-center justify-center text-xs text-slate-400">
            В этом месяце ещё нет расходов
          </div>
        ) : (
          <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
            {categoryData.items.slice(0, 4).map((item) => (
              <div key={item.catId} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px]"
                      style={{ backgroundColor: item.color }}
                    >
                      <CategoryIcon name={item.icon} className="w-3 h-3" />
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatMoney(item.amount, settings.currency)}
                    </span>
                    <span className="text-[10px] text-slate-400 w-8 text-right">
                      {item.percent}%
                    </span>
                  </div>
                </div>

                {/* Mini progress line */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
