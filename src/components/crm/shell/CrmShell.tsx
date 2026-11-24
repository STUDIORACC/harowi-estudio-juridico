'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Check,
  ChevronsUpDown,
  MessageSquareWarning,
  Menu,
  RotateCcw,
  Search,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import { LogoMark } from '@/components/layout/Logo';
import { memberFull, memberShort } from '@/crm/lib/people';
import { formatMessageStamp } from '@/crm/lib/dates';
import { isTaskOverdue, globalSearch, unattendedConversations } from '@/crm/store/selectors';
import * as crm from '@/crm/store/actions';
import { useCrm } from '@/crm/store/store';
import type { Notification } from '@/crm/types';
import { cn } from '@/lib/utils';
import { Avatar } from '../ui/Layout';
import { Button, IconButton } from '../ui/Button';
import { ConfirmDialog } from '../ui/Overlay';
import { useToast } from '../ui/Toast';
import { useDebounced } from '../hooks';
import { CRM_NAV } from './nav';

/* --------------------------------- Sidebar -------------------------------- */

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const state = useCrm();
  const pathname = usePathname();
  const [confirmReset, setConfirmReset] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const badges = useMemo(
    () => ({
      conversations: unattendedConversations(state).length,
      tasks: state.tasks.filter((t) => isTaskOverdue(t)).length,
    }),
    [state],
  );

  return (
    <div className="flex h-full flex-col bg-navy-900 text-navy-100">
      <div className="flex h-16 shrink-0 items-center gap-3 px-5">
        <LogoMark className="h-8 w-8 text-white" />
        <div className="leading-none">
          <div className="text-[0.9375rem] font-semibold tracking-[0.18em] text-white">HAROWI</div>
          <div className="mt-1 text-[0.625rem] font-medium uppercase tracking-[0.22em] text-navy-300">Legal CRM</div>
        </div>
      </div>

      <nav aria-label="Módulos" className="crm-scroll min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {CRM_NAV.map((item) => {
          const active = item.href === '/crm' ? pathname === '/crm' : pathname.startsWith(item.href);
          const count = item.badge ? badges[item.badge] : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[0.875rem] font-medium transition-colors',
                active ? 'bg-white/10 text-white' : 'text-navy-200 hover:bg-white/5 hover:text-white',
              )}
            >
              {active ? <span className="absolute -left-3 top-1.5 h-6 w-1 rounded-r bg-brand-400" aria-hidden /> : null}
              <item.icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-brand-300' : 'text-navy-300 group-hover:text-navy-100')} aria-hidden />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {count > 0 ? (
                <span className={cn('rounded-full px-1.5 py-0.5 text-[0.6875rem] font-semibold leading-none', item.badge === 'tasks' ? 'bg-red-500/90 text-white' : 'bg-brand-500 text-white')}>{count}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-3 border-t border-white/10 p-3">
        <UserSwitcher />
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-navy-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <RotateCcw className="h-3 w-3" aria-hidden />
          Restablecer datos de demostración
        </button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Restablecer datos de demostración"
        description="Se descartarán todos los cambios hechos en esta demostración y se cargarán de nuevo los datos de ejemplo."
        confirmLabel="Restablecer"
        onConfirm={() => {
          crm.resetDemo();
          toast.success('Datos de demostración restablecidos');
          router.push('/crm');
        }}
      >
        <p className="text-sm text-slate-500">Los datos son ficticios y viven solo en este navegador. Esta acción no afecta a ningún sistema real.</p>
      </ConfirmDialog>
    </div>
  );
}

function UserSwitcher() {
  const state = useCrm();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const me = state.members.find((m) => m.id === state.currentUserId) ?? state.members[0];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-lg bg-white/5 px-2.5 py-2 text-left transition-colors hover:bg-white/10"
      >
        <Avatar name={me.name} size="sm" tone="blue" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.8125rem] font-medium text-white">{memberShort(me)}</span>
          <span className="block truncate text-[0.6875rem] text-navy-300">{me.role}</span>
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-navy-300" aria-hidden />
      </button>
      {open ? (
        <div role="listbox" aria-label="Cambiar de usuario de la demostración" className="crm-pop absolute bottom-full left-0 right-0 z-40 mb-1.5 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-pop">
          <p className="px-3 pb-1 pt-1.5 text-[0.6875rem] font-medium uppercase tracking-wide text-slate-400">Sesión de demostración</p>
          {state.members.map((m) => (
            <button
              key={m.id}
              role="option"
              aria-selected={m.id === me.id}
              type="button"
              onClick={() => {
                crm.setCurrentUser(m.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-slate-50"
            >
              <Avatar name={m.name} size="xs" tone={m.kind === 'abogado' ? 'navy' : 'slate'} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.8125rem] font-medium text-navy-900">{memberFull(m)}</span>
                <span className="block truncate text-[0.6875rem] text-slate-500">{m.role}</span>
              </span>
              {m.id === me.id ? <Check className="h-4 w-4 text-brand-600" aria-hidden /> : null}
            </button>
          ))}
          <p className="border-t border-slate-100 px-3 py-2 text-[0.6875rem] leading-snug text-slate-400">Demostración: no hay autenticación real. Cambiar de usuario solo cambia quién firma las acciones.</p>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------- Búsqueda y avisos ---------------------------- */

function GlobalSearch() {
  const state = useCrm();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounced = useDebounced(q, 120);
  const hits = useMemo(() => globalSearch(state, debounced), [state, debounced]);

  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const kindLabel = { prospecto: 'Prospecto', cliente: 'Cliente', expediente: 'Expediente', conversacion: 'Conversación' } as const;

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter' && hits[0]) {
            router.push(hits[0].href);
            setOpen(false);
            setQ('');
          }
        }}
        type="search"
        aria-label="Buscar prospectos, clientes, expedientes y conversaciones"
        placeholder="Buscar prospecto, cliente, expediente…"
        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 [&::-webkit-search-cancel-button]:hidden"
      />
      {open && q.trim().length >= 2 ? (
        <div className="crm-pop absolute left-0 right-0 top-full z-40 mt-1.5 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-pop">
          {hits.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">Sin resultados para «{q}».</p>
          ) : (
            hits.map((h) => (
              <button
                key={`${h.kind}-${h.id}`}
                type="button"
                onClick={() => {
                  router.push(h.href);
                  setOpen(false);
                  setQ('');
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
              >
                <span className="w-24 shrink-0 text-[0.6875rem] font-medium uppercase tracking-wide text-slate-400">{kindLabel[h.kind]}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-navy-900">{h.title}</span>
                  <span className="block truncate text-xs text-slate-500">{h.subtitle}</span>
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

const NOTIF_ICON: Record<Notification['kind'], typeof Bell> = {
  derivacion: MessageSquareWarning,
  cita: CalendarClock,
  prospecto: UserPlus,
  tarea: AlertTriangle,
  mensaje: Bell,
  sistema: Sparkles,
};

function NotificationBell() {
  const state = useCrm();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = state.notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <IconButton label={`Notificaciones${unread ? `, ${unread} sin leer` : ''}`} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 ? <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[0.625rem] font-semibold text-white">{unread}</span> : null}
      </IconButton>
      {open ? (
        <div className="crm-pop absolute right-0 top-full z-40 mt-1.5 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <h2 className="text-sm font-semibold text-navy-900">Notificaciones</h2>
            <button type="button" onClick={() => crm.markAllNotificationsRead()} disabled={!unread} className="text-xs font-medium text-brand-700 hover:underline disabled:text-slate-400 disabled:no-underline">
              Marcar todas como leídas
            </button>
          </div>
          <ul className="crm-scroll max-h-[26rem] divide-y divide-slate-100 overflow-y-auto">
            {state.notifications.slice(0, 20).map((n) => {
              const Icon = NOTIF_ICON[n.kind];
              const target = state.members.find((m) => m.id === n.forMemberId);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      crm.markNotificationRead(n.id);
                      setOpen(false);
                      router.push(n.href);
                    }}
                    className={cn('flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50', !n.read && 'bg-brand-50/40')}
                  >
                    <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', n.kind === 'derivacion' ? 'bg-amber-100 text-amber-700' : 'bg-navy-50 text-navy-700')}>
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[0.8125rem] font-semibold text-navy-900">{n.title}</span>
                        {!n.read ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-label="Sin leer" /> : null}
                      </span>
                      <span className="mt-0.5 block text-[0.8125rem] leading-snug text-slate-600">{n.body}</span>
                      <span className="mt-1 block text-[0.6875rem] text-slate-400">
                        {formatMessageStamp(n.at)} · {target ? (target.id === state.currentUserId ? 'Para usted' : `Para ${memberShort(target)}`) : 'Para el equipo'}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** Muestra un aviso emergente cuando llega una notificación nueva (p. ej. derivación o cita del asistente). */
function useNotificationToasts() {
  const state = useCrm();
  const toast = useToast();
  const router = useRouter();
  const lastId = useRef<string | null>(state.notifications[0]?.id ?? null);

  useEffect(() => {
    const newest = state.notifications[0];
    if (!newest || newest.id === lastId.current) return;
    // Se informan todas las notificaciones que aparecieron desde la última revisión.
    const idx = state.notifications.findIndex((n) => n.id === lastId.current);
    lastId.current = newest.id;
    // Si la anterior ya no existe, la lista fue reemplazada (p. ej. al restablecer la demo): no se avisa.
    if (idx === -1) return;
    const fresh = state.notifications.slice(0, idx).reverse();
    for (const n of fresh) {
      if (n.kind === 'derivacion') toast.error(n.title, n.body);
      else toast.info(n.title, n.body);
    }
  }, [state.notifications, toast, router]);
}

/* ---------------------------------- Shell --------------------------------- */

export function CrmShell({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();
  useNotificationToasts();

  useEffect(() => setDrawer(false), [pathname]);

  return (
    <div className="crm-root flex h-[100dvh] overflow-hidden">
      <a href="#crm-main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[90] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow-pop">
        Saltar al contenido
      </a>

      <aside className="hidden w-64 shrink-0 lg:block" aria-label="Navegación principal">
        <SidebarContent />
      </aside>

      {drawer ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="crm-fade absolute inset-0 bg-navy-950/50" onClick={() => setDrawer(false)} aria-hidden />
          <div className="crm-slide-in absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-pop">
            <button type="button" onClick={() => setDrawer(false)} aria-label="Cerrar menú" className="absolute right-2 top-4 z-10 rounded-md p-1.5 text-navy-200 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:gap-3 sm:px-5">
          <IconButton label="Abrir menú" className="lg:hidden" onClick={() => setDrawer(true)}>
            <Menu className="h-5 w-5" />
          </IconButton>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <span className="hidden items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200 md:inline-flex" title="Los datos son ficticios. WhatsApp, Facebook e IA funcionan en modo demostración y requieren credenciales para producción.">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
              Modo demostración
            </span>
            <NotificationBell />
          </div>
        </header>
        <main id="crm-main" tabIndex={-1} className="crm-scroll min-h-0 flex-1 overflow-y-auto outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}

export { Button };
