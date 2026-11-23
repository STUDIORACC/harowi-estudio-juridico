import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCard({
  value,
  label,
  note,
  icon: Icon,
  trend,
  className,
}: {
  value: string | number;
  label: string;
  note?: string;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border border-line bg-white p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-2xs uppercase tracking-overline text-ink-muted">{label}</p>
        {Icon ? <Icon className="h-4 w-4 text-accent" aria-hidden /> : null}
      </div>
      <p className="mt-4 font-display text-[2rem] leading-none tabular-nums">{value}</p>
      <div className="mt-2.5 flex items-center gap-2">
        {trend ? (
          <span
            className={cn(
              'text-2xs font-medium',
              trend.positive === false ? 'text-red-600' : 'text-emerald-600',
            )}
          >
            {trend.value}
          </span>
        ) : null}
        {note ? <span className="text-2xs text-ink-muted">{note}</span> : null}
      </div>
    </div>
  );
}
