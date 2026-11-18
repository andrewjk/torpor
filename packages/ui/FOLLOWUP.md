# Follow-ups

Findings from a review of the `packages/ui` components. "Confirmed" items were
reproduced with a throwaway test; the rest come from reading the source.

## Bugs

## Missing components

Roughly in priority order:

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
