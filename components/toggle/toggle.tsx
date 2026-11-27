"use client";
import { Toggle as ArkToggle } from "@ark-ui/react/toggle";
import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Tooltip } from "../tooltip/tooltip";
import { toggle } from "./toggle.recipe";
import { trackModality } from "../lib/modality";
import { truncationTitles } from "../lib/truncate";

export type ToggleVariant = "outline" | "ghost";
export type ToggleSize = "xs" | "sm" | "md" | "lg";
export type ToggleShape = "pill" | "rounded";

export type ToggleProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  /** Controlled: pressed with onPressedChange. Omit for uncontrolled (defaultPressed). */
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  variant?: ToggleVariant;
  size?: ToggleSize;
  /** Radius only: pill or rounded. Left out, the app's shape (a pill, or rounded in a rounded app: "shape": "rounded" in the project's fndn.json). */
  shape?: ToggleShape;
  /** Icon-only: equal width and height (24, 28 or 32). Name it with tooltip or aria-label. */
  square?: boolean;
  /** ink-3 at rest, ink when hovered, held down or pressed. */
  muted?: boolean;
  /** Icon, rendered in the icon part. */
  icon?: ReactNode;
  /** Wraps the toggle in a Tooltip with this text; also the name (aria-label) of a square or icon-only toggle that has none. */
  tooltip?: string;
};

/** A button that stays pressed. Behaviour by Ark UI (Zag toggle). */
export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { pressed, defaultPressed, onPressedChange, variant = "outline", size = "md", shape, square, muted, icon, tooltip, className, children, ...rest },
  ref,
) {
  useEffect(() => trackModality(), []);
  const label = useRef<HTMLSpanElement>(null);
  const hasLabel = children != null && children !== false;
  /* a label cut by its ellipsis carries its full text as a title */
  useEffect(() => truncationTitles(label.current), [hasLabel]);
  const r = toggle({ variant, size, shape, square: !!square, muted: !!muted });
  const root = (
    <ArkToggle.Root
      ref={ref}
      pressed={pressed}
      defaultPressed={defaultPressed}
      onPressedChange={onPressedChange}
      data-slot="toggle"
      className={r.base({ class: className })}
      {...(tooltip && (square || !hasLabel) && rest["aria-label"] == null ? { "aria-label": tooltip } : {})}
      {...rest}
    >
      {icon && <span data-slot="toggle-icon" className={r.icon()} aria-hidden>{icon}</span>}
      {hasLabel && <span ref={label} data-slot="toggle-label" className={r.label()}>{children}</span>}
    </ArkToggle.Root>
  );
  return tooltip ? <Tooltip content={tooltip}>{root}</Tooltip> : root;
});
