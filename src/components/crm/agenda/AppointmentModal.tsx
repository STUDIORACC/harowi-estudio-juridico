'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarX2, Info } from 'lucide-react';
import { APPOINTMENT_KINDS, APPOINTMENT_KIND_BY_ID, APPOINTMENT_STATUSES, AREA_LIST } from '@/crm/constants';
import { formatDate, todayISO } from '@/crm/lib/dates';
import { memberFull } from '@/crm/lib/people';
import { freeSlots } from '@/crm/lib/scheduling';
import { servicesOfArea } from '@/crm/knowledge/services';
import * as crm from '@/crm/store/actions';
import { lawyersOf } from '@/crm/store/selectors';
import { useCrm } from '@/crm/store/store';
import type { Appointment, AreaId, Modality } from '@/crm/types';
import { Button } from '../ui/Button';
import { Checkbox, Field, FormGrid, Input, Select, Textarea } from '../ui/Form';
import { Segmented } from '../ui/Layout';
import { Modal } from '../ui/Overlay';
import { useToast } from '../ui/Toast';

type Draft = crm.AppointmentInput;

function blank(defaults: Partial<Draft>, firstLawyer: string): Draft {
  return {
    kind: 'consulta_inicial',
    prospectId: null,
    clientId: null,
    caseId: null,
    lawyerId: firstLawyer,
    area: 'familia',
    serviceSlug: null,
    date: todayISO(),
    time: '',
    durationMin: 45,
    modality: 'presencial',
    status: 'pendiente',
    notes: '',
    reminderWhatsapp: true,
    reminderEmail: false,
    ...defaults,
  };
}

/** Crear, editar o reprogramar una cita. Solo ofrece horarios libres del abogado elegido. */
export function AppointmentModal({
  open,
  onClose,
  appointment,
  defaults,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  defaults?: Partial<Draft>;
  onSaved?: (id: string) => void;
}) {
  const state = useCrm();
  const toast = useToast();
  const lawyers = useMemo(() => lawyersOf(state.members), [state.members]);
  const [draft, setDraft] = useState<Draft>(() => blank(defaults ?? {}, lawyers[0]?.id ?? ''));
  const [personType, setPersonType] = useState<'prospecto' | 'cliente'>('prospecto');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Se reinicia el formulario cada vez que se abre.
  useEffect(() => {
    if (!open) return;
    setError('');
    if (appointment) {
      const { id: _id, source: _s, createdAt: _c, ...rest } = appointment;
      setDraft(rest);
      setPersonType(appointment.clientId ? 'cliente' : 'prospecto');
    } else {
      const d = blank(defaults ?? {}, lawyers[0]?.id ?? '');
      setDraft(d);
      setPersonType(d.clientId ? 'cliente' : 'prospecto');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointment?.id]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const lawyer = state.members.find((m) => m.id === draft.lawyerId);
  const isHearing = draft.kind === 'audiencia';
  const editing = Boolean(appointment);

  const slots = useMemo(() => {
    if (!lawyer || !draft.date) return [];
    const list = freeSlots({ member: lawyer, date: draft.date, appointments: state.appointments, durationMin: draft.durationMin, ignoreId: appointment?.id });
    if (appointment && draft.time && appointment.date === draft.date && appointment.lawyerId === draft.lawyerId && !list.includes(draft.time)) list.push(draft.time);
    return [...new Set(list)].sort();
  }, [lawyer, draft.date, draft.durationMin, draft.time, draft.lawyerId, state.appointments, appointment]);

  // Si el horario elegido deja de estar disponible, se limpia.
  useEffect(() => {
    if (!open || isHearing || !draft.time) return;
    if (!slots.includes(draft.time)) setDraft((d) => ({ ...d, time: '' }));
  }, [slots, open, isHearing, draft.time]);

  const clientCases = state.cases.filter((c) => c.clientId === draft.clientId);
  const services = servicesOfArea(draft.area);

  const pickPerson = (id: string) => {
    if (personType === 'prospecto') {
      const p = state.prospects.find((x) => x.id === id);
      setDraft((d) => ({
        ...d,
        prospectId: id || null,
        clientId: null,
        caseId: null,
        ...(p ? { lawyerId: p.lawyerId ?? d.lawyerId, area: p.area ?? d.area, serviceSlug: p.serviceSlug, reminderEmail: Boolean(p.email) } : {}),
      }));
    } else {
      const c = state.clients.find((x) => x.id === id);
      setDraft((d) => ({ ...d, clientId: id || null, prospectId: null, caseId: null, ...(c ? { lawyerId: c.lawyerId } : {}) }));
    }
  };

  const save = () => {
    setError('');
    setSaving(true);
    const payload: Draft = { ...draft, time: draft.time };
    const result = editing && appointment ? crm.updateAppointment(appointment.id, payload) : crm.createAppointment(payload);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(editing ? 'Cita actualizada' : 'Cita agendada', `${formatDate(draft.date, 'weekday')} a las ${draft.time}`);
    onSaved?.('id' in result ? (result as { id: string }).id : appointment?.id ?? '');
    onClose();
  };

  const personId = personType === 'prospecto' ? draft.prospectId : draft.clientId;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? 'Editar cita' : 'Nueva cita'}
      description="Solo se ofrecen horarios libres dentro de la disponibilidad del abogado: no se pueden duplicar reservas."
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={save} loading={saving} disabled={!draft.time || !personId}>
            {editing ? 'Guardar cambios' : 'Agendar cita'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <CalendarX2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}

        <FormGrid>
          <Field label="Tipo de cita" required>
            {(id) => (
              <Select
                id={id}
                value={draft.kind}
                onChange={(e) => {
                  const kind = e.target.value as Draft['kind'];
                  setDraft((d) => ({ ...d, kind, durationMin: APPOINTMENT_KIND_BY_ID[kind].defaultMinutes, time: '' }));
                }}
              >
                {APPOINTMENT_KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Modalidad">
            {() => (
              <Segmented<Modality>
                value={draft.modality}
                onChange={(v) => set('modality', v)}
                items={[
                  { id: 'presencial', label: 'Presencial' },
                  { id: 'virtual', label: 'Virtual' },
                ]}
              />
            )}
          </Field>
        </FormGrid>

        <div className="rounded-lg border border-slate-200 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[0.8125rem] font-medium text-navy-800">Persona</span>
            <Segmented<'prospecto' | 'cliente'>
              size="sm"
              value={personType}
              onChange={(v) => {
                setPersonType(v);
                setDraft((d) => ({ ...d, prospectId: null, clientId: null, caseId: null }));
              }}
              items={[
                { id: 'prospecto', label: 'Prospecto' },
                { id: 'cliente', label: 'Cliente' },
              ]}
            />
          </div>
          <FormGrid>
            <Field label={personType === 'prospecto' ? 'Prospecto' : 'Cliente'} required>
              {(id) => (
                <Select id={id} value={personId ?? ''} onChange={(e) => pickPerson(e.target.value)}>
                  <option value="">Seleccione…</option>
                  {(personType === 'prospecto' ? state.prospects.filter((p) => p.stage !== 'cerrado' || p.id === personId) : state.clients).map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {personType === 'cliente' ? (
              <Field label="Expediente (opcional)">
                {(id) => (
                  <Select id={id} value={draft.caseId ?? ''} onChange={(e) => {
                    const cf = state.cases.find((c) => c.id === e.target.value);
                    setDraft((d) => ({ ...d, caseId: e.target.value || null, ...(cf ? { area: cf.area, serviceSlug: cf.serviceSlug, lawyerId: cf.lawyerId } : {}) }));
                  }} disabled={!draft.clientId}>
                    <option value="">Sin expediente</option>
                    {clientCases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} · {c.procedure}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            ) : null}
          </FormGrid>
        </div>

        <FormGrid cols={3}>
          <Field label="Abogado" required>
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
          <Field label="Área jurídica">
            {(id) => (
              <Select
                id={id}
                value={draft.area}
                onChange={(e) => setDraft((d) => ({ ...d, area: e.target.value as AreaId, serviceSlug: null }))}
              >
                {AREA_LIST.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Servicio">
            {(id) => (
              <Select id={id} value={draft.serviceSlug ?? ''} onChange={(e) => set('serviceSlug', e.target.value || null)}>
                <option value="">Por definir</option>
                {services.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </FormGrid>

        <FormGrid cols={3}>
          <Field label="Fecha" required>
            {(id) => <Input id={id} type="date" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value, time: '' }))} />}
          </Field>
          <Field label={isHearing ? 'Hora de la audiencia' : 'Hora disponible'} required hint={isHearing ? 'Fijada por el juzgado: la ingresa el abogado.' : undefined}>
            {(id) =>
              isHearing ? (
                <Input id={id} type="time" value={draft.time} onChange={(e) => set('time', e.target.value)} />
              ) : (
                <Select id={id} value={draft.time} onChange={(e) => set('time', e.target.value)} disabled={!slots.length}>
                  <option value="">{slots.length ? 'Seleccione una hora…' : 'Sin horarios libres'}</option>
                  {slots.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              )
            }
          </Field>
          <Field label="Duración">
            {(id) => (
              <Select id={id} value={draft.durationMin} onChange={(e) => setDraft((d) => ({ ...d, durationMin: Number(e.target.value), time: '' }))}>
                {[30, 45, 60, 90, 120].map((m) => (
                  <option key={m} value={m}>
                    {m} minutos
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </FormGrid>

        {!isHearing && lawyer && draft.date && !slots.length ? (
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[0.8125rem] text-amber-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {lawyer.name.split(' ')[0]} no tiene horarios libres el {formatDate(draft.date, 'weekday')}. Pruebe con otra fecha.
          </p>
        ) : null}

        {editing ? (
          <Field label="Estado">
            {(id) => (
              <Select id={id} value={draft.status} onChange={(e) => set('status', e.target.value as Draft['status'])}>
                {APPOINTMENT_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        ) : null}

        <Field label="Observaciones">
          {(id) => <Textarea id={id} value={draft.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Indicaciones para la reunión, documentos a llevar…" />}
        </Field>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-[0.8125rem] font-medium text-navy-800">Recordatorios</span>
          <Checkbox checked={draft.reminderWhatsapp} onChange={(v) => set('reminderWhatsapp', v)} label="WhatsApp" />
          <Checkbox checked={draft.reminderEmail} onChange={(v) => set('reminderEmail', v)} label="Correo electrónico" />
        </div>
        <p className="text-xs text-slate-500">Los recordatorios quedan programados en el CRM; su envío real requiere conectar WhatsApp y correo. Google Calendar: adaptador preparado, no conectado en esta versión.</p>
      </div>
    </Modal>
  );
}
