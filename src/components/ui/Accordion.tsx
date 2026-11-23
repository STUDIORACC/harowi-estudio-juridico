'use client';

import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AccordionItem {
  question: string;
  answer: string;
}

export function Accordion({
  items,
  className,
  defaultOpen = -1,
}: {
  items: AccordionItem[];
  className?: string;
  defaultOpen?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const baseId = useId();

  return (
    <div className={cn('divide-y divide-line border-y border-line', className)}>
      {items.map((item, index) => {
        const isOpen = open === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div key={item.question}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? -1 : index)}
                className="flex w-full items-start justify-between gap-6 py-6 text-left transition-colors duration-300 hover:text-accent"
              >
                <span className="font-display text-[1.0625rem] leading-snug sm:text-[1.1875rem]">
                  {item.question}
                </span>
                <Plus
                  className={cn(
                    'mt-1 h-4 w-4 shrink-0 text-ink-muted transition-transform duration-500 ease-smooth',
                    isOpen && 'rotate-45 text-accent',
                  )}
                  aria-hidden
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="pb-7 pr-10"
            >
              <p className="max-w-prose text-[0.9375rem] leading-[1.75] text-ink-soft animate-slide-up">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
