import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

export function PageHeader({
  overline,
  title,
  description,
  breadcrumbs,
  aside,
}: {
  overline: string;
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  aside?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden border-b border-line">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.5]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-paper/40 via-paper/85 to-paper"
        aria-hidden
      />

      <div className="shell relative py-14 sm:py-20 lg:py-24">
        {breadcrumbs ? (
          <nav aria-label="Ruta de navegación" className="mb-8">
            <ol className="flex flex-wrap items-center gap-1.5 text-2xs text-ink-muted">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.label} className="flex items-center gap-1.5">
                  {index > 0 ? <ChevronRight className="h-3 w-3" aria-hidden /> : null}
                  {crumb.href ? (
                    <Link href={crumb.href} className="transition-colors hover:text-ink">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-ink-soft">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className={aside ? 'lg:col-span-7' : 'lg:col-span-9'}>
            <p className="overline mb-5">{overline}</p>
            <h1 className="text-[2.25rem] leading-[1.08] sm:text-[3rem] lg:text-[3.5rem]">{title}</h1>
            {description ? (
              <p className="mt-7 max-w-2xl text-pretty text-[1.0625rem] leading-relaxed text-ink-soft sm:text-lg">
                {description}
              </p>
            ) : null}
          </div>
          {aside ? <div className="lg:col-span-5">{aside}</div> : null}
        </div>
      </div>
    </header>
  );
}
