import React from 'react';
import { Bell, Moon, Sun, Wallet } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface HeaderProps {
  onOpenNotifications: () => void;
  onNavigateToSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications
}) => {
  const { settings, updateSettings, unreadNotifCount } = useFinance();

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
  };

  const todayFormatted = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 safe-top">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & App title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center shadow-md shadow-sky-500/20 text-white">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Мои Расходы
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {settings.currency}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              {todayFormatted}
            </p>
          </div>
        </div>

        {/* Right actions: Theme toggle & Notification Bell */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            aria-label="Сменить тему"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={onOpenNotifications}
            aria-label="Уведомления"
            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-slate-900">
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
