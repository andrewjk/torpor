---
"@torpor/view": patch
"@torpor/build": patch
---

Fix: replace the `development` export condition with a custom `torpor:source`
condition. Vite's dev server activates `development` by default, so registry
installs resolved `@torpor/view` (and `@torpor/view/dev`) to the unpublished
`src/` files and failed with "Failed to resolve import ... Does the file
exist?" errors in `tb --dev`. The custom condition is only activated when the
framework is linked into the app (source mode), so published installs now
always resolve the compiled `dist` files.
