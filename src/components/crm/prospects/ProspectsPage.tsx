'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Eye, FilterX, KanbanSquare, Pencil, Plus, Table2, Target, Trash2 } from 'lucide-react';
import { AREA_LIST, CHANNEL_LIST, PRIORITIES, PRIORITY_BY_ID, STAGES, STAGE_BY_ID } from '@/crm/constants';
import { diffDays, formatDate, todayISO } from '@/crm/lib/dates';
import { memberShort } from '@/crm/lib/people';
import { normalize } from '@/crm/lib/text';
import { serviceName } from '@/crm/knowledge/services';
import * as crm from '@/crm/store/actions';
import { duplicateProspectIds, lawyersOf } from '@/crm/store/selectors';
import { useCrm } from '@/crm/store/store';
import type { Prospect, StageId } from '@/crm/types';
import { cn } from '@/lib/utils';
import { AppointmentModal } from '../agenda/AppointmentModal';
import { useDetailId } from '../hooks';
import { TaskModal } from '../tasks/TaskModal';
import { Button } from '../ui/Button';
import { AreaBadge, ChannelBadge, PriorityBadge, StageBadge } from '../ui/Chips';
import { Select, SearchInput } from '../ui/Form';
import { Avatar, Card, EmptyState, PageHeader, Pagination, Segmented, SortHeader, TableWrap, tableCls, tdCls, thCls } from '../ui/Layout';
import { ActionMenu, ConfirmDialog } from '../ui/Overlay';
import { Page } from '../ui/Page';
import { useToast } from '../ui/Toast';
import { ProspectForm } from './ProspectForm';
import { ProspectKanban } from './ProspectKanban';
import { ProspectSheet } from './ProspectSheet';
import { CloseProspectModal, ConversionModal } from './StageModals';

type SortKey = 'name' | 'channel' | 'area' | 'priority' | 'stage' | 'lawyer' | 'contactDate' | 'nextActionDate';
const PAGE_SIZE = 10;

export function ProspectsPage() {
  const state = useCrm();
  const toast = useToast();
  const [openId, setOpenId] = useDetailId();
  const [view, setView] = useState<'tabla' | 'pipeline'>('tabla');
  const [q, setQ] = useState('');
  const [area, setArea] = useState('');
  const [channel, setChannel] = useState('');
  const [stage, setStage] = useState('');
  const [priority, setPriority] = useState('');
  const [lawyer, setLawyer] = useState('');
  const [onlyDupes, setOnlyDupes] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'contactDate', dir: 'desc' });
  const [page, setPage] = useState(1);

  const [form, setForm] = useState<{ open: boolean; prospect: Prospect | null }>({ open: false, prospect: null });
  const [convertId, setConvertId] = useState<string | null>(null);
  const [closeId, setCloseId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [appt, setAppt] = useState<string | null>(null);
  const [taskFor, setTaskFor] = useState<string | null>(null);

  const today = todayISO();
  const lawyers = useMemo(() => lawyersOf(state.members), [state.members]);
  const dupes = useMemo(() => duplicateProspectIds(state), [state.prospects]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const nq = normalize(q);
    const list = state.prospects.filter((p) => {
      if (nq && !normalize(`${p.name} ${p.phone} ${p.email} ${p.description} ${p.serviceSlug ? serviceName(p.serviceSlug) : ''}`).includes(nq)) return false;
      if (area && (area === 'sin' ? p.area !== null : p.area !== area)) return false;
      if (channel && p.channel !== channel) return false;
      if (stage && view === 'tabla' && p.stage !== stage) return false;
      if (priority && p.priority !== priority) return false;
      if (lawyer && (lawyer === 'sin' ? p.lawyerId !== null : p.lawyerId !== lawyer)) return false;
      if (onlyDupes && !dupes.has(p.id)) return false;
      return true;
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    const value = (p: Prospect): string | number => {
      switch (sort.key) {
        case 'name': return normalize(p.name);
        case 'channel': return p.channel;
        case 'area': return p.area ?? 'zzz';
        case 'priority': return PRIORITY_BY_ID[p.priority].rank;
        case 'stage': return STAGES.findIndex((s) => s.id === p.stage);
        case 'lawyer': return normalize(memberShort(state.members.find((m) => m.id === p.lawyerId) ?? { name: 'zzz', title: '' }));
        case 'contactDate': return p.contactDate + p.createdAt;
        case 'nextActionDate': return p.nextActionDate ?? '9999';
      }
    };
    return [...list].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      return (va < vb ? -1 : va > vb ? 1 : 0) * dir;
    });
  }, [state.prospects, state.members, q, area, channel, stage, priority, lawyer, onlyDupes, sort, dupes, view]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters = Boolean(q || area || channel || stage || priority || lawyer || onlyDupes);

  const toggleSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'contactDate' || key === 'priority' ? 'desc' : 'asc' }));
    setPage(1);
  };
  const clearFilters = () => {
    setQ('');
    setArea('');
    setChannel('');
    setStage('');
    setPriority('');
    setLawyer('');
    setOnlyDupes(false);
    setPage(1);
  };

  const requestMove = (id: string, to: StageId) => {
    const r = crm.moveProspect(id, to);
    if (r.ok) return toast.success('Etapa actualizada', `Ahora en «${STAGE_BY_ID[to].label}»`);
    if (r.needs === 'conversion') return setConvertId(id);
    if (r.needs === 'reason') return setCloseId(id);
    toast.error('No se pudo mover', r.error);
  };

  const target = deleteId ? state.prospects.find((p) => p.id === deleteId) : null;
  const th = (key: SortKey, label: string) => <SortHeader label={label} active={sort.key === key} dir={sort.dir} onClick={() => toggleSort(key)} />;
  const apptProspect = appt ? state.prospects.find((p) => p.id === appt) : null;

  return (
    <Page>
      <PageHeader
        title="Prospectos"
        description="CRM comercial: todas las consultas captadas por WhatsApp, Facebook y la web, desde el primer contacto hasta la contratación."
        actions={
          <>
            <Segmented<'tabla' | 'pipeline'>
              value={view}
              onChange={(v) => {
                setView(v);
                setPage(1);
              }}
              items={[
                { id: 'tabla', label: <span className="inline-flex items-center gap-1.5"><Table2 className="h-3.5 w-3.5" />Tabla</span> },
                { id: 'pipeline', label: <span className="inline-flex items-center gap-1.5"><KanbanSquare className="h-3.5 w-3.5" />Pipeline</span> },
              ]}
            />
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setForm({ open: true, prospect: null })}>
              Nuevo prospecto
            </Button>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Buscar por nombre, teléfono, correo o servicio…" className="w-full sm:w-72" />
          <div className="flex flex-wrap gap-2">
            <FilterSelect label="Área" value={area} onChange={(v) => { setArea(v); setPage(1); }} options={[...AREA_LIST.map((a) => ({ value: a.id, label: a.short })), { value: 'sin', label: 'Por clasificar' }]} />
            <FilterSelect label="Canal" value={channel} onChange={(v) => { setChannel(v); setPage(1); }} options={CHANNEL_LIST.map((c) => ({ value: c.id, label: c.name }))} />
            {view === 'tabla' ? <FilterSelect label="Etapa" value={stage} onChange={(v) => { setStage(v); setPage(1); }} options={STAGES.map((s) => ({ value: s.id, label: s.label }))} /> : null}
            <FilterSelect label="Prioridad" value={priority} onChange={(v) => { setPriority(v); setPage(1); }} options={PRIORITIES.map((p) => ({ value: p.id, label: p.label }))} />
            <FilterSelect label="Abogado" value={lawyer} onChange={(v) => { setLawyer(v); setPage(1); }} options={[...lawyers.map((l) => ({ value: l.id, label: memberShort(l) })), { value: 'sin', label: 'Sin asignar' }]} />
          </div>
          <button
            type="button"
            onClick={() => { setOnlyDupes((v) => !v); setPage(1); }}
            aria-pressed={onlyDupes}
            disabled={dupes.size === 0}
            className={cn('inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[0.8125rem] font-medium transition-colors disabled:opacity-50', onlyDupes ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}
          >
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            Posibles duplicados ({dupes.size})
          </button>
          {hasFilters ? (
            <Button variant="ghost" size="sm" icon={<FilterX className="h-3.5 w-3.5" />} onClick={clearFilters}>
              Limpiar
            </Button>
          ) : null}
          <span className="ml-auto text-[0.8125rem] text-slate-500">
            {filtered.length} de {state.prospects.length} prospectos
          </span>
        </div>
      </Card>

      {view === 'pipeline' ? (
        filtered.length === 0 ? (
          <Card>
            <EmptyState title="Ningún prospecto coincide con los filtros" action={<Button onClick={clearFilters}>Limpiar filtros</Button>} icon={<Target className="h-5 w-5" />} />
          </Card>
        ) : (
          <ProspectKanban prospects={filtered} members={state.members} duplicateIds={dupes} onOpen={setOpenId} onMove={requestMove} />
        )
      ) : (
        <Card className="overflow-hidden">
          {rows.length === 0 ? (
            <EmptyState
              title={hasFilters ? 'Ningún prospecto coincide con los filtros' : 'Aún no hay prospectos'}
              description={hasFilters ? 'Pruebe con otros criterios de búsqueda.' : 'Los prospectos llegan desde las conversaciones o se registran manualmente.'}
              action={hasFilters ? <Button onClick={clearFilters}>Limpiar filtros</Button> : <Button variant="primary" onClick={() => setForm({ open: true, prospect: null })}>Nuevo prospecto</Button>}
              icon={<Target className="h-5 w-5" />}
            />
          ) : (
            <>
              <TableWrap>
                <table className={tableCls}>
                  <thead>
                    <tr>
                      {th('name', 'Prospecto')}
                      {th('channel', 'Canal')}
                      {th('area', 'Área y servicio')}
                      {th('priority', 'Prioridad')}
                      {th('stage', 'Etapa')}
                      {th('lawyer', 'Abogado')}
                      {th('contactDate', 'Contacto')}
                      {th('nextActionDate', 'Próxima acción')}
                      <th className={thCls}><span className="sr-only">Acciones</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => {
                      const l = state.members.find((m) => m.id === p.lawyerId);
                      const late = p.nextActionDate && diffDays(p.nextActionDate, today) < 0 && p.stage !== 'contratado' && p.stage !== 'cerrado';
                      return (
                        <tr key={p.id} className="group cursor-pointer transition-colors hover:bg-slate-50/80" onClick={() => setOpenId(p.id)}>
                          <td className={tdCls}>
                            <div className="flex items-center gap-3">
                              <Avatar name={p.name} size="md" tone="slate" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <button type="button" onClick={(e) => { e.stopPropagation(); setOpenId(p.id); }} className="truncate font-medium text-navy-900 hover:underline">{p.name}</button>
                                  {dupes.has(p.id) ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="Posible duplicado" /> : null}
                                </div>
                                <div className="truncate text-xs text-slate-500">{p.phone || p.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className={tdCls}><ChannelBadge channel={p.channel} short /></td>
                          <td className={tdCls}>
                            <AreaBadge area={p.area} />
                            <div className="max-w-[14rem] truncate text-xs text-slate-500">{p.serviceSlug ? serviceName(p.serviceSlug) : 'Servicio por definir'}</div>
                          </td>
                          <td className={tdCls}><PriorityBadge priority={p.priority} /></td>
                          <td className={tdCls}><StageBadge stage={p.stage} /></td>
                          <td className={cn(tdCls, 'whitespace-nowrap')}>{l ? memberShort(l) : <span className="text-slate-400">Sin asignar</span>}</td>
                          <td className={cn(tdCls, 'whitespace-nowrap text-slate-600')}>{formatDate(p.contactDate, 'medium')}</td>
                          <td className={tdCls}>
                            <div className="max-w-[15rem] truncate text-[0.8125rem]">{p.nextAction}</div>
                            {p.nextActionDate ? <div className={cn('text-xs', late ? 'font-medium text-red-600' : 'text-slate-500')}>{formatDate(p.nextActionDate, 'medium')}</div> : null}
                          </td>
                          <td className={cn(tdCls, 'w-10')} onClick={(e) => e.stopPropagation()}>
                            <ActionMenu
                              label={`Acciones de ${p.name}`}
                              items={[
                                { label: 'Ver ficha', icon: <Eye className="h-4 w-4" />, onClick: () => setOpenId(p.id) },
                                { label: 'Editar', icon: <Pencil className="h-4 w-4" />, onClick: () => setForm({ open: true, prospect: p }) },
                                { label: 'Eliminar', icon: <Trash2 className="h-4 w-4" />, danger: true, divider: true, onClick: () => setDeleteId(p.id) },
                              ]}
                            />
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
      )}

      <ProspectSheet
        prospectId={openId && state.prospects.some((p) => p.id === openId) ? openId : null}
        onClose={() => setOpenId(null)}
        onEdit={(id) => setForm({ open: true, prospect: state.prospects.find((p) => p.id === id) ?? null })}
        onMove={requestMove}
        onSchedule={setAppt}
        onTask={setTaskFor}
        onDelete={setDeleteId}
        onConvert={setConvertId}
      />

      <ProspectForm open={form.open} prospect={form.prospect} onClose={() => setForm({ open: false, prospect: null })} onSaved={(id) => !form.prospect && setOpenId(id)} />
      <ConversionModal prospectId={convertId} onClose={() => setConvertId(null)} />
      <CloseProspectModal prospectId={closeId} onClose={() => setCloseId(null)} />
      <AppointmentModal
        open={Boolean(apptProspect)}
        onClose={() => setAppt(null)}
        defaults={apptProspect ? { prospectId: apptProspect.id, lawyerId: apptProspect.lawyerId ?? undefined, area: apptProspect.area ?? 'familia', serviceSlug: apptProspect.serviceSlug, reminderEmail: Boolean(apptProspect.email) } : undefined}
      />
      <TaskModal open={Boolean(taskFor)} onClose={() => setTaskFor(null)} defaults={taskFor ? { relatedType: 'prospecto', relatedId: taskFor } : undefined} />
      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setDeleteId(null)}
        title="Eliminar prospecto"
        description={target ? `Se eliminará a ${target.name} junto con sus citas y tareas vinculadas.` : ''}
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (!target) return;
          const r = crm.deleteProspect(target.id);
          if (r.ok) {
            toast.success('Prospecto eliminado', target.name);
            if (openId === target.id) setOpenId(null);
          } else toast.error(r.error);
        }}
      />
    </Page>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="w-[8.75rem]">
      <Select aria-label={`Filtrar por ${label.toLowerCase()}`} value={value} onChange={(e) => onChange(e.target.value)} className={cn(value && 'border-brand-300 bg-brand-50/50')}>
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
