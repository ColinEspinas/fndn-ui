<script lang="ts">
  import { Textarea } from "@fndn/svelte";

  let notes = $state(
    "Usage alerts: owners get an email at 80% and 100% of the monthly limit.\nWebhook delivery retries up to 5 times with backoff (#482).\nInvoices show the VAT number when one is set.\nThe members page loads 3x faster on large workspaces.\nFixed: preview deploys of forks no longer read production secrets.\nFixed: the CLI kept a stale token after sign-out.\nDeprecated: the v1 deploys endpoint stops on Jan 31, 2027.",
  );
</script>

<!-- a max-height caps the growth; past it the text scrolls -->
<Textarea bind:value={notes} aria-label="Release notes for web-app v2.14" class="max-h-40 w-full max-w-80" />
