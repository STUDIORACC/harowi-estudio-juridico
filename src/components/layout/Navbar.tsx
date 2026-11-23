'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown, Menu, Phone, X } from 'lucide-react';
import { Logo } from './Logo';
import { ButtonLink } from '@/components/ui/Button';
import { mainNav, routes } from '@/config/site';
import type { AreaWithServices } from '@/types';
import { cn } from '@/lib/utils';

export interface NavbarProps {
  studioName: string;
  studioLegalName: string;
  tagline: string;
  logoUrl: string | null;
  phone: string;
  phoneHref: string;
  areas: AreaWithServices[];
}

export function Navbar({
  studioName,
  studioLegalName,
  tagline,
  logoUrl,
  phone,
  phoneHref,
  areas,
}: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setAreasOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setAreasOpen(false);
      setMenuOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <a
        href="#contenido"
        className="sr-only left-4 top-4 z-[100] rounded-full bg-ink px-5 py-3 text-sm text-paper focus:not-sr-only focus:absolute"
      >
        Saltar al contenido
      </a>

      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-500 ease-smooth',
          scrolled || areasOpen
            ? 'border-b border-line bg-paper/90 backdrop-blur-md'
            : 'border-b border-transparent bg-transparent',
        )}
        onMouseLeave={() => setAreasOpen(false)}
      >
        <nav className="shell flex items-center justify-between gap-6 py-2" aria-label="Principal">
          <Logo
            name={studioName}
            legalName={studioLegalName}
            tagline={tagline}
            logoUrl={logoUrl}
            showTagline={!scrolled}
            imageClassName={cn(
              'transition-all duration-300',
              scrolled ? 'h-16 sm:h-20' : 'h-20 sm:h-28',
            )}
          />

          <ul className="hidden items-center gap-0.5 lg:flex">
            {mainNav.map((item) =>
              item.href === routes.areas ? (
                <li key={item.href} onMouseEnter={() => setAreasOpen(true)}>
                  <Link
                    href={routes.areas}
                    aria-expanded={areasOpen}
                    onFocus={() => setAreasOpen(true)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-3 py-2 text-[0.8125rem] transition-colors duration-300',
                      isActive(routes.areas) ? 'text-ink' : 'text-ink-soft hover:text-ink',
                    )}
                  >
                    Áreas
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 transition-transform duration-300',
                        areasOpen && 'rotate-180',
                      )}
                      aria-hidden
                    />
                  </Link>
                </li>
              ) : (
                <li key={item.href} onMouseEnter={() => setAreasOpen(false)}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={cn(
                      'rounded-full px-3 py-2 text-[0.8125rem] transition-colors duration-300',
                      isActive(item.href) ? 'text-ink' : 'text-ink-soft hover:text-ink',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>

          <div className="flex items-center gap-2">
            <a
              href={phoneHref}
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-[0.8125rem] text-ink-soft transition-colors hover:text-ink xl:flex"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {phone}
            </a>
            <ButtonLink href={routes.consultation} size="sm" className="hidden sm:inline-flex">
              Solicitar consulta
            </ButtonLink>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              className="-mr-2 rounded-full p-2.5 text-ink transition-colors hover:bg-ink/5 lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </nav>

        {/* Panel de áreas de práctica (escritorio) */}
        <div
          className={cn(
            'absolute inset-x-0 top-full hidden border-b border-line bg-paper transition-all duration-300 ease-smooth lg:block',
            areasOpen
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none -translate-y-2 opacity-0',
          )}
        >
          <div className="shell grid grid-cols-4 gap-8 py-10">
            {areas.map((area) => (
              <div key={area.id}>
                <Link
                  href={`${routes.areas}#${area.slug}`}
                  className="link-underline font-display text-[1.0625rem] text-ink"
                >
                  {area.name}
                </Link>
                <ul className="mt-4 space-y-2">
                  {area.services.map((service) => (
                    <li key={service.id}>
                      <Link
                        href={`${routes.areas}/${service.slug}`}
                        className="block text-[0.8125rem] leading-relaxed text-ink-soft transition-colors hover:text-accent"
                      >
                        {service.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Menú móvil a pantalla completa */}
      <div
        className={cn(
          'fixed inset-0 z-[60] lg:hidden',
          menuOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!menuOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-ink/30 transition-opacity duration-500',
            menuOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setMenuOpen(false)}
        />
        <div
          role="dialog"
          aria-modal={menuOpen}
          aria-label="Menú de navegación"
          className={cn(
            'absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-paper transition-transform duration-500 ease-smooth',
            menuOpen ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <Logo
              name={studioName}
              legalName={studioLegalName}
              tagline={tagline}
              logoUrl={logoUrl}
              imageClassName="h-16 w-auto"
            />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
              className="rounded-full p-2.5 text-ink transition-colors hover:bg-ink/5"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6">
            <ul className="space-y-1">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block border-b border-line/70 py-3.5 font-display text-[1.25rem] transition-colors hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {areas.map((area) => (
              <div key={area.id} className="mt-7">
                <p className="overline mb-3">{area.name}</p>
                <ul className="space-y-1.5">
                  {area.services.map((service) => (
                    <li key={service.id}>
                      <Link
                        href={`${routes.areas}/${service.slug}`}
                        className="block py-1.5 text-[0.875rem] text-ink-soft transition-colors hover:text-ink"
                      >
                        {service.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-line p-5">
            <ButtonLink href={routes.consultation} className="w-full" size="lg">
              Solicitar consulta
            </ButtonLink>
            <a
              href={phoneHref}
              className="mt-3 flex items-center justify-center gap-2 py-2 text-sm text-ink-soft"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {phone}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
