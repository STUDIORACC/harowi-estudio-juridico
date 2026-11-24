/**
 * ---------------------------------------------------------------------------
 * HAROWI LEGAL CRM — MODELO DE DOMINIO
 * ---------------------------------------------------------------------------
 * Tipos de todas las entidades del CRM. Reflejan el modelo que más adelante
 * pasará a Supabase (una tabla por entidad); por eso las relaciones se
 * expresan solo con identificadores y las fechas son cadenas ISO locales:
 *   - fecha:      `YYYY-MM-DD`
 *   - fecha-hora: `YYYY-MM-DDTHH:mm`  (hora local de Lima, sin zona)
 * ---------------------------------------------------------------------------
 */

export type AreaId = 'familia' | 'penal' | 'civil' | 'empresarial';
export type ChannelId = 'whatsapp' | 'facebook' | 'web';
export type Priority = 'baja' | 'media' | 'alta' | 'urgente';

/* --------------------------------- Equipo --------------------------------- */

export interface AvailabilityRule {
  /** 1 = lunes … 6 = sábado. */
  weekday: number;
  start: string; // HH:mm
  end: string; // HH:mm
}

export interface Member {
  id: string;
  name: string;
  /** Tratamiento abreviado: «Dra.», «Dr.», «Sra.». */
  title: string;
  role: string;
  kind: 'abogado' | 'coordinacion';
  areas: AreaId[];
  email: string;
  phone: string;
  availability: AvailabilityRule[];
}

/* ------------------------------- Prospectos ------------------------------- */

export type StageId =
  | 'nuevo'
  | 'en_atencion'
  | 'calificado'
  | 'cita_programada'
  | 'evaluacion'
  | 'propuesta'
  | 'contratado'
  | 'cerrado';

export type HistoryKind =
  | 'creacion'
  | 'estado'
  | 'conversacion'
  | 'clasificacion'
  | 'cita'
  | 'derivacion'
  | 'nota'
  | 'tarea';

export interface HistoryEntry {
  id: string;
  at: string;
  kind: HistoryKind;
  text: string;
  by: string;
}

export interface Prospect {
  id: string;
  name: string;
  phone: string;
  email: string;
  channel: ChannelId;
  /** `null` mientras la consulta no esté clasificada («Por clasificar»). */
  area: AreaId | null;
  serviceSlug: string | null;
  description: string;
  priority: Priority;
  stage: StageId;
  lawyerId: string | null;
  contactDate: string;
  nextAction: string;
  nextActionDate: string | null;
  clientId: string | null;
  closedReason: string | null;
  createdAt: string;
  history: HistoryEntry[];
}

/* -------------------------------- Clientes -------------------------------- */

export interface Client {
  id: string;
  name: string;
  kind: 'persona' | 'empresa';
  docType: 'DNI' | 'CE' | 'RUC';
  docNumber: string;
  phone: string;
  email: string;
  district: string;
  lawyerId: string;
  status: 'activo' | 'inactivo';
  since: string;
  prospectId: string | null;
  notes: string;
}

/* ------------------------------- Expedientes ------------------------------ */

export type CaseStatus =
  | 'nuevo'
  | 'evaluacion'
  | 'tramite'
  | 'audiencia'
  | 'pendiente_doc'
  | 'resuelto'
  | 'archivado';

export type TimelineKind =
  | 'apertura'
  | 'escrito'
  | 'audiencia'
  | 'resolucion'
  | 'notificacion'
  | 'documento'
  | 'reunion'
  | 'nota';

export interface TimelineEvent {
  id: string;
  date: string;
  kind: TimelineKind;
  title: string;
  detail: string;
  by: string;
}

/**
 * Plazo o vencimiento. SIEMPRE lo ingresa o lo verifica el abogado
 * responsable: el sistema no calcula ni confirma plazos legales.
 */
export interface Deadline {
  id: string;
  title: string;
  dueDate: string;
  setBy: string;
  verified: boolean;
  note: string;
  done: boolean;
}

export interface InternalNote {
  id: string;
  at: string;
  by: string;
  text: string;
}

export interface CaseFile {
  id: string;
  code: string;
  clientId: string;
  area: AreaId;
  serviceSlug: string;
  procedure: string;
  lawyerId: string;
  counterparty: string;
  courtFileNumber: string | null;
  court: string | null;
  status: CaseStatus;
  openedAt: string;
  description: string;
  timeline: TimelineEvent[];
  deadlines: Deadline[];
  notes: InternalNote[];
}

/* ---------------------------------- Citas --------------------------------- */

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'atendida' | 'cancelada' | 'no_asistio';
export type AppointmentKind =
  | 'consulta_inicial'
  | 'seguimiento'
  | 'revision_documentos'
  | 'estrategia'
  | 'firma'
  | 'audiencia';
export type Modality = 'presencial' | 'virtual';

export interface Appointment {
  id: string;
  kind: AppointmentKind;
  prospectId: string | null;
  clientId: string | null;
  caseId: string | null;
  lawyerId: string;
  area: AreaId;
  serviceSlug: string | null;
  date: string;
  time: string;
  durationMin: number;
  modality: Modality;
  status: AppointmentStatus;
  notes: string;
  source: 'manual' | 'asistente' | 'web';
  reminderWhatsapp: boolean;
  reminderEmail: boolean;
  createdAt: string;
}

/* ----------------------------- Conversaciones ----------------------------- */

export type ConversationStatus = 'nuevo' | 'ia' | 'abogado' | 'finalizado';
export type ConversationPriority = 'normal' | 'alta' | 'urgente';

export interface Attachment {
  name: string;
  sizeKb: number;
  ext: string;
}

export type MessageAuthor = 'contact' | 'assistant' | 'agent' | 'system' | 'note';

export interface Message {
  id: string;
  from: MessageAuthor;
  authorId: string | null;
  text: string;
  at: string;
  attachments?: Attachment[];
  /** Tarjeta enriquecida (p. ej. confirmación de cita). */
  card?: { kind: 'booking'; appointmentId: string } | { kind: 'handoff' };
}

export interface SlotOffer {
  date: string;
  time: string;
  lawyerId: string;
}

export type AssistantStage =
  | 'inicio'
  | 'identificando'
  | 'informando'
  | 'datos'
  | 'modalidad'
  | 'horarios'
  | 'confirmando'
  | 'reservado'
  | 'derivado'
  | 'cerrado';

export type PendingQuestion =
  | 'need'
  | 'clarify_service'
  | 'name'
  | 'phone'
  | 'phone_confirm'
  | 'email'
  | 'description'
  | 'want_booking'
  | 'modality'
  | 'slot'
  | 'confirm'
  | 'reschedule_slot'
  | 'offer_human'
  | null;

export interface AssistantSession {
  stage: AssistantStage;
  asked: PendingQuestion;
  area: AreaId | null;
  serviceSlug: string | null;
  urgent: boolean;
  data: {
    name?: string;
    phone?: string;
    email?: string;
    emailSkipped?: boolean;
    description?: string;
  };
  modality: Modality | null;
  offered: SlotOffer[];
  chosen: SlotOffer | null;
  lawyerId: string | null;
  appointmentId: string | null;
  prospectId: string | null;
  turns: number;
  unclear: number;
  greeted: boolean;
  /** La persona pidió (o aceptó) una cita: al completar los datos se ofrecen horarios. */
  bookingRequested: boolean;
}

export interface Conversation {
  id: string;
  channel: ChannelId;
  contactName: string;
  contactHandle: string;
  prospectId: string | null;
  clientId: string | null;
  status: ConversationStatus;
  priority: ConversationPriority;
  pending: boolean;
  mode: 'auto' | 'manual';
  assignedTo: string | null;
  unread: number;
  messages: Message[];
  ai: AssistantSession;
  summary: string | null;
  handoffReason: string | null;
  lastMessageAt: string;
  createdAt: string;
  /** Marca las conversaciones creadas desde los escenarios de demostración o el probador. */
  origin: 'datos' | 'escenario' | 'prueba';
}

/* -------------------------- Tareas, documentos, etc. ----------------------- */

export type TaskStatus = 'pendiente' | 'en_curso' | 'completada';
export type RelatedType = 'prospecto' | 'cliente' | 'expediente';

export interface TaskHistoryEntry {
  at: string;
  by: string;
  text: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  relatedType: RelatedType | null;
  relatedId: string | null;
  assigneeId: string;
  priority: Priority;
  dueDate: string;
  status: TaskStatus;
  reminder: boolean;
  createdAt: string;
  history: TaskHistoryEntry[];
}

export interface DocumentRecord {
  id: string;
  name: string;
  ext: string;
  category: string;
  sizeKb: number;
  uploadedAt: string;
  uploadedBy: string;
  clientId: string | null;
  caseId: string | null;
  note: string;
}

export type NotificationKind = 'derivacion' | 'cita' | 'prospecto' | 'tarea' | 'mensaje' | 'sistema';

export interface Notification {
  id: string;
  at: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  read: boolean;
  forMemberId: string | null;
}

export interface ActivityEntry {
  id: string;
  at: string;
  actor: string;
  /** `asistente` para acciones del asistente virtual; `equipo` para el resto. */
  actorKind: 'asistente' | 'equipo' | 'sistema';
  text: string;
  href: string | null;
}

/* ------------------------------ Configuración ----------------------------- */

export interface AssistantConfig {
  enabled: boolean;
  channels: Record<ChannelId, boolean>;
  tone: 'formal' | 'cercano';
  greeting: string;
  askEmail: boolean;
  offerBooking: boolean;
  handoffOnUrgent: boolean;
  /** Intentos fallidos de comprensión antes de ofrecer un abogado. */
  maxUnclear: number;
  /** Duración de la consulta inicial, en minutos. */
  consultMinutes: number;
}

export interface KbEntry {
  id: string;
  title: string;
  keywords: string[];
  answer: string;
  approved: boolean;
  createdAt: string;
}

export interface CrmState {
  version: number;
  /** Día en que se alinearon las fechas de la demostración (para reubicarlas en el tiempo). */
  anchorDay: string;
  currentUserId: string;
  members: Member[];
  prospects: Prospect[];
  clients: Client[];
  cases: CaseFile[];
  appointments: Appointment[];
  conversations: Conversation[];
  tasks: Task[];
  documents: DocumentRecord[];
  documentCategories: string[];
  notifications: Notification[];
  activity: ActivityEntry[];
  assistant: AssistantConfig;
  kb: KbEntry[];
}
