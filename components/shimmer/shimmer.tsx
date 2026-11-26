import type { HTMLAttributes } from "react";
import { shimmer } from "./shimmer.recipe";

export type ShimmerProps = HTMLAttributes<HTMLSpanElement> & { speed?: "normal" | "fast"; tone?: "ink" | "accent" };

/** Shimmering label — the agent is processing. */
export function Shimmer({ speed = "normal", tone = "ink", className, ...rest }: ShimmerProps) {
  return <span data-slot="shimmer" className={shimmer({ speed, tone, class: className })} {...rest} />;
}
