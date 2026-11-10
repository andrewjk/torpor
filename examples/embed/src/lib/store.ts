/**
 * The site's app store and embed plumbing. This is ordinary site code — the
 * storage (a folder of JSON), the compile/render calls, and the data policy
 * are all the owner's choices. @torpor/embed supplies only the primitives:
 * compileRestricted / renderRestricted / the data-source kinds.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AppManifest } from "@torpor/embed/app";
import {
	compileArtifact,
	createHttpSource,
	deriveRequirementKind,
	httpRequirementKind,
	renderArtifact,
	type EmbedArtifact,
	type ArtifactRenderResult,
} from "@torpor/embed/artifact";

const ROOT = process.cwd();
const APPS_DIR = path.join(ROOT, "apps");
const SEED_DIR = path.join(ROOT, "seed");

export interface StoredApp {
	id: string;
	name: string;
	/** The author's manifest: its source of truth alongside the .torp file */
	manifest: AppManifest;
	artifact: EmbedArtifact;
}

// #region Data policy (the trusted boundary)

export const policy = {
	http: createHttpSource({
		allowOrigins: ["https://en.wikipedia.org", "https://api.datamuse.com"],
		// Keyed APIs bind credentials here by name (`auth: "my-key"` in a
		// manifest); secrets stay in the host, never in an artifact:
		// credentials: { "my-key": { header: "key", value: process.env.API_KEY! } },
	}),
};

const requirementKinds = { http: httpRequirementKind, derive: deriveRequirementKind };

// #endregion

// #region Storage: a folder of JSON records

const apps = new Map<string, StoredApp>();

function loadApps(): void {
	if (!existsSync(APPS_DIR)) mkdirSync(APPS_DIR, { recursive: true });
	for (const file of readdirSync(APPS_DIR)) {
		if (!file.endsWith(".json")) continue;
		try {
			const app = JSON.parse(readFileSync(path.join(APPS_DIR, file), "utf8")) as StoredApp;
			apps.set(app.id, app);
		} catch (error) {
			console.error(`Skipping unreadable app "${file}":`, (error as Error).message);
		}
	}
}

function saveApp(app: StoredApp): void {
	apps.set(app.id, app);
	writeFileSync(path.join(APPS_DIR, `${app.id}.json`), JSON.stringify(app));
}

/** Compiles a submission at "publish" time and stores it */
export function deploy(manifest: AppManifest, source: string): StoredApp {
	const artifact = compileArtifact(manifest.id, source, {
		requirementKinds,
		data: manifest.data,
		api: manifest.api,
		emits: manifest.emits,
		pushes: manifest.pushes,
		maxSourceBytes: 256 * 1024,
	});
	const app: StoredApp = { id: manifest.id, name: artifact.name, manifest, artifact };
	saveApp(app);
	return app;
}

/** Seed apps: the same deploy path, from files the site owns */
export function ingestSeeds(): void {
	if (!existsSync(SEED_DIR)) return;
	for (const file of readdirSync(SEED_DIR)) {
		if (!file.endsWith(".torp")) continue;
		const metaPath = path.join(SEED_DIR, file.replace(/\.torp$/, ".json"));
		const manifest = JSON.parse(readFileSync(metaPath, "utf8")) as AppManifest;
		if (apps.has(manifest.id)) continue;
		try {
			deploy(manifest, readFileSync(path.join(SEED_DIR, file), "utf8"));
		} catch (error) {
			console.error(`Skipping seed "${file}":`, (error as Error).message);
		}
	}
}

// #endregion

// #region Reads and renders

export function listApps(): { id: string; name: string }[] {
	return [...apps.values()].map((app) => ({ id: app.id, name: app.name }));
}

export function getApp(id: string): StoredApp | undefined {
	return apps.get(id);
}

export function renderApp(
	app: StoredApp,
	props: Record<string, unknown> = app.manifest.props ?? {},
): Promise<ArtifactRenderResult> {
	return renderArtifact(app.artifact, { props, sources: policy });
}

loadApps();
ingestSeeds();

// #endregion
