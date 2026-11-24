'use client';

import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { initialsOf } from '@/crm/lib/text';
import { cn } from '@/lib/utils';
import { Button } from './Button';

/* --------------------------------- Páginas -------------------------------- */

export function PageHeader({ title, description, actions, className }: { title: string; description?: string; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-navy-900 sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('min-w-0 rounded-xl border border-slate-200/90 bg-white shadow-card', className)}>{children}</section>;
}

export function CardHeader({ title, description, actions, className }: { title: string; description?: string; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-4 pb-3 pt-4 sm:px-5', className)}>
      <div className="min-w-0">
        <h2 className="text-[0.9375rem] font-semibold text-navy-900">{title}</h2>
        {description ? <p className="mt-0.5 text-[0.8125rem] text-slate-500">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'navy',
  href,
  onClick,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
  tone?: 'navy' | 'blue' | 'green' | 'amber' | 'red' | 'violet';
  href?: string;
  onClick?: () => void;
}) {
  const iconTone = {
    navy: 'bg-navy-50 text-navy-700',
    blue: 'bg-brand-50 text-brand-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-600',
    violet: 'bg-violet-50 text-violet-700',
  }[tone];
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[0.8125rem] font-medium text-slate-500">{label}</span>
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', iconTone)}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-navy-900 sm:text-[1.75rem]">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </>
  );
  const cls = 'block rounded-xl border border-slate-200/90 bg-white p-4 shadow-card transition-all';
  if (href)
    return (
      <a href={href} className={cn(cls, 'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-pop')}>
        {body}
      </a>
    );
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cn(cls, 'w-full text-left hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-pop')}>
        {body}
      </button>
    );
  return <div className={cls}>{body}</div>;
}

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">{icon ?? <Inbox className="h-5 w-5" />}</div>
      <p className="text-sm font-medium text-navy-900">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200/70', className)} />;
}

export function Avatar({ name, size = 'md', tone = 'navy', className }: { name: string; size?: 'xs' | 'sm' | 'md' | 'lg'; tone?: 'navy' | 'blue' | 'slate' | 'green' | 'violet' | 'amber'; className?: string }) {
  const sizes = { xs: 'h-6 w-6 text-[0.625rem]', sm: 'h-7 w-7 text-[0.6875rem]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm' }[size];
  const tones = {
    navy: 'bg-navy-100 text-navy-800',
    blue: 'bg-brand-100 text-brand-800',
    slate: 'bg-slate-200 text-slate-700',
    green: 'bg-emerald-100 text-emerald-800',
    violet: 'bg-violet-100 text-violet-800',
    amber: 'bg-amber-100 text-amber-800',
  }[tone];
  return <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', sizes, tones, className)}>{initialsOf(name)}</span>;
}

/* ---------------------------------- Pestañas ------------------------------ */

export function Tabs<T extends string>({ value, onChange, items, className }: { value: T; onChange: (v: T) => void; items: { id: T; label: string; count?: number }[]; className?: string }) {
  return (
    <div role="tablist" className={cn('flex gap-1 overflow-x-auto border-b border-slate-200 no-scrollbar', className)}>
      {items.map((it) => (
        <button
          key={it.id}
          role="tab"
          type="button"
          aria-selected={value === it.id}
          onClick={() => onChange(it.id)}
          className={cn(
            '-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
            value === it.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-navy-800',
          )}
        >
          {it.label}
          {it.count !== undefined ? <span className={cn('rounded-full px-1.5 text-xs', value === it.id ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500')}>{it.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, items, size = 'md' }: { value: T; onChange: (v: T) => void; items: { id: T; label: ReactNode; title?: string }[]; size?: 'sm' | 'md' }) {
  return (
    <div role="group" className="inline-flex rounded-lg border border-slate-200 bg-slate-100/70 p-0.5">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          title={it.title}
          aria-pressed={value === it.id}
          onClick={() => onChange(it.id)}
          className={cn(
            'rounded-md font-medium transition-all',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[0.8125rem]',
            value === it.id ? 'bg-white text-navy-900 shadow-card' : 'text-slate-500 hover:text-navy-800',
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------- Tablas -------------------------------- */

export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('crm-scroll overflow-x-auto', className)}>{children}</div>;
}

export const tableCls = 'w-full min-w-full border-collapse text-sm';
export const thCls = 'whitespace-nowrap border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';
export const tdCls = 'border-b border-slate-100 px-4 py-3 align-middle text-navy-800';

export function SortHeader({ label, active, dir, onClick, className }: { label: string; active: boolean; dir: 'asc' | 'desc'; onClick: () => void; className?: string }) {
  const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th className={cn(thCls, 'p-0', className)} aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={onClick} className={cn('flex w-full items-center gap-1 px-4 py-2.5 text-left uppercase tracking-wide transition-colors hover:text-navy-800', active && 'text-navy-800')}>
        {label}
        <Icon className={cn('h-3 w-3', active ? 'opacity-100' : 'opacity-40')} aria-hidden />
      </button>
    </th>
  );
}

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5 text-[0.8125rem] text-slate-500">
      <span>
        {from}–{to} de {total}
      </span>
      <div className="flex items-center gap-1">
        <Button size="xs" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)} icon={<ChevronLeft className="h-3.5 w-3.5" />} aria-label="Página anterior">
          Anterior
        </Button>
        <span className="px-2 tabular-nums">
          {page} / {pages}
        </span>
        <Button size="xs" variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Página siguiente">
          Siguiente
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function KeyValue({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-navy-900">{children}</dd>
    </div>
  );
}
