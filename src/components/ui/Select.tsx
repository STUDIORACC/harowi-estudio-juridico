import type { ComponentProps } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fieldErrorStyles, fieldStyles } from './Field';

export function Select({
  className,
  invalid,
  children,
  ...props
}: ComponentProps<'select'> & { invalid?: boolean }) {
  return (
    <div className="relative">
      <select
        className={cn(fieldStyles, 'appearance-none pr-11', invalid && fieldErrorStyles, className)}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${props.id}-error` : undefined}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        aria-hidden
      />
    </div>
  );
}
