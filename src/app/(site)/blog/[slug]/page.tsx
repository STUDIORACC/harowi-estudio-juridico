import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, Clock } from 'lucide-react';
import { ContentBlocks } from '@/components/site/ContentBlocks';
import { CtaBand } from '@/components/site/CtaBand';
import { PageHeader } from '@/components/site/PageHeader';
import { ImageFrame } from '@/components/ui/ImageFrame';
import { Reveal } from '@/components/ui/Reveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { articleSchema, breadcrumbSchema } from '@/components/seo/structured-data';
import { routes } from '@/config/site';
import {
  getPostBySlug,
  getPublishedPosts,
  getRelatedPosts,
  getSiteSettings,
} from '@/lib/data';
import { articleMessage } from '@/lib/whatsapp';
import { formatDateLong } from '@/lib/utils';

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Artículo no encontrado' };

  return {
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt,
    alternates: { canonical: `${routes.blog}/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.seo_title ?? post.title,
      description: post.seo_description ?? post.excerpt,
      url: `${routes.blog}/${post.slug}`,
      publishedTime: post.published_at ?? undefined,
      authors: post.author ? [post.author.name] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [settings, related] = await Promise.all([getSiteSettings(), getRelatedPosts(post)]);

  return (
    <>
      <JsonLd data={articleSchema(post, settings)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Inicio', url: routes.home },
          { name: 'Blog', url: routes.blog },
          { name: post.title, url: `${routes.blog}/${post.slug}` },
        ])}
      />

      <PageHeader
        overline={post.category}
        title={post.title}
        description={post.excerpt}
        breadcrumbs={[
          { label: 'Inicio', href: routes.home },
          { label: 'Blog', href: routes.blog },
          { label: post.title },
        ]}
      />

      <article className="shell grid gap-14 py-14 lg:grid-cols-12 lg:gap-16 lg:py-20">
        <div className="lg:col-span-8">
          <Reveal>
            <ImageFrame
              src={post.cover_image_url}
              alt={post.title}
              tone={post.cover_tone}
              ratio="wide"
              sizes="(max-width: 1024px) 100vw, 66vw"
              placeholderLabel={post.category}
              priority
            />
          </Reveal>

          <Reveal className="mt-12">
            <ContentBlocks blocks={post.content} />
          </Reveal>

          <Reveal className="mt-14 rounded-2xl border border-line bg-paper-alt/60 p-6 sm:p-7">
            <p className="text-[0.875rem] leading-relaxed text-ink-soft">
              ¿Su situación se parece a la descrita en este artículo? Escríbanos y le indicamos qué
              corresponde revisar en su caso concreto.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={routes.consultation}
                className="link-underline text-[0.875rem] font-medium text-ink"
              >
                Solicitar consulta
              </Link>
              <span className="text-ink-muted" aria-hidden>
                ·
              </span>
              <Link
                href={routes.appointment}
                className="link-underline text-[0.875rem] font-medium text-ink"
              >
                Solicitar cita
              </Link>
            </div>
          </Reveal>
        </div>

        <aside className="space-y-8 lg:col-span-4">
          <div className="rounded-2xl border border-line bg-paper p-6 sm:p-7">
            <p className="overline mb-5">Ficha del artículo</p>
            <dl className="space-y-3.5 text-[0.875rem]">
              {post.author ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Autor</dt>
                  <dd className="text-right">
                    <Link
                      href={`${routes.team}/${post.author.slug}`}
                      className="text-ink transition-colors hover:text-accent"
                    >
                      {post.author.name}
                    </Link>
                  </dd>
                </div>
              ) : null}
              {post.published_at ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Publicado</dt>
                  <dd className="text-right text-ink-soft">
                    {formatDateLong(post.published_at.slice(0, 10))}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Categoría</dt>
                <dd className="text-right text-ink-soft">{post.category}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Lectura</dt>
                <dd className="flex items-center gap-1.5 text-right text-ink-soft">
                  <Clock className="h-3 w-3" aria-hidden />
                  {post.reading_minutes} min
                </dd>
              </div>
            </dl>
          </div>

          {related.length > 0 ? (
            <div className="rounded-2xl border border-line bg-paper p-6 sm:p-7">
              <p className="overline mb-5">Seguir leyendo</p>
              <ul className="space-y-px">
                {related.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`${routes.blog}/${item.slug}`}
                      className="group block border-b border-line/70 py-3.5"
                    >
                      <span className="block text-[0.875rem] leading-snug text-ink-soft transition-colors group-hover:text-ink">
                        {item.title}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-2xs text-ink-muted">
                        {item.category}
                        <ArrowUpRight
                          className="h-3 w-3 text-accent transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="rounded-2xl border border-line bg-paper-alt/60 p-6 text-2xs leading-relaxed text-ink-muted">
            {settings.disclaimer}
          </p>
        </aside>
      </article>

      <section className="pb-8">
        <CtaBand whatsappMessage={articleMessage(post.title)} />
      </section>
    </>
  );
}
