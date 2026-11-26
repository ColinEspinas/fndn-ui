"use client";
import { FileUpload as ArkFileUpload } from "@ark-ui/react/file-upload";
import { File as FileIcon, UploadSimple } from "@phosphor-icons/react";
import { forwardRef, useEffect, useMemo, useState, type CSSProperties } from "react";
import { afterPaint } from "../lib/paint";
import { trackModality } from "../lib/modality";
import { EmptyState } from "../empty-state/empty-state";
import { Tag } from "../tag/tag";
import { fileUpload } from "./file-upload.recipe";

/** A file, or a plain description of one (an upload already on the server, a fixture). */
export type FileUploadFile = File | { name: string; size: number; type?: string };

export type FileUploadProps = {
  /** Controlled: the accepted files, with onFilesChange. Omit for uncontrolled (defaultFiles). */
  files?: ReadonlyArray<FileUploadFile>;
  defaultFiles?: ReadonlyArray<FileUploadFile>;
  /** The accepted files after a pick, a drop or a removal. */
  onFilesChange?: (files: File[]) => void;
  /** Files that were refused, with the reasons. */
  onReject?: (rejections: { file: File; errors: string[] }[]) => void;
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
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

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
const reason = (errors: string[]) => errors.map((e) => REASONS[e] ?? e).join(" · ");

/** Drop files on a zone or choose them. Behaviour by Ark UI (Zag file-upload). */
export const FileUpload = forwardRef<HTMLDivElement, FileUploadProps>(function FileUpload(
  { files, defaultFiles, onFilesChange, onReject, label, title = "Drop files here", hint = "or click to choose", accept, maxFiles = 1, maxFileSize, name, disabled, className, ...rest },
  ref,
) {
  useEffect(() => trackModality(), []);
  /* nothing fades in with the first paint: data-enter only after it (lib/paint.ts) */
  const [enter, setEnter] = useState(false);
  useEffect(() => (enter ? undefined : afterPaint(() => setEnter(true))), [enter]);
  const controlled = useMemo(() => files?.map(toFile), [files]);
  const [initial] = useState(() => (files === undefined ? defaultFiles?.map(toFile) : undefined));
  const r = fileUpload();
  return (
    <ArkFileUpload.Root
      ref={ref}
      data-slot="file-upload"
      data-enter={enter ? "" : undefined}
      className={r.base({ class: className })}
      acceptedFiles={controlled}
      defaultAcceptedFiles={initial}
      onFileChange={onFilesChange ? (d) => onFilesChange(d.acceptedFiles) : undefined}
      onFileReject={onReject ? (d) => onReject(d.files.map((x) => ({ file: x.file, errors: [...x.errors] }))) : undefined}
      accept={accept as never}
      maxFiles={maxFiles}
      maxFileSize={maxFileSize}
      name={name}
      disabled={disabled}
      {...rest}
    >
      {label && <ArkFileUpload.Label data-slot="file-upload-label" className={r.label()}>{label}</ArkFileUpload.Label>}
      <ArkFileUpload.Dropzone data-slot="file-upload-dropzone" className={r.dropzone()}>
        <EmptyState size="block" icon={<UploadSimple data-slot="icon" weight="bold" />} title={title} hint={hint} />
      </ArkFileUpload.Dropzone>
      <ArkFileUpload.HiddenInput data-slot="file-upload-hidden-input" className={r.hiddenInput() || undefined} />
      <ArkFileUpload.Context>
        {(api) =>
          <>
            {api.acceptedFiles.length > 0 && (
            <ArkFileUpload.ItemGroup data-slot="file-upload-item-group" className={r.itemGroup()}>
              {api.acceptedFiles.map((file) => (
                <ArkFileUpload.Item key={`a-${keyOf(file)}`} file={file} data-slot="file-upload-item" className={r.item()}>
                  <Tag data-file-upload="file" className={r.file()} icon={<FileIcon data-slot="icon" weight="bold" />} removable removeLabel={`Remove ${file.name}`} onRemove={() => api.deleteFile(file)}>
                    {file.name}
                  </Tag>
                  <span data-slot="file-upload-item-size" className={r.itemSize()}>{api.getFileSize(file)}</span>
                </ArkFileUpload.Item>
              ))}
            </ArkFileUpload.ItemGroup>
            )}
            {api.rejectedFiles.length > 0 && (
            <ArkFileUpload.ItemGroup type="rejected" data-slot="file-upload-item-group" className={r.itemGroup()}>
              {api.rejectedFiles.map(({ file, errors }) => (
                <ArkFileUpload.Item key={`r-${keyOf(file)}`} file={file} data-slot="file-upload-item" className={r.item()}>
                  <Tag data-file-upload="file" className={r.file()} tone="red" icon={<FileIcon data-slot="icon" weight="bold" />} removable removeLabel={`Remove ${file.name}`} onRemove={() => api.deleteFile(file, "rejected")}>
                    {file.name}
                  </Tag>
                  <span data-slot="file-upload-item-size" className={r.itemSize({ rejected: true })}>{reason([...errors])}</span>
                </ArkFileUpload.Item>
              ))}
            </ArkFileUpload.ItemGroup>
            )}
          </>
        }
      </ArkFileUpload.Context>
    </ArkFileUpload.Root>
  );
});
