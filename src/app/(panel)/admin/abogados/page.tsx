import Link from 'next/link';
import { Plus, SquarePen } from 'lucide-react';
import { ActiveBadge, AdminPageHeader } from '@/components/admin/AdminUI';
import { EmptyState, Table, Td, Tr } from '@/components/ui/Table';
import { adminGetLawyers } from '@/lib/data/admin';

export const metadata = { title: 'Abogados' };

export default async function AdminLawyersPage() {
  const lawyers = await adminGetLawyers();

  return (
    <>
      <AdminPageHeader
        title="Abogados"
        description="Fichas del equipo publicadas en /equipo. Cada ficha tiene su propia página pública."
        action={
          <Link
            href="/admin/abogados/nuevo"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.8125rem] text-paper transition-colors hover:bg-ink/85"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Nuevo abogado
          </Link>
        }
      />

      {lawyers.length === 0 ? (
        <EmptyState
          title="Sin abogados registrados"
          description="Cree la primera ficha para que aparezca en la página de equipo."
        />
      ) : (
        <Table caption="Listado de abogados" head={['Nombre', 'Cargo', 'Especialidades', 'Orden', 'Estado', '']}>
          {lawyers.map((lawyer) => (
            <Tr key={lawyer.id}>
              <Td className="text-ink">
                <Link
                  href={`/admin/abogados/${lawyer.id}`}
                  className="font-medium transition-colors hover:text-accent"
                >
                  {lawyer.name}
                </Link>
                <span className="mt-1 block text-2xs text-ink-muted">/equipo/{lawyer.slug}</span>
              </Td>
              <Td className="text-[0.8125rem]">{lawyer.role}</Td>
              <Td className="max-w-xs text-2xs">{lawyer.specialties.join(' · ') || '—'}</Td>
              <Td className="tabular-nums">{lawyer.sort_order}</Td>
              <Td>
                <ActiveBadge active={lawyer.is_active} />
              </Td>
              <Td>
                <Link
                  href={`/admin/abogados/${lawyer.id}`}
                  aria-label={`Editar la ficha de ${lawyer.name}`}
                  className="inline-flex text-ink-muted transition-colors hover:text-ink"
                >
                  <SquarePen className="h-4 w-4" aria-hidden />
                </Link>
              </Td>
            </Tr>
          ))}
        </Table>
      )}
    </>
  );
}
