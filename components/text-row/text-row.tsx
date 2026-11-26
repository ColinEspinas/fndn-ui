import type { HTMLAttributes, ReactNode } from "react";
import { textRow } from "./text-row.recipe";

export type TextRowProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  label: ReactNode;
  value: ReactNode;
  meta?: ReactNode;
};

/** Label-left / value-right row. */
export function TextRow({ label, value, meta, className, ...rest }: TextRowProps) {
  const r = textRow();
  return (
    <div data-slot="text-row" className={r.base({ class: className })} {...rest}>
      <span data-slot="text-row-label" className={r.label()}>{label}</span>
      <span data-slot="text-row-values" className={r.values()}>
        <span data-slot="text-row-value" className={r.value()}>{value}</span>
        {meta !== undefined && meta !== null && <span data-slot="text-row-meta" className={r.meta()}>{meta}</span>}
      </span>
    </div>
  );
}
