<script setup lang="ts">
/** On/off toggle; a native button with role=switch. */
import { computed, onMounted, useAttrs } from "vue";
import { trackModality } from "../lib/modality";
import { switchRecipe } from "./switch.recipe";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** md: 40×24 (default). sm: 32×18. */
    size?: "sm" | "md";
    disabled?: boolean;
    /** Accessible name when there is no visible label. */
    label?: string;
  }>(),
  { size: "md", disabled: false, label: undefined },
);

/** v-model:checked — falls back to local state when unbound. */
const checked = defineModel<boolean>("checked", { default: false });
const emit = defineEmits<{ checkedChange: [checked: boolean] }>();
/** Default slot: visible label. The switch is wrapped in a <label>, so the text toggles and names it. */
defineSlots<{ default?: () => unknown }>();

function toggle() {
  if (props.disabled) return;
  checked.value = !checked.value;
  emit("checkedChange", checked.value);
}

/* With a visible label, class and style land on the wrapper (the outermost element: what a caller
 * sizes and places); every other attribute stays on the button. */
const attrs = useAttrs();
const outer = computed(() => ({ style: attrs.style }));
/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
const r = computed(() => switchRecipe({ size: props.size }));
const callerClass = computed(() => attrs.class as string | undefined);
const inner = computed(() => { const { class: _class, style: _style, ...rest } = attrs; return rest; });

onMounted(() => trackModality());
</script>

<template>
  <label v-if="$slots.default" v-bind="outer" data-slot="switch-label" :class="r.label({ class: callerClass })">
    <button
      v-bind="inner"
      type="button"
      role="switch"
      data-slot="switch" :class="r.base()"
      :aria-checked="checked ? 'true' : 'false'"
      :aria-label="label"
      :disabled="disabled || undefined"
      @click="toggle"
    >
      <span data-slot="switch-thumb" :class="r.thumb()" aria-hidden="true" />
    </button>
    <span data-slot="switch-label-text" :class="r.labelText()"><slot /></span>
  </label>
  <button
    v-else
    v-bind="inner"
    type="button"
    role="switch"
    data-slot="switch" :class="r.base({ class: callerClass })"
    :style="attrs.style"
    :aria-checked="checked ? 'true' : 'false'"
    :aria-label="label"
    :disabled="disabled || undefined"
    @click="toggle"
  >
    <span data-slot="switch-thumb" :class="r.thumb()" aria-hidden="true" />
  </button>
</template>
