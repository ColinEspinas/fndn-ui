<!-- A list of actions that opens from a button. Behaviour by Ark UI (Zag menu). -->
<script module lang="ts">
  import type { Component } from "svelte";

  export type MenuAction = { type?: "item"; value: string; label: string; meta?: string; tone?: "default" | "danger"; disabled?: boolean; icon?: Component<any> };
  export type MenuCheckbox = { type: "checkbox"; value: string; label: string; checked?: boolean; disabled?: boolean };
  export type MenuGroup = { type: "group"; label?: string; items: ReadonlyArray<MenuAction | MenuCheckbox> };
  export type MenuRadioGroup = {
    type: "radio-group"; name: string; label?: string; value?: string;
    /** Close the menu when an option is picked. Default false: the menu stays open. */
    closeOnSelect?: boolean;
    items: ReadonlyArray<{ value: string; label: string; disabled?: boolean }>;
  };
  export type MenuSeparator = { type: "separator" };
  /** A row that opens a nested menu to its side. */
  export type MenuSubmenu = { type: "submenu"; label: string; icon?: Component<any>; items: ReadonlyArray<MenuEntry> };
  export type MenuEntry = MenuAction | MenuCheckbox | MenuGroup | MenuRadioGroup | MenuSeparator | MenuSubmenu;
  export type MenuPlacement = "bottom-start" | "bottom" | "bottom-end" | "top-start" | "top" | "top-end" | "right-start" | "left-start";
</script>

<script lang="ts">
  import { Menu as ArkMenu } from "@ark-ui/svelte/menu";
  import CaretDown from "phosphor-svelte/lib/CaretDownIcon";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import Button from "../button/Button.svelte";
  import MenuPanel, { type MenuOptionState } from "./MenuPanel.svelte";
  import { menu } from "./menu.recipe";

  type Props = {
    /** data-* attributes go to the root (a host marks it as its part, data-<host>="<part>"). */
    [data: `data-${string}`]: string | undefined;
    /** Entries in order: actions, checkbox options, labelled groups, radio groups, separators, sub-menus. */
    items: ReadonlyArray<MenuEntry>;
    /** Your own trigger. The snippet receives a function returning the props to spread on your element. */
    trigger?: Snippet<[() => HTMLButtonAttributes]>;
    /** Label of the default trigger. */
    triggerLabel?: string;
    /** Two-way bindable: <Menu bind:open /> */
    open?: boolean;
    onselect?: (value: string) => void;
    oncheckedchange?: (value: string, checked: boolean) => void;
    onradiochange?: (name: string, value: string) => void;
    onopenchange?: (open: boolean) => void;
    placement?: MenuPlacement;
    class?: string;
  };

  let {
    items, trigger, triggerLabel, open = $bindable(false), onselect, oncheckedchange, onradiochange, onopenchange,
    placement = "bottom-start", class: className, ...data
  }: Props = $props();

  /* Options remember their own state, seeded from the entries (one store for the whole tree, sub-menus
   * included). When the entries' own checked/value fields change (the parent took control), that state is dropped. */
  const r = menu();

  const options = $state<MenuOptionState>({ checks: {}, radios: {} });
  const flat = (entries: ReadonlyArray<MenuEntry>): unknown[] =>
    entries.flatMap((e) => (e.type === "group" || e.type === "submenu" ? flat(e.items) : e.type === "radio-group" ? [[e.name, e.value]] : e.type === "checkbox" ? [[e.value, !!e.checked]] : []));
  const signature = $derived(JSON.stringify(flat(items)));
  let seen: string | undefined;
  $effect(() => {
    const first = seen === undefined;
    const changed = signature !== seen;
    seen = signature;
    if (first || !changed) return;
    options.checks = {};
    options.radios = {};
  });
</script>

<ArkMenu.Root
  {open}
  onOpenChange={(details) => { open = details.open; onopenchange?.(details.open); }}
  onSelect={(details) => onselect?.(details.value)}
  positioning={{ placement, gutter: 4 }}
>
  <div {...data} data-slot="menu" class={r.base({ class: className })}>
    {#if trigger}
      <ArkMenu.Trigger>
        {#snippet asChild(props)}{@render trigger(props)}{/snippet}
      </ArkMenu.Trigger>
    {:else}
      <ArkMenu.Trigger>
        {#snippet asChild(props)}
          <Button {...props()} data-menu="trigger" class={r.trigger()} variant="outline" size="sm">
            {triggerLabel}
            {#snippet trailingIcon()}<CaretDown data-slot="icon" weight="bold" />{/snippet}
          </Button>
        {/snippet}
      </ArkMenu.Trigger>
    {/if}
  </div>
  <MenuPanel {items} handlers={{ oncheckedchange, onradiochange, onselect }} {options} />
</ArkMenu.Root>
