'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bot, CalendarCheck2, Eraser, ExternalLink, Forward, Lightbulb, Send } from 'lucide-react';
import { AREAS, CHANNEL_LIST } from '@/crm/constants';
import { formatDate, formatTime12 } from '@/crm/lib/dates';
import { memberFull } from '@/crm/lib/people';
import { serviceName } from '@/crm/knowledge/services';
import * as crm from '@/crm/store/actions';
import { receiveContactMessage, startTestChat, useTyping } from '@/crm/store/runtime';
import { useCrm } from '@/crm/store/store';
import type { ChannelId, Conversation } from '@/crm/types';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AreaBadge, ChannelBadge, ChannelIcon } from '../ui/Chips';
import { Card, CardHeader } from '../ui/Layout';
import { useToast } from '../ui/Toast';

const SUGGESTIONS = [
  'Hola, necesito demandar por alimentos para mi hijo',
  'Quiero divorciarme, mi esposo no está de acuerdo',
  'Mi inquilino no me paga el alquiler hace 5 meses',
  'Quiero constituir una SAC con dos socios',
  'Me citaron a declarar en una investigación por lavado de activos',
  '¿Eres abogado? ¿Cuánto cuesta una consulta?',
  'Mi hermano fue detenido por la policía, es urgente',
  'Quiero hablar con un abogado',
];

/** Chat interactivo para probar el asistente. Las pruebas generan registros reales de la demostración. */
export function AssistantTester() {
  const state = useCrm();
  const toast = useToast();
  const [channel, setChannel] = useState<ChannelId>('whatsapp');
  const [testId, setTestId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  const typing = useTyping(testId);
  const conv: Conversation | null = state.conversations.find((c) => c.id === testId) ?? null;

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [conv?.messages.length, typing]);

  const send = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    let id = testId;
    if (!id || !conv) {
      const created = startTestChat(channel);
      if (!created.ok) return toast.error(created.error);
      id = created.conversationId;
      setTestId(id);
    }
    const r = receiveContactMessage(id, clean);
    if (!r.ok) return toast.error(r.error);
    setText('');
  };

  const reset = () => {
    setTestId(null);
    setText('');
  };

  const prospect = conv?.prospectId ? state.prospects.find((p) => p.id === conv.prospectId) : null;
  const appointment = conv?.ai.appointmentId ? state.appointments.find((a) => a.id === conv.ai.appointmentId) : null;
  const lawyer = state.members.find((m) => m.id === (conv?.ai.lawyerId ?? conv?.assignedTo));
  const ai = conv?.ai;
  const manual = conv?.mode === 'manual';

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
      <Card className="flex h-[40rem] min-h-0 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700"><Bot className="h-4 w-4" aria-hidden /></span>
          <div className="mr-auto">
            <h2 className="text-sm font-semibold text-navy-900">Probar el asistente</h2>
            <p className="text-xs text-slate-500">Escriba como si fuera un cliente. Respuestas por reglas, sin API externa.</p>
          </div>
          {!conv ? (
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5" role="group" aria-label="Canal de la prueba">
              {CHANNEL_LIST.map((c) => (
                <button key={c.id} type="button" onClick={() => setChannel(c.id)} aria-pressed={channel === c.id} className={cn('inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium', channel === c.id ? 'bg-white text-navy-900 shadow-card' : 'text-slate-500')}>
                  <ChannelIcon channel={c.id} />
                  {c.id === 'facebook' ? 'Messenger' : c.name}
                </button>
              ))}
            </div>
          ) : (
            <ChannelBadge channel={conv.channel} />
          )}
          <Button size="sm" icon={<Eraser className="h-3.5 w-3.5" />} onClick={reset} disabled={!conv}>Nueva prueba</Button>
        </div>

        <div className="crm-scroll min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-4" role="log" aria-live="polite" aria-label="Chat de prueba">
          {!conv || conv.messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700"><Lightbulb className="h-5 w-5" aria-hidden /></span>
              <p className="text-sm font-medium text-navy-900">Pruebe una consulta</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">Elija un ejemplo o escriba su propio mensaje. El asistente saludará, identificará el área, pedirá datos y podrá reservar una cita.</p>
              <div className="mt-4 flex max-w-xl flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs text-slate-700 shadow-card transition-colors hover:border-brand-300 hover:bg-brand-50">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            conv.messages.map((m) => {
              if (m.from === 'system') return <p key={m.id} className="mx-auto w-fit max-w-[90%] rounded-full bg-slate-200/70 px-3 py-1 text-center text-[0.6875rem] font-medium text-slate-600">{m.text}</p>;
              if (m.from === 'note' || m.from === 'agent') return (
                <div key={m.id} className="flex justify-start"><div className="max-w-[80%] rounded-2xl rounded-bl-md bg-navy-800 px-3.5 py-2 text-sm text-white"><p className="mb-0.5 text-[0.6875rem] font-semibold text-navy-200">{memberFull(state.members.find((x) => x.id === m.authorId) ?? state.members[0])}</p>{m.text}</div></div>
              );
              const mine = m.from === 'contact';
              const apt = m.card?.kind === 'booking' ? state.appointments.find((a) => a.id === (m.card as { appointmentId: string }).appointmentId) : null;
              return (
                <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                  <div className="max-w-[82%]">
                    <div className={cn('rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-card', mine ? 'rounded-br-md bg-navy-800 text-white' : 'rounded-bl-md bg-violet-100 text-violet-950')}>
                      {!mine ? <p className="mb-0.5 flex items-center gap-1 text-[0.6875rem] font-semibold text-violet-700"><Bot className="h-3 w-3" aria-hidden />Asistente HAROWI</p> : null}
                      <p className="whitespace-pre-line">{m.text}</p>
                    </div>
                    {apt ? (
                      <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2 text-[0.8125rem] shadow-card">
                        <CalendarCheck2 className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                        <span className="min-w-0 flex-1"><strong>Cita registrada:</strong> {formatDate(apt.date, 'weekday')} · {formatTime12(apt.time)} · {apt.modality}</span>
                      </div>
                    ) : null}
                    {m.card?.kind === 'handoff' ? <p className="mt-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-900 ring-1 ring-amber-200"><Forward className="mr-1 inline h-3.5 w-3.5" aria-hidden />Conversación derivada a una persona.</p> : null}
                  </div>
                </div>
              );
            })
          )}
          {typing ? (
            <div className="flex justify-start" aria-label="El asistente está escribiendo">
              <div className="rounded-2xl rounded-bl-md bg-violet-100 px-3.5 py-2.5"><span className="crm-typing"><span /><span /><span /></span></div>
            </div>
          ) : null}
          <div ref={bottom} />
        </div>

        {manual ? (
          <div className="border-t border-amber-200 bg-amber-50 px-4 py-2.5 text-[0.8125rem] text-amber-900">
            La conversación pasó a atención humana: el asistente ya no responde.{' '}
            {conv ? <Link href={`/crm/conversaciones?id=${conv.id}`} className="font-semibold underline">Responder como abogado en la bandeja</Link> : null}
          </div>
        ) : null}

        <form
          className="flex items-end gap-2 border-t border-slate-200 bg-white p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(text);
              }
            }}
            rows={1}
            aria-label="Mensaje de prueba"
            placeholder="Escriba un mensaje como cliente…"
            className="max-h-28 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-card placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <Button type="submit" variant="primary" icon={<Send className="h-4 w-4" />} disabled={!text.trim() || typing}>
            Enviar
          </Button>
        </form>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Comprensión en vivo" description="Lo que el asistente entiende de la conversación" />
          <dl className="space-y-2.5 px-4 pb-4 text-[0.8125rem] sm:px-5">
            <Row label="Área jurídica">{ai?.area ? <AreaBadge area={ai.area} short={false} /> : <Muted />}</Row>
            <Row label="Servicio">{ai?.serviceSlug ? serviceName(ai.serviceSlug) : <Muted />}</Row>
            <Row label="Urgencia">{ai?.urgent ? <Badge tone="red" dot>Urgente</Badge> : <Muted text="Normal" />}</Row>
            <Row label="Nombre">{ai?.data.name ?? <Muted />}</Row>
            <Row label="Teléfono">{ai?.data.phone ?? <Muted />}</Row>
            <Row label="Correo">{ai?.data.email ?? (ai?.data.emailSkipped ? 'Omitido' : <Muted />)}</Row>
            <Row label="Modalidad">{ai?.modality ?? <Muted />}</Row>
            <Row label="Paso del flujo"><span className="capitalize">{ai?.stage ?? 'inicio'}</span></Row>
            <Row label="Espera">{ai?.asked ? ai.asked.replace('_', ' ') : <Muted text="—" />}</Row>
          </dl>
        </Card>
        <Card>
          <CardHeader title="Resultado en el CRM" description="Registros creados por esta prueba" />
          <ul className="space-y-2 px-4 pb-4 text-[0.8125rem] sm:px-5">
            <Outcome done={Boolean(conv)} label="Conversación en la bandeja" href={conv ? `/crm/conversaciones?id=${conv.id}` : undefined} />
            <Outcome done={Boolean(prospect)} label={prospect ? `Prospecto: ${prospect.name}` : 'Prospecto creado'} href={prospect ? `/crm/prospectos?id=${prospect.id}` : undefined} />
            <Outcome done={Boolean(appointment)} label={appointment ? `Cita: ${formatDate(appointment.date, 'medium')} ${appointment.time}` : 'Cita reservada'} href={appointment ? '/crm/agenda' : undefined} />
            <Outcome done={Boolean(conv?.handoffReason)} label={conv?.handoffReason ? `Derivación a ${lawyer ? memberFull(lawyer) : 'un abogado'}` : 'Derivación a un abogado'} href={conv?.handoffReason ? `/crm/conversaciones?id=${conv.id}` : undefined} />
          </ul>
          {conv?.summary ? <p className="mx-4 mb-4 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-slate-700 ring-1 ring-amber-100 sm:mx-5">{conv.summary}</p> : null}
        </Card>
        {ai?.area ? <p className="px-1 text-xs text-slate-500">Clasificado como {AREAS[ai.area].name}.</p> : null}
      </div>
    </div>
  );
}

const Muted = ({ text = 'Sin definir' }: { text?: string }) => <span className="text-slate-400">{text}</span>;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0 truncate text-right text-navy-900">{children}</dd>
    </div>
  );
}

function Outcome({ done, label, href }: { done: boolean; label: string; href?: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.625rem]', done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400')}>{done ? '✓' : '·'}</span>
      <span className={cn('min-w-0 flex-1 truncate', done ? 'text-navy-900' : 'text-slate-400')}>{label}</span>
      {href ? <Link href={href} aria-label={`Abrir: ${label}`} className="text-slate-400 hover:text-brand-700"><ExternalLink className="h-3.5 w-3.5" /></Link> : null}
    </li>
  );
}

