'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { DEMO_WRITE_NOTICE, requireAdminSession } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { FormState } from '@/lib/forms/state';
import {
  boolean,
  contentBlocks,
  lines,
  number,
  optionalText,
  processSteps,
  text,
  toSlug,
} from '@/lib/forms/parse';
import { APPOINTMENT_STATUSES, CONSULTATION_STATUSES } from '@/types';

/**
 * ---------------------------------------------------------------------------
 * ACCIONES DEL PANEL
 * ---------------------------------------------------------------------------
 * Todas exigen sesión válida y se ejecutan con el cliente de Supabase ligado a
 * esa sesión, de modo que las políticas RLS siguen aplicándose: el panel no
 * dispone de una vía privilegiada para saltarse la seguridad de la base.
 * ---------------------------------------------------------------------------
 */

/** Comprobación común: sesión válida y base de datos conectada. */
async function getClient() {
  const session = await requireAdminSession();
  const supabase = await createSupabaseServerClient();
  if (session.isDemo || !supabase) return null;
  return supabase;
}

const demoState: FormState = { status: 'demo', message: DEMO_WRITE_NOTICE };

function ok(message: string): FormState {
  return { status: 'success', message };
}

function fail(message: string): FormState {
  return { status: 'error', message };
}

/* ------------------------------- Consultas -------------------------------- */

export async function updateConsultation(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await getClient();
  if (!supabase) return demoState;

  const id = text(formData, 'id', 40);
  const status = text(formData, 'status', 20);

  if (!CONSULTATION_STATUSES.includes(status as (typeof CONSULTATION_STATUSES)[number])) {
    return fail('Estado no válido.');
  }

  const { error } = await supabase.from('consultations').update({ status }).eq('id', id);
  if (error) return fail(`No se pudo actualizar la consulta: ${error.message}`);

  revalidatePath('/admin/consultas');
  revalidatePath(`/admin/consultas/${id}`);
  return ok('Estado de la consulta actualizado.');
}

export async function addConsultationNote(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireAdminSession();
  const supabase = await getClient();
  if (!supabase) return demoState;

  const consultationId = text(formData, 'consultation_id', 40);
  const body = text(formData, 'body', 2000);
  if (body.length < 3) return fail('Escriba una nota antes de guardar.');

  const { error } = await supabase.from('consultation_notes').insert({
    consultation_id: consultationId,
    body,
    author_name: session.profile?.full_name || session.email || null,
  });

  if (error) return fail(`No se pudo guardar la nota: ${error.message}`);

  revalidatePath(`/admin/consultas/${consultationId}`);
  return ok('Nota añadida al seguimiento.');
}

export async function deleteConsultation(formData: FormData) {
  const supabase = await getClient();
  if (!supabase) return;

  const id = text(formData, 'id', 40);
  await supabase.from('consultations').delete().eq('id', id);
  revalidatePath('/admin/consultas');
  redirect('/admin/consultas');
}

/* --------------------------------- Citas ---------------------------------- */

export async function updateAppointment(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await getClient();
  if (!supabase) return demoState;

  const id = text(formData, 'id', 40);
  const status = text(formData, 'status', 20);

  if (!APPOINTMENT_STATUSES.includes(status as (typeof APPOINTMENT_STATUSES)[number])) {
    return fail('Estado no válido.');
  }

  const patch: Record<string, unknown> = {
    status,
    admin_notes: optionalText(formData, 'admin_notes', 2000),
  };

  // La reprogramación llega con nueva fecha, hora o profesional.
  const date = text(formData, 'scheduled_date', 12);
  const time = text(formData, 'scheduled_time', 6);
  const lawyerId = text(formData, 'lawyer_id', 40);
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) patch.scheduled_date = date;
  if (/^\d{2}:\d{2}$/.test(time)) patch.scheduled_time = time;
  if (lawyerId) patch.lawyer_id = lawyerId;

  const { error } = await supabase.from('appointments').update(patch).eq('id', id);
  if (error) {
    if (error.code === '23505') {
      return fail('Ese profesional ya tiene una cita vigente en el horario indicado.');
    }
    return fail(`No se pudo actualizar la cita: ${error.message}`);
  }

  revalidatePath('/admin/citas');
  return ok('Cita actualizada.');
}

export async function createAppointment(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await getClient();
  if (!supabase) return demoState;

  const payload = {
    full_name: text(formData, 'full_name', 120),
    email: text(formData, 'email', 160),
    phone: text(formData, 'phone', 20),
    area_id: optionalText(formData, 'area_id', 40),
    service_id: optionalText(formData, 'service_id', 40),
    lawyer_id: optionalText(formData, 'lawyer_id', 40),
    scheduled_date: text(formData, 'scheduled_date', 12),
    scheduled_time: text(formData, 'scheduled_time', 6),
    modality: text(formData, 'modality', 12) || 'presencial',
    status: text(formData, 'status', 20) || 'confirmada',
    subject: optionalText(formData, 'subject', 160),
    admin_notes: optionalText(formData, 'admin_notes', 2000),
    duration_minutes: number(formData, 'duration_minutes', 45),
  };

  if (!payload.full_name || !payload.scheduled_date || !payload.scheduled_time) {
    return fail('Complete nombre, fecha y hora de la cita.');
  }

  const { error } = await supabase.from('appointments').insert(payload);
  if (error) {
    if (error.code === '23505') {
      return fail('Ese profesional ya tiene una cita vigente en el horario indicado.');
    }
    return fail(`No se pudo crear la cita: ${error.message}`);
  }

  revalidatePath('/admin/citas');
  return ok('Cita creada.');
}

export async function deleteAppointment(formData: FormData) {
  const supabase = await getClient();
  if (!supabase) return;

  await supabase.from('appointments').delete().eq('id', text(formData, 'id', 40));
  revalidatePath('/admin/citas');
}

/* --------------------------------- Áreas ---------------------------------- */

export async function saveArea(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await getClient();
  if (!supabase) return demoState;

  const id = text(formData, 'id', 40);
  const name = text(formData, 'name', 120);
  if (!name) return fail('El nombre del área es obligatorio.');

  const payload = {
    name,
    slug: text(formData, 'slug', 80) || toSlug(name),
    short_name: text(formData, 'short_name', 40) || name,
    icon: text(formData, 'icon', 40) || 'Scale',
    tagline: text(formData, 'tagline', 200),
    summary: text(formData, 'summary', 600),
    intro: lines(formData, 'intro', 8),
    sort_order: number(formData, 'sort_order'),
    is_active: boolean(formData, 'is_active'),
    seo_title: optionalText(formData, 'seo_title', 160),
    seo_description: optionalText(formData, 'seo_description', 300),
  };

  const { error } = id
    ? await supabase.from('practice_areas').update(payload).eq('id', id)
    : await supabase.from('practice_areas').insert(payload);

  if (error) return fail(`No se pudo guardar el área: ${error.message}`);

  revalidatePath('/admin/areas');
  revalidatePath('/areas');
  return ok('Área guardada.');
}

export async function deleteArea(formData: FormData) {
  const supabase = await getClient();
  if (!supabase) return;

  await supabase.from('practice_areas').delete().eq('id', text(formData, 'id', 40));
  revalidatePath('/admin/areas');
  redirect('/admin/areas');
}

/* -------------------------------- Servicios -------------------------------- */

export async function saveService(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await getClient();
  if (!supabase) return demoState;

  const id = text(formData, 'id', 40);
  const name = text(formData, 'name', 160);
  const areaId = text(formData, 'area_id', 40);
  if (!name) return fail('El nombre del servicio es obligatorio.');
  if (!areaId) return fail('Seleccione el área a la que pertenece el servicio.');

  const payload = {
    area_id: areaId,
    name,
    slug: text(formData, 'slug', 80) || toSlug(name),
    short_description: text(formData, 'short_description', 400),
    description: lines(formData, 'description', 10),
    when_needed: lines(formData, 'when_needed', 12),
    process: processSteps(formData, 'process'),
    documents: lines(formData, 'documents', 15),
    content: contentBlocks(formData, 'content'),
    image_url: optionalText(formData, 'image_url', 500),
    sort_order: number(formData, 'sort_order'),
    is_active: boolean(formData, 'is_active'),
    seo_title: optionalText(formData, 'seo_title', 160),
    seo_description: optionalText(formData, 'seo_description', 300),
  };

  const { error } = id
    ? await supabase.from('services').update(payload).eq('id', id)
    : await supabase.from('services').insert(payload);

  if (error) return fail(`No se pudo guardar el servicio: ${error.message}`);

  revalidatePath('/admin/servicios');
  revalidatePath('/areas');
  return ok('Servicio guardado.');
}

export async function deleteService(formData: FormData) {
  const supabase = await getClient();
  if (!supabase) return;

  await supabase.from('services').delete().eq('id', text(formData, 'id', 40));
  revalidatePath('/admin/servicios');
  redirect('/admin/servicios');
}

export async function saveServiceFaq(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await getClient();
  if (!supabase) return demoState;

  const serviceId = text(formData, 'service_id', 40);
  const question = text(formData, 'question', 300);
  const answer = text(formData, 'answer', 2000);
  if (!question || !answer) return fail('Complete la pregunta y la respuesta.');

  const { error } = await supabase.from('service_faqs').insert({
    service_id: serviceId,
    question,
    answer,
    sort_order: number(formData, 'sort_order'),
  });

  if (error) return fail(`No se pudo guardar la pregunta: ${error.message}`);

  revalidatePath(`/admin/servicios/${serviceId}`);
  return ok('Pregunta añadida.');
}

export async function deleteServiceFaq(formData: FormData) {
  const supabase = await getClient();
  if (!supabase) return;

  const serviceId = text(formData, 'service_id', 40);
  await supabase.from('service_faqs').delete().eq('id', text(formData, 'id', 40));
  revalidatePath(`/admin/servicios/${serviceId}`);
}

/* -------------------------------- Abogados -------------------------------- */

export async function saveLawyer(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await getClient();
  if (!supabase) return demoState;

  const id = text(formData, 'id', 40);
  const name = text(formData, 'name', 120);
  if (!name) return fail('El nombre del abogado es obligatorio.');

  const payload = {
    name,
    slug: text(formData, 'slug', 80) || toSlug(name),
    role: text(formData, 'role', 120),
    headline: text(formData, 'headline', 240),
    bio: lines(formData, 'bio', 8),
    photo_url: optionalText(formData, 'photo_url', 500),
    portrait_tone: text(formData, 'portrait_tone', 10) || 'ink',
    education: lines(formData, 'education', 12),
    experience: lines(formData, 'experience', 12),
    specialties: lines(formData, 'specialties', 12),
    languages: lines(formData, 'languages', 6),
    email: optionalText(formData, 'email', 160),
    phone: optionalText(formData, 'phone', 30),
    linkedin_url: optionalText(formData, 'linkedin_url', 300),
    sort_order: number(formData, 'sort_order'),
    is_active: boolean(formData, 'is_active'),
  };

  const { data, error } = id
    ? await supabase.from('lawyers').update(payload).eq('id', id).select('id').maybeSingle()
    : await supabase.from('lawyers').insert(payload).select('id').maybeSingle();

  if (error) return fail(`No se pudo guardar el abogado: ${error.message}`);

  // Relación con las áreas de práctica.
  const lawyerId = id || (data as { id: string } | null)?.id;
  if (lawyerId) {
    const areaIds = formData.getAll('area_ids').filter((value): value is string => typeof value === 'string');
    await supabase.from('lawyer_areas').delete().eq('lawyer_id', lawyerId);
    if (areaIds.length > 0) {
      await supabase
        .from('lawyer_areas')
        .insert(areaIds.map((areaId) => ({ lawyer_id: lawyerId, area_id: areaId })));
    }
  }

  revalidatePath('/admin/abogados');
  revalidatePath('/equipo');
  return ok('Ficha del abogado guardada.');
}

export async function deleteLawyer(formData: FormData) {
  const supabase = await getClient();
  if (!supabase) return;

  await supabase.from('lawyers').delete().eq('id', text(formData, 'id', 40));
  revalidatePath('/admin/abogados');
  redirect('/admin/abogados');
}

/* ---------------------------------- Blog ---------------------------------- */

export async function savePost(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await getClient();
  if (!supabase) return demoState;

  const id = text(formData, 'id', 40);
  const title = text(formData, 'title', 240);
  if (!title) return fail('El título del artículo es obligatorio.');

  const status = text(formData, 'status', 20) === 'publicado' ? 'publicado' : 'borrador';
  const publishedAt = text(formData, 'published_at', 12);

  const payload = {
    title,
    slug: text(formData, 'slug', 80) || toSlug(title),
    excerpt: text(formData, 'excerpt', 400),
    content: contentBlocks(formData, 'content'),
    cover_image_url: optionalText(formData, 'cover_image_url', 500),
    cover_tone: text(formData, 'cover_tone', 10) || 'ink',
    category: text(formData, 'category', 80) || 'General',
    author_id: optionalText(formData, 'author_id', 40),
    area_id: optionalText(formData, 'area_id', 40),
    status,
    published_at:
      status === 'publicado'
        ? publishedAt
          ? new Date(`${publishedAt}T09:00:00`).toISOString()
          : new Date().toISOString()
        : null,
    reading_minutes: number(formData, 'reading_minutes', 5),
    seo_title: optionalText(formData, 'seo_title', 160),
    seo_description: optionalText(formData, 'seo_description', 300),
  };

  const { error } = id
    ? await supabase.from('blog_posts').update(payload).eq('id', id)
    : await supabase.from('blog_posts').insert(payload);

  if (error) return fail(`No se pudo guardar el artículo: ${error.message}`);

  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  return ok(status === 'publicado' ? 'Artículo publicado.' : 'Borrador guardado.');
}

export async function deletePost(formData: FormData) {
  const supabase = await getClient();
  if (!supabase) return;

  await supabase.from('blog_posts').delete().eq('id', text(formData, 'id', 40));
  revalidatePath('/admin/blog');
  redirect('/admin/blog');
}

/* ---------------------------------- FAQ ----------------------------------- */

export async function saveFaq(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await getClient();
  if (!supabase) return demoState;

  const id = text(formData, 'id', 40);
  const question = text(formData, 'question', 300);
  const answer = text(formData, 'answer', 2000);
  if (!question || !answer) return fail('Complete la pregunta y la respuesta.');

  const payload = {
    question,
    answer,
    category: text(formData, 'category', 80) || 'General',
    sort_order: number(formData, 'sort_order'),
    is_active: boolean(formData, 'is_active'),
  };

  const { error } = id
    ? await supabase.from('faqs').update(payload).eq('id', id)
    : await supabase.from('faqs').insert(payload);

  if (error) return fail(`No se pudo guardar la pregunta: ${error.message}`);

  revalidatePath('/admin/faq');
  revalidatePath('/preguntas-frecuentes');
  return ok('Pregunta guardada.');
}

export async function deleteFaq(formData: FormData) {
  const supabase = await getClient();
  if (!supabase) return;

  await supabase.from('faqs').delete().eq('id', text(formData, 'id', 40));
  revalidatePath('/admin/faq');
}

/* ------------------------------ Configuración ------------------------------ */

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await getClient();
  if (!supabase) return demoState;

  const businessHours = lines(formData, 'business_hours', 7).map((line) => {
    const [days, ...rest] = line.split('|');
    return { days: (days ?? '').trim(), hours: rest.join('|').trim() };
  });

  const aboutValues = lines(formData, 'about_values', 8).map((line) => {
    const [title, ...rest] = line.split('|');
    return { title: (title ?? '').trim(), description: rest.join('|').trim() };
  });

  const payload = {
    studio_name: text(formData, 'studio_name', 80),
    studio_legal_name: text(formData, 'studio_legal_name', 160),
    tagline: text(formData, 'tagline', 120),
    description: text(formData, 'description', 600),
    logo_url: optionalText(formData, 'logo_url', 500),
    favicon_url: optionalText(formData, 'favicon_url', 500),
    hero_title: text(formData, 'hero_title', 200),
    hero_subtitle: text(formData, 'hero_subtitle', 600),
    hero_image_url: optionalText(formData, 'hero_image_url', 500),
    phone: text(formData, 'phone', 40),
    whatsapp_number: text(formData, 'whatsapp_number', 20).replace(/[^\d]/g, ''),
    whatsapp_message: text(formData, 'whatsapp_message', 300),
    email: text(formData, 'email', 160),
    address: text(formData, 'address', 240),
    address_city: text(formData, 'address_city', 120),
    map_query: text(formData, 'map_query', 240),
    business_hours: businessHours,
    business_hours_short: text(formData, 'business_hours_short', 120),
    primary_color: text(formData, 'primary_color', 20),
    accent_color: text(formData, 'accent_color', 20),
    seo_title: text(formData, 'seo_title', 160),
    seo_description: text(formData, 'seo_description', 300),
    disclaimer: text(formData, 'disclaimer', 600),
    about_intro: lines(formData, 'about_intro', 6),
    about_philosophy: text(formData, 'about_philosophy', 600),
    about_values: aboutValues,
    about_method: processSteps(formData, 'about_method'),
  };

  const { error } = await supabase.from('site_settings').update(payload).eq('id', 1);
  if (error) return fail(`No se pudo guardar la configuración: ${error.message}`);

  revalidatePath('/', 'layout');
  return ok('Configuración guardada. Los cambios ya se reflejan en el sitio.');
}
