import { ACTIVE_CASE_STATUSES, OPEN_STAGES, STAGES } from '../constants';
import { MONTHS_SHORT, addDays, diffDays, monthKey, startOfWeek, todayISO } from '../lib/dates';
import { KNOWLEDGE_SERVICES } from '../knowledge/services';
import type { Appointment, AreaId, CrmState, Prospect } from '../types';
import { isTaskOverdue } from './selectors';

/**
 * Cálculos de la pantalla de Reportes. Todo sale de los registros locales y
 * respeta los filtros de periodo, área y abogado.
 */

export type Period = '30d' | '90d' | '180d' | '365d' | 'all';

export const PERIODS: { id: Period; label: string }[] = [
  { id: '30d', label: 'Últimos 30 días' },
  { id: '90d', label: 'Últimos 90 días' },
  { id: '180d', label: 'Últimos 6 meses' },
  { id: '365d', label: 'Últimos 12 meses' },
  { id: 'all', label: 'Todo el historial' },
];

export interface ReportFilters {
  period: Period;
  area: AreaId | '';
  lawyerId: string;
}

export function periodStart(period: Period, today = todayISO()): string | null {
  if (period === 'all') return null;
  return addDays(today, -Number(period.replace('d', '')) + 1);
}

export function filterProspects(state: CrmState, f: ReportFilters, today = todayISO()): Prospect[] {
  const from = periodStart(f.period, today);
  return state.prospects.filter((p) => (!from || p.createdAt.slice(0, 10) >= from) && (!f.area || p.area === f.area) && (!f.lawyerId || p.lawyerId === f.lawyerId));
}

export function filterAppointments(state: CrmState, f: ReportFilters, today = todayISO()): Appointment[] {
  const from = periodStart(f.period, today);
  return state.appointments.filter((a) => (!from || a.date >= from) && (!f.area || a.area === f.area) && (!f.lawyerId || a.lawyerId === f.lawyerId));
}

export interface Bucket {
  key: string;
  label: string;
}

/** Cubos de tiempo: semanales para 30 y 90 días; mensuales para periodos más largos. */
export function timeBuckets(period: Period, dates: string[], today = todayISO()): { buckets: Bucket[]; keyOf: (iso: string) => string } {
  if (period === '30d' || period === '90d') {
    const weeks = period === '30d' ? 5 : 13;
    const buckets: Bucket[] = [];
    const lastStart = startOfWeek(today);
    for (let i = weeks - 1; i >= 0; i--) {
      const start = addDays(lastStart, -7 * i);
      buckets.push({ key: start, label: `${Number(start.slice(8))} ${MONTHS_SHORT[Number(start.slice(5, 7)) - 1]}` });
    }
    return { buckets, keyOf: (iso) => startOfWeek(iso) };
  }
  const months = period === '180d' ? 6 : period === '365d' ? 12 : Math.min(18, Math.max(6, monthsBetween(dates.length ? [...dates].sort()[0] : today, today) + 1));
  const buckets: Bucket[] = [];
  const [ty, tm] = [Number(today.slice(0, 4)), Number(today.slice(5, 7))];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(ty, tm - 1 - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({ key, label: months > 6 ? `${MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` : MONTHS_SHORT[d.getMonth()] });
  }
  return { buckets, keyOf: (iso) => monthKey(iso) };
}

function monthsBetween(a: string, b: string) {
  return (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7));
}

export function prospectSeries(prospects: Prospect[], period: Period, today = todayISO()) {
  const { buckets, keyOf } = timeBuckets(period, prospects.map((p) => p.createdAt.slice(0, 10)), today);
  const counts = new Map(buckets.map((b) => [b.key, 0]));
  prospects.forEach((p) => {
    const k = keyOf(p.createdAt.slice(0, 10));
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
  });
  return buckets.map((b) => ({ label: b.label, count: counts.get(b.key) ?? 0 }));
}

export function appointmentSeries(appointments: Appointment[], period: Period, today = todayISO()) {
  const { buckets, keyOf } = timeBuckets(period, appointments.map((a) => a.date), today);
  const map = new Map(buckets.map((b) => [b.key, { programadas: 0, atendidas: 0, no_asistio: 0, canceladas: 0 }]));
  for (const a of appointments) {
    const row = map.get(keyOf(a.date));
    if (!row) continue;
    if (a.status === 'pendiente' || a.status === 'confirmada') row.programadas += 1;
    else if (a.status === 'atendida') row.atendidas += 1;
    else if (a.status === 'no_asistio') row.no_asistio += 1;
    else row.canceladas += 1;
  }
  return buckets.map((b) => {
    const row = map.get(b.key) ?? { programadas: 0, atendidas: 0, no_asistio: 0, canceladas: 0 };
    return { label: b.label, ...row };
  });
}

export function topServices(prospects: Prospect[], limit = 8) {
  const counts = new Map<string, number>();
  prospects.forEach((p) => p.serviceSlug && counts.set(p.serviceSlug, (counts.get(p.serviceSlug) ?? 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([slug, value]) => {
      const svc = KNOWLEDGE_SERVICES.find((s) => s.slug === slug);
      return { key: slug, label: svc?.name ?? slug, value, area: svc?.area ?? ('familia' as AreaId) };
    });
}

export function funnel(prospects: Prospect[]) {
  return STAGES.map((s) => ({ key: s.id, label: s.label, value: prospects.filter((p) => p.stage === s.id).length }));
}

export function conversionStats(state: CrmState, prospects: Prospect[]) {
  const contracted = prospects.filter((p) => p.stage === 'contratado');
  const closed = prospects.filter((p) => p.stage === 'cerrado');
  const open = prospects.filter((p) => OPEN_STAGES.includes(p.stage));
  const days = contracted
    .map((p) => {
      const client = state.clients.find((c) => c.id === p.clientId);
      return client ? diffDays(client.since, p.createdAt.slice(0, 10)) : null;
    })
    .filter((n): n is number => n !== null && n >= 0);
  return {
    total: prospects.length,
    contracted: contracted.length,
    closed: closed.length,
    open: open.length,
    rate: prospects.length ? Math.round((contracted.length / prospects.length) * 100) : 0,
    lostRate: prospects.length ? Math.round((closed.length / prospects.length) * 100) : 0,
    avgDays: days.length ? Math.round(days.reduce((s, n) => s + n, 0) / days.length) : null,
  };
}

export function lawyerActivity(state: CrmState, f: ReportFilters, today = todayISO()) {
  const from = periodStart(f.period, today);
  return state.members
    .filter((m) => m.kind === 'abogado' && (!f.lawyerId || m.id === f.lawyerId))
    .map((m) => {
      const apps = state.appointments.filter((a) => a.lawyerId === m.id && (!from || a.date >= from) && (!f.area || a.area === f.area));
      const cases = state.cases.filter((c) => c.lawyerId === m.id && (!f.area || c.area === f.area));
      const open = state.prospects.filter((p) => p.lawyerId === m.id && OPEN_STAGES.includes(p.stage) && (!f.area || p.area === f.area));
      const tasks = state.tasks.filter((t) => t.assigneeId === m.id);
      const activeCases = cases.filter((c) => ACTIVE_CASE_STATUSES.includes(c.status)).length;
      return {
        id: m.id,
        member: m,
        prospects: open.length,
        scheduled: apps.filter((a) => a.status === 'pendiente' || a.status === 'confirmada').length,
        attended: apps.filter((a) => a.status === 'atendida').length,
        noShow: apps.filter((a) => a.status === 'no_asistio').length,
        activeCases,
        pendingTasks: tasks.filter((t) => t.status !== 'completada').length,
        doneTasks: tasks.filter((t) => t.status === 'completada').length,
        conversations: state.conversations.filter((c) => c.assignedTo === m.id && c.status !== 'finalizado').length,
        load: open.length + activeCases + tasks.filter((t) => t.status !== 'completada').length,
      };
    });
}

export function pendingFollowUps(state: CrmState, today = todayISO()) {
  const tasks = state.tasks.filter((t) => isTaskOverdue(t, today));
  const prospects = state.prospects.filter((p) => OPEN_STAGES.includes(p.stage) && p.nextActionDate !== null && p.nextActionDate < today);
  return { tasks, prospects };
}
