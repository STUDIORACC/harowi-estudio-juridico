import Link from 'next/link';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Logo } from './Logo';
import { footerNav, routes } from '@/config/site';
import { getAreasWithServices, getSiteSettings, getSocialLinks, telHref, whatsappUrl } from '@/lib/data';

export async function Footer() {
  const [settings, socials, areas] = await Promise.all([
    getSiteSettings(),
    getSocialLinks(),
    getAreasWithServices(),
  ]);

  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-line bg-paper-alt/60 sm:mt-28">
      <div className="shell py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo
              name={settings.studio_name}
              legalName={settings.studio_legal_name}
              tagline={settings.tagline}
              logoUrl={settings.logo_url}
              imageClassName="h-20 w-auto"
            />
            <p className="mt-6 max-w-sm text-[0.9375rem] leading-relaxed text-ink-soft">
              {settings.description}
            </p>
            {socials.length > 0 ? (
              <ul className="mt-7 flex flex-wrap gap-2">
                {socials.map((social) => (
                  <li key={social.id}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-full border border-line px-4 py-2 text-2xs uppercase tracking-overline text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
                    >
                      {social.label ?? social.platform}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {footerNav.map((group) => (
            <div key={group.title} className="lg:col-span-2">
              <h2 className="overline mb-5">{group.title}</h2>
              <ul className="space-y-2.5 text-[0.875rem]">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-ink-soft transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-3">
            <h2 className="overline mb-5">Contacto</h2>
            <ul className="space-y-4 text-[0.875rem] text-ink-soft">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <span>
                  {settings.address}
                  <br />
                  {settings.address_city}
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <a href={telHref(settings.phone)} className="transition-colors hover:text-ink">
                  {settings.phone}
                </a>
              </li>
              <li className="flex gap-3">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <a
                  href={whatsappUrl(settings)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-ink"
                >
                  WhatsApp
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <a href={`mailto:${settings.email}`} className="transition-colors hover:text-ink">
                  {settings.email}
                </a>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <span>{settings.business_hours_short}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14">
          <h2 className="overline mb-5">Áreas de práctica</h2>
          <ul className="grid gap-x-8 gap-y-2 text-[0.8125rem] sm:grid-cols-2 lg:grid-cols-4">
            {areas.flatMap((area) =>
              area.services.map((service) => (
                <li key={service.id}>
                  <Link
                    href={`${routes.areas}/${service.slug}`}
                    className="text-ink-soft transition-colors hover:text-ink"
                  >
                    {service.name}
                  </Link>
                </li>
              )),
            )}
          </ul>
        </div>

        <div className="mt-14 rounded-2xl border border-line bg-paper p-5">
          <p className="text-[0.8125rem] leading-relaxed text-ink-muted">
            <span className="font-medium text-ink-soft">Aviso legal.</span> {settings.disclaimer} El
            envío de un formulario a través de este sitio no genera relación abogado-cliente.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-line pt-8 text-2xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.studio_legal_name}. Todos los derechos reservados.
          </p>
          <ul className="flex flex-wrap gap-6">
            <li>
              <Link href={routes.privacy} className="transition-colors hover:text-ink">
                Política de privacidad
              </Link>
            </li>
            <li>
              <Link href={routes.terms} className="transition-colors hover:text-ink">
                Aviso legal
              </Link>
            </li>
            <li>
              <Link href={routes.admin} className="transition-colors hover:text-ink">
                Acceso interno
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
