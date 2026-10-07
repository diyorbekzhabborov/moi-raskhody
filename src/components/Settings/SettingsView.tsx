import React, { useState, useRef } from 'react';
import {
  Moon,
  Sun,
  Laptop,
  Bell,
  Coins,
  Tags,
  Download,
  Upload,
  FileText,
  AlertTriangle,
  Plus,
  Edit2,
  Smartphone,
  Share,
  Check
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney, exportTransactionsToCSV } from '../../utils/format';
import { CategoryIcon } from '../../utils/icons';
import type { Category } from '../../types';

interface SettingsViewProps {
  onOpenCategoryModal: (cat: Category | null) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenCategoryModal }) => {
  const {
    settings,
    updateSettings,
    categories,
    transactions,
    exportToJson,
    importFromJson,
    resetToDefaults
  } = useFinance();

  const [reminderTimeInput, setReminderTimeInput] = useState(settings.dailyReminderTime);
  const [importStatus, setImportStatus] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Currency save
  const handleSaveCurrency = async (val: string) => {
    await updateSettings({ currency: val });
    showSuccessToast('Валюта сохранена');
  };

  const showSuccessToast = (msg: string) => {
    setSavedSuccessMsg(msg);
    setTimeout(() => setSavedSuccessMsg(''), 3000);
  };

  // Notification toggle helper
  const handleToggleNotification = async (key: keyof typeof settings.notifications) => {
    const updated = {
      ...settings.notifications,
      [key]: !settings.notifications[key]
    };
    await updateSettings({ notifications: updated });
  };

  // JSON Backup Export
  const handleExportJSON = async () => {
    const jsonStr = await exportToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moi_raskhody_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccessToast('Резервная копия скачана');
  };

  // JSON Import
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = await importFromJson(content);
        setImportStatus(res.message);
        if (res.success) {
          showSuccessToast('Данные успешно импортированы');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // PDF / Print Report Generator (Section 17: Экспорт отчёта за выбранный период в PDF)
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Настройки приложения
        </h2>
        <p className="text-xs text-slate-400">
          Валюта, темы, категории, уведомления и резервное копирование
        </p>
      </div>

      {savedSuccessMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      {/* 1. Currency Settings (Section 1 & 15) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Основная валюта
            </h4>
            <p className="text-[11px] text-slate-400">
              По умолчанию: таджикский сомони (TJS)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
          {['TJS', 'сомони', 'USD', 'RUB', 'EUR'].map((curr) => (
            <button
              key={curr}
              onClick={() => handleSaveCurrency(curr)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                settings.currency === curr
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Appearance Theme (Light / Dark / System) (Section 13) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Тема оформления
            </h4>
            <p className="text-[11px] text-slate-400">
              Светлая, тёмная или системная
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { id: 'light' as const, label: 'Светлая', icon: Sun },
            { id: 'dark' as const, label: 'Тёмная', icon: Moon },
            { id: 'system' as const, label: 'Системная', icon: Laptop }
          ].map((themeItem) => {
            const Icon = themeItem.icon;
            const isSelected = settings.theme === themeItem.id;
            return (
              <button
                key={themeItem.id}
                onClick={() => updateSettings({ theme: themeItem.id })}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{themeItem.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Category Management (Section 6 & 7) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Tags className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                Категории и лимиты
              </h4>
              <p className="text-[11px] text-slate-400">
                Создавайте свои категории и задавайте бюджеты
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenCategoryModal(null)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-semibold shadow-xs hover:bg-sky-600 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Категория</span>
          </button>
        </div>

        {/* Categories List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onOpenCategoryModal(cat)}
              className="py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs"
                  style={{ backgroundColor: cat.color }}
                >
                  <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {cat.name}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {cat.type === 'expense' ? 'Расход' : 'Доход'}
                    {cat.monthlyBudgetLimit ? ` · Лимит: ${formatMoney(cat.monthlyBudgetLimit, settings.currency)}/мес` : ''}
                  </div>
                </div>
              </div>

              <Edit2 className="w-3.5 h-3.5 text-slate-400 hover:text-sky-500" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Notifications & Reminders (Section 12) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Уведомления и напоминания
            </h4>
            <p className="text-[11px] text-slate-400">
              Настройте напоминания для сохранения финансовой дисциплины
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {/* Daily Reminder */}
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Ежедневное напоминание о расходах
              </div>
              <div className="text-[11px] text-slate-400">
                «Не забудьте записать сегодняшние расходы»
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.dailyReminder}
              onChange={() => handleToggleNotification('dailyReminder')}
              className="w-4 h-4 rounded text-sky-500"
            />
          </div>

          {/* Reminder Time Picker */}
          {settings.notifications.dailyReminder && (
            <div className="flex items-center justify-between py-1 pl-4 border-l-2 border-sky-500 text-xs">
              <span className="text-slate-500">Время ежедневного напоминания:</span>
              <input
                type="time"
                value={reminderTimeInput}
                onChange={async (e) => {
                  setReminderTimeInput(e.target.value);
                  await updateSettings({ dailyReminderTime: e.target.value });
                }}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Goal Deadline Alert */}
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Приближение дедлайна цели
              </div>
              <div className="text-[11px] text-slate-400">
                Предупреждения о сроках накопления
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.goalDeadlineWarning}
              onChange={() => handleToggleNotification('goalDeadlineWarning')}
              className="w-4 h-4 rounded text-sky-500"
            />
          </div>

          {/* Category Limit Warning */}
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Превышение лимита категории
              </div>
              <div className="text-[11px] text-slate-400">
                Сигнал при выходе за месячный бюджет категории
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.categoryLimitWarning}
              onChange={() => handleToggleNotification('categoryLimitWarning')}
              className="w-4 h-4 rounded text-sky-500"
            />
          </div>

          {/* Savings Reminders */}
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Напоминания о накоплениях
              </div>
              <div className="text-[11px] text-slate-400">
                Подсказка отложить часть дохода
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.savingsReminders}
              onChange={() => handleToggleNotification('savingsReminders')}
              className="w-4 h-4 rounded text-sky-500"
            />
          </div>
        </div>
      </div>

      {/* 5. iPhone Safari & PWA Guide (Section 13 & 14) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Установка на iPhone (PWA)
            </h4>
            <p className="text-[11px] text-slate-400">
              Работает как родное iOS приложение без App Store
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 text-xs space-y-2 text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center text-[10px]">1</span>
            <span>Откройте сайт в <strong>Safari</strong> на вашем iPhone</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center text-[10px]">2</span>
            <span>Нажмите кнопку «Поделиться» <Share className="w-3.5 h-3.5 inline mx-0.5 text-sky-500" /> внизу экрана</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center text-[10px]">3</span>
            <span>Прокрутите вниз и выберите <strong>«На экран «Домой»</strong></span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">
            ✓ Иконка появится на рабочем столе iPhone, приложение работает быстро и сохраняет данные даже офлайн!
          </p>
        </div>
      </div>

      {/* 6. Export and Backup (Section 17) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Экспорт и резервная копия
            </h4>
            <p className="text-[11px] text-slate-400">
              Сохраняйте и переносите свои финансовые данные
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* CSV */}
          <button
            onClick={() => exportTransactionsToCSV(transactions, categories, settings.currency)}
            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-500 mb-1" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Экспорт в CSV</span>
            <span className="text-[10px] text-slate-400">Таблица операций</span>
          </button>

          {/* PDF Report */}
          <button
            onClick={handleExportPDF}
            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-rose-500 mb-1" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Отчёт в PDF / Печать</span>
            <span className="text-[10px] text-slate-400">Печатный отчёт</span>
          </button>

          {/* JSON Backup */}
          <button
            onClick={handleExportJSON}
            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-sky-500 mb-1" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Бекап в JSON</span>
            <span className="text-[10px] text-slate-400">Все данные базы</span>
          </button>
        </div>

        {/* Restore from JSON */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-500" />
            <span>Восстановить данные из JSON файла</span>
          </button>
          {importStatus && (
            <p className="text-[11px] text-center text-sky-500 mt-1">{importStatus}</p>
          )}
        </div>
      </div>

      {/* 7. Danger Zone: Reset Data */}
      <div className="p-5 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-3">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-4 h-4" />
          <h4 className="font-bold text-sm">Сброс данных</h4>
        </div>
        <p className="text-xs text-rose-600/80 dark:text-rose-400/80">
          Восстановление стандартных демо-данных с целью на 10 000 TJS. Все текущие изменения будут заменены.
        </p>

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="py-2 px-4 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition cursor-pointer"
          >
            Сбросить к исходным данным
          </button>
        ) : (
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-rose-300 dark:border-rose-800 space-y-2">
            <p className="text-xs font-bold text-rose-600">
              Вы уверены? Данные будут перезаписаны исходным набором из ТЗ.
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await resetToDefaults();
                  setShowResetConfirm(false);
                  showSuccessToast('Данные сброшены к исходным');
                }}
                className="py-1.5 px-3 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                Да, сбросить
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="py-1.5 px-3 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
