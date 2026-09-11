---
"@torpor/build": minor
---

Feat: runtime sitemap endpoints

`site.sitemap` accepts a runtime config alongside the build-time boolean:
`sitemap = { get: async (event) => ["/posts/a", "/posts/b"] }` serves the
XML live on each request, reading the database (typically), so sitemaps
can keep up with content that isn't prerendered (blog posts under
`[slug]`, for example). The urls returned are base-free paths and the
site origin is added. The path defaults to `/sitemap.xml` and `origin`
can override `site.origin` for the file.
