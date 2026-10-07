import React from 'react';
import { Compass, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney } from '../../utils/format';

interface ForecastCardProps {
  onOpenPlanning?: () => void;
}

export const ForecastCard: React.FC<ForecastCardProps> = ({ onOpenPlanning }) => {
  const { forecastMetrics, settings } = useFinance();

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Планирование и безопасный лимит
            </h4>
            <p className="text-[11px] text-slate-400">
              Прогноз расхода бюджета до конца месяца
            </p>
          </div>
        </div>

        {onOpenPlanning && (
          <button
            onClick={onOpenPlanning}
            className="text-xs font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-1 cursor-pointer"
          >
            <span>План</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Daily & Weekly Safe Limits */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            <span>Лимит на день</span>
          </div>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white">
            {formatMoney(forecastMetrics.safeDailyLimit, settings.currency)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Средний расход: {formatMoney(forecastMetrics.averageDailySpend, settings.currency)}/дн
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Лимит на неделю</span>
          </div>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white">
            {formatMoney(forecastMetrics.safeWeeklyLimit, settings.currency)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Безопасно до конца месяца
          </div>
        </div>
      </div>

      {/* Burn Rate Warning if user spends faster than safe pace */}
      {forecastMetrics.isBurnRateHigh && forecastMetrics.burnRateWarningMessage && (
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold block mb-0.5">Внимание к расходам:</span>
            {forecastMetrics.burnRateWarningMessage}
          </div>
        </div>
      )}
    </div>
  );
};
