<!-- Image or initials, 12–20px in text, 24–40px in rows and headers. -->
<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { initialsOf, maxInitials } from "./avatar.logic";
  import { avatar } from "./avatar.recipe";

  export type AvatarSize = 12 | 14 | 16 | 20 | 24 | 28 | 32 | 40 | "12" | "14" | "16" | "20" | "24" | "28" | "32" | "40";
  export type AvatarShape = "round" | "square";
  type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children" | "color"> & {
    /** Accessible name; the initials come from it unless `initials` is given. */
    name?: string;
    initials?: string;
    /** Image URL; the initials show until it loads and if it fails. */
    src?: string;
    size?: AvatarSize;
    shape?: AvatarShape;
    /** Fill behind the initials (any CSS colour); default ink-3. */
    color?: string;
  };

  let { name, initials, src, size = 16, shape = "round", color, class: className, ...rest }: Props = $props();
  let failed = $state(false);
  let failedSrc = $state<string | undefined>(undefined);
  const letters = $derived(initials ?? initialsOf(name, maxInitials(size)));
  const showImage = $derived(!!src && !(failed && failedSrc === src));
  const r = $derived(avatar({ size: String(size) as `${Exclude<AvatarSize, string>}`, shape, image: showImage }));
</script>

<span
  data-slot="avatar"
  class={r.base({ class: className as string | undefined })}
  role={name ? "img" : undefined}
  aria-label={name || undefined}
  aria-hidden={name ? undefined : "true"}
  style:--fndn-avatar-color={color}
  {...rest}
>
  <span data-slot="avatar-initials" class={r.initials()} aria-hidden="true">{letters}</span>
  {#if showImage}<img data-slot="avatar-image" class={r.image()} {src} alt="" onerror={() => { failed = true; failedSrc = src; }} />{/if}
</span>
