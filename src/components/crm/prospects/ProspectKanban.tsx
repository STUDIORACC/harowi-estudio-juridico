'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowRightLeft, CalendarClock, Eye } from 'lucide-react';
import { STAGES } from '@/crm/constants';
import { diffDays, formatDate, todayISO } from '@/crm/lib/dates';
import { memberShort } from '@/crm/lib/people';
import { serviceName } from '@/crm/knowledge/services';
import type { Member, Prospect, StageId } from '@/crm/types';
import { cn } from '@/lib/utils';
import { ToneDot } from '../ui/Badge';
import { AreaBadge, ChannelIcon, PriorityBadge } from '../ui/Chips';
import { Avatar } from '../ui/Layout';
import { ActionMenu } from '../ui/Overlay';

/** Pipeline comercial: arrastre las tarjetas entre columnas o use el menú «Mover a…». */
export function ProspectKanban({
  prospects,
  members,
  duplicateIds,
  onOpen,
  onMove,
}: {
  prospects: Prospect[];
  members: Member[];
  duplicateIds: Set<string>;
  onOpen: (id: string) => void;
  onMove: (id: string, stage: StageId) => void;
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<StageId | null>(null);
  const today = todayISO();

  return (
    <div className="crm-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8" role="list" aria-label="Pipeline de prospectos">
      {STAGES.map((stage) => {
        const items = prospects.filter((p) => p.stage === stage.id);
        const isOver = over === stage.id && dragging !== null;
        return (
          <section
            key={stage.id}
            role="listitem"
            aria-label={`${stage.label}: ${items.length}`}
            onDragOver={(e) => {
              if (!dragging) return;
              e.preventDefault();
              setOver(stage.id);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver((cur) => (cur === stage.id ? null : cur));
            }}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData('text/plain') || dragging;
              setOver(null);
              setDragging(null);
              const p = prospects.find((x) => x.id === id);
              if (p && p.stage !== stage.id) onMove(p.id, stage.id);
            }}
            className={cn('flex w-[17.5rem] shrink-0 flex-col rounded-xl border bg-slate-100/60 transition-colors', isOver ? 'border-brand-400 bg-brand-50/60 ring-2 ring-brand-200' : 'border-slate-200/80')}
          >
            <header className="flex items-center gap-2 px-3 pb-2 pt-3">
              <ToneDot tone={stage.tone} />
              <h3 className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold text-navy-900" title={stage.description}>
                {stage.label}
              </h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600 ring-1 ring-slate-200">{items.length}</span>
            </header>
            <div className="crm-scroll flex max-h-[calc(100dvh-20rem)] min-h-24 flex-col gap-2 overflow-y-auto px-2 pb-2">
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 px-3 py-5 text-center text-xs text-slate-400">{dragging ? 'Suelte aquí' : 'Sin prospectos'}</p>
              ) : (
                items.map((p) => {
                  const lawyer = members.find((m) => m.id === p.lawyerId);
                  const late = p.nextActionDate && diffDays(p.nextActionDate, today) < 0 && p.stage !== 'contratado' && p.stage !== 'cerrado';
                  return (
                    <article
                      key={p.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', p.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDragging(p.id);
                      }}
                      onDragEnd={() => {
                        setDragging(null);
                        setOver(null);
                      }}
                      className={cn('group cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-card transition-shadow hover:shadow-pop active:cursor-grabbing', dragging === p.id && 'opacity-40')}
                    >
                      <div className="flex items-start gap-2">
                        <button type="button" onClick={() => onOpen(p.id)} className="min-w-0 flex-1 rounded text-left">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-navy-900">{p.name}</span>
                            {duplicateIds.has(p.id) ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="Posible duplicado" /> : null}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-slate-500">{p.serviceSlug ? serviceName(p.serviceSlug) : 'Servicio por definir'}</span>
                        </button>
                        <ActionMenu
                          label={`Acciones de ${p.name}`}
                          items={[
                            { label: 'Abrir ficha', icon: <Eye className="h-4 w-4" />, onClick: () => onOpen(p.id) },
                            ...STAGES.filter((s) => s.id !== p.stage).map((s, i) => ({ label: `Mover a ${s.label}`, icon: <ArrowRightLeft className="h-4 w-4" />, onClick: () => onMove(p.id, s.id), divider: i === 0 })),
                          ]}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <AreaBadge area={p.area} />
                        <ChannelIcon channel={p.channel} />
                        {p.priority === 'alta' || p.priority === 'urgente' ? <PriorityBadge priority={p.priority} /> : null}
                      </div>
                      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                        <span className={cn('flex min-w-0 items-center gap-1 text-xs', late ? 'font-medium text-red-600' : 'text-slate-500')}>
                          <CalendarClock className="h-3 w-3 shrink-0" aria-hidden />
                          <span className="truncate">{p.nextActionDate ? formatDate(p.nextActionDate, 'medium').replace(/ \d{4}$/, '') : 'Sin fecha'}</span>
                        </span>
                        {lawyer ? <Avatar name={lawyer.name} size="xs" tone="navy" className="shrink-0" /> : <span className="text-[0.6875rem] text-slate-400">Sin asignar</span>}
                      </div>
                      {lawyer ? <span className="sr-only">Asignado a {memberShort(lawyer)}</span> : null}
                    </article>
                  );
                })
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
