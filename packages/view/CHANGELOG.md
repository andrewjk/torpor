# @torpor/view

## 0.4.6

### Patch Changes

- ebef5ae: Fix: map head element attributes
- f4a85c3: Fix: type errors in control statements
- 986ea9e: Fix: map @html params
- b2ae05b: Fix: map component attributes => props
- b8c8122: Fix: assignment assertions in shortcut attributes
- 4c80139: Fix: map user-supplied $props

## 0.4.5

### Patch Changes

- 39a4b1f: Fix: scoping class attributes with multiple values

## 0.4.4

### Patch Changes

- 84b5b9e: Fix: for var names before commas

## 0.4.3

### Patch Changes

- 00a1868: Fix: escape quotes in dev boundary names

## 0.4.2

### Patch Changes

- d1bc0cc: Fix: ensure that dev context is always in scope

## 0.4.1

### Patch Changes

- d5bfa0c: Fix: ensure that context is in scope

## 0.4.0

### Minor Changes

- 168dff3: !Edit: rename Range to Region to avoid name conflicts
- 42c6b60: !Fix: transitions

### Patch Changes

- 255aad3: Fix: slightly better source mapping
- 8b377a2: Fix: nested for statements
- 450b739: Fix: nested for var names
- fc60fe0: Fix: only re-push regions on subsequent control runs
- 2818679: Fix: for var after `!`
- 38fd0a5: Fix: create a typed $props param
- 3e6f3f7: Fix: replace for variable names in component props
- 051998b: Feat: very rudimentary dev tools

## 0.3.4

### Patch Changes

- 07d8266: Fix: share var names between @head and @render

## 0.3.3

### Patch Changes

- 456f793: Fix: be less fancy about unused $context and $slots

## 0.3.2

### Patch Changes

- f4716c5: Fix: isolate components
- 1253f7a: Fix: handle unclosed elements
- 6268e00: Fix: run @if, @switch and @await with cached signals
- f2fb547: Fix: better type definition generation

## 0.3.1

### Patch Changes

- 29f5441: Chore: re-add the CJS build for @torpor/view

## 0.3.0

### Minor Changes

- 51dbba7: Chore: drop CJS build and go ESM only
- 9fcc613: Feat: add proper signals reactivity
- c4f9d18: !Feat: replaced <:head> with @head
- 5598bc9: !Feat: remove `:` from special tags and attributes
- c2b5c02: Feat: source maps

### Patch Changes

- be98b35: Fix: keep options when setting a new proxied value
- 2298a87: Fix: SVG classes
- 3a8431a: Fix: run @ifs, @switches and @awaits with a closure signal
- eb58d37: Feat: ReactiveDate wrapper for use in reactive state
- e0637be: Fix: moving a range that was in a fragment
- f5f84e6: Fix: slightly better global style parsing
- 6cc57ff: Fix: don't double render slots
- 18f1ccf: Perf: combine fragment effects
- 91d1536: Fix: re-check whether the parent is a fragment
- 4dc16df: Fix: slightly better selector style parsing
- 543b229: Fix: run @ifs and @switches with an index signal
- 3cf3ae6: Fix: skip hydration start when getting the root

## 0.2.0

### Minor Changes

- b716d5c: Feat: inline styles during SSR

### Patch Changes

- c38f914: Fix: moving a range that was in a fragment
- 995d950: Fix: merge :class and class (making :class obsolete)
- 014bda0: Fix: skip hydration start when getting the root

## 0.1.11

### Patch Changes

- 741a289: !Refactor: rename runLayoutSlot to fillLayoutSlot

## 0.1.10

### Patch Changes

- 74bf42d: Fix: store (and clear) the right layout slot ranges

## 0.1.9

### Patch Changes

- df6c62b: Fix: remove alert!

## 0.1.8

### Patch Changes

- 1be84b1: Fix: component hydration nodes

## 0.1.7

### Patch Changes

- 14f7694: Fix: reset anchor nodes after hydration

## 0.1.6

### Patch Changes

- 1866f30: Fix: set range end nodes correctly when hydrating
- a31647f: Feat: `@async function` in @render
- 951a86f: Feat: re-use layout data and UI
- 6d6fb89: Feat: top-level control statements in @render
- 9c13f0f: Feat: allow multiple top-level elements in @render

## 0.1.5

### Patch Changes

- f390b78: Fix: don't scope media queries and CSS properties

## 0.1.4

### Patch Changes

- daba2ad: Fix: passing `:class` and `:style` to components

## 0.1.3

### Patch Changes

- de51225: Fix: passing `:class` and `:style` to components

## 0.1.2

### Patch Changes

- 0e69292: Fix: null check
- b69fde1: Fix: replace for var names in control statements

## 0.1.1

### Patch Changes

- f9fd76d: Fix: make sure an animated element has been added
- 1ddc240: Fix: delay $mount effects until after hydrating
- 7b9dc31: Fix: bind refs first, so they can be used in attributes

## 0.1.0

### Minor Changes

- 995513a: Break: specify binding with `&` rather than `:`

### Patch Changes

- 98602ec: Fix: don't re-run the entire loop/control statement
- a49d307: Fix: allow const destructuring in components
- c9a9cf8: Fix: flush :onmounts when adding a fragment
- cbd07ca: Feat: bind component props with `&name`
- f53b184: Feat: watch $props
- 215db17: Fix: allow $unwrapping a null object
- 95e866b: Feat: shortcut syntax for object properties

## 0.0.14

### Patch Changes

- fb896c6: Fix: make sure we've got $props on the server
- 85bccf6: Fix: apply scope to elements without a class

## 0.0.13

### Patch Changes

- ed4a6db: Fix: include quoted content in styles

## 0.0.12

### Patch Changes

- ff5f459: Fix: scope more styles

## 0.0.11

### Patch Changes

- 78e78b9: Fix: use the existing fragment name

## 0.0.10

### Patch Changes

- 3cf6de6: Fix: use namespace when creating svg fragments

## 0.0.9

### Patch Changes

- 47c5277: Chore: update dependencies

## 0.0.8

### Patch Changes

- a8ead36: Fix: always pass $context down

## 0.0.7

### Patch Changes

- b90d729: Dumb: forgot to build

## 0.0.6

### Patch Changes

- 808da4c: Fix: hydrating a node with empty text

## 0.0.5

### Patch Changes

- 44cf656: Fix: replace @for vars in even more places

## 0.0.4

### Patch Changes

- 76dd6ea: Fix: return on invalid style
- 8f0a0a1: Fix: replace @for vars in more places

## 0.0.3

### Patch Changes

- Fix: component names can only start with A-Z
- Fix: handle empty strings in functions
- Fix: type errors
- Fix: always move next after adding a fragment
- Fix: rewrite @for vars in braces
