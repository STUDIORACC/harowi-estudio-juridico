import { respond } from '../assistant/engine';
import { STATE_VERSION, STORAGE_KEY } from '../constants';
import type { CrmState } from '../types';
import type {
  AssistantProvider,
  CalendarAdapter,
  CrmRepository,
  MessagingAdapter,
  OutboundMessage,
  SendResult,
} from './types';

/**
 * Simuladores locales de cada integración. No salen a ninguna red.
 */

/** Asistente de reglas: no usa ninguna API externa. */
export const ruleBasedAssistant: AssistantProvider = {
  id: 'rule-based',
  label: 'Asistente de reglas (demostración)',
  mode: 'demo',
  async respond(input) {
    return respond(input);
  },
};

const simulatedSend = (label: string) => async (message: OutboundMessage): Promise<SendResult> => ({
  ok: true,
  simulated: true,
  detail: `Envío simulado por ${label} a ${message.to}. No se transmitió ningún mensaje real.`,
});

export const demoWhatsApp: MessagingAdapter = {
  channel: 'whatsapp',
  label: 'WhatsApp Cloud API (simulado)',
  mode: 'demo',
  send: simulatedSend('WhatsApp'),
};

export const demoMessenger: MessagingAdapter = {
  channel: 'facebook',
  label: 'Facebook Messenger (simulado)',
  mode: 'demo',
  send: simulatedSend('Messenger'),
};

export const demoWebChat: MessagingAdapter = {
  channel: 'web',
  label: 'Chat web (simulado)',
  mode: 'demo',
  send: simulatedSend('el chat web'),
};

/** Google Calendar no está conectado: la agenda del CRM es la única fuente de verdad. */
export const pendingGoogleCalendar: CalendarAdapter = {
  id: 'google-calendar',
  label: 'Google Calendar',
  mode: 'demo',
  connected: false,
  async syncAppointment() {
    return { synced: false, detail: 'Google Calendar no está conectado en esta versión.' };
  },
};

/** Persistencia en el navegador. Sustituir por Supabase en producción. */
export const localRepository: CrmRepository = {
  id: 'local-storage',
  label: 'localStorage del navegador',
  mode: 'demo',
  load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { state?: CrmState; dirty?: boolean };
      if (!parsed.state || parsed.state.version !== STATE_VERSION) return null;
      return { state: parsed.state, dirty: Boolean(parsed.dirty) };
    } catch {
      return null;
    }
  },
  save(state, dirty) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, dirty }));
    } catch {
      // Cuota agotada o almacenamiento bloqueado: la demo sigue funcionando en memoria.
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* sin acción */
    }
  },
};
