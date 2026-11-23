import type { FieldErrors } from '@/lib/validation/schemas';

/**
 * Estado compartido por los formularios públicos. Vive fuera del archivo
 * `'use server'` porque un módulo de Server Actions solo puede exportar
 * funciones asíncronas.
 *
 *   idle    — todavía no se ha enviado
 *   success — guardado en la base de datos
 *   demo    — validado, pero no guardado (Supabase aún no conectado)
 *   error   — errores de validación o fallo al guardar
 */
export interface FormState {
  status: 'idle' | 'success' | 'error' | 'demo';
  message?: string;
  errors?: FieldErrors;
}

export const initialFormState: FormState = { status: 'idle' };
