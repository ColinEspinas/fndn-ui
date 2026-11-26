<script lang="ts">
  import Sparkle from "phosphor-svelte/lib/SparkleIcon";
  import { Alert } from "@fndn/svelte";
</script>

{#snippet icon()}<Sparkle data-slot="icon" weight="bold" />{/snippet}
<Alert class="w-full max-w-[420px]" tone="accent" {icon} title="New: usage alerts">
  Get an email when a project reaches 80% of its build minutes.
</Alert>
