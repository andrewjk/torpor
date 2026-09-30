import type { Site } from "@torpor/build";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ElectronOptions } from "./types";

// The Electron main and preload scripts, copied verbatim from the adapter's
// dist into the site's dist/electron output
const RUNTIME_FILES = ["main.mjs", "preload.cjs"];

export default async function postbuild(site: Site, options: ElectronOptions): Promise<void> {
	const sourceFolder = path.dirname(fileURLToPath(import.meta.url));
	const outputFolder = path.join(site.root, "dist", "electron");

	await fs.mkdir(outputFolder, { recursive: true });
	for (const file of RUNTIME_FILES) {
		await fs.copyFile(path.join(sourceFolder, file), path.join(outputFolder, file));
	}

	const config = {
		host: options.host ?? "127.0.0.1",
		port: options.port ?? 0,
		partition: options.partition ?? "persist:torpor",
		window: options.window ?? {},
	};
	await fs.writeFile(path.join(outputFolder, "electron.json"), JSON.stringify(config, null, "\t"));

	// A minimal Electron app manifest. Run it with `electron dist/electron`
	// (see the adapter README for packaging with electron-builder/forge)
	const { name, version } = await sitePackage(site.root);
	await fs.writeFile(
		path.join(outputFolder, "package.json"),
		JSON.stringify(
			{
				name: `${name}-electron`,
				productName: name,
				version,
				private: true,
				type: "module",
				main: "main.mjs",
				scripts: { start: "electron ." },
			},
			null,
			"\t",
		),
	);
}

async function sitePackage(root: string): Promise<{ name: string; version: string }> {
	try {
		const pkg = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf-8"));
		const name = typeof pkg.name === "string" ? pkg.name.replace(/^@[^/]+\//, "") : "torpor-app";
		const version = typeof pkg.version === "string" ? pkg.version : "1.0.0";
		return { name, version };
	} catch {
		return { name: "torpor-app", version: "1.0.0" };
	}
}
