/**
 * Lista com barras horizontais finas — uma métrica, um tom (latão).
 * Valor e participação ficam escritos ao lado (rótulo direto), então a
 * barra só reforça a proporção; nunca é a única fonte da informação.
 */

const int = new Intl.NumberFormat("pt-BR");
const pct = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export function BarList({
  items,
  unit,
  showShare = true,
  emptyText = "Sem dados no período.",
}: {
  items: { label: string; value: number; hint?: string }[];
  /** Nome da métrica, no plural (ex.: "sessões"). */
  unit: string;
  showShare?: boolean;
  emptyText?: string;
}) {
  const total = items.reduce((sum, i) => sum + i.value, 0);
  const max = Math.max(0, ...items.map((i) => i.value));

  if (items.length === 0 || total === 0) {
    return <p className="text-sm text-bone-dim">{emptyText}</p>;
  }

  return (
    <ul className="flex flex-col gap-3.5" aria-label={`Valores em ${unit}`}>
      {items.map((item) => {
        const share = total > 0 ? item.value / total : 0;
        return (
          <li key={item.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="min-w-0 truncate text-bone" title={item.label}>
                {item.label}
                {item.hint ? (
                  <span className="ml-2 text-xs text-bone-dim">{item.hint}</span>
                ) : null}
              </span>
              <span className="shrink-0 tabular-nums text-bone-dim">
                <span className="text-bone">{int.format(item.value)}</span>
                {showShare ? ` · ${pct.format(share * 100)}%` : null}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-hairline/60" aria-hidden="true">
              <div
                className="h-full rounded-full bg-brass"
                style={{ width: `${max > 0 ? Math.max(item.value > 0 ? 2 : 0, (item.value / max) * 100) : 0}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
