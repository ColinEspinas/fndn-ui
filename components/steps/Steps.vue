<script setup lang="ts">
/** A multi-step flow: numbered markers joined by a rail. Behaviour by Ark UI (Zag steps). */
import { Steps as ArkSteps } from "@ark-ui/vue/steps";
import { PhCheck } from "@phosphor-icons/vue";
import { computed, onMounted, useAttrs } from "vue";
import Button from "../button/Button.vue";
import { steps } from "./steps.recipe";
import { trackModality } from "../lib/modality";

export type StepsItem = {
  title: string;
  description?: string;
  /** The step's panel, shown while it is the current step. */
  content?: string;
};

/* the caller's class goes through the recipe; data-* land on the root */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    items: ReadonlyArray<StepsItem>;
    /** Uncontrolled: the step shown first (bind v-model:step to control it). */
    defaultStep?: number;
    orientation?: "horizontal" | "vertical";
    /** The steps are taken in order: only Back and Next move. */
    linear?: boolean;
    /** Show the Back and Next buttons. */
    controls?: boolean;
    prevLabel?: string;
    nextLabel?: string;
    /** What shows once every step is done. Or use the `completed` slot. */
    completed?: string;
  }>(),
  { orientation: "horizontal", linear: false, controls: false, prevLabel: "Back", nextLabel: "Next" },
);
/** v-model:step — the current step, from 0 (items.length: every step done). Unbound: local state. */
const step = defineModel<number | undefined>("step", { default: undefined });
const emit = defineEmits<{ stepChange: [step: number] }>();
/** content: a step's panel (gets the item and its index), instead of item.content; completed: instead of the prop */
const slots = defineSlots<{ content?: (props: { item: StepsItem; index: number }) => unknown; completed?: () => unknown }>();

const r = computed(() => steps({ orientation: props.orientation, linear: props.linear }));
const hasCompleted = computed(() => !!props.completed || !!slots.completed);
function onStep(next: number) {
  step.value = next;
  emit("stepChange", next);
}
onMounted(() => trackModality());
</script>

<template>
  <ArkSteps.Root
    v-bind="attrs"
    data-slot="steps"
    :class="r.base({ class: attrs.class as string | undefined })"
    :count="items.length"
    :step="step"
    :default-step="defaultStep"
    :orientation="orientation"
    :linear="linear"
    @step-change="(d) => onStep(d.step)"
  >
    <ArkSteps.List data-slot="steps-list" :class="r.list()">
      <ArkSteps.Item v-for="(item, index) in items" :key="index" :index="index" data-slot="steps-item" :class="r.item()">
        <ArkSteps.Trigger data-slot="steps-trigger" :class="r.trigger()">
          <ArkSteps.Indicator data-slot="steps-indicator" :class="r.indicator()">
            <span data-slot="steps-number" :class="r.number()">{{ index + 1 }}</span>
            <span data-slot="steps-check" :class="r.check()"><PhCheck data-slot="icon" weight="bold" /></span>
          </ArkSteps.Indicator>
          <span data-slot="steps-text" :class="r.text()">
            <span data-slot="steps-title" :class="r.title()">{{ item.title }}</span>
            <span v-if="item.description" data-slot="steps-description" :class="r.description()">{{ item.description }}</span>
          </span>
        </ArkSteps.Trigger>
        <ArkSteps.Separator v-if="index < items.length - 1" data-slot="steps-separator" :class="r.separator()" />
      </ArkSteps.Item>
    </ArkSteps.List>
    <template v-for="(item, index) in items" :key="index">
      <ArkSteps.Content v-if="item.content || slots.content" :index="index" data-slot="steps-content" :class="r.content()"><slot name="content" :item="item" :index="index">{{ item.content }}</slot></ArkSteps.Content>
    </template>
    <ArkSteps.CompletedContent v-if="hasCompleted" data-slot="steps-completed" :class="r.completed()"><slot name="completed">{{ completed }}</slot></ArkSteps.CompletedContent>
    <div v-if="controls" data-slot="steps-footer" :class="r.footer()">
      <ArkSteps.PrevTrigger as-child><Button data-steps="prev" variant="outline" size="sm">{{ prevLabel }}</Button></ArkSteps.PrevTrigger>
      <ArkSteps.NextTrigger as-child><Button data-steps="next" variant="primary" size="sm">{{ nextLabel }}</Button></ArkSteps.NextTrigger>
    </div>
  </ArkSteps.Root>
</template>
