import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Contenedor estándar de página del CRM: ancho máximo y márgenes responsivos. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[1480px] space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8', className)}>{children}</div>;
}

/** Para pantallas que ocupan todo el alto disponible (bandeja, agenda). */
export function Fill({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex h-full min-h-0 flex-col', className)}>{children}</div>;
}
