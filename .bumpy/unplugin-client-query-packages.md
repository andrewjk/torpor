---
"@torpor/unplugin": minor
---

Fix: `?client`/`?server` overrides now reach components from torpor packages

The import-query override added for `test: true` projects only rewrote
specifiers ending in `.torp`, so `import { Progress } from "@torpor/ui/Progress"`
(or a `phosphor-torpor` icon) inside a client-compiled component still
compiled server-side -- and silently rendered nothing when mounted. The
override is now passed on to bare imports that resolve into packages that
ship `.torp` files (detected via the package's `torpor` field or its
exports), and through their plain-JS re-export barrels, so a whole component
tree mounts correctly regardless of whether it comes from the project or a
package.
