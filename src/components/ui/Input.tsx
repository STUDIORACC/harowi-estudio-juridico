import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { fieldErrorStyles, fieldStyles } from './Field';

export function Input({
  className,
  invalid,
  ...props
}: ComponentProps<'input'> & { invalid?: boolean }) {
  return (
    <input
      className={cn(fieldStyles, invalid && fieldErrorStyles, className)}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${props.id}-error` : undefined}
      {...props}
    />
  );
}
