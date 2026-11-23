import 'server-only';

import { cache } from 'react';
import { demoAreas, demoServiceFaqs, demoServices } from '@/content';
import type {
  AreaWithServices,
  PracticeArea,
  Service,
  ServiceFaq,
  ServiceWithRelations,
} from '@/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { bySortOrder, logQueryError } from './helpers';

/**
 * ---------------------------------------------------------------------------
 * ÁREAS DE PRÁCTICA Y SERVICIOS
 * ---------------------------------------------------------------------------
 * El catálogo público: cuatro áreas y los servicios que dependen de cada una.
 * Cada servicio tiene su propia página en /areas/[slug].
 * ---------------------------------------------------------------------------
 */

export const getAreas = cache(async (): Promise<PracticeArea[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoAreas;

  const { data, error } = await supabase
    .from('practice_areas')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  logQueryError('practice_areas', error);
  if (!data || data.length === 0) return demoAreas;
  return data as PracticeArea[];
});

export const getServices = cache(async (): Promise<Service[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoServices;

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  logQueryError('services', error);
  if (!data || data.length === 0) return demoServices;
  return data as Service[];
});

/** Áreas con sus servicios anidados, en el orden en que se muestran en el sitio. */
export const getAreasWithServices = cache(async (): Promise<AreaWithServices[]> => {
  const [areas, services] = await Promise.all([getAreas(), getServices()]);

  return areas.map((area) => ({
    ...area,
    services: services.filter((service) => service.area_id === area.id).sort(bySortOrder),
  }));
});

export const getAreaBySlug = cache(async (slug: string): Promise<PracticeArea | null> => {
  const areas = await getAreas();
  return areas.find((area) => area.slug === slug) ?? null;
});

/** Servicio completo con su área y sus preguntas frecuentes. */
export const getServiceBySlug = cache(async (slug: string): Promise<ServiceWithRelations | null> => {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('services')
      .select('*, area:practice_areas(*), faqs:service_faqs(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    logQueryError(`services:${slug}`, error);

    if (data) {
      const service = data as unknown as ServiceWithRelations;
      return {
        ...service,
        faqs: [...(service.faqs ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      };
    }
  }

  // Contenido de demostración.
  const service = demoServices.find((item) => item.slug === slug);
  if (!service) return null;

  const area = demoAreas.find((item) => item.id === service.area_id);
  if (!area) return null;

  const faqs = demoServiceFaqs
    .filter((faq) => faq.service_id === service.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  return { ...service, area, faqs };
});

/** Otros servicios de la misma área, para la navegación cruzada. */
export const getRelatedServices = cache(
  async (areaId: string, excludeServiceId: string): Promise<Service[]> => {
    const services = await getServices();
    return services
      .filter((service) => service.area_id === areaId && service.id !== excludeServiceId)
      .sort(bySortOrder);
  },
);

/** Preguntas frecuentes de un servicio (usado por el panel). */
export async function getServiceFaqs(serviceId: string): Promise<ServiceFaq[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return demoServiceFaqs.filter((faq) => faq.service_id === serviceId);
  }

  const { data, error } = await supabase
    .from('service_faqs')
    .select('*')
    .eq('service_id', serviceId)
    .order('sort_order');

  logQueryError('service_faqs', error);
  return (data as ServiceFaq[]) ?? [];
}
