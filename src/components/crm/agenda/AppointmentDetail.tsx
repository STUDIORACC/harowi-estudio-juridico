'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Ban, CalendarClock, CheckCheck, CheckCircle2, Clock, Pencil, Trash2, UserX, Video } from 'lucide-react';
import { APPOINTMENT_KIND_BY_ID } from '@/crm/constants';
import { formatDate } from '@/crm/lib/dates';
import { memberFull } from '@/crm/lib/people';
import { freeSlots } from '@/crm/lib/scheduling';
import { serviceName } from '@/crm/knowledge/services';
import * as crm from '@/crm/store/actions';
import { appointmentPersonName } from '@/crm/store/selectors';
import { useCrm } from '@/crm/store/store';
import type { Appointment } from '@/crm/types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AppointmentStatusBadge, AreaBadge } from '../ui/Chips';
import { Field, Input, Select } from '../ui/Form';
import { KeyValue } from '../ui/Layout';
import { ConfirmDialog, Modal } from '../ui/Overlay';
import { useToast } from '../ui/Toast';

export function AppointmentDetail({ appointmentId, onClose, onEdit }: { appointmentId: string | null; onClose: () => void; onEdit: (a: Appointment) => void }) {
  const state = useCrm();
  const toast = useToast();
  const [rescheduling, setRescheduling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const a = state.appointments.find((x) => x.id === appointmentId);

  useEffect(() => setRescheduling(false), [appointmentId]);

  if (!a) return null;
  const lawyer = state.members.find((m) => m.id === a.lawyerId);
  const person = appointmentPersonName(state, a);
  const kind = APPOINTMENT_KIND_BY_ID[a.kind];
  const caseFile = a.caseId ? state.cases.find((c) => c.id === a.caseId) : null;
  const open = a.status === 'pendiente' || a.status === 'confirmada';

  const setStatus = (s: Appointment['status'], msg: string) => {
    const r = crm.setAppointmentStatus(a.id, s);
    if (r.ok) toast.success(msg);
    else toast.error('No se pudo actualizar', r.error);
  };

  return (
    <>
      <Modal
        open={!rescheduling}
        onClose={onClose}
        title={kind.label}
        description={`${formatDate(a.date, 'weekday')} · ${a.time} · ${a.durationMin} min`}
        footer={
          <>
            <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} className="mr-auto" onClick={() => setConfirmDelete(true)}>
              Eliminar
            </Button>
            <Button size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => { onClose(); onEdit(a); }}>
              Editar
            </Button>
            {open ? (
              <Button size="sm" icon={<CalendarClock className="h-3.5 w-3.5" />} onClick={() => setRescheduling(true)}>
                Reprogramar
              </Button>
            ) : (
              <Button size="sm" icon={<CalendarClock className="h-3.5 w-3.5" />} onClick={() => setRescheduling(true)}>
                Reagendar
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <AppointmentStatusBadge status={a.status} />
            <Badge tone={a.modality === 'virtual' ? 'violet' : 'navy'}>
              {a.modality === 'virtual' ? <Video className="h-3 w-3" aria-hidden /> : null}
              {a.modality === 'virtual' ? 'Virtual' : 'Presencial'}
            </Badge>
            {a.source === 'asistente' ? <Badge tone="violet">Reservada por el asistente</Badge> : null}
          </div>

          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <KeyValue label={a.clientId ? 'Cliente' : 'Prospecto'}>
              <Link href={a.clientId ? `/crm/clientes?id=${a.clientId}` : `/crm/prospectos?id=${a.prospectId}`} className="font-medium text-brand-700 hover:underline" onClick={onClose}>
                {person}
              </Link>
            </KeyValue>
            <KeyValue label="Abogado">{lawyer ? memberFull(lawyer) : '—'}</KeyValue>
            <KeyValue label="Área y servicio">
              <AreaBadge area={a.area} short={false} />
              <span className="block text-xs text-slate-500">{a.serviceSlug ? serviceName(a.serviceSlug) : 'Servicio por definir'}</span>
            </KeyValue>
            <KeyValue label="Expediente">
              {caseFile ? (
                <Link href={`/crm/expedientes?id=${caseFile.id}`} className="font-medium text-brand-700 hover:underline" onClick={onClose}>
                  {caseFile.code}
                </Link>
              ) : (
                '—'
              )}
            </KeyValue>
            <KeyValue label="Recordatorios">{[a.reminderWhatsapp && 'WhatsApp', a.reminderEmail && 'Correo'].filter(Boolean).join(' y ') || 'Sin recordatorios'}</KeyValue>
            <KeyValue label="Google Calendar">No conectado en esta versión</KeyValue>
            {a.notes ? <KeyValue label="Observaciones" className="sm:col-span-2">{a.notes}</KeyValue> : null}
          </dl>

          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Registrar resultado</p>
            <div className="flex flex-wrap gap-2">
              {a.status === 'pendiente' ? (
                <Button size="sm" variant="soft" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => setStatus('confirmada', 'Cita confirmada')}>
                  Confirmar
                </Button>
              ) : null}
              {open ? (
                <>
                  <Button size="sm" variant="soft" icon={<CheckCheck className="h-4 w-4" />} onClick={() => setStatus('atendida', 'Asistencia registrada: cita atendida')}>
                    Marcar atendida
                  </Button>
                  <Button size="sm" icon={<UserX className="h-4 w-4" />} onClick={() => setStatus('no_asistio', 'Se registró la inasistencia y se creó una tarea de seguimiento')}>
                    No asistió
                  </Button>
                  <Button size="sm" icon={<Ban className="h-4 w-4" />} onClick={() => setStatus('cancelada', 'Cita cancelada: el horario quedó libre')}>
                    Cancelar cita
                  </Button>
                </>
              ) : (
                <Button size="sm" icon={<Clock className="h-4 w-4" />} onClick={() => setStatus('pendiente', 'Cita reabierta como pendiente')}>
                  Reabrir como pendiente
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <RescheduleModal open={rescheduling} appointment={a} onClose={() => setRescheduling(false)} onDone={onClose} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Eliminar cita"
        description="La cita se quitará de la agenda. Para conservar el registro, use «Cancelar cita»."
        confirmLabel="Eliminar"
        onConfirm={() => {
          crm.deleteAppointment(a.id);
          toast.success('Cita eliminada');
          onClose();
        }}
      />
    </>
  );
}

function RescheduleModal({ open, appointment, onClose, onDone }: { open: boolean; appointment: Appointment; onClose: () => void; onDone: () => void }) {
  const state = useCrm();
  const toast = useToast();
  const [date, setDate] = useState(appointment.date);
  const [time, setTime] = useState('');
  const [lawyerId, setLawyerId] = useState(appointment.lawyerId);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setDate(appointment.date);
    setTime('');
    setLawyerId(appointment.lawyerId);
    setError('');
  }, [open, appointment]);

  const lawyers = state.members.filter((m) => m.kind === 'abogado');
  const member = state.members.find((m) => m.id === lawyerId);
  const hearing = appointment.kind === 'audiencia';
  const slots = useMemo(() => (member ? freeSlots({ member, date, appointments: state.appointments, durationMin: appointment.durationMin, ignoreId: appointment.id }) : []), [member, date, state.appointments, appointment]);

  const save = () => {
    const r = crm.rescheduleAppointment(appointment.id, { date, time, lawyerId });
    if (!r.ok) return setError(r.error);
    toast.success('Cita reprogramada', `${formatDate(date, 'weekday')} a las ${time}`);
    onClose();
    onDone();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Reprogramar cita"
      description={`Actual: ${formatDate(appointment.date, 'weekday')} a las ${appointment.time}.`}
      footer={
        <>
          <Button onClick={onClose}>Volver</Button>
          <Button variant="primary" onClick={save} disabled={!time}>
            Reprogramar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {!hearing ? (
          <Field label="Abogado">
            {(id) => (
              <Select id={id} value={lawyerId} onChange={(e) => { setLawyerId(e.target.value); setTime(''); }}>
                {lawyers.map((l) => (
                  <option key={l.id} value={l.id}>{memberFull(l)}</option>
                ))}
              </Select>
            )}
          </Field>
        ) : null}
        <Field label="Nueva fecha" required>
          {(id) => <Input id={id} type="date" value={date} onChange={(e) => { setDate(e.target.value); setTime(''); }} />}
        </Field>
        <Field label="Nueva hora" required error={error || undefined}>
          {(id) =>
            hearing ? (
              <Input id={id} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            ) : (
              <Select id={id} value={time} onChange={(e) => setTime(e.target.value)} disabled={!slots.length}>
                <option value="">{slots.length ? 'Seleccione una hora…' : 'Sin horarios libres ese día'}</option>
                {slots.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            )
          }
        </Field>
      </div>
    </Modal>
  );
}
