import { notFound } from 'next/navigation';
import { AdminCard, AdminPageHeader, BackLink } from '@/components/admin/AdminUI';
import { AdminForm } from '@/components/admin/AdminForm';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox, Textarea } from '@/components/ui/Textarea';
import { deleteLawyer, saveLawyer } from '@/app/actions/admin';
import { adminGetAreas, adminGetLawyers } from '@/lib/data/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { demoLawyerAreas } from '@/content';

export const metadata = { title: 'Ficha de abogado' };

const TONES = ['ink', 'sage', 'clay', 'stone', 'sand'] as const;

/** Áreas ya asociadas al abogado (tabla `lawyer_areas`). */
async function getLawyerAreaIds(lawyerId: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return demoLawyerAreas
      .filter((relation) => relation.lawyer_id === lawyerId)
      .map((relation) => relation.area_id);
  }

  const { data } = await supabase
    .from('lawyer_areas')
    .select('area_id')
    .eq('lawyer_id', lawyerId);

  return ((data as { area_id: string }[]) ?? []).map((row) => row.area_id);
}

export default async function AdminLawyerFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === 'nuevo';

  const [lawyers, areas] = await Promise.all([adminGetLawyers(), adminGetAreas()]);
  const lawyer = isNew ? null : lawyers.find((item) => item.id === id);
  if (!isNew && !lawyer) notFound();

  const selectedAreas = lawyer ? await getLawyerAreaIds(lawyer.id) : [];

  return (
    <>
      <BackLink href="/admin/abogados">Volver a abogados</BackLink>

      <AdminPageHeader
        title={isNew ? 'Nuevo abogado' : (lawyer?.name ?? '')}
        description={
          isNew
            ? 'Complete la ficha. Se publicará en /equipo con su propia página de perfil.'
            : `Página pública: /equipo/${lawyer?.slug}`
        }
      />

      <AdminForm
        action={saveLawyer}
        submitLabel={isNew ? 'Crear ficha' : 'Guardar cambios'}
        footer={
          lawyer ? (
            <DeleteButton
              action={deleteLawyer}
              label="Eliminar ficha"
              confirmMessage="¿Eliminar esta ficha? Desaparecerá del sitio público."
            />
          ) : undefined
        }
      >
        {lawyer ? <input type="hidden" name="id" value={lawyer.id} /> : null}

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <AdminCard title="Identificación">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nombre completo" htmlFor="name" required>
                  <Input id="name" name="name" defaultValue={lawyer?.name ?? ''} required />
                </Field>

                <Field
                  label="Slug"
                  htmlFor="slug"
                  hint="Se genera automáticamente si se deja vacío."
                >
                  <Input id="slug" name="slug" defaultValue={lawyer?.slug ?? ''} placeholder="nombre-apellido" />
                </Field>

                <Field label="Cargo" htmlFor="role" required>
                  <Input
                    id="role"
                    name="role"
                    defaultValue={lawyer?.role ?? ''}
                    placeholder="Socio fundador"
                    required
                  />
                </Field>

                <Field label="Frase de presentación" htmlFor="headline">
                  <Input
                    id="headline"
                    name="headline"
                    defaultValue={lawyer?.headline ?? ''}
                    placeholder="Alimentos, tenencia y divorcio."
                  />
                </Field>
              </div>

              <Field
                label="Reseña profesional"
                htmlFor="bio"
                className="mt-5"
                hint="Un párrafo por línea."
              >
                <Textarea id="bio" name="bio" rows={6} defaultValue={(lawyer?.bio ?? []).join('\n')} />
              </Field>
            </AdminCard>

            <AdminCard title="Trayectoria" description="Un elemento por línea en cada campo.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Formación" htmlFor="education">
                  <Textarea
                    id="education"
                    name="education"
                    rows={5}
                    defaultValue={(lawyer?.education ?? []).join('\n')}
                    placeholder={'Título profesional — Universidad\nMaestría — Institución'}
                  />
                </Field>

                <Field label="Experiencia" htmlFor="experience">
                  <Textarea
                    id="experience"
                    name="experience"
                    rows={5}
                    defaultValue={(lawyer?.experience ?? []).join('\n')}
                  />
                </Field>

                <Field label="Especialidades" htmlFor="specialties">
                  <Textarea
                    id="specialties"
                    name="specialties"
                    rows={4}
                    defaultValue={(lawyer?.specialties ?? []).join('\n')}
                  />
                </Field>

                <Field label="Idiomas" htmlFor="languages">
                  <Textarea
                    id="languages"
                    name="languages"
                    rows={4}
                    defaultValue={(lawyer?.languages ?? []).join('\n')}
                  />
                </Field>
              </div>
            </AdminCard>

            <AdminCard title="Contacto y redes">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Correo" htmlFor="email">
                  <Input id="email" name="email" type="email" defaultValue={lawyer?.email ?? ''} />
                </Field>
                <Field label="Teléfono" htmlFor="phone">
                  <Input id="phone" name="phone" defaultValue={lawyer?.phone ?? ''} />
                </Field>
                <Field label="LinkedIn" htmlFor="linkedin_url" className="sm:col-span-2">
                  <Input
                    id="linkedin_url"
                    name="linkedin_url"
                    defaultValue={lawyer?.linkedin_url ?? ''}
                    placeholder="https://www.linkedin.com/in/…"
                  />
                </Field>
              </div>
            </AdminCard>
          </div>

          <div className="space-y-6">
            <AdminCard title="Publicación">
              <div className="space-y-5">
                <Field label="Orden de aparición" htmlFor="sort_order">
                  <Input
                    id="sort_order"
                    name="sort_order"
                    type="number"
                    defaultValue={lawyer?.sort_order ?? 0}
                  />
                </Field>

                <Checkbox
                  id="is_active"
                  name="is_active"
                  defaultChecked={lawyer?.is_active ?? true}
                  label="Visible en el sitio público"
                />
              </div>
            </AdminCard>

            <AdminCard
              title="Fotografía"
              description="Suba la imagen al bucket «lawyers» de Supabase Storage y pegue aquí su URL pública."
            >
              <div className="space-y-5">
                <Field label="URL de la fotografía" htmlFor="photo_url">
                  <Input
                    id="photo_url"
                    name="photo_url"
                    defaultValue={lawyer?.photo_url ?? ''}
                    placeholder="https://…/storage/v1/object/public/lawyers/…"
                  />
                </Field>

                <Field
                  label="Tono del retrato"
                  htmlFor="portrait_tone"
                  hint="Se usa mientras no haya fotografía."
                >
                  <Select
                    id="portrait_tone"
                    name="portrait_tone"
                    defaultValue={lawyer?.portrait_tone ?? 'ink'}
                  >
                    {TONES.map((tone) => (
                      <option key={tone} value={tone}>
                        {tone}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </AdminCard>

            <AdminCard title="Áreas de práctica">
              <ul className="space-y-3">
                {areas.map((area) => (
                  <li key={area.id}>
                    <Checkbox
                      id={`area-${area.id}`}
                      name="area_ids"
                      value={area.id}
                      defaultChecked={selectedAreas.includes(area.id)}
                      label={area.name}
                    />
                  </li>
                ))}
              </ul>
            </AdminCard>
          </div>
        </div>
      </AdminForm>
    </>
  );
}
