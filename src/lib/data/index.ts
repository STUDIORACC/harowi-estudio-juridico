/**
 * ---------------------------------------------------------------------------
 * CAPA DE ACCESO A DATOS
 * ---------------------------------------------------------------------------
 * Único punto de entrada para leer contenido desde los Server Components.
 * Decide entre Supabase y el contenido de demostración; los componentes nunca
 * importan `src/content` directamente.
 * ---------------------------------------------------------------------------
 */

export { getAreaBySlug, getAreas, getAreasWithServices, getRelatedServices, getServiceBySlug, getServiceFaqs, getServices } from './catalog';
export { getPostBySlug, getPostCategories, getPublishedPosts, getRelatedPosts } from './blog';
export { getFaqs, getFaqsByCategory } from './faqs';
export { getLawyerBySlug, getLawyers, getLawyersByArea } from './team';
export { getAvailability, getBlockedDates, getSlotsFor, getTakenSlots } from './scheduling';
export { getSiteSettings, getSocialLinks, telHref, whatsappUrl } from './settings';
export type { DataResult } from './helpers';
