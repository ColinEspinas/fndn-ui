import type { HTMLAttributes } from "react";
import { card } from "./card.recipe";

export type CardElevation = "hairline" | "card" | "raised" | "overlay";
export type CardProps = HTMLAttributes<HTMLDivElement> & { elevation?: CardElevation; inset?: boolean };

/** White surface on the hairline ring. */
export function Card({ elevation = "card", inset, className, ...rest }: CardProps) {
  return <div data-slot="card" className={card({ elevation, inset: !!inset }).base({ class: className })} {...rest} />;
}
export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-header" className={card().header({ class: className })} {...rest} />;
}
export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 data-slot="card-title" className={card().title({ class: className })} {...rest} />;
}
export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p data-slot="card-description" className={card().description({ class: className })} {...rest} />;
}
export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-body" className={card().body({ class: className })} {...rest} />;
}
export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-footer" className={card().footer({ class: className })} {...rest} />;
}
