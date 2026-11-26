import { forwardRef, useEffect, useLayoutEffect, useRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import { button, buttonSpinner } from "./button.recipe";
import { Spinner } from "../spinner/spinner";
import { truncationTitles } from "../lib/truncate";
import { trackModality } from "../lib/modality";
import { easeSwapWidth, watchSwapWidth } from "./swap";

export type ButtonVariant = "primary" | "outline" | "secondary" | "accent" | "success" | "danger" | "danger-outline" | "ghost";
export type ButtonSize = "xs" | "sm" | "md" | "lg";
export type ButtonShape = "pill" | "rounded";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon-only: equal width and height (24, 28 or 32). Needs an aria-label. */
  square?: boolean;
  /** Radius only: pill (a pill square is round) or rounded. Left out, the app's shape (a pill, or rounded in a rounded app: "shape": "rounded" in the project's fndn.json). */
  shape?: ButtonShape;
  /** ink-3 at rest, ink when hovered, pressed or open. */
  muted?: boolean;
  /** Two states in one cell (Copy / Copied): shows the second label and icon. */
  swapped?: boolean;
  /** Leading icon, rendered in the icon part. */
  icon?: ReactNode;
  /** Trailing icon (a caret after the label), rendered in an icon part after the label. */
  trailingIcon?: ReactNode;
  /** Square buttons: the icon's size in px (--fndn-button-icon-size); defaults to 14 / 15 / 16 by size. */
  iconSize?: number;
  /** Work under way: a spinner takes the icon's place (or covers the label), aria-busy, clicks are
   * dropped; the width does not change and the button keeps its focus. */
  busy?: boolean;
};

/** The app's core button, in the app's shape: a pill unless the app is rounded. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "outline", size = "md", square, shape, muted, swapped, icon, trailingIcon, iconSize, busy, className, style, children, type = "button", onClick, ...rest },
  ref,
) {
  const label = useRef<HTMLSpanElement>(null);
  const hasLabel = children != null && children !== false;
  /* a label cut by its ellipsis carries its full text as a title */
  useEffect(() => truncationTitles(label.current), [hasLabel]);
  useEffect(() => trackModality(), []);
  /* two states in one cell (Copy / Copied): the width eases to the new label with the cross-fade */
  useEffect(() => watchSwapWidth(label.current?.parentElement), [hasLabel]);
  const wasSwapped = useRef(!!swapped);
  useLayoutEffect(() => {
    if (wasSwapped.current === !!swapped) return;
    wasSwapped.current = !!swapped;
    easeSwapWidth(label.current?.parentElement);
  }, [swapped]);
  const r = button({ variant, size, shape, square: !!square, muted: !!muted, swapped: !!swapped, busy: !!busy, cover: !!busy && !icon, holding: !!busy && !!icon });
  const spin = busy ? <Spinner data-button="spinner" className={buttonSpinner({ cover: !icon })} decorative /> : null;
  return (
    <button
      ref={ref}
      type={type}
      data-slot="button"
      className={r.base({ class: className })}
      style={iconSize == null ? style : ({ ...style, "--fndn-button-icon-size": `${iconSize}px` } as CSSProperties)}
      aria-busy={busy || undefined}
      {...rest}
      /* busy: a press does nothing (a submit button does not submit either) */
      onClick={busy ? (event) => event.preventDefault() : onClick}
    >
      {icon && <span data-slot="button-icon" className={r.icon()} aria-hidden>{icon}{spin}</span>}
      {hasLabel && <span ref={label} data-slot="button-label" className={r.label()}>{children}</span>}
      {trailingIcon && <span data-slot="button-icon" data-trailing="" className={r.icon({ holding: false })} aria-hidden>{trailingIcon}</span>}
      {!icon && spin}
    </button>
  );
});
