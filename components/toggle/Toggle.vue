<script setup lang="ts">
/** A button that stays pressed. Behaviour by Ark UI (Zag toggle). */
import { Toggle as ArkToggle } from "@ark-ui/vue/toggle";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useSlots, watch } from "vue";
import Tooltip from "../tooltip/Tooltip.vue";
import { toggle } from "./toggle.recipe";
import { trackModality } from "../lib/modality";
import { truncationTitles } from "../lib/truncate";

export type ToggleVariant = "outline" | "ghost" | "ink";
export type ToggleIndicator = "none" | "start" | "bottom";
export type ToggleSize = "xs" | "sm" | "md" | "lg";
export type ToggleShape = "pill" | "rounded";

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    variant?: ToggleVariant;
    size?: ToggleSize;
    /** Radius only: pill or rounded. Left out, the app's shape (a pill, or rounded in a rounded app: "shape": "rounded" in the project's fndn.json). */
    shape?: ToggleShape;
    /** Icon-only: equal width and height (24, 28 or 32). Name it with tooltip or aria-label. */
    square?: boolean;
    /** ink-3 at rest, ink when hovered, held down or pressed. */
    muted?: boolean;
    /** The ink look's pressed mark: a 2px ink bar at the inline start (an activity bar) or at the bottom (a toolbar). */
    indicator?: ToggleIndicator;
    /** Wraps the toggle in a Tooltip with this text; also the name (aria-label) of a square or icon-only toggle that has none. */
    tooltip?: string;
    disabled?: boolean;
  }>(),
  { variant: "outline", size: "md", square: false, muted: false, indicator: "none", tooltip: undefined, disabled: false },
);

/** v-model:pressed — falls back to local state when unbound. */
const pressed = defineModel<boolean>("pressed", { default: false });
const emit = defineEmits<{ pressedChange: [pressed: boolean] }>();
/** default: the label; icon: the icon, rendered in the icon part. */
defineSlots<{ default?: () => unknown; icon?: () => unknown }>();

const slots = useSlots();
const r = computed(() => toggle({ variant: props.variant, size: props.size, shape: props.shape, square: props.square, muted: props.muted, indicator: props.indicator }));
const named = computed(() =>
  props.tooltip && (props.square || !slots.default) && attrs["aria-label"] == null ? { "aria-label": props.tooltip } : {},
);
function onPressed(next: boolean) {
  pressed.value = next;
  emit("pressedChange", next);
}

/* a label cut by its ellipsis carries its full text as a title */
const label = ref<HTMLElement | null>(null);
let stop = () => {};
watch(label, (el) => { stop(); stop = truncationTitles(el); }, { flush: "post" });
onBeforeUnmount(() => stop());
onMounted(() => trackModality());
</script>

<template>
  <Tooltip v-if="tooltip" :content="tooltip">
    <ArkToggle.Root
      v-bind="{ ...named, ...attrs }"
      data-slot="toggle"
      :class="r.base({ class: attrs.class as string | undefined })"
      :pressed="pressed"
      :disabled="disabled"
      @update:pressed="onPressed"
    >
      <span v-if="$slots.icon" data-slot="toggle-icon" :class="r.icon()" aria-hidden="true"><slot name="icon" /></span>
      <span v-if="$slots.default" ref="label" data-slot="toggle-label" :class="r.label()"><slot /></span>
    </ArkToggle.Root>
  </Tooltip>
  <ArkToggle.Root
    v-else
    v-bind="attrs"
    data-slot="toggle"
    :class="r.base({ class: attrs.class as string | undefined })"
    :pressed="pressed"
    :disabled="disabled"
    @update:pressed="onPressed"
  >
    <span v-if="$slots.icon" data-slot="toggle-icon" :class="r.icon()" aria-hidden="true"><slot name="icon" /></span>
    <span v-if="$slots.default" ref="label" data-slot="toggle-label" :class="r.label()"><slot /></span>
  </ArkToggle.Root>
</template>
