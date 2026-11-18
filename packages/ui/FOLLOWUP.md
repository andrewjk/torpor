# Follow-ups

Findings from a review of the `packages/ui` components. "Confirmed" items were
reproduced with a throwaway test; the rest come from reading the source.

## Bugs

## Duplication and inconsistencies

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
