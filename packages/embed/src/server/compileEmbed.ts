// Backward-compatible path: the compile implementation lives in
// src/compile (no Node builtins, see @torpor/embed/compile). This module
// only re-exports it so existing imports from the server entry keep
// working -- but note that importing @torpor/embed/server pulls in the
// Node-only renderers. Edge/worker hosts should import from
// @torpor/embed/compile directly.
export { default } from "../compile/compileEmbed";
export { scanImports, type CompileEmbedOptions } from "../compile/compileEmbed";
export { default as recompileEmbed } from "../compile/recompileEmbed";
export { RUNTIME_VERSION } from "../generated/version";
