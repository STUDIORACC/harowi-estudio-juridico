import type { SiteSettings, SocialLink } from '@/types';

/**
 * ---------------------------------------------------------------------------
 * CONFIGURACIÓN DEL ESTUDIO — DATOS DE DEMOSTRACIÓN
 * ---------------------------------------------------------------------------
 * Todos estos valores se administran desde /admin/configuracion y viven en la
 * tabla `site_settings` (una sola fila). Aquí figuran como respaldo para que el
 * sitio pueda mostrarse antes de conectar Supabase.
 *
 * ---------------------------------------------------------------------------
 */

export const demoSettings: SiteSettings = {
  id: 1,
  studio_name: 'Harowi',
  studio_legal_name: 'Harowi Estudio Jurídico',
  tagline: 'Estudio Jurídico',
  description:
    'Asesoría y representación legal en derecho de familia, penal, civil y empresarial. Atención personalizada, criterio profesional y seguimiento cercano de cada caso.',
  logo_url: '/logo.png',
  favicon_url: '/favicon.png',

  hero_title: 'Asesoría legal con criterio, reserva y seguimiento cercano',
  hero_subtitle:
    'Acompañamos a personas y empresas en procesos de familia, penales, civiles y corporativos. Cada caso empieza con una lectura honesta del expediente y una estrategia explicada sin tecnicismos.',
  hero_image_url: '/estudio.webp',

  phone: '(01) 000 0000',
  whatsapp_number: '51900000000',
  whatsapp_message: 'Hola, deseo solicitar una consulta legal.',
  email: 'contacto@harowi.pe',
  address: 'Av. Ejemplo 000, Oficina 000 — San Isidro',
  address_city: 'Lima, Perú',
  map_query: 'San Isidro, Lima, Perú',

  business_hours: [
    { days: 'Lunes a viernes', hours: '09:00 — 19:00' },
    { days: 'Sábados', hours: '09:00 — 13:00' },
    { days: 'Domingos y feriados', hours: 'Cerrado' },
  ],
  business_hours_short: 'Lun a Vie, 09:00 — 19:00',

  primary_color: '17 20 24',
  accent_color: '160 124 74',

  seo_title: 'Harowi Estudio Jurídico — Asesoría legal en Lima',
  seo_description:
    'Estudio jurídico en Lima. Derecho de familia, penal, civil y empresarial. Solicite una consulta y reciba orientación sobre su caso.',

  disclaimer:
    'La información publicada en este sitio es de carácter general y orientativo. No constituye asesoría jurídica para un caso concreto ni genera relación abogado-cliente.',

  about_intro: [
    'Somos un estudio jurídico con sede en Lima, dedicado a la asesoría y representación de personas y empresas en derecho de familia, derecho penal, derecho civil y patrimonial, y derecho empresarial.',
    'Cada caso se asume con atención personalizada: se revisa la documentación, se explican las vías posibles con sus plazos y costos, y se mantiene informado al cliente en cada actuación relevante.',
  ],
  about_philosophy:
    'Un buen patrocinio empieza por explicar con franqueza el escenario real: qué se puede sostener, qué no, cuánto puede durar y qué decisiones dependen del cliente. Preferimos una expectativa ajustada a una promesa cómoda.',
  about_values: [
    {
      title: 'Claridad',
      description:
        'Explicamos el estado del caso en lenguaje comprensible, sin tecnicismos innecesarios y sin ofrecer garantías que no dependen del estudio.',
    },
    {
      title: 'Reserva',
      description:
        'La información del cliente se trata con confidencialidad estricta y se comparte únicamente con el equipo asignado al caso.',
    },
    {
      title: 'Rigor',
      description:
        'Cada escrito se prepara sobre documentación revisada. Antes de accionar evaluamos la prueba disponible y los riesgos de cada vía.',
    },
    {
      title: 'Cercanía',
      description:
        'Un interlocutor definido para cada caso e información de cada actuación relevante, sin necesidad de insistir para obtener respuesta.',
    },
  ],
  about_method: [
    {
      step: '01',
      title: 'Primera consulta',
      description:
        'Escuchamos el caso, revisamos la documentación disponible y delimitamos el problema jurídico. Al terminar, usted sabe si corresponde accionar y por qué vía.',
    },
    {
      step: '02',
      title: 'Evaluación y escenarios',
      description:
        'Presentamos las alternativas con su duración estimada, su costo y su nivel de riesgo. La decisión de iniciar un proceso siempre es del cliente.',
    },
    {
      step: '03',
      title: 'Estrategia y patrocinio',
      description:
        'Definimos por escrito la teoría del caso, la prueba que la sostiene y los puntos a reforzar. Desde ahí asumimos la representación.',
    },
    {
      step: '04',
      title: 'Seguimiento',
      description:
        'Informamos cada actuación relevante del expediente y mantenemos un canal de contacto directo durante todo el proceso.',
    },
  ],

  updated_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
};

export const demoSocialLinks: SocialLink[] = [
  {
    id: '77777777-7777-4777-8777-777777777701',
    platform: 'linkedin',
    url: 'https://www.linkedin.com/',
    label: 'LinkedIn',
    sort_order: 1,
    is_active: true,
  },
  {
    id: '77777777-7777-4777-8777-777777777702',
    platform: 'facebook',
    url: 'https://www.facebook.com/',
    label: 'Facebook',
    sort_order: 2,
    is_active: true,
  },
  {
    id: '77777777-7777-4777-8777-777777777703',
    platform: 'instagram',
    url: 'https://www.instagram.com/',
    label: 'Instagram',
    sort_order: 3,
    is_active: true,
  },
];
