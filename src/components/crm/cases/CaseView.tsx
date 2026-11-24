'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  Circle,
  FileUp,
  Gavel,
  ListPlus,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { APPOINTMENT_KIND_BY_ID, CASE_STATUSES, TIMELINE_KINDS } from '@/crm/constants';
import { diffDays, formatDate, formatMessageStamp, relativeDay, todayISO } from '@/crm/lib/dates';
import { memberFull } from '@/crm/lib/people';
import { formatBytes } from '@/crm/lib/text';
import { serviceName } from '@/crm/knowledge/services';
import * as crm from '@/crm/store/actions';
import { caseAlerts, deadlineState, isTaskOverdue } from '@/crm/store/selectors';
import { useCrm } from '@/crm/store/store';
import type { CaseStatus, TimelineKind } from '@/crm/types';
import { cn } from '@/lib/utils';
import { AppointmentModal } from '../agenda/AppointmentModal';
import { UploadModal } from '../documents/UploadModal';
import { TaskModal } from '../tasks/TaskModal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AppointmentStatusBadge, AreaBadge, CaseStatusBadge, PriorityBadge, TaskStatusBadge } from '../ui/Chips';
import { Checkbox, Field, FormGrid, Input, Select, Textarea } from '../ui/Form';
import { Card, CardHeader, EmptyState, KeyValue, Tabs } from '../ui/Layout';
import { ConfirmDialog, Modal } from '../ui/Overlay';
import { useToast } from '../ui/Toast';
import { CaseForm } from './CaseForm';

type Tab = 'linea' | 'plazos' | 'documentos' | 'tareas' | 'notas';

export function CaseView({ caseId, onBack, onDeleted }: { caseId: string; onBack: () => void; onDeleted: () => void }) {
  const state = useCrm();
  const toast = useToast();
  const today = todayISO();
  const [tab, setTab] = useState<Tab>('linea');
  const [edit, setEdit] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [hearingOpen, setHearingOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [note, setNote] = useState('');

  const file = state.cases.find((c) => c.id === caseId);
  const client = file ? state.clients.find((c) => c.id === file.clientId) : null;
  const lawyer = file ? state.members.find((m) => m.id === file.lawyerId) : null;

  const data = useMemo(() => {
    if (!file) return null;
    return {
      alerts: caseAlerts(state, file, today),
      hearings: state.appointments.filter((a) => a.caseId === file.id && a.kind === 'audiencia').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
      documents: state.documents.filter((d) => d.caseId === file.id),
      tasks: state.tasks.filter((t) => t.relatedType === 'expediente' && t.relatedId === file.id),
      timeline: [...file.timeline].sort((a, b) => b.date.localeCompare(a.date)),
      deadlines: [...file.deadlines].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    };
  }, [state, file, today]);

  if (!file || !data) return null;

  const upcomingHearings = data.hearings.filter((h) => h.date >= today && (h.status === 'pendiente' || h.status === 'confirmada'));

  return (
    <div className="space-y-5">
      <div>
        <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-slate-500 hover:text-navy-900">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Expedientes
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight text-navy-900 sm:text-2xl">{file.code}</h1>
              <CaseStatusBadge status={file.status} />
            </div>
            <p className="mt-1 text-[0.9375rem] text-slate-600">{file.procedure}</p>
            <p className="mt-1 text-sm text-slate-500">
              {client ? <Link href={`/crm/clientes?id=${client.id}`} className="font-medium text-brand-700 hover:underline">{client.name}</Link> : 'Cliente eliminado'}
              {' · '}
              <AreaBadge area={file.area} short={false} />
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEdit(true)}>Editar</Button>
            <Button icon={<Gavel className="h-4 w-4" />} onClick={() => setHearingOpen(true)}>Programar audiencia</Button>
            <Button icon={<ListPlus className="h-4 w-4" />} onClick={() => setTaskOpen(true)}>Nueva tarea</Button>
            <Button variant="primary" icon={<FileUp className="h-4 w-4" />} onClick={() => setUploadOpen(true)}>Subir documento</Button>
          </div>
        </div>
      </div>

      {data.alerts.count > 0 ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            Requiere atención ({data.alerts.count})
          </p>
          <ul className="mt-2 space-y-1 text-[0.8125rem] text-red-800">
            {data.alerts.deadlines.map((d) => (
              <li key={d.id}>
                Plazo: <strong>{d.title}</strong> — {deadlineState(d, today) === 'vencido' ? `venció ${relativeDay(d.dueDate, today).toLowerCase()}` : `vence ${relativeDay(d.dueDate, today).toLowerCase()}`} ({formatDate(d.dueDate, 'medium')})
              </li>
            ))}
            {data.alerts.hearings.map((h) => (
              <li key={h.id}>
                Audiencia {relativeDay(h.date, today).toLowerCase()}: {formatDate(h.date, 'weekday')} a las {h.time}
              </li>
            ))}
            {data.alerts.tasks.map((t) => (
              <li key={t.id}>
                Tarea vencida: <strong>{t.title}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-4">
          <Card>
            <div className="px-4 pt-2 sm:px-5">
              <Tabs
                value={tab}
                onChange={setTab}
                items={[
                  { id: 'linea', label: 'Línea de tiempo', count: data.timeline.length },
                  { id: 'plazos', label: 'Audiencias y plazos', count: data.hearings.length + data.deadlines.length },
                  { id: 'documentos', label: 'Documentos', count: data.documents.length },
                  { id: 'tareas', label: 'Tareas', count: data.tasks.length },
                  { id: 'notas', label: 'Notas internas', count: file.notes.length },
                ]}
              />
            </div>

            <div className="p-4 sm:p-5">
              {tab === 'linea' ? (
                <div>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <p className="text-sm text-slate-500">Historial de actuaciones, de la más reciente a la más antigua.</p>
                    <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setEventOpen(true)}>Agregar actuación</Button>
                  </div>
                  <ol className="relative space-y-5 border-l-2 border-slate-200 pl-6">
                    {data.timeline.map((ev) => (
                      <li key={ev.id} className="relative">
                        <span className="absolute -left-[1.95rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-500 ring-2 ring-brand-100" aria-hidden />
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={TIMELINE_KINDS[ev.kind].tone}>{TIMELINE_KINDS[ev.kind].label}</Badge>
                          <span className="text-xs text-slate-500">{formatDate(ev.date, 'long')}</span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-navy-900">{ev.title}</p>
                        {ev.detail ? <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{ev.detail}</p> : null}
                        <p className="mt-0.5 text-xs text-slate-400">Registrado por {ev.by}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {tab === 'plazos' ? (
                <div className="space-y-6">
                  <p className="flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2.5 text-[0.8125rem] leading-snug text-brand-800">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    Los plazos y fechas de audiencia los ingresa o verifica el abogado responsable. El sistema y el asistente virtual no calculan ni confirman vencimientos legales.
                  </p>
                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-navy-900">Audiencias</h3>
                      <Button size="sm" icon={<CalendarPlus className="h-3.5 w-3.5" />} onClick={() => setHearingOpen(true)}>Programar</Button>
                    </div>
                    {data.hearings.length === 0 ? (
                      <p className="text-sm text-slate-500">No hay audiencias programadas.</p>
                    ) : (
                      <ul className="space-y-2">
                        {data.hearings.map((h) => (
                          <li key={h.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-navy-900">{formatDate(h.date, 'weekday')} · {h.time}</p>
                              <p className="truncate text-xs text-slate-500">{file.court ?? 'Lugar por confirmar'} · {h.durationMin} min · {h.modality}</p>
                            </div>
                            <AppointmentStatusBadge status={h.status} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-navy-900">Plazos y vencimientos</h3>
                      <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setDeadlineOpen(true)}>Registrar plazo</Button>
                    </div>
                    {data.deadlines.length === 0 ? (
                      <p className="text-sm text-slate-500">No hay plazos registrados.</p>
                    ) : (
                      <ul className="space-y-2">
                        {data.deadlines.map((d) => {
                          const st = deadlineState(d, today);
                          return (
                            <li key={d.id} className={cn('rounded-lg border p-3', st === 'vencido' ? 'border-red-200 bg-red-50/50' : st === 'hoy' || st === 'proximo' ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200')}>
                              <div className="flex items-start gap-3">
                                <button type="button" onClick={() => crm.updateDeadline(file.id, d.id, { done: !d.done })} aria-label={d.done ? 'Marcar como pendiente' : 'Marcar como cumplido'} className="mt-0.5 text-slate-400 hover:text-emerald-600">
                                  {d.done ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5" />}
                                </button>
                                <div className="min-w-0 flex-1">
                                  <p className={cn('text-sm font-medium', d.done ? 'text-slate-400 line-through' : 'text-navy-900')}>{d.title}</p>
                                  <p className="mt-0.5 text-xs text-slate-600">
                                    Fecha ingresada: <strong>{formatDate(d.dueDate, 'long')}</strong>
                                    {!d.done ? <span className={cn('ml-1.5 font-medium', st === 'vencido' ? 'text-red-700' : st === 'hoy' || st === 'proximo' ? 'text-amber-800' : 'text-slate-500')}>· {st === 'vencido' ? `venció ${relativeDay(d.dueDate, today).toLowerCase()}` : relativeDay(d.dueDate, today).toLowerCase()}</span> : null}
                                  </p>
                                  {d.note ? <p className="mt-1 text-xs text-slate-500">{d.note}</p> : null}
                                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                    {d.verified ? <Badge tone="green" dot>Verificado por {d.setBy}</Badge> : <Badge tone="amber" dot>Pendiente de verificación del abogado</Badge>}
                                    {!d.verified ? (
                                      <button type="button" onClick={() => { crm.updateDeadline(file.id, d.id, { verified: true }); toast.success('Plazo verificado', `Firmado por ${memberFull(state.members.find((m) => m.id === state.currentUserId) ?? state.members[0])}`); }} className="text-xs font-medium text-brand-700 hover:underline">
                                        Marcar como verificado
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                                <button type="button" aria-label="Eliminar plazo" onClick={() => crm.removeDeadline(file.id, d.id)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                </div>
              ) : null}

              {tab === 'documentos' ? (
                data.documents.length === 0 ? (
                  <EmptyState title="Sin documentos en este expediente" action={<Button variant="primary" onClick={() => setUploadOpen(true)}>Subir documento</Button>} />
                ) : (
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {data.documents.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-navy-900">{d.name}</p>
                          <p className="text-xs text-slate-500">{d.category} · {formatBytes(d.sizeKb)} · {formatDate(d.uploadedAt.slice(0, 10), 'medium')} · {d.uploadedBy}</p>
                        </div>
                        <Badge tone="neutral">{d.ext.toUpperCase()}</Badge>
                      </li>
                    ))}
                  </ul>
                )
              ) : null}

              {tab === 'tareas' ? (
                data.tasks.length === 0 ? (
                  <EmptyState title="Sin tareas vinculadas" action={<Button onClick={() => setTaskOpen(true)}>Nueva tarea</Button>} />
                ) : (
                  <ul className="space-y-2">
                    {data.tasks.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-navy-900">{t.title}</p>
                          <p className={cn('text-xs', isTaskOverdue(t, today) ? 'font-medium text-red-600' : 'text-slate-500')}>Vence: {relativeDay(t.dueDate, today)} · {memberFull(state.members.find((m) => m.id === t.assigneeId) ?? state.members[0])}</p>
                        </div>
                        <div className="flex items-center gap-2"><PriorityBadge priority={t.priority} /><TaskStatusBadge status={t.status} /></div>
                      </li>
                    ))}
                  </ul>
                )
              ) : null}

              {tab === 'notas' ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota interna: solo la ve el equipo del estudio…" aria-label="Nueva nota interna" className="flex-1" />
                    <Button className="self-end" disabled={!note.trim()} onClick={() => { const r = crm.addCaseNote(file.id, note); if (r.ok) { setNote(''); toast.success('Nota agregada'); } }}>Agregar</Button>
                  </div>
                  {file.notes.length === 0 ? (
                    <p className="text-sm text-slate-500">Aún no hay notas internas.</p>
                  ) : (
                    <ul className="space-y-2">
                      {file.notes.map((n) => (
                        <li key={n.id} className="rounded-lg border border-amber-100 bg-amber-50/60 p-3">
                          <p className="text-sm leading-relaxed text-slate-700">{n.text}</p>
                          <p className="mt-1.5 text-xs text-slate-500">{n.by} · {formatMessageStamp(n.at)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader title="Datos del expediente" />
            <dl className="space-y-3.5 px-4 pb-4 sm:px-5">
              <div>
                <label htmlFor="case-status" className="text-xs font-medium uppercase tracking-wide text-slate-400">Estado</label>
                <Select id="case-status" className="mt-1" value={file.status} onChange={(e) => { crm.setCaseStatus(file.id, e.target.value as CaseStatus); toast.success('Estado actualizado'); }}>
                  {CASE_STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </Select>
              </div>
              <KeyValue label="Abogado responsable">{lawyer ? memberFull(lawyer) : '—'}</KeyValue>
              <KeyValue label="Servicio">{serviceName(file.serviceSlug)}</KeyValue>
              <KeyValue label="Contraparte">{file.counterparty || '—'}</KeyValue>
              <KeyValue label="N.º de expediente judicial">{file.courtFileNumber ?? 'No corresponde / pendiente'}</KeyValue>
              <KeyValue label="Juzgado o entidad">{file.court ?? '—'}</KeyValue>
              <KeyValue label="Apertura">{formatDate(file.openedAt, 'long')}</KeyValue>
              {file.description ? <KeyValue label="Descripción"><span className="text-[0.8125rem] leading-relaxed text-slate-600">{file.description}</span></KeyValue> : null}
            </dl>
          </Card>
          <Card>
            <CardHeader title="Próximas audiencias" />
            <div className="px-4 pb-4 sm:px-5">
              {upcomingHearings.length === 0 ? (
                <p className="text-sm text-slate-500">Sin audiencias próximas.</p>
              ) : (
                <ul className="space-y-2">
                  {upcomingHearings.map((h) => (
                    <li key={h.id} className="flex items-center gap-3 rounded-lg bg-violet-50 px-3 py-2">
                      <Gavel className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
                      <div>
                        <p className="text-sm font-medium text-navy-900">{formatDate(h.date, 'weekday')}</p>
                        <p className="text-xs text-slate-600">{h.time} · {diffDays(h.date, today) === 0 ? 'hoy' : `en ${diffDays(h.date, today)} días`}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
          <button type="button" onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-600">
            <Trash2 className="h-3 w-3" aria-hidden /> Eliminar expediente
          </button>
        </aside>
      </div>

      <CaseForm open={edit} file={file} onClose={() => setEdit(false)} />
      <EventModal open={eventOpen} onClose={() => setEventOpen(false)} caseId={file.id} />
      <DeadlineModal open={deadlineOpen} onClose={() => setDeadlineOpen(false)} caseId={file.id} />
      <AppointmentModal
        open={hearingOpen}
        onClose={() => setHearingOpen(false)}
        defaults={{ kind: 'audiencia', clientId: file.clientId, caseId: file.id, lawyerId: file.lawyerId, area: file.area, serviceSlug: file.serviceSlug, durationMin: 90, modality: 'presencial', time: '09:00' }}
      />
      <TaskModal open={taskOpen} onClose={() => setTaskOpen(false)} defaults={{ relatedType: 'expediente', relatedId: file.id, assigneeId: file.lawyerId }} />
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} defaults={{ clientId: file.clientId, caseId: file.id }} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Eliminar expediente"
        description={`Se eliminará ${file.code} con su línea de tiempo, plazos y notas. Los documentos quedarán sin expediente.`}
        confirmLabel="Eliminar"
        onConfirm={() => {
          const r = crm.deleteCase(file.id);
          if (r.ok) {
            toast.success('Expediente eliminado', file.code);
            onDeleted();
          }
        }}
      />
    </div>
  );
}

function EventModal({ open, onClose, caseId }: { open: boolean; onClose: () => void; caseId: string }) {
  const toast = useToast();
  const [date, setDate] = useState(todayISO());
  const [kind, setKind] = useState<TimelineKind>('escrito');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState('');
  const save = () => {
    const r = crm.addTimelineEvent(caseId, { date, kind, title, detail });
    if (!r.ok) return setError(r.error);
    toast.success('Actuación registrada');
    setTitle('');
    setDetail('');
    setError('');
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Agregar actuación" description="Se suma a la línea de tiempo del expediente." footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={save}>Registrar</Button></>}>
      <div className="space-y-4">
        <FormGrid>
          <Field label="Fecha" required>{(id) => <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
          <Field label="Tipo">
            {(id) => (
              <Select id={id} value={kind} onChange={(e) => setKind(e.target.value as TimelineKind)}>
                {(Object.keys(TIMELINE_KINDS) as TimelineKind[]).filter((k) => k !== 'apertura').map((k) => (
                  <option key={k} value={k}>{TIMELINE_KINDS[k].label}</option>
                ))}
              </Select>
            )}
          </Field>
        </FormGrid>
        <Field label="Título" required error={error || undefined}>{(id) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej.: Presentación de escrito de apelación" invalid={Boolean(error)} />}</Field>
        <Field label="Detalle">{(id) => <Textarea id={id} value={detail} onChange={(e) => setDetail(e.target.value)} />}</Field>
      </div>
    </Modal>
  );
}

function DeadlineModal({ open, onClose, caseId }: { open: boolean; onClose: () => void; caseId: string }) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [verified, setVerified] = useState(true);
  const [error, setError] = useState('');
  const save = () => {
    const r = crm.addDeadline(caseId, { title, dueDate, note, verified });
    if (!r.ok) return setError(r.error);
    toast.success('Plazo registrado');
    setTitle('');
    setDueDate('');
    setNote('');
    setError('');
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Registrar plazo" description="Ingrese la fecha determinada por el abogado responsable. El sistema no calcula plazos legales." footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={save}>Registrar plazo</Button></>}>
      <div className="space-y-4">
        <Field label="Plazo o actuación" required error={error || undefined}>{(id) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej.: Presentar contestación / apelación" invalid={Boolean(error)} />}</Field>
        <Field label="Fecha de vencimiento (ingresada por el abogado)" required>{(id) => <Input id={id} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />}</Field>
        <Field label="Observación">{(id) => <Textarea id={id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
        <Checkbox checked={verified} onChange={setVerified} label="Verificado por el abogado responsable" />
      </div>
    </Modal>
  );
}
