import React from 'react';
import { Plus, PiggyBank, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney } from '../../utils/format';

interface CapitalCardProps {
  onOpenAddModal: () => void;
  onOpenDepositModal: () => void;
}

export const CapitalCard: React.FC<CapitalCardProps> = ({
  onOpenAddModal,
  onOpenDepositModal
}) => {
  const { availableBalance, savingsTotal, totalCapital, settings } = useFinance();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 p-6 text-white shadow-xl shadow-slate-950/20 border border-slate-700/50">
      {/* Background glow decoration */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header: Available Now & Currency */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Доступно сейчас
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-sky-300 backdrop-blur-sm">
            Основной баланс
          </span>
        </div>

        {/* Large Amount */}
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {formatMoney(availableBalance, settings.currency)}
          </span>
        </div>

        {/* Breakdown: Накоплено & Общий капитал */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 backdrop-blur-sm border border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium mb-1">
              <PiggyBank className="w-3.5 h-3.5" />
              <span>Накоплено</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-white">
              {formatMoney(savingsTotal, settings.currency)}
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 backdrop-blur-sm border border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-medium mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Общий капитал</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-white">
              {formatMoney(totalCapital, settings.currency)}
            </div>
          </div>
        </div>

        {/* Action Buttons: Add Transaction & Quick Deposit */}
        <div className="grid grid-cols-2 gap-2.5 mt-5">
          <button
            onClick={onOpenAddModal}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 active:scale-[0.98] transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Добавить операцию</span>
          </button>

          <button
            onClick={onOpenDepositModal}
            className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-white/10 active:scale-[0.98] transition cursor-pointer backdrop-blur-sm"
          >
            <ArrowUpRight className="w-4 h-4 text-amber-300" />
            <span>В копилку</span>
          </button>
        </div>
      </div>
    </div>
  );
};
