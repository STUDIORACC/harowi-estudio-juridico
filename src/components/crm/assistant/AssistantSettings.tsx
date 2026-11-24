'use client';

import { useEffect, useState } from 'react';
import { Ban, ShieldCheck } from 'lucide-react';
import { CHANNEL_LIST } from '@/crm/constants';
import * as crm from '@/crm/store/actions';
import { useCrm } from '@/crm/store/store';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ChannelIcon } from '../ui/Chips';
import { Field, FormGrid, Select, Switch, Textarea } from '../ui/Form';
import { Card, CardHeader } from '../ui/Layout';
import { useToast } from '../ui/Toast';

const RULES = [
  'No afirma ser abogado ni se presenta como tal.',
  'No da diagnósticos jurídicos definitivos ni promete resultados.',
  'No inventa artículos, leyes ni requisitos: solo usa la información aprobada de los servicios de HAROWI.',
  'No define estrategias legales por su cuenta ni calcula plazos: los plazos los verifica el abogado.',
  'No solicita datos sensibles innecesarios (solo nombre, contacto y un resumen breve).',
  'Ante una detención, violencia o emergencia, deriva de inmediato a un abogado.',
  'Si la persona pide hablar con un abogado, detiene la atención automática y transfiere.',
];

export function AssistantSettings() {
  const state = useCrm();
  const toast = useToast();
  const cfg = state.assistant;
  const [greeting, setGreeting] = useState(cfg.greeting);

  useEffect(() => setGreeting(cfg.greeting), [cfg.greeting]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <Card>
          <CardHeader title="Canales habilitados" description="Dónde responde el asistente. Todos los canales funcionan en modo demostración." />
          <ul className="divide-y divide-slate-100 px-4 pb-2 sm:px-5">
            {CHANNEL_LIST.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100"><ChannelIcon channel={c.id} className="h-[18px] w-[18px]" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-navy-900">{c.name}</p>
                  <Badge tone="amber" className="mt-0.5">Modo demostración</Badge>
                </div>
                <Switch checked={cfg.channels[c.id]} onChange={(v) => crm.setAssistantChannel(c.id, v)} label={`Asistente en ${c.name}`} disabled={!cfg.enabled} />
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Comportamiento" description="Estos ajustes se aplican de inmediato a las nuevas conversaciones y pruebas." />
          <div className="space-y-4 px-4 pb-5 sm:px-5">
            <Field label="Saludo inicial" hint="Se muestra tras el saludo de cortesía (Buenos días / Buenas tardes / Buenas noches).">
              {(id) => <Textarea id={id} rows={3} value={greeting} onChange={(e) => setGreeting(e.target.value)} onBlur={() => greeting.trim() && greeting !== cfg.greeting && (crm.updateAssistantConfig({ greeting: greeting.trim() }), toast.success('Saludo actualizado'))} />}
            </Field>
            <Switch checked={cfg.askEmail} onChange={(v) => crm.updateAssistantConfig({ askEmail: v })} label="Solicitar correo electrónico (opcional)" description="Pregunta por un correo para enviar la confirmación. La persona puede omitirlo." />
            <Switch checked={cfg.offerBooking} onChange={(v) => crm.updateAssistantConfig({ offerBooking: v })} label="Ofrecer una consulta al registrar los datos" description="Tras crear el prospecto, propone coordinar una consulta con el abogado del área." />
            <Switch checked={cfg.handoffOnUrgent} onChange={(v) => crm.updateAssistantConfig({ handoffOnUrgent: v })} label="Derivar de inmediato en urgencias" description="Detención, violencia o emergencia: deja de preguntar y deriva al abogado." />
            <FormGrid>
              <Field label="Duración de la consulta inicial">
                {(id) => (
                  <Select id={id} value={cfg.consultMinutes} onChange={(e) => crm.updateAssistantConfig({ consultMinutes: Number(e.target.value) })}>
                    {[30, 45, 60].map((m) => (
                      <option key={m} value={m}>{m} minutos</option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Derivar tras mensajes no entendidos">
                {(id) => (
                  <Select id={id} value={cfg.maxUnclear} onChange={(e) => crm.updateAssistantConfig({ maxUnclear: Number(e.target.value) })}>
                    {[2, 3, 4, 5].map((m) => (
                      <option key={m} value={m}>{m} intentos</option>
                    ))}
                  </Select>
                )}
              </Field>
            </FormGrid>
            <Button size="sm" onClick={() => { crm.updateAssistantConfig({ greeting: 'Soy el asistente virtual de HAROWI Estudio Jurídico. Puedo orientarle sobre nuestros servicios y coordinar una consulta con un abogado.', askEmail: true, offerBooking: true, handoffOnUrgent: true, maxUnclear: 3, consultMinutes: 45 }); toast.success('Comportamiento restablecido'); }}>
              Restablecer valores recomendados
            </Button>
          </div>
        </Card>
      </div>

      <Card className="self-start">
        <CardHeader title="Reglas de conducta (obligatorias)" description="Definidas por el estudio. No pueden desactivarse desde esta pantalla." />
        <ul className="space-y-2.5 px-4 pb-5 sm:px-5">
          {RULES.map((r) => (
            <li key={r} className="flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-slate-700">
              {r.startsWith('No') ? <Ban className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden /> : <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />}
              {r}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
