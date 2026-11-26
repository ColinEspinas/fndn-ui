<!-- Copy a value: a two-state Copy button, alone or in a read-only field. Behaviour by Ark UI (Zag clipboard). -->
<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { Clipboard as ArkClipboard, useClipboard } from "@ark-ui/svelte/clipboard";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import Check from "phosphor-svelte/lib/CheckIcon";
  import Copy from "phosphor-svelte/lib/CopyIcon";
  import Button from "../button/Button.svelte";
  import Input from "../input/Input.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { trackModality } from "../lib/modality";
  import { button } from "../button/button.recipe";
  import { clipboard } from "./clipboard.recipe";

  export type ClipboardLabels = { copy: string; copied: string };

  type Props = {
    /** The text placed on the clipboard (and shown in the field). */
    value: string;
    /** button: the code block's Copy button. field: a read-only Input showing the value, with a Copy button inside its end. */
    variant?: "button" | "field";
    /** field only: the Input's sizes (xs 24px, sm 28px, md 32px, lg 36px). */
    size?: "xs" | "sm" | "md" | "lg";
    /** Visible label of the field. Without one, the field is named by aria-label. */
    label?: string;
    "aria-label"?: string;
    /** Button labels and the announcement; copy also names the icon-only button of the field. */
    labels?: Partial<ClipboardLabels>;
    /** How long Copied shows, in ms. */
    timeout?: number;
    /** Called with the text once it is on the clipboard. */
    oncopy?: (text: string) => void;
    disabled?: boolean;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    value, variant = "button", size = "md", label, "aria-label": ariaLabel, labels, timeout = 1500, oncopy, disabled = false,
    class: className, style, ...data
  }: Props = $props();

  /* the two labels of Copy are label parts of the button (the code block's) */
  const twoLabels = button({ variant: "ghost", size: "xs", shape: "rounded", muted: true }).label();

  const text = $derived<ClipboardLabels>({ copy: "Copy", copied: "Copied", ...labels });
  const api = useClipboard(() => ({ value, timeout, onStatusChange: (details: { copied: boolean }) => { if (details.copied) oncopy?.(value); } }));
  const field = $derived(variant === "field");
  const r = $derived(clipboard({ variant, size, copied: api().copied }));
  $effect(() => trackModality());

  /* the engine's props for the control, typed as the Input's attributes (its listeners stay the engine's) */
  const engine = (p: object) => p as Omit<HTMLInputAttributes, "size" | "value" | "oninput">;
</script>

{#snippet icons()}<Copy data-slot="icon" weight="bold" /><Check data-slot="icon" weight="bold" />{/snippet}

<ArkClipboard.RootProvider value={api} {...data} data-slot="clipboard" class={r.base({ class: className })} {style}>
  {#if field && label}<ArkClipboard.Label data-slot="clipboard-label" class={r.label()}>{label}</ArkClipboard.Label>{/if}
  {#if field}
    <ArkClipboard.Control data-slot="clipboard-control" class={r.control()}>
      <ArkClipboard.Input>
        {#snippet asChild(inputProps)}
          <Input {...engine(inputProps())} data-clipboard="input" class={r.input()} {size} aria-label={label ? undefined : ariaLabel} {disabled} />
        {/snippet}
      </ArkClipboard.Input>
      <!-- the engine's trigger owns the button (its data-scope and data-part); the tooltip adds itself -->
      <ArkClipboard.Trigger>
        {#snippet asChild(triggerProps)}
          <Tooltip content={api().copied ? text.copied : text.copy} triggerId={(triggerProps().id as string | undefined) ?? undefined}>
            {#snippet trigger(tip)}
              <Button
                {...mergeProps(tip(), triggerProps())}
                data-clipboard="trigger" class={r.trigger()} variant="ghost" size="xs" square muted swapped={api().copied}
                aria-label={text.copy} disabled={disabled || !value} icon={icons}
              />
            {/snippet}
          </Tooltip>
        {/snippet}
      </ArkClipboard.Trigger>
    </ArkClipboard.Control>
  {:else}
    <ArkClipboard.Trigger>
      {#snippet asChild(triggerProps)}
        <Button
          {...triggerProps()}
          data-clipboard="trigger" class={r.trigger()} variant="ghost" size="xs" shape="rounded" muted swapped={api().copied}
          aria-label={ariaLabel ?? text.copy} disabled={disabled || !value} icon={icons}
        >
          <span data-slot="button-label" class={twoLabels} aria-hidden="true">{text.copy}</span><span data-slot="button-label" class={twoLabels} aria-hidden="true">{text.copied}</span>
        </Button>
      {/snippet}
    </ArkClipboard.Trigger>
  {/if}
  <span data-slot="clipboard-status" class={r.status()} role="status">{api().copied ? text.copied : ""}</span>
</ArkClipboard.RootProvider>
