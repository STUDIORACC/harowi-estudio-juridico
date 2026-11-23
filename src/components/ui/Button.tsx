import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-300 ease-smooth disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-ink/85 active:bg-ink',
  secondary: 'border border-ink/20 bg-transparent text-ink hover:border-ink/50 hover:bg-ink/[0.04]',
  ghost: 'text-ink hover:bg-ink/[0.06]',
  accent: 'bg-accent text-white hover:bg-accent/90',
  danger: 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[0.8125rem]',
  md: 'h-11 px-6 text-sm',
  lg: 'h-[3.25rem] px-8 text-[0.9375rem]',
};

export interface ButtonBaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonBaseProps & ComponentProps<'button'>) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  href,
  ...props
}: ButtonBaseProps & ComponentProps<typeof Link>) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  );
}

export function ExternalButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonBaseProps & ComponentProps<'a'>) {
  return (
    <a
      className={cn(base, variants[variant], sizes[size], className)}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  );
}
