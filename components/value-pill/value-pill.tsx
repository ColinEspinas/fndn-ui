import type { HTMLAttributes } from "react";
import { valuePill } from "./value-pill.recipe";

export type ValuePillTone = "neutral" | "green" | "orange" | "red" | "accent";
export type ValuePillProps = HTMLAttributes<HTMLSpanElement> & { tone?: ValuePillTone };

/** Inline value badge set off in prose. */
export function ValuePill({ tone = "neutral", className, ...rest }: ValuePillProps) {
  return <span data-slot="value-pill" className={valuePill({ tone, class: className })} {...rest} />;
}
