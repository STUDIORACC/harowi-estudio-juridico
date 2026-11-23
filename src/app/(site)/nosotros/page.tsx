import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, MapPin, Video } from 'lucide-react';
import { AreaIcon } from '@/components/site/AreaCard';
import { CtaBand } from '@/components/site/CtaBand';
import { PageHeader } from '@/components/site/PageHeader';
import { SectionHeading } from '@/components/ui/Card';
import { ImageFrame } from '@/components/ui/ImageFrame';
import { Reveal } from '@/components/ui/Reveal';
import { routes } from '@/config/site';
import { getAreasWithServices, getLawyers, getSiteSettings } from '@/lib/data';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: 'Nosotros',
    description: `Conozca ${settings.studio_legal_name}: su historia, su filosofía de trabajo, sus valores y la metodología con la que aborda cada caso.`,
    alternates: { canonical: routes.about },
  };
}

export default async function AboutPage() {
  const [settings, areas, lawyers] = await Promise.all([
    getSiteSettings(),
    getAreasWithServices(),
    getLawyers(),
  ]);

  return (
    <>
      <PageHeader
        overline="Nosotros"
        title="Un estudio que explica antes de comprometerse"
        description={settings.description}
        breadcrumbs={[{ label: 'Inicio', href: routes.home }, { label: 'Nosotros' }]}
      />

      {/* ------------------------------ HISTORIA ------------------------------- */}
      <section className="shell grid gap-12 py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
        <div className="lg:col-span-7">
          <Reveal>
            <p className="overline mb-5">El estudio</p>
            <h2 className="text-[1.75rem] leading-tight sm:text-[2.125rem]">Nuestra historia</h2>
            <div className="prose-legal mt-7">
              {settings.about_intro.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120} className="mt-12">
            <blockquote className="border-l-2 border-accent pl-6 font-display text-[1.1875rem] leading-relaxed text-ink sm:text-[1.375rem]">
              {settings.about_philosophy}
            </blockquote>
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <Reveal delay={100}>
            <ImageFrame
              src={settings.hero_image_url}
              alt={`Oficina de ${settings.studio_legal_name}`}
              ratio="portrait"
              tone="stone"
              sizes="(max-width: 1024px) 100vw, 40vw"
              placeholderLabel="Fotografía del estudio"
            />
          </Reveal>
        </div>
      </section>

      {/* ------------------------------- VALORES ------------------------------- */}
      <section className="border-y border-line bg-paper-alt/50 py-16 sm:py-20 lg:py-24">
        <div className="shell">
          <SectionHeading
            overline="Valores"
            title="Los principios que ordenan el trabajo"
            description="No son declaraciones: describen cómo se decide cuando el caso presenta una disyuntiva."
          />

          <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {settings.about_values.map((value, index) => (
              <Reveal as="li" key={value.title} delay={index * 70} className="bg-paper p-7 sm:p-9">
                <span className="font-display text-2xs tabular-nums text-accent">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-5 font-display text-[1.25rem]">{value.title}</h3>
                <p className="mt-3.5 text-[0.9375rem] leading-relaxed text-ink-soft">
                  {value.description}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------ METODOLOGÍA ---------------------------- */}
      <section className="shell py-16 sm:py-20 lg:py-24">
        <SectionHeading
          overline="Metodología"
          title="Cómo trabajamos un caso"
          description="El mismo recorrido para todos los asuntos, con independencia de la materia y del tamaño del caso."
        />

        <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {settings.about_method.map((step, index) => (
            <Reveal as="li" key={step.step} delay={index * 70} className="bg-paper p-7 sm:p-8">
              <span className="font-display text-[0.8125rem] tabular-nums text-accent">
                {step.step}
              </span>
              <h3 className="mt-5 font-display text-[1.0625rem]">{step.title}</h3>
              <p className="mt-3 text-[0.875rem] leading-relaxed text-ink-soft">
                {step.description}
              </p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ---------------------------- ESPECIALIDADES --------------------------- */}
      <section className="shell py-16 sm:py-20 lg:py-24">
        <SectionHeading
          overline="Especialidades"
          title="Materias en las que interviene el estudio"
          action={
            <Link
              href={routes.areas}
              className="link-underline inline-flex items-center gap-2 text-[0.875rem] text-ink"
            >
              Ver todos los servicios
              <ArrowRight className="h-3.5 w-3.5 text-accent" aria-hidden />
            </Link>
          }
        />

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {areas.map((area, index) => (
            <Reveal as="li" key={area.id} delay={index * 60}>
              <Link
                href={`${routes.areas}#${area.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-line bg-paper p-6 transition-colors duration-500 hover:border-ink/20"
              >
                <AreaIcon name={area.icon} className="h-5 w-5 text-accent" />
                <h3 className="mt-6 font-display text-[1.0625rem] transition-colors group-hover:text-accent">
                  {area.name}
                </h3>
                <p className="mt-3 flex-1 text-[0.8125rem] leading-relaxed text-ink-soft">
                  {area.tagline}
                </p>
                <span className="mt-5 text-2xs uppercase tracking-overline text-ink-muted">
                  {area.services.length}{' '}
                  {area.services.length === 1 ? 'servicio' : 'servicios'}
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ----------------------- UBICACIÓN Y MODALIDAD ------------------------- */}
      <section className="shell pb-16 sm:pb-20">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          <div className="bg-paper p-7 sm:p-9">
            <MapPin className="h-5 w-5 text-accent" aria-hidden />
            <h3 className="mt-6 font-display text-[1.0625rem]">Ubicación</h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
              {settings.address}
              <br />
              {settings.address_city}
            </p>
            <Link
              href={routes.contact}
              className="link-underline mt-5 inline-block text-[0.8125rem] text-ink"
            >
              Cómo llegar
            </Link>
          </div>

          <div className="bg-paper p-7 sm:p-9">
            <Clock className="h-5 w-5 text-accent" aria-hidden />
            <h3 className="mt-6 font-display text-[1.0625rem]">Horario de atención</h3>
            <ul className="mt-3 space-y-1.5 text-[0.9375rem] text-ink-soft">
              {settings.business_hours.map((hour) => (
                <li key={hour.days} className="flex justify-between gap-4">
                  <span>{hour.days}</span>
                  <span className="text-ink-muted">{hour.hours}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-paper p-7 sm:p-9">
            <Video className="h-5 w-5 text-accent" aria-hidden />
            <h3 className="mt-6 font-display text-[1.0625rem]">Modalidad de atención</h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
              Atención presencial en la oficina y por videollamada, con el mismo seguimiento y la
              misma reserva en ambos casos.
            </p>
            <Link
              href={routes.appointment}
              className="link-underline mt-5 inline-block text-[0.8125rem] text-ink"
            >
              Solicitar una cita
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------- EQUIPO -------------------------------- */}
      {lawyers.length > 0 ? (
        <section className="shell pb-16 sm:pb-20">
          <SectionHeading
            overline="Equipo"
            title="Las personas del estudio"
            action={
              <Link
                href={routes.team}
                className="link-underline inline-flex items-center gap-2 text-[0.875rem] text-ink"
              >
                Ver perfiles completos
                <ArrowRight className="h-3.5 w-3.5 text-accent" aria-hidden />
              </Link>
            }
          />

          <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {lawyers.map((lawyer, index) => (
              <Reveal as="li" key={lawyer.id} delay={index * 60}>
                <Link href={`${routes.team}/${lawyer.slug}`} className="group block">
                  <ImageFrame
                    src={lawyer.photo_url}
                    alt={lawyer.name}
                    monogram={lawyer.name}
                    tone={lawyer.portrait_tone}
                    ratio="portrait"
                    sizes="(max-width: 640px) 100vw, 25vw"
                    className="transition-transform duration-700 ease-smooth group-hover:-translate-y-1"
                  />
                  <h3 className="mt-5 text-[1rem] transition-colors group-hover:text-accent">
                    {lawyer.name}
                  </h3>
                  <p className="mt-1 text-2xs text-ink-muted">{lawyer.role}</p>
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="pb-8">
        <CtaBand />
      </section>
    </>
  );
}
