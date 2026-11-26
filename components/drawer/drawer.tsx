"use client";
import { Drawer as ArkDrawer } from "@ark-ui/react/drawer";
import { Portal } from "@ark-ui/react/portal";
import { X } from "@phosphor-icons/react";
import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { Button } from "../button/button";
import { Tooltip } from "../tooltip/tooltip";
import { trackModality } from "../lib/modality";
import { drawer } from "./drawer.recipe";

export type DrawerSide = "bottom" | "end" | "start";
export type DrawerActionVariant = "primary" | "outline" | "secondary" | "accent" | "success" | "danger" | "danger-outline" | "ghost";
export type DrawerAction = {
  label: string;
  /** Passed to onAction. Defaults to the label. */
  value?: string;
  variant?: DrawerActionVariant;
  /** false keeps the sheet open after the press. */
  close?: boolean;
};

export type DrawerProps = {
  /** Controlled open state. Omit for uncontrolled (use defaultOpen). */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The edge it slides from and is dragged back to: bottom (default), end, start. */
  side?: DrawerSide;
  /** Names the sheet. Required. */
  title: ReactNode;
  description?: ReactNode;
  /** Footer Buttons in order, least destructive first. */
  actions?: ReadonlyArray<DrawerAction>;
  onAction?: (value: string) => void;
  /** Custom footer instead of `actions`. */
  footer?: ReactNode;
  /** Show the close button in the header. */
  closable?: boolean;
  /** Your own trigger: one element. It receives the drawer's trigger props. */
  trigger?: ReactElement;
  /** Renders a default Button trigger with this label when no `trigger` is given. */
  triggerLabel?: string;
  /** Body content. */
  children?: ReactNode;
  className?: string;
  [data: `data-${string}`]: string | undefined;
};

const SWIPE = { bottom: "down", end: "end", start: "start" } as const;

/** A sheet that slides in from an edge and is dragged away. Behaviour by Ark UI (Zag drawer). */
export function Drawer({
  open, defaultOpen = false, onOpenChange, side = "bottom", title, description, actions, onAction, footer, closable = true,
  trigger, triggerLabel, children, className, ...data
}: DrawerProps) {
  const [inner, setInner] = useState(defaultOpen);
  const isOpen = open ?? inner;
  const setOpen = (next: boolean) => {
    if (open === undefined) setInner(next);
    onOpenChange?.(next);
  };
  /* open when it mounted: drawn at once (the recipe skips the entrance) until it first closes */
  const [mountedOpen, setMountedOpen] = useState(isOpen);
  if (mountedOpen && !isOpen) setMountedOpen(false);
  useEffect(() => trackModality(), []);
  const r = drawer({ side });

  return (
    <div {...data} data-slot="drawer" className={r.base({ class: className })}>
      <ArkDrawer.Root open={isOpen} onOpenChange={(details) => setOpen(details.open)} swipeDirection={SWIPE[side]}>
        {trigger ? (
          <ArkDrawer.Trigger asChild>{trigger}</ArkDrawer.Trigger>
        ) : triggerLabel ? (
          <ArkDrawer.Trigger asChild><Button data-drawer="trigger" size="sm" className={r.trigger()}>{triggerLabel}</Button></ArkDrawer.Trigger>
        ) : null}
        <Portal>
          <ArkDrawer.Backdrop data-slot="drawer-backdrop" data-mounted-open={mountedOpen ? "" : undefined} className={r.backdrop()} />
          <ArkDrawer.Positioner data-slot="drawer-positioner" className={r.positioner()}>
            <ArkDrawer.Content data-slot="drawer-content" data-mounted-open={mountedOpen ? "" : undefined} className={r.content()}>
              {side === "bottom" && (
                <ArkDrawer.Grabber data-slot="drawer-grabber" className={r.grabber()} aria-hidden>
                  <ArkDrawer.GrabberIndicator data-slot="drawer-grabber-indicator" className={r.grabberIndicator()} />
                </ArkDrawer.Grabber>
              )}
              <div data-slot="drawer-header" className={r.header()}>
                <ArkDrawer.Title data-slot="drawer-title" className={r.title()}>{title}</ArkDrawer.Title>
                {closable && (
                  <ArkDrawer.CloseTrigger asChild>
                    <Tooltip content="Close">
                      <Button data-drawer="close" className={r.close()} variant="ghost" size="sm" shape="rounded" square muted aria-label="Close" icon={<X data-slot="icon" weight="bold" />} />
                    </Tooltip>
                  </ArkDrawer.CloseTrigger>
                )}
              </div>
              {description && <ArkDrawer.Description data-slot="drawer-description" className={r.description()}>{description}</ArkDrawer.Description>}
              {children && <div data-slot="drawer-body" className={r.body()}>{children}</div>}
              {(footer || (actions && actions.length > 0)) && (
                <div data-slot="drawer-footer" className={r.footer()}>
                  {footer ??
                    actions!.map((action) => (
                      <Button
                        key={action.value ?? action.label}
                        variant={action.variant ?? "outline"}
                        size="sm"
                        onClick={() => {
                          onAction?.(action.value ?? action.label);
                          if (action.close !== false) setOpen(false);
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                </div>
              )}
            </ArkDrawer.Content>
          </ArkDrawer.Positioner>
        </Portal>
      </ArkDrawer.Root>
    </div>
  );
}
