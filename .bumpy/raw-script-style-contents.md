---
"@torpor/view": patch
---

!Fix: treat inline script/style contents as raw

BREAKING: Inline `<script>` and `<style>` contents are literal now; use `@html` for dynamic script/style markup.
