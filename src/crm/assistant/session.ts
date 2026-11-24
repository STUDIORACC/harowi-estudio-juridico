import type { AssistantConfig, AssistantSession } from '../types';

/** Estado inicial de una conversación atendida por el asistente. */
export function emptySession(): AssistantSession {
  return {
    stage: 'inicio',
    asked: null,
    area: null,
    serviceSlug: null,
    urgent: false,
    data: {},
    modality: null,
    offered: [],
    chosen: null,
    lawyerId: null,
    appointmentId: null,
    prospectId: null,
    turns: 0,
    unclear: 0,
    greeted: false,
    bookingRequested: false,
  };
}

export const DEFAULT_ASSISTANT_CONFIG: AssistantConfig = {
  enabled: true,
  channels: { whatsapp: true, facebook: true, web: true },
  tone: 'formal',
  greeting:
    'Soy el asistente virtual de HAROWI Estudio Jurídico. Puedo orientarle sobre nuestros servicios y coordinar una consulta con un abogado.',
  askEmail: true,
  offerBooking: true,
  handoffOnUrgent: true,
  maxUnclear: 3,
  consultMinutes: 45,
};
