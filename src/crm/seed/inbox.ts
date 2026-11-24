import { emptySession } from '../assistant/session';
import { capitalize, formatDate, formatTime12 } from '../lib/dates';
import type {
  ActivityEntry,
  AssistantSession,
  ChannelId,
  Conversation,
  ConversationPriority,
  ConversationStatus,
  KbEntry,
  Message,
  MessageAuthor,
  Notification,
} from '../types';
import { ASSISTANT, at, d, nid, phone } from './helpers';
import { M } from './people';

type Draft = [MessageAuthor, string, number, string, (string | null)?, Message['card']?];

const messages = (list: Draft[]): Message[] =>
  list.map(([from, text, n, time, authorId, card]) => ({
    id: nid('ms'),
    from,
    authorId: authorId ?? null,
    text,
    at: at(n, time),
    ...(card ? { card } : {}),
  }));

const session = (patch: Partial<AssistantSession>): AssistantSession => ({ ...emptySession(), greeted: true, ...patch });

const GREET = 'Soy el asistente virtual de HAROWI Estudio Jurídico. Puedo orientarle sobre nuestros servicios y coordinar una consulta con un abogado.';

const slotLine = (n: number, day: number, time: string) =>
  `${n}. ${capitalize(formatDate(d(day), 'weekday'))}, ${formatTime12(time)}`;

export function buildConversations(): Conversation[] {
  const conv = (
    id: string,
    v: {
      channel: ChannelId;
      contactName: string;
      handle: string;
      prospectId?: string;
      clientId?: string;
      status: ConversationStatus;
      priority?: ConversationPriority;
      pending?: boolean;
      mode: 'auto' | 'manual';
      assignedTo?: string;
      unread?: number;
      summary?: string;
      handoffReason?: string;
      session: AssistantSession;
      msgs: Draft[];
    },
  ): Conversation => {
    const msgs = messages(v.msgs);
    return {
      id,
      channel: v.channel,
      contactName: v.contactName,
      contactHandle: v.handle,
      prospectId: v.prospectId ?? null,
      clientId: v.clientId ?? null,
      status: v.status,
      priority: v.priority ?? 'normal',
      pending: v.pending ?? false,
      mode: v.mode,
      assignedTo: v.assignedTo ?? null,
      unread: v.unread ?? 0,
      messages: msgs,
      ai: v.session,
      summary: v.summary ?? null,
      handoffReason: v.handoffReason ?? null,
      lastMessageAt: msgs[msgs.length - 1]?.at ?? at(0, '08:00'),
      createdAt: msgs[0]?.at ?? at(0, '08:00'),
      origin: 'datos',
    };
  };

  const A = 'assistant' as const;
  const C = 'contact' as const;
  const G = 'agent' as const;
  const S = 'system' as const;

  return [
    conv('v01', {
      channel: 'whatsapp', contactName: 'Carmen Rosa Huamán', handle: phone(101), prospectId: 'p01', status: 'ia', mode: 'auto', assignedTo: M.jovana,
      session: session({
        stage: 'reservado', area: 'familia', serviceSlug: 'demanda-de-alimentos', modality: 'virtual', lawyerId: M.jovana, appointmentId: 'a01', prospectId: 'p01', turns: 8, bookingRequested: true,
        data: { name: 'Carmen Rosa Huamán Torres', phone: phone(101), email: 'carmen.huaman@example.com', description: 'Necesita fijar una pensión de alimentos para su hijo de 6 años.' },
        chosen: { date: d(1), time: '15:00', lawyerId: M.jovana },
      }),
      msgs: [
        [C, 'Hola, buenos días. Quisiera saber si ustedes ven demandas de alimentos. El papá de mi hijo no me pasa nada desde hace 4 meses.', -3, '10:12'],
        [A, `Buenos días. ${GREET}`, -3, '10:12'],
        [A, 'Entiendo. Por lo que me comenta, su consulta corresponde al área de Derecho de Familia, en el servicio de «Demanda de alimentos».', -3, '10:12'],
        [A, 'Solicitud judicial de una pensión de alimentos para hijos menores, hijos mayores que estudian u otros beneficiarios previstos por ley. Le comparto información general: el abogado evaluará los detalles de su caso concreto.', -3, '10:12'],
        [A, 'Para registrar su consulta y que el abogado la revise con anticipación, ¿me indica su nombre completo?', -3, '10:12'],
        [C, 'Carmen Rosa Huamán Torres', -3, '10:14'],
        [A, '¿Podemos contactarle a este mismo número de WhatsApp (+51 900 000 101) o prefiere dejarme otro?', -3, '10:14'],
        [C, 'Sí, este mismo está bien', -3, '10:15'],
        [A, 'Si desea, déjeme un correo electrónico para enviarle la confirmación. Es opcional: puede responder «omitir».', -3, '10:15'],
        [C, 'carmen.huaman@example.com', -3, '10:17'],
        [A, 'Gracias, Carmen. Ya registré su consulta en nuestro sistema como Derecho de Familia · Demanda de alimentos. La Dra. Jovana Quispe será quien la revise.', -3, '10:17'],
        [A, '¿Le gustaría que coordine una consulta con la Dra. Jovana Quispe, de nuestro equipo de Familia?', -3, '10:17'],
        [C, 'Sí por favor, lo antes posible', -3, '10:20'],
        [A, 'Perfecto. Con gusto coordino su consulta.', -3, '10:20'],
        [A, '¿Prefiere una consulta presencial en nuestra oficina de San Isidro o virtual por videollamada?', -3, '10:20'],
        [C, 'Virtual, trabajo todo el día', -3, '10:22'],
        [A, `Estos son los próximos horarios disponibles con la Dra. Jovana Quispe para una consulta virtual de 45 minutos:\n\n${slotLine(1, 1, '09:00')}\n${slotLine(2, 1, '15:00')}\n${slotLine(3, 2, '10:00')}\n\n¿Cuál le acomoda? También puede indicarme otro día u hora.`, -3, '10:22'],
        [C, 'La 2 por favor', -3, '10:28'],
        [A, `Listo, su consulta quedó reservada para el ${formatDate(d(1), 'weekday')} a las ${formatTime12('15:00')} con la Dra. Jovana Quispe (virtual). Le enviaremos el enlace de la videollamada por este chat antes de la cita.`, -3, '10:28', null, { kind: 'booking', appointmentId: 'a01' }],
        [A, 'Ya avisé a la Dra. Jovana Quispe y recibirá un recordatorio por este mismo canal. ¿Desea que le indique qué documentos conviene reunir para la consulta, o tiene alguna otra duda?', -3, '10:28'],
      ],
    }),

    conv('v02', {
      channel: 'whatsapp', contactName: 'Raúl Espinoza', handle: phone(120), prospectId: 'p20', status: 'abogado', priority: 'urgente', mode: 'manual', assignedTo: M.andres, unread: 1,
      handoffReason: 'Detención reportada: derivación inmediata.',
      summary: 'Raúl Espinoza Gutiérrez (WhatsApp) reporta que su hermano fue detenido por la policía y solicita un abogado penalista de manera urgente. Clasificado como Derecho Penal · Defensa penal, prioridad URGENTE. Derivado de inmediato al Dr. Andrés Salazar. No se solicitaron más datos: pendiente de contacto humano.',
      session: session({ stage: 'derivado', area: 'penal', serviceSlug: 'derecho-penal', urgent: true, lawyerId: M.andres, prospectId: 'p20', turns: 1, data: { name: 'Raúl Espinoza Gutiérrez', phone: phone(120), description: 'Su hermano fue detenido por la policía y requiere un abogado penalista urgente.' } }),
      msgs: [
        [C, 'Buenas noches, mi hermano acaba de ser detenido por la policía. Necesito un abogado penalista urgente por favor', -1, '22:03'],
        [A, 'Lamento la situación, Raúl. Por su urgencia, no voy a continuar con preguntas: derivo su caso ahora mismo al Dr. Andrés Salazar.', -1, '22:03'],
        [A, 'Ya registré su consulta como URGENTE y avisé al abogado. La atención automática queda detenida y le responderá una persona por este mismo chat. Si puede, indíquenos su nombre completo y, si se trata de una detención, el nombre de la persona detenida y la dependencia donde se encuentra.', -1, '22:03', null, { kind: 'handoff' }],
        [S, 'Conversación derivada al Dr. Andrés Salazar · Prioridad urgente · Atención automática detenida.', -1, '22:03'],
        [G, 'Buenas noches, Raúl. Soy Andrés Salazar, abogado penalista de HAROWI. Ya estoy al tanto. ¿Sabe en qué comisaría se encuentra su hermano y cómo se llama?', -1, '22:10', M.andres],
        [C, 'Se llama Jorge Espinoza, lo tienen en la comisaría de Surquillo. Dicen que lo van a pasar a la fiscalía mañana', -1, '22:14'],
      ],
    }),

    conv('v03', {
      channel: 'facebook', contactName: 'Gabriela Salinas', handle: 'Facebook · Gabriela Salinas', prospectId: 'p10', status: 'nuevo', mode: 'auto', unread: 2,
      session: session({ greeted: false, turns: 0 }),
      msgs: [
        [C, 'Hola, buen día. Quería consultar si se puede reducir la pensión de alimentos de mi hijo. Me quedé sin trabajo hace dos meses', 0, '09:12'],
        [C, '¿Alguien me puede ayudar por favor?', 0, '09:20'],
      ],
    }),

    conv('v04', {
      channel: 'web', contactName: 'Pedro Ramos', handle: 'Visitante web · formulario', prospectId: 'p05', status: 'finalizado', mode: 'auto', assignedTo: M.mateo,
      session: session({ stage: 'cerrado', area: 'empresarial', serviceSlug: 'constitucion-de-empresas', lawyerId: M.mateo, prospectId: 'p05', turns: 6, modality: 'virtual', data: { name: 'Pedro Antonio Ramos Flores', phone: phone(105), email: 'pedro.ramos@example.com' } }),
      msgs: [
        [C, 'Buenas tardes, quiero formar una SAC con un socio para vender repuestos. ¿Ustedes hacen todo el trámite?', -29, '15:10'],
        [A, `Buenas tardes. ${GREET}`, -11, '15:10'],
        [A, 'Entiendo. Por lo que me comenta, su consulta corresponde al área de Derecho Empresarial, en el servicio de «Constitución de empresas».', -29, '15:10'],
        [A, 'Constitución de sociedades y empresas individuales: elección del tipo societario, estatuto, escritura pública e inscripción registral. Le comparto información general: el abogado evaluará los detalles de su caso concreto.', -29, '15:10'],
        [C, 'Pedro Antonio Ramos Flores, mi correo es pedro.ramos@example.com y mi celular 900 000 105', -29, '15:14'],
        [A, 'Gracias, Pedro. Ya registré su consulta como Derecho Empresarial · Constitución de empresas. El Dr. Mateo Vargas será quien la revise.', -29, '15:14'],
        [G, 'Hola Pedro, le escribe Mateo Vargas. Le envié la propuesta de servicios a su correo. Quedo atento a sus comentarios.', -25, '12:05', M.mateo],
        [C, 'Perfecto doctor, la reviso con mi socio y le confirmo esta semana. Gracias', -25, '18:40'],
      ],
    }),

    conv('v05', {
      channel: 'whatsapp', contactName: 'Ana Lucía Barrientos', handle: phone(108), prospectId: 'p08', status: 'abogado', priority: 'alta', pending: true, mode: 'manual', assignedTo: M.jovana, unread: 1,
      handoffReason: 'La persona solicitó hablar con un abogado.',
      summary: 'Ana Lucía Barrientos Díaz (WhatsApp) consulta por tenencia y régimen de visitas: el padre de su hija no devolvió a la niña tras el fin de semana de visitas. Clasificado como Derecho de Familia · Tenencia. Pidió hablar con una persona; derivada a la Dra. Jovana Quispe con prioridad alta.',
      session: session({ stage: 'derivado', area: 'familia', serviceSlug: 'tenencia', lawyerId: M.jovana, prospectId: 'p08', turns: 5, data: { name: 'Ana Lucía Barrientos Díaz', phone: phone(108), emailSkipped: true, description: 'El padre retuvo a la niña tras el fin de semana de visitas y no la devuelve.' } }),
      msgs: [
        [C, 'Hola, necesito ayuda urgente con la tenencia de mi hija. Su papá se la llevó el fin de semana y no me la quiere devolver', -2, '20:15'],
        [A, `Buenas noches. ${GREET}`, -2, '20:15'],
        [A, 'Entiendo. Por lo que me comenta, su consulta corresponde al área de Derecho de Familia, en el servicio de «Tenencia y régimen de visitas».', -2, '20:15'],
        [A, 'Para registrar su consulta y que el abogado la revise con anticipación, ¿me indica su nombre completo?', -2, '20:15'],
        [C, 'Ana Lucía Barrientos Díaz', -2, '20:18'],
        [A, '¿Podemos contactarle a este mismo número de WhatsApp (+51 900 000 108) o prefiere dejarme otro?', -2, '20:18'],
        [C, 'Este mismo. Por favor quiero hablar con la abogada, es muy urgente, no sé dónde está mi hija', 0, '07:48'],
        [A, 'Por supuesto, Ana. Voy a comunicarle con la Dra. Jovana Quispe.', 0, '07:48'],
        [A, 'Dejé un resumen de su consulta para que no tenga que repetirla. Desde este momento la atención pasa a una persona del estudio y le responderá por este mismo chat. Nuestro horario de atención es Lun a Vie, 09:00 — 19:00.', 0, '07:48', null, { kind: 'handoff' }],
        [S, 'Conversación derivada a la Dra. Jovana Quispe · Prioridad alta · Atención automática detenida.', 0, '07:48'],
        [C, 'Doctora, ya llegó el mensaje? Necesito que me llamen', 0, '08:20'],
      ],
    }),

    conv('v06', {
      channel: 'facebook', contactName: 'Daniela Rojas', handle: 'Facebook · Daniela Rojas', prospectId: 'p19', status: 'ia', mode: 'auto', assignedTo: M.jovana,
      session: session({
        stage: 'modalidad', asked: 'modality', area: 'familia', serviceSlug: 'tenencia', lawyerId: M.jovana, prospectId: 'p19', turns: 6, bookingRequested: true,
        data: { name: 'Daniela Rojas Cueva', phone: phone(119), emailSkipped: true, description: 'Desea regular la tenencia y el régimen de visitas de su hijo de 4 años.' },
      }),
      msgs: [
        [C, 'Hola, quiero regular la tenencia y las visitas de mi hijo, tiene 4 años. Su papá y yo ya no estamos juntos', -8, '21:10'],
        [A, `Buenas noches. ${GREET}`, -8, '21:10'],
        [A, 'Entiendo. Por lo que me comenta, su consulta corresponde al área de Derecho de Familia, en el servicio de «Tenencia y régimen de visitas».', -8, '21:10'],
        [A, 'Para registrar su consulta y que el abogado la revise con anticipación, ¿me indica su nombre completo?', -8, '21:10'],
        [C, 'Daniela Rojas Cueva', -8, '21:13'],
        [A, '¿A qué número de celular podemos contactarle?', -8, '21:13'],
        [C, '900 000 119', -8, '21:14'],
        [A, 'Si desea, déjeme un correo electrónico para enviarle la confirmación. Es opcional: puede responder «omitir».', -8, '21:14'],
        [C, 'omitir', -8, '21:15'],
        [A, 'Gracias, Daniela. Ya registré su consulta en nuestro sistema como Derecho de Familia · Tenencia y régimen de visitas. La Dra. Jovana Quispe será quien la revise.', -8, '21:15'],
        [A, '¿Le gustaría que coordine una consulta con la Dra. Jovana Quispe, de nuestro equipo de Familia?', -8, '21:15'],
        [C, 'Sí, me interesa', -8, '21:20'],
        [A, 'Perfecto. Con gusto coordino su consulta.', -8, '21:20'],
        [A, '¿Prefiere una consulta presencial en nuestra oficina de San Isidro o virtual por videollamada?', -8, '21:20'],
      ],
    }),

    conv('v07', {
      channel: 'web', contactName: 'Diego Fuentes', handle: 'Visitante web · chat', prospectId: 'p11', status: 'finalizado', mode: 'auto', assignedTo: M.mateo,
      session: session({ stage: 'cerrado', area: 'empresarial', serviceSlug: 'constitucion-de-empresas', lawyerId: M.mateo, prospectId: 'p11', appointmentId: 'a03', turns: 9, modality: 'virtual', bookingRequested: true, data: { name: 'Diego Fuentes Alva', phone: phone(111), email: 'diego.fuentes@example.com' } }),
      msgs: [
        [C, 'Hola, somos cuatro socios y queremos constituir una empresa de ingeniería. ¿Cómo es el proceso?', -6, '14:00'],
        [A, `Buenas tardes. ${GREET}`, -6, '14:00'],
        [A, 'Entiendo. Por lo que me comenta, su consulta corresponde al área de Derecho Empresarial, en el servicio de «Constitución de empresas».', -6, '14:00'],
        [C, 'Diego Fuentes Alva, diego.fuentes@example.com, 900 000 111', -6, '14:06'],
        [A, 'Gracias, Diego. Ya registré su consulta como Derecho Empresarial · Constitución de empresas. El Dr. Mateo Vargas será quien la revise.', -6, '14:06'],
        [C, 'Quisiera una reunión virtual con el doctor', -6, '14:20'],
        [A, `Listo, su consulta quedó reservada para el ${formatDate(d(0), 'weekday')} a las ${formatTime12('16:00')} con el Dr. Mateo Vargas (virtual). Le enviaremos el enlace de la videollamada por este chat antes de la cita.`, -6, '14:25', null, { kind: 'booking', appointmentId: 'a03' }],
        [C, 'Excelente, gracias', -6, '14:26'],
        [A, 'Con gusto. Quedamos atentos a su consulta. Que tenga un excelente día.', -6, '14:26'],
      ],
    }),

    conv('v08', {
      channel: 'whatsapp', contactName: 'Walter Mendoza', handle: phone(112), prospectId: 'p12', status: 'abogado', priority: 'alta', mode: 'manual', assignedTo: M.andres,
      handoffReason: 'Situación delicada: investigación por lavado de activos.',
      summary: 'Walter Mendoza Arce (WhatsApp) fue citado a declarar en una investigación por presunto lavado de activos. Clasificado como Derecho Penal · Lavado de activos, prioridad alta. Derivado al Dr. Andrés Salazar, quien programó una consulta inicial presencial.',
      session: session({ stage: 'derivado', area: 'penal', serviceSlug: 'lavado-de-activos', lawyerId: M.andres, prospectId: 'p12', turns: 2, data: { name: 'Walter Mendoza Arce', phone: phone(112) } }),
      msgs: [
        [C, 'Buenas tardes. Me citaron a declarar por una investigación de lavado de activos y no sé qué hacer, no he firmado nada todavía', -7, '12:30'],
        [A, 'Buenas tardes. Es un tema delicado y prefiero que lo vea directamente un abogado. Lo derivo ahora al Dr. Andrés Salazar, de nuestro equipo de Derecho Penal.', -7, '12:30'],
        [A, 'Dejé un resumen de su consulta para que no tenga que repetirla. Desde este momento la atención pasa a una persona del estudio y le responderá por este mismo chat.', -7, '12:30', null, { kind: 'handoff' }],
        [S, 'Conversación derivada al Dr. Andrés Salazar · Prioridad alta · Atención automática detenida.', -7, '12:30'],
        [G, 'Buenas tardes, Walter. Le escribe Andrés Salazar. Antes de cualquier declaración conviene que revisemos la citación. ¿Podría enviarme una foto del documento?', -7, '12:41', M.andres],
        [C, 'Sí doctor, se la envío ahora', -7, '12:43'],
        [G, 'Recibida. Lo espero en consulta presencial el día acordado; llevaré la citación revisada. Cualquier novedad me avisa por aquí.', -6, '10:05', M.andres],
      ],
    }),

    conv('v09', {
      channel: 'whatsapp', contactName: 'Rosa M. Quispe', handle: phone(103), prospectId: 'p04', status: 'nuevo', mode: 'auto', unread: 1,
      session: session({ greeted: false, turns: 0 }),
      msgs: [[C, 'Buenos días, quiero saber cómo hago para desalojar a un inquilino de mi local, ya no paga hace meses', 0, '08:45']],
    }),

    conv('v10', {
      channel: 'facebook', contactName: 'Milagros Soto', handle: 'Facebook · Milagros Soto', prospectId: 'p06', status: 'finalizado', mode: 'auto', assignedTo: M.jovana,
      session: session({ stage: 'cerrado', area: 'familia', serviceSlug: 'divorcio-mutuo-acuerdo', lawyerId: M.jovana, prospectId: 'p06', appointmentId: 'a09', turns: 8, modality: 'virtual', bookingRequested: true, data: { name: 'Milagros Soto Vílchez', phone: phone(106), emailSkipped: true } }),
      msgs: [
        [C, 'Buenas noches, mi esposo y yo estamos separados y los dos queremos divorciarnos de común acuerdo, no tenemos hijos menores', -4, '19:05'],
        [A, `Buenas noches. ${GREET}`, -4, '19:05'],
        [A, 'Entiendo. Por lo que me comenta, su consulta corresponde al área de Derecho de Familia, en el servicio de «Divorcio de mutuo acuerdo».', -4, '19:05'],
        [C, 'Milagros Soto Vílchez, 900 000 106', -4, '19:10'],
        [A, 'Gracias, Milagros. Ya registré su consulta como Derecho de Familia · Divorcio de mutuo acuerdo. La Dra. Jovana Quispe será quien la revise.', -4, '19:10'],
        [A, `Listo, su consulta quedó reservada para el ${formatDate(d(-1), 'weekday')} a las ${formatTime12('12:00')} con la Dra. Jovana Quispe (virtual).`, -4, '19:18', null, { kind: 'booking', appointmentId: 'a09' }],
        [G, 'Hola Milagros, fue un gusto atenderla en la consulta. Quedo atenta a sus comentarios sobre la propuesta.', -1, '13:00', M.jovana],
      ],
    }),

    conv('v11', {
      channel: 'whatsapp', contactName: 'Jimena Cáceres', handle: phone(211), clientId: 'c11', status: 'abogado', pending: true, mode: 'manual', assignedTo: M.jovana, unread: 1,
      handoffReason: 'Consulta de una clienta sobre el avance de su expediente.',
      summary: 'Jimena Cáceres Bravo (clienta, expediente HAR-2026-004 · Tenencia) consulta por el avance de su caso. Derivada a la Dra. Jovana Quispe, abogada responsable.',
      session: session({ stage: 'derivado', area: 'familia', serviceSlug: 'tenencia', lawyerId: M.jovana, turns: 1, data: { name: 'Jimena Cáceres Bravo', phone: phone(211) } }),
      msgs: [
        [C, 'Hola buenas tardes, ¿cómo va mi caso? ¿ya salió algo del juzgado?', 0, '11:02'],
        [A, 'Para consultas sobre el avance de un expediente es mejor que le responda directamente el abogado a cargo, que tiene la información actualizada. Lo comunico ahora con el equipo.', 0, '11:02', null, { kind: 'handoff' }],
        [S, 'Conversación de cliente derivada a la Dra. Jovana Quispe · Atención automática detenida.', 0, '11:02'],
      ],
    }),

    conv('v12', {
      channel: 'web', contactName: 'Visitante web', handle: 'Visitante web #2048', status: 'ia', mode: 'auto',
      session: session({ stage: 'identificando', asked: 'need', turns: 2 }),
      msgs: [
        [C, 'Hola, ¿cuál es el horario de atención?', 0, '10:41'],
        [A, `Buenos días. ${GREET}`, 0, '10:41'],
        [A, 'Atendemos lunes a viernes: 09:00 a 19:00; sábados: 09:00 a 13:00; domingos y feriados: cerrado.', 0, '10:41'],
        [A, 'Cuénteme brevemente qué necesita para orientarle. Atendemos Derecho de Familia, Derecho Penal, Derecho Civil y Patrimonial y Derecho Empresarial.', 0, '10:41'],
      ],
    }),
  ];
}

/* ---------------------------- Notificaciones y actividad ------------------- */

export function buildNotifications(): Notification[] {
  const n = (
    id: string,
    kind: Notification['kind'],
    title: string,
    body: string,
    href: string,
    ago: number,
    time: string,
    read: boolean,
    forMemberId: string | null,
  ): Notification => ({ id, at: at(ago, time), kind, title, body, href, read, forMemberId });
  return [
    n('n01', 'derivacion', 'Derivación urgente', 'Raúl Espinoza reporta una detención. Derivado al Dr. Andrés Salazar.', '/crm/conversaciones?id=v02', -1, '22:03', false, M.andres),
    n('n02', 'derivacion', 'Solicitud de abogada', 'Ana Lucía Barrientos pidió hablar con la Dra. Jovana Quispe.', '/crm/conversaciones?id=v05', 0, '07:48', false, M.jovana),
    n('n03', 'mensaje', 'Mensaje de una clienta', 'Jimena Cáceres consulta por el avance de su expediente.', '/crm/conversaciones?id=v11', 0, '11:02', false, M.jovana),
    n('n04', 'prospecto', 'Nueva consulta por Messenger', 'Gabriela Salinas consulta por reducción de alimentos.', '/crm/conversaciones?id=v03', 0, '09:12', false, null),
    n('n05', 'cita', 'Cita reservada por el asistente', 'Carmen Rosa Huamán · consulta virtual con la Dra. Jovana Quispe.', '/crm/agenda', -3, '10:28', true, M.jovana),
    n('n06', 'tarea', 'Tarea vencida', 'Revisar el expediente HAR-2026-004: observación del juzgado.', '/crm/tareas', 0, '08:00', false, M.jovana),
  ];
}

export function buildActivity(): ActivityEntry[] {
  const e = (ago: number, time: string, actor: string, kind: ActivityEntry['actorKind'], text: string, href: string | null): ActivityEntry => ({
    id: nid('ac'),
    at: at(ago, time),
    actor,
    actorKind: kind,
    text,
    href,
  });
  return [
    e(0, '11:02', ASSISTANT, 'asistente', 'derivó la conversación de Jimena Cáceres a la Dra. Jovana Quispe.', '/crm/conversaciones?id=v11'),
    e(0, '09:12', ASSISTANT, 'asistente', 'recibió una consulta de Gabriela Salinas por Facebook Messenger.', '/crm/conversaciones?id=v03'),
    e(0, '08:45', ASSISTANT, 'asistente', 'recibió una consulta de Rosa M. Quispe por WhatsApp.', '/crm/conversaciones?id=v09'),
    e(0, '07:48', ASSISTANT, 'asistente', 'derivó a Ana Lucía Barrientos a la Dra. Jovana Quispe (solicitó hablar con una persona).', '/crm/conversaciones?id=v05'),
    e(-1, '22:10', 'Dr. Andrés Salazar', 'equipo', 'tomó el control de la conversación con Raúl Espinoza.', '/crm/conversaciones?id=v02'),
    e(-1, '22:03', ASSISTANT, 'asistente', 'derivó de inmediato a Raúl Espinoza al Dr. Andrés Salazar (detención reportada).', '/crm/conversaciones?id=v02'),
    e(-1, '12:40', 'Dra. Jovana Quispe', 'equipo', 'marcó como atendida la consulta de Milagros Soto.', '/crm/agenda'),
    e(-2, '16:45', 'Sistema', 'sistema', 'registró que Rosa María Quispe no asistió a su consulta.', '/crm/agenda'),
    e(-3, '10:28', ASSISTANT, 'asistente', 'reservó una consulta para Carmen Rosa Huamán con la Dra. Jovana Quispe.', '/crm/agenda'),
    e(-3, '10:17', ASSISTANT, 'asistente', 'creó el prospecto Carmen Rosa Huamán Torres (Familia · Demanda de alimentos).', '/crm/prospectos'),
    e(-3, '10:00', 'Dr. Mateo Vargas', 'equipo', 'registró la firma del contrato de servicios de Constructora Los Álamos SAC.', '/crm/expedientes'),
    e(-4, '12:00', 'Dr. Mateo Vargas', 'equipo', 'convirtió a Hernán Lozada en cliente y abrió el expediente HAR-2026-010.', '/crm/expedientes'),
  ];
}

export function buildKb(): KbEntry[] {
  return [
    {
      id: 'kb01',
      title: 'Confidencialidad de la información',
      keywords: ['confidencial', 'reserva', 'privacidad', 'quien ve mis datos'],
      answer:
        'La información que comparte con el estudio se trata con confidencialidad y solo la conoce el equipo asignado a su caso.',
      approved: true,
      createdAt: at(-30, '10:00'),
    },
    {
      id: 'kb02',
      title: 'Cómo es la primera consulta',
      keywords: ['primera consulta', 'como es la consulta', 'en que consiste la consulta', 'que pasa en la consulta'],
      answer:
        'En la primera consulta el abogado escucha el caso, revisa la documentación disponible y delimita el problema jurídico. Al terminar, usted sabe si corresponde accionar y por qué vía. La decisión de iniciar un proceso siempre es suya.',
      approved: true,
      createdAt: at(-30, '10:05'),
    },
  ];
}
