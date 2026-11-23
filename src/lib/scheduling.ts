import type { LawyerAvailability } from '@/types';

/**
 * ---------------------------------------------------------------------------
 * CÁLCULO DE HORARIOS DISPONIBLES
 * ---------------------------------------------------------------------------
 * Funciones puras, sin acceso a datos, compartidas por el servidor y por el
 * formulario de citas. Todas las fechas se manejan como cadenas «YYYY-MM-DD»
 * para evitar desplazamientos por zona horaria.
 * ---------------------------------------------------------------------------
 */

export const WEEKDAY_LABELS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

export const MONTH_LABELS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

/** «YYYY-MM-DD» de una fecha local, sin pasar por UTC. */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Convierte «YYYY-MM-DD» en una fecha local a medianoche. */
export function fromISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function weekdayOf(iso: string): number {
  return fromISODate(iso).getDay();
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function toTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

/**
 * Genera los horarios de un día a partir de las franjas de atención del
 * abogado, descontando los ya ocupados.
 */
export function buildSlots({
  availability,
  date,
  taken = [],
  now = new Date(),
  minNoticeMinutes = 60,
}: {
  availability: LawyerAvailability[];
  date: string;
  taken?: string[];
  now?: Date;
  minNoticeMinutes?: number;
}): { time: string; available: boolean }[] {
  const weekday = weekdayOf(date);
  const ranges = availability.filter((slot) => slot.is_active && slot.weekday === weekday);
  if (ranges.length === 0) return [];

  const isToday = date === toISODate(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes() + minNoticeMinutes;
  const takenSet = new Set(taken.map((time) => time.slice(0, 5)));

  const slots: { time: string; available: boolean }[] = [];

  for (const range of ranges) {
    const start = toMinutes(range.start_time);
    const end = toMinutes(range.end_time);
    const step = range.slot_minutes > 0 ? range.slot_minutes : 45;

    for (let minute = start; minute + step <= end; minute += step) {
      const time = toTime(minute);
      const isPast = isToday && minute < nowMinutes;
      slots.push({ time, available: !takenSet.has(time) && !isPast });
    }
  }

  return slots.sort((a, b) => a.time.localeCompare(b.time));
}

/** Los próximos `days` días naturales a partir de mañana. */
export function upcomingDates(days = 28, from = new Date()): string[] {
  const dates: string[] = [];
  for (let offset = 1; offset <= days; offset += 1) {
    const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset);
    dates.push(toISODate(date));
  }
  return dates;
}

/** «lunes 14 de septiembre». */
export function formatDateWithWeekday(iso: string): string {
  const date = fromISODate(iso);
  return `${WEEKDAY_LABELS[date.getDay()].toLowerCase()} ${date.getDate()} de ${MONTH_LABELS[date.getMonth()]}`;
}
