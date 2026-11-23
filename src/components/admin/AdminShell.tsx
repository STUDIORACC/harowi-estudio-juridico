'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  CalendarDays,
  ExternalLink,
  HelpCircle,
  Inbox,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Scale,
  Settings,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { LogoMark } from '@/components/layout/Logo';
import { adminNav } from '@/config/site';
import { signOut } from '@/app/actions/auth';
import { cn } from '@/lib/utils';

const icons: Record<string, LucideIcon> = {
  LayoutDashboard,
  Inbox,
  CalendarDays,
  Users,
  Layers,
  Scale,
  Newspaper,
  HelpCircle,
  Settings,
};

/** Marca del estudio en la barra lateral: el logotipo real si existe, o el símbolo de respaldo. */
function PanelMark({ logoUrl, studioName, className }: { logoUrl: string | null; studioName: string; className: string }) {
  if (logoUrl) {
    return (
      <Image src={logoUrl} alt={studioName} width={28} height={28} className={cn('shrink-0 object-contain', className)} />
    );
  }
  return <LogoMark className={cn('shrink-0 text-accent', className)} />;
}

export function AdminShell({
  children,
  studioName,
  logoUrl,
  userLabel,
  isDemo,
}: {
  children: React.ReactNode;
  studioName: string;
  logoUrl: string | null;
  userLabel: string;
  isDemo: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const nav = (
    <ul className="space-y-0.5">
      {adminNav.map((item) => {
        const Icon = icons[item.icon] ?? LayoutDashboard;
        const active = isActive(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.875rem] transition-colors duration-200',
                active
                  ? 'bg-ink text-paper'
                  : 'text-ink-soft hover:bg-ink/[0.05] hover:text-ink',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-screen bg-paper-alt/40">
      {/* ------------------------------ Barra lateral --------------------------- */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-paper lg:flex">
        <div className="flex items-center gap-3 border-b border-line px-5 py-5">
          <PanelMark logoUrl={logoUrl} studioName={studioName} className="h-12 w-12" />
          <div className="min-w-0">
            <p className="truncate font-display text-[0.9375rem] tracking-[0.12em]">{studioName}</p>
            <p className="text-2xs uppercase tracking-overline text-ink-muted">Panel</p>
          </div>
        </div>

        <nav aria-label="Panel" className="flex-1 overflow-y-auto p-3">
          {nav}
        </nav>

        <div className="border-t border-line p-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.8125rem] text-ink-soft transition-colors hover:bg-ink/[0.05] hover:text-ink"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Ver el sitio
          </Link>
          {!isDemo ? (
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.8125rem] text-ink-soft transition-colors hover:bg-ink/[0.05] hover:text-ink"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Cerrar sesión
              </button>
            </form>
          ) : null}
          <p className="mt-2 truncate px-3.5 py-2 text-2xs text-ink-muted">{userLabel}</p>
        </div>
      </aside>

      {/* -------------------------------- Móvil --------------------------------- */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper px-5 py-3.5 lg:hidden">
        <div className="flex items-center gap-2.5">
          <PanelMark logoUrl={logoUrl} studioName={studioName} className="h-11 w-11" />
          <span className="font-display text-[0.875rem] tracking-[0.12em]">{studioName}</span>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú del panel"
          aria-expanded={menuOpen}
          className="-mr-2 rounded-full p-2 text-ink transition-colors hover:bg-ink/5"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </header>

      <div
        className={cn('fixed inset-0 z-50 lg:hidden', menuOpen ? '' : 'pointer-events-none')}
        aria-hidden={!menuOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-ink/30 transition-opacity duration-300',
            menuOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setMenuOpen(false)}
        />
        <div
          role="dialog"
          aria-modal={menuOpen}
          aria-label="Menú del panel"
          className={cn(
            'absolute inset-y-0 left-0 flex w-72 flex-col bg-paper transition-transform duration-300 ease-smooth',
            menuOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="font-display text-[0.9375rem] tracking-[0.12em]">{studioName}</span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
              className="rounded-full p-2 text-ink transition-colors hover:bg-ink/5"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <nav aria-label="Panel" className="flex-1 overflow-y-auto p-3">
            {nav}
          </nav>
          <div className="border-t border-line p-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.8125rem] text-ink-soft"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Ver el sitio
            </Link>
            {!isDemo ? (
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.8125rem] text-ink-soft"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Cerrar sesión
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </div>

      {/* ------------------------------- Contenido ------------------------------ */}
      <div className="lg:pl-64">
        {isDemo ? (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-center text-2xs text-amber-900 sm:px-8">
            Base de datos no conectada: el panel está en solo lectura hasta conectar Supabase.
          </div>
        ) : null}
        <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
