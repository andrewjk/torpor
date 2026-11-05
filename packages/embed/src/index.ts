// Loading and running embeds (client side)
export { default as mountEmbed } from "./loader/mountEmbed";
export { default as hydrateEmbed } from "./loader/hydrateEmbed";

// Version compatibility
export { default as checkVersion } from "./checkVersion";

// Errors
export { default as EmbedCompileError } from "./types/EmbedCompileError";
export { default as EmbedVersionError } from "./types/EmbedVersionError";

export type { EmbedArtifact, EmbedHandle, EmbedOptions, EmbedStyle } from "./types";
