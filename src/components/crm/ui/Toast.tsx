'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastApi {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de CrmProviders.');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => setItems((cur) => cur.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      const id = ++counter.current;
      setItems((cur) => [...cur.slice(-3), { id, kind, title, description }]);
      setTimeout(() => dismiss(id), kind === 'error' ? 6500 : 4200);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (t, d) => push('success', t, d),
      error: (t, d) => push('error', t, d),
      info: (t, d) => push('info', t, d),
    }),
    [push],
  );

  const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
  const colors = { success: 'text-emerald-600', error: 'text-red-600', info: 'text-brand-600' };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="crm-root pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 !bg-transparent">
        {items.map((t) => {
          const Icon = icons[t.kind];
          return (
            <div key={t.id} role={t.kind === 'error' ? 'alert' : 'status'} className="crm-pop pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-pop">
              <Icon className={cn('mt-0.5 h-[18px] w-[18px] shrink-0', colors[t.kind])} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-navy-900">{t.title}</p>
                {t.description ? <p className="mt-0.5 text-[0.8125rem] leading-snug text-slate-500">{t.description}</p> : null}
              </div>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Cerrar aviso" className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
