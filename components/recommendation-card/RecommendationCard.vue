<script setup lang="ts">
/** Agent suggestion with a confidence meter and actions. */
import { Collapsible } from "@ark-ui/vue/collapsible";
import { computed, nextTick, onMounted, ref, useAttrs, watch } from "vue";
import { glide } from "../lib/glide";
import { trackModality } from "../lib/modality";
import Button from "../button/Button.vue";
import { collapsible } from "../collapsible/collapsible.recipe";
import EntityChip from "../entity-chip/EntityChip.vue";
import { recommendationCard } from "./recommendation-card.recipe";
import ValuePill from "../value-pill/ValuePill.vue";

const r = recommendationCard();
const c = collapsible();

export type RecommendationTone = "neutral" | "green" | "orange" | "red" | "accent";
/** A piece of an option's body: text, an entity chip, a value pill or emphasised text. */
export type RecommendationSegment =
  | string
  | { entity: string; color?: string }
  | { value: string; tone?: RecommendationTone }
  | { strong: string };
export type RecommendationOption = {
  key: string;
  /** Plain text or segments; use the `body` scoped slot for anything richer. */
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

const props = withDefaults(
  defineProps<{
    title: string;
    options: RecommendationOption[];
    labels?: Partial<RecommendationLabels>;
  }>(),
  { labels: () => ({}) },
);
/** v-model:selected / v-model:open / v-model:accepted — fall back to local state when unbound. */
const selected = defineModel<number>("selected", { default: 0 });
const open = defineModel<boolean>("open", { default: false });
const accepted = defineModel<boolean>("accepted", { default: false });
const emit = defineEmits<{ accept: [option: RecommendationOption]; select: [index: number] }>();
/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
defineSlots<{ body?: (props: { option: RecommendationOption; active: boolean }) => unknown }>();

/* with one option there is nothing to switch to: no Alternatives button, no drawer */
const many = computed(() => props.options.length > 1);
onMounted(() => trackModality());
const t = computed(() => ({ alternatives: "Alternatives", otherOptions: "Other options", accepted: "Accepted", ...props.labels }));
const current = computed(() => Math.min(Math.max(selected.value, 0), Math.max(props.options.length - 1, 0)));
const active = computed(() => props.options[current.value]);
const segments = (body: RecommendationOption["body"]): RecommendationSegment[] => (Array.isArray(body) ? body : body ? [body] : []);
/** position of each option among the visible rows (-1 for the active one) */
const positions = computed(() => { let n = 0; return props.options.map((_, i) => (i === current.value ? -1 : n++)); });

const list = ref<HTMLElement | null>(null);
/* one gliding highlight under the alternatives (the drawer exists only with more than one option) */
watch(list, (el, _, onCleanup) => {
  const layer = el?.querySelector<HTMLElement>(":scope > [data-slot=recommendation-card-highlight]");
  if (el && layer) onCleanup(glide(el, layer, { rows: "[data-slot=recommendation-card-alt]:not([hidden])", follow: "hover" }));
}, { flush: "post" });
function select(i: number, e: MouseEvent) {
  const keep = document.activeElement === e.currentTarget ? positions.value[i]! : null;
  selected.value = i;
  accepted.value = false;
  emit("select", i);
  /* the chosen row leaves the list: keep focus at the same place in it */
  if (keep !== null) nextTick(() => {
    const visible = Array.from(list.value?.querySelectorAll<HTMLElement>("[data-slot=recommendation-card-alt]:not([hidden])") ?? []);
    visible[Math.min(keep, visible.length - 1)]?.focus({ preventScroll: true });
  });
}
function accept() {
  if (!active.value) return;
  accepted.value = true;
  emit("accept", active.value);
}
</script>

<template>
  <!-- the card is the root of a collapsible: the Alternatives button opens the drawer -->
  <Collapsible.Root v-if="active" as-child :open="many && open" @open-change="(d) => (open = d.open)">
  <div v-bind="attrs" data-slot="recommendation-card" :class="r.base({ class: attrs.class as string | undefined })">
    <span data-slot="recommendation-card-status" :class="r.status()" role="status">{{ accepted ? t.accepted : "" }}</span>
    <div data-slot="recommendation-card-body" :class="r.body()">
      <span data-slot="recommendation-card-title" :class="r.title()">{{ title }}</span>
      <div data-slot="recommendation-card-texts" :class="r.texts()">
        <p
          v-for="(o, i) in options"
          :key="o.key"
          data-slot="recommendation-card-text" :class="r.text({ active: i === current })"
          :aria-hidden="i === current ? undefined : 'true'"
        >
          <slot name="body" :option="o" :active="i === current">
            <template v-for="(s, si) in segments(o.body)" :key="si">
              <template v-if="typeof s === 'string'">{{ s }}</template>
              <EntityChip v-else-if="'entity' in s" :name="s.entity" :color="s.color" />
              <ValuePill v-else-if="'value' in s" :tone="s.tone ?? 'neutral'">{{ s.value }}</ValuePill>
              <span v-else data-slot="recommendation-card-strong" :class="r.strong()">{{ s.strong }}</span>
            </template>
          </slot>
        </p>
      </div>
    </div>
    <Collapsible.Content v-if="many" data-recommendation-card="drawer" data-slot="collapsible-content" :class="c.content({ class: r.drawer() })">
      <div data-slot="collapsible-body" :class="c.body()">
        <div ref="list" data-slot="recommendation-card-drawer-list" :class="r.drawerList()">
          <span data-slot="recommendation-card-highlight" :class="r.highlight()" aria-hidden="true" />
          <p data-slot="recommendation-card-drawer-label" :class="r.drawerLabel()">{{ t.otherOptions }}</p>
          <button v-for="(o, i) in options" :key="o.key" type="button" data-slot="recommendation-card-alt" :class="r.alt()" :hidden="i === current" @click="select(i, $event)">
            <span data-slot="recommendation-card-meter" :class="r.meter({ tone: o.tone })" aria-hidden="true">
              <span v-for="bar in [0, 1, 2]" :key="bar" data-slot="recommendation-card-meter-bar" :class="r.meterBar({ on: bar < o.signal })" />
            </span>
            <span data-slot="recommendation-card-alt-short" :class="r.altShort()">{{ o.short }}</span>
            <span data-slot="recommendation-card-alt-label" :class="r.altLabel()">{{ o.label }}</span>
          </button>
        </div>
      </div>
    </Collapsible.Content>
    <div data-slot="recommendation-card-footer" :class="r.footer()">
      <span data-slot="recommendation-card-confidence" :class="r.confidence()">
        <span data-slot="recommendation-card-meter" :class="r.meter({ tone: active.tone })" aria-hidden="true">
          <span v-for="bar in [0, 1, 2]" :key="bar" data-slot="recommendation-card-meter-bar" :class="r.meterBar({ on: bar < active.signal })" />
        </span>
        <span data-slot="recommendation-card-confidence-label" :class="r.confidenceLabel()">{{ active.label }}</span>
      </span>
      <span data-slot="recommendation-card-actions" :class="r.actions()">
        <Collapsible.Trigger v-if="many" as-child><Button variant="outline" size="sm">{{ t.alternatives }}</Button></Collapsible.Trigger>
        <Button :variant="accepted ? 'success' : (active.ctaVariant ?? 'accent')" size="sm" @click="accept">{{ accepted ? t.accepted : active.cta }}</Button>
      </span>
    </div>
  </div>
  </Collapsible.Root>
</template>
