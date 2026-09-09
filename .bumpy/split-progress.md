---
"@torpor/ui": minor
---

Feat: split Progress into subcomponents

The `Progress` is now composed of a `ProgressIndicator` (the bar that
fills the track), with its own props and styling. With no children the
indicator is still rendered automatically, so existing usage is unchanged.
