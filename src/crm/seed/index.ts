import { DEFAULT_ASSISTANT_CONFIG } from '../assistant/session';
import { DEFAULT_DOCUMENT_CATEGORIES, STATE_VERSION } from '../constants';
import { todayISO } from '../lib/dates';
import type { CrmState } from '../types';
import { resetIds } from './helpers';
import { buildActivity, buildConversations, buildKb, buildNotifications } from './inbox';
import { M, buildClients, buildMembers, buildProspects } from './people';
import { buildAppointments, buildCases, buildDocuments, buildTasks } from './work';

/**
 * Construye los datos de demostración. Todas las fechas son relativas al día
 * en que se genera la demo, de modo que «hoy» siempre tiene citas, tareas y
 * conversaciones. Nombres, teléfonos y correos son ficticios.
 */
export function buildSeed(): CrmState {
  resetIds();
  return {
    version: STATE_VERSION,
    anchorDay: todayISO(),
    currentUserId: M.jovana,
    members: buildMembers(),
    prospects: buildProspects(),
    clients: buildClients(),
    cases: buildCases(),
    appointments: buildAppointments(),
    conversations: buildConversations(),
    tasks: buildTasks(),
    documents: buildDocuments(),
    documentCategories: [...DEFAULT_DOCUMENT_CATEGORIES],
    notifications: buildNotifications(),
    activity: buildActivity(),
    assistant: { ...DEFAULT_ASSISTANT_CONFIG },
    kb: buildKb(),
  };
}
