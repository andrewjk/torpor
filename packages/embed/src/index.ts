// Loading and running embeds (client side)
export { default as mountEmbed } from "./loader/mountEmbed";
export { default as hydrateEmbed } from "./loader/hydrateEmbed";

// Host ↔ embed bridge
export { default as createBridge } from "./bridge/createBridge";
export { default as scopeBridge } from "./bridge/scopeBridge";

// Version compatibility
export { default as checkVersion } from "./checkVersion";

// Errors
export { default as EmbedCompileError } from "./types/EmbedCompileError";
export { default as EmbedVersionError } from "./types/EmbedVersionError";

export type {
	EmbedArtifact,
	EmbedBridge,
	EmbedBridgeHandlers,
	EmbedEventSource,
	EmbedHandle,
	EmbedOptions,
	EmbedStyle,
} from "./types";
