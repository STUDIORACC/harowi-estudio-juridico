import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Accordion } from '@/components/ui/Accordion';
import { CtaBand } from '@/components/site/CtaBand';
import { PageHeader } from '@/components/site/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, faqSchema } from '@/components/seo/structured-data';
import { routes } from '@/config/site';
import { getFaqs, getFaqsByCategory, getSiteSettings } from '@/lib/data';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: 'Preguntas frecuentes',
    description: `Cómo solicitar una consulta, qué documentos llevar, modalidades de atención y honorarios en ${settings.studio_legal_name}.`,
    alternates: { canonical: routes.faq },
  };
}

export default async function FaqPage() {
  const [groups, faqs] = await Promise.all([getFaqsByCategory(), getFaqs()]);

  return (
    <>
      <JsonLd data={faqSchema(faqs)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Inicio', url: routes.home },
          { name: 'Preguntas frecuentes', url: routes.faq },
        ])}
      />

      <PageHeader
        overline="Preguntas frecuentes"
        title="Lo que más se consulta"
        description="Respuestas sobre el funcionamiento del estudio: cómo solicitar una consulta, qué llevar a la primera reunión y cómo se acuerdan los honorarios."
        breadcrumbs={[{ label: 'Inicio', href: routes.home }, { label: 'Preguntas frecuentes' }]}
        aside={
          groups.length > 1 ? (
            <nav aria-label="Índice de categorías" className="rounded-2xl border border-line bg-paper p-6">
              <p className="overline mb-4">Categorías</p>
              <ul className="space-y-1">
                {groups.map((group) => (
                  <li key={group.category}>
                    <Link
                      href={`#${encodeURIComponent(group.category.toLowerCase())}`}
                      className="flex items-center justify-between gap-4 border-b border-line/70 py-2.5 text-[0.875rem] text-ink-soft transition-colors hover:text-ink"
                    >
                      {group.category}
                      <span className="text-2xs tabular-nums text-ink-muted">
                        {group.items.length}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : undefined
        }
      />

      <section className="shell py-16 sm:py-20">
        <div className="space-y-16">
          {groups.map((group) => (
            <div
              key={group.category}
              id={encodeURIComponent(group.category.toLowerCase())}
              className="scroll-mt-24 grid gap-8 lg:grid-cols-12 lg:gap-16"
            >
              <div className="lg:col-span-4">
                <Reveal>
                  <h2 className="font-display text-[1.5rem] sm:text-[1.75rem]">{group.category}</h2>
                  <p className="mt-3 text-[0.875rem] text-ink-muted">
                    {group.items.length}{' '}
                    {group.items.length === 1 ? 'pregunta' : 'preguntas'}
                  </p>
                </Reveal>
              </div>
              <div className="lg:col-span-8">
                <Reveal delay={80}>
                  <Accordion
                    items={group.items.map((faq) => ({
                      question: faq.question,
                      answer: faq.answer,
                    }))}
                  />
                </Reveal>
              </div>
            </div>
          ))}
        </div>

        <Reveal className="mt-16 rounded-2xl border border-line bg-paper-alt/60 p-7 sm:p-9">
          <h2 className="font-display text-[1.25rem]">¿Su pregunta no está aquí?</h2>
          <p className="mt-3 max-w-prose text-[0.9375rem] leading-relaxed text-ink-soft">
            Las preguntas de esta página son sobre el funcionamiento del estudio. Si su duda es
            sobre un caso concreto, lo adecuado es una consulta: necesitamos ver la documentación
            antes de dar una respuesta.
          </p>
          <Link
            href={routes.consultation}
            className="link-underline mt-6 inline-flex items-center gap-2 text-[0.875rem] font-medium text-ink"
          >
            Cuéntenos su caso
            <ArrowRight className="h-3.5 w-3.5 text-accent" aria-hidden />
          </Link>
        </Reveal>
      </section>

      <section className="pb-8">
        <CtaBand />
      </section>
    </>
  );
}
