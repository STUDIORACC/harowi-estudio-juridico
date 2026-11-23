import 'server-only';

import { cache } from 'react';
import { demoAvailability, demoBlockedDates } from '@/content';
import type { BlockedDate, LawyerAvailability } from '@/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildSlots } from '@/lib/scheduling';
import { logQueryError } from './helpers';

/**
 * ---------------------------------------------------------------------------
 * DISPONIBILIDAD PARA LA SOLICITUD DE CITAS
 * ---------------------------------------------------------------------------
 * Los horarios ocupados se obtienen mediante la función `taken_slots`, que
 * devuelve únicamente las horas tomadas: el visitante nunca accede a los datos
 * personales de otras citas.
 * ---------------------------------------------------------------------------
 */

export const getAvailability = cache(async (): Promise<LawyerAvailability[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoAvailability;

  const { data, error } = await supabase
    .from('lawyer_availability')
    .select('*')
    .eq('is_active', true);

  logQueryError('lawyer_availability', error);
  if (!data || data.length === 0) return demoAvailability;
  return data as LawyerAvailability[];
});

export const getBlockedDates = cache(async (): Promise<BlockedDate[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoBlockedDates;

  const { data, error } = await supabase.from('blocked_dates').select('*');

  logQueryError('blocked_dates', error);
  return (data as BlockedDate[]) ?? demoBlockedDates;
});

/** Horas ya ocupadas de un abogado en una fecha concreta. */
export async function getTakenSlots(lawyerId: string, date: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc('taken_slots', {
    p_lawyer_id: lawyerId,
    p_date: date,
  });

  if (error) {
    console.error(`[supabase] taken_slots: ${error.message}`);
    return [];
  }

  return ((data as { scheduled_time: string }[]) ?? []).map((row) => row.scheduled_time);
}

/** Horarios de un abogado en una fecha, con su estado de disponibilidad. */
export async function getSlotsFor(
  lawyerId: string,
  date: string,
): Promise<{ time: string; available: boolean }[]> {
  const [availability, blocked, taken] = await Promise.all([
    getAvailability(),
    getBlockedDates(),
    getTakenSlots(lawyerId, date),
  ]);

  const isBlocked = blocked.some(
    (item) => item.date === date && (item.lawyer_id === null || item.lawyer_id === lawyerId),
  );
  if (isBlocked) return [];

  return buildSlots({
    availability: availability.filter((slot) => slot.lawyer_id === lawyerId),
    date,
    taken,
  });
}
