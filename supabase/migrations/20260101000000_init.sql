-- ---------------------------------------------------------------------------
-- ESTUDIO JURIDICO — ESQUEMA INICIAL
-- ---------------------------------------------------------------------------
-- Proyecto de un UNICO estudio juridico. No hay multi-tenant, ni organizaciones,
-- ni suscripciones: todas las tablas describen el contenido y la operacion de
-- este estudio en concreto.
--
-- Ejecutar con:  supabase db push      (o pegar en el SQL Editor de Supabase)
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

-- ---------------------------------------------------------------------------
-- 1. UTILIDADES
-- ---------------------------------------------------------------------------

-- Mantiene updated_at al dia en cada UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. PERFILES DEL PERSONAL DEL ESTUDIO
-- ---------------------------------------------------------------------------
-- Un usuario de Supabase Auth solo puede entrar al panel si tiene una fila aqui
-- con is_active = true. No existen cuentas publicas ni registro abierto.

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  email       text not null default '',
  role        text not null default 'admin' check (role in ('admin', 'editor')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.profiles is 'Personal autorizado del estudio. Sin relacion con clientes finales.';

-- Comprueba si el usuario autenticado pertenece al personal activo.
-- SECURITY DEFINER para poder consultarse desde las policies sin recursion.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active and p.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. CONTENIDO PUBLICO
-- ---------------------------------------------------------------------------

-- 3.1 Areas de practica -------------------------------------------------------
create table if not exists public.practice_areas (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  short_name      text not null default '',
  icon            text not null default 'Scale',
  tagline         text not null default '',
  summary         text not null default '',
  intro           jsonb not null default '[]'::jsonb,
  sort_order      integer not null default 0,
  is_active       boolean not null default true,
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists practice_areas_active_idx on public.practice_areas (is_active, sort_order);

-- 3.2 Servicios ---------------------------------------------------------------
create table if not exists public.services (
  id                uuid primary key default gen_random_uuid(),
  area_id           uuid not null references public.practice_areas (id) on delete restrict,
  slug              text not null unique,
  name              text not null,
  short_description text not null default '',
  description       jsonb not null default '[]'::jsonb,
  when_needed       jsonb not null default '[]'::jsonb,
  process           jsonb not null default '[]'::jsonb,
  documents         jsonb not null default '[]'::jsonb,
  content           jsonb not null default '[]'::jsonb,
  image_url         text,
  sort_order        integer not null default 0,
  is_active         boolean not null default true,
  seo_title         text,
  seo_description   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists services_area_idx on public.services (area_id, sort_order);
create index if not exists services_active_idx on public.services (is_active);

-- 3.3 Preguntas frecuentes por servicio --------------------------------------
create table if not exists public.service_faqs (
  id          uuid primary key default gen_random_uuid(),
  service_id  uuid not null references public.services (id) on delete cascade,
  question    text not null,
  answer      text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists service_faqs_service_idx on public.service_faqs (service_id, sort_order);

-- 3.4 Abogados ----------------------------------------------------------------
create table if not exists public.lawyers (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  role            text not null default '',
  headline        text not null default '',
  bio             jsonb not null default '[]'::jsonb,
  photo_url       text,
  portrait_tone   text not null default 'ink' check (portrait_tone in ('ink','sage','clay','stone','sand')),
  education       jsonb not null default '[]'::jsonb,
  experience      jsonb not null default '[]'::jsonb,
  specialties     jsonb not null default '[]'::jsonb,
  languages       jsonb not null default '[]'::jsonb,
  email           text,
  phone           text,
  linkedin_url    text,
  sort_order      integer not null default 0,
  is_active       boolean not null default true,
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists lawyers_active_idx on public.lawyers (is_active, sort_order);

-- 3.5 Relacion abogado <-> area ----------------------------------------------
create table if not exists public.lawyer_areas (
  lawyer_id uuid not null references public.lawyers (id) on delete cascade,
  area_id   uuid not null references public.practice_areas (id) on delete cascade,
  primary key (lawyer_id, area_id)
);

create index if not exists lawyer_areas_area_idx on public.lawyer_areas (area_id);

-- 3.6 Blog --------------------------------------------------------------------
create table if not exists public.blog_posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  excerpt         text not null default '',
  content         jsonb not null default '[]'::jsonb,
  cover_image_url text,
  cover_tone      text not null default 'ink' check (cover_tone in ('ink','sage','clay','stone','sand')),
  category        text not null default 'General',
  author_id       uuid references public.lawyers (id) on delete set null,
  area_id         uuid references public.practice_areas (id) on delete set null,
  status          text not null default 'borrador' check (status in ('borrador','publicado')),
  published_at    timestamptz,
  reading_minutes integer not null default 5,
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists blog_posts_published_idx on public.blog_posts (status, published_at desc);
create index if not exists blog_posts_category_idx on public.blog_posts (category);

-- 3.7 Preguntas frecuentes generales -----------------------------------------
create table if not exists public.faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  category   text not null default 'General',
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists faqs_active_idx on public.faqs (is_active, sort_order);

-- ---------------------------------------------------------------------------
-- 4. CAPTACION Y OPERACION
-- ---------------------------------------------------------------------------

-- 4.1 Consultas ("Cuentanos tu caso") ----------------------------------------
create table if not exists public.consultations (
  id                uuid primary key default gen_random_uuid(),
  full_name         text not null,
  phone             text not null,
  whatsapp          text,
  email             text not null,
  area_id           uuid references public.practice_areas (id) on delete set null,
  service_id        uuid references public.services (id) on delete set null,
  description       text not null,
  modality          text not null default 'presencial' check (modality in ('presencial','virtual')),
  preferred_contact text not null default 'telefono' check (preferred_contact in ('telefono','whatsapp','email')),
  status            text not null default 'nueva' check (status in ('nueva','contactada','programada','atendida','cerrada')),
  source            text not null default 'web',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists consultations_status_idx on public.consultations (status, created_at desc);
create index if not exists consultations_created_idx on public.consultations (created_at desc);

-- 4.2 Notas internas de seguimiento ------------------------------------------
create table if not exists public.consultation_notes (
  id              uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations (id) on delete cascade,
  body            text not null,
  author_name     text,
  created_at      timestamptz not null default now()
);

create index if not exists consultation_notes_idx on public.consultation_notes (consultation_id, created_at desc);

-- 4.3 Citas -------------------------------------------------------------------
create table if not exists public.appointments (
  id               uuid primary key default gen_random_uuid(),
  full_name        text not null,
  email            text not null,
  phone            text not null,
  area_id          uuid references public.practice_areas (id) on delete set null,
  service_id       uuid references public.services (id) on delete set null,
  lawyer_id        uuid references public.lawyers (id) on delete set null,
  scheduled_date   date not null,
  scheduled_time   text not null,
  duration_minutes integer not null default 45,
  modality         text not null default 'presencial' check (modality in ('presencial','virtual')),
  status           text not null default 'pendiente' check (status in ('pendiente','confirmada','reprogramada','cancelada','atendida')),
  subject          text,
  notes            text,
  admin_notes      text,
  consultation_id  uuid references public.consultations (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists appointments_date_idx on public.appointments (scheduled_date, scheduled_time);
create index if not exists appointments_status_idx on public.appointments (status, scheduled_date);

-- Un mismo abogado no puede tener dos citas vigentes en el mismo horario.
create unique index if not exists appointments_slot_unique
  on public.appointments (lawyer_id, scheduled_date, scheduled_time)
  where status in ('pendiente', 'confirmada', 'reprogramada');

-- 4.4 Disponibilidad ----------------------------------------------------------
create table if not exists public.lawyer_availability (
  id           uuid primary key default gen_random_uuid(),
  lawyer_id    uuid not null references public.lawyers (id) on delete cascade,
  weekday      smallint not null check (weekday between 0 and 6),
  start_time   text not null,
  end_time     text not null,
  slot_minutes integer not null default 45,
  is_active    boolean not null default true
);

create index if not exists lawyer_availability_idx on public.lawyer_availability (lawyer_id, weekday);

create table if not exists public.blocked_dates (
  id        uuid primary key default gen_random_uuid(),
  lawyer_id uuid references public.lawyers (id) on delete cascade,
  date      date not null,
  reason    text
);

create index if not exists blocked_dates_idx on public.blocked_dates (date);

-- ---------------------------------------------------------------------------
-- 5. CONFIGURACION DEL SITIO
-- ---------------------------------------------------------------------------
-- Tabla de una sola fila (id = 1). El CHECK impide que se creen registros para
-- otros estudios: este proyecto pertenece a un unico cliente.

create table if not exists public.site_settings (
  id                   integer primary key default 1 check (id = 1),
  studio_name          text not null default 'Estudio Juridico',
  studio_legal_name    text not null default 'Estudio Juridico',
  tagline              text not null default '',
  description          text not null default '',
  logo_url             text,
  favicon_url          text,
  hero_title           text not null default '',
  hero_subtitle        text not null default '',
  hero_image_url       text,
  phone                text not null default '',
  whatsapp_number      text not null default '',
  whatsapp_message     text not null default '',
  email                text not null default '',
  address              text not null default '',
  address_city         text not null default '',
  map_query            text not null default '',
  business_hours       jsonb not null default '[]'::jsonb,
  business_hours_short text not null default '',
  primary_color        text not null default '17 20 24',
  accent_color         text not null default '160 124 74',
  seo_title            text not null default '',
  seo_description      text not null default '',
  disclaimer           text not null default '',
  about_intro          jsonb not null default '[]'::jsonb,
  about_philosophy     text not null default '',
  about_values         jsonb not null default '[]'::jsonb,
  about_method         jsonb not null default '[]'::jsonb,
  updated_at           timestamptz not null default now()
);

create table if not exists public.social_links (
  id         uuid primary key default gen_random_uuid(),
  platform   text not null,
  url        text not null,
  label      text,
  sort_order integer not null default 0,
  is_active  boolean not null default true
);

-- ---------------------------------------------------------------------------
-- 6. TRIGGERS updated_at
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'practice_areas','services','lawyers','blog_posts','faqs',
    'consultations','appointments','site_settings'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', t, t);
    execute format(
      'create trigger set_%I_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t, t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
-- Regla general:
--   * El visitante anonimo SOLO puede leer contenido publico activo y crear
--     consultas y solicitudes de cita.
--   * Todo lo demas exige ser personal del estudio (public.is_staff()).

alter table public.profiles            enable row level security;
alter table public.practice_areas      enable row level security;
alter table public.services            enable row level security;
alter table public.service_faqs        enable row level security;
alter table public.lawyers             enable row level security;
alter table public.lawyer_areas        enable row level security;
alter table public.blog_posts          enable row level security;
alter table public.faqs                enable row level security;
alter table public.consultations       enable row level security;
alter table public.consultation_notes  enable row level security;
alter table public.appointments        enable row level security;
alter table public.lawyer_availability enable row level security;
alter table public.blocked_dates       enable row level security;
alter table public.site_settings       enable row level security;
alter table public.social_links        enable row level security;

-- 7.1 Perfiles ----------------------------------------------------------------
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_admin_write" on public.profiles;
create policy "profiles_admin_write" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- 7.2 Contenido publico: lectura anonima de lo activo -------------------------
drop policy if exists "practice_areas_public_read" on public.practice_areas;
create policy "practice_areas_public_read" on public.practice_areas
  for select using (is_active or public.is_staff());

drop policy if exists "practice_areas_staff_write" on public.practice_areas;
create policy "practice_areas_staff_write" on public.practice_areas
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "services_public_read" on public.services;
create policy "services_public_read" on public.services
  for select using (is_active or public.is_staff());

drop policy if exists "services_staff_write" on public.services;
create policy "services_staff_write" on public.services
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "service_faqs_public_read" on public.service_faqs;
create policy "service_faqs_public_read" on public.service_faqs
  for select using (true);

drop policy if exists "service_faqs_staff_write" on public.service_faqs;
create policy "service_faqs_staff_write" on public.service_faqs
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "lawyers_public_read" on public.lawyers;
create policy "lawyers_public_read" on public.lawyers
  for select using (is_active or public.is_staff());

drop policy if exists "lawyers_staff_write" on public.lawyers;
create policy "lawyers_staff_write" on public.lawyers
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "lawyer_areas_public_read" on public.lawyer_areas;
create policy "lawyer_areas_public_read" on public.lawyer_areas
  for select using (true);

drop policy if exists "lawyer_areas_staff_write" on public.lawyer_areas;
create policy "lawyer_areas_staff_write" on public.lawyer_areas
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "blog_posts_public_read" on public.blog_posts;
create policy "blog_posts_public_read" on public.blog_posts
  for select using (status = 'publicado' or public.is_staff());

drop policy if exists "blog_posts_staff_write" on public.blog_posts;
create policy "blog_posts_staff_write" on public.blog_posts
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "faqs_public_read" on public.faqs;
create policy "faqs_public_read" on public.faqs
  for select using (is_active or public.is_staff());

drop policy if exists "faqs_staff_write" on public.faqs;
create policy "faqs_staff_write" on public.faqs
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read" on public.site_settings
  for select using (true);

drop policy if exists "site_settings_staff_write" on public.site_settings;
create policy "site_settings_staff_write" on public.site_settings
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "social_links_public_read" on public.social_links;
create policy "social_links_public_read" on public.social_links
  for select using (is_active or public.is_staff());

drop policy if exists "social_links_staff_write" on public.social_links;
create policy "social_links_staff_write" on public.social_links
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "availability_public_read" on public.lawyer_availability;
create policy "availability_public_read" on public.lawyer_availability
  for select using (is_active or public.is_staff());

drop policy if exists "availability_staff_write" on public.lawyer_availability;
create policy "availability_staff_write" on public.lawyer_availability
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "blocked_dates_public_read" on public.blocked_dates;
create policy "blocked_dates_public_read" on public.blocked_dates
  for select using (true);

drop policy if exists "blocked_dates_staff_write" on public.blocked_dates;
create policy "blocked_dates_staff_write" on public.blocked_dates
  for all using (public.is_staff()) with check (public.is_staff());

-- 7.3 Datos privados: consultas y citas ---------------------------------------
-- El visitante puede CREAR, nunca leer ni modificar. El estudio ve todo.

drop policy if exists "consultations_public_insert" on public.consultations;
create policy "consultations_public_insert" on public.consultations
  for insert with check (status = 'nueva');

drop policy if exists "consultations_staff_read" on public.consultations;
create policy "consultations_staff_read" on public.consultations
  for select using (public.is_staff());

drop policy if exists "consultations_staff_update" on public.consultations;
create policy "consultations_staff_update" on public.consultations
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "consultations_staff_delete" on public.consultations;
create policy "consultations_staff_delete" on public.consultations
  for delete using (public.is_staff());

drop policy if exists "consultation_notes_staff_all" on public.consultation_notes;
create policy "consultation_notes_staff_all" on public.consultation_notes
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "appointments_public_insert" on public.appointments;
create policy "appointments_public_insert" on public.appointments
  for insert with check (status = 'pendiente');

drop policy if exists "appointments_staff_read" on public.appointments;
create policy "appointments_staff_read" on public.appointments
  for select using (public.is_staff());

drop policy if exists "appointments_staff_update" on public.appointments;
create policy "appointments_staff_update" on public.appointments
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "appointments_staff_delete" on public.appointments;
create policy "appointments_staff_delete" on public.appointments
  for delete using (public.is_staff());

-- ---------------------------------------------------------------------------
-- 8. DISPONIBILIDAD PUBLICA DE HORARIOS
-- ---------------------------------------------------------------------------
-- El visitante necesita saber que horarios estan ocupados SIN poder leer los
-- datos personales de las citas. Esta funcion devuelve unicamente las horas
-- tomadas de un abogado en una fecha.

create or replace function public.taken_slots(p_lawyer_id uuid, p_date date)
returns table (scheduled_time text)
language sql
stable
security definer
set search_path = public
as $$
  select a.scheduled_time
  from public.appointments a
  where a.lawyer_id = p_lawyer_id
    and a.scheduled_date = p_date
    and a.status in ('pendiente', 'confirmada', 'reprogramada');
$$;

grant execute on function public.taken_slots(uuid, date) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9. STORAGE
-- ---------------------------------------------------------------------------
-- Buckets publicos en lectura (son imagenes del sitio) y escritura solo para
-- el personal del estudio.

insert into storage.buckets (id, name, public)
values
  ('lawyers', 'lawyers', true),
  ('blog',    'blog',    true),
  ('services','services',true),
  ('site',    'site',    true)
on conflict (id) do nothing;

drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read" on storage.objects
  for select using (bucket_id in ('lawyers','blog','services','site'));

drop policy if exists "storage_staff_write" on storage.objects;
create policy "storage_staff_write" on storage.objects
  for all
  using (bucket_id in ('lawyers','blog','services','site') and public.is_staff())
  with check (bucket_id in ('lawyers','blog','services','site') and public.is_staff());
