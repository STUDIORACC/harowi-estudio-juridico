/**
 * Utilidades de fecha del CRM.
 * Trabajan con cadenas locales (`YYYY-MM-DD` y `YYYY-MM-DDTHH:mm`) y nunca con
 * zonas horarias: así «hoy» es siempre el día que ve el usuario en Lima.
 */

const pad = (n: number) => String(n).padStart(2, '0');

export const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
export const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const WEEKDAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function nowLocal() {
  const d = new Date();
  return `${toISODate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function nowTime() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Construye un `Date` local a mediodía para evitar saltos por cambio horario. */
export function parseISODate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
}

export function addDays(iso: string, n: number) {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function diffDays(a: string, b: string) {
  return Math.round((parseISODate(a).getTime() - parseISODate(b).getTime()) / 86_400_000);
}

export function weekdayOf(iso: string) {
  return parseISODate(iso).getDay();
}

/** Lunes de la semana de `iso`. */
export function startOfWeek(iso: string) {
  const wd = weekdayOf(iso);
  return addDays(iso, wd === 0 ? -6 : 1 - wd);
}

export function monthKey(iso: string) {
  return iso.slice(0, 7);
}

export function addMonths(iso: string, n: number) {
  const d = parseISODate(iso);
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  return toISODate(d);
}

/** Matriz de semanas (lunes a domingo) que cubre el mes de `iso`. */
export function monthMatrix(iso: string) {
  const first = `${iso.slice(0, 7)}-01`;
  const start = startOfWeek(first);
  const cells: string[] = [];
  for (let i = 0; i < 42; i++) cells.push(addDays(start, i));
  const weeks: string[][] = [];
  for (let i = 0; i < 42; i += 7) weeks.push(cells.slice(i, i + 7));
  // Se descarta la última fila si es íntegramente del mes siguiente.
  if (weeks[5] && weeks[5].every((c) => c.slice(0, 7) !== iso.slice(0, 7))) weeks.pop();
  return weeks;
}

export function formatDate(iso: string, style: 'short' | 'medium' | 'long' | 'weekday' = 'medium') {
  if (!iso) return '—';
  const d = parseISODate(iso);
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const monthShort = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  switch (style) {
    case 'short':
      return `${pad(day)}/${pad(d.getMonth() + 1)}/${year}`;
    case 'long':
      return `${day} de ${month} de ${year}`;
    case 'weekday':
      return `${WEEKDAYS[d.getDay()]} ${day} de ${month}`;
    default:
      return `${day} ${monthShort} ${year}`;
  }
}

/** «lun 24 nov». */
export function formatDayChip(iso: string) {
  const d = parseISODate(iso);
  return `${WEEKDAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** `15:30` → `3:30 p. m.` */
export function formatTime12(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'p. m.' : 'a. m.';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${pad(m ?? 0)} ${suffix}`;
}

export function timeToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minutesToTime(min: number) {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

export function addMinutes(hhmm: string, min: number) {
  return minutesToTime(timeToMinutes(hhmm) + min);
}

/** Etiqueta relativa para fechas cercanas: Hoy, Mañana, Ayer, en 3 días, hace 2 días. */
export function relativeDay(iso: string, today = todayISO()) {
  const n = diffDays(iso, today);
  if (n === 0) return 'Hoy';
  if (n === 1) return 'Mañana';
  if (n === -1) return 'Ayer';
  if (n > 1 && n <= 14) return `En ${n} días`;
  if (n < -1 && n >= -14) return `Hace ${-n} días`;
  return formatDate(iso, 'medium');
}

/** Hora de un mensaje: hoy → `14:05`; ayer → `Ayer`; antes → `24 nov`. */
export function formatMessageStamp(at: string, now = nowLocal()) {
  const day = at.slice(0, 10);
  const today = now.slice(0, 10);
  if (day === today) return at.slice(11, 16);
  if (diffDays(today, day) === 1) return 'Ayer';
  const d = parseISODate(day);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** Cadena `YYYY-MM-DDTHH:mm` de un instante relativo a hoy. */
export function stamp(offsetDays: number, time: string) {
  return `${addDays(todayISO(), offsetDays)}T${time}`;
}

/** Suma `n` días a una cadena de fecha o de fecha-hora, conservando la hora. */
export function shiftStamp(value: string, n: number) {
  return `${addDays(value.slice(0, 10), n)}${value.slice(10)}`;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/;

/** Desplaza todas las fechas de un árbol de datos `n` días (reubica la demo en el tiempo). */
export function shiftTree<T>(value: T, n: number): T {
  if (n === 0) return value;
  if (typeof value === 'string') {
    return (ISO_DATE.test(value) ? shiftStamp(value, n) : value) as unknown as T;
  }
  if (Array.isArray(value)) return value.map((v) => shiftTree(v, n)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = shiftTree(v, n);
    return out as T;
  }
  return value;
}
