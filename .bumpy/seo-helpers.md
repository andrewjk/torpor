---
"@torpor/build": minor
---

Feat: SEO helpers

`seo()` in `@torpor/build/seo` builds a page's head from its values: a
title, a description and (when an image or url is included) Open Graph /
Twitter metas. Endpoint `head` data is now rendered at render time
(escaped, with layouts losing to the page and everything losing to the
first title in the compiled `@head` markup), which also activates the
previously-unused head property. For sitemaps, `site.sitemap = true` (or a
custom path) writes a build-time `sitemap.xml` listing the prerendered
pages, requiring `site.origin` for the urls. robots.txt stays a plain
static file on the host.
