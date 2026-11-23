import Link from 'next/link';
import { CalendarPlus, Clock, Mail, MapPin, Phone, Video } from 'lucide-react';
import {
  AdminCard,
  AdminPageHeader,
  AppointmentStatusBadge,
} from '@/components/admin/AdminUI';
import { AdminForm } from '@/components/admin/AdminForm';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { NewAppointmentPanel } from '@/components/admin/NewAppointmentPanel';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { EmptyState } from '@/components/ui/Table';
import { deleteAppointment, updateAppointment } from '@/app/actions/admin';
import { adminGetAppointments, adminGetAreas, adminGetLawyers, adminGetServices } from '@/lib/data/admin';
import { APPOINTMENT_STATUSES } from '@/types';
import { formatDateWithWeekday, toISODate } from '@/lib/scheduling';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Citas' };

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; rango?: string }>;
}) {
  const [{ estado, rango }, appointments, lawyers, areas, services] = await Promise.all([
    searchParams,
    adminGetAppointments(),
    adminGetLawyers(),
    adminGetAreas(),
    adminGetServices(),
  ]);

  const today = toISODate(new Date());
  const activeStatus = APPOINTMENT_STATUSES.includes(
    estado as (typeof APPOINTMENT_STATUSES)[number],
  )
    ? estado
    : null;
  const range = rango === 'pasadas' ? 'pasadas' : 'proximas';

  const filtered = appointments
    .filter((appointment) =>
      range === 'proximas'
        ? appointment.scheduled_date >= today
        : appointment.scheduled_date < today,
    )
    .filter((appointment) => (activeStatus ? appointment.status === activeStatus : true))
    .sort((a, b) => {
      const left = `${a.scheduled_date}${a.scheduled_time}`;
      const right = `${b.scheduled_date}${b.scheduled_time}`;
      return range === 'proximas' ? left.localeCompare(right) : right.localeCompare(left);
    });

  const buildHref = (next: { estado?: string | null; rango?: string }) => {
    const params = new URLSearchParams();
    const status = next.estado === undefined ? activeStatus : next.estado;
    if (status) params.set('estado', status);
    const nextRange = next.rango ?? range;
    if (nextRange !== 'proximas') params.set('rango', nextRange);
    const query = params.toString();
    return query ? `/admin/citas?${query}` : '/admin/citas';
  };

  return (
    <>
      <AdminPageHeader
        title="Citas"
        description="Agenda del estudio. Puede confirmar, reprogramar, cancelar o marcar como atendida cada solicitud."
        action={
          <Link
            href="#nueva-cita"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.8125rem] text-paper transition-colors hover:bg-ink/85"
          >
            <CalendarPlus className="h-3.5 w-3.5" aria-hidden />
            Nueva cita
          </Link>
        }
      />

      {/* --------------------------------- Filtros ------------------------------ */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-line p-0.5">
          <Link
            href={buildHref({ rango: 'proximas' })}
            className={cn(
              'rounded-full px-4 py-1.5 text-2xs uppercase tracking-overline transition-colors',
              range === 'proximas' ? 'bg-ink text-paper' : 'text-ink-muted hover:text-ink',
            )}
          >
            Próximas
          </Link>
          <Link
            href={buildHref({ rango: 'pasadas' })}
            className={cn(
              'rounded-full px-4 py-1.5 text-2xs uppercase tracking-overline transition-colors',
              range === 'pasadas' ? 'bg-ink text-paper' : 'text-ink-muted hover:text-ink',
            )}
          >
            Pasadas
          </Link>
        </div>

        <span className="mx-1 h-5 w-px bg-line" aria-hidden />

        <Link
          href={buildHref({ estado: null })}
          className={cn(
            'rounded-full border px-3.5 py-1.5 text-2xs uppercase tracking-overline transition-colors',
            activeStatus ? 'border-line text-ink-muted hover:text-ink' : 'border-ink bg-ink text-paper',
          )}
        >
          Todas
        </Link>
        {APPOINTMENT_STATUSES.map((status) => (
          <Link
            key={status}
            href={buildHref({ estado: status })}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-2xs uppercase tracking-overline transition-colors',
              activeStatus === status
                ? 'border-ink bg-ink text-paper'
                : 'border-line text-ink-muted hover:text-ink',
            )}
          >
            {status} ({appointments.filter((item) => item.status === status).length})
          </Link>
        ))}
      </div>

      {/* --------------------------------- Listado ------------------------------ */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Sin citas en este filtro"
          description="Las solicitudes enviadas desde el sitio aparecen aquí como pendientes de confirmación."
        />
      ) : (
        <ul className="space-y-4">
          {filtered.map((appointment) => (
            <li key={appointment.id}>
              <article className="rounded-2xl border border-line bg-white">
                <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-6 py-5">
                  <div>
                    <p className="font-display text-[1.0625rem]">{appointment.full_name}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-ink-muted">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" aria-hidden />
                        {formatDateWithWeekday(appointment.scheduled_date)} ·{' '}
                        {appointment.scheduled_time} ({appointment.duration_minutes} min)
                      </span>
                      <span className="flex items-center gap-1.5">
                        {appointment.modality === 'virtual' ? (
                          <Video className="h-3 w-3" aria-hidden />
                        ) : (
                          <MapPin className="h-3 w-3" aria-hidden />
                        )}
                        {appointment.modality}
                      </span>
                    </p>
                  </div>
                  <AppointmentStatusBadge status={appointment.status} />
                </header>

                <div className="grid gap-6 px-6 py-5 lg:grid-cols-2">
                  <dl className="space-y-3 text-[0.875rem]">
                    <div className="flex gap-2">
                      <dt className="sr-only">Teléfono</dt>
                      <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                      <dd className="text-ink-soft">{appointment.phone}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="sr-only">Correo</dt>
                      <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                      <dd className="break-all text-ink-soft">{appointment.email}</dd>
                    </div>
                    <div>
                      <dt className="text-2xs uppercase tracking-overline text-ink-muted">
                        Materia
                      </dt>
                      <dd className="mt-1 text-ink-soft">
                        {appointment.area?.name ?? 'Sin área'}
                        {appointment.service ? ` · ${appointment.service.name}` : ''}
                      </dd>
                    </div>
                    {appointment.subject ? (
                      <div>
                        <dt className="text-2xs uppercase tracking-overline text-ink-muted">
                          Asunto
                        </dt>
                        <dd className="mt-1 text-ink-soft">{appointment.subject}</dd>
                      </div>
                    ) : null}
                    {appointment.notes ? (
                      <div>
                        <dt className="text-2xs uppercase tracking-overline text-ink-muted">
                          Comentarios del solicitante
                        </dt>
                        <dd className="mt-1 text-ink-soft">{appointment.notes}</dd>
                      </div>
                    ) : null}
                  </dl>

                  <AdminForm
                    action={updateAppointment}
                    submitLabel="Guardar cita"
                    footer={
                      <DeleteButton
                        action={deleteAppointment}
                        label="Eliminar"
                        confirmMessage="¿Eliminar esta cita de la agenda?"
                      />
                    }
                  >
                    <input type="hidden" name="id" value={appointment.id} />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Estado" htmlFor={`status-${appointment.id}`} required>
                        <Select
                          id={`status-${appointment.id}`}
                          name="status"
                          defaultValue={appointment.status}
                        >
                          {APPOINTMENT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <Field label="Abogado" htmlFor={`lawyer-${appointment.id}`}>
                        <Select
                          id={`lawyer-${appointment.id}`}
                          name="lawyer_id"
                          defaultValue={appointment.lawyer_id ?? ''}
                        >
                          <option value="">Sin asignar</option>
                          {lawyers.map((lawyer) => (
                            <option key={lawyer.id} value={lawyer.id}>
                              {lawyer.name}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <Field label="Fecha" htmlFor={`date-${appointment.id}`}>
                        <Input
                          id={`date-${appointment.id}`}
                          name="scheduled_date"
                          type="date"
                          defaultValue={appointment.scheduled_date}
                        />
                      </Field>

                      <Field label="Hora" htmlFor={`time-${appointment.id}`}>
                        <Input
                          id={`time-${appointment.id}`}
                          name="scheduled_time"
                          type="time"
                          defaultValue={appointment.scheduled_time}
                        />
                      </Field>
                    </div>

                    <Field label="Notas internas" htmlFor={`notes-${appointment.id}`}>
                      <Textarea
                        id={`notes-${appointment.id}`}
                        name="admin_notes"
                        rows={2}
                        defaultValue={appointment.admin_notes ?? ''}
                        placeholder="Coordinación, enlace de videollamada, observaciones…"
                      />
                    </Field>
                  </AdminForm>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {/* ------------------------------- Nueva cita ----------------------------- */}
      <section id="nueva-cita" className="mt-10 scroll-mt-24">
        <AdminCard
          title="Registrar una cita"
          description="Para reuniones acordadas por teléfono o WhatsApp que no llegaron por el formulario del sitio."
        >
          <NewAppointmentPanel areas={areas} services={services} lawyers={lawyers} />
        </AdminCard>
      </section>
    </>
  );
}
