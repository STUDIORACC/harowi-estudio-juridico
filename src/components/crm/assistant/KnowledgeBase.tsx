'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { AREA_LIST } from '@/crm/constants';
import { AREA_KNOWLEDGE, STUDIO, servicesOfArea } from '@/crm/knowledge/services';
import * as crm from '@/crm/store/actions';
import { useCrm } from '@/crm/store/store';
import type { KbEntry } from '@/crm/types';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Checkbox, Field, Input, Textarea } from '../ui/Form';
import { Card, CardHeader, EmptyState } from '../ui/Layout';
import { ConfirmDialog, Modal } from '../ui/Overlay';
import { useToast } from '../ui/Toast';

export function KnowledgeBase() {
  const state = useCrm();
  const toast = useToast();
  const [open, setOpen] = useState<string | null>('derecho-penal');
  const [editing, setEditing] = useState<{ entry: KbEntry | null } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-3">
        <Card>
          <CardHeader title="Servicios de HAROWI" description="Fuente única: el contenido aprobado de los servicios publicados en el sitio. El asistente no conoce ni ofrece ningún otro servicio." />
          <div className="space-y-3 px-4 pb-4 sm:px-5">
            {AREA_LIST.map((a) => {
              const services = servicesOfArea(a.id);
              return (
                <section key={a.id} className="rounded-lg border border-slate-200">
                  <header className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/70 px-3 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} aria-hidden />
                    <h3 className="text-sm font-semibold text-navy-900">{a.name}</h3>
                    <span className="ml-auto text-xs text-slate-500">{services.length} {services.length === 1 ? 'servicio' : 'servicios'}</span>
                  </header>
                  <p className="px-3 pt-2.5 text-[0.8125rem] leading-relaxed text-slate-600">{AREA_KNOWLEDGE[a.id].summary}</p>
                  <ul className="divide-y divide-slate-100 pt-1.5">
                    {services.map((s) => {
                      const isOpen = open === s.slug;
                      return (
                        <li key={s.slug}>
                          <button type="button" onClick={() => setOpen(isOpen ? null : s.slug)} aria-expanded={isOpen} className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50">
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium text-navy-900">{s.name}</span>
                              <span className="block truncate text-xs text-slate-500">{s.shortDescription}</span>
                            </span>
                            <Badge tone="green">Aprobado</Badge>
                            <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', isOpen && 'rotate-180')} aria-hidden />
                          </button>
                          {isOpen ? (
                            <div className="space-y-3 bg-slate-50/50 px-4 pb-4 pt-1 text-[0.8125rem] leading-relaxed text-slate-700">
                              <p>{s.description[0]}</p>
                              <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Cuándo puede necesitarse</p>
                                <ul className="list-disc space-y-0.5 pl-4">{s.whenNeeded.slice(0, 4).map((w) => <li key={w}>{w}</li>)}</ul>
                              </div>
                              <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Documentos orientativos</p>
                                <ul className="list-disc space-y-0.5 pl-4">{s.documents.slice(0, 4).map((w) => <li key={w}>{w}</li>)}</ul>
                              </div>
                              <p className="text-xs text-slate-500">{s.process.length} pasos del proceso · {s.faqs.length} preguntas frecuentes aprobadas</p>
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader
            title="Respuestas aprobadas"
            description="Información general adicional que el asistente puede dar cuando reconoce estas palabras."
            actions={<Button size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setEditing({ entry: null })}>Agregar</Button>}
          />
          {state.kb.length === 0 ? (
            <EmptyState title="Sin respuestas propias" description="Agregue respuestas aprobadas por el estudio, por ejemplo sobre confidencialidad." icon={<BookOpen className="h-5 w-5" />} />
          ) : (
            <ul className="divide-y divide-slate-100 px-2 pb-2">
              {state.kb.map((e) => (
                <li key={e.id} className="px-3 py-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-navy-900">{e.title}</p>
                      <p className="mt-0.5 line-clamp-3 text-[0.8125rem] leading-snug text-slate-600">{e.answer}</p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-1">
                        {e.approved ? <Badge tone="green">Activa</Badge> : <Badge tone="neutral">Inactiva</Badge>}
                        {e.keywords.slice(0, 3).map((k) => <Badge key={k} tone="slate">{k}</Badge>)}
                      </p>
                    </div>
                    <button type="button" aria-label={`Editar ${e.title}`} onClick={() => setEditing({ entry: e })} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-800"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" aria-label={`Eliminar ${e.title}`} onClick={() => setDeleteId(e.id)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Datos generales del estudio" description="Información que el asistente puede comunicar." />
          <dl className="space-y-2 px-4 pb-4 text-[0.8125rem] sm:px-5">
            <div><dt className="text-xs text-slate-400">Estudio</dt><dd className="text-navy-900">{STUDIO.name}</dd></div>
            <div><dt className="text-xs text-slate-400">Ubicación</dt><dd className="text-navy-900">{STUDIO.city} (dirección exacta al confirmar la cita)</dd></div>
            <div><dt className="text-xs text-slate-400">Horario de atención</dt><dd className="text-navy-900">{STUDIO.hours.map((h) => `${h.days}: ${h.hours}`).join(' · ')}</dd></div>
            <div><dt className="text-xs text-slate-400">Honorarios</dt><dd className="text-navy-900">No los comunica: los define y explica el abogado en la consulta.</dd></div>
          </dl>
        </Card>
      </div>

      <KbEditor value={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Eliminar respuesta aprobada"
        description="El asistente dejará de usar esta respuesta."
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (deleteId) crm.deleteKbEntry(deleteId);
          toast.success('Respuesta eliminada');
        }}
      />
    </div>
  );
}

function KbEditor({ value, onClose }: { value: { entry: KbEntry | null } | null; onClose: () => void }) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [answer, setAnswer] = useState('');
  const [approved, setApproved] = useState(true);
  const [error, setError] = useState('');
  const [loadedFor, setLoadedFor] = useState<string | null | undefined>(undefined);

  const key = value ? (value.entry?.id ?? 'new') : null;
  if (key !== loadedFor) {
    setLoadedFor(key);
    setTitle(value?.entry?.title ?? '');
    setKeywords(value?.entry?.keywords.join(', ') ?? '');
    setAnswer(value?.entry?.answer ?? '');
    setApproved(value?.entry?.approved ?? true);
    setError('');
  }

  const save = () => {
    const r = crm.saveKbEntry({ id: value?.entry?.id, title, keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean), answer, approved });
    if (!r.ok) return setError(r.error);
    toast.success('Respuesta guardada', 'El asistente ya puede usarla.');
    onClose();
  };

  return (
    <Modal
      open={Boolean(value)}
      onClose={onClose}
      title={value?.entry ? 'Editar respuesta aprobada' : 'Nueva respuesta aprobada'}
      description="Redacte información general y revisada por el estudio. No incluya promesas de resultados ni plazos legales."
      footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={save}>Guardar</Button></>}
    >
      <div className="space-y-4">
        <Field label="Título" required>{(id) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej.: Atención por videollamada" />}</Field>
        <Field label="Palabras clave" required hint="Separadas por comas. Si el mensaje las contiene, el asistente responde.">{(id) => <Input id={id} value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="videollamada, zoom, virtual" />}</Field>
        <Field label="Respuesta aprobada" required error={error || undefined}>{(id) => <Textarea id={id} rows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} invalid={Boolean(error)} />}</Field>
        <Checkbox checked={approved} onChange={setApproved} label="Activa (el asistente puede usarla)" />
      </div>
    </Modal>
  );
}
