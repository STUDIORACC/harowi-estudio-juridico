import Link from 'next/link';
import { Plus, SquarePen } from 'lucide-react';
import { ActiveBadge, AdminPageHeader } from '@/components/admin/AdminUI';
import { EmptyState, Table, Td, Tr } from '@/components/ui/Table';
import { adminGetAreas, adminGetServices } from '@/lib/data/admin';

export const metadata = { title: 'Servicios' };

export default async function AdminServicesPage() {
  const [services, areas] = await Promise.all([adminGetServices(), adminGetAreas()]);
  const areaName = (id: string) => areas.find((area) => area.id === id)?.name ?? '—';

  return (
    <>
      <AdminPageHeader
        title="Servicios"
        description="Cada servicio tiene su propia página pública en /areas/[slug], con proceso, documentación y preguntas frecuentes."
        action={
          <Link
            href="/admin/servicios/nuevo"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.8125rem] text-paper transition-colors hover:bg-ink/85"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Nuevo servicio
          </Link>
        }
      />

      {services.length === 0 ? (
        <EmptyState
          title="Sin servicios"
          description="Cree el primer servicio para publicarlo en las áreas de práctica."
        />
      ) : (
        <Table caption="Listado de servicios" head={['Servicio', 'Área', 'URL', 'Orden', 'Estado', '']}>
          {services.map((service) => (
            <Tr key={service.id}>
              <Td className="text-ink">
                <Link
                  href={`/admin/servicios/${service.id}`}
                  className="font-medium transition-colors hover:text-accent"
                >
                  {service.name}
                </Link>
                <span className="mt-1 block max-w-md truncate text-2xs text-ink-muted">
                  {service.short_description}
                </span>
              </Td>
              <Td className="text-[0.8125rem]">{areaName(service.area_id)}</Td>
              <Td className="text-2xs">/areas/{service.slug}</Td>
              <Td className="tabular-nums">{service.sort_order}</Td>
              <Td>
                <ActiveBadge active={service.is_active} />
              </Td>
              <Td>
                <Link
                  href={`/admin/servicios/${service.id}`}
                  aria-label={`Editar ${service.name}`}
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
