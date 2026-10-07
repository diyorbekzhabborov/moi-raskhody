import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Target, Calendar } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { Goal, GoalStatus } from '../../types';

interface GoalModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  goal,
  isOpen,
  onClose
}) => {
  const { addGoal, updateGoal, deleteGoal, settings } = useFinance();

  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [currentAmountStr, setCurrentAmountStr] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<GoalStatus>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isEditing = !!goal;

  useEffect(() => {
    if (isOpen) {
      if (goal) {
        setName(goal.name);
        setTargetAmountStr(goal.targetAmount.toString());
        setCurrentAmountStr(goal.currentAmount.toString());
        setDeadline(goal.deadline);
        setStatus(goal.status);
      } else {
        setName('');
        setTargetAmountStr('10000');
        setCurrentAmountStr('0');
        setDeadline('2026-12-31');
        setStatus('active');
      }
      setShowConfirmDelete(false);
      setErrorMsg('');
    }
  }, [isOpen, goal]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Укажите название цели');
      return;
    }

    const targetAmount = parseFloat(targetAmountStr.replace(',', '.'));
    if (isNaN(targetAmount) || targetAmount <= 0) {
      setErrorMsg('Укажите корректную целевую сумму');
      return;
    }

    const currentAmount = parseFloat(currentAmountStr.replace(',', '.')) || 0;

    if (!deadline) {
      setErrorMsg('Укажите дату дедлайна');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && goal) {
        await updateGoal(goal.id, {
          name: name.trim(),
          targetAmount,
          currentAmount,
          deadline,
          status
        });
      } else {
        await addGoal({
          name: name.trim(),
          targetAmount,
          currentAmount,
          deadline,
          status
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка сохранения цели');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!goal) return;
    setIsSubmitting(true);
    try {
      await deleteGoal(goal.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка удаления');
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
            <Target className="w-5 h-5 text-sky-500" />
            <span>{isEditing ? 'Редактировать цель' : 'Создать новую цель'}</span>
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Goal Name */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Название цели
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Новый ноутбук, Поездка, Резерв..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-500"
              autoFocus
            />
          </div>

          {/* Target Amount */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3.5 border border-slate-200/60 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Целевая сумма ({settings.currency})
            </label>
            <input
              type="number"
              step="any"
              value={targetAmountStr}
              onChange={(e) => setTargetAmountStr(e.target.value)}
              placeholder="10000"
              className="w-full bg-transparent text-2xl font-extrabold text-slate-900 dark:text-white outline-none"
            />
          </div>

          {/* Current / Initial Amount & Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Уже отложено ({settings.currency})
              </label>
              <input
                type="number"
                step="any"
                value={currentAmountStr}
                onChange={(e) => setCurrentAmountStr(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Дедлайн
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
                />
                <Calendar className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Status Switcher */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Статус
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`py-1.5 rounded-lg transition cursor-pointer ${
                  status === 'active'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Активна
              </button>
              <button
                type="button"
                onClick={() => setStatus('paused')}
                className={`py-1.5 rounded-lg transition cursor-pointer ${
                  status === 'paused'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                На паузе
              </button>
              <button
                type="button"
                onClick={() => setStatus('completed')}
                className={`py-1.5 rounded-lg transition cursor-pointer ${
                  status === 'completed'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Достигнута
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
              {errorMsg}
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isEditing ? 'Сохранить изменения' : 'Создать цель'}</span>
            </button>

            {isEditing && (
              <>
                {!showConfirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(true)}
                    className="w-full py-2 px-4 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Удалить эту цель</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-center space-y-2">
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                      Удалить финансовую цель?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="flex-1 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs cursor-pointer"
                      >
                        Да, удалить
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmDelete(false)}
                        className="flex-1 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
