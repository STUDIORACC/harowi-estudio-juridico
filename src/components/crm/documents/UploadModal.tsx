'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, Plus, Trash2, UploadCloud } from 'lucide-react';
import { formatBytes } from '@/crm/lib/text';
import * as crm from '@/crm/store/actions';
import { useCrm } from '@/crm/store/store';
import { Button } from '../ui/Button';
import { Field, FormGrid, Input, Select, Textarea } from '../ui/Form';
import { Modal } from '../ui/Overlay';
import { useToast } from '../ui/Toast';

interface Picked {
  name: string;
  sizeKb: number;
}

/**
 * Carga de documentos en modo demostración: se registran el nombre, el tipo y
 * el tamaño. El contenido del archivo NO se guarda ni sale del navegador.
 */
export function UploadModal({ open, onClose, defaults }: { open: boolean; onClose: () => void; defaults?: { clientId?: string | null; caseId?: string | null } }) {
  const state = useCrm();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<Picked[]>([]);
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [clientId, setClientId] = useState('');
  const [caseId, setCaseId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFiles([]);
    setNote('');
    setError('');
    setNewCategory('');
    setCategory(state.documentCategories[0] ?? '');
    setClientId(defaults?.clientId ?? '');
    setCaseId(defaults?.caseId ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const add = (list: FileList | null) => {
    if (!list) return;
    const picked = [...list].map((f) => ({ name: f.name, sizeKb: f.size / 1024 }));
    setFiles((cur) => [...cur, ...picked.filter((p) => !cur.some((c) => c.name === p.name && Math.round(c.sizeKb) === Math.round(p.sizeKb)))]);
    setError('');
  };

  const cases = state.cases.filter((c) => !clientId || c.clientId === clientId);

  const submit = () => {
    let cat = category;
    if (newCategory.trim()) {
      const r = crm.addDocumentCategory(newCategory);
      if (!r.ok && !/Ya existe/.test(r.error)) return setError(r.error);
      cat = newCategory.trim();
    }
    const r = crm.addDocuments(files, { category: cat, clientId: clientId || null, caseId: caseId || null, note });
    if (!r.ok) return setError(r.error);
    toast.success(`${r.count} documento${r.count > 1 ? 's' : ''} registrado${r.count > 1 ? 's' : ''}`, 'Modo demostración: se guardó el registro, no el contenido del archivo.');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Subir documentos"
      description="Asocie los archivos a un cliente o expediente. No se generan enlaces públicos."
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={submit} disabled={!files.length}>
            Registrar {files.length > 1 ? `${files.length} documentos` : 'documento'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            add(e.dataTransfer.files);
          }}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors ${over ? 'border-brand-400 bg-brand-50' : 'border-slate-300 bg-slate-50/60'}`}
        >
          <UploadCloud className="mb-2 h-7 w-7 text-slate-400" aria-hidden />
          <p className="text-sm text-navy-800">Arrastre archivos aquí o</p>
          <Button className="mt-2" size="sm" onClick={() => inputRef.current?.click()}>
            Seleccionar archivos
          </Button>
          <input ref={inputRef} type="file" multiple className="sr-only" onChange={(e) => { add(e.target.files); e.target.value = ''; }} aria-label="Seleccionar archivos" />
          <p className="mt-2 text-xs text-slate-500">Demostración: solo se registran nombre, tipo y tamaño.</p>
        </div>

        {files.length ? (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-3 px-3 py-2">
                <FileText className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm text-navy-900">{f.name}</span>
                <span className="text-xs text-slate-500">{formatBytes(f.sizeKb)}</span>
                <button type="button" onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))} aria-label={`Quitar ${f.name}`} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <FormGrid>
          <Field label="Categoría" required>
            {(id) => (
              <Select id={id} value={category} onChange={(e) => setCategory(e.target.value)} disabled={Boolean(newCategory.trim())}>
                {state.documentCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="¿Otra categoría?" hint="Escriba un nombre para crearla.">
            {(id) => <Input id={id} value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nueva categoría" />}
          </Field>
          <Field label="Cliente">
            {(id) => (
              <Select id={id} value={clientId} onChange={(e) => { setClientId(e.target.value); setCaseId(''); }}>
                <option value="">Sin cliente</option>
                {state.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Expediente">
            {(id) => (
              <Select id={id} value={caseId} onChange={(e) => setCaseId(e.target.value)}>
                <option value="">Sin expediente</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} · {c.procedure}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </FormGrid>
        <Field label="Nota (opcional)">{(id) => <Textarea id={id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
        {error ? (
          <p role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
            <Plus className="h-4 w-4 rotate-45" aria-hidden />
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
