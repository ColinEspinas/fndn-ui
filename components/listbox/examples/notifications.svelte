<script lang="ts">
  import { Listbox } from "@fndn/svelte";

  const events = [
    { value: "deploy-failed", label: "A deploy fails" },
    { value: "deploy-ready", label: "A production deploy is ready" },
    { value: "review", label: "Someone requests my review" },
    { value: "invoice", label: "An invoice is paid" },
    { value: "seats", label: "The workspace runs out of seats" },
  ];

  let picked = $state(["deploy-failed", "review"]);
</script>

<Listbox items={events} bind:value={picked} label="Email me when" selectionMode="multiple" style="width: 280px" />
