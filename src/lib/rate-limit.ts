/**
 * Limitador de peticiones en memoria para las rutas públicas de la demo.
 * En producción conviene sustituirlo por una solución compartida (Redis o el
 * limitador del proveedor de despliegue), ya que este contador no se comparte
 * entre instancias.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const globalBuckets = globalThis as unknown as { __lexiaRate?: Map<string, Bucket> };
const buckets = (globalBuckets.__lexiaRate ??= new Map<string, Bucket>());

export function rateLimit(key: string, limit = 12, windowMs = 60_000) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: limit - bucket.count };
}

/** Identificador aproximado del cliente a partir de las cabeceras habituales. */
export function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local';
  return `${scope}:${ip}`;
}
