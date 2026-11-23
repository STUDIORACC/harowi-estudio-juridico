'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config';

let client: SupabaseClient | null = null;

/**
 * Cliente de navegador. Solo se usa en el panel para iniciar sesion y para
 * subir imagenes a Storage; el resto de lecturas y escrituras ocurren en el
 * servidor. Devuelve `null` en modo demostracion.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return client;
}
