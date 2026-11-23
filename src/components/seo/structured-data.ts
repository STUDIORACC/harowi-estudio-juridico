import type { BlogPostWithRelations, Lawyer, ServiceWithRelations, SiteSettings } from '@/types';
import { siteUrl } from '@/config/site';

/**
 * ---------------------------------------------------------------------------
 * DATOS ESTRUCTURADOS (schema.org)
 * ---------------------------------------------------------------------------
 * Se generan a partir de la configuración administrable del estudio, de modo
 * que no haya datos duplicados entre el marcado y el contenido visible.
 * ---------------------------------------------------------------------------
 */

export function legalServiceSchema(settings: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    '@id': `${siteUrl}/#estudio`,
    name: settings.studio_legal_name,
    description: settings.description,
    url: siteUrl,
    telephone: settings.phone,
    email: settings.email,
    image: settings.logo_url ?? undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address,
      addressLocality: settings.address_city,
      addressCountry: 'PE',
    },
    areaServed: { '@type': 'Country', name: 'Perú' },
    availableLanguage: ['es'],
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.url}`,
    })),
  };
}

export function serviceSchema(service: ServiceWithRelations, settings: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.short_description,
    serviceType: service.area.name,
    url: `${siteUrl}/areas/${service.slug}`,
    provider: {
      '@type': 'LegalService',
      name: settings.studio_legal_name,
      url: siteUrl,
    },
    areaServed: { '@type': 'Country', name: 'Perú' },
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function personSchema(lawyer: Lawyer, settings: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: lawyer.name,
    jobTitle: lawyer.role,
    description: lawyer.headline,
    image: lawyer.photo_url ?? undefined,
    url: `${siteUrl}/equipo/${lawyer.slug}`,
    knowsAbout: lawyer.specialties,
    worksFor: {
      '@type': 'LegalService',
      name: settings.studio_legal_name,
      url: siteUrl,
    },
  };
}

export function articleSchema(post: BlogPostWithRelations, settings: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image_url ?? undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at,
    author: post.author
      ? { '@type': 'Person', name: post.author.name, url: `${siteUrl}/equipo/${post.author.slug}` }
      : { '@type': 'Organization', name: settings.studio_legal_name },
    publisher: {
      '@type': 'Organization',
      name: settings.studio_legal_name,
      url: siteUrl,
    },
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
  };
}
