import { notFound } from 'next/navigation';
import { AdminCard, AdminPageHeader, BackLink } from '@/components/admin/AdminUI';
import { AdminForm } from '@/components/admin/AdminForm';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox, Textarea } from '@/components/ui/Textarea';
import { areaIcons } from '@/components/site/AreaCard';
import { deleteArea, saveArea } from '@/app/actions/admin';
import { adminGetAreas } from '@/lib/data/admin';

export const metadata = { title: 'Área de práctica' };

export default async function AdminAreaFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === 'nueva';

  const areas = await adminGetAreas();
  const area = isNew ? null : areas.find((item) => item.id === id);
  if (!isNew && !area) notFound();

  return (
    <>
      <BackLink href="/admin/areas">Volver a áreas</BackLink>

      <AdminPageHeader
        title={isNew ? 'Nueva área' : (area?.name ?? '')}
        description={
          isNew
            ? 'Las áreas agrupan los servicios y estructuran la página /areas.'
            : `Ancla pública: /areas#${area?.slug}`
        }
      />

      <AdminForm
        action={saveArea}
        submitLabel={isNew ? 'Crear área' : 'Guardar cambios'}
        footer={
          area ? (
            <DeleteButton
              action={deleteArea}
              label="Eliminar área"
              confirmMessage="¿Eliminar esta área? No podrá eliminarse si tiene servicios asociados."
            />
          ) : undefined
        }
      >
        {area ? <input type="hidden" name="id" value={area.id} /> : null}

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <AdminCard title="Contenido">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nombre" htmlFor="name" required>
                  <Input id="name" name="name" defaultValue={area?.name ?? ''} required />
                </Field>

                <Field label="Nombre corto" htmlFor="short_name">
                  <Input
                    id="short_name"
                    name="short_name"
                    defaultValue={area?.short_name ?? ''}
                    placeholder="Familia"
                  />
                </Field>

                <Field label="Slug" htmlFor="slug" hint="Se genera automáticamente si se deja vacío.">
                  <Input id="slug" name="slug" defaultValue={area?.slug ?? ''} />
                </Field>

                <Field label="Icono" htmlFor="icon">
                  <Select id="icon" name="icon" defaultValue={area?.icon ?? 'Scale'}>
                    {Object.keys(areaIcons).map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Frase corta" htmlFor="tagline" className="mt-5">
                <Input
                  id="tagline"
                  name="tagline"
                  defaultValue={area?.tagline ?? ''}
                  placeholder="Alimentos, tenencia, régimen de visitas y divorcio."
                />
              </Field>

              <Field label="Resumen" htmlFor="summary" className="mt-5">
                <Textarea id="summary" name="summary" rows={3} defaultValue={area?.summary ?? ''} />
              </Field>

              <Field
                label="Introducción"
                htmlFor="intro"
                className="mt-5"
                hint="Un párrafo por línea. Se muestra en la página /areas."
              >
                <Textarea id="intro" name="intro" rows={6} defaultValue={(area?.intro ?? []).join('\n')} />
              </Field>
            </AdminCard>

            <AdminCard title="SEO">
              <div className="space-y-5">
                <Field label="Título SEO" htmlFor="seo_title">
                  <Input id="seo_title" name="seo_title" defaultValue={area?.seo_title ?? ''} />
                </Field>
                <Field label="Descripción SEO" htmlFor="seo_description">
                  <Textarea
                    id="seo_description"
                    name="seo_description"
                    rows={2}
                    defaultValue={area?.seo_description ?? ''}
                  />
                </Field>
              </div>
            </AdminCard>
          </div>

          <div>
            <AdminCard title="Publicación">
              <div className="space-y-5">
                <Field label="Orden" htmlFor="sort_order">
                  <Input
                    id="sort_order"
                    name="sort_order"
                    type="number"
                    defaultValue={area?.sort_order ?? 0}
                  />
                </Field>
                <Checkbox
                  id="is_active"
                  name="is_active"
                  defaultChecked={area?.is_active ?? true}
                  label="Visible en el sitio público"
                />
              </div>
            </AdminCard>
          </div>
        </div>
      </AdminForm>
    </>
  );
}
