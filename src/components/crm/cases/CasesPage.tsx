'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Briefcase, Plus } from 'lucide-react';
import { AREA_LIST, CASE_STATUSES } from '@/crm/constants';
import { formatDate, relativeDay, todayISO } from '@/crm/lib/dates';
import { memberShort } from '@/crm/lib/people';
import { normalize } from '@/crm/lib/text';
import { caseAlerts, lawyersOf } from '@/crm/store/selectors';
import { useCrm } from '@/crm/store/store';
import type { CaseFile } from '@/crm/types';
import { cn } from '@/lib/utils';
import { useDetailId } from '../hooks';
import { Button } from '../ui/Button';
import { AreaBadge, CaseStatusBadge } from '../ui/Chips';
import { SearchInput, Select } from '../ui/Form';
import { Card, EmptyState, PageHeader, Pagination, SortHeader, TableWrap, tableCls, tdCls, thCls } from '../ui/Layout';
import { Page } from '../ui/Page';
import { CaseForm } from './CaseForm';
import { CaseView } from './CaseView';

const PAGE_SIZE = 10;
type SortKey = 'code' | 'client' | 'status' | 'openedAt';

export function CasesPage() {
  const state = useCrm();
  const [openId, setOpenId] = useDetailId();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [area, setArea] = useState('');
  const [lawyer, setLawyer] = useState('');
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'openedAt', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(false);
  const today = todayISO();
  const lawyers = useMemo(() => lawyersOf(state.members), [state.members]);
  const clientName = (id: string) => state.clients.find((c) => c.id === id)?.name ?? '—';

  const alertsById = useMemo(() => new Map(state.cases.map((c) => [c.id, caseAlerts(state, c, today)])), [state, today]);

  const nextMilestone = (c: CaseFile) => {
    const hearing = state.appointments
      .filter((a) => a.caseId === c.id && a.kind === 'audiencia' && a.date >= today && (a.status === 'pendiente' || a.status === 'confirmada'))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
    const deadline = c.deadlines.filter((d) => !d.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
    const candidates = [
      hearing ? { date: hearing.date, label: 'Audiencia' } : null,
      deadline ? { date: deadline.dueDate, label: 'Plazo' } : null,
    ].filter(Boolean) as { date: string; label: string }[];
    return candidates.sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  };

  const filtered = useMemo(() => {
    const nq = normalize(q);
    const list = state.cases.filter((c) => {
      if (nq && !normalize(`${c.code} ${clientName(c.clientId)} ${c.counterparty} ${c.courtFileNumber ?? ''} ${c.procedure}`).includes(nq)) return false;
      if (status && c.status !== status) return false;
      if (area && c.area !== area) return false;
      if (lawyer && c.lawyerId !== lawyer) return false;
      if (onlyAlerts && !(alertsById.get(c.id)?.count ?? 0)) return false;
      return true;
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    const val = (c: CaseFile) => (sort.key === 'code' ? c.code : sort.key === 'client' ? normalize(clientName(c.clientId)) : sort.key === 'status' ? CASE_STATUSES.findIndex((s) => s.id === c.status) : c.openedAt);
    return [...list].sort((a, b) => (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0) * dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.cases, state.clients, q, status, area, lawyer, onlyAlerts, sort, alertsById]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const alertTotal = [...alertsById.values()].filter((a) => a.count > 0).length;
  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'openedAt' ? 'desc' : 'asc' }));
  const th = (key: SortKey, label: string) => <SortHeader label={label} active={sort.key === key} dir={sort.dir} onClick={() => toggleSort(key)} />;
  const hasFilters = Boolean(q || status || area || lawyer || onlyAlerts);

  if (openId && state.cases.some((c) => c.id === openId)) {
    return (
      <Page>
        <CaseView caseId={openId} onBack={() => setOpenId(null)} onDeleted={() => setOpenId(null)} />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Expedientes"
        description="Gestión jurídica de cada caso: actuaciones, audiencias, plazos verificados por el abogado, documentos y tareas."
        actions={
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setForm(true)}>
            Nuevo expediente
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Buscar por código, cliente, contraparte o N.º judicial…" className="w-full sm:w-80" />
          <div className="w-[10rem]">
            <Select aria-label="Filtrar por estado" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Estado</option>
              {CASE_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </Select>
          </div>
          <div className="w-[8.75rem]">
            <Select aria-label="Filtrar por área" value={area} onChange={(e) => { setArea(e.target.value); setPage(1); }}>
              <option value="">Área</option>
              {AREA_LIST.map((a) => (
                <option key={a.id} value={a.id}>{a.short}</option>
              ))}
            </Select>
          </div>
          <div className="w-[8.75rem]">
            <Select aria-label="Filtrar por abogado" value={lawyer} onChange={(e) => { setLawyer(e.target.value); setPage(1); }}>
              <option value="">Abogado</option>
              {lawyers.map((l) => (
                <option key={l.id} value={l.id}>{memberShort(l)}</option>
              ))}
            </Select>
          </div>
          <button
            type="button"
            aria-pressed={onlyAlerts}
            onClick={() => { setOnlyAlerts((v) => !v); setPage(1); }}
            disabled={alertTotal === 0}
            className={cn('inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[0.8125rem] font-medium transition-colors disabled:opacity-50', onlyAlerts ? 'border-red-300 bg-red-50 text-red-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}
          >
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            Con alertas ({alertTotal})
          </button>
          <span className="ml-auto text-[0.8125rem] text-slate-500">{filtered.length} de {state.cases.length} expedientes</span>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'Ningún expediente coincide con los filtros' : 'Aún no hay expedientes'}
            icon={<Briefcase className="h-5 w-5" />}
            action={hasFilters ? <Button onClick={() => { setQ(''); setStatus(''); setArea(''); setLawyer(''); setOnlyAlerts(false); }}>Limpiar filtros</Button> : <Button variant="primary" onClick={() => setForm(true)}>Nuevo expediente</Button>}
          />
        ) : (
          <>
            <TableWrap>
              <table className={tableCls}>
                <thead>
                  <tr>
                    {th('code', 'Expediente')}
                    {th('client', 'Cliente')}
                    <th className={thCls}>Área y procedimiento</th>
                    <th className={thCls}>Abogado</th>
                    {th('status', 'Estado')}
                    {th('openedAt', 'Apertura')}
                    <th className={thCls}>Próximo hito</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => {
                    const alerts = alertsById.get(c.id);
                    const milestone = nextMilestone(c);
                    const l = state.members.find((m) => m.id === c.lawyerId);
                    return (
                      <tr key={c.id} className="cursor-pointer transition-colors hover:bg-slate-50/80" onClick={() => setOpenId(c.id)}>
                        <td className={tdCls}>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={(e) => { e.stopPropagation(); setOpenId(c.id); }} className="font-semibold text-navy-900 hover:underline">{c.code}</button>
                            {alerts && alerts.count > 0 ? <span className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-red-700 ring-1 ring-inset ring-red-100" title="Plazos, audiencias o tareas que requieren atención"><AlertTriangle className="h-3 w-3" aria-hidden />{alerts.count}</span> : null}
                          </div>
                          {c.courtFileNumber ? <div className="text-xs text-slate-500">{c.courtFileNumber}</div> : null}
                        </td>
                        <td className={tdCls}>{clientName(c.clientId)}</td>
                        <td className={tdCls}>
                          <AreaBadge area={c.area} />
                          <div className="max-w-[16rem] truncate text-xs text-slate-500">{c.procedure}</div>
                        </td>
                        <td className={cn(tdCls, 'whitespace-nowrap')}>{l ? memberShort(l) : '—'}</td>
                        <td className={tdCls}><CaseStatusBadge status={c.status} /></td>
                        <td className={cn(tdCls, 'whitespace-nowrap text-slate-600')}>{formatDate(c.openedAt, 'medium')}</td>
                        <td className={cn(tdCls, 'whitespace-nowrap')}>
                          {milestone ? (
                            <span className={cn('text-[0.8125rem]', milestone.date < today ? 'font-medium text-red-600' : 'text-slate-700')}>
                              {milestone.label}: {relativeDay(milestone.date, today).toLowerCase()}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
            <Pagination page={safePage} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
          </>
        )}
      </Card>

      <CaseForm open={form} onClose={() => setForm(false)} onSaved={(id) => setOpenId(id)} />
    </Page>
  );
}
