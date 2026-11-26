<script setup lang="ts">
/** Drop files on a zone or choose them. Behaviour by Ark UI (Zag file-upload). */
import { FileUpload as ArkFileUpload } from "@ark-ui/vue/file-upload";
import { PhFile, PhUploadSimple } from "@phosphor-icons/vue";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs } from "vue";
import { afterPaint } from "../lib/paint";
import { trackModality } from "../lib/modality";
import EmptyState from "../empty-state/EmptyState.vue";
import Tag from "../tag/Tag.vue";
import { fileUpload } from "./file-upload.recipe";

/** A file, or a plain description of one (an upload already on the server, a fixture). */
export type FileUploadFile = File | { name: string; size: number; type?: string };

/* the caller's class goes through the recipe; other attributes (id, style, data-*) go to the root */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

withDefaults(
  defineProps<{
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
  }>(),
  { title: "Drop files here", hint: "or click to choose", maxFiles: 1, disabled: false },
);

/** v-model:files — the accepted files after a pick, a drop or a removal; falls back to local state when unbound. */
const files = defineModel<ReadonlyArray<FileUploadFile>>("files", { default: () => [] });
const emit = defineEmits<{ filesChange: [files: File[]]; reject: [rejections: { file: File; errors: string[] }[]] }>();

/* a description stands for a file: an empty File that reports the given size */
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

/* a file is keyed by its identity, never by its index: removing one must not re-key (and so
 * fade in again) the files after it */
const ids = new WeakMap<File, number>();
let lastId = 0;
const keyOf = (file: File) => { let id = ids.get(file); if (id === undefined) ids.set(file, (id = ++lastId)); return id; };

const REASONS: Record<string, string> = {
  TOO_MANY_FILES: "Too many files",
  FILE_INVALID_TYPE: "Not an accepted type",
  FILE_TOO_LARGE: "Too large",
  FILE_TOO_SMALL: "Too small",
  FILE_INVALID: "Not a valid file",
  FILE_EXISTS: "Already added",
};
const reason = (errors: readonly string[]) => errors.map((e) => REASONS[e] ?? e).join(" · ");

const r = computed(() => fileUpload());
const accepted = computed(() => files.value.map(toFile));

function onFiles(next: File[]) {
  files.value = next;
  emit("filesChange", next);
}

/* nothing fades in with the first paint: data-enter only after it (lib/paint.ts) */
const enter = ref(false);
let cancel = () => {};
onMounted(() => {
  trackModality();
  cancel = afterPaint(() => { enter.value = true; });
});
onBeforeUnmount(() => cancel());
</script>

<template>
  <ArkFileUpload.Root
    v-bind="attrs"
    data-slot="file-upload"
    :data-enter="enter ? '' : undefined"
    :class="r.base({ class: attrs.class as string | undefined })"
    :accepted-files="accepted"
    :accept="accept as never"
    :max-files="maxFiles"
    :max-file-size="maxFileSize"
    :name="name"
    :disabled="disabled"
    @file-change="(d) => onFiles(d.acceptedFiles)"
    @file-reject="(d) => emit('reject', d.files.map((x) => ({ file: x.file, errors: [...x.errors] })))"
  >
    <ArkFileUpload.Label v-if="label" data-slot="file-upload-label" :class="r.label()">{{ label }}</ArkFileUpload.Label>
    <ArkFileUpload.Dropzone data-slot="file-upload-dropzone" :class="r.dropzone()">
      <EmptyState size="block" :title="title" :hint="hint">
        <template #icon><PhUploadSimple data-slot="icon" weight="bold" /></template>
      </EmptyState>
    </ArkFileUpload.Dropzone>
    <ArkFileUpload.HiddenInput data-slot="file-upload-hidden-input" v-bind="r.hiddenInput() ? { class: r.hiddenInput() } : {}" />
    <ArkFileUpload.Context v-slot="api">
      <ArkFileUpload.ItemGroup v-if="api.acceptedFiles.length > 0" data-slot="file-upload-item-group" :class="r.itemGroup()">
        <ArkFileUpload.Item v-for="file in api.acceptedFiles" :key="`a-${keyOf(file)}`" :file="file" data-slot="file-upload-item" :class="r.item()">
          <Tag data-file-upload="file" :class="r.file()" removable :remove-label="`Remove ${file.name}`" @remove="api.deleteFile(file)">
            <template #icon><PhFile data-slot="icon" weight="bold" /></template>{{ file.name }}</Tag>
          <span data-slot="file-upload-item-size" :class="r.itemSize()">{{ api.getFileSize(file) }}</span>
        </ArkFileUpload.Item>
      </ArkFileUpload.ItemGroup>
      <ArkFileUpload.ItemGroup v-if="api.rejectedFiles.length > 0" type="rejected" data-slot="file-upload-item-group" :class="r.itemGroup()">
        <ArkFileUpload.Item v-for="{ file, errors } in api.rejectedFiles" :key="`r-${keyOf(file)}`" :file="file" data-slot="file-upload-item" :class="r.item()">
          <Tag data-file-upload="file" :class="r.file()" tone="red" removable :remove-label="`Remove ${file.name}`" @remove="api.deleteFile(file, 'rejected')">
            <template #icon><PhFile data-slot="icon" weight="bold" /></template>{{ file.name }}</Tag>
          <span data-slot="file-upload-item-size" :class="r.itemSize({ rejected: true })">{{ reason(errors) }}</span>
        </ArkFileUpload.Item>
      </ArkFileUpload.ItemGroup>
    </ArkFileUpload.Context>
  </ArkFileUpload.Root>
</template>
