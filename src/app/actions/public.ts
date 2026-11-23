'use server';

import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import {
  appointmentSchema,
  consultationSchema,
  contactSchema,
  formDataToObject,
  toFieldErrors,
} from '@/lib/validation/schemas';
import type { FormState } from '@/lib/forms/state';

/**
 * ---------------------------------------------------------------------------
 * ACCIONES PÚBLICAS
 * ---------------------------------------------------------------------------
 * Consultas y solicitudes de cita enviadas por visitantes. La validación
 * definitiva ocurre aquí, en el servidor, y la inserción se realiza con la
 * clave anónima: las políticas RLS solo permiten CREAR, nunca leer ni
 * modificar registros ajenos.
 * ---------------------------------------------------------------------------
 */

/** Identificador aproximado del visitante para el limitador de peticiones. */
async function requestKey(scope: string) {
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || headerList.get('x-real-ip') || 'local';
  return `${scope}:${ip}`;
}

const DEMO_NOTICE =
  'Recibimos su solicitud, pero el sistema aún no está conectado a la base de datos y no pudo guardarla. Por favor, escríbanos por WhatsApp para atenderle.';

/* ------------------------------- Consultas -------------------------------- */

export async function submitConsultation(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const key = await requestKey('consulta');
  if (!rateLimit(key, 5, 60_000).allowed) {
    return {
      status: 'error',
      message: 'Ha enviado varias consultas seguidas. Espere un minuto antes de volver a intentarlo.',
    };
  }

  const parsed = consultationSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Revise los campos marcados.',
      errors: toFieldErrors(parsed.error),
    };
  }

  const { consent: _consent, ...values } = parsed.data;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    console.info('[demo] consulta recibida:', values.full_name, values.email);
    return { status: 'demo', message: DEMO_NOTICE };
  }

  const { error } = await supabase.from('consultations').insert({
    ...values,
    status: 'nueva',
    source: 'web',
  });

  if (error) {
    console.error('[supabase] insert consultations:', error.message);
    return {
      status: 'error',
      message:
        'No pudimos registrar su consulta en este momento. Vuelva a intentarlo o escríbanos por WhatsApp.',
    };
  }

  return {
    status: 'success',
    message:
      'Recibimos su consulta. El estudio la revisará dentro del horario de atención y se comunicará por el medio que indicó.',
  };
}

/* --------------------------------- Citas ---------------------------------- */

export async function requestAppointment(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const key = await requestKey('cita');
  if (!rateLimit(key, 5, 60_000).allowed) {
    return {
      status: 'error',
      message: 'Ha enviado varias solicitudes seguidas. Espere un minuto antes de volver a intentarlo.',
    };
  }

  const parsed = appointmentSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Revise los campos marcados.',
      errors: toFieldErrors(parsed.error),
    };
  }

  const { consent: _consent, subject, notes, ...values } = parsed.data;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    console.info('[demo] cita solicitada:', values.scheduled_date, values.scheduled_time);
    return { status: 'demo', message: DEMO_NOTICE };
  }

  const { error } = await supabase.from('appointments').insert({
    ...values,
    subject: subject || null,
    notes: notes || null,
    status: 'pendiente',
    duration_minutes: 45,
  });

  if (error) {
    // El índice único impide dos citas vigentes en el mismo horario.
    if (error.code === '23505') {
      return {
        status: 'error',
        message: 'Ese horario acaba de ocuparse. Seleccione otro y vuelva a enviar la solicitud.',
        errors: { scheduled_time: 'Horario no disponible.' },
      };
    }

    console.error('[supabase] insert appointments:', error.message);
    return {
      status: 'error',
      message:
        'No pudimos registrar su solicitud en este momento. Vuelva a intentarlo o escríbanos por WhatsApp.',
    };
  }

  return {
    status: 'success',
    message:
      'Su solicitud quedó registrada como pendiente. El estudio confirmará la cita por el canal de contacto que indicó.',
  };
}

/* -------------------------------- Contacto -------------------------------- */

export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const key = await requestKey('contacto');
  if (!rateLimit(key, 5, 60_000).allowed) {
    return {
      status: 'error',
      message: 'Ha enviado varios mensajes seguidos. Espere un minuto antes de volver a intentarlo.',
    };
  }

  const parsed = contactSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Revise los campos marcados.',
      errors: toFieldErrors(parsed.error),
    };
  }

  const { consent: _consent, ...values } = parsed.data;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    console.info('[demo] mensaje de contacto:', values.full_name);
    return { status: 'demo', message: DEMO_NOTICE };
  }

  // Los mensajes de contacto se registran como consultas con origen distinto.
  const { error } = await supabase.from('consultations').insert({
    full_name: values.full_name,
    email: values.email,
    phone: values.phone,
    description: values.description,
    modality: 'presencial',
    preferred_contact: 'email',
    status: 'nueva',
    source: 'contacto',
  });

  if (error) {
    console.error('[supabase] insert contacto:', error.message);
    return {
      status: 'error',
      message: 'No pudimos enviar su mensaje. Vuelva a intentarlo o escríbanos por WhatsApp.',
    };
  }

  return {
    status: 'success',
    message: 'Recibimos su mensaje. Le responderemos dentro del horario de atención.',
  };
}

/* ----------------------- Disponibilidad para el formulario ---------------- */

export async function fetchSlots(
  lawyerId: string,
  date: string,
): Promise<{ time: string; available: boolean }[]> {
  const { getSlotsFor } = await import('@/lib/data/scheduling');
  if (!lawyerId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  return getSlotsFor(lawyerId, date);
}
