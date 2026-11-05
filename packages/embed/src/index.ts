// Loading and running embeds (client side)
export { default as mountEmbed } from "./loader/mountEmbed";
export { default as hydrateEmbed } from "./loader/hydrateEmbed";

// Module-format embeds (real ES modules)
export { default as mountModuleEmbed } from "./loader/mountModuleEmbed";
export { default as hydrateModuleEmbed } from "./loader/hydrateModuleEmbed";

// Host ↔ embed bridge
export { default as createBridge } from "./bridge/createBridge";
export { default as scopeBridge } from "./bridge/scopeBridge";

// Sandboxed iframe embeds (untrusted authors)
export { default as mountEmbedFrame } from "./frame/mountEmbedFrame";
export { default as listenEmbedFrame } from "./frame/listenEmbedFrame";
export { default as frameScript } from "./frame/frameScript";
export { default as frameDocument, safeJson, safeAttribute } from "./frame/frameDocument";

// Version compatibility
export { default as checkVersion } from "./checkVersion";

// Errors
export { default as EmbedCompileError } from "./types/EmbedCompileError";
export { default as EmbedVersionError } from "./types/EmbedVersionError";

export type {
	EmbedArtifact,
	EmbedArtifactImport,
	EmbedBridge,
	EmbedBridgeHandlers,
	EmbedEventSource,
	EmbedFrameHandle,
	EmbedFrameOptions,
	EmbedHandle,
	EmbedOptions,
	EmbedRenderResult,
	EmbedStyle,
} from "./types";
export type { EmbedScope } from "./loader/scope";
export type { ModuleEmbedOptions } from "./loader/prepareModule";
