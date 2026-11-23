import type { ContentBlock, ProcessStep } from '@/types';
import { sanitize } from '@/lib/validation/schemas';

/**
 * ---------------------------------------------------------------------------
 * CONVERSIÓN DE FORMULARIOS DEL PANEL
 * ---------------------------------------------------------------------------
 * Los campos de lista se editan como texto, con un elemento por línea. Es más
 * cómodo que un constructor de elementos y evita depender de un editor
 * enriquecido para administrar el contenido.
 * ---------------------------------------------------------------------------
 */

export function text(formData: FormData, field: string, maxLength = 4000): string {
  return sanitize(formData.get(field), maxLength);
}

export function optionalText(formData: FormData, field: string, maxLength = 4000): string | null {
  const value = text(formData, field, maxLength);
  return value || null;
}

export function number(formData: FormData, field: string, fallback = 0): number {
  const value = Number(formData.get(field));
  return Number.isFinite(value) ? value : fallback;
}

export function boolean(formData: FormData, field: string): boolean {
  const value = formData.get(field);
  return value === 'on' || value === 'true' || value === '1';
}

/** Una línea por elemento; las líneas vacías se descartan. */
export function lines(formData: FormData, field: string, maxItems = 40): string[] {
  const raw = formData.get(field);
  if (typeof raw !== 'string') return [];
  return raw
    .split('\n')
    .map((line) => sanitize(line, 1000))
    .filter(Boolean)
    .slice(0, maxItems);
}

/** Pasos de un proceso: «Título | Descripción», una línea por paso. */
export function processSteps(formData: FormData, field: string): ProcessStep[] {
  return lines(formData, field, 12).map((line, index) => {
    const [title, ...rest] = line.split('|');
    return {
      step: String(index + 1).padStart(2, '0'),
      title: (title ?? '').trim(),
      description: rest.join('|').trim(),
    };
  });
}

/**
 * Contenido enriquecido en texto plano. Cada línea empieza con un prefijo:
 *   ##  encabezado de nivel 2      ###  encabezado de nivel 3
 *   -   elemento de lista           >   cita
 *   !   aviso                       (sin prefijo) párrafo
 */
export function contentBlocks(formData: FormData, field: string): ContentBlock[] {
  const raw = formData.get(field);
  if (typeof raw !== 'string') return [];

  const blocks: ContentBlock[] = [];
  let list: string[] | null = null;

  const flushList = () => {
    if (list && list.length > 0) blocks.push({ type: 'ul', items: list });
    list = null;
  };

  for (const rawLine of raw.split('\n')) {
    const line = sanitize(rawLine, 2000);
    if (!line) {
      flushList();
      continue;
    }

    if (line.startsWith('- ')) {
      list ??= [];
      list.push(line.slice(2).trim());
      continue;
    }

    flushList();

    if (line.startsWith('### ')) blocks.push({ type: 'h3', text: line.slice(4).trim() });
    else if (line.startsWith('## ')) blocks.push({ type: 'h2', text: line.slice(3).trim() });
    else if (line.startsWith('> ')) blocks.push({ type: 'quote', text: line.slice(2).trim() });
    else if (line.startsWith('! ')) blocks.push({ type: 'note', text: line.slice(2).trim() });
    else blocks.push({ type: 'p', text: line });
  }

  flushList();
  return blocks;
}

/** Operación inversa: convierte los bloques en el texto editable del panel. */
export function blocksToText(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'h2':
          return `## ${block.text}`;
        case 'h3':
          return `### ${block.text}`;
        case 'quote':
          return `> ${block.text}`;
        case 'note':
          return `! ${block.text}`;
        case 'ul':
        case 'ol':
          return block.items.map((item) => `- ${item}`).join('\n');
        default:
          return block.text;
      }
    })
    .join('\n\n');
}

export function stepsToText(steps: ProcessStep[]): string {
  return steps.map((step) => `${step.title} | ${step.description}`).join('\n');
}

/** Genera un slug a partir de un texto, para los formularios del panel. */
export function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}
