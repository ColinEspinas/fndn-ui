"use client";
import { Toast as ArkToast, Toaster, createToaster } from "@ark-ui/react/toast";
import { CheckCircle, Info, Warning, WarningCircle, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Button } from "../button/button";
import { Spinner } from "../spinner/spinner";
import { Tooltip } from "../tooltip/tooltip";
import { afterPaint } from "../lib/paint";
import { trackModality } from "../lib/modality";
import { toast as recipe } from "./toast.recipe";

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

/** Raise a toast in the mounted <Toast /> region (the newest, if there are several); returns its id. */
export const toast = Object.assign(
  (options: ToastOptions): string => {
    const id = options.id ?? `toast-${++counter}`;
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

export type ToastProps = {
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
  onAction?: (value: string, id: string) => void;
  /** A toast left (timed out, closed, Escape, toast.dismiss). */
  onDismiss?: (id: string) => void;
  className?: string;
  style?: CSSProperties;
  [data: `data-${string}`]: string | undefined;
};

const ICONS = { accent: Info, green: CheckCircle, orange: Warning, red: WarningCircle } as const;
const TYPES = { neutral: "info", accent: "info", green: "success", orange: "warning", red: "error" } as const;
type Meta = { tone: ToastTone; loading: boolean; actionValue?: string };

/** The toast region: mount it once; raise toasts with toast(). Behaviour by Ark UI (Zag toast). */
export function Toast({ placement = "bottom-end", max = 3, duration = 5000, overlap = false, toasts, onAction, onDismiss, className, style, ...data }: ToastProps) {
  const store = useMemo(() => createToaster({ placement, max, duration, overlap, gap: 8, offsets: "16px", removeDelay: 150 }), [placement, max, duration, overlap]);
  const handlers = useRef({ onAction, onDismiss });
  handlers.current = { onAction, onDismiss };

  /* removeDelay = the exit's duration.base: the toasts that stay close the gap as the exit ends,
   * with no empty slot in between */
  /* toasts that are there on first paint do not slide in */
  const [ready, setReady] = useState(false);
  const group = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    trackModality();
    const send = (op: Op) => {
      if (op.type === "create") {
        const id = op.options.id;
        store.create({
          id,
          ...toArk(op.options),
          onStatusChange: (details) => { if (details.status === "dismissing") handlers.current.onDismiss?.(id); },
        });
      } else if (op.type === "update") store.update(op.id, toArk(op.options));
      else store.dismiss(op.id);
    };
    regions.push(send);
    /* the group machine subscribes to the store in its own effect: raise the first toasts after it,
     * and only then count the region as painted, so those toasts do not slide in */
    let cancelReady = () => {};
    const frame = requestAnimationFrame(() => {
      for (const t of toasts ?? []) send({ type: "create", options: { ...t, id: t.id ?? `toast-${++counter}` } });
      /* the engine places a toast (data-mounted) a few frames after it is raised */
      /* and measures their heights, then offsets them: wait until their placement stops changing */
      let last = "";
      const settled = () => {
        const items = group.current ? [...group.current.querySelectorAll<HTMLElement>("[data-slot=toast-item]")] : [];
        const now = items.map((item) => `${item.hasAttribute("data-mounted")}${item.style.cssText}`).join("|");
        const done = items.length >= Math.min(toasts?.length ?? 0, max) && now === last && items.every((item) => item.hasAttribute("data-mounted"));
        last = now;
        cancelReady = done ? afterPaint(() => setReady(true)) : afterPaint(settled);
      };
      settled();
    });
    return () => { cancelAnimationFrame(frame); cancelReady(); regions.splice(regions.indexOf(send), 1); store.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const r = recipe();
  return (
    <Toaster ref={group} toaster={store} {...data} data-slot="toast" className={r.base({ class: className })} style={style}>
      {(t) => {
        const meta = (t.meta ?? { tone: "neutral", loading: false }) as Meta;
        const s = recipe({ tone: meta.tone, ready });
        const Glyph = meta.tone === "neutral" ? null : ICONS[meta.tone];
        return (
          <ArkToast.Root key={t.id} data-slot="toast-item" className={s.item()}>
            {meta.loading ? (
              <span data-slot="toast-icon" className={s.icon()} aria-hidden><Spinner size="sm" decorative /></span>
            ) : Glyph ? (
              <span data-slot="toast-icon" className={s.icon()} aria-hidden><Glyph data-slot="icon" weight="bold" /></span>
            ) : null}
            <div data-slot="toast-content" className={s.content()}>
              <ArkToast.Title data-slot="toast-title" className={s.title()}>{t.title}</ArkToast.Title>
              {t.description && <ArkToast.Description data-slot="toast-description" className={s.description()}>{t.description}</ArkToast.Description>}
            </div>
            {t.action && (
              <ArkToast.ActionTrigger asChild>
                <Button data-toast="action" className={s.action()} size="sm" onClick={() => handlers.current.onAction?.(meta.actionValue ?? t.action!.label, t.id!)}>
                  {t.action.label}
                </Button>
              </ArkToast.ActionTrigger>
            )}
            {t.closable !== false && (
              <ArkToast.CloseTrigger asChild>
                <Tooltip content="Dismiss">
                  <Button data-toast="close" className={s.close()} variant="ghost" size="xs" shape="rounded" square muted aria-label="Dismiss notification" icon={<X data-slot="icon" weight="bold" />} />
                </Tooltip>
              </ArkToast.CloseTrigger>
            )}
          </ArkToast.Root>
        );
      }}
    </Toaster>
  );
}
