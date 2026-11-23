import 'server-only';

import { cache } from 'react';
import { demoFaqs } from '@/content';
import type { Faq } from '@/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logQueryError } from './helpers';

/** Preguntas frecuentes generales del estudio (tabla `faqs`). */
export const getFaqs = cache(async (): Promise<Faq[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoFaqs;

  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  logQueryError('faqs', error);
  if (!data || data.length === 0) return demoFaqs;
  return data as Faq[];
});

/** Agrupadas por categoría, respetando el orden de aparición. */
export const getFaqsByCategory = cache(async (): Promise<{ category: string; items: Faq[] }[]> => {
  const faqs = await getFaqs();
  const groups = new Map<string, Faq[]>();

  for (const faq of faqs) {
    const list = groups.get(faq.category) ?? [];
    list.push(faq);
    groups.set(faq.category, list);
  }

  return [...groups.entries()].map(([category, items]) => ({ category, items }));
});
