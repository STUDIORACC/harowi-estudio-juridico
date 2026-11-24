'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  CalendarClock,
  CalendarPlus,
  Forward,
  ListChecks,
  ListPlus,
  Mail,
  MessageSquare,
  MessagesSquare,
  Pencil,
  Phone,
  StickyNote,
  Tags,
  Trash2,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { APPOINTMENT_KIND_BY_ID, STAGES } from '@/crm/constants';
import { formatDate, formatMessageStamp, relativeDay } from '@/crm/lib/dates';
import { memberFull } from '@/crm/lib/people';
import { serviceName } from '@/crm/knowledge/services';
import * as crm from '@/crm/store/actions';
import { findDuplicates, isTaskOverdue, lastMessage } from '@/crm/store/selectors';
import { useCrm } from '@/crm/store/store';
import type { HistoryKind, StageId } from '@/crm/types';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';
import { AppointmentStatusBadge, AreaBadge, ChannelBadge, ConversationStatusBadge, PriorityBadge, StageBadge, TaskStatusBadge } from '../ui/Chips';
import { Select, Textarea } from '../ui/Form';
import { EmptyState, KeyValue, Tabs } from '../ui/Layout';
import { Sheet } from '../ui/Overlay';
import { useToast } from '../ui/Toast';

const HISTORY_ICON: Record<HistoryKind, LucideIcon> = {
  creacion: UserPlus,
  estado: ArrowRightLeft,
  conversacion: MessageSquare,
  clasificacion: Tags,
  cita: CalendarClock,
  derivacion: Forward,
  nota: StickyNote,
  tarea: ListChecks,
};

export function ProspectSheet({
  prospectId,
  onClose,
  onEdit,
  onMove,
  onSchedule,
  onTask,
  onDelete,
  onConvert,
}: {
  prospectId: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onMove: (id: string, stage: StageId) => void;
  onSchedule: (id: string) => void;
  onTask: (id: string) => void;
  onDelete: (id: string) => void;
  onConvert: (id: string) => void;
}) {
  const state = useCrm();
  const toast = useToast();
  const [tab, setTab] = useState<'historial' | 'conversaciones' | 'seguimiento'>('historial');
  const [note, setNote] = useState('');
  const prospect = state.prospects.find((p) => p.id === prospectId) ?? null;

  const related = useMemo(() => {
    if (!prospect) return null;
    return {
      conversations: state.conversations.filter((c) => c.prospectId === prospect.id),
      appointments: state.appointments.filter((a) => a.prospectId === prospect.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
      tasks: state.tasks.filter((t) => t.relatedType === 'prospecto' && t.relatedId === prospect.id),
      dupes: findDuplicates(state, { name: prospect.name, phone: prospect.phone, email: prospect.email, excludeProspectId: prospect.id }),
    };
  }, [state, prospect]);

  if (!prospect || !related) return <Sheet open={false} onClose={onClose} title="">{null}</Sheet>;

  const lawyer = state.members.find((m) => m.id === prospect.lawyerId);
  const client = state.clients.find((c) => c.id === prospect.clientId);
  const dupCount = related.dupes.prospects.length + related.dupes.clients.length;
  const history = [...prospect.history].sort((a, b) => b.at.localeCompare(a.at));

  const addNote = () => {
    const r = crm.addProspectNote(prospect.id, note);
    if (!r.ok) return toast.error(r.error);
    setNote('');
    toast.success('Nota agregada al historial');
  };

  return (
    <Sheet
      open
      onClose={onClose}
      width="lg"
      title={prospect.name}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <StageBadge stage={prospect.stage} />
          <PriorityBadge priority={prospect.priority} />
          <ChannelBadge channel={prospect.channel} short />
        </span>
      }
      headerExtra={
        <Button size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => onEdit(prospect.id)}>
          Editar
        </Button>
      }
      footer={
        <>
          <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => onDelete(prospect.id)} className="mr-auto">
            Eliminar
          </Button>
          <Button size="sm" icon={<ListPlus className="h-4 w-4" />} onClick={() => onTask(prospect.id)}>
            Crear tarea
          </Button>
          <Button size="sm" variant="primary" icon={<CalendarPlus className="h-4 w-4" />} onClick={() => onSchedule(prospect.id)}>
            Agendar cita
          </Button>
        </>
      }
    >
      <div className="space-y-5 p-5">
        {dupCount > 0 ? (
          <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[0.8125rem] text-amber-900">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              Posible contacto duplicado
            </p>
            <ul className="mt-1 space-y-0.5 pl-6">
              {related.dupes.prospects.map((p) => (
                <li key={p.id} className="list-disc">
                  Prospecto <Link href={`/crm/prospectos?id=${p.id}`} className="font-medium underline">{p.name}</Link> · {p.phone}
                </li>
              ))}
              {related.dupes.clients.map((c) => (
                <li key={c.id} className="list-disc">
                  Cliente <Link href={`/crm/clientes?id=${c.id}`} className="font-medium underline">{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor="stage-select" className="mb-1.5 block text-[0.8125rem] font-medium text-navy-800">
              Etapa comercial
            </label>
            <Select id="stage-select" value={prospect.stage} onChange={(e) => onMove(prospect.id, e.target.value as StageId)}>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          {client ? (
            <Link href={`/crm/clientes?id=${client.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-50 px-3 text-sm font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100">
              <UserCheck className="h-4 w-4" aria-hidden /> Ver cliente
            </Link>
          ) : prospect.stage !== 'cerrado' ? (
            <Button variant="soft" icon={<UserCheck className="h-4 w-4" />} onClick={() => onConvert(prospect.id)}>
              Convertir en cliente
            </Button>
          ) : null}
        </div>

        <dl className="grid gap-x-6 gap-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:grid-cols-2">
          <KeyValue label="Teléfono">
            {prospect.phone ? (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                {prospect.phone}
              </span>
            ) : (
              '—'
            )}
          </KeyValue>
          <KeyValue label="Correo">
            {prospect.email ? (
              <span className="inline-flex items-center gap-1.5 break-all">
                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                {prospect.email}
              </span>
            ) : (
              '—'
            )}
          </KeyValue>
          <KeyValue label="Área jurídica">
            <AreaBadge area={prospect.area} short={false} />
          </KeyValue>
          <KeyValue label="Servicio solicitado">{prospect.serviceSlug ? serviceName(prospect.serviceSlug) : 'Por definir'}</KeyValue>
          <KeyValue label="Abogado asignado">{lawyer ? memberFull(lawyer) : 'Sin asignar'}</KeyValue>
          <KeyValue label="Fecha de contacto">{formatDate(prospect.contactDate, 'long')}</KeyValue>
          <KeyValue label="Próxima acción" className="sm:col-span-2">
            {prospect.nextAction}
            {prospect.nextActionDate ? <span className={cn('ml-2 text-xs', prospect.nextActionDate < new Date().toISOString().slice(0, 10) && prospect.stage !== 'cerrado' && prospect.stage !== 'contratado' ? 'font-medium text-red-600' : 'text-slate-500')}>· {relativeDay(prospect.nextActionDate)}</span> : null}
          </KeyValue>
          {prospect.closedReason ? <KeyValue label="Motivo del cierre" className="sm:col-span-2">{prospect.closedReason}</KeyValue> : null}
        </dl>

        <div>
          <h3 className="mb-1.5 text-[0.8125rem] font-semibold text-navy-800">Descripción inicial</h3>
          <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-700">{prospect.description || 'Sin descripción.'}</p>
        </div>

        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'historial', label: 'Historial', count: history.length },
            { id: 'conversaciones', label: 'Conversaciones', count: related.conversations.length },
            { id: 'seguimiento', label: 'Citas y tareas', count: related.appointments.length + related.tasks.length },
          ]}
        />

        {tab === 'historial' ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Agregar una nota al historial del prospecto…" aria-label="Nueva nota" className="flex-1" />
              <Button onClick={addNote} disabled={!note.trim()} className="self-end">
                Agregar
              </Button>
            </div>
            <ol className="relative space-y-4 border-l border-slate-200 pl-5">
              {history.map((h) => {
                const Icon = HISTORY_ICON[h.kind];
                return (
                  <li key={h.id} className="relative">
                    <span className="absolute -left-[1.85rem] flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
                      <Icon className="h-3 w-3 text-slate-500" aria-hidden />
                    </span>
                    <p className="text-sm text-navy-900">{h.text}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {h.by} · {formatDate(h.at.slice(0, 10), 'medium')} {h.at.slice(11, 16)}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}

        {tab === 'conversaciones' ? (
          related.conversations.length === 0 ? (
            <EmptyState title="Sin conversaciones" description="Cuando la persona escriba por WhatsApp, Facebook o la web, aparecerá aquí." icon={<MessagesSquare className="h-5 w-5" />} />
          ) : (
            <ul className="space-y-2">
              {related.conversations.map((c) => (
                <li key={c.id}>
                  <Link href={`/crm/conversaciones?id=${c.id}`} className="block rounded-lg border border-slate-200 p-3 hover:border-slate-300 hover:bg-slate-50">
                    <div className="flex items-center justify-between gap-2">
                      <ChannelBadge channel={c.channel} />
                      <ConversationStatusBadge status={c.status} />
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{lastMessage(c)?.text}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {c.messages.length} mensajes · último: {formatMessageStamp(c.lastMessageAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {tab === 'seguimiento' ? (
          <div className="space-y-4">
            <section>
              <h3 className="mb-2 text-[0.8125rem] font-semibold text-navy-800">Citas</h3>
              {related.appointments.length === 0 ? (
                <p className="text-sm text-slate-500">Sin citas registradas.</p>
              ) : (
                <ul className="space-y-2">
                  {related.appointments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy-900">{APPOINTMENT_KIND_BY_ID[a.kind].label}</p>
                        <p className="text-xs text-slate-500">
                          {formatDate(a.date, 'weekday')} · {a.time} · {a.modality}
                        </p>
                      </div>
                      <AppointmentStatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h3 className="mb-2 text-[0.8125rem] font-semibold text-navy-800">Tareas</h3>
              {related.tasks.length === 0 ? (
                <p className="text-sm text-slate-500">Sin tareas vinculadas.</p>
              ) : (
                <ul className="space-y-2">
                  {related.tasks.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-navy-900">{t.title}</p>
                        <p className={cn('text-xs', isTaskOverdue(t) ? 'font-medium text-red-600' : 'text-slate-500')}>Vence: {relativeDay(t.dueDate)}</p>
                      </div>
                      <TaskStatusBadge status={t.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </Sheet>
  );
}
