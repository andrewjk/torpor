---
"@torpor/view": patch
---

Fix: store component region with $onmount functions so that any $run effects inside the $onmount can be attached to the correct region
