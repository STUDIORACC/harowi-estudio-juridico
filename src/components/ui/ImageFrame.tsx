import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import type { PortraitTone } from '@/types';

/**
 * ---------------------------------------------------------------------------
 * MARCO DE IMAGEN
 * ---------------------------------------------------------------------------
 * Muestra la fotografía cargada en Supabase Storage y, mientras no exista,
 * un marcador sobrio en lugar de una imagen de stock. Se usa en el hero, en
 * las fichas de abogados, en el blog y en las páginas de servicio.
 * ---------------------------------------------------------------------------
 */

const tones: Record<PortraitTone, string> = {
  ink: 'from-[#181d23] to-[#2c343d]',
  sage: 'from-[#2c3a34] to-[#465b51]',
  clay: 'from-[#3b2b26] to-[#5d4338]',
  stone: 'from-[#2a2d33] to-[#4a4f58]',
  sand: 'from-[#3a3229] to-[#5c5044]',
};

const ratios = {
  portrait: 'aspect-[4/5]',
  square: 'aspect-square',
  wide: 'aspect-[16/10]',
  hero: 'aspect-[4/5] sm:aspect-[3/4]',
  banner: 'aspect-[21/9]',
} as const;

export interface ImageFrameProps {
  src?: string | null;
  alt: string;
  /** Monograma mostrado cuando no hay imagen (iniciales del nombre). */
  monogram?: string;
  tone?: PortraitTone;
  ratio?: keyof typeof ratios;
  className?: string;
  priority?: boolean;
  sizes?: string;
  /** Texto del marcador cuando no hay imagen cargada. */
  placeholderLabel?: string;
}

export function ImageFrame({
  src,
  alt,
  monogram,
  tone = 'ink',
  ratio = 'portrait',
  className,
  priority = false,
  sizes = '(max-width: 1024px) 100vw, 50vw',
  placeholderLabel,
}: ImageFrameProps) {
  const shape = cn('relative overflow-hidden rounded-2xl', ratios[ratio], className);

  if (src) {
    return (
      <div className={shape}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(shape, 'flex items-end bg-gradient-to-br text-white/90', tones[tone])}
    >
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.16]"
        viewBox="0 0 100 125"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <pattern id={`frame-lines-${tone}`} width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M0 6L6 0" stroke="currentColor" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100" height="125" fill={`url(#frame-lines-${tone})`} />
        <circle cx="78" cy="34" r="30" fill="currentColor" opacity="0.25" />
      </svg>

      {monogram ? (
        <span
          aria-hidden
          className="relative px-6 pb-5 font-display text-[2.75rem] leading-none tracking-tight opacity-90"
        >
          {initials(monogram)}
        </span>
      ) : (
        <span className="relative flex w-full items-center gap-2.5 px-6 pb-5 text-2xs uppercase tracking-overline text-white/55">
          <ImageIcon className="h-3.5 w-3.5" aria-hidden />
          {placeholderLabel ?? 'Imagen pendiente de carga'}
        </span>
      )}
    </div>
  );
}
