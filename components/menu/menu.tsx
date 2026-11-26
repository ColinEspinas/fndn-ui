"use client";
import { Menu as ArkMenu, useMenuContext } from "@ark-ui/react/menu";
import { Portal } from "@ark-ui/react/portal";
import { CaretDown, CaretRight, Check } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Button } from "../button/button";
import { glide } from "../lib/glide";
import { trackModality } from "../lib/modality";
import { menu } from "./menu.recipe";
import { checkbox } from "../checkbox/checkbox.recipe";
import { radioGroup } from "../radio-group/radio-group.recipe";

const r = menu();
const cb = checkbox();
const rg = radioGroup();

export type MenuAction = { type?: "item"; value: string; label: string; meta?: string; tone?: "default" | "danger"; disabled?: boolean; icon?: ReactNode };
export type MenuCheckbox = { type: "checkbox"; value: string; label: string; checked?: boolean; disabled?: boolean };
export type MenuGroup = { type: "group"; label?: string; items: ReadonlyArray<MenuAction | MenuCheckbox> };
export type MenuRadioGroup = {
  type: "radio-group"; name: string; label?: string; value?: string;
  /** Close the menu when an option is picked. Default false: the menu stays open. */
  closeOnSelect?: boolean;
  items: ReadonlyArray<{ value: string; label: string; disabled?: boolean }>;
};
export type MenuSeparator = { type: "separator" };
/** A row that opens a nested menu to its side (React only for now). */
export type MenuSubmenu = { type: "submenu"; label: string; icon?: ReactNode; items: ReadonlyArray<MenuEntry> };
export type MenuEntry = MenuAction | MenuCheckbox | MenuGroup | MenuRadioGroup | MenuSeparator | MenuSubmenu;
export type MenuPlacement = "bottom-start" | "bottom" | "bottom-end" | "top-start" | "top" | "top-end" | "right-start" | "left-start";

export type MenuProps = {
  /** data-* attributes go to the root (a host marks it as its part, data-<host>="<part>"). */
  [data: `data-${string}`]: string | undefined;
  /** Entries in order: actions, checkbox options, labelled groups, radio groups, separators. */
  items: ReadonlyArray<MenuEntry>;
  /** Your own trigger: one element that accepts a ref and props. Omit to get the default button. */
  children?: ReactElement;
  /** Label of the default trigger. */
  triggerLabel?: ReactNode;
  onSelect?: (value: string) => void;
  /** Checkbox options. Without it, they keep their own state, seeded from `checked`. */
  onCheckedChange?: (value: string, checked: boolean) => void;
  /** Radio groups. Without it, they keep their own state, seeded from `value`. */
  onRadioChange?: (name: string, value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: MenuPlacement;
  className?: string;
};

/* checkbox and radio options lead with the checkbox's and the radio's own control */
const CheckControl = ({ on }: { on: boolean }) => (
  <div data-slot="checkbox-control" className={cb.control()} data-state={on ? "checked" : "unchecked"} aria-hidden>
    <span data-slot="checkbox-mark" className={cb.mark()} data-mark="check"><Check data-slot="icon" weight="bold" /></span>
  </div>
);
const RadioControl = ({ on }: { on: boolean }) => (
  <div data-slot="radio-group-control" className={rg.control()} data-state={on ? "checked" : "unchecked"} aria-hidden />
);

/** What the rows of a menu (and of its sub-menus) need from the menu that owns them. */
export type MenuHandlers = Pick<MenuProps, "onSelect" | "onCheckedChange" | "onRadioChange">;

/* options are controlled when a handler is given, otherwise they remember their own state; one
 * store for the whole tree, so a sub-menu that closes and reopens keeps its options */
function useOptionState() {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [radios, setRadios] = useState<Record<string, string>>({});
  return { checks, setChecks, radios, setRadios };
}
type OptionState = ReturnType<typeof useOptionState>;

/** The menu's popup: positioner, content, the gliding highlight and the rows, sub-menus included.
 * Render it inside an Ark Menu.Root. Used by Menu and by the components built on it (context-menu). */
export function MenuPanel({ items, handlers, options }: { items: ReadonlyArray<MenuEntry>; handlers: MenuHandlers; options?: OptionState }) {
  const own = useOptionState();
  const state = options ?? own;
  /* open when it mounted: drawn at once (the popup recipe skips the entrance) until it first closes.
   * Read from the menu that owns this panel; a sub-menu always mounts closed. */
  const { open } = useMenuContext();
  const [mountedOpen, setMountedOpen] = useState(open);
  if (mountedOpen && !open) setMountedOpen(false);
  const content = useRef<HTMLDivElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    trackModality();
    if (!content.current || !highlight.current) return;
    return glide(content.current, highlight.current, { rows: "[data-slot=menu-item]", follow: "highlighted" });
  }, []);
  return (
    <Portal>
      <ArkMenu.Positioner data-slot="menu-positioner" className={r.positioner()}>
        <ArkMenu.Content ref={content} data-slot="menu-content" data-mounted-open={mountedOpen ? "" : undefined} className={r.content()}>
          <span ref={highlight} data-slot="menu-highlight" className={r.highlight()} aria-hidden />
          {items.map((item, index) => entry(item, index, handlers, state))}
        </ArkMenu.Content>
      </ArkMenu.Positioner>
    </Portal>
  );
}

const action = (item: MenuAction) => (
  <ArkMenu.Item key={item.value} value={item.value} disabled={item.disabled} data-slot="menu-item" className={r.item({ tone: item.tone })}>
    {item.icon && <span data-slot="menu-item-icon" className={r.itemIcon({ tone: item.tone })} aria-hidden>{item.icon}</span>}
    <span data-slot="menu-item-text" className={r.itemText()}>{item.label}</span>
    {item.meta && <span data-slot="menu-item-meta" className={r.itemMeta()}>{item.meta}</span>}
  </ArkMenu.Item>
);

const checkboxItem = (item: MenuCheckbox, { onCheckedChange }: MenuHandlers, { checks, setChecks }: OptionState) => {
  const on = onCheckedChange ? !!item.checked : (checks[item.value] ?? !!item.checked);
  return (
    <ArkMenu.CheckboxItem
      key={item.value}
      value={item.value}
      disabled={item.disabled}
      closeOnSelect={false}
      data-slot="menu-item"
      className={r.item()}
      checked={on}
      onCheckedChange={(next) => {
        if (!onCheckedChange) setChecks((current) => ({ ...current, [item.value]: next }));
        onCheckedChange?.(item.value, next);
      }}
    >
      <CheckControl on={on} />
      <span data-slot="menu-item-text" className={r.itemText()}>{item.label}</span>
    </ArkMenu.CheckboxItem>
  );
};

function entry(item: MenuEntry, index: number, handlers: MenuHandlers, state: OptionState): ReactNode {
  if (item.type === "separator") return <ArkMenu.Separator key={`separator-${index}`} data-slot="menu-separator" className={r.separator()} />;
  if (item.type === "checkbox") return checkboxItem(item, handlers, state);
  if (item.type === "group") {
    return (
      <ArkMenu.ItemGroup key={`group-${index}`} data-slot="menu-group" className={r.group()}>
        {item.label && <ArkMenu.ItemGroupLabel data-slot="menu-label" className={r.label()}>{item.label}</ArkMenu.ItemGroupLabel>}
        {item.items.map((child) => (child.type === "checkbox" ? checkboxItem(child, handlers, state) : action(child)))}
      </ArkMenu.ItemGroup>
    );
  }
  if (item.type === "radio-group") {
    const { onRadioChange } = handlers;
    const groupValue = onRadioChange ? item.value : (state.radios[item.name] ?? item.value);
    return (
      <ArkMenu.RadioItemGroup
        key={`radio-${item.name}`}
        data-slot="menu-group"
        className={r.group()}
        value={groupValue}
        onValueChange={(details) => {
          if (!onRadioChange) state.setRadios((current) => ({ ...current, [item.name]: details.value }));
          onRadioChange?.(item.name, details.value);
        }}
      >
        {item.label && <ArkMenu.ItemGroupLabel data-slot="menu-label" className={r.label()}>{item.label}</ArkMenu.ItemGroupLabel>}
        {item.items.map((option) => (
          <ArkMenu.RadioItem key={option.value} value={option.value} disabled={option.disabled} closeOnSelect={!!item.closeOnSelect} data-slot="menu-item" className={r.item()}>
            <RadioControl on={groupValue === option.value} />
            <span data-slot="menu-item-text" className={r.itemText()}>{option.label}</span>
          </ArkMenu.RadioItem>
        ))}
      </ArkMenu.RadioItemGroup>
    );
  }
  if (item.type === "submenu") {
    /* a nested Ark menu: the engine opens it to the side (left-start under rtl). 4px up, so its first
     * row lines up with the row that opened it; 8px out from that row, so it stands 4px clear of the
     * parent panel's edge (the row sits 4px inside it) instead of covering it, as every popup stands
     * 4px from its trigger. It moves focus into it
     * with ArrowRight (ArrowLeft under rtl) and back with the opposite arrow or Escape */
    return (
      <ArkMenu.Root key={`submenu-${index}`} positioning={{ offset: { mainAxis: 8, crossAxis: -4 } }} onSelect={(details) => handlers.onSelect?.(details.value)}>
        <ArkMenu.TriggerItem data-slot="menu-item" className={r.item()}>
          {item.icon && <span data-slot="menu-item-icon" className={r.itemIcon()} aria-hidden>{item.icon}</span>}
          <span data-slot="menu-item-text" className={r.itemText()}>{item.label}</span>
          <span data-slot="menu-item-caret" className={r.itemCaret()} aria-hidden><CaretRight data-slot="icon" weight="bold" /></span>
        </ArkMenu.TriggerItem>
        <MenuPanel items={item.items} handlers={handlers} options={state} />
      </ArkMenu.Root>
    );
  }
  return action(item);
}

/** A list of actions that opens from a button. Behaviour by Ark UI (Zag menu). */
export function Menu({
  items, children, triggerLabel, onSelect, onCheckedChange, onRadioChange, open, defaultOpen, onOpenChange,
  placement = "bottom-start", className, ...data
}: MenuProps) {
  const options = useOptionState();
  return (
    <ArkMenu.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(details) => onOpenChange?.(details.open)}
      onSelect={(details) => onSelect?.(details.value)}
      positioning={{ placement, gutter: 4 }}
    >
      <div {...data} data-slot="menu" className={r.base({ class: className })}>
        {children ? (
          <ArkMenu.Trigger asChild>{children}</ArkMenu.Trigger>
        ) : (
          <ArkMenu.Trigger asChild>
            <Button data-menu="trigger" className={r.trigger()} variant="outline" size="sm" trailingIcon={<CaretDown data-slot="icon" weight="bold" />}>{triggerLabel}</Button>
          </ArkMenu.Trigger>
        )}
      </div>
      <MenuPanel items={items} handlers={{ onSelect, onCheckedChange, onRadioChange }} options={options} />
    </ArkMenu.Root>
  );
}
