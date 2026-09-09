---
"@torpor/build": patch
---

Fix: a form re-render no longer fails the load query validation when the
action url drops query params (form errors render instead of an error
redirect), and the action name is read from the `?/name` query key so forms
work on urls that already carry a query string.
