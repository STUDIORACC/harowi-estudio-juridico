import type { Service, ServiceFaq } from '@/types';

/** Servicio de demostración con sus preguntas frecuentes ya asociadas. */
export interface DemoService extends Service {
  faqs: ServiceFaq[];
}

export const SERVICE_TS = {
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

/** Aviso que acompaña a todas las páginas de servicio. */
export const ORIENTATIVE_NOTE =
  'La información de esta página es general y orientativa. Los plazos, requisitos y vías aplicables dependen de las circunstancias concretas de cada caso y de la competencia del juzgado o entidad que conozca el asunto.';
