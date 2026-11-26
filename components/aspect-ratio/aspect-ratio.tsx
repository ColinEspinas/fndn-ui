import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { aspectRatio } from "./aspect-ratio.recipe";

export type AspectRatioProps = HTMLAttributes<HTMLDivElement> & {
  /** Width divided by height: 16 / 9 (default), 1, 4 / 3, 0.75 … Not a positive number: 16 / 9. */
  ratio?: number;
};

/** A box that keeps a width-to-height ratio. */
export const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(function AspectRatio(
  { ratio = 16 / 9, className, style, ...rest },
  ref,
) {
  const value = Number.isFinite(ratio) && ratio > 0 ? ratio : 16 / 9;
  return (
    <div
      ref={ref}
      data-slot="aspect-ratio"
      className={aspectRatio({ class: className })}
      style={{ "--fndn-aspect-ratio": value, ...style } as CSSProperties}
      {...rest}
    />
  );
});
