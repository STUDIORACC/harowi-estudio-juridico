import type { AvailabilityRule, Client, Member, Prospect } from '../types';
import { ASSISTANT, d, hist, mail, phone } from './helpers';

/* ------------------------------- Equipo ficticio ------------------------------ */

const weekdays = (days: number[], start: string, end: string): AvailabilityRule[] =>
  days.map((weekday) => ({ weekday, start, end }));

export const M = {
  jovana: 'm-jovana',
  andres: 'm-andres',
  lucia: 'm-lucia',
  mateo: 'm-mateo',
  rosa: 'm-rosa',
} as const;

export function buildMembers(): Member[] {
  return [
    {
      id: M.jovana,
      name: 'Jovana Quispe Mendoza',
      title: 'Dra.',
      role: 'Abogada · Derecho de Familia',
      kind: 'abogado',
      areas: ['familia'],
      email: mail('jovana.quispe'),
      phone: phone(11),
      availability: [
        ...weekdays([1, 2, 3, 4, 5], '09:00', '13:00'),
        ...weekdays([1, 2, 3, 4, 5], '15:00', '18:30'),
        { weekday: 6, start: '09:00', end: '12:00' },
      ],
    },
    {
      id: M.andres,
      name: 'Andrés Salazar Ríos',
      title: 'Dr.',
      role: 'Abogado · Derecho Penal',
      kind: 'abogado',
      areas: ['penal'],
      email: mail('andres.salazar'),
      phone: phone(12),
      availability: [...weekdays([1, 2, 3, 4, 5], '10:00', '13:00'), ...weekdays([1, 2, 3, 4, 5], '15:00', '19:00')],
    },
    {
      id: M.lucia,
      name: 'Lucía Paredes Cárdenas',
      title: 'Dra.',
      role: 'Abogada · Civil y Patrimonial',
      kind: 'abogado',
      areas: ['civil'],
      email: mail('lucia.paredes'),
      phone: phone(13),
      availability: [
        ...weekdays([1, 2, 3, 4], '09:00', '13:00'),
        ...weekdays([1, 2, 3, 4], '14:30', '18:00'),
        { weekday: 5, start: '09:00', end: '13:00' },
      ],
    },
    {
      id: M.mateo,
      name: 'Mateo Vargas Olivera',
      title: 'Dr.',
      role: 'Abogado · Derecho Empresarial',
      kind: 'abogado',
      areas: ['empresarial'],
      email: mail('mateo.vargas'),
      phone: phone(14),
      availability: [...weekdays([1, 2, 3, 4, 5], '09:30', '13:00'), ...weekdays([1, 2, 3, 4, 5], '15:00', '18:30')],
    },
    {
      id: M.rosa,
      name: 'Rosa Medina Cruz',
      title: 'Sra.',
      role: 'Coordinación administrativa',
      kind: 'coordinacion',
      areas: [],
      email: mail('rosa.medina'),
      phone: phone(15),
      availability: [],
    },
  ];
}

/* ------------------------------- Prospectos ------------------------------- */

type P = Omit<Prospect, 'history' | 'createdAt' | 'clientId' | 'closedReason'> & {
  clientId?: string | null;
  closedReason?: string | null;
  /** Días respecto a hoy en que se creó (negativo = pasado). */
  ago: number;
  time?: string;
  trail?: [number, string, Parameters<typeof hist>[2], string, string][];
};

const base = (n: number, v: Omit<P, 'phone' | 'email' | 'contactDate'> & { slug: string }) => {
  const { slug, ...rest } = v;
  return { ...rest, phone: phone(100 + n), email: mail(slug), contactDate: d(v.ago) } as P;
};

export function buildProspects(): Prospect[] {
  const list: P[] = [
    base(1, {
      slug: 'carmen.huaman', id: 'p01', name: 'Carmen Rosa Huamán Torres', channel: 'whatsapp', area: 'familia', serviceSlug: 'demanda-de-alimentos',
      description: 'Necesita fijar una pensión de alimentos para su hijo de 6 años; el padre no aporta desde hace cuatro meses.',
      priority: 'alta', stage: 'cita_programada', lawyerId: M.jovana, ago: -3, time: '10:12',
      nextAction: 'Confirmar asistencia a la consulta', nextActionDate: d(0),
      trail: [[-3, '10:14', 'clasificacion', 'El asistente clasificó la consulta: Derecho de Familia · Demanda de alimentos.', ASSISTANT], [-3, '10:31', 'cita', 'El asistente reservó una consulta inicial virtual.', ASSISTANT]],
    }),
    base(2, {
      slug: 'luis.chavez', id: 'p02', name: 'Luis Alberto Chávez Mamani', channel: 'web', area: 'penal', serviceSlug: 'prision-preventiva',
      description: 'La Fiscalía solicitó prisión preventiva en una investigación por estafa; requiere defensa técnica para la audiencia.',
      priority: 'urgente', stage: 'evaluacion', lawyerId: M.andres, ago: -5, time: '08:40',
      nextAction: 'Preparar la sustentación para la audiencia', nextActionDate: d(2),
      trail: [[-5, '09:05', 'derivacion', 'Consulta derivada al Dr. Andrés Salazar por urgencia.', ASSISTANT], [-4, '11:00', 'estado', 'Pasó a evaluación jurídica tras la reunión inicial.', 'Dr. Andrés Salazar']],
    }),
    base(3, {
      slug: 'rosa.quispe', id: 'p03', name: 'Rosa María Quispe Ccama', channel: 'facebook', area: 'civil', serviceSlug: 'desalojo',
      description: 'El inquilino de un local comercial dejó de pagar el alquiler hace cinco meses y no desocupa el inmueble.',
      priority: 'media', stage: 'en_atencion', lawyerId: M.lucia, ago: -26, time: '17:20',
      nextAction: 'Reagendar la consulta (no asistió)', nextActionDate: d(1),
      trail: [[-26, '17:25', 'clasificacion', 'El asistente clasificó la consulta: Derecho Civil · Desalojo.', ASSISTANT], [-2, '16:45', 'cita', 'No asistió a la consulta programada.', 'Sistema']],
    }),
    {
      ...base(3, {
        slug: 'rosa.quispe.wa', id: 'p04', name: 'Rosa M. Quispe', channel: 'whatsapp', area: 'civil', serviceSlug: 'desalojo',
        description: 'Quiere saber cómo recuperar un local comercial alquilado.',
        priority: 'media', stage: 'nuevo', lawyerId: null, ago: 0, time: '08:45',
        nextAction: 'Verificar si es la misma persona que Rosa María Quispe Ccama', nextActionDate: d(0),
      }),
      // Mismo teléfono que p03: contacto duplicado a propósito para la demostración.
    },
    base(5, {
      slug: 'pedro.ramos', id: 'p05', name: 'Pedro Antonio Ramos Flores', channel: 'web', area: 'empresarial', serviceSlug: 'constitucion-de-empresas',
      description: 'Desea constituir una SAC con un socio para una distribuidora de repuestos.',
      priority: 'media', stage: 'propuesta', lawyerId: M.mateo, ago: -29, time: '15:10',
      nextAction: 'Seguimiento de la propuesta enviada', nextActionDate: d(1),
      trail: [[-29, '15:20', 'clasificacion', 'El asistente clasificó la consulta: Derecho Empresarial · Constitución de empresas.', ASSISTANT], [-25, '12:00', 'estado', 'Se envió la propuesta de servicios.', 'Dr. Mateo Vargas']],
    }),
    base(6, {
      slug: 'milagros.soto', id: 'p06', name: 'Milagros Soto Vílchez', channel: 'whatsapp', area: 'familia', serviceSlug: 'divorcio-mutuo-acuerdo',
      description: 'Pareja separada de común acuerdo, sin hijos menores. Desean formalizar el divorcio.',
      priority: 'media', stage: 'calificado', lawyerId: M.jovana, ago: -4, time: '19:05',
      nextAction: 'Llamar para proponer fecha de consulta', nextActionDate: d(1),
      trail: [[-4, '19:12', 'clasificacion', 'El asistente clasificó la consulta: Derecho de Familia · Divorcio de mutuo acuerdo.', ASSISTANT]],
    }),
    base(7, {
      slug: 'javier.cornejo', id: 'p07', name: 'Javier Eduardo Cornejo Luna', channel: 'facebook', area: 'penal', serviceSlug: 'delitos-administracion-publica',
      description: 'Exfuncionario citado como investigado en un proceso por presunta colusión.',
      priority: 'alta', stage: 'evaluacion', lawyerId: M.andres, ago: -33, time: '10:00',
      nextAction: 'Revisar la disposición fiscal', nextActionDate: d(3),
      trail: [[-33, '10:10', 'clasificacion', 'El asistente clasificó la consulta: Derecho Penal · Delitos contra la administración pública.', ASSISTANT], [-30, '16:00', 'estado', 'Pasó a evaluación jurídica.', 'Dr. Andrés Salazar']],
    }),
    base(8, {
      slug: 'ana.barrientos', id: 'p08', name: 'Ana Lucía Barrientos Díaz', channel: 'whatsapp', area: 'familia', serviceSlug: 'tenencia',
      description: 'El padre retuvo a la niña tras el fin de semana de visitas y no la devuelve.',
      priority: 'alta', stage: 'en_atencion', lawyerId: M.jovana, ago: -2, time: '20:15',
      nextAction: 'Comunicarse hoy: pidió hablar con la abogada', nextActionDate: d(0),
      trail: [[-2, '20:20', 'clasificacion', 'El asistente clasificó la consulta: Derecho de Familia · Tenencia y régimen de visitas.', ASSISTANT], [0, '07:50', 'derivacion', 'Solicitó hablar con una persona; conversación derivada a la Dra. Jovana Quispe.', ASSISTANT]],
    }),
    base(9, {
      slug: 'henry.quispe', id: 'p09', name: 'Henry Quispe Condori', channel: 'web', area: 'civil', serviceSlug: 'prescripcion-adquisitiva',
      description: 'Posee un lote hace 18 años sin título inscrito y quiere formalizar su propiedad.',
      priority: 'baja', stage: 'propuesta', lawyerId: M.lucia, ago: -26, time: '11:30',
      nextAction: 'Seguimiento de la propuesta (sin respuesta)', nextActionDate: d(-2),
      trail: [[-20, '12:00', 'estado', 'Se envió la propuesta de servicios.', 'Dra. Lucía Paredes']],
    }),
    base(10, {
      slug: 'gabriela.salinas', id: 'p10', name: 'Gabriela Salinas Roca', channel: 'facebook', area: 'familia', serviceSlug: 'reduccion-de-alimentos',
      description: 'Perdió su empleo y no puede sostener el monto actual de la pensión de alimentos.',
      priority: 'media', stage: 'nuevo', lawyerId: null, ago: 0, time: '09:12',
      nextAction: 'Responder la consulta recibida por Messenger', nextActionDate: d(0),
    }),
    base(11, {
      slug: 'diego.fuentes', id: 'p11', name: 'Diego Fuentes Alva', channel: 'web', area: 'empresarial', serviceSlug: 'constitucion-de-empresas',
      description: 'Constitución de una empresa de servicios de ingeniería con cuatro socios.',
      priority: 'alta', stage: 'cita_programada', lawyerId: M.mateo, ago: -6, time: '14:00',
      nextAction: 'Atender la consulta inicial', nextActionDate: d(0),
      trail: [[-6, '14:08', 'clasificacion', 'El asistente clasificó la consulta: Derecho Empresarial · Constitución de empresas.', ASSISTANT], [-6, '14:25', 'cita', 'El asistente reservó una consulta inicial virtual.', ASSISTANT]],
    }),
    base(12, {
      slug: 'walter.mendoza', id: 'p12', name: 'Walter Mendoza Arce', channel: 'whatsapp', area: 'penal', serviceSlug: 'lavado-de-activos',
      description: 'Investigación por presunto lavado de activos; fue citado a declarar.',
      priority: 'alta', stage: 'cita_programada', lawyerId: M.andres, ago: -7, time: '12:30',
      nextAction: 'Reunión de evaluación con el abogado', nextActionDate: d(2),
      trail: [[-7, '12:35', 'derivacion', 'Situación delicada: derivado al Dr. Andrés Salazar.', ASSISTANT], [-6, '10:00', 'cita', 'El abogado programó una consulta inicial presencial.', 'Dr. Andrés Salazar']],
    }),
    base(13, {
      slug: 'silvia.herrera', id: 'p13', name: 'Silvia Paola Herrera Núñez', channel: 'facebook', area: 'familia', serviceSlug: 'divorcio-por-causal',
      description: 'Solicita divorcio por causal; el cónyuge se niega a firmar un acuerdo.',
      priority: 'media', stage: 'contratado', lawyerId: M.jovana, ago: -48, clientId: 'c01', time: '18:30',
      nextAction: 'Cliente contratado — expediente abierto', nextActionDate: null,
      trail: [[-48, '18:40', 'clasificacion', 'El asistente clasificó la consulta: Derecho de Familia · Divorcio por causal.', ASSISTANT], [-44, '12:00', 'estado', 'Aceptó la propuesta: convertida en cliente.', 'Dra. Jovana Quispe']],
    }),
    base(14, {
      slug: 'oscar.medina', id: 'p14', name: 'Óscar Medina Valverde', channel: 'web', area: 'civil', serviceSlug: 'remate-publico',
      description: 'Interesado en participar en un remate judicial de un inmueble.',
      priority: 'media', stage: 'contratado', lawyerId: M.lucia, ago: -80, clientId: 'c02', time: '10:15',
      nextAction: 'Cliente contratado — expediente abierto', nextActionDate: null,
      trail: [[-75, '12:00', 'estado', 'Aceptó la propuesta: convertido en cliente.', 'Dra. Lucía Paredes']],
    }),
    base(15, {
      slug: 'teresa.lozano', id: 'p15', name: 'Teresa Lozano Paredes', channel: 'whatsapp', area: 'civil', serviceSlug: 'exequatur',
      description: 'Necesita reconocer en el Perú una sentencia de divorcio dictada en el extranjero.',
      priority: 'media', stage: 'cerrado', lawyerId: M.lucia, ago: -35, closedReason: 'Decidió no continuar por el costo del trámite.', time: '13:20',
      nextAction: 'Sin acciones pendientes', nextActionDate: null,
      trail: [[-28, '15:00', 'estado', 'Cerrado: decidió no continuar por el costo del trámite.', 'Dra. Lucía Paredes']],
    }),
    base(16, {
      slug: 'cristian.vega', id: 'p16', name: 'Cristian Vega Ortiz', channel: 'facebook', area: 'penal', serviceSlug: 'derecho-penal',
      description: 'Investigado por un delito patrimonial; busca defensa técnica desde la etapa preliminar.',
      priority: 'alta', stage: 'contratado', lawyerId: M.andres, ago: -118, clientId: 'c03', time: '16:50',
      nextAction: 'Cliente contratado — expediente abierto', nextActionDate: null,
      trail: [[-115, '11:00', 'estado', 'Aceptó la propuesta: convertido en cliente.', 'Dr. Andrés Salazar']],
    }),
    base(17, {
      slug: 'fiorella.camacho', id: 'p17', name: 'Fiorella Camacho Zegarra', channel: 'web', area: 'familia', serviceSlug: 'demanda-de-alimentos',
      description: 'Solicita pensión de alimentos para su hijo; el padre aporta de forma irregular.',
      priority: 'media', stage: 'contratado', lawyerId: M.jovana, ago: -150, clientId: 'c04', time: '09:40',
      nextAction: 'Cliente contratado — expediente abierto', nextActionDate: null,
      trail: [[-146, '10:00', 'estado', 'Aceptó la propuesta: convertida en cliente.', 'Dra. Jovana Quispe']],
    }),
    base(18, {
      slug: 'manuel.ibanez', id: 'p18', name: 'Manuel Ibáñez Torres', channel: 'whatsapp', area: 'empresarial', serviceSlug: 'constitucion-de-empresas',
      description: 'Consultó por la constitución de una EIRL para un negocio de catering.',
      priority: 'baja', stage: 'cerrado', lawyerId: M.mateo, ago: -96, closedReason: 'No respondió a los intentos de contacto.', time: '12:00',
      nextAction: 'Sin acciones pendientes', nextActionDate: null,
      trail: [[-92, '09:00', 'estado', 'Cerrado: sin respuesta tras tres intentos de contacto.', 'Dr. Mateo Vargas']],
    }),
    base(19, {
      slug: 'daniela.rojas', id: 'p19', name: 'Daniela Rojas Cueva', channel: 'facebook', area: 'familia', serviceSlug: 'tenencia',
      description: 'Desea regular la tenencia y el régimen de visitas de su hijo de 4 años.',
      priority: 'media', stage: 'calificado', lawyerId: M.jovana, ago: -8, time: '21:10',
      nextAction: 'Llamar para proponer consulta', nextActionDate: d(-1),
      trail: [[-8, '21:20', 'clasificacion', 'El asistente clasificó la consulta: Derecho de Familia · Tenencia y régimen de visitas.', ASSISTANT]],
    }),
    base(20, {
      slug: 'raul.espinoza', id: 'p20', name: 'Raúl Espinoza Gutiérrez', channel: 'whatsapp', area: 'penal', serviceSlug: 'derecho-penal',
      description: 'Su hermano fue detenido por la policía y requiere un abogado penalista de manera urgente.',
      priority: 'urgente', stage: 'en_atencion', lawyerId: M.andres, ago: -1, time: '22:03',
      nextAction: 'Reunión urgente con la familia', nextActionDate: d(0),
      trail: [[-1, '22:03', 'derivacion', 'Detención reportada: derivado de inmediato al Dr. Andrés Salazar.', ASSISTANT], [-1, '22:10', 'conversacion', 'El Dr. Andrés Salazar tomó el control de la conversación.', 'Dr. Andrés Salazar']],
    }),
    base(21, {
      slug: 'karina.vidal', id: 'p21', name: 'Karina Vidal Soria', channel: 'web', area: 'civil', serviceSlug: 'prescripcion-adquisitiva',
      description: 'Consultó solo por información general sobre prescripción adquisitiva.',
      priority: 'baja', stage: 'cerrado', lawyerId: M.lucia, ago: -170, closedReason: 'Solo buscaba información general.', time: '11:00',
      nextAction: 'Sin acciones pendientes', nextActionDate: null,
    }),
    base(22, {
      slug: 'elias.rondon', id: 'p22', name: 'Elías Rondón Pacheco', channel: 'facebook', area: 'familia', serviceSlug: 'divorcio-mutuo-acuerdo',
      description: 'Consultó por un divorcio de mutuo acuerdo.',
      priority: 'baja', stage: 'cerrado', lawyerId: M.jovana, ago: -140, closedReason: 'Se reconcilió con su pareja.', time: '19:00',
      nextAction: 'Sin acciones pendientes', nextActionDate: null,
    }),
    base(23, {
      slug: 'hernan.lozada', id: 'p23', name: 'Hernán Lozada Quiroz', channel: 'web', area: 'empresarial', serviceSlug: 'constitucion-de-empresas',
      description: 'Constitución de una sociedad constructora con tres socios (Constructora Los Álamos SAC).',
      priority: 'alta', stage: 'contratado', lawyerId: M.mateo, ago: -36, clientId: 'c05', time: '10:30',
      nextAction: 'Cliente contratado — expediente abierto', nextActionDate: null,
      trail: [[-4, '12:00', 'estado', 'Aceptó la propuesta: convertido en cliente (empresa).', 'Dr. Mateo Vargas']],
    }),
    base(24, {
      slug: 'paola.ugarte', id: 'p24', name: 'Paola Ugarte Benavides', channel: 'facebook', area: 'penal', serviceSlug: 'derecho-penal',
      description: 'Consultó por una denuncia en su contra.',
      priority: 'media', stage: 'cerrado', lawyerId: M.andres, ago: -65, closedReason: 'Asumió su defensa un abogado de oficio.', time: '17:00',
      nextAction: 'Sin acciones pendientes', nextActionDate: null,
    }),
  ];

  return list.map(({ ago, time, trail, clientId, closedReason, ...p }) => ({
    ...p,
    clientId: clientId ?? null,
    closedReason: closedReason ?? null,
    createdAt: `${d(ago)}T${time ?? '10:00'}`,
    history: [
      hist(ago, time ?? '10:00', 'creacion', `Prospecto creado desde ${p.channel === 'whatsapp' ? 'WhatsApp' : p.channel === 'facebook' ? 'Facebook Messenger' : 'el formulario web'}.`, ASSISTANT),
      ...(trail ?? []).map(([n, t, k, text, by]) => hist(n, t, k, text, by)),
    ],
  }));
}

/* -------------------------------- Clientes -------------------------------- */

export function buildClients(): Client[] {
  const c = (
    n: number,
    v: Pick<Client, 'name' | 'kind' | 'docType' | 'docNumber' | 'district' | 'lawyerId' | 'status'> & {
      id: string;
      since: number;
      prospectId: string | null;
      notes: string;
      slug: string;
    },
  ): Client => ({
    id: v.id,
    name: v.name,
    kind: v.kind,
    docType: v.docType,
    docNumber: v.docNumber,
    phone: phone(200 + n),
    email: mail(v.slug),
    district: v.district,
    lawyerId: v.lawyerId,
    status: v.status,
    since: d(v.since),
    prospectId: v.prospectId,
    notes: v.notes,
  });
  return [
    c(1, { id: 'c01', slug: 'silvia.herrera', name: 'Silvia Paola Herrera Núñez', kind: 'persona', docType: 'DNI', docNumber: '40000001', district: 'Miraflores', lawyerId: M.jovana, status: 'activo', since: -44, prospectId: 'p13', notes: 'Prefiere comunicaciones por WhatsApp en horario de tarde.' }),
    c(2, { id: 'c02', slug: 'oscar.medina', name: 'Óscar Medina Valverde', kind: 'persona', docType: 'DNI', docNumber: '40000002', district: 'Surquillo', lawyerId: M.lucia, status: 'activo', since: -75, prospectId: 'p14', notes: '' }),
    c(3, { id: 'c03', slug: 'cristian.vega', name: 'Cristian Vega Ortiz', kind: 'persona', docType: 'DNI', docNumber: '40000003', district: 'San Borja', lawyerId: M.andres, status: 'activo', since: -115, prospectId: 'p16', notes: 'Solicita reuniones presenciales y reservadas.' }),
    c(4, { id: 'c04', slug: 'fiorella.camacho', name: 'Fiorella Camacho Zegarra', kind: 'persona', docType: 'DNI', docNumber: '40000004', district: 'Los Olivos', lawyerId: M.jovana, status: 'activo', since: -146, prospectId: 'p17', notes: '' }),
    c(5, { id: 'c05', slug: 'contacto.losalamos', name: 'Constructora Los Álamos SAC', kind: 'empresa', docType: 'RUC', docNumber: '20000000001', district: 'San Isidro', lawyerId: M.mateo, status: 'activo', since: -4, prospectId: 'p23', notes: 'Contacto: Hernán Lozada Quiroz (gerente).' }),
    c(6, { id: 'c06', slug: 'mercedes.aguirre', name: 'Mercedes Aguirre Landa', kind: 'persona', docType: 'DNI', docNumber: '40000006', district: 'Jesús María', lawyerId: M.jovana, status: 'activo', since: -32, prospectId: null, notes: '' }),
    c(7, { id: 'c07', slug: 'ricardo.salcedo', name: 'Ricardo Salcedo Pinto', kind: 'persona', docType: 'DNI', docNumber: '40000007', district: 'Santiago de Surco', lawyerId: M.andres, status: 'activo', since: -170, prospectId: null, notes: '' }),
    c(8, { id: 'c08', slug: 'contacto.pachacamac', name: 'Corporación Textil Pachacámac SAC', kind: 'empresa', docType: 'RUC', docNumber: '20000000002', district: 'Ate', lawyerId: M.mateo, status: 'inactivo', since: -300, prospectId: null, notes: 'Servicio de constitución concluido; sin trámites vigentes.' }),
    c(9, { id: 'c09', slug: 'elena.tapia', name: 'Elena Tapia Montalvo', kind: 'persona', docType: 'DNI', docNumber: '40000009', district: 'Barranco', lawyerId: M.lucia, status: 'inactivo', since: -420, prospectId: null, notes: 'Expediente archivado.' }),
    c(10, { id: 'c10', slug: 'victor.alarcon', name: 'Víctor Hugo Alarcón Sáenz', kind: 'persona', docType: 'CE', docNumber: '000123456', district: 'La Molina', lawyerId: M.andres, status: 'activo', since: -95, prospectId: null, notes: '' }),
    c(11, { id: 'c11', slug: 'jimena.caceres', name: 'Jimena Cáceres Bravo', kind: 'persona', docType: 'DNI', docNumber: '40000011', district: 'Magdalena del Mar', lawyerId: M.jovana, status: 'activo', since: -200, prospectId: null, notes: 'Consulta con frecuencia por WhatsApp sobre el avance de su caso.' }),
    c(12, { id: 'c12', slug: 'contacto.santabeatriz', name: 'Inmobiliaria Santa Beatriz EIRL', kind: 'empresa', docType: 'RUC', docNumber: '20000000003', district: 'Lince', lawyerId: M.lucia, status: 'activo', since: -230, prospectId: null, notes: 'Cartera de inmuebles en alquiler; consultas recurrentes por desalojo.' }),
  ];
}
