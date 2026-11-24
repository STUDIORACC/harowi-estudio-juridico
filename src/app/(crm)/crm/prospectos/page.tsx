import type { Metadata } from 'next';
import { ProspectsPage } from '@/components/crm/prospects/ProspectsPage';

export const metadata: Metadata = { title: 'Prospectos' };

export default function Page() {
  return <ProspectsPage />;
}
