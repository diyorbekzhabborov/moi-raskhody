import React, { useState, useEffect } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { AVAILABLE_ICONS, CategoryIcon } from '../../utils/icons';
import type { Category } from '../../types';

interface CategoryModalProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#f97316', '#ef4444', '#ec4899', '#a855f7', '#6366f1',
  '#3b82f6', '#06b6d4', '#14b8a6', '#10b981', '#84cc16',
  '#eab308', '#64748b'
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  category,
  isOpen,
  onClose
}) => {
  const { addCategory, updateCategory, deleteCategory, settings } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [icon, setIcon] = useState('ShoppingBag');
  const [color, setColor] = useState('#3b82f6');
  const [budgetLimitStr, setBudgetLimitStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isEditing = !!category;

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setName(category.name);
        setType(category.type);
        setIcon(category.icon);
        setColor(category.color);
        setBudgetLimitStr(category.monthlyBudgetLimit ? category.monthlyBudgetLimit.toString() : '');
      } else {
        setName('');
        setType('expense');
        setIcon('ShoppingBag');
        setColor('#3b82f6');
        setBudgetLimitStr('');
      }
      setErrorMsg('');
    }
  }, [isOpen, category]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Укажите название категории');
      return;
    }

    const limit = budgetLimitStr ? parseFloat(budgetLimitStr) : undefined;

    setIsSubmitting(true);
    try {
      if (isEditing && category) {
        await updateCategory(category.id, {
          name: name.trim(),
          type,
          icon,
          color,
          monthlyBudgetLimit: limit
        });
      } else {
        await addCategory({
          name: name.trim(),
          type,
          icon,
          color,
          monthlyBudgetLimit: limit,
          active: true
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка сохранения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    setIsSubmitting(true);
    try {
      await deleteCategory(category.id);
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
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Редактировать категорию' : 'Новая категория'}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4">
          {/* Type */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 rounded-lg transition cursor-pointer ${
                type === 'expense' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Категория расхода
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 rounded-lg transition cursor-pointer ${
                type === 'income' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Источник дохода
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Название
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Кафе, Такси, Курсы..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-500"
              autoFocus
            />
          </div>

          {/* Monthly Budget Limit (for expense) */}
          {type === 'expense' && (
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Месячный лимит бюджета ({settings.currency})
              </label>
              <input
                type="number"
                value={budgetLimitStr}
                onChange={(e) => setBudgetLimitStr(e.target.value)}
                placeholder="Необязательно (например 500)"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Приложение предупредит, если расходы превысят эту сумму.
              </span>
            </div>
          )}

          {/* Icon Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
              Иконка
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1">
              {AVAILABLE_ICONS.map((iconKey) => (
                <button
                  type="button"
                  key={iconKey}
                  onClick={() => setIcon(iconKey)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${
                    icon === iconKey
                      ? 'bg-sky-500 text-white ring-2 ring-sky-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <CategoryIcon name={iconKey} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
              Цвет
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition transform cursor-pointer ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-sky-500 dark:ring-offset-slate-900' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isEditing ? 'Сохранить изменения' : 'Создать категорию'}</span>
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-2 px-4 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Удалить категорию</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
