<script setup lang="ts">
/** Live agent task status, fully controlled. */
import { PhArrowCounterClockwise, PhCheck, PhX } from "@phosphor-icons/vue";
import { computed, onMounted, ref, useAttrs } from "vue";
import Collapsible from "../collapsible/Collapsible.vue";
import StatusPill from "../status-pill/StatusPill.vue";
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

const props = withDefaults(
  defineProps<{
    variant?: "capsules" | "list";
    rows: TaskRow[];
    labels?: Partial<TaskRowsLabels>;
    /** Enter on mount: the rows present at mount fade up, staggered. Off by default; set it on the list your code adds live, never on one rendered from history or with the page. Rows added later enter either way. */
    appear?: boolean;
  }>(),
  { variant: "capsules", labels: () => ({}), appear: false },
);
/** v-model:open — keys of expanded rows; falls back to local state when unbound. */
const open = defineModel<string[]>("open", { default: () => [] });
const emit = defineEmits<{ toggleRow: [key: string, open: boolean] }>();

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const r = computed(() => taskRows({ variant: props.variant, ready: ready.value }));

const t = computed(() => ({ completed: "Completed", failed: "Failed", running: "Running", ...props.labels }));
const R = 11;
const C = 2 * Math.PI * R;
const dash = `${(C * 0.28).toFixed(2)} ${(C * 0.72).toFixed(2)}`;

/* rows present at first render stagger in; a row that arrives later enters at once */
const order = props.rows.map((r) => r.key);
const entrance = props.appear;
const stagger = (key: string) => (order.includes(key) ? { "--fndn-row-index": order.indexOf(key) } : undefined);

/* status swaps animate, first paint does not: the ready variant arms the entry transitions */
const ready = ref(false);
onMounted(() => { ready.value = true; });

function toggle(key: string, isOpen: boolean) {
  open.value = isOpen ? [...open.value.filter((k) => k !== key), key] : open.value.filter((k) => k !== key);
  emit("toggleRow", key, isOpen);
}
</script>

<template>
  <div v-bind="attrs" data-slot="task-rows" :class="r.base({ class: attrs.class as string | undefined })">
    <Collapsible
      v-for="row in rows"
      :key="row.key"
      :class="r.row({ appear: entrance || !order.includes(row.key) })"
      data-task-rows="row"
      variant="row"
      :open="open.includes(row.key)"
      :style="stagger(row.key)"
      @open-change="(isOpen: boolean) => toggle(row.key, isOpen)"
    >
      <template #label>
        <span data-slot="task-rows-badge" :class="r.badge()" aria-hidden="true">
          <span v-if="row.status === 'running'" key="running" data-slot="task-rows-ring" :class="r.ring()">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle data-slot="task-rows-ring-track" :class="r.ringTrack()" cx="12" cy="12" :r="R" fill="none" stroke-width="2" />
              <circle data-slot="task-rows-ring-arc" :class="r.ringArc()" cx="12" cy="12" :r="R" fill="none" stroke-width="2" stroke-linecap="round" :stroke-dasharray="dash" />
            </svg>
            <span data-slot="task-rows-step" :class="r.step()">{{ row.step }}</span>
          </span>
          <span v-else :key="row.status" data-slot="task-rows-mark" :class="r.mark({ tone: row.status === 'failed' ? 'red' : 'green' })">
            <PhX v-if="row.status === 'failed'" data-slot="icon" weight="bold" aria-hidden="true" />
            <PhCheck v-else data-slot="icon" weight="bold" aria-hidden="true" />
          </span>
        </span>
        <span data-slot="task-rows-label" :class="r.label()" :title="row.label">{{ row.label }}</span>
        <span data-slot="task-rows-status" :class="r.status()" role="status">
          <StatusPill v-if="row.status === 'done'" key="done" tone="green" size="sm" :dot="false">{{ t.completed }}</StatusPill>
          <StatusPill v-else-if="row.status === 'failed'" key="failed" tone="red" size="sm" :dot="false">{{ t.failed }}<template #trailing><PhArrowCounterClockwise data-slot="icon" weight="bold" /></template></StatusPill>
          <span v-else key="running" class="sr-only">{{ t.running }}</span>
        </span>
        <span data-slot="task-rows-amount" :class="r.amount()">{{ row.amount }}</span>
      </template>
      <div data-slot="task-rows-detail-grid" :class="r.detailGrid()">
        <span data-slot="task-rows-rail" :class="r.rail()" aria-hidden="true" />
        <div data-slot="task-rows-detail-list" :class="r.detailList()">
          <div v-for="(d, j) in row.details" :key="j" data-slot="task-rows-detail" :class="r.detail()">
            <span data-slot="task-rows-detail-label" :class="r.detailLabel()" :title="d.label">{{ d.label }}</span>
            <span data-slot="task-rows-detail-meta" :class="r.detailMeta()">{{ d.meta }}</span>
          </div>
        </div>
      </div>
    </Collapsible>
  </div>
</template>
