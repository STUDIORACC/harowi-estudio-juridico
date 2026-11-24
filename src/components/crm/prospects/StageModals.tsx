'use client';

import { useEffect, useState } from 'react';
import { servicesOfArea, serviceName } from '@/crm/knowledge/services';
import * as crm from '@/crm/store/actions';
import { useCrm } from '@/crm/store/store';
import type { Client } from '@/crm/types';
import { Button } from '../ui/Button';
import { Checkbox, Field, FormGrid, Input, Select, Textarea } from '../ui/Form';
import { Modal } from '../ui/Overlay';
import { useToast } from '../ui/Toast';

/** Convierte un prospecto en cliente (y, opcionalmente, abre su expediente). */
export function ConversionModal({ prospectId, onClose, onDone }: { prospectId: string | null; onClose: () => void; onDone?: (clientId: string, caseId: string | null) => void }) {
  const state = useCrm();
  const toast = useToast();
  const prospect = state.prospects.find((p) => p.id === prospectId);
  const [docType, setDocType] = useState<Client['docType']>('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [openCase, setOpenCase] = useState(true);
  const [procedure, setProcedure] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!prospectId) return;
    setDocType('DNI');
    setDocNumber('');
    setDistrict('');
    setOpenCase(true);
    setError('');
    const p = state.prospects.find((x) => x.id === prospectId);
    setProcedure(p?.serviceSlug ? serviceName(p.serviceSlug) : p?.area ? (servicesOfArea(p.area)[0]?.name ?? '') : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospectId]);

  if (!prospect) return null;

  const submit = () => {
    const invalidDoc = docType === 'DNI' ? !/^\d{8}$/.test(docNumber.trim()) : docType === 'RUC' ? !/^\d{11}$/.test(docNumber.trim()) : docNumber.trim().length < 6;
    if (invalidDoc) return setError(docType === 'DNI' ? 'El DNI debe tener 8 dígitos.' : docType === 'RUC' ? 'El RUC debe tener 11 dígitos.' : 'Ingrese un número de documento válido.');
    const r = crm.convertProspectToClient(prospect.id, { docType, docNumber, district, openCase: openCase && Boolean(prospect.area), procedure });
    if (!r.ok) return setError(r.error);
    toast.success('Cliente registrado', r.caseId ? 'Se abrió también su expediente.' : prospect.name);
    onDone?.(r.clientId, r.caseId);
    onClose();
  };

  return (
    <Modal
      open={Boolean(prospectId)}
      onClose={onClose}
      title="Convertir en cliente"
      description={`${prospect.name} aceptó la propuesta. Complete los datos para registrarlo como cliente.`}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={submit}>
            Registrar cliente
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormGrid>
          <Field label="Tipo de documento" required>
            {(id) => (
              <Select id={id} value={docType} onChange={(e) => setDocType(e.target.value as Client['docType'])}>
                <option value="DNI">DNI</option>
                <option value="CE">Carné de extranjería</option>
                <option value="RUC">RUC (empresa)</option>
              </Select>
            )}
          </Field>
          <Field label="Número de documento" required error={error || undefined}>
            {(id) => <Input id={id} value={docNumber} onChange={(e) => setDocNumber(e.target.value)} invalid={Boolean(error)} inputMode="numeric" />}
          </Field>
          <Field label="Distrito">{(id) => <Input id={id} value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Ej.: Miraflores" />}</Field>
        </FormGrid>
        <div className="rounded-lg border border-slate-200 p-3">
          <Checkbox checked={openCase && Boolean(prospect.area)} onChange={setOpenCase} label="Abrir el expediente ahora" />
          {!prospect.area ? <p className="mt-1 text-xs text-amber-700">Clasifique el área jurídica del prospecto para poder abrir el expediente.</p> : null}
          {openCase && prospect.area ? (
            <Field label="Tipo de procedimiento" className="mt-3">
              {(id) => <Input id={id} value={procedure} onChange={(e) => setProcedure(e.target.value)} />}
            </Field>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

/** Cierra un prospecto sin contratación: exige indicar el motivo. */
export function CloseProspectModal({ prospectId, onClose }: { prospectId: string | null; onClose: () => void }) {
  const state = useCrm();
  const toast = useToast();
  const prospect = state.prospects.find((p) => p.id === prospectId);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setReason('');
    setError('');
  }, [prospectId]);

  if (!prospect) return null;
  const submit = () => {
    const r = crm.moveProspect(prospect.id, 'cerrado', reason);
    if (!r.ok) return setError(r.error);
    toast.info('Prospecto cerrado', prospect.name);
    onClose();
  };
  return (
    <Modal
      open={Boolean(prospectId)}
      onClose={onClose}
      size="sm"
      title="Cerrar prospecto"
      description={`${prospect.name} saldrá del pipeline activo. Quedará el historial de contacto.`}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={submit}>
            Cerrar prospecto
          </Button>
        </>
      }
    >
      <Field label="Motivo del cierre" required error={error || undefined}>
        {(id) => <Textarea id={id} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej.: Decidió no continuar por el costo, no respondió, eligió otro estudio…" invalid={Boolean(error)} />}
      </Field>
    </Modal>
  );
}
