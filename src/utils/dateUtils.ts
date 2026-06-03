import type { PeriodRange } from '@/store/types';

export function getCurrentPeriod(startDay: number): PeriodRange {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  let periodStart: Date;
  if (day >= startDay) {
    periodStart = new Date(year, month, startDay);
  } else {
    periodStart = new Date(year, month - 1, startDay);
  }

  const periodEnd = new Date(
    periodStart.getFullYear(),
    periodStart.getMonth() + 1,
    startDay - 1
  );

  const totalDays =
    Math.round((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysElapsed =
    Math.round((today.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return {
    start: periodStart,
    end: periodEnd,
    totalDays,
    daysElapsed: Math.min(Math.max(daysElapsed, 1), totalDays),
  };
}

export function formatPeriod(period: PeriodRange): string {
  const s = period.start;
  const e = period.end;
  return `${s.getMonth() + 1}/${s.getDate()} ~ ${e.getMonth() + 1}/${e.getDate()}`;
}

export function isInPeriod(dateStr: string, period: PeriodRange): boolean {
  const date = new Date(dateStr + 'T00:00:00');
  return date >= period.start && date <= period.end;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function getTodayStr(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '早安';
  if (hour < 18) return '午安';
  return '晚安';
}

export function getWeekdayStr(): string {
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return days[new Date().getDay()];
}

export function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}
