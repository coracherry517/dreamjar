import { useTranslation } from 'react-i18next';
import { useSetting } from './db';

export const currencies = ['CNY', 'USD', 'EUR', 'JPY', 'GBP', 'TWD', 'HKD'];

export function defaultCurrency(lang: string) {
  if (lang.startsWith('zh')) return 'CNY';
  if (lang.startsWith('ja')) return 'JPY';
  if (lang.startsWith('de')) return 'EUR';
  return 'USD';
}

export function useMoney() {
  const { i18n } = useTranslation();
  const [currency] = useSetting('currency', defaultCurrency(i18n.language));
  const fmt = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  });
  return (n: number) => fmt.format(n || 0);
}

export function localDate(d = new Date()) {
  const shifted = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 10);
}

export function formatDate(iso: string, lang: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(lang, { dateStyle: 'medium' }).format(new Date(y, m - 1, d));
}

export function toNumber(v: string) {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}
