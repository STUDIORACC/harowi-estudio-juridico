import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { ContactForm } from '@/components/forms/ContactForm';
import { PageHeader } from '@/components/site/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, legalServiceSchema } from '@/components/seo/structured-data';
import { routes } from '@/config/site';
import { getSiteSettings, telHref, whatsappUrl } from '@/lib/data';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: 'Contacto',
    description: `Dirección, teléfono, WhatsApp, correo y horario de atención de ${settings.studio_legal_name}.`,
    alternates: { canonical: routes.contact },
  };
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(settings.map_query)}&output=embed`;

  return (
    <>
      <JsonLd data={legalServiceSchema(settings)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Inicio', url: routes.home },
          { name: 'Contacto', url: routes.contact },
        ])}
      />

      <PageHeader
        overline="Contacto"
        title="Hablemos de su caso"
        description="Puede escribirnos, llamarnos o acercarse a la oficina. Si su asunto tiene un plazo próximo a vencer, indíquelo al comunicarse."
        breadcrumbs={[{ label: 'Inicio', href: routes.home }, { label: 'Contacto' }]}
      />

      <div className="shell grid gap-14 py-16 lg:grid-cols-12 lg:gap-16 lg:py-20">
        {/* --------------------------- Datos de contacto -------------------------- */}
        <div className="lg:col-span-5">
          <Reveal>
            <ul className="space-y-px overflow-hidden rounded-2xl border border-line bg-line">
              <li className="flex gap-4 bg-paper p-6">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="overline mb-2">Oficina</p>
                  <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
                    {settings.address}
                    <br />
                    {settings.address_city}
                  </p>
                </div>
              </li>

              <li className="flex gap-4 bg-paper p-6">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="overline mb-2">Teléfono</p>
                  <a
                    href={telHref(settings.phone)}
                    className="text-[0.9375rem] text-ink-soft transition-colors hover:text-ink"
                  >
                    {settings.phone}
                  </a>
                </div>
              </li>

              <li className="flex gap-4 bg-paper p-6">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="overline mb-2">WhatsApp</p>
                  <a
                    href={whatsappUrl(settings)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.9375rem] text-ink-soft transition-colors hover:text-ink"
                  >
                    Escribir por WhatsApp
                  </a>
                </div>
              </li>

              <li className="flex gap-4 bg-paper p-6">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="overline mb-2">Correo</p>
                  <a
                    href={`mailto:${settings.email}`}
                    className="text-[0.9375rem] text-ink-soft transition-colors hover:text-ink"
                  >
                    {settings.email}
                  </a>
                </div>
              </li>

              <li className="flex gap-4 bg-paper p-6">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <div className="w-full">
                  <p className="overline mb-2">Horario de atención</p>
                  <ul className="space-y-1.5 text-[0.9375rem] text-ink-soft">
                    {settings.business_hours.map((hour) => (
                      <li key={hour.days} className="flex justify-between gap-6">
                        <span>{hour.days}</span>
                        <span className="text-ink-muted">{hour.hours}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            </ul>
          </Reveal>

          <Reveal delay={100} className="mt-6">
            <div className="rounded-2xl border border-line bg-paper-alt/60 p-6">
              <p className="text-[0.875rem] leading-relaxed text-ink-soft">
                ¿Prefiere reservar directamente una fecha?{' '}
                <Link href={routes.appointment} className="link-underline text-ink">
                  Solicite una cita
                </Link>{' '}
                eligiendo área, profesional y horario disponible.
              </p>
            </div>
          </Reveal>
        </div>

        {/* -------------------------------- Formulario ---------------------------- */}
        <div className="lg:col-span-7">
          <Reveal delay={60}>
            <h2 className="font-display text-[1.5rem] sm:text-[1.75rem]">Escríbanos</h2>
            <p className="mt-3 max-w-prose text-[0.9375rem] leading-relaxed text-ink-soft">
              Le responderemos dentro del horario de atención. Este formulario es para consultas
              breves; si su caso requiere más detalle, use el formulario de consulta.
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </div>

      {/* ---------------------------------- MAPA --------------------------------- */}
      <section className="shell pb-16 sm:pb-20">
        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-line">
            <iframe
              title={`Ubicación de ${settings.studio_legal_name}`}
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[22rem] w-full border-0 sm:h-[26rem]"
            />
          </div>
          <p className="mt-4 text-2xs text-ink-muted">
            Mapa referencial de la zona. La dirección exacta se administra desde el panel.
          </p>
        </Reveal>
      </section>
    </>
  );
}
