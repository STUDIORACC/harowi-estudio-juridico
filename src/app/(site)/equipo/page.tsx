import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CtaBand } from '@/components/site/CtaBand';
import { PageHeader } from '@/components/site/PageHeader';
import { ImageFrame } from '@/components/ui/ImageFrame';
import { Reveal } from '@/components/ui/Reveal';
import { routes } from '@/config/site';
import { getLawyers, getSiteSettings } from '@/lib/data';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: 'Nuestro equipo',
    description: `Profesionales de ${settings.studio_legal_name}: formación, experiencia y áreas en las que interviene cada uno.`,
    alternates: { canonical: routes.team },
  };
}

export default async function TeamPage() {
  const lawyers = await getLawyers();

  return (
    <>
      <PageHeader
        overline="Equipo"
        title="Nuestro equipo"
        description="Cada asunto se asigna a un profesional responsable, que es además el punto de contacto del cliente durante todo el proceso."
        breadcrumbs={[{ label: 'Inicio', href: routes.home }, { label: 'Equipo' }]}
      />

      <section className="shell py-16 sm:py-20 lg:py-24">
        <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {lawyers.map((lawyer, index) => (
            <Reveal as="li" key={lawyer.id} delay={index * 70}>
              <Link href={`${routes.team}/${lawyer.slug}`} className="group block">
                <ImageFrame
                  src={lawyer.photo_url}
                  alt={lawyer.name}
                  monogram={lawyer.name}
                  tone={lawyer.portrait_tone}
                  ratio="portrait"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="transition-transform duration-700 ease-smooth group-hover:-translate-y-1"
                />

                <div className="mt-6 flex items-start justify-between gap-3">
                  <h2 className="text-[1.1875rem] transition-colors duration-300 group-hover:text-accent">
                    {lawyer.name}
                  </h2>
                </div>
                <p className="mt-1 text-[0.8125rem] text-ink-muted">{lawyer.role}</p>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-soft">
                  {lawyer.headline}
                </p>

                {lawyer.areas.length > 0 ? (
                  <ul className="mt-5 flex flex-wrap gap-1.5">
                    {lawyer.areas.map((area) => (
                      <li
                        key={area.id}
                        className="rounded-full border border-line px-2.5 py-1 text-2xs text-ink-muted"
                      >
                        {area.short_name || area.name}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <span className="mt-6 inline-flex items-center gap-2 text-2xs uppercase tracking-overline text-ink-muted transition-colors group-hover:text-ink">
                  Ver perfil
                  <ArrowRight
                    className="h-3 w-3 text-accent transition-transform duration-300 ease-smooth group-hover:translate-x-1"
                    aria-hidden
                  />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="pb-8">
        <CtaBand
          title="¿Prefiere hablar con un profesional en concreto?"
          description="Al solicitar una cita puede elegir el área y el abogado con quien desea reunirse, presencialmente o por videollamada."
          primaryLabel="Solicitar cita"
          primaryHref={routes.appointment}
        />
      </section>
    </>
  );
}
