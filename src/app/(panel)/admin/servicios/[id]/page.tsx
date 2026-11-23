import { notFound } from 'next/navigation';
import { AdminCard, AdminPageHeader, BackLink } from '@/components/admin/AdminUI';
import { AdminForm, InlineAdminForm } from '@/components/admin/AdminForm';
import { DeleteButton, DeleteForm } from '@/components/admin/DeleteButton';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox, Textarea } from '@/components/ui/Textarea';
import { deleteService, deleteServiceFaq, saveService, saveServiceFaq } from '@/app/actions/admin';
import { adminGetAreas, adminGetServices } from '@/lib/data/admin';
import { getServiceFaqs } from '@/lib/data';
import { blocksToText, stepsToText } from '@/lib/forms/parse';

export const metadata = { title: 'Servicio' };

export default async function AdminServiceFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === 'nuevo';

  const [services, areas] = await Promise.all([adminGetServices(), adminGetAreas()]);
  const service = isNew ? null : services.find((item) => item.id === id);
  if (!isNew && !service) notFound();

  const faqs = service ? await getServiceFaqs(service.id) : [];

  return (
    <>
      <BackLink href="/admin/servicios">Volver a servicios</BackLink>

      <AdminPageHeader
        title={isNew ? 'Nuevo servicio' : (service?.name ?? '')}
        description={
          isNew
            ? 'Cada servicio genera una página pública con su propia URL y datos estructurados.'
            : `Página pública: /areas/${service?.slug}`
        }
      />

      <AdminForm
        action={saveService}
        submitLabel={isNew ? 'Crear servicio' : 'Guardar cambios'}
        footer={
          service ? (
            <DeleteButton
              action={deleteService}
              label="Eliminar servicio"
              confirmMessage="¿Eliminar este servicio? Su página pública dejará de existir."
            />
          ) : undefined
        }
      >
        {service ? <input type="hidden" name="id" value={service.id} /> : null}

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <AdminCard title="Identificación">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nombre del servicio" htmlFor="name" required>
                  <Input id="name" name="name" defaultValue={service?.name ?? ''} required />
                </Field>

                <Field label="Área" htmlFor="area_id" required>
                  <Select id="area_id" name="area_id" defaultValue={service?.area_id ?? ''} required>
                    <option value="">Seleccione un área</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Slug" htmlFor="slug" hint="Define la URL: /areas/slug">
                  <Input id="slug" name="slug" defaultValue={service?.slug ?? ''} />
                </Field>

                <Field label="Orden dentro del área" htmlFor="sort_order">
                  <Input
                    id="sort_order"
                    name="sort_order"
                    type="number"
                    defaultValue={service?.sort_order ?? 0}
                  />
                </Field>
              </div>

              <Field
                label="Descripción corta"
                htmlFor="short_description"
                className="mt-5"
                hint="Aparece en las tarjetas y en la cabecera de la página."
              >
                <Textarea
                  id="short_description"
                  name="short_description"
                  rows={2}
                  defaultValue={service?.short_description ?? ''}
                />
              </Field>
            </AdminCard>

            <AdminCard
              title="Explicación"
              description="Texto principal de la página. Un párrafo por línea."
            >
              <Field label="Descripción" htmlFor="description">
                <Textarea
                  id="description"
                  name="description"
                  rows={8}
                  defaultValue={(service?.description ?? []).join('\n')}
                />
              </Field>
            </AdminCard>

            <AdminCard title="Situaciones y proceso">
              <Field
                label="Cuándo puede requerirse"
                htmlFor="when_needed"
                hint="Una situación por línea."
              >
                <Textarea
                  id="when_needed"
                  name="when_needed"
                  rows={6}
                  defaultValue={(service?.when_needed ?? []).join('\n')}
                />
              </Field>

              <Field
                label="Proceso general"
                htmlFor="process"
                className="mt-5"
                hint="Un paso por línea, con el formato «Título | Descripción». La numeración es automática."
              >
                <Textarea
                  id="process"
                  name="process"
                  rows={6}
                  defaultValue={stepsToText(service?.process ?? [])}
                  placeholder="Evaluación del caso | Revisamos la documentación disponible…"
                />
              </Field>

              <Field
                label="Documentación orientativa"
                htmlFor="documents"
                className="mt-5"
                hint="Un documento por línea."
              >
                <Textarea
                  id="documents"
                  name="documents"
                  rows={6}
                  defaultValue={(service?.documents ?? []).join('\n')}
                />
              </Field>
            </AdminCard>

            <AdminCard
              title="Contenido adicional"
              description="Texto libre al final de la página. Prefijos: ## encabezado · ### subencabezado · - lista · > cita · ! aviso"
            >
              <Field label="Contenido" htmlFor="content">
                <Textarea
                  id="content"
                  name="content"
                  rows={10}
                  defaultValue={blocksToText(service?.content ?? [])}
                />
              </Field>
            </AdminCard>
          </div>

          <div className="space-y-6">
            <AdminCard title="Publicación">
              <div className="space-y-5">
                <Checkbox
                  id="is_active"
                  name="is_active"
                  defaultChecked={service?.is_active ?? true}
                  label="Visible en el sitio público"
                />

                <Field
                  label="Imagen del servicio"
                  htmlFor="image_url"
                  hint="URL pública del bucket «services» de Storage."
                >
                  <Input id="image_url" name="image_url" defaultValue={service?.image_url ?? ''} />
                </Field>
              </div>
            </AdminCard>

            <AdminCard title="SEO">
              <div className="space-y-5">
                <Field label="Título SEO" htmlFor="seo_title">
                  <Input id="seo_title" name="seo_title" defaultValue={service?.seo_title ?? ''} />
                </Field>
                <Field label="Descripción SEO" htmlFor="seo_description">
                  <Textarea
                    id="seo_description"
                    name="seo_description"
                    rows={3}
                    defaultValue={service?.seo_description ?? ''}
                  />
                </Field>
              </div>
            </AdminCard>
          </div>
        </div>
      </AdminForm>

      {/* ------------------------ Preguntas frecuentes -------------------------- */}
      {service ? (
        <section className="mt-6">
          <AdminCard
            title="Preguntas frecuentes del servicio"
            description="Se publican en la página del servicio y generan datos estructurados FAQPage."
          >
            {faqs.length > 0 ? (
              <ul className="mb-7 space-y-3">
                {faqs.map((faq) => (
                  <li
                    key={faq.id}
                    className="flex items-start justify-between gap-5 rounded-xl border border-line bg-paper-alt/50 p-4"
                  >
                    <div>
                      <p className="text-[0.9375rem] text-ink">{faq.question}</p>
                      <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-soft">
                        {faq.answer}
                      </p>
                    </div>
                    <DeleteForm
                      action={deleteServiceFaq}
                      id={faq.id}
                      label=""
                      confirmMessage="¿Eliminar esta pregunta?"
                      extra={{ service_id: service.id }}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-7 text-2xs text-ink-muted">
                Este servicio todavía no tiene preguntas frecuentes.
              </p>
            )}

            <InlineAdminForm
              action={saveServiceFaq}
              submitLabel="Añadir pregunta"
              className="border-t border-line pt-6"
            >
              <input type="hidden" name="service_id" value={service.id} />
              <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
                <Field label="Pregunta" htmlFor="question" required>
                  <Input id="question" name="question" required />
                </Field>
                <Field label="Orden" htmlFor="faq_sort_order">
                  <Input
                    id="faq_sort_order"
                    name="sort_order"
                    type="number"
                    defaultValue={faqs.length + 1}
                    className="sm:w-24"
                  />
                </Field>
              </div>
              <Field label="Respuesta" htmlFor="answer" required>
                <Textarea id="answer" name="answer" rows={4} required />
              </Field>
            </InlineAdminForm>
          </AdminCard>
        </section>
      ) : null}
    </>
  );
}
