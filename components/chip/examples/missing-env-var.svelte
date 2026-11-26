<script lang="ts">
  import { Chip } from "@fndn/svelte";
</script>

<p class="max-w-[300px] text-md text-ink">
  The build of web-app stopped: <Chip>DATABASE_URL</Chip> is not set in Production. Add it in Settings, then run <Chip>pnpm build</Chip> again.
</p>
