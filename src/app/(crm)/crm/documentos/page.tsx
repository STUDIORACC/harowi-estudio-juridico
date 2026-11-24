import type { Metadata } from 'next';
import { DocumentsPage } from '@/components/crm/documents/DocumentsPage';

export const metadata: Metadata = { title: 'Documentos' };

export default function Page() {
  return <DocumentsPage />;
}
