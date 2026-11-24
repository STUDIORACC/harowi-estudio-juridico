'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { BarChart3, CalendarCheck2, Clock, Download, Percent, TrendingUp } from 'lucide-react';
import { AREAS, AREA_LIST, CASE_STATUSES, CHANNEL_LIST, STAGES } from '@/crm/constants';
import { formatDate, relativeDay, todayISO } from '@/crm/lib/dates';
import { memberShort } from '@/crm/lib/people';
import {
  PERIODS,
  appointmentSeries,
  conversionStats,
  filterAppointments,
  filterProspects,
  funnel,
  lawyerActivity,
  pendingFollowUps,
  prospectSeries,
  topServices,
  type Period,
  type ReportFilters,
} from '@/crm/store/reports';
import { countByArea, countByChannel, lawyersOf } from '@/crm/store/selectors';
import { useCrm } from '@/crm/store/store';
import type { AreaId } from '@/crm/types';
import { cn } from '@/lib/utils';
import { BarList, Donut, StackedColumns, TrendChart } from '../charts/Charts';
import { Button } from '../ui/Button';
import { PriorityBadge } from '../ui/Chips';
import { Select } from '../ui/Form';
import { Avatar, Card, CardHeader, EmptyState, PageHeader, Segmented, StatCard, TableWrap, tableCls, tdCls, thCls } from '../ui/Layout';
import { Page } from '../ui/Page';

/** Tarjeta de reporte con alternancia gráfico/tabla (la tabla es la vista accesible de los mismos datos). */
function ChartCard({ title, description, children, headers, rows, className, actions }: { title: string; description?: string; children: ReactNode; headers: string[]; rows: (string | number)[][]; className?: string; actions?: ReactNode }) {
  const [mode, setMode] = useState<'grafico' | 'tabla'>('grafico');
  return (
    <Card className={className}>
      <CardHeader
        title={title}
        description={description}
        actions={
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <Segmented<'grafico' | 'tabla'> size="sm" value={mode} onChange={setMode} items={[{ id: 'grafico', label: 'Gráfico' }, { id: 'tabla', label: 'Tabla' }]} />
          </div>
        }
      />
      <div className="px-4 pb-4 sm:px-5">
        {mode === 'grafico' ? (
          children
        ) : (
          <TableWrap className="rounded-lg border border-slate-200">
            <table className={tableCls}>
              <thead>
                <tr>{headers.map((h, i) => <th key={h} className={cn(thCls, i > 0 && 'text-right')}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>{r.map((c, j) => <td key={j} className={cn(tdCls, j > 0 && 'text-right tabular-nums')}>{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </div>
    </Card>
  );
}

export function ReportsPage() {
  const state = useCrm();
  const today = todayISO();
  const [filters, setFilters] = useState<ReportFilters>({ period: '180d', area: '', lawyerId: '' });
  const lawyers = useMemo(() => lawyersOf(state.members), [state.members]);

  const prospects = useMemo(() => filterProspects(state, filters, today), [state, filters, today]);
  const appointments = useMemo(() => filterAppointments(state, filters, today), [state, filters, today]);
  const series = useMemo(() => prospectSeries(prospects, filters.period, today), [prospects, filters.period, today]);
  const byChannel = useMemo(() => countByChannel(prospects), [prospects]);
  const byArea = useMemo(() => countByArea(prospects), [prospects]);
  const services = useMemo(() => topServices(prospects), [prospects]);
  const apptSeries = useMemo(() => appointmentSeries(appointments, filters.period, today), [appointments, filters.period, today]);
  const stages = useMemo(() => funnel(prospects), [prospects]);
  const conv = useMemo(() => conversionStats(state, prospects), [state, prospects]);
  const activity = useMemo(() => lawyerActivity(state, filters, today), [state, filters, today]);
  const follow = useMemo(() => pendingFollowUps(state, today), [state, today]);
  const cases = useMemo(
    () => state.cases.filter((c) => (!filters.area || c.area === filters.area) && (!filters.lawyerId || c.lawyerId === filters.lawyerId)),
    [state.cases, filters],
  );
  const caseCounts = CASE_STATUSES.map((s) => ({ key: s.id, label: s.label, value: cases.filter((c) => c.status === s.id).length, color: '#2a78d6' }));
  const apptTotals = appointments.reduce(
    (a, x) => ({ total: a.total + 1, attended: a.attended + (x.status === 'atendida' ? 1 : 0), scheduled: a.scheduled + (x.status === 'pendiente' || x.status === 'confirmada' ? 1 : 0) }),
    { total: 0, attended: 0, scheduled: 0 },
  );
  const set = <K extends keyof ReportFilters>(k: K, v: ReportFilters[K]) => setFilters((f) => ({ ...f, [k]: v }));

  const exportCsv = () => {
    const header = ['Nombre', 'Canal', 'Área', 'Servicio', 'Prioridad', 'Etapa', 'Abogado', 'Fecha de contacto'];
    const lines = prospects.map((p) => [p.name, p.channel, p.area ?? '', p.serviceSlug ?? '', p.priority, p.stage, state.members.find((m) => m.id === p.lawyerId)?.name ?? '', p.contactDate]);
    const csv = [header, ...lines].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `prospectos-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scopeLabel = [PERIODS.find((p) => p.id === filters.period)?.label, filters.area ? AREAS[filters.area].short : null, filters.lawyerId ? memberShort(state.members.find((m) => m.id === filters.lawyerId)!) : null].filter(Boolean).join(' · ');

  return (
    <Page>
      <PageHeader
        title="Reportes"
        description="Captación, conversión y carga de trabajo del estudio. Todos los gráficos se calculan con los registros de la demostración."
        actions={<Button icon={<Download className="h-4 w-4" />} onClick={exportCsv} disabled={!prospects.length}>Exportar prospectos (CSV)</Button>}
      />

      <div className="sticky top-0 z-20 -mx-4 border-b border-slate-200 bg-canvas/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-[12rem]"><Select aria-label="Periodo" value={filters.period} onChange={(e) => set('period', e.target.value as Period)}>{PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</Select></div>
          <div className="w-[12rem]"><Select aria-label="Área jurídica" value={filters.area} onChange={(e) => set('area', e.target.value as AreaId | '')}><option value="">Todas las áreas</option>{AREA_LIST.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></div>
          <div className="w-[12rem]"><Select aria-label="Abogado" value={filters.lawyerId} onChange={(e) => set('lawyerId', e.target.value)}><option value="">Todos los abogados</option>{lawyers.map((l) => <option key={l.id} value={l.id}>{memberShort(l)}</option>)}</Select></div>
          {filters.area || filters.lawyerId || filters.period !== '180d' ? <Button variant="ghost" size="sm" onClick={() => setFilters({ period: '180d', area: '', lawyerId: '' })}>Restablecer filtros</Button> : null}
          <span className="ml-auto text-[0.8125rem] text-slate-500">{scopeLabel} · {prospects.length} prospectos</span>
        </div>
      </div>

      <section aria-label="Resumen" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Prospectos en el periodo" value={prospects.length} icon={<BarChart3 className="h-4 w-4" />} tone="navy" hint={`${conv.open} siguen abiertos`} />
        <StatCard label="Conversión comercial" value={`${conv.rate} %`} icon={<Percent className="h-4 w-4" />} tone="green" hint={`${conv.contracted} contratados · ${conv.closed} cerrados`} />
        <StatCard label="Citas del periodo" value={apptTotals.total} icon={<CalendarCheck2 className="h-4 w-4" />} tone="blue" hint={`${apptTotals.attended} atendidas · ${apptTotals.scheduled} programadas`} />
        <StatCard label="Días hasta contratar" value={conv.avgDays === null ? '—' : conv.avgDays} icon={<Clock className="h-4 w-4" />} tone="violet" hint="Promedio desde el primer contacto" />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Prospectos por periodo" description={filters.period === '30d' || filters.period === '90d' ? 'Prospectos nuevos por semana' : 'Prospectos nuevos por mes'} headers={['Periodo', 'Prospectos']} rows={series.map((s) => [s.label, s.count])}>
          <TrendChart data={series} height={250} />
        </ChartCard>
        <ChartCard title="Captación por canal" description="Origen de los prospectos" headers={['Canal', 'Prospectos', 'Contratados']} rows={CHANNEL_LIST.map((c) => [c.name, byChannel[c.id], prospects.filter((p) => p.channel === c.id && p.stage === 'contratado').length])}>
          <Donut size={150} centerLabel="prospectos" data={CHANNEL_LIST.map((c) => ({ key: c.id, label: c.name, value: byChannel[c.id], color: c.color }))} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Consultas por especialidad" description="Prospectos por área jurídica" headers={['Área', 'Prospectos']} rows={AREA_LIST.map((a) => [a.name, byArea[a.id]])}>
          <BarList data={AREA_LIST.map((a) => ({ key: a.id, label: a.short, value: byArea[a.id], color: a.color }))} height={176} />
        </ChartCard>
        <ChartCard title="Servicios más solicitados" description="Los ocho servicios con más consultas" headers={['Servicio', 'Área', 'Prospectos']} rows={services.map((s) => [s.label, AREAS[s.area].short, s.value])}>
          {services.length ? <BarList data={services.map((s) => ({ key: s.key, label: s.label, value: s.value, color: AREAS[s.area].color }))} /> : <EmptyState title="Sin datos para el filtro actual" />}
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Citas programadas y atendidas" description="Citas por estado en el periodo" headers={['Periodo', 'Programadas', 'Atendidas', 'No asistió', 'Canceladas']} rows={apptSeries.map((s) => [s.label, s.programadas, s.atendidas, s.no_asistio, s.canceladas])}>
          <StackedColumns
            data={apptSeries}
            series={[
              { key: 'atendidas', label: 'Atendidas', color: '#0ca30c' },
              { key: 'programadas', label: 'Programadas', color: '#2a78d6' },
              { key: 'no_asistio', label: 'No asistió', color: '#d03b3b' },
              { key: 'canceladas', label: 'Canceladas', color: '#a3acba' },
            ]}
          />
        </ChartCard>
        <ChartCard title="Conversión comercial" description="Prospectos por etapa del pipeline" headers={['Etapa', 'Prospectos']} rows={stages.map((s) => [s.label, s.value])}>
          <div className="mb-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-emerald-50 py-2"><p className="text-lg font-semibold text-emerald-800">{conv.rate} %</p><p className="text-[0.6875rem] text-emerald-700">Contratados</p></div>
            <div className="rounded-lg bg-slate-100 py-2"><p className="text-lg font-semibold text-slate-700">{conv.lostRate} %</p><p className="text-[0.6875rem] text-slate-500">Cerrados</p></div>
            <div className="rounded-lg bg-brand-50 py-2"><p className="text-lg font-semibold text-brand-800">{conv.open}</p><p className="text-[0.6875rem] text-brand-700">En curso</p></div>
          </div>
          <BarList data={stages.map((s) => ({ key: s.key, label: s.label, value: s.value, color: s.key === 'contratado' ? '#0ca30c' : s.key === 'cerrado' ? '#a3acba' : '#2a78d6' }))} height={STAGES.length * 30 + 12} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Actividad de abogados" description="Carga y resultados por abogado" headers={['Abogado', 'Prospectos abiertos', 'Citas atendidas', 'Citas programadas', 'Expedientes activos', 'Tareas pendientes']} rows={activity.map((a) => [memberShort(a.member), a.prospects, a.attended, a.scheduled, a.activeCases, a.pendingTasks])}>
          <TableWrap className="rounded-lg border border-slate-200">
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className={thCls}>Abogado</th>
                  <th className={cn(thCls, 'text-right')}>Prospectos</th>
                  <th className={cn(thCls, 'text-right')}>Atendidas</th>
                  <th className={cn(thCls, 'text-right')}>Programadas</th>
                  <th className={cn(thCls, 'text-right')}>Expedientes</th>
                  <th className={cn(thCls, 'text-right')}>Tareas pend.</th>
                  <th className={thCls}>Carga</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((a) => {
                  const max = Math.max(1, ...activity.map((x) => x.load));
                  return (
                    <tr key={a.id}>
                      <td className={tdCls}><div className="flex items-center gap-2.5"><Avatar name={a.member.name} size="sm" tone="navy" /><span className="font-medium text-navy-900">{memberShort(a.member)}</span></div></td>
                      <td className={cn(tdCls, 'text-right tabular-nums')}>{a.prospects}</td>
                      <td className={cn(tdCls, 'text-right tabular-nums')}>{a.attended}</td>
                      <td className={cn(tdCls, 'text-right tabular-nums')}>{a.scheduled}</td>
                      <td className={cn(tdCls, 'text-right tabular-nums')}>{a.activeCases}</td>
                      <td className={cn(tdCls, 'text-right tabular-nums')}>{a.pendingTasks}</td>
                      <td className={tdCls}><div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`Carga: ${a.load}`}><div className="h-full rounded-full bg-brand-500" style={{ width: `${(a.load / max) * 100}%` }} /></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </ChartCard>
        <ChartCard title="Expedientes por estado" description="Situación actual de los expedientes" headers={['Estado', 'Expedientes']} rows={caseCounts.map((c) => [c.label, c.value])}>
          <BarList data={caseCounts} height={CASE_STATUSES.length * 34 + 12} />
        </ChartCard>
      </div>

      <Card>
        <CardHeader title="Seguimientos pendientes" description="Tareas vencidas y prospectos con la próxima acción atrasada (estado actual)" actions={<span className="inline-flex items-center gap-1 text-xs text-slate-500"><TrendingUp className="h-3.5 w-3.5" aria-hidden />{follow.tasks.length + follow.prospects.length} pendientes</span>} />
        {follow.tasks.length + follow.prospects.length === 0 ? (
          <EmptyState title="Sin seguimientos atrasados" description="Todo el equipo está al día." />
        ) : (
          <div className="grid grid-cols-1 gap-px border-t border-slate-100 bg-slate-100 md:grid-cols-2">
            <ul className="min-w-0 space-y-0 bg-white">
              <li className="px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Tareas vencidas ({follow.tasks.length})</li>
              {follow.tasks.map((t) => (
                <li key={t.id}>
                  <Link href="/crm/tareas" className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50">
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-navy-900">{t.title}</span><span className="block truncate text-xs text-red-600">Venció {relativeDay(t.dueDate, today).toLowerCase()} · {memberShort(state.members.find((m) => m.id === t.assigneeId) ?? state.members[0])}</span></span>
                    <PriorityBadge priority={t.priority} />
                  </Link>
                </li>
              ))}
              {follow.tasks.length === 0 ? <li className="px-5 py-3 text-sm text-slate-500">Sin tareas vencidas.</li> : null}
            </ul>
            <ul className="min-w-0 bg-white">
              <li className="px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Prospectos con acción atrasada ({follow.prospects.length})</li>
              {follow.prospects.map((p) => (
                <li key={p.id}>
                  <Link href={`/crm/prospectos?id=${p.id}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50">
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-navy-900">{p.name}</span><span className="block truncate text-xs text-red-600">{p.nextAction} · {p.nextActionDate ? formatDate(p.nextActionDate, 'medium') : ''}</span></span>
                  </Link>
                </li>
              ))}
              {follow.prospects.length === 0 ? <li className="px-5 py-3 text-sm text-slate-500">Sin prospectos atrasados.</li> : null}
            </ul>
          </div>
        )}
      </Card>
    </Page>
  );
}

