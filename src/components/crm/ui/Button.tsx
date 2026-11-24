'use client';

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'brand' | 'secondary' | 'ghost' | 'danger' | 'soft';
type Size = 'xs' | 'sm' | 'md';

const base =
  'inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary: 'bg-navy-800 text-white shadow-card hover:bg-navy-700 active:bg-navy-900',
  brand: 'bg-brand-600 text-white shadow-card hover:bg-brand-700 active:bg-brand-800',
  secondary: 'border border-slate-200 bg-white text-navy-800 shadow-card hover:border-slate-300 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-navy-900',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
};

const sizes: Record<Size, string> = {
  xs: 'h-7 px-2.5 text-xs',
  sm: 'h-8 px-3 text-[0.8125rem]',
  md: 'h-9 px-3.5 text-sm',
};

export interface ButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

export function Button({ variant = 'secondary', size = 'md', loading, icon, className, children, disabled, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function ButtonLink({ variant = 'secondary', size = 'md', className, children, icon, ...props }: Omit<ComponentProps<typeof Link>, 'children'> & { variant?: Variant; size?: Size; icon?: ReactNode; children?: ReactNode }) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {icon}
      {children}
    </Link>
  );
}

export function IconButton({ label, className, children, size = 'md', variant = 'ghost', ...props }: Omit<ComponentProps<'button'>, 'children'> & { label: string; children: ReactNode; size?: 'sm' | 'md'; variant?: Variant }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(base, variants[variant], size === 'sm' ? 'h-7 w-7' : 'h-9 w-9', 'px-0', className)}
      {...props}
    >
      {children}
    </button>
  );
}
