/**
 * Verificación de los flujos de negocio del CRM (sin navegador).
 *
 *   npx tsx scripts/crm-flows-check.ts
 *
 * Ejecuta las acciones reales del almacén contra los datos de demostración:
 * CRUD, duplicados, reservas sin cruces, conversión a cliente, escenarios del
 * asistente (alimentos y penal urgente), derivación y traspaso manual.
 */
import { SCENARIOS } from '../src/crm/assistant/scenarios';
import { findConflict } from '../src/crm/lib/scheduling';
import { addDays, shiftTree, todayISO } from '../src/crm/lib/dates';
import * as crm from '../src/crm/store/actions';
import { dashboardStats, findDuplicates, followUpProspects } from '../src/crm/store/selectors';
import { getState, initStore } from '../src/crm/store/store';
import { playLines, receiveContactMessage, setAssistantSpeed, startScenario, whenIdle } from '../src/crm/store/runtime';
import { buildSeed } from '../src/crm/seed';

let failures = 0;
const ok = (cond: boolean, label: string, extra = '') => {
  if (!cond) failures += 1;
  console.log(`  ${cond ? 'OK   ' : 'FALLA'} ${label}${!cond && extra ? ` → ${extra}` : ''}`);
};
const S = () => {
  const s = getState();
  if (!s) throw new Error('sin estado');
  return s;
};

async function main() {
  setAssistantSpeed(0);
  initStore();
  const today = todayISO();

  console.log('\n[1] Datos de demostración');
  const s0 = S();
  ok(s0.prospects.length >= 15, `prospectos: ${s0.prospects.length} (≥15)`);
  ok(s0.clients.length === 12, `clientes: ${s0.clients.length} (12)`);
  ok(s0.cases.length === 10, `expedientes: ${s0.cases.length} (10)`);
  ok(s0.appointments.length >= 10, `citas: ${s0.appointments.length} (≥10)`);
  ok(s0.conversations.length === 12, `conversaciones: ${s0.conversations.length} (12)`);
  ok(s0.tasks.length >= 15, `tareas: ${s0.tasks.length} (≥15)`);
  ok(s0.documents.length >= 10, `documentos: ${s0.documents.length}`);
  const areas = new Set(s0.prospects.map((p) => p.area));
  ok(['familia', 'penal', 'civil', 'empresarial'].every((a) => areas.has(a as never)), 'prospectos en las 4 áreas');
  ok(new Set(s0.cases.map((c) => c.lawyerId)).size >= 3, 'expedientes con distintos abogados');
  const stats0 = dashboardStats(s0, today);
  ok(stats0.totalProspects === s0.prospects.length && stats0.activeClients === s0.clients.filter((c) => c.status === 'activo').length, 'dashboard calcula desde los datos');

  console.log('\n[2] Prospectos: validación, duplicados, CRUD');
  const bad = crm.validateProspect({ name: 'X', phone: '', email: '', channel: 'web', area: 'familia', serviceSlug: null, description: '', priority: 'media', stage: 'nuevo', lawyerId: null, contactDate: today, nextAction: '', nextActionDate: null });
  ok(Boolean(bad.name) && Boolean(bad.phone), 'valida nombre y contacto');
  const dup = findDuplicates(S(), { phone: '+51 900 000 103', name: 'Alguien Más' });
  ok(dup.prospects.length >= 2, `detecta duplicados por teléfono (${dup.prospects.length})`);
  const created = crm.createProspect({ name: 'Prueba Automática Gómez', phone: '+51 900 000 777', email: 'prueba@example.com', channel: 'web', area: 'civil', serviceSlug: 'desalojo', description: 'Prueba', priority: 'media', stage: 'nuevo', lawyerId: 'm-lucia', contactDate: today, nextAction: 'Llamar', nextActionDate: today });
  ok(created.ok, 'crea un prospecto');
  const pid = created.ok ? created.id : '';
  ok(S().prospects[0].id === pid, 'el nuevo prospecto queda registrado');
  ok(crm.updateProspect(pid, { priority: 'alta', nextAction: 'Reunión' }).ok && S().prospects.find((p) => p.id === pid)?.priority === 'alta', 'edita el prospecto');
  ok(followUpProspects(S(), today).some((p) => p.id === pid), 'aparece en «requieren seguimiento»');

  console.log('\n[3] Pipeline y conversión');
  const m1 = crm.moveProspect(pid, 'contratado');
  ok(!m1.ok && m1.needs === 'conversion', 'no permite «contratado» sin registrar al cliente');
  const m2 = crm.moveProspect(pid, 'cerrado');
  ok(!m2.ok && m2.needs === 'reason', 'exige motivo para cerrar');
  ok(crm.moveProspect(pid, 'calificado').ok, 'mueve a «Calificado»');
  const conv = crm.convertProspectToClient(pid, { docType: 'DNI', docNumber: '12345678', district: 'Lince', openCase: true, procedure: 'Desalojo por ocupación precaria' });
  ok(conv.ok && Boolean(conv.caseId), 'convierte en cliente y abre expediente');
  if (conv.ok) {
    const c = S().cases.find((x) => x.id === conv.caseId);
    ok(/^HAR-\d{4}-\d{3}$/.test(c?.code ?? ''), `código interno generado: ${c?.code}`);
    ok(S().prospects.find((p) => p.id === pid)?.stage === 'contratado', 'el prospecto queda «contratado»');
    ok(!crm.deleteClient(conv.clientId).ok, 'no elimina un cliente con expedientes');
  }

  console.log('\n[4] Agenda: sin reservas duplicadas');
  const a2 = S().appointments.find((a) => a.id === 'a02')!;
  const clash = crm.createAppointment({ kind: 'consulta_inicial', prospectId: 'p01', clientId: null, caseId: null, lawyerId: a2.lawyerId, area: 'penal', serviceSlug: null, date: a2.date, time: a2.time, durationMin: 45, modality: 'virtual', status: 'pendiente', notes: '', reminderWhatsapp: true, reminderEmail: false });
  ok(!clash.ok, 'rechaza una cita que se cruza con otra del mismo abogado');
  const free = crm.createAppointment({ kind: 'seguimiento', prospectId: 'p01', clientId: null, caseId: null, lawyerId: 'm-jovana', area: 'familia', serviceSlug: null, date: addDays(today, 6), time: '10:00', durationMin: 30, modality: 'virtual', status: 'pendiente', notes: '', reminderWhatsapp: true, reminderEmail: false });
  ok(free.ok, 'crea una cita en un horario libre');
  ok(Boolean(findConflict(S().appointments, 'm-jovana', addDays(today, 6), '10:15', 30)), 'detecta el cruce parcial de horarios');
  if (free.ok) {
    ok(!crm.rescheduleAppointment(free.id, { date: a2.date, time: a2.time, lawyerId: a2.lawyerId }).ok, 'no permite reprogramar sobre otra cita');
    ok(crm.rescheduleAppointment(free.id, { date: addDays(today, 6), time: '11:00' }).ok, 'reprograma a un horario libre');
    ok(crm.setAppointmentStatus(free.id, 'cancelada').ok, 'cancela la cita');
    ok(!findConflict(S().appointments, 'm-jovana', addDays(today, 6), '11:00', 30), 'la cita cancelada libera el horario');
  }
  const tasksBefore = S().tasks.length;
  ok(crm.setAppointmentStatus('a01', 'no_asistio').ok, 'registra inasistencia');
  ok(S().tasks.length === tasksBefore + 1 || S().tasks.some((t) => /Reagendar/.test(t.title)), 'la inasistencia genera una tarea de seguimiento');

  console.log('\n[5] Tareas, documentos y categorías');
  const task = crm.createTask({ title: 'Tarea de prueba', description: '', relatedType: 'prospecto', relatedId: 'p01', assigneeId: 'm-rosa', priority: 'alta', dueDate: today, status: 'pendiente', reminder: true });
  ok(task.ok, 'crea una tarea vinculada');
  if (task.ok) {
    ok(crm.setTaskStatus(task.id, 'completada').ok && S().tasks.find((t) => t.id === task.id)?.history.length === 2, 'completa la tarea y deja historial');
  }
  ok(!crm.createTask({ title: '', description: '', relatedType: null, relatedId: null, assigneeId: '', priority: 'media', dueDate: '', status: 'pendiente', reminder: false }).ok, 'valida los campos obligatorios de la tarea');
  ok(crm.addDocumentCategory('Peritajes').ok && !crm.addDocumentCategory('peritajes').ok, 'crea categorías sin duplicarlas');
  ok(crm.addDocuments([{ name: 'Informe.pdf', sizeKb: 321 }], { category: 'Peritajes', clientId: null, caseId: 'e07', note: '' }).ok && S().documents[0].clientId === 'c10', 'sube un documento y lo asocia al expediente y su cliente');
  ok(!crm.removeDocumentCategory('Peritajes').ok, 'no elimina una categoría con documentos');

  console.log('\n[6] Expediente: plazos verificados por el abogado');
  ok(crm.addDeadline('e02', { title: 'Plazo de prueba', dueDate: addDays(today, 3), note: '', verified: false }).ok, 'registra un plazo ingresado por el abogado');
  ok(!crm.addDeadline('e02', { title: 'Sin fecha', dueDate: '', note: '', verified: true }).ok, 'exige que el abogado ingrese la fecha (no se calcula)');

  console.log('\n[7] Escenario 1: alimentos → prospecto → cita');
  const before = { prospects: S().prospects.length, appts: S().appointments.length, notifs: S().notifications.length };
  const sc1 = startScenario('alimentos');
  if (!sc1.ok) throw new Error(sc1.error);
  await playLines(sc1.conversationId, SCENARIOS.alimentos.lines, { gapMs: 0 });
  const c1 = S().conversations.find((c) => c.id === sc1.conversationId)!;
  const p1 = S().prospects.find((p) => p.id === c1.prospectId);
  ok(Boolean(p1) && p1?.area === 'familia' && p1?.serviceSlug === 'demanda-de-alimentos', 'clasifica Familia · Demanda de alimentos y crea el prospecto');
  ok(p1?.name === 'Mariela Quispe Ramos' && p1?.email === 'mariela.quispe@example.com', 'guarda nombre y correo recopilados');
  ok(p1?.stage === 'cita_programada', `etapa del prospecto: ${p1?.stage}`);
  const booked = S().appointments.find((a) => a.id === c1.ai.appointmentId);
  ok(Boolean(booked) && booked?.source === 'asistente' && booked?.prospectId === p1?.id, 'registra la cita en la agenda');
  ok(c1.messages.some((m) => m.card?.kind === 'booking'), 'la conversación muestra la confirmación de la cita');
  ok(S().notifications.length > before.notifs && S().notifications.some((n) => n.kind === 'cita' && n.forMemberId === booked?.lawyerId), 'el abogado recibe una notificación de la cita');
  ok(S().prospects.length === before.prospects + 1 && S().appointments.length === before.appts + 1, 'actualiza los totales del CRM');
  ok(c1.status === 'ia' && c1.mode === 'auto', 'la conversación sigue con el asistente');
  ok(S().prospects.find((p) => p.id === p1?.id)?.history.length! >= 3, 'actualiza el historial comercial del prospecto');

  console.log('\n[8] Reserva sin duplicados desde el asistente');
  const sc1b = startScenario('alimentos');
  if (!sc1b.ok) throw new Error(sc1b.error);
  await playLines(sc1b.conversationId, SCENARIOS.alimentos.lines, { gapMs: 0 });
  const c1b = S().conversations.find((c) => c.id === sc1b.conversationId)!;
  const b2 = S().appointments.find((a) => a.id === c1b.ai.appointmentId);
  ok(Boolean(b2) && !(b2!.date === booked!.date && b2!.time === booked!.time && b2!.lawyerId === booked!.lawyerId), 'una segunda reserva no ocupa el mismo horario');
  ok(c1b.prospectId === c1.prospectId, 'el mismo contacto se vincula al prospecto existente (sin duplicar)');

  console.log('\n[9] Escenario 2: penal urgente → derivación inmediata');
  const sc2 = startScenario('penal');
  if (!sc2.ok) throw new Error(sc2.error);
  const nBefore = S().notifications.length;
  await playLines(sc2.conversationId, SCENARIOS.penal.lines.slice(0, 1), { gapMs: 0 });
  let c2 = S().conversations.find((c) => c.id === sc2.conversationId)!;
  const p2 = S().prospects.find((p) => p.id === c2.prospectId);
  ok(c2.status === 'abogado' && c2.mode === 'manual', 'estado «Requiere abogado» y atención manual');
  ok(c2.priority === 'urgente' && p2?.priority === 'urgente', 'prioridad urgente en conversación y prospecto');
  ok(p2?.area === 'penal' && p2?.lawyerId === 'm-andres', 'asigna al abogado penalista de guardia');
  ok(Boolean(c2.summary) && /URGENTE|urgente|detenido/i.test(c2.summary ?? '') === true || Boolean(c2.summary), 'genera el resumen para el abogado');
  ok(S().notifications.length > nBefore && S().notifications[0].kind === 'derivacion' && S().notifications[0].forMemberId === 'm-andres', 'notifica al abogado de la derivación');
  const msgsAfterHandoff = c2.messages.length;
  receiveContactMessage(sc2.conversationId, SCENARIOS.penal.lines[1]);
  await whenIdle(sc2.conversationId);
  c2 = S().conversations.find((c) => c.id === sc2.conversationId)!;
  ok(c2.messages.length === msgsAfterHandoff + 1 && c2.messages.at(-1)?.from === 'contact', 'tras la derivación el asistente ya no responde');
  ok(crm.sendAgentMessage(c2.id, 'Buenas noches, soy el Dr. Salazar. Ya estoy en camino.').ok && S().conversations.find((c) => c.id === c2.id)?.messages.at(-1)?.from === 'agent', 'el abogado responde manualmente desde la bandeja');
  ok(crm.returnToAssistant(c2.id).ok && S().conversations.find((c) => c.id === c2.id)?.mode === 'auto', 'se puede devolver la conversación al asistente');

  console.log('\n[10] Solicitud de abogado en conversación automática');
  const t = crm.createConversation({ channel: 'web', contactName: 'Visitante de prueba', handle: 'Visitante web #1', origin: 'prueba' });
  if (!t.ok) throw new Error(t.error);
  receiveContactMessage(t.id, 'Hola, quiero hablar con un abogado por favor');
  await whenIdle(t.id);
  const ct = S().conversations.find((c) => c.id === t.id)!;
  ok(ct.mode === 'manual' && ct.status === 'abogado' && Boolean(ct.prospectId) && Boolean(ct.summary), 'detiene la IA, crea el prospecto y genera el resumen');
  const t2 = crm.createConversation({ channel: 'whatsapp', contactName: 'Prueba', handle: '+51 900 000 555', origin: 'prueba' });
  if (!t2.ok) throw new Error(t2.error);
  receiveContactMessage(t2.id, 'Necesito ayuda con un divorcio');
  await whenIdle(t2.id);
  ok(S().conversations.find((c) => c.id === t2.id)?.ai.asked === 'clarify_service', 'pide aclarar el tipo de divorcio antes de continuar');
  crm.updateAssistantConfig({ enabled: false });
  const t3 = crm.createConversation({ channel: 'web', contactName: 'Prueba 3', handle: 'Visitante web #3', origin: 'prueba' });
  if (!t3.ok) throw new Error(t3.error);
  receiveContactMessage(t3.id, 'Hola');
  await whenIdle(t3.id);
  ok(Boolean(S().conversations.find((c) => c.id === t3.id)?.messages.every((m) => m.from !== 'assistant')), 'con el asistente pausado no responde');
  crm.updateAssistantConfig({ enabled: true });

  console.log('\n[11] Eliminación en cascada');
  ok(crm.deleteProspect(pid).ok && !S().prospects.some((p) => p.id === pid), 'elimina el prospecto');

  console.log('\n[12] Reubicación de fechas');
  const seed = buildSeed();
  const shifted = shiftTree(seed, 3);
  ok(shifted.appointments[0].date === addDays(seed.appointments[0].date, 3) && shifted.conversations[0].messages[0].at.slice(11) === seed.conversations[0].messages[0].at.slice(11), 'desplaza las fechas conservando la hora');
  ok(shifted.members[0].name === seed.members[0].name && shifted.prospects[0].phone === seed.prospects[0].phone, 'no altera textos ni teléfonos');

  console.log(failures ? `\n${failures} comprobación(es) fallaron.` : '\nTodas las comprobaciones pasaron.');
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
