import type { Metadata } from 'next';
import { CrmProviders } from '@/components/crm/shell/CrmProviders';

/**
 * HAROWI LEGAL CRM — sistema privado de gestión del estudio.
 * No forma parte del sitio público: no se indexa y no aparece en el mapa del sitio.
 */
export const metadata: Metadata = {
  title: { default: 'HAROWI Legal CRM', template: '%s · HAROWI Legal CRM' },
  description: 'Sistema privado de gestión del estudio jurídico HAROWI (versión de demostración).',
  robots: { index: false, follow: false },
};

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return <CrmProviders>{children}</CrmProviders>;
}
