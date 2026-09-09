# Components to split

The library pattern (see `Accordion`) is one main component plus one file per
discrete piece of functionality -- `AccordionItem`, `AccordionHeader`,
`AccordionTrigger`, `AccordionContent`. This keeps each component ~99% style
free: the user composes the subcomponents they need and targets each one with
its own props/classes, or swaps them out entirely.

A lot of the newer components were written as single `.torp` files with the
subcomponents hardcoded inline in the template. This is a survey of which
components deviate, what should be split out of each, and which ones are
genuinely fine as-is.

## Naming conventions already in use

Consistent with existing splits:

- `XTrigger` -- the interactive opener (`AccordionTrigger`, `PopoverTrigger`,
  `SelectBoxTrigger`, `MenuPopoutTrigger`)
- `XContent` -- the panel/popout body (`AccordionContent`, `DrawerContent`,
  `SelectBoxContent`, `ComboBoxContent`)
- `XItem` -- the repeated unit (`AccordionItem`, `BreadcrumbItem`,
  `ListBoxItem`, `SegmentedItem`, `PaginationItem`)
- `XHandle` -- the draggable/movable grip (`SplitterHandle`)
- `XIndicator` -- a visual state marker (`MenuIndicator`)
- `XHeader`, `XOverlay`, `XContainer`, `XSeparator`, ...

---

## Needs splitting

Ordered roughly by priority: the first two are small, self-contained and
illustrate the pattern; the middle ones are more involved; `DataGrid` is the
biggest job.

### ColorPicker

**Current:** partially compliant -- `ColorPalette` is already split out, but
the hex input (`ColorPicker.torp:138`, with its own commit/revert state
machine) is inline.

**Proposed:**

```
ColorPicker/ColorPickerInput.torp   the hex text field (sync/commit/revert logic moves with it)
```

Small, and it completes the palette/input pairing described in PLAN.md.

---

## Fine as-is

- **NumberInput** -- a single `<input role="spinbutton">`. Nothing to target
  separately; it's in the same category as `Form`'s `Input`/`TextArea`. If
  stepper buttons are ever added, that's the moment to split a
  `NumberInputButton` out.
- **MaskedInput** -- same: one `<input>`, formatting logic only.
- **Form** -- a flat directory of small single-purpose components (`Field`,
  `Label`, `Message`, `Input`, ...). Already matches the spirit; no
  monoliths.
- **Pagination** -- `Pagination` + `PaginationItem` already.
- **Notification, Modal, Popover, Drawer, Dialog, SelectBox, ComboBox,
  ListBox, Menu, MenuBar, NavMenu, ToolBar, Tree, TabGroup, Stepper,
  Splitter, Carousel, Calendar, Charts, Disclosure, Breadcrumb, Contextual,
  FocusGroup, SegmentedControl** -- already split along the pattern.
- **icons** -- one file per icon by design.

---

## Mechanics for each split

- New `.torp` files in the component's directory, exported from that
  directory's `index.ts`.
- No `package.json` changes needed -- exports map per directory, not per file.
- Keep the existing `torp-<kebab>` class names on the extracted elements so
  existing themes keep working (e.g. `SliderRange` keeps `.torp-slider-fill`).
- Each component has a matching directory under `packages/ui/test/`; tests
  will need updating to the new composition (or keep using the root
  component, which should still render a sensible default internally if we go
  the auto-render route -- see the PLAN.md item "auto-rendered
  trigger/content ... so the 80% usage isn't four levels of nesting").
- Root components should keep working standalone where feasible
  (`<Slider />` with no subcomponents should still render track/fill/handle
  internally), with the subcomponents as the escape hatch -- this matches how
  `SelectBox` auto-renders options when none are slotted.
