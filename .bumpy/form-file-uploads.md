---
"@torpor/build": minor
---

`readForm` can now read submitted files: use the `File` class as the spec's default to
get a single file (missing when no file was selected), or `[File]` to get every
submitted file as an array. Previously File values were stringified, so multipart
submissions could not be handled. Actions with a schema could already receive files --
`File` values pass through validation untouched -- and `+server.ts` endpoints read
multipart bodies natively via `request.formData()`.
