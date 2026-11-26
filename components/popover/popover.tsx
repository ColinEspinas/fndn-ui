"use client";
import { Popover as ArkPopover } from "@ark-ui/react/popover";
import { Portal } from "@ark-ui/react/portal";
import { X } from "@phosphor-icons/react";
import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { Button } from "../button/button";
import { popover } from "./popover.recipe";
import { Tooltip } from "../tooltip/tooltip";
import { trackModality } from "../lib/modality";

export type PopoverPlacement = "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "right";

export type PopoverProps = {
  /** Controlled open state. Omit for uncontrolled (use defaultOpen). */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  /** Show the close button in the header. */
  closable?: boolean;
  placement?: PopoverPlacement;
  /** Your own trigger: one element. It receives the popover's trigger props. */
  trigger?: ReactElement;
  /** Renders a default Button trigger with this label when no `trigger` is given. */
  triggerLabel?: string;
  /** Body content. */
  children?: ReactNode;
  className?: string;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** A small raised surface anchored to its trigger. Behaviour by Ark UI (Zag popover). */
export function Popover({
  open, defaultOpen, onOpenChange, title, description, closable = true, placement = "bottom-start", trigger, triggerLabel, children, className, ...data
}: PopoverProps) {
  useEffect(() => trackModality(), []);
  /* open when it mounted: drawn at once (the recipe skips the entrance) until it first closes */
  const [mountedOpen, setMountedOpen] = useState(Boolean(open ?? defaultOpen));
  if (mountedOpen && open === false) setMountedOpen(false);
  const r = popover();
  return (
    <div {...data} data-slot="popover" className={r.base({ class: className })}>
      <ArkPopover.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={(details) => { if (!details.open) setMountedOpen(false); onOpenChange?.(details.open); }}
        positioning={{ placement, gutter: 6 }}
      >
        {trigger ? (
          <ArkPopover.Trigger asChild>{trigger}</ArkPopover.Trigger>
        ) : (
          <ArkPopover.Trigger asChild><Button data-popover="trigger" className={r.trigger()} variant="outline" size="sm">{triggerLabel}</Button></ArkPopover.Trigger>
        )}
        <Portal>
          <ArkPopover.Positioner data-slot="popover-positioner" className={r.positioner()}>
            <ArkPopover.Content data-slot="popover-content" data-mounted-open={mountedOpen ? "" : undefined} className={r.content()}>
              {(title || closable) && (
                <div data-slot="popover-header" className={r.header()}>
                  {title && <ArkPopover.Title data-slot="popover-title" className={r.title()}>{title}</ArkPopover.Title>}
                  {closable && (
                    <ArkPopover.CloseTrigger asChild>
                      <Tooltip content="Close">
                        <Button variant="ghost" size="xs" shape="rounded" square muted aria-label="Close" data-popover="close" className={r.close()} icon={<X data-slot="icon" weight="bold" />} />
                      </Tooltip>
                    </ArkPopover.CloseTrigger>
                  )}
                </div>
              )}
              {description && <ArkPopover.Description data-slot="popover-description" className={r.description()}>{description}</ArkPopover.Description>}
              {children && <div data-slot="popover-body" className={r.body()}>{children}</div>}
            </ArkPopover.Content>
          </ArkPopover.Positioner>
        </Portal>
      </ArkPopover.Root>
    </div>
  );
}
