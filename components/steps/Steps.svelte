<!-- A multi-step flow: numbered markers joined by a rail. Behaviour by Ark UI (Zag steps). -->
<script lang="ts">
  import { Steps as ArkSteps } from "@ark-ui/svelte/steps";
  import Check from "phosphor-svelte/lib/CheckIcon";
  import type { Snippet } from "svelte";
  import Button from "../button/Button.svelte";
  import { steps } from "./steps.recipe";
  import { trackModality } from "../lib/modality";

  export type StepsItem = {
    title: string;
    description?: string;
    /** The step's panel, shown while it is the current step. */
    content?: string | Snippet;
  };

  type Props = {
    items: ReadonlyArray<StepsItem>;
    /** Two-way bindable: <Steps bind:step />, from 0 (items.length: every step done). Omit for uncontrolled (defaultStep). */
    step?: number;
    defaultStep?: number;
    onstepchange?: (step: number) => void;
    orientation?: "horizontal" | "vertical";
    /** The steps are taken in order: only Back and Next move. */
    linear?: boolean;
    /** Show the Back and Next buttons. */
    controls?: boolean;
    prevLabel?: string;
    nextLabel?: string;
    /** What shows once every step is done: text, or a snippet. */
    completed?: string | Snippet;
    class?: string;
    style?: string;
    /** data-* attributes land on the root (a host marks it as one of its parts). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    items, step = $bindable(), defaultStep, onstepchange, orientation = "horizontal", linear = false, controls = false,
    prevLabel = "Back", nextLabel = "Next", completed, class: className, style, ...data
  }: Props = $props();

  const r = $derived(steps({ orientation, linear }));
  $effect(() => trackModality());
</script>

{#snippet text(value: string | Snippet)}{#if typeof value === "string"}{value}{:else}{@render value()}{/if}{/snippet}

<ArkSteps.Root
  {...data}
  data-slot="steps"
  class={r.base({ class: className })}
  {style}
  count={items.length}
  {step}
  {defaultStep}
  onStepChange={(d) => { step = d.step; onstepchange?.(d.step); }}
  {orientation}
  {linear}
>
  <ArkSteps.List data-slot="steps-list" class={r.list()}>
    {#each items as item, index (index)}
      <ArkSteps.Item {index} data-slot="steps-item" class={r.item()}>
        <ArkSteps.Trigger data-slot="steps-trigger" class={r.trigger()}>
          <ArkSteps.Indicator data-slot="steps-indicator" class={r.indicator()}>
            <span data-slot="steps-number" class={r.number()}>{index + 1}</span>
            <span data-slot="steps-check" class={r.check()}><Check data-slot="icon" weight="bold" /></span>
          </ArkSteps.Indicator>
          <span data-slot="steps-text" class={r.text()}>
            <span data-slot="steps-title" class={r.title()}>{item.title}</span>
            {#if item.description}<span data-slot="steps-description" class={r.description()}>{item.description}</span>{/if}
          </span>
        </ArkSteps.Trigger>
        {#if index < items.length - 1}<ArkSteps.Separator data-slot="steps-separator" class={r.separator()} />{/if}
      </ArkSteps.Item>
    {/each}
  </ArkSteps.List>
  {#each items as item, index (index)}
    {#if item.content}<ArkSteps.Content {index} data-slot="steps-content" class={r.content()}>{@render text(item.content)}</ArkSteps.Content>{/if}
  {/each}
  {#if completed}<ArkSteps.CompletedContent data-slot="steps-completed" class={r.completed()}>{@render text(completed)}</ArkSteps.CompletedContent>{/if}
  {#if controls}
    <div data-slot="steps-footer" class={r.footer()}>
      <ArkSteps.PrevTrigger>
        {#snippet asChild(props)}<Button {...props()} data-steps="prev" variant="outline" size="sm">{prevLabel}</Button>{/snippet}
      </ArkSteps.PrevTrigger>
      <ArkSteps.NextTrigger>
        {#snippet asChild(props)}<Button {...props()} data-steps="next" variant="primary" size="sm">{nextLabel}</Button>{/snippet}
      </ArkSteps.NextTrigger>
    </div>
  {/if}
</ArkSteps.Root>
