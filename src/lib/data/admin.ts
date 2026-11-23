import 'server-only';

import { cache } from 'react';
import {
  demoAppointments,
  demoAreas,
  demoConsultations,
  demoFaqs,
  demoLawyers,
  demoPosts,
  demoServices,
} from '@/content';
import type {
  AppointmentWithRelations,
  BlogPost,
  ConsultationNote,
  ConsultationWithRelations,
  Faq,
  Lawyer,
  PracticeArea,
  Service,
} from '@/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logQueryError } from './helpers';

/**
 * ---------------------------------------------------------------------------
 * LECTURAS DEL PANEL
 * ---------------------------------------------------------------------------
 * A diferencia de `src/lib/data/*`, estas consultas devuelven TODOS los
 * registros, incluidos los inactivos y los borradores. El acceso queda
 * restringido por las políticas RLS: solo el personal del estudio puede leer
 * consultas, citas y contenido despublicado.
 *
 * Sin Supabase configurado devuelven el contenido de demostración, para poder
 * revisar la interfaz del panel en modo solo lectura.
 * ---------------------------------------------------------------------------
 */

/* ------------------------------- Consultas -------------------------------- */

export const adminGetConsultations = cache(async (): Promise<ConsultationWithRelations[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoConsultations;

  const { data, error } = await supabase
    .from('consultations')
    .select('*, area:practice_areas(id, name, slug), service:services(id, name, slug)')
    .order('created_at', { ascending: false });

  logQueryError('admin consultations', error);
  return (data as unknown as ConsultationWithRelations[]) ?? [];
});

export const adminGetConsultation = cache(
  async (id: string): Promise<ConsultationWithRelations | null> => {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return demoConsultations.find((item) => item.id === id) ?? null;

    const { data, error } = await supabase
      .from('consultations')
      .select('*, area:practice_areas(id, name, slug), service:services(id, name, slug)')
      .eq('id', id)
      .maybeSingle();

    logQueryError(`admin consultation ${id}`, error);
    return (data as unknown as ConsultationWithRelations) ?? null;
  },
);

export async function adminGetConsultationNotes(id: string): Promise<ConsultationNote[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('consultation_notes')
    .select('*')
    .eq('consultation_id', id)
    .order('created_at', { ascending: false });

  logQueryError('admin consultation_notes', error);
  return (data as ConsultationNote[]) ?? [];
}

/* --------------------------------- Citas ---------------------------------- */

export const adminGetAppointments = cache(async (): Promise<AppointmentWithRelations[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoAppointments;

  const { data, error } = await supabase
    .from('appointments')
    .select(
      '*, area:practice_areas(id, name, slug), service:services(id, name, slug), lawyer:lawyers(id, name, slug, role)',
    )
    .order('scheduled_date', { ascending: false })
    .order('scheduled_time');

  logQueryError('admin appointments', error);
  return (data as unknown as AppointmentWithRelations[]) ?? [];
});

/* ------------------------------- Contenido -------------------------------- */

export const adminGetAreas = cache(async (): Promise<PracticeArea[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoAreas;

  const { data, error } = await supabase.from('practice_areas').select('*').order('sort_order');
  logQueryError('admin practice_areas', error);
  return (data as PracticeArea[]) ?? [];
});

export const adminGetServices = cache(async (): Promise<Service[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoServices;

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('area_id')
    .order('sort_order');

  logQueryError('admin services', error);
  return (data as Service[]) ?? [];
});

export const adminGetLawyers = cache(async (): Promise<Lawyer[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoLawyers;

  const { data, error } = await supabase.from('lawyers').select('*').order('sort_order');
  logQueryError('admin lawyers', error);
  return (data as Lawyer[]) ?? [];
});

export const adminGetPosts = cache(async (): Promise<BlogPost[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoPosts;

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  logQueryError('admin blog_posts', error);
  return (data as BlogPost[]) ?? [];
});

export const adminGetFaqs = cache(async (): Promise<Faq[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoFaqs;

  const { data, error } = await supabase.from('faqs').select('*').order('sort_order');
  logQueryError('admin faqs', error);
  return (data as Faq[]) ?? [];
});

/* -------------------------------- Resumen --------------------------------- */

export interface DashboardStats {
  newConsultations: number;
  totalConsultations: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  publishedPosts: number;
  draftPosts: number;
  activeLawyers: number;
  activeServices: number;
}

export async function adminGetDashboardStats(): Promise<DashboardStats> {
  const [consultations, appointments, posts, lawyers, services] = await Promise.all([
    adminGetConsultations(),
    adminGetAppointments(),
    adminGetPosts(),
    adminGetLawyers(),
    adminGetServices(),
  ]);

  return {
    newConsultations: consultations.filter((item) => item.status === 'nueva').length,
    totalConsultations: consultations.length,
    pendingAppointments: appointments.filter((item) => item.status === 'pendiente').length,
    confirmedAppointments: appointments.filter((item) => item.status === 'confirmada').length,
    publishedPosts: posts.filter((item) => item.status === 'publicado').length,
    draftPosts: posts.filter((item) => item.status === 'borrador').length,
    activeLawyers: lawyers.filter((item) => item.is_active).length,
    activeServices: services.filter((item) => item.is_active).length,
  };
}
