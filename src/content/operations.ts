import type { AppointmentWithRelations, ConsultationWithRelations } from '@/types';

/**
 * Consultas y citas: se registran desde el sitio y se gestionan en /admin.
 * Antes de conectar la base de datos no hay registros que mostrar.
 */
export const demoConsultations: ConsultationWithRelations[] = [];

export const demoAppointments: AppointmentWithRelations[] = [];
