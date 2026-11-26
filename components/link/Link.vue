<script setup lang="ts">
/** A link in text or on its own. */
import { PhArrowUpRight } from "@phosphor-icons/vue";
import { computed, useAttrs } from "vue";
import { link } from "./link.recipe";
export type LinkLabels = { external: string };

/* the caller's class goes through the recipe; every other attribute (href, rel…) lands on the anchor */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Where it goes. */
    href?: string;
    /** inline: inside a sentence, always underlined. standalone: on its own, underlined on hover. */
    variant?: "inline" | "standalone";
    /** accent: product text. neutral: quiet text (a hint, a footnote, terms). */
    tone?: "accent" | "neutral";
    /** Opens in a new tab and says so (the arrow, a hidden "(opens in a new tab)"). */
    external?: boolean;
    labels?: Partial<LinkLabels>;
  }>(),
  { href: undefined, variant: "inline", tone: "accent", external: false, labels: undefined },
);
const r = computed(() => link({ variant: props.variant, tone: props.tone }));
const t = computed<LinkLabels>(() => ({ external: "(opens in a new tab)", ...props.labels }));
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return { ...(props.external ? { target: "_blank", rel: "noopener noreferrer" } : {}), ...others };
});
</script>

<template>
  <a data-slot="link" :class="r.base({ class: attrs.class as string | undefined })" :href="href" v-bind="rest"><slot /><span v-if="external" data-slot="link-external" :class="r.external()"><PhArrowUpRight data-slot="icon" weight="bold" aria-hidden="true" /><span class="sr-only">{{ ` ${t.external}` }}</span></span></a>
</template>
