'use client';

import { useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { FormState } from '@/lib/forms/state';
import { cn } from '@/lib/utils';

/** Botón de envío que se deshabilita mientras la acción está en curso. */
export function SubmitButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending} className={className}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {pending ? 'Enviando…' : children}
    </Button>
  );
}

/** Mensaje de resultado del envío, con el tono correspondiente. */
export function FormMessage({ state }: { state: FormState }) {
  if (state.status === 'idle' || !state.message) return null;

  const tone = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    demo: 'border-amber-200 bg-amber-50 text-amber-900',
    error: 'border-red-200 bg-red-50 text-red-700',
    idle: '',
  }[state.status];

  const Icon = state.status === 'success' ? CheckCircle2 : state.status === 'demo' ? Info : AlertCircle;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex gap-3 rounded-xl border p-4 text-[0.875rem] leading-relaxed', tone)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>{state.message}</p>
    </div>
  );
}
