<!-- A site's top navigation: links and triggers that open a panel of links. Behaviour by Ark UI (Zag navigation-menu). -->
<script lang="ts">
  import { NavigationMenu as ArkNavigationMenu } from "@ark-ui/svelte/navigation-menu";
  import { useLocaleContext } from "@ark-ui/svelte/locale";
  import CaretDown from "phosphor-svelte/lib/CaretDownIcon";
  import { afterPaint } from "../lib/paint";
  import { anchorPanel, forwardPanelKeys, holdsCurrent, isCurrent } from "./navigation-menu.logic";
  import Button from "../button/Button.svelte";
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

  type Props = {
    /** The entries of the row in order: plain links (href) or triggers with a panel (links). */
    items: ReadonlyArray<NavigationMenuItem>;
    /** Two-way bindable: the open panel's item value ("" for none), <NavigationMenu bind:value />. */
    value?: string;
    onvaluechange?: (value: string) => void;
    /** A link was followed. */
    onlinkselect?: (href: string) => void;
    /** The current page's href: its link is aria-current="page", and the trigger whose panel holds it aria-current="true". */
    currentHref?: string;
    /** The nav landmark's accessible name. */
    label?: string;
    /** Milliseconds a mouse rests on a trigger before its panel opens. */
    openDelay?: number;
    /** Milliseconds after the mouse leaves before the panel closes. */
    closeDelay?: number;
    id?: string;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    items, value = $bindable(""), onvaluechange, onlinkselect, currentHref, label = "Main", openDelay = 200, closeDelay = 300, class: className, ...rest
  }: Props = $props();

  const r = navigationMenu();
  const locale = useLocaleContext();

  /* The engine measures the trigger and sizes the panel box only when its value changes, so a panel
   * open at mount would get no size. The engine is always driven from here: closed for the first
   * paint, then the open value. A panel open at mount is shown without its entrance (nothing plays
   * on first paint): its transitions are off until it has been painted once. */
  let mounted = $state(false);
  let settled = $state(false);
  const current = $derived(mounted ? value : "");
  /* after the first paint: by then the engine has found the panel box and moved the contents into
   * it, so the content it measures is the one that stays */
  $effect(() => {
    trackModality();
    let cancel = afterPaint(() => {
      mounted = true;
      cancel = afterPaint(() => { settled = true; });
    });
    return () => cancel();
  });

  /* the panel box lives in a portal, placed under the row while a panel is open (navigation-menu.logic.ts) */
  let root = $state<HTMLElement | null>(null);
  let positioner = $state<HTMLElement | null>(null);
  $effect(() => (current ? anchorPanel(root, positioner) : undefined));
  /* The portal. The engine looks for the panel box once, when it starts; Ark's Portal mounts its
   * children a tick later, so a portalled box is never found and the panels stay in the row. The box
   * is rendered in place, then moved to <body> (as zag's own `portal` action does) and removed
   * with the component. */
  $effect(() => {
    const el = positioner;
    if (!el) return;
    document.body.append(el);
    return () => el.remove();
  });
  /* the panel's keys reach its item, as React's tree delivers them (navigation-menu.logic.ts) */
  $effect(() => forwardPanelKeys(root, positioner));

  /* one panel: the gliding highlight follows the pointer and the focus between its links. The engine
   * moves the content into the panel box once that box exists (a new element): the highlight is
   * attached to whichever element is mounted. */
  const glideIn = (el: HTMLElement) => (el.parentElement ? glide(el.parentElement, el, { rows: "[data-slot=navigation-menu-link]", follow: "hover" }) : undefined);
</script>

<ArkNavigationMenu.Root
  bind:ref={root}
  data-slot="navigation-menu"
  class={r.base({ class: className })}
  aria-label={label}
  value={current}
  onValueChange={(d) => { value = d.value; onvaluechange?.(d.value); }}
  {openDelay}
  {closeDelay}
  {...rest}
>
  <ArkNavigationMenu.List data-slot="navigation-menu-list" class={r.list()}>
    {#each items as item (item.value)}
      <ArkNavigationMenu.Item value={item.value} data-slot="navigation-menu-item" class={r.item()}>
        {#if item.links}
          <ArkNavigationMenu.Trigger>
            {#snippet asChild(props)}
              <Button {...props()} data-navigation-menu="trigger" class={r.trigger()} aria-current={holdsCurrent(item.links, currentHref) ? "true" : undefined} variant="ghost" size="sm">
                {item.label}
                {#snippet trailingIcon()}<CaretDown data-slot="navigation-menu-caret" class={r.caret()} weight="bold" />{/snippet}
              </Button>
            {/snippet}
          </ArkNavigationMenu.Trigger>
          <ArkNavigationMenu.Content data-slot="navigation-menu-content" class={r.content()}>
            <span {@attach glideIn} data-slot="navigation-menu-highlight" class={r.highlight()} aria-hidden="true"></span>
            {#each item.links as link (link.href + link.label)}
              <ArkNavigationMenu.Link href={link.href} current={isCurrent(link, currentHref)} onSelect={() => onlinkselect?.(link.href)} data-slot="navigation-menu-link" class={r.link()}>
                <span data-slot="navigation-menu-link-title" class={r.linkTitle()}>{link.label}</span>{#if link.description}<span data-slot="navigation-menu-link-description" class={r.linkDescription()}>{link.description}</span>{/if}
              </ArkNavigationMenu.Link>
            {/each}
          </ArkNavigationMenu.Content>
        {:else}
          <ArkNavigationMenu.Link href={item.href} current={isCurrent(item, currentHref)} onSelect={() => item.href && onlinkselect?.(item.href)} data-slot="navigation-menu-bar-link" class={r.barLink()}>{item.label}</ArkNavigationMenu.Link>
        {/if}
      </ArkNavigationMenu.Item>
    {/each}
  </ArkNavigationMenu.List>
  <ArkNavigationMenu.ViewportPositioner bind:ref={positioner} data-slot="navigation-menu-viewport-positioner" class={r.viewportPositioner()} align={locale().dir === "rtl" ? "end" : "start"}>
    <!-- the engine turns transitions off on a first open (meant for a box that animates its size);
         this box only grows as a popup, so its transition stays (but not at mount): an explicit
         undefined overrides the engine's value (its mergeProps takes style objects too) -->
    <ArkNavigationMenu.Viewport data-slot="navigation-menu-viewport" class={r.viewport()} style={{ transition: settled ? undefined : "none" } as unknown as string} />
  </ArkNavigationMenu.ViewportPositioner>
</ArkNavigationMenu.Root>
