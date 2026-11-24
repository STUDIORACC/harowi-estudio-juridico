'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { WhatsappIcon } from '@/components/whatsapp/WhatsappIcon';
import { addDays, addMonths, formatDate, MONTHS, startOfWeek, todayISO } from '@/crm/lib/dates';
import { memberShort } from '@/crm/lib/people';
import { lawyersOf, sortAppointments } from '@/crm/store/selectors';
import { useCrm } from '@/crm/store/store';
import type { Appointment } from '@/crm/types';
import { cn } from '@/lib/utils';
import { useDetailId } from '../hooks';
import { Button, IconButton } from '../ui/Button';
import { Checkbox, Select } from '../ui/Form';
import { PageHeader, Segmented } from '../ui/Layout';
import { Page } from '../ui/Page';
import { AppointmentDetail } from './AppointmentDetail';
import { AppointmentModal } from './AppointmentModal';
import { AvailabilityCard } from './AvailabilityCard';
import { AppointmentList, MonthGrid } from './MonthAndList';
import { DayHeader, LawyerHeader, TimeGrid, type GridColumn } from './TimeGrid';
import { WhatsappBookingModal } from './WhatsappBookingModal';

type View = 'dia' | 'semana' | 'mes' | 'lista';

export function AgendaPage() {
  const state = useCrm();
  const today = todayISO();
  const [view, setView] = useState<View>('semana');
  const [anchor, setAnchor] = useState(today);
  const [lawyer, setLawyer] = useState('');
  const [showCancelled, setShowCancelled] = useState(false);
  const [includePast, setIncludePast] = useState(false);
  const [openId, setOpenId] = useDetailId();
  const [form, setForm] = useState<{ open: boolean; appointment: Appointment | null; defaults?: Partial<Parameters<typeof AppointmentModal>[0]['defaults'] & object> }>({ open: false, appointment: null });
  const [waOpen, setWaOpen] = useState(false);
  const lawyers = useMemo(() => lawyersOf(state.members), [state.members]);

  const visible = useMemo(
    () => state.appointments.filter((a) => (!lawyer || a.lawyerId === lawyer) && (showCancelled || a.status !== 'cancelada')),
    [state.appointments, lawyer, showCancelled],
  );

  const weekStart = startOfWeek(anchor);
  const step = (dir: 1 | -1) => {
    if (view === 'dia') setAnchor(addDays(anchor, dir));
    else if (view === 'semana') setAnchor(addDays(anchor, 7 * dir));
    else if (view === 'mes') setAnchor(addMonths(anchor, dir));
  };

  const label = (() => {
    if (view === 'dia') return formatDate(anchor, 'weekday').replace(/^./, (c) => c.toUpperCase()) + ` de ${anchor.slice(0, 4)}`;
    if (view === 'semana') {
      const end = addDays(weekStart, 6);
      const sm = MONTHS[Number(weekStart.slice(5, 7)) - 1].slice(0, 3);
      const em = MONTHS[Number(end.slice(5, 7)) - 1].slice(0, 3);
      return `${Number(weekStart.slice(8))} ${sm === em ? '' : sm + ' '}– ${Number(end.slice(8))} ${em} ${end.slice(0, 4)}`;
    }
    if (view === 'mes') return `${MONTHS[Number(anchor.slice(5, 7)) - 1].replace(/^./, (c) => c.toUpperCase())} ${anchor.slice(0, 4)}`;
    return includePast ? 'Todas las citas' : 'Próximas citas';
  })();

  const dayColumns: GridColumn[] = useMemo(() => {
    const members = lawyer ? lawyers.filter((l) => l.id === lawyer) : lawyers;
    return members.map((l) => ({ key: l.id, date: anchor, lawyer: l, header: <LawyerHeader lawyer={l} /> }));
  }, [anchor, lawyer, lawyers]);

  const weekColumns: GridColumn[] = useMemo(() => {
    const single = lawyer ? lawyers.find((l) => l.id === lawyer) : undefined;
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return { key: date, date, lawyer: single, header: <DayHeader date={date} today={today} /> };
    });
  }, [weekStart, lawyer, lawyers, today]);

  const monthApps = useMemo(() => visible.filter((a) => a.date.startsWith(anchor.slice(0, 7))), [visible, anchor]);
  const listApps = useMemo(() => visible.filter((a) => includePast || a.date >= today), [visible, includePast, today]);

  const todayCount = state.appointments.filter((a) => a.date === today && a.status !== 'cancelada').length;
  const toConfirm = state.appointments.filter((a) => a.status === 'pendiente' && a.date >= today).length;
  const weekCount = state.appointments.filter((a) => a.date >= weekStart && a.date <= addDays(weekStart, 6) && a.status !== 'cancelada').length;

  const create = (date: string, time: string, lawyerId?: string) => setForm({ open: true, appointment: null, defaults: { date, time, ...(lawyerId ? { lawyerId } : {}) } });

  return (
    <Page className="flex flex-col">
      <PageHeader
        title="Agenda"
        description="Citas, consultas y audiencias de todo el estudio. Solo se ofrecen horarios libres: no se pueden duplicar reservas."
        actions={
          <>
            <Button icon={<WhatsappIcon className="h-4 w-4 text-[#008300]" />} onClick={() => setWaOpen(true)}>
              Simular reserva por WhatsApp
            </Button>
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setForm({ open: true, appointment: null })}>
              Nueva cita
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-card sm:p-3">
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={() => setAnchor(today)} disabled={view !== 'lista' && anchor === today}>Hoy</Button>
          <IconButton label="Anterior" size="sm" onClick={() => step(-1)} disabled={view === 'lista'}><ChevronLeft className="h-4 w-4" /></IconButton>
          <IconButton label="Siguiente" size="sm" onClick={() => step(1)} disabled={view === 'lista'}><ChevronRight className="h-4 w-4" /></IconButton>
        </div>
        <h2 className="min-w-[10rem] px-1 text-[0.9375rem] font-semibold capitalize text-navy-900" aria-live="polite">{label}</h2>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="w-[11rem]">
            <Select aria-label="Filtrar por abogado" value={lawyer} onChange={(e) => setLawyer(e.target.value)}>
              <option value="">Todos los abogados</option>
              {lawyers.map((l) => (
                <option key={l.id} value={l.id}>{memberShort(l)}</option>
              ))}
            </Select>
          </div>
          <Segmented<View>
            value={view}
            onChange={setView}
            items={[
              { id: 'dia', label: 'Día' },
              { id: 'semana', label: 'Semana' },
              { id: 'mes', label: 'Mes' },
              { id: 'lista', label: 'Lista' },
            ]}
          />
        </div>
        <div className="flex w-full flex-wrap items-center gap-x-5 gap-y-1 border-t border-slate-100 pt-2 text-[0.8125rem] text-slate-500">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" aria-hidden /> Hoy: <strong className="text-navy-900">{todayCount}</strong></span>
          <span>Esta semana: <strong className="text-navy-900">{weekCount}</strong></span>
          <span>Por confirmar: <strong className={cn(toConfirm ? 'text-amber-700' : 'text-navy-900')}>{toConfirm}</strong></span>
          <span className="ml-auto flex items-center gap-4">
            {view === 'lista' ? <Checkbox checked={includePast} onChange={setIncludePast} label="Incluir pasadas" /> : null}
            <Checkbox checked={showCancelled} onChange={setShowCancelled} label="Mostrar canceladas" />
          </span>
        </div>
      </div>

      <div className={cn('flex min-h-0 flex-col', view === 'lista' ? '' : 'h-[calc(100dvh-19.5rem)] min-h-[30rem]')}>
        {view === 'dia' ? <TimeGrid state={state} columns={dayColumns} appointments={visible} onOpen={setOpenId} onCreate={create} showLawyer={false} /> : null}
        {view === 'semana' ? <TimeGrid state={state} columns={weekColumns} appointments={visible} onOpen={setOpenId} onCreate={create} showLawyer={!lawyer} /> : null}
        {view === 'mes' ? <MonthGrid state={state} anchor={anchor} appointments={monthApps} onOpen={setOpenId} onDay={(d) => { setAnchor(d); setView('dia'); }} /> : null}
        {view === 'lista' ? <AppointmentList state={state} appointments={sortAppointments(listApps)} onOpen={setOpenId} /> : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="font-medium text-slate-600">Estados:</span>
        {[['Pendiente', 'bg-amber-400'], ['Confirmada', 'bg-brand-500'], ['Atendida', 'bg-emerald-500'], ['No asistió', 'bg-red-400'], ['Cancelada', 'bg-slate-300']].map(([t, c]) => (
          <span key={t} className="inline-flex items-center gap-1.5"><span className={cn('h-2.5 w-2.5 rounded-sm', c)} aria-hidden />{t}</span>
        ))}
        <span className="ml-auto">Zonas rayadas: fuera de la disponibilidad del abogado.</span>
      </div>

      <AvailabilityCard />

      <AppointmentDetail appointmentId={openId && state.appointments.some((a) => a.id === openId) ? openId : null} onClose={() => setOpenId(null)} onEdit={(a) => setForm({ open: true, appointment: a })} />
      <AppointmentModal open={form.open} appointment={form.appointment} defaults={form.defaults} onClose={() => setForm({ open: false, appointment: null })} />
      <WhatsappBookingModal open={waOpen} onClose={() => setWaOpen(false)} />
    </Page>
  );
}
