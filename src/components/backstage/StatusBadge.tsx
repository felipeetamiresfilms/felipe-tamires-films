import { publishStatusLabels } from "@/lib/labels";
import type { PublishStatus } from "@/types";

/** Etiqueta de status com tom próprio (não passa pelo <Badge> para o
 *  override de cor ser previsível). */
const TONE: Record<PublishStatus, string> = {
  draft: "border-hairline text-bone-dim",
  published: "border-brass/50 text-brass-soft",
  archived: "border-hairline text-bone-dim/60",
};

export function StatusBadge({ status }: { status: PublishStatus }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border bg-raised/60 px-3 py-1",
        "text-[0.68rem] font-medium uppercase tracking-[0.18em]",
        TONE[status],
      ].join(" ")}
    >
      {publishStatusLabels[status]}
    </span>
  );
}
