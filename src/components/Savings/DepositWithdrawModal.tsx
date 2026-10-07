import React, { useState, useEffect } from 'react';
import { X, Check, PiggyBank, RefreshCw } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney } from '../../utils/format';

interface DepositWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'deposit' | 'withdraw';
  preselectedGoalId?: string;
}

export const DepositWithdrawModal: React.FC<DepositWithdrawModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'deposit',
  preselectedGoalId
}) => {
  const { availableBalance, savingsTotal, depositToSavings, withdrawFromSavings, goals, settings } = useFinance();

  const [mode, setMode] = useState<'deposit' | 'withdraw'>(defaultMode);
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setAmountStr('');
      setNote('');
      setErrorMsg('');
      setSelectedGoalId(preselectedGoalId || goals[0]?.id || '');
    }
  }, [isOpen, defaultMode, preselectedGoalId, goals]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Введите корректную сумму');
      return;
    }

    if (mode === 'deposit' && amount > availableBalance) {
      setErrorMsg(`Сумма превышает доступный баланс (${formatMoney(availableBalance, settings.currency)})`);
      return;
    }

    if (mode === 'withdraw' && amount > savingsTotal) {
      setErrorMsg(`Сумма превышает текущие накопления (${formatMoney(savingsTotal, settings.currency)})`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'deposit') {
        await depositToSavings(amount, selectedGoalId, note.trim() || undefined);
      } else {
        await withdrawFromSavings(amount, selectedGoalId, note.trim() || undefined);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка операции');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-all animate-fadeIn">
      <div 
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {mode === 'deposit' ? (
              <>
                <PiggyBank className="w-5 h-5 text-amber-500" />
                <span>Пополнение накоплений</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 text-sky-500" />
                <span>Возврат из накоплений</span>
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Switch Mode */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setMode('deposit')}
              className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                mode === 'deposit'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <PiggyBank className="w-4 h-4" />
              Отложить в копилку
            </button>
            <button
              type="button"
              onClick={() => setMode('withdraw')}
              className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                mode === 'withdraw'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Вернуть в баланс
            </button>
          </div>

          {/* Balance info context */}
          <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400">
            <span>{mode === 'deposit' ? 'Доступно для перевода:' : 'Всего в накоплениях:'}</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {formatMoney(mode === 'deposit' ? availableBalance : savingsTotal, settings.currency)}
            </span>
          </div>

          {/* Amount Input */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Сумма
            </label>
            <div className="flex items-center justify-between">
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="0"
                className="w-full bg-transparent text-3xl font-extrabold text-slate-900 dark:text-white outline-none"
                autoFocus
              />
              <span className="text-xl font-bold text-slate-400 ml-2 shrink-0">
                {settings.currency}
              </span>
            </div>
          </div>

          {/* Goal Selector */}
          {goals.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                К какой цели привязать
              </label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
              >
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} (цель {formatMoney(g.targetAmount, settings.currency)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Note Input */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Примечание (необязательно)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Например: часть зарплаты, сэкономленное..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
            />
          </div>

          {errorMsg && (
            <div className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
              {errorMsg}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] cursor-pointer disabled:opacity-50 ${
              mode === 'deposit'
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
                : 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/25'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{mode === 'deposit' ? 'Перевести в накопления' : 'Вернуть в баланс'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
