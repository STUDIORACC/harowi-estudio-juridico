/**
 * ---------------------------------------------------------------------------
 * TIPOS DEL DOMINIO
 * ---------------------------------------------------------------------------
 * Los nombres de campo replican exactamente las columnas de PostgreSQL
 * (snake_case) para poder consumir Supabase sin una capa de mapeo intermedia.
 *
 * Proyecto de un UNICO estudio juridico. No existe multi-tenant.
 * ---------------------------------------------------------------------------
 */

/* --------------------------------- Comunes -------------------------------- */

export type UUID = string;

/** Bloque de contenido enriquecido, almacenado como JSONB. */
export type ContentBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'note'; text: string };

/** Paso numerado de un proceso (usado en servicios y en «Nosotros»). */
export interface ProcessStep {
  step: string;
  title: string;
  description: string;
}

export interface Timestamps {
  created_at: string;
  updated_at: string;
}

/* ----------------------------- Áreas y servicios --------------------------- */

export interface PracticeArea extends Timestamps {
  id: UUID;
  slug: string;
  name: string;
  short_name: string;
  /** Nombre del icono de lucide-react, p. ej. «Scale». */
  icon: string;
  tagline: string;
  summary: string;
  intro: string[];
  sort_order: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
}

export interface Service extends Timestamps {
  id: UUID;
  area_id: UUID;
  slug: string;
  name: string;
  short_description: string;
  /** Párrafos de la explicación principal. */
  description: string[];
  /** Situaciones en las que puede requerirse el servicio. */
  when_needed: string[];
  /** Proceso general, orientativo. */
  process: ProcessStep[];
  /** Documentación orientativa que conviene reunir. */
  documents: string[];
  /** Contenido libre adicional, editable desde el panel. */
  content: ContentBlock[];
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
}

export interface ServiceFaq {
  id: UUID;
  service_id: UUID;
  question: string;
  answer: string;
  sort_order: number;
  created_at: string;
}

/** Servicio con sus relaciones resueltas, tal como lo consumen las páginas. */
export interface ServiceWithRelations extends Service {
  area: PracticeArea;
  faqs: ServiceFaq[];
}

export interface AreaWithServices extends PracticeArea {
  services: Service[];
}

/* --------------------------------- Abogados -------------------------------- */

export type PortraitTone = 'ink' | 'sage' | 'clay' | 'stone' | 'sand';

export interface Lawyer extends Timestamps {
  id: UUID;
  slug: string;
  name: string;
  role: string;
  /** Frase corta para las tarjetas del listado. */
  headline: string;
  bio: string[];
  photo_url: string | null;
  /** Tono del retrato tipográfico cuando no hay fotografía cargada. */
  portrait_tone: PortraitTone;
  education: string[];
  experience: string[];
  specialties: string[];
  languages: string[];
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  sort_order: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
}

export interface LawyerWithAreas extends Lawyer {
  areas: Pick<PracticeArea, 'id' | 'name' | 'slug' | 'short_name'>[];
}

/* ----------------------------------- Blog ---------------------------------- */

export type PostStatus = 'borrador' | 'publicado';

export interface BlogPost extends Timestamps {
  id: UUID;
  slug: string;
  title: string;
  excerpt: string;
  content: ContentBlock[];
  cover_image_url: string | null;
  cover_tone: PortraitTone;
  category: string;
  author_id: UUID | null;
  area_id: UUID | null;
  status: PostStatus;
  published_at: string | null;
  reading_minutes: number;
  seo_title: string | null;
  seo_description: string | null;
}

export interface BlogPostWithRelations extends BlogPost {
  author: Pick<Lawyer, 'id' | 'name' | 'slug' | 'role' | 'portrait_tone' | 'photo_url'> | null;
  area: Pick<PracticeArea, 'id' | 'name' | 'slug'> | null;
}

/* ----------------------------- Preguntas frecuentes ------------------------ */

export interface Faq {
  id: UUID;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/* --------------------------------- Consultas ------------------------------- */

export const CONSULTATION_STATUSES = [
  'nueva',
  'contactada',
  'programada',
  'atendida',
  'cerrada',
] as const;
export type ConsultationStatus = (typeof CONSULTATION_STATUSES)[number];

export type Modality = 'presencial' | 'virtual';
export type PreferredContact = 'telefono' | 'whatsapp' | 'email';

export interface Consultation extends Timestamps {
  id: UUID;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  email: string;
  area_id: UUID | null;
  service_id: UUID | null;
  description: string;
  modality: Modality;
  preferred_contact: PreferredContact;
  status: ConsultationStatus;
  /** Origen del registro: formulario web, WhatsApp, teléfono… */
  source: string;
}

export interface ConsultationWithRelations extends Consultation {
  area: Pick<PracticeArea, 'id' | 'name' | 'slug'> | null;
  service: Pick<Service, 'id' | 'name' | 'slug'> | null;
}

export interface ConsultationNote {
  id: UUID;
  consultation_id: UUID;
  body: string;
  author_name: string | null;
  created_at: string;
}

/* ----------------------------------- Citas --------------------------------- */

export const APPOINTMENT_STATUSES = [
  'pendiente',
  'confirmada',
  'reprogramada',
  'cancelada',
  'atendida',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export interface Appointment extends Timestamps {
  id: UUID;
  full_name: string;
  email: string;
  phone: string;
  area_id: UUID | null;
  service_id: UUID | null;
  lawyer_id: UUID | null;
  /** Fecha en formato ISO «YYYY-MM-DD». */
  scheduled_date: string;
  /** Hora en formato «HH:MM». */
  scheduled_time: string;
  duration_minutes: number;
  modality: Modality;
  status: AppointmentStatus;
  subject: string | null;
  notes: string | null;
  admin_notes: string | null;
  consultation_id: UUID | null;
}

export interface AppointmentWithRelations extends Appointment {
  area: Pick<PracticeArea, 'id' | 'name' | 'slug'> | null;
  service: Pick<Service, 'id' | 'name' | 'slug'> | null;
  lawyer: Pick<Lawyer, 'id' | 'name' | 'slug' | 'role'> | null;
}

/** Franja horaria de atención de un abogado, por día de la semana. */
export interface LawyerAvailability {
  id: UUID;
  lawyer_id: UUID;
  /** 0 = domingo … 6 = sábado (compatible con `Date.getDay()`). */
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  is_active: boolean;
}

/** Fecha bloqueada (feriado, vacaciones). `lawyer_id` nulo = todo el estudio. */
export interface BlockedDate {
  id: UUID;
  lawyer_id: UUID | null;
  date: string;
  reason: string | null;
}

/* ------------------------------ Configuración ------------------------------ */

export interface BusinessHour {
  days: string;
  hours: string;
}

export interface SiteValue {
  title: string;
  description: string;
}

export interface SiteSettings {
  id: number;
  studio_name: string;
  studio_legal_name: string;
  tagline: string;
  description: string;
  logo_url: string | null;
  favicon_url: string | null;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  phone: string;
  whatsapp_number: string;
  whatsapp_message: string;
  email: string;
  address: string;
  address_city: string;
  map_query: string;
  business_hours: BusinessHour[];
  business_hours_short: string;
  primary_color: string;
  accent_color: string;
  seo_title: string;
  seo_description: string;
  disclaimer: string;
  about_intro: string[];
  about_philosophy: string;
  about_values: SiteValue[];
  about_method: ProcessStep[];
  updated_at: string;
}

export interface SocialLink {
  id: UUID;
  platform: string;
  url: string;
  label: string | null;
  sort_order: number;
  is_active: boolean;
}

/* ---------------------------------- Perfiles ------------------------------- */

export type StaffRole = 'admin' | 'editor';

export interface Profile {
  id: UUID;
  full_name: string;
  email: string;
  role: StaffRole;
  is_active: boolean;
  created_at: string;
}
