---
"@torpor/view": minor
---

!Fix: detect components from imports and local declarations

BREAKING: Components must be imported or declared in the same `.torp` file; unimported capitalized tags are now compile errors instead of being treated as components.
