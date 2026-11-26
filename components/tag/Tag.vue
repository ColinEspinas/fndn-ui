<script setup lang="ts">
/** The squarer, bordered label of tables and fields, optionally removable. */
import { computed, onBeforeUnmount, ref, useAttrs, watch } from "vue";
import { truncationTitles } from "../lib/truncate";
import { PhX } from "@phosphor-icons/vue";
import Button from "../button/Button.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import { tag } from "./tag.recipe";

export type TagTone = "neutral" | "accent" | "blue" | "green" | "orange" | "red" | "purple" | "cyan" | "yellow" | "pink";
export type TagSize = "md" | "sm";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    tone?: TagTone;
    /** tint (default): the box takes the hue. outline: a neutral box with the hue in its dot (Linear's labels); the dot shows. */
    variant?: "tint" | "outline";
    size?: TagSize;
    /** Radius only: rounded (default) or pill, for a tag in a pill-shaped host. */
    shape?: "rounded" | "pill";
    /** Leading dot in the tag's hue. */
    dot?: boolean;
    /** Remove button at the end. */
    removable?: boolean;
    /** aria-label of the remove button. */
    removeLabel?: string;
    /** A tooltip on the remove button (the real Tooltip around it). */
    removeTooltip?: string;
    /** Attributes for the remove button, e.g. a data attribute the owner uses to move focus after a removal. */
    removeProps?: Record<string, unknown>;
  }>(),
  { tone: "neutral", variant: "tint", size: "md", shape: "rounded", dot: false, removable: false, removeLabel: "Remove", removeTooltip: undefined, removeProps: undefined },
);
const emit = defineEmits<{ remove: [] }>();
/* icon: a glyph before the label (takes the dot's place) */
const slots = defineSlots<{ default?: () => unknown; icon?: () => unknown }>();
const showDot = computed(() => (props.dot || props.variant === "outline") && !slots.icon);
const r = computed(() => tag({ tone: props.tone, variant: props.variant, size: props.size, shape: props.shape, removable: props.removable }));

/* a label cut by its ellipsis carries its full text as a title */
const label = ref<HTMLElement | null>(null);
let stop = () => {};
watch(label, (el) => { stop(); stop = truncationTitles(el); }, { flush: "post" });
onBeforeUnmount(() => stop());
</script>

<template>
  <span v-bind="attrs" data-slot="tag" :class="r.base({ class: attrs.class as string | undefined })">
    <span v-if="showDot" data-slot="tag-dot" :class="r.dot()" aria-hidden="true" />
    <span v-if="$slots.icon" data-slot="tag-icon" :class="r.icon()" aria-hidden="true"><slot name="icon" /></span>
    <span v-if="$slots.default" ref="label" data-slot="tag-label" :class="r.label()"><slot /></span>
    <template v-if="removable">
      <Tooltip v-if="removeTooltip" :content="removeTooltip">
        <Button v-bind="removeProps" data-tag="remove" :class="r.remove({ class: removeProps?.class as string | undefined })" variant="ghost" size="xs" :shape="shape" square :icon-size="size === 'sm' ? 10 : 12" :aria-label="removeLabel" @click="emit('remove')">
          <template #icon><PhX data-slot="icon" weight="bold" /></template>
        </Button>
      </Tooltip>
      <Button v-else v-bind="removeProps" data-tag="remove" :class="r.remove({ class: removeProps?.class as string | undefined })" variant="ghost" size="xs" :shape="shape" square :icon-size="size === 'sm' ? 10 : 12" :aria-label="removeLabel" @click="emit('remove')">
        <template #icon><PhX data-slot="icon" weight="bold" /></template>
      </Button>
    </template>
  </span>
</template>
