'use client';

import { useEffect, useMemo, useState } from 'react';
import { AREA_LIST } from '@/crm/constants';
import { memberFull } from '@/crm/lib/people';
import { getService, servicesOfArea } from '@/crm/knowledge/services';
import * as crm from '@/crm/store/actions';
import { lawyersOf } from '@/crm/store/selectors';
import { useCrm } from '@/crm/store/store';
import type { AreaId, CaseFile } from '@/crm/types';
import { Button } from '../ui/Button';
import { Field, FormGrid, Input, Select, Textarea } from '../ui/Form';
import { Modal } from '../ui/Overlay';
import { useToast } from '../ui/Toast';

type Draft = crm.CaseInput;

export function CaseForm({
  open,
  onClose,
  file,
  defaults,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  file?: CaseFile | null;
  defaults?: Partial<Draft>;
  onSaved?: (id: string) => void;
}) {
  const state = useCrm();
  const toast = useToast();
  const lawyers = useMemo(() => lawyersOf(state.members), [state.members]);
  const blank = (): Draft => ({
    clientId: '',
    area: 'familia',
    serviceSlug: servicesOfArea('familia')[0].slug,
    procedure: servicesOfArea('familia')[0].name,
    lawyerId: lawyers[0]?.id ?? '',
    counterparty: '',
    courtFileNumber: null,
    court: null,
    description: '',
    ...defaults,
  });
  const [draft, setDraft] = useState<Draft>(blank);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (file) {
      const { id: _i, code: _c, status: _s, openedAt: _o, timeline: _t, deadlines: _d, notes: _n, ...rest } = file;
      setDraft(rest);
    } else setDraft(blank());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file?.id]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const save = () => {
    const found = crm.validateCase(draft);
    setErrors(found);
    if (Object.keys(found).length) return;
    const payload = { ...draft, courtFileNumber: draft.courtFileNumber?.trim() || null, court: draft.court?.trim() || null };
    const r = file ? crm.updateCase(file.id, payload) : crm.createCase(payload);
    if (!r.ok) return toast.error('No se pudo guardar', r.error);
    toast.success(file ? 'Expediente actualizado' : 'Expediente abierto');
    onSaved?.('id' in r ? String(r.id) : (file?.id ?? ''));
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={file ? `Editar expediente ${file.code}` : 'Nuevo expediente'}
      description="El código interno se asigna automáticamente al crearlo."
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={save}>
            {file ? 'Guardar cambios' : 'Abrir expediente'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormGrid>
          <Field label="Cliente" required error={errors.clientId}>
            {(id) => (
              <Select id={id} value={draft.clientId} onChange={(e) => {
                const c = state.clients.find((x) => x.id === e.target.value);
                setDraft((d) => ({ ...d, clientId: e.target.value, ...(c && !file ? { lawyerId: c.lawyerId } : {}) }));
              }} invalid={Boolean(errors.clientId)} disabled={Boolean(file)}>
                <option value="">Seleccione…</option>
                {state.clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Abogado responsable" required error={errors.lawyerId}>
            {(id) => (
              <Select id={id} value={draft.lawyerId} onChange={(e) => set('lawyerId', e.target.value)}>
                {lawyers.map((l) => (
                  <option key={l.id} value={l.id}>{memberFull(l)}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Área jurídica" required>
            {(id) => (
              <Select id={id} value={draft.area} onChange={(e) => {
                const area = e.target.value as AreaId;
                const first = servicesOfArea(area)[0];
                setDraft((d) => ({ ...d, area, serviceSlug: first.slug, procedure: first.name }));
              }}>
                {AREA_LIST.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Servicio" required error={errors.serviceSlug}>
            {(id) => (
              <Select id={id} value={draft.serviceSlug} onChange={(e) => setDraft((d) => ({ ...d, serviceSlug: e.target.value, procedure: getService(e.target.value)?.name ?? d.procedure }))}>
                {servicesOfArea(draft.area).map((s) => (
                  <option key={s.slug} value={s.slug}>{s.name}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Tipo de procedimiento" required error={errors.procedure} className="sm:col-span-2">
            {(id) => <Input id={id} value={draft.procedure} onChange={(e) => set('procedure', e.target.value)} invalid={Boolean(errors.procedure)} placeholder="Ej.: Proceso único de alimentos" />}
          </Field>
          <Field label="Contraparte">{(id) => <Input id={id} value={draft.counterparty} onChange={(e) => set('counterparty', e.target.value)} placeholder="Persona o entidad contraria" />}</Field>
          <Field label="N.º de expediente judicial" hint="Solo cuando corresponda.">{(id) => <Input id={id} value={draft.courtFileNumber ?? ''} onChange={(e) => set('courtFileNumber', e.target.value)} placeholder="00000-2026-0-1801-JR-FC-00" />}</Field>
          <Field label="Juzgado o entidad" className="sm:col-span-2">{(id) => <Input id={id} value={draft.court ?? ''} onChange={(e) => set('court', e.target.value)} />}</Field>
        </FormGrid>
        <Field label="Descripción">{(id) => <Textarea id={id} value={draft.description} onChange={(e) => set('description', e.target.value)} />}</Field>
      </div>
    </Modal>
  );
}
