'use client';

import { useActionState } from 'react';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { FormMessage, SubmitButton } from '@/components/forms/FormFeedback';
import { signIn } from '@/app/actions/auth';
import { initialFormState } from '@/lib/forms/state';

export function LoginForm({
  redirectTo,
  configured,
}: {
  redirectTo?: string;
  configured: boolean;
}) {
  const [state, formAction] = useActionState(signIn, initialFormState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <FormMessage state={state} />

      <input type="hidden" name="redirect" value={redirectTo ?? '/admin'} />

      <Field label="Correo electrónico" htmlFor="email" required error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="nombre@estudio.pe"
          invalid={Boolean(errors.email)}
          required
        />
      </Field>

      <Field label="Contraseña" htmlFor="password" required error={errors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          invalid={Boolean(errors.password)}
          required
        />
      </Field>

      <SubmitButton className="w-full">Entrar al panel</SubmitButton>

      {!configured ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-2xs leading-relaxed text-amber-900">
          Supabase todavía no está conectado. Defina las variables de entorno y cree un usuario en
          Supabase Auth con su fila correspondiente en la tabla <code>profiles</code>. Mientras
          tanto, el panel se puede recorrer en modo solo lectura.
        </p>
      ) : (
        <p className="text-2xs leading-relaxed text-ink-muted">
          Las cuentas las crea el administrador del estudio desde Supabase. Este sitio no permite el
          registro de usuarios.
        </p>
      )}
    </form>
  );
}
