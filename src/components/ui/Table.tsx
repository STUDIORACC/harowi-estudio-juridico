import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Table({
  head,
  children,
  caption,
  className,
}: {
  head: ReactNode[];
  children: ReactNode;
  caption?: string;
  className?: string;
}) {
  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-line bg-white', className)}>
      <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-line">
            {head.map((cell, index) => (
              <th
                key={index}
                scope="col"
                className="whitespace-nowrap px-5 py-4 text-2xs font-medium uppercase tracking-overline text-ink-muted"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & React.ComponentProps<'td'>) {
  return (
    <td className={cn('px-5 py-4 align-middle text-ink-soft', className)} {...props}>
      {children}
    </td>
  );
}

export function Tr({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & React.ComponentProps<'tr'>) {
  return (
    <tr className={cn('transition-colors duration-200 hover:bg-paper-alt/60', className)} {...props}>
      {children}
    </tr>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-paper-alt/40 px-6 py-14 text-center">
      <p className="font-display text-lg">{title}</p>
      {description ? <p className="max-w-sm text-sm text-ink-soft">{description}</p> : null}
      {action}
    </div>
  );
}
