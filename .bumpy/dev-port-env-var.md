---
"@torpor/build": patch
---

Fix: `--dev` honors the `PORT` env var

The dev server always bound port 7059 (auto-incremented by vite when
busy) -- `process.env.PORT` was only used for the "Connecting to" log
line, so anything scripting dev servers had to parse the "Listening
on ..." output to learn the actual port. `runDev` now applies `PORT`
to the vite server port, matching `--preview`.
