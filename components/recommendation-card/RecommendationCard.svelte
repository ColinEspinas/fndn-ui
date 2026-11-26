<!-- Agent suggestion with a confidence meter and actions. -->
<script lang="ts">
  import { Collapsible } from "@ark-ui/svelte/collapsible";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import { tick, type Snippet } from "svelte";
  import { glide } from "../lib/glide";
  import { trackModality } from "../lib/modality";
  import Button from "../button/Button.svelte";
  import { collapsible } from "../collapsible/collapsible.recipe";
  import EntityChip from "../entity-chip/EntityChip.svelte";
  import { recommendationCard } from "./recommendation-card.recipe";
  import ValuePill from "../value-pill/ValuePill.svelte";
  import type { HTMLAttributes } from "svelte/elements";

  export type RecommendationTone = "neutral" | "green" | "orange" | "red" | "accent";
  /** A piece of an option's body: text, an entity chip, a value pill or emphasised text. */
  export type RecommendationSegment =
    | string
    | { entity: string; color?: string }
    | { value: string; tone?: RecommendationTone }
    | { strong: string };
  export type RecommendationOption = {
    key: string;
    /** Plain text or segments; pass the `body` snippet for anything richer. */
    body?: string | RecommendationSegment[];
    short: string;
    /** lit bars, 0–3 */
    signal: number;
    tone: RecommendationTone;
    label: string;
    cta: string;
    ctaVariant?: "accent" | "primary";
  };
  export type RecommendationLabels = { alternatives: string; otherOptions: string; accepted: string };

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> & {
    title: string;
    options: RecommendationOption[];
    /** Two-way bindable: index of the active option. */
    selected?: number;
    /** Two-way bindable: alternatives drawer. */
    open?: boolean;
    /** Two-way bindable. */
    accepted?: boolean;
    onselect?: (index: number) => void;
    onaccept?: (option: RecommendationOption) => void;
    onopenchange?: (open: boolean) => void;
    labels?: Partial<RecommendationLabels>;
    /** Rich body for an option. */
    body?: Snippet<[RecommendationOption, boolean]>;
  };

  let {
    title, options, selected = $bindable(0), open = $bindable(false), accepted = $bindable(false),
    onselect, onaccept, onopenchange, labels, body, class: className, ...rest
  }: Props = $props();

  const r = recommendationCard();
  const c = collapsible();

  /* with one option there is nothing to switch to: no Alternatives button, no drawer */
  const many = $derived(options.length > 1);
  $effect(() => trackModality());
  const t = $derived({ alternatives: "Alternatives", otherOptions: "Other options", accepted: "Accepted", ...labels });
  const current = $derived(Math.min(Math.max(selected, 0), Math.max(options.length - 1, 0)));
  const active = $derived(options[current]);
  const segments = (b: RecommendationOption["body"]): RecommendationSegment[] => (Array.isArray(b) ? b : b ? [b] : []);
  const positions = $derived.by(() => { let n = 0; return options.map((_, i) => (i === current ? -1 : n++)); });

  let list = $state<HTMLElement | null>(null);
  /* one gliding highlight under the alternatives (the drawer exists only with more than one option) */
  $effect(() => {
    const el = list;
    const layer = el?.querySelector<HTMLElement>(":scope > [data-slot=recommendation-card-highlight]");
    if (el && layer) return glide(el, layer, { rows: "[data-slot=recommendation-card-alt]:not([hidden])", follow: "hover" });
  });
  async function select(i: number, e: MouseEvent) {
    const keep = document.activeElement === e.currentTarget ? positions[i]! : null;
    selected = i;
    accepted = false;
    onselect?.(i);
    if (keep === null) return;
    /* the chosen row leaves the list: keep focus at the same place in it */
    await tick();
    const visible = Array.from(list?.querySelectorAll<HTMLElement>("[data-slot=recommendation-card-alt]:not([hidden])") ?? []);
    visible[Math.min(keep, visible.length - 1)]?.focus({ preventScroll: true });
  }
  function toggle(next: boolean) { open = next; onopenchange?.(next); }
  function accept() { if (!active) return; accepted = true; onaccept?.(active); }
</script>

{#snippet meter(signal: number, tone: RecommendationTone)}
  <span data-slot="recommendation-card-meter" class={r.meter({ tone })} aria-hidden="true">
    {#each [0, 1, 2] as bar (bar)}<span data-slot="recommendation-card-meter-bar" class={r.meterBar({ on: bar < signal })}></span>{/each}
  </span>
{/snippet}

{#if active}
  <!-- the card is the root of a collapsible: the Alternatives button opens the drawer -->
  <Collapsible.Root open={many && open} onOpenChange={(d) => toggle(d.open)}>
  {#snippet asChild(rootProps)}
  <div {...mergeProps(rootProps(), rest)} data-slot="recommendation-card" class={r.base({ class: className as string | undefined })}>
    <span data-slot="recommendation-card-status" class={r.status()} role="status">{accepted ? t.accepted : ""}</span>
    <div data-slot="recommendation-card-body" class={r.body()}>
      <span data-slot="recommendation-card-title" class={r.title()}>{title}</span>
      <div data-slot="recommendation-card-texts" class={r.texts()}>
        {#each options as o, i (o.key)}
          <p data-slot="recommendation-card-text" class={r.text({ active: i === current })} aria-hidden={i === current ? undefined : "true"}>
            {#if body}{@render body(o, i === current)}{:else}{#each segments(o.body) as s, si (si)}{#if typeof s === "string"}{s}{:else if "entity" in s}<EntityChip name={s.entity} color={s.color} />{:else if "value" in s}<ValuePill tone={s.tone ?? "neutral"}>{s.value}</ValuePill>{:else}<span data-slot="recommendation-card-strong" class={r.strong()}>{s.strong}</span>{/if}{/each}{/if}
          </p>
        {/each}
      </div>
    </div>
    {#if many}
    <Collapsible.Content data-recommendation-card="drawer" data-slot="collapsible-content" class={c.content({ class: r.drawer() })}>
      <div data-slot="collapsible-body" class={c.body()}>
        <div bind:this={list} data-slot="recommendation-card-drawer-list" class={r.drawerList()}>
          <span data-slot="recommendation-card-highlight" class={r.highlight()} aria-hidden="true"></span>
          <p data-slot="recommendation-card-drawer-label" class={r.drawerLabel()}>{t.otherOptions}</p>
          {#each options as o, i (o.key)}
            <button type="button" data-slot="recommendation-card-alt" class={r.alt()} hidden={i === current} onclick={(e) => select(i, e)}>
              {@render meter(o.signal, o.tone)}
              <span data-slot="recommendation-card-alt-short" class={r.altShort()}>{o.short}</span>
              <span data-slot="recommendation-card-alt-label" class={r.altLabel()}>{o.label}</span>
            </button>
          {/each}
        </div>
      </div>
    </Collapsible.Content>
    {/if}
    <div data-slot="recommendation-card-footer" class={r.footer()}>
      <span data-slot="recommendation-card-confidence" class={r.confidence()}>
        {@render meter(active.signal, active.tone)}
        <span data-slot="recommendation-card-confidence-label" class={r.confidenceLabel()}>{active.label}</span>
      </span>
      <span data-slot="recommendation-card-actions" class={r.actions()}>
        {#if many}
          <Collapsible.Trigger>
            {#snippet asChild(triggerProps)}<Button {...triggerProps()} variant="outline" size="sm">{t.alternatives}</Button>{/snippet}
          </Collapsible.Trigger>
        {/if}
        <Button variant={accepted ? "success" : (active.ctaVariant ?? "accent")} size="sm" onclick={accept}>{accepted ? t.accepted : active.cta}</Button>
      </span>
    </div>
  </div>
  {/snippet}
  </Collapsible.Root>
{/if}
