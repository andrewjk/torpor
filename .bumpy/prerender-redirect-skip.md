---
"@torpor/build": patch
---

Fix: skipped redirects don't fail prerendering

Prerendering rendered `/_error?status=404` through the root layout
whenever an `_error` route exists, and on an empty database the
layout's load redirects to a setup page -- the 303 counted as a
prerender failure, so a site could never be built before its first
user existed. Redirect responses are now treated as skips (the page
isn't shipped, the skip is logged) instead of failures, for both
prerendered pages and the error page.
