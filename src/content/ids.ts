/**
 * ---------------------------------------------------------------------------
 * IDENTIFICADORES DEL CONTENIDO DE DEMOSTRACION
 * ---------------------------------------------------------------------------
 * Son UUID fijos para que el contenido de `src/content` y la semilla SQL
 * (`supabase/migrations/…_seed.sql`) describan exactamente las mismas filas.
 * Al reemplazar la demo por el contenido real del estudio estos valores
 * desaparecen: la base de datos genera sus propios UUID.
 * ---------------------------------------------------------------------------
 */

const pad = (n: number) => String(n).padStart(2, '0');

export const areaId = (n: number) => `11111111-1111-4111-8111-1111111111${pad(n)}`;
export const serviceId = (n: number) => `22222222-2222-4222-8222-2222222222${pad(n)}`;
export const lawyerId = (n: number) => `33333333-3333-4333-8333-3333333333${pad(n)}`;
export const postId = (n: number) => `44444444-4444-4444-8444-4444444444${pad(n)}`;
export const faqId = (n: number) => `55555555-5555-4555-8555-5555555555${pad(n)}`;
export const serviceFaqId = (service: number, n: number) =>
  `66666666-6666-4666-8666-66${pad(service)}${pad(n)}666666`;
