<!-- Pick exactly one of a short list. Behaviour by Ark UI (Zag radio-group). -->
<script lang="ts">
  import { RadioGroup as ArkRadioGroup } from "@ark-ui/svelte/radio-group";
  import { glide } from "../lib/glide";
  import { radioGroup } from "./radio-group.recipe";
  import { trackModality } from "../lib/modality";

  export type RadioGroupItem = { value: string; label?: string; disabled?: boolean };

  type Props = {
    /** Options in order. Strings are accepted as value = label. */
    items: ReadonlyArray<RadioGroupItem | string>;
    /** Two-way bindable: <RadioGroup bind:value />. null: nothing selected. */
    value?: string | null;
    onvaluechange?: (value: string | null) => void;
    /** Visible group label. Without one, pass aria-label. */
    label?: string;
    "aria-label"?: string;
    /** vertical: stacked options (default). horizontal: options in a row that wraps. */
    orientation?: "vertical" | "horizontal";
    /** inline: each control with its label (default). row: a list of option rows under one gliding highlight. */
    layout?: "inline" | "row";
    /** Row layout: adds a free-text row after the options with this placeholder (e.g. "Something else…"). */
    customPlaceholder?: string;
    /** Accessible name of the free-text field; defaults to the placeholder. */
    customLabel?: string;
    /** enterkeyhint of the free-text field ("next" when another step follows, "done", "send"…). */
    customEnterKeyHint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
    /** Two-way bindable text of the free-text row. Typing makes the value null; picking an option empties it. */
    custom?: string;
    oncustomchange?: (text: string) => void;
    disabled?: boolean;
    /** Form field name of the radios. */
    name?: string;
    class?: string;
    style?: string;
    /** data-* attributes land on the root (a host marks it as one of its parts). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    items, value = $bindable(null), onvaluechange, label, "aria-label": ariaLabel, orientation = "vertical", layout = "inline",
    customPlaceholder, customLabel, customEnterKeyHint, custom = $bindable(""), oncustomchange, disabled = false, name, class: className, style, ...data
  }: Props = $props();

  const opts = $derived(items.map((o) => (typeof o === "string" ? { value: o, label: o } : { label: o.value, ...o })));
  const row = $derived(layout === "row");
  const r = $derived(radioGroup({ orientation, layout: row ? "row" : "inline" }));

  $effect(() => trackModality());

  function onValue(next: string | null) {
    value = next;
    onvaluechange?.(next);
    /* picking an option replaces a free-text answer */
    if (next != null && custom) { custom = ""; oncustomchange?.(""); }
  }
  function onCustom(event: Event & { currentTarget: HTMLInputElement }) {
    const next = event.currentTarget.value;
    custom = next;
    oncustomchange?.(next);
    /* a free-text answer replaces the selection */
    if (next && value != null) { value = null; onvaluechange?.(null); }
  }

  /* Home / End are not part of the native radio keys (the free-text field keeps them) */
  function homeEnd(event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement }) {
    if (event.defaultPrevented || (event.key !== "Home" && event.key !== "End")) return;
    if (!(event.target as Element).matches?.('input[type="radio"]')) return;
    const inputs = Array.from(event.currentTarget.querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)'));
    const target = event.key === "Home" ? inputs[0] : inputs[inputs.length - 1];
    if (!target) return;
    event.preventDefault();
    target.focus();
    target.click();
  }

  /* Svelte sets `checked` as a property only; mirror it into the attribute like the other targets */
  let root = $state<HTMLElement | null>(null);
  $effect(() => {
    const current = value;
    root?.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((input) => { input.defaultChecked = input.value === current; });
  });

  let layer = $state<HTMLElement | null>(null);
  $effect(() => {
    if (!row || !root || !layer) return;
    return glide(root, layer, { rows: "[data-slot=radio-group-item], [data-slot=radio-group-custom]", follow: "hover" });
  });
</script>

<ArkRadioGroup.Root
  bind:ref={root}
  {...data}
  data-slot="radio-group" class={r.base({ class: className })}
  {style}
  aria-label={ariaLabel}
  {orientation}
  {value}
  onValueChange={(details) => onValue(details.value)}
  {disabled}
  {name}
  onkeydown={homeEnd}
>
  {#if label}<ArkRadioGroup.Label data-slot="radio-group-label" class={r.label()}>{label}</ArkRadioGroup.Label>{/if}
  {#if row}<span bind:this={layer} data-slot="radio-group-highlight" class={r.highlight()} aria-hidden="true"></span>{/if}
  {#each opts as o (o.value)}
    <ArkRadioGroup.Item value={o.value} disabled={o.disabled} data-slot="radio-group-item" class={r.item()}>
      <ArkRadioGroup.ItemControl data-slot="radio-group-control" class={r.control()} />
      <ArkRadioGroup.ItemText data-slot="radio-group-item-text" class={r.itemText()}>{o.label}</ArkRadioGroup.ItemText>
      <ArkRadioGroup.ItemHiddenInput data-slot="radio-group-input" class={r.input()} />
    </ArkRadioGroup.Item>
  {/each}
  {#if row && customPlaceholder != null}
    <label data-slot="radio-group-custom" class={r.custom()}>
      <input
        data-slot="radio-group-custom-input" class={r.customInput()}
        dir="auto"
        type="text"
        placeholder={customPlaceholder}
        aria-label={customLabel ?? customPlaceholder}
        enterkeyhint={customEnterKeyHint}
        value={custom}
        disabled={disabled || undefined}
        oninput={onCustom}
      />
    </label>
  {/if}
</ArkRadioGroup.Root>
