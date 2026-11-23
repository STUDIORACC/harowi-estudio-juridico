/**
 * ---------------------------------------------------------------------------
 * CARGA DEL CONTENIDO INICIAL EN SUPABASE
 * ---------------------------------------------------------------------------
 * Vuelca el contenido de `src/content` en la base de datos: áreas, servicios,
 * preguntas frecuentes, equipo, artículos y configuración del estudio.
 *
 *   npm run seed            → inserta el contenido (no borra nada existente)
 *   npm run seed -- --reset → vacía las tablas de contenido antes de insertar
 *
 * Requiere en `.env.local`:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (clave de servicio: NUNCA en el cliente)
 *
 * El contenido cargado es de DEMOSTRACIÓN. Sirve para comprobar que el sitio
 * funciona de extremo a extremo; después se edita o se reemplaza desde /admin.
 * ---------------------------------------------------------------------------
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { demoAreas } from '../src/content/areas';
import { demoAvailability } from '../src/content/availability';
import { demoFaqs } from '../src/content/faqs';
import { demoLawyerAreas, demoLawyers } from '../src/content/lawyers';
import { demoPosts } from '../src/content/posts';
import { demoServiceFaqs, demoServices } from '../src/content/services';
import { demoSettings, demoSocialLinks } from '../src/content/settings';

/** Carga `.env.local` sin dependencias externas. */
function loadEnv() {
  try {
    const file = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of file.split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, '');
    }
  } catch {
    // Sin .env.local se usan las variables ya presentes en el entorno.
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Faltan variables de entorno. Defina NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local',
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const reset = process.argv.includes('--reset');

async function upsert(table: string, rows: unknown[]) {
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).upsert(rows as never, { onConflict: 'id' });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ✓ ${table} (${rows.length})`);
}

async function main() {
  console.log(`\nCargando contenido en ${url}\n`);

  if (reset) {
    console.log('Vaciando tablas de contenido…');
    // El orden respeta las claves foráneas.
    for (const table of [
      'service_faqs',
      'blog_posts',
      'lawyer_areas',
      'lawyer_availability',
      'services',
      'lawyers',
      'practice_areas',
      'faqs',
      'social_links',
    ]) {
      const { error } = await supabase.from(table).delete().neq('id', '');
      if (error) console.warn(`  ! ${table}: ${error.message}`);
    }
    console.log('');
  }

  console.log('Insertando contenido…');

  await upsert('practice_areas', demoAreas);
  await upsert('services', demoServices);
  await upsert('service_faqs', demoServiceFaqs);
  await upsert('lawyers', demoLawyers);
  await upsert('blog_posts', demoPosts);
  await upsert('faqs', demoFaqs);
  await upsert('social_links', demoSocialLinks);
  await upsert('lawyer_availability', demoAvailability);

  // La relación abogado ↔ área no tiene columna `id`.
  const { error: relationError } = await supabase
    .from('lawyer_areas')
    .upsert(demoLawyerAreas as never, { onConflict: 'lawyer_id,area_id' });
  if (relationError) throw new Error(`lawyer_areas: ${relationError.message}`);
  console.log(`  ✓ lawyer_areas (${demoLawyerAreas.length})`);

  // La configuración es una fila única con id = 1.
  const { error: settingsError } = await supabase
    .from('site_settings')
    .upsert(demoSettings as never, { onConflict: 'id' });
  if (settingsError) throw new Error(`site_settings: ${settingsError.message}`);
  console.log('  ✓ site_settings (1)');

  console.log('\nContenido cargado correctamente.\n');
  console.log('Siguiente paso: cree un usuario en Supabase Auth y añada su fila en `profiles`:');
  console.log(
    "  insert into public.profiles (id, full_name, email, role) values ('<uuid del usuario>', 'Nombre', 'correo@estudio.pe', 'admin');\n",
  );
}

main().catch((error) => {
  console.error('\nError al cargar el contenido:', error.message);
  process.exit(1);
});
