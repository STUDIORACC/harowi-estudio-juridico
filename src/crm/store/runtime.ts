import { useSyncExternalStore } from 'react';
import type { AssistantEffect, HandoffReason } from '../assistant/engine';
import { SCENARIOS, type Scenario } from '../assistant/scenarios';
import { AREAS, CHANNELS } from '../constants';
import { integrations } from '../integrations';
import { nowLocal } from '../lib/dates';
import { memberShort } from '../lib/people';
import { findConflict, nextSlots } from '../lib/scheduling';
import { emailKey, phoneKey, uid } from '../lib/text';
import { getService } from '../knowledge/services';
import type { Appointment, ChannelId, Conversation, CrmState, Prospect } from '../types';
import {
  actorOf,
  advanceStage,
  createConversation,
  insertAppointment,
  logActivity,
  notify,
  performHandoff,
  pushHistory,
  pushMessage,
  type Result,
} from './actions';
import { getState, mutate } from './store';

/**
 * ---------------------------------------------------------------------------
 * EJECUCIÓN DEL ASISTENTE
 * ---------------------------------------------------------------------------
 * Recibe los mensajes del contacto, invoca al `AssistantProvider` configurado
 * y aplica sus EFECTOS al CRM (crear prospecto, reservar cita, derivar). Las
 * respuestas se publican con una pausa y el indicador «escribiendo…», para que
 * la conversación se perciba natural.
 * ---------------------------------------------------------------------------
 */

const ASSISTANT_NAME = 'Asistente HAROWI';

/* ------------------------- Indicador «escribiendo…» ------------------------ */

const typing = new Set<string>();
const typingListeners = new Set<() => void>();
const setTyping = (id: string, on: boolean) => {
  if (on === typing.has(id)) return;
  on ? typing.add(id) : typing.delete(id);
  typingListeners.forEach((l) => l());
};

export function useTyping(conversationId: string | null) {
  return useSyncExternalStore(
    (l) => {
      typingListeners.add(l);
      return () => {
        typingListeners.delete(l);
      };
    },
    () => (conversationId ? typing.has(conversationId) : false),
    () => false,
  );
}

/** Multiplicador de las pausas del asistente (0 = instantáneo; útil en pruebas). */
let speed = 1;
export const setAssistantSpeed = (value: number) => {
  speed = Math.max(0, value);
};
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms * speed));

const queues = new Map<string, Promise<void>>();
function enqueue(id: string, job: () => Promise<void>) {
  const next = (queues.get(id) ?? Promise.resolve()).then(job).catch((err) => {
    console.error('[CRM] Error del asistente:', err);
    setTyping(id, false);
  });
  queues.set(id, next);
}

/* ------------------------------ Efectos → CRM ------------------------------ */

const HANDOFF_REASONS: Record<HandoffReason, string> = {
  solicitud: 'La persona solicitó hablar con un abogado.',
  urgente: 'Situación urgente: derivación inmediata.',
  sensible: 'Situación delicada que requiere atención humana.',
  fuera_alcance: 'Consulta fuera de los servicios definidos: requiere revisión humana.',
  confusion: 'El asistente no logró comprender la consulta.',
  cliente: 'Consulta de un cliente sobre el avance de su expediente.',
};

const ASSISTANT_ACTOR = { name: ASSISTANT_NAME, kind: 'asistente' as const };

type UpsertEffect = Extract<AssistantEffect, { type: 'upsert_prospect' }>;

function upsertProspect(d: CrmState, c: Conversation, fx: UpsertEffect): Prospect {
  let p = c.prospectId ? d.prospects.find((x) => x.id === c.prospectId) ?? null : null;
  const pk = fx.phone ? phoneKey(fx.phone) : '';
  const ek = fx.email ? emailKey(fx.email) : '';

  if (!p && (pk.length >= 9 || ek)) {
    const dup = d.prospects.find((x) => (pk.length >= 9 && phoneKey(x.phone) === pk) || (ek && emailKey(x.email) === ek));
    if (dup) {
      p = dup;
      pushHistory(p, 'conversacion', `Conversación de ${CHANNELS[c.channel].name} vinculada a este prospecto (mismo ${phoneKey(dup.phone) === pk ? 'teléfono' : 'correo'}).`, ASSISTANT_NAME);
    }
  }

  const service = getService(fx.serviceSlug);
  if (!p) {
    const id = uid('p');
    p = {
      id,
      name: fx.name,
      phone: fx.phone,
      email: fx.email,
      channel: c.channel,
      area: fx.area,
      serviceSlug: fx.serviceSlug,
      description: fx.description,
      priority: fx.priority,
      stage: fx.stage,
      lawyerId: fx.lawyerId,
      contactDate: nowLocal().slice(0, 10),
      nextAction: fx.nextAction,
      nextActionDate: nowLocal().slice(0, 10),
      clientId: null,
      closedReason: null,
      createdAt: nowLocal(),
      history: [],
    };
    pushHistory(p, 'creacion', `Prospecto creado por el asistente desde ${CHANNELS[c.channel].name}.`, ASSISTANT_NAME);
    if (fx.area) {
      pushHistory(p, 'clasificacion', `El asistente clasificó la consulta: ${AREAS[fx.area].name}${service ? ` · ${service.name}` : ''}.`, ASSISTANT_NAME);
    }
    d.prospects.unshift(p);
    logActivity(d, `creó el prospecto ${p.name}${fx.area ? ` (${AREAS[fx.area].short}${service ? ` · ${service.name}` : ''})` : ''}.`, `/crm/prospectos?id=${id}`, ASSISTANT_ACTOR);
    notify(d, {
      kind: 'prospecto',
      title: 'Nuevo prospecto',
      body: `${p.name} · ${fx.area ? AREAS[fx.area].short : 'Por clasificar'} · ${CHANNELS[c.channel].name}`,
      href: `/crm/prospectos?id=${id}`,
      forMemberId: fx.lawyerId,
    });
  } else {
    if (fx.area && !p.area) {
      p.area = fx.area;
      p.serviceSlug = fx.serviceSlug ?? p.serviceSlug;
      pushHistory(p, 'clasificacion', `El asistente clasificó la consulta: ${AREAS[fx.area].name}${service ? ` · ${service.name}` : ''}.`, ASSISTANT_NAME);
    }
    if (!p.phone && fx.phone) p.phone = fx.phone;
    if (!p.email && fx.email) p.email = fx.email;
    if (!p.lawyerId && fx.lawyerId) p.lawyerId = fx.lawyerId;
    if (!p.description && fx.description) p.description = fx.description;
    if (fx.priority === 'urgente') p.priority = 'urgente';
    advanceStage(p, fx.stage, `Etapa actualizada por el asistente a «${fx.stage}».`, ASSISTANT_NAME);
  }
  c.prospectId = p.id;
  c.ai.prospectId = p.id;
  if (fx.name && c.channel !== 'whatsapp') c.contactName = fx.name;
  else if (fx.name && c.contactName === 'Contacto de prueba') c.contactName = fx.name;
  return p;
}

interface EffectOutcome {
  appointmentId: string | null;
  /** Si no pudo concretarse la reserva, se reemplazan las respuestas por estas. */
  replaceReplies: string[] | null;
  deferred: string[];
}

function applyEffects(d: CrmState, c: Conversation, effects: AssistantEffect[]): EffectOutcome {
  const out: EffectOutcome = { appointmentId: null, replaceReplies: null, deferred: [] };
  for (const fx of effects) {
    switch (fx.type) {
      case 'classify': {
        const svc = getService(fx.serviceSlug);
        logActivity(d, `clasificó la consulta de ${c.contactName}: ${AREAS[fx.area].name}${svc ? ` · ${svc.name}` : ''}.`, `/crm/conversaciones?id=${c.id}`, ASSISTANT_ACTOR);
        break;
      }
      case 'upsert_prospect':
        upsertProspect(d, c, fx);
        break;
      case 'book': {
        const p = c.prospectId ? d.prospects.find((x) => x.id === c.prospectId) : null;
        const duration = d.assistant.consultMinutes;
        if (findConflict(d.appointments, fx.slot.lawyerId, fx.slot.date, fx.slot.time, duration)) {
          const lawyer = d.members.find((m) => m.id === fx.slot.lawyerId);
          const offered = lawyer ? nextSlots({ member: lawyer, appointments: d.appointments, durationMin: duration, count: 3 }) : [];
          c.ai.stage = 'horarios';
          c.ai.asked = 'slot';
          c.ai.appointmentId = null;
          c.ai.chosen = null;
          c.ai.offered = offered;
          out.replaceReplies = ['Lo siento, ese horario acaba de ser ocupado por otra cita. Indíqueme otro día u hora y lo reviso de inmediato.'];
          break;
        }
        const id = insertAppointment(
          d,
          {
            kind: 'consulta_inicial',
            prospectId: p?.id ?? null,
            clientId: null,
            caseId: null,
            lawyerId: fx.slot.lawyerId,
            area: fx.area,
            serviceSlug: fx.serviceSlug,
            date: fx.slot.date,
            time: fx.slot.time,
            durationMin: duration,
            modality: fx.modality,
            status: 'pendiente',
            notes: `Reservada por el asistente desde ${CHANNELS[c.channel].name}.`,
            reminderWhatsapp: c.channel === 'whatsapp',
            reminderEmail: Boolean(p?.email),
            source: 'asistente',
          },
          ASSISTANT_NAME,
        );
        c.ai.appointmentId = id;
        out.appointmentId = id;
        const lawyer = d.members.find((m) => m.id === fx.slot.lawyerId);
        logActivity(d, `reservó una consulta para ${p?.name ?? c.contactName} con ${lawyer ? memberShort(lawyer) : 'un abogado'} el ${fx.slot.date} a las ${fx.slot.time}.`, '/crm/agenda', ASSISTANT_ACTOR);
        notify(d, {
          kind: 'cita',
          title: 'Cita reservada por el asistente',
          body: `${p?.name ?? c.contactName} · ${fx.slot.date} ${fx.slot.time} (${fx.modality}).`,
          href: '/crm/agenda',
          forMemberId: fx.slot.lawyerId,
        });
        break;
      }
      case 'reschedule': {
        const a: Appointment | undefined = d.appointments.find((x) => x.id === fx.appointmentId);
        if (!a) break;
        if (findConflict(d.appointments, fx.slot.lawyerId, fx.slot.date, fx.slot.time, a.durationMin, a.id)) {
          out.replaceReplies = ['Lo siento, ese horario acaba de ser ocupado. Indíqueme otro día u hora y lo reviso.'];
          c.ai.stage = 'horarios';
          c.ai.asked = 'reschedule_slot';
          break;
        }
        const from = `${a.date} ${a.time}`;
        a.date = fx.slot.date;
        a.time = fx.slot.time;
        a.lawyerId = fx.slot.lawyerId;
        a.modality = fx.modality;
        a.status = 'pendiente';
        out.appointmentId = a.id;
        const p = a.prospectId ? d.prospects.find((x) => x.id === a.prospectId) : null;
        if (p) {
          pushHistory(p, 'cita', `Cita reprogramada por el asistente de ${from} a ${a.date} ${a.time}.`, ASSISTANT_NAME);
          if (p.stage === 'cita_programada') p.nextActionDate = a.date;
        }
        logActivity(d, `reprogramó la consulta de ${p?.name ?? c.contactName} de ${from} a ${a.date} ${a.time}.`, '/crm/agenda', ASSISTANT_ACTOR);
        notify(d, { kind: 'cita', title: 'Cita reprogramada por el asistente', body: `${p?.name ?? c.contactName} · ${a.date} ${a.time}.`, href: '/crm/agenda', forMemberId: a.lawyerId });
        break;
      }
      case 'handoff':
        performHandoff(d, c, { lawyerId: fx.lawyerId, urgent: fx.urgent, reason: HANDOFF_REASONS[fx.reason], by: ASSISTANT_NAME, actorKind: 'asistente', deferred: out.deferred });
        break;
      case 'finish':
        c.status = 'finalizado';
        c.pending = false;
        break;
    }
  }
  return out;
}

/* ------------------------------ Ciclo de turnos ---------------------------- */

const replyDelay = (text: string) => Math.min(1600, 500 + text.length * 8);

async function runAssistantTurn(convId: string, text: string) {
  setTyping(convId, true);
  await sleep(650);
  const s0 = getState();
  const c0 = s0?.conversations.find((x) => x.id === convId);
  if (!s0 || !c0 || c0.mode !== 'auto') {
    setTyping(convId, false);
    return;
  }

  const output = await integrations.assistant.respond({
    text,
    session: c0.ai,
    config: s0.assistant,
    channel: c0.channel,
    contactName: c0.contactName,
    contactHandle: c0.contactHandle,
    members: s0.members,
    appointments: s0.appointments,
    kb: s0.kb,
  });

  // Fase 1: se actualizan el estado del asistente y los registros del CRM.
  const outcome = mutate((d) => {
    const c = d.conversations.find((x) => x.id === convId);
    if (!c) return null;
    c.ai = output.session;
    if (c.status === 'nuevo') c.status = 'ia';
    return applyEffects(d, c, output.effects);
  });
  if (!outcome) {
    setTyping(convId, false);
    return;
  }

  // Fase 2: las respuestas se publican una a una.
  const replies = outcome.replaceReplies ? outcome.replaceReplies.map((t) => ({ text: t, card: undefined })) : output.replies;
  for (const reply of replies) {
    setTyping(convId, true);
    await sleep(replyDelay(reply.text));
    mutate((d) => {
      const c = d.conversations.find((x) => x.id === convId);
      if (!c) return;
      const card =
        reply.card === 'booking' && outcome.appointmentId
          ? ({ kind: 'booking', appointmentId: outcome.appointmentId } as const)
          : reply.card === 'handoff'
            ? ({ kind: 'handoff' } as const)
            : undefined;
      pushMessage(c, 'assistant', reply.text, { card });
    });
  }
  setTyping(convId, false);

  // Fase 3: avisos de sistema (p. ej. «Conversación derivada a…»).
  if (outcome.deferred.length) {
    mutate((d) => {
      const c = d.conversations.find((x) => x.id === convId);
      if (c) outcome.deferred.forEach((t) => pushMessage(c, 'system', t));
    });
  }
}

/** Mensaje entrante del contacto. En modo automático el asistente responde; en manual se avisa al responsable. */
export function receiveContactMessage(convId: string, text: string): Result {
  const clean = text.trim();
  if (!clean) return { ok: false, error: 'Escriba un mensaje.' };
  const auto = mutate((d) => {
    const c = d.conversations.find((x) => x.id === convId);
    if (!c) return null;
    pushMessage(c, 'contact', clean);
    c.unread += 1;
    if (c.status === 'finalizado') c.status = c.mode === 'auto' ? 'ia' : 'abogado';
    const canAuto = c.mode === 'auto' && d.assistant.enabled && d.assistant.channels[c.channel];
    if (c.mode === 'auto' && !canAuto && c.status !== 'abogado') {
      pushMessage(c, 'system', 'El asistente está desactivado en este canal: el mensaje queda en la bandeja para atención del equipo.');
    }
    if (c.mode === 'manual' && c.assignedTo) {
      notify(d, { kind: 'mensaje', title: `Mensaje de ${c.contactName}`, body: clean.slice(0, 90), href: `/crm/conversaciones?id=${c.id}`, forMemberId: c.assignedTo });
    }
    return canAuto;
  });
  if (auto === null) return { ok: false, error: 'La conversación ya no existe.' };
  if (auto) enqueue(convId, () => runAssistantTurn(convId, clean));
  return { ok: true };
}

/** Procesa con el asistente los mensajes de una conversación «Nuevo» que nadie ha respondido. */
export function runAssistantOnPending(convId: string): Result {
  const s = getState();
  const c = s?.conversations.find((x) => x.id === convId);
  if (!s || !c) return { ok: false, error: 'La conversación ya no existe.' };
  if (!s.assistant.enabled || !s.assistant.channels[c.channel]) {
    return { ok: false, error: 'El asistente está desactivado para este canal. Actívelo en Asistente IA.' };
  }
  const trailing: string[] = [];
  for (let i = c.messages.length - 1; i >= 0 && c.messages[i].from === 'contact'; i--) trailing.unshift(c.messages[i].text);
  if (!trailing.length) return { ok: false, error: 'No hay mensajes pendientes de respuesta.' };
  mutate((d) => {
    const x = d.conversations.find((v) => v.id === convId);
    if (x) {
      x.mode = 'auto';
      x.unread = 0;
    }
  });
  enqueue(convId, () => runAssistantTurn(convId, trailing.join(' ')));
  return { ok: true };
}

/* ------------------------- Escenarios y chat de prueba --------------------- */

export function startScenario(id: Scenario['id']): Result<{ conversationId: string; scenario: Scenario }> {
  const scenario = SCENARIOS[id];
  const created = createConversation({ channel: scenario.channel, contactName: scenario.contactName, handle: scenario.handle, origin: 'escenario' });
  if (!created.ok) return created;
  mutate((d) => {
    logActivity(d, `inició el escenario de demostración «${scenario.title}».`, `/crm/conversaciones?id=${created.id}`, { name: actorOf(d), kind: 'equipo' });
  });
  return { ok: true, conversationId: created.id, scenario };
}

const TEST_HANDLES: Record<ChannelId, () => string> = {
  whatsapp: () => `+51 900 000 ${400 + Math.floor(Math.random() * 99)}`,
  facebook: () => 'Facebook · Visitante de prueba',
  web: () => `Visitante web #${1000 + Math.floor(Math.random() * 9000)}`,
};

export function startTestChat(channel: ChannelId): Result<{ conversationId: string }> {
  const created = createConversation({ channel, contactName: 'Contacto de prueba', handle: TEST_HANDLES[channel](), origin: 'prueba' });
  if (!created.ok) return created;
  return { ok: true, conversationId: created.id };
}

/** Espera a que el asistente termine de procesar los mensajes en cola de una conversación. */
export async function whenIdle(convId: string) {
  await (queues.get(convId) ?? Promise.resolve());
  // El último mensaje del asistente puede tardar un instante en publicarse.
  while (typing.has(convId)) await new Promise((r) => setTimeout(r, 60));
}

/**
 * Reproduce mensajes del contacto uno tras otro, esperando la respuesta del
 * asistente entre cada uno. Sirve para los escenarios guiados y para la
 * reserva simulada desde WhatsApp.
 */
export async function playLines(convId: string, lines: string[], opts: { gapMs?: number; onProgress?: (done: number, total: number) => void } = {}) {
  for (let i = 0; i < lines.length; i++) {
    const r = receiveContactMessage(convId, lines[i]);
    if (!r.ok) return r;
    await whenIdle(convId);
    opts.onProgress?.(i + 1, lines.length);
    if (i < lines.length - 1) await sleep(opts.gapMs ?? 500);
  }
  return { ok: true } as const;
}

/** Líneas del contacto para una reserva simulada de una consulta inicial por WhatsApp. */
export function whatsappBookingScript(input: { serviceName: string; fullName: string; modality: 'presencial' | 'virtual'; slotChoice: number }) {
  return [
    `Hola, quisiera una consulta sobre ${input.serviceName.toLowerCase()}`,
    input.fullName,
    'Sí, este mismo número está bien',
    'omitir',
    'Sí, quiero agendar una cita lo antes posible',
    input.modality === 'virtual' ? 'Virtual por favor' : 'Presencial por favor',
    `La opción ${input.slotChoice}`,
  ];
}
