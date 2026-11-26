<script lang="ts">
  import { Message } from "@fndn/svelte";
</script>

<!-- streaming with nothing yet: aria-busy and a shimmering "Thinking…"; actions wait for the answer -->
<div class="w-80">
  <Message role="assistant" name="Assistant" avatar streaming actions={["copy", "retry"]} />
</div>
