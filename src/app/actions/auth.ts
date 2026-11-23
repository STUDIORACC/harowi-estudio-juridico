'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { FormState } from '@/lib/forms/state';
import { toFieldErrors } from '@/lib/validation/schemas';

const credentialsSchema = z.object({
  email: z.string().trim().email('Introduzca un correo electrónico válido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

/**
 * Inicio de sesión del personal del estudio. No existe registro público: las
 * cuentas se crean desde el panel de Supabase y deben tener una fila activa en
 * la tabla `profiles`.
 */
export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) {
    return {
      status: 'demo',
      message:
        'Supabase no está configurado. Defina NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local para habilitar el acceso al panel.',
    };
  }

  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Revise los datos introducidos.',
      errors: toFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { status: 'error', message: 'No se pudo conectar con el servicio de autenticación.' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // No se detalla si falla el correo o la contraseña.
    return { status: 'error', message: 'Credenciales incorrectas o usuario sin acceso al panel.' };
  }

  const redirectTo = String(formData.get('redirect') || '/admin');
  revalidatePath('/admin', 'layout');
  redirect(redirectTo.startsWith('/admin') ? redirectTo : '/admin');
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  revalidatePath('/admin', 'layout');
  redirect('/admin/login');
}
