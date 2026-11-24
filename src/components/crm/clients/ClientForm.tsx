'use client';

import { useEffect, useMemo, useState } from 'react';
import { memberFull } from '@/crm/lib/people';
import * as crm from '@/crm/store/actions';
import { lawyersOf } from '@/crm/store/selectors';
import { useCrm } from '@/crm/store/store';
import type { Client } from '@/crm/types';
import { Button } from '../ui/Button';
import { Field, FormGrid, Input, Select, Textarea } from '../ui/Form';
import { Modal } from '../ui/Overlay';
import { useToast } from '../ui/Toast';

type Draft = crm.ClientInput;

const blank = (lawyerId: string): Draft => ({
  name: '',
  kind: 'persona',
  docType: 'DNI',
  docNumber: '',
  phone: '',
  email: '',
  district: '',
  lawyerId,
  status: 'activo',
  notes: '',
});

export function ClientForm({ open, onClose, client, onSaved }: { open: boolean; onClose: () => void; client?: Client | null; onSaved?: (id: string) => void }) {
  const state = useCrm();
  const toast = useToast();
  const lawyers = useMemo(() => lawyersOf(state.members), [state.members]);
  const [draft, setDraft] = useState<Draft>(() => blank(lawyers[0]?.id ?? ''));
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (client) {
      const { id: _i, since: _s, prospectId: _p, ...rest } = client;
      setDraft(rest);
    } else setDraft(blank(lawyers[0]?.id ?? ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client?.id]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const save = () => {
    const found = crm.validateClient(draft);
    setErrors(found);
    if (Object.keys(found).length) return;
    const r = client ? crm.updateClient(client.id, draft) : crm.createClient(draft);
    if (!r.ok) return toast.error('No se pudo guardar', r.error);
    toast.success(client ? 'Cliente actualizado' : 'Cliente registrado', draft.name);
    onSaved?.('id' in r ? String(r.id) : (client?.id ?? ''));
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={client ? 'Editar cliente' : 'Nuevo cliente'}
      description="Datos de identificación y contacto. Los clientes pueden tener uno o varios expedientes."
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={save}>
            {client ? 'Guardar cambios' : 'Registrar cliente'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormGrid>
          <Field label={draft.kind === 'empresa' ? 'Razón social' : 'Nombre completo'} required error={errors.name} className="sm:col-span-2">
            {(id) => <Input id={id} value={draft.name} onChange={(e) => set('name', e.target.value)} invalid={Boolean(errors.name)} autoComplete="off" />}
          </Field>
          <Field label="Tipo de cliente">
            {(id) => (
              <Select id={id} value={draft.kind} onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value as Draft['kind'], docType: e.target.value === 'empresa' ? 'RUC' : 'DNI' }))}>
                <option value="persona">Persona natural</option>
                <option value="empresa">Empresa</option>
              </Select>
            )}
          </Field>
          <div className="grid grid-cols-[7.5rem_1fr] gap-2">
            <Field label="Documento" required>
              {(id) => (
                <Select id={id} value={draft.docType} onChange={(e) => set('docType', e.target.value as Draft['docType'])}>
                  <option value="DNI">DNI</option>
                  <option value="CE">CE</option>
                  <option value="RUC">RUC</option>
                </Select>
              )}
            </Field>
            <Field label="Número" required error={errors.docNumber}>
              {(id) => <Input id={id} value={draft.docNumber} onChange={(e) => set('docNumber', e.target.value)} invalid={Boolean(errors.docNumber)} inputMode="numeric" />}
            </Field>
          </div>
          <Field label="Teléfono" error={errors.phone}>
            {(id) => <Input id={id} value={draft.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+51 900 000 000" invalid={Boolean(errors.phone)} inputMode="tel" />}
          </Field>
          <Field label="Correo electrónico" error={errors.email}>
            {(id) => <Input id={id} type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} invalid={Boolean(errors.email)} />}
          </Field>
          <Field label="Distrito">{(id) => <Input id={id} value={draft.district} onChange={(e) => set('district', e.target.value)} />}</Field>
          <Field label="Abogado responsable" required error={errors.lawyerId}>
            {(id) => (
              <Select id={id} value={draft.lawyerId} onChange={(e) => set('lawyerId', e.target.value)}>
                {lawyers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {memberFull(l)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Estado">
            {(id) => (
              <Select id={id} value={draft.status} onChange={(e) => set('status', e.target.value as Draft['status'])}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </Select>
            )}
          </Field>
        </FormGrid>
        <Field label="Notas internas">{(id) => <Textarea id={id} value={draft.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Preferencias de contacto, observaciones…" />}</Field>
      </div>
    </Modal>
  );
}
