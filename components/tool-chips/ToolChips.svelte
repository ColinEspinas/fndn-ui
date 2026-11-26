<!-- An agent run as compact rows with file-diff chips, fully controlled. -->
<script lang="ts">
  import FileText from "phosphor-svelte/lib/FileTextIcon";
  import ImageGlyph from "phosphor-svelte/lib/ImageIcon";
  import MagnifyingGlass from "phosphor-svelte/lib/MagnifyingGlassIcon";
  import PencilSimple from "phosphor-svelte/lib/PencilSimpleIcon";
  import Sparkle from "phosphor-svelte/lib/SparkleIcon";
  import Terminal from "phosphor-svelte/lib/TerminalIcon";
  import { untrack, type Component, type Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import type { IconWeight } from "phosphor-svelte";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import Collapsible from "../collapsible/Collapsible.svelte";
  import HoverCard, { type HoverCardLine } from "../hover-card/HoverCard.svelte";
  import { hoverCard } from "../hover-card/hover-card.recipe";
  import { toolChips } from "./tool-chips.recipe";

  /** Built-in tool glyphs by name. */
  export type ToolChipsIconName = "think" | "write" | "run" | "read" | "image" | "search";
  type IconComponent = Component<{ class?: string; "data-slot"?: string; weight?: IconWeight; "aria-hidden"?: boolean | "true" | "false" }>;
  /** A step's icon: a built-in name, or any Svelte component (e.g. a Phosphor icon). Defaults to "think"; the `icon` snippet overrides per step. */
  export type ToolChipsIcon = ToolChipsIconName | IconComponent;
  export type ToolDetailLine = { text: string; tone?: "add" };
  export type ToolStep = {
    /** Stable id; defaults to the label. Used by bind:openRows. */
    key?: string;
    icon?: ToolChipsIcon;
    label: string;
    chip: string;
    mono?: boolean;
    detailMono?: boolean;
    detail: ToolDetailLine[];
  };
  /** A changed file. `lines` is the preview its hover-card shows. */
  export type ToolDiff = { file: string; add: number; del: number; lines?: HoverCardLine[] };
  export type ToolChipsLabels = { header: string; more: string };

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    steps?: ToolStep[];
    diffs?: ToolDiff[];
    /** Two-way bindable: <ToolChips bind:open /> — the run. */
    open?: boolean;
    /** Two-way bindable: keys (step.key ?? step.label) of expanded steps. */
    openRows?: string[];
    onopenchange?: (open: boolean) => void;
    ontogglerow?: (label: string, open: boolean) => void;
    ondiffclick?: (file: string) => void;
    onmoreclick?: () => void;
    labels?: Partial<ToolChipsLabels>;
    /** Enter on mount: the steps present at mount fade up, staggered, then the diff row. Off by default; set it on the run your code adds live, never on one rendered from history or with the page. Steps and diffs added later enter either way. */
    appear?: boolean;
    /** Per-step icon override. */
    icon?: Snippet<[{ step: ToolStep }]>;
  };

  let {
    steps = [], diffs = [], open = $bindable(true), openRows = $bindable([]), onopenchange, ontogglerow, ondiffclick, onmoreclick,
    labels, appear = false, icon, class: className, ...rest
  }: Props = $props();

  const GLYPHS: Record<ToolChipsIconName, { is: IconComponent; weight: IconWeight }> = {
    think: { is: Sparkle, weight: "fill" },
    write: { is: PencilSimple, weight: "bold" },
    run: { is: Terminal, weight: "bold" },
    read: { is: FileText, weight: "bold" },
    image: { is: ImageGlyph, weight: "bold" },
    search: { is: MagnifyingGlass, weight: "bold" },
  };
  const glyph = (value: ToolChipsIcon | undefined) =>
    value === undefined ? GLYPHS.think : typeof value === "string" ? (GLYPHS[value as ToolChipsIconName] ?? GLYPHS.think) : { is: value, weight: "bold" as IconWeight };
  const keyOf = (step: ToolStep) => step.key ?? step.label;

  /* steps present at first render stagger in, the diff row one beat after them;
   * anything that arrives later enters at once */
  const initial = untrack(() => ({ steps: steps.length, diffs: diffs.length > 0, appear }));
  /* a step that arrives later opens its room as it fades (--fndn-row-room, read by the recipe) */
  const stagger = (i: number) => (i < initial.steps ? `--fndn-row-index:${i}` : "--fndn-row-room:0fr");

  function toggleRun(n: boolean) { open = n; onopenchange?.(n); }
  function toggleRow(step: ToolStep, n: boolean) {
    const k = keyOf(step);
    openRows = n ? [...openRows.filter((x) => x !== k), k] : openRows.filter((x) => x !== k);
    ontogglerow?.(step.label, n);
  }
  const r = toolChips();
  const more = $derived(labels?.more ?? "");

</script>

{#snippet chip(d: ToolDiff)}
  <HoverCard title={d.file} add={d.add} del={d.del > 0 ? d.del : undefined} lines={d.lines}>
    {#snippet trigger(props)}
      <button {...mergeProps(props(), { onclick: () => ondiffclick?.(d.file) })} type="button" data-slot="tool-chips-diff" data-hover-card="trigger" class={hoverCard().trigger({ class: r.diff() })}>
        <span title={d.file}>{d.file}</span>
        <span data-slot="tool-chips-add" class={r.add()}>{`+${d.add}`}</span>
        {#if d.del > 0}<span data-slot="tool-chips-del" class={r.del()}>{`−${d.del}`}</span>{/if}
      </button>
    {/snippet}
  </HoverCard>
{/snippet}

<div data-slot="tool-chips" class={r.base({ class: className as string | undefined })} {...rest}>
  <Collapsible class={r.run()} data-tool-chips="run" variant="inline" caret="start" keepLayout {open} onopenchange={toggleRun} label={labels?.header ?? `${steps.length} tool call${steps.length === 1 ? "" : "s"}`}>
    <div data-slot="tool-chips-rows" class={r.rows()}>
      {#each steps as step, i (keyOf(step))}
        {@const g = glyph(step.icon)}
        {#snippet rowLabel()}
          <span data-slot="tool-chips-icon" class={r.icon()} aria-hidden="true">
            {#if icon}{@render icon({ step })}{:else}<g.is data-slot="icon" weight={g.weight} aria-hidden="true" />{/if}
          </span>
          <span data-slot="tool-chips-label" class={r.label()} title={step.label}>{step.label}</span>
          <span data-slot="tool-chips-value" class={r.value({ mono: !!step.mono })} title={step.chip}><span>{step.chip}</span></span>
        {/snippet}
        <Collapsible
          class={r.step({ appear: initial.appear || i >= initial.steps })}
          data-tool-chips="step"
          style={stagger(i)}
          variant="inline"
          caret="start"
          open={openRows.includes(keyOf(step))}
          onopenchange={(n) => toggleRow(step, n)}
          label={rowLabel}
        >
          <div data-slot="tool-chips-lines" class={r.lines({ mono: !!step.detailMono })}>
            {#each step.detail as line, j (j)}
              <span data-slot="tool-chips-line" class={r.line({ tone: line.tone })} title={line.text}>{line.text}</span>
            {/each}
          </div>
        </Collapsible>
      {/each}
    </div>
    {#if diffs.length > 0}
      <div data-slot="tool-chips-diffs" class={r.diffs({ appear: initial.appear || !initial.diffs })} style={initial.diffs ? `--fndn-row-index:${initial.steps}` : undefined}>
        {#each diffs as d, i (d.file)}
          <span data-slot="tool-chips-file" class={r.file({ withMore: !!more && i === diffs.length - 1 })}>
            {@render chip(d)}
            {#if more && i === diffs.length - 1}<button type="button" data-slot="tool-chips-more" class={r.more()} onclick={() => onmoreclick?.()}>{more}</button>{/if}
          </span>
        {/each}
      </div>
    {/if}
  </Collapsible>
</div>
