<script lang="ts">
  import { ChatComposer } from "@fndn/svelte";

  let tabs = $state([
    {
      value: "new",
      label: "New chat",
    },
  ]);

  let value = $state("Draft a reply to Brightline Dental about the double-booked Tuesday slots");

  const suggestions = ["Summarize today's tickets", "Find accounts at risk"];
</script>

<ChatComposer
  bind:tabs={tabs}
  bind:value={value}
  suggestions={suggestions}
  style="width: 380px"
/>
