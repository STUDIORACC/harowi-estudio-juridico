import type { Metadata } from 'next';
import { CalendarCheck, Clock, MapPin, Video } from 'lucide-react';
import { AppointmentForm } from '@/components/forms/AppointmentForm';
import { PageHeader } from '@/components/site/PageHeader';
import { ExternalButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { WhatsappIcon } from '@/components/whatsapp/WhatsappIcon';
import { routes } from '@/config/site';
import {
  getAreasWithServices,
  getAvailability,
  getBlockedDates,
  getLawyers,
  getSiteSettings,
  whatsappUrl,
} from '@/lib/data';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: 'Solicitar cita',
    description: `Reserve una cita con ${settings.studio_legal_name}: elija el área, el profesional, la fecha y el horario disponible. Atención presencial o por videollamada.`,
    alternates: { canonical: routes.appointment },
  };
}

export default async function AppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ abogado?: string; area?: string }>;
}) {
  const [{ abogado, area }, areas, lawyers, availability, blocked, settings] = await Promise.all([
    searchParams,
    getAreasWithServices(),
    getLawyers(),
    getAvailability(),
    getBlockedDates(),
    getSiteSettings(),
  ]);

  return (
    <>
      <PageHeader
        overline="Citas"
        title="Solicitar una cita"
        description="Elija el área, el profesional y el horario que le resulte conveniente. La solicitud queda registrada como pendiente hasta que el estudio la confirme."
        breadcrumbs={[{ label: 'Inicio', href: routes.home }, { label: 'Citas' }]}
      />

      <div className="shell grid gap-14 py-16 lg:grid-cols-12 lg:gap-16 lg:py-20">
        <div className="lg:col-span-8">
          <Reveal>
            <AppointmentForm
              areas={areas}
              lawyers={lawyers}
              availability={availability}
              blockedDates={blocked.map((item) => item.date)}
              defaultLawyerSlug={abogado}
              defaultAreaSlug={area}
            />
          </Reveal>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <Reveal delay={80}>
            <div className="rounded-2xl border border-line bg-paper-alt/60 p-6 sm:p-7">
              <p className="overline mb-5">Cómo funciona</p>
              <ol className="space-y-4 text-[0.875rem] leading-relaxed text-ink-soft">
                <li className="flex gap-3">
                  <span className="font-display text-2xs tabular-nums text-accent">01</span>
                  Elige área, profesional, fecha y horario disponible.
                </li>
                <li className="flex gap-3">
                  <span className="font-display text-2xs tabular-nums text-accent">02</span>
                  La solicitud se registra con estado <strong className="font-medium text-ink">pendiente</strong>.
                </li>
                <li className="flex gap-3">
                  <span className="font-display text-2xs tabular-nums text-accent">03</span>
                  El estudio la confirma, propone otro horario o la cancela, y se lo comunica.
                </li>
              </ol>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <ul className="space-y-px overflow-hidden rounded-2xl border border-line bg-line">
              <li className="flex gap-3 bg-paper p-5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <div className="text-[0.875rem]">
                  <p className="text-ink">Horario de atención</p>
                  <ul className="mt-1.5 space-y-1 text-ink-soft">
                    {settings.business_hours.map((hour) => (
                      <li key={hour.days} className="flex justify-between gap-4">
                        <span>{hour.days}</span>
                        <span className="text-ink-muted">{hour.hours}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
              <li className="flex gap-3 bg-paper p-5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <div className="text-[0.875rem]">
                  <p className="text-ink">Oficina</p>
                  <p className="mt-1 text-ink-soft">
                    {settings.address}
                    <br />
                    {settings.address_city}
                  </p>
                </div>
              </li>
              <li className="flex gap-3 bg-paper p-5">
                <Video className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <div className="text-[0.875rem]">
                  <p className="text-ink">Videollamada</p>
                  <p className="mt-1 text-ink-soft">
                    Al confirmar la cita virtual se envía el enlace de conexión.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 bg-paper p-5">
                <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <div className="text-[0.875rem]">
                  <p className="text-ink">Reprogramación</p>
                  <p className="mt-1 text-ink-soft">
                    Si necesita cambiar la fecha, avísenos con la mayor antelación posible.
                  </p>
                </div>
              </li>
            </ul>
          </Reveal>

          <Reveal delay={200}>
            <div className="rounded-2xl border border-line bg-paper p-6 sm:p-7">
              <p className="overline mb-4">¿Prefiere coordinar por WhatsApp?</p>
              <ExternalButtonLink
                href={whatsappUrl(settings, 'Hola, deseo coordinar una cita en el estudio.')}
                variant="secondary"
                size="md"
                className="w-full"
              >
                <WhatsappIcon className="h-4 w-4 text-[#25D366]" />
                Escribir por WhatsApp
              </ExternalButtonLink>
            </div>
          </Reveal>
        </aside>
      </div>
    </>
  );
}
