# HAROWI Legal CRM (versión de demostración)

Sistema privado de gestión del estudio: CRM de prospectos, clientes, expedientes, agenda,
bandeja omnicanal y asistente virtual. Vive en `/crm` dentro de este mismo proyecto y **no
modifica** el sitio público ni `/admin`.

> **Modo demostración.** Todos los datos son ficticios y se guardan en el navegador
> (localStorage). WhatsApp, Facebook, la IA, Google Calendar y Supabase **no están
> conectados**: funcionan con simuladores locales y no se piden credenciales.

## Instalación y ejecución

```bash
npm install
npm run dev          # http://localhost:3000/crm
npm run build        # compilación de producción (todas las rutas /crm son estáticas)
npm run crm:check    # verificación automática del asistente y de los flujos de negocio
```

No requiere variables de entorno. El botón «Restablecer datos de demostración» (menú lateral)
recarga los datos de ejemplo. Las fechas se generan alrededor del día actual; si la demo se abre
otro día, se regenera (si nadie la modificó) o se desplazan las fechas conservando los cambios.

## Guion para presentar al estudio

1. **Dashboard → «Escenario: alimentos»** (o Conversaciones). Pulse *Reproducir todo* o *Enviar
   como cliente* mensaje a mensaje: el asistente saluda, detecta Derecho de Familia · Demanda de
   alimentos, pide nombre, teléfono y correo, **crea el prospecto**, ofrece horarios, **registra la
   cita** (tarjeta de confirmación) y notifica a la Dra. Valeria Quispe.
2. Abra **Agenda** (la cita ya figura), **Prospectos** (historial comercial) y el panel derecho de la
   conversación (resumen, citas). Pulse *Tomar control* para responder como abogado.
3. **«Escenario: penal urgente»**: ante una detención el asistente deja de preguntar, marca la
   conversación **Urgente / Requiere abogado**, crea el prospecto, asigna al Dr. Andrés Salazar,
   genera el resumen y muestra la notificación. Luego responda manualmente y use *Devolver al
   asistente*.
4. **Asistente IA** → Probador: chat libre con panel de «comprensión en vivo».

## Estructura

```
src/crm/                    Lógica (sin React)
├── types.ts                Modelo de dominio
├── constants.ts            Áreas, canales, estados, etiquetas
├── seed/                   Datos ficticios (fechas relativas a hoy)
├── knowledge/services.ts   Base de conocimiento: lee src/content (15 servicios reales de HAROWI)
├── assistant/              nlu.ts · engine.ts (flujo) · summary.ts · scenarios.ts
├── integrations/           Interfaces + simuladores + registro (ver más abajo)
├── lib/                    Fechas, texto, disponibilidad y reservas, personas
└── store/                  store.ts (estado + persistencia) · actions.ts (CRUD y reglas)
                            runtime.ts (ejecución del asistente) · selectors.ts · reports.ts
src/components/crm/         Interfaz: ui/ (kit propio), shell/, charts/ y un módulo por pantalla
src/app/(crm)/crm/          Rutas: /crm, /prospectos, /clientes, /expedientes, /agenda,
                            /conversaciones, /asistente, /tareas, /documentos, /reportes, /configuracion
scripts/crm-*-check.ts      Verificaciones automáticas
```

## Funciones implementadas

- **Dashboard**: 10 indicadores y 7 bloques calculados desde los registros (se actualizan solos).
- **Prospectos**: tabla con búsqueda, filtros, orden y paginación; pipeline Kanban de 8 etapas
  (arrastrar o menú «Mover a»); alta/edición/eliminación; detección de duplicados (teléfono, correo,
  nombre); ficha con historial; conversión a cliente con apertura de expediente.
- **Clientes** y **Expedientes**: código interno automático, línea de tiempo, audiencias, plazos,
  tareas, documentos y notas internas; alertas de plazos vencidos o próximos.
- **Agenda**: vistas día (por abogado), semana, mes y lista; crear, editar, reprogramar, cancelar,
  asistencia (atendida / no asistió); sin reservas duplicadas; disponibilidad por abogado;
  *reserva simulada desde WhatsApp*.
- **Conversaciones**: tres columnas, filtros por canal y etiqueta, notas internas, respuestas
  rápidas, adjuntos ficticios, asignación, prioridad, pendiente, transferencia a abogado y
  alternancia automático ↔ manual.
- **Asistente IA**: indicadores, probador, canales y comportamiento, base de conocimiento
  (servicios aprobados + respuestas propias), historial de actividad.
- **Tareas**, **Documentos** (categorías, carga local, asociación a cliente/expediente),
  **Reportes** (9 reportes con filtros, vista gráfico/tabla y CSV), **Configuración**.

### Reglas del asistente (verificadas por `npm run crm:check`)

No afirma ser abogado · no da diagnósticos ni promete resultados · no cita artículos ni leyes · no
calcula plazos (los ingresa o verifica el abogado) · no informa honorarios · solo ofrece los 15
servicios de HAROWI · deriva de inmediato ante detención, violencia o emergencia · transfiere cuando
se pide una persona.

## Integraciones (todas simuladas)

El CRM solo usa las interfaces de `src/crm/integrations/types.ts`; los simuladores están en
`demo.ts` y se registran en `index.ts`.

| Integración | Interfaz | Estado en la demo |
| --- | --- | --- |
| WhatsApp Cloud API | `MessagingAdapter` | Simulado |
| Facebook Messenger | `MessagingAdapter` | Simulado |
| Facebook Lead Ads | por implementar | Pendiente de conectar |
| OpenAI | `AssistantProvider` (misma entrada/salida que el motor de reglas) | Pendiente de conectar |
| Google Calendar | `CalendarAdapter` | Adaptador preparado, sin conexión |
| Supabase | `CrmRepository` | Hoy localStorage |

## Requisitos pendientes para producción

1. Supabase: esquema del CRM, usuarios del estudio, roles y políticas RLS (hoy no hay autenticación).
2. WhatsApp Cloud API: cuenta verificada, número, token, webhook y plantillas aprobadas.
3. Messenger y Lead Ads: app de Meta con permisos aprobados y webhooks.
4. Modelo de lenguaje: clave en servidor, instrucciones de sistema, evaluación y revisión de privacidad.
5. Google Calendar: proyecto de Google Cloud, OAuth y consentimiento por abogado.
6. Documentos en almacenamiento privado con URL firmadas (hoy solo se guardan metadatos).
7. Carga de abogados, horarios y feriados reales; retiro de los datos ficticios.
8. Correo y plantillas para recordatorios (hoy solo quedan programados en el CRM).
9. Cumplimiento: consentimiento de datos personales, auditoría, copias de seguridad.
10. Revisión legal de los textos aprobados y de los criterios de derivación.

## Gráficos

Paleta categórica validada (azul `#2a78d6`, naranja `#eb6834`, aguamarina `#1baf7a`, violeta
`#6250d6`) para las cuatro áreas; canales: verde, azul y rosa. Cada gráfico tiene leyenda o etiquetas
directas y una vista de tabla equivalente.

## Privacidad

El CRM no se indexa (`X-Robots-Tag`, `robots.txt`) y se excluye de la versión estática pública
(`scripts/build-static-demo.mjs`).
