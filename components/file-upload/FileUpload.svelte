<!-- Drop files on a zone or choose them. Behaviour by Ark UI (Zag file-upload). -->
<script lang="ts">
  import { FileUpload as ArkFileUpload } from "@ark-ui/svelte/file-upload";
  import FileIcon from "phosphor-svelte/lib/FileIcon";
  import UploadSimple from "phosphor-svelte/lib/UploadSimpleIcon";
  import { afterPaint } from "../lib/paint";
  import { trackModality } from "../lib/modality";
  import EmptyState from "../empty-state/EmptyState.svelte";
  import Tag from "../tag/Tag.svelte";
  import { fileUpload } from "./file-upload.recipe";

  /** A file, or a plain description of one (an upload already on the server, a fixture). */
  export type FileUploadFile = File | { name: string; size: number; type?: string };

  type Props = {
    /** Two-way bindable: the accepted files after a pick, a drop or a removal, <FileUpload bind:files />. */
    files?: ReadonlyArray<FileUploadFile>;
    onfileschange?: (files: File[]) => void;
    /** Files that were refused, with the reasons. */
    onreject?: (rejections: { file: File; errors: string[] }[]) => void;
    /** Visible label above the drop zone. */
    label?: string;
    /** The drop zone's title. */
    title?: string;
    /** The drop zone's hint. */
    hint?: string;
    /** Accepted types: MIME types (image/png, image/*) or extensions (.pdf). */
    accept?: string[];
    /** How many files it takes. */
    maxFiles?: number;
    /** Largest file in bytes. */
    maxFileSize?: number;
    /** Form field name (the hidden input). */
    name?: string;
    disabled?: boolean;
    id?: string;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    files = $bindable([]), onfileschange, onreject, label, title = "Drop files here", hint = "or click to choose", accept, maxFiles = 1,
    maxFileSize, name, disabled = false, class: className, ...rest
  }: Props = $props();

  /* a description stands for a file: an empty File that reports the given size */
  /* a file is keyed by its identity, never by its index: removing one must not re-key (and so
   * fade in again) the files after it */
  const ids = new WeakMap<File, number>();
  let lastId = 0;
  const keyOf = (file: File) => { let id = ids.get(file); if (id === undefined) ids.set(file, (id = ++lastId)); return id; };
  const made = new WeakMap<object, File>();
  function toFile(f: FileUploadFile): File {
    if (f instanceof File) return f;
    const hit = made.get(f);
    if (hit) return hit;
    const file = new File([], f.name, { type: f.type ?? "" });
    Object.defineProperty(file, "size", { value: f.size });
    made.set(f, file);
    return file;
  }

  const REASONS: Record<string, string> = {
    TOO_MANY_FILES: "Too many files",
    FILE_INVALID_TYPE: "Not an accepted type",
    FILE_TOO_LARGE: "Too large",
    FILE_TOO_SMALL: "Too small",
    FILE_INVALID: "Not a valid file",
    FILE_EXISTS: "Already added",
  };
  const reason = (errors: readonly string[]) => errors.map((e) => REASONS[e] ?? e).join(" · ");

  const r = $derived(fileUpload());
  const accepted = $derived(files.map(toFile));

  /* nothing fades in with the first paint: data-enter only after it (lib/paint.ts) */
  let enter = $state(false);
  $effect(() => trackModality());
  $effect(() => afterPaint(() => { enter = true; }));
</script>

{#snippet uploadIcon()}<UploadSimple data-slot="icon" weight="bold" />{/snippet}
{#snippet fileIcon()}<FileIcon data-slot="icon" weight="bold" />{/snippet}

<ArkFileUpload.Root
  data-slot="file-upload"
  data-enter={enter ? "" : undefined}
  class={r.base({ class: className })}
  acceptedFiles={accepted}
  onFileChange={(d) => { files = d.acceptedFiles; onfileschange?.(d.acceptedFiles); }}
  onFileReject={(d) => onreject?.(d.files.map((x) => ({ file: x.file, errors: [...x.errors] })))}
  accept={accept as never}
  {maxFiles}
  {maxFileSize}
  {name}
  {disabled}
  {...rest}
>
  {#if label}<ArkFileUpload.Label data-slot="file-upload-label" class={r.label()}>{label}</ArkFileUpload.Label>{/if}
  <ArkFileUpload.Dropzone data-slot="file-upload-dropzone" class={r.dropzone()}>
    <EmptyState size="block" icon={uploadIcon} {title} {hint} />
  </ArkFileUpload.Dropzone>
  <ArkFileUpload.HiddenInput data-slot="file-upload-hidden-input" class={r.hiddenInput()} />
  <ArkFileUpload.Context>
    {#snippet render(fileUploadApi)}
      {@const api = fileUploadApi()}
      {#if api.acceptedFiles.length > 0}
        <ArkFileUpload.ItemGroup data-slot="file-upload-item-group" class={r.itemGroup()}>
          {#each api.acceptedFiles as file (`a-${keyOf(file)}`)}
            <ArkFileUpload.Item {file} data-slot="file-upload-item" class={r.item()}>
              <Tag data-file-upload="file" class={r.file()} icon={fileIcon} removable removeLabel={`Remove ${file.name}`} onremove={() => api.deleteFile(file)}>{file.name}</Tag>
              <span data-slot="file-upload-item-size" class={r.itemSize()}>{api.getFileSize(file)}</span>
            </ArkFileUpload.Item>
          {/each}
        </ArkFileUpload.ItemGroup>
      {/if}
      {#if api.rejectedFiles.length > 0}
        <ArkFileUpload.ItemGroup type="rejected" data-slot="file-upload-item-group" class={r.itemGroup()}>
          {#each api.rejectedFiles as { file, errors } (`r-${keyOf(file)}`)}
            <ArkFileUpload.Item {file} data-slot="file-upload-item" class={r.item()}>
              <Tag data-file-upload="file" class={r.file()} tone="red" icon={fileIcon} removable removeLabel={`Remove ${file.name}`} onremove={() => api.deleteFile(file, "rejected")}>{file.name}</Tag>
              <span data-slot="file-upload-item-size" class={r.itemSize({ rejected: true })}>{reason(errors)}</span>
            </ArkFileUpload.Item>
          {/each}
        </ArkFileUpload.ItemGroup>
      {/if}
    {/snippet}
  </ArkFileUpload.Context>
</ArkFileUpload.Root>
