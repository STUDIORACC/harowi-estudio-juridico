import type { Metadata } from 'next';
import { PageHeader } from '@/components/site/PageHeader';
import { routes } from '@/config/site';
import { getSiteSettings } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Aviso legal',
  description: 'Condiciones de uso del sitio web y alcance de la información publicada.',
  alternates: { canonical: routes.terms },
  robots: { index: false, follow: true },
};

export default async function LegalNoticePage() {
  const settings = await getSiteSettings();

  return (
    <>
      <PageHeader
        overline="Información legal"
        title="Aviso legal"
        breadcrumbs={[{ label: 'Inicio', href: routes.home }, { label: 'Aviso legal' }]}
      />

      <article className="shell max-w-3xl py-16 sm:py-20">
        <div className="prose-legal">
          <h2>Titular del sitio</h2>
          <p>
            Este sitio web pertenece a {settings.studio_legal_name}, con oficina en{' '}
            {settings.address}, {settings.address_city}. Para cualquier comunicación puede
            escribir a {settings.email} o llamar al {settings.phone}.
          </p>

          <h2>Alcance de la información</h2>
          <p>{settings.disclaimer}</p>
          <p>
            Los contenidos publicados —incluidas las páginas de servicios, las preguntas frecuentes
            y los artículos del blog— describen el funcionamiento general de determinados
            procedimientos. No consideran las circunstancias particulares de ningún caso y no deben
            utilizarse como fundamento para tomar decisiones sin asesoría previa.
          </p>

          <h2>Relación abogado-cliente</h2>
          <p>
            El envío de un formulario, un mensaje de WhatsApp o un correo electrónico no genera
            relación abogado-cliente. Dicha relación se constituye únicamente cuando el estudio
            acepta expresamente el encargo y se suscriben las condiciones correspondientes.
          </p>

          <h2>Propiedad intelectual</h2>
          <p>
            Los textos, la identidad visual y los demás elementos del sitio pertenecen al estudio o
            se utilizan con autorización. Su reproducción total o parcial requiere consentimiento
            previo por escrito.
          </p>

          <h2>Enlaces externos</h2>
          <p>
            El sitio puede enlazar a páginas de terceros. El estudio no controla su contenido ni
            asume responsabilidad por la información que publiquen.
          </p>

          <h2>Modificaciones</h2>
          <p>
            El estudio puede actualizar los contenidos y este aviso en cualquier momento. La versión
            vigente es la publicada en esta página.
          </p>
        </div>
      </article>
    </>
  );
}
