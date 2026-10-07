import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, ArrowUpRight, ArrowDownLeft, PiggyBank, RefreshCw } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { CategoryIcon } from '../../utils/icons';
import type { Transaction, TransactionType } from '../../types';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  onClose
}) => {
  const { categories, updateTransaction, deleteTransaction, settings } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (transaction && isOpen) {
      setType(transaction.type);
      setAmountStr(transaction.amount.toString());
      setSelectedCategoryId(transaction.categoryId);
      setDate(transaction.date);
      setTime(transaction.time || '');
      setNote(transaction.note || '');
      setIsRecurring(!!transaction.isRecurring);
      setShowConfirmDelete(false);
      setErrorMsg('');
    }
  }, [transaction, isOpen]);

  if (!isOpen || !transaction) return null;

  const availableCategories = categories.filter((c) => {
    if (type === 'expense') return c.type === 'expense' && c.active;
    if (type === 'income') return c.type === 'income' && c.active;
    return c.active;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Введите корректную сумму');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTransaction(transaction.id, {
        type,
        amount,
        categoryId: selectedCategoryId,
        date,
        time,
        note: note.trim() || undefined,
        isRecurring
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка обновления');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteTransaction(transaction.id);
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
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Редактирование операции
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4">
          {/* Type Segmented Switcher */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Расход
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Доход
            </button>
            <button
              type="button"
              onClick={() => setType('savings_deposit')}
              className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                type === 'savings_deposit'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <PiggyBank className="w-3.5 h-3.5" />
              В копилку
            </button>
            <button
              type="button"
              onClick={() => setType('savings_withdraw')}
              className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                type === 'savings_withdraw'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Возврат
            </button>
          </div>

          {/* Amount */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 block mb-1">
              Сумма
            </label>
            <div className="flex items-center justify-between">
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent text-3xl font-extrabold text-slate-900 dark:text-white outline-none"
              />
              <span className="text-xl font-bold text-slate-400 ml-2 shrink-0">
                {settings.currency}
              </span>
            </div>
          </div>

          {/* Categories Grid */}
          {(type === 'expense' || type === 'income') && (
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                Категория
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                {availableCategories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold'
                          : 'border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center mb-1 text-white"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] truncate w-full">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Дата
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Время
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Комментарий
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
            />
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="edit-recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 rounded text-sky-500"
            />
            <label htmlFor="edit-recurring" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              Регулярная повторяющаяся операция
            </label>
          </div>

          {errorMsg && (
            <div className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons: Save & Delete */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 active:scale-[0.98] transition cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Сохранить изменения</span>
            </button>

            {!showConfirmDelete ? (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="w-full py-2.5 px-4 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Удалить операцию</span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-center space-y-2">
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  Вы точно хотите удалить эту операцию? Баланс будет пересчитан.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer transition"
                  >
                    Да, удалить
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer transition"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
