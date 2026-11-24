'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  CalendarCheck2,
  FileText,
  Forward,
  Info,
  Paperclip,
  Play,
  Send,
  StickyNote,
  UserRound,
  UserRoundCog,
  X,
  Zap,
} from 'lucide-react';
import { SCENARIOS } from '@/crm/assistant/scenarios';
import { APPOINTMENT_KIND_BY_ID } from '@/crm/constants';
import { diffDays, formatDate, formatTime12, relativeDay, todayISO } from '@/crm/lib/dates';
import { memberFull, memberShort } from '@/crm/lib/people';
import { formatBytes } from '@/crm/lib/text';
import * as crm from '@/crm/store/actions';
import { playLines, receiveContactMessage, runAssistantOnPending, setAssistantSpeed, useTyping } from '@/crm/store/runtime';
import type { Attachment, Conversation, CrmState, Message } from '@/crm/types';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/Badge';
import { Button, IconButton } from '../ui/Button';
import { AppointmentStatusBadge, ChannelBadge, ConversationStatusBadge } from '../ui/Chips';
import { Avatar } from '../ui/Layout';
import { useToast } from '../ui/Toast';

type Mode = 'responder' | 'nota' | 'cliente';

export function Thread({
  state,
  conversation,
  onBack,
  onInfo,
  onTransfer,
}: {
  state: CrmState;
  conversation: Conversation;
  onBack: () => void;
  onInfo: () => void;
  onTransfer: () => void;
}) {
  const toast = useToast();
  const typing = useTyping(conversation.id);
  const [mode, setMode] = useState<Mode>('responder');
  const [text, setText] = useState('');
  const [files, setFiles] = useState<Attachment[]>([]);
  const [playing, setPlaying] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const c = conversation;
  const me = state.members.find((m) => m.id === state.currentUserId) ?? state.members[0];

  useEffect(() => {
    setText('');
    setFiles([]);
    setMode('responder');
  }, [c.id]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [c.messages.length, typing, c.id]);

  const scenario = c.origin === 'escenario' ? Object.values(SCENARIOS).find((s) => s.handle === c.contactHandle) : null;
  const contactCount = c.messages.filter((m) => m.from === 'contact').length;
  const nextLine = scenario ? scenario.lines[contactCount] : undefined;
  const assistantOn = state.assistant.enabled && state.assistant.channels[c.channel];

  const days = useMemo(() => {
    const out: { key: string; label: string; items: Message[] }[] = [];
    for (const m of c.messages) {
      const day = m.at.slice(0, 10);
      const last = out[out.length - 1];
      if (last?.key === day) last.items.push(m);
      else out.push({ key: day, label: diffDays(todayISO(), day) === 0 ? 'Hoy' : diffDays(todayISO(), day) === 1 ? 'Ayer' : formatDate(day, 'weekday'), items: [m] });
    }
    return out;
  }, [c.messages]);

  const send = () => {
    if (mode === 'nota') {
      const r = crm.addInternalNote(c.id, text);
      if (!r.ok) return toast.error(r.error);
    } else if (mode === 'cliente') {
      const r = receiveContactMessage(c.id, text);
      if (!r.ok) return toast.error(r.error);
    } else {
      const wasAuto = c.mode === 'auto';
      const r = crm.sendAgentMessage(c.id, text, files);
      if (!r.ok) return toast.error(r.error);
      if (wasAuto) toast.info('Tomó el control de la conversación', 'La atención automática quedó detenida.');
    }
    setText('');
    setFiles([]);
  };

  const sendScripted = () => {
    if (!nextLine) return;
    const r = receiveContactMessage(c.id, nextLine);
    if (!r.ok) toast.error(r.error);
  };

  const playAll = async () => {
    if (!scenario) return;
    setPlaying(true);
    setAssistantSpeed(0.6);
    await playLines(c.id, scenario.lines.slice(contactCount), { gapMs: 900 });
    setAssistantSpeed(1);
    setPlaying(false);
  };

  const quick = [
    { label: 'Saludo y presentación', text: `Buenas tardes, le escribe ${memberShort(me)} de HAROWI Estudio Jurídico. Ya revisé el resumen de su consulta y quiero ayudarle.` },
    { label: 'Solicitar documentos', text: 'Para avanzar con la evaluación, ¿podría enviarnos los documentos que tenga relacionados con su caso? Solo los revisará el equipo asignado.' },
    { label: 'Confirmar recepción', text: 'Recibimos su mensaje. En breve le responderemos con más detalle.' },
  ];
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/50">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-2.5 sm:px-4">
        <IconButton label="Volver a la lista" size="sm" className="lg:hidden" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </IconButton>
        <Avatar name={c.contactName} tone={c.clientId ? 'green' : 'slate'} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="truncate text-[0.9375rem] font-semibold text-navy-900">{c.contactName}</h2>
            <ConversationStatusBadge status={c.status} />
            {c.priority === 'urgente' ? <Badge tone="red" dot>Urgente</Badge> : c.priority === 'alta' ? <Badge tone="amber">Prioridad alta</Badge> : null}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
            <ChannelBadge channel={c.channel} />
            <span>· {c.contactHandle}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {c.mode === 'auto' ? (
            <Button size="sm" icon={<UserRoundCog className="h-4 w-4" />} onClick={() => { crm.takeControl(c.id); toast.info('Tomó el control', 'El asistente dejó de responder.'); }} title="Detiene el asistente y responde usted">
              <span className="hidden sm:inline">Tomar control</span>
            </Button>
          ) : (
            <Button size="sm" icon={<Bot className="h-4 w-4" />} onClick={() => { crm.returnToAssistant(c.id); toast.success('Asistente reactivado'); }} disabled={!assistantOn} title={assistantOn ? 'Devuelve la conversación al asistente virtual' : 'El asistente está desactivado en este canal'}>
              <span className="hidden sm:inline">Devolver al asistente</span>
            </Button>
          )}
          <Button size="sm" icon={<Forward className="h-4 w-4" />} onClick={onTransfer}>
            <span className="hidden md:inline">Transferir a un abogado</span>
          </Button>
          <IconButton label="Información del contacto" size="sm" className="2xl:hidden" onClick={onInfo}>
            <Info className="h-4 w-4" />
          </IconButton>
        </div>
      </header>

      <div className={cn('flex items-center gap-2 border-b px-4 py-1.5 text-xs', c.mode === 'auto' ? 'border-violet-100 bg-violet-50 text-violet-800' : 'border-amber-100 bg-amber-50 text-amber-900')} role="status">
        {c.mode === 'auto' ? <Bot className="h-3.5 w-3.5" aria-hidden /> : <UserRound className="h-3.5 w-3.5" aria-hidden />}
        {c.mode === 'auto'
          ? assistantOn
            ? 'Atención automática: el asistente virtual responde a esta conversación (modo demostración).'
            : 'El asistente está desactivado en este canal: atiende el equipo.'
          : `Atención manual${c.assignedTo ? ` · responsable: ${memberShort(state.members.find((m) => m.id === c.assignedTo) ?? me)}` : ''}. El asistente no responde.`}
      </div>

      <div className="crm-scroll min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5" role="log" aria-live="polite" aria-label="Mensajes de la conversación">
        {c.messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-500">
            <p className="font-medium text-navy-800">Conversación nueva</p>
            <p className="mt-1 max-w-xs">Aún no hay mensajes. Use el modo «Simular cliente» o el guion de demostración para empezar.</p>
          </div>
        ) : null}
        {days.map((d) => (
          <section key={d.key} className="space-y-2.5">
            <div className="flex justify-center py-2">
              <span className="rounded-full bg-white px-3 py-0.5 text-[0.6875rem] font-medium text-slate-500 shadow-card ring-1 ring-slate-200">{d.label}</span>
            </div>
            {d.items.map((m) => (
              <Bubble key={m.id} message={m} state={state} conversation={c} />
            ))}
          </section>
        ))}
        {typing ? (
          <div className="mt-2.5 flex justify-end" aria-label="El asistente está escribiendo">
            <div className="rounded-2xl rounded-br-md bg-violet-100 px-3.5 py-2.5">
              <span className="crm-typing"><span /><span /><span /></span>
            </div>
          </div>
        ) : null}
        <div ref={bottom} />
      </div>

      {c.status === 'nuevo' && c.mode === 'auto' && !typing && c.messages.at(-1)?.from === 'contact' ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-blue-100 bg-brand-50 px-4 py-2.5 text-[0.8125rem] text-brand-900">
          <span className="min-w-0 flex-1">Esta consulta aún no fue atendida.</span>
          <Button size="sm" variant="brand" icon={<Bot className="h-4 w-4" />} onClick={() => { const r = runAssistantOnPending(c.id); if (!r.ok) toast.error('No se pudo iniciar', r.error); }}>
            Responder con el asistente
          </Button>
        </div>
      ) : null}

      {scenario ? (
        <div className="border-t border-violet-100 bg-violet-50/70 px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-900"><Zap className="h-3.5 w-3.5" aria-hidden /> Guion de demostración</span>
            <span className="text-xs text-violet-700">{scenario.title}</span>
            <span className="ml-auto text-xs text-violet-700">{Math.min(contactCount, scenario.lines.length)}/{scenario.lines.length} mensajes del cliente</span>
          </div>
          {nextLine ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="min-w-0 flex-1 rounded-lg bg-white px-3 py-1.5 text-[0.8125rem] text-slate-700 ring-1 ring-violet-100">
                <span className="text-xs font-medium text-violet-700">Siguiente mensaje del cliente: </span>«{nextLine}»
              </p>
              <Button size="sm" variant="brand" icon={<Send className="h-3.5 w-3.5" />} onClick={sendScripted} disabled={typing || playing}>
                Enviar como cliente
              </Button>
              <Button size="sm" icon={<Play className="h-3.5 w-3.5" />} onClick={playAll} loading={playing} disabled={typing}>
                Reproducir todo
              </Button>
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-violet-800">Guion completado. Puede seguir escribiendo como cliente o responder como abogado.</p>
          )}
        </div>
      ) : null}

      <div className="border-t border-slate-200 bg-white p-3">
        <div className="mb-2 flex flex-wrap items-center gap-1">
          {([
            ['responder', 'Responder', Send],
            ['nota', 'Nota interna', StickyNote],
            ['cliente', 'Simular cliente', UserRound],
          ] as const).map(([id, label, Icon]) => (
            <button key={id} type="button" onClick={() => setMode(id)} aria-pressed={mode === id} className={cn('inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors', mode === id ? (id === 'nota' ? 'bg-amber-100 text-amber-900' : id === 'cliente' ? 'bg-violet-100 text-violet-900' : 'bg-navy-800 text-white') : 'text-slate-500 hover:bg-slate-100')}>
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {label}
            </button>
          ))}
          {mode === 'responder' ? (
            <div className="relative ml-auto">
              <button type="button" onClick={() => setQuickOpen((v) => !v)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100" aria-expanded={quickOpen}>
                <Zap className="h-3.5 w-3.5" aria-hidden /> Respuestas rápidas
              </button>
              {quickOpen ? (
                <div className="crm-pop absolute bottom-full right-0 z-30 mb-1 w-72 rounded-lg border border-slate-200 bg-white py-1 shadow-pop">
                  {quick.map((q) => (
                    <button key={q.label} type="button" onClick={() => { setText(q.text); setQuickOpen(false); }} className="block w-full px-3 py-2 text-left hover:bg-slate-50">
                      <span className="block text-[0.8125rem] font-medium text-navy-900">{q.label}</span>
                      <span className="line-clamp-2 text-xs text-slate-500">{q.text}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {mode === 'responder' && c.mode === 'auto' ? <p className="mb-1.5 text-xs text-amber-700">Al enviar tomará el control: el asistente dejará de responder en esta conversación.</p> : null}
        {mode === 'cliente' ? <p className="mb-1.5 text-xs text-violet-700">Modo demostración: este mensaje simula que el contacto escribe por {c.channel === 'whatsapp' ? 'WhatsApp' : c.channel === 'facebook' ? 'Messenger' : 'la web'}.</p> : null}
        {mode === 'nota' ? <p className="mb-1.5 text-xs text-amber-700">Las notas internas no se envían al contacto.</p> : null}

        {files.length ? (
          <ul className="mb-2 flex flex-wrap gap-1.5">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 py-1 pl-2 pr-1 text-xs text-slate-700">
                <FileText className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                {f.name} · {formatBytes(f.sizeKb)}
                <button type="button" aria-label={`Quitar ${f.name}`} onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))} className="rounded p-0.5 hover:bg-slate-200"><X className="h-3 w-3" /></button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex items-end gap-2">
          {mode === 'responder' ? (
            <>
              <IconButton label="Adjuntar archivo" onClick={() => fileInput.current?.click()}>
                <Paperclip className="h-[18px] w-[18px]" />
              </IconButton>
              <input
                ref={fileInput}
                type="file"
                multiple
                className="sr-only"
                aria-label="Adjuntar archivos"
                onChange={(e) => {
                  const picked = [...(e.target.files ?? [])].map((f) => ({ name: f.name, sizeKb: f.size / 1024, ext: f.name.split('.').pop() ?? '' }));
                  setFiles((cur) => [...cur, ...picked]);
                  e.target.value = '';
                }}
              />
            </>
          ) : null}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (text.trim() || files.length) send();
              }
            }}
            rows={2}
            aria-label={mode === 'nota' ? 'Nota interna' : mode === 'cliente' ? 'Mensaje del cliente (simulado)' : 'Escribir una respuesta'}
            placeholder={mode === 'nota' ? 'Escriba una nota interna…' : mode === 'cliente' ? 'Escriba lo que diría el cliente…' : 'Escriba una respuesta… (Enter envía, Shift+Enter nueva línea)'}
            className={cn('max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-lg border px-3 py-2 text-sm leading-relaxed shadow-card placeholder:text-slate-400 focus:outline-none focus:ring-2', mode === 'nota' ? 'border-amber-200 bg-amber-50/60 focus:border-amber-400 focus:ring-amber-300/30' : mode === 'cliente' ? 'border-violet-200 bg-violet-50/50 focus:border-violet-400 focus:ring-violet-300/30' : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500/20')}
          />
          <Button variant={mode === 'responder' ? 'primary' : 'brand'} onClick={send} disabled={!text.trim() && !files.length} icon={<Send className="h-4 w-4" />} aria-label="Enviar">
            <span className="hidden sm:inline">{mode === 'nota' ? 'Guardar' : 'Enviar'}</span>
          </Button>
        </div>
        {mode === 'responder' ? <p className="mt-1.5 text-[0.6875rem] text-slate-400">Envío simulado: en modo demostración ningún mensaje sale a WhatsApp, Messenger ni la web.</p> : null}
      </div>
    </div>
  );
}

function Bubble({ message: m, state, conversation }: { message: Message; state: CrmState; conversation: Conversation }) {
  const time = m.at.slice(11, 16);

  if (m.from === 'system') {
    return (
      <div className="flex justify-center">
        <span className="max-w-[90%] rounded-full bg-slate-200/70 px-3 py-1 text-center text-[0.6875rem] font-medium text-slate-600">{m.text}</span>
      </div>
    );
  }

  if (m.from === 'note') {
    const author = state.members.find((x) => x.id === m.authorId);
    return (
      <div className="mx-auto max-w-[88%] rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
        <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-amber-800">
          <StickyNote className="h-3 w-3" aria-hidden /> Nota interna · {author ? memberShort(author) : 'Equipo'} · {time}
        </p>
        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">{m.text}</p>
      </div>
    );
  }

  const mine = m.from !== 'contact';
  const author = m.from === 'agent' ? state.members.find((x) => x.id === m.authorId) : null;
  const appointment = m.card?.kind === 'booking' ? state.appointments.find((a) => a.id === (m.card as { appointmentId: string }).appointmentId) : null;
  const lawyer = appointment ? state.members.find((x) => x.id === appointment.lawyerId) : null;

  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[85%] sm:max-w-[75%]')}>
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-card',
            m.from === 'contact' && 'rounded-bl-md bg-white text-navy-900 ring-1 ring-slate-200',
            m.from === 'assistant' && 'rounded-br-md bg-violet-100 text-violet-950',
            m.from === 'agent' && 'rounded-br-md bg-navy-800 text-white',
          )}
        >
          {m.from !== 'contact' ? (
            <p className={cn('mb-0.5 flex items-center gap-1 text-[0.6875rem] font-semibold', m.from === 'assistant' ? 'text-violet-700' : 'text-navy-200')}>
              {m.from === 'assistant' ? <Bot className="h-3 w-3" aria-hidden /> : <UserRound className="h-3 w-3" aria-hidden />}
              {m.from === 'assistant' ? 'Asistente HAROWI' : author ? memberFull(author) : 'Equipo'}
            </p>
          ) : null}
          <p className="whitespace-pre-line">{m.text}</p>
          {m.attachments?.length ? (
            <ul className="mt-1.5 space-y-1">
              {m.attachments.map((a, i) => (
                <li key={i} className="flex items-center gap-1.5 rounded-md bg-white/15 px-2 py-1 text-xs">
                  <FileText className="h-3.5 w-3.5" aria-hidden /> {a.name} · {formatBytes(a.sizeKb)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {appointment ? (
          <div className="mt-1.5 overflow-hidden rounded-xl border border-brand-200 bg-white shadow-card">
            <div className="flex items-center gap-2 border-b border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800">
              <CalendarCheck2 className="h-3.5 w-3.5" aria-hidden /> Cita registrada en la agenda
            </div>
            <div className="space-y-1 px-3 py-2.5 text-[0.8125rem] text-slate-700">
              <p className="font-semibold text-navy-900">{APPOINTMENT_KIND_BY_ID[appointment.kind].label}</p>
              <p>{formatDate(appointment.date, 'weekday').replace(/^./, (x) => x.toUpperCase())} · {formatTime12(appointment.time)} ({relativeDay(appointment.date).toLowerCase()})</p>
              <p>{lawyer ? memberFull(lawyer) : '—'} · {appointment.modality === 'virtual' ? 'Virtual' : 'Presencial'}</p>
              <div className="flex items-center justify-between pt-1">
                <AppointmentStatusBadge status={appointment.status} />
                <Link href="/crm/agenda" className="text-xs font-medium text-brand-700 hover:underline">Ver en la agenda</Link>
              </div>
            </div>
          </div>
        ) : null}

        {m.card?.kind === 'handoff' && conversation.summary ? (
          <div className="mt-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[0.8125rem] text-amber-950">
            <p className="flex items-center gap-1.5 text-xs font-semibold"><Forward className="h-3.5 w-3.5" aria-hidden /> Derivada a un abogado</p>
            <p className="mt-1 leading-snug text-amber-900/90">El resumen para el abogado está en el panel de información.</p>
          </div>
        ) : null}

        <p className={cn('mt-0.5 px-1 text-[0.6875rem] text-slate-400', mine && 'text-right')}>{time}</p>
      </div>
    </div>
  );
}
