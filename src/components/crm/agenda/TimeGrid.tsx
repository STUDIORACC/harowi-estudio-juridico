'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Gavel, Video } from 'lucide-react';
import { APPOINTMENT_KIND_BY_ID, AREAS } from '@/crm/constants';
import { formatDayChip, minutesToTime, nowLocal, timeToMinutes, todayISO, weekdayOf } from '@/crm/lib/dates';
import { memberShort } from '@/crm/lib/people';
import { appointmentPersonName } from '@/crm/store/selectors';
import type { Appointment, AppointmentStatus, CrmState, Member } from '@/crm/types';
import { cn } from '@/lib/utils';
import { Avatar } from '../ui/Layout';

const START_H = 8;
const END_H = 20;
const HOUR_PX = 60;
const GRID_H = (END_H - START_H) * HOUR_PX;

export const STATUS_STYLE: Record<AppointmentStatus, string> = {
  pendiente: 'border-amber-400 bg-amber-50 text-amber-950 hover:bg-amber-100',
  confirmada: 'border-brand-500 bg-brand-50 text-navy-900 hover:bg-brand-100',
  atendida: 'border-emerald-500 bg-emerald-50 text-emerald-950 hover:bg-emerald-100',
  cancelada: 'border-slate-300 bg-slate-100 text-slate-500 line-through hover:bg-slate-200',
  no_asistio: 'border-red-400 bg-red-50 text-red-900 hover:bg-red-100',
};

export interface GridColumn {
  key: string;
  date: string;
  /** Si la columna pertenece a un solo abogado, se sombrea su disponibilidad. */
  lawyer?: Member;
  header: React.ReactNode;
}

interface Placed {
  a: Appointment;
  lane: number;
  lanes: number;
}

/** Reparte en carriles las citas que se solapan para que no se tapen entre sí. */
function place(list: Appointment[]): Placed[] {
  const sorted = [...list].sort((x, y) => x.time.localeCompare(y.time) || y.durationMin - x.durationMin);
  const out: Placed[] = [];
  let cluster: Placed[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((c) => c.lane + 1));
    cluster.forEach((c) => (c.lanes = lanes));
    out.push(...cluster);
    cluster = [];
  };
  for (const a of sorted) {
    const start = timeToMinutes(a.time);
    if (start >= clusterEnd && cluster.length) flush();
    const used = new Set(cluster.filter((c) => timeToMinutes(c.a.time) + c.a.durationMin > start).map((c) => c.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    cluster.push({ a, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, start + a.durationMin);
  }
  if (cluster.length) flush();
  return out;
}

export function TimeGrid({
  state,
  columns,
  appointments,
  onOpen,
  onCreate,
  showLawyer,
}: {
  state: CrmState;
  columns: GridColumn[];
  appointments: Appointment[];
  onOpen: (id: string) => void;
  onCreate: (date: string, time: string, lawyerId?: string) => void;
  showLawyer: boolean;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const today = todayISO();
  const now = nowLocal();
  const nowMin = timeToMinutes(now.slice(11, 16));

  useEffect(() => {
    // Se desplaza hasta las 8:00 o la hora actual si es hoy.
    if (!scroller.current) return;
    const target = columns.some((c) => c.date === today) ? Math.max(0, ((nowMin - START_H * 60) / 60) * HOUR_PX - 120) : 0;
    scroller.current.scrollTop = target;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns.map((c) => c.date).join()]);

  const byColumn = useMemo(
    () =>
      columns.map((col) => ({
        col,
        items: place(appointments.filter((a) => a.date === col.date && (!col.lawyer || a.lawyerId === col.lawyer.id))),
      })),
    [columns, appointments],
  );

  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex border-b border-slate-200 bg-slate-50/80 pr-[8px]">
        <div className="w-14 shrink-0" />
        {columns.map((c) => (
          <div key={c.key} className={cn('min-w-0 flex-1 border-l border-slate-200 px-2 py-2 text-center', c.date === today && !c.lawyer && 'bg-brand-50/60')}>
            {c.header}
          </div>
        ))}
      </div>
      <div ref={scroller} className="crm-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="relative flex" style={{ height: GRID_H }}>
          <div className="w-14 shrink-0">
            {hours.map((h) => (
              <div key={h} className="relative border-t border-transparent text-right" style={{ height: HOUR_PX }}>
                <span className="absolute -top-2 right-2 text-[0.6875rem] tabular-nums text-slate-400">{String(h).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>
          {byColumn.map(({ col, items }) => {
            const wd = weekdayOf(col.date);
            const rules = col.lawyer ? col.lawyer.availability.filter((r) => r.weekday === wd) : null;
            return (
              <div
                key={col.key}
                className="relative min-w-0 flex-1 cursor-cell border-l border-slate-200"
                onClick={(e) => {
                  if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset.slot) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mins = START_H * 60 + Math.floor(((e.clientY - rect.top) / HOUR_PX) * 60 / 30) * 30;
                  onCreate(col.date, minutesToTime(mins), col.lawyer?.id);
                }}
              >
                {/* Líneas por hora y sombreado de no disponibilidad */}
                {hours.map((h) => (
                  <div key={h} data-slot="1" className="border-t border-slate-100" style={{ height: HOUR_PX }} />
                ))}
                {rules
                  ? (() => {
                      const free = rules.map((r) => [timeToMinutes(r.start), timeToMinutes(r.end)] as const).sort((a, b) => a[0] - b[0]);
                      const blocks: [number, number][] = [];
                      let cursor = START_H * 60;
                      for (const [s, e] of free) {
                        if (s > cursor) blocks.push([cursor, s]);
                        cursor = Math.max(cursor, e);
                      }
                      if (cursor < END_H * 60) blocks.push([cursor, END_H * 60]);
                      if (!free.length) blocks.splice(0, blocks.length, [START_H * 60, END_H * 60]);
                      return blocks.map(([s, e], i) => (
                        <div
                          key={i}
                          aria-hidden
                          className="pointer-events-none absolute inset-x-0 bg-slate-100/80 [background-image:repeating-linear-gradient(135deg,transparent,transparent_6px,rgba(148,163,184,0.18)_6px,rgba(148,163,184,0.18)_7px)]"
                          style={{ top: ((s - START_H * 60) / 60) * HOUR_PX, height: ((e - s) / 60) * HOUR_PX }}
                        />
                      ));
                    })()
                  : null}

                {col.date === today && nowMin >= START_H * 60 && nowMin <= END_H * 60 ? (
                  <div className="pointer-events-none absolute inset-x-0 z-20 flex items-center" style={{ top: ((nowMin - START_H * 60) / 60) * HOUR_PX }} aria-hidden>
                    <span className="-ml-1 h-2 w-2 rounded-full bg-red-500" />
                    <span className="h-px flex-1 bg-red-500" />
                  </div>
                ) : null}

                {items.map(({ a, lane, lanes }) => {
                  const top = ((timeToMinutes(a.time) - START_H * 60) / 60) * HOUR_PX;
                  const height = Math.max(26, (a.durationMin / 60) * HOUR_PX - 2);
                  if (top + height < 0 || top > GRID_H) return null;
                  const lawyer = state.members.find((m) => m.id === a.lawyerId);
                  const hearing = a.kind === 'audiencia';
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(a.id);
                      }}
                      className={cn('absolute z-10 flex flex-col overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-left text-[0.6875rem] leading-tight shadow-card transition-colors', STATUS_STYLE[a.status])}
                      style={{ top: Math.max(0, top), height, left: `calc(${(lane / lanes) * 100}% + 2px)`, width: `calc(${100 / lanes}% - 4px)` }}
                      title={`${a.time} · ${APPOINTMENT_KIND_BY_ID[a.kind].label} · ${appointmentPersonName(state, a)}`}
                    >
                      <span className="flex items-center gap-1 font-semibold">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: AREAS[a.area].color }} aria-hidden />
                        <span className="truncate">{a.time} · {appointmentPersonName(state, a)}</span>
                        {hearing ? <Gavel className="ml-auto h-3 w-3 shrink-0" aria-label="Audiencia" /> : a.modality === 'virtual' ? <Video className="ml-auto h-3 w-3 shrink-0 opacity-70" aria-label="Virtual" /> : null}
                      </span>
                      {height > 38 ? <span className="truncate opacity-80">{APPOINTMENT_KIND_BY_ID[a.kind].label}</span> : null}
                      {height > 52 && showLawyer && lawyer ? <span className="truncate opacity-70">{memberShort(lawyer)}</span> : null}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function DayHeader({ date, today, compact }: { date: string; today: string; compact?: boolean }) {
  const isToday = date === today;
  const chip = formatDayChip(date);
  const [wd, num] = chip.split(' ');
  return (
    <div className="flex flex-col items-center leading-tight">
      <span className={cn('text-[0.6875rem] font-medium uppercase tracking-wide', isToday ? 'text-brand-700' : 'text-slate-500')}>{wd}</span>
      <span className={cn('mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold', isToday ? 'bg-brand-600 text-white' : 'text-navy-900', compact && 'h-6 w-6 text-[0.8125rem]')}>{num}</span>
    </div>
  );
}

export function LawyerHeader({ lawyer }: { lawyer: Member }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Avatar name={lawyer.name} size="xs" tone="navy" />
      <span className="truncate text-[0.8125rem] font-semibold text-navy-900">{memberShort(lawyer)}</span>
    </div>
  );
}
