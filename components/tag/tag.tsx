import { X } from "@phosphor-icons/react";
import { useEffect, useRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { truncationTitles } from "../lib/truncate";
import { Button } from "../button/button";
import { Tooltip } from "../tooltip/tooltip";
import { tag } from "./tag.recipe";

export type TagTone = "neutral" | "accent" | "blue" | "green" | "orange" | "red" | "purple" | "cyan" | "yellow" | "pink";
export type TagSize = "md" | "sm";
export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: TagTone;
  /** tint (default): the box takes the hue. outline: a neutral box with the hue in its dot (Linear's labels); the dot shows. */
  variant?: "tint" | "outline";
  size?: TagSize;
  /** Radius only: rounded (default) or pill, for a tag in a pill-shaped host. */
  shape?: "rounded" | "pill";
  /** Leading dot in the tag's hue. */
  dot?: boolean;
  /** Remove button at the end. */
  removable?: boolean;
  /** aria-label of the remove button. */
  removeLabel?: string;
  onRemove?: () => void;
  /** A tooltip on the remove button (the real Tooltip around it). */
  removeTooltip?: string;
  /** Attributes for the remove button, e.g. a data attribute the owner uses to move focus after a removal. */
  removeProps?: ButtonHTMLAttributes<HTMLButtonElement> & { [data: `data-${string}`]: string | undefined };
  /** A glyph before the label (a file, a source); takes the dot's place. */
  icon?: ReactNode;
};

/** The squarer, bordered label of tables and fields, optionally removable. */
export function Tag({ tone = "neutral", variant = "tint", size = "md", shape = "rounded", dot = false, removable, removeLabel = "Remove", onRemove, removeTooltip, removeProps, icon, className, children, ...rest }: TagProps) {
  const showDot = (dot || variant === "outline") && !icon;
  const label = useRef<HTMLSpanElement>(null);
  const hasLabel = children != null && children !== false;
  /* a label cut by its ellipsis carries its full text as a title */
  useEffect(() => truncationTitles(label.current), [hasLabel]);
  const r = tag({ tone, variant, size, shape, removable: !!removable });
  const remove = removable ? (
    <Button
      {...removeProps}
      data-tag="remove"
      className={r.remove({ class: removeProps?.className })}
      variant="ghost"
      size="xs"
      shape={shape}
      square
      iconSize={size === "sm" ? 10 : 12}
      aria-label={removeLabel}
      onClick={(e) => { removeProps?.onClick?.(e); onRemove?.(); }}
      icon={<X data-slot="icon" weight="bold" />}
    />
  ) : null;
  return (
    <span data-slot="tag" className={r.base({ class: className })} {...rest}>
      {showDot && <span data-slot="tag-dot" className={r.dot()} aria-hidden="true" />}
      {icon && <span data-slot="tag-icon" className={r.icon()} aria-hidden="true">{icon}</span>}
      {hasLabel && <span ref={label} data-slot="tag-label" className={r.label()}>{children}</span>}
      {remove && (removeTooltip ? <Tooltip content={removeTooltip}>{remove}</Tooltip> : remove)}
    </span>
  );
}
