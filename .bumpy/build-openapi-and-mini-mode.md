---
"@torpor/build": minor
---

- OpenAPI generation via the CLI or at runtime
- New mini build mode with server code generation
- Nested hooks (like layouts); middleware/hooks `next()` renamed to `enter()`/`exit()`
- Adapters now integrate as Vite plugins
- Support for downloading files on form submit; standardized HTTP header casing
- Fixes: stale dependency cache on dev startup, manifest `load` export detection, `pathToRegex` splat params
