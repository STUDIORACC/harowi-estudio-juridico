import { BLOCKING_STATUSES } from '../constants';
import type { Appointment, AreaId, Member, SlotOffer } from '../types';
import { addDays, addMinutes, nowLocal, timeToMinutes, todayISO, weekdayOf } from './dates';

/**
 * Disponibilidad y reservas. Es la única fuente de verdad para saber si un
 * horario está libre: la usan la agenda, el formulario de citas y el asistente.
 */

const STEP_MIN = 30;
/** Antelación mínima para ofrecer un horario del mismo día. */
const LEAD_MIN = 60;

export function overlaps(aStart: string, aDur: number, bStart: string, bDur: number) {
  const a0 = timeToMinutes(aStart);
  const b0 = timeToMinutes(bStart);
  return a0 < b0 + bDur && b0 < a0 + aDur;
}

/** ¿Existe otra cita del mismo abogado que se cruce con el horario pedido? */
export function findConflict(
  appointments: Appointment[],
  lawyerId: string,
  date: string,
  time: string,
  durationMin: number,
  ignoreId?: string,
) {
  return (
    appointments.find(
      (a) =>
        a.id !== ignoreId &&
        a.lawyerId === lawyerId &&
        a.date === date &&
        BLOCKING_STATUSES.includes(a.status) &&
        overlaps(a.time, a.durationMin, time, durationMin),
    ) ?? null
  );
}

export function isWithinAvailability(member: Member, date: string, time: string, durationMin: number) {
  const wd = weekdayOf(date);
  const end = addMinutes(time, durationMin);
  return member.availability.some(
    (r) => r.weekday === wd && timeToMinutes(r.start) <= timeToMinutes(time) && timeToMinutes(end) <= timeToMinutes(r.end),
  );
}

/** Horarios libres de un abogado en una fecha (cada 30 minutos dentro de su disponibilidad). */
export function freeSlots(opts: {
  member: Member;
  date: string;
  appointments: Appointment[];
  durationMin: number;
  ignoreId?: string;
  now?: string;
}) {
  const { member, date, appointments, durationMin, ignoreId } = opts;
  const now = opts.now ?? nowLocal();
  const today = now.slice(0, 10);
  if (date < today) return [];
  const wd = weekdayOf(date);
  const minAllowed = date === today ? timeToMinutes(now.slice(11, 16)) + LEAD_MIN : -1;
  const out: string[] = [];
  for (const rule of member.availability.filter((r) => r.weekday === wd)) {
    for (let t = timeToMinutes(rule.start); t + durationMin <= timeToMinutes(rule.end); t += STEP_MIN) {
      if (t < minAllowed) continue;
      const hhmm = addMinutes('00:00', t);
      if (findConflict(appointments, member.id, date, hhmm, durationMin, ignoreId)) continue;
      out.push(hhmm);
    }
  }
  return out;
}

/**
 * Próximos horarios para ofrecer en una conversación: en cada día disponible
 * se propone el primer horario de la mañana y el primero de la tarde, hasta
 * completar `count` opciones.
 */
export function nextSlots(opts: {
  member: Member;
  appointments: Appointment[];
  durationMin: number;
  count?: number;
  maxDays?: number;
  fromDate?: string;
  now?: string;
  skip?: SlotOffer[];
}): SlotOffer[] {
  const { member, appointments, durationMin, count = 3, maxDays = 21, skip = [] } = opts;
  const now = opts.now ?? nowLocal();
  const start = opts.fromDate ?? now.slice(0, 10);
  const offers: SlotOffer[] = [];
  for (let i = 0; i <= maxDays && offers.length < count; i++) {
    const date = addDays(start, i);
    const slots = freeSlots({ member, date, appointments, durationMin, now }).filter(
      (t) => !skip.some((s) => s.date === date && s.time === t && s.lawyerId === member.id),
    );
    if (!slots.length) continue;
    const morning = slots.find((t) => timeToMinutes(t) < 13 * 60);
    const afternoon = slots.find((t) => timeToMinutes(t) >= 15 * 60);
    for (const t of [morning ?? slots[0], afternoon]) {
      if (t && offers.length < count && !offers.some((o) => o.date === date && o.time === t)) {
        offers.push({ date, time: t, lawyerId: member.id });
      }
    }
  }
  return offers;
}

/** Abogado más indicado para un área: el de menor carga de citas futuras. */
export function pickLawyer(members: Member[], area: AreaId, appointments: Appointment[]) {
  const today = todayISO();
  const candidates = members.filter((m) => m.kind === 'abogado' && m.areas.includes(area));
  if (!candidates.length) return members.find((m) => m.kind === 'abogado') ?? null;
  const load = (id: string) =>
    appointments.filter((a) => a.lawyerId === id && a.date >= today && BLOCKING_STATUSES.includes(a.status)).length;
  // El primero de la lista es el titular del área; solo cede si otro tiene bastante menos carga.
  return candidates.reduce((best, m) => (load(m.id) + 3 < load(best.id) ? m : best), candidates[0]);
}
