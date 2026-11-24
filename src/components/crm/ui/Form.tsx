'use client';

import { forwardRef, useId } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const control =
  'w-full rounded-lg border border-slate-200 bg-white text-sm text-navy-900 shadow-card placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

export const Input = forwardRef<HTMLInputElement, ComponentProps<'input'> & { invalid?: boolean }>(function Input({ className, invalid, ...props }, ref) {
  return <input ref={ref} className={cn(control, 'h-9 px-3', invalid && 'border-red-400 focus:border-red-500 focus:ring-red-500/20', className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<'textarea'> & { invalid?: boolean }>(function Textarea({ className, invalid, rows = 3, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(control, 'resize-y px-3 py-2 leading-relaxed', invalid && 'border-red-400', className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, ComponentProps<'select'> & { invalid?: boolean }>(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(control, 'h-9 appearance-none pl-3 pr-8', invalid && 'border-red-400', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
    </div>
  );
});

export function SearchInput({ value, onChange, placeholder = 'Buscar…', className, ...rest }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string } & Omit<ComponentProps<'input'>, 'value' | 'onChange'>) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(control, 'h-9 pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden')}
        {...rest}
      />
      {value ? (
        <button type="button" onClick={() => onChange('')} aria-label="Limpiar búsqueda" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

/** Etiqueta + control + error. El `id` se inyecta mediante render-prop para asociar la etiqueta. */
export function Field({ label, error, hint, required, className, children }: { label: string; error?: string; hint?: string; required?: boolean; className?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-[0.8125rem] font-medium text-navy-800">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      {children(id)}
      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <label className={cn('flex cursor-pointer items-start justify-between gap-4', disabled && 'cursor-not-allowed opacity-60')}>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-navy-900">{label}</span>
        {description ? <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{description}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors', checked ? 'bg-brand-600' : 'bg-slate-300')}
      >
        <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
      </button>
    </label>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-navy-800">
      <span className={cn('flex h-4 w-4 items-center justify-center rounded border transition-colors', checked ? 'border-brand-600 bg-brand-600' : 'border-slate-300 bg-white')}>
        {checked ? <Check className="h-3 w-3 text-white" strokeWidth={3} /> : null}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function FormGrid({ children, cols = 2 }: { children: ReactNode; cols?: 1 | 2 | 3 }) {
  return <div className={cn('grid gap-4', cols === 2 && 'sm:grid-cols-2', cols === 3 && 'sm:grid-cols-3')}>{children}</div>;
}
