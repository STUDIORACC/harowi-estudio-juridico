import { Facebook, Globe } from 'lucide-react';
import { WhatsappIcon } from '@/components/whatsapp/WhatsappIcon';
import {
  APPOINTMENT_STATUS_BY_ID,
  AREAS,
  CASE_STATUS_BY_ID,
  CHANNELS,
  CONVERSATION_STATUS_BY_ID,
  PRIORITY_BY_ID,
  STAGE_BY_ID,
  TASK_STATUS_BY_ID,
} from '@/crm/constants';
import type { AppointmentStatus, AreaId, CaseStatus, ChannelId, ConversationStatus, Priority, StageId, TaskStatus } from '@/crm/types';
import { cn } from '@/lib/utils';
import { Badge } from './Badge';

export function ChannelIcon({ channel, className }: { channel: ChannelId; className?: string }) {
  const cls = cn('h-3.5 w-3.5', className);
  if (channel === 'whatsapp') return <WhatsappIcon className={cn(cls, 'text-[#008300]')} />;
  if (channel === 'facebook') return <Facebook className={cn(cls, 'text-[#2a78d6]')} aria-hidden />;
  return <Globe className={cn(cls, 'text-[#d9588d]')} aria-hidden />;
}

export function ChannelBadge({ channel, short }: { channel: ChannelId; short?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-slate-600">
      <ChannelIcon channel={channel} />
      {short && channel === 'facebook' ? 'Facebook' : CHANNELS[channel].name}
    </span>
  );
}

export function AreaBadge({ area, short = true }: { area: AreaId | null; short?: boolean }) {
  if (!area) return <Badge tone="neutral">Por clasificar</Badge>;
  const meta = AREAS[area];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[0.8125rem] text-navy-800">
      <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} aria-hidden />
      {short ? meta.short : meta.name}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const p = PRIORITY_BY_ID[priority];
  return (
    <Badge tone={p.tone} dot>
      {p.label}
    </Badge>
  );
}

export function StageBadge({ stage }: { stage: StageId }) {
  const s = STAGE_BY_ID[stage];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const s = CASE_STATUS_BY_ID[status];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const s = APPOINTMENT_STATUS_BY_ID[status];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

export function ConversationStatusBadge({ status }: { status: ConversationStatus }) {
  const s = CONVERSATION_STATUS_BY_ID[status];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const s = TASK_STATUS_BY_ID[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
