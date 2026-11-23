import type { MetadataRoute } from 'next';
import { siteUrl, routes } from '@/config/site';
import { getLawyers, getPublishedPosts, getServices } from '@/lib/data';

/**
 * Mapa del sitio. Incluye las páginas estáticas, las 15 páginas de servicio,
 * las fichas del equipo y los artículos publicados. Las rutas privadas y los
 * textos legales quedan fuera del índice.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, lawyers, posts] = await Promise.all([
    getServices(),
    getLawyers(),
    getPublishedPosts(),
  ]);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}${routes.home}`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${siteUrl}${routes.areas}`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${siteUrl}${routes.about}`, lastModified: now, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${siteUrl}${routes.team}`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}${routes.blog}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}${routes.faq}`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}${routes.contact}`, lastModified: now, changeFrequency: 'yearly', priority: 0.8 },
    { url: `${siteUrl}${routes.consultation}`, lastModified: now, changeFrequency: 'yearly', priority: 0.9 },
    { url: `${siteUrl}${routes.appointment}`, lastModified: now, changeFrequency: 'yearly', priority: 0.8 },
  ];

  const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${siteUrl}${routes.areas}/${service.slug}`,
    lastModified: new Date(service.updated_at),
    changeFrequency: 'monthly',
    priority: 0.9,
  }));

  const lawyerPages: MetadataRoute.Sitemap = lawyers.map((lawyer) => ({
    url: `${siteUrl}${routes.team}/${lawyer.slug}`,
    lastModified: new Date(lawyer.updated_at),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}${routes.blog}/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'yearly',
    priority: 0.6,
  }));

  return [...staticPages, ...servicePages, ...lawyerPages, ...postPages];
}
