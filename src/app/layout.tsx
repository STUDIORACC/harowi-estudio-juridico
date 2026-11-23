import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { getSiteSettings } from '@/lib/data';
import { siteUrl } from '@/config/site';

const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const display = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  weight: 'variable',
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--font-display',
});

/** La metadata base se construye con los datos administrables del estudio. */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: settings.seo_title || settings.studio_legal_name,
      template: `%s — ${settings.studio_name}`,
    },
    description: settings.seo_description || settings.description,
    applicationName: settings.studio_legal_name,
    authors: [{ name: settings.studio_legal_name }],
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'es_PE',
      url: siteUrl,
      siteName: settings.studio_legal_name,
      title: settings.seo_title || settings.studio_legal_name,
      description: settings.seo_description || settings.description,
    },
    twitter: {
      card: 'summary_large_image',
      title: settings.seo_title || settings.studio_legal_name,
      description: settings.seo_description || settings.description,
    },
    robots: { index: true, follow: true },
    icons: {
      icon: settings.favicon_url
        ? [{ url: settings.favicon_url }]
        : [{ url: '/icon.svg', type: 'image/svg+xml' }],
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#FBFAF7',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  /* Identidad visual: los colores configurados se inyectan como variables CSS. */
  const brandVariables = {
    '--color-ink': settings.primary_color,
    '--color-accent': settings.accent_color,
  } as React.CSSProperties;

  return (
    <html
      lang="es"
      className={`${sans.variable} ${display.variable}`}
      style={brandVariables}
      suppressHydrationWarning
    >
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
