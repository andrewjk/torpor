---
"@torpor/view": minor
---

!Fix: stop interpolating quoted attribute values

BREAKING: Quoted attribute values no longer interpolate `{...}`; use `{expression}` or a backtick template literal.
