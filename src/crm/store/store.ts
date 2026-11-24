'use client';

import { useSyncExternalStore } from 'react';
import { diffDays, shiftTree, todayISO } from '../lib/dates';
import { integrations } from '../integrations';
import { buildSeed } from '../seed';
import type { CrmState } from '../types';

/**
 * ---------------------------------------------------------------------------
 * ALMACÉN DEL CRM
 * ---------------------------------------------------------------------------
 * Un único estado en memoria, persistido en el navegador a través del
 * `CrmRepository` configurado (localStorage en la demo; Supabase en
 * producción). Los componentes leen con `useCrm()` y las escrituras pasan por
 * `mutate()` (ver `actions.ts`), que trabaja sobre una copia y notifica.
 *
 * Fechas relativas: la demo se genera alrededor del día actual. Si se abre otro
 * día, se regenera (si nadie la tocó) o se desplazan las fechas el mismo
 * número de días (si ya hay cambios), para que «hoy» siempre tenga actividad.
 * ---------------------------------------------------------------------------
 */

let state: CrmState | null = null;
let dirty = false;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

const emit = () => listeners.forEach((l) => l());

function persist() {
  if (!state) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (state) integrations.repository.save(state, dirty);
  }, 200);
}

/** Carga el estado guardado o genera la demo. Se llama una sola vez en el cliente. */
export function initStore() {
  if (state) return;
  const loaded = integrations.repository.load();
  const today = todayISO();
  if (loaded) {
    const saved = 'state' in loaded ? loaded : { state: loaded, dirty: true };
    state = saved.state;
    dirty = saved.dirty;
    if (state.anchorDay !== today) {
      if (!dirty) {
        state = buildSeed();
      } else {
        const delta = diffDays(today, state.anchorDay);
        state = { ...shiftTree(state, delta), anchorDay: today };
      }
    }
  } else {
    state = buildSeed();
    dirty = false;
  }
  integrations.repository.save(state, dirty);
  emit();
}

export function getState() {
  return state;
}

export function isDirty() {
  return dirty;
}

/** Aplica un cambio sobre una copia del estado, lo guarda y avisa a los componentes. */
export function mutate<T>(fn: (draft: CrmState) => T): T {
  if (!state) throw new Error('El almacén del CRM aún no está inicializado.');
  const draft = structuredClone(state);
  const result = fn(draft);
  state = draft;
  dirty = true;
  emit();
  persist();
  return result;
}

/** Restablece los datos de demostración. */
export function resetState() {
  state = buildSeed();
  dirty = false;
  integrations.repository.save(state, dirty);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Estado actual, o `null` hasta que el navegador lo haya cargado. */
export function useCrmOrNull() {
  return useSyncExternalStore(subscribe, () => state, () => null);
}

/** Estado actual (el layout garantiza que ya está cargado). */
export function useCrm(): CrmState {
  const s = useCrmOrNull();
  if (!s) throw new Error('useCrm se usó antes de que el CRM terminara de cargar.');
  return s;
}
