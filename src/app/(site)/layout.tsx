import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FloatingWhatsapp } from '@/components/whatsapp/FloatingWhatsapp';
import { getAreasWithServices, getSiteSettings, telHref, whatsappUrl } from '@/lib/data';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, areas] = await Promise.all([getSiteSettings(), getAreasWithServices()]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        studioName={settings.studio_name}
        studioLegalName={settings.studio_legal_name}
        tagline={settings.tagline}
        logoUrl={settings.logo_url}
        phone={settings.phone}
        phoneHref={telHref(settings.phone)}
        areas={areas}
      />

      <main id="contenido" className="flex-1">
        {children}
      </main>

      <Footer />

      <FloatingWhatsapp
        href={whatsappUrl(settings)}
        label={`Escribir por WhatsApp a ${settings.studio_name}`}
      />
    </div>
  );
}
