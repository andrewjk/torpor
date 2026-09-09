---
"@torpor/ui": minor
---

Feat: split TagInput into subcomponents

The `TagInput` is now composed of `TagInputTag` (one chip each, with their
own props and styling), `TagInputField` (the text field) and
`TagInputSuggestions` (the loader-backed suggestion list). With no children
everything is still rendered automatically, so existing usage is unchanged.
