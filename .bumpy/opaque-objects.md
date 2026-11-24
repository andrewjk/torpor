---
"@torpor/view": minor
---

!Fix: only deep-wrap plain reactive objects

BREAKING: Class instances, RegExp, typed arrays and other non-plain or non-extensible objects are no longer deep-watched.
