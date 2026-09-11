---
"@torpor/build": minor
---

Feat: public dir for static host files

Files in `src/public` are served by the dev server and copied verbatim
into the client build output root, so root-level host files (robots.txt,
favicon.ico, .well-known/*, ads.txt and friends) get deployed without
routing or extra configuration. A prerendered site's `dist/client` runs
them straight onto the host, so `robots.txt` can point at the sitemap.
