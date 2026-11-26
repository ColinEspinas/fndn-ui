<!-- A link in text or on its own. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import ArrowUpRight from "phosphor-svelte/lib/ArrowUpRightIcon";
  import { link } from "./link.recipe";

  export type LinkLabels = { external: string };
  type Props = HTMLAnchorAttributes & {
    /** inline: inside a sentence, always underlined. standalone: on its own, underlined on hover. */
    variant?: "inline" | "standalone";
    /** accent: product text. neutral: quiet text (a hint, a footnote, terms). */
    tone?: "accent" | "neutral";
    /** Opens in a new tab and says so (the arrow, a hidden "(opens in a new tab)"). */
    external?: boolean;
    labels?: Partial<LinkLabels>;
    children?: Snippet;
  };

  let { variant = "inline", tone = "accent", external = false, labels, class: className, children, ...rest }: Props = $props();

  const r = $derived(link({ variant, tone }));
  const t = $derived<LinkLabels>({ external: "(opens in a new tab)", ...labels });
</script>

<a data-slot="link" class={r.base({ class: className as string | undefined })} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>{@render children?.()}{#if external}<span data-slot="link-external" class={r.external()}><ArrowUpRight data-slot="icon" weight="bold" aria-hidden="true" /><span class="sr-only">{` ${t.external}`}</span></span>{/if}</a>
