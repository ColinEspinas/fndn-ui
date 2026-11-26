<script lang="ts">
  import { Field, InputGroup } from "@fndn/svelte";

  let subdomain = $state("feat-usage-alerts");
</script>

<!-- sm and subtle, as in a dense side panel; the addons keep the fixed parts of the URL out of the value -->
<Field label="Preview URL" class="w-full max-w-72">
  <InputGroup bind:value={subdomain} size="sm" variant="subtle" mono start="https://" end=".example.dev" />
</Field>
