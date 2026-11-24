'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Bell, CheckCircle2, Circle, FilterX, KanbanSquare, ListChecks, List, Pencil, Plus, Trash2 } from 'lucide-react';
import { PRIORITIES, PRIORITY_BY_ID, TASK_STATUSES } from '@/crm/constants';
import { diffDays, formatDate, formatMessageStamp, relativeDay, todayISO } from '@/crm/lib/dates';
import { memberFull, memberShort } from '@/crm/lib/people';
import { normalize } from '@/crm/lib/text';
import * as crm from '@/crm/store/actions';
import { isTaskOverdue } from '@/crm/store/selectors';
import { useCrm } from '@/crm/store/store';
import type { CrmState, Task, TaskStatus } from '@/crm/types';
import { cn } from '@/lib/utils';
import { useDetailId } from '../hooks';
import { Badge, ToneDot } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PriorityBadge, TaskStatusBadge } from '../ui/Chips';
import { SearchInput, Select } from '../ui/Form';
import { Avatar, Card, EmptyState, KeyValue, PageHeader, Segmented } from '../ui/Layout';
import { ActionMenu, ConfirmDialog, Sheet } from '../ui/Overlay';
import { Page } from '../ui/Page';
import { useToast } from '../ui/Toast';
import { TaskModal } from './TaskModal';

function relatedLabel(state: CrmState, t: Task) {
  if (!t.relatedType || !t.relatedId) return null;
  if (t.relatedType === 'prospecto') {
    const p = state.prospects.find((x) => x.id === t.relatedId);
    return p ? { text: p.name, href: `/crm/prospectos?id=${p.id}`, kind: 'Prospecto' } : null;
  }
  if (t.relatedType === 'cliente') {
    const c = state.clients.find((x) => x.id === t.relatedId);
    return c ? { text: c.name, href: `/crm/clientes?id=${c.id}`, kind: 'Cliente' } : null;
  }
  const e = state.cases.find((x) => x.id === t.relatedId);
  return e ? { text: e.code, href: `/crm/expedientes?id=${e.id}`, kind: 'Expediente' } : null;
}

export function TasksPage() {
  const state = useCrm();
  const toast = useToast();
  const today = todayISO();
  const [openId, setOpenId] = useDetailId();
  const [view, setView] = useState<'lista' | 'tablero'>('lista');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignee, setAssignee] = useState('');
  const [relType, setRelType] = useState('');
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [form, setForm] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const nq = normalize(q);
    return state.tasks
      .filter((t) => {
        if (nq && !normalize(`${t.title} ${t.description} ${relatedLabel(state, t)?.text ?? ''}`).includes(nq)) return false;
        if (status && t.status !== status) return false;
        if (!status && !showDone && view === 'lista' && t.status === 'completada') return false;
        if (priority && t.priority !== priority) return false;
        if (assignee && t.assigneeId !== assignee) return false;
        if (relType && t.relatedType !== relType) return false;
        if (onlyOverdue && !isTaskOverdue(t, today)) return false;
        return true;
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || PRIORITY_BY_ID[b.priority].rank - PRIORITY_BY_ID[a.priority].rank);
  }, [state, q, status, priority, assignee, relType, onlyOverdue, showDone, view, today]);

  const groups = useMemo(() => {
    const open = filtered.filter((t) => t.status !== 'completada');
    return [
      { id: 'vencidas', label: 'Vencidas', tone: 'red' as const, items: open.filter((t) => t.dueDate < today) },
      { id: 'hoy', label: 'Para hoy', tone: 'amber' as const, items: open.filter((t) => t.dueDate === today) },
      { id: 'semana', label: 'Próximos 7 días', tone: 'blue' as const, items: open.filter((t) => diffDays(t.dueDate, today) > 0 && diffDays(t.dueDate, today) <= 7) },
      { id: 'despues', label: 'Más adelante', tone: 'slate' as const, items: open.filter((t) => diffDays(t.dueDate, today) > 7) },
      { id: 'hechas', label: 'Completadas', tone: 'green' as const, items: filtered.filter((t) => t.status === 'completada') },
    ].filter((g) => g.items.length);
  }, [filtered, today]);

  const mineCount = state.tasks.filter((t) => t.assigneeId === state.currentUserId && t.status !== 'completada').length;
  const overdueCount = state.tasks.filter((t) => isTaskOverdue(t, today)).length;
  const hasFilters = Boolean(q || status || priority || assignee || relType || onlyOverdue);
  const clear = () => { setQ(''); setStatus(''); setPriority(''); setAssignee(''); setRelType(''); setOnlyOverdue(false); };
  const target = deleteId ? state.tasks.find((t) => t.id === deleteId) : null;

  const complete = (t: Task) => {
    const done = t.status === 'completada';
    crm.setTaskStatus(t.id, done ? 'pendiente' : 'completada');
    toast.success(done ? 'Tarea reabierta' : 'Tarea completada', t.title);
  };

  const row = (t: Task) => {
    const rel = relatedLabel(state, t);
    const who = state.members.find((m) => m.id === t.assigneeId);
    const overdue = isTaskOverdue(t, today);
    return (
      <li key={t.id} className="group flex items-center gap-3 px-3 py-3 hover:bg-slate-50/80 sm:px-4">
        <button type="button" onClick={() => complete(t)} aria-label={t.status === 'completada' ? 'Reabrir tarea' : 'Marcar como completada'} className="shrink-0 text-slate-300 transition-colors hover:text-emerald-600">
          {t.status === 'completada' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5" />}
        </button>
        <button type="button" onClick={() => setOpenId(t.id)} className="min-w-0 flex-1 text-left">
          <span className={cn('block truncate text-sm font-medium', t.status === 'completada' ? 'text-slate-400 line-through' : 'text-navy-900')}>{t.title}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-500">
            {rel ? <span>{rel.kind}: {rel.text}</span> : <span>Sin vínculo</span>}
            <span className={cn(overdue && 'font-medium text-red-600')}>{t.status === 'completada' ? 'Completada' : overdue ? `Venció ${relativeDay(t.dueDate, today).toLowerCase()}` : `Vence ${relativeDay(t.dueDate, today).toLowerCase()}`}</span>
            {t.reminder && t.status !== 'completada' ? <span className="inline-flex items-center gap-0.5"><Bell className="h-3 w-3" aria-label="Con recordatorio" /></span> : null}
          </span>
        </button>
        <span className="hidden sm:block"><PriorityBadge priority={t.priority} /></span>
        <span className="hidden md:block"><TaskStatusBadge status={t.status} /></span>
        {who ? <Avatar name={who.name} size="sm" tone="navy" className="shrink-0" /> : null}
        <ActionMenu
          label={`Acciones de ${t.title}`}
          items={[
            { label: 'Ver detalle', onClick: () => setOpenId(t.id) },
            { label: 'Editar', icon: <Pencil className="h-4 w-4" />, onClick: () => setForm({ open: true, task: t }) },
            ...TASK_STATUSES.filter((s) => s.id !== t.status).map((s, i) => ({ label: `Marcar ${s.label.toLowerCase()}`, onClick: () => crm.setTaskStatus(t.id, s.id), divider: i === 0 })),
            { label: 'Eliminar', icon: <Trash2 className="h-4 w-4" />, danger: true, divider: true, onClick: () => setDeleteId(t.id) },
          ]}
        />
      </li>
    );
  };

  return (
    <Page>
      <PageHeader
        title="Tareas y seguimiento"
        description="Pendientes del equipo vinculados a prospectos, clientes y expedientes, con responsable, prioridad y fecha límite."
        actions={
          <>
            <Segmented<'lista' | 'tablero'>
              value={view}
              onChange={setView}
              items={[
                { id: 'lista', label: <span className="inline-flex items-center gap-1.5"><List className="h-3.5 w-3.5" />Lista</span> },
                { id: 'tablero', label: <span className="inline-flex items-center gap-1.5"><KanbanSquare className="h-3.5 w-3.5" />Tablero</span> },
              ]}
            />
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setForm({ open: true, task: null })}>
              Nueva tarea
            </Button>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
          <SearchInput value={q} onChange={setQ} placeholder="Buscar tareas…" className="w-full sm:w-64" />
          <button type="button" aria-pressed={assignee === state.currentUserId} onClick={() => setAssignee(assignee === state.currentUserId ? '' : state.currentUserId)} className={cn('inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[0.8125rem] font-medium', assignee === state.currentUserId ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>
            Mis tareas ({mineCount})
          </button>
          <button type="button" aria-pressed={onlyOverdue} onClick={() => setOnlyOverdue((v) => !v)} disabled={!overdueCount} className={cn('inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[0.8125rem] font-medium disabled:opacity-50', onlyOverdue ? 'border-red-300 bg-red-50 text-red-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>
            Vencidas ({overdueCount})
          </button>
          <div className="w-[8.5rem]"><Select aria-label="Filtrar por estado" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Estado</option>{TASK_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</Select></div>
          <div className="w-[8.5rem]"><Select aria-label="Filtrar por prioridad" value={priority} onChange={(e) => setPriority(e.target.value)}><option value="">Prioridad</option>{PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</Select></div>
          <div className="w-[9.5rem]"><Select aria-label="Filtrar por responsable" value={assignee} onChange={(e) => setAssignee(e.target.value)}><option value="">Responsable</option>{state.members.map((m) => <option key={m.id} value={m.id}>{memberShort(m)}</option>)}</Select></div>
          <div className="w-[8.5rem]"><Select aria-label="Filtrar por vínculo" value={relType} onChange={(e) => setRelType(e.target.value)}><option value="">Vinculada a</option><option value="prospecto">Prospecto</option><option value="cliente">Cliente</option><option value="expediente">Expediente</option></Select></div>
          {view === 'lista' ? (
            <label className="flex cursor-pointer items-center gap-2 text-[0.8125rem] text-slate-600">
              <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600" /> Mostrar completadas
            </label>
          ) : null}
          {hasFilters ? <Button variant="ghost" size="sm" icon={<FilterX className="h-3.5 w-3.5" />} onClick={clear}>Limpiar</Button> : null}
        </div>
      </Card>

      {view === 'lista' ? (
        groups.length === 0 ? (
          <Card><EmptyState title={hasFilters ? 'Ninguna tarea coincide con los filtros' : 'No hay tareas pendientes'} icon={<ListChecks className="h-5 w-5" />} action={hasFilters ? <Button onClick={clear}>Limpiar filtros</Button> : <Button variant="primary" onClick={() => setForm({ open: true, task: null })}>Nueva tarea</Button>} /></Card>
        ) : (
          <div className="space-y-4">
            {groups.map((g) => (
              <Card key={g.id} className="overflow-hidden">
                <header className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
                  <ToneDot tone={g.tone} />
                  <h2 className="text-sm font-semibold text-navy-900">{g.label}</h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600 ring-1 ring-slate-200">{g.items.length}</span>
                </header>
                <ul className="divide-y divide-slate-100">{g.items.map(row)}</ul>
              </Card>
            ))}
          </div>
        )
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {TASK_STATUSES.map((s) => {
            const items = filtered.filter((t) => t.status === s.id);
            return (
              <section
                key={s.id}
                aria-label={`${s.label}: ${items.length}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData('text/plain');
                  if (id) crm.setTaskStatus(id, s.id);
                }}
                className="rounded-xl border border-slate-200/80 bg-slate-100/60 p-2"
              >
                <header className="flex items-center gap-2 px-2 pb-2 pt-1">
                  <ToneDot tone={s.tone} />
                  <h2 className="text-[0.8125rem] font-semibold text-navy-900">{s.label}</h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600 ring-1 ring-slate-200">{items.length}</span>
                </header>
                <ul className="space-y-2">
                  {items.length === 0 ? <li className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">Sin tareas</li> : null}
                  {items.map((t) => {
                    const rel = relatedLabel(state, t);
                    const who = state.members.find((m) => m.id === t.assigneeId);
                    const overdue = isTaskOverdue(t, today);
                    return (
                      <li key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', t.id)} className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-card active:cursor-grabbing">
                        <div className="flex items-start gap-2">
                          <button type="button" onClick={() => setOpenId(t.id)} className="min-w-0 flex-1 text-left">
                            <span className="block text-sm font-medium text-navy-900">{t.title}</span>
                            <span className="mt-0.5 block truncate text-xs text-slate-500">{rel ? `${rel.kind}: ${rel.text}` : 'Sin vínculo'}</span>
                          </button>
                          <ActionMenu label={`Acciones de ${t.title}`} items={[{ label: 'Ver detalle', onClick: () => setOpenId(t.id) }, ...TASK_STATUSES.filter((x) => x.id !== t.status).map((x) => ({ label: `Mover a ${x.label}`, onClick: () => crm.setTaskStatus(t.id, x.id) }))]} />
                        </div>
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <span className={cn('text-xs', overdue ? 'font-medium text-red-600' : 'text-slate-500')}>{relativeDay(t.dueDate, today)}</span>
                          <span className="flex items-center gap-2"><PriorityBadge priority={t.priority} />{who ? <Avatar name={who.name} size="xs" tone="navy" /> : null}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <TaskSheet taskId={openId && state.tasks.some((t) => t.id === openId) ? openId : null} onClose={() => setOpenId(null)} onEdit={(t) => setForm({ open: true, task: t })} onDelete={setDeleteId} />
      <TaskModal open={form.open} task={form.task} onClose={() => setForm({ open: false, task: null })} />
      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setDeleteId(null)}
        title="Eliminar tarea"
        description={target ? `Se eliminará «${target.title}».` : ''}
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (!target) return;
          crm.deleteTask(target.id);
          toast.success('Tarea eliminada');
          if (openId === target.id) setOpenId(null);
        }}
      />
    </Page>
  );
}

function TaskSheet({ taskId, onClose, onEdit, onDelete }: { taskId: string | null; onClose: () => void; onEdit: (t: Task) => void; onDelete: (id: string) => void }) {
  const state = useCrm();
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return <Sheet open={false} onClose={onClose} title="">{null}</Sheet>;
  const who = state.members.find((m) => m.id === task.assigneeId);
  const rel = relatedLabel(state, task);
  return (
    <Sheet
      open
      onClose={onClose}
      title={task.title}
      subtitle={<span className="flex flex-wrap items-center gap-2"><TaskStatusBadge status={task.status} /><PriorityBadge priority={task.priority} /></span>}
      headerExtra={<Button size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => onEdit(task)}>Editar</Button>}
      footer={
        <>
          <Button variant="danger" size="sm" className="mr-auto" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => onDelete(task.id)}>Eliminar</Button>
          {task.status !== 'completada' ? <Button size="sm" variant="primary" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => crm.setTaskStatus(task.id, 'completada')}>Completar</Button> : <Button size="sm" onClick={() => crm.setTaskStatus(task.id, 'pendiente')}>Reabrir</Button>}
        </>
      }
    >
      <div className="space-y-5 p-5">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <KeyValue label="Responsable">{who ? memberFull(who) : '—'}</KeyValue>
          <KeyValue label="Fecha límite">{formatDate(task.dueDate, 'long')} <span className="text-xs text-slate-500">· {relativeDay(task.dueDate)}</span></KeyValue>
          <KeyValue label="Vinculada a">{rel ? <Link href={rel.href} className="font-medium text-brand-700 hover:underline">{rel.kind}: {rel.text}</Link> : 'Sin vínculo'}</KeyValue>
          <KeyValue label="Recordatorio">{task.reminder ? 'Activado' : 'Sin recordatorio'}</KeyValue>
        </dl>
        {task.description ? <div><h3 className="mb-1.5 text-[0.8125rem] font-semibold text-navy-800">Detalle</h3><p className="rounded-lg border border-slate-200 p-3 text-sm leading-relaxed text-slate-700">{task.description}</p></div> : null}
        <div>
          <h3 className="mb-2 text-[0.8125rem] font-semibold text-navy-800">Historial</h3>
          <ol className="space-y-2.5 border-l border-slate-200 pl-4">
            {[...task.history].reverse().map((h, i) => (
              <li key={i} className="text-sm text-slate-700">{h.text}<span className="block text-xs text-slate-400">{h.by} · {formatMessageStamp(h.at)}</span></li>
            ))}
          </ol>
        </div>
        <Badge tone="neutral">Creada el {formatDate(task.createdAt.slice(0, 10), 'medium')}</Badge>
      </div>
    </Sheet>
  );
}
