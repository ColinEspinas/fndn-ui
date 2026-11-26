import { ArrowLeft } from "@phosphor-icons/react";
import { isValidElement, type HTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { Button } from "../button/button";
import { pageHeader } from "./page-header.recipe";

export type PageHeaderBack = { label: string; href?: string };
export type PageHeaderActionVariant = "primary" | "outline" | "secondary" | "accent" | "success" | "danger" | "danger-outline" | "ghost";
export type PageHeaderAction = {
  label: string;
  /** Passed to onAction. Defaults to the label. */
  value?: string;
  variant?: PageHeaderActionVariant;
};

export type PageHeaderProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  /** The screen's title, a real heading. */
  title: ReactNode;
  /** One line or two under the title (beside it in a pane): what the screen holds, its state. */
  description?: ReactNode;
  /** Where "back" goes: a link with an href, a button that calls onBack without one. */
  back?: PageHeaderBack;
  /** Called by the back button; given with an href, it replaces the browser's navigation (client
   * routers), and a click with a modifier key keeps the browser's. */
  onBack?: (back: PageHeaderBack) => void;
  /** The heading's level, h1 to h6. The size does not change with it. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** page: a page's title. pane: the one-row header of a pane above a list. */
  size?: "page" | "pane";
  /** At the end of the title's line: your own Buttons (a node), or Buttons from data (sm, outline unless given). */
  actions?: ReactNode | ReadonlyArray<PageHeaderAction>;
  /** A data action was pressed. */
  onAction?: (value: string) => void;
};

const isActionList = (a: unknown): a is ReadonlyArray<PageHeaderAction> =>
  Array.isArray(a) && a.length > 0 && a.every((x) => x != null && typeof x === "object" && !isValidElement(x) && "label" in x);

/** The strip at the top of a screen's content: back link, title, description, actions. */
export function PageHeader({ title, description, back, onBack, level = 1, size = "page", actions, onAction, className, ...rest }: PageHeaderProps) {
  const r = pageHeader({ size });
  const Heading = `h${clampLevel(level)}` as "h1";
  const arrow = <ArrowLeft data-slot="icon" weight="bold" aria-hidden />;
  const follow = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!onBack || !back || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onBack(back);
  };
  const list = isActionList(actions) ? actions : null;
  const hasActions = list != null || (actions != null && actions !== false && !(Array.isArray(actions) && actions.length === 0));
  const hasDescription = description != null && description !== false && description !== "";
  return (
    <div data-slot="page-header" className={r.base({ class: className })} {...rest}>
      {back &&
        (back.href != null ? (
          <a data-slot="page-header-back" className={r.back()} href={back.href} onClick={follow}>{arrow}{back.label}</a>
        ) : (
          <button type="button" data-slot="page-header-back" className={r.back()} onClick={() => onBack?.(back)}>{arrow}{back.label}</button>
        ))}
      <div data-slot="page-header-row" className={r.row()}>
        <div data-slot="page-header-text" className={r.text()}>
          <Heading data-slot="page-header-title" className={r.title()}>{title}</Heading>
          {hasDescription && <p data-slot="page-header-description" className={r.description()}>{description}</p>}
        </div>
        {hasActions && (
          <div data-slot="page-header-actions" className={r.actions()}>
            {list
              ? list.map((a) => (
                  <Button key={a.value ?? a.label} size="sm" variant={a.variant ?? "outline"} onClick={() => onAction?.(a.value ?? a.label)}>{a.label}</Button>
                ))
              : (actions as ReactNode)}
          </div>
        )}
      </div>
    </div>
  );
}

/* a level outside 1 to 6 falls back to the nearest one (h7 is not an element) */
const clampLevel = (n: number) => Math.min(6, Math.max(1, Math.round(Number(n) || 1)));
