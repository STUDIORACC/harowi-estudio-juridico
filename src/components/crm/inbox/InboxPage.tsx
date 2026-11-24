'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Forward, MessagesSquare, Play, Siren } from 'lucide-react';
import { memberFull } from '@/crm/lib/people';
import * as crm from '@/crm/store/actions';
import { startScenario } from '@/crm/store/runtime';
import { lawyersOf } from '@/crm/store/selectors';
import { useCrm } from '@/crm/store/store';
import type { Conversation } from '@/crm/types';
import { cn } from '@/lib/utils';
import { useDetailId } from '../hooks';
import { Button } from '../ui/Button';
import { Field, Select, Textarea } from '../ui/Form';
import { Modal, Sheet } from '../ui/Overlay';
import { useToast } from '../ui/Toast';
import { ConversationList } from './ConversationList';
import { InfoPanel } from './InfoPanel';
import { Thread } from './Thread';

export function InboxPage() {
  const state = useCrm();
  const router = useRouter();
  const toast = useToast();
  const [selectedId, setSelectedId] = useDetailId();
  const [infoOpen, setInfoOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const selected: Conversation | null = useMemo(() => state.conversations.find((c) => c.id === selectedId) ?? null, [state.conversations, selectedId]);

  // Al abrir una conversación se marca como leída (si el asistente está escribiendo, queda al terminar).
  useEffect(() => {
    if (selected && selected.unread > 0) crm.markConversationRead(selected.id);
  }, [selected?.id, selected?.unread]); // eslint-disable-line react-hooks/exhaustive-deps

  const launch = (id: 'alimentos' | 'penal') => {
    const r = startScenario(id);
    if (!r.ok) return toast.error('No se pudo iniciar el escenario', r.error);
    router.replace(`/crm/conversaciones?id=${r.conversationId}`);
  };

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-[32rem] flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5 sm:px-5">
        <div className="mr-auto min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-navy-900">Conversaciones</h1>
          <p className="hidden text-[0.8125rem] text-slate-500 sm:block">Bandeja omnicanal: WhatsApp, Facebook Messenger y web en un solo lugar. Canales en modo demostración.</p>
        </div>
        <Button size="sm" icon={<Play className="h-3.5 w-3.5" />} onClick={() => launch('alimentos')}>
          Escenario: alimentos
        </Button>
        <Button size="sm" icon={<Siren className="h-3.5 w-3.5" />} onClick={() => launch('penal')}>
          Escenario: penal urgente
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[20rem_1fr] 2xl:grid-cols-[21rem_1fr_21rem]">
        <div className={cn('min-h-0 border-r border-slate-200', selected ? 'hidden lg:block' : 'block')}>
          <ConversationList state={state} selectedId={selected?.id ?? null} onSelect={(id) => setSelectedId(id)} />
        </div>

        <div className={cn('min-h-0 min-w-0', selected ? 'block' : 'hidden lg:block')}>
          {selected ? (
            <Thread state={state} conversation={selected} onBack={() => setSelectedId(null)} onInfo={() => setInfoOpen(true)} onTransfer={() => setTransferOpen(true)} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-slate-50/50 px-6 text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-card ring-1 ring-slate-200">
                <MessagesSquare className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium text-navy-900">Seleccione una conversación</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">O inicie un escenario guiado para ver cómo el asistente atiende una consulta, crea el prospecto y agenda la cita.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button variant="primary" icon={<Play className="h-4 w-4" />} onClick={() => launch('alimentos')}>Escenario: alimentos</Button>
                <Button icon={<Siren className="h-4 w-4" />} onClick={() => launch('penal')}>Escenario: penal urgente</Button>
              </div>
            </div>
          )}
        </div>

        {selected ? (
          <aside className="hidden min-h-0 border-l border-slate-200 2xl:block" aria-label="Información del contacto">
            <InfoPanel state={state} conversation={selected} />
          </aside>
        ) : (
          <aside className="hidden border-l border-slate-200 bg-white 2xl:block" aria-hidden />
        )}
      </div>

      {selected ? (
        <>
          <Sheet open={infoOpen} onClose={() => setInfoOpen(false)} title="Información del contacto" width="md">
            <InfoPanel state={state} conversation={selected} />
          </Sheet>
          <TransferModal open={transferOpen} onClose={() => setTransferOpen(false)} conversation={selected} />
        </>
      ) : null}
    </div>
  );
}

function TransferModal({ open, onClose, conversation: c }: { open: boolean; onClose: () => void; conversation: Conversation }) {
  const state = useCrm();
  const toast = useToast();
  const lawyers = lawyersOf(state.members);
  const [lawyerId, setLawyerId] = useState(c.assignedTo ?? lawyers[0]?.id ?? '');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setLawyerId(c.assignedTo ?? lawyers.find((l) => l.areas.includes(c.ai.area ?? 'familia'))?.id ?? lawyers[0]?.id ?? '');
      setReason('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, c.id]);

  const submit = () => {
    const r = crm.transferToHuman(c.id, lawyerId, reason.trim() || 'Transferencia solicitada por el equipo.');
    if (!r.ok) return toast.error(r.error);
    toast.success('Conversación transferida', 'Se generó el resumen y se notificó al abogado.');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Transferir a un abogado"
      description="Se detiene la atención automática, se genera un resumen y se notifica al abogado elegido."
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" icon={<Forward className="h-4 w-4" />} onClick={submit}>
            Transferir
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Abogado responsable" required>
          {(id) => (
            <Select id={id} value={lawyerId} onChange={(e) => setLawyerId(e.target.value)}>
              {lawyers.map((l) => (
                <option key={l.id} value={l.id}>{memberFull(l)} — {l.role.replace('Abogado · ', '').replace('Abogada · ', '')}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Motivo (opcional)">{(id) => <Textarea id={id} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej.: El cliente pidió hablar con la abogada de familia." />}</Field>
      </div>
    </Modal>
  );
}
