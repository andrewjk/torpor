---
"@torpor/ui": minor
---

Feat: split Rating into subcomponents

The `Rating` is now composed of `RatingStar` components (one radio-button
star each, with their own props, styling and slot content for custom
glyphs). With no children the stars are still rendered automatically, so
existing usage is unchanged.
