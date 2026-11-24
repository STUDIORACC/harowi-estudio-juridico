import type { Metadata } from 'next';
import { InboxPage } from '@/components/crm/inbox/InboxPage';

export const metadata: Metadata = { title: 'Conversaciones' };

export default function Page() {
  return <InboxPage />;
}
