// Compiling embeds from source (server side)
export { default as compileEmbed } from "./server/compileEmbed";
export { default as assertRunnable } from "./server/assertRunnable";
export { default as getRuntimeVersion } from "./server/getRuntimeVersion";
export type { CompileEmbedOptions } from "./server/compileEmbed";

// Re-exported for hosts that only import from @torpor/embed/server
export { default as EmbedCompileError } from "./types/EmbedCompileError";
export { default as checkVersion } from "./checkVersion";

export type { EmbedArtifact, EmbedOptions, EmbedStyle } from "./types";
