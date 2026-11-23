'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function toISODate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Índice de columna (0 = lunes) del primer día del mes. */
function firstWeekdayIndex(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

interface MonthGridProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  children: (day: number, iso: string, isWeekend: boolean) => React.ReactNode;
  canGoPrev?: boolean;
}

function MonthGrid({ year, month, onPrev, onNext, children, canGoPrev = true }: MonthGridProps) {
  const offset = firstWeekdayIndex(year, month);
  const total = daysInMonth(year, month);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canGoPrev}
          aria-label="Mes anterior"
          className="rounded-full p-2 text-ink-muted transition-colors hover:bg-paper-alt hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <p aria-live="polite" className="font-display text-lg capitalize">
          {MONTH_NAMES[month]} {year}
        </p>
        <button
          type="button"
          onClick={onNext}
          aria-label="Mes siguiente"
          className="rounded-full p-2 text-ink-muted transition-colors hover:bg-paper-alt hover:text-ink"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day, index) => (
          <div
            key={index}
            aria-hidden
            className="pb-2 text-center text-2xs font-medium uppercase tracking-overline text-ink-muted"
          >
            {day}
          </div>
        ))}
        {Array.from({ length: offset }).map((_, index) => (
          <div key={`pad-${index}`} />
        ))}
        {Array.from({ length: total }).map((_, index) => {
          const day = index + 1;
          const column = (offset + index) % 7;
          return (
            <div key={day}>{children(day, toISODate(year, month, day), column >= 5)}</div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Selector de fecha para la solicitud de citas. Los días anteriores a `minDate`
 * quedan bloqueados, igual que los que no figuran en `availableWeekdays`
 * (0 = domingo … 6 = sábado, según el horario de atención del abogado).
 */
export function Calendar({
  value,
  onChange,
  minDate,
  className,
  availableWeekdays,
  blockedDates = [],
}: {
  value: string | null;
  onChange: (iso: string) => void;
  minDate?: string;
  className?: string;
  availableWeekdays?: number[];
  blockedDates?: string[];
}) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const min = minDate ?? toISODate(today.getFullYear(), today.getMonth(), today.getDate());

  const isCurrentMonth =
    cursor.year === today.getFullYear() && cursor.month === today.getMonth();

  function shift(delta: number) {
    setCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  return (
    <div className={cn('rounded-2xl border border-line bg-white p-5', className)}>
      <MonthGrid
        year={cursor.year}
        month={cursor.month}
        onPrev={() => shift(-1)}
        onNext={() => shift(1)}
        canGoPrev={!isCurrentMonth}
      >
        {(day, iso, isWeekend) => {
          const weekday = new Date(cursor.year, cursor.month, day).getDay();
          const outOfSchedule = availableWeekdays
            ? !availableWeekdays.includes(weekday)
            : isWeekend;
          const disabled = outOfSchedule || iso <= min || blockedDates.includes(iso);
          const selected = value === iso;
          return (
            <button
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={`${day} de ${MONTH_NAMES[cursor.month]}`}
              onClick={() => onChange(iso)}
              className={cn(
                'flex h-10 w-full items-center justify-center rounded-lg text-sm tabular-nums transition-all duration-200',
                disabled && 'cursor-not-allowed text-ink-muted/35',
                !disabled && !selected && 'text-ink-soft hover:bg-paper-alt hover:text-ink',
                selected && 'bg-ink font-medium text-paper',
              )}
            >
              {day}
            </button>
          );
        }}
      </MonthGrid>
    </div>
  );
}

export interface CalendarEvent {
  id: string;
  date: string;
  time: string;
  title: string;
  tone: 'accent' | 'positive' | 'warning' | 'muted';
}

/** Vista mensual con eventos, usada en el panel administrativo. */
export function MonthCalendar({
  events,
  initialMonth,
  onSelectDate,
  selectedDate,
}: {
  events: CalendarEvent[];
  initialMonth?: { year: number; month: number };
  onSelectDate?: (iso: string) => void;
  selectedDate?: string | null;
}) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(
    initialMonth ?? { year: today.getFullYear(), month: today.getMonth() },
  );

  const byDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      (map[event.date] ??= []).push(event);
    }
    return map;
  }, [events]);

  function shift(delta: number) {
    setCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  const todayIso = toISODate(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <MonthGrid
        year={cursor.year}
        month={cursor.month}
        onPrev={() => shift(-1)}
        onNext={() => shift(1)}
      >
        {(day, iso) => {
          const dayEvents = byDate[iso] ?? [];
          const selected = selectedDate === iso;
          return (
            <button
              type="button"
              onClick={() => onSelectDate?.(iso)}
              aria-label={`${day} de ${MONTH_NAMES[cursor.month]}, ${dayEvents.length} cita(s)`}
              aria-pressed={selected}
              className={cn(
                'flex h-16 w-full flex-col items-center justify-start gap-1 rounded-lg border border-transparent p-1.5 text-sm tabular-nums transition-colors duration-200 sm:h-20',
                'hover:border-line hover:bg-paper-alt/60',
                selected && 'border-ink/25 bg-paper-alt',
                iso === todayIso && 'font-medium text-accent',
              )}
            >
              <span>{day}</span>
              <span className="flex flex-wrap justify-center gap-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <span
                    key={event.id}
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      event.tone === 'accent' && 'bg-accent',
                      event.tone === 'positive' && 'bg-emerald-500',
                      event.tone === 'warning' && 'bg-amber-500',
                      event.tone === 'muted' && 'bg-ink-muted/50',
                    )}
                  />
                ))}
              </span>
            </button>
          );
        }}
      </MonthGrid>
    </div>
  );
}
