## Motion

Motion is feedback and orientation, never decoration. The system is a crisp tool: fast, quiet,
exact. When unsure whether something should move, it should not.

Write motion with the stylesheet's utilities (the table in `docs authoring`, Motion). The tool's
`check` reports what can be read from code: a literal duration, a weak or literal easing,
`transition: all`, `scale(0)`, a transition on a layout property, an ungated `:hover`. A line
that must break a rule carries a `fndn-check-ok: <reason>` comment on it or on the line above.

### Should it animate at all

| How often it is seen | Decision |
| --- | --- |
| 100+ times a day, or from the keyboard | No animation. Arrow keys, shortcuts and type-ahead change state at once. The one exception: a list's gliding highlight glides under the keyboard too. |
| Tens of times a day (hover, list navigation, toggles) | Colour or opacity only, at `fast` or `base`. |
| Occasionally (popups, dialogs, reveals, entrances) | The standard motion in the recipes below. |
| Rarely or once (success, onboarding) | May carry a little delight. |

**Every animation names its purpose**: feedback, spatial consistency, state indication,
preventing a jarring change, or explanation. "It looks nice" on something seen daily is a reason
to delete it.

### Timing

**Durations and delays come from the duration tokens**: the `motion-*`, `duration-*` and
`delay-*` utilities, or `var(--fndn-duration-*)` in CSS. Only loops (`infinite`) may use a literal
time. One vocabulary keeps every hover, press and popup in step, and lets reduced motion be
handled once, in the tokens.

| Token | Value | For |
| --- | --- | --- |
| `fast` | 100ms | Hover and colour feedback; every popup's exit. |
| `tooltip` | 125ms | Tooltips, tiny popovers. |
| `base` | 150ms | Small state changes: colour, opacity, focus rings. |
| `press` | 160ms | Press feedback (scale on `:active`). |
| `popup` | 180ms | Selects, menus, popovers, hover cards. |
| `reveal` | 200ms | Collapsible regions. |
| `move` | 200ms | Travel on screen: sliding thumbs, gliding highlights, carets. |
| `slow` | 250ms | Dialogs and larger surfaces. |
| `enter` | 300ms | One-shot entrances of content. The ceiling for UI. |
| `stagger` | 40ms | The gap between items of a group entrance. |
| `sweep` | 1000ms | The prompt bar's send sweep only, the one motion above the 300ms ceiling: decoration nobody waits on, and any shorter it is gone before it is seen travelling. |

| Easing | For |
| --- | --- |
| `ease-out-strong` | Entering, exiting, press, reveals, popups. The default. |
| `ease-move` | Something already on screen that slides: a segmented thumb, a switch thumb, a tab indicator. |
| `ease-in-out-strong` | The same curve as `move`, for something on screen that morphs. |
| `ease-drawer` | Sheets and drawers. |
| `ease-link` | A link's animated underline. |
| built-in `ease` | Colour and opacity. It comes with the `fast`, `base` and `slow` timings of `motion-*`. |
| `linear` | Loops and progress, inside `animate-[…]`. |

**Never `ease-in`** (it delays the start, the moment the user is watching), **never the built-in
`ease-out` or `ease-in-out`** (too weak), **never a literal `cubic-bezier()`**. `move` and
`in-out-strong` belong to thumbs, indicators and reels only.

### Properties

- **Animate `transform` and `opacity`.** Colour, background, `box-shadow` and `filter` are fine
  for state changes.
- **Motion is the same in every browser, or it is not done.** No effect depends on a feature only
  some browsers have and falls back to nothing elsewhere.
- **The one size animation is the reveal**: `grid-rows-[0fr]` to `grid-rows-[1fr]` with
  `motion-size-reveal`.
- **Any other layout property** (width, height, top, left, margin, padding) needs a real reason
  and a `fndn-check-ok: <reason>` comment. The model case is a sliding thumb's `width`: it is
  absolutely positioned and childless, and `scaleX` would distort its radius.
- **Never Tailwind's `transition` utilities and never `transition: all`**: they animate whatever
  changes next. Name the properties with `motion-<what>-<timing>`.
- **A scale takes a share of the size, so it is for things about as wide as a button.** On a wide
  element the same share is many pixels. A popup as wide as its trigger (the list of a select or a
  combobox) scales along the block axis only (`scale-y-popup`), so its sides stay on the trigger's
  sides however wide the field is; a field or its trigger never scales on press.
- **Never `scale(0)`**: nothing appears from nothing. A popup starts at `scale-popup` (0.96) with
  `opacity-0`. A small one-off mark (a status glyph, a badge) starts at `scale(0.5)` with
  `opacity-0`. Check and radio marks do not scale (see the mark recipe below).
- **Do not drive a child's transform from a custom property that changes every frame on a
  parent.**
- **Text at rest is never parked on a transform.** A transform is for while something moves; when
  it stops, the text sits in normal layout, untransformed. At a display scale of 125% or 175% a
  parked offset (`translateY(-3em)`, `translate(-50%, -50%)`) lands on a fraction of a device
  pixel, and the text renders one pixel off the text beside it. The model case is the pager's
  rolling digit: the ten figures are stacked in one cell, the current one has no transform, and
  only the outgoing and incoming figures move.

### Transitions or keyframes

- **Transitions for anything a user can trigger twice in a second**: toggles, popups, highlights,
  selection, expand and collapse. A transition retargets from where it is; a keyframe restarts.
  An entry takes its start from the `starting:` variant, plus `allow-discrete` on `display`
  (`motion-also-[display_var(--fndn-duration-popup)_allow-discrete]`) when the element was hidden.
- **Keyframes only for one-shot entrances of content and for loops.** Use the shared ones: the
  entrances `animate-fade-up`, `animate-fade-in`, `animate-pop-in`, and the loops `fndn-spin`,
  `fndn-shimmer-text`, `fndn-caret-blink`, `fndn-pixel-on`. A keyframe only one component needs is named
  `fndn-<component>-…` and goes in the system's stylesheet (`styles/base.css`); there is no
  stylesheet per component.

### Reduced motion

**`prefers-reduced-motion: reduce` means fewer and gentler, not none: travel becomes a fade.** The
tokens carry it, so add no blanket reduced-motion rules:

| Token | Reduced |
| --- | --- |
| `duration.reveal`, `duration.move`, `duration.stagger`, `duration.sweep` | `0ms` |
| `motion.enter-shift` | `0px` |
| `motion.popup-scale` | `1` |
| `motion.sheet-shift` | `0%` |

Entrances become plain fades, popups fade without scaling, drawers fade in place, thumbs jump,
staggered groups appear together. What the table does not list is not reduced by itself
(`duration.press`, the press scales, a scale of your own): check each one.

**The press scale stays** (`scale-press`, 0.97): it is feedback under the finger, a few pixels over
`duration.press`, not travel across the screen.

**Only loops need a decision per component.** The shimmer stops and shows static text (`ink-2`,
or `accent` for the accent shimmer). Spinners and an indeterminate progress bar keep moving: they
are the loading signal. The pixel grid keeps pulsing (opacity only).

### Choreography

- **One entrance per container.** A region that reveals does not also stagger its children.
- **Stagger only one-shot group entrances**, never menus, dropdown items or rows the user opens
  many times a day. The delay is
  `calc(min(var(--fndn-row-index,0),var(--fndn-motion-stagger-max))*var(--fndn-duration-stagger))`, with
  a fill mode of `both`. The adapter sets `--fndn-row-index` only on the items present at mount; an
  item that arrives later (a streamed row) enters with no delay.
- **Exits are simultaneous, shorter and simpler** than entrances. Popups close at
  `duration.fast`.
- **Keyboard changes are instant.** A popup opened or closed from the keyboard, or by typing,
  appears and goes at once, and so do the carets, thumbs and indicators: they carry
  `kbd-instant`, which drops their transitions while the last input was a key (`trackModality()`
  from `lib/modality.ts` must be running). The gliding highlight is the exception and glides
  between rows; its first appearance lands on the row without travel.
- **The sub-animations of one component share one timing family**, so it reads as one object.
- **Nothing delayed may block interaction.**

### Mount and arrival

**Nothing plays on first paint, and a component never animates its own mount.** What changes after
its first paint may animate: an arrival inside it (a step added to a run, a tab opened, a card
reopened, a row streamed in).

**A mount is an arrival only when the code that adds the component says so**, with `appear`
(boolean, default `false`, as in Vue's `<Transition appear>`), on the components that show
arrivals (approval card, tool chips, task rows, thinking state, context cards, streaming text). Set it on the item your code
appends live, never on what it renders from history or with the page. A component cannot tell a
live arrival from a restored one: server rendering, hydration, a client-side navigation, a switch
of chat threads and a virtualized list re-mounting its rows all mount things that are not new.
With `appear` off, a forgotten prop still gives a correct, still screen. A page-wide "has painted"
flag would replay history on every navigation, and guessing from the DOM is fragile.

**An entrance never runs at mount on its own.** Gate it with `appear` (the adapter records at mount
which items were there and gives them `animate-none` unless `appear` is set), or arm it after the
first paint (`afterPaint` from `lib/paint.ts`, a `ready` variant, a `data-enter` attribute). Items
added after mount always enter.

**An overlay that mounts open is simply there.** A dialog, alert dialog, drawer, popover, hover card
or menu open at mount (`defaultOpen`, or `open` already true) marks its parts `data-mounted-open` until it first
closes, and the recipe's `@starting-style` entrance skips them (`not-data-mounted-open:`). Its close,
and every later open, animate as usual.

**Where a thing is decides how it is drawn, and one animator moves it.** In a component whose
content travels (the carousel), every way of moving it (the pager, a page set from outside, a
drag let go, autoplay) goes through one spring that starts at the speed the content already has:
nothing stops and starts again, a flick goes on in its direction, and a second press retargets the
first. A page set from outside travels like any other, and what names the page (the pager, the
dots) changes when the page is decided, not when the content arrives, so the controls never lag
behind the user's intent. The browser's own smooth scroll is not used: it differs between browsers, starts from a
standstill and is slow. An effect (the carousel's `depth`, `fade`, `parallax`) is drawn from the
position after every change of it, never from a clock and never from a feature only some
browsers have, so it is the same everywhere and cannot drift. Its amounts are tokens that carry
their reduced-motion values, and at rest it leaves no transform at all.

**An effect is sized by what it moves, and big enough to be seen.** A travel that is part of an
effect is a share of the thing's own size, not a fixed few pixels: the carousel's parallax lags a
picture by a fifth of its frame's width, so it reads the same in a small slide and a wide one
(24px in a 384px slide is 6% and cannot be seen). Layers further back lag more. An example of
an effect shows it plainly.

**A loop is a choice, and endless means endless.** The carousel's `loop` is `none`, `rewind` (the
slides run back to the start) or `endless` (the first item follows the last). Where the strip
wraps, it goes on the way it was going: Next never travels back past the others, Previous on the
first item comes in from the other side, a jump to a far item (a dot) goes the shorter way round,
and nothing is copied to fake it (each item is drawn on the turn of the strip nearest the
scroller). Where running back to the start is the point (a finite set of steps), say so
(`loop="rewind"`).

**What moves by itself can be stopped.** Content that advances on a timer (a carousel's
`autoplay`) shows a pause control for as long as it can move, holds while the pointer is over it,
focus is inside it, the page is hidden or it is off screen, stops for good once the user takes
over, and does not start under reduced motion.

**What the pointer removes gives its room back as it fades**: its space closes over
`duration.reveal` (a row's `grid-rows`, a tag's `grid-cols`, from `1fr` to `0fr`) while it fades,
so its neighbours slide into place and are there when it is gone, instead of jumping once it is.
Removed from the keyboard, it goes at once. In a tags input this is the only motion: adding a tag
(Enter, the delimiter, a paste), selecting one and editing one are instant, because they are
keyboard work.

**Arrivals make room**: something inserted after the first paint opens its space (a row from
`grid-rows-[0fr]` to `grid-rows-[1fr]` over `duration.reveal`) while it fades, and never shoves its neighbours in one
frame.

### Recipes

Each is written in the component's recipe with the stylesheet's utilities; none needs a
stylesheet.

| Motion | Classes |
| --- | --- |
| Press: buttons, chips, pills, icon buttons | `motion-transform-press [:root:not([data-fndn-input=keyboard])_&:active]:scale-press` |
| Press: rows, options, menu items, fields and their triggers | `motion-colors-fast active:bg-hover-2`: the background only, no scale. |
| Hover | `motion-colors-fast hover:bg-hover` (`hover:` is already limited to a real pointer). |
| Reveal: a collapsible region | `kbd-instant grid grid-rows-[1fr] motion-size-reveal motion-opacity-base data-[state=closed]:grid-rows-[0fr] data-[state=closed]:opacity-0`, the same two with `starting:data-[state=open]:` for opening from closed, and a direct child that clips (`min-h-0 overflow-hidden`). |
| Popup: select, menu, popover, hover card | Compose `popup` (`lib/popup.ts`) into the content slot; never copy it. It carries the surface, `kbd-instant` and the motion: `origin-(--transform-origin) motion-opacity-popup motion-transform-popup`, from and to `opacity-0 scale-popup`, closing at `duration-fast`. A popup as wide as its trigger (a select's or a combobox's list) composes `popup({ drop: true })`: `scale-y-popup`, the same scale along the block axis only. |
| Dialog | Opens from the centre, not from its trigger. |
| Thumb that slides between options | `kbd-instant motion-transform-glide`. A thumb the engine places (segmented control, tabs) takes the same timing through the engine's variables: `[--transition-duration:var(--fndn-duration-move)] [--transition-timing-function:var(--fndn-easing-move)]`. |
| Entrance: content that appears once | `animate-fade-up` |
| Cross-fade of two states in one cell | The one leaving or waiting is `opacity-0 [filter:blur(2px)]`, with `motion-opacity-fast motion-filter-fast`. |

**Check and radio marks**, wherever one appears (the `checkbox` and `radio-group` components own
them; menus, cards and tables use their markup):

- **The fill leads**: the box's colour and ring change over `duration.fast` with `ease`.
- **The check is drawn, not popped**: a `clip-path` wipe from `inset(0 100% 0 0)` to `inset(0)`
  over `duration.base` with `ease-out-strong`, delayed by `duration.stagger` so it lands on a box
  that is already ink. The indeterminate dash is wiped from its centre. No scale.
- **The exit is shorter and simpler**: the mark fades over `duration.fast`, with no wipe back.
- **The radio is one moving thing**: its inset ring grows from a 1.5px `line-strong` hairline to a
  5px `ink` ring over `duration.base` with `ease-out-strong`, and runs back over `duration.fast`.
- **The press is `scale-press-sm`** (0.9), from the pointer only: 0.97 cannot be seen on a 16px
  control.
- Keyboard changes are instant, nothing runs on first paint, and reduced motion only fades.

### Checking feel

**Code cannot settle feel.** Slow animations down and step through them in the browser's
animation inspector, try gestures on a real phone, and look again the next day.

**"Does it line up" is a question about pixels**, not about DOM rectangles, and its answer changes
with the display scale. Check alignment at a `devicePixelRatio` of 1, 1.25, 1.5 and 2 by comparing
the rows of ink in a screenshot with a static copy of the same text on the same line.
