export function dateOnly(iso: string) {
  return iso.slice(0, 10);
}

export function timeOnly(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

export function getWeekDays(d: Date) {
  const start = getMonday(d);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(start);
    next.setDate(start.getDate() + i);
    days.push(next);
  }
  return days;
}

export function getCalendarMonthDays(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const dayOfWeek = start.getDay();
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const calendarStart = new Date(start);
  calendarStart.setDate(start.getDate() - offset);

  const days: Date[] = [];
  for (let i = 0; i < 35; i++) {
    const next = new Date(calendarStart);
    next.setDate(calendarStart.getDate() + i);
    days.push(next);
  }
  return days;
}

export function formatToYMD(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
