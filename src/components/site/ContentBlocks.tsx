import { Info } from 'lucide-react';
import type { ContentBlock } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Renderiza el contenido enriquecido almacenado como JSONB. Se usa en las
 * páginas de servicio y en los artículos del blog.
 *
 * El formato es deliberadamente simple: evita depender de un parser de
 * Markdown y permite editar el contenido desde el panel sin riesgo de inyectar
 * HTML arbitrario.
 */
export function ContentBlocks({
  blocks,
  className,
}: {
  blocks: ContentBlock[];
  className?: string;
}) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className={cn('prose-legal', className)}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'h2':
            return <h2 key={index}>{block.text}</h2>;
          case 'h3':
            return <h3 key={index}>{block.text}</h3>;
          case 'ul':
            return (
              <ul key={index}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={index} className="mt-5 list-decimal space-y-2.5 pl-5 marker:text-ink-muted">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="pl-1">
                    {item}
                  </li>
                ))}
              </ol>
            );
          case 'quote':
            return (
              <blockquote
                key={index}
                className="my-9 border-l-2 border-accent pl-6 font-display text-[1.1875rem] leading-relaxed text-ink"
              >
                {block.text}
              </blockquote>
            );
          case 'note':
            return (
              <aside
                key={index}
                className="my-9 flex gap-3 rounded-xl border border-line bg-paper-alt/60 p-5"
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <p className="text-[0.875rem] leading-relaxed text-ink-muted">{block.text}</p>
              </aside>
            );
          case 'p':
          default:
            return <p key={index}>{block.text}</p>;
        }
      })}
    </div>
  );
}
