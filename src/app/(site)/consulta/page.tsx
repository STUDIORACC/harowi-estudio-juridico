import type { Metadata } from 'next';
import { CalendarDays, Clock, MessageCircle, ShieldCheck } from 'lucide-react';
import { ConsultationForm } from '@/components/forms/ConsultationForm';
import { PageHeader } from '@/components/site/PageHeader';
import { ExternalButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { WhatsappIcon } from '@/components/whatsapp/WhatsappIcon';
import { routes } from '@/config/site';
import { getAreasWithServices, getSiteSettings, whatsappUrl } from '@/lib/data';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: 'Cuéntenos su caso',
    description: `Envíe su consulta a ${settings.studio_legal_name}. Revisamos la situación y le indicamos si corresponde accionar y por qué vía.`,
    alternates: { canonical: routes.consultation },
  };
}

export default async function ConsultationPage({
  searchParams,
}: {
  searchParams: Promise<{ servicio?: string }>;
}) {
  const [{ servicio }, areas, settings] = await Promise.all([
    searchParams,
    getAreasWithServices(),
    getSiteSettings(),
  ]);

  return (
    <>
      <PageHeader
        overline="Consulta"
        title="Cuéntenos su caso"
        description="Complete el formulario con el detalle que tenga a mano. Al recibirlo revisamos la información y coordinamos una conversación para evaluar las vías posibles."
        breadcrumbs={[{ label: 'Inicio', href: routes.home }, { label: 'Consulta' }]}
      />

      <div className="shell grid gap-14 py-16 lg:grid-cols-12 lg:gap-16 lg:py-20">
        <div className="lg:col-span-7">
          <Reveal>
            <ConsultationForm areas={areas} defaultServiceSlug={servicio} />
          </Reveal>
        </div>

        <aside className="space-y-6 lg:col-span-5 lg:pl-8">
          <Reveal delay={80}>
            <div className="rounded-2xl border border-line bg-paper-alt/60 p-6 sm:p-7">
              <p className="overline mb-5">Qué ocurre después</p>
              <ol className="space-y-5">
                {[
                  {
                    icon: MessageCircle,
                    title: 'Revisamos su consulta',
                    text: 'Leemos la descripción y verificamos si el estudio puede asumir la materia.',
                  },
                  {
                    icon: Clock,
                    title: 'Nos comunicamos',
                    text: `Le escribimos o llamamos por el canal que indicó, dentro del horario de atención (${settings.business_hours_short}).`,
                  },
                  {
                    icon: CalendarDays,
                    title: 'Coordinamos la reunión',
                    text: 'Acordamos una fecha, presencial o por videollamada, y le indicamos qué documentación conviene traer.',
                  },
                ].map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-paper">
                      <step.icon className="h-4 w-4 text-accent" aria-hidden />
                    </span>
                    <div>
                      <p className="text-[0.9375rem] text-ink">
                        <span className="mr-2 font-display text-2xs tabular-nums text-accent">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {step.title}
                      </p>
                      <p className="mt-1.5 text-[0.875rem] leading-relaxed text-ink-soft">
                        {step.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="rounded-2xl border border-line bg-paper p-6 sm:p-7">
              <p className="overline mb-4">¿Prefiere escribir directamente?</p>
              <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
                Si su caso tiene un plazo próximo a vencer, el canal más rápido es WhatsApp.
              </p>
              <ExternalButtonLink
                href={whatsappUrl(settings)}
                variant="secondary"
                size="md"
                className="mt-5 w-full"
              >
                <WhatsappIcon className="h-4 w-4 text-[#25D366]" />
                Hablar por WhatsApp
              </ExternalButtonLink>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="flex gap-3 rounded-2xl border border-line bg-paper p-6">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
              <p className="text-2xs leading-relaxed text-ink-muted">
                La información que envíe se trata con reserva profesional y se usa únicamente para
                evaluar y atender su consulta. {settings.disclaimer}
              </p>
            </div>
          </Reveal>
        </aside>
      </div>
    </>
  );
}
