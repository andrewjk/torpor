---
"@torpor/build": minor
---

Feat: flash messages

Actions can set a one-time values store that survives a redirect:
`event.flash.set("Project saved")` (stored as `{ message }`), or any
JSON-safe object (`event.flash.set({ error: "Import failed" })`). The
values ride in a session-lifetime cookie that is deleted when it is read,
so the redirected page shows them exactly once -- the render pipeline
consumes them into `$page.flash`, the same pattern as `$page.form`. No
signing: flash values are plain values to render as text, no secret is
needed, and reads/writes stay synchronous. Without cookies the action
still completes -- the banner is simply skipped.
