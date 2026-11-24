import { addDays, todayISO } from '../lib/dates';
import type { HistoryEntry, HistoryKind } from '../types';

/** Fecha relativa a hoy: `d(-3)` = hace tres días. */
export const d = (n: number) => addDays(todayISO(), n);
/** Fecha-hora relativa a hoy: `at(-1, '16:30')`. */
export const at = (n: number, hhmm: string) => `${d(n)}T${hhmm}`;

let counter = 0;
export const resetIds = () => {
  counter = 0;
};
/** Identificador determinista dentro de una construcción de la demo. */
export const nid = (prefix: string) => `${prefix}${String(++counter).padStart(4, '0')}`;

export const hist = (n: number, time: string, kind: HistoryKind, text: string, by: string): HistoryEntry => ({
  id: nid('h'),
  at: at(n, time),
  kind,
  text,
  by,
});

/** Teléfono ficticio con prefijo +51 y numeración 900 000 xxx. */
export const phone = (n: number) => `+51 900 000 ${String(n).padStart(3, '0')}`;
export const mail = (local: string) => `${local}@example.com`;

export const ASSISTANT = 'Asistente HAROWI';
