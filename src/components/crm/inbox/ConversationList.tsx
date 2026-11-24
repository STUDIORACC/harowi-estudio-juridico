'use client';

import { useMemo, useState } from 'react';
import { Bot, Clock, MessagesSquare, UserRound } from 'lucide-react';
import { CHANNEL_LIST } from '@/crm/constants';
import { formatMessageStamp } from '@/crm/lib/dates';
import { normalize } from '@/crm/lib/text';
import { isUnattended, lastMessage } from '@/crm/store/selectors';
import type { ChannelId, Conversation, CrmState } from '@/crm/types';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/Badge';
import { ChannelIcon, ConversationStatusBadge } from '../ui/Chips';
import { SearchInput } from '../ui/Form';
import { Avatar, EmptyState } from '../ui/Layout';

type StatusFilter = 'todas' | 'nuevo' | 'ia' | 'abogado' | 'urgente' | 'finalizado' | 'pendiente';

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'nuevo', label: 'Nuevo' },
  { id: 'ia', label: 'IA atendiendo' },
  { id: 'abogado', label: 'Requiere abogado' },
  { id: 'urgente', label: 'Urgente' },
  { id: 'finalizado', label: 'Finalizado' },
  { id: 'pendiente', label: 'Pendientes' },
];

export function matchesStatus(c: Conversation, f: StatusFilter) {
  if (f === 'todas') return true;
  if (f === 'urgente') return c.priority === 'urgente';
  if (f === 'pendiente') return c.pending;
  return c.status === f;
}

export function ConversationList({ state, selectedId, onSelect }: { state: CrmState; selectedId: string | null; onSelect: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [channel, setChannel] = useState<ChannelId | 'todos'>('todos');
  const [status, setStatus] = useState<StatusFilter>('todas');

  const counts = useMemo(() => {
    const out: Record<StatusFilter, number> = { todas: state.conversations.length, nuevo: 0, ia: 0, abogado: 0, urgente: 0, finalizado: 0, pendiente: 0 };
    for (const c of state.conversations) {
      out[c.status] += 1;
      if (c.priority === 'urgente') out.urgente += 1;
      if (c.pending) out.pendiente += 1;
    }
    return out;
  }, [state.conversations]);

  const list = useMemo(() => {
    const nq = normalize(q);
    return state.conversations
      .filter((c) => (channel === 'todos' || c.channel === channel) && matchesStatus(c, status) && (!nq || normalize(`${c.contactName} ${c.contactHandle} ${c.messages.map((m) => m.text).join(' ')}`).includes(nq)))
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }, [state.conversations, q, channel, status]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="space-y-2.5 border-b border-slate-200 p-3">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar conversaciones…" />
        <div role="group" aria-label="Filtrar por canal" className="flex gap-1">
          <button type="button" aria-pressed={channel === 'todos'} onClick={() => setChannel('todos')} className={cn('flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors', channel === 'todos' ? 'bg-navy-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
            Todos
          </button>
          {CHANNEL_LIST.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={channel === c.id}
              onClick={() => setChannel(c.id)}
              title={c.name}
              className={cn('flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors', channel === c.id ? 'bg-navy-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
            >
              <ChannelIcon channel={c.id} className={channel === c.id ? 'brightness-200' : ''} />
              <span className="hidden min-[400px]:inline">{c.id === 'facebook' ? 'Facebook' : c.name}</span>
            </button>
          ))}
        </div>
        <div className="crm-scroll -mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5" role="group" aria-label="Filtrar por etiqueta">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={status === f.id}
              onClick={() => setStatus(f.id)}
              className={cn('shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors', status === f.id ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}
            >
              {f.label} <span className="ml-0.5 tabular-nums text-slate-400">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      </div>

      <ul className="crm-scroll min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto" aria-label="Conversaciones">
        {list.length === 0 ? (
          <li>
            <EmptyState title="Sin conversaciones" description="Ninguna conversación coincide con los filtros." icon={<MessagesSquare className="h-5 w-5" />} />
          </li>
        ) : (
          list.map((c) => {
            const last = lastMessage(c);
            const preview = last ? `${last.from === 'agent' ? 'Usted: ' : last.from === 'assistant' ? 'Asistente: ' : last.from === 'note' ? 'Nota: ' : ''}${last.text}` : 'Sin mensajes';
            const active = c.id === selectedId;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-current={active ? 'true' : undefined}
                  className={cn('relative flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-slate-50', active && 'bg-brand-50/70 hover:bg-brand-50/70')}
                >
                  {active ? <span className="absolute inset-y-0 left-0 w-0.5 bg-brand-600" aria-hidden /> : null}
                  <span className="relative shrink-0">
                    <Avatar name={c.contactName} size="md" tone={c.clientId ? 'green' : 'slate'} />
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
                      <ChannelIcon channel={c.channel} className="h-2.5 w-2.5" />
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={cn('truncate text-sm', c.unread ? 'font-semibold text-navy-900' : 'font-medium text-navy-800')}>{c.contactName}</span>
                      <span className="ml-auto shrink-0 text-[0.6875rem] text-slate-400">{formatMessageStamp(c.lastMessageAt)}</span>
                    </span>
                    <span className={cn('mt-0.5 line-clamp-1 text-[0.8125rem]', c.unread ? 'text-navy-800' : 'text-slate-500')}>{preview}</span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <ConversationStatusBadge status={c.status} />
                      {c.priority === 'urgente' ? <Badge tone="red" dot>Urgente</Badge> : c.priority === 'alta' ? <Badge tone="amber">Prioridad alta</Badge> : null}
                      {c.pending ? <Badge tone="slate"><Clock className="h-3 w-3" aria-hidden />Pendiente</Badge> : null}
                      {c.mode === 'manual' ? <UserRound className="h-3.5 w-3.5 text-slate-400" aria-label="Atención manual" /> : <Bot className="h-3.5 w-3.5 text-violet-400" aria-label="Atención automática" />}
                      {isUnattended(c) ? <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[0.6875rem] font-semibold text-white" aria-label={`${c.unread} sin leer`}>{c.unread || '·'}</span> : c.unread ? <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[0.6875rem] font-semibold text-white">{c.unread}</span> : null}
                    </span>
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
