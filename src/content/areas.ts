import type { PracticeArea } from '@/types';
import { areaId } from './ids';

/**
 * ---------------------------------------------------------------------------
 * ÁREAS DE PRÁCTICA — CONTENIDO DE DEMOSTRACIÓN
 * ---------------------------------------------------------------------------
 * Se administran desde /admin/areas y viven en la tabla `practice_areas`.
 * El contenido es de carácter general y orientativo; no constituye asesoría
 * jurídica para un caso concreto.
 * ---------------------------------------------------------------------------
 */

const TS = {
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

export const demoAreas: PracticeArea[] = [
  {
    ...TS,
    id: areaId(1),
    slug: 'derecho-de-familia',
    name: 'Derecho de Familia',
    short_name: 'Familia',
    icon: 'Users',
    tagline: 'Alimentos, tenencia, régimen de visitas y divorcio.',
    summary:
      'Procesos que afectan directamente la vida cotidiana de una familia. Los tramitamos con reserva, atención al interés superior del niño y comunicación constante con el cliente.',
    intro: [
      'Los conflictos familiares rara vez son solo jurídicos: detrás de una demanda de alimentos o de un proceso de tenencia hay una historia que condiciona cada decisión. Por eso el trabajo empieza escuchando, antes de proponer una vía.',
      'Acompañamos procesos de alimentos, tenencia, régimen de visitas y divorcio, tanto en sede judicial como en las vías administrativas y notariales cuando el caso lo permite. Cuando existe posibilidad real de acuerdo, la exploramos: suele ser más rápido, menos costoso y menos desgastante para todos.',
    ],
    sort_order: 1,
    is_active: true,
    seo_title: 'Abogados de familia en Lima — Alimentos, tenencia y divorcio',
    seo_description:
      'Asesoría en derecho de familia: demanda de alimentos, reducción de alimentos, tenencia, divorcio de mutuo acuerdo y divorcio por causal. Consulta inicial disponible.',
  },
  {
    ...TS,
    id: areaId(2),
    slug: 'derecho-penal',
    name: 'Derecho Penal',
    short_name: 'Penal',
    icon: 'Gavel',
    tagline: 'Defensa técnica en investigación y juicio.',
    summary:
      'Defensa y patrocinio en todas las etapas del proceso penal, desde las primeras diligencias hasta el juicio oral, con especial atención a los plazos y a la cadena probatoria.',
    intro: [
      'En materia penal el tiempo es determinante. Una declaración tomada sin defensa técnica o un plazo dejado vencer puede condicionar todo el proceso; por eso la intervención temprana del abogado es la decisión más relevante que toma una persona investigada.',
      'Asumimos la defensa de personas investigadas y el patrocinio de la parte agraviada en investigaciones preliminares, procesos ordinarios y procedimientos por delitos complejos, con una revisión detallada de la carpeta fiscal antes de fijar cualquier posición.',
    ],
    sort_order: 2,
    is_active: true,
    seo_title: 'Abogados penalistas en Lima — Defensa en investigación y juicio',
    seo_description:
      'Defensa penal en investigación preliminar, prisión preventiva, lavado de activos, crimen organizado y delitos contra la administración pública.',
  },
  {
    ...TS,
    id: areaId(3),
    slug: 'derecho-civil-y-patrimonial',
    name: 'Derecho Civil y Patrimonial',
    short_name: 'Civil',
    icon: 'Landmark',
    tagline: 'Propiedad, posesión, ejecución y reconocimiento de sentencias.',
    summary:
      'Defensa de la propiedad y del patrimonio: saneamiento, desalojo, remate público, prescripción adquisitiva y reconocimiento de sentencias extranjeras.',
    intro: [
      'Buena parte de los conflictos patrimoniales llega con documentación incompleta: títulos antiguos, partidas sin actualizar, contratos que nunca se inscribieron. El primer trabajo casi siempre es documental, y suele definir el resultado.',
      'Intervenimos en procesos de desalojo, prescripción adquisitiva de dominio, remates judiciales y exequátur, tanto en la defensa del titular como en la de quien se ve afectado por una ejecución.',
    ],
    sort_order: 3,
    is_active: true,
    seo_title: 'Abogados civiles en Lima — Desalojo, prescripción y remates',
    seo_description:
      'Asesoría en derecho civil y patrimonial: remate público, prescripción adquisitiva, desalojo y exequátur de sentencias extranjeras.',
  },
  {
    ...TS,
    id: areaId(4),
    slug: 'derecho-empresarial',
    name: 'Derecho Empresarial',
    short_name: 'Empresarial',
    icon: 'Building2',
    tagline: 'Constitución de empresas y acompañamiento societario.',
    summary:
      'Constitución de sociedades, elaboración de estatutos y acompañamiento en las formalidades registrales y tributarias del inicio de actividades.',
    intro: [
      'Constituir una empresa es una decisión jurídica antes que administrativa: el tipo societario, la estructura del capital y las facultades de los representantes determinan cómo se decide y quién responde.',
      'Acompañamos el proceso completo, desde la elección de la forma societaria hasta la inscripción registral y los trámites posteriores de inicio de actividades.',
    ],
    sort_order: 4,
    is_active: true,
    seo_title: 'Abogados corporativos en Lima — Constitución de empresas',
    seo_description:
      'Constitución de empresas en Perú: elección del tipo societario, minuta, escritura pública, inscripción en SUNARP y RUC.',
  },
];

export const demoAreaBySlug = (slug: string) => demoAreas.find((area) => area.slug === slug);
