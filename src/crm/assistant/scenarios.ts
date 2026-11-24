import type { ChannelId } from '../types';

/**
 * Guiones de los dos escenarios de demostración. Cada línea es un mensaje del
 * cliente que se envía con el botón «Siguiente mensaje del cliente»; el
 * asistente responde con el motor real. También pueden escribirse mensajes
 * libres en cualquier momento.
 */
export interface Scenario {
  id: 'alimentos' | 'penal';
  title: string;
  summary: string;
  channel: ChannelId;
  contactName: string;
  handle: string;
  lines: string[];
}

export const SCENARIOS: Record<Scenario['id'], Scenario> = {
  alimentos: {
    id: 'alimentos',
    title: 'Demanda de alimentos → cita agendada',
    summary:
      'Una madre consulta por WhatsApp. El asistente identifica Derecho de Familia, recopila datos, crea el prospecto, ofrece horarios y registra la cita en la agenda.',
    channel: 'whatsapp',
    contactName: 'Mariela Quispe',
    handle: '+51 900 000 301',
    lines: [
      'Hola, buenas tardes. Necesito demandar por alimentos para mi hijo, su papá no pasa nada desde hace meses.',
      'Mariela Quispe Ramos',
      'Sí, este mismo número está bien',
      'mariela.quispe@example.com',
      'Sí, quisiera una cita lo antes posible',
      'Virtual, por favor',
      'La opción 2',
    ],
  },
  penal: {
    id: 'penal',
    title: 'Defensa penal urgente → derivación inmediata',
    summary:
      'Un familiar reporta una detención. El asistente deja de preguntar, marca la conversación como urgente, crea el prospecto, asigna al abogado de guardia y detiene la atención automática.',
    channel: 'whatsapp',
    contactName: 'Daniel Torres',
    handle: '+51 900 000 302',
    lines: [
      'Buenas noches, mi hermano acaba de ser detenido por la policía y necesito un abogado penalista urgente',
      'Se llama Jorge Torres, lo tienen en la comisaría de San Isidro',
    ],
  },
};
