import { forwardRef, useId, type HTMLAttributes } from "react";
import { separator } from "./separator.recipe";

export type SeparatorOrientation = "horizontal" | "vertical";

export type SeparatorProps = HTMLAttributes<HTMLDivElement> & {
  /** horizontal (default): 1px high, full width. vertical: 1px wide, as tall as its row. */
  orientation?: SeparatorOrientation;
  /** Purely visual: role="none", skipped by assistive technology. */
  decorative?: boolean;
};

/** A 1px rule that divides content, with an optional label in the middle. */
export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(function Separator(
  { orientation = "horizontal", decorative, className, children, ...rest },
  ref,
) {
  const labelId = useId();
  const labelled = children != null && children !== false && children !== "";
  const r = separator({ orientation, labelled });
  /* a separator's children are presentational: a labelled one is named by its label */
  const a11y = decorative
    ? { role: "none" }
    : { role: "separator", "aria-orientation": orientation, ...(labelled ? { "aria-labelledby": labelId } : {}) };
  return (
    <div ref={ref} data-slot="separator" {...a11y} className={r.base({ class: className })} {...rest}>
      {labelled && <span id={labelId} data-slot="separator-label" className={r.label()}>{children}</span>}
    </div>
  );
});
