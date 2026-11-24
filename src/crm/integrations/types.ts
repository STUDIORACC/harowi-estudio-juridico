import type { AssistantInput, AssistantOutput } from '../assistant/engine';
import type { Appointment, ChannelId, CrmState } from '../types';

/**
 * ---------------------------------------------------------------------------
 * CONTRATOS DE INTEGRACIÓN
 * ---------------------------------------------------------------------------
 * El CRM nunca habla con WhatsApp, Facebook, OpenAI, Google Calendar ni
 * Supabase directamente: lo hace a través de estas interfaces. En la demo cada
 * una tiene un simulador local (`demo.ts`). Para pasar a producción se
 * implementa la interfaz con el servicio real y se registra en `index.ts`;
 * el resto del sistema no cambia.
 * ---------------------------------------------------------------------------
 */

export type IntegrationMode = 'demo' | 'live';

/** Cerebro conversacional. Producción: modelo de lenguaje (p. ej. OpenAI) con la base de conocimiento aprobada. */
export interface AssistantProvider {
  id: string;
  label: string;
  mode: IntegrationMode;
  respond(input: AssistantInput): Promise<AssistantOutput>;
}

export interface OutboundMessage {
  conversationId: string;
  to: string;
  text: string;
  attachments?: { name: string; sizeKb: number }[];
}

export interface SendResult {
  ok: boolean;
  /** `true` cuando el envío fue simulado y no salió a ninguna red. */
  simulated: boolean;
  detail: string;
}

/** Canal de mensajería. Producción: WhatsApp Cloud API, Messenger Send API, widget web. */
export interface MessagingAdapter {
  channel: ChannelId;
  label: string;
  mode: IntegrationMode;
  send(message: OutboundMessage): Promise<SendResult>;
}

export interface CalendarSyncResult {
  synced: boolean;
  detail: string;
}

/** Calendario externo. Producción: Google Calendar API (OAuth del estudio). */
export interface CalendarAdapter {
  id: string;
  label: string;
  mode: IntegrationMode;
  connected: boolean;
  syncAppointment(appointment: Appointment): Promise<CalendarSyncResult>;
}

/** Persistencia. Producción: Supabase (PostgreSQL). La demo usa localStorage del navegador. */
export interface CrmRepository {
  id: string;
  label: string;
  mode: IntegrationMode;
  load(): CrmState | { state: CrmState; dirty: boolean } | null;
  save(state: CrmState, dirty: boolean): void;
  clear(): void;
}

export type IntegrationStatus = 'Modo demostración' | 'Pendiente de conectar';

export interface IntegrationCard {
  id: string;
  name: string;
  status: IntegrationStatus;
  purpose: string;
  /** Lo que hace la demo en su lugar. */
  demoBehavior: string;
  /** Lo que se necesita para conectarla de verdad. */
  requirements: string[];
  adapter: string;
}
