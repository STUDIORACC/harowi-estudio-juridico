/**
 * ---------------------------------------------------------------------------
 * CONFIGURACION DE SUPABASE
 * ---------------------------------------------------------------------------
 * El sitio funciona en dos modos:
 *
 *   1. CONECTADO — hay variables de entorno de Supabase: todo el contenido, las
 *      consultas, las citas y el panel leen y escriben en la base de datos.
 *
 *   2. DEMOSTRACION — no hay variables: el sitio se sirve con el contenido de
 *      `src/content`, claramente marcado como demo. Sirve para revisar el
 *      diseno y la navegacion antes de conectar el proyecto real.
 *
 * `isSupabaseConfigured()` es el unico lugar donde se decide el modo.
 * ---------------------------------------------------------------------------
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/** Solo en el servidor. Se usa unicamente en scripts de mantenimiento. */
export function getServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
}
