<script lang="ts">
  import { Checkbox } from "@fndn/svelte";
</script>

<!-- disabled: the option is shown so people know it exists, with the reason beside it -->
<div class="flex flex-col gap-1">
  <Checkbox label="Sign in with SAML single sign-on" disabled />
  <p class="ps-6 text-xs text-ink-2">Available on the Business plan.</p>
</div>
