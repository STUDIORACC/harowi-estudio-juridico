'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Check, Loader2, MessageCircle } from 'lucide-react';
import { WhatsappIcon } from '@/components/whatsapp/WhatsappIcon';
import { AREA_LIST } from '@/crm/constants';
import { servicesOfArea } from '@/crm/knowledge/services';
import { setAssistantSpeed, playLines, startTestChat, whatsappBookingScript } from '@/crm/store/runtime';
import * as crm from '@/crm/store/actions';
import { useCrm } from '@/crm/store/store';
import type { AreaId, Modality } from '@/crm/types';
import { Button } from '../ui/Button';
import { Field, FormGrid, Input, Select } from '../ui/Form';
import { Modal } from '../ui/Overlay';
import { useToast } from '../ui/Toast';

/**
 * Reserva simulada desde WhatsApp: crea una conversación y reproduce con el
 * asistente real todo el flujo (clasificar, registrar prospecto, ofrecer
 * horarios y reservar). Al terminar, la cita ya figura en la agenda.
 */
export function WhatsappBookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useCrm();
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState('Lucía Fernández Prado');
  const [area, setArea] = useState<AreaId>('familia');
  const [slug, setSlug] = useState(servicesOfArea('familia')[0].slug);
  const [modality, setModality] = useState<Modality>('virtual');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const services = useMemo(() => servicesOfArea(area), [area]);
  const serviceName = services.find((s) => s.slug === slug)?.name ?? '';
  const total = 7;

  const run = async () => {
    if (name.trim().split(/\s+/).length < 2) return setError('Ingrese nombre y apellido.');
    setError('');
    setRunning(true);
    setProgress(0);
    const chat = startTestChat('whatsapp');
    if (!chat.ok) {
      setRunning(false);
      return setError(chat.error);
    }
    setAssistantSpeed(0.25);
    const before = state.appointments.length;
    await playLines(chat.conversationId, whatsappBookingScript({ serviceName, fullName: name.trim(), modality, slotChoice: 1 }), {
      gapMs: 250,
      onProgress: (d) => setProgress(d),
    });
    setAssistantSpeed(1);
    setRunning(false);
    toast.success('Reserva registrada en la agenda', `${name.trim()} · ${serviceName}`);
    void before;
    crm.markConversationRead(chat.conversationId);
    onClose();
    router.push('/crm/agenda');
  };

  return (
    <Modal
      open={open}
      onClose={() => !running && onClose()}
      title="Simular reserva desde WhatsApp"
      description="El asistente conversa con un contacto de prueba, crea el prospecto y registra la cita. Verá el resultado en la agenda."
      footer={
        <>
          <Button onClick={onClose} disabled={running}>Cancelar</Button>
          <Button variant="brand" onClick={run} loading={running} icon={<WhatsappIcon className="h-4 w-4" />}>
            {running ? `Conversando… ${progress}/${total}` : 'Simular reserva'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-[0.8125rem] text-amber-900">
          <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Modo demostración: no se envía ningún mensaje real a WhatsApp.
        </p>
        <FormGrid>
          <Field label="Nombre del contacto" required error={error || undefined} className="sm:col-span-2">
            {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} disabled={running} invalid={Boolean(error)} />}
          </Field>
          <Field label="Área jurídica">
            {(id) => (
              <Select id={id} value={area} disabled={running} onChange={(e) => { const a = e.target.value as AreaId; setArea(a); setSlug(servicesOfArea(a)[0].slug); }}>
                {AREA_LIST.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Servicio consultado">
            {(id) => (
              <Select id={id} value={slug} disabled={running} onChange={(e) => setSlug(e.target.value)}>
                {services.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.name}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Modalidad preferida">
            {(id) => (
              <Select id={id} value={modality} disabled={running} onChange={(e) => setModality(e.target.value as Modality)}>
                <option value="virtual">Virtual</option>
                <option value="presencial">Presencial</option>
              </Select>
            )}
          </Field>
        </FormGrid>
        {running ? (
          <div className="flex items-center gap-2 text-sm text-slate-600" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> El asistente está atendiendo la conversación…
          </div>
        ) : (
          <ul className="space-y-1 text-[0.8125rem] text-slate-500">
            {['Saluda e identifica el área y el servicio', 'Solicita nombre, teléfono y correo', 'Crea el prospecto en el CRM', 'Propone horarios y registra la reserva', 'Avisa al abogado y actualiza la agenda'].map((t) => (
              <li key={t} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />{t}</li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
