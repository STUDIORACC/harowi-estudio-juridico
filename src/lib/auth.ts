import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { Profile } from '@/types';

/**
 * ---------------------------------------------------------------------------
 * SESIÓN DEL PANEL
 * ---------------------------------------------------------------------------
 * El panel es exclusivo del personal del estudio: no hay registro público ni
 * cuentas de clientes. Una persona puede entrar si tiene usuario en Supabase
 * Auth y una fila activa en `profiles`.
 *
 * En modo demostración (sin credenciales de Supabase) el panel se muestra en
 * modo solo lectura para poder revisar la interfaz.
 * ---------------------------------------------------------------------------
 */

export interface AdminSession {
  /** `true` cuando el panel se muestra sin base de datos conectada. */
  isDemo: boolean;
  profile: Profile | null;
  email: string | null;
}

export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  if (!isSupabaseConfigured()) {
    return { isDemo: true, profile: null, email: null };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // Sin perfil activo no hay acceso, aunque exista el usuario en Auth.
  if (!profile || !(profile as Profile).is_active) return null;

  return { isDemo: false, profile: profile as Profile, email: user.email ?? null };
});

/** Exige sesión válida; redirige al inicio de sesión si no la hay. */
export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  return session;
}

/** Mensaje devuelto por las acciones del panel cuando no hay base de datos. */
export const DEMO_WRITE_NOTICE =
  'El panel está en solo lectura porque el proyecto todavía no está conectado a Supabase. Configure las variables de entorno para habilitar la edición.';
