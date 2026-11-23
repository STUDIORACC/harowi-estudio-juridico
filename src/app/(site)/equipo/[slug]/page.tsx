import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, GraduationCap, Linkedin, Mail, Phone, Sparkles } from 'lucide-react';
import { ButtonLink, ExternalButtonLink } from '@/components/ui/Button';
import { CtaBand } from '@/components/site/CtaBand';
import { PageHeader } from '@/components/site/PageHeader';
import { ImageFrame } from '@/components/ui/ImageFrame';
import { Reveal } from '@/components/ui/Reveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, personSchema } from '@/components/seo/structured-data';
import { WhatsappIcon } from '@/components/whatsapp/WhatsappIcon';
import { routes } from '@/config/site';
import { getLawyerBySlug, getLawyers, getPublishedPosts, getSiteSettings, whatsappUrl } from '@/lib/data';
import { lawyerMessage } from '@/lib/whatsapp';
import { formatDateLong } from '@/lib/utils';

export async function generateStaticParams() {
  const lawyers = await getLawyers();
  return lawyers.map((lawyer) => ({ slug: lawyer.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lawyer = await getLawyerBySlug(slug);
  if (!lawyer) return { title: 'Perfil no encontrado' };

  return {
    title: `${lawyer.name} — ${lawyer.role}`,
    description: lawyer.seo_description ?? lawyer.headline,
    alternates: { canonical: `${routes.team}/${lawyer.slug}` },
    openGraph: {
      type: 'profile',
      title: `${lawyer.name} — ${lawyer.role}`,
      description: lawyer.seo_description ?? lawyer.headline,
      url: `${routes.team}/${lawyer.slug}`,
    },
  };
}

export default async function LawyerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lawyer = await getLawyerBySlug(slug);
  if (!lawyer) notFound();

  const [settings, posts] = await Promise.all([getSiteSettings(), getPublishedPosts()]);
  const authored = posts.filter((post) => post.author_id === lawyer.id).slice(0, 3);

  return (
    <>
      <JsonLd data={personSchema(lawyer, settings)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Inicio', url: routes.home },
          { name: 'Equipo', url: routes.team },
          { name: lawyer.name, url: `${routes.team}/${lawyer.slug}` },
        ])}
      />

      <PageHeader
        overline={lawyer.role}
        title={lawyer.name}
        description={lawyer.headline}
        breadcrumbs={[
          { label: 'Inicio', href: routes.home },
          { label: 'Equipo', href: routes.team },
          { label: lawyer.name },
        ]}
      />

      <div className="shell grid gap-14 py-16 lg:grid-cols-12 lg:gap-16 lg:py-20">
        {/* ------------------------------- LATERAL ------------------------------- */}
        <aside className="lg:col-span-4">
          <Reveal>
            <ImageFrame
              src={lawyer.photo_url}
              alt={lawyer.name}
              monogram={lawyer.name}
              tone={lawyer.portrait_tone}
              ratio="portrait"
              sizes="(max-width: 1024px) 100vw, 33vw"
              priority
            />
          </Reveal>

          <div className="mt-8 rounded-2xl border border-line bg-paper p-6">
            <p className="overline mb-5">Contacto</p>
            <ul className="space-y-3 text-[0.875rem] text-ink-soft">
              {lawyer.email ? (
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <a href={`mailto:${lawyer.email}`} className="transition-colors hover:text-ink">
                    {lawyer.email}
                  </a>
                </li>
              ) : null}
              {lawyer.phone ? (
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <span>{lawyer.phone}</span>
                </li>
              ) : null}
              {lawyer.linkedin_url ? (
                <li className="flex gap-3">
                  <Linkedin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <a
                    href={lawyer.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-ink"
                  >
                    Perfil de LinkedIn
                  </a>
                </li>
              ) : null}
              <li className="flex gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <span>{settings.business_hours_short}</span>
              </li>
            </ul>

            <div className="mt-6 flex flex-col gap-2.5">
              <ButtonLink href={`${routes.appointment}?abogado=${lawyer.slug}`} size="md">
                Solicitar cita
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </ButtonLink>
              <ExternalButtonLink
                href={whatsappUrl(settings, lawyerMessage(lawyer.name))}
                variant="secondary"
                size="md"
              >
                <WhatsappIcon className="h-4 w-4 text-[#25D366]" />
                Escribir por WhatsApp
              </ExternalButtonLink>
            </div>
          </div>
        </aside>

        {/* ------------------------------ CONTENIDO ------------------------------ */}
        <div className="lg:col-span-8">
          <Reveal>
            <h2 className="font-display text-[1.5rem] sm:text-[1.75rem]">Perfil profesional</h2>
            <div className="prose-legal mt-6">
              {lawyer.bio.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </Reveal>

          {lawyer.areas.length > 0 ? (
            <Reveal className="mt-14">
              <h2 className="font-display text-[1.5rem] sm:text-[1.75rem]">Áreas de práctica</h2>
              <ul className="mt-6 flex flex-wrap gap-2">
                {lawyer.areas.map((area) => (
                  <li key={area.id}>
                    <Link
                      href={`${routes.areas}#${area.slug}`}
                      className="inline-flex rounded-full border border-line px-4 py-2 text-[0.8125rem] text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
                    >
                      {area.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : null}

          {lawyer.specialties.length > 0 ? (
            <Reveal className="mt-14">
              <h2 className="font-display text-[1.5rem] sm:text-[1.75rem]">Especialidades</h2>
              <ul className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
                {lawyer.specialties.map((specialty) => (
                  <li
                    key={specialty}
                    className="bg-paper px-6 py-4 text-[0.9375rem] text-ink-soft"
                  >
                    {specialty}
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : null}

          <div className="mt-14 grid gap-12 sm:grid-cols-2">
            {lawyer.education.length > 0 ? (
              <Reveal>
                <h2 className="flex items-center gap-2.5 font-display text-[1.25rem]">
                  <GraduationCap className="h-4 w-4 text-accent" aria-hidden />
                  Formación
                </h2>
                <ul className="mt-5 space-y-3">
                  {lawyer.education.map((item) => (
                    <li
                      key={item}
                      className="border-b border-line pb-3 text-[0.9375rem] leading-relaxed text-ink-soft"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ) : null}

            {lawyer.experience.length > 0 ? (
              <Reveal delay={80}>
                <h2 className="flex items-center gap-2.5 font-display text-[1.25rem]">
                  <Sparkles className="h-4 w-4 text-accent" aria-hidden />
                  Experiencia
                </h2>
                <ul className="mt-5 space-y-3">
                  {lawyer.experience.map((item) => (
                    <li
                      key={item}
                      className="border-b border-line pb-3 text-[0.9375rem] leading-relaxed text-ink-soft"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ) : null}
          </div>

          {lawyer.languages.length > 0 ? (
            <Reveal className="mt-14">
              <h2 className="font-display text-[1.25rem]">Idiomas</h2>
              <p className="mt-3 text-[0.9375rem] text-ink-soft">{lawyer.languages.join(' · ')}</p>
            </Reveal>
          ) : null}

          {authored.length > 0 ? (
            <Reveal className="mt-14">
              <h2 className="font-display text-[1.5rem] sm:text-[1.75rem]">Artículos publicados</h2>
              <ul className="mt-6 space-y-px">
                {authored.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`${routes.blog}/${post.slug}`}
                      className="group flex items-start justify-between gap-6 border-b border-line py-4"
                    >
                      <span>
                        <span className="block text-[0.9375rem] text-ink transition-colors group-hover:text-accent">
                          {post.title}
                        </span>
                        <span className="mt-1 block text-2xs text-ink-muted">
                          {post.category}
                          {post.published_at
                            ? ` · ${formatDateLong(post.published_at.slice(0, 10))}`
                            : ''}
                        </span>
                      </span>
                      <ArrowRight
                        className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-muted/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-accent"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : null}
        </div>
      </div>

      <section className="pb-8">
        <CtaBand
          title="¿Desea coordinar una reunión?"
          description="Puede solicitar una cita indicando el área, la fecha y el horario que le resulten convenientes. El estudio confirma la disponibilidad por el canal que prefiera."
          primaryLabel="Solicitar cita"
          primaryHref={`${routes.appointment}?abogado=${lawyer.slug}`}
          whatsappMessage={lawyerMessage(lawyer.name)}
        />
      </section>
    </>
  );
}
