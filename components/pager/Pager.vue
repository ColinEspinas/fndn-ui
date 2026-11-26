<script setup lang="ts">
/** Previous · position · next. */
import { PhCaretDown, PhCaretLeft, PhCaretRight, PhCaretUp } from "@phosphor-icons/vue";
import { computed, onMounted, ref, useAttrs } from "vue";
import { REEL, clampPage, pageAfter, pagerDigits, pagerEnds, pagerKey, pagerPosition, pagerSpoken, pagerTotal, type PagerAction } from "./pager.logic";
import Tooltip from "../tooltip/Tooltip.vue";
import Button from "../button/Button.vue";
import { pager, type PagerRecipeProps } from "./pager.recipe";
type PagerDigit = NonNullable<PagerRecipeProps["digit"]>;
import { trackModality } from "../lib/modality";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Number of pages. */
    count: number;
    /** Wrap from the last page to the first and back; the buttons never disable. */
    loop?: boolean;
    /** Roll each digit of the position like a counter. */
    reel?: boolean;
    /** between: prev · position · next. start: position · prev · next. */
    layout?: "between" | "start";
    /** horizontal: left/right carets (mirrored right-to-left). vertical: up/down carets, Up/Down keys too. */
    orientation?: "horizontal" | "vertical";
    /** Visible: "of" ("2 of 3") or "/" ("2 / 3"). */
    separator?: string;
    /** What screen readers hear between page and count ("of"), whatever the visible separator. */
    spokenSeparator?: string;
    /** Read before the position by screen readers: "Question" → "Question 2 of 3". */
    unit?: string;
    /** The group's accessible name. */
    label?: string;
    prevLabel?: string;
    nextLabel?: string;
    /** Attributes for the previous button (a host ties it to what it pages: aria-controls). */
    prevProps?: Record<string, string | undefined>;
    /** Attributes for the next button. */
    nextProps?: Record<string, string | undefined>;
  }>(),
  { loop: false, reel: false, layout: "between", orientation: "horizontal", separator: "of", spokenSeparator: "of", label: "Pages", prevLabel: "Previous", nextLabel: "Next" },
);

/** v-model:page (0-based) — falls back to local state when unbound. */
const page = defineModel<number>("page", { default: 0 });
const emit = defineEmits<{ pageChange: [page: number] }>();

const root = ref<HTMLElement | null>(null);
const current = computed(() => clampPage(page.value, props.count));
const r = computed(() => pager({ layout: props.layout, orientation: props.orientation }));
const vertical = computed(() => props.orientation === "vertical");
const ends = computed(() => pagerEnds(current.value, props.count, props.loop));
const text = computed(() => pagerPosition(current.value, props.count, props.separator));
const spoken = computed(() => pagerSpoken(current.value, props.count, props.spokenSeparator, props.unit));

function go(action: PagerAction) {
  const to = pageAfter(action, current.value, props.count, props.loop);
  if (to === current.value) return;
  page.value = to;
  emit("pageChange", to);
}
function onKeydown(e: KeyboardEvent) {
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const rtl = root.value ? getComputedStyle(root.value).direction === "rtl" : false;
  const action = pagerKey(e.key, rtl, vertical.value);
  if (!action || props.count <= 1) return;
  e.preventDefault();
  go(action);
}
onMounted(() => trackModality());
</script>

<template>
  <div ref="root" v-bind="attrs" data-slot="pager" :class="r.base({ class: attrs.class as string | undefined })" role="group" :aria-label="label" @keydown="onKeydown">
    <Tooltip :content="prevLabel">
      <Button v-bind="prevProps" data-pager="prev" :class="r.prev()" variant="ghost" size="sm" square muted :aria-label="prevLabel" :aria-disabled="ends.prev ? undefined : 'true'" @click="ends.prev && go('prev')">
        <template #icon><PhCaretUp v-if="vertical" data-slot="icon" weight="bold" /><PhCaretLeft v-else data-slot="icon" weight="bold" /></template>
      </Button>
    </Tooltip>
    <span v-if="reel" data-slot="pager-position" :class="r.position()" role="status"><span class="sr-only">{{ spoken }}</span><span data-slot="pager-digits" :class="r.digits()" aria-hidden="true"><span v-for="(d, i) in pagerDigits(current, count)" :key="i" data-slot="pager-digit" :class="r.digit()"><span data-slot="pager-reel" :class="r.reel({ digit: d as PagerDigit })"><span v-for="n in REEL" :key="n">{{ n }}</span></span></span></span><span data-slot="pager-total" :class="r.total()" aria-hidden="true">{{ pagerTotal(count, separator) }}</span></span>
    <span v-else-if="spokenSeparator !== separator" data-slot="pager-position" :class="r.position()" role="status"><span class="sr-only">{{ spoken }}</span><span data-slot="pager-text" :class="r.text()" aria-hidden="true">{{ text }}</span></span>
    <span v-else data-slot="pager-position" :class="r.position()" role="status"><span v-if="unit" class="sr-only">{{ `${unit} ` }}</span>{{ text }}</span>
    <Tooltip :content="nextLabel">
      <Button v-bind="nextProps" data-pager="next" :class="r.next()" variant="ghost" size="sm" square muted :aria-label="nextLabel" :aria-disabled="ends.next ? undefined : 'true'" @click="ends.next && go('next')">
        <template #icon><PhCaretDown v-if="vertical" data-slot="icon" weight="bold" /><PhCaretRight v-else data-slot="icon" weight="bold" /></template>
      </Button>
    </Tooltip>
  </div>
</template>
