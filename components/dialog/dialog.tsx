"use client";
import { Dialog as ArkDialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import { X } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type FormEvent, type ReactElement, type ReactNode } from "react";
import { Button } from "../button/button";
import { Tooltip } from "../tooltip/tooltip";
import { trackModality } from "../lib/modality";
import { submittedAction } from "./dialog.logic";
import { dialog } from "./dialog.recipe";

export type DialogActionVariant = "primary" | "outline" | "secondary" | "accent" | "success" | "danger" | "danger-outline" | "ghost";
export type DialogAction = {
  label: string;
  /** Passed to onAction. Defaults to the label. */
  value?: string;
  variant?: DialogActionVariant;
  /** false keeps the dialog open after the press (or the form's submit). */
  close?: boolean;
  /** The id of a form in the body that this button submits (type="submit" form="<id>"). The
   * browser checks the form first; its submit event, not the click, calls onAction and closes. */
  form?: string;
};

export type DialogInitialFocus = HTMLElement | string | (() => HTMLElement | null);

export type DialogProps = {
  /** Controlled open state. Omit for uncontrolled (use defaultOpen). */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Names the dialog. Required. */
  title: ReactNode;
  description?: ReactNode;
  /** alertdialog is for destructive confirms: a click outside does not close it and focus starts on the first action. */
  role?: "dialog" | "alertdialog";
  /** Footer buttons in order, least destructive first. */
  actions?: ReadonlyArray<DialogAction>;
  onAction?: (value: string) => void;
  /** Custom footer instead of `actions`. */
  footer?: ReactNode;
  /** Show the close button in the header. */
  closable?: boolean;
  /** Bare: the dialog is only the frame (position, focus trap, motion). No fill, no shadow, no padding, no header; the title still names it for assistive technology. Its one child is the surface, as in a command palette. */
  bare?: boolean;
  /** Width: sm 360px, md 440px (default), lg 880px (a large preview). */
  size?: "sm" | "md" | "lg";
  /** Where the window sits: center (at the bottom on a phone), or top: pinned near the top and growing downward (a command palette). */
  placement?: "center" | "top";
  /** Opens and closes at once from the pointer too (a command palette): no fade or scale. */
  instant?: boolean;
  /** What takes focus when it opens: an element, a selector (looked up inside the window first), or a
   * function returning the element. Default: the first control (the first action for alertdialog). */
  initialFocus?: DialogInitialFocus;
  /** Your own trigger: one element. It receives the dialog's trigger props. */
  trigger?: ReactElement;
  /** Renders a default Button trigger with this label when no `trigger` is given. */
  triggerLabel?: string;
  /** Body content. */
  children?: ReactNode;
  className?: string;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** A centred window over a dimmed page. Behaviour by Ark UI (Zag dialog). */
export function Dialog({
  open, defaultOpen = false, onOpenChange, title, description, role = "dialog", actions, onAction, footer, closable = true, bare = false, size = "md", placement = "center", instant = false,
  initialFocus, trigger, triggerLabel, children, className, ...data
}: DialogProps) {
  const [inner, setInner] = useState(defaultOpen);
  const isOpen = open ?? inner;
  const setOpen = (next: boolean) => {
    if (open === undefined) setInner(next);
    onOpenChange?.(next);
  };
  /* open when it mounted: drawn at once (the recipe skips the entrance) until it first closes */
  const [mountedOpen, setMountedOpen] = useState(isOpen);
  if (mountedOpen && !isOpen) setMountedOpen(false);
  const footerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const act = (action: DialogAction) => {
    onAction?.(action.value ?? action.label);
    if (action.close !== false) setOpen(false);
  };
  /* an action that names a form acts on the form's submit, which the browser fires only for a valid form */
  const submitted = (event: FormEvent) => {
    const action = footer ? undefined : submittedAction(actions, footerRef.current, event.nativeEvent);
    if (action) act(action);
  };
  const focusEl = () => {
    if (typeof initialFocus === "function") return initialFocus();
    if (typeof initialFocus === "string") return headerRef.current?.parentElement?.querySelector<HTMLElement>(initialFocus) ?? document.querySelector<HTMLElement>(initialFocus);
    if (initialFocus) return initialFocus;
    return footerRef.current?.querySelector("button") ?? null;
  };
  useEffect(() => trackModality(), []);
  const r = dialog({ size, bare, placement, instant });

  return (
    <div {...data} data-slot="dialog" className={r.base({ class: className })}>
      <ArkDialog.Root
        open={isOpen}
        onOpenChange={(details) => setOpen(details.open)}
        role={role}
        closeOnInteractOutside={role !== "alertdialog"}
        initialFocusEl={initialFocus || role === "alertdialog" ? focusEl : undefined}
      >
        {trigger ? (
          <ArkDialog.Trigger asChild>{trigger}</ArkDialog.Trigger>
        ) : triggerLabel ? (
          <ArkDialog.Trigger asChild><Button data-dialog="trigger" size="sm" className={r.trigger()}>{triggerLabel}</Button></ArkDialog.Trigger>
        ) : null}
        <Portal>
          <ArkDialog.Backdrop data-slot="dialog-backdrop" data-mounted-open={mountedOpen ? "" : undefined} className={r.backdrop()} />
          {/* a press on the dimmed area must not pull focus out of the window */}
          <ArkDialog.Positioner data-slot="dialog-positioner" className={r.positioner()} onMouseDown={(e) => { if (e.target === e.currentTarget) e.preventDefault(); }}>
            <ArkDialog.Content data-slot="dialog-content" data-mounted-open={mountedOpen ? "" : undefined} className={r.content()} onSubmit={submitted}>
              <div ref={headerRef} data-slot="dialog-header" className={r.header()}>
                <ArkDialog.Title data-slot="dialog-title" className={r.title()}>{title}</ArkDialog.Title>
                {closable && !bare && (
                  <ArkDialog.CloseTrigger asChild>
                    <Tooltip content="Close">
                      <Button data-dialog="close" className={r.close()} variant="ghost" size="sm" shape="rounded" square muted aria-label="Close" icon={<X data-slot="icon" weight="bold" />} />
                    </Tooltip>
                  </ArkDialog.CloseTrigger>
                )}
              </div>
              {description && <ArkDialog.Description data-slot="dialog-description" className={r.description()}>{description}</ArkDialog.Description>}
              {children && <div data-slot="dialog-body" className={r.body()}>{children}</div>}
              {(footer || (actions && actions.length > 0)) && (
                <div ref={footerRef} data-slot="dialog-footer" className={r.footer()}>
                  {footer ??
                    actions!.map((action) => (
                      <Button
                        key={action.value ?? action.label}
                        variant={action.variant ?? "outline"}
                        size="sm"
                        {...(action.form ? { type: "submit" as const, form: action.form } : { onClick: () => act(action) })}
                      >
                        {action.label}
                      </Button>
                    ))}
                </div>
              )}
            </ArkDialog.Content>
          </ArkDialog.Positioner>
        </Portal>
      </ArkDialog.Root>
    </div>
  );
}
