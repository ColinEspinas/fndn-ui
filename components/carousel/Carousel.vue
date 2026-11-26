<script setup lang="ts">
/** Slides that scroll sideways a page at a time. Behaviour by Ark UI (Zag carousel). */
import { Carousel as ArkCarousel } from "@ark-ui/vue/carousel";
import { PhPause, PhPlay } from "@phosphor-icons/vue";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import { carouselMotion, holdAutoplay, reducedMotion, restartProgress, withoutScrollWatch } from "./carousel.logic";
import { trackModality } from "../lib/modality";
import Button from "../button/Button.vue";
import Pager from "../pager/Pager.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import { carousel } from "./carousel.recipe";

/** A slide: text (content), or rich content through the `slide` slot; label names it for screen readers. */
export type CarouselItem = { content?: string; label?: string };
export type CarouselEffect = "slide" | "depth" | "fade" | "parallax" | "none";
export type CarouselLoop = "none" | "rewind" | "endless";

/* the caller's class goes through the recipe; other attributes (id, style, data-*) go to the root */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** The slides in order. Strings are text slides. */
    items: ReadonlyArray<CarouselItem | string>;
    /** Slides shown at once; a page moves by that many. */
    slidesPerPage?: number;
    /** Pixels between slides. */
    spacing?: number;
    /** Wrap from the last page to the first and back. */
    loop?: CarouselLoop;
    /** Dots at the start of the control row. */
    indicators?: boolean;
    /** The control row (pager and dots). */
    controls?: boolean;
    /** A mouse can drag the slides. */
    mouseDrag?: boolean;
    /** How far one drag takes the slides: page (the neighbouring page at most, the default) or free (as far as it is dragged). In fade a drag always turns one page. */
    dragReach?: "page" | "free";
    /** How a slide arrives: slide, depth, fade (one slide per page) or parallax (moves the element a slide marks data-carousel="picture"). */
    effect?: CarouselEffect;
    /** Milliseconds a page stays before the next comes by itself; 0 is off. */
    autoplay?: number;
    /** The pager's accessible name. */
    label?: string;
  }>(),
  { slidesPerPage: 1, spacing: 12, loop: "none", indicators: false, controls: true, mouseDrag: true, dragReach: "page", effect: "slide", autoplay: 0, label: "Slides" },
);

/** v-model:page (0-based) — falls back to local state when unbound. */
const page = defineModel<number>("page", { default: 0 });
const emit = defineEmits<{ pageChange: [page: number] }>();
defineSlots<{ slide?: (props: { item: CarouselItem; index: number }) => unknown }>();

const slides = computed(() => props.items.map((o): CarouselItem => (typeof o === "string" ? { content: o } : o)));
/* before the engine has measured, a page is slidesPerPage slides */
const guess = computed(() => Math.ceil(slides.value.length / Math.max(1, Math.floor(props.slidesPerPage))));
const pageCount = (snaps: number) => snaps || guess.value;

/* Autoplay: the user's wish (on until they pause or page by hand; off under reduced motion), and
 * what holds it now (pointer, focus, hidden page, off screen: carousel.logic.ts). The engine runs
 * only while both allow; `running` is what the engine last said it does. The wish is made once
 * mounted, where reduced motion can be read. */
const wanted = ref(false);
const held = ref(false);
const playing = computed(() => props.autoplay > 0 && wanted.value && !held.value && guess.value > 1);
let running = false;
let hold: ReturnType<typeof holdAutoplay> | undefined;

/* fade is for one slide a page */
const shown = computed(() => (props.effect === "fade" && props.slidesPerPage !== 1 ? "slide" : props.effect));
const r = computed(() => carousel({ draggable: props.mouseDrag, effect: shown.value, autoplay: props.autoplay > 0, playing: playing.value, endless: props.loop === "endless" }));
const translations = computed(() => ({ item: (index: number, count: number) => slides.value[index]?.label ?? `${index + 1} of ${count}` }));

function onPage(next: number) {
  /* a page the engine did not turn by itself was turned by hand: autoplay stops */
  if (props.autoplay > 0 && !running) wanted.value = false;
  page.value = next;
  emit("pageChange", next);
}
function onStatus(isPlaying: boolean) {
  running = isPlaying;
}
function toggle() {
  if (!wanted.value) hold?.release();
  wanted.value = !wanted.value;
}

const group = ref<HTMLElement | null>(null);
const root = () => group.value?.parentElement ?? null;
let stop: (() => void) | undefined;
watch(() => props.autoplay > 0, (on) => {
  hold?.stop();
  hold = on ? holdAutoplay(root(), (h) => { held.value = h; }) : undefined;
  wanted.value = on && !reducedMotion();
});
/* the engine's timer starts over from a full delay: so does the current dot's fill */
watch(playing, (now) => { if (now) restartProgress(root()); }, { flush: "post" });
onMounted(() => {
  trackModality();
  /* how the slides move (carousel.logic.ts): one animator for every page change, the drag (which
     tells the engine its page the moment the slides are let go), and where each slide is, for
     the effects */
  stop = carouselMotion(group.value, {
    page: () => page.value,
    turn: (next) => { if (next >= 0 && next !== page.value) onPage(next); },
    automatic: () => running,
    drag: () => props.mouseDrag,
    loop: () => props.loop,
    reach: () => props.dragReach,
    effect: () => shown.value,
  });
  if (props.autoplay > 0) hold = holdAutoplay(root(), (h) => { held.value = h; });
  wanted.value = props.autoplay > 0 && !reducedMotion();
});
onBeforeUnmount(() => { stop?.(); hold?.stop(); });
</script>

<template>
  <ArkCarousel.Root
    v-bind="attrs"
    data-slot="carousel"
    :class="r.base({ class: attrs.class as string | undefined })"
    :slide-count="slides.length"
    :page="page"
    :slides-per-page="slidesPerPage"
    :spacing="`${spacing}px`"
    :loop="loop !== 'none' || playing"
    :autoplay="playing ? { delay: autoplay } : false"
    :allow-mouse-drag="false"
    :translations="translations"
    @page-change="(d) => onPage(d.page)"
    @autoplay-status-change="(d) => onStatus(d.isPlaying)"
  >
    <!-- the engine's slide group, without its own watch on wheel and touch (carousel.logic.ts names the page) -->
    <ArkCarousel.Context v-slot="api">
      <div v-bind="withoutScrollWatch(api.getItemGroupProps())" ref="group" data-slot="carousel-item-group" :class="r.itemGroup()">
        <ArkCarousel.Item v-for="(slide, index) in slides" :key="index" :index="index" data-slot="carousel-item" :class="r.item({ plain: typeof slide.content === 'string' })">
          <slot name="slide" :item="slide" :index="index">{{ slide.content }}</slot>
        </ArkCarousel.Item>
      </div>
    </ArkCarousel.Context>
    <ArkCarousel.Context v-if="controls || autoplay > 0" v-slot="api">
      <ArkCarousel.Control v-if="pageCount(api.pageSnapPoints.length) > 1" data-slot="carousel-control" :class="r.control()">
        <!-- slides that move by themselves always have a pause control, whatever `controls` hides -->
        <Tooltip v-if="autoplay > 0" :content="wanted ? 'Pause' : 'Play'">
          <Button
            :aria-controls="api.getItemGroupProps().id as string | undefined"
            data-carousel="autoplay"
            :class="r.autoplay()"
            variant="ghost"
            size="sm"
            square
            muted
            :aria-label="wanted ? 'Pause' : 'Play'"
            @click="toggle"
          >
            <template #icon><PhPause v-if="wanted" data-slot="icon" weight="fill" /><PhPlay v-else data-slot="icon" weight="fill" /></template>
          </Button>
        </Tooltip>
        <ArkCarousel.IndicatorGroup v-if="controls && indicators" data-slot="carousel-indicator-group" :class="r.indicatorGroup()" :style="autoplay > 0 ? { '--fndn-carousel-dwell': `${autoplay}ms` } : undefined">
          <!-- one tab stop: the current dot (the arrow keys move between them, focus following) -->
          <ArkCarousel.Indicator v-for="index in pageCount(api.pageSnapPoints.length)" :key="index - 1" :index="index - 1" :tabindex="index - 1 === Math.min(api.page, pageCount(api.pageSnapPoints.length) - 1) ? 0 : -1" data-slot="carousel-indicator" :class="r.indicator()" />
        </ArkCarousel.IndicatorGroup>
        <!-- the pager's buttons page the slide group, as the engine's own triggers would say -->
        <Pager
          v-if="controls"
          data-carousel="pager"
          :class="r.pager()"
          layout="start"
          :count="pageCount(api.pageSnapPoints.length)"
          :page="Math.min(api.page, pageCount(api.pageSnapPoints.length) - 1)"
          :loop="loop !== 'none'"
          :unit="slidesPerPage === 1 ? 'Slide' : 'Page'"
          :label="label"
          :prev-label="slidesPerPage === 1 ? 'Previous slide' : 'Previous page'"
          :next-label="slidesPerPage === 1 ? 'Next slide' : 'Next page'"
          :prev-props="{ 'aria-controls': api.getItemGroupProps().id as string | undefined }"
          :next-props="{ 'aria-controls': api.getItemGroupProps().id as string | undefined }"
          @page-change="(to: number) => api.scrollTo(to)"
        />
      </ArkCarousel.Control>
    </ArkCarousel.Context>
  </ArkCarousel.Root>
</template>
