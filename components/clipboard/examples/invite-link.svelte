<script lang="ts">
  import { Clipboard } from "@fndn/svelte";
</script>

<!-- sm (28px) field, for a share popover or a dense settings row -->
<div class="flex w-80 flex-col gap-1.5">
  <Clipboard variant="field" size="sm" label="Invite link" value="https://northwind.example/join/8kd2q71x" />
  <p class="text-xs text-ink-2">Anyone with the link joins Northwind as a viewer until Nov 21, 2026.</p>
</div>
