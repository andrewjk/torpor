# Things to do

## View

- [ ] Document every exported function
- [ ] Generate $props as unknown if not declared?
- [ ] Can we go back to createElement??
- [ ] Handle multi-line @ifs etc
- [ ] Allow plain text inside @ifs etc?

## UI

- [ ] Many more components
  - [x] Pagination
  - [ ] ListBox
  - [ ] SelectBox (with multiple)
  - [ ] ComboBox (with multiple)
  - [x] ToolBar
  - [ ] DataGrid
  - [ ] Tree
  - [ ] FocusGroup
  - [ ] DatePicker
  - [ ] TimePicker
  - [ ] MaskedInput
  - [ ] ColorPicker
  - [ ] Drag and drop!
  - [ ] Rich text?
- [ ] All of the inputs should work in forms
- [ ] Charts need to be split into components
  - [ ] Add RingChart (for showing values in rings)
  - [ ] Add ColumnChart
- [ ] Calendar needs to be split into components
- [ ] Fix Slider
- [ ] Loading functions for most components (for virtual grids, filtered options from the network etc)

## Build

- [ ] Probably should name it better (`@torpor/launch`?)
- [ ] Schema validation in routes?
- [ ] Type-safety when calling endpoints
- [ ] Type-safety in forms
- [ ] Separate hooks into pre- and post-
  - [ ] Maybe do the same with middleware -- I don't love next() methods
- [ ] Code-based routing

## Language tools

- [ ] More TypeScript support
- [ ] Preview for code gen
- [ ] Preview for HTML
- [ ] Check for unused styles (with warning!)
- [ ] Syntax highlighting for incomplete control statements e.g. `@if (` where the if should be highlighted

## Dev tools

- [ ] Info for state -- property values, subscriptions
- [ ] Info for effects -- function text, subscriptions
- [ ] Info for controls -- branches
- [ ] Info for regions -- ?
- [ ] Incorporate the debug diagrams
