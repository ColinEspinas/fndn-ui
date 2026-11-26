<script setup lang="ts">
/** A score out of a few stars. Behaviour by Ark UI (Zag rating-group). */
import { RatingGroup } from "@ark-ui/vue/rating-group";
import { PhStar } from "@phosphor-icons/vue";
import { computed, onMounted, useAttrs } from "vue";
import { trackModality } from "../lib/modality";
import { rating } from "./rating.recipe";

export type RatingSize = "sm" | "md";

/* the caller's class goes through the recipe; other attributes (id, data-*) go to the root */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Number of stars. */
    count?: number;
    /** Half stars: the first half of a star picks .5. */
    allowHalf?: boolean;
    /** md: 24px cells, 20px stars (default). sm: 18px cells, 14px stars. */
    size?: RatingSize;
    /** Visible label above the stars. */
    label?: string;
    /** Shows the score; it cannot be changed (still focusable and announced). */
    readOnly?: boolean;
    disabled?: boolean;
    /** Form field name. */
    name?: string;
    /** Name of the stars when there is no visible label. */
    ariaLabel?: string;
  }>(),
  { count: 5, allowHalf: false, size: "md", readOnly: false, disabled: false },
);

/** v-model:value — the score (0 = none; 3.5 with allowHalf); falls back to local state when unbound. */
const value = defineModel<number>("value", { default: 0 });
const emit = defineEmits<{ valueChange: [value: number] }>();

const r = computed(() => rating({ size: props.size, disabled: props.disabled }));
const stars = computed(() => Array.from({ length: props.count }, (_, i) => i + 1));
const named = computed(() => (!props.label && props.ariaLabel ? { "aria-label": props.ariaLabel } : {}));

function onValue(next: number) {
  value.value = next;
  emit("valueChange", next);
}

onMounted(() => trackModality());
</script>

<template>
  <RatingGroup.Root
    v-bind="attrs"
    data-slot="rating"
    :class="r.base({ class: attrs.class as string | undefined })"
    :model-value="value"
    :count="count"
    :allow-half="allowHalf"
    :read-only="readOnly"
    :disabled="disabled"
    :name="name"
    @update:model-value="onValue"
  >
    <RatingGroup.Label v-if="label" data-slot="rating-label" :class="r.label()">{{ label }}</RatingGroup.Label>
    <RatingGroup.Control data-slot="rating-control" :class="r.control()" v-bind="named">
      <RatingGroup.Item v-for="index in stars" :key="index" :index="index" data-slot="rating-item" :class="r.item()">
        <PhStar data-slot="icon" weight="fill" aria-hidden="true" />
        <PhStar data-slot="icon" weight="fill" aria-hidden="true" />
      </RatingGroup.Item>
    </RatingGroup.Control>
    <RatingGroup.HiddenInput data-slot="rating-hidden-input" />
  </RatingGroup.Root>
</template>
