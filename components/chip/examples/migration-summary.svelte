<script lang="ts">
  import { Chip } from "@fndn/svelte";
</script>

<!-- green added, orange changed, red removed -->
<p class="max-w-[300px] text-md text-ink">
  This migration adds <Chip tone="green">retry_count</Chip>, renames <Chip tone="orange">sent_at</Chip> to <Chip tone="orange">delivered_at</Chip> and drops <Chip tone="red">legacy_status</Chip> from <Chip>webhooks</Chip>.
</p>
