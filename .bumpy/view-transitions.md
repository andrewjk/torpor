---
"@torpor/build": minor
---

Feat: view transitions and scroll restoration

Client navigations now run inside `document.startViewTransition` (where the
browser supports it), so pages cross-fade by default and can be animated
with `::view-transition-old/new` CSS. The initial hydration skips the
transition. Scroll position is reset when moving to a different page, kept
for same-page navigations (query changes, form action re-renders), and
restored on back/forward from the scroll saved into the history entry.
