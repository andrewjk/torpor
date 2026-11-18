# Follow-ups

Findings from a review of the `packages/ui` components. "Confirmed" items were
reproduced with a throwaway test; the rest come from reading the source.

## Bugs

### ColorPicker submits a stale value after the hex input is cleared (confirmed)

Clearing the hex input commits `undefined` to the picker, but the palette is
passed `value={$state.value}` and (because of the `$bind` issue above) keeps
its old value -- the old swatch stays `aria-checked`, and the palette's own
hidden input still submits the cleared color.

### ColorPalette tab stop and arrow keys (confirmed)

- The roving tab stop is always swatch 0 when focus hasn't entered the group,
  not the selected swatch (APG radio group; SegmentedControl and TabGroup
  already get this right).
- Clicking a swatch doesn't call `group.handleItemFocus`, so the tab stop
  isn't updated by mouse interaction.
- Only Left/Right move (focus group is horizontal); the swatches render as a
  grid, so Up/Down should move by row.
- Space on the checked swatch clears it, which radio groups don't normally
  do -- worth deciding deliberately (Rating's `allowClear` precedent).

### Other ColorPicker issues

- `ColorPicker` declares an `id` prop but never renders it; the root also has
  no `role="group"` / `aria-label`.
- Swatch accessible names are the raw hex (`#ff0000`), read out character by
  character. Colors should accept names, e.g. `{ value, name }`.
- `defaultPalette` groups are uneven (6/5/6/5/5/5) so they can't form clean
  rows; blues run dark-to-light while every other hue runs light-to-dark;
  values are uppercase but compared lowercased.
- `ColorPickerInput` commits on both `onchange` and `onblur`; `syncInput` and
  the `$run` beside it duplicate the same logic.
- `mix`, `luminance`, `hexToRgb`, `rgbToHex` in `utils/colorUtils.ts` are
  unused.
- `ColorPicker` passes `colors={$props?.colors ?? defaultPalette}` although
  the palette already defaults.
- It isn't a full color picker: no saturation/value area, hue or alpha
  sliders, eyedropper, or `rgb()`/`hsl()` parsing. Either build those out or
  name/document it as a swatch picker.

### Nested inputs inside a Field double-submit (likely, unverified)

`<Field><SelectBox><SelectBoxContent><ListBox>` (as in
`test/SelectBox/components/SelectBoxFormTest.torp` and the site examples):
`ListBox` resolves the Field's name via `createFormField` just like
ColorPalette does, so it probably adds a second hidden input and a second
validation path while mounted. Same likely applies to ComboBox. A general
fix: composite inputs should hide the Field context (or pass a flag) from the
inputs they contain.

### Drag and drop is unreachable

`mount/draggable.ts`, `mount/dropTarget.ts`, `utils/dragState.ts` and
`utils/reorderList.ts` are not in the `package.json` exports and nothing in
the package uses them, so the "done" drag-and-drop item in PLAN.md can't be
used by consumers. Add an export (e.g. `./mount` and/or `./dnd`).

### Props captured once at setup

The compiler warns that `type` in `Form/Input.torp` and `inputId` in
`Form/FileDrop.torp` are plain `let`s initialized from `$props`, so they won't
update when props change.

### Smaller issues

- `Charts/GridLines.torp` declares `id` and `class` props but renders neither.
- Popover's doc comment mentions a non-existent `PopoverTriggerContextual`.
- Dialog's structure comment shows `<ModalOverlay />` inside `<Dialog>`.

## Missing components

Roughly in priority order:

- **Tooltip** (APG tooltip: `role="tooltip"`, `aria-describedby`, Escape to
  dismiss, opens on focus as well as hover). `PopoverHover` is not this.
- **RadioGroup / Radio** in the Form family -- there's a `CheckBox` but no
  radio.
- **ToggleButton / ToggleGroup** (`aria-pressed`). Related: `Form/Toggle` is
  actually the APG Switch, so the name will clash with a toggle button;
  consider renaming it `Switch`.
- **Meter** (`role="meter"`), distinct from Progress.
- **Full color picker** (see above).
- **Sortable list** built on the unused DnD utilities, including the keyboard
  move-before/move-after commands PLAN.md mentions.
- Smaller: OTP/PIN input, combined DateTimePicker, inline Alert
  (`role="alert"`, non-toast), VirtualList (only DataGrid virtualizes),
  Rich text (already in PLAN.md).

## Duplication and inconsistencies

- **Popover / Contextual are near-copies**: root, trigger, content and the
  ~100-line `*Hover` component differ only in names and comments. Make
  Contextual a positioning mode of Popover, or share one core.
- **Modal / Drawer are near-copies**: root, overlay and trigger differ only
  in names.
- **Form wiring is duplicated**: `Form/*` (Input, TextArea, Select, CheckBox,
  Toggle, File, FileDrop) re-implements the blurred/validate logic that
  `utils/formField.ts` (`createFormField`) provides.
- **Form submission isn't uniform**: most inputs use `FormValues`;
  DatePicker and DateRangePicker hand-roll hidden inputs, and DateRangePicker
  submits `name-start` / `name-end` while other multi-value inputs submit
  repeated `name` entries.
- **Too much nesting for the common case**: a SelectBox in a Field needs
  `&value` written on Field, SelectBox and ListBox across four levels (ties
  in with the open PLAN.md "sensible defaults" item).
- **Loader exported twice**: `createItemLoader` / `normalizeLoadResult` come
  from both `./ComboBox` and `./SelectBox`; DataGrid, Tree and TagInput use it
  too. Give it its own `./loader` subpath.
- **Two chart axis systems**: legacy `XAxis` / `YAxis` / `GridLines` are still
  exported for ScatterChart alongside `ChartXAxis` / `ChartYAxis` / `ChartGrid`.
  Move ScatterChart onto `Chart` and drop the legacy ones.
- **Naming drift**: internal `SubmenuPopoutTrigger` uses `onRegister` /
  `onActivate` while everything else is lowercase (`PopoutClickTrigger` uses
  `onactivate`); DataGrid has `onsortchange` where others use `onchange`.
- **Disabled checks** are a mix of `disabled === true` (24) and
  `disabled ?? false` (8).
- **No site docs pages** for FocusGroup or MaskedInput.
