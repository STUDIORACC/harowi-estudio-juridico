'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronDown, CircleDashed, Download, Info, Plug, RotateCcw, ShieldAlert } from 'lucide-react';
import { STUDIO } from '@/crm/knowledge/services';
import { INTEGRATION_CARDS, integrations } from '@/crm/integrations';
import * as crm from '@/crm/store/actions';
import { getState } from '@/crm/store/store';
import { useCrm } from '@/crm/store/store';
import { cn } from '@/lib/utils';
import { AvailabilityCard } from '../agenda/AvailabilityCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardHeader, KeyValue, PageHeader, Tabs } from '../ui/Layout';
import { ConfirmDialog } from '../ui/Overlay';
import { Page } from '../ui/Page';
import { useToast } from '../ui/Toast';

type Tab = 'integraciones' | 'estudio' | 'equipo' | 'datos' | 'produccion';

const PRODUCTION: { title: string; detail: string }[] = [
  { title: 'Base de datos y autenticación', detail: 'Proyecto de Supabase con el esquema del CRM, usuarios del estudio (abogados y coordinación), roles y políticas RLS. Sustituye al almacenamiento local.' },
  { title: 'WhatsApp Cloud API', detail: 'Cuenta de WhatsApp Business verificada, número, token permanente, webhook público y plantillas de mensaje aprobadas por Meta.' },
  { title: 'Facebook Messenger y Lead Ads', detail: 'Página de Facebook, app de Meta con permisos aprobados (mensajería y leads), token de página y webhooks.' },
  { title: 'Modelo de lenguaje (OpenAI)', detail: 'Clave de API en el servidor, instrucciones de sistema con las reglas de conducta, evaluación con conversaciones reales y revisión de privacidad de los datos enviados.' },
  { title: 'Google Calendar', detail: 'Proyecto de Google Cloud, OAuth del estudio y consentimiento de cada abogado; definir qué datos de la cita se publican.' },
  { title: 'Almacenamiento privado de documentos', detail: 'Bucket privado con URL firmadas de corta duración, control por rol, antivirus y política de retención. Nunca enlaces públicos.' },
  { title: 'Equipo y datos reales del estudio', detail: 'Cargar abogados, horarios de disponibilidad, feriados y datos de contacto reales; retirar los datos ficticios.' },
  { title: 'Cumplimiento y confidencialidad', detail: 'Política de privacidad y consentimiento para el tratamiento de datos, registro de auditoría, copias de seguridad y acuerdo de confidencialidad con proveedores.' },
  { title: 'Notificaciones y recordatorios', detail: 'Servicio de correo y plantillas de WhatsApp para recordatorios de citas y avisos a abogados (hoy solo se muestran dentro del CRM).' },
  { title: 'Revisión legal del asistente', detail: 'Validar con el estudio los textos aprobados, los criterios de derivación inmediata y los avisos legales antes de atender público real.' },
];

export function SettingsPage() {
  const state = useCrm();
  const toast = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('integraciones');
  const [open, setOpen] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const exportJson = () => {
    const snapshot = getState();
    if (!snapshot) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `harowi-crm-demo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Datos exportados', 'Se descargó una copia de los datos de la demostración.');
  };

  const counts = [
    ['Prospectos', state.prospects.length],
    ['Clientes', state.clients.length],
    ['Expedientes', state.cases.length],
    ['Citas', state.appointments.length],
    ['Conversaciones', state.conversations.length],
    ['Tareas', state.tasks.length],
    ['Documentos', state.documents.length],
    ['Abogados y equipo', state.members.length],
  ] as const;

  return (
    <Page>
      <PageHeader title="Configuración" description="Integraciones, datos del estudio, equipo y requisitos para pasar de la demostración a producción." />

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        items={[
          { id: 'integraciones', label: 'Integraciones' },
          { id: 'estudio', label: 'Estudio' },
          { id: 'equipo', label: 'Equipo y disponibilidad' },
          { id: 'datos', label: 'Datos de la demostración' },
          { id: 'produccion', label: 'Requisitos de producción' },
        ]}
      />

      {tab === 'integraciones' ? (
        <div className="space-y-4">
          <div role="note" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-[0.8125rem] leading-relaxed text-amber-950">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            <p>En esta versión <strong>ninguna integración está conectada</strong>. WhatsApp, Facebook e IA funcionan con simuladores locales y no se solicitan ni guardan credenciales. Cada tarjeta indica qué se necesita para conectarla.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {INTEGRATION_CARDS.map((c) => {
              const isOpen = open === c.id;
              return (
                <Card key={c.id} className="flex flex-col">
                  <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700"><Plug className="h-5 w-5" aria-hidden /></span>
                      <h2 className="text-[0.9375rem] font-semibold leading-tight text-navy-900">{c.name}</h2>
                    </div>
                    <Badge tone={c.status === 'Modo demostración' ? 'amber' : 'neutral'} dot className="shrink-0">{c.status}</Badge>
                  </div>
                  <div className="flex-1 space-y-3 px-4 pb-3 pt-3 sm:px-5">
                    <p className="text-[0.8125rem] leading-relaxed text-slate-600"><span className="font-medium text-navy-800">Para qué sirve: </span>{c.purpose}</p>
                    <p className="text-[0.8125rem] leading-relaxed text-slate-600"><span className="font-medium text-navy-800">En la demo: </span>{c.demoBehavior}</p>
                  </div>
                  <div className="border-t border-slate-100">
                    <button type="button" onClick={() => setOpen(isOpen ? null : c.id)} aria-expanded={isOpen} className="flex w-full items-center justify-between px-4 py-2.5 text-[0.8125rem] font-medium text-brand-700 hover:bg-slate-50 sm:px-5">
                      Qué se necesita para conectarla
                      <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} aria-hidden />
                    </button>
                    {isOpen ? (
                      <div className="space-y-2 px-4 pb-4 sm:px-5">
                        <ul className="space-y-1.5">
                          {c.requirements.map((r) => (
                            <li key={r} className="flex items-start gap-2 text-[0.8125rem] text-slate-600"><CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />{r}</li>
                          ))}
                        </ul>
                        <p className="rounded bg-slate-50 px-2 py-1.5 font-mono text-[0.6875rem] text-slate-500">{c.adapter}</p>
                      </div>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
          <Card>
            <CardHeader title="Adaptadores activos" description="El CRM habla con estos adaptadores, no con los servicios directamente. Para conectar uno real se implementa su interfaz y se registra en integrations/index.ts." />
            <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 sm:px-5 lg:grid-cols-3">
              {[
                ['Asistente', integrations.assistant.label, integrations.assistant.mode],
                ['WhatsApp', integrations.messaging.whatsapp.label, integrations.messaging.whatsapp.mode],
                ['Messenger', integrations.messaging.facebook.label, integrations.messaging.facebook.mode],
                ['Chat web', integrations.messaging.web.label, integrations.messaging.web.mode],
                ['Calendario', `${integrations.calendar.label} (${integrations.calendar.connected ? 'conectado' : 'no conectado'})`, integrations.calendar.mode],
                ['Persistencia', integrations.repository.label, integrations.repository.mode],
              ].map(([k, label, mode]) => (
                <div key={k} className="rounded-lg border border-slate-200 px-3 py-2.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{k}</p>
                  <p className="mt-0.5 text-[0.8125rem] font-medium text-navy-900">{label}</p>
                  <Badge tone="amber" className="mt-1.5">{mode === 'demo' ? 'Demostración' : 'En vivo'}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === 'estudio' ? (
        <Card className="max-w-3xl">
          <CardHeader title="Datos del estudio" description="Se toman del contenido del sitio web de HAROWI. Edítelos desde el panel del sitio (/admin)." />
          <dl className="grid gap-x-6 gap-y-4 px-4 pb-5 sm:grid-cols-2 sm:px-5">
            <KeyValue label="Nombre del estudio">{STUDIO.name}</KeyValue>
            <KeyValue label="Sede">{STUDIO.city}</KeyValue>
            <KeyValue label="Horario de atención" className="sm:col-span-2">{STUDIO.hours.map((h) => `${h.days}: ${h.hours}`).join(' · ')}</KeyValue>
            <KeyValue label="Áreas de práctica" className="sm:col-span-2">Derecho de Familia · Derecho Penal · Derecho Civil y Patrimonial · Derecho Empresarial (15 servicios)</KeyValue>
            <KeyValue label="Aviso general" className="sm:col-span-2"><span className="text-[0.8125rem] leading-relaxed text-slate-600">{STUDIO.disclaimer}</span></KeyValue>
          </dl>
        </Card>
      ) : null}

      {tab === 'equipo' ? <AvailabilityCard /> : null}

      {tab === 'datos' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Registros de la demostración" description="Datos ficticios guardados solo en este navegador." />
            <dl className="grid grid-cols-2 gap-3 px-4 pb-5 sm:px-5">
              {counts.map(([k, n]) => (
                <div key={k} className="rounded-lg bg-slate-50 px-3 py-2.5"><dt className="text-xs text-slate-500">{k}</dt><dd className="text-xl font-semibold tabular-nums text-navy-900">{n}</dd></div>
              ))}
            </dl>
          </Card>
          <Card>
            <CardHeader title="Gestión de los datos" />
            <div className="space-y-4 px-4 pb-5 sm:px-5">
              <p className="flex items-start gap-2 text-[0.8125rem] leading-relaxed text-slate-600"><Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />Los cambios se conservan en el navegador (localStorage). Las fechas de ejemplo se reubican alrededor de la fecha actual para que el sistema siempre tenga actividad.</p>
              <div className="flex flex-wrap gap-2">
                <Button icon={<Download className="h-4 w-4" />} onClick={exportJson}>Exportar copia (JSON)</Button>
                <Button variant="danger" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setConfirmReset(true)}>Restablecer datos de demostración</Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === 'produccion' ? (
        <Card>
          <CardHeader title="Requisitos pendientes para producción" description="Lo que falta para convertir esta demostración en el sistema real del estudio." />
          <ol className="divide-y divide-slate-100 px-2 pb-2">
            {PRODUCTION.map((p, i) => (
              <li key={p.title} className="flex items-start gap-3 px-3 py-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy-900">{p.title}</p>
                  <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-slate-600">{p.detail}</p>
                </div>
                <CheckCircle2 className="ml-auto hidden h-4 w-4 shrink-0 text-slate-200 sm:block" aria-hidden />
              </li>
            ))}
          </ol>
        </Card>
      ) : null}

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Restablecer datos de demostración"
        description="Se descartarán todos los cambios y se cargarán de nuevo los datos de ejemplo."
        confirmLabel="Restablecer"
        onConfirm={() => {
          crm.resetDemo();
          toast.success('Datos de demostración restablecidos');
          router.push('/crm');
        }}
      />
    </Page>
  );
}
