<script lang="ts">
  import { Field, Input } from "@fndn/svelte";

  let command = $state("pnpm build");
  let output = $state("apps/web/dist");
</script>

<!-- subtle: the grey inset look for dense side panels, where an outline on every field is noise -->
<div class="flex w-full max-w-64 flex-col gap-3">
  <Field label="Build command">
    <Input bind:value={command} size="sm" variant="subtle" mono />
  </Field>
  <Field label="Output directory">
    <Input bind:value={output} size="sm" variant="subtle" mono />
  </Field>
</div>
