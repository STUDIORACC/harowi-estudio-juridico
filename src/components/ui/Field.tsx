import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={htmlFor} className="text-[0.8125rem] font-medium text-ink">
        {label}
        {required ? (
          <span className="ml-1 text-accent" aria-hidden>
            *
          </span>
        ) : (
          <span className="ml-1.5 text-2xs font-normal text-ink-muted">(opcional)</span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-[0.8125rem] text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[0.8125rem] text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const fieldStyles =
  'w-full rounded-xl border border-line bg-white px-4 py-3 text-[0.9375rem] text-ink placeholder:text-ink-muted/70 transition-colors duration-200 hover:border-ink/25 focus:border-ink/40 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-accent/25 disabled:bg-paper-alt disabled:text-ink-muted';

export const fieldErrorStyles = 'border-red-300 focus:ring-red-200';
