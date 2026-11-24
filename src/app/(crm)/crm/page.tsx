import type { Metadata } from 'next';
import { Dashboard } from '@/components/crm/dashboard/Dashboard';

export const metadata: Metadata = { title: { absolute: 'HAROWI Legal CRM · Dashboard' } };

export default function CrmDashboardPage() {
  return <Dashboard />;
}
