import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Clock,
  MapPin,
  ScaleIcon,
  UserRoundCheck,
  Video,
} from 'lucide-react';
import { AreaCard } from '@/components/site/AreaCard';
import { CtaBand } from '@/components/site/CtaBand';
import { ButtonLink, ExternalButtonLink } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/Card';
import { ImageFrame } from '@/components/ui/ImageFrame';
import { Reveal } from '@/components/ui/Reveal';
import { WhatsappIcon } from '@/components/whatsapp/WhatsappIcon';
import { routes } from '@/config/site';
import {
  getAreasWithServices,
  getLawyers,
  getPublishedPosts,
  getSiteSettings,
  whatsappUrl,
} from '@/lib/data';
import { formatDateLong } from '@/lib/utils';

/** Pilares de confianza. El texto es editable; no afirma cifras ni resultados. */
const pillars = [
  {
    icon: UserRoundCheck,
    title: 'Atención personalizada',
    description:
      'Un interlocutor definido para cada caso. Usted sabe siempre con quién habla y en qué estado está su expediente.',
  },
  {
    icon: ScaleIcon,
    title: 'Asesoría especializada',
    description:
      'Cada materia la asume quien la trabaja habitualmente, no un generalista que la revisa por primera vez.',
  },
  {
    icon: Briefcase,
    title: 'Experiencia profesional',
    description:
      'Criterio formado en la práctica: evaluamos la prueba disponible antes de comprometer una estrategia.',
  },
  {
    icon: Video,
    title: 'Presencial y virtual',
    description:
      'Atención en oficina o por videollamada, con el mismo seguimiento y la misma reserva en ambos casos.',
  },
];

export default async function HomePage() {
  const [settings, areas, lawyers, posts] = await Promise.all([
    getSiteSettings(),
    getAreasWithServices(),
    getLawyers(),
    getPublishedPosts(),
  ]);

  const featuredLawyers = lawyers.slice(0, 3);
  const featuredPosts = posts.slice(0, 3);

  return (
    <>
      {/* ------------------------------- HERO -------------------------------- */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-paper/30 via-paper/80 to-paper"
          aria-hidden
        />

        <div className="shell relative grid gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:gap-16 lg:py-28">
          <div className="lg:col-span-7 lg:pr-6">
            <Reveal>
              <p className="overline mb-6">{settings.studio_legal_name}</p>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="text-[2.25rem] leading-[1.06] sm:text-[3rem] lg:text-[3.75rem]">
                {settings.hero_title}
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-8 max-w-xl text-pretty text-[1.0625rem] leading-relaxed text-ink-soft sm:text-lg">
                {settings.hero_subtitle}
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <ButtonLink href={routes.consultation} size="lg">
                  Solicitar consulta
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </ButtonLink>
                <ExternalButtonLink
                  href={whatsappUrl(settings)}
                  variant="secondary"
                  size="lg"
                  className="border-ink/20"
                >
                  <WhatsappIcon className="h-4 w-4 text-[#25D366]" />
                  Hablar por WhatsApp
                </ExternalButtonLink>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <dl className="mt-14 grid gap-x-8 gap-y-5 border-t border-line pt-8 sm:grid-cols-3">
                <div>
                  <dt className="overline mb-2">Atención</dt>
                  <dd className="flex items-start gap-2 text-[0.875rem] text-ink-soft">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                    {settings.business_hours_short}
                  </dd>
                </div>
                <div>
                  <dt className="overline mb-2">Oficina</dt>
                  <dd className="flex items-start gap-2 text-[0.875rem] text-ink-soft">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                    {settings.address_city}
                  </dd>
                </div>
                <div>
                  <dt className="overline mb-2">Modalidad</dt>
                  <dd className="flex items-start gap-2 text-[0.875rem] text-ink-soft">
                    <Video className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                    Presencial y virtual
                  </dd>
                </div>
              </dl>
            </Reveal>
          </div>

          <div className="lg:col-span-5">
            <Reveal delay={200}>
              <ImageFrame
                src={settings.hero_image_url}
                alt={`Oficina de ${settings.studio_legal_name}`}
                ratio="hero"
                tone="ink"
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                placeholderLabel="Fotografía del estudio"
                className="shadow-xl shadow-ink/[0.06]"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------------------- CONFIANZA ------------------------------ */}
      <section className="shell py-16 sm:py-20 lg:py-24">
        <SectionHeading
          overline="Por qué el estudio"
          title="Un acompañamiento que se explica antes de comprometerse"
          description="No prometemos resultados. Explicamos el escenario real, las vías posibles y lo que cada una implica en tiempo y en costo."
        />

        <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar, index) => (
            <Reveal as="li" key={pillar.title} delay={index * 70} className="bg-paper p-7 sm:p-8">
              <pillar.icon className="h-5 w-5 text-accent" aria-hidden />
              <h3 className="mt-6 text-[1.0625rem] font-display">{pillar.title}</h3>
              <p className="mt-3 text-[0.875rem] leading-relaxed text-ink-soft">
                {pillar.description}
              </p>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ------------------------ ÁREAS DE PRÁCTICA -------------------------- */}
      <section className="shell py-16 sm:py-20 lg:py-24">
        <SectionHeading
          overline="Áreas de práctica"
          title="Materias en las que trabaja el estudio"
          description="Cada servicio tiene su propia página, con la explicación del proceso, la documentación orientativa y las preguntas más frecuentes."
          action={
            <ButtonLink href={routes.areas} variant="secondary" size="sm">
              Ver todas las áreas
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </ButtonLink>
          }
        />

        <div className="mt-14 grid items-start gap-6 lg:grid-cols-2">
          {areas.map((area, index) => (
            <Reveal key={area.id} delay={index * 80}>
              <AreaCard area={area} index={index} className="h-full" />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------ MÉTODO ------------------------------- */}
      <section className="border-y border-line bg-paper-alt/50 py-16 sm:py-20 lg:py-24">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <SectionHeading
              overline="Cómo trabajamos"
              title="Del primer contacto a la estrategia"
              description={settings.about_philosophy}
            />
            <ButtonLink href={routes.about} variant="secondary" size="sm" className="mt-8">
              Conocer el estudio
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </ButtonLink>
          </div>

          <ol className="lg:col-span-8">
            {settings.about_method.map((step, index) => (
              <Reveal as="li" key={step.step} delay={index * 70}>
                <div className="grid gap-4 border-b border-line py-7 sm:grid-cols-12 sm:gap-8">
                  <span className="font-display text-[0.8125rem] tabular-nums text-accent sm:col-span-1">
                    {step.step}
                  </span>
                  <h3 className="font-display text-[1.125rem] sm:col-span-4">{step.title}</h3>
                  <p className="text-[0.9375rem] leading-relaxed text-ink-soft sm:col-span-7">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------ EQUIPO ------------------------------- */}
      {featuredLawyers.length > 0 ? (
        <section className="shell py-16 sm:py-20 lg:py-24">
          <SectionHeading
            overline="Equipo"
            title="Quién llevará su caso"
            description="Cada asunto se asigna a un profesional responsable, que es además su punto de contacto durante todo el proceso."
            action={
              <ButtonLink href={routes.team} variant="secondary" size="sm">
                Ver el equipo
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </ButtonLink>
            }
          />

          <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredLawyers.map((lawyer, index) => (
              <Reveal as="li" key={lawyer.id} delay={index * 80}>
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
                  <h3 className="mt-6 text-[1.125rem] transition-colors duration-300 group-hover:text-accent">
                    {lawyer.name}
                  </h3>
                  <p className="mt-1 text-[0.8125rem] text-ink-muted">{lawyer.role}</p>
                  <p className="mt-3 text-[0.875rem] leading-relaxed text-ink-soft">
                    {lawyer.headline}
                  </p>
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ------------------------------- BLOG -------------------------------- */}
      {featuredPosts.length > 0 ? (
        <section className="shell py-16 sm:py-20 lg:py-24">
          <SectionHeading
            overline="Centro de información"
            title="Artículos y orientación general"
            description="Textos informativos sobre cómo funcionan los procesos más consultados. No sustituyen la asesoría sobre un caso concreto."
            action={
              <ButtonLink href={routes.blog} variant="secondary" size="sm">
                Ver el blog
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </ButtonLink>
            }
          />

          <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
            {featuredPosts.map((post, index) => (
              <Reveal as="li" key={post.id} delay={index * 80} className="bg-paper">
                <Link
                  href={`${routes.blog}/${post.slug}`}
                  className="group flex h-full flex-col p-7 transition-colors duration-500 hover:bg-paper-alt/60 sm:p-8"
                >
                  <span className="overline">{post.category}</span>
                  <h3 className="mt-5 text-[1.125rem] leading-snug transition-colors duration-300 group-hover:text-accent">
                    {post.title}
                  </h3>
                  <p className="mt-4 flex-1 text-[0.875rem] leading-relaxed text-ink-soft">
                    {post.excerpt}
                  </p>
                  <span className="mt-7 flex items-center justify-between text-2xs text-ink-muted">
                    {post.published_at ? formatDateLong(post.published_at.slice(0, 10)) : null}
                    <ArrowUpRight
                      className="h-3.5 w-3.5 text-accent transition-transform duration-300 ease-smooth group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>
      ) : null}

      {/* -------------------------------- CTA -------------------------------- */}
      <section className="pb-4 pt-6 sm:pb-8">
        <CtaBand />
      </section>
    </>
  );
}
