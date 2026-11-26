<!-- The menu's popup: positioner, content, the gliding highlight and the rows, sub-menus included.
     Render it inside an Ark Menu.Root. Used by Menu and by the components built on it (context-menu). -->
<script module lang="ts">
  /** What the rows of a menu (and of its sub-menus) need from the menu that owns them. */
  export type MenuHandlers = {
    onselect?: (value: string) => void;
    oncheckedchange?: (value: string, checked: boolean) => void;
    onradiochange?: (name: string, value: string) => void;
  };
  /** Options remember their own state, seeded from the entries: one store for the whole tree, so a
   * sub-menu that closes and reopens keeps its options. */
  export type MenuOptionState = { checks: Record<string, boolean>; radios: Record<string, string> };
</script>

<script lang="ts">
  import { Menu as ArkMenu, useMenuContext } from "@ark-ui/svelte/menu";
  import { Portal } from "@ark-ui/svelte/portal";
  import { untrack } from "svelte";
  import CaretRight from "phosphor-svelte/lib/CaretRightIcon";
  import Check from "phosphor-svelte/lib/CheckIcon";
  import MenuPanel from "./MenuPanel.svelte";
  import { glide } from "../lib/glide";
  import { menu } from "./menu.recipe";
  import { checkbox as checkboxRecipe } from "../checkbox/checkbox.recipe";
  import { radioGroup } from "../radio-group/radio-group.recipe";
  import { trackModality } from "../lib/modality";
  import type { MenuAction, MenuCheckbox, MenuEntry } from "./Menu.svelte";

  type Props = {
    items: ReadonlyArray<MenuEntry>;
    handlers?: MenuHandlers;
    /** The tree's option state (a $state object). Omitted: the panel keeps its own. */
    options?: MenuOptionState;
  };

  let { items, handlers = {}, options }: Props = $props();

  const r = menu();
  const cb = checkboxRecipe();
  const rg = radioGroup();
  const own = $state<MenuOptionState>({ checks: {}, radios: {} });
  const opts = $derived(options ?? own);
  /* open when it mounted: drawn at once (the popup recipe skips the entrance) until it first closes.
   * Read from the menu that owns this panel; a sub-menu always mounts closed. */
  const api = useMenuContext();
  let mountedOpen = $state(untrack(() => api().open));
  $effect.pre(() => { if (!api().open) mountedOpen = false; });

  let content = $state<HTMLElement | null>(null);
  let highlight = $state<HTMLElement | null>(null);
  $effect(() => {
    trackModality();
    if (!content || !highlight) return;
    return glide(content, highlight, { rows: "[data-slot=menu-item]", follow: "highlighted" });
  });
</script>

{#snippet action(item: MenuAction)}
  <ArkMenu.Item value={item.value} disabled={item.disabled} data-slot="menu-item" class={r.item({ tone: item.tone })}>
    {#if item.icon}{@const Icon = item.icon}<span data-slot="menu-item-icon" class={r.itemIcon({ tone: item.tone })} aria-hidden="true"><Icon data-slot="icon" weight="bold" /></span>{/if}
    <span data-slot="menu-item-text" class={r.itemText()}>{item.label}</span>
    {#if item.meta}<span data-slot="menu-item-meta" class={r.itemMeta()}>{item.meta}</span>{/if}
  </ArkMenu.Item>
{/snippet}

{#snippet checkbox(item: MenuCheckbox)}
  {@const on = opts.checks[item.value] ?? !!item.checked}
  <ArkMenu.CheckboxItem
    value={item.value}
    disabled={item.disabled}
    closeOnSelect={false}
    data-slot="menu-item" class={r.item()}
    checked={on}
    onCheckedChange={(next) => { opts.checks[item.value] = next; handlers.oncheckedchange?.(item.value, next); }}
  >
    <div data-slot="checkbox-control" class={cb.control()} data-state={on ? "checked" : "unchecked"} aria-hidden="true"><span data-slot="checkbox-mark" class={cb.mark()} data-mark="check"><Check data-slot="icon" weight="bold" /></span></div>
    <span data-slot="menu-item-text" class={r.itemText()}>{item.label}</span>
  </ArkMenu.CheckboxItem>
{/snippet}

<Portal>
  <ArkMenu.Positioner data-slot="menu-positioner" class={r.positioner()}>
    <ArkMenu.Content bind:ref={content} data-slot="menu-content" data-mounted-open={mountedOpen ? "" : undefined} class={r.content()}>
      <span bind:this={highlight} data-slot="menu-highlight" class={r.highlight()} aria-hidden="true"></span>
      {#each items as entry, index (index)}
        {#if entry.type === "separator"}
          <ArkMenu.Separator data-slot="menu-separator" class={r.separator()} />
        {:else if entry.type === "radio-group"}
          {@const groupValue = opts.radios[entry.name] ?? entry.value}
          <ArkMenu.RadioItemGroup
            data-slot="menu-group" class={r.group()}
            value={groupValue}
            onValueChange={(details) => { opts.radios[entry.name] = details.value; handlers.onradiochange?.(entry.name, details.value); }}
          >
            {#if entry.label}<ArkMenu.ItemGroupLabel data-slot="menu-label" class={r.label()}>{entry.label}</ArkMenu.ItemGroupLabel>{/if}
            {#each entry.items as option (option.value)}
              <ArkMenu.RadioItem value={option.value} disabled={option.disabled} closeOnSelect={!!entry.closeOnSelect} data-slot="menu-item" class={r.item()}>
                <div data-slot="radio-group-control" class={rg.control()} data-state={groupValue === option.value ? "checked" : "unchecked"} aria-hidden="true"></div>
                <span data-slot="menu-item-text" class={r.itemText()}>{option.label}</span>
              </ArkMenu.RadioItem>
            {/each}
          </ArkMenu.RadioItemGroup>
        {:else if entry.type === "group"}
          <ArkMenu.ItemGroup data-slot="menu-group" class={r.group()}>
            {#if entry.label}<ArkMenu.ItemGroupLabel data-slot="menu-label" class={r.label()}>{entry.label}</ArkMenu.ItemGroupLabel>{/if}
            {#each entry.items as child (child.value)}
              {#if child.type === "checkbox"}{@render checkbox(child)}{:else}{@render action(child)}{/if}
            {/each}
          </ArkMenu.ItemGroup>
        {:else if entry.type === "checkbox"}
          {@render checkbox(entry)}
        {:else if entry.type === "submenu"}
          <!-- a nested Ark menu: the engine opens it to the side (left-start under rtl; 4px up, so its
               first row lines up with the row that opened it), moves focus into it with ArrowRight
               (ArrowLeft under rtl) and back with the opposite arrow or Escape -->
          <ArkMenu.Root positioning={{ offset: { mainAxis: 8, crossAxis: -4 } }} onSelect={(details) => handlers.onselect?.(details.value)}>
            <ArkMenu.TriggerItem data-slot="menu-item" class={r.item()}>
              {#if entry.icon}{@const Icon = entry.icon}<span data-slot="menu-item-icon" class={r.itemIcon()} aria-hidden="true"><Icon data-slot="icon" weight="bold" /></span>{/if}
              <span data-slot="menu-item-text" class={r.itemText()}>{entry.label}</span>
              <span data-slot="menu-item-caret" class={r.itemCaret()} aria-hidden="true"><CaretRight data-slot="icon" weight="bold" /></span>
            </ArkMenu.TriggerItem>
            <MenuPanel items={entry.items} {handlers} options={opts} />
          </ArkMenu.Root>
        {:else}
          {@render action(entry)}
        {/if}
      {/each}
    </ArkMenu.Content>
  </ArkMenu.Positioner>
</Portal>
