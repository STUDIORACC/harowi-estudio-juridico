import 'server-only';

import { cache } from 'react';
import { demoSettings, demoSocialLinks } from '@/content';
import type { SiteSettings, SocialLink } from '@/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logQueryError } from './helpers';

/**
 * Configuración del estudio (tabla `site_settings`, fila única id = 1).
 * `cache` evita repetir la consulta dentro de un mismo renderizado.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoSettings;

  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();

  logQueryError('site_settings', error);
  if (!data) return demoSettings;

  // Las columnas JSONB pueden venir nulas si la fila se creó a mano.
  return {
    ...demoSettings,
    ...(data as Partial<SiteSettings>),
    business_hours: (data.business_hours as SiteSettings['business_hours']) ?? demoSettings.business_hours,
    about_intro: (data.about_intro as string[]) ?? demoSettings.about_intro,
    about_values: (data.about_values as SiteSettings['about_values']) ?? demoSettings.about_values,
    about_method: (data.about_method as SiteSettings['about_method']) ?? demoSettings.about_method,
  };
});

export const getSocialLinks = cache(async (): Promise<SocialLink[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoSocialLinks;

  const { data, error } = await supabase
    .from('social_links')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  logQueryError('social_links', error);
  if (!data || data.length === 0) return demoSocialLinks;
  return data as SocialLink[];
});

/** Enlace de WhatsApp con mensaje contextual. */
export function whatsappUrl(settings: SiteSettings, message?: string) {
  const text = message?.trim() || settings.whatsapp_message;
  return `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(text)}`;
}

/** Número de teléfono en formato apto para `tel:`. */
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
