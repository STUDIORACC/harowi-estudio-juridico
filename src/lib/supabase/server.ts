import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config';

/**
 * Cliente de Supabase para Server Components, Route Handlers y Server Actions.
 * Usa la sesion de la persona autenticada (cookies), de modo que las politicas
 * RLS se aplican siempre: el panel no elude la seguridad de la base de datos.
 *
 * Devuelve `null` si el proyecto aun no tiene credenciales configuradas; la
 * capa de datos (`src/lib/data`) recurre entonces al contenido de demostracion.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `set` lanza cuando se llama desde un Server Component de solo
          // lectura. El middleware ya se encarga de refrescar la sesion.
        }
      },
    },
  });
}

/** Igual que el anterior, pero lanza si Supabase no esta configurado. */
export async function requireSupabaseServerClient(): Promise<SupabaseClient> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error(
      'Supabase no esta configurado. Defina NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local',
    );
  }
  return supabase;
}
