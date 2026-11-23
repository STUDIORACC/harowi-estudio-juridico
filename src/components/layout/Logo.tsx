import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Marca del estudio. Si en Configuración se cargó un logotipo, se muestra esa
 * imagen; si no, se usa el símbolo tipográfico de respaldo: una «L» construida
 * con dos trazos —lectura vertical de estructura y base—, sin balanzas ni
 * martillos.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn('h-7 w-7', className)}
      fill="none"
      aria-hidden
      focusable="false"
    >
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="7.25"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.35"
      />
      <path d="M11 8.5V21.5H21.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
      <path
        d="M16.5 8.5H21.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="square"
        opacity="0.5"
      />
    </svg>
  );
}

export interface LogoProps {
  name: string;
  legalName: string;
  tagline?: string;
  logoUrl?: string | null;
  className?: string;
  href?: string;
  showTagline?: boolean;
  tone?: 'ink' | 'paper';
  /** Altura del logotipo cuando se usa una imagen cargada (p. ej. "h-14 w-auto"). */
  imageClassName?: string;
}

export function Logo({
  name,
  legalName,
  tagline,
  logoUrl,
  className,
  href = '/',
  showTagline = true,
  tone = 'ink',
  imageClassName = 'h-12 w-auto',
}: LogoProps) {
  return (
    <Link
      href={href}
      className={cn('group flex items-center gap-3', className)}
      aria-label={`${legalName} — Inicio`}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={legalName}
          width={160}
          height={160}
          className={cn('w-auto object-contain', imageClassName)}
          priority
        />
      ) : (
        <>
          <LogoMark
            className={cn(
              'h-8 w-8 shrink-0 transition-transform duration-500 ease-smooth group-hover:scale-105',
              tone === 'paper' ? 'text-paper/70' : 'text-accent',
            )}
          />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[1.0625rem] tracking-[0.2em]">{name}</span>
            {showTagline && tagline ? (
              <span
                className={cn(
                  'mt-1 block text-[0.5625rem] uppercase tracking-[0.24em]',
                  tone === 'paper' ? 'text-paper/50' : 'text-ink-muted',
                )}
              >
                {tagline}
              </span>
            ) : null}
          </span>
        </>
      )}
    </Link>
  );
}
