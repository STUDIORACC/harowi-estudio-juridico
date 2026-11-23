'use client';

import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonStyles =
  'inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-[0.8125rem] text-red-700 transition-colors hover:bg-red-50';

function confirmOrCancel(event: React.MouseEvent, message: string) {
  if (!window.confirm(message)) event.preventDefault();
}

/**
 * Botón de eliminación pensado para vivir DENTRO de un formulario del panel
 * (por ejemplo, en el pie de `AdminForm`). Usa `formAction`, de modo que envía
 * los campos del formulario a la acción de borrado sin anidar otro `<form>`,
 * que sería HTML inválido.
 */
export function DeleteButton({
  action,
  label = 'Eliminar',
  confirmMessage = '¿Eliminar este registro? La acción no se puede deshacer.',
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  label?: string;
  confirmMessage?: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      formAction={action}
      formNoValidate
      onClick={(event) => confirmOrCancel(event, confirmMessage)}
      className={cn(buttonStyles, className)}
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  );
}

/**
 * Variante independiente, con su propio formulario. Se usa en listados donde el
 * botón no está dentro de otro formulario.
 */
export function DeleteForm({
  action,
  id,
  label = 'Eliminar',
  confirmMessage = '¿Eliminar este registro? La acción no se puede deshacer.',
  extra,
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label?: string;
  confirmMessage?: string;
  /** Campos ocultos adicionales, p. ej. el servicio al que pertenece una FAQ. */
  extra?: Record<string, string>;
  className?: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      {extra
        ? Object.entries(extra).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))
        : null}
      <button
        type="submit"
        aria-label={label || 'Eliminar'}
        onClick={(event) => confirmOrCancel(event, confirmMessage)}
        className={cn(buttonStyles, !label && 'px-2.5', className)}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        {label}
      </button>
    </form>
  );
}
