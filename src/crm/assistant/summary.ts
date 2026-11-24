import { AREAS, CHANNELS, PRIORITY_BY_ID, STAGE_BY_ID } from '../constants';
import { formatDate, formatTime12 } from '../lib/dates';
import { memberFull } from '../lib/people';
import { truncate } from '../lib/text';
import { serviceName } from '../knowledge/services';
import type { Appointment, Conversation, Member, Prospect } from '../types';

/**
 * Resumen determinista de una conversación para el abogado que la recibe.
 * Solo recompone datos ya registrados: no interpreta ni agrega valoraciones
 * jurídicas.
 */
export function buildSummary(
  conv: Conversation,
  ctx: { prospect?: Prospect | null; lawyer?: Member | null; appointment?: Appointment | null },
) {
  const { prospect, lawyer, appointment } = ctx;
  const name = prospect?.name ?? conv.ai.data.name ?? conv.contactName;
  const area = prospect?.area ?? conv.ai.area;
  const service = prospect?.serviceSlug ?? conv.ai.serviceSlug;
  const firstContactMessage = conv.messages.find((m) => m.from === 'contact')?.text ?? '';
  const reason = prospect?.description || conv.ai.data.description || firstContactMessage;

  const lines: string[] = [];
  lines.push(`${name} escribió por ${CHANNELS[conv.channel].name}.`);
  lines.push(
    area
      ? `Clasificación: ${AREAS[area].name}${service ? ` · ${serviceName(service)}` : ''}.`
      : 'Clasificación: pendiente (el tema aún no está definido).',
  );
  if (reason) lines.push(`Motivo según la persona: «${truncate(reason, 220)}»`);

  const phone = prospect?.phone || conv.ai.data.phone;
  const email = prospect?.email || conv.ai.data.email;
  const data = [phone && `teléfono ${phone}`, email && `correo ${email}`].filter(Boolean);
  if (data.length) lines.push(`Datos de contacto registrados: ${data.join(', ')}.`);

  if (prospect) {
    lines.push(`Prioridad ${PRIORITY_BY_ID[prospect.priority].label.toLowerCase()} · etapa comercial: ${STAGE_BY_ID[prospect.stage].label}.`);
  }
  if (appointment) {
    lines.push(
      `Cita: ${formatDate(appointment.date, 'weekday')} a las ${formatTime12(appointment.time)} (${appointment.modality}).`,
    );
  }
  if (conv.handoffReason) lines.push(`Motivo de la derivación: ${conv.handoffReason}`);
  if (lawyer) lines.push(`Responsable asignado: ${memberFull(lawyer)}.`);
  return lines.join(' ');
}
