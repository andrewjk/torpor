/**
 * The client chunks to preload for each page, worked out from the client
 * build's manifest: the client entry's own chunks, and each page or layout
 * route's chunks (by route path), as absolute paths like `/assets/x.js`.
 */
export default interface ModulePreloads {
	entry: string[];
	routes: Record<string, string[]>;
}
