<script lang="ts">
  import { Field, Input } from "@fndn/svelte";
</script>

<!-- a disabled Field fades its label and control together; the helper says why -->
<Field label="Workspace URL" helper="Only owners can change the workspace URL." disabled class="w-full max-w-80">
  <Input value="northwind" />
</Field>
