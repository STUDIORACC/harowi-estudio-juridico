import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { routes } from '@/config/site';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center">
      <div className="shell py-24">
        <p className="overline mb-6">Error 404</p>
        <h1 className="max-w-2xl text-[2rem] leading-tight sm:text-[2.75rem]">
          La página que busca no existe o cambió de dirección
        </h1>
        <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-ink-soft">
          Puede volver al inicio, revisar las áreas de práctica o escribirnos directamente para que
          le orientemos.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href={routes.home} size="lg">
            Volver al inicio
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
          <ButtonLink href={routes.areas} variant="secondary" size="lg">
            Áreas de práctica
          </ButtonLink>
        </div>

        <ul className="mt-14 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-8 text-[0.875rem]">
          {[
            { label: 'Nosotros', href: routes.about },
            { label: 'Equipo', href: routes.team },
            { label: 'Blog', href: routes.blog },
            { label: 'Preguntas frecuentes', href: routes.faq },
            { label: 'Contacto', href: routes.contact },
          ].map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="link-underline text-ink-soft hover:text-ink">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
