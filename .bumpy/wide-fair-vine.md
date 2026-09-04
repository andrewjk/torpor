---
"@torpor/view": patch
---

Fix: dev servers no longer run the framework from source. `tb --dev` resolves
`@torpor/view` to its compiled dist for registry installs; the source-based
`development` export conditions are now only active when the framework is
symlinked into the app (workspace/`link:` installs), so `src` is no longer
shipped in the release.
