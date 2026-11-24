'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Building2, Eye, FolderPlus, ListPlus, Mail, MessagesSquare, Pencil, Phone, Plus, Trash2, User, Users } from 'lucide-react';
import { AREA_LIST, APPOINTMENT_KIND_BY_ID } from '@/crm/constants';
import { formatBytes, normalize } from '@/crm/lib/text';
import { formatDate, relativeDay } from '@/crm/lib/dates';
import { memberFull, memberShort } from '@/crm/lib/people';
import * as crm from '@/crm/store/actions';
import { isCaseActive, lawyersOf } from '@/crm/store/selectors';
import { useCrm } from '@/crm/store/store';
import type { Client } from '@/crm/types';
import { cn } from '@/lib/utils';
import { AppointmentModal } from '../agenda/AppointmentModal';
import { CaseForm } from '../cases/CaseForm';
import { useDetailId } from '../hooks';
import { TaskModal } from '../tasks/TaskModal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AppointmentStatusBadge, AreaBadge, CaseStatusBadge, TaskStatusBadge } from '../ui/Chips';
import { SearchInput, Select } from '../ui/Form';
import { Avatar, Card, EmptyState, KeyValue, PageHeader, Pagination, SortHeader, TableWrap, Tabs, tableCls, tdCls, thCls } from '../ui/Layout';
import { ActionMenu, ConfirmDialog, Sheet } from '../ui/Overlay';
import { Page } from '../ui/Page';
import { useToast } from '../ui/Toast';
import { ClientForm } from './ClientForm';

const PAGE_SIZE = 10;
type SortKey = 'name' | 'kind' | 'lawyer' | 'cases' | 'since' | 'status';

export function ClientsPage() {
  const state = useCrm();
  const toast = useToast();
  const [openId, setOpenId] = useDetailId();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [kind, setKind] = useState('');
  const [lawyer, setLawyer] = useState('');
  const [area, setArea] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'since', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<{ open: boolean; client: Client | null }>({ open: false, client: null });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const lawyers = useMemo(() => lawyersOf(state.members), [state.members]);

  const caseCount = useMemo(() => {
    const m = new Map<string, number>();
    state.cases.forEach((c) => m.set(c.clientId, (m.get(c.clientId) ?? 0) + 1));
    return m;
  }, [state.cases]);

  const filtered = useMemo(() => {
    const nq = normalize(q);
    const list = state.clients.filter((c) => {
      if (nq && !normalize(`${c.name} ${c.docNumber} ${c.phone} ${c.email}`).includes(nq)) return false;
      if (status && c.status !== status) return false;
      if (kind && c.kind !== kind) return false;
      if (lawyer && c.lawyerId !== lawyer) return false;
      if (area && !state.cases.some((x) => x.clientId === c.id && x.area === area)) return false;
      return true;
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    const val = (c: Client): string | number => {
      switch (sort.key) {
        case 'name': return normalize(c.name);
        case 'kind': return c.kind;
        case 'lawyer': return memberShort(state.members.find((m) => m.id === c.lawyerId) ?? { name: 'zzz', title: '' });
        case 'cases': return caseCount.get(c.id) ?? 0;
        case 'since': return c.since;
        case 'status': return c.status;
      }
    };
    return [...list].sort((a, b) => (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0) * dir);
  }, [state.clients, state.cases, state.members, q, status, kind, lawyer, area, sort, caseCount]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'since' || key === 'cases' ? 'desc' : 'asc' }));
  const th = (key: SortKey, label: string) => <SortHeader label={label} active={sort.key === key} dir={sort.dir} onClick={() => toggleSort(key)} />;
  const target = deleteId ? state.clients.find((c) => c.id === deleteId) : null;
  const hasFilters = Boolean(q || status || kind || lawyer || area);

  return (
    <Page>
      <PageHeader
        title="Clientes"
        description="Personas y empresas con servicios contratados, con sus expedientes, citas y documentos."
        actions={
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setForm({ open: true, client: null })}>
            Nuevo cliente
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Buscar por nombre, documento, teléfono o correo…" className="w-full sm:w-80" />
          <div className="w-[8.75rem]">
            <Select aria-label="Filtrar por estado" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Estado</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </Select>
          </div>
          <div className="w-[8.75rem]">
            <Select aria-label="Filtrar por tipo" value={kind} onChange={(e) => { setKind(e.target.value); setPage(1); }}>
              <option value="">Tipo</option>
              <option value="persona">Personas</option>
              <option value="empresa">Empresas</option>
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
          <span className="ml-auto text-[0.8125rem] text-slate-500">{filtered.length} de {state.clients.length} clientes</span>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'Ningún cliente coincide con los filtros' : 'Aún no hay clientes'}
            description={hasFilters ? 'Pruebe con otros criterios.' : 'Los clientes aparecen al convertir un prospecto o al registrarlos manualmente.'}
            icon={<Users className="h-5 w-5" />}
            action={hasFilters ? <Button onClick={() => { setQ(''); setStatus(''); setKind(''); setLawyer(''); setArea(''); }}>Limpiar filtros</Button> : <Button variant="primary" onClick={() => setForm({ open: true, client: null })}>Nuevo cliente</Button>}
          />
        ) : (
          <>
            <TableWrap>
              <table className={tableCls}>
                <thead>
                  <tr>
                    {th('name', 'Cliente')}
                    {th('kind', 'Tipo')}
                    <th className={thCls}>Contacto</th>
                    {th('lawyer', 'Abogado responsable')}
                    {th('cases', 'Expedientes')}
                    {th('status', 'Estado')}
                    {th('since', 'Cliente desde')}
                    <th className={thCls}><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => {
                    const l = state.members.find((m) => m.id === c.lawyerId);
                    return (
                      <tr key={c.id} className="cursor-pointer transition-colors hover:bg-slate-50/80" onClick={() => setOpenId(c.id)}>
                        <td className={tdCls}>
                          <div className="flex items-center gap-3">
                            <Avatar name={c.name} tone={c.kind === 'empresa' ? 'violet' : 'slate'} />
                            <div className="min-w-0">
                              <button type="button" onClick={(e) => { e.stopPropagation(); setOpenId(c.id); }} className="block truncate text-left font-medium text-navy-900 hover:underline">{c.name}</button>
                              <div className="text-xs text-slate-500">{c.docType} {c.docNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className={tdCls}>
                          <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-slate-600">
                            {c.kind === 'empresa' ? <Building2 className="h-3.5 w-3.5" aria-hidden /> : <User className="h-3.5 w-3.5" aria-hidden />}
                            {c.kind === 'empresa' ? 'Empresa' : 'Persona'}
                          </span>
                        </td>
                        <td className={tdCls}>
                          <div className="text-[0.8125rem]">{c.phone || '—'}</div>
                          <div className="max-w-[13rem] truncate text-xs text-slate-500">{c.email}</div>
                        </td>
                        <td className={cn(tdCls, 'whitespace-nowrap')}>{l ? memberShort(l) : '—'}</td>
                        <td className={cn(tdCls, 'tabular-nums')}>{caseCount.get(c.id) ?? 0}</td>
                        <td className={tdCls}><Badge tone={c.status === 'activo' ? 'green' : 'neutral'} dot>{c.status === 'activo' ? 'Activo' : 'Inactivo'}</Badge></td>
                        <td className={cn(tdCls, 'whitespace-nowrap text-slate-600')}>{formatDate(c.since, 'medium')}</td>
                        <td className={cn(tdCls, 'w-10')} onClick={(e) => e.stopPropagation()}>
                          <ActionMenu
                            label={`Acciones de ${c.name}`}
                            items={[
                              { label: 'Ver ficha', icon: <Eye className="h-4 w-4" />, onClick: () => setOpenId(c.id) },
                              { label: 'Editar', icon: <Pencil className="h-4 w-4" />, onClick: () => setForm({ open: true, client: c }) },
                              { label: 'Eliminar', icon: <Trash2 className="h-4 w-4" />, danger: true, divider: true, onClick: () => setDeleteId(c.id) },
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

      <ClientSheet clientId={openId && state.clients.some((c) => c.id === openId) ? openId : null} onClose={() => setOpenId(null)} onEdit={(c) => setForm({ open: true, client: c })} onDelete={setDeleteId} />
      <ClientForm open={form.open} client={form.client} onClose={() => setForm({ open: false, client: null })} onSaved={(id) => !form.client && setOpenId(id)} />
      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setDeleteId(null)}
        title="Eliminar cliente"
        description={target ? `Se eliminará a ${target.name} con sus documentos y citas. Si tiene expedientes, primero deben eliminarse.` : ''}
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (!target) return;
          const r = crm.deleteClient(target.id);
          if (r.ok) {
            toast.success('Cliente eliminado', target.name);
            if (openId === target.id) setOpenId(null);
          } else toast.error('No se pudo eliminar', r.error);
        }}
      />
    </Page>
  );
}

function ClientSheet({ clientId, onClose, onEdit, onDelete }: { clientId: string | null; onClose: () => void; onEdit: (c: Client) => void; onDelete: (id: string) => void }) {
  const state = useCrm();
  const [tab, setTab] = useState<'expedientes' | 'citas' | 'documentos' | 'tareas'>('expedientes');
  const [newCase, setNewCase] = useState(false);
  const [apptOpen, setApptOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const client = state.clients.find((c) => c.id === clientId);

  const related = useMemo(() => {
    if (!client) return null;
    return {
      cases: state.cases.filter((c) => c.clientId === client.id),
      appointments: state.appointments.filter((a) => a.clientId === client.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
      documents: state.documents.filter((d) => d.clientId === client.id),
      tasks: state.tasks.filter((t) => t.relatedType === 'cliente' && t.relatedId === client.id),
      conversations: state.conversations.filter((c) => c.clientId === client.id || (client.prospectId && c.prospectId === client.prospectId)),
    };
  }, [state, client]);

  if (!client || !related) return <Sheet open={false} onClose={onClose} title="">{null}</Sheet>;
  const lawyer = state.members.find((m) => m.id === client.lawyerId);

  return (
    <>
      <Sheet
        open
        onClose={onClose}
        width="lg"
        title={client.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={client.status === 'activo' ? 'green' : 'neutral'} dot>{client.status === 'activo' ? 'Activo' : 'Inactivo'}</Badge>
            <span className="text-slate-500">{client.kind === 'empresa' ? 'Empresa' : 'Persona natural'} · {client.docType} {client.docNumber}</span>
          </span>
        }
        headerExtra={
          <Button size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => onEdit(client)}>
            Editar
          </Button>
        }
        footer={
          <>
            <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} className="mr-auto" onClick={() => onDelete(client.id)}>
              Eliminar
            </Button>
            <Button size="sm" icon={<ListPlus className="h-4 w-4" />} onClick={() => setTaskOpen(true)}>Crear tarea</Button>
            <Button size="sm" icon={<FolderPlus className="h-4 w-4" />} onClick={() => setNewCase(true)}>Nuevo expediente</Button>
            <Button size="sm" variant="primary" onClick={() => setApptOpen(true)}>Agendar cita</Button>
          </>
        }
      >
        <div className="space-y-5 p-5">
          <dl className="grid gap-x-6 gap-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:grid-cols-2">
            <KeyValue label="Teléfono">{client.phone ? <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" aria-hidden />{client.phone}</span> : '—'}</KeyValue>
            <KeyValue label="Correo">{client.email ? <span className="inline-flex items-center gap-1.5 break-all"><Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />{client.email}</span> : '—'}</KeyValue>
            <KeyValue label="Distrito">{client.district || '—'}</KeyValue>
            <KeyValue label="Abogado responsable">{lawyer ? memberFull(lawyer) : '—'}</KeyValue>
            <KeyValue label="Cliente desde">{formatDate(client.since, 'long')}</KeyValue>
            <KeyValue label="Origen">
              {client.prospectId ? (
                <Link href={`/crm/prospectos?id=${client.prospectId}`} className="font-medium text-brand-700 hover:underline">Prospecto convertido</Link>
              ) : (
                'Registro directo'
              )}
            </KeyValue>
            {client.notes ? <KeyValue label="Notas internas" className="sm:col-span-2">{client.notes}</KeyValue> : null}
          </dl>

          {related.conversations.length ? (
            <Link href={`/crm/conversaciones?id=${related.conversations[0].id}`} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-slate-50">
              <MessagesSquare className="h-4 w-4" aria-hidden /> Ver conversación ({related.conversations[0].messages.length} mensajes)
            </Link>
          ) : null}

          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { id: 'expedientes', label: 'Expedientes', count: related.cases.length },
              { id: 'citas', label: 'Citas', count: related.appointments.length },
              { id: 'documentos', label: 'Documentos', count: related.documents.length },
              { id: 'tareas', label: 'Tareas', count: related.tasks.length },
            ]}
          />

          {tab === 'expedientes' ? (
            related.cases.length === 0 ? (
              <EmptyState title="Sin expedientes" description="Abra un expediente para comenzar el seguimiento jurídico." action={<Button onClick={() => setNewCase(true)}>Nuevo expediente</Button>} />
            ) : (
              <ul className="space-y-2">
                {related.cases.map((c) => (
                  <li key={c.id}>
                    <Link href={`/crm/expedientes?id=${c.id}`} className="block rounded-lg border border-slate-200 p-3 hover:border-slate-300 hover:bg-slate-50">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-navy-900">{c.code}</span>
                        <CaseStatusBadge status={c.status} />
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{c.procedure}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                        <AreaBadge area={c.area} />
                        <span>Apertura: {formatDate(c.openedAt, 'medium')}</span>
                        {isCaseActive(c) ? null : <span>Cerrado</span>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : null}
          {tab === 'citas' ? (
            related.appointments.length === 0 ? (
              <EmptyState title="Sin citas" />
            ) : (
              <ul className="space-y-2">
                {related.appointments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-navy-900">{APPOINTMENT_KIND_BY_ID[a.kind].label}</p>
                      <p className="text-xs text-slate-500">{formatDate(a.date, 'weekday')} · {a.time} · {a.modality}</p>
                    </div>
                    <AppointmentStatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )
          ) : null}
          {tab === 'documentos' ? (
            related.documents.length === 0 ? (
              <EmptyState title="Sin documentos" description="Suba documentos desde el módulo Documentos." />
            ) : (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {related.documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy-900">{d.name}</p>
                      <p className="text-xs text-slate-500">{d.category} · {formatBytes(d.sizeKb)} · {formatDate(d.uploadedAt.slice(0, 10), 'medium')}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : null}
          {tab === 'tareas' ? (
            related.tasks.length === 0 ? (
              <EmptyState title="Sin tareas" action={<Button onClick={() => setTaskOpen(true)}>Crear tarea</Button>} />
            ) : (
              <ul className="space-y-2">
                {related.tasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy-900">{t.title}</p>
                      <p className="text-xs text-slate-500">Vence: {relativeDay(t.dueDate)}</p>
                    </div>
                    <TaskStatusBadge status={t.status} />
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>
      </Sheet>

      <CaseForm open={newCase} onClose={() => setNewCase(false)} defaults={{ clientId: client.id, lawyerId: client.lawyerId }} />
      <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} defaults={{ clientId: client.id, lawyerId: client.lawyerId, kind: 'seguimiento', durationMin: 30 }} />
      <TaskModal open={taskOpen} onClose={() => setTaskOpen(false)} defaults={{ relatedType: 'cliente', relatedId: client.id }} />
    </>
  );
}
