<script setup lang="ts">
/** A disclosure: a trigger and a region that reveals under it. Behaviour by Ark UI (Zag collapsible). */
import { Collapsible as ArkCollapsible } from "@ark-ui/vue/collapsible";
import { PhCaretRight } from "@phosphor-icons/vue";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import { collapsible } from "./collapsible.recipe";
import { trackModality } from "../lib/modality";
import { truncationTitles } from "../lib/truncate";

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    /** row: a whole row is the trigger. inline: a text-sized header on the text line. section: a quiet section header. */
    variant?: "row" | "inline" | "section";
    /** Where the caret sits in the trigger. */
    caret?: "start" | "end" | "none";
    /** The trigger's content (or the `label` slot). */
    label?: string;
    /** Trailing muted note in the trigger. */
    meta?: string;
    /** Plain detail text, inset like the trigger. */
    detail?: string;
    /** A closed region stays laid out at zero height (invisible, out of the tab order) instead of
     * display: none, so entrances inside it do not replay when it reopens. */
    keepLayout?: boolean;
    /** A class added to the trigger (a host's hook). */
    triggerClass?: string;
    /** A class added to the label part (a host's hook). */
    labelClass?: string;
  }>(),
  { disabled: false, variant: "row", caret: "end", keepLayout: false, triggerClass: undefined, labelClass: undefined },
);

const r = computed(() => collapsible({ variant: props.variant }));

/** v-model:open — falls back to local state when unbound. */
const open = defineModel<boolean>("open", { default: false });
const emit = defineEmits<{ openChange: [open: boolean] }>();
defineSlots<{ label?: () => unknown; default?: () => unknown }>();

function onOpen(details: { open: boolean }) {
  open.value = details.open;
  emit("openChange", details.open);
}
onMounted(() => trackModality());

/* a label cut by its ellipsis carries its full text as a title (inline, section: a row's label
 * wraps, so nothing is cut) */
const labelEl = ref<HTMLElement | null>(null);
let stopTitles = () => {};
const titles = () => { stopTitles(); stopTitles = props.variant === "row" ? () => {} : truncationTitles(labelEl.value); };
onMounted(titles);
watch(() => props.variant, titles, { flush: "post" });
onBeforeUnmount(() => stopTitles());
</script>

<template>
  <ArkCollapsible.Root v-bind="attrs" data-slot="collapsible" :class="r.base({ class: attrs.class as string | undefined })" :data-keep-layout="keepLayout ? '' : undefined" :open="open" :disabled="disabled" @open-change="onOpen">
    <ArkCollapsible.Trigger data-slot="collapsible-trigger" :class="r.trigger({ class: triggerClass })">
      <span v-if="caret === 'start'" data-slot="collapsible-caret" :class="r.caret()" aria-hidden="true"><PhCaretRight data-slot="icon" weight="bold" /></span>
      <span ref="labelEl" data-slot="collapsible-label" :class="r.label({ class: labelClass })"><slot name="label">{{ label }}</slot></span>
      <span v-if="meta" data-slot="collapsible-meta" :class="r.meta()">{{ meta }}</span>
      <span v-if="caret === 'end'" data-slot="collapsible-caret" :class="r.caret()" aria-hidden="true"><PhCaretRight data-slot="icon" weight="bold" /></span>
    </ArkCollapsible.Trigger>
    <ArkCollapsible.Content data-slot="collapsible-content" :class="r.content()">
      <div data-slot="collapsible-body" :class="r.body()">
        <p v-if="detail" data-slot="collapsible-text" :class="r.text()">{{ detail }}</p>
        <slot />
      </div>
    </ArkCollapsible.Content>
  </ArkCollapsible.Root>
</template>
