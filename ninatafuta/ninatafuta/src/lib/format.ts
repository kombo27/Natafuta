import type { Currency, Lang } from '../types';

export function money(amount: number, currency: Currency): string {
  return `${currency} ${Math.round(amount).toLocaleString('en-US')}`;
}

export function timeAgo(ts: number, lang: Lang, now = Date.now()): string {
  const days = Math.floor((startOfDay(now) - startOfDay(ts)) / 86_400_000);
  if (days <= 0) return lang === 'sw' ? 'Leo' : 'Today';
  if (days === 1) return lang === 'sw' ? 'Jana' : 'Yesterday';
  return lang === 'sw' ? `Siku ${days} zilizopita` : `${days} days ago`;
}

export function clock(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function dateShort(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function km(d: number): string {
  return d < 10 ? `${d.toFixed(1)} km` : `${Math.round(d).toLocaleString('en-US')} km`;
}
