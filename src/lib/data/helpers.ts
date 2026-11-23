import 'server-only';

import type { PostgrestError } from '@supabase/supabase-js';

/**
 * ---------------------------------------------------------------------------
 * ESTRATEGIA DE LECTURA
 * ---------------------------------------------------------------------------
 * Todas las lecturas públicas siguen la misma regla:
 *
 *   1. Si Supabase no está configurado  → contenido de `src/content`.
 *   2. Si la consulta falla             → se registra el error y se usa el
 *                                         contenido de demostración, para que
 *                                         el sitio nunca quede en blanco.
 *   3. Si la consulta no devuelve filas → contenido de demostración (la base
 *                                         existe pero aún no tiene datos).
 *   4. En cualquier otro caso           → los datos reales.
 *
 * `isDemoContent` permite que la interfaz muestre el distintivo «contenido de
 * demostración» cuando corresponde.
 * ---------------------------------------------------------------------------
 */

export interface DataResult<T> {
  data: T;
  isDemo: boolean;
}

export function demoResult<T>(data: T): DataResult<T> {
  return { data, isDemo: true };
}

export function liveResult<T>(data: T): DataResult<T> {
  return { data, isDemo: false };
}

/** Registra un error de Supabase sin interrumpir el renderizado de la página. */
export function logQueryError(context: string, error: PostgrestError | null) {
  if (!error) return;
  console.error(`[supabase] ${context}: ${error.message}`, {
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

/** Ordena por `sort_order` y, a igualdad, por nombre. */
export function bySortOrder<T extends { sort_order: number; name?: string }>(a: T, b: T) {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  return (a.name ?? '').localeCompare(b.name ?? '', 'es');
}
