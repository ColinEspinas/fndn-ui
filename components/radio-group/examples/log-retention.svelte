<script lang="ts">
  import { RadioGroup } from "@fndn/svelte";

  /* an option the plan does not include stays in the list, disabled, and says why */
  const retention = [
    { value: "7", label: "7 days" },
    { value: "30", label: "30 days" },
    { value: "365", label: "1 year (Business plan)", disabled: true },
  ];

  let value = $state("30");
</script>

<RadioGroup bind:value name="retention" label="Keep deploy logs for" items={retention} />
