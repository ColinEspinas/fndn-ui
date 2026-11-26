---
name: screen-review
description: Review or build a whole screen made from fndn/ui (a showcase app, a docs page, a block shown in a product context), judged against the real product it imitates. Use whenever you build, critique or fix anything bigger than one component. Complements the component-level skills (emil-design-eng, animate, review-animations), which judge one component at a time and miss composition, density and the weight of chrome against content.
---

# Screen review

The component skills judge one piece at a time; a screen can pass all of them and still look
wrong. This skill is the method for judging the whole screen the way a person sees it at first
glance. The criteria are not here: they are the rules of `docs/DESIGN.md`, and each step below
names the section to judge by.

What a screen built from correct components typically gets wrong: code that wraps in an editor,
32px tree rows in an explorer, browser tabs that do not attach to the toolbar, a gridded card table
for an issue list, grey filled boxes for pressed toggles, docs-site pieces (a copy button, a code
block's tab strip, a pill toggle) standing in for product chrome, a box inside a box, and something
that plays on first paint.

## The method

1. **Name the real product** the screen imitates (VS Code / Zed, Chrome / Arc, Linear / GitHub
   issues, Stripe dashboard …) and look at it, or a public screenshot of it, at the same width.
   Judge by that comparison, not by taste in the abstract (`docs/DESIGN.md`, Start from the
   product, which also gives the density each kind of product takes).
2. **Measure, do not eyeball**: row heights, text sizes of chrome against content, the number of
   filled and pill-shaped elements. Then name the three heaviest marks on the screen (fill, size,
   colour, motion): each must be the main action or the content.
3. **Go through the screen section by section of `docs/DESIGN.md`**: Surfaces and depth, Ink and
   colour, Controls, Laying out a screen (which component for which look, what wraps and what is
   cut), Every state of a view (the first frame, empty, loading, selected), Overlays, Phone. A
   finding names the rule it breaks.
4. **One batched pass** under the conditions `AGENTS.md` lists (Design work), and at two desktop
   widths, 1280 and 1536, since a screen has more ways to break than a component. At 390 the
   desktop patterns give way to the phone's own (`docs/DESIGN.md`, Phone).
5. **App or component?** Report every finding as one or the other. A component gap is fixed in
   the component (spec, recipe, three adapters, test), never patched in the app.

## Before calling a screen done

An independent review: someone (a person or an agent) who did not build the screen runs this
method and writes the findings; the builder fixes them; the reviewer checks again. Self-review is
not enough for screens.
