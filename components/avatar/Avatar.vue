<script setup lang="ts">
/** Image or initials, 12–20px in text, 24–40px in rows and headers. */
import { computed, ref, useAttrs, watch } from "vue";
import { initialsOf, maxInitials } from "./avatar.logic";
import { avatar } from "./avatar.recipe";

export type AvatarSize = 12 | 14 | 16 | 20 | 24 | 28 | 32 | 40 | "12" | "14" | "16" | "20" | "24" | "28" | "32" | "40";
export type AvatarShape = "round" | "square";

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Accessible name; the initials come from it unless `initials` is given. */
    name?: string;
    initials?: string;
    /** Image URL; the initials show until it loads and if it fails. */
    src?: string;
    size?: AvatarSize;
    shape?: AvatarShape;
    /** Fill behind the initials (any CSS colour); default ink-3. */
    color?: string;
  }>(),
  { size: 16, shape: "round" },
);
const failed = ref(false);
watch(() => props.src, () => { failed.value = false; });
const r = computed(() => avatar({ size: String(props.size) as `${Exclude<AvatarSize, string>}`, shape: props.shape, image: !!props.src && !failed.value }));
const letters = computed(() => props.initials ?? initialsOf(props.name, maxInitials(props.size)));
</script>

<template>
  <span
    v-bind="attrs"
    data-slot="avatar"
    :class="r.base({ class: attrs.class as string | undefined })"
    :role="name ? 'img' : undefined"
    :aria-label="name || undefined"
    :aria-hidden="name ? undefined : 'true'"
    :style="color ? { '--fndn-avatar-color': color } : undefined"
  >
    <span data-slot="avatar-initials" :class="r.initials()" aria-hidden="true">{{ letters }}</span>
    <img v-if="src && !failed" data-slot="avatar-image" :class="r.image()" :src="src" alt="" @error="failed = true" />
  </span>
</template>
