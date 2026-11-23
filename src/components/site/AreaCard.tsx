import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  Building2,
  FileSignature,
  Gavel,
  Landmark,
  Scale,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AreaWithServices } from '@/types';
import { routes } from '@/config/site';
import { cn } from '@/lib/utils';

/** Iconos disponibles para las áreas. El nombre se elige desde el panel. */
export const areaIcons: Record<string, LucideIcon> = {
  Scale,
  Gavel,
  Users,
  Building2,
  Landmark,
  Briefcase,
  FileSignature,
  ShieldCheck,
};

export function AreaIcon({ name, className }: { name: string; className?: string }) {
  const Icon = areaIcons[name] ?? Scale;
  return <Icon className={className} aria-hidden />;
}

export function AreaCard({
  area,
  index,
  className,
}: {
  area: AreaWithServices;
  index?: number;
  className?: string;
}) {
  return (
    <article
      id={area.slug}
      className={cn(
        'group relative flex flex-col rounded-2xl border border-line bg-paper p-7 transition-colors duration-500 ease-smooth hover:border-ink/20 sm:p-8',
        className,
      )}
    >
      {typeof index === 'number' ? (
        <span className="absolute right-7 top-7 font-display text-2xs tabular-nums text-ink-muted/60">
          {String(index + 1).padStart(2, '0')}
        </span>
      ) : null}

      <span className="mb-7 flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-paper-alt transition-colors duration-500 group-hover:border-accent/30 group-hover:bg-accent/[0.08]">
        <AreaIcon
          name={area.icon}
          className="h-[1.125rem] w-[1.125rem] text-ink-soft transition-colors duration-500 group-hover:text-accent"
        />
      </span>

      <h3 className="text-xl">{area.name}</h3>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">{area.summary}</p>

      <ul className="mt-7 flex-1 space-y-px border-t border-line pt-2">
        {area.services.map((service) => (
          <li key={service.id}>
            <Link
              href={`${routes.areas}/${service.slug}`}
              className="group/item flex items-center justify-between gap-4 border-b border-line/60 py-3 text-[0.875rem] text-ink-soft transition-colors duration-300 hover:text-ink"
            >
              <span>{service.name}</span>
              <ArrowRight
                className="h-3.5 w-3.5 shrink-0 text-ink-muted/50 transition-all duration-300 ease-smooth group-hover/item:translate-x-0.5 group-hover/item:text-accent"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
