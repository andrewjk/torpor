---
"@torpor/build": minor
---

Feat: `invokeHook` for calling server hooks in-process

`@torpor/build/server` now exports `invokeHook(hook, event)`, which runs a
server hook's `enter` function and returns its `Response` (or undefined),
so code that invokes endpoints in-process can honor a hook's short-circuit
response. A hook declared with `satisfies ServerHook<"...">` keeps its
implementation's inferred return type -- usually `void` -- so calling
`hook.enter(event)` directly doesn't type the result as `Response | void`;
`invokeHook` accepts any `ServerHook` and preserves the widened signature.
