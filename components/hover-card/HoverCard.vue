<script setup lang="ts">
/** A preview surface that opens on hover or focus. Behaviour by Ark UI (Zag hover-card). */
import { HoverCard as ArkHoverCard } from "@ark-ui/vue/hover-card";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useSlots, watch } from "vue";
import { hoverCard } from "./hover-card.recipe";
import { trackModality } from "../lib/modality";
import { looksLikePath, middleTruncation } from "../lib/truncate";

export type HoverCardPlacement = "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "right";
/** One preformatted line of a preview; add and del lines are tinted and signed. */
export type HoverCardLine = { text: string; tone?: "ctx" | "add" | "del" };

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const r = hoverCard();

const props = withDefaults(
  defineProps<{
    /** Header text, e.g. a file name. */
    title?: string;
    /** Lines added / removed, shown in the header. */
    add?: number;
    del?: number;
    /** Preformatted lines, e.g. a file diff. */
    lines?: ReadonlyArray<HoverCardLine>;
    placement?: HoverCardPlacement;
    openDelay?: number;
    closeDelay?: number;
    /** Renders the default mono chip trigger with this label. Use the `trigger` slot for your own element. */
    triggerLabel?: string;
  }>(),
  { placement: "bottom-start", openDelay: 500, closeDelay: 150 },
);
/** v-model:open — falls back to local state when unbound. */
const open = defineModel<boolean>("open", { default: false });
const emit = defineEmits<{ openChange: [open: boolean] }>();
defineSlots<{ default?: () => unknown; trigger?: () => unknown }>();

const SIGN = { ctx: " ", add: "+", del: "−" } as const;
const positioning = computed(() => ({ placement: props.placement, gutter: 6 }));
const hasMeta = computed(() => props.add !== undefined || props.del !== undefined);
function onOpen(next: boolean) {
  open.value = next;
  emit("openChange", next);
}
/* open when it mounted: drawn at once (the recipe skips the entrance) until it first closes */
const mountedOpen = ref(open.value);
watch(open, (next) => { if (!next) mountedOpen.value = false; });
onMounted(() => trackModality());
/* the default trigger, when it names a file, is cut in the middle (full text in title) */
const wrap = ref<HTMLElement | null>(null);
const slots = useSlots();
let stopMiddle = () => {};
onMounted(() => { if (!slots.trigger) stopMiddle = middleTruncation(wrap.value, ":scope > [data-slot=hover-card-trigger]", { when: looksLikePath }); });
onBeforeUnmount(() => stopMiddle());
</script>

<template>
  <div ref="wrap" v-bind="attrs" data-slot="hover-card" :class="r.base({ class: attrs.class as string | undefined })">
    <ArkHoverCard.Root :open="open" :open-delay="openDelay" :close-delay="closeDelay" :positioning="positioning" @open-change="(details) => onOpen(details.open)">
      <ArkHoverCard.Trigger v-if="$slots.trigger" as-child><slot name="trigger" /></ArkHoverCard.Trigger>
      <ArkHoverCard.Trigger v-else as-child><button type="button" data-slot="hover-card-trigger" :class="r.trigger()">{{ triggerLabel }}</button></ArkHoverCard.Trigger>
      <Teleport to="body">
        <ArkHoverCard.Positioner data-slot="hover-card-positioner" :class="r.positioner()">
          <ArkHoverCard.Content data-slot="hover-card-content" :data-mounted-open="mountedOpen ? '' : undefined" :class="r.content()">
            <div v-if="title || hasMeta" data-slot="hover-card-header" :class="r.header()">
              <span v-if="title" data-slot="hover-card-title" :class="r.title()">{{ title }}</span>
              <span v-if="hasMeta" data-slot="hover-card-meta" :class="r.meta()"><span v-if="add !== undefined" data-slot="hover-card-add" :class="r.add()">+{{ add.toLocaleString() }}</span><span v-if="del !== undefined" data-slot="hover-card-del" :class="r.del()">−{{ del.toLocaleString() }}</span></span>
            </div>
            <div v-if="lines && lines.length" data-slot="hover-card-lines" :class="r.lines()">
              <div v-for="(line, i) in lines" :key="i" data-slot="hover-card-line" :class="r.line({ tone: line.tone ?? 'ctx' })">
                <span data-slot="hover-card-sign" :class="r.sign()">{{ SIGN[line.tone ?? "ctx"] }}</span>
                <span data-slot="hover-card-text" :class="r.text()">{{ line.text }}</span>
              </div>
            </div>
            <div v-if="$slots.default" data-slot="hover-card-body" :class="r.body()"><slot /></div>
          </ArkHoverCard.Content>
        </ArkHoverCard.Positioner>
      </Teleport>
    </ArkHoverCard.Root>
  </div>
</template>
