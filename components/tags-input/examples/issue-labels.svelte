<script lang="ts">
  import { TagsInput } from "@fndn/svelte";

  /* an issue's labels in the outline look: neutral tags, the colour only in the dot, as the issue list shows them */
  const tones = { bug: "red", regression: "orange", billing: "purple", webhooks: "cyan" } as const;
  let labels = $state(["bug", "regression", "billing"]);
</script>

<TagsInput bind:value={labels} label="Labels" tagVariant="outline" tone="auto" {tones} placeholder="Add a label" style="width: 320px" />
