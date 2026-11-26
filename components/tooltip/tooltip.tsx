"use client";
import { Portal } from "@ark-ui/react/portal";
import { Tooltip as ArkTooltip } from "@ark-ui/react/tooltip";
import { isValidElement, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Button } from "../button/button";
import { Kbd } from "../kbd/kbd";
import { tooltip } from "./tooltip.recipe";
import { trackModality } from "../lib/modality";

export type TooltipPlacement = "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "right";

export type TooltipProps = {
  /** The label. Keep it short; a tooltip never holds interactive content. */
  content: ReactNode;
  /** Keyboard shortcut hint, e.g. "⌘C". */
  shortcut?: string;
  placement?: TooltipPlacement;
  /** Milliseconds before the first tooltip opens on hover. Neighbours open at once. */
  openDelay?: number;
  disabled?: boolean;
  /** Renders a default Button trigger with this label. Otherwise pass the trigger as the child. */
  triggerLabel?: string;
  /** The trigger: one element (a button, a link). It receives the tooltip's props. */
  children?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  /** Machine id. Generated when omitted; set it when several React roots share a page. */
  id?: string;
  /** Id of a trigger that another component owns (a menu's), so the tooltip finds it. Set by itself when
   * the Tooltip is the as-child trigger of another component. */
  triggerId?: string;
  /** Anything else (props and a ref from an outer asChild trigger, such as a menu's or a dialog's) goes
   * to the trigger, so a tooltip can wrap the trigger of another component. */
  [prop: string]: unknown;
};

/** A dark chip that names a control. Behaviour by Ark UI (Zag tooltip). */
export function Tooltip({ content, shortcut, placement = "top", openDelay = 400, disabled, triggerLabel, children, onOpenChange, id, triggerId, ...rest }: TooltipProps) {
  useEffect(() => trackModality(), []);
  /* as the as-child trigger of another component (it passes its data-scope), `id` is that trigger's id */
  const hosted = rest["data-scope"] !== undefined;
  const machineId = hosted ? undefined : id;
  const ownerId = triggerId ?? (hosted ? id : undefined);
  if (ownerId !== undefined) rest.id = ownerId;
  /* As another component's trigger, `disabled` is that trigger's state (the host engine passes it, a
   * date picker's calendar button for one): it goes on the button, and the tooltip of a disabled
   * control stays closed. Before, the tooltip took it as its own prop and the button never
   * disabled. */
  if (hosted && disabled !== undefined) rest.disabled = disabled;
  /* A press on the trigger cancels a tooltip still waiting out its delay, and none opens again until
   * the pointer leaves: a quick click does not bring the label up over what the click opened (the
   * engine ignores a close while it waits). The state is held here so the open can be refused. */
  const [open, setOpen] = useState(false);
  const pressed = useRef(false);
  const { onPointerDown, onPointerLeave, ...outer } = rest as { onPointerDown?: (e: PointerEvent<HTMLElement>) => void; onPointerLeave?: (e: PointerEvent<HTMLElement>) => void; [prop: string]: unknown };
  const press = {
    onPointerDown: (e: PointerEvent<HTMLElement>) => { pressed.current = true; onPointerDown?.(e); },
    onPointerLeave: (e: PointerEvent<HTMLElement>) => { pressed.current = false; onPointerLeave?.(e); },
  };
  const r = tooltip();
  return (
    <ArkTooltip.Root
      {...(machineId ? { id: machineId } : {})} {...(ownerId ? { ids: { trigger: ownerId } } : {})} openDelay={openDelay} disabled={disabled} lazyMount positioning={{ placement, gutter: 6 }}
      open={open}
      onOpenChange={(details) => { if (details.open && pressed.current) return; setOpen(details.open); onOpenChange?.(details.open); }}
    >
      {isValidElement(children) ? (
        <ArkTooltip.Trigger asChild {...outer} {...press}>{children}</ArkTooltip.Trigger>
      ) : (
        <ArkTooltip.Trigger asChild {...press}><Button variant="outline" size="sm">{triggerLabel ?? children}</Button></ArkTooltip.Trigger>
      )}
      <Portal>
        <ArkTooltip.Positioner data-slot="tooltip-positioner" className={r.positioner()}>
          <ArkTooltip.Content data-slot="tooltip" className={r.base()}>
            <span data-slot="tooltip-label" className={r.label()}>{content}</span>
            {shortcut && <Kbd data-tooltip="shortcut" className={r.shortcut()} variant="plain" keys={[shortcut]} />}
          </ArkTooltip.Content>
        </ArkTooltip.Positioner>
      </Portal>
    </ArkTooltip.Root>
  );
}
