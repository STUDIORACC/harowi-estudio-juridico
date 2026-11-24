'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bot, CalendarPlus, ExternalLink, ListPlus, RefreshCw, UserPlus } from 'lucide-react';
import { APPOINTMENT_KIND_BY_ID, CONVERSATION_STATUSES } from '@/crm/constants';
import { formatDate, formatMessageStamp } from '@/crm/lib/dates';
import { memberFull } from '@/crm/lib/people';
import { serviceName } from '@/crm/knowledge/services';
import * as crm from '@/crm/store/actions';
import { lawyersOf } from '@/crm/store/selectors';
import type { Conversation, ConversationPriority, ConversationStatus, CrmState } from '@/crm/types';
import { AppointmentModal } from '../agenda/AppointmentModal';
import { TaskModal } from '../tasks/TaskModal';
import { Button } from '../ui/Button';
import { AppointmentStatusBadge, AreaBadge, ChannelBadge, PriorityBadge, StageBadge } from '../ui/Chips';
import { Select, Switch } from '../ui/Form';
import { Avatar } from '../ui/Layout';
import { useToast } from '../ui/Toast';

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="border-b border-slate-100 px-4 py-4">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function InfoPanel({ state, conversation: c }: { state: CrmState; conversation: Conversation }) {
  const toast = useToast();
  const [appt, setAppt] = useState(false);
  const [task, setTask] = useState(false);
  const lawyers = lawyersOf(state.members);
  const prospect = c.prospectId ? state.prospects.find((p) => p.id === c.prospectId) : null;
  const client = c.clientId ? state.clients.find((x) => x.id === c.clientId) : null;
  const appointments = state.appointments.filter((a) => (prospect && a.prospectId === prospect.id) || (client && a.clientId === client.id)).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 3);
  const assigned = state.members.find((m) => m.id === c.assignedTo);
  const ai = c.ai;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-white crm-scroll">
      <div className="flex flex-col items-center border-b border-slate-100 px-4 pb-4 pt-5 text-center">
        <Avatar name={c.contactName} size="lg" tone={client ? 'green' : 'slate'} />
        <h2 className="mt-2.5 text-[0.9375rem] font-semibold text-navy-900">{c.contactName}</h2>
        <p className="text-xs text-slate-500">{c.contactHandle}</p>
        <div className="mt-1.5"><ChannelBadge channel={c.channel} /></div>
        {client ? <Link href={`/crm/clientes?id=${client.id}`} className="mt-2 text-xs font-medium text-emerald-700 hover:underline">Cliente · ver ficha</Link> : null}
      </div>

      <Section title="Gestión de la conversación">
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Etiqueta</span>
            <Select value={c.status} onChange={(e) => crm.setConversationStatus(c.id, e.target.value as ConversationStatus)}>
              {CONVERSATION_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Prioridad</span>
            <Select value={c.priority} onChange={(e) => crm.setConversationPriority(c.id, e.target.value as ConversationPriority)}>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </Select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Abogado asignado</span>
            <Select value={c.assignedTo ?? ''} onChange={(e) => { const r = crm.assignConversation(c.id, e.target.value || null); if (r.ok) toast.success('Asignación actualizada'); }}>
              <option value="">Sin asignar</option>
              {lawyers.map((l) => (
                <option key={l.id} value={l.id}>{memberFull(l)}</option>
              ))}
            </Select>
          </label>
          <Switch checked={c.pending} onChange={() => crm.toggleConversationPending(c.id)} label="Marcar como pendiente" description="Aparece en el filtro «Pendientes» para retomarla." />
        </div>
      </Section>

      {c.summary ? (
        <Section title="Resumen para el abogado" action={<button type="button" onClick={() => { crm.regenerateSummary(c.id); toast.success('Resumen actualizado'); }} className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"><RefreshCw className="h-3 w-3" aria-hidden />Actualizar</button>}>
          <p className="rounded-lg bg-amber-50 p-3 text-[0.8125rem] leading-relaxed text-slate-700 ring-1 ring-amber-100">{c.summary}</p>
          {c.handoffReason ? <p className="mt-2 text-xs text-slate-500">Motivo de la derivación: {c.handoffReason}</p> : null}
        </Section>
      ) : (
        <Section title="Resumen">
          <p className="text-[0.8125rem] text-slate-500">Se genera al derivar la conversación a un abogado.</p>
          <Button size="sm" className="mt-2" onClick={() => { crm.regenerateSummary(c.id); toast.success('Resumen generado'); }}>Generar resumen</Button>
        </Section>
      )}

      <Section title="Prospecto">
        {prospect ? (
          <div className="space-y-2.5 rounded-lg border border-slate-200 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 text-sm font-semibold text-navy-900">{prospect.name}</p>
              <Link href={`/crm/prospectos?id=${prospect.id}`} aria-label="Abrir ficha del prospecto" className="shrink-0 text-slate-400 hover:text-brand-700"><ExternalLink className="h-4 w-4" /></Link>
            </div>
            <div className="flex flex-wrap items-center gap-2"><StageBadge stage={prospect.stage} /><PriorityBadge priority={prospect.priority} /></div>
            <dl className="space-y-1 text-[0.8125rem]">
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Área</dt><dd><AreaBadge area={prospect.area} /></dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Servicio</dt><dd className="text-right text-navy-900">{prospect.serviceSlug ? serviceName(prospect.serviceSlug) : 'Por definir'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Teléfono</dt><dd className="text-navy-900">{prospect.phone || '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Correo</dt><dd className="truncate text-navy-900">{prospect.email || '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Responsable</dt><dd className="text-navy-900">{assigned ? memberFull(assigned) : 'Sin asignar'}</dd></div>
            </dl>
            <p className="rounded bg-slate-50 px-2 py-1.5 text-xs text-slate-600"><span className="font-medium text-slate-700">Próxima acción:</span> {prospect.nextAction}</p>
          </div>
        ) : client ? (
          <p className="text-[0.8125rem] text-slate-600">Esta persona ya es cliente del estudio.</p>
        ) : (
          <div>
            <p className="text-[0.8125rem] text-slate-500">Aún no hay un prospecto vinculado a esta conversación.</p>
            <Button size="sm" className="mt-2" icon={<UserPlus className="h-4 w-4" />} onClick={() => { const r = crm.createProspectFromConversation(c.id); if (r.ok) toast.success('Prospecto creado'); else toast.error(r.error); }}>
              Crear prospecto
            </Button>
          </div>
        )}
      </Section>

      <Section title="Lo que entendió el asistente">
        <dl className="space-y-1.5 text-[0.8125rem]">
          <div className="flex items-center justify-between gap-2"><dt className="flex items-center gap-1.5 text-slate-500"><Bot className="h-3.5 w-3.5 text-violet-500" aria-hidden />Área</dt><dd><AreaBadge area={ai.area} /></dd></div>
          <div className="flex justify-between gap-2"><dt className="text-slate-500">Servicio</dt><dd className="text-right text-navy-900">{ai.serviceSlug ? serviceName(ai.serviceSlug) : '—'}</dd></div>
          <div className="flex justify-between gap-2"><dt className="text-slate-500">Nombre</dt><dd className="text-navy-900">{ai.data.name ?? '—'}</dd></div>
          <div className="flex justify-between gap-2"><dt className="text-slate-500">Teléfono</dt><dd className="text-navy-900">{ai.data.phone ?? '—'}</dd></div>
          <div className="flex justify-between gap-2"><dt className="text-slate-500">Correo</dt><dd className="truncate text-navy-900">{ai.data.email ?? (ai.data.emailSkipped ? 'Omitido' : '—')}</dd></div>
          <div className="flex justify-between gap-2"><dt className="text-slate-500">Paso del flujo</dt><dd className="text-navy-900 capitalize">{ai.stage}</dd></div>
        </dl>
      </Section>

      {appointments.length ? (
        <Section title="Citas">
          <ul className="space-y-2">
            {appointments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[0.8125rem] font-medium text-navy-900">{APPOINTMENT_KIND_BY_ID[a.kind].label}</p>
                  <p className="text-xs text-slate-500">{formatDate(a.date, 'medium')} · {a.time}</p>
                </div>
                <AppointmentStatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Acciones">
        <div className="grid gap-2">
          <Button icon={<CalendarPlus className="h-4 w-4" />} onClick={() => setAppt(true)} disabled={!prospect && !client}>Agendar cita</Button>
          <Button icon={<ListPlus className="h-4 w-4" />} onClick={() => setTask(true)}>Crear tarea de seguimiento</Button>
        </div>
        {!prospect && !client ? <p className="mt-2 text-xs text-slate-500">Cree el prospecto para poder agendar una cita.</p> : null}
      </Section>

      {prospect ? (
        <Section title="Historial del prospecto">
          <ol className="space-y-2.5">
            {[...prospect.history].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6).map((h) => (
              <li key={h.id} className="text-[0.8125rem] leading-snug text-slate-600">
                {h.text}
                <span className="block text-[0.6875rem] text-slate-400">{h.by} · {formatMessageStamp(h.at)}</span>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      <AppointmentModal
        open={appt}
        onClose={() => setAppt(false)}
        defaults={{ prospectId: prospect?.id ?? null, clientId: client?.id ?? null, lawyerId: c.assignedTo ?? prospect?.lawyerId ?? client?.lawyerId ?? undefined, area: prospect?.area ?? ai.area ?? 'familia', serviceSlug: prospect?.serviceSlug ?? ai.serviceSlug, modality: ai.modality ?? 'presencial' }}
      />
      <TaskModal open={task} onClose={() => setTask(false)} defaults={prospect ? { relatedType: 'prospecto', relatedId: prospect.id, title: `Seguimiento: ${prospect.name}` } : client ? { relatedType: 'cliente', relatedId: client.id, title: `Seguimiento: ${client.name}` } : { title: `Seguimiento: ${c.contactName}` }} />
    </div>
  );
}
