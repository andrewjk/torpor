---
"@torpor/ui": minor
---

Feat: split ColorPicker into subcomponents

The `ColorPicker` is now composed of its `ColorPalette` alongside a new
`ColorPickerInput` (the hex text field, with its own props and styling).
With no children everything is still rendered automatically, so existing
usage is unchanged.
