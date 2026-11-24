/**
 * Verificación del asistente del CRM (sin navegador ni API externa).
 *
 *   npx tsx scripts/crm-assistant-check.ts
 *
 * Reproduce los dos escenarios principales de la demostración y varias
 * conversaciones de borde contra el motor de reglas real, con los datos de
 * demostración. Termina con código 1 si alguna comprobación falla.
 */
import { respond, type AssistantEffect, type AssistantOutput } from '../src/crm/assistant/engine';
import { DEFAULT_ASSISTANT_CONFIG, emptySession } from '../src/crm/assistant/session';
import { SCENARIOS } from '../src/crm/assistant/scenarios';
import { buildSeed } from '../src/crm/seed';
import type { Appointment, AssistantSession, ChannelId } from '../src/crm/types';

const seed = buildSeed();
let failures = 0;
const check = (ok: boolean, label: string) => {
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'OK ' : 'FALLA'}  ${label}`);
};

interface Run {
  session: AssistantSession;
  appointments: Appointment[];
  effects: AssistantEffect[];
  outputs: AssistantOutput[];
}

function chat(channel: ChannelId, handle: string, lines: string[], log = true): Run {
  const run: Run = { session: emptySession(), appointments: [...seed.appointments], effects: [], outputs: [] };
  for (const line of lines) {
    if (log) console.log(`\n  [cliente]   ${line}`);
    const out = respond({
      text: line,
      session: run.session,
      config: DEFAULT_ASSISTANT_CONFIG,
      channel,
      contactName: 'Contacto de prueba',
      contactHandle: handle,
      members: seed.members,
      appointments: run.appointments,
      kb: seed.kb,
    });
    run.session = out.session;
    run.outputs.push(out);
    for (const fx of out.effects) {
      run.effects.push(fx);
      if (fx.type === 'book') {
        run.appointments.push({
          id: 'x', kind: 'consulta_inicial', prospectId: 'x', clientId: null, caseId: null, lawyerId: fx.slot.lawyerId, area: fx.area,
          serviceSlug: fx.serviceSlug, date: fx.slot.date, time: fx.slot.time, durationMin: 45, modality: fx.modality, status: 'pendiente',
          notes: '', source: 'asistente', reminderWhatsapp: true, reminderEmail: false, createdAt: '',
        });
      }
    }
    if (log) {
      for (const r of out.replies) console.log(`  [asistente] ${r.text.replace(/\n/g, '\n              ')}`);
      console.log(`  (intención: ${out.intent})`);
    }
  }
  return run;
}

const has = (run: Run, type: AssistantEffect['type']) => run.effects.some((e) => e.type === type);

console.log('\n=== Escenario 1: demanda de alimentos → cita ===');
const s1 = SCENARIOS.alimentos;
const r1 = chat('whatsapp', s1.handle, s1.lines);
check(r1.session.area === 'familia', 'detecta Derecho de Familia');
check(r1.session.serviceSlug === 'demanda-de-alimentos', 'identifica «Demanda de alimentos»');
check(has(r1, 'upsert_prospect'), 'crea el prospecto');
check(has(r1, 'book'), 'registra la cita');
check(r1.session.stage === 'reservado', 'termina en estado «reservado»');
check(!has(r1, 'handoff'), 'no deriva innecesariamente');

console.log('\n=== Escenario 2: defensa penal urgente → derivación inmediata ===');
const s2 = SCENARIOS.penal;
const r2 = chat('whatsapp', s2.handle, s2.lines.slice(0, 1));
check(r2.session.stage === 'derivado', 'deriva de inmediato');
check(has(r2, 'handoff'), 'emite el efecto de derivación');
check(r2.effects.some((e) => e.type === 'upsert_prospect' && e.priority === 'urgente'), 'crea el prospecto como urgente');
check(!has(r2, 'book'), 'no ofrece horarios');
const after = respond({
  text: 'Está en la comisaría de Surquillo',
  session: r2.session,
  config: DEFAULT_ASSISTANT_CONFIG,
  channel: 'whatsapp',
  contactName: 'x',
  contactHandle: s2.handle,
  members: seed.members,
  appointments: seed.appointments,
  kb: [],
});
check(after.replies.length === 0, 'tras la derivación el asistente no responde (atención manual)');

console.log('\n=== Solicitud explícita de un abogado ===');
const r3 = chat('web', 'Visitante web #1', ['Hola, quiero hablar con un abogado por favor']);
check(r3.session.stage === 'derivado' && has(r3, 'handoff'), 'transfiere a una persona');

console.log('\n=== Reglas de comportamiento ===');
const r4 = chat('whatsapp', '+51 900 000 777', [
  'Hola, ¿eres abogado?',
  'Mi esposo no me pasa pensión, ¿voy a ganar el juicio?',
  '¿Cuánto cuesta?',
  '¿Cuánto tiempo demora?',
  '¿Cuál es el plazo que tengo para apelar?',
]);
const texts4 = r4.outputs.flatMap((o) => o.replies.map((r) => r.text)).join('\n');
check(/no soy abogado/i.test(texts4), 'aclara que no es abogado');
check(/no puedo darle una opini[oó]n legal/i.test(texts4), 'no da opinión legal ni promete resultados');
check(/no puedo darle un monto/i.test(texts4), 'no inventa honorarios');
check(/no puedo calcularlos ni confirmarlos/i.test(texts4), 'no calcula plazos legales');
check(!/art[ií]culo\s+\d+|ley\s+n/i.test(texts4), 'no cita artículos ni leyes');

console.log('\n=== Servicio ambiguo y fuera de alcance ===');
const r5 = chat('web', 'Visitante web #2', ['Quiero divorciarme', 'los dos estamos de acuerdo']);
check(r5.session.serviceSlug === 'divorcio-mutuo-acuerdo', 'aclara divorcio de mutuo acuerdo');
const r6 = chat('web', 'Visitante web #3', ['Me despidieron del trabajo y quiero demandar a mi empresa']);
check(r6.session.asked === 'offer_human', 'ofrece una persona ante un tema que HAROWI no atiende');

console.log('\n=== Variantes de elección de horario ===');
const baseLines = [
  'Necesito una demanda de alimentos', 'Lucía Fernández Prado', 'sí, este mismo', 'omitir', 'sí, quiero una cita', 'presencial',
];
for (const pick of ['la primera', 'opción 3', 'el último', 'el viernes a las 3 de la tarde', 'mañana por la tarde']) {
  const r = chat('whatsapp', '+51 900 000 888', [...baseLines, pick], false);
  const booked = r.effects.find((e) => e.type === 'book');
  console.log(`  «${pick}» → ${booked && booked.type === 'book' ? `${booked.slot.date} ${booked.slot.time}` : `sin reserva (${r.outputs.at(-1)?.intent})`}`);
}

console.log(failures ? `\n${failures} comprobación(es) fallaron.` : '\nTodas las comprobaciones pasaron.');
process.exit(failures ? 1 : 0);
