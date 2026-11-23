import { notFound } from 'next/navigation';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import {
  AdminCard,
  AdminPageHeader,
  BackLink,
  ConsultationStatusBadge,
} from '@/components/admin/AdminUI';
import { AdminForm, InlineAdminForm } from '@/components/admin/AdminForm';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { Field } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { addConsultationNote, deleteConsultation, updateConsultation } from '@/app/actions/admin';
import { adminGetConsultation, adminGetConsultationNotes } from '@/lib/data/admin';
import { getSiteSettings, whatsappUrl } from '@/lib/data';
import { CONSULTATION_STATUSES } from '@/types';
import { formatDateLong } from '@/lib/utils';

export const metadata = { title: 'Detalle de consulta' };

export default async function AdminConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const consultation = await adminGetConsultation(id);
  if (!consultation) notFound();

  const [notes, settings] = await Promise.all([
    adminGetConsultationNotes(id),
    getSiteSettings(),
  ]);

  const whatsappTarget = consultation.whatsapp ?? consultation.phone;

  return (
    <>
      <BackLink href="/admin/consultas">Volver a consultas</BackLink>

      <AdminPageHeader
        title={consultation.full_name}
        description={`Consulta recibida el ${formatDateLong(consultation.created_at.slice(0, 10))} · origen: ${consultation.source}`}
        action={<ConsultationStatusBadge status={consultation.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <AdminCard title="Descripción del caso">
            <p className="whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink-soft">
              {consultation.description}
            </p>
          </AdminCard>

          <AdminCard
            title="Seguimiento"
            description="Notas internas del estudio. No son visibles para el solicitante."
          >
            <InlineAdminForm action={addConsultationNote} submitLabel="Añadir nota">
              <input type="hidden" name="consultation_id" value={consultation.id} />
              <Field label="Nueva nota" htmlFor="body" required>
                <Textarea
                  id="body"
                  name="body"
                  rows={3}
                  placeholder="Se llamó al solicitante y se coordinó una reunión…"
                />
              </Field>
            </InlineAdminForm>

            {notes.length > 0 ? (
              <ul className="mt-7 space-y-4 border-t border-line pt-6">
                {notes.map((note) => (
                  <li key={note.id} className="rounded-xl border border-line bg-paper-alt/50 p-4">
                    <p className="text-[0.875rem] leading-relaxed text-ink-soft">{note.body}</p>
                    <p className="mt-2 text-2xs text-ink-muted">
                      {note.author_name ?? 'Estudio'} ·{' '}
                      {formatDateLong(note.created_at.slice(0, 10))}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 border-t border-line pt-6 text-2xs text-ink-muted">
                Todavía no hay notas de seguimiento para esta consulta.
              </p>
            )}
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Datos de contacto">
            <dl className="space-y-4 text-[0.875rem]">
              <div>
                <dt className="text-2xs uppercase tracking-overline text-ink-muted">Teléfono</dt>
                <dd className="mt-1 flex items-center gap-2 text-ink-soft">
                  <Phone className="h-3.5 w-3.5 text-accent" aria-hidden />
                  <a href={`tel:${consultation.phone.replace(/[^\d+]/g, '')}`}>
                    {consultation.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-2xs uppercase tracking-overline text-ink-muted">Correo</dt>
                <dd className="mt-1 flex items-center gap-2 break-all text-ink-soft">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                  <a href={`mailto:${consultation.email}`}>{consultation.email}</a>
                </dd>
              </div>
              <div>
                <dt className="text-2xs uppercase tracking-overline text-ink-muted">WhatsApp</dt>
                <dd className="mt-1 flex items-center gap-2 text-ink-soft">
                  <MessageCircle className="h-3.5 w-3.5 text-accent" aria-hidden />
                  <a
                    href={whatsappUrl(
                      { ...settings, whatsapp_number: whatsappTarget.replace(/[^\d]/g, '') },
                      `Hola ${consultation.full_name}, le escribimos desde ${settings.studio_name} en relación con su consulta.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Escribir al solicitante
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-2xs uppercase tracking-overline text-ink-muted">
                  Preferencia de contacto
                </dt>
                <dd className="mt-1 capitalize text-ink-soft">{consultation.preferred_contact}</dd>
              </div>
              <div>
                <dt className="text-2xs uppercase tracking-overline text-ink-muted">Modalidad</dt>
                <dd className="mt-1 capitalize text-ink-soft">{consultation.modality}</dd>
              </div>
              <div>
                <dt className="text-2xs uppercase tracking-overline text-ink-muted">Materia</dt>
                <dd className="mt-1 text-ink-soft">
                  {consultation.area?.name ?? 'Sin área'}
                  {consultation.service ? ` · ${consultation.service.name}` : ''}
                </dd>
              </div>
            </dl>
          </AdminCard>

          <AdminCard title="Estado">
            <AdminForm
              action={updateConsultation}
              submitLabel="Actualizar estado"
              footer={
                <DeleteButton
                  action={deleteConsultation}
                  label="Eliminar consulta"
                  confirmMessage="¿Eliminar definitivamente esta consulta? La acción no se puede deshacer."
                />
              }
            >
              <input type="hidden" name="id" value={consultation.id} />
              <Field label="Estado de la consulta" htmlFor="status" required>
                <Select id="status" name="status" defaultValue={consultation.status}>
                  {CONSULTATION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </Field>
            </AdminForm>
          </AdminCard>
        </div>
      </div>
    </>
  );
}
