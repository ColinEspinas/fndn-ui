<script lang="ts">
  import { FileUpload } from "@fndn/svelte";
</script>

<FileUpload
  class="w-full max-w-sm"
  label="Screenshots"
  title="Drop screenshots here"
  hint="PNG or JPG, up to 4 files of 5 MB"
  accept={["image/png", "image/jpeg"]}
  maxFiles={4}
  maxFileSize={5_000_000}
/>
