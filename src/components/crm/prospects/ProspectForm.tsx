'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { AREA_LIST, CHANNEL_LIST, PRIORITIES, STAGES } from '@/crm/constants';
import { todayISO } from '@/crm/lib/dates';
import { memberFull } from '@/crm/lib/people';
import { servicesOfArea } from '@/crm/knowledge/services';
import * as crm from '@/crm/store/actions';
import { findDuplicates, lawyersOf } from '@/crm/store/selectors';
import { useCrm } from '@/crm/store/store';
import type { AreaId, ChannelId, Prospect } from '@/crm/types';
import { Button } from '../ui/Button';
import { Field, FormGrid, Input, Select, Textarea } from '../ui/Form';
import { Modal } from '../ui/Overlay';
import { useToast } from '../ui/Toast';

type Draft = crm.ProspectInput;

const blank = (): Draft => ({
  name: '',
  phone: '',
  email: '',
  channel: 'whatsapp',
  area: 'familia',
  serviceSlug: null,
  description: '',
  priority: 'media',
  stage: 'nuevo',
  lawyerId: null,
  contactDate: todayISO(),
  nextAction: 'Contactar y ofrecer una consulta inicial',
  nextActionDate: todayISO(),
});

export function ProspectForm({ open, onClose, prospect, onSaved }: { open: boolean; onClose: () => void; prospect?: Prospect | null; onSaved?: (id: string) => void }) {
  const state = useCrm();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(blank);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const lawyers = useMemo(() => lawyersOf(state.members), [state.members]);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (prospect) {
      const { id: _i, createdAt: _c, history: _h, clientId: _cl, closedReason: _cr, ...rest } = prospect;
      setDraft(rest);
    } else setDraft(blank());
  }, [open, prospect]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  // Detección de contactos duplicados mientras se escribe.
  const dupes = useMemo(() => findDuplicates(state, { name: draft.name, phone: draft.phone, email: draft.email, excludeProspectId: prospect?.id }), [state, draft.name, draft.phone, draft.email, prospect?.id]);
  const hasDupes = dupes.prospects.length + dupes.clients.length > 0;

  const save = () => {
    const found = crm.validateProspect(draft);
    setErrors(found);
    if (Object.keys(found).length) return;
    const result = prospect ? crm.updateProspect(prospect.id, draft) : crm.createProspect(draft);
    if (!result.ok) return toast.error('No se pudo guardar', result.error);
    toast.success(prospect ? 'Prospecto actualizado' : 'Prospecto creado', draft.name);
    onSaved?.('id' in result ? String(result.id) : (prospect?.id ?? ''));
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={prospect ? 'Editar prospecto' : 'Nuevo prospecto'}
      description="Registre a la persona que consultó o fue captada por un canal."
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={save}>
            {prospect ? 'Guardar cambios' : hasDupes ? 'Guardar de todos modos' : 'Crear prospecto'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {hasDupes ? (
          <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[0.8125rem] text-amber-900">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              Posible contacto duplicado
            </p>
            <ul className="mt-1.5 space-y-0.5 pl-6">
              {dupes.prospects.map((p) => (
                <li key={p.id} className="list-disc">
                  Prospecto{' '}
                  <Link href={`/crm/prospectos?id=${p.id}`} className="font-medium underline" onClick={onClose}>
                    {p.name}
                  </Link>{' '}
                  ({p.phone || p.email})
                </li>
              ))}
              {dupes.clients.map((c) => (
                <li key={c.id} className="list-disc">
                  Cliente{' '}
                  <Link href={`/crm/clientes?id=${c.id}`} className="font-medium underline" onClick={onClose}>
                    {c.name}
                  </Link>{' '}
                  ({c.phone || c.email})
                </li>
              ))}
            </ul>
            <p className="mt-1.5 pl-6 text-xs text-amber-800">Puede guardar igualmente si se trata de otra persona.</p>
          </div>
        ) : null}

        <FormGrid>
          <Field label="Nombre completo" required error={errors.name}>
            {(id) => <Input id={id} value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Nombre y apellidos" invalid={Boolean(errors.name)} autoComplete="off" />}
          </Field>
          <Field label="Canal de origen" required>
            {(id) => (
              <Select id={id} value={draft.channel} onChange={(e) => set('channel', e.target.value as ChannelId)}>
                {CHANNEL_LIST.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Teléfono" error={errors.phone}>
            {(id) => <Input id={id} value={draft.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+51 900 000 000" invalid={Boolean(errors.phone)} inputMode="tel" />}
          </Field>
          <Field label="Correo electrónico" error={errors.email}>
            {(id) => <Input id={id} type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} placeholder="correo@example.com" invalid={Boolean(errors.email)} />}
          </Field>
          <Field label="Área jurídica">
            {(id) => (
              <Select id={id} value={draft.area ?? ''} onChange={(e) => setDraft((d) => ({ ...d, area: (e.target.value || null) as AreaId | null, serviceSlug: null }))}>
                <option value="">Por clasificar</option>
                {AREA_LIST.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Servicio solicitado" error={errors.serviceSlug}>
            {(id) => (
              <Select id={id} value={draft.serviceSlug ?? ''} onChange={(e) => set('serviceSlug', e.target.value || null)} disabled={!draft.area}>
                <option value="">Por definir</option>
                {draft.area
                  ? servicesOfArea(draft.area).map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {s.name}
                      </option>
                    ))
                  : null}
              </Select>
            )}
          </Field>
        </FormGrid>

        <Field label="Descripción inicial" hint="Resumen breve del motivo de la consulta. Evite datos sensibles innecesarios.">
          {(id) => <Textarea id={id} value={draft.description} onChange={(e) => set('description', e.target.value)} />}
        </Field>

        <FormGrid cols={3}>
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
          <Field label="Estado comercial">
            {(id) => (
              <Select id={id} value={draft.stage} onChange={(e) => set('stage', e.target.value as Draft['stage'])} disabled={Boolean(prospect)} title={prospect ? 'Cambie la etapa desde la ficha o el pipeline' : undefined}>
                {STAGES.filter((s) => prospect || (s.id !== 'contratado' && s.id !== 'cerrado')).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Abogado asignado">
            {(id) => (
              <Select id={id} value={draft.lawyerId ?? ''} onChange={(e) => set('lawyerId', e.target.value || null)}>
                <option value="">Sin asignar</option>
                {lawyers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {memberFull(l)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Fecha de contacto" required error={errors.contactDate}>
            {(id) => <Input id={id} type="date" value={draft.contactDate} onChange={(e) => set('contactDate', e.target.value)} invalid={Boolean(errors.contactDate)} />}
          </Field>
          <Field label="Próxima acción" className="sm:col-span-1">
            {(id) => <Input id={id} value={draft.nextAction} onChange={(e) => set('nextAction', e.target.value)} />}
          </Field>
          <Field label="Fecha de la próxima acción">
            {(id) => <Input id={id} type="date" value={draft.nextActionDate ?? ''} onChange={(e) => set('nextActionDate', e.target.value || null)} />}
          </Field>
        </FormGrid>
      </div>
    </Modal>
  );
}
