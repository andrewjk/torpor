---
"@torpor/build": patch
"@torpor/ui": patch
---

Fix: package detection for strict exports maps

`findTorporPackages` skipped packages whose `exports` map has no `.` or
`./package.json` entry (like `@torpor/ui`): both `require.resolve` calls
threw `ERR_PACKAGE_PATH_NOT_EXPORTED`, so the package was never excluded
from dep optimization or added to `ssr.noExternal`. The resolver now falls
back to the standard node_modules lookup paths, and `@torpor/ui` exports
its own package.json.
