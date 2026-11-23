'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox, Textarea } from '@/components/ui/Textarea';
import { FormMessage, SubmitButton } from './FormFeedback';
import { submitConsultation } from '@/app/actions/public';
import { initialFormState } from '@/lib/forms/state';
import { routes } from '@/config/site';
import type { AreaWithServices } from '@/types';

/**
 * Formulario «Cuéntenos su caso». La validación definitiva ocurre en la Server
 * Action; aquí solo se controlan las dependencias entre área y servicio y se
 * muestran los mensajes devueltos por el servidor.
 */
export function ConsultationForm({
  areas,
  defaultServiceSlug,
}: {
  areas: AreaWithServices[];
  defaultServiceSlug?: string;
}) {
  const [state, formAction] = useActionState(submitConsultation, initialFormState);

  // Preselección desde /consulta?servicio=slug (enlaces de las páginas de servicio).
  const preselected = useMemo(() => {
    if (!defaultServiceSlug) return null;
    for (const area of areas) {
      const service = area.services.find((item) => item.slug === defaultServiceSlug);
      if (service) return { areaId: area.id, serviceId: service.id };
    }
    return null;
  }, [areas, defaultServiceSlug]);

  const [areaId, setAreaId] = useState(preselected?.areaId ?? '');
  const [serviceId, setServiceId] = useState(preselected?.serviceId ?? '');

  const services = areas.find((area) => area.id === areaId)?.services ?? [];
  const errors = state.errors ?? {};
  const sent = state.status === 'success' || state.status === 'demo';

  return (
    <form action={formAction} className="space-y-7" noValidate>
      <FormMessage state={state} />

      {!sent ? (
        <>
          <fieldset className="space-y-6">
            <legend className="overline mb-5">Sus datos</legend>

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

              <Field
                label="WhatsApp"
                htmlFor="whatsapp"
                error={errors.whatsapp}
                hint="Si es distinto del teléfono."
              >
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  placeholder="999 999 999"
                  invalid={Boolean(errors.whatsapp)}
                />
              </Field>
            </div>

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
          </fieldset>

          <fieldset className="space-y-6 border-t border-line pt-7">
            <legend className="overline mb-5">Su caso</legend>

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
                  invalid={Boolean(errors.service_id)}
                  onChange={(event) => setServiceId(event.target.value)}
                >
                  <option value="">
                    {areaId ? 'Seleccione un servicio' : 'Sin seleccionar'}
                  </option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field
              label="Descripción del caso"
              htmlFor="description"
              required
              error={errors.description}
              hint="Cuente lo ocurrido con sus propias palabras: fechas, documentos recibidos y qué necesita resolver."
            >
              <Textarea
                id="description"
                name="description"
                rows={7}
                placeholder="Describa su situación…"
                invalid={Boolean(errors.description)}
                required
              />
            </Field>
          </fieldset>

          <fieldset className="space-y-6 border-t border-line pt-7">
            <legend className="overline mb-5">Atención</legend>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Modalidad" htmlFor="modality" required error={errors.modality}>
                <Select
                  id="modality"
                  name="modality"
                  defaultValue="presencial"
                  invalid={Boolean(errors.modality)}
                >
                  <option value="presencial">Presencial en la oficina</option>
                  <option value="virtual">Virtual (videollamada)</option>
                </Select>
              </Field>

              <Field
                label="Preferencia de contacto"
                htmlFor="preferred_contact"
                required
                error={errors.preferred_contact}
              >
                <Select
                  id="preferred_contact"
                  name="preferred_contact"
                  defaultValue="telefono"
                  invalid={Boolean(errors.preferred_contact)}
                >
                  <option value="telefono">Llamada telefónica</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Correo electrónico</option>
                </Select>
              </Field>
            </div>

            <Checkbox
              id="consent"
              name="consent"
              error={errors.consent}
              label={
                <>
                  Autorizo el tratamiento de mis datos personales para atender esta consulta,
                  conforme a la{' '}
                  <Link href={routes.privacy} className="link-underline text-ink">
                    política de privacidad
                  </Link>
                  .
                </>
              }
            />
          </fieldset>

          <div className="border-t border-line pt-7">
            <SubmitButton className="w-full sm:w-auto">Solicitar consulta</SubmitButton>
            <p className="mt-4 text-2xs leading-relaxed text-ink-muted">
              El envío de este formulario no genera relación abogado-cliente ni constituye asesoría
              jurídica sobre su caso.
            </p>
          </div>
        </>
      ) : null}
    </form>
  );
}
