"use client";
import { ToggleGroup as ArkToggleGroup } from "@ark-ui/react/toggle-group";
import { forwardRef, useEffect, useImperativeHandle, useRef, type CSSProperties, type ReactNode } from "react";
import { Tooltip } from "../tooltip/tooltip";
import { toggle } from "../toggle/toggle.recipe";
import { toggleGroup } from "./toggle-group.recipe";
import { trackModality } from "../lib/modality";
import { truncationTitles } from "../lib/truncate";

export type ToggleGroupItem = {
  value: string;
  /** Text of the item. With `square` it is not shown: it names the item and is its tooltip. */
  label?: string;
  /** Icon, e.g. <TextB data-slot="icon" weight="bold" />. */
  icon?: ReactNode;
  /** Tooltip text; a square item uses its label when this is left out. */
  tooltip?: string;
  disabled?: boolean;
};

export type ToggleGroupProps = {
  /** The toggles, in order. Strings are accepted as value = label. */
  items: ReadonlyArray<string | ToggleGroupItem>;
  /** Controlled: the pressed values, with onValueChange. Omit for uncontrolled (defaultValue). */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Several may be pressed at once (bold + italic). Otherwise one at most (alignment). */
  multiple?: boolean;
  /** One at most: a click on the pressed item releases it. */
  deselectable?: boolean;
  /** The Toggle's looks. */
  variant?: "outline" | "ghost";
  /** The Toggle's sizes, the one control scale: xs 24px, sm 28px, md 32px, lg 36px. */
  size?: "xs" | "sm" | "md" | "lg";
  /** Radius only: pill or rounded. Left out, the app's shape (a pill, or rounded in a rounded app: "shape": "rounded" in the project's fndn.json). */
  shape?: "pill" | "rounded";
  /** Icon-only items: as wide as they are tall, named and tipped by their labels. */
  square?: boolean;
  /** ink-3 at rest, ink when hovered, held down or pressed. */
  muted?: boolean;
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  /** Name of the group (role=group, or radiogroup when one at most). */
  "aria-label"?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** A row of Toggles, one or several pressed. Behaviour by Ark UI (Zag toggle-group). */
export const ToggleGroup = forwardRef<HTMLDivElement, ToggleGroupProps>(function ToggleGroup(
  {
    items, value, defaultValue, onValueChange, multiple, deselectable, variant = "outline", size = "md", shape, square, muted,
    orientation = "horizontal", disabled, className, ...rest
  },
  ref,
) {
  useEffect(() => trackModality(), []);
  const list = items.map((i): ToggleGroupItem => (typeof i === "string" ? { value: i, label: i } : i));
  const r = toggleGroup({ orientation, muted: !!muted, variant });
  const t = toggle({ variant, size, shape, square: !!square, muted: !!muted });
  const root = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => root.current as HTMLDivElement);
  /* a label cut by its ellipsis carries its full text as a title */
  useEffect(() => truncationTitles(root.current, "[data-slot=toggle-group-label]"), []);
  return (
    <ArkToggleGroup.Root
      ref={root}
      data-slot="toggle-group"
      className={r.base({ class: className })}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (d) => onValueChange(d.value) : undefined}
      multiple={multiple}
      deselectable={deselectable}
      orientation={orientation}
      disabled={disabled}
      {...rest}
    >
      {list.map((item) => {
        /* square: the icon alone shows, the label names the item and is its tooltip (an item without
         * an icon still shows its label, named by its tooltip when it has one) */
        const iconOnly = !!square && item.icon != null;
        const tip = item.tooltip ?? (iconOnly ? item.label : undefined);
        const name = square ? (item.tooltip ?? (iconOnly ? item.label : undefined)) : undefined;
        const node = (
          <ArkToggleGroup.Item
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            data-slot="toggle-group-item"
            className={t.base({ class: r.item() })}
            {...(name ? { "aria-label": name } : {})}
          >
            {item.icon && <span data-slot="toggle-group-icon" className={t.icon({ class: r.icon() })} aria-hidden>{item.icon}</span>}
            {!iconOnly && item.label && <span data-slot="toggle-group-label" className={t.label({ class: r.label() })}>{item.label}</span>}
          </ArkToggleGroup.Item>
        );
        return tip ? <Tooltip key={item.value} content={tip}>{node}</Tooltip> : node;
      })}
    </ArkToggleGroup.Root>
  );
});
