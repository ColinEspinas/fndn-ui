import { ArrowUpRight } from "@phosphor-icons/react";
import type { AnchorHTMLAttributes } from "react";
import { link } from "./link.recipe";

export type LinkLabels = { external: string };
export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  /** inline: inside a sentence, always underlined. standalone: on its own, underlined on hover. */
  variant?: "inline" | "standalone";
  /** accent: product text. neutral: quiet text (a hint, a footnote, terms). */
  tone?: "accent" | "neutral";
  /** Opens in a new tab and says so (the arrow, a hidden "(opens in a new tab)"). */
  external?: boolean;
  labels?: Partial<LinkLabels>;
};

/** A link in text or on its own. */
export function Link({ variant = "inline", tone = "accent", external = false, labels, className, children, ...rest }: LinkProps) {
  const r = link({ variant, tone });
  const t: LinkLabels = { external: "(opens in a new tab)", ...labels };
  return (
    <a data-slot="link" className={r.base({ class: className })} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
      {children}
      {external && (
        <span data-slot="link-external" className={r.external()}>
          <ArrowUpRight data-slot="icon" weight="bold" aria-hidden="true" />
          <span className="sr-only">{` ${t.external}`}</span>
        </span>
      )}
    </a>
  );
}
