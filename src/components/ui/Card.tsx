import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({
  children,
  className,
  as: As = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section' | 'li';
}) {
  return (
    <As className={cn('rounded-2xl border border-line bg-paper', className)}>{children}</As>
  );
}

export function CardLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group block rounded-2xl border border-line bg-paper transition-all duration-500 ease-smooth hover:-translate-y-1 hover:border-ink/25',
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function SectionHeading({
  overline,
  title,
  description,
  align = 'left',
  className,
  action,
}: {
  overline?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5',
        align === 'center' && 'items-center text-center',
        action && 'md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {overline ? <p className="overline mb-4">{overline}</p> : null}
        <h2 className="text-[1.75rem] leading-[1.2] sm:text-[2.125rem] lg:text-[2.5rem]">{title}</h2>
        {description ? (
          <p className="mt-5 text-pretty text-[1.0625rem] leading-relaxed text-ink-soft">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
