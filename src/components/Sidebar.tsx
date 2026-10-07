import React from 'react';
import { Home, ReceiptText, Plus, PiggyBank, PieChart, Settings, Wallet, ChevronRight } from 'lucide-react';
import type { NavTab } from './BottomNav';
import { useFinance } from '../context/FinanceContext';
import { formatMoney } from '../utils/format';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddModal
}) => {
  const { totalCapital, settings } = useFinance();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Главная', icon: Home },
    { id: 'transactions' as NavTab, label: 'Операции', icon: ReceiptText },
    { id: 'savings' as NavTab, label: 'Накопления и цели', icon: PiggyBank },
    { id: 'analytics' as NavTab, label: 'Статистика', icon: PieChart },
    { id: 'settings' as NavTab, label: 'Настройки', icon: Settings }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 min-h-screen sticky top-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 py-4 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center shadow-md shadow-sky-500/20 text-white shrink-0">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
            Мои Расходы
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {settings.currency}
            </span>
          </div>
          <span className="text-xs text-slate-400">Личные финансы</span>
        </div>
      </div>

      {/* Quick Add Button */}
      <button
        onClick={onOpenAddModal}
        className="w-full mb-6 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-white font-medium flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 transition active:scale-[0.98] cursor-pointer"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>Добавить операцию</span>
      </button>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                isActive
                  ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-sky-500 dark:text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-sky-500 dark:text-sky-400" />}
            </button>
          );
        })}
      </nav>

      {/* Desktop Total Capital Quick widget */}
      <div className="mt-auto p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Общий капитал</div>
        <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
          {formatMoney(totalCapital, settings.currency)}
        </div>
      </div>
    </aside>
  );
};
