import 'server-only';

import { cache } from 'react';
import { demoAreas, demoLawyerAreas, demoLawyers } from '@/content';
import type { Lawyer, LawyerWithAreas, PracticeArea } from '@/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logQueryError } from './helpers';

/**
 * ---------------------------------------------------------------------------
 * EQUIPO DE ABOGADOS
 * ---------------------------------------------------------------------------
 * Cada abogado tiene su ficha pública en /equipo/[slug] y puede asociarse a
 * una o varias áreas de práctica.
 * ---------------------------------------------------------------------------
 */

type AreaRef = Pick<PracticeArea, 'id' | 'name' | 'slug' | 'short_name'>;

function demoAreasFor(lawyerId: string): AreaRef[] {
  return demoLawyerAreas
    .filter((relation) => relation.lawyer_id === lawyerId)
    .map((relation) => demoAreas.find((area) => area.id === relation.area_id))
    .filter((area): area is PracticeArea => Boolean(area))
    .map(({ id, name, slug, short_name }) => ({ id, name, slug, short_name }));
}

const demoTeam = (): LawyerWithAreas[] =>
  demoLawyers.map((lawyer) => ({ ...lawyer, areas: demoAreasFor(lawyer.id) }));

export const getLawyers = cache(async (): Promise<LawyerWithAreas[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoTeam();

  const { data, error } = await supabase
    .from('lawyers')
    .select('*, lawyer_areas(practice_areas(id, name, slug, short_name))')
    .eq('is_active', true)
    .order('sort_order');

  logQueryError('lawyers', error);
  if (!data || data.length === 0) return demoTeam();

  return (data as unknown as (Lawyer & {
    lawyer_areas: { practice_areas: AreaRef | null }[] | null;
  })[]).map(({ lawyer_areas, ...lawyer }) => ({
    ...lawyer,
    areas: (lawyer_areas ?? [])
      .map((relation) => relation.practice_areas)
      .filter((area): area is AreaRef => Boolean(area)),
  }));
});

export const getLawyerBySlug = cache(async (slug: string): Promise<LawyerWithAreas | null> => {
  const lawyers = await getLawyers();
  return lawyers.find((lawyer) => lawyer.slug === slug) ?? null;
});

/** Abogados asignados a un área, para las páginas de servicio. */
export const getLawyersByArea = cache(async (areaId: string): Promise<LawyerWithAreas[]> => {
  const lawyers = await getLawyers();
  return lawyers.filter((lawyer) => lawyer.areas.some((area) => area.id === areaId));
});
