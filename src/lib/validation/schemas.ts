import { z } from 'zod';

/**
 * ---------------------------------------------------------------------------
 * ESQUEMAS DE VALIDACIÓN
 * ---------------------------------------------------------------------------
 * Se usan en las Server Actions (validación autoritativa, del lado servidor) y
 * también en el panel para validar los formularios de administración.
 * ---------------------------------------------------------------------------
 */

/** Rango de caracteres de control que se eliminan del texto recibido. */
const CONTROL_CHARS = new RegExp('[\\u0000-\\u001F\\u007F]', 'g');

/** Elimina etiquetas y caracteres de control antes de validar. */
export function sanitize(value: unknown, maxLength = 4000): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(CONTROL_CHARS, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

const phone = z
  .string()
  .trim()
  .min(6, 'Introduzca un teléfono válido.')
  .max(20, 'El teléfono es demasiado largo.')
  .regex(/^[\d+()\s-]+$/, 'El teléfono solo puede contener números y los signos + ( ) -');

/** Trata la cadena vacía y los campos ausentes (p. ej. un select deshabilitado) como nulos. */
const emptyToNull = (value: unknown) =>
  value === '' || value === undefined || value === null ? null : value;

const optionalPhone = z.preprocess(emptyToNull, phone.nullable());

const uuid = z.string().uuid('Seleccione una opción válida.');
const optionalUuid = z.preprocess(emptyToNull, uuid.nullable());

/** Casilla de aceptación: el navegador solo la envía cuando está marcada. */
const consent = z.preprocess(
  (value) => value === 'on' || value === 'true' || value === true,
  z.literal(true, {
    errorMap: () => ({ message: 'Debe aceptar el tratamiento de sus datos para continuar.' }),
  }),
);

export const modalitySchema = z.enum(['presencial', 'virtual'], {
  errorMap: () => ({ message: 'Seleccione una modalidad de atención.' }),
});

export const preferredContactSchema = z.enum(['telefono', 'whatsapp', 'email'], {
  errorMap: () => ({ message: 'Seleccione una preferencia de contacto.' }),
});

/* ------------------------------- Consultas -------------------------------- */

export const consultationSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, 'Escriba su nombre completo.')
    .max(120, 'El nombre es demasiado largo.'),
  phone,
  whatsapp: optionalPhone,
  email: z.string().trim().email('Introduzca un correo electrónico válido.').max(160),
  area_id: optionalUuid,
  service_id: optionalUuid,
  description: z
    .string()
    .trim()
    .min(20, 'Describa su caso con al menos 20 caracteres.')
    .max(4000, 'La descripción es demasiado extensa.'),
  modality: modalitySchema,
  preferred_contact: preferredContactSchema,
  consent,
});

export type ConsultationInput = z.infer<typeof consultationSchema>;

/* --------------------------------- Citas ---------------------------------- */

/** Fecha de hoy en formato «YYYY-MM-DD», sin desplazamiento de zona horaria. */
function todayISO() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`;
}

export const appointmentSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, 'Escriba su nombre completo.')
    .max(120, 'El nombre es demasiado largo.'),
  email: z.string().trim().email('Introduzca un correo electrónico válido.').max(160),
  phone,
  area_id: optionalUuid,
  service_id: optionalUuid,
  lawyer_id: uuid,
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Seleccione una fecha.')
    .refine((value) => value >= todayISO(), 'La fecha debe ser igual o posterior a hoy.'),
  scheduled_time: z.string().regex(/^\d{2}:\d{2}$/, 'Seleccione un horario disponible.'),
  modality: modalitySchema,
  subject: z.string().trim().max(160).optional().default(''),
  notes: z.string().trim().max(2000).optional().default(''),
  consent,
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

/* -------------------------------- Contacto -------------------------------- */

export const contactSchema = z.object({
  full_name: z.string().trim().min(3, 'Escriba su nombre completo.').max(120),
  email: z.string().trim().email('Introduzca un correo electrónico válido.').max(160),
  phone,
  description: z
    .string()
    .trim()
    .min(10, 'Escriba su mensaje con al menos 10 caracteres.')
    .max(2000),
  consent,
});

/* --------------------------- Utilidades comunes --------------------------- */

export type FieldErrors = Record<string, string>;

/** Convierte los errores de Zod en un mapa campo → mensaje. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.errors) {
    const field = issue.path[0];
    if (typeof field === 'string' && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

/** Normaliza un FormData a un objeto plano saneado. */
export function formDataToObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      result[key] = sanitize(value);
    }
  }
  return result;
}
