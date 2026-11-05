// Compiling embeds from source (server side)
export { default as compileEmbed } from "./server/compileEmbed";
export { default as assertRunnable } from "./server/assertRunnable";
export { default as getRuntimeVersion } from "./server/getRuntimeVersion";
export { default as renderEmbed } from "./server/renderEmbed";
export type { CompileEmbedOptions } from "./server/compileEmbed";
export type { RenderEmbedOptions } from "./server/renderEmbed";

// Re-exported for hosts that only import from @torpor/embed/server
export { default as EmbedCompileError } from "./types/EmbedCompileError";
export { default as checkVersion } from "./checkVersion";

export type {
	EmbedArtifact,
	EmbedBridge,
	EmbedOptions,
	EmbedRenderResult,
	EmbedStyle,
} from "./types";
