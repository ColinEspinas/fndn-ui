<script lang="ts">
  import { ChatComposer } from "@fndn/svelte";

  let tabs = $state([
    {
      value: "incident",
      label: "API latency",
      messages: [
        {
          role: "user",
          text: "p95 latency on harbor/api doubled at 09:40. What changed?",
        },
      ],
    },
    {
      value: "deploy-482",
      label: "Deploy #482",
    },
  ]);

  let tab = $state("incident");

  const suggestions = ["Compare with yesterday", "Open the dashboard"];
</script>

<ChatComposer
  bind:tabs={tabs}
  bind:tab={tab}
  busy
  status="Reading the request logs"
  suggestions={suggestions}
  style="width: 380px"
/>
