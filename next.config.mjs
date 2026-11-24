/**
 * Configuración de Next.js.
 *
 * Las imágenes del sitio (fotografías del equipo, portadas del blog, logotipo)
 * viven en Supabase Storage. Se autoriza únicamente el host del proyecto
 * configurado, de modo que `next/image` puede optimizarlas sin abrir el
 * optimizador a dominios arbitrarios.
 */

/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

/** @type {import('next').NextConfig['images']['remotePatterns']} */
const remotePatterns = [];

if (supabaseUrl) {
  try {
    const { hostname } = new URL(supabaseUrl);
    remotePatterns.push({
      protocol: 'https',
      hostname,
      pathname: '/storage/v1/object/public/**',
    });
  } catch {
    console.warn('[next.config] NEXT_PUBLIC_SUPABASE_URL no es una URL válida.');
  }
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // El CRM (HAROWI Legal CRM) es privado y no debe indexarse.
        source: '/crm/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        // El panel nunca debe aparecer en buscadores ni en cachés compartidas.
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },
};

export default nextConfig;
