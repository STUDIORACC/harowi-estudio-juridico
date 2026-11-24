import type { Metadata } from 'next';
import { CasesPage } from '@/components/crm/cases/CasesPage';

export const metadata: Metadata = { title: 'Expedientes' };

export default function Page() {
  return <CasesPage />;
}
