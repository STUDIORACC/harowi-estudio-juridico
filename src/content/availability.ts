import type { BlockedDate, LawyerAvailability } from '@/types';
import { demoLawyers } from './lawyers';

/**
 * ---------------------------------------------------------------------------
 * DISPONIBILIDAD DE DEMOSTRACIÓN
 * ---------------------------------------------------------------------------
 * Horario de atención por abogado y día de la semana. Se administra desde
 * /admin/citas y vive en la tabla `lawyer_availability`.
 *
 * weekday: 0 = domingo … 6 = sábado (compatible con `Date.getDay()`).
 * ---------------------------------------------------------------------------
 */

/** Franjas por defecto: mañana y tarde de lunes a viernes, mañana los sábados. */
const WEEK_PATTERN: { weekday: number; start_time: string; end_time: string }[] = [
  { weekday: 1, start_time: '09:00', end_time: '13:00' },
  { weekday: 1, start_time: '15:00', end_time: '19:00' },
  { weekday: 2, start_time: '09:00', end_time: '13:00' },
  { weekday: 2, start_time: '15:00', end_time: '19:00' },
  { weekday: 3, start_time: '09:00', end_time: '13:00' },
  { weekday: 3, start_time: '15:00', end_time: '19:00' },
  { weekday: 4, start_time: '09:00', end_time: '13:00' },
  { weekday: 4, start_time: '15:00', end_time: '19:00' },
  { weekday: 5, start_time: '09:00', end_time: '13:00' },
  { weekday: 5, start_time: '15:00', end_time: '19:00' },
  { weekday: 6, start_time: '09:00', end_time: '13:00' },
];

export const DEFAULT_SLOT_MINUTES = 45;

export const demoAvailability: LawyerAvailability[] = demoLawyers.flatMap((lawyer, lawyerIndex) =>
  WEEK_PATTERN.map((slot, slotIndex) => ({
    id: `88888888-8888-4888-8888-88${String(lawyerIndex).padStart(2, '0')}${String(slotIndex).padStart(2, '0')}8888`,
    lawyer_id: lawyer.id,
    weekday: slot.weekday,
    start_time: slot.start_time,
    end_time: slot.end_time,
    slot_minutes: DEFAULT_SLOT_MINUTES,
    is_active: true,
  })),
);

/** Sin fechas bloqueadas en la demostración; se cargan desde el panel. */
export const demoBlockedDates: BlockedDate[] = [];
