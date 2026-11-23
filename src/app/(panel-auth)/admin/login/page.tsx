import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LoginForm } from '@/components/admin/LoginForm';
import { Logo } from '@/components/layout/Logo';
import { routes } from '@/config/site';
import { getSiteSettings } from '@/lib/data';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const metadata: Metadata = {
  title: 'Acceso al panel',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const [{ redirect }, settings] = await Promise.all([searchParams, getSiteSettings()]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper-alt/50 px-5 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-line bg-paper p-8 sm:p-10">
          <Logo
            name={settings.studio_name}
            legalName={settings.studio_legal_name}
            tagline={settings.tagline}
            logoUrl={settings.logo_url}
            href={routes.home}
            imageClassName="h-24 w-auto"
          />
          <h1 className="mt-7 font-display text-[1.5rem]">Acceso al panel</h1>
          <p className="mt-3 text-[0.875rem] leading-relaxed text-ink-soft">
            Área privada de {settings.studio_legal_name}. El acceso está reservado al personal
            autorizado del estudio.
          </p>

          <div className="mt-8">
            <LoginForm redirectTo={redirect} configured={isSupabaseConfigured()} />
          </div>
        </div>

        <Link
          href={routes.home}
          className="mt-6 inline-flex items-center gap-2 text-[0.8125rem] text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Volver al sitio público
        </Link>
      </div>
    </main>
  );
}
