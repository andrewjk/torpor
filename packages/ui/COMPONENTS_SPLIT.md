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

### TagInput

**Current:** one file (378 lines). Three discrete pieces are inline: the tag
chips (`TagInput.torp:274`, li + text + remove button), the text field, and
the async suggestion listbox (`TagInput.torp:307`).

**Proposed:**

```
TagInput/TagInput.torp             root: tags state, add/remove logic, form field
TagInput/TagInputTag.torp          one chip: text + remove button (the repeated unit)
TagInput/TagInputSuggestions.torp  the loader-backed listbox (@await/@try region + options)
```

The plain text input can stay inline -- it's a bare `<input>` like `Form`'s
`Input`, and there's nothing in it to swap. The two split pieces are where
real markup/appearance lives.

### CommandPalette

**Current:** one file. It composes `Modal`/`ModalOverlay`/`ModalContent`
(already-split components) but then hardcodes its own input, list, items and
empty state (`CommandPalette.torp:165`-204).

**Proposed:**

```
CommandPalette/CommandPalette.torp         root: hotkey, visibility, filter/active state
CommandPalette/CommandPaletteInput.torp    the search input (role="combobox", aria-activedescendant)
CommandPalette/CommandPaletteList.torp     the listbox (incl. empty state)
CommandPalette/CommandPaletteItem.torp     one command row (role="option", label + shortcut)
```

Mirrors how `Modal` itself is split, and consistent with
`ComboBox`/`ComboBoxInput`. The input is the piece most likely to need
restyling (icons, kbd hints).

### DataGrid

**Current:** one file (496 lines), the biggest offender. The header cell +
sort button (`DataGrid.torp:421`), body rows and cells (`DataGrid.torp:451`),
spacer rows (virtualization), and the loading/error/empty states are all
inline. Only the cell _content_ is slot-customizable; the cell/header _markup_
is not.

**Proposed:**

```
DataGrid/DataGrid.torp                  root: state (page/sort/load), keyboard nav, virtualization
DataGrid/DataGridColumnHeader.torp      one th: label, sort button, aria-sort
DataGrid/DataGridCell.torp              one td: role="gridcell", tabindex roving, default slot
```

Optional further splits, in descending value:

- `DataGridRow` (tr + the per-row slot pass-through)
- `DataGridEmpty` / `DataGridLoading` / `DataGridError` (the named-slot
  regions, matching how `Notification` splits `NotificationContent`)

The header/cell pair is the core split: those are the elements a theme has to
target, and they carry the interesting attributes (`aria-sort`,
`data-cell`, alignment classes).

### DatePicker

**Current:** nearly compliant -- uses the `Calendar` subcomponents and has
`DatePickerHeader`, but the trigger button (`DatePicker.torp:169`) and the
content div (`DatePicker.torp:187`) are hardcoded. `SelectBox` and `ComboBox`
-- the other trigger+popout components -- both split these out.

**Proposed:**

```
DatePicker/DatePicker.torp            root: value, form field, popout open/close, focus management
DatePicker/DatePickerTrigger.torp     the display button (aria-haspopup/expanded/controls)
DatePicker/DatePickerContent.torp     the popout div (id, aria-hidden, hidden class)
```

(`DatePickerHeader` already exists.)

### DateRangePicker

**Current:** same shape as `DatePicker` -- `DateRangePickerDay` exists, but
the trigger (`DateRangePicker.torp:243`) and content (`DateRangePicker.torp:261`)
are hardcoded. The two files are otherwise near-copies of each other.

**Proposed:**

```
DateRangePicker/DateRangePickerTrigger.torp
DateRangePicker/DateRangePickerContent.torp
```

Splitting both pickers is also the natural moment to hoist the duplicated
popout open/close/focus logic (setVisible/closeOnClick/focusTrigger is
copy-pasted between `DatePicker.torp:100` and `DateRangePicker.torp:142`)
into the shared `Trigger`/`Content` pair or a `utils/popoutContent` helper.

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
