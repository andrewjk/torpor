---
"@torpor/ui": minor
---

Feat: split CommandPalette into subcomponents

The `CommandPalette` is now composed of a `CommandPaletteInput` (the search
field), a `CommandPaletteList` (the filtered listbox) and
`CommandPaletteItem` rows (label plus shortcut, with slot content for custom
rows), each with their own props and styling. With no children everything is
still rendered automatically, so existing usage is unchanged.
