import type {
  Appointment,
  CaseFile,
  CaseStatus,
  Deadline,
  DocumentRecord,
  Task,
  TimelineEvent,
  TimelineKind,
} from '../types';
import { ASSISTANT, at, d, nid } from './helpers';
import { M } from './people';

/* ------------------------------- Expedientes ------------------------------ */

type Ev = [number, TimelineKind, string, string, string?];

const events = (list: Ev[], defaultBy: string): TimelineEvent[] =>
  list.map(([n, kind, title, detail, by]) => ({ id: nid('ev'), date: d(n), kind, title, detail, by: by ?? defaultBy }));

const deadline = (title: string, due: number, setBy: string, verified: boolean, note = '', done = false): Deadline => ({
  id: nid('dl'),
  title,
  dueDate: d(due),
  setBy,
  verified,
  note,
  done,
});

const VALERIA = 'Dra. Valeria Quispe';
const ANDRES = 'Dr. Andrés Salazar';
const LUCIA = 'Dra. Lucía Paredes';
const MATEO = 'Dr. Mateo Vargas';

export function buildCases(): CaseFile[] {
  const make = (
    v: Omit<CaseFile, 'timeline' | 'deadlines' | 'notes' | 'openedAt'> & {
      opened: number;
      status: CaseStatus;
      ev: Ev[];
      by: string;
      deadlines?: Deadline[];
      notes?: [number, string, string][];
    },
  ): CaseFile => {
    const { opened, ev, by, deadlines, notes, ...rest } = v;
    return {
      ...rest,
      openedAt: d(opened),
      timeline: events(ev, by),
      deadlines: deadlines ?? [],
      notes: (notes ?? []).map(([n, who, text]) => ({ id: nid('nt'), at: at(n, '11:00'), by: who, text })),
    };
  };

  return [
    make({
      id: 'e01', code: 'HAR-2026-001', clientId: 'c01', area: 'familia', serviceSlug: 'divorcio-por-causal',
      procedure: 'Proceso de divorcio por causal', lawyerId: M.valeria, counterparty: 'Marco Antonio Reyes Villanueva',
      courtFileNumber: '01234-2026-0-1801-JR-FC-05', court: '5.º Juzgado de Familia de Lima', status: 'tramite', opened: -44, by: VALERIA,
      description: 'Divorcio por causal de separación de hecho. El cónyuge no accedió a un acuerdo; se tramita en la vía judicial.',
      ev: [
        [-44, 'apertura', 'Apertura del expediente', 'Se firmó el contrato de servicios y se abrió el expediente.'],
        [-40, 'documento', 'Recopilación de documentos', 'La clienta entregó partida de matrimonio, DNI y constancias de separación.'],
        [-33, 'escrito', 'Presentación de la demanda', 'Se presentó la demanda de divorcio por causal ante el juzgado de familia.'],
        [-18, 'resolucion', 'Auto admisorio', 'El juzgado admitió la demanda y corrió traslado al demandado.'],
        [-6, 'notificacion', 'Notificación al demandado', 'Se confirmó la notificación al cónyuge.'],
      ],
      deadlines: [deadline('Verificar la contestación de la demanda', 6, VALERIA, true, 'Plazo verificado por la abogada según el cargo de notificación.')],
      notes: [[-6, VALERIA, 'La clienta prefiere que las audiencias se programen por la tarde. Confirmar disponibilidad antes de aceptar fecha.']],
    }),
    make({
      id: 'e02', code: 'HAR-2026-002', clientId: 'c04', area: 'familia', serviceSlug: 'demanda-de-alimentos',
      procedure: 'Proceso único de alimentos', lawyerId: M.valeria, counterparty: 'Julio César Medina Lara',
      courtFileNumber: '02876-2026-0-1801-JP-FC-02', court: '2.º Juzgado de Paz Letrado de Los Olivos', status: 'audiencia', opened: -146, by: VALERIA,
      description: 'Demanda de alimentos para un hijo menor. Se encuentra pendiente la audiencia única.',
      ev: [
        [-146, 'apertura', 'Apertura del expediente', 'Contrato firmado; se reunió la documentación de gastos.'],
        [-130, 'escrito', 'Demanda presentada', 'Se presentó la demanda con el sustento de gastos del menor.'],
        [-98, 'resolucion', 'Admisión y traslado', 'El juzgado admitió la demanda y corrió traslado.'],
        [-55, 'escrito', 'Contestación del demandado', 'El demandado contestó la demanda y ofreció medios probatorios.'],
        [-12, 'resolucion', 'Citación a audiencia única', 'El juzgado fijó fecha para la audiencia única.'],
      ],
      deadlines: [deadline('Presentar el ofrecimiento de pruebas adicionales', 2, VALERIA, true, 'Fecha ingresada por la abogada.')],
      notes: [[-3, VALERIA, 'Reunir las boletas de gastos escolares del último trimestre antes de la audiencia.']],
    }),
    make({
      id: 'e03', code: 'HAR-2026-003', clientId: 'c06', area: 'familia', serviceSlug: 'divorcio-mutuo-acuerdo',
      procedure: 'Divorcio de mutuo acuerdo (vía no contenciosa)', lawyerId: M.valeria, counterparty: 'Alberto Núñez Sosa',
      courtFileNumber: null, court: null, status: 'pendiente_doc', opened: -30, by: VALERIA,
      description: 'Divorcio de mutuo acuerdo sin hijos menores. Se espera la documentación faltante para la solicitud.',
      ev: [
        [-30, 'apertura', 'Apertura del expediente', 'Ambos cónyuges aceptaron la propuesta de servicios.'],
        [-24, 'reunion', 'Reunión con ambos cónyuges', 'Se revisaron los acuerdos sobre bienes y se definió la documentación a reunir.'],
        [-9, 'documento', 'Documentación parcial', 'Se recibió la declaración jurada de domicilio; falta el convenio firmado.'],
      ],
      deadlines: [deadline('Recibir el convenio firmado por ambos cónyuges', 4, VALERIA, false, 'Pendiente de verificación por la abogada.')],
    }),
    make({
      id: 'e04', code: 'HAR-2026-004', clientId: 'c11', area: 'familia', serviceSlug: 'tenencia',
      procedure: 'Tenencia y régimen de visitas', lawyerId: M.valeria, counterparty: 'Pablo Andrés Ledesma Rivas',
      courtFileNumber: '00911-2026-0-1801-JR-FC-03', court: '3.º Juzgado de Familia de Lima', status: 'tramite', opened: -200, by: VALERIA,
      description: 'Proceso de tenencia con régimen de visitas. Se subsana una observación del juzgado.',
      ev: [
        [-200, 'apertura', 'Apertura del expediente', 'Contrato firmado.'],
        [-170, 'escrito', 'Demanda presentada', 'Se presentó la demanda de tenencia.'],
        [-120, 'audiencia', 'Audiencia de saneamiento', 'Se fijaron los puntos controvertidos.'],
        [-60, 'resolucion', 'Informe psicológico', 'El juzgado dispuso evaluaciones psicológicas.'],
        [-4, 'notificacion', 'Observación del juzgado', 'El juzgado observó un escrito y concedió plazo para subsanar.'],
      ],
      deadlines: [deadline('Subsanar la observación del juzgado', -1, VALERIA, true, 'Fecha ingresada por la abogada. Verificar con urgencia.')],
      notes: [[-4, VALERIA, 'Pendiente de adjuntar constancia de la evaluación psicológica.']],
    }),
    make({
      id: 'e05', code: 'HAR-2026-005', clientId: 'c03', area: 'penal', serviceSlug: 'derecho-penal',
      procedure: 'Defensa en proceso penal', lawyerId: M.andres, counterparty: 'Ministerio Público',
      courtFileNumber: '00457-2026-0-1801-JR-PE-12', court: '12.º Juzgado Penal de Lima', status: 'audiencia', opened: -115, by: ANDRES,
      description: 'Defensa técnica en un proceso por delito patrimonial. Audiencia programada.',
      ev: [
        [-115, 'apertura', 'Apertura del expediente', 'Se asumió la defensa desde la etapa preliminar.'],
        [-100, 'escrito', 'Escrito de apersonamiento', 'Se presentó el apersonamiento y se solicitó copia de la carpeta fiscal.'],
        [-70, 'documento', 'Revisión de la carpeta fiscal', 'Se elaboró un informe de revisión de la carpeta.'],
        [-30, 'resolucion', 'Formalización de la investigación', 'La Fiscalía formalizó la investigación.'],
        [-8, 'resolucion', 'Resolución desfavorable', 'Se notificó una resolución que será materia de apelación.'],
      ],
      deadlines: [deadline('Presentar el recurso de apelación', 1, ANDRES, true, 'Plazo verificado por el abogado a cargo.')],
      notes: [[-8, ANDRES, 'Coordinar con el cliente la reunión previa a la audiencia. Mantener reserva de la información.']],
    }),
    make({
      id: 'e06', code: 'HAR-2026-006', clientId: 'c07', area: 'penal', serviceSlug: 'prision-preventiva',
      procedure: 'Defensa frente a requerimiento de prisión preventiva', lawyerId: M.andres, counterparty: 'Ministerio Público',
      courtFileNumber: null, court: '4.º Juzgado de Investigación Preparatoria', status: 'resuelto', opened: -165, by: ANDRES,
      description: 'Se asumió la defensa frente al requerimiento. El juzgado declaró infundado el pedido.',
      ev: [
        [-165, 'apertura', 'Apertura del expediente', 'Se asumió la defensa en el requerimiento.'],
        [-163, 'audiencia', 'Audiencia de prisión preventiva', 'Se sustentó la defensa en audiencia.'],
        [-162, 'resolucion', 'Resolución', 'El juzgado declaró infundado el requerimiento.'],
        [-30, 'nota', 'Cierre administrativo', 'Se archivó la documentación y se informó al cliente.'],
      ],
    }),
    make({
      id: 'e07', code: 'HAR-2026-007', clientId: 'c10', area: 'penal', serviceSlug: 'delitos-administracion-publica',
      procedure: 'Defensa en investigación por delitos contra la administración pública', lawyerId: M.andres, counterparty: 'Ministerio Público',
      courtFileNumber: null, court: 'Fiscalía Especializada en Delitos de Corrupción', status: 'evaluacion', opened: -95, by: ANDRES,
      description: 'Revisión integral de la carpeta fiscal y de los informes periciales antes de fijar la estrategia.',
      ev: [
        [-95, 'apertura', 'Apertura del expediente', 'Se asumió la defensa del cliente.'],
        [-80, 'documento', 'Solicitud de copias', 'Se solicitó copia íntegra de la carpeta fiscal.'],
        [-45, 'documento', 'Informe pericial contable', 'Se recibió el informe de un perito de parte.'],
        [-10, 'reunion', 'Reunión de estrategia', 'Se revisaron los escenarios con el cliente.'],
      ],
      deadlines: [deadline('Presentar descargos escritos', 9, ANDRES, true, 'Fecha ingresada por el abogado.')],
    }),
    make({
      id: 'e08', code: 'HAR-2026-008', clientId: 'c02', area: 'civil', serviceSlug: 'remate-publico',
      procedure: 'Participación en remate judicial', lawyerId: M.lucia, counterparty: 'Banco acreedor (ejecutante)',
      courtFileNumber: '03310-2025-0-1801-JR-CO-04', court: '4.º Juzgado Civil Subespecializado Comercial', status: 'tramite', opened: -75, by: LUCIA,
      description: 'Asesoría al postor: revisión de bases, estado registral del inmueble y trámites posteriores a la adjudicación.',
      ev: [
        [-75, 'apertura', 'Apertura del expediente', 'Contrato firmado.'],
        [-60, 'documento', 'Estudio de títulos', 'Se revisó la partida registral y las cargas del inmueble.'],
        [-35, 'documento', 'Bases del remate', 'Se analizaron las bases y las condiciones de participación.'],
        [-14, 'reunion', 'Reunión con el cliente', 'Se definió el tope de la oferta.'],
      ],
      deadlines: [deadline('Verificar la fecha del remate', 5, LUCIA, true, 'Fecha ingresada por la abogada según el edicto.')],
    }),
    make({
      id: 'e09', code: 'HAR-2025-031', clientId: 'c09', area: 'civil', serviceSlug: 'prescripcion-adquisitiva',
      procedure: 'Prescripción adquisitiva de dominio', lawyerId: M.lucia, counterparty: 'Propietario registral',
      courtFileNumber: '00128-2024-0-1801-JR-CI-09', court: '9.º Juzgado Civil de Lima', status: 'archivado', opened: -410, by: LUCIA,
      description: 'Proceso concluido con sentencia consentida e inscripción registral de la propiedad.',
      ev: [
        [-410, 'apertura', 'Apertura del expediente', 'Contrato firmado.'],
        [-300, 'resolucion', 'Sentencia', 'Se declaró fundada la demanda.'],
        [-250, 'resolucion', 'Sentencia consentida', 'La sentencia quedó firme.'],
        [-220, 'nota', 'Expediente archivado', 'Se inscribió la propiedad y se archivó el expediente.'],
      ],
    }),
    make({
      id: 'e10', code: 'HAR-2026-010', clientId: 'c05', area: 'empresarial', serviceSlug: 'constitucion-de-empresas',
      procedure: 'Constitución de sociedad anónima cerrada', lawyerId: M.mateo, counterparty: 'No aplica',
      courtFileNumber: null, court: null, status: 'nuevo', opened: -3, by: MATEO,
      description: 'Constitución de la sociedad con tres socios. Redacción de minuta y estatuto, escritura pública e inscripción.',
      ev: [
        [-3, 'apertura', 'Apertura del expediente', 'Propuesta aceptada; se inició la recopilación de datos de los socios.'],
        [-2, 'reunion', 'Firma del contrato de servicios', 'Se firmó el contrato y se acordó el cronograma.'],
      ],
      notes: [[-2, MATEO, 'Pendiente confirmar el reparto de participaciones entre los tres socios.']],
    }),
  ];
}

/* ---------------------------------- Citas --------------------------------- */

export function buildAppointments(): Appointment[] {
  const a = (
    id: string,
    v: Pick<Appointment, 'kind' | 'lawyerId' | 'area' | 'serviceSlug' | 'time' | 'durationMin' | 'modality' | 'status' | 'notes' | 'source'> & {
      day: number;
      prospectId?: string;
      clientId?: string;
      caseId?: string;
      created?: number;
    },
  ): Appointment => ({
    id,
    kind: v.kind,
    prospectId: v.prospectId ?? null,
    clientId: v.clientId ?? null,
    caseId: v.caseId ?? null,
    lawyerId: v.lawyerId,
    area: v.area,
    serviceSlug: v.serviceSlug,
    date: d(v.day),
    time: v.time,
    durationMin: v.durationMin,
    modality: v.modality,
    status: v.status,
    notes: v.notes,
    source: v.source,
    reminderWhatsapp: v.status === 'pendiente' || v.status === 'confirmada',
    reminderEmail: false,
    createdAt: at(v.created ?? Math.min(v.day, 0) - 1, '10:00'),
  });

  return [
    a('a01', { day: 1, time: '15:00', kind: 'consulta_inicial', prospectId: 'p01', lawyerId: M.valeria, area: 'familia', serviceSlug: 'demanda-de-alimentos', durationMin: 45, modality: 'virtual', status: 'pendiente', notes: 'Reservada por el asistente desde WhatsApp.', source: 'asistente', created: -3 }),
    a('a02', { day: 0, time: '11:30', kind: 'estrategia', clientId: 'c03', caseId: 'e05', lawyerId: M.andres, area: 'penal', serviceSlug: 'derecho-penal', durationMin: 60, modality: 'presencial', status: 'confirmada', notes: 'Preparar la apelación y la audiencia.', source: 'manual' }),
    a('a03', { day: 0, time: '16:00', kind: 'consulta_inicial', prospectId: 'p11', lawyerId: M.mateo, area: 'empresarial', serviceSlug: 'constitucion-de-empresas', durationMin: 45, modality: 'virtual', status: 'confirmada', notes: 'Reservada por el asistente desde el chat web.', source: 'asistente', created: -6 }),
    a('a04', { day: 0, time: '17:00', kind: 'seguimiento', clientId: 'c04', caseId: 'e02', lawyerId: M.valeria, area: 'familia', serviceSlug: 'demanda-de-alimentos', durationMin: 30, modality: 'virtual', status: 'pendiente', notes: 'Repaso previo a la audiencia única.', source: 'manual' }),
    a('a05', { day: 1, time: '09:30', kind: 'revision_documentos', clientId: 'c02', caseId: 'e08', lawyerId: M.lucia, area: 'civil', serviceSlug: 'remate-publico', durationMin: 45, modality: 'presencial', status: 'confirmada', notes: 'Revisión de las bases del remate.', source: 'manual' }),
    a('a06', { day: 3, time: '10:00', kind: 'audiencia', clientId: 'c04', caseId: 'e02', lawyerId: M.valeria, area: 'familia', serviceSlug: 'demanda-de-alimentos', durationMin: 90, modality: 'presencial', status: 'confirmada', notes: 'Audiencia única — 2.º Juzgado de Paz Letrado de Los Olivos. Fecha ingresada por la abogada.', source: 'manual' }),
    a('a07', { day: 2, time: '15:30', kind: 'consulta_inicial', prospectId: 'p12', lawyerId: M.andres, area: 'penal', serviceSlug: 'lavado-de-activos', durationMin: 45, modality: 'presencial', status: 'confirmada', notes: 'Programada por el abogado tras la derivación.', source: 'manual', created: -6 }),
    a('a08', { day: 5, time: '09:00', kind: 'audiencia', clientId: 'c03', caseId: 'e05', lawyerId: M.andres, area: 'penal', serviceSlug: 'derecho-penal', durationMin: 90, modality: 'presencial', status: 'confirmada', notes: 'Audiencia — 12.º Juzgado Penal de Lima. Fecha ingresada por el abogado.', source: 'manual' }),
    a('a09', { day: -1, time: '12:00', kind: 'consulta_inicial', prospectId: 'p06', lawyerId: M.valeria, area: 'familia', serviceSlug: 'divorcio-mutuo-acuerdo', durationMin: 45, modality: 'virtual', status: 'atendida', notes: 'Se explicó la vía de mutuo acuerdo. Pendiente evaluar propuesta.', source: 'asistente', created: -4 }),
    a('a10', { day: -2, time: '16:00', kind: 'consulta_inicial', prospectId: 'p03', lawyerId: M.lucia, area: 'civil', serviceSlug: 'desalojo', durationMin: 45, modality: 'presencial', status: 'no_asistio', notes: 'No se presentó ni respondió al recordatorio.', source: 'asistente', created: -5 }),
    a('a11', { day: -3, time: '10:00', kind: 'firma', clientId: 'c05', caseId: 'e10', lawyerId: M.mateo, area: 'empresarial', serviceSlug: 'constitucion-de-empresas', durationMin: 30, modality: 'presencial', status: 'atendida', notes: 'Firma del contrato de servicios.', source: 'manual' }),
    a('a12', { day: 1, time: '12:00', kind: 'consulta_inicial', prospectId: 'p02', lawyerId: M.andres, area: 'penal', serviceSlug: 'prision-preventiva', durationMin: 45, modality: 'presencial', status: 'cancelada', notes: 'Reprogramada: el cliente solicitó una reunión de preparación más cercana a la audiencia.', source: 'manual', created: -4 }),
  ];
}

/* --------------------------------- Tareas --------------------------------- */

export function buildTasks(): Task[] {
  const t = (
    id: string,
    v: Pick<Task, 'title' | 'description' | 'relatedType' | 'relatedId' | 'assigneeId' | 'priority' | 'status'> & {
      due: number;
      reminder?: boolean;
      done?: number;
      by?: string;
    },
  ): Task => ({
    id,
    title: v.title,
    description: v.description,
    relatedType: v.relatedType,
    relatedId: v.relatedId,
    assigneeId: v.assigneeId,
    priority: v.priority,
    dueDate: d(v.due),
    status: v.status,
    reminder: v.reminder ?? true,
    createdAt: at(Math.min(v.due, 0) - 3, '09:00'),
    history: [
      { at: at(Math.min(v.due, 0) - 3, '09:00'), by: v.by ?? 'Rosa Medina', text: 'Tarea creada.' },
      ...(v.done !== undefined ? [{ at: at(v.done, '17:30'), by: 'Rosa Medina', text: 'Marcada como completada.' }] : []),
    ],
  });
  return [
    t('t01', { title: 'Llamar a Rosa María Quispe para reagendar la consulta', description: 'No asistió a la cita; proponer dos horarios nuevos.', relatedType: 'prospecto', relatedId: 'p03', assigneeId: M.rosa, priority: 'alta', status: 'pendiente', due: 1 }),
    t('t02', { title: 'Preparar propuesta de servicios para Diego Fuentes', description: 'Constitución de empresa con cuatro socios. Incluir cronograma.', relatedType: 'prospecto', relatedId: 'p11', assigneeId: M.mateo, priority: 'media', status: 'pendiente', due: 3 }),
    t('t03', { title: 'Confirmar asistencia de Carmen Rosa Huamán', description: 'Recordatorio por WhatsApp un día antes de la consulta.', relatedType: 'prospecto', relatedId: 'p01', assigneeId: M.rosa, priority: 'alta', status: 'pendiente', due: 0 }),
    t('t04', { title: 'Revisar la documentación del divorcio de Mercedes Aguirre', description: 'Verificar que el convenio y la declaración jurada estén completos.', relatedType: 'expediente', relatedId: 'e03', assigneeId: M.valeria, priority: 'media', status: 'en_curso', due: 2 }),
    t('t05', { title: 'Preparar la audiencia única de alimentos', description: 'Ordenar medios probatorios y repasar el interrogatorio con la clienta.', relatedType: 'expediente', relatedId: 'e02', assigneeId: M.valeria, priority: 'alta', status: 'en_curso', due: 2 }),
    t('t06', { title: 'Revisar el expediente: observación del juzgado', description: 'Subsanar la observación y presentar el escrito. Verificar el plazo en el cargo de notificación.', relatedType: 'expediente', relatedId: 'e04', assigneeId: M.valeria, priority: 'alta', status: 'pendiente', due: -1 }),
    t('t07', { title: 'Preparar la sustentación para la audiencia', description: 'Requerimiento de prisión preventiva: reunir documentación de arraigo.', relatedType: 'prospecto', relatedId: 'p02', assigneeId: M.andres, priority: 'urgente', status: 'en_curso', due: 1 }),
    t('t08', { title: 'Revisar la disposición fiscal de Javier Cornejo', description: 'Identificar hechos imputados y elementos de convicción.', relatedType: 'prospecto', relatedId: 'p07', assigneeId: M.andres, priority: 'alta', status: 'pendiente', due: 2 }),
    t('t09', { title: 'Presentar el recurso de apelación', description: 'Plazo verificado por el abogado. Adjuntar los anexos revisados.', relatedType: 'expediente', relatedId: 'e05', assigneeId: M.andres, priority: 'alta', status: 'pendiente', due: 1 }),
    t('t10', { title: 'Reunión urgente con la familia de Raúl Espinoza', description: 'Recoger datos de la persona detenida y definir la primera actuación.', relatedType: 'prospecto', relatedId: 'p20', assigneeId: M.andres, priority: 'urgente', status: 'en_curso', due: 0 }),
    t('t11', { title: 'Coordinar la tasación y las bases del remate', description: 'Confirmar fecha del remate con el juzgado.', relatedType: 'expediente', relatedId: 'e08', assigneeId: M.lucia, priority: 'media', status: 'pendiente', due: 5 }),
    t('t12', { title: 'Solicitar partidas registrales actualizadas', description: 'Del inmueble materia del remate.', relatedType: 'expediente', relatedId: 'e08', assigneeId: M.rosa, priority: 'media', status: 'pendiente', due: 4 }),
    t('t13', { title: 'Seguimiento de la propuesta de Henry Quispe', description: 'Sin respuesta desde hace dos semanas. Llamar y reenviar la propuesta.', relatedType: 'prospecto', relatedId: 'p09', assigneeId: M.lucia, priority: 'media', status: 'pendiente', due: -2 }),
    t('t14', { title: 'Redactar la minuta y el estatuto', description: 'Constructora Los Álamos SAC: borrador para revisión de los socios.', relatedType: 'expediente', relatedId: 'e10', assigneeId: M.mateo, priority: 'alta', status: 'en_curso', due: 3 }),
    t('t15', { title: 'Llamar a Daniela Rojas para proponer la consulta', description: 'Quedó calificada; falta ofrecerle fecha.', relatedType: 'prospecto', relatedId: 'p19', assigneeId: M.rosa, priority: 'media', status: 'pendiente', due: -1 }),
    t('t16', { title: 'Archivar el expediente resuelto de Ricardo Salcedo', description: 'Cierre administrativo y devolución de originales.', relatedType: 'expediente', relatedId: 'e06', assigneeId: M.rosa, priority: 'baja', status: 'completada', due: -2, done: -2 }),
    t('t17', { title: 'Actualizar los datos de contacto de Fiorella Camacho', description: 'Nuevo correo y dirección para notificaciones.', relatedType: 'cliente', relatedId: 'c04', assigneeId: M.rosa, priority: 'baja', status: 'pendiente', due: 6 }),
  ];
}

/* -------------------------------- Documentos ------------------------------ */

export function buildDocuments(): DocumentRecord[] {
  const doc = (
    id: string,
    name: string,
    category: string,
    sizeKb: number,
    ago: number,
    by: string,
    link: { clientId?: string; caseId?: string },
    note = '',
  ): DocumentRecord => ({
    id,
    name,
    ext: name.split('.').pop()?.toLowerCase() ?? 'pdf',
    category,
    sizeKb,
    uploadedAt: at(ago, '11:15'),
    uploadedBy: by,
    clientId: link.clientId ?? null,
    caseId: link.caseId ?? null,
    note,
  });
  return [
    doc('d01', 'DNI - Silvia Herrera.pdf', 'Identidad', 120, -44, 'Rosa Medina', { clientId: 'c01', caseId: 'e01' }),
    doc('d02', 'Partida de matrimonio.pdf', 'Identidad', 210, -40, 'Rosa Medina', { clientId: 'c01', caseId: 'e01' }),
    doc('d03', 'Demanda de divorcio por causal (borrador).docx', 'Escritos', 84, -35, 'Dra. Valeria Quispe', { clientId: 'c01', caseId: 'e01' }, 'Borrador revisado con la clienta.'),
    doc('d04', 'Partida de nacimiento del menor.pdf', 'Identidad', 180, -146, 'Rosa Medina', { clientId: 'c04', caseId: 'e02' }),
    doc('d05', 'Boletas de gastos escolares.pdf', 'Comprobantes', 1450, -20, 'Fiorella Camacho', { clientId: 'c04', caseId: 'e02' }, 'Subido por la clienta.'),
    doc('d06', 'Escrito de ofrecimiento de pruebas.docx', 'Escritos', 96, -9, 'Dra. Valeria Quispe', { clientId: 'c04', caseId: 'e02' }),
    doc('d07', 'Acta de conciliación previa.pdf', 'Resoluciones', 330, -140, 'Rosa Medina', { clientId: 'c04', caseId: 'e02' }),
    doc('d08', 'Carpeta fiscal - disposición N.° 02 (copia).pdf', 'Resoluciones', 2480, -30, 'Dr. Andrés Salazar', { clientId: 'c03', caseId: 'e05' }, 'Documento reservado.'),
    doc('d09', 'Recurso de apelación (borrador).docx', 'Escritos', 112, -2, 'Dr. Andrés Salazar', { clientId: 'c03', caseId: 'e05' }),
    doc('d10', 'Informe pericial contable.pdf', 'Pruebas', 3120, -45, 'Dr. Andrés Salazar', { clientId: 'c10', caseId: 'e07' }, 'Documento reservado.'),
    doc('d11', 'Poder de representación.pdf', 'Identidad', 140, -95, 'Rosa Medina', { clientId: 'c10', caseId: 'e07' }),
    doc('d12', 'Contrato de arrendamiento - local comercial.pdf', 'Contratos', 540, -120, 'Dra. Lucía Paredes', { clientId: 'c12' }),
    doc('d13', 'Bases del remate.pdf', 'Resoluciones', 760, -35, 'Dra. Lucía Paredes', { clientId: 'c02', caseId: 'e08' }),
    doc('d14', 'Partida registral del inmueble.pdf', 'Pruebas', 410, -60, 'Rosa Medina', { clientId: 'c02', caseId: 'e08' }),
    doc('d15', 'Minuta de constitución (borrador).docx', 'Contratos', 140, -1, 'Dr. Mateo Vargas', { clientId: 'c05', caseId: 'e10' }),
    doc('d16', 'Vigencia de poder del gerente.pdf', 'Identidad', 90, -3, 'Rosa Medina', { clientId: 'c05', caseId: 'e10' }),
    doc('d17', 'Cronograma de aportes de capital.xlsx', 'Comprobantes', 28, -2, 'Dr. Mateo Vargas', { clientId: 'c05', caseId: 'e10' }),
    doc('d18', 'Sentencia de tenencia (copia certificada).pdf', 'Resoluciones', 520, -60, 'Dra. Valeria Quispe', { clientId: 'c11', caseId: 'e04' }),
    doc('d19', 'Fotografías del predio.jpg', 'Pruebas', 2100, -405, 'Dra. Lucía Paredes', { clientId: 'c09', caseId: 'e09' }),
    doc('d20', 'Declaración jurada de domicilio.pdf', 'Identidad', 75, -9, 'Rosa Medina', { clientId: 'c06', caseId: 'e03' }),
    doc('d21', 'Convenio regulador de bienes (borrador).docx', 'Contratos', 102, -12, 'Dra. Valeria Quispe', { clientId: 'c06', caseId: 'e03' }, 'Falta la firma de ambos cónyuges.'),
    doc('d22', 'Resolución que declara infundado el pedido.pdf', 'Resoluciones', 260, -162, 'Dr. Andrés Salazar', { clientId: 'c07', caseId: 'e06' }),
  ];
}

export { ASSISTANT };
