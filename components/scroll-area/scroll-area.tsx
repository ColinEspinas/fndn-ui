"use client";
import { ScrollArea as ArkScrollArea } from "@ark-ui/react/scroll-area";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { scrollArea } from "./scroll-area.recipe";

export type ScrollAreaOrientation = "vertical" | "horizontal" | "both";

export type ScrollAreaProps = Omit<HTMLAttributes<HTMLDivElement>, "dir"> & {
  /** Which scrollbars it draws (the viewport scrolls whichever way its content overflows). */
  orientation?: ScrollAreaOrientation;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/** A region that scrolls with a thin overlay scrollbar. Behaviour by Ark UI (Zag scroll-area). */
export function ScrollArea({ orientation = "vertical", className, children, ...rest }: ScrollAreaProps) {
  const r = scrollArea({ orientation });
  const bars = orientation === "both" ? (["vertical", "horizontal"] as const) : ([orientation] as const);
  return (
    <ArkScrollArea.Root data-slot="scroll-area" className={r.base({ class: className })} {...rest}>
      <ArkScrollArea.Viewport data-slot="scroll-area-viewport" className={r.viewport()}>
        <ArkScrollArea.Content data-slot="scroll-area-content" className={r.content() || undefined}>{children}</ArkScrollArea.Content>
      </ArkScrollArea.Viewport>
      {bars.map((o) => (
        <ArkScrollArea.Scrollbar key={o} orientation={o} data-slot="scroll-area-scrollbar" className={r.scrollbar()}>
          <ArkScrollArea.Thumb data-slot="scroll-area-thumb" className={r.thumb()} />
        </ArkScrollArea.Scrollbar>
      ))}
      {orientation === "both" && <ArkScrollArea.Corner data-slot="scroll-area-corner" className={r.corner()} />}
    </ArkScrollArea.Root>
  );
}
