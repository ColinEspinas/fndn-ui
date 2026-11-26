<!-- The toast region: mount it once; raise toasts with toast(). Behaviour by Ark UI (Zag toast). -->
<script module lang="ts">
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

<script lang="ts">
  import { Toast as ArkToast, Toaster, createToaster } from "@ark-ui/svelte/toast";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import CheckCircle from "phosphor-svelte/lib/CheckCircleIcon";
  import Info from "phosphor-svelte/lib/InfoIcon";
  import Warning from "phosphor-svelte/lib/WarningIcon";
  import WarningCircle from "phosphor-svelte/lib/WarningCircleIcon";
  import X from "phosphor-svelte/lib/XIcon";
  import Button from "../button/Button.svelte";
  import Spinner from "../spinner/Spinner.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { untrack } from "svelte";
  import { afterPaint } from "../lib/paint";
  import { trackModality } from "../lib/modality";
  import { toast as recipe } from "./toast.recipe";

  type Props = {
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
    /** An action Button was pressed. */
    onaction?: (value: string, id: string) => void;
    /** A toast left (timed out, closed, Escape, toast.dismiss). */
    ondismiss?: (id: string) => void;
    class?: string;
    style?: string;
    [data: `data-${string}`]: string | undefined;
  };

  let { placement = "bottom-end", max = 3, duration = 5000, overlap = false, toasts, onaction, ondismiss, class: className, style, ...data }: Props = $props();

  const ICONS = { accent: Info, green: CheckCircle, orange: Warning, red: WarningCircle } as const;
  const TYPES = { neutral: "info", accent: "info", green: "success", orange: "warning", red: "error" } as const;
  type Meta = { tone: ToastTone; loading: boolean; actionValue?: string };

  /* removeDelay = the exit's duration.base: the toasts that stay close the gap as the exit ends,
   * with no empty slot in between */
  const store = $derived(createToaster({ placement, max, duration, overlap, gap: 8, offsets: "16px", removeDelay: 150 }));

  /* toasts that are there on first paint do not slide in */
  let ready = $state(false);
  let group = $state<HTMLElement | null>(null);

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

  $effect(() => trackModality());
  $effect(() => {
    const current = store;
    ready = false;
    const send = (op: Op) => {
      if (op.type === "create") {
        const id = op.options.id;
        current.create({
          id,
          ...toArk(op.options),
          onStatusChange: (details) => { if (details.status === "dismissing") ondismiss?.(id); },
        });
      } else if (op.type === "update") current.update(op.id, toArk(op.options));
      else current.dismiss(op.id);
    };
    regions.push(send);
    /* the group machine subscribes to the store when it mounts: raise the first toasts after it,
     * and only then count the region as painted, so those toasts do not slide in */
    let cancelReady = () => {};
    const initial = untrack(() => toasts) ?? [];
    const frame = requestAnimationFrame(() => {
      for (const t of initial) send({ type: "create", options: { ...t, id: t.id ?? nextId() } });
      /* the engine places a toast (data-mounted) a few frames after it is raised */
      /* and measures their heights, then offsets them: wait until their placement stops changing */
      let last = "";
      const settled = () => {
        const items = group ? [...group.querySelectorAll<HTMLElement>("[data-slot=toast-item]")] : [];
        const now = items.map((item) => `${item.hasAttribute("data-mounted")}${item.style.cssText}`).join("|");
        const done = items.length >= Math.min(initial.length, max) && now === last && items.every((item) => item.hasAttribute("data-mounted"));
        last = now;
        cancelReady = done ? afterPaint(() => { ready = true; }) : afterPaint(settled);
      };
      settled();
    });
    return () => { cancelAnimationFrame(frame); cancelReady(); regions.splice(regions.indexOf(send), 1); current.remove(); };
  });

  const r = recipe();
  const metaOf = (t: { meta?: Record<string, unknown> }) => (t.meta ?? { tone: "neutral", loading: false }) as Meta;
</script>

{#key store}
  <Toaster bind:ref={group} toaster={store} {...data} data-slot="toast" class={r.base({ class: className })} {style}>
    {#snippet children(toastFn)}
      {@const t = toastFn()}
      {@const meta = metaOf(t)}
      {@const s = recipe({ tone: meta.tone, ready })}
      {@const Glyph = meta.tone === "neutral" ? null : ICONS[meta.tone]}
      <ArkToast.Root data-slot="toast-item" class={s.item()}>
        {#if meta.loading}
          <span data-slot="toast-icon" class={s.icon()} aria-hidden="true"><Spinner size="sm" decorative /></span>
        {:else if Glyph}
          <span data-slot="toast-icon" class={s.icon()} aria-hidden="true"><Glyph data-slot="icon" weight="bold" /></span>
        {/if}
        <div data-slot="toast-content" class={s.content()}>
          <ArkToast.Title data-slot="toast-title" class={s.title()}>{t.title}</ArkToast.Title>
          {#if t.description}<ArkToast.Description data-slot="toast-description" class={s.description()}>{t.description}</ArkToast.Description>{/if}
        </div>
        {#if t.action}
          {@const label = t.action.label}
          <ArkToast.ActionTrigger>
            {#snippet asChild(props)}
              <Button {...mergeProps(props(), { onclick: () => onaction?.(meta.actionValue ?? label, t.id!) })} data-toast="action" class={s.action()} size="sm">{label}</Button>
            {/snippet}
          </ArkToast.ActionTrigger>
        {/if}
        {#if t.closable !== false}
          <!-- the close trigger owns the button (its data-scope and data-part); the tooltip adds itself -->
          {#snippet closeIcon()}<X data-slot="icon" weight="bold" />{/snippet}
          <ArkToast.CloseTrigger>
            {#snippet asChild(closeProps)}
              <Tooltip content="Dismiss" triggerId={closeProps().id ?? undefined}>
                {#snippet trigger(tip)}
                  <Button {...mergeProps(tip(), closeProps())} data-toast="close" class={s.close()} variant="ghost" size="xs" shape="rounded" square muted aria-label="Dismiss notification" icon={closeIcon} />
                {/snippet}
              </Tooltip>
            {/snippet}
          </ArkToast.CloseTrigger>
        {/if}
      </ArkToast.Root>
    {/snippet}
  </Toaster>
{/key}
