---
"@torpor/build": patch
---

Fix: view transitions are opt-in

Client navigations no longer run inside `document.startViewTransition` by
default, so pages no longer cross-fade when navigating. Set
`site.viewTransitions = true` in site.config.ts to opt in; pages then
cross-fade and can be animated with `::view-transition-old/new` CSS. The
initial hydration still skips the transition, and scroll restoration is
unaffected.
