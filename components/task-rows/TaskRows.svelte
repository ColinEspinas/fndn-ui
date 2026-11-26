<!-- Live agent task status, fully controlled. -->
<script lang="ts">
  import ArrowCounterClockwise from "phosphor-svelte/lib/ArrowCounterClockwiseIcon";
  import Check from "phosphor-svelte/lib/CheckIcon";
  import X from "phosphor-svelte/lib/XIcon";
  import { untrack } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import Collapsible from "../collapsible/Collapsible.svelte";
  import StatusPill from "../status-pill/StatusPill.svelte";
  import { taskRows } from "./task-rows.recipe";

  export type TaskDetail = { label: string; meta: string };
  export type TaskRowStatus = "done" | "running" | "failed";
  export type TaskRow = {
    key: string;
    label: string;
    amount: string;
    status: TaskRowStatus;
    /** step number shown inside the ring while running */
    step?: number;
    details: TaskDetail[];
  };
  export type TaskRowsLabels = { completed: string; failed: string; running: string };

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    variant?: "capsules" | "list";
    rows: TaskRow[];
    /** Two-way bindable: keys of expanded rows. */
    open?: string[];
    ontogglerow?: (key: string, open: boolean) => void;
    labels?: Partial<TaskRowsLabels>;
    /** Enter on mount: the rows present at mount fade up, staggered. Off by default; set it on the list your code adds live, never on one rendered from history or with the page. Rows added later enter either way. */
    appear?: boolean;
  };

  let { variant = "capsules", rows, open = $bindable([]), ontogglerow, labels, appear = false, class: className, ...rest }: Props = $props();
  const t = $derived({ completed: "Completed", failed: "Failed", running: "Running", ...labels });
  const R = 11;
  const C = 2 * Math.PI * R;
  const dash = `${(C * 0.28).toFixed(2)} ${(C * 0.72).toFixed(2)}`;

  /* rows present at first render stagger in; a row that arrives later enters at once */
  const order = untrack(() => rows.map((r) => r.key));
  const entrance = untrack(() => appear);
  const stagger = (key: string) => (order.includes(key) ? `--fndn-row-index:${order.indexOf(key)}` : undefined);

  /* status swaps animate, first paint does not: the ready variant arms the entry transitions */
  let ready = $state(false);

  const r = $derived(taskRows({ variant, ready }));
  $effect(() => { ready = true; });

  function toggle(key: string, isOpen: boolean) {
    open = isOpen ? [...open.filter((k) => k !== key), key] : open.filter((k) => k !== key);
    ontogglerow?.(key, isOpen);
  }
</script>

<div data-slot="task-rows" class={r.base({ class: className as string | undefined })} {...rest}>
  {#each rows as row (row.key)}
    {#snippet header()}
      <span data-slot="task-rows-badge" class={r.badge()} aria-hidden="true">
        {#key row.status}
          {#if row.status === "running"}
            <span data-slot="task-rows-ring" class={r.ring()}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle data-slot="task-rows-ring-track" class={r.ringTrack()} cx="12" cy="12" r={R} fill="none" stroke-width="2" />
                <circle data-slot="task-rows-ring-arc" class={r.ringArc()} cx="12" cy="12" r={R} fill="none" stroke-width="2" stroke-linecap="round" stroke-dasharray={dash} />
              </svg>
              <span data-slot="task-rows-step" class={r.step()}>{row.step}</span>
            </span>
          {:else}
            <span data-slot="task-rows-mark" class={r.mark({ tone: row.status === "failed" ? "red" : "green" })}>
              {#if row.status === "failed"}
                <X data-slot="icon" weight="bold" aria-hidden="true" />
              {:else}
                <Check data-slot="icon" weight="bold" aria-hidden="true" />
              {/if}
            </span>
          {/if}
        {/key}
      </span>
      <span data-slot="task-rows-label" class={r.label()} title={row.label}>{row.label}</span>
      <span data-slot="task-rows-status" class={r.status()} role="status">
        {#key row.status}
          {#if row.status === "done"}
            <StatusPill tone="green" size="sm" dot={false}>{t.completed}</StatusPill>
          {:else if row.status === "failed"}
            <StatusPill tone="red" size="sm" dot={false}>{t.failed}{#snippet trailingIcon()}<ArrowCounterClockwise data-slot="icon" weight="bold" />{/snippet}</StatusPill>
          {:else}
            <span class="sr-only">{t.running}</span>
          {/if}
        {/key}
      </span>
      <span data-slot="task-rows-amount" class={r.amount()}>{row.amount}</span>
    {/snippet}
    <Collapsible class={r.row({ appear: entrance || !order.includes(row.key) })} data-task-rows="row" variant="row" open={open.includes(row.key)} onopenchange={(isOpen) => toggle(row.key, isOpen)} style={stagger(row.key)} label={header}>
      <div data-slot="task-rows-detail-grid" class={r.detailGrid()}>
        <span data-slot="task-rows-rail" class={r.rail()} aria-hidden="true"></span>
        <div data-slot="task-rows-detail-list" class={r.detailList()}>
          {#each row.details as d, j (j)}
            <div data-slot="task-rows-detail" class={r.detail()}>
              <span data-slot="task-rows-detail-label" class={r.detailLabel()} title={d.label}>{d.label}</span>
              <span data-slot="task-rows-detail-meta" class={r.detailMeta()}>{d.meta}</span>
            </div>
          {/each}
        </div>
      </div>
    </Collapsible>
  {/each}
</div>
