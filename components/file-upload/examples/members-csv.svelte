<script lang="ts">
  import { FileUpload } from "@fndn/svelte";
</script>

<!-- no label: the title names the drop zone; accept and maxFileSize reject the wrong file before it uploads -->
<FileUpload
  class="w-full max-w-80"
  title="Import members from a CSV"
  hint="Drop it here or click to choose · up to 2 MB"
  accept={["text/csv"]}
  maxFileSize={2_000_000}
/>
