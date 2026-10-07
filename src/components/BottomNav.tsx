import React from 'react';
import { Home, ReceiptText, Plus, PiggyBank, PieChart, Settings as SettingsIcon } from 'lucide-react';

export type NavTab = 'dashboard' | 'transactions' | 'savings' | 'analytics' | 'settings';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddModal
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 safe-bottom">
      <nav className="flex items-center justify-around px-2 py-1">
        {/* Главная */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 transition-all rounded-xl active:scale-95 cursor-pointer ${
            currentTab === 'dashboard'
              ? 'text-sky-500 dark:text-sky-400 font-semibold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Главная</span>
        </button>

        {/* Операции */}
        <button
          onClick={() => onSelectTab('transactions')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 transition-all rounded-xl active:scale-95 cursor-pointer ${
            currentTab === 'transactions'
              ? 'text-sky-500 dark:text-sky-400 font-semibold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <ReceiptText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Операции</span>
        </button>

        {/* Big Center Action Button: + */}
        <div className="flex items-center justify-center px-1">
          <button
            onClick={onOpenAddModal}
            aria-label="Добавить операцию"
            className="w-13 h-13 -mt-5 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 hover:from-sky-400 hover:to-emerald-300 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 transition-transform transform active:scale-90 active:rotate-45 cursor-pointer ring-4 ring-white dark:ring-slate-900"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Накопления */}
        <button
          onClick={() => onSelectTab('savings')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 transition-all rounded-xl active:scale-95 cursor-pointer ${
            currentTab === 'savings'
              ? 'text-sky-500 dark:text-sky-400 font-semibold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <PiggyBank className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Накопления</span>
        </button>

        {/* Статистика */}
        <button
          onClick={() => onSelectTab('analytics')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 transition-all rounded-xl active:scale-95 cursor-pointer ${
            currentTab === 'analytics'
              ? 'text-sky-500 dark:text-sky-400 font-semibold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <PieChart className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Статистика</span>
        </button>

        {/* Настройки */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 transition-all rounded-xl active:scale-95 cursor-pointer ${
            currentTab === 'settings'
              ? 'text-sky-500 dark:text-sky-400 font-semibold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <SettingsIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Настройки</span>
        </button>
      </nav>
    </div>
  );
};
