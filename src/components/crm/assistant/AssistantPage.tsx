'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertTriangle, Bot, CalendarCheck2, Forward, MessagesSquare, Tags, UserPlus } from 'lucide-react';
import { formatMessageStamp } from '@/crm/lib/dates';
import * as crm from '@/crm/store/actions';
import { useCrm } from '@/crm/store/store';
import { cn } from '@/lib/utils';
import { Switch } from '../ui/Form';
import { Card, CardHeader, EmptyState, PageHeader, StatCard, Tabs } from '../ui/Layout';
import { Page } from '../ui/Page';
import { AssistantSettings } from './AssistantSettings';
import { AssistantTester } from './AssistantTester';
import { KnowledgeBase } from './KnowledgeBase';

type Tab = 'probador' | 'configuracion' | 'conocimiento' | 'actividad';

export function AssistantPage() {
  const state = useCrm();
  const [tab, setTab] = useState<Tab>('probador');
  const cfg = state.assistant;

  const stats = useMemo(() => {
    const convs = state.conversations;
    return {
      attended: convs.filter((c) => c.messages.some((m) => m.from === 'assistant')).length,
      classified: convs.filter((c) => c.ai.area).length,
      prospects: state.prospects.filter((p) => p.history.some((h) => h.kind === 'creacion' && /asistente/i.test(h.by))).length,
      appointments: state.appointments.filter((a) => a.source === 'asistente').length,
      handoffs: convs.filter((c) => c.handoffReason).length,
    };
  }, [state.conversations, state.prospects, state.appointments]);

  const activity = useMemo(() => state.activity.filter((a) => a.actorKind === 'asistente'), [state.activity]);
  const activeChannels = Object.values(cfg.channels).filter(Boolean).length;

  return (
    <Page>
      <PageHeader
        title="Asistente IA"
        description="Asistente virtual de HAROWI: atiende consultas, clasifica el área jurídica, registra prospectos, agenda citas y deriva a un abogado cuando corresponde."
        actions={
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-card">
            <span className={cn('h-2.5 w-2.5 rounded-full', cfg.enabled ? 'bg-emerald-500' : 'bg-slate-300')} aria-hidden />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-navy-900">{cfg.enabled ? 'Activo' : 'Pausado'}</p>
              <p className="text-xs text-slate-500">{cfg.enabled ? `${activeChannels} de 3 canales` : 'No responde en ningún canal'}</p>
            </div>
            <Switch checked={cfg.enabled} onChange={(v) => crm.updateAssistantConfig({ enabled: v })} label={cfg.enabled ? 'Pausar el asistente' : 'Activar el asistente'} />
          </div>
        }
      />

      <div role="note" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-[0.8125rem] leading-relaxed text-amber-950">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
        <p>
          <strong>MODO DEMOSTRACIÓN.</strong> El asistente responde con reglas y flujos controlados que se ejecutan en este navegador: no usa OpenAI ni ningún modelo externo, y WhatsApp y Facebook no están conectados. Para producción se requieren credenciales de Meta y de un proveedor de IA (ver Configuración → Integraciones).
        </p>
      </div>

      <section aria-label="Indicadores del asistente" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Conversaciones atendidas" value={stats.attended} icon={<MessagesSquare className="h-4 w-4" />} tone="violet" hint="Con respuesta del asistente" />
        <StatCard label="Consultas clasificadas" value={stats.classified} icon={<Tags className="h-4 w-4" />} tone="blue" hint="Área jurídica identificada" />
        <StatCard label="Prospectos creados" value={stats.prospects} icon={<UserPlus className="h-4 w-4" />} tone="green" hint="Registrados por el asistente" />
        <StatCard label="Citas generadas" value={stats.appointments} icon={<CalendarCheck2 className="h-4 w-4" />} tone="navy" hint="Reservas hechas en chat" />
        <StatCard label="Derivaciones a abogados" value={stats.handoffs} icon={<Forward className="h-4 w-4" />} tone="amber" hint="Atención pasada a una persona" />
      </section>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        items={[
          { id: 'probador', label: 'Probador' },
          { id: 'configuracion', label: 'Canales y comportamiento' },
          { id: 'conocimiento', label: 'Base de conocimiento' },
          { id: 'actividad', label: 'Historial de actividad', count: activity.length },
        ]}
      />

      {tab === 'probador' ? <AssistantTester /> : null}
      {tab === 'configuracion' ? <AssistantSettings /> : null}
      {tab === 'conocimiento' ? <KnowledgeBase /> : null}
      {tab === 'actividad' ? (
        <Card>
          <CardHeader title="Historial de actividad del asistente" description="Todo lo que el asistente hizo en el CRM: clasificar, crear prospectos, reservar y derivar." />
          {activity.length === 0 ? (
            <EmptyState title="Sin actividad todavía" description="Pruebe el asistente o inicie un escenario de demostración." icon={<Bot className="h-5 w-5" />} />
          ) : (
            <ul className="divide-y divide-slate-100 px-2 pb-2">
              {activity.slice(0, 40).map((a) => (
                <li key={a.id}>
                  <Link href={a.href ?? '/crm/asistente'} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700"><Bot className="h-3.5 w-3.5" aria-hidden /></span>
                    <p className="min-w-0 flex-1 text-sm leading-snug text-slate-600"><span className="font-medium text-navy-900">{a.actor}</span> {a.text}</p>
                    <span className="shrink-0 text-xs text-slate-400">{formatMessageStamp(a.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
    </Page>
  );
}
