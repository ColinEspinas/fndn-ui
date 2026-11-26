<script lang="ts">
  import { Steps, type StepsItem } from "@fndn/svelte";

  /* read-only progress: linear, so the markers are not pressable; step says where the deploy is */
  const items: StepsItem[] = [
    { title: "Queued", description: "10:42:01" },
    { title: "Building", description: "47s" },
    { title: "Running checks", description: "2 of 3 passed" },
    { title: "Live on Production" },
  ];
</script>

<Steps class="w-72" orientation="vertical" linear step={2} {items} />
