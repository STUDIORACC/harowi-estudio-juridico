import Link from 'next/link';
import { Plus, SquarePen } from 'lucide-react';
import { ActiveBadge, AdminPageHeader } from '@/components/admin/AdminUI';
import { EmptyState, Table, Td, Tr } from '@/components/ui/Table';
import { adminGetAreas, adminGetServices } from '@/lib/data/admin';

export const metadata = { title: 'Áreas' };

export default async function AdminAreasPage() {
  const [areas, services] = await Promise.all([adminGetAreas(), adminGetServices()]);

  return (
    <>
      <AdminPageHeader
        title="Áreas de práctica"
        description="Agrupan los servicios del estudio y ordenan la página /areas."
        action={
          <Link
            href="/admin/areas/nueva"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.8125rem] text-paper transition-colors hover:bg-ink/85"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Nueva área
          </Link>
        }
      />

      {areas.length === 0 ? (
        <EmptyState title="Sin áreas" description="Cree la primera área para agrupar los servicios." />
      ) : (
        <Table caption="Listado de áreas" head={['Área', 'Slug', 'Servicios', 'Orden', 'Estado', '']}>
          {areas.map((area) => (
            <Tr key={area.id}>
              <Td className="text-ink">
                <Link
                  href={`/admin/areas/${area.id}`}
                  className="font-medium transition-colors hover:text-accent"
                >
                  {area.name}
                </Link>
                <span className="mt-1 block max-w-md truncate text-2xs text-ink-muted">
                  {area.tagline}
                </span>
              </Td>
              <Td className="text-2xs">/areas#{area.slug}</Td>
              <Td className="tabular-nums">
                {services.filter((service) => service.area_id === area.id).length}
              </Td>
              <Td className="tabular-nums">{area.sort_order}</Td>
              <Td>
                <ActiveBadge active={area.is_active} />
              </Td>
              <Td>
                <Link
                  href={`/admin/areas/${area.id}`}
                  aria-label={`Editar ${area.name}`}
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
