# Components to split

The library pattern (see `Accordion`) is one main component plus one file per
discrete piece of functionality -- `AccordionItem`, `AccordionHeader`,
`AccordionTrigger`, `AccordionContent`. This keeps each component ~99% style
free: the user composes the subcomponents they need and targets each one with
its own props/classes, or swaps them out entirely.

A lot of the newer components were written as single `.torp` files with the
subcomponents hardcoded inline in the template. All of them have now been
split; what was done is recorded below, followed by the components that were
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

## Split (done)

Each root keeps working standalone -- with no children the subcomponents are
rendered automatically -- with the subcomponents as the escape hatch. This
matches how `SelectBox` auto-renders options when none are slotted.

- **Slider** -- `Slider` / `SliderRange` (fill) / `SliderHandle` (thumb with
  `role="slider"` + keyboard). State and pointer math stay in the root and
  are shared through a `SliderContext`.
- **Progress** -- `Progress` / `ProgressIndicator` (bar). Matches
  `MenuIndicator` naming.
- **Rating** -- `Rating` / `RatingStar` (one radio-button star each, with a
  slot for custom glyphs).
- **TimePicker** -- `TimePicker` / `TimePickerPart` (hour/minute/second
  spinbutton segments) / `TimePickerPeriod` (AM/PM toggle). This also gained
  the missing site docs page.
- **TagInput** -- `TagInput` / `TagInputTag` (chip) / `TagInputField` (text
  field, a subcomponent so full composition stays wired) /
  `TagInputSuggestions` (loader-backed listbox, self-gating on open state).
- **CommandPalette** -- `CommandPalette` / `CommandPaletteInput` /
  `CommandPaletteList` / `CommandPaletteItem` (label + shortcut, with a slot
  for custom rows).
- **DataGrid** -- `DataGrid` / `DataGridColumnHeader` (th + sort button) /
  `DataGridCell` (td + roving tabindex). The root's cell template forwards
  through the cell as its children, so `$slot.row` / `$slot.column` /
  `$slot.value` keep working. This also gained the missing site docs page.
- **DatePicker** -- `DatePicker` / `DatePickerTrigger` (display button, with
  a slot for custom labels) / `DatePickerContent` (popout, rendering the
  selectable calendar by default through context).
- **DateRangePicker** -- `DateRangePicker` / `DateRangePickerTrigger` /
  `DateRangePickerContent`. The trigger/content wiring lives in a
  `DateRangePickerShellContext`, separate from the day-highlighting
  `DateRangePickerContext`.
- **ColorPicker** -- `ColorPicker` / `ColorPalette` (already existed) /
  `ColorPickerInput` (hex field with its commit/revert state machine,
  reading the shared value and reporting through context). This also gained
  the missing site docs page.

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
