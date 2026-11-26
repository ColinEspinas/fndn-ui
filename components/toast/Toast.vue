<script lang="ts">
export type ToastTone = "neutral" | "accent" | "green" | "orange" | "red";
export type ToastPlacement = "top-start" | "top" | "top-end" | "bottom-start" | "bottom" | "bottom-end";
export type ToastOptions = {
  /** Reuse an id to replace a toast (toast.update), or to dismiss it later. */
  id?: string;
  title: string;
  description?: string;
  tone?: ToastTone;
  /** A Spinner in place of the icon; it stays until updated or dismissed. */
  loading?: boolean;
  /** One Button after the text; pressing it dismisses the toast. */
  action?: { label: string; value?: string; onClick?: () => void };
  /** The close Button. Default true. */
  closable?: boolean;
  /** Time on screen in ms; 0 keeps it until dismissed. Default: the region's duration. */
  duration?: number;
};

type Op = { type: "create"; options: ToastOptions & { id: string } } | { type: "update"; id: string; options: Partial<ToastOptions> } | { type: "dismiss"; id?: string };
/* the mounted regions; toast() goes to the newest one (an app mounts one; a page of examples
 * mounts several, and a toast must not appear once per region) */
const regions: Array<(op: Op) => void> = [];
const latest = (op: Op) => regions.at(-1)?.(op);
let counter = 0;
const nextId = () => `toast-${++counter}`;

/** Raise a toast in the mounted <Toast /> region (the newest, if there are several); returns its id. */
export const toast = Object.assign(
  (options: ToastOptions): string => {
    const id = options.id ?? nextId();
    latest({ type: "create", options: { ...options, id } });
    return id;
  },
  {
    /** Change a toast in place (a "Saving…" toast that becomes "Saved"). */
    update: (id: string, options: Partial<ToastOptions>) => latest({ type: "update", id, options }),
    /** Dismiss one toast, or every toast without an id. */
    dismiss: (id?: string) => latest({ type: "dismiss", id }),
  },
);
</script>

<script setup lang="ts">
/** The toast region: mount it once; raise toasts with toast(). Behaviour by Ark UI (Zag toast). */
import { Toast as ArkToast, Toaster, createToaster } from "@ark-ui/vue/toast";
import { PhCheckCircle, PhInfo, PhWarning, PhWarningCircle, PhX } from "@phosphor-icons/vue";
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useAttrs, watch } from "vue";
import Button from "../button/Button.vue";
import Spinner from "../spinner/Spinner.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import { afterPaint } from "../lib/paint";
import { trackModality } from "../lib/modality";
import { toast as recipe } from "./toast.recipe";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** The corner the toasts arrive in. Default bottom-end. */
    placement?: ToastPlacement;
    /** Toasts shown at once; the rest wait. Default 3. */
    max?: number;
    /** Default time on screen in ms. Default 5000. */
    duration?: number;
    /** Older toasts tuck behind the newest one. Default false. */
    overlap?: boolean;
    /** Toasts raised when the region mounts. */
    toasts?: ReadonlyArray<ToastOptions>;
  }>(),
  { placement: "bottom-end", max: 3, duration: 5000, overlap: false },
);
/** action: an action Button was pressed. dismiss: a toast left (timed out, closed, Escape, toast.dismiss). */
const emit = defineEmits<{ action: [value: string, id: string]; dismiss: [id: string] }>();

const ICONS = { accent: PhInfo, green: PhCheckCircle, orange: PhWarning, red: PhWarningCircle } as const;
const TYPES = { neutral: "info", accent: "info", green: "success", orange: "warning", red: "error" } as const;
type Meta = { tone: ToastTone; loading: boolean; actionValue?: string };

/* removeDelay = the exit's duration.base: the toasts that stay close the gap as the exit ends,
 * with no empty slot in between */
const make = () => createToaster({ placement: props.placement, max: props.max, duration: props.duration, overlap: props.overlap, gap: 8, offsets: "16px", removeDelay: 150 });
const store = shallowRef(make());
/* a new store (placement, max, duration or overlap changed) gets a new group */
const generation = ref(0);

/* toasts that are there on first paint do not slide in */
const ready = ref(false);
const group = ref<{ $el: HTMLElement } | null>(null);

const toArk = (o: Partial<ToastOptions>) => {
  const tone = o.tone ?? "neutral";
  return {
    ...(o.title !== undefined ? { title: o.title } : {}),
    ...(o.description !== undefined ? { description: o.description } : {}),
    type: o.loading ? ("loading" as const) : TYPES[tone],
    ...(o.duration !== undefined ? { duration: o.duration === 0 ? Infinity : o.duration } : {}),
    closable: o.closable ?? true,
    ...(o.action ? { action: { label: o.action.label, onClick: () => o.action?.onClick?.() } } : {}),
    meta: { tone, loading: !!o.loading, actionValue: o.action ? (o.action.value ?? o.action.label) : undefined } satisfies Meta,
  };
};

let disconnect = () => {};
function connect() {
  const current = store.value;
  const send = (op: Op) => {
    if (op.type === "create") {
      const id = op.options.id;
      current.create({
        id,
        ...toArk(op.options),
        onStatusChange: (details) => { if (details.status === "dismissing") emit("dismiss", id); },
      });
    } else if (op.type === "update") current.update(op.id, toArk(op.options));
    else current.dismiss(op.id);
  };
  regions.push(send);
  /* the group machine subscribes to the store when it mounts: raise the first toasts after it,
   * and only then count the region as painted, so those toasts do not slide in */
  let cancelReady = () => {};
  const frame = requestAnimationFrame(() => {
    for (const t of props.toasts ?? []) send({ type: "create", options: { ...t, id: t.id ?? nextId() } });
    /* the engine places a toast (data-mounted) a few frames after it is raised */
    /* and measures their heights, then offsets them: wait until their placement stops changing */
    let last = "";
    const settled = () => {
      const el = group.value?.$el;
      const items = el ? [...el.querySelectorAll<HTMLElement>("[data-slot=toast-item]")] : [];
      const now = items.map((item) => `${item.hasAttribute("data-mounted")}${item.style.cssText}`).join("|");
      const done = items.length >= Math.min(props.toasts?.length ?? 0, props.max) && now === last && items.every((item) => item.hasAttribute("data-mounted"));
      last = now;
      cancelReady = done ? afterPaint(() => { ready.value = true; }) : afterPaint(settled);
    };
    settled();
  });
  disconnect = () => { cancelAnimationFrame(frame); cancelReady(); regions.splice(regions.indexOf(send), 1); current.remove(); };
}

onMounted(() => {
  trackModality();
  connect();
});
watch(
  () => [props.placement, props.max, props.duration, props.overlap],
  () => {
    disconnect();
    ready.value = false;
    store.value = make();
    generation.value++;
    connect();
  },
);
onBeforeUnmount(() => disconnect());

const r = recipe();
const meta = (t: { meta?: Record<string, unknown> }) => (t.meta ?? { tone: "neutral", loading: false }) as Meta;
const parts = computed(() => (tone: ToastTone) => recipe({ tone, ready: ready.value }));
</script>

<template>
  <Toaster :key="generation" ref="group" :toaster="store" v-bind="attrs" data-slot="toast" :class="r.base({ class: attrs.class as string | undefined })" v-slot="t">
    <ArkToast.Root :key="t.id" data-slot="toast-item" :class="parts(meta(t).tone).item()">
      <span v-if="meta(t).loading" data-slot="toast-icon" :class="parts(meta(t).tone).icon()" aria-hidden="true"><Spinner size="sm" decorative /></span>
      <span v-else-if="meta(t).tone !== 'neutral'" data-slot="toast-icon" :class="parts(meta(t).tone).icon()" aria-hidden="true">
        <component :is="ICONS[meta(t).tone as Exclude<ToastTone, 'neutral'>]" data-slot="icon" weight="bold" />
      </span>
      <div data-slot="toast-content" :class="parts(meta(t).tone).content()">
        <ArkToast.Title data-slot="toast-title" :class="parts(meta(t).tone).title()">{{ t.title }}</ArkToast.Title>
        <ArkToast.Description v-if="t.description" data-slot="toast-description" :class="parts(meta(t).tone).description()">{{ t.description }}</ArkToast.Description>
      </div>
      <ArkToast.ActionTrigger v-if="t.action" as-child>
        <Button data-toast="action" :class="parts(meta(t).tone).action()" size="sm" @click="emit('action', meta(t).actionValue ?? t.action!.label, t.id!)">{{ t.action.label }}</Button>
      </ArkToast.ActionTrigger>
      <!-- the close trigger owns the button (its data-scope and data-part); the tooltip adds itself -->
      <ArkToast.CloseTrigger v-if="t.closable !== false" as-child>
        <Tooltip content="Dismiss">
          <Button data-toast="close" :class="parts(meta(t).tone).close()" variant="ghost" size="xs" shape="rounded" square muted aria-label="Dismiss notification">
            <template #icon><PhX data-slot="icon" weight="bold" /></template>
          </Button>
        </Tooltip>
      </ArkToast.CloseTrigger>
    </ArkToast.Root>
  </Toaster>
</template>
