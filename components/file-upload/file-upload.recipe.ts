import { tv, type VariantProps } from "../lib/tv";

/* file-upload — drop files on a zone or choose them (Ark UI file-upload).
 *
 * The drop zone is a dashed frame holding the real EmptyState (size block: the icon tile, the
 * title, the hint); its look answers the pointer in colour only: hover (a real pointer) → hover,
 * press → hover-2, files dragged over it (the engine's data-dragging) → an accent frame on
 * accent-tint. A large surface presses with its background, as rows do, not with a scale.
 *
 * Each picked file is a line: the real Tag (removable, the file glyph as its icon; its classes
 * here are the `file` slot, passed as className so its name can be cut at the end of the line)
 * and its size at the end. A refused file is a red tag with its reason in red. A file added
 * after the first paint makes its room as it fades in, so what is below slides down instead of
 * jumping (arrivals make room as they fade): its one grid track opens from
 * minmax(0, 0fr) at @starting-style to minmax(0, 1fr) over duration.reveal (the collapsible's
 * reveal), while it fades in over duration.base. It clips while it opens, 4px of clip margin
 * leaving the remove button's focus ring whole. Only once the root has data-enter (after its
 * first paint, lib/paint.ts: the shared flag, it stays an attribute), so files there at first paint
 * do not move. The adapters key a file by its identity, never by its index, so removing one never
 * makes the files after it arrive again. */
export const fileUpload = tv({
  slots: {
    base: "flex flex-col gap-2 min-w-0 w-full data-disabled:opacity-50 data-disabled:pointer-events-none",
    label: "min-w-0 text-sm font-medium text-ink [overflow-wrap:anywhere] [unicode-bidi:plaintext]",
    dropzone: [
      "relative min-w-0 rounded-card border border-dashed border-line-strong bg-surface cursor-pointer",
      "motion-colors-fast",
      "hover:bg-hover active:bg-hover-2",
      "data-dragging:border-accent data-dragging:bg-accent-tint",
      "data-disabled:cursor-default",
    ],
    hiddenInput: "",
    itemGroup: "flex flex-col gap-1.5 min-w-0 m-0 p-0 list-none",
    /* the tag (as wide as its name, shrinking first) and the size at the end of the line.
     * fndn-check-ok: grid-template-rows is the sanctioned way to open room; one track, the line's own */
    item: [
      "grid grid-cols-[minmax(0,max-content)_1fr] grid-rows-[minmax(0,1fr)] items-center gap-x-2 min-w-0",
      "overflow-clip [overflow-clip-margin:4px] motion-size-reveal [[data-slot=file-upload][data-enter]_&]:starting:grid-rows-[minmax(0,0fr)]",
      "opacity-100 motion-opacity-base [[data-slot=file-upload][data-enter]_&]:starting:opacity-0",
    ],
    /* on the Tag: it may shrink, so its name is cut at the end of the line instead of pushing the size out */
    file: "min-w-0 max-w-full",
    itemSize: "justify-self-end text-xs tabular-nums whitespace-nowrap text-ink-2",
  },
  variants: {
    rejected: {
      true: { itemSize: "text-red" },
    },
  },
});

export type FileUploadRecipeProps = VariantProps<typeof fileUpload>;
