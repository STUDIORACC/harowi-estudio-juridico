'use client';

import { useActionState } from 'react';
import { FormMessage, SubmitButton } from '@/components/forms/FormFeedback';
import { initialFormState, type FormState } from '@/lib/forms/state';
import { cn } from '@/lib/utils';

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/**
 * Envoltura común de los formularios del panel: conecta la Server Action,
 * muestra el resultado y renderiza el botón de envío.
 */
export function AdminForm({
  action,
  children,
  submitLabel = 'Guardar cambios',
  className,
  footer,
}: {
  action: Action;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
  footer?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className={cn('space-y-6', className)} noValidate>
      <FormMessage state={state} />
      {children}
      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <SubmitButton>{submitLabel}</SubmitButton>
        {footer}
      </div>
    </form>
  );
}

/** Formulario compacto, sin separador ni botón grande (acciones en línea). */
export function InlineAdminForm({
  action,
  children,
  submitLabel = 'Guardar',
  className,
}: {
  action: Action;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className={cn('space-y-4', className)} noValidate>
      <FormMessage state={state} />
      {children}
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
