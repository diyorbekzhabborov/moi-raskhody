import React from 'react';
import { Target, Calendar, AlertTriangle, CheckCircle2, PauseCircle, PlayCircle, Edit2, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney } from '../../utils/format';

interface GoalCardProps {
  onOpenDepositModal: () => void;
  onOpenEditGoal: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  onOpenDepositModal,
  onOpenEditGoal
}) => {
  const { primaryGoal, goalMetrics, savingsTotal, updateGoal, settings } = useFinance();

  if (!primaryGoal) return null;

  const currentSavings = savingsTotal;
  const isCompleted = currentSavings >= primaryGoal.targetAmount;
  const isPaused = primaryGoal.status === 'paused';

  const handleCelebrate = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const togglePause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await updateGoal(primaryGoal.id, {
      status: isPaused ? 'active' : 'paused'
    });
  };

  const deadlineFormatted = new Date(primaryGoal.deadline).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
      {/* Goal Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            isCompleted 
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          }`}>
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                {primaryGoal.name}
              </h3>
              {isPaused && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  На паузе
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>До {deadlineFormatted} ({goalMetrics.daysRemaining} дн.)</span>
            </div>
          </div>
        </div>

        {/* Action icons: Pause & Edit */}
        <div className="flex items-center gap-1">
          <button
            onClick={togglePause}
            title={isPaused ? 'Возобновить цель' : 'Поставить на паузу'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {isPaused ? <PlayCircle className="w-4 h-4 text-emerald-500" /> : <PauseCircle className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenEditGoal}
            title="Редактировать цель"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar & Amounts */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {formatMoney(currentSavings, settings.currency)}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              из {formatMoney(primaryGoal.targetAmount, settings.currency)}
            </span>
          </div>
          <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
            {goalMetrics.progressPercent}%
          </span>
        </div>

        {/* Bar */}
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-sky-500 via-emerald-400 to-amber-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(2, goalMetrics.progressPercent))}%` }}
          />
        </div>
      </div>

      {/* Stats Breakdown: Осталось & Рекомендуемая сумма */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
          <span className="text-slate-400 block text-[11px] mb-0.5">Осталось накопить</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            {formatMoney(goalMetrics.remaining, settings.currency)}
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
          <span className="text-slate-400 block text-[11px] mb-0.5">Нужно откладывать</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            {goalMetrics.recommendedMonthly} {settings.currency}/мес
            <span className="text-[10px] text-slate-400 font-normal ml-1">
              ({goalMetrics.recommendedDaily} в день)
            </span>
          </span>
        </div>
      </div>

      {/* Pace Warning Banner if rate is insufficient (Section 8) */}
      {!isCompleted && !isPaused && !goalMetrics.isPaceSufficient && (
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold block mb-0.5">Темп накопления:</span>
            {goalMetrics.paceWarningMessage}
          </div>
        </div>
      )}

      {/* Completed Banner */}
      {isCompleted && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="font-bold">Цель успешно достигнута! Поздравляем!</span>
          </div>
          <button
            onClick={handleCelebrate}
            className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-bold text-[11px] hover:bg-emerald-600 transition cursor-pointer"
          >
            Салют 🎉
          </button>
        </div>
      )}

      {/* Bottom Action Button: Quick Deposit */}
      {!isCompleted && (
        <button
          onClick={onOpenDepositModal}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Пополнить эту цель</span>
        </button>
      )}
    </div>
  );
};
