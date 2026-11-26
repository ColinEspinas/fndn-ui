<script lang="ts">
  import TextB from "phosphor-svelte/lib/TextBIcon";
  import TextItalic from "phosphor-svelte/lib/TextItalicIcon";
  import TextUnderline from "phosphor-svelte/lib/TextUnderlineIcon";
  import { ToggleGroup } from "@fndn/svelte";

  /* several at once: bold, italic and underline apply together */
  const styles = [
    { value: "bold", label: "Bold", icon: TextB },
    { value: "italic", label: "Italic", icon: TextItalic },
    { value: "underline", label: "Underline", icon: TextUnderline },
  ];

  let format = $state<string[]>(["bold"]);
</script>

<div class="flex w-80 flex-col gap-3">
  <ToggleGroup bind:value={format} aria-label="Text style" multiple size="sm" items={styles} />
  <p
    class="text-sm text-ink-2"
    style:font-weight={format.includes("bold") ? 600 : undefined}
    style:font-style={format.includes("italic") ? "italic" : undefined}
    style:text-decoration={format.includes("underline") ? "underline" : undefined}
  >
    Webhook deliveries now retry for up to 24 hours.
  </p>
</div>
