'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, IconButton } from './Button';

function useBodyLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);
}

function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}

/** Enfoca el primer control del panel al abrir y devuelve el foco al cerrar. */
function useFocusOnOpen(open: boolean, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => {
      const first = ref.current?.querySelector<HTMLElement>('input:not([type=hidden]), textarea, select');
      (first ?? ref.current)?.focus();
    }, 60);
    return () => {
      clearTimeout(t);
      previous?.focus?.();
    };
  }, [open, ref]);
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const ref = useRef<HTMLDivElement>(null);
  useBodyLock(open);
  useEscape(open, onClose);
  useFocusOnOpen(open, ref);
  if (!open) return null;
  const width = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];
  return (
    <Portal>
      <div className="crm-root fixed inset-0 z-[60] flex items-end justify-center !bg-transparent sm:items-center sm:p-6">
        <div className="crm-fade absolute inset-0 bg-navy-950/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          className={cn('crm-pop relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-pop outline-none sm:rounded-2xl', width)}
        >
          <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-navy-900">{title}</h2>
              {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
            </div>
            <IconButton label="Cerrar" onClick={onClose} size="sm" className="-mr-1 -mt-1">
              <X className="h-4 w-4" />
            </IconButton>
          </header>
          <div className="crm-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer ? <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3">{footer}</footer> : null}
        </div>
      </div>
    </Portal>
  );
}

/** Panel lateral derecho para fichas de detalle y formularios largos. */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'md',
  headerExtra,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'md' | 'lg' | 'xl';
  headerExtra?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useBodyLock(open);
  useEscape(open, onClose);
  useFocusOnOpen(open, ref);
  if (!open) return null;
  const w = { md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }[width];
  return (
    <Portal>
      <div className="crm-root fixed inset-0 z-[55] flex justify-end !bg-transparent">
        <div className="crm-fade absolute inset-0 bg-navy-950/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
        <aside
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          className={cn('crm-slide-in relative flex h-full w-full flex-col bg-white shadow-sheet outline-none', w)}
        >
          <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-navy-900">{title}</h2>
              {subtitle ? <div className="mt-1 text-sm text-slate-500">{subtitle}</div> : null}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {headerExtra}
              <IconButton label="Cerrar panel" onClick={onClose} size="sm">
                <X className="h-4 w-4" />
              </IconButton>
            </div>
          </header>
          <div className="crm-scroll min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer ? <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3">{footer}</footer> : null}
        </aside>
      </div>
    </Portal>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  tone = 'danger',
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  children?: ReactNode;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            variant={tone === 'danger' ? 'primary' : 'brand'}
            className={tone === 'danger' ? 'bg-red-600 hover:bg-red-700 active:bg-red-800' : undefined}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children ?? <p className="text-sm text-slate-500">Esta acción queda registrada en la actividad del sistema.</p>}
    </Modal>
  );
}

/** Menú contextual de acciones («…»). */
export function ActionMenu({
  items,
  label = 'Más acciones',
  align = 'right',
}: {
  items: { label: string; onClick: () => void; icon?: ReactNode; danger?: boolean; disabled?: boolean; divider?: boolean }[];
  label?: string;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <IconButton label={label} size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu">
        <MoreHorizontal className="h-4 w-4" />
      </IconButton>
      {open ? (
        <div role="menu" className={cn('crm-pop absolute z-30 mt-1 min-w-[12rem] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-pop', align === 'right' ? 'right-0' : 'left-0')}>
          {items.map((item, i) => (
            <div key={i}>
              {item.divider ? <div className="my-1 h-px bg-slate-100" /> : null}
              <button
                role="menuitem"
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={cn('flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors disabled:opacity-40', item.danger ? 'text-red-600 hover:bg-red-50' : 'text-navy-800 hover:bg-slate-50')}
              >
                {item.icon}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
