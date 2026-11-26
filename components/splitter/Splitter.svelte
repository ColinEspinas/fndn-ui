<!-- Panels with a handle between each pair that resizes them. Behaviour by Ark UI (Zag splitter). -->
<script lang="ts">
  import { Splitter as ArkSplitter } from "@ark-ui/svelte/splitter";
  import DotsSixVertical from "phosphor-svelte/lib/DotsSixVerticalIcon";
  import type { Snippet } from "svelte";
  import { trackModality } from "../lib/modality";
  import { splitter } from "./splitter.recipe";

  export type SplitterOrientation = "horizontal" | "vertical";

  export type SplitterPanel = {
    id: string;
    /** Plain text, padded. Richer content goes in the `panel` snippet. */
    content?: string;
    /** Percent. */
    minSize?: number;
    /** Percent. */
    maxSize?: number;
    collapsible?: boolean;
    /** Percent, when collapsible (default 0). */
    collapsedSize?: number;
  };

  type Props = {
    /** The panels in order, with their limits. Every pair gets a handle. */
    panels: ReadonlyArray<SplitterPanel>;
    /** Two-way bindable: one percentage per panel, <Splitter bind:size />. Without it the panels share the room equally. */
    size?: number[];
    /** While dragging and on every key. */
    onsizechange?: (size: number[]) => void;
    /** When a drag or a key press ends. */
    onsizechangeend?: (size: number[]) => void;
    /** horizontal: side by side (default). vertical: stacked. */
    orientation?: SplitterOrientation;
    /** Show a grip on every handle. */
    grip?: boolean;
    /** Percent an arrow key moves a handle (Shift: 10). */
    keyboardStep?: number;
    /** Accessible name of every handle. */
    handleLabel?: string;
    /** A panel's content, instead of its text. */
    panel?: Snippet<[{ panel: SplitterPanel; index: number }]>;
    id?: string;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    panels, size = $bindable(), onsizechange, onsizechangeend, orientation = "horizontal", grip = false, keyboardStep = 1,
    handleLabel = "Resize", panel: panelSnippet, class: className, ...rest
  }: Props = $props();

  /* without sizes the panels share the room equally */
  // svelte-ignore state_referenced_locally
  if (size === undefined) size = panels.map(() => 100 / Math.max(1, panels.length));

  const r = $derived(splitter({ orientation }));
  const limits = $derived(panels.map(({ id, minSize, maxSize, collapsible, collapsedSize }) => ({ id, minSize, maxSize, collapsible, collapsedSize })));

  $effect(() => trackModality());
</script>

<ArkSplitter.Root
  data-slot="splitter"
  class={r.base({ class: className })}
  {orientation}
  panels={limits}
  bind:size
  keyboardResizeBy={keyboardStep}
  onResize={(d) => onsizechange?.(d.size)}
  onResizeEnd={(d) => onsizechangeend?.(d.size)}
  {...rest}
>
  {#each panels as panel, index (panel.id)}
    <ArkSplitter.Panel id={panel.id} data-slot="splitter-panel" class={r.panel()}>
      {#if panelSnippet}{@render panelSnippet({ panel, index })}{:else if panel.content !== undefined}<p data-slot="splitter-text" class={r.text()}>{panel.content}</p>{/if}
    </ArkSplitter.Panel>
    {#if panels[index + 1]}
      <ArkSplitter.ResizeTrigger id={`${panel.id}:${panels[index + 1]!.id}`} data-slot="splitter-handle" class={r.handle()} aria-label={handleLabel}>
        {#if grip}
          <ArkSplitter.ResizeTriggerIndicator data-slot="splitter-grip" class={r.grip()} aria-hidden="true">
            <DotsSixVertical data-slot="icon" weight="bold" />
          </ArkSplitter.ResizeTriggerIndicator>
        {/if}
      </ArkSplitter.ResizeTrigger>
    {/if}
  {/each}
</ArkSplitter.Root>
