<script setup lang="ts">
/** A field that collects values as tags. Behaviour by Ark UI (Zag tags-input). */
import { TagsInput as ArkTagsInput } from "@ark-ui/vue/tags-input";
import { computed, onMounted, reactive, useAttrs } from "vue";
import Tag from "../tag/Tag.vue";
import { trackModality } from "../lib/modality";
import { afterLeaving, keyed, editBlur, editKeyDown, notTwice, toneOf, type TagsInputTone } from "./tags-input.logic";
import { tagsInput } from "./tags-input.recipe";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    /** Visible label. Without one, pass ariaLabel. */
    label?: string;
    ariaLabel?: string;
    /** One row at the shared control's heights: xs 24px, sm 28px, md 32px, lg 36px. Tags are 22px at every size. */
    size?: "xs" | "sm" | "md" | "lg";
    /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
    variant?: "outline" | "subtle" | "ghost";
    /** The tags' tone: one Tag tone for every tag, or "auto" (the same word, the same hue). Default neutral. */
    tone?: TagsInputTone | "auto";
    /** A tone per tag text ({ bug: "red", billing: "purple" }); wins over tone. */
    tones?: Readonly<Record<string, TagsInputTone>>;
    /** The tags' look (Tag's variant): tint (the hue fills the tag) or outline (a neutral tag, the hue only in its dot). Default tint. */
    tagVariant?: "tint" | "outline";
    /** Most tags; past it nothing is added. */
    max?: number;
    /** A double click (or Enter on a highlighted tag) edits a tag. */
    editable?: boolean;
    /** Typing it adds the text as a tag, as Enter does. */
    delimiter?: string;
    /** Pasted text is split on the delimiter into tags. */
    addOnPaste?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    /** Form field name: a hidden input carries the tags, comma-separated. */
    name?: string;
  }>(),
  { placeholder: "Add a tag", size: "md", variant: "outline", tone: "neutral", tones: undefined, tagVariant: "tint", max: undefined, editable: true, delimiter: ",", addOnPaste: true, disabled: false, invalid: false },
);

/** v-model:value — the tags; falls back to local state when unbound. */
const value = defineModel<string[]>("value", { default: () => [] });
const emit = defineEmits<{ valueChange: [value: string[]] }>();
defineSlots<{ label?: () => unknown }>();

const r = computed(() => tagsInput({ size: props.size, variant: props.variant, tagVariant: props.tagVariant }));

function onValue(next: string[]) {
  value.value = next;
  emit("valueChange", next);
}

/* Each tag is the Tag, whose remove Button takes the engine's delete-trigger props. The engine hides
 * the tag while it is edited; :hidden="false" keeps it in the row, holding the edit field's place
 * (the recipe draws it as the edit box). Removed with the
 * pointer (its × is not a tab stop, so a click is always the pointer's), the tag fades while its
 * cell closes (the leaving variant, on the item and the tag) and leaves when that is over, so the
 * tags after it are already in place. Backspace and Delete go straight to the engine: instant. */
const leaving = reactive(new Set<string>());
type DeleteProps = Record<string, unknown> & { onClick?: (event: MouseEvent) => void };
function removeProps(engine: DeleteProps, key: string, clear: (id: string) => void) {
  const onClick = (event: MouseEvent) => {
    if (leaving.has(key)) return;
    const el = (event.currentTarget as HTMLElement).closest<HTMLElement>("[data-tags-input=item-preview]");
    if (!el || event.detail === 0) { engine.onClick?.(event); return; }
    leaving.add(key);
    /* by its id as it is then: the id says the tag's place in the row, which may have changed */
    afterLeaving(el, () => {
      clear(el.id);
      leaving.delete(key);
    });
  };
  /* a press on the × is not a press on the tag: it does not select it (the tag would flash in the
   * accent before it goes) and it leaves the focus where it is */
  const onPointerdown = (event: PointerEvent) => { event.preventDefault(); event.stopPropagation(); };
  return { ...engine, onClick, onPointerdown };
}

onMounted(() => trackModality());
</script>

<template>
  <ArkTagsInput.Root
    v-bind="attrs"
    data-slot="tags-input"
    :class="r.base({ class: attrs.class as string | undefined })"
    :model-value="value"
    :max="max"
    :editable="editable"
    :delimiter="delimiter"
    :add-on-paste="addOnPaste"
    :disabled="disabled"
    :invalid="invalid"
    :name="name"
    blur-behavior="add"
    :validate="notTwice"
    @update:model-value="onValue"
  >
    <ArkTagsInput.Label v-if="label || $slots.label" data-slot="tags-input-label" :class="r.label()"><slot name="label">{{ label }}</slot></ArkTagsInput.Label>
    <ArkTagsInput.Context v-slot="api">
      <ArkTagsInput.Control data-slot="tags-input-control" :class="r.control()">
        <ArkTagsInput.Item v-for="{ tag, index, key } in keyed(api.value)" :key="key" :index="index" :value="tag" data-slot="tags-input-item" :class="r.item({ leaving: leaving.has(key) })">
          <ArkTagsInput.ItemPreview as-child>
            <Tag
              :hidden="false"
              data-tags-input="item-preview"
              :class="r.itemPreview({ leaving: leaving.has(key) })"
              size="sm"
              :tone="toneOf(tag, props.tone, props.tones)"
              :variant="props.tagVariant"
              removable
              :remove-label="`Remove ${tag}`"
              :remove-props="removeProps(api.getItemDeleteTriggerProps({ index, value: tag }) as DeleteProps, key, api.clearValue)"
            >{{ tag }}</Tag>
          </ArkTagsInput.ItemPreview>
          <ArkTagsInput.ItemInput data-slot="tags-input-item-input" :class="r.itemInput()" @keydown="editKeyDown" @blur="(event: FocusEvent) => editBlur(event, api)" />
        </ArkTagsInput.Item>
        <ArkTagsInput.Input data-slot="tags-input-input" :class="r.input()" :placeholder="api.value.length ? undefined : placeholder" :aria-label="ariaLabel" dir="auto" />
      </ArkTagsInput.Control>
    </ArkTagsInput.Context>
    <ArkTagsInput.HiddenInput v-if="name" />
  </ArkTagsInput.Root>
</template>
