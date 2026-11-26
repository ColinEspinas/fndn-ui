"use client";
import { RatingGroup } from "@ark-ui/react/rating-group";
import { Star } from "@phosphor-icons/react";
import { forwardRef, useEffect, type CSSProperties } from "react";
import { trackModality } from "../lib/modality";
import { rating } from "./rating.recipe";

export type RatingSize = "sm" | "md";

export type RatingProps = {
  /** Controlled: the score (0 = none; 3.5 with allowHalf), with onValueChange. Omit for uncontrolled (defaultValue). */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Number of stars. */
  count?: number;
  /** Half stars: the first half of a star picks .5. */
  allowHalf?: boolean;
  /** md: 24px cells, 20px stars (default). sm: 18px cells, 14px stars. */
  size?: RatingSize;
  /** Visible label above the stars. */
  label?: string;
  /** Shows the score; it cannot be changed (still focusable and announced). */
  readOnly?: boolean;
  disabled?: boolean;
  /** Form field name. */
  name?: string;
  /** Name of the stars when there is no visible label. */
  "aria-label"?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** A score out of a few stars. Behaviour by Ark UI (Zag rating-group). */
export const Rating = forwardRef<HTMLDivElement, RatingProps>(function Rating(
  { value, defaultValue, onValueChange, count = 5, allowHalf, size = "md", label, readOnly, disabled, name, "aria-label": ariaLabel, className, ...rest },
  ref,
) {
  useEffect(() => trackModality(), []);
  const r = rating({ size, disabled: !!disabled });
  return (
    <RatingGroup.Root
      ref={ref}
      data-slot="rating"
      className={r.base({ class: className })}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (d) => onValueChange(d.value) : undefined}
      count={count}
      allowHalf={allowHalf}
      readOnly={readOnly}
      disabled={disabled}
      name={name}
      {...rest}
    >
      {label && <RatingGroup.Label data-slot="rating-label" className={r.label()}>{label}</RatingGroup.Label>}
      <RatingGroup.Control data-slot="rating-control" className={r.control()} {...(!label && ariaLabel ? { "aria-label": ariaLabel, "aria-labelledby": undefined } : {})}>
        <RatingGroup.Context>
          {(api) =>
            api.items.map((index) => (
              <RatingGroup.Item key={index} index={index} data-slot="rating-item" className={r.item()}>
                <Star data-slot="icon" weight="fill" aria-hidden />
                <Star data-slot="icon" weight="fill" aria-hidden />
              </RatingGroup.Item>
            ))
          }
        </RatingGroup.Context>
      </RatingGroup.Control>
      <RatingGroup.HiddenInput data-slot="rating-hidden-input" />
    </RatingGroup.Root>
  );
});
