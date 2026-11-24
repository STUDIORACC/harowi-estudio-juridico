'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Identificador del registro abierto, guardado en la URL (`?id=…`).
 * Permite enlaces profundos (notificaciones, búsqueda) sin rutas dinámicas.
 */
export function useDetailId(): [string | null, (id: string | null) => void] {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const id = params.get('id');
  const set = useCallback(
    (next: string | null) => {
      router.replace(next ? `${pathname}?id=${encodeURIComponent(next)}` : pathname, { scroll: false });
    },
    [pathname, router],
  );
  return [id, set];
}

/** Valor con retardo, para búsquedas sobre listas grandes. */
export function useDebounced<T>(value: T, ms = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Ejecuta `fn` cuando cambia `value`, salvo en el primer render. */
export function useOnChange<T>(value: T, fn: (v: T) => void) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    fn(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
}
