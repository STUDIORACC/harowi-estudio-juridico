import type {
  AppointmentKind,
  AppointmentStatus,
  AreaId,
  CaseStatus,
  ChannelId,
  ConversationStatus,
  Priority,
  StageId,
  TaskStatus,
  TimelineKind,
} from './types';

/**
 * Tonos semánticos de las etiquetas. La paleta visual de cada tono vive en
 * `components/crm/ui/Badge.tsx`; aquí solo se elige el tono por significado.
 */
export type Tone = 'neutral' | 'blue' | 'navy' | 'green' | 'amber' | 'red' | 'violet' | 'slate';

/* ---------------------------------- Áreas --------------------------------- */

export interface AreaMeta {
  id: AreaId;
  name: string;
  short: string;
  /** Color de serie en gráficos (paleta validada: ver docs/CRM.md). */
  color: string;
  tone: Tone;
}

export const AREAS: Record<AreaId, AreaMeta> = {
  familia: { id: 'familia', name: 'Derecho de Familia', short: 'Familia', color: '#2a78d6', tone: 'blue' },
  penal: { id: 'penal', name: 'Derecho Penal', short: 'Penal', color: '#eb6834', tone: 'red' },
  civil: { id: 'civil', name: 'Derecho Civil y Patrimonial', short: 'Civil', color: '#1baf7a', tone: 'green' },
  empresarial: { id: 'empresarial', name: 'Derecho Empresarial', short: 'Empresarial', color: '#6250d6', tone: 'violet' },
};
export const AREA_LIST: AreaMeta[] = Object.values(AREAS);
export const AREA_IDS = Object.keys(AREAS) as AreaId[];

/* --------------------------------- Canales -------------------------------- */

export interface ChannelMeta {
  id: ChannelId;
  name: string;
  color: string;
}

export const CHANNELS: Record<ChannelId, ChannelMeta> = {
  whatsapp: { id: 'whatsapp', name: 'WhatsApp', color: '#008300' },
  facebook: { id: 'facebook', name: 'Facebook Messenger', color: '#2a78d6' },
  web: { id: 'web', name: 'Web', color: '#e87ba4' },
};
export const CHANNEL_LIST: ChannelMeta[] = Object.values(CHANNELS);

/* -------------------------------- Prospectos ------------------------------ */

export interface StageMeta {
  id: StageId;
  label: string;
  tone: Tone;
  description: string;
}

export const STAGES: StageMeta[] = [
  { id: 'nuevo', label: 'Nuevo', tone: 'slate', description: 'Consulta recién recibida, sin atender.' },
  { id: 'en_atencion', label: 'En atención', tone: 'blue', description: 'Se está conversando con la persona.' },
  { id: 'calificado', label: 'Calificado', tone: 'navy', description: 'Área y necesidad identificadas.' },
  { id: 'cita_programada', label: 'Cita programada', tone: 'violet', description: 'Tiene una consulta agendada.' },
  { id: 'evaluacion', label: 'Evaluación jurídica', tone: 'amber', description: 'El abogado evalúa el caso.' },
  { id: 'propuesta', label: 'Propuesta enviada', tone: 'amber', description: 'Se envió la propuesta de servicios.' },
  { id: 'contratado', label: 'Cliente contratado', tone: 'green', description: 'Aceptó la propuesta.' },
  { id: 'cerrado', label: 'Cerrado', tone: 'neutral', description: 'No se concretó el servicio.' },
];
export const STAGE_BY_ID = Object.fromEntries(STAGES.map((s) => [s.id, s])) as Record<StageId, StageMeta>;
/** Etapas en las que el prospecto sigue siendo una oportunidad abierta. */
export const OPEN_STAGES: StageId[] = ['nuevo', 'en_atencion', 'calificado', 'cita_programada', 'evaluacion', 'propuesta'];

export const PRIORITIES: { id: Priority; label: string; tone: Tone; rank: number }[] = [
  { id: 'baja', label: 'Baja', tone: 'neutral', rank: 1 },
  { id: 'media', label: 'Media', tone: 'blue', rank: 2 },
  { id: 'alta', label: 'Alta', tone: 'amber', rank: 3 },
  { id: 'urgente', label: 'Urgente', tone: 'red', rank: 4 },
];
export const PRIORITY_BY_ID = Object.fromEntries(PRIORITIES.map((p) => [p.id, p])) as Record<
  Priority,
  (typeof PRIORITIES)[number]
>;

/* -------------------------------- Expedientes ----------------------------- */

export const CASE_STATUSES: { id: CaseStatus; label: string; tone: Tone }[] = [
  { id: 'nuevo', label: 'Nuevo', tone: 'slate' },
  { id: 'evaluacion', label: 'En evaluación', tone: 'amber' },
  { id: 'tramite', label: 'En trámite', tone: 'blue' },
  { id: 'audiencia', label: 'Audiencia programada', tone: 'violet' },
  { id: 'pendiente_doc', label: 'Pendiente de documentación', tone: 'red' },
  { id: 'resuelto', label: 'Resuelto', tone: 'green' },
  { id: 'archivado', label: 'Archivado', tone: 'neutral' },
];
export const CASE_STATUS_BY_ID = Object.fromEntries(CASE_STATUSES.map((s) => [s.id, s])) as Record<
  CaseStatus,
  (typeof CASE_STATUSES)[number]
>;
export const ACTIVE_CASE_STATUSES: CaseStatus[] = ['nuevo', 'evaluacion', 'tramite', 'audiencia', 'pendiente_doc'];

export const TIMELINE_KINDS: Record<TimelineKind, { label: string; tone: Tone }> = {
  apertura: { label: 'Apertura', tone: 'navy' },
  escrito: { label: 'Escrito', tone: 'blue' },
  audiencia: { label: 'Audiencia', tone: 'violet' },
  resolucion: { label: 'Resolución', tone: 'green' },
  notificacion: { label: 'Notificación', tone: 'amber' },
  documento: { label: 'Documento', tone: 'slate' },
  reunion: { label: 'Reunión', tone: 'blue' },
  nota: { label: 'Nota', tone: 'neutral' },
};

/* ----------------------------------- Citas -------------------------------- */

export const APPOINTMENT_STATUSES: { id: AppointmentStatus; label: string; tone: Tone }[] = [
  { id: 'pendiente', label: 'Pendiente', tone: 'amber' },
  { id: 'confirmada', label: 'Confirmada', tone: 'blue' },
  { id: 'atendida', label: 'Atendida', tone: 'green' },
  { id: 'cancelada', label: 'Cancelada', tone: 'neutral' },
  { id: 'no_asistio', label: 'No asistió', tone: 'red' },
];
export const APPOINTMENT_STATUS_BY_ID = Object.fromEntries(APPOINTMENT_STATUSES.map((s) => [s.id, s])) as Record<
  AppointmentStatus,
  (typeof APPOINTMENT_STATUSES)[number]
>;

export const APPOINTMENT_KINDS: { id: AppointmentKind; label: string; defaultMinutes: number }[] = [
  { id: 'consulta_inicial', label: 'Consulta inicial', defaultMinutes: 45 },
  { id: 'seguimiento', label: 'Seguimiento de caso', defaultMinutes: 30 },
  { id: 'revision_documentos', label: 'Revisión de documentos', defaultMinutes: 45 },
  { id: 'estrategia', label: 'Reunión de estrategia', defaultMinutes: 60 },
  { id: 'firma', label: 'Firma y entrega de documentos', defaultMinutes: 30 },
  { id: 'audiencia', label: 'Audiencia', defaultMinutes: 90 },
];
export const APPOINTMENT_KIND_BY_ID = Object.fromEntries(APPOINTMENT_KINDS.map((k) => [k.id, k])) as Record<
  AppointmentKind,
  (typeof APPOINTMENT_KINDS)[number]
>;
/** Las citas que ocupan agenda (las canceladas liberan el horario). */
export const BLOCKING_STATUSES: AppointmentStatus[] = ['pendiente', 'confirmada', 'atendida', 'no_asistio'];

/* ------------------------------- Conversaciones --------------------------- */

export const CONVERSATION_STATUSES: { id: ConversationStatus; label: string; tone: Tone }[] = [
  { id: 'nuevo', label: 'Nuevo', tone: 'blue' },
  { id: 'ia', label: 'IA atendiendo', tone: 'violet' },
  { id: 'abogado', label: 'Requiere abogado', tone: 'amber' },
  { id: 'finalizado', label: 'Finalizado', tone: 'neutral' },
];
export const CONVERSATION_STATUS_BY_ID = Object.fromEntries(CONVERSATION_STATUSES.map((s) => [s.id, s])) as Record<
  ConversationStatus,
  (typeof CONVERSATION_STATUSES)[number]
>;

/* ---------------------------------- Tareas -------------------------------- */

export const TASK_STATUSES: { id: TaskStatus; label: string; tone: Tone }[] = [
  { id: 'pendiente', label: 'Pendiente', tone: 'amber' },
  { id: 'en_curso', label: 'En curso', tone: 'blue' },
  { id: 'completada', label: 'Completada', tone: 'green' },
];
export const TASK_STATUS_BY_ID = Object.fromEntries(TASK_STATUSES.map((s) => [s.id, s])) as Record<
  TaskStatus,
  (typeof TASK_STATUSES)[number]
>;

/* -------------------------------- Documentos ------------------------------ */

export const DEFAULT_DOCUMENT_CATEGORIES = [
  'Identidad',
  'Escritos',
  'Pruebas',
  'Resoluciones',
  'Contratos',
  'Comprobantes',
];

export const STORAGE_KEY = 'harowi-legal-crm:v1';
export const STATE_VERSION = 2;
