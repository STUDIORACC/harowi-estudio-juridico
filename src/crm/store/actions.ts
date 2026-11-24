import { buildSummary } from '../assistant/summary';
import { APPOINTMENT_KIND_BY_ID, CASE_STATUS_BY_ID, CHANNELS, STAGES, STAGE_BY_ID } from '../constants';
import { integrations } from '../integrations';
import { nowLocal, todayISO } from '../lib/dates';
import { memberFull, memberShort } from '../lib/people';
import { findConflict, pickLawyer } from '../lib/scheduling';
import { isValidEmail, isValidPhone, uid } from '../lib/text';
import { KNOWLEDGE_SERVICES, getService, servicesOfArea } from '../knowledge/services';
import type {
  ActivityEntry,
  Appointment,
  AppointmentKind,
  AppointmentStatus,
  AreaId,
  AssistantConfig,
  Attachment,
  CaseFile,
  CaseStatus,
  ChannelId,
  Client,
  Conversation,
  ConversationPriority,
  ConversationStatus,
  CrmState,
  DocumentRecord,
  HistoryKind,
  KbEntry,
  Message,
  Modality,
  Notification,
  Priority,
  Prospect,
  RelatedType,
  StageId,
  Task,
  TaskStatus,
  TimelineKind,
} from '../types';
import { emptySession } from '../assistant/session';
import { mutate, resetState } from './store';

/**
 * ---------------------------------------------------------------------------
 * ACCIONES DEL CRM
 * ---------------------------------------------------------------------------
 * Todas las escrituras del sistema pasan por aquí. Validan, actualizan los
 * registros relacionados (prospecto ↔ cita ↔ conversación ↔ cliente ↔
 * expediente), dejan rastro en la actividad y generan notificaciones.
 * ---------------------------------------------------------------------------
 */

export type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

/* ------------------------------- Utilidades -------------------------------- */

export function actorOf(d: CrmState) {
  const m = d.members.find((x) => x.id === d.currentUserId);
  return m ? memberFull(m) : 'Equipo HAROWI';
}

export function logActivity(
  d: CrmState,
  text: string,
  href: string | null = null,
  actor?: { name: string; kind: ActivityEntry['actorKind'] },
) {
  d.activity.unshift({
    id: uid('ac'),
    at: nowLocal(),
    actor: actor?.name ?? actorOf(d),
    actorKind: actor?.kind ?? 'equipo',
    text,
    href,
  });
  d.activity.length = Math.min(d.activity.length, 200);
}

export function notify(d: CrmState, n: Pick<Notification, 'kind' | 'title' | 'body' | 'href' | 'forMemberId'>) {
  d.notifications.unshift({ id: uid('n'), at: nowLocal(), read: false, ...n });
  d.notifications.length = Math.min(d.notifications.length, 100);
}

export function pushHistory(p: Prospect, kind: HistoryKind, text: string, by: string) {
  p.history.push({ id: uid('h'), at: nowLocal(), kind, text, by });
}

export function pushMessage(
  conv: Conversation,
  from: Message['from'],
  text: string,
  extra: Partial<Pick<Message, 'authorId' | 'attachments' | 'card'>> = {},
) {
  const msg: Message = { id: uid('ms'), from, authorId: extra.authorId ?? null, text, at: nowLocal(), ...(extra.attachments ? { attachments: extra.attachments } : {}), ...(extra.card ? { card: extra.card } : {}) };
  conv.messages.push(msg);
  conv.lastMessageAt = msg.at;
  return msg;
}

const stageIndex = (id: StageId) => STAGES.findIndex((s) => s.id === id);

/** Avanza la etapa comercial sin retroceder ni tocar las etapas finales. */
export function advanceStage(p: Prospect, to: StageId, text: string, by: string) {
  if (p.stage === 'contratado' || p.stage === 'cerrado') return;
  if (stageIndex(to) > stageIndex(p.stage)) {
    p.stage = to;
    pushHistory(p, 'estado', text, by);
  }
}

const channelName = (c: ChannelId) => CHANNELS[c].name;

/* =============================== PROSPECTOS ================================ */

export interface ProspectInput {
  name: string;
  phone: string;
  email: string;
  channel: ChannelId;
  area: AreaId | null;
  serviceSlug: string | null;
  description: string;
  priority: Priority;
  stage: StageId;
  lawyerId: string | null;
  contactDate: string;
  nextAction: string;
  nextActionDate: string | null;
}

export function validateProspect(input: ProspectInput) {
  const errors: Partial<Record<keyof ProspectInput, string>> = {};
  if (input.name.trim().split(/\s+/).filter(Boolean).length < 2) errors.name = 'Ingrese nombre y apellido.';
  if (!input.phone.trim() && !input.email.trim()) errors.phone = 'Ingrese al menos un teléfono o un correo.';
  if (input.phone.trim() && !isValidPhone(input.phone)) errors.phone = 'El teléfono debe tener al menos 9 dígitos.';
  if (input.email.trim() && !isValidEmail(input.email)) errors.email = 'El correo no es válido.';
  if (!input.contactDate) errors.contactDate = 'Indique la fecha de contacto.';
  if (input.serviceSlug && input.area && getService(input.serviceSlug)?.area !== input.area) {
    errors.serviceSlug = 'El servicio no corresponde al área jurídica elegida.';
  }
  return errors;
}

export function createProspect(input: ProspectInput): Result<{ id: string }> {
  if (Object.keys(validateProspect(input)).length) return fail('Revise los campos marcados.');
  return mutate((d) => {
    const id = uid('p');
    const by = actorOf(d);
    const p: Prospect = {
      ...input,
      name: input.name.trim(),
      id,
      clientId: null,
      closedReason: null,
      createdAt: nowLocal(),
      history: [],
    };
    pushHistory(p, 'creacion', `Prospecto creado manualmente desde ${channelName(input.channel)}.`, by);
    d.prospects.unshift(p);
    logActivity(d, `creó el prospecto ${p.name}.`, `/crm/prospectos?id=${id}`);
    return { ok: true as const, id };
  });
}

export function updateProspect(id: string, patch: Partial<ProspectInput>): Result {
  return mutate((d) => {
    const p = d.prospects.find((x) => x.id === id);
    if (!p) return fail('El prospecto ya no existe.');
    const by = actorOf(d);
    const merged = { ...p, ...patch } as ProspectInput;
    const errors = validateProspect(merged);
    if (Object.keys(errors).length) return fail('Revise los campos marcados.');
    if (patch.lawyerId !== undefined && patch.lawyerId !== p.lawyerId) {
      const name = d.members.find((m) => m.id === patch.lawyerId);
      pushHistory(p, 'nota', name ? `Asignado a ${memberFull(name)}.` : 'Se quitó la asignación.', by);
    }
    if (patch.stage !== undefined && patch.stage !== p.stage) {
      pushHistory(p, 'estado', `Etapa cambiada a «${STAGE_BY_ID[patch.stage].label}».`, by);
    }
    if (patch.area !== undefined && patch.area !== p.area && patch.area) {
      pushHistory(p, 'clasificacion', `Área actualizada a ${patch.area}.`, by);
    }
    Object.assign(p, patch, { name: (patch.name ?? p.name).trim() });
    logActivity(d, `actualizó el prospecto ${p.name}.`, `/crm/prospectos?id=${id}`);
    return { ok: true as const };
  });
}

/** Mueve un prospecto en el pipeline. Las etapas finales exigen datos adicionales. */
export type MoveResult = { ok: true } | { ok: false; error: string; needs?: 'conversion' | 'reason' };

export function moveProspect(id: string, stage: StageId, closedReason?: string): MoveResult {
  return mutate((d) => {
    const p = d.prospects.find((x) => x.id === id);
    if (!p) return fail('El prospecto ya no existe.');
    if (p.stage === stage) return { ok: true as const };
    if (stage === 'contratado' && !p.clientId) return { ok: false as const, error: 'Para marcarlo como cliente contratado hay que registrar sus datos.', needs: 'conversion' as const };
    if (stage === 'cerrado' && !closedReason?.trim() && !p.closedReason) return { ok: false as const, error: 'Indique el motivo del cierre.', needs: 'reason' as const };
    const by = actorOf(d);
    p.stage = stage;
    if (stage === 'cerrado') {
      p.closedReason = closedReason?.trim() || p.closedReason;
      p.nextAction = 'Sin acciones pendientes';
      p.nextActionDate = null;
      pushHistory(p, 'estado', `Cerrado: ${p.closedReason}`, by);
    } else {
      if (p.closedReason) p.closedReason = null;
      pushHistory(p, 'estado', `Etapa cambiada a «${STAGE_BY_ID[stage].label}».`, by);
    }
    logActivity(d, `movió a ${p.name} a «${STAGE_BY_ID[stage].label}».`, `/crm/prospectos?id=${id}`);
    return { ok: true as const };
  });
}

export interface ConversionInput {
  docType: Client['docType'];
  docNumber: string;
  district: string;
  openCase: boolean;
  procedure: string;
}

export function convertProspectToClient(id: string, input: ConversionInput): Result<{ clientId: string; caseId: string | null }> {
  if (!input.docNumber.trim()) return fail('Ingrese el número de documento del cliente.');
  return mutate((d) => {
    const p = d.prospects.find((x) => x.id === id);
    if (!p) return fail('El prospecto ya no existe.');
    if (p.clientId) return fail('Este prospecto ya es cliente.');
    const by = actorOf(d);
    const lawyerId = p.lawyerId ?? pickLawyer(d.members, p.area ?? 'familia', d.appointments)?.id ?? d.members[0].id;
    const clientId = uid('c');
    d.clients.unshift({
      id: clientId,
      name: p.name,
      kind: input.docType === 'RUC' ? 'empresa' : 'persona',
      docType: input.docType,
      docNumber: input.docNumber.trim(),
      phone: p.phone,
      email: p.email,
      district: input.district.trim(),
      lawyerId,
      status: 'activo',
      since: todayISO(),
      prospectId: p.id,
      notes: '',
    });
    p.clientId = clientId;
    p.stage = 'contratado';
    p.closedReason = null;
    p.nextAction = 'Cliente contratado';
    p.nextActionDate = null;
    pushHistory(p, 'estado', 'Aceptó la propuesta: convertido en cliente.', by);
    let caseId: string | null = null;
    if (input.openCase && p.area) {
      const slug = p.serviceSlug ?? servicesOfArea(p.area)[0]?.slug;
      if (slug) caseId = insertCase(d, { clientId, area: p.area, serviceSlug: slug, procedure: input.procedure.trim() || getService(slug)?.name || 'Procedimiento', lawyerId, counterparty: '', courtFileNumber: null, court: null, description: p.description });
    }
    logActivity(d, `convirtió a ${p.name} en cliente${caseId ? ' y abrió su expediente' : ''}.`, `/crm/clientes?id=${clientId}`);
    notify(d, { kind: 'prospecto', title: 'Nuevo cliente', body: `${p.name} pasó de prospecto a cliente.`, href: `/crm/clientes?id=${clientId}`, forMemberId: lawyerId });
    return { ok: true as const, clientId, caseId };
  });
}

export function addProspectNote(id: string, text: string): Result {
  if (!text.trim()) return fail('Escriba la nota.');
  return mutate((d) => {
    const p = d.prospects.find((x) => x.id === id);
    if (!p) return fail('El prospecto ya no existe.');
    pushHistory(p, 'nota', text.trim(), actorOf(d));
    return { ok: true as const };
  });
}

export function deleteProspect(id: string): Result {
  return mutate((d) => {
    const p = d.prospects.find((x) => x.id === id);
    if (!p) return fail('El prospecto ya no existe.');
    d.prospects = d.prospects.filter((x) => x.id !== id);
    d.appointments = d.appointments.filter((a) => a.prospectId !== id);
    d.tasks = d.tasks.filter((t) => !(t.relatedType === 'prospecto' && t.relatedId === id));
    for (const c of d.conversations) {
      if (c.prospectId === id) {
        c.prospectId = null;
        c.ai.prospectId = null;
      }
    }
    for (const c of d.clients) if (c.prospectId === id) c.prospectId = null;
    logActivity(d, `eliminó el prospecto ${p.name}.`);
    return { ok: true as const };
  });
}

/* ================================ CLIENTES ================================= */

export type ClientInput = Omit<Client, 'id' | 'since' | 'prospectId'>;

export function validateClient(input: ClientInput) {
  const errors: Partial<Record<keyof ClientInput, string>> = {};
  if (!input.name.trim()) errors.name = 'Ingrese el nombre o razón social.';
  if (!input.docNumber.trim()) errors.docNumber = 'Ingrese el número de documento.';
  else if (input.docType === 'DNI' && !/^\d{8}$/.test(input.docNumber.trim())) errors.docNumber = 'El DNI debe tener 8 dígitos.';
  else if (input.docType === 'RUC' && !/^\d{11}$/.test(input.docNumber.trim())) errors.docNumber = 'El RUC debe tener 11 dígitos.';
  if (input.phone.trim() && !isValidPhone(input.phone)) errors.phone = 'El teléfono debe tener al menos 9 dígitos.';
  if (input.email.trim() && !isValidEmail(input.email)) errors.email = 'El correo no es válido.';
  if (!input.lawyerId) errors.lawyerId = 'Asigne un abogado responsable.';
  return errors;
}

export function createClient(input: ClientInput): Result<{ id: string }> {
  if (Object.keys(validateClient(input)).length) return fail('Revise los campos marcados.');
  return mutate((d) => {
    const id = uid('c');
    d.clients.unshift({ ...input, name: input.name.trim(), id, since: todayISO(), prospectId: null });
    logActivity(d, `registró al cliente ${input.name.trim()}.`, `/crm/clientes?id=${id}`);
    return { ok: true as const, id };
  });
}

export function updateClient(id: string, patch: Partial<ClientInput>): Result {
  return mutate((d) => {
    const c = d.clients.find((x) => x.id === id);
    if (!c) return fail('El cliente ya no existe.');
    const merged = { ...c, ...patch } as ClientInput;
    if (Object.keys(validateClient(merged)).length) return fail('Revise los campos marcados.');
    Object.assign(c, patch);
    logActivity(d, `actualizó los datos de ${c.name}.`, `/crm/clientes?id=${id}`);
    return { ok: true as const };
  });
}

export function deleteClient(id: string): Result {
  return mutate((d) => {
    const c = d.clients.find((x) => x.id === id);
    if (!c) return fail('El cliente ya no existe.');
    if (d.cases.some((x) => x.clientId === id)) return fail('No se puede eliminar: el cliente tiene expedientes. Archive o elimine primero sus expedientes.');
    d.clients = d.clients.filter((x) => x.id !== id);
    d.documents = d.documents.filter((x) => x.clientId !== id);
    d.appointments = d.appointments.filter((a) => a.clientId !== id);
    d.tasks = d.tasks.filter((t) => !(t.relatedType === 'cliente' && t.relatedId === id));
    for (const p of d.prospects) if (p.clientId === id) p.clientId = null;
    for (const cv of d.conversations) if (cv.clientId === id) cv.clientId = null;
    logActivity(d, `eliminó al cliente ${c.name}.`);
    return { ok: true as const };
  });
}

/* =============================== EXPEDIENTES =============================== */

export interface CaseInput {
  clientId: string;
  area: AreaId;
  serviceSlug: string;
  procedure: string;
  lawyerId: string;
  counterparty: string;
  courtFileNumber: string | null;
  court: string | null;
  description: string;
}

function nextCaseCode(d: CrmState) {
  const year = todayISO().slice(0, 4);
  const max = d.cases
    .filter((c) => c.code.startsWith(`HAR-${year}-`))
    .reduce((m, c) => Math.max(m, Number(c.code.split('-')[2]) || 0), 0);
  return `HAR-${year}-${String(max + 1).padStart(3, '0')}`;
}

function insertCase(d: CrmState, input: CaseInput) {
  const id = uid('e');
  const by = actorOf(d);
  const c: CaseFile = {
    ...input,
    id,
    code: nextCaseCode(d),
    status: 'nuevo',
    openedAt: todayISO(),
    timeline: [{ id: uid('ev'), date: todayISO(), kind: 'apertura', title: 'Apertura del expediente', detail: 'Expediente abierto en el CRM.', by }],
    deadlines: [],
    notes: [],
  };
  d.cases.unshift(c);
  return id;
}

export function validateCase(input: CaseInput) {
  const errors: Partial<Record<keyof CaseInput, string>> = {};
  if (!input.clientId) errors.clientId = 'Seleccione el cliente.';
  if (!input.serviceSlug) errors.serviceSlug = 'Seleccione el servicio.';
  if (!input.procedure.trim()) errors.procedure = 'Indique el tipo de procedimiento.';
  if (!input.lawyerId) errors.lawyerId = 'Asigne un abogado responsable.';
  return errors;
}

export function createCase(input: CaseInput): Result<{ id: string }> {
  if (Object.keys(validateCase(input)).length) return fail('Revise los campos marcados.');
  return mutate((d) => {
    const id = insertCase(d, input);
    const code = d.cases.find((c) => c.id === id)?.code;
    logActivity(d, `abrió el expediente ${code}.`, `/crm/expedientes?id=${id}`);
    notify(d, { kind: 'sistema', title: 'Nuevo expediente', body: `Se abrió ${code}.`, href: `/crm/expedientes?id=${id}`, forMemberId: input.lawyerId });
    return { ok: true as const, id };
  });
}

export function updateCase(id: string, patch: Partial<CaseInput>): Result {
  return mutate((d) => {
    const c = d.cases.find((x) => x.id === id);
    if (!c) return fail('El expediente ya no existe.');
    const merged = { ...c, ...patch } as CaseInput;
    if (Object.keys(validateCase(merged)).length) return fail('Revise los campos marcados.');
    Object.assign(c, patch);
    logActivity(d, `actualizó el expediente ${c.code}.`, `/crm/expedientes?id=${id}`);
    return { ok: true as const };
  });
}

export function addTimelineEvent(caseId: string, ev: { date: string; kind: TimelineKind; title: string; detail: string }): Result {
  if (!ev.title.trim()) return fail('Indique el título de la actuación.');
  if (!ev.date) return fail('Indique la fecha.');
  return mutate((d) => {
    const c = d.cases.find((x) => x.id === caseId);
    if (!c) return fail('El expediente ya no existe.');
    c.timeline.push({ id: uid('ev'), ...ev, title: ev.title.trim(), detail: ev.detail.trim(), by: actorOf(d) });
    logActivity(d, `registró una actuación en ${c.code}: ${ev.title.trim()}.`, `/crm/expedientes?id=${caseId}`);
    return { ok: true as const };
  });
}

export function setCaseStatus(caseId: string, status: CaseStatus): Result {
  return mutate((d) => {
    const c = d.cases.find((x) => x.id === caseId);
    if (!c) return fail('El expediente ya no existe.');
    if (c.status === status) return { ok: true as const };
    c.status = status;
    c.timeline.push({ id: uid('ev'), date: todayISO(), kind: 'nota', title: `Estado: ${CASE_STATUS_BY_ID[status].label}`, detail: 'Estado del expediente actualizado.', by: actorOf(d) });
    logActivity(d, `cambió ${c.code} a «${CASE_STATUS_BY_ID[status].label}».`, `/crm/expedientes?id=${caseId}`);
    return { ok: true as const };
  });
}

export function addCaseNote(caseId: string, text: string): Result {
  if (!text.trim()) return fail('Escriba la nota.');
  return mutate((d) => {
    const c = d.cases.find((x) => x.id === caseId);
    if (!c) return fail('El expediente ya no existe.');
    c.notes.unshift({ id: uid('nt'), at: nowLocal(), by: actorOf(d), text: text.trim() });
    return { ok: true as const };
  });
}

/** Los plazos los ingresa o verifica el abogado: el sistema nunca los calcula. */
export function addDeadline(caseId: string, input: { title: string; dueDate: string; note: string; verified: boolean }): Result {
  if (!input.title.trim()) return fail('Indique de qué plazo se trata.');
  if (!input.dueDate) return fail('Indique la fecha de vencimiento ingresada por el abogado.');
  return mutate((d) => {
    const c = d.cases.find((x) => x.id === caseId);
    if (!c) return fail('El expediente ya no existe.');
    c.deadlines.push({ id: uid('dl'), title: input.title.trim(), dueDate: input.dueDate, setBy: actorOf(d), verified: input.verified, note: input.note.trim(), done: false });
    logActivity(d, `registró un plazo en ${c.code}: ${input.title.trim()}.`, `/crm/expedientes?id=${caseId}`);
    return { ok: true as const };
  });
}

export function updateDeadline(caseId: string, deadlineId: string, patch: { done?: boolean; verified?: boolean }): Result {
  return mutate((d) => {
    const dl = d.cases.find((x) => x.id === caseId)?.deadlines.find((x) => x.id === deadlineId);
    if (!dl) return fail('El plazo ya no existe.');
    if (patch.verified !== undefined) {
      dl.verified = patch.verified;
      dl.setBy = actorOf(d);
    }
    if (patch.done !== undefined) dl.done = patch.done;
    return { ok: true as const };
  });
}

export function removeDeadline(caseId: string, deadlineId: string): Result {
  return mutate((d) => {
    const c = d.cases.find((x) => x.id === caseId);
    if (!c) return fail('El expediente ya no existe.');
    c.deadlines = c.deadlines.filter((x) => x.id !== deadlineId);
    return { ok: true as const };
  });
}

export function deleteCase(id: string): Result {
  return mutate((d) => {
    const c = d.cases.find((x) => x.id === id);
    if (!c) return fail('El expediente ya no existe.');
    d.cases = d.cases.filter((x) => x.id !== id);
    d.documents = d.documents.map((doc) => (doc.caseId === id ? { ...doc, caseId: null } : doc));
    d.appointments = d.appointments.map((a) => (a.caseId === id ? { ...a, caseId: null } : a));
    d.tasks = d.tasks.filter((t) => !(t.relatedType === 'expediente' && t.relatedId === id));
    logActivity(d, `eliminó el expediente ${c.code}.`);
    return { ok: true as const };
  });
}

/* ================================== CITAS ================================== */

export interface AppointmentInput {
  kind: AppointmentKind;
  prospectId: string | null;
  clientId: string | null;
  caseId: string | null;
  lawyerId: string;
  area: AreaId;
  serviceSlug: string | null;
  date: string;
  time: string;
  durationMin: number;
  modality: Modality;
  status: AppointmentStatus;
  notes: string;
  reminderWhatsapp: boolean;
  reminderEmail: boolean;
  source?: Appointment['source'];
}

export function validateAppointment(d: CrmState, input: AppointmentInput, ignoreId?: string) {
  const errors: Partial<Record<keyof AppointmentInput | 'person', string>> = {};
  if (!input.prospectId && !input.clientId) errors.person = 'Seleccione el prospecto o el cliente.';
  if (!input.lawyerId) errors.lawyerId = 'Seleccione el abogado.';
  if (!input.date) errors.date = 'Seleccione la fecha.';
  if (!input.time) errors.time = 'Seleccione la hora.';
  if (input.date && input.time && input.lawyerId && input.status !== 'cancelada') {
    const clash = findConflict(d.appointments, input.lawyerId, input.date, input.time, input.durationMin, ignoreId);
    if (clash) {
      const lawyer = d.members.find((m) => m.id === input.lawyerId);
      errors.time = `${lawyer ? memberShort(lawyer) : 'El abogado'} ya tiene una cita ese día de ${clash.time} a ${endTime(clash)}. Elija otro horario.`;
    }
  }
  return errors;
}

const endTime = (a: Pick<Appointment, 'time' | 'durationMin'>) => {
  const [h, m] = a.time.split(':').map(Number);
  const total = h * 60 + m + a.durationMin;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

/** Inserta una cita y actualiza al prospecto vinculado. Usada también por el asistente. */
export function insertAppointment(d: CrmState, input: AppointmentInput, by: string): string {
  const id = uid('a');
  d.appointments.push({ ...input, id, source: input.source ?? 'manual', createdAt: nowLocal() });
  if (input.prospectId) {
    const p = d.prospects.find((x) => x.id === input.prospectId);
    if (p && input.kind === 'consulta_inicial' && input.status !== 'cancelada') {
      advanceStage(p, 'cita_programada', 'Se programó una consulta inicial.', by);
      pushHistory(p, 'cita', `Cita ${APPOINTMENT_KIND_BY_ID[input.kind].label.toLowerCase()} programada para el ${input.date} a las ${input.time} (${input.modality}).`, by);
      if (p.stage === 'cita_programada') {
        p.nextAction = 'Atender la consulta inicial';
        p.nextActionDate = input.date;
      }
    }
  }
  return id;
}

export function createAppointment(input: AppointmentInput): Result<{ id: string }> {
  return mutate((d) => {
    const errors = validateAppointment(d, input);
    if (Object.keys(errors).length) return fail(errors.time ?? errors.person ?? 'Revise los campos marcados.');
    const by = actorOf(d);
    const id = insertAppointment(d, input, by);
    const lawyer = d.members.find((m) => m.id === input.lawyerId);
    logActivity(d, `agendó una cita (${APPOINTMENT_KIND_BY_ID[input.kind].label.toLowerCase()}) con ${lawyer ? memberShort(lawyer) : 'un abogado'} el ${input.date} a las ${input.time}.`, '/crm/agenda');
    if (input.lawyerId !== d.currentUserId) {
      notify(d, { kind: 'cita', title: 'Nueva cita en su agenda', body: `${APPOINTMENT_KIND_BY_ID[input.kind].label} · ${input.date} ${input.time}.`, href: '/crm/agenda', forMemberId: input.lawyerId });
    }
    return { ok: true as const, id };
  });
}

export function updateAppointment(id: string, patch: Partial<AppointmentInput>): Result {
  return mutate((d) => {
    const a = d.appointments.find((x) => x.id === id);
    if (!a) return fail('La cita ya no existe.');
    const merged = { ...a, ...patch } as AppointmentInput;
    const errors = validateAppointment(d, merged, id);
    if (Object.keys(errors).length) return fail(errors.time ?? errors.person ?? 'Revise los campos marcados.');
    Object.assign(a, patch);
    logActivity(d, `modificó una cita del ${a.date} a las ${a.time}.`, '/crm/agenda');
    return { ok: true as const };
  });
}

export function rescheduleAppointment(id: string, to: { date: string; time: string; lawyerId?: string }): Result {
  return mutate((d) => {
    const a = d.appointments.find((x) => x.id === id);
    if (!a) return fail('La cita ya no existe.');
    const lawyerId = to.lawyerId ?? a.lawyerId;
    const clash = findConflict(d.appointments, lawyerId, to.date, to.time, a.durationMin, id);
    if (clash) return fail('Ese horario ya está ocupado. Elija otro.');
    const from = `${a.date} ${a.time}`;
    a.date = to.date;
    a.time = to.time;
    a.lawyerId = lawyerId;
    if (a.status === 'cancelada' || a.status === 'no_asistio') a.status = 'pendiente';
    if (a.prospectId) {
      const p = d.prospects.find((x) => x.id === a.prospectId);
      if (p) {
        pushHistory(p, 'cita', `Cita reprogramada de ${from} a ${to.date} ${to.time}.`, actorOf(d));
        if (p.stage === 'cita_programada') p.nextActionDate = to.date;
      }
    }
    logActivity(d, `reprogramó una cita de ${from} a ${to.date} ${to.time}.`, '/crm/agenda');
    notify(d, { kind: 'cita', title: 'Cita reprogramada', body: `Nueva fecha: ${to.date} ${to.time}.`, href: '/crm/agenda', forMemberId: lawyerId });
    return { ok: true as const };
  });
}

export function setAppointmentStatus(id: string, status: AppointmentStatus): Result {
  return mutate((d) => {
    const a = d.appointments.find((x) => x.id === id);
    if (!a) return fail('La cita ya no existe.');
    if (a.status === status) return { ok: true as const };
    if (status !== 'cancelada' && a.status === 'cancelada') {
      const clash = findConflict(d.appointments.filter((x) => x.id !== id), a.lawyerId, a.date, a.time, a.durationMin);
      if (clash) return fail('El horario de esta cita fue ocupado mientras estuvo cancelada. Reprográmela.');
    }
    const by = actorOf(d);
    a.status = status;
    const person = a.prospectId ? d.prospects.find((p) => p.id === a.prospectId) : null;
    if (person) {
      if (status === 'atendida' && a.kind === 'consulta_inicial') {
        advanceStage(person, 'evaluacion', 'Consulta inicial atendida: pasa a evaluación jurídica.', by);
        pushHistory(person, 'cita', 'Consulta atendida.', by);
        if (person.stage === 'evaluacion') {
          person.nextAction = 'Evaluar el caso y enviar propuesta';
          person.nextActionDate = null;
        }
      }
      if (status === 'no_asistio') {
        pushHistory(person, 'cita', 'No asistió a la consulta programada.', by);
        person.nextAction = 'Reagendar la consulta (no asistió)';
        person.nextActionDate = todayISO();
        d.tasks.unshift({
          id: uid('t'),
          title: `Reagendar la consulta de ${person.name}`,
          description: 'No asistió a la cita. Contactar y ofrecer nuevos horarios.',
          relatedType: 'prospecto',
          relatedId: person.id,
          assigneeId: d.members.find((m) => m.kind === 'coordinacion')?.id ?? a.lawyerId,
          priority: 'alta',
          dueDate: todayISO(),
          status: 'pendiente',
          reminder: true,
          createdAt: nowLocal(),
          history: [{ at: nowLocal(), by: 'Sistema', text: 'Tarea creada automáticamente por inasistencia.' }],
        });
      }
      if (status === 'cancelada') pushHistory(person, 'cita', 'La cita fue cancelada.', by);
    }
    logActivity(d, `marcó una cita del ${a.date} como «${status.replace('_', ' ')}».`, '/crm/agenda');
    return { ok: true as const };
  });
}

export function deleteAppointment(id: string): Result {
  return mutate((d) => {
    if (!d.appointments.some((a) => a.id === id)) return fail('La cita ya no existe.');
    d.appointments = d.appointments.filter((a) => a.id !== id);
    logActivity(d, 'eliminó una cita de la agenda.', '/crm/agenda');
    return { ok: true as const };
  });
}

/* ============================== CONVERSACIONES ============================== */

export function createConversation(input: {
  channel: ChannelId;
  contactName: string;
  handle: string;
  origin: Conversation['origin'];
}): Result<{ id: string }> {
  return mutate((d) => {
    const id = uid('v');
    const now = nowLocal();
    d.conversations.unshift({
      id,
      channel: input.channel,
      contactName: input.contactName,
      contactHandle: input.handle,
      prospectId: null,
      clientId: null,
      status: 'nuevo',
      priority: 'normal',
      pending: false,
      mode: 'auto',
      assignedTo: null,
      unread: 0,
      messages: [],
      ai: emptySession(),
      summary: null,
      handoffReason: null,
      lastMessageAt: now,
      createdAt: now,
      origin: input.origin,
    });
    return { ok: true as const, id };
  });
}

export function markConversationRead(id: string) {
  mutate((d) => {
    const c = d.conversations.find((x) => x.id === id);
    if (c && c.unread) c.unread = 0;
  });
}

export function setConversationStatus(id: string, status: ConversationStatus): Result {
  return mutate((d) => {
    const c = d.conversations.find((x) => x.id === id);
    if (!c) return fail('La conversación ya no existe.');
    c.status = status;
    if (status === 'finalizado') c.pending = false;
    pushMessage(c, 'system', `${actorOf(d)} marcó la conversación como «${status === 'ia' ? 'IA atendiendo' : status === 'abogado' ? 'Requiere abogado' : status === 'nuevo' ? 'Nuevo' : 'Finalizado'}».`);
    return { ok: true as const };
  });
}

export function setConversationPriority(id: string, priority: ConversationPriority): Result {
  return mutate((d) => {
    const c = d.conversations.find((x) => x.id === id);
    if (!c) return fail('La conversación ya no existe.');
    c.priority = priority;
    if (c.prospectId) {
      const p = d.prospects.find((x) => x.id === c.prospectId);
      if (p) {
        const mapped: Priority = priority === 'urgente' ? 'urgente' : priority === 'alta' ? 'alta' : p.priority === 'urgente' || p.priority === 'alta' ? 'media' : p.priority;
        p.priority = mapped;
      }
    }
    return { ok: true as const };
  });
}

export function toggleConversationPending(id: string) {
  mutate((d) => {
    const c = d.conversations.find((x) => x.id === id);
    if (c) c.pending = !c.pending;
  });
}

export function assignConversation(id: string, lawyerId: string | null): Result {
  return mutate((d) => {
    const c = d.conversations.find((x) => x.id === id);
    if (!c) return fail('La conversación ya no existe.');
    c.assignedTo = lawyerId;
    const lawyer = d.members.find((m) => m.id === lawyerId);
    if (c.prospectId) {
      const p = d.prospects.find((x) => x.id === c.prospectId);
      if (p) {
        p.lawyerId = lawyerId;
        pushHistory(p, 'derivacion', lawyer ? `Conversación asignada a ${memberFull(lawyer)}.` : 'Se quitó la asignación.', actorOf(d));
      }
    }
    pushMessage(c, 'system', lawyer ? `Conversación asignada a ${memberFull(lawyer)}.` : 'Se quitó el responsable de la conversación.');
    if (lawyer && lawyer.id !== d.currentUserId) {
      notify(d, { kind: 'derivacion', title: 'Conversación asignada', body: `${c.contactName} fue asignada a ${memberShort(lawyer)}.`, href: `/crm/conversaciones?id=${id}`, forMemberId: lawyer.id });
    }
    logActivity(d, `asignó la conversación de ${c.contactName} a ${lawyer ? memberShort(lawyer) : 'nadie'}.`, `/crm/conversaciones?id=${id}`);
    return { ok: true as const };
  });
}

export function addInternalNote(id: string, text: string): Result {
  if (!text.trim()) return fail('Escriba la nota.');
  return mutate((d) => {
    const c = d.conversations.find((x) => x.id === id);
    if (!c) return fail('La conversación ya no existe.');
    pushMessage(c, 'note', text.trim(), { authorId: d.currentUserId });
    return { ok: true as const };
  });
}

/** El abogado toma el control: la atención automática se detiene. */
export function takeControl(id: string): Result {
  return mutate((d) => {
    const c = d.conversations.find((x) => x.id === id);
    if (!c) return fail('La conversación ya no existe.');
    if (c.mode === 'manual') return { ok: true as const };
    const me = d.members.find((m) => m.id === d.currentUserId);
    c.mode = 'manual';
    c.status = 'abogado';
    c.ai.stage = 'derivado';
    c.ai.asked = null;
    if (!c.assignedTo && me?.kind === 'abogado') c.assignedTo = me.id;
    pushMessage(c, 'system', `${actorOf(d)} tomó el control de la conversación. La atención automática está detenida.`);
    logActivity(d, `tomó el control de la conversación con ${c.contactName}.`, `/crm/conversaciones?id=${id}`);
    return { ok: true as const };
  });
}

/** Devuelve la conversación al asistente virtual. */
export function returnToAssistant(id: string): Result {
  return mutate((d) => {
    const c = d.conversations.find((x) => x.id === id);
    if (!c) return fail('La conversación ya no existe.');
    c.mode = 'auto';
    c.status = c.status === 'finalizado' ? 'finalizado' : 'ia';
    c.ai.stage = c.ai.appointmentId ? 'reservado' : c.ai.area ? 'informando' : 'inicio';
    c.ai.asked = null;
    c.ai.unclear = 0;
    pushMessage(c, 'system', `${actorOf(d)} reactivó la atención automática del asistente.`);
    logActivity(d, `devolvió al asistente la conversación con ${c.contactName}.`, `/crm/conversaciones?id=${id}`);
    return { ok: true as const };
  });
}

/** Transferencia manual a una persona (botón «Transferir a un abogado»). */
export function transferToHuman(id: string, lawyerId?: string, reason = 'Transferencia solicitada por el equipo.'): Result {
  return mutate((d) => {
    const c = d.conversations.find((x) => x.id === id);
    if (!c) return fail('La conversación ya no existe.');
    performHandoff(d, c, { lawyerId: lawyerId ?? c.assignedTo ?? pickLawyer(d.members, c.ai.area ?? 'familia', d.appointments)?.id ?? null, urgent: c.priority === 'urgente', reason, by: actorOf(d), actorKind: 'equipo' });
    return { ok: true as const };
  });
}

/** Lógica común de derivación a una persona (usada por el asistente y por el equipo). */
export function performHandoff(
  d: CrmState,
  c: Conversation,
  o: { lawyerId: string | null; urgent: boolean; reason: string; by: string; actorKind: ActivityEntry['actorKind']; deferred?: string[] },
) {
  const lawyer = d.members.find((m) => m.id === o.lawyerId) ?? null;
  c.mode = 'manual';
  c.status = 'abogado';
  c.ai.stage = 'derivado';
  c.ai.asked = null;
  c.handoffReason = o.reason;
  c.assignedTo = lawyer?.id ?? c.assignedTo;
  if (o.urgent) c.priority = 'urgente';
  else if (c.priority === 'normal') c.priority = 'alta';
  const prospect = c.prospectId ? d.prospects.find((p) => p.id === c.prospectId) ?? null : null;
  if (prospect) {
    if (lawyer) prospect.lawyerId = lawyer.id;
    if (o.urgent) prospect.priority = 'urgente';
    advanceStage(prospect, 'en_atencion', 'La conversación pasó a atención humana.', o.by);
    pushHistory(prospect, 'derivacion', `${o.reason}${lawyer ? ` Responsable: ${memberFull(lawyer)}.` : ''}`, o.by);
  }
  const appointment = c.ai.appointmentId ? d.appointments.find((a) => a.id === c.ai.appointmentId) ?? null : null;
  c.summary = buildSummary(c, { prospect, lawyer, appointment });
  const notice = `Conversación derivada ${lawyer ? `a ${memberFull(lawyer)}` : 'al equipo'}${o.urgent ? ' · Prioridad urgente' : ''} · Atención automática detenida.`;
  if (o.deferred) o.deferred.push(notice);
  else pushMessage(c, 'system', notice);
  if (lawyer) {
    notify(d, {
      kind: 'derivacion',
      title: o.urgent ? 'Derivación urgente' : 'Conversación derivada',
      body: `${c.contactName} · ${o.reason}`,
      href: `/crm/conversaciones?id=${c.id}`,
      forMemberId: lawyer.id,
    });
  }
  logActivity(d, `derivó la conversación de ${c.contactName} ${lawyer ? `a ${memberShort(lawyer)}` : 'al equipo'}${o.urgent ? ' (urgente)' : ''}.`, `/crm/conversaciones?id=${c.id}`, { name: o.by, kind: o.actorKind });
}

export function regenerateSummary(id: string): Result {
  return mutate((d) => {
    const c = d.conversations.find((x) => x.id === id);
    if (!c) return fail('La conversación ya no existe.');
    const prospect = c.prospectId ? d.prospects.find((p) => p.id === c.prospectId) ?? null : null;
    const lawyer = d.members.find((m) => m.id === c.assignedTo) ?? null;
    const appointment = c.ai.appointmentId ? d.appointments.find((a) => a.id === c.ai.appointmentId) ?? null : null;
    c.summary = buildSummary(c, { prospect, lawyer, appointment });
    return { ok: true as const };
  });
}

/** Respuesta manual del abogado. Si la conversación estaba automática, toma el control. */
export function sendAgentMessage(id: string, text: string, attachments: Attachment[] = []): Result {
  if (!text.trim() && !attachments.length) return fail('Escriba un mensaje.');
  const result = mutate((d) => {
    const c = d.conversations.find((x) => x.id === id);
    if (!c) return fail('La conversación ya no existe.');
    if (c.mode === 'auto') {
      c.mode = 'manual';
      c.status = 'abogado';
      c.ai.stage = 'derivado';
      c.ai.asked = null;
      pushMessage(c, 'system', `${actorOf(d)} tomó el control de la conversación. La atención automática está detenida.`);
    }
    if (c.status === 'nuevo' || c.status === 'finalizado') c.status = 'abogado';
    pushMessage(c, 'agent', text.trim(), { authorId: d.currentUserId, attachments: attachments.length ? attachments : undefined });
    c.unread = 0;
    c.pending = false;
    return { ok: true as const, channel: c.channel, to: c.contactHandle };
  });
  if (result.ok) {
    // El envío real depende del adaptador del canal; en la demo es simulado.
    void integrations.messaging[result.channel].send({ conversationId: id, to: result.to, text, attachments });
    return { ok: true };
  }
  return result;
}

/** Crea un prospecto a partir de una conversación que aún no está vinculada. */
export function createProspectFromConversation(id: string): Result<{ prospectId: string }> {
  return mutate((d) => {
    const c = d.conversations.find((x) => x.id === id);
    if (!c) return fail('La conversación ya no existe.');
    if (c.prospectId) return fail('La conversación ya tiene un prospecto.');
    const by = actorOf(d);
    const first = c.messages.find((m) => m.from === 'contact')?.text ?? '';
    const pid = uid('p');
    const p: Prospect = {
      id: pid,
      name: c.ai.data.name ?? c.contactName,
      phone: c.ai.data.phone ?? (c.channel === 'whatsapp' ? c.contactHandle : ''),
      email: c.ai.data.email ?? '',
      channel: c.channel,
      area: c.ai.area,
      serviceSlug: c.ai.serviceSlug,
      description: c.ai.data.description ?? first.slice(0, 280),
      priority: c.priority === 'urgente' ? 'urgente' : c.priority === 'alta' ? 'alta' : 'media',
      stage: 'en_atencion',
      lawyerId: c.assignedTo,
      contactDate: todayISO(),
      nextAction: 'Dar seguimiento a la conversación',
      nextActionDate: todayISO(),
      clientId: null,
      closedReason: null,
      createdAt: nowLocal(),
      history: [],
    };
    pushHistory(p, 'creacion', `Prospecto creado desde la conversación de ${channelName(c.channel)}.`, by);
    d.prospects.unshift(p);
    c.prospectId = pid;
    c.ai.prospectId = pid;
    logActivity(d, `creó el prospecto ${p.name} desde una conversación.`, `/crm/prospectos?id=${pid}`);
    return { ok: true as const, prospectId: pid };
  });
}

export function deleteConversation(id: string): Result {
  return mutate((d) => {
    if (!d.conversations.some((c) => c.id === id)) return fail('La conversación ya no existe.');
    d.conversations = d.conversations.filter((c) => c.id !== id);
    return { ok: true as const };
  });
}

/* ================================== TAREAS ================================= */

export interface TaskInput {
  title: string;
  description: string;
  relatedType: RelatedType | null;
  relatedId: string | null;
  assigneeId: string;
  priority: Priority;
  dueDate: string;
  status: TaskStatus;
  reminder: boolean;
}

export function validateTask(input: TaskInput) {
  const errors: Partial<Record<keyof TaskInput, string>> = {};
  if (!input.title.trim()) errors.title = 'Indique qué hay que hacer.';
  if (!input.assigneeId) errors.assigneeId = 'Asigne un responsable.';
  if (!input.dueDate) errors.dueDate = 'Indique la fecha límite.';
  if (input.relatedType && !input.relatedId) errors.relatedId = 'Seleccione el registro vinculado.';
  return errors;
}

export function createTask(input: TaskInput): Result<{ id: string }> {
  if (Object.keys(validateTask(input)).length) return fail('Revise los campos marcados.');
  return mutate((d) => {
    const id = uid('t');
    const by = actorOf(d);
    d.tasks.unshift({
      ...input,
      title: input.title.trim(),
      id,
      createdAt: nowLocal(),
      history: [{ at: nowLocal(), by, text: 'Tarea creada.' }],
    });
    logActivity(d, `creó la tarea «${input.title.trim()}».`, '/crm/tareas');
    if (input.assigneeId !== d.currentUserId) {
      notify(d, { kind: 'tarea', title: 'Nueva tarea asignada', body: input.title.trim(), href: '/crm/tareas', forMemberId: input.assigneeId });
    }
    return { ok: true as const, id };
  });
}

export function updateTask(id: string, patch: Partial<TaskInput>): Result {
  return mutate((d) => {
    const t = d.tasks.find((x) => x.id === id);
    if (!t) return fail('La tarea ya no existe.');
    const merged = { ...t, ...patch } as TaskInput;
    if (Object.keys(validateTask(merged)).length) return fail('Revise los campos marcados.');
    const by = actorOf(d);
    const changes: string[] = [];
    if (patch.assigneeId && patch.assigneeId !== t.assigneeId) changes.push(`reasignó a ${memberShort(d.members.find((m) => m.id === patch.assigneeId) ?? d.members[0])}`);
    if (patch.dueDate && patch.dueDate !== t.dueDate) changes.push(`movió la fecha límite al ${patch.dueDate}`);
    if (patch.priority && patch.priority !== t.priority) changes.push(`cambió la prioridad a ${patch.priority}`);
    Object.assign(t, patch);
    if (changes.length) t.history.push({ at: nowLocal(), by, text: `Se ${changes.join(', ')}.` });
    return { ok: true as const };
  });
}

export function setTaskStatus(id: string, status: TaskStatus): Result {
  return mutate((d) => {
    const t = d.tasks.find((x) => x.id === id);
    if (!t) return fail('La tarea ya no existe.');
    if (t.status === status) return { ok: true as const };
    t.status = status;
    t.history.push({ at: nowLocal(), by: actorOf(d), text: status === 'completada' ? 'Marcada como completada.' : status === 'en_curso' ? 'Marcada como en curso.' : 'Reabierta como pendiente.' });
    if (status === 'completada') logActivity(d, `completó la tarea «${t.title}».`, '/crm/tareas');
    return { ok: true as const };
  });
}

export function deleteTask(id: string): Result {
  return mutate((d) => {
    if (!d.tasks.some((t) => t.id === id)) return fail('La tarea ya no existe.');
    d.tasks = d.tasks.filter((t) => t.id !== id);
    return { ok: true as const };
  });
}

/* =============================== DOCUMENTOS ================================ */

export function addDocuments(
  files: { name: string; sizeKb: number }[],
  meta: { category: string; clientId: string | null; caseId: string | null; note: string },
): Result<{ count: number }> {
  if (!files.length) return fail('Seleccione al menos un archivo.');
  if (!meta.category) return fail('Seleccione una categoría.');
  return mutate((d) => {
    const by = actorOf(d);
    const caseFile = meta.caseId ? d.cases.find((c) => c.id === meta.caseId) : null;
    const clientId = meta.clientId ?? caseFile?.clientId ?? null;
    for (const f of files) {
      d.documents.unshift({
        id: uid('d'),
        name: f.name,
        ext: f.name.split('.').pop()?.toLowerCase() ?? 'file',
        category: meta.category,
        sizeKb: Math.max(1, Math.round(f.sizeKb)),
        uploadedAt: nowLocal(),
        uploadedBy: by,
        clientId,
        caseId: meta.caseId,
        note: meta.note.trim(),
      });
      if (caseFile) {
        caseFile.timeline.push({ id: uid('ev'), date: todayISO(), kind: 'documento', title: 'Documento agregado', detail: f.name, by });
      }
    }
    logActivity(d, `subió ${files.length} documento${files.length > 1 ? 's' : ''}${caseFile ? ` al expediente ${caseFile.code}` : ''}.`, '/crm/documentos');
    return { ok: true as const, count: files.length };
  });
}

export function updateDocument(id: string, patch: Partial<Pick<DocumentRecord, 'category' | 'clientId' | 'caseId' | 'note' | 'name'>>): Result {
  return mutate((d) => {
    const doc = d.documents.find((x) => x.id === id);
    if (!doc) return fail('El documento ya no existe.');
    if (patch.name !== undefined && !patch.name.trim()) return fail('El nombre no puede estar vacío.');
    Object.assign(doc, patch);
    if (patch.caseId) {
      const cf = d.cases.find((c) => c.id === patch.caseId);
      if (cf) doc.clientId = cf.clientId;
    }
    return { ok: true as const };
  });
}

export function deleteDocument(id: string): Result {
  return mutate((d) => {
    if (!d.documents.some((x) => x.id === id)) return fail('El documento ya no existe.');
    d.documents = d.documents.filter((x) => x.id !== id);
    return { ok: true as const };
  });
}

export function addDocumentCategory(name: string): Result {
  const clean = name.trim();
  if (clean.length < 2) return fail('El nombre de la categoría es muy corto.');
  return mutate((d) => {
    if (d.documentCategories.some((c) => c.toLowerCase() === clean.toLowerCase())) return fail('Ya existe una categoría con ese nombre.');
    d.documentCategories.push(clean);
    return { ok: true as const };
  });
}

export function removeDocumentCategory(name: string): Result {
  return mutate((d) => {
    if (d.documents.some((x) => x.category === name)) return fail('La categoría tiene documentos: muévalos a otra categoría antes de eliminarla.');
    d.documentCategories = d.documentCategories.filter((c) => c !== name);
    return { ok: true as const };
  });
}

/* ============================ NOTIFICACIONES, CONFIG ======================= */

export function markNotificationRead(id: string) {
  mutate((d) => {
    const n = d.notifications.find((x) => x.id === id);
    if (n) n.read = true;
  });
}

export function markAllNotificationsRead() {
  mutate((d) => {
    d.notifications.forEach((n) => {
      n.read = true;
    });
  });
}

export function setCurrentUser(id: string) {
  mutate((d) => {
    if (d.members.some((m) => m.id === id)) d.currentUserId = id;
  });
}

export function updateAssistantConfig(patch: Partial<AssistantConfig>) {
  mutate((d) => {
    d.assistant = { ...d.assistant, ...patch };
  });
}

export function setAssistantChannel(channel: ChannelId, enabled: boolean) {
  mutate((d) => {
    d.assistant.channels = { ...d.assistant.channels, [channel]: enabled };
    logActivity(d, `${enabled ? 'activó' : 'desactivó'} el asistente en ${channelName(channel)}.`, '/crm/asistente');
  });
}

export function saveKbEntry(entry: Omit<KbEntry, 'createdAt' | 'id'> & { id?: string }): Result {
  if (entry.title.trim().length < 3) return fail('Indique un título.');
  if (!entry.keywords.length) return fail('Agregue al menos una palabra clave.');
  if (entry.answer.trim().length < 10) return fail('Redacte la respuesta aprobada.');
  return mutate((d) => {
    if (entry.id) {
      const e = d.kb.find((x) => x.id === entry.id);
      if (!e) return fail('La respuesta ya no existe.');
      Object.assign(e, { title: entry.title.trim(), keywords: entry.keywords, answer: entry.answer.trim(), approved: entry.approved });
    } else {
      d.kb.unshift({ id: uid('kb'), createdAt: nowLocal(), title: entry.title.trim(), keywords: entry.keywords, answer: entry.answer.trim(), approved: entry.approved });
    }
    return { ok: true as const };
  });
}

export function deleteKbEntry(id: string) {
  mutate((d) => {
    d.kb = d.kb.filter((e) => e.id !== id);
  });
}

export function resetDemo() {
  resetState();
}

export { KNOWLEDGE_SERVICES };
