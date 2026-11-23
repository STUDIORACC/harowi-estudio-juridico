/**
 * ---------------------------------------------------------------------------
 * CONTENIDO DE DEMOSTRACIÓN
 * ---------------------------------------------------------------------------
 * Todo lo que hay en esta carpeta cumple dos funciones:
 *
 *   1. Permite mostrar el sitio completo antes de conectar Supabase.
 *   2. Es la fuente de la semilla SQL que carga la base de datos real.
 *
 * Cuando el estudio cargue su contenido definitivo desde el panel, estos datos
 * dejan de utilizarse. No deben importarse desde los componentes: la capa de
 * acceso a datos (`src/lib/data`) decide cuándo usarlos.
 * ---------------------------------------------------------------------------
 */

export { demoAreas, demoAreaBySlug } from './areas';
export { demoAvailability, demoBlockedDates, DEFAULT_SLOT_MINUTES } from './availability';
export { demoFaqs } from './faqs';
export { demoLawyerAreas, demoLawyerBySlug, demoLawyers } from './lawyers';
export { demoPostBySlug, demoPosts } from './posts';
export {
  demoServiceBySlug,
  demoServiceFaqs,
  demoServices,
  demoServicesWithFaqs,
  type DemoService,
} from './services';
export { demoSettings, demoSocialLinks } from './settings';

export { demoAppointments, demoConsultations } from './operations';
