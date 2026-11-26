## Motion

What moves, how fast and with which utility, and what never moves. Motion is feedback and
orientation, never decoration. The system is a crisp tool: fast, quiet, exact. When unsure whether
something should move, it should not.

The tool's `check` reports what can be read from code: a literal duration, a weak or literal
easing, `transition: all`, `scale(0)`, a transition on a layout property, an ungated `:hover`. A
line that must break a rule carries a `fndn-check-ok: <reason>` comment on it or on the line above.

### Should it animate at all

| How often it is seen | Decision |
| --- | --- |
| 100+ times a day | No animation. |
| Tens of times a day (hover, list navigation, toggles) | Colour or opacity only, at `fast` or `base`. |
| Occasionally (popups, dialogs, reveals, entrances) | The standard motion in the recipes below. |
| Rarely or once (success, onboarding) | May carry a little delight. |

However often it is seen, a change made from the keyboard is instant, with one exception
(Choreography).

**Every animation names its purpose**: feedback, spatial consistency, state indication,
preventing a jarring change, or explanation. "It looks nice" on something seen daily is a reason
to delete it.

### Timing

**Durations and delays come from the duration tokens**: the `motion-*`, `duration-*` and
`delay-*` utilities, or `var(--fndn-duration-*)` in CSS. Only loops (`infinite`) may use a literal
time. One vocabulary keeps every hover, press and popup in step, and lets reduced motion be
handled once, in the tokens.

**300ms is the ceiling for anything the user waits on** (`enter`). The one motion above it is the
prompt bar's send sweep (`sweep`, 1000ms): a decoration nobody waits on, which any shorter is gone
before it is seen travelling.

| Token | Value | For |
| --- | --- | --- |
| `fast` | 100ms | Hover and colour feedback; every popup's exit. |
| `tooltip` | 125ms | Tooltips, tiny popovers. |
| `base` | 150ms | Small state changes: colour, opacity, focus rings. |
| `press` | 160ms | Press feedback (scale on `:active`). |
| `popup` | 180ms | Selects, menus, popovers, hover cards. |
| `reveal` | 200ms | Collapsible regions. |
| `move` | 200ms | Travel on screen: sliding thumbs, the list highlight, carets. |
| `slow` | 250ms | Dialogs and larger surfaces. |
| `enter` | 300ms | One-shot entrances of content. |
| `stagger` | 40ms | The gap between items of a group entrance. |
| `sweep` | 1000ms | The prompt bar's send sweep only. |

| Easing | For |
| --- | --- |
| `ease-out-strong` | The default: entering, exiting, press, reveals, popups, and travel that answers the user (the list highlight, carets, a reel of figures). |
| `ease-move` | A thumb or indicator that slides between options: a segmented control's thumb, a switch's thumb, a tab indicator. It is the curve of the `glide` timing. |
| `ease-in-out-strong` | The same curve as `move`, for something already on screen that travels by itself from one place to another (the pointer on an agent's screen). |
| `ease-drawer` | Sheets and drawers. |
| `ease-link` | An underline that draws itself under a label on hover. |
| built-in `ease` | Colour and opacity. It comes with the `fast`, `base` and `slow` timings of `motion-*`. |
| `linear` | Loops and progress, inside `animate-[…]`. |

**Never `ease-in`** (it delays the start, the moment the user is watching), **never the built-in
`ease-out` or `ease-in-out`** (too weak), **never a literal `cubic-bezier()`**.

Motion is written with these utilities:

| Utility | Meaning |
| --- | --- |
| `motion-<what>-<timing>` | A transition. what: `colors` `opacity` `shadow` `transform` `filter` `size` `radius`. timing: `fast` `base` `slow` (built-in `ease`) · `press` `move` `reveal` `popup` `tooltip` `enter` `fast-out` `base-out` `slow-out` (`ease-out-strong`) · `glide` (`duration.move` on `ease-move`, for thumbs and indicators). They compose: `motion-colors-fast motion-shadow-base motion-transform-press`. `motion-also-[…]` adds one written out. |
| `duration-*`, `delay-*` | The duration tokens above. |
| `ease-*` | The easings above. |
| `scale-press`, `scale-press-sm` | Press: 0.97; 0.9 for controls of 20px or less. |
| `scale-popup`, `scale-y-popup` | A popup's start and end (0.96, with `starting:`); along the block axis only for a popup as wide as its trigger. |
| `squeeze-press`, `squeeze-press-sm`, `squeeze-popup` | The same scales on the `scale` property, for an element whose `transform` already moves it. |
| `animate-fade-up`, `animate-fade-in`, `animate-pop-in` | One-shot entrances of content, only on what code adds while the user watches (Mount and arrival). |
| `kbd-instant`, `kbd:` | Drop transitions while the last input was the keyboard; a variant for anything else that differs then. |
| `hover:` | Already gated to a real pointer: a tap never leaves it stuck. |

The `glide` timing is for thumbs and indicators. The highlight that travels in a list of options
is called the list highlight here (`glideLayer` and `glide()` in `lib/glide.ts` build it); it
moves at `duration.move` on `ease-out-strong`.

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
  sides however wide the field is.
- **Never `scale(0)`**: nothing appears from nothing. A popup starts at `scale-popup` (0.96) with
  `opacity-0`. A small one-off mark (a status glyph, a badge) starts at `scale(0.5)` with
  `opacity-0`. Check and radio marks do not scale.
- **Do not drive a child's transform from a custom property that changes every frame on a
  parent.**
- **Text at rest is never parked on a transform.** A transform is for while something moves; when
  it stops, the text sits in normal layout, untransformed (the pager's rolling digit). At a
  display scale of 125% or 175% a parked offset (`translateY(-3em)`, `translate(-50%, -50%)`)
  lands on a fraction of a device pixel, and the text renders one pixel off the text beside it.

### Transitions or keyframes

- **Transitions for anything a user can trigger twice in a second**: toggles, popups, highlights,
  selection, expand and collapse. A transition retargets from where it is; a keyframe restarts.
  An entry takes its start from the `starting:` variant, plus `allow-discrete` on `display`
  (`motion-also-[display_var(--fndn-duration-popup)_allow-discrete]`) when the element was hidden.
- **Keyframes only for one-shot entrances of content and for loops.** Use the shared ones: the
  entrances `animate-fade-up`, `animate-fade-in`, `animate-pop-in`, and the loops `fndn-spin`,
  `fndn-shimmer-text`, `fndn-caret-blink`, `fndn-pixel-on`. A keyframe only one component needs is
  named `fndn-<component>-…` and goes in the system's stylesheet (`styles/base.css`); there is no
  stylesheet per component.

### Choreography

- **One entrance per container.** A region that reveals does not also stagger its children.
- **Stagger only one-shot group entrances**, never menus, dropdown items or rows the user opens
  many times a day. Items enter `duration.stagger` apart, and the delay stops growing after five
  (`motion.stagger-max`), so a long list does not keep the user waiting. An item that arrives
  later (a streamed row) enters with no delay.
- **Exits are simultaneous, shorter and simpler** than entrances. Popups close at
  `duration.fast`.
- **Keyboard changes are instant.** A popup opened or closed from the keyboard, or by typing,
  appears and goes at once, and so do carets, thumbs and indicators: they carry `kbd-instant`,
  which drops their transitions while the last input was a key (`trackModality()` from
  `lib/modality.ts` must be running). **The one exception is the list highlight**, which travels
  under the arrow keys too, because it shows where the highlight went; its first appearance lands
  on the row without travel.
- **Arrivals and removals make room.** Something inserted after the first paint opens its space
  (a row from `grid-rows-[0fr]` to `grid-rows-[1fr]` over `duration.reveal`) while it fades in,
  and never shoves its neighbours in one frame. What the pointer removes gives its room back the
  same way as it fades (a row's `grid-rows`, a tag's `grid-cols`, from `1fr` to `0fr`), so its
  neighbours slide into place and are there when it is gone. Removed from the keyboard, it goes at
  once.
- **The sub-animations of one component share one timing family**, so it reads as one object.
- **Nothing delayed may block interaction.**

### Mount and arrival

**Nothing plays on first paint, and a component never animates its own mount.** What changes after
its first paint may animate: an arrival inside it (a step added to a run, a tab opened, a card
reopened, a row streamed in).

**A mount is an arrival only when the code that adds the component says so**, with `appear`
(boolean, default `false`, as in Vue's `<Transition appear>`), on the components that show
arrivals (their docs list it). Set it on the item your code appends live, never on what it renders
from history or with the page. A component cannot tell a live arrival from a restored one: server
rendering, hydration, a client-side navigation, a switch of chat threads and a virtualized list
re-mounting its rows all mount things that are not new. With `appear` off, a forgotten prop still
gives a correct, still screen; a page-wide "has painted" flag would replay history on every
navigation, and guessing from the DOM is fragile. An entrance of your own is armed the same way:
by `appear`, or after the first paint (`afterPaint` from `lib/paint.ts`).

**An overlay that mounts open is simply there.** A dialog, drawer, popover or menu open at mount
(`defaultOpen`, or `open` already true) is drawn at once; its close, and every later open, animate
as usual.

### Content that travels

- **One animator moves it.** In a component whose content travels (the carousel), every way of
  moving it goes through one animator that starts at the speed the content already has: nothing
  stops and starts again, a flick goes on in its direction, and a second press retargets the
  first. What names the position (a pager, dots) changes when the destination is decided, not
  when the content arrives, so the controls never lag behind the user's intent.
- **An effect is drawn from the position**, after every change of it, never from a clock, so every
  way of moving draws the same thing and nothing drifts. Its amounts are tokens that carry their
  reduced-motion values, and at rest it leaves no transform.
- **An effect is sized by what it moves, and big enough to be seen.** A travel inside an effect is
  a share of the thing's own size, not a fixed few pixels, so it reads the same small and wide (a
  carousel's parallax lags by a fifth of its frame); layers further back move more.
- **A loop that wraps goes on in its direction** and never runs back past the others. Running back
  to the start is a separate choice, for a finite set of steps.
- **What moves by itself can be stopped** (WCAG 2.2.2). Content that advances on a timer (a
  carousel's autoplay) shows a pause control for as long as it can move, holds while someone
  points at it or works in it, and does not start under reduced motion.

### Reduced motion

**`prefers-reduced-motion: reduce` means fewer and gentler, not none: travel becomes a fade.** The
tokens carry it, so add no blanket reduced-motion rules. These are every token that is reduced:

| Token | Reduced |
| --- | --- |
| `duration.reveal`, `duration.move`, `duration.stagger`, `duration.sweep` | `0ms` |
| `motion.enter-shift` | `0px` |
| `motion.popup-scale` | `1` |
| `motion.sheet-shift` | `0%` |
| `motion.carousel-depth-scale`, `motion.carousel-depth-opacity` | `1` |
| `motion.carousel-parallax-shift` | `0` |

Entrances become plain fades, popups fade without scaling, drawers fade in place, thumbs jump,
staggered groups appear together. What the table does not list is not reduced by itself
(`duration.press`, the press scales, a scale of your own): check each one.

**The press scale stays** (`scale-press`, 0.97): it is feedback under the finger, a few pixels over
`duration.press`, not travel across the screen.

**A loop decides for itself.** A loop that is the loading signal keeps moving (a spinner, an
indeterminate progress bar); a loop that only decorates stops and shows its still state (a
shimmer's text).

### Recipes

Each is written in the component's recipe with the stylesheet's utilities; none needs a
stylesheet.

| Motion | Classes |
| --- | --- |
| Press: buttons, chips, pills, icon buttons | `motion-transform-press [:root:not([data-fndn-input=keyboard])_&:active]:scale-press` |
| Press: rows, options, menu items, fields and their triggers | `motion-colors-fast active:bg-hover-2`: the background only, no scale. |
| Hover | `motion-colors-fast hover:bg-hover` (`hover:` is already limited to a real pointer). |
| Reveal: a collapsible region | `kbd-instant grid grid-rows-[1fr] motion-size-reveal motion-opacity-base data-[state=closed]:grid-rows-[0fr] data-[state=closed]:opacity-0`, the same two with `starting:data-[state=open]:` for opening from closed, and a direct child that clips (`min-h-0 overflow-hidden`). |
| Popup: select, menu, popover, hover card | Compose `popup` (`lib/popup.ts`) into the content slot; never copy it. It carries the surface, `kbd-instant` and the motion: `origin-(--transform-origin) motion-opacity-popup motion-transform-popup`, from and to `opacity-0 scale-popup`, closing at `duration-fast`. A popup as wide as its trigger composes `popup({ drop: true })`. |
| Thumb that slides between options | `kbd-instant motion-transform-glide`. A thumb the engine places takes the same timing through the engine's variables: `[--transition-duration:var(--fndn-duration-move)] [--transition-timing-function:var(--fndn-easing-move)]`. |
| Entrance: content that appears once | `animate-fade-up` |
| Cross-fade of two states in one cell | The one leaving or waiting is `opacity-0 [filter:blur(2px)]`, with `motion-opacity-fast motion-filter-fast`. |
