"use client";
import { Steps as ArkSteps } from "@ark-ui/react/steps";
import { Check } from "@phosphor-icons/react";
import { useEffect, type CSSProperties, type ReactNode } from "react";
import { Button } from "../button/button";
import { steps } from "./steps.recipe";
import { trackModality } from "../lib/modality";

export type StepsItem = {
  title: ReactNode;
  description?: ReactNode;
  /** The step's panel, shown while it is the current step. */
  content?: ReactNode;
};

export type StepsProps = {
  items: ReadonlyArray<StepsItem>;
  /** Controlled: the current step, from 0 (items.length: every step done). Omit for uncontrolled (defaultStep). */
  step?: number;
  defaultStep?: number;
  onStepChange?: (step: number) => void;
  orientation?: "horizontal" | "vertical";
  /** The steps are taken in order: only Back and Next move. */
  linear?: boolean;
  /** Show the Back and Next buttons. */
  controls?: boolean;
  prevLabel?: string;
  nextLabel?: string;
  /** What shows once every step is done. */
  completed?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** data-* attributes land on the root (a host marks it as one of its parts). */
  [data: `data-${string}`]: string | undefined;
};

const shown = (v: ReactNode) => v != null && v !== false && v !== "";

/** A multi-step flow: numbered markers joined by a rail. Behaviour by Ark UI (Zag steps). */
export function Steps({
  items, step, defaultStep, onStepChange, orientation = "horizontal", linear = false, controls = false,
  prevLabel = "Back", nextLabel = "Next", completed, className, style, ...data
}: StepsProps) {
  useEffect(() => trackModality(), []);
  const r = steps({ orientation, linear });
  return (
    <ArkSteps.Root
      {...data}
      data-slot="steps"
      className={r.base({ class: className })}
      style={style}
      count={items.length}
      step={step}
      defaultStep={defaultStep}
      onStepChange={(d) => onStepChange?.(d.step)}
      orientation={orientation}
      linear={linear}
    >
      <ArkSteps.List data-slot="steps-list" className={r.list()}>
        {items.map((item, index) => (
          <ArkSteps.Item key={index} index={index} data-slot="steps-item" className={r.item()}>
            <ArkSteps.Trigger data-slot="steps-trigger" className={r.trigger()}>
              <ArkSteps.Indicator data-slot="steps-indicator" className={r.indicator()}>
                <span data-slot="steps-number" className={r.number()}>{index + 1}</span>
                <span data-slot="steps-check" className={r.check()}><Check data-slot="icon" weight="bold" /></span>
              </ArkSteps.Indicator>
              <span data-slot="steps-text" className={r.text()}>
                <span data-slot="steps-title" className={r.title()}>{item.title}</span>
                {shown(item.description) && <span data-slot="steps-description" className={r.description()}>{item.description}</span>}
              </span>
            </ArkSteps.Trigger>
            {index < items.length - 1 && <ArkSteps.Separator data-slot="steps-separator" className={r.separator()} />}
          </ArkSteps.Item>
        ))}
      </ArkSteps.List>
      {items.map((item, index) => shown(item.content) && (
        <ArkSteps.Content key={index} index={index} data-slot="steps-content" className={r.content()}>{item.content}</ArkSteps.Content>
      ))}
      {shown(completed) && <ArkSteps.CompletedContent data-slot="steps-completed" className={r.completed()}>{completed}</ArkSteps.CompletedContent>}
      {controls && (
        <div data-slot="steps-footer" className={r.footer()}>
          <ArkSteps.PrevTrigger asChild><Button data-steps="prev" variant="outline" size="sm">{prevLabel}</Button></ArkSteps.PrevTrigger>
          <ArkSteps.NextTrigger asChild><Button data-steps="next" variant="primary" size="sm">{nextLabel}</Button></ArkSteps.NextTrigger>
        </div>
      )}
    </ArkSteps.Root>
  );
}
