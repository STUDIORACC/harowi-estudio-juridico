'use client';

import Link from 'next/link';
import { useActionState, useEffect, useMemo, useState, useTransition } from 'react';
import { CalendarDays, Clock, Loader2, UserRound } from 'lucide-react';
import { Calendar } from '@/components/ui/Calendar';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox, Textarea } from '@/components/ui/Textarea';
import { FormMessage, SubmitButton } from './FormFeedback';
import { fetchSlots, requestAppointment } from '@/app/actions/public';
import { initialFormState } from '@/lib/forms/state';
import { routes } from '@/config/site';
import { formatDateWithWeekday, toISODate } from '@/lib/scheduling';
import type { AreaWithServices, LawyerAvailability, LawyerWithAreas } from '@/types';
import { cn } from '@/lib/utils';

interface Slot {
  time: string;
  available: boolean;
}

/**
 * Solicitud de cita en cuatro pasos: área, profesional, fecha y horario, y
 * datos de contacto. Los horarios ocupados se consultan al servidor mediante
 * una función que solo devuelve las horas tomadas, nunca datos de terceros.
 */
export function AppointmentForm({
  areas,
  lawyers,
  availability,
  blockedDates,
  defaultLawyerSlug,
  defaultAreaSlug,
}: {
  areas: AreaWithServices[];
  lawyers: LawyerWithAreas[];
  availability: LawyerAvailability[];
  blockedDates: string[];
  defaultLawyerSlug?: string;
  defaultAreaSlug?: string;
}) {
  const [state, formAction] = useActionState(requestAppointment, initialFormState);

  const defaults = useMemo(() => {
    const lawyer = lawyers.find((item) => item.slug === defaultLawyerSlug);
    const area =
      areas.find((item) => item.slug === defaultAreaSlug) ??
      (lawyer ? areas.find((item) => lawyer.areas.some((a) => a.id === item.id)) : undefined);
    return { lawyerId: lawyer?.id ?? '', areaId: area?.id ?? '' };
  }, [areas, lawyers, defaultAreaSlug, defaultLawyerSlug]);

  const [areaId, setAreaId] = useState(defaults.areaId);
  const [serviceId, setServiceId] = useState('');
  const [lawyerId, setLawyerId] = useState(defaults.lawyerId);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, startLoadingSlots] = useTransition();

  const services = areas.find((area) => area.id === areaId)?.services ?? [];

  /** Profesionales del área seleccionada (todos si no se eligió área). */
  const availableLawyers = areaId
    ? lawyers.filter((lawyer) => lawyer.areas.some((area) => area.id === areaId))
    : lawyers;

  /** Días de la semana en los que atiende el profesional seleccionado. */
  const availableWeekdays = useMemo(() => {
    if (!lawyerId) return undefined;
    return [
      ...new Set(
        availability
          .filter((slot) => slot.lawyer_id === lawyerId && slot.is_active)
          .map((slot) => slot.weekday),
      ),
    ];
  }, [availability, lawyerId]);

  // Si el profesional deja de pertenecer al área elegida, se limpia la selección.
  useEffect(() => {
    if (lawyerId && !availableLawyers.some((lawyer) => lawyer.id === lawyerId)) {
      setLawyerId('');
      setDate(null);
      setTime('');
    }
  }, [availableLawyers, lawyerId]);

  // Carga de horarios cada vez que cambia el profesional o la fecha.
  useEffect(() => {
    if (!lawyerId || !date) {
      setSlots([]);
      return;
    }
    startLoadingSlots(async () => {
      const result = await fetchSlots(lawyerId, date);
      setSlots(result);
      setTime('');
    });
  }, [lawyerId, date]);

  const errors = state.errors ?? {};
  const sent = state.status === 'success' || state.status === 'demo';
  const today = toISODate(new Date());

  if (sent) {
    return (
      <div className="space-y-6">
        <FormMessage state={state} />
        <div className="rounded-2xl border border-line bg-paper p-6 sm:p-7">
          <p className="overline mb-4">Resumen de la solicitud</p>
          <dl className="space-y-2.5 text-[0.9375rem]">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Profesional</dt>
              <dd className="text-right text-ink">
                {lawyers.find((lawyer) => lawyer.id === lawyerId)?.name ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Fecha</dt>
              <dd className="text-right text-ink">
                {date ? formatDateWithWeekday(date) : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Hora</dt>
              <dd className="text-right text-ink">{time || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Estado</dt>
              <dd className="text-right text-ink">Pendiente de confirmación</dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-9" noValidate>
      <FormMessage state={state} />

      {/* -------------------------- 1. Área y servicio -------------------------- */}
      <fieldset>
        <legend className="mb-5 flex items-center gap-2.5">
          <span className="font-display text-2xs tabular-nums text-accent">01</span>
          <span className="text-[0.9375rem] font-medium text-ink">Materia de la consulta</span>
        </legend>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Área jurídica" htmlFor="area_id" error={errors.area_id}>
            <Select
              id="area_id"
              name="area_id"
              value={areaId}
              invalid={Boolean(errors.area_id)}
              onChange={(event) => {
                setAreaId(event.target.value);
                setServiceId('');
              }}
            >
              <option value="">Seleccione un área</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Servicio"
            htmlFor="service_id"
            error={errors.service_id}
            hint={!areaId ? 'Seleccione primero un área.' : undefined}
          >
            <Select
              id="service_id"
              name="service_id"
              value={serviceId}
              disabled={!areaId}
              onChange={(event) => setServiceId(event.target.value)}
            >
              <option value="">{areaId ? 'Seleccione un servicio' : 'Sin seleccionar'}</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </fieldset>

      {/* ----------------------------- 2. Profesional --------------------------- */}
      <fieldset className="border-t border-line pt-8">
        <legend className="mb-5 flex items-center gap-2.5">
          <span className="font-display text-2xs tabular-nums text-accent">02</span>
          <span className="text-[0.9375rem] font-medium text-ink">Profesional</span>
        </legend>

        <input type="hidden" name="lawyer_id" value={lawyerId} />

        <ul className="grid gap-3 sm:grid-cols-2">
          {availableLawyers.map((lawyer) => {
            const selected = lawyerId === lawyer.id;
            return (
              <li key={lawyer.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setLawyerId(lawyer.id);
                    setDate(null);
                    setTime('');
                  }}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all duration-300',
                    selected
                      ? 'border-ink bg-paper-alt'
                      : 'border-line bg-paper hover:border-ink/25',
                  )}
                >
                  <UserRound
                    className={cn('mt-0.5 h-4 w-4 shrink-0', selected ? 'text-accent' : 'text-ink-muted')}
                    aria-hidden
                  />
                  <span>
                    <span className="block text-[0.9375rem] text-ink">{lawyer.name}</span>
                    <span className="mt-0.5 block text-2xs text-ink-muted">{lawyer.role}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {errors.lawyer_id ? (
          <p role="alert" className="mt-3 text-[0.8125rem] text-red-600">
            {errors.lawyer_id}
          </p>
        ) : null}
      </fieldset>

      {/* -------------------------- 3. Fecha y horario -------------------------- */}
      <fieldset className="border-t border-line pt-8">
        <legend className="mb-5 flex items-center gap-2.5">
          <span className="font-display text-2xs tabular-nums text-accent">03</span>
          <span className="text-[0.9375rem] font-medium text-ink">Fecha y horario</span>
        </legend>

        <input type="hidden" name="scheduled_date" value={date ?? ''} />
        <input type="hidden" name="scheduled_time" value={time} />

        {!lawyerId ? (
          <p className="rounded-xl border border-dashed border-line px-5 py-6 text-[0.875rem] text-ink-muted">
            Seleccione primero un profesional para ver su disponibilidad.
          </p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <Calendar
                value={date}
                onChange={setDate}
                minDate={today}
                availableWeekdays={availableWeekdays}
                blockedDates={blockedDates}
              />
              {errors.scheduled_date ? (
                <p role="alert" className="mt-3 text-[0.8125rem] text-red-600">
                  {errors.scheduled_date}
                </p>
              ) : null}
            </div>

            <div>
              <p className="mb-4 flex items-center gap-2 text-[0.8125rem] font-medium text-ink">
                <Clock className="h-3.5 w-3.5 text-accent" aria-hidden />
                {date ? formatDateWithWeekday(date) : 'Seleccione una fecha'}
              </p>

              {loadingSlots ? (
                <p className="flex items-center gap-2 text-[0.875rem] text-ink-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Consultando disponibilidad…
                </p>
              ) : !date ? (
                <p className="text-[0.875rem] text-ink-muted">
                  Los horarios disponibles aparecerán aquí.
                </p>
              ) : slots.length === 0 ? (
                <p className="text-[0.875rem] text-ink-muted">
                  No hay atención programada para esa fecha. Seleccione otro día.
                </p>
              ) : (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3">
                  {slots.map((slot) => (
                    <li key={slot.time}>
                      <button
                        type="button"
                        disabled={!slot.available}
                        aria-pressed={time === slot.time}
                        onClick={() => setTime(slot.time)}
                        className={cn(
                          'w-full rounded-lg border px-2 py-2.5 text-[0.8125rem] tabular-nums transition-all duration-200',
                          !slot.available && 'cursor-not-allowed border-line text-ink-muted/40 line-through',
                          slot.available && time !== slot.time && 'border-line text-ink-soft hover:border-ink/30 hover:text-ink',
                          time === slot.time && 'border-ink bg-ink font-medium text-paper',
                        )}
                      >
                        {slot.time}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {errors.scheduled_time ? (
                <p role="alert" className="mt-3 text-[0.8125rem] text-red-600">
                  {errors.scheduled_time}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </fieldset>

      {/* ----------------------------- 4. Sus datos ----------------------------- */}
      <fieldset className="border-t border-line pt-8">
        <legend className="mb-5 flex items-center gap-2.5">
          <span className="font-display text-2xs tabular-nums text-accent">04</span>
          <span className="text-[0.9375rem] font-medium text-ink">Sus datos</span>
        </legend>

        <div className="space-y-6">
          <Field label="Nombre completo" htmlFor="full_name" required error={errors.full_name}>
            <Input
              id="full_name"
              name="full_name"
              autoComplete="name"
              placeholder="Nombres y apellidos"
              invalid={Boolean(errors.full_name)}
              required
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Correo electrónico" htmlFor="email" required error={errors.email}>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="nombre@correo.com"
                invalid={Boolean(errors.email)}
                required
              />
            </Field>

            <Field label="Teléfono" htmlFor="phone" required error={errors.phone}>
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="999 999 999"
                invalid={Boolean(errors.phone)}
                required
              />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Modalidad" htmlFor="modality" required error={errors.modality}>
              <Select id="modality" name="modality" defaultValue="presencial">
                <option value="presencial">Presencial en la oficina</option>
                <option value="virtual">Virtual (videollamada)</option>
              </Select>
            </Field>

            <Field label="Asunto" htmlFor="subject" error={errors.subject}>
              <Input
                id="subject"
                name="subject"
                placeholder="Motivo de la reunión"
                invalid={Boolean(errors.subject)}
              />
            </Field>
          </div>

          <Field
            label="Comentarios"
            htmlFor="notes"
            error={errors.notes}
            hint="Información que ayude a preparar la reunión."
          >
            <Textarea id="notes" name="notes" rows={4} placeholder="Opcional…" />
          </Field>

          <Checkbox
            id="consent"
            name="consent"
            error={errors.consent}
            label={
              <>
                Autorizo el tratamiento de mis datos personales para gestionar esta cita, conforme a
                la{' '}
                <Link href={routes.privacy} className="link-underline text-ink">
                  política de privacidad
                </Link>
                .
              </>
            }
          />
        </div>
      </fieldset>

      <div className="border-t border-line pt-8">
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.875rem] text-ink-soft">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-accent" aria-hidden />
            {date ? formatDateWithWeekday(date) : 'Sin fecha seleccionada'}
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-accent" aria-hidden />
            {time || 'Sin horario seleccionado'}
          </span>
        </div>

        <SubmitButton className="w-full sm:w-auto">Solicitar cita</SubmitButton>
        <p className="mt-4 text-2xs leading-relaxed text-ink-muted">
          La solicitud queda registrada como pendiente. El estudio la confirma, reprograma o cancela
          y se lo comunica por el canal indicado.
        </p>
      </div>
    </form>
  );
}
