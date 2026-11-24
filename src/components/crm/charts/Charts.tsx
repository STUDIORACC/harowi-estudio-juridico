'use client';

import type { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';

/**
 * Gráficos del CRM. Reglas de diseño (ver docs/CRM.md → «Gráficos»):
 *  - barras ≤ 24 px con borde redondeado de 4 px solo en el extremo del dato;
 *  - líneas de 2 px, marcador final de 8 px, relleno al 10 %;
 *  - rejilla y ejes recesivos; leyenda siempre que hay 2 o más series;
 *  - el texto usa tintas neutras, nunca el color de la serie;
 *  - colores de la paleta categórica validada (azul, naranja, aguamarina, violeta).
 */

export const INK = { primary: '#0F1F3C', secondary: '#52607A', muted: '#8A94A6', grid: '#E8ECF2', baseline: '#CBD3E0', surface: '#FFFFFF' };

export interface Datum {
  key: string;
  label: string;
  value: number;
  color?: string;
}

export function ChartTooltip({ active, payload, label, unit = '', formatter }: { active?: boolean; payload?: { name?: string; value?: number; color?: string; payload?: Record<string, unknown>; dataKey?: string }[]; label?: string; unit?: string; formatter?: (v: number, name: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-pop">
      {label ? <p className="mb-1 font-semibold text-navy-900">{label}</p> : null}
      <ul className="space-y-0.5">
        {payload.map((p, i) => (
          <li key={i} className="flex items-center gap-2 text-slate-600">
            <span className="h-2 w-2 rounded-sm" style={{ background: p.color ?? (p.payload?.color as string) ?? INK.secondary }} aria-hidden />
            <span>{p.name ?? ''}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums text-navy-900">{formatter ? formatter(p.value ?? 0, p.name ?? '') : `${p.value}${unit}`}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Legend({ items, className }: { items: { label: string; color: string; value?: ReactNode }[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap gap-x-4 gap-y-1.5 text-[0.8125rem] text-slate-600', className)}>
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: it.color }} aria-hidden />
          {it.label}
          {it.value !== undefined ? <span className="font-semibold tabular-nums text-navy-900">{it.value}</span> : null}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------- Tendencia: línea con área ----------------------- */

export function TrendChart({ data, color = '#2a78d6', height = 240, unit = 'prospectos' }: { data: { label: string; count: number }[]; color?: string; height?: number; unit?: string }) {
  const last = data.length - 1;
  return (
    <div style={{ height }} role="img" aria-label={`Evolución mensual: ${data.map((d) => `${d.label} ${d.count}`).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 20, left: -18, bottom: 0 }}>
          <CartesianGrid stroke={INK.grid} vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: INK.baseline }} tick={{ fill: INK.muted, fontSize: 12 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: INK.muted, fontSize: 12 }} />
          <Tooltip cursor={{ stroke: INK.baseline }} content={<ChartTooltip unit="" formatter={(v) => `${v} ${unit}`} />} />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="count"
            name="Total"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            fill={color}
            fillOpacity={0.1}
            activeDot={{ r: 5, stroke: INK.surface, strokeWidth: 2, fill: color }}
            dot={(p: { cx?: number; cy?: number; index?: number; key?: string }) =>
              p.index === last && p.cx !== undefined && p.cy !== undefined ? (
                <circle key="end" cx={p.cx} cy={p.cy} r={4.5} fill={color} stroke={INK.surface} strokeWidth={2} />
              ) : (
                <g key={`dot-${p.index}`} />
              )
            }
          >
            <LabelList dataKey="count" position="top" offset={8} content={(p) => (p.index === last ? <text x={Number(p.x)} y={Number(p.y) - 8} textAnchor="middle" fontSize={12} fontWeight={600} fill={INK.primary}>{String(p.value)}</text> : null)} />
          </Area>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* --------------------------- Barras horizontales --------------------------- */

export function BarList({ data, height, unit = '', valueSuffix = '' }: { data: Datum[]; height?: number; unit?: string; valueSuffix?: string }) {
  const h = height ?? Math.max(120, data.length * 38 + 16);
  return (
    <div style={{ height: h }} role="img" aria-label={data.map((d) => `${d.label}: ${d.value}${valueSuffix}`).join('; ')}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }} barCategoryGap={10}>
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis type="category" dataKey="label" width={118} tickLine={false} axisLine={false} tick={{ fill: INK.secondary, fontSize: 12.5 }} />
          <Tooltip cursor={{ fill: '#F1F4F9' }} content={<ChartTooltip formatter={(v) => `${v}${valueSuffix || unit}`} />} />
          <Bar isAnimationActive={false} dataKey="value" name="Total" barSize={18} radius={[0, 4, 4, 0]} background={{ fill: '#F4F6FA', radius: 4 }}>
            {data.map((d) => (
              <Cell key={d.key} fill={d.color ?? '#2a78d6'} />
            ))}
            <LabelList dataKey="value" position="right" offset={8} formatter={(v: number) => `${v}${valueSuffix}`} style={{ fill: INK.primary, fontSize: 12, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------- Columnas ---------------------------------- */

export function ColumnChart({ data, height = 220, color = '#2a78d6', unit = '' }: { data: Datum[]; height?: number; color?: string; unit?: string }) {
  return (
    <div style={{ height }} role="img" aria-label={data.map((d) => `${d.label}: ${d.value}`).join('; ')}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, right: 8, left: -20, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid stroke={INK.grid} vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: INK.baseline }} tick={{ fill: INK.muted, fontSize: 12 }} interval={0} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: INK.muted, fontSize: 12 }} />
          <Tooltip cursor={{ fill: '#F1F4F9' }} content={<ChartTooltip formatter={(v) => `${v}${unit}`} />} />
          <Bar isAnimationActive={false} dataKey="value" name="Total" maxBarSize={24} radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.key} fill={d.color ?? color} />
            ))}
            <LabelList dataKey="value" position="top" offset={6} style={{ fill: INK.primary, fontSize: 12, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ----------------------------- Columnas apiladas --------------------------- */

export interface StackSeries {
  key: string;
  label: string;
  color: string;
}

export function StackedColumns({ data, series, height = 260 }: { data: ({ label: string } & Record<string, number | string>)[]; series: StackSeries[]; height?: number }) {
  return (
    <div>
      <div style={{ height }} role="img" aria-label="Gráfico de columnas apiladas; los valores están en la tabla de datos">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid stroke={INK.grid} vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: INK.baseline }} tick={{ fill: INK.muted, fontSize: 12 }} interval={0} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: INK.muted, fontSize: 12 }} />
            <Tooltip cursor={{ fill: '#F1F4F9' }} content={<ChartTooltip />} />
            {series.map((s, i) => (
              <Bar isAnimationActive={false} key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={s.color} maxBarSize={24} stroke={INK.surface} strokeWidth={1} radius={i === series.length - 1 ? [4, 4, 0, 0] : 0} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend className="mt-3" items={series.map((s) => ({ label: s.label, color: s.color }))} />
    </div>
  );
}

/* --------------------------------- Anillo ---------------------------------- */

export function Donut({ data, size = 190, centerLabel, centerValue, inline = false }: { data: Datum[]; size?: number; centerLabel?: string; centerValue?: ReactNode; inline?: boolean }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const shown = data.filter((d) => d.value > 0);
  return (
    <div className={cn('flex flex-col items-center gap-4', inline && 'sm:flex-row sm:gap-6')}>
      <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={data.map((d) => `${d.label}: ${d.value}`).join('; ')}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip formatter={(v) => `${v} (${total ? Math.round((v / total) * 100) : 0} %)`} />} />
            <Pie data={shown} dataKey="value" nameKey="label" innerRadius="64%" outerRadius="96%" paddingAngle={shown.length > 1 ? 2 : 0} stroke={INK.surface} strokeWidth={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
              {shown.map((d) => (
                <Cell key={d.key} fill={d.color ?? '#2a78d6'} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tracking-tight text-navy-900">{centerValue ?? total}</span>
          {centerLabel ? <span className="text-xs text-slate-500">{centerLabel}</span> : null}
        </div>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-2">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2 text-[0.8125rem]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-slate-600">{d.label}</span>
            <span className="font-semibold tabular-nums text-navy-900">{d.value}</span>
            <span className="w-10 text-right tabular-nums text-slate-400">{total ? Math.round((d.value / total) * 100) : 0} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
