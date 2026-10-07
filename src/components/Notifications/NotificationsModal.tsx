import React from 'react';
import { X, Bell, AlertTriangle, CheckCircle2, Info, Trash2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead, clearAllNotifications } = useFinance();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-all animate-fadeIn">
      <div 
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-sky-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Центр уведомлений
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                title="Очистить все"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-1">
              <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 stroke-[1.5]" />
              <p className="font-semibold text-slate-500">Уведомлений пока нет</p>
              <p>Здесь будут появляться напоминания и подсказки</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isWarning = notif.type === 'warning';
              const isSuccess = notif.type === 'success';

              return (
                <div
                  key={notif.id}
                  onClick={() => markNotificationRead(notif.id)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                    notif.read
                      ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800/60 opacity-70'
                      : 'bg-white dark:bg-slate-800 border-sky-100 dark:border-sky-900/50 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {isWarning ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      ) : isSuccess ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Info className="w-4 h-4 text-sky-500" />
                      )}
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="text-[10px] text-slate-400 pt-0.5">
                        {notif.date}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
