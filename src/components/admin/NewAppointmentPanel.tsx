'use client';

import { useState } from 'react';
import { AdminForm } from './AdminForm';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { createAppointment } from '@/app/actions/admin';
import { APPOINTMENT_STATUSES, type Lawyer, type PracticeArea, type Service } from '@/types';

/** Alta manual de citas desde el panel, con el servicio dependiente del área. */
export function NewAppointmentPanel({
  areas,
  services,
  lawyers,
}: {
  areas: PracticeArea[];
  services: Service[];
  lawyers: Lawyer[];
}) {
  const [areaId, setAreaId] = useState('');
  const areaServices = services.filter((service) => service.area_id === areaId);

  return (
    <AdminForm action={createAppointment} submitLabel="Crear cita">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre del solicitante" htmlFor="new_full_name" required>
          <Input id="new_full_name" name="full_name" placeholder="Nombres y apellidos" required />
        </Field>

        <Field label="Teléfono" htmlFor="new_phone" required>
          <Input id="new_phone" name="phone" type="tel" placeholder="999 999 999" required />
        </Field>

        <Field label="Correo electrónico" htmlFor="new_email" required>
          <Input id="new_email" name="email" type="email" placeholder="nombre@correo.com" required />
        </Field>

        <Field label="Abogado" htmlFor="new_lawyer">
          <Select id="new_lawyer" name="lawyer_id" defaultValue="">
            <option value="">Sin asignar</option>
            {lawyers.map((lawyer) => (
              <option key={lawyer.id} value={lawyer.id}>
                {lawyer.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Área" htmlFor="new_area">
          <Select
            id="new_area"
            name="area_id"
            value={areaId}
            onChange={(event) => setAreaId(event.target.value)}
          >
            <option value="">Sin área</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Servicio" htmlFor="new_service">
          <Select id="new_service" name="service_id" defaultValue="" disabled={!areaId}>
            <option value="">Sin servicio</option>
            {areaServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Fecha" htmlFor="new_date" required>
          <Input id="new_date" name="scheduled_date" type="date" required />
        </Field>

        <Field label="Hora" htmlFor="new_time" required>
          <Input id="new_time" name="scheduled_time" type="time" required />
        </Field>

        <Field label="Duración (minutos)" htmlFor="new_duration">
          <Input id="new_duration" name="duration_minutes" type="number" min={15} step={15} defaultValue={45} />
        </Field>

        <Field label="Modalidad" htmlFor="new_modality" required>
          <Select id="new_modality" name="modality" defaultValue="presencial">
            <option value="presencial">Presencial</option>
            <option value="virtual">Virtual</option>
          </Select>
        </Field>

        <Field label="Estado inicial" htmlFor="new_status" required>
          <Select id="new_status" name="status" defaultValue="confirmada">
            {APPOINTMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Asunto" htmlFor="new_subject">
          <Input id="new_subject" name="subject" placeholder="Motivo de la reunión" />
        </Field>
      </div>

      <Field label="Notas internas" htmlFor="new_notes">
        <Textarea id="new_notes" name="admin_notes" rows={2} />
      </Field>
    </AdminForm>
  );
}
