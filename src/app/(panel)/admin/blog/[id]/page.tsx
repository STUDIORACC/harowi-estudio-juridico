import { notFound } from 'next/navigation';
import { AdminCard, AdminPageHeader, BackLink } from '@/components/admin/AdminUI';
import { AdminForm } from '@/components/admin/AdminForm';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { deletePost, savePost } from '@/app/actions/admin';
import { adminGetAreas, adminGetLawyers, adminGetPosts } from '@/lib/data/admin';
import { blocksToText } from '@/lib/forms/parse';

export const metadata = { title: 'Artículo' };

const TONES = ['ink', 'sage', 'clay', 'stone', 'sand'] as const;

export default async function AdminPostFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === 'nuevo';

  const [posts, lawyers, areas] = await Promise.all([
    adminGetPosts(),
    adminGetLawyers(),
    adminGetAreas(),
  ]);

  const post = isNew ? null : posts.find((item) => item.id === id);
  if (!isNew && !post) notFound();

  const categories = [...new Set(posts.map((item) => item.category))];

  return (
    <>
      <BackLink href="/admin/blog">Volver al blog</BackLink>

      <AdminPageHeader
        title={isNew ? 'Nuevo artículo' : (post?.title ?? '')}
        description={isNew ? undefined : `Página pública: /blog/${post?.slug}`}
      />

      <AdminForm
        action={savePost}
        submitLabel={isNew ? 'Crear artículo' : 'Guardar cambios'}
        footer={
          post ? (
            <DeleteButton
              action={deletePost}
              label="Eliminar artículo"
              confirmMessage="¿Eliminar este artículo definitivamente?"
            />
          ) : undefined
        }
      >
        {post ? <input type="hidden" name="id" value={post.id} /> : null}

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <AdminCard title="Artículo">
              <Field label="Título" htmlFor="title" required>
                <Input id="title" name="title" defaultValue={post?.title ?? ''} required />
              </Field>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label="Slug" htmlFor="slug" hint="Define la URL: /blog/slug">
                  <Input id="slug" name="slug" defaultValue={post?.slug ?? ''} />
                </Field>

                <Field label="Categoría" htmlFor="category">
                  <Input
                    id="category"
                    name="category"
                    defaultValue={post?.category ?? 'General'}
                    list="categorias"
                  />
                  <datalist id="categorias">
                    {categories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </Field>
              </div>

              <Field
                label="Extracto"
                htmlFor="excerpt"
                className="mt-5"
                hint="Resumen mostrado en el listado y en los resultados de búsqueda."
              >
                <Textarea id="excerpt" name="excerpt" rows={3} defaultValue={post?.excerpt ?? ''} />
              </Field>
            </AdminCard>

            <AdminCard
              title="Contenido"
              description="Prefijos de línea: ## encabezado · ### subencabezado · - lista · > cita · ! aviso. El resto son párrafos."
            >
              <Field label="Cuerpo del artículo" htmlFor="content">
                <Textarea
                  id="content"
                  name="content"
                  rows={20}
                  defaultValue={blocksToText(post?.content ?? [])}
                  className="font-mono text-[0.8125rem]"
                />
              </Field>
            </AdminCard>

            <AdminCard title="SEO">
              <div className="space-y-5">
                <Field label="Título SEO" htmlFor="seo_title">
                  <Input id="seo_title" name="seo_title" defaultValue={post?.seo_title ?? ''} />
                </Field>
                <Field label="Descripción SEO" htmlFor="seo_description">
                  <Textarea
                    id="seo_description"
                    name="seo_description"
                    rows={3}
                    defaultValue={post?.seo_description ?? ''}
                  />
                </Field>
              </div>
            </AdminCard>
          </div>

          <div className="space-y-6">
            <AdminCard title="Publicación">
              <div className="space-y-5">
                <Field label="Estado" htmlFor="status" required>
                  <Select id="status" name="status" defaultValue={post?.status ?? 'borrador'}>
                    <option value="borrador">Borrador</option>
                    <option value="publicado">Publicado</option>
                  </Select>
                </Field>

                <Field
                  label="Fecha de publicación"
                  htmlFor="published_at"
                  hint="Si se deja vacía al publicar, se usa la fecha actual."
                >
                  <Input
                    id="published_at"
                    name="published_at"
                    type="date"
                    defaultValue={post?.published_at?.slice(0, 10) ?? ''}
                  />
                </Field>

                <Field label="Minutos de lectura" htmlFor="reading_minutes">
                  <Input
                    id="reading_minutes"
                    name="reading_minutes"
                    type="number"
                    min={1}
                    defaultValue={post?.reading_minutes ?? 5}
                  />
                </Field>
              </div>
            </AdminCard>

            <AdminCard title="Autoría y materia">
              <div className="space-y-5">
                <Field label="Autor" htmlFor="author_id">
                  <Select id="author_id" name="author_id" defaultValue={post?.author_id ?? ''}>
                    <option value="">Sin autor asignado</option>
                    {lawyers.map((lawyer) => (
                      <option key={lawyer.id} value={lawyer.id}>
                        {lawyer.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Área relacionada" htmlFor="area_id">
                  <Select id="area_id" name="area_id" defaultValue={post?.area_id ?? ''}>
                    <option value="">Sin área</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </AdminCard>

            <AdminCard
              title="Imagen destacada"
              description="Suba la imagen al bucket «blog» de Storage y pegue aquí su URL pública."
            >
              <div className="space-y-5">
                <Field label="URL de la imagen" htmlFor="cover_image_url">
                  <Input
                    id="cover_image_url"
                    name="cover_image_url"
                    defaultValue={post?.cover_image_url ?? ''}
                  />
                </Field>

                <Field
                  label="Tono de respaldo"
                  htmlFor="cover_tone"
                  hint="Se usa mientras no haya imagen."
                >
                  <Select id="cover_tone" name="cover_tone" defaultValue={post?.cover_tone ?? 'ink'}>
                    {TONES.map((tone) => (
                      <option key={tone} value={tone}>
                        {tone}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </AdminCard>
          </div>
        </div>
      </AdminForm>
    </>
  );
}
