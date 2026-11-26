<!-- AI-proposed edits in tabular data; each changed row toggles its edit. -->
<script lang="ts">
  import { tick } from "svelte";
  import Button from "../button/Button.svelte";
  import Checkbox from "../checkbox/Checkbox.svelte";
  import { diffTable } from "./diff-table.recipe";
  import EmptyState from "../empty-state/EmptyState.svelte";
  import StatusPill from "../status-pill/StatusPill.svelte";
  import { DIFF_TABLE_BOX, DIFF_TABLE_LABELS, diffTableKey, diffTableText, focusRowMark, isBoxClick, type DiffTableLabels } from "./diff-table.logic";
  import { trackModality } from "../lib/modality";
  import { afterPaint } from "../lib/paint";

  export type { DiffTableLabels } from "./diff-table.logic";
  export type DiffTableTone = "accent" | "neutral" | "orange" | "green";
  export type DiffTableChange = "removed" | "added" | "unchanged";
  export type DiffTableRow = { key: string; name: string; category: string; tone?: DiffTableTone; value: string; change: DiffTableChange };

  type Props = {
    title?: string;
    columns?: [string, string, string];
    rows?: DiffTableRow[];
    /** Two-way bindable include map (key → included); every changed row starts included. */
    included?: Record<string, boolean>;
    /** Two-way bindable. */
    accepted?: boolean;
    ontoggle?: (key: string, included: boolean) => void;
    onapply?: (included: Record<string, boolean>) => void;
    labels?: Partial<DiffTableLabels>;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    title = "Proposed changes", columns = ["Name", "Category", "Value"], rows = [], included = $bindable({}), accepted = $bindable(false),
    ontoggle, onapply, labels, class: className, style, ...data
  }: Props = $props();

  const s = diffTable();

  const t = $derived<DiffTableLabels>({ ...DIFF_TABLE_LABELS, ...labels });
  const changed = $derived(rows.filter((r) => r.change !== "unchanged"));
  let focusKey = $state<string | undefined>();
  const tabKey = $derived(changed.some((r) => r.key === focusKey) ? focusKey : changed[0]?.key);
  const isIn = (r: DiffTableRow, map: Record<string, boolean>) => r.change !== "unchanged" && (map[r.key] ?? true);
  const text = $derived(diffTableText(t, rows.filter((r) => r.change === "removed" && isIn(r, included)).length, rows.filter((r) => r.change === "added" && isIn(r, included)).length));
  let root = $state<HTMLElement | null>(null);

  function toggle(r: DiffTableRow, next = !isIn(r, included)) {
    if (accepted || r.change === "unchanged" || next === isIn(r, included)) return;
    included = { ...included, [r.key]: next };
    ontoggle?.(r.key, next);
  }
  function onRowClick(r: DiffTableRow, event: MouseEvent & { currentTarget: HTMLElement }) {
    if (accepted || r.change === "unchanged" || isBoxClick(event)) return;
    toggle(r);
    focusRowMark(event.currentTarget);
  }
  function onRowKey(r: DiffTableRow, event: KeyboardEvent) {
    if (!accepted && r.change !== "unchanged" && (event.target as Element).matches(DIFF_TABLE_BOX)) diffTableKey(event, event.target as HTMLElement, () => toggle(r));
  }
  function onRowFocus(r: DiffTableRow, event: FocusEvent) {
    if ((event.target as Element).matches(DIFF_TABLE_BOX)) focusKey = r.key;
  }
  async function apply() {
    accepted = true;
    onapply?.(Object.fromEntries(changed.map((r) => [r.key, isIn(r, included)])));
    await tick();
    root?.querySelector<HTMLElement>("[data-diff-table=applied]")?.focus();
  }

  $effect(() => trackModality());
  /* an added row reveals only once the table has been painted (lib/paint.ts) */
  let enter = $state(false);
  $effect(() => (enter ? undefined : afterPaint(() => { enter = true; })));
</script>

{#snippet mark(r: DiffTableRow)}<Checkbox size="md" tone={r.change === "removed" ? "red" : "green"} aria-label={`${r.change === "removed" ? t.remove : t.add} ${r.name}`} checked={isIn(r, included)} disabled={accepted} tabIndex={accepted ? undefined : r.key === tabKey ? 0 : -1} oncheckedchange={(c) => toggle(r, c === true)} />{/snippet}
{#snippet pill(r: DiffTableRow)}<StatusPill tone="neutral" size="sm" dotTone={r.tone && r.tone !== "neutral" ? r.tone : undefined}>{r.category}</StatusPill>{/snippet}
{#snippet value(r: DiffTableRow)}<span data-slot="diff-table-value" class={s.value()}><span data-slot="diff-table-value-text" class={s.valueText({ change: r.change, included: isIn(r, included) })} title={r.value}>{r.value}</span>{#if r.change !== "unchanged"}{@render mark(r)}{/if}</span>{/snippet}

<div bind:this={root} {...data} data-slot="diff-table" class={s.base({ class: className as string | undefined })} data-enter={enter ? "" : undefined} {style}>
  <div data-slot="diff-table-card" class={s.card()}>
    <div data-slot="diff-table-bar" class={s.bar()}>
      <span data-slot="diff-table-title" class={s.title()}>{title}</span>
      {#if !accepted && changed.length > 0}<span data-slot="diff-table-hint" class={s.hint()}>{t.hint}</span>{/if}
    </div>
    <table data-slot="diff-table-table" class={s.table()}>
      <colgroup><col data-slot="diff-table-col" class={s.col({ col: "name" })} /><col data-slot="diff-table-col" class={s.col({ col: "category" })} /><col data-slot="diff-table-col" class={s.col({ col: "value" })} /></colgroup>
      <thead><tr>{#each columns as h, i (i)}<th data-slot="diff-table-th" class={s.th()} scope="col">{h}</th>{/each}</tr></thead>
      <tbody>
        {#if rows.length === 0}
          <tr>
            <td data-slot="diff-table-empty" class={s.empty()} colspan="3"><EmptyState title={t.empty} icon="table" size="block" /></td>
          </tr>
        {/if}
        {#each rows as r (r.key)}
          <tr
            data-slot="diff-table-row"
            class={s.row({ change: r.change, included: isIn(r, included), toggleable: r.change !== "unchanged" && !accepted })}
            data-key={r.key}
            onclick={(e) => onRowClick(r, e)}
            onkeydown={(e) => onRowKey(r, e)}
            onfocusin={(e) => onRowFocus(r, e)}
          >
            {#if r.change === "added"}
              <td data-slot="diff-table-cell" class={s.cell({ change: r.change, included: isIn(r, included), col: "name" })}><div data-slot="diff-table-reveal" class={s.reveal()}><div><div data-slot="diff-table-pad" class={s.pad()}>{r.name}</div></div></div></td>
              <td data-slot="diff-table-cell" class={s.cell({ change: r.change, included: isIn(r, included), col: "category" })}><div data-slot="diff-table-reveal" class={s.reveal()}><div><div data-slot="diff-table-pad" class={s.pad()}>{@render pill(r)}</div></div></div></td>
              <td data-slot="diff-table-cell" class={s.cell({ change: r.change, included: isIn(r, included), col: "value" })}><div data-slot="diff-table-reveal" class={s.reveal()}><div><div data-slot="diff-table-pad" class={s.pad()}>{@render value(r)}</div></div></div></td>
            {:else}
              <td data-slot="diff-table-cell" class={s.cell({ change: r.change, included: isIn(r, included), col: "name" })}>{r.name}</td>
              <td data-slot="diff-table-cell" class={s.cell({ change: r.change, included: isIn(r, included), col: "category" })}>{@render pill(r)}</td>
              <td data-slot="diff-table-cell" class={s.cell({ change: r.change, included: isIn(r, included), col: "value" })}>{@render value(r)}</td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
    <div data-slot="diff-table-footer" class={s.footer()}>
      {#if accepted}
        <StatusPill data-diff-table="applied" class={s.applied()} tone="green" mark tabindex={-1} data-enter="">{text.applied}</StatusPill>
      {:else}
        <span data-slot="diff-table-summary" class={s.summary()}>{text.summary}</span>
        {#if changed.length > 0}<Button variant="accent" size="sm" disabled={text.total === 0} onclick={apply}>{text.apply}</Button>{/if}
      {/if}
    </div>
  </div>
</div>
