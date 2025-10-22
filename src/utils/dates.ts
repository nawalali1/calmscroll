export const DAY_KEY_FORMAT = "YYYYMMDD";

const pad = (value: number) => value.toString().padStart(2, "0");

export function toDayKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  return `${year}${month}${day}`;
}

export function fromDayKey(dayKey: string): Date {
  const year = Number(dayKey.slice(0, 4));
  const month = Number(dayKey.slice(4, 6)) - 1;
  const day = Number(dayKey.slice(6, 8));
  return new Date(Date.UTC(year, month, day));
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

export function getDayRange(days: number): string[] {
  const keys: string[] = [];
  const today = startOfDay(new Date());
  for (let i = 0; i < days; i += 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - i);
    keys.push(toDayKey(date));
  }
  return keys;
}

export function minutesBetween(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

export function todayKey(): string {
  return toDayKey(new Date());
}
