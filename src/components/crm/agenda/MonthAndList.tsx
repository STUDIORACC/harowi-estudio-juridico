'use client';

import { useMemo } from 'react';
import { CalendarX2, Video } from 'lucide-react';
import { APPOINTMENT_KIND_BY_ID, AREAS } from '@/crm/constants';
import { WEEKDAYS_SHORT, formatDate, monthMatrix, relativeDay, todayISO } from '@/crm/lib/dates';
import { memberShort } from '@/crm/lib/people';
import { serviceName } from '@/crm/knowledge/services';
import { appointmentPersonName, sortAppointments } from '@/crm/store/selectors';
import type { Appointment, CrmState } from '@/crm/types';
import { cn } from '@/lib/utils';
import { AppointmentStatusBadge } from '../ui/Chips';
import { EmptyState } from '../ui/Layout';
import { STATUS_STYLE } from './TimeGrid';

export function MonthGrid({ state, anchor, appointments, onOpen, onDay }: { state: CrmState; anchor: string; appointments: Appointment[]; onOpen: (id: string) => void; onDay: (date: string) => void }) {
  const today = todayISO();
  const weeks = useMemo(() => monthMatrix(anchor), [anchor]);
  const monthPrefix = anchor.slice(0, 7);
  const byDay = useMemo(() => {
    const m = new Map<string, Appointment[]>();
    for (const a of appointments) m.set(a.date, [...(m.get(a.date) ?? []), a]);
    m.forEach((v, k) => m.set(k, sortAppointments(v)));
    return m;
  }, [appointments]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-500">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => (
          <div key={d} className="py-2">{WEEKDAYS_SHORT[d]}</div>
        ))}
      </div>
      <div className="crm-scroll grid min-h-0 flex-1 overflow-y-auto" style={{ gridTemplateRows: `repeat(${weeks.length}, minmax(6.5rem, 1fr))` }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((date) => {
              const inMonth = date.startsWith(monthPrefix);
              const list = byDay.get(date) ?? [];
              const isToday = date === today;
              return (
                <div key={date} className={cn('min-w-0 border-b border-l border-slate-100 p-1.5 first:border-l-0', !inMonth && 'bg-slate-50/60')}>
                  <button type="button" onClick={() => onDay(date)} aria-label={`Ver el día ${formatDate(date, 'weekday')}`} className={cn('mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold hover:bg-slate-100', isToday ? 'bg-brand-600 text-white hover:bg-brand-700' : inMonth ? 'text-navy-900' : 'text-slate-400')}>
                    {Number(date.slice(8, 10))}
                  </button>
                  <div className="space-y-0.5">
                    {list.slice(0, 3).map((a) => (
                      <button key={a.id} type="button" onClick={() => onOpen(a.id)} className={cn('flex w-full items-center gap-1 truncate rounded border-l-2 px-1 py-0.5 text-left text-[0.6875rem] leading-tight', STATUS_STYLE[a.status])} title={`${a.time} · ${appointmentPersonName(state, a)}`}>
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: AREAS[a.area].color }} aria-hidden />
                        <span className="truncate font-medium">{a.time} {appointmentPersonName(state, a)}</span>
                      </button>
                    ))}
                    {list.length > 3 ? (
                      <button type="button" onClick={() => onDay(date)} className="px-1 text-[0.6875rem] font-medium text-brand-700 hover:underline">
                        +{list.length - 3} más
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AppointmentList({ state, appointments, onOpen }: { state: CrmState; appointments: Appointment[]; onOpen: (id: string) => void }) {
  const today = todayISO();
  const groups = useMemo(() => {
    const m = new Map<string, Appointment[]>();
    for (const a of sortAppointments(appointments)) m.set(a.date, [...(m.get(a.date) ?? []), a]);
    return [...m.entries()];
  }, [appointments]);

  if (!groups.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <EmptyState title="No hay citas en este periodo" description="Cambie el rango o los filtros, o agende una nueva cita." icon={<CalendarX2 className="h-5 w-5" />} />
      </div>
    );
  }

  return (
    <div className="crm-scroll min-h-0 flex-1 space-y-4 overflow-y-auto pb-2">
      {groups.map(([date, list]) => (
        <section key={date} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <header className={cn('flex items-center gap-2 border-b border-slate-100 px-4 py-2 text-sm font-semibold', date === today ? 'bg-brand-50 text-brand-800' : 'bg-slate-50/70 text-navy-900')}>
            {formatDate(date, 'weekday').replace(/^./, (c) => c.toUpperCase())}
            <span className="text-xs font-normal text-slate-500">· {relativeDay(date, today)}</span>
            <span className="ml-auto text-xs font-normal text-slate-500">{list.length} {list.length === 1 ? 'cita' : 'citas'}</span>
          </header>
          <ul className="divide-y divide-slate-100">
            {list.map((a) => {
              const lawyer = state.members.find((m) => m.id === a.lawyerId);
              return (
                <li key={a.id}>
                  <button type="button" onClick={() => onOpen(a.id)} className="grid w-full grid-cols-[4.5rem_1fr_auto] items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 sm:grid-cols-[4.5rem_1fr_12rem_auto]">
                    <span className="text-sm font-semibold tabular-nums text-navy-900">{a.time}<span className="block text-xs font-normal text-slate-400">{a.durationMin} min</span></span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-navy-900">{appointmentPersonName(state, a)}</span>
                      <span className="flex items-center gap-1.5 truncate text-xs text-slate-500">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: AREAS[a.area].color }} aria-hidden />
                        {APPOINTMENT_KIND_BY_ID[a.kind].label}{a.serviceSlug ? ` · ${serviceName(a.serviceSlug)}` : ''}
                        {a.modality === 'virtual' ? <Video className="h-3 w-3 shrink-0" aria-label="Virtual" /> : null}
                      </span>
                    </span>
                    <span className="hidden truncate text-[0.8125rem] text-slate-600 sm:block">{lawyer ? memberShort(lawyer) : '—'}</span>
                    <AppointmentStatusBadge status={a.status} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
