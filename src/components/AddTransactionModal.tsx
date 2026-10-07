import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Calendar, Clock, Repeat, ArrowUpRight, ArrowDownLeft, PiggyBank, RefreshCw } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { CategoryIcon } from '../utils/icons';
import type { TransactionType } from '../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'expense'
}) => {
  const { categories, addTransaction, settings } = useFinance();

  const [type, setType] = useState<TransactionType>(defaultType);
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);

  // Filter categories matching current operation type
  const availableCategories = categories.filter((c) => {
    if (type === 'expense') return c.type === 'expense' && c.active;
    if (type === 'income') return c.type === 'income' && c.active;
    return c.active;
  });

  // Pre-fill date and time on open
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setDate(now.toISOString().split('T')[0]);
      setTime(now.toTimeString().substring(0, 5));
      setAmountStr('');
      setNote('');
      setIsRecurring(false);
      setErrorMsg('');
      setType(defaultType);

      // Select first category by default
      const firstCat = categories.find((c) => c.type === (defaultType === 'income' ? 'income' : 'expense'));
      if (firstCat) setSelectedCategoryId(firstCat.id);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, defaultType, categories]);

  // When type changes, ensure valid category is selected
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'expense' || newType === 'income') {
      const firstCat = categories.find((c) => c.type === newType && c.active);
      if (firstCat) setSelectedCategoryId(firstCat.id);
    } else {
      // For savings operations
      const defaultSav = categories.find((c) => c.id === 'cat-other-exp') || categories[0];
      if (defaultSav) setSelectedCategoryId(defaultSav.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Введите корректную сумму');
      return;
    }

    if (!selectedCategoryId && (type === 'expense' || type === 'income')) {
      setErrorMsg('Выберите категорию');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        type,
        amount,
        categoryId: selectedCategoryId || 'cat-other-exp',
        accountId: type.includes('savings') ? 'acc-savings' : 'acc-main',
        date: date || new Date().toISOString().split('T')[0],
        time: time || '12:00',
        note: note.trim() || undefined,
        isRecurring
      });

      // Quick vibration feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка сохранения');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-all animate-fadeIn">
      <div 
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Новая операция
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5">
          {/* Transaction Type Segmented Switcher */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Расход
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Доход
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('savings_deposit')}
              className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                type === 'savings_deposit'
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PiggyBank className="w-3.5 h-3.5" />
              В накопления
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('savings_withdraw')}
              className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                type === 'savings_withdraw'
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Из накоплений
            </button>
          </div>

          {/* Amount Large Input */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition">
            <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 block mb-1">
              Сумма операции
            </label>
            <div className="flex items-center justify-between">
              <input
                ref={inputRef}
                type="number"
                step="any"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="0"
                className="w-full bg-transparent text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white outline-none placeholder-slate-300 dark:placeholder-slate-700"
              />
              <span className="text-xl font-bold text-slate-400 dark:text-slate-500 ml-2 shrink-0">
                {settings.currency}
              </span>
            </div>
          </div>

          {/* Categories Grid (for Expense and Income) */}
          {(type === 'expense' || type === 'income') && (
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                Категория
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1">
                {availableCategories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer min-h-[58px] ${
                        isSelected
                          ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold ring-1 ring-sky-500'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/60'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center mb-1 text-white shadow-xs"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] truncate w-full leading-tight">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date and Time Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Дата
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-500"
                />
                <Calendar className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Время
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-500"
                />
                <Clock className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Комментарий (необязательно)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Например: кофе в кофейне, обед, такси..."
              className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-500 placeholder-slate-400"
            />
          </div>

          {/* Recurring Operation Checkbox */}
          <div className="flex items-center gap-3 pt-1">
            <label className="relative flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-sky-500 focus:ring-sky-400 dark:bg-slate-800"
              />
              <span className="flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-slate-400" />
                Регулярная повторяющаяся операция
              </span>
            </label>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="text-xs text-rose-500 font-medium bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
              {errorMsg}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Сохранить операцию</span>
          </button>
        </form>
      </div>
    </div>
  );
};
