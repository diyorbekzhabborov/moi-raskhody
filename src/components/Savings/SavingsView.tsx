import React, { useState } from 'react';
import {
  PiggyBank,
  Plus,
  Target,
  Calendar,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  Edit2,
  RefreshCw,
  Repeat,
  Trash2
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney } from '../../utils/format';
import type { Goal } from '../../types';

interface SavingsViewProps {
  onOpenDepositModal: (goalId?: string) => void;
  onOpenWithdrawModal: (goalId?: string) => void;
  onOpenCreateGoal: () => void;
  onOpenEditGoal: (goal: Goal) => void;
}

export const SavingsView: React.FC<SavingsViewProps> = ({
  onOpenDepositModal,
  onOpenWithdrawModal,
  onOpenCreateGoal,
  onOpenEditGoal
}) => {
  const {
    savingsTotal,
    availableBalance,
    goals,
    updateGoal,
    plannedTransactions,
    addPlannedTransaction,
    deletePlannedTransaction,
    settings
  } = useFinance();

  const [showAddPlan, setShowAddPlan] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  const [planAmount, setPlanAmount] = useState('');
  const [planType, setPlanType] = useState<'expense' | 'income'>('expense');
  const [planRecurrence, setPlanRecurrence] = useState<'monthly' | 'weekly'>('monthly');

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(planAmount);
    if (!planTitle.trim() || isNaN(amount) || amount <= 0) return;

    await addPlannedTransaction({
      title: planTitle.trim(),
      amount,
      type: planType,
      categoryId: planType === 'expense' ? 'cat-housing' : 'cat-salary',
      recurrence: planRecurrence,
      nextDate: new Date().toISOString().split('T')[0],
      active: true
    });

    setPlanTitle('');
    setPlanAmount('');
    setShowAddPlan(false);
  };

  return (
    <div className="space-y-6 pb-8 animate-fadeIn">
      {/* 1. Top Card: Накопления Total & Quick Transfers */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white p-6 shadow-xl shadow-amber-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-100 flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4" />
              Копилка и накопления
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
              Отдельный счёт
            </span>
          </div>

          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            {formatMoney(savingsTotal, settings.currency)}
          </div>
          <p className="text-xs text-amber-100">
            Деньги в безопасности и отделены от повседневного баланса ({formatMoney(availableBalance, settings.currency)})
          </p>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              onClick={() => onOpenDepositModal()}
              className="py-3 px-4 rounded-xl bg-white text-amber-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:bg-amber-50 transition active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Пополнить копилку</span>
            </button>

            <button
              onClick={() => onOpenWithdrawModal()}
              className="py-3 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/20 transition active:scale-[0.98] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Вернуть в баланс</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Goals Section Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-sky-500" />
              <span>Финансовые цели</span>
            </h3>
            <p className="text-xs text-slate-400">
              Создавайте цели и отслеживайте темп накоплений
            </p>
          </div>

          <button
            onClick={onOpenCreateGoal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Новая цель</span>
          </button>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {goals.map((goal) => {
            const currentAmount = goal.currentAmount;
            const remaining = Math.max(0, goal.targetAmount - currentAmount);
            const percent = Math.min(100, Math.round((currentAmount / goal.targetAmount) * 100));

            const today = new Date();
            const deadlineDate = new Date(goal.deadline + 'T23:59:59');
            const diffMs = deadlineDate.getTime() - today.getTime();
            const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30.4));

            const recommendedDaily = Math.round((remaining / daysRemaining) * 10) / 10;
            const recommendedMonthly = Math.round(remaining / monthsRemaining);

            const isCompleted = currentAmount >= goal.targetAmount;
            const isPaused = goal.status === 'paused';

            const togglePause = async () => {
              await updateGoal(goal.id, {
                status: isPaused ? 'active' : 'paused'
              });
            };

            const deadlineFormatted = new Date(goal.deadline).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });

            return (
              <div
                key={goal.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {goal.name}
                      </h4>
                      {isPaused && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          На паузе
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Дедлайн: {deadlineFormatted} ({daysRemaining} дн.)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={togglePause}
                      title={isPaused ? 'Возобновить' : 'Пауза'}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      {isPaused ? <PlayCircle className="w-4 h-4 text-emerald-500" /> : <PauseCircle className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => onOpenEditGoal(goal)}
                      title="Редактировать"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {formatMoney(currentAmount, settings.currency)}
                      </span>
                      <span className="text-xs text-slate-400">
                        из {formatMoney(goal.targetAmount, settings.currency)}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
                      {percent}%
                    </span>
                  </div>

                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(3, percent))}%` }}
                    />
                  </div>
                </div>

                {/* Detailed Calculator Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-400 block text-[11px] mb-0.5">Осталось накопить</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatMoney(remaining, settings.currency)}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-400 block text-[11px] mb-0.5">В месяц</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatMoney(recommendedMonthly, settings.currency)}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 block text-[11px] mb-0.5">В день</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatMoney(recommendedDaily, settings.currency)}
                    </span>
                  </div>
                </div>

                {/* Pace Warning Banner if rate is insufficient (Section 8) */}
                {!isCompleted && !isPaused && (
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                    <div>
                      <span className="font-semibold">Расчёт темпа: </span>
                      Чтобы успеть к дедлайну, откладывайте примерно {formatMoney(recommendedMonthly, settings.currency)} в месяц ({formatMoney(recommendedDaily, settings.currency)} в день).
                    </div>
                  </div>
                )}

                {/* Action: Deposit this goal */}
                {!isCompleted && (
                  <button
                    onClick={() => onOpenDepositModal(goal.id)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Пополнить цель</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Planning & Mandatory Regular Expenses (Section 9) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Repeat className="w-4 h-4 text-sky-500" />
              <span>Обязательные регулярные платежи</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Учитываются системой при расчёте безопасного лимита трат
            </p>
          </div>

          <button
            onClick={() => setShowAddPlan(!showAddPlan)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition"
          >
            + Добавить
          </button>
        </div>

        {/* Add Plan Form */}
        {showAddPlan && (
          <form onSubmit={handleAddPlan} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Название (аренда, интернет)"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                className="col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none"
              />
              <input
                type="number"
                placeholder={`Сумма (${settings.currency})`}
                value={planAmount}
                onChange={(e) => setPlanAmount(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none"
              />
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value as any)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none"
              >
                <option value="expense">Обязательный расход</option>
                <option value="income">Ожидаемый доход</option>
              </select>
              <select
                value={planRecurrence}
                onChange={(e) => setPlanRecurrence(e.target.value as any)}
                className="col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none"
              >
                <option value="monthly">Повторять каждый месяц</option>
                <option value="weekly">Повторять каждую неделю</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddPlan(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-500 cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-semibold cursor-pointer"
              >
                Сохранить
              </button>
            </div>
          </form>
        )}

        {/* List of Planned Items */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {plannedTransactions.map((plan) => (
            <div key={plan.id} className="py-2.5 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  {plan.title}
                </div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {plan.recurrence === 'monthly' ? 'Каждый месяц' : 'Каждую неделю'} · {plan.type === 'expense' ? 'Расход' : 'Доход'}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold ${plan.type === 'income' ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-200'}`}>
                  {plan.type === 'income' ? '+' : '-'}{formatMoney(plan.amount, settings.currency)}
                </span>
                <button
                  onClick={() => deletePlannedTransaction(plan.id)}
                  className="text-slate-300 hover:text-rose-500 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
