# Estudio Jurídico — Sitio web y panel de administración

Sitio web profesional y panel privado para **un único estudio jurídico**. No es un SaaS:
no hay multiempresa, ni organizaciones, ni suscripciones. Toda la información —identidad,
servicios, equipo, contenido y configuración— pertenece a un solo estudio y se administra
desde `/admin`.

> **HAROWI Legal CRM** (sistema privado de gestión con asistente virtual, en `/crm`): ver
> [docs/CRM.md](docs/CRM.md).

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | Next.js 15 (App Router, Server Components, Server Actions) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| Base de datos | Supabase PostgreSQL |
| Autenticación | Supabase Auth |
| Archivos | Supabase Storage |
| Iconos | lucide-react |
| Validación | Zod |
| Despliegue | Vercel |

## Modos de funcionamiento

El proyecto arranca en cualquiera de los dos modos, según haya credenciales de Supabase:

1. **Demostración** (sin variables de entorno) — el sitio se sirve con el contenido de
   `src/content`, los formularios validan pero no guardan y el panel queda en solo lectura.
   Sirve para revisar diseño y navegación antes de conectar la base de datos.
2. **Conectado** (con variables de entorno) — todo el contenido, las consultas, las citas
   y el panel leen y escriben en Supabase.

La decisión se toma en un único punto: `src/lib/supabase/config.ts`.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local
npm run dev
```

El sitio queda disponible en <http://localhost:3000> y el panel en
<http://localhost:3000/admin>.

### Conectar Supabase

1. Cree un proyecto en [supabase.com](https://supabase.com).
2. Ejecute el esquema: pegue `supabase/migrations/20260101000000_init.sql` en el SQL Editor
   (o `supabase db push` si usa la CLI). Crea tablas, índices, triggers, políticas RLS,
   la función `taken_slots` y los buckets de Storage.
3. Complete `.env.local` con `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   y `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API).
4. Cargue el contenido inicial:

   ```bash
   npm run seed            # inserta el contenido de src/content
   npm run seed -- --reset # vacía las tablas de contenido antes de insertar
   ```

5. Cree el usuario del estudio en Supabase → Authentication → Users y añada su perfil:

   ```sql
   insert into public.profiles (id, full_name, email, role)
   values ('<uuid del usuario>', 'Nombre Apellido', 'correo@estudio.pe', 'admin');
   ```

   Sin fila activa en `profiles` el usuario no puede entrar al panel, aunque exista en Auth.

## Estructura

```
src/
├── app/
│   ├── (site)/              Sitio público
│   │   ├── page.tsx         Inicio
│   │   ├── nosotros/        Historia, valores y metodología
│   │   ├── areas/           Listado y páginas de cada servicio
│   │   ├── equipo/          Equipo y ficha individual
│   │   ├── blog/            Listado y artículo
│   │   ├── preguntas-frecuentes/
│   │   ├── consulta/        Formulario «Cuéntenos su caso»
│   │   ├── citas/           Solicitud de cita con horarios
│   │   ├── contacto/        Datos, mapa y formulario
│   │   ├── aviso-legal/
│   │   └── politica-de-privacidad/
│   ├── (panel)/admin/       Panel privado
│   ├── (panel-auth)/admin/login/
│   ├── actions/             Server Actions (públicas, panel y sesión)
│   ├── sitemap.ts           Mapa del sitio
│   └── robots.ts
├── components/
│   ├── layout/              Navbar, Footer, Logo
│   ├── site/                Componentes del sitio público
│   ├── forms/               Formularios públicos
│   ├── admin/               Componentes del panel
│   ├── whatsapp/            Botón flotante e icono
│   ├── seo/                 Datos estructurados
│   └── ui/                  Sistema de componentes base
├── config/site.ts           Rutas y navegación (lo demás es administrable)
├── content/                 Contenido de demostración y semilla
├── lib/
│   ├── data/                Lectura pública y del panel
│   ├── supabase/            Clientes de servidor y navegador
│   ├── forms/               Estado y conversión de formularios
│   ├── validation/          Esquemas Zod
│   ├── scheduling.ts        Cálculo de horarios disponibles
│   └── whatsapp.ts          Enlaces y punto de conexión con la Cloud API
├── types/                   Tipos del dominio (reflejan las columnas SQL)
└── middleware.ts            Refresco de sesión y protección de /admin
```

## Base de datos

| Tabla | Contenido |
| --- | --- |
| `profiles` | Personal autorizado del estudio |
| `practice_areas` | Áreas de práctica |
| `services` | Servicios, uno por página pública |
| `service_faqs` | Preguntas frecuentes por servicio |
| `lawyers` / `lawyer_areas` | Equipo y su relación con las áreas |
| `blog_posts` | Artículos del centro de información |
| `faqs` | Preguntas frecuentes generales |
| `consultations` / `consultation_notes` | Consultas recibidas y su seguimiento |
| `appointments` | Citas y sus estados |
| `lawyer_availability` / `blocked_dates` | Horarios de atención y fechas bloqueadas |
| `site_settings` | Configuración del estudio (fila única) |
| `social_links` | Redes sociales del pie |

### Seguridad (RLS)

- El visitante anónimo solo puede **leer contenido público activo** y **crear** consultas
  y solicitudes de cita.
- Consultas, citas y notas internas solo son legibles por el personal del estudio
  (`public.is_staff()`).
- El panel escribe con la sesión del usuario: las políticas RLS se aplican también ahí,
  no existe una vía privilegiada desde la aplicación.
- La disponibilidad pública de horarios se resuelve con la función `taken_slots`, que
  devuelve únicamente las horas ocupadas, nunca datos personales de otras citas.

### Storage

Buckets públicos en lectura y restringidos en escritura al personal: `lawyers`, `blog`,
`services` y `site`. Las imágenes se referencian por su URL pública desde el panel.

## Administración

`/admin` incluye Dashboard, Consultas, Citas, Abogados, Áreas, Servicios, Blog, Preguntas
frecuentes y Configuración. Todo el contenido visible del sitio se edita desde ahí: no hay
textos del estudio escritos directamente en los componentes.

Los campos de lista se editan como texto, con un elemento por línea. El contenido
enriquecido usa prefijos simples al inicio de cada línea:

| Prefijo | Resultado |
| --- | --- |
| `## ` | Encabezado |
| `### ` | Subencabezado |
| `- ` | Elemento de lista |
| `> ` | Cita destacada |
| `! ` | Aviso |
| *(sin prefijo)* | Párrafo |

## Contenido de demostración

El contenido de `src/content` está marcado como demostración. Los nombres del equipo, su
formación y su experiencia son **placeholders** (`[DEMO]`) y deben reemplazarse antes de
publicar. El sitio no afirma años de experiencia, número de casos, resultados, premios ni
testimonios: esa información debe cargarla el estudio con datos reales.

Los textos jurídicos describen el funcionamiento general de cada procedimiento y llevan un
aviso de carácter orientativo; no constituyen asesoría sobre un caso concreto.

## WhatsApp

El sitio usa enlaces `wa.me`, que no requieren cuenta de empresa ni credenciales. El número
y el mensaje por defecto se administran desde Configuración, y cada página de servicio, cada
ficha de abogado y cada artículo generan su propio mensaje contextual.

La integración con la API oficial queda preparada en `src/lib/whatsapp.ts`
(`sendTemplateMessage`), pendiente de credenciales.

## Comandos

```bash
npm run dev        # servidor de desarrollo
npm run build      # compilación de producción
npm run start      # servidor de producción
npm run lint       # ESLint
npm run typecheck  # TypeScript sin emitir
npm run seed       # carga el contenido inicial en Supabase
```

## Despliegue en Vercel

1. Importe el repositorio en Vercel.
2. Defina las variables de entorno del proyecto (las mismas de `.env.local`).
3. Ajuste `NEXT_PUBLIC_SITE_URL` al dominio definitivo para que la metadata, el sitemap y
   los datos estructurados apunten a la URL correcta.
