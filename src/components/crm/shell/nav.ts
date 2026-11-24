import {
  BarChart3,
  Bot,
  Briefcase,
  CalendarDays,
  FileText,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  Settings,
  Target,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: 'conversations' | 'tasks';
}

/** Los 11 módulos del CRM, en el orden del menú lateral. */
export const CRM_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/crm', icon: LayoutDashboard },
  { label: 'Prospectos', href: '/crm/prospectos', icon: Target },
  { label: 'Clientes', href: '/crm/clientes', icon: Users },
  { label: 'Expedientes', href: '/crm/expedientes', icon: Briefcase },
  { label: 'Agenda', href: '/crm/agenda', icon: CalendarDays },
  { label: 'Conversaciones', href: '/crm/conversaciones', icon: MessagesSquare, badge: 'conversations' },
  { label: 'Asistente IA', href: '/crm/asistente', icon: Bot },
  { label: 'Tareas y seguimiento', href: '/crm/tareas', icon: ListChecks, badge: 'tasks' },
  { label: 'Documentos', href: '/crm/documentos', icon: FileText },
  { label: 'Reportes', href: '/crm/reportes', icon: BarChart3 },
  { label: 'Configuración', href: '/crm/configuracion', icon: Settings },
];
