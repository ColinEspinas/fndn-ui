<script lang="ts">
  import { TagsInput } from "@fndn/svelte";

  /* each label keeps its colour; a new label gets one from its word (tone "auto") */
  const tones = { bug: "red", billing: "purple", webhooks: "cyan" } as const;
  let labels = $state(["bug", "billing", "webhooks"]);
</script>

<TagsInput bind:value={labels} label="Labels" tone="auto" {tones} placeholder="Add a label" style="width: 320px" />
