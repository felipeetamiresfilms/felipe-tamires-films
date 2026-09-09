/**
 * Injeta um bloco JSON-LD (schema.org). Server Component — sem JS no cliente.
 *
 * `</script>` dentro dos dados é escapado para não quebrar o documento
 * (títulos de filme e textos de parceiro são conteúdo livre).
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
