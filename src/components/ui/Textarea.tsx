import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { fieldErrorStyles, fieldStyles } from './Field';

export function Textarea({
  className,
  invalid,
  ...props
}: ComponentProps<'textarea'> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(fieldStyles, 'min-h-[9rem] resize-y leading-relaxed', invalid && fieldErrorStyles, className)}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${props.id}-error` : undefined}
      {...props}
    />
  );
}

export function Checkbox({
  id,
  label,
  error,
  ...props
}: ComponentProps<'input'> & { label: React.ReactNode; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-[0.875rem] leading-relaxed text-ink-soft">
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-ink/30 text-ink accent-[rgb(var(--color-ink))]"
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        <span>{label}</span>
      </label>
      {error ? (
        <p id={`${id}-error`} role="alert" className="pl-7 text-[0.8125rem] text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
