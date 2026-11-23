import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Clock } from 'lucide-react';
import { CtaBand } from '@/components/site/CtaBand';
import { PageHeader } from '@/components/site/PageHeader';
import { ImageFrame } from '@/components/ui/ImageFrame';
import { Reveal } from '@/components/ui/Reveal';
import { routes } from '@/config/site';
import { getPostCategories, getPublishedPosts, getSiteSettings } from '@/lib/data';
import { cn, formatDateLong } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: 'Blog',
    description: `Artículos informativos de ${settings.studio_legal_name} sobre procesos de familia, penales, civiles y empresariales. Contenido general y orientativo.`,
    alternates: { canonical: routes.blog },
  };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const [{ categoria }, posts, categories] = await Promise.all([
    searchParams,
    getPublishedPosts(),
    getPostCategories(),
  ]);

  const activeCategory = categoria && categories.includes(categoria) ? categoria : null;
  const filtered = activeCategory
    ? posts.filter((post) => post.category === activeCategory)
    : posts;

  const [featured, ...rest] = filtered;

  return (
    <>
      <PageHeader
        overline="Centro de información"
        title="Blog"
        description="Textos informativos sobre cómo funcionan los procesos más consultados. Son de carácter general: no sustituyen la asesoría sobre un caso concreto."
        breadcrumbs={[{ label: 'Inicio', href: routes.home }, { label: 'Blog' }]}
      />

      <section className="shell py-14 sm:py-16">
        {/* Filtro por categoría */}
        {categories.length > 1 ? (
          <nav aria-label="Filtrar por categoría" className="flex flex-wrap gap-2">
            <Link
              href={routes.blog}
              className={cn(
                'rounded-full border px-4 py-2 text-[0.8125rem] transition-colors duration-300',
                activeCategory
                  ? 'border-line text-ink-soft hover:border-ink/30 hover:text-ink'
                  : 'border-ink bg-ink text-paper',
              )}
            >
              Todos
            </Link>
            {categories.map((category) => (
              <Link
                key={category}
                href={`${routes.blog}?categoria=${encodeURIComponent(category)}`}
                className={cn(
                  'rounded-full border px-4 py-2 text-[0.8125rem] transition-colors duration-300',
                  activeCategory === category
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line text-ink-soft hover:border-ink/30 hover:text-ink',
                )}
              >
                {category}
              </Link>
            ))}
          </nav>
        ) : null}

        {filtered.length === 0 ? (
          <p className="mt-16 text-[0.9375rem] text-ink-muted">
            Todavía no hay artículos publicados en esta categoría.
          </p>
        ) : null}

        {/* Artículo destacado */}
        {featured ? (
          <Reveal className="mt-12">
            <Link
              href={`${routes.blog}/${featured.slug}`}
              className="group grid gap-8 lg:grid-cols-12 lg:gap-12"
            >
              <div className="lg:col-span-6">
                <ImageFrame
                  src={featured.cover_image_url}
                  alt={featured.title}
                  tone={featured.cover_tone}
                  ratio="wide"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  placeholderLabel={featured.category}
                  className="transition-transform duration-700 ease-smooth group-hover:-translate-y-1"
                />
              </div>
              <div className="flex flex-col justify-center lg:col-span-6">
                <span className="overline">{featured.category}</span>
                <h2 className="mt-5 text-[1.5rem] leading-tight transition-colors duration-300 group-hover:text-accent sm:text-[2rem]">
                  {featured.title}
                </h2>
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-soft">
                  {featured.excerpt}
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-2xs text-ink-muted">
                  {featured.author ? <span>{featured.author.name}</span> : null}
                  {featured.published_at ? (
                    <span>{formatDateLong(featured.published_at.slice(0, 10))}</span>
                  ) : null}
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" aria-hidden />
                    {featured.reading_minutes} min de lectura
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        ) : null}

        {/* Resto de artículos */}
        {rest.length > 0 ? (
          <ul className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, index) => (
              <Reveal as="li" key={post.id} delay={index * 60} className="bg-paper">
                <Link
                  href={`${routes.blog}/${post.slug}`}
                  className="group flex h-full flex-col p-7 transition-colors duration-500 hover:bg-paper-alt/60 sm:p-8"
                >
                  <span className="overline">{post.category}</span>
                  <h2 className="mt-5 text-[1.125rem] leading-snug transition-colors duration-300 group-hover:text-accent">
                    {post.title}
                  </h2>
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
        ) : null}
      </section>

      <section className="pb-8 pt-8">
        <CtaBand
          title="¿Su situación se parece a alguno de estos casos?"
          description="Los artículos explican el marco general. Para saber qué corresponde en su caso concreto hace falta revisar la documentación."
        />
      </section>
    </>
  );
}
