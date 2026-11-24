'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Eye, FileImage, FileSpreadsheet, FileText, FolderPlus, Lock, Pencil, Plus, Trash2, UploadCloud, X } from 'lucide-react';
import { formatDate } from '@/crm/lib/dates';
import { formatBytes, normalize } from '@/crm/lib/text';
import * as crm from '@/crm/store/actions';
import { useCrm } from '@/crm/store/store';
import type { DocumentRecord } from '@/crm/types';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Field, FormGrid, Input, SearchInput, Select, Textarea } from '../ui/Form';
import { Card, EmptyState, KeyValue, PageHeader, Pagination, TableWrap, tableCls, tdCls, thCls } from '../ui/Layout';
import { ActionMenu, ConfirmDialog, Modal } from '../ui/Overlay';
import { Page } from '../ui/Page';
import { useToast } from '../ui/Toast';
import { UploadModal } from './UploadModal';

const PAGE_SIZE = 12;

function FileIcon({ ext, className }: { ext: string; className?: string }) {
  const cls = cn('h-5 w-5', className);
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <FileImage className={cn(cls, 'text-violet-500')} aria-hidden />;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet className={cn(cls, 'text-emerald-600')} aria-hidden />;
  if (['doc', 'docx'].includes(ext)) return <FileText className={cn(cls, 'text-brand-600')} aria-hidden />;
  return <FileText className={cn(cls, 'text-red-500')} aria-hidden />;
}

export function DocumentsPage() {
  const state = useCrm();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [ext, setExt] = useState('');
  const [clientId, setClientId] = useState('');
  const [caseId, setCaseId] = useState('');
  const [page, setPage] = useState(1);
  const [upload, setUpload] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const [edit, setEdit] = useState<DocumentRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newCat, setNewCat] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [catError, setCatError] = useState('');

  const clientName = (id: string | null) => state.clients.find((c) => c.id === id)?.name ?? null;
  const caseCode = (id: string | null) => state.cases.find((c) => c.id === id)?.code ?? null;

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    state.documents.forEach((d) => m.set(d.category, (m.get(d.category) ?? 0) + 1));
    return m;
  }, [state.documents]);
  const exts = useMemo(() => [...new Set(state.documents.map((d) => d.ext))].sort(), [state.documents]);

  const filtered = useMemo(() => {
    const nq = normalize(q);
    return state.documents
      .filter((d) => {
        if (nq && !normalize(`${d.name} ${d.category} ${clientName(d.clientId) ?? ''} ${caseCode(d.caseId) ?? ''} ${d.note}`).includes(nq)) return false;
        if (category && d.category !== category) return false;
        if (ext && d.ext !== ext) return false;
        if (clientId && d.clientId !== clientId) return false;
        if (caseId && d.caseId !== caseId) return false;
        return true;
      })
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.documents, state.clients, state.cases, q, category, ext, clientId, caseId]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const totalKb = state.documents.reduce((s, d) => s + d.sizeKb, 0);
  const viewed = view ? state.documents.find((d) => d.id === view) : null;
  const target = deleteId ? state.documents.find((d) => d.id === deleteId) : null;
  const hasFilters = Boolean(q || category || ext || clientId || caseId);

  const createCategory = () => {
    const r = crm.addDocumentCategory(newCat);
    if (!r.ok) return setCatError(r.error);
    toast.success('Categoría creada', newCat.trim());
    setCatError('');
    setNewCat('');
    setAddingCat(false);
  };

  return (
    <Page>
      <PageHeader
        title="Documentos"
        description="Repositorio de documentos de clientes y expedientes. En esta versión de demostración se guardan solo los datos del archivo; no hay enlaces públicos."
        actions={
          <Button variant="primary" icon={<UploadCloud className="h-4 w-4" />} onClick={() => setUpload(true)}>
            Subir documentos
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[15rem_1fr]">
        <aside className="space-y-3">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-navy-900">Categorías</h2>
              <button type="button" onClick={() => setAddingCat((v) => !v)} aria-label="Nueva categoría" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-700"><FolderPlus className="h-4 w-4" /></button>
            </div>
            {addingCat ? (
              <div className="space-y-1.5 border-b border-slate-100 bg-slate-50/70 p-3">
                <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Nombre de la categoría" aria-label="Nombre de la nueva categoría" onKeyDown={(e) => e.key === 'Enter' && createCategory()} invalid={Boolean(catError)} />
                {catError ? <p className="text-xs text-red-600" role="alert">{catError}</p> : null}
                <div className="flex gap-1.5"><Button size="xs" variant="primary" onClick={createCategory}>Crear</Button><Button size="xs" onClick={() => { setAddingCat(false); setCatError(''); }}>Cancelar</Button></div>
              </div>
            ) : null}
            <ul className="p-1.5">
              <li>
                <button type="button" onClick={() => { setCategory(''); setPage(1); }} aria-pressed={!category} className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm', !category ? 'bg-brand-50 font-medium text-brand-800' : 'text-slate-600 hover:bg-slate-50')}>
                  Todos los documentos <span className="tabular-nums text-xs text-slate-400">{state.documents.length}</span>
                </button>
              </li>
              {state.documentCategories.map((c) => (
                <li key={c} className="group flex items-center">
                  <button type="button" onClick={() => { setCategory(c); setPage(1); }} aria-pressed={category === c} className={cn('flex min-w-0 flex-1 items-center justify-between rounded-lg px-3 py-2 text-sm', category === c ? 'bg-brand-50 font-medium text-brand-800' : 'text-slate-600 hover:bg-slate-50')}>
                    <span className="truncate">{c}</span> <span className="tabular-nums text-xs text-slate-400">{counts.get(c) ?? 0}</span>
                  </button>
                  {!(counts.get(c) ?? 0) ? (
                    <button type="button" aria-label={`Eliminar la categoría ${c}`} onClick={() => { const r = crm.removeDocumentCategory(c); if (r.ok) { toast.success('Categoría eliminada'); if (category === c) setCategory(''); } else toast.error(r.error); }} className="ml-0.5 rounded p-1 text-slate-300 opacity-0 hover:text-red-600 group-hover:opacity-100 focus:opacity-100"><X className="h-3.5 w-3.5" /></button>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-4 text-[0.8125rem] text-slate-600">
            <p className="flex items-center gap-1.5 font-semibold text-navy-900"><Lock className="h-3.5 w-3.5" aria-hidden /> Confidencialidad</p>
            <p className="mt-1.5 leading-relaxed">Los documentos jurídicos no se comparten con enlaces públicos. En producción se guardan en almacenamiento privado con permisos por rol.</p>
            <p className="mt-3 text-xs text-slate-400">{state.documents.length} documentos · {formatBytes(totalKb)}</p>
          </Card>
        </aside>

        <div className="min-w-0 space-y-4">
          <Card>
            <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
              <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Buscar por nombre, cliente o expediente…" className="w-full sm:w-72" />
              <div className="w-[8rem]"><Select aria-label="Filtrar por tipo de archivo" value={ext} onChange={(e) => { setExt(e.target.value); setPage(1); }}><option value="">Tipo</option>{exts.map((x) => <option key={x} value={x}>{x.toUpperCase()}</option>)}</Select></div>
              <div className="w-[11rem]"><Select aria-label="Filtrar por cliente" value={clientId} onChange={(e) => { setClientId(e.target.value); setCaseId(''); setPage(1); }}><option value="">Cliente</option>{state.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
              <div className="w-[10rem]"><Select aria-label="Filtrar por expediente" value={caseId} onChange={(e) => { setCaseId(e.target.value); setPage(1); }}><option value="">Expediente</option>{state.cases.filter((c) => !clientId || c.clientId === clientId).map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}</Select></div>
              {hasFilters ? <Button variant="ghost" size="sm" onClick={() => { setQ(''); setCategory(''); setExt(''); setClientId(''); setCaseId(''); setPage(1); }}>Limpiar</Button> : null}
              <span className="ml-auto text-[0.8125rem] text-slate-500">{filtered.length} documentos</span>
            </div>
          </Card>

          <Card className="overflow-hidden">
            {rows.length === 0 ? (
              <EmptyState title={hasFilters ? 'Ningún documento coincide' : 'Aún no hay documentos'} description={hasFilters ? 'Pruebe con otros filtros.' : 'Suba el primer documento del estudio.'} icon={<FileText className="h-5 w-5" />} action={<Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setUpload(true)}>Subir documentos</Button>} />
            ) : (
              <>
                <TableWrap>
                  <table className={tableCls}>
                    <thead>
                      <tr>
                        <th className={thCls}>Nombre</th>
                        <th className={thCls}>Tipo</th>
                        <th className={thCls}>Categoría</th>
                        <th className={thCls}>Fecha</th>
                        <th className={thCls}>Tamaño</th>
                        <th className={thCls}>Cliente / expediente</th>
                        <th className={thCls}><span className="sr-only">Acciones</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((d) => (
                        <tr key={d.id} className="cursor-pointer hover:bg-slate-50/80" onClick={() => setView(d.id)}>
                          <td className={tdCls}>
                            <div className="flex items-center gap-3">
                              <FileIcon ext={d.ext} />
                              <div className="min-w-0">
                                <button type="button" onClick={(e) => { e.stopPropagation(); setView(d.id); }} className="block max-w-[22rem] truncate text-left font-medium text-navy-900 hover:underline">{d.name}</button>
                                {d.note ? <div className="max-w-[22rem] truncate text-xs text-slate-500">{d.note}</div> : null}
                              </div>
                            </div>
                          </td>
                          <td className={tdCls}><Badge tone="neutral">{d.ext.toUpperCase()}</Badge></td>
                          <td className={tdCls}>{d.category}</td>
                          <td className={cn(tdCls, 'whitespace-nowrap text-slate-600')}>{formatDate(d.uploadedAt.slice(0, 10), 'medium')}</td>
                          <td className={cn(tdCls, 'whitespace-nowrap tabular-nums text-slate-600')}>{formatBytes(d.sizeKb)}</td>
                          <td className={tdCls} onClick={(e) => e.stopPropagation()}>
                            {clientName(d.clientId) ? <Link href={`/crm/clientes?id=${d.clientId}`} className="block max-w-[14rem] truncate text-[0.8125rem] font-medium text-brand-700 hover:underline">{clientName(d.clientId)}</Link> : <span className="text-slate-400">—</span>}
                            {caseCode(d.caseId) ? <Link href={`/crm/expedientes?id=${d.caseId}`} className="text-xs text-slate-500 hover:underline">{caseCode(d.caseId)}</Link> : null}
                          </td>
                          <td className={cn(tdCls, 'w-10')} onClick={(e) => e.stopPropagation()}>
                            <ActionMenu label={`Acciones de ${d.name}`} items={[
                              { label: 'Ver detalle', icon: <Eye className="h-4 w-4" />, onClick: () => setView(d.id) },
                              { label: 'Editar y asociar', icon: <Pencil className="h-4 w-4" />, onClick: () => setEdit(d) },
                              { label: 'Eliminar', icon: <Trash2 className="h-4 w-4" />, danger: true, divider: true, onClick: () => setDeleteId(d.id) },
                            ]} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
                <Pagination page={safePage} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
              </>
            )}
          </Card>
        </div>
      </div>

      <UploadModal open={upload} onClose={() => setUpload(false)} defaults={{ clientId: clientId || null, caseId: caseId || null }} />
      <Modal
        open={Boolean(viewed)}
        onClose={() => setView(null)}
        title={viewed?.name ?? ''}
        description="Vista de detalle del documento"
        footer={viewed ? <><Button variant="danger" size="sm" className="mr-auto" onClick={() => { setDeleteId(viewed.id); setView(null); }}>Eliminar</Button><Button size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => { setEdit(viewed); setView(null); }}>Editar y asociar</Button></> : undefined}
      >
        {viewed ? (
          <div className="space-y-4">
            <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
              <FileIcon ext={viewed.ext} className="h-9 w-9" />
              <p className="mt-2 text-sm font-medium text-navy-900">Vista previa no disponible</p>
              <p className="mt-0.5 max-w-xs text-xs text-slate-500">En modo demostración solo se registran los datos del archivo. En producción se abriría desde almacenamiento privado.</p>
            </div>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <KeyValue label="Tipo">{viewed.ext.toUpperCase()}</KeyValue>
              <KeyValue label="Tamaño">{formatBytes(viewed.sizeKb)}</KeyValue>
              <KeyValue label="Categoría">{viewed.category}</KeyValue>
              <KeyValue label="Subido">{formatDate(viewed.uploadedAt.slice(0, 10), 'long')} · {viewed.uploadedBy}</KeyValue>
              <KeyValue label="Cliente">{clientName(viewed.clientId) ?? '—'}</KeyValue>
              <KeyValue label="Expediente">{caseCode(viewed.caseId) ?? '—'}</KeyValue>
              {viewed.note ? <KeyValue label="Nota" className="sm:col-span-2">{viewed.note}</KeyValue> : null}
            </dl>
          </div>
        ) : null}
      </Modal>
      <EditDocModal doc={edit} onClose={() => setEdit(null)} />
      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setDeleteId(null)}
        title="Eliminar documento"
        description={target ? `Se eliminará el registro de «${target.name}».` : ''}
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (!target) return;
          crm.deleteDocument(target.id);
          toast.success('Documento eliminado');
        }}
      />
    </Page>
  );
}

function EditDocModal({ doc, onClose }: { doc: DocumentRecord | null; onClose: () => void }) {
  const state = useCrm();
  const toast = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [clientId, setClientId] = useState('');
  const [caseId, setCaseId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState<string | null>(null);
  if (doc && loaded !== doc.id) {
    setLoaded(doc.id);
    setName(doc.name);
    setCategory(doc.category);
    setClientId(doc.clientId ?? '');
    setCaseId(doc.caseId ?? '');
    setNote(doc.note);
    setError('');
  }
  if (!doc && loaded) setLoaded(null);

  const save = () => {
    if (!doc) return;
    const r = crm.updateDocument(doc.id, { name: name.trim(), category, clientId: clientId || null, caseId: caseId || null, note });
    if (!r.ok) return setError(r.error);
    toast.success('Documento actualizado');
    onClose();
  };

  return (
    <Modal open={Boolean(doc)} onClose={onClose} title="Editar documento" description="Cambie la categoría o asócielo a un cliente y expediente." footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={save}>Guardar</Button></>}>
      <div className="space-y-4">
        <Field label="Nombre del archivo" required error={error || undefined}>{(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} invalid={Boolean(error)} />}</Field>
        <FormGrid>
          <Field label="Categoría">{(id) => <Select id={id} value={category} onChange={(e) => setCategory(e.target.value)}>{state.documentCategories.map((c) => <option key={c} value={c}>{c}</option>)}</Select>}</Field>
          <Field label="Cliente">{(id) => <Select id={id} value={clientId} onChange={(e) => { setClientId(e.target.value); setCaseId(''); }}><option value="">Sin cliente</option>{state.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>}</Field>
          <Field label="Expediente" className="sm:col-span-2">{(id) => <Select id={id} value={caseId} onChange={(e) => setCaseId(e.target.value)}><option value="">Sin expediente</option>{state.cases.filter((c) => !clientId || c.clientId === clientId).map((c) => <option key={c.id} value={c.id}>{c.code} · {c.procedure}</option>)}</Select>}</Field>
        </FormGrid>
        <Field label="Nota">{(id) => <Textarea id={id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
      </div>
    </Modal>
  );
}
