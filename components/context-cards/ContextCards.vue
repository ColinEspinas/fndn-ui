<script setup lang="ts">
/** Retrieved knowledge chunks with their sources. */
import { PhArrowUpRight, PhTextAlignLeft } from "@phosphor-icons/vue";
import { useAttrs } from "vue";
import { contextCards } from "./context-cards.recipe";
import Count from "../count/Count.vue";

export type ContextBadgeTone = "neutral" | "red" | "green" | "orange" | "accent";
export type ContextChunk = { title: string; chars: string; body: string; source: string; href?: string; badge: string; tone?: ContextBadgeTone };

const props = withDefaults(
  defineProps<{
    title?: string;
    count?: string;
    chunks: ContextChunk[];
    /** Enter on mount: the header fades in, the cards rise staggered. Off by default; set it on the set your code adds live, never on one rendered from history or with the page. Cards added later enter either way. */
    appear?: boolean;
  }>(),
  { title: "All chunks", count: undefined, appear: false },
);
/* stagger only the cards that are here at first render (with appear); a card that arrives later enters at once */
const atMount = props.chunks.length;
const entrance = props.appear;

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const r = contextCards();
</script>

<template>
  <div v-bind="attrs" data-slot="context-cards" :class="r.base({ class: attrs.class as string | undefined })">
    <div data-slot="context-cards-header" :class="r.header({ appear: entrance })">
      <span data-slot="context-cards-title" :class="r.title()" :title="title">{{ title }}</span>
      <Count v-if="count !== undefined" variant="boxed">{{ count }}</Count>
    </div>
    <div v-for="(c, i) in chunks" :key="`${i}-${c.title}`" data-slot="context-cards-card" :class="r.card({ appear: entrance || i >= atMount })" :style="i < atMount ? { '--fndn-row-index': i } : undefined">
      <div data-slot="context-cards-bar" :class="r.bar()">
        <span data-slot="context-cards-card-title" :class="r.cardTitle()">
          <PhTextAlignLeft data-slot="icon" weight="bold" aria-hidden="true" />
          <span :title="c.title">{{ c.title }}</span>
        </span>
        <span data-slot="context-cards-chars" :class="r.chars()">{{ c.chars }}</span>
      </div>
      <p data-slot="context-cards-body" :class="r.body()">{{ c.body }}</p>
      <div data-slot="context-cards-footer" :class="r.footer()">
        <a data-slot="context-cards-source" :class="r.source()" :href="c.href ?? '#'" :target="c.href ? '_blank' : undefined" :rel="c.href ? 'noreferrer' : undefined">
          <span data-slot="context-cards-badge" :class="r.badge({ tone: c.tone ?? 'neutral' })" aria-hidden="true">{{ c.badge }}</span>
          <span data-slot="context-cards-source-name" :class="r.sourceName()" :title="c.source">{{ c.source }}</span>
          <PhArrowUpRight data-slot="icon" weight="bold" aria-hidden="true" />
        </a>
      </div>
    </div>
  </div>
</template>
