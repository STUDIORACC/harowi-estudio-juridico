import Link from 'next/link';
import type { ReactNode } from 'react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import type { AppointmentStatus, ConsultationStatus, PostStatus } from '@/types';

/** Cabecera común de las páginas del panel. */
export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[1.625rem] leading-tight sm:text-[1.875rem]">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-[0.875rem] leading-relaxed text-ink-soft">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

/** Tarjeta contenedora usada en los formularios del panel. */
export function AdminCard({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-6 sm:p-7 ${className ?? ''}`}>
      {title ? (
        <div className="mb-6">
          <h2 className="font-display text-[1.125rem]">{title}</h2>
          {description ? (
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-muted">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/* ------------------------------ Estados ----------------------------------- */

const consultationTones: Record<ConsultationStatus, BadgeTone> = {
  nueva: 'accent',
  contactada: 'info',
  programada: 'warning',
  atendida: 'positive',
  cerrada: 'muted',
};

export function ConsultationStatusBadge({ status }: { status: ConsultationStatus }) {
  return (
    <Badge tone={consultationTones[status]} dot>
      {status}
    </Badge>
  );
}

const appointmentTones: Record<AppointmentStatus, BadgeTone> = {
  pendiente: 'accent',
  confirmada: 'positive',
  reprogramada: 'warning',
  cancelada: 'critical',
  atendida: 'info',
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <Badge tone={appointmentTones[status]} dot>
      {status}
    </Badge>
  );
}

export function PostStatusBadge({ status }: { status: PostStatus }) {
  return (
    <Badge tone={status === 'publicado' ? 'positive' : 'muted'} dot>
      {status}
    </Badge>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge tone={active ? 'positive' : 'muted'} dot>
      {active ? 'activo' : 'inactivo'}
    </Badge>
  );
}

/** Enlace discreto de vuelta al listado. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="mb-6 inline-flex items-center gap-2 text-[0.8125rem] text-ink-muted transition-colors hover:text-ink"
    >
      ← {children}
    </Link>
  );
}
