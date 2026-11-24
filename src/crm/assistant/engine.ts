import { AREAS } from '../constants';
import { addDays, capitalize, formatDate, formatTime12, nowLocal } from '../lib/dates';
import { memberA, memberShort, memberWithArticle } from '../lib/people';
import { freeSlots, nextSlots, pickLawyer } from '../lib/scheduling';
import { firstName, formatPhone, isValidEmail, normalize, truncate } from '../lib/text';
import { AREA_KNOWLEDGE, STUDIO, getService, servicesOfArea } from '../knowledge/services';
import type {
  Appointment,
  AreaId,
  AssistantConfig,
  AssistantSession,
  ChannelId,
  KbEntry,
  Member,
  Modality,
  PendingQuestion,
  Priority,
  SlotOffer,
  StageId,
} from '../types';
import {
  classify,
  detect,
  detectCaseStatusQuestion,
  detectEmergency,
  detectHumanRequest,
  detectLegalAdviceRequest,
  detectUrgency,
  extractEmail,
  extractModality,
  extractName,
  extractPhone,
  hasSlotConstraint,
  isNo,
  isYes,
  offerMatches,
  parseSlotRequest,
} from './nlu';

/**
 * ---------------------------------------------------------------------------
 * MOTOR DEL ASISTENTE VIRTUAL (MODO DEMOSTRACIÓN)
 * ---------------------------------------------------------------------------
 * Función pura: recibe el mensaje, el estado de la conversación y el contexto
 * del estudio, y devuelve las respuestas, el nuevo estado y los EFECTOS que el
 * CRM debe aplicar (crear prospecto, reservar cita, derivar a un abogado).
 *
 * No llama a ningún servicio externo. Para usar un modelo de lenguaje real se
 * sustituye únicamente `AssistantProvider` (ver `integrations/`): el contrato
 * de entrada y salida es el mismo.
 *
 * REGLAS DE COMPORTAMIENTO (obligatorias)
 *   - No afirma ser abogado ni emite diagnósticos jurídicos.
 *   - No promete resultados ni calcula plazos legales.
 *   - No cita artículos, leyes ni requisitos que no estén en la base aprobada.
 *   - Solo conoce los servicios publicados por HAROWI.
 *   - Ante emergencias, violencia o detención deriva de inmediato.
 *   - Si se pide una persona, detiene la atención automática y transfiere.
 * ---------------------------------------------------------------------------
 */

export type HandoffReason = 'solicitud' | 'urgente' | 'sensible' | 'fuera_alcance' | 'confusion' | 'cliente';

export type AssistantEffect =
  | { type: 'classify'; area: AreaId; serviceSlug: string | null }
  | {
      type: 'upsert_prospect';
      area: AreaId | null;
      serviceSlug: string | null;
      priority: Priority;
      stage: StageId;
      lawyerId: string | null;
      name: string;
      phone: string;
      email: string;
      description: string;
      nextAction: string;
    }
  | { type: 'book'; slot: SlotOffer; modality: Modality; area: AreaId; serviceSlug: string | null }
  | { type: 'reschedule'; appointmentId: string; slot: SlotOffer; modality: Modality }
  | { type: 'handoff'; reason: HandoffReason; urgent: boolean; lawyerId: string | null }
  | { type: 'finish' };

export interface AssistantReply {
  text: string;
  card?: 'booking' | 'handoff';
}

export interface AssistantInput {
  text: string;
  session: AssistantSession;
  config: AssistantConfig;
  channel: ChannelId;
  contactName: string;
  contactHandle: string;
  members: Member[];
  appointments: Appointment[];
  kb: KbEntry[];
  now?: string;
}

export interface AssistantOutput {
  replies: AssistantReply[];
  session: AssistantSession;
  effects: AssistantEffect[];
  /** Etiqueta legible de lo que entendió el asistente (se muestra en el probador). */
  intent: string;
}

export { emptySession } from './session';

const ACKS = ['Perfecto', 'Gracias', 'Entendido', 'Muy bien'];

function timeGreeting(now: string) {
  const h = Number(now.slice(11, 13));
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/* ------------------------------------------------------------------------- */

export function respond(input: AssistantInput): AssistantOutput {
  const now = input.now ?? nowLocal();
  const today = now.slice(0, 10);
  const s: AssistantSession = structuredClone(input.session);
  const { config, members, appointments } = input;
  const replies: AssistantReply[] = [];
  const effects: AssistantEffect[] = [];
  const raw = input.text.trim();
  const t = normalize(raw);
  let intent = 'Mensaje general';

  s.turns += 1;
  const say = (text: string, card?: AssistantReply['card']) => replies.push({ text, card });
  const ack = () => ACKS[s.turns % ACKS.length];

  /* Una conversación ya derivada no recibe respuestas automáticas. */
  if (s.stage === 'derivado') {
    return { replies: [], session: s, effects: [], intent: 'Atención manual' };
  }

  const handleIsPhone = input.channel === 'whatsapp' && /\d{9}/.test(input.contactHandle.replace(/\D/g, ''));
  const channelPhone = handleIsPhone ? formatPhone(input.contactHandle) : null;

  const lawyer = (): Member | null => {
    if (s.lawyerId) return members.find((m) => m.id === s.lawyerId) ?? null;
    const m = pickLawyer(members, s.area ?? 'familia', appointments);
    if (m) s.lawyerId = m.id;
    return m;
  };
  const areaName = () => (s.area ? AREAS[s.area].name : 'su consulta');
  const serviceLabel = () => getService(s.serviceSlug)?.name ?? null;

  /* ------------------------------ Saludo inicial ----------------------------- */
  const greet = (short = false) => {
    if (s.greeted) return;
    s.greeted = true;
    const mirrored = /buenos dias|buen dia/.test(t)
      ? 'Buenos días'
      : /buenas tardes/.test(t)
        ? 'Buenas tardes'
        : /buenas noches/.test(t)
          ? 'Buenas noches'
          : timeGreeting(now);
    say(short ? `${mirrored}.` : `${mirrored}. ${config.greeting}`);
  };

  /* --------------------------- Preguntas del flujo --------------------------- */
  const askNeed = () => {
    s.asked = 'need';
    s.stage = 'identificando';
    say(
      'Cuénteme brevemente qué necesita para orientarle. Atendemos Derecho de Familia, Derecho Penal, Derecho Civil y Patrimonial y Derecho Empresarial.',
    );
  };
  const askName = () => {
    s.asked = 'name';
    s.stage = 'datos';
    say(
      s.data.name
        ? '¿Me confirma su nombre completo?'
        : 'Para registrar su consulta y que el abogado la revise con anticipación, ¿me indica su nombre completo?',
    );
  };
  const askPhone = () => {
    s.stage = 'datos';
    if (channelPhone) {
      s.asked = 'phone_confirm';
      say(`¿Podemos contactarle a este mismo número de WhatsApp (${channelPhone}) o prefiere dejarme otro?`);
    } else {
      s.asked = 'phone';
      say('¿A qué número de celular podemos contactarle?');
    }
  };
  const askEmail = () => {
    s.asked = 'email';
    s.stage = 'datos';
    say('Si desea, déjeme un correo electrónico para enviarle la confirmación. Es opcional: puede responder «omitir».');
  };
  const askWantBooking = () => {
    s.asked = 'want_booking';
    s.stage = 'informando';
    const l = lawyer();
    say(
      l
        ? `¿Le gustaría que coordine una consulta con ${memberWithArticle(l)}, de nuestro equipo de ${AREAS[s.area ?? 'familia'].short}?`
        : '¿Le gustaría que coordine una consulta con uno de nuestros abogados?',
    );
  };
  const askModality = () => {
    s.asked = 'modality';
    s.stage = 'modalidad';
    say('¿Prefiere una consulta presencial en nuestra oficina de San Isidro o virtual por videollamada?');
  };
  const askClarifyService = (kind: 'divorcio' | 'alimentos_rol' | 'area') => {
    s.asked = 'clarify_service';
    s.stage = 'identificando';
    if (kind === 'divorcio') {
      s.area = 'familia';
      say(
        'Para orientarle mejor: ¿ambos están de acuerdo en divorciarse (divorcio de mutuo acuerdo) o la otra persona no está de acuerdo y se requeriría invocar una causal (divorcio por causal)?',
      );
    } else if (kind === 'alimentos_rol') {
      s.area = 'familia';
      say(
        'Entiendo. Para ubicar bien su consulta: ¿usted desea solicitar una pensión de alimentos (demanda de alimentos) o busca ajustar o reducir una pensión ya fijada (reducción de alimentos)?',
      );
    } else if (s.area) {
      const list = servicesOfArea(s.area)
        .map((svc) => `• ${svc.name}`)
        .join('\n');
      say(`Dentro de ${AREAS[s.area].name} trabajamos los siguientes servicios. ¿Cuál se parece más a lo que necesita?\n\n${list}`);
    }
  };

  const repeatPending = () => {
    switch (s.asked) {
      case 'need':
        return askNeed();
      case 'name':
        return askName();
      case 'phone':
      case 'phone_confirm':
        return askPhone();
      case 'email':
        return askEmail();
      case 'want_booking':
        return askWantBooking();
      case 'modality':
        return askModality();
      case 'slot':
      case 'reschedule_slot':
        return say('Cuando guste, indíqueme cuál de los horarios le acomoda (por ejemplo «la 2» o «el jueves a las 10»).');
      case 'clarify_service':
        return s.area ? askClarifyService('area') : askNeed();
      case 'offer_human':
        return say('¿Desea que le comunique con una persona del equipo?');
      default:
        return progress();
    }
  };

  /* ------------------------------ Derivación -------------------------------- */
  const handoff = (reason: HandoffReason, urgent: boolean) => {
    intent = reason === 'solicitud' ? 'Solicitud de abogado' : urgent ? 'Situación urgente' : 'Derivación';
    const l = lawyer();
    s.urgent = s.urgent || urgent;
    s.asked = null;
    s.stage = 'derivado';
    const first = s.data.name ? firstName(s.data.name) : '';

    if (reason === 'urgente' || reason === 'sensible') {
      say(
        `Lamento la situación${first ? `, ${first}` : ''}. Por su urgencia, no voy a continuar con preguntas: derivo su caso ahora mismo ${l ? memberA(l) : 'a un abogado del estudio'}.`,
      );
      say(
        `Ya registré su consulta como URGENTE y avisé al abogado. La atención automática queda detenida y le responderá una persona por este mismo chat. Si puede, indíquenos su nombre completo y, si se trata de una detención, el nombre de la persona detenida y la dependencia donde se encuentra.`,
        'handoff',
      );
      if (/violencia|golpe|agred|amenaz|maltrat/.test(t)) {
        say('Si usted o alguien más corre peligro inmediato, comuníquese ahora con la Policía Nacional al 105. Para orientación sobre violencia familiar también puede llamar a la Línea 100.');
      }
    } else if (reason === 'solicitud') {
      say(`Por supuesto${first ? `, ${first}` : ''}. Voy a comunicarle con ${l ? memberWithArticle(l) : 'una persona del equipo'}.`);
      say(
        `Dejé un resumen de su consulta para que no tenga que repetirla. Desde este momento la atención pasa a una persona del estudio y le responderá por este mismo chat. Nuestro horario de atención es ${STUDIO.hoursShort}.`,
        'handoff',
      );
    } else if (reason === 'cliente') {
      say(
        'Para consultas sobre el avance de un expediente es mejor que le responda directamente el abogado a cargo, que tiene la información actualizada. Lo comunico ahora con el equipo.',
        'handoff',
      );
    } else if (reason === 'fuera_alcance') {
      say(
        'Con gusto. Voy a pedir a una persona del equipo que revise su consulta y le indique si podemos acompañarle. Le responderá por este mismo chat.',
        'handoff',
      );
    } else {
      say(
        'Para no hacerle perder tiempo, prefiero que una persona del equipo continúe la conversación. Dejé un resumen de lo conversado y le responderá por este mismo chat.',
        'handoff',
      );
    }

    // El prospecto se crea (o se actualiza) con lo que se sepa hasta el momento.
    const name = s.data.name ?? input.contactName;
    effects.push({
      type: 'upsert_prospect',
      area: s.area,
      serviceSlug: s.serviceSlug,
      priority: urgent ? 'urgente' : s.area === 'penal' ? 'alta' : 'media',
      stage: 'en_atencion',
      lawyerId: l?.id ?? null,
      name,
      phone: s.data.phone ?? channelPhone ?? '',
      email: s.data.email ?? '',
      description: s.data.description ?? truncate(raw, 280),
      nextAction: urgent ? 'Contactar de inmediato a la persona' : 'Responder a la solicitud de atención',
    });
    if (!s.prospectId) s.prospectId = 'pendiente';
    effects.push({ type: 'handoff', reason, urgent, lawyerId: l?.id ?? null });
  };

  /* ------------------------ Identificación de la consulta -------------------- */
  const explainService = () => {
    const svc = getService(s.serviceSlug);
    if (!svc) {
      if (s.area) {
        say(
          `Entiendo. Su consulta corresponde al área de ${AREAS[s.area].name}. ${AREA_KNOWLEDGE[s.area].tagline} El abogado definirá con usted el servicio exacto durante la consulta.`,
        );
      }
      return;
    }
    say(
      `Entiendo. Por lo que me comenta, su consulta corresponde al área de ${AREAS[svc.area].name}, en el servicio de «${svc.name}».`,
    );
    say(`${svc.shortDescription} Le comparto información general: el abogado evaluará los detalles de su caso concreto.`);
  };

  const applyClassification = (c: ReturnType<typeof classify>) => {
    s.area = c.area;
    s.serviceSlug = c.service?.slug ?? null;
    s.stage = 'informando';
    if (!s.data.description) s.data.description = truncate(raw, 280);
    if (c.area) effects.push({ type: 'classify', area: c.area, serviceSlug: s.serviceSlug });
    if (c.area && /penal/.test(c.area) && detectUrgency(raw) && config.handoffOnUrgent) {
      return false;
    }
    return true;
  };

  /* ----------------------------- Avance del flujo ---------------------------- */
  function createProspect() {
    const l = lawyer();
    const urgent = s.urgent || detectUrgency(raw);
    effects.push({
      type: 'upsert_prospect',
      area: s.area,
      serviceSlug: s.serviceSlug,
      priority: priorityFor(s.area, s.serviceSlug, urgent),
      stage: 'calificado',
      lawyerId: l?.id ?? null,
      name: s.data.name ?? input.contactName,
      phone: s.data.phone ?? '',
      email: s.data.email ?? '',
      description: s.data.description ?? '',
      nextAction: 'Ofrecer consulta inicial',
    });
    s.prospectId = 'pendiente';
    const first = firstName(s.data.name ?? '');
    say(
      `${ack()}${first ? `, ${first}` : ''}. Ya registré su consulta en nuestro sistema como ${areaName()}${serviceLabel() ? ` · ${serviceLabel()}` : ''}${l ? `. ${capitalize(memberWithArticle(l))} será quien la revise` : ''}.`,
    );
  }

  function progress() {
    if (!s.area) return askNeed();
    if (!s.data.name) return askName();
    if (!s.data.phone) return askPhone();
    if (config.askEmail && !s.data.email && !s.data.emailSkipped) return askEmail();
    if (!s.prospectId) createProspect();
    if (s.appointmentId) {
      s.asked = null;
      return;
    }
    if (s.bookingRequested) {
      return s.modality ? offerSlots() : askModality();
    }
    return config.offerBooking ? askWantBooking() : undefined;
  }

  function offerSlots(opts: { skip?: SlotOffer[]; fromDate?: string; reschedule?: boolean } = {}) {
    const l = lawyer();
    if (!l) {
      handoff('confusion', false);
      return;
    }
    const slots = nextSlots({
      member: l,
      appointments,
      durationMin: config.consultMinutes,
      count: 3,
      fromDate: opts.fromDate,
      skip: opts.skip,
      now,
    });
    if (!slots.length) {
      say(`En los próximos días no veo horarios libres con ${memberWithArticle(l)}. Le comunico con una persona del equipo para coordinar una alternativa.`);
      handoff('confusion', false);
      return;
    }
    s.offered = slots;
    s.asked = opts.reschedule ? 'reschedule_slot' : 'slot';
    s.stage = 'horarios';
    const list = slots.map((o, i) => `${i + 1}. ${describeSlot(o)}`).join('\n');
    say(
      `Estos son los próximos horarios disponibles con ${memberWithArticle(l)} para una consulta ${s.modality ?? 'virtual'} de ${config.consultMinutes} minutos:\n\n${list}\n\n¿Cuál le acomoda? También puede indicarme otro día u hora.`,
    );
  }

  function book(slot: SlotOffer) {
    const l = members.find((m) => m.id === slot.lawyerId) ?? lawyer();
    const modality: Modality = s.modality ?? 'virtual';
    const area = s.area ?? 'familia';
    if (s.appointmentId && s.appointmentId !== 'pendiente' && s.asked === 'reschedule_slot') {
      effects.push({ type: 'reschedule', appointmentId: s.appointmentId, slot, modality });
    } else {
      effects.push({ type: 'book', slot, modality, area, serviceSlug: s.serviceSlug });
      s.appointmentId = 'pendiente';
    }
    s.chosen = slot;
    s.asked = null;
    s.stage = 'reservado';
    s.bookingRequested = true;
    say(
      `Listo, su consulta quedó reservada para el ${formatDate(slot.date, 'weekday')} a las ${formatTime12(slot.time)} con ${l ? memberWithArticle(l) : 'nuestro equipo'} (${modality}). ${modality === 'virtual' ? 'Le enviaremos el enlace de la videollamada por este chat antes de la cita.' : 'La dirección exacta de la oficina se la enviamos junto con el recordatorio.'}`,
      'booking',
    );
    say(
      `Ya avisé ${l ? memberA(l) : 'a nuestro equipo'} y recibirá un recordatorio por este mismo canal. ¿Desea que le indique qué documentos conviene reunir para la consulta, o tiene alguna otra duda?`,
    );
  }

  /* ---------------------------- Respuestas informativas ---------------------- */
  const replyIdentity = () => {
    say(
      'Soy el asistente virtual de HAROWI Estudio Jurídico. No soy abogado ni reemplazo su opinión: puedo orientarle sobre nuestros servicios, tomar sus datos y coordinar una consulta. Si prefiere hablar con una persona, dígamelo y le comunico.',
    );
  };
  const replyServicesList = () => {
    const lines = (Object.keys(AREAS) as AreaId[])
      .map((a) => `• ${AREAS[a].name}: ${servicesOfArea(a).map((x) => x.name.toLowerCase()).join(', ')}.`)
      .join('\n');
    say(`Estos son los servicios de HAROWI:\n\n${lines}`);
  };
  const replyHours = () => {
    say(`Atendemos ${STUDIO.hours.map((h) => `${h.days.toLowerCase()}: ${h.hours.replace(' — ', ' a ')}`).join('; ')}.`);
  };
  const replyLocation = () => {
    say(
      `Nuestra oficina está en ${STUDIO.city}. La dirección exacta y las indicaciones para llegar se envían junto con la confirmación de la cita. También atendemos consultas virtuales por videollamada.`,
    );
  };
  const replyPricing = () => {
    say(
      'Los honorarios dependen de las características de cada caso y los explica el abogado durante la consulta, por eso no puedo darle un monto desde aquí. Lo que sí puedo hacer es coordinar su consulta inicial para que lo revise con usted.',
    );
  };
  const replyDocuments = () => {
    const svc = getService(s.serviceSlug);
    if (!svc) {
      say('Los documentos útiles dependen del tipo de trámite. Cuénteme brevemente qué necesita y le comparto una lista general orientativa.');
      return;
    }
    const docs = svc.documents.slice(0, 5).map((d) => `• ${d}`).join('\n');
    say(`Para «${svc.name}», como referencia general suele ser útil reunir:\n\n${docs}\n\nEs una lista orientativa: el abogado confirmará en la consulta qué documentos necesita en su caso. No es necesario enviarlos por ahora.`);
  };
  const replyLegalAdvice = (kind: 'consejo' | 'plazo' | 'duracion') => {
    if (kind === 'plazo') {
      say(
        'Los plazos legales deben ser verificados por el abogado que lleve su caso; yo no puedo calcularlos ni confirmarlos. Si cree que hay un plazo corriendo, lo mejor es coordinar la consulta cuanto antes o, si prefiere, le comunico con una persona del equipo.',
      );
    } else if (kind === 'duracion') {
      say(
        'La duración depende de la carga del juzgado y de la complejidad del caso, así que no puedo darle un estimado confiable. El abogado le dará un rango orientativo en la consulta.',
      );
    } else {
      say(
        'Entiendo la inquietud. No puedo darle una opinión legal ni asegurar resultados: eso depende de los detalles y documentos de su caso y solo lo puede evaluar un abogado. Sí puedo coordinar una consulta para que lo revise con usted.',
      );
    }
  };

  /* ---------------------------------------------------------------------------
     1) SITUACIONES CRÍTICAS: tienen prioridad sobre cualquier otro flujo.
     --------------------------------------------------------------------------- */
  if (detectEmergency(raw) && config.handoffOnUrgent) {
    const c = classify(raw);
    if (!s.area) s.area = c.area ?? (/violencia|golpe|agred|amenaz|maltrat/.test(t) ? 'familia' : 'penal');
    if (!s.serviceSlug && c.service) s.serviceSlug = c.service.slug;
    if (!s.serviceSlug && s.area === 'penal') s.serviceSlug = 'derecho-penal';
    if (!s.data.description) s.data.description = truncate(raw, 280);
    effects.push({ type: 'classify', area: s.area, serviceSlug: s.serviceSlug });
    s.greeted = true;
    handoff('urgente', true);
    return { replies, session: s, effects, intent };
  }

  if (detectHumanRequest(raw)) {
    if (!s.area) {
      const c = classify(raw);
      if (c.area) {
        s.area = c.area;
        s.serviceSlug = c.service?.slug ?? null;
      }
    }
    if (!s.data.description && raw.length > 25) s.data.description = truncate(raw, 280);
    s.greeted = true;
    handoff('solicitud', false);
    return { replies, session: s, effects, intent };
  }

  if (detectCaseStatusQuestion(raw)) {
    s.greeted = true;
    handoff('cliente', false);
    return { replies, session: s, effects, intent: 'Consulta sobre un expediente' };
  }

  greet(detect.identity(raw));
  const greetingOnly = detect.greeting(raw) && raw.split(/\s+/).length <= 4;

  /* ---------------------------------------------------------------------------
     2) RESPUESTA A LA PREGUNTA PENDIENTE
     --------------------------------------------------------------------------- */
  let consumed = false;

  switch (s.asked as PendingQuestion) {
    case 'name': {
      const name = extractName(raw);
      if (name) {
        s.data.name = name;
        intent = 'Dato recibido: nombre';
        consumed = true;
        // La persona puede haber enviado otros datos en el mismo mensaje.
        const ph = extractPhone(raw);
        const em = extractEmail(raw);
        if (ph) s.data.phone = ph;
        if (em) s.data.email = em;
        progress();
      }
      break;
    }
    case 'phone_confirm': {
      const ph = extractPhone(raw);
      if (ph) {
        s.data.phone = ph;
        consumed = true;
        intent = 'Dato recibido: teléfono';
        progress();
      } else if (isYes(raw) || /mismo|este numero|ese numero|este nro/.test(t)) {
        s.data.phone = channelPhone ?? '';
        consumed = true;
        intent = 'Dato recibido: teléfono (confirmado)';
        progress();
      } else if (isNo(raw)) {
        s.asked = 'phone';
        say('Sin problema, ¿a qué número de celular prefiere que le contactemos?');
        consumed = true;
      }
      break;
    }
    case 'phone': {
      const ph = extractPhone(raw);
      if (ph) {
        s.data.phone = ph;
        consumed = true;
        intent = 'Dato recibido: teléfono';
        progress();
      } else if (/^\+?[\d\s-]{5,}$/.test(raw)) {
        say('No logro validar ese número. ¿Puede escribirlo con los 9 dígitos del celular?');
        consumed = true;
      }
      break;
    }
    case 'email': {
      const em = extractEmail(raw);
      if (em && isValidEmail(em)) {
        s.data.email = em;
        consumed = true;
        intent = 'Dato recibido: correo';
        progress();
      } else if (/omitir|no tengo|prefiero no|sin correo|despues|luego/.test(t) || isNo(raw)) {
        s.data.emailSkipped = true;
        consumed = true;
        intent = 'Correo omitido';
        progress();
      } else if (raw.includes('@')) {
        say('Parece que el correo está incompleto. ¿Puede revisarlo? Si prefiere, responda «omitir».');
        consumed = true;
      }
      break;
    }
    case 'want_booking': {
      if (isYes(raw) || detect.booking(raw)) {
        s.bookingRequested = true;
        consumed = true;
        intent = 'Acepta agendar consulta';
        const mod = extractModality(raw);
        if (mod) s.modality = mod;
        say(`${ack()}. Con gusto coordino su consulta.`);
        s.modality ? offerSlots() : askModality();
      } else if (isNo(raw)) {
        consumed = true;
        s.asked = null;
        intent = 'Rechaza agendar';
        say('Sin problema. Dejé su consulta registrada para que el equipo la tenga presente; si más adelante desea una consulta, escríbame cuando guste. ¿Hay algo más en lo que pueda orientarle?');
      }
      break;
    }
    case 'modality': {
      const mod = extractModality(raw);
      if (mod) {
        s.modality = mod;
        consumed = true;
        intent = `Modalidad elegida: ${mod}`;
        offerSlots();
      }
      break;
    }
    case 'slot':
    case 'reschedule_slot': {
      const resolved = resolveSlot();
      if (resolved === 'handled') consumed = true;
      break;
    }
    case 'clarify_service': {
      const c = classify(raw);
      let slug: string | null = c.service?.slug ?? null;
      if (!slug && s.area) {
        const list = servicesOfArea(s.area);
        const num = t.match(/^(?:la |el )?(?:opcion |numero )?([1-9])$/);
        if (num && list[Number(num[1]) - 1]) slug = list[Number(num[1]) - 1].slug;
        if (!slug) slug = list.find((x) => t.includes(normalize(x.name)))?.slug ?? null;
      }
      if (!slug && s.area === 'familia') {
        if (/mutuo|acuerdo|ambos|los dos|comun/.test(t)) slug = 'divorcio-mutuo-acuerdo';
        else if (/causal|no (esta|quiere)|infidel|abandon|separaci/.test(t)) slug = 'divorcio-por-causal';
        else if (/solicit|pedir|demand|cobrar|me (pasen|pase)/.test(t)) slug = 'demanda-de-alimentos';
        else if (/ajust|reduc|baj|rebaj|ya fij/.test(t)) slug = 'reduccion-de-alimentos';
      }
      const svc = getService(slug);
      if (svc) {
        s.area = svc.area;
        s.serviceSlug = svc.slug;
        effects.push({ type: 'classify', area: svc.area, serviceSlug: svc.slug });
        intent = `Servicio aclarado: ${svc.name}`;
        consumed = true;
        s.asked = null;
        s.stage = 'informando';
        explainService();
        progress();
      } else if (isNo(raw) || /no se|no estoy segur|cualquiera|no se cual|nose/.test(t)) {
        s.serviceSlug = null;
        consumed = true;
        s.asked = null;
        intent = 'Servicio por definir en consulta';
        say('No se preocupe: el abogado definirá con usted el servicio exacto durante la consulta.');
        progress();
      }
      break;
    }
    case 'offer_human': {
      if (isYes(raw)) {
        consumed = true;
        handoff('fuera_alcance', false);
      } else if (isNo(raw)) {
        consumed = true;
        s.asked = null;
        say('De acuerdo. Si tiene otra consulta sobre nuestros servicios, cuénteme.');
        askNeed();
      }
      break;
    }
    default:
      break;
  }

  /* Post-reserva: reprogramar o preguntas sueltas. */
  if (!consumed && s.stage === 'reservado' && s.appointmentId) {
    if (detect.reschedule(raw)) {
      consumed = true;
      intent = 'Reprogramar cita';
      s.modality = s.modality ?? 'virtual';
      say('Claro, busquemos otro horario.');
      offerSlots({ skip: s.chosen ? [s.chosen] : [], reschedule: true });
    } else if (detect.cancel(raw)) {
      consumed = true;
      say('Entiendo. Las cancelaciones las confirma una persona del equipo para dejar la agenda al día; le comunico ahora.');
      handoff('solicitud', false);
      return { replies, session: s, effects, intent: 'Cancelar cita' };
    } else if ((detect.thanks(raw) || detect.bye(raw)) && !detect.documents(raw)) {
      consumed = true;
      intent = 'Despedida';
      say(`Con gusto. Quedamos atentos a su consulta del ${formatDate(s.chosen?.date ?? today, 'weekday')}. Que tenga un excelente día.`);
      s.stage = 'cerrado';
      effects.push({ type: 'finish' });
    } else if (isNo(raw) && s.asked === null) {
      consumed = true;
      intent = 'Despedida';
      say('Perfecto. Quedamos atentos a su consulta. Que tenga un excelente día.');
      s.stage = 'cerrado';
      effects.push({ type: 'finish' });
    }
  }

  if (consumed) {
    return { replies, session: s, effects, intent };
  }

  /* ---------------------------------------------------------------------------
     3) NUEVA INFORMACIÓN: clasificación de la consulta y respuestas informativas
     --------------------------------------------------------------------------- */
  let answeredSomething = false;

  // 3a. Clasificación del tema (solo si aporta algo nuevo y la conversación no avanzó a la reserva).
  const canReclassify = !['reservado', 'cerrado'].includes(s.stage);
  if (canReclassify) {
    const c = classify(raw);
    const isNewService = c.service && c.service.slug !== s.serviceSlug && c.score >= (s.serviceSlug ? 6 : 3);
    if (c.outOfScope && !c.service) {
      intent = 'Consulta fuera del alcance';
      answeredSomething = true;
      s.asked = 'offer_human';
      say(
        'Sobre ese tema no tenemos un servicio definido en este canal: HAROWI atiende Derecho de Familia, Penal, Civil y Patrimonial y Empresarial. Si desea, una persona del equipo puede revisar su consulta y decirle si es posible acompañarle. ¿Le comunico con ella?',
      );
      return { replies, session: s, effects, intent };
    }
    if (c.ambiguous && !s.serviceSlug) {
      intent = 'Consulta ambigua: requiere aclaración';
      answeredSomething = true;
      applyClassification({ ...c, service: null });
      askClarifyService(c.ambiguous);
      return { replies, session: s, effects, intent };
    }
    if (isNewService && c.service) {
      const switching = Boolean(s.serviceSlug);
      const proceed = applyClassification(c);
      intent = `Clasificación: ${c.service.name}`;
      answeredSomething = true;
      if (!proceed) {
        // Defensa penal urgente: se deriva de inmediato.
        s.urgent = true;
        handoff('urgente', true);
        return { replies, session: s, effects, intent: 'Defensa penal urgente' };
      }
      if (switching) say('Entendido, tomo nota del cambio.');
      explainService();
      s.asked = null;
    } else if (!s.area && c.area) {
      intent = `Área identificada: ${AREAS[c.area].name}`;
      answeredSomething = true;
      applyClassification(c);
      const list = servicesOfArea(c.area);
      if (list.length === 1) {
        s.serviceSlug = list[0].slug;
        explainService();
      } else {
        askClarifyService('area');
        return { replies, session: s, effects, intent };
      }
    }
  }

  // 3b. Preguntas generales (se contestan sin perder el hilo).
  const advice = detectLegalAdviceRequest(raw);
  if (advice) {
    intent = 'Pedido de opinión legal: se orienta a consulta';
    replyLegalAdvice(advice);
    answeredSomething = true;
  }
  if (detect.identity(raw)) {
    intent = 'Pregunta por la identidad del asistente';
    replyIdentity();
    answeredSomething = true;
  }
  if (detect.servicesList(raw)) {
    intent = 'Pregunta por los servicios';
    replyServicesList();
    answeredSomething = true;
  }
  if (detect.hours(raw)) {
    intent = 'Pregunta por el horario';
    replyHours();
    answeredSomething = true;
  }
  if (detect.location(raw)) {
    intent = 'Pregunta por la ubicación';
    replyLocation();
    answeredSomething = true;
  }
  if (detect.pricing(raw)) {
    intent = 'Pregunta por honorarios';
    replyPricing();
    answeredSomething = true;
  }
  if (detect.documents(raw) && (s.serviceSlug || !answeredSomething)) {
    intent = 'Pregunta por documentos';
    replyDocuments();
    answeredSomething = true;
  }
  const kbHit = input.kb.find((e) => e.approved && e.keywords.some((k) => k && t.includes(normalize(k))));
  if (kbHit) {
    intent = `Base de conocimiento: ${kbHit.title}`;
    say(kbHit.answer);
    answeredSomething = true;
  }
  if (!answeredSomething && s.stage === 'reservado' && (detect.thanks(raw) || detect.bye(raw))) {
    intent = 'Despedida';
    say('Con gusto. Quedamos atentos.');
    answeredSomething = true;
  }

  // 3c. Pedido de cita en cualquier momento del flujo.
  if (detect.booking(raw) && s.area && !s.appointmentId && s.stage !== 'reservado') {
    s.bookingRequested = true;
    intent = 'Solicita una cita';
    const mod = extractModality(raw);
    if (mod) s.modality = mod;
    answeredSomething = true;
    s.asked = null;
    progress();
    return { replies, session: s, effects, intent };
  }
  if (detect.booking(raw) && !s.area) {
    s.bookingRequested = true;
    intent = 'Solicita una cita (falta identificar el tema)';
    const mod = extractModality(raw);
    if (mod) s.modality = mod;
    answeredSomething = true;
    say('Con gusto coordinamos su consulta. Primero necesito saber el tema para asignarle al abogado indicado.');
    askNeed();
    return { replies, session: s, effects, intent };
  }

  // 3d. Mensaje de saludo sin contenido.
  if (!answeredSomething && greetingOnly) {
    intent = 'Saludo';
    askNeed();
    return { replies, session: s, effects, intent };
  }

  /* ---------------------------------------------------------------------------
     4) CONTINUAR EL HILO
     --------------------------------------------------------------------------- */
  if (answeredSomething) {
    // Si el mensaje trae datos sueltos, se aprovechan.
    absorbLooseData();
    if (s.stage === 'reservado' || s.stage === 'cerrado') {
      if (!replies.some((r) => /\?$/.test(r.text.trim()))) say('¿Hay algo más en lo que pueda ayudarle?');
      return { replies, session: s, effects, intent };
    }
    if (s.asked && s.asked !== 'need') repeatPending();
    else progress();
    return { replies, session: s, effects, intent };
  }

  /* Nada reconocido: se toma como detalle del caso o se reintenta. */
  if (s.area && raw.length > 30 && !['reservado', 'cerrado'].includes(s.stage)) {
    s.data.description = truncate(`${s.data.description ?? ''} ${raw}`.trim(), 400);
    intent = 'Detalle del caso agregado';
    say('Gracias por el detalle, lo agrego a su consulta para que el abogado la revise con anticipación.');
    s.asked && s.asked !== 'need' ? repeatPending() : progress();
    return { replies, session: s, effects, intent };
  }

  s.unclear += 1;
  intent = 'No se entendió el mensaje';
  if (s.unclear >= config.maxUnclear) {
    say('Parece que no estoy logrando entender bien su consulta.');
    handoff('confusion', false);
    return { replies, session: s, effects, intent };
  }
  if (s.asked && s.asked !== 'need') {
    say('Disculpe, no logré entender su respuesta.');
    repeatPending();
  } else {
    say('Disculpe, no estoy seguro de haber entendido. ¿Podría contarme en una frase qué necesita? Por ejemplo: «demandar por alimentos», «divorcio», «defensa penal», «desalojo» o «constituir una empresa».');
    s.asked = 'need';
  }
  return { replies, session: s, effects, intent };

  /* ------------------------------ Funciones internas ------------------------- */

  function absorbLooseData() {
    const ph = extractPhone(raw);
    const em = extractEmail(raw);
    if (ph && !s.data.phone) s.data.phone = ph;
    if (em && !s.data.email) s.data.email = em;
  }

  /** Interpreta la elección de horario. Devuelve `'handled'` si el mensaje se resolvió. */
  function resolveSlot(): 'handled' | 'none' {
    const req = parseSlotRequest(raw, today, s.offered.length);
    const l = lawyer();
    if (req.ordinal && s.offered[req.ordinal - 1]) {
      intent = `Horario elegido: opción ${req.ordinal}`;
      book(s.offered[req.ordinal - 1]);
      return 'handled';
    }
    if (hasSlotConstraint(req) && l) {
      const matches = s.offered.filter((o) => offerMatches(o, req));
      if (matches.length === 1) {
        intent = 'Horario elegido por fecha u hora';
        book(matches[0]);
        return 'handled';
      }
      if (matches.length > 1) {
        s.offered = matches;
        say(`Tengo estas opciones para lo que me indica:\n\n${matches.map((o, i) => `${i + 1}. ${describeSlot(o)}`).join('\n')}\n\n¿Cuál prefiere?`);
        intent = 'Horario: varias coincidencias';
        return 'handled';
      }
      // Búsqueda de un horario distinto a los ofrecidos.
      const found: SlotOffer[] = [];
      const days = req.date ? [req.date] : Array.from({ length: 21 }, (_, i) => addDays(today, i));
      for (const d of days) {
        for (const time of freeSlots({ member: l, date: d, appointments, durationMin: config.consultMinutes, now })) {
          const offer = { date: d, time, lawyerId: l.id };
          if (offerMatches(offer, req)) found.push(offer);
        }
        if (found.length >= 3) break;
      }
      if (found.length) {
        intent = 'Horario solicitado distinto a los ofrecidos';
        const exact = req.date && req.time && found.find((f) => f.time === req.time);
        if (exact) {
          book(exact);
          return 'handled';
        }
        s.offered = found.slice(0, 3);
        say(`Con ese criterio tengo disponible:\n\n${s.offered.map((o, i) => `${i + 1}. ${describeSlot(o)}`).join('\n')}\n\n¿Cuál prefiere?`);
        return 'handled';
      }
      intent = 'Horario solicitado no disponible';
      say(`Ese horario no está disponible con ${l ? memberWithArticle(l) : 'el abogado'}. Le propongo otras opciones.`);
      offerSlots({ skip: s.offered, reschedule: s.asked === 'reschedule_slot' });
      return 'handled';
    }
    if (detect.moreOptions(raw) && l) {
      intent = 'Pide otros horarios';
      const last = s.offered[s.offered.length - 1];
      offerSlots({ skip: s.offered, fromDate: last ? addDays(last.date, 1) : undefined, reschedule: s.asked === 'reschedule_slot' });
      return 'handled';
    }
    return 'none';
  }
}

/* -------------------------------- Utilidades -------------------------------- */

export function describeSlot(o: SlotOffer) {
  return `${capitalize(formatDate(o.date, 'weekday'))}, ${formatTime12(o.time)}`;
}

/** Prioridad comercial inicial según el servicio y la urgencia declarada. */
export function priorityFor(area: AreaId | null, serviceSlug: string | null, urgent: boolean): Priority {
  if (urgent) return 'urgente';
  if (area === 'penal') return 'alta';
  if (serviceSlug === 'tenencia' || serviceSlug === 'demanda-de-alimentos' || serviceSlug === 'desalojo') return 'media';
  return 'media';
}

