'use client';

import { Suspense, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { LogoMark } from '@/components/layout/Logo';
import { initStore, useCrmOrNull } from '@/crm/store/store';
import { ToastProvider } from '../ui/Toast';
import { CrmShell } from './CrmShell';

function Splash() {
  return (
    <div className="crm-root flex min-h-screen items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-4 text-navy-800">
        <LogoMark className="h-10 w-10 animate-pulse text-navy-700" />
        <p className="text-sm text-slate-500">Cargando HAROWI Legal CRM…</p>
      </div>
    </div>
  );
}

/** Inicializa el almacén en el navegador y muestra la estructura solo cuando los datos están listos. */
export function CrmProviders({ children }: { children: ReactNode }) {
  const state = useCrmOrNull();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initStore();
    setMounted(true);
  }, []);

  return (
    <ToastProvider>
      {mounted && state ? (
        <CrmShell>
          <Suspense fallback={null}>{children}</Suspense>
        </CrmShell>
      ) : (
        <Splash />
      )}
    </ToastProvider>
  );
}
