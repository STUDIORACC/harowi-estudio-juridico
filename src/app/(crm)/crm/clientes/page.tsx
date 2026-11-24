import type { Metadata } from 'next';
import { ClientsPage } from '@/components/crm/clients/ClientsPage';

export const metadata: Metadata = { title: 'Clientes' };

export default function Page() {
  return <ClientsPage />;
}
