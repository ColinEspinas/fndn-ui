<!-- Monogram + name in a soft field pill. -->
<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import Avatar from "../avatar/Avatar.svelte";
  import { entityChip } from "./entity-chip.recipe";

  type Props = HTMLAttributes<HTMLSpanElement> & {
    name: string;
    /** Any CSS color for the monogram (our avatar); defaults to the orange token. */
    color?: string;
    /** Glyph in the disc; defaults to the first character of name. */
    monogram?: string;
  };
  let { name, color, monogram, class: className, ...rest }: Props = $props();
  const r = entityChip();

  /** First grapheme of a name, upper-cased: "jo" → "J", "🚀 Launch" → "🚀", "élan" → "É". */
  function initial(value: string): string {
    const text = value.trim();
    if (!text) return "";
    const first =
      typeof Intl !== "undefined" && "Segmenter" in Intl
        ? new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)[Symbol.iterator]().next().value?.segment
        : Array.from(text)[0];
    return (first ?? "").toLocaleUpperCase();
  }
  const glyph = $derived(monogram ?? initial(name));
</script>

<span data-slot="entity-chip" class={r.base({ class: className as string | undefined })} title={name} {...rest}>
  <Avatar initials={glyph} size={16} shape="round" {color} />
  <span data-slot="entity-chip-name" class={r.name()}>{name}</span>
</span>
