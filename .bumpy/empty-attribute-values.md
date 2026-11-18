---
"@torpor/view": patch
"@torpor/embed": patch
---

Fix: empty attribute values -- `alt=""` rendered as `alt="&quot;&quot;"` and `alt={""}` dropped the attribute
