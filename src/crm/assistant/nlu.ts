import { DIVORCE_PATTERNS, KNOWLEDGE_SERVICES, type KnowledgeService } from '../knowledge/services';
import type { AreaId, SlotOffer } from '../types';
import { WEEKDAYS, addDays, parseISODate, weekdayOf } from '../lib/dates';
import { normalize } from '../lib/text';

/**
 * ---------------------------------------------------------------------------
 * COMPRENSIÓN DE TEXTO (reglas, sin API externa)
 * ---------------------------------------------------------------------------
 * Funciones puras: clasifican la consulta, detectan situaciones delicadas y
 * extraen datos (nombre, teléfono, correo, horarios) de un mensaje libre.
 * ---------------------------------------------------------------------------
 */

const test = (t: string, pattern: string) => new RegExp(pattern).test(t);

/* ------------------------------ Clasificación ----------------------------- */

export interface Classification {
  area: AreaId | null;
  service: KnowledgeService | null;
  score: number;
  /** Ambigüedades que requieren una pregunta aclaratoria. */
  ambiguous: 'divorcio' | 'alimentos_rol' | null;
  outOfScope: boolean;
}

const AREA_HINTS: Record<AreaId, string[]> = {
  familia: ['\\b(familia|familiar)\\b', '\\bhij[oa]s?\\b', '\\b(esposo|esposa|marido|conyuge|pareja|conviviente|ex)\\b', '\\bmatrimonio\\b', '\\bseparad[oa]\\b'],
  penal: ['\\bpenal\\b', '\\b(policia|comisaria|fiscal|fiscalia|juez penal)\\b', '\\bdelito\\b', '\\bdenunci\\w*', '\\bcarcel\\b', '\\bpreso\\b'],
  civil: ['\\b(casa|terreno|predio|departamento|inmueble|lote|local)\\b', '\\bpropiedad\\b', '\\balquiler\\b', '\\bposesion\\b', '\\bcivil\\b'],
  empresarial: ['\\b(empresa|negocio|sociedad|emprendimiento|socios?)\\b', '\\bempresarial\\b', '\\bcorporativ\\w*'],
};

const OUT_OF_SCOPE = [
  '\\b(laboral|despido|despidieron|cts|liquidacion laboral|utilidades|vacaciones truncas)\\b',
  '\\b(tributari\\w*|sunat|impuestos|renta)\\b',
  '\\b(herencia|sucesion|sucesoria|testamento|declaratoria de herederos)\\b',
  '\\b(accidente de transito|choque|seguro vehicular|soat)\\b',
  '\\b(migracion|visa|extranjeria|residencia)\\b',
  '\\b(marca|patente|indecopi|propiedad intelectual)\\b',
  '\\b(hipoteca|prestamo bancario|deuda bancaria|quiebra|insolvencia)\\b',
];

export function classify(text: string): Classification {
  const t = normalize(text);

  // «Me demandaron por alimentos»: la persona es la parte obligada, no la solicitante.
  if (test(t, 'me (han )?(demandaron|demandado|notificaron|llego (una )?demanda)') && test(t, 'alimentos|pension')) {
    return { area: 'familia', service: null, score: 6, ambiguous: 'alimentos_rol', outOfScope: false };
  }

  const scores = KNOWLEDGE_SERVICES.map((svc) => {
    let score = 0;
    for (const [pattern, weight] of svc.patterns) if (test(t, pattern)) score += weight;
    return { svc, score };
  });

  // Una señal clara de reducción prevalece sobre la mención genérica de alimentos.
  const reduccion = scores.find((s) => s.svc.slug === 'reduccion-de-alimentos');
  const demanda = scores.find((s) => s.svc.slug === 'demanda-de-alimentos');
  if (reduccion && demanda && reduccion.score >= 5) reduccion.score += 8;

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];

  if (best && best.score >= 3) {
    return { area: best.svc.area, service: best.svc, score: best.score, ambiguous: null, outOfScope: false };
  }

  if (DIVORCE_PATTERNS.some(([p]) => test(t, p))) {
    return { area: 'familia', service: null, score: 3, ambiguous: 'divorcio', outOfScope: false };
  }

  const outOfScope = OUT_OF_SCOPE.some((p) => test(t, p));

  // Sin servicio claro: se intenta al menos el área.
  let area: AreaId | null = null;
  let areaScore = 0;
  for (const [id, hints] of Object.entries(AREA_HINTS) as [AreaId, string[]][]) {
    const n = hints.filter((h) => test(t, h)).length;
    if (n > areaScore) {
      area = id;
      areaScore = n;
    }
  }
  return { area: outOfScope ? null : area, service: null, score: areaScore, ambiguous: null, outOfScope };
}

/* ----------------------------- Situaciones críticas ----------------------- */

const EMERGENCY = [
  'detenid[oa]s?',
  'detuvieron',
  'detencion',
  'arrest\\w+',
  'capturaron',
  'comisaria',
  '(esta|esta[n]?) preso',
  '(lo|la|los) (llevaron|trasladaron) (preso|a la (comisaria|dependencia policial))',
  'allanamiento|allanaron',
  '(me|nos|le) (esta )?(golpea|golpeo|pega|pego|agrede|agredio|amenaza|amenazo|maltrata|maltrato|ataco|ataca)',
  'violencia (familiar|domestica|de genero)',
  'me quiere matar|quiere matarme|amenaza de muerte|amenazas de muerte',
  'secuestr\\w+',
  'abuso sexual|violacion|violaron',
  'quiero (quitarme|terminar con) (la vida|mi vida)',
];

export function detectEmergency(text: string) {
  const t = normalize(text);
  return EMERGENCY.some((p) => test(t, p));
}

/** Palabras que elevan la urgencia de una consulta penal. */
export function detectUrgency(text: string) {
  return test(normalize(text), '\\b(urgente|urgencia|emergencia|lo antes posible|ahora mismo|de inmediato|inmediatamente|ya mismo|hoy mismo|cuanto antes)\\b');
}

export function detectHumanRequest(text: string) {
  const t = normalize(text);
  return (
    test(t, '(hablar|conversar|comunicar\\w*|pasar\\w*|conectar\\w*|contactar\\w*|comunicarme|hablo) (con )?.{0,22}(abogad[oa]|persona|humano|alguien|asesor|encargad[oa]|secretaria|recepcion)') ||
    test(t, '(quiero|necesito|prefiero|requiero|deseo) (a |un |una |que me atienda |que me atienda una |que me atienda un )?(abogad[oa]|persona real|persona|humano|asesor)') ||
    test(t, 'no quiero (hablar con )?(un |una )?(bot|robot|maquina|asistente virtual|asistente)') ||
    test(t, '(pasame|pasenme|derivame|deriveme|comuniqueme) (con|a)') ||
    test(t, 'atienda (una )?persona|atencion humana|atencion personalizada')
  );
}

export function detectCaseStatusQuestion(text: string) {
  return test(
    normalize(text),
    '(como|en que) (va|esta|esta yendo|avanza|va mi|esta mi) (mi )?(caso|proceso|expediente|tramite|demanda)|(estado|avance|novedades|novedad) (de|del|sobre) (mi )?(caso|proceso|expediente|tramite)|numero de (mi )?expediente|ya (salio|tienen) (la )?(sentencia|resolucion)',
  );
}

export function detectLegalAdviceRequest(text: string) {
  const t = normalize(text);
  if (test(t, 'cuanto (tiempo )?(demora|tarda|dura|se demora)')) return 'duracion' as const;
  if (test(t, 'plazo|cuando vence|vencimiento|prescribe|cuantos dias tengo|cuanto tengo para')) return 'plazo' as const;
  if (
    test(
      t,
      'voy a ganar|ganare|ganar el caso|puedo ganar|probabilidad|posibilidades de (ganar|exito)|me van a dar|cuanto me (toca|tocan|corresponde|van a dar)|que (me )?(conviene|recomienda[s]?|aconseja[s]?)|que hago|que debo hacer|que puedo hacer|es (legal|ilegal|delito)|me pueden (meter|encarcelar|llevar preso|quitar)|cuantos anos de (carcel|pena)|que articulo|que ley|que dice la ley|puedo (hacer|demandar|denunciar)|tengo derecho|asegur\\w+ (que|el)|garantiz\\w+',
    )
  ) {
    return 'consejo' as const;
  }
  return null;
}

export const detect = {
  identity: (t: string) => test(normalize(t), '(eres|es|sos) (un |una )?(abogad[oa]|bot|robot|persona|humano|ia|inteligencia artificial|maquina|real)|con quien (hablo|estoy hablando|converso)|quien (eres|es usted)|eres real'),
  servicesList: (t: string) => test(normalize(t), 'que (servicios|areas|especialidades|casos|temas)|en que (casos |temas )?(ayudan|trabajan|atienden|me pueden ayudar)|que (hacen|ofrecen|atienden|tipo de casos)|a que se dedican'),
  hours: (t: string) => test(normalize(t), 'horarios? de atencion|a que hora (abren|atienden|cierran)|hasta que hora|atienden (los )?(sabados|domingos|feriados)|que dias atienden|horario del estudio'),
  location: (t: string) => test(normalize(t), 'donde (estan|queda|se ubican|atienden|esta (el )?estudio)|direccion|ubicacion|como llego|en que (distrito|zona)'),
  pricing: (t: string) => test(normalize(t), 'cuanto (cuesta|cobran|cobra|sale|vale|es el costo|seria|tengo que pagar|pagaria)|costo|honorarios|precio|tarifa|presupuesto|cotiza\\w*|es gratis|gratuit\\w*'),
  documents: (t: string) => test(normalize(t), 'document\\w*|requisitos|que (necesito|debo llevar|tengo que llevar|llevo|traigo|papeles)|papeles'),
  modality: (t: string) => test(normalize(t), 'es (virtual|presencial)|(atienden|hacen) (consultas )?(virtual|por videollamada|online)|puedo ir|tienen que ser presencial'),
  thanks: (t: string) => test(normalize(t), '^(muchas )?gracias|\\bgracias\\b|te agradezco|le agradezco|muy amable'),
  bye: (t: string) => test(normalize(t), '^(chau|chao|adios|hasta luego|nos vemos|eso es todo|nada mas|ninguna otra|no gracias nada mas|listo gracias)'),
  greeting: (t: string) => test(normalize(t), '^(hola|holi|buenas|buenos dias|buen dia|buenas tardes|buenas noches|saludos|hey|que tal)\\b'),
  reschedule: (t: string) => test(normalize(t), 'reprogram\\w*|cambiar (la |mi )?(cita|hora|fecha|horario)|mover (la |mi )?cita|otro (dia|horario)|no puedo (ir|asistir)'),
  cancel: (t: string) => test(normalize(t), 'cancelar|anular|ya no (quiero|voy a)'),
  booking: (t: string) => test(normalize(t), '\\b(cita|agendar|agenda|reservar|reserva|consulta (inicial|presencial|virtual)|reunion|programar|horarios?|disponibilidad|turno)\\b|quiero (una )?consulta|puedo ir|cuando (me|pueden) (atienden|atender|reciben)|lo antes posible'),
  moreOptions: (t: string) => test(normalize(t), 'otr[oa]s? (horarios?|opciones|dias?|fechas?)|mas (opciones|horarios|tarde|temprano)|ninguno|ninguna|no me (sirve|acomoda|conviene)'),
};

export function isYes(text: string) {
  return test(
    normalize(text),
    '^(si+|sii+|claro|ok|okay|okey|dale|por supuesto|desde luego|correcto|asi es|de acuerdo|perfecto|esta bien|buenisimo|afirmativo|exacto|este mismo|ese mismo|el mismo|mismo numero|obvio|seguro|va|vale|bueno|quiero|si por favor|adelante)\\b',
  );
}

export function isNo(text: string) {
  return test(normalize(text), '^(no+|nop|nel|nada|prefiero no|mejor no|no gracias|ninguno|ninguna|por ahora no|no por ahora|no deseo|no tengo|no quiero|paso)\\b');
}

/* --------------------------- Extracción de datos -------------------------- */

const NOT_NAME = new Set([
  'si', 'sii', 'no', 'ok', 'okay', 'hola', 'buenas', 'buenos', 'buenas', 'tardes', 'dias', 'noches', 'gracias', 'quiero', 'necesito',
  'cita', 'virtual', 'presencial', 'mismo', 'este', 'esta', 'numero', 'correo', 'es', 'el', 'un', 'una', 'que', 'por', 'favor', 'para',
  'tengo', 'tiene', 'tienen', 'mi', 'mis', 'su', 'consulta', 'abogado', 'abogada', 'persona', 'problema', 'caso', 'ayuda', 'ayudar',
  'puede', 'pueden', 'podria', 'podrian', 'quisiera', 'deseo', 'hijo', 'hija', 'esposo', 'esposa', 'alimentos', 'divorcio', 'demanda',
  'hora', 'dia', 'manana', 'tarde', 'noche', 'hoy', 'cuando', 'como', 'donde', 'cual', 'cuanto', 'ya', 'solo', 'nada', 'ninguno',
]);

const titleCase = (w: string) => (w.length <= 2 && /^(de|del|la|las|los|y)$/i.test(w) ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase());

export function extractEmail(text: string) {
  return text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0]?.toLowerCase() ?? null;
}

export function extractPhone(text: string) {
  const m = text.match(/(?:\+?51[\s.-]?)?(9\d{2})[\s.-]?(\d{3})[\s.-]?(\d{3})/);
  return m ? `+51 ${m[1]} ${m[2]} ${m[3]}` : null;
}

/** Devuelve un nombre completo plausible o `null`. Exige al menos nombre y apellido. */
export function extractName(raw: string) {
  let txt = raw
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, ' ')
    .replace(/\+?\d[\d\s.-]{6,}\d/g, ' ');
  const intro = txt.match(/(?:me llamo|mi nombre completo es|mi nombre es|mi nombre|soy|habla|le habla|nombre:?)\s+(.+)/i);
  if (intro) txt = intro[1];
  txt = txt.split(/[,;\n]|\s+y\s+(?:mi|el|mis)\s+|\s+mi\s+(?:correo|numero|celular|telefono|whatsapp)|\s+(?:y|e)\s+(?=\d)/i)[0];
  txt = txt.replace(/[.!¡¿?]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = txt.split(' ').filter(Boolean);
  if (tokens.length < 2 || tokens.length > 6) return null;
  if (!tokens.every((tk) => /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'’-]+$/.test(tk))) return null;
  if (tokens.some((tk) => NOT_NAME.has(normalize(tk)))) return null;
  return tokens.map(titleCase).join(' ');
}

export function extractModality(text: string): 'presencial' | 'virtual' | null {
  const t = normalize(text);
  if (test(t, 'virtual|videollamada|video llamada|zoom|meet|online|en linea|por internet|remot\\w*|a distancia|llamada')) return 'virtual';
  if (test(t, 'presencial|en persona|en la oficina|en el estudio|ir (al|a la) (estudio|oficina)|personalmente|fisic\\w*|San Isidro'.toLowerCase())) return 'presencial';
  return null;
}

/* ------------------------------ Elección de horario ------------------------ */

const WEEKDAY_WORDS: [string, number][] = [
  ['domingo', 0], ['lunes', 1], ['martes', 2], ['miercoles', 3], ['jueves', 4], ['viernes', 5], ['sabado', 6],
];

export interface SlotRequest {
  ordinal: number | null;
  date: string | null;
  weekday: number | null;
  time: string | null;
  period: 'manana' | 'tarde' | 'noche' | null;
}

function nextWeekdayDate(from: string, weekday: number) {
  for (let i = 1; i <= 14; i++) {
    const d = addDays(from, i);
    if (weekdayOf(d) === weekday) return d;
  }
  return from;
}

/** Interpreta cuándo quiere la cita la persona: «el jueves a las 10», «la segunda», «mañana por la tarde». */
export function parseSlotRequest(text: string, today: string, offeredCount: number): SlotRequest {
  const t = normalize(text);
  const req: SlotRequest = { ordinal: null, date: null, weekday: null, time: null, period: null };

  const ordMatch =
    t.match(/^(?:la |el )?(?:opcion |numero |alternativa )?([1-9])$/) ??
    t.match(/\b(?:opcion|numero|alternativa)\s*([1-9])\b/) ??
    t.match(/\b(?:la|el)\s+([1-9])\b(?!\s*(?:de|:|h|am|pm))/);
  if (ordMatch && Number(ordMatch[1]) <= Math.max(offeredCount, 1)) req.ordinal = Number(ordMatch[1]);
  else if (/\b(primer[oa]?|la primera|el primero|uno)\b/.test(t) && offeredCount >= 1) req.ordinal = 1;
  else if (/\b(segund[oa]|la segunda|el segundo|dos)\b/.test(t) && offeredCount >= 2) req.ordinal = 2;
  else if (/\b(tercer[oa]?|la tercera|el tercero|tres)\b/.test(t) && offeredCount >= 3) req.ordinal = 3;
  else if (/\b(ultim[oa])\b/.test(t) && offeredCount >= 1) req.ordinal = offeredCount;

  // Fecha
  const morningWord = /(en|por|de|a) la manana|temprano/.test(t);
  if (/pasado manana/.test(t)) req.date = addDays(today, 2);
  else if (/\bmanana\b/.test(t) && !morningWord) req.date = addDays(today, 1);
  else if (/\bhoy\b/.test(t)) req.date = today;
  for (const [word, wd] of WEEKDAY_WORDS) {
    if (new RegExp(`\\b${word}\\b`).test(t)) {
      req.weekday = wd;
      req.date = nextWeekdayDate(addDays(today, req.date === today ? 0 : 0), wd);
    }
  }
  const dayNum = t.match(/\bel (\d{1,2})\b(?!\s*:)(?:\s*de\s*(\w+))?/);
  if (!req.date && dayNum && !/a las?\s*\d/.test(t)) {
    const n = Number(dayNum[1]);
    if (n >= 1 && n <= 31) {
      for (let i = 0; i < 40; i++) {
        const d = addDays(today, i);
        if (parseISODate(d).getDate() === n) {
          req.date = d;
          break;
        }
      }
    }
  }

  // Franja
  if (morningWord) req.period = 'manana';
  else if (/\b(tarde|en la tarde|por la tarde)\b/.test(t)) req.period = 'tarde';
  else if (/\bnoche\b/.test(t)) req.period = 'noche';

  // Hora
  const hm = t.match(/\b(\d{1,2})[:.h](\d{2})\s*(am|pm|a m|p m)?/);
  const hOnly = t.match(/\ba las?\s*(\d{1,2})\s*(am|pm|a m|p m)?\b/) ?? t.match(/\b(\d{1,2})\s*(am|pm|a m|p m)\b/);
  const ampmOf = (s?: string) => (s ? (s.startsWith('p') ? 'pm' : 'am') : null);
  let hour: number | null = null;
  let minute = 0;
  let ampm: string | null = null;
  if (hm) {
    hour = Number(hm[1]);
    minute = Number(hm[2]);
    ampm = ampmOf(hm[3]);
  } else if (hOnly) {
    hour = Number(hOnly[1]);
    ampm = ampmOf(hOnly[2]);
  }
  if (hour !== null && hour >= 0 && hour <= 23 && minute < 60) {
    if (ampm === 'pm' && hour < 12) hour += 12;
    else if (ampm === null && hour >= 1 && hour <= 7) hour += 12; // «a las 3» en horario de oficina es la tarde
    else if (ampm === null && req.period === 'tarde' && hour < 12) hour += 12;
    req.time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
  return req;
}

export function offerMatches(offer: SlotOffer, req: SlotRequest) {
  if (req.date && offer.date !== req.date) return false;
  if (req.time && offer.time !== req.time) return false;
  if (req.period) {
    const h = Number(offer.time.slice(0, 2));
    if (req.period === 'manana' && h >= 13) return false;
    if (req.period === 'tarde' && (h < 13 || h >= 18)) return false;
    if (req.period === 'noche' && h < 18) return false;
  }
  return true;
}

export function hasSlotConstraint(req: SlotRequest) {
  return Boolean(req.date || req.time || req.period);
}

export function weekdayName(date: string) {
  return WEEKDAYS[weekdayOf(date)];
}
