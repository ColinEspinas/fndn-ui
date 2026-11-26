<script lang="ts">
  import { RadioGroup } from "@fndn/svelte";

  /* no default when there is no safe guess: nothing is picked until someone chooses */
  const regions = [
    { value: "us-east", label: "US East (Virginia)" },
    { value: "eu-west", label: "EU West (Frankfurt)" },
    { value: "ap-northeast", label: "Asia Pacific (Tokyo)" },
  ];

  let value = $state<string | null>(null);
</script>

<RadioGroup bind:value name="region" label="Region for data-pipeline" items={regions} />
