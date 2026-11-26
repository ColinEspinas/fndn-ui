<script lang="ts">
  import { FineTuneCard } from "@fndn/svelte";

  const fields = [
    { key: "width", label: "W", value: 320, min: 200, max: 640 },
    { key: "height", label: "H", value: 440, min: 240, max: 960 },
    { key: "radius", label: "Radius", value: 16, min: 0, max: 48 },
    { key: "gap", label: "Gap", value: 24, min: 0, max: 64 },
  ];

  const plans = ["Starter", "Team", "Business"];

  const labels = { title: "Pricing card", type: "Plan", placeholder: "Select plan" };

  let layout = $state("grid");

  let values = $state({ width: 360, radius: 12 });

  let type = $state("Business");
</script>

<FineTuneCard
  fields={fields}
  types={plans}
  labels={labels}
  bind:layout={layout}
  bind:values={values}
  bind:type={type}
/>
