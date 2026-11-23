import type { Lawyer } from '@/types';
import { areaId, lawyerId } from './ids';

/**
 * ---------------------------------------------------------------------------
 * EQUIPO
 * ---------------------------------------------------------------------------
 * Se administra desde /admin/abogados (tabla `lawyers`). Formación y
 * experiencia quedan vacías hasta contar con los datos reales: las secciones
 * correspondientes no se muestran en la ficha mientras estén vacías.
 * ---------------------------------------------------------------------------
 */

const TS = {
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

export const demoLawyers: Lawyer[] = [
  {
    ...TS,
    id: lawyerId(1),
    slug: 'maria-elena-gomez',
    name: 'María Elena Gómez',
    role: 'Abogada',
    headline: 'Asesoría y patrocinio en familia, penal, civil y empresarial.',
    bio: [
      'Abogada del estudio. Atiende consultas y procesos en derecho de familia, derecho penal, derecho civil y patrimonial, y derecho empresarial, con atención personalizada y seguimiento cercano de cada caso.',
    ],
    photo_url: '/lawyers/maria-elena-gomez.webp',
    portrait_tone: 'ink',
    education: [],
    experience: [],
    specialties: ['Derecho de familia', 'Derecho penal', 'Derecho civil y patrimonial', 'Derecho empresarial'],
    languages: ['Español'],
    email: null,
    phone: null,
    linkedin_url: null,
    sort_order: 1,
    is_active: true,
    seo_title: null,
    seo_description: null,
  },
];

/** Relación abogado ↔ área de práctica (tabla `lawyer_areas`). */
export const demoLawyerAreas: { lawyer_id: string; area_id: string }[] = [
  { lawyer_id: lawyerId(1), area_id: areaId(1) },
  { lawyer_id: lawyerId(1), area_id: areaId(2) },
  { lawyer_id: lawyerId(1), area_id: areaId(3) },
  { lawyer_id: lawyerId(1), area_id: areaId(4) },
];

export const demoLawyerBySlug = (slug: string) => demoLawyers.find((l) => l.slug === slug);
