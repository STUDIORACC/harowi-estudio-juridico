import { ACTIVE_CASE_STATUSES, OPEN_STAGES, PRIORITY_BY_ID } from '../constants';
import { MONTHS_SHORT, addMonths, diffDays, monthKey, todayISO } from '../lib/dates';
import { emailKey, normalize, phoneKey } from '../lib/text';
import type {
  Appointment,
  AreaId,
  CaseFile,
  ChannelId,
  Client,
  Conversation,
  CrmState,
  Deadline,
  Member,
  Prospect,
  Task,
} from '../types';

/**
 * Selectores: funciones puras que calculan indicadores y listados a partir del
 * estado. Todos los números del Dashboard y de Reportes salen de aquí, de modo
 * que se actualizan solos al modificar cualquier registro.
 */

export function indexById<T extends { id: string }>(list: T[]) {
  return new Map(list.map((item) => [item.id, item]));
}

export const lawyersOf = (members: Member[]) => members.filter((m) => m.kind === 'abogado');

export function memberLabel(members: Member[], id: string | null | undefined, fallback = 'Sin asignar') {
  const m = members.find((x) => x.id === id);
  return m ? `${m.title} ${m.name.split(' ').slice(0, 2).join(' ')}` : fallback;
}

/* --------------------------------- Citas ---------------------------------- */

export function sortAppointments(list: Appointment[]) {
  return [...list].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

export function appointmentPersonName(state: CrmState, a: Appointment) {
  if (a.prospectId) return state.prospects.find((p) => p.id === a.prospectId)?.name ?? 'Prospecto eliminado';
  if (a.clientId) return state.clients.find((c) => c.id === a.clientId)?.name ?? 'Cliente eliminado';
  return '—';
}

/** Citas vigentes (no canceladas) desde hoy, ordenadas. */
export function upcomingAppointments(state: CrmState, today = todayISO()) {
  return sortAppointments(
    state.appointments.filter((a) => a.date >= today && (a.status === 'pendiente' || a.status === 'confirmada')),
  );
}

/* ---------------------------------- Tareas -------------------------------- */

export function isTaskOverdue(task: Task, today = todayISO()) {
  return task.status !== 'completada' && task.dueDate < today;
}

export function urgentTasks(state: CrmState, today = todayISO()) {
  return state.tasks
    .filter((t) => t.status !== 'completada')
    .map((t) => ({ t, score: (isTaskOverdue(t, today) ? 100 : 0) + PRIORITY_BY_ID[t.priority].rank * 10 - Math.min(diffDays(t.dueDate, today), 9) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.t);
}

/* ------------------------------- Conversaciones ---------------------------- */

export function lastMessage(conv: Conversation) {
  return conv.messages[conv.messages.length - 1];
}

/** Sin atender: nadie ha respondido todavía, o el contacto escribió y espera a una persona. */
export function isUnattended(conv: Conversation) {
  if (conv.status === 'finalizado') return false;
  if (conv.status === 'nuevo') return true;
  return conv.status === 'abogado' && conv.unread > 0 && lastMessage(conv)?.from === 'contact';
}

export function unattendedConversations(state: CrmState) {
  return state.conversations.filter(isUnattended);
}

/* -------------------------------- Prospectos ------------------------------ */

export function followUpProspects(state: CrmState, today = todayISO()) {
  return state.prospects
    .filter((p) => OPEN_STAGES.includes(p.stage))
    .filter((p) => p.stage === 'nuevo' || (p.nextActionDate !== null && p.nextActionDate <= today))
    .sort((a, b) => (a.nextActionDate ?? '0000').localeCompare(b.nextActionDate ?? '0000'));
}

export interface DuplicateMatch {
  prospects: Prospect[];
  clients: Client[];
}

/** Contactos que comparten teléfono, correo o nombre con los datos indicados. */
export function findDuplicates(
  state: CrmState,
  probe: { name?: string; phone?: string; email?: string; excludeProspectId?: string },
): DuplicateMatch {
  const pk = probe.phone ? phoneKey(probe.phone) : '';
  const ek = probe.email ? emailKey(probe.email) : '';
  const nk = probe.name ? normalize(probe.name) : '';
  const matches = (name: string, phone: string, email: string) =>
    (pk.length >= 9 && phoneKey(phone) === pk) ||
    (ek.length > 3 && emailKey(email) === ek) ||
    (nk.split(' ').length >= 3 && normalize(name) === nk);
  return {
    prospects: state.prospects.filter((p) => p.id !== probe.excludeProspectId && matches(p.name, p.phone, p.email)),
    clients: state.clients.filter((c) => matches(c.name, c.phone, c.email)),
  };
}

/** Prospectos que tienen al menos un duplicado, con el identificador del grupo. */
export function duplicateProspectIds(state: CrmState) {
  const byPhone = new Map<string, string[]>();
  for (const p of state.prospects) {
    const k = phoneKey(p.phone);
    if (k.length < 9) continue;
    byPhone.set(k, [...(byPhone.get(k) ?? []), p.id]);
  }
  const ids = new Set<string>();
  for (const group of byPhone.values()) if (group.length > 1) group.forEach((id) => ids.add(id));
  return ids;
}

/* ------------------------------- Expedientes ------------------------------ */

export type DeadlineState = 'vencido' | 'hoy' | 'proximo' | 'normal' | 'cumplido';

export function deadlineState(d: Deadline, today = todayISO()): DeadlineState {
  if (d.done) return 'cumplido';
  const n = diffDays(d.dueDate, today);
  if (n < 0) return 'vencido';
  if (n === 0) return 'hoy';
  if (n <= 3) return 'proximo';
  return 'normal';
}

export function isCaseActive(c: CaseFile) {
  return ACTIVE_CASE_STATUSES.includes(c.status);
}

/** Alertas visuales de un expediente: plazos vencidos o próximos, y tareas vencidas. */
export function caseAlerts(state: CrmState, c: CaseFile, today = todayISO()) {
  const deadlines = c.deadlines.filter((d) => {
    const s = deadlineState(d, today);
    return s === 'vencido' || s === 'hoy' || s === 'proximo';
  });
  const tasks = state.tasks.filter((t) => t.relatedType === 'expediente' && t.relatedId === c.id && isTaskOverdue(t, today));
  const hearings = state.appointments.filter(
    (a) => a.caseId === c.id && a.kind === 'audiencia' && (a.status === 'pendiente' || a.status === 'confirmada') && diffDays(a.date, today) >= 0 && diffDays(a.date, today) <= 7,
  );
  return { deadlines, tasks, hearings, count: deadlines.length + tasks.length + hearings.length };
}

/* -------------------------------- Dashboard ------------------------------- */

export function dashboardStats(state: CrmState, today = todayISO()) {
  const thisMonth = monthKey(today);
  const prevMonth = monthKey(addMonths(today, -1));
  const created = (key: string) => state.prospects.filter((p) => monthKey(p.createdAt) === key).length;

  const contracted = state.prospects.filter((p) => p.stage === 'contratado').length;
  const apptsToday = state.appointments.filter((a) => a.date === today && a.status !== 'cancelada');

  return {
    totalProspects: state.prospects.length,
    newThisMonth: created(thisMonth),
    newPrevMonth: created(prevMonth),
    activeClients: state.clients.filter((c) => c.status === 'activo').length,
    activeCases: state.cases.filter(isCaseActive).length,
    appointmentsToday: apptsToday.length,
    appointmentsTodayPending: apptsToday.filter((a) => a.status === 'pendiente' || a.status === 'confirmada').length,
    pendingAppointments: upcomingAppointments(state, today).length,
    pendingTasks: state.tasks.filter((t) => t.status !== 'completada').length,
    overdueTasks: state.tasks.filter((t) => isTaskOverdue(t, today)).length,
    unattended: unattendedConversations(state).length,
    conversion: state.prospects.length ? Math.round((contracted / state.prospects.length) * 100) : 0,
    contracted,
  };
}

export interface MonthPoint {
  key: string;
  label: string;
  count: number;
}

/** Prospectos creados por mes en los últimos `months` meses (incluye el actual). */
export function prospectsByMonth(prospects: Prospect[], months = 6, today = todayISO()): MonthPoint[] {
  const out: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const first = addMonths(today, -i);
    const key = monthKey(first);
    out.push({ key, label: MONTHS_SHORT[Number(key.slice(5, 7)) - 1], count: prospects.filter((p) => monthKey(p.createdAt) === key).length });
  }
  return out;
}

export function countByArea(prospects: Prospect[]) {
  const counts: Record<AreaId, number> = { familia: 0, penal: 0, civil: 0, empresarial: 0 };
  for (const p of prospects) if (p.area) counts[p.area] += 1;
  return counts;
}

export function countByChannel(prospects: Prospect[]) {
  const counts: Record<ChannelId, number> = { whatsapp: 0, facebook: 0, web: 0 };
  for (const p of prospects) counts[p.channel] += 1;
  return counts;
}

/* ------------------------------ Búsqueda global ---------------------------- */

export interface SearchHit {
  kind: 'prospecto' | 'cliente' | 'expediente' | 'conversacion';
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export function globalSearch(state: CrmState, query: string, perKind = 4): SearchHit[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const match = (...fields: (string | null | undefined)[]) => fields.some((f) => f && normalize(f).includes(q));
  const clientName = (id: string) => state.clients.find((c) => c.id === id)?.name ?? '';
  return [
    ...state.prospects
      .filter((p) => match(p.name, p.phone, p.email))
      .slice(0, perKind)
      .map((p): SearchHit => ({ kind: 'prospecto', id: p.id, title: p.name, subtitle: `Prospecto · ${p.phone}`, href: `/crm/prospectos?id=${p.id}` })),
    ...state.clients
      .filter((c) => match(c.name, c.phone, c.email, c.docNumber))
      .slice(0, perKind)
      .map((c): SearchHit => ({ kind: 'cliente', id: c.id, title: c.name, subtitle: `Cliente · ${c.docType} ${c.docNumber}`, href: `/crm/clientes?id=${c.id}` })),
    ...state.cases
      .filter((c) => match(c.code, c.counterparty, c.courtFileNumber, c.procedure, clientName(c.clientId)))
      .slice(0, perKind)
      .map((c): SearchHit => ({ kind: 'expediente', id: c.id, title: `${c.code} · ${clientName(c.clientId)}`, subtitle: c.procedure, href: `/crm/expedientes?id=${c.id}` })),
    ...state.conversations
      .filter((c) => match(c.contactName, c.contactHandle))
      .slice(0, perKind)
      .map((c): SearchHit => ({ kind: 'conversacion', id: c.id, title: c.contactName, subtitle: `Conversación · ${c.contactHandle}`, href: `/crm/conversaciones?id=${c.id}` })),
  ];
}
