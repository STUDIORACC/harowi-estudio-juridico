/**
 * ---------------------------------------------------------------------------
 * VERSIÓN ESTÁTICA DE PRESENTACIÓN
 * ---------------------------------------------------------------------------
 * Genera una copia exportable del sitio público para alojarla en GitHub Pages
 * u otro hosting de archivos estáticos, SIN Supabase ni servidor.
 *
 *   node scripts/build-static-demo.mjs
 *
 * No modifica el proyecto: trabaja sobre `.static-build/` y deja el resultado
 * en `.static-build/out`. En esa versión:
 *   - no existe el panel /admin ni el middleware,
 *   - los formularios validan pero no guardan (aviso en pantalla),
 *   - los horarios de citas se calculan con la disponibilidad de ejemplo,
 *   - se pide a los buscadores no indexar el sitio.
 * ---------------------------------------------------------------------------
 */

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const work = join(root, '.static-build');
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const read = (p) => readFileSync(join(work, p), 'utf8');
const write = (p, content) => {
  mkdirSync(join(work, p, '..'), { recursive: true });
  writeFileSync(join(work, p), content);
};
function patch(p, fn, label) {
  const before = read(p);
  const after = fn(before);
  if (before === after) throw new Error(`El parche «${label}» no cambió ${p}`);
  write(p, after);
}

/* 1. Copia limpia del proyecto -------------------------------------------- */
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });
for (const item of ['src', 'public', 'tailwind.config.ts', 'postcss.config.mjs', 'tsconfig.json', 'package.json']) {
  cpSync(join(root, item), join(work, item), { recursive: true });
}

/* 2. Se elimina todo lo que necesita servidor ------------------------------ */
for (const p of [
  'src/middleware.ts',
  'src/app/(panel)',
  'src/app/(panel-auth)',
  // El CRM es un sistema privado: nunca forma parte de la versión pública.
  'src/app/(crm)',
  'src/components/crm',
  'src/crm',
  'src/app/actions/admin.ts',
  'src/app/actions/auth.ts',
  'src/components/admin',
]) {
  rmSync(join(work, p), { recursive: true, force: true });
}

/* 3. Acciones públicas: versión de navegador, sin guardar ------------------- */
write(
  'src/app/actions/public.ts',
  `import { demoAvailability, demoBlockedDates } from '@/content';
import { buildSlots } from '@/lib/scheduling';
import type { FormState } from '@/lib/forms/state';
import {
  appointmentSchema,
  consultationSchema,
  contactSchema,
  formDataToObject,
  toFieldErrors,
} from '@/lib/validation/schemas';
import type { ZodTypeAny } from 'zod';

const NOTICE =
  'Gracias. Esta versión del sitio es solo de presentación y no guarda solicitudes. Para una consulta real, escríbanos por WhatsApp.';

async function validate(schema: ZodTypeAny, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { status: 'error', message: 'Revise los campos marcados.', errors: toFieldErrors(parsed.error) };
  }
  return { status: 'demo', message: NOTICE };
}

export const submitConsultation = async (_prev: FormState, formData: FormData) =>
  validate(consultationSchema, formData);

export const requestAppointment = async (_prev: FormState, formData: FormData) =>
  validate(appointmentSchema, formData);

export const submitContact = async (_prev: FormState, formData: FormData) =>
  validate(contactSchema, formData);

export async function fetchSlots(lawyerId: string, date: string) {
  if (!lawyerId || !/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) return [];
  const blocked = demoBlockedDates.some(
    (item) => item.date === date && (item.lawyer_id === null || item.lawyer_id === lawyerId),
  );
  if (blocked) return [];
  return buildSlots({
    availability: demoAvailability.filter((slot) => slot.lawyer_id === lawyerId),
    date,
  });
}
`,
);

/* 4. Páginas que leían searchParams (no existen en una exportación) --------- */
patch('src/app/(site)/blog/page.tsx', (s) => s.replace('searchParams,\n    getPublishedPosts()', 'Promise.resolve({} as Awaited<typeof searchParams>),\n    getPublishedPosts()'), 'blog');
patch('src/app/(site)/consulta/page.tsx', (s) => s.replace('    searchParams,\n    getAreasWithServices()', '    Promise.resolve({} as Awaited<typeof searchParams>),\n    getAreasWithServices()'), 'consulta');
patch('src/app/(site)/citas/page.tsx', (s) => s.replace('    searchParams,\n    getAreasWithServices()', '    Promise.resolve({} as Awaited<typeof searchParams>),\n    getAreasWithServices()'), 'citas');

/* 5. Mapa del sitio, robots y pie ------------------------------------------ */
patch('src/app/sitemap.ts', (s) => `export const dynamic = 'force-static';\n${s}`, 'sitemap');
write(
  'src/app/robots.ts',
  `import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', disallow: '/' }] };
}
`,
);
patch('src/app/layout.tsx', (s) => s.replace('robots: { index: true, follow: true }', 'robots: { index: false, follow: false }'), 'noindex');
patch(
  'src/components/layout/Footer.tsx',
  (s) => s.replace(/\s*<li>\s*<Link href=\{routes\.admin\}[\s\S]*?<\/li>/, ''),
  'footer-admin',
);

/* 6. Configuración de exportación ------------------------------------------ */
write(
  'image-loader.js',
  `export default function loader({ src }) {
  if (/^https?:/.test(src)) return src;
  return \`\${process.env.NEXT_PUBLIC_BASE_PATH || ''}\${src}\`;
}
`,
);
write(
  'next.config.mjs',
  `/** @type {import('next').NextConfig} */
export default {
  output: 'export',
  trailingSlash: true,
  basePath: ${JSON.stringify(basePath)},
  poweredByHeader: false,
  images: { loader: 'custom', loaderFile: './image-loader.js' },
  eslint: { ignoreDuringBuilds: true },
};
`,
);

/* 7. Compilación ------------------------------------------------------------ */
execSync('npx next build', {
  cwd: work,
  stdio: 'inherit',
  env: { ...process.env, NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_SITE_URL: siteUrl, NEXT_TELEMETRY_DISABLED: '1' },
});

/* 8. Ajustes finales de la carpeta publicable ------------------------------- */
const out = join(work, 'out');
writeFileSync(join(out, '.nojekyll'), '');

// El favicon se declara con ruta absoluta: se le antepone la ruta base.
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (full.endsWith('.html')) {
      const html = readFileSync(full, 'utf8');
      const fixed = html.replace(/href="\/favicon\.png"/g, `href="${basePath}/favicon.png"`);
      if (fixed !== html) writeFileSync(full, fixed);
    }
  }
}
if (basePath && existsSync(out)) walk(out);

console.log(`\nListo: ${out}`);
