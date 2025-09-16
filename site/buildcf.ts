import { run } from "@torpor/build/run";

// On Cloudflare, running `tb` doesn't seem to work. We get this error, BEFORE build is built:
//
// WARN  Failed to create bin at /opt/buildhome/repo/site/node_modules/.bin/tb.
//       ENOENT: no such file or directory, open '/opt/buildhome/repo/packages/build/dist/bin/index.js'
//
// So instead we build from code...

const workingDir = process.cwd();
await run(workingDir, "build");
