---
"@torpor/ui": patch
---

Fix: form components now apply a changed `name` prop to their input

`Field` captured its `name` once in the `FieldContext`, and `Input`/`TextArea`/
`Select`/`File`/`FileDrop`/`CheckBox`/`Toggle` resolved `name` into a plain
`let` at setup, so changing a field's `name` after mount left the rendered
input with the old attribute (e.g. a keyed list whose indexes shifted after a
removal submitted the wrong form keys). The `Field` context name is now a
getter, and the inputs bind `name` straight from `$props?.name ??
fieldContext?.name` so the attribute updates reactively.
