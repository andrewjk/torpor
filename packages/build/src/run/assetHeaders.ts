import path from "node:path";
import contentType from "../server/contentType.ts";

/**
 * The cache policy for content-hashed build assets. Their names change
 * whenever their content does, so browsers and CDNs can keep them for a year
 * without revalidating; a new deploy references new names.
 */
export const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

/**
 * Whether a file in `assets/` has a Vite content hash in its name (e.g.
 * `clientEntry-BUKMQ_H9.js`). Files a site's `src/public/assets` folder put
 * there keep their own names, so they're not hashed and must not be cached
 * forever.
 */
export function isHashedAsset(file: string): boolean {
	return /-[A-Za-z0-9_-]{8}\.[A-Za-z0-9]+$/.test(path.basename(file));
}

/** The response headers for a file served from `dist/client/assets`. */
export function assetHeaders(file: string): Record<string, string> {
	const headers: Record<string, string> = { "Content-Type": contentType(path.extname(file)) };
	if (isHashedAsset(file)) {
		headers["Cache-Control"] = IMMUTABLE_CACHE_CONTROL;
	}
	return headers;
}
