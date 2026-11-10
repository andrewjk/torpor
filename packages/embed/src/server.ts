// Compiling embeds from source (server side)
export { default as compileEmbed } from "./server/compileEmbed";
export { default as recompileEmbed } from "./compile/recompileEmbed";
export { RUNTIME_VERSION } from "./generated/version";
export { default as assertRunnable } from "./server/assertRunnable";
export { default as getRuntimeVersion } from "./server/getRuntimeVersion";
export { default as renderEmbed } from "./server/renderEmbed";
export { default as startRenderServer } from "./server/service/startRenderServer";
export { default as createServiceRenderer } from "./server/service/createServiceRenderer";
export type { CompileEmbedOptions } from "./server/compileEmbed";
export type { RenderEmbedOptions } from "./server/renderEmbed";
export type { RenderServer, RenderServerOptions } from "./server/service/startRenderServer";
export type {
	ServiceRenderer,
	ServiceRendererOptions,
	ServiceRenderOptions,
} from "./server/service/createServiceRenderer";

// Re-exported for hosts that only import from @torpor/embed/server
export { default as createBridge } from "./bridge/createBridge";
export { default as EmbedCompileError } from "./types/EmbedCompileError";
export { default as checkVersion } from "./checkVersion";

export type {
	EmbedArtifact,
	EmbedBridge,
	EmbedBridgeController,
	EmbedBridgeHandlers,
	EmbedOptions,
	EmbedRenderResult,
	EmbedStyle,
} from "./types";
