'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { WhatsappIcon } from './WhatsappIcon';
import { routes } from '@/config/site';
import { cn } from '@/lib/utils';

/**
 * Acciones flotantes: WhatsApp y solicitud de cita. Visibles en móvil y en
 * escritorio, ocultas en el panel de administración.
 *
 * El enlace usa `wa.me`, que no requiere cuenta de empresa ni credenciales.
 * La integración con la API oficial queda preparada en `src/lib/whatsapp.ts`.
 */
export function FloatingWhatsapp({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 320);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (pathname.startsWith('/admin')) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <Link
        href={routes.appointment}
        aria-label="Solicitar una cita"
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full border border-line bg-paper text-ink shadow-lg transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:shadow-xl',
          visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
        )}
      >
        <CalendarDays className="h-[1.125rem] w-[1.125rem]" aria-hidden />
      </Link>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-xl"
      >
        <WhatsappIcon className="h-6 w-6" />
      </a>
    </div>
  );
}
