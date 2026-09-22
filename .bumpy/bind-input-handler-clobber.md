---
"@torpor/view": patch
---

Fix: `&value` binding clobbered by a user `oninput` handler on the same element

When an element had both a `&`-binding (`&value`, `&checked`, `&group`) and an
`on<event>` attribute for the same event, the compiler emitted two `t_event`
calls -- and since delegated event handlers are last-write-wins per element
and type, the user handler replaced the binding's state write. Typing in an
`Input`/`TextArea` that passes `oninput` (e.g. `@torpor/ui`'s form fields)
never updated the bound state, so `$bind` chains and `Form.validate()` saw the
initial value forever. The compiler now pairs the two and emits a single
`t_event` that calls the binding write and the user handler in source order.
