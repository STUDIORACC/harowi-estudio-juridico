import { ActiveBadge, AdminCard, AdminPageHeader } from '@/components/admin/AdminUI';
import { AdminForm, InlineAdminForm } from '@/components/admin/AdminForm';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Checkbox, Textarea } from '@/components/ui/Textarea';
import { deleteFaq, saveFaq } from '@/app/actions/admin';
import { adminGetFaqs } from '@/lib/data/admin';

export const metadata = { title: 'Preguntas frecuentes' };

export default async function AdminFaqPage() {
  const faqs = await adminGetFaqs();
  const categories = [...new Set(faqs.map((faq) => faq.category))];

  return (
    <>
      <AdminPageHeader
        title="Preguntas frecuentes"
        description="Se publican en /preguntas-frecuentes agrupadas por categoría y generan datos estructurados FAQPage."
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {faqs.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line bg-paper-alt/40 px-6 py-12 text-center text-[0.875rem] text-ink-muted">
              Todavía no hay preguntas registradas.
            </p>
          ) : (
            faqs.map((faq) => (
              <AdminCard key={faq.id}>
                <AdminForm
                  action={saveFaq}
                  submitLabel="Guardar"
                  footer={
                    <DeleteButton
                      action={deleteFaq}
                      label="Eliminar"
                      confirmMessage="¿Eliminar esta pregunta frecuente?"
                    />
                  }
                >
                  <input type="hidden" name="id" value={faq.id} />

                  <div className="mb-4 flex items-center justify-between gap-4">
                    <span className="text-2xs uppercase tracking-overline text-ink-muted">
                      {faq.category}
                    </span>
                    <ActiveBadge active={faq.is_active} />
                  </div>

                  <Field label="Pregunta" htmlFor={`question-${faq.id}`} required>
                    <Input id={`question-${faq.id}`} name="question" defaultValue={faq.question} required />
                  </Field>

                  <Field label="Respuesta" htmlFor={`answer-${faq.id}`} required>
                    <Textarea
                      id={`answer-${faq.id}`}
                      name="answer"
                      rows={4}
                      defaultValue={faq.answer}
                      required
                    />
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                    <Field label="Categoría" htmlFor={`category-${faq.id}`}>
                      <Input
                        id={`category-${faq.id}`}
                        name="category"
                        defaultValue={faq.category}
                        list="faq-categorias"
                      />
                    </Field>

                    <Field label="Orden" htmlFor={`sort-${faq.id}`}>
                      <Input
                        id={`sort-${faq.id}`}
                        name="sort_order"
                        type="number"
                        defaultValue={faq.sort_order}
                        className="sm:w-24"
                      />
                    </Field>

                    <Checkbox
                      id={`active-${faq.id}`}
                      name="is_active"
                      defaultChecked={faq.is_active}
                      label="Activa"
                    />
                  </div>
                </AdminForm>
              </AdminCard>
            ))
          )}
        </div>

        <div>
          <AdminCard title="Nueva pregunta" className="xl:sticky xl:top-8">
            <InlineAdminForm action={saveFaq} submitLabel="Añadir pregunta">
              <Field label="Pregunta" htmlFor="new_question" required>
                <Input id="new_question" name="question" required />
              </Field>

              <Field label="Respuesta" htmlFor="new_answer" required>
                <Textarea id="new_answer" name="answer" rows={5} required />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Categoría" htmlFor="new_category">
                  <Input
                    id="new_category"
                    name="category"
                    defaultValue="General"
                    list="faq-categorias"
                  />
                </Field>

                <Field label="Orden" htmlFor="new_sort">
                  <Input
                    id="new_sort"
                    name="sort_order"
                    type="number"
                    defaultValue={faqs.length + 1}
                  />
                </Field>
              </div>

              <Checkbox id="new_active" name="is_active" defaultChecked label="Activa" />
            </InlineAdminForm>
          </AdminCard>
        </div>
      </div>

      <datalist id="faq-categorias">
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>
    </>
  );
}
