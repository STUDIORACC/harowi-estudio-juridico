import { demoAreas, demoServicesWithFaqs, demoSettings } from '@/content';
import type { AreaId } from '../types';

/**
 * ---------------------------------------------------------------------------
 * BASE DE CONOCIMIENTO DEL ASISTENTE
 * ---------------------------------------------------------------------------
 * Los servicios NO se redactan aquí: se leen de `src/content`, la misma fuente
 * que alimenta el sitio público. Así el asistente solo conoce (y solo puede
 * ofrecer) los servicios reales de HAROWI, con el texto ya aprobado.
 *
 * Aquí se añade únicamente lo que el contenido web no contiene: las palabras
 * clave que permiten reconocer cada servicio en una conversación.
 * ---------------------------------------------------------------------------
 */

export interface KnowledgeService {
  slug: string;
  name: string;
  area: AreaId;
  shortDescription: string;
  description: string[];
  whenNeeded: string[];
  process: { title: string; description: string }[];
  documents: string[];
  faqs: { question: string; answer: string }[];
  /** Expresiones regulares (texto normalizado, sin tildes) con su peso. */
  patterns: [string, number][];
}

const AREA_BY_SLUG: Record<string, AreaId> = {
  'derecho-de-familia': 'familia',
  'derecho-penal': 'penal',
  'derecho-civil-y-patrimonial': 'civil',
  'derecho-empresarial': 'empresarial',
};

const AREA_BY_UUID = Object.fromEntries(demoAreas.map((a) => [a.id, AREA_BY_SLUG[a.slug]])) as Record<string, AreaId>;

/** Reconocimiento por servicio. Los pesos altos señalan expresiones inequívocas. */
const PATTERNS: Record<string, [string, number][]> = {
  'demanda-de-alimentos': [
    ['pension (de )?alimenticia', 4],
    ['pension de alimentos', 4],
    ['demand\\w* (por|de|para)? ?alimentos', 5],
    ['\\balimentos\\b', 3],
    ['manutencion', 3],
    ['no (me )?(pasa|pasan|aporta|aportan|da|dan) (dinero|pension|nada|plata)', 4],
    ['no (me )?(ayuda|ayudan) (con|economicamente)', 3],
    ['\\bpension\\b', 2],
    ['no cumple con (la )?(pension|mantener)', 3],
    ['sin pension', 3],
  ],
  'reduccion-de-alimentos': [
    ['reduc\\w*', 5],
    ['rebaj\\w*', 4],
    ['disminu\\w*', 4],
    ['exonera\\w*', 4],
    ['bajar (la )?pension', 5],
    ['ya no (puedo|alcanza) (pagar|con)', 4],
    ['(perdi|quede sin) (mi )?(trabajo|empleo)', 2],
    ['me (han )?(demandaron|demandado)', 2],
  ],
  tenencia: [
    ['tenencia', 6],
    ['regimen de visitas', 6],
    ['\\bvisitas?\\b', 3],
    ['custodia', 5],
    ['ver a mi(s)? hij\\w*', 4],
    ['no me deja(n)? ver', 4],
    ['quedarme con (mi|mis|los) hij\\w*', 5],
    ['(llevarse|se llevo) a (mi|mis) hij\\w*', 3],
  ],
  'divorcio-mutuo-acuerdo': [
    ['mutuo acuerdo', 6],
    ['comun acuerdo', 6],
    ['(los dos|ambos) (estamos|queremos|estan) de acuerdo', 6],
    ['divorcio (rapido|simple|sencillo)', 3],
    ['divorcio notarial', 4],
    ['divorcio municipal', 4],
  ],
  'divorcio-por-causal': [
    ['por causal', 6],
    ['causal(es)?', 4],
    ['infidelidad', 4],
    ['adulterio', 4],
    ['abandono (del )?hogar', 4],
    ['(no|ya no) quiere divorciarse', 5],
    ['no (esta|estan) de acuerdo (con|en) (el )?divorcio', 5],
    ['separacion de hecho', 5],
    ['divorci\\w*.{0,60}no (esta|estan|quiere|quieren) (de acuerdo|firmar|aceptar)', 6],
    ['no (esta|estan|quiere|quieren) (de acuerdo|firmar|aceptar).{0,60}divorci\\w*', 6],
    ['no quiere (firmar|el divorcio|aceptar)', 5],
    ['violencia (fisica|psicologica)', 3],
  ],
  divorcio: [['divorci\\w*', 3], ['separarme legalmente', 3]],
  'derecho-penal': [
    ['defensa penal', 6],
    ['denuncia (penal|en mi contra)', 4],
    ['me (han )?denunci\\w*', 4],
    ['investigacion (fiscal|penal|preliminar)', 5],
    ['\\bfiscalia\\b', 3],
    ['\\bfiscal\\b', 2],
    ['citacion', 3],
    ['carpeta fiscal', 4],
    ['\\bdelito\\b', 3],
    ['\\bpenal\\b', 3],
    ['acusacion', 3],
    ['juicio oral', 4],
    ['declarar (en|ante) (la )?(fiscalia|policia)', 4],
  ],
  'lavado-de-activos': [
    ['lavado', 6],
    ['origen (de|del) (fondos|dinero|capital)', 4],
    ['operaciones sospechosas', 4],
    ['congelaron (mis )?cuentas', 4],
  ],
  'crimen-organizado': [
    ['crimen organizado', 6],
    ['organizacion criminal', 6],
    ['banda criminal', 4],
  ],
  'prision-preventiva': [
    ['prision preventiva', 7],
    ['preventiva', 4],
    ['audiencia de prision', 5],
    ['pedido de prision', 5],
    ['piden prision', 5],
  ],
  'delitos-administracion-publica': [
    ['peculado', 6],
    ['colusion', 6],
    ['cohecho', 6],
    ['corrupcion', 5],
    ['negociacion incompatible', 6],
    ['administracion publica', 5],
    ['funcionario(s)? publico(s)?', 4],
    ['contraloria', 3],
  ],
  'remate-publico': [
    ['remate', 6],
    ['subasta', 5],
    ['adjudicacion', 3],
    ['comprar (en )?(un )?remate', 5],
  ],
  'prescripcion-adquisitiva': [
    ['prescripcion', 6],
    ['usucapion', 6],
    ['(vivo|estoy|poseo|posesion).{0,30}(hace|desde) .{0,20}anos', 4],
    ['titulo de propiedad', 3],
    ['(soy|me considero) (el )?(dueno|propietario)', 2],
    ['formalizar (mi|la) (casa|propiedad|terreno)', 4],
  ],
  desalojo: [
    ['desalojo', 6],
    ['desalojar', 6],
    ['inquilino', 4],
    ['no paga (el )?alquiler', 5],
    ['no (me )?(paga|pagan) (el )?alquiler', 5],
    ['precario', 5],
    ['invasor\\w*', 4],
    ['me quieren sacar', 4],
    ['ocupan (mi|el) (casa|departamento|local|terreno|predio)', 4],
    ['recuperar (mi|el) (casa|departamento|local|terreno|predio)', 4],
  ],
  exequatur: [
    ['exequatur', 7],
    ['sentencia extranjera', 6],
    ['reconoc\\w* (de )?(una )?sentencia', 5],
    ['divorcio (en|del) (el )?extranjero', 5],
    ['sentencia de (espana|estados unidos|chile|argentina|italia|mexico|colombia)', 5],
    ['laudo extranjero', 5],
  ],
  'constitucion-de-empresas': [
    ['constitu\\w*', 4],
    ['(crear|abrir|armar|formar|montar|registrar|formalizar|inscribir) (una |mi |un )?(empresa|negocio|sociedad|emprendimiento)', 6],
    ['\\b(sac|srl|eirl|s a c|e i r l)\\b', 5],
    ['sociedad anonima', 5],
    ['\\bruc\\b', 2],
    ['empresa', 2],
    ['emprendimiento', 3],
    ['estatuto', 3],
    ['minuta', 3],
    ['socios?', 2],
  ],
};

const SERVICES: KnowledgeService[] = demoServicesWithFaqs.map((s) => ({
  slug: s.slug,
  name: s.name,
  area: AREA_BY_UUID[s.area_id],
  shortDescription: s.short_description,
  description: s.description,
  whenNeeded: s.when_needed,
  process: s.process.map((p) => ({ title: p.title, description: p.description })),
  documents: s.documents,
  faqs: s.faqs.map((f) => ({ question: f.question, answer: f.answer })),
  patterns: PATTERNS[s.slug] ?? [],
}));

export const KNOWLEDGE_SERVICES: KnowledgeService[] = SERVICES;
export const DIVORCE_PATTERNS = PATTERNS.divorcio;

export function getService(slug: string | null | undefined) {
  return slug ? SERVICES.find((s) => s.slug === slug) ?? null : null;
}

export function servicesOfArea(area: AreaId) {
  return SERVICES.filter((s) => s.area === area);
}

export function serviceName(slug: string | null | undefined) {
  return getService(slug)?.name ?? '—';
}

/** Resumen de cada área, tomado del contenido publicado en el sitio. */
export const AREA_KNOWLEDGE: Record<AreaId, { name: string; tagline: string; summary: string }> = Object.fromEntries(
  demoAreas.map((a) => [AREA_BY_SLUG[a.slug], { name: a.name, tagline: a.tagline, summary: a.summary }]),
) as Record<AreaId, { name: string; tagline: string; summary: string }>;

/** Datos generales del estudio que el asistente puede comunicar. */
export const STUDIO = {
  name: demoSettings.studio_legal_name,
  shortName: demoSettings.studio_name,
  city: 'San Isidro, Lima',
  hours: demoSettings.business_hours,
  hoursShort: demoSettings.business_hours_short,
  disclaimer: demoSettings.disclaimer,
};
