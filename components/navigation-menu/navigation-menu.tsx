"use client";
import { NavigationMenu as ArkNavigationMenu } from "@ark-ui/react/navigation-menu";
import { useLocaleContext } from "@ark-ui/react/locale";
import { Portal } from "@ark-ui/react/portal";
import { CaretDown } from "@phosphor-icons/react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { afterPaint } from "../lib/paint";
import { anchorPanel, holdsCurrent, isCurrent } from "./navigation-menu.logic";
import { Button } from "../button/button";
import { glide } from "../lib/glide";
import { trackModality } from "../lib/modality";
import { navigationMenu } from "./navigation-menu.recipe";

export type NavigationMenuLink = { label: string; href: string; description?: string; current?: boolean };
export type NavigationMenuItem = {
  value: string;
  label: string;
  /** A plain link in the row. */
  href?: string;
  /** A plain link: the current page. */
  current?: boolean;
  /** A trigger and its panel of links. */
  links?: ReadonlyArray<NavigationMenuLink>;
};

export type NavigationMenuProps = {
  /** The entries of the row in order: plain links (href) or triggers with a panel (links). */
  items: ReadonlyArray<NavigationMenuItem>;
  /** Controlled: the open panel's item value ("" for none), with onValueChange. Omit for uncontrolled (defaultValue). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** A link was followed. */
  onLinkSelect?: (href: string) => void;
  /** The current page's href: its link is aria-current="page", and the trigger whose panel holds it aria-current="true". */
  currentHref?: string;
  /** The nav landmark's accessible name. */
  label?: string;
  /** Milliseconds a mouse rests on a trigger before its panel opens. */
  openDelay?: number;
  /** Milliseconds after the mouse leaves before the panel closes. */
  closeDelay?: number;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

const r = navigationMenu();

/* one panel: the gliding highlight follows the pointer and the focus between its links */
function Panel({ item, onLinkSelect, currentHref }: { item: NavigationMenuItem; onLinkSelect?: (href: string) => void; currentHref?: string }) {
  /* the engine moves the content into the panel box once that box exists (a new element): the
   * highlight is attached to whichever element is mounted */
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    const layer = content?.querySelector<HTMLElement>("[data-slot=navigation-menu-highlight]");
    if (!content || !layer) return;
    return glide(content, layer, { rows: "[data-slot=navigation-menu-link]", follow: "hover" });
  }, [content]);
  return (
    <ArkNavigationMenu.Content ref={setContent} data-slot="navigation-menu-content" className={r.content()}>
      <span data-slot="navigation-menu-highlight" className={r.highlight()} aria-hidden />
      {item.links?.map((link) => (
        <ArkNavigationMenu.Link
          key={link.href + link.label}
          href={link.href}
          current={isCurrent(link, currentHref)}
          onSelect={() => onLinkSelect?.(link.href)}
          data-slot="navigation-menu-link"
          className={r.link()}
        >
          <span data-slot="navigation-menu-link-title" className={r.linkTitle()}>{link.label}</span>
          {link.description && <span data-slot="navigation-menu-link-description" className={r.linkDescription()}>{link.description}</span>}
        </ArkNavigationMenu.Link>
      ))}
    </ArkNavigationMenu.Content>
  );
}

/** A site's top navigation: links and triggers that open a panel of links. Behaviour by Ark UI (Zag navigation-menu). */
export function NavigationMenu({
  items, value, defaultValue, onValueChange, onLinkSelect, currentHref, label = "Main", openDelay = 200, closeDelay = 300, className, ...rest
}: NavigationMenuProps) {
  useEffect(() => trackModality(), []);
  const { dir } = useLocaleContext();
  /* The engine measures the trigger and sizes the panel box only when its value changes, so a panel
   * open at mount would get no size. The engine is always driven from here: closed for the first
   * paint, then the open value (controlled or our own). A panel open at mount is shown
   * without its entrance (nothing plays on first paint): its transitions are off until it has been
   * painted once. */
  const [own, setOwn] = useState(defaultValue ?? "");
  const [mounted, setMounted] = useState(false);
  const [settled, setSettled] = useState(false);
  /* after the first paint: by then the engine has found the panel box and moved the contents into
   * it, so the content it measures is the one that stays */
  useEffect(() => afterPaint(() => setMounted(true)), []);
  useEffect(() => (mounted && !settled ? afterPaint(() => setSettled(true)) : undefined), [mounted, settled]);
  const current = mounted ? (value ?? own) : "";
  /* the panel box lives in a portal, placed under the row while a panel is open (navigation-menu.logic.ts) */
  const root = useRef<HTMLElement>(null);
  const positioner = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => (current ? anchorPanel(root.current, positioner.current) : undefined), [current]);
  return (
    <ArkNavigationMenu.Root
      ref={root}
      data-slot="navigation-menu"
      className={r.base({ class: className })}
      aria-label={label}
      value={current}
      onValueChange={(d) => { if (value === undefined) setOwn(d.value); onValueChange?.(d.value); }}
      openDelay={openDelay}
      closeDelay={closeDelay}
      {...rest}
    >
      <ArkNavigationMenu.List data-slot="navigation-menu-list" className={r.list()}>
        {items.map((item) => (
          <ArkNavigationMenu.Item key={item.value} value={item.value} data-slot="navigation-menu-item" className={r.item()}>
            {item.links ? (
              <>
                <ArkNavigationMenu.Trigger asChild>
                  <Button
                    data-navigation-menu="trigger"
                    className={r.trigger()}
                    aria-current={holdsCurrent(item.links, currentHref) ? "true" : undefined}
                    variant="ghost"
                    size="sm"
                    trailingIcon={<CaretDown data-slot="navigation-menu-caret" className={r.caret()} weight="bold" />}
                  >
                    {item.label}
                  </Button>
                </ArkNavigationMenu.Trigger>
                <Panel item={item} onLinkSelect={onLinkSelect} currentHref={currentHref} />
              </>
            ) : (
              <ArkNavigationMenu.Link href={item.href} current={isCurrent(item, currentHref)} onSelect={() => item.href && onLinkSelect?.(item.href)} data-slot="navigation-menu-bar-link" className={r.barLink()}>
                {item.label}
              </ArkNavigationMenu.Link>
            )}
          </ArkNavigationMenu.Item>
        ))}
      </ArkNavigationMenu.List>
      <Portal>
      <ArkNavigationMenu.ViewportPositioner ref={positioner} data-slot="navigation-menu-viewport-positioner" className={r.viewportPositioner()} align={dir === "rtl" ? "end" : "start"}>
        {/* the engine turns transitions off on a first open (meant for a box that animates its
         * size); this box only grows as a popup, so its transition stays (but not at mount) */}
        <ArkNavigationMenu.Viewport data-slot="navigation-menu-viewport" className={r.viewport()} style={{ transition: settled ? undefined : "none" }} />
      </ArkNavigationMenu.ViewportPositioner>
      </Portal>
    </ArkNavigationMenu.Root>
  );
}
