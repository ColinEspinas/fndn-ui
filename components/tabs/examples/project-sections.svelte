<script lang="ts">
  import { Tabs, type TabsItem } from "@fndn/svelte";

  const items: TabsItem[] = [
    { value: "overview", label: "Overview", content: "web-app is live on Production. Last deploy 2 min ago by Maya Chen." },
    { value: "deploys", label: "Deploys", content: "24 deploys in the last 7 days, 1 failed on feat/usage-alerts." },
    { value: "settings", label: "Settings", content: "Build command, environment variables and domains." },
  ];

  let value = $state("overview");
</script>

<Tabs bind:value class="w-80" {items} variant="underline" aria-label="web-app" />
