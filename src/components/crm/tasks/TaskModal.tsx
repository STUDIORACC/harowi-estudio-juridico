'use client';

import { useEffect, useState } from 'react';
import { PRIORITIES, TASK_STATUSES } from '@/crm/constants';
import { addDays, todayISO } from '@/crm/lib/dates';
import { memberFull } from '@/crm/lib/people';
import * as crm from '@/crm/store/actions';
import { useCrm } from '@/crm/store/store';
import type { RelatedType, Task } from '@/crm/types';
import { Button } from '../ui/Button';
import { Checkbox, Field, FormGrid, Input, Select, Textarea } from '../ui/Form';
import { Modal } from '../ui/Overlay';
import { useToast } from '../ui/Toast';

type Draft = crm.TaskInput;

export function TaskModal({ open, onClose, task, defaults }: { open: boolean; onClose: () => void; task?: Task | null; defaults?: Partial<Draft> }) {
  const state = useCrm();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(() => blank(state.currentUserId, defaults));
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (task) {
      const { id: _i, createdAt: _c, history: _h, ...rest } = task;
      setDraft(rest);
    } else setDraft(blank(state.currentUserId, defaults));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const relatedOptions: { id: string; label: string }[] =
    draft.relatedType === 'prospecto'
      ? state.prospects.map((p) => ({ id: p.id, label: p.name }))
      : draft.relatedType === 'cliente'
        ? state.clients.map((c) => ({ id: c.id, label: c.name }))
        : draft.relatedType === 'expediente'
          ? state.cases.map((c) => ({ id: c.id, label: `${c.code} · ${state.clients.find((x) => x.id === c.clientId)?.name ?? ''}` }))
          : [];

  const save = () => {
    const found = crm.validateTask(draft);
    setErrors(found);
    if (Object.keys(found).length) return;
    const result = task ? crm.updateTask(task.id, draft) : crm.createTask(draft);
    if (!result.ok) return toast.error('No se pudo guardar la tarea', result.error);
    toast.success(task ? 'Tarea actualizada' : 'Tarea creada');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? 'Editar tarea' : 'Nueva tarea'}
      description="Vincule la tarea a un prospecto, cliente o expediente para dar seguimiento."
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={save}>
            {task ? 'Guardar cambios' : 'Crear tarea'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Tarea" required error={errors.title}>
          {(id) => <Input id={id} value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="Ej.: Llamar al prospecto para confirmar la cita" invalid={Boolean(errors.title)} />}
        </Field>
        <Field label="Detalle">
          {(id) => <Textarea id={id} value={draft.description} onChange={(e) => set('description', e.target.value)} />}
        </Field>
        <FormGrid>
          <Field label="Vincular a">
            {(id) => (
              <Select id={id} value={draft.relatedType ?? ''} onChange={(e) => setDraft((d) => ({ ...d, relatedType: (e.target.value || null) as RelatedType | null, relatedId: null }))}>
                <option value="">Sin vínculo</option>
                <option value="prospecto">Prospecto</option>
                <option value="cliente">Cliente</option>
                <option value="expediente">Expediente</option>
              </Select>
            )}
          </Field>
          <Field label="Registro" error={errors.relatedId}>
            {(id) => (
              <Select id={id} value={draft.relatedId ?? ''} onChange={(e) => set('relatedId', e.target.value || null)} disabled={!draft.relatedType} invalid={Boolean(errors.relatedId)}>
                <option value="">{draft.relatedType ? 'Seleccione…' : '—'}</option>
                {relatedOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Responsable" required error={errors.assigneeId}>
            {(id) => (
              <Select id={id} value={draft.assigneeId} onChange={(e) => set('assigneeId', e.target.value)}>
                {state.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {memberFull(m)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Fecha límite" required error={errors.dueDate}>
            {(id) => <Input id={id} type="date" value={draft.dueDate} onChange={(e) => set('dueDate', e.target.value)} invalid={Boolean(errors.dueDate)} />}
          </Field>
          <Field label="Prioridad">
            {(id) => (
              <Select id={id} value={draft.priority} onChange={(e) => set('priority', e.target.value as Draft['priority'])}>
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Estado">
            {(id) => (
              <Select id={id} value={draft.status} onChange={(e) => set('status', e.target.value as Draft['status'])}>
                {TASK_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </FormGrid>
        <Checkbox checked={draft.reminder} onChange={(v) => set('reminder', v)} label="Recordarme el día del vencimiento" />
      </div>
    </Modal>
  );
}

function blank(userId: string, defaults?: Partial<Draft>): Draft {
  return {
    title: '',
    description: '',
    relatedType: null,
    relatedId: null,
    assigneeId: userId,
    priority: 'media',
    dueDate: addDays(todayISO(), 2),
    status: 'pendiente',
    reminder: true,
    ...defaults,
  };
}
