import { existsSync, promises as fs } from "node:fs";
import path from "node:path";

/**
 * The cache policy for content-hashed build assets: their names change
 * whenever their content does, so they can be kept for a year without
 * revalidating. (Mirrors `run/assetHeaders.ts` in @torpor/build, which does
 * the same for the Node server.)
 */
const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

/**
 * Whether a file name has a Vite content hash (e.g. `clientEntry-BUKMQ_H9.js`).
 * Files from a site's `src/public/assets` folder keep their own names.
 */
function isHashedAsset(name: string): boolean {
	return /-[A-Za-z0-9_-]{8}\.[A-Za-z0-9]+$/.test(name);
}

/**
 * The `_headers` rules that let Cloudflare cache the hashed files in
 * `assets/` for a year. Without them Cloudflare serves every asset with its
 * default policy, which makes browsers revalidate each file on every visit.
 * Unhashed files in `assets/` have the header detached again, so they keep
 * Cloudflare's default.
 */
export function assetHeadersRules(assetNames: string[], base = ""): string {
	let rules = `${base}/assets/*\n  Cache-Control: ${IMMUTABLE_CACHE_CONTROL}\n`;
	for (const name of assetNames) {
		if (!isHashedAsset(name)) {
			rules += `${base}/assets/${name}\n  ! Cache-Control\n`;
		}
	}
	return rules;
}

/**
 * Writes the asset caching rules to the Cloudflare folder's `_headers` file.
 * A `_headers` file the site provides (in `src/public`) is kept, after the
 * generated rules, so its own rules can still change the asset headers.
 *
 * @param base The site's base path ("" for none), whose subfolder holds the
 * client output; `_headers` itself always sits at the folder root
 */
export async function writeAssetHeaders(cloudflareFolder: string, base = ""): Promise<void> {
	const assetsFolder = path.join(cloudflareFolder, base, "assets");
	const names = existsSync(assetsFolder) ? await listFiles(assetsFolder) : [];
	if (names.length === 0) return;

	const file = path.join(cloudflareFolder, "_headers");
	// A site's own `_headers` was copied into the base subfolder with the
	// rest of `src/public`, where Cloudflare won't read it
	const siteFile = path.join(cloudflareFolder, base, "_headers");
	if (base && existsSync(siteFile)) {
		await fs.rename(siteFile, file);
	}
	const existing = existsSync(file) ? await fs.readFile(file, "utf-8") : "";
	const rules = assetHeadersRules(names, base);
	await fs.writeFile(file, existing ? `${rules}\n${existing}` : rules);
}

async function listFiles(folder: string, prefix = ""): Promise<string[]> {
	const names: string[] = [];
	for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
		const name = prefix + entry.name;
		if (entry.isDirectory()) {
			names.push(...(await listFiles(path.join(folder, entry.name), `${name}/`)));
		} else {
			names.push(name);
		}
	}
	return names;
}
