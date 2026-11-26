<script lang="ts">
  import { FileUpload, type FileUploadFile } from "@fndn/svelte";

  let files = $state<ReadonlyArray<FileUploadFile>>([
    { name: "INV-2024-0117.pdf", size: 182_000, type: "application/pdf" },
    { name: "deploy-log-dpl_7f3a9c-billing-api-production.txt", size: 48_200, type: "text/plain" },
  ]);
</script>

<!-- controlled: files already attached to the ticket are listed and can be removed -->
<div class="flex w-full max-w-sm flex-col gap-2">
  <FileUpload bind:files label="Attachments" maxFiles={3} />
  <p class="m-0 text-xs text-ink-2">{files.length} of 3 files</p>
</div>
