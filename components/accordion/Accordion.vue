<script setup lang="ts">
/** A stack of disclosures, one open at a time unless multiple. Behaviour by Ark UI (Zag accordion). */
import { Accordion as ArkAccordion } from "@ark-ui/vue/accordion";
import { PhCaretRight } from "@phosphor-icons/vue";
import { computed, onMounted, useAttrs } from "vue";
import { accordion } from "./accordion.recipe";
import { trackModality } from "../lib/modality";

export type AccordionItem = {
  value: string;
  /** The trigger's text. */
  label: string;
  /** Trailing muted note in the trigger. */
  meta?: string;
  /** Plain detail text in the region, inset like the label. */
  detail?: string;
  disabled?: boolean;
};

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    items: ReadonlyArray<AccordionItem>;
    /** Several items may be open at once. */
    multiple?: boolean;
    /** The open item closes when its trigger is pressed again (default true). */
    collapsible?: boolean;
    /** plain: rows on the page. card: the rows in one surface card. */
    variant?: "plain" | "card";
    /** Where the caret sits in each trigger. */
    caret?: "start" | "end";
    disabled?: boolean;
  }>(),
  { multiple: false, collapsible: true, variant: "plain", caret: "end", disabled: false },
);

/** v-model:value — the values of the open items; falls back to local state when unbound. */
const value = defineModel<string[]>("value", { default: () => [] });
const emit = defineEmits<{ valueChange: [value: string[]] }>();
/** content: free content in an item's region, after its detail text (receives the item) */
defineSlots<{ content?: (props: { item: AccordionItem }) => unknown }>();

function onValue(next: string[]) {
  value.value = next;
  emit("valueChange", next);
}
onMounted(() => trackModality());
const r = computed(() => accordion({ variant: props.variant }));
</script>

<template>
  <ArkAccordion.Root
    v-bind="attrs"
    data-slot="accordion"
    :class="r.base({ class: attrs.class as string | undefined })"
    :model-value="value"
    :multiple="multiple"
    :collapsible="collapsible"
    :disabled="disabled"
    @value-change="(details) => onValue(details.value)"
  >
    <ArkAccordion.Item v-for="item in items" :key="item.value" :value="item.value" :disabled="item.disabled" data-slot="accordion-item" :class="r.item()">
      <ArkAccordion.ItemTrigger data-slot="accordion-trigger" :class="r.trigger()">
        <span v-if="caret === 'start'" data-slot="accordion-caret" :class="r.caret()" aria-hidden="true"><PhCaretRight data-slot="icon" weight="bold" /></span>
        <span data-slot="accordion-label" :class="r.label()">{{ item.label }}</span>
        <span v-if="item.meta" data-slot="accordion-meta" :class="r.meta()">{{ item.meta }}</span>
        <span v-if="caret === 'end'" data-slot="accordion-caret" :class="r.caret()" aria-hidden="true"><PhCaretRight data-slot="icon" weight="bold" /></span>
      </ArkAccordion.ItemTrigger>
      <ArkAccordion.ItemContent data-slot="accordion-content" :class="r.content()">
        <div data-slot="accordion-body" :class="r.body()">
          <p v-if="item.detail" data-slot="accordion-text" :class="r.text()">{{ item.detail }}</p>
          <slot name="content" :item="item" />
        </div>
      </ArkAccordion.ItemContent>
    </ArkAccordion.Item>
  </ArkAccordion.Root>
</template>
