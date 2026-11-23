/**
 * ---------------------------------------------------------------------------
 * CONFIGURACIÓN ESTÁTICA DEL SITIO
 * ---------------------------------------------------------------------------
 * Aquí viven únicamente las constantes que NO se administran desde el panel:
 * la URL pública, la estructura de navegación y las rutas.
 *
 * Los datos del estudio (nombre, contacto, horarios, colores, textos, SEO) se
 * gestionan desde /admin/configuracion y se leen con `getSiteSettings()`.
 *
 * Proyecto de un ÚNICO estudio jurídico. No es un SaaS ni multi-tenant.
 * ---------------------------------------------------------------------------
 */

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export const routes = {
  home: '/',
  about: '/nosotros',
  areas: '/areas',
  team: '/equipo',
  blog: '/blog',
  faq: '/preguntas-frecuentes',
  contact: '/contacto',
  consultation: '/consulta',
  appointment: '/citas',
  admin: '/admin',
  adminLogin: '/admin/login',
  privacy: '/politica-de-privacidad',
  terms: '/aviso-legal',
} as const;

export const mainNav = [
  { label: 'Inicio', href: routes.home },
  { label: 'Nosotros', href: routes.about },
  { label: 'Áreas de práctica', href: routes.areas },
  { label: 'Equipo', href: routes.team },
  { label: 'Blog', href: routes.blog },
  { label: 'Preguntas frecuentes', href: routes.faq },
  { label: 'Contacto', href: routes.contact },
] as const;

export const footerNav = [
  {
    title: 'El estudio',
    links: [
      { label: 'Nosotros', href: routes.about },
      { label: 'Equipo', href: routes.team },
      { label: 'Contacto', href: routes.contact },
    ],
  },
  {
    title: 'Servicios',
    links: [
      { label: 'Áreas de práctica', href: routes.areas },
      { label: 'Solicitar consulta', href: routes.consultation },
      { label: 'Solicitar cita', href: routes.appointment },
    ],
  },
  {
    title: 'Información',
    links: [
      { label: 'Blog', href: routes.blog },
      { label: 'Preguntas frecuentes', href: routes.faq },
      { label: 'Aviso legal', href: routes.terms },
      { label: 'Política de privacidad', href: routes.privacy },
    ],
  },
] as const;

/** Menú del panel de administración. */
export const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
  { label: 'Consultas', href: '/admin/consultas', icon: 'Inbox' },
  { label: 'Citas', href: '/admin/citas', icon: 'CalendarDays' },
  { label: 'Abogados', href: '/admin/abogados', icon: 'Users' },
  { label: 'Áreas', href: '/admin/areas', icon: 'Layers' },
  { label: 'Servicios', href: '/admin/servicios', icon: 'Scale' },
  { label: 'Blog', href: '/admin/blog', icon: 'Newspaper' },
  { label: 'Preguntas frecuentes', href: '/admin/faq', icon: 'HelpCircle' },
  { label: 'Configuración', href: '/admin/configuracion', icon: 'Settings' },
] as const;
