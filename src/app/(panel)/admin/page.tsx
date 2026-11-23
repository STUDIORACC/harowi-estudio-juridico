import Link from 'next/link';
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Inbox,
  Newspaper,
  Scale,
  Users,
} from 'lucide-react';
import { AdminPageHeader, AppointmentStatusBadge, ConsultationStatusBadge } from '@/components/admin/AdminUI';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/Table';
import {
  adminGetAppointments,
  adminGetConsultations,
  adminGetDashboardStats,
} from '@/lib/data/admin';
import { formatDateShort } from '@/lib/utils';
import { formatDateWithWeekday, toISODate } from '@/lib/scheduling';

export const metadata = { title: 'Dashboard' };

export default async function AdminDashboardPage() {
  const [stats, consultations, appointments] = await Promise.all([
    adminGetDashboardStats(),
    adminGetConsultations(),
    adminGetAppointments(),
  ]);

  const today = toISODate(new Date());
  const recentConsultations = consultations.slice(0, 5);
  const upcoming = appointments
    .filter((item) => item.scheduled_date >= today && item.status !== 'cancelada')
    .sort((a, b) =>
      `${a.scheduled_date}${a.scheduled_time}`.localeCompare(`${b.scheduled_date}${b.scheduled_time}`),
    )
    .slice(0, 5);

  return (
    <>
      <AdminPageHeader
        title="Resumen"
        description="Estado actual de las consultas, las citas y el contenido publicado del estudio."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Consultas nuevas"
          value={stats.newConsultations}
          note={`${stats.totalConsultations} en total`}
          icon={Inbox}
        />
        <StatCard
          label="Citas pendientes"
          value={stats.pendingAppointments}
          note="por confirmar"
          icon={CalendarDays}
        />
        <StatCard
          label="Citas confirmadas"
          value={stats.confirmedAppointments}
          note="en agenda"
          icon={CalendarCheck}
        />
        <StatCard
          label="Artículos publicados"
          value={stats.publishedPosts}
          note={`${stats.draftPosts} en borrador`}
          icon={Newspaper}
        />
        <StatCard label="Abogados activos" value={stats.activeLawyers} icon={Users} />
        <StatCard label="Servicios activos" value={stats.activeServices} icon={Scale} />
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        {/* --------------------------- Consultas recientes ---------------------- */}
        <section className="rounded-2xl border border-line bg-white">
          <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
            <h2 className="font-display text-[1.0625rem]">Últimas consultas</h2>
            <Link
              href="/admin/consultas"
              className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-overline text-ink-muted transition-colors hover:text-ink"
            >
              Ver todas
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </header>

          {recentConsultations.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Sin consultas registradas"
                description="Las consultas enviadas desde el sitio aparecerán aquí."
              />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {recentConsultations.map((consultation) => (
                <li key={consultation.id}>
                  <Link
                    href={`/admin/consultas/${consultation.id}`}
                    className="flex items-start justify-between gap-4 px-6 py-4 transition-colors hover:bg-paper-alt/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[0.9375rem] text-ink">{consultation.full_name}</p>
                      <p className="mt-1 truncate text-2xs text-ink-muted">
                        {consultation.area?.name ?? 'Sin área'}
                        {consultation.service ? ` · ${consultation.service.name}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <ConsultationStatusBadge status={consultation.status} />
                      <span className="text-2xs text-ink-muted">
                        {formatDateShort(consultation.created_at.slice(0, 10))}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ----------------------------- Próximas citas ------------------------- */}
        <section className="rounded-2xl border border-line bg-white">
          <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
            <h2 className="font-display text-[1.0625rem]">Próximas citas</h2>
            <Link
              href="/admin/citas"
              className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-overline text-ink-muted transition-colors hover:text-ink"
            >
              Ver agenda
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </header>

          {upcoming.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Sin citas próximas"
                description="Las solicitudes de cita recibidas desde el sitio aparecerán aquí."
              />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.map((appointment) => (
                <li key={appointment.id} className="flex items-start justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-[0.9375rem] text-ink">{appointment.full_name}</p>
                    <p className="mt-1 truncate text-2xs text-ink-muted">
                      {formatDateWithWeekday(appointment.scheduled_date)} ·{' '}
                      {appointment.scheduled_time} ·{' '}
                      {appointment.lawyer?.name ?? 'Sin asignar'}
                    </p>
                  </div>
                  <AppointmentStatusBadge status={appointment.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
