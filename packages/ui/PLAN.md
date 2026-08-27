# UI: Consistency & A11y Pass

Goal: make all interactive components behave identically at the interaction
layer -- one pattern for registration, state, keyboard handling, and aria
attributes -- so each component only implements its own semantics.

## Interaction layer

- [x] `registerItem` always takes the item's state (MenuBar, Menu, NavMenu,
      ToolBar and Pagination converted from positional callbacks; Accordion's
      vestigial `setFocused` param removed)
- [x] Remove `setChecked`, `setVisible` etc from registration -- state flows
      through `registerItem` only
- [x] Convert values to strings when toggling an item (`sameValue` in
      createItemGroup: primitives compare as strings, objects by reference);
      int-based tests in itemGroup.test.ts prove coercion works
- [x] Remove `data-disabled`; use the item's state / `disabled` attribute
- [x] Handle disabled items (including keyboard navigation skipping) for all
      disableable items (Menu family + NavMenu + ToolBar via the shared
      `focusItem` util, ListBox arrow/home/end skipping, Tree visible-item
      scans; Accordion/TabGroup already skipped)
- [x] Standardise keyboard handling across all components via
      `utils/focusItem.ts`
- [x] Replace `popoutContext.focusFirstElement?.()` style declarations with a
      shared `FocusApi` interface (utils/PopoutTypes.ts) extended by
      PopoutContext, PopoverContext, SelectBoxContext, ComboBoxContext,
      ModalContext and MenuBarItemContext

## Aria / roles

- [x] Components with role "menu", "listbox", "tree", "grid", "dialog" set the
      role in popout context (`contentRole`), so popout can use it for
      `aria-haspopup`
- [x] Standardise trigger attributes: `aria-haspopup` (from the content's
      `contentRole`, falling back to "true"), `aria-expanded` and
      `aria-controls` (from the content's published `contentId`)

## API cleanup

- [x] Remove `PaginationTrigger`; replace with `PaginationItem` (now covers
      everything the trigger did: `disabled` prop, chevron icons and aria
      labels for start/previous/next/end)
- [x] Compare all similar components (`XPopoutContent`, `XPopoutTrigger` etc)
      and align their APIs: every trigger/content pair now generates a default
      id, renders it as a fallback and publishes `triggerId`/`contentId`
      through its context state (NavMenu included); remaining behavioral
      differences are recorded in FOLLOWUP.md

## API consistency

Found while reviewing the component APIs from a consumer's perspective:

- [x] Collapse the four submenu popouts (`MenuPopout`, `MenuBarItem`,
      `ToolBarPopout`, `NavMenuPopout`) onto one shared primitive -- they all
      use the same context and popout core now, so only the wrappers differ.
      Commit to git with "Fix: consolidate submenu popouts"
- [ ] Make submenus first-class (e.g. `<MenuItem label="Subpages">` renders its
      own trigger/content), so one menu tree doesn't need two `ariaLabel`s and
      the library doesn't need `contentRole` detection to recognize a submenu
      Commit to git with "Feat: first-class submenus"
- [x] Standardise event names: Tree's `onExpandedChange` / `onSelectedChange`
      vs `onchange` / `onopen` / `onclose` everywhere else.
      Renamed to `onchange` (selection) and `onexpand` (expansion); also
      renamed `TreeItem.onExpand`/`onSelect` to lowercase `onexpand`/`onselect`.
      Renamed `Pagination.number` to `page`; documented Calendar's
      `onchange` (date selected) vs `onchangedate` (visible month changed)
      Commit to git with "Fix: standardise event names"
- [ ] Sensible defaults for the common cases: auto-rendered trigger/content
      for SelectBox etc., so the 80% usage isn't four levels of nesting

## Component review

Work through the [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/)
for each component to make sure accessibility is correct, plus check against the
interaction-layer and aria standards above, with deviations fixed inline.

- [x] Accordion
- [x] Breadcrumb
- [x] Calendar (day cells still need row/gridcell structure -- see FOLLOWUP.md)
- [x] Charts
- [x] ComboBox
- [x] Contextual
- [x] Dialog
- [x] Disclosure
- [x] Drawer
- [x] Form
- [x] ListBox
- [x] Menu
- [x] MenuBar
- [x] Modal
- [x] NavMenu
- [x] Notification
- [x] Pagination
- [x] Popover
- [x] SelectBox
- [x] TabGroup
- [x] ToolBar
- [x] Tree

## Backlog (new components / features)

- [x] SelectBox with multiple option
- [x] ComboBox with multiple option
- [x] Toggle
- [x] DataGrid (static `data` or network `load`; sorting, paging, keyboard
      nav per the APG grid pattern. The loader shape -- `LoadRequest` /
      `LoadResult` / `Loader` in utils/loader.ts -- is the shared contract
      other components should adopt for reading from the network, e.g.
      ComboBox auto-complete)
- [ ] FocusGroup
- [x] DatePicker
- [ ] TimePicker
- [ ] MaskedInput
- [ ] ColorPicker
- [ ] Drag and drop
- [ ] Rich text
- [x] All inputs should work in forms
- [ ] Split out PopoverTrigger / PopoverHover (and ContextualTrigger,
      ModalTrigger?)
- [x] Split Charts into components; add ColumnChart. The cartesian charts
      are now layered: the `Chart` container owns the layout
      (utils/chartLayout.ts) and publishes it via context; ChartValueAxis
      (left/right/bottom), ChartCategoryAxis (bottom/left), ChartGrid,
      ChartColumns, ChartBars and ChartLines compose freely inside it.
      ColumnChart = vertical columns per value (grouped under each series
      label); BarChart = horizontal bars with category labels on the left
      and value ticks along the bottom. ColumnChart/BarChart/LineChart are
      now thin presets over the layers; ScatterChart still uses its own
      two-axis furniture (XAxis/YAxis/GridLines kept for it, un-exported
      eventually). Future chart types (area, stacked columns...) are new
      mark layers over the same context
- [x] Fix Slider (rewritten: `role="slider"` with aria-valuemin/max/now,
      keyboard support per the APG pattern -- arrows/Home/End/PageUp/PageDown,
      mouse drag on track and thumb, disabled state, two-way `value` binding;
      tests in test/slider)
- [ ] Loading functions for most components (virtual grids, filtered options
      from the network etc) -- shared `Loader` contract in utils/loader.ts
      (`createItemLoader`); adopted by DataGrid (paged/sorted requests) and
      ComboBox + SelectBox (options loaded from the network, rendered
      automatically when no content is slotted in). Tree lazy child loading
      still to do
- [ ] Plain theme -- unset all buttons, var(--border-color) etc

## Order

1. Interaction layer first -- it defines the standard everything is reviewed
   against
2. Aria / roles alongside, since registration carries role state
3. API cleanup (PaginationTrigger removal, component comparison)
4. API consistency (naming/taxonomy) -- renames are cheaper before the review
   and before anyone depends on them
5. Component review against the new standards
6. Backlog items last, built on the standardized patterns

## New Component Ideas

Candidates not covered above, aligned with the WAI-ARIA APG patterns the rest
of the library follows:

- [x] Progress (determinate and indeterminate, `role="progressbar"`; pairs
      with the shared Loader contract for network waits)
- [x] Rating (APG pattern; star / score input with keyboard support)
- [x] Carousel (APG pattern; slide regions with next/previous and dot controls)
- [x] Splitter (APG window splitter; resizable panes with keyboard resize)
- [x] SpinButton / NumberInput (APG pattern; could be the building block for
      TimePicker)
- [x] TagInput (free-text multi-value "chip" input; complements the multiple
      option on SelectBox / ComboBox)
- [x] SegmentedControl (compact single-select, possibly TabGroup-based)
- [x] Stepper (multi-step / wizard flow)
- [x] DateRangePicker (extend Calendar / DatePicker with range selection)
- [x] CommandPalette (Modal + ComboBox composition for app-wide actions)
- [x] FileDrop (file upload with drag and drop, in the Form family)
