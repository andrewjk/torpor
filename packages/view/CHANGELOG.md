# @torpor/view

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
