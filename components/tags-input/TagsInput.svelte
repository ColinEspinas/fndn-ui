<!-- A field that collects values as tags. Behaviour by Ark UI (Zag tags-input). -->
<script lang="ts">
  import { TagsInput as ArkTagsInput } from "@ark-ui/svelte/tags-input";
  import { SvelteSet } from "svelte/reactivity";
  import Tag from "../tag/Tag.svelte";
  import { trackModality } from "../lib/modality";
  import { afterLeaving, keyed, editBlur, editKeyDown, notTwice, toneOf, type TagsInputTone } from "./tags-input.logic";
  import { tagsInput } from "./tags-input.recipe";

  type Props = {
    /** Two-way bindable: the tags, <TagsInput bind:value />. */
    value?: string[];
    onvaluechange?: (value: string[]) => void;
    placeholder?: string;
    /** Visible label. Without one, pass aria-label. */
    label?: string;
    "aria-label"?: string;
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
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    value = $bindable([]), onvaluechange, placeholder = "Add a tag", label, "aria-label": ariaLabel, size = "md", variant = "outline", tone = "neutral", tones, tagVariant = "tint", max, editable = true,
    delimiter = ",", addOnPaste = true, disabled = false, invalid = false, name, class: className, style, ...data
  }: Props = $props();

  const r = $derived(tagsInput({ size, variant, tagVariant }));

  /* Each tag is the Tag, whose remove Button takes the engine's delete-trigger props. The engine hides
   * the tag while it is edited; hidden={false} keeps it in the row, holding the edit field's place
   * (the recipe draws it as the edit box). Removed with the
   * pointer (its × is not a tab stop, so a click is always the pointer's), the tag fades while its
   * cell closes (the leaving variant, on the item and the tag) and leaves when that is over, so the
   * tags after it are already in place. Backspace and Delete go straight to the engine: instant. */
  const leaving = new SvelteSet<string>();
  type DeleteProps = Record<string, unknown> & { onclick?: (event: MouseEvent) => void };
  function removeProps(engine: DeleteProps, key: string, clear: (id: string) => void) {
    const onclick = (event: MouseEvent) => {
      if (leaving.has(key)) return;
      const el = (event.currentTarget as HTMLElement).closest<HTMLElement>("[data-tags-input=item-preview]");
      if (!el || event.detail === 0) { engine.onclick?.(event); return; }
      leaving.add(key);
      /* by its id as it is then: the id says the tag's place in the row, which may have changed */
      afterLeaving(el, () => {
        clear(el.id);
        leaving.delete(key);
      });
    };
    /* a press on the × is not a press on the tag: it does not select it (the tag would flash in
     * the accent before it goes) and it leaves the focus where it is */
    const onpointerdown = (event: PointerEvent) => { event.preventDefault(); event.stopPropagation(); };
    return { ...engine, onclick, onpointerdown };
  }

  $effect(() => trackModality());
</script>

<ArkTagsInput.Root
  {...data} data-slot="tags-input"
  class={r.base({ class: className })}
  {style}
  {value}
  onValueChange={(details) => { value = details.value; onvaluechange?.(details.value); }}
  {max}
  {editable}
  {delimiter}
  {addOnPaste}
  {disabled}
  {invalid}
  {name}
  blurBehavior="add"
  validate={notTwice}
>
  {#if label}<ArkTagsInput.Label data-slot="tags-input-label" class={r.label()}>{label}</ArkTagsInput.Label>{/if}
  <ArkTagsInput.Context>
    {#snippet render(api)}
      <ArkTagsInput.Control data-slot="tags-input-control" class={r.control()}>
        {#each keyed(api().value) as { tag, index, key } (key)}
          <ArkTagsInput.Item {index} value={tag} data-slot="tags-input-item" class={r.item({ leaving: leaving.has(key) })}>
            <ArkTagsInput.ItemPreview>
              {#snippet asChild(previewProps)}
                <Tag
                  {...previewProps()}
                  hidden={false}
                  data-tags-input="item-preview"
                  class={r.itemPreview({ leaving: leaving.has(key) })}
                  size="sm"
                  tone={toneOf(tag, tone, tones)}
                  variant={tagVariant}
                  removable
                  removeLabel={`Remove ${tag}`}
                  removeProps={removeProps(api().getItemDeleteTriggerProps({ index, value: tag }) as DeleteProps, key, api().clearValue)}
                >{tag}</Tag>
              {/snippet}
            </ArkTagsInput.ItemPreview>
            <ArkTagsInput.ItemInput data-slot="tags-input-item-input" class={r.itemInput()} onkeydown={editKeyDown} onblur={(event: FocusEvent) => editBlur(event, api())} />
          </ArkTagsInput.Item>
        {/each}
        <ArkTagsInput.Input data-slot="tags-input-input" class={r.input()} placeholder={api().value.length ? undefined : placeholder} aria-label={ariaLabel} dir="auto" />
      </ArkTagsInput.Control>
    {/snippet}
  </ArkTagsInput.Context>
  {#if name}<ArkTagsInput.HiddenInput />{/if}
</ArkTagsInput.Root>
