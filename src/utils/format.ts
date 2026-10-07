import type { Transaction, Category } from '../types';

export function formatMoney(amount: number, currency: string = 'TJS'): string {
  const parts = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${parts} ${currency}`;
}

export function formatPreciseMoney(amount: number, currency: string = 'TJS'): string {
  const formatted = amount.toLocaleString('ru-RU', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });
  return `${formatted} ${currency}`;
}

export function formatDateLabel(dateStr: string): string {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateStr === todayStr) return 'Сегодня';
  if (dateStr === yesterdayStr) return 'Вчера';

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  }

  return dateStr;
}

export function exportTransactionsToCSV(transactions: Transaction[], categories: Category[], currency: string = 'TJS'): void {
  const catMap = new Map<string, string>();
  categories.forEach(c => catMap.set(c.id, c.name));

  const headers = ['ID', 'Тип', 'Сумма', 'Валюта', 'Категория', 'Дата', 'Время', 'Комментарий'];

  const typeLabels: Record<string, string> = {
    expense: 'Расход',
    income: 'Доход',
    savings_deposit: 'Перевод в накопления',
    savings_withdraw: 'Возврат из накоплений'
  };

  const rows = transactions.map(t => [
    t.id,
    typeLabels[t.type] || t.type,
    t.amount.toString(),
    currency,
    `"${(catMap.get(t.categoryId) || 'Без категории').replace(/"/g, '""')}"`,
    t.date,
    t.time || '',
    `"${(t.note || '').replace(/"/g, '""')}"`
  ]);

  // Prepend UTF-8 BOM \uFEFF for Excel compatibility
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `moi_raskhody_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
