import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Mail } from 'lucide-react';
import { ButtonLink, ExternalButtonLink } from '@/components/ui/Button';
import { WhatsappIcon } from '@/components/whatsapp/WhatsappIcon';
import { routes } from '@/config/site';
import { getSiteSettings, whatsappUrl } from '@/lib/data';

/**
 * Banda de cierre con la llamada a la acción principal. Se repite al final de
 * las páginas públicas; el mensaje de WhatsApp puede contextualizarse.
 */
export async function CtaBand({
  title = '¿Necesita asesoría legal?',
  description = 'Cuéntenos su situación. Revisamos la documentación y le explicamos las vías posibles, con sus plazos y sus costos, antes de que tome una decisión.',
  primaryLabel = 'Solicitar consulta',
  primaryHref = routes.consultation,
  whatsappMessage,
}: {
  title?: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  whatsappMessage?: string;
}) {
  const settings = await getSiteSettings();

  return (
    <section className="shell">
      <div className="relative overflow-hidden rounded-2xl bg-ink px-6 py-14 text-paper sm:px-12 sm:py-16 lg:px-16 lg:py-20">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-paper/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full border border-paper/[0.07]"
          aria-hidden
        />

        <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <h2 className="text-[1.875rem] leading-tight text-paper sm:text-[2.375rem]">{title}</h2>
            <p className="mt-5 max-w-xl text-pretty text-[1.0625rem] leading-relaxed text-paper/70">
              {description}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink
                href={primaryHref}
                size="lg"
                className="bg-paper text-ink hover:bg-paper/90"
              >
                {primaryLabel}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <ExternalButtonLink
                href={whatsappUrl(settings, whatsappMessage)}
                variant="secondary"
                size="lg"
                className="border-paper/25 text-paper hover:border-paper/60 hover:bg-paper/[0.06]"
              >
                <WhatsappIcon className="h-4 w-4" />
                Hablar por WhatsApp
              </ExternalButtonLink>
            </div>
          </div>

          <div className="lg:col-span-5 lg:pl-8">
            <ul className="space-y-3">
              <li>
                <Link
                  href={routes.appointment}
                  className="group flex items-center gap-4 rounded-xl border border-paper/15 px-5 py-4 transition-colors duration-300 hover:border-paper/40 hover:bg-paper/[0.04]"
                >
                  <CalendarDays className="h-4 w-4 shrink-0 text-paper/60" aria-hidden />
                  <span className="flex-1">
                    <span className="block text-[0.9375rem] text-paper">Solicitar una cita</span>
                    <span className="mt-0.5 block text-2xs text-paper/50">
                      Presencial o por videollamada
                    </span>
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-paper/40 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${settings.email}`}
                  className="group flex items-center gap-4 rounded-xl border border-paper/15 px-5 py-4 transition-colors duration-300 hover:border-paper/40 hover:bg-paper/[0.04]"
                >
                  <Mail className="h-4 w-4 shrink-0 text-paper/60" aria-hidden />
                  <span className="flex-1">
                    <span className="block text-[0.9375rem] text-paper">Escribir un correo</span>
                    <span className="mt-0.5 block text-2xs text-paper/50">{settings.email}</span>
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-paper/40 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </a>
              </li>
            </ul>
            <p className="mt-5 text-2xs leading-relaxed text-paper/40">
              {settings.business_hours_short} · {settings.phone}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
