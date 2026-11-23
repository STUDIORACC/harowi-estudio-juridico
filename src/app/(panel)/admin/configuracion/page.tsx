import { AdminCard, AdminPageHeader } from '@/components/admin/AdminUI';
import { AdminForm } from '@/components/admin/AdminForm';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { saveSettings } from '@/app/actions/admin';
import { getSiteSettings, getSocialLinks } from '@/lib/data';
import { stepsToText } from '@/lib/forms/parse';

export const metadata = { title: 'Configuración' };

export default async function AdminSettingsPage() {
  const [settings, socials] = await Promise.all([getSiteSettings(), getSocialLinks()]);

  const businessHoursText = settings.business_hours
    .map((hour) => `${hour.days} | ${hour.hours}`)
    .join('\n');

  const valuesText = settings.about_values
    .map((value) => `${value.title} | ${value.description}`)
    .join('\n');

  return (
    <>
      <AdminPageHeader
        title="Configuración"
        description="Datos del estudio usados en todo el sitio: identidad, contacto, textos principales y SEO. No es necesario editar ningún componente."
      />

      <AdminForm action={saveSettings} submitLabel="Guardar configuración">
        <div className="grid gap-6 xl:grid-cols-2">
          <AdminCard title="Identidad">
            <div className="space-y-5">
              <Field label="Nombre corto" htmlFor="studio_name" required>
                <Input id="studio_name" name="studio_name" defaultValue={settings.studio_name} required />
              </Field>

              <Field label="Nombre completo" htmlFor="studio_legal_name" required>
                <Input
                  id="studio_legal_name"
                  name="studio_legal_name"
                  defaultValue={settings.studio_legal_name}
                  required
                />
              </Field>

              <Field label="Bajada del logotipo" htmlFor="tagline">
                <Input id="tagline" name="tagline" defaultValue={settings.tagline} />
              </Field>

              <Field label="Descripción del estudio" htmlFor="description">
                <Textarea id="description" name="description" rows={3} defaultValue={settings.description} />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Logotipo (URL)"
                  htmlFor="logo_url"
                  hint="Bucket «site» de Storage."
                >
                  <Input id="logo_url" name="logo_url" defaultValue={settings.logo_url ?? ''} />
                </Field>

                <Field label="Favicon (URL)" htmlFor="favicon_url">
                  <Input id="favicon_url" name="favicon_url" defaultValue={settings.favicon_url ?? ''} />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Color principal"
                  htmlFor="primary_color"
                  hint="Formato RGB, p. ej. «17 20 24»."
                >
                  <Input id="primary_color" name="primary_color" defaultValue={settings.primary_color} />
                </Field>

                <Field label="Color de acento" htmlFor="accent_color" hint="Formato RGB.">
                  <Input id="accent_color" name="accent_color" defaultValue={settings.accent_color} />
                </Field>
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Contacto">
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Teléfono" htmlFor="phone" required>
                  <Input id="phone" name="phone" defaultValue={settings.phone} required />
                </Field>

                <Field
                  label="WhatsApp"
                  htmlFor="whatsapp_number"
                  hint="Solo dígitos con código de país."
                >
                  <Input
                    id="whatsapp_number"
                    name="whatsapp_number"
                    defaultValue={settings.whatsapp_number}
                    placeholder="51987654321"
                  />
                </Field>
              </div>

              <Field label="Mensaje por defecto de WhatsApp" htmlFor="whatsapp_message">
                <Input
                  id="whatsapp_message"
                  name="whatsapp_message"
                  defaultValue={settings.whatsapp_message}
                />
              </Field>

              <Field label="Correo electrónico" htmlFor="email" required>
                <Input id="email" name="email" type="email" defaultValue={settings.email} required />
              </Field>

              <Field label="Dirección" htmlFor="address">
                <Input id="address" name="address" defaultValue={settings.address} />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Ciudad" htmlFor="address_city">
                  <Input id="address_city" name="address_city" defaultValue={settings.address_city} />
                </Field>

                <Field
                  label="Consulta de Google Maps"
                  htmlFor="map_query"
                  hint="Texto que se busca en el mapa embebido."
                >
                  <Input id="map_query" name="map_query" defaultValue={settings.map_query} />
                </Field>
              </div>

              <Field
                label="Horario de atención"
                htmlFor="business_hours"
                hint="Una línea por franja, con el formato «Días | Horario»."
              >
                <Textarea
                  id="business_hours"
                  name="business_hours"
                  rows={4}
                  defaultValue={businessHoursText}
                />
              </Field>

              <Field label="Horario resumido" htmlFor="business_hours_short">
                <Input
                  id="business_hours_short"
                  name="business_hours_short"
                  defaultValue={settings.business_hours_short}
                />
              </Field>
            </div>
          </AdminCard>

          <AdminCard title="Página de inicio">
            <div className="space-y-5">
              <Field label="Titular principal" htmlFor="hero_title" required>
                <Textarea id="hero_title" name="hero_title" rows={2} defaultValue={settings.hero_title} />
              </Field>

              <Field label="Texto de apoyo" htmlFor="hero_subtitle">
                <Textarea
                  id="hero_subtitle"
                  name="hero_subtitle"
                  rows={3}
                  defaultValue={settings.hero_subtitle}
                />
              </Field>

              <Field
                label="Imagen principal (URL)"
                htmlFor="hero_image_url"
                hint="Fotografía del estudio. Bucket «site» de Storage."
              >
                <Input
                  id="hero_image_url"
                  name="hero_image_url"
                  defaultValue={settings.hero_image_url ?? ''}
                />
              </Field>
            </div>
          </AdminCard>

          <AdminCard title="SEO y aviso legal">
            <div className="space-y-5">
              <Field label="Título SEO" htmlFor="seo_title">
                <Input id="seo_title" name="seo_title" defaultValue={settings.seo_title} />
              </Field>

              <Field label="Descripción SEO" htmlFor="seo_description">
                <Textarea
                  id="seo_description"
                  name="seo_description"
                  rows={3}
                  defaultValue={settings.seo_description}
                />
              </Field>

              <Field label="Aviso legal del pie" htmlFor="disclaimer">
                <Textarea id="disclaimer" name="disclaimer" rows={4} defaultValue={settings.disclaimer} />
              </Field>
            </div>
          </AdminCard>

          <AdminCard title="Página «Nosotros»" className="xl:col-span-2">
            <div className="grid gap-5 lg:grid-cols-2">
              <Field
                label="Historia del estudio"
                htmlFor="about_intro"
                hint="Un párrafo por línea."
              >
                <Textarea
                  id="about_intro"
                  name="about_intro"
                  rows={6}
                  defaultValue={settings.about_intro.join('\n')}
                />
              </Field>

              <Field label="Filosofía" htmlFor="about_philosophy">
                <Textarea
                  id="about_philosophy"
                  name="about_philosophy"
                  rows={6}
                  defaultValue={settings.about_philosophy}
                />
              </Field>

              <Field
                label="Valores"
                htmlFor="about_values"
                hint="Una línea por valor, con el formato «Título | Descripción»."
              >
                <Textarea id="about_values" name="about_values" rows={6} defaultValue={valuesText} />
              </Field>

              <Field
                label="Metodología"
                htmlFor="about_method"
                hint="Una línea por paso, con el formato «Título | Descripción». La numeración es automática."
              >
                <Textarea
                  id="about_method"
                  name="about_method"
                  rows={6}
                  defaultValue={stepsToText(settings.about_method)}
                />
              </Field>
            </div>
          </AdminCard>
        </div>
      </AdminForm>

      <section className="mt-6">
        <AdminCard
          title="Redes sociales"
          description="Se editan en la tabla `social_links` de Supabase. Los enlaces activos aparecen en el pie del sitio."
        >
          {socials.length === 0 ? (
            <p className="text-2xs text-ink-muted">No hay redes sociales configuradas.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {socials.map((social) => (
                <li
                  key={social.id}
                  className="rounded-xl border border-line bg-paper-alt/50 px-4 py-3"
                >
                  <p className="text-[0.875rem] text-ink">{social.label ?? social.platform}</p>
                  <p className="mt-1 truncate text-2xs text-ink-muted">{social.url}</p>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </section>
    </>
  );
}
