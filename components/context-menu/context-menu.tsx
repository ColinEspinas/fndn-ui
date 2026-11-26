"use client";
import { Menu as ArkMenu } from "@ark-ui/react/menu";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { MenuPanel, type MenuEntry } from "../menu/menu";
import { contextMenu } from "./context-menu.recipe";

export type ContextMenuProps = {
  /** The Menu's entries: actions, checkbox options, groups, radio groups, separators, sub-menus. */
  items: ReadonlyArray<MenuEntry>;
  /** The area that is right-clicked (or long-pressed). */
  children?: ReactNode;
  /** The area keeps the browser's own context menu. */
  disabled?: boolean;
  /** The area's accessible name (it is focusable: Shift+F10 or the Menu key opens the menu from it). */
  label?: string;
  onSelect?: (value: string) => void;
  onCheckedChange?: (value: string, checked: boolean) => void;
  onRadioChange?: (name: string, value: string) => void;
  /** Controlled: it opens at the last pointer position. Before any right-click there is none: it
   * stays closed, moves no focus, and onOpenChange(false) says so. */
  open?: boolean;
  /** Uncontrolled. At mount there is no pointer position, so true is refused as `open` is. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  style?: CSSProperties;
  [data: `data-${string}`]: string | undefined;
};

/** The Menu, opened by a right-click or a long press on an area. Behaviour by Ark UI (Zag menu). */
export function ContextMenu({
  items, children, disabled, label, onSelect, onCheckedChange, onRadioChange, open, defaultOpen, onOpenChange, className, style, ...data
}: ContextMenuProps) {
  /* the menu opens at the pointer: until a right-click (or a long press, or Shift+F10) has given
   * the engine a position, an `open` from the host is refused, and the host is told it is closed */
  const [placed, setPlaced] = useState(false);
  const refused = (open ?? defaultOpen) === true && !placed;
  useEffect(() => { if (refused) onOpenChange?.(false); }, [refused]); // eslint-disable-line react-hooks/exhaustive-deps
  /* the element that had focus in the area when the menu opened: the menu has no trigger of its
   * own, so on close the engine leaves focus on the closing panel or nowhere; it goes back here */
  const back = useRef<HTMLElement | null>(null);
  const remember = (event: { currentTarget: HTMLElement }) => {
    const a = document.activeElement;
    back.current = a instanceof HTMLElement && event.currentTarget.contains(a) ? a : event.currentTarget;
  };
  const restore = () => requestAnimationFrame(() => {
    const a = document.activeElement;
    if (back.current?.isConnected && (!a || a === document.body || a.closest("[data-scope=menu][data-part=content]"))) back.current.focus({ preventScroll: true });
    back.current = null;
  });
  return (
    <ArkMenu.Root
      open={open === undefined ? undefined : open && placed}
      onOpenChange={(details) => { if (details.open) setPlaced(true); else restore(); onOpenChange?.(details.open); }}
      onSelect={(details) => onSelect?.(details.value)}
      /* its corner at the pointer, as the system's own context menus */
      positioning={{ placement: "bottom-start", gutter: 0 }}
    >
      {disabled ? (
        <div {...data} data-slot="context-menu" className={contextMenu({ class: className })} style={style}>{children}</div>
      ) : (
        <ArkMenu.ContextTrigger asChild>
          {/* focusable by itself, so a keyboard user can reach it and open the menu with Shift+F10 or the
           * Menu key (the browser's contextmenu event); Escape brings focus back here */}
          <div {...data} data-slot="context-menu" role="group" aria-label={label} aria-keyshortcuts="Shift+F10" tabIndex={0} onContextMenuCapture={remember} className={contextMenu({ class: className })} style={style}>{children}</div>
        </ArkMenu.ContextTrigger>
      )}
      <MenuPanel items={items} handlers={{ onSelect, onCheckedChange, onRadioChange }} />
    </ArkMenu.Root>
  );
}
