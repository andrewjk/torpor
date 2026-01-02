# Things to do

## View

- [ ] Document every exported function
- [ ] Generate $props as unknown if not declared?
- [ ] Can we go back to createElement??

## UI

- [ ] Many more components
  - [x] Pagination
  - [x] ListBox
  - [x] SelectBox
    - [ ] with multiple option
  - [x] ComboBox
    - [ ] with multiple option
  - [x] ToolBar
  - [ ] Toggle
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
- [ ] Split out PopoverTrigger / PopoverHover? (and ContextualTrigger and ModalTrigger)
- [ ] Charts need to be split into components
  - [ ] Add ColumnChart
- [x] Calendar needs to be split into components
- [ ] Fix Slider
- [ ] Loading functions for most components (for virtual grids, filtered options from the network etc)
- [ ] Plain theme -- unset all buttons, var(--border-color) etc

## Build

- [ ] Probably should name it better (`@torpor/launch`?)
- [ ] Schema validation in routes?
- [ ] And hooks (as pre and post)
- [ ] Type-safety 
  - [ ] In app data
  - [ ] When calling endpoints
  - [ ] In forms
  - [ ] In params for e.g. [slug]
- [ ] Separate hooks into pre- and post-
  - [ ] Maybe do the same with middleware -- I don't love next() methods
- [ ] Code-based routing

## Language tools

- [ ] More TypeScript support
- [ ] Preview for code gen
- [ ] Preview for HTML
- [ ] Check for unused styles (with warning!)
- [ ] Syntax highlighting for incomplete control statements e.g. `@if (` where the if should be highlighted
- [ ] Handle multi-line @ifs etc

## Dev tools

- [ ] Info for state -- property values, subscriptions
- [ ] Info for effects -- function text, subscriptions
- [ ] Info for controls -- branches
- [ ] Info for regions -- ?
- [ ] Incorporate the debug diagrams
