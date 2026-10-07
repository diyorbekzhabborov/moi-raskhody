import React from 'react';
import { PiggyBank, RefreshCw, ChevronRight, Clock } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney, formatDateLabel } from '../../utils/format';
import { CategoryIcon } from '../../utils/icons';
import type { Transaction } from '../../types';

interface RecentTransactionsProps {
  onViewAll: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  onViewAll,
  onSelectTransaction
}) => {
  const { transactions, categories, settings } = useFinance();

  const recentList = transactions.slice(0, 6);

  const getCategory = (catId: string) => {
    return categories.find((c) => c.id === catId);
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
          Последние операции
        </h4>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-1 cursor-pointer transition"
        >
          <span>Все операции</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {recentList.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          Операций пока нет. Нажмите «+», чтобы добавить первую запись.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {recentList.map((tx) => {
            const cat = getCategory(tx.categoryId);
            const isExpense = tx.type === 'expense';
            const isIncome = tx.type === 'income';
            const isDeposit = tx.type === 'savings_deposit';
            const isWithdraw = tx.type === 'savings_withdraw';

            return (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction(tx)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition cursor-pointer active:scale-[0.99]"
              >
                {/* Category Icon */}
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
                    <div className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                      {isDeposit
                        ? 'В накопления'
                        : isWithdraw
                        ? 'Из накоплений'
                        : cat?.name || 'Операция'}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{formatDateLabel(tx.date)}</span>
                      {tx.time && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {tx.time}
                        </span>
                      )}
                      {tx.note && <span className="truncate max-w-[120px]">· {tx.note}</span>}
                    </div>
                  </div>
                </div>

                {/* Amount */}
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
                    {tx.type === 'expense'
                      ? 'Расход'
                      : tx.type === 'income'
                      ? 'Доход'
                      : tx.type === 'savings_deposit'
                      ? 'В копилку'
                      : 'Возврат'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
