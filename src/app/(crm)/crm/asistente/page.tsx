import type { Metadata } from 'next';
import { AssistantPage } from '@/components/crm/assistant/AssistantPage';

export const metadata: Metadata = { title: 'Asistente IA' };

export default function Page() {
  return <AssistantPage />;
}
