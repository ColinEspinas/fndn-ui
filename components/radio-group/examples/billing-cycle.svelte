<script lang="ts">
  import { RadioGroup } from "@fndn/svelte";

  /* horizontal: two or three short options in a row */
  const cycles = [
    { value: "monthly", label: "Monthly · $24 per seat" },
    { value: "yearly", label: "Yearly · $19 per seat" },
  ];

  let value = $state("yearly");
</script>

<RadioGroup bind:value name="cycle" label="Billing cycle" orientation="horizontal" items={cycles} />
