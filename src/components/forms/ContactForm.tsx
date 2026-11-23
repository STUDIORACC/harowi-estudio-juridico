'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Checkbox, Textarea } from '@/components/ui/Textarea';
import { FormMessage, SubmitButton } from './FormFeedback';
import { submitContact } from '@/app/actions/public';
import { initialFormState } from '@/lib/forms/state';
import { routes } from '@/config/site';

/** Formulario breve de la página de contacto. Los casos extensos van a /consulta. */
export function ContactForm() {
  const [state, formAction] = useActionState(submitContact, initialFormState);
  const errors = state.errors ?? {};
  const sent = state.status === 'success' || state.status === 'demo';

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <FormMessage state={state} />

      {!sent ? (
        <>
          <Field label="Nombre completo" htmlFor="contact_name" required error={errors.full_name}>
            <Input
              id="contact_name"
              name="full_name"
              autoComplete="name"
              placeholder="Nombres y apellidos"
              invalid={Boolean(errors.full_name)}
              required
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Correo electrónico" htmlFor="contact_email" required error={errors.email}>
              <Input
                id="contact_email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="nombre@correo.com"
                invalid={Boolean(errors.email)}
                required
              />
            </Field>

            <Field label="Teléfono" htmlFor="contact_phone" required error={errors.phone}>
              <Input
                id="contact_phone"
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

          <Field label="Mensaje" htmlFor="contact_message" required error={errors.description}>
            <Textarea
              id="contact_message"
              name="description"
              rows={5}
              placeholder="¿En qué podemos ayudarle?"
              invalid={Boolean(errors.description)}
              required
            />
          </Field>

          <Checkbox
            id="contact_consent"
            name="consent"
            error={errors.consent}
            label={
              <>
                Autorizo el tratamiento de mis datos para responder a este mensaje, conforme a la{' '}
                <Link href={routes.privacy} className="link-underline text-ink">
                  política de privacidad
                </Link>
                .
              </>
            }
          />

          <SubmitButton className="w-full sm:w-auto">Enviar mensaje</SubmitButton>

          <p className="text-2xs leading-relaxed text-ink-muted">
            ¿Su caso necesita más detalle?{' '}
            <Link href={routes.consultation} className="link-underline text-ink">
              Use el formulario de consulta
            </Link>
            , que permite adjuntar el área, el servicio y una descripción extensa.
          </p>
        </>
      ) : null}
    </form>
  );
}
