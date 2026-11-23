import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AdminPageHeader, ConsultationStatusBadge } from '@/components/admin/AdminUI';
import { EmptyState, Table, Td, Tr } from '@/components/ui/Table';
import { adminGetConsultations } from '@/lib/data/admin';
import { CONSULTATION_STATUSES } from '@/types';
import { formatDateShort } from '@/lib/utils';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Consultas' };

export default async function AdminConsultationsPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const [{ estado }, consultations] = await Promise.all([searchParams, adminGetConsultations()]);

  const active = CONSULTATION_STATUSES.includes(estado as (typeof CONSULTATION_STATUSES)[number])
    ? estado
    : null;

  const filtered = active
    ? consultations.filter((consultation) => consultation.status === active)
    : consultations;

  return (
    <>
      <AdminPageHeader
        title="Consultas"
        description="Solicitudes enviadas desde el formulario «Cuéntenos su caso» y desde la página de contacto."
      />

      <nav aria-label="Filtrar por estado" className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/admin/consultas"
          className={cn(
            'rounded-full border px-3.5 py-1.5 text-2xs uppercase tracking-overline transition-colors',
            active ? 'border-line text-ink-muted hover:text-ink' : 'border-ink bg-ink text-paper',
          )}
        >
          Todas ({consultations.length})
        </Link>
        {CONSULTATION_STATUSES.map((status) => {
          const count = consultations.filter((item) => item.status === status).length;
          return (
            <Link
              key={status}
              href={`/admin/consultas?estado=${status}`}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-2xs uppercase tracking-overline transition-colors',
                active === status
                  ? 'border-ink bg-ink text-paper'
                  : 'border-line text-ink-muted hover:text-ink',
              )}
            >
              {status} ({count})
            </Link>
          );
        })}
      </nav>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin consultas"
          description="Cuando alguien envíe el formulario del sitio, la consulta aparecerá en esta lista."
        />
      ) : (
        <Table
          caption="Listado de consultas"
          head={['Solicitante', 'Contacto', 'Materia', 'Modalidad', 'Estado', 'Recibida', '']}
        >
          {filtered.map((consultation) => (
            <Tr key={consultation.id}>
              <Td className="text-ink">
                <Link
                  href={`/admin/consultas/${consultation.id}`}
                  className="font-medium transition-colors hover:text-accent"
                >
                  {consultation.full_name}
                </Link>
                <span className="mt-1 block max-w-xs truncate text-2xs text-ink-muted">
                  {consultation.description}
                </span>
              </Td>
              <Td>
                <span className="block text-[0.8125rem]">{consultation.phone}</span>
                <span className="block text-2xs text-ink-muted">{consultation.email}</span>
              </Td>
              <Td>
                <span className="block text-[0.8125rem]">
                  {consultation.area?.name ?? '—'}
                </span>
                <span className="block text-2xs text-ink-muted">
                  {consultation.service?.name ?? '—'}
                </span>
              </Td>
              <Td className="text-[0.8125rem] capitalize">{consultation.modality}</Td>
              <Td>
                <ConsultationStatusBadge status={consultation.status} />
              </Td>
              <Td className="whitespace-nowrap text-2xs">
                {formatDateShort(consultation.created_at.slice(0, 10))}
              </Td>
              <Td>
                <Link
                  href={`/admin/consultas/${consultation.id}`}
                  aria-label={`Abrir la consulta de ${consultation.full_name}`}
                  className="inline-flex text-ink-muted transition-colors hover:text-ink"
                >
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Td>
            </Tr>
          ))}
        </Table>
      )}
    </>
  );
}
