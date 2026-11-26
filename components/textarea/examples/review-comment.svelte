<script lang="ts">
  import { Button, Textarea } from "@fndn/svelte";

  let comment = $state("");
</script>

<!-- starts at three lines and grows a line at a time as you type -->
<div class="flex w-full max-w-80 flex-col gap-2">
  <Textarea
    bind:value={comment}
    aria-label="Comment on #482 Add retry to webhook delivery"
    placeholder="Leave a comment"
  />
  <div class="flex justify-end gap-2">
    <Button size="sm" variant="secondary" onclick={() => (comment = "")}>Cancel</Button>
    <Button size="sm" variant="primary" disabled={comment.trim() === ""}>Comment</Button>
  </div>
</div>
