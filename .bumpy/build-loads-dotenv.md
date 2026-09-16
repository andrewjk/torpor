---
"@torpor/build": patch
---

Fix: load .env when building

`runBuild` now calls `configDotenv()` at startup, matching `runDev` and
`runPreview`. Build-time prerendering goes through the full load pipeline
(including the `_error` page), so route `load` functions can hit the
database or otherwise depend on environment variables from `.env` files.
