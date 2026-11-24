import type { Metadata } from 'next';
import { ReportsPage } from '@/components/crm/reports/ReportsPage';

export const metadata: Metadata = { title: 'Reportes' };

export default function Page() {
  return <ReportsPage />;
}
