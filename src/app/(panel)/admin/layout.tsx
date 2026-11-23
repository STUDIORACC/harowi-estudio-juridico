import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { requireAdminSession } from '@/lib/auth';
import { getSiteSettings } from '@/lib/data';

export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s — Panel' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, settings] = await Promise.all([requireAdminSession(), getSiteSettings()]);

  return (
    <AdminShell
      studioName={settings.studio_name}
      logoUrl={settings.logo_url}
      userLabel={
        session.isDemo
          ? 'Solo lectura'
          : session.profile?.full_name || session.email || 'Personal del estudio'
      }
      isDemo={session.isDemo}
    >
      {children}
    </AdminShell>
  );
}
