'use client';

import { memberFull } from '@/crm/lib/people';
import { useCrm } from '@/crm/store/store';
import type { AvailabilityRule, Member } from '@/crm/types';
import { Avatar, Card, CardHeader } from '../ui/Layout';

const DAYS: [number, string][] = [[1, 'Lun'], [2, 'Mar'], [3, 'Mié'], [4, 'Jue'], [5, 'Vie'], [6, 'Sáb']];

const compact = (rules: AvailabilityRule[]) => (rules.length ? rules.map((r) => `${r.start.replace(/^0/, '')}–${r.end.replace(/^0/, '')}`).join(' · ') : '—');

/** Horarios de disponibilidad semanal de los abogados (datos ficticios). */
export function AvailabilityCard() {
  const state = useCrm();
  const lawyers = state.members.filter((m): m is Member => m.kind === 'abogado');
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Disponibilidad del equipo" description="Horarios en los que cada abogado recibe consultas. La agenda solo ofrece estos horarios." />
      <div className="crm-scroll overflow-x-auto">
        <table className="w-full min-w-[44rem] text-[0.8125rem]">
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50/70 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-2 font-semibold">Abogado</th>
              {DAYS.map(([, label]) => (
                <th key={label} className="px-3 py-2 font-semibold">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lawyers.map((l) => (
              <tr key={l.id} className="border-b border-slate-100 last:border-0">
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={l.name} size="sm" tone="navy" />
                    <div>
                      <p className="font-medium text-navy-900">{memberFull(l)}</p>
                      <p className="text-xs text-slate-500">{l.role}</p>
                    </div>
                  </div>
                </td>
                {DAYS.map(([wd]) => (
                  <td key={wd} className="px-3 py-2.5 align-top tabular-nums text-slate-600">{compact(l.availability.filter((r) => r.weekday === wd))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
