<!-- The Menu, opened by a right-click or a long press on an area. Behaviour by Ark UI (Zag menu). -->
<script lang="ts">
  import { Menu as ArkMenu } from "@ark-ui/svelte/menu";
  import type { Snippet } from "svelte";
  import MenuPanel from "../menu/MenuPanel.svelte";
  import type { MenuEntry } from "../menu/Menu.svelte";
  import { contextMenu } from "./context-menu.recipe";

  type Props = {
    /** The Menu's entries: actions, checkbox options, groups, radio groups, separators, sub-menus. */
    items: ReadonlyArray<MenuEntry>;
    /** The area that is right-clicked (or long-pressed). */
    children?: Snippet;
    /** The area keeps the browser's own context menu. */
    disabled?: boolean;
    /** The area's accessible name (it is focusable: Shift+F10 or the Menu key opens the menu from it). */
    label?: string;
    onselect?: (value: string) => void;
    oncheckedchange?: (value: string, checked: boolean) => void;
    onradiochange?: (name: string, value: string) => void;
    /** Two-way bindable: <ContextMenu bind:open />. It opens at the last pointer position; before
     * any right-click there is none: it stays closed and onopenchange(false) says so. */
    open?: boolean;
    onopenchange?: (open: boolean) => void;
    class?: string;
    style?: string;
    [data: `data-${string}`]: string | undefined;
  };

  let {
    items, children, disabled, label, onselect, oncheckedchange, onradiochange, open = $bindable(false), onopenchange, class: className, style, ...data
  }: Props = $props();

  /* the element that had focus in the area when the menu opened: the menu has no trigger of its
   * own, so on close the engine leaves focus on the closing panel or nowhere; it goes back here */
  let back: HTMLElement | null = null;
  const remember = (event: Event) => {
    const area = event.currentTarget as HTMLElement;
    const a = document.activeElement;
    back = a instanceof HTMLElement && area.contains(a) ? a : area;
  };
  const restore = () => requestAnimationFrame(() => {
    const a = document.activeElement;
    if (back?.isConnected && (!a || a === document.body || a.closest("[data-scope=menu][data-part=content]"))) back.focus({ preventScroll: true });
    back = null;
  });
  /* the menu opens at the pointer: until a right-click (or a long press, or Shift+F10) has given
   * the engine a position, an `open` from the host is refused, and the host is told it is closed */
  let placed = $state(false);
  $effect.pre(() => {
    if (!open || placed) return;
    open = false;
    onopenchange?.(false);
  });
</script>

<ArkMenu.Root
  open={open && placed}
  onOpenChange={(details) => { if (details.open) placed = true; else restore(); open = details.open; onopenchange?.(details.open); }}
  onSelect={(details) => onselect?.(details.value)}
  positioning={{ placement: "bottom-start", gutter: 0 }}
>
  {#if disabled}
    <div {...data} data-slot="context-menu" class={contextMenu({ class: className })} {style}>{@render children?.()}</div>
  {:else}
    <!-- focusable by itself, so a keyboard user can reach it and open the menu with Shift+F10 or the
         Menu key (the browser's contextmenu event); Escape brings focus back here -->
    <ArkMenu.ContextTrigger>
      {#snippet asChild(props)}
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div {...props()} {...data} data-slot="context-menu" role="group" aria-label={label} aria-keyshortcuts="Shift+F10" tabindex="0" oncontextmenucapture={remember} class={contextMenu({ class: className })} {style}>{@render children?.()}</div>
      {/snippet}
    </ArkMenu.ContextTrigger>
  {/if}
  <MenuPanel {items} handlers={{ onselect, oncheckedchange, onradiochange }} />
</ArkMenu.Root>
