<script lang="ts">
  import Tag from "phosphor-svelte/lib/TagIcon";
  import { Combobox } from "@fndn/svelte";

  /* allowCustomValue: Enter on a name no label has keeps it; the handler adds it to the list */
  let labels = $state(["bug", "feature", "docs", "performance", "good first issue"]);
  let label = $state<string | null>(null);
  function choose(next: string | null) {
    if (next && !labels.includes(next)) labels = [...labels, next];
    label = next;
  }
</script>

<Combobox
  items={labels}
  value={label}
  onvaluechange={choose}
  allowCustomValue
  label="Label"
  placeholder="Find or create a label"
  emptyText="No such label: press Enter to create it"
  style="width: 260px"
>
  {#snippet start()}<Tag data-slot="icon" weight="bold" />{/snippet}
</Combobox>
