/**
 * Inserta datos estructurados (schema.org) en la página. El objeto se serializa
 * en el servidor; nunca recibe contenido introducido por visitantes.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
