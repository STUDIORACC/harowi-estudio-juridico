import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AreaIcon } from '@/components/site/AreaCard';
import { CtaBand } from '@/components/site/CtaBand';
import { PageHeader } from '@/components/site/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { routes } from '@/config/site';
import { getAreasWithServices, getSiteSettings } from '@/lib/data';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: 'Áreas de práctica',
    description: `Materias en las que trabaja ${settings.studio_legal_name}: derecho de familia, penal, civil y patrimonial, y empresarial. Cada servicio con su explicación y sus preguntas frecuentes.`,
    alternates: { canonical: routes.areas },
  };
}

export default async function AreasPage() {
  const areas = await getAreasWithServices();

  return (
    <>
      <PageHeader
        overline="Áreas de práctica"
        title="Materias en las que trabaja el estudio"
        description="Cada servicio tiene su propia página, con la explicación del proceso, la documentación orientativa que conviene reunir y las preguntas que se repiten en la consulta."
        breadcrumbs={[{ label: 'Inicio', href: routes.home }, { label: 'Áreas de práctica' }]}
        aside={
          <nav aria-label="Índice de áreas" className="rounded-2xl border border-line bg-paper p-6">
            <p className="overline mb-4">Ir a</p>
            <ul className="space-y-1">
              {areas.map((area) => (
                <li key={area.id}>
                  <Link
                    href={`#${area.slug}`}
                    className="flex items-center justify-between gap-4 border-b border-line/70 py-2.5 text-[0.875rem] text-ink-soft transition-colors hover:text-ink"
                  >
                    {area.name}
                    <span className="text-2xs tabular-nums text-ink-muted">
                      {area.services.length}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        }
      />

      {areas.map((area, areaIndex) => (
        <section
          key={area.id}
          id={area.slug}
          className="scroll-mt-24 border-b border-line py-16 last:border-b-0 sm:py-20"
        >
          <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <Reveal>
                <span className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-paper-alt">
                  <AreaIcon name={area.icon} className="h-5 w-5 text-accent" />
                </span>
                <p className="overline mb-4">
                  Área {String(areaIndex + 1).padStart(2, '0')}
                </p>
                <h2 className="text-[1.75rem] leading-tight sm:text-[2.125rem]">{area.name}</h2>
                <p className="mt-5 text-[0.9375rem] leading-relaxed text-ink-soft">
                  {area.tagline}
                </p>
                <div className="mt-7 space-y-4 text-[0.9375rem] leading-relaxed text-ink-soft">
                  {area.intro.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-8">
              <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
                {area.services.map((service, index) => (
                  <Reveal as="li" key={service.id} delay={index * 60} className="bg-paper">
                    <Link
                      href={`${routes.areas}/${service.slug}`}
                      className="group flex h-full flex-col p-7 transition-colors duration-500 hover:bg-paper-alt/60"
                    >
                      <h3 className="text-[1.0625rem] font-display leading-snug transition-colors duration-300 group-hover:text-accent">
                        {service.name}
                      </h3>
                      <p className="mt-3.5 flex-1 text-[0.875rem] leading-relaxed text-ink-soft">
                        {service.short_description}
                      </p>
                      <span className="mt-6 inline-flex items-center gap-2 text-2xs uppercase tracking-overline text-ink-muted transition-colors duration-300 group-hover:text-ink">
                        Ver detalle
                        <ArrowRight
                          className="h-3 w-3 text-accent transition-transform duration-300 ease-smooth group-hover:translate-x-1"
                          aria-hidden
                        />
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ))}

      <section className="py-16 sm:py-20">
        <CtaBand
          title="¿No encuentra su caso en la lista?"
          description="Muchos asuntos combinan varias materias o no encajan de forma evidente en una sola. Cuéntenos la situación y le indicamos si el estudio puede asumirla."
        />
      </section>
    </>
  );
}
