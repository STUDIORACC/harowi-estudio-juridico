import type { Metadata } from 'next';
import { SettingsPage } from '@/components/crm/settings/SettingsPage';

export const metadata: Metadata = { title: 'Configuración' };

export default function Page() {
  return <SettingsPage />;
}
