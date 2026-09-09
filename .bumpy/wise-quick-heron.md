---
"@torpor/build": patch
---

Fix: a form re-render no longer fails the load query validation when the
action url drops query params (form errors render instead of an error
redirect), and the action name is read from the `?/name` query key so forms
work on urls that already carry a query string. Also fixed: a `+server`
route's server hook can short-circuit the request again (an enter response
was being ignored), and the test harness now runs the same request handlers
as the site server.
