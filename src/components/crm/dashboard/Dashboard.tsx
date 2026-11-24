'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
  ArrowRight,
  Bot,
  Briefcase,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  Inbox,
  ListChecks,
  MessageSquareWarning,
  PhoneCall,
  Play,
  Siren,
  Target,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { APPOINTMENT_KIND_BY_ID, AREAS, AREA_LIST, CHANNELS, CHANNEL_LIST } from '@/crm/constants';
import { diffDays, formatDate, formatDayChip, formatMessageStamp, relativeDay, todayISO } from '@/crm/lib/dates';
import { memberShort } from '@/crm/lib/people';
import { startScenario } from '@/crm/store/runtime';
import {
  appointmentPersonName,
  countByArea,
  countByChannel,
  dashboardStats,
  followUpProspects,
  isTaskOverdue,
  prospectsByMonth,
  unattendedConversations,
  upcomingAppointments,
  urgentTasks,
} from '@/crm/store/selectors';
import { useCrm } from '@/crm/store/store';
import { cn } from '@/lib/utils';
import { BarList, Donut, TrendChart } from '../charts/Charts';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AreaBadge, ChannelBadge, PriorityBadge } from '../ui/Chips';
import { Avatar, Card, CardHeader, EmptyState, PageHeader, StatCard } from '../ui/Layout';
import { Page } from '../ui/Page';
import { useToast } from '../ui/Toast';

export function Dashboard() {
  const state = useCrm();
  const router = useRouter();
  const toast = useToast();
  const today = todayISO();

  const me = state.members.find((m) => m.id === state.currentUserId) ?? state.members[0];
  const stats = useMemo(() => dashboardStats(state, today), [state, today]);
  const byMonth = useMemo(() => prospectsByMonth(state.prospects, 6, today), [state, today]);
  const byArea = useMemo(() => countByArea(state.prospects), [state]);
  const byChannel = useMemo(() => countByChannel(state.prospects), [state]);
  const appointments = useMemo(() => upcomingAppointments(state, today).slice(0, 5), [state, today]);
  const tasks = useMemo(() => urgentTasks(state, today).slice(0, 5), [state, today]);
  const followUps = useMemo(() => followUpProspects(state, today).slice(0, 5), [state, today]);
  const unattended = useMemo(() => unattendedConversations(state), [state]);

  const topChannel = CHANNEL_LIST.map((c) => ({ c, n: byChannel[c.id] })).sort((a, b) => b.n - a.n)[0];
  const monthDelta = stats.newThisMonth - stats.newPrevMonth;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  const launch = (id: 'alimentos' | 'penal') => {
    const r = startScenario(id);
    if (!r.ok) return toast.error('No se pudo iniciar el escenario', r.error);
    router.push(`/crm/conversaciones?id=${r.conversationId}`);
  };

  return (
    <Page>
      <PageHeader
        title={`${greeting}, ${memberShort(me)}`}
        description={`${formatDate(today, 'weekday').replace(/^./, (c) => c.toUpperCase())} · Resumen de la actividad del estudio`}
        actions={
          <>
            <Button size="sm" icon={<Play className="h-3.5 w-3.5" />} onClick={() => launch('alimentos')} title="Escenario guiado: consulta por alimentos, registro del prospecto y cita en la agenda">
              Escenario: alimentos
            </Button>
            <Button size="sm" icon={<Siren className="h-3.5 w-3.5" />} onClick={() => launch('penal')} title="Escenario guiado: defensa penal urgente con derivación inmediata">
              Escenario: penal urgente
            </Button>
          </>
        }
      />

      {unattended.length > 0 || stats.overdueTasks > 0 ? (
        <div className="flex flex-wrap gap-2">
          {unattended.length > 0 ? (
            <Link href="/crm/conversaciones" className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[0.8125rem] font-medium text-amber-900 hover:bg-amber-100">
              <MessageSquareWarning className="h-4 w-4" aria-hidden />
              {unattended.length} {unattended.length === 1 ? 'conversación espera' : 'conversaciones esperan'} respuesta
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          ) : null}
          {stats.overdueTasks > 0 ? (
            <Link href="/crm/tareas" className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.8125rem] font-medium text-red-800 hover:bg-red-100">
              <ListChecks className="h-4 w-4" aria-hidden />
              {stats.overdueTasks} {stats.overdueTasks === 1 ? 'tarea vencida' : 'tareas vencidas'}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          ) : null}
        </div>
      ) : null}

      <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total de prospectos" value={stats.totalProspects} icon={<Target className="h-4 w-4" />} tone="navy" href="/crm/prospectos" hint="En todo el historial" />
        <StatCard
          label="Nuevos del mes"
          value={stats.newThisMonth}
          icon={<UserPlus className="h-4 w-4" />}
          tone="blue"
          href="/crm/prospectos"
          hint={<span className={cn(monthDelta > 0 ? 'text-emerald-700' : monthDelta < 0 ? 'text-red-600' : '')}>{monthDelta === 0 ? 'Igual que el mes anterior' : `${monthDelta > 0 ? '+' : ''}${monthDelta} vs. mes anterior`}</span>}
        />
        <StatCard label="Clientes activos" value={stats.activeClients} icon={<Users className="h-4 w-4" />} tone="green" href="/crm/clientes" hint={`${state.clients.length} clientes en total`} />
        <StatCard label="Expedientes activos" value={stats.activeCases} icon={<Briefcase className="h-4 w-4" />} tone="violet" href="/crm/expedientes" hint={`${state.cases.length} expedientes en total`} />
        <StatCard label="Citas de hoy" value={stats.appointmentsToday} icon={<CalendarCheck2 className="h-4 w-4" />} tone="blue" href="/crm/agenda" hint={`${stats.appointmentsTodayPending} por atender`} />
        <StatCard label="Citas pendientes" value={stats.pendingAppointments} icon={<CalendarClock className="h-4 w-4" />} tone="navy" href="/crm/agenda" hint="Pendientes y confirmadas" />
        <StatCard label="Tareas pendientes" value={stats.pendingTasks} icon={<ListChecks className="h-4 w-4" />} tone="amber" href="/crm/tareas" hint={stats.overdueTasks ? `${stats.overdueTasks} vencidas` : 'Ninguna vencida'} />
        <StatCard label="Consultas sin atender" value={stats.unattended} icon={<Inbox className="h-4 w-4" />} tone={stats.unattended ? 'red' : 'green'} href="/crm/conversaciones" hint="Conversaciones esperando respuesta" />
        <StatCard label="Conversión de prospectos" value={`${stats.conversion} %`} icon={<TrendingUp className="h-4 w-4" />} tone="green" href="/crm/reportes" hint={`${stats.contracted} contratados de ${stats.totalProspects}`} />
        <StatCard label="Origen principal" value={topChannel ? CHANNELS[topChannel.c.id].name : '—'} icon={<UserCheck className="h-4 w-4" />} tone="violet" href="/crm/reportes" hint={topChannel ? `${topChannel.n} de ${stats.totalProspects} prospectos` : undefined} />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Prospectos por mes" description="Prospectos registrados en los últimos seis meses" />
          <div className="px-2 pb-3 sm:px-4">
            <TrendChart data={byMonth} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Captación por canal" description="Origen de los prospectos" />
          <div className="px-4 pb-5">
            <Donut size={150} centerLabel="prospectos" data={CHANNEL_LIST.map((c) => ({ key: c.id, label: c.name, value: byChannel[c.id], color: c.color }))} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Consultas por área jurídica" description="Prospectos clasificados por especialidad" />
          <div className="px-4 pb-4">
            <BarList data={AREA_LIST.map((a) => ({ key: a.id, label: a.short, value: byArea[a.id], color: a.color }))} height={176} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Próximas citas" actions={<Link href="/crm/agenda" className="text-xs font-medium text-brand-700 hover:underline">Ver agenda</Link>} />
          {appointments.length === 0 ? (
            <EmptyState title="Sin citas próximas" description="Las citas que se agenden aparecerán aquí." />
          ) : (
            <ul className="divide-y divide-slate-100 px-2 pb-2">
              {appointments.map((a) => {
                const lawyer = state.members.find((m) => m.id === a.lawyerId);
                return (
                  <li key={a.id}>
                    <Link href="/crm/agenda" className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50">
                      <div className="w-14 shrink-0 rounded-lg bg-navy-50 py-1 text-center">
                        <div className="text-[0.625rem] font-semibold uppercase text-navy-500">{relativeDay(a.date, today) === 'Hoy' ? 'Hoy' : formatDayChip(a.date).split(' ').slice(0, 2).join(' ')}</div>
                        <div className="text-sm font-semibold tabular-nums text-navy-900">{a.time}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-navy-900">{appointmentPersonName(state, a)}</p>
                        <p className="truncate text-xs text-slate-500">
                          {APPOINTMENT_KIND_BY_ID[a.kind].label} · {lawyer ? memberShort(lawyer) : '—'}
                        </p>
                      </div>
                      <Badge tone={a.modality === 'virtual' ? 'violet' : 'navy'}>{a.modality === 'virtual' ? 'Virtual' : 'Presencial'}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Tareas urgentes" actions={<Link href="/crm/tareas" className="text-xs font-medium text-brand-700 hover:underline">Ver tareas</Link>} />
          {tasks.length === 0 ? (
            <EmptyState title="Todo al día" description="No hay tareas pendientes." icon={<CheckCircle2 className="h-5 w-5" />} />
          ) : (
            <ul className="divide-y divide-slate-100 px-2 pb-2">
              {tasks.map((t) => {
                const assignee = state.members.find((m) => m.id === t.assigneeId);
                const overdue = isTaskOverdue(t, today);
                return (
                  <li key={t.id}>
                    <Link href="/crm/tareas" className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50">
                      <Avatar name={assignee?.name ?? '?'} size="sm" tone="slate" className="mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-navy-900">{t.title}</p>
                        <p className={cn('text-xs', overdue ? 'font-medium text-red-600' : 'text-slate-500')}>
                          {overdue ? `Venció ${relativeDay(t.dueDate, today).toLowerCase()}` : `Vence: ${relativeDay(t.dueDate, today).toLowerCase()}`}
                          {assignee ? ` · ${memberShort(assignee)}` : ''}
                        </p>
                      </div>
                      <PriorityBadge priority={t.priority} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Prospectos por seguir" description="Con acción vencida o sin atender" actions={<Link href="/crm/prospectos" className="text-xs font-medium text-brand-700 hover:underline">Ver CRM</Link>} />
          {followUps.length === 0 ? (
            <EmptyState title="Sin seguimientos pendientes" />
          ) : (
            <ul className="divide-y divide-slate-100 px-2 pb-2">
              {followUps.map((p) => {
                const late = p.nextActionDate !== null && diffDays(p.nextActionDate, today) < 0;
                return (
                  <li key={p.id}>
                    <Link href={`/crm/prospectos?id=${p.id}`} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50">
                      <PhoneCall className={cn('mt-0.5 h-4 w-4 shrink-0', late ? 'text-red-500' : 'text-slate-400')} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-navy-900">{p.name}</p>
                        <p className="truncate text-xs text-slate-500">{p.nextAction}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <AreaBadge area={p.area} />
                          <ChannelBadge channel={p.channel} short />
                        </div>
                      </div>
                      <span className={cn('shrink-0 text-xs', late ? 'font-medium text-red-600' : 'text-slate-500')}>{p.nextActionDate ? relativeDay(p.nextActionDate, today) : 'Sin fecha'}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Actividad reciente" description="Acciones del equipo y del asistente virtual" />
          <ul className="divide-y divide-slate-100 px-2 pb-2">
            {state.activity.slice(0, 8).map((a) => {
              const inner = (
                <>
                  <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', a.actorKind === 'asistente' ? 'bg-violet-100 text-violet-700' : a.actorKind === 'sistema' ? 'bg-slate-100 text-slate-500' : 'bg-navy-100 text-navy-700')}>
                    {a.actorKind === 'asistente' ? <Bot className="h-3.5 w-3.5" aria-hidden /> : <Avatar name={a.actor} size="xs" tone="navy" className="!h-7 !w-7 !bg-transparent" />}
                  </span>
                  <p className="min-w-0 flex-1 text-sm leading-snug text-slate-600">
                    <span className="font-medium text-navy-900">{a.actor}</span> {a.text}
                  </p>
                  <span className="shrink-0 text-xs text-slate-400">{formatMessageStamp(a.at)}</span>
                </>
              );
              return (
                <li key={a.id}>
                  {a.href ? (
                    <Link href={a.href} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50">
                      {inner}
                    </Link>
                  ) : (
                    <div className="flex items-start gap-3 px-3 py-2.5">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <p className="pb-2 text-center text-xs text-slate-400">Todos los indicadores se calculan a partir de los registros de la demostración y se actualizan al modificarlos. Áreas: {AREA_LIST.map((a) => AREAS[a.id].short).join(' · ')}.</p>
    </Page>
  );
}
