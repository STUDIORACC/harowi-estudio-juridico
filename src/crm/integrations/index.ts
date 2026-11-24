import type { ChannelId } from '../types';
import {
  demoMessenger,
  demoWebChat,
  demoWhatsApp,
  localRepository,
  pendingGoogleCalendar,
  ruleBasedAssistant,
} from './demo';
import type {
  AssistantProvider,
  CalendarAdapter,
  CrmRepository,
  IntegrationCard,
  MessagingAdapter,
} from './types';

export * from './types';

/**
 * REGISTRO DE INTEGRACIONES
 * Único lugar donde se decide qué implementación usa el CRM. Para conectar un
 * servicio real: implementar la interfaz de `types.ts` y reemplazar aquí el
 * simulador.
 */
export const integrations: {
  assistant: AssistantProvider;
  messaging: Record<ChannelId, MessagingAdapter>;
  calendar: CalendarAdapter;
  repository: CrmRepository;
} = {
  assistant: ruleBasedAssistant,
  messaging: { whatsapp: demoWhatsApp, facebook: demoMessenger, web: demoWebChat },
  calendar: pendingGoogleCalendar,
  repository: localRepository,
};

/** Tarjetas del panel de Configuración → Integraciones. */
export const INTEGRATION_CARDS: IntegrationCard[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Cloud API',
    status: 'Modo demostración',
    purpose: 'Recibir y enviar mensajes de WhatsApp del estudio dentro de la bandeja de conversaciones.',
    demoBehavior: 'Las conversaciones y las respuestas son simuladas: ningún mensaje sale a WhatsApp.',
    requirements: [
      'Cuenta de WhatsApp Business verificada en Meta',
      'Número de teléfono y token permanente de la Cloud API',
      'Webhook público para recibir mensajes y plantillas aprobadas',
    ],
    adapter: 'integrations/demo.ts → demoWhatsApp (interfaz MessagingAdapter)',
  },
  {
    id: 'messenger',
    name: 'Facebook Messenger',
    status: 'Modo demostración',
    purpose: 'Centralizar los mensajes de la página de Facebook del estudio en la misma bandeja.',
    demoBehavior: 'Conversaciones de ejemplo y envío simulado; no hay conexión con la página.',
    requirements: [
      'Página de Facebook del estudio y aplicación de Meta aprobada',
      'Permisos de mensajería (pages_messaging) y token de página',
      'Webhook público para los mensajes entrantes',
    ],
    adapter: 'integrations/demo.ts → demoMessenger (interfaz MessagingAdapter)',
  },
  {
    id: 'lead-ads',
    name: 'Facebook Lead Ads',
    status: 'Pendiente de conectar',
    purpose: 'Convertir automáticamente los formularios de anuncios de Facebook en prospectos del CRM.',
    demoBehavior: 'No disponible en la demo. El alta de prospectos se hace desde el CRM o el asistente.',
    requirements: [
      'Campañas de Lead Ads activas y acceso al administrador de anuncios',
      'Permiso leads_retrieval y suscripción al webhook de formularios',
      'Mapeo de campos del formulario al prospecto',
    ],
    adapter: 'Por implementar: alta de prospectos desde el webhook de leadgen',
  },
  {
    id: 'openai',
    name: 'OpenAI API',
    status: 'Pendiente de conectar',
    purpose: 'Reemplazar el asistente de reglas por un modelo de lenguaje con la base de conocimiento aprobada del estudio.',
    demoBehavior: 'El asistente usa reglas y flujos controlados locales; no consulta ningún modelo externo.',
    requirements: [
      'Clave de API de OpenAI guardada solo en el servidor',
      'Instrucciones de sistema con las reglas de conducta del estudio',
      'Revisión de privacidad: qué datos del cliente pueden enviarse al proveedor',
    ],
    adapter: 'integrations/types.ts → AssistantProvider (misma entrada y salida que el asistente actual)',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    status: 'Pendiente de conectar',
    purpose: 'Sincronizar las citas y audiencias de la agenda con los calendarios de cada abogado.',
    demoBehavior: 'La agenda del CRM es la única fuente de verdad. El adaptador existe pero no está conectado.',
    requirements: [
      'Proyecto en Google Cloud con la API de Calendar habilitada',
      'Credenciales OAuth del estudio y consentimiento de cada abogado',
      'Definir qué datos de la cita se publican en el calendario (reserva)',
    ],
    adapter: 'integrations/demo.ts → pendingGoogleCalendar (interfaz CalendarAdapter)',
  },
  {
    id: 'supabase',
    name: 'Base de datos Supabase',
    status: 'Pendiente de conectar',
    purpose: 'Guardar prospectos, clientes, expedientes y conversaciones en PostgreSQL, con usuarios y permisos reales.',
    demoBehavior: 'Los datos viven en el navegador (localStorage). Se pierden si se borra el almacenamiento.',
    requirements: [
      'Proyecto de Supabase con las tablas del CRM y políticas RLS por rol',
      'Autenticación de usuarios del estudio (abogados y coordinación)',
      'Almacenamiento privado (Storage) para documentos, sin enlaces públicos',
    ],
    adapter: 'integrations/types.ts → CrmRepository (hoy localStorage)',
  },
];
