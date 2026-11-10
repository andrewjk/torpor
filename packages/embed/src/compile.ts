// Compiling embeds from source. This entry has no Node builtins: it runs in
// Node, workers (Cloudflare etc.) and browsers alike. The Node-only server
// entry (@torpor/embed/server) re-exports these plus the renderers.
export { default as compileEmbed } from "./compile/compileEmbed";
export { default as recompileEmbed } from "./compile/recompileEmbed";
export { RUNTIME_VERSION } from "./generated/version";
export { default as EmbedCompileError } from "./types/EmbedCompileError";
export type { CompileEmbedOptions } from "./compile/compileEmbed";

export type { EmbedArtifact, EmbedArtifactImport, EmbedStyle } from "./types";
