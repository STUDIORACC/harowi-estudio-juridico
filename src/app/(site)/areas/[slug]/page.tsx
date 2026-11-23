import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, FileText, HelpCircle } from 'lucide-react';
import { Accordion } from '@/components/ui/Accordion';
import { ButtonLink, ExternalButtonLink } from '@/components/ui/Button';
import { ContentBlocks } from '@/components/site/ContentBlocks';
import { CtaBand } from '@/components/site/CtaBand';
import { PageHeader } from '@/components/site/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, faqSchema, serviceSchema } from '@/components/seo/structured-data';
import { WhatsappIcon } from '@/components/whatsapp/WhatsappIcon';
import { routes } from '@/config/site';
import {
  getLawyersByArea,
  getRelatedServices,
  getServiceBySlug,
  getServices,
  getSiteSettings,
  whatsappUrl,
} from '@/lib/data';
import { serviceMessage } from '@/lib/whatsapp';

/** Genera las 15 rutas de servicio en el momento de la compilación. */
export async function generateStaticParams() {
  const services = await getServices();
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return { title: 'Servicio no encontrado' };

  return {
    title: service.seo_title ?? service.name,
    description: service.seo_description ?? service.short_description,
    alternates: { canonical: `${routes.areas}/${service.slug}` },
    openGraph: {
      type: 'article',
      title: service.seo_title ?? service.name,
      description: service.seo_description ?? service.short_description,
      url: `${routes.areas}/${service.slug}`,
    },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const [settings, related, lawyers] = await Promise.all([
    getSiteSettings(),
    getRelatedServices(service.area_id, service.id),
    getLawyersByArea(service.area_id),
  ]);

  const whatsappHref = whatsappUrl(settings, serviceMessage(service.name));

  return (
    <>
      <JsonLd data={serviceSchema(service, settings)} />
      {service.faqs.length > 0 ? <JsonLd data={faqSchema(service.faqs)} /> : null}
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Inicio', url: routes.home },
          { name: 'Áreas de práctica', url: routes.areas },
          { name: service.name, url: `${routes.areas}/${service.slug}` },
        ])}
      />

      <PageHeader
        overline={service.area.name}
        title={service.name}
        description={service.short_description}
        breadcrumbs={[
          { label: 'Inicio', href: routes.home },
          { label: 'Áreas de práctica', href: routes.areas },
          { label: service.name },
        ]}
        aside={
          <div className="rounded-2xl border border-line bg-paper p-6 sm:p-7">
            <p className="overline mb-4">Consulta sobre este servicio</p>
            <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
              Explíquenos su situación. Revisamos la documentación y le indicamos si corresponde
              accionar y por qué vía.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <ButtonLink href={`${routes.consultation}?servicio=${service.slug}`} size="md">
                Solicitar consulta
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </ButtonLink>
              <ExternalButtonLink href={whatsappHref} variant="secondary" size="md">
                <WhatsappIcon className="h-4 w-4 text-[#25D366]" />
                Hablar por WhatsApp
              </ExternalButtonLink>
            </div>
          </div>
        }
      />

      <div className="shell grid gap-14 py-16 lg:grid-cols-12 lg:gap-16 lg:py-20">
        {/* ------------------------------ CONTENIDO ------------------------------ */}
        <div className="lg:col-span-8">
          <Reveal>
            <div className="prose-legal">
              {service.description.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </Reveal>

          {service.when_needed.length > 0 ? (
            <Reveal className="mt-16">
              <h2 className="font-display text-[1.5rem] sm:text-[1.75rem]">
                Cuándo puede requerirse
              </h2>
              <ul className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
                {service.when_needed.map((item) => (
                  <li key={item} className="flex gap-3 bg-paper p-5 sm:p-6">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                    <span className="text-[0.9375rem] leading-relaxed text-ink-soft">{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : null}

          {service.process.length > 0 ? (
            <Reveal className="mt-16">
              <h2 className="font-display text-[1.5rem] sm:text-[1.75rem]">Proceso general</h2>
              <p className="mt-3 max-w-prose text-[0.9375rem] leading-relaxed text-ink-muted">
                Una referencia de cómo suele desarrollarse. Los pasos concretos dependen de la vía
                aplicable y de las circunstancias de cada caso.
              </p>
              <ol className="mt-8">
                {service.process.map((step) => (
                  <li key={step.step} className="grid gap-3 border-b border-line py-7 sm:grid-cols-12 sm:gap-8">
                    <span className="font-display text-[0.8125rem] tabular-nums text-accent sm:col-span-1">
                      {step.step}
                    </span>
                    <h3 className="font-display text-[1.0625rem] sm:col-span-4">{step.title}</h3>
                    <p className="text-[0.9375rem] leading-relaxed text-ink-soft sm:col-span-7">
                      {step.description}
                    </p>
                  </li>
                ))}
              </ol>
            </Reveal>
          ) : null}

          {service.documents.length > 0 ? (
            <Reveal className="mt-16">
              <h2 className="font-display text-[1.5rem] sm:text-[1.75rem]">
                Documentación orientativa
              </h2>
              <p className="mt-3 max-w-prose text-[0.9375rem] leading-relaxed text-ink-muted">
                No es necesario contar con todo antes de la primera consulta: parte del trabajo
                inicial es identificar qué falta y cómo obtenerlo.
              </p>
              <ul className="mt-7 space-y-2.5">
                {service.documents.map((document) => (
                  <li
                    key={document}
                    className="flex gap-3 rounded-xl border border-line bg-paper px-5 py-4"
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                    <span className="text-[0.9375rem] leading-relaxed text-ink-soft">
                      {document}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : null}

          {service.content.length > 0 ? (
            <Reveal className="mt-16">
              <ContentBlocks blocks={service.content} />
            </Reveal>
          ) : null}

          {service.faqs.length > 0 ? (
            <Reveal className="mt-16">
              <h2 className="flex items-center gap-3 font-display text-[1.5rem] sm:text-[1.75rem]">
                <HelpCircle className="h-5 w-5 text-accent" aria-hidden />
                Preguntas frecuentes
              </h2>
              <Accordion
                className="mt-8"
                items={service.faqs.map((faq) => ({
                  question: faq.question,
                  answer: faq.answer,
                }))}
              />
            </Reveal>
          ) : null}
        </div>

        {/* ------------------------------- LATERAL ------------------------------- */}
        <aside className="space-y-8 lg:col-span-4">
          {related.length > 0 ? (
            <div className="rounded-2xl border border-line bg-paper p-6 sm:p-7">
              <p className="overline mb-5">Más en {service.area.short_name}</p>
              <ul className="space-y-px">
                {related.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`${routes.areas}/${item.slug}`}
                      className="group flex items-center justify-between gap-4 border-b border-line/70 py-3 text-[0.875rem] text-ink-soft transition-colors hover:text-ink"
                    >
                      {item.name}
                      <ArrowRight
                        className="h-3.5 w-3.5 shrink-0 text-ink-muted/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-accent"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {lawyers.length > 0 ? (
            <div className="rounded-2xl border border-line bg-paper p-6 sm:p-7">
              <p className="overline mb-5">Equipo del área</p>
              <ul className="space-y-4">
                {lawyers.map((lawyer) => (
                  <li key={lawyer.id}>
                    <Link href={`${routes.team}/${lawyer.slug}`} className="group block">
                      <span className="block text-[0.9375rem] text-ink transition-colors group-hover:text-accent">
                        {lawyer.name}
                      </span>
                      <span className="mt-0.5 block text-2xs text-ink-muted">{lawyer.role}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-2xl border border-line bg-paper-alt/60 p-6 sm:p-7">
            <p className="overline mb-4">Atención</p>
            <p className="text-[0.875rem] leading-relaxed text-ink-soft">
              {settings.business_hours_short}
              <br />
              {settings.address}
              <br />
              {settings.address_city}
            </p>
            <p className="mt-5 text-2xs leading-relaxed text-ink-muted">{settings.disclaimer}</p>
          </div>
        </aside>
      </div>

      <section className="pb-8">
        <CtaBand
          title={`¿Su caso es sobre ${service.name.toLowerCase()}?`}
          description="Cuéntenos la situación con el detalle que tenga a mano. Le respondemos indicando si corresponde accionar, por qué vía y qué documentación conviene reunir."
          primaryHref={`${routes.consultation}?servicio=${service.slug}`}
          whatsappMessage={serviceMessage(service.name)}
        />
      </section>
    </>
  );
}
