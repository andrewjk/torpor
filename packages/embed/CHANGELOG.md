# Changelog

## 1.0.2

<sub>2026-11-26</sub>

- _(patch)_ Fix: parse artifacts with host-supplied components

## 1.0.1

<sub>2026-11-19</sub>

- _(patch)_ Fix: empty attribute values -- `alt=""` rendered as `alt="&quot;&quot;"` and `alt={""}` dropped the attribute

## 1.0.0

<sub>2026-11-11</sub>

- _(major)_ Feat: restricted-only artifacts; js-format removed
- _(minor)_
  Feat: add @torpor/embed, for compiling and rendering torpor components authored at runtime (REPLs, feed embeds, custom sections)
- _(minor)_ Feat: host-embed bridge (createBridge, $embed prop injection) for events and host API calls from embeds
- _(minor)_ Feat: renderEmbed server-side rendering with optional worker isolation and hard timeouts
- _(minor)_ Feat: mountEmbedFrame, sandboxed iframe embeds with the bridge over postMessage
- _(minor)_ Feat: module-format artifacts (compileEmbed module mode, mountModuleEmbed/hydrateModuleEmbed, resolveImport rewriting)
- _(minor)_ Feat: render service (startRenderServer + createServiceRenderer) for container-isolated server rendering
- _(minor)_ Perf: cache option evaluates loaded code once per artifact object
- _(minor)_ Feat: edge-safe compile entry (@torpor/embed/compile) with RUNTIME_VERSION
- _(minor)_ Feat: css option so sandboxed frames inherit the host theme
- _(minor)_ Feat: maxHeight clamp for iframe auto-height
- _(minor)_ Feat: listenEmbedFrame, the host side of the frame protocol for URL-served frames
- _(minor)_ Feat: maxSourceBytes compile cap against runaway author input
- _(minor)_ Feat: CSP nonce options for injected styles and frame documents
- _(minor)_ Feat: recompileEmbed recovers stored artifacts after a runtime upgrade
- _(minor)_ Perf: runtimeUrl serves the frame runtime from a cached URL instead of inlining per iframe
- _(minor)_ Feat: injectable scope, so embeds can import host components and helpers
- _(minor)_ Feat: renderEmbed returns the embed's scoped styles for styled first paint
- _(minor)_ Feat: frameBridgeScript, the frame-side protocol bootstrap for raw-HTML frame documents
- _(minor)_ Feat: EMBED_CHANNEL constant and channel option for the frame protocol
- _(minor)_ Feat: restricted mode (compileRestricted/renderRestricted) — no-eval server rendering with first-party data sources
- _(minor)_
  Feat: http source kind for restricted embeds (createHttpSource + httpRequirementKind) with default-deny origins and credential-name bindings
- _(minor)_ Feat: derive source kind for restricted embeds (filter/map/sort/limit with host formatters and budgets)
- _(minor)_
  Feat: restricted SSR emits hydration markers — hydrateEmbed adopts restricted output with byte-parity to the Node server build
- _(minor)_ Feat: restricted templates support client state — SSR paints initial $watch values, full reactive torpor on the client
- _(minor)_
  Feat: renderRestricted calls host server components with slot-prop fills, matching JS-build hydration markers byte-for-byte
- _(minor)_
  Feat: renderRestricted passes scoped class props on component usages as [value, "torp-<hash>"] arrays, matching the JS server build
- _(minor)_ Feat: derive aggregates — count/sum/min/max/average produce a single object over filtered rows
- _(minor)_
  Feat: restrictedComponent wraps restricted artifacts as components of other restricted templates, with incoming slots and slot props
- _(minor)_ Fix: restrictedComponent inlines the inner artifact's styles into head, matching the JS server build
- _(minor)_
  Fix: restricted slot regions guard auto-closed wrappers — violating fills throw at render time, violating fallbacks are compile errors
- _(minor)_ Feat: restricted app manifests and render data output
- _(minor)_ Feat: per-origin field allowlists in http source
- _(minor)_ Feat: onAudit hook records restricted requirement reads
- _(minor)_ Feat: host-to-embed push over the bridge
- _(minor)_ Fix: align embed entry exports with the public API
- _(minor)_ Feat: manifest-only data requirements
- _(minor)_ Feat: declared bridge surface in app manifests
- _(minor)_ Feat: rename the restricted tier to artifact
- _(minor)_ Fix: scanner-based import stripping in client builds
- _(patch)_ Docs: bridge typing pattern (method overloads + cast)
- _(patch)_ Docs: CSP guidance per embed format and tier
- _(patch)_ Types: FrameToHost/HostToFrame message unions with an authoritative protocol description
- _(patch)_ Docs: pin styled-embed head/styles behavior and clarify dedupe guidance
- _(patch)_ Types: EmbedApiBridge helper for typed bridge contracts
- _(patch)_ Fix: silence Vite dynamic-import bundler warning
- _(patch)_ Fix: keep the server bridge out of render props
- _(patch)_ Docs: write-approval recipe for bridge invokes
- _(patch)_ Docs: state the private-when-shared invariant
