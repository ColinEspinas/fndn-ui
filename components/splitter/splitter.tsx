"use client";
import { Splitter as ArkSplitter } from "@ark-ui/react/splitter";
import { DotsSixVertical } from "@phosphor-icons/react";
import { Fragment, forwardRef, useEffect, type CSSProperties, type ReactNode } from "react";
import { trackModality } from "../lib/modality";
import { splitter } from "./splitter.recipe";

export type SplitterOrientation = "horizontal" | "vertical";

export type SplitterPanel = {
  id: string;
  /** What the panel shows. A string is padded text. */
  content?: ReactNode;
  /** Percent. */
  minSize?: number;
  /** Percent. */
  maxSize?: number;
  collapsible?: boolean;
  /** Percent, when collapsible (default 0). */
  collapsedSize?: number;
};

export type SplitterProps = {
  /** The panels in order, with their limits. Every pair gets a handle. */
  panels: ReadonlyArray<SplitterPanel>;
  /** Controlled: one percentage per panel, with onSizeChange. Omit for uncontrolled (defaultSize). */
  size?: number[];
  defaultSize?: number[];
  /** While dragging and on every key. */
  onSizeChange?: (size: number[]) => void;
  /** When a drag or a key press ends. */
  onSizeChangeEnd?: (size: number[]) => void;
  /** horizontal: side by side (default). vertical: stacked. */
  orientation?: SplitterOrientation;
  /** Show a grip on every handle. */
  grip?: boolean;
  /** Percent an arrow key moves a handle (Shift: 10). */
  keyboardStep?: number;
  /** Accessible name of every handle. */
  handleLabel?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** Panels with a handle between each pair that resizes them. Behaviour by Ark UI (Zag splitter). */
export const Splitter = forwardRef<HTMLDivElement, SplitterProps>(function Splitter(
  { panels, size, defaultSize, onSizeChange, onSizeChangeEnd, orientation = "horizontal", grip, keyboardStep = 1, handleLabel = "Resize", className, ...rest },
  ref,
) {
  useEffect(() => trackModality(), []);
  const r = splitter({ orientation });
  /* without sizes the panels share the room equally */
  const initial = size === undefined ? (defaultSize ?? panels.map(() => 100 / Math.max(1, panels.length))) : undefined;
  return (
    <ArkSplitter.Root
      ref={ref}
      data-slot="splitter"
      className={r.base({ class: className })}
      orientation={orientation}
      panels={panels.map(({ id, minSize, maxSize, collapsible, collapsedSize }) => ({ id, minSize, maxSize, collapsible, collapsedSize }))}
      size={size}
      defaultSize={initial}
      keyboardResizeBy={keyboardStep}
      onResize={onSizeChange ? (d) => onSizeChange(d.size) : undefined}
      onResizeEnd={onSizeChangeEnd ? (d) => onSizeChangeEnd(d.size) : undefined}
      {...rest}
    >
      <ArkSplitter.Context>
      {(api) => panels.map((panel, index) => {
        const next = panels[index + 1];
        /* a panel that starts collapsed: before the engine has resolved its sizes (React renders a
         * frame before it does) it would keep its minSize as min-width, so the first frames would lay
         * it out at that minimum and then snap shut. While its size is the collapsed one, its minimum
         * is the collapsed size, as the engine itself gives it once resolved */
        const at = (size ?? api.getSizes())[index];
        const shut = panel.collapsible && at != null && Math.abs(at - (panel.collapsedSize ?? 0)) < 0.01;
        return (
          <Fragment key={panel.id}>
            <ArkSplitter.Panel id={panel.id} data-slot="splitter-panel" className={r.panel()}
              style={shut ? { [orientation === "horizontal" ? "minWidth" : "minHeight"]: `${panel.collapsedSize ?? 0}%` } : undefined}
            >
              {typeof panel.content === "string" ? <p data-slot="splitter-text" className={r.text()}>{panel.content}</p> : panel.content}
            </ArkSplitter.Panel>
            {next && (
              <ArkSplitter.ResizeTrigger id={`${panel.id}:${next.id}`} data-slot="splitter-handle" className={r.handle()} aria-label={handleLabel}>
                {grip && (
                  <ArkSplitter.ResizeTriggerIndicator data-slot="splitter-grip" className={r.grip()} aria-hidden>
                    <DotsSixVertical data-slot="icon" weight="bold" />
                  </ArkSplitter.ResizeTriggerIndicator>
                )}
              </ArkSplitter.ResizeTrigger>
            )}
          </Fragment>
        );
      })}
      </ArkSplitter.Context>
    </ArkSplitter.Root>
  );
});
