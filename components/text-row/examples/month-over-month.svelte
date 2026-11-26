<script lang="ts">
  import { TextRow } from "@fndn/svelte";
</script>

<!-- the note says what the value is compared with -->
<div class="flex w-80 flex-col">
  <TextRow label="Deploys" value="1,284" meta="+18% vs October" />
  <TextRow label="Median build time" value="48s" meta="−6s vs October" />
  <TextRow label="Failed deploys" value="3.1%" meta="+0.4 pts" />
</div>
